---
id: l11-least-squares-normal-equations-qr-svd
title: "Least squares: normal equations, QR and SVD"
minutes: 24
covers:
  - "least squares: normal equations vs QR vs SVD"
---

Measure a table three times with a tape and you might read $1.52$, $1.54$ and $1.51\,\mathrm{m}$. No single number agrees with all three, so you take the average. Plot a dozen scattered dots and lay a ruler through them, and you place the ruler so it misses the dots as little as possible overall. Both times you are doing **[[least squares|least-squares-history]]**: choosing the answer that makes the sum of the squared misses as small as it can be.

Almost every estimate a GNC engineer produces is a least-squares answer. A batch orbit determination fits six or twelve numbers to thousands of range and Doppler measurements. A star tracker fits an attitude to a dozen star directions. An IMU calibration fits scale factors and biases to a turntable run. A Kalman filter is a least-squares solver that runs one step at a time. Each time the model is $\mathbf{A}\mathbf{x} \approx \mathbf{b}$, with more equations (rows) than unknowns, and the answer makes $\lVert\mathbf{A}\mathbf{x} - \mathbf{b}\rVert$ as small as possible.

There are three standard ways to compute that answer: solve the normal equations, factor $\mathbf{A} = \mathbf{Q}\mathbf{R}$, or take the SVD. With perfect arithmetic all three give the identical vector. On a computer they do not, and one question decides the difference: does the arithmetic ever see $\kappa(\mathbf{A})$, or $\kappa(\mathbf{A})^2$? This lesson works all three, shows why QR and the SVD avoid the squaring, and ends with a rule for choosing.

## The problem, once more

You are given a matrix $\mathbf{A}$ with $m$ rows and $n$ columns, $m \ge n$, and a data vector $\mathbf{b}$ with $m$ entries. Find

$$\mathbf{x}^\star = \arg\min_{\mathbf{x}}\ \tfrac{1}{2}\|\mathbf{A}\mathbf{x} - \mathbf{b}\|^2.$$

Read it as "x star is the x that makes half the squared length of $\mathbf{A}\mathbf{x} - \mathbf{b}$ smallest"; the half only tidies the derivative. Lesson 7 found the gradient of this cost, $\nabla J = \mathbf{A}^\mathsf{T}(\mathbf{A}\mathbf{x} - \mathbf{b})$. At the bottom of a bowl the slope is zero, so the best $\mathbf{x}$ satisfies

$$\mathbf{A}^\mathsf{T}\mathbf{A}\,\mathbf{x}^\star = \mathbf{A}^\mathsf{T}\mathbf{b},$$

the **[[normal equations|normal-word]]**. Call the leftover miss the **residual**, $\mathbf{r}^\star = \mathbf{A}\mathbf{x}^\star - \mathbf{b}$. The normal equations say $\mathbf{A}^\mathsf{T}\mathbf{r}^\star = \mathbf{0}$: the residual is perpendicular to every column of $\mathbf{A}$. So $\mathbf{A}\mathbf{x}^\star$ is the shadow of $\mathbf{b}$ dropped straight onto the set of all possible $\mathbf{A}\mathbf{x}$ — the **[[orthogonal projection|projection-picture]]** of $\mathbf{b}$ onto the column space.

If $\mathbf{A}$ has full column rank, the Gram matrix $\mathbf{A}^\mathsf{T}\mathbf{A}$ is positive definite (Lesson 5), the answer is unique, and it equals $\mathbf{A}^+\mathbf{b}$ from Lesson 9. Everything below computes the same $\mathbf{x}^\star$. The question is how much of it survives the arithmetic.

## Method 1: the normal equations

The direct route has three steps.

1. Form $\mathbf{C} = \mathbf{A}^\mathsf{T}\mathbf{A}$ (an $n\times n$ matrix) and $\mathbf{d} = \mathbf{A}^\mathsf{T}\mathbf{b}$.
2. Factor $\mathbf{C} = \mathbf{L}\mathbf{L}^\mathsf{T}$ by Cholesky (Lesson 6). That is the right tool because $\mathbf{C}$ is symmetric positive definite.
3. Solve $\mathbf{L}\mathbf{y} = \mathbf{d}$ from the top down, then $\mathbf{L}^\mathsf{T}\mathbf{x} = \mathbf{y}$ from the bottom up.

The cost is about $mn^2$ **[[flops|flops]]** to form $\mathbf{C}$ (using its symmetry), plus $n^3/3$ for the Cholesky. When $m$ is much bigger than $n$, the first term dominates, and the whole solve costs about $mn^2$.

Two things recommend it. It is the cheapest, by about a factor of two. And $\mathbf{C}$ is the information matrix estimation theory wants anyway. $\mathbf{C}^{-1}$ is the covariance of $\mathbf{x}^\star$ when the noise has unit variance. Information from separate batches of data adds, $\mathbf{C}_1 + \mathbf{C}_2$. And an estimator can build up $\mathbf{C}$ and $\mathbf{d}$ one measurement at a time without ever storing $\mathbf{A}$. That last property keeps the normal equations alive in production: a **[[bundle adjustment|bundle-adjustment]]** with a million observations cannot hold $\mathbf{A}$ in memory, but its sparse $\mathbf{C}$ fits easily.

One thing condemns it. By Lesson 10, $\kappa(\mathbf{A}^\mathsf{T}\mathbf{A}) = \kappa(\mathbf{A})^2$, and the damage happens in the *forming*, before any solver runs. Small singular values get lost in the round-off of the products: $\sigma_{\min}^2$ can sink below the rounding level of $\sigma_{\max}^2$ even when $\sigma_{\min}$ itself is stored perfectly well. The error in $\mathbf{x}$ is about $\kappa(\mathbf{A})^2\varepsilon$, where $\varepsilon = 2.2\times 10^{-16}$ is float64's precision.

::: warning Never compute an explicit inverse
$\mathbf{x} = (\mathbf{A}^\mathsf{T}\mathbf{A})^{-1}\mathbf{A}^\mathsf{T}\mathbf{b}$ is how the answer is *written* — even in this module's exercise — not how it should be computed. Forming the inverse takes about three times the work of the Cholesky factorization, is less accurate, and destroys any sparsity the matrix had. Write `cho_solve(cho_factor(C), d)` or `np.linalg.solve(C, d)`, and form the inverse only when you truly need every entry of the covariance matrix.
:::

## Method 2: QR

