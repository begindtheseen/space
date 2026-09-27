---
id: l10-rotations-and-quaternion-convention
title: Rotations, quaternions and the scalar-first trap
minutes: 22
covers:
  - dcm2angle, angle2dcm, dcm2quat, quat2dcm, quatmultiply, quatrotate
  - The scalar-first quaternion convention in MathWorks Aerospace products
---

Write the date 03/04 on a note and hand it to two friends. One from Chicago reads "March 4". One from London reads "3 April". Same four digits, same slashes, and a month apart. Nobody gets an error message. The note looks perfectly fine, and it is wrong for one of them.

Spacecraft attitude has exactly this problem. The last lesson set up the frames a GNC engineer works in: NED, ECEF, ECI, body and the rest. This lesson is about turning from one frame to another — a **rotation** — and the three common ways to write one down: three angles, a 3-by-3 matrix, or four numbers called a **quaternion**. MATLAB's Aerospace Toolbox has a small set of functions that convert between them: `angle2dcm`, `dcm2angle`, `dcm2quat`, `quat2dcm`, `quatmultiply` and `quatrotate`.

The four quaternion numbers have a date-style trap. MathWorks writes them in one order and SciPy, the Python library you already met, writes them in another. Pass one to the other without reordering and you get a rotation that looks healthy and points somewhere else. By the end of this lesson you will be able to spot that mistake in a code review in well under a minute.

## Three ways to write one attitude

**Attitude** means which way a vehicle is pointing — its orientation relative to some reference frame. Picture an airplane parked on a runway pointing north. To describe any other attitude, you can say how to turn it from there.

The most familiar way uses three angles, the **Euler angles**:

- **yaw** $\psi$ (read "psi"): turn the nose left or right, about the vertical axis;
- **pitch** $\theta$ (read "theta"): tilt the nose up or down, about the new right-wing axis;
- **roll** $\phi$ (read "phi"): bank the wings, about the new nose axis.

Order matters. Yaw 90 degrees then pitch 30 degrees ends somewhere different from pitch 30 degrees then yaw 90 degrees — try it with a book on your desk. The order "yaw, then pitch, then roll" turns about the z, then y, then x axes, so it is called the **ZYX sequence**. It is the standard sequence for aircraft and rockets referenced to NED.

The second way is a **direction cosine matrix**, or **DCM**: a 3-by-3 matrix that converts a vector's coordinates in one frame into its coordinates in another. The third way is the quaternion. The rest of the lesson takes them in turn.

## Direction cosine matrices: angle2dcm and dcm2angle

Here is the everyday picture for a DCM. You stand facing north and a friend says "the tower is straight ahead". You turn 30 degrees to your right. The tower has not moved, but now it is ahead and a bit to your left. A DCM does that bookkeeping: same vector, new coordinates, because *you* turned.

In the Aerospace Toolbox, the DCM from `angle2dcm` takes a vector written in the reference frame (say NED) and returns the same vector written in the body frame:

$$
\mathbf{v}_{b} = \mathbf{C}\,\mathbf{v}_{n}.
$$

Read $\mathbf{v}_b$ as "v in body" and $\mathbf{v}_n$ as "v in NED". Each row of $\mathbf{C}$ is one body axis written in NED coordinates: row 1 is where the nose points, row 2 is the right wing, row 3 is the belly. That is why the entries are **[[cosines|direction-cosines]]** — each one is the cosine of the angle between a body axis and a NED axis.

Because the three body axes are at right angles and have length 1, a DCM is an **orthonormal** matrix: its inverse is its transpose, $\mathbf{C}^{-1} = \mathbf{C}^{\mathsf{T}}$, and its determinant is $+1$. Going back from body to NED costs nothing: `C.'` does it.

```matlab
yaw = deg2rad(30); pitch = 0; roll = 0;
C = angle2dcm(yaw, pitch, roll)     % default sequence 'ZYX'
%    0.8660    0.5000         0
%   -0.5000    0.8660         0
%         0         0    1.0000

[r1, r2, r3] = dcm2angle(C);        % back to angles, same 'ZYX' default
rad2deg([r1 r2 r3])                 %   30.0000         0         0
```

