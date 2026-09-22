---
id: l08-singular-value-decomposition
title: The singular value decomposition
minutes: 22
covers:
  - singular value decomposition
---

Eigenvalues answer one question: in which directions does a square matrix act as a pure scaling? Most matrices a GNC engineer meets are not square. A measurement Jacobian $\mathbf{H}$ with three ranges and two position states is $3\times 2$; an observability matrix stacks many such blocks; a batch least-squares problem has hundreds of rows and a dozen columns. None of these has eigenvalues at all. The question that does make sense for any matrix is: which directions in the input space does it stretch the most, and by how much? The answer is the singular value decomposition.

The SVD writes any $m\times n$ matrix as $\mathbf{A} = \mathbf{U}\boldsymbol{\Sigma}\mathbf{V}^\mathsf{T}$: an orthogonal rotation of the input, a diagonal stretching, an orthogonal rotation of the output. The stretch factors are the singular values, and they carry everything you want to know. The largest is the matrix's norm. The number of nonzero ones is its rank. The smallest tells you how close the matrix is to losing rank, and its ratio to the largest is the condition number of Lesson 10. For a measurement geometry, the singular values say how well each direction of the state is observed, and the direction of the smallest is the one the sensors see worst.

This lesson proves the decomposition exists by building it from the spectral theorem, works two small examples by hand, reads the four fundamental subspaces off $\mathbf{U}$ and $\mathbf{V}$, and applies the result to a beacon geometry that goes from well-spread to clustered.

## The statement

::: key The singular value decomposition
Every real $m\times n$ matrix can be written $\mathbf{A} = \mathbf{U}\boldsymbol{\Sigma}\mathbf{V}^\mathsf{T}$ with $\mathbf{U}$ ($m\times m$) and $\mathbf{V}$ ($n\times n$) orthogonal and $\boldsymbol{\Sigma}$ ($m\times n$) diagonal with non-negative entries $\sigma_1 \ge \sigma_2 \ge \dots \ge 0$, the **singular values**. Every matrix — square or not, singular or not — has one. The columns $\mathbf{u}_i$ of $\mathbf{U}$ are the left singular vectors, the columns $\mathbf{v}_i$ of $\mathbf{V}$ the right singular vectors, and $\mathbf{A}\mathbf{v}_i = \sigma_i\mathbf{u}_i$.
:::

Read the factorisation as a recipe for applying $\mathbf{A}$ to a vector $\mathbf{x}$. First $\mathbf{V}^\mathsf{T}\mathbf{x}$: resolve $\mathbf{x}$ along the orthonormal directions $\mathbf{v}_1, \dots, \mathbf{v}_n$ in the input space, a pure rotation (or reflection) that changes no lengths. Then $\boldsymbol{\Sigma}$: scale the $i$-th component by $\sigma_i$, and — if $m \neq n$ — drop components or pad with zeros to change dimension. Then $\mathbf{U}$: rotate the result into position in the output space. Compare with the spectral theorem, $\mathbf{A} = \mathbf{Q}\boldsymbol{\Lambda}\mathbf{Q}^\mathsf{T}$: same shape, but the SVD allows two *different* rotations and insists that the scalings be non-negative. A symmetric PSD matrix has $\mathbf{U} = \mathbf{V} = \mathbf{Q}$ and $\sigma_i = \lambda_i$; a symmetric matrix with a negative eigenvalue has $\sigma_i = |\lambda_i|$ and $\mathbf{u}_i = -\mathbf{q}_i$ for that index; a general matrix has no eigen-structure to compare with, and the SVD is what replaces it.

Geometrically, $\mathbf{A}$ maps the unit sphere in $\mathbb{R}^n$ to an ellipsoid in $\mathbb{R}^m$ whose semi-axes are $\sigma_i\mathbf{u}_i$. The unit vector that gets stretched the most is $\mathbf{v}_1$, landing on $\sigma_1\mathbf{u}_1$; the one stretched the least is $\mathbf{v}_n$. Rotations have every $\sigma_i = 1$ and map the sphere to itself. A shear $\begin{pmatrix} 1 & 1 \\ 0 & 1 \end{pmatrix}$, which has both eigenvalues equal to $1$ and looks harmless, has singular values $1.618$ and $0.618$: it stretches one direction by the golden ratio and squashes another by its reciprocal, and the eigenvalues never mentioned it.

