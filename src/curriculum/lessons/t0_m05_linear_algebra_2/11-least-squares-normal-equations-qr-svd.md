---
id: l11-least-squares-normal-equations-qr-svd
title: "Least squares: normal equations, QR and SVD"
minutes: 22
covers:
  - "least squares: normal equations vs QR vs SVD"
---

Almost every estimate a GNC engineer produces is a least-squares solution. A batch orbit determination fits six or twelve parameters to thousands of range and Doppler observations. A star tracker fits an attitude to a dozen star vectors. An IMU calibration fits scale factors and biases to a turntable run. A Kalman filter is a recursive least-squares solver with a prior bolted on. In each case the model is $\mathbf{A}\mathbf{x} \approx \mathbf{b}$ with more rows than unknowns, and the answer minimises $\lVert\mathbf{A}\mathbf{x} - \mathbf{b}\rVert$.

Lesson 7 derived the normal equations $\mathbf{A}^\mathsf{T}\mathbf{A}\mathbf{x} = \mathbf{A}^\mathsf{T}\mathbf{b}$ by setting a gradient to zero, and that is a correct and complete answer to the mathematical question. It is not the answer to the computational one. There are three standard ways to get $\mathbf{x}$ — solve the normal equations, factor $\mathbf{A} = \mathbf{Q}\mathbf{R}$, or take the SVD — and in exact arithmetic all three produce the identical vector. In floating point they do not, and the difference is governed by one quantity: whether the arithmetic ever sees $\kappa(\mathbf{A})$ or $\kappa(\mathbf{A})^2$.

This lesson works all three methods, derives why QR and the SVD avoid the squaring, gives the flop counts so you can weigh cost against accuracy, runs a controlled experiment on a polynomial fit where the three answers visibly diverge, covers weighting by measurement noise, and ends with a decision rule you can apply to a real problem.

## The problem, once more

Given $\mathbf{A}$ of size $m\times n$ with $m \ge n$ and a data vector $\mathbf{b}\in\mathbb{R}^m$, find

$$\mathbf{x}^\star = \arg\min_{\mathbf{x}}\ \tfrac{1}{2}\|\mathbf{A}\mathbf{x} - \mathbf{b}\|^2.$$

Lesson 7 gave the gradient $\nabla J = \mathbf{A}^\mathsf{T}(\mathbf{A}\mathbf{x} - \mathbf{b})$, so the minimiser satisfies

$$\mathbf{A}^\mathsf{T}\mathbf{A}\,\mathbf{x}^\star = \mathbf{A}^\mathsf{T}\mathbf{b},$$

the **normal equations**. The name comes from the geometry: $\mathbf{A}^\mathsf{T}\mathbf{r}^\star = \mathbf{0}$ says the optimal residual $\mathbf{r}^\star = \mathbf{A}\mathbf{x}^\star - \mathbf{b}$ is normal to every column of $\mathbf{A}$, so $\mathbf{A}\mathbf{x}^\star$ is the orthogonal projection of $\mathbf{b}$ onto the column space. If $\mathbf{A}$ has full column rank the Gram matrix $\mathbf{A}^\mathsf{T}\mathbf{A}$ is positive definite (Lesson 5), the solution is unique, and $\mathbf{x}^\star = \mathbf{A}^+\mathbf{b}$ in the notation of Lesson 9. Everything below computes the same $\mathbf{x}^\star$; the question is how much of it survives the arithmetic.

## Method 1: the normal equations

The direct route is three steps. Form $\mathbf{C} = \mathbf{A}^\mathsf{T}\mathbf{A}$ and $\mathbf{d} = \mathbf{A}^\mathsf{T}\mathbf{b}$; factor $\mathbf{C} = \mathbf{L}\mathbf{L}^\mathsf{T}$ by Cholesky (Lesson 6), which is the right factorisation because $\mathbf{C}$ is symmetric positive definite; then solve $\mathbf{L}\mathbf{y} = \mathbf{d}$ forwards and $\mathbf{L}^\mathsf{T}\mathbf{x} = \mathbf{y}$ backwards.

The cost is $mn^2$ flops to form $\mathbf{C}$, exploiting symmetry, plus $n^3/3$ for the Cholesky. For $m \gg n$ the first term dominates and the whole solve costs about $mn^2$.

Two things recommend it. It is the cheapest of the three, by a factor of two. And $\mathbf{C}$ is exactly the information matrix that estimation theory wants: $\mathbf{C}^{-1}$ is the covariance of $\mathbf{x}^\star$ under unit-variance noise, information from separate data batches adds as $\mathbf{C}_1 + \mathbf{C}_2$, and a sequential estimator can accumulate $\mathbf{C}$ and $\mathbf{d}$ observation by observation without storing $\mathbf{A}$ at all. That last property is why the normal equations survive in production: a bundle adjustment with a million observations cannot hold $\mathbf{A}$ in memory, but its sparse $\mathbf{C}$ fits easily.

