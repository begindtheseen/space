---
id: l04-symmetric-matrices-spectral-theorem
title: Symmetric matrices and the spectral theorem
minutes: 21
covers:
  - symmetric matrices and the spectral theorem
---

Most of the matrices a GNC engineer stares at are symmetric. A covariance matrix $\mathbf{P}$ is symmetric because $\operatorname{Cov}(x_i, x_j) = \operatorname{Cov}(x_j, x_i)$. An inertia tensor is symmetric by construction. The normal-equation matrix $\mathbf{A}^\mathsf{T}\mathbf{A}$ of a least-squares fit, the information matrix of an estimator, the Hessian of a cost function, the stiffness matrix of a structure: symmetric, every one. So it pays to know that symmetric matrices are the best-behaved matrices there are, and to know exactly what that good behaviour consists of.

Lesson 1 warned that eigenvalues can be complex and that eigenvectors need not be orthogonal, and Lesson 3 showed that a general similarity transform distorts lengths and angles. For a symmetric matrix none of these caveats apply. Its eigenvalues are real. Its eigenvectors are mutually perpendicular. It can always be diagonalised, even with repeated eigenvalues, and the diagonalising matrix is a rotation. That collection of facts is the spectral theorem, and it turns a symmetric matrix into something you can picture: an ellipsoid with its axes along the eigenvectors and its semi-axes set by the eigenvalues.

This lesson proves the theorem's pieces, shows how to read $\mathbf{A} = \mathbf{Q}\boldsymbol{\Lambda}\mathbf{Q}^\mathsf{T}$ as a recipe, introduces the Rayleigh quotient that bounds any quadratic form by the extreme eigenvalues, and applies all of it to the two symmetric matrices you will meet most: an inertia tensor and a covariance.

## What symmetry buys you

A real matrix is **symmetric** if $\mathbf{A}^\mathsf{T} = \mathbf{A}$, so $a_{ij} = a_{ji}$. The defining consequence, from Linear Algebra I, is that a symmetric matrix can be moved from one side of a dot product to the other:

$$(\mathbf{A}\mathbf{x})\cdot\mathbf{y} = (\mathbf{A}\mathbf{x})^\mathsf{T}\mathbf{y} = \mathbf{x}^\mathsf{T}\mathbf{A}^\mathsf{T}\mathbf{y} = \mathbf{x}^\mathsf{T}\mathbf{A}\mathbf{y} = \mathbf{x}\cdot(\mathbf{A}\mathbf{y}).$$

Everything below follows from that one line.

### The eigenvalues are real

Let $\mathbf{A}\mathbf{v} = \lambda\mathbf{v}$ with $\mathbf{v} \neq \mathbf{0}$, and allow for the moment that $\lambda$ and $\mathbf{v}$ might be complex. Write $\bar{\mathbf{v}}$ for the componentwise complex conjugate. Multiply the eigen-equation on the left by $\bar{\mathbf{v}}^\mathsf{T}$:

$$\bar{\mathbf{v}}^\mathsf{T}\mathbf{A}\mathbf{v} = \lambda\,\bar{\mathbf{v}}^\mathsf{T}\mathbf{v} = \lambda\sum_i |v_i|^2.$$

Now take the complex conjugate of the whole scalar $\bar{\mathbf{v}}^\mathsf{T}\mathbf{A}\mathbf{v}$. Since $\mathbf{A}$ is real, the conjugate is $\mathbf{v}^\mathsf{T}\mathbf{A}\bar{\mathbf{v}}$, and because a scalar equals its own transpose and $\mathbf{A}^\mathsf{T} = \mathbf{A}$, this is $\bar{\mathbf{v}}^\mathsf{T}\mathbf{A}^\mathsf{T}\mathbf{v} = \bar{\mathbf{v}}^\mathsf{T}\mathbf{A}\mathbf{v}$ again. The scalar equals its own conjugate, so it is real. The sum $\sum|v_i|^2$ is real and positive. Therefore $\lambda$, their ratio, is real.

### Eigenvectors for different eigenvalues are orthogonal

Let $\mathbf{A}\mathbf{v}_1 = \lambda_1\mathbf{v}_1$ and $\mathbf{A}\mathbf{v}_2 = \lambda_2\mathbf{v}_2$ with $\lambda_1 \neq \lambda_2$. Move $\mathbf{A}$ across the dot product:

$$\lambda_1(\mathbf{v}_1\cdot\mathbf{v}_2) = (\mathbf{A}\mathbf{v}_1)\cdot\mathbf{v}_2 = \mathbf{v}_1\cdot(\mathbf{A}\mathbf{v}_2) = \lambda_2(\mathbf{v}_1\cdot\mathbf{v}_2).$$

