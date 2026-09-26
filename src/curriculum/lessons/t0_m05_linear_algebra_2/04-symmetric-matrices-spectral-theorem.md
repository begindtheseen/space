---
id: l04-symmetric-matrices-spectral-theorem
title: Symmetric matrices and the spectral theorem
minutes: 25
covers:
  - symmetric matrices and the spectral theorem
---

Look at the mileage chart printed in a road atlas. Find the row for Denver and the column for Chicago, and you get the distance between them. Now find the row for Chicago and the column for Denver. Same number. The chart is a mirror image of itself across its diagonal. A matrix with that mirror property is called **symmetric**, and it is one of the most important special kinds of matrix in this course.

Most of the matrices a GNC engineer stares at are symmetric. A **[[covariance matrix|covariance-preview]]** $\mathbf{P}$ is symmetric, because how $x_i$ varies with $x_j$ is the same thing as how $x_j$ varies with $x_i$: $\operatorname{Cov}(x_i, x_j) = \operatorname{Cov}(x_j, x_i)$. A spacecraft's inertia tensor is symmetric by the way it is built. So are the normal-equation matrix $\mathbf{A}^\mathsf{T}\mathbf{A}$ of a least-squares fit, the information matrix of an estimator, the Hessian (the matrix of second derivatives) of a cost function, and the stiffness matrix of a structure. Every one of them.

That is good news: symmetric matrices are the best-behaved matrices there are. Lesson 1 warned that eigenvalues can be complex and that eigenvectors need not be perpendicular. Lesson 3 showed that a general change of coordinates can stretch lengths and bend angles. For a symmetric matrix, none of those worries apply. Its eigenvalues are real. Its eigenvectors are perpendicular to each other. It can always be diagonalized, even when an eigenvalue repeats, and the matrix that does it is a rotation. That bundle of facts is the **[[spectral theorem|spectrum-word]]**. It turns a symmetric matrix into something you can picture: a ball squeezed into an ellipsoid, with its axes along the eigenvectors.

This lesson proves the theorem, reads it as a recipe, and uses it on the two symmetric matrices on every vehicle: an inertia tensor and a covariance.

## What symmetry buys you

A real matrix is **symmetric** if it equals its own transpose, $\mathbf{A}^\mathsf{T} = \mathbf{A}$ (read "A transpose equals A"). Entry by entry, $a_{ij} = a_{ji}$: the entry in row $i$, column $j$ matches the entry in row $j$, column $i$, like the mileage chart.

The key consequence, from Linear Algebra I, is that a symmetric matrix can hop from one side of a dot product to the other:

$$(\mathbf{A}\mathbf{x})\cdot\mathbf{y} = (\mathbf{A}\mathbf{x})^\mathsf{T}\mathbf{y} = \mathbf{x}^\mathsf{T}\mathbf{A}^\mathsf{T}\mathbf{y} = \mathbf{x}^\mathsf{T}\mathbf{A}\mathbf{y} = \mathbf{x}\cdot(\mathbf{A}\mathbf{y}).$$

Transposing a product flips its order. Then symmetry swaps $\mathbf{A}^\mathsf{T}$ for $\mathbf{A}$. In words: stretching $\mathbf{x}$ and then comparing with $\mathbf{y}$ gives the same number as comparing $\mathbf{x}$ with a stretched $\mathbf{y}$. Everything below grows from that one line.

### The eigenvalues are real

First promise: every eigenvalue of a real symmetric matrix is real. A complex eigenvalue means rotation (Lesson 1), and a symmetric matrix never rotates. It only stretches.

::: note Why it has to be true
Let $\mathbf{A}\mathbf{v} = \lambda\mathbf{v}$ with $\mathbf{v} \neq \mathbf{0}$, and allow for the moment that $\lambda$ and $\mathbf{v}$ might be complex. Write $\bar{\mathbf{v}}$ (read "v bar") for the **[[complex conjugate|complex-conjugate]]** of each entry. Multiply the eigen-equation on the left by $\bar{\mathbf{v}}^\mathsf{T}$:

$$\bar{\mathbf{v}}^\mathsf{T}\mathbf{A}\mathbf{v} = \lambda\,\bar{\mathbf{v}}^\mathsf{T}\mathbf{v} = \lambda\sum_i |v_i|^2.$$

Now take the complex conjugate of the single number $\bar{\mathbf{v}}^\mathsf{T}\mathbf{A}\mathbf{v}$. Since $\mathbf{A}$ is real, the conjugate is $\mathbf{v}^\mathsf{T}\mathbf{A}\bar{\mathbf{v}}$. A single number equals its own transpose, and $\mathbf{A}^\mathsf{T} = \mathbf{A}$, so this is $\bar{\mathbf{v}}^\mathsf{T}\mathbf{A}^\mathsf{T}\mathbf{v} = \bar{\mathbf{v}}^\mathsf{T}\mathbf{A}\mathbf{v}$ again. A number that equals its own conjugate is real.

The sum $\sum|v_i|^2$ is real and positive, because $\mathbf{v}$ is not zero. So $\lambda$, which is the first real number divided by the second, is real.
:::

### Eigenvectors for different eigenvalues are perpendicular

The second promise. If two eigenvalues are different, their eigenvectors meet at a right angle.

Let $\mathbf{A}\mathbf{v}_1 = \lambda_1\mathbf{v}_1$ and $\mathbf{A}\mathbf{v}_2 = \lambda_2\mathbf{v}_2$, with $\lambda_1 \neq \lambda_2$. Hop $\mathbf{A}$ across the dot product:

$$\lambda_1(\mathbf{v}_1\cdot\mathbf{v}_2) = (\mathbf{A}\mathbf{v}_1)\cdot\mathbf{v}_2 = \mathbf{v}_1\cdot(\mathbf{A}\mathbf{v}_2) = \lambda_2(\mathbf{v}_1\cdot\mathbf{v}_2).$$

The left end and the right end are equal, so $(\lambda_1 - \lambda_2)(\mathbf{v}_1\cdot\mathbf{v}_2) = 0$. The first bracket is not zero, because the eigenvalues differ. So the dot product must be zero: the vectors are **orthogonal**, which is the math word for perpendicular. Back in Lesson 1, different eigenvalues only guaranteed that the eigenvectors were independent. Symmetry upgrades independent to perpendicular.

### Repeated eigenvalues do no harm

For a general matrix, a repeated eigenvalue can be **defective** — short of eigenvectors. The double integrator $\begin{pmatrix} 0 & 1 \\ 0 & 0 \end{pmatrix}$ was: eigenvalue $0$ twice, but only one eigenvector direction. A symmetric matrix is never defective. It always has a full set of $n$ perpendicular eigenvectors.