One thing condemns it. By Lesson 10, $\kappa(\mathbf{A}^\mathsf{T}\mathbf{A}) = \kappa(\mathbf{A})^2$, and the damage is done in the *forming*, before any solver runs. Information about the small singular values is destroyed by round-off in the products: $\sigma_{\min}^2$ can vanish below the round-off level of $\sigma_{\max}^2$ even when $\sigma_{\min}$ is comfortably representable. The error in $\mathbf{x}$ is of order $\kappa(\mathbf{A})^2\varepsilon$.

::: warning Never compute an explicit inverse
$\mathbf{x} = (\mathbf{A}^\mathsf{T}\mathbf{A})^{-1}\mathbf{A}^\mathsf{T}\mathbf{b}$ is how the solution is *written*; it is not how it is computed. Forming the inverse costs about three times a Cholesky solve, is less accurate, and destroys any sparsity the matrix had. Write `cho_solve(cho_factor(C), d)`, or `np.linalg.solve(C, d)`, and reserve the inverse for the cases where you genuinely need every entry of the covariance matrix.
:::

## Method 2: QR

Any $m\times n$ matrix with $m \ge n$ can be written $\mathbf{A} = \mathbf{Q}\mathbf{R}$ with $\mathbf{Q}$ an $m\times m$ orthogonal matrix and $\mathbf{R}$ upper triangular. Split $\mathbf{Q} = [\mathbf{Q}_1\ \ \mathbf{Q}_2]$, with $\mathbf{Q}_1$ the first $n$ columns, and $\mathbf{R} = \begin{pmatrix}\mathbf{R}_1 \\ \mathbf{0}\end{pmatrix}$ with $\mathbf{R}_1$ an $n\times n$ upper triangular block. The **reduced** QR factorisation is $\mathbf{A} = \mathbf{Q}_1\mathbf{R}_1$, which is what `np.linalg.qr` returns by default.

The reason this solves least squares in one line is that an orthogonal matrix preserves length. Since $\lVert\mathbf{Q}^\mathsf{T}\mathbf{v}\rVert = \lVert\mathbf{v}\rVert$ for every $\mathbf{v}$,

$$\|\mathbf{A}\mathbf{x} - \mathbf{b}\|^2 = \|\mathbf{Q}^\mathsf{T}(\mathbf{A}\mathbf{x} - \mathbf{b})\|^2 = \left\|\begin{pmatrix}\mathbf{R}_1\mathbf{x} - \mathbf{Q}_1^\mathsf{T}\mathbf{b} \\ -\mathbf{Q}_2^\mathsf{T}\mathbf{b}\end{pmatrix}\right\|^2 = \|\mathbf{R}_1\mathbf{x} - \mathbf{Q}_1^\mathsf{T}\mathbf{b}\|^2 + \|\mathbf{Q}_2^\mathsf{T}\mathbf{b}\|^2.$$

The second term does not contain $\mathbf{x}$; it is the part of $\mathbf{b}$ outside the column space, and it is the minimum residual. The first term is driven to zero exactly, by back substitution on the triangular system.

::: key Least squares by QR
Factor $\mathbf{A} = \mathbf{Q}_1\mathbf{R}_1$ with $\mathbf{Q}_1^\mathsf{T}\mathbf{Q}_1 = \mathbf{I}$ and $\mathbf{R}_1$ upper triangular, then solve $\mathbf{R}_1\mathbf{x} = \mathbf{Q}_1^\mathsf{T}\mathbf{b}$ by back substitution. The minimum residual norm is $\lVert\mathbf{Q}_2^\mathsf{T}\mathbf{b}\rVert$, available without forming the residual. Because $\mathbf{Q}$ is orthogonal, $\kappa(\mathbf{R}_1) = \kappa(\mathbf{A})$: the conditioning is never squared.
:::

That last clause is the whole point, and it has a tidy proof. $\mathbf{A}^\mathsf{T}\mathbf{A} = \mathbf{R}_1^\mathsf{T}\mathbf{Q}_1^\mathsf{T}\mathbf{Q}_1\mathbf{R}_1 = \mathbf{R}_1^\mathsf{T}\mathbf{R}_1$. So $\mathbf{R}_1^\mathsf{T}$ *is* the Cholesky factor of the normal matrix, up to the sign of each row. QR therefore computes exactly what Method 1 computes — and computes it without ever forming the product whose formation loses the digits. Lesson 10's invariance $\kappa_2(\mathbf{Q}\mathbf{A}) = \kappa_2(\mathbf{A})$ is what makes that possible: orthogonal transformations rearrange a problem without making it harder.

