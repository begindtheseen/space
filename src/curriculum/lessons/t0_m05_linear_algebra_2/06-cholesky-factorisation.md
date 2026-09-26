---
id: l06-cholesky-factorisation
title: The Cholesky factorisation
minutes: 21
covers:
  - Cholesky factorisation
---

You know that $9 = 3 \times 3$: the number $3$ is a square root of $9$. This lesson does the same thing for a matrix. It writes a positive definite matrix as a triangle times its own mirror image, $\mathbf{A} = \mathbf{L}\mathbf{L}^\mathsf{T}$. The triangle $\mathbf{L}$ acts like a square root of $\mathbf{A}$, and it is the most used factorization in all of estimation.

Lesson 5 ended with a test: a symmetric matrix is positive definite exactly when every pivot of Gaussian elimination is positive. Take the square root of each pivot, fold it into the elimination multipliers, and you have $\mathbf{A} = \mathbf{L}\mathbf{L}^\mathsf{T}$, with $\mathbf{L}$ **lower triangular** — every entry above its diagonal is zero. That is the **[[Cholesky factorization|cholesky-history]]**.

Engineers reach for it for three reasons.

- **It is the cheapest way to solve $\mathbf{A}\mathbf{x} = \mathbf{b}$** when $\mathbf{A}$ is symmetric positive definite: half the work of LU, and no row swaps. It also fails cleanly if the matrix turns out not to be positive definite, which makes it the practical PD test.
- **It is a matrix square root.** A covariance $\mathbf{P} = \mathbf{L}\mathbf{L}^\mathsf{T}$ can be sampled, whitened and turned into sigma points using $\mathbf{L}$ alone.
- **It makes a filter safer.** A filter that stores $\mathbf{L}$ instead of $\mathbf{P}$ can never produce a covariance with a negative eigenvalue, because $\mathbf{L}\mathbf{L}^\mathsf{T}$ is positive semi-definite whatever numbers sit in $\mathbf{L}$.

The first half of this lesson derives the factorization, gives the algorithm and its cost, and shows how to solve and test with it. The second half is about the covariance square root: sampling, whitening, sigma points, and the idea behind square-root Kalman filters.

## From elimination to a square root

Start from the **[[LU factorization|lu-recap]]** of Linear Algebra I. Elimination without row swaps writes $\mathbf{A} = \mathbf{L}\mathbf{U}$. Here $\mathbf{L}$ is *unit* lower triangular — ones on the diagonal, the elimination multipliers below. And $\mathbf{U}$ is upper triangular, with the pivots $d_1, \dots, d_n$ on its diagonal.

**Step 1: pull out the pivots.** Divide each row of $\mathbf{U}$ by its pivot. That writes $\mathbf{U} = \mathbf{D}\mathbf{U}'$, where $\mathbf{D}$ is the diagonal matrix of pivots and $\mathbf{U}'$ is unit upper triangular. Now $\mathbf{A} = \mathbf{L}\mathbf{D}\mathbf{U}'$.

**Step 2: use symmetry.** Transpose both sides: $\mathbf{A} = \mathbf{A}^\mathsf{T} = \mathbf{U}'^\mathsf{T}\mathbf{D}\mathbf{L}^\mathsf{T}$. That is another factorization of the same shape — unit lower, times diagonal, times unit upper. The LU factorization without row swaps is unique when it exists, so the two must be the same: $\mathbf{U}' = \mathbf{L}^\mathsf{T}$. Therefore

$$\mathbf{A} = \mathbf{L}\mathbf{D}\mathbf{L}^\mathsf{T}.$$

This is the **LDL$^\mathsf{T}$ factorization** (read "L D L transpose"). It exists for any symmetric matrix whose elimination needs no row swaps.

**Step 3: take square roots.** If $\mathbf{A}$ is positive definite, every pivot $d_i$ is positive. So $\mathbf{D}^{1/2} = \operatorname{diag}(\sqrt{d_i})$ is real. Give one copy of it to each side:

$$\mathbf{A} = (\mathbf{L}\mathbf{D}^{1/2})(\mathbf{L}\mathbf{D}^{1/2})^\mathsf{T} = \mathbf{G}\mathbf{G}^\mathsf{T}.$$

Rename $\mathbf{G}$ as $\mathbf{L}$. From here on, $\mathbf{L}$ means this lower-triangular factor, with the square roots of the pivots on its diagonal. This is the Cholesky factorization.

It also works backwards. If $\mathbf{A} = \mathbf{L}\mathbf{L}^\mathsf{T}$ with $\mathbf{L}$ invertible, then $\mathbf{x}^\mathsf{T}\mathbf{A}\mathbf{x} = (\mathbf{L}^\mathsf{T}\mathbf{x})^\mathsf{T}(\mathbf{L}^\mathsf{T}\mathbf{x}) = \|\mathbf{L}^\mathsf{T}\mathbf{x}\|^2$. That is positive for every $\mathbf{x} \neq \mathbf{0}$, so $\mathbf{A}$ is positive definite. The two statements are equivalent.

::: key The Cholesky factorisation
Every symmetric positive definite matrix has a unique factorisation $\mathbf{A} = \mathbf{L}\mathbf{L}^\mathsf{T}$ with $\mathbf{L}$ lower triangular and positive diagonal, computed in about $n^3/3$ flops — half the cost of LU — with no pivoting. The factorisation exists if and only if $\mathbf{A}$ is positive definite, so a failed Cholesky is the standard PD test. GNC uses $\mathbf{L}$ as the covariance square root: for sigma-point generation in a UKF, and in square-root filters that keep $\mathbf{P} = \mathbf{L}\mathbf{L}^\mathsf{T}$ positive definite by construction.
:::

## The algorithm

