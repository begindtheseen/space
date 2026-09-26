---
id: l08-singular-value-decomposition
title: The singular value decomposition
minutes: 20
covers:
  - singular value decomposition
---

Press a round ball of pizza dough flat with a rolling pin. Roll it one way and it stretches into an oval. However you turn the dough first and whichever way you roll, the result is always the same kind of shape: an oval with a longest direction and a shortest one. That picture — turn, stretch, turn — is the whole of this lesson, and it holds for every matrix there is.

Eigenvalues answered one question: in which directions does a *square* matrix act as a pure scaling? But most matrices a GNC engineer meets are not square. A measurement Jacobian $\mathbf{H}$ with three ranges and two position states is $3\times 2$. An observability matrix stacks many such blocks. A batch least-squares problem has hundreds of rows and a dozen columns. None of these has eigenvalues at all. The question that makes sense for *any* matrix is this: which input directions does it stretch the most, and by how much? The answer is the **singular value decomposition**, or **SVD**.

The stretch factors are called the **singular values**, and they carry nearly everything you want to know. The largest is the matrix's size, its norm. The number of nonzero ones is its rank. The smallest says how close the matrix is to losing rank, and the ratio of largest to smallest is the condition number of Lesson 10. For a measurement geometry, the singular values say how well each direction of the state is seen, and the direction of the smallest is the one the sensors see worst.

This lesson builds the SVD from the spectral theorem, works two small examples by hand, reads the four fundamental subspaces off it, and uses it on a set of beacons that goes from well spread to bunched together.

## The statement

::: key The singular value decomposition
Every real $m\times n$ matrix can be written $\mathbf{A} = \mathbf{U}\boldsymbol{\Sigma}\mathbf{V}^\mathsf{T}$ with $\mathbf{U}$ ($m\times m$) and $\mathbf{V}$ ($n\times n$) orthogonal and $\boldsymbol{\Sigma}$ ($m\times n$) diagonal with non-negative entries $\sigma_1 \ge \sigma_2 \ge \dots \ge 0$, the **singular values**. Every matrix — square or not, singular or not — has one. The columns $\mathbf{u}_i$ of $\mathbf{U}$ are the left singular vectors, the columns $\mathbf{v}_i$ of $\mathbf{V}$ the right singular vectors, and $\mathbf{A}\mathbf{v}_i = \sigma_i\mathbf{u}_i$.
:::

Read $\boldsymbol{\Sigma}$ as "capital sigma" and $\sigma_i$ as "sigma i". An **[[orthogonal matrix|orthogonal-recap]]** is one whose columns are perpendicular unit vectors; multiplying by it turns (or mirror-flips) a vector without changing its length.

### Turn, stretch, turn

Read the factorization right to left, as a recipe for computing $\mathbf{A}\mathbf{x}$.

1. **Turn.** $\mathbf{V}^\mathsf{T}\mathbf{x}$ measures $\mathbf{x}$ along the perpendicular directions $\mathbf{v}_1, \dots, \mathbf{v}_n$. It is a rotation (or a reflection) that changes no lengths.
2. **Stretch.** $\boldsymbol{\Sigma}$ multiplies the $i$-th component by $\sigma_i$. If $m \neq n$, it also drops components or pads with zeros, to change the number of dimensions.
3. **Turn.** $\mathbf{U}$ rotates the result into place in the output space.

The [[three steps, drawn|three-steps]] for a $2\times 2$ example appear in the notes.

Compare the spectral theorem of Lesson 4, $\mathbf{A} = \mathbf{Q}\boldsymbol{\Lambda}\mathbf{Q}^\mathsf{T}$. The shape is the same, but the SVD allows two *different* rotations, and it insists that the stretches are never negative. For a symmetric PSD matrix the two coincide: $\mathbf{U} = \mathbf{V} = \mathbf{Q}$ and $\sigma_i = \lambda_i$. For a symmetric matrix with a negative eigenvalue, $\sigma_i = |\lambda_i|$, and $\mathbf{u}_i = -\mathbf{q}_i$ for that index absorbs the sign. A general matrix has no such eigen-structure to compare with; the SVD is what replaces it.

### The circle becomes an ellipse

In pictures: $\mathbf{A}$ maps the unit sphere in $\mathbb{R}^n$ (every vector of length one) to an **ellipsoid** in $\mathbb{R}^m$ — a stretched sphere — whose semi-axes are $\sigma_i\mathbf{u}_i$. The unit vector stretched the most is $\mathbf{v}_1$, and it lands on $\sigma_1\mathbf{u}_1$. The one stretched the least is $\mathbf{v}_n$.

A rotation has every $\sigma_i = 1$ and maps the sphere to itself. Now take the **shear** $\begin{pmatrix} 1 & 1 \\ 0 & 1 \end{pmatrix}$, which slides the top of a square sideways like a deck of cards. Both its eigenvalues equal $1$, so it looks harmless. But its singular values are $1.618$ and $0.618$. It stretches one direction by the **[[golden ratio|golden-shear]]** and squashes another by its reciprocal. The eigenvalues never mentioned it.

### The sum-of-pieces form

Multiplying out $\mathbf{U}\boldsymbol{\Sigma}\mathbf{V}^\mathsf{T}$ column by column, as you did for the spectral theorem, gives

$$\mathbf{A} = \sum_{i=1}^{r}\sigma_i\,\mathbf{u}_i\mathbf{v}_i^\mathsf{T},$$

where $r$ is the number of nonzero singular values. Each piece $\mathbf{u}_i\mathbf{v}_i^\mathsf{T}$ is a **[[rank-one matrix|outer-product]]**. It sends $\mathbf{v}_i$ to $\sigma_i\mathbf{u}_i$ and sends everything perpendicular to $\mathbf{v}_i$ to zero.

