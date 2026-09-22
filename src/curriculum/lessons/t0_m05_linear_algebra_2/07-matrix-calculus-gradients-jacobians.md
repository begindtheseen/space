---
id: l07-matrix-calculus-gradients-jacobians
title: Matrix calculus, gradients and Jacobians
minutes: 21
covers:
  - matrix calculus: gradients and Jacobians
---

Almost nothing a vehicle does is linear. Range to a beacon is a square root of a sum of squares; gravity falls off as an inverse square; the attitude kinematics multiply quaternions. Yet every estimator and controller you will write works with linear algebra, because at any one instant a nonlinear function can be replaced by its best linear approximation, and the matrix of that approximation is the Jacobian. The extended Kalman filter is the Kalman filter with two Jacobians substituted for two matrices: $\mathbf{F} = \partial\mathbf{f}/\partial\mathbf{x}$ for the dynamics and $\mathbf{H} = \partial\mathbf{h}/\partial\mathbf{x}$ for the measurements. Getting them right, and knowing how to check them, is most of the work of building one.

The other object this lesson covers is the gradient of a scalar cost. Least squares, maximum likelihood, LQR, trajectory optimisation: each defines a scalar function of a vector and asks where it is smallest, and the answer begins with setting the gradient to zero. The gradient of a quadratic form $\mathbf{x}^\mathsf{T}\mathbf{A}\mathbf{x}$ is the single most used derivative in GNC, and it has a trap — it is $2\mathbf{A}\mathbf{x}$ only when $\mathbf{A}$ is symmetric.

The lesson fixes a layout convention, derives the handful of identities that cover most of what you will meet, works out the two Jacobians of a simple navigation problem and the gravity-gradient block of an orbital $\mathbf{F}$, and ends with the one habit that separates working filters from diverging ones: checking every analytic Jacobian against a finite difference.

## The gradient of a scalar function

Let $f: \mathbb{R}^n \to \mathbb{R}$. Its **gradient** is the column vector of partial derivatives,

$$\nabla f(\mathbf{x}) = \begin{pmatrix} \partial f/\partial x_1 \\ \vdots \\ \partial f/\partial x_n \end{pmatrix},$$

and its defining property is the first-order Taylor expansion $f(\mathbf{x} + \boldsymbol{\delta}) \approx f(\mathbf{x}) + \nabla f(\mathbf{x})^\mathsf{T}\boldsymbol{\delta}$: the change in $f$ for a small step $\boldsymbol{\delta}$ is the dot product of the step with the gradient. So the gradient points in the direction of steepest increase, its length is the slope in that direction, and $f$ is stationary where $\nabla f = \mathbf{0}$.

A word on layout. Some texts write the derivative of a scalar with respect to a column vector as a *row* vector, $\partial f/\partial\mathbf{x} = (\nabla f)^\mathsf{T}$, so that the Taylor term is $(\partial f/\partial\mathbf{x})\,\boldsymbol{\delta}$ with no transpose. Both are in use; this course writes the gradient as a column, matching NumPy and every optimiser's interface, and reserves $\partial\mathbf{f}/\partial\mathbf{x}$ for the Jacobian below. When you use *The Matrix Cookbook* or any other table of identities, check which convention it assumes before copying a formula — the two differ by a transpose, which for a non-square Jacobian is not a cosmetic difference.

### The identities that cover most cases

**Linear.** $f = \mathbf{b}^\mathsf{T}\mathbf{x} = \sum_i b_ix_i$, so $\partial f/\partial x_k = b_k$ and $\nabla(\mathbf{b}^\mathsf{T}\mathbf{x}) = \mathbf{b}$.

**Quadratic form.** $f = \mathbf{x}^\mathsf{T}\mathbf{A}\mathbf{x} = \sum_i\sum_j a_{ij}x_ix_j$. Differentiate with respect to $x_k$: $x_k$ appears in every term with $i = k$ and every term with $j = k$, giving $\partial f/\partial x_k = \sum_j a_{kj}x_j + \sum_i a_{ik}x_i$. The first sum is the $k$-th entry of $\mathbf{A}\mathbf{x}$, the second the $k$-th entry of $\mathbf{A}^\mathsf{T}\mathbf{x}$, so

$$\nabla(\mathbf{x}^\mathsf{T}\mathbf{A}\mathbf{x}) = (\mathbf{A} + \mathbf{A}^\mathsf{T})\mathbf{x} = 2\mathbf{A}\mathbf{x} \ \text{ when } \mathbf{A}^\mathsf{T} = \mathbf{A}.$$

