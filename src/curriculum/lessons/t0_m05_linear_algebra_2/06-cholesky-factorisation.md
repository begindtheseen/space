---
id: l06-cholesky-factorisation
title: The Cholesky factorisation
minutes: 21
covers:
  - Cholesky factorisation
---

Lesson 5 ended with a test: a symmetric matrix is positive definite exactly when every pivot of Gaussian elimination is positive. Take the square root of each pivot and fold it into the elimination multipliers and you have written the matrix as $\mathbf{A} = \mathbf{L}\mathbf{L}^\mathsf{T}$, a lower-triangular matrix times its own transpose. That is the Cholesky factorisation, and it is the single most used factorisation in estimation.

Three reasons. It is the cheapest way to solve $\mathbf{A}\mathbf{x} = \mathbf{b}$ when $\mathbf{A}$ is symmetric positive definite — half the work of LU, no pivoting, and it fails cleanly if the matrix turns out not to be positive definite, which makes it the practical PD test. It is a *matrix square root*: a covariance $\mathbf{P} = \mathbf{L}\mathbf{L}^\mathsf{T}$ can be sampled, whitened and turned into sigma points using $\mathbf{L}$ alone. And a filter that stores $\mathbf{L}$ instead of $\mathbf{P}$ can never produce a covariance with a negative eigenvalue, because $\mathbf{L}\mathbf{L}^\mathsf{T}$ is positive semi-definite whatever numbers happen to sit in $\mathbf{L}$.

This lesson derives the factorisation from elimination, writes down the algorithm and its cost, shows how to solve and how to test with it, and then spends the second half on the covariance square root: sampling, whitening, sigma points and the idea behind square-root Kalman filters.

## From elimination to a square root

Recall the LU factorisation of Linear Algebra I: elimination without row exchanges writes $\mathbf{A} = \mathbf{L}\mathbf{U}$ with $\mathbf{L}$ unit lower triangular (ones on the diagonal, the multipliers below) and $\mathbf{U}$ upper triangular with the pivots $d_1, \dots, d_n$ on its diagonal. Pull the pivots out of $\mathbf{U}$ as a diagonal matrix $\mathbf{D}$, so that $\mathbf{U} = \mathbf{D}\mathbf{U}'$ with $\mathbf{U}'$ unit upper triangular, and $\mathbf{A} = \mathbf{L}\mathbf{D}\mathbf{U}'$.

Now use symmetry. Transposing, $\mathbf{A} = \mathbf{A}^\mathsf{T} = \mathbf{U}'^\mathsf{T}\mathbf{D}\mathbf{L}^\mathsf{T}$, which is another factorisation of the same shape — unit lower, diagonal, unit upper. The LU factorisation without pivoting is unique when it exists, so the two must agree: $\mathbf{U}' = \mathbf{L}^\mathsf{T}$, and

$$\mathbf{A} = \mathbf{L}\mathbf{D}\mathbf{L}^\mathsf{T}.$$

This is the **LDL$^\mathsf{T}$ factorisation**, and it exists for any symmetric matrix whose elimination needs no row exchanges. If $\mathbf{A}$ is positive definite every pivot $d_i$ is positive, so $\mathbf{D}^{1/2} = \operatorname{diag}(\sqrt{d_i})$ is real, and absorbing one factor of it into each triangle gives

$$\mathbf{A} = (\mathbf{L}\mathbf{D}^{1/2})(\mathbf{L}\mathbf{D}^{1/2})^\mathsf{T} = \mathbf{G}\mathbf{G}^\mathsf{T}.$$

Renaming $\mathbf{G}$ as $\mathbf{L}$ — from here on $\mathbf{L}$ is this lower-triangular factor with the square roots of the pivots on its diagonal — this is the Cholesky factorisation. Conversely, if $\mathbf{A} = \mathbf{L}\mathbf{L}^\mathsf{T}$ with $\mathbf{L}$ invertible then $\mathbf{x}^\mathsf{T}\mathbf{A}\mathbf{x} = \|\mathbf{L}^\mathsf{T}\mathbf{x}\|^2 > 0$ for $\mathbf{x} \neq \mathbf{0}$, so $\mathbf{A}$ is positive definite. The two statements are equivalent.

