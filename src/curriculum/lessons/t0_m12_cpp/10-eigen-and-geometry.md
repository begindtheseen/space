---
id: l10-eigen-and-geometry
title: Eigen, including the Geometry module
minutes: 26
covers:
  - Eigen, including the Geometry module
---

In Python you never wrote a loop to add two arrays. You typed `a + b`, and NumPy did the work. C++ has no built-in arrays that know math. In GNC code, the library that supplies them is almost always **Eigen** — a free C++ library for vectors, matrices and rotations.

Eigen is the NumPy of C++ flight code: the state vector, the covariance matrix and the attitude are Eigen objects in most C++ flight and simulation software. If you can write NumPy, Eigen will look familiar within an hour: `r.cross(v)`, `A.inverse()`, `q * v`. Its **Geometry module**, the part that handles rotations, gives you quaternions and rigid-body transforms.

Three things about Eigen are *not* like NumPy, and each one bites GNC engineers:

- Eigen has **fixed-size** types whose size is part of the type. A `Vector3d` is 24 bytes, with no heap memory at all. These, not the NumPy-like types, are what flight code uses.
- Eigen does its arithmetic **lazily**. That makes `a + b - c` one fast loop, and it makes `auto x = a + b;` a trap.
- The quaternion class takes its numbers in one order and stores them in another.

This lesson covers all three. It ends with the program the module's first exercise is built around: an RK4 orbit propagator on a fixed-size 6-vector that runs a whole orbit without touching the heap once.

## Getting Eigen into a build

Eigen is **[[header-only|header-only]]**: the whole library is text files that you `#include`, with nothing to link. `#include <Eigen/Dense>` brings in the matrix types, and `#include <Eigen/Geometry>` brings in the rotations. The compiler only needs to know the folder they live in. In CMake (next lesson) that is two lines:

```cmake
find_package(Eigen3 REQUIRED)
target_link_libraries(core PUBLIC Eigen3::Eigen)
```

Two compiler flags matter.

- **Optimization.** Eigen depends on the optimizer to squash its templates into tight loops. An unoptimized build is many times slower than `-O2`. Only ever time an optimized build.
- **`-DNDEBUG`.** Eigen checks things at run time with assertions — a coefficient index out of range, two matrices of different sizes added together. `-DNDEBUG` removes those checks. Keep them in test builds and remove them in the release build, the same as with `assert`.

## Fixed-size and dynamic-size types

Picture an egg carton: exactly twelve cups, molded in, so the shape tells you its size. Now picture a grocery bag. It holds any number of things, but you have to go get one first, and someone has to track how full it is.

Eigen has both. Every Eigen matrix is really one template, `Eigen::Matrix<Scalar, Rows, Cols>`. Read it as "a matrix of `Scalar` numbers with `Rows` rows and `Cols` columns".

- When `Rows` and `Cols` are numbers written in the code, the matrix is **fixed-size** — the egg carton. `Eigen::Vector3d` is `Matrix<double, 3, 1>`. `Eigen::Matrix3d` is `Matrix<double, 3, 3>`. A six-number state vector is one `using` line away. The numbers sit inside the object itself, so a local fixed-size matrix lives on the **[[stack|stack-vs-heap]]**.
- When a size is the special value `Eigen::Dynamic`, the matrix is **dynamic-size** — the grocery bag. `Eigen::VectorXd` and `Eigen::MatrixXd` are the common ones. Their numbers live on the heap, and making one allocates.

The `d` in the names means `double`; `Vector3f` holds `float`s.

::: key
Prefer Eigen fixed-size types (`Vector3d`, `Matrix3d`) in flight code: fixed-size objects are stack-allocated with dimensions known at compile time, so there is no heap traffic, loops can be unrolled and vectorised, and the sizes are checked at compile time rather than asserted at run time.
:::

"Unrolled and vectorized" means the compiler, knowing there are exactly three entries, writes out three additions instead of a loop, and may do several with one instruction. And adding a 3-vector to a 6-vector does not build at all, instead of crashing in flight.

::: example Fixed-size vectors and matrices
Here are the operations you will use every day, on a spacecraft 7,000 km from Earth's center.

