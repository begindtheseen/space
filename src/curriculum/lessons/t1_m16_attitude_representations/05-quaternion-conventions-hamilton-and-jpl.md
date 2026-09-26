---
id: l05-quaternion-conventions-hamilton-and-jpl
title: Quaternions: Hamilton against JPL, scalar-first against scalar-last
minutes: 22
covers:
  - 'quaternions: Hamilton vs JPL, scalar-first vs scalar-last'
---

Someone hands you a note that says the launch is on 03/04. Is that March 4th or April 3rd? In the United States it is March; in most of Europe it is April. The numbers are the same, both readings are perfectly sensible dates, and nothing about "03/04" tells you which one was meant. You have to know the writer's convention.

Quaternions have exactly this problem, only worse. A **unit quaternion** is four numbers that describe a rotation, and it is what almost all flight software carries to store attitude. It has no singularity. It combines two rotations with sixteen multiplications instead of the matrix's twenty-seven. It repairs itself with one square root, and it blends smoothly between attitudes. Lessons 06 through 08 build the mathematics. This lesson comes first because it covers the part that actually breaks missions: which four numbers, in which order, obeying which multiplication rule, describing a turn in which direction.

There is no single answer. Two established conventions that disagree with each other are both in wide use. So are two storage orders, which can be paired with either, and two directions the rotation can be taken to run. The mixes are not interchangeable, and no structural test detects them. A quaternion read in the wrong convention still has length $1$. The rotation matrix built from it still passes every check a rotation matrix should pass. Everything downstream keeps working — and points somewhere else.

Mixing quaternion conventions is the most common real-world bug in attitude software. It is common because nothing catches it, because it hides near the "no rotation" attitude [[where most unit tests live|identity-tests]], and because the [[two communities|two-communities]] that meet on a spacecraft — robotics and graphics on one side, spacecraft attitude determination on the other — settled on opposite choices decades ago. Both are right inside their own books.

## The unit quaternion

Start from the principal axis $\hat{\mathbf{e}}$ and principal angle $\Phi$ of lesson 04. A unit quaternion packs them into four numbers:

$$
q = \bigl[\,\cos(\Phi/2),\ \hat{\mathbf{e}}\sin(\Phi/2)\,\bigr] = [\,w,\ \mathbf{v}\,],
\qquad
\lVert q\rVert^2 = w^2 + \mathbf{v}^\top\mathbf{v} = 1 .
$$

Read it this way. The first number, $w$, is the **scalar part** — a single ordinary number, the cosine of *half* the angle. The other three, $\mathbf{v} = (x, y, z)$, form the **vector part** — the axis arrow shrunk by the sine of half the angle. $\lVert q\rVert$ ("the norm of q") is the length of all four numbers together, found like any length: square, add, take the square root.

Why is the length always $1$? Because $\hat{\mathbf{e}}$ is a unit arrow, $\mathbf{v}^\top\mathbf{v} = \sin^2(\Phi/2)$. Add $w^2 = \cos^2(\Phi/2)$ and you get $\cos^2 + \sin^2 = 1$. Four numbers with one rule between them leaves three free — the same three degrees of freedom every attitude has.

Two quick sanity checks. No rotation, $\Phi = 0$, gives $q = [1, 0, 0, 0]$: the **identity quaternion**. A $90^\circ$ turn about $z$ gives $q = [\cos 45^\circ, 0, 0, \sin 45^\circ] = [0.707107, 0, 0, 0.707107]$.

### The half-angle

The half-angle is the feature with the most consequences. Follow a full turn, $\Phi = 360^\circ$:

$$
q = [\cos 180^\circ,\ \hat{\mathbf{e}}\sin 180^\circ] = [-1,\ \mathbf{0}] .
$$

That is not $[1, \mathbf{0}]$, even though turning all the way around puts the body back where it started. So $q$ and $-q$ describe the [[same attitude|half-angle-curve]]. That is the **double cover**, and lesson 07 is devoted to it.