::: key The Cholesky factorisation
Every symmetric positive definite matrix has a unique factorisation $\mathbf{A} = \mathbf{L}\mathbf{L}^\mathsf{T}$ with $\mathbf{L}$ lower triangular and positive diagonal, computed in about $n^3/3$ flops — half the cost of LU — with no pivoting. The factorisation exists if and only if $\mathbf{A}$ is positive definite, so a failed Cholesky is the standard PD test. GNC uses $\mathbf{L}$ as the covariance square root: for sigma-point generation in a UKF, and in square-root filters that keep $\mathbf{P} = \mathbf{L}\mathbf{L}^\mathsf{T}$ positive definite by construction.
:::

## The algorithm

Rather than run elimination and then take square roots, compute $\mathbf{L}$ directly by matching entries of $\mathbf{A} = \mathbf{L}\mathbf{L}^\mathsf{T}$. The $(i, j)$ entry of $\mathbf{L}\mathbf{L}^\mathsf{T}$ is $\sum_k l_{ik}l_{jk}$, and because $\mathbf{L}$ is lower triangular the sum stops at $k = \min(i, j)$. Work down one column at a time. For column $j$, the diagonal entry gives

$$a_{jj} = \sum_{k=1}^{j}l_{jk}^2 \quad\Longrightarrow\quad l_{jj} = \sqrt{a_{jj} - \sum_{k=1}^{j-1}l_{jk}^2},$$

and every entry below it, $i > j$, gives

$$a_{ij} = \sum_{k=1}^{j}l_{ik}l_{jk} \quad\Longrightarrow\quad l_{ij} = \frac{1}{l_{jj}}\Big(a_{ij} - \sum_{k=1}^{j-1}l_{ik}l_{jk}\Big).$$

Everything on the right-hand side belongs to earlier columns, so the recursion never refers to an unknown. The quantity under the square root is exactly the $j$-th pivot of elimination, $d_j = l_{jj}^2$; if it is zero or negative the matrix is not positive definite and the algorithm stops there, at column $j$, having done only a fraction of the work. That early exit is what makes Cholesky the cheapest PD test available.

The count is one inner product of length up to $j$ for each of the $n - j$ entries in column $j$, which sums to about $n^3/6$ multiplications and as many additions, $n^3/3$ flops in total, against $2n^3/3$ for LU on a general matrix. There are only $n$ square roots. No pivoting is needed for stability: from the diagonal formula $\sum_k l_{jk}^2 = a_{jj}$, every entry of $\mathbf{L}$ satisfies $|l_{jk}| \le \sqrt{a_{jj}}$, so the factor can never contain a number larger than the square root of the largest diagonal entry of $\mathbf{A}$, and nothing can grow. Cholesky is backward stable without any row exchanges, which also means the factor can be computed in place, overwriting the lower triangle of $\mathbf{A}$.

::: example Factoring a three-by-three matrix by hand
Take the matrix Lesson 5 tested, $\mathbf{A} = \begin{pmatrix} 4 & 2 & 0 \\ 2 & 5 & 3 \\ 0 & 3 & 6 \end{pmatrix}$, whose pivots were $4, 4, 3.75$.

Column 1: $l_{11} = \sqrt{4} = 2$, $l_{21} = 2/2 = 1$, $l_{31} = 0/2 = 0$.

Column 2: $l_{22} = \sqrt{5 - l_{21}^2} = \sqrt{5 - 1} = 2$, then $l_{32} = (3 - l_{31}l_{21})/l_{22} = (3 - 0)/2 = 1.5$.

Column 3: $l_{33} = \sqrt{6 - l_{31}^2 - l_{32}^2} = \sqrt{6 - 0 - 2.25} = \sqrt{3.75} = 1.9365$.

$$\mathbf{L} = \begin{pmatrix} 2 & 0 & 0 \\ 1 & 2 & 0 \\ 0 & 1.5 & 1.9365 \end{pmatrix}.$$

