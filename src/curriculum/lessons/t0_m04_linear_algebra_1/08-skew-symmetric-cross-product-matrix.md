---
id: l08-skew-symmetric-cross-product-matrix
title: Skew-symmetric matrices and the cross-product matrix
minutes: 23
covers:
  - skew-symmetric matrices and the cross-product matrix
---

A body turning at angular velocity $\boldsymbol{\omega}$ carries every point fixed to it around at velocity $\boldsymbol{\omega} \times \mathbf{r}$. A torque is $\mathbf{r} \times \mathbf{F}$. The angular momentum that fixes an orbit's plane is $\mathbf{r} \times \mathbf{v}$. Rotation, in all its forms, is expressed through the cross product, and the cross product is a linear operation on its second argument. The previous lessons have made one point repeatedly: a linear operation is a matrix. The matrix of "cross with $\mathbf{a}$" is written $[\mathbf{a}\times]$, it is skew-symmetric, and it is the object this lesson is about.

Why give a matrix to something you can already compute? Because once the cross product is a matrix, all of linear algebra applies to it. You can transpose it, find its null space, multiply it by a rotation matrix, differentiate a rotation matrix and find it sitting in the result. The equation that propagates a vehicle's attitude from its gyro measurements, $\dot{\mathbf{R}} = \mathbf{R}\,[\boldsymbol{\omega}\times]$, cannot even be written without it. The quaternion kinematics of the attitude-representations module, the matrix exponential of Linear Algebra II and the transport theorem of the rotating-frames module all begin here.

This lesson first defines the cross product properly, since the first lesson only promised it, then constructs $[\mathbf{a}\times]$ and derives its properties, then treats skew-symmetric matrices in general, and ends with the connection to rotation: small rotations are $\mathbf{I} + [\boldsymbol{\theta}\times]$, finite rotations are built from powers of $[\hat{\mathbf{k}}\times]$, and the time derivative of a rotation matrix is the rotation matrix times $[\boldsymbol{\omega}\times]$.

## The cross product

### Definition and geometry

The **cross product** of two vectors in $\mathbb{R}^3$ is a third vector, perpendicular to both, with magnitude equal to the area of the parallelogram they span:

$$
\|\mathbf{a}\times\mathbf{b}\| = \|\mathbf{a}\|\,\|\mathbf{b}\|\sin\theta ,
$$

where $\theta$ is the angle between them, and with the direction given by the **right-hand rule**: curl the fingers of your right hand from $\mathbf{a}$ toward $\mathbf{b}$ and the thumb points along $\mathbf{a}\times\mathbf{b}$. Parallel or antiparallel vectors have $\sin\theta = 0$ and a zero cross product; perpendicular ones give the full product of the lengths.

Three properties follow from the geometry and are the working rules. It is **anticommutative**, $\mathbf{a}\times\mathbf{b} = -\mathbf{b}\times\mathbf{a}$, because reversing the order reverses the curl of the fingers. Any vector crossed with itself is zero, $\mathbf{a}\times\mathbf{a} = \mathbf{0}$. And it is linear in each argument — bilinear — so it distributes over sums and pulls out scalars, which is what allows a component formula.

For the right-handed axes of a frame, the definition gives

$$
\hat{\mathbf{x}}\times\hat{\mathbf{y}} = \hat{\mathbf{z}}, \qquad \hat{\mathbf{y}}\times\hat{\mathbf{z}} = \hat{\mathbf{x}}, \qquad \hat{\mathbf{z}}\times\hat{\mathbf{x}} = \hat{\mathbf{y}},
$$

with the reversed orders giving the negatives and each axis crossed with itself giving zero. The pattern is cyclic: $x \to y \to z \to x$. This is the precise meaning of "right-handed frame" used in the previous lesson.

### The component formula

Expand $\mathbf{a} = a_1\hat{\mathbf{x}} + a_2\hat{\mathbf{y}} + a_3\hat{\mathbf{z}}$ and $\mathbf{b}$ likewise, and multiply out using bilinearity — nine terms, three of which vanish because an axis crossed with itself is zero:

$$
\mathbf{a}\times\mathbf{b} = a_1 b_2\,(\hat{\mathbf{x}}\times\hat{\mathbf{y}}) + a_1 b_3\,(\hat{\mathbf{x}}\times\hat{\mathbf{z}}) + a_2 b_1\,(\hat{\mathbf{y}}\times\hat{\mathbf{x}}) + a_2 b_3\,(\hat{\mathbf{y}}\times\hat{\mathbf{z}}) + a_3 b_1\,(\hat{\mathbf{z}}\times\hat{\mathbf{x}}) + a_3 b_2\,(\hat{\mathbf{z}}\times\hat{\mathbf{y}}) .
$$

Substituting the axis products and collecting the coefficients of $\hat{\mathbf{x}}$, $\hat{\mathbf{y}}$, $\hat{\mathbf{z}}$:

$$
\mathbf{a}\times\mathbf{b} = \begin{pmatrix} a_2 b_3 - a_3 b_2 \\ a_3 b_1 - a_1 b_3 \\ a_1 b_2 - a_2 b_1 \end{pmatrix}.
$$

Each component is a $2 \times 2$ determinant of the other two components, in cyclic order: the first component uses indices $2, 3$; the second $3, 1$; the third $1, 2$. Check the orthogonality claim directly:

$$
\mathbf{a}\cdot(\mathbf{a}\times\mathbf{b}) = a_1(a_2 b_3 - a_3 b_2) + a_2(a_3 b_1 - a_1 b_3) + a_3(a_1 b_2 - a_2 b_1) = 0 ,
$$