So $(\lambda_1 - \lambda_2)(\mathbf{v}_1\cdot\mathbf{v}_2) = 0$, and since $\lambda_1 \neq \lambda_2$, the dot product is zero. Compare Lesson 1, where the same eigenvalues merely guaranteed independence. Symmetry upgrades independence to orthogonality.

### Repeated eigenvalues do no harm

For a general matrix a repeated eigenvalue can be defective, with too few eigenvectors, as the double integrator was. A symmetric matrix never is. The argument is by peeling off one eigenvector at a time. Take any eigenvalue $\lambda_1$ (real, by the first result) and a unit eigenvector $\mathbf{q}_1$. Complete it to an orthonormal basis $\mathbf{q}_1, \mathbf{u}_2, \dots, \mathbf{u}_n$ by Gram–Schmidt, and let $\mathbf{U}$ have those vectors as columns. Then $\mathbf{U}^\mathsf{T}\mathbf{A}\mathbf{U}$ is still symmetric (an orthogonal similarity preserves symmetry, from Lesson 3), and its first column is $\mathbf{U}^\mathsf{T}\mathbf{A}\mathbf{q}_1 = \lambda_1\mathbf{U}^\mathsf{T}\mathbf{q}_1 = (\lambda_1, 0, \dots, 0)^\mathsf{T}$. By symmetry the first row is the same, so

$$\mathbf{U}^\mathsf{T}\mathbf{A}\mathbf{U} = \begin{pmatrix} \lambda_1 & \mathbf{0}^\mathsf{T} \\ \mathbf{0} & \mathbf{A}' \end{pmatrix},$$

with $\mathbf{A}'$ a symmetric matrix one size smaller. Repeat on $\mathbf{A}'$. After $n$ steps the whole matrix is diagonal, and the accumulated basis changes are all orthogonal, so their product is orthogonal. No step can fail, because a real symmetric matrix of any size has at least one real eigenvalue. Whether $\lambda$ is repeated never enters: a repeated eigenvalue has an eigenspace of the full dimension, and any orthonormal basis of that eigenspace serves.

## The spectral theorem

Collect the unit eigenvectors as the columns of $\mathbf{Q}$ and the eigenvalues on the diagonal of $\boldsymbol{\Lambda}$. The diagonalisation of Lesson 1, $\mathbf{A} = \mathbf{V}\boldsymbol{\Lambda}\mathbf{V}^{-1}$, now has $\mathbf{V} = \mathbf{Q}$ orthogonal, so $\mathbf{V}^{-1} = \mathbf{Q}^\mathsf{T}$ and no inverse needs computing.

::: key The spectral theorem for real symmetric matrices
$\mathbf{A} = \mathbf{Q}\boldsymbol{\Lambda}\mathbf{Q}^\mathsf{T}$ with $\mathbf{Q}$ orthogonal and $\boldsymbol{\Lambda}$ real diagonal — a real symmetric matrix always has real eigenvalues and a full orthonormal eigenbasis. Equivalently $\mathbf{Q}^\mathsf{T}\mathbf{A}\mathbf{Q} = \boldsymbol{\Lambda}$: there is a rotation of coordinates in which $\mathbf{A}$ is diagonal.
:::

The theorem has a second, equally useful form. Multiply out $\mathbf{Q}\boldsymbol{\Lambda}\mathbf{Q}^\mathsf{T}$ column by column:

$$\mathbf{A} = \sum_{i=1}^{n}\lambda_i\,\mathbf{q}_i\mathbf{q}_i^\mathsf{T}.$$

Each $\mathbf{q}_i\mathbf{q}_i^\mathsf{T}$ is the projection matrix onto the line through $\mathbf{q}_i$ from Linear Algebra I — symmetric, rank one, squaring to itself. A symmetric matrix is a weighted sum of projections onto perpendicular lines, with the eigenvalues as weights. Acting on a vector,

$$\mathbf{A}\mathbf{x} = \sum_i \lambda_i\,(\mathbf{q}_i\cdot\mathbf{x})\,\mathbf{q}_i,$$

which reads: resolve $\mathbf{x}$ along the eigen-axes, scale each component by its eigenvalue, add the pieces back. There is no shear and no rotation, only stretching along $n$ perpendicular axes. The picture is an ellipsoid: the unit sphere is mapped to an ellipsoid whose axes point along the $\mathbf{q}_i$ and whose semi-axes are $|\lambda_i|$.