Check by multiplying back: row 2 of $\mathbf{L}$ against row 3 gives $1\times 0 + 2\times 1.5 + 0 = 3 = a_{23}$; row 3 against itself gives $0 + 2.25 + 3.75 = 6 = a_{33}$. The diagonal squares $4, 4, 3.75$ are the pivots, as promised, and $\det\mathbf{A} = (\det\mathbf{L})^2 = (2\times 2\times 1.9365)^2 = 7.746^2 = 60.0$, matching Lesson 5.

Now the indefinite variant with $a_{33} = 2$. Columns 1 and 2 are identical. Column 3 asks for $l_{33} = \sqrt{2 - 0 - 2.25} = \sqrt{-0.25}$, and the algorithm stops: the matrix is not positive definite. It found that out after computing five entries, without ever forming a determinant or an eigenvalue.
:::

## Solving, determinants and inverses

To solve $\mathbf{A}\mathbf{x} = \mathbf{b}$ with $\mathbf{A} = \mathbf{L}\mathbf{L}^\mathsf{T}$, split the problem into two triangular systems:

$$\mathbf{L}\mathbf{y} = \mathbf{b} \ \text{(forward substitution)}, \qquad \mathbf{L}^\mathsf{T}\mathbf{x} = \mathbf{y} \ \text{(back substitution)}.$$

Each costs $n^2$ flops, negligible next to the $n^3/3$ of the factorisation, so once $\mathbf{L}$ is known you can solve for many right-hand sides cheaply. This is how a Kalman gain should be computed: never form $(\mathbf{H}\mathbf{P}\mathbf{H}^\mathsf{T} + \mathbf{R})^{-1}$ explicitly, but factor the innovation covariance $\mathbf{S} = \mathbf{H}\mathbf{P}\mathbf{H}^\mathsf{T} + \mathbf{R}$ once and solve $\mathbf{S}\mathbf{K}^\mathsf{T} = \mathbf{H}\mathbf{P}^\mathsf{T}$ column by column. It is cheaper than inverting and more accurate, and if the Cholesky of $\mathbf{S}$ fails you have learned that $\mathbf{P}$ or $\mathbf{R}$ is corrupt before the bad gain reaches the state.

::: example Two triangular solves
With the $\mathbf{L}$ above, solve $\mathbf{A}\mathbf{x} = (2, 10, 15)^\mathsf{T}$.

Forward, $\mathbf{L}\mathbf{y} = \mathbf{b}$: $2y_1 = 2 \Rightarrow y_1 = 1$; $y_1 + 2y_2 = 10 \Rightarrow y_2 = 4.5$; $1.5y_2 + 1.9365y_3 = 15 \Rightarrow y_3 = (15 - 6.75)/1.9365 = 4.2603$.

Back, $\mathbf{L}^\mathsf{T}\mathbf{x} = \mathbf{y}$: $1.9365x_3 = 4.2603 \Rightarrow x_3 = 2.2$; $2x_2 + 1.5x_3 = 4.5 \Rightarrow x_2 = (4.5 - 3.3)/2 = 0.6$; $2x_1 + x_2 = 1 \Rightarrow x_1 = 0.2$.

Check: $\mathbf{A}\mathbf{x} = (0.8 + 1.2,\ 0.4 + 3 + 6.6,\ 1.8 + 13.2)^\mathsf{T} = (2, 10, 15)^\mathsf{T}$.
:::

Two by-products come free. The determinant is $\det\mathbf{A} = \prod_i l_{ii}^2$, and its logarithm $\ln\det\mathbf{A} = 2\sum_i\ln l_{ii}$ is how a Gaussian log-likelihood is evaluated without overflow — the $\ln\det\mathbf{S}$ term in every innovation-likelihood test comes from the Cholesky factor of $\mathbf{S}$. And if you genuinely need $\mathbf{A}^{-1}$, solve $\mathbf{A}\mathbf{X} = \mathbf{I}$ column by column: for the matrix above this gives

$$\mathbf{A}^{-1} = \begin{pmatrix} 0.35 & -0.2 & 0.1 \\ -0.2 & 0.4 & -0.2 \\ 0.1 & -0.2 & 0.2667 \end{pmatrix},$$

