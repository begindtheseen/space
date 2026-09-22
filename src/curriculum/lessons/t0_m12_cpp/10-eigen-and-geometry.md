---
id: l10-eigen-and-geometry
title: Eigen, including the Geometry module
minutes: 24
covers:
  - Eigen, including the Geometry module
---

Eigen is the NumPy of C++ GNC. It is a header-only template library for vectors, matrices, decompositions and — in its Geometry module — quaternions, angle-axis rotations and rigid transforms, and it is what the state vector, the covariance and the attitude are made of in most flight and simulation code written in C++. If you can write NumPy, the arithmetic will look familiar within an hour: `r.cross(v)`, `A.inverse()`, `q * v`.

Three things are unlike NumPy, and each of them bites GNC engineers specifically. First, Eigen has *fixed-size* types whose dimensions are part of the type — a `Vector3d` is 24 bytes on the stack, with no heap and no run-time size — and these, not the NumPy-like dynamic types, are what flight code uses. Second, Eigen evaluates arithmetic *lazily* through expression templates, which makes `a + b - c` a single fused loop and makes `auto x = a + b;` a dangling reference waiting to happen. Third, the quaternion class has a constructor argument order that differs from its storage order, and a product convention that you must know before composing two rotations.

This lesson covers the types, the trap, and the Geometry module, and ends with the piece of code the module's first exercise is built around: an allocation-free RK4 two-body propagator on a fixed-size 6-vector, with its energy conservation and its zero heap allocations demonstrated.

## Getting Eigen into a build

Eigen is headers only, so there is nothing to link: including `Eigen/Dense` brings in the matrix types and `Eigen/Geometry` the rotations, and the compiler needs the include path. In CMake (lesson 11) that is `find_package(Eigen3 REQUIRED)` and `target_link_libraries(core PUBLIC Eigen3::Eigen)`. Two flags matter. Eigen relies on the optimiser to collapse its templates, so an unoptimised build is many times slower than `-O2` — benchmark only optimised builds. And `-DNDEBUG` removes Eigen's run-time assertions, which check coefficient indices and dynamic-size compatibility; keep them on in tests and off in the release build, exactly as with `assert`.

## Fixed-size and dynamic-size types

Every Eigen matrix is an instance of `Eigen::Matrix<Scalar, Rows, Cols>`. When `Rows` and `Cols` are compile-time constants the object is *fixed-size*: `Eigen::Vector3d` is `Matrix<double, 3, 1>`, `Eigen::Matrix3d` is `Matrix<double, 3, 3>`, and a six-state vector is one `using` declaration away. When either dimension is the sentinel `Eigen::Dynamic` the object is *dynamic-size* — `Eigen::VectorXd`, `Eigen::MatrixXd` — and its storage lives on the heap.

::: key
Prefer Eigen fixed-size types (`Vector3d`, `Matrix3d`) in flight code: fixed-size objects are stack-allocated with dimensions known at compile time, so there is no heap traffic, loops can be unrolled and vectorised, and the sizes are checked at compile time rather than asserted at run time.
:::

::: example Fixed-size vectors and matrices
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

The comma initialiser `<<` fills a matrix row by row, and it also stacks smaller objects — two 3-vectors into a 6-vector. `head<3>()`, `tail<3>()`, `segment<3>(i)` and `block<2, 2>(row, col)` address parts of a matrix with compile-time sizes, so they too avoid the heap. `r.cross(v)` gives $\mathbf{h} = \mathbf{r} \times \mathbf{v}$: with $\mathbf{r}$ along $x$ and $\mathbf{v}$ in the $yz$ plane, $\mathbf{h} = (0, -7 \times 10^6 \times 10^3, 7 \times 10^6 \times 7.5 \times 10^3) = (0, -7 \times 10^9, 5.25 \times 10^{10})\,\mathrm{m^2/s}$. Solving a linear system goes through a decomposition object — `ldlt()` for symmetric matrices, `partialPivLu()` in general, `colPivHouseholderQr()` for least squares — rather than through `inverse()`, which you compute only when you need the inverse itself. `.array()` switches to element-wise semantics, where `*` multiplies element by element and `square()`, `sqrt()`, `abs()` apply to each coefficient.

The `sizeof` lines are the point of the fixed-size types. A `Matrix3d` is nine doubles and nothing else; a `VectorXd` is a pointer and a size whose data lives on the heap, so constructing one, or adding two, allocates. Eigen stores matrices column-major by default, as Fortran and MATLAB do and NumPy does not, which matters only when you view raw memory through a `Map` or hand data to Python (lesson 14).
:::