Because functions of a diagonal matrix act entry by entry, every function of $\mathbf{A}$ inherits the same structure and the same axes: $\mathbf{A}^k = \mathbf{Q}\boldsymbol{\Lambda}^k\mathbf{Q}^\mathsf{T}$, $\mathbf{A}^{-1} = \mathbf{Q}\boldsymbol{\Lambda}^{-1}\mathbf{Q}^\mathsf{T}$ when no eigenvalue is zero, $e^{\mathbf{A}t} = \mathbf{Q}e^{\boldsymbol{\Lambda}t}\mathbf{Q}^\mathsf{T}$, and — new, and important for covariances — a **square root** $\mathbf{A}^{1/2} = \mathbf{Q}\boldsymbol{\Lambda}^{1/2}\mathbf{Q}^\mathsf{T}$ whenever the eigenvalues are non-negative, satisfying $\mathbf{A}^{1/2}\mathbf{A}^{1/2} = \mathbf{A}$.

::: example A two-by-two spectral decomposition, and its tenth power
Take $\mathbf{A} = \begin{pmatrix} 5 & 2 \\ 2 & 2 \end{pmatrix}$. Trace $7$, determinant $6$: $\lambda^2 - 7\lambda + 6 = (\lambda - 6)(\lambda - 1)$, so $\lambda_1 = 6$ and $\lambda_2 = 1$, both real as promised. From the first row of $\mathbf{A} - 6\mathbf{I}$, $-v_1 + 2v_2 = 0$ gives $\mathbf{v}_1 = (2, 1)^\mathsf{T}$; from $\mathbf{A} - \mathbf{I}$, $4v_1 + 2v_2 = 0$ gives $\mathbf{v}_2 = (1, -2)^\mathsf{T}$. Check: $\mathbf{v}_1\cdot\mathbf{v}_2 = 2 - 2 = 0$, orthogonal as promised. Normalise by $\sqrt{5}$:

$$\mathbf{Q} = \frac{1}{\sqrt{5}}\begin{pmatrix} 2 & 1 \\ 1 & -2 \end{pmatrix}, \qquad \boldsymbol{\Lambda} = \begin{pmatrix} 6 & 0 \\ 0 & 1 \end{pmatrix}.$$

$\mathbf{Q}$ is orthogonal (columns of unit length, perpendicular) with $\det\mathbf{Q} = (-4 - 1)/5 = -1$, a rotation combined with a reflection; flipping the sign of the second column would make it a pure rotation, and either choice is a valid $\mathbf{Q}$. The rank-one form is

$$\mathbf{A} = 6\cdot\frac{1}{5}\begin{pmatrix} 4 & 2 \\ 2 & 1 \end{pmatrix} + 1\cdot\frac{1}{5}\begin{pmatrix} 1 & -2 \\ -2 & 4 \end{pmatrix} = \begin{pmatrix} 4.8 & 2.4 \\ 2.4 & 1.2 \end{pmatrix} + \begin{pmatrix} 0.2 & -0.4 \\ -0.4 & 0.8 \end{pmatrix} = \begin{pmatrix} 5 & 2 \\ 2 & 2 \end{pmatrix}.$$

Now $\mathbf{A}^{10} = \mathbf{Q}\operatorname{diag}(6^{10}, 1)\mathbf{Q}^\mathsf{T} = 6^{10}\,\mathbf{q}_1\mathbf{q}_1^\mathsf{T} + \mathbf{q}_2\mathbf{q}_2^\mathsf{T}$. With $6^{10} = 60\,466\,176$ the first term is $\tfrac{1}{5}\times 60\,466\,176\times\begin{pmatrix} 4 & 2 \\ 2 & 1 \end{pmatrix}$, and adding the second term gives

$$\mathbf{A}^{10} = \begin{pmatrix} 48\,372\,941 & 24\,186\,470 \\ 24\,186\,470 & 12\,093\,236 \end{pmatrix}.$$

The tenth power is almost exactly a rank-one matrix along $\mathbf{q}_1$: the $\lambda_2 = 1$ direction has not grown at all, so the dominant eigenvalue has taken over. The inverse comes just as cheaply: $\mathbf{A}^{-1} = \mathbf{Q}\operatorname{diag}(1/6, 1)\mathbf{Q}^\mathsf{T} = \begin{pmatrix} 0.333 & -0.333 \\ -0.333 & 0.833 \end{pmatrix}$, which you can confirm against the $2\times 2$ inverse formula $\tfrac{1}{6}\begin{pmatrix} 2 & -2 \\ -2 & 5 \end{pmatrix}$.
:::

