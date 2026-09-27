---
id: l07-nalgebra-geometry-and-neighbour-crates
title: 'Turning things in space: nalgebra geometry and its neighbours'
minutes: 28
covers:
  - 'nalgebra geometry: UnitQuaternion, Rotation3, Isometry3, slerp; no_std support'
  - 'Neighbouring crates: ndarray, argmin, nyx-space, hifitime, micromath, libm'
---

Hold a book flat on a table and turn it a quarter turn, the way the hands of a clock move from 12 to 3. The book is still the same book. Nothing got longer, shorter or bent. Only the way it *faces* changed. Now slide it 30 centimeters to the left without turning it. Again, same book; only *where* it is changed.

Turning and sliding are all a solid object can do, and a spacecraft is a solid object. Its guidance software keeps asking *which way is the vehicle facing* (its **attitude**) and *where is each part of it* (its **position**). A star tracker bolted to the side reports what it sees in its own frame; the software must turn and slide that report into the body frame, then into a frame fixed to the stars.

Lesson 06 gave you nalgebra's matrices. This lesson covers the types built on them for turning and sliding: **`UnitQuaternion`**, **`Rotation3`** and **`Isometry3`**, plus **slerp**, the smooth path from one attitude to another. Then it puts them on a microcontroller and meets the neighbouring crates a GNC engineer reaches for next.

Every program in this lesson was run with Rust 1.94.1 and nalgebra 0.35.0; the outputs shown are real.

## Why a rotation is not an ordinary matrix

In lesson 06 a `Matrix3<f64>` was nine numbers in a grid, and any nine numbers were allowed. A rotation is pickier. Turning a book never stretches it, so a matrix that describes a pure turn must keep every length the same and every right angle a right angle. A matrix with that property is called **[[orthonormal|orthonormal]]**: each column has length 1, and every pair of columns is at right angles. It must also have determinant $+1$, which rules out a mirror flip.

An ordinary `Matrix3` does not know that rule. If rounding or a careless update breaks it, the "rotation" starts stretching your vectors: a quiet bug where nothing crashes and the numbers drift.

nalgebra's answer is to make the rule part of the type. A **`Rotation3<f64>`** wraps a 3 × 3 matrix, and the only ways to build one (from an axis and an angle, from Euler angles, from a quaternion) produce a valid rotation. A **`UnitQuaternion<f64>`** is a quaternion that is guaranteed to have length 1. Because the type carries the promise, a function that takes a `UnitQuaternion` never has to check it again.

::: key
nalgebra's geometry types make the unit-quaternion invariant part of the type: a `UnitQuaternion` (and a `Rotation3`) can only be built in ways that produce a valid rotation, so code that receives one does not need to re-check it.
:::

## Quaternions in one page

A **quaternion** is four numbers. Written out, it looks like $q = w + x\,i + y\,j + z\,k$, read "w plus x i plus y j plus z k". The $w$ part is the **scalar** (plain number) part, and $(x, y, z)$ is the **vector** part. Irish mathematician William Rowan Hamilton **[[invented them|hamilton-bridge]]** in 1843; the rules are $i^2 = j^2 = k^2 = ijk = -1$.

You do not need the full algebra to use them. You need one recipe. To describe a turn by angle $\theta$ (read "theta") about a unit-length axis $\hat{\mathbf{n}}$ (read "n hat"):

$$
q = \left(\cos\tfrac{\theta}{2},\; \sin\tfrac{\theta}{2}\,\hat{\mathbf{n}}\right).
$$

Notice the **half angle**. A quarter turn, $\theta = 90^\circ$, about the $z$ axis gives $\cos 45^\circ = 0.7071$ and $\sin 45^\circ = 0.7071$, so

$$
q = (0.7071,\; 0,\; 0,\; 0.7071).
$$

Its length is $\sqrt{0.7071^2 + 0.7071^2} = 1$, as a unit quaternion must be. To rotate a vector $\mathbf{v}$, the algebra computes $q\,\mathbf{v}\,q^{*}$, where $q^{*}$ (read "q star", the **conjugate**) is $q$ with its vector part negated. nalgebra does that for you when you write `q * v`.

Why four numbers? Three angles (roll, pitch, yaw) run into **[[gimbal lock|gimbal-lock]]**, where two angles start describing the same motion. Nine matrix entries must obey six rules, which rounding slowly breaks. Four numbers with one rule (length 1) avoid both.

::: warning Two quaternions for every attitude
$q$ and $-q$ describe exactly the same rotation. This **[[double cover|double-cover]]** is harmless when you rotate vectors, but it bites when you compare or average quaternions: $q$ and $-q$ look as far apart as possible even though they are the same attitude. Compare attitudes with `angle_to`, not by subtracting the four numbers.
:::

## UnitQuaternion and Rotation3 in code

Here is a full program that builds, uses and combines quarter turns.

