---
id: l05-the-determinant
title: The determinant and what it measures
minutes: 22
covers:
  - determinant and its geometric meaning
---

Put a photo on a copier and set the zoom to $200\%$. Every length doubles, and the picture covers four times the paper. Set the copier to flip the image, and the picture comes out as its mirror image, the same size. A matrix does both kinds of thing to space: it stretches or squeezes, and it may flip. The **determinant** is one number that records both. Its size is the factor by which the map scales area (in 2D) or volume (in 3D). Its sign says whether the map turns space into its mirror image.

For a long time students were taught to compute that number without being told what it is. Here you get the meaning first. Everything else about the determinant follows from it: that it is zero exactly for singular matrices, that it multiplies when you chain maps, and that elimination hands it to you for free.

A GNC engineer meets the determinant in three places.

- **As a test.** A rotation matrix must have determinant $+1$. A value of $-1$ means a mirror has crept into an **[[attitude chain|attitude-chain]]**. A value of $1.001$ means a column has been stretched by round-off or a bug.
- **As a volume.** The determinant of a covariance matrix measures the volume of the **[[uncertainty ellipsoid|uncertainty-ellipsoid]]**. A filter whose covariance determinant is shrinking is learning.
- **As a [[Jacobian|jacobian-word]].** When you change variables — flat coordinates to spherical, a still frame to a rotating one — the determinant of the Jacobian matrix says how small volumes, and so densities, change.

## Area in the plane

Start with two arrows, $\mathbf{u} = (a, c)^T$ and $\mathbf{v} = (b, d)^T$, and the parallelogram that has them as two neighboring sides. Its area is base times height, $\|\mathbf{u}\|\,\|\mathbf{v}\|\sin\theta$, where $\theta$ ("theta") is the angle between them and $\|\mathbf{u}\|$ is the length of $\mathbf{u}$.

Getting rid of the sine takes three steps.

1. Square the area: $\text{area}^2 = \|\mathbf{u}\|^2\|\mathbf{v}\|^2\sin^2\theta$.
2. Use $\sin^2\theta = 1 - \cos^2\theta$: $\text{area}^2 = \|\mathbf{u}\|^2\|\mathbf{v}\|^2 - \|\mathbf{u}\|^2\|\mathbf{v}\|^2\cos^2\theta$.
3. The dot-product formula says $\|\mathbf{u}\|\,\|\mathbf{v}\|\cos\theta = \mathbf{u}\cdot\mathbf{v}$. So the second term is $(\mathbf{u}\cdot\mathbf{v})^2$:

$$
\text{area}^2 = \|\mathbf{u}\|^2\|\mathbf{v}\|^2 - (\mathbf{u}\cdot\mathbf{v})^2 = (a^2 + c^2)(b^2 + d^2) - (ab + cd)^2 .
$$

Now multiply out. The first product is $a^2b^2 + a^2d^2 + c^2b^2 + c^2d^2$. The second is $a^2b^2 + 2abcd + c^2d^2$. Subtracting, the $a^2b^2$ and $c^2d^2$ cancel and leave $a^2d^2 - 2abcd + b^2c^2$, which is $(ad - bc)^2$. Take the square root:

$$
\text{area} = |ad - bc| .
$$

The number inside the absolute-value bars is the **determinant** of the $2 \times 2$ matrix with $\mathbf{u}$ and $\mathbf{v}$ as its columns:

$$
\det\begin{pmatrix} a & b \\ c & d \end{pmatrix} = \begin{vmatrix} a & b \\ c & d \end{vmatrix} = ad - bc .
$$

The straight bars are a second way to write "det". Remember it as "down-diagonal product minus up-diagonal product".

### The sign

The sign carries information too. If turning from $\mathbf{u}$ to $\mathbf{v}$ the short way round goes **counterclockwise**, as from $\mathbf{e}_1$ to $\mathbf{e}_2$, the determinant is positive. If it goes clockwise, the determinant is negative. Swap the two columns and the sign flips.

Try it on $\mathbf{u} = (3, 1)^T$ and $\mathbf{v} = (1, 2)^T$: $ad - bc = 3 \times 2 - 1 \times 1 = 5$. Check against the geometry: $\|\mathbf{u}\|^2\|\mathbf{v}\|^2 - (\mathbf{u}\cdot\mathbf{v})^2 = 10 \times 5 - 5^2 = 25$, so the **[[area is 5|area-picture]]**. The turn from $(3, 1)$ to $(1, 2)$ is counterclockwise, so the sign is positive. Both agree.