```cpp
#include <Eigen/Dense>
#include <iostream>

using Vector6d = Eigen::Matrix<double, 6, 1>;      // fixed size: lives on the stack

int main() {
  Eigen::Vector3d r(7000.0e3, 0.0, 0.0);           // m
  Eigen::Vector3d v(0.0, 7.5e3, 1.0e3);            // m/s
  Eigen::Matrix3d A;
  A << 2.0, 0.0, 0.0,
       0.0, 3.0, 0.0,
       0.0, 0.0, 4.0;                              // comma initialiser, row by row

  Vector6d state;
  state << r, v;                                   // stack two 3-vectors into a 6-vector
  static_assert(Vector6d::SizeAtCompileTime == 6, "state must be a fixed-size 6-vector");

  const Eigen::Vector3d h = r.cross(v);            // specific angular momentum
  std::cout << "|r|   = " << r.norm() << " m\n";
  std::cout << "r.v   = " << r.dot(v) << "\n";
  std::cout << "h     = " << h.transpose() << "\n";
  std::cout << "r_hat = " << r.normalized().transpose() << "\n";
  std::cout << "state.head<3>() = " << state.head<3>().transpose() << "\n";
  std::cout << "state.tail<3>() = " << state.tail<3>().transpose() << "\n";

  const Eigen::Vector3d b(2.0, 6.0, 12.0);
  const Eigen::Vector3d x = A.ldlt().solve(b);     // solve A x = b for a symmetric A
  std::cout << "x     = " << x.transpose() << "   (A x - b norm " << (A * x - b).norm() << ")\n";
  std::cout << "A^-1 diag = " << A.inverse().diagonal().transpose() << "\n";
  std::cout << "A.block<2,2>(1,1) =\n" << A.block<2, 2>(1, 1) << "\n";
  std::cout << "elementwise square of b = " << b.array().square().transpose() << "\n";

  std::cout << "sizeof(Vector3d)  = " << sizeof(Eigen::Vector3d) << "\n";
  std::cout << "sizeof(Vector6d)  = " << sizeof(Vector6d) << "\n";
  std::cout << "sizeof(Matrix3d)  = " << sizeof(Eigen::Matrix3d) << "\n";
  std::cout << "sizeof(VectorXd)  = " << sizeof(Eigen::VectorXd) << "  (pointer + size; data on the heap)\n";
  return 0;
}
// Output:
// |r|   = 7e+06 m
// r.v   = 0
// h     =        0   -7e+09 5.25e+10
// r_hat = 1 0 0
// state.head<3>() = 7e+06     0     0
// state.tail<3>() =    0 7500 1000
// x     = 1 2 3   (A x - b norm 0)
// A^-1 diag =      0.5 0.333333     0.25
// A.block<2,2>(1,1) =
// 3 0
// 0 4
// elementwise square of b =   4  36 144
// sizeof(Vector3d)  = 24
// sizeof(Vector6d)  = 48
// sizeof(Matrix3d)  = 72
// sizeof(VectorXd)  = 16  (pointer + size; data on the heap)
```

Walk through it.

- **The comma initializer** `<<` fills a matrix row by row. It also stacks smaller pieces: `state << r, v` puts two 3-vectors end to end in a 6-vector.
- **`static_assert`** checks a fact while compiling. If someone changes `Vector6d` to a dynamic type, the build stops.
- **The cross product.** `r.cross(v)` gives $\mathbf{h} = \mathbf{r} \times \mathbf{v}$, the specific angular momentum. With $\mathbf{r}$ along $x$ and $\mathbf{v}$ in the $yz$ plane, the $y$ part is $-(7 \times 10^6)(1 \times 10^3) = -7 \times 10^9$ and the $z$ part is $(7 \times 10^6)(7.5 \times 10^3) = 5.25 \times 10^{10}$, both in $\mathrm{m^2/s}$. That matches the printout.
- **Parts of a matrix.** `head<3>()`, `tail<3>()`, `segment<3>(i)` and `block<2, 2>(row, col)` pick out pieces. Their sizes are in the angle brackets, known at compile time, so they avoid the heap too.
- **Solving $A\mathbf{x} = \mathbf{b}$.** Go through a decomposition object: `ldlt()` for symmetric matrices, `partialPivLu()` in general, `colPivHouseholderQr()` for least squares. Compute `inverse()` only when you need the inverse itself. Check: $2 \cdot 1 = 2$, $3 \cdot 2 = 6$, $4 \cdot 3 = 12$. The solution $(1, 2, 3)$ is right.
- **`.array()`** switches to element-by-element math, where `*` multiplies entry by entry and `square()`, `sqrt()`, `abs()` act on each number. $2^2 = 4$, $6^2 = 36$, $12^2 = 144$.

The `sizeof` lines are the point. A `Matrix3d` is nine doubles, $9 \times 8 = 72$ bytes, and nothing else. A `VectorXd` is 16 bytes no matter how long it is: a pointer and a length, with the numbers somewhere on the heap. Making one, or adding two, allocates.

Eigen stores matrices **[[column-major|column-major]]** by default, like Fortran and MATLAB and unlike NumPy. That matters only when you look at raw memory through a `Map` (below) or hand data to Python (lesson 14).
:::

## Expression templates and the `auto` trap

A recipe card for a cake is not a cake. It says what to do. You still have to bake it.

In Eigen, `a + b` is a recipe card. It adds nothing. It returns a small object — an **expression template** — that records "the sum of `a` and `b`" and holds references to both. The adding happens only when you assign the expression to a real matrix. At that moment Eigen writes one loop that computes the whole right-hand side, `a + b - c`, entry by entry, with no temporary vectors in between. That is why Eigen is fast.

It has one consequence you must learn by heart. A recipe card that says "use the eggs in the fridge" is useless once the fridge is empty. An expression that refers to `a` and `b` is useless — worse than useless — once `a` and `b` are gone.

::: key
`auto` is dangerous with Eigen expressions. Eigen returns lazily evaluated expression templates. `auto x = A + B;` stores the expression, not the result; if A or B goes out of scope you evaluate a dangling reference. Assign to a concrete type, or call `.eval()`.
:::

`auto` asks the compiler to pick the type for you. With Eigen, it picks the recipe card, not the cake.