The pieces with $\sigma_i = 0$ add nothing. So the **reduced** (or thin) SVD keeps only the first $r$ columns of $\mathbf{U}$ and $\mathbf{V}$ and the $r\times r$ top-left block of $\boldsymbol{\Sigma}$. In NumPy, `np.linalg.svd(A, full_matrices=False)` returns the reduced form with $\min(m, n)$ columns.

## Why it exists

The recipe for building an SVD uses the two symmetric matrices you can always make from $\mathbf{A}$.

**Step 1: the right singular vectors.** The Gram matrix $\mathbf{A}^\mathsf{T}\mathbf{A}$ is $n\times n$, symmetric and PSD (Lesson 5). By the spectral theorem it has perpendicular unit eigenvectors $\mathbf{v}_1, \dots, \mathbf{v}_n$ with real eigenvalues $\lambda_i \ge 0$. Put them in decreasing order and define

$$\sigma_i = \sqrt{\lambda_i}.$$

**Step 2: the left singular vectors.** For each $i$ with $\sigma_i > 0$, define $\mathbf{u}_i = \mathbf{A}\mathbf{v}_i/\sigma_i$. These come out perpendicular unit vectors:

$$\mathbf{u}_i^\mathsf{T}\mathbf{u}_j = \frac{\mathbf{v}_i^\mathsf{T}\mathbf{A}^\mathsf{T}\mathbf{A}\mathbf{v}_j}{\sigma_i\sigma_j} = \frac{\lambda_j\,\mathbf{v}_i^\mathsf{T}\mathbf{v}_j}{\sigma_i\sigma_j} = \begin{cases} 1 & i = j \\ 0 & i \neq j. \end{cases}$$

(The middle step uses $\mathbf{A}^\mathsf{T}\mathbf{A}\mathbf{v}_j = \lambda_j\mathbf{v}_j$. The last step uses $\mathbf{v}_i^\mathsf{T}\mathbf{v}_j = 0$ for $i \ne j$, and $\lambda_i/\sigma_i^2 = 1$ for $i = j$.)

**Step 3: the zero directions.** For each $i$ with $\sigma_i = 0$, the length of $\mathbf{A}\mathbf{v}_i$ is zero: $\|\mathbf{A}\mathbf{v}_i\|^2 = \mathbf{v}_i^\mathsf{T}\mathbf{A}^\mathsf{T}\mathbf{A}\mathbf{v}_i = \lambda_i = 0$. So $\mathbf{A}\mathbf{v}_i = \mathbf{0} = \sigma_i\mathbf{u}_i$ whatever $\mathbf{u}_i$ you pick.

**Step 4: finish.** Fill out the $r$ vectors $\mathbf{u}_i$ to a full set of $m$ perpendicular unit vectors with **[[Gram–Schmidt|gram-schmidt]]**. Now $\mathbf{A}\mathbf{v}_i = \sigma_i\mathbf{u}_i$ for every column, which in matrix form is $\mathbf{A}\mathbf{V} = \mathbf{U}\boldsymbol{\Sigma}$. Multiply on the right by $\mathbf{V}^\mathsf{T}$ (and use $\mathbf{V}\mathbf{V}^\mathsf{T} = \mathbf{I}$) to get $\mathbf{A} = \mathbf{U}\boldsymbol{\Sigma}\mathbf{V}^\mathsf{T}$.

The construction also tells you what the pieces are. The right singular vectors are the eigenvectors of $\mathbf{A}^\mathsf{T}\mathbf{A}$, and the singular values are the square roots of its eigenvalues. The other way round, $\mathbf{A}\mathbf{A}^\mathsf{T} = \mathbf{U}\boldsymbol{\Sigma}\boldsymbol{\Sigma}^\mathsf{T}\mathbf{U}^\mathsf{T}$, so the left singular vectors are the eigenvectors of $\mathbf{A}\mathbf{A}^\mathsf{T}$, with the same nonzero eigenvalues $\sigma_i^2$. The two Gram matrices have different sizes but share their nonzero eigenvalues.

This is how to compute an SVD by hand. It is *not* how a library does it. Forming $\mathbf{A}^\mathsf{T}\mathbf{A}$ squares the condition number — Lesson 10 makes that precise — so a small singular value of $\mathbf{A}$ becomes a tiny eigenvalue of $\mathbf{A}^\mathsf{T}\mathbf{A}$ that round-off can no longer resolve. Production algorithms work on $\mathbf{A}$ directly, with orthogonal transformations.

::: example A two-by-two SVD by hand
Let $\mathbf{A} = \begin{pmatrix} 2 & 2 \\ -1 & 1 \end{pmatrix}$.

**Singular values.** Multiply out the Gram matrix: $\mathbf{A}^\mathsf{T}\mathbf{A} = \begin{pmatrix} 5 & 3 \\ 3 & 5 \end{pmatrix}$. Its trace is $10$ and its determinant is $25 - 9 = 16$, so its eigenvalues add to $10$ and multiply to $16$: $\lambda = 8$ and $2$. Then $\sigma_1 = \sqrt{8} = 2.828$ and $\sigma_2 = \sqrt{2} = 1.414$.

Check against the determinant: $|\det\mathbf{A}| = |2 + 2| = 4$, and $\sigma_1\sigma_2 = \sqrt{16} = 4$. It must match, because $|\det\mathbf{A}| = |\det\mathbf{U}|\cdot\det\boldsymbol{\Sigma}\cdot|\det\mathbf{V}| = \prod\sigma_i$ — orthogonal matrices have determinant $\pm 1$.

**Right singular vectors.** For $\lambda = 8$: $(5 - 8)v_1 + 3v_2 = 0$ gives $v_1 = v_2$, so $\mathbf{v}_1 = (1, 1)^\mathsf{T}/\sqrt{2}$. For $\lambda = 2$, the perpendicular direction: $\mathbf{v}_2 = (1, -1)^\mathsf{T}/\sqrt{2}$.

