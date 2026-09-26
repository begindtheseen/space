---
id: l05-positive-definiteness-quadratic-forms
title: Positive definiteness and quadratic forms
minutes: 24
covers:
  - positive definiteness and quadratic forms
---

A covariance matrix makes a promise. Pick any direction, and it tells you the **[[variance|variance-word]]** of the error along that direction — how spread out the error is that way. A variance is an average of squares, and a square is never negative. So a covariance matrix must hand back a number that is zero or more, for every direction you could ask about.

That one requirement has a name: **positive semi-definiteness**. Every covariance must have it. So must every information matrix, every cost-function Hessian at a minimum, and every weighting matrix in a quadratic cost. It is also the property a Kalman filter loses first when its arithmetic goes wrong — and when it goes, the filter's answers go with it.

The number in question is the quadratic form $\mathbf{x}^\mathsf{T}\mathbf{A}\mathbf{x}$. Lesson 4 showed that its sign is set by the signs of the eigenvalues. This lesson turns that into definitions and tests, derives the two formulas a filter uses to move a covariance around, $\mathbf{P}_y = \mathbf{A}\mathbf{P}_x\mathbf{A}^\mathsf{T}$ and $\mathbf{P}_{k+1} = \boldsymbol{\Phi}\mathbf{P}_k\boldsymbol{\Phi}^\mathsf{T} + \mathbf{Q}$, and shows how a filter loses the property.

## Quadratic forms

You have met quadratic forms in physics. A stretched spring stores energy $\tfrac{1}{2}kx^2$. A spinning spacecraft stores energy $\tfrac{1}{2}\boldsymbol{\omega}^\mathsf{T}\mathbf{I}\boldsymbol{\omega}$, with $\mathbf{I}$ its inertia tensor — every term a product of two components of $\boldsymbol{\omega}$.

A **quadratic form** in $n$ variables is a **[[homogeneous|homogeneous]]** polynomial of degree two — every term is some number times two of the variables. Every such polynomial can be written as

$$q(\mathbf{x}) = \mathbf{x}^\mathsf{T}\mathbf{A}\mathbf{x} = \sum_{i=1}^n\sum_{j=1}^n a_{ij}x_ix_j$$

for a square matrix $\mathbf{A}$. For $n = 2$ it reads $q = a_{11}x_1^2 + (a_{12} + a_{21})x_1x_2 + a_{22}x_2^2$.

Notice that only the sum $a_{12} + a_{21}$ shows up. So you can always move numbers between the two off-diagonal slots without changing $q$. Share the cross-term coefficient equally and the matrix becomes symmetric. The polynomial $2x_1^2 + 2x_1x_2 + 3x_2^2$, for example, has the symmetric matrix $\begin{pmatrix} 2 & 1 \\ 1 & 3 \end{pmatrix}$: the cross-term $2$ is split as $1$ and $1$.

::: note Why the unsymmetric part never counts
Split any square matrix into a symmetric part and an antisymmetric part: $\mathbf{A} = \tfrac{1}{2}(\mathbf{A} + \mathbf{A}^\mathsf{T}) + \tfrac{1}{2}(\mathbf{A} - \mathbf{A}^\mathsf{T})$. Call the second part $\mathbf{S}$; it satisfies $\mathbf{S}^\mathsf{T} = -\mathbf{S}$. The form $\mathbf{x}^\mathsf{T}\mathbf{S}\mathbf{x}$ is a single number, so it equals its own transpose:

$$\mathbf{x}^\mathsf{T}\mathbf{S}\mathbf{x} = (\mathbf{x}^\mathsf{T}\mathbf{S}\mathbf{x})^\mathsf{T} = \mathbf{x}^\mathsf{T}\mathbf{S}^\mathsf{T}\mathbf{x} = -\mathbf{x}^\mathsf{T}\mathbf{S}\mathbf{x}.$$

A number equal to its own negative is zero. So only the symmetric part contributes, and every quadratic form has exactly one symmetric matrix. From here on, $\mathbf{A}$ in $\mathbf{x}^\mathsf{T}\mathbf{A}\mathbf{x}$ is symmetric unless said otherwise.
:::

With $\mathbf{A} = \mathbf{Q}\boldsymbol{\Lambda}\mathbf{Q}^\mathsf{T}$ and $\mathbf{y} = \mathbf{Q}^\mathsf{T}\mathbf{x}$, the form becomes $\sum_i\lambda_iy_i^2$, with no cross terms. So its **[[level sets|level-sets]]** $q(\mathbf{x}) = c$ — the curves where it takes one fixed value, like contour lines on a map — line up with the eigenvectors. If every $\lambda_i > 0$, the set $q = 1$ is an ellipsoid with semi-axes $1/\sqrt{\lambda_i}$ along $\mathbf{q}_i$. If the eigenvalues have mixed signs, it is a hyperboloid, and the form takes both signs.

::: example Reading a two-variable quadratic form
Take $q(\mathbf{x}) = 2x_1^2 + 2x_1x_2 + 3x_2^2$, so $\mathbf{A} = \begin{pmatrix} 2 & 1 \\ 1 & 3 \end{pmatrix}$.

**Eigenvalues.** Trace $5$, determinant $2\times 3 - 1 = 5$. The equation $\lambda^2 - 5\lambda + 5 = 0$ gives $\lambda = (5 \pm\sqrt{5})/2$, that is $3.618$ and $1.382$. Both positive, so $q > 0$ for every $\mathbf{x} \neq \mathbf{0}$.

**Second opinion.** Completing the square shows the same thing: $q = 2(x_1 + \tfrac{1}{2}x_2)^2 + \tfrac{5}{2}x_2^2$. Multiply it out to check: $2x_1^2 + 2x_1x_2 + \tfrac{1}{2}x_2^2 + \tfrac{5}{2}x_2^2$. It is a sum of two squares with positive coefficients, so it can never go negative, and it is zero only when both squares are.

**The level curve.** $q = 1$ is an ellipse with semi-axes $1/\sqrt{1.382} = 0.851$ and $1/\sqrt{3.618} = 0.526$. The long axis belongs to the *smaller* eigenvalue, $1.382$. From $(2 - 1.382)v_1 + v_2 = 0$, it points along $(1, -0.618)$, which is $31.7^\circ$ below the $x_1$-axis. That makes sense: the form grows slowest in that direction, so you must go furthest to reach $q = 1$.

