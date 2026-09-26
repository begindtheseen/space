---
id: l07-matrix-calculus-gradients-jacobians
title: Matrix calculus, gradients and Jacobians
minutes: 24
covers:
  - matrix calculus: gradients and Jacobians
---

Look at a curved road on a map and zoom in far enough. Any short piece of it looks straight. That is the whole idea of this lesson. A curved function, looked at closely enough, behaves like a straight-line one, and straight-line functions are exactly what matrices handle.

Almost nothing a vehicle does is linear. The range to a beacon is a square root of a sum of squares. Gravity falls off as one over the distance squared. Attitude math multiplies quaternions together. Yet every estimator and controller you will write runs on linear algebra. The trick is that, at any one instant, a nonlinear function can be replaced by its best straight-line approximation, and the matrix of that approximation is the **Jacobian**. The **[[extended Kalman filter|ekf-story]]** (EKF) is the ordinary Kalman filter with two Jacobians swapped in for two matrices: $\mathbf{F} = \partial\mathbf{f}/\partial\mathbf{x}$ for the dynamics and $\mathbf{H} = \partial\mathbf{h}/\partial\mathbf{x}$ for the measurements. Getting those two right, and knowing how to check them, is most of the work of building one.

The other tool here is the **gradient** of a cost — a single number that scores how bad a guess is. Least squares, maximum likelihood, LQR control design, trajectory optimization: each one writes a cost as a function of a vector and asks where it is smallest. The answer always starts by setting the gradient to zero. The gradient of the quadratic form $\mathbf{x}^\mathsf{T}\mathbf{A}\mathbf{x}$ is the most used derivative in GNC, and it hides a trap: it equals $2\mathbf{A}\mathbf{x}$ only when $\mathbf{A}$ is symmetric.

The lesson ends with the habit that separates working filters from diverging ones: checking every Jacobian against a finite difference.

## The gradient of a scalar function

Stand on a hillside with a map. At your feet the ground slopes. One direction is steepest uphill, and how steep it is there is a single number. The gradient packs both facts — the direction and the steepness — into one arrow.

Now the precise version. Let $f: \mathbb{R}^n \to \mathbb{R}$, read "f maps n-dimensional vectors to real numbers": you feed it a vector $\mathbf{x}$ with $n$ entries and it returns one number. Its **gradient** is the column of its **[[partial derivatives|partial-derivative]]** — how fast $f$ changes when you nudge one entry and hold the others still:

$$\nabla f(\mathbf{x}) = \begin{pmatrix} \partial f/\partial x_1 \\ \vdots \\ \partial f/\partial x_n \end{pmatrix}.$$

Read $\nabla f$ as "grad f" (the symbol is called "nabla"), and $\partial f/\partial x_1$ as "partial f, partial x one".

What makes the gradient useful is this approximation for a small step $\boldsymbol{\delta}$ (read "delta"):

$$f(\mathbf{x} + \boldsymbol{\delta}) \approx f(\mathbf{x}) + \nabla f(\mathbf{x})^\mathsf{T}\boldsymbol{\delta}.$$

That is the first-order **Taylor expansion**. In words: the change in $f$ is the dot product of your step with the gradient. Three facts follow. The gradient points in the direction of steepest increase, because a dot product is biggest when the two arrows line up. Its length is the slope in that direction. And at the bottom of a valley, where no small step changes $f$ to first order, $\nabla f = \mathbf{0}$. Such a point is called **stationary**.

### Row or column?

Some books write the derivative of a number with respect to a column vector as a *row*, $\partial f/\partial\mathbf{x} = (\nabla f)^\mathsf{T}$, so the Taylor term reads $(\partial f/\partial\mathbf{x})\,\boldsymbol{\delta}$ with no transpose. Both habits are in use. This course writes the gradient as a column, which matches NumPy and every optimizer's interface, and saves $\partial\mathbf{f}/\partial\mathbf{x}$ for the Jacobian below.

When you copy a formula from *The Matrix Cookbook* or any other table, first check which **[[layout convention|layout-names]]** it uses. The two differ by a transpose. For a Jacobian that is not square, that is not a cosmetic difference.

### The identities that cover most cases

**Linear.** Let $f = \mathbf{b}^\mathsf{T}\mathbf{x} = \sum_i b_ix_i$ — a weighted sum. Nudging $x_k$ changes $f$ at the rate $b_k$, so $\partial f/\partial x_k = b_k$ and

$$\nabla(\mathbf{b}^\mathsf{T}\mathbf{x}) = \mathbf{b}.$$

**Quadratic form.** Let $f = \mathbf{x}^\mathsf{T}\mathbf{A}\mathbf{x} = \sum_i\sum_j a_{ij}x_ix_j$. Now differentiate with respect to one entry, $x_k$. It shows up in two groups of terms: those with $i = k$ and those with $j = k$. Each group gives one sum:

$$\frac{\partial f}{\partial x_k} = \sum_j a_{kj}x_j + \sum_i a_{ik}x_i.$$

The first sum is entry $k$ of $\mathbf{A}\mathbf{x}$. The second is entry $k$ of $\mathbf{A}^\mathsf{T}\mathbf{x}$, because $a_{ik}$ runs down column $k$ of $\mathbf{A}$, which is row $k$ of $\mathbf{A}^\mathsf{T}$. Stack all $k$ and you get

$$\nabla(\mathbf{x}^\mathsf{T}\mathbf{A}\mathbf{x}) = (\mathbf{A} + \mathbf{A}^\mathsf{T})\mathbf{x} = 2\mathbf{A}\mathbf{x} \ \text{ when } \mathbf{A}^\mathsf{T} = \mathbf{A}.$$

**Norms.** Put $\mathbf{A} = \mathbf{I}$ and the quadratic form becomes the squared length, so $\nabla\|\mathbf{x}\|^2 = 2\mathbf{x}$. For the length itself, $\|\mathbf{x}\| = (\mathbf{x}^\mathsf{T}\mathbf{x})^{1/2}$, the chain rule gives $\tfrac{1}{2}(\mathbf{x}^\mathsf{T}\mathbf{x})^{-1/2}\cdot 2\mathbf{x}$, which tidies to

$$\nabla\|\mathbf{x}\| = \frac{\mathbf{x}}{\|\mathbf{x}\|},$$

the unit vector along $\mathbf{x}$. It is undefined at the origin, where the length has a sharp point like the tip of a cone.

**Composition with a linear map.** If $f(\mathbf{x}) = g(\mathbf{A}\mathbf{x} + \mathbf{c})$, then $\nabla f = \mathbf{A}^\mathsf{T}\nabla g$, with $\nabla g$ evaluated at $\mathbf{A}\mathbf{x} + \mathbf{c}$. This is the chain rule. The transpose is forced by the shapes: $\nabla g$ lives in the output space, and $\mathbf{A}^\mathsf{T}$ carries it back to the input space.