**Left singular vectors.** Apply $\mathbf{A}$ and divide by $\sigma$:

$$\mathbf{u}_1 = \frac{\mathbf{A}\mathbf{v}_1}{\sigma_1} = \frac{(4, 0)^\mathsf{T}}{\sqrt{2}\cdot 2\sqrt{2}} = \begin{pmatrix} 1 \\ 0 \end{pmatrix}, \qquad \mathbf{u}_2 = \frac{\mathbf{A}\mathbf{v}_2}{\sigma_2} = \frac{(0, -2)^\mathsf{T}}{\sqrt{2}\cdot\sqrt{2}} = \begin{pmatrix} 0 \\ -1 \end{pmatrix}.$$

So

$$\mathbf{A} = \begin{pmatrix} 1 & 0 \\ 0 & -1 \end{pmatrix}\begin{pmatrix} 2.828 & 0 \\ 0 & 1.414 \end{pmatrix}\frac{1}{\sqrt{2}}\begin{pmatrix} 1 & 1 \\ 1 & -1 \end{pmatrix}.$$

**Reading it.** Right to left: $\mathbf{V}^\mathsf{T}$ turns the input so that the diagonal $(1, 1)/\sqrt{2}$ lands on the first axis (it is a $45^\circ$ turn combined with a mirror flip). $\boldsymbol{\Sigma}$ stretches the first axis by $2.828$ and the second by $1.414$. $\mathbf{U}$ flips the second axis. The unit circle becomes an ellipse with semi-axes $2.828$ along $\hat{\mathbf{x}}$ and $1.414$ along $\hat{\mathbf{y}}$, and the input stretched most is the diagonal $(1, 1)/\sqrt{2}$.

For contrast, the eigenvalues of $\mathbf{A}$ itself are $\tfrac{3}{2} \pm i\tfrac{\sqrt{7}}{2}$: complex numbers that say nothing about stretching.
:::

::: example A tall matrix: three measurements, two unknowns
Let $\mathbf{A} = \begin{pmatrix} 1 & 1 \\ 1 & 0 \\ 0 & 1 \end{pmatrix}$ — three measurements of two unknowns.

**Right side.** $\mathbf{A}^\mathsf{T}\mathbf{A} = \begin{pmatrix} 2 & 1 \\ 1 & 2 \end{pmatrix}$ has eigenvalues $3$ and $1$ (trace $4$, determinant $3$). So $\sigma_1 = \sqrt{3} = 1.732$ and $\sigma_2 = 1$, with $\mathbf{v}_1 = (1, 1)^\mathsf{T}/\sqrt{2}$ and $\mathbf{v}_2 = (1, -1)^\mathsf{T}/\sqrt{2}$.

**Left side.**

$$\mathbf{u}_1 = \frac{\mathbf{A}\mathbf{v}_1}{\sigma_1} = \frac{(2, 1, 1)^\mathsf{T}}{\sqrt{2}\sqrt{3}} = \frac{1}{\sqrt{6}}\begin{pmatrix} 2 \\ 1 \\ 1 \end{pmatrix}, \qquad \mathbf{u}_2 = \frac{\mathbf{A}\mathbf{v}_2}{\sigma_2} = \frac{1}{\sqrt{2}}\begin{pmatrix} 0 \\ 1 \\ -1 \end{pmatrix}.$$

They are perpendicular: $\mathbf{u}_1\cdot\mathbf{u}_2 = (0 + 1 - 1)/\sqrt{12} = 0$.

**The missing column.** The full $\mathbf{U}$ is $3\times 3$, so it needs a third column perpendicular to both: $\mathbf{u}_3 = (1, -1, -1)^\mathsf{T}/\sqrt{3}$. Notice $\mathbf{A}^\mathsf{T}\mathbf{u}_3 = (1 - 1,\ 1 - 1)^\mathsf{T} = \mathbf{0}$. The third left singular vector is a pattern of measurements that no state can produce.

**Rebuilding A.** The reduced SVD drops $\mathbf{u}_3$ and writes $\mathbf{A} = \sigma_1\mathbf{u}_1\mathbf{v}_1^\mathsf{T} + \sigma_2\mathbf{u}_2\mathbf{v}_2^\mathsf{T}$. The first piece is

$$\sqrt{3}\cdot\tfrac{1}{\sqrt{6}}\tfrac{1}{\sqrt{2}}(2, 1, 1)^\mathsf{T}(1, 1) = \tfrac{1}{2}\begin{pmatrix} 2 & 2 \\ 1 & 1 \\ 1 & 1 \end{pmatrix},$$

and adding the second piece, $\tfrac{1}{2}\begin{pmatrix} 0 & 0 \\ 1 & -1 \\ -1 & 1 \end{pmatrix}$, gives back $\mathbf{A}$ exactly.

**Check.** The sum of the squares of all entries of $\mathbf{A}$ is $4$, and $\sigma_1^2 + \sigma_2^2 = 3 + 1 = 4$. (That sum is the squared Frobenius norm; you will see why they match in the next section.)
:::

## What the SVD tells you

**Rank.** The rank of $\mathbf{A}$ is the number $r$ of nonzero singular values. That is because $\mathbf{U}$ and $\mathbf{V}$ are invertible, and the rank of the diagonal $\boldsymbol{\Sigma}$ is the count of its nonzero entries.

This is the definition of rank that survives on a computer. Elimination decides rank by whether a pivot is exactly zero, and floating point never delivers an exact zero. Singular values come with sizes. A $\sigma_i$ of $10^{-14}$ next to a $\sigma_1$ of about one is a zero that round-off has smudged. Lesson 9 turns this into **numerical rank**.