## Expression templates and the `auto` trap

`a + b` in Eigen does not add anything. It returns a small object — an *expression template* — that records "the sum of `a` and `b`" and holds references to both. The addition happens when the expression is assigned to a real matrix, at which point Eigen generates one loop that computes the whole right-hand side, `a + b - c`, coefficient by coefficient with no temporaries. That is why Eigen is fast, and it has one consequence you must internalise.

::: key
`auto` is dangerous with Eigen expressions. Eigen returns lazily evaluated expression templates. `auto x = A + B;` stores the expression, not the result; if A or B goes out of scope you evaluate a dangling reference. Assign to a concrete type, or call `.eval()`.
:::

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
// Output:
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

`lazy` holds no numbers — 24 bytes is two references and a little bookkeeping — so reading `lazy(0)` after `a` changed recomputes the sum from the current `a`. Here both operands were alive and the result is merely surprising. Return `lazy` from a function whose locals `a` and `b` are destroyed on exit, and reading it is undefined behaviour with no diagnostic. The cure is to name a concrete type, `Eigen::Vector3d`, on the left of the `=`, or to append `.eval()` when you must use `auto`.

The transpose shows the second face of laziness, *aliasing*. `m = m.transpose()` writes into `m` while the expression is still reading from it: coefficient (0, 1) is overwritten with 3 before (1, 0) has been read, so the result is a symmetric matrix that is nobody's transpose. Eigen protects matrix *products* from this by evaluating them into a temporary by default (`noalias()` opts out when you know the destination is distinct); for everything else, use the in-place member (`transposeInPlace()`) or force a temporary with `.eval()`.
:::

::: warning
Debug builds of Eigen assert on many mistakes — a size mismatch between dynamic matrices, an out-of-range coefficient — but they cannot detect the `auto` trap or transpose aliasing, and `-DNDEBUG` removes even the checks they do have. Neither problem produces a diagnostic in a release build; the defence is the habit of writing the type.
:::

## The Geometry module

`Eigen/Geometry` supplies `Quaterniond`, `AngleAxisd`, rotation matrices through `Matrix3d`, and the rigid-transform classes `Isometry3d` and `Affine3d`. For attitude work the quaternion is the workhorse, and it has two conventions to learn before anything else.

::: key
Eigen's quaternion constructor takes the scalar first, `Eigen::Quaterniond(w, x, y, z)`, but `coeffs()` returns `[x, y, z, w]` with the scalar last. Reading raw memory as though it were scalar-first is a classic silent bug.
:::

::: key
`Eigen::Quaterniond::operator*` is the Hamilton product, composing rotations: `q1 * q2` applies `q2` first, then `q1`. Against a `Vector3d` it applies the rotation to the vector. Eigen uses the Hamilton (not JPL) convention throughout.
:::

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

Follow the outputs. A 90° rotation about $z$ has $w = \cos 45^\circ = 0.707$ and $z = \sin 45^\circ = 0.707$; `coeffs()` prints those same numbers with the scalar *last*. `q_z90 * ex` rotates the $x$ axis onto $y$, an active rotation of the vector. The two compositions differ: `(q_z90 * q_x90) * ey` applies `q_x90` first — $y \to z$ — and then `q_z90`, which leaves $z$ alone, giving $(0, 0, 1)$; the other order applies `q_z90` first — $y \to -x$ — and then `q_x90`, which leaves $x$ alone, giving $(-1, 0, 0)$. A `-0.000` in the output is floating-point noise of order $10^{-16}$ printed at three decimals.

Then the bug. Four doubles arrive from a message in the natural scalar-first order. `memcpy` into `coeffs().data()` lands them in Eigen's scalar-last slots, so $w$ becomes $x$ and $z$ becomes $w$: the result is a perfectly normalised quaternion — no assertion, no NaN — describing a 90° rotation about the *x* axis. The vehicle would believe itself rolled when it had yawed. The correct construction is the constructor, `Quaterniond(w, x, y, z)`, with the four values named.
:::

Two more conventions. First, Eigen's product is the Hamilton product, in which $\mathbf{i}\mathbf{j} = \mathbf{k}$. A large part of the aerospace estimation literature, including many Kalman-filter references, uses the JPL convention, in which $\mathbf{i}\mathbf{j} = -\mathbf{k}$ and products compose in the opposite order. A formula copied from a JPL-convention paper into Eigen code will be wrong in a way that is hard to spot; check the convention of every source before you transcribe it. Second, `q * v` is an *active* rotation of the vector `v`. If `q` represents the attitude of a body frame relative to an inertial one — the rotation that takes body-frame coordinates to inertial coordinates — then `q * v_body` gives the inertial components, and `q.inverse() * v_inertial` gives the body components. Name your quaternions by the frames they connect, `q_ib` for body-to-inertial, and the product order writes itself: `q_ib * (q_bs * v_s)` takes a sensor-frame vector through the body frame to inertial.