**Norms.** With $\mathbf{A} = \mathbf{I}$, $\nabla\|\mathbf{x}\|^2 = 2\mathbf{x}$. For the norm itself, the chain rule on $\|\mathbf{x}\| = (\mathbf{x}^\mathsf{T}\mathbf{x})^{1/2}$ gives $\nabla\|\mathbf{x}\| = \mathbf{x}/\|\mathbf{x}\|$, the unit vector along $\mathbf{x}$, undefined at the origin.

**Composition with a linear map.** If $f(\mathbf{x}) = g(\mathbf{A}\mathbf{x} + \mathbf{c})$ then $\nabla f = \mathbf{A}^\mathsf{T}\nabla g$, evaluated at $\mathbf{A}\mathbf{x} + \mathbf{c}$. This is the chain rule, and the transpose is forced by the layout: $\nabla g$ lives in the output space, $\mathbf{A}^\mathsf{T}$ carries it back to the input space.

::: key Gradients of the linear and quadratic forms
$\nabla(\mathbf{b}^\mathsf{T}\mathbf{x}) = \mathbf{b}$ and $\nabla(\mathbf{x}^\mathsf{T}\mathbf{A}\mathbf{x}) = (\mathbf{A} + \mathbf{A}^\mathsf{T})\mathbf{x}$, which is $2\mathbf{A}\mathbf{x}$ when $\mathbf{A}$ is symmetric. For $J(\mathbf{x}) = \tfrac{1}{2}\lVert\mathbf{A}\mathbf{x} - \mathbf{b}\rVert^2$, $\nabla J = \mathbf{A}^\mathsf{T}(\mathbf{A}\mathbf{x} - \mathbf{b})$ and the Hessian is $\mathbf{A}^\mathsf{T}\mathbf{A}$.
:::

::: example The quadratic-form gradient when the matrix is not symmetric
Take $\mathbf{A} = \begin{pmatrix} 1 & 2 \\ 0 & 3 \end{pmatrix}$ and $\mathbf{x} = (1, 1)^\mathsf{T}$, so $q(\mathbf{x}) = x_1^2 + 2x_1x_2 + 3x_2^2 = 6$. The correct gradient is $(\mathbf{A} + \mathbf{A}^\mathsf{T})\mathbf{x} = \begin{pmatrix} 2 & 2 \\ 2 & 6 \end{pmatrix}\begin{pmatrix} 1 \\ 1 \end{pmatrix} = (4, 8)^\mathsf{T}$. The tempting $2\mathbf{A}\mathbf{x} = (6, 6)^\mathsf{T}$ is wrong.

Check numerically. $q(1.001, 1) = 1.002001 + 2.002 + 3 = 6.004001$, so $\partial q/\partial x_1 \approx 0.004001/0.001 = 4.00$. And $q(1, 1.001) = 1 + 2.002 + 3.006003 = 6.008003$, so $\partial q/\partial x_2 \approx 8.00$. The finite differences confirm $(4, 8)$, and they had to: the form only sees the symmetric part $\tfrac{1}{2}(\mathbf{A} + \mathbf{A}^\mathsf{T}) = \begin{pmatrix} 1 & 1 \\ 1 & 3 \end{pmatrix}$, and twice that matrix times $\mathbf{x}$ is $(4, 8)^\mathsf{T}$. A cost written as $\mathbf{x}^\mathsf{T}\mathbf{Q}\mathbf{x}$ with a non-symmetric $\mathbf{Q}$ is a bug waiting to happen; symmetrise $\mathbf{Q}$ before you differentiate.
:::

## The Hessian and the second-order picture

The **Hessian** $\mathbf{H}_f = \nabla^2 f$ is the $n\times n$ matrix of second partials, $(\nabla^2 f)_{ij} = \partial^2 f/\partial x_i\partial x_j$. For any twice continuously differentiable $f$ the mixed partials commute, so the Hessian is symmetric, and the second-order Taylor expansion is

$$f(\mathbf{x} + \boldsymbol{\delta}) \approx f(\mathbf{x}) + \nabla f^\mathsf{T}\boldsymbol{\delta} + \tfrac{1}{2}\boldsymbol{\delta}^\mathsf{T}\nabla^2 f\,\boldsymbol{\delta}.$$

At a stationary point the linear term vanishes and the sign of $f(\mathbf{x} + \boldsymbol{\delta}) - f(\mathbf{x})$ is the sign of the quadratic form $\boldsymbol{\delta}^\mathsf{T}\nabla^2 f\,\boldsymbol{\delta}$. Lesson 5 supplies the verdict: a positive definite Hessian means the cost rises in every direction, a strict local minimum; negative definite means a maximum; indefinite means a saddle. This is the promised proof that the Hessian at a minimum is PSD.