**The four fundamental subspaces.** Order the singular vectors so that $\sigma_1, \dots, \sigma_r > 0$. Then:

- $\mathbf{u}_1, \dots, \mathbf{u}_r$ span the **column space** of $\mathbf{A}$ — the outputs the matrix can produce;
- $\mathbf{u}_{r+1}, \dots, \mathbf{u}_m$ span the **left null space** — outputs no input can produce, which are the leftover residual directions in a least-squares problem;
- $\mathbf{v}_1, \dots, \mathbf{v}_r$ span the **row space** — the inputs the matrix responds to;
- $\mathbf{v}_{r+1}, \dots, \mathbf{v}_n$ span the **null space**: $\mathbf{A}\mathbf{v}_i = \mathbf{0}$, inputs the matrix cannot see.

Linear Algebra I showed that these four spaces exist and that each pair meets at right angles. The SVD hands you a perpendicular unit basis for each one. That is why `scipy.linalg.null_space` and `orth` are thin wrappers around it. For a measurement Jacobian $\mathbf{H}$, the null space is the set of state errors that leave every measurement unchanged — the **unobservable** directions — and its basis is the last columns of $\mathbf{V}$.

**Norms.** The **2-norm** of a matrix is its biggest stretch:

$$\|\mathbf{A}\|_2 = \max_{\|\mathbf{x}\| = 1}\|\mathbf{A}\mathbf{x}\| = \sigma_1.$$

That holds because $\mathbf{U}$ and $\mathbf{V}^\mathsf{T}$ keep lengths, and the diagonal $\boldsymbol{\Sigma}$ stretches a unit vector by at most $\sigma_1$, reaching it at $\mathbf{v}_1$. The **[[Frobenius norm|frobenius]]** adds up the squares of all entries:

$$\|\mathbf{A}\|_F^2 = \sum_{ij}a_{ij}^2 = \operatorname{tr}(\mathbf{A}^\mathsf{T}\mathbf{A}) = \sum_i\sigma_i^2,$$

since the trace of $\mathbf{A}^\mathsf{T}\mathbf{A}$ is the sum of its eigenvalues. And for a square matrix, $|\det\mathbf{A}| = \prod_i\sigma_i$. That is why the determinant measures volume change but not conditioning: $\sigma_1 = 10^3$ and $\sigma_2 = 10^{-3}$ give determinant one.

**Best low-rank approximation.** Stop the sum of pieces after $k$ terms:

$$\mathbf{A}_k = \sum_{i \le k}\sigma_i\mathbf{u}_i\mathbf{v}_i^\mathsf{T}.$$

This is the closest rank-$k$ matrix to $\mathbf{A}$, in both the 2-norm and the Frobenius norm, and the 2-norm error is $\|\mathbf{A} - \mathbf{A}_k\|_2 = \sigma_{k+1}$. That result is the **[[Eckart–Young theorem|eckart-young]]**. It is behind SVD data compression, principal component analysis, and the rank cut in Lesson 9's pseudoinverse. It also gives the exact meaning of "nearly singular": the distance from $\mathbf{A}$ to the nearest rank-deficient matrix is $\sigma_n$, the smallest singular value.

::: key Reading the singular values
$\operatorname{rank}\mathbf{A}$ = number of nonzero $\sigma_i$; $\lVert\mathbf{A}\rVert_2 = \sigma_1$; $\lVert\mathbf{A}\rVert_F^2 = \sum\sigma_i^2$; $\lvert\det\mathbf{A}\rvert = \prod\sigma_i$; the distance to the nearest singular matrix is $\sigma_{\min}$; the last columns of $\mathbf{V}$ span the null space and the last columns of $\mathbf{U}$ the left null space.
:::

## Singular values as observability

Take the range Jacobian of Lesson 7: one row per beacon, each row a unit vector along the line of sight between receiver and beacon. For $m$ beacons in a plane, $\mathbf{H}$ is $m\times 2$. (Lesson 7's rows pointed from beacon to receiver. Flipping every row's sign changes nothing below, because only $\mathbf{H}^\mathsf{T}\mathbf{H}$ and the sizes of the singular values matter.)

A small position error $\boldsymbol{\delta}$ changes the ranges by $\mathbf{H}\boldsymbol{\delta}$. The SVD of $\mathbf{H}$ says how visible each direction of error is. An error along $\mathbf{v}_1$ shows up in the ranges with gain $\sigma_1$; an error along $\mathbf{v}_2$ with gain $\sigma_2$. If $\sigma_2$ is small, errors along $\mathbf{v}_2$ barely change the measurements — so the measurements barely pin down that direction.

The Gram matrix $\mathbf{H}^\mathsf{T}\mathbf{H} = \mathbf{V}\boldsymbol{\Sigma}^\mathsf{T}\boldsymbol{\Sigma}\mathbf{V}^\mathsf{T}$ is the **information matrix** when the range noise has variance one. Its inverse is the covariance of the position estimate, with eigenvalues $1/\sigma_i^2$ along the same $\mathbf{v}_i$. So the one-sigma error ellipse has semi-axes $1/\sigma_i$: big gain, small error; small gain, big error.

::: example Well-spread versus clustered beacons
**Spread out.** Three beacons at bearings $0^\circ$, $120^\circ$ and $240^\circ$ from the receiver give the rows $(1, 0)$, $(-0.5, 0.866)$ and $(-0.5, -0.866)$. Add up the products entry by entry:

$$\mathbf{H}^\mathsf{T}\mathbf{H} = \begin{pmatrix} 1 + 0.25 + 0.25 & 0 \\ 0 & 0.75 + 0.75 \end{pmatrix} = 1.5\,\mathbf{I}.$$

Both singular values are $\sqrt{1.5} = 1.225$. Every direction is seen equally well. For range noise of $1\,\mathrm{m}$, the position error is a circle of radius $1/1.225 = 0.816\,\mathrm{m}$.