Useful members: `toRotationMatrix()` and the reverse constructor `Quaterniond(R)`; `AngleAxisd(q)` to recover angle and axis; `normalize()` after accumulating small rotations, since numerical drift takes the norm off unity; `slerp(t, other)` for interpolation; `Quaterniond::FromTwoVectors(a, b)` for the rotation taking one direction to another; and `eulerAngles(2, 1, 0)` for a yaw-pitch-roll decomposition, whose angles come back in ranges that make it unsuitable for anything except display.

## Map and Ref: Eigen over someone else's memory

Sensor drivers deliver arrays of doubles, and Python delivers NumPy buffers. `Eigen::Map` views such memory as an Eigen object without copying it; `Eigen::Ref` is the parameter type that lets a function accept a vector, a block of a larger vector or a `Map` without becoming a template.

```cpp
// Ref accepts any 3-vector-shaped Eigen object (a Vector3d, a block, a Map) without copying.
double along_track(const Eigen::Ref<const Eigen::Vector3d>& r, const Eigen::Ref<const Eigen::Vector3d>& v) {
  return v.dot(r.normalized());
}

double imu_buffer[6] = {0.01, -0.02, 0.005, 9.81, 0.1, -0.2};   // as a driver might deliver it
Eigen::Map<const Eigen::Vector3d> gyro(imu_buffer);              // view the first three, no copy
Eigen::Map<const Eigen::Vector3d> accel(imu_buffer + 3);
imu_buffer[0] = 0.5;                                              // the Map sees the change

Eigen::Matrix<double, 6, 1> state;
state << 7000e3, 100.0, 0.0, 10.0, 7500.0, 0.0;
along_track(state.head<3>(), state.tail<3>());                    // 10.1071 m/s, no copies
// Output:
// gyro  =  0.01 -0.02 0.005
// accel = 9.81  0.1 -0.2
// gyro after buffer write =   0.5 -0.02 0.005
// along-track speed = 10.1071 m/s
```

A `Map` is a view with the lifetime rules of a reference, and its layout must match the memory — column-major by default, `Eigen::RowMajor` as a template option when the buffer is row-major, as a NumPy array normally is. The along-track speed is $\mathbf{v} \cdot \hat{\mathbf{r}} = (10 \times 7000 + 7500 \times 100) / 7000.0007 \times 10^{3}$, about $10.107\,\mathrm{m/s}$.

## The propagator, allocation-free

Everything above meets the module's first exercise in one program: the RK4 step template from lesson 5, a fixed-size 6-vector state, two-body gravity, and the allocation counter from lesson 9 proving that the loop never touches the heap.