The rank-one form follows exactly as it did for the spectral theorem. Multiplying out column by column,

$$\mathbf{A} = \sum_{i=1}^{r}\sigma_i\,\mathbf{u}_i\mathbf{v}_i^\mathsf{T},$$

where $r$ is the number of nonzero singular values. Each term maps $\mathbf{v}_i$ to $\sigma_i\mathbf{u}_i$ and kills everything perpendicular to $\mathbf{v}_i$. The terms with $\sigma_i = 0$ contribute nothing, so the **reduced** or thin SVD keeps only the first $r$ columns of $\mathbf{U}$ and $\mathbf{V}$ and the $r\times r$ diagonal block of $\boldsymbol{\Sigma}$; `np.linalg.svd(A, full_matrices=False)` returns it with $\min(m, n)$ columns.

## Why it exists

The construction uses the two symmetric matrices you can always build from $\mathbf{A}$. The Gram matrix $\mathbf{A}^\mathsf{T}\mathbf{A}$ is $n\times n$, symmetric and PSD (Lesson 5), so by the spectral theorem it has an orthonormal eigenbasis $\mathbf{v}_1, \dots, \mathbf{v}_n$ with real eigenvalues $\lambda_i \ge 0$. Order them decreasingly and define $\sigma_i = \sqrt{\lambda_i}$. For each $i$ with $\sigma_i > 0$ define $\mathbf{u}_i = \mathbf{A}\mathbf{v}_i/\sigma_i$. These vectors are orthonormal:

$$\mathbf{u}_i^\mathsf{T}\mathbf{u}_j = \frac{\mathbf{v}_i^\mathsf{T}\mathbf{A}^\mathsf{T}\mathbf{A}\mathbf{v}_j}{\sigma_i\sigma_j} = \frac{\lambda_j\,\mathbf{v}_i^\mathsf{T}\mathbf{v}_j}{\sigma_i\sigma_j} = \begin{cases} 1 & i = j \\ 0 & i \neq j. \end{cases}$$

By definition $\mathbf{A}\mathbf{v}_i = \sigma_i\mathbf{u}_i$ for these indices, and for the indices with $\sigma_i = 0$ we have $\|\mathbf{A}\mathbf{v}_i\|^2 = \mathbf{v}_i^\mathsf{T}\mathbf{A}^\mathsf{T}\mathbf{A}\mathbf{v}_i = \lambda_i = 0$, so $\mathbf{A}\mathbf{v}_i = \mathbf{0} = \sigma_i\mathbf{u}_i$ for any choice of $\mathbf{u}_i$. Complete the $r$ orthonormal vectors $\mathbf{u}_i$ to an orthonormal basis of $\mathbb{R}^m$ by Gram–Schmidt. Then $\mathbf{A}\mathbf{V} = \mathbf{U}\boldsymbol{\Sigma}$ column by column, and multiplying on the right by $\mathbf{V}^\mathsf{T}$ gives $\mathbf{A} = \mathbf{U}\boldsymbol{\Sigma}\mathbf{V}^\mathsf{T}$.

The construction also tells you what the pieces are. The right singular vectors are the eigenvectors of $\mathbf{A}^\mathsf{T}\mathbf{A}$ and the singular values are the square roots of its eigenvalues. Symmetrically, $\mathbf{A}\mathbf{A}^\mathsf{T} = \mathbf{U}\boldsymbol{\Sigma}\boldsymbol{\Sigma}^\mathsf{T}\mathbf{U}^\mathsf{T}$, so the left singular vectors are the eigenvectors of $\mathbf{A}\mathbf{A}^\mathsf{T}$, with the same nonzero eigenvalues $\sigma_i^2$. The two Gram matrices have different sizes but share their nonzero spectrum. This is how to compute an SVD by hand; it is *not* how a library does it, because forming $\mathbf{A}^\mathsf{T}\mathbf{A}$ squares the condition number — Lesson 10 makes that precise — and a small singular value of $\mathbf{A}$ becomes a tiny eigenvalue of $\mathbf{A}^\mathsf{T}\mathbf{A}$ that round-off can no longer resolve. Production algorithms work on $\mathbf{A}$ directly with orthogonal transformations.

