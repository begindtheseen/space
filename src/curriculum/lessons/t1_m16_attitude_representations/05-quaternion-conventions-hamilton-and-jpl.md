---
id: l05-quaternion-conventions-hamilton-and-jpl
title: Quaternions: Hamilton against JPL, scalar-first against scalar-last
minutes: 20
covers:
  - 'quaternions: Hamilton vs JPL, scalar-first vs scalar-last'
---

A unit quaternion is four numbers that encode a rotation, and it is the representation almost all flight software carries. It has no singularity, it composes with sixteen multiplications instead of twenty-seven, it renormalises with one square root, and it interpolates smoothly. Lessons 06 through 08 develop the algebra. This lesson comes first because it covers the part that actually breaks missions: which four numbers, in which order, obeying which multiplication rule, describing which rotation in which direction.

There is no universal answer. Two well-established, mutually incompatible conventions are in wide use, along with two storage orders that can be paired with either, and two directions the rotation can be taken to run. The combinations are not interchangeable and they are not detectable by any structural test: a quaternion from the wrong convention still has unit norm, and the rotation matrix built from it is still orthonormal with determinant $+1$. Everything downstream keeps working and points somewhere else.

Mixing quaternion conventions is the single most common real-world bug in attitude software. It is common because nothing catches it, because it is silent near the identity attitude where most unit tests live, and because the two communities that meet on a spacecraft — the robotics and graphics world on one side, the spacecraft attitude determination world on the other — settled on opposite choices decades ago and both are right within their own literature.

## The unit quaternion

Start from the principal axis and angle of lesson 04. A unit quaternion is the pair

$$
q = \bigl[\,\cos(\Phi/2),\ \hat{\mathbf{e}}\sin(\Phi/2)\,\bigr] = [\,w,\ \mathbf{v}\,],
\qquad
\lVert q\rVert^2 = w^2 + \mathbf{v}^\top\mathbf{v} = 1 .
$$

The scalar $w$ carries the angle, the vector $\mathbf{v}$ carries the axis scaled by the sine of the half-angle. The norm is $1$ automatically, since $\cos^2 + \sin^2 = 1$ and $\hat{\mathbf{e}}$ is a unit vector. Four numbers with one constraint is again three degrees of freedom, as it must be.

The **half-angle** is the single most consequential feature. It means a full turn, $\Phi = 360^\circ$, gives $q = [\cos 180^\circ, \hat{\mathbf{e}}\sin 180^\circ] = [-1, \mathbf{0}]$, not $[1,\mathbf{0}]$ — so $q$ and $-q$ describe the same attitude. That is the double cover, and lesson 07 is devoted to it. It also means the components change half as fast as the attitude does, which is why quaternions interpolate well and why a $\Phi = 180^\circ$ rotation has $w = 0$ rather than anything singular.

::: key Definition of a unit quaternion
$q = [\cos(\Phi/2),\ \hat{\mathbf{e}}\sin(\Phi/2)]$ with $\lVert q\rVert = 1$, where $(\hat{\mathbf{e}}, \Phi)$ are the principal axis and angle. The half-angle is the reason $q$ and $-q$ describe the same rotation.
:::

## Four independent choices

A quaternion is fully specified only when four separate questions are answered. They are independent: all sixteen combinations exist in real code.

### 1. Storage order

Scalar-first writes the array as $[w, x, y, z]$; scalar-last writes it as $[x, y, z, w]$. This is a pure layout choice with no mathematical content, and it is responsible for a large share of the bugs, because an array of four doubles carries no label. Eigen is a well-known trap in both directions: its constructor takes the scalar first, `Quaterniond(w, x, y, z)`, while its `coeffs()` accessor returns the coefficients scalar-last, $[x, y, z, w]$, matching its internal storage. Code that passes `q.coeffs().data()` to a routine expecting scalar-first compiles, runs, and is wrong.

Message formats differ too. The common ROS quaternion message names its fields `x, y, z, w` in that order. MATLAB's aerospace and robotics quaternion types are scalar-first. Neither is more correct; both must be read.

### 2. The algebra: Hamilton or JPL