For the quadratic $f(\mathbf{x}) = \tfrac{1}{2}\mathbf{x}^\mathsf{T}\mathbf{A}\mathbf{x} - \mathbf{b}^\mathsf{T}\mathbf{x}$ with $\mathbf{A}$ symmetric, $\nabla f = \mathbf{A}\mathbf{x} - \mathbf{b}$ and $\nabla^2 f = \mathbf{A}$: the expansion is exact, the stationary point is $\mathbf{A}\mathbf{x} = \mathbf{b}$, and it is a minimum exactly when $\mathbf{A} \succ 0$. Newton's method for a general $f$ replaces $f$ by its quadratic model and jumps to the model's minimiser: $\boldsymbol{\delta} = -(\nabla^2 f)^{-1}\nabla f$. On a quadratic cost it lands exactly in one step, and Cholesky (Lesson 6) is the right way to solve for the step, because the Hessian is symmetric and, near a minimum, PD.

## The Jacobian of a vector function

Now let $\mathbf{f}: \mathbb{R}^n \to \mathbb{R}^m$, with components $f_1, \dots, f_m$. Its **Jacobian** is the $m\times n$ matrix

$$\mathbf{J} = \frac{\partial\mathbf{f}}{\partial\mathbf{x}}, \qquad J_{ij} = \frac{\partial f_i}{\partial x_j},$$

one row per output, one column per input. Row $i$ is the transpose of the gradient of $f_i$. The Taylor expansion is $\mathbf{f}(\mathbf{x} + \boldsymbol{\delta}) \approx \mathbf{f}(\mathbf{x}) + \mathbf{J}\boldsymbol{\delta}$: near $\mathbf{x}$, the nonlinear map behaves like the linear map $\mathbf{J}$ acting on the displacement.

::: key The Jacobian
For $\mathbf{f}: \mathbb{R}^n \to \mathbb{R}^m$, $J_{ij} = \partial f_i/\partial x_j$ is an $m\times n$ matrix — the best linear approximation of $\mathbf{f}$ at a point, $\mathbf{f}(\mathbf{x} + \boldsymbol{\delta}) \approx \mathbf{f}(\mathbf{x}) + \mathbf{J}\boldsymbol{\delta}$. The EKF calls it $\mathbf{H}$ for the measurement function and $\mathbf{F}$ for the dynamics, and propagates covariance through it as $\mathbf{J}\mathbf{P}\mathbf{J}^\mathsf{T}$.
:::

Three rules do most of the work. The Jacobian of a linear map $\mathbf{f}(\mathbf{x}) = \mathbf{A}\mathbf{x}$ is $\mathbf{A}$ itself. The **chain rule** for $\mathbf{h} = \mathbf{g}\circ\mathbf{f}$ is a matrix product in the order the maps are applied, $\mathbf{J}_h = \mathbf{J}_g\mathbf{J}_f$, with $\mathbf{J}_g$ evaluated at $\mathbf{f}(\mathbf{x})$; the shapes $(p\times m)(m\times n)$ enforce the order. And the sandwich rule of Lesson 5 becomes the EKF's covariance propagation: if $\mathbf{x}$ has covariance $\mathbf{P}$ and $\mathbf{y} = \mathbf{f}(\mathbf{x})$, then to first order $\mathbf{y} - \bar{\mathbf{y}} \approx \mathbf{J}(\mathbf{x} - \bar{\mathbf{x}})$ and $\mathbf{P}_y \approx \mathbf{J}\mathbf{P}\mathbf{J}^\mathsf{T}$. Every $\boldsymbol{\Phi}\mathbf{P}\boldsymbol{\Phi}^\mathsf{T}$ and $\mathbf{H}\mathbf{P}\mathbf{H}^\mathsf{T}$ in a filter is this identity with a Jacobian in the bread.

::: example Range measurements: the Jacobian $\mathbf{H}$ and the predicted measurement covariance
A receiver at unknown planar position $\mathbf{x} = (x, y)^\mathsf{T}$ measures its range to a beacon at known position $\mathbf{p}$: $h(\mathbf{x}) = \|\mathbf{x} - \mathbf{p}\|$. Using $\nabla\|\mathbf{u}\| = \mathbf{u}/\|\mathbf{u}\|$ with $\mathbf{u} = \mathbf{x} - \mathbf{p}$, the gradient is the unit vector from beacon to receiver, and the Jacobian — a $1\times 2$ row — is its transpose:

$$\mathbf{H} = \frac{\partial h}{\partial\mathbf{x}} = \frac{(\mathbf{x} - \mathbf{p})^\mathsf{T}}{\|\mathbf{x} - \mathbf{p}\|}.$$

This has a clean reading: moving the receiver a small distance $\boldsymbol{\delta}$ changes the range by the component of $\boldsymbol{\delta}$ along the line of sight, and not at all for motion across it.