::: example A two-by-two SVD by hand
Let $\mathbf{A} = \begin{pmatrix} 2 & 2 \\ -1 & 1 \end{pmatrix}$. Then $\mathbf{A}^\mathsf{T}\mathbf{A} = \begin{pmatrix} 5 & 3 \\ 3 & 5 \end{pmatrix}$, with trace $10$ and determinant $16$, so $\lambda = 8$ and $2$: $\sigma_1 = \sqrt{8} = 2.828$, $\sigma_2 = \sqrt{2} = 1.414$. Check against the determinant: $|\det\mathbf{A}| = |2 + 2| = 4 = \sigma_1\sigma_2$, as it must be, since $|\det\mathbf{A}| = |\det\mathbf{U}|\det\boldsymbol{\Sigma}|\det\mathbf{V}| = \prod\sigma_i$.

Eigenvectors of $\mathbf{A}^\mathsf{T}\mathbf{A}$: for $\lambda = 8$, $(5 - 8)v_1 + 3v_2 = 0$ gives $\mathbf{v}_1 = (1, 1)^\mathsf{T}/\sqrt{2}$; for $\lambda = 2$, $\mathbf{v}_2 = (1, -1)^\mathsf{T}/\sqrt{2}$. Then $\mathbf{u}_1 = \mathbf{A}\mathbf{v}_1/\sigma_1 = (4, 0)^\mathsf{T}/(\sqrt{2}\cdot 2\sqrt{2}) = (1, 0)^\mathsf{T}$ and $\mathbf{u}_2 = \mathbf{A}\mathbf{v}_2/\sigma_2 = (0, -2)^\mathsf{T}/(\sqrt{2}\cdot\sqrt{2}) = (0, -1)^\mathsf{T}$. So

$$\mathbf{A} = \begin{pmatrix} 1 & 0 \\ 0 & -1 \end{pmatrix}\begin{pmatrix} 2.828 & 0 \\ 0 & 1.414 \end{pmatrix}\frac{1}{\sqrt{2}}\begin{pmatrix} 1 & 1 \\ 1 & -1 \end{pmatrix}.$$

Read right to left: $\mathbf{V}^\mathsf{T}$ rotates the input by $-45^\circ$ (and reflects), $\boldsymbol{\Sigma}$ stretches the first axis by $2.828$ and the second by $1.414$, $\mathbf{U}$ flips the second axis. The unit circle becomes an ellipse with semi-axes $2.828$ along $\mathbf{u}_1 = \hat{\mathbf{x}}$ and $1.414$ along $\hat{\mathbf{y}}$, and the input direction that is stretched most is the diagonal $(1, 1)/\sqrt{2}$. For contrast, the eigenvalues of $\mathbf{A}$ itself are $\tfrac{3}{2} \pm i\tfrac{\sqrt{7}}{2}$, complex, and say nothing about stretching.
:::

::: example A tall matrix: three ranges, two states
Let $\mathbf{A} = \begin{pmatrix} 1 & 1 \\ 1 & 0 \\ 0 & 1 \end{pmatrix}$, three measurements of two unknowns. $\mathbf{A}^\mathsf{T}\mathbf{A} = \begin{pmatrix} 2 & 1 \\ 1 & 2 \end{pmatrix}$ has eigenvalues $3$ and $1$, so $\sigma_1 = \sqrt{3} = 1.732$ and $\sigma_2 = 1$, with $\mathbf{v}_1 = (1, 1)^\mathsf{T}/\sqrt{2}$ and $\mathbf{v}_2 = (1, -1)^\mathsf{T}/\sqrt{2}$. The left singular vectors:

$$\mathbf{u}_1 = \frac{\mathbf{A}\mathbf{v}_1}{\sigma_1} = \frac{(2, 1, 1)^\mathsf{T}}{\sqrt{2}\sqrt{3}} = \frac{1}{\sqrt{6}}\begin{pmatrix} 2 \\ 1 \\ 1 \end{pmatrix}, \qquad \mathbf{u}_2 = \frac{\mathbf{A}\mathbf{v}_2}{\sigma_2} = \frac{1}{\sqrt{2}}\begin{pmatrix} 0 \\ 1 \\ -1 \end{pmatrix}.$$