How $\mathbf{Q}$ and $\mathbf{R}$ are computed matters. Classical Gram–Schmidt orthogonalises the columns one at a time and is easy to do by hand, but it loses orthogonality in $\mathbf{Q}$ as $\kappa$ grows. Production code uses **Householder reflections**: $n$ orthogonal reflections, each zeroing one column below the diagonal, applied to $\mathbf{A}$ and to $\mathbf{b}$ together. The result is backward stable — the computed answer is the exact solution of a problem within $O(\varepsilon)$ of yours — so the error in $\mathbf{x}$ is of order $\kappa(\mathbf{A})\varepsilon$, not $\kappa(\mathbf{A})^2\varepsilon$. Givens rotations do the same job one entry at a time and are preferred when rows arrive one by one, which is exactly the situation in a square-root information filter.

The cost is $2mn^2 - \tfrac{2}{3}n^3$ flops, about twice the normal equations for $m \gg n$.

::: example A radar range fit, three ways
A tracking radar returns three range measurements to a descending stage at $t = 0, 1, 2\,\mathrm{s}$: $1000.0$, $985.0$ and $971.0\,\mathrm{m}$. Fit a constant range rate, $\rho(t) = \rho_0 + \dot{\rho}\,t$, so

$$\mathbf{A} = \begin{pmatrix} 1 & 0 \\ 1 & 1 \\ 1 & 2 \end{pmatrix}, \qquad \mathbf{b} = \begin{pmatrix} 1000.0 \\ 985.0 \\ 971.0 \end{pmatrix}\mathrm{m}, \qquad \mathbf{x} = \begin{pmatrix}\rho_0 \\ \dot{\rho}\end{pmatrix}.$$

**Normal equations.** $\mathbf{A}^\mathsf{T}\mathbf{A} = \begin{pmatrix} 3 & 3 \\ 3 & 5 \end{pmatrix}$ and $\mathbf{A}^\mathsf{T}\mathbf{b} = (2956,\ 2927)^\mathsf{T}$. The determinant is $15 - 9 = 6$, so

$$\mathbf{x} = \frac{1}{6}\begin{pmatrix} 5 & -3 \\ -3 & 3 \end{pmatrix}\begin{pmatrix} 2956 \\ 2927 \end{pmatrix} = \frac{1}{6}\begin{pmatrix} 5999 \\ -87 \end{pmatrix} = \begin{pmatrix} 999.833\,\mathrm{m} \\ -14.500\,\mathrm{m/s} \end{pmatrix}.$$

**QR.** Orthogonalise the columns. The first is $(1,1,1)^\mathsf{T}$, so $\mathbf{q}_1 = (1,1,1)^\mathsf{T}/\sqrt{3}$ and $r_{11} = \sqrt{3}$. The second column $(0,1,2)^\mathsf{T}$ has $r_{12} = \mathbf{q}_1^\mathsf{T}(0,1,2)^\mathsf{T} = 3/\sqrt{3} = \sqrt{3}$, and subtracting leaves $(0,1,2)^\mathsf{T} - (1,1,1)^\mathsf{T} = (-1,0,1)^\mathsf{T}$, so $r_{22} = \sqrt{2}$ and $\mathbf{q}_2 = (-1,0,1)^\mathsf{T}/\sqrt{2}$. Then

$$\mathbf{R}_1 = \begin{pmatrix} 1.7321 & 1.7321 \\ 0 & 1.4142 \end{pmatrix}, \qquad \mathbf{Q}_1^\mathsf{T}\mathbf{b} = \begin{pmatrix} 2956/\sqrt{3} \\ -29/\sqrt{2} \end{pmatrix} = \begin{pmatrix} 1706.647 \\ -20.506 \end{pmatrix}.$$

Back substitution: $1.4142\,\dot{\rho} = -20.506$ gives $\dot{\rho} = -14.500\,\mathrm{m/s}$, then $1.7321\rho_0 + 1.7321(-14.5) = 1706.647$ gives $\rho_0 = 999.833\,\mathrm{m}$. The same answer, and $\mathbf{R}_1^\mathsf{T}\mathbf{R}_1 = \begin{pmatrix} 3 & 3 \\ 3 & 3 + 2 \end{pmatrix}$ is the $\mathbf{A}^\mathsf{T}\mathbf{A}$ above, confirming that $\mathbf{R}_1^\mathsf{T}$ is its Cholesky factor.