Put the receiver at $(100, 50)\,\mathrm{m}$ with beacons at $(0, 0)$, $(400, 0)$ and $(0, 300)\,\mathrm{m}$. The ranges are $111.80$, $304.14$ and $269.26\,\mathrm{m}$, and stacking the three rows gives the $3\times 2$ Jacobian of the full measurement vector,

$$\mathbf{H} = \begin{pmatrix} 0.8944 & 0.4472 \\ -0.9864 & 0.1644 \\ 0.3714 & -0.9285 \end{pmatrix},$$

each row a unit line-of-sight vector. Suppose the position covariance is the $\mathbf{P} = \begin{pmatrix} 4 & 1.5 \\ 1.5 & 2 \end{pmatrix}\,\mathrm{m^2}$ of Lesson 4. The predicted covariance of the three range measurements, before noise, is $\mathbf{H}\mathbf{P}\mathbf{H}^\mathsf{T}$. Its first diagonal entry is $\mathbf{h}_1^\mathsf{T}\mathbf{P}\mathbf{h}_1 = 0.8944^2\times 4 + 2\times 0.8944\times 0.4472\times 1.5 + 0.4472^2\times 2 = 3.2 + 1.2 + 0.4 = 4.8\,\mathrm{m^2}$, so the range to the origin beacon is uncertain by $\sigma = 2.19\,\mathrm{m}$ — the largest possible, because this line of sight happens to lie along the major axis of the error ellipse, and $4.8$ is within round-off of $\lambda_{\max} = 4.803$. The full matrix is

$$\mathbf{H}\mathbf{P}\mathbf{H}^\mathsf{T} = \begin{pmatrix} 4.800 & -3.823 & -0.498 \\ -3.823 & 3.460 & -0.305 \\ -0.498 & -0.305 & 1.241 \end{pmatrix}\,\mathrm{m^2}.$$

Add the measurement noise $\mathbf{R}$ and this is the innovation covariance $\mathbf{S}$ of Lesson 6. The strong negative correlation between ranges 1 and 2 is real: the two beacons lie on nearly opposite sides of the receiver, so a position error that lengthens one range shortens the other.
:::

## The gradient of the least-squares cost

The most important scalar cost in this module is the sum of squared residuals,

$$J(\mathbf{x}) = \tfrac{1}{2}\|\mathbf{A}\mathbf{x} - \mathbf{b}\|^2 = \tfrac{1}{2}(\mathbf{A}\mathbf{x} - \mathbf{b})^\mathsf{T}(\mathbf{A}\mathbf{x} - \mathbf{b}) = \tfrac{1}{2}\mathbf{x}^\mathsf{T}\mathbf{A}^\mathsf{T}\mathbf{A}\mathbf{x} - \mathbf{b}^\mathsf{T}\mathbf{A}\mathbf{x} + \tfrac{1}{2}\mathbf{b}^\mathsf{T}\mathbf{b}.$$

Apply the identities term by term. $\mathbf{A}^\mathsf{T}\mathbf{A}$ is symmetric, so the first term has gradient $\mathbf{A}^\mathsf{T}\mathbf{A}\mathbf{x}$; the second is linear in $\mathbf{x}$ with coefficient vector $\mathbf{A}^\mathsf{T}\mathbf{b}$; the third is constant. Therefore

$$\nabla J = \mathbf{A}^\mathsf{T}\mathbf{A}\mathbf{x} - \mathbf{A}^\mathsf{T}\mathbf{b} = \mathbf{A}^\mathsf{T}(\mathbf{A}\mathbf{x} - \mathbf{b}), \qquad \nabla^2 J = \mathbf{A}^\mathsf{T}\mathbf{A}.$$

The same result comes from the composition rule with $g(\mathbf{r}) = \tfrac{1}{2}\|\mathbf{r}\|^2$ and $\mathbf{r} = \mathbf{A}\mathbf{x} - \mathbf{b}$: $\nabla J = \mathbf{A}^\mathsf{T}\nabla g = \mathbf{A}^\mathsf{T}\mathbf{r}$. Setting the gradient to zero gives $\mathbf{A}^\mathsf{T}\mathbf{A}\mathbf{x} = \mathbf{A}^\mathsf{T}\mathbf{b}$, the **normal equations**, and the Hessian $\mathbf{A}^\mathsf{T}\mathbf{A}$ is the Gram matrix of Lesson 5 — PSD always, PD when $\mathbf{A}$ has full column rank, in which case the stationary point is the unique minimum. The condition $\mathbf{A}^\mathsf{T}\mathbf{r} = \mathbf{0}$ says the optimal residual is orthogonal to every column of $\mathbf{A}$, which is the projection picture of Linear Algebra I recovered from calculus. Lesson 11 is about how to *solve* these equations without paying for their conditioning.