**Now change one number.** $q'(\mathbf{x}) = x_1^2 + 4x_1x_2 + x_2^2$ has matrix $\begin{pmatrix} 1 & 2 \\ 2 & 1 \end{pmatrix}$ with eigenvalues $3$ and $-1$. Along $(1, 1)$ the form is $1 + 4 + 1 = 6$. Along $(1, -1)$ it is $1 - 4 + 1 = -2$. The level set $q' = 1$ is a hyperbola, not an ellipse. Yet both diagonal entries are positive: the diagonal alone tells you nothing about the sign of the form.
:::

## Definiteness

Picture the graph of $q$ over the $(x_1, x_2)$ plane. If $q$ is positive in every direction, the graph is a **[[bowl|bowl-saddle]]** with its bottom at the origin. If it can be zero along some line but never negative, it is a trough. If it goes up some ways and down others, it is a saddle.

::: key Positive definite and positive semi-definite
A symmetric matrix $\mathbf{A}$ is **positive semi-definite** (PSD, written $\mathbf{A} \succeq 0$) if and only if $\mathbf{x}^\mathsf{T}\mathbf{A}\mathbf{x} \ge 0$ for all $\mathbf{x}$, equivalently all its eigenvalues are $\ge 0$. It is **positive definite** (PD, $\mathbf{A} \succ 0$) if $\mathbf{x}^\mathsf{T}\mathbf{A}\mathbf{x} > 0$ for all $\mathbf{x} \neq \mathbf{0}$, equivalently all eigenvalues are $> 0$.
:::

Read $\mathbf{A} \succ 0$ as "A is positive definite". The curly sign says this is about the whole matrix, not its entries.

::: note Why the form's sign and the eigenvalues' signs agree
This is the Rayleigh fence of Lesson 4, used in both directions. If every $\lambda_i > 0$, then $\mathbf{x}^\mathsf{T}\mathbf{A}\mathbf{x} \ge \lambda_{\min}\|\mathbf{x}\|^2 > 0$ for $\mathbf{x} \neq \mathbf{0}$. The other way: if the form is positive for every nonzero $\mathbf{x}$, try it on a unit eigenvector. $\mathbf{q}_i^\mathsf{T}\mathbf{A}\mathbf{q}_i = \lambda_i\|\mathbf{q}_i\|^2 = \lambda_i$, so every eigenvalue is positive. The same argument with $\ge$ gives the semi-definite case.
:::

The other cases have names too. **Negative definite** means all $\lambda_i < 0$ (an upside-down bowl). **Negative semi-definite** means all $\le 0$. **Indefinite** means eigenvalues of both signs, so the form takes both signs (a saddle).

A PD matrix is invertible, because no eigenvalue is zero. Its inverse is PD too, with eigenvalues $1/\lambda_i$. A PSD matrix that is not PD is singular: some eigenvalue is zero, and along that eigenvector the form is zero.

Three quick consequences you will use constantly:

- A PD matrix has a positive diagonal, since $a_{ii} = \mathbf{e}_i^\mathsf{T}\mathbf{A}\mathbf{e}_i$ (the form evaluated on the $i$-th axis).
- Its determinant (the product of the eigenvalues) is positive, and so is its trace (their sum).
- For every pair $i \neq j$, $|a_{ij}| < \sqrt{a_{ii}a_{jj}}$. For a covariance, this says the correlation coefficient $a_{ij}/\sqrt{a_{ii}a_{jj}}$ is less than one in size.

These are *necessary* conditions, handy for spotting a bad matrix at a glance. They are not enough: the example above had a positive diagonal and was indefinite.

## Three tests

**1. Eigenvalues.** Compute them with `np.linalg.eigh` and look at the smallest. This is the definition, and the most informative test: it tells you *how* positive definite the matrix is. It costs roughly $10n^3$ arithmetic operations — fine for a $15$-state filter, too slow inside a tight loop.

