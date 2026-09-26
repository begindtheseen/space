---
id: l08-skew-symmetric-cross-product-matrix
title: Skew-symmetric matrices and the cross-product matrix
minutes: 25
covers:
  - skew-symmetric matrices and the cross-product matrix
---

Stand at the edge of a spinning merry-go-round and you are carried around fast. Stand near the middle and you barely move. Your velocity depends on the spin and on where you stand, and it always points sideways — across the line from the center to you. The operation that turns "spin" and "where" into that sideways velocity is the **cross product**: a point fixed to a body turning at angular velocity $\boldsymbol{\omega}$ ("omega") moves at $\boldsymbol{\omega} \times \mathbf{r}$.

The same operation is everywhere in rotation. A torque — the twist a wrench puts on a bolt — is $\mathbf{r} \times \mathbf{F}$. The angular momentum that fixes the plane of an orbit is $\mathbf{r} \times \mathbf{v}$. And for a fixed first vector, the cross product is linear in the second one. The earlier lessons made one point again and again: a linear operation is a matrix. The matrix of "cross with $\mathbf{a}$" is written $[\mathbf{a}\times]$. It is **skew-symmetric**, and it is what this lesson is about.

Why turn something you can already compute into a matrix? Because then all of linear algebra applies to it. You can transpose it, find its null space, multiply it by a rotation matrix — and find it sitting inside the rate of change of a rotation matrix. The equation that updates a vehicle's attitude from its gyro readings, $\dot{\mathbf{R}} = \mathbf{R}\,[\boldsymbol{\omega}\times]$, cannot even be written without it.

The plan: first define the cross product properly, since Lesson 1 only promised it. Then build $[\mathbf{a}\times]$ and its properties. Then look at skew-symmetric matrices in general. And finish with rotation itself: small turns, finite turns, and the rate of change of a rotation matrix.

## The cross product

### Definition and geometry

Picture two arrows $\mathbf{a}$ and $\mathbf{b}$ drawn from the same point. They span a parallelogram, like a tilted tile. The **cross product** $\mathbf{a}\times\mathbf{b}$ (read "a cross b") is a third arrow that sticks straight out of that tile. It is perpendicular to both $\mathbf{a}$ and $\mathbf{b}$, and its length is the tile's area:

$$
\|\mathbf{a}\times\mathbf{b}\| = \|\mathbf{a}\|\,\|\mathbf{b}\|\sin\theta ,
$$

where $\theta$ is the angle between the two arrows. Which of the two perpendicular directions? The **[[right-hand rule|cross-right-hand]]**: curl the fingers of your right hand from $\mathbf{a}$ toward $\mathbf{b}$, and your thumb points along $\mathbf{a}\times\mathbf{b}$. Parallel or opposite arrows have $\sin\theta = 0$ and a zero cross product. Perpendicular ones give the full product of the lengths.

Three working rules come straight from the picture:

- It is **[[anticommutative|anti-word]]**: $\mathbf{a}\times\mathbf{b} = -\mathbf{b}\times\mathbf{a}$. Swapping the order reverses the curl of your fingers, so your thumb flips.
- Any vector crossed with itself is zero, $\mathbf{a}\times\mathbf{a} = \mathbf{0}$. A flat tile has no area.
- It is linear in each argument — **bilinear**. It spreads over sums and lets numbers pull out, which is what makes a component formula possible.

For the right-handed axes of a frame, the definition gives

$$
\hat{\mathbf{x}}\times\hat{\mathbf{y}} = \hat{\mathbf{z}}, \qquad \hat{\mathbf{y}}\times\hat{\mathbf{z}} = \hat{\mathbf{x}}, \qquad \hat{\mathbf{z}}\times\hat{\mathbf{x}} = \hat{\mathbf{y}},
$$

with the reversed orders giving the negatives, and each axis crossed with itself giving zero. The pattern is a circle: $x \to y \to z \to x$. This is the exact meaning of "right-handed frame" used in Lesson 7.

### The component formula

Write $\mathbf{a} = a_1\hat{\mathbf{x}} + a_2\hat{\mathbf{y}} + a_3\hat{\mathbf{z}}$ and $\mathbf{b}$ the same way, and multiply out using bilinearity. That makes nine terms. The three with an axis crossed with itself vanish, leaving six:

$$
\mathbf{a}\times\mathbf{b} = a_1 b_2\,(\hat{\mathbf{x}}\times\hat{\mathbf{y}}) + a_1 b_3\,(\hat{\mathbf{x}}\times\hat{\mathbf{z}}) + a_2 b_1\,(\hat{\mathbf{y}}\times\hat{\mathbf{x}}) + a_2 b_3\,(\hat{\mathbf{y}}\times\hat{\mathbf{z}}) + a_3 b_1\,(\hat{\mathbf{z}}\times\hat{\mathbf{x}}) + a_3 b_2\,(\hat{\mathbf{z}}\times\hat{\mathbf{y}}) .
$$

Now replace each axis product with its answer, and collect what multiplies $\hat{\mathbf{x}}$, $\hat{\mathbf{y}}$ and $\hat{\mathbf{z}}$:

$$
\mathbf{a}\times\mathbf{b} = \begin{pmatrix} a_2 b_3 - a_3 b_2 \\ a_3 b_1 - a_1 b_3 \\ a_1 b_2 - a_2 b_1 \end{pmatrix}.
$$

Each component is a little $2 \times 2$ determinant built from the *other* two indices, in circular order: the first component uses $2, 3$; the second uses $3, 1$; the third uses $1, 2$.

Check the "perpendicular" claim straight from the formula:

$$
\mathbf{a}\cdot(\mathbf{a}\times\mathbf{b}) = a_1(a_2 b_3 - a_3 b_2) + a_2(a_3 b_1 - a_1 b_3) + a_3(a_1 b_2 - a_2 b_1) = 0 ,
$$

because every product, such as $a_1 a_2 b_3$, appears once with a plus sign and once with a minus. The same holds for $\mathbf{b}$.

::: note Why the length is the area
Expanding both sides with the component formula shows

$$
\|\mathbf{a}\times\mathbf{b}\|^2 = \|\mathbf{a}\|^2\|\mathbf{b}\|^2 - (\mathbf{a}\cdot\mathbf{b})^2 .
$$

It is the three-dimensional version of the area calculation that opened Lesson 5. Put in $\mathbf{a}\cdot\mathbf{b} = \|\mathbf{a}\|\|\mathbf{b}\|\cos\theta$ and use $1 - \cos^2\theta = \sin^2\theta$: the right side becomes $\|\mathbf{a}\|^2\|\mathbf{b}\|^2\sin^2\theta$. Take the square root and you have base times height.
:::

The component formula is also the cofactor expansion of a symbolic determinant, which is the usual way to remember it:

$$
\mathbf{a}\times\mathbf{b} = \begin{vmatrix} \hat{\mathbf{x}} & \hat{\mathbf{y}} & \hat{\mathbf{z}} \\ a_1 & a_2 & a_3 \\ b_1 & b_2 & b_3 \end{vmatrix}, \qquad \mathbf{c}\cdot(\mathbf{a}\times\mathbf{b}) = \det\begin{pmatrix} c_1 & a_1 & b_1 \\ c_2 & a_2 & b_2 \\ c_3 & a_3 & b_3 \end{pmatrix}.
$$