::: example A repeated eigenvalue without defect
$\mathbf{A} = \begin{pmatrix} 2 & 1 & 1 \\ 1 & 2 & 1 \\ 1 & 1 & 2 \end{pmatrix}$ is symmetric. It is $\mathbf{I} + \mathbf{J}$ where $\mathbf{J}$ is the all-ones matrix, and $\mathbf{J} = \mathbf{1}\mathbf{1}^\mathsf{T}$ is rank one with $\mathbf{J}\mathbf{1} = 3\cdot\mathbf{1}$ for $\mathbf{1} = (1,1,1)^\mathsf{T}$. So $\mathbf{A}\mathbf{1} = 4\cdot\mathbf{1}$: eigenvalue $4$ with eigenvector $\mathbf{q}_1 = (1,1,1)^\mathsf{T}/\sqrt{3}$. For any vector $\mathbf{x}$ perpendicular to $\mathbf{1}$, $\mathbf{J}\mathbf{x} = \mathbf{1}(\mathbf{1}\cdot\mathbf{x}) = \mathbf{0}$, so $\mathbf{A}\mathbf{x} = \mathbf{x}$: eigenvalue $1$, with the entire plane perpendicular to $\mathbf{1}$ as its eigenspace. Trace check: $4 + 1 + 1 = 6$. Determinant check: $4\times 1\times 1 = 4$.

The eigenvalue $1$ is repeated, yet its eigenspace is two-dimensional, exactly matching its algebraic multiplicity. Any orthonormal pair in that plane — $(1, -1, 0)^\mathsf{T}/\sqrt{2}$ and $(1, 1, -2)^\mathsf{T}/\sqrt{6}$, say — completes $\mathbf{Q}$. Contrast the double integrator $\begin{pmatrix} 0 & 1 \\ 0 & 0 \end{pmatrix}$, which also has a repeated eigenvalue but only one eigenvector: it is not symmetric, and the spectral theorem makes no promise about it.
:::

## The Rayleigh quotient

The spectral theorem tells you how large a quadratic form can get. For any nonzero $\mathbf{x}$, change to eigen-coordinates $\mathbf{y} = \mathbf{Q}^\mathsf{T}\mathbf{x}$, so that $\mathbf{x} = \mathbf{Q}\mathbf{y}$ and $\|\mathbf{y}\| = \|\mathbf{x}\|$ because $\mathbf{Q}$ is orthogonal:

$$\mathbf{x}^\mathsf{T}\mathbf{A}\mathbf{x} = \mathbf{y}^\mathsf{T}\mathbf{Q}^\mathsf{T}\mathbf{A}\mathbf{Q}\mathbf{y} = \mathbf{y}^\mathsf{T}\boldsymbol{\Lambda}\mathbf{y} = \sum_i\lambda_i y_i^2.$$

A quadratic form is a weighted sum of squares in the eigenbasis, with no cross terms. Since $\sum_i y_i^2 = \|\mathbf{x}\|^2$, replacing every $\lambda_i$ by the largest can only increase the sum and by the smallest can only decrease it:

$$\lambda_{\min}\,\|\mathbf{x}\|^2 \;\le\; \mathbf{x}^\mathsf{T}\mathbf{A}\mathbf{x} \;\le\; \lambda_{\max}\,\|\mathbf{x}\|^2.$$

The ratio $R(\mathbf{x}) = \mathbf{x}^\mathsf{T}\mathbf{A}\mathbf{x}/\mathbf{x}^\mathsf{T}\mathbf{x}$ is the **Rayleigh quotient**; it lies between $\lambda_{\min}$ and $\lambda_{\max}$, and reaches each bound exactly when $\mathbf{x}$ is the corresponding eigenvector. Two uses. First, it is the fastest possible estimate of an eigenvalue: if you have an approximate eigenvector, its Rayleigh quotient is a much better approximation to the eigenvalue than the vector is to the eigenvector. Second, it says that the sign pattern of the eigenvalues decides the sign of $\mathbf{x}^\mathsf{T}\mathbf{A}\mathbf{x}$ for every $\mathbf{x}$ — the observation the next lesson builds positive definiteness on.

::: key Quadratic forms in the eigenbasis
$\mathbf{x}^\mathsf{T}\mathbf{A}\mathbf{x} = \sum_i\lambda_i y_i^2$ with $\mathbf{y} = \mathbf{Q}^\mathsf{T}\mathbf{x}$, so $\lambda_{\min}\lVert\mathbf{x}\rVert^2 \le \mathbf{x}^\mathsf{T}\mathbf{A}\mathbf{x} \le \lambda_{\max}\lVert\mathbf{x}\rVert^2$. The bounds are attained along the extreme eigenvectors.
:::