since every product appears once with each sign. The same holds for $\mathbf{b}$. The magnitude claim is the identity $\|\mathbf{a}\times\mathbf{b}\|^2 = \|\mathbf{a}\|^2\|\mathbf{b}\|^2 - (\mathbf{a}\cdot\mathbf{b})^2$, which is verified by expanding both sides — it is the three-dimensional version of the area calculation that opened the determinant lesson — and which, with $\mathbf{a}\cdot\mathbf{b} = \|\mathbf{a}\|\|\mathbf{b}\|\cos\theta$, gives $\|\mathbf{a}\|^2\|\mathbf{b}\|^2\sin^2\theta$.

The component formula is also the cofactor expansion of a symbolic determinant, which is the usual way to remember it:

$$
\mathbf{a}\times\mathbf{b} = \begin{vmatrix} \hat{\mathbf{x}} & \hat{\mathbf{y}} & \hat{\mathbf{z}} \\ a_1 & a_2 & a_3 \\ b_1 & b_2 & b_3 \end{vmatrix}, \qquad \mathbf{c}\cdot(\mathbf{a}\times\mathbf{b}) = \det\begin{pmatrix} c_1 & a_1 & b_1 \\ c_2 & a_2 & b_2 \\ c_3 & a_3 & b_3 \end{pmatrix}.
$$

The second expression is the **scalar triple product**, the signed volume of the box spanned by the three vectors, as promised in the determinant lesson. Because swapping two columns flips a determinant's sign, $\mathbf{c}\cdot(\mathbf{a}\times\mathbf{b}) = -\mathbf{b}\cdot(\mathbf{a}\times\mathbf{c})$, a fact used below.

::: example Angular momentum of a low-Earth orbit
Take the state vector from the first lesson, $\mathbf{r} = (-2690, 5320, 3470)^T$ km and $\mathbf{v} = (-6.8, -1.2, -3.2)^T$ km/s. The specific angular momentum is $\mathbf{h} = \mathbf{r}\times\mathbf{v}$:

$$
\mathbf{h} = \begin{pmatrix} 5320(-3.2) - 3470(-1.2) \\ 3470(-6.8) - (-2690)(-3.2) \\ (-2690)(-1.2) - 5320(-6.8) \end{pmatrix} = \begin{pmatrix} -17\,024 + 4164 \\ -23\,596 - 8608 \\ 3228 + 36\,176 \end{pmatrix} = \begin{pmatrix} -12\,860 \\ -32\,204 \\ 39\,404 \end{pmatrix}\ \mathrm{km^2/s}.
$$

Check perpendicularity: $\mathbf{h}\cdot\mathbf{r} = 34\,593\,400 - 171\,325\,280 + 136\,731\,880 = 0$. The magnitude is $\|\mathbf{h}\| = \sqrt{12\,860^2 + 32\,204^2 + 39\,404^2} = 52\,490\ \mathrm{km^2/s}$, and dividing by $\|\mathbf{r}\|\,\|\mathbf{v}\| = 6897.8 \times 7.6105 = 52\,496$ gives $\sin\theta = 0.99988$, so the angle between $\mathbf{r}$ and $\mathbf{v}$ is $89.12°$ — which is $90° - 0.878°$, the complement of the flight-path angle found in the first lesson, as it must be. The orbit plane is perpendicular to $\mathbf{h}$, and its inclination to the equator is the angle between $\mathbf{h}$ and $\hat{\mathbf{z}}$: $\cos i = 39\,404 / 52\,490 = 0.7507$, so $i = 41.3°$. The semi-latus rectum $p = h^2/\mu = 52\,490^2 / (3.986 \times 10^5) = 6912$ km will matter in the orbital mechanics modules.
:::

## The cross-product matrix

Fix $\mathbf{a}$ and look at the component formula as a function of $\mathbf{b}$. Each component of $\mathbf{a}\times\mathbf{b}$ is a linear combination of $b_1, b_2, b_3$ with coefficients drawn from $\mathbf{a}$. So $\mathbf{b} \mapsto \mathbf{a}\times\mathbf{b}$ is a linear map and has a matrix. Read the coefficients row by row — the first component is $0\cdot b_1 - a_3 b_2 + a_2 b_3$, and so on:

$$
[\mathbf{a}\times] = \begin{pmatrix} 0 & -a_3 & a_2 \\ a_3 & 0 & -a_1 \\ -a_2 & a_1 & 0 \end{pmatrix}, \qquad [\mathbf{a}\times]\,\mathbf{b} = \mathbf{a}\times\mathbf{b} .
$$

This is the **cross-product matrix** of $\mathbf{a}$. The diagonal is zero; the entry in row $i$, column $j$ is $\pm a_k$ where $k$ is the remaining index, positive when $(i, j, k)$ is a cyclic permutation of $(1, 2, 3)$ — that is, positions $(2, 1)$, $(3, 2)$ and $(1, 3)$ carry $+a_3$, $+a_1$, $+a_2$ — and negative otherwise. Other books write it $\mathbf{a}^\times$, $\hat{\mathbf{a}}$ or $\mathbf{a}^\wedge$; ORBIT writes $[\mathbf{a}\times]$ throughout.

### It is skew-symmetric

Reading the matrix, the entry at $(i, j)$ is the negative of the entry at $(j, i)$: the transpose is the negative,

$$
[\mathbf{a}\times]^T = -[\mathbf{a}\times] .
$$

A matrix with $\mathbf{S}^T = -\mathbf{S}$ is **skew-symmetric**. The reason is the anticommutativity of the cross product itself. For any $\mathbf{b}, \mathbf{c}$, the triple-product identity gives $\mathbf{c}^T[\mathbf{a}\times]\mathbf{b} = \mathbf{c}\cdot(\mathbf{a}\times\mathbf{b}) = -\mathbf{b}\cdot(\mathbf{a}\times\mathbf{c}) = -\mathbf{b}^T[\mathbf{a}\times]\mathbf{c}$, and the last expression is a scalar, equal to its own transpose $-\mathbf{c}^T[\mathbf{a}\times]^T\mathbf{b}$. Since this holds for every $\mathbf{b}$ and $\mathbf{c}$, the matrices agree: $[\mathbf{a}\times] = -[\mathbf{a}\times]^T$. Equivalently, $[\mathbf{a}\times]^T\mathbf{b} = -\mathbf{a}\times\mathbf{b} = \mathbf{b}\times\mathbf{a}$.

