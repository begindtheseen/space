---
id: l05-the-determinant
title: The determinant and what it measures
minutes: 18
covers:
  - determinant and its geometric meaning
---

The determinant compresses a square matrix into a single number, and for a long time students have been taught to compute that number without being told what it is. Here is what it is: the factor by which the matrix scales volume, with a sign that records whether the matrix turns space inside out. Everything else about the determinant — that it vanishes exactly for singular matrices, that it multiplies under composition, that it falls out of elimination for free — follows from that one geometric fact.

A GNC engineer meets the determinant in three places. First, as a test: a rotation matrix must have determinant $+1$, and a value of $-1$ means a reflection has crept into an attitude chain, while $1.001$ means a column has been stretched by round-off or a bug. Second, as a volume: the determinant of a covariance matrix measures the volume of the uncertainty ellipsoid, so a filter whose covariance determinant is shrinking is learning. Third, as a Jacobian: when you change variables — Cartesian to spherical, inertial to rotating — the determinant of the Jacobian matrix says how densities and volumes transform.

This lesson builds the determinant from area in the plane, states the three rules that define it in any dimension, derives the working properties from those rules, and connects the result to elimination and to the audit of a rotation matrix.

## Area in the plane

Take two vectors $\mathbf{u} = (a, c)^T$ and $\mathbf{v} = (b, d)^T$ and the parallelogram they span, with $\mathbf{u}$ and $\mathbf{v}$ as adjacent sides. Its area is base times height, $\|\mathbf{u}\|\,\|\mathbf{v}\|\sin\theta$, where $\theta$ is the angle between them. Square it and use $\sin^2\theta = 1 - \cos^2\theta$ together with the dot-product formula for $\cos\theta$:

$$
\text{area}^2 = \|\mathbf{u}\|^2\|\mathbf{v}\|^2 - (\mathbf{u}\cdot\mathbf{v})^2 = (a^2 + c^2)(b^2 + d^2) - (ab + cd)^2 .
$$

Expand: the first product is $a^2b^2 + a^2d^2 + c^2b^2 + c^2d^2$ and the second is $a^2b^2 + 2abcd + c^2d^2$. The difference is $a^2d^2 - 2abcd + b^2c^2 = (ad - bc)^2$. So

$$
\text{area} = |ad - bc| .
$$

The quantity inside the absolute value is the **determinant** of the $2 \times 2$ matrix with $\mathbf{u}$ and $\mathbf{v}$ as its columns:

$$
\det\begin{pmatrix} a & b \\ c & d \end{pmatrix} = \begin{vmatrix} a & b \\ c & d \end{vmatrix} = ad - bc .
$$

The sign carries information too. If turning from $\mathbf{u}$ to $\mathbf{v}$ through the smaller angle goes anticlockwise, as from $\mathbf{e}_1$ to $\mathbf{e}_2$, the determinant is positive; if clockwise, negative. Swap the two columns and the sign flips. For $\mathbf{u} = (3, 1)^T$ and $\mathbf{v} = (1, 2)^T$: $ad - bc = 3 \times 2 - 1 \times 1 = 5$. Check against the geometry: $\|\mathbf{u}\|^2\|\mathbf{v}\|^2 - (\mathbf{u}\cdot\mathbf{v})^2 = 10 \times 5 - 25 = 25$, so the area is $5$, and the turn from $(3, 1)$ to $(1, 2)$ is anticlockwise, so the sign is positive.

Now read the matrix as a map. The unit square is spanned by $\mathbf{e}_1$ and $\mathbf{e}_2$, and the matrix sends those to its columns $\mathbf{u}$ and $\mathbf{v}$. So the map takes a square of area 1 to a parallelogram of area $|\det|$, and because the map is linear it does the same to every small square everywhere: the determinant is the factor by which the map scales area. A negative determinant means the map also reverses orientation — it is a mirror image combined with a stretch.

## The three rules that define the determinant