## Two symmetric matrices you will meet on every vehicle

### Principal axes of an inertia tensor

The inertia tensor $\mathbf{I}$ of a rigid body maps angular velocity to angular momentum, $\mathbf{h} = \mathbf{I}\boldsymbol{\omega}$, and it is symmetric. Its eigenvectors are the **principal axes** and its eigenvalues the **principal moments of inertia**. Spinning about a principal axis makes $\mathbf{h}$ parallel to $\boldsymbol{\omega}$; spinning about any other axis does not, and the vehicle wobbles. The spectral theorem says every rigid body has three perpendicular principal axes, whatever its shape, and that resolving the inertia tensor in the frame of those axes makes it diagonal.

::: example Finding the principal axes of a spacecraft
A spacecraft's inertia tensor in its body frame $B$ is, in $\mathrm{kg\,m^2}$,

$$\mathbf{I}^B = \begin{pmatrix} 110.00 & 16.28 & 5.92 \\ 16.28 & 85.32 & 12.86 \\ 5.92 & 12.86 & 54.68 \end{pmatrix}.$$

The off-diagonal products of inertia say that the body axes are not the principal axes. The characteristic polynomial of a $3\times 3$ matrix is $\lambda^3 - c_2\lambda^2 + c_1\lambda - c_0$ with $c_2 = \operatorname{tr}\mathbf{I}^B = 250$, $c_1$ the sum of the three $2\times 2$ principal minors, $c_1 = (110\times 85.32 - 16.28^2) + (110\times 54.68 - 5.92^2) + (85.32\times 54.68 - 12.86^2) = 19\,600$, and $c_0 = \det\mathbf{I}^B = 480\,000$. The roots of $\lambda^3 - 250\lambda^2 + 19\,600\lambda - 480\,000$ are $\lambda = 120$, $80$ and $50$: check $120 + 80 + 50 = 250$, $120\times 80 + 120\times 50 + 80\times 50 = 19\,600$, $120\times 80\times 50 = 480\,000$. These are the principal moments.

The unit eigenvectors, found from the null spaces of $\mathbf{I}^B - \lambda\mathbf{I}$, are

$$\mathbf{q}_{120} = \begin{pmatrix} 0.8660 \\ 0.4698 \\ 0.1710 \end{pmatrix}, \qquad \mathbf{q}_{80} = \begin{pmatrix} -0.5000 \\ 0.8138 \\ 0.2962 \end{pmatrix}, \qquad \mathbf{q}_{50} = \begin{pmatrix} 0 \\ -0.3420 \\ 0.9397 \end{pmatrix},$$

which are mutually perpendicular (for instance $\mathbf{q}_{120}\cdot\mathbf{q}_{80} = -0.4330 + 0.3823 + 0.0507 = 0.0000$). Placing them as the columns of $\mathbf{Q}$ gives, in the frame notation of Linear Algebra I, $\mathbf{Q} = \mathbf{R}_B^P$: the principal axes written in body coordinates. In fact these columns are exactly those of $\mathbf{R}_1(20^\circ)\mathbf{R}_3(30^\circ)$ — this body frame is yawed $30^\circ$ and then rolled $20^\circ$ from the principal frame — and $\mathbf{I}^B = \mathbf{R}_B^P\operatorname{diag}(120, 80, 50)(\mathbf{R}_B^P)^\mathsf{T}$ is both the spectral decomposition and the frame-change similarity of Lesson 3.

Spin the vehicle at $\boldsymbol{\omega}^B = (0, 0, 0.1)^\mathsf{T}\,\mathrm{rad/s}$ about its body $z$-axis. The angular momentum is $\mathbf{h}^B = \mathbf{I}^B\boldsymbol{\omega}^B = (0.592, 1.286, 5.468)^\mathsf{T}\,\mathrm{kg\,m^2/s}$, which is $14.5^\circ$ away from $\boldsymbol{\omega}^B$: the body $z$-axis is not principal, so torque-free spin about it will nutate. In principal coordinates, $\boldsymbol{\omega}^P = (\mathbf{R}_B^P)^\mathsf{T}\boldsymbol{\omega}^B = (0.0171, 0.0296, 0.0940)^\mathsf{T}$ and $\mathbf{h}^P = (120\times 0.0171,\ 80\times 0.0296,\ 50\times 0.0940)^\mathsf{T} = (2.052, 2.370, 4.698)^\mathsf{T}$, three independent multiplications. Rotating that back with $\mathbf{R}_B^P$ returns the same $\mathbf{h}^B$.
:::