```rust
use nalgebra::{Rotation3, UnitQuaternion, Vector3};
use std::f64::consts::FRAC_PI_2;

fn main() {
    // A quarter turn (90 degrees) about the z axis.
    let q = UnitQuaternion::from_axis_angle(&Vector3::z_axis(), FRAC_PI_2);
    println!("w = {:.4}, i = {:.4}, j = {:.4}, k = {:.4}", q.w, q.i, q.j, q.k);

    // Rotate the x unit vector.
    let v = Vector3::new(1.0, 0.0, 0.0);
    let turned = q * v;
    println!("q * x = [{:.4}, {:.4}, {:.4}]", turned.x, turned.y, turned.z);

    // The same turn as a 3x3 rotation matrix.
    let r: Rotation3<f64> = q.to_rotation_matrix();
    println!("r * x = {:.4?}", (r * v).as_slice());

    // Angle and axis back out.
    println!("angle = {:.4} rad = {:.1} deg", q.angle(), q.angle().to_degrees());
    let axis = q.axis().unwrap();
    println!("axis = {:.4?}", axis.as_slice());

    // Composition: the right-hand factor acts first.
    let qx = UnitQuaternion::from_axis_angle(&Vector3::x_axis(), FRAC_PI_2);
    let y = Vector3::y();
    println!("(q * qx) * y = {:.4?}", ((q * qx) * y).as_slice());
    println!("(qx * q) * y = {:.4?}", ((qx * q) * y).as_slice());

    // Undo a rotation with its inverse.
    println!("q.inverse() * (q * x) = {:.4?}", (q.inverse() * turned).as_slice());
}
```

```text
w = 0.7071, i = 0.0000, j = 0.0000, k = 0.7071
q * x = [0.0000, 1.0000, 0.0000]
r * x = [0.0000, 1.0000, 0.0000]
angle = 1.5708 rad = 90.0 deg
axis = [0.0000, 0.0000, 1.0000]
(q * qx) * y = [-0.0000, 0.0000, 1.0000]
(qx * q) * y = [-1.0000, 0.0000, 0.0000]
q.inverse() * (q * x) = [1.0000, 0.0000, 0.0000]
```

Walk through it.

- `from_axis_angle` takes the axis as a `Unit<Vector3>` such as `Vector3::z_axis()`, and the angle in **radians**: `FRAC_PI_2` is $\pi/2$. The printed numbers match the recipe: $w = k = 0.7071$.
- `q * v` rotates the vector. The $x$ axis, turned a quarter turn about $z$, points along $y$. Picture looking down on the table: 3 o'clock swings to 12 o'clock.
- `to_rotation_matrix()` gives a `Rotation3` that rotates `v` to the same place. The matrix form is cheaper for rotating many vectors; the quaternion form is better for storing, composing and propagating attitude.
- `angle()` returns the turn angle, always between 0 and $\pi$; `axis()` returns an `Option`, because the identity (no turn) has no axis.
- The `-0.0000` is a rounding error of about $-2 \times 10^{-16}$.

::: key
`q * v` rotates a vector. In a product `q1 * q2`, the right-hand factor `q2` acts first, then `q1`. The inverse `q.inverse()` (the conjugate, for a unit quaternion) undoes the turn.
:::

::: example Order matters: two quarter turns
Take the $y$ axis, $(0, 1, 0)$, and apply a quarter turn about $x$ (called `qx`) and a quarter turn about $z$ (called `q`).

**`q * qx`: `qx` first.** Turning about $x$ swings $y$ up to $z$: $(0, 1, 0) \to (0, 0, 1)$. Then turning about $z$ leaves anything on the $z$ axis where it is. Result: $(0, 0, 1)$.

**`qx * q`: `q` first.** Turning about $z$ swings $y$ to $-x$: $(0, 1, 0) \to (-1, 0, 0)$. Then turning about $x$ leaves anything on the $x$ axis alone. Result: $(-1, 0, 0)$.

Both match the program. Same two turns, different order, answers $90^\circ$ apart. Rotations in three dimensions do not **commute** (the order changes the answer). Try it with a phone: tip then twist, versus twist then tip.
:::

::: warning Conventions are not universal
nalgebra follows the **Hamilton convention** and treats `q * v` as actively turning the vector. It stores the four numbers in the order $(i, j, k, w)$, with $w$ last, but `Quaternion::new(w, i, j, k)` takes $w$ first. Some aerospace software and papers use the **[[JPL convention|quaternion-conventions]]**, which multiplies in a different order, and many write $w$ last. When you pass quaternions between nalgebra and another tool, test the hand-off with a known turn, such as the quarter turn above, before trusting it.
:::

## Isometry3: turning and sliding together

Back to the book. A full description of where a solid object sits needs both a turn and a slide. nalgebra calls that combination an **[[isometry|isometry-word]]**: a move that keeps all distances the same. An **`Isometry3<f64>`** holds a `UnitQuaternion` (the turn) and a `Translation3` (the slide), and applies them in that order: turn first, then slide. Engineers call this a **pose**.

