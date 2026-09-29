---
id: l09-the-geometry-module
title: 'Rotations and frames: the Geometry module'
minutes: 26
covers:
  - 'The Geometry module: Quaterniond, AngleAxis, Translation, Isometry3d, Transform, slerp'
---

Give a friend directions to your house: "Stand at the school gate facing the road. Turn left. Walk 30 meters. Turn right. Walk 50 meters." Two kinds of instruction are mixed together there. Some **turn** you and some **move** you. The order matters too: "turn left, then walk" and "walk, then turn left" put you in different places.

A spacecraft's software gives itself directions like that all day long. Where is the Sun, seen from the solar panel? Which way is the camera pointing, measured in the star catalog's frame? Where will the docking port be in one second? Each question is a chain of turns and moves between **[[frames|frames]]**, the sets of axes that each part of the problem is measured in.

Eigen's **Geometry module** gives each kind of instruction its own C++ type. `AngleAxisd` and `Quaterniond` are turns. `Translation3d` is a move. `Isometry3d` and the more general `Transform` are a turn and a move packed together. And `slerp` blends smoothly from one orientation to another. This lesson shows how to build each, how to chain them without getting the order backwards, and how to keep a quaternion healthy.

A reminder of the rotation ideas, which the attitude modules teach in full. A **rotation** turns every vector about a fixed axis by an angle. A **rotation matrix** $R$ is the $3 \times 3$ matrix that does it: $R\mathbf{v}$ is $\mathbf{v}$ turned. Rotation matrices are orthogonal ($R^T R = I$) with determinant $+1$. A **unit quaternion** stores the same rotation in four numbers, $q = (w, x, y, z)$: for a turn by angle $\theta$ about the unit axis $\hat{\mathbf{n}}$,

$$
w = \cos\frac{\theta}{2}, \qquad (x, y, z) = \sin\frac{\theta}{2}\,\hat{\mathbf{n}}.
$$

$w$ is the **scalar part** and $(x, y, z)$ the **vector part**, and $w^2 + x^2 + y^2 + z^2 = 1$.

All of the Geometry module comes with `#include <Eigen/Geometry>`. `#include <Eigen/Dense>` includes it as well.

## AngleAxis: the rotation you can picture

The easiest rotation to imagine is "this many radians about that axis". That is exactly what `Eigen::AngleAxisd` stores: one angle and one unit axis vector. The `d` at the end means `double`, as it does on every Eigen typedef.

```cpp
const double deg = M_PI / 180.0;
const Eigen::AngleAxisd aa(90 * deg, Eigen::Vector3d::UnitZ());   // 90 deg about z
```

Two rules. The angle is in **[[radians|radians]]**, so multiply degrees by $\pi/180$. And the axis must have length 1: Eigen does not normalize it for you. `Vector3d::UnitX()`, `UnitY()` and `UnitZ()` are the three unit axes. The positive direction of turning follows the **[[right-hand rule|right-hand-rule]]**.

An `AngleAxisd` can rotate a vector directly with `aa * v`, and it converts to the other forms: `aa.toRotationMatrix()` gives a `Matrix3d`, and `Eigen::Quaterniond q(aa)` gives a quaternion. It is a fine way to *build* a rotation. Flight software rarely *stores* attitude this way, because combining two angle-axis rotations has no simple formula. That is what quaternions are for.

::: warning The axis must be a unit vector
`Eigen::AngleAxisd(angle, Eigen::Vector3d(1, 1, 0))` compiles and runs, but its axis has length $\sqrt{2}$, and the rotation it produces is wrong. Write `Eigen::Vector3d(1, 1, 0).normalized()`. The same applies to degrees: `AngleAxisd(90, ...)` is 90 *radians*, which is about 14.3 full turns plus a bit.
:::

## Quaterniond: the flight-software workhorse

A **[[quaternion|hamilton]]** is how most attitude software stores orientation. It has four numbers instead of a matrix's nine, it has no gimbal-lock trouble, and composing two rotations is a quick multiplication. Eigen's type is `Eigen::Quaterniond`. The common ways to make one:

- from an angle-axis: `Eigen::Quaterniond q(aa);`
- from a rotation matrix: `Eigen::Quaterniond q(R);`
- from four numbers: `Eigen::Quaterniond q(w, x, y, z);` with the scalar **first**;
- the identity, "no rotation": `Eigen::Quaterniond::Identity()`.

You read the parts with `q.w()`, `q.x()`, `q.y()`, `q.z()`, and the vector part as a `Vector3d` with `q.vec()`. There is also `q.coeffs()`, which returns all four as a `Vector4d`. Be careful: it lists them in the order $x, y, z, w$, the scalar *last*, which is not the order the constructor takes. That mismatch is the whole subject of the next lesson.

Three operations do nearly all the work.

- **Rotate a vector:** `q * v` returns $\mathbf{v}$ turned by $q$.
- **Compose:** `q1 * q2` is the rotation "first $q_2$, then $q_1$". Read a chain of products from right to left, the way the vector meets them.
- **Undo:** `q.conjugate()` is the reverse turn. For a unit quaternion it equals `q.inverse()` and is cheaper.