::: example One Newton step solves a least-squares problem
Fit $b \approx x_1 + x_2t$ to the points $(t, b) = (1, 1), (2, 2), (3, 2)$. Then $\mathbf{A} = \begin{pmatrix} 1 & 1 \\ 1 & 2 \\ 1 & 3 \end{pmatrix}$, $\mathbf{b} = (1, 2, 2)^\mathsf{T}$. Start from $\mathbf{x} = \mathbf{0}$, where the residual is $-\mathbf{b}$: the gradient is $\nabla J = \mathbf{A}^\mathsf{T}(\mathbf{0} - \mathbf{b}) = -(1 + 2 + 2,\ 1 + 4 + 6)^\mathsf{T} = (-5, -11)^\mathsf{T}$, and the Hessian is

$$\mathbf{A}^\mathsf{T}\mathbf{A} = \begin{pmatrix} 3 & 6 \\ 6 & 14 \end{pmatrix},$$

with determinant $42 - 36 = 6 > 0$ and positive diagonal: positive definite, so a minimum exists and is unique. The Newton step is $\boldsymbol{\delta} = -(\mathbf{A}^\mathsf{T}\mathbf{A})^{-1}\nabla J = \tfrac{1}{6}\begin{pmatrix} 14 & -6 \\ -6 & 3 \end{pmatrix}\begin{pmatrix} 5 \\ 11 \end{pmatrix} = \tfrac{1}{6}(70 - 66,\ -30 + 33)^\mathsf{T} = (2/3,\ 1/2)^\mathsf{T}$. Because $J$ is exactly quadratic this is the minimiser: $\mathbf{x}^\star = (0.667, 0.5)^\mathsf{T}$, the line $b = 0.667 + 0.5t$. The residual $\mathbf{A}\mathbf{x}^\star - \mathbf{b} = (1/6, -1/3, 1/6)^\mathsf{T}$ satisfies $\mathbf{A}^\mathsf{T}\mathbf{r} = (1/6 - 1/3 + 1/6,\ 1/6 - 2/3 + 1/2)^\mathsf{T} = \mathbf{0}$: orthogonal to both columns, and the gradient there is zero as it must be. The minimum cost is $J = \tfrac{1}{2}(1/36 + 1/9 + 1/36) = 1/12$.
:::

## A dynamics Jacobian: the gravity gradient

The EKF's $\mathbf{F}$ is the Jacobian of the continuous dynamics $\dot{\mathbf{x}} = \mathbf{f}(\mathbf{x})$, and $\boldsymbol{\Phi} \approx e^{\mathbf{F}\Delta t}$ is then the state transition matrix of Lesson 2. For an orbit with state $\mathbf{x} = (\mathbf{r}, \mathbf{v})$ and two-body dynamics $\dot{\mathbf{r}} = \mathbf{v}$, $\dot{\mathbf{v}} = \mathbf{a}(\mathbf{r}) = -\mu\,\mathbf{r}/\|\mathbf{r}\|^3$, the $6\times 6$ Jacobian has the block form

$$\mathbf{F} = \begin{pmatrix} \mathbf{0} & \mathbf{I} \\ \mathbf{G} & \mathbf{0} \end{pmatrix}, \qquad \mathbf{G} = \frac{\partial\mathbf{a}}{\partial\mathbf{r}},$$

and everything interesting is in $\mathbf{G}$, the **gravity gradient**. Write $r = \|\mathbf{r}\|$ and $\mathbf{a} = -\mu r^{-3}\mathbf{r}$, a scalar function times a vector. The product rule for a Jacobian of $s(\mathbf{r})\mathbf{r}$ is $s\,\mathbf{I} + \mathbf{r}\,(\nabla s)^\mathsf{T}$, an identity plus an outer product. Here $s = -\mu r^{-3}$ and, by the chain rule through $\nabla r = \mathbf{r}/r$, $\nabla s = 3\mu r^{-4}\,\mathbf{r}/r = 3\mu r^{-5}\mathbf{r}$. So

$$\mathbf{G} = -\frac{\mu}{r^3}\mathbf{I} + \frac{3\mu}{r^5}\mathbf{r}\mathbf{r}^\mathsf{T} = -\frac{\mu}{r^3}\left(\mathbf{I} - 3\hat{\mathbf{r}}\hat{\mathbf{r}}^\mathsf{T}\right).$$

$\mathbf{G}$ is symmetric, as a Hessian should be — it is the Hessian of the gravitational potential — and its eigenvectors are obvious: $\hat{\mathbf{r}}$ with eigenvalue $-\mu r^{-3}(1 - 3) = 2\mu/r^3$, and any direction perpendicular to $\hat{\mathbf{r}}$ with eigenvalue $-\mu/r^3$. Trace zero, as Laplace's equation demands. Physically, a radial displacement is amplified (the tidal stretch) and a transverse one is pulled back, and the ratio is exactly two to one.