The residual comes free. The third orthonormal direction is $\mathbf{q}_3 = (1,-2,1)^\mathsf{T}/\sqrt{6}$, and $\mathbf{Q}_2^\mathsf{T}\mathbf{b} = (1000 - 1970 + 971)/\sqrt{6} = 1/\sqrt{6} = 0.4082$. So the fit misses the three ranges by $0.408\,\mathrm{m}$ in total, without computing $\mathbf{A}\mathbf{x} - \mathbf{b}$ at all. Checking directly, $\mathbf{A}\mathbf{x} = (999.833, 985.333, 970.833)^\mathsf{T}$ and the residual is $(-0.167, +0.333, -0.167)^\mathsf{T}\,\mathrm{m}$, of norm $0.408$.

**SVD.** $\mathbf{A}^\mathsf{T}\mathbf{A}$ has trace $8$ and determinant $6$, so its eigenvalues are $(8 \pm \sqrt{64 - 24})/2 = 7.1623$ and $0.8377$, and $\sigma_1 = 2.6762$, $\sigma_2 = 0.9153$. Then $\mathbf{x} = \mathbf{A}^+\mathbf{b}$ reproduces $(999.833, -14.500)^\mathsf{T}$ to fourteen digits.

Three methods, one answer, because $\kappa(\mathbf{A}) = 2.6762/0.9153 = 2.92$ and there is nothing at stake. The next example removes that comfort.
:::

## Method 3: the SVD

Take $\mathbf{A} = \mathbf{U}\boldsymbol{\Sigma}\mathbf{V}^\mathsf{T}$ and apply Lesson 9 directly:

$$\mathbf{x} = \mathbf{A}^+\mathbf{b} = \sum_{i \le r}\frac{\mathbf{u}_i^\mathsf{T}\mathbf{b}}{\sigma_i}\,\mathbf{v}_i, \qquad \text{residual norm} = \left(\sum_{i > r}(\mathbf{u}_i^\mathsf{T}\mathbf{b})^2\right)^{1/2}.$$

Like QR, the SVD is built from orthogonal transformations — Householder reflections to bidiagonal form, then an iterative sweep — and never forms $\mathbf{A}^\mathsf{T}\mathbf{A}$, so its error is also of order $\kappa(\mathbf{A})\varepsilon$. It costs more: about $2mn^2 + 11n^3$ flops, and the constant hidden in the iteration is larger than the flop count suggests.

What you buy for the extra cost is the rank. QR on a rank-deficient matrix produces an $\mathbf{R}_1$ with a zero on the diagonal and back substitution divides by it; the normal equations produce a singular $\mathbf{C}$ and Cholesky fails at a non-positive pivot. Only the SVD hands you the singular values themselves, lets you choose a truncation threshold, and returns the minimum-norm solution when the problem does not have a unique one. Column-pivoted QR is the middle ground — it reveals rank at modest extra cost and underlies LAPACK's `gelsy` — but the SVD is the one that tells you *how far* from rank deficient you are, which is the number an engineer actually wants.

::: example When only the SVD survives
Lesson 9's static alignment: estimating accelerometer bias $b_x$ and tilt $\theta_y$ from three identical readings, with $g = 9.80665\,\mathrm{m/s^2}$ and every row of $\mathbf{H}$ equal to $(1,\ g)$.

*Normal equations.* $\mathbf{H}^\mathsf{T}\mathbf{H} = \begin{pmatrix} 3 & 3g \\ 3g & 3g^2 \end{pmatrix} = \begin{pmatrix} 3 & 29.420 \\ 29.420 & 288.511 \end{pmatrix}$, with determinant $3(3g^2) - (3g)^2 = 0$. Cholesky starts $\ell_{11} = \sqrt{3} = 1.7321$, $\ell_{21} = 3g/\sqrt{3} = 16.9856$, and then needs $\ell_{22} = \sqrt{3g^2 - \ell_{21}^2} = \sqrt{0}$. In exact arithmetic it is zero; in float64 the subtraction returns $0$ or a value of order $10^{-14}$, either of which makes the next division meaningless. The factorisation fails, which is the correct behaviour — and the useful one, because a failed Cholesky is the standard positive-definiteness test of Lesson 6.

*QR.* $\mathbf{q}_1 = (1,1,1)^\mathsf{T}/\sqrt{3}$, $r_{11} = \sqrt{3}$, $r_{12} = 3g/\sqrt{3} = 16.9856$. Subtracting $r_{12}\mathbf{q}_1$ from the second column $(g,g,g)^\mathsf{T}$ leaves exactly zero, so $r_{22} = 0$ and back substitution divides by zero. Unpivoted QR fails too.