::: key
In Eigen, `q * v` rotates the vector $\mathbf{v}$, and `q1 * q2` applies `q2` first, then `q1`. `AngleAxisd(angle, axis)` needs the angle in radians and a unit axis. Rotating vectors and converting to a matrix assume $|q| = 1$.
:::

::: example One rotation, three forms, and why order matters
```cpp fragment
#include <Eigen/Geometry>
#include <cmath>
#include <cstdio>

int main() {
    const double deg = M_PI / 180.0;

    // 90 degrees about the z axis, three ways.
    const Eigen::AngleAxisd aa(90 * deg, Eigen::Vector3d::UnitZ());
    const Eigen::Quaterniond q(aa);
    const Eigen::Matrix3d R = q.toRotationMatrix();

    const Eigen::Vector3d v = Eigen::Vector3d::UnitX();
    const Eigen::Vector3d a = aa * v, b = q * v, c = R * v;
    std::printf("q: w=%.4f x=%.4f y=%.4f z=%.4f\n", q.w(), q.x(), q.y(), q.z());
    std::printf("AngleAxis * v = (%.3f, %.3f, %.3f)\n", a.x(), a.y(), a.z());
    std::printf("quaternion* v = (%.3f, %.3f, %.3f)\n", b.x(), b.y(), b.z());
    std::printf("matrix    * v = (%.3f, %.3f, %.3f)\n", c.x(), c.y(), c.z());

    // Order matters: yaw 90 then pitch 90, versus the other way round.
    const Eigen::Quaterniond yaw(Eigen::AngleAxisd(90 * deg, Eigen::Vector3d::UnitZ()));
    const Eigen::Quaterniond pitch(Eigen::AngleAxisd(90 * deg, Eigen::Vector3d::UnitY()));
    const Eigen::Vector3d p1 = (yaw * pitch) * v;    // pitch first, then yaw
    const Eigen::Vector3d p2 = (pitch * yaw) * v;    // yaw first, then pitch
    std::printf("(yaw*pitch) * v = (%.3f, %.3f, %.3f)\n", p1.x(), p1.y(), p1.z());
    std::printf("(pitch*yaw) * v = (%.3f, %.3f, %.3f)\n", p2.x(), p2.y(), p2.z());

    // Back from a quaternion to angle and axis.
    const Eigen::AngleAxisd back(yaw * pitch);
    std::printf("yaw*pitch is %.1f deg about (%.4f, %.4f, %.4f)\n",
                back.angle() / deg, back.axis().x(), back.axis().y(), back.axis().z());
}
```

Built with `g++ -std=c++20 -Wall -Wextra -I/usr/include/eigen3`:

```text
q: w=0.7071 x=0.0000 y=0.0000 z=0.7071
AngleAxis * v = (0.000, 1.000, 0.000)
quaternion* v = (0.000, 1.000, 0.000)
matrix    * v = (0.000, 1.000, 0.000)
(yaw*pitch) * v = (0.000, 0.000, -1.000)
(pitch*yaw) * v = (0.000, 1.000, -0.000)
yaw*pitch is 120.0 deg about (-0.5774, 0.5774, 0.5774)
```

Check the quaternion first. For 90 degrees, $\theta/2 = 45$ degrees, so $w = \cos 45^\circ \approx 0.7071$ and $z = \sin 45^\circ \approx 0.7071$. All three forms turn the $x$ axis into the $y$ axis, which is what a quarter turn counterclockwise about $z$ does.

Now the order, by hand. **Pitch first:** 90 degrees about $y$ tips the $x$ axis down to $-z$. The yaw about $z$ then leaves $-z$ where it is. Result $(0, 0, -1)$. **Yaw first:** $x$ turns to $y$, and a pitch about $y$ leaves $y$ alone. Result $(0, 1, 0)$. Two different answers from the same two turns. The $-0.000$ is a rounding leftover of about $-2 \times 10^{-16}$, printed with its sign.

**Sanity check** on the last line: a 120-degree turn about $(-1, 1, 1)/\sqrt{3}$ carries $x$ to $-z$, the first answer. Two 90-degree turns about different axes combining into one 120-degree turn is a pattern you will see again right away.
:::

::: example The exercise quaternion, and a round trip
The four numbers $(w, x, y, z) = (0.5, 0.5, 0.5, 0.5)$ are a unit quaternion: $4 \times 0.5^2 = 1$. Which rotation is it? From $w = \cos(\theta/2) = 0.5$, the half-angle is 60 degrees, so $\theta = 120$ degrees. The vector part is $\sin 60^\circ \approx 0.866$ times the axis, so the axis is $(0.5, 0.5, 0.5)/0.866 \approx (0.577, 0.577, 0.577)$, the diagonal of the cube.

