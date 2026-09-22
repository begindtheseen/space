---
id: l01-the-direction-cosine-matrix-and-so3
title: The direction cosine matrix and SO(3)
minutes: 19
covers:
  - the direction cosine matrix and SO(3)
---

Attitude is the one part of a vehicle's state that has no natural coordinates. Position is three numbers and velocity is three more, and nobody argues about which three. Orientation is different: it lives on a curved three-dimensional set with no boundary and no global coordinate chart, and every way of writing it down is a compromise. This module works through the four representations flight software actually uses — direction cosine matrices, Euler angles, quaternions and Rodrigues parameters — and the conversions among them. All of them are descriptions of one object, and that object is the direction cosine matrix.

The direction cosine matrix, or DCM, is the most concrete of the four. It is nine numbers arranged so that multiplying by it re-expresses a vector's components from one frame to another. A star tracker reports a quaternion; the flight computer turns it into a DCM to rotate a Sun vector into body axes; the guidance law reads Euler angles off the same matrix for a human display. The DCM is the object in the middle that every other representation is defined against, and it is the one where the constraints are visible: you can look at nine numbers and check them.

Module 15 introduced rotation matrices as coordinate transformations and established the elementary rotations about single axes. This lesson picks that up and asks the structural question the rest of the module depends on: what is the set of all valid DCMs? The answer is a group called $SO(3)$, the nine numbers obey six constraints leaving three degrees of freedom, and those three degrees of freedom on a curved set are exactly what makes Euler angles have a singularity and quaternions need a fourth parameter.

## Conventions used throughout this module

Attitude software fails more often from mixed conventions than from bad mathematics. Every lesson in this module holds to the following, and each lesson restates the part it uses.

- Frames are named with capital letters. $N$ is the reference frame, usually inertial; $B$ is the body frame, fixed in the vehicle.
- $\mathbf{C}_{A \leftarrow B}$ is the **coordinate transformation** from $B$ components to $A$ components: $\mathbf{v}^{A} = \mathbf{C}_{A \leftarrow B}\,\mathbf{v}^{B}$. Read the arrow left. This is module 15's $\mathbf{R}_{A \leftarrow B}$; the letter changes to $\mathbf{C}$ because $\mathbf{R}$ is needed later for the rotation operator of the Rodrigues formula.
- The **attitude matrix** of a vehicle is $\mathbf{C}_{N \leftarrow B}$, whose columns are the body axes written in reference components. Module 14 called this same matrix $\mathbf{R}$ in $\mathbf{r}_N = \mathbf{R}\,\mathbf{r}_B$. Most flight code stores its transpose, $\mathbf{C}_{B \leftarrow N}$, because measurements arrive in reference axes and are needed in body axes.
- Quaternions are unit, scalar-first and Hamilton. Lessons 05 and 06 define exactly what that means and why it matters.

## Direction cosines

Let $A$ and $B$ be two right-handed orthonormal frames sharing an origin, with axes $\hat{\mathbf{a}}_1,\hat{\mathbf{a}}_2,\hat{\mathbf{a}}_3$ and $\hat{\mathbf{b}}_1,\hat{\mathbf{b}}_2,\hat{\mathbf{b}}_3$. A physical vector $\mathbf{r}$ has components $r^A_i = \mathbf{r}\cdot\hat{\mathbf{a}}_i$ and $r^B_j = \mathbf{r}\cdot\hat{\mathbf{b}}_j$. Expanding $\mathbf{r} = \sum_j r^B_j \hat{\mathbf{b}}_j$ and dotting with $\hat{\mathbf{a}}_i$,

$$
r^A_i = \sum_{j=1}^{3}\bigl(\hat{\mathbf{a}}_i\cdot\hat{\mathbf{b}}_j\bigr)\,r^B_j,
\qquad
\bigl[\mathbf{C}_{A \leftarrow B}\bigr]_{ij} = \hat{\mathbf{a}}_i\cdot\hat{\mathbf{b}}_j = \cos\alpha_{ij},
$$

where $\alpha_{ij}$ is the angle between $\hat{\mathbf{a}}_i$ and $\hat{\mathbf{b}}_j$. Every entry is the cosine of an angle between two axes, which is where the name comes from, and every entry therefore lies in $[-1, 1]$.