*SVD.* $\sigma_1 = \sqrt{3(1 + g^2)} = 17.074$ and $\sigma_2 = 0$, so the numerical rank is $1$, and the pseudoinverse returns the minimum-norm answer computed in Lesson 9: $b_x = 3.087\times 10^{-4}\,\mathrm{m/s^2}$ with $\theta_y = 3.028\times 10^{-3}\,\mathrm{rad}$. More importantly it returns $\sigma_2$, so the software can say *which* combination is unobservable — the direction $\mathbf{v}_2 = (-0.9948,\ 0.1014)^\mathsf{T}$ — instead of only that something went wrong.
:::

## The three methods measured

Here is the controlled experiment behind the rule. Fit a degree-$d$ polynomial in the monomial basis to $50$ points evenly spaced over $[-1, 1]$ — already well scaled, so the conditioning is intrinsic to the basis and not a units mistake. Build the data as $\mathbf{b} = \mathbf{A}\mathbf{c}$ with every coefficient $c_k = 1$, so the exact answer is known and every error below is pure round-off. Solve in float64 three ways and report $\lVert\mathbf{x} - \mathbf{c}\rVert/\lVert\mathbf{c}\rVert$.

::: example Normal equations, QR and SVD as the conditioning worsens

| Degree | $\kappa(\mathbf{A})$ | $\kappa\varepsilon$ | $\kappa^2\varepsilon$ | Normal equations | QR | SVD |
| --- | --- | --- | --- | --- | --- | --- |
| $9$ | $1.21\times 10^{3}$ | $2.7\times 10^{-13}$ | $3.2\times 10^{-10}$ | $1.6\times 10^{-12}$ | $3.4\times 10^{-14}$ | $1.2\times 10^{-13}$ |
| $15$ | $2.31\times 10^{5}$ | $5.1\times 10^{-11}$ | $1.2\times 10^{-5}$ | $4.4\times 10^{-8}$ | $6.9\times 10^{-12}$ | $6.1\times 10^{-11}$ |
| $20$ | $2.17\times 10^{7}$ | $4.8\times 10^{-9}$ | $1.0\times 10^{-1}$ | $5.2\times 10^{-3}$ | $3.3\times 10^{-10}$ | $1.1\times 10^{-8}$ |

Read the columns. QR and the SVD track $\kappa\varepsilon$ across four orders of magnitude of conditioning, never straying more than a factor of a few from it in either direction. The normal equations track $\kappa^2\varepsilon$, landing one to two orders of magnitude below that worst-case bound, which is typical: the bound is pessimistic, but its *slope* is right. At degree $9$ all three are fine. At degree $15$ — the top of the range the module's least-squares exercise sweeps — the normal equations have about $7$ correct digits and QR about $11$. At degree $20$ the normal equations have lost everything past the second digit, a relative error of half a percent, while QR still has nine and a half digits.

The residuals confirm it is not a tie. The QR fit misses the data by $7\times 10^{-15}$ at degree $20$; the normal-equations fit misses by $9\times 10^{-9}$, a million times worse. Least squares is supposed to minimise that number, and the normal equations did not.

One honest qualification: QR and the SVD cannot beat $\kappa\varepsilon$ either. At degree $25$ this matrix has $\kappa = 2.5\times 10^{9}$, so $\kappa\varepsilon = 5.5\times 10^{-7}$ and even QR is down to six digits, while $\kappa^2\varepsilon = 1.4\times 10^{3}$ leaves the normal equations with none. Conditioning is a property of the problem; a good algorithm refuses to make it worse, and nothing more.
:::

```python
import numpy as np

t = np.linspace(-1.0, 1.0, 50)
A = np.vander(t, 21, increasing=True)          # degree 20; cond(A) = 2.2e7
b = A @ np.ones(21)

x_ne = np.linalg.solve(A.T @ A, A.T @ b)       # normal equations
Q, R = np.linalg.qr(A)                         # reduced QR, R upper triangular
x_qr = np.linalg.solve(R, Q.T @ b)
x_svd = np.linalg.lstsq(A, b, rcond=None)[0]   # SVD, rank revealing

for name, x in (("normal", x_ne), ("QR", x_qr), ("SVD", x_svd)):
    print(f"{name:7s} {np.linalg.norm(x - 1.0) / np.sqrt(21):.2e}")
# normal  7.98e-03
# QR      5.26e-10
# SVD     1.87e-10
```

`np.linalg.lstsq` is the SVD route with truncation built in, and it is the right default when you do not know the problem well. Notice that `lstsq` also returns the rank and the singular values; read them.

## Weighting by the measurement noise

Plain least squares treats every row equally, which is wrong whenever the measurements have different noise. The estimator you actually want minimises the **weighted** cost

$$J(\mathbf{x}) = \tfrac{1}{2}(\mathbf{A}\mathbf{x} - \mathbf{b})^\mathsf{T}\mathbf{R}^{-1}(\mathbf{A}\mathbf{x} - \mathbf{b}),$$