Three things to notice about the call:

1. The angles are in **radians**. `deg2rad` does the conversion.
2. The arguments come in the order of the sequence. For the default `'ZYX'`, that is yaw, pitch, roll — not roll, pitch, yaw.
3. A different sequence is a fourth argument, a string such as `'ZXY'` or `'XYZ'`. `dcm2angle` takes the same string, and you must use the same one both ways.

::: key
`C = angle2dcm(yaw, pitch, roll)` uses the `'ZYX'` sequence by default, takes radians, and returns the matrix that maps reference-frame (NED) coordinates to body coordinates. `dcm2angle(C)` undoes it. The inverse of a DCM is its transpose.
:::

::: example A 30 degree yaw, checked by hand
**Problem.** A rocket on the pad is yawed 30 degrees: its nose axis points 30 degrees east of north. Where does a vector pointing due north, $\mathbf{v}_n = [1, 0, 0]$, appear in body coordinates?

**Step 1: build the matrix.** For a pure yaw $\psi$, the ZYX DCM is

$$
\mathbf{C} = \begin{bmatrix} \cos\psi & \sin\psi & 0 \\ -\sin\psi & \cos\psi & 0 \\ 0 & 0 & 1 \end{bmatrix}
= \begin{bmatrix} 0.8660 & 0.5000 & 0 \\ -0.5000 & 0.8660 & 0 \\ 0 & 0 & 1 \end{bmatrix},
$$

since $\cos 30^\circ = 0.8660$ and $\sin 30^\circ = 0.5000$. That is the `angle2dcm` output above.

**Step 2: multiply.** $\mathbf{C}\,[1, 0, 0]^{\mathsf{T}}$ picks out the first column: $\mathbf{v}_b = [0.8660, -0.5000, 0]$.

**Step 3: sanity check.** Body x is the nose and body y is the right wing. North is mostly ahead ($0.866$) and partly toward the *left* wing ($-0.5$). That is right: if you turn 30 degrees to your right, north ends up ahead and to your left. The length is $\sqrt{0.866^2 + 0.5^2} = 1$, as a rotation must keep it.
:::

::: warning Degrees, and the order of the angles
`angle2dcm(30, 0, 0)` does not complain. It builds a yaw of 30 **radians**, about 1,719 degrees, which lands 279 degrees round the circle. The matrix is a perfectly valid rotation, so nothing downstream looks broken. Convert with `deg2rad` at the call, every time. And with the default sequence, the first argument is yaw; passing roll first swaps two axes without any error.
:::

Euler angles have one famous weakness. When pitch reaches plus or minus 90 degrees — a rocket standing straight up on the pad, referenced to NED — yaw and roll turn about the same line and can no longer be told apart. This is **[[gimbal lock|gimbal-lock]]**: the three angles lose one degree of freedom, and `dcm2angle` has to pick one of infinitely many answers. It is a flaw of the three-number description, not of the vehicle. It is the main reason flight software stores attitude as a quaternion.

## Quaternions in plain words