Two readings of the matrix are worth committing to memory, because they let you write a DCM down from a drawing without any algebra.

- **Column $j$ is $\hat{\mathbf{b}}_j$ resolved in $A$.** Multiply $\mathbf{C}_{A\leftarrow B}$ by $(1,0,0)$ — the components of $\hat{\mathbf{b}}_1$ in its own frame — and you get the first column.
- **Row $i$ is $\hat{\mathbf{a}}_i$ resolved in $B$.** Rows of $\mathbf{C}_{A\leftarrow B}$ are columns of $\mathbf{C}_{B\leftarrow A}$.

Chaining follows from the definition and reads like dominoes: $\mathbf{C}_{A\leftarrow C} = \mathbf{C}_{A\leftarrow B}\,\mathbf{C}_{B\leftarrow C}$, inner labels matching, and the matrix nearest the vector acting first.

::: example A star tracker mount, written down and checked
A star tracker sits on a spacecraft bus with its boresight tilted $25^\circ$ from the body $+z$ axis, in the azimuth direction $40^\circ$ round from body $+x$. Take the sensor frame $S$ to be the body frame turned first through $40^\circ$ about body $z$ and then through $25^\circ$ about the new $y$ axis, so the sensor $z$ axis is the boresight. The columns of $\mathbf{C}_{B\leftarrow S}$ are the sensor axes in body components:

$$
\mathbf{C}_{B\leftarrow S} =
\begin{bmatrix}
0.694272 & -0.642788 & 0.323744\\
0.582563 & 0.766044 & 0.271654\\
-0.422618 & 0 & 0.906308
\end{bmatrix}.
$$

Check it before trusting it. The third column, the boresight in body axes, is $(0.3237,\ 0.2717,\ 0.9063)$; its $z$ component is $\cos 25^\circ = 0.9063$, so the tilt is right. Its norm is $1.000000$. The first two columns have unit norm and dot product $-2.7\times 10^{-17}$, and their cross product reproduces the third column to $10^{-16}$, so the triad is right-handed. Finally $\det\mathbf{C}_{B\leftarrow S} = 1.0000000$ and $\max\lvert\mathbf{C}^\top\mathbf{C} - \mathbf{I}_3\rvert = 1.1\times 10^{-16}$.

Now use it. The tracker reports a star at $\mathbf{m}^{S} = (0.100,\ -0.200,\ 0.9747)$, a unit vector $12.92^\circ$ off the boresight. In body axes,

$$
\mathbf{m}^{B} = \mathbf{C}_{B\leftarrow S}\,\mathbf{m}^{S} = (0.5135,\ 0.1698,\ 0.8411).
$$

Its norm is $1.000000$ and its angle from the body-frame boresight $(0.3237, 0.2717, 0.9063)$ is $\arccos(0.9747) = 12.92^\circ$ — unchanged, as a rotation must leave it. That invariance is the check to run whenever you suspect a frame chain: angles between vectors survive any correct DCM.
:::

## The six constraints and the determinant

Because both frames are orthonormal, the columns of $\mathbf{C}_{A\leftarrow B}$ are mutually orthogonal unit vectors. In matrix form,

$$
\mathbf{C}^{\top}\mathbf{C} = \mathbf{I}_3 .
$$

That is nine scalar equations, but $\mathbf{C}^\top\mathbf{C}$ is symmetric, so only six are independent: three saying each column has unit length, three saying each pair is perpendicular. Nine entries minus six constraints leaves **three degrees of freedom**. Every representation in this module is an attempt to carry those three numbers conveniently, and the three-parameter ones all pay for it with a singularity.

Orthogonality alone is not enough. A matrix with $\mathbf{C}^\top\mathbf{C}=\mathbf{I}_3$ has $\det\mathbf{C} = \pm 1$, and the minus sign is a reflection: a right-handed triad sent to a left-handed one. No rigid rotation can do that, because rotations are continuous from the identity and the determinant cannot jump from $+1$ to $-1$ along a continuous path. So a DCM satisfies both

$$
\mathbf{C}^{\top}\mathbf{C} = \mathbf{I}_3
\qquad\text{and}\qquad
\det\mathbf{C} = +1 .
$$