The second expression is the **scalar triple product**: the signed volume of the box spanned by three vectors, as promised in Lesson 5. Swapping two columns flips a determinant's sign, so $\mathbf{c}\cdot(\mathbf{a}\times\mathbf{b}) = -\mathbf{b}\cdot(\mathbf{a}\times\mathbf{c})$. You will use that below.

::: example Angular momentum of a low-Earth orbit
Take the state vector from Lesson 1: $\mathbf{r} = (-2690, 5320, 3470)^T$ km and $\mathbf{v} = (-6.8, -1.2, -3.2)^T$ km/s. The **[[specific angular momentum|orbit-h]]** is $\mathbf{h} = \mathbf{r}\times\mathbf{v}$. Apply the component formula one row at a time:

$$
\mathbf{h} = \begin{pmatrix} 5320(-3.2) - 3470(-1.2) \\ 3470(-6.8) - (-2690)(-3.2) \\ (-2690)(-1.2) - 5320(-6.8) \end{pmatrix} = \begin{pmatrix} -17\,024 + 4164 \\ -23\,596 - 8608 \\ 3228 + 36\,176 \end{pmatrix} = \begin{pmatrix} -12\,860 \\ -32\,204 \\ 39\,404 \end{pmatrix}\ \mathrm{km^2/s}.
$$

**Perpendicular?** $\mathbf{h}\cdot\mathbf{r} = 34\,593\,400 - 171\,325\,280 + 136\,731\,880 = 0$. Yes.

**Length.** $\|\mathbf{h}\| = \sqrt{12\,860^2 + 32\,204^2 + 39\,404^2} = 52\,490\ \mathrm{km^2/s}$. Dividing by $\|\mathbf{r}\|\,\|\mathbf{v}\| = 6897.8 \times 7.6105 = 52\,496$ gives $\sin\theta = 0.99988$, so the angle between $\mathbf{r}$ and $\mathbf{v}$ is $89.12°$. That is $90° - 0.878°$, where $0.878°$ is the flight-path angle found in Lesson 1 — as it must be.

**The orbit's tilt.** The orbit plane is perpendicular to $\mathbf{h}$. Its tilt to the equator, the inclination $i$, is the angle between $\mathbf{h}$ and $\hat{\mathbf{z}}$: $\cos i = 39\,404 / 52\,490 = 0.7507$, so $i = 41.3°$. The quantity $p = h^2/\mu = 52\,490^2 / (3.986 \times 10^5) = 6912$ km, called the semi-latus rectum, will matter in the orbital mechanics modules.
:::

## The cross-product matrix

Fix $\mathbf{a}$ and think of the component formula as a machine that eats $\mathbf{b}$. Each output component is a mix of $b_1, b_2, b_3$ with amounts taken from $\mathbf{a}$. So $\mathbf{b} \mapsto \mathbf{a}\times\mathbf{b}$ is a linear map, and it has a matrix.

Read the amounts off row by row. The first component is $0\cdot b_1 - a_3 b_2 + a_2 b_3$, so row 1 is $(0, -a_3, a_2)$. Do the same for the other two:

$$
[\mathbf{a}\times] = \begin{pmatrix} 0 & -a_3 & a_2 \\ a_3 & 0 & -a_1 \\ -a_2 & a_1 & 0 \end{pmatrix}, \qquad [\mathbf{a}\times]\,\mathbf{b} = \mathbf{a}\times\mathbf{b} .
$$

This is the **[[cross-product matrix|matrix-layout]]** of $\mathbf{a}$, read "a cross". The diagonal is zero. Positions $(2, 1)$, $(3, 2)$ and $(1, 3)$ carry $+a_3$, $+a_1$, $+a_2$, and their mirror positions carry the negatives. Other books write it $\mathbf{a}^\times$, $\hat{\mathbf{a}}$ or $\mathbf{a}^\wedge$; ORBIT writes $[\mathbf{a}\times]$ throughout.

### It is skew-symmetric

Look across the diagonal. The entry at $(i, j)$ is the negative of the entry at $(j, i)$. So the transpose is the negative:

$$
[\mathbf{a}\times]^T = -[\mathbf{a}\times] .
$$

A matrix with $\mathbf{S}^T = -\mathbf{S}$ is **[[skew-symmetric|skew-word]]**. The reason is the anticommutativity of the cross product: $[\mathbf{a}\times]^T\mathbf{b} = -\mathbf{a}\times\mathbf{b} = \mathbf{b}\times\mathbf{a}$. Flipping the matrix is flipping the order.

::: note Why it has to be true
Take any $\mathbf{b}$ and $\mathbf{c}$. Using the triple-product sign rule,

$$
\mathbf{c}^T[\mathbf{a}\times]\mathbf{b} = \mathbf{c}\cdot(\mathbf{a}\times\mathbf{b}) = -\mathbf{b}\cdot(\mathbf{a}\times\mathbf{c}) = -\mathbf{b}^T[\mathbf{a}\times]\mathbf{c} .
$$

The last expression is a single number, so it equals its own transpose, $-\mathbf{c}^T[\mathbf{a}\times]^T\mathbf{b}$. This holds for every $\mathbf{b}$ and $\mathbf{c}$, so the matrices themselves agree: $[\mathbf{a}\times] = -[\mathbf{a}\times]^T$.
:::

### It is singular, with $\mathbf{a}$ in its null space

$[\mathbf{a}\times]\,\mathbf{a} = \mathbf{a}\times\mathbf{a} = \mathbf{0}$. So $\mathbf{a}$ lies in the null space. A vector cannot rotate about itself: the axis of a turn is the one direction the turn leaves alone.

For $\mathbf{a} \ne \mathbf{0}$ the null space is exactly the line along $\mathbf{a}$, since $\mathbf{a}\times\mathbf{b} = \mathbf{0}$ needs $\sin\theta = 0$. By rank–nullity (Lesson 4) the rank is $3 - 1 = 2$. The column space is the plane perpendicular to $\mathbf{a}$ — where every cross product with $\mathbf{a}$ lands. Being singular, $[\mathbf{a}\times]$ has no inverse and zero determinant.

In fact *every* $3 \times 3$ skew-symmetric matrix has zero determinant. Using Lesson 5's rules, $\det\mathbf{S} = \det\mathbf{S}^T = \det(-\mathbf{S}) = (-1)^3\det\mathbf{S} = -\det\mathbf{S}$, and the only number equal to its own negative is $0$.

### It is linear in $\mathbf{a}$

Each entry of $[\mathbf{a}\times]$ is a component of $\mathbf{a}$ or its negative, so $[(\alpha\mathbf{a} + \beta\mathbf{b})\times] = \alpha[\mathbf{a}\times] + \beta[\mathbf{b}\times]$.

