---
id: l01-linear-least-squares-normal-equations-qr-svd
title: The linear least squares problem
minutes: 20
covers:
  - The linear least squares problem; normal equations, QR, and SVD solutions
---

Five friends each time the same runner with a stopwatch. The watches read $12.3$, $12.1$, $12.4$, $12.2$ and $12.5$ seconds. Nobody is exactly right, and nobody is wildly wrong. What single time should you write down? Most people would average them. This lesson is about why the average is the right answer, and what the same idea looks like when there is more than one unknown.

A navigation computer faces this puzzle all the time, with more numbers. A GPS receiver hears eight **[[pseudoranges|pseudorange]]** — distance-like measurements to eight satellites — and wants four unknowns: three position coordinates and its own clock error. A star tracker sees fifteen stars and wants three attitude angles. A gyro on a spinning test table gives two hundred readings and you want its scale factor and its bias. Every time there are more measurements than unknowns, every measurement is a little wrong, and you need one best answer.

The rule that picks it is **least squares**: choose the unknowns that make the squared misfits as small as possible. You met the mathematics in Linear Algebra I and II. This lesson restates it in the language estimation uses. Then it adds two things: the leftover misfit treated as a random quantity, and a warning experiment where one way of computing the answer returns nonsense while looking perfect.

## The measurement model

Picture a spreadsheet. Each row is one measurement. Each column is one unknown. The number in a cell says how much that measurement would change if that unknown went up by one unit. That spreadsheet is a matrix, and the whole problem fits in one line.

We write the measurements as a column vector $\mathbf{y}$ with $m$ entries, the unknowns as a vector $\mathbf{x}$ with $n$ entries, and the noise — the part of each measurement that is wrong — as $\mathbf{v}$. The spreadsheet is the $m\times n$ **measurement matrix** $\mathbf{H}$ (also called the design matrix or observation matrix). The **linear measurement model** is

$$
\mathbf{y} = \mathbf{H}\mathbf{x} + \mathbf{v}, \qquad \mathbf{y}\in\mathbb{R}^m,\quad \mathbf{x}\in\mathbb{R}^n,\quad m \ge n .
$$

Row $i$ of $\mathbf{H}$ is written $\mathbf{h}_i^\mathsf{T}$ (read "h sub i transpose"), so measurement $i$ says $y_i = \mathbf{h}_i^\mathsf{T}\mathbf{x} + v_i$. Three real rows:

- A receiver clock modelled as bias plus drift: $\mathbf{h}_i^\mathsf{T} = (1,\ t_i)$.
- A range to a beacon, linearized about a guessed position: $\mathbf{h}_i^\mathsf{T}$ is the unit vector along the line of sight.
- A gyro on a rate table spinning at $\omega_i$, with unknowns scale factor and bias: $\mathbf{h}_i^\mathsf{T} = (\omega_i,\ 1)$.

You write the rows from physics before you see any data. $\mathbf{H}$ is the model; $\mathbf{y}$ is the evidence.

In this module the unknowns are called the **state** or the **parameters**. States can move and parameters cannot, but nothing moves yet, so the words mean the same thing here. For now assume only two things about the noise: its mean is zero, and its covariance is $\sigma^2\mathbf{I}$. That says every measurement is equally noisy, with standard deviation $\sigma$ (read "sigma"), and no two are linked. The next lesson drops that assumption.

## The least-squares rule

An **estimator** is any rule that turns the data $\mathbf{y}$ into a guess $\hat{\mathbf{x}}$ (read "x hat"; the hat always marks an estimate). **Least squares** picks the guess that makes the model reproduce the data as closely as possible:

$$
\hat{\mathbf{x}} = \arg\min_{\mathbf{x}}\ J(\mathbf{x}), \qquad J(\mathbf{x}) = \tfrac{1}{2}\,\lVert\mathbf{y} - \mathbf{H}\mathbf{x}\rVert^2 .
$$

Read $\arg\min$ as "the $\mathbf{x}$ that makes this smallest", and $\lVert\cdot\rVert$ as "length of". So $J$ is half the sum of the squared misfits. For the five stopwatches, $\mathbf{H}$ is a column of five ones, and the $\mathbf{x}$ that minimizes $J$ is the average, $12.3\,\mathrm{s}$.

Setting the slope of $J$ to zero gives the **normal equations**. When the columns of $\mathbf{H}$ are independent (**full column rank**), they have one solution:

$$
\mathbf{H}^\mathsf{T}\mathbf{H}\,\hat{\mathbf{x}} = \mathbf{H}^\mathsf{T}\mathbf{y}
\quad\Longrightarrow\quad
\hat{\mathbf{x}} = (\mathbf{H}^\mathsf{T}\mathbf{H})^{-1}\mathbf{H}^\mathsf{T}\mathbf{y} .
$$

