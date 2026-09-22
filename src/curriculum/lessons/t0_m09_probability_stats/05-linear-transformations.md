---
id: l05-linear-transformations
title: Linear transformations of random vectors
minutes: 24
covers:
  - linear transformations of random vectors
---

Almost nothing a navigation filter does to a random vector is more complicated than multiplying it by a matrix and adding something. Propagating a state forward one time step is a matrix multiply. Predicting what a sensor should read is a matrix multiply. Rotating an error from the body frame into the navigation frame is a matrix multiply. Averaging two estimates is a matrix multiply. So the question "what happens to the mean and covariance of $\mathbf{x}$ when I form $\mathbf{y} = \mathbf{A}\mathbf{x} + \mathbf{b}$?" is the question you will answer more often than any other in estimation, and its answer is one line: $\boldsymbol{\mu}_y = \mathbf{A}\boldsymbol{\mu}_x + \mathbf{b}$ and $\mathbf{P}_y = \mathbf{A}\mathbf{P}_x\mathbf{A}^{\mathsf{T}}$.

This lesson derives that line, then spends the rest of its length on what it buys you. It explains how correlation is created out of nothing by dynamics, how a non-square $\mathbf{A}$ can destroy information, how to generate correlated Gaussian samples from independent ones and undo the process to whiten data, how the covariance between a state and a measurement arises, and how a Jacobian turns the identity into the covariance-propagation step of the extended Kalman filter. The previous lesson ended with the covariance matrix $\mathbf{P}$ as a static object; this one sets it in motion.

## Mean and covariance under an affine map

Let $\mathbf{x}$ be a random vector of dimension $n$ with mean $\boldsymbol{\mu}_x$ and covariance $\mathbf{P}_x$, and let $\mathbf{A}$ be a constant $m \times n$ matrix and $\mathbf{b}$ a constant $m$-vector. Define $\mathbf{y} = \mathbf{A}\mathbf{x} + \mathbf{b}$, a random vector of dimension $m$. Because expectation is linear and $\mathbf{A}$ and $\mathbf{b}$ are constants,

$$
\boldsymbol{\mu}_y = \mathbb{E}[\mathbf{A}\mathbf{x} + \mathbf{b}] = \mathbf{A}\,\mathbb{E}[\mathbf{x}] + \mathbf{b} = \mathbf{A}\boldsymbol{\mu}_x + \mathbf{b}.
$$

For the covariance, subtract the means first. The deviation of $\mathbf{y}$ from its mean is $\mathbf{y} - \boldsymbol{\mu}_y = \mathbf{A}(\mathbf{x} - \boldsymbol{\mu}_x)$; the constant $\mathbf{b}$ has cancelled, which is why a shift never affects uncertainty. Then

$$
\mathbf{P}_y = \mathbb{E}\big[(\mathbf{y} - \boldsymbol{\mu}_y)(\mathbf{y} - \boldsymbol{\mu}_y)^{\mathsf{T}}\big]
= \mathbb{E}\big[\mathbf{A}(\mathbf{x} - \boldsymbol{\mu}_x)(\mathbf{x} - \boldsymbol{\mu}_x)^{\mathsf{T}}\mathbf{A}^{\mathsf{T}}\big]
= \mathbf{A}\,\mathbb{E}\big[(\mathbf{x} - \boldsymbol{\mu}_x)(\mathbf{x} - \boldsymbol{\mu}_x)^{\mathsf{T}}\big]\,\mathbf{A}^{\mathsf{T}}
= \mathbf{A}\mathbf{P}_x\mathbf{A}^{\mathsf{T}}.
$$

The step in the middle uses $(\mathbf{A}\mathbf{v})^{\mathsf{T}} = \mathbf{v}^{\mathsf{T}}\mathbf{A}^{\mathsf{T}}$ and the fact that constant matrices pass through the expectation. Nothing about the distribution of $\mathbf{x}$ was used, so the result holds for any random vector with a finite covariance, Gaussian or not. When $\mathbf{x}$ *is* Gaussian, $\mathbf{y}$ is Gaussian too, because a linear combination of jointly Gaussian variables is Gaussian; the mean and covariance then tell you the whole distribution of $\mathbf{y}$, not merely its first two moments.

::: key
Under $\mathbf{y} = \mathbf{A}\mathbf{x} + \mathbf{b}$, the mean and covariance transform as $\boldsymbol{\mu}_y = \mathbf{A}\boldsymbol{\mu}_x + \mathbf{b}$ and $\mathbf{P}_y = \mathbf{A}\mathbf{P}_x\mathbf{A}^{\mathsf{T}}$. The shift $\mathbf{b}$ moves the mean and leaves the covariance alone. Replace $\mathbf{A}$ by a Jacobian and this becomes the EKF covariance propagation step.
:::