Turn a map until the road you care about runs straight up the page, and distances along it become easy to read — yet turning changed no distances. QR does that to a least-squares problem.

Any $m\times n$ matrix with $m \ge n$ can be written $\mathbf{A} = \mathbf{Q}\mathbf{R}$, with $\mathbf{Q}$ an $m\times m$ orthogonal matrix (a rotation or reflection) and $\mathbf{R}$ **upper triangular** (zeros below the diagonal). Split $\mathbf{Q} = [\mathbf{Q}_1\ \ \mathbf{Q}_2]$, with $\mathbf{Q}_1$ its first $n$ columns. Split $\mathbf{R} = \begin{pmatrix}\mathbf{R}_1 \\ \mathbf{0}\end{pmatrix}$, with $\mathbf{R}_1$ an $n\times n$ upper triangular block. The **reduced** QR factorization is $\mathbf{A} = \mathbf{Q}_1\mathbf{R}_1$, which is what `np.linalg.qr` returns by default.

An orthogonal matrix keeps lengths: $\lVert\mathbf{Q}^\mathsf{T}\mathbf{v}\rVert = \lVert\mathbf{v}\rVert$ for every $\mathbf{v}$. So you may turn the residual by $\mathbf{Q}^\mathsf{T}$ without changing its length. Using $\mathbf{Q}^\mathsf{T}\mathbf{A} = \mathbf{R}$ and splitting into the top $n$ rows and the rest,

$$\|\mathbf{A}\mathbf{x} - \mathbf{b}\|^2 = \|\mathbf{Q}^\mathsf{T}(\mathbf{A}\mathbf{x} - \mathbf{b})\|^2 = \left\|\begin{pmatrix}\mathbf{R}_1\mathbf{x} - \mathbf{Q}_1^\mathsf{T}\mathbf{b} \\ -\mathbf{Q}_2^\mathsf{T}\mathbf{b}\end{pmatrix}\right\|^2 = \|\mathbf{R}_1\mathbf{x} - \mathbf{Q}_1^\mathsf{T}\mathbf{b}\|^2 + \|\mathbf{Q}_2^\mathsf{T}\mathbf{b}\|^2.$$

The second term has no $\mathbf{x}$ in it. It is the part of $\mathbf{b}$ outside the column space, which no choice of $\mathbf{x}$ can reach: the minimum residual. The first term can be made exactly zero by **back substitution** — solving the triangular system from the last row up, one unknown at a time.

::: key Least squares by QR
Factor $\mathbf{A} = \mathbf{Q}_1\mathbf{R}_1$ with $\mathbf{Q}_1^\mathsf{T}\mathbf{Q}_1 = \mathbf{I}$ and $\mathbf{R}_1$ upper triangular, then solve $\mathbf{R}_1\mathbf{x} = \mathbf{Q}_1^\mathsf{T}\mathbf{b}$ by back substitution. The minimum residual norm is $\lVert\mathbf{Q}_2^\mathsf{T}\mathbf{b}\rVert$, available without forming the residual. Because $\mathbf{Q}$ is orthogonal, $\kappa(\mathbf{R}_1) = \kappa(\mathbf{A})$: the conditioning is never squared.
:::

That last sentence is the whole point, and it has a tidy proof: $\mathbf{A}^\mathsf{T}\mathbf{A} = \mathbf{R}_1^\mathsf{T}\mathbf{Q}_1^\mathsf{T}\mathbf{Q}_1\mathbf{R}_1 = \mathbf{R}_1^\mathsf{T}\mathbf{R}_1$. So $\mathbf{R}_1^\mathsf{T}$ *is* the Cholesky factor of the normal matrix, up to the sign of each row. QR computes exactly what Method 1 computes — without ever forming the product that loses the digits. Lesson 10's rule $\kappa_2(\mathbf{Q}\mathbf{A}) = \kappa_2(\mathbf{A})$ is what makes that possible.

How $\mathbf{Q}$ and $\mathbf{R}$ are computed matters. **Classical Gram–Schmidt** straightens the columns one at a time. It is easy by hand, but $\mathbf{Q}$ [[slowly stops being orthogonal|gram-schmidt-drift]] as $\kappa$ grows. Library code uses **[[Householder reflections|householder]]**: $n$ mirror reflections, each clearing one column below the diagonal, applied to $\mathbf{A}$ and $\mathbf{b}$ together. The result is backward stable, so the error in $\mathbf{x}$ is about $\kappa(\mathbf{A})\varepsilon$, not $\kappa(\mathbf{A})^2\varepsilon$. **[[Givens rotations|givens]]** do the same job one entry at a time. They are preferred when rows arrive one by one, which is the situation inside a square-root information filter.

The cost is $2mn^2 - \tfrac{2}{3}n^3$ flops, about twice the normal equations when $m \gg n$.

::: example A radar range fit, three ways
A tracking radar returns three ranges to a descending stage at $t = 0, 1, 2\,\mathrm{s}$: $1000.0$, $985.0$ and $971.0\,\mathrm{m}$. Fit a constant range rate, $\rho(t) = \rho_0 + \dot{\rho}\,t$ ("rho nought plus rho-dot times t"):

$$\mathbf{A} = \begin{pmatrix} 1 & 0 \\ 1 & 1 \\ 1 & 2 \end{pmatrix}, \qquad \mathbf{b} = \begin{pmatrix} 1000.0 \\ 985.0 \\ 971.0 \end{pmatrix}\mathrm{m}, \qquad \mathbf{x} = \begin{pmatrix}\rho_0 \\ \dot{\rho}\end{pmatrix}.$$

**Normal equations.** Dot the columns with each other and with $\mathbf{b}$: $\mathbf{A}^\mathsf{T}\mathbf{A} = \begin{pmatrix} 3 & 3 \\ 3 & 5 \end{pmatrix}$ and $\mathbf{A}^\mathsf{T}\mathbf{b} = (2956,\ 2927)^\mathsf{T}$. The determinant is $3\cdot 5 - 3\cdot 3 = 6$. For a $2\times 2$ system (small enough that the inverse is harmless) swap the diagonal, negate the off-diagonal and divide by $6$:

$$\mathbf{x} = \frac{1}{6}\begin{pmatrix} 5 & -3 \\ -3 & 3 \end{pmatrix}\begin{pmatrix} 2956 \\ 2927 \end{pmatrix} = \frac{1}{6}\begin{pmatrix} 5999 \\ -87 \end{pmatrix} = \begin{pmatrix} 999.833\,\mathrm{m} \\ -14.500\,\mathrm{m/s} \end{pmatrix}.$$