### The matrix as a map

Now read the matrix as a machine that moves points. The unit square has sides $\mathbf{e}_1$ and $\mathbf{e}_2$, and the matrix sends those to its columns $\mathbf{u}$ and $\mathbf{v}$. So the map turns a square of area 1 into a parallelogram of area $|\det|$. Because the map is linear, it does the same to every small square everywhere. So **the determinant is the factor by which the map scales area**. A negative determinant means the map also reverses orientation: it is a mirror image combined with a stretch.

## The three rules that define the determinant

In $n$ dimensions the determinant is the signed volume of the box spanned by the columns — the image of the unit cube. That box has a name: a **parallelepiped** ("parallel-EP-iped"), a squashed box whose faces are parallelograms.

Instead of a formula, it is cleaner to list three properties that any signed volume must have. Every computing fact follows from them, and they make sense in any number of dimensions.

1. **Normalization.** $\det\mathbf{I} = 1$. The unit cube has volume 1.
2. **Sign change on swap.** Swapping two rows (or two columns) multiplies the determinant by $-1$. Swapping two edges of the box reverses its orientation.
3. **Linearity in each row.** Hold all the other rows fixed. Then the determinant is a linear function of any one row. Scaling that row by $c$ scales the determinant by $c$. If the row is a sum of two vectors, the determinant is the sum of the two determinants. Think of it as: stretch one edge and the volume stretches in proportion; cut an edge in two and the volume splits in two.

These rules pin the determinant down completely. They are stated for rows because elimination works on rows. The same rules hold for columns, because $\det\mathbf{A}^T = \det\mathbf{A}$, shown below.

### Consequences

**Two equal rows give zero.** Swapping them changes nothing, but rule 2 says it must flip the sign. So $\det = -\det$, and the only number equal to its own negative is $0$. In pictures: two identical edges make a flat box with no volume.

**Adding a multiple of one row to another leaves the determinant unchanged.** By linearity in the changed row, $\det(\text{row } i + c\,\text{row } j) = \det(\text{row } i) + c\,\det(\text{row } j \text{ in position } i)$. The second determinant has two equal rows, so it is zero. This is exactly the step elimination performs. So **elimination does not change the determinant, except when it swaps rows**. In pictures, this step is a **[[shear|shear-cards]]**, which slides the box without changing its volume.

**A row of zeros gives zero.** Scaling that row by $0$ multiplies the determinant by $0$, but leaves the matrix the same. So the determinant was $0$ all along.

**A triangular matrix has determinant equal to the product of its diagonal.** If every diagonal entry is nonzero, subtracting multiples of rows clears everything off the diagonal without changing the determinant. That leaves a diagonal matrix. Pull each diagonal entry out using rule 3, and you are left with $\det\mathbf{I} = 1$. If some diagonal entry is zero, look at the rows from that one down. Every one of them has zeros up to and including that column, so they are $n - k + 1$ rows living in only $n - k$ columns (where $k$ is the position of the zero). That many rows in that few columns must be dependent, so elimination can turn one of them into a row of zeros, and the determinant is $0$. That again equals the product of the diagonal.

**Scaling the whole matrix.** $\det(c\mathbf{A}) = c^n\det\mathbf{A}$: one factor of $c$ for each of the $n$ rows. Doubling every edge of a cube multiplies its volume by $2^3 = 8$, not by $2$.

### The determinant from elimination

Put these together with the previous two lessons. Elimination with partial pivoting turns $\mathbf{A}$ into the upper-triangular $\mathbf{U}$ using row additions, which leave the determinant alone, and $s$ row swaps, each of which flips the sign. Therefore

$$
\det\mathbf{A} = (-1)^s\,\prod_{i=1}^{n} U_{ii} ,
$$

the signed product of the pivots. (The capital pi, $\prod$, means "multiply together".) This is how every numerical library computes a determinant, at the same $\tfrac{2}{3}n^3$ cost as a solve. For the matrix factored in the LU lesson, the pivots were $2$, $-3$ and $4$ with no swaps, so $\det\mathbf{A} = 2 \times (-3) \times 4 = -24$.

The same formula proves a fact you have been promised twice: **a matrix is singular exactly when its determinant is zero.** Elimination on a singular matrix reaches a column with no pivot available, so some $U_{ii} = 0$ and the product is zero. On a nonsingular matrix every pivot is nonzero, and so is the product.