They are orthonormal: $\mathbf{u}_1\cdot\mathbf{u}_2 = (0 + 1 - 1)/\sqrt{12} = 0$. The full $\mathbf{U}$ needs a third column perpendicular to both, $\mathbf{u}_3 = (1, -1, -1)^\mathsf{T}/\sqrt{3}$, and $\mathbf{A}^\mathsf{T}\mathbf{u}_3 = (1 - 1, 1 - 1)^\mathsf{T} = \mathbf{0}$: the third left singular vector is the direction in measurement space that no state can produce. The reduced SVD drops it and writes $\mathbf{A} = \sigma_1\mathbf{u}_1\mathbf{v}_1^\mathsf{T} + \sigma_2\mathbf{u}_2\mathbf{v}_2^\mathsf{T}$; the first term alone is $\sqrt{3}\cdot\tfrac{1}{\sqrt{6}}\tfrac{1}{\sqrt{2}}(2, 1, 1)^\mathsf{T}(1, 1) = \tfrac{1}{2}\begin{pmatrix} 2 & 2 \\ 1 & 1 \\ 1 & 1 \end{pmatrix}$, and adding the second, $\tfrac{1}{2}\begin{pmatrix} 0 & 0 \\ 1 & -1 \\ -1 & 1 \end{pmatrix}$, recovers $\mathbf{A}$. Frobenius check: $\|\mathbf{A}\|_F^2 = 4 = \sigma_1^2 + \sigma_2^2 = 3 + 1$.
:::

## What the SVD tells you

**Rank.** The rank of $\mathbf{A}$ is the number $r$ of nonzero singular values, because $\mathbf{U}$ and $\mathbf{V}$ are invertible and the rank of $\boldsymbol{\Sigma}$ is the count of its nonzero entries. This is the numerically meaningful definition of rank: elimination decides rank by whether a pivot is exactly zero, which floating point never delivers, whereas singular values come with magnitudes, and a $\sigma_i$ of $10^{-14}$ next to a $\sigma_1$ of order one is a zero that round-off has smeared. Lesson 9 turns this into the notion of numerical rank.

**The four fundamental subspaces.** With the singular vectors ordered so that $\sigma_1, \dots, \sigma_r > 0$:

- $\mathbf{u}_1, \dots, \mathbf{u}_r$ span the column space of $\mathbf{A}$, the outputs the matrix can produce;
- $\mathbf{u}_{r+1}, \dots, \mathbf{u}_m$ span the left null space, outputs no input can produce — the residual directions in a least-squares problem;
- $\mathbf{v}_1, \dots, \mathbf{v}_r$ span the row space, the inputs the matrix responds to;
- $\mathbf{v}_{r+1}, \dots, \mathbf{v}_n$ span the null space: $\mathbf{A}\mathbf{v}_i = \mathbf{0}$, inputs the matrix cannot see.

Linear Algebra I established that these four spaces exist and that the pairs are orthogonal complements. The SVD hands you an orthonormal basis for each one, which is why `scipy.linalg.null_space` and `orth` are thin wrappers around it. For a measurement Jacobian $\mathbf{H}$, the null space of $\mathbf{H}$ is the set of state errors that leave every measurement unchanged — the unobservable directions — and its basis is the last columns of $\mathbf{V}$.

**Norms.** The 2-norm of a matrix is its largest stretch, $\|\mathbf{A}\|_2 = \max_{\|\mathbf{x}\| = 1}\|\mathbf{A}\mathbf{x}\| = \sigma_1$, because $\mathbf{U}$ and $\mathbf{V}^\mathsf{T}$ preserve length and the diagonal $\boldsymbol{\Sigma}$ stretches a unit vector by at most $\sigma_1$, achieving it at $\mathbf{v}_1$. The Frobenius norm is $\|\mathbf{A}\|_F^2 = \sum_{ij}a_{ij}^2 = \operatorname{tr}(\mathbf{A}^\mathsf{T}\mathbf{A}) = \sum_i\sigma_i^2$, the trace being the sum of the eigenvalues. And $|\det\mathbf{A}| = \prod_i\sigma_i$ for a square matrix, which is why the determinant measures volume change but not conditioning: $\sigma_1 = 10^3$ and $\sigma_2 = 10^{-3}$ give determinant one.

