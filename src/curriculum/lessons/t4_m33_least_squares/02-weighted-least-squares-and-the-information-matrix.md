---
id: l02-weighted-least-squares-and-the-information-matrix
title: Weighted least squares and the information matrix
minutes: 18
covers:
  - Weighted least squares and the information matrix
---

You weigh a package twice: once on a kitchen scale that reads to the gram, once on a wobbly bathroom scale that is off by half a kilogram either way. The kitchen scale says $2.10\,\mathrm{kg}$ and the bathroom scale says $2.60\,\mathrm{kg}$. Would you average them to $2.35\,\mathrm{kg}$? Of course not. You would trust the kitchen scale far more. But not completely: the bathroom scale still knows *something*.

That instinct — let careful measurements count more than sloppy ones — is this lesson. Real navigation data are never equally good. A GPS satellite ten degrees above the horizon is seen through **[[about six times as much air|atmosphere-path]]** as one overhead, and its range is several times noisier. A star near the edge of a star tracker's view is located worse than one in the middle. Ordinary least squares, from the last lesson, treats every row alike. That gets two things wrong. The estimate is worse than the data allow, because a noisy measurement pulls as hard as a precise one. And the reported uncertainty is wrong, because the derivation assumed one $\sigma$ for everybody.

**Weighted least squares** fixes both. It multiplies each squared misfit by a weight, and the right weight is one over the measurement's noise variance. This lesson derives the weighted estimate and its covariance, shows how to compute it safely, and introduces the **information matrix**: the object the rest of this module keeps coming back to. Why this weight is the *best* one is the job of the next two lessons.

## The weighted cost and its minimizer

Keep the model $\mathbf{y} = \mathbf{H}\mathbf{x} + \mathbf{v}$ with zero-mean noise, $\mathbb{E}[\mathbf{v}] = \mathbf{0}$. Now let the noise covariance be any symmetric **[[positive definite|positive-definite]]** matrix $\mathbf{R} = \mathbb{E}[\mathbf{v}\mathbf{v}^\mathsf{T}]$. Its diagonal holds each measurement's variance; its off-diagonal entries say how the errors of two measurements move together.

Pick a symmetric positive definite **weight matrix** $\mathbf{W}$ and define the weighted cost

$$
J(\mathbf{x}) = \tfrac{1}{2}\,(\mathbf{y} - \mathbf{H}\mathbf{x})^\mathsf{T}\mathbf{W}\,(\mathbf{y} - \mathbf{H}\mathbf{x}) .
$$

When $\mathbf{W} = \operatorname{diag}(w_1, \ldots, w_m)$ this is $\tfrac{1}{2}\sum_i w_i(y_i - \mathbf{h}_i^\mathsf{T}\mathbf{x})^2$: each squared misfit counts $w_i$ times.

The gradient is $-\mathbf{H}^\mathsf{T}\mathbf{W}(\mathbf{y} - \mathbf{H}\mathbf{x})$ — the same rule as before with $\mathbf{W}$ riding along. Setting it to zero gives the **weighted normal equations** and the **weighted least squares** (WLS) estimate:

$$
\mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{H}\,\hat{\mathbf{x}} = \mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{y}
\quad\Longrightarrow\quad
\hat{\mathbf{x}} = (\mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{H})^{-1}\mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{y} .
$$

### Two facts that hold for any weights

Write $\hat{\mathbf{x}} = \mathbf{K}\mathbf{y}$ with $\mathbf{K} = (\mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{H})^{-1}\mathbf{H}^\mathsf{T}\mathbf{W}$.

**It is unbiased.** Multiply out and $\mathbf{K}\mathbf{H} = \mathbf{I}$, so $\hat{\mathbf{x}} = \mathbf{x} + \mathbf{K}\mathbf{v}$, whose average is $\mathbf{x}$. Weighting cannot introduce a bias. It only changes how the noise is shared out.

**Its covariance is a sandwich.** By the linear-transformation rule,

$$
\operatorname{Cov}(\hat{\mathbf{x}}) = \mathbf{K}\mathbf{R}\mathbf{K}^\mathsf{T} = (\mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{H})^{-1}\mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{R}\mathbf{W}\mathbf{H}(\mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{H})^{-1} .
$$

This is the *true* covariance for any $\mathbf{W}$. In particular, it is what ordinary least squares ($\mathbf{W} = \mathbf{I}$) really delivers when the noise is not all the same. It is *not* what such a fit reports, which is last lesson's $\hat{\sigma}^2(\mathbf{H}^\mathsf{T}\mathbf{H})^{-1}$. That gap is the second of the two errors above.

### The natural weight