Two sanity checks confirm the shape. If $n = m = 1$ the formula reads $\sigma_y^2 = a^2\sigma_x^2$, the scalar rule from the expectation lesson. And $\mathbf{P}_y$ is automatically symmetric and positive semi-definite: for any $\mathbf{c}$, $\mathbf{c}^{\mathsf{T}}\mathbf{A}\mathbf{P}_x\mathbf{A}^{\mathsf{T}}\mathbf{c} = (\mathbf{A}^{\mathsf{T}}\mathbf{c})^{\mathsf{T}}\mathbf{P}_x(\mathbf{A}^{\mathsf{T}}\mathbf{c}) \geq 0$. The sandwich form preserves everything a covariance must have. In floating point, round-off can leave $\mathbf{A}\mathbf{P}\mathbf{A}^{\mathsf{T}}$ very slightly asymmetric after many steps, so production filters symmetrise the result with $\tfrac{1}{2}(\mathbf{M} + \mathbf{M}^{\mathsf{T}})$ or work with a square-root factor instead.

::: note
Units ride along with the matrix. If $\mathbf{x}$ holds a position in metres and a velocity in metres per second, and $\mathbf{A}$ has an entry $\Delta t$ in seconds, then the units of $\mathbf{A}\mathbf{P}\mathbf{A}^{\mathsf{T}}$ come out consistent automatically. A useful check on any hand-derived $\mathbf{A}$ is that every element of $\mathbf{A}\mathbf{P}\mathbf{A}^{\mathsf{T}}$ has the units it must have.
:::

## How dynamics create correlation

Take the simplest possible state: a position $p$ and a velocity $v$ along one axis, with $\mathbf{x} = (p, v)^{\mathsf{T}}$. Over a step $\Delta t$ with no acceleration, the new state is $p' = p + v\,\Delta t$ and $v' = v$, that is

$$
\mathbf{x}' = \mathbf{F}\mathbf{x}, \qquad \mathbf{F} = \begin{bmatrix} 1 & \Delta t \\ 0 & 1 \end{bmatrix}.
$$

Suppose the initial errors are uncorrelated, $\mathbf{P} = \operatorname{diag}(\sigma_p^2, \sigma_v^2)$. Multiplying out,

$$
\mathbf{F}\mathbf{P}\mathbf{F}^{\mathsf{T}} = \begin{bmatrix} \sigma_p^2 + \sigma_v^2\,\Delta t^2 & \sigma_v^2\,\Delta t \\ \sigma_v^2\,\Delta t & \sigma_v^2 \end{bmatrix}.
$$

Three things happened. The position variance grew by $\sigma_v^2\Delta t^2$, because an uncertain velocity integrates into an uncertain position. The velocity variance did not change, because nothing acted on the velocity. And an off-diagonal term appeared: position and velocity errors are now correlated, with $\operatorname{Cov}(p', v') = \sigma_v^2\Delta t$. That correlation is not a nuisance; it is the mechanism by which a later position measurement will be able to correct the velocity. If the velocity error was positive, the position error grew positive along with it, so observing a too-large position is evidence of a too-large velocity. The covariance now records that.

::: example Coasting for a minute
A vehicle's along-track position is known to $\sigma_p = 10\,\mathrm{m}$ and its along-track velocity to $\sigma_v = 0.1\,\mathrm{m/s}$, uncorrelated. After a $60\,\mathrm{s}$ coast with no measurements,

$$
\mathbf{P}' = \begin{bmatrix} 100 + 0.01 \times 3600 & 0.01 \times 60 \\ 0.01 \times 60 & 0.01 \end{bmatrix}
= \begin{bmatrix} 136 & 0.6 \\ 0.6 & 0.01 \end{bmatrix},
$$

in units of $\mathrm{m^2}$, $\mathrm{m^2/s}$ and $\mathrm{m^2/s^2}$. The position standard deviation has grown from $10$ to $\sqrt{136} = 11.7\,\mathrm{m}$, and the correlation coefficient is $\rho = 0.6/\sqrt{136 \times 0.01} = 0.514$. Half a minute ago the two errors had nothing to do with each other; now they are strongly linked. Coast for ten minutes instead and the position variance becomes $100 + 0.01 \times 360\,000 = 3700\,\mathrm{m^2}$, $\sigma_p = 60.8\,\mathrm{m}$, with $\rho = 0.987$: the position error is then almost entirely the integrated velocity error.
:::

## Selecting, summing and differencing components

Not every $\mathbf{A}$ is square. A row of $\mathbf{A}$ with a single $1$ picks out one component of $\mathbf{x}$; a matrix made of such rows extracts a sub-vector, and $\mathbf{A}\mathbf{P}\mathbf{A}^{\mathsf{T}}$ is then the corresponding sub-block of $\mathbf{P}$. This is how the marginal distribution of a few states is read off the full covariance: cross out the rows and columns you do not want. For a Gaussian, marginals are Gaussian with exactly that sub-block, which is why a position-only error ellipse can be drawn from the top-left corner of a fifteen-state covariance without further computation.