**Best low-rank approximation.** Truncating the rank-one sum after $k$ terms, $\mathbf{A}_k = \sum_{i \le k}\sigma_i\mathbf{u}_i\mathbf{v}_i^\mathsf{T}$, gives the closest rank-$k$ matrix to $\mathbf{A}$ in both the 2-norm and the Frobenius norm, with error $\|\mathbf{A} - \mathbf{A}_k\|_2 = \sigma_{k+1}$. This is the Eckart–Young theorem, and it is the basis of every SVD-based data compression, of principal component analysis, and of the rank truncation in Lesson 9's pseudoinverse. The distance from $\mathbf{A}$ to the nearest rank-deficient matrix is $\sigma_n$, the smallest singular value: that is the precise sense in which $\sigma_{\min}$ measures how close a matrix is to singular.

::: key Reading the singular values
$\operatorname{rank}\mathbf{A}$ = number of nonzero $\sigma_i$; $\lVert\mathbf{A}\rVert_2 = \sigma_1$; $\lVert\mathbf{A}\rVert_F^2 = \sum\sigma_i^2$; $\lvert\det\mathbf{A}\rvert = \prod\sigma_i$; the distance to the nearest singular matrix is $\sigma_{\min}$; the last columns of $\mathbf{V}$ span the null space and the last columns of $\mathbf{U}$ the left null space.
:::

## Singular values as observability

Take the range-measurement Jacobian of Lesson 7: one row per beacon, each row the unit line-of-sight vector $\hat{\mathbf{e}}_i^\mathsf{T}$ from receiver to beacon, so $\mathbf{H}$ is $m\times 2$ for $m$ beacons in the plane. A small position error $\boldsymbol{\delta}$ produces the range changes $\mathbf{H}\boldsymbol{\delta}$, and the SVD of $\mathbf{H}$ says exactly how visible each direction of $\boldsymbol{\delta}$ is: an error along $\mathbf{v}_1$ shows up in the ranges with gain $\sigma_1$, an error along $\mathbf{v}_2$ with gain $\sigma_2$. If $\sigma_2$ is small, errors along $\mathbf{v}_2$ barely change the measurements, so the measurements barely constrain that direction. The Gram matrix $\mathbf{H}^\mathsf{T}\mathbf{H} = \mathbf{V}\boldsymbol{\Sigma}^\mathsf{T}\boldsymbol{\Sigma}\mathbf{V}^\mathsf{T}$ is the information matrix for unit-variance range noise, and its inverse, the estimate covariance, has eigenvalues $1/\sigma_i^2$ along the same $\mathbf{v}_i$: the one-sigma error ellipse has semi-axes $1/\sigma_i$.

::: example Well-spread versus clustered beacons
Three beacons at bearings $0^\circ$, $120^\circ$ and $240^\circ$ from the receiver give the rows $(1, 0)$, $(-0.5, 0.866)$ and $(-0.5, -0.866)$. Then $\mathbf{H}^\mathsf{T}\mathbf{H} = \begin{pmatrix} 1 + 0.25 + 0.25 & 0 \\ 0 & 0.75 + 0.75 \end{pmatrix} = 1.5\,\mathbf{I}$, so both singular values are $\sqrt{1.5} = 1.225$, every direction is observed equally well, and for range noise of $\sigma = 1\,\mathrm{m}$ the position error is a circle of radius $1/1.225 = 0.816\,\mathrm{m}$.

Now cluster the beacons at $0^\circ$, $5^\circ$ and $10^\circ$. The rows are $(1, 0)$, $(0.9962, 0.0872)$ and $(0.9848, 0.1736)$, and

$$\mathbf{H}^\mathsf{T}\mathbf{H} = \begin{pmatrix} 2.962 & 0.258 \\ 0.258 & 0.0377 \end{pmatrix},$$