You do not need to run elimination first and take square roots after. You can compute $\mathbf{L}$ directly, by matching entries of $\mathbf{A} = \mathbf{L}\mathbf{L}^\mathsf{T}$ one at a time — like solving a puzzle where each clue unlocks the next.

The $(i, j)$ entry of $\mathbf{L}\mathbf{L}^\mathsf{T}$ is row $i$ of $\mathbf{L}$ dotted with row $j$ of $\mathbf{L}$: $\sum_k l_{ik}l_{jk}$. Because $\mathbf{L}$ is [[lower triangular|triangle-shapes]], the rows run out of nonzero entries early, and the sum stops at $k = \min(i, j)$. Work down one column at a time.

**The diagonal entry of column $j$.** Matching $a_{jj}$ gives

$$a_{jj} = \sum_{k=1}^{j}l_{jk}^2 \quad\Longrightarrow\quad l_{jj} = \sqrt{a_{jj} - \sum_{k=1}^{j-1}l_{jk}^2}.$$

**Each entry below it, $i > j$.** Matching $a_{ij}$ gives

$$a_{ij} = \sum_{k=1}^{j}l_{ik}l_{jk} \quad\Longrightarrow\quad l_{ij} = \frac{1}{l_{jj}}\Big(a_{ij} - \sum_{k=1}^{j-1}l_{ik}l_{jk}\Big).$$

Everything on the right-hand side comes from earlier columns, so each step uses only numbers you already have.

The quantity under the square root is exactly the $j$-th pivot of elimination: $d_j = l_{jj}^2$. If it comes out zero or negative, the matrix is not positive definite, and the algorithm stops right there at column $j$ — having done only part of the work. That early exit is what makes Cholesky the cheapest PD test there is.

### What it costs, and why it is safe

**Cost.** Column $j$ needs one short dot product for each of its $n - j$ entries below the diagonal. Adding that up over all columns gives about $n^3/6$ multiplications and as many additions: $n^3/3$ **[[flops|flops]]** in total. LU on a general matrix takes $2n^3/3$. There are only $n$ square roots.

**Safety.** Many algorithms need row swaps to avoid dividing by tiny numbers. Cholesky does not. Look at the diagonal formula again: $\sum_k l_{jk}^2 = a_{jj}$. A sum of squares equal to $a_{jj}$ means no single square can exceed $a_{jj}$. So every entry of $\mathbf{L}$ satisfies $|l_{jk}| \le \sqrt{a_{jj}}$. The factor can never hold a number larger than the square root of the largest diagonal entry of $\mathbf{A}$, and nothing can blow up. Cholesky is **[[backward stable|backward-stable]]** without any row swaps. It can even be computed in place, writing $\mathbf{L}$ over the lower triangle of $\mathbf{A}$ in memory.

::: example Factoring a three-by-three matrix by hand
Take the matrix Lesson 5 tested, $\mathbf{A} = \begin{pmatrix} 4 & 2 & 0 \\ 2 & 5 & 3 \\ 0 & 3 & 6 \end{pmatrix}$, whose pivots were $4, 4, 3.75$.

**Column 1.** $l_{11} = \sqrt{4} = 2$. Below it: $l_{21} = a_{21}/l_{11} = 2/2 = 1$ and $l_{31} = 0/2 = 0$.

**Column 2.** $l_{22} = \sqrt{a_{22} - l_{21}^2} = \sqrt{5 - 1} = 2$. Below it: $l_{32} = (a_{32} - l_{31}l_{21})/l_{22} = (3 - 0)/2 = 1.5$.

**Column 3.** $l_{33} = \sqrt{a_{33} - l_{31}^2 - l_{32}^2} = \sqrt{6 - 0 - 2.25} = \sqrt{3.75} = 1.9365$.

$$\mathbf{L} = \begin{pmatrix} 2 & 0 & 0 \\ 1 & 2 & 0 \\ 0 & 1.5 & 1.9365 \end{pmatrix}.$$

**Check by multiplying back.** Row 2 of $\mathbf{L}$ dotted with row 3: $1\times 0 + 2\times 1.5 + 0\times 1.9365 = 3 = a_{23}$. Row 3 with itself: $0 + 2.25 + 3.75 = 6 = a_{33}$. The squared diagonal entries $4, 4, 3.75$ are the pivots, as promised. And $\det\mathbf{A} = (\det\mathbf{L})^2 = (2\times 2\times 1.9365)^2 = 7.746^2 = 60.0$, matching Lesson 5.

**Now the indefinite version,** with $a_{33} = 2$. Columns 1 and 2 are the same. Column 3 asks for $l_{33} = \sqrt{2 - 0 - 2.25} = \sqrt{-0.25}$, which is not a real number, and the algorithm stops: the matrix is not positive definite. It found that out after computing five entries, without ever forming a determinant or an eigenvalue.
:::

## Solving, determinants and inverses

Solving with $\mathbf{L}$ is like peeling an onion from the outside in. To solve $\mathbf{A}\mathbf{x} = \mathbf{b}$ with $\mathbf{A} = \mathbf{L}\mathbf{L}^\mathsf{T}$, split the problem into two triangular systems:

$$\mathbf{L}\mathbf{y} = \mathbf{b} \ \text{(forward substitution)}, \qquad \mathbf{L}^\mathsf{T}\mathbf{x} = \mathbf{y} \ \text{(back substitution)}.$$

A triangular system is easy. The first equation of $\mathbf{L}\mathbf{y} = \mathbf{b}$ has only one unknown, $y_1$. Once you know it, the second equation has only one new unknown, and so on down. Back substitution does the same from the bottom up.

Each triangular solve costs about $n^2$ flops — tiny next to the $n^3/3$ of the factorization. So once $\mathbf{L}$ is known, you can solve for many right-hand sides cheaply.