Count the free numbers in a $3 \times 3$ skew-symmetric matrix. The diagonal must be zero, and the three entries below the diagonal fix the three above. That leaves exactly three — the same as a vector in $\mathbb{R}^3$. So $\mathbf{a} \mapsto [\mathbf{a}\times]$ pairs every vector with exactly one skew-symmetric matrix, and every such matrix is the cross-product matrix of some vector. That is why, in three dimensions, "skew-symmetric matrix" and "angular velocity" can stand for each other. This neat match — three components, three free entries — happens **[[only in three dimensions|only-in-3d]]**.

::: key The cross-product matrix
$[\mathbf{a}\times] = \begin{pmatrix} 0 & -a_3 & a_2 \\ a_3 & 0 & -a_1 \\ -a_2 & a_1 & 0 \end{pmatrix}$, so that $[\mathbf{a}\times]\mathbf{b} = \mathbf{a}\times\mathbf{b}$. It is skew-symmetric, $[\mathbf{a}\times]^T = -[\mathbf{a}\times]$, because $\mathbf{a}\times\mathbf{b} = -\mathbf{b}\times\mathbf{a}$. It is singular: $[\mathbf{a}\times]\mathbf{a} = \mathbf{0}$, rank 2, no inverse.
:::

::: example Velocity of a point on a rotating body
A gyro reports the body rate $\boldsymbol{\omega} = (0.01, -0.02, 0.05)^T$ rad/s in body axes. A star tracker sits at $\mathbf{r}_p = (1.2, 0.3, -0.4)^T$ m from the center of mass. Its velocity relative to the center of mass is $\boldsymbol{\omega}\times\mathbf{r}_p = [\boldsymbol{\omega}\times]\,\mathbf{r}_p$.

**Build the matrix** by placing $\omega_1 = 0.01$, $\omega_2 = -0.02$, $\omega_3 = 0.05$ in the layout, then **multiply**:

$$
[\boldsymbol{\omega}\times] = \begin{pmatrix} 0 & -0.05 & -0.02 \\ 0.05 & 0 & -0.01 \\ 0.02 & 0.01 & 0 \end{pmatrix}, \qquad
[\boldsymbol{\omega}\times]\begin{pmatrix} 1.2 \\ 0.3 \\ -0.4 \end{pmatrix} = \begin{pmatrix} -0.015 + 0.008 \\ 0.060 + 0.004 \\ 0.024 + 0.003 \end{pmatrix} = \begin{pmatrix} -0.007 \\ 0.064 \\ 0.027 \end{pmatrix}\ \mathrm{m/s}.
$$

**Check with the component formula.** The first component is $\omega_2 r_3 - \omega_3 r_2 = (-0.02)(-0.4) - (0.05)(0.3) = 0.008 - 0.015 = -0.007$. It matches.

**Check the null space.** The first component of $[\boldsymbol{\omega}\times]\boldsymbol{\omega}$ is $-0.05(-0.02) - 0.02(0.05) = 0.001 - 0.001 = 0$, and the others vanish the same way.

**Check perpendicularity.** $\mathbf{v}\cdot\mathbf{r}_p = -0.0084 + 0.0192 - 0.0108 = 0$.

The speed is about $70$ mm/s. The tracker's image processing must allow for it, and it is the $\boldsymbol{\omega}\times\mathbf{r}$ term that the rotating-frames module adds to every rate of change measured in a turning frame.
:::

## Skew-symmetric matrices in general

A skew-symmetric matrix $\mathbf{S}$, of any size, has a property that makes it the natural engine of rotation: its output is always perpendicular to its input. Here is why. For any $\mathbf{x}$, the number $\mathbf{x}^T\mathbf{S}\mathbf{x}$ equals its own transpose, $\mathbf{x}^T\mathbf{S}^T\mathbf{x} = -\mathbf{x}^T\mathbf{S}\mathbf{x}$. A number equal to its own negative is zero:

$$
\mathbf{x}^T\mathbf{S}\mathbf{x} = 0 \quad \text{for every } \mathbf{x}.
$$

For $[\mathbf{a}\times]$ this is $\mathbf{x}\cdot(\mathbf{a}\times\mathbf{x}) = 0$ — the merry-go-round's sideways push.

A push that is always sideways never changes your distance from the center. So if a vector changes by $\dot{\mathbf{y}} = \mathbf{S}\mathbf{y}$ (the dot means rate of change in time), its length stays fixed:

$$
\tfrac{d}{dt}\|\mathbf{y}\|^2 = 2\,\mathbf{y}^T\dot{\mathbf{y}} = 2\,\mathbf{y}^T\mathbf{S}\mathbf{y} = 0 .
$$

Motion driven by a skew-symmetric matrix is pure rotation. This is the deep reason the attitude equations below keep a rotation a rotation.

### Products of cross-product matrices

Two identities about products carry most of attitude dynamics. Both rest on the **vector triple product**:

$$
\mathbf{a}\times(\mathbf{b}\times\mathbf{c}) = \mathbf{b}\,(\mathbf{a}\cdot\mathbf{c}) - \mathbf{c}\,(\mathbf{a}\cdot\mathbf{b}) .
$$

::: note Why it has to be true
Work out the first component of the left side, using the component formula twice:

$$
a_2(\mathbf{b}\times\mathbf{c})_3 - a_3(\mathbf{b}\times\mathbf{c})_2 = a_2(b_1 c_2 - b_2 c_1) - a_3(b_3 c_1 - b_1 c_3) = b_1(a_2 c_2 + a_3 c_3) - c_1(a_2 b_2 + a_3 b_3) .
$$

Add and subtract $a_1 b_1 c_1$ to complete the two dot products: $b_1(\mathbf{a}\cdot\mathbf{c}) - c_1(\mathbf{a}\cdot\mathbf{b})$. That is the first component of the right side. The other two components follow by cycling the indices $1 \to 2 \to 3 \to 1$.
:::

Now write the left side as $[\mathbf{a}\times][\mathbf{b}\times]\mathbf{c}$. Write the right side as $(\mathbf{b}\mathbf{a}^T - (\mathbf{a}\cdot\mathbf{b})\mathbf{I})\,\mathbf{c}$, using the **outer product** $\mathbf{b}\mathbf{a}^T$ — a column times a row, which makes a $3 \times 3$ matrix — and the fact that $\mathbf{b}\mathbf{a}^T\mathbf{c} = \mathbf{b}(\mathbf{a}^T\mathbf{c})$. They agree for every $\mathbf{c}$, so

$$
[\mathbf{a}\times][\mathbf{b}\times] = \mathbf{b}\,\mathbf{a}^T - (\mathbf{a}\cdot\mathbf{b})\,\mathbf{I} .
$$

**First identity: the square.** Put $\mathbf{b} = \mathbf{a}$:

$$
[\mathbf{a}\times]^2 = \mathbf{a}\mathbf{a}^T - \|\mathbf{a}\|^2\,\mathbf{I}, \qquad [\mathbf{a}\times]^3 = -\|\mathbf{a}\|^2\,[\mathbf{a}\times] .
$$