**Clustered.** Now bunch the beacons at $0^\circ$, $5^\circ$ and $10^\circ$. The rows are $(1, 0)$, $(0.9962, 0.0872)$ and $(0.9848, 0.1736)$, and

$$\mathbf{H}^\mathsf{T}\mathbf{H} = \begin{pmatrix} 2.962 & 0.258 \\ 0.258 & 0.0377 \end{pmatrix}.$$

Its eigenvalues are $2.985$ and $0.0152$, so $\sigma_1 = 1.728$ and $\sigma_2 = 0.1233$.

**Reading the numbers.** The direction toward the beacons ($\mathbf{v}_1$, about $5^\circ$ from the $x$-axis) is seen slightly *better* than before, because all three beacons now pull the same way. The cross direction $\mathbf{v}_2$ is seen fourteen times *worse*. With the same $1\,\mathrm{m}$ range noise the error ellipse has semi-axes $1/1.728 = 0.579\,\mathrm{m}$ toward the beacons and $1/0.1233 = 8.11\,\mathrm{m}$ across.

The ratio $\sigma_1/\sigma_2 = 14.0$ is the condition number of $\mathbf{H}$. The square root of the sum of the covariance eigenvalues, $\sqrt{0.579^2 + 8.11^2} = 8.13$, is what GPS calls the **[[dilution of precision|gdop-picture]]**: the factor by which geometry inflates ranging error into position error. For the spread geometry it was $\sqrt{2\times 0.816^2} = 1.15$. Sanity check: bunching the beacons should hurt, and it made the position error seven times larger.
:::

::: warning Singular values are not eigenvalues
For a square matrix the two sets agree only when the matrix is symmetric PSD. In general $\sigma_1 \ge |\lambda|_{\max}$ and $\sigma_n \le |\lambda|_{\min}$, and the gap can be as big as you like. The shear above has eigenvalues $1, 1$ and singular values $1.618, 0.618$. A rotation has singular values $1, 1$ and complex eigenvalues. Use eigenvalues for dynamics and stability (does $e^{\mathbf{A}t}$ decay?). Use singular values for geometry, conditioning and rank (how much does $\mathbf{A}$ stretch?). The products do agree in size: both equal $|\det\mathbf{A}|$.
:::

## The SVD in NumPy

```python
import numpy as np

A = np.array([[1.0, 1.0], [1.0, 0.0], [0.0, 1.0]])
U, s, Vt = np.linalg.svd(A, full_matrices=False)   # reduced: U is 3x2
print(s)                                             # [1.73205081 1.        ]
print(np.allclose(U @ np.diag(s) @ Vt, A))           # True
print(np.linalg.matrix_rank(A))                      # 2  (counts s > tol)
print(round(np.linalg.norm(A, 2), 6), round(s[0], 6))   # 1.732051 1.732051
Vt_full = np.linalg.svd(A)[2]                        # full: V is n x n
null_dirs = Vt_full[np.sum(s > 1e-12):]              # rows spanning null(A): empty here
```

Two things trip people up. First, `svd` returns $\mathbf{V}^\mathsf{T}$, not $\mathbf{V}$. Second, the singular values come back as a flat 1-D array in decreasing order, so rebuilding $\mathbf{A}$ needs `np.diag(s)` or the broadcast `(U * s) @ Vt`. The **[[algorithm behind it|svd-algorithm]]** works on $\mathbf{A}$ directly with Householder reflections and never forms $\mathbf{A}^\mathsf{T}\mathbf{A}$. So the small singular values it returns are as accurate as the large ones, relative to $\|\mathbf{A}\|$.

## Check yourself

::: check
Find the singular values of $\mathbf{A} = \begin{pmatrix} 3 & 0 \\ 0 & -2 \end{pmatrix}$ and $\mathbf{B} = \begin{pmatrix} 0 & 3 \\ 2 & 0 \end{pmatrix}$, and write an SVD of $\mathbf{B}$.
:::

::: answer
**A.** $\mathbf{A}^\mathsf{T}\mathbf{A} = \operatorname{diag}(9, 4)$, so $\sigma_1 = 3$ and $\sigma_2 = 2$. The singular values are the sizes of the eigenvalues, and $\mathbf{U} = \operatorname{diag}(1, -1)$ absorbs the minus sign.

**B.** $\mathbf{B}^\mathsf{T}\mathbf{B} = \operatorname{diag}(4, 9)$, so again $\sigma_1 = 3$ and $\sigma_2 = 2$. But now the bigger eigenvalue, $9$, belongs to $\mathbf{e}_2$, so $\mathbf{v}_1 = \mathbf{e}_2$ and $\mathbf{v}_2 = \mathbf{e}_1$. Then $\mathbf{u}_1 = \mathbf{B}\mathbf{e}_2/3 = \mathbf{e}_1$ and $\mathbf{u}_2 = \mathbf{B}\mathbf{e}_1/2 = \mathbf{e}_2$. So

$$\mathbf{B} = \mathbf{I}\,\operatorname{diag}(3, 2)\begin{pmatrix} 0 & 1 \\ 1 & 0 \end{pmatrix}:$$

a swap of the input axes, then a stretch. $\mathbf{B}$'s eigenvalues are $\pm\sqrt{6}$, which tell you nothing about the stretches $3$ and $2$.
:::

::: check
A $4\times 3$ matrix has singular values $5$, $2$ and $0$. State its rank, the dimensions of its four fundamental subspaces, its 2-norm and its Frobenius norm.
:::

::: answer
Two nonzero singular values, so the rank is $2$.