```cpp fragment
#include <Eigen/Geometry>
#include <cmath>
#include <cstdio>

int main() {
    const Eigen::Quaterniond q(0.5, 0.5, 0.5, 0.5);        // w, x, y, z
    const Eigen::AngleAxisd aa(q);
    std::printf("angle %.1f deg about (%.4f, %.4f, %.4f), norm %.1f\n",
                aa.angle() * 180.0 / M_PI, aa.axis().x(), aa.axis().y(), aa.axis().z(),
                q.norm());

    const Eigen::Matrix3d R = q.toRotationMatrix();
    std::printf("R =\n");
    for (int i = 0; i < 3; ++i) std::printf("  %5.1f %5.1f %5.1f\n", R(i, 0), R(i, 1), R(i, 2));

    const Eigen::Quaterniond q2(R);                         // and back again
    std::printf("back: w=%.3f x=%.3f y=%.3f z=%.3f\n", q2.w(), q2.x(), q2.y(), q2.z());
    std::printf("largest round-trip difference: %.1e\n",
                (q2.coeffs() - q.coeffs()).cwiseAbs().maxCoeff());

    const Eigen::Vector3d v = q * Eigen::Vector3d::UnitX();
    std::printf("q * UnitX = (%.1f, %.1f, %.1f)\n", v.x(), v.y(), v.z());
}
```

Output:

```text
angle 120.0 deg about (0.5774, 0.5774, 0.5774), norm 1.0
R =
    0.0   0.0   1.0
    1.0   0.0   0.0
    0.0   1.0   0.0
back: w=0.500 x=0.500 y=0.500 z=0.500
largest round-trip difference: 0.0e+00
q * UnitX = (0.0, 1.0, 0.0)
```

The matrix is a **permutation**: it moves $x$ to $y$, $y$ to $z$, and $z$ to $x$. Read its columns: column 1 is where $x$ goes, $(0, 1, 0)$. That is why rotating `UnitX()` gives $(0, 1, 0)$. **Sanity check:** a turn of one third of a full circle about the cube's diagonal should shuffle the three axes around in a cycle, and three such turns, $3 \times 120 = 360$ degrees, should bring everything home. A cycle of three moves does exactly that.