The cube follows by multiplying the square by $[\mathbf{a}\times]$ on the left: the first term dies because $[\mathbf{a}\times]\mathbf{a}\mathbf{a}^T = (\mathbf{a}\times\mathbf{a})\mathbf{a}^T = \mathbf{0}$. So every higher power of $[\mathbf{a}\times]$ is a multiple of $[\mathbf{a}\times]$ or $[\mathbf{a}\times]^2$. That is what makes the rotation formula below possible. For a unit vector $\hat{\mathbf{k}}$, $[\hat{\mathbf{k}}\times]^2 = \hat{\mathbf{k}}\hat{\mathbf{k}}^T - \mathbf{I}$, which is minus the projection onto the plane perpendicular to $\hat{\mathbf{k}}$.

**Second identity: the commutator.** Subtract the product taken in the other order. The $(\mathbf{a}\cdot\mathbf{b})\mathbf{I}$ terms cancel:

$$
[\mathbf{a}\times][\mathbf{b}\times] - [\mathbf{b}\times][\mathbf{a}\times] = \mathbf{b}\mathbf{a}^T - \mathbf{a}\mathbf{b}^T .
$$

Apply the right side to any $\mathbf{c}$: you get $\mathbf{b}(\mathbf{a}\cdot\mathbf{c}) - \mathbf{a}(\mathbf{b}\cdot\mathbf{c})$. Now use the vector triple product with the roles rearranged: $(\mathbf{a}\times\mathbf{b})\times\mathbf{c} = -\mathbf{c}\times(\mathbf{a}\times\mathbf{b}) = -\mathbf{a}(\mathbf{c}\cdot\mathbf{b}) + \mathbf{b}(\mathbf{c}\cdot\mathbf{a})$. The same thing. Therefore

$$
[\mathbf{a}\times][\mathbf{b}\times] - [\mathbf{b}\times][\mathbf{a}\times] = [(\mathbf{a}\times\mathbf{b})\times] .
$$

In words: the commutator (the product one way minus the product the other way) of two cross-product matrices is the cross-product matrix of the cross product. This is the **[[Lie bracket|lie-bracket]]** of $\mathfrak{so}(3)$, the family of $3 \times 3$ skew-symmetric matrices. It says the cross product on vectors and the commutator on matrices are the same operation, seen through the pairing $\mathbf{a} \leftrightarrow [\mathbf{a}\times]$.

Try numbers. For $\mathbf{a} = (1, -2, 0.5)^T$ and $\mathbf{b} = (0.3, 2, 1)^T$, $\mathbf{a}\times\mathbf{b} = (-3, -0.85, 2.6)^T$. Multiplying out the two matrix products gives a commutator whose $(2, 1)$ entry is $2.6$ and whose $(1, 3)$ entry is $-0.85$ — exactly where $[(\mathbf{a}\times\mathbf{b})\times]$ puts its third and second components. This is the identity the module's cross-product-matrix exercise asks you to check on random vectors.

### How a rotation acts on a cross-product matrix

Turn a tile and the arrow sticking out of it turns with it. A proper rotation keeps lengths, angles and handedness, so it carries the parallelogram of $\mathbf{a}$ and $\mathbf{b}$ to an identical parallelogram facing the same way. So the cross product of the rotated vectors is the rotated cross product:

$$
\mathbf{R}(\mathbf{a}\times\mathbf{b}) = (\mathbf{R}\mathbf{a})\times(\mathbf{R}\mathbf{b}) \qquad (\mathbf{R} \in SO(3)).
$$

A reflection, with $\det = -1$, would flip the sign. This is where the determinant test of Lesson 7 earns its place.

Now apply $\mathbf{R}[\mathbf{a}\times]\mathbf{R}^T$ to any $\mathbf{c}$: it gives $\mathbf{R}(\mathbf{a}\times\mathbf{R}^T\mathbf{c}) = (\mathbf{R}\mathbf{a})\times(\mathbf{R}\mathbf{R}^T\mathbf{c}) = (\mathbf{R}\mathbf{a})\times\mathbf{c}$. So

$$
\mathbf{R}\,[\mathbf{a}\times]\,\mathbf{R}^T = [(\mathbf{R}\mathbf{a})\times] .
$$

In frame language: if $\boldsymbol{\omega}^B$ is an angular velocity resolved in body axes, then $[\boldsymbol{\omega}^I\times] = \mathbf{R}_I^B\,[\boldsymbol{\omega}^B\times]\,(\mathbf{R}_I^B)^T$ is the same angular velocity's matrix resolved in inertial axes. Changing the frame of a skew-symmetric matrix is the similarity transformation of Lesson 7.

## Connection to rotation

### Small rotations

Turn a vector $\mathbf{v}$ through a small angle $\delta\theta$ about a unit axis $\hat{\mathbf{k}}$. Its tip moves along a circle around the axis. The circle's radius is $\|\mathbf{v}\|\sin\varphi$, where $\varphi$ ("phi") is the angle between $\hat{\mathbf{k}}$ and $\mathbf{v}$. The tip moves an arc of length $\delta\theta\,\|\mathbf{v}\|\sin\varphi$, sideways to both $\hat{\mathbf{k}}$ and $\mathbf{v}$. That is the direction of $\hat{\mathbf{k}}\times\mathbf{v}$, whose length is exactly $\|\mathbf{v}\|\sin\varphi$. So, keeping only first-order terms in $\delta\theta$,

$$
\mathbf{v}' \approx \mathbf{v} + \delta\theta\,\hat{\mathbf{k}}\times\mathbf{v} = \big(\mathbf{I} + [\boldsymbol{\delta\theta}\times]\big)\,\mathbf{v}, \qquad \boldsymbol{\delta\theta} = \delta\theta\,\hat{\mathbf{k}} .
$$

The vector $\boldsymbol{\delta\theta}$ — axis times angle — is the **rotation vector**. A small rotation is the identity plus its cross-product matrix. This is the form every attitude error takes in a **[[Kalman filter|error-state]]**: the true attitude is the estimated attitude times $\mathbf{I} + [\boldsymbol{\delta\theta}\times]$, and the three components of $\boldsymbol{\delta\theta}$ are the three attitude-error states.

The approximation is not exactly a rotation. Column $j$ of $\mathbf{I} + [\boldsymbol{\delta\theta}\times]$ has squared length $1$ plus the squares of the other two components of $\boldsymbol{\delta\theta}$. Its determinant is $1 + \|\boldsymbol{\delta\theta}\|^2$. And $(\mathbf{I} + \mathbf{S})^T(\mathbf{I} + \mathbf{S}) = \mathbf{I} - \mathbf{S}^2$ misses the identity by second-order terms. So small-angle rotation matrices must be re-orthonormalized, or replaced by the exact formula, before they are chained many times.

::: example A small rotation, approximate and exact
Take $\boldsymbol{\delta\theta} = (0.001, 0.002, -0.001)^T$ rad. Its size is $\|\boldsymbol{\delta\theta}\| = \sqrt{0.000006} = 2.449 \times 10^{-3}$ rad, or $0.140°$. The first-order matrix puts those numbers in the cross-product layout:

$$
\mathbf{I} + [\boldsymbol{\delta\theta}\times] = \begin{pmatrix} 1 & 0.001 & 0.002 \\ -0.001 & 1 & -0.001 \\ -0.002 & 0.001 & 1 \end{pmatrix}.
$$