- Column space: dimension $2$ in $\mathbb{R}^4$, spanned by $\mathbf{u}_1, \mathbf{u}_2$.
- Left null space: $4 - 2 = 2$, spanned by $\mathbf{u}_3, \mathbf{u}_4$.
- Row space: $2$ in $\mathbb{R}^3$, spanned by $\mathbf{v}_1, \mathbf{v}_2$.
- Null space: $3 - 2 = 1$, spanned by $\mathbf{v}_3$.

$\|\mathbf{A}\|_2 = 5$ and $\|\mathbf{A}\|_F = \sqrt{25 + 4 + 0} = \sqrt{29} = 5.39$. The nearest rank-one matrix is $5\,\mathbf{u}_1\mathbf{v}_1^\mathsf{T}$, at 2-norm distance $2$.
:::

::: check
Use the SVD to explain why $\mathbf{A}^\mathsf{T}\mathbf{A}$ and $\mathbf{A}\mathbf{A}^\mathsf{T}$ have the same nonzero eigenvalues even though they have different sizes.
:::

::: answer
Substitute $\mathbf{A} = \mathbf{U}\boldsymbol{\Sigma}\mathbf{V}^\mathsf{T}$ and use $\mathbf{U}^\mathsf{T}\mathbf{U} = \mathbf{I}$ and $\mathbf{V}^\mathsf{T}\mathbf{V} = \mathbf{I}$:

$$\mathbf{A}^\mathsf{T}\mathbf{A} = \mathbf{V}\boldsymbol{\Sigma}^\mathsf{T}\mathbf{U}^\mathsf{T}\mathbf{U}\boldsymbol{\Sigma}\mathbf{V}^\mathsf{T} = \mathbf{V}(\boldsymbol{\Sigma}^\mathsf{T}\boldsymbol{\Sigma})\mathbf{V}^\mathsf{T}, \qquad \mathbf{A}\mathbf{A}^\mathsf{T} = \mathbf{U}(\boldsymbol{\Sigma}\boldsymbol{\Sigma}^\mathsf{T})\mathbf{U}^\mathsf{T}.$$

Both are spectral decompositions. $\boldsymbol{\Sigma}^\mathsf{T}\boldsymbol{\Sigma}$ is $n\times n$ and $\boldsymbol{\Sigma}\boldsymbol{\Sigma}^\mathsf{T}$ is $m\times m$, but both are diagonal with $\sigma_1^2, \dots, \sigma_r^2$ followed by zeros — the bigger one has more zeros. So the nonzero eigenvalues agree, with eigenvectors $\mathbf{v}_i$ for one and $\mathbf{u}_i$ for the other, and the bigger matrix's extra eigenvalues are all zero.
:::

::: check
Two beacons lie in exactly the same direction from a receiver. What are the singular values of the $2\times 2$ Jacobian $\mathbf{H}$, and what does the receiver learn?
:::

::: answer
Both rows are the same unit vector $\hat{\mathbf{e}}^\mathsf{T}$, so $\mathbf{H} = \mathbf{1}\hat{\mathbf{e}}^\mathsf{T}$ (where $\mathbf{1} = (1, 1)^\mathsf{T}$) has rank one. $\mathbf{H}^\mathsf{T}\mathbf{H} = 2\hat{\mathbf{e}}\hat{\mathbf{e}}^\mathsf{T}$ has eigenvalues $2$ and $0$. So $\sigma_1 = \sqrt{2}$ and $\sigma_2 = 0$, with $\mathbf{v}_1 = \hat{\mathbf{e}}$ and $\mathbf{v}_2$ perpendicular to it.

The receiver learns its position along the line of sight — twice over, which is why $\sigma_1$ is $\sqrt{2}$ rather than $1$ — and nothing at all across it. The cross direction is in the null space of $\mathbf{H}$: unobservable from this pair. The error ellipse's semi-axis $1/\sigma_2$ is infinite.
:::

::: check
A $2\times 2$ matrix has $\det\mathbf{A} = 1$ and $\|\mathbf{A}\|_2 = 100$. What is its smallest singular value, and what does this say about using the determinant to judge whether a matrix is nearly singular?
:::

::: answer
$\sigma_1\sigma_2 = |\det\mathbf{A}| = 1$ and $\sigma_1 = \|\mathbf{A}\|_2 = 100$, so $\sigma_2 = 0.01$.

The matrix is within $0.01$ of a singular matrix in the 2-norm: it squashes the direction $\mathbf{v}_2$ by a factor of $100$. Yet its determinant is a healthy-looking $1$. The determinant measures area, and a long thin ellipse can have the same area as a circle. Nearness to singularity is measured by $\sigma_{\min}$, or by the ratio $\sigma_1/\sigma_2 = 10^4$ — the condition number of Lesson 10.
:::

## Summary