Together with the previous lesson, that gives five ways of saying one thing: $\det\mathbf{A} = 0$, rank less than $n$, dependent columns, a null space bigger than $\{\mathbf{0}\}$, and no inverse. In pictures, it is a map that flattens the unit cube into something with zero volume.

::: example A determinant with a row swap
Compute $\det\mathbf{B}$ for

$$
\mathbf{B} = \begin{pmatrix} 0 & 2 & 1 \\ 3 & 1 & 2 \\ 1 & 4 & 1 \end{pmatrix}.
$$

**Swap.** The first pivot position holds a zero, so swap rows 1 and 2. That is one swap, $s = 1$:

$$
\begin{pmatrix} 3 & 1 & 2 \\ 0 & 2 & 1 \\ 1 & 4 & 1 \end{pmatrix}.
$$

**Column 1.** Row 2 already has a zero there. The multiplier for row 3 is $1/3$, and row 3 becomes $(1, 4, 1) - \tfrac{1}{3}(3, 1, 2) = (0, \tfrac{11}{3}, \tfrac{1}{3})$.

**Column 2.** The pivot is $2$ and the multiplier is $\tfrac{11}{3} \div 2 = \tfrac{11}{6}$. Row 3 becomes $(0, \tfrac{11}{3}, \tfrac{1}{3}) - \tfrac{11}{6}(0, 2, 1) = (0, 0, \tfrac{1}{3} - \tfrac{11}{6}) = (0, 0, -\tfrac{3}{2})$.

**Multiply.** The pivots are $3$, $2$ and $-\tfrac{3}{2}$, with one swap:

$$
\det\mathbf{B} = (-1)^1 \times 3 \times 2 \times \left(-\tfrac{3}{2}\right) = 9 .
$$

**Cross-check** with the cofactor formula given below: $0\,(1 \cdot 1 - 2 \cdot 4) - 2\,(3 \cdot 1 - 2 \cdot 1) + 1\,(3 \cdot 4 - 1 \cdot 1) = 0 - 2 + 11 = 9$. The map $\mathbf{B}$ takes the unit cube to a box of volume 9 and keeps its orientation.
:::

### The product rule and the transpose

Do one map, then another. The first scales every volume by its determinant, and the second scales the result by its own. So the combined map scales by the product:

$$
\det(\mathbf{A}\mathbf{B}) = \det\mathbf{A}\,\det\mathbf{B} .
$$

The signs work out too: the result is a mirror image exactly when one of the two maps mirrors.

::: note Why it has to be true, from the rules alone
Fix a nonsingular $\mathbf{B}$ and look at the function $\mathbf{A} \mapsto \det(\mathbf{A}\mathbf{B})/\det\mathbf{B}$. Swapping two rows of $\mathbf{A}$ swaps the same rows of $\mathbf{A}\mathbf{B}$, so it flips sign. Each row of $\mathbf{A}\mathbf{B}$ is that row of $\mathbf{A}$ times $\mathbf{B}$, so the function is linear in each row. At $\mathbf{A} = \mathbf{I}$ it equals $1$. It obeys all three rules, so it must be $\det\mathbf{A}$.

If $\mathbf{B}$ is singular, both sides are zero: $\mathbf{B}$ squashes some $\mathbf{x} \neq \mathbf{0}$ to zero, so $\mathbf{A}\mathbf{B}$ does too, and $\mathbf{A}\mathbf{B}$ is singular.
:::

Two useful facts come straight out. First, $\det(\mathbf{A}^{-1}) = 1/\det\mathbf{A}$, since $\det\mathbf{A}\,\det\mathbf{A}^{-1} = \det(\mathbf{A}\mathbf{A}^{-1}) = \det\mathbf{I} = 1$. Second, $\det(\mathbf{P}\mathbf{A}\mathbf{P}^{-1}) = \det\mathbf{P}\,\det\mathbf{A}\,/\det\mathbf{P} = \det\mathbf{A}$ for any invertible $\mathbf{P}$. So the determinant does not depend on the basis the matrix is written in. A change of frame does not change a volume.

For the transpose, $\det\mathbf{A}^T = \det\mathbf{A}$. So the three rules hold for columns as well as rows, which is what lets you read the columns as the edges of the box.