### It is singular, with $\mathbf{a}$ in its null space

$[\mathbf{a}\times]\,\mathbf{a} = \mathbf{a}\times\mathbf{a} = \mathbf{0}$: the vector $\mathbf{a}$ lies in the null space. A vector cannot rotate about itself — the axis of a rotation is the one direction the rotation leaves alone. The null space is exactly the line along $\mathbf{a}$ (for $\mathbf{a} \ne \mathbf{0}$), since $\mathbf{a}\times\mathbf{b} = \mathbf{0}$ requires $\sin\theta = 0$; by rank–nullity the rank is $3 - 1 = 2$, and the column space is the plane perpendicular to $\mathbf{a}$, which is where every cross product with $\mathbf{a}$ lands. Being singular, $[\mathbf{a}\times]$ has no inverse and zero determinant. The determinant vanishes for *every* $3 \times 3$ skew-symmetric matrix, not only this one: $\det\mathbf{S} = \det\mathbf{S}^T = \det(-\mathbf{S}) = (-1)^3\det\mathbf{S}$, so $\det\mathbf{S} = -\det\mathbf{S} = 0$.

### It is linear in $\mathbf{a}$

Each entry of $[\mathbf{a}\times]$ is a component of $\mathbf{a}$ or its negative, so $[(\alpha\mathbf{a} + \beta\mathbf{b})\times] = \alpha[\mathbf{a}\times] + \beta[\mathbf{b}\times]$. A $3 \times 3$ skew-symmetric matrix has zero diagonal and its three entries below the diagonal determine the three above, so it has exactly three free parameters — and the map $\mathbf{a} \mapsto [\mathbf{a}\times]$ is a one-to-one correspondence between vectors in $\mathbb{R}^3$ and $3 \times 3$ skew-symmetric matrices. Every such matrix is the cross-product matrix of some vector, which is why "skew-symmetric matrix" and "angular velocity" are interchangeable in three dimensions. This special coincidence — three components, three independent entries — does not hold in any other dimension.

::: key The cross-product matrix
$[\mathbf{a}\times] = \begin{pmatrix} 0 & -a_3 & a_2 \\ a_3 & 0 & -a_1 \\ -a_2 & a_1 & 0 \end{pmatrix}$, so that $[\mathbf{a}\times]\mathbf{b} = \mathbf{a}\times\mathbf{b}$. It is skew-symmetric, $[\mathbf{a}\times]^T = -[\mathbf{a}\times]$, because $\mathbf{a}\times\mathbf{b} = -\mathbf{b}\times\mathbf{a}$. It is singular: $[\mathbf{a}\times]\mathbf{a} = \mathbf{0}$, rank 2, no inverse.
:::

::: example Velocity of a point on a rotating body
A gyro reports the body rate $\boldsymbol{\omega} = (0.01, -0.02, 0.05)^T$ rad/s in body axes. A star tracker is mounted at $\mathbf{r}_p = (1.2, 0.3, -0.4)^T$ m from the centre of mass. Its velocity relative to the centre of mass is $\boldsymbol{\omega}\times\mathbf{r}_p = [\boldsymbol{\omega}\times]\,\mathbf{r}_p$:

$$
[\boldsymbol{\omega}\times] = \begin{pmatrix} 0 & -0.05 & -0.02 \\ 0.05 & 0 & -0.01 \\ 0.02 & 0.01 & 0 \end{pmatrix}, \qquad
[\boldsymbol{\omega}\times]\begin{pmatrix} 1.2 \\ 0.3 \\ -0.4 \end{pmatrix} = \begin{pmatrix} -0.015 + 0.008 \\ 0.060 + 0.004 \\ 0.024 + 0.003 \end{pmatrix} = \begin{pmatrix} -0.007 \\ 0.064 \\ 0.027 \end{pmatrix}\ \mathrm{m/s}.
$$

Check with the component formula: the first component is $\omega_2 r_3 - \omega_3 r_2 = (-0.02)(-0.4) - (0.05)(0.3) = 0.008 - 0.015 = -0.007$. Check the null space: $[\boldsymbol{\omega}\times]\boldsymbol{\omega}$ has first component $-0.05(-0.02) - 0.02(0.05) = 0.001 - 0.001 = 0$, and the others vanish likewise. The velocity is perpendicular to both $\boldsymbol{\omega}$ and $\mathbf{r}_p$: $\mathbf{v}\cdot\mathbf{r}_p = -0.0084 + 0.0192 - 0.0108 = 0$. At $70$ mm/s, this is the velocity the tracker's image processing must compensate for, and it is the term $\boldsymbol{\omega}\times\mathbf{r}$ that the transport theorem adds to every derivative taken in a rotating frame.
:::

## Skew-symmetric matrices in general

A skew-symmetric matrix $\mathbf{S}$, of any size, has a property that makes it the natural generator of rotations: it never changes the length of anything it acts on, to first order. For any $\mathbf{x}$, the scalar $\mathbf{x}^T\mathbf{S}\mathbf{x}$ equals its own transpose $\mathbf{x}^T\mathbf{S}^T\mathbf{x} = -\mathbf{x}^T\mathbf{S}\mathbf{x}$, so

$$
\mathbf{x}^T\mathbf{S}\mathbf{x} = 0 \quad \text{for every } \mathbf{x}.
$$

The output $\mathbf{S}\mathbf{x}$ is always perpendicular to the input — for $[\mathbf{a}\times]$ this is $\mathbf{x}\cdot(\mathbf{a}\times\mathbf{x}) = 0$. Consequently, if a vector evolves by $\dot{\mathbf{y}} = \mathbf{S}\mathbf{y}$, its length is constant: $\tfrac{d}{dt}\|\mathbf{y}\|^2 = 2\,\mathbf{y}^T\dot{\mathbf{y}} = 2\,\mathbf{y}^T\mathbf{S}\mathbf{y} = 0$. Motion generated by a skew-symmetric matrix is pure rotation. This is the abstract reason the attitude kinematics below preserve orthogonality exactly.