Quaternion multiplication is built from the products of the three imaginary units. **Hamilton's** original algebra, from 1843, sets

$$
i^2 = j^2 = k^2 = ijk = -1,
\qquad\text{hence}\qquad
ij = k,\quad jk = i,\quad ki = j .
$$

The **JPL** convention, associated with Breckenridge's JPL memorandum and with Malcolm Shuster's survey of attitude representations, instead takes

$$
ij = -k, \qquad jk = -i, \qquad ki = -j ,
$$

the opposite-handed algebra. In components, the JPL product of two quaternions is the Hamilton product of the same two with the arguments swapped.

The consequence shows up in two places at once.

- **Composition order reverses.** Under Hamilton, the map from quaternions to rotation matrices is a homomorphism: $\mathbf{C}(q_1\otimes q_2) = \mathbf{C}(q_1)\mathbf{C}(q_2)$, so a chain of frames composes in the same left-to-right order as the matrices. Under JPL, the same component arrays multiply the other way round, so the chain is written in the reverse order.
- **The rotation matrix is transposed.** For the same $(w, \mathbf{v})$ content, the two conventions' matrix formulas differ in the sign of the cross-product term:

$$
\mathbf{C}_{\text{Hamilton}}(q) = (w^2 - \mathbf{v}^\top\mathbf{v})\mathbf{I}_3 + 2\mathbf{v}\mathbf{v}^\top + 2w\,[\mathbf{v}\times],
$$

$$
\mathbf{C}_{\text{JPL}}(q) = (w^2 - \mathbf{v}^\top\mathbf{v})\mathbf{I}_3 + 2\mathbf{v}\mathbf{v}^\top - 2w\,[\mathbf{v}\times]
= \mathbf{C}_{\text{Hamilton}}(q)^{\top} .
$$

Both have trace $4w^2 - 1$, both are orthonormal, both have determinant $+1$. They are transposes, which is to say each is the other's inverse rotation.

### 3. Which direction the quaternion names

Even inside one convention, $q$ may mean $q_{N\leftarrow B}$ or $q_{B\leftarrow N}$. These are conjugates of each other, so the ambiguity has the same effect as a transpose. An interface that says "attitude quaternion" without saying "body from inertial" or "inertial from body" has not specified anything.

### 4. Operator or coordinate transformation

The matrix built from $q$ may be intended to *move* a vector within a frame or to *re-express* a fixed vector in another frame. These are transposes as well. Lesson 11 takes this apart; note here that it is a fourth independent axis, and that the first three do not determine it.

::: key Hamilton against JPL
Hamilton: $ijk = -1$ and $ij = +k$, usually paired with scalar-first storage, and $q_1\otimes q_2$ corresponds to $\mathbf{C}(q_1)\mathbf{C}(q_2)$ — used by Eigen, by ROS, and by Solà's error-state reference. JPL/Shuster: $ij = -k$, usually paired with scalar-last storage, and the composition order is reversed. Mixing them produces a transposed rotation that still has unit norm and determinant $+1$.
:::

## The convention this module holds

Every lesson from here on uses **unit, scalar-first, Hamilton** quaternions, with

$$
q_{A\leftarrow B}\otimes q_{B\leftarrow C} = q_{A\leftarrow C},
\qquad
\mathbf{C}(q) = (w^2 - \mathbf{v}^\top\mathbf{v})\mathbf{I}_3 + 2\mathbf{v}\mathbf{v}^\top + 2w[\mathbf{v}\times],
\qquad
\mathbf{C}(q_1\otimes q_2) = \mathbf{C}(q_1)\mathbf{C}(q_2),
$$

and $q = [\cos(\Phi/2), \hat{\mathbf{e}}\sin(\Phi/2)]$ where $(\hat{\mathbf{e}},\Phi)$ is the principal axis and angle of $\mathbf{C}(q)$ in the Rodrigues sense of lesson 04. The module's coding exercise holds the same convention, and states it in its docstring, which is the habit to copy. Writing the convention down at the top of a file costs one comment and saves a mission.

## Detecting the convention from data

You will be handed quaternions with no documentation. Three tests, in order of reliability.