::: note Why the transpose has the same determinant
Take the pivoted factorization $\mathbf{P}\mathbf{A} = \mathbf{L}\mathbf{U}$ and transpose it: $\mathbf{A}^T\mathbf{P}^T = \mathbf{U}^T\mathbf{L}^T$. Both $\mathbf{U}^T$ and $\mathbf{L}^T$ are triangular, with the same diagonals as $\mathbf{U}$ and $\mathbf{L}$, so $\det(\mathbf{U}^T\mathbf{L}^T) = \det\mathbf{U}\,\det\mathbf{L} = \det(\mathbf{L}\mathbf{U})$. A permutation matrix has $\mathbf{P}^T = \mathbf{P}^{-1}$, so $\det\mathbf{P}^T = \det\mathbf{P} = \pm 1$. Cancel those equal signs from both sides and $\det\mathbf{A}^T = \det\mathbf{A}$.
:::

### The cofactor formula

For a $3 \times 3$ matrix by hand, you can **expand along the first row**:

$$
\begin{vmatrix} a & b & c \\ d & e & f \\ g & h & i \end{vmatrix} = a\,(ei - fh) - b\,(di - fg) + c\,(dh - eg) .
$$

Each entry of the top row multiplies the $2 \times 2$ determinant of what is left when you cross out its row and column. The signs go plus, minus, plus. The formula follows from linearity in the first row — split $(a, b, c)$ into $a\mathbf{e}_1^T + b\mathbf{e}_2^T + c\mathbf{e}_3^T$ — and the swap rule gives the signs.

The same pattern works along any row or column and for any size. But the number of terms grows like $n!$ ("n **[[factorial|factorial-growth]]**", $n \times (n-1) \times \cdots \times 1$): about $3.6 \times 10^6$ for $n = 10$, against about $670$ operations for elimination. Use cofactors for $3 \times 3$ matrices by hand, and pivots for everything else.

For the LU-lesson matrix, $\begin{pmatrix} 2 & 1 & 1 \\ 4 & -1 & 4 \\ -2 & -10 & 9 \end{pmatrix}$:

$$
2\,\big((-1)(9) - (4)(-10)\big) - 1\,\big((4)(9) - (4)(-2)\big) + 1\,\big((4)(-10) - (-1)(-2)\big) = 2 \times 31 - 44 - 42 = -24 ,
$$

which matches the pivots.

::: key The determinant
$\det\mathbf{A}$ is the signed factor by which the map $\mathbf{A}$ scales volume. $\det\mathbf{A} = 0$ means the map collapses a dimension — the matrix is singular; $\det\mathbf{A} < 0$ means the map also mirrors. Computed as $(-1)^s\prod_i U_{ii}$ from pivoted elimination. $\det(\mathbf{A}\mathbf{B}) = \det\mathbf{A}\,\det\mathbf{B}$, $\det\mathbf{A}^T = \det\mathbf{A}$, $\det\mathbf{A}^{-1} = 1/\det\mathbf{A}$, $\det(c\mathbf{A}) = c^n\det\mathbf{A}$.
:::

## Volume, orientation and the rotation audit

Every $3 \times 3$ matrix sends the unit cube to the box spanned by its columns, and the box's signed volume is the determinant. Three cases matter on a vehicle.

**A rotation keeps volume and handedness**, so its determinant is $+1$. For a turn of $30°$ about the $z$-axis, expanding along the bottom row,

$$
\mathbf{R} = \begin{pmatrix} 0.8660 & -0.5 & 0 \\ 0.5 & 0.8660 & 0 \\ 0 & 0 & 1 \end{pmatrix}, \qquad \det\mathbf{R} = 1\,(0.8660^2 + 0.5^2) = 1 .
$$

The same holds for any rotation. It keeps lengths and angles, so it keeps the volume of the unit cube. And it can be reached by turning smoothly from the identity, so [[its determinant can never jump to minus one|no-jump]].

**A reflection keeps volume but reverses handedness**: its determinant is $-1$. The matrix $\operatorname{diag}(1, 1, -1)$ (ones and minus one down the diagonal, zeros elsewhere) mirrors the $z$-axis, and its determinant is $-1$. Multiply the rotation above by it, and the product has determinant $1 \times (-1) = -1$.

Here is the catch. Such a matrix satisfies $\mathbf{R}^T\mathbf{R} = \mathbf{I}$ exactly as a rotation does — its columns are still perpendicular unit vectors. So perpendicular unit columns alone do not prove a matrix is a rotation. A **[[left-handed|handedness]]** sensor frame, or one axis defined with the wrong sign, produces exactly this, and only the determinant catches it.