In $n$ dimensions the determinant is the signed volume of the parallelepiped spanned by the columns — the image of the unit cube. Rather than write a formula, it is cleaner to state the three properties that any signed-volume function must have, because every computational fact follows from them, and because the same three properties are what make the determinant well defined in any dimension.

1. **Normalisation.** $\det\mathbf{I} = 1$. The unit cube has volume 1.
2. **Sign change on swap.** Exchanging two rows (or two columns) multiplies the determinant by $-1$. Exchanging two edges of the parallelepiped reverses its orientation.
3. **Linearity in each row.** With all other rows held fixed, $\det$ is a linear function of any one row: scaling that row by $c$ scales the determinant by $c$, and if a row is a sum of two vectors, the determinant is the sum of the two determinants. Stretching one edge stretches the volume in proportion; volume adds when you split an edge.

These rules pin the determinant down completely, and they are stated for rows because elimination works on rows; the same rules hold for columns because $\det\mathbf{A}^T = \det\mathbf{A}$, which is shown below.

### Consequences

**Two equal rows give zero.** Swapping them changes nothing but must flip the sign, so $\det = -\det$, hence $\det = 0$. Geometrically, two identical edges leave a flat parallelepiped with no volume.

**Adding a multiple of one row to another leaves the determinant unchanged.** By linearity in the modified row, $\det(\text{row } i + c\,\text{row } j) = \det(\text{row } i) + c\,\det(\text{row } j \text{ in position } i)$, and the second term has two equal rows, so it is zero. This is the step elimination performs, and it means elimination does not change the determinant except when it swaps rows.

**A row of zeros gives zero.** Scaling that row by $0$ multiplies the determinant by $0$ and leaves the matrix unchanged.

**A triangular matrix has determinant equal to the product of its diagonal.** If every diagonal entry is nonzero, subtracting multiples of rows clears everything off the diagonal without changing the determinant, leaving a diagonal matrix; factor each diagonal entry out by linearity to reach $\det\mathbf{I} = 1$. If some diagonal entry is zero, the rows above and including it are dependent in a way that elimination turns into a row of zeros, so the determinant is $0$, which is again the product of the diagonal.

**Scaling the whole matrix.** $\det(c\mathbf{A}) = c^n\det\mathbf{A}$, one factor of $c$ per row. Doubling every edge of a cube multiplies its volume by $2^n$, not $2$.

### The determinant from elimination

Put these together with the previous two lessons. Elimination with partial pivoting reduces $\mathbf{A}$ to the upper-triangular $\mathbf{U}$ using row additions, which leave the determinant alone, and $s$ row swaps, each of which flips its sign. Therefore

$$
\det\mathbf{A} = (-1)^s\,\prod_{i=1}^{n} U_{ii} ,
$$

the signed product of the pivots. This is how every numerical library computes a determinant, at the same $\tfrac{2}{3}n^3$ cost as a solve. For the matrix factored in the LU lesson, the pivots were $2$, $-3$ and $4$ with no swaps, so $\det\mathbf{A} = -24$.

The same formula proves the fact you have been promised twice: **a matrix is singular exactly when its determinant is zero.** Elimination on a singular matrix reaches a column with no available pivot, so some $U_{ii} = 0$ and the product vanishes. On a nonsingular matrix every pivot is nonzero and so is the product. Combined with the previous lesson, $\det\mathbf{A} = 0$, rank less than $n$, dependent columns, a nontrivial null space and the absence of an inverse are five descriptions of one condition — and geometrically that condition is a map that flattens the unit cube into something of zero volume.

::: example A determinant with a row swap
Compute $\det\mathbf{B}$ for

$$
\mathbf{B} = \begin{pmatrix} 0 & 2 & 1 \\ 3 & 1 & 2 \\ 1 & 4 & 1 \end{pmatrix}.
$$

The first pivot position holds a zero, so swap rows 1 and 2 ($s = 1$):