### Products of cross-product matrices

Two identities about products carry most of attitude dynamics. Both rest on the **vector triple product**,

$$
\mathbf{a}\times(\mathbf{b}\times\mathbf{c}) = \mathbf{b}\,(\mathbf{a}\cdot\mathbf{c}) - \mathbf{c}\,(\mathbf{a}\cdot\mathbf{b}) .
$$

To verify it, compute the first component of the left side with the component formula applied twice: $a_2(\mathbf{b}\times\mathbf{c})_3 - a_3(\mathbf{b}\times\mathbf{c})_2 = a_2(b_1 c_2 - b_2 c_1) - a_3(b_3 c_1 - b_1 c_3) = b_1(a_2 c_2 + a_3 c_3) - c_1(a_2 b_2 + a_3 b_3)$. Add and subtract $a_1 b_1 c_1$ to complete the dot products: $b_1(\mathbf{a}\cdot\mathbf{c}) - c_1(\mathbf{a}\cdot\mathbf{b})$, which is the first component of the right side. The other two components follow by cycling the indices.

Now write the left side as $[\mathbf{a}\times][\mathbf{b}\times]\mathbf{c}$ and the right side as $(\mathbf{b}\mathbf{a}^T - (\mathbf{a}\cdot\mathbf{b})\mathbf{I})\,\mathbf{c}$, using the outer product $\mathbf{b}\mathbf{a}^T\mathbf{c} = \mathbf{b}(\mathbf{a}^T\mathbf{c})$. Since they agree for every $\mathbf{c}$,

$$
[\mathbf{a}\times][\mathbf{b}\times] = \mathbf{b}\,\mathbf{a}^T - (\mathbf{a}\cdot\mathbf{b})\,\mathbf{I} .
$$

**First identity: the square.** With $\mathbf{b} = \mathbf{a}$,

$$
[\mathbf{a}\times]^2 = \mathbf{a}\mathbf{a}^T - \|\mathbf{a}\|^2\,\mathbf{I}, \qquad [\mathbf{a}\times]^3 = -\|\mathbf{a}\|^2\,[\mathbf{a}\times] ,
$$

the second following from the first because $[\mathbf{a}\times]\mathbf{a}\mathbf{a}^T = (\mathbf{a}\times\mathbf{a})\mathbf{a}^T = \mathbf{0}$. Every higher power of $[\mathbf{a}\times]$ is a multiple of $[\mathbf{a}\times]$ or $[\mathbf{a}\times]^2$, which is what makes the rotation formula below possible. For a unit vector $\hat{\mathbf{k}}$, $[\hat{\mathbf{k}}\times]^2 = \hat{\mathbf{k}}\hat{\mathbf{k}}^T - \mathbf{I}$, which is minus the projection onto the plane perpendicular to $\hat{\mathbf{k}}$.

**Second identity: the commutator.** Subtract the product in the other order. The $(\mathbf{a}\cdot\mathbf{b})\mathbf{I}$ terms cancel, leaving

$$
[\mathbf{a}\times][\mathbf{b}\times] - [\mathbf{b}\times][\mathbf{a}\times] = \mathbf{b}\mathbf{a}^T - \mathbf{a}\mathbf{b}^T .
$$

Apply the right side to any $\mathbf{c}$: $\mathbf{b}(\mathbf{a}\cdot\mathbf{c}) - \mathbf{a}(\mathbf{b}\cdot\mathbf{c})$. By the vector triple product with the roles rearranged, $(\mathbf{a}\times\mathbf{b})\times\mathbf{c} = -\mathbf{c}\times(\mathbf{a}\times\mathbf{b}) = -\mathbf{a}(\mathbf{c}\cdot\mathbf{b}) + \mathbf{b}(\mathbf{c}\cdot\mathbf{a})$, the same thing. Therefore

$$
[\mathbf{a}\times][\mathbf{b}\times] - [\mathbf{b}\times][\mathbf{a}\times] = [(\mathbf{a}\times\mathbf{b})\times] .
$$

The commutator of two cross-product matrices is the cross-product matrix of the cross product. This is the **Lie bracket** of $\mathfrak{so}(3)$, the algebra of skew-symmetric matrices, and it says that the cross product on vectors and the commutator on matrices are the same operation seen through the correspondence $\mathbf{a} \leftrightarrow [\mathbf{a}\times]$. Numerically, for $\mathbf{a} = (1, -2, 0.5)^T$ and $\mathbf{b} = (0.3, 2, 1)^T$, $\mathbf{a}\times\mathbf{b} = (-3, -0.85, 2.6)^T$, and multiplying out the two matrix products gives a commutator whose $(2, 1)$ entry is $2.6$ and $(1, 3)$ entry is $-0.85$, exactly the layout of $[(\mathbf{a}\times\mathbf{b})\times]$. This is the identity the module's cross-product-matrix exercise asks you to verify at random.

### How a rotation acts on a cross-product matrix

A proper rotation preserves lengths, angles and handedness, so it carries the parallelogram spanned by $\mathbf{a}$ and $\mathbf{b}$ to a congruent parallelogram with the same orientation. The cross product of the rotated vectors is therefore the rotated cross product:

$$
\mathbf{R}(\mathbf{a}\times\mathbf{b}) = (\mathbf{R}\mathbf{a})\times(\mathbf{R}\mathbf{b}) \qquad (\mathbf{R} \in SO(3)).
$$