**A stretched column changes the volume.** Scale one column of the rotation above by $1.001$ — the kind of drift a badly normalized attitude integration produces. By linearity in that column, the determinant becomes $1.001$.

The audit in this module's rotation-matrix exercise checks $\mathbf{R}^T\mathbf{R} = \mathbf{I}$ and $\det\mathbf{R} = +1$ together. The first catches loss of perpendicular unit columns. The second catches reflections. Neither one alone is enough.

::: example Volume of a state-uncertainty box
An estimator's position error is known to lie in the unit cube $[0, 1]^3$, in some scaled units. A linear map

$$
\mathbf{M} = \begin{pmatrix} 2 & 1 & 0 \\ 0 & 3 & 0 \\ 0 & 0 & 0.5 \end{pmatrix}
$$

carries that error into new coordinates. How big is the new region?

**Determinant.** $\mathbf{M}$ is triangular, so multiply the diagonal: $\det\mathbf{M} = 2 \times 3 \times 0.5 = 3$. The unit cube becomes a box of volume 3.

**What each part does.** The map stretches the first coordinate by 2 and the second by 3, squeezes the third by half, and slides the first coordinate along by the second (the $1$ in the top row, a shear). The shear adds nothing to the volume, exactly as adding a multiple of one column to another leaves the determinant alone. Check: $2 \times 3 \times 0.5 = 3$, with no contribution from the $1$.