::: note Why it has to be true
Expand $2J = \mathbf{y}^\mathsf{T}\mathbf{y} - 2\mathbf{x}^\mathsf{T}\mathbf{H}^\mathsf{T}\mathbf{y} + \mathbf{x}^\mathsf{T}\mathbf{H}^\mathsf{T}\mathbf{H}\mathbf{x}$. By the matrix-calculus rules, the gradient of $J$ is $-\mathbf{H}^\mathsf{T}(\mathbf{y} - \mathbf{H}\mathbf{x})$. At a minimum the gradient is zero, which is the normal equations. It is a minimum and not a maximum because $\mathbf{H}^\mathsf{T}\mathbf{H}$ is positive definite when $\mathbf{H}$ has full column rank: $\mathbf{z}^\mathsf{T}\mathbf{H}^\mathsf{T}\mathbf{H}\mathbf{z} = \lVert\mathbf{H}\mathbf{z}\rVert^2 > 0$ for any $\mathbf{z}\neq\mathbf{0}$, so $J$ is a bowl.
:::

The picture behind it is a shadow. The vectors $\mathbf{H}\mathbf{x}$ you can make, as $\mathbf{x}$ varies, form a flat sheet called the column space of $\mathbf{H}$. The data $\mathbf{y}$ usually sit off the sheet, because of noise. The best fit $\mathbf{H}\hat{\mathbf{x}}$ is the foot of the perpendicular from $\mathbf{y}$ down to the sheet — the **[[orthogonal projection|projection-picture]]**. The normal equations say exactly that the leftover is perpendicular to every column.

### Two facts in estimation language

First, $\hat{\mathbf{x}}$ is a **linear function of the data**: $\hat{\mathbf{x}} = \mathbf{K}\mathbf{y}$ with $\mathbf{K} = (\mathbf{H}^\mathsf{T}\mathbf{H})^{-1}\mathbf{H}^\mathsf{T}$, the pseudoinverse $\mathbf{H}^+$ of Linear Algebra II. So the statistics of $\hat{\mathbf{x}}$ come from the linear-transformation rule $\mathbf{P}_y = \mathbf{A}\mathbf{P}_x\mathbf{A}^\mathsf{T}$ applied to $\mathbf{K}$.

Second, put the model into the estimator:

$$
\hat{\mathbf{x}} = \mathbf{K}(\mathbf{H}\mathbf{x} + \mathbf{v}) = \mathbf{x} + \mathbf{K}\mathbf{v}, \qquad \mathbf{K}\mathbf{H} = \mathbf{I}.
$$

The error $\hat{\mathbf{x}} - \mathbf{x} = \mathbf{K}\mathbf{v}$ is the noise passed through $\mathbf{K}$. Its mean is zero, so the estimate is **unbiased**: on average it lands on the truth. Its covariance is $\mathbf{K}(\sigma^2\mathbf{I})\mathbf{K}^\mathsf{T} = \sigma^2(\mathbf{H}^\mathsf{T}\mathbf{H})^{-1}$.

Look at what that formula contains: the geometry $\mathbf{H}$ and the noise level $\sigma$. It contains no measured value. You can compute how good the fit will be before taking a single measurement.

::: key Normal equations
$\hat{\mathbf{x}} = (\mathbf{H}^\mathsf{T}\mathbf{H})^{-1}\mathbf{H}^\mathsf{T}\mathbf{y}$ minimises $\lVert\mathbf{y} - \mathbf{H}\mathbf{x}\rVert^2$. It is correct in exact arithmetic; numerically, forming $\mathbf{H}^\mathsf{T}\mathbf{H}$ squares the condition number, so prefer QR or the SVD. Under noise of covariance $\sigma^2\mathbf{I}$ the estimate is unbiased with covariance $\sigma^2(\mathbf{H}^\mathsf{T}\mathbf{H})^{-1}$.
:::

## The residual and the hat matrix

The **post-fit residual** $\hat{\mathbf{v}}$ is what the model could not explain — data minus fit:

$$
\hat{\mathbf{v}} = \mathbf{y} - \mathbf{H}\hat{\mathbf{x}} = (\mathbf{I} - \boldsymbol{\Pi})\,\mathbf{y}, \qquad \boldsymbol{\Pi} = \mathbf{H}(\mathbf{H}^\mathsf{T}\mathbf{H})^{-1}\mathbf{H}^\mathsf{T} .
$$

The $m\times m$ matrix $\boldsymbol{\Pi}$ (capital "pi") is the projection onto the column space. Statisticians call it the **[[hat matrix|hat-matrix-name]]**, because it puts the hat on $\mathbf{y}$: $\hat{\mathbf{y}} = \mathbf{H}\hat{\mathbf{x}} = \boldsymbol{\Pi}\mathbf{y}$. Four properties:

- It is symmetric.
- It is **idempotent**: $\boldsymbol{\Pi}^2 = \boldsymbol{\Pi}$. Casting a shadow of a shadow changes nothing.
- $\boldsymbol{\Pi}\mathbf{H} = \mathbf{H}$. Anything already on the sheet stays put.
- Its trace (sum of the diagonal) equals its rank, $n$. Cycling the product inside the trace turns $\mathrm{tr}\,\mathbf{H}(\mathbf{H}^\mathsf{T}\mathbf{H})^{-1}\mathbf{H}^\mathsf{T}$ into $\mathrm{tr}\,(\mathbf{H}^\mathsf{T}\mathbf{H})^{-1}\mathbf{H}^\mathsf{T}\mathbf{H} = \mathrm{tr}\,\mathbf{I}_n = n$.