**QR.** Straighten the columns by Gram–Schmidt. The first is $(1,1,1)^\mathsf{T}$, of length $\sqrt{3}$, so $\mathbf{q}_1 = (1,1,1)^\mathsf{T}/\sqrt{3}$ and $r_{11} = \sqrt{3}$. The second column $(0,1,2)^\mathsf{T}$ has component $r_{12} = \mathbf{q}_1^\mathsf{T}(0,1,2)^\mathsf{T} = 3/\sqrt{3} = \sqrt{3}$ along $\mathbf{q}_1$. Remove that component: $(0,1,2)^\mathsf{T} - \sqrt{3}\,\mathbf{q}_1 = (-1,0,1)^\mathsf{T}$. Its length is $r_{22} = \sqrt{2}$, so $\mathbf{q}_2 = (-1,0,1)^\mathsf{T}/\sqrt{2}$. Then

$$\mathbf{R}_1 = \begin{pmatrix} 1.7321 & 1.7321 \\ 0 & 1.4142 \end{pmatrix}, \qquad \mathbf{Q}_1^\mathsf{T}\mathbf{b} = \begin{pmatrix} 2956/\sqrt{3} \\ -29/\sqrt{2} \end{pmatrix} = \begin{pmatrix} 1706.647 \\ -20.506 \end{pmatrix}.$$

Back substitution starts at the bottom row: $1.4142\,\dot{\rho} = -20.506$ gives $\dot{\rho} = -14.500\,\mathrm{m/s}$. The top row, $1.7321\rho_0 + 1.7321(-14.5) = 1706.647$, then gives $\rho_0 = 999.833\,\mathrm{m}$. The same answer. And $\mathbf{R}_1^\mathsf{T}\mathbf{R}_1 = \begin{pmatrix} 3 & 3 \\ 3 & 3 + 2 \end{pmatrix}$ is the $\mathbf{A}^\mathsf{T}\mathbf{A}$ above, confirming that $\mathbf{R}_1^\mathsf{T}$ is its Cholesky factor.

The residual comes free. The third direction perpendicular to both columns is $\mathbf{q}_3 = (1,-2,1)^\mathsf{T}/\sqrt{6}$, and $\mathbf{Q}_2^\mathsf{T}\mathbf{b} = (1000 - 1970 + 971)/\sqrt{6} = 1/\sqrt{6} = 0.408$. So the fit misses the three ranges by $0.408\,\mathrm{m}$ in total length. Check it directly: $\mathbf{A}\mathbf{x} = (999.833, 985.333, 970.833)^\mathsf{T}$, the residual is $(-0.167, +0.333, -0.167)^\mathsf{T}\,\mathrm{m}$, and its length is $\sqrt{0.0278 + 0.1111 + 0.0278} = 0.408$. It matches.

**SVD.** $\mathbf{A}^\mathsf{T}\mathbf{A}$ has trace $8$ and determinant $6$, so its eigenvalues are $(8 \pm \sqrt{64 - 24})/2 = 7.1623$ and $0.8377$. Their square roots are the singular values, $\sigma_1 = 2.6762$ and $\sigma_2 = 0.9153$. Then $\mathbf{x} = \mathbf{A}^+\mathbf{b}$ gives $(999.833, -14.500)^\mathsf{T}$ again, to fourteen digits.

Three methods, one answer — because $\kappa(\mathbf{A}) = 2.6762/0.9153 = 2.92$ and nothing is at stake. A stage closing at $14.5\,\mathrm{m/s}$ is a sensible number. The next examples remove that comfort.
:::

## Method 3: the SVD

Take $\mathbf{A} = \mathbf{U}\boldsymbol{\Sigma}\mathbf{V}^\mathsf{T}$ and use Lesson 9 directly. With $r$ the rank,

$$\mathbf{x} = \mathbf{A}^+\mathbf{b} = \sum_{i \le r}\frac{\mathbf{u}_i^\mathsf{T}\mathbf{b}}{\sigma_i}\,\mathbf{v}_i, \qquad \text{residual norm} = \left(\sum_{i > r}(\mathbf{u}_i^\mathsf{T}\mathbf{b})^2\right)^{1/2}.$$

In words: measure how much of $\mathbf{b}$ lies along each output direction $\mathbf{u}_i$, divide by that direction's stretch $\sigma_i$, and add up the input directions $\mathbf{v}_i$ in those amounts. Whatever lies along the unreachable directions is the residual.

Like QR, the SVD is built only from orthogonal transformations — Householder reflections, then a repeating sweep — and never forms $\mathbf{A}^\mathsf{T}\mathbf{A}$. So its error is also about $\kappa(\mathbf{A})\varepsilon$. It costs more: about $2mn^2 + 11n^3$ flops, and the repeated sweep runs slower than its flop count suggests.

