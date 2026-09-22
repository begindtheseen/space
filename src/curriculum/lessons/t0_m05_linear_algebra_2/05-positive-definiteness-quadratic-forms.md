---
id: l05-positive-definiteness-quadratic-forms
title: Positive definiteness and quadratic forms
minutes: 22
covers:
  - positive definiteness and quadratic forms
---

A covariance matrix is a promise: pick any direction, and the variance of the error along that direction is the number the matrix gives you. A variance cannot be negative. So a covariance matrix must give a non-negative number for every direction, and that single requirement — a scalar built from a matrix and a vector must never go negative — is positive semi-definiteness. It is the property that every covariance, every information matrix, every cost-function Hessian at a minimum and every weighting matrix in a quadratic cost must have, and it is the property that a Kalman filter loses first when its arithmetic goes wrong.

The scalar in question is the quadratic form $\mathbf{x}^\mathsf{T}\mathbf{A}\mathbf{x}$. Lesson 4 showed that in the eigenbasis of a symmetric $\mathbf{A}$ it is a weighted sum of squares, $\sum_i\lambda_i y_i^2$, so its sign is decided by the signs of the eigenvalues. This lesson turns that observation into the definitions of positive definite and positive semi-definite, gives you three practical tests, shows where such matrices come from, and derives the two formulas a filter uses to move a covariance around: $\mathbf{P}_y = \mathbf{A}\mathbf{P}_x\mathbf{A}^\mathsf{T}$ and $\mathbf{P}_{k+1} = \boldsymbol{\Phi}\mathbf{P}_k\boldsymbol{\Phi}^\mathsf{T} + \mathbf{Q}$.

It ends with the practical failure Lesson 4 hinted at: why the textbook covariance update can leave a matrix that is no longer positive definite, and what the standard defences are. Lesson 6 then gives the factorisation that makes positive definiteness checkable and keeps it by construction.

## Quadratic forms

A **quadratic form** in $n$ variables is a homogeneous polynomial of degree two, and every such polynomial can be written as

$$q(\mathbf{x}) = \mathbf{x}^\mathsf{T}\mathbf{A}\mathbf{x} = \sum_{i=1}^n\sum_{j=1}^n a_{ij}x_ix_j$$

for a square matrix $\mathbf{A}$. For $n = 2$ this reads $q = a_{11}x_1^2 + (a_{12} + a_{21})x_1x_2 + a_{22}x_2^2$. Only the sum $a_{12} + a_{21}$ appears, which tells you that the antisymmetric part of $\mathbf{A}$ contributes nothing: writing $\mathbf{A} = \tfrac{1}{2}(\mathbf{A} + \mathbf{A}^\mathsf{T}) + \tfrac{1}{2}(\mathbf{A} - \mathbf{A}^\mathsf{T})$, the second term $\mathbf{S}$ satisfies $\mathbf{x}^\mathsf{T}\mathbf{S}\mathbf{x} = (\mathbf{x}^\mathsf{T}\mathbf{S}\mathbf{x})^\mathsf{T} = \mathbf{x}^\mathsf{T}\mathbf{S}^\mathsf{T}\mathbf{x} = -\mathbf{x}^\mathsf{T}\mathbf{S}\mathbf{x}$, so it is zero. Every quadratic form therefore has a unique symmetric matrix, and from here on $\mathbf{A}$ in $\mathbf{x}^\mathsf{T}\mathbf{A}\mathbf{x}$ is symmetric unless said otherwise. The polynomial $2x_1^2 + 2x_1x_2 + 3x_2^2$ has symmetric matrix $\begin{pmatrix} 2 & 1 \\ 1 & 3 \end{pmatrix}$: the cross-term coefficient is split equally across the two off-diagonal slots.

With $\mathbf{A} = \mathbf{Q}\boldsymbol{\Lambda}\mathbf{Q}^\mathsf{T}$ and $\mathbf{y} = \mathbf{Q}^\mathsf{T}\mathbf{x}$ the form becomes $\sum_i\lambda_iy_i^2$, with no cross terms. Its level sets $q(\mathbf{x}) = c$ are therefore conics aligned with the eigenvectors. If every $\lambda_i > 0$ the set $q = 1$ is an ellipsoid with semi-axes $1/\sqrt{\lambda_i}$ along $\mathbf{q}_i$; if the eigenvalues have mixed signs it is a hyperboloid, and the form takes both signs.