A row of ones sums the components. With $\mathbf{a} = (1, 1, \ldots, 1)^{\mathsf{T}}$ the variance of the sum is $\mathbf{a}^{\mathsf{T}}\mathbf{P}\mathbf{a} = \sum_i\sum_j P_{ij}$, the sum of *every* entry of $\mathbf{P}$, diagonal and off-diagonal. This is the vector form of $\operatorname{Var}(X + Y) = \operatorname{Var}(X) + \operatorname{Var}(Y) + 2\operatorname{Cov}(X, Y)$ from the expectation lesson. Only when the off-diagonal entries vanish do variances add.

A row $(1, -1)$ takes a difference, and differencing is where a non-square $\mathbf{A}$ shows its most important property: it can have a **null space**. If $\mathbf{A}\mathbf{n} = \mathbf{0}$ for some non-zero $\mathbf{n}$, then any component of $\mathbf{x}$ along $\mathbf{n}$ is invisible in $\mathbf{y}$, and its uncertainty is destroyed rather than propagated. The output covariance $\mathbf{A}\mathbf{P}\mathbf{A}^{\mathsf{T}}$ is then of rank at most $\operatorname{rank}(\mathbf{A})$, and when $m > \operatorname{rank}(\mathbf{A})$ it is singular.

::: example Differencing three sensors
Three sensors measure the same quantity with error vector $\mathbf{x}$ of covariance

$$
\mathbf{P} = \begin{bmatrix} 4 & 1 & 0 \\ 1 & 2 & -0.5 \\ 0 & -0.5 & 1 \end{bmatrix}
$$