The inverse is free: multiply $\mathbf{C}^\top\mathbf{C}=\mathbf{I}_3$ on the right by $\mathbf{C}^{-1}$ to get $\mathbf{C}^{-1} = \mathbf{C}^{\top}$, so $\mathbf{C}_{B\leftarrow A} = \mathbf{C}_{A\leftarrow B}^{\top}$. Reversing a frame transformation never needs a linear solve, which matters when it happens a thousand times a second.

::: key What a DCM is
$\mathbf{C}_{A\leftarrow B}$ has entries $\hat{\mathbf{a}}_i\cdot\hat{\mathbf{b}}_j$, takes components from $B$ to $A$ as $\mathbf{v}^A = \mathbf{C}_{A\leftarrow B}\mathbf{v}^B$, has column $j$ equal to $\hat{\mathbf{b}}_j$ in $A$ components, satisfies $\mathbf{C}^\top\mathbf{C} = \mathbf{I}_3$ and $\det\mathbf{C} = +1$, and inverts by transposition. Nine entries, six constraints, three degrees of freedom.
:::

::: warning A determinant of $-1$ is a reflection, not a rotation
Every element of $SO(3)$ has determinant exactly $+1$. A telemetry matrix that comes back with $\det = -1$ is not a badly conditioned rotation; it is a rotation composed with a mirror. The usual causes are a single axis defined with the wrong sign, or a left-handed triad typed in as if it were right-handed — "north, east, up" is the classic, since north $\times$ east points down. Note what the determinant will *not* catch: relabelling north-east-down as east-north-up is the matrix with rows $(0,1,0)$, $(1,0,0)$, $(0,0,-1)$, whose determinant is $+1$ and whose trace is $-1$, a perfectly proper $180^\circ$ rotation. Both frames are right-handed, so the mix-up passes every structural test and corrupts the data silently.
:::

## SO(3): the group of rotations

Collect every $3\times 3$ real matrix satisfying those two conditions and call the set

$$
SO(3) = \bigl\{\mathbf{C}\in\mathbb{R}^{3\times 3} : \mathbf{C}^{\top}\mathbf{C} = \mathbf{I}_3,\ \det\mathbf{C} = +1\bigr\}.
$$

The letters stand for *special* (determinant $+1$) *orthogonal* group in three dimensions. It is a group under matrix multiplication, and each axiom says something physical.

- **Closure.** If $\mathbf{C}_1$ and $\mathbf{C}_2$ are in $SO(3)$ then so is $\mathbf{C}_1\mathbf{C}_2$: the product is orthogonal because $(\mathbf{C}_1\mathbf{C}_2)^\top\mathbf{C}_1\mathbf{C}_2 = \mathbf{C}_2^\top\mathbf{C}_1^\top\mathbf{C}_1\mathbf{C}_2 = \mathbf{I}_3$, and $\det(\mathbf{C}_1\mathbf{C}_2) = \det\mathbf{C}_1\det\mathbf{C}_2 = +1$. Physically: a rotation followed by a rotation is a rotation. This is what makes frame chains legal.
- **Associativity** is inherited from matrix multiplication, so a chain of four frames can be bracketed any way without changing the answer.
- **Identity.** $\mathbf{I}_3$ is in the set and represents "no rotation".
- **Inverse.** $\mathbf{C}^{\top}$ is in the set, since $(\mathbf{C}^\top)^\top\mathbf{C}^\top = \mathbf{C}\mathbf{C}^\top = \mathbf{I}_3$ and the determinant is unchanged by transposition.

What $SO(3)$ is **not** is commutative. $\mathbf{C}_1\mathbf{C}_2 \neq \mathbf{C}_2\mathbf{C}_1$ in general, and this is not a technicality — it is why the order of an Euler sequence is part of its definition, why quaternion multiplication is non-commutative, and why "rotate 90° about $x$, then 90° about $z$" is a different attitude from the same two turns reversed. Try it with a book.

Beyond the group structure, $SO(3)$ is a smooth three-dimensional surface sitting inside the nine-dimensional space of matrices. It is **compact**, because every entry is bounded by 1, and **connected**, because any rotation can be reached from the identity by continuously increasing an angle. It is also **not** homeomorphic to ordinary three-dimensional space, and that topological fact — developed in lesson 13 — is the reason no set of three parameters can cover it without a singularity. The singularity in Euler angles is not a bad choice of angles; it is a shadow of the shape of $SO(3)$.