Now put the model into the residual. Because $\boldsymbol{\Pi}\mathbf{H}\mathbf{x} = \mathbf{H}\mathbf{x}$,

$$
\hat{\mathbf{v}} = (\mathbf{I} - \boldsymbol{\Pi})(\mathbf{H}\mathbf{x} + \mathbf{v}) = (\mathbf{I} - \boldsymbol{\Pi})\,\mathbf{v}.
$$

The true state has vanished. Whatever $\mathbf{x}$ is, the residual is a fixed function of the noise alone. That is why residuals can test the noise model and the measurement model without anyone knowing the answer.

Using symmetry and idempotence, the residual's covariance is $\sigma^2(\mathbf{I} - \boldsymbol{\Pi})$. Read the diagonal: residual $i$ has variance $\sigma^2(1 - \Pi_{ii})$, *smaller* than the noise itself. The fitted line bends toward each point and swallows part of its noise. The diagonal entry $\Pi_{ii}$ is the **[[leverage|leverage-bars]]** of measurement $i$: how hard that one point pulls the fit toward itself. Leverages lie between $0$ and $1$ and add up to $n$. A point with leverage near $1$ is fitted almost exactly whatever it says, so an outlier there hides in its own residual. The residual-analysis lesson later in this module builds on that.

### Estimating the noise from the fit

Take the trace of the residual covariance: $\mathbb{E}\lVert\hat{\mathbf{v}}\rVert^2 = \sigma^2\,\mathrm{tr}(\mathbf{I} - \boldsymbol{\Pi}) = \sigma^2(m - n)$. ($\mathbb{E}$ means "the average over many repeats".) Divide by $m - n$ and you get an unbiased estimate of the noise variance:

$$
\hat{\sigma}^2 = \frac{\lVert\hat{\mathbf{v}}\rVert^2}{m - n}.
$$

The number $m - n$ is the residual's **[[degrees of freedom|degrees-of-freedom]]**: $m$ numbers, $n$ of them spent on the fit. Fitting a single mean is the case $n = 1$, which gives the familiar divide-by-$(m-1)$ rule, Bessel's correction. The chi-square lesson showed that $\lVert\hat{\mathbf{v}}\rVert^2/\sigma^2$ follows a $\chi^2_{m-n}$ distribution.

::: example A receiver clock over fifty seconds
A GPS receiver's clock error, in meters of light-travel, is sampled every $10\,\mathrm{s}$. At $t = 0, 10, \ldots, 50\,\mathrm{s}$ it reads $1250.00$, $1282.15$, $1313.86$, $1345.55$, $1377.77$ and $1409.50\,\mathrm{m}$, each with noise of about $\sigma = 0.5\,\mathrm{m}$. Model the clock as bias plus drift, $y = c_0 + c_1 t$. So $\mathbf{x} = (c_0, c_1)^\mathsf{T}$ and each row of $\mathbf{H}$ is $(1, t_i)$.

**Build the normal equations.** With $\sum t_i = 150$ and $\sum t_i^2 = 5500$,

$$
\mathbf{H}^\mathsf{T}\mathbf{H} = \begin{pmatrix} 6 & 150 \\ 150 & 5500 \end{pmatrix}, \qquad
\mathbf{H}^\mathsf{T}\mathbf{y} = \begin{pmatrix} 7978.83 \\ 205\,051.0 \end{pmatrix}.
$$

**Invert.** The determinant is $6\times 5500 - 150^2 = 10\,500$, so

$$
(\mathbf{H}^\mathsf{T}\mathbf{H})^{-1} = \frac{1}{10\,500}\begin{pmatrix} 5500 & -150 \\ -150 & 6 \end{pmatrix} = \begin{pmatrix} 0.52381 & -0.014286 \\ -0.014286 & 0.00057143 \end{pmatrix},
$$

and multiplying by $\mathbf{H}^\mathsf{T}\mathbf{y}$ gives $\hat{\mathbf{x}} = (1250.087\,\mathrm{m},\ 3.1887\,\mathrm{m/s})^\mathsf{T}$.

