---
id: l01-linear-least-squares-normal-equations-qr-svd
title: The linear least squares problem
minutes: 22
covers:
  - The linear least squares problem; normal equations, QR, and SVD solutions
---

Every estimate a navigation system produces is an answer to the same question: given more measurements than unknowns, all of them slightly wrong, what single set of unknowns explains them best? A GNSS receiver has eight pseudoranges and four unknowns. A star tracker has fifteen star directions and three attitude angles. A rate-table run gives two hundred gyro outputs and asks for one scale factor and one bias. In each case the measurements are stacked into a vector, the unknowns into another, and a matrix says how the second would produce the first if nothing were noisy. Least squares is the rule that picks the unknowns, and this module is about doing that as an engineering act: choosing the criterion, computing the answer without destroying it, attaching an honest uncertainty to it, and knowing when the data cannot support it.

You have already met the mathematics twice. Linear Algebra I derived the normal equations from projection and Linear Algebra II compared the normal equations, QR and the SVD as ways of computing the same vector, with the condition number deciding how many digits survive. This lesson does not repeat those derivations. It restates them in the notation estimation uses, adds the two objects that estimation cares about and linear algebra did not — the residual as a random vector and the projection matrix that produces it — and then runs the experiment that the rest of the module will keep coming back to: a design matrix whose two columns are nearly parallel, solved three ways, so you can see the normal equations return a wrong answer with a tiny residual.

Notation from here on: $\mathbf{y}$ is the vector of $m$ measurements, $\mathbf{x}$ the vector of $n$ unknowns, $\mathbf{H}$ the $m\times n$ **measurement matrix** (also called the design matrix or the observation matrix), and $\mathbf{v}$ the measurement noise. The estimate is $\hat{\mathbf{x}}$ and the post-fit residual is $\hat{\mathbf{v}}$.

## The measurement model

The linear measurement model is

$$
\mathbf{y} = \mathbf{H}\mathbf{x} + \mathbf{v}, \qquad \mathbf{y}\in\mathbb{R}^m,\quad \mathbf{x}\in\mathbb{R}^n,\quad m \ge n .
$$

Row $i$ of $\mathbf{H}$, written $\mathbf{h}_i^\mathsf{T}$, says how the $i$-th measurement depends on the unknowns: $y_i = \mathbf{h}_i^\mathsf{T}\mathbf{x} + v_i$. For a receiver clock modelled as bias plus drift, $\mathbf{h}_i^\mathsf{T} = (1,\ t_i)$. For a range to a beacon, linearised about a nominal position, $\mathbf{h}_i^\mathsf{T}$ is the unit line-of-sight vector. For a gyro on a rate table, $\mathbf{h}_i^\mathsf{T} = (\omega_i,\ 1)$ with unknowns scale factor and bias. What the rows have in common is that you write them down from physics before you see any data; $\mathbf{H}$ is the model, $\mathbf{y}$ is the evidence.

The unknowns are called the **state** or the **parameters** interchangeably in this module; the distinction — states move, parameters do not — matters once dynamics enter, and here nothing moves. The noise $\mathbf{v}$ is a random vector. For this lesson assume only that it has zero mean and covariance $\sigma^2\mathbf{I}$: every measurement equally noisy, none correlated with another. The next lesson removes that assumption.

An estimator is any rule that turns $\mathbf{y}$ into a guess $\hat{\mathbf{x}}$. **Least squares** is the rule that makes the model reproduce the data as closely as possible in the Euclidean sense:

$$
\hat{\mathbf{x}} = \arg\min_{\mathbf{x}}\ J(\mathbf{x}), \qquad J(\mathbf{x}) = \tfrac{1}{2}\,\lVert\mathbf{y} - \mathbf{H}\mathbf{x}\rVert^2 .
$$

The gradient of $J$ is $-\mathbf{H}^\mathsf{T}(\mathbf{y} - \mathbf{H}\mathbf{x})$, from the matrix-calculus lesson, and setting it to zero gives the **normal equations** and, when $\mathbf{H}$ has full column rank, their solution:

$$
\mathbf{H}^\mathsf{T}\mathbf{H}\,\hat{\mathbf{x}} = \mathbf{H}^\mathsf{T}\mathbf{y}
\quad\Longrightarrow\quad
\hat{\mathbf{x}} = (\mathbf{H}^\mathsf{T}\mathbf{H})^{-1}\mathbf{H}^\mathsf{T}\mathbf{y} .
$$