This is where one of nalgebra's quiet good ideas shows up. It has two different types for "three numbers":

- **`Point3`** is a *place*, like the tip of an antenna. Moving the frame moves where the place appears, so an isometry turns it **and** slides it.
- **`Vector3`** is a *direction* or a *difference between places*, like the direction the antenna points. Sliding does not change a direction, so an isometry only turns it.

Pick the type on purpose: the answer depends on it.

::: example Where the star tracker's boresight lands
A star tracker is mounted 0.5 m along the spacecraft body $x$ axis and turned a quarter turn about body $z$. Its **boresight** (the line it looks along) is its own $x$ axis. Find, in the body frame, a point 2 m out along the boresight and the boresight direction itself.

```rust
use nalgebra::{Isometry3, Point3, Translation3, UnitQuaternion, Vector3};
use std::f64::consts::FRAC_PI_2;

fn main() {
    // Pose of a star tracker in the spacecraft body frame:
    // mounted 0.5 m along body x, turned 90 degrees about body z.
    let rot = UnitQuaternion::from_axis_angle(&Vector3::z_axis(), FRAC_PI_2);
    let body_from_tracker = Isometry3::from_parts(Translation3::new(0.5, 0.0, 0.0), rot);

    // A point 2 m straight out along the tracker's own x axis ...
    let p_tracker = Point3::new(2.0, 0.0, 0.0);
    // ... and a direction (a unit vector) along the same axis.
    let d_tracker = Vector3::new(1.0, 0.0, 0.0);

    let p_body = body_from_tracker * p_tracker; // rotated AND shifted
    let d_body = body_from_tracker * d_tracker; // rotated only
    println!("point in body     = {:.3?}", p_body.coords.as_slice());
    println!("direction in body = {:.3?}", d_body.as_slice());

    // Going back the other way.
    let tracker_from_body = body_from_tracker.inverse();
    println!("back in tracker   = {:.3?}", (tracker_from_body * p_body).coords.as_slice());
}
```

```text
point in body     = [0.500, 2.000, 0.000]
direction in body = [0.000, 1.000, 0.000]
back in tracker   = [2.000, 0.000, 0.000]
```

Step by step for the point: the turn sends $(2, 0, 0)$ to $(0, 2, 0)$, a quarter turn about $z$. The slide adds $(0.5, 0, 0)$, giving $(0.5, 2, 0)$. For the direction: the turn sends $(1, 0, 0)$ to $(0, 1, 0)$, and there is no slide. The inverse brings the point home to $(2, 0, 0)$. Sanity check: the point is still 2 m from the tracker at $(0.5, 0, 0)$, as an isometry promises.
:::

Name poses the way this example does, `body_from_tracker`, so the frames read like a chain: `inertial_from_body * body_from_tracker` gives `inertial_from_tracker`, and the inner names cancel. That naming habit prevents more frame bugs than any library feature.

## slerp: the smooth way from one attitude to another

A spacecraft must slew from one star to another, and the controller wants a series of in-between attitudes. A weighted average of the two quaternions is no longer length 1, and even after dividing by the length it does not turn at a steady rate.

Picture all unit quaternions as points on the surface of a ball (in four dimensions, but the picture works in three). The two attitudes are two points on that surface. Averaging cuts straight through the inside of the ball. What you want is to walk along the surface, on the great-circle arc, at a steady pace. That is **[[slerp|slerp-origin]]**, "spherical linear interpolation". With $t$ running from 0 to 1 and $\Omega$ (read "omega", capital) the angle between the two quaternions as four-dimensional vectors, $\cos\Omega = q_0 \cdot q_1$:

$$
\operatorname{slerp}(q_0, q_1, t) = \frac{\sin\big((1-t)\,\Omega\big)}{\sin\Omega}\,q_0 + \frac{\sin(t\,\Omega)}{\sin\Omega}\,q_1 .
$$

At $t = 0$ the first weight is 1 and the second is 0, so you get $q_0$. At $t = 1$ you get $q_1$. In between, the attitude turns at a constant rate about a fixed axis, which is exactly what a smooth slew wants.

nalgebra also has **`nlerp`**: the straight-line average, divided by its length. It is cheaper and lands on the right endpoints, but its pace is uneven.

::: example slerp versus nlerp over a 120-degree slew
Slew from the identity to a 120° turn about $z$, and sample five points.