with $\mathbf{R}$ the measurement noise covariance. Lesson 6 supplies the trick: $\mathbf{R}$ is symmetric positive definite, so it has a Cholesky factor $\mathbf{R} = \mathbf{L}\mathbf{L}^\mathsf{T}$, and substituting $\tilde{\mathbf{A}} = \mathbf{L}^{-1}\mathbf{A}$, $\tilde{\mathbf{b}} = \mathbf{L}^{-1}\mathbf{b}$ turns the weighted cost into $\tfrac{1}{2}\lVert\tilde{\mathbf{A}}\mathbf{x} - \tilde{\mathbf{b}}\rVert^2$, an ordinary least-squares problem. This is **whitening**: after it, every row has unit variance and is uncorrelated with every other. Do it first, then pick a method.

A one-line check. Two independent measurements of one constant, $b_1 = 10.0\,\mathrm{m}$ with $\sigma_1 = 0.5\,\mathrm{m}$ and $b_2 = 12.0\,\mathrm{m}$ with $\sigma_2 = 2.0\,\mathrm{m}$, so $\mathbf{A} = (1, 1)^\mathsf{T}$ and $\mathbf{L} = \operatorname{diag}(0.5, 2.0)$. Whitened, $\tilde{\mathbf{A}} = (2, 0.5)^\mathsf{T}$ and $\tilde{\mathbf{b}} = (20, 6)^\mathsf{T}$, giving $x = (2\cdot 20 + 0.5\cdot 6)/(4 + 0.25) = 43/4.25 = 10.118\,\mathrm{m}$, with variance $1/4.25 = 0.235\,\mathrm{m^2}$ and $\sigma = 0.485\,\mathrm{m}$. That is the inverse-variance weighted mean, as it must be. The unweighted answer would have been $11.0\,\mathrm{m}$, dragged almost a metre by the measurement that deserved a sixteenth of the weight.

::: note Where each method lives in real GNC software
The **normal equations** run wherever the matrix is huge and sparse or the data arrives incrementally: bundle adjustment, sequential batch filters, and the information form of a Kalman filter, all of which accumulate $\mathbf{A}^\mathsf{T}\mathbf{R}^{-1}\mathbf{A}$ directly. **QR** runs in square-root information filters, where the prior information array and the new whitened measurements are stacked and triangularised by Givens rotations each step; the filter never forms an information matrix, so its effective condition number is the square root of the covariance filter's. **SVD** runs offline and in problems where rank is the question: observability analysis, calibration with unexcited axes, and attitude determination, where Wahba's problem — find the rotation $\mathbf{M}$ minimising $\sum_i w_i\lVert\mathbf{b}_i - \mathbf{M}\mathbf{r}_i\rVert^2$ over measured and catalogue star vectors — is solved by taking the SVD of $\sum_i w_i\mathbf{b}_i\mathbf{r}_i^\mathsf{T}$.
:::

## Choosing

::: key The three methods at a glance
All three compute the same $\mathbf{x}^\star$ in exact arithmetic. Normal equations: $\approx mn^2$ flops, error $\sim\kappa(\mathbf{A})^2\varepsilon$, needs full column rank. QR: $\approx 2mn^2$ flops, error $\sim\kappa(\mathbf{A})\varepsilon$, needs full column rank, gives the residual norm free. SVD: $\approx 2mn^2 + 11n^3$ flops, error $\sim\kappa(\mathbf{A})\varepsilon$, handles any rank and reports how close to rank deficient you are. QR is the default; the SVD when rank is in doubt; the normal equations when sparsity or incremental accumulation forces your hand.
:::

Put numbers on the cost for a realistic batch: $m = 1000$ observations, $n = 12$ estimated parameters. The normal equations take about $1.45\times 10^{5}$ flops, QR about $2.87\times 10^{5}$, the SVD about $3.07\times 10^{5}$ — ratios of $1$, $1.98$ and $2.12$. On any modern processor all three finish in microseconds, and choosing the cheapest to save a factor of two is almost never the right trade. The calculus changes when $n$ is in the thousands and the matrix is sparse, because the $n^3$ terms and the fill-in start to matter; that is the world where the normal equations still win, and they win on memory, not on flops.

::: warning A small residual does not license the normal equations
The normal equations at degree $20$ above returned a coefficient vector wrong in the third digit while still fitting the data to nine decimal places on lower-degree problems, and Lesson 10's clock fit did the same. If what you hand downstream is the fitted *curve* — an ephemeris, a smoothed trajectory — the damage may be tolerable. If what you hand downstream is a *parameter* — a bias, a drag coefficient, a lever arm, a clock drift — the ill-conditioned directions are exactly what you are shipping, and the method matters. Decide which you are doing before you pick the algorithm.
:::