### The covariance ellipse

A $2\times 2$ position covariance $\mathbf{P}$ describes an error ellipse. Its eigenvectors are the ellipse's axes and the square roots of its eigenvalues are the one-sigma semi-axis lengths, because in the eigenbasis the quadratic form $\mathbf{x}^\mathsf{T}\mathbf{P}^{-1}\mathbf{x} = \sum_i y_i^2/\lambda_i$ describes an ellipse with semi-axes $\sqrt{\lambda_i}$.

::: example Reading a position covariance
A navigation filter reports $\mathbf{P} = \begin{pmatrix} 4 & 1.5 \\ 1.5 & 2 \end{pmatrix}\,\mathrm{m^2}$ for the east and north position errors. The diagonal says $\sigma_E = 2\,\mathrm{m}$ and $\sigma_N = 1.41\,\mathrm{m}$, but the positive off-diagonal says the errors are correlated, so the ellipse is tilted. Trace $6$, determinant $8 - 2.25 = 5.75$: $\lambda^2 - 6\lambda + 5.75 = 0$ gives $\lambda_{1,2} = 3 \pm \sqrt{9 - 5.75} = 3 \pm 1.803$, so $\lambda_1 = 4.803\,\mathrm{m^2}$ and $\lambda_2 = 1.197\,\mathrm{m^2}$. The one-sigma semi-axes are $\sqrt{4.803} = 2.19\,\mathrm{m}$ and $\sqrt{1.197} = 1.09\,\mathrm{m}$. The major axis is the eigenvector for $4.803$: the first row of $\mathbf{P} - 4.803\mathbf{I}$ gives $-0.803v_1 + 1.5v_2 = 0$, so $\mathbf{q}_1 \propto (1.5, 0.803)$, at an angle $\arctan(0.803/1.5) = 28.2^\circ$ north of east.

Two things the diagonal alone would have hidden. The worst-case one-sigma error is $2.19\,\mathrm{m}$, not $2\,\mathrm{m}$, and it lies along a diagonal direction, not along east. And the area of the ellipse is $\pi\sqrt{\lambda_1\lambda_2} = \pi\sqrt{\det\mathbf{P}} = 7.53\,\mathrm{m^2}$, which the Rayleigh bound reinterprets: in every direction $\hat{\mathbf{u}}$, the variance $\hat{\mathbf{u}}^\mathsf{T}\mathbf{P}\hat{\mathbf{u}}$ lies between $1.197$ and $4.803\,\mathrm{m^2}$. Along $(1,1)/\sqrt{2}$ it is $(4 + 3 + 2)/2 = 4.5\,\mathrm{m^2}$; along $(1,-1)/\sqrt{2}$ it is $(4 - 3 + 2)/2 = 1.5\,\mathrm{m^2}$. Both are inside the bounds, as they must be.
:::

## Symmetric matrices in NumPy

```python
import numpy as np

P = np.array([[4.0, 1.5], [1.5, 2.0]])
w, Q = np.linalg.eigh(P)          # eigh: symmetric solver, ascending eigenvalues
print(w)                          # [1.19722436 4.80277564]
print(Q[:, 1])                    # [0.88167787 0.47185793]  major axis, unit length
print(np.allclose(Q @ np.diag(w) @ Q.T, P))   # True: the spectral decomposition
print(np.allclose(Q.T @ Q, np.eye(2)))        # True: Q is orthogonal
sqrtP = Q @ np.diag(np.sqrt(w)) @ Q.T        # symmetric square root
print(np.allclose(sqrtP @ sqrtP, P))          # True
```

Use `eigh`, not `eig`, whenever the matrix is symmetric. It exploits the symmetry to run faster, it returns eigenvalues that are exactly real and sorted, and its eigenvectors are orthonormal to round-off. `eig` on the same matrix returns complex-typed arrays with zero imaginary parts and eigenvectors that are only approximately orthogonal.

::: warning A matrix that is symmetric on paper may not be in memory
A covariance updated by $\mathbf{P} \leftarrow (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}$ is symmetric in exact arithmetic and unsymmetric by a few units in the last place after one floating-point update. `eigh` reads only one triangle and silently assumes the other matches; `eig` sees the asymmetry and may return tiny imaginary parts. The standard defence is to symmetrise after every update, $\mathbf{P} \leftarrow \tfrac{1}{2}(\mathbf{P} + \mathbf{P}^\mathsf{T})$, which costs almost nothing and removes the drift before it grows. The next lesson explains why the asymmetry is only the first symptom of a deeper problem with that update.
:::