::: example Reading a two-variable quadratic form
Take $q(\mathbf{x}) = 2x_1^2 + 2x_1x_2 + 3x_2^2$, so $\mathbf{A} = \begin{pmatrix} 2 & 1 \\ 1 & 3 \end{pmatrix}$. Trace $5$, determinant $5$: $\lambda^2 - 5\lambda + 5 = 0$ gives $\lambda_{1,2} = (5 \pm\sqrt{5})/2 = 3.618$ and $1.382$. Both positive, so $q > 0$ for every $\mathbf{x} \neq \mathbf{0}$ — you can also see this by completing the square, $q = 2(x_1 + \tfrac{1}{2}x_2)^2 + \tfrac{5}{2}x_2^2$, a sum of two squares with positive coefficients. The curve $q = 1$ is an ellipse with semi-axes $1/\sqrt{1.382} = 0.851$ and $1/\sqrt{3.618} = 0.526$. Its long axis is the eigenvector of the *smaller* eigenvalue, $\lambda = 1.382$: from $(2 - 1.382)v_1 + v_2 = 0$, $\mathbf{q}_2 \propto (1, -0.618)$, pointing $31.7^\circ$ below the $x_1$-axis. The form grows slowest in that direction, so the level curve reaches furthest there.

Now change one sign: $q'(\mathbf{x}) = x_1^2 + 4x_1x_2 + x_2^2$ has matrix $\begin{pmatrix} 1 & 2 \\ 2 & 1 \end{pmatrix}$ with eigenvalues $3$ and $-1$. Along $(1, 1)$ the form is $6$; along $(1, -1)$ it is $1 - 4 + 1 = -2$. The level set $q' = 1$ is a hyperbola, and there is no ellipse. Note that the diagonal entries are both positive: the diagonal alone tells you nothing about the sign of the form.
:::

## Definiteness

::: key Positive definite and positive semi-definite
A symmetric matrix $\mathbf{A}$ is **positive semi-definite** (PSD, written $\mathbf{A} \succeq 0$) if and only if $\mathbf{x}^\mathsf{T}\mathbf{A}\mathbf{x} \ge 0$ for all $\mathbf{x}$, equivalently all its eigenvalues are $\ge 0$. It is **positive definite** (PD, $\mathbf{A} \succ 0$) if $\mathbf{x}^\mathsf{T}\mathbf{A}\mathbf{x} > 0$ for all $\mathbf{x} \neq \mathbf{0}$, equivalently all eigenvalues are $> 0$.
:::

The equivalence between the sign of the form and the sign of the eigenvalues is the Rayleigh bound of Lesson 4 read in both directions. If all $\lambda_i > 0$ then $\mathbf{x}^\mathsf{T}\mathbf{A}\mathbf{x} \ge \lambda_{\min}\|\mathbf{x}\|^2 > 0$ for $\mathbf{x} \neq \mathbf{0}$. Conversely, if the form is positive for every nonzero $\mathbf{x}$, evaluate it at an eigenvector: $\mathbf{q}_i^\mathsf{T}\mathbf{A}\mathbf{q}_i = \lambda_i\|\mathbf{q}_i\|^2 = \lambda_i$, so every eigenvalue is positive. The same argument with $\ge$ gives the semi-definite case. The remaining possibilities have names too: **negative definite** (all $\lambda_i < 0$), **negative semi-definite** (all $\le 0$) and **indefinite** (eigenvalues of both signs, so the form takes both signs). A PD matrix is invertible, because no eigenvalue is zero, and its inverse is PD with eigenvalues $1/\lambda_i$. A PSD matrix that is not PD is singular: some eigenvalue is zero, and along that eigenvector the form vanishes.

Three consequences you will use constantly. A PD matrix has a positive diagonal, since $a_{ii} = \mathbf{e}_i^\mathsf{T}\mathbf{A}\mathbf{e}_i$. Its determinant, the product of the eigenvalues, is positive, and so is its trace. And for any two vectors, $|a_{ij}| < \sqrt{a_{ii}a_{jj}}$ — for a covariance this says the correlation coefficient has magnitude below one. These are necessary conditions, useful for spotting a bad matrix at a glance, but the example above showed that a positive diagonal is not sufficient.

## Three tests

**Eigenvalues.** Compute them with `np.linalg.eigh` and look at the smallest. This is the definition, it is the most informative test (it tells you *how* positive definite the matrix is), and it costs about $10n^3$ flops, which is fine for a $15$-state filter and too slow inside a tight loop.