::: example Lazy evaluation made visible
```cpp
#include <Eigen/Dense>
#include <iostream>

int main() {
  Eigen::Vector3d a(1.0, 2.0, 3.0);
  Eigen::Vector3d b(10.0, 20.0, 30.0);

  auto lazy = a + b;                 // an expression object that refers to a and b
  Eigen::Vector3d eager = a + b;     // evaluated now into a real vector

  a(0) = 100.0;                      // change an operand afterwards
  std::cout << "lazy(0)  = " << lazy(0) << "   (re-evaluated from the current a)\n";
  std::cout << "eager(0) = " << eager(0) << "\n";
  std::cout << "sizeof(lazy) = " << sizeof(lazy) << " bytes: two references, no numbers\n";

  Eigen::Vector3d fixed = (a + b).eval();   // .eval() forces evaluation of any expression
  std::cout << "fixed(0) = " << fixed(0) << "\n";

  // Aliasing: the right-hand side reads m while the left-hand side writes it.
  Eigen::Matrix2d m;
  m << 1, 2,
       3, 4;
  m = m.transpose();                 // wrong: element (0,1) is overwritten before it is read
  std::cout << "m = m.transpose() gives\n" << m << "\n";
  m << 1, 2,
       3, 4;
  m.transposeInPlace();              // right
  std::cout << "transposeInPlace gives\n" << m << "\n";
  return 0;
}
// $ g++ -std=c++20 -O2 -DNDEBUG -I/usr/include/eigen3 lazy.cpp -o lazy && ./lazy
// lazy(0)  = 110   (re-evaluated from the current a)
// eager(0) = 11
// sizeof(lazy) = 24 bytes: two references, no numbers
// fixed(0) = 110
// m = m.transpose() gives
// 1 2
// 2 4
// transposeInPlace gives
// 1 3
// 2 4
```

Start with the first three results. `eager` was computed on its line: $1 + 10 = 11$. Then `a(0)` changed to 100. Reading `lazy(0)` redoes the sum from the *current* `a`: $100 + 10 = 110$. `lazy` holds no numbers at all — its 24 bytes are two references and a little padding.

Here both operands were still alive, so the result is only surprising. Imagine a function that makes `lazy` from its own local variables and returns it. The locals are destroyed when the function ends. The caller then reads through a **[[dangling reference|dangling]]** — undefined behaviour, with no warning. The cure is to write a concrete type such as `Eigen::Vector3d` on the left of the `=`, or to add `.eval()` when you must keep `auto`.

The transpose shows a second face of laziness, called **aliasing** — the same matrix being read and written in one statement. `m = m.transpose()` writes into `m` while the expression is still reading from `m`. Eigen fills the destination column by column, so entry (1, 0) is written first: it gets the 2 from entry (0, 1). Next, entry (0, 1) copies entry (1, 0) — which now holds that 2, not the old 3. The result is a symmetric matrix that is nobody's transpose.

Eigen protects matrix *products* from this by computing them into a hidden temporary by default (`noalias()` turns that off when you know the destination is different). For everything else, use the in-place member (`transposeInPlace()`), or force a temporary with `.eval()`.
:::

::: warning
Eigen's run-time checks catch some of this, but not all. With assertions on (no `-DNDEBUG`), this exact `m = m.transpose()` stops the program with an "aliasing detected during transposition" message — which is why the example was built with `-DNDEBUG` to show the wrong answer. But no check can detect the `auto` trap, or most other aliasing, and a release build with `-DNDEBUG` has no checks at all. The real defense is the habit of writing the type.
:::

## The Geometry module

`#include <Eigen/Geometry>` gives you `Quaterniond`, `AngleAxisd`, rotation matrices as `Matrix3d`, and the rigid-transform classes `Isometry3d` and `Affine3d`. For attitude work the quaternion is the workhorse.

A quick reminder of what a quaternion is. Any rotation can be described as "turn by angle $\theta$ about a unit axis $\hat{\mathbf{n}}$". A **unit quaternion** stores that as four numbers: a **scalar part** $w = \cos(\theta/2)$ and a **vector part** $(x, y, z) = \sin(\theta/2)\,\hat{\mathbf{n}}$. Read $\theta/2$ as "theta over two" — the **[[half angle|half-angle]]** is not a typo. The four numbers always satisfy $w^2 + x^2 + y^2 + z^2 = 1$.

So a 90° turn about $z$ has $w = \cos 45^\circ \approx 0.707$ and $z = \sin 45^\circ \approx 0.707$, with $x = y = 0$. Keep those numbers in mind for the example.

Eigen's quaternion has two conventions you must learn before anything else.

::: key
Eigen's quaternion constructor takes the scalar first, `Eigen::Quaterniond(w, x, y, z)`, but `coeffs()` returns `[x, y, z, w]` with the scalar last. Reading raw memory as though it were scalar-first is a classic silent bug.
:::

::: key
`Eigen::Quaterniond::operator*` is the **[[Hamilton product|hamilton]]**, composing rotations: `q1 * q2` applies `q2` first, then `q1`. Against a `Vector3d` it applies the rotation to the vector. Eigen uses the Hamilton (not JPL) convention throughout.
:::

"Applies `q2` first" works like function notation in math: in $f(g(x))$, $g$ acts first even though $f$ is written first. The factor nearest the vector acts first.