Geometrically, $\mathbf{H}\hat{\mathbf{x}}$ is the orthogonal projection of $\mathbf{y}$ onto the column space of $\mathbf{H}$, and the normal equations say the leftover is perpendicular to every column. Two consequences deserve stating in estimation language. First, $\hat{\mathbf{x}}$ is a **linear function of the data**: $\hat{\mathbf{x}} = \mathbf{K}\mathbf{y}$ with $\mathbf{K} = (\mathbf{H}^\mathsf{T}\mathbf{H})^{-1}\mathbf{H}^\mathsf{T}$, the pseudoinverse $\mathbf{H}^+$ of Linear Algebra II. Everything about the statistics of $\hat{\mathbf{x}}$ will follow from the linear-transformation rule $\mathbf{P}_y = \mathbf{A}\mathbf{P}_x\mathbf{A}^\mathsf{T}$ applied to $\mathbf{K}$. Second, substituting the model into the estimator,

$$
\hat{\mathbf{x}} = \mathbf{K}(\mathbf{H}\mathbf{x} + \mathbf{v}) = \mathbf{x} + \mathbf{K}\mathbf{v}, \qquad \mathbf{K}\mathbf{H} = \mathbf{I},
$$

so the estimation error $\hat{\mathbf{x}} - \mathbf{x} = \mathbf{K}\mathbf{v}$ is the noise passed through $\mathbf{K}$, with zero mean. The least-squares estimate is **unbiased**, and its covariance is $\mathbf{K}(\sigma^2\mathbf{I})\mathbf{K}^\mathsf{T} = \sigma^2(\mathbf{H}^\mathsf{T}\mathbf{H})^{-1}$. That matrix is the first uncertainty statement of the module, and it says something you should find striking: the covariance of the estimate depends on the geometry $\mathbf{H}$ and the noise level $\sigma$, and not at all on the measured values. You can compute how good the fit will be before taking a single measurement.

::: key Normal equations
$\hat{\mathbf{x}} = (\mathbf{H}^\mathsf{T}\mathbf{H})^{-1}\mathbf{H}^\mathsf{T}\mathbf{y}$ minimises $\lVert\mathbf{y} - \mathbf{H}\mathbf{x}\rVert^2$. It is correct in exact arithmetic; numerically, forming $\mathbf{H}^\mathsf{T}\mathbf{H}$ squares the condition number, so prefer QR or the SVD. Under noise of covariance $\sigma^2\mathbf{I}$ the estimate is unbiased with covariance $\sigma^2(\mathbf{H}^\mathsf{T}\mathbf{H})^{-1}$.
:::

## The residual and the hat matrix

The **post-fit residual** is what the model could not explain:

$$
\hat{\mathbf{v}} = \mathbf{y} - \mathbf{H}\hat{\mathbf{x}} = \mathbf{y} - \mathbf{H}(\mathbf{H}^\mathsf{T}\mathbf{H})^{-1}\mathbf{H}^\mathsf{T}\mathbf{y} = (\mathbf{I} - \boldsymbol{\Pi})\,\mathbf{y}, \qquad \boldsymbol{\Pi} = \mathbf{H}(\mathbf{H}^\mathsf{T}\mathbf{H})^{-1}\mathbf{H}^\mathsf{T} .
$$

The $m\times m$ matrix $\boldsymbol{\Pi}$ is the projection onto the column space of $\mathbf{H}$ — statisticians call it the **hat matrix** because it puts the hat on $\mathbf{y}$: $\hat{\mathbf{y}} = \mathbf{H}\hat{\mathbf{x}} = \boldsymbol{\Pi}\mathbf{y}$. It is symmetric, it is idempotent ($\boldsymbol{\Pi}^2 = \boldsymbol{\Pi}$, since projecting twice is projecting once), it satisfies $\boldsymbol{\Pi}\mathbf{H} = \mathbf{H}$, and its trace equals its rank, which is $n$: the trace of $\mathbf{H}(\mathbf{H}^\mathsf{T}\mathbf{H})^{-1}\mathbf{H}^\mathsf{T}$ is, by cycling the product inside the trace, the trace of $(\mathbf{H}^\mathsf{T}\mathbf{H})^{-1}\mathbf{H}^\mathsf{T}\mathbf{H} = \mathbf{I}_n$.