with eigenvalues $2.985$ and $0.0152$, so $\sigma_1 = 1.728$ and $\sigma_2 = 0.1233$. The along-beacon direction ($\mathbf{v}_1$, about $5^\circ$ from the $x$-axis) is observed slightly better than before, because all three beacons now pull in nearly the same direction. The cross direction $\mathbf{v}_2$ is observed fourteen times worse. With the same $1\,\mathrm{m}$ range noise the error ellipse has semi-axes $1/1.728 = 0.579\,\mathrm{m}$ along the line to the beacons and $1/0.1233 = 8.11\,\mathrm{m}$ across it. The ratio $\sigma_1/\sigma_2 = 14.0$ is the condition number of $\mathbf{H}$, and the square root of the sum of the covariance eigenvalues, $\sqrt{0.579^2 + 8.11^2} = 8.13$, is what GPS calls the dilution of precision — the factor by which geometry inflates ranging error into position error. For the spread geometry it was $\sqrt{2\times 0.816^2} = 1.15$.
:::

::: warning Singular values are not eigenvalues
For a square matrix the two sets coincide only when the matrix is symmetric PSD. In general $\sigma_1 \ge |\lambda|_{\max}$ and $\sigma_n \le |\lambda|_{\min}$, and the gap can be arbitrary: the shear above has eigenvalues $1, 1$ and singular values $1.618, 0.618$, and a rotation has singular values $1, 1$ and complex eigenvalues. Use eigenvalues for dynamics and stability (does $e^{\mathbf{A}t}$ decay?), and singular values for geometry, conditioning and rank (how much does $\mathbf{A}$ stretch?). The product of the eigenvalues and the product of the singular values do agree in magnitude, since both equal $|\det\mathbf{A}|$.
:::

## The SVD in NumPy

```python
import numpy as np

A = np.array([[1.0, 1.0], [1.0, 0.0], [0.0, 1.0]])
U, s, Vt = np.linalg.svd(A, full_matrices=False)   # reduced: U is 3x2
print(s)                                             # [1.73205081 1.        ]
print(np.allclose(U @ np.diag(s) @ Vt, A))           # True
print(np.linalg.matrix_rank(A))                      # 2  (counts s > tol)
print(np.linalg.norm(A, 2), s[0])                    # 1.7320508 1.7320508
Vt_full = np.linalg.svd(A)[2]                        # full: V is n x n
null_dirs = Vt_full[np.sum(s > 1e-12):]              # rows spanning null(A): empty here
```

`svd` returns $\mathbf{V}^\mathsf{T}$, not $\mathbf{V}$, and the singular values as a 1-D array in decreasing order; the reconstruction needs `np.diag(s)` or the broadcast `(U * s) @ Vt`. The algorithm behind it works on $\mathbf{A}$ directly with Householder reflections and never forms $\mathbf{A}^\mathsf{T}\mathbf{A}$, so the small singular values it returns are as accurate as the large ones relative to $\|\mathbf{A}\|$.

## Check yourself

::: check
Find the singular values of $\mathbf{A} = \begin{pmatrix} 3 & 0 \\ 0 & -2 \end{pmatrix}$ and $\mathbf{B} = \begin{pmatrix} 0 & 3 \\ 2 & 0 \end{pmatrix}$, and write an SVD of $\mathbf{B}$.
:::

::: answer
$\mathbf{A}^\mathsf{T}\mathbf{A} = \operatorname{diag}(9, 4)$, so $\sigma_1 = 3$, $\sigma_2 = 2$: the singular values are the absolute values of the eigenvalues, and $\mathbf{U} = \operatorname{diag}(1, -1)$ absorbs the sign. $\mathbf{B}^\mathsf{T}\mathbf{B} = \operatorname{diag}(4, 9)$, so again $\sigma_1 = 3$, $\sigma_2 = 2$, but now $\mathbf{v}_1 = \mathbf{e}_2$ (the eigenvector for $9$) and $\mathbf{v}_2 = \mathbf{e}_1$. Then $\mathbf{u}_1 = \mathbf{B}\mathbf{e}_2/3 = \mathbf{e}_1$ and $\mathbf{u}_2 = \mathbf{B}\mathbf{e}_1/2 = \mathbf{e}_2$, giving $\mathbf{B} = \mathbf{I}\operatorname{diag}(3, 2)\begin{pmatrix} 0 & 1 \\ 1 & 0 \end{pmatrix}$: a swap of the input axes, then a stretch. $\mathbf{B}$'s eigenvalues are $\pm\sqrt{6}$, which tell you nothing about the stretches $3$ and $2$.
:::