::: example Quaternion conventions, and the memcpy bug
```cpp
#include <Eigen/Dense>
#include <Eigen/Geometry>
#include <cstring>
#include <iomanip>
#include <iostream>

int main() {
  std::cout << std::fixed << std::setprecision(3);
  const double half_pi = 1.57079632679489661923;
  // Constructor takes the scalar FIRST: Quaterniond(w, x, y, z).
  const Eigen::Quaterniond q_z90(Eigen::AngleAxisd(half_pi, Eigen::Vector3d::UnitZ()));
  const Eigen::Quaterniond q_x90(Eigen::AngleAxisd(half_pi, Eigen::Vector3d::UnitX()));

  std::cout << "q_z90: w = " << q_z90.w() << "  x = " << q_z90.x() << "  y = " << q_z90.y() << "  z = " << q_z90.z() << "\n";
  // coeffs() stores the scalar LAST: [x, y, z, w].
  std::cout << "q_z90.coeffs() = " << q_z90.coeffs().transpose() << "\n";

  const Eigen::Vector3d ex = Eigen::Vector3d::UnitX();
  const Eigen::Vector3d ey = Eigen::Vector3d::UnitY();
  std::cout << "q_z90 * ex = " << (q_z90 * ex).transpose() << "\n";       // rotate a vector
  std::cout << "q_x90 * ey = " << (q_x90 * ey).transpose() << "\n";

  // Hamilton product: (q1 * q2) * v applies q2 first, then q1.
  std::cout << "(q_z90 * q_x90) * ey = " << ((q_z90 * q_x90) * ey).transpose() << "\n";
  std::cout << "(q_x90 * q_z90) * ey = " << ((q_x90 * q_z90) * ey).transpose() << "\n";

  std::cout << "R(q_z90) =\n" << q_z90.toRotationMatrix() << "\n";
  std::cout << "q_z90.inverse() * (q_z90 * ex) = " << (q_z90.inverse() * (q_z90 * ex)).transpose() << "\n";

  // The classic bug: a scalar-first message copied straight into coeffs().
  const double from_message[4] = {q_z90.w(), q_z90.x(), q_z90.y(), q_z90.z()};   // [w, x, y, z] on the wire
  Eigen::Quaterniond wrong;
  std::memcpy(wrong.coeffs().data(), from_message, sizeof(from_message));        // lands as [x, y, z, w]
  const Eigen::Quaterniond right(from_message[0], from_message[1], from_message[2], from_message[3]);
  std::cout << "wrong.norm() = " << wrong.norm() << "  (still unit: no assertion fires)\n";
  std::cout << "wrong * ey = " << (wrong * ey).transpose() << "   right * ey = " << (right * ey).transpose() << "\n";

  Eigen::AngleAxisd back(wrong);
  std::cout << "wrong is a " << back.angle() * 180.0 / 3.14159265358979323846 << " deg rotation about " << back.axis().transpose() << "\n";
  return 0;
}
// Output:
// q_z90: w = 0.707  x = 0.000  y = 0.000  z = 0.707
// q_z90.coeffs() = 0.000 0.000 0.707 0.707
// q_z90 * ex = 0.000 1.000 0.000
// q_x90 * ey = 0.000 0.000 1.000
// (q_z90 * q_x90) * ey = -0.000  0.000  1.000
// (q_x90 * q_z90) * ey = -1.000  0.000  0.000
// R(q_z90) =
//  0.000 -1.000  0.000
//  1.000  0.000  0.000
//  0.000  0.000  1.000
// q_z90.inverse() * (q_z90 * ex) = 1.000 0.000 0.000
// wrong.norm() = 1.000  (still unit: no assertion fires)
// wrong * ey =  0.000 -0.000  1.000   right * ey = -1.000  0.000  0.000
// wrong is a 90.000 deg rotation about 1.000 0.000 0.000
```

Follow the outputs one at a time.

1. `q_z90` has $w = 0.707$ and $z = 0.707$, as predicted. `coeffs()` prints the same four numbers with the scalar *last*.
2. `q_z90 * ex` turns the $x$ axis onto the $y$ axis. That is an **active rotation**: the vector itself is turned.
3. The two compositions differ. `(q_z90 * q_x90) * ey` applies `q_x90` first, which takes $y$ to $z$. Then `q_z90` turns about $z$, which leaves $z$ alone. Result: $(0, 0, 1)$. The other order applies `q_z90` first, taking $y$ to $-x$. Then `q_x90` turns about $x$, which leaves $x$ alone. Result: $(-1, 0, 0)$. Order matters.
4. A `-0.000` is rounding noise around $10^{-16}$, printed with three decimals.

Now the bug. Four doubles arrive from a telemetry message in the natural scalar-first order $[w, x, y, z]$. `memcpy` copies them byte for byte into `coeffs().data()`, whose slots mean $[x, y, z, w]$. So the old $w$ lands in the $x$ slot, and the old $z$ lands in the $w$ slot. The result is $x = 0.707$, $w = 0.707$: a perfectly normalized quaternion — no assertion, no NaN — describing a 90° turn about the *x* axis. The vehicle would think it had rolled when it had yawed. The fix is the constructor, `Quaterniond(w, x, y, z)`, with each value named.
:::

### Two more conventions

**Hamilton versus JPL.** In Eigen's Hamilton product, $\mathbf{i}\mathbf{j} = \mathbf{k}$. Much of the spacecraft estimation literature, including many Kalman-filter references, uses the **[[JPL convention|jpl]]**, where $\mathbf{i}\mathbf{j} = -\mathbf{k}$ and products compose in the opposite order. A formula copied from a JPL-convention paper into Eigen code will be wrong in a way that is hard to spot. Check the convention of every source before you copy from it.

**Frames.** `q * v` rotates the vector `v`. Suppose `q` describes a body frame relative to the inertial frame — it takes body-frame coordinates to inertial coordinates. Then `q * v_body` gives the inertial components, and `q.inverse() * v_inertial` gives the body components. Name every quaternion by the **[[frames it connects|frame-chain]]**: `q_ib` for body-to-inertial. Then the order writes itself. `q_ib * (q_bs * v_s)` takes a sensor-frame vector into the body frame and then into the inertial frame. Neighboring letters match: the `b` at the end of `q_ib` meets the `b` at the front of `q_bs`.

Useful members:

- `toRotationMatrix()`, and the reverse, `Quaterniond(R)` from a rotation matrix;
- `AngleAxisd(q)` to recover the angle and axis;
- `normalize()` after many small updates, because rounding slowly drags the norm away from 1;
- `slerp(t, other)` to blend smoothly between two attitudes;
- `Quaterniond::FromTwoVectors(a, b)` for the rotation taking one direction onto another;
- `eulerAngles(2, 1, 0)` for yaw, pitch and roll — but its angles come back in ranges that make it fit only for display.