## Keeping a DCM in SO(3)

Propagating attitude means integrating $\dot{\mathbf{C}}_{N\leftarrow B} = \mathbf{C}_{N\leftarrow B}\,[\boldsymbol{\omega}^B\times]$, the kinematic equation from module 14, where $[\boldsymbol{\omega}\times]$ is the skew-symmetric cross-product matrix. Nothing in a numerical integrator knows about the six constraints, so the propagated matrix drifts off $SO(3)$ and has to be pushed back.

The cheapest repair is one step of a Newton iteration for the nearest orthogonal matrix,

$$
\mathbf{C} \ \leftarrow\ \mathbf{C} - \tfrac{1}{2}\,\mathbf{C}\bigl(\mathbf{C}^{\top}\mathbf{C} - \mathbf{I}_3\bigr),
$$

which converges quadratically and — this is the point — does not change the attitude at all. Writing the polar decomposition $\mathbf{C} = \mathbf{Q}\mathbf{S}$ with $\mathbf{Q}$ orthogonal and $\mathbf{S}$ symmetric positive definite, the update is $\mathbf{Q}\mathbf{S}\bigl(\mathbf{I}_3 - \tfrac12(\mathbf{S}^2-\mathbf{I}_3)\bigr)$: the rotation factor $\mathbf{Q}$ passes straight through and only the stretch $\mathbf{S}$ is corrected.

```python
import numpy as np

def orthonormalise(C, n=2):
    """Newton iteration toward the nearest rotation. Leaves the attitude alone."""
    for _ in range(n):
        C = C - 0.5 * C @ (C.T @ C - np.eye(3))
    return C

def skew(v):
    x, y, z = v
    return np.array([[0.0, -z, y], [z, 0.0, -x], [-y, x, 0.0]])

w = np.array([0.0, np.deg2rad(2.0), 0.0])     # 2 deg/s pitch rate
C = np.eye(3)
for _ in range(60000):                        # 600 s at dt = 0.01 s, forward Euler
    C = C + 0.01 * (C @ skew(w))
print(np.abs(C.T @ C - np.eye(3)).max())      # 0.007337606900731153
print(np.linalg.det(C))                       # 1.0073376069007312
print(np.abs(orthonormalise(C).T @ orthonormalise(C) - np.eye(3)).max())
                                              # 1.2169713015097727e-09
```

::: example How fast a propagated DCM leaves SO(3)
Integrate a steady $2^\circ/\mathrm{s}$ pitch with forward Euler at $\Delta t = 0.01\,\mathrm{s}$ for $600\,\mathrm{s}$, which is $60{,}000$ steps and $1200^\circ$ of rotation. Each step multiplies by $\mathbf{I}_3 + \Delta t[\boldsymbol{\omega}\times]$, whose action in the rotation plane stretches lengths by $\sqrt{1 + (\omega\Delta t)^2}$. With $\omega\Delta t = 3.4907\times 10^{-4}$, that is a factor $1.0000000609$ per step, so after $60{,}000$ steps the in-plane column norms are $(1+(\omega\Delta t)^2)^{30000} = 1.003662$ — and the measured norms are $1.0036621$, with the out-of-plane column still exactly $1$.

The constraint violation is therefore $\max\lvert\mathbf{C}^\top\mathbf{C}-\mathbf{I}_3\rvert = 7.34\times 10^{-3}$ and $\det\mathbf{C} = 1.00734$: a matrix advertising itself as a rotation while stretching vectors by a third of a percent.

Now the part that surprises people. The *attitude* carried by that matrix is far more accurate than its constraint violation suggests. Each Euler step turns through $\arctan(\omega\Delta t)$ rather than $\omega\Delta t$, a deficit of $1.418\times 10^{-11}\,\mathrm{rad}$ per step, so after $60{,}000$ steps the rotation angle is short by $8.5\times 10^{-7}\,\mathrm{rad} = 4.87\times 10^{-5}$ degrees. Projecting the drifted matrix back onto $SO(3)$ and comparing with the exact answer gives $4.87\times 10^{-5}$ degrees, matching that prediction.