::: key Gradients of the linear and quadratic forms
$\nabla(\mathbf{b}^\mathsf{T}\mathbf{x}) = \mathbf{b}$ and $\nabla(\mathbf{x}^\mathsf{T}\mathbf{A}\mathbf{x}) = (\mathbf{A} + \mathbf{A}^\mathsf{T})\mathbf{x}$, which is $2\mathbf{A}\mathbf{x}$ when $\mathbf{A}$ is symmetric. For $J(\mathbf{x}) = \tfrac{1}{2}\lVert\mathbf{A}\mathbf{x} - \mathbf{b}\rVert^2$, $\nabla J = \mathbf{A}^\mathsf{T}(\mathbf{A}\mathbf{x} - \mathbf{b})$ and the Hessian is $\mathbf{A}^\mathsf{T}\mathbf{A}$.
:::

::: example The quadratic-form gradient when the matrix is not symmetric
Take $\mathbf{A} = \begin{pmatrix} 1 & 2 \\ 0 & 3 \end{pmatrix}$ and $\mathbf{x} = (1, 1)^\mathsf{T}$. Multiplying out, $q(\mathbf{x}) = x_1^2 + 2x_1x_2 + 3x_2^2$, and at $(1, 1)$ that is $1 + 2 + 3 = 6$.

**The correct gradient.** First add $\mathbf{A}$ to its transpose, then multiply:

$$(\mathbf{A} + \mathbf{A}^\mathsf{T})\mathbf{x} = \begin{pmatrix} 2 & 2 \\ 2 & 6 \end{pmatrix}\begin{pmatrix} 1 \\ 1 \end{pmatrix} = \begin{pmatrix} 4 \\ 8 \end{pmatrix}.$$

The tempting shortcut $2\mathbf{A}\mathbf{x} = (6, 6)^\mathsf{T}$ is wrong.

**Check with numbers.** Nudge $x_1$ by $0.001$: $q(1.001, 1) = 1.002001 + 2.002 + 3 = 6.004001$. The change is $0.004001$, and dividing by the nudge gives $\partial q/\partial x_1 \approx 4.00$. Nudge $x_2$ instead: $q(1, 1.001) = 1 + 2.002 + 3.006003 = 6.008003$, so $\partial q/\partial x_2 \approx 8.00$. The finite differences agree with $(4, 8)$.

**Why they had to.** The form only sees the **[[symmetric part|symmetric-part]]** of the matrix, $\tfrac{1}{2}(\mathbf{A} + \mathbf{A}^\mathsf{T}) = \begin{pmatrix} 1 & 1 \\ 1 & 3 \end{pmatrix}$, and twice that times $\mathbf{x}$ is $(4, 8)^\mathsf{T}$. A cost written as $\mathbf{x}^\mathsf{T}\mathbf{Q}\mathbf{x}$ with a non-symmetric $\mathbf{Q}$ is a bug waiting to happen. Symmetrize $\mathbf{Q}$ before you differentiate.
:::

## The Hessian and the second-order picture

The gradient tells you the slope. To tell a valley from a hilltop you also need the curvature: is the ground bending up or down? That is what second derivatives measure.

The **[[Hessian|hesse-jacobi]]** $\mathbf{H}_f = \nabla^2 f$ (read "del squared f") is the $n\times n$ matrix of second partial derivatives, $(\nabla^2 f)_{ij} = \partial^2 f/\partial x_i\partial x_j$. For any smooth $f$ (twice continuously differentiable) the order of the two derivatives does not matter, so the Hessian is symmetric. Adding one more term to the Taylor expansion gives

$$f(\mathbf{x} + \boldsymbol{\delta}) \approx f(\mathbf{x}) + \nabla f^\mathsf{T}\boldsymbol{\delta} + \tfrac{1}{2}\boldsymbol{\delta}^\mathsf{T}\nabla^2 f\,\boldsymbol{\delta}.$$

At a stationary point the middle term is zero. So whether $f$ goes up or down when you step away depends on the sign of the quadratic form $\boldsymbol{\delta}^\mathsf{T}\nabla^2 f\,\boldsymbol{\delta}$. Lesson 5 gives the verdict. A positive definite Hessian means the cost rises in every direction: a strict local minimum, a bowl. Negative definite means a maximum, an upside-down bowl. Indefinite means a **saddle**, like a mountain pass: up in some directions, down in others.

::: note Why the Hessian at a minimum has to be PSD
Suppose $\mathbf{x}^\star$ is a local minimum, so $\nabla f = \mathbf{0}$ there. If some direction $\boldsymbol{\delta}$ had $\boldsymbol{\delta}^\mathsf{T}\nabla^2 f\,\boldsymbol{\delta} < 0$, then a small step $t\boldsymbol{\delta}$ would change $f$ by about $\tfrac{1}{2}t^2\,\boldsymbol{\delta}^\mathsf{T}\nabla^2 f\,\boldsymbol{\delta}$, which is negative. The cost would go *down*, and $\mathbf{x}^\star$ would not be a minimum. So no direction can have negative curvature: the Hessian at a minimum is positive semi-definite. This is the promised proof from Lesson 5.
:::

For the quadratic cost $f(\mathbf{x}) = \tfrac{1}{2}\mathbf{x}^\mathsf{T}\mathbf{A}\mathbf{x} - \mathbf{b}^\mathsf{T}\mathbf{x}$ with $\mathbf{A}$ symmetric, the identities give $\nabla f = \mathbf{A}\mathbf{x} - \mathbf{b}$ and $\nabla^2 f = \mathbf{A}$. Here the expansion is exact, not approximate. The stationary point solves $\mathbf{A}\mathbf{x} = \mathbf{b}$, and it is a minimum exactly when $\mathbf{A} \succ 0$ (read "A is positive definite").

**Newton's method** uses this for any smooth $f$. It replaces $f$ by its quadratic model and jumps straight to the model's bottom:

$$\boldsymbol{\delta} = -(\nabla^2 f)^{-1}\nabla f.$$

On a cost that really is quadratic, it lands exactly in one step. The right way to solve for that step is Cholesky (Lesson 6), because the Hessian is symmetric and, near a minimum, positive definite.

## The Jacobian of a vector function

Now let the function return several numbers at once: $\mathbf{f}: \mathbb{R}^n \to \mathbb{R}^m$, with outputs $f_1, \dots, f_m$. Think of a machine with $n$ knobs and $m$ dials. The Jacobian is the table that says how much each dial moves per small turn of each knob.

Its **Jacobian** is the $m\times n$ matrix

$$\mathbf{J} = \frac{\partial\mathbf{f}}{\partial\mathbf{x}}, \qquad J_{ij} = \frac{\partial f_i}{\partial x_j},$$