## Check yourself

::: check
$\mathbf{A}$ is $200\times 6$ with $\kappa(\mathbf{A}) = 4\times 10^{4}$. Estimate the relative error in $\mathbf{x}$ for each of the three methods in float64, and again on a float32 flight processor.
:::

::: answer
In float64, $\varepsilon = 2.2\times 10^{-16}$. QR and the SVD give about $\kappa\varepsilon = 4\times 10^{4}\times 2.2\times 10^{-16} = 8.8\times 10^{-12}$, so about eleven correct digits. The normal equations give about $\kappa^2\varepsilon = 1.6\times 10^{9}\times 2.2\times 10^{-16} = 3.5\times 10^{-7}$, about six digits. All three are usable for most purposes.

In float32, $\varepsilon = 1.2\times 10^{-7}$. QR and the SVD give about $4.8\times 10^{-3}$ — two digits, marginal. The normal equations give about $1.6\times 10^{9}\times 1.2\times 10^{-7} = 190$, a relative error far larger than one: the answer is meaningless. On a single-precision processor with this conditioning the normal equations are not an option, and even QR needs the problem rescaled first.
:::

::: check
Show that $\mathbf{R}_1^\mathsf{T}$ from the reduced QR factorisation is the Cholesky factor of $\mathbf{A}^\mathsf{T}\mathbf{A}$, and explain why computing it this way is better than computing it from $\mathbf{A}^\mathsf{T}\mathbf{A}$ itself.
:::

::: answer
$\mathbf{A}^\mathsf{T}\mathbf{A} = (\mathbf{Q}_1\mathbf{R}_1)^\mathsf{T}(\mathbf{Q}_1\mathbf{R}_1) = \mathbf{R}_1^\mathsf{T}\mathbf{Q}_1^\mathsf{T}\mathbf{Q}_1\mathbf{R}_1 = \mathbf{R}_1^\mathsf{T}\mathbf{R}_1$, since $\mathbf{Q}_1$ has orthonormal columns. With $\mathbf{L} = \mathbf{R}_1^\mathsf{T}$ lower triangular, that is $\mathbf{A}^\mathsf{T}\mathbf{A} = \mathbf{L}\mathbf{L}^\mathsf{T}$, the Cholesky factorisation, unique once the diagonal is taken positive. Computing it by QR is better because the arithmetic never touches a matrix of condition number $\kappa(\mathbf{A})^2$: $\kappa(\mathbf{R}_1) = \kappa(\mathbf{A})$, since $\mathbf{R}_1 = \mathbf{Q}_1^\mathsf{T}\mathbf{A}$ and an orthogonal factor leaves singular values alone. Forming $\mathbf{A}^\mathsf{T}\mathbf{A}$ first loses the information about the small singular values in the products, and no subsequent care recovers it.
:::

::: check
A batch fit has $\mathbf{A}$ of size $5000\times 8$. Why is QR barely more expensive than the normal equations here, and when would that stop being true?
:::

::: answer
With $m \gg n$ both costs are dominated by the term proportional to $mn^2$: the normal equations need $mn^2 + n^3/3 = 320{,}000 + 171 \approx 3.2\times 10^{5}$ flops and QR needs $2mn^2 - \tfrac{2}{3}n^3 = 640{,}000 - 341 \approx 6.4\times 10^{5}$. The $n^3$ terms are negligible at $n = 8$, so the ratio is almost exactly $2$, and doubling a microsecond costs nothing. It stops being true when $n$ grows towards $m$, where the cubic terms dominate and the constants diverge, and — more importantly in practice — when $\mathbf{A}$ is large and sparse. The normal equations can be accumulated row by row without ever storing $\mathbf{A}$, and a sparse $\mathbf{A}^\mathsf{T}\mathbf{A}$ often stays sparse, whereas $\mathbf{Q}$ fills in. That memory argument, not the flop count, is why bundle adjustment and large sparse estimators still use the normal equations.
:::

::: check
Your least-squares solver returns a warning that $\mathbf{R}_1$ has a diagonal entry of $3\times 10^{-13}$ while the largest is $4.1$. What has happened, and what are your options?
:::

::: answer
The diagonal of $\mathbf{R}_1$ is a rough proxy for the singular values, so a ratio of $4.1/3\times 10^{-13} \approx 1.4\times 10^{13}$ says the matrix is numerically rank deficient: one column is, to within round-off, a linear combination of the others. Two parameters in your model are not separable from this data. Options, in order. Check scaling first — a units mismatch can manufacture a tiny pivot out of a healthy problem. Then take the SVD to find out which combination is unobservable: the singular vector $\mathbf{v}_n$ names it, and you may be able to fix or remove one parameter. Then either truncate, using the rank-revealing pseudoinverse of Lesson 9 and reporting the dropped direction as an unestimated bias, or supply a prior that constrains it. What you must not do is back-substitute through that pivot: the resulting parameter vector is round-off multiplied by $10^{13}$.
:::