::: warning Real eigenvalues do not imply orthogonal eigenvectors
$\begin{pmatrix} 4 & 1 \\ 2 & 3 \end{pmatrix}$ has real eigenvalues $5$ and $2$ but eigenvectors $(1, 1)^\mathsf{T}$ and $(1, -2)^\mathsf{T}$, which are not perpendicular. Realness of eigenvalues follows from symmetry, but not the other way round; orthogonality of eigenvectors needs symmetry. If you write $\mathbf{V}^\mathsf{T}$ where $\mathbf{V}^{-1}$ belongs, check $\mathbf{A}^\mathsf{T} = \mathbf{A}$ first.
:::

## Check yourself

::: check
Find the spectral decomposition of $\mathbf{A} = \begin{pmatrix} 1 & 2 \\ 2 & -2 \end{pmatrix}$ and verify that the eigenvectors are orthogonal.
:::

::: answer
Trace $-1$, determinant $-2 - 4 = -6$: $\lambda^2 + \lambda - 6 = (\lambda + 3)(\lambda - 2)$, so $\lambda_1 = 2$, $\lambda_2 = -3$. For $\lambda = 2$ the first row of $\mathbf{A} - 2\mathbf{I}$ gives $-v_1 + 2v_2 = 0$, $\mathbf{v}_1 = (2, 1)^\mathsf{T}$; check $\mathbf{A}\mathbf{v}_1 = (4, 2)^\mathsf{T}$. For $\lambda = -3$, $4v_1 + 2v_2 = 0$, $\mathbf{v}_2 = (1, -2)^\mathsf{T}$; check $\mathbf{A}\mathbf{v}_2 = (-3, 6)^\mathsf{T}$. Dot product $2 - 2 = 0$: orthogonal. So $\mathbf{Q} = \tfrac{1}{\sqrt{5}}\begin{pmatrix} 2 & 1 \\ 1 & -2 \end{pmatrix}$ and $\boldsymbol{\Lambda} = \operatorname{diag}(2, -3)$. One eigenvalue is negative, so the matrix stretches one axis and flips the other; it is symmetric but, in the language of the next lesson, indefinite.
:::

::: check
A symmetric matrix has eigenvalues $9$, $4$ and $1$. Without knowing its eigenvectors, give $\mathbf{x}^\mathsf{T}\mathbf{A}\mathbf{x}$'s range for unit vectors $\mathbf{x}$, the eigenvalues of $\mathbf{A}^{-1}$ and of $\mathbf{A}^{1/2}$, and $\det\mathbf{A}$.
:::

::: answer
By the Rayleigh bounds, $1 \le \mathbf{x}^\mathsf{T}\mathbf{A}\mathbf{x} \le 9$ for $\|\mathbf{x}\| = 1$. $\mathbf{A}^{-1} = \mathbf{Q}\boldsymbol{\Lambda}^{-1}\mathbf{Q}^\mathsf{T}$ has eigenvalues $1/9$, $1/4$, $1$ and $\mathbf{A}^{1/2} = \mathbf{Q}\boldsymbol{\Lambda}^{1/2}\mathbf{Q}^\mathsf{T}$ has eigenvalues $3$, $2$, $1$, both with the same eigenvectors as $\mathbf{A}$. $\det\mathbf{A} = 9\times 4\times 1 = 36$. All of this follows from the eigenvalues alone because the spectral theorem guarantees the eigenvectors are an orthonormal set, whatever they are.
:::

::: check
Why can a real symmetric matrix never describe a rotation by an angle other than $0$ or $180^\circ$?
:::

::: answer
A rotation of the plane by $\theta$ has eigenvalues $e^{\pm i\theta}$, complex unless $\theta = 0$ or $\pi$. A symmetric matrix has only real eigenvalues, so it cannot have that spectrum. Geometrically, a symmetric matrix only stretches along perpendicular axes; the only "rotations" it can produce are flips of some axes ($\lambda = -1$), which are rotations by $180^\circ$ in the plane of two flipped axes or reflections if one axis is flipped. Indeed a rotation matrix $\mathbf{R}_3(\theta)$ is symmetric only when $\sin\theta = 0$.
:::

::: check
The projection matrix onto a unit vector is $\mathbf{P} = \hat{\mathbf{u}}\hat{\mathbf{u}}^\mathsf{T}$. Use the spectral theorem to find its eigenvalues and eigenvectors in $\mathbb{R}^3$.
:::