symmetric, as the inverse of a symmetric matrix must be, and positive definite with eigenvalues $1/\lambda_i$. Whether to form the inverse at all is a separate question, and the answer is usually no: a solve is cheaper and loses fewer digits than a multiply by an explicit inverse.

## LDL$^\mathsf{T}$ and the UD filter

The square roots are the only part of Cholesky that is not a rational operation, and the $\mathbf{L}\mathbf{D}\mathbf{L}^\mathsf{T}$ form avoids them: $\mathbf{L}$ unit lower triangular, $\mathbf{D}$ the pivots. For the running example $\mathbf{D} = \operatorname{diag}(4, 4, 3.75)$ and the unit factor has $l_{21} = 0.5$, $l_{32} = 0.75$, obtained by dividing each column of the Cholesky factor by its diagonal. The same two triangular solves, with a diagonal scaling in between, solve the system. Bierman's **UD filter**, the form in which the Kalman filter flew on many spacecraft of the 1970s and 1980s, stores the covariance as $\mathbf{P} = \mathbf{U}\mathbf{D}\mathbf{U}^\mathsf{T}$ with $\mathbf{U}$ unit *upper* triangular, updating $\mathbf{U}$ and $\mathbf{D}$ directly so that $\mathbf{P}$ is never formed and can never go indefinite. With symmetric pivoting the $\mathbf{L}\mathbf{D}\mathbf{L}^\mathsf{T}$ form also extends to indefinite symmetric matrices, where Cholesky does not; `scipy.linalg.ldl` computes it.

## The covariance square root

A **square root** of a covariance $\mathbf{P}$ is any matrix $\mathbf{S}$ with $\mathbf{S}\mathbf{S}^\mathsf{T} = \mathbf{P}$. The Cholesky factor is one; the symmetric square root $\mathbf{P}^{1/2} = \mathbf{Q}\boldsymbol{\Lambda}^{1/2}\mathbf{Q}^\mathsf{T}$ of Lesson 4 is another; and if $\mathbf{S}$ is a square root so is $\mathbf{S}\mathbf{W}$ for any orthogonal $\mathbf{W}$, because $\mathbf{S}\mathbf{W}\mathbf{W}^\mathsf{T}\mathbf{S}^\mathsf{T} = \mathbf{S}\mathbf{S}^\mathsf{T}$. The square root is not unique, and that freedom is used: the Cholesky factor is the cheap one, the symmetric one is the unique symmetric PD one, and the triangular shape of the Cholesky factor is what lets a square-root filter update it with a QR factorisation.

Everything a square root is used for follows from the sandwich rule of Lesson 5. Let $\mathbf{z}$ be a vector of $n$ independent standard normal variables, so its covariance is $\mathbf{I}$. Then $\mathbf{x} = \boldsymbol{\mu} + \mathbf{L}\mathbf{z}$ has mean $\boldsymbol{\mu}$ and covariance $\mathbf{L}\mathbf{I}\mathbf{L}^\mathsf{T} = \mathbf{P}$: this is how correlated Gaussian samples are generated for a Monte Carlo run. In reverse, if $\mathbf{e}$ has covariance $\mathbf{P}$ then $\mathbf{L}^{-1}\mathbf{e}$ has covariance $\mathbf{L}^{-1}\mathbf{P}\mathbf{L}^{-\mathsf{T}} = \mathbf{L}^{-1}\mathbf{L}\mathbf{L}^\mathsf{T}\mathbf{L}^{-\mathsf{T}} = \mathbf{I}$: **whitening**, computed by one forward substitution. And the Mahalanobis distance of Lesson 5 is the length of the whitened vector,

$$\mathbf{e}^\mathsf{T}\mathbf{P}^{-1}\mathbf{e} = \mathbf{e}^\mathsf{T}\mathbf{L}^{-\mathsf{T}}\mathbf{L}^{-1}\mathbf{e} = \|\mathbf{L}^{-1}\mathbf{e}\|^2,$$

so an outlier test needs one triangular solve and never $\mathbf{P}^{-1}$.

### Sigma points

The unscented Kalman filter represents a Gaussian with mean $\hat{\mathbf{x}}$ and covariance $\mathbf{P}$ by $2n + 1$ deterministic **sigma points**: the mean itself, and