::: check
Two measurements of a single unknown: $b_1 = 100.0\,\mathrm{m}$ with $\sigma_1 = 1\,\mathrm{m}$ and $b_2 = 106.0\,\mathrm{m}$ with $\sigma_2 = 3\,\mathrm{m}$. Give the weighted least-squares estimate, its standard deviation, and the residual of each measurement.
:::

::: answer
Whiten by $\mathbf{L} = \operatorname{diag}(1, 3)$: $\tilde{\mathbf{A}} = (1,\ 1/3)^\mathsf{T}$ and $\tilde{\mathbf{b}} = (100,\ 106/3)^\mathsf{T}$. The normal equation is $(1 + 1/9)x = 100 + 106/9$, so $x = (100 + 11.778)/1.1111 = 111.778/1.1111 = 100.60\,\mathrm{m}$. The same number as the inverse-variance weighted mean, $(100/1 + 106/9)/(1/1 + 1/9)$. The variance is $1/(1/\sigma_1^2 + 1/\sigma_2^2) = 1/1.1111 = 0.900\,\mathrm{m^2}$, so $\sigma = 0.949\,\mathrm{m}$ — a little better than the good measurement alone, which is the point of combining them. The residuals are $100.60 - 100.0 = +0.60\,\mathrm{m}$, or $0.60\sigma_1$, and $100.60 - 106.0 = -5.40\,\mathrm{m}$, or $-1.80\sigma_2$. In sigma units the second measurement is three times further off, which is how you would spot it as a candidate outlier.
:::

## Summary

| Item | Statement |
| --- | --- |
| Problem | minimise $\lVert\mathbf{A}\mathbf{x} - \mathbf{b}\rVert$; optimal residual orthogonal to every column of $\mathbf{A}$ |
| Normal equations | $\mathbf{A}^\mathsf{T}\mathbf{A}\mathbf{x} = \mathbf{A}^\mathsf{T}\mathbf{b}$; solve by Cholesky, never by an explicit inverse |
| QR | $\mathbf{A} = \mathbf{Q}_1\mathbf{R}_1$; solve $\mathbf{R}_1\mathbf{x} = \mathbf{Q}_1^\mathsf{T}\mathbf{b}$ by back substitution; residual norm $= \lVert\mathbf{Q}_2^\mathsf{T}\mathbf{b}\rVert$ |
| QR identity | $\mathbf{A}^\mathsf{T}\mathbf{A} = \mathbf{R}_1^\mathsf{T}\mathbf{R}_1$, so $\mathbf{R}_1^\mathsf{T}$ is the Cholesky factor, obtained without forming the product |
| SVD | $\mathbf{x} = \mathbf{A}^+\mathbf{b} = \sum_{i\le r}(\mathbf{u}_i^\mathsf{T}\mathbf{b}/\sigma_i)\mathbf{v}_i$; rank revealing; minimum norm when rank deficient |
| Cost | normal $mn^2 + n^3/3$; QR $2mn^2 - \tfrac{2}{3}n^3$; SVD $\approx 2mn^2 + 11n^3$ |
| Accuracy | normal $\sim\kappa(\mathbf{A})^2\varepsilon$; QR and SVD $\sim\kappa(\mathbf{A})\varepsilon$ |
| Why | orthogonal factors preserve singular values, so $\kappa(\mathbf{R}_1) = \kappa(\mathbf{A})$; forming $\mathbf{A}^\mathsf{T}\mathbf{A}$ squares it |
| Rank deficient | Cholesky hits a non-positive pivot, QR hits a zero on the diagonal of $\mathbf{R}_1$, only the SVD returns an answer |
| Weighting | $\mathbf{R} = \mathbf{L}\mathbf{L}^\mathsf{T}$, then solve the ordinary problem with $\mathbf{L}^{-1}\mathbf{A}$ and $\mathbf{L}^{-1}\mathbf{b}$ |
| Default choice | QR; SVD when rank is in doubt; normal equations when sparsity or incremental accumulation demands it |
| NumPy | `np.linalg.lstsq` (SVD), `np.linalg.qr`, `np.linalg.solve(A.T @ A, A.T @ b)` |

That closes the module. Eigenvalues and the matrix exponential gave you the dynamics; the spectral theorem, positive definiteness and Cholesky gave you covariance; matrix calculus gave you the Jacobians; and the SVD, the pseudoinverse, the condition number and these three solvers gave you the estimate and an honest account of how much of it to believe. Every filter in the estimation modules that follow is assembled from these parts.