## Map and Ref: Eigen over someone else's memory

Sensor drivers hand you plain arrays of doubles, and Python hands you NumPy buffers. You do not want to copy them.

- **`Eigen::Map`** is a window: it makes existing memory look like an Eigen object, with no copy.
- **`Eigen::Ref`** is a parameter type. A function that takes `Ref` accepts a real vector, a block of a bigger vector or a `Map`, without copying and without having to become a template.

```cpp
#include <Eigen/Dense>
#include <iostream>

// Ref accepts any 3-vector-shaped Eigen object (a Vector3d, a block, a Map) without copying.
double along_track(const Eigen::Ref<const Eigen::Vector3d>& r,
                   const Eigen::Ref<const Eigen::Vector3d>& v) {
  return v.dot(r.normalized());
}

int main() {
  double imu_buffer[6] = {0.01, -0.02, 0.005, 9.81, 0.1, -0.2};  // as a driver might deliver it
  Eigen::Map<const Eigen::Vector3d> gyro(imu_buffer);             // view the first three, no copy
  Eigen::Map<const Eigen::Vector3d> accel(imu_buffer + 3);        // view the last three
  std::cout << "gyro  = " << gyro.transpose() << "\n";
  std::cout << "accel = " << accel.transpose() << "\n";

  imu_buffer[0] = 0.5;                                            // write the raw buffer...
  std::cout << "gyro after buffer write = " << gyro.transpose() << "\n";  // ...the Map sees it

  Eigen::Matrix<double, 6, 1> state;
  state << 7000e3, 100.0, 0.0, 10.0, 7500.0, 0.0;
  std::cout << "along-track speed = " << along_track(state.head<3>(), state.tail<3>()) << " m/s\n";
  return 0;
}
// Output:
// gyro  =  0.01 -0.02 0.005
// accel = 9.81  0.1 -0.2
// gyro after buffer write =   0.5 -0.02 0.005
// along-track speed = 10.1071 m/s
```

Writing to the raw buffer changed what `gyro` shows, because `gyro` owns nothing — it looks at `imu_buffer`. That also means a `Map` follows the rules of a reference: it must not outlive the memory it looks at. Its layout must match the memory too. Eigen assumes column-major; add the `Eigen::RowMajor` option when the buffer is row-major, as a NumPy array normally is.

Check the last number. The speed along the radius is $\mathbf{v} \cdot \hat{\mathbf{r}}$. The dot product is $10 \times 7000 \times 10^3 + 7500 \times 100 = 7.075 \times 10^7$. The length of $\mathbf{r}$ is $7000.0007 \times 10^3\,\mathrm{m}$. Dividing gives about $10.107\,\mathrm{m/s}$ — a hair more than the $10\,\mathrm{m/s}$ $x$-velocity, because $\mathbf{r}$ tilts slightly toward $y$.

## The propagator, allocation-free

Everything above meets the module's first exercise in one program. It uses the `rk4_step` template from lesson 5, a fixed-size 6-vector state, two-body gravity, and the allocation counter from lesson 9, which proves that the loop never touches the heap.

::: example One orbit of RK4 on a fixed-size state
The state is $\mathbf{x} = [\mathbf{r}; \mathbf{v}]$, position stacked on velocity. Its rate of change is $\dot{\mathbf{x}} = [\mathbf{v}; -\mu\mathbf{r}/|\mathbf{r}|^3]$, where $\mu = 3.986 \times 10^{14}\,\mathrm{m^3/s^2}$ is Earth's gravitational parameter. We start on a circular orbit 400 km up and step once a second for one full period.

```cpp
#include <Eigen/Dense>
#include <cstdio>
#include <cmath>
#include <cstdlib>
#include <new>

static int g_allocations = 0;
void* operator new(std::size_t n) { ++g_allocations; void* p = std::malloc(n ? n : 1); if (!p) std::abort(); return p; }
void operator delete(void* p) noexcept { std::free(p); }
void operator delete(void* p, std::size_t) noexcept { std::free(p); }

using Vector6d = Eigen::Matrix<double, 6, 1>;
static_assert(Vector6d::SizeAtCompileTime == 6, "state must be fixed size");

constexpr double kMu = 3.986004418e14;   // m^3/s^2

// Two-body dynamics: x = [r; v], dx/dt = [v; -mu r / |r|^3].
Vector6d two_body(double /*t*/, const Vector6d& x) {
  const Eigen::Vector3d r = x.head<3>();
  const double r3 = std::pow(r.norm(), 3);
  Vector6d dx;
  dx << x.tail<3>(), -kMu / r3 * r;
  return dx;
}

template <typename State, typename Deriv>
State rk4_step(const State& x, double t, double dt, Deriv&& f) {
  const State k1 = f(t, x);
  const State k2 = f(t + 0.5 * dt, x + (0.5 * dt) * k1);
  const State k3 = f(t + 0.5 * dt, x + (0.5 * dt) * k2);
  const State k4 = f(t + dt, x + dt * k3);
  return x + (dt / 6.0) * (k1 + 2.0 * k2 + 2.0 * k3 + k4);
}

double specific_energy(const Vector6d& x) {
  return 0.5 * x.tail<3>().squaredNorm() - kMu / x.head<3>().norm();
}

int main() {
  const double r0 = 6378.137e3 + 400.0e3;
  const double v0 = std::sqrt(kMu / r0);
  const double period = 2.0 * 3.14159265358979323846 * std::sqrt(r0 * r0 * r0 / kMu);
  Vector6d x;
  x << r0, 0.0, 0.0, 0.0, v0, 0.0;
  const Vector6d x0 = x;
  const double e0 = specific_energy(x);

  const int steps = 5554;                      // ~one period at dt = 1 s
  const double dt = period / steps;
  g_allocations = 0;
  double t = 0.0;
  for (int i = 0; i < steps; ++i) { x = rk4_step(x, t, dt, two_body); t += dt; }
  const int loop_allocations = g_allocations;

  std::printf("period %.1f s, %d steps of dt = %.4f s\n", period, steps, dt);
  std::printf("position error after one orbit: %.3e m\n", (x.head<3>() - x0.head<3>()).norm());
  std::printf("velocity error after one orbit: %.3e m/s\n", (x.tail<3>() - x0.tail<3>()).norm());
  std::printf("relative energy drift: %.3e\n", (specific_energy(x) - e0) / std::fabs(e0));
  std::printf("heap allocations inside the loop: %d\n", loop_allocations);
  return 0;
}
// Output:
// period 5553.6 s, 5554 steps of dt = 0.9999 s
// position error after one orbit: 1.810e-06 m
// velocity error after one orbit: 1.989e-09 m/s
// relative energy drift: 1.140e-15
// heap allocations inside the loop: 0
```