$$\boldsymbol{\chi}_{\pm j} = \hat{\mathbf{x}} \pm \sqrt{n + \lambda}\ \mathbf{l}_j, \qquad j = 1, \dots, n,$$

where $\mathbf{l}_j$ is the $j$-th column of a square root of $\mathbf{P}$ and $\lambda$ is a spread parameter. The columns are used because $\sum_j\mathbf{l}_j\mathbf{l}_j^\mathsf{T} = \mathbf{L}\mathbf{L}^\mathsf{T} = \mathbf{P}$, so the weighted sample covariance of the points reproduces $\mathbf{P}$ exactly. The points are pushed through the nonlinear dynamics or measurement function one at a time, and their spread afterwards *is* the propagated covariance, with no Jacobian. Cholesky is the square root of choice because it is the cheapest and because a failed factorisation catches a bad $\mathbf{P}$ before any point is generated.

::: example Sigma points from a two-by-two covariance
Take the position covariance of Lesson 4, $\mathbf{P} = \begin{pmatrix} 4 & 1.5 \\ 1.5 & 2 \end{pmatrix}\,\mathrm{m^2}$, about a mean $\hat{\mathbf{x}} = (100, 50)^\mathsf{T}\,\mathrm{m}$. Cholesky: $l_{11} = 2$, $l_{21} = 1.5/2 = 0.75$, $l_{22} = \sqrt{2 - 0.5625} = 1.1990$, so

$$\mathbf{L} = \begin{pmatrix} 2 & 0 \\ 0.75 & 1.1990 \end{pmatrix}, \qquad \mathbf{L}\mathbf{L}^\mathsf{T} = \begin{pmatrix} 4 & 1.5 \\ 1.5 & 0.5625 + 1.4375 \end{pmatrix} = \mathbf{P}.$$

With $n = 2$ and $\lambda = 1$ the scale is $\sqrt{3} = 1.732$. The four off-centre points are $\hat{\mathbf{x}} \pm 1.732\,(2, 0.75)^\mathsf{T} = (103.46, 51.30)$ and $(96.54, 48.70)$, and $\hat{\mathbf{x}} \pm 1.732\,(0, 1.1990)^\mathsf{T} = (100, 52.08)$ and $(100, 47.92)$, all in metres. Note that the first pair is tilted — it carries the correlation — while the second pair is purely north–south. Neither pair lies along the ellipse's principal axes, and it does not need to: what matters is that the spread of the set reproduces $\mathbf{P}$. Had we used the symmetric square root, $\mathbf{P}^{1/2} = \begin{pmatrix} 1.9472 & 0.4565 \\ 0.4565 & 1.3385 \end{pmatrix}$, the points would be different but the sample covariance identical.
:::

### Square-root filters

Round-off in $\mathbf{P} \leftarrow (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}$ can push an eigenvalue negative; Lesson 5 showed why. A **square-root filter** removes the possibility by never storing $\mathbf{P}$. It stores a factor $\mathbf{S}$ and works out how each filter step acts on $\mathbf{S}$ so that $\mathbf{S}\mathbf{S}^\mathsf{T}$ is the covariance the textbook would have computed. Whatever round-off does to the entries of $\mathbf{S}$, the implied covariance $\mathbf{S}\mathbf{S}^\mathsf{T}$ is a Gram matrix and therefore PSD, and it is exactly symmetric because it is never formed.

The prediction step shows how such an update goes. With $\mathbf{P}_k = \mathbf{S}_k\mathbf{S}_k^\mathsf{T}$ and $\mathbf{Q} = \mathbf{G}\mathbf{G}^\mathsf{T}$,

$$\mathbf{P}_{k+1} = \boldsymbol{\Phi}\mathbf{S}_k\mathbf{S}_k^\mathsf{T}\boldsymbol{\Phi}^\mathsf{T} + \mathbf{G}\mathbf{G}^\mathsf{T} = \begin{pmatrix} \boldsymbol{\Phi}\mathbf{S}_k & \mathbf{G} \end{pmatrix}\begin{pmatrix} \boldsymbol{\Phi}\mathbf{S}_k & \mathbf{G} \end{pmatrix}^\mathsf{T}.$$