Now set $\mathbf{W} = \mathbf{R}^{-1}$ (read "R inverse"). The inner $\mathbf{W}\mathbf{R}\mathbf{W}$ becomes $\mathbf{R}^{-1}\mathbf{R}\mathbf{R}^{-1} = \mathbf{R}^{-1}$. The sandwich becomes $(\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1}\,\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}\,(\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1}$, and the middle factor cancels one of the outer ones:

$$
\hat{\mathbf{x}} = (\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1}\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{y}, \qquad
\mathbf{P} = \operatorname{Cov}(\hat{\mathbf{x}}) = (\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1} .
$$

The covariance is the inverse of the very matrix in the normal equations. That coincidence is why $\mathbf{R}^{-1}$ is the natural weight, and the matrix gets a name below.

::: key Weighted least squares solution
$\hat{\mathbf{x}} = (\mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{H})^{-1}\mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{y}$ with $\mathbf{W} = \mathbf{R}^{-1}$, the inverse of the measurement noise covariance. Its covariance is $\mathbf{P} = (\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1}$, the inverse of the information matrix (the Fisher information of the measurements). The estimate is unbiased for any positive definite $\mathbf{W}$; only with $\mathbf{W} = \mathbf{R}^{-1}$ does the covariance take this simple form.
:::

### Three ways to read the weight

**Units.** $(\mathbf{y} - \mathbf{H}\mathbf{x})^\mathsf{T}\mathbf{R}^{-1}(\mathbf{y} - \mathbf{H}\mathbf{x})$ is a pure number: meters squared divided by meters squared. So misfits in meters, radians and meters per second can share one cost, and nobody has to choose a conversion factor.

**Sigmas.** For a diagonal $\mathbf{R}$, each term is $(y_i - \mathbf{h}_i^\mathsf{T}\mathbf{x})^2/\sigma_i^2$: the misfit measured in units of its own standard deviation. A two-sigma miss counts the same for a precise sensor and a noisy one.

**A built-in test.** At the solution, $2J = \hat{\mathbf{v}}^\mathsf{T}\mathbf{R}^{-1}\hat{\mathbf{v}}$ is the chi-square lesson's goodness-of-fit statistic. It follows $\chi^2_{m-n}$ when the model and $\mathbf{R}$ are both right.

No other weight gives you all three.

## Computing it: whiten, then solve as before

Do not build $\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}$ and solve it. Last lesson's warning about squaring the condition number applies unchanged. Instead, turn the weighted problem into an ordinary one.

The idea: divide each measurement by its own standard deviation. Then every measurement has noise of size $1$, and ordinary least squares is fair again. This is called **[[whitening|why-white]]**.

For a general $\mathbf{R}$, factor it by **[[Cholesky|cholesky-name]]**, $\mathbf{R} = \mathbf{L}\mathbf{L}^\mathsf{T}$ with $\mathbf{L}$ lower triangular, and define

$$
\tilde{\mathbf{H}} = \mathbf{L}^{-1}\mathbf{H}, \qquad \tilde{\mathbf{y}} = \mathbf{L}^{-1}\mathbf{y}, \qquad \tilde{\mathbf{v}} = \mathbf{L}^{-1}\mathbf{v}, \qquad \operatorname{Cov}(\tilde{\mathbf{v}}) = \mathbf{L}^{-1}\mathbf{R}\mathbf{L}^{-\mathsf{T}} = \mathbf{I} .
$$

(Read $\tilde{\mathbf{H}}$ as "H tilde".) Then $(\mathbf{y} - \mathbf{H}\mathbf{x})^\mathsf{T}\mathbf{R}^{-1}(\mathbf{y} - \mathbf{H}\mathbf{x}) = \lVert\tilde{\mathbf{y}} - \tilde{\mathbf{H}}\mathbf{x}\rVert^2$. That is an ordinary least-squares problem with unit, uncorrelated noise. QR on $\tilde{\mathbf{H}}$ solves it, with error of order $\kappa(\tilde{\mathbf{H}})\varepsilon$.

For a diagonal $\mathbf{R}$, whitening is one division per row: divide row $i$ of $\mathbf{H}$ and entry $i$ of $\mathbf{y}$ by $\sigma_i$. If QR gives $\tilde{\mathbf{H}} = \mathbf{Q}\tilde{\mathbf{R}}_1$, then the information matrix is $\tilde{\mathbf{H}}^\mathsf{T}\tilde{\mathbf{H}} = \tilde{\mathbf{R}}_1^\mathsf{T}\tilde{\mathbf{R}}_1$. So the covariance is $\tilde{\mathbf{R}}_1^{-1}\tilde{\mathbf{R}}_1^{-\mathsf{T}}$, computed from the small triangular factor without ever forming the squared matrix.