::: note Why it has to be true
Peel off one eigenvector at a time. Take any eigenvalue $\lambda_1$ (real, by the first result) and a unit eigenvector $\mathbf{q}_1$. Complete it to a full set of perpendicular unit vectors $\mathbf{q}_1, \mathbf{u}_2, \dots, \mathbf{u}_n$ by Gram–Schmidt, and let $\mathbf{U}$ be the matrix with those vectors as its columns.

Then $\mathbf{U}^\mathsf{T}\mathbf{A}\mathbf{U}$ is still symmetric (an orthogonal change of coordinates keeps symmetry, from Lesson 3). Its first column is $\mathbf{U}^\mathsf{T}\mathbf{A}\mathbf{q}_1 = \lambda_1\mathbf{U}^\mathsf{T}\mathbf{q}_1 = (\lambda_1, 0, \dots, 0)^\mathsf{T}$, because $\mathbf{q}_1$ is perpendicular to every other column of $\mathbf{U}$. By symmetry the first row is the same, so

$$\mathbf{U}^\mathsf{T}\mathbf{A}\mathbf{U} = \begin{pmatrix} \lambda_1 & \mathbf{0}^\mathsf{T} \\ \mathbf{0} & \mathbf{A}' \end{pmatrix},$$

with $\mathbf{A}'$ a symmetric matrix one size smaller. Repeat the same move on $\mathbf{A}'$. After $n$ steps the whole matrix is diagonal. Each step used an orthogonal matrix, and a product of orthogonal matrices is orthogonal.

No step can fail, because a real symmetric matrix of any size has at least one real eigenvalue. Whether $\lambda$ is repeated never comes up: a repeated eigenvalue gets an eigenspace (a whole plane, say, instead of a line) of the full size, and any set of perpendicular unit vectors in that eigenspace will do.
:::

## The spectral theorem

Collect the unit eigenvectors as the columns of a matrix $\mathbf{Q}$, and the eigenvalues down the diagonal of $\boldsymbol{\Lambda}$ ("capital lambda"). Lesson 1 diagonalized a matrix as $\mathbf{A} = \mathbf{V}\boldsymbol{\Lambda}\mathbf{V}^{-1}$. Now $\mathbf{V} = \mathbf{Q}$ has perpendicular unit columns, so it is **orthogonal**, and its inverse is its transpose, $\mathbf{Q}^{-1} = \mathbf{Q}^\mathsf{T}$. No inverse needs computing.

::: key The spectral theorem for real symmetric matrices
$\mathbf{A} = \mathbf{Q}\boldsymbol{\Lambda}\mathbf{Q}^\mathsf{T}$ with $\mathbf{Q}$ orthogonal and $\boldsymbol{\Lambda}$ real diagonal — a real symmetric matrix always has real eigenvalues and a full orthonormal eigenbasis. Equivalently $\mathbf{Q}^\mathsf{T}\mathbf{A}\mathbf{Q} = \boldsymbol{\Lambda}$: there is a rotation of coordinates in which $\mathbf{A}$ is diagonal.
:::

("Orthonormal" means perpendicular and of unit length. "Eigenbasis" means a set of axes made of eigenvectors.)

### Reading it as a recipe

The theorem has a second, equally useful form. Multiply out $\mathbf{Q}\boldsymbol{\Lambda}\mathbf{Q}^\mathsf{T}$ one column at a time:

$$\mathbf{A} = \sum_{i=1}^{n}\lambda_i\,\mathbf{q}_i\mathbf{q}_i^\mathsf{T}.$$

Each piece $\mathbf{q}_i\mathbf{q}_i^\mathsf{T}$ (read "q i, q i transpose", a column times a row) is the **[[projection matrix|projection-recap]]** onto the line through $\mathbf{q}_i$, from Linear Algebra I. It is symmetric, has rank one, and squares to itself. So a symmetric matrix is a weighted sum of projections onto perpendicular lines, with the eigenvalues as the weights. Acting on a vector,

$$\mathbf{A}\mathbf{x} = \sum_i \lambda_i\,(\mathbf{q}_i\cdot\mathbf{x})\,\mathbf{q}_i.$$

That formula is a three-step recipe:

1. Split $\mathbf{x}$ into its pieces along the eigen-axes. The piece along $\mathbf{q}_i$ has size $\mathbf{q}_i\cdot\mathbf{x}$.
2. Scale each piece by its own eigenvalue.
3. Add the pieces back together.

There is no shear and no rotation — only stretching along $n$ perpendicular axes. Think of pizza dough pressed between two hands: it gets longer one way and thinner the other, but it does not twist. The picture is an **[[ellipsoid|ellipse-map]]**: the matrix sends the unit sphere to an ellipsoid whose axes point along the $\mathbf{q}_i$ and whose semi-axes (half-widths) are $|\lambda_i|$.

### Functions of a symmetric matrix

A diagonal matrix is easy to work with: to square it, square each diagonal entry. The spectral theorem hands that ease to $\mathbf{A}$. Any function of $\mathbf{A}$ keeps the same eigenvectors, and the function acts on each eigenvalue by itself:

- powers: $\mathbf{A}^k = \mathbf{Q}\boldsymbol{\Lambda}^k\mathbf{Q}^\mathsf{T}$;
- the inverse, when no eigenvalue is zero: $\mathbf{A}^{-1} = \mathbf{Q}\boldsymbol{\Lambda}^{-1}\mathbf{Q}^\mathsf{T}$;
- the matrix exponential of Lesson 2: $e^{\mathbf{A}t} = \mathbf{Q}e^{\boldsymbol{\Lambda}t}\mathbf{Q}^\mathsf{T}$;
- and — new, and important for covariances — a **square root**, $\mathbf{A}^{1/2} = \mathbf{Q}\boldsymbol{\Lambda}^{1/2}\mathbf{Q}^\mathsf{T}$, whenever the eigenvalues are zero or positive. It satisfies $\mathbf{A}^{1/2}\mathbf{A}^{1/2} = \mathbf{A}$.

::: example A two-by-two spectral decomposition, and its tenth power
Take $\mathbf{A} = \begin{pmatrix} 5 & 2 \\ 2 & 2 \end{pmatrix}$. It is symmetric: the two off-diagonal entries are both $2$.

**Eigenvalues.** The trace (sum of the diagonal) is $7$ and the determinant is $5 \times 2 - 2 \times 2 = 6$. So the characteristic equation is $\lambda^2 - 7\lambda + 6 = (\lambda - 6)(\lambda - 1) = 0$, giving $\lambda_1 = 6$ and $\lambda_2 = 1$. Both real, as promised.

**Eigenvectors.** For $\lambda = 6$, the first row of $\mathbf{A} - 6\mathbf{I}$ says $-v_1 + 2v_2 = 0$, so $\mathbf{v}_1 = (2, 1)^\mathsf{T}$. For $\lambda = 1$, the first row of $\mathbf{A} - \mathbf{I}$ says $4v_1 + 2v_2 = 0$, so $\mathbf{v}_2 = (1, -2)^\mathsf{T}$. Check: $\mathbf{v}_1\cdot\mathbf{v}_2 = 2 - 2 = 0$. Perpendicular, as promised. Each has length $\sqrt{5}$, so divide by $\sqrt{5}$:

$$\mathbf{Q} = \frac{1}{\sqrt{5}}\begin{pmatrix} 2 & 1 \\ 1 & -2 \end{pmatrix}, \qquad \boldsymbol{\Lambda} = \begin{pmatrix} 6 & 0 \\ 0 & 1 \end{pmatrix}.$$

$\mathbf{Q}$ is orthogonal: its columns have unit length and are perpendicular. Its determinant is $(-4 - 1)/5 = -1$, so it is a rotation combined with a mirror flip. Flipping the sign of the second column would make it a pure rotation. Either choice is a valid $\mathbf{Q}$.

**The recipe form.** Each $\mathbf{q}_i\mathbf{q}_i^\mathsf{T}$ is a column times a row:

$$\mathbf{A} = 6\cdot\frac{1}{5}\begin{pmatrix} 4 & 2 \\ 2 & 1 \end{pmatrix} + 1\cdot\frac{1}{5}\begin{pmatrix} 1 & -2 \\ -2 & 4 \end{pmatrix} = \begin{pmatrix} 4.8 & 2.4 \\ 2.4 & 1.2 \end{pmatrix} + \begin{pmatrix} 0.2 & -0.4 \\ -0.4 & 0.8 \end{pmatrix} = \begin{pmatrix} 5 & 2 \\ 2 & 2 \end{pmatrix}.$$

The two pieces add back to $\mathbf{A}$ exactly.

**The tenth power.** Only the eigenvalues get raised to the tenth power: $\mathbf{A}^{10} = \mathbf{Q}\operatorname{diag}(6^{10}, 1)\mathbf{Q}^\mathsf{T} = 6^{10}\,\mathbf{q}_1\mathbf{q}_1^\mathsf{T} + \mathbf{q}_2\mathbf{q}_2^\mathsf{T}$. With $6^{10} = 60\,466\,176$, the first term is $\tfrac{1}{5}\times 60\,466\,176\times\begin{pmatrix} 4 & 2 \\ 2 & 1 \end{pmatrix}$. Adding the small second term gives

$$\mathbf{A}^{10} = \begin{pmatrix} 48\,372\,941 & 24\,186\,470 \\ 24\,186\,470 & 12\,093\,236 \end{pmatrix}.$$

Sanity check: this is almost exactly a multiple of $\begin{pmatrix} 4 & 2 \\ 2 & 1 \end{pmatrix}$, a rank-one matrix along $\mathbf{q}_1$. That makes sense. The $\lambda_2 = 1$ direction has not grown at all, so the big eigenvalue has taken over.

**The inverse** is equally cheap: $\mathbf{A}^{-1} = \mathbf{Q}\operatorname{diag}(1/6, 1)\mathbf{Q}^\mathsf{T} = \begin{pmatrix} 0.333 & -0.333 \\ -0.333 & 0.833 \end{pmatrix}$. Confirm it with the $2\times 2$ inverse formula: $\tfrac{1}{6}\begin{pmatrix} 2 & -2 \\ -2 & 5 \end{pmatrix}$. Same matrix.
:::

::: example A repeated eigenvalue without defect
$\mathbf{A} = \begin{pmatrix} 2 & 1 & 1 \\ 1 & 2 & 1 \\ 1 & 1 & 2 \end{pmatrix}$ is symmetric. The trick is to see it as $\mathbf{I} + \mathbf{J}$, where $\mathbf{J}$ is the all-ones matrix.

**One eigenvalue.** $\mathbf{J} = \mathbf{1}\mathbf{1}^\mathsf{T}$, where $\mathbf{1} = (1,1,1)^\mathsf{T}$. Multiplying $\mathbf{J}$ by $\mathbf{1}$ adds up three ones in each row, so $\mathbf{J}\mathbf{1} = 3\cdot\mathbf{1}$. Then $\mathbf{A}\mathbf{1} = \mathbf{1} + 3\cdot\mathbf{1} = 4\cdot\mathbf{1}$: eigenvalue $4$, with unit eigenvector $\mathbf{q}_1 = (1,1,1)^\mathsf{T}/\sqrt{3}$.

**The others.** Take any vector $\mathbf{x}$ perpendicular to $\mathbf{1}$ — its entries add to zero. Then $\mathbf{J}\mathbf{x} = \mathbf{1}(\mathbf{1}\cdot\mathbf{x}) = \mathbf{0}$, so $\mathbf{A}\mathbf{x} = \mathbf{x}$. That is eigenvalue $1$, and its eigenspace is the entire plane perpendicular to $\mathbf{1}$.

**Checks.** The eigenvalues $4, 1, 1$ add to $6$, the trace. They multiply to $4$, the determinant.

The eigenvalue $1$ appears twice, and its eigenspace is two-dimensional — exactly as many directions as it needs. Any perpendicular pair of unit vectors in that plane completes $\mathbf{Q}$, for example $(1, -1, 0)^\mathsf{T}/\sqrt{2}$ and $(1, 1, -2)^\mathsf{T}/\sqrt{6}$.

Compare the double integrator $\begin{pmatrix} 0 & 1 \\ 0 & 0 \end{pmatrix}$. It also has a repeated eigenvalue, but only one eigenvector direction. It is not symmetric, and the spectral theorem makes it no promise.
:::

## The Rayleigh quotient

Walk around a circular track on a hillside. Your height rises and falls, but it always stays between the track's lowest and highest points. The Rayleigh quotient is that idea for a quadratic form.

A **quadratic form** is the single number $\mathbf{x}^\mathsf{T}\mathbf{A}\mathbf{x}$ — a row, times a matrix, times a column. (The next lesson studies it in depth.) The spectral theorem tells you exactly how big it can get.

Switch to eigen-coordinates. Let $\mathbf{y} = \mathbf{Q}^\mathsf{T}\mathbf{x}$, so $\mathbf{x} = \mathbf{Q}\mathbf{y}$. Because $\mathbf{Q}$ is a rotation (possibly with a flip), it does not change lengths: $\|\mathbf{y}\| = \|\mathbf{x}\|$. Then

$$\mathbf{x}^\mathsf{T}\mathbf{A}\mathbf{x} = \mathbf{y}^\mathsf{T}\mathbf{Q}^\mathsf{T}\mathbf{A}\mathbf{Q}\mathbf{y} = \mathbf{y}^\mathsf{T}\boldsymbol{\Lambda}\mathbf{y} = \sum_i\lambda_i y_i^2.$$

The first step substitutes $\mathbf{x} = \mathbf{Q}\mathbf{y}$. The second uses $\mathbf{Q}^\mathsf{T}\mathbf{A}\mathbf{Q} = \boldsymbol{\Lambda}$. The last writes out a diagonal matrix sandwiched by a vector. So in the eigen-axes, a quadratic form is a weighted sum of squares, with no cross terms.