**Leading principal minors.** Sylvester's criterion says a symmetric matrix is PD if and only if every leading principal minor — the determinant of the top-left $k\times k$ block, for $k = 1, \dots, n$ — is positive. The necessity is quick: if $\mathbf{A} \succ 0$ then restricting $\mathbf{x}$ to its first $k$ components shows the $k\times k$ block is PD, so its determinant is positive. Sufficiency follows from the elimination test below. Two cautions: the criterion is for hand work on small matrices, and for semi-definiteness it does not work as stated — $\operatorname{diag}(0, -1)$ has leading minors $0$ and $0$, both non-negative, yet is not PSD. For PSD you must check *all* principal minors, not only the leading ones.

**Pivots.** Run Gaussian elimination without row exchanges. A symmetric matrix is PD if and only if all $n$ pivots are positive. This is Sylvester's criterion in disguise, because the $k$-th pivot equals the ratio of consecutive leading minors, $d_k = D_k/D_{k-1}$. Elimination costs $n^3/3$ flops on a symmetric matrix and stops the moment a pivot goes non-positive, so it is the practical test. Lesson 6 shows that taking square roots of the pivots turns this elimination into the Cholesky factorisation $\mathbf{A} = \mathbf{L}\mathbf{L}^\mathsf{T}$, and that "the Cholesky factorisation succeeded" is how production code asks "is this matrix positive definite?".

::: example Testing a three-by-three matrix three ways
Let $\mathbf{A} = \begin{pmatrix} 4 & 2 & 0 \\ 2 & 5 & 3 \\ 0 & 3 & 6 \end{pmatrix}$. Leading minors: $D_1 = 4$; $D_2 = 4\times 5 - 2\times 2 = 16$; $D_3 = 4(5\times 6 - 3\times 3) - 2(2\times 6 - 0) + 0 = 84 - 24 = 60$. All positive, so $\mathbf{A} \succ 0$.

Pivots: the first is $4$. Eliminating row 2 with multiplier $2/4$ leaves $5 - 1 = 4$ in the $(2,2)$ slot and $3$ in $(2,3)$; the third row is untouched because $a_{31} = 0$. Eliminating row 3 with multiplier $3/4$ leaves $6 - 3\times 3/4 = 3.75$. Pivots $4, 4, 3.75$, all positive, and indeed $4 = 4/1$, $4 = 16/4$, $3.75 = 60/16$ are the ratios of the minors.

Eigenvalues: the characteristic polynomial is $\lambda^3 - 15\lambda^2 + (16 + 24 + 21)\lambda - 60 = \lambda^3 - 15\lambda^2 + 61\lambda - 60$, whose roots are $\lambda = 1.452$, $4.640$ and $8.909$ (sum $15.00$, product $60.0$). All positive, agreeing with the other two tests, and the smallest one says the form can get as small as $1.452\|\mathbf{x}\|^2$ but no smaller.

For contrast, change the $(3,3)$ entry to $2$. The first two minors are unchanged, but $D_3 = 4(10 - 9) - 2(4) = -4 < 0$, and the third pivot is $2 - 3\times 3/4 = -0.25$. The matrix is indefinite: its eigenvalues are $7.675$, $3.475$ and $-0.150$. A diagonal of $4, 5, 2$ looked perfectly healthy.
:::

::: warning Definiteness is a property of symmetric matrices
Applying the eigenvalue test to a non-symmetric matrix is meaningless: $\begin{pmatrix} 1 & -3 \\ 0 & 1 \end{pmatrix}$ has both eigenvalues equal to $1$, yet at $\mathbf{x} = (1, 1)^\mathsf{T}$ the form is $1 - 3 + 1 = -1$. The form only sees the symmetric part $\begin{pmatrix} 1 & -1.5 \\ -1.5 & 1 \end{pmatrix}$, whose eigenvalues are $2.5$ and $-0.5$. If your covariance has drifted off symmetric, symmetrise it before you ask `eigh` anything, and remember that `eigh` reads only one triangle.
:::

## Where positive definite matrices come from

Almost every PD matrix in GNC arises in one of three ways, and each way carries its own proof.

**Gram matrices.** For any $m\times n$ matrix $\mathbf{A}$, the $n\times n$ matrix $\mathbf{A}^\mathsf{T}\mathbf{A}$ is symmetric and PSD, because

$$\mathbf{x}^\mathsf{T}\mathbf{A}^\mathsf{T}\mathbf{A}\mathbf{x} = (\mathbf{A}\mathbf{x})^\mathsf{T}(\mathbf{A}\mathbf{x}) = \|\mathbf{A}\mathbf{x}\|^2 \ge 0.$$