What the extra cost buys is the **rank**. On a rank-deficient matrix, QR produces a zero on the diagonal of $\mathbf{R}_1$, and back substitution divides by it. The normal equations produce a singular $\mathbf{C}$, and Cholesky stops at a pivot that is not positive. Only the SVD hands you the singular values themselves, lets you choose a cutoff, and returns the minimum-norm answer when there is no unique one. **Column-pivoted QR** (LAPACK's `gelsy`) reveals rank at modest extra cost, but only the SVD tells you *how far* from rank deficient you are — the number an engineer wants.

::: example When only the SVD survives
Lesson 9's static alignment: estimate an accelerometer bias $b_x$ and a tilt $\theta_y$ from three identical readings. With $g = 9.80665\,\mathrm{m/s^2}$, every row of $\mathbf{H}$ is $(1,\ g)$.

*Normal equations.* $\mathbf{H}^\mathsf{T}\mathbf{H} = \begin{pmatrix} 3 & 3g \\ 3g & 3g^2 \end{pmatrix} = \begin{pmatrix} 3 & 29.420 \\ 29.420 & 288.511 \end{pmatrix}$, with determinant $3(3g^2) - (3g)^2 = 9g^2 - 9g^2 = 0$. Cholesky starts with $\ell_{11} = \sqrt{3} = 1.7321$ and $\ell_{21} = 3g/\sqrt{3} = 16.9856$. Next it needs $\ell_{22} = \sqrt{3g^2 - \ell_{21}^2}$, and $3g^2 - \ell_{21}^2 = 3g^2 - 3g^2 = 0$. In float64 that subtraction returns $0$ or a leftover near $10^{-14}$, and either makes the next step meaningless. The factorization fails. That is correct behavior, and useful: a failed Cholesky is Lesson 6's standard test for "not positive definite".

*QR.* $\mathbf{q}_1 = (1,1,1)^\mathsf{T}/\sqrt{3}$, $r_{11} = \sqrt{3}$, and $r_{12} = 3g/\sqrt{3} = 16.9856$. Subtracting $r_{12}\mathbf{q}_1$ from the second column $(g,g,g)^\mathsf{T}$ leaves exactly zero, so $r_{22} = 0$. On a computer, a Householder QR returns $r_{22} \approx 4\times 10^{-16}$ instead — pure round-off — and back substitution divides by it, blowing that round-off up by $10^{15}$. Unpivoted QR fails too, and more quietly.

*SVD.* $\sigma_1 = \sqrt{3(1 + g^2)} = 17.074$ and $\sigma_2 = 0$, so the rank is $1$. The pseudoinverse returns Lesson 9's minimum-norm answer, $b_x = 3.087\times 10^{-4}\,\mathrm{m/s^2}$ and $\theta_y = 3.028\times 10^{-3}\,\mathrm{rad}$. Better still, it returns $\sigma_2$ and its direction, so the software can say *which* combination cannot be seen — $\mathbf{v}_2 = (-0.9948,\ 0.1014)^\mathsf{T}$, a trade of bias against tilt — instead of only that something went wrong.
:::

## The three methods measured

Here is the controlled experiment behind the rule. Fit a degree-$d$ polynomial, with columns $1, t, \dots, t^d$, to $50$ points evenly spaced over $[-1, 1]$. The points are already well scaled, so any bad conditioning comes from the polynomial itself, not from a units mistake. Build the data as $\mathbf{b} = \mathbf{A}\mathbf{c}$ with every coefficient $c_k = 1$. The exact answer is then known, and every error is pure round-off. Solve in float64 three ways and report the relative error $\lVert\mathbf{x} - \mathbf{c}\rVert/\lVert\mathbf{c}\rVert$.

::: example Normal equations, QR and SVD as the conditioning worsens

| Degree | $\kappa(\mathbf{A})$ | $\kappa\varepsilon$ | $\kappa^2\varepsilon$ | Normal equations | QR | SVD |
| --- | --- | --- | --- | --- | --- | --- |
| $9$ | $1.21\times 10^{3}$ | $2.7\times 10^{-13}$ | $3.2\times 10^{-10}$ | $1.3\times 10^{-11}$ | $4.5\times 10^{-14}$ | $2.0\times 10^{-14}$ |
| $15$ | $2.31\times 10^{5}$ | $5.1\times 10^{-11}$ | $1.2\times 10^{-5}$ | $2.3\times 10^{-7}$ | $3.6\times 10^{-12}$ | $1.8\times 10^{-12}$ |
| $20$ | $2.17\times 10^{7}$ | $4.8\times 10^{-9}$ | $1.0\times 10^{-1}$ | $8.0\times 10^{-3}$ | $5.3\times 10^{-10}$ | $1.9\times 10^{-10}$ |

Exact values vary a little between computers; the pattern, [[plotted degree by degree|error-plot]], does not.

Read the columns. QR and the SVD follow $\kappa\varepsilon$ across four orders of magnitude of conditioning, always a little below it — five to thirty times below. The normal equations follow $\kappa^2\varepsilon$, landing one to two orders of magnitude under that worst-case bound. The bound is pessimistic, but its *slope* is right.

- At degree $9$ all three are fine.
- At degree $15$ — the top of the module exercise's sweep — the normal equations have about $6.6$ correct digits and QR about $11.4$.
- At degree $20$ the normal equations are $0.8\%$ wrong, about two good digits, while QR still has more than nine.

The residuals agree. At degree $20$ the QR fit misses the data by $7\times 10^{-15}$ and the normal-equations fit by $1.5\times 10^{-8}$, two million times worse — at the one number least squares exists to minimize.

One honest limit: QR and the SVD cannot beat $\kappa\varepsilon$ either. At degree $25$, $\kappa = 2.5\times 10^{9}$, so $\kappa\varepsilon = 5.5\times 10^{-7}$, and QR is down to about seven digits. There $\kappa^2\varepsilon = 1.4\times 10^{3}$, and the normal equations come back $32\%$ wrong. Conditioning belongs to the problem. A good algorithm refuses to make it worse, and nothing more.
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

`np.linalg.lstsq` is the SVD route with a cutoff built in, and it is the right default when you do not know the problem well. It also returns the rank and the singular values. Read them.

## Weighting by the measurement noise

If one friend measures the table with a laser and another pastes together a paper ruler, you would not average their readings equally. You would trust the laser more. Plain least squares treats every row equally, which is wrong whenever the measurements have different noise. The estimator you want minimizes the **weighted** cost

$$J(\mathbf{x}) = \tfrac{1}{2}(\mathbf{A}\mathbf{x} - \mathbf{b})^\mathsf{T}\mathbf{R}^{-1}(\mathbf{A}\mathbf{x} - \mathbf{b}),$$

where $\mathbf{R}$ is the measurement noise covariance. Dividing by $\mathbf{R}$ shrinks the say of noisy rows.

Lesson 6 supplies the trick. $\mathbf{R}$ is symmetric positive definite, so it has a Cholesky factor, $\mathbf{R} = \mathbf{L}\mathbf{L}^\mathsf{T}$. Substitute $\tilde{\mathbf{A}} = \mathbf{L}^{-1}\mathbf{A}$ and $\tilde{\mathbf{b}} = \mathbf{L}^{-1}\mathbf{b}$ ("A tilde", "b tilde"). Since $\mathbf{R}^{-1} = \mathbf{L}^{-\mathsf{T}}\mathbf{L}^{-1}$ (where $\mathbf{L}^{-\mathsf{T}}$ is the transpose of $\mathbf{L}^{-1}$), the weighted cost becomes $\tfrac{1}{2}\lVert\tilde{\mathbf{A}}\mathbf{x} - \tilde{\mathbf{b}}\rVert^2$, an ordinary least-squares problem. This is **[[whitening|whitening]]**: afterwards, every row has unit variance and is uncorrelated with every other. Whiten first, then pick a method.

A one-line check. Two independent measurements of one constant: $b_1 = 10.0\,\mathrm{m}$ with $\sigma_1 = 0.5\,\mathrm{m}$, and $b_2 = 12.0\,\mathrm{m}$ with $\sigma_2 = 2.0\,\mathrm{m}$. So $\mathbf{A} = (1, 1)^\mathsf{T}$ and $\mathbf{L} = \operatorname{diag}(0.5, 2.0)$. Whitened, $\tilde{\mathbf{A}} = (2, 0.5)^\mathsf{T}$ and $\tilde{\mathbf{b}} = (20, 6)^\mathsf{T}$. The normal equation $\tilde{\mathbf{A}}^\mathsf{T}\tilde{\mathbf{A}}\,x = \tilde{\mathbf{A}}^\mathsf{T}\tilde{\mathbf{b}}$ reads $(4 + 0.25)x = 2\cdot 20 + 0.5\cdot 6$, so $x = 43/4.25 = 10.118\,\mathrm{m}$. Its variance is $1/4.25 = 0.235\,\mathrm{m^2}$, so $\sigma = 0.485\,\mathrm{m}$ — a bit better than the good measurement alone, as it should be. That is the inverse-variance weighted mean. The unweighted answer would have been $11.0\,\mathrm{m}$, dragged almost a meter by the measurement that deserved a sixteenth of the weight.

::: note Where each method lives in real GNC software
The **normal equations** run wherever the matrix is huge and sparse or the data arrives a piece at a time: bundle adjustment, sequential batch filters, and the information form of a Kalman filter, all of which build up $\mathbf{A}^\mathsf{T}\mathbf{R}^{-1}\mathbf{A}$ directly. **QR** runs in **[[square-root information filters|srif]]**, where the prior information and the new whitened measurements are stacked and made triangular by Givens rotations each step. That filter never forms an information matrix, so its condition number is the square root of the ordinary filter's. **SVD** runs on the ground and wherever rank is the question: observability analysis, calibration with axes that were never excited, and attitude determination. There, **[[Wahba's problem|wahba]]** — find the rotation $\mathbf{M}$ that makes $\sum_i w_i\lVert\mathbf{b}_i - \mathbf{M}\mathbf{r}_i\rVert^2$ smallest, over measured star vectors $\mathbf{b}_i$ and catalog vectors $\mathbf{r}_i$ with weights $w_i$ — is solved by taking the SVD of $\sum_i w_i\mathbf{b}_i\mathbf{r}_i^\mathsf{T}$.
:::