$$
\begin{pmatrix} 3 & 1 & 2 \\ 0 & 2 & 1 \\ 1 & 4 & 1 \end{pmatrix}.
$$

Column 1: row 2 already has a zero; the multiplier for row 3 is $1/3$, and row 3 becomes $(1, 4, 1) - \tfrac{1}{3}(3, 1, 2) = (0, \tfrac{11}{3}, \tfrac{1}{3})$. Column 2: pivot $2$, multiplier $\tfrac{11}{3} / 2 = \tfrac{11}{6}$, and row 3 becomes $(0, \tfrac{11}{3}, \tfrac{1}{3}) - \tfrac{11}{6}(0, 2, 1) = (0, 0, \tfrac{1}{3} - \tfrac{11}{6}) = (0, 0, -\tfrac{3}{2})$.

The pivots are $3$, $2$ and $-\tfrac{3}{2}$, with one swap:

$$
\det\mathbf{B} = (-1)^1 \times 3 \times 2 \times \left(-\tfrac{3}{2}\right) = 9 .
$$

Cross-check by the cofactor formula given below: $0\,(1 \cdot 1 - 2 \cdot 4) - 2\,(3 \cdot 1 - 2 \cdot 1) + 1\,(3 \cdot 4 - 1 \cdot 1) = 0 - 2 + 11 = 9$. The map $\mathbf{B}$ takes the unit cube to a parallelepiped of volume 9, preserving orientation.
:::

### The product rule and the transpose

The determinant of a product is the product of the determinants:

$$
\det(\mathbf{A}\mathbf{B}) = \det\mathbf{A}\,\det\mathbf{B} .
$$

Geometrically this is immediate: $\mathbf{B}$ scales every volume by $\det\mathbf{B}$, then $\mathbf{A}$ scales the result by $\det\mathbf{A}$, so the composition scales by the product, and orientation reverses if exactly one of them reverses it, which the signs handle. (For a proof from the rules alone, fix $\mathbf{B}$ nonsingular and check that $\mathbf{A} \mapsto \det(\mathbf{A}\mathbf{B})/\det\mathbf{B}$ satisfies all three rules, so it must equal $\det\mathbf{A}$; if $\mathbf{B}$ is singular both sides are zero because $\mathbf{A}\mathbf{B}$ then has a nontrivial null space.) Two consequences: $\det(\mathbf{A}^{-1}) = 1/\det\mathbf{A}$, since $\det(\mathbf{A}\mathbf{A}^{-1}) = \det\mathbf{I} = 1$; and $\det(\mathbf{P}\mathbf{A}\mathbf{P}^{-1}) = \det\mathbf{A}$ for any invertible $\mathbf{P}$, so the determinant does not depend on the basis the matrix is written in — a change of frame does not change a volume.

For the transpose, take the pivoted factorisation $\mathbf{P}\mathbf{A} = \mathbf{L}\mathbf{U}$. Transposing gives $\mathbf{A}^T\mathbf{P}^T = \mathbf{U}^T\mathbf{L}^T$. Both $\mathbf{U}^T$ and $\mathbf{L}^T$ are triangular with the same diagonals as $\mathbf{U}$ and $\mathbf{L}$, so $\det(\mathbf{U}^T\mathbf{L}^T) = \det\mathbf{U}\det\mathbf{L} = \det(\mathbf{L}\mathbf{U})$; and a permutation matrix has $\det\mathbf{P}^T = \det\mathbf{P} = \pm 1$, since $\mathbf{P}^T = \mathbf{P}^{-1}$ for a permutation. Cancelling the signs, $\det\mathbf{A}^T = \det\mathbf{A}$. The three rules therefore hold for columns as well as rows, which is what justified reading the columns as the edges of the parallelepiped.

### The cofactor formula

For hand computation on a $3 \times 3$ matrix, the determinant expands along the first row:

$$
\begin{vmatrix} a & b & c \\ d & e & f \\ g & h & i \end{vmatrix} = a\,(ei - fh) - b\,(di - fg) + c\,(dh - eg) .
$$

Each entry of the top row multiplies the $2 \times 2$ determinant of what remains when its row and column are deleted, with alternating signs. This follows from linearity in the first row — split $(a, b, c)$ into $a\mathbf{e}_1^T + b\mathbf{e}_2^T + c\mathbf{e}_3^T$ — and the swap rule for the signs. The same pattern works along any row or column, and it extends to $n \times n$, but the number of terms grows as $n!$: about $3.6 \times 10^6$ for $n = 10$ against $670$ operations for elimination. Use cofactors for $3 \times 3$ matrices by hand and pivots for everything else. For the LU-lesson matrix, $2\,((-1)(9) - (4)(-10)) - 1\,((4)(9) - (4)(-2)) + 1\,((4)(-10) - (-1)(-2)) = 2 \times 31 - 44 - 42 = -24$, in agreement with the pivots.

::: key The determinant
$\det\mathbf{A}$ is the signed factor by which the map $\mathbf{A}$ scales volume. $\det\mathbf{A} = 0$ means the map collapses a dimension — the matrix is singular; $\det\mathbf{A} < 0$ means the map also mirrors. Computed as $(-1)^s\prod_i U_{ii}$ from pivoted elimination. $\det(\mathbf{A}\mathbf{B}) = \det\mathbf{A}\,\det\mathbf{B}$, $\det\mathbf{A}^T = \det\mathbf{A}$, $\det\mathbf{A}^{-1} = 1/\det\mathbf{A}$, $\det(c\mathbf{A}) = c^n\det\mathbf{A}$.
:::

## Volume, orientation and the rotation audit

Every $3 \times 3$ matrix sends the unit cube to the parallelepiped spanned by its columns, whose signed volume is the determinant. Three cases matter on a vehicle.

**A rotation preserves volume and handedness**, so its determinant is $+1$. For a rotation by $30°$ about the $z$-axis,

$$
\mathbf{R} = \begin{pmatrix} 0.8660 & -0.5 & 0 \\ 0.5 & 0.8660 & 0 \\ 0 & 0 & 1 \end{pmatrix}, \qquad \det\mathbf{R} = 1\,(0.8660^2 + 0.5^2) = 1 .
$$

The same holds for any rotation: it preserves lengths and angles, so it preserves the volume of the unit cube, and it can be reached continuously from the identity, so it cannot flip the sign.

**A reflection also preserves volume but reverses handedness**: determinant $-1$. The matrix $\operatorname{diag}(1, 1, -1)$ mirrors the $z$-axis, and $\det = -1$. Multiply the rotation above by it and the determinant of the product is $1 \times (-1) = -1$. Such a matrix satisfies $\mathbf{R}^T\mathbf{R} = \mathbf{I}$ just as a rotation does — its columns are still orthonormal — so orthonormality alone does not certify a rotation. A left-handed sensor frame, or one axis defined with the wrong sign, produces exactly this, and only the determinant catches it.

**A stretched column changes the volume.** Scale one column of the rotation above by $1.001$ — the kind of drift a poorly normalised attitude integration produces — and by linearity in that column the determinant becomes $1.001$. The audit in this module's rotation-matrix exercise checks $\mathbf{R}^T\mathbf{R} = \mathbf{I}$ and $\det\mathbf{R} = +1$ together: the first catches loss of orthonormality, the second catches reflections, and neither alone is sufficient.

::: example Volume of a state-uncertainty box
An estimator's position error is known to lie in the unit cube $[0, 1]^3$ in some scaled units, and a linear map

$$
\mathbf{M} = \begin{pmatrix} 2 & 1 & 0 \\ 0 & 3 & 0 \\ 0 & 0 & 0.5 \end{pmatrix}
$$