This is how a Kalman gain should be computed. Never form $(\mathbf{H}\mathbf{P}\mathbf{H}^\mathsf{T} + \mathbf{R})^{-1}$ explicitly. Instead, factor the innovation covariance — the expected spread of the gap between measurement and prediction — $\mathbf{S} = \mathbf{H}\mathbf{P}\mathbf{H}^\mathsf{T} + \mathbf{R}$ once, and solve $\mathbf{S}\mathbf{K}^\mathsf{T} = \mathbf{H}\mathbf{P}^\mathsf{T}$ column by column. It is cheaper than inverting and more accurate. And if the Cholesky of $\mathbf{S}$ fails, you have learned that $\mathbf{P}$ or $\mathbf{R}$ is corrupt before the bad gain reaches the state.

::: example Two triangular solves
With the $\mathbf{L}$ above, solve $\mathbf{A}\mathbf{x} = (2, 10, 15)^\mathsf{T}$.

**Forward, $\mathbf{L}\mathbf{y} = \mathbf{b}$, top to bottom.**

- Row 1: $2y_1 = 2$, so $y_1 = 1$.
- Row 2: $y_1 + 2y_2 = 10$, so $2y_2 = 9$ and $y_2 = 4.5$.
- Row 3: $1.5y_2 + 1.9365y_3 = 15$, so $y_3 = (15 - 6.75)/1.9365 = 4.2603$.

**Back, $\mathbf{L}^\mathsf{T}\mathbf{x} = \mathbf{y}$, bottom to top.** ($\mathbf{L}^\mathsf{T}$ is upper triangular, so the last row has one unknown.)

- Row 3: $1.9365x_3 = 4.2603$, so $x_3 = 2.2$.
- Row 2: $2x_2 + 1.5x_3 = 4.5$, so $x_2 = (4.5 - 3.3)/2 = 0.6$.
- Row 1: $2x_1 + x_2 = 1$, so $x_1 = (1 - 0.6)/2 = 0.2$.

**Check** by multiplying $\mathbf{A}\mathbf{x}$: row 1 gives $4(0.2) + 2(0.6) = 0.8 + 1.2 = 2$; row 2 gives $0.4 + 3 + 6.6 = 10$; row 3 gives $1.8 + 13.2 = 15$. That is $\mathbf{b}$.
:::

Two by-products come free.

**The determinant.** $\det\mathbf{A} = \prod_i l_{ii}^2$ (the symbol $\prod$ means "multiply them all"). Its logarithm is $\ln\det\mathbf{A} = 2\sum_i\ln l_{ii}$. That is how the **[[log-likelihood|log-det]]** of a Gaussian (bell-curve) distribution is computed without overflow — the $\ln\det\mathbf{S}$ term in every innovation-likelihood test comes from the Cholesky factor of $\mathbf{S}$.

**The inverse, if you really need it.** Solve $\mathbf{A}\mathbf{X} = \mathbf{I}$ one column at a time. For the matrix above that gives

$$\mathbf{A}^{-1} = \begin{pmatrix} 0.35 & -0.2 & 0.1 \\ -0.2 & 0.4 & -0.2 \\ 0.1 & -0.2 & 0.2667 \end{pmatrix}.$$

It is symmetric, as the inverse of a symmetric matrix must be, and positive definite, with eigenvalues $1/\lambda_i$. Whether to form the inverse at all is a separate question, and the answer is usually no. A solve is cheaper, and it loses fewer digits than multiplying by an explicit inverse.

## LDL$^\mathsf{T}$ and the UD filter

The square roots are the only step in Cholesky that is not plain arithmetic ($+$, $-$, $\times$, $\div$). The $\mathbf{L}\mathbf{D}\mathbf{L}^\mathsf{T}$ form avoids them: $\mathbf{L}$ is unit lower triangular, and $\mathbf{D}$ holds the pivots. For the running example, $\mathbf{D} = \operatorname{diag}(4, 4, 3.75)$. The unit factor has $l_{21} = 0.5$ and $l_{32} = 0.75$, obtained by dividing each column of the Cholesky factor by its diagonal entry ($1/2$ and $1.5/2$). The same two triangular solves, with a diagonal scaling in between, solve the system.

Bierman's **[[UD filter|ud-filter]]** stores the covariance as $\mathbf{P} = \mathbf{U}\mathbf{D}\mathbf{U}^\mathsf{T}$, with $\mathbf{U}$ unit *upper* triangular. It updates $\mathbf{U}$ and $\mathbf{D}$ directly, so $\mathbf{P}$ is never formed and can never go indefinite. With symmetric row-and-column swaps, the $\mathbf{L}\mathbf{D}\mathbf{L}^\mathsf{T}$ form also extends to indefinite symmetric matrices, where Cholesky cannot go. `scipy.linalg.ldl` computes it.

## The covariance square root

A **square root** of a covariance $\mathbf{P}$ is any matrix $\mathbf{S}$ with $\mathbf{S}\mathbf{S}^\mathsf{T} = \mathbf{P}$. There are many:

- the Cholesky factor $\mathbf{L}$ is one — the cheap one;
- the symmetric square root $\mathbf{P}^{1/2} = \mathbf{Q}\boldsymbol{\Lambda}^{1/2}\mathbf{Q}^\mathsf{T}$ of Lesson 4 is another — the only one that is itself symmetric and PD;
- and if $\mathbf{S}$ is a square root, so is $\mathbf{S}\mathbf{W}$ for any orthogonal $\mathbf{W}$, because $\mathbf{S}\mathbf{W}\mathbf{W}^\mathsf{T}\mathbf{S}^\mathsf{T} = \mathbf{S}\mathbf{I}\mathbf{S}^\mathsf{T} = \mathbf{S}\mathbf{S}^\mathsf{T}$.