**Against the exact rotation.** The exact formula of the next section differs from this matrix by at most $2.5 \times 10^{-6}$ in any entry. That matches $\|\boldsymbol{\delta\theta}\|^2/2 = 3.0 \times 10^{-6}$ — the size a second-order error should have.

**The audit.** $(\mathbf{I} + \mathbf{S})^T(\mathbf{I} + \mathbf{S}) - \mathbf{I} = -\mathbf{S}^2$ has entries up to $5 \times 10^{-6}$, and the determinant is $1 + \|\boldsymbol{\delta\theta}\|^2 = 1.000006$. Used once, harmless. Applied at $100\ \mathrm{Hz}$ for an hour with no correction — $3.6 \times 10^5$ steps — it would leave a matrix that is visibly no longer a rotation.
:::

### Finite rotations: the Rodrigues formula

For a turn of any size $\theta$ about a unit axis $\hat{\mathbf{k}}$, split $\mathbf{v}$ into two parts, the way a spinning top has a stick and a spinning disk:

- the part along the axis, $\mathbf{v}_\parallel = \hat{\mathbf{k}}(\hat{\mathbf{k}}\cdot\mathbf{v})$, which the turn does not touch;
- the part across the axis, $\mathbf{v}_\perp = \mathbf{v} - \mathbf{v}_\parallel$, which turns through $\theta$ in the plane perpendicular to $\hat{\mathbf{k}}$.

In that plane, $\hat{\mathbf{k}}\times\mathbf{v}_\perp = \hat{\mathbf{k}}\times\mathbf{v}$ is $\mathbf{v}_\perp$ turned a quarter turn, with the same length. So the plane rotation of Lesson 2 turns $\mathbf{v}_\perp$ into $\mathbf{v}_\perp\cos\theta + (\hat{\mathbf{k}}\times\mathbf{v})\sin\theta$. Add back the untouched part and tidy up:

$$
\mathbf{v}' = \mathbf{v}\cos\theta + (\hat{\mathbf{k}}\times\mathbf{v})\sin\theta + \hat{\mathbf{k}}(\hat{\mathbf{k}}\cdot\mathbf{v})(1 - \cos\theta) .
$$

Write each term as a matrix acting on $\mathbf{v}$, using $\hat{\mathbf{k}}\hat{\mathbf{k}}^T = \mathbf{I} + [\hat{\mathbf{k}}\times]^2$ from the square identity:

$$
\mathbf{R}(\hat{\mathbf{k}}, \theta) = \mathbf{I} + \sin\theta\,[\hat{\mathbf{k}}\times] + (1 - \cos\theta)\,[\hat{\mathbf{k}}\times]^2 .
$$

This is the **[[Rodrigues rotation formula|rodrigues]]**. It is built from the identity and powers of one skew-symmetric matrix, and it is exactly orthogonal with determinant $+1$ for every $\theta$.

Test it with $\hat{\mathbf{k}} = \hat{\mathbf{z}}$ and $\theta = 30°$. $[\hat{\mathbf{z}}\times]$ has $-1$ at $(1, 2)$ and $+1$ at $(2, 1)$, and $[\hat{\mathbf{z}}\times]^2 = \operatorname{diag}(-1, -1, 0)$. With $1 - \cos 30° = 0.1340$, the formula gives

$$
\begin{pmatrix} 1 - 0.1340 & -0.5 & 0 \\ 0.5 & 1 - 0.1340 & 0 \\ 0 & 0 & 1 \end{pmatrix} = \mathbf{R}_3(30°),
$$

since $1 - 0.1340 = 0.8660 = \cos 30°$. For small $\theta$, $\sin\theta \approx \theta$ and $1 - \cos\theta \approx \theta^2/2$, which gives back $\mathbf{I} + [\boldsymbol{\theta}\times]$ plus a second-order correction. Linear Algebra II shows the same formula is the matrix exponential $e^{\theta[\hat{\mathbf{k}}\times]}$, summed using $[\hat{\mathbf{k}}\times]^3 = -[\hat{\mathbf{k}}\times]$.

### Attitude kinematics

Let the body frame $B$ turn relative to the inertial frame $I$ at angular velocity $\boldsymbol{\omega}$. Each body axis $\hat{\mathbf{b}}_j$ is fixed to the body, like a pencil taped to it, so its tip moves at $\boldsymbol{\omega}\times\hat{\mathbf{b}}_j$ — the small-rotation result, per second. By Lesson 7, the columns of $\mathbf{R}_I^B$ are exactly the body axes in inertial coordinates, $\hat{\mathbf{b}}_j^{\,I}$. So, column by column,

$$
\frac{d}{dt}\hat{\mathbf{b}}_j^{\,I} = \boldsymbol{\omega}^I\times\hat{\mathbf{b}}_j^{\,I} = [\boldsymbol{\omega}^I\times]\,\hat{\mathbf{b}}_j^{\,I} \quad\Longrightarrow\quad \dot{\mathbf{R}}_I^B = [\boldsymbol{\omega}^I\times]\,\mathbf{R}_I^B .
$$

A set of three **gyros**, though, measures $\boldsymbol{\omega}$ in body axes. So substitute $[\boldsymbol{\omega}^I\times] = \mathbf{R}_I^B[\boldsymbol{\omega}^B\times](\mathbf{R}_I^B)^T$ from the frame-change rule, and use $(\mathbf{R}_I^B)^T\mathbf{R}_I^B = \mathbf{I}$:

$$
\dot{\mathbf{R}}_I^B = \mathbf{R}_I^B\,[\boldsymbol{\omega}^B\times] .
$$

This is the **attitude kinematics equation**. The rate of change of the body-to-inertial matrix is the matrix itself times the cross-product matrix of the body-axis angular velocity, on the right. Feed it gyro data, step it forward in time, and you are tracking the vehicle's attitude. The skew matrix goes on the right with body-axis rates and on the left with inertial-axis rates. Mixing the two is a frame bug of exactly the kind Lesson 7 warned about.

The equation keeps a rotation a rotation. Write $\mathbf{R} = \mathbf{R}_I^B$ and $\mathbf{W} = [\boldsymbol{\omega}^B\times]$, and suppose $\mathbf{R}^T\mathbf{R} = \mathbf{I}$ right now. Then

$$
\frac{d}{dt}\big(\mathbf{R}^T\mathbf{R}\big) = \dot{\mathbf{R}}^T\mathbf{R} + \mathbf{R}^T\dot{\mathbf{R}} = \mathbf{W}^T\mathbf{R}^T\mathbf{R} + \mathbf{R}^T\mathbf{R}\,\mathbf{W} = -\mathbf{W} + \mathbf{W} = \mathbf{0} ,
$$

using $\mathbf{W}^T = -\mathbf{W}$. The exact motion never drifts. Only a numerical integrator lets it drift. That is why flight software re-orthonormalizes, or steps with the Rodrigues formula, or — in the attitude-representations module — switches to **[[quaternions|quaternion-bridge]]**, which carry four numbers and one constraint instead of nine numbers and six.