Now the fence. The squares $y_i^2$ add up to $\|\mathbf{x}\|^2$. If you replace every $\lambda_i$ by the largest one, $\lambda_{\max}$ ("lambda max"), the sum can only go up. If you replace every one by the smallest, $\lambda_{\min}$, it can only go down:

$$\lambda_{\min}\,\|\mathbf{x}\|^2 \;\le\; \mathbf{x}^\mathsf{T}\mathbf{A}\mathbf{x} \;\le\; \lambda_{\max}\,\|\mathbf{x}\|^2.$$

The ratio $R(\mathbf{x}) = \mathbf{x}^\mathsf{T}\mathbf{A}\mathbf{x}/\mathbf{x}^\mathsf{T}\mathbf{x}$ is the **[[Rayleigh quotient|rayleigh-name]]**. It always lies between $\lambda_{\min}$ and $\lambda_{\max}$, and it [[reaches each end|rayleigh-curve]] exactly when $\mathbf{x}$ points along the matching eigenvector.

It has two uses.

- **A fast eigenvalue estimate.** If you have a rough guess at an eigenvector, its Rayleigh quotient is a much better guess at the eigenvalue than the vector was at the eigenvector. The error in the eigenvalue goes like the *square* of the error in the vector.
- **The sign of the form.** The signs of the eigenvalues decide the sign of $\mathbf{x}^\mathsf{T}\mathbf{A}\mathbf{x}$ for every $\mathbf{x}$ at once. If all the eigenvalues are positive, the form is positive for every nonzero $\mathbf{x}$. The next lesson builds positive definiteness on exactly this.

::: key Quadratic forms in the eigenbasis
$\mathbf{x}^\mathsf{T}\mathbf{A}\mathbf{x} = \sum_i\lambda_i y_i^2$ with $\mathbf{y} = \mathbf{Q}^\mathsf{T}\mathbf{x}$, so $\lambda_{\min}\lVert\mathbf{x}\rVert^2 \le \mathbf{x}^\mathsf{T}\mathbf{A}\mathbf{x} \le \lambda_{\max}\lVert\mathbf{x}\rVert^2$. The bounds are attained along the extreme eigenvectors.
:::

## Two symmetric matrices you will meet on every vehicle

### Principal axes of an inertia tensor

Toss a hardcover book in the air, spinning. Spin it about its longest axis, or about its shortest, and it turns cleanly. Try any slanted axis and it tumbles and **[[wobbles|explorer-1]]**. The clean axes are the book's principal axes, and the spectral theorem is why every object has them.

The **inertia tensor** $\mathbf{I}$ of a rigid body is a symmetric $3\times 3$ matrix. It turns the angular velocity $\boldsymbol{\omega}$ (how fast, and about which axis, the body spins) into the angular momentum $\mathbf{h} = \mathbf{I}\boldsymbol{\omega}$. Its eigenvectors are the **principal axes**, and its eigenvalues are the **principal moments of inertia**, measured in $\mathrm{kg\,m^2}$.

Spin about a principal axis and $\mathbf{h}$ points the same way as $\boldsymbol{\omega}$ — that is what being an eigenvector means. Spin about any other axis and the two point different ways, and the vehicle wobbles. The spectral theorem says every rigid body, whatever its shape, has three perpendicular principal axes. In the frame of those axes, its inertia tensor is diagonal.

::: example Finding the principal axes of a spacecraft
A spacecraft's inertia tensor in its body frame $B$ is, in $\mathrm{kg\,m^2}$,

$$\mathbf{I}^B = \begin{pmatrix} 110.00 & 16.28 & 5.92 \\ 16.28 & 85.32 & 12.86 \\ 5.92 & 12.86 & 54.68 \end{pmatrix}.$$

The off-diagonal entries (the "products of inertia") are not zero, so the body axes are not the principal axes.

**The characteristic polynomial.** For a $3\times 3$ matrix it is $\lambda^3 - c_2\lambda^2 + c_1\lambda - c_0$, where:

- $c_2$ is the trace: $110 + 85.32 + 54.68 = 250$;
- $c_1$ is the sum of the three $2\times 2$ determinants you get by keeping two of the three rows and the same two columns: $c_1 = (110\times 85.32 - 16.28^2) + (110\times 54.68 - 5.92^2) + (85.32\times 54.68 - 12.86^2) = 9120.2 + 5979.8 + 4499.9 \approx 19\,600$;
- $c_0$ is the determinant, $\det\mathbf{I}^B \approx 480\,000$.

(The tiny leftovers — $19\,599.8$ and $479\,987$ — come from rounding the entries to two decimals.) The roots of $\lambda^3 - 250\lambda^2 + 19\,600\lambda - 480\,000$ are $\lambda = 120$, $80$ and $50$. Check: $120 + 80 + 50 = 250$; $120\times 80 + 120\times 50 + 80\times 50 = 9600 + 6000 + 4000 = 19\,600$; $120\times 80\times 50 = 480\,000$. These are the principal moments.

**The principal axes.** The unit eigenvectors, found from the null spaces of $\mathbf{I}^B - \lambda\mathbf{I}$, are

$$\mathbf{q}_{120} = \begin{pmatrix} 0.8660 \\ 0.4698 \\ 0.1710 \end{pmatrix}, \qquad \mathbf{q}_{80} = \begin{pmatrix} -0.5000 \\ 0.8138 \\ 0.2962 \end{pmatrix}, \qquad \mathbf{q}_{50} = \begin{pmatrix} 0 \\ -0.3420 \\ 0.9397 \end{pmatrix}.$$

They are perpendicular. For instance, $\mathbf{q}_{120}\cdot\mathbf{q}_{80} = -0.4330 + 0.3823 + 0.0507 = 0.0000$.

Put them side by side as the columns of $\mathbf{Q}$. In the frame notation of Linear Algebra I, $\mathbf{Q} = \mathbf{R}_B^P$: the principal axes written in body coordinates. In fact these columns are exactly those of $\mathbf{R}_1(20^\circ)\mathbf{R}_3(30^\circ)$. That means the principal frame is the body frame rolled $20^\circ$ about its $x$-axis and then yawed $30^\circ$ about the new $z$-axis. So $\mathbf{I}^B = \mathbf{R}_B^P\operatorname{diag}(120, 80, 50)(\mathbf{R}_B^P)^\mathsf{T}$ is two things at once: the spectral decomposition, and the change of frame of Lesson 3.