Put in numbers for a $400\,\mathrm{km}$ circular orbit, $r = 6778\,\mathrm{km}$, with $\mu = 3.986\times 10^{14}\,\mathrm{m^3/s^2}$: $\mu/r^3 = 3.986\times 10^{14}/(6.778\times 10^6)^3 = 1.280\times 10^{-6}\,\mathrm{s^{-2}}$. With $\hat{\mathbf{r}}$ along the $x$-axis,

$$\mathbf{G} = \operatorname{diag}(2.560\times 10^{-6},\ -1.280\times 10^{-6},\ -1.280\times 10^{-6})\,\mathrm{s^{-2}}.$$

The number $\sqrt{\mu/r^3} = 1.131\times 10^{-3}\,\mathrm{rad/s}$ is the orbital angular rate, and $2\pi$ over it is the $92.6$-minute period: the same quantity that sets the size of $\mathbf{G}$ sets how fast the orbit goes round, which is why an orbit-determination filter's position uncertainty grows on the orbital time scale. The units are worth a glance: $\mathbf{G}$ maps a position error in metres to an acceleration error in $\mathrm{m/s^2}$, so its entries carry $\mathrm{s^{-2}}$, and $\mathbf{F}\Delta t$ is dimensionless as an exponent must be.

## Checking a Jacobian numerically

Analytic Jacobians are where sign errors, dropped terms and wrong frames hide, and the filter will not tell you: it will quietly be a little inconsistent, or diverge a week later. The defence is mechanical. Column $j$ of $\mathbf{J}$ is the derivative of $\mathbf{f}$ along $\mathbf{e}_j$, so

$$\mathbf{J}\mathbf{e}_j \approx \frac{\mathbf{f}(\mathbf{x} + h\mathbf{e}_j) - \mathbf{f}(\mathbf{x} - h\mathbf{e}_j)}{2h},$$

the **central difference**, with truncation error of order $h^2$ against the forward difference's order $h$. The step is a balance: too large and the truncation error dominates, too small and the subtraction of nearly equal function values loses digits to round-off. For the range function at $\|\mathbf{x}\| = 111.8\,\mathrm{m}$, a central difference with $h = 0.01\,\mathrm{m}$ agrees with the analytic $0.8944$ to $7\times 10^{-10}$; at $h = 10^{-8}\,\mathrm{m}$ it is off by $3\times 10^{-7}$, worse, because $h$ is now comparable to the round-off in a number of size $100$. A step near $\varepsilon^{1/3}$ times the scale of $x$ — roughly $10^{-5}$ of the variable's magnitude — is a sound default for central differences. The numerical methods module introduces the complex-step method, which removes the round-off problem entirely.

```python
import numpy as np

def h_range(x, p):
    return np.linalg.norm(x - p)

def jac_numeric(f, x, h=1e-5):
    x = np.asarray(x, float)
    cols = []
    for j in range(x.size):
        e = np.zeros_like(x); e[j] = h * max(1.0, abs(x[j]))
        cols.append((f(x + e) - f(x - e)) / (2 * e[j]))
    return np.array(cols).T

x = np.array([100.0, 50.0]); p = np.zeros(2)
H_analytic = (x - p) / np.linalg.norm(x - p)
H_numeric = jac_numeric(lambda x: h_range(x, p), x)
print(H_analytic)                 # [0.89442719 0.4472136 ]
print(np.abs(H_numeric - H_analytic).max() < 1e-8)   # True
```

Run this test for every Jacobian in a filter, at several representative states, before the filter ever sees data. A disagreement of more than a few parts in $10^6$ is a bug in the analytic expression, and nine times out of ten it is a missing term from the product rule or a transpose.

::: warning Rows are outputs, columns are inputs
An $m\times n$ Jacobian has one row per output and one column per input, so $\mathbf{H}$ for $k$ measurements and $n$ states is $k\times n$, and $\mathbf{H}\mathbf{P}\mathbf{H}^\mathsf{T}$ is $k\times k$. If your code multiplies $\mathbf{H}^\mathsf{T}\mathbf{P}\mathbf{H}$ instead, the shapes may still agree when $k = n$, and the result is silently wrong. Fix the convention once — this course uses numerator layout, $J_{ij} = \partial f_i/\partial x_j$ — and write the shape of every matrix in a comment.
:::

::: warning Evaluate the Jacobian at the right point
$\mathbf{J}$ depends on $\mathbf{x}$. The EKF evaluates $\mathbf{H}$ at the *predicted* state $\hat{\mathbf{x}}^-$ and $\mathbf{F}$ along the reference trajectory, and a Jacobian evaluated at the wrong point — the previous estimate, or the truth in a simulation — gives a gain that does not match the innovation. Every entry of the range Jacobian above changes when the receiver moves, so it must be recomputed every update.
:::