Read the results.

- **The period** is $2\pi\sqrt{r^3/\mu} = 5553.6\,\mathrm{s}$, about 92.6 minutes — the familiar time for a trip around Earth in low orbit. Dividing it into 5,554 steps makes each step a little under one second.
- **Position error.** After a full orbit the spacecraft is back within $1.8\,\mathrm{\mu m}$ (millionths of a meter) of where it started, after traveling about 42,600 km.
- **Energy drift.** The **[[specific energy|specific-energy]]** changed by about one part in $10^{15}$. That is the size of double-precision rounding, so RK4 at one-second steps adds essentially nothing on top.
- **Zero allocations.** Five and a half thousand steps, four dynamics calls each, and not one trip to the heap. That is the exercise's requirement, made measurable.

Why no heap? `two_body` takes the state by `const` reference and returns a `Vector6d` by value — 48 bytes on the stack. `x.head<3>()` is a block expression, which `const Eigen::Vector3d r =` evaluates at once into a real vector. The RK4 template is stamped out for exactly `Vector6d` and `two_body`, so every stage can be inlined.

The exercise adds a CMake library, a GoogleTest binary checking energy conservation and agreement with your Python propagator to $10^{-10}$, and a speed race against NumPy.
:::

## Check yourself

::: check
What are `sizeof(Eigen::Matrix<double, 6, 6>)` and `sizeof(Eigen::MatrixXd)`, and where in memory does each object's numbers live?
:::

::: answer
The fixed-size $6 \times 6$ matrix holds its 36 doubles inside itself, so `sizeof` is $36 \times 8 = 288$ bytes. The numbers live wherever the object lives: on the stack for a local variable, inside the enclosing object for a member.

`MatrixXd` holds only a pointer and its row and column counts, so `sizeof` is 24 bytes (a `VectorXd` needs one count and is 16). Its numbers live on the heap, allocated when the matrix is created or resized. That allocation is why dynamic-size types stay out of the control loop.
:::

::: check
A function computes `auto y = A * x;`, then changes `x`, then writes `Eigen::Vector3d z = y;`. What does `z` hold, and what would make the code do what its author expected?
:::

::: answer
`y` is a product expression that refers to `A` and `x`. It is not the product. So `z` is computed at the moment of assignment, from the *changed* `x`. The author expected the product with the original `x`.

Writing `Eigen::Vector3d y = A * x;` computes the product on that line into a real vector, so later changes to `x` cannot affect it. `auto y = (A * x).eval();` does the same if `auto` must stay.
:::

::: check
A telemetry link delivers attitude as four doubles in the order $[w, x, y, z]$. Show the correct way to build the `Quaterniond`, and explain what the tempting `memcpy` into `coeffs().data()` would produce.
:::

::: answer
Name the components: `Eigen::Quaterniond q(msg[0], msg[1], msg[2], msg[3]);`. The constructor takes the scalar first, matching the message.

The `memcpy` copies $[w, x, y, z]$ into storage laid out as $[x, y, z, w]$. The scalar becomes the $x$ component, and the $z$ component becomes the scalar. The result still has unit norm, so no check fires. But for a pure yaw it describes a roll of the same angle — in the example, a 90° turn about $z$ arrived as a 90° turn about $x$.
:::

::: check
A star tracker reports a vector `v_s` in its own frame. `q_bs` rotates sensor-frame coordinates into the body frame, and `q_ib` rotates body-frame coordinates into the inertial frame. Write the inertial vector, and the single quaternion that does the same job.
:::

::: answer
Apply sensor-to-body first, then body-to-inertial: `v_i = q_ib * (q_bs * v_s)`.

In Eigen's product the right-hand factor acts first, so the single quaternion is `q_is = q_ib * q_bs`, and `q_is * v_s` gives the same `v_i`. The letters line up: `i` from `b`, then `b` from `s`, gives `i` from `s`.

Writing `q_bs * q_ib` would apply the body-to-inertial rotation to sensor-frame coordinates. That is meaningless, and it is not a compile error — which is why naming quaternions by their frames matters.
:::

::: check
Inside `two_body`, `const Eigen::Vector3d r = x.head<3>();` is fine. Why would `auto r = x.head<3>(); return r;` in a helper function that received `x` by value be a bug?
:::