The round trip, quaternion to matrix and back, reproduced every coefficient exactly. Converting a matrix to a quaternion has a sign choice (the next section's double cover), and Eigen returned the positive-$w$ one, which is the one we started from. Comparing the whole `coeffs()` vector is safe here because both sides are quaternions: the order is the same on each.
:::

## normalize(): staying on the unit sphere

Every formula that turns a quaternion into a rotation assumes $w^2 + x^2 + y^2 + z^2 = 1$. Eigen's `q * v` and `toRotationMatrix()` do too, and they do not check. But a quaternion that is updated again and again, step after step, drifts off length 1. Rounding does that slowly. A simple **[[first-order integration step|quat-integration]]**, the kind an attitude propagator runs hundreds of times a second, does it quickly: each step multiplies by a quaternion whose length is a little more than 1.

The cure is one call. `q.normalize()` divides all four numbers by the length, in place. `q.normalized()` returns a normalized copy and leaves `q` alone. Both are a handful of flops. Attitude code normalizes after every propagation step.

::: example Ten seconds of spinning, with and without normalize()
A body spins at 1 rad/s about $z$, and the software propagates its attitude at 100 Hz for 10 s with the update $q \leftarrow q \otimes (1, \tfrac{1}{2}\boldsymbol{\omega}\,\Delta t)$. Read $\otimes$ as "quaternion times" and $\Delta t$ as "delta t", the time step.

```cpp fragment
#include <Eigen/Geometry>
#include <cmath>
#include <cstdio>

int main() {
    // Spin at 1 rad/s about z, integrated at 100 Hz for 10 s, with the
    // first-order update q <- q * [1, w*dt/2].
    const Eigen::Vector3d omega(0, 0, 1);                  // rad/s
    const double dt = 0.01;                                 // s
    const Eigen::Vector3d h = 0.5 * omega * dt;
    const Eigen::Quaterniond dq(1.0, h.x(), h.y(), h.z());

    Eigen::Quaterniond raw = Eigen::Quaterniond::Identity();
    Eigen::Quaterniond fixed = Eigen::Quaterniond::Identity();
    for (int k = 0; k < 1000; ++k) {
        raw = raw * dq;
        fixed = fixed * dq;
        fixed.normalize();                                  // back onto |q| = 1
    }

    const Eigen::Vector3d v = Eigen::Vector3d::UnitX();
    const Eigen::Vector3d a = raw.toRotationMatrix() * v;
    const Eigen::Vector3d b = fixed.toRotationMatrix() * v;
    std::printf("norm without normalize: %.6f, with: %.6f\n", raw.norm(), fixed.norm());
    std::printf("rotated UnitX length without: %.6f, with: %.6f\n", a.norm(), b.norm());
    std::printf("heading with normalize: %.1f deg\n", std::atan2(b.y(), b.x()) * 180 / M_PI);
    std::printf("exact heading:          %.1f deg\n",
                std::remainder(10.0, 2 * M_PI) * 180 / M_PI);
}
```

Output:

```text
norm without normalize: 1.012578, with: 1.000000
rotated UnitX length without: 1.046647, with: 1.000000
heading with normalize: -147.0 deg
exact heading:          -147.0 deg
```

Check the drift by hand. The step quaternion is $(1, 0, 0, 0.005)$, with length $\sqrt{1 + 0.005^2}$. Multiplying by it multiplies the length by that much, so after 1,000 steps the length is $(1 + 0.000025)^{500} \approx 1.012578$, exactly what the program printed. Over a 1% error in the length turned into a matrix that stretches vectors by 4.7%: a "rotation" that makes a 1 m vector 1.047 m long.

With `normalize()` the length stays 1, and the heading is right. **Sanity check:** 10 s at 1 rad/s is 10 rad, which is $10 \times 180/\pi \approx 573$ degrees. Subtract a full turn to get about 213 degrees, the same direction as $-147$ degrees. Both lines agree.
:::

::: warning A default-constructed quaternion is not the identity
`Eigen::Quaterniond q;` leaves the four numbers uninitialized, like any other fixed-size Eigen type. Start from `Eigen::Quaterniond::Identity()` when you mean "no rotation yet". The same is true of `Eigen::Isometry3d T;` in the next section: only its bottom row is set.
:::

## Translation, Isometry3d and Transform: turning and moving together

A pure move is an `Eigen::Translation3d(x, y, z)`. On its own it is rarely stored. Its job is to be combined with a rotation into a **rigid transform**, a turn plus a move that keeps every length and angle. Eigen's type for that is `Eigen::Isometry3d`. Applied to a point $\mathbf{p}$ it computes

$$
T\mathbf{p} = R\mathbf{p} + \mathbf{t},
$$

the rotation first, then the translation. In code you build one by writing the move and the turn as a product:

```cpp
const Eigen::Isometry3d T = Eigen::Translation3d(0.5, 0.0, 0.2) *
                            Eigen::AngleAxisd(90 * deg, Eigen::Vector3d::UnitY());
```

Read it right to left, as with quaternions: the point is rotated, then moved. `T.translation()` gives the move as a `Vector3d`, and `T.linear()` (or `T.rotation()`) the $3 \times 3$ rotation. `T.matrix()` gives the whole thing as a $4 \times 4$ matrix in **[[homogeneous coordinates|homogeneous]]**.

`Isometry3d` is a shorthand for the class template `Eigen::Transform<double, 3, Eigen::Isometry>`. The last argument says what kind of transform it is:

- `Isometry` (typedef `Isometry3d`): rotation and translation only. Its inverse is cheap, $R^T(\mathbf{p} - \mathbf{t})$, because the inverse of a rotation is its transpose. Eigen uses that shortcut automatically.
- `Affine` (typedef `Affine3d`): also allows scaling and shearing, for example `Eigen::Translation3d(1, 2, 3) * Eigen::Scaling(2.0)`. Its inverse needs a real matrix inverse.
- `AffineCompact` (typedef `AffineCompact3d`): an affine transform stored as $3 \times 4$, without the constant bottom row. It is 96 bytes instead of 128.
- `Projective` (typedef `Projective3d`): a full $4 \times 4$, as used in camera projection.

For poses of rigid bodies, sensors and frames, `Isometry3d` is the right choice: it says in the type that nothing is stretched.

### Chaining frames

Name each transform after the two frames it connects: `T_world_body` takes a point measured in the body frame and returns the same point measured in the world frame. It is also "the pose of the body in the world". With that naming, chains read cleanly. The inner names match and cancel:

$$
T_{\text{world}\leftarrow\text{cam}} = T_{\text{world}\leftarrow\text{body}}\; T_{\text{body}\leftarrow\text{cam}}.
$$

::: example Where is the target the camera sees?
A camera is bolted to a vehicle 0.5 m forward and 0.2 m up from the body origin, turned so that its boresight (its own $+z$ axis) points along the body's $+x$. The vehicle sits at $(100, 200, 0)$ m in the world, yawed 90 degrees. The camera sees a target 10 m straight down its boresight.

```cpp fragment
#include <Eigen/Geometry>
#include <cmath>
#include <cstdio>

void print(const char* name, const Eigen::Vector3d& p) {
    std::printf("%-22s (%.3f, %.3f, %.3f)\n", name, p.x(), p.y(), p.z());
}

int main() {
    const double deg = M_PI / 180.0;

    // Camera bolted to the body: 0.5 m forward, 0.2 m up, turned so the
    // camera's boresight (+z) points along the body's +x.
    const Eigen::Isometry3d T_body_cam =
        Eigen::Translation3d(0.5, 0.0, 0.2) *
        Eigen::AngleAxisd(90 * deg, Eigen::Vector3d::UnitY());

    // The body itself: at (100, 200, 0) m in the world, yawed 90 degrees.
    const Eigen::Isometry3d T_world_body =
        Eigen::Translation3d(100.0, 200.0, 0.0) *
        Eigen::AngleAxisd(90 * deg, Eigen::Vector3d::UnitZ());

    const Eigen::Vector3d p_cam(0, 0, 10);       // a target 10 m down the boresight
    const Eigen::Vector3d p_body = T_body_cam * p_cam;
    const Eigen::Isometry3d T_world_cam = T_world_body * T_body_cam;
    const Eigen::Vector3d p_world = T_world_cam * p_cam;
    print("target in body:", p_body);
    print("target in world:", p_world);
    print("camera in world:", T_world_cam.translation());
    print("back into camera:", T_world_cam.inverse() * p_world);

    std::printf("T_world_cam as a 4x4 matrix:\n");
    const Eigen::Matrix4d M = T_world_cam.matrix();
    for (int i = 0; i < 4; ++i)
        std::printf("  %7.2f %7.2f %7.2f %7.2f\n", M(i, 0), M(i, 1), M(i, 2), M(i, 3));
}
```

Output:

```text
target in body:        (10.500, 0.000, 0.200)
target in world:       (100.000, 210.500, 0.200)
camera in world:       (100.000, 200.500, 0.200)
back into camera:      (0.000, 0.000, 10.000)
T_world_cam as a 4x4 matrix:
     0.00   -1.00    0.00  100.00
     0.00    0.00    1.00  200.50
    -1.00    0.00    0.00    0.20
     0.00    0.00    0.00    1.00
```

Follow it by hand. **Camera to body:** turning $(0, 0, 10)$ by 90 degrees about $y$ carries $+z$ to $+x$, giving $(10, 0, 0)$. Adding the mount offset gives $(10.5, 0, 0.2)$: 10 m ahead of the camera, which is 0.5 m ahead of the body origin. **Body to world:** the yaw turns $+x$ into $+y$, so $(10.5, 0, 0.2)$ becomes $(0, 10.5, 0.2)$. Adding the vehicle's position gives $(100, 210.5, 0.2)$.

**Sanity checks.** The camera itself sits at $(100, 200.5, 0.2)$, and the target is exactly 10 m from it along $+y$, the direction the yawed vehicle faces. And running the world point back through the inverse returns $(0, 0, 10)$, where we started. In the $4 \times 4$ matrix, the top-left $3 \times 3$ block is the combined rotation and the right column is the camera's position.
:::

::: warning Translation times rotation is not rotation times translation
`Eigen::Translation3d(t) * R` means "rotate, then move by $\mathbf{t}$", so the move is measured in the outer frame. `R * Eigen::Translation3d(t)` means "move by $\mathbf{t}$, then rotate everything, including the move". With a 90-degree yaw, the second version sends a 0.5 m forward offset off to the side. When a sensor lands in the wrong place in a simulation, check this order before anything else.
:::

## slerp: turning smoothly from one attitude to another

Picture a door swinging closed at a steady pace. Halfway through the time, it is halfway through the swing. That is what **slerp**, "spherical linear interpolation", does for orientations. `q0.slerp(t, q1)` returns the orientation a fraction `t` of the way from `q0` to `q1`, turning about one fixed axis at a constant angular rate. At `t = 0` it gives `q0`, at `t = 1` it gives `q1`.

It is used wherever software needs attitudes *between* known ones: a smooth attitude command for a slew, the attitude at a camera's exposure time between two star-tracker samples, or the frames of a visualization.

The name comes from the geometry. Unit quaternions live on the surface of a sphere in four dimensions. Slerp walks along the **[[great circle|great-circle]]** between two points at constant speed. The cheap alternative, **nlerp**, blends the four numbers in a straight line and then normalizes. It follows the same path but not at a constant rate.

::: example Slerp against nlerp for a 160-degree slew
```cpp fragment
#include <Eigen/Geometry>
#include <cmath>
#include <cstdio>

int main() {
    const double deg = M_PI / 180.0;
    const Eigen::Quaterniond q0 = Eigen::Quaterniond::Identity();
    const Eigen::Quaterniond q1(Eigen::AngleAxisd(160 * deg, Eigen::Vector3d::UnitZ()));

    std::printf("   t   slerp angle   nlerp angle\n");
    for (double t : {0.0, 0.25, 0.5, 0.75, 1.0}) {
        const Eigen::Quaterniond s = q0.slerp(t, q1);
        // nlerp: blend the four numbers in a straight line, then normalize.
        Eigen::Quaterniond n;
        n.coeffs() = (1 - t) * q0.coeffs() + t * q1.coeffs();
        n.normalize();
        std::printf("%5.2f   %8.2f      %8.2f\n", t,
                    Eigen::AngleAxisd(s).angle() / deg, Eigen::AngleAxisd(n).angle() / deg);
    }

    // q and -q are the same rotation; slerp takes the short way regardless.
    const Eigen::Quaterniond q1neg(-q1.w(), -q1.x(), -q1.y(), -q1.z());
    const Eigen::Quaterniond m = q0.slerp(0.5, q1neg);
    std::printf("halfway to -q1: %.2f deg\n", Eigen::AngleAxisd(m).angle() / deg);
}
```

Output:

```text
   t   slerp angle   nlerp angle
 0.00       0.00          0.00
 0.25      40.00         34.48
 0.50      80.00         80.00
 0.75     120.00        125.52
 1.00     160.00        160.00
halfway to -q1: 80.00 deg
```

Slerp moves exactly 40 degrees per quarter: $0.25 \times 160 = 40$, $0.5 \times 160 = 80$, $0.75 \times 160 = 120$. Nlerp hits the same endpoints and the same midpoint, but it starts slowly (34.48 degrees at the first quarter) and has to hurry to catch up (125.52 at the third). For a slew command, that uneven rate would ask the reaction wheels for accelerations nobody planned.

**Sanity check** on the last line. Negating all four numbers of a quaternion gives the **[[same rotation|double-cover]]**. A naive interpolation toward $-q_1$ would go the long way round, through 280 degrees. Eigen's slerp notices the sign and takes the short way, landing on the same 80 degrees.
:::

::: note Why it has to be true: slerp's formula
Let $\Omega$ (capital omega) be the angle between $q_0$ and $q_1$ as four-dimensional unit vectors, so $\cos\Omega = q_0 \cdot q_1$, the sum of the four products. Slerp is

$$
\mathrm{slerp}(q_0, q_1; t) = \frac{\sin\big((1 - t)\,\Omega\big)}{\sin\Omega}\,q_0 + \frac{\sin(t\,\Omega)}{\sin\Omega}\,q_1.
$$

Why these weights? Any point on the great circle through $q_0$ and $q_1$ is a combination $a\,q_0 + b\,q_1$. The point at angle $t\Omega$ from $q_0$ must make angle $t\Omega$ with $q_0$ and angle $(1 - t)\Omega$ with $q_1$, and have length 1. Solving those conditions gives exactly the two sine weights. The angle along the circle grows in step with $t$, so the rotation angle does too, at the constant rate the example showed.

The rotation angle is twice the quaternion angle ($\theta = 2\Omega$), because of the half-angle in $w = \cos(\theta/2)$. For the 160-degree slew, $\Omega = 80$ degrees. If $q_0 \cdot q_1 < 0$, the two are more than 90 degrees apart on the sphere, and flipping the sign of $q_1$ gives the same rotation by the shorter arc. That is the check Eigen makes.
:::

## Check yourself

::: check
Write the quaternion $(w, x, y, z)$ for a 60-degree rotation about the $x$ axis, and say what it does to the vector $(0, 1, 0)$.
:::

::: answer
The half-angle is 30 degrees. $w = \cos 30^\circ \approx 0.8660$, and the vector part is $\sin 30^\circ = 0.5$ times the axis $(1, 0, 0)$. So $q \approx (0.8660, 0.5, 0, 0)$. In Eigen: `Eigen::Quaterniond q(0.8660254, 0.5, 0, 0);` or, better, built from `Eigen::AngleAxisd(60 * deg, Eigen::Vector3d::UnitX())`.

Turning about $x$ by 60 degrees carries $y$ toward $z$: $(0, 1, 0)$ becomes $(0, \cos 60^\circ, \sin 60^\circ) \approx (0, 0.5, 0.866)$.
:::

::: check
A star-tracker driver produces `q_body_st`, the rotation from the star-tracker frame to the body frame. The attitude filter keeps `q_inertial_body`, from body to inertial. Which product gives the star tracker's orientation in the inertial frame: `q_inertial_body * q_body_st` or `q_body_st * q_inertial_body`?
:::

::: answer
`q_inertial_body * q_body_st`. A vector in the star-tracker frame must first go through `q_body_st` (into the body frame) and then through `q_inertial_body` (into the inertial frame). In Eigen the right-hand factor acts first, so the one that acts first goes on the right. The frame names also check it: the inner names, "body" and "body", sit next to each other and cancel, leaving "inertial from star tracker".
:::

::: check
An attitude propagator runs the first-order step at 200 Hz while the body turns at a steady 0.5 rad/s, and it never normalizes. How long is the quaternion after 60 s? Which one line fixes it, and where does it go?
:::

::: answer
The time step is $\Delta t = 1/200 = 0.005$ s. The step quaternion's vector part has size $\tfrac{1}{2} \times 0.5 \times 0.005 = 0.00125$, so each step multiplies the length by $\sqrt{1 + 0.00125^2}$. In 60 s there are $60 \times 200 = 12{,}000$ steps, so the length becomes $(1 + 0.00125^2)^{6000} \approx 1.0094$: almost 1% too long after one minute, and still growing.

The fix is `q.normalize();` right after each propagation step, inside the loop, so the quaternion never strays far from length 1. (Using `q = q.normalized();` does the same job with an extra copy.)
:::

::: check
You need the pose of a docking port, which is rigidly fixed 2 m along the body's $-z$ axis, in the world frame. Which Eigen type should hold `T_body_port`, and how would you build it?
:::

::: answer
`Eigen::Isometry3d`, because the port is a rigid offset: a translation and (if the port frame is turned relative to the body) a rotation, with no stretching. With the port frame aligned to the body:

`const Eigen::Isometry3d T_body_port = Eigen::Translation3d(0, 0, -2.0) * Eigen::Quaterniond::Identity();`

Then `T_world_port = T_world_body * T_body_port`, and its `translation()` is the port's position in the world. Do not use `Isometry3d T;` without initializing it: start from `Isometry3d::Identity()` or build it as above.
:::

::: check
Using slerp from the identity to a 90-degree rotation about $y$, what rotation do you get at $t = 1/3$? What would change if the target quaternion were stored with all four signs flipped?
:::

::: answer
Slerp turns at a constant rate about the fixed axis, so at $t = 1/3$ it gives $90 / 3 = 30$ degrees about $y$. Flipping all four signs describes the same 90-degree rotation. Eigen's slerp checks the sign of the dot product and takes the shorter arc, so it returns the same 30 degrees. A hand-written slerp without that check would head the long way round instead.
:::

## Summary

| Type or call | What it is | Remember |
|---|---|---|
| `AngleAxisd(angle, axis)` | turn by an angle about an axis | radians; axis must be unit length |
| `Quaterniond(w, x, y, z)` | four-number rotation | scalar first in the constructor; `coeffs()` is $x, y, z, w$ |
| `q * v`, `q1 * q2` | rotate a vector; compose | right-hand factor acts first |
| `normalize()`, `normalized()` | back to length 1 | in place, or a copy; do it after every propagation step |
| `Translation3d(x, y, z)` | a pure move | combine with a rotation |
| `Isometry3d` | rotation plus translation | $T\mathbf{p} = R\mathbf{p} + \mathbf{t}$; cheap inverse; start from `Identity()` |
| `Transform<double, 3, Mode>` | general transform | `Affine3d` allows scale and shear; `Projective3d` is full $4 \times 4$ |
| Frame naming | `T_a_b` maps frame b to frame a | `T_world_cam = T_world_body * T_body_cam` |
| `q0.slerp(t, q1)` | constant-rate turn between attitudes | shortest path; nlerp is cheaper but uneven |

The next lesson, *Quaternion element order*, looks hard at the one line in this lesson most likely to cause a real bug: the constructor takes $w$ first, but `coeffs()`, and the memory underneath it, put $w$ last.

::: context frames Frames, and who measures what
A **frame** is a set of three perpendicular axes with an origin: a ruler system someone has agreed on. GNC software juggles many. An inertial frame is fixed relative to the distant stars. The body frame is fixed to the vehicle, often with $x$ out the nose. Each sensor has its own frame, set by how it is mounted.

A vector like "the direction to the Sun" is the same arrow in every frame, but its three numbers are different in each. Most attitude bugs are a vector expressed in one frame being used as if it were in another. Naming every variable with its frame, as `p_body` or `T_world_cam`, is the cheapest defense there is.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="150" x2="130" y2="150" stroke="#1f2a44" stroke-width="2"/>
  <line x1="40" y1="150" x2="40" y2="60" stroke="#1f2a44" stroke-width="2"/>
  <text x="134" y="154" font-size="12" fill="#1f2a44">x</text>
  <text x="36" y="54" font-size="12" fill="#1f2a44">y</text>
  <text x="44" y="172" font-size="12" fill="#1f2a44">world</text>
  <line x1="220" y1="110" x2="284" y2="46" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="220" y1="110" x2="156" y2="46" stroke="#1d6fd1" stroke-width="2"/>
  <text x="288" y="44" font-size="12" fill="#1d6fd1">x body</text>
  <text x="120" y="42" font-size="12" fill="#1d6fd1">y body</text>
  <line x1="40" y1="150" x2="220" y2="110" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5,4"/>
  <circle cx="300" cy="140" r="6" fill="#b4232c"/>
  <text x="312" y="144" font-size="12" fill="#b4232c">Sun</text>
  <text x="160" y="140" font-size="11" fill="#6c7a93">body position</text>
</svg>
```
:::

::: context radians Why radians
A radian is the angle at which the arc along a circle is as long as the radius. A full turn is $2\pi \approx 6.283$ radians, so $180^\circ = \pi$ radians and one radian is about $57.3^\circ$.

Mathematics prefers radians because formulas come out clean in them: an arc is $r\theta$, and a small angle's sine is almost the angle itself. That is why C++'s `std::sin` and every Eigen rotation type take radians. Degrees belong at the edges of the program, where humans type or read them.
:::

::: context right-hand-rule Which way is positive
Point your right thumb along the rotation axis. Your fingers curl in the direction of a positive rotation. For the $z$ axis pointing at you out of the page, positive is counterclockwise, which is why 90 degrees about $z$ carries $x$ to $y$.

The same rule defines the axes themselves: $x$ along the thumb, $y$ along the index finger, $z$ along the middle finger. Eigen, and nearly all aerospace software, uses right-handed frames. A left-handed frame, often from a graphics library or a sensor datasheet, silently flips the sign of every rotation that crosses into it.
:::

::: context hamilton A formula carved into a bridge
The Irish mathematician William Rowan Hamilton discovered quaternions in 1843. The story, which he told himself, is that the key rule came to him while walking along a canal in Dublin, and he scratched it into the stone of Brougham Bridge:

$$
i^2 = j^2 = k^2 = ijk = -1.
$$

A quaternion is $w + xi + yj + zk$. For a century quaternions were mostly a mathematical curiosity. Spacecraft attitude software brought them back, because four numbers with one constraint describe any orientation without the singularities of three angles.
:::

::: context quat-integration Where the update step comes from
A body spinning with angular velocity $\boldsymbol{\omega}$ has a quaternion that changes as $\dot{q} = \tfrac{1}{2}\, q \otimes (0, \boldsymbol{\omega})$, when $\boldsymbol{\omega}$ is measured in the body frame. Take one small step of length $\Delta t$:

$$
q + \Delta t\,\dot{q} = q \otimes \left(1, \tfrac{1}{2}\boldsymbol{\omega}\,\Delta t\right).
$$

That is the update in the example. The quaternion $(1, \tfrac{1}{2}\boldsymbol{\omega}\,\Delta t)$ is slightly longer than 1, which is where the drift comes from. The exact step would be the unit quaternion for a turn of $|\boldsymbol{\omega}|\,\Delta t$, built with an `AngleAxisd`. Real propagators use that or a higher-order method, and normalize anyway.
:::

::: context homogeneous One matrix for a turn and a move
A $3 \times 3$ matrix can rotate, but it cannot move a point: it always sends the origin to the origin. The trick is to add a fourth coordinate, fixed at 1, to every point. Then one $4 \times 4$ matrix does both:

$$
\begin{bmatrix} R & \mathbf{t} \\ \mathbf{0}^T & 1 \end{bmatrix}
\begin{bmatrix} \mathbf{p} \\ 1 \end{bmatrix} =
\begin{bmatrix} R\mathbf{p} + \mathbf{t} \\ 1 \end{bmatrix}.
$$

These are **homogeneous coordinates**. Chaining transforms becomes plain matrix multiplication, which is why robotics and graphics use them everywhere.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="100" y="20" width="120" height="90" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5"/>
  <rect x="220" y="20" width="40" height="90" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="100" y="110" width="120" height="30" fill="#fff" stroke="#6c7a93" stroke-width="1.5"/>
  <rect x="220" y="110" width="40" height="30" fill="#fff" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="160" y="70" font-size="14" fill="#1f2a44" text-anchor="middle">R (3 x 3)</text>
  <text x="240" y="70" font-size="14" fill="#1f2a44" text-anchor="middle">t</text>
  <text x="160" y="130" font-size="12" fill="#6c7a93" text-anchor="middle">0 0 0</text>
  <text x="240" y="130" font-size="12" fill="#6c7a93" text-anchor="middle">1</text>
  <text x="20" y="70" font-size="12" fill="#1d6fd1">rotation</text>
  <text x="272" y="70" font-size="12" fill="#1f2a44">translation</text>
</svg>
```
:::

::: context great-circle The short way on a sphere
On a globe, the shortest route between two cities follows a **great circle**, a circle whose center is the center of the Earth. That is why flights from the US to Europe arc north over the Atlantic. Slerp does the same on the four-dimensional sphere of unit quaternions.

Nlerp instead cuts straight through the inside of the sphere along the chord, then pushes each point back out to the surface. The pushed-out points land on the same arc, but they crowd toward the ends, and the middle of the path is covered faster. In the picture, the chord's four equal steps (orange) project to the red points on the arc: the middle steps cover more angle than the outer ones.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <circle cx="180" cy="185" r="160" fill="none" stroke="#6c7a93" stroke-width="1"/>
  <path d="M29.6 130.3 A160 160 0 0 1 330.4 130.3" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="29.6" y1="130.3" x2="330.4" y2="130.3" stroke="#f2b880" stroke-width="2"/>
  <g fill="#f2b880"><circle cx="104.8" cy="130.3" r="4"/><circle cx="180" cy="130.3" r="4"/><circle cx="255.2" cy="130.3" r="4"/></g>
  <g stroke="#6c7a93" stroke-width="1" stroke-dasharray="3,3">
    <line x1="180" y1="185" x2="50.6" y2="90.9"/><line x1="180" y1="185" x2="180" y2="25"/><line x1="180" y1="185" x2="309.4" y2="90.9"/>
  </g>
  <g fill="#b4232c"><circle cx="50.6" cy="90.9" r="4.5"/><circle cx="180" cy="25" r="4.5"/><circle cx="309.4" cy="90.9" r="4.5"/></g>
  <circle cx="29.6" cy="130.3" r="5" fill="#1f2a44"/><circle cx="330.4" cy="130.3" r="5" fill="#1f2a44"/>
  <text x="14" y="150" font-size="12" fill="#1f2a44">q0</text>
  <text x="330" y="150" font-size="12" fill="#1f2a44">q1</text>
  <text x="192" y="30" font-size="12" fill="#1d6fd1">slerp arc</text>
  <text x="150" y="122" font-size="11" fill="#1f2a44">nlerp chord</text>
</svg>
```
:::

::: context double-cover Two quaternions, one rotation
The quaternions $q$ and $-q$ describe exactly the same rotation. Flipping every sign changes $\theta/2$ by 180 degrees, so $\theta$ changes by 360 degrees: a full extra turn, which ends where it started. Mathematicians say unit quaternions **double cover** the rotations.

It matters whenever quaternions are compared or blended. Two attitude estimates can agree perfectly while their four numbers have opposite signs. Tests should compare $|q_1 \cdot q_2|$ with 1, and interpolation or averaging should first flip one quaternion so the dot product is positive.
:::