## Choosing

::: key The three methods at a glance
All three compute the same $\mathbf{x}^\star$ in exact arithmetic. Normal equations: $\approx mn^2$ flops, error $\sim\kappa(\mathbf{A})^2\varepsilon$, needs full column rank. QR: $\approx 2mn^2$ flops, error $\sim\kappa(\mathbf{A})\varepsilon$, needs full column rank, gives the residual norm free. SVD: $\approx 2mn^2 + 11n^3$ flops, error $\sim\kappa(\mathbf{A})\varepsilon$, handles any rank and reports how close to rank deficient you are. QR is the default; the SVD when rank is in doubt; the normal equations when sparsity or incremental accumulation forces your hand.
:::

Put numbers on the cost for a realistic batch: $m = 1000$ observations and $n = 12$ parameters.

- Normal equations: $mn^2 + n^3/3 = 144{,}000 + 576 \approx 1.45\times 10^{5}$ flops.
- QR: $2mn^2 - \tfrac{2}{3}n^3 = 288{,}000 - 1152 \approx 2.87\times 10^{5}$.
- SVD: $2mn^2 + 11n^3 = 288{,}000 + 19{,}008 \approx 3.07\times 10^{5}$.

The ratios are $1$, $1.98$ and $2.12$. All three finish in well under a millisecond, so saving a factor of two is almost never the right trade. The balance shifts when $n$ reaches the thousands and the matrix is sparse, because the $n^3$ terms and the fill-in start to matter. That is where the normal equations still win — on memory, not on flops.

::: warning A small residual does not license the normal equations
At degree $20$ above, the normal equations returned coefficients wrong in the third digit while still matching the data to about eight decimal places, and Lesson 10's clock fit did the same. If what you hand downstream is the fitted *curve* — an ephemeris, a smoothed trajectory — the damage may be tolerable. If it is a *parameter* — a bias, a drag coefficient, a lever arm, a clock drift — then the badly conditioned directions are exactly what you are shipping, and the method matters. Decide which you are doing before you pick the algorithm.
:::

## Check yourself

::: check
$\mathbf{A}$ is $200\times 6$ with $\kappa(\mathbf{A}) = 4\times 10^{4}$. Estimate the relative error in $\mathbf{x}$ for each of the three methods in float64, and again on a float32 flight processor.
:::

::: answer
**Float64**, $\varepsilon = 2.2\times 10^{-16}$. QR and the SVD give about $\kappa\varepsilon = 4\times 10^{4}\times 2.2\times 10^{-16} = 8.8\times 10^{-12}$: about eleven correct digits. The normal equations give about $\kappa^2\varepsilon = 1.6\times 10^{9}\times 2.2\times 10^{-16} = 3.5\times 10^{-7}$: about six digits. All three are usable for most purposes.

**Float32**, $\varepsilon = 1.2\times 10^{-7}$. QR and the SVD give about $4\times 10^{4}\times 1.2\times 10^{-7} = 4.8\times 10^{-3}$ — two digits, marginal. The normal equations give about $1.6\times 10^{9}\times 1.2\times 10^{-7} = 190$. A relative error far above one means the answer is meaningless. With this conditioning in single precision, the normal equations are out, and even QR needs the problem rescaled first.
:::

::: check
Show that $\mathbf{R}_1^\mathsf{T}$ from the reduced QR factorization is the Cholesky factor of $\mathbf{A}^\mathsf{T}\mathbf{A}$, and explain why computing it this way is better than computing it from $\mathbf{A}^\mathsf{T}\mathbf{A}$ itself.
:::

::: answer
Substitute and use $\mathbf{Q}_1^\mathsf{T}\mathbf{Q}_1 = \mathbf{I}$ (its columns are perpendicular unit vectors):

$$\mathbf{A}^\mathsf{T}\mathbf{A} = (\mathbf{Q}_1\mathbf{R}_1)^\mathsf{T}(\mathbf{Q}_1\mathbf{R}_1) = \mathbf{R}_1^\mathsf{T}\mathbf{Q}_1^\mathsf{T}\mathbf{Q}_1\mathbf{R}_1 = \mathbf{R}_1^\mathsf{T}\mathbf{R}_1.$$