with one row per output and one column per input. Row $i$ is the gradient of $f_i$, laid on its side. The Taylor expansion becomes

$$\mathbf{f}(\mathbf{x} + \boldsymbol{\delta}) \approx \mathbf{f}(\mathbf{x}) + \mathbf{J}\boldsymbol{\delta}.$$

Near $\mathbf{x}$, the curved map acts like the matrix $\mathbf{J}$ acting on the small step. That is the zoomed-in [[straight piece of the curved road|tangent-picture]] from the start of the lesson.

::: key The Jacobian
For $\mathbf{f}: \mathbb{R}^n \to \mathbb{R}^m$, $J_{ij} = \partial f_i/\partial x_j$ is an $m\times n$ matrix — the best linear approximation of $\mathbf{f}$ at a point, $\mathbf{f}(\mathbf{x} + \boldsymbol{\delta}) \approx \mathbf{f}(\mathbf{x}) + \mathbf{J}\boldsymbol{\delta}$. The EKF calls it $\mathbf{H}$ for the measurement function and $\mathbf{F}$ for the dynamics, and propagates covariance through it as $\mathbf{J}\mathbf{P}\mathbf{J}^\mathsf{T}$.
:::

Three rules do most of the work.

- **A linear map is its own Jacobian.** If $\mathbf{f}(\mathbf{x}) = \mathbf{A}\mathbf{x}$, then $\mathbf{J} = \mathbf{A}$.
- **The chain rule is a matrix product.** For $\mathbf{h} = \mathbf{g}\circ\mathbf{f}$ (read "g after f": apply $\mathbf{f}$, then $\mathbf{g}$), $\mathbf{J}_h = \mathbf{J}_g\mathbf{J}_f$, with $\mathbf{J}_g$ evaluated at $\mathbf{f}(\mathbf{x})$. The shapes $(p\times m)(m\times n)$ only fit in that order.
- **The sandwich rule of Lesson 5 becomes covariance propagation.** If $\mathbf{x}$ has covariance $\mathbf{P}$ and $\mathbf{y} = \mathbf{f}(\mathbf{x})$, then to first order $\mathbf{y} - \bar{\mathbf{y}} \approx \mathbf{J}(\mathbf{x} - \bar{\mathbf{x}})$, and so $\mathbf{P}_y \approx \mathbf{J}\mathbf{P}\mathbf{J}^\mathsf{T}$.

Every $\boldsymbol{\Phi}\mathbf{P}\boldsymbol{\Phi}^\mathsf{T}$ and $\mathbf{H}\mathbf{P}\mathbf{H}^\mathsf{T}$ in a filter is that last rule, with a Jacobian as the bread of the sandwich.

::: example Range measurements: the Jacobian H and the predicted measurement covariance
**The Jacobian.** A receiver at unknown position $\mathbf{x} = (x, y)^\mathsf{T}$ in a flat plane measures its distance to a beacon at a known position $\mathbf{p}$:

$$h(\mathbf{x}) = \|\mathbf{x} - \mathbf{p}\|.$$

Use the norm identity with $\mathbf{u} = \mathbf{x} - \mathbf{p}$. The gradient is the unit vector from the beacon to the receiver, and the Jacobian — a $1\times 2$ row — is that vector laid on its side:

$$\mathbf{H} = \frac{\partial h}{\partial\mathbf{x}} = \frac{(\mathbf{x} - \mathbf{p})^\mathsf{T}}{\|\mathbf{x} - \mathbf{p}\|}.$$

Here is what it says. Moving the receiver a small step $\boldsymbol{\delta}$ changes the range by the part of $\boldsymbol{\delta}$ along the [[line of sight|line-of-sight]]. Sideways motion, across the line of sight, does not change it at all.

**Three beacons.** Put the receiver at $(100, 50)\,\mathrm{m}$ and beacons at $(0, 0)$, $(400, 0)$ and $(0, 300)\,\mathrm{m}$. The ranges are $\sqrt{100^2 + 50^2} = 111.80\,\mathrm{m}$, $\sqrt{300^2 + 50^2} = 304.14\,\mathrm{m}$ and $\sqrt{100^2 + 250^2} = 269.26\,\mathrm{m}$. Divide each offset by its range and stack the three rows:

$$\mathbf{H} = \begin{pmatrix} 0.8944 & 0.4472 \\ -0.9864 & 0.1644 \\ 0.3714 & -0.9285 \end{pmatrix}.$$

Each row is a unit vector. Check the first: $0.8944^2 + 0.4472^2 = 0.8 + 0.2 = 1$.

**The predicted covariance.** Say the position covariance is $\mathbf{P} = \begin{pmatrix} 4 & 1.5 \\ 1.5 & 2 \end{pmatrix}\,\mathrm{m^2}$, the one from Lesson 4. The covariance of the three predicted ranges, before sensor noise, is $\mathbf{H}\mathbf{P}\mathbf{H}^\mathsf{T}$. Its first diagonal entry is $\mathbf{h}_1^\mathsf{T}\mathbf{P}\mathbf{h}_1$, where $\mathbf{h}_1$ is the first row stood up as a column:

$$0.8944^2\times 4 + 2\times 0.8944\times 0.4472\times 1.5 + 0.4472^2\times 2 = 3.2 + 1.2 + 0.4 = 4.8\,\mathrm{m^2}.$$

So the range to the beacon at the origin is uncertain by $\sigma = \sqrt{4.8} = 2.19\,\mathrm{m}$. That is close to the most any range could be uncertain, $\sqrt{\lambda_{\max}} = \sqrt{4.803}$, because this line of sight points at $26.6^\circ$, within two degrees of the long axis of the error ellipse at $28.2^\circ$. The full matrix is

$$\mathbf{H}\mathbf{P}\mathbf{H}^\mathsf{T} = \begin{pmatrix} 4.800 & -3.823 & -0.498 \\ -3.823 & 3.459 & -0.305 \\ -0.498 & -0.305 & 1.241 \end{pmatrix}\,\mathrm{m^2}.$$

Add the sensor noise $\mathbf{R}$ and this is the innovation covariance $\mathbf{S}$ of Lesson 6. Sanity check on the strong negative entry $-3.823$ linking ranges 1 and 2: those two beacons sit on nearly opposite sides of the receiver, so a position error that lengthens one range shortens the other. The minus sign is real.
:::

## The gradient of the least-squares cost

The most important cost in this module scores a guess $\mathbf{x}$ by its squared misses. The **residual** $\mathbf{A}\mathbf{x} - \mathbf{b}$ is the list of misses — model minus data — and the cost is half the sum of their squares:

$$J(\mathbf{x}) = \tfrac{1}{2}\|\mathbf{A}\mathbf{x} - \mathbf{b}\|^2 = \tfrac{1}{2}(\mathbf{A}\mathbf{x} - \mathbf{b})^\mathsf{T}(\mathbf{A}\mathbf{x} - \mathbf{b}) = \tfrac{1}{2}\mathbf{x}^\mathsf{T}\mathbf{A}^\mathsf{T}\mathbf{A}\mathbf{x} - \mathbf{b}^\mathsf{T}\mathbf{A}\mathbf{x} + \tfrac{1}{2}\mathbf{b}^\mathsf{T}\mathbf{b}.$$

(The last step multiplies out the brackets; the two cross terms are equal numbers, so they combine into one.)

Now take the gradient one term at a time.

- The first term is a quadratic form with the symmetric matrix $\mathbf{A}^\mathsf{T}\mathbf{A}$, so with the $\tfrac{1}{2}$ its gradient is $\mathbf{A}^\mathsf{T}\mathbf{A}\mathbf{x}$.
- The second term is linear in $\mathbf{x}$: $\mathbf{b}^\mathsf{T}\mathbf{A}\mathbf{x} = (\mathbf{A}^\mathsf{T}\mathbf{b})^\mathsf{T}\mathbf{x}$, so its gradient is $\mathbf{A}^\mathsf{T}\mathbf{b}$.
- The third term does not contain $\mathbf{x}$, so its gradient is zero.

Therefore

$$\nabla J = \mathbf{A}^\mathsf{T}\mathbf{A}\mathbf{x} - \mathbf{A}^\mathsf{T}\mathbf{b} = \mathbf{A}^\mathsf{T}(\mathbf{A}\mathbf{x} - \mathbf{b}), \qquad \nabla^2 J = \mathbf{A}^\mathsf{T}\mathbf{A}.$$

The composition rule gives the same answer faster. Take $g(\mathbf{r}) = \tfrac{1}{2}\|\mathbf{r}\|^2$ with $\mathbf{r} = \mathbf{A}\mathbf{x} - \mathbf{b}$. Then $\nabla g = \mathbf{r}$, and $\nabla J = \mathbf{A}^\mathsf{T}\nabla g = \mathbf{A}^\mathsf{T}\mathbf{r}$.

Setting the gradient to zero gives

$$\mathbf{A}^\mathsf{T}\mathbf{A}\mathbf{x} = \mathbf{A}^\mathsf{T}\mathbf{b},$$

the **normal equations**. The Hessian $\mathbf{A}^\mathsf{T}\mathbf{A}$ is the Gram matrix of Lesson 5. It is always PSD, and PD when $\mathbf{A}$ has full column rank — then the stationary point is the one and only minimum.

The condition $\mathbf{A}^\mathsf{T}\mathbf{r} = \mathbf{0}$ has a picture. It says the best residual is **[[perpendicular to every column|orthogonal-residual]]** of $\mathbf{A}$. That is the projection picture from Linear Algebra I, found again from calculus. Lesson 11 is about how to *solve* these equations without paying for their conditioning.

::: example One Newton step solves a least-squares problem
Fit a straight line $b \approx x_1 + x_2t$ to three points $(t, b) = (1, 1), (2, 2), (3, 2)$. Each row of $\mathbf{A}$ is $(1, t)$:

$$\mathbf{A} = \begin{pmatrix} 1 & 1 \\ 1 & 2 \\ 1 & 3 \end{pmatrix}, \qquad \mathbf{b} = \begin{pmatrix} 1 \\ 2 \\ 2 \end{pmatrix}.$$

**Gradient at the start.** Begin at $\mathbf{x} = \mathbf{0}$. The residual there is $\mathbf{0} - \mathbf{b} = -\mathbf{b}$, so

$$\nabla J = \mathbf{A}^\mathsf{T}(-\mathbf{b}) = -\begin{pmatrix} 1 + 2 + 2 \\ 1 + 4 + 6 \end{pmatrix} = \begin{pmatrix} -5 \\ -11 \end{pmatrix}.$$

**Hessian.** Multiply out $\mathbf{A}^\mathsf{T}\mathbf{A}$:

$$\mathbf{A}^\mathsf{T}\mathbf{A} = \begin{pmatrix} 3 & 6 \\ 6 & 14 \end{pmatrix}.$$

Its determinant is $3\times 14 - 6\times 6 = 42 - 36 = 6 > 0$ and its diagonal is positive, so it is positive definite: a minimum exists and there is only one.

**The Newton step.** The inverse of a $2\times 2$ matrix swaps the diagonal, flips the signs off it and divides by the determinant:

$$\boldsymbol{\delta} = -(\mathbf{A}^\mathsf{T}\mathbf{A})^{-1}\nabla J = \tfrac{1}{6}\begin{pmatrix} 14 & -6 \\ -6 & 3 \end{pmatrix}\begin{pmatrix} 5 \\ 11 \end{pmatrix} = \tfrac{1}{6}\begin{pmatrix} 70 - 66 \\ -30 + 33 \end{pmatrix} = \begin{pmatrix} 2/3 \\ 1/2 \end{pmatrix}.$$

Because $J$ is exactly quadratic, this one step lands on the minimizer: $\mathbf{x}^\star = (0.667, 0.5)^\mathsf{T}$, the line $b = 0.667 + 0.5t$.

**Checks.** The residual is $\mathbf{A}\mathbf{x}^\star - \mathbf{b} = (1/6, -1/3, 1/6)^\mathsf{T}$. Multiply by $\mathbf{A}^\mathsf{T}$: $(1/6 - 1/3 + 1/6,\ 1/6 - 2/3 + 1/2)^\mathsf{T} = \mathbf{0}$. The residual is perpendicular to both columns, and the gradient is zero there, as it must be. The smallest cost is $J = \tfrac{1}{2}(1/36 + 1/9 + 1/36) = 1/12$. And the line passes between the points, above the first and third and below the second — a fair compromise, as a best fit should be.
:::

## A dynamics Jacobian: the gravity gradient

The EKF's $\mathbf{F}$ is the Jacobian of the dynamics $\dot{\mathbf{x}} = \mathbf{f}(\mathbf{x})$ (read "x dot", the rate of change of $\mathbf{x}$). Then $\boldsymbol{\Phi} \approx e^{\mathbf{F}\Delta t}$ is the state transition matrix of Lesson 2.

Take an orbit. The state is position and velocity, $\mathbf{x} = (\mathbf{r}, \mathbf{v})$. With only Earth's pull (the **two-body** model), the dynamics are

$$\dot{\mathbf{r}} = \mathbf{v}, \qquad \dot{\mathbf{v}} = \mathbf{a}(\mathbf{r}) = -\mu\,\frac{\mathbf{r}}{\|\mathbf{r}\|^3},$$

where $\mu$ ("mu") is Earth's gravitational parameter. The $6\times 6$ Jacobian splits into four $3\times 3$ blocks:

$$\mathbf{F} = \begin{pmatrix} \mathbf{0} & \mathbf{I} \\ \mathbf{G} & \mathbf{0} \end{pmatrix}, \qquad \mathbf{G} = \frac{\partial\mathbf{a}}{\partial\mathbf{r}}.$$

The top row says "position changes by velocity". Everything interesting sits in $\mathbf{G}$, the **gravity gradient**: how the pull of gravity changes when you move a little.

**Deriving it.** Write $r = \|\mathbf{r}\|$ and $\mathbf{a} = -\mu r^{-3}\mathbf{r}$: a number times a vector. The product rule for the Jacobian of $s(\mathbf{r})\,\mathbf{r}$ is

$$\frac{\partial}{\partial\mathbf{r}}\big(s\,\mathbf{r}\big) = s\,\mathbf{I} + \mathbf{r}\,(\nabla s)^\mathsf{T},$$

an identity part (from differentiating $\mathbf{r}$) plus an **outer product** (from differentiating $s$). Here $s = -\mu r^{-3}$. By the chain rule through $\nabla r = \mathbf{r}/r$,

$$\nabla s = 3\mu r^{-4}\,\frac{\mathbf{r}}{r} = 3\mu r^{-5}\,\mathbf{r}.$$

Put the two pieces together, and write $\hat{\mathbf{r}} = \mathbf{r}/r$ (read "r hat") for the unit vector pointing straight up:

$$\mathbf{G} = -\frac{\mu}{r^3}\mathbf{I} + \frac{3\mu}{r^5}\mathbf{r}\mathbf{r}^\mathsf{T} = -\frac{\mu}{r^3}\left(\mathbf{I} - 3\hat{\mathbf{r}}\hat{\mathbf{r}}^\mathsf{T}\right).$$