| Item | Statement |
| --- | --- |
| SVD | $\mathbf{A} = \mathbf{U}\boldsymbol{\Sigma}\mathbf{V}^\mathsf{T}$, $\mathbf{U}$, $\mathbf{V}$ orthogonal, $\boldsymbol{\Sigma}$ diagonal with $\sigma_1 \ge \sigma_2 \ge \dots \ge 0$; exists for every matrix |
| Action | $\mathbf{A}\mathbf{v}_i = \sigma_i\mathbf{u}_i$; turn ($\mathbf{V}^\mathsf{T}$), stretch ($\boldsymbol{\Sigma}$), turn ($\mathbf{U}$); unit sphere to ellipsoid with semi-axes $\sigma_i\mathbf{u}_i$ |
| Sum of pieces | $\mathbf{A} = \sum_{i \le r}\sigma_i\mathbf{u}_i\mathbf{v}_i^\mathsf{T}$; the reduced SVD keeps $r$ columns |
| Construction | $\mathbf{v}_i$ eigenvectors of $\mathbf{A}^\mathsf{T}\mathbf{A}$, $\sigma_i = \sqrt{\lambda_i}$, $\mathbf{u}_i = \mathbf{A}\mathbf{v}_i/\sigma_i$; $\mathbf{u}_i$ eigenvectors of $\mathbf{A}\mathbf{A}^\mathsf{T}$ |
| Rank | number of nonzero singular values |
| Subspaces | column space $= \operatorname{span}(\mathbf{u}_1..\mathbf{u}_r)$, left null $= \operatorname{span}(\mathbf{u}_{r+1}..\mathbf{u}_m)$, row space $= \operatorname{span}(\mathbf{v}_1..\mathbf{v}_r)$, null $= \operatorname{span}(\mathbf{v}_{r+1}..\mathbf{v}_n)$ |
| Norms | $\lVert\mathbf{A}\rVert_2 = \sigma_1$; $\lVert\mathbf{A}\rVert_F^2 = \sum\sigma_i^2$; $\lvert\det\mathbf{A}\rvert = \prod\sigma_i$ |
| Low rank | $\mathbf{A}_k = \sum_{i \le k}\sigma_i\mathbf{u}_i\mathbf{v}_i^\mathsf{T}$ is the best rank-$k$ approximation, error $\sigma_{k+1}$; distance to singular $= \sigma_{\min}$ |
| Observability | for $\mathbf{H}$ with unit line-of-sight rows, error ellipse semi-axes $1/\sigma_i$ along $\mathbf{v}_i$; null space of $\mathbf{H}$ = unobservable directions |
| Symmetric case | PSD: $\mathbf{U} = \mathbf{V} = \mathbf{Q}$, $\sigma_i = \lambda_i$; symmetric in general: $\sigma_i = \lvert\lambda_i\rvert$; not symmetric: no simple link |
| NumPy | `np.linalg.svd(A, full_matrices=False)` returns `U, s, Vt` |

The next lesson runs the decomposition backwards. Undoing each nonzero stretch and leaving the zero ones alone gives the **[[pseudoinverse|pinv-bridge]]** $\mathbf{A}^+ = \mathbf{V}\boldsymbol{\Sigma}^+\mathbf{U}^\mathsf{T}$. It solves least-squares problems even when $\mathbf{A}$ is rank deficient and the normal equations cannot be solved at all.

::: context orthogonal-recap What makes a matrix orthogonal
A square matrix $\mathbf{Q}$ is **orthogonal** when its columns are unit vectors at right angles to each other. In symbols, $\mathbf{Q}^\mathsf{T}\mathbf{Q} = \mathbf{I}$, so its inverse is its transpose. Multiplying by it keeps lengths and angles: $\|\mathbf{Q}\mathbf{x}\| = \|\mathbf{x}\|$. So it can only turn a vector, or mirror-flip it. A rotation matrix is the everyday example, and its determinant is $+1$; a mirror flip has determinant $-1$.
:::

::: context three-steps Turn, stretch, turn
Follow two marked points through $\mathbf{A} = \begin{pmatrix} 2 & 2 \\ -1 & 1 \end{pmatrix}$. Red starts at $\mathbf{v}_1$ (the $45^\circ$ diagonal), blue at $\mathbf{v}_2$. $\mathbf{V}^\mathsf{T}$ moves them onto the axes. $\boldsymbol{\Sigma}$ stretches the axes by $2.83$ and $1.41$. $\mathbf{U}$ flips the vertical axis, which sends blue to the bottom.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <circle cx="30" cy="65" r="16" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="41.3" cy="53.7" r="3.5" fill="#b4232c"/>
  <circle cx="41.3" cy="76.3" r="3.5" fill="#1d6fd1"/>
  <circle cx="92" cy="65" r="16" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="108" cy="65" r="3.5" fill="#b4232c"/>
  <circle cx="92" cy="49" r="3.5" fill="#1d6fd1"/>
  <ellipse cx="180" cy="65" rx="45.3" ry="22.6" fill="#8fb8f0" fill-opacity="0.5" stroke="#1d6fd1" stroke-width="1.5"/>
  <circle cx="225.3" cy="65" r="3.5" fill="#b4232c"/>
  <circle cx="180" cy="42.4" r="3.5" fill="#1d6fd1"/>
  <ellipse cx="295" cy="65" rx="45.3" ry="22.6" fill="#8fb8f0" fill-opacity="0.5" stroke="#1d6fd1" stroke-width="1.5"/>
  <circle cx="340.3" cy="65" r="3.5" fill="#b4232c"/>
  <circle cx="295" cy="87.6" r="3.5" fill="#1d6fd1"/>
  <g font-size="13" fill="#1f2a44" text-anchor="middle">
    <text x="61" y="30">Vᵀ</text><text x="122" y="30">Σ</text><text x="245" y="30">U</text>
  </g>
  <g stroke="#6c7a93" stroke-width="1.2">
    <line x1="50" y1="36" x2="72" y2="36"/><line x1="112" y1="36" x2="134" y2="36"/><line x1="235" y1="36" x2="257" y2="36"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="30" y="115">start</text><text x="92" y="115">turned</text><text x="180" y="115">stretched</text><text x="295" y="115">turned again</text>
  </g>