The wide matrix $\mathbf{M} = \begin{pmatrix} \boldsymbol{\Phi}\mathbf{S}_k & \mathbf{G} \end{pmatrix}$ is a square root of $\mathbf{P}_{k+1}$, but not a triangular one. Factor its transpose as $\mathbf{M}^\mathsf{T} = \mathbf{Q}_{\mathrm{orth}}\mathbf{R}$ with the QR of Linear Algebra I; then $\mathbf{M}\mathbf{M}^\mathsf{T} = \mathbf{R}^\mathsf{T}\mathbf{Q}_{\mathrm{orth}}^\mathsf{T}\mathbf{Q}_{\mathrm{orth}}\mathbf{R} = \mathbf{R}^\mathsf{T}\mathbf{R}$, so $\mathbf{S}_{k+1} = \mathbf{R}^\mathsf{T}$ is the new lower-triangular factor. The orthogonal matrix is never applied to anything; the QR step is a pure re-triangularisation. The measurement update has an analogous form. The bonus is numerical: Lesson 10 will show that the condition number of $\mathbf{S}$ is the square root of that of $\mathbf{P}$, so a square-root filter works with half as many digits at risk.

::: warning A positive semi-definite matrix can fail Cholesky
Cholesky requires positive *definite*. The rank-one process noise $\mathbf{Q} = \mathbf{G}\sigma_a^2\mathbf{G}^\mathsf{T}$ of Lesson 5, $\begin{pmatrix} 6.25\times 10^{-6} & 1.25\times 10^{-4} \\ 1.25\times 10^{-4} & 2.5\times 10^{-3} \end{pmatrix}$, is PSD with an exactly zero eigenvalue. Its second pivot is $2.5\times 10^{-3} - (1.25\times 10^{-4})^2/(6.25\times 10^{-6}) = 0$ in exact arithmetic and $-4.3\times 10^{-19}$ in float64, so `np.linalg.cholesky` raises. Nothing is wrong with $\mathbf{Q}$; the tool is the wrong one. Use the factor you already have ($\mathbf{G}\sigma_a$ is a perfectly good square root), or an eigen-decomposition, or $\mathbf{L}\mathbf{D}\mathbf{L}^\mathsf{T}$ with pivoting. Adding a tiny multiple of $\mathbf{I}$ — "jitter" — also works, but it changes the matrix, and you should know by how much.
:::

::: warning Cholesky reads one triangle
Like `eigh`, `np.linalg.cholesky` and its LAPACK counterpart look only at the lower (or upper) triangle and assume the other matches. A covariance that has drifted off symmetric will factor happily, and $\mathbf{L}\mathbf{L}^\mathsf{T}$ will equal the symmetrised version of one triangle, not the matrix you had. Symmetrise first, so that the check is honest.
:::

## Cholesky in NumPy

```python
import numpy as np

A = np.array([[4.0, 2.0, 0.0], [2.0, 5.0, 3.0], [0.0, 3.0, 6.0]])
L = np.linalg.cholesky(A)                    # lower triangular, A = L @ L.T
print(np.round(L, 4))
# [[2.     0.     0.    ]
#  [1.     2.     0.    ]
#  [0.     1.5    1.9365]]
b = np.array([2.0, 10.0, 15.0])
from scipy.linalg import solve_triangular
y = solve_triangular(L, b, lower=True)       # forward
x = solve_triangular(L.T, y, lower=False)    # back
print(x)                                     # [0.2 0.6 2.2]
print(2 * np.sum(np.log(np.diag(L))))        # 4.0943 = ln 60 = ln det A
rng = np.random.default_rng(0)
z = rng.standard_normal((3, 100000))
samples = L @ z                              # covariance ≈ A
print(np.round(np.cov(samples), 2))          # close to A
```

`scipy.linalg.cho_factor` and `cho_solve` bundle the factorisation and the two triangular solves, and are what to reach for when the same PD matrix is solved against many right-hand sides.

## Check yourself