With $\mathbf{L} = \mathbf{R}_1^\mathsf{T}$, which is lower triangular, that reads $\mathbf{A}^\mathsf{T}\mathbf{A} = \mathbf{L}\mathbf{L}^\mathsf{T}$: the Cholesky factorization, unique once the diagonal is made positive.

Computing it by QR is better because the arithmetic never touches a matrix with condition number $\kappa(\mathbf{A})^2$. Since $\mathbf{R}_1 = \mathbf{Q}_1^\mathsf{T}\mathbf{A}$ and an orthogonal factor leaves singular values alone, $\kappa(\mathbf{R}_1) = \kappa(\mathbf{A})$. Forming $\mathbf{A}^\mathsf{T}\mathbf{A}$ first loses the small singular values in the round-off of the products, and nothing done afterward brings them back.
:::

::: check
A batch fit has $\mathbf{A}$ of size $5000\times 8$. Why is QR barely more expensive than the normal equations here, and when would that stop being true?
:::

::: answer
With $m \gg n$, both costs are dominated by the term in $mn^2$. The normal equations need $mn^2 + n^3/3 = 320{,}000 + 171 \approx 3.2\times 10^{5}$ flops. QR needs $2mn^2 - \tfrac{2}{3}n^3 = 640{,}000 - 341 \approx 6.4\times 10^{5}$. At $n = 8$ the $n^3$ terms are negligible, so the ratio is almost exactly $2$ — double a tiny number.

It stops being true when $n$ grows toward $m$, where the cubic terms matter, and — more importantly in practice — when $\mathbf{A}$ is large and sparse. The normal equations can be built up row by row without ever storing $\mathbf{A}$, and a sparse $\mathbf{A}^\mathsf{T}\mathbf{A}$ often stays sparse, whereas $\mathbf{Q}$ fills in. That memory argument, not the flop count, is why bundle adjustment and large sparse estimators still use the normal equations.
:::

::: check
Your least-squares solver warns that $\mathbf{R}_1$ has a diagonal entry of $3\times 10^{-13}$ while the largest is $4.1$. What has happened, and what are your options?
:::

::: answer
The diagonal of $\mathbf{R}_1$ is a rough stand-in for the singular values. A ratio of $4.1/(3\times 10^{-13}) \approx 1.4\times 10^{13}$ says the matrix is numerically rank deficient: one column is, to within round-off, a combination of the others. Two parameters in your model cannot be told apart from this data.

Options, in order:

1. **Check the scaling first.** A units mismatch can manufacture a tiny pivot out of a healthy problem.
2. **Take the SVD** to find which combination is unobservable. The last singular vector $\mathbf{v}_n$ names it, and you may be able to fix or remove one parameter.
3. **Truncate or add information.** Either use the rank-revealing pseudoinverse of Lesson 9 and report the dropped direction as unestimated, or supply a prior that pins it down.

What you must not do is back-substitute through that pivot. The resulting parameters would be round-off multiplied by about $10^{13}$.
:::

::: check
Two measurements of a single unknown: $b_1 = 100.0\,\mathrm{m}$ with $\sigma_1 = 1\,\mathrm{m}$, and $b_2 = 106.0\,\mathrm{m}$ with $\sigma_2 = 3\,\mathrm{m}$. Give the weighted least-squares estimate, its standard deviation, and the residual of each measurement.
:::

::: answer
Whiten by $\mathbf{L} = \operatorname{diag}(1, 3)$: $\tilde{\mathbf{A}} = (1,\ 1/3)^\mathsf{T}$ and $\tilde{\mathbf{b}} = (100,\ 106/3)^\mathsf{T}$. The normal equation is $(1 + 1/9)x = 100 + 106/9$, so

$$x = \frac{100 + 11.778}{1.1111} = \frac{111.778}{1.1111} = 100.60\,\mathrm{m}.$$

That matches the inverse-variance weighted mean, $(100/1 + 106/9)/(1/1 + 1/9)$, and sits near the better measurement, as it should.

The variance is $1/(1/\sigma_1^2 + 1/\sigma_2^2) = 1/1.1111 = 0.900\,\mathrm{m^2}$, so $\sigma = 0.949\,\mathrm{m}$ — a little better than the good measurement alone, which is the point of combining them.

The residuals, estimate minus measurement: $100.60 - 100.0 = +0.60\,\mathrm{m}$, which is $0.60\sigma_1$; and $100.60 - 106.0 = -5.40\,\mathrm{m}$, which is $-1.80\sigma_2$. In sigma units the second measurement is three times further off, which is how you would flag it as a possible outlier.
:::

## Summary

| Item | Statement |
| --- | --- |
| Problem | minimize $\lVert\mathbf{A}\mathbf{x} - \mathbf{b}\rVert$; the optimal residual is perpendicular to every column of $\mathbf{A}$ |
| Normal equations | $\mathbf{A}^\mathsf{T}\mathbf{A}\mathbf{x} = \mathbf{A}^\mathsf{T}\mathbf{b}$; solve by Cholesky, never by an explicit inverse |
| QR | $\mathbf{A} = \mathbf{Q}_1\mathbf{R}_1$; solve $\mathbf{R}_1\mathbf{x} = \mathbf{Q}_1^\mathsf{T}\mathbf{b}$ by back substitution; residual norm $= \lVert\mathbf{Q}_2^\mathsf{T}\mathbf{b}\rVert$ |
| QR identity | $\mathbf{A}^\mathsf{T}\mathbf{A} = \mathbf{R}_1^\mathsf{T}\mathbf{R}_1$, so $\mathbf{R}_1^\mathsf{T}$ is the Cholesky factor, found without forming the product |
| SVD | $\mathbf{x} = \mathbf{A}^+\mathbf{b} = \sum_{i\le r}(\mathbf{u}_i^\mathsf{T}\mathbf{b}/\sigma_i)\mathbf{v}_i$; reveals rank; minimum norm when rank deficient |
| Cost | normal $mn^2 + n^3/3$; QR $2mn^2 - \tfrac{2}{3}n^3$; SVD $\approx 2mn^2 + 11n^3$ |
| Accuracy | normal $\sim\kappa(\mathbf{A})^2\varepsilon$; QR and SVD $\sim\kappa(\mathbf{A})\varepsilon$ |
| Why | orthogonal factors keep singular values, so $\kappa(\mathbf{R}_1) = \kappa(\mathbf{A})$; forming $\mathbf{A}^\mathsf{T}\mathbf{A}$ squares it |
| Rank deficient | Cholesky hits a non-positive pivot, QR a zero on the diagonal of $\mathbf{R}_1$; only the SVD returns an answer |
| Weighting | $\mathbf{R} = \mathbf{L}\mathbf{L}^\mathsf{T}$, then solve the ordinary problem with $\mathbf{L}^{-1}\mathbf{A}$ and $\mathbf{L}^{-1}\mathbf{b}$ |
| Default choice | QR; SVD when rank is in doubt; normal equations when sparsity or incremental accumulation demands it |
| NumPy | `np.linalg.lstsq` (SVD), `np.linalg.qr`, `np.linalg.solve(A.T @ A, A.T @ b)` |