That freedom gets used. The triangular shape of the Cholesky factor is what lets a square-root filter update it with a QR factorization, as you will see below.

Everything a square root does comes from the sandwich rule of Lesson 5.

**Sampling.** Let $\mathbf{z}$ be a vector of $n$ independent standard normal random numbers — each with mean $0$ and variance $1$ — so its covariance is $\mathbf{I}$. Then $\mathbf{x} = \boldsymbol{\mu} + \mathbf{L}\mathbf{z}$ has mean $\boldsymbol{\mu}$ and covariance $\mathbf{L}\mathbf{I}\mathbf{L}^\mathsf{T} = \mathbf{P}$. That is how correlated random samples are generated for a **[[Monte Carlo|monte-carlo]]** run.

**Whitening.** Go the other way. If $\mathbf{e}$ has covariance $\mathbf{P}$, then $\mathbf{L}^{-1}\mathbf{e}$ has covariance

$$\mathbf{L}^{-1}\mathbf{P}\mathbf{L}^{-\mathsf{T}} = \mathbf{L}^{-1}\mathbf{L}\mathbf{L}^\mathsf{T}\mathbf{L}^{-\mathsf{T}} = \mathbf{I}.$$

($\mathbf{L}^{-\mathsf{T}}$ is short for the inverse of $\mathbf{L}^\mathsf{T}$.) The correlated error has become one with independent, equal-sized components. This is **whitening**, and it costs one forward substitution.

**Mahalanobis distance.** The distance of Lesson 5 is the length of the [[whitened vector|whitening-picture]]:

$$\mathbf{e}^\mathsf{T}\mathbf{P}^{-1}\mathbf{e} = \mathbf{e}^\mathsf{T}\mathbf{L}^{-\mathsf{T}}\mathbf{L}^{-1}\mathbf{e} = \|\mathbf{L}^{-1}\mathbf{e}\|^2.$$

So an outlier test needs one triangular solve, and never $\mathbf{P}^{-1}$.

### Sigma points

Suppose you want to know how an uncertain position looks after a nonlinear step, like converting it to a range and an angle. One way is to push thousands of random samples through. The **[[unscented Kalman filter|ukf-name]]** does it with a handful of carefully chosen points instead.

It represents a Gaussian (bell-curve) distribution with mean $\hat{\mathbf{x}}$ and covariance $\mathbf{P}$ by $2n + 1$ fixed **sigma points**: the mean itself, and

$$\boldsymbol{\chi}_{\pm j} = \hat{\mathbf{x}} \pm \sqrt{n + \lambda}\ \mathbf{l}_j, \qquad j = 1, \dots, n.$$

Here $\boldsymbol{\chi}$ is the Greek letter "chi", $\mathbf{l}_j$ is the $j$-th column of a square root of $\mathbf{P}$, and $\lambda$ is a tuning number that sets the spread. Columns are used because they add back to the covariance: $\sum_j\mathbf{l}_j\mathbf{l}_j^\mathsf{T} = \mathbf{L}\mathbf{L}^\mathsf{T} = \mathbf{P}$. So the weighted spread of the points reproduces $\mathbf{P}$ exactly.

Each point is pushed through the nonlinear dynamics or measurement function by itself. Their spread afterwards *is* the propagated covariance — no Jacobian needed. Cholesky is the square root of choice, because it is the cheapest, and because a failed factorization catches a bad $\mathbf{P}$ before any point is generated.

::: example Sigma points from a two-by-two covariance
Take the position covariance of Lesson 4, $\mathbf{P} = \begin{pmatrix} 4 & 1.5 \\ 1.5 & 2 \end{pmatrix}\,\mathrm{m^2}$, about a mean $\hat{\mathbf{x}} = (100, 50)^\mathsf{T}\,\mathrm{m}$.

**Cholesky.** $l_{11} = \sqrt{4} = 2$. $l_{21} = 1.5/2 = 0.75$. $l_{22} = \sqrt{2 - 0.75^2} = \sqrt{2 - 0.5625} = \sqrt{1.4375} = 1.1990$. So

$$\mathbf{L} = \begin{pmatrix} 2 & 0 \\ 0.75 & 1.1990 \end{pmatrix}, \qquad \mathbf{L}\mathbf{L}^\mathsf{T} = \begin{pmatrix} 4 & 1.5 \\ 1.5 & 0.5625 + 1.4375 \end{pmatrix} = \mathbf{P}.$$

**The scale.** With $n = 2$ and $\lambda = 1$, it is $\sqrt{n + \lambda} = \sqrt{3} = 1.732$.

**The points.** From the first column, $1.732\times(2, 0.75) = (3.464, 1.299)$, so the pair is $(103.46, 51.30)$ and $(96.54, 48.70)$. From the second column, $1.732\times(0, 1.1990) = (0, 2.077)$, so the pair is $(100, 52.08)$ and $(100, 47.92)$. All in meters, plus the mean $(100, 50)$ itself.