::: answer
`x.head<3>()` is a block expression that points into the storage of `x`. With `const Eigen::Vector3d r =`, the block is copied into a fresh 3-vector that owns its numbers.

With `auto`, `r` *is* the block, still pointing into `x`. A by-value parameter `x` is destroyed when the helper returns, so the caller gets a view of dead stack memory. Returning `Eigen::Vector3d` by value, or writing `x.head<3>().eval()`, makes the result own its data.
:::

## Summary

| Item | Meaning |
| --- | --- |
| `Eigen::Matrix<double, R, C>` | the type behind `Vector3d`, `Matrix3d` and a `Vector6d` alias; fixed sizes live on the stack |
| `VectorXd`, `MatrixXd` | dynamic sizes; heap storage; tooling only, not the control loop |
| `SizeAtCompileTime` | compile-time size; `static_assert` it to forbid dynamic types |
| `<<` comma initializer | fills row by row; also stacks vectors |
| `head<3>()`, `tail<3>()`, `segment<3>(i)`, `block<R,C>(i,j)` | compile-time-sized views of parts of a matrix |
| `dot`, `cross`, `norm`, `normalized`, `transpose`, `inverse` | the everyday vector and matrix operations |
| `A.ldlt().solve(b)` | solve through a decomposition, not through `inverse()` |
| `.array()` | element-by-element math |
| expression templates | `a + b` is a lazy recipe holding references; assign to a concrete type or `.eval()` |
| aliasing | `m = m.transpose()` is wrong; use `transposeInPlace()`; products are protected by default |
| unit quaternion | $w = \cos(\theta/2)$, $(x, y, z) = \sin(\theta/2)\,\hat{\mathbf{n}}$ |
| `Quaterniond(w, x, y, z)` / `coeffs()` = `[x, y, z, w]` | scalar first in the constructor, last in storage |
| `q1 * q2`, `q * v` | Hamilton product, `q2` applied first; active rotation of a vector |
| `Map`, `Ref` | view raw memory as Eigen; accept any vector-shaped argument without copying |
| `-O2`, `-DNDEBUG` | Eigen needs the optimizer; `NDEBUG` removes its run-time checks |

The next lesson gives this code a proper build: a CMake library, a GoogleTest binary that checks the energy drift and the allocation count, and a `ctest` run that a build server can execute on every change.

::: context header-only A library with nothing to link
Most libraries come in two parts: header files that *describe* the functions, and a compiled file of machine code that you link into your program. Eigen has only the first part. Because everything in it is a template, the compiler cannot produce machine code until it knows your types — `Matrix<double, 6, 1>` rather than "some matrix". So the whole library is shipped as source text, and your compiler builds exactly the pieces you use. The price is longer compile times; the prize is code tailored to your sizes.
:::

::: context stack-vs-heap Inside the object, or somewhere else
The **stack** is the scratch space a function gets automatically when it is called and gives back when it returns — fast, and free of any bookkeeping. The **heap** is memory you request and return by hand, through an allocator whose time nobody can bound. A `Vector3d` keeps its three numbers inside itself. A `VectorXd` keeps a pointer and a length, and its numbers live in a heap block that had to be allocated.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="20" y="18" font-size="12" font-weight="700" fill="#1f2a44">Vector3d (24 bytes)</text>
  <rect x="20" y="28" width="50" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="70" y="28" width="50" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="120" y="28" width="50" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="45" y="48" font-size="12" text-anchor="middle" fill="#1f2a44">x</text>
  <text x="95" y="48" font-size="12" text-anchor="middle" fill="#1f2a44">y</text>
  <text x="145" y="48" font-size="12" text-anchor="middle" fill="#1f2a44">z</text>
  <text x="190" y="48" font-size="11" fill="#6c7a93">all on the stack</text>
  <text x="20" y="92" font-size="12" font-weight="700" fill="#1f2a44">VectorXd (16 bytes)</text>
  <rect x="20" y="102" width="60" height="30" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="80" y="102" width="60" height="30" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="50" y="122" font-size="12" text-anchor="middle" fill="#1f2a44">pointer</text>
  <text x="110" y="122" font-size="12" text-anchor="middle" fill="#1f2a44">size n</text>
  <line x1="50" y1="132" x2="50" y2="152" stroke="#b4232c" stroke-width="2"/>
  <line x1="50" y1="152" x2="196" y2="152" stroke="#b4232c" stroke-width="2"/>
  <polygon points="204,152 194,147 194,157" fill="#b4232c"/>
  <rect x="206" y="138" width="40" height="28" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="246" y="138" width="40" height="28" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="286" y="138" width="40" height="28" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="336" y="157" font-size="12" fill="#1f2a44">…</text>
  <text x="266" y="130" font-size="11" text-anchor="middle" fill="#6c7a93">numbers on the heap</text>