It is PD exactly when $\mathbf{A}\mathbf{x} = \mathbf{0}$ forces $\mathbf{x} = \mathbf{0}$, that is, when $\mathbf{A}$ has full column rank and its null space is trivial. The normal-equation matrix of a least-squares fit and the information matrix $\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}$ of a measurement set are Gram matrices, and "the information matrix is singular" and "some state direction is unobservable from these measurements" are the same sentence.

**Covariances.** Let $\mathbf{x}$ be a random vector with mean $\boldsymbol{\mu}$ and covariance $\mathbf{P} = \mathbb{E}[(\mathbf{x} - \boldsymbol{\mu})(\mathbf{x} - \boldsymbol{\mu})^\mathsf{T}]$. For any fixed vector $\mathbf{a}$, the scalar $\mathbf{a}^\mathsf{T}\mathbf{x}$ has variance

$$\operatorname{Var}(\mathbf{a}^\mathsf{T}\mathbf{x}) = \mathbb{E}\big[(\mathbf{a}^\mathsf{T}(\mathbf{x} - \boldsymbol{\mu}))^2\big] = \mathbb{E}\big[\mathbf{a}^\mathsf{T}(\mathbf{x} - \boldsymbol{\mu})(\mathbf{x} - \boldsymbol{\mu})^\mathsf{T}\mathbf{a}\big] = \mathbf{a}^\mathsf{T}\mathbf{P}\mathbf{a},$$

and a variance is an expectation of a square, so it is non-negative. The covariance is PSD; it is PD unless some linear combination of the states has zero variance, that is, unless some direction is known exactly — which happens, for instance, when a constraint such as unit quaternion norm is carried as a state.

::: key Why a covariance is symmetric positive semi-definite
For any vector $\mathbf{a}$, $\mathbf{a}^\mathsf{T}\mathbf{P}\mathbf{a} = \operatorname{Var}(\mathbf{a}^\mathsf{T}\mathbf{x}) \ge 0$ — a variance cannot be negative — and $\operatorname{Cov}(x_i, x_j) = \operatorname{Cov}(x_j, x_i)$ forces symmetry. The one-sigma ellipsoid $\mathbf{e}^\mathsf{T}\mathbf{P}^{-1}\mathbf{e} = 1$ has semi-axes $\sqrt{\lambda_i}$ along the eigenvectors of $\mathbf{P}$.
:::

**Hessians at a minimum.** If a twice-differentiable cost $J(\mathbf{x})$ has a strict local minimum at $\mathbf{x}^\star$, then its Hessian there is PSD, and if the Hessian is PD the point is a strict minimum. Lesson 7 derives this through the second-order Taylor expansion $J(\mathbf{x}^\star + \boldsymbol{\delta}) \approx J(\mathbf{x}^\star) + \tfrac{1}{2}\boldsymbol{\delta}^\mathsf{T}\mathbf{H}\boldsymbol{\delta}$; the point is that a PD Hessian means the cost rises in every direction. Indefinite means a saddle. The weighting matrices of a quadratic cost such as $\mathbf{x}^\mathsf{T}\mathbf{Q}\mathbf{x} + \mathbf{u}^\mathsf{T}\mathbf{R}\mathbf{u}$ in an LQR design are chosen PSD and PD respectively for the same reason: the cost must never reward a state error or a control effort.

Two closure rules generate the rest. A sum of PSD matrices is PSD, because the forms add. And for any matrix $\mathbf{B}$ of compatible shape, $\mathbf{B}\mathbf{P}\mathbf{B}^\mathsf{T}$ is PSD whenever $\mathbf{P}$ is: $\mathbf{x}^\mathsf{T}\mathbf{B}\mathbf{P}\mathbf{B}^\mathsf{T}\mathbf{x} = (\mathbf{B}^\mathsf{T}\mathbf{x})^\mathsf{T}\mathbf{P}(\mathbf{B}^\mathsf{T}\mathbf{x}) \ge 0$. This **sandwich** form is the one shape that provably preserves symmetry and semi-definiteness, and it is the reason every covariance formula in a filter has the shape $\mathbf{B}\,\cdot\,\mathbf{B}^\mathsf{T}$.

## Moving a covariance: the sandwich rule