carries that error into a new set of coordinates. $\mathbf{M}$ is triangular, so $\det\mathbf{M} = 2 \times 3 \times 0.5 = 3$: the unit cube becomes a parallelepiped of volume 3. The map stretches the first coordinate by 2, the second by 3, shears the first by the second, and squeezes the third by half; the shear contributes nothing to the volume, exactly as adding a multiple of one column to another leaves the determinant alone. Had $\mathbf{M}$ been the state-transition matrix of a coasting vehicle, $\begin{pmatrix} 1 & \Delta t \\ 0 & 1 \end{pmatrix}$, the determinant would be $1$: free coast is a pure shear of phase space, and it preserves phase-space volume. That is Liouville's theorem, and it is why a covariance propagated through coast changes shape but not determinant until process noise is added.
:::

::: example Volume spanned by three vectors
The three vectors $(1, 0, 2)^T$, $(2, 1, 0)^T$ and $(0, 3, 1)^T$ span a parallelepiped. Placing them as columns,

$$
\det\begin{pmatrix} 1 & 2 & 0 \\ 0 & 1 & 3 \\ 2 & 0 & 1 \end{pmatrix} = 1\,(1 \cdot 1 - 3 \cdot 0) - 2\,(0 \cdot 1 - 3 \cdot 2) + 0 = 1 + 12 = 13 .
$$

The volume is 13, the orientation is right-handed, and — since $13 \ne 0$ — the three vectors are linearly independent and form a basis of $\mathbb{R}^3$. Multiplying this matrix by the LU-lesson matrix with determinant $-24$ gives a product with determinant $13 \times (-24) = -312$: a map that scales volume by 312 and reverses orientation.
:::

::: note The determinant and the cross product
The scalar $\det[\mathbf{a}\ \mathbf{b}\ \mathbf{c}]$ with three vectors as columns equals $\mathbf{a}\cdot(\mathbf{b}\times\mathbf{c})$, the scalar triple product, once the cross product is defined in the final lesson of this module. The determinant is the volume of the box the three vectors span; the cross product $\mathbf{b}\times\mathbf{c}$ is the area vector of its base; dotting with $\mathbf{a}$ multiplies by the height.
:::

::: warning Determinants are not a measure of "nearly singular"
$\det(0.1\,\mathbf{I}_3) = 0.001$, yet $0.1\,\mathbf{I}_3$ is perfectly invertible and perfectly conditioned. A tiny determinant may mean only that the matrix has small entries; a determinant near $1$ can hide two nearly parallel columns if a third is long. The determinant answers "singular or not?" in exact arithmetic; the question "how close to singular?" belongs to the condition number and the singular values of Linear Algebra II.
:::

::: warning Cofactor expansion in code
Expanding cofactors recursively costs $n!$ operations and is numerically worse than elimination even for $n = 4$. `numpy.linalg.det` uses the pivots of an LU factorisation; do the same.
:::

## Check yourself

::: check
Compute $\det\begin{pmatrix} 2 & 5 \\ 4 & 7 \end{pmatrix}$, and describe geometrically what the matrix does to the unit square.
:::

::: answer
$2 \times 7 - 5 \times 4 = 14 - 20 = -6$. The unit square becomes a parallelogram of area 6 with its orientation reversed: going from the image of $\mathbf{e}_1$, which is $(2, 4)^T$, to the image of $\mathbf{e}_2$, which is $(5, 7)^T$, is a clockwise turn.
:::

::: check
Elimination on a $4 \times 4$ matrix produced pivots $2$, $-1$, $3$ and $0.5$ after two row swaps. What is the determinant, and what is the determinant of the inverse?
:::

::: answer
Product of pivots $2 \times (-1) \times 3 \times 0.5 = -3$; two swaps contribute $(-1)^2 = 1$, so $\det\mathbf{A} = -3$. The inverse has $\det\mathbf{A}^{-1} = 1/(-3) = -0.333$.
:::