::: example One orbit of RK4 on a fixed-size state
```cpp
#include <Eigen/Dense>
#include <cstdio>
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

After a full 92.6-minute orbit in one-second steps, the state returns to within $1.8\,\mathrm{\mu m}$ of its start and the specific energy has drifted by one part in $10^{15}$ — the level of double-precision rounding. `two_body` takes the state by `const` reference and returns a `Vector6d` by value, `x.head<3>()` is a block expression that `const Eigen::Vector3d r =` evaluates immediately, and the RK4 template instantiates for the exact pair of `Vector6d` and the function `two_body`, so every stage inlines. The last line is the exercise's requirement made measurable: five and a half thousand steps, zero allocations. The exercise adds a CMake library, a GoogleTest binary that asserts the energy conservation and agreement with your Python propagator to $10^{-10}$, a `static_assert` on the state size, and the benchmark against NumPy.
:::

## Check yourself

::: check
What are `sizeof(Eigen::Matrix<double, 6, 6>)` and `sizeof(Eigen::MatrixXd)`, and where in memory does each object's data live?
:::

::: answer
The fixed-size $6 \times 6$ matrix holds 36 doubles inline, so `sizeof` is $36 \times 8 = 288$ bytes, and the data lives wherever the object does — on the stack for a local, inside the enclosing object for a member. `MatrixXd` holds a pointer to heap storage plus its row and column counts, so `sizeof` is 24 bytes (16 on some implementations for a vector), and the coefficients live on the heap, allocated when the matrix is constructed or resized. That allocation is why dynamic-size types stay out of the control loop.
:::

::: check
A function computes `auto y = A * x;`, then modifies `x`, then writes `Eigen::Vector3d z = y;`. What does `z` hold, and what would make the code do what its author expected?
:::

::: answer
`y` is a product expression referring to `A` and `x`, not the product itself, so `z` is computed from the *modified* `x` at the moment of assignment. The author expected the product with the original `x`. Writing `Eigen::Vector3d y = A * x;` evaluates the product at that line into a real vector, and later changes to `x` cannot affect it; `auto y = (A * x).eval();` does the same when `auto` must be kept.
:::

::: check
A telemetry link delivers attitude as four doubles in the order $[w, x, y, z]$. Show the correct way to build the `Quaterniond`, and explain what the tempting `memcpy` into `coeffs().data()` would produce.
:::

::: answer
Name the components: `Eigen::Quaterniond q(msg[0], msg[1], msg[2], msg[3]);`, because the constructor takes the scalar first. The `memcpy` copies $[w, x, y, z]$ into storage laid out as $[x, y, z, w]$, so the scalar becomes the $x$ component and the $z$ component becomes the scalar. The result still has unit norm, so no assertion fires, but for a yaw rotation it describes a roll of the same angle — the example showed a 90° rotation about $z$ arriving as 90° about $x$.
:::

::: check
A star tracker reports a vector `v_s` in its own frame. `q_bs` rotates sensor-frame coordinates into the body frame and `q_ib` rotates body-frame coordinates into the inertial frame. Write the inertial vector, and the single quaternion that does the same job.
:::

::: answer
Apply the sensor-to-body rotation first, then body-to-inertial: `v_i = q_ib * (q_bs * v_s)`. Because Eigen's product composes so that the right-hand factor acts first, the single quaternion is `q_is = q_ib * q_bs`, and `q_is * v_s` gives the same `v_i`. Writing `q_bs * q_ib` would apply the body-to-inertial rotation to sensor-frame coordinates — meaningless, and not a compile error, which is why naming quaternions by the frames they connect matters.
:::

::: check
Inside `two_body`, `const Eigen::Vector3d r = x.head<3>();` is fine. Why would `auto r = x.head<3>(); return r;` from a helper function that received `x` by value be a bug?
:::

::: answer
`x.head<3>()` is a block expression that refers to the storage of `x`. With `const Eigen::Vector3d r =`, the block is evaluated into a fresh 3-vector that owns its numbers. With `auto`, `r` is the block itself, still pointing into `x`; if `x` is a by-value parameter it is destroyed when the helper returns, and the caller receives a view of dead stack memory. Returning `Eigen::Vector3d` by value, or writing `x.head<3>().eval()`, makes the result own its data.
:::

## Summary

| Item | Meaning |
| --- | --- |
| `Eigen::Matrix<double, R, C>` | the type behind `Vector3d`, `Matrix3d`, a `Vector6d` alias; fixed sizes live on the stack |
| `VectorXd`, `MatrixXd` | dynamic sizes; heap storage; tooling only |
| `SizeAtCompileTime` | compile-time size constant; `static_assert` it to forbid dynamic types |
| `<<` comma initialiser | fills row by row; also stacks vectors |
| `head<3>()`, `tail<3>()`, `segment<3>(i)`, `block<R,C>(i,j)` | compile-time-sized views of parts of a matrix |
| `dot`, `cross`, `norm`, `normalized`, `transpose`, `inverse` | the vector and matrix operations |
| `A.ldlt().solve(b)` | solve through a decomposition, not through `inverse()` |
| `.array()` | element-wise semantics |
| expression templates | `a + b` is a lazy expression holding references; assign to a concrete type or `.eval()` |
| aliasing | `m = m.transpose()` is wrong; use `transposeInPlace()`; products are protected by default |
| `Quaterniond(w, x, y, z)` / `coeffs()` = `[x, y, z, w]` | scalar first in the constructor, last in storage |
| `q1 * q2`, `q * v` | Hamilton product, `q2` applied first; active rotation of a vector |
| `Map`, `Ref` | view raw memory as Eigen; accept any vector-shaped argument without copying |
| `-O2`, `-DNDEBUG` | Eigen needs the optimiser; `NDEBUG` removes its run-time asserts |

The next lesson gives this code a build: a CMake library, a GoogleTest binary that checks the energy drift and the allocation count, and a `ctest` run that a continuous-integration server can execute.