Let $\mathbf{y} = \mathbf{A}\mathbf{x} + \mathbf{b}$ with $\mathbf{A}$ and $\mathbf{b}$ constant. The mean is $\boldsymbol{\mu}_y = \mathbf{A}\boldsymbol{\mu}_x + \mathbf{b}$, so $\mathbf{y} - \boldsymbol{\mu}_y = \mathbf{A}(\mathbf{x} - \boldsymbol{\mu}_x)$ and

$$\mathbf{P}_y = \mathbb{E}\big[\mathbf{A}(\mathbf{x} - \boldsymbol{\mu}_x)(\mathbf{x} - \boldsymbol{\mu}_x)^\mathsf{T}\mathbf{A}^\mathsf{T}\big] = \mathbf{A}\,\mathbb{E}\big[(\mathbf{x} - \boldsymbol{\mu}_x)(\mathbf{x} - \boldsymbol{\mu}_x)^\mathsf{T}\big]\mathbf{A}^\mathsf{T} = \mathbf{A}\mathbf{P}_x\mathbf{A}^\mathsf{T}.$$

::: key Covariance under a linear map
If $\mathbf{y} = \mathbf{A}\mathbf{x}$ then $\mathbf{P}_y = \mathbf{A}\mathbf{P}_x\mathbf{A}^\mathsf{T}$. The sandwich form is what keeps the result symmetric and positive semi-definite. With $\mathbf{A}$ replaced by a Jacobian it is the EKF's linearised propagation; with $\mathbf{A} = \boldsymbol{\Phi}$ and additive noise it is the prediction step $\mathbf{P}_{k+1} = \boldsymbol{\Phi}\mathbf{P}_k\boldsymbol{\Phi}^\mathsf{T} + \mathbf{Q}$.
:::

Now apply it to a discrete-time linear system. Let $\mathbf{x}_{k+1} = \boldsymbol{\Phi}\mathbf{x}_k + \mathbf{w}_k$, where $\boldsymbol{\Phi} = e^{\mathbf{A}\Delta t}$ is the state transition matrix of Lesson 2 and $\mathbf{w}_k$ is zero-mean process noise with covariance $\mathbf{Q}$, independent of $\mathbf{x}_k$. Write $\mathbf{e}_k = \mathbf{x}_k - \hat{\mathbf{x}}_k$ for the estimation error, so $\mathbf{e}_{k+1} = \boldsymbol{\Phi}\mathbf{e}_k + \mathbf{w}_k$ and

$$\mathbf{P}_{k+1} = \mathbb{E}\big[(\boldsymbol{\Phi}\mathbf{e}_k + \mathbf{w}_k)(\boldsymbol{\Phi}\mathbf{e}_k + \mathbf{w}_k)^\mathsf{T}\big] = \boldsymbol{\Phi}\mathbf{P}_k\boldsymbol{\Phi}^\mathsf{T} + \boldsymbol{\Phi}\,\mathbb{E}[\mathbf{e}_k\mathbf{w}_k^\mathsf{T}] + \mathbb{E}[\mathbf{w}_k\mathbf{e}_k^\mathsf{T}]\boldsymbol{\Phi}^\mathsf{T} + \mathbf{Q}.$$

The two cross terms vanish because the noise is independent of the current error, leaving $\mathbf{P}_{k+1} = \boldsymbol{\Phi}\mathbf{P}_k\boldsymbol{\Phi}^\mathsf{T} + \mathbf{Q}$: a sandwich plus a PSD matrix, so PSD by the closure rules, and PD whenever $\mathbf{P}_k$ is, since $\boldsymbol{\Phi}$ is invertible. (This $\mathbf{Q}$ is the process noise covariance, not the orthogonal eigenvector matrix of Lesson 4; both uses are standard and the context always tells them apart.)

::: example Propagating a position–velocity covariance
A one-axis constant-velocity model with $\Delta t = 0.1\,\mathrm{s}$ has $\boldsymbol{\Phi} = \begin{pmatrix} 1 & 0.1 \\ 0 & 1 \end{pmatrix}$. Suppose the current uncertainty is $\sigma_p = 10\,\mathrm{m}$ and $\sigma_v = 1\,\mathrm{m/s}$, uncorrelated, so $\mathbf{P}_k = \operatorname{diag}(100, 1)$ in units of $\mathrm{m^2}$ and $\mathrm{m^2/s^2}$. Model the disturbance as an unknown constant acceleration over the step with $\sigma_a = 0.5\,\mathrm{m/s^2}$, entering through $\mathbf{G} = (\Delta t^2/2,\ \Delta t)^\mathsf{T} = (0.005, 0.1)^\mathsf{T}$, so that $\mathbf{Q} = \mathbf{G}\sigma_a^2\mathbf{G}^\mathsf{T}$ is itself a sandwich:

$$\mathbf{Q} = 0.25\begin{pmatrix} 2.5\times 10^{-5} & 5\times 10^{-4} \\ 5\times 10^{-4} & 0.01 \end{pmatrix} = \begin{pmatrix} 6.25\times 10^{-6} & 1.25\times 10^{-4} \\ 1.25\times 10^{-4} & 2.5\times 10^{-3} \end{pmatrix}.$$

$\mathbf{Q}$ is rank one — its eigenvalues are $2.506\times 10^{-3}$ and $0$ — so it is PSD but not PD. That is correct physics: one scalar noise cannot spread uncertainty in two independent directions in a single step.

The sandwich: $\boldsymbol{\Phi}\mathbf{P}_k = \begin{pmatrix} 100 & 0.1 \\ 0 & 1 \end{pmatrix}$, then $\boldsymbol{\Phi}\mathbf{P}_k\boldsymbol{\Phi}^\mathsf{T} = \begin{pmatrix} 100.01 & 0.1 \\ 0.1 & 1 \end{pmatrix}$. Adding $\mathbf{Q}$,

$$\mathbf{P}_{k+1} = \begin{pmatrix} 100.01001 & 0.100125 \\ 0.100125 & 1.0025 \end{pmatrix}.$$

The propagation has created a positive correlation between position and velocity out of nothing: a velocity error of $+1\,\mathrm{m/s}$ has been integrated into a $+0.1\,\mathrm{m}$ position error, and the two are now linked. Its eigenvalues are $100.010$ and $1.00240$, both positive, and the determinant is $100.25$. After ten such steps with no measurements the covariance is $\begin{pmatrix} 101.008 & 1.0125 \\ 1.0125 & 1.025 \end{pmatrix}$, with a correlation coefficient of $1.0125/\sqrt{101.008\times 1.025} = 0.0995$ and every eigenvalue still positive, as the sandwich rule guarantees.
:::

## How a filter loses positive definiteness

The measurement update is where the trouble starts. After a measurement with Jacobian $\mathbf{H}$ and noise covariance $\mathbf{R}$, the Kalman gain is $\mathbf{K} = \mathbf{P}\mathbf{H}^\mathsf{T}(\mathbf{H}\mathbf{P}\mathbf{H}^\mathsf{T} + \mathbf{R})^{-1}$ and the textbook update of the covariance is the short form

$$\mathbf{P}^+ = (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}.$$

Look at its shape. It is not a sandwich: the right-hand side is a product of a non-symmetric matrix and a symmetric one, symmetric only because of the specific value of $\mathbf{K}$, which is itself computed with round-off. And it is a *difference*, $\mathbf{P} - \mathbf{K}\mathbf{H}\mathbf{P}$, of two matrices that are nearly equal along any direction the measurement pins down well. Subtracting nearly equal numbers is catastrophic cancellation, and after a strong measurement the small eigenvalues of $\mathbf{P}^+$ are the small differences of large numbers. A few units of round-off in the last place is enough to push one of them below zero, and a covariance with a negative eigenvalue is not a covariance: it claims a negative variance along some direction, and the next gain computed from it can point the wrong way.