::: check
Compute the Cholesky factor of $\mathbf{A} = \begin{pmatrix} 9 & 3 \\ 3 & 5 \end{pmatrix}$ and use it to state $\det\mathbf{A}$ and to decide whether $\mathbf{A}$ is positive definite.
:::

::: answer
$l_{11} = \sqrt{9} = 3$, $l_{21} = 3/3 = 1$, $l_{22} = \sqrt{5 - 1^2} = 2$. So $\mathbf{L} = \begin{pmatrix} 3 & 0 \\ 1 & 2 \end{pmatrix}$, and $\mathbf{L}\mathbf{L}^\mathsf{T} = \begin{pmatrix} 9 & 3 \\ 3 & 1 + 4 \end{pmatrix}$ checks. Both diagonal entries are real and positive, so the factorisation exists and $\mathbf{A}$ is positive definite; $\det\mathbf{A} = (3\times 2)^2 = 36$, which agrees with $45 - 9$.
:::

::: check
Attempt the Cholesky factorisation of $\mathbf{B} = \begin{pmatrix} 1 & 3 \\ 3 & 5 \end{pmatrix}$. What happens, and what does it tell you?
:::

::: answer
$l_{11} = 1$, $l_{21} = 3$, and then $l_{22} = \sqrt{5 - 9} = \sqrt{-4}$, which is not real. The second pivot is $-4$, so $\mathbf{B}$ is not positive definite. Its eigenvalues confirm it: trace $6$, determinant $-4$, so $\lambda = 3 \pm\sqrt{13} = 6.61$ and $-0.606$, indefinite. The factorisation failed at the first place where it could have — it needed only one square root and one division to reach the verdict.
:::

::: check
A filter needs to compute $\mathbf{K} = \mathbf{P}\mathbf{H}^\mathsf{T}\mathbf{S}^{-1}$ with $\mathbf{S}$ a $3\times 3$ innovation covariance. Describe how to do it with Cholesky and without forming $\mathbf{S}^{-1}$, and say what a failed factorisation would mean.
:::

::: answer
Transpose the equation to $\mathbf{S}\mathbf{K}^\mathsf{T} = \mathbf{H}\mathbf{P}^\mathsf{T} = \mathbf{H}\mathbf{P}$ (using $\mathbf{S}^\mathsf{T} = \mathbf{S}$ and $\mathbf{P}^\mathsf{T} = \mathbf{P}$). Factor $\mathbf{S} = \mathbf{L}\mathbf{L}^\mathsf{T}$ once, at about $3^3/3 = 9$ flops, then for each of the $n$ columns of $\mathbf{H}\mathbf{P}$ do a forward and a back substitution to get the corresponding column of $\mathbf{K}^\mathsf{T}$. This costs the same as a multiply by $\mathbf{S}^{-1}$ would but avoids computing and storing an inverse, and it is more accurate. If the factorisation fails, $\mathbf{S} = \mathbf{H}\mathbf{P}\mathbf{H}^\mathsf{T} + \mathbf{R}$ is not positive definite; since $\mathbf{R}$ is chosen PD, that means $\mathbf{P}$ has gone indefinite and the filter should not apply this update.
:::

::: check
Show that if $\mathbf{S}$ is any square root of $\mathbf{P}$ and $\mathbf{W}$ is orthogonal, then $\mathbf{S}\mathbf{W}$ is also a square root. Why does this matter for a square-root filter?
:::

::: answer
$(\mathbf{S}\mathbf{W})(\mathbf{S}\mathbf{W})^\mathsf{T} = \mathbf{S}\mathbf{W}\mathbf{W}^\mathsf{T}\mathbf{S}^\mathsf{T} = \mathbf{S}\mathbf{I}\mathbf{S}^\mathsf{T} = \mathbf{P}$. It matters because the prediction step produces a wide, non-triangular square root $\mathbf{M} = \begin{pmatrix} \boldsymbol{\Phi}\mathbf{S}_k & \mathbf{G} \end{pmatrix}$, and the filter is free to multiply it by any orthogonal matrix to restore the triangular shape without changing the covariance it represents. QR of $\mathbf{M}^\mathsf{T}$ supplies exactly that orthogonal matrix, giving $\mathbf{S}_{k+1} = \mathbf{R}^\mathsf{T}$.
:::