One Newton step reduces the constraint error from $7.34\times 10^{-3}$ to $4.03\times 10^{-5}$; a second takes it to $1.22\times 10^{-9}$. Neither changes the $4.87\times 10^{-5}$ degree attitude error, because re-orthonormalisation repairs the constraint, not the truncation. If you need a better attitude, you need a better integrator or a smaller step, not more normalising.
:::

::: warning Re-orthonormalising is not error correction
It is tempting to read a small $\lVert\mathbf{C}^\top\mathbf{C}-\mathbf{I}_3\rVert$ as evidence that attitude propagation is healthy. It is evidence of nothing of the sort. The two errors are independent: the example above has a constraint error $150$ times larger than its attitude error, and an integrator can equally well hold the constraint perfectly while drifting badly in angle. Monitor the constraint to catch corrupted data, and monitor the attitude against an independent measurement to catch drift.
:::

## Check yourself

::: check
A matrix arrives over telemetry with columns $(0.36, 0.48, 0.80)$, $(-0.80, 0.60, 0.00)$ and $(-0.48, -0.64, 0.60)$. Is it a valid DCM?
:::

::: answer
Check norms: $0.36^2+0.48^2+0.80^2 = 0.1296+0.2304+0.64 = 1.0000$; $0.64+0.36+0 = 1.0000$; $0.2304+0.4096+0.36 = 1.0000$. Check the three dot products: columns 1 and 2 give $-0.288+0.288+0 = 0$; columns 1 and 3 give $-0.1728-0.3072+0.48 = 0$; columns 2 and 3 give $0.384-0.384+0 = 0$. So $\mathbf{C}^\top\mathbf{C} = \mathbf{I}_3$. Now handedness: column 1 $\times$ column 2 $= (0.48\cdot 0 - 0.80\cdot 0.60,\ 0.80\cdot(-0.80) - 0.36\cdot 0,\ 0.36\cdot 0.60 - 0.48\cdot(-0.80)) = (-0.48, -0.64, 0.60)$, which is exactly column 3. The triad is right-handed, so $\det = +1$ and the matrix is a valid DCM.
:::

::: check
Why do nine direction cosines carry only three independent numbers, and what does that fact predict about three-parameter attitude representations?
:::

::: answer
The columns must be orthonormal, which is $\mathbf{C}^\top\mathbf{C}=\mathbf{I}_3$. That matrix equation is symmetric, so it imposes six independent scalar constraints — three unit-norm conditions and three orthogonality conditions — on nine entries, leaving $9-6=3$ free. The determinant condition selects one of two disconnected components and costs no further dimension. So $SO(3)$ is a three-dimensional set. Any representation using exactly three parameters is therefore dimensionally correct, but $SO(3)$ is a curved, compact set that no single three-parameter chart can cover, so every three-parameter representation must fail somewhere. Euler angles fail at gimbal lock, classical Rodrigues parameters at $180^\circ$, modified Rodrigues parameters at $360^\circ$.
:::

::: check
You are handed $\mathbf{C}_{B\leftarrow N}$ and asked for the components, in body axes, of a Sun direction known in inertial axes as $\mathbf{s}^N$. Which product do you form, and which one would a careless engineer form instead? How would you notice?
:::

::: answer
You want $\mathbf{s}^{B} = \mathbf{C}_{B\leftarrow N}\,\mathbf{s}^{N}$ — the arrow already points the right way, so no transpose. The careless version is $\mathbf{C}_{B\leftarrow N}^{\top}\mathbf{s}^{N}$, which applies the inverse rotation. Both results are unit vectors, so norms will not catch it. What catches it is a physical cross-check: compute the angle between the transformed Sun vector and a second known direction, such as the magnetic field or a star, in both frames. Angles are invariant under a correct transformation, and a transpose error leaves them invariant too when only one vector is involved — so use two vectors, transform both, and check that their mutual angle *and* their individual directions against a known geometry both agree. At zero attitude the two answers coincide, which is why this bug survives unit tests written around the identity.
:::

::: check
A propagated DCM has $\max\lvert\mathbf{C}^\top\mathbf{C}-\mathbf{I}_3\rvert = 4\times 10^{-3}$. Estimate how much a unit vector's length changes when it is transformed, and say whether re-orthonormalising will improve the attitude.
:::