A reflection, with $\det = -1$, would flip the sign; this is where the determinant test of the previous lesson earns its place. Now for any $\mathbf{c}$, $\mathbf{R}[\mathbf{a}\times]\mathbf{R}^T\mathbf{c} = \mathbf{R}(\mathbf{a}\times\mathbf{R}^T\mathbf{c}) = (\mathbf{R}\mathbf{a})\times(\mathbf{R}\mathbf{R}^T\mathbf{c}) = (\mathbf{R}\mathbf{a})\times\mathbf{c}$, so

$$
\mathbf{R}\,[\mathbf{a}\times]\,\mathbf{R}^T = [(\mathbf{R}\mathbf{a})\times] .
$$

In frame language: if $\boldsymbol{\omega}^B$ is an angular velocity resolved in body axes, then $[\boldsymbol{\omega}^I\times] = \mathbf{R}_I^B\,[\boldsymbol{\omega}^B\times]\,(\mathbf{R}_I^B)^T$ is the same angular velocity's matrix resolved in inertial axes. Changing the frame of a skew-symmetric matrix is the similarity transformation of the previous lesson, and it commutes with the bracket operation.

## Connection to rotation

### Small rotations

Rotate a vector $\mathbf{v}$ through a small angle $\delta\theta$ about a unit axis $\hat{\mathbf{k}}$. The tip of $\mathbf{v}$ moves along a circle of radius $\|\mathbf{v}\|\sin\varphi$, where $\varphi$ is the angle between $\hat{\mathbf{k}}$ and $\mathbf{v}$, through an arc of length $\delta\theta\,\|\mathbf{v}\|\sin\varphi$, in the direction perpendicular to both $\hat{\mathbf{k}}$ and $\mathbf{v}$ — the direction of $\hat{\mathbf{k}}\times\mathbf{v}$, whose length is $\|\mathbf{v}\|\sin\varphi$. So to first order in $\delta\theta$,

$$
\mathbf{v}' \approx \mathbf{v} + \delta\theta\,\hat{\mathbf{k}}\times\mathbf{v} = \big(\mathbf{I} + [\boldsymbol{\delta\theta}\times]\big)\,\mathbf{v}, \qquad \boldsymbol{\delta\theta} = \delta\theta\,\hat{\mathbf{k}} .
$$

The vector $\boldsymbol{\delta\theta}$ — axis times angle — is the **rotation vector**, and a small rotation is the identity plus its cross-product matrix. This is the form every attitude error takes in a Kalman filter: the true attitude is the estimated attitude times $\mathbf{I} + [\boldsymbol{\delta\theta}\times]$, and the three components of $\boldsymbol{\delta\theta}$ are the three attitude-error states. The approximation is not exactly a rotation. The columns of $\mathbf{I} + [\boldsymbol{\delta\theta}\times]$ have squared length $1 + \delta\theta_j^2$-type terms, its determinant is $1 + \|\boldsymbol{\delta\theta}\|^2$, and $(\mathbf{I} + \mathbf{S})^T(\mathbf{I} + \mathbf{S}) = \mathbf{I} - \mathbf{S}^2$ misses the identity by second-order terms. Small-angle rotation matrices must be re-orthonormalised or replaced by the exact formula before they are chained many times.

::: example A small rotation, approximate and exact
Take $\boldsymbol{\delta\theta} = (0.001, 0.002, -0.001)^T$ rad, a rotation of $\|\boldsymbol{\delta\theta}\| = 2.449 \times 10^{-3}$ rad $= 0.140°$. The first-order matrix is

$$
\mathbf{I} + [\boldsymbol{\delta\theta}\times] = \begin{pmatrix} 1 & 0.001 & 0.002 \\ -0.001 & 1 & -0.001 \\ -0.002 & 0.001 & 1 \end{pmatrix}.
$$

The exact rotation from the formula in the next section differs from it by at most $2.5 \times 10^{-6}$ in any entry — the size of $\|\boldsymbol{\delta\theta}\|^2/2 = 3.0 \times 10^{-6}$, as a second-order error should be. The approximate matrix fails the orthogonality audit at the same level: $(\mathbf{I} + \mathbf{S})^T(\mathbf{I} + \mathbf{S}) - \mathbf{I} = -\mathbf{S}^2$ has entries up to $5 \times 10^{-6}$, and its determinant is $1 + \|\boldsymbol{\delta\theta}\|^2 = 1.000006$. Used once, harmless; applied at $100\ \mathrm{Hz}$ for an hour without correction, the accumulated $3.6 \times 10^5$ steps would leave a matrix that is visibly no longer a rotation.
:::

### Finite rotations: the Rodrigues formula

For a finite angle $\theta$ about a unit axis $\hat{\mathbf{k}}$, decompose $\mathbf{v}$ into the part along the axis, $\mathbf{v}_\parallel = \hat{\mathbf{k}}(\hat{\mathbf{k}}\cdot\mathbf{v})$, and the part perpendicular to it, $\mathbf{v}_\perp = \mathbf{v} - \mathbf{v}_\parallel$. The axial part is unchanged by the rotation. The perpendicular part turns through $\theta$ in the plane perpendicular to $\hat{\mathbf{k}}$, and in that plane the vector $\hat{\mathbf{k}}\times\mathbf{v}_\perp = \hat{\mathbf{k}}\times\mathbf{v}$ is $\mathbf{v}_\perp$ turned through $90°$ with the same length, so the plane rotation of the second lesson gives $\mathbf{v}_\perp\cos\theta + (\hat{\mathbf{k}}\times\mathbf{v})\sin\theta$. Adding the parts,

$$
\mathbf{v}' = \mathbf{v}\cos\theta + (\hat{\mathbf{k}}\times\mathbf{v})\sin\theta + \hat{\mathbf{k}}(\hat{\mathbf{k}}\cdot\mathbf{v})(1 - \cos\theta) .
$$

Write each term as a matrix acting on $\mathbf{v}$, using $\hat{\mathbf{k}}\hat{\mathbf{k}}^T = \mathbf{I} + [\hat{\mathbf{k}}\times]^2$ from the square identity:

$$
\mathbf{R}(\hat{\mathbf{k}}, \theta) = \mathbf{I} + \sin\theta\,[\hat{\mathbf{k}}\times] + (1 - \cos\theta)\,[\hat{\mathbf{k}}\times]^2 .
$$

This is the **Rodrigues rotation formula**. It is built entirely from the identity and powers of one skew-symmetric matrix, and it is exactly orthogonal with determinant $+1$ for every $\theta$. For $\hat{\mathbf{k}} = \hat{\mathbf{z}}$ and $\theta = 30°$: $[\hat{\mathbf{z}}\times]$ has $-1$ at $(1, 2)$ and $+1$ at $(2, 1)$, $[\hat{\mathbf{z}}\times]^2 = \operatorname{diag}(-1, -1, 0)$, and the formula gives $\begin{pmatrix} 1 - 0.1340 & -0.5 & 0 \\ 0.5 & 1 - 0.1340 & 0 \\ 0 & 0 & 1 \end{pmatrix} = \mathbf{R}_3(30°)$, since $1 - \cos 30° = 0.1340$ and $1 - 0.1340 = 0.8660 = \cos 30°$. For small $\theta$, $\sin\theta \approx \theta$ and $1 - \cos\theta \approx \theta^2/2$, recovering $\mathbf{I} + [\boldsymbol{\theta}\times]$ plus the second-order correction. Linear Algebra II shows the same formula is the matrix exponential $e^{\theta[\hat{\mathbf{k}}\times]}$, summed using $[\hat{\mathbf{k}}\times]^3 = -[\hat{\mathbf{k}}\times]$.

### Attitude kinematics

Let the body frame $B$ rotate relative to the inertial frame $I$ with angular velocity $\boldsymbol{\omega}$. Each body axis $\hat{\mathbf{b}}_j$ is a vector fixed in the body, so its tip moves at $\boldsymbol{\omega}\times\hat{\mathbf{b}}_j$ — the small-rotation result, per unit time. Resolved in inertial axes, the columns of $\mathbf{R}_I^B$ are exactly the $\hat{\mathbf{b}}_j^{\,I}$ (previous lesson), so column by column

$$
\frac{d}{dt}\hat{\mathbf{b}}_j^{\,I} = \boldsymbol{\omega}^I\times\hat{\mathbf{b}}_j^{\,I} = [\boldsymbol{\omega}^I\times]\,\hat{\mathbf{b}}_j^{\,I} \quad\Longrightarrow\quad \dot{\mathbf{R}}_I^B = [\boldsymbol{\omega}^I\times]\,\mathbf{R}_I^B .
$$

A gyro triad, however, measures $\boldsymbol{\omega}$ in body axes. Substitute $[\boldsymbol{\omega}^I\times] = \mathbf{R}_I^B[\boldsymbol{\omega}^B\times](\mathbf{R}_I^B)^T$ from the similarity rule and use $(\mathbf{R}_I^B)^T\mathbf{R}_I^B = \mathbf{I}$:

$$
\dot{\mathbf{R}}_I^B = \mathbf{R}_I^B\,[\boldsymbol{\omega}^B\times] .
$$

This is the **attitude kinematics equation**: the rate of change of the body-to-inertial rotation matrix is the matrix itself times the cross-product matrix of the body-referenced angular velocity, on the right. Integrate it with gyro data and you propagate attitude. The skew matrix goes on the right with body-axis rates and on the left with inertial-axis rates, and mixing the two is a frame bug of exactly the kind the previous lesson warned about.

The equation preserves orthogonality exactly. Writing $\mathbf{R} = \mathbf{R}_I^B$ and $\mathbf{W} = [\boldsymbol{\omega}^B\times]$,

$$
\frac{d}{dt}\big(\mathbf{R}^T\mathbf{R}\big) = \dot{\mathbf{R}}^T\mathbf{R} + \mathbf{R}^T\dot{\mathbf{R}} = \mathbf{W}^T\mathbf{R}^T\mathbf{R} + \mathbf{R}^T\mathbf{R}\,\mathbf{W} = -\mathbf{W} + \mathbf{W} = \mathbf{0}
$$

whenever $\mathbf{R}^T\mathbf{R} = \mathbf{I}$, using $\mathbf{W}^T = -\mathbf{W}$. A rotation stays a rotation under the exact flow; it is only the numerical integrator that lets it drift, which is why flight software re-orthonormalises, or integrates with the Rodrigues formula over each step, or — in the attitude-representations module — switches to quaternions, which carry four numbers and one constraint instead of nine numbers and six.

::: example One integration step from gyro data
A body spins about its 3-axis at $\boldsymbol{\omega}^B = (0, 0, 0.3)^T$ rad/s, and the current attitude is $\mathbf{R}_I^B = \mathbf{I}$. The simplest integrator, Euler's method with $\Delta t = 0.1$ s, gives

$$
\mathbf{R}(t + \Delta t) \approx \mathbf{R}(t)\big(\mathbf{I} + \Delta t\,[\boldsymbol{\omega}^B\times]\big) = \begin{pmatrix} 1 & -0.03 & 0 \\ 0.03 & 1 & 0 \\ 0 & 0 & 1 \end{pmatrix}.
$$

The exact answer is a rotation of $0.3 \times 0.1 = 0.03$ rad about the 3-axis, $\mathbf{R}_3(0.03)$, whose diagonal entries are $\cos 0.03 = 0.99955$. The Euler step has the off-diagonal terms right and the diagonal wrong by $4.5 \times 10^{-4}$; its first column has length $\sqrt{1 + 0.03^2} = 1.00045$. After ten steps the columns would be about $0.45\%$ too long and the vehicle's estimated attitude would be growing in size rather than turning. Replacing $\mathbf{I} + \Delta t[\boldsymbol{\omega}\times]$ by the Rodrigues matrix $\mathbf{R}(\hat{\boldsymbol{\omega}}, \|\boldsymbol{\omega}\|\Delta t)$ makes every step an exact rotation, and for a constant rate over the step it is the exact solution.
:::