```python
import numpy as np

el = np.radians([10.0, 25.0, 45.0, 70.0, 85.0])      # satellite elevations
side = np.array([1, -1, 1, -1, 1])                    # east (+1) or west (-1)
H = np.column_stack([-side * np.cos(el), -np.sin(el), np.ones(5)])
sigma = 0.3 / np.sin(el)                              # meters, elevation weighting
y = np.array([15.526, 10.186, 12.177, 11.819, 11.864])

R = np.diag(sigma**2)
L = np.linalg.cholesky(R)                             # R = L L^T
H_w, y_w = np.linalg.solve(L, H), np.linalg.solve(L, y)   # whitened rows
Q, Rq = np.linalg.qr(H_w)                             # H_w = Q Rq
x_wls = np.linalg.solve(Rq, Q.T @ y_w)
Rq_inv = np.linalg.inv(Rq)                            # small triangular factor
P = Rq_inv @ Rq_inv.T                                 # = inv(H^T R^-1 H)
J = np.sum((y_w - H_w @ x_wls)**2)                    # whitened residual cost

print("x_wls  =", np.round(x_wls, 3))
print("sigmas =", np.round(np.sqrt(np.diag(P)), 3))
print("J      =", round(J, 2), " with m - n =", 5 - 3)
print("OLS    =", np.round(np.linalg.lstsq(H, y, rcond=None)[0], 3))
# x_wls  = [-0.956 -0.53  11.372]
# sigmas = [0.411 1.04  0.925]
# J      = 5.09  with m - n = 2
# OLS    = [-1.974  1.606 13.145]
```

The data are those of the position-fix example below. (`J` here is the full whitened sum of squares, $2J$ in the notation of the cost.)

## The information matrix

Give the matrix in the weighted normal equations its own symbol, $\boldsymbol{\Lambda}$ (capital "lambda"):

$$
\boldsymbol{\Lambda} = \mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}, \qquad \mathbf{P} = \boldsymbol{\Lambda}^{-1} .
$$

$\boldsymbol{\Lambda}$ is the **information matrix**; statisticians call it the **[[Fisher information|fisher]]**. The covariance describes what you do not know. The information matrix describes what the measurements told you. It is symmetric and positive semidefinite, and positive definite exactly when $\mathbf{H}$ has full column rank — when every direction in state space is seen by at least one measurement. Its units are inverse covariance units: $\mathrm{m^{-2}}$ for a position in meters. Four properties make it easier to reason with than the covariance.

**It adds.** For independent measurements, $\mathbf{R} = \operatorname{diag}(\sigma_1^2, \ldots, \sigma_m^2)$, and the product becomes a sum over rows:

$$
\boldsymbol{\Lambda} = \sum_{i=1}^{m}\frac{\mathbf{h}_i\mathbf{h}_i^\mathsf{T}}{\sigma_i^2} .
$$

Each measurement adds its own piece. Pieces from different sensors or different batches of data add too. Covariances do not add — combining two estimates means inverting, adding and inverting back — which is why filters that fuse many sources are often written in **[[information form|information-form]]**.

**Each measurement informs [[one direction|one-direction]].** The piece $\mathbf{h}_i\mathbf{h}_i^\mathsf{T}/\sigma_i^2$ is a **rank-one** matrix: it has a single nonzero eigenvalue, $\lVert\mathbf{h}_i\rVert^2/\sigma_i^2$, with eigenvector along $\mathbf{h}_i$. A measurement says nothing about directions perpendicular to its row. A range informs position along the line of sight and nothing across it. A rate-table point at rate $\omega_i$ informs the combination $k\omega_i + b$ of scale factor $k$ and bias $b$, and nothing else. To pin down all of $\mathbf{x}$, the rows must span every direction; to pin it down *well*, they must do so with similar strength in every direction.

**Noise scales it inversely.** Halve a sensor's $\sigma$ and its contribution grows four times. Repeat the same measurement $N$ times and you get $N\mathbf{h}\mathbf{h}^\mathsf{T}/\sigma^2$, so the standard deviation falls as $\sigma/\sqrt{N}$ — the familiar rule for averaging.

**Its eigenvectors are the covariance's.** If $\boldsymbol{\Lambda}$ has eigenvalues $\lambda_j$ and eigenvectors $\mathbf{e}_j$, then $\mathbf{P}$ has the same eigenvectors with eigenvalues $1/\lambda_j$. The direction of most information is the direction of least uncertainty, with standard deviation $1/\sqrt{\lambda_j}$. A small eigenvalue marks a direction the data barely constrain. A zero eigenvalue marks an unobservable one.

::: example Two correlated measurements of one quantity
Two sensors measure the same number $x$. The first has $\sigma_1 = 1\,\mathrm{m}$, the second $\sigma_2 = 2\,\mathrm{m}$. Their errors share a common cause — a shared clock, a shared temperature — with correlation $\rho = 0.8$ (read "rho"). The off-diagonal covariance is $\rho\sigma_1\sigma_2 = 0.8\times 1\times 2 = 1.6\,\mathrm{m^2}$, so