The remedy is to rewrite the update as a sum of sandwiches. Substituting the definition of the error into $\mathbf{e}^+ = (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{e} - \mathbf{K}\mathbf{v}$, where $\mathbf{v}$ is the measurement noise, and taking the expectation gives the **Joseph form**

$$\mathbf{P}^+ = (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}(\mathbf{I} - \mathbf{K}\mathbf{H})^\mathsf{T} + \mathbf{K}\mathbf{R}\mathbf{K}^\mathsf{T},$$

which equals the short form when $\mathbf{K}$ is the optimal gain but holds for *any* gain, and — the point — is manifestly symmetric and PSD, being a sandwich plus a sandwich. It costs one extra matrix product and is the standard update in flight code. The other defences are symmetrising after every update, $\mathbf{P} \leftarrow \tfrac{1}{2}(\mathbf{P} + \mathbf{P}^\mathsf{T})$, which removes the asymmetry but not a negative eigenvalue, and square-root filtering, which propagates a factor $\mathbf{S}$ with $\mathbf{P} = \mathbf{S}\mathbf{S}^\mathsf{T}$ so that $\mathbf{P}$ is PSD by construction no matter what round-off does to $\mathbf{S}$. Lesson 6 introduces that factor.

::: warning Do not clamp a negative eigenvalue and move on
A tempting fix is to eigen-decompose $\mathbf{P}$, set any negative eigenvalue to a small positive floor and rebuild. It makes the matrix PD, but it does not make it *right*: the negative eigenvalue was a symptom that the update lost accuracy along that direction, and the reconstructed matrix is a guess. Use it as a last-resort guard with a logged warning, not as the update.
:::

## The Mahalanobis distance

The inverse of a PD covariance is PD, and its quadratic form is the natural way to measure the size of an error. The **Mahalanobis distance** of an error $\mathbf{e}$ is

$$d(\mathbf{e}) = \sqrt{\mathbf{e}^\mathsf{T}\mathbf{P}^{-1}\mathbf{e}},$$

the number of sigmas $\mathbf{e}$ lies from the mean, accounting for correlation. In the eigenbasis it is $\sqrt{\sum_i y_i^2/\lambda_i}$, each component measured in units of its own standard deviation. The surface $d = 1$ is the one-sigma ellipsoid with semi-axes $\sqrt{\lambda_i}$, matching Lesson 4. Filters gate measurements on it: an innovation whose Mahalanobis distance exceeds $3$ or so is rejected as an outlier, and the test only makes sense if $\mathbf{P}$ is PD, because $\mathbf{P}^{-1}$ must exist and the distance must be real.

With $\mathbf{P} = \begin{pmatrix} 4 & 1.5 \\ 1.5 & 2 \end{pmatrix}\,\mathrm{m^2}$ from Lesson 4, $\mathbf{P}^{-1} = \tfrac{1}{5.75}\begin{pmatrix} 2 & -1.5 \\ -1.5 & 4 \end{pmatrix}$. The error $\mathbf{e} = (2, 1)^\mathsf{T}\,\mathrm{m}$ has $d^2 = (2\times 4 - 2\times 1.5\times 2 + 4\times 1)/5.75 = 6/5.75 = 1.043$, so $d = 1.02$: a one-sigma event, because it lies close to the correlated direction. The error $(2, -1)^\mathsf{T}$ of the same length has $d^2 = (8 + 6 + 4)/5.75 = 3.13$, $d = 1.77$: nearly twice as surprising, because it runs against the correlation.

## Positive definiteness in NumPy

```python
import numpy as np

P = np.array([[100.01001, 0.100125], [0.100125, 1.0025]])
w = np.linalg.eigvalsh(P)           # eigenvalues only, ascending
print(w)                             # [  1.00239874 100.01010751]
print(w.min() > 0)                   # True: positive definite
try:
    np.linalg.cholesky(P)            # succeeds iff P is PD (Lesson 6)
    print("PD")
except np.linalg.LinAlgError:
    print("not PD")                  # PD
P = 0.5 * (P + P.T)                  # symmetrise before either test
```

## Check yourself

::: check
Write $q(\mathbf{x}) = 3x_1^2 - 4x_1x_2 + 3x_2^2$ as $\mathbf{x}^\mathsf{T}\mathbf{A}\mathbf{x}$ with $\mathbf{A}$ symmetric, classify it, and describe the level set $q = 1$.
:::

::: answer
$\mathbf{A} = \begin{pmatrix} 3 & -2 \\ -2 & 3 \end{pmatrix}$, splitting the cross term $-4$ equally. Trace $6$, determinant $5$: $\lambda^2 - 6\lambda + 5 = (\lambda - 5)(\lambda - 1)$, eigenvalues $5$ and $1$, both positive, so the form is positive definite. Check directly: $q = 3(x_1 - \tfrac{2}{3}x_2)^2 + \tfrac{5}{3}x_2^2 > 0$. The level set $q = 1$ is an ellipse with semi-axes $1/\sqrt{1} = 1$ along the eigenvector of $\lambda = 1$, which is $(1, 1)/\sqrt{2}$, and $1/\sqrt{5} = 0.447$ along $(1, -1)/\sqrt{2}$.
:::

::: check
Is $\mathbf{M} = \begin{pmatrix} 2 & 3 \\ 3 & 4 \end{pmatrix}$ positive definite? Answer with the quickest test, then confirm with another.
:::

::: answer
No. The necessary condition $|a_{12}| < \sqrt{a_{11}a_{22}}$ fails: $3 > \sqrt{8} = 2.83$. Equivalently the second leading minor is $8 - 9 = -1 < 0$. Confirm with the eigenvalues: trace $6$, determinant $-1$, so $\lambda = 3 \pm\sqrt{10} = 6.16$ and $-0.162$ — indefinite. As a covariance this matrix would claim a correlation coefficient of $3/\sqrt{8} = 1.06$, which is impossible.
:::

::: check
$\mathbf{A}$ is $m\times n$ with $m < n$. Can $\mathbf{A}^\mathsf{T}\mathbf{A}$ be positive definite? Can $\mathbf{A}\mathbf{A}^\mathsf{T}$?
:::

::: answer
$\mathbf{A}^\mathsf{T}\mathbf{A}$ is $n\times n$ and $\mathbf{x}^\mathsf{T}\mathbf{A}^\mathsf{T}\mathbf{A}\mathbf{x} = \|\mathbf{A}\mathbf{x}\|^2$, which is zero for any $\mathbf{x}$ in the null space of $\mathbf{A}$. With $m < n$ the rank is at most $m < n$, so the null space is non-trivial and $\mathbf{A}^\mathsf{T}\mathbf{A}$ is PSD but singular, never PD. $\mathbf{A}\mathbf{A}^\mathsf{T}$ is $m\times m$ and is PD exactly when $\mathbf{A}^\mathsf{T}$ has trivial null space, that is, when the $m$ rows of $\mathbf{A}$ are independent — which is possible. In estimation terms: fewer measurements than states means the information matrix $\mathbf{H}^\mathsf{T}\mathbf{H}$ is singular and some state direction is unobservable from that batch alone.
:::

::: check
A covariance $\mathbf{P}_x = \operatorname{diag}(4, 1)$ is mapped through $\mathbf{A} = \begin{pmatrix} 1 & 1 \\ 1 & -1 \end{pmatrix}$. Find $\mathbf{P}_y$ and its eigenvalues, and explain why they had to be positive.
:::

::: answer
$\mathbf{P}_y = \mathbf{A}\mathbf{P}_x\mathbf{A}^\mathsf{T}$. First $\mathbf{A}\mathbf{P}_x = \begin{pmatrix} 4 & 1 \\ 4 & -1 \end{pmatrix}$, then multiplying by $\mathbf{A}^\mathsf{T} = \mathbf{A}$ gives $\mathbf{P}_y = \begin{pmatrix} 5 & 3 \\ 3 & 5 \end{pmatrix}$. Trace $10$, determinant $16$: eigenvalues $8$ and $2$. They are positive because a sandwich $\mathbf{A}\mathbf{P}\mathbf{A}^\mathsf{T}$ of a PD matrix by an invertible $\mathbf{A}$ is PD: $\mathbf{x}^\mathsf{T}\mathbf{A}\mathbf{P}\mathbf{A}^\mathsf{T}\mathbf{x} = (\mathbf{A}^\mathsf{T}\mathbf{x})^\mathsf{T}\mathbf{P}(\mathbf{A}^\mathsf{T}\mathbf{x}) > 0$ for $\mathbf{x} \neq \mathbf{0}$. The map has also created a correlation of $3/5 = 0.6$ between components that were independent.
:::

::: check
Why does the Joseph-form update remain a valid covariance for a suboptimal gain, while the short form does not?
:::

::: answer
The Joseph form is derived from $\mathbf{e}^+ = (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{e} - \mathbf{K}\mathbf{v}$ by taking the covariance of both sides, with no assumption about $\mathbf{K}$: it is the true error covariance for whatever gain is used, and its shape — two sandwiches added — makes it symmetric PSD for any $\mathbf{K}$ whatsoever. The short form $(\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}$ is obtained from the Joseph form by using the specific identity that the optimal gain satisfies, $\mathbf{K}(\mathbf{H}\mathbf{P}\mathbf{H}^\mathsf{T} + \mathbf{R}) = \mathbf{P}\mathbf{H}^\mathsf{T}$, to cancel terms. With any other gain, including the optimal gain corrupted by round-off, the cancellation is incomplete, the result is no longer the true covariance, and nothing in its shape guarantees symmetry or a non-negative form.
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

The next lesson takes the elimination test one step further: pulling square roots out of the pivots factors a positive definite matrix as $\mathbf{L}\mathbf{L}^\mathsf{T}$. That is the Cholesky factorisation — the fastest PD test, the fastest way to solve with a PD matrix, and the covariance square root that sigma-point and square-root filters are built on.