</svg>
```
:::

::: context golden-shear Where the golden ratio comes from
For the shear, $\mathbf{A}^\mathsf{T}\mathbf{A} = \begin{pmatrix} 1 & 1 \\ 1 & 2 \end{pmatrix}$, with eigenvalues $(3 \pm \sqrt{5})/2$. Their square roots are $(1 + \sqrt{5})/2 = 1.618$, the golden ratio $\varphi$ ("phi"), and $1/\varphi = 0.618$. In the picture, the dashed unit circle becomes the blue ellipse. The only eigenvector direction, the $x$-axis (grey), is left where it was — yet the long axis of the ellipse (red, length $1.618$) points $31.7^\circ$ above it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="90" y1="100" x2="290" y2="100" stroke="#6c7a93" stroke-width="1"/>
  <line x1="180" y1="20" x2="180" y2="180" stroke="#6c7a93" stroke-width="1"/>
  <ellipse cx="180" cy="100" rx="80.9" ry="30.9" transform="rotate(-31.72 180 100)" fill="#8fb8f0" fill-opacity="0.5" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="180" cy="100" r="50" fill="none" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="3 2"/>
  <line x1="180" y1="100" x2="248.8" y2="57.5" stroke="#b4232c" stroke-width="2.5"/>
  <line x1="180" y1="100" x2="163.8" y2="73.7" stroke="#b4232c" stroke-width="2.5"/>
  <line x1="180" y1="100" x2="230" y2="100" stroke="#6c7a93" stroke-width="3"/>
  <text x="252" y="52" font-size="12" fill="#b4232c">1.618</text>
  <text x="130" y="70" font-size="12" fill="#b4232c">0.618</text>
  <text x="236" y="117" font-size="11" fill="#6c7a93">eigenvector (1, 0)</text>
  <text x="20" y="176" font-size="11" fill="#1f2a44">dashed: unit circle</text>
  <text x="20" y="192" font-size="11" fill="#1d6fd1">blue: its image under the shear</text>
</svg>
```
:::

::: context outer-product A rank-one matrix is a multiplication table
A column times a row, $\mathbf{u}\mathbf{v}^\mathsf{T}$, is called an **outer product**. It is a multiplication table: entry $(i, j)$ is $u_iv_j$. With $\mathbf{u} = (1, 2, 3)^\mathsf{T}$ and $\mathbf{v} = (1, 10)^\mathsf{T}$, the rows are $(1, 10)$, $(2, 20)$ and $(3, 30)$ — every row a multiple of the same row, so the rank is one. The SVD says every matrix is a weighted sum of such tables, heaviest first.
:::

::: context gram-schmidt Gram–Schmidt in one breath
Given some vectors, Gram–Schmidt makes them perpendicular one at a time. Take the next vector, subtract its shadow on each vector you already have, and scale what is left to length one. Starting from $r$ perpendicular unit vectors in $\mathbb{R}^m$, feed in any vectors that point somewhere new — for example, the standard axes $\mathbf{e}_1, \mathbf{e}_2, \dots$ — and keep the non-zero leftovers until you have $m$.
:::

::: context frobenius Measuring a matrix like a long vector
Line up all $mn$ entries of a matrix in one long list and take its ordinary length. That is the **Frobenius norm**, named after the German mathematician Ferdinand Georg Frobenius. It is easy to compute — no SVD needed — and the SVD shows it is also $\sqrt{\sigma_1^2 + \sigma_2^2 + \cdots}$. The 2-norm is always the smaller of the two, since it keeps only $\sigma_1$.
:::

::: context eckart-young Throwing away the small pieces
Carl Eckart and Gale Young published this result in 1936 in *Psychometrika*, a journal of mathematical psychology, where people wanted to summarize big tables of test scores with a few numbers. The same idea compresses images: a $1000\times 1000$ picture stored as its top $50$ SVD pieces needs $50\times(1000 + 1000 + 1)$, about $100{,}000$ numbers instead of a million, and often looks nearly the same. How good it looks depends on how fast the singular values fall off.
:::

::: context gdop-picture Why bunched beacons hurt
On the left, three beacons spread at $120^\circ$ (grey rays) give a small round error circle, $0.816\,\mathrm{m}$ across each way. On the right, beacons at $0^\circ$, $5^\circ$ and $10^\circ$ give an ellipse only $0.579\,\mathrm{m}$ along the rays but $8.11\,\mathrm{m}$ across them. Both are drawn at the same scale, $10$ pixels per meter. GPS receivers report this effect as a DOP number, and a large one warns that the satellites overhead are poorly spread.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <g stroke="#6c7a93" stroke-width="1.5">
    <line x1="80" y1="105" x2="130" y2="105"/><line x1="80" y1="105" x2="55" y2="61.7"/><line x1="80" y1="105" x2="55" y2="148.3"/>
    <line x1="220" y1="105" x2="300" y2="105"/><line x1="220" y1="105" x2="299.7" y2="98"/><line x1="220" y1="105" x2="298.8" y2="91.1"/>
  </g>
  <circle cx="80" cy="105" r="8.2" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <ellipse cx="220" cy="105" rx="81.1" ry="5.8" transform="rotate(-95 220 105)" fill="#8fb8f0" fill-opacity="0.6" stroke="#1d6fd1" stroke-width="2"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="80" y="185">spread: DOP 1.15</text>
    <text x="280" y="160">clustered: DOP 8.13</text>
  </g>
  <text x="236" y="40" font-size="11" fill="#b4232c">8.11 m across</text>
  <text x="304" y="100" font-size="11" fill="#6c7a93">rays</text>
</svg>
```
:::

::: context svd-algorithm How a computer really finds the SVD
The standard method comes from Gene Golub and William Kahan, published in 1965. It first uses mirror-flip matrices (Householder reflections) on both sides to squeeze $\mathbf{A}$ into a **bidiagonal** matrix — nonzero only on the diagonal and the line right above it — without changing its singular values. Then it chips away at the off-diagonal entries with rotations until only the singular values are left. Every step is orthogonal, so round-off never grows large.
:::

::: context pinv-bridge Coming up: undoing the stretch
Turning is easy to undo: apply the transpose. Stretching by $\sigma_i$ is undone by stretching by $1/\sigma_i$ — unless $\sigma_i$ is zero, because nothing can un-flatten a direction that was squashed to nothing. The pseudoinverse undoes what it can and leaves the rest at zero. Lesson 9 shows that this is exactly the least-squares answer with the smallest size.
:::