$$
\mathbf{R} = \begin{pmatrix} 1 & 1.6 \\ 1.6 & 4 \end{pmatrix}\,\mathrm{m^2}, \qquad \det\mathbf{R} = 4 - 2.56 = 1.44, \qquad
\mathbf{R}^{-1} = \frac{1}{1.44}\begin{pmatrix} 4 & -1.6 \\ -1.6 & 1 \end{pmatrix} = \begin{pmatrix} 2.778 & -1.111 \\ -1.111 & 0.694 \end{pmatrix}\,\mathrm{m^{-2}} .
$$

**Information.** With $\mathbf{H} = (1, 1)^\mathsf{T}$, $\Lambda$ is the sum of all four entries of $\mathbf{R}^{-1}$: $\Lambda = (4 - 3.2 + 1)/1.44 = 1.25\,\mathrm{m^{-2}}$. So $P = 1/1.25 = 0.8\,\mathrm{m^2}$ and $\sigma_{\hat{x}} = 0.894\,\mathrm{m}$ — better than the better sensor alone.

**Weights.** $\mathbf{H}^\mathsf{T}\mathbf{R}^{-1} = (2.4, -0.6)/1.44$. Dividing by $\Lambda$ gives weights $(2.4, -0.6)/1.8 = (1.333, -0.333)$:

$$
\hat{x} = 1.333\,y_1 - 0.333\,y_2 .
$$

The noisier sensor gets a **[[negative weight|negative-weight]]**. That is not a mistake. Its error is $80\%$ correlated with the first sensor's, so its reading tells you about the first sensor's error. The estimator uses it mainly to cancel part of the first sensor's noise.

**Compare.** Ignore the correlation and weight by $1/\sigma_i^2$ alone: weights $(0.8, 0.2)$. The sandwich gives the true variance $0.8^2\times 1 + 2\times 0.8\times 0.2\times 1.6 + 0.2^2\times 4 = 0.64 + 0.512 + 0.16 = 1.31\,\mathrm{m^2}$ — worse than sensor one alone.

**A pattern worth remembering.** For two sensors with equal $\sigma$ and correlation $\rho$, $P = \sigma^2(1 + \rho)/2$. At $\rho = 0$ the variance halves. At $\rho = 0.9$ it falls only to $0.95\sigma^2$: the second sensor mostly repeats the first's error. At $\rho = -0.9$ it falls to $0.05\sigma^2$: two sensors whose errors oppose each other are worth twenty independent ones. Correlation is information about the noise, and $\mathbf{R}^{-1}$ is how the estimator uses it.
:::

::: example A position fix with elevation-dependent weighting
A receiver estimates its east position $e$, its up position $u$ and its clock bias $c$, all in meters, from five pseudoranges. Work in the east–up plane. The satellites sit at elevations $10^\circ$, $25^\circ$, $45^\circ$, $70^\circ$ and $85^\circ$, alternately east and west. Each row of $\mathbf{H}$ is minus the unit line-of-sight vector, then a $1$ for the clock. For the $10^\circ$ satellite to the east that is $(-\cos 10^\circ,\ -\sin 10^\circ,\ 1) = (-0.985, -0.174, 1)$. The noise follows the standard elevation model $\sigma_i = 0.3\,\mathrm{m}/\sin(\mathrm{el}_i)$: $1.73$, $0.71$, $0.42$, $0.32$ and $0.30\,\mathrm{m}$. The low satellite is almost six times noisier than the high one.

**Information and covariance.** Whitening and QR, as in the code, give

$$
\boldsymbol{\Lambda} = \begin{pmatrix} 5.96 & -0.12 & -0.07 \\ -0.12 & 22.75 & -25.03 \\ -0.07 & -25.03 & 28.71 \end{pmatrix}\,\mathrm{m^{-2}}, \qquad
\mathbf{P} = \begin{pmatrix} 0.169 & 0.032 & 0.028 \\ 0.032 & 1.081 & 0.943 \\ 0.028 & 0.943 & 0.856 \end{pmatrix}\,\mathrm{m^2},
$$

so $\sigma_e = 0.41\,\mathrm{m}$, $\sigma_u = 1.04\,\mathrm{m}$ and $\sigma_c = 0.93\,\mathrm{m}$.

**Read the structure.** The up–clock block of $\boldsymbol{\Lambda}$ is large but nearly singular. Every satellite is above the receiver, so **[[moving up looks like a clock change|up-clock]]**. In $\mathbf{P}$, $u$ and $c$ have correlation $0.943/\sqrt{1.081\times 0.856} = 0.98$. The eigenvalues of $\mathbf{P}$ give standard deviations of $0.14$, $0.41$ and $1.39\,\mathrm{m}$: the sum $u + c$ is poorly known and the difference $u - c$ well known. This is the vertical dilution of precision of the GNSS module, seen as the eigenstructure of an information matrix.