Now put the model into the residual:

$$
\hat{\mathbf{v}} = (\mathbf{I} - \boldsymbol{\Pi})(\mathbf{H}\mathbf{x} + \mathbf{v}) = (\mathbf{I} - \boldsymbol{\Pi})\,\mathbf{v},
$$

because $\boldsymbol{\Pi}\mathbf{H}\mathbf{x} = \mathbf{H}\mathbf{x}$. The true state has vanished. Whatever $\mathbf{x}$ is, the residual is a fixed linear function of the noise alone — which is why residuals can be used to check the noise model and the measurement model without knowing the answer. Its covariance is $(\mathbf{I} - \boldsymbol{\Pi})\sigma^2\mathbf{I}(\mathbf{I} - \boldsymbol{\Pi})^\mathsf{T} = \sigma^2(\mathbf{I} - \boldsymbol{\Pi})$, using symmetry and idempotence. Read the diagonal: the variance of the $i$-th residual is $\sigma^2(1 - \Pi_{ii})$, *smaller* than the noise variance. A fitted model partly absorbs the noise of each point, and it absorbs more of the noise at points with large $\Pi_{ii}$. That diagonal entry is the **leverage** of measurement $i$: how strongly the fit is pulled toward that one measurement. Leverages lie between $0$ and $1$ and sum to $n$. A point with leverage near $1$ is fitted almost exactly no matter what it says, which is exactly what makes an outlier at such a point invisible in the residuals; the residual-analysis lesson later in this module builds on that.

The expected squared length of the residual follows from the trace: $\mathbb{E}\lVert\hat{\mathbf{v}}\rVert^2 = \sigma^2\,\mathrm{tr}(\mathbf{I} - \boldsymbol{\Pi}) = \sigma^2(m - n)$. Hence the unbiased estimate of the noise variance from the fit,

$$
\hat{\sigma}^2 = \frac{\lVert\hat{\mathbf{v}}\rVert^2}{m - n},
$$

with $m - n$ the **degrees of freedom** of the residual: $m$ numbers, $n$ of them spent on the fit. This is Bessel's correction generalised — fitting a single mean is the case $n = 1$ — and it is the quantity the chi-square lesson showed is $\chi^2_{m-n}$ when scaled by the true $\sigma^2$.

::: example A receiver clock over fifty seconds
A GNSS receiver's clock bias, in metres of light-travel, is sampled every $10\,\mathrm{s}$: at $t = 0, 10, \ldots, 50\,\mathrm{s}$ the values are $1250.00$, $1282.15$, $1313.86$, $1345.55$, $1377.77$ and $1409.50\,\mathrm{m}$, each with noise of about $\sigma = 0.5\,\mathrm{m}$. Model the clock as bias plus drift, $y = c_0 + c_1 t$, so $\mathbf{x} = (c_0, c_1)^\mathsf{T}$ and the rows of $\mathbf{H}$ are $(1, t_i)$.

The normal matrix and right-hand side are

$$
\mathbf{H}^\mathsf{T}\mathbf{H} = \begin{pmatrix} 6 & 150 \\ 150 & 5500 \end{pmatrix}, \qquad
\mathbf{H}^\mathsf{T}\mathbf{y} = \begin{pmatrix} 7978.83 \\ 205\,051.0 \end{pmatrix},
$$

with $\sum t_i = 150$ and $\sum t_i^2 = 5500$. The determinant is $6\times 5500 - 150^2 = 10\,500$, so

$$
(\mathbf{H}^\mathsf{T}\mathbf{H})^{-1} = \frac{1}{10\,500}\begin{pmatrix} 5500 & -150 \\ -150 & 6 \end{pmatrix} = \begin{pmatrix} 0.52381 & -0.014286 \\ -0.014286 & 0.00057143 \end{pmatrix},
$$