```rust
use nalgebra::{UnitQuaternion, Vector3};

fn main() {
    let start = UnitQuaternion::identity();
    let end = UnitQuaternion::from_axis_angle(&Vector3::z_axis(), 120f64.to_radians());

    for t in [0.0, 0.25, 0.5, 0.75, 1.0] {
        let s = start.slerp(&end, t);
        let n = start.nlerp(&end, t);
        println!(
            "t = {t:.2}: slerp {:6.2} deg, nlerp {:6.2} deg",
            s.angle().to_degrees(),
            n.angle().to_degrees()
        );
    }

    // try_slerp returns None instead of panicking in the ambiguous case.
    match start.try_slerp(&end, 0.5, 1.0e-9) {
        Some(mid) => println!("midpoint angle = {:.2} deg", mid.angle().to_degrees()),
        None => println!("no well-defined path"),
    }
}
```

```text
t = 0.00: slerp   0.00 deg, nlerp   0.00 deg
t = 0.25: slerp  30.00 deg, nlerp  27.80 deg
t = 0.50: slerp  60.00 deg, nlerp  60.00 deg
t = 0.75: slerp  90.00 deg, nlerp  92.20 deg
t = 1.00: slerp 120.00 deg, nlerp 120.00 deg
```

```text
midpoint angle = 60.00 deg
```

slerp moves exactly 30° per quarter step: $0.25 \times 120 = 30$. nlerp starts slow (27.80° instead of 30°) and runs fast in the middle. Where does 27.80° come from? The two quaternions are $(1, 0, 0, 0)$ and $(\cos 60^\circ, 0, 0, \sin 60^\circ) = (0.5, 0, 0, 0.866)$. The straight-line mix at $t = 0.25$ is $0.75(1, 0, 0, 0) + 0.25(0.5, 0, 0, 0.866) = (0.875, 0, 0, 0.2165)$. Its turn angle is $2\arctan(0.2165/0.875) = 27.80^\circ$. The error grows with the slew angle, so nlerp is fine between two nearby filter updates, and slerp is the tool for planning a large slew.
:::

nalgebra's `slerp` handles the double cover: if the dot product is negative, it flips one quaternion so the path goes the short way round. Its documentation says `slerp` panics when it cannot pick a path; `try_slerp` returns an `Option` instead. Flight code should not panic on data, so prefer `try_slerp`.

## Propagating attitude from a gyro

A gyro reports the body rate $\boldsymbol{\omega}$ (read "omega", in rad/s) every time step $\Delta t$. You want to update the attitude quaternion each step.

The textbook equation is $\dot{q} = \tfrac{1}{2}\,q \otimes (0, \boldsymbol{\omega})$, read "q dot equals one half q times the pure quaternion omega". The tempting code takes one small step along that slope, $q \leftarrow q + \tfrac{1}{2} q \otimes (0,\boldsymbol{\omega})\,\Delta t$. Each such step makes the length a little bigger than 1.

The better way: over one step the body turns by the small rotation vector $\boldsymbol{\omega}\,\Delta t$ (angle $|\boldsymbol{\omega}|\Delta t$ about the axis of $\boldsymbol{\omega}$). Build that small turn as an exact unit quaternion and multiply it on. nalgebra's `UnitQuaternion::from_scaled_axis(w * dt)` does exactly that: it reads the vector's direction as the axis and its length as the angle. This is the **[[exponential map|exponential-map]]**; every factor is a true unit quaternion, so the result stays length 1 up to rounding.

::: example Sixty seconds of spin, two ways
A body spins at 0.5 rad/s about $z$, sampled at 100 Hz ($\Delta t = 0.01$ s) for 60 s (6,000 steps).

```rust
use nalgebra::{Quaternion, UnitQuaternion, Vector3};

fn main() {
    let w = Vector3::new(0.0, 0.0, 0.5); // rad/s, spin about body z
    let dt = 0.01; // s, a 100 Hz loop
    let steps = 6000; // 60 s

    // Method 1: exponential map, stays a unit quaternion by construction
    let mut q_exp = UnitQuaternion::identity();
    // Method 2: naive first-order step on a raw Quaternion, no renormalizing
    let mut q_raw = Quaternion::identity();
    let w_quat = Quaternion::from_imag(w);

    for _ in 0..steps {
        q_exp = q_exp * UnitQuaternion::from_scaled_axis(w * dt);
        q_raw = q_raw + q_raw * w_quat * (0.5 * dt);
    }

    println!("exp map : angle = {:.6} rad, norm - 1 = {:e}", q_exp.angle(), q_exp.norm() - 1.0);
    println!("naive   : norm - 1 = {:e}", q_raw.norm() - 1.0);
}
```

```text
exp map : angle = 1.415927 rad, norm - 1 = -6.439293542825908e-14
naive   : norm - 1 = 1.8926825349530052e-2
```

**The angle.** Total turn $= 0.5 \times 60 = 30$ rad. Take away whole turns: $30 - 4 \times 2\pi = 4.867$ rad. `angle()` reports the shortest equivalent turn, between 0 and $\pi$, so it gives $2\pi - 4.867 = 1.416$ rad. That matches.