**Spinning it.** Spin the vehicle at $\boldsymbol{\omega}^B = (0, 0, 0.1)^\mathsf{T}\,\mathrm{rad/s}$ about its body $z$-axis. The angular momentum is the third column of $\mathbf{I}^B$ times $0.1$: $\mathbf{h}^B = (0.592, 1.286, 5.468)^\mathsf{T}\,\mathrm{kg\,m^2/s}$. That points $14.5^\circ$ away from $\boldsymbol{\omega}^B$. The body $z$-axis is not principal, so a torque-free spin about it will wobble.

In principal coordinates the same calculation is three separate multiplications. First $\boldsymbol{\omega}^P = (\mathbf{R}_B^P)^\mathsf{T}\boldsymbol{\omega}^B = (0.0171, 0.0296, 0.0940)^\mathsf{T}$. Then $\mathbf{h}^P = (120\times 0.0171,\ 80\times 0.0296,\ 50\times 0.0940)^\mathsf{T} = (2.052, 2.370, 4.698)^\mathsf{T}$. Rotating that back with $\mathbf{R}_B^P$ returns the same $\mathbf{h}^B$, as it must.
:::

### The covariance ellipse

Throw a hundred darts at a board. They do not land in a neat circle. They land in a smudge that is longer one way than the other, and tilted. A covariance matrix describes that smudge.

A $2\times 2$ position covariance $\mathbf{P}$ describes an **[[error ellipse|covariance-ellipse]]**. Its eigenvectors point along the ellipse's axes. The square roots of its eigenvalues are the one-sigma semi-axis lengths. Here is why. In the eigenbasis, the quadratic form $\mathbf{x}^\mathsf{T}\mathbf{P}^{-1}\mathbf{x}$ becomes $\sum_i y_i^2/\lambda_i$ (the inverse has eigenvalues $1/\lambda_i$). Setting that equal to $1$ gives $y_1^2/\lambda_1 + y_2^2/\lambda_2 = 1$ — an ellipse with semi-axes $\sqrt{\lambda_1}$ and $\sqrt{\lambda_2}$.

::: example Reading a position covariance
A navigation filter reports $\mathbf{P} = \begin{pmatrix} 4 & 1.5 \\ 1.5 & 2 \end{pmatrix}\,\mathrm{m^2}$ for the east and north position errors.

**What the diagonal says.** $\sigma_E = \sqrt{4} = 2\,\mathrm{m}$ and $\sigma_N = \sqrt{2} = 1.41\,\mathrm{m}$. But the off-diagonal $1.5$ is positive: when the east error is big, the north error tends to be big too. So the ellipse is tilted.

**Eigenvalues.** Trace $6$, determinant $4\times 2 - 1.5^2 = 8 - 2.25 = 5.75$. The equation $\lambda^2 - 6\lambda + 5.75 = 0$ gives $\lambda = 3 \pm \sqrt{9 - 5.75} = 3 \pm 1.803$. So $\lambda_1 = 4.803\,\mathrm{m^2}$ and $\lambda_2 = 1.197\,\mathrm{m^2}$.

**Semi-axes.** $\sqrt{4.803} = 2.19\,\mathrm{m}$ and $\sqrt{1.197} = 1.09\,\mathrm{m}$.

**Direction.** The long axis is the eigenvector for $4.803$. The first row of $\mathbf{P} - 4.803\mathbf{I}$ gives $-0.803v_1 + 1.5v_2 = 0$, so $\mathbf{q}_1 \propto (1.5, 0.803)$ (the symbol $\propto$ means "points the same way as"). Its angle is $\arctan(0.803/1.5) = 28.2^\circ$ north of east.

**What the diagonal hid.** The worst one-sigma error is $2.19\,\mathrm{m}$, not $2\,\mathrm{m}$, and it lies on a slant, not due east. The ellipse's area is $\pi\sqrt{\lambda_1\lambda_2} = \pi\sqrt{\det\mathbf{P}} = \pi\sqrt{5.75} = 7.53\,\mathrm{m^2}$.

**The Rayleigh fence.** In every direction $\hat{\mathbf{u}}$ (a unit vector, read "u hat"), the variance $\hat{\mathbf{u}}^\mathsf{T}\mathbf{P}\hat{\mathbf{u}}$ lies between $1.197$ and $4.803\,\mathrm{m^2}$. Try two. Along $(1,1)/\sqrt{2}$ it is $(4 + 2\times 1.5 + 2)/2 = 4.5\,\mathrm{m^2}$. Along $(1,-1)/\sqrt{2}$ it is $(4 - 3 + 2)/2 = 1.5\,\mathrm{m^2}$. Both are inside the fence, as they must be.
:::

## Symmetric matrices in NumPy

```python
import numpy as np

P = np.array([[4.0, 1.5], [1.5, 2.0]])
w, Q = np.linalg.eigh(P)          # eigh: symmetric solver, ascending eigenvalues
print(w)                          # [1.19722436 4.80277564]
q1 = Q[:, 1] * np.sign(Q[0, 1])   # major axis; the sign eigh returns is arbitrary
print(np.round(q1, 4))            # [0.8817 0.4719]  unit length, 28.2 deg from east
print(np.allclose(Q @ np.diag(w) @ Q.T, P))   # True: the spectral decomposition
print(np.allclose(Q.T @ Q, np.eye(2)))        # True: Q is orthogonal
sqrtP = Q @ np.diag(np.sqrt(w)) @ Q.T        # symmetric square root
print(np.allclose(sqrtP @ sqrtP, P))          # True
```

Use `eigh`, not `eig`, whenever the matrix is symmetric. It [[runs faster|eigh-lapack]], returns eigenvalues that are exactly real and sorted smallest first, and gives eigenvectors perpendicular to within round-off. `eig` returns complex-typed arrays with zero imaginary parts, and eigenvectors that are only roughly perpendicular.

::: warning A matrix that is symmetric on paper may not be in memory
A covariance updated by $\mathbf{P} \leftarrow (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}$ is symmetric in exact arithmetic. After one floating-point update, it is off by a few **[[units in the last place|ulp]]**. `eigh` reads only one triangle and quietly assumes the other matches. `eig` sees the mismatch and may return tiny imaginary parts. The standard defense is to symmetrize after every update, $\mathbf{P} \leftarrow \tfrac{1}{2}(\mathbf{P} + \mathbf{P}^\mathsf{T})$. It costs almost nothing and removes the drift before it grows. The next lesson explains why the lost symmetry is only the first symptom of a deeper problem with that update.
:::

::: warning Real eigenvalues do not imply perpendicular eigenvectors
$\begin{pmatrix} 4 & 1 \\ 2 & 3 \end{pmatrix}$ has real eigenvalues $5$ and $2$, but its eigenvectors $(1, 1)^\mathsf{T}$ and $(1, -2)^\mathsf{T}$ are not perpendicular: their dot product is $1 - 2 = -1$. Symmetry gives real eigenvalues, but real eigenvalues do not give symmetry. Perpendicular eigenvectors need symmetry. Before you write $\mathbf{V}^\mathsf{T}$ where $\mathbf{V}^{-1}$ belongs, check that $\mathbf{A}^\mathsf{T} = \mathbf{A}$.
:::