**What to notice.** The first pair is tilted — it carries the correlation. The second pair is purely north–south. Neither pair lies along the [[ellipse's principal axes|sigma-picture]], and neither needs to: what matters is that the spread of the whole set reproduces $\mathbf{P}$.

**A different root.** With the symmetric square root, $\mathbf{P}^{1/2} = \begin{pmatrix} 1.9472 & 0.4565 \\ 0.4565 & 1.3385 \end{pmatrix}$, the points would be different, but their spread would be identical.
:::

### Square-root filters

Lesson 5 showed why round-off in $\mathbf{P} \leftarrow (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}$ can push an eigenvalue negative. A **square-root filter** removes the possibility by never storing $\mathbf{P}$ at all. It stores a factor $\mathbf{S}$, and it works out how each filter step acts on $\mathbf{S}$, so that $\mathbf{S}\mathbf{S}^\mathsf{T}$ is the covariance the textbook would have computed.

Whatever round-off does to the entries of $\mathbf{S}$, the covariance it stands for, $\mathbf{S}\mathbf{S}^\mathsf{T}$, is a Gram matrix — so it is PSD. It is exactly symmetric, because it is never formed.

Here is how the prediction step goes. Write $\mathbf{P}_k = \mathbf{S}_k\mathbf{S}_k^\mathsf{T}$ and $\mathbf{Q} = \mathbf{G}\mathbf{G}^\mathsf{T}$. Then

$$\mathbf{P}_{k+1} = \boldsymbol{\Phi}\mathbf{S}_k\mathbf{S}_k^\mathsf{T}\boldsymbol{\Phi}^\mathsf{T} + \mathbf{G}\mathbf{G}^\mathsf{T} = \begin{pmatrix} \boldsymbol{\Phi}\mathbf{S}_k & \mathbf{G} \end{pmatrix}\begin{pmatrix} \boldsymbol{\Phi}\mathbf{S}_k & \mathbf{G} \end{pmatrix}^\mathsf{T}.$$

The second step is block multiplication: a wide matrix made of two blocks, times its transpose, gives the sum of each block times its own transpose.

So the wide matrix $\mathbf{M} = \begin{pmatrix} \boldsymbol{\Phi}\mathbf{S}_k & \mathbf{G} \end{pmatrix}$ is a square root of $\mathbf{P}_{k+1}$, but not a triangular one. To make it triangular, factor its transpose with the QR factorization of Linear Algebra I: $\mathbf{M}^\mathsf{T} = \mathbf{Q}_{\mathrm{orth}}\mathbf{R}$. Then

$$\mathbf{M}\mathbf{M}^\mathsf{T} = \mathbf{R}^\mathsf{T}\mathbf{Q}_{\mathrm{orth}}^\mathsf{T}\mathbf{Q}_{\mathrm{orth}}\mathbf{R} = \mathbf{R}^\mathsf{T}\mathbf{R},$$

so $\mathbf{S}_{k+1} = \mathbf{R}^\mathsf{T}$ is the new lower-triangular factor. The orthogonal matrix is never applied to anything. The QR step only restores the triangle. The measurement update has a similar form.

The bonus is numerical. Lesson 10 will show that the condition number of $\mathbf{S}$ is the square root of that of $\mathbf{P}$. So a square-root filter has only half as many digits at risk.

::: warning A positive semi-definite matrix can fail Cholesky
Cholesky needs positive *definite*. The rank-one process noise $\mathbf{Q} = \mathbf{G}\sigma_a^2\mathbf{G}^\mathsf{T}$ of Lesson 5, $\begin{pmatrix} 6.25\times 10^{-6} & 1.25\times 10^{-4} \\ 1.25\times 10^{-4} & 2.5\times 10^{-3} \end{pmatrix}$, is PSD with an eigenvalue of exactly zero. Its second pivot is $2.5\times 10^{-3} - (1.25\times 10^{-4})^2/(6.25\times 10^{-6}) = 0$ in exact arithmetic. Computed the way Cholesky computes it, $a_{22} - l_{21}^2$, it comes out $-4.3\times 10^{-19}$ in float64, and `np.linalg.cholesky` raises an error.

Nothing is wrong with $\mathbf{Q}$. The tool is the wrong one. Use the factor you already have ($\mathbf{G}\sigma_a$ is a perfectly good square root), or an eigen-decomposition, or $\mathbf{L}\mathbf{D}\mathbf{L}^\mathsf{T}$ with pivoting. Adding a tiny multiple of $\mathbf{I}$ — "jitter" — also works, but it changes the matrix, and you should know by how much.
:::

::: warning Cholesky reads one triangle
Like `eigh`, `np.linalg.cholesky` and the LAPACK routine under it look only at the lower (or upper) triangle and assume the other matches. A covariance that has drifted off symmetric will factor happily, and $\mathbf{L}\mathbf{L}^\mathsf{T}$ will equal the symmetric matrix built from that one triangle — not the matrix you had. Symmetrize first, so the check is honest.
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
print(2 * np.sum(np.log(np.diag(L))))        # 4.0943... = ln 60 = ln det A
rng = np.random.default_rng(0)
z = rng.standard_normal((3, 100000))
samples = L @ z                              # covariance ≈ A
print(np.round(np.cov(samples), 2))          # close to A, e.g. 2.01 for 2
```

`scipy.linalg.cho_factor` and `cho_solve` bundle the factorization and the two triangular solves. Reach for them when the same PD matrix must be solved against many right-hand sides.

## Check yourself

::: check
Compute the Cholesky factor of $\mathbf{A} = \begin{pmatrix} 9 & 3 \\ 3 & 5 \end{pmatrix}$, and use it to find $\det\mathbf{A}$ and to decide whether $\mathbf{A}$ is positive definite.
:::

::: answer
$l_{11} = \sqrt{9} = 3$. $l_{21} = 3/3 = 1$. $l_{22} = \sqrt{5 - 1^2} = \sqrt{4} = 2$. So $\mathbf{L} = \begin{pmatrix} 3 & 0 \\ 1 & 2 \end{pmatrix}$.

Check: $\mathbf{L}\mathbf{L}^\mathsf{T} = \begin{pmatrix} 9 & 3 \\ 3 & 1 + 4 \end{pmatrix} = \mathbf{A}$.

Both diagonal entries came out real and positive, so the factorization exists and $\mathbf{A}$ is positive definite. $\det\mathbf{A} = (3\times 2)^2 = 36$, which agrees with $9\times 5 - 3\times 3 = 45 - 9 = 36$.
:::

::: check
Try the Cholesky factorization of $\mathbf{B} = \begin{pmatrix} 1 & 3 \\ 3 & 5 \end{pmatrix}$. What happens, and what does it tell you?
:::

::: answer
$l_{11} = 1$ and $l_{21} = 3$. Then $l_{22} = \sqrt{5 - 9} = \sqrt{-4}$, which is not real. The second pivot is $-4$, so $\mathbf{B}$ is not positive definite.

The eigenvalues agree: trace $6$, determinant $5 - 9 = -4$, so $\lambda = 3 \pm\sqrt{9 + 4} = 3 \pm\sqrt{13}$, which is $6.61$ and $-0.606$. Indefinite. The factorization failed at the first place it could — after one square root and one division.
:::

::: check
A filter needs $\mathbf{K} = \mathbf{P}\mathbf{H}^\mathsf{T}\mathbf{S}^{-1}$, with $\mathbf{S}$ a $3\times 3$ innovation covariance. Describe how to get it with Cholesky and without forming $\mathbf{S}^{-1}$, and say what a failed factorization would mean.
:::

::: answer
Transpose the equation. Since $\mathbf{S}^\mathsf{T} = \mathbf{S}$ and $\mathbf{P}^\mathsf{T} = \mathbf{P}$, it becomes $\mathbf{S}\mathbf{K}^\mathsf{T} = \mathbf{H}\mathbf{P}$.

Factor $\mathbf{S} = \mathbf{L}\mathbf{L}^\mathsf{T}$ once, at about $3^3/3 = 9$ flops. Then, for each of the $n$ columns of $\mathbf{H}\mathbf{P}$, do one forward and one back substitution to get the matching column of $\mathbf{K}^\mathsf{T}$. That costs about the same as multiplying by $\mathbf{S}^{-1}$ would, but it never computes or stores an inverse, and it is more accurate.

If the factorization fails, $\mathbf{S} = \mathbf{H}\mathbf{P}\mathbf{H}^\mathsf{T} + \mathbf{R}$ is not positive definite. Since $\mathbf{R}$ is chosen PD, that means $\mathbf{P}$ has gone indefinite, and the filter should not apply this update.
:::

::: check
Show that if $\mathbf{S}$ is any square root of $\mathbf{P}$ and $\mathbf{W}$ is orthogonal, then $\mathbf{S}\mathbf{W}$ is also a square root. Why does this matter for a square-root filter?
:::

::: answer
$(\mathbf{S}\mathbf{W})(\mathbf{S}\mathbf{W})^\mathsf{T} = \mathbf{S}\mathbf{W}\mathbf{W}^\mathsf{T}\mathbf{S}^\mathsf{T} = \mathbf{S}\mathbf{I}\mathbf{S}^\mathsf{T} = \mathbf{P}$, using $\mathbf{W}\mathbf{W}^\mathsf{T} = \mathbf{I}$ for an orthogonal matrix.

It matters because the prediction step produces a wide, non-triangular square root, $\mathbf{M} = \begin{pmatrix} \boldsymbol{\Phi}\mathbf{S}_k & \mathbf{G} \end{pmatrix}$. The filter is free to multiply it by any orthogonal matrix to restore the triangular shape, without changing the covariance it stands for. The QR factorization of $\mathbf{M}^\mathsf{T}$ supplies exactly that orthogonal matrix, giving $\mathbf{S}_{k+1} = \mathbf{R}^\mathsf{T}$.
:::

::: check
Random samples with covariance $\mathbf{P} = \begin{pmatrix} 4 & 1.5 \\ 1.5 & 2 \end{pmatrix}$ are generated as $\mathbf{L}\mathbf{z}$. A colleague uses $\mathbf{P}^{1/2}\mathbf{z}$ with the symmetric square root instead. Whose samples have the right covariance?
:::

::: answer
Both. Any $\mathbf{S}$ with $\mathbf{S}\mathbf{S}^\mathsf{T} = \mathbf{P}$ gives $\operatorname{Cov}(\mathbf{S}\mathbf{z}) = \mathbf{S}\mathbf{I}\mathbf{S}^\mathsf{T} = \mathbf{P}$ by the sandwich rule, and both the Cholesky factor and the symmetric square root pass that test.

The individual samples differ for the same $\mathbf{z}$. With $\mathbf{L}\mathbf{z}$, the first component is $2z_1$ and ignores $z_2$ entirely; the symmetric root mixes both into each component. But the two sets of samples have exactly the same statistics. The Cholesky route is cheaper: $n^3/3$ flops against a full eigen-decomposition.
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
| Square-root filter | propagate $\mathbf{S}$, not $\mathbf{P}$; re-triangularize $\begin{pmatrix} \boldsymbol{\Phi}\mathbf{S}_k & \mathbf{G} \end{pmatrix}$ by QR; $\mathbf{S}\mathbf{S}^\mathsf{T}$ PSD by construction |
| Caveats | PSD-but-singular matrices fail by round-off; only one triangle is read |

The next lesson turns to calculus. The normal equations that Cholesky is so often asked to solve come from setting a gradient to zero. And the Jacobians $\mathbf{F}$ and $\mathbf{H}$ that a Kalman filter sandwiches its covariance between are matrices of partial derivatives. Lesson 7 is about computing those reliably.

::: context cholesky-history A surveyor's shortcut
André-Louis Cholesky was a French army officer and surveyor. Mapping land means fitting many measured angles and distances at once — a least-squares problem — and in the early 1900s every step was done by hand. He found this factorization as a faster way to solve the equations that came out. He was killed in the First World War in 1918, before publishing it. A fellow officer, Commandant Benoît, published the method in 1924. "Factorisation" with an s is the British spelling; both appear in the literature.
:::

::: context lu-recap LU in one paragraph
Gaussian elimination clears the entries below each pivot by subtracting multiples of the pivot row. Record each multiple you used in a lower-triangular matrix $\mathbf{L}$ (with ones on its diagonal), and keep what is left — an upper-triangular matrix $\mathbf{U}$. Then $\mathbf{A} = \mathbf{L}\mathbf{U}$. For example, $\begin{pmatrix} 4 & 2 \\ 2 & 5 \end{pmatrix}$ uses multiplier $0.5$ and leaves pivots $4$ and $4$: $\mathbf{L} = \begin{pmatrix} 1 & 0 \\ 0.5 & 1 \end{pmatrix}$ and $\mathbf{U} = \begin{pmatrix} 4 & 2 \\ 0 & 4 \end{pmatrix}$.
:::

::: context triangle-shapes The shapes that multiply
A lower-triangular matrix times its own transpose (an upper triangle) fills in a whole symmetric matrix. Each entry of $\mathbf{A}$ is a row of $\mathbf{L}$ dotted with another row of $\mathbf{L}$. Row $1$ has one nonzero entry, row $2$ has two, row $3$ has three — which is why each formula in the algorithm stops early.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="15" width="22" height="22" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.2"/>
  <rect x="42" y="15" width="22" height="22" fill="#ffffff" stroke="#1f2a44" stroke-width="1.2"/>
  <rect x="64" y="15" width="22" height="22" fill="#ffffff" stroke="#1f2a44" stroke-width="1.2"/>
  <rect x="20" y="37" width="22" height="22" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.2"/>
  <rect x="42" y="37" width="22" height="22" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.2"/>
  <rect x="64" y="37" width="22" height="22" fill="#ffffff" stroke="#1f2a44" stroke-width="1.2"/>
  <rect x="20" y="59" width="22" height="22" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.2"/>
  <rect x="42" y="59" width="22" height="22" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.2"/>
  <rect x="64" y="59" width="22" height="22" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="53" y="101" font-size="12" text-anchor="middle" fill="#1f2a44">L (lower)</text>
  <text x="104" y="54" font-size="18" text-anchor="middle" fill="#1f2a44">×</text>
  <rect x="122" y="15" width="22" height="22" fill="#f2b880" stroke="#1f2a44" stroke-width="1.2"/>
  <rect x="144" y="15" width="22" height="22" fill="#f2b880" stroke="#1f2a44" stroke-width="1.2"/>
  <rect x="166" y="15" width="22" height="22" fill="#f2b880" stroke="#1f2a44" stroke-width="1.2"/>
  <rect x="122" y="37" width="22" height="22" fill="#ffffff" stroke="#1f2a44" stroke-width="1.2"/>
  <rect x="144" y="37" width="22" height="22" fill="#f2b880" stroke="#1f2a44" stroke-width="1.2"/>
  <rect x="166" y="37" width="22" height="22" fill="#f2b880" stroke="#1f2a44" stroke-width="1.2"/>
  <rect x="122" y="59" width="22" height="22" fill="#ffffff" stroke="#1f2a44" stroke-width="1.2"/>
  <rect x="144" y="59" width="22" height="22" fill="#ffffff" stroke="#1f2a44" stroke-width="1.2"/>
  <rect x="166" y="59" width="22" height="22" fill="#f2b880" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="155" y="101" font-size="12" text-anchor="middle" fill="#1f2a44">Lᵀ (upper)</text>
  <text x="206" y="54" font-size="18" text-anchor="middle" fill="#1f2a44">=</text>
  <rect x="224" y="15" width="22" height="22" fill="#6c7a93" stroke="#1f2a44" stroke-width="1.2"/>
  <rect x="246" y="15" width="22" height="22" fill="#6c7a93" stroke="#1f2a44" stroke-width="1.2"/>
  <rect x="268" y="15" width="22" height="22" fill="#6c7a93" stroke="#1f2a44" stroke-width="1.2"/>
  <rect x="224" y="37" width="22" height="22" fill="#6c7a93" stroke="#1f2a44" stroke-width="1.2"/>
  <rect x="246" y="37" width="22" height="22" fill="#6c7a93" stroke="#1f2a44" stroke-width="1.2"/>
  <rect x="268" y="37" width="22" height="22" fill="#6c7a93" stroke="#1f2a44" stroke-width="1.2"/>
  <rect x="224" y="59" width="22" height="22" fill="#6c7a93" stroke="#1f2a44" stroke-width="1.2"/>
  <rect x="246" y="59" width="22" height="22" fill="#6c7a93" stroke="#1f2a44" stroke-width="1.2"/>
  <rect x="268" y="59" width="22" height="22" fill="#6c7a93" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="257" y="101" font-size="12" text-anchor="middle" fill="#1f2a44">A (full, symmetric)</text>
</svg>
```

Because $\mathbf{A}$ is symmetric, you only ever need its lower triangle — six numbers here, not nine.
:::

::: context flops Counting flops
A **flop** is one floating-point operation: one addition, subtraction, multiplication or division of two decimal numbers. Counting them is how numerical analysts compare algorithms without a stopwatch. The count that matters is the leading term. For a $15\times 15$ covariance, $n^3/3$ is $1125$ flops for Cholesky against $2250$ for LU. For a $1000\times 1000$ matrix the gap is hundreds of millions of operations.
:::

::: context backward-stable What "backward stable" promises
Round-off means no computer gets the exact factor of $\mathbf{A}$. A **backward stable** method promises the next best thing: the factor it returns is the *exact* factor of a matrix extremely close to $\mathbf{A}$ — off by a few units in the last place. In other words, the algorithm's error is no bigger than the error you already made by storing $\mathbf{A}$ in a computer at all. For Cholesky this holds with no row swaps, thanks to the bound $|l_{jk}| \le \sqrt{a_{jj}}$.
:::

::: context log-det Why take logarithms
A determinant is a product, and products of many numbers explode or vanish. A $100$-state covariance whose eigenvalues are all around $10^5$ has a determinant around $10^{500}$ — far past the largest float64, about $1.8\times 10^{308}$. The logarithm turns the product into a sum, $2\sum_i\ln l_{ii}$, which stays a modest number (here about $1151$). Likelihood tests only ever need the log, so they never form the determinant.
:::

::: context ud-filter Bierman and the UD filter
Gerald Bierman, working at NASA's Jet Propulsion Laboratory, set out factored filters in his 1977 book *Factorization Methods for Discrete Sequential Estimation*. The UD form — developed with Catherine Thornton — keeps the covariance as a unit triangle and a diagonal, with no square roots, which suited the slow flight computers of the time. Variants have flown in navigation software on many spacecraft since.
:::

::: context monte-carlo Monte Carlo runs
A **Monte Carlo** analysis answers "what might happen?" by simulating a mission thousands of times, each with slightly different random errors — engine thrust, wind, sensor noise — drawn from their covariances. Launch teams use such runs to check that almost every simulated flight lands in its target orbit. The name, after the casino in Monaco, was coined by scientists at Los Alamos in the 1940s.
:::

::: context whitening-picture Whitening, drawn
The left panel shows the one-sigma ellipse of $\mathbf{P}$ with the two errors from Lesson 5, $(2, 1)$ and $(2, -1)$. Multiply everything by $\mathbf{L}^{-1}$ and the ellipse becomes the unit circle on the right. The errors land at distances $1.02$ and $1.77$ from the center — their Mahalanobis distances, now ordinary lengths.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="95" x2="160" y2="95" stroke="#6c7a93"/><line x1="90" y1="25" x2="90" y2="165" stroke="#6c7a93"/>
  <line x1="200" y1="95" x2="310" y2="95" stroke="#6c7a93"/><line x1="250" y1="25" x2="250" y2="165" stroke="#6c7a93"/>
  <ellipse cx="90" cy="95" rx="57.0" ry="28.4" transform="rotate(-28.15 90 95)" fill="#8fb8f0" fill-opacity="0.5" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="250" cy="95" r="26" fill="#8fb8f0" fill-opacity="0.5" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="142.0" cy="69.0" r="4" fill="#1f2a44"/>
  <circle cx="142.0" cy="121.0" r="4" fill="#b4232c"/>
  <circle cx="276.0" cy="89.6" r="4" fill="#1f2a44"/>
  <circle cx="276.0" cy="132.9" r="4" fill="#b4232c"/>
  <line x1="165" y1="95" x2="191" y2="95" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="199,95 189,90 189,100" fill="#1f2a44"/>
  <text x="180" y="85" font-size="12" text-anchor="middle" fill="#1f2a44">L⁻¹</text>
  <text x="90" y="182" font-size="12" text-anchor="middle" fill="#1f2a44">error e, covariance P</text>
  <text x="250" y="182" font-size="12" text-anchor="middle" fill="#1f2a44">L⁻¹e, covariance I</text>
  <text x="283.0" y="84.6" font-size="11" fill="#1f2a44">d = 1.02</text>
  <text x="283.0" y="136.9" font-size="11" fill="#b4232c">d = 1.77</text>
</svg>
```

"White" comes from white light and white noise: every direction equally strong, none favored.
:::

::: context ukf-name Where "unscented" comes from
Simon Julier and Jeffrey Uhlmann introduced the unscented transform and filter in the mid-1990s. Uhlmann has said he named it after a brand of deodorant on a colleague's desk, partly so it would not be called "the Uhlmann filter". The idea behind it is serious: it is easier to approximate a probability distribution with a few well-placed points than to approximate a nonlinear function with its Jacobian.
:::

::: context sigma-picture The five sigma points
The shaded ellipse is the one-sigma ellipse of $\mathbf{P}$ around the mean (black dot). The red pair comes from the first column of $\mathbf{L}$, the blue pair from the second. All four lie on the dashed $\sqrt{3}$-sigma ellipse, because each is $\sqrt{n + \lambda} = \sqrt{3}$ sigmas from the mean — but they are not on its axes.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="100" x2="280" y2="100" stroke="#6c7a93"/><line x1="170" y1="20" x2="170" y2="180" stroke="#6c7a93"/>
  <ellipse cx="170" cy="100" rx="48.2" ry="24.1" transform="rotate(-28.15 170 100)" fill="#8fb8f0" fill-opacity="0.45" stroke="#1d6fd1" stroke-width="2"/>
  <ellipse cx="170" cy="100" rx="83.5" ry="41.7" transform="rotate(-28.15 170 100)" fill="none" stroke="#1f2a44" stroke-width="1.2" stroke-dasharray="5 3"/>
  <line x1="93.8" y1="128.6" x2="246.2" y2="71.4" stroke="#b4232c" stroke-width="1.5"/>
  <line x1="170.0" y1="145.7" x2="170.0" y2="54.3" stroke="#1d6fd1" stroke-width="1.5"/>
  <circle cx="170.0" cy="100.0" r="4.5" fill="#1f2a44"/>
  <circle cx="246.2" cy="71.4" r="4.5" fill="#b4232c"/>
  <circle cx="93.8" cy="128.6" r="4.5" fill="#b4232c"/>
  <circle cx="170.0" cy="54.3" r="4.5" fill="#1d6fd1"/>
  <circle cx="170.0" cy="145.7" r="4.5" fill="#1d6fd1"/>
  <text x="254.2" y="69.4" font-size="11" fill="#b4232c">(103.46, 51.30)</text>
  <text x="162.0" y="50.3" font-size="11" text-anchor="end" fill="#1d6fd1">(100, 52.08)</text>
  <text x="20" y="190" font-size="11" fill="#1f2a44">shaded: 1-sigma ellipse · dashed: √3-sigma ellipse</text>
</svg>
```
:::