**Same answer by QR.** Factoring $\mathbf{H} = \mathbf{Q}\mathbf{R}$ gives $\mathbf{R} = \begin{pmatrix} -2.4495 & -61.237 \\ 0 & 41.833 \end{pmatrix}$ and $\mathbf{Q}^\mathsf{T}\mathbf{y} = (-3257.34,\ 133.393)^\mathsf{T}$. Back substitution solves the bottom row first: $c_1 = 133.393/41.833 = 3.1887$, then $c_0 = 1250.087$. (NumPy's QR picks a negative first pivot; the signs cancel in the solve.)

**Residuals.** $\hat{\mathbf{v}} = (-0.087,\ 0.176,\ -0.001,\ -0.199,\ 0.134,\ -0.023)^\mathsf{T}\,\mathrm{m}$. They add to zero (perpendicular to the column of ones) and $\sum t_i\hat{v}_i = 0$ (perpendicular to the column of times), both to round-off. Their squared length is $0.09646\,\mathrm{m^2}$. With $m - n = 4$, $\hat{\sigma}^2 = 0.0241\,\mathrm{m^2}$ and $\hat{\sigma} = 0.155\,\mathrm{m}$ — a third of the assumed $0.5\,\mathrm{m}$. Six samples are too few to conclude much: with four degrees of freedom the chi-square interval is wide.

**Leverages.** The diagonal of $\boldsymbol{\Pi}$ is $0.524, 0.295, 0.181, 0.181, 0.295, 0.524$, adding to $2 = n$. The two end points pull on the fit almost three times as hard as the middle ones.

**Covariance.** With the assumed $\sigma = 0.5\,\mathrm{m}$, $\sigma^2(\mathbf{H}^\mathsf{T}\mathbf{H})^{-1}$ has diagonal $0.1310\,\mathrm{m^2}$ and $1.43\times 10^{-4}\,\mathrm{m^2/s^2}$. So the bias is known to $0.362\,\mathrm{m}$ and the drift to $0.0120\,\mathrm{m/s}$. The off-diagonal $-0.00357\,\mathrm{m^2/s}$ says the two errors lean against each other: overestimate the bias at $t = 0$ and you underestimate the drift, because the line must still pass through the cloud of points.

**Sanity check.** The drift, $3.19\,\mathrm{m/s}$, matches the raw data: the readings climb about $31.9\,\mathrm{m}$ every $10\,\mathrm{s}$.
:::

## Three ways to compute the same vector

There are three standard ways to solve a least-squares problem on a computer. In exact arithmetic they agree. On a real computer they do not.

| Route | Works with | Cost ($m \gg n$) | Error in $\hat{\mathbf{x}}$ | Needs |
| --- | --- | --- | --- | --- |
| Normal equations, Cholesky | $\mathbf{H}^\mathsf{T}\mathbf{H}$ | $\approx mn^2$ | $\sim\kappa(\mathbf{H})^2\,\varepsilon$ | full column rank |
| QR (Householder) | $\mathbf{H}$ | $\approx 2mn^2$ | $\sim\kappa(\mathbf{H})\,\varepsilon$ | full column rank |
| SVD | $\mathbf{H}$ | $\approx 2mn^2 + 11n^3$ | $\sim\kappa(\mathbf{H})\,\varepsilon$ | nothing; reveals rank |

Here $\varepsilon = 2.2\times 10^{-16}$ (read "epsilon") is the **[[float64|float64]]** unit round-off, the smallest relative step a standard double-precision number can take. $\kappa(\mathbf{H}) = \sigma_{\max}/\sigma_{\min}$ (read "kappa") is the **condition number**, the ratio of the largest to the smallest singular value. QR factors $\mathbf{H} = \mathbf{Q}\mathbf{R}$, with $\mathbf{Q}$ a rotation and $\mathbf{R}$ triangular, and solves $\mathbf{R}\hat{\mathbf{x}} = \mathbf{Q}^\mathsf{T}\mathbf{y}$. The SVD returns $\hat{\mathbf{x}} = \sum_i (\mathbf{u}_i^\mathsf{T}\mathbf{y}/\sigma_i)\,\mathbf{v}_i$ and shows you the $\sigma_i$, so you can see how close to singular the problem is.

### Why the first route loses twice as many digits

Take two unit columns with a small angle $\phi$ (read "phi") between them — **[[nearly parallel|nearly-parallel]]**. Their Gram matrix $\mathbf{H}^\mathsf{T}\mathbf{H}$ — the table of dot products of the columns — is

$$
\mathbf{H}^\mathsf{T}\mathbf{H} = \begin{pmatrix} 1 & \cos\phi \\ \cos\phi & 1 \end{pmatrix}, \qquad \det = 1 - \cos^2\phi = \sin^2\phi ,
$$

with eigenvalues $1 \pm \cos\phi$. So $\kappa(\mathbf{H}^\mathsf{T}\mathbf{H}) = \cot^2(\phi/2)$ and $\kappa(\mathbf{H}) = \cot(\phi/2)$.

Here is the trouble. Everything that tells the two columns apart lives in $1 - \cos\phi \approx \phi^2/2$, a difference of two numbers close to $1$. A computer stores that difference only to an absolute accuracy of about $\varepsilon$. Once $\phi^2/2 < \varepsilon$ — an angle below about $2\times 10^{-8}\,\mathrm{rad}$, a condition number above about $10^8$ — the Gram matrix cannot tell the columns apart at all. Yet $\mathbf{H}$ itself stores both columns to sixteen digits. The damage is done by the multiplication $\mathbf{H}^\mathsf{T}\mathbf{H}$, before any solver runs, and no care in the solver can undo it.

QR never forms that product. Its rotation $\mathbf{Q}^\mathsf{T}$ turns the columns so that the second column's sideways part, of length $\sin\phi \approx \phi$, lands directly in $r_{22}$. That is a number of size $10^{-8}$, stored to full relative precision.

So the normal equations are not wrong. The step of forming them subtracts nearly equal numbers and throws away the small singular value — the very thing an ill-conditioned problem is about.

::: example Two nearly parallel columns, solved three ways
Build a $50\times 2$ matrix. The first column is a random unit vector. The second is the first plus $2/\kappa$ times a perpendicular unit vector, so the columns are $2/\kappa$ radians apart and the condition number is $\kappa$. Set $\mathbf{y} = \mathbf{H}\mathbf{x}$ with $\mathbf{x} = (1, 1)^\mathsf{T}$. The answer is known exactly and there is no measurement noise: only round-off. The code below gives the relative error $\lVert\hat{\mathbf{x}} - \mathbf{x}\rVert/\lVert\mathbf{x}\rVert$ in float64:

| $\kappa(\mathbf{H})$ | $\kappa\varepsilon$ | $\kappa^2\varepsilon$ | Normal equations | QR | SVD |
| --- | --- | --- | --- | --- | --- |
| $10^2$ | $2\times 10^{-14}$ | $2\times 10^{-12}$ | $5.6\times 10^{-13}$ | $2.9\times 10^{-15}$ | $3.5\times 10^{-16}$ |
| $10^4$ | $2\times 10^{-12}$ | $2\times 10^{-8}$ | $5.6\times 10^{-9}$ | $3.1\times 10^{-13}$ | $6.3\times 10^{-15}$ |
| $10^6$ | $2\times 10^{-10}$ | $2\times 10^{-4}$ | $5.6\times 10^{-5}$ | $2.1\times 10^{-11}$ | $1.3\times 10^{-11}$ |
| $10^8$ | $2\times 10^{-8}$ | $2$ | $1.0$ | $1.8\times 10^{-9}$ | $5.7\times 10^{-10}$ |

**Read the columns.** The normal-equation error tracks $\kappa^2\varepsilon$ — it grows a hundredfold each row. QR and the SVD track $\kappa\varepsilon$. At $\kappa = 10^6$ the normal equations keep about four of sixteen digits, and QR keeps about eleven.

**The last row.** At $\kappa = 10^8$ the normal equations return $\hat{\mathbf{x}} = (0.0,\ 2.0)^\mathsf{T}$ for a true $(1, 1)^\mathsf{T}$: $100\%$ wrong in each parameter. Yet that answer reproduces the data to about $2\times 10^{-8}$. The two columns are so nearly the same vector that $0\,\mathbf{h}_1 + 2\,\mathbf{h}_2$ and $1\,\mathbf{h}_1 + 1\,\mathbf{h}_2$ are almost the same point. A residual of two parts in a hundred million passes any casual check. If the two columns were the biases of two sensors, those worthless numbers are what you would have shipped.

The $\kappa^2\varepsilon$ figure is a bound, not a promise. Round-off sometimes cancels, and the last digits can change on another machine. What does not change is the trend.
:::

```python
import numpy as np

rng = np.random.default_rng(1)
m = 50
h1 = rng.standard_normal(m); h1 /= np.linalg.norm(h1)
u = rng.standard_normal(m); u -= (u @ h1) * h1; u /= np.linalg.norm(u)
x_true = np.array([1.0, 1.0])

for kappa in (1e2, 1e4, 1e6, 1e8):
    H = np.column_stack([h1, h1 + (2 / kappa) * u])   # columns 2/kappa rad apart
    y = H @ x_true                                     # exact data, no noise
    x_ne = np.linalg.solve(H.T @ H, H.T @ y)           # normal equations
    Q, R = np.linalg.qr(H)
    x_qr = np.linalg.solve(R, Q.T @ y)                 # QR
    x_svd = np.linalg.lstsq(H, y, rcond=None)[0]       # SVD
    err = [np.linalg.norm(x - x_true) / np.linalg.norm(x_true)
           for x in (x_ne, x_qr, x_svd)]
    print(f"cond {np.linalg.cond(H):.0e}  errors NE {err[0]:.1e}"
          f"  QR {err[1]:.1e}  SVD {err[2]:.1e}")
print("last NE answer:", x_ne)
# cond 1e+02  errors NE 5.6e-13  QR 2.9e-15  SVD 3.5e-16
# cond 1e+04  errors NE 5.6e-09  QR 3.1e-13  SVD 6.3e-15
# cond 1e+06  errors NE 5.6e-05  QR 2.1e-11  SVD 1.3e-11
# cond 1e+08  errors NE 1.0e+00  QR 1.8e-09  SVD 5.7e-10
# last NE answer: [-8.8817842e-16  2.0000000e+00]
```

::: warning A small residual is not a correct estimate
Least squares makes the residual small. In an ill-conditioned problem, the residual hardly notices the very parameter combinations that are poorly pinned down. So the residual can be tiny while the parameters are $100\%$ wrong, as the last row shows. If you deliver the fitted curve — a smoothed trajectory, an interpolated clock — you may be safe. If you deliver the parameters — a bias, a lever arm, a scale factor — the residual tells you nothing about their quality. Look at $\kappa(\mathbf{H})$, or at the covariance, never at the residual alone.
:::

::: warning Never compute the inverse
$(\mathbf{H}^\mathsf{T}\mathbf{H})^{-1}\mathbf{H}^\mathsf{T}\mathbf{y}$ is how the estimate is *written*, not how it is computed. An explicit inverse costs about three times a Cholesky solve, is less accurate, and destroys sparsity (the zeros that make big problems cheap). If you must use the normal equations — the matrix is huge and sparse, or rows arrive one at a time — solve them with `scipy.linalg.cho_solve` or `np.linalg.solve`. Form an inverse only when you need the full covariance matrix, and then form it from a factor.
:::

## Where nearly parallel columns come from

A column of $\mathbf{H}$ is the fingerprint of one unknown: how every measurement would change if that unknown alone went up by one. Two columns are nearly parallel when two unknowns leave nearly the same fingerprint. Then the data cannot tell which one is responsible. Three situations do this all the time.

**Two sensors looking in nearly the same direction.** Ranges to two beacons within a degree of each other, as seen from the vehicle, have almost identical rows. Position along that line is well determined; position across it is not. Two GPS satellites close together in the sky do the same to a position fix.

**A short arc.** Fit a bias and a drift from data spanning a short time, and the drift column $t$ is nearly proportional to the bias column of ones — unless you measure time from the middle of the arc. Over a $1\,\mathrm{s}$ arc at $t \approx 1000\,\mathrm{s}$, the two columns differ in direction by only $3.2\times 10^{-4}\,\mathrm{rad}$ and in length by a factor of a thousand, and $\kappa(\mathbf{H}) = 3.2\times 10^{6}$. Measure $t$ from the middle of the arc and the same problem has $\kappa = 3.2$. Rescaling and recentering are free; do them first.

**Parameters that trade off.** While a vehicle sits still, a constant accelerometer bias and a small tilt of the platform produce the same constant offset. Only a maneuver separates them. An unmodeled force and a drag coefficient trade off over a single orbit. Here the problem is the experiment, not the arithmetic, and the fix is a better experiment or fewer parameters. The lesson on the condition number as an observability metric, later in this module, makes that diagnosis systematic.

::: key Choosing the solver
All three routes give the same $\hat{\mathbf{x}}$ in exact arithmetic. Normal equations lose about $2\log_{10}\kappa(\mathbf{H})$ digits, QR and the SVD about $\log_{10}\kappa(\mathbf{H})$. Default to QR (`np.linalg.qr`, or `np.linalg.lstsq`, which uses the SVD); use the SVD when the rank is in doubt; use the normal equations only when the problem is huge and sparse or the rows arrive incrementally, and then whiten and scale first.
:::

::: note The estimate before the data
The covariance $\sigma^2(\mathbf{H}^\mathsf{T}\mathbf{H})^{-1}$ contains no measured value. That is the basis of every mission-design tradeoff in navigation. You can compute the accuracy a tracking schedule, a beacon layout or a calibration procedure will deliver before flying it. The GNSS module's **[[dilution of precision|dop-bridge]]** is exactly this matrix, with $\mathbf{H}$ built from satellite line-of-sight vectors. What the data add is a check that $\sigma$ was honest, through $\hat{\sigma}^2 = \lVert\hat{\mathbf{v}}\rVert^2/(m - n)$.
:::

## Check yourself

::: check
A fit uses $m = 12$ measurements to estimate $n = 3$ parameters. What is the trace of the hat matrix $\boldsymbol{\Pi}$? If the noise variance is $\sigma^2 = 4\,\mathrm{m^2}$, what is the expected value of $\lVert\hat{\mathbf{v}}\rVert^2$? How many degrees of freedom does the residual have?
:::

::: answer
The trace equals the rank, which is $n$: $\mathrm{tr}\,\boldsymbol{\Pi} = 3$.

The residual covariance is $\sigma^2(\mathbf{I} - \boldsymbol{\Pi})$. Its trace is $\sigma^2(m - n) = 4\times 9 = 36\,\mathrm{m^2}$, so $\mathbb{E}\lVert\hat{\mathbf{v}}\rVert^2 = 36\,\mathrm{m^2}$.

The residual has $m - n = 9$ degrees of freedom: twelve numbers, three spent on the fit. Divide the observed $\lVert\hat{\mathbf{v}}\rVert^2$ by $9$, not $12$, to get an unbiased $\hat{\sigma}^2$.
:::

::: check
One measurement has leverage $\Pi_{ii} = 0.95$, and the noise standard deviation is $\sigma = 1\,\mathrm{m}$. What standard deviation should you expect for that measurement's residual? What happens if the measurement is really an outlier, $5\,\mathrm{m}$ off?
:::

::: answer
The residual variance is $\sigma^2(1 - \Pi_{ii}) = 1\times 0.05 = 0.05\,\mathrm{m^2}$, so its standard deviation is $\sqrt{0.05} = 0.224\,\mathrm{m}$. The fit swallows $95\%$ of whatever that point does.

If the point is $5\,\mathrm{m}$ wrong, the fit moves toward it. Its own residual ends up around $5\times(1 - 0.95) = 0.25\,\mathrm{m}$, while the *other* residuals grow. A high-leverage outlier hides in its own residual and shows up in everyone else's. The remedy: compare each residual to $\sigma\sqrt{1 - \Pi_{ii}}$ rather than to $\sigma$, and be suspicious of points whose leverage is far above the average, $n/m$.
:::

::: check
Two unit columns of a measurement matrix are $\phi = 10^{-5}\,\mathrm{rad}$ apart. Estimate $\kappa(\mathbf{H})$ and $\kappa(\mathbf{H}^\mathsf{T}\mathbf{H})$, and the digits left by the normal equations and by QR in float64.
:::

::: answer
For a small angle, $\cot(\phi/2) \approx 2/\phi$. So $\kappa(\mathbf{H}) \approx 2/10^{-5} = 2\times 10^5$ and $\kappa(\mathbf{H}^\mathsf{T}\mathbf{H}) = \cot^2(\phi/2) \approx 4\times 10^{10}$.

QR loses about $\log_{10}(2\times 10^5) = 5.3$ digits, leaving about $10.7$ of float64's $16$. The normal equations lose about $2\times 5.3 = 10.6$, leaving about $5.4$. Both are usable here. At $\phi = 10^{-8}$ the normal equations would keep none and QR about eight.
:::

::: check
The clock example found $\hat{\sigma} = 0.155\,\mathrm{m}$ against an assumed $\sigma = 0.5\,\mathrm{m}$. If the true noise really were $0.155\,\mathrm{m}$, what would the standard deviations of $\hat{c}_0$ and $\hat{c}_1$ be? Which factor in the covariance formula changed?
:::

::: answer
The covariance is $\sigma^2(\mathbf{H}^\mathsf{T}\mathbf{H})^{-1}$. Only $\sigma$ changed; the geometry factor did not. Every standard deviation scales by $0.155/0.5 = 0.31$. The bias goes to $0.362\times 0.31 = 0.112\,\mathrm{m}$ and the drift to $0.0120\times 0.31 = 0.0037\,\mathrm{m/s}$.

The correlation between them, $-0.00357/\sqrt{0.1310\times 1.43\times 10^{-4}} = -0.826$, does not change at all. It depends on the time tags alone.
:::

::: check
Why does the residual $\hat{\mathbf{v}}$ not depend on the true state $\mathbf{x}$, and what is that good for?
:::

::: answer
$\hat{\mathbf{v}} = (\mathbf{I} - \boldsymbol{\Pi})\mathbf{y} = (\mathbf{I} - \boldsymbol{\Pi})(\mathbf{H}\mathbf{x} + \mathbf{v}) = (\mathbf{I} - \boldsymbol{\Pi})\mathbf{v}$. The projection $\boldsymbol{\Pi}$ leaves $\mathbf{H}\mathbf{x}$ unchanged, so $\mathbf{I} - \boldsymbol{\Pi}$ removes the model part exactly. What is left is a filtered copy of the noise, whatever the truth is.

So you can test the residuals against the noise model with no knowledge of the answer. Is their scaled squared length near $m - n$? Are they uncorrelated? Is their mean zero? If they fail those tests, the noise model or the measurement model is wrong — and you can see that in flight.
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
| Errors $\sim\kappa^2\varepsilon$ (normal equations), $\sim\kappa\varepsilon$ (QR, SVD) | Forming $\mathbf{H}^\mathsf{T}\mathbf{H}$ does the damage |

Everything here treated every measurement as equally trustworthy. The next lesson weights each measurement by its own noise. That changes the estimate, changes the covariance, and introduces the information matrix that the rest of the module is built on.

::: context pseudorange Why "pseudo"
A GPS receiver measures how long a satellite's signal took to arrive and multiplies by the speed of light. That would be a true range if the receiver's clock were perfect. It is not: a cheap quartz clock can be off by a millisecond, which is $300\,\mathrm{km}$ of light travel. So every range carries the same unknown clock error, and engineers call it a *pseudo*range. That is why a receiver solves for four unknowns — three position coordinates plus the clock — and needs at least four satellites.
:::

::: context projection-picture The shadow on the floor
Hold a pencil above a table under a lamp directly overhead. Its shadow is the closest the table can get to the pencil. Least squares does the same in many dimensions: the data $\mathbf{y}$ stick out of the flat sheet of possible fits, and the best fit is the point on the sheet straight below.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <polygon points="20,170 250,170 340,110 110,110" fill="#8fb8f0" fill-opacity="0.35" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="258" y="184" font-size="12" fill="#1d6fd1">column space of H</text>
  <line x1="70" y1="150" x2="220" y2="30" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="220,30 207,35 214,44" fill="#1f2a44"/>
  <text x="140" y="70" font-size="13" fill="#1f2a44">y</text>
  <line x1="70" y1="150" x2="217" y2="140" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="220,140 208,135 209,146" fill="#1d6fd1"/>
  <text x="120" y="163" font-size="12" fill="#1f2a44">H x̂ (the fit)</text>
  <line x1="220" y1="40" x2="220" y2="137" stroke="#b4232c" stroke-width="2" stroke-dasharray="5,4"/>
  <polyline points="220,128 230,128 230,140" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <text x="228" y="88" font-size="12" fill="#b4232c">residual v̂ = y − H x̂</text>
  <text x="228" y="103" font-size="11" fill="#b4232c">(perpendicular to the sheet)</text>
</svg>
```
:::

::: context hat-matrix-name A matrix that puts on hats
In statistics the hat symbol marks an estimate, so $\hat{\mathbf{y}}$ is "the fitted $\mathbf{y}$". The matrix $\boldsymbol{\Pi}$ turns $\mathbf{y}$ into $\hat{\mathbf{y}}$ in one multiplication, so it got the nickname "hat matrix"; the name is usually credited to the statistician John Tukey. Many books write it $\mathbf{P}$ or $\mathbf{H}$, but in navigation those letters are taken by the covariance and the measurement matrix, which is why this module uses $\boldsymbol{\Pi}$.
:::

::: context leverage-bars Who pulls hardest
These are the leverages from the clock example. The six samples sit at $t = 0$ to $50\,\mathrm{s}$. The ends pull almost three times as hard as the middle, like the ends of a long ruler you are trying to hold level: a small push at the tip tilts the whole thing.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <g fill="#1d6fd1">
    <rect x="38" y="91.4" width="24" height="78.6"/>
    <rect x="88" y="125.7" width="24" height="44.3"/>
    <rect x="138" y="142.8" width="24" height="27.2"/>
    <rect x="188" y="142.8" width="24" height="27.2"/>
    <rect x="238" y="125.7" width="24" height="44.3"/>
    <rect x="288" y="91.4" width="24" height="78.6"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="85">0.524</text><text x="100" y="119">0.295</text><text x="150" y="136">0.181</text>
    <text x="200" y="136">0.181</text><text x="250" y="119">0.295</text><text x="300" y="85">0.524</text>
    <text x="50" y="186">0 s</text><text x="100" y="186">10</text><text x="150" y="186">20</text>
    <text x="200" y="186">30</text><text x="250" y="186">40</text><text x="300" y="186">50 s</text>
  </g>
  <text x="175" y="30" font-size="12" fill="#1f2a44" text-anchor="middle">leverage of each sample (they add to n = 2)</text>
</svg>
```
:::

::: context degrees-of-freedom Numbers you have spent
Say three friends' heights average $150\,\mathrm{cm}$. Once you know two of the heights and the average, the third is fixed — it is no longer free. Fitting spends one number per unknown in the same way. With $m$ measurements and $n$ unknowns, only $m - n$ numbers are left over to tell you about the noise. Divide by $m$ instead and you will think the sensor is better than it is.
:::

::: context float64 Sixteen digits and no more
Almost all engineering software stores numbers as "double precision" or float64: 64 bits, of which 52 hold the digits. That gives about sixteen significant decimal digits. The gap between $1$ and the next number the computer can store is $2^{-52} \approx 2.2\times 10^{-16}$; that is the $\varepsilon$ in this lesson. Every digit a calculation loses comes out of those sixteen, and it never comes back.
:::

::: context nearly-parallel Two arrows that almost agree
Here the angle is drawn far bigger than $10^{-8}$ so you can see it. What separates the two columns is the short red piece, of length $\sin\phi \approx \phi$. QR keeps that piece directly. The normal equations only ever see $\cos\phi$, the long shared part, and must subtract it from $1$ to find the difference.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="140" x2="322" y2="140" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="330,140 318,134 318,146" fill="#1d6fd1"/>
  <text x="300" y="160" font-size="12" fill="#1d6fd1">h₁</text>
  <line x1="30" y1="140" x2="320.5" y2="105.3" stroke="#1f2a44" stroke-width="2.5"/>
  <polygon points="328.4,104.4 316.7,99.9 318.1,111.9" fill="#1f2a44"/>
  <text x="290" y="96" font-size="12" fill="#1f2a44">h₂</text>
  <line x1="328.4" y1="140" x2="328.4" y2="108" stroke="#b4232c" stroke-width="2.5"/>
  <text x="250" y="130" font-size="11" fill="#b4232c">sin φ ≈ φ</text>
  <path d="M 110 140 A 80 80 0 0 0 109.4 130.5" fill="none" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="118" y="136" font-size="12" fill="#6c7a93">φ</text>
  <text x="30" y="30" font-size="12" fill="#1f2a44">HᵀH stores cos φ; the difference 1 − cos φ ≈ φ²/2</text>
  <text x="30" y="48" font-size="12" fill="#1f2a44">is lost once it drops below ε ≈ 2.2 × 10⁻¹⁶</text>
</svg>
```
:::

::: context dop-bridge Where this comes back
In the GNSS module you will meet GDOP, PDOP, HDOP and VDOP: "geometric", "position", "horizontal" and "vertical dilution of precision". Each is the square root of a sum of diagonal entries of $(\mathbf{H}^\mathsf{T}\mathbf{H})^{-1}$, with one row of $\mathbf{H}$ per satellite. A receiver multiplies its range noise by the DOP to predict its position error. When all the satellites bunch together in one patch of sky, the rows become nearly parallel and the DOP shoots up — the same story as this lesson.
:::