## Check yourself

::: check
Find the spectral decomposition of $\mathbf{A} = \begin{pmatrix} 1 & 2 \\ 2 & -2 \end{pmatrix}$ and check that the eigenvectors are perpendicular.
:::

::: answer
**Eigenvalues.** Trace $1 + (-2) = -1$, determinant $1\times(-2) - 2\times 2 = -6$. So $\lambda^2 + \lambda - 6 = (\lambda + 3)(\lambda - 2) = 0$, giving $\lambda_1 = 2$ and $\lambda_2 = -3$.

**Eigenvectors.** For $\lambda = 2$, the first row of $\mathbf{A} - 2\mathbf{I}$ gives $-v_1 + 2v_2 = 0$, so $\mathbf{v}_1 = (2, 1)^\mathsf{T}$. Check: $\mathbf{A}\mathbf{v}_1 = (2 + 2, 4 - 2)^\mathsf{T} = (4, 2)^\mathsf{T} = 2\mathbf{v}_1$. For $\lambda = -3$, the first row gives $4v_1 + 2v_2 = 0$, so $\mathbf{v}_2 = (1, -2)^\mathsf{T}$. Check: $\mathbf{A}\mathbf{v}_2 = (1 - 4, 2 + 4)^\mathsf{T} = (-3, 6)^\mathsf{T} = -3\mathbf{v}_2$.

**Perpendicular?** $\mathbf{v}_1\cdot\mathbf{v}_2 = 2 - 2 = 0$. Yes.

So $\mathbf{Q} = \tfrac{1}{\sqrt{5}}\begin{pmatrix} 2 & 1 \\ 1 & -2 \end{pmatrix}$ and $\boldsymbol{\Lambda} = \operatorname{diag}(2, -3)$. One eigenvalue is negative, so the matrix stretches one axis and flips the other. It is symmetric but, in the language of the next lesson, indefinite.
:::

::: check
A symmetric matrix has eigenvalues $9$, $4$ and $1$. Without knowing its eigenvectors, give the range of $\mathbf{x}^\mathsf{T}\mathbf{A}\mathbf{x}$ over unit vectors $\mathbf{x}$, the eigenvalues of $\mathbf{A}^{-1}$ and of $\mathbf{A}^{1/2}$, and $\det\mathbf{A}$.
:::

::: answer
By the Rayleigh fence, $1 \le \mathbf{x}^\mathsf{T}\mathbf{A}\mathbf{x} \le 9$ whenever $\|\mathbf{x}\| = 1$.

$\mathbf{A}^{-1} = \mathbf{Q}\boldsymbol{\Lambda}^{-1}\mathbf{Q}^\mathsf{T}$ has eigenvalues $1/9$, $1/4$ and $1$. $\mathbf{A}^{1/2} = \mathbf{Q}\boldsymbol{\Lambda}^{1/2}\mathbf{Q}^\mathsf{T}$ has eigenvalues $3$, $2$ and $1$. Both keep the same eigenvectors as $\mathbf{A}$.

$\det\mathbf{A} = 9\times 4\times 1 = 36$, the product of the eigenvalues.

All of this follows from the eigenvalues alone, because the spectral theorem guarantees that the eigenvectors are a perpendicular set of unit vectors, whatever they turn out to be.
:::

::: check
Why can a real symmetric matrix never describe a rotation by an angle other than $0$ or $180^\circ$?
:::

::: answer
A rotation of the plane by $\theta$ has eigenvalues $e^{\pm i\theta}$, which are complex unless $\theta = 0$ or $\pi$. A symmetric matrix has only real eigenvalues, so it cannot have that set of eigenvalues.

In pictures: a symmetric matrix only stretches along perpendicular axes. The only "turning" it can do is to flip some axes over ($\lambda = -1$). Flipping two axes is a $180^\circ$ rotation in their plane; flipping one is a mirror reflection. You can check it directly: the rotation matrix $\mathbf{R}_3(\theta)$ is symmetric only when $\sin\theta = 0$.
:::

::: check
The projection matrix onto a unit vector is $\mathbf{P} = \hat{\mathbf{u}}\hat{\mathbf{u}}^\mathsf{T}$. Use the spectral theorem to find its eigenvalues and eigenvectors in three dimensions.
:::

::: answer
$\mathbf{P}$ is symmetric, so it has a perpendicular set of unit eigenvectors.

Along $\hat{\mathbf{u}}$: $\mathbf{P}\hat{\mathbf{u}} = \hat{\mathbf{u}}(\hat{\mathbf{u}}\cdot\hat{\mathbf{u}}) = \hat{\mathbf{u}}$, so eigenvalue $1$.

Perpendicular to $\hat{\mathbf{u}}$: for any such $\mathbf{x}$, $\mathbf{P}\mathbf{x} = \hat{\mathbf{u}}(\hat{\mathbf{u}}\cdot\mathbf{x}) = \mathbf{0}$, so eigenvalue $0$ on the whole perpendicular plane.

The eigenvalues are $1, 0, 0$, and the recipe form $\mathbf{P} = 1\cdot\hat{\mathbf{u}}\hat{\mathbf{u}}^\mathsf{T} + 0 + 0$ is the matrix itself. The trace is $1$, which equals the rank — true of every projection.
:::

::: check
A filter's $3\times 3$ position covariance has eigenvalues $25$, $4$ and $0.01\,\mathrm{m^2}$. Describe the uncertainty ellipsoid and say what the smallest eigenvalue tells you about the measurements.
:::

::: answer
The one-sigma ellipsoid has semi-axes $\sqrt{25} = 5\,\mathrm{m}$, $\sqrt{4} = 2\,\mathrm{m}$ and $\sqrt{0.01} = 0.1\,\mathrm{m}$, along the three eigenvectors. It is a flattened disc: very well pinned down along one axis and poorly along another, with a $50{:}1$ ratio of longest to shortest.

The smallest eigenvalue marks the direction the measurements pin down best. The largest marks the direction they barely constrain; along that $5\,\mathrm{m}$ axis the filter is leaning mostly on its dynamics model.

The ratio of the extreme eigenvalues, $25/0.01 = 2500$, is the **[[condition number of Lesson 10|condition-bridge]]**. It is large enough that the filter's arithmetic in that direction is worth watching.
:::

## Summary