::: check
A matrix $\mathbf{Q}$ satisfies $\mathbf{Q}^T\mathbf{Q} = \mathbf{I}$. Show that $\det\mathbf{Q} = \pm 1$, and explain which sign a rotation has.
:::

::: answer
Take determinants of both sides: $\det(\mathbf{Q}^T\mathbf{Q}) = \det\mathbf{Q}^T\det\mathbf{Q} = (\det\mathbf{Q})^2 = \det\mathbf{I} = 1$, so $\det\mathbf{Q} = \pm 1$. A matrix with orthonormal columns preserves the volume of the unit cube; it either preserves handedness ($+1$, a rotation) or reverses it ($-1$, a reflection or a rotation combined with a reflection). A rotation is $+1$ because it can be reached from the identity by a continuous motion during which the determinant, which is continuous and never zero, cannot jump from $1$ to $-1$.
:::

::: check
Without computing, explain why $\det\begin{pmatrix} 1 & 2 & 3 \\ 2 & 4 & 6 \\ 1 & 0 & 1 \end{pmatrix} = 0$, and describe the image of the unit cube.
:::

::: answer
Row 2 is twice row 1, so subtracting $2$ times row 1 from row 2 — which leaves the determinant unchanged — produces a row of zeros, and the determinant is $0$. The rows are dependent, so the rank is at most 2 and the map squashes the unit cube onto a flat parallelogram (a region of zero volume) in the plane spanned by the columns. The matrix is singular and has a nontrivial null space.
:::

::: check
$\det\mathbf{A} = 5$ for a $3 \times 3$ matrix. What are $\det(2\mathbf{A})$, $\det(\mathbf{A}^2)$ and $\det(\mathbf{A}^T\mathbf{A})$?
:::

::: answer
$\det(2\mathbf{A}) = 2^3 \times 5 = 40$, one factor of $2$ per row. $\det(\mathbf{A}^2) = \det\mathbf{A}\det\mathbf{A} = 25$. $\det(\mathbf{A}^T\mathbf{A}) = \det\mathbf{A}^T\det\mathbf{A} = 25$ as well, since the transpose has the same determinant. Note that $\mathbf{A}^T\mathbf{A}$ has a positive determinant whatever the sign of $\det\mathbf{A}$, which is one symptom of the squaring that the QR lesson warns about.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\det\begin{pmatrix} a & b \\ c & d \end{pmatrix} = ad - bc$ | Signed area of the parallelogram spanned by the columns |
| $\det\mathbf{A}$ | Signed factor by which $\mathbf{A}$ scales volume |
| $\det\mathbf{I} = 1$; swap flips sign; linear in each row | The three defining rules |
| $\det\mathbf{A} = (-1)^s\prod_i U_{ii}$ | Computed from the pivots of elimination, $s$ swaps |
| $\det\mathbf{A} = 0 \iff \mathbf{A}$ singular | The map collapses a dimension |
| $\det\mathbf{A} < 0$ | The map reverses orientation (mirrors) |
| $\det(\mathbf{A}\mathbf{B}) = \det\mathbf{A}\,\det\mathbf{B}$ | Volume factors multiply under composition |
| $\det\mathbf{A}^T = \det\mathbf{A}$, $\det\mathbf{A}^{-1} = 1/\det\mathbf{A}$, $\det(c\mathbf{A}) = c^n\det\mathbf{A}$ | Working identities |
| $a(ei - fh) - b(di - fg) + c(dh - eg)$ | Cofactor expansion of a $3 \times 3$ determinant |
| $\det\mathbf{R} = +1$, reflection $-1$ | Rotation audit, together with $\mathbf{R}^T\mathbf{R} = \mathbf{I}$ |

The next lesson turns to matrices whose columns are perpendicular unit vectors — the ones with $\mathbf{Q}^T\mathbf{Q} = \mathbf{I}$ and determinant $\pm 1$ — and to the procedure that manufactures such columns from any independent set: Gram–Schmidt, which packaged as a factorisation is QR.
