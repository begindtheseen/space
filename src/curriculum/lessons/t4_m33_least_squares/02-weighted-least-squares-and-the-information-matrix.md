---
id: l02-weighted-least-squares-and-the-information-matrix
title: Weighted least squares and the information matrix
minutes: 21
covers:
  - Weighted least squares and the information matrix
---

No two measurements in a real navigation problem are equally trustworthy. A GNSS satellite ten degrees above the horizon is seen through forty times more atmosphere than one overhead, and its pseudorange is several times noisier. A star near the edge of a tracker's field is centroided worse than one at the centre. A range from a distant ground station carries more delay error than a range from a near one. Ordinary least squares, which treats every row of $\mathbf{H}$ alike, gets two things wrong in that situation: the estimate is not as good as the data allow, because a noisy measurement is allowed to pull as hard as a precise one, and the covariance it reports is wrong, because the derivation assumed a single $\sigma$ that does not exist.

Weighted least squares fixes both. It multiplies each residual by a weight before squaring, and the right weight turns out to be the inverse of the measurement's noise variance — or, when measurements are correlated, the inverse of the noise covariance matrix. This lesson derives the weighted estimate and its covariance, shows how to compute it without forming the normal equations, and introduces the matrix that makes weighting natural to think about: the **information matrix** $\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}$, which adds measurement by measurement, whose inverse is the covariance, and which will be the object every later lesson of this module manipulates.

The reasons the inverse covariance is the *best* weight, and not merely a sensible one, are the subjects of the next two lessons. Here the weight is taken as given and its consequences worked out.

## The weighted cost and its minimiser

Keep the linear model $\mathbf{y} = \mathbf{H}\mathbf{x} + \mathbf{v}$ with $\mathbb{E}[\mathbf{v}] = \mathbf{0}$, but now let the noise covariance be a general symmetric positive definite matrix $\mathbf{R} = \mathbb{E}[\mathbf{v}\mathbf{v}^\mathsf{T}]$. Choose a symmetric positive definite **weight matrix** $\mathbf{W}$ and define the weighted cost

$$
J(\mathbf{x}) = \tfrac{1}{2}\,(\mathbf{y} - \mathbf{H}\mathbf{x})^\mathsf{T}\mathbf{W}\,(\mathbf{y} - \mathbf{H}\mathbf{x}) .
$$

When $\mathbf{W} = \operatorname{diag}(w_1, \ldots, w_m)$ this is $\tfrac{1}{2}\sum_i w_i(y_i - \mathbf{h}_i^\mathsf{T}\mathbf{x})^2$: each squared residual counts $w_i$ times. The gradient is $-\mathbf{H}^\mathsf{T}\mathbf{W}(\mathbf{y} - \mathbf{H}\mathbf{x})$, by the same quadratic-form rule as before with $\mathbf{W}$ riding along, and setting it to zero gives the **weighted normal equations** and the **weighted least squares** (WLS) estimate:

$$
\mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{H}\,\hat{\mathbf{x}} = \mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{y}
\quad\Longrightarrow\quad
\hat{\mathbf{x}} = (\mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{H})^{-1}\mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{y} .
$$

Two properties hold for *any* positive definite $\mathbf{W}$. Write $\hat{\mathbf{x}} = \mathbf{K}\mathbf{y}$ with $\mathbf{K} = (\mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{H})^{-1}\mathbf{H}^\mathsf{T}\mathbf{W}$. Then $\mathbf{K}\mathbf{H} = \mathbf{I}$, so $\hat{\mathbf{x}} = \mathbf{x} + \mathbf{K}\mathbf{v}$ and the estimate is **unbiased whatever the weights are**. Weighting cannot introduce a bias; it only redistributes the noise. And by the linear-transformation rule the covariance of the estimation error is

$$
\operatorname{Cov}(\hat{\mathbf{x}}) = \mathbf{K}\mathbf{R}\mathbf{K}^\mathsf{T} = (\mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{H})^{-1}\mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{R}\mathbf{W}\mathbf{H}(\mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{H})^{-1} .
$$

This sandwich is the *true* covariance of a weighted estimate with an arbitrary $\mathbf{W}$, and it is what an ordinary least-squares fit ($\mathbf{W} = \mathbf{I}$) actually delivers when the noise is not white. It is not what such a fit *reports*, which is the previous lesson's $\hat{\sigma}^2(\mathbf{H}^\mathsf{T}\mathbf{H})^{-1}$; the gap between the two is the second of the two errors described in the opening.