| Item | Statement |
| --- | --- |
| Symmetric | $\mathbf{A}^\mathsf{T} = \mathbf{A}$; $(\mathbf{A}\mathbf{x})\cdot\mathbf{y} = \mathbf{x}\cdot(\mathbf{A}\mathbf{y})$ |
| Eigenvalues | all real; proof via $\bar{\mathbf{v}}^\mathsf{T}\mathbf{A}\mathbf{v}$ equal to its own conjugate |
| Eigenvectors | perpendicular for different eigenvalues; repeated eigenvalues have full-size eigenspaces, never defective |
| Spectral theorem | $\mathbf{A} = \mathbf{Q}\boldsymbol{\Lambda}\mathbf{Q}^\mathsf{T}$, $\mathbf{Q}$ orthogonal, $\boldsymbol{\Lambda}$ real diagonal; $\mathbf{Q}^\mathsf{T}\mathbf{A}\mathbf{Q} = \boldsymbol{\Lambda}$ |
| Recipe (rank-one) form | $\mathbf{A} = \sum_i\lambda_i\mathbf{q}_i\mathbf{q}_i^\mathsf{T}$; $\mathbf{A}\mathbf{x} = \sum_i\lambda_i(\mathbf{q}_i\cdot\mathbf{x})\mathbf{q}_i$ |
| Functions | $\mathbf{A}^k$, $\mathbf{A}^{-1}$, $e^{\mathbf{A}t}$, $\mathbf{A}^{1/2} = \mathbf{Q}\boldsymbol{\Lambda}^{1/2}\mathbf{Q}^\mathsf{T}$ share the eigenvectors |
| Rayleigh quotient | $\lambda_{\min}\lVert\mathbf{x}\rVert^2 \le \mathbf{x}^\mathsf{T}\mathbf{A}\mathbf{x} \le \lambda_{\max}\lVert\mathbf{x}\rVert^2$ |
| Inertia tensor | eigenvectors are the principal axes, eigenvalues the principal moments; $\mathbf{I}^B = \mathbf{R}_B^P\,\mathbf{I}^P(\mathbf{R}_B^P)^\mathsf{T}$ |
| Covariance ellipse | axes along eigenvectors, one-sigma semi-axes $\sqrt{\lambda_i}$, area $\pi\sqrt{\det\mathbf{P}}$ in 2-D |
| NumPy | `np.linalg.eigh` for symmetric matrices; symmetrize with $\tfrac{1}{2}(\mathbf{P} + \mathbf{P}^\mathsf{T})$ |

The next lesson asks the one further question that matters for a covariance: are all the eigenvalues positive? That property is called positive definiteness, and every covariance, information matrix and cost-function Hessian must have it.

::: context covariance-preview What a covariance matrix holds
Suppose a filter estimates two numbers, like a position east and a position north. Each estimate has an error. The **variance** of an error is the average of its square — how spread out it is — and its square root is the familiar standard deviation, $\sigma$. The covariance matrix puts the two variances on its diagonal. Off the diagonal it puts the **covariance**: the average of (east error) times (north error). That is positive when the two errors tend to have the same sign, and negative when they tend to be opposite. Lesson 5 builds all of this properly; for now it is enough that the off-diagonal entries appear twice, once on each side, and must match.
:::

::: context spectrum-word Why "spectral"?
The set of eigenvalues of a matrix is called its **spectrum**. David Hilbert used the word this way in his work on equations in the early 1900s. The name turned out to be apt. In quantum mechanics, the colored lines in the light from a glowing gas — its spectrum, in the everyday sense — are eigenvalues of symmetric (more precisely, Hermitian) operators. The fact that those eigenvalues are real, which this lesson proves for matrices, is why measured energies come out as real numbers.
:::

::: context complex-conjugate The conjugate of a complex number
A complex number is $a + bi$, where $i$ is the square root of $-1$. Its **conjugate** is $a - bi$: the same number with the sign of the imaginary part flipped, written with a bar on top. A number times its own conjugate is always real and never negative: $(a + bi)(a - bi) = a^2 + b^2$. That is the "size squared", $|v|^2$, used in the proof. A number equals its own conjugate only when $b = 0$ — that is, when it is real. The proof uses exactly that test.
:::

::: context projection-recap A projection, as a machine
Shine a flashlight straight down on a stick. Its shadow on the floor is its projection. The matrix $\mathbf{q}\mathbf{q}^\mathsf{T}$ does this onto the line through the unit vector $\mathbf{q}$. Feed it $\mathbf{x}$ and it returns $(\mathbf{q}\cdot\mathbf{x})\,\mathbf{q}$: the shadow of $\mathbf{x}$ on that line. Doing it twice changes nothing, since a shadow's shadow is itself, so $(\mathbf{q}\mathbf{q}^\mathsf{T})^2 = \mathbf{q}\mathbf{q}^\mathsf{T}$. It squashes everything onto one line, so its rank is one.
:::

::: context ellipse-map A circle becomes an ellipse
The dashed circle is every unit vector. Multiply each one by $\mathbf{A} = \begin{pmatrix} 5 & 2 \\ 2 & 2 \end{pmatrix}$ and the circle becomes the blue ellipse. It is stretched $6$ times along $\mathbf{q}_1 = (2, 1)/\sqrt{5}$ and left alone ($1$ times) along the perpendicular $\mathbf{q}_2 = (1, -2)/\sqrt{5}$. There is no twist: the ellipse's axes are exactly the eigenvectors.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="100" x2="270" y2="100" stroke="#6c7a93" stroke-width="1"/>
  <line x1="150" y1="20" x2="150" y2="180" stroke="#6c7a93" stroke-width="1"/>
  <ellipse cx="150" cy="100" rx="84" ry="14" transform="rotate(-26.57 150 100)" fill="#8fb8f0" fill-opacity="0.5" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="150" cy="100" r="14" fill="none" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="3 2"/>
  <line x1="150" y1="100" x2="225.1" y2="62.4" stroke="#b4232c" stroke-width="2"/>
  <line x1="150" y1="100" x2="156.3" y2="112.5" stroke="#b4232c" stroke-width="2"/>
  <circle cx="225.1" cy="62.4" r="3" fill="#b4232c"/>
  <circle cx="156.3" cy="112.5" r="3" fill="#b4232c"/>
  <text x="231.1" y="58.4" font-size="12" fill="#b4232c">6 q₁</text>
  <text x="162.3" y="124.5" font-size="12" fill="#b4232c">1 q₂</text>
  <text x="232" y="150" font-size="12" fill="#1f2a44">dashed: unit circle</text>
  <text x="232" y="168" font-size="12" fill="#1d6fd1">blue: its image</text>
  <text x="232" y="186" font-size="12" fill="#1f2a44">under A</text>