**The naive length.** Each naive step multiplies the length by $\sqrt{1 + (\omega\Delta t/2)^2} = \sqrt{1 + 0.0025^2}$, about $1 + 3.1 \times 10^{-6}$. Over 6,000 steps that compounds to $1.0189$: an error of 1.89%, exactly what the program printed. The exponential map stayed within $10^{-13}$ of 1. Sanity check: a 2% length error means every vector rotated with that quaternion comes out about 4% too long, since the sandwich $q\,\mathbf{v}\,q^*$ uses $q$ twice. That is far too much for a star tracker's arc-second world.
:::

::: warning Right-multiply for body rates
A gyro measures rates in the **body** frame, so the small turn goes on the right: `q = q * dq`, where `q` takes body vectors to the reference frame. Putting it on the left (`dq * q`) applies the turn about the reference axes instead. When every turn is about the same axis, as in a simple spin test, the two agree, which is why this bug survives easy tests; for tumbling motion they do not.
:::

## Using the geometry types with no_std

Every type in this lesson has a size fixed at compile time: `UnitQuaternion<f64>` is four `f64`s, `Isometry3<f64>` is seven. None touch the heap, so they fit a microcontroller.

To use nalgebra in a `#![no_std]` crate, turn off its default `std` feature. One more step surprises people. The trigonometry inside `from_axis_angle` and `from_scaled_axis` (sine, cosine, square root) normally comes from `std`. Without `std` there is nothing to call, and the build fails with an error saying `f32` does not satisfy the trait `SimdRealField`. The fix is nalgebra's `libm` feature, which gets those functions from the pure-Rust `libm` crate instead:

```toml
[dependencies]
nalgebra = { version = "0.35", default-features = false, features = ["libm"] }
```

```rust
#![no_std]

use nalgebra::{UnitQuaternion, Vector3};

/// One attitude step: rotate by body rate `w` (rad/s) for `dt` seconds.
pub fn step(q: UnitQuaternion<f32>, w: Vector3<f32>, dt: f32) -> UnitQuaternion<f32> {
    q * UnitQuaternion::from_scaled_axis(w * dt)
}
```

This library builds with `cargo build --release --target thumbv7em-none-eabihf`. There is also a `libm-force` feature, which uses `libm` even when `std` is on, so the host tests and the chip run the very same math routines. Leaving out `std` leaves out `DMatrix` and `DVector` too, since they need a heap; nalgebra's `alloc` feature brings them back if you have an allocator, but a flight filter should not.

::: key
nalgebra allocates only for dynamically sized types (`DMatrix`, `DVector`). Use the statically sized `SMatrix`, `SVector`, `Matrix3`, `Vector3` and `UnitQuaternion` families, and build for a no_std target with no allocator so an accidental dynamic type fails to link. On no_std, enable `default-features = false, features = ["libm"]`.
:::

## The neighbouring crates

Six other crates come up again and again around GNC work in Rust. Each has a clear job.

**ndarray** gives you N-dimensional arrays, the Rust cousin of **[[NumPy|numpy-bridge]]**. Use it for ground-side data, such as 10,000 Monte Carlo runs by 50 channels, where sizes come from a file at run time. nalgebra is for small, known shapes; ndarray is for large arrays of data.

**argmin** is a framework for numerical optimization: finding the inputs that make a cost function smallest. It offers standard solvers (gradient descent, BFGS, Nelder–Mead and others) behind one interface, for jobs like fitting a model to test data.

**nyx-space** is an astrodynamics library: orbit propagation with force models, and orbit determination, on the ground. Read its **[[license|agpl-license]]** first: it is AGPL-3.0-or-later.

**hifitime** handles time the way space missions need: many **time scales** (UTC, TAI, GPS time, TT, TDB and more), leap seconds, and nanosecond precision. It can be built without `std`.

**micromath** is a small `no_std` library of fast, *approximate* `f32` math (sine, square root, arctangent and so on), built for tiny chips where code size matters more than the last digits.