::: answer
If $\mathbf{C}^\top\mathbf{C} = \mathbf{I}_3 + \mathbf{E}$ with $\lVert\mathbf{E}\rVert \approx 4\times 10^{-3}$, then for a unit vector $\lVert\mathbf{C}\mathbf{v}\rVert^2 = \mathbf{v}^\top(\mathbf{I}_3+\mathbf{E})\mathbf{v} \approx 1 + 4\times 10^{-3}$, so the length changes by about half of that, $2\times 10^{-3}$, or $0.2\%$. Re-orthonormalising removes this stretch entirely. It will not improve the attitude: the Newton update multiplies on the right by a symmetric matrix, leaving the rotation factor of the polar decomposition untouched. The attitude error is set by the integrator's truncation and can only be reduced by integrating better.
:::

::: check
Show that $SO(3)$ is closed under multiplication but that $\mathbf{C}_1\mathbf{C}_2 \neq \mathbf{C}_2\mathbf{C}_1$ in general, using a concrete pair.
:::

::: answer
Closure: $(\mathbf{C}_1\mathbf{C}_2)^\top(\mathbf{C}_1\mathbf{C}_2) = \mathbf{C}_2^\top(\mathbf{C}_1^\top\mathbf{C}_1)\mathbf{C}_2 = \mathbf{C}_2^\top\mathbf{C}_2 = \mathbf{I}_3$, and $\det(\mathbf{C}_1\mathbf{C}_2) = (+1)(+1) = +1$. For non-commutativity take $\mathbf{C}_1$ a $90^\circ$ turn taking $\hat{\mathbf{x}}\to\hat{\mathbf{y}}\to-\hat{\mathbf{x}}$ about $z$, and $\mathbf{C}_2$ a $90^\circ$ turn taking $\hat{\mathbf{y}}\to\hat{\mathbf{z}}\to-\hat{\mathbf{y}}$ about $x$. Follow $\hat{\mathbf{x}}$: under $\mathbf{C}_1$ then $\mathbf{C}_2$ it goes to $\hat{\mathbf{y}}$ then to $\hat{\mathbf{z}}$. Under $\mathbf{C}_2$ then $\mathbf{C}_1$ it stays at $\hat{\mathbf{x}}$ and then moves to $\hat{\mathbf{y}}$. The two orders send the same vector to different places, so the products differ.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| $\mathbf{C}_{A\leftarrow B}$ | DCM: $\mathbf{v}^A = \mathbf{C}_{A\leftarrow B}\mathbf{v}^B$; entries $\hat{\mathbf{a}}_i\cdot\hat{\mathbf{b}}_j$ |
| Columns and rows | Column $j$ is $\hat{\mathbf{b}}_j$ in $A$; row $i$ is $\hat{\mathbf{a}}_i$ in $B$ |
| $\mathbf{C}^\top\mathbf{C} = \mathbf{I}_3$ | Six independent constraints on nine entries |
| $\det\mathbf{C} = +1$ | Proper rotation; $-1$ means a reflection has crept in |
| $\mathbf{C}_{B\leftarrow A} = \mathbf{C}_{A\leftarrow B}^{\top}$ | Inverse is the transpose, never a linear solve |
| $\mathbf{C}_{A\leftarrow C} = \mathbf{C}_{A\leftarrow B}\mathbf{C}_{B\leftarrow C}$ | Chaining; inner labels must match |
| $SO(3)$ | Group of such matrices: closed, associative, identity $\mathbf{I}_3$, inverse $\mathbf{C}^\top$, non-commutative |
| Dimension | $9 - 6 = 3$ degrees of freedom on a compact, connected, curved set |
| $\mathbf{C}\leftarrow\mathbf{C}-\tfrac12\mathbf{C}(\mathbf{C}^\top\mathbf{C}-\mathbf{I}_3)$ | Newton re-orthonormalisation; fixes the constraint, not the attitude |
| Worked drift figure | $60{,}000$ Euler steps at $2^\circ/\mathrm{s}$: constraint error $7.34\times 10^{-3}$, attitude error $4.87\times 10^{-5}$ degrees |

Nine numbers with six constraints is safe but redundant. The next lesson spends the three degrees of freedom directly, as three successive rotations about coordinate axes, and finds out what it costs.