**Who contributes.** Each satellite's $\lVert\mathbf{h}_i\rVert^2/\sigma_i^2$ is $0.67$, $3.97$, $11.1$, $19.6$ and $22.1\,\mathrm{m^{-2}}$. The $85^\circ$ satellite delivers thirty-three times the information of the $10^\circ$ one.

**Adding a satellite.** A sixth at $40^\circ$ to the west has $\sigma_6 = 0.3/\sin 40^\circ = 0.467\,\mathrm{m}$. Its rank-one piece $\mathbf{h}_6\mathbf{h}_6^\mathsf{T}/\sigma_6^2$ has entries between about $2$ and $5\,\mathrm{m^{-2}}$. Add it to $\boldsymbol{\Lambda}$, invert, and the standard deviations drop to $0.35$, $0.95$ and $0.83\,\mathrm{m}$. Nothing had to be re-derived: information added.

**The cost of ignoring the weights.** Ordinary least squares on the same five rows is still unbiased. But its true covariance, the sandwich with $\mathbf{K} = (\mathbf{H}^\mathsf{T}\mathbf{H})^{-1}\mathbf{H}^\mathsf{T}$, gives $\sigma_e = 0.61$, $\sigma_u = 1.54$ and $\sigma_c = 1.33\,\mathrm{m}$ — about $1.5$ times the weighted figures, because the $10^\circ$ satellite pulls as hard as the $85^\circ$ one. Worse, what the unweighted fit *reports* is too small. With a pooled $\hat{\sigma}^2$ in $\hat{\sigma}^2(\mathbf{H}^\mathsf{T}\mathbf{H})^{-1}$, on average it claims $0.42$, $0.94$ and $0.68\,\mathrm{m}$. It promises a clock good to $0.68\,\mathrm{m}$ while delivering $1.33$.

**One draw.** In the code the weighted estimate is $(-0.96, -0.53, 11.37)$ against a truth of $(0, 0, 12.00)\,\mathrm{m}$, and the unweighted one is $(-1.97, 1.61, 13.15)$. One draw proves little — the weighted error in $e$ is $2.3\sigma_e$, which happens about one time in fifty. The covariances are the exact statement: the unweighted fit is $1.5$ times worse than it needs to be, and more confident than it should be.
:::

## Scaling the weights

Multiply $\mathbf{W}$ by any positive number $c$ and the estimate does not move: in $(\mathbf{H}^\mathsf{T}c\mathbf{W}\mathbf{H})^{-1}\mathbf{H}^\mathsf{T}c\mathbf{W}\mathbf{y}$ the $c$ cancels. Only the *relative* weights set $\hat{\mathbf{x}}$.

The *absolute* level sets $\mathbf{P}$. Suppose the true noise covariance is $c\,\mathbf{R}$ but you weight by $\mathbf{R}^{-1}$. The estimate is exactly right, but the reported $\mathbf{P}$ is too small by the factor $c$. This is the usual failure. Understate every $\sigma_i$ by a factor of two, and you get the right estimate with a covariance four times too optimistic. Nothing in the estimate warns you.

The residuals do. The cost $\hat{\mathbf{v}}^\mathsf{T}\mathbf{R}^{-1}\hat{\mathbf{v}}$ comes out near $c(m - n)$ instead of $m - n$. The ratio $\hat{\mathbf{v}}^\mathsf{T}\mathbf{R}^{-1}\hat{\mathbf{v}}/(m - n)$ is called the **[[variance factor|variance-factor]]** (or unit-weight variance), and it is the standard estimate of $c$. In the position fix it is $5.09/2 = 2.5$ from a single fix. That is inside the wide range two degrees of freedom allow; over many fixes it should average $1$.

::: warning The covariance is only as honest as R
$\mathbf{P} = (\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1}$ is a statement about the noise model, not about the data. Feed in an $\mathbf{R}$ that is too small and $\mathbf{P}$ is too small by the same factor, with no change in $\hat{\mathbf{x}}$ to warn you. Feed in a diagonal $\mathbf{R}$ when the errors are really correlated and $\mathbf{P}$ is wrong in shape as well as size. The only witness is the residual cost $\hat{\mathbf{v}}^\mathsf{T}\mathbf{R}^{-1}\hat{\mathbf{v}}$ against its expected $m - n$. Check it every time.
:::

::: warning Weight by the inverse variance, not the inverse standard deviation
The weight on misfit $i$ is $1/\sigma_i^2$. Whitening divides the row by $\sigma_i$, and squaring turns that into $1/\sigma_i^2$. Two bugs are common. Dividing rows by $\sigma_i^2$ gives weights $1/\sigma_i^4$, which shuts the noisy measurements out far too hard. Using $\mathbf{W} = \operatorname{diag}(1/\sigma_i)$ lets them pull too much. Either way the estimate is still unbiased and looks reasonable, so the bug survives testing — but it is not the best estimate, and the reported covariance is not the covariance of anything.
:::