**Compose two known rotations.** This is the decisive one, because it tests the algebra rather than the layout. Build two quaternions for rotations you can predict — a $30^\circ$ roll and a $50^\circ$ yaw, say — hand them to the unknown library in one order, and compare its result against the truth you computed independently. Only one order reproduces it.

**Rotate a known vector and compare against the transpose.** Push a vector you understand through the unknown matrix and through its transpose, and see which lands where geometry says. This separates the Hamilton matrix from the JPL matrix and, at the same time, the operator reading from the coordinate-transformation reading.

**Look at where the near-unit component sits for a small rotation.** For a rotation of $1^\circ$, the scalar is $\cos 0.5^\circ = 0.999962$ and the vector components are of order $10^{-2}$ or smaller. If the array's first slot is near $1$ it is scalar-first; if the last slot is, it is scalar-last. This is quick and it is only a hint: it says nothing about the algebra, and it fails for a large rotation, where every component can be comparable in size.

What never works is reading the variable name. `q`, `quat`, `attitude_quaternion` and `q_body` carry no information, and comments describing the convention are frequently older than the code.

::: example A storage-order mix-up, in degrees
Take a $40^\circ$ rotation about $\hat{\mathbf{e}} = (1,2,2)/3$. Scalar-first,

$$
q = [\,0.939693,\ 0.114007,\ 0.228013,\ 0.228013\,],
$$

and written scalar-last for the wire it becomes the array $(0.114007,\ 0.228013,\ 0.228013,\ 0.939693)$. A reader that assumes scalar-first takes that array at face value. Its norm is still $1.000000$ — the four numbers are the same four numbers — so no validity check fires. The rotation matrix built from it is

$$
\begin{bmatrix}
-0.870025 & -0.110282 & 0.480515\\
0.318243 & -0.870025 & 0.376535\\
0.376535 & 0.480515 & 0.792040
\end{bmatrix},
$$

with $\det = 1.000000$ and $\max\lvert\mathbf{C}^\top\mathbf{C}-\mathbf{I}_3\rvert = 2.2\times 10^{-16}$. A perfect rotation matrix. It is also $132.92^\circ$ away from the truth, and its own principal angle is $166.91^\circ$ instead of $40^\circ$. Every structural check a defensive programmer would think to write passes.
:::

::: example The transpose error is exactly twice the rotation angle
Feed the same scalar-first quaternion to the JPL matrix formula instead of the Hamilton one, so you get $\mathbf{C}^\top$ where you wanted $\mathbf{C}$. How wrong is that, as a pointing error?

If $\mathbf{C} = \mathbf{R}(\hat{\mathbf{e}},\Phi)$ then $\mathbf{C}^\top = \mathbf{R}(\hat{\mathbf{e}},-\Phi)$, and the rotation carrying the intended attitude to the obtained one is $\mathbf{C}^\top\mathbf{C}^\top = \mathbf{R}(\hat{\mathbf{e}}, -2\Phi)$. So the error angle is $2\Phi$, folded back into $[0^\circ,180^\circ]$:

| true $\Phi$ | $0.5^\circ$ | $5^\circ$ | $40^\circ$ | $90^\circ$ | $120^\circ$ | $170^\circ$ |
| --- | --- | --- | --- | --- | --- | --- |
| error from the transpose | $1.0^\circ$ | $10.0^\circ$ | $80.0^\circ$ | $180.0^\circ$ | $120.0^\circ$ | $20.0^\circ$ |

Read the first column and the failure mode becomes clear. At the identity attitude the error is zero. At half a degree of rotation it is one degree — within a lot of test tolerances. It grows linearly and only becomes obvious once the vehicle has moved substantially. A test suite written around small perturbations of the identity will pass, ship, and fail on the first large slew.
:::

::: example Which multiplication order is this library using?
Build two quaternions for rotations you can check by hand: $a$ is a $30^\circ$ roll about $x$, so $a = [0.965926,\ 0.258819,\ 0,\ 0]$, and $b$ is a $50^\circ$ yaw about $z$, so $b = [0.906308,\ 0,\ 0,\ 0.422618]$. The two Hamilton products are