That closes the module. Eigenvalues and the matrix exponential gave you the dynamics. The spectral theorem, positive definiteness and Cholesky gave you covariance. Matrix calculus gave you the Jacobians. And the SVD, the pseudoinverse, the condition number and these three solvers gave you the estimate — and an honest account of how much of it to believe. Every filter in the estimation modules ahead is assembled from these parts.

::: context least-squares-history Who invented least squares
Adrien-Marie Legendre published the method in 1805, in a work on computing the orbits of comets. Carl Friedrich Gauss published his own account in 1809 and said he had been using it since 1795. His most famous use came in 1801, when the newly found dwarf planet Ceres slipped behind the Sun's glare. From a few weeks of observations, Gauss predicted where it would reappear, and astronomers found it there. Least squares began as orbit determination.
:::

::: context normal-word Why "normal"?
In geometry, **normal** means perpendicular — the word comes from the Latin *norma*, a carpenter's square for drawing right angles. The normal equations are the statement that the leftover miss is normal (perpendicular) to every column of $\mathbf{A}$. They have nothing to do with the "normal" of the normal (bell-curve) distribution, although least squares and that distribution turn out to be close friends: least squares gives the most likely answer when the noise is bell-curved.
:::

::: context projection-picture The shadow of the data
The line stands for every vector $\mathbf{A}\mathbf{x}$ you could possibly make. The data $\mathbf{b}$ sits off the line, because measurements are noisy. The closest point on the line is straight below $\mathbf{b}$, where the dashed residual meets the line at a right angle. Any other point on the line is further away, by Pythagoras.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="150" x2="340" y2="150" stroke="#1f2a44" stroke-width="2"/>
  <line x1="60" y1="150" x2="280" y2="50" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="280,50 270.2,59.9 266.1,50.8" fill="#1d6fd1"/>
  <line x1="60" y1="150" x2="280" y2="150" stroke="#1d6fd1" stroke-width="4" stroke-opacity="0.5"/>
  <line x1="280" y1="150" x2="280" y2="50" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 3"/>
  <polyline points="270,150 270,140 280,140" fill="none" stroke="#1f2a44" stroke-width="1.2"/>
  <circle cx="60" cy="150" r="3" fill="#1f2a44"/>
  <text x="160" y="85" font-size="12" fill="#1d6fd1" text-anchor="end">b (the data)</text>
  <text x="286" y="104" font-size="12" fill="#b4232c">residual r*</text>
  <text x="280" y="168" font-size="12" fill="#1f2a44" text-anchor="middle">Ax* (best fit)</text>
  <text x="120" y="168" font-size="11" fill="#6c7a93" text-anchor="middle">all possible Ax</text>
  <text x="48" y="146" font-size="11" fill="#1f2a44" text-anchor="end">0</text>
</svg>
```
:::

::: context flops Counting flops
A **flop** is one floating-point operation: a single addition, subtraction, multiplication or division of two computer numbers. Counting them is a quick way to compare algorithms before running anything. A laptop processor manages billions per second, so a solve of a few hundred thousand flops takes well under a millisecond. Flop counts ignore memory traffic, which is why two methods with equal counts can still run at different speeds.
:::

::: context bundle-adjustment Bundle adjustment
Bundle adjustment is the big fit behind building a 3-D map from many camera images: it solves for every camera position and every landmark position at once, so that all the "bundles" of sight lines agree. Spacecraft doing terrain-relative navigation, and teams building shape models of asteroids from approach images, solve problems of this kind. Each landmark is seen by only a few images, so almost every entry of $\mathbf{A}^\mathsf{T}\mathbf{A}$ is zero — and sparse-matrix software exploits exactly that.
:::

::: context gram-schmidt-drift Why classical Gram–Schmidt drifts
Gram–Schmidt makes each new column perpendicular to the earlier ones by subtracting its shadows on them. When two columns point in almost the same direction, what is left after subtracting is tiny, and it is mostly round-off. Normalizing that tiny leftover blows the round-off up, and the new $\mathbf{q}$ is no longer quite perpendicular to the old ones. A rearranged version, **modified Gram–Schmidt**, subtracts one shadow at a time and does much better; Householder reflections do better still.
:::

::: context householder A mirror that lines a vector up
A Householder reflection is a mirror placed exactly halfway between a vector and the axis you want it on. Reflect $\mathbf{x} = (3, 4)$ in that mirror and it lands on the axis at $(5, 0)$ — same length, since mirrors keep lengths, but with its second entry now zero. One such mirror per column clears everything below the diagonal. Alston Householder described the method in 1958.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="160" x2="330" y2="160" stroke="#6c7a93" stroke-width="1.2"/>
  <line x1="60" y1="175" x2="60" y2="25" stroke="#6c7a93" stroke-width="1.2"/>
  <line x1="60" y1="160" x2="283.6" y2="48.2" stroke="#f2b880" stroke-width="3"/>
  <line x1="60" y1="160" x2="135" y2="60" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="60" y1="160" x2="185" y2="160" stroke="#b4232c" stroke-width="2.5"/>
  <line x1="135" y1="60" x2="185" y2="160" stroke="#1f2a44" stroke-width="1.2" stroke-dasharray="4 3"/>
  <circle cx="135" cy="60" r="4" fill="#1d6fd1"/>
  <circle cx="185" cy="160" r="4" fill="#b4232c"/>
  <text x="126" y="52" font-size="12" fill="#1d6fd1" text-anchor="end">x = (3, 4)</text>
  <text x="185" y="180" font-size="12" fill="#b4232c" text-anchor="middle">(5, 0)</text>
  <text x="286" y="44" font-size="12" fill="#1f2a44">mirror</text>
  <text x="200" y="120" font-size="11" fill="#1f2a44">same length, 5</text>
</svg>
```
:::