**libm** is a pure-Rust port of **[[musl's|musl-libm]]** C math library. It gives `no_std` code real, accurate `sin`, `cos`, `sqrt` and friends. nalgebra's `libm` feature uses it.

::: example Approximate versus accurate, and three clocks at once
This host program (micromath 2.1.0, libm 0.2.16, hifitime 4.3.1) compares the two sine routines and asks hifitime what time it is in three time scales at the start of 2026.

```rust
use hifitime::{Epoch, TimeScale};
use micromath::F32Ext;

fn main() {
    let x: f32 = 0.5;
    let fast = F32Ext::sin(x); // micromath approximation
    let exact = libm::sinf(x); // correctly behaved libm port
    println!("micromath sin(0.5) = {fast}");
    println!("libm      sin(0.5) = {exact}");
    println!("difference         = {:e}", (fast - exact).abs());

    let t = Epoch::from_gregorian_utc_at_midnight(2026, 1, 1);
    println!("{t}");
    println!("{}", t.to_time_scale(TimeScale::TAI));
    println!("{}", t.to_time_scale(TimeScale::GPST));
    println!("TAI - UTC = {}", t.leap_seconds(true).unwrap());
}
```

```text
micromath sin(0.5) = 0.47932893
libm      sin(0.5) = 0.47942555
difference         = 9.661913e-5
2026-01-01T00:00:00 UTC
2026-01-01T00:00:37 TAI
2026-01-01T00:00:18 GPST
TAI - UTC = 37
```

The true value is $\sin 0.5 = 0.479426$. libm matches it to the last printed digit. micromath is off by about $9.7 \times 10^{-5}$, a relative error of about 0.02%. That is fine for turning a status LED's brightness smoothly and not fine inside an attitude filter. `F32Ext::sin(x)` is written out in full because Rust's own `f32` also has a `sin` method on the host, and the full name picks micromath's.

The clocks: UTC midnight is 37 s later on the TAI clock, because of **[[leap seconds|leap-seconds]]**, and 18 s later on the GPS clock, because GPS time started 19 s behind TAI and never adds leap seconds: $37 - 19 = 18$.
:::

## Check yourself

::: check
Write the unit quaternion, as $(w, x, y, z)$ to four decimals, for a turn of $60^\circ$ about the $x$ axis. What does nalgebra's `angle()` report for it, in degrees?
:::

::: answer
Half the angle is $30^\circ$. $\cos 30^\circ = 0.8660$ and $\sin 30^\circ = 0.5$, and the axis is $(1, 0, 0)$, so $q = (0.8660, 0.5000, 0, 0)$. Its length is $\sqrt{0.75 + 0.25} = 1$. `angle()` reports the full turn, $60^\circ$ (1.0472 rad), not the half angle.
:::

::: check
An isometry turns by a quarter turn about $z$ and then slides by $(0, 0, 3)$ m. Apply it to the point $(1, 0, 0)$ and to the vector $(1, 0, 0)$. Why are the answers different?
:::

::: answer
The turn sends $(1, 0, 0)$ to $(0, 1, 0)$ for both. The point is then slid by $(0, 0, 3)$, giving $(0, 1, 3)$. The vector is a direction, and sliding does not change a direction, so it stays $(0, 1, 0)$. In nalgebra the first is a `Point3` and the second a `Vector3`; the type decides whether the translation applies.
:::

::: check
Using the slerp formula, compute the weights on $q_0$ and $q_1$ at $t = 0.5$ when $\Omega = 60^\circ$. Why are they not 0.5 each?
:::

::: answer
Each weight is $\sin(30^\circ)/\sin(60^\circ) = 0.5/0.8660 = 0.5774$. They add to more than 1 because a straight-line mix of two points on a sphere lands inside the sphere; the extra weight pushes the result back out onto the surface, so it is still length 1. Check: the midpoint of $(1, 0, 0, 0)$ and $(0.5, 0, 0, 0.866)$ with weights 0.5774 is $(0.8660, 0, 0, 0.5)$, whose length is 1 and whose turn angle is $60^\circ$, half of a $120^\circ$ slew.
:::

::: check
A `no_std` crate with `nalgebra = { version = "0.35", default-features = false }` fails to build as soon as you call `UnitQuaternion::from_scaled_axis` with `f32`. What is missing, and why?
:::

::: answer
The `libm` feature. `from_scaled_axis` needs sine, cosine and square root. With `std` turned off, nalgebra has nowhere to get them unless its `libm` feature is on, so `f32` does not meet the `SimdRealField` trait bound. Add `features = ["libm"]`.
:::

::: check
Match each job to a crate: (a) propagate a spacecraft orbit with force models on the ground; (b) convert a GPS timestamp to UTC across a leap second; (c) fit six model parameters to test-stand data; (d) accurate `atan2` on a Cortex-M with no `std`.
:::

::: answer
(a) nyx-space, an astrodynamics library (check its AGPL license first). (b) hifitime, which knows the time scales and the leap-second table. (c) argmin, the optimization framework. (d) libm, the pure-Rust port of musl's math library; micromath would give only an approximation.
:::

## Summary

| Type or crate | What it is | The fact to remember |
|---|---|---|
| `UnitQuaternion<f64>` | Attitude as four numbers, length 1 by type | $q = (\cos\frac{\theta}{2}, \sin\frac{\theta}{2}\hat{\mathbf{n}})$; $q$ and $-q$ are the same attitude |
| `Rotation3<f64>` | A 3 × 3 matrix guaranteed to be a rotation | Cheaper for rotating many vectors |
| `q1 * q2` | Composition | Right-hand factor acts first; order matters |
| `Isometry3<f64>` | Pose: turn then slide | Moves a `Point3`; only turns a `Vector3` |
| `slerp` / `try_slerp` | Constant-rate path between attitudes | Short way round; `try_slerp` returns `Option` |
| `from_scaled_axis(w * dt)` | Exact small turn from a body rate | Right-multiply; norm stays at 1 up to rounding |
| no_std | `default-features = false, features = ["libm"]` | Static types never allocate |
| ndarray, argmin, nyx-space | Arrays, optimization, astrodynamics | Ground-side tools; nyx-space is AGPL |
| hifitime, micromath, libm | Time scales, fast approximate math, accurate math | TAI − UTC = 37 s; micromath is approximate |

You now have the tools to write attitude code that could run on a flight computer. The next lesson asks the harder question: what evidence would a certification authority want before that code is allowed to fly, and how do DO-178C and ECSS-Q-ST-80C decide how much evidence is enough?

::: context orthonormal What "orthonormal" means
"Ortho" is Greek for straight or right, as in a right angle; "normal" here means scaled to length 1. An orthonormal matrix has columns that are each length 1 and all at right angles to one another. Those columns are where the $x$, $y$ and $z$ axes end up after the turn, so the rule says: a turn keeps the axes the same length and square to each other. A determinant of $+1$ rather than $-1$ says the axes kept their handedness, so the turn is not secretly a mirror.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <g transform="translate(80,120)">
    <line x1="0" y1="0" x2="80" y2="0" stroke="#1d6fd1" stroke-width="2.5"/>
    <line x1="0" y1="0" x2="0" y2="-80" stroke="#b4232c" stroke-width="2.5"/>
    <text x="84" y="4" font-size="12" fill="#1f2a44">x</text>
    <text x="-4" y="-86" font-size="12" fill="#1f2a44">y</text>
    <text x="0" y="24" font-size="12" fill="#1f2a44">before</text>
  </g>
  <g transform="translate(250,120)">
    <line x1="0" y1="0" x2="69.3" y2="-40" stroke="#1d6fd1" stroke-width="2.5"/>
    <line x1="0" y1="0" x2="-40" y2="-69.3" stroke="#b4232c" stroke-width="2.5"/>
    <text x="73" y="-42" font-size="12" fill="#1f2a44">x'</text>
    <text x="-54" y="-72" font-size="12" fill="#1f2a44">y'</text>
    <text x="-30" y="24" font-size="12" fill="#1f2a44">after a 30° turn</text>
  </g>
  <text x="180" y="20" font-size="12" text-anchor="middle" fill="#6c7a93">same lengths, still at right angles</text>
</svg>
```
:::

::: context hamilton-bridge Carved into a bridge
Hamilton had spent years trying to multiply triples of numbers the way complex numbers multiply pairs. The answer came to him on 16 October 1843 while he walked along the Royal Canal in Dublin: it takes four numbers, not three, with $i^2 = j^2 = k^2 = ijk = -1$. He scratched the formula into the stone of Brougham (Broome) Bridge, and a plaque there marks the spot today. For a century quaternions were mostly a mathematician's tool; the space age, with its need for attitude that never hits a singularity, made them an everyday engineering one.
:::

::: context gimbal-lock When three angles lose one
Describe attitude as yaw, then pitch, then roll. Now pitch the nose straight up, $90^\circ$. The yaw axis and the roll axis now line up, so turning either one does the same thing, and one direction of motion can no longer be described by a small change in the angles. Near that pose the math divides by something close to zero and the angle rates blow up. The name comes from mechanical gyroscope platforms with nested rings, called gimbals; the Apollo guidance platform had to be kept away from its lock orientation. Quaternions have no such pose.
:::

::: context double-cover Why every turn has two quaternions
Walk once around a circle and you are back where you started. For quaternions, the half angle means that a $360^\circ$ turn gives $\cos 180^\circ = -1$: the quaternion has gone only halfway round its own circle, to $-q$, even though the object is back where it began. A second full turn brings the quaternion home. So quaternion space wraps twice around the space of attitudes, and $q$ and $-q$ sit on opposite sides of the same attitude.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <circle cx="180" cy="85" r="60" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="240" cy="85" r="6" fill="#1d6fd1"/>
  <circle cx="120" cy="85" r="6" fill="#1d6fd1"/>
  <text x="252" y="89" font-size="12" fill="#1f2a44">q (0° turn)</text>
  <text x="18" y="89" font-size="12" fill="#1f2a44">−q (360° turn)</text>
  <circle cx="180" cy="25" r="5" fill="#f2b880" stroke="#1f2a44"/>
  <text x="190" y="20" font-size="11" fill="#1f2a44">180° turn</text>
  <text x="180" y="165" font-size="12" text-anchor="middle" fill="#6c7a93">two points, one attitude</text>
</svg>
```
:::

::: context quaternion-conventions Hamilton, JPL and the order of the four numbers
Two families of quaternion conventions are in wide use. The Hamilton convention, used by nalgebra, Eigen and most robotics code, keeps Hamilton's rule $ij = k$. The JPL convention, common in spacecraft attitude literature, defines $ij = -k$ instead, which reverses the order in which products must be written. Separately, authors disagree on whether the scalar part comes first or last, and on whether a quaternion turns a vector or turns the frame. Mixing any two of these silently gives the inverse rotation or a scrambled one. A one-line unit test with a known quarter turn catches all of them.
:::

::: context isometry-word Same measure
"Isometry" is Greek: *isos*, equal, and *metron*, measure. An isometry is any move that leaves every distance measured the same. For solid objects in three dimensions, the ones without a mirror flip are exactly the turns and slides, which is why nalgebra's `Isometry3` is a rotation plus a translation. Robotics and graphics people usually call the same thing a rigid transform or a pose.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <rect x="30" y="60" width="70" height="40" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="65" y="120" font-size="11" text-anchor="middle" fill="#1f2a44">start</text>
  <line x1="110" y1="80" x2="190" y2="60" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="150" y="55" font-size="11" text-anchor="middle" fill="#6c7a93">turn, then slide</text>
  <g transform="translate(260,60) rotate(-30)">
    <rect x="-35" y="-20" width="70" height="40" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  </g>
  <text x="260" y="120" font-size="11" text-anchor="middle" fill="#1f2a44">same shape, same size</text>
</svg>
```
:::

::: context slerp-origin Where slerp came from
The name and the quaternion form of slerp were introduced to computer graphics by Ken Shoemake in a 1985 SIGGRAPH paper on animating rotations with quaternion curves. Animators needed a camera or a character to turn smoothly between key poses; spacecraft planners need the same thing for a slew. The formula itself is older geometry: it is the way to walk at constant speed along a great circle between two points on any sphere.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <path d="M 90 130 A 110 110 0 0 1 270 130" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="90" y1="130" x2="270" y2="130" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 4"/>
  <circle cx="90" cy="130" r="5" fill="#1f2a44"/>
  <circle cx="270" cy="130" r="5" fill="#1f2a44"/>
  <text x="90" y="152" font-size="12" text-anchor="middle" fill="#1f2a44">q0</text>
  <text x="270" y="152" font-size="12" text-anchor="middle" fill="#1f2a44">q1</text>
  <text x="180" y="44" font-size="12" text-anchor="middle" fill="#1d6fd1">slerp: along the surface</text>
  <text x="180" y="124" font-size="12" text-anchor="middle" fill="#b4232c">plain average: through the inside</text>
</svg>
```
:::

::: context exponential-map Why "exponential"
For ordinary numbers, $e^{a}e^{b} = e^{a+b}$ turns adding into multiplying. Quaternions have an exponential too, and $\exp$ of the pure quaternion $(0, \boldsymbol{\omega}\Delta t/2)$ is exactly $(\cos\frac{|\boldsymbol{\omega}|\Delta t}{2}, \sin\frac{|\boldsymbol{\omega}|\Delta t}{2}\,\hat{\boldsymbol{\omega}})$, a unit quaternion for the small turn. The naive step keeps only the first two terms of the exponential's series, $1 + x$, which is why its length creeps up. Rotation vector, scaled axis and axis-angle vector all name the same input: axis as direction, angle as length.
:::

::: context numpy-bridge If you know NumPy
ndarray's `Array2<f64>` plays the role of a two-dimensional NumPy array: a shape known at run time, data on the heap, slicing with views instead of copies. The big difference is that Rust checks element types at compile time and has no hidden conversions. If you have done the Python track's array work, ndarray will feel familiar within an afternoon; it is the natural home for batch post-processing of simulation output written in Rust.
:::

::: context agpl-license What AGPL asks of you
AGPL-3.0 is a "copyleft" license. It lets anyone use, change and share the code, but if you distribute a program built on it, or let people use a modified version over a network, you must offer them the source code of your whole program under the same license. For a hobby project that is often fine. For a company whose trajectory tools are proprietary, it is a legal question to settle with lawyers before a single line depends on the crate. Checking licenses is part of an engineer's job, not an afterthought.
:::

::: context musl-libm A math library with a long pedigree
musl is a small C standard library for Linux, and its math part descends from the FreeBSD and Sun math libraries of the 1990s, which were written with great care about accuracy. The Rust `libm` crate translates those routines into Rust, so they need no operating system and no C compiler. That is why it is the usual source of `sin` and `sqrt` for `no_std` Rust, including inside nalgebra when you turn on its `libm` feature.
:::

::: context leap-seconds Why clocks disagree by whole seconds
TAI (International Atomic Time) ticks steadily from atomic clocks. UTC, the time on your phone, is kept within a second of Earth's actual rotation, which slows irregularly, so now and then a leap second is inserted. Since the start of 2017, TAI has been 37 s ahead of UTC. GPS time was set equal to UTC in January 1980, when UTC was 19 s behind TAI, and has never added a leap second since. A navigation system that mixes the scales can be off by tens of seconds, which at orbital speed of about 7.7 km/s is well over a hundred kilometers.
:::