::: check
A $4\times 3$ matrix has singular values $5$, $2$ and $0$. State its rank, the dimensions of its four fundamental subspaces, its 2-norm and its Frobenius norm.
:::

::: answer
Rank $2$. Column space: dimension $2$ in $\mathbb{R}^4$, spanned by $\mathbf{u}_1, \mathbf{u}_2$. Left null space: $4 - 2 = 2$, spanned by $\mathbf{u}_3, \mathbf{u}_4$. Row space: $2$ in $\mathbb{R}^3$, spanned by $\mathbf{v}_1, \mathbf{v}_2$. Null space: $3 - 2 = 1$, spanned by $\mathbf{v}_3$. $\|\mathbf{A}\|_2 = 5$ and $\|\mathbf{A}\|_F = \sqrt{25 + 4 + 0} = \sqrt{29} = 5.39$. The nearest rank-one matrix is $5\,\mathbf{u}_1\mathbf{v}_1^\mathsf{T}$, at 2-norm distance $2$.
:::

::: check
Explain, using the SVD, why $\mathbf{A}^\mathsf{T}\mathbf{A}$ and $\mathbf{A}\mathbf{A}^\mathsf{T}$ have the same nonzero eigenvalues even though they have different sizes.
:::

::: answer
$\mathbf{A}^\mathsf{T}\mathbf{A} = \mathbf{V}\boldsymbol{\Sigma}^\mathsf{T}\mathbf{U}^\mathsf{T}\mathbf{U}\boldsymbol{\Sigma}\mathbf{V}^\mathsf{T} = \mathbf{V}(\boldsymbol{\Sigma}^\mathsf{T}\boldsymbol{\Sigma})\mathbf{V}^\mathsf{T}$ and $\mathbf{A}\mathbf{A}^\mathsf{T} = \mathbf{U}(\boldsymbol{\Sigma}\boldsymbol{\Sigma}^\mathsf{T})\mathbf{U}^\mathsf{T}$. Both are spectral decompositions. $\boldsymbol{\Sigma}^\mathsf{T}\boldsymbol{\Sigma}$ is $n\times n$ and $\boldsymbol{\Sigma}\boldsymbol{\Sigma}^\mathsf{T}$ is $m\times m$, but both are diagonal with the entries $\sigma_1^2, \dots, \sigma_r^2$ followed by zeros — the larger one has more zeros. So the nonzero eigenvalues agree, with eigenvectors $\mathbf{v}_i$ for one and $\mathbf{u}_i$ for the other, and the extra eigenvalues of the bigger matrix are all zero.
:::

::: check
Two beacons lie in exactly the same direction from a receiver. What are the singular values of the $2\times 2$ Jacobian $\mathbf{H}$, and what does the receiver learn?
:::

::: answer
Both rows equal the same unit vector $\hat{\mathbf{e}}^\mathsf{T}$, so $\mathbf{H} = \mathbf{1}\hat{\mathbf{e}}^\mathsf{T}$ is rank one. $\mathbf{H}^\mathsf{T}\mathbf{H} = 2\hat{\mathbf{e}}\hat{\mathbf{e}}^\mathsf{T}$ has eigenvalues $2$ and $0$, so $\sigma_1 = \sqrt{2}$ and $\sigma_2 = 0$, with $\mathbf{v}_1 = \hat{\mathbf{e}}$ and $\mathbf{v}_2 \perp \hat{\mathbf{e}}$. The receiver learns its position along the line of sight — twice over, which is why $\sigma_1$ is $\sqrt{2}$ rather than $1$ — and nothing at all across it. The cross-track direction is in the null space of $\mathbf{H}$: unobservable from this pair, and the error ellipse's semi-axis $1/\sigma_2$ is infinite.
:::