## Check yourself

::: check
Find $\nabla f$ and $\nabla^2 f$ for $f(\mathbf{x}) = \mathbf{x}^\mathsf{T}\mathbf{A}\mathbf{x} + \mathbf{b}^\mathsf{T}\mathbf{x} + c$ with $\mathbf{A} = \begin{pmatrix} 3 & 1 \\ 1 & 2 \end{pmatrix}$, $\mathbf{b} = (-4, -2)^\mathsf{T}$, and locate and classify the stationary point.
:::

::: answer
$\mathbf{A}$ is symmetric, so $\nabla f = 2\mathbf{A}\mathbf{x} + \mathbf{b}$ and $\nabla^2 f = 2\mathbf{A} = \begin{pmatrix} 6 & 2 \\ 2 & 4 \end{pmatrix}$. Setting the gradient to zero, $2\mathbf{A}\mathbf{x} = -\mathbf{b} = (4, 2)^\mathsf{T}$, so $\mathbf{A}\mathbf{x} = (2, 1)^\mathsf{T}$; with $\mathbf{A}^{-1} = \tfrac{1}{5}\begin{pmatrix} 2 & -1 \\ -1 & 3 \end{pmatrix}$, $\mathbf{x}^\star = \tfrac{1}{5}(4 - 1, -2 + 3)^\mathsf{T} = (0.6, 0.2)^\mathsf{T}$. The Hessian has trace $10$ and determinant $20$, both positive, so it is positive definite and $\mathbf{x}^\star$ is a strict minimum.
:::

::: check
Write the Jacobian of the polar-to-Cartesian map $\mathbf{f}(r, \theta) = (r\cos\theta, r\sin\theta)^\mathsf{T}$, evaluate it at $r = 2$, $\theta = 30^\circ$, and interpret its determinant.
:::

::: answer
Rows are outputs $(x, y)$, columns are inputs $(r, \theta)$: $\mathbf{J} = \begin{pmatrix} \cos\theta & -r\sin\theta \\ \sin\theta & r\cos\theta \end{pmatrix}$. At $r = 2$, $\theta = 30^\circ$: $\mathbf{J} = \begin{pmatrix} 0.866 & -1 \\ 0.5 & 1.732 \end{pmatrix}$. Its determinant is $r\cos^2\theta + r\sin^2\theta = r = 2$: a small patch $dr\,d\theta$ of the parameter plane maps to an area $r\,dr\,d\theta$, the familiar polar area element. The first column is the unit radial direction, the second is $r$ times the unit tangential direction, which is why an angular error $\delta\theta$ produces a position error of $r\,\delta\theta$.
:::

::: check
A sensor measures the bearing $\beta = \operatorname{atan2}(y - p_y,\ x - p_x)$ to a beacon at $\mathbf{p}$. Derive the $1\times 2$ Jacobian and explain what happens to it as the range shrinks.
:::

::: answer
Let $\Delta x = x - p_x$, $\Delta y = y - p_y$, $\rho^2 = \Delta x^2 + \Delta y^2$. Differentiating $\arctan(\Delta y/\Delta x)$: $\partial\beta/\partial x = -\Delta y/\rho^2$ and $\partial\beta/\partial y = \Delta x/\rho^2$, so $\mathbf{H} = \tfrac{1}{\rho^2}(-\Delta y,\ \Delta x) = \tfrac{1}{\rho}(-\sin\beta,\ \cos\beta)$: the unit vector perpendicular to the line of sight, divided by the range. A position error across the line of sight changes the bearing; one along it does not. As $\rho \to 0$ the entries blow up like $1/\rho$ — a small position error produces a huge bearing change when you are almost on top of the beacon — and the linearisation the EKF relies on breaks down, which is why bearing-only filters are fragile at close range.
:::

::: check
$\mathbf{y} = \mathbf{f}(\mathbf{x})$ with Jacobian $\mathbf{J} = \begin{pmatrix} 1 & 2 \\ 0 & 1 \end{pmatrix}$ at the current estimate, and $\mathbf{P}_x = \operatorname{diag}(1, 4)$. Approximate $\mathbf{P}_y$ and say which assumption the approximation rests on.
:::

::: answer
$\mathbf{P}_y \approx \mathbf{J}\mathbf{P}_x\mathbf{J}^\mathsf{T}$. $\mathbf{J}\mathbf{P}_x = \begin{pmatrix} 1 & 8 \\ 0 & 4 \end{pmatrix}$, then times $\mathbf{J}^\mathsf{T} = \begin{pmatrix} 1 & 0 \\ 2 & 1 \end{pmatrix}$ gives $\mathbf{P}_y = \begin{pmatrix} 17 & 8 \\ 8 & 4 \end{pmatrix}$. The approximation replaces $\mathbf{f}$ by its first-order Taylor expansion over the region where the error is likely to lie, so it is accurate when the error is small enough that the curvature of $\mathbf{f}$ — its second derivatives — is negligible across a one-sigma ellipse. When that fails the EKF's covariance is biased, which is what the unscented filter's sigma points of Lesson 6 are designed to avoid.
:::