Now set $\mathbf{W} = \mathbf{R}^{-1}$. The inner $\mathbf{W}\mathbf{R}\mathbf{W}$ becomes $\mathbf{R}^{-1}$, the sandwich collapses to $(\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1}\,\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}\,(\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1}$, and the middle factor cancels one of the outer ones:

$$
\hat{\mathbf{x}} = (\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1}\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{y}, \qquad
\mathbf{P} = \operatorname{Cov}(\hat{\mathbf{x}}) = (\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1} .
$$

The covariance is the inverse of the matrix that already appears in the normal equations. That coincidence is the reason $\mathbf{R}^{-1}$ is the natural weight, and it has a name.

::: key Weighted least squares solution
$\hat{\mathbf{x}} = (\mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{H})^{-1}\mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{y}$ with $\mathbf{W} = \mathbf{R}^{-1}$, the inverse of the measurement noise covariance. Its covariance is $\mathbf{P} = (\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1}$, the inverse of the information matrix. The estimate is unbiased for any positive definite $\mathbf{W}$; only with $\mathbf{W} = \mathbf{R}^{-1}$ does the covariance take this simple form.
:::

Three readings of the weight. Dimensionally, $(\mathbf{y} - \mathbf{H}\mathbf{x})^\mathsf{T}\mathbf{R}^{-1}(\mathbf{y} - \mathbf{H}\mathbf{x})$ is a pure number — metres cancel against metres squared — so residuals in metres, radians and metres per second can be added in one cost without anyone choosing a conversion factor. Statistically, for a diagonal $\mathbf{R}$ each term is $(y_i - \mathbf{h}_i^\mathsf{T}\mathbf{x})^2/\sigma_i^2$, the residual measured in units of its own standard deviation, so a two-sigma miss counts the same for a precise sensor and for a noisy one. And the quantity $2J$ at the solution is the chi-square lesson's goodness-of-fit statistic, $\hat{\mathbf{v}}^\mathsf{T}\mathbf{R}^{-1}\hat{\mathbf{v}} \sim \chi^2_{m-n}$ when the model and $\mathbf{R}$ are both right, which gives the fit a built-in test. None of these readings is available with any other weight.

## Computing it: whiten, then solve as before

Do not build $\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}$ and solve it. The argument of the previous lesson applies unchanged, and the way around it is the whitening transformation from the linear-transformations lesson. Factor $\mathbf{R} = \mathbf{L}\mathbf{L}^\mathsf{T}$ by Cholesky and define

$$
\tilde{\mathbf{H}} = \mathbf{L}^{-1}\mathbf{H}, \qquad \tilde{\mathbf{y}} = \mathbf{L}^{-1}\mathbf{y}, \qquad \tilde{\mathbf{v}} = \mathbf{L}^{-1}\mathbf{v}, \qquad \operatorname{Cov}(\tilde{\mathbf{v}}) = \mathbf{L}^{-1}\mathbf{R}\mathbf{L}^{-\mathsf{T}} = \mathbf{I} .
$$

Then $(\mathbf{y} - \mathbf{H}\mathbf{x})^\mathsf{T}\mathbf{R}^{-1}(\mathbf{y} - \mathbf{H}\mathbf{x}) = \lVert\tilde{\mathbf{y}} - \tilde{\mathbf{H}}\mathbf{x}\rVert^2$, an ordinary least-squares problem with unit-variance uncorrelated noise, and QR on $\tilde{\mathbf{H}}$ solves it with error of order $\kappa(\tilde{\mathbf{H}})\varepsilon$. For a diagonal $\mathbf{R}$ whitening is one division per row: divide row $i$ of $\mathbf{H}$ and entry $i$ of $\mathbf{y}$ by $\sigma_i$. The information matrix is $\tilde{\mathbf{H}}^\mathsf{T}\tilde{\mathbf{H}} = \tilde{\mathbf{R}}_1^\mathsf{T}\tilde{\mathbf{R}}_1$ where $\tilde{\mathbf{R}}_1$ is the triangular factor from the QR, so the covariance $\mathbf{P}$ can be read from a triangular solve without ever forming $\boldsymbol{\Lambda}$ explicitly.