$$
a\otimes b = [\,0.875426,\ 0.234570,\ -0.109382,\ 0.408218\,],
\qquad
b\otimes a = [\,0.875426,\ 0.234570,\ 0.109382,\ 0.408218\,].
$$

Note what is the same and what is not. The scalar parts are identical, because $w_1w_2 - \mathbf{v}_1\cdot\mathbf{v}_2$ is symmetric in the two arguments, so **both orders give the same principal angle**, here $57.809^\circ$. Only the third component's sign differs, from the $\mathbf{v}_1\times\mathbf{v}_2$ term. The two attitudes are $25.119^\circ$ apart.

That is the diagnostic and the trap together. A composition-order error produces a rotation of exactly the right magnitude about the wrong axis, so any check based on the angle alone — "the slew was $57.8^\circ$ as commanded" — passes.

To settle the order, take a truth you can state independently: a body frame obtained by yawing the reference $50^\circ$ about $z$ and then rolling $30^\circ$ about the new $x$ axis. By lesson 02's chaining rule that is $\mathbf{C}_{N\leftarrow B} = \mathbf{C}(b)\mathbf{C}(a)$, whose first column is $(0.642788,\ 0.766044,\ 0)$. Evaluate the library's product both ways and build the matrix: the order $b\otimes a$ reproduces it exactly, and $a\otimes b$ gives first column $(0.642788,\ 0.556670,\ 0.500000)$ instead. One vector, unambiguous answer.
:::

::: warning A unit-norm check proves nothing about the convention
`assert(abs(norm(q) - 1) < 1e-9)` is worth having — it catches corrupted memory, failed normalisation and uninitialised arrays. It cannot catch a convention error, because every convention produces unit quaternions from the same four numbers in a different order or a different algebra. The same is true of `det(C) == 1` and `C'C == I`. Structural checks verify that you have *a* rotation. Only a behavioural check against a known geometry verifies that you have *the* rotation.
:::

::: warning Conversions at interface boundaries, not sprinkled through the code
The maintainable pattern is one convention everywhere inside a module, with explicit conversion functions at every boundary where data enters or leaves, named for what they do — `quat_from_jpl_scalar_last`, not `fix_quat`. The unmaintainable pattern is a transpose or a component swap inserted wherever a test failed, because each one is locally correct and the composition of six of them is not, and nobody can later say which are load-bearing.
:::

## Check yourself

::: check
A telemetry stream carries four doubles per attitude sample. One sample reads $(0.0038,\ -0.0012,\ 0.0071,\ 0.99997)$. What convention is it, and what is the rotation angle?
:::

::: answer
The last component is within $3\times 10^{-5}$ of $1$ and the first three are of order $10^{-3}$, so this is scalar-last: $w = 0.99997$, $\mathbf{v} = (0.0038, -0.0012, 0.0071)$. The vector part has norm $\sqrt{0.0038^2+0.0012^2+0.0071^2} = \sqrt{1.444\times 10^{-5} + 1.44\times 10^{-6} + 5.041\times 10^{-5}} = 8.08\times 10^{-3}$, so $\Phi = 2\arcsin(0.00808) = 0.01616\,\mathrm{rad} = 0.926^\circ$. The layout is settled; the algebra is not. Scalar-last correlates with JPL but does not imply it, so you still have to compose two known rotations before trusting the sign of anything.
:::

::: check
Your ground software and your flight software disagree about a spacecraft's attitude by $14.0^\circ$, consistently, for all telemetry. What single hypothesis explains a constant-magnitude discrepancy, and how would you test it in one line?
:::

::: answer
A constant discrepancy of $14.0^\circ$ while the vehicle is at a small attitude is the signature of a transpose — from the wrong matrix formula, from taking $q_{B\leftarrow N}$ for $q_{N\leftarrow B}$, or from the operator-versus-transformation confusion. The error from a transpose is twice the rotation angle, so this predicts the vehicle is at $\Phi = 7.0^\circ$ from the reference attitude. Test it in one line: take one telemetry sample, compute both attitudes, and check whether one matrix is the transpose of the other to machine precision. If it is, the hypothesis is confirmed and the fix is a single conjugation at the interface; a $7.0^\circ$ true attitude would corroborate it further.
:::