</svg>
```
:::

::: context rayleigh-name Lord Rayleigh's shortcut
John William Strutt, the third Baron Rayleigh, used this ratio in his book *The Theory of Sound* (1877) to estimate how fast things vibrate — strings, bells, beams. Guess the shape of the vibration, compute the quotient, and you get a frequency that is surprisingly close, even from a rough guess. Structural engineers still use Rayleigh's method to estimate the lowest vibration frequency of a rocket or a solar panel before a full computer model exists.
:::

::: context rayleigh-curve Watching the quotient sweep
Take the covariance $\mathbf{P} = \begin{pmatrix} 4 & 1.5 \\ 1.5 & 2 \end{pmatrix}$ from the last example and turn a unit vector $\mathbf{u}$ all the way around. The value $\mathbf{u}^\mathsf{T}\mathbf{P}\mathbf{u}$ rises and falls, but never leaves the band between the two eigenvalues. It touches the top at $28.2^\circ$ and the bottom at $118.2^\circ$ — the two eigenvector directions, exactly $90^\circ$ apart.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="180" x2="320" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="180" x2="50" y2="10" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="26.3" x2="320" y2="26.3" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <line x1="50" y1="141.7" x2="320" y2="141.7" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="50.0,52.0 54.5,47.2 59.0,42.7 63.5,38.7 68.0,35.2 72.5,32.3 77.0,29.9 81.5,28.1 86.0,26.9 90.5,26.4 95.0,26.4 99.5,27.1 104.0,28.5 108.5,30.4 113.0,32.9 117.5,36.0 122.0,39.6 126.5,43.7 131.0,48.2 135.5,53.2 140.0,58.4 144.5,64.0 149.0,69.7 153.5,75.7 158.0,81.7 162.5,87.7 167.0,93.7 171.5,99.6 176.0,105.3 180.5,110.8 185.0,116.0 189.5,120.8 194.0,125.3 198.5,129.3 203.0,132.8 207.5,135.7 212.0,138.1 216.5,139.9 221.0,141.1 225.5,141.6 230.0,141.6 234.5,140.9 239.0,139.5 243.5,137.6 248.0,135.1 252.5,132.0 257.0,128.4 261.5,124.3 266.0,119.8 270.5,114.8 275.0,109.6 279.5,104.0 284.0,98.3 288.5,92.3 293.0,86.3 297.5,80.3 302.0,74.3 306.5,68.4 311.0,62.7 315.5,57.2 320.0,52.0"/>
  <circle cx="92.2" cy="26.3" r="4" fill="#b4232c"/>
  <circle cx="227.2" cy="141.7" r="4" fill="#b4232c"/>
  <text x="44" y="30.3" font-size="11" text-anchor="end" fill="#1f2a44">4.80</text>
  <text x="44" y="145.7" font-size="11" text-anchor="end" fill="#1f2a44">1.20</text>
  <text x="44" y="184" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="50.0" y="196">0°</text><text x="117.5" y="196">45°</text><text x="185.0" y="196">90°</text><text x="252.5" y="196">135°</text><text x="320.0" y="196">180°</text>
  </g>
  <text x="100.2" y="18.3" font-size="11" fill="#b4232c">largest, at 28.2°</text>
  <text x="235.2" y="157.7" font-size="11" fill="#b4232c">smallest, at 118.2°</text>
  <text x="320" y="18" font-size="11" text-anchor="end" fill="#1d6fd1">uᵀPu</text>
  <text x="185" y="208" font-size="11" text-anchor="middle" fill="#1f2a44">direction of u, from east</text>
</svg>
```

At $0^\circ$ (due east) the curve reads $4$, the east variance; at $90^\circ$ it reads $2$, the north variance.
:::

::: context explorer-1 The satellite that changed its spin
America's first satellite, Explorer 1 (1958), was a long thin cylinder set spinning about its long axis — the axis with the *smallest* moment of inertia. Its flexible wire antennas flexed and slowly bled away energy. A spinning body that loses energy while keeping its angular momentum drifts toward the axis with the *largest* moment. Soon after launch Explorer 1 began to wobble, and it ended up in a flat spin, turning end over end. The lesson engineers took away: a spinner with flexible parts should spin about its major principal axis. Finding that axis is the eigenvector problem in the example.
:::

::: context covariance-ellipse The ellipse and its shadow
The blue ellipse is the one-sigma error ellipse from the example. Its long axis ($2.19\,\mathrm{m}$) points $28.2^\circ$ north of east; its short axis is $1.09\,\mathrm{m}$. The dashed lines mark the ellipse's shadow on the east axis: it reaches exactly $\pm 2\,\mathrm{m}$, which is $\sigma_E$. The diagonal of $\mathbf{P}$ gives you the shadows. The eigenvalues give you the ellipse.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="105" x2="260" y2="105" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="150" y1="185" x2="150" y2="25" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="264" y="109" font-size="12" fill="#1f2a44">east</text>
  <text x="150" y="18" font-size="12" text-anchor="middle" fill="#1f2a44">north</text>
  <ellipse cx="150" cy="105" rx="65.7" ry="32.8" transform="rotate(-28.16 150 105)" fill="#8fb8f0" fill-opacity="0.5" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="150" y1="105" x2="208.0" y2="74.0" stroke="#b4232c" stroke-width="2"/>
  <line x1="150" y1="105" x2="134.5" y2="76.1" stroke="#b4232c" stroke-width="2"/>
  <line x1="210" y1="40" x2="210" y2="170" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <line x1="90" y1="40" x2="90" y2="170" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <text x="214" y="170" font-size="11" fill="#6c7a93">σE = 2 m</text>
  <text x="212.0" y="68.0" font-size="11" fill="#b4232c">2.19 m</text>
  <text x="128.5" y="70.1" font-size="11" text-anchor="end" fill="#b4232c">1.09 m</text>
  <path d="M185,105 A35,35 0 0,0 180.9,88.5" fill="none" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="190" y="101" font-size="11" fill="#1f2a44">28.2°</text>
</svg>
```
:::

::: context eigh-lapack What eigh is doing underneath
NumPy does not compute eigenvalues itself. `np.linalg.eigh` hands the job to **LAPACK**, a library of linear-algebra routines first released in 1992 and used inside MATLAB, SciPy and Julia. LAPACK has separate routines for symmetric matrices. They first squeeze the matrix to a narrow three-diagonal form using rotations and reflections, which keep it symmetric, and then find the eigenvalues of that simpler matrix. Every step respects symmetry, which is why the results come out exactly real.
:::

::: context ulp A unit in the last place
A computer stores a number like $0.1$ with about $16$ significant decimal digits (a 64-bit "float64"). The smallest possible step in the last stored digit is a **unit in the last place**. Near $1$, that is about $2.2 \times 10^{-16}$. Nearly every arithmetic operation rounds its answer to the nearest storable number, so errors of a few units in the last place creep in everywhere. On their own they are harmless. The trouble starts when a later step magnifies them, which the next lesson shows happening inside a filter.
:::

::: context condition-bridge Coming up: the condition number
The ratio of the largest to the smallest eigenvalue of a symmetric positive matrix is its **condition number**. It measures how lopsided the ellipsoid is — and, it turns out, how many digits of accuracy you lose when you solve equations with that matrix. Roughly, you lose $\log_{10}$ of the condition number: here $\log_{10}2500 \approx 3.4$ digits out of float64's $16$. Lesson 10 makes this precise.
:::
