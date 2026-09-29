---
id: l10-quaternion-element-order
title: Quaternion element order
minutes: 22
covers:
  - The Quaterniond(w,x,y,z) constructor versus coeffs() returning x,y,z,w
---

Write the date 03/04 on a note and hand it to two friends, one from Chicago and one from London. The friend from Chicago reads March 4. The friend from London reads the 3rd of April. Same four digits, a month apart. Neither friend made a mistake. They follow two different **conventions** (agreed habits for writing the same thing), and the note did not say which one it used.

A quaternion is four numbers that describe a rotation, and it has exactly this problem. Some people and libraries write the "angle part" first; others write it last. Eigen, the library this module is about, manages to do both inside one class: you hand the four numbers to `Quaterniond` in one order, and when you ask for them back with `coeffs()` they come out in a different order.

That one fact is behind a whole family of real bugs. An attitude estimate goes into a telemetry packet, a simulation, or a Python test harness, and comes out on the other side as a completely different rotation. Nothing crashes. The spacecraft points the wrong way. This lesson shows the two orders, what a swapped quaternion turns into, and the small habits and tests that stop the bug at every **[[library boundary|library-boundary]]** (the spot where your code hands data to someone else's code).

## A quaternion in one paragraph

You met quaternions in the attitude part of the course and in the previous lesson on Eigen's Geometry module. Here is the plain reminder. Any rotation in 3-D can be described as "turn by some angle $\theta$ (read "theta") about some axis $\hat{\mathbf{n}}$ (read "n hat", a vector of length 1)". A **unit quaternion** packs that into four numbers:

$$
w = \cos\frac{\theta}{2}, \qquad (x, y, z) = \sin\frac{\theta}{2}\,\hat{\mathbf{n}}.
$$

The number $w$ is the **scalar part** (a single number with no direction). The three numbers $(x, y, z)$ are the **vector part**: they point along the axis. The four together have length 1, so $w^2 + x^2 + y^2 + z^2 = 1$. The angle is halved inside the formula; a context note says why that **[[half angle|half-angle]]** is there.

Two special cases are worth knowing by heart:

- **No rotation at all** ($\theta = 0$) gives $w = \cos 0 = 1$ and $x = y = z = 0$. That is the **identity** quaternion.
- **A half turn** ($\theta = 180°$) gives $w = \cos 90° = 0$. So a unit quaternion with $w = 0$ is always a 180-degree rotation, about whatever axis $(x, y, z)$ points along.

Going the other way, you can read any unit quaternion back into an angle and an axis:

$$
\theta = 2\arccos(w), \qquad \hat{\mathbf{n}} = \frac{(x, y, z)}{\lVert (x, y, z) \rVert}.
$$

Read $\arccos$ as "arc cosine": the angle whose cosine is $w$. The double bars $\lVert\cdot\rVert$ mean "length of". You will use this pair of formulas all lesson as a lie detector.

::: example A 90-degree turn about z, by hand
Turn by $\theta = 90°$ about the $z$ axis, $\hat{\mathbf{n}} = (0, 0, 1)$.

Half the angle is $45°$. Both $\cos 45°$ and $\sin 45°$ equal $\sqrt{0.5} \approx 0.7071$.

So $w = 0.7071$, and the vector part is $0.7071 \times (0, 0, 1) = (0, 0, 0.7071)$.

Check the length: $0.7071^2 + 0.7071^2 \approx 0.5 + 0.5 = 1$. Good, it is a unit quaternion.

Read it back: $\theta = 2\arccos(0.7071) = 2 \times 45° = 90°$, and the axis is $(0, 0, 0.7071)$ divided by its length $0.7071$, which is $(0, 0, 1)$. We got back what we put in.
:::

## Two orders inside one class

Now the heart of the lesson. Eigen's `Quaterniond` (a quaternion of `double`s) has a constructor that takes four numbers. The constructor wants them **scalar-first**: `w`, then `x`, `y`, `z`. That matches the way most math books write a quaternion, $w + x\,\mathbf{i} + y\,\mathbf{j} + z\,\mathbf{k}$, with the plain number in front.

But inside the object, Eigen stores the four numbers **scalar-last**: `x`, `y`, `z`, then `w`. The member function `coeffs()` (short for coefficients) hands you that storage as a `Vector4d`, so it comes out as `x, y, z, w`.

Here it is, running. Compile it the way the whole module does: `g++ -std=c++20 -Wall -Wextra -I/usr/include/eigen3 order.cpp -o order`.

```cpp fragment
#include <Eigen/Geometry>
#include <cmath>
#include <cstdio>

int main() {
    // A 90-degree turn about z, written in the constructor's order (w, x, y, z).
    const double h = std::sqrt(0.5);                 // cos(45 deg) = sin(45 deg)
    Eigen::Quaterniond q(h, 0.0, 0.0, h);

    std::printf("w=%.4f x=%.4f y=%.4f z=%.4f\n", q.w(), q.x(), q.y(), q.z());

    const Eigen::Vector4d c = q.coeffs();            // storage order (x, y, z, w)
    std::printf("coeffs: %.4f %.4f %.4f %.4f\n", c[0], c[1], c[2], c[3]);

    const Eigen::Vector3d v = q * Eigen::Vector3d::UnitX();
    std::printf("x axis goes to: %.4f %.4f %.4f\n", v.x(), v.y(), v.z());
    return 0;
}
```

```text
w=0.7071 x=0.0000 y=0.0000 z=0.7071
coeffs: 0.0000 0.0000 0.7071 0.7071
x axis goes to: -0.0000 1.0000 0.0000
```

Read the three lines slowly.

1. The named accessors `w()`, `x()`, `y()`, `z()` always give the part you asked for, by name. They never depend on order. That makes them the safest way to read a quaternion.
2. `coeffs()` printed the same four numbers with `w` moved to the end. Position 0 is `x`, position 3 is `w`.
3. Rotating the $x$ axis by 90 degrees about $z$ gives the $y$ axis, as it should. The `-0.0000` is a tiny rounding leftover, not a real minus sign; the note on **[[negative zero|negative-zero]]** explains it.

There is also `q.vec()`, which gives the vector part `(x, y, z)` as a `Vector3d`. Because the storage puts those three first and side by side, `vec()` is a view of the first three stored numbers with no shuffling needed. That is one practical benefit of the scalar-last **[[storage layout|storage-layout]]**.

::: key The constructor is scalar-first, the storage is scalar-last
`Quaterniond(w, x, y, z)`, but `coeffs()` returns $(x, y, z, w)$. The constructor is scalar-first and the internal storage is scalar-last, which is the single most common Eigen bug at a library boundary. Convert deliberately and test the round trip.
:::

## Same four numbers, four different quaternions

The trap is wider than `coeffs()`. Every way of building a `Quaterniond` from a *block* of numbers (a pointer, a `Vector4d`, or a `Map` over a buffer) reads that block in **storage order**, `x, y, z, w`. Only the four-separate-numbers constructor is scalar-first.

This program feeds the same four doubles, 1, 2, 3, 4, through four different doors:

```cpp fragment
#include <Eigen/Geometry>
#include <cstdio>

void show(const char* label, const Eigen::Quaterniond& q) {
    std::printf("%-22s w=%.1f x=%.1f y=%.1f z=%.1f\n", label, q.w(), q.x(), q.y(), q.z());
}

int main() {
    const double buf[4] = {1.0, 2.0, 3.0, 4.0};

    show("four scalars", Eigen::Quaterniond(buf[0], buf[1], buf[2], buf[3]));
    show("pointer", Eigen::Quaterniond(buf));
    show("Vector4d", Eigen::Quaterniond(Eigen::Vector4d(buf[0], buf[1], buf[2], buf[3])));
    show("Map over buffer", Eigen::Quaterniond(Eigen::Map<const Eigen::Quaterniond>(buf)));
    return 0;
}
```

```text
four scalars           w=1.0 x=2.0 y=3.0 z=4.0
pointer                w=4.0 x=1.0 y=2.0 z=3.0
Vector4d               w=4.0 x=1.0 y=2.0 z=3.0
Map over buffer        w=4.0 x=1.0 y=2.0 z=3.0
```

(These four numbers are not a unit quaternion. That does not matter here; the program is only showing which slot each number lands in.)

The first line put the first number into `w`. The other three put the *last* number into `w`. The code compiles cleanly in every case, with no warning. Nothing in the types tells you which order a raw array of four doubles is in. Only you know that.

::: warning Four doubles have no labels
A `double[4]`, a `std::array<double, 4>`, a `Vector4d` or four fields in a message are only four numbers. The order lives in a document, a comment or somebody's memory. So:

- Never pass a quaternion across a boundary as "four doubles" without the order in the name: `q_wxyz`, `q_xyzw`.
- Build a `Quaterniond` from a scalar-first array with the four-scalar constructor, reading each slot by name.
- Treat the pointer, `Vector4d` and `Map` constructors as scalar-last, always.
:::

## What a swapped quaternion does

Suppose someone prints `coeffs()`, copies the four numbers, and pastes them into the constructor. What rotation do they get? Use the lie detector from the first section.

```cpp fragment
#include <Eigen/Geometry>
#include <cmath>
#include <cstdio>

void describe(const char* label, const Eigen::Quaterniond& q) {
    const double angle = 2.0 * std::acos(q.w()) * 180.0 / M_PI;
    const Eigen::Vector3d axis = q.vec().normalized();
    std::printf("%s: angle %.1f deg about (%.4f, %.4f, %.4f)\n",
                label, angle, axis.x(), axis.y(), axis.z());
}

int main() {
    const double h = std::sqrt(0.5);
    const Eigen::Quaterniond good(h, 0.0, 0.0, h);   // w first: 90 deg about z

    // The bug: someone copies coeffs() output (x, y, z, w) straight into
    // the constructor, which expects (w, x, y, z).
    const Eigen::Vector4d c = good.coeffs();
    const Eigen::Quaterniond bad(c[0], c[1], c[2], c[3]);

    describe("good", good);
    describe("bad ", bad);

    const Eigen::Vector3d vg = good * Eigen::Vector3d::UnitX();
    const Eigen::Vector3d vb = bad * Eigen::Vector3d::UnitX();
    std::printf("good sends x to (%.4f, %.4f, %.4f)\n", vg.x(), vg.y(), vg.z());
    std::printf("bad  sends x to (%.4f, %.4f, %.4f)\n", vb.x(), vb.y(), vb.z());
    return 0;
}
```

```text
good: angle 90.0 deg about (0.0000, 0.0000, 1.0000)
bad : angle 180.0 deg about (0.0000, 0.7071, 0.7071)
good sends x to (-0.0000, 1.0000, 0.0000)
bad  sends x to (-1.0000, 0.0000, 0.0000)
```

A quarter turn about $z$ became a half turn about a tilted axis. The $x$ axis, which should have swung to $y$, was flipped to point backwards instead.

::: example Reading the swapped quaternion by hand
The good quaternion stores $(x, y, z, w) = (0, 0, 0.7071, 0.7071)$. Pasting those four into the constructor, slot by slot, gives $w = 0$, $x = 0$, $y = 0.7071$, $z = 0.7071$.

**Angle.** $w = 0$, and $\arccos(0) = 90°$, so $\theta = 2 \times 90° = 180°$. A half turn.

**Axis.** The vector part is $(0, 0.7071, 0.7071)$. Its length is $\sqrt{0.7071^2 + 0.7071^2} = \sqrt{0.5 + 0.5} = 1$. Dividing by 1 changes nothing, so the axis is $(0, 0.7071, 0.7071)$: halfway between $+y$ and $+z$.

**Sanity check.** The program printed exactly this angle and axis. A half turn about an axis that is at right angles to $x$ must send $x$ to $-x$, and it did: $(-1, 0, 0)$.

Notice the pattern. The swap moved the old $w$ into $z$ and the old $z$ into $y$, and it moved whatever sat in the $x$ slot into $w$. Any time a quaternion's $x$ part happens to be zero, the swapped version has $w = 0$ and is a half turn, however small the intended rotation was.
:::

The general rule is worth saying plainly. Reading scalar-last numbers as scalar-first (or the reverse) is not a small error. It produces a different, perfectly valid unit quaternion, usually a large rotation about the wrong axis. Because it is still a valid unit quaternion, no length check or "is it normalized?" test will catch it.

::: warning Identity is not all zeros and a one
The identity quaternion is $w = 1$, so its constructor call is `Quaterniond(1, 0, 0, 0)`, and its `coeffs()` print as `0 0 0 1`. Both are correct. When you see a column of numbers ending in 1, ask which convention wrote it before you type it anywhere. Better still, write `Quaterniond::Identity()` and avoid the question.
:::

## Crossing a library boundary

Inside one Eigen program, the accessors keep you safe. The danger is at the edges: a message from another team, a file, a Python test harness, a ground tool. Different worlds chose differently.

| Where the quaternion lives | Order you meet it in |
|---|---|
| Eigen `Quaterniond(w, x, y, z)` constructor | scalar first |
| Eigen `coeffs()`, pointer, `Vector4d`, `Map` | scalar last |
| ROS `geometry_msgs/Quaternion` message | fields named `x, y, z, w` |
| SciPy `Rotation.as_quat()` (default) | scalar last |
| MATLAB `quaternion(a, b, c, d)` | scalar first |

The order is not the only thing that can differ. Some aerospace documents follow the **[[JPL convention|jpl-convention]]**, which puts the scalar last *and* multiplies quaternions differently. So when a document says "quaternion", ask three questions: which slot is the scalar, which multiplication rule, and does it rotate the vector or the frame?

The safe pattern is to convert at the boundary, in exactly one pair of named functions, and to put the order in every name.

```cpp
// The ground software sends attitude as four doubles, scalar first: w, x, y, z.
using Wxyz = std::array<double, 4>;

Eigen::Quaterniond fromWxyz(const Wxyz& a) {
    return Eigen::Quaterniond(a[0], a[1], a[2], a[3]);   // (w, x, y, z)
}

Wxyz toWxyz(const Eigen::Quaterniond& q) {
    return {q.w(), q.x(), q.y(), q.z()};                 // never coeffs() here
}
```

`fromWxyz` uses the four-scalar constructor, which is scalar-first, matching the message. `toWxyz` reads each part by name, so it cannot be fooled by storage order. Every other function in the program works with `Eigen::Quaterniond` and never sees raw numbers.

## Testing the boundary

A convention bug does not crash, so only a test will find it. Two kinds of test are needed, and it is worth seeing why one is not enough.

A **round-trip test** converts in and back out and checks nothing changed. A **known-answer test** converts in and checks the rotation does a specific thing you worked out by hand. Here are both, written with **GoogleTest**, the standard C++ testing library, which gets its own module later in the track. For now, read `TEST(Group, Name)` as "a named check", `EXPECT_EQ(a, b)` as "a must equal b", and `EXPECT_NEAR(a, b, tol)` as "a and b may differ by at most tol".

```cpp
#include <Eigen/Geometry>
#include <gtest/gtest.h>
#include <array>
#include <cmath>

// The ground software sends attitude as four doubles, scalar first: w, x, y, z.
using Wxyz = std::array<double, 4>;

Eigen::Quaterniond fromWxyz(const Wxyz& a) {
    return Eigen::Quaterniond(a[0], a[1], a[2], a[3]);   // (w, x, y, z)
}

Wxyz toWxyz(const Eigen::Quaterniond& q) {
    return {q.w(), q.x(), q.y(), q.z()};                 // never coeffs() here
}

TEST(QuaternionBoundary, RoundTripIsExact) {
    const Wxyz in = {0.9, 0.1, -0.3, 0.3};
    EXPECT_EQ(toWxyz(fromWxyz(in)), in);
}

TEST(QuaternionBoundary, KnownRotationTurnsXIntoY) {
    const double h = std::sqrt(0.5);
    const Eigen::Quaterniond q = fromWxyz({h, 0.0, 0.0, h});   // 90 deg about z
    const Eigen::Vector3d v = q * Eigen::Vector3d::UnitX();
    EXPECT_NEAR(v.x(), 0.0, 1e-15);
    EXPECT_NEAR(v.y(), 1.0, 1e-15);
    EXPECT_NEAR(v.z(), 0.0, 1e-15);
}
```

Build and run it with `g++ -std=c++20 -Wall -Wextra -I/usr/include/eigen3 boundary_test.cpp -o boundary_test -lgtest -lgtest_main -pthread && ./boundary_test`:

```text
[ RUN      ] QuaternionBoundary.RoundTripIsExact
[       OK ] QuaternionBoundary.RoundTripIsExact (0 ms)
[ RUN      ] QuaternionBoundary.KnownRotationTurnsXIntoY
[       OK ] QuaternionBoundary.KnownRotationTurnsXIntoY (0 ms)
[  PASSED  ] 2 tests.
```

(The test quaternion $(0.9, 0.1, -0.3, 0.3)$ was chosen to have length exactly 1: $0.81 + 0.01 + 0.09 + 0.09 = 1$.)

Now break both functions *in the same way*. Make `fromWxyz` use the pointer constructor, `Quaterniond(a.data())`, and make `toWxyz` copy out `coeffs()`. Both now treat the message as scalar-last. The run becomes:

```text
[ RUN      ] QuaternionBoundary.RoundTripIsExact
[       OK ] QuaternionBoundary.RoundTripIsExact (0 ms)
[ RUN      ] QuaternionBoundary.KnownRotationTurnsXIntoY
buggy_test.cpp:27: Failure
The difference between v.x() and 0.0 is 1, which exceeds 1e-15, where
v.x() evaluates to 1,
0.0 evaluates to 0, and
1e-15 evaluates to 1.0000000000000001e-15.
[  FAILED  ] QuaternionBoundary.KnownRotationTurnsXIntoY (0 ms)
```

The round trip still passes. The two mistakes cancel: the numbers go in the wrong way and come out the same wrong way, so they arrive home unchanged. Only the **[[known-answer test|known-answer]]** noticed that the rotation in the middle was a 90-degree turn about $x$ (which leaves the $x$ axis where it is) instead of about $z$.

::: warning A round trip alone proves consistency, not correctness
If the same wrong assumption is made on the way in and on the way out, a round-trip test passes. Always pair it with at least one known-answer test: a rotation you worked out by hand, whose effect on a vector you can predict. A 90-degree turn about one axis is ideal, because every order mistake turns it into something visibly different.
:::

## The matrix round trip, and the sign of q

The other round trip you will write often goes through a **[[rotation matrix|dcm]]** (the $3 \times 3$ grid of numbers, also called a **DCM**, that does the same rotation). `q.toRotationMatrix()` goes one way, and constructing a `Quaterniond` from a `Matrix3d` goes back.

```cpp fragment
#include <Eigen/Geometry>
#include <cmath>
#include <cstdio>

int main() {
    // 30 degrees about the axis (1, 2, 2)/3.
    const Eigen::Vector3d axis = Eigen::Vector3d(1.0, 2.0, 2.0) / 3.0;
    const Eigen::Quaterniond q(Eigen::AngleAxisd(30.0 * M_PI / 180.0, axis));
    std::printf("q      (w x y z) = %.6f %.6f %.6f %.6f\n", q.w(), q.x(), q.y(), q.z());

    // Quaternion -> rotation matrix -> quaternion.
    const Eigen::Matrix3d R = q.toRotationMatrix();
    const Eigen::Quaterniond back(R);
    const double err = (back.coeffs() - q.coeffs()).cwiseAbs().maxCoeff();
    std::printf("round trip max error = %.1e\n", err);

    // The same rotation written with every sign flipped.
    const Eigen::Quaterniond neg(-q.w(), -q.x(), -q.y(), -q.z());
    const Eigen::Quaterniond back2(neg.toRotationMatrix());
    std::printf("-q back (w x y z) = %.6f %.6f %.6f %.6f\n",
                back2.w(), back2.x(), back2.y(), back2.z());
    std::printf("raw difference    = %.1e\n",
                (back2.coeffs() - neg.coeffs()).cwiseAbs().maxCoeff());
    std::printf("angular distance  = %.1e rad\n", back2.angularDistance(neg));
    return 0;
}
```

```text
q      (w x y z) = 0.965926 0.086273 0.172546 0.172546
round trip max error = 0.0e+00
-q back (w x y z) = 0.965926 0.086273 0.172546 0.172546
raw difference    = 1.9e+00
angular distance  = 0.0e+00 rad
```

::: example Checking the printed quaternion
Half of $30°$ is $15°$. So $w = \cos 15° \approx 0.965926$, matching the first number.

The axis $(1, 2, 2)/3$ has length $\sqrt{1 + 4 + 4}/3 = 3/3 = 1$, so it is already a unit vector. The vector part is $\sin 15° \approx 0.258819$ times it:

$x = 0.258819 / 3 \approx 0.086273$, and $y = z = 2 \times 0.258819 / 3 \approx 0.172546$.

All four match the printout. The round trip through the matrix came back with zero error.
:::

The second half of the output is the surprise. Flipping every sign of a quaternion, $-q$, gives the *same rotation*. That is the **[[double cover|double-cover]]**: every rotation has exactly two unit quaternions, $q$ and $-q$. A matrix has only one. So when Eigen turns a matrix back into a quaternion, it has to pick one of the two, and it may not pick the one you started with. Here it came back with $w$ positive, so comparing numbers slot by slot says the difference is $1.9$ (about $2 \times 0.966$), even though the rotation is identical.

That is why the program also printed `angularDistance`, which measures the angle between two rotations in radians and does not care about the sign. It reads zero.

::: warning Compare rotations, not raw numbers
When a test compares two quaternions, either compare `angularDistance` against a small tolerance, or flip one of them first so that both have the same sign of $w$. A slot-by-slot comparison of $q$ with $-q$ fails even though nothing is wrong.
:::

One more habit from the previous lesson applies here. The four-scalar constructor stores exactly what you give it; it does not rescale to length 1. `toRotationMatrix()` and rotating a vector assume a unit quaternion. If your four numbers came from a file or a message, call `q.normalize()` after building it, so small rounding in the source cannot bend the rotation.

The module's first exercise asks you to do all of this for $(w, x, y, z) = (0.5, 0.5, 0.5, 0.5)$: print `coeffs()` in its native order, go to a matrix and back, and rotate the $x$ axis. Before running it, work out on paper which way that quaternion turns the $x$ axis, using the lie detector: $\theta = 2\arccos(0.5)$ and the axis is $(0.5, 0.5, 0.5)$ scaled to length 1.

## Check yourself

::: check
A colleague's log line says `att = [0.0, 0.0, 0.6, 0.8]` and the log was written by printing `coeffs()`. Which rotation is it? Now suppose the same four numbers had been written by a tool that puts the scalar first. Which rotation would it be then?
:::

::: answer
`coeffs()` is scalar-last, so the slots are $x = 0$, $y = 0$, $z = 0.6$, $w = 0.8$. Length check: $0.36 + 0.64 = 1$. The angle is $\theta = 2\arccos(0.8) \approx 2 \times 36.87° = 73.7°$, and the axis is $(0, 0, 0.6)$ scaled to length 1, which is $(0, 0, 1)$. So about $74°$ about $z$.

If the scalar is first, the slots are $w = 0$, $x = 0$, $y = 0.6$, $z = 0.8$. Now $w = 0$, so $\theta = 2\arccos(0) = 180°$, a half turn, about the axis $(0, 0.6, 0.8)$. The same four numbers give a modest turn about $z$ or a complete flip about a tilted axis, depending only on the convention. This is why the order must travel with the data.
:::

::: check
What does each of these print for `w`? (a) `Eigen::Quaterniond(7, 8, 9, 10).w()`; (b) `Eigen::Quaterniond(Eigen::Vector4d(7, 8, 9, 10)).w()`; (c) with `double a[4] = {7, 8, 9, 10};`, `Eigen::Quaterniond(a).w()`.
:::

::: answer
(a) The four-scalar constructor is scalar-first, so `w` is 7.

(b) A `Vector4d` is read in storage order $(x, y, z, w)$, so `w` is the last number, 10.

(c) The pointer constructor also reads storage order, so `w` is 10 again.

Only the four-separate-numbers constructor puts the first number in `w`.
:::

::: check
A unit quaternion is written scalar-first as $(0.6, 0, 0.8, 0)$. Find its angle and axis. Then say what happens if a program reads those four numbers as scalar-last.
:::

::: answer
Scalar-first: $w = 0.6$, vector part $(0, 0.8, 0)$. Length check: $0.36 + 0.64 = 1$. Angle $\theta = 2\arccos(0.6) \approx 2 \times 53.13° = 106.3°$. Axis: $(0, 0.8, 0)$ divided by $0.8$ is $(0, 1, 0)$, the $y$ axis. So about $106°$ about $y$.

Read as scalar-last, the slots become $x = 0.6$, $y = 0$, $z = 0.8$, $w = 0$. Now $w = 0$, so it is a $180°$ half turn about the axis $(0.6, 0, 0.8)$. A completely different rotation, and still a valid unit quaternion, so no length check would flag it.
:::

::: check
Your boundary functions pass a round-trip test. A teammate says that proves the order is right. Explain in two or three sentences why it does not, and name the test you would add.
:::

::: answer
A round trip only shows the in-conversion and the out-conversion are inverses of each other. If both make the same wrong assumption about the order, the error goes in and comes back out unchanged, and the test passes. Add a known-answer test: build a quaternion from a message you worked out by hand, such as 90 degrees about $z$ written as $(w, x, y, z) = (0.7071, 0, 0, 0.7071)$, and check that it turns the $x$ axis into the $y$ axis.
:::

::: check
A test builds a quaternion `q`, converts it to a matrix and back to `q2`, then checks `(q2.coeffs() - q.coeffs()).cwiseAbs().maxCoeff() < 1e-12`. It fails with a difference of about 1.8. What is going on, and how do you fix the test?
:::

::: answer
The rotation is almost certainly fine. $q$ and $-q$ describe the same rotation, and the matrix-to-quaternion conversion picked the other sign. A difference close to 2 times the size of the largest part is the fingerprint of a sign flip. Fix the test by comparing rotations instead of raw numbers, for example `q2.angularDistance(q) < 1e-12`, or by flipping `q2` to the same sign of $w$ as `q` before comparing.
:::

## Summary

| Idea | What to remember |
|---|---|
| Unit quaternion | $w = \cos\frac{\theta}{2}$, $(x, y, z) = \sin\frac{\theta}{2}\,\hat{\mathbf{n}}$, length 1 |
| Reading one back | $\theta = 2\arccos(w)$, axis $= (x, y, z)$ scaled to length 1 |
| `Quaterniond(w, x, y, z)` | four-scalar constructor, scalar first |
| `coeffs()` | storage order $(x, y, z, w)$, scalar last |
| Pointer, `Vector4d`, `Map` | also read storage order, scalar last |
| `w()`, `x()`, `y()`, `z()`, `vec()` | read parts by name, safe in any order |
| Identity | `Quaterniond(1, 0, 0, 0)`, `coeffs()` prints `0 0 0 1` |
| Swapped order | a different valid rotation, often a half turn; no crash, no warning |
| Boundary rule | one pair of named converters, order in every name, round-trip plus known-answer test |
| $q$ and $-q$ | same rotation; compare with `angularDistance` |

The next lesson, *Alignment and proving no allocation*, looks at another invisible property of these small fixed-size types: where in memory they may live, and how to prove in a test that an update step built from them never touches the heap.

::: context library-boundary Where bugs like to live
Inside one program, the compiler checks that every function gets the types it expects. At a boundary (a network message, a file, a shared-memory buffer, a call into Python) that checking stops. The other side sees only bytes, and the meaning of those bytes lives in a document. That is why so many costly bugs sit at interfaces. NASA's Mars Climate Orbiter was lost in 1999 because one piece of ground software produced thruster impulse in pound-force seconds while the software reading it expected newton-seconds. A quaternion's element order is the same kind of silent agreement.
:::

::: context half-angle Why the angle is halved
When a quaternion rotates a vector, it is applied twice: once on each side of the vector, as $q\,\mathbf{v}\,q^{*}$. Each application turns by half the angle, so the two halves add up to the full turn. That is where the $\theta/2$ comes from. A side effect: going once around the full circle, $\theta$ from $0°$ to $360°$, only takes $\theta/2$ halfway round, from $0°$ to $180°$. So after one full turn, $w = \cos 180° = -1$ and the quaternion has flipped sign, even though the object is back where it started.
:::

::: context negative-zero A minus sign on nothing
The program printed `-0.0000` for the $x$ part of a rotated vector. The real value was about $-2.2 \times 10^{-16}$: the tiny rounding left over after multiplying $\sqrt{0.5}$ by itself in `double`. Printed to four decimal places, a small negative number keeps its minus sign but loses all its digits. It is harmless. Floating-point numbers also have a true negative zero, a zero with its sign bit set, and it prints the same way. Tests should compare with a tolerance, like `EXPECT_NEAR(v.x(), 0.0, 1e-15)`, never with exact equality to zero.
:::

::: context storage-layout How the four numbers sit in memory
A `Quaterniond` is 32 bytes: four `double`s, one after another. The picture shows the storage order and the three ways of looking at it. `coeffs()` sees all four. `vec()` sees the first three, which are the vector part and sit side by side, so no copying or shuffling is needed. `w()` reads the last slot.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5" fill="#ffffff">
    <rect x="40" y="50" width="70" height="40"/>
    <rect x="110" y="50" width="70" height="40"/>
    <rect x="180" y="50" width="70" height="40"/>
    <rect x="250" y="50" width="70" height="40" fill="#f2b880"/>
  </g>
  <g font-size="15" fill="#1f2a44" text-anchor="middle">
    <text x="75" y="75">x</text><text x="145" y="75">y</text><text x="215" y="75">z</text><text x="285" y="75">w</text>
  </g>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="75" y="104">slot 0</text><text x="145" y="104">slot 1</text><text x="215" y="104">slot 2</text><text x="285" y="104">slot 3</text>
  </g>
  <line x1="40" y1="36" x2="320" y2="36" stroke="#1d6fd1" stroke-width="2"/>
  <text x="180" y="28" font-size="12" fill="#1d6fd1" text-anchor="middle">coeffs(): all four</text>
  <line x1="40" y1="120" x2="250" y2="120" stroke="#b4232c" stroke-width="2"/>
  <text x="145" y="138" font-size="12" fill="#b4232c" text-anchor="middle">vec(): the first three</text>
  <text x="285" y="138" font-size="12" fill="#1f2a44" text-anchor="middle">w()</text>
</svg>
```
:::

::: context jpl-convention Two families of quaternion
Most robotics and graphics software, and Eigen, follow the Hamilton convention, named for William Rowan Hamilton, who invented quaternions in 1843. Its multiplication rule is $\mathbf{i}\mathbf{j} = \mathbf{k}$. A family of spacecraft attitude papers from NASA's Jet Propulsion Laboratory uses the JPL convention: the scalar goes last, and the rule is flipped to $\mathbf{i}\mathbf{j} = -\mathbf{k}$. Mixing the two gives rotations that are transposed, not merely reordered. So "scalar first or last?" is only the first question to ask when a quaternion arrives from somewhere else.
:::

::: context known-answer Tests with a worked answer
A known-answer test checks a result against a value you worked out independently, by hand or from a trusted source. It is a long-standing habit in numerical work: check a new routine against a case with a textbook answer before trusting it on cases without one. The best known answers are simple enough to verify in your head and sensitive to the mistake you fear. A 90-degree turn about $z$ is both: you can see that $x$ must go to $y$, and every wrong order or wrong sign sends it somewhere else.
:::

::: context dcm A grid that holds the new axes
DCM stands for direction cosine matrix. Each column says where one axis ends up after the rotation. For the 90-degree turn about $z$, the first column is $(0, 1, 0)$: the $x$ axis lands on $y$. The second column is $(-1, 0, 0)$: the $y$ axis lands on $-x$. The third column is $(0, 0, 1)$: $z$ stays put. A matrix has nine numbers for three degrees of freedom, but it has no order convention to get wrong and no sign ambiguity, which makes it a good middle point for tests.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="90" y1="130" x2="180" y2="130" stroke="#6c7a93" stroke-width="2"/>
  <polygon points="180,130 170,125 170,135" fill="#6c7a93"/>
  <text x="186" y="134" font-size="13" fill="#6c7a93">x before</text>
  <line x1="90" y1="130" x2="90" y2="40" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="90,40 85,50 95,50" fill="#1d6fd1"/>
  <text x="98" y="36" font-size="13" fill="#1d6fd1">x after = y</text>
  <path d="M 150 130 A 60 60 0 0 0 90 70" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <polygon points="90,70 99,65 99,75" fill="#b4232c"/>
  <text x="152" y="100" font-size="12" fill="#b4232c">90 deg about z</text>
  <circle cx="90" cy="130" r="4" fill="#1f2a44"/>
  <text x="62" y="152" font-size="12" fill="#1f2a44">z out of page</text>
  <text x="250" y="60" font-size="12" fill="#1f2a44">first column</text>
  <text x="250" y="78" font-size="12" fill="#1f2a44">of R: (0, 1, 0)</text>
</svg>
```
:::

::: context double-cover Two quaternions, one rotation
Every rotation is hit by exactly two unit quaternions, $q$ and $-q$, sitting at opposite ends of a line through the center. The picture shows them as two points on a circle; the real space of unit quaternions is a 4-D sphere, but the idea is the same. Many filters keep $w \ge 0$ so that the quaternion does not jump between the two when it is estimated from noisy data.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <circle cx="120" cy="85" r="62" fill="none" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="76.2" y1="41.2" x2="163.8" y2="128.8" stroke="#1f2a44" stroke-width="1" stroke-dasharray="4 3"/>
  <circle cx="163.8" cy="128.8" r="6" fill="#1d6fd1"/>
  <circle cx="76.2" cy="41.2" r="6" fill="#b4232c"/>
  <text x="174" y="140" font-size="13" fill="#1d6fd1">q</text>
  <text x="46" y="36" font-size="13" fill="#b4232c">-q</text>
  <circle cx="120" cy="85" r="2.5" fill="#1f2a44"/>
  <text x="222" y="70" font-size="12" fill="#1f2a44">opposite points,</text>
  <text x="222" y="88" font-size="12" fill="#1f2a44">same rotation</text>
  <text x="222" y="106" font-size="12" fill="#6c7a93">one rotation matrix</text>
</svg>
```
:::