::: key Skew-symmetric matrices and rotation
$\mathbf{x}^T\mathbf{S}\mathbf{x} = 0$ for skew-symmetric $\mathbf{S}$, so $\dot{\mathbf{y}} = \mathbf{S}\mathbf{y}$ preserves length. A small rotation is $\mathbf{I} + [\boldsymbol{\delta\theta}\times]$; a finite one is $\mathbf{I} + \sin\theta[\hat{\mathbf{k}}\times] + (1 - \cos\theta)[\hat{\mathbf{k}}\times]^2$. Attitude kinematics: $\dot{\mathbf{R}}_I^B = \mathbf{R}_I^B[\boldsymbol{\omega}^B\times]$ with the rate in body axes. Also $[\mathbf{a}\times][\mathbf{b}\times] - [\mathbf{b}\times][\mathbf{a}\times] = [(\mathbf{a}\times\mathbf{b})\times]$ and $\mathbf{R}[\mathbf{a}\times]\mathbf{R}^T = [(\mathbf{R}\mathbf{a})\times]$.
:::

::: warning Which side the skew matrix goes on
$\dot{\mathbf{R}}_I^B = \mathbf{R}_I^B[\boldsymbol{\omega}^B\times]$ with body-axis rates; $\dot{\mathbf{R}}_I^B = [\boldsymbol{\omega}^I\times]\mathbf{R}_I^B$ with inertial-axis rates. The two matrices $[\boldsymbol{\omega}^B\times]$ and $[\boldsymbol{\omega}^I\times]$ are different, related by the similarity $\mathbf{R}[\mathbf{a}\times]\mathbf{R}^T = [(\mathbf{R}\mathbf{a})\times]$. Gyros give body rates. Put the matrix on the right.
:::

::: warning The layout of $[\mathbf{a}\times]$
Row 1 is $(0, -a_3, a_2)$. The most common error is a sign flip that produces $[\mathbf{a}\times]^T = -[\mathbf{a}\times]$ instead — which then computes $\mathbf{b}\times\mathbf{a}$ and reverses every angular velocity. Test any implementation against `np.cross` on a random pair before trusting it, and test `skew(a) @ a == 0` as well.
:::

```python
import numpy as np

def skew(v):
    return np.array([[0.0, -v[2], v[1]],
                     [v[2], 0.0, -v[0]],
                     [-v[1], v[0], 0.0]])

w = np.array([0.01, -0.02, 0.05])
r = np.array([1.2, 0.3, -0.4])
print(skew(w) @ r, np.cross(w, r))        # [-0.007  0.064  0.027] twice
print(np.allclose(skew(w).T, -skew(w)))   # True
print(skew(w) @ w)                        # [0. 0. 0.]
```

## Check yourself

::: check
Compute $\mathbf{a}\times\mathbf{b}$ for $\mathbf{a} = (2, 0, -1)^T$ and $\mathbf{b} = (1, 3, 0)^T$, then write $[\mathbf{a}\times]$ and confirm that $[\mathbf{a}\times]\mathbf{b}$ agrees.
:::

::: answer
Components: $a_2 b_3 - a_3 b_2 = 0 - (-1)(3) = 3$; $a_3 b_1 - a_1 b_3 = (-1)(1) - 0 = -1$; $a_1 b_2 - a_2 b_1 = 6 - 0 = 6$. So $\mathbf{a}\times\mathbf{b} = (3, -1, 6)^T$. The matrix is $[\mathbf{a}\times] = \begin{pmatrix} 0 & 1 & 0 \\ -1 & 0 & -2 \\ 0 & 2 & 0 \end{pmatrix}$, and $[\mathbf{a}\times]\mathbf{b} = (3,\ -1 - 0,\ 6)^T = (3, -1, 6)^T$. Check perpendicularity: $(3, -1, 6)\cdot(2, 0, -1) = 6 - 6 = 0$.
:::

::: check
Why does $[\mathbf{a}\times]$ have no inverse, and what does that say physically about recovering $\mathbf{b}$ from $\mathbf{a}\times\mathbf{b}$?
:::

::: answer
$[\mathbf{a}\times]\mathbf{a} = \mathbf{0}$ with $\mathbf{a} \ne \mathbf{0}$, so the null space is nontrivial, the rank is 2 and the determinant is zero — as it is for every odd-dimensional skew-symmetric matrix. Physically, $\mathbf{a}\times\mathbf{b}$ depends only on the part of $\mathbf{b}$ perpendicular to $\mathbf{a}$; any component of $\mathbf{b}$ along $\mathbf{a}$ is lost, so $\mathbf{b}$ cannot be recovered from the product. Knowing the velocity $\boldsymbol{\omega}\times\mathbf{r}$ of one point tells you nothing about how far along the spin axis that point sits.
:::

::: check
Show from $[\mathbf{a}\times]^2 = \mathbf{a}\mathbf{a}^T - \|\mathbf{a}\|^2\mathbf{I}$ that the trace of $[\mathbf{a}\times]^2$ is $-2\|\mathbf{a}\|^2$, and use it to recover $\|\boldsymbol{\omega}\|$ from the matrix $[\boldsymbol{\omega}\times]$ in the worked example.
:::

::: answer
The trace (sum of diagonal entries) of $\mathbf{a}\mathbf{a}^T$ is $\sum_i a_i^2 = \|\mathbf{a}\|^2$, and the trace of $\|\mathbf{a}\|^2\mathbf{I}$ is $3\|\mathbf{a}\|^2$, so $\operatorname{tr}([\mathbf{a}\times]^2) = \|\mathbf{a}\|^2 - 3\|\mathbf{a}\|^2 = -2\|\mathbf{a}\|^2$. For the example, the diagonal of $[\boldsymbol{\omega}\times]^2$ is $(-0.0029, -0.0026, -0.0005)$, summing to $-0.0060$, so $\|\boldsymbol{\omega}\|^2 = 0.0030$ and $\|\boldsymbol{\omega}\| = 0.0548$ rad/s. Directly, $\sqrt{0.01^2 + 0.02^2 + 0.05^2} = \sqrt{0.0030} = 0.0548$ rad/s.
:::