::: note Information versus covariance in software
Filters and batch estimators are written in either form. Covariance form carries $\mathbf{P}$ and updates it with a gain. Information form carries $\boldsymbol{\Lambda}$ and $\boldsymbol{\Lambda}\hat{\mathbf{x}}$ and updates them by addition. That makes fusing many independent sensors easy, and it lets "no prior knowledge at all" be written as $\boldsymbol{\Lambda} = \mathbf{0}$ — something a covariance can express only as infinity. The Kalman filter module develops both, plus the square-root forms that carry a factor of each. The recursive least-squares lesson later in this module shows the two forms are the same estimator seen through a matrix inversion.
:::

## Check yourself

::: check
Three independent measurements of the same number have standard deviations $2$, $2$ and $4\,\mathrm{m}$. Find the information, the WLS weights, the estimate's standard deviation, and the standard deviation an unweighted average would really have.
:::

::: answer
**Information adds:** $\Lambda = 1/4 + 1/4 + 1/16 = 9/16\,\mathrm{m^{-2}}$. So $P = 16/9 = 1.78\,\mathrm{m^2}$ and $\sigma_{\hat{x}} = \sqrt{1.78} = 1.33\,\mathrm{m}$.

**Weights:** each piece of information over the total: $(1/4)/(9/16) = 4/9$, then $4/9$ and $1/9$. They add to $1$, as they must.

**Unweighted average:** weights $1/3$ each. The sandwich with $\mathbf{K} = (1/3, 1/3, 1/3)$ gives variance $(4 + 4 + 16)/9 = 2.67\,\mathrm{m^2}$, so $\sigma = 1.63\,\mathrm{m}$. The WLS figure is the smallest any linear weights can achieve, as the next lesson proves.
:::

::: check
A measurement row is $\mathbf{h}^\mathsf{T} = (1, 0, 0)$ with $\sigma = 0.5$. Write its contribution to a $3\times 3$ information matrix and say which state directions it informs. What happens to a fit if every row looks like this?
:::

::: answer
The contribution is $\mathbf{h}\mathbf{h}^\mathsf{T}/\sigma^2 = \mathbf{h}\mathbf{h}^\mathsf{T}/0.25 = 4\,\mathbf{e}_1\mathbf{e}_1^\mathsf{T}$: a $4$ in the top-left corner and zeros everywhere else. It informs the first state only.

If every row looks like this, $\boldsymbol{\Lambda}$ has zeros in its second and third rows and columns. It is singular, and the second and third states are unobservable. $\mathbf{H}$ does not have full column rank, the normal equations have no unique solution, and $\mathbf{P}$ does not exist. More repeats do not help: they all add information in the same direction.
:::

::: check
Two altimeters with equal $\sigma = 3\,\mathrm{m}$ have errors correlated with $\rho = 0.6$. What is the variance of the WLS combination, and how does it compare with using one altimeter?
:::

::: answer
$P = \sigma^2(1 + \rho)/2 = 9\times 1.6/2 = 7.2\,\mathrm{m^2}$, so $\sigma_{\hat{x}} = \sqrt{7.2} = 2.68\,\mathrm{m}$, against $3\,\mathrm{m}$ for one altimeter.

The gain is small because much of the second altimeter's error repeats the first's. Only the independent remainder is new information. Had the errors been independent, the variance would have been $9/2 = 4.5\,\mathrm{m^2}$.
:::

::: check
An engineer fits a model with $\mathbf{W} = \mathbf{R}^{-1}$ and gets $\hat{\mathbf{v}}^\mathsf{T}\mathbf{R}^{-1}\hat{\mathbf{v}} = 84$ with $m - n = 20$. The estimate looks fine. What should she conclude about $\hat{\mathbf{x}}$ and about $\mathbf{P}$?
:::

::: answer
A $\chi^2_{20}$ variable has mean $20$ and standard deviation $\sqrt{2\times 20} = 6.3$. So $84$ is about ten standard deviations high. Either the model is wrong, or $\mathbf{R}$ is too small by about $84/20 = 4.2$ in variance (about $2$ in $\sigma$).

If it is $\mathbf{R}$: $\hat{\mathbf{x}}$ is unaffected, because scaling $\mathbf{R}$ does not move the estimate, but $\mathbf{P}$ is $4.2$ times too small and should be multiplied by the variance factor. If it is the model: a systematic pattern should show in the residuals, and the estimate may be biased. The residual-analysis lesson later in the module is about telling the two apart.
:::

::: check
When the measurements are independent, why is the weight $1/\sigma_i^2$ rather than $1/\sigma_i$?
:::

::: answer
Because the misfit is squared. Whitening divides each misfit by $\sigma_i$ so that every whitened misfit has variance $1$. Squaring then produces the weight $1/\sigma_i^2$.