The half-angle has two friendlier effects too. The four numbers change half as fast as the attitude does, which is part of why quaternions blend smoothly between attitudes. And a $180^\circ$ turn gives $w = \cos 90^\circ = 0$ — a perfectly ordinary number, not a division by zero.

::: key Definition of a unit quaternion
$q = [\cos(\Phi/2),\ \hat{\mathbf{e}}\sin(\Phi/2)]$ with $\lVert q\rVert = 1$, where $(\hat{\mathbf{e}}, \Phi)$ are the principal axis and angle. The half-angle is the reason $q$ and $-q$ describe the same rotation.
:::

## Four independent choices

A quaternion is fully pinned down only when four separate questions are answered. They are independent of each other: all sixteen combinations exist in real code.

### 1. Storage order

**Scalar-first** stores the four numbers as $[w, x, y, z]$. **Scalar-last** stores them as $[x, y, z, w]$. This is pure layout, like writing the day before or after the month. It has no mathematical content — and it causes a large share of the bugs, because an array of four numbers carries no label.

The C++ library [[Eigen|eigen-trap]] is a well-known trap in both directions. Its constructor takes the scalar first, `Quaterniond(w, x, y, z)`. Its `coeffs()` accessor returns the numbers scalar-last, $[x, y, z, w]$, matching how it stores them inside. Code that passes `q.coeffs().data()` to a routine expecting scalar-first compiles, runs, and is wrong.

Message formats differ too. The common ROS quaternion message (ROS is the Robot Operating System, widely used in robotics) names its fields `x, y, z, w`, in that order. MATLAB's aerospace and robotics quaternion types are scalar-first. Neither is more correct. You have to read the documentation for each.

### 2. The algebra: Hamilton or JPL

A quaternion is also a kind of number, written $q = w + xi + yj + zk$. You met one **imaginary unit** $i$ in the complex numbers lesson, with $i^2 = -1$. Quaternions have three: $i$, $j$ and $k$. Multiplying two quaternions means expanding the brackets and then using a rule for what each pair of units multiplies to.

The Irish mathematician [[William Rowan Hamilton|hamilton-bridge]] wrote down the original rule in 1843:

$$
i^2 = j^2 = k^2 = ijk = -1,
\qquad\text{hence}\qquad
ij = k,\quad jk = i,\quad ki = j .
$$

Order matters here: $ji = -k$, not $k$. Going [[around the cycle|ijk-cycle]] $i \to j \to k$ forward gives a plus sign; going backward gives a minus.

The **JPL** convention — associated with a memorandum by Breckenridge at NASA's Jet Propulsion Laboratory and with Malcolm Shuster's 1993 survey of attitude representations — flips the handedness:

$$
ij = -k, \qquad jk = -i, \qquad ki = -j .
$$

In components, the JPL product of two quaternions equals the Hamilton product of the same two with the order swapped. That one difference shows up in two places at once.

- **Composition order reverses.** Under Hamilton, multiplying quaternions matches multiplying their rotation matrices in the same order: $\mathbf{C}(q_1\otimes q_2) = \mathbf{C}(q_1)\mathbf{C}(q_2)$. (Read $\otimes$ as "quaternion times".) So a chain of frames is written in the same left-to-right order as the matrices. Under JPL, the same arrays of numbers multiply the other way round, so the chain is written in reverse.
- **The rotation matrix is transposed.** For the same four numbers, the two conventions' matrix formulas differ only in the sign of the last term:

$$
\mathbf{C}_{\text{Hamilton}}(q) = (w^2 - \mathbf{v}^\top\mathbf{v})\mathbf{I}_3 + 2\mathbf{v}\mathbf{v}^\top + 2w\,[\mathbf{v}\times],
$$

$$
\mathbf{C}_{\text{JPL}}(q) = (w^2 - \mathbf{v}^\top\mathbf{v})\mathbf{I}_3 + 2\mathbf{v}\mathbf{v}^\top - 2w\,[\mathbf{v}\times]
= \mathbf{C}_{\text{Hamilton}}(q)^{\top} .
$$