**A coasting vehicle.** Had $\mathbf{M}$ been the **state-transition matrix** of a vehicle coasting in a straight line, $\begin{pmatrix} 1 & \Delta t \\ 0 & 1 \end{pmatrix}$ (new position = old position plus velocity times $\Delta t$; velocity unchanged), the determinant would be $1 \times 1 - \Delta t \times 0 = 1$. Free coasting is a pure shear of the position–velocity plane, and it keeps area. That is **[[Liouville's theorem|liouville]]**, and it is why a covariance carried through a coast changes shape but not determinant — until random disturbances, called process noise, are added.
:::

::: example Volume spanned by three vectors
The three vectors $(1, 0, 2)^T$, $(2, 1, 0)^T$ and $(0, 3, 1)^T$ span a box. Place them as columns and expand along the top row:

$$
\det\begin{pmatrix} 1 & 2 & 0 \\ 0 & 1 & 3 \\ 2 & 0 & 1 \end{pmatrix} = 1\,(1 \cdot 1 - 3 \cdot 0) - 2\,(0 \cdot 1 - 3 \cdot 2) + 0 = 1 + 12 = 13 .
$$

**Reading the answer.** The volume is 13. The sign is positive, so the three vectors, in that order, are right-handed. And since $13 \ne 0$, the three vectors are linearly independent and form a basis of $\mathbb{R}^3$.

**Chaining.** Multiply this matrix by the LU-lesson matrix, whose determinant is $-24$. The product has determinant $13 \times (-24) = -312$: a map that scales volume by 312 and mirrors.
:::

::: note The determinant and the cross product
With three vectors as columns, $\det[\mathbf{a}\ \mathbf{b}\ \mathbf{c}]$ equals $\mathbf{a}\cdot(\mathbf{b}\times\mathbf{c})$, the **scalar triple product**, once the cross product is defined in the final lesson of this module. The determinant is the volume of the box the three vectors span. The cross product $\mathbf{b}\times\mathbf{c}$ is an arrow whose length is the area of the box's base. Dotting with $\mathbf{a}$ multiplies that area by the height.
:::

::: warning Determinants are not a measure of "nearly singular"
$\det(0.1\,\mathbf{I}_3) = 0.1^3 = 0.001$, yet $0.1\,\mathbf{I}_3$ is perfectly invertible and perfectly behaved. A tiny determinant may mean only that the entries are small. A determinant near $1$ can hide two nearly parallel columns if a third column is long. The determinant answers "singular or not?" in exact arithmetic. The question "how close to singular?" belongs to the condition number and the singular values of Linear Algebra II.
:::

::: warning Cofactor expansion in code
Expanding cofactors over and over costs about $n!$ operations, and it is less accurate than elimination even for $n = 4$. `numpy.linalg.det` uses the pivots of an LU factorization. Do the same.
:::

## Check yourself

::: check
Compute $\det\begin{pmatrix} 2 & 5 \\ 4 & 7 \end{pmatrix}$, and describe in pictures what the matrix does to the unit square.
:::

::: answer
$2 \times 7 - 5 \times 4 = 14 - 20 = -6$.

The unit square becomes a parallelogram of area 6, with its orientation reversed. The image of $\mathbf{e}_1$ is $(2, 4)^T$ and the image of $\mathbf{e}_2$ is $(5, 7)^T$, and turning from the first to the second the short way is a clockwise turn — which matches the minus sign.
:::

::: check
Elimination on a $4 \times 4$ matrix produced pivots $2$, $-1$, $3$ and $0.5$ after two row swaps. What is the determinant, and what is the determinant of the inverse?
:::

::: answer
The product of the pivots is $2 \times (-1) \times 3 \times 0.5 = -3$. Two swaps contribute $(-1)^2 = 1$, so $\det\mathbf{A} = -3$.

The inverse has $\det\mathbf{A}^{-1} = 1/(-3) \approx -0.333$.
:::

::: check
A matrix $\mathbf{Q}$ satisfies $\mathbf{Q}^T\mathbf{Q} = \mathbf{I}$. Show that $\det\mathbf{Q} = \pm 1$, and explain which sign a rotation has.
:::

::: answer
Take the determinant of both sides. The product rule and the transpose rule give $\det(\mathbf{Q}^T\mathbf{Q}) = \det\mathbf{Q}^T\,\det\mathbf{Q} = (\det\mathbf{Q})^2$, and $\det\mathbf{I} = 1$. So $(\det\mathbf{Q})^2 = 1$, and $\det\mathbf{Q} = \pm 1$.

A matrix with perpendicular unit columns keeps the volume of the unit cube. It either keeps handedness ($+1$, a rotation) or reverses it ($-1$, a reflection, or a rotation combined with a reflection). A rotation has $+1$ because it can be reached from the identity by a smooth turn. Along the way the determinant changes smoothly and can only be $+1$ or $-1$, so it cannot jump from $1$ to $-1$.
:::

::: check
Without computing, explain why $\det\begin{pmatrix} 1 & 2 & 3 \\ 2 & 4 & 6 \\ 1 & 0 & 1 \end{pmatrix} = 0$, and describe the image of the unit cube.
:::

::: answer
Row 2 is twice row 1. Subtracting $2$ times row 1 from row 2 leaves the determinant unchanged and produces a row of zeros, so the determinant is $0$.

The rows are dependent, so the rank is at most 2. (It is exactly 2: row 3 is not a multiple of row 1.) The map squashes the unit cube flat into the plane spanned by the columns. There it becomes a flat six-sided shape, a hexagon, with zero volume. The matrix is singular and has a null space bigger than $\{\mathbf{0}\}$.
:::

::: check
$\det\mathbf{A} = 5$ for a $3 \times 3$ matrix. What are $\det(2\mathbf{A})$, $\det(\mathbf{A}^2)$ and $\det(\mathbf{A}^T\mathbf{A})$?
:::

::: answer
$\det(2\mathbf{A}) = 2^3 \times 5 = 40$, one factor of $2$ per row.

$\det(\mathbf{A}^2) = \det\mathbf{A}\,\det\mathbf{A} = 5 \times 5 = 25$.

$\det(\mathbf{A}^T\mathbf{A}) = \det\mathbf{A}^T\,\det\mathbf{A} = 25$ as well, since the transpose has the same determinant.

Notice that $\mathbf{A}^T\mathbf{A}$ has a positive determinant whatever the sign of $\det\mathbf{A}$. That is one sign of the squaring the QR lesson warns about.
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
| $\det(\mathbf{A}\mathbf{B}) = \det\mathbf{A}\,\det\mathbf{B}$ | Volume factors multiply when maps are chained |
| $\det\mathbf{A}^T = \det\mathbf{A}$, $\det\mathbf{A}^{-1} = 1/\det\mathbf{A}$, $\det(c\mathbf{A}) = c^n\det\mathbf{A}$ | Working identities |
| $a(ei - fh) - b(di - fg) + c(dh - eg)$ | Cofactor expansion of a $3 \times 3$ determinant |
| $\det\mathbf{R} = +1$, reflection $-1$ | Rotation audit, together with $\mathbf{R}^T\mathbf{R} = \mathbf{I}$ |

The next lesson turns to matrices whose columns are perpendicular unit vectors — the ones with $\mathbf{Q}^T\mathbf{Q} = \mathbf{I}$ and determinant $\pm 1$ — and to the recipe that manufactures such columns from any independent set. That recipe is Gram–Schmidt, and written as a factorization it is QR.

::: context attitude-chain A chain of frames
A vehicle's **attitude** is which way it is pointing. Flight software rarely gets it in one step. A star tracker reports its own pointing; a fixed matrix turns that into the body's pointing; another turns the body's into an Earth-centered frame. Multiply the matrices together and you have an attitude chain.

Each link is supposed to be a rotation, with determinant $+1$. Because determinants multiply, one link with a sign error makes the whole chain's determinant $-1$ — one quick number that exposes a mistake buried anywhere along the way.
:::

::: context uncertainty-ellipsoid The shape of not knowing
An estimator is never sure exactly where a spacecraft is. The positions it considers likely fill a fuzzy region shaped like a stretched ball — an **ellipsoid**, the 3D cousin of an ellipse. Its long axis points where the doubt is largest.

The covariance matrix describes that ellipsoid, and the ellipsoid's volume is proportional to the square root of the covariance's determinant. As good measurements arrive the ellipsoid shrinks, and the determinant falls. That makes the determinant a handy one-number summary of how much the estimator knows.
:::

::: context jacobian-word The Jacobian
The Jacobian matrix is named after the German mathematician Carl Gustav Jacob Jacobi. It collects all the first derivatives of a change of variables: how much each new coordinate moves when each old one is nudged.

Its determinant is the local volume-scaling factor of that change. In polar coordinates, for example, a small patch $\Delta r$ by $\Delta\theta$ has area about $r\,\Delta r\,\Delta\theta$, not $\Delta r\,\Delta\theta$ — patches far from the center are bigger. That factor $r$ is the Jacobian determinant. You meet it properly in the calculus modules.
:::

::: context area-picture Counting the area
The columns $(3, 1)$ and $(1, 2)$ drawn on a grid of unit squares. The parallelogram they span has area $3 \times 2 - 1 \times 1 = 5$ unit squares, You can count it by hand. The parallelogram sits inside a $4 \times 3$ box of $12$ squares. Cut away two triangles of area $1.5$, two triangles of area $1$ and two corner squares of area $1$: $12 - 3 - 2 - 2 = 5$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="ap-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#1d6fd1"/></marker>
    <marker id="ap-r" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#b4232c"/></marker>
  </defs>
  <g stroke="#8fb8f0" stroke-width="0.8">
    <line x1="40" y1="170" x2="200" y2="170"/><line x1="40" y1="130" x2="200" y2="130"/><line x1="40" y1="90" x2="200" y2="90"/><line x1="40" y1="50" x2="200" y2="50"/>
    <line x1="40" y1="50" x2="40" y2="170"/><line x1="80" y1="50" x2="80" y2="170"/><line x1="120" y1="50" x2="120" y2="170"/><line x1="160" y1="50" x2="160" y2="170"/><line x1="200" y1="50" x2="200" y2="170"/>
  </g>
  <polygon points="40,170 160,130 200,50 80,90" fill="#f2b880" fill-opacity="0.6" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="40" y1="170" x2="160" y2="130" stroke="#1d6fd1" stroke-width="3" marker-end="url(#ap-b)"/>
  <line x1="40" y1="170" x2="80" y2="90" stroke="#b4232c" stroke-width="3" marker-end="url(#ap-r)"/>
  <g font-size="12">
    <text x="110" y="166" fill="#1d6fd1">u = (3, 1)</text>
    <text x="30" y="80" fill="#b4232c">v = (1, 2)</text>
    <text x="112" y="116" fill="#1f2a44">5</text>
    <text x="220" y="100" fill="#1f2a44">area = 3·2 − 1·1 = 5</text>
    <text x="220" y="120" fill="#1f2a44">u to v turns</text>
    <text x="220" y="136" fill="#1f2a44">counterclockwise: +</text>
  </g>
</svg>
```

Swap the columns and the formula gives $1 \cdot 1 - 3 \cdot 2 = -5$: same area, opposite turn.
:::

::: context shear-cards Pushing a deck of cards
Push the top of a deck of cards sideways and the stack leans over. Every card stays the same size, so the deck's volume does not change, even though its shape does. That sideways slide is a **shear**.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <polygon points="30,170 100,170 100,100 30,100" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="170,170 240,170 310,100 240,100" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="120" y1="135" x2="155" y2="135" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="160,135 150,130 150,140" fill="#1f2a44"/>
  <line x1="320" y1="170" x2="320" y2="100" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4 3"/>
  <g font-size="12" fill="#1f2a44">
    <text x="65" y="188" text-anchor="middle">unit square, area 1</text>
    <text x="240" y="188" text-anchor="middle">sheared, area 1</text>
    <text x="324" y="140" fill="#b4232c">same height</text>
    <text x="65" y="80" text-anchor="middle">(x, y)</text>
    <text x="240" y="80" text-anchor="middle">(x + y, y)</text>
  </g>
</svg>
```

The sheared shape has the same base and the same height as the square, so the same area. The matrix $\begin{pmatrix} 1 & 1 \\ 0 & 1 \end{pmatrix}$ does this, and its determinant is $1 \cdot 1 - 1 \cdot 0 = 1$.
:::

::: context factorial-growth How fast n! grows
The exclamation mark means multiply every whole number from $n$ down to $1$: $4! = 4 \times 3 \times 2 \times 1 = 24$. It counts the ways to put $n$ things in order, which is why it counts the terms of a full cofactor expansion.

It grows ferociously. $10!$ is $3\,628\,800$. $20!$ is about $2.4 \times 10^{18}$ — a fast computer doing a billion operations a second would need roughly 77 years. Elimination on a $20 \times 20$ matrix takes about $5000$ operations.
:::

::: context no-jump Why a rotation cannot become a mirror
Imagine turning a satellite smoothly from its starting attitude to any other. At every instant its rotation matrix has perpendicular unit columns, so its determinant is $+1$ or $-1$ — nothing in between. The determinant also changes smoothly as the matrix changes smoothly. A quantity that moves smoothly but may only be $+1$ or $-1$ can never switch, so it stays at the value it started with: $\det\mathbf{I} = +1$.

A mirror image can only be reached by a jump — which is why you can never turn a left glove into a right glove, however you twist it.
:::

::: context handedness Right hands and left hands
Point the fingers of your right hand along $x$, curl them toward $y$, and your thumb points along $z$. Frames that obey this are **right-handed**, and nearly all engineering frames are.

Do the same with your left hand and the thumb points the other way: a **left-handed** frame.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <defs><marker id="hd-k" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#1f2a44"/></marker></defs>
  <line x1="60" y1="120" x2="150" y2="120" stroke="#1f2a44" stroke-width="2.5" marker-end="url(#hd-k)"/>
  <line x1="60" y1="120" x2="60" y2="30" stroke="#1f2a44" stroke-width="2.5" marker-end="url(#hd-k)"/>
  <circle cx="60" cy="120" r="9" fill="#fff" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="60" cy="120" r="3" fill="#1d6fd1"/>
  <line x1="230" y1="120" x2="320" y2="120" stroke="#1f2a44" stroke-width="2.5" marker-end="url(#hd-k)"/>
  <line x1="230" y1="120" x2="230" y2="30" stroke="#1f2a44" stroke-width="2.5" marker-end="url(#hd-k)"/>
  <circle cx="230" cy="120" r="9" fill="#fff" stroke="#b4232c" stroke-width="2"/>
  <line x1="224" y1="114" x2="236" y2="126" stroke="#b4232c" stroke-width="2"/>
  <line x1="236" y1="114" x2="224" y2="126" stroke="#b4232c" stroke-width="2"/>
  <g font-size="12" fill="#1f2a44">
    <text x="154" y="124">x</text><text x="56" y="24">y</text>
    <text x="324" y="124">x</text><text x="226" y="24">y</text>
    <text x="70" y="140" fill="#1d6fd1">z out of page</text>
    <text x="240" y="140" fill="#b4232c">z into page</text>
    <text x="60" y="162" fill="#1d6fd1">right-handed: det +1</text>
    <text x="230" y="162" fill="#b4232c">left-handed: det −1</text>
  </g>
</svg>
```

Seen from the front, the $x$ and $y$ axes look identical; only $z$ differs. Its axes are still perpendicular unit vectors, but the matrix built from them has determinant $-1$. A sensor data sheet that defines one axis with the opposite sign quietly turns a right-handed frame into a left-handed one, and the determinant check is how the mistake is caught.
:::

::: context liouville Coasting keeps the cloud's size
Joseph Liouville was a French mathematician of the 1800s. The theorem named after him says that, for motion with no friction or thrust, a cloud of possible states moves through position–velocity space without its volume changing.

The coast matrix shows why. A fast particle pulls ahead and a slow one falls behind, so the cloud stretches along position — but its spread in velocity stays the same, and the cloud leans over like a sheared deck of cards. Shape changes; area does not. That is determinant $1$.
:::