With $1/\sigma_i$ as the weight, each term $w_i v_i^2$ would have average $\sigma_i^2/\sigma_i = \sigma_i$ instead of $1$. The cost would not be a pure number, the minimizer would not have covariance $(\mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{H})^{-1}$, and the value at the minimum would not be a chi-square statistic. Every useful property of the weighted fit rests on the weight being the inverse *variance*.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $J = \tfrac{1}{2}(\mathbf{y} - \mathbf{H}\mathbf{x})^\mathsf{T}\mathbf{W}(\mathbf{y} - \mathbf{H}\mathbf{x})$ | Weighted least-squares cost; $\mathbf{W}$ symmetric positive definite |
| $\hat{\mathbf{x}} = (\mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{H})^{-1}\mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{y}$ | WLS estimate; unbiased for any $\mathbf{W}$; unchanged by scaling $\mathbf{W}$ |
| $\operatorname{Cov} = (\mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{H})^{-1}\mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{R}\mathbf{W}\mathbf{H}(\mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{H})^{-1}$ | True covariance for any weights; what unweighted fits really deliver |
| $\mathbf{W} = \mathbf{R}^{-1}$: $\mathbf{P} = (\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1}$ | The natural weight; covariance is the inverse information |
| $\boldsymbol{\Lambda} = \mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H} = \sum_i \mathbf{h}_i\mathbf{h}_i^\mathsf{T}/\sigma_i^2$ | Information matrix: adds up, rank one per measurement, scales as $1/\sigma^2$ |
| Eigenvectors of $\boldsymbol{\Lambda}$ and $\mathbf{P}$ coincide; $\sigma_j = 1/\sqrt{\lambda_j}$ | Most information, least uncertainty; zero eigenvalue is an unobservable direction |
| $\mathbf{R} = \mathbf{L}\mathbf{L}^\mathsf{T}$, $\tilde{\mathbf{H}} = \mathbf{L}^{-1}\mathbf{H}$, $\tilde{\mathbf{y}} = \mathbf{L}^{-1}\mathbf{y}$ | Whitening; then QR on $\tilde{\mathbf{H}}$ |
| $P = \sigma^2(1 + \rho)/2$ | Two equal sensors with correlation $\rho$; negative weights are possible |
| $\hat{\mathbf{v}}^\mathsf{T}\mathbf{R}^{-1}\hat{\mathbf{v}}/(m - n)$ | Variance factor: should average $1$; rescales $\mathbf{P}$ if $\mathbf{R}$ was mis-scaled |

So far the inverse covariance is the *natural* weight. The next lesson proves it is the *best* one: no linear unbiased estimator has a smaller covariance, whatever the shape of the noise distribution.

::: context atmosphere-path Why low satellites are noisier
Signals slow down a little in air, and in the charged upper layer called the ionosphere. Straight overhead, a signal crosses the layer by the shortest route. At $10^\circ$ elevation it slices through at a shallow angle, and the path is about $1/\sin 10^\circ \approx 5.8$ times longer (a flat-layer estimate). More path means more delay, and more uncertainty in the delay. That is where the $\sigma = 0.3\,\mathrm{m}/\sin(\mathrm{el})$ model comes from.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="130" width="340" height="30" fill="#8fb8f0" fill-opacity="0.45"/>
  <text x="275" y="150" font-size="11" fill="#1f2a44">air layer</text>
  <line x1="10" y1="160" x2="350" y2="160" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="60" cy="160" r="5" fill="#1f2a44"/>
  <text x="44" y="178" font-size="11" fill="#1f2a44">receiver</text>
  <line x1="60" y1="160" x2="60" y2="20" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="60" y1="160" x2="60" y2="130" stroke="#1d6fd1" stroke-width="4"/>
  <text x="66" y="30" font-size="11" fill="#1f2a44">overhead: 1 layer</text>
  <line x1="60" y1="160" x2="340" y2="110.6" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="60" y1="160" x2="230.1" y2="130" stroke="#b4232c" stroke-width="4"/>
  <text x="190" y="100" font-size="11" fill="#b4232c">10° up: about 5.8 layers</text>