::: example One integration step from gyro data
A body spins about its 3-axis at $\boldsymbol{\omega}^B = (0, 0, 0.3)^T$ rad/s, and right now $\mathbf{R}_I^B = \mathbf{I}$. The simplest integrator, **[[Euler's method|euler-drift]]** — take the current rate, assume it holds for the whole step — with $\Delta t = 0.1$ s gives

$$
\mathbf{R}(t + \Delta t) \approx \mathbf{R}(t)\big(\mathbf{I} + \Delta t\,[\boldsymbol{\omega}^B\times]\big) = \begin{pmatrix} 1 & -0.03 & 0 \\ 0.03 & 1 & 0 \\ 0 & 0 & 1 \end{pmatrix}.
$$

**The exact answer** is a turn of $0.3 \times 0.1 = 0.03$ rad about the 3-axis, $\mathbf{R}_3(0.03)$, whose diagonal entries are $\cos 0.03 = 0.99955$.

**Compare.** The Euler step has the off-diagonal terms right and the diagonal wrong by $4.5 \times 10^{-4}$. Its first column has length $\sqrt{1 + 0.03^2} = 1.00045$. After ten steps the columns would be about $0.45\%$ too long: the estimated attitude would be growing, not only turning.

**The fix.** Replace $\mathbf{I} + \Delta t[\boldsymbol{\omega}\times]$ by the Rodrigues matrix $\mathbf{R}(\hat{\boldsymbol{\omega}}, \|\boldsymbol{\omega}\|\Delta t)$. Every step is then an exact rotation, and for a rate that stays constant over the step it is the exact answer.
:::

::: key Skew-symmetric matrices and rotation
$\mathbf{x}^T\mathbf{S}\mathbf{x} = 0$ for skew-symmetric $\mathbf{S}$, so $\dot{\mathbf{y}} = \mathbf{S}\mathbf{y}$ preserves length. A small rotation is $\mathbf{I} + [\boldsymbol{\delta\theta}\times]$; a finite one is $\mathbf{I} + \sin\theta[\hat{\mathbf{k}}\times] + (1 - \cos\theta)[\hat{\mathbf{k}}\times]^2$. Attitude kinematics: $\dot{\mathbf{R}}_I^B = \mathbf{R}_I^B[\boldsymbol{\omega}^B\times]$ with the rate in body axes. Also $[\mathbf{a}\times][\mathbf{b}\times] - [\mathbf{b}\times][\mathbf{a}\times] = [(\mathbf{a}\times\mathbf{b})\times]$ and $\mathbf{R}[\mathbf{a}\times]\mathbf{R}^T = [(\mathbf{R}\mathbf{a})\times]$.
:::

::: warning Which side the skew matrix goes on
$\dot{\mathbf{R}}_I^B = \mathbf{R}_I^B[\boldsymbol{\omega}^B\times]$ with body-axis rates; $\dot{\mathbf{R}}_I^B = [\boldsymbol{\omega}^I\times]\mathbf{R}_I^B$ with inertial-axis rates. The matrices $[\boldsymbol{\omega}^B\times]$ and $[\boldsymbol{\omega}^I\times]$ are different, related by $\mathbf{R}[\mathbf{a}\times]\mathbf{R}^T = [(\mathbf{R}\mathbf{a})\times]$. Gyros give body rates. Put the matrix on the right.
:::

::: warning The layout of $[\mathbf{a}\times]$
Row 1 is $(0, -a_3, a_2)$. The most common error flips every sign and builds $[\mathbf{a}\times]^T = -[\mathbf{a}\times]$ by mistake. That matrix computes $\mathbf{b}\times\mathbf{a}$ and reverses every angular velocity. Test any implementation against `np.cross` on a random pair before trusting it, and test `skew(a) @ a == 0` as well.
:::

Here is that test in NumPy, on the rotating-body example:

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
print(np.allclose(skew(w) @ w, 0.0))     # True: w is in the null space
```

## Check yourself

::: check
Compute $\mathbf{a}\times\mathbf{b}$ for $\mathbf{a} = (2, 0, -1)^T$ and $\mathbf{b} = (1, 3, 0)^T$. Then write $[\mathbf{a}\times]$ and confirm that $[\mathbf{a}\times]\mathbf{b}$ gives the same answer.
:::

::: answer
Component by component: $a_2 b_3 - a_3 b_2 = 0 - (-1)(3) = 3$; $a_3 b_1 - a_1 b_3 = (-1)(1) - 0 = -1$; $a_1 b_2 - a_2 b_1 = 6 - 0 = 6$. So $\mathbf{a}\times\mathbf{b} = (3, -1, 6)^T$.

Place $a_1 = 2$, $a_2 = 0$, $a_3 = -1$ in the layout:

$$
[\mathbf{a}\times] = \begin{pmatrix} 0 & 1 & 0 \\ -1 & 0 & -2 \\ 0 & 2 & 0 \end{pmatrix}, \qquad [\mathbf{a}\times]\mathbf{b} = (3,\ -1 - 0,\ 6)^T = (3, -1, 6)^T .
$$

They agree. Check perpendicularity: $(3, -1, 6)\cdot(2, 0, -1) = 6 - 6 = 0$.
:::

::: check
Why does $[\mathbf{a}\times]$ have no inverse, and what does that say physically about recovering $\mathbf{b}$ from $\mathbf{a}\times\mathbf{b}$?
:::

::: answer
$[\mathbf{a}\times]\mathbf{a} = \mathbf{0}$ with $\mathbf{a} \ne \mathbf{0}$. So the null space holds more than zero, the rank is 2, and the determinant is zero — as it is for every skew-symmetric matrix of odd size.

Physically, $\mathbf{a}\times\mathbf{b}$ depends only on the part of $\mathbf{b}$ across $\mathbf{a}$. Any part of $\mathbf{b}$ along $\mathbf{a}$ is lost, so $\mathbf{b}$ cannot be recovered from the product. Knowing the velocity $\boldsymbol{\omega}\times\mathbf{r}$ of one point tells you nothing about how far along the spin axis that point sits.
:::

::: check
Show from $[\mathbf{a}\times]^2 = \mathbf{a}\mathbf{a}^T - \|\mathbf{a}\|^2\mathbf{I}$ that the trace of $[\mathbf{a}\times]^2$ is $-2\|\mathbf{a}\|^2$. Then use it to recover $\|\boldsymbol{\omega}\|$ from the matrix $[\boldsymbol{\omega}\times]$ in the rotating-body example.
:::

::: answer
The trace is the sum of the diagonal entries. The diagonal of $\mathbf{a}\mathbf{a}^T$ is $a_1^2, a_2^2, a_3^2$, so its trace is $\|\mathbf{a}\|^2$. The trace of $\|\mathbf{a}\|^2\mathbf{I}$ is $3\|\mathbf{a}\|^2$. So $\operatorname{tr}([\mathbf{a}\times]^2) = \|\mathbf{a}\|^2 - 3\|\mathbf{a}\|^2 = -2\|\mathbf{a}\|^2$.

For the example, the diagonal of $[\boldsymbol{\omega}\times]^2$ is $(-0.0029, -0.0026, -0.0005)$, which sums to $-0.0060$. So $\|\boldsymbol{\omega}\|^2 = 0.0030$ and $\|\boldsymbol{\omega}\| = 0.0548$ rad/s. Directly: $\sqrt{0.01^2 + 0.02^2 + 0.05^2} = \sqrt{0.0030} = 0.0548$ rad/s. They agree.
:::

::: check
A filter holds an attitude estimate $\hat{\mathbf{R}}_I^B$ and estimates a small error rotation vector $\boldsymbol{\delta\theta} = (0, 0, 0.002)^T$ rad. Write the corrected matrix to first order, and give its determinant to first and to second order.
:::

::: answer
The correction is $\mathbf{R}_I^B \approx \hat{\mathbf{R}}_I^B(\mathbf{I} + [\boldsymbol{\delta\theta}\times])$, with

$$
[\boldsymbol{\delta\theta}\times] = \begin{pmatrix} 0 & -0.002 & 0 \\ 0.002 & 0 & 0 \\ 0 & 0 & 0 \end{pmatrix},
$$

a small turn of the body frame about its 3-axis. To first order the determinant is $1$, because the first-order change in a determinant is the trace, and a skew-symmetric matrix has zero trace. To second order it is $1 + \|\boldsymbol{\delta\theta}\|^2 = 1.000004$. That is why the corrected matrix should be re-orthonormalized, or built with the Rodrigues formula, before the next step.
:::

::: check
Starting from $\dot{\mathbf{R}}_I^B = \mathbf{R}_I^B[\boldsymbol{\omega}^B\times]$, write the kinematics of the inverse matrix $\mathbf{R}_B^I = (\mathbf{R}_I^B)^T$.
:::

::: answer
Transpose both sides. The transpose of a product reverses the order, and skew-symmetry turns $[\boldsymbol{\omega}^B\times]^T$ into $-[\boldsymbol{\omega}^B\times]$:

$$
\dot{\mathbf{R}}_B^I = \big(\mathbf{R}_I^B[\boldsymbol{\omega}^B\times]\big)^T = [\boldsymbol{\omega}^B\times]^T(\mathbf{R}_I^B)^T = -[\boldsymbol{\omega}^B\times]\,\mathbf{R}_B^I .
$$

The body-from-inertial matrix has the skew matrix on the left, with a minus sign. Many attitude books quote this form, because they track the inertial-to-body matrix. Both forms are the same physics; the frame labels tell you which one you are looking at.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\mathbf{a}\times\mathbf{b} = (a_2 b_3 - a_3 b_2,\ a_3 b_1 - a_1 b_3,\ a_1 b_2 - a_2 b_1)^T$ | Cross product; perpendicular to both, length $\lVert\mathbf{a}\rVert\lVert\mathbf{b}\rVert\sin\theta$, right-hand rule |
| $\mathbf{a}\times\mathbf{b} = -\mathbf{b}\times\mathbf{a}$, $\mathbf{a}\times\mathbf{a} = \mathbf{0}$ | Anticommutative |
| $\mathbf{c}\cdot(\mathbf{a}\times\mathbf{b}) = \det[\mathbf{c}\ \mathbf{a}\ \mathbf{b}]$ | Scalar triple product: signed volume |
| $\mathbf{a}\times(\mathbf{b}\times\mathbf{c}) = \mathbf{b}(\mathbf{a}\cdot\mathbf{c}) - \mathbf{c}(\mathbf{a}\cdot\mathbf{b})$ | Vector triple product |
| $[\mathbf{a}\times] = \begin{pmatrix} 0 & -a_3 & a_2 \\ a_3 & 0 & -a_1 \\ -a_2 & a_1 & 0 \end{pmatrix}$ | Cross-product matrix, $[\mathbf{a}\times]\mathbf{b} = \mathbf{a}\times\mathbf{b}$ |
| $[\mathbf{a}\times]^T = -[\mathbf{a}\times]$ | Skew-symmetric; $[\mathbf{a}\times]\mathbf{a} = \mathbf{0}$, rank 2, singular |
| $\mathbf{x}^T\mathbf{S}\mathbf{x} = 0$ | Skew-symmetric matrices drive length-preserving motion |
| $[\mathbf{a}\times]^2 = \mathbf{a}\mathbf{a}^T - \lVert\mathbf{a}\rVert^2\mathbf{I}$ | Square identity; $[\mathbf{a}\times]^3 = -\lVert\mathbf{a}\rVert^2[\mathbf{a}\times]$ |
| $[\mathbf{a}\times][\mathbf{b}\times] - [\mathbf{b}\times][\mathbf{a}\times] = [(\mathbf{a}\times\mathbf{b})\times]$ | The $\mathfrak{so}(3)$ Lie bracket |
| $\mathbf{R}[\mathbf{a}\times]\mathbf{R}^T = [(\mathbf{R}\mathbf{a})\times]$ | Changing the frame of a skew matrix |
| $\mathbf{R} \approx \mathbf{I} + [\boldsymbol{\delta\theta}\times]$ | Small rotation; attitude-error states |
| $\mathbf{R} = \mathbf{I} + \sin\theta[\hat{\mathbf{k}}\times] + (1 - \cos\theta)[\hat{\mathbf{k}}\times]^2$ | Rodrigues formula: exact turn by $\theta$ about $\hat{\mathbf{k}}$ |
| $\dot{\mathbf{R}}_I^B = \mathbf{R}_I^B[\boldsymbol{\omega}^B\times]$ | Attitude kinematics, body-axis rates on the right |

This closes Linear Algebra I. Linear Algebra II picks up two loose threads: the matrix exponential, which turns $\dot{\mathbf{R}} = \mathbf{R}[\boldsymbol{\omega}\times]$ into the Rodrigues formula and $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}$ into a state-transition matrix; and the singular value decomposition, which makes rank, null space and condition number computable for the matrices a real filter produces.

::: context cross-right-hand Base times height, and a thumb
The two arrows span a parallelogram. Its area is the base $\|\mathbf{a}\|$ times the height $\|\mathbf{b}\|\sin\theta$, and that area is the length of $\mathbf{a}\times\mathbf{b}$. The cross product points straight out of the tile.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <polygon points="40,150 190,150 255,75 105,75" fill="#8fb8f0" stroke="none"/>
  <line x1="40" y1="150" x2="190" y2="150" stroke="#1f2a44" stroke-width="2.5"/>
  <polygon points="198,150 186,145 186,155" fill="#1f2a44"/>
  <line x1="40" y1="150" x2="105" y2="75" stroke="#1f2a44" stroke-width="2.5"/>
  <polygon points="110,69 99,74 107,81" fill="#1f2a44"/>
  <line x1="105" y1="75" x2="105" y2="150" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <path d="M68,150 A28,28 0 0,0 58.34,128.84" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <g font-size="13" fill="#1f2a44">
    <text x="118" y="170">a</text><text x="58" y="100">b</text>
    <text x="74" y="143" fill="#b4232c">θ</text>
    <text x="110" y="120" font-size="11">|b| sin θ</text>
  </g>
  <circle cx="175" cy="112" r="9" fill="#fff" stroke="#b4232c" stroke-width="2"/>
  <circle cx="175" cy="112" r="2.5" fill="#b4232c"/>
  <g font-size="12" fill="#1f2a44">
    <text x="262" y="100">a × b points</text>
    <text x="262" y="116">out of the page</text>
    <text x="262" y="140">length = area</text>
  </g>
</svg>
```

The dot in a circle is the usual symbol for an arrow coming toward you, like the tip of a dart.
:::

::: context anti-word Order matters here
"Commutative" means order does not matter, as in $3 \times 4 = 4 \times 3$. "Anti" means the opposite happens in a precise way: swapping the order flips the sign. Try it: $\hat{\mathbf{x}}\times\hat{\mathbf{y}} = \hat{\mathbf{z}}$, but $\hat{\mathbf{y}}\times\hat{\mathbf{x}} = -\hat{\mathbf{z}}$. A torque computed as $\mathbf{F}\times\mathbf{r}$ instead of $\mathbf{r}\times\mathbf{F}$ turns the bolt the wrong way.
:::

::: context orbit-h Why orbits care about h
With only gravity from Earth's center acting, the vector $\mathbf{h}$ never changes. Its direction fixes the orbit's plane for good, and its size fixes the orbit's shape together with its energy. The "specific" in the name means "per kilogram of spacecraft", which is why the units are $\mathrm{km^2/s}$ and not $\mathrm{kg\,km^2/s}$. The two-body module uses $\mathbf{h}$ as its starting point.
:::

::: context matrix-layout A pattern you can draw from memory
The diagonal is zero. Each component of $\mathbf{a}$ appears twice, once with each sign, in the two spots that do not use its number as a row or a column. For the sign, read row, column and component together. When they run forward around the circle $1 \to 2 \to 3 \to 1$ — row 1, column 2, $a_3$ — the entry gets a minus. When they run backward — row 2, column 1, $a_3$ — it gets a plus.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g fill="#fff" stroke="#1f2a44" stroke-width="1.5">
    <rect x="100" y="15" width="50" height="40"/><rect x="150" y="15" width="50" height="40"/><rect x="200" y="15" width="50" height="40"/>
    <rect x="100" y="55" width="50" height="40"/><rect x="150" y="55" width="50" height="40"/><rect x="200" y="55" width="50" height="40"/>
    <rect x="100" y="95" width="50" height="40"/><rect x="150" y="95" width="50" height="40"/><rect x="200" y="95" width="50" height="40"/>
  </g>
  <g font-size="15" text-anchor="middle">
    <text x="125" y="40" fill="#6c7a93">0</text><text x="175" y="40" fill="#b4232c">−a3</text><text x="225" y="40" fill="#1d6fd1">+a2</text>
    <text x="125" y="80" fill="#1d6fd1">+a3</text><text x="175" y="80" fill="#6c7a93">0</text><text x="225" y="80" fill="#b4232c">−a1</text>
    <text x="125" y="120" fill="#b4232c">−a2</text><text x="175" y="120" fill="#1d6fd1">+a1</text><text x="225" y="120" fill="#6c7a93">0</text>
  </g>
  <text x="300" y="60" font-size="12" fill="#1d6fd1">plus</text>
  <text x="300" y="80" font-size="12" fill="#b4232c">minus</text>
</svg>
```

Blue plus signs sit below the diagonal in rows 2 and 3, and in the top-right corner.
:::

::: context skew-word Why "skew"
"Skew" means slanted or turned aside, as in "askew". A symmetric matrix is a mirror image of itself across the diagonal. A skew-symmetric one is a mirror image with every sign flipped. Some books call it **antisymmetric**. The name fits the behavior: a skew-symmetric matrix always pushes a vector sideways, never along itself.
:::

::: context only-in-3d Why three is special
An $n \times n$ skew-symmetric matrix has $n(n-1)/2$ free entries. For $n = 2$ that is $1$: a flat turn has one number, its angle rate. For $n = 3$ it is $3$, the same as the number of components in a vector. For $n = 4$ it is $6$, which is more than $4$. So only in three dimensions can every skew-symmetric matrix be written as "cross with some vector". That is why the vector-in, vector-out cross product of this lesson belongs to three dimensions.
:::

::: context lie-bracket Named after Sophus Lie
Sophus Lie was a Norwegian mathematician of the 1800s who studied continuous families of transformations, such as all rotations. The group of rotations is written $SO(3)$ in capitals. The skew-symmetric matrices, which describe *rates* of rotation, are written $\mathfrak{so}(3)$ in small curly letters. The bracket tells you how two small turns about different axes fail to commute — the same failure you saw in Lesson 7 when yaw-then-pitch differed from pitch-then-yaw.
:::

::: context error-state The filter's three error numbers
A **Kalman filter** is the algorithm that blends a prediction with noisy sensor readings to estimate a state. For attitude, the filter does not estimate all nine entries of $\mathbf{R}$. It keeps its best guess as a full rotation and estimates only the small error vector $\boldsymbol{\delta\theta}$ — three numbers. After each correction, it folds $\boldsymbol{\delta\theta}$ into the guess and resets it to zero. The estimation modules build this in detail.
:::

::: context rodrigues Who Rodrigues was
Olinde Rodrigues was a French mathematician. He published this way of composing and describing rotations in 1840, long before anyone steered a spacecraft. His formula is still one of the standard ways flight software turns an axis and an angle into a rotation matrix.
:::

::: context quaternion-bridge Four numbers instead of nine
A rotation matrix stores nine numbers but has only three degrees of freedom, so six constraints must stay true: three unit-length columns and three perpendicular pairs. A **quaternion** stores four numbers with one constraint: its length must be $1$. Keeping one constraint true is far easier than keeping six, which is one reason spacecraft attitude software usually works in quaternions.
:::

::: context euler-drift Why Euler's step drifts outward
Each Euler step moves the tip of a vector along the tangent line instead of the circle. The tangent always leaves the circle on the outside, so every step makes the vector a little longer.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <circle cx="110" cy="110" r="80" fill="none" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="110" y1="110" x2="190" y2="110" stroke="#1f2a44" stroke-width="2.5"/>
  <line x1="190" y1="110" x2="190" y2="70" stroke="#b4232c" stroke-width="2.5"/>
  <line x1="110" y1="110" x2="190" y2="70" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4 3"/>
  <path d="M190,110 A80,80 0 0,0 180.21,71.65" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <circle cx="180.21" cy="71.65" r="3.5" fill="#1d6fd1"/>
  <circle cx="190" cy="70" r="3.5" fill="#b4232c"/>
  <text x="140" y="126" font-size="12" fill="#1f2a44">v</text>
  <g font-size="12">
    <text x="210" y="60" fill="#b4232c">Euler step: along</text>
    <text x="210" y="76" fill="#b4232c">the tangent, too long</text>
    <text x="210" y="110" fill="#1d6fd1">exact turn: stays</text>
    <text x="210" y="126" fill="#1d6fd1">on the circle</text>
  </g>
</svg>
```

The drawing uses a turn of $0.5$ rad so you can see the gap; the step then comes out $\sqrt{1 + 0.5^2} \approx 1.118$ times too long. At the example's $0.03$ rad the excess is $1.00045$ per step.
:::