**2. Leading principal minors.** A **leading principal minor** $D_k$ is the determinant of the top-left $k\times k$ block. **[[Sylvester's criterion|sylvester]]** says a symmetric matrix is PD if and only if $D_1, D_2, \dots, D_n$ are all positive.

Why the "only if" half holds: if $\mathbf{A} \succ 0$, feed the form vectors whose last $n - k$ entries are zero. That tests only the top-left $k\times k$ block, which must therefore be PD, so its determinant is positive. The "if" half follows from the pivot test below.

Two cautions. It is for hand work on small matrices. And for *semi*-definiteness it fails as stated: $\operatorname{diag}(0, -1)$ has leading minors $0$ and $0$, both $\ge 0$, yet it is not PSD. For PSD you must check *all* principal minors, not only the leading ones.

**3. Pivots.** Run Gaussian elimination with no row swaps. A symmetric matrix is PD if and only if all $n$ pivots are positive. This is Sylvester's test in disguise, because the $k$-th pivot is the ratio of neighboring minors, $d_k = D_k/D_{k-1}$. On a symmetric matrix, elimination costs about $n^3/3$ operations, and it can stop the moment a pivot goes non-positive. So this is the practical test. Lesson 6 shows that taking square roots of the pivots turns this elimination into the Cholesky factorization $\mathbf{A} = \mathbf{L}\mathbf{L}^\mathsf{T}$ — and "did the Cholesky factorization succeed?" is how production code asks "is this matrix positive definite?".

::: example Testing a three-by-three matrix three ways
Let $\mathbf{A} = \begin{pmatrix} 4 & 2 & 0 \\ 2 & 5 & 3 \\ 0 & 3 & 6 \end{pmatrix}$.

**Leading minors.** $D_1 = 4$. $D_2 = 4\times 5 - 2\times 2 = 16$. $D_3$ expands along the first row: $4(5\times 6 - 3\times 3) - 2(2\times 6 - 3\times 0) + 0 = 4\times 21 - 2\times 12 = 84 - 24 = 60$. All positive, so $\mathbf{A} \succ 0$.

**Pivots.** The first pivot is $4$. Clear the $(2,1)$ entry by subtracting $2/4$ of row 1 from row 2: the $(2,2)$ entry becomes $5 - \tfrac{1}{2}\times 2 = 4$ and the $(2,3)$ entry stays $3$. Row 3 needs nothing, because $a_{31} = 0$. Clear the $(3,2)$ entry by subtracting $3/4$ of the new row 2: the $(3,3)$ entry becomes $6 - \tfrac{3}{4}\times 3 = 3.75$. The pivots are $4, 4, 3.75$, all positive. They match the minor ratios: $4/1 = 4$, $16/4 = 4$, $60/16 = 3.75$.

**Eigenvalues.** The characteristic polynomial is $\lambda^3 - 15\lambda^2 + 61\lambda - 60$. (The $15$ is the trace. The $61 = 16 + 24 + 21$ is the sum of the three $2\times 2$ principal minors. The $60$ is the determinant.) Its roots are $\lambda = 1.452$, $4.640$ and $8.909$. Check: they add to $15.00$ and multiply to $60.0$. All positive, agreeing with the other two tests. The smallest one says the form can get as small as $1.452\|\mathbf{x}\|^2$, but no smaller.

**A near miss.** Change the $(3,3)$ entry from $6$ to $2$. The first two minors do not change. But $D_3 = 4(10 - 9) - 2(4) = -4 < 0$, and the third pivot is $2 - 3\times\tfrac{3}{4} = -0.25$. The matrix is indefinite; its eigenvalues are $7.675$, $3.475$ and $-0.150$. A diagonal of $4, 5, 2$ looked perfectly healthy.
:::

::: warning Definiteness is a property of symmetric matrices
The eigenvalue test means nothing on a non-symmetric matrix. $\begin{pmatrix} 1 & -3 \\ 0 & 1 \end{pmatrix}$ has both eigenvalues equal to $1$. Yet at $\mathbf{x} = (1, 1)^\mathsf{T}$ the form is $1 - 3 + 1 = -1$. The form only sees the symmetric part $\begin{pmatrix} 1 & -1.5 \\ -1.5 & 1 \end{pmatrix}$, whose eigenvalues are $2.5$ and $-0.5$. If your covariance has drifted off symmetric, symmetrize it before you ask `eigh` anything — and remember that `eigh` reads only one triangle.
:::

## Where positive definite matrices come from

Almost every PD matrix in GNC arrives by one of three routes, each with its own proof.

**Gram matrices.** For any $m\times n$ matrix $\mathbf{A}$, the $n\times n$ matrix $\mathbf{A}^\mathsf{T}\mathbf{A}$ is symmetric and PSD, because its form is a squared length:

$$\mathbf{x}^\mathsf{T}\mathbf{A}^\mathsf{T}\mathbf{A}\mathbf{x} = (\mathbf{A}\mathbf{x})^\mathsf{T}(\mathbf{A}\mathbf{x}) = \|\mathbf{A}\mathbf{x}\|^2 \ge 0.$$

It is PD exactly when $\mathbf{A}\mathbf{x} = \mathbf{0}$ forces $\mathbf{x} = \mathbf{0}$ — that is, when $\mathbf{A}$ has full column rank and its null space holds only zero. The normal-equation matrix of a least-squares fit is a Gram matrix. So is the information matrix $\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}$ of a set of measurements. "The information matrix is singular" and "some direction of the state cannot be seen from these measurements" are the same sentence.

**Covariances.** Let $\mathbf{x}$ be a random vector with mean $\boldsymbol{\mu}$ and covariance $\mathbf{P} = \mathbb{E}[(\mathbf{x} - \boldsymbol{\mu})(\mathbf{x} - \boldsymbol{\mu})^\mathsf{T}]$. (Read $\mathbb{E}$ as "the **[[expected value|expectation]]** of" — the long-run average.) Pick any fixed vector $\mathbf{a}$. The single number $\mathbf{a}^\mathsf{T}\mathbf{x}$ has variance

$$\operatorname{Var}(\mathbf{a}^\mathsf{T}\mathbf{x}) = \mathbb{E}\big[(\mathbf{a}^\mathsf{T}(\mathbf{x} - \boldsymbol{\mu}))^2\big] = \mathbb{E}\big[\mathbf{a}^\mathsf{T}(\mathbf{x} - \boldsymbol{\mu})(\mathbf{x} - \boldsymbol{\mu})^\mathsf{T}\mathbf{a}\big] = \mathbf{a}^\mathsf{T}\mathbf{P}\mathbf{a}.$$

(A number squared is the number times its own transpose, and the fixed $\mathbf{a}$ comes outside the average.) A variance cannot be negative, so the covariance is PSD. It is PD unless some combination of the states has zero variance — some direction known exactly. That happens, for instance, when a constraint such as a quaternion's unit length is carried as a state.

::: key Why a covariance is symmetric positive semi-definite
For any vector $\mathbf{a}$, $\mathbf{a}^\mathsf{T}\mathbf{P}\mathbf{a} = \operatorname{Var}(\mathbf{a}^\mathsf{T}\mathbf{x}) \ge 0$ — a variance cannot be negative — and $\operatorname{Cov}(x_i, x_j) = \operatorname{Cov}(x_j, x_i)$ forces symmetry. The one-sigma ellipsoid $\mathbf{e}^\mathsf{T}\mathbf{P}^{-1}\mathbf{e} = 1$ has semi-axes $\sqrt{\lambda_i}$ along the eigenvectors of $\mathbf{P}$.
:::

**Hessians at a minimum.** The Hessian of a cost $J(\mathbf{x})$ is its matrix of second derivatives — how the slope itself changes. If $J$ has a strict local minimum at $\mathbf{x}^\star$, its Hessian there is PSD. If the Hessian there is PD, the point is a strict minimum. Lesson 7 derives this from the expansion $J(\mathbf{x}^\star + \boldsymbol{\delta}) \approx J(\mathbf{x}^\star) + \tfrac{1}{2}\boldsymbol{\delta}^\mathsf{T}\mathbf{H}\boldsymbol{\delta}$. A PD Hessian means the cost rises in every direction — a bowl. Indefinite means a saddle. For the same reason, the weights in an LQR cost (LQR designs a controller by penalizing errors and effort) $\mathbf{x}^\mathsf{T}\mathbf{Q}\mathbf{x} + \mathbf{u}^\mathsf{T}\mathbf{R}\mathbf{u}$ are chosen PSD and PD: the cost must never reward a state error or a control effort.

Two closure rules produce the rest.

- **Sums.** A sum of PSD matrices is PSD, because their forms add.
- **Sandwiches.** For any matrix $\mathbf{B}$ of the right shape, $\mathbf{B}\mathbf{P}\mathbf{B}^\mathsf{T}$ is PSD whenever $\mathbf{P}$ is: $\mathbf{x}^\mathsf{T}\mathbf{B}\mathbf{P}\mathbf{B}^\mathsf{T}\mathbf{x} = (\mathbf{B}^\mathsf{T}\mathbf{x})^\mathsf{T}\mathbf{P}(\mathbf{B}^\mathsf{T}\mathbf{x}) \ge 0$.

The **[[sandwich|sandwich-picture]]** — $\mathbf{P}$ as the filling, $\mathbf{B}$ and $\mathbf{B}^\mathsf{T}$ as the bread — is the one shape guaranteed to keep symmetry and semi-definiteness. That is why every covariance formula in a filter has the shape $\mathbf{B}\,\cdot\,\mathbf{B}^\mathsf{T}$.

## Moving a covariance: the sandwich rule

Suppose you know the uncertainty in $\mathbf{x}$ and you compute $\mathbf{y} = \mathbf{A}\mathbf{x} + \mathbf{b}$, with $\mathbf{A}$ and $\mathbf{b}$ fixed. What is the uncertainty in $\mathbf{y}$?

The mean is $\boldsymbol{\mu}_y = \mathbf{A}\boldsymbol{\mu}_x + \mathbf{b}$, so the constant $\mathbf{b}$ cancels from the deviation: $\mathbf{y} - \boldsymbol{\mu}_y = \mathbf{A}(\mathbf{x} - \boldsymbol{\mu}_x)$. Then

$$\mathbf{P}_y = \mathbb{E}\big[\mathbf{A}(\mathbf{x} - \boldsymbol{\mu}_x)(\mathbf{x} - \boldsymbol{\mu}_x)^\mathsf{T}\mathbf{A}^\mathsf{T}\big] = \mathbf{A}\,\mathbb{E}\big[(\mathbf{x} - \boldsymbol{\mu}_x)(\mathbf{x} - \boldsymbol{\mu}_x)^\mathsf{T}\big]\mathbf{A}^\mathsf{T} = \mathbf{A}\mathbf{P}_x\mathbf{A}^\mathsf{T}.$$

The first step uses $(\mathbf{A}\mathbf{d})^\mathsf{T} = \mathbf{d}^\mathsf{T}\mathbf{A}^\mathsf{T}$. The second pulls the fixed matrices outside the average.

::: key Covariance under a linear map
If $\mathbf{y} = \mathbf{A}\mathbf{x}$ then $\mathbf{P}_y = \mathbf{A}\mathbf{P}_x\mathbf{A}^\mathsf{T}$. The sandwich form is what keeps the result symmetric and positive semi-definite. With $\mathbf{A}$ replaced by a Jacobian it is the EKF's linearised propagation; with $\mathbf{A} = \boldsymbol{\Phi}$ and additive noise it is the prediction step $\mathbf{P}_{k+1} = \boldsymbol{\Phi}\mathbf{P}_k\boldsymbol{\Phi}^\mathsf{T} + \mathbf{Q}$.
:::

Now apply it to a system that steps forward in time: $\mathbf{x}_{k+1} = \boldsymbol{\Phi}\mathbf{x}_k + \mathbf{w}_k$. Here $\boldsymbol{\Phi} = e^{\mathbf{A}\Delta t}$ is the state transition matrix of Lesson 2, and $\mathbf{w}_k$ is **process noise** — random pushes the model cannot predict — with zero mean and covariance $\mathbf{Q}$, independent of $\mathbf{x}_k$. Write $\mathbf{e}_k = \mathbf{x}_k - \hat{\mathbf{x}}_k$ for the estimation error ($\hat{\mathbf{x}}$, "x hat", is the estimate). Then $\mathbf{e}_{k+1} = \boldsymbol{\Phi}\mathbf{e}_k + \mathbf{w}_k$, and

$$\mathbf{P}_{k+1} = \mathbb{E}\big[(\boldsymbol{\Phi}\mathbf{e}_k + \mathbf{w}_k)(\boldsymbol{\Phi}\mathbf{e}_k + \mathbf{w}_k)^\mathsf{T}\big] = \boldsymbol{\Phi}\mathbf{P}_k\boldsymbol{\Phi}^\mathsf{T} + \boldsymbol{\Phi}\,\mathbb{E}[\mathbf{e}_k\mathbf{w}_k^\mathsf{T}] + \mathbb{E}[\mathbf{w}_k\mathbf{e}_k^\mathsf{T}]\boldsymbol{\Phi}^\mathsf{T} + \mathbf{Q}.$$

Of the four terms, the two middle ones vanish, because the noise has zero mean and is independent of the current error. What is left is

$$\mathbf{P}_{k+1} = \boldsymbol{\Phi}\mathbf{P}_k\boldsymbol{\Phi}^\mathsf{T} + \mathbf{Q}:$$

a sandwich plus a PSD matrix, so PSD by the closure rules. It is PD whenever $\mathbf{P}_k$ is, since $\boldsymbol{\Phi}$ is invertible. (This $\mathbf{Q}$ is the process noise covariance, not the eigenvector matrix of Lesson 4. Both uses are standard, and the context always tells them apart.)

::: example Propagating a position–velocity covariance
A vehicle moves along one axis at nearly constant velocity. The filter's step is $\Delta t = 0.1\,\mathrm{s}$, so $\boldsymbol{\Phi} = \begin{pmatrix} 1 & 0.1 \\ 0 & 1 \end{pmatrix}$: new position = old position + $0.1\times$ velocity.

**Starting uncertainty.** $\sigma_p = 10\,\mathrm{m}$ and $\sigma_v = 1\,\mathrm{m/s}$, uncorrelated, so $\mathbf{P}_k = \operatorname{diag}(100, 1)$ in $\mathrm{m^2}$ and $\mathrm{m^2/s^2}$.

**Process noise.** Model the disturbance as an unknown constant acceleration over the step, with $\sigma_a = 0.5\,\mathrm{m/s^2}$. It enters through $\mathbf{G} = (\Delta t^2/2,\ \Delta t)^\mathsf{T} = (0.005, 0.1)^\mathsf{T}$ — how far and how fast a unit acceleration moves you in one step. So $\mathbf{Q} = \mathbf{G}\sigma_a^2\mathbf{G}^\mathsf{T}$, itself a sandwich:

$$\mathbf{Q} = 0.25\begin{pmatrix} 2.5\times 10^{-5} & 5\times 10^{-4} \\ 5\times 10^{-4} & 0.01 \end{pmatrix} = \begin{pmatrix} 6.25\times 10^{-6} & 1.25\times 10^{-4} \\ 1.25\times 10^{-4} & 2.5\times 10^{-3} \end{pmatrix}.$$

$\mathbf{Q}$ has rank one: its eigenvalues are $2.506\times 10^{-3}$ and $0$. It is PSD but not PD. That is correct physics. One scalar noise cannot spread uncertainty in two independent directions in a single step.

**The sandwich.** First $\boldsymbol{\Phi}\mathbf{P}_k = \begin{pmatrix} 100 & 0.1 \\ 0 & 1 \end{pmatrix}$. Then $\boldsymbol{\Phi}\mathbf{P}_k\boldsymbol{\Phi}^\mathsf{T} = \begin{pmatrix} 100.01 & 0.1 \\ 0.1 & 1 \end{pmatrix}$. Adding $\mathbf{Q}$,

$$\mathbf{P}_{k+1} = \begin{pmatrix} 100.01001 & 0.100125 \\ 0.100125 & 1.0025 \end{pmatrix}.$$

**What happened.** The step created a correlation out of nothing: a velocity error of $+1\,\mathrm{m/s}$ has become a $+0.1\,\mathrm{m}$ position error, so the two errors are now linked. The eigenvalues are $100.010$ and $1.00240$, both positive, and the determinant is $100.25$.

**Ten steps later**, with no measurements, the covariance is $\begin{pmatrix} 101.008 & 1.0125 \\ 1.0125 & 1.025 \end{pmatrix}$. The correlation coefficient is $1.0125/\sqrt{101.008\times 1.025} = 0.0995$, and every eigenvalue is still positive, as the sandwich rule guarantees. Sanity check: the uncertainty only grew, as it should with no new information.
:::

## How a filter loses positive definiteness

The trouble starts at the measurement update. A measurement arrives, related to the state by the matrix $\mathbf{H}$, with noise covariance $\mathbf{R}$. The **[[Kalman gain|kalman-gain]]** is $\mathbf{K} = \mathbf{P}\mathbf{H}^\mathsf{T}(\mathbf{H}\mathbf{P}\mathbf{H}^\mathsf{T} + \mathbf{R})^{-1}$, and the textbook covariance update is the short form

$$\mathbf{P}^+ = (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}.$$

It is not a sandwich. It is an unsymmetric matrix times a symmetric one, symmetric only because $\mathbf{K}$ has one exact value — itself computed with round-off.

Worse, it is a *difference*, $\mathbf{P} - \mathbf{K}\mathbf{H}\mathbf{P}$, of two nearly equal matrices along any direction the measurement pins down well. Subtracting nearly equal numbers is **[[catastrophic cancellation|cancellation]]**. After a strong measurement, the small eigenvalues of $\mathbf{P}^+$ are small differences of large numbers. A few units of round-off in the last place can push one of them below zero. A covariance with a negative eigenvalue is not a covariance: it claims a negative variance in some direction, and the next gain computed from it can point the wrong way.

The cure is to rewrite the update as a sum of sandwiches. The error after the update is $\mathbf{e}^+ = (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{e} - \mathbf{K}\mathbf{v}$, where $\mathbf{v}$ is the measurement noise. Take the covariance of both sides with the sandwich rule, using the independence of $\mathbf{e}$ and $\mathbf{v}$, and you get the **[[Joseph form|joseph-name]]**:

$$\mathbf{P}^+ = (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}(\mathbf{I} - \mathbf{K}\mathbf{H})^\mathsf{T} + \mathbf{K}\mathbf{R}\mathbf{K}^\mathsf{T}.$$

It equals the short form when $\mathbf{K}$ is the optimal gain, but it holds for *any* gain. And — the whole point — it is plainly symmetric and PSD, being a sandwich plus a sandwich. It costs one extra matrix product, and it is the standard update in flight code.

There are two other defenses:

- **Symmetrize** after every update, $\mathbf{P} \leftarrow \tfrac{1}{2}(\mathbf{P} + \mathbf{P}^\mathsf{T})$. This removes the asymmetry, but not a negative eigenvalue.
- **Square-root filtering.** Carry a factor $\mathbf{S}$ with $\mathbf{P} = \mathbf{S}\mathbf{S}^\mathsf{T}$, instead of $\mathbf{P}$ itself. Then $\mathbf{P}$ is PSD by construction, whatever round-off does to $\mathbf{S}$. Lesson 6 introduces that factor.

::: warning Do not clamp a negative eigenvalue and move on
A tempting fix is to eigen-decompose $\mathbf{P}$, raise any negative eigenvalue to a small positive floor, and rebuild. The matrix becomes PD, but not *right*. The negative eigenvalue was a symptom that the update lost accuracy in that direction, and the rebuilt matrix is a guess. Use it as a last-resort guard with a logged warning, never as the update.
:::

## The Mahalanobis distance

Being $2\,\mathrm{m}$ off means little until you know how uncertain you expected to be. The inverse of a PD covariance is PD, and its form is the natural ruler for an error. The **Mahalanobis distance** of an error $\mathbf{e}$ is

$$d(\mathbf{e}) = \sqrt{\mathbf{e}^\mathsf{T}\mathbf{P}^{-1}\mathbf{e}}:$$

how many sigmas $\mathbf{e}$ lies from the mean, taking correlation into account. In the eigenbasis it is $\sqrt{\sum_i y_i^2/\lambda_i}$ — each component measured in units of its own standard deviation. The surface $d = 1$ is the one-sigma ellipsoid with semi-axes $\sqrt{\lambda_i}$, matching Lesson 4.

Filters use it as a gate: a measurement more than $3$ or so from its prediction is rejected as an outlier. The test only makes sense if $\mathbf{P}$ is PD, because $\mathbf{P}^{-1}$ must exist and the distance must be real.

Take $\mathbf{P} = \begin{pmatrix} 4 & 1.5 \\ 1.5 & 2 \end{pmatrix}\,\mathrm{m^2}$ from Lesson 4. Its inverse is $\mathbf{P}^{-1} = \tfrac{1}{5.75}\begin{pmatrix} 2 & -1.5 \\ -1.5 & 4 \end{pmatrix}$ (swap the diagonal, negate the off-diagonal, divide by the determinant). For the error $\mathbf{e} = (2, 1)^\mathsf{T}\,\mathrm{m}$,

$$d^2 = \frac{2\times 2^2 - 2\times 1.5\times 2\times 1 + 4\times 1^2}{5.75} = \frac{8 - 6 + 4}{5.75} = \frac{6}{5.75} = 1.043,$$

so $d = 1.02$: [[a one-sigma event|mahalanobis-picture]], because the error lies close to the correlated direction. The error $(2, -1)^\mathsf{T}$ has the same length, but $d^2 = (8 + 6 + 4)/5.75 = 3.13$ and $d = 1.77$. It is nearly twice as surprising, because it runs against the correlation.

## Positive definiteness in NumPy

```python
import numpy as np

P = np.array([[100.01001, 0.100125], [0.100125, 1.0025]])
P = 0.5 * (P + P.T)                  # symmetrise before either test
w = np.linalg.eigvalsh(P)            # eigenvalues only, ascending
print(w)                             # [  1.00239875 100.01011125]
print(w.min() > 0)                   # True: positive definite
try:
    np.linalg.cholesky(P)            # succeeds iff P is PD (Lesson 6)
    print("PD")                      # PD
except np.linalg.LinAlgError:
    print("not PD")
```

## Check yourself

::: check
Write $q(\mathbf{x}) = 3x_1^2 - 4x_1x_2 + 3x_2^2$ as $\mathbf{x}^\mathsf{T}\mathbf{A}\mathbf{x}$ with $\mathbf{A}$ symmetric, classify it, and describe the level set $q = 1$.
:::

::: answer
Split the cross term $-4$ equally: $\mathbf{A} = \begin{pmatrix} 3 & -2 \\ -2 & 3 \end{pmatrix}$.

Trace $6$, determinant $9 - 4 = 5$, so $\lambda^2 - 6\lambda + 5 = (\lambda - 5)(\lambda - 1) = 0$. The eigenvalues $5$ and $1$ are both positive: the form is positive definite. Check by completing the square: $q = 3(x_1 - \tfrac{2}{3}x_2)^2 + \tfrac{5}{3}x_2^2 > 0$.

The level set $q = 1$ is an ellipse. Its semi-axis is $1/\sqrt{1} = 1$ along the eigenvector of $\lambda = 1$, which is $(1, 1)/\sqrt{2}$, and $1/\sqrt{5} = 0.447$ along $(1, -1)/\sqrt{2}$.
:::

::: check
Is $\mathbf{M} = \begin{pmatrix} 2 & 3 \\ 3 & 4 \end{pmatrix}$ positive definite? Answer with the quickest test, then confirm with another.
:::

::: answer
No. The quick necessary condition $|a_{12}| < \sqrt{a_{11}a_{22}}$ fails: $3 > \sqrt{8} = 2.83$. Equivalently, the second leading minor is $2\times 4 - 3\times 3 = -1 < 0$.

Confirm with the eigenvalues: trace $6$, determinant $-1$, so $\lambda = 3 \pm\sqrt{9 + 1} = 3 \pm\sqrt{10}$, which is $6.16$ and $-0.162$. Indefinite.

As a covariance it would claim a correlation of $3/\sqrt{8} = 1.06$, which is impossible.
:::

::: check
$\mathbf{A}$ is $m\times n$ with $m < n$. Can $\mathbf{A}^\mathsf{T}\mathbf{A}$ be positive definite? Can $\mathbf{A}\mathbf{A}^\mathsf{T}$?
:::

::: answer
$\mathbf{A}^\mathsf{T}\mathbf{A}$ is $n\times n$, and $\mathbf{x}^\mathsf{T}\mathbf{A}^\mathsf{T}\mathbf{A}\mathbf{x} = \|\mathbf{A}\mathbf{x}\|^2$, which is zero for any $\mathbf{x}$ in the null space of $\mathbf{A}$. With $m < n$ the rank is at most $m$, which is less than $n$, so the null space holds nonzero vectors. So $\mathbf{A}^\mathsf{T}\mathbf{A}$ is PSD but singular — never PD.

$\mathbf{A}\mathbf{A}^\mathsf{T}$ is $m\times m$. It is PD exactly when the null space of $\mathbf{A}^\mathsf{T}$ holds only zero — that is, when the $m$ rows of $\mathbf{A}$ are independent. That is possible.

In estimation terms: with fewer measurements than states, $\mathbf{H}^\mathsf{T}\mathbf{H}$ is singular and some state direction is invisible to that batch.
:::

::: check
A covariance $\mathbf{P}_x = \operatorname{diag}(4, 1)$ is mapped through $\mathbf{A} = \begin{pmatrix} 1 & 1 \\ 1 & -1 \end{pmatrix}$. Find $\mathbf{P}_y$ and its eigenvalues, and explain why they had to be positive.
:::

::: answer
$\mathbf{P}_y = \mathbf{A}\mathbf{P}_x\mathbf{A}^\mathsf{T}$. First $\mathbf{A}\mathbf{P}_x = \begin{pmatrix} 4 & 1 \\ 4 & -1 \end{pmatrix}$ (each column of $\mathbf{A}$ scaled by the matching diagonal entry). Then multiply by $\mathbf{A}^\mathsf{T}$, which here equals $\mathbf{A}$: $\mathbf{P}_y = \begin{pmatrix} 5 & 3 \\ 3 & 5 \end{pmatrix}$.

Trace $10$, determinant $25 - 9 = 16$, so the eigenvalues are $8$ and $2$.

They had to be positive because a sandwich $\mathbf{A}\mathbf{P}\mathbf{A}^\mathsf{T}$ of a PD matrix with an invertible $\mathbf{A}$ is PD: $\mathbf{x}^\mathsf{T}\mathbf{A}\mathbf{P}\mathbf{A}^\mathsf{T}\mathbf{x} = (\mathbf{A}^\mathsf{T}\mathbf{x})^\mathsf{T}\mathbf{P}(\mathbf{A}^\mathsf{T}\mathbf{x}) > 0$ for $\mathbf{x} \neq \mathbf{0}$. The map has also created a correlation of $3/5 = 0.6$ between two components that started out independent.
:::

::: check
Why does the Joseph-form update stay a valid covariance for a suboptimal gain, while the short form does not?
:::

::: answer
The Joseph form comes from $\mathbf{e}^+ = (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{e} - \mathbf{K}\mathbf{v}$ by taking the covariance of both sides, with no assumption about $\mathbf{K}$. So it is the true error covariance for whatever gain you use. Its shape — two sandwiches added — makes it symmetric and PSD for every $\mathbf{K}$.

The short form $(\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}$ comes from the Joseph form by using an identity that only the optimal gain satisfies, $\mathbf{K}(\mathbf{H}\mathbf{P}\mathbf{H}^\mathsf{T} + \mathbf{R}) = \mathbf{P}\mathbf{H}^\mathsf{T}$, to cancel terms. With any other gain — including the optimal gain spoiled by round-off — the cancellation is incomplete. The result is no longer the true covariance, and nothing in its shape guarantees symmetry or a non-negative form.
:::

## Summary

| Item | Statement |
| --- | --- |
| Quadratic form | $q(\mathbf{x}) = \mathbf{x}^\mathsf{T}\mathbf{A}\mathbf{x}$; only the symmetric part $\tfrac{1}{2}(\mathbf{A} + \mathbf{A}^\mathsf{T})$ contributes; $= \sum_i\lambda_iy_i^2$ in the eigenbasis |
| Positive semi-definite | $\mathbf{A} \succeq 0$: $\mathbf{x}^\mathsf{T}\mathbf{A}\mathbf{x} \ge 0$ for all $\mathbf{x}$ $\Leftrightarrow$ all $\lambda_i \ge 0$ |
| Positive definite | $\mathbf{A} \succ 0$: $\mathbf{x}^\mathsf{T}\mathbf{A}\mathbf{x} > 0$ for $\mathbf{x} \neq \mathbf{0}$ $\Leftrightarrow$ all $\lambda_i > 0$; invertible, $\mathbf{A}^{-1} \succ 0$ |
| Necessary signs | positive diagonal, positive trace and determinant, $\lvert a_{ij}\rvert < \sqrt{a_{ii}a_{jj}}$ |
| Tests | all eigenvalues $> 0$; all leading principal minors $> 0$ (Sylvester); all elimination pivots $> 0$, $d_k = D_k/D_{k-1}$ |
| Gram matrix | $\mathbf{A}^\mathsf{T}\mathbf{A} \succeq 0$ since $\mathbf{x}^\mathsf{T}\mathbf{A}^\mathsf{T}\mathbf{A}\mathbf{x} = \lVert\mathbf{A}\mathbf{x}\rVert^2$; PD iff full column rank |
| Covariance | $\mathbf{a}^\mathsf{T}\mathbf{P}\mathbf{a} = \operatorname{Var}(\mathbf{a}^\mathsf{T}\mathbf{x}) \ge 0$; symmetric because $\operatorname{Cov}(x_i, x_j) = \operatorname{Cov}(x_j, x_i)$ |
| Sandwich rule | $\mathbf{P}_y = \mathbf{A}\mathbf{P}_x\mathbf{A}^\mathsf{T}$; sums and sandwiches of PSD matrices are PSD |
| Prediction | $\mathbf{P}_{k+1} = \boldsymbol{\Phi}\mathbf{P}_k\boldsymbol{\Phi}^\mathsf{T} + \mathbf{Q}$, cross terms vanish by independence |
| Joseph form | $\mathbf{P}^+ = (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}(\mathbf{I} - \mathbf{K}\mathbf{H})^\mathsf{T} + \mathbf{K}\mathbf{R}\mathbf{K}^\mathsf{T}$, PSD for any gain |
| Mahalanobis distance | $d = \sqrt{\mathbf{e}^\mathsf{T}\mathbf{P}^{-1}\mathbf{e}}$, sigmas from the mean; one-sigma ellipsoid has semi-axes $\sqrt{\lambda_i}$ |

The next lesson takes the pivot test one step further. Pulling square roots out of the pivots factors a positive definite matrix as $\mathbf{L}\mathbf{L}^\mathsf{T}$. That is the Cholesky factorization — the fastest PD test, the fastest way to solve with a PD matrix, and the covariance square root that sigma-point and square-root filters are built on.

::: context variance-word Variance in one breath
Measure something many times and the answers scatter. Take each answer's distance from the average, square it, and average the squares: that is the **variance**. Its square root, the **standard deviation** $\sigma$ ("sigma"), is back in the original units. If a GPS position has $\sigma = 3\,\mathrm{m}$, its variance is $9\,\mathrm{m^2}$. Squaring is what makes a variance impossible to be negative — and that single fact is what this whole lesson is built on.
:::

::: context homogeneous Every term the same degree
**Homogeneous** means every term has the same total power. In $2x_1^2 + 2x_1x_2 + 3x_2^2$, each term multiplies exactly two variables together, so the degree is two throughout. There is no lone $x_1$ and no constant. One consequence: double $\mathbf{x}$ and $q$ goes up four times, since $q(t\mathbf{x}) = t^2q(\mathbf{x})$. So a quadratic form's sign depends only on the *direction* of $\mathbf{x}$, never on its length — which is why "positive in every direction" is the right question.
:::

::: context level-sets Bowl and saddle, seen from above
Contour lines of the two forms from the example. On the left, both eigenvalues are positive and the curve $q = 1$ closes into an ellipse, tilted along the eigenvectors. On the right, one eigenvalue is negative and the curve $q' = 1$ never closes: it is a hyperbola, and in the other two quadrants the form goes negative.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="100" x2="160" y2="100" stroke="#6c7a93"/><line x1="90" y1="30" x2="90" y2="170" stroke="#6c7a93"/>
  <line x1="200" y1="100" x2="340" y2="100" stroke="#6c7a93"/><line x1="270" y1="30" x2="270" y2="170" stroke="#6c7a93"/>
  <ellipse cx="90" cy="100" rx="59.5" ry="36.8" transform="rotate(31.72 90 100)" fill="#8fb8f0" fill-opacity="0.5" stroke="#1d6fd1" stroke-width="2"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2" points="255.5,23.9 258.2,31.4 260.7,38.3 263.2,44.6 265.5,50.4 267.9,55.6 270.2,60.4 272.5,64.8 274.8,68.8 277.2,72.6 279.7,76.0 282.3,79.2 284.9,82.2 287.8,85.1 290.8,87.7 294.0,90.3 297.4,92.8 301.2,95.2 305.2,97.5 309.6,99.8 314.4,102.1 319.6,104.5 325.4,106.8 331.7,109.3 338.6,111.8 346.1,114.5 354.5,117.3"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2" points="185.5,82.7 193.9,85.5 201.4,88.2 208.3,90.7 214.6,93.2 220.4,95.5 225.6,97.9 230.4,100.2 234.8,102.5 238.8,104.8 242.6,107.2 246.0,109.7 249.2,112.3 252.2,114.9 255.1,117.8 257.7,120.8 260.3,124.0 262.8,127.4 265.2,131.2 267.5,135.2 269.8,139.6 272.1,144.4 274.5,149.6 276.8,155.4 279.3,161.7 281.8,168.6 284.5,176.1"/>
  <text x="90" y="190" font-size="12" text-anchor="middle" fill="#1d6fd1">2x₁² + 2x₁x₂ + 3x₂² = 1</text>
  <text x="270" y="190" font-size="12" text-anchor="middle" fill="#b4232c">x₁² + 4x₁x₂ + x₂² = 1</text>
  <text x="90" y="18" font-size="12" text-anchor="middle" fill="#1f2a44">eigenvalues 3.62, 1.38</text>
  <text x="270" y="18" font-size="12" text-anchor="middle" fill="#1f2a44">eigenvalues 3, −1</text>
</svg>
```
:::

::: context bowl-saddle Marbles, troughs and saddles
Drop a marble on the graph of $q$. On a positive definite bowl it rolls to the bottom at the origin from anywhere. On a semi-definite trough it settles somewhere along a flat line — many equally low points. On a saddle (the shape of a horse saddle, or a curved potato chip) it can roll off downhill. That is the whole reason optimizers care: a minimum is a bowl, and the definiteness of the Hessian is how you tell a bowl from a saddle.
:::

::: context sylvester The man who named the matrix
James Joseph Sylvester was a 19th-century English mathematician who worked for years with Arthur Cayley on the algebra of determinants and invariants. In 1850 he coined the word **matrix** — Latin for "womb" — for a rectangular array of numbers from which determinants are born. The test for positive definiteness by leading minors carries his name.
:::

::: context expectation The long-run average
The **expected value** $\mathbb{E}[z]$ of a random quantity $z$ is what its average would settle to over a huge number of repeats. Roll a fair die forever and the average settles at $3.5$. Two rules do all the work in this lesson. Averages add: $\mathbb{E}[z + w] = \mathbb{E}[z] + \mathbb{E}[w]$. Fixed numbers and matrices come out front: $\mathbb{E}[\mathbf{A}\mathbf{z}] = \mathbf{A}\,\mathbb{E}[\mathbf{z}]$.
:::

::: context sandwich-picture What the sandwich does to an ellipse
The check-yourself map $\mathbf{A} = \begin{pmatrix} 1 & 1 \\ 1 & -1 \end{pmatrix}$ applied to $\mathbf{P}_x = \operatorname{diag}(4, 1)$. The error ellipse on the left, with semi-axes $2$ and $1$, becomes the ellipse on the right: $\mathbf{P}_y = \begin{pmatrix} 5 & 3 \\ 3 & 5 \end{pmatrix}$, with semi-axes $\sqrt{8} = 2.83$ and $\sqrt{2} = 1.41$, tilted $45^\circ$. The map stretched and turned it — but an ellipse stays an ellipse. A sandwich can never turn it into something with a negative variance.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="90" x2="150" y2="90" stroke="#6c7a93"/><line x1="85" y1="30" x2="85" y2="150" stroke="#6c7a93"/>
  <line x1="210" y1="90" x2="340" y2="90" stroke="#6c7a93"/><line x1="275" y1="30" x2="275" y2="150" stroke="#6c7a93"/>
  <ellipse cx="85" cy="90" rx="36.0" ry="18.0" fill="#8fb8f0" fill-opacity="0.5" stroke="#1d6fd1" stroke-width="2"/>
  <ellipse cx="275" cy="90" rx="50.9" ry="25.5" transform="rotate(-45.00 275 90)" fill="#f2b880" fill-opacity="0.6" stroke="#b4232c" stroke-width="2"/>
  <line x1="160" y1="90" x2="196" y2="90" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="204,90 194,85 194,95" fill="#1f2a44"/>
  <text x="180" y="78" font-size="12" text-anchor="middle" fill="#1f2a44">A · Aᵀ</text>
  <text x="85" y="170" font-size="12" text-anchor="middle" fill="#1d6fd1">Px = diag(4, 1)</text>
  <text x="275" y="170" font-size="12" text-anchor="middle" fill="#b4232c">Py: semi-axes 2.83, 1.41</text>
  <text x="85" y="20" font-size="11" text-anchor="middle" fill="#1f2a44">semi-axes 2, 1</text>
  <text x="275" y="20" font-size="11" text-anchor="middle" fill="#1f2a44">tilted 45°</text>
</svg>
```
:::

::: context kalman-gain What the gain does
A Kalman filter holds a prediction and receives a measurement, and it must decide how much to trust each. The **gain** $\mathbf{K}$ is that decision: the new estimate is the prediction plus $\mathbf{K}$ times the surprise (measurement minus predicted measurement). A big $\mathbf{P}$ (unsure prediction) and a small $\mathbf{R}$ (precise sensor) make $\mathbf{K}$ big. Rudolf Kálmán published the filter in 1960, and within a few years it was running in the Apollo guidance computer. The estimation module derives it from scratch.
:::

::: context cancellation Losing digits by subtracting
Suppose your calculator keeps seven digits. You compute $1.234567 - 1.234560 = 0.000007$. The inputs had seven good digits each; the answer has one. If each input carried a rounding error in its last digit, that error is now as big as the answer itself. This is **catastrophic cancellation**: subtraction does not create the error, it exposes it. A strong measurement makes $\mathbf{K}\mathbf{H}\mathbf{P}$ nearly equal to $\mathbf{P}$ in some direction, and the short-form update subtracts them.
:::

::: context joseph-name Where the Joseph form comes from
The form is named after Peter Joseph, who worked on applying Kalman filters to guidance problems in the 1960s. It appears in Bucy and Joseph's 1968 book *Filtering for Stochastic Processes with Applications to Guidance*. Engineers adopted it because it traded a little extra arithmetic for a covariance that cannot lose its shape — a trade flight software makes gladly.
:::

::: context mahalanobis-picture Same length, different surprise
Both dots are $\sqrt{5} = 2.24\,\mathrm{m}$ from the center. The blue one, $(2, 1)$, sits almost on the one-sigma ellipse, because it points along the direction where errors are expected to be large. The red one, $(2, -1)$, points across the ellipse's narrow way, where errors should be small, so it lands most of the way out to the two-sigma line. The distance is named after Prasanta Chandra Mahalanobis, the Indian statistician who described it in a 1936 paper.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="100" x2="270" y2="100" stroke="#6c7a93"/><line x1="150" y1="15" x2="150" y2="185" stroke="#6c7a93"/>
  <ellipse cx="150" cy="100" rx="122.7" ry="61.3" transform="rotate(-28.15 150 100)" fill="none" stroke="#1d6fd1" stroke-width="1.5" stroke-dasharray="5 3"/>
  <ellipse cx="150" cy="100" rx="61.4" ry="30.6" transform="rotate(-28.15 150 100)" fill="#8fb8f0" fill-opacity="0.5" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="150" y1="100" x2="206" y2="72" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="150" y1="100" x2="206" y2="128" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="206" cy="72" r="4" fill="#1d6fd1"/>
  <circle cx="206" cy="128" r="4" fill="#b4232c"/>
  <line x1="211" y1="73" x2="264" y2="76" stroke="#1d6fd1" stroke-width="1"/>
  <text x="268" y="80" font-size="12" fill="#1d6fd1">d = 1.02</text>
  <text x="214" y="142" font-size="12" fill="#b4232c">d = 1.77</text>
  <text x="275" y="104" font-size="11" fill="#1f2a44">east</text>
  <text x="40" y="30" font-size="11" fill="#1f2a44">solid: 1 sigma</text>
  <text x="40" y="46" font-size="11" fill="#1f2a44">dashed: 2 sigma</text>
</svg>
```
:::