**Reading it.** $\mathbf{G}$ is symmetric, as a Hessian should be — it is minus the Hessian of the gravitational potential (energy per kilogram). Its eigenvectors are easy to spot. Along $\hat{\mathbf{r}}$, the bracket gives $1 - 3 = -2$, so the eigenvalue is $-\mu r^{-3}\cdot(-2) = 2\mu/r^3$. Along any direction perpendicular to $\hat{\mathbf{r}}$, the outer product gives zero, so the eigenvalue is $-\mu/r^3$. The three eigenvalues add to zero: the trace is zero, as **[[Laplace's equation|laplace-trace]]** demands. Physically, a small step up or down gets amplified — the **[[tidal stretch|tidal-stretch]]** — and a small step sideways gets pulled back. The ratio is exactly two to one.

**Numbers.** Take a $400\,\mathrm{km}$ circular orbit, so $r = 6378 + 400 = 6778\,\mathrm{km}$, with $\mu = 3.986\times 10^{14}\,\mathrm{m^3/s^2}$:

$$\frac{\mu}{r^3} = \frac{3.986\times 10^{14}}{(6.778\times 10^6)^3} = 1.280\times 10^{-6}\,\mathrm{s^{-2}}.$$

With $\hat{\mathbf{r}}$ along the $x$-axis,

$$\mathbf{G} = \operatorname{diag}(2.560\times 10^{-6},\ -1.280\times 10^{-6},\ -1.280\times 10^{-6})\,\mathrm{s^{-2}}.$$

The number $\sqrt{\mu/r^3} = 1.131\times 10^{-3}\,\mathrm{rad/s}$ is the orbit's angular rate, and $2\pi$ divided by it is $5554\,\mathrm{s}$, or $92.6$ minutes — about the period of the International Space Station, as a sanity check. The same number that sets the size of $\mathbf{G}$ sets how fast the orbit goes round. That is why an orbit filter's position uncertainty grows on the time scale of one orbit.

Check the units too. $\mathbf{G}$ turns a position error in meters into an acceleration error in $\mathrm{m/s^2}$, so its entries carry $\mathrm{s^{-2}}$. Then $\mathbf{F}\Delta t$ has no units, as the inside of an exponential must.

## Checking a Jacobian numerically

Hand-derived Jacobians are where sign errors, dropped terms and wrong frames hide. The filter will not tell you. It will quietly be a little off, or fall apart a week later. The defense is mechanical: compute the Jacobian a second, dumb way and compare.

Column $j$ of $\mathbf{J}$ is how $\mathbf{f}$ changes when you nudge input $j$ alone. So nudge it both ways by a small step $h$ and divide:

$$\mathbf{J}\mathbf{e}_j \approx \frac{\mathbf{f}(\mathbf{x} + h\mathbf{e}_j) - \mathbf{f}(\mathbf{x} - h\mathbf{e}_j)}{2h},$$

where $\mathbf{e}_j$ is the unit vector with a $1$ in slot $j$. This is the **central difference**. Its error shrinks like $h^2$, while the one-sided forward difference only shrinks like $h$.

The step size is a balance. Too large, and the curve's bending spoils the estimate (**truncation error**). Too small, and you subtract two nearly equal numbers and lose digits to **[[round-off|roundoff-step]]**. For the range function at $\|\mathbf{x}\| = 111.8\,\mathrm{m}$, a central difference with $h = 0.01\,\mathrm{m}$ agrees with the exact $0.8944$ to $7\times 10^{-10}$. At $h = 10^{-8}\,\mathrm{m}$ it is off by $2.6\times 10^{-7}$ — worse, because now $h$ is close to the round-off in a number of size $100$. A good default is $h$ near $\varepsilon^{1/3}$ times the size of the variable, where $\varepsilon \approx 2.2\times 10^{-16}$ is float64's precision; that is roughly $10^{-5}$ of the variable's size. The numerical methods module introduces the complex-step method, which removes the round-off problem entirely.

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

Run this test on every Jacobian in a filter, at several typical states, before it sees real data. A disagreement bigger than a few parts in $10^6$ is a bug in the hand-derived formula. Nine times out of ten it is a missing term from the product rule, or a transpose.

::: warning Rows are outputs, columns are inputs
An $m\times n$ Jacobian has one row per output and one column per input. So $\mathbf{H}$ for $k$ measurements and $n$ states is $k\times n$, and $\mathbf{H}\mathbf{P}\mathbf{H}^\mathsf{T}$ is $k\times k$. If your code computes $\mathbf{H}^\mathsf{T}\mathbf{P}\mathbf{H}$ instead, the shapes may still fit when $k = n$ — and the answer is silently wrong. Fix the convention once — this course uses numerator layout, $J_{ij} = \partial f_i/\partial x_j$ — and write the shape of every matrix in a comment.
:::

::: warning Evaluate the Jacobian at the right point
$\mathbf{J}$ depends on $\mathbf{x}$. The EKF evaluates $\mathbf{H}$ at the *predicted* state $\hat{\mathbf{x}}^-$ (read "x hat minus") and $\mathbf{F}$ along the reference trajectory. A Jacobian evaluated at the wrong point — the previous estimate, or the true state in a simulation — gives a gain that does not match the innovation. Every entry of the range Jacobian above changes when the receiver moves, so it must be recomputed at every update.
:::

## Check yourself

::: check
Find $\nabla f$ and $\nabla^2 f$ for $f(\mathbf{x}) = \mathbf{x}^\mathsf{T}\mathbf{A}\mathbf{x} + \mathbf{b}^\mathsf{T}\mathbf{x} + c$ with $\mathbf{A} = \begin{pmatrix} 3 & 1 \\ 1 & 2 \end{pmatrix}$ and $\mathbf{b} = (-4, -2)^\mathsf{T}$. Then find the stationary point and say what kind it is.
:::

::: answer
$\mathbf{A}$ is symmetric, so $\nabla f = 2\mathbf{A}\mathbf{x} + \mathbf{b}$ and $\nabla^2 f = 2\mathbf{A} = \begin{pmatrix} 6 & 2 \\ 2 & 4 \end{pmatrix}$. The constant $c$ drops out.

Set the gradient to zero: $2\mathbf{A}\mathbf{x} = -\mathbf{b} = (4, 2)^\mathsf{T}$, so $\mathbf{A}\mathbf{x} = (2, 1)^\mathsf{T}$. With $\mathbf{A}^{-1} = \tfrac{1}{5}\begin{pmatrix} 2 & -1 \\ -1 & 3 \end{pmatrix}$ (the determinant is $6 - 1 = 5$), $\mathbf{x}^\star = \tfrac{1}{5}(4 - 1,\ -2 + 3)^\mathsf{T} = (0.6, 0.2)^\mathsf{T}$.

The Hessian has trace $10$ and determinant $24 - 4 = 20$, both positive, so both eigenvalues are positive: it is positive definite, and $\mathbf{x}^\star$ is a strict minimum.
:::

::: check
Write the Jacobian of the polar-to-Cartesian map $\mathbf{f}(r, \theta) = (r\cos\theta, r\sin\theta)^\mathsf{T}$. Evaluate it at $r = 2$, $\theta = 30^\circ$, and explain what its determinant means.
:::

::: answer
Rows are the outputs $(x, y)$ and columns are the inputs $(r, \theta)$:

$$\mathbf{J} = \begin{pmatrix} \cos\theta & -r\sin\theta \\ \sin\theta & r\cos\theta \end{pmatrix}.$$

At $r = 2$, $\theta = 30^\circ$: $\mathbf{J} = \begin{pmatrix} 0.866 & -1 \\ 0.5 & 1.732 \end{pmatrix}$.

The determinant is $r\cos^2\theta + r\sin^2\theta = r = 2$. A small patch $dr\,d\theta$ of the $(r, \theta)$ plane maps to an area $r\,dr\,d\theta$ — the familiar polar area element. The first column is the unit radial direction. The second is $r$ times the unit direction around the circle, which is why an angle error $\delta\theta$ causes a position error of $r\,\delta\theta$.
:::

::: check
A sensor measures the bearing $\beta = \operatorname{atan2}(y - p_y,\ x - p_x)$ to a beacon at $\mathbf{p}$. Derive the $1\times 2$ Jacobian and explain what happens to it as the range shrinks.
:::

::: answer
Let $\Delta x = x - p_x$, $\Delta y = y - p_y$ and $\rho^2 = \Delta x^2 + \Delta y^2$ ($\rho$, "rho", is the range). Differentiating $\arctan(\Delta y/\Delta x)$ gives $\partial\beta/\partial x = -\Delta y/\rho^2$ and $\partial\beta/\partial y = \Delta x/\rho^2$. So

$$\mathbf{H} = \frac{1}{\rho^2}(-\Delta y,\ \Delta x) = \frac{1}{\rho}(-\sin\beta,\ \cos\beta).$$

That is the unit vector perpendicular to the line of sight, divided by the range. A position error across the line of sight changes the bearing; one along it does not — the opposite of the range Jacobian.

As $\rho \to 0$ the entries grow like $1/\rho$. When you are almost on top of the beacon, a tiny position error swings the bearing wildly. The straight-line approximation the EKF relies on breaks down, which is why bearing-only filters are fragile at close range.
:::

::: check
$\mathbf{y} = \mathbf{f}(\mathbf{x})$ has Jacobian $\mathbf{J} = \begin{pmatrix} 1 & 2 \\ 0 & 1 \end{pmatrix}$ at the current estimate, and $\mathbf{P}_x = \operatorname{diag}(1, 4)$. Approximate $\mathbf{P}_y$ and say which assumption the approximation rests on.
:::

::: answer
$\mathbf{P}_y \approx \mathbf{J}\mathbf{P}_x\mathbf{J}^\mathsf{T}$. First $\mathbf{J}\mathbf{P}_x = \begin{pmatrix} 1 & 8 \\ 0 & 4 \end{pmatrix}$. Then multiply by $\mathbf{J}^\mathsf{T} = \begin{pmatrix} 1 & 0 \\ 2 & 1 \end{pmatrix}$:

$$\mathbf{P}_y = \begin{pmatrix} 17 & 8 \\ 8 & 4 \end{pmatrix}.$$

It is symmetric, as a covariance must be. The approximation replaces $\mathbf{f}$ by its first-order Taylor expansion over the region where the error is likely to be. So it is accurate when the error is small enough that $\mathbf{f}$'s bending — its second derivatives — hardly matters across a one-sigma ellipse. When that fails, the EKF's covariance is biased. That is the problem the unscented filter's sigma points from Lesson 6 are designed to avoid.
:::

::: check
Why is the gravity gradient $\mathbf{G}$ symmetric, and what does its zero trace mean?
:::

::: answer
The two-body acceleration is minus the gradient of the potential $U(\mathbf{r}) = -\mu/\|\mathbf{r}\|$. So $\mathbf{G} = \partial\mathbf{a}/\partial\mathbf{r}$ is minus the Hessian of $U$, and Hessians are symmetric because the order of mixed partial derivatives does not matter.

The trace of $\mathbf{G}$ is minus the Laplacian of $U$, which is zero outside the attracting mass — Laplace's equation. In eigenvalues: $2\mu/r^3 - \mu/r^3 - \mu/r^3 = 0$. The stretch along the radius is exactly balanced by the two squeezes across it, so a small cloud of nearby test particles keeps its volume, to first order, as it falls.
:::

## Summary

| Item | Statement |
| --- | --- |
| Gradient | $\nabla f = (\partial f/\partial x_i)$, a column; $f(\mathbf{x} + \boldsymbol{\delta}) \approx f + \nabla f^\mathsf{T}\boldsymbol{\delta}$ |
| Linear form | $\nabla(\mathbf{b}^\mathsf{T}\mathbf{x}) = \mathbf{b}$ |
| Quadratic form | $\nabla(\mathbf{x}^\mathsf{T}\mathbf{A}\mathbf{x}) = (\mathbf{A} + \mathbf{A}^\mathsf{T})\mathbf{x}$, $= 2\mathbf{A}\mathbf{x}$ for symmetric $\mathbf{A}$ |
| Norms | $\nabla\lVert\mathbf{x}\rVert^2 = 2\mathbf{x}$, $\nabla\lVert\mathbf{x}\rVert = \mathbf{x}/\lVert\mathbf{x}\rVert$ |
| Composition | $\nabla_{\mathbf{x}}\,g(\mathbf{A}\mathbf{x} + \mathbf{c}) = \mathbf{A}^\mathsf{T}\nabla g$ |
| Hessian | $(\nabla^2 f)_{ij} = \partial^2 f/\partial x_i\partial x_j$, symmetric; PSD at a minimum, PD means a strict minimum; Newton step $-(\nabla^2 f)^{-1}\nabla f$ |
| Jacobian | $J_{ij} = \partial f_i/\partial x_j$, $m\times n$, rows = outputs; $\mathbf{f}(\mathbf{x} + \boldsymbol{\delta}) \approx \mathbf{f} + \mathbf{J}\boldsymbol{\delta}$ |
| Chain rule | $\mathbf{J}_{g\circ f} = \mathbf{J}_g\mathbf{J}_f$, with $\mathbf{J}_g$ evaluated at $\mathbf{f}(\mathbf{x})$ |
| Covariance | $\mathbf{P}_y \approx \mathbf{J}\mathbf{P}_x\mathbf{J}^\mathsf{T}$ (EKF propagation) |
| Least squares | $\nabla\tfrac{1}{2}\lVert\mathbf{A}\mathbf{x} - \mathbf{b}\rVert^2 = \mathbf{A}^\mathsf{T}(\mathbf{A}\mathbf{x} - \mathbf{b})$; Hessian $\mathbf{A}^\mathsf{T}\mathbf{A}$; normal equations $\mathbf{A}^\mathsf{T}\mathbf{A}\mathbf{x} = \mathbf{A}^\mathsf{T}\mathbf{b}$ |
| Range Jacobian | $\mathbf{H} = (\mathbf{x} - \mathbf{p})^\mathsf{T}/\lVert\mathbf{x} - \mathbf{p}\rVert$, the unit line-of-sight row |
| Gravity gradient | $\mathbf{G} = -(\mu/r^3)(\mathbf{I} - 3\hat{\mathbf{r}}\hat{\mathbf{r}}^\mathsf{T})$, eigenvalues $2\mu/r^3$, $-\mu/r^3$, $-\mu/r^3$ |
| Numerical check | central difference $(\mathbf{f}(\mathbf{x} + h\mathbf{e}_j) - \mathbf{f}(\mathbf{x} - h\mathbf{e}_j))/2h$, $h \approx 10^{-5}$ of the variable's size |

The next lesson takes the stacked measurement Jacobian $\mathbf{H}$ — rows of unit line-of-sight vectors — and asks what it does to a position error in every direction at once. The answer is the **[[singular value decomposition|svd-bridge]]**, and its smallest singular value points at the direction the beacons see worst.

::: context ekf-story A filter built for the Moon
The Kalman filter, published by Rudolf Kálmán in 1960, only handles linear systems. At NASA's Ames Research Center, Stanley Schmidt's group wanted it for navigating a spacecraft to the Moon and back, where the physics is anything but linear. Their fix was to relinearize — recompute the Jacobians — around the current best estimate at every step. That idea became the extended Kalman filter, and a version of it flew in the Apollo guidance computer. Sixty years later it is still the default navigation filter on most vehicles.
:::

::: context partial-derivative One knob at a time
A **partial derivative** is an ordinary derivative taken while you pretend every other variable is frozen. For $f = x_1^2 + 3x_1x_2$, holding $x_2$ fixed gives $\partial f/\partial x_1 = 2x_1 + 3x_2$; holding $x_1$ fixed gives $\partial f/\partial x_2 = 3x_1$. The curly $\partial$ is there to warn you that other variables exist and are being held still. People read it as "partial", or sometimes "del".
:::

::: context layout-names Numerator and denominator layout
The two conventions have names. **Numerator layout** gives the derivative one row per entry of the thing on top (the numerator), so $\partial\mathbf{f}/\partial\mathbf{x}$ is $m\times n$ — the Jacobian as this course writes it. **Denominator layout** gives one row per entry of the thing below, making the same object $n\times m$, its transpose. Statistics and machine-learning texts often use denominator layout; control and estimation texts mostly use numerator layout. Neither is wrong. Mixing them in one derivation is.
:::

::: context symmetric-part Why the skew part vanishes
Any square matrix splits into a symmetric part and a **skew** part: $\mathbf{A} = \tfrac{1}{2}(\mathbf{A} + \mathbf{A}^\mathsf{T}) + \tfrac{1}{2}(\mathbf{A} - \mathbf{A}^\mathsf{T})$. For the skew part $\mathbf{K}$, $\mathbf{K}^\mathsf{T} = -\mathbf{K}$. Now $\mathbf{x}^\mathsf{T}\mathbf{K}\mathbf{x}$ is a single number, so it equals its own transpose, $\mathbf{x}^\mathsf{T}\mathbf{K}^\mathsf{T}\mathbf{x} = -\mathbf{x}^\mathsf{T}\mathbf{K}\mathbf{x}$. A number equal to its own negative is zero. So the skew part adds nothing to the quadratic form, and only the symmetric part is left to differentiate.
:::

::: context hesse-jacobi Two German mathematicians
The Hessian is named for Ludwig Otto Hesse, and the Jacobian for Carl Gustav Jacob Jacobi — both nineteenth-century German mathematicians. Jacobi studied the determinants of these matrices of partial derivatives, which measure how a change of variables stretches area and volume; you will meet that use in the polar-coordinates check question. The matrix itself now carries his name as well.
:::

::: context tangent-picture The straight piece of a curve
Here is the range to a beacon at $(0, 0)$ as the receiver slides along the line $y = 50\,\mathrm{m}$. The blue curve is the true range. The red line is the linear approximation at $x = 100\,\mathrm{m}$, where the slope is $0.894$. Near the touch point the two are almost the same. Fifty meters away they differ by about $1.6\,\mathrm{m}$ on the right and $3.6\,\mathrm{m}$ on the left.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="180" x2="340" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="180" x2="50" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="50.0,148.0 61.7,147.4 73.3,145.5 85.0,142.7 96.7,139.0 108.3,134.7 120.0,130.0 131.7,124.9 143.3,119.6 155.0,114.1 166.7,108.4 178.3,102.7 190.0,96.8 201.7,90.9 213.3,84.9 225.0,78.8 236.7,72.7 248.3,66.6 260.0,60.4 271.7,54.3 283.3,48.1 295.0,41.8 306.7,35.6 318.3,29.4 330.0,23.1"/>
  <line x1="50" y1="165.7" x2="330" y2="28.3" stroke="#b4232c" stroke-width="2"/>
  <circle cx="166.7" cy="108.4" r="4" fill="#1f2a44"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="195">0</text><text x="166.7" y="195">100</text><text x="283.3" y="195">200</text><text x="310" y="207">x (m)</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="44" y="184">0</text><text x="44" y="120">100</text><text x="44" y="56">200</text>
  </g>
  <text x="58" y="24" font-size="11" fill="#1f2a44">range (m)</text>
  <text x="175" y="125" font-size="11" fill="#1f2a44">touch point</text>
  <text x="250" y="100" font-size="11" fill="#b4232c">linear model</text>
  <text x="200" y="68" font-size="11" fill="#1d6fd1">true range</text>
</svg>
```
:::

::: context line-of-sight The rows of H, drawn
The receiver (black) and the three beacons from the example, to scale. Each red arrow is one row of $\mathbf{H}$: a unit vector along a line of sight, pointing from that beacon toward the receiver. Moving the receiver along an arrow changes that range one-for-one. Moving it at right angles to an arrow leaves that range unchanged.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <g stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3">
    <line x1="90" y1="150" x2="40" y2="175"/>
    <line x1="90" y1="150" x2="240" y2="175"/>
    <line x1="90" y1="150" x2="40" y2="25"/>
  </g>
  <g stroke="#b4232c" stroke-width="2.5">
    <line x1="90" y1="150" x2="118.6" y2="135.7"/>
    <line x1="90" y1="150" x2="58.4" y2="144.7"/>
    <line x1="90" y1="150" x2="101.9" y2="179.7"/>
  </g>
  <g fill="#b4232c">
    <circle cx="118.6" cy="135.7" r="3"/><circle cx="58.4" cy="144.7" r="3"/><circle cx="101.9" cy="179.7" r="3"/>
  </g>
  <g fill="#1d6fd1">
    <rect x="35" y="170" width="10" height="10"/><rect x="235" y="170" width="10" height="10"/><rect x="35" y="20" width="10" height="10"/>
  </g>
  <circle cx="90" cy="150" r="5" fill="#1f2a44"/>
  <g font-size="11" fill="#1f2a44">
    <text x="50" y="33">beacon 3 (0, 300)</text>
    <text x="250" y="179">beacon 2 (400, 0)</text>
    <text x="14" y="196">beacon 1 (0, 0)</text>
    <text x="128" y="160">receiver (100, 50)</text>
    <text x="200" y="60">red: unit rows of H</text>
    <text x="200" y="76">dashed: lines of sight</text>
  </g>
</svg>
```
:::

::: context orthogonal-residual Perpendicular misses
Picture the columns of $\mathbf{A}$ as spanning a flat sheet, and the data $\mathbf{b}$ as a point floating above it. The closest point on the sheet is straight below $\mathbf{b}$, and the line dropping from $\mathbf{b}$ to it — the residual — meets the sheet at a right angle. "At a right angle to the sheet" means perpendicular to each column, and that is what $\mathbf{A}^\mathsf{T}\mathbf{r} = \mathbf{0}$ says, one column per row of $\mathbf{A}^\mathsf{T}$.
:::

::: context laplace-trace What Laplace's equation says here
Pierre-Simon Laplace showed that, in empty space, gravity's potential $U$ obeys $\partial^2 U/\partial x^2 + \partial^2 U/\partial y^2 + \partial^2 U/\partial z^2 = 0$. Those three second derivatives are the diagonal of the Hessian of $U$, so their sum is its trace. Since $\mathbf{G}$ is minus that Hessian, its trace is zero too. It is a free check on the algebra: if your gravity gradient's diagonal does not add to zero, something is wrong.
:::

::: context tidal-stretch Stretched along, squeezed across
Four small test masses float around a satellite. Relative to the satellite, the one farther from Earth and the one nearer to Earth both drift *away* — the nearer one is pulled harder, the farther one less. The two to the sides drift *inward*, because their paths toward Earth's center converge. The outward push is twice the inward one. Satellites with a long boom use this to stay pointed at Earth, a technique called gravity-gradient stabilization.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <circle cx="45" cy="100" r="40" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <text x="45" y="104" font-size="12" text-anchor="middle" fill="#1f2a44">Earth</text>
  <line x1="85" y1="100" x2="340" y2="100" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <rect x="224" y="94" width="12" height="12" fill="#1f2a44"/>
  <g fill="#1f2a44">
    <circle cx="270" cy="100" r="4"/><circle cx="190" cy="100" r="4"/><circle cx="230" cy="60" r="4"/><circle cx="230" cy="140" r="4"/>
  </g>
  <g stroke="#b4232c" stroke-width="2.5">
    <line x1="274" y1="100" x2="314" y2="100"/><line x1="186" y1="100" x2="146" y2="100"/>
    <line x1="230" y1="64" x2="230" y2="84"/><line x1="230" y1="136" x2="230" y2="116"/>
  </g>
  <g fill="#b4232c">
    <polygon points="314,100 306,96 306,104"/><polygon points="146,100 154,96 154,104"/>
    <polygon points="230,84 226,76 234,76"/><polygon points="230,116 226,124 234,124"/>
  </g>
  <text x="300" y="88" font-size="11" fill="#b4232c" text-anchor="middle">2 units out</text>
  <text x="160" y="88" font-size="11" fill="#b4232c" text-anchor="middle">2 units out</text>
  <text x="240" y="52" font-size="11" fill="#b4232c">1 unit in</text>
  <text x="240" y="160" font-size="11" fill="#b4232c">1 unit in</text>
  <text x="230" y="190" font-size="11" fill="#1f2a44" text-anchor="middle">satellite (square) and four test masses</text>
</svg>
```
:::

::: context roundoff-step Why a tiny step gets worse
A float64 number carries about $16$ significant digits. The range is about $111.8$, so its last digit sits near $10^{-14}$. With $h = 10^{-8}$, the two ranges you subtract differ by only about $2\times 10^{-8}$, and each carries round-off of about $10^{-14}$. Dividing that round-off by $2h$ gives an error of a few times $10^{-7}$ in the slope — about what the lesson measured. With $h = 0.01$ the round-off is divided by a much bigger number, and the curve's bending is still tiny.
:::

::: context svd-bridge Coming up: what H does to every direction
The range Jacobian turns a position error into range errors. Some directions of error make big changes in the ranges and are easy to spot; others make tiny changes and are nearly invisible. The singular value decomposition finds those directions and measures each one, and it is how GPS engineers judge whether a set of satellites is spread out well enough to fix a position.
:::