Here $[\mathbf{v}\times]$ is the cross-product matrix from lesson 04. Both matrices have trace $4w^2 - 1$. Both are orthonormal. Both have determinant $+1$. They are transposes — which means each is the other's *inverse* rotation. Same four numbers, opposite turn.

### 3. Which direction the quaternion names

Even inside one convention, $q$ may mean $q_{N\leftarrow B}$ (reference from body) or $q_{B\leftarrow N}$ (body from reference). These two are each other's inverse, so mixing them up has the same effect as a transpose. An interface that says "attitude quaternion" without saying "body from inertial" or "inertial from body" has not said anything.

### 4. Operator or coordinate transformation

The matrix built from $q$ may be meant to *move* an arrow within one frame, or to *re-express* a fixed arrow in another frame. These are transposes as well. Lesson 11 takes this apart. For now, notice it is a fourth independent choice, and the first three do not settle it.

::: key Hamilton against JPL
Hamilton: $ijk = -1$ and $ij = +k$, usually scalar-first, and $q_1\otimes q_2$ corresponds to $\mathbf{C}(q_1)\mathbf{C}(q_2)$ — used by Eigen, by ROS, and by [[Solà's error-state reference|sola-notes]]. JPL/Shuster: $ij = -k$, scalar-last storage, and the composition order is reversed. Mixing them produces a transposed rotation that still has unit norm and determinant $+1$.
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

and $q = [\cos(\Phi/2), \hat{\mathbf{e}}\sin(\Phi/2)]$, where $(\hat{\mathbf{e}},\Phi)$ is the principal axis and angle of $\mathbf{C}(q)$ in the Rodrigues sense of lesson 04. Like dominoes, the inner labels match: $B$ next to $B$.

The module's coding exercise uses the same convention and states it in the file's opening comment. That is the habit to copy. Writing the convention at the top of a file costs one comment and can save a mission.

## Detecting the convention from data

Sooner or later you will be handed quaternions with no documentation. Here are three tests, most reliable first.

**Compose two known rotations.** This is the decisive test, because it checks the algebra, not the layout. Build two quaternions for turns you can predict — a $30^\circ$ roll and a $50^\circ$ yaw, say. Hand them to the unknown library in one order. Compare its answer with the truth you worked out independently. Only one order reproduces it.

**Rotate a known vector and compare against the transpose.** Push an arrow you understand through the unknown matrix, and through its transpose. See which lands where the geometry says it should. This separates the Hamilton matrix from the JPL one — and, at the same time, the operator reading from the coordinate-transformation reading.

**See where the near-1 number sits for a small rotation.** For a $1^\circ$ turn, the scalar is $\cos 0.5^\circ = 0.999962$, and the vector numbers are about $0.01$ or smaller. If the array's first slot is near $1$, it is scalar-first. If the last slot is, it is scalar-last. This is quick, but it is only a hint. It says nothing about the algebra, and it fails for a large rotation, where all four numbers can be similar in size.

What never works is reading the variable name. `q`, `quat`, `attitude_quaternion` and `q_body` carry no information, and comments describing the convention are often older than the code.

::: key Detecting the convention
Compose two known rotations and see which ordering reproduces the truth; check whether the component with magnitude near $1$ for a small rotation sits first or last; and rotate a known vector and compare against the transpose. Never infer it from the variable name.
:::

::: example A storage-order mix-up, in degrees
Take a $40^\circ$ turn about $\hat{\mathbf{e}} = (1,2,2)/3$.

**Build it.** Half the angle is $20^\circ$. So $w = \cos 20^\circ = 0.939693$ and the vector part is $\sin 20^\circ \times (1,2,2)/3 = 0.342020 \times (0.333333, 0.666667, 0.666667)$. Scalar-first:

$$
q = [\,0.939693,\ 0.114007,\ 0.228013,\ 0.228013\,].
$$

**Send it.** Written scalar-last for the radio link, it becomes the array $(0.114007,\ 0.228013,\ 0.228013,\ 0.939693)$.

**Misread it.** A receiver that assumes scalar-first takes that array at face value: $w = 0.114007$. Its length is still $1.000000$ — they are the same four numbers — so no validity check fires. The rotation matrix built from it is

$$
\begin{bmatrix}
-0.870025 & -0.110282 & 0.480515\\
0.318243 & -0.870025 & 0.376535\\
0.376535 & 0.480515 & 0.792040
\end{bmatrix},
$$

with $\det = 1.000000$ and every entry of $\mathbf{C}^\top\mathbf{C}-\mathbf{I}_3$ below $2.2\times 10^{-16}$. A perfect rotation matrix.

**How wrong?** It is $132.92^\circ$ away from the truth. Its own principal angle is $166.91^\circ$ instead of $40^\circ$. And every structural check a careful programmer would think to write passes.
:::

::: example The transpose error is exactly twice the rotation angle
Now feed the same scalar-first quaternion to the JPL matrix formula instead of the Hamilton one. You get $\mathbf{C}^\top$ where you wanted $\mathbf{C}$. How big a pointing error is that?

**Reason it out.** If $\mathbf{C} = \mathbf{R}(\hat{\mathbf{e}},\Phi)$, then lesson 04 says $\mathbf{C}^\top = \mathbf{R}(\hat{\mathbf{e}},-\Phi)$. To get from the attitude you wanted to the one you got, you must undo $+\Phi$ and then do $-\Phi$: a total turn of $-2\Phi$ about the same axis. So the error angle is $2\Phi$ — folded back into $0^\circ$ to $180^\circ$, since a principal angle never exceeds $180^\circ$.

| true $\Phi$ | $0.5^\circ$ | $5^\circ$ | $40^\circ$ | $90^\circ$ | $120^\circ$ | $170^\circ$ |
| --- | --- | --- | --- | --- | --- | --- |
| error from the transpose | $1.0^\circ$ | $10.0^\circ$ | $80.0^\circ$ | $180.0^\circ$ | $120.0^\circ$ | $20.0^\circ$ |

(For $120^\circ$: $2 \times 120 = 240^\circ$, which is $360 - 240 = 120^\circ$ the other way. For $170^\circ$: $340^\circ$ folds to $20^\circ$.)

**Read the first column.** At the "no rotation" attitude the error is zero. At half a degree of rotation it is one degree — inside a lot of test tolerances. It [[grows in a straight line|transpose-error-curve]] and becomes obvious only once the vehicle has turned a long way. A test suite built around small nudges from the identity will pass, ship, and fail on the first large slew.
:::

::: example Which multiplication order is this library using?
Build two quaternions for turns you can check by hand.

- $a$ is a $30^\circ$ roll about $x$: $a = [\cos 15^\circ, \sin 15^\circ, 0, 0] = [0.965926,\ 0.258819,\ 0,\ 0]$.
- $b$ is a $50^\circ$ yaw about $z$: $b = [\cos 25^\circ, 0, 0, \sin 25^\circ] = [0.906308,\ 0,\ 0,\ 0.422618]$.

**The two Hamilton products** (lesson 06 gives the formula) are

$$
a\otimes b = [\,0.875426,\ 0.234570,\ -0.109382,\ 0.408218\,],
\qquad
b\otimes a = [\,0.875426,\ 0.234570,\ 0.109382,\ 0.408218\,].
$$

**What is the same, and what is not.** The scalar parts are identical, so both orders give the same principal angle: $2\arccos(0.875426) = 57.809^\circ$. Only the sign of the third number differs. Yet the two attitudes are $25.119^\circ$ apart.

That is the diagnostic and the trap together. An order mix-up gives a turn of exactly the right size about the wrong axis. So any check based on the angle alone — "the slew was $57.8^\circ$ as commanded" — passes.

**Settle it with one vector.** Take a truth you can state independently: a body frame made by yawing the reference $50^\circ$ about $z$, then rolling $30^\circ$ about the new $x$ axis. By lesson 02's chaining rule that is $\mathbf{C}_{N\leftarrow B} = \mathbf{C}(b)\mathbf{C}(a)$. Its first column is the body $x$ axis in reference axes. The roll about $x$ does not move $x$, and the yaw swings it $50^\circ$ toward $y$, so the column is $(\cos 50^\circ, \sin 50^\circ, 0) = (0.642788,\ 0.766044,\ 0)$.

Build the matrix from each product. The order $b\otimes a$ reproduces that column exactly. The order $a\otimes b$ gives $(0.642788,\ 0.663414,\ 0.383022)$ instead — the yawed axis then tipped by the roll. One vector, unambiguous answer.
:::

::: warning A unit-norm check proves nothing about the convention
`assert(abs(norm(q) - 1) < 1e-9)` is worth having. It catches corrupted memory, a missed normalization and uninitialized arrays. It cannot catch a convention error, because every convention makes unit quaternions — the same four numbers in a different order, or a different algebra. The same goes for `det(C) == 1` and `C'C == I`. Structural checks prove you have *a* rotation. Only a behavioral check against a known geometry proves you have *the* rotation.
:::

::: warning Convert at the borders, not all through the code
The pattern that stays maintainable: one convention everywhere inside a module, with clearly named conversion functions at every border where data comes in or goes out — `quat_from_jpl_scalar_last`, not `fix_quat`. The pattern that does not: a transpose or a component swap dropped in wherever a test failed. Each one is locally right, the combination of six of them is not, and nobody can later say which ones are holding the building up.
:::

## Check yourself

::: check
A telemetry stream carries four numbers per attitude sample. One sample reads $(0.0038,\ -0.0012,\ 0.0071,\ 0.99997)$. What storage order is it, and what is the rotation angle?
:::

::: answer
**Order.** The last number is within $3\times 10^{-5}$ of $1$, and the first three are about $0.001$ to $0.01$. So this is scalar-last: $w = 0.99997$ and $\mathbf{v} = (0.0038, -0.0012, 0.0071)$.

**Angle.** Square and add the vector part: $1.444\times 10^{-5} + 1.44\times 10^{-6} + 5.041\times 10^{-5} = 6.629\times 10^{-5}$. The square root is $\lVert\mathbf{v}\rVert = 8.142\times 10^{-3}$. Since $\lVert\mathbf{v}\rVert = \sin(\Phi/2)$, $\Phi = 2\arcsin(0.008142) = 0.016284\,\mathrm{rad} = 0.933^\circ$.

**What is still open.** The layout is settled; the algebra is not. Scalar-last often goes with JPL but does not prove it, so you still have to compose two known rotations before trusting the sign of anything.
:::

::: check
Your ground software and flight software disagree about a spacecraft's attitude by $14.0^\circ$, the same amount in every sample while the spacecraft holds one attitude. What single hypothesis explains it, and how would you test it in one line?
:::

::: answer
**Hypothesis.** A transpose — from the wrong matrix formula, from taking $q_{B\leftarrow N}$ for $q_{N\leftarrow B}$, or from mixing up operator and coordinate transformation. A transpose error is twice the rotation angle, so this predicts the spacecraft sits $\Phi = 7.0^\circ$ from the reference attitude (or $173^\circ$, which folds to the same $14^\circ$).

**One-line test.** Take one sample, compute both matrices, and check whether one is the transpose of the other to machine precision. If it is, the hypothesis is confirmed, and the fix is a single conjugation at the interface. Finding the true attitude near $7.0^\circ$ backs it up further.
:::

::: check
Why is a composition-order error harder to find than a storage-order error?
:::

::: answer
A storage-order error scrambles which number is the scalar, so the result has little to do with the truth — $132.9^\circ$ off in the worked example, with a principal angle of $166.9^\circ$ when the truth was $40^\circ$. Anything watching the size of the turn notices.

A composition-order error is far quieter. The scalar part of $a\otimes b$ equals that of $b\otimes a$ exactly, so the principal angle is *identical* and only the axis differs. Slew-size checks, rate limits and energy budgets all agree. The error shows up only as a pointing direction, and only when the two turns being combined are about different axes. So it is invisible during single-axis testing, which is how most attitude testing starts.
:::

::: check
A vendor delivers a library documented as "Hamilton convention, scalar first". Is that enough to integrate against? What else do you need?
:::

::: answer
No. Two of the four choices are still open.

- **Direction.** Does their quaternion mean $q_{N\leftarrow B}$ or $q_{B\leftarrow N}$? Taking one for the other gives the inverse rotation.
- **Operator or coordinate transformation.** Is the matrix their `to_matrix` returns meant to move an arrow within a frame, or to re-express it in another frame? Also a transpose.

One behavioral test settles both. Build a turn whose effect you can state, such as a $90^\circ$ yaw about $z$. Apply the library to the arrow $(1,0,0)$ and see whether you get $(0,1,0)$ or $(0,-1,0)$. Under this module's convention, $\mathbf{C}(q)$ for a $90^\circ$ turn about $z$ sends $(1,0,0)$ to $(0,1,0)$.
:::

::: check
For a $170^\circ$ rotation, a transpose error gives only $20^\circ$ of pointing error, but for $90^\circ$ it gives $180^\circ$. Why does the error go up and then back down?
:::

::: answer
The error turn is $\mathbf{R}(\hat{\mathbf{e}}, -2\Phi)$, and a principal angle is reported between $0^\circ$ and $180^\circ$. So what you measure is $2\Phi$ folded: $2\Phi$ when $\Phi \le 90^\circ$, and $360^\circ - 2\Phi$ when $\Phi > 90^\circ$.

At $\Phi = 90^\circ$ the doubled angle is exactly $180^\circ$ — the farthest apart two attitudes can be. Past that, doubling wraps past a full turn, and the two attitudes come back toward each other. At $\Phi = 180^\circ$ the rotation and its inverse are the same half turn, so the error is zero. In practice: a transpose bug is worst for middle-sized rotations and can hide at both ends.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| $q = [\cos(\Phi/2),\ \hat{\mathbf{e}}\sin(\Phi/2)]$ | Unit quaternion from principal axis and angle; $\lVert q\rVert = 1$ |
| $q$ and $-q$ | The same rotation, because of the half-angle |
| Storage order | Scalar-first $[w,x,y,z]$ or scalar-last $[x,y,z,w]$; pure layout |
| Hamilton | $ijk = -1$, $ij = +k$; $\mathbf{C}(q_1\otimes q_2) = \mathbf{C}(q_1)\mathbf{C}(q_2)$ |
| JPL / Shuster | $ij = -k$; composition order reversed; matrix is the Hamilton transpose |
| $\mathbf{C}_{\text{JPL}}(q) = \mathbf{C}_{\text{Hamilton}}(q)^\top$ | Same four numbers, opposite rotation |
| Direction | $q_{N\leftarrow B}$ against $q_{B\leftarrow N}$: inverses, a third independent choice |
| Operator or transformation | A fourth independent choice, also a transpose |
| This module | Unit, scalar-first, Hamilton, $q_{A\leftarrow B}\otimes q_{B\leftarrow C} = q_{A\leftarrow C}$ |
| Detection | Compose two known rotations; rotate a known vector; check which slot is near $1$ for a small rotation |
| Transpose error size | Exactly $2\Phi$, folded into $[0^\circ,180^\circ]$ — zero near the identity |
| Order error signature | Same scalar part, so same principal angle, wrong axis |

With the conventions pinned down, the algebra can be built without ambiguity. The next lesson defines the product, the conjugate and the inverse, proves that unit quaternions stay unit when multiplied, and shows how a quaternion rotates a vector.

::: context identity-tests Why tests huddle around "no rotation"
When people write their first tests for attitude code, they reach for the easy cases: no rotation at all, or a small nudge away from it. Those are exactly the cases where every convention agrees. At the identity quaternion $[1,0,0,0]$, the transpose of the matrix is the matrix, the inverse is itself, and the two multiplication orders give the same answer. A bug can only show itself once a test uses a large rotation about a tilted axis — so put one in every test suite on day one.
:::

::: context two-communities Two worlds, two habits
Robotics and computer graphics grew up with Hamilton's original algebra, usually storing the scalar first; Eigen, ROS and Joan Solà's widely read error-state notes follow it. Spacecraft attitude determination, especially in the United States, grew up around JPL-style work and Shuster's influential 1993 survey, which uses the opposite-handed product and stores the scalar last. Today a single spacecraft often runs code from both worlds — a robotics-derived simulator on the ground and a heritage attitude filter in flight — which is exactly where the two meet and clash.
:::

::: context half-angle-curve One full turn flips the sign
Plot the scalar part $w = \cos(\Phi/2)$ as the body turns. It starts at $1$, passes $0$ at a half turn, and reaches $-1$ after one full turn — even though the body is back where it started. Only after a second full turn does $w$ return to $1$. So every attitude appears twice around the loop: once as $q$ and once as $-q$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="95" x2="345" y2="95" stroke="#6c7a93" stroke-width="1"/>
  <line x1="40" y1="25" x2="40" y2="165" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline points="40.0,35.0 52.5,37.0 65.0,43.0 77.5,52.6 90.0,65.0 102.5,79.5 115.0,95.0 127.5,110.5 140.0,125.0 152.5,137.4 165.0,147.0 177.5,153.0 190.0,155.0 202.5,153.0 215.0,147.0 227.5,137.4 240.0,125.0 252.5,110.5 265.0,95.0 277.5,79.5 290.0,65.0 302.5,52.6 315.0,43.0 327.5,37.0 340.0,35.0" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="40" cy="35" r="4" fill="#1d6fd1"/>
  <circle cx="190" cy="155" r="4" fill="#b4232c"/>
  <circle cx="340" cy="35" r="4" fill="#1d6fd1"/>
  <text x="34" y="39" font-size="11" text-anchor="end" fill="#1f2a44">1</text>
  <text x="34" y="99" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <text x="34" y="159" font-size="11" text-anchor="end" fill="#1f2a44">−1</text>
  <text x="115" y="110" font-size="11" text-anchor="middle" fill="#1f2a44">180°</text>
  <text x="190" y="176" font-size="11" text-anchor="middle" fill="#b4232c">360°: body back home, w = −1</text>
  <text x="340" y="56" font-size="11" text-anchor="end" fill="#1d6fd1">720°: w = 1</text>
  <text x="60" y="22" font-size="12" fill="#1d6fd1">w = cos(Φ/2)</text>
</svg>
```
:::

::: context eigen-trap How the Eigen trap bites
Eigen is a popular C++ math library used in robotics and a lot of flight-adjacent code. Inside, it stores a quaternion as $x, y, z, w$. Its constructor, though, asks for $w$ first, because that is how mathematicians write $w + xi + yj + zk$. Both choices are sensible on their own. Together they mean the same program can hand out the same quaternion in two different orders, depending on which function you call. Always check the documentation of the exact function, not the library's reputation.
:::

::: context hamilton-bridge Carved into a bridge
William Rowan Hamilton spent years trying to multiply triples of numbers the way complex numbers multiply pairs. On 16 October 1843, walking along the Royal Canal in Dublin, he realized he needed *three* imaginary units and a fourth, ordinary part — and that the order of multiplication had to matter. He scratched $i^2 = j^2 = k^2 = ijk = -1$ into the stone of Broom Bridge on the spot. The carving is long gone, but a plaque marks the place, and mathematicians still walk there every October.
:::

::: context ijk-cycle The multiplication cycle
Put $i$, $j$, $k$ around a circle. In Hamilton's algebra, multiplying two neighbors in the direction of the arrows gives the third with a plus sign: $ij = k$, $jk = i$, $ki = j$. Going against the arrows gives a minus: $ji = -k$. The JPL convention runs the arrows the other way, so there $ij = -k$. That single reversed circle is the whole difference between the two algebras.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <circle cx="110" cy="100" r="60" fill="none" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4,4"/>
  <path d="M126.5,42.3 A60,60 0 0,1 168.2,114.5" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="168.2,114.5 166.0,104.7 174.8,106.9" fill="#1d6fd1"/>
  <path d="M151.7,143.2 A60,60 0 0,1 68.3,143.2" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="68.3,143.2 77.9,146.2 71.7,152.6" fill="#1d6fd1"/>
  <path d="M51.8,114.5 A60,60 0 0,1 93.5,42.3" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="93.5,42.3 86.1,49.1 83.6,40.5" fill="#1d6fd1"/>
  <circle cx="110" cy="40" r="13" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="162" cy="130" r="13" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="58" cy="130" r="13" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="110" y="45" font-size="14" text-anchor="middle" fill="#1f2a44">i</text>
  <text x="162" y="135" font-size="14" text-anchor="middle" fill="#1f2a44">j</text>
  <text x="58" y="135" font-size="14" text-anchor="middle" fill="#1f2a44">k</text>
  <text x="210" y="60" font-size="12" fill="#1d6fd1">Hamilton, with arrows:</text>
  <text x="210" y="78" font-size="12" fill="#1d6fd1">ij = k, jk = i, ki = j</text>
  <text x="210" y="110" font-size="12" fill="#1f2a44">against arrows: ji = −k</text>
  <text x="210" y="142" font-size="12" fill="#b4232c">JPL reverses the arrows:</text>
  <text x="210" y="160" font-size="12" fill="#b4232c">ij = −k</text>
</svg>
```
:::

::: context sola-notes A reference worth keeping open
Joan Solà's *Quaternion kinematics for the error-state Kalman filter* (free on arXiv, 2017) is the module's recommended quaternion reference. Its best feature is honesty about conventions: it lays out the Hamilton and JPL choices side by side, says which it uses, and shows how each formula changes under the other. Before writing any quaternion code, it is worth reading the first chapters and comparing every formula with this module's convention.
:::

::: context transpose-error-curve The tent-shaped error
Plot the pointing error from a transpose against the true rotation angle and you get a tent. It rises in a straight line from zero, peaks at $180^\circ$ error when the true angle is $90^\circ$, and falls back to zero at a half turn. The worst place to hide a transpose bug is the middle; the easiest places are the two ends.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="170" x2="330" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="170" x2="40" y2="22" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline points="40,170 180,30 320,170" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <circle cx="102.2" cy="107.8" r="4" fill="#1d6fd1"/>
  <text x="96" y="100" font-size="11" text-anchor="end" fill="#1d6fd1">40° → 80°</text>
  <circle cx="304.4" cy="154.4" r="4" fill="#1d6fd1"/>
  <text x="300" y="146" font-size="11" text-anchor="end" fill="#1d6fd1">170° → 20°</text>
  <text x="34" y="34" font-size="11" text-anchor="end" fill="#1f2a44">180°</text>
  <text x="34" y="174" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <text x="180" y="186" font-size="11" text-anchor="middle" fill="#1f2a44">90°</text>
  <text x="320" y="186" font-size="11" text-anchor="middle" fill="#1f2a44">180°</text>
  <text x="44" y="186" font-size="11" fill="#1f2a44">true angle Φ</text>
  <text x="188" y="28" font-size="11" fill="#1f2a44">error</text>
</svg>
```
:::