and $\hat{\mathbf{x}} = (1250.087\,\mathrm{m},\ 3.1887\,\mathrm{m/s})^\mathsf{T}$. The QR route gives the same digits: $\mathbf{R} = \begin{pmatrix} -2.4495 & -61.237 \\ 0 & 41.833 \end{pmatrix}$, $\mathbf{Q}^\mathsf{T}\mathbf{y} = (-3257.34,\ 133.393)^\mathsf{T}$, and back substitution returns $c_1 = 133.393/41.833 = 3.1887$ and then $c_0 = 1250.087$. (NumPy's Householder QR chooses a negative first pivot; the signs cancel in the solve.)

The residuals are $\hat{\mathbf{v}} = (-0.087,\ 0.176,\ -0.001,\ -0.199,\ 0.134,\ -0.023)^\mathsf{T}\,\mathrm{m}$. Check the normal equations directly: they sum to zero (orthogonal to the column of ones) and $\sum t_i\hat{v}_i = 0$ (orthogonal to the column of times), both to round-off. Their squared length is $0.09646\,\mathrm{m^2}$, so with $m - n = 4$ degrees of freedom $\hat{\sigma}^2 = 0.0241\,\mathrm{m^2}$ and $\hat{\sigma} = 0.155\,\mathrm{m}$ — a third of the $0.5\,\mathrm{m}$ that was assumed. Six samples are too few to conclude much from that: the chi-square lesson's interval for four degrees of freedom is wide. The leverages, the diagonal of $\boldsymbol{\Pi}$, are $0.524, 0.295, 0.181, 0.181, 0.295, 0.524$, summing to $2 = n$: the two end points each carry more than half a unit of leverage, and the fit is pulled toward them twice as hard as toward the middle points.

Finally the covariance, using the assumed $\sigma = 0.5\,\mathrm{m}$: $\sigma^2(\mathbf{H}^\mathsf{T}\mathbf{H})^{-1}$ has diagonal $0.1310\,\mathrm{m^2}$ and $1.43\times 10^{-4}\,\mathrm{m^2/s^2}$, so the bias is known to $0.362\,\mathrm{m}$ and the drift to $0.0120\,\mathrm{m/s}$, and the off-diagonal $-0.00357$ says the two errors are negatively correlated: overestimate the bias at $t = 0$ and you will underestimate the drift, because the fit must still pass through the cloud of points.
:::

## Three ways to compute the same vector

Linear Algebra II established the facts; here they are again, arranged as the decision an estimation engineer makes.

| Route | Work with | Cost ($m \gg n$) | Error in $\hat{\mathbf{x}}$ | Needs |
| --- | --- | --- | --- | --- |
| Normal equations, Cholesky | $\mathbf{H}^\mathsf{T}\mathbf{H}$ | $\approx mn^2$ | $\sim\kappa(\mathbf{H})^2\,\varepsilon$ | full column rank |
| QR (Householder) | $\mathbf{H}$ | $\approx 2mn^2$ | $\sim\kappa(\mathbf{H})\,\varepsilon$ | full column rank |
| SVD | $\mathbf{H}$ | $\approx 2mn^2 + 11n^3$ | $\sim\kappa(\mathbf{H})\,\varepsilon$ | nothing; reveals rank |

Here $\varepsilon = 2.2\times 10^{-16}$ is the float64 unit round-off and $\kappa(\mathbf{H}) = \sigma_{\max}/\sigma_{\min}$ is the condition number of the measurement matrix. QR solves $\mathbf{R}\hat{\mathbf{x}} = \mathbf{Q}^\mathsf{T}\mathbf{y}$ after factoring $\mathbf{H} = \mathbf{Q}\mathbf{R}$; the SVD returns $\hat{\mathbf{x}} = \sum_i (\mathbf{u}_i^\mathsf{T}\mathbf{y}/\sigma_i)\,\mathbf{v}_i$ and hands you the $\sigma_i$ so you can see how close to singular the problem is.

The reason the first row is worse is worth seeing at the level of individual numbers, not only as $\kappa^2$. Take two unit columns at a small angle $\phi$. Their Gram matrix is

$$
\mathbf{H}^\mathsf{T}\mathbf{H} = \begin{pmatrix} 1 & \cos\phi \\ \cos\phi & 1 \end{pmatrix}, \qquad \det = 1 - \cos^2\phi = \sin^2\phi ,
$$

with eigenvalues $1 \pm \cos\phi$, so $\kappa(\mathbf{H}^\mathsf{T}\mathbf{H}) = \cot^2(\phi/2)$ and $\kappa(\mathbf{H}) = \cot(\phi/2)$. The information that the two columns are distinct lives entirely in $1 - \cos\phi \approx \phi^2/2$, a difference of two numbers close to $1$. In float64 that difference is computed to an absolute accuracy of about $\varepsilon$, so once $\phi^2/2 < \varepsilon$ — an angle below about $2\times 10^{-8}\,\mathrm{rad}$, a condition number above about $10^8$ — the Gram matrix cannot tell the columns apart at all, even though $\mathbf{H}$ itself stores both columns to sixteen digits. The damage is done by the multiplication $\mathbf{H}^\mathsf{T}\mathbf{H}$, before any solver runs, and no care in the solver recovers it. QR never forms that product: $\mathbf{Q}^\mathsf{T}$ rotates the two columns so that the second's component perpendicular to the first, of length $\sin\phi \approx \phi$, is written directly into $r_{22}$, a number of size $10^{-8}$ stored to full relative precision.

That is the whole of "why you never form the normal equations": not that they are wrong, but that the forming step subtracts nearly equal numbers and throws away the small singular value, which is the very thing an ill-conditioned problem is about.

::: example Two nearly parallel columns, solved three ways
Build a $50\times 2$ matrix whose second column is the first plus $2\times 10^{-8}$ times a perpendicular unit vector, so the columns are $2\times 10^{-8}\,\mathrm{rad}$ apart and $\kappa(\mathbf{H}) = 1.00\times 10^8$. Set $\mathbf{y} = \mathbf{H}\mathbf{x}$ with $\mathbf{x} = (1, 1)^\mathsf{T}$ so the exact answer is known and there is no measurement noise, only round-off. Repeat with the perpendicular component scaled to give $\kappa = 10^2$, $10^4$ and $10^6$. Relative error $\lVert\hat{\mathbf{x}} - \mathbf{x}\rVert/\lVert\mathbf{x}\rVert$ in float64:

| $\kappa(\mathbf{H})$ | $\kappa\varepsilon$ | $\kappa^2\varepsilon$ | Normal equations | QR | SVD | Residual, normal eq. | Residual, QR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| $10^2$ | $2\times 10^{-14}$ | $2\times 10^{-12}$ | $5.6\times 10^{-13}$ | $2.2\times 10^{-15}$ | $1.0\times 10^{-15}$ | $1.1\times 10^{-14}$ | $5.5\times 10^{-16}$ |
| $10^4$ | $2\times 10^{-12}$ | $2\times 10^{-8}$ | $3.2\times 10^{-16}$ | $3.4\times 10^{-15}$ | $1.4\times 10^{-13}$ | $3.3\times 10^{-16}$ | $7.8\times 10^{-16}$ |
| $10^6$ | $2\times 10^{-10}$ | $2\times 10^{-4}$ | $5.6\times 10^{-5}$ | $2.3\times 10^{-12}$ | $1.1\times 10^{-11}$ | $1.1\times 10^{-10}$ | $2.8\times 10^{-16}$ |
| $10^8$ | $2\times 10^{-8}$ | $2$ | $1.0$ | $1.4\times 10^{-9}$ | $5.0\times 10^{-10}$ | $2.0\times 10^{-8}$ | $8.0\times 10^{-16}$ |

At $\kappa = 10^4$ the normal equations happened to do well — the $\kappa^2\varepsilon$ figure is a worst-case bound, and round-off sometimes cancels in your favour — which is exactly why a method that works in one test cannot be trusted from that test alone. At $\kappa = 10^6$ they have lost eleven of sixteen digits, as $\kappa^2\varepsilon$ predicts, and QR has lost four. At $\kappa = 10^8$ the normal equations return $\hat{\mathbf{x}} = (0.0,\ 2.0)^\mathsf{T}$ for a true $(1, 1)^\mathsf{T}$: a $100\%$ error in each parameter. Yet that wrong answer reproduces the data to $2\times 10^{-8}$, because the two columns are so nearly the same vector that $0\,\mathbf{h}_1 + 2\,\mathbf{h}_2$ and $1\,\mathbf{h}_1 + 1\,\mathbf{h}_2$ are almost the same point in $\mathbb{R}^{50}$. A residual of two parts in $10^8$ would pass any casual check. The parameters are nonetheless worthless, and if the two columns were the biases of two sensors, or a position and a velocity over a short arc, worthless parameters are what you would have shipped.
:::

```python
import numpy as np

rng = np.random.default_rng(1)
m = 50
h1 = rng.standard_normal(m); h1 /= np.linalg.norm(h1)
u = rng.standard_normal(m); u -= (u @ h1) * h1; u /= np.linalg.norm(u)
H = np.column_stack([h1, h1 + 2e-8 * u])   # two columns 2e-8 rad apart
y = H @ np.array([1.0, 1.0])               # exact answer is (1, 1)

print(f"cond(H) = {np.linalg.cond(H):.2e}")
x_ne = np.linalg.solve(H.T @ H, H.T @ y)   # normal equations
Q, R = np.linalg.qr(H)
x_qr = np.linalg.solve(R, Q.T @ y)         # QR
x_svd = np.linalg.lstsq(H, y, rcond=None)[0]
for name, x in (("normal", x_ne), ("QR", x_qr), ("SVD", x_svd)):
    print(f"{name:7s} x = {x}  residual = {np.linalg.norm(y - H @ x):.1e}")
# cond(H) = 1.00e+08
# normal  x = [-8.8817842e-16  2.0000000e+00]  residual = 2.0e-08
# QR      x = [1. 1.]  residual = 8.2e-16
# SVD     x = [1. 1.]  residual = 4.1e-16
```

::: warning A small residual is not a correct estimate
Least squares minimises the residual, and in an ill-conditioned problem the residual is insensitive to exactly the parameter combinations that are poorly determined. So the residual can be tiny while the parameters are wrong by $100\%$, as the table shows. If what you deliver downstream is the fitted curve — a smoothed trajectory, an interpolated clock — you may be safe. If you deliver the parameters — a bias, a lever arm, a scale factor — the residual tells you nothing about their quality. Look at $\kappa(\mathbf{H})$, or at the covariance, never at the residual alone.
:::

::: warning Never compute the inverse
$(\mathbf{H}^\mathsf{T}\mathbf{H})^{-1}\mathbf{H}^\mathsf{T}\mathbf{y}$ is how the estimate is *written*. Computing an explicit inverse costs about three times a Cholesky solve, is less accurate, and destroys sparsity. If you must go through the normal equations — because the matrix is enormous and sparse, or because rows arrive one at a time and you accumulate $\mathbf{H}^\mathsf{T}\mathbf{H}$ incrementally — use `scipy.linalg.cho_solve` or `np.linalg.solve`. Form the inverse only when you need the full covariance matrix, and then form it from a factor.
:::

## Where nearly parallel columns come from

A column of $\mathbf{H}$ is the signature of one unknown in the measurements: how every measurement would change if that unknown alone changed by one unit. Two columns are nearly parallel when two unknowns leave nearly the same signature, and the data then cannot tell which of them is responsible. Three situations produce this constantly.

**Two sensors observing nearly the same direction.** Ranges to two beacons that lie within a degree of each other, as seen from the vehicle, have line-of-sight rows that are almost identical; the sum of the two position components along that line is well determined and the difference across it is not. Two GNSS satellites close together in the sky do the same to a position fix.

**A short arc.** Fitting a position and a velocity — or a bias and a drift — from data spanning a short interval makes the drift column $t$ nearly proportional to the bias column $1$ unless time is recentred on the arc. Over an arc of $1\,\mathrm{s}$ sampled at $t \approx 1000\,\mathrm{s}$ the two columns differ in direction by only $3.2\times 10^{-4}\,\mathrm{rad}$ and in length by a factor of a thousand, and $\kappa(\mathbf{H}) = 3.2\times 10^{6}$ for a problem that has $\kappa = 3.2$ when $t$ is measured from the middle of the arc. Rescaling and recentring are free; do them first.

**Parameters that trade off.** A constant accelerometer bias and a small tilt of the platform produce the same constant offset in a level-axis accelerometer while the vehicle sits still; only a manoeuvre separates them. An unmodelled force and a drag coefficient trade off over a single orbit. In these cases the collinearity is a statement about the experiment, not the arithmetic, and the fix is a better experiment or fewer parameters. The lesson on the condition number as an observability metric, later in this module, makes that diagnosis systematic.

::: key Choosing the solver
All three routes give the same $\hat{\mathbf{x}}$ in exact arithmetic. Normal equations lose about $2\log_{10}\kappa(\mathbf{H})$ digits, QR and the SVD about $\log_{10}\kappa(\mathbf{H})$. Default to QR (`np.linalg.qr`, or `np.linalg.lstsq` which uses the SVD); use the SVD when the rank is in doubt; use the normal equations only when the problem is huge and sparse or the rows arrive incrementally, and then whiten and scale first.
:::

::: note The estimate before the data
The covariance $\sigma^2(\mathbf{H}^\mathsf{T}\mathbf{H})^{-1}$ contains no measured value. This is the basis of every mission-design tradeoff in navigation: you can compute the accuracy a tracking schedule, a beacon layout or a calibration procedure will deliver before flying it, and the GNSS module's dilution of precision is exactly this matrix with $\mathbf{H}$ built from satellite line-of-sight vectors. What the data add is a check that $\sigma$ was honest, through $\hat{\sigma}^2 = \lVert\hat{\mathbf{v}}\rVert^2/(m - n)$.
:::

## Check yourself

::: check
A fit uses $m = 12$ measurements to estimate $n = 3$ parameters. What is the trace of the hat matrix $\boldsymbol{\Pi}$, what is the expected value of $\lVert\hat{\mathbf{v}}\rVert^2$ if the noise has variance $\sigma^2 = 4\,\mathrm{m^2}$, and how many degrees of freedom does the residual have?
:::

::: answer
$\mathrm{tr}\,\boldsymbol{\Pi} = \mathrm{rank}\,\boldsymbol{\Pi} = n = 3$. The residual covariance is $\sigma^2(\mathbf{I} - \boldsymbol{\Pi})$, whose trace is $\sigma^2(m - n) = 4\times 9 = 36\,\mathrm{m^2}$, so $\mathbb{E}\lVert\hat{\mathbf{v}}\rVert^2 = 36\,\mathrm{m^2}$. The residual has $m - n = 9$ degrees of freedom: twelve numbers, three of them consumed by the fit. Dividing the observed $\lVert\hat{\mathbf{v}}\rVert^2$ by $9$, not $12$, gives an unbiased $\hat{\sigma}^2$.
:::

::: check
One measurement in a fit has leverage $\Pi_{ii} = 0.95$. The noise standard deviation is $\sigma = 1\,\mathrm{m}$. What standard deviation should you expect for that measurement's residual, and what does this mean if the measurement is in fact an outlier that is $5\,\mathrm{m}$ off?
:::

::: answer
The residual variance is $\sigma^2(1 - \Pi_{ii}) = 0.05\,\mathrm{m^2}$, so its standard deviation is $0.224\,\mathrm{m}$: the fit absorbs $95\%$ of whatever that point does. If the point is $5\,\mathrm{m}$ wrong, the fit moves toward it and its own residual ends up around $5\times(1 - 0.95) = 0.25\,\mathrm{m}$, while the *other* residuals grow. A high-leverage outlier hides in its own residual and shows up in everyone else's. The remedy is to compare residuals to $\sigma\sqrt{1 - \Pi_{ii}}$ rather than to $\sigma$, and to be suspicious of points whose leverage is far above the average $n/m$.
:::

::: check
Two unit columns of a measurement matrix are $\phi = 10^{-5}\,\mathrm{rad}$ apart. Estimate $\kappa(\mathbf{H})$ and $\kappa(\mathbf{H}^\mathsf{T}\mathbf{H})$, and the digits left by the normal equations and by QR in float64.
:::

::: answer
$\kappa(\mathbf{H}) = \cot(\phi/2) \approx 2/\phi = 2\times 10^5$ and $\kappa(\mathbf{H}^\mathsf{T}\mathbf{H}) = \cot^2(\phi/2) \approx 4\times 10^{10}$. QR loses about $\log_{10}(2\times 10^5) = 5.3$ digits, leaving about $10.7$ of float64's $16$. The normal equations lose about $10.6$, leaving about $5.4$. Both are usable here; at $\phi = 10^{-8}$ the normal equations would keep none and QR would keep about eight.
:::

::: check
The clock example gave $\hat{\sigma} = 0.155\,\mathrm{m}$ from the residuals against an assumed $\sigma = 0.5\,\mathrm{m}$. If the true noise really were $0.155\,\mathrm{m}$, what would the standard deviations of $\hat{c}_0$ and $\hat{c}_1$ be, and which factor in the covariance formula changed?
:::

::: answer
The covariance is $\sigma^2(\mathbf{H}^\mathsf{T}\mathbf{H})^{-1}$, and only $\sigma$ changed; the geometry factor is unchanged. Every standard deviation scales by $0.155/0.5 = 0.31$: the bias to $0.362\times 0.31 = 0.112\,\mathrm{m}$ and the drift to $0.0120\times 0.31 = 0.0037\,\mathrm{m/s}$. The correlation between them, $-0.00357/\sqrt{0.1310\times 1.43\times 10^{-4}} = -0.826$, does not change at all, because it is a property of the time tags alone.
:::

::: check
Why is the residual $\hat{\mathbf{v}}$ independent of the true state $\mathbf{x}$, and what practical use does that have?
:::

::: answer
$\hat{\mathbf{v}} = (\mathbf{I} - \boldsymbol{\Pi})\mathbf{y} = (\mathbf{I} - \boldsymbol{\Pi})(\mathbf{H}\mathbf{x} + \mathbf{v}) = (\mathbf{I} - \boldsymbol{\Pi})\mathbf{v}$, because $\boldsymbol{\Pi}$ projects onto the column space of $\mathbf{H}$ and so leaves $\mathbf{H}\mathbf{x}$ unchanged; the model part is removed exactly. The residual is therefore a filtered copy of the noise, whatever the truth. Practically, that means the residuals can be tested against the noise model — is their scaled squared length near $m - n$, are they uncorrelated, do they have zero mean — with no knowledge of the answer. When they fail those tests, either the noise model or the measurement model is wrong, and the failure is visible in flight.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\mathbf{y} = \mathbf{H}\mathbf{x} + \mathbf{v}$ | Linear measurement model: $m$ measurements, $n$ unknowns, row $\mathbf{h}_i^\mathsf{T}$ per measurement |
| $J = \tfrac{1}{2}\lVert\mathbf{y} - \mathbf{H}\mathbf{x}\rVert^2$ | Least-squares cost |
| $\hat{\mathbf{x}} = (\mathbf{H}^\mathsf{T}\mathbf{H})^{-1}\mathbf{H}^\mathsf{T}\mathbf{y}$ | Normal-equation solution; linear in $\mathbf{y}$; unbiased |
| $\hat{\mathbf{x}} - \mathbf{x} = \mathbf{K}\mathbf{v}$, $\operatorname{Cov} = \sigma^2(\mathbf{H}^\mathsf{T}\mathbf{H})^{-1}$ | Estimation error and covariance under white noise; independent of the data values |
| $\boldsymbol{\Pi} = \mathbf{H}(\mathbf{H}^\mathsf{T}\mathbf{H})^{-1}\mathbf{H}^\mathsf{T}$ | Hat matrix: symmetric, idempotent, trace $n$; leverage $\Pi_{ii}$ |
| $\hat{\mathbf{v}} = (\mathbf{I} - \boldsymbol{\Pi})\mathbf{v}$, $\operatorname{Cov} = \sigma^2(\mathbf{I} - \boldsymbol{\Pi})$ | Residual depends on the noise only; residual variance $\sigma^2(1 - \Pi_{ii})$ |
| $\hat{\sigma}^2 = \lVert\hat{\mathbf{v}}\rVert^2/(m - n)$ | Unbiased noise variance from the fit; $m - n$ degrees of freedom |
| $\kappa(\mathbf{H}) = \cot(\phi/2)$ for two unit columns at angle $\phi$ | Nearly parallel columns; Gram matrix keeps only $1 - \cos\phi \approx \phi^2/2$ |
| Errors $\sim\kappa^2\varepsilon$ (normal equations), $\sim\kappa\varepsilon$ (QR, SVD) | Digit loss; the forming of $\mathbf{H}^\mathsf{T}\mathbf{H}$ does the damage |

Everything above treated every measurement as equally trustworthy. The next lesson weights each measurement by its own noise, which changes the estimate, changes the covariance, and introduces the information matrix that the rest of the module is built on.