::: check
Gaussian samples with covariance $\mathbf{P} = \begin{pmatrix} 4 & 1.5 \\ 1.5 & 2 \end{pmatrix}$ are generated as $\mathbf{L}\mathbf{z}$. A colleague instead uses $\mathbf{P}^{1/2}\mathbf{z}$ with the symmetric square root. Whose samples have the right covariance?
:::

::: answer
Both. Any $\mathbf{S}$ with $\mathbf{S}\mathbf{S}^\mathsf{T} = \mathbf{P}$ gives $\operatorname{Cov}(\mathbf{S}\mathbf{z}) = \mathbf{S}\mathbf{I}\mathbf{S}^\mathsf{T} = \mathbf{P}$ by the sandwich rule, and both the Cholesky factor and the symmetric square root satisfy it. The individual samples differ for the same $\mathbf{z}$ — $\mathbf{L}\mathbf{z}$ leaves the first component uncorrelated with $z_2$, the symmetric root mixes both — but the distributions are identical. The Cholesky route is cheaper, at $n^3/3$ flops against a full eigen-decomposition.
:::

## Summary

| Item | Statement |
| --- | --- |
| Cholesky | $\mathbf{A} = \mathbf{L}\mathbf{L}^\mathsf{T}$, $\mathbf{L}$ lower triangular with positive diagonal; exists iff $\mathbf{A}$ is symmetric PD; unique |
| From elimination | $\mathbf{A} = \mathbf{L}\mathbf{D}\mathbf{L}^\mathsf{T}$ with $\mathbf{D}$ the pivots; Cholesky factor is $\mathbf{L}\mathbf{D}^{1/2}$, so $l_{jj}^2 = d_j$ |
| Algorithm | $l_{jj} = \sqrt{a_{jj} - \sum_{k<j}l_{jk}^2}$, $l_{ij} = (a_{ij} - \sum_{k<j}l_{ik}l_{jk})/l_{jj}$; stops at the first non-positive pivot |
| Cost | about $n^3/3$ flops, half of LU; no pivoting; $\lvert l_{jk}\rvert \le \sqrt{a_{jj}}$ |
| Solve | $\mathbf{L}\mathbf{y} = \mathbf{b}$ forward, $\mathbf{L}^\mathsf{T}\mathbf{x} = \mathbf{y}$ back, $n^2$ flops each |
| Determinant | $\det\mathbf{A} = \prod_i l_{ii}^2$, $\ln\det\mathbf{A} = 2\sum_i\ln l_{ii}$ |
| Square root | any $\mathbf{S}$ with $\mathbf{S}\mathbf{S}^\mathsf{T} = \mathbf{P}$; $\mathbf{S}\mathbf{W}$ also works for orthogonal $\mathbf{W}$ |
| Sampling / whitening | $\mathbf{x} = \boldsymbol{\mu} + \mathbf{L}\mathbf{z}$ has covariance $\mathbf{P}$; $\mathbf{L}^{-1}\mathbf{e}$ has covariance $\mathbf{I}$; $\mathbf{e}^\mathsf{T}\mathbf{P}^{-1}\mathbf{e} = \lVert\mathbf{L}^{-1}\mathbf{e}\rVert^2$ |
| Sigma points | $\hat{\mathbf{x}} \pm \sqrt{n + \lambda}\,\mathbf{l}_j$ from the columns of a square root |
| Square-root filter | propagate $\mathbf{S}$, not $\mathbf{P}$; re-triangularise $\begin{pmatrix} \boldsymbol{\Phi}\mathbf{S}_k & \mathbf{G} \end{pmatrix}$ by QR; $\mathbf{S}\mathbf{S}^\mathsf{T}$ PSD by construction |
| Caveats | PSD-but-singular matrices fail by round-off; only one triangle is read |

The next lesson turns to calculus. The normal equations that Cholesky is so often asked to solve come from setting a gradient to zero, and the Jacobians $\mathbf{F}$ and $\mathbf{H}$ that a Kalman filter sandwiches its covariance between are matrices of partial derivatives. Lesson 7 is about computing those objects reliably.