</svg>
```
:::

::: context positive-definite A bowl, not a saddle
A symmetric matrix $\mathbf{A}$ is **positive definite** when $\mathbf{z}^\mathsf{T}\mathbf{A}\mathbf{z} > 0$ for every nonzero vector $\mathbf{z}$. Think of it as "positive in every direction". A covariance matrix is at least positive *semi*definite, because $\mathbf{z}^\mathsf{T}\mathbf{R}\mathbf{z}$ is the variance of the combination $\mathbf{z}^\mathsf{T}\mathbf{v}$, and a variance cannot be negative. Positive definite means no combination of the errors is perfectly zero — which is also what lets you invert $\mathbf{R}$.
:::

::: context why-white Why "white"
White light mixes every color equally. Engineers borrowed the word for noise that is equally strong at every frequency — which, for a list of samples, means every sample has the same variance and no two are correlated. Its covariance is the identity matrix. "Whitening" a problem means transforming it until its noise looks like that. Once it does, plain least squares is fair to every measurement again.
:::

::: context cholesky-name The surveyor's factorization
André-Louis Cholesky was a French army officer who surveyed land in Crete and North Africa. He invented his method to solve the normal equations of map-making. He was killed in the First World War in 1918, and a fellow officer published the method after his death, in 1924. Every navigation filter written today uses it — often thousands of times a second — to take square roots of covariance matrices.
:::

::: context fisher How much the data can tell you
The statistician Ronald Fisher defined, in the 1920s, a measure of how sharply the data pin down an unknown. If a tiny change in the unknown makes the data much less likely, the data carry a lot of information about it. For a linear model with Gaussian noise, Fisher's information works out to exactly $\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}$. The Cramér–Rao bound, which you will meet soon, says no unbiased estimator can have a covariance smaller than its inverse.
:::

::: context one-direction A measurement squeezes one way
Start with a round cloud of uncertainty about a position (gray). A single range measurement along $\mathbf{h}$ squeezes the cloud along $\mathbf{h}$ (blue) and leaves it untouched across $\mathbf{h}$. To shrink it in every direction you need rows pointing in different directions.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <circle cx="160" cy="85" r="60" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5,4"/>
  <ellipse cx="160" cy="85" rx="24" ry="60" fill="#8fb8f0" fill-opacity="0.5" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="40" y1="85" x2="282" y2="85" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="290,85 278,79 278,91" fill="#1f2a44"/>
  <text x="296" y="89" font-size="12" fill="#1f2a44">h</text>
  <text x="228" y="30" font-size="11" fill="#6c7a93">before</text>
  <text x="192" y="150" font-size="11" fill="#1d6fd1">after: narrow along h,</text>
  <text x="192" y="164" font-size="11" fill="#1d6fd1">same height across it</text>
</svg>
```
:::

::: context negative-weight Using one error to cancel another
Imagine two thermometers in the same sunny window. Both read too high when the sun hits them, the second more than the first. If the second reads far above normal, the sun is probably out, so the first is probably too high as well — and you should correct it *down*. A negative weight on the second sensor does exactly that. It only works when the correlation in $\mathbf{R}$ is real; if you invent a correlation, the "correction" adds error instead.
:::

::: context up-clock Why height and clock get confused
Move the receiver $1\,\mathrm{m}$ up and every range to a satellite overhead shrinks by $1\,\mathrm{m}$, and every range to a lower one by a bit less. A clock error worth $1\,\mathrm{m}$ of light travel shifts every pseudorange by exactly $1\,\mathrm{m}$, whatever the elevation. With all satellites above you, the two effects look nearly alike. Only satellites near the horizon — and on Earth there are none below it — separate them. This is why GPS height is usually worse than GPS horizontal position.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="10" y1="160" x2="350" y2="160" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="60" cy="160" r="5" fill="#1f2a44"/>
  <line x1="60" y1="160" x2="72.2" y2="20.5" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="72.2" cy="20.5" r="6" fill="#1d6fd1"/>
  <line x1="60" y1="160" x2="335.7" y2="111.4" stroke="#b4232c" stroke-width="2"/>
  <circle cx="335.7" cy="111.4" r="6" fill="#b4232c"/>
  <text x="84" y="30" font-size="11" fill="#1d6fd1">85°: up 1 m → range 1.00 m shorter</text>
  <text x="160" y="96" font-size="11" fill="#b4232c">10°: up 1 m → 0.17 m shorter</text>
  <text x="80" y="176" font-size="11" fill="#1f2a44">clock error 1 m: every pseudorange shifts 1.00 m</text>
</svg>
```
:::

::: context variance-factor A check on your error budget
If every $\sigma_i$ is right, each whitened residual has variance about $1$, and the cost divided by $m - n$ comes out near $1$. A value of $4$ means the real noise is about twice what you claimed. A value of $0.25$ means you were too pessimistic by about two. Surveyors and orbit-determination teams report this number with every solution, as a quick honesty check.
:::

::: context information-form Fusion by adding
Picture several drones mapping the same field. Their measurement errors are independent. Each one turns its own measurements into a small information matrix $\boldsymbol{\Lambda}_k$ and vector $\boldsymbol{\Lambda}_k\hat{\mathbf{x}}_k$ and radios them in. The ground station adds up what arrives — in any order, from any number of drones — and solves once. In covariance form it would have to merge the estimates one pair at a time, inverting matrices at every step. That is why decentralized and multi-sensor systems often work in information form.
:::