::: check
A $2\times 2$ matrix has $\det\mathbf{A} = 1$ and $\|\mathbf{A}\|_2 = 100$. What is its smallest singular value, and what does this say about using the determinant to judge whether a matrix is nearly singular?
:::

::: answer
$\sigma_1\sigma_2 = |\det\mathbf{A}| = 1$ and $\sigma_1 = 100$, so $\sigma_2 = 0.01$. The matrix is within $0.01$ of a singular matrix in the 2-norm — it squashes the direction $\mathbf{v}_2$ by a factor of $100$ — while its determinant is a perfectly healthy $1$. The determinant measures volume, and a long thin ellipse can have the same area as a circle. Nearness to singularity is measured by $\sigma_{\min}$, or by the ratio $\sigma_1/\sigma_2 = 10^4$, the condition number of Lesson 10.
:::

## Summary

| Item | Statement |
| --- | --- |
| SVD | $\mathbf{A} = \mathbf{U}\boldsymbol{\Sigma}\mathbf{V}^\mathsf{T}$, $\mathbf{U}$, $\mathbf{V}$ orthogonal, $\boldsymbol{\Sigma}$ diagonal with $\sigma_1 \ge \sigma_2 \ge \dots \ge 0$; exists for every matrix |
| Action | $\mathbf{A}\mathbf{v}_i = \sigma_i\mathbf{u}_i$; rotate ($\mathbf{V}^\mathsf{T}$), stretch ($\boldsymbol{\Sigma}$), rotate ($\mathbf{U}$); unit sphere to ellipsoid with semi-axes $\sigma_i\mathbf{u}_i$ |
| Rank-one form | $\mathbf{A} = \sum_{i \le r}\sigma_i\mathbf{u}_i\mathbf{v}_i^\mathsf{T}$; reduced SVD keeps $r$ columns |
| Construction | $\mathbf{v}_i$ eigenvectors of $\mathbf{A}^\mathsf{T}\mathbf{A}$, $\sigma_i = \sqrt{\lambda_i}$, $\mathbf{u}_i = \mathbf{A}\mathbf{v}_i/\sigma_i$; $\mathbf{u}_i$ eigenvectors of $\mathbf{A}\mathbf{A}^\mathsf{T}$ |
| Rank | number of nonzero singular values |
| Subspaces | column space $= \operatorname{span}(\mathbf{u}_1..\mathbf{u}_r)$, left null $= \operatorname{span}(\mathbf{u}_{r+1}..\mathbf{u}_m)$, row space $= \operatorname{span}(\mathbf{v}_1..\mathbf{v}_r)$, null $= \operatorname{span}(\mathbf{v}_{r+1}..\mathbf{v}_n)$ |
| Norms | $\lVert\mathbf{A}\rVert_2 = \sigma_1$; $\lVert\mathbf{A}\rVert_F^2 = \sum\sigma_i^2$; $\lvert\det\mathbf{A}\rvert = \prod\sigma_i$ |
| Low rank | $\mathbf{A}_k = \sum_{i \le k}\sigma_i\mathbf{u}_i\mathbf{v}_i^\mathsf{T}$ is the best rank-$k$ approximation, error $\sigma_{k+1}$; distance to singular $= \sigma_{\min}$ |
| Observability | for $\mathbf{H}$ with unit line-of-sight rows, error ellipse semi-axes $1/\sigma_i$ along $\mathbf{v}_i$; null space of $\mathbf{H}$ = unobservable directions |
| Symmetric case | PSD: $\mathbf{U} = \mathbf{V} = \mathbf{Q}$, $\sigma_i = \lambda_i$; in general $\sigma_i = \lvert\lambda_i\rvert$ only for symmetric matrices |
| NumPy | `np.linalg.svd(A, full_matrices=False)` returns `U, s, Vt` |

The next lesson inverts the decomposition. Reversing each nonzero stretch and leaving the zero ones alone gives the pseudoinverse $\mathbf{A}^+ = \mathbf{V}\boldsymbol{\Sigma}^+\mathbf{U}^\mathsf{T}$, which solves least-squares problems even when $\mathbf{A}$ is rank deficient and the normal equations are not solvable at all.