::: answer
$\mathbf{P}$ is symmetric, so it has an orthonormal eigenbasis. $\mathbf{P}\hat{\mathbf{u}} = \hat{\mathbf{u}}(\hat{\mathbf{u}}\cdot\hat{\mathbf{u}}) = \hat{\mathbf{u}}$: eigenvalue $1$ along $\hat{\mathbf{u}}$. For any $\mathbf{x} \perp \hat{\mathbf{u}}$, $\mathbf{P}\mathbf{x} = \hat{\mathbf{u}}(\hat{\mathbf{u}}\cdot\mathbf{x}) = \mathbf{0}$: eigenvalue $0$ on the whole perpendicular plane. So the eigenvalues are $1, 0, 0$ and the spectral form $\mathbf{P} = 1\cdot\hat{\mathbf{u}}\hat{\mathbf{u}}^\mathsf{T} + 0 + 0$ is the matrix itself. Trace $1$ = rank, as for every projection.
:::

::: check
A filter's $3\times 3$ position covariance has eigenvalues $25$, $4$ and $0.01\,\mathrm{m^2}$. Describe the uncertainty ellipsoid and say what the smallest eigenvalue tells you about the measurements.
:::

::: answer
The one-sigma ellipsoid has semi-axes $\sqrt{25} = 5\,\mathrm{m}$, $\sqrt{4} = 2\,\mathrm{m}$ and $\sqrt{0.01} = 0.1\,\mathrm{m}$ along the three eigenvectors — a flattened disc, very well determined along one axis and poorly along another, with a $50:1$ ratio of longest to shortest. The smallest eigenvalue marks the direction the measurements constrain best; the largest marks the direction they barely constrain. Along the $5\,\mathrm{m}$ axis the filter is relying mostly on its dynamics model. The ratio of extreme eigenvalues is the condition number of Lesson 10, and $2500$ is large enough to make the filter's arithmetic in that direction worth watching.
:::

## Summary

| Item | Statement |
| --- | --- |
| Symmetric | $\mathbf{A}^\mathsf{T} = \mathbf{A}$; $(\mathbf{A}\mathbf{x})\cdot\mathbf{y} = \mathbf{x}\cdot(\mathbf{A}\mathbf{y})$ |
| Eigenvalues | all real; proof via $\bar{\mathbf{v}}^\mathsf{T}\mathbf{A}\mathbf{v}$ equal to its own conjugate |
| Eigenvectors | orthogonal for distinct eigenvalues; repeated eigenvalues have full-dimensional eigenspaces, never defective |
| Spectral theorem | $\mathbf{A} = \mathbf{Q}\boldsymbol{\Lambda}\mathbf{Q}^\mathsf{T}$, $\mathbf{Q}$ orthogonal, $\boldsymbol{\Lambda}$ real diagonal; $\mathbf{Q}^\mathsf{T}\mathbf{A}\mathbf{Q} = \boldsymbol{\Lambda}$ |
| Rank-one form | $\mathbf{A} = \sum_i\lambda_i\mathbf{q}_i\mathbf{q}_i^\mathsf{T}$; $\mathbf{A}\mathbf{x} = \sum_i\lambda_i(\mathbf{q}_i\cdot\mathbf{x})\mathbf{q}_i$ |
| Functions | $\mathbf{A}^k$, $\mathbf{A}^{-1}$, $e^{\mathbf{A}t}$, $\mathbf{A}^{1/2} = \mathbf{Q}\boldsymbol{\Lambda}^{1/2}\mathbf{Q}^\mathsf{T}$ share the eigenvectors |
| Rayleigh quotient | $\lambda_{\min}\lVert\mathbf{x}\rVert^2 \le \mathbf{x}^\mathsf{T}\mathbf{A}\mathbf{x} \le \lambda_{\max}\lVert\mathbf{x}\rVert^2$ |
| Inertia tensor | eigenvectors are the principal axes, eigenvalues the principal moments; $\mathbf{I}^B = \mathbf{R}_B^P\,\mathbf{I}^P(\mathbf{R}_B^P)^\mathsf{T}$ |
| Covariance ellipse | axes along eigenvectors, one-sigma semi-axes $\sqrt{\lambda_i}$, area $\pi\sqrt{\det\mathbf{P}}$ in 2-D |
| NumPy | `np.linalg.eigh` for symmetric matrices; symmetrise with $\tfrac{1}{2}(\mathbf{P} + \mathbf{P}^\mathsf{T})$ |

The next lesson asks the one further question that matters for a covariance: are the eigenvalues all positive? That is positive definiteness, and it is the property that every covariance, information matrix and cost-function Hessian must have.