(the same matrix as the previous lesson's 3-D example). Form the two differences $y_1 = x_1 - x_2$ and $y_2 = x_2 - x_3$, so

$$
\mathbf{A} = \begin{bmatrix} 1 & -1 & 0 \\ 0 & 1 & -1 \end{bmatrix}, \qquad
\mathbf{A}\mathbf{P}\mathbf{A}^{\mathsf{T}} = \begin{bmatrix} 4 & -1.5 \\ -1.5 & 4 \end{bmatrix}.
$$

Check one entry by hand: $\operatorname{Var}(x_1 - x_2) = P_{11} + P_{22} - 2P_{12} = 4 + 2 - 2 = 4$. The null space of $\mathbf{A}$ is spanned by $(1, 1, 1)^{\mathsf{T}}$: a common error shared equally by all three sensors cancels in every difference. That common-mode direction of the input uncertainty, which has variance $\mathbf{a}^{\mathsf{T}}\mathbf{P}\mathbf{a} = 8$ for $\mathbf{a} = (1, 1, 1)^{\mathsf{T}}$, has been discarded. The differences tell you how the sensors disagree with one another, and nothing at all about what they agree on. If you next tried to map the $3 \times 3$ covariance through the $3 \times 3$ matrix whose third row was also a difference, the result would have rank two and a zero eigenvalue, and could not be inverted.
:::

::: warning
A singular output covariance is not an error in the arithmetic; it is the arithmetic telling you that some direction has zero variance because $\mathbf{A}$ annihilated it. The mistake is to treat that output as if it still described an $m$-dimensional uncertainty, for instance by inverting it. Look at the null space of $\mathbf{A}$ and name the direction that was lost.
:::

## Rotations preserve the ellipsoid

When $\mathbf{A}$ is a rotation matrix $\mathbf{R}$, so that $\mathbf{R}^{\mathsf{T}}\mathbf{R} = \mathbf{I}$, the transform $\mathbf{R}\mathbf{P}\mathbf{R}^{\mathsf{T}}$ is a similarity transform. It leaves the eigenvalues of $\mathbf{P}$ unchanged and rotates the eigenvectors by $\mathbf{R}$. The error ellipsoid keeps its size and shape and turns with the frame; its trace, which is the total variance $\sum_i \sigma_i^2$, and its determinant, which fixes the ellipsoid's volume, are invariant. This is exactly what you want when expressing a body-frame covariance in the navigation frame: the uncertainty is a physical object and must not depend on which axes you describe it in.

The diagonal entries do change, however. Rotating the previous lesson's $\mathbf{P} = \begin{bmatrix} 4 & 1 \\ 1 & 2 \end{bmatrix}$ by $22.5^\circ$, the tilt of its major axis, gives $\operatorname{diag}(4.414, 1.586)$: the covariance becomes diagonal, the marginal sigmas become the principal sigmas, and the correlation vanishes. Correlation is a property of the axes you chose, not of the uncertainty itself.

## Generating correlated samples and whitening data

Turn the identity around. You want to draw samples from $\mathcal{N}(\boldsymbol{\mu}, \mathbf{P})$, but your random number generator produces only independent standard normals, a vector $\mathbf{z} \sim \mathcal{N}(\mathbf{0}, \mathbf{I})$. Find any matrix $\mathbf{L}$ with $\mathbf{L}\mathbf{L}^{\mathsf{T}} = \mathbf{P}$ and set $\mathbf{x} = \boldsymbol{\mu} + \mathbf{L}\mathbf{z}$. Then $\mathbb{E}[\mathbf{x}] = \boldsymbol{\mu}$ and $\operatorname{Cov}(\mathbf{x}) = \mathbf{L}\,\mathbf{I}\,\mathbf{L}^{\mathsf{T}} = \mathbf{P}$, and since $\mathbf{x}$ is a linear map of a Gaussian it is Gaussian. The standard choice of $\mathbf{L}$ is the **Cholesky factor**, the unique lower-triangular matrix with positive diagonal satisfying $\mathbf{L}\mathbf{L}^{\mathsf{T}} = \mathbf{P}$, which exists whenever $\mathbf{P}$ is positive definite. It is the matrix square root you will use for every Monte Carlo campaign in this curriculum.

For a $2 \times 2$ covariance the factor can be written down directly:

$$
\mathbf{P} = \begin{bmatrix} P_{11} & P_{12} \\ P_{12} & P_{22} \end{bmatrix}
\quad\Longrightarrow\quad
\mathbf{L} = \begin{bmatrix} \sqrt{P_{11}} & 0 \\ P_{12}/\sqrt{P_{11}} & \sqrt{P_{22} - P_{12}^2/P_{11}} \end{bmatrix}.
$$

Read the second row: the first sample $x_1$ is a scaled standard normal; the second is a part correlated with $x_1$, through $P_{12}/\sqrt{P_{11}}$, plus an independent remainder whose variance $P_{22} - P_{12}^2/P_{11} = \sigma_2^2(1 - \rho^2)$ is the conditional variance from the end of the previous lesson. Cholesky factorisation *is* sequential conditioning.

The inverse operation is **whitening**. Given data $\mathbf{x}$ with known covariance $\mathbf{P} = \mathbf{L}\mathbf{L}^{\mathsf{T}}$, the vector $\mathbf{z} = \mathbf{L}^{-1}(\mathbf{x} - \boldsymbol{\mu})$ has covariance $\mathbf{L}^{-1}\mathbf{P}\mathbf{L}^{-\mathsf{T}} = \mathbf{I}$: its components are uncorrelated with unit variance. Whitened data are the natural input to any test of whether a filter's errors are behaving, and the squared length of the whitened vector is the squared Mahalanobis distance,

$$
\|\mathbf{z}\|^2 = (\mathbf{x} - \boldsymbol{\mu})^{\mathsf{T}}\mathbf{L}^{-\mathsf{T}}\mathbf{L}^{-1}(\mathbf{x} - \boldsymbol{\mu}) = (\mathbf{x} - \boldsymbol{\mu})^{\mathsf{T}}\mathbf{P}^{-1}(\mathbf{x} - \boldsymbol{\mu}) = d^2.
$$

::: example Cholesky sampling and whitening in two dimensions
For $\mathbf{P} = \begin{bmatrix} 4 & 1 \\ 1 & 2 \end{bmatrix}$ the factor is

$$
\mathbf{L} = \begin{bmatrix} 2 & 0 \\ 0.5 & \sqrt{1.75} \end{bmatrix} = \begin{bmatrix} 2 & 0 \\ 0.5 & 1.323 \end{bmatrix},
$$

and multiplying out $\mathbf{L}\mathbf{L}^{\mathsf{T}}$ gives $\begin{bmatrix} 4 & 1 \\ 1 & 0.25 + 1.75 \end{bmatrix} = \mathbf{P}$. Feed in $\mathbf{z} = (1, 0)^{\mathsf{T}}$ and out comes $\mathbf{x} = (2, 0.5)^{\mathsf{T}}$; feed in $\mathbf{z} = (0, 1)^{\mathsf{T}}$ and out comes $(0, 1.323)^{\mathsf{T}}$; feed in $(1, 1)^{\mathsf{T}}$ and out comes $(2, 1.823)^{\mathsf{T}}$. The squared Mahalanobis distances of those three points under $\mathbf{P}$ are $\|\mathbf{z}\|^2 = 1$, $1$ and $2$ respectively, without any need to form $\mathbf{P}^{-1}$. A point a unit standard normal away in whitened coordinates is a point with $d^2 = 1$ in the original ones, whatever the correlation.
:::

```python
import numpy as np

rng = np.random.default_rng(0)
mu = np.array([1.0, -2.0])
P = np.array([[4.0, 1.0], [1.0, 2.0]])
L = np.linalg.cholesky(P)            # lower triangular, L @ L.T == P
z = rng.standard_normal((200_000, 2))
x = mu + z @ L.T                     # rows are samples of N(mu, P)
print(np.cov(x, rowvar=False))       # ~[[4.0, 1.0], [1.0, 2.0]]
w = np.linalg.solve(L, (x - mu).T).T # whitened: covariance ~ identity
print(np.cov(w, rowvar=False))       # ~[[1.0, 0.0], [0.0, 1.0]]
```

## Cross-covariance and the birth of the Kalman gain

Stack two random vectors into one and the identity handles them together. Let $\mathbf{x}$ be a state with covariance $\mathbf{P}$, and let a sensor deliver $\mathbf{z} = \mathbf{H}\mathbf{x} + \mathbf{v}$, where $\mathbf{H}$ is a known $m \times n$ measurement matrix and $\mathbf{v}$ is a zero-mean measurement noise with covariance $\mathbf{R}$, independent of $\mathbf{x}$. The stacked vector $(\mathbf{x}, \mathbf{v})^{\mathsf{T}}$ has block-diagonal covariance $\operatorname{diag}(\mathbf{P}, \mathbf{R})$, and

$$
\begin{bmatrix} \mathbf{x} \\ \mathbf{z} \end{bmatrix}
= \begin{bmatrix} \mathbf{I} & \mathbf{0} \\ \mathbf{H} & \mathbf{I} \end{bmatrix}
\begin{bmatrix} \mathbf{x} \\ \mathbf{v} \end{bmatrix}
\quad\Longrightarrow\quad
\operatorname{Cov}\begin{bmatrix} \mathbf{x} \\ \mathbf{z} \end{bmatrix}
= \begin{bmatrix} \mathbf{P} & \mathbf{P}\mathbf{H}^{\mathsf{T}} \\ \mathbf{H}\mathbf{P} & \mathbf{H}\mathbf{P}\mathbf{H}^{\mathsf{T}} + \mathbf{R} \end{bmatrix}.
$$

Multiply the sandwich out block by block to confirm it. The bottom-right block, $\mathbf{S} = \mathbf{H}\mathbf{P}\mathbf{H}^{\mathsf{T}} + \mathbf{R}$, is the covariance of the predicted measurement: what the state uncertainty looks like when seen through the sensor, plus the sensor's own noise. The off-diagonal block $\mathbf{P}\mathbf{H}^{\mathsf{T}}$ is the **cross-covariance** between state and measurement, and it exists only because the measurement depends on the state.

Now recall the conditioning formula from the previous lesson: the conditional mean of one component given another shifts by (cross-covariance)/(variance of the observed one) times the surprise. In matrix form, conditioning $\mathbf{x}$ on $\mathbf{z}$ gives

$$
\hat{\mathbf{x}} = \boldsymbol{\mu}_x + \mathbf{K}(\mathbf{z} - \mathbf{H}\boldsymbol{\mu}_x), \qquad
\mathbf{K} = \mathbf{P}\mathbf{H}^{\mathsf{T}}\mathbf{S}^{-1}, \qquad
\mathbf{P}^{+} = \mathbf{P} - \mathbf{K}\mathbf{H}\mathbf{P}.
$$

That is the Kalman update, and $\mathbf{K}$ is the Kalman gain. Every piece of it came from $\mathbf{A}\mathbf{P}\mathbf{A}^{\mathsf{T}}$ applied to a stacked vector. The estimation track derives it properly; the point here is that the gain is a ratio of covariances, both of which are linear transforms of $\mathbf{P}$.

Return to the coasting example, where $\mathbf{P}' = \begin{bmatrix} 136 & 0.6 \\ 0.6 & 0.01 \end{bmatrix}$ after a minute. A position fix with $\sigma = 5\,\mathrm{m}$ has $\mathbf{H} = \begin{bmatrix} 1 & 0 \end{bmatrix}$ and $R = 25\,\mathrm{m^2}$, so $S = 136 + 25 = 161\,\mathrm{m^2}$ and $\mathbf{K} = (136/161,\ 0.6/161)^{\mathsf{T}} = (0.845,\ 0.00373)^{\mathsf{T}}$. The second component of the gain is not zero: a position measurement corrects the velocity, by $3.73\,\mathrm{mm/s}$ per metre of surprise, purely because the coast made the two errors correlated. After the update, $\mathbf{P}^{+}$ has $\sigma_p = 4.60\,\mathrm{m}$ and $\sigma_v = 0.0881\,\mathrm{m/s}$. The velocity was never measured, yet its standard deviation fell from $0.1$ to $0.088\,\mathrm{m/s}$.

## Nonlinear maps and the Jacobian

Real measurements and real dynamics are rarely linear. A radar returns a range and a bearing, not Cartesian coordinates; a gravity model is not linear in position. For a smooth nonlinear map $\mathbf{y} = \mathbf{g}(\mathbf{x})$, expand about the mean:

$$
\mathbf{g}(\mathbf{x}) \approx \mathbf{g}(\boldsymbol{\mu}_x) + \mathbf{J}(\mathbf{x} - \boldsymbol{\mu}_x), \qquad J_{ij} = \left.\frac{\partial g_i}{\partial x_j}\right|_{\boldsymbol{\mu}_x}.
$$

To first order the map is affine, with $\mathbf{A} = \mathbf{J}$ and $\mathbf{b} = \mathbf{g}(\boldsymbol{\mu}_x) - \mathbf{J}\boldsymbol{\mu}_x$, so

$$
\boldsymbol{\mu}_y \approx \mathbf{g}(\boldsymbol{\mu}_x), \qquad \mathbf{P}_y \approx \mathbf{J}\mathbf{P}_x\mathbf{J}^{\mathsf{T}}.
$$

This is **linearised covariance propagation**, and it is the entire covariance side of the extended Kalman filter: $\mathbf{P}_{k+1} = \mathbf{F}_k\mathbf{P}_k\mathbf{F}_k^{\mathsf{T}} + \mathbf{Q}_k$, where $\mathbf{F}_k$ is the Jacobian of the state transition and $\mathbf{Q}_k$ is the covariance of process noise added independently during the step, entering by the "variances of independent terms add" rule. The approximation is good when the map is nearly linear across the width of the uncertainty, roughly when the second-order terms are small compared with $\mathbf{J}(\mathbf{x} - \boldsymbol{\mu}_x)$ over a few sigma. When they are not, the mean is biased, the covariance is wrong, and the remedies are a second-order correction, an unscented transform or a Monte Carlo propagation, all of which appear later in the curriculum.

::: example Range and bearing to Cartesian
A radar reports range $r = 1000\,\mathrm{m}$ with $\sigma_r = 5\,\mathrm{m}$ and bearing $\theta = 30^\circ$ with $\sigma_\theta = 1^\circ = 0.01745\,\mathrm{rad}$, uncorrelated. The Cartesian position is $x = r\cos\theta$, $y = r\sin\theta$, with Jacobian

$$
\mathbf{J} = \begin{bmatrix} \cos\theta & -r\sin\theta \\ \sin\theta & r\cos\theta \end{bmatrix}
= \begin{bmatrix} 0.866 & -500 \\ 0.500 & 866 \end{bmatrix},
$$

the second column carrying units of metres per radian. With $\mathbf{P}_{r\theta} = \operatorname{diag}(25\,\mathrm{m^2},\ 3.046 \times 10^{-4}\,\mathrm{rad^2})$,

$$
\mathbf{P}_{xy} = \mathbf{J}\mathbf{P}_{r\theta}\mathbf{J}^{\mathsf{T}} = \begin{bmatrix} 94.9 & -121.1 \\ -121.1 & 234.7 \end{bmatrix}\,\mathrm{m^2}.
$$

The Cartesian sigmas are $\sigma_x = 9.74\,\mathrm{m}$ and $\sigma_y = 15.3\,\mathrm{m}$ with $\rho = -0.811$: a strong negative correlation, because the bearing error moves the point along a direction with a negative slope. The eigenvalues are $304.6$ and $25.0\,\mathrm{m^2}$, that is $17.45\,\mathrm{m}$ and $5.00\,\mathrm{m}$, and the major axis lies at $-60^\circ$, perpendicular to the line of sight. Those two numbers are no accident: $17.45\,\mathrm{m} = r\sigma_\theta$ is the cross-range uncertainty and $5\,\mathrm{m} = \sigma_r$ is the range uncertainty. The Jacobian has rotated the polar error ellipse into Cartesian axes without changing its size, because at fixed $r$ the map from $(r, \theta)$ errors to $(x, y)$ errors is very nearly a rotation combined with a scaling of the bearing axis by $r$. The linearisation is excellent here, since $\sigma_\theta = 1^\circ$ is tiny compared with the scale over which $\cos$ and $\sin$ bend.
:::

## Combining two estimates

One more transform that recurs everywhere. Two independent estimates of the same scalar, $x_1$ with variance $\sigma_1^2$ and $x_2$ with variance $\sigma_2^2$, are combined by a weighted average $\hat{x} = w x_1 + (1 - w) x_2$. This is $\mathbf{A} = \begin{bmatrix} w & 1 - w \end{bmatrix}$ applied to $\operatorname{diag}(\sigma_1^2, \sigma_2^2)$, so $\operatorname{Var}(\hat{x}) = w^2\sigma_1^2 + (1 - w)^2\sigma_2^2$. Minimising over $w$ by setting the derivative to zero gives

$$
w = \frac{\sigma_2^2}{\sigma_1^2 + \sigma_2^2}, \qquad
\operatorname{Var}(\hat{x}) = \frac{\sigma_1^2\sigma_2^2}{\sigma_1^2 + \sigma_2^2}, \qquad
\frac{1}{\operatorname{Var}(\hat{x})} = \frac{1}{\sigma_1^2} + \frac{1}{\sigma_2^2}.
$$

Each estimate is weighted by the *other's* variance, and inverse variances, which estimation calls **information**, add. For $\sigma_1 = 3\,\mathrm{m}$ and $\sigma_2 = 4\,\mathrm{m}$, $w = 16/25 = 0.64$ on the better estimate and the fused standard deviation is $\sqrt{5.76} = 2.4\,\mathrm{m}$, better than either input. Had the two estimates been correlated, the off-diagonal term would have entered the variance and the optimal weight would shift, exactly as the correlated-accelerometer example in the expectation lesson showed.

::: warning
The sandwich formula needs the covariance of the *inputs* to include every correlation among them. Propagating two states through $\mathbf{A}$ using only their marginal variances, with the off-diagonal terms set to zero because they were inconvenient, gives an output covariance that is wrong in both directions: too large when the errors would have cancelled, too small when they would have reinforced. The most common instance is fusing two estimates that share an upstream error source and treating them as independent; the fused covariance then claims a precision that does not exist.
:::

## Check yourself

::: check
A state $\mathbf{x} = (x_1, x_2)^{\mathsf{T}}$ has covariance $\mathbf{P} = \begin{bmatrix} 9 & 2 \\ 2 & 4 \end{bmatrix}$. Find the variance of $y = 3x_1 - 2x_2 + 7$.
:::

::: answer
The constant $7$ shifts the mean and does nothing to the variance. With $\mathbf{a} = (3, -2)^{\mathsf{T}}$, $\operatorname{Var}(y) = \mathbf{a}^{\mathsf{T}}\mathbf{P}\mathbf{a} = 9 \times 9 + 4 \times 4 + 2 \times 3 \times (-2) \times 2 = 81 + 16 - 24 = 73$. Ignoring the covariance would have given $97$; the positive correlation between $x_1$ and $x_2$ partly cancels in a difference.
:::

::: check
The position–velocity state of the coasting example is propagated for $\Delta t$ starting from $\mathbf{P} = \operatorname{diag}(\sigma_p^2, \sigma_v^2)$. Show that the correlation coefficient after the step is $\rho = \sigma_v\Delta t/\sqrt{\sigma_p^2 + \sigma_v^2\Delta t^2}$ and explain what happens to it as $\Delta t \to \infty$.
:::

::: answer
From $\mathbf{F}\mathbf{P}\mathbf{F}^{\mathsf{T}}$, the covariance is $\sigma_v^2\Delta t$ and the two variances are $\sigma_p^2 + \sigma_v^2\Delta t^2$ and $\sigma_v^2$. So $\rho = \sigma_v^2\Delta t/\big(\sigma_v\sqrt{\sigma_p^2 + \sigma_v^2\Delta t^2}\big) = \sigma_v\Delta t/\sqrt{\sigma_p^2 + \sigma_v^2\Delta t^2}$. As $\Delta t \to \infty$ the $\sigma_p^2$ under the root becomes negligible and $\rho \to 1$: after a long coast the position error is entirely the integrated velocity error, and knowing one is knowing the other. The covariance is then nearly singular, with eigenvector close to $(\Delta t, 1)^{\mathsf{T}}$.
:::

::: check
You need samples from $\mathcal{N}(\mathbf{0}, \mathbf{P})$ with $\mathbf{P} = \begin{bmatrix} 16 & 4 \\ 4 & 5 \end{bmatrix}$ but have only independent standard normals. Write down the matrix you would multiply them by, and verify it.
:::

::: answer
The Cholesky factor has $L_{11} = \sqrt{16} = 4$, $L_{21} = 4/4 = 1$ and $L_{22} = \sqrt{5 - 1^2} = 2$, so $\mathbf{L} = \begin{bmatrix} 4 & 0 \\ 1 & 2 \end{bmatrix}$. Check: $\mathbf{L}\mathbf{L}^{\mathsf{T}} = \begin{bmatrix} 16 & 4 \\ 4 & 1 + 4 \end{bmatrix} = \mathbf{P}$. Then $\mathbf{x} = \mathbf{L}\mathbf{z}$ has covariance $\mathbf{L}\mathbf{I}\mathbf{L}^{\mathsf{T}} = \mathbf{P}$. The second row says $x_2 = z_1 + 2z_2$: a part shared with $x_1 = 4z_1$ plus an independent remainder with variance $4 = \sigma_2^2(1 - \rho^2) = 5(1 - 0.2)$.
:::

::: check
A three-state covariance is mapped through $\mathbf{A} = \begin{bmatrix} 1 & 1 & 0 \\ 0 & 0 & 1 \end{bmatrix}$. What is the rank of the output covariance at most, which direction of the input uncertainty is lost, and is the output covariance singular?
:::

::: answer
$\mathbf{A}$ is $2 \times 3$ with rank $2$, so the output is $2 \times 2$ of rank at most $2$; it is generally *not* singular, because the output dimension equals the rank. The null space is spanned by $(1, -1, 0)^{\mathsf{T}}$: the difference $x_1 - x_2$ is invisible in the output, since only the sum $x_1 + x_2$ survives. Its uncertainty is discarded, not propagated. Singularity would arise only if $\mathbf{A}$ had more rows than its rank, or if the input covariance itself had zero variance along a direction that $\mathbf{A}$ maps onto.
:::

::: check
The measurement $z = h(x)$ with $h(x) = x^2$ is taken of a state $x \sim \mathcal{N}(10, 1)$ (units suppressed). Give the linearised mean and variance of $z$, then compute the exact mean and comment.
:::

::: answer
The Jacobian is $h'(x) = 2x = 20$ at the mean, so the linearised prediction is $\mu_z \approx 100$ with $\sigma_z^2 \approx 20^2 \times 1 = 400$, $\sigma_z = 20$. Exactly, $\mathbb{E}[x^2] = \mu^2 + \sigma^2 = 101$; the linearisation misses the $\sigma^2$ contribution from curvature, a $1\%$ bias here. The exact variance is $\operatorname{Var}(x^2) = \mathbb{E}[x^4] - 101^2$; with $\mathbb{E}[x^4] = \mu^4 + 6\mu^2\sigma^2 + 3\sigma^4 = 10\,000 + 600 + 3 = 10\,603$, this is $10\,603 - 10\,201 = 402$, so the linearised $400$ is within $0.5\%$. The linearisation is good because $\sigma = 1$ is small relative to the scale $\mu = 10$ over which $x^2$ bends; at $\mu = 2$ with the same $\sigma$ it would be poor.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\mathbf{y} = \mathbf{A}\mathbf{x} + \mathbf{b}$ | Affine map of a random vector |
| $\boldsymbol{\mu}_y = \mathbf{A}\boldsymbol{\mu}_x + \mathbf{b}$ | Mean transforms with the map; the shift moves it |
| $\mathbf{P}_y = \mathbf{A}\mathbf{P}_x\mathbf{A}^{\mathsf{T}}$ | Covariance transforms by the sandwich; the shift is irrelevant |
| $\mathbf{F} = \begin{bmatrix} 1 & \Delta t \\ 0 & 1 \end{bmatrix}$, $\operatorname{Cov}(p', v') = \sigma_v^2\Delta t$ | Dynamics create correlation between states |
| $\mathbf{a}^{\mathsf{T}}\mathbf{P}\mathbf{a} = \sum_{ij} P_{ij}$ for $\mathbf{a} = \mathbf{1}$ | Variance of a sum includes every covariance |
| Null space of $\mathbf{A}$ | Directions of input uncertainty destroyed; output may be singular |
| $\mathbf{R}\mathbf{P}\mathbf{R}^{\mathsf{T}}$ | Rotation: eigenvalues, trace and determinant unchanged |
| $\mathbf{P} = \mathbf{L}\mathbf{L}^{\mathsf{T}}$, $\mathbf{x} = \boldsymbol{\mu} + \mathbf{L}\mathbf{z}$ | Cholesky factor generates correlated samples |
| $\mathbf{z} = \mathbf{L}^{-1}(\mathbf{x} - \boldsymbol{\mu})$, $\lVert\mathbf{z}\rVert^2 = d^2$ | Whitening; squared length is the Mahalanobis distance |
| $\mathbf{S} = \mathbf{H}\mathbf{P}\mathbf{H}^{\mathsf{T}} + \mathbf{R}$, $\operatorname{Cov}(\mathbf{x}, \mathbf{z}) = \mathbf{P}\mathbf{H}^{\mathsf{T}}$ | Predicted-measurement covariance and cross-covariance |
| $\mathbf{K} = \mathbf{P}\mathbf{H}^{\mathsf{T}}\mathbf{S}^{-1}$ | Kalman gain: a ratio of covariances |
| $\mathbf{P}_y \approx \mathbf{J}\mathbf{P}_x\mathbf{J}^{\mathsf{T}}$, $\mathbf{P}_{k+1} = \mathbf{F}\mathbf{P}_k\mathbf{F}^{\mathsf{T}} + \mathbf{Q}$ | Linearised propagation; the EKF covariance step |
| $1/\operatorname{Var}(\hat{x}) = 1/\sigma_1^2 + 1/\sigma_2^2$ | Fusing independent estimates: information adds |

The next lesson looks at what happens when many random contributions are added together: their variances add, and their sum tends toward a Gaussian whatever their individual shapes, which is the central limit theorem and the reason the Gaussian assumption is so often defensible.