::: check
Why is the composition-order error harder to find than the storage-order error?
:::

::: answer
A storage-order error scrambles which number is the scalar, so the resulting attitude is essentially unrelated to the truth — $132.9^\circ$ off in the worked example, and its principal angle reads $166.9^\circ$ when the truth was $40^\circ$. Anything watching the magnitude notices. A composition-order error is far subtler: the scalar part of $a\otimes b$ equals the scalar part of $b\otimes a$ exactly, so the principal angle is *identical* and only the axis differs. Slew magnitude checks, rate limits and energy budgets all agree. The error appears only as a pointing direction, and only when the two rotations being composed are about non-parallel axes — so it is invisible during single-axis testing, which is how most attitude testing starts.
:::

::: check
A vendor delivers a library whose documentation says "Hamilton convention, scalar first". Is that enough to integrate against? What else do you need?
:::

::: answer
No. Two of the four choices remain open. First, the direction: does their quaternion mean $q_{N\leftarrow B}$ or $q_{B\leftarrow N}$? These are conjugates, and taking one for the other gives you the inverse rotation. Second, whether the matrix their `to_matrix` returns is meant as an operator acting within a frame or as a coordinate transformation between frames — also a transpose. Both are settled by one behavioural test: construct a rotation whose effect you can state, such as a $90^\circ$ yaw, apply the library to the vector $(1,0,0)$, and see whether the result is $(0,1,0)$ or $(0,-1,0)$.
:::

::: check
For a $170^\circ$ rotation, a transpose error gives only $20^\circ$ of pointing error, while for $90^\circ$ it gives $180^\circ$. Explain the non-monotonicity.
:::

::: answer
The error rotation is $\mathbf{R}(\hat{\mathbf{e}}, -2\Phi)$, and a principal angle is reported in $[0^\circ, 180^\circ]$, so what is measured is $2\Phi$ folded: $2\Phi$ for $\Phi \le 90^\circ$ and $360^\circ - 2\Phi$ for $\Phi > 90^\circ$. At $\Phi = 90^\circ$ the doubled angle is exactly $180^\circ$, the largest possible separation between two attitudes. Beyond that, doubling wraps past a full turn and the two attitudes approach each other again: at $\Phi = 180^\circ$ the rotation and its inverse are the same rotation, so the error is zero. The practical reading is that a transpose bug is worst for mid-sized rotations and can hide at both ends.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| $q = [\cos(\Phi/2),\ \hat{\mathbf{e}}\sin(\Phi/2)]$ | Unit quaternion from principal axis and angle; $\lVert q\rVert = 1$ |
| Storage order | Scalar-first $[w,x,y,z]$ or scalar-last $[x,y,z,w]$; pure layout, no mathematics |
| Hamilton | $ijk = -1$, $ij = +k$; $\mathbf{C}(q_1\otimes q_2) = \mathbf{C}(q_1)\mathbf{C}(q_2)$ |
| JPL / Shuster | $ij = -k$; composition order reversed; matrix is the Hamilton transpose |
| $\mathbf{C}_{\text{JPL}}(q) = \mathbf{C}_{\text{Hamilton}}(q)^\top$ | Same components, opposite rotation |
| Direction | $q_{N\leftarrow B}$ against $q_{B\leftarrow N}$: conjugates, a third independent choice |
| This module | Unit, scalar-first, Hamilton, $q_{A\leftarrow B}\otimes q_{B\leftarrow C} = q_{A\leftarrow C}$ |
| Detection | Compose two known rotations; rotate a known vector; check which slot is near $1$ for a small rotation |
| Transpose error magnitude | Exactly $2\Phi$, folded into $[0^\circ,180^\circ]$ — zero near the identity |
| Order error signature | Same scalar part, so same principal angle, wrong axis |

With the conventions pinned down, the algebra can be developed without ambiguity. The next lesson defines the product, the conjugate and the inverse, proves that the unit quaternions are closed under multiplication, and shows how a quaternion rotates a vector.