</svg>
```
:::

::: context column-major Which way memory runs
Memory is one long row of slots, so a grid of numbers has to be laid out somehow. **Column-major** order, Eigen's default, stores the first column top to bottom, then the second column, then the third. NumPy's default, **row-major**, stores row after row. The numbers below show the order each entry of a $3 \times 3$ matrix sits in Eigen's memory.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5" fill="#fff">
    <rect x="40" y="20" width="36" height="36"/><rect x="76" y="20" width="36" height="36"/><rect x="112" y="20" width="36" height="36"/>
    <rect x="40" y="56" width="36" height="36"/><rect x="76" y="56" width="36" height="36"/><rect x="112" y="56" width="36" height="36"/>
    <rect x="40" y="92" width="36" height="36"/><rect x="76" y="92" width="36" height="36"/><rect x="112" y="92" width="36" height="36"/>
  </g>
  <g font-size="13" text-anchor="middle" fill="#1f2a44">
    <text x="58" y="43">0</text><text x="94" y="43">3</text><text x="130" y="43">6</text>
    <text x="58" y="79">1</text><text x="94" y="79">4</text><text x="130" y="79">7</text>
    <text x="58" y="115">2</text><text x="94" y="115">5</text><text x="130" y="115">8</text>
  </g>
  <line x1="58" y1="26" x2="58" y2="122" stroke="#1d6fd1" stroke-width="2" opacity="0.5"/>
  <line x1="94" y1="26" x2="94" y2="122" stroke="#1d6fd1" stroke-width="2" opacity="0.5"/>
  <line x1="130" y1="26" x2="130" y2="122" stroke="#1d6fd1" stroke-width="2" opacity="0.5"/>
  <text x="94" y="145" font-size="11" text-anchor="middle" fill="#1d6fd1">memory runs down each column</text>
  <text x="180" y="50" font-size="12" fill="#1f2a44">Eigen: column-major</text>
  <text x="180" y="72" font-size="12" fill="#1f2a44">NumPy: row-major</text>
  <text x="180" y="94" font-size="12" fill="#1f2a44">(0, 1, 2 across the top row)</text>
</svg>
```

Most of the time you never notice. It matters when two programs share the same raw memory and each assumes a different order: the matrix arrives transposed.
:::

::: context dangling A reference to something that is gone
A reference is a second name for an object that lives somewhere else. When that object is destroyed — a local variable when its function returns, a vector's old buffer when it grows — the reference still points at the same spot in memory, but nothing valid is there any more. Programmers call it **dangling**, like a rope whose far end has come untied. Reading through it is undefined behaviour: it may print the old value, a random value, or crash. Lesson 12 is about exactly this kind of bug and the tools that catch it.
:::

::: context half-angle Why the angle is halved
A quaternion rotates a vector by being multiplied on both sides of it, $q\,v\,q^{-1}$. Each side contributes half of the turn, so each has to carry $\theta/2$. A side effect: $q$ and $-q$ describe the same rotation, because turning by $\theta$ about $\hat{\mathbf{n}}$ is the same as turning by $\theta + 360^\circ$, and that adds $180^\circ$ to the half angle, flipping every sign. Attitude software often picks the one with $w \ge 0$ so that two equal attitudes compare equal.
:::

::: context hamilton A formula carved into a bridge
William Rowan Hamilton, an Irish mathematician, spent years looking for a way to multiply points in three dimensions the way complex numbers multiply points in a plane. In October 1843, walking along the Royal Canal in Dublin, he realized he needed *four* numbers, and scratched the rule $i^2 = j^2 = k^2 = ijk = -1$ into the stone of Broom Bridge. A plaque marks the spot today. From that rule, $ij = k$ — the Hamilton convention Eigen follows.
:::

::: context jpl Why there are two conventions
From the late 1970s on, NASA's Jet Propulsion Laboratory and much of the spacecraft-attitude community used a quaternion product with the order flipped, because it matched the way they wrote attitude matrices — as frame-to-frame changes of coordinates rather than as turns of a vector. That choice, now called the JPL convention, spread through a lot of navigation and Kalman-filter writing, including widely read technical reports on attitude estimation. Robotics, computer graphics and libraries such as Eigen use Hamilton's original. Neither is wrong, but mixing them silently reverses the order of rotations — and a reversed rotation can look almost right on small angles.
:::

::: context frame-chain Letting the frame names do the checking
Write each quaternion as `q_ab`: it takes coordinates in frame `b` to frame `a`. A chain is correct when the inner letters touch, like dominoes: `q_ib * q_bs` has `b` meeting `b`, and the result is `q_is`.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="14" y="36" width="80" height="34" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="140" y="36" width="80" height="34" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="266" y="36" width="80" height="34" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="54" y="58" font-size="12" text-anchor="middle" fill="#1f2a44">sensor s</text>
  <text x="180" y="58" font-size="12" text-anchor="middle" fill="#1f2a44">body b</text>
  <text x="306" y="58" font-size="12" text-anchor="middle" fill="#1f2a44">inertial i</text>
  <line x1="94" y1="53" x2="132" y2="53" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="140,53 130,48 130,58" fill="#1d6fd1"/>
  <line x1="220" y1="53" x2="258" y2="53" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="266,53 256,48 256,58" fill="#1d6fd1"/>
  <text x="117" y="30" font-size="12" text-anchor="middle" fill="#1d6fd1">q_bs</text>
  <text x="243" y="30" font-size="12" text-anchor="middle" fill="#1d6fd1">q_ib</text>
  <path d="M54,70 Q180,112 306,70" fill="none" stroke="#b4232c" stroke-width="2"/>
  <polygon points="306,70 294,72 300,81" fill="#b4232c"/>
  <text x="180" y="104" font-size="12" text-anchor="middle" fill="#b4232c">q_is = q_ib * q_bs</text>
</svg>
```
:::

::: context specific-energy Why energy is the test of an integrator
"Specific" means "per kilogram". A satellite's specific orbital energy is its kinetic energy per kilogram, $v^2/2$, plus its gravitational potential energy per kilogram, $-\mu/r$. With no drag or thrust, physics says this sum never changes. For the 400 km orbit here it is about $-29.4\,\mathrm{MJ/kg}$ (negative means bound to Earth). A numerical integrator does not know that rule, so if its errors pile up the energy drifts. Watching the drift is the cheapest way to see whether a propagator is trustworthy, which is why the exercise tests it.
:::