::: check
A filter holds an attitude estimate $\hat{\mathbf{R}}_I^B$ and estimates a small error rotation vector $\boldsymbol{\delta\theta} = (0, 0, 0.002)^T$ rad. Write the corrected matrix to first order, and state its determinant to first and second order.
:::

::: answer
The correction is $\mathbf{R}_I^B \approx \hat{\mathbf{R}}_I^B(\mathbf{I} + [\boldsymbol{\delta\theta}\times])$ with $[\boldsymbol{\delta\theta}\times] = \begin{pmatrix} 0 & -0.002 & 0 \\ 0.002 & 0 & 0 \\ 0 & 0 & 0 \end{pmatrix}$, a small yaw of the body frame. To first order the determinant is $1$ (the trace of a skew-symmetric matrix is zero); to second order it is $1 + \|\boldsymbol{\delta\theta}\|^2 = 1.000004$, which is why the corrected matrix should be re-orthonormalised or built with the Rodrigues formula before the next propagation.
:::

::: check
Starting from $\dot{\mathbf{R}}_I^B = \mathbf{R}_I^B[\boldsymbol{\omega}^B\times]$, write the kinematics of the inverse matrix $\mathbf{R}_B^I = (\mathbf{R}_I^B)^T$.
:::

::: answer
Transpose the equation: $\dot{\mathbf{R}}_B^I = (\mathbf{R}_I^B[\boldsymbol{\omega}^B\times])^T = [\boldsymbol{\omega}^B\times]^T(\mathbf{R}_I^B)^T = -[\boldsymbol{\omega}^B\times]\,\mathbf{R}_B^I$, using the transpose-of-a-product rule and skew-symmetry. The body-from-inertial matrix obeys $\dot{\mathbf{R}}_B^I = -[\boldsymbol{\omega}^B\times]\mathbf{R}_B^I$, with the skew matrix on the left and a minus sign — the form many attitude texts quote, since they propagate the inertial-to-body matrix. Both forms are the same physics; the frame labels decide which one you are looking at.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\mathbf{a}\times\mathbf{b} = (a_2 b_3 - a_3 b_2,\ a_3 b_1 - a_1 b_3,\ a_1 b_2 - a_2 b_1)^T$ | Cross product; perpendicular to both, magnitude $\lVert\mathbf{a}\rVert\lVert\mathbf{b}\rVert\sin\theta$, right-hand rule |
| $\mathbf{a}\times\mathbf{b} = -\mathbf{b}\times\mathbf{a}$, $\mathbf{a}\times\mathbf{a} = \mathbf{0}$ | Antisymmetry |
| $\mathbf{c}\cdot(\mathbf{a}\times\mathbf{b}) = \det[\mathbf{c}\ \mathbf{a}\ \mathbf{b}]$ | Scalar triple product: signed volume |
| $\mathbf{a}\times(\mathbf{b}\times\mathbf{c}) = \mathbf{b}(\mathbf{a}\cdot\mathbf{c}) - \mathbf{c}(\mathbf{a}\cdot\mathbf{b})$ | Vector triple product |
| $[\mathbf{a}\times] = \begin{pmatrix} 0 & -a_3 & a_2 \\ a_3 & 0 & -a_1 \\ -a_2 & a_1 & 0 \end{pmatrix}$ | Cross-product matrix, $[\mathbf{a}\times]\mathbf{b} = \mathbf{a}\times\mathbf{b}$ |
| $[\mathbf{a}\times]^T = -[\mathbf{a}\times]$ | Skew-symmetric; $[\mathbf{a}\times]\mathbf{a} = \mathbf{0}$, rank 2, singular |
| $\mathbf{x}^T\mathbf{S}\mathbf{x} = 0$ | Skew-symmetric matrices generate length-preserving motion |
| $[\mathbf{a}\times]^2 = \mathbf{a}\mathbf{a}^T - \lVert\mathbf{a}\rVert^2\mathbf{I}$ | Square identity; $[\mathbf{a}\times]^3 = -\lVert\mathbf{a}\rVert^2[\mathbf{a}\times]$ |
| $[\mathbf{a}\times][\mathbf{b}\times] - [\mathbf{b}\times][\mathbf{a}\times] = [(\mathbf{a}\times\mathbf{b})\times]$ | The $\mathfrak{so}(3)$ Lie bracket |
| $\mathbf{R}[\mathbf{a}\times]\mathbf{R}^T = [(\mathbf{R}\mathbf{a})\times]$ | Changing the frame of a skew matrix |
| $\mathbf{R} \approx \mathbf{I} + [\boldsymbol{\delta\theta}\times]$ | Small rotation; attitude-error parametrisation |
| $\mathbf{R} = \mathbf{I} + \sin\theta[\hat{\mathbf{k}}\times] + (1 - \cos\theta)[\hat{\mathbf{k}}\times]^2$ | Rodrigues formula: exact rotation by $\theta$ about $\hat{\mathbf{k}}$ |
| $\dot{\mathbf{R}}_I^B = \mathbf{R}_I^B[\boldsymbol{\omega}^B\times]$ | Attitude kinematics, body-axis rates on the right |

This closes Linear Algebra I. Linear Algebra II picks up the two threads left hanging: the matrix exponential, which turns $\dot{\mathbf{R}} = \mathbf{R}[\boldsymbol{\omega}\times]$ into the Rodrigues formula and $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}$ into a state-transition matrix, and the singular value decomposition, which makes rank, null space and condition number computable for the matrices a real filter produces.