::: context givens Givens rotations
A Givens rotation turns a vector in only one plane — two coordinates at a time — by exactly the angle that makes one chosen entry zero. For the pair $(3, 4)$ that angle is about $53.1^\circ$, and it turns the pair into $(5, 0)$. Because each rotation touches only two rows, you can fold one new measurement row into an existing triangle with a handful of rotations, which is what a filter needs when data arrives one reading at a time. Wallace Givens used these rotations in the 1950s.
:::

::: context error-plot The three methods, degree by degree
Relative error of each method on the polynomial test, degree $3$ to $20$, on a logarithmic scale: each gridline is a factor of $10{,}000$. QR (dark blue) and the SVD (light blue) hug the grey $\kappa\varepsilon$ line from below. The normal equations (red) climb twice as steeply, because they pay $\kappa^2$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <g stroke="#6c7a93" stroke-width="0.6" stroke-dasharray="2 3">
    <line x1="50" y1="20" x2="340" y2="20"/><line x1="50" y1="57.5" x2="340" y2="57.5"/><line x1="50" y1="95" x2="340" y2="95"/><line x1="50" y1="132.5" x2="340" y2="132.5"/>
  </g>
  <line x1="50" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="50" y1="170" x2="50" y2="20" stroke="#1f2a44" stroke-width="1.2"/>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="45" y="24">1</text><text x="45" y="61.5">1e-4</text><text x="45" y="99">1e-8</text><text x="45" y="136.5">1e-12</text><text x="45" y="174">1e-16</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="186">3</text><text x="152.4" y="186">9</text><text x="254.7" y="186">15</text><text x="340" y="186">20</text><text x="200" y="198">degree</text>
  </g>
  <polyline fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 3" points="50.0,158.3 67.1,155.0 84.1,151.7 101.2,148.2 118.2,144.8 135.3,141.3 152.4,137.9 169.4,134.3 186.5,130.8 203.5,127.2 220.6,123.7 237.6,120.1 254.7,116.5 271.8,112.8 288.8,109.2 305.9,105.5 322.9,101.7 340.0,98.0"/>
  <polyline fill="none" stroke="#8fb8f0" stroke-width="2" points="50.0,159.6 67.1,161.8 84.1,158.1 101.2,159.1 118.2,151.2 135.3,149.3 152.4,148.5 169.4,141.7 186.5,136.6 203.5,139.5 220.6,133.7 237.6,128.0 254.7,130.1 271.8,124.3 288.8,123.8 305.9,115.1 322.9,110.8 340.0,111.2"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="50.0,164.1 67.1,161.6 84.1,162.0 101.2,161.8 118.2,158.1 135.3,151.7 152.4,145.2 169.4,141.3 186.5,142.0 203.5,134.2 220.6,129.3 237.6,127.8 254.7,127.3 271.8,120.4 288.8,117.9 305.9,114.2 322.9,110.3 340.0,107.0"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2" points="50.0,161.6 67.1,150.1 84.1,145.7 101.2,138.2 118.2,134.3 135.3,125.9 152.4,122.0 169.4,111.0 186.5,104.4 203.5,104.8 220.6,95.6 237.6,89.5 254.7,82.2 271.8,70.0 288.8,67.8 305.9,57.2 322.9,51.2 340.0,39.7"/>
  <text x="200" y="45" font-size="12" fill="#b4232c">normal equations</text>
  <text x="250" y="155" font-size="12" fill="#1d6fd1">QR, SVD</text>
  <text x="60" y="40" font-size="11" fill="#6c7a93">grey dashed: κε</text>
</svg>
```
:::

::: context whitening Why it is called whitening
Engineers call noise **white** when it is uncorrelated from one sample to the next and equally strong in every direction — like white light, which mixes all colors equally. Measurement noise usually is not: some sensors are noisier, and some errors are shared. Multiplying by $\mathbf{L}^{-1}$ undoes both, turning the noise into the plain, unit-sized, uncorrelated kind.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="90" x2="350" y2="90" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="108">8</text><text x="140" y="108">10</text><text x="240" y="108">12</text><text x="340" y="108">14 m</text>
  </g>
  <line x1="115" y1="40" x2="165" y2="40" stroke="#1d6fd1" stroke-width="3"/>
  <circle cx="140" cy="40" r="4" fill="#1d6fd1"/>
  <text x="112" y="44" font-size="11" fill="#1d6fd1" text-anchor="end">10.0 ± 0.5</text>
  <line x1="140" y1="22" x2="340" y2="22" stroke="#6c7a93" stroke-width="3"/>
  <circle cx="240" cy="22" r="4" fill="#6c7a93"/>
  <text x="240" y="15" font-size="11" fill="#6c7a93" text-anchor="middle">12.0 ± 2.0</text>
  <line x1="121.7" y1="68" x2="170.1" y2="68" stroke="#b4232c" stroke-width="3"/>
  <circle cx="145.9" cy="68" r="4" fill="#b4232c"/>
  <text x="178" y="72" font-size="11" fill="#b4232c">weighted 10.12 ± 0.49</text>
  <line x1="190" y1="84" x2="190" y2="96" stroke="#1f2a44" stroke-width="2"/>
  <text x="194" y="84" font-size="11" fill="#1f2a44">plain average 11.0</text>
</svg>
```

The weighted answer sits almost on top of the good measurement.
:::

::: context srif Square-root information filters
Gerald Bierman developed square-root information filtering at NASA's Jet Propulsion Laboratory and wrote the standard book on it, *Factorization Methods for Discrete Sequential Estimation* (1977). The filter carries a triangular matrix whose "square", $\mathbf{R}^\mathsf{T}\mathbf{R}$, is the information matrix — the same trick as QR's $\mathbf{R}_1^\mathsf{T}\mathbf{R}_1 = \mathbf{A}^\mathsf{T}\mathbf{A}$. Square-root methods became a mainstay of deep-space navigation, where a filter may run through years of updates and squared conditioning would steadily eat into its accuracy.
:::

::: context wahba Wahba's problem
Grace Wahba posed this problem in 1965, in *SIAM Review*: given pairs of unit vectors seen in the spacecraft body and known in a star catalog, find the rotation that best lines them up. It is a least-squares problem whose unknown must be a rotation, not any matrix. Landis Markley showed in 1988 that the SVD of the weighted sum $\sum_i w_i\mathbf{b}_i\mathbf{r}_i^\mathsf{T}$ gives the answer directly, and star trackers solve problems of this form many times a second.
:::