Hold a pencil and a mug. However you have turned the mug, there is always a single axis you could have turned it about, by a single angle, to get it there from its start. This is **[[Euler's rotation theorem|euler-theorem]]**: every rotation is one turn by an angle $\theta$ about one unit axis $\hat{\mathbf{n}}$ (read "n hat").

A **quaternion** packs that axis and angle into four numbers:

$$
\mathbf{q} = \begin{bmatrix} w & x & y & z \end{bmatrix}
= \begin{bmatrix} \cos\frac{\theta}{2} & n_x \sin\frac{\theta}{2} & n_y \sin\frac{\theta}{2} & n_z \sin\frac{\theta}{2} \end{bmatrix}.
$$

- $w$ is the **scalar part**: one number that depends only on the angle.
- $x, y, z$ make the **vector part**: the axis, scaled by the sine of half the angle.

Read it as "w, then x y z". The angle appears **[[halved|half-angle]]**. That looks odd, but it is what makes the multiplication rule below work. Because $\cos^2 + \sin^2 = 1$ and the axis has length 1, an attitude quaternion always has length 1:

$$
w^2 + x^2 + y^2 + z^2 = 1.
$$

That is a **unit quaternion**. Four numbers with one rule between them leave three free numbers — exactly the three degrees of freedom of an attitude, with no gimbal lock anywhere.

### Reading a quaternion by eye

The scalar part tells you the angle straight away: $\theta = 2\arccos(w)$. So you can read the size of a rotation from one number.

| $w = \cos(\theta/2)$ | Angle $\theta$ | What it looks like |
|---|---|---|
| $1$ | 0 degrees | no rotation: $[1\ 0\ 0\ 0]$ |
| $0.9659$ | 30 degrees | a small turn |
| $0.7071$ | 90 degrees | a quarter turn |
| $0$ | 180 degrees | a half turn |

The last row matters. When the scalar part is zero, $\cos(\theta/2) = 0$, so $\theta/2 = 90^\circ$ and $\theta = 180^\circ$. The whole length of the quaternion then sits in the vector part, and that vector is the axis of the half turn. A zero scalar part is not "empty" or "no rotation" — it is the biggest turn there is.

One more rule: $\mathbf{q}$ and $-\mathbf{q}$ describe the same attitude. Turning $+\theta$ about $\hat{\mathbf{n}}$ and turning $360^\circ - \theta$ the other way end in the same place. So a quaternion with a negative $w$ is fine; flip all four signs if you want $w \ge 0$.

::: key
A unit quaternion $[w\ x\ y\ z]$ has $w = \cos(\theta/2)$ and $[x\ y\ z] = \hat{\mathbf{n}}\sin(\theta/2)$. The identity is $[1\ 0\ 0\ 0]$; $w$ near 1 means a small rotation; $w = 0$ means a 180 degree turn about the axis in $[x\ y\ z]$. $\mathbf{q}$ and $-\mathbf{q}$ are the same attitude.
:::

## The scalar-first convention and the SciPy trap

Now the date problem. Every library agrees on what $w, x, y, z$ are. They disagree on where to put $w$.

- **MathWorks Aerospace products** (Aerospace Toolbox and Aerospace Blockset) put the scalar first: $[w\ x\ y\ z]$. So does the `quaternion` object in MathWorks' navigation and sensor-fusion toolboxes.
- **SciPy's** `scipy.spatial.transform.Rotation` puts it last: `as_quat()` returns $[x\ y\ z\ w]$, and `from_quat()` expects that order. Recent SciPy versions (1.14 and later) accept `scalar_first=True` to change this, but the default is scalar last.
- Plenty of other software is scalar last too, for example the quaternion messages in **[[ROS|scalar-last-world]]**.

::: key
MathWorks Aerospace products use scalar first: [w x y z]. SciPy spatial.transform.Rotation is scalar last. Passing one to the other without reordering silently produces a wrong rotation of the right magnitude.
:::

"Right magnitude" means the length is still 1. Any reordering of four numbers keeps $w^2 + x^2 + y^2 + z^2$ the same, so a norm check passes, the attitude filter keeps running, and the plots look smooth. Only the rotation itself has changed.

```matlab
q = angle2quat(deg2rad(30), 0, 0)   % yaw 30 deg, default 'ZYX'
%   0.9659         0         0    0.2588
```

```python
from scipy.spatial.transform import Rotation as R
r = R.from_euler('z', 30, degrees=True)
print(r.as_quat())                  # about [0, 0, 0.2588, 0.9659]
print(r.as_quat(scalar_first=True)) # about [0.9659, 0, 0, 0.2588]
```

::: example What a flipped quaternion does
**Problem.** MATLAB produces $[0.9659\ 0\ 0\ 0.2588]$ for a 30 degree yaw. A Python ground tool loads those four numbers with `R.from_quat(...)` without reordering. What attitude does the tool think it has?

**Step 1: read it the way SciPy does.** SciPy takes the *last* number as $w$, so $w = 0.2588$ and the vector part is $[0.9659\ 0\ 0]$, pointing along x.

**Step 2: the angle.** $\theta = 2\arccos(0.2588) = 2 \times 75^\circ = 150^\circ$.

**Step 3: the axis.** The vector part points along x, the roll axis.

**Result.** The tool believes the vehicle has rolled 150 degrees — nearly upside down — when it has yawed 30 degrees. The length is $\sqrt{0.9659^2 + 0.2588^2} = 1.000$, so no check on the norm fires.

**Sanity check.** A small rotation has $w$ close to 1. The true attitude is a small turn, and its big number sits in slot 1 of the MathWorks array. The misread version turned a small turn into a large one, which is the typical signature of this bug.
:::

### Spotting the flip in a code review

You can catch this in under thirty seconds with four habits.

1. **Find the big number.** Most real attitudes in a test case are modest, so $w$ is the element near 1. In MathWorks output it must be in position 1. If the element near 1 is in position 4, someone has scalar-last data.
2. **Push the identity through.** Feed "no rotation" across the interface. MathWorks expects $[1\ 0\ 0\ 0]$; if the far side receives $[0\ 0\ 0\ 1]$ or builds a 180 degree turn, the order is flipped.
3. **Push a known rotation through.** A 30 degree yaw must come back as a 30 degree yaw, not as some other angle about another axis. A unit test with one known rotation catches it; a norm test never will.
4. **Name the order.** Call variables `q_wxyz` or `q_xyzw`, and look hard at every `from_quat` and `as_quat` call that touches MATLAB data.

::: warning Reordering fixes the order, not the meaning
Swapping the elements makes the numbers agree, but SciPy and `quat2dcm` still use the same quaternion differently. SciPy's `as_matrix()` gives the matrix that *rotates a vector*; `quat2dcm` gives the matrix that re-expresses a fixed vector in the turned frame. One is the transpose of the other. For the 30 degree yaw, SciPy's matrix has $-0.5$ in row 1, column 2, where `quat2dcm` has $+0.5$. When you compare the two tools, compare `quat2dcm(q)` with `r.as_matrix().T`.
:::

## Converting and combining: quat2dcm, dcm2quat, quatmultiply, quatrotate

The remaining functions convert between the forms and put rotations together. They all take quaternions as rows: one quaternion is a 1-by-4 row, and $m$ of them are an $m$-by-4 array. Vectors are rows too: 1-by-3, or $m$-by-3.

```matlab
q = angle2quat(deg2rad(30), 0, 0);  % [0.9659 0 0 0.2588]
C = quat2dcm(q)                     % same matrix angle2dcm gave
%    0.8660    0.5000         0
%   -0.5000    0.8660         0
%         0         0    1.0000
q2 = dcm2quat(C)                    % back again
%   0.9659         0         0    0.2588
```

`quat2dcm` and `angle2dcm` agree because both describe the same attitude. `dcm2quat` goes the other way.

**`quatrotate(q, v)`** applies the quaternion to a vector. It uses the same convention as `quat2dcm`: the result is the vector `v` re-expressed in the rotated frame, which equals `(quat2dcm(q) * v.').'`. So with the yaw quaternion, `quatrotate(q, [1 0 0])` returns `[0.8660 -0.5000 0]`, matching the DCM example. Keep that in mind when porting to SciPy, whose `r.apply(v)` rotates the vector the other way and gives `[0.8660 0.5000 0]`.

**`quatmultiply(q, r)`** combines two rotations with the **[[Hamilton product|hamilton]]**. Written out for $\mathbf{q} = [q_0\ q_1\ q_2\ q_3]$ and $\mathbf{r} = [r_0\ r_1\ r_2\ r_3]$, the scalar part of the product is

$$
n_0 = q_0 r_0 - q_1 r_1 - q_2 r_2 - q_3 r_3,
$$

and the vector part is $q_0$ times $r$'s vector, plus $r_0$ times $q$'s vector, plus the **[[cross product|cross-product]]** of $q$'s vector with $r$'s. Like the Euler angles, the order matters: `quatmultiply(q, r)` and `quatmultiply(r, q)` generally differ.

::: example Yaw then pitch, two ways
**Problem.** Yaw 30 degrees, then pitch 10 degrees about the new right-wing axis. Build the quaternion by multiplying, and check it against `angle2quat`.

**Step 1: each turn alone.** The yaw is $[\cos 15^\circ, 0, 0, \sin 15^\circ] = [0.9659, 0, 0, 0.2588]$. The pitch, a turn about y by 10 degrees, is $[\cos 5^\circ, 0, \sin 5^\circ, 0] = [0.9962, 0, 0.0872, 0]$.

**Step 2: multiply, first turn on the left.** The scalar part is $q_0 r_0$ minus three products that are all zero here, so with one more digit it is $0.96593 \times 0.99619 = 0.96225$, which rounds to $0.9623$. Working the other three parts the same way gives

```matlab
qy = angle2quat(deg2rad(30), 0, 0);
qp = angle2quat(0, deg2rad(10), 0);
quatmultiply(qy, qp)                        %  0.9623  -0.0226   0.0842   0.2578
angle2quat(deg2rad(30), deg2rad(10), 0)     %  0.9623  -0.0226   0.0842   0.2578
quatmultiply(qp, qy)                        %  0.9623   0.0226   0.0842   0.2578
```

**Step 3: compare.** The product with the yaw on the left matches `angle2quat` exactly. Swapping the order flips the sign of the x part — a different attitude.

**Sanity check.** $w = 0.9623$ gives $\theta = 2\arccos(0.9623) = 31.6^\circ$. A 30 degree turn and a 10 degree turn at right angles should combine into something a little over 30 degrees, and less than 40. It is.
:::

::: note Why half the angle?
To rotate a vector $\mathbf{v}$ with quaternions, you write it as a quaternion with zero scalar part, $[0\ \mathbf{v}]$, and sandwich it: $\mathbf{q}\otimes[0\ \mathbf{v}]\otimes\mathbf{q}^{*}$, where $\mathbf{q}^{*} = [w\ {-x}\ {-y}\ {-z}]$ is the **conjugate**. The vector is multiplied by $\mathbf{q}$ twice, once on each side, and each side contributes half of the turn. So each $\mathbf{q}$ has to carry $\theta/2$ for the total to be $\theta$. The same fact explains why $-\mathbf{q}$ gives the same rotation: the two minus signs in the sandwich cancel. `quatrotate` is this sandwich with the conjugate on the other side, $\mathbf{q}^{*}\otimes[0\ \mathbf{v}]\otimes\mathbf{q}$, which is why it re-expresses the vector in the turned frame instead of turning it.
:::

::: warning Normalize after arithmetic
Every multiplication rounds a little. After many thousands of attitude updates, the length drifts away from 1, and a quaternion that is not unit length stretches vectors as well as turning them. Flight code renormalizes regularly; in MATLAB, `quatnormalize(q)` does it.
:::

## Check yourself

::: check
A MATLAB Aerospace function returns $[0.7071\ 0\ 0\ 0.7071]$. What rotation is it?
:::

::: answer
MathWorks is scalar first, so $w = 0.7071$ and the vector part is $[0\ 0\ 0.7071]$. The angle is $2\arccos(0.7071) = 2 \times 45^\circ = 90^\circ$. The vector part points along z, so it is a 90 degree yaw. Check the length: $0.7071^2 + 0.7071^2 = 1.000$.
:::

::: check
A Python tool prints `[0. 0.7071 0. 0.7071]` from `as_quat()`. Write the same rotation for MATLAB, and say what it is.
:::

::: answer
SciPy is scalar last, so $w$ is the final $0.7071$ and the vector part is $[0\ 0.7071\ 0]$. In MathWorks order it is $[0.7071\ 0\ 0.7071\ 0]$. The angle is $2\arccos(0.7071) = 90^\circ$ about y: a 90 degree pitch, which points the nose straight up.
:::

::: check
A teammate says, "My unit test checks that every quaternion has norm 1, so a scalar-first versus scalar-last mix-up would be caught." Is that right?
:::

::: answer
No. Reordering the four numbers does not change $w^2 + x^2 + y^2 + z^2$, so a swapped quaternion still has norm 1 and passes. The test needs a known rotation: push, say, a 30 degree yaw through the interface and check that the angle and axis come back unchanged, or check that the identity arrives as $[1\ 0\ 0\ 0]$.
:::

::: check
Someone writes `C = angle2dcm(30, 0, 0)` meaning a 30 degree yaw. What rotation do they get, and how could they have noticed?
:::

::: answer
The inputs are radians, so they get 30 rad of yaw. That is $30 \times 180/\pi = 1718.9^\circ$, and $1718.9 - 4 \times 360 = 278.9^\circ$ — a yaw of about 279 degrees, or 81 degrees to the left. It is still a valid rotation, so nothing errors. They could notice by checking the matrix: a 30 degree yaw must have $\cos 30^\circ = 0.866$ in the top-left corner, while this one has $\cos 278.9^\circ = 0.155$. Fix: `angle2dcm(deg2rad(30), 0, 0)`.
:::

::: check
Explain why `quatmultiply(qy, qp)` and `quatmultiply(qp, qy)` can differ, using a book on a desk.
:::

::: answer
Turn a book 90 degrees about the vertical, then 90 degrees about its own spine; note where the cover faces. Start again and do the two turns in the other order: it ends up differently. Rotations do not commute, and quaternion multiplication is built to copy that, so swapping the factors gives a different quaternion — in the example above, the sign of the x part flipped.
:::

## Summary

| Idea | Meaning | Function or fact |
|---|---|---|
| Euler angles | yaw $\psi$, pitch $\theta$, roll $\phi$ | default sequence `'ZYX'`, radians |
| DCM | reference coordinates to body coordinates | `angle2dcm`, `dcm2angle`; $\mathbf{C}^{-1} = \mathbf{C}^{\mathsf{T}}$ |
| Gimbal lock | Euler angles fail at pitch $\pm 90^\circ$ | why flight code stores quaternions |
| Quaternion | axis and half-angle in four numbers | $[\cos\frac{\theta}{2},\ \hat{\mathbf{n}}\sin\frac{\theta}{2}]$, unit length |
| Reading $w$ | angle from the scalar part | $\theta = 2\arccos w$; $w = 0$ is a half turn |
| MathWorks order | scalar first | $[w\ x\ y\ z]$ |
| SciPy order | scalar last | $[x\ y\ z\ w]$; `scalar_first=True` in SciPy 1.14+ |
| Conversions | between the forms | `quat2dcm`, `dcm2quat`, `angle2quat` |
| Combining | first rotation on the left | `quatmultiply(q1, q2)`; order matters |
| Applying | re-express a vector in the turned frame | `quatrotate(q, v)` $=$ `(quat2dcm(q)*v.').'` |

The next lesson leaves geometry for the environment around the vehicle: the atmosphere, gravity and magnetic field models in Aerospace Toolbox, and the altitudes where each one stops being valid.

::: context direction-cosines Where "direction cosine" comes from
Take the nose axis, a unit arrow, and the north axis, another unit arrow. Their dot product is the cosine of the angle between them. Do that for every pair of one body axis and one NED axis and you get nine cosines. Arrange them with one body axis per row and you have the DCM. That is the whole name: a matrix of the cosines of the angles between directions.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="180" y1="140" x2="180" y2="20" stroke="#6c7a93" stroke-width="2"/>
  <polygon points="180,14 175,26 185,26" fill="#6c7a93"/>
  <text x="188" y="24" font-size="12" fill="#6c7a93">north</text>
  <line x1="180" y1="140" x2="240" y2="36" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="243,31 234,39 243,43" fill="#1d6fd1"/>
  <text x="248" y="40" font-size="12" fill="#1d6fd1">nose</text>
  <path d="M180,100 A40,40 0 0 1 200,105" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="196" y="94" font-size="12" fill="#b4232c">30°</text>
  <text x="20" y="150" font-size="12" fill="#1f2a44">C(1,1) = cos 30° = 0.866</text>
</svg>
```
:::

::: context gimbal-lock Why three angles jam
The name comes from a mechanical gyroscope platform held in three nested rings, or gimbals. When the middle ring turns 90 degrees, the inner and outer rings end up spinning about the same line, and one direction of motion is lost. The Apollo spacecraft's guidance platform had a warning light for getting close to this state, and crews flew their maneuvers to stay clear of it. In software the same thing happens with the numbers: at pitch 90 degrees, yaw and roll describe the same motion, and small attitude changes can require huge jumps in the angles.
:::

::: context euler-theorem One axis, one angle
Leonhard Euler proved in the 1770s that any change of orientation of a rigid body, with one point held fixed, is a single rotation about some axis through that point. It sounds surprising, because you may have reached the attitude with many twists. But the net effect is always one turn about one axis. Quaternions are built directly on this: four numbers that store that one axis and that one angle.
:::

::: context half-angle Seeing the half angle
For a 30 degree yaw, the quaternion stores 15 degrees: $w = \cos 15^\circ = 0.9659$ and $z = \sin 15^\circ = 0.2588$. The picture plots $w = \cos(\theta/2)$ against the turn angle $\theta$. It passes through zero at a half turn and reaches $-1$ after a full turn — the negative of the identity, which is the same attitude as $[1\ 0\ 0\ 0]$. That is the $\mathbf{q}$ and $-\mathbf{q}$ rule.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="80" x2="335" y2="80" stroke="#6c7a93" stroke-width="1"/>
  <line x1="40" y1="25" x2="40" y2="135" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="12" fill="#1f2a44" text-anchor="end">
    <text x="34" y="34">1</text><text x="34" y="84">0</text><text x="34" y="134">−1</text>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="112" y="152">90°</text><text x="185" y="152">180°</text><text x="257" y="152">270°</text><text x="330" y="152">360°</text>
  </g>
  <text x="200" y="18" font-size="12" fill="#1d6fd1" text-anchor="middle">w = cos(θ/2) against turn angle θ</text>
  <polyline points="40,30 76.2,33.8 112.5,44.6 148.8,60.9 185,80 221.2,99.1 257.5,115.4 293.8,126.2 330,130" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="40" cy="30" r="3.5" fill="#b4232c"/>
  <circle cx="112.5" cy="44.6" r="3.5" fill="#b4232c"/>
  <text x="120" y="40" font-size="12" fill="#b4232c">0.707</text>
  <circle cx="185" cy="80" r="3.5" fill="#b4232c"/>
  <text x="192" y="72" font-size="12" fill="#b4232c">half turn: w = 0</text>
  <circle cx="330" cy="130" r="3.5" fill="#b4232c"/>
</svg>
```
:::

::: context scalar-last-world Who puts the scalar where
There is no single world standard. MathWorks puts $w$ first. SciPy, the Robot Operating System (ROS) messages and many game engines put it last. The Eigen C++ library takes $w$ first in its constructor but stores it last in memory. NASA's Jet Propulsion Laboratory historically used a scalar-last convention with a different multiplication rule as well. So every interface document on a flight project should say, in writing, the element order, the multiplication rule, and whether the quaternion turns vectors or frames.
:::

::: context hamilton A formula carved into a bridge
William Rowan Hamilton invented quaternions in 1843 while walking along the Royal Canal in Dublin. He was so pleased that he scratched the rule $i^2 = j^2 = k^2 = ijk = -1$ into the stone of Brougham Bridge. The carving is long gone, but a plaque marks the spot. The quaternion $[w\ x\ y\ z]$ is Hamilton's $w + xi + yj + zk$, and `quatmultiply` is his product.
:::

::: context cross-product The cross product in one line
The cross product of two 3-vectors $\mathbf{a}$ and $\mathbf{b}$ is a third vector at right angles to both, with length $|\mathbf{a}||\mathbf{b}|\sin\alpha$, where $\alpha$ is the angle between them. In components, $\mathbf{a}\times\mathbf{b} = [a_2 b_3 - a_3 b_2,\ a_3 b_1 - a_1 b_3,\ a_1 b_2 - a_2 b_1]$. MATLAB computes it with `cross(a, b)`. Swapping the order flips its sign, which is where the order-dependence of `quatmultiply` comes from.
:::