::: check
Why is the gravity gradient $\mathbf{G}$ symmetric, and what does its zero trace mean?
:::

::: answer
The two-body acceleration is minus the gradient of the scalar potential $U(\mathbf{r}) = -\mu/\|\mathbf{r}\|$, so $\mathbf{G} = \partial\mathbf{a}/\partial\mathbf{r}$ is minus the Hessian of $U$, and Hessians are symmetric because mixed partials commute. The trace of $\mathbf{G}$ is minus the Laplacian of $U$, which vanishes outside the attracting mass — Laplace's equation. In eigenvalue terms, $2\mu/r^3 - \mu/r^3 - \mu/r^3 = 0$: the radial stretching is exactly balanced by the two transverse compressions, and a small cloud of nearby test particles conserves its volume to first order as it falls.
:::

## Summary

| Item | Statement |
| --- | --- |
| Gradient | $\nabla f = (\partial f/\partial x_i)$, a column; $f(\mathbf{x} + \boldsymbol{\delta}) \approx f + \nabla f^\mathsf{T}\boldsymbol{\delta}$ |
| Linear form | $\nabla(\mathbf{b}^\mathsf{T}\mathbf{x}) = \mathbf{b}$ |
| Quadratic form | $\nabla(\mathbf{x}^\mathsf{T}\mathbf{A}\mathbf{x}) = (\mathbf{A} + \mathbf{A}^\mathsf{T})\mathbf{x}$, $= 2\mathbf{A}\mathbf{x}$ for symmetric $\mathbf{A}$ |
| Norms | $\nabla\lVert\mathbf{x}\rVert^2 = 2\mathbf{x}$, $\nabla\lVert\mathbf{x}\rVert = \mathbf{x}/\lVert\mathbf{x}\rVert$ |
| Composition | $\nabla_{\mathbf{x}}\,g(\mathbf{A}\mathbf{x} + \mathbf{c}) = \mathbf{A}^\mathsf{T}\nabla g$ |
| Hessian | $(\nabla^2 f)_{ij} = \partial^2 f/\partial x_i\partial x_j$, symmetric; PD at a strict minimum; Newton step $-(\nabla^2 f)^{-1}\nabla f$ |
| Jacobian | $J_{ij} = \partial f_i/\partial x_j$, $m\times n$, rows = outputs; $\mathbf{f}(\mathbf{x} + \boldsymbol{\delta}) \approx \mathbf{f} + \mathbf{J}\boldsymbol{\delta}$ |
| Chain rule | $\mathbf{J}_{g\circ f} = \mathbf{J}_g\mathbf{J}_f$, evaluated at $\mathbf{f}(\mathbf{x})$ |
| Covariance | $\mathbf{P}_y \approx \mathbf{J}\mathbf{P}_x\mathbf{J}^\mathsf{T}$ (EKF propagation) |
| Least squares | $\nabla\tfrac{1}{2}\lVert\mathbf{A}\mathbf{x} - \mathbf{b}\rVert^2 = \mathbf{A}^\mathsf{T}(\mathbf{A}\mathbf{x} - \mathbf{b})$; Hessian $\mathbf{A}^\mathsf{T}\mathbf{A}$; normal equations $\mathbf{A}^\mathsf{T}\mathbf{A}\mathbf{x} = \mathbf{A}^\mathsf{T}\mathbf{b}$ |
| Range Jacobian | $\mathbf{H} = (\mathbf{x} - \mathbf{p})^\mathsf{T}/\lVert\mathbf{x} - \mathbf{p}\rVert$, the unit line-of-sight row |
| Gravity gradient | $\mathbf{G} = -(\mu/r^3)(\mathbf{I} - 3\hat{\mathbf{r}}\hat{\mathbf{r}}^\mathsf{T})$, eigenvalues $2\mu/r^3$, $-\mu/r^3$, $-\mu/r^3$ |
| Numerical check | central difference $(\mathbf{f}(\mathbf{x} + h\mathbf{e}_j) - \mathbf{f}(\mathbf{x} - h\mathbf{e}_j))/2h$, $h \approx 10^{-5}$ of the variable's scale |

The next lesson takes the stacked measurement Jacobian $\mathbf{H}$ — rows of unit line-of-sight vectors — and asks what it does to a position error in every direction at once. The answer is the singular value decomposition, and its smallest singular value is the direction the beacons see worst.