```python
import numpy as np

el = np.radians([10.0, 25.0, 45.0, 70.0, 85.0])      # satellite elevations
side = np.array([1, -1, 1, -1, 1])                    # east (+1) or west (-1)
H = np.column_stack([-side * np.cos(el), -np.sin(el), np.ones(5)])
sigma = 0.3 / np.sin(el)                              # metres, elevation weighting
y = np.array([15.526, 10.186, 12.177, 11.819, 11.864])

R = np.diag(sigma**2)
L = np.linalg.cholesky(R)                             # R = L L^T
H_w, y_w = np.linalg.solve(L, H), np.linalg.solve(L, y)   # whitened rows
Q, Rq = np.linalg.qr(H_w)
x_wls = np.linalg.solve(Rq, Q.T @ y_w)
P = np.linalg.inv(H_w.T @ H_w)                        # = inv(H^T R^-1 H)
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

The data in that block are the worked example below; the `inv` on the last-but-three line is acceptable because the $3\times 3$ covariance itself is what is wanted, and it is formed from the whitened matrix, not from a squared one.

## The information matrix

Give the matrix in the weighted normal equations its own symbol:

$$
\boldsymbol{\Lambda} = \mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}, \qquad \mathbf{P} = \boldsymbol{\Lambda}^{-1} .
$$

$\boldsymbol{\Lambda}$ is the **information matrix**. It is symmetric and positive semidefinite, and positive definite exactly when $\mathbf{H}$ has full column rank — when every direction in state space is seen by at least one measurement. Its units are inverse covariance units: for a position state in metres, $\mathrm{m^{-2}}$. Where the covariance describes what you do not know, the information matrix describes what the measurements told you, and four properties make it the more convenient of the two to reason with.

**It adds.** For independent measurements $\mathbf{R} = \operatorname{diag}(\sigma_1^2, \ldots, \sigma_m^2)$, the product $\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}$ is a sum over rows:

$$
\boldsymbol{\Lambda} = \sum_{i=1}^{m}\frac{\mathbf{h}_i\mathbf{h}_i^\mathsf{T}}{\sigma_i^2} .
$$

Each measurement contributes a rank-one matrix, and contributions from different measurements, different sensors or different data batches add. Covariances do not add — combining two estimates requires inverting, adding, and inverting back — which is why filters that must fuse many sources are often written in information form.

**Each measurement informs one direction.** The term $\mathbf{h}_i\mathbf{h}_i^\mathsf{T}/\sigma_i^2$ has a single nonzero eigenvalue, $\lVert\mathbf{h}_i\rVert^2/\sigma_i^2$, with eigenvector along $\mathbf{h}_i$. A measurement says nothing about state directions orthogonal to its row. A range measurement informs position along the line of sight and nothing across it; a rate-table point at rate $\omega_i$ informs the combination $k\omega_i + b$ and nothing else. To pin down all of $\mathbf{x}$ the rows must span $\mathbb{R}^n$, and to pin it down *well* they must span it with comparable strength in every direction.

**Noise scales it inversely.** Halving a sensor's $\sigma$ quadruples its contribution; $N$ independent repeats of the same measurement give $N\mathbf{h}\mathbf{h}^\mathsf{T}/\sigma^2$, so the standard deviation of whatever that row measures falls as $\sigma/\sqrt{N}$, the sample-mean law recovered.

**Its eigenstructure is the covariance's, inverted.** If $\boldsymbol{\Lambda}$ has eigenvalues $\lambda_j$ and eigenvectors $\mathbf{e}_j$, then $\mathbf{P}$ has the same eigenvectors with eigenvalues $1/\lambda_j$. The direction of greatest information is the direction of least uncertainty, with standard deviation $1/\sqrt{\lambda_j}$. A small eigenvalue of $\boldsymbol{\Lambda}$ is a direction the data barely constrain, and a zero eigenvalue is an unobservable one.

::: example Two correlated measurements of one quantity
Two sensors measure the same scalar $x$. The first has $\sigma_1 = 1\,\mathrm{m}$, the second $\sigma_2 = 2\,\mathrm{m}$, and their errors share a common cause with correlation $\rho = 0.8$ — a shared clock, a shared temperature, a shared atmospheric delay. Then

$$
\mathbf{R} = \begin{pmatrix} 1 & 1.6 \\ 1.6 & 4 \end{pmatrix}\,\mathrm{m^2}, \qquad \det\mathbf{R} = 4 - 2.56 = 1.44, \qquad
\mathbf{R}^{-1} = \frac{1}{1.44}\begin{pmatrix} 4 & -1.6 \\ -1.6 & 1 \end{pmatrix} = \begin{pmatrix} 2.778 & -1.111 \\ -1.111 & 0.694 \end{pmatrix}\,\mathrm{m^{-2}} .
$$

With $\mathbf{H} = (1, 1)^\mathsf{T}$ the information is the sum of all four entries of $\mathbf{R}^{-1}$: $\Lambda = (4 - 3.2 + 1)/1.44 = 1.25\,\mathrm{m^{-2}}$, so $P = 0.8\,\mathrm{m^2}$ and $\sigma_{\hat{x}} = 0.894\,\mathrm{m}$ — better than the better sensor alone. The estimator is $\hat{x} = \Lambda^{-1}\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{y}$, and $\mathbf{H}^\mathsf{T}\mathbf{R}^{-1} = (2.4, -0.6)/1.44$, so the weights are $(2.4, -0.6)/1.8 = (1.333, -0.333)$:

$$
\hat{x} = 1.333\,y_1 - 0.333\,y_2 .
$$

The noisier sensor receives a *negative* weight. That is not a mistake. Because its error is $80\%$ correlated with the first sensor's, its reading carries information about the first sensor's error, and the estimator uses the second sensor mainly to cancel part of the first's noise rather than as a measurement of $x$ in its own right. Uncorrelated weights $(0.8, 0.2)$ would have given $P = 0.8\times 0.8\times 1 + \ldots$ — work it through with the sandwich formula, $0.64\times 1 + 2\times 0.8\times 0.2\times 1.6 + 0.04\times 4$, and the variance comes to $1.31\,\mathrm{m^2}$, worse than using sensor one alone.

The general pattern for two equal-variance sensors with correlation $\rho$ is worth memorising: $P = \sigma^2(1 + \rho)/2$. At $\rho = 0$ the variance halves. At $\rho = 0.9$ it falls only to $0.95\sigma^2$ — the second sensor is almost redundant, because it mostly repeats the first's error. At $\rho = -0.9$ it falls to $0.05\sigma^2$: two sensors whose errors oppose each other are worth twenty uncorrelated ones. Correlation between measurements is information about the noise, and $\mathbf{R}^{-1}$ is how the estimator uses it.
:::

::: example A position fix with elevation-dependent weighting
A receiver estimates its east position $e$, its up position $u$ and its clock bias $c$ (in metres) from five pseudoranges. Working in the east–up plane, the satellites sit at elevations $10^\circ$, $25^\circ$, $45^\circ$, $70^\circ$ and $85^\circ$, alternately east and west of the receiver. Linearised about the nominal position, each row of $\mathbf{H}$ is minus the unit line-of-sight vector followed by a $1$ for the clock: for the $10^\circ$ satellite to the east, $(-\cos 10^\circ,\ -\sin 10^\circ,\ 1) = (-0.985, -0.174, 1)$. The noise follows the standard elevation model $\sigma_i = 0.3\,\mathrm{m}/\sin(\mathrm{el}_i)$, giving $1.73$, $0.71$, $0.42$, $0.32$ and $0.30\,\mathrm{m}$: the low satellite is almost six times noisier than the high one.

Whitening and QR, as in the code above, give

$$
\boldsymbol{\Lambda} = \begin{pmatrix} 5.96 & -0.12 & -0.07 \\ -0.12 & 22.75 & -25.03 \\ -0.07 & -25.03 & 28.71 \end{pmatrix}\,\mathrm{m^{-2}}, \qquad
\mathbf{P} = \begin{pmatrix} 0.169 & 0.032 & 0.028 \\ 0.032 & 1.081 & 0.943 \\ 0.028 & 0.943 & 0.856 \end{pmatrix}\,\mathrm{m^2},
$$

so $\sigma_e = 0.41\,\mathrm{m}$, $\sigma_u = 1.04\,\mathrm{m}$, $\sigma_c = 0.93\,\mathrm{m}$. Read the structure. The up–clock block of $\boldsymbol{\Lambda}$ is large but nearly singular — every satellite is above the receiver, so moving the receiver up looks almost the same as advancing its clock — and correspondingly $u$ and $c$ have a correlation of $0.943/\sqrt{1.081\times 0.856} = 0.98$ in $\mathbf{P}$. The eigenvalues of $\mathbf{P}$ give standard deviations of $0.14$, $0.41$ and $1.39\,\mathrm{m}$: the combination $u + c$ is poorly known, the combination $u - c$ well known. This is the vertical dilution of precision that the GNSS module quantifies, appearing here as the eigenstructure of an information matrix.

Per-satellite contributions, measured by $\lVert\mathbf{h}_i\rVert^2/\sigma_i^2$: $0.67$, $3.97$, $11.1$, $19.6$ and $22.1\,\mathrm{m^{-2}}$. The $85^\circ$ satellite delivers thirty-three times the information of the $10^\circ$ one, and almost all of it to the up–clock block. Adding a sixth satellite at $40^\circ$ to the west, $\sigma_6 = 0.467\,\mathrm{m}$, adds the rank-one matrix $\mathbf{h}_6\mathbf{h}_6^\mathsf{T}/\sigma_6^2$ with entries of order $2$ to $5\,\mathrm{m^{-2}}$ to $\boldsymbol{\Lambda}$ and drops the standard deviations to $0.35$, $0.95$ and $0.82\,\mathrm{m}$. Nothing had to be re-derived: information added.

Now the cost of ignoring the weights. Ordinary least squares on the same five rows is unbiased, but its true covariance is the sandwich $\mathbf{K}\mathbf{R}\mathbf{K}^\mathsf{T}$ with $\mathbf{K} = (\mathbf{H}^\mathsf{T}\mathbf{H})^{-1}\mathbf{H}^\mathsf{T}$, giving $\sigma_e = 0.61$, $\sigma_u = 1.54$, $\sigma_c = 1.33\,\mathrm{m}$ — about $1.5$ times the weighted figures in every component, because the $10^\circ$ satellite is allowed to pull as hard as the $85^\circ$ one. Worse, what the unweighted fit *reports*, using a pooled $\hat{\sigma}$ in $\hat{\sigma}^2(\mathbf{H}^\mathsf{T}\mathbf{H})^{-1}$, is $0.59$, $1.31$ and $0.95\,\mathrm{m}$: it claims a clock accuracy of $0.95\,\mathrm{m}$ while delivering $1.33$. On the single realisation in the code block the weighted estimate is $(-0.96, -0.53, 11.37)$ against a truth of $(0, 0, 12.00)\,\mathrm{m}$ and the unweighted one is $(-1.97, 1.61, 13.15)$. One draw proves nothing — the weighted error in $e$ is $2.3\sigma_e$, which happens one time in fifty — but the covariances are exact, and they say the unweighted fit is $1.5$ times worse than it needs to be and more confident than it should be.
:::

## Scaling the weights

Multiply $\mathbf{W}$ by any positive constant $c$ and the estimate does not move: $(\mathbf{H}^\mathsf{T}c\mathbf{W}\mathbf{H})^{-1}\mathbf{H}^\mathsf{T}c\mathbf{W}\mathbf{y}$ has the $c$ cancel. Only the *relative* weights determine $\hat{\mathbf{x}}$. The *absolute* level determines $\mathbf{P}$: if the true covariance is $c\,\mathbf{R}$ and you weight by $\mathbf{R}^{-1}$, the estimate is exactly what it would have been with the right weights but the reported $\mathbf{P}$ is too small by the factor $c$. This is the usual failure mode. A fit with every $\sigma_i$ understated by a factor of two produces the right point estimate and a covariance four times too optimistic, and nothing in the point estimate reveals it. The residuals do: $2J = \hat{\mathbf{v}}^\mathsf{T}\mathbf{R}^{-1}\hat{\mathbf{v}}$ comes out near $c(m - n)$ instead of $m - n$, and the ratio $\hat{\mathbf{v}}^\mathsf{T}\mathbf{R}^{-1}\hat{\mathbf{v}}/(m - n)$ — the *variance factor*, or unit-weight variance — is the standard estimate of $c$. In the position fix above it is $5.09/2 = 2.5$ from a single fix, which is within the wide range two degrees of freedom allow, and over many fixes it should average $1$.

::: warning The covariance is only as honest as R
$\mathbf{P} = (\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1}$ is a statement about the noise model, not about the data. Feed in an $\mathbf{R}$ that is too small and $\mathbf{P}$ is too small by the same factor, with no change to $\hat{\mathbf{x}}$ to warn you. Feed in a diagonal $\mathbf{R}$ when the errors are in fact correlated and $\mathbf{P}$ is wrong in shape as well as size. The only witness is the residual cost $\hat{\mathbf{v}}^\mathsf{T}\mathbf{R}^{-1}\hat{\mathbf{v}}$ against its expected $m - n$; check it every time.
:::

::: warning Weight by the inverse variance, not the inverse standard deviation
The weight on residual $i$ is $1/\sigma_i^2$, and the whitening divides the row by $\sigma_i$ — the square root appears because whitening acts on the residual before it is squared. Code that divides rows by $\sigma_i^2$, or that forms $\mathbf{W} = \operatorname{diag}(1/\sigma_i)$, gives an estimate that is still unbiased but under-weights the noisy measurements by too little or too much, and a covariance that is not the covariance of anything. It is one of the most common bugs in fitting code, and it survives testing because the estimate looks reasonable.
:::

::: note Information versus covariance in software
Filters and batch estimators are written in either form. Covariance form carries $\mathbf{P}$ and updates it with a gain; information form carries $\boldsymbol{\Lambda}$ and $\boldsymbol{\Lambda}\hat{\mathbf{x}}$ and updates them by addition, which makes fusing many independent sensors trivial and makes a total absence of prior knowledge representable as $\boldsymbol{\Lambda} = \mathbf{0}$ — something a covariance can express only as infinity. The Kalman filter module develops both and the square-root forms that carry a factor of each; the recursive least-squares lesson later in this module shows the two forms are the same estimator viewed through a matrix inversion.
:::

## Check yourself

::: check
Three independent measurements of the same scalar have standard deviations $2$, $2$ and $4\,\mathrm{m}$. Compute the information, the WLS weights, the estimate's standard deviation, and the standard deviation an unweighted average would have.
:::

::: answer
Information adds: $\Lambda = 1/4 + 1/4 + 1/16 = 9/16\,\mathrm{m^{-2}}$, so $P = 16/9 = 1.78\,\mathrm{m^2}$ and $\sigma_{\hat{x}} = 1.33\,\mathrm{m}$. The weights are each term over the total: $(1/4)/(9/16) = 4/9$, $4/9$ and $1/9$. The unweighted average has weights $1/3$ each and variance $(4 + 4 + 16)/9 = 2.67\,\mathrm{m^2}$, $\sigma = 1.63\,\mathrm{m}$, by the sandwich formula with $\mathbf{K} = (1/3, 1/3, 1/3)$. It would *report*, using a pooled variance, something else again; the WLS figure is the smallest achievable with linear weights, which the next lesson proves.
:::

::: check
A measurement row is $\mathbf{h}^\mathsf{T} = (1, 0, 0)$ with $\sigma = 0.5$. Write its contribution to a $3\times 3$ information matrix and state which state directions it informs. What happens to a fit if every row has this form?
:::

::: answer
The contribution is $\mathbf{h}\mathbf{h}^\mathsf{T}/\sigma^2 = 4\,\mathbf{e}_1\mathbf{e}_1^\mathsf{T}$: a $4$ in the top-left corner and zeros elsewhere. It informs the first state only. If every row has this form, $\boldsymbol{\Lambda}$ has zeros in its second and third rows and columns, is singular, and the second and third states are unobservable: $\mathbf{H}$ does not have full column rank, the normal equations have no unique solution, and $\mathbf{P}$ does not exist. No number of repeats helps, because they all add information in the same direction.
:::

::: check
Two altimeters with equal $\sigma = 3\,\mathrm{m}$ have errors correlated with $\rho = 0.6$. What is the variance of the WLS combination, and how does it compare to using one altimeter?
:::

::: answer
$P = \sigma^2(1 + \rho)/2 = 9\times 1.6/2 = 7.2\,\mathrm{m^2}$, $\sigma_{\hat{x}} = 2.68\,\mathrm{m}$, against $3\,\mathrm{m}$ for one altimeter. The gain is small because $60\%$ of the second altimeter's error is a repeat of the first's; only the uncorrelated remainder is new information. Had the errors been independent the variance would have been $4.5\,\mathrm{m^2}$.
:::

::: check
An engineer fits a model with $\mathbf{W} = \mathbf{R}^{-1}$ and gets $\hat{\mathbf{v}}^\mathsf{T}\mathbf{R}^{-1}\hat{\mathbf{v}} = 84$ with $m - n = 20$. The estimate looks fine. What should she conclude about $\hat{\mathbf{x}}$ and about $\mathbf{P}$?
:::

::: answer
The expected value is $20$ with standard deviation $\sqrt{40} = 6.3$; $84$ is ten standard deviations high, so either the model is wrong or $\mathbf{R}$ is understated by about a factor of $84/20 = 4.2$ in variance (a factor of about $2$ in $\sigma$). If it is the second, $\hat{\mathbf{x}}$ is unaffected — scaling $\mathbf{R}$ by a constant does not move the estimate — but $\mathbf{P}$ is $4.2$ times too small and should be multiplied by the variance factor. If it is the first, a systematic residual pattern should be visible, and the estimate may be biased; the residual-analysis lesson later in the module is about telling the two apart.
:::

::: check
Why is the cost written with $\mathbf{R}^{-1}$ in the middle rather than, say, $\operatorname{diag}(1/\sigma_i)$, when the measurements are independent?
:::

::: answer
Because the residual is squared. Whitening divides each residual by $\sigma_i$ so that every whitened residual has unit variance; squaring then produces $1/\sigma_i^2$ as the weight. With $1/\sigma_i$ as the weight the terms would have variances $\sigma_i$ instead of $1$, the cost would not be dimensionless, the minimiser would not have covariance $(\mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{H})^{-1}$, and the value at the minimum would not be a chi-square statistic. Every property that makes the weighted fit useful rests on the weight being the inverse *variance*.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $J = \tfrac{1}{2}(\mathbf{y} - \mathbf{H}\mathbf{x})^\mathsf{T}\mathbf{W}(\mathbf{y} - \mathbf{H}\mathbf{x})$ | Weighted least-squares cost; $\mathbf{W}$ symmetric positive definite |
| $\hat{\mathbf{x}} = (\mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{H})^{-1}\mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{y}$ | WLS estimate; unbiased for any $\mathbf{W}$; unchanged by scaling $\mathbf{W}$ |
| $\operatorname{Cov} = (\mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{H})^{-1}\mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{R}\mathbf{W}\mathbf{H}(\mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{H})^{-1}$ | True covariance for arbitrary weights; what unweighted fits actually deliver |
| $\mathbf{W} = \mathbf{R}^{-1}$: $\mathbf{P} = (\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1}$ | The natural weight; covariance is the inverse information |
| $\boldsymbol{\Lambda} = \mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H} = \sum_i \mathbf{h}_i\mathbf{h}_i^\mathsf{T}/\sigma_i^2$ | Information matrix: additive, rank-one per measurement, scales as $1/\sigma^2$ |
| Eigenvectors of $\boldsymbol{\Lambda}$ and $\mathbf{P}$ coincide; $\sigma_j = 1/\sqrt{\lambda_j}$ | Most information, least uncertainty; zero eigenvalue is an unobservable direction |
| $\mathbf{R} = \mathbf{L}\mathbf{L}^\mathsf{T}$, $\tilde{\mathbf{H}} = \mathbf{L}^{-1}\mathbf{H}$, $\tilde{\mathbf{y}} = \mathbf{L}^{-1}\mathbf{y}$ | Whitening; then QR on $\tilde{\mathbf{H}}$ |
| $P = \sigma^2(1 + \rho)/2$ | Two equal sensors with correlation $\rho$; negative weights are possible |
| $\hat{\mathbf{v}}^\mathsf{T}\mathbf{R}^{-1}\hat{\mathbf{v}}/(m - n)$ | Variance factor: should average $1$; rescales $\mathbf{P}$ if $\mathbf{R}$ was mis-scaled |

The inverse covariance has so far been the *natural* weight. The next lesson proves it is the *best* one: among all linear unbiased estimators, none has a smaller covariance, and that holds without any assumption about the shape of the noise distribution.
