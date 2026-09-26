---
id: l05-linear-transformations
title: Linear transformations of random vectors
minutes: 25
covers:
  - linear transformations of random vectors
---

Change a temperature from Celsius to Fahrenheit and you multiply by $1.8$ and add $32$. If the Celsius reading was uncertain, the Fahrenheit one is too — the spread gets stretched by $1.8$, and the $32$ does nothing to it. That was a single number. This lesson does the same thing for whole vectors of numbers pushed through a matrix.

It matters because almost everything a navigation filter does to its uncertainty is "multiply by a matrix and add something". Stepping the state forward in time is a matrix multiply. Predicting what a sensor should read is a matrix multiply. Turning an error from the vehicle's own axes into the navigation axes is a matrix multiply. Averaging two estimates is a matrix multiply. So the question "what happens to the mean and covariance of $\mathbf{x}$ when I form $\mathbf{y} = \mathbf{A}\mathbf{x} + \mathbf{b}$?" is the one you will answer more often than any other in estimation. The answer is one line: $\boldsymbol{\mu}_y = \mathbf{A}\boldsymbol{\mu}_x + \mathbf{b}$ and $\mathbf{P}_y = \mathbf{A}\mathbf{P}_x\mathbf{A}^{\mathsf{T}}$.

This lesson derives that line and then shows what it buys you: how motion creates correlation, how a matrix can throw information away, how to make correlated random samples from independent ones, where the Kalman gain comes from, and how a Jacobian stretches the rule to curved, nonlinear maps. The previous lesson treated the covariance $\mathbf{P}$ as a still picture. This one sets it moving.

## The sandwich rule

Let $\mathbf{x}$ be a random vector with $n$ parts, mean $\boldsymbol{\mu}_x$ and covariance $\mathbf{P}_x$. Let $\mathbf{A}$ be a fixed $m \times n$ matrix and $\mathbf{b}$ a fixed list of $m$ numbers. Form $\mathbf{y} = \mathbf{A}\mathbf{x} + \mathbf{b}$, a random vector with $m$ parts. A map like this — multiply, then shift — is called **[[affine|affine-word]]**.

**The mean.** Averaging is linear, and $\mathbf{A}$ and $\mathbf{b}$ are constants, so they pass straight through the average:

$$
\boldsymbol{\mu}_y = \mathbb{E}[\mathbf{A}\mathbf{x} + \mathbf{b}] = \mathbf{A}\,\mathbb{E}[\mathbf{x}] + \mathbf{b} = \mathbf{A}\boldsymbol{\mu}_x + \mathbf{b}.
$$

**The covariance.** First subtract the means. The deviation of $\mathbf{y}$ from its mean is

$$
\mathbf{y} - \boldsymbol{\mu}_y = \mathbf{A}\mathbf{x} + \mathbf{b} - \mathbf{A}\boldsymbol{\mu}_x - \mathbf{b} = \mathbf{A}(\mathbf{x} - \boldsymbol{\mu}_x).
$$

The shift $\mathbf{b}$ has cancelled. That is why sliding a quantity never changes its uncertainty — the $+32$ of the Fahrenheit scale. Now put that deviation into the definition of covariance:

$$
\mathbf{P}_y = \mathbb{E}\big[(\mathbf{y} - \boldsymbol{\mu}_y)(\mathbf{y} - \boldsymbol{\mu}_y)^{\mathsf{T}}\big]
= \mathbb{E}\big[\mathbf{A}(\mathbf{x} - \boldsymbol{\mu}_x)(\mathbf{x} - \boldsymbol{\mu}_x)^{\mathsf{T}}\mathbf{A}^{\mathsf{T}}\big]
= \mathbf{A}\,\mathbb{E}\big[(\mathbf{x} - \boldsymbol{\mu}_x)(\mathbf{x} - \boldsymbol{\mu}_x)^{\mathsf{T}}\big]\,\mathbf{A}^{\mathsf{T}}
= \mathbf{A}\mathbf{P}_x\mathbf{A}^{\mathsf{T}}.
$$

The second step uses the transpose rule $(\mathbf{A}\mathbf{v})^{\mathsf{T}} = \mathbf{v}^{\mathsf{T}}\mathbf{A}^{\mathsf{T}}$. The third pulls the constant matrices outside the average. Engineers call $\mathbf{A}\mathbf{P}\mathbf{A}^{\mathsf{T}}$ the **sandwich**: the covariance is the filling, with $\mathbf{A}$ on one side and its transpose on the other.

Nothing in the derivation used the shape of the distribution. So the rule holds for *any* random vector with a finite covariance, Gaussian or not. When $\mathbf{x}$ *is* Gaussian, $\mathbf{y}$ is Gaussian too, because a linear mix of jointly Gaussian variables is Gaussian. Then the new mean and covariance tell you everything about $\mathbf{y}$.

::: key
Under $\mathbf{y} = \mathbf{A}\mathbf{x} + \mathbf{b}$, the mean and covariance transform as $\boldsymbol{\mu}_y = \mathbf{A}\boldsymbol{\mu}_x + \mathbf{b}$ and $\mathbf{P}_y = \mathbf{A}\mathbf{P}_x\mathbf{A}^{\mathsf{T}}$. The shift $\mathbf{b}$ moves the mean and leaves the covariance alone. Replace $\mathbf{A}$ by a Jacobian and this becomes the EKF covariance propagation step.
:::

Two checks confirm the shape. With one number in and one out ($n = m = 1$), the rule reads $\sigma_y^2 = a^2\sigma_x^2$ — the scaling rule from the expectation lesson. And $\mathbf{P}_y$ is automatically symmetric and positive semi-definite. For any vector $\mathbf{c}$,

$$
\mathbf{c}^{\mathsf{T}}\mathbf{A}\mathbf{P}_x\mathbf{A}^{\mathsf{T}}\mathbf{c} = (\mathbf{A}^{\mathsf{T}}\mathbf{c})^{\mathsf{T}}\mathbf{P}_x(\mathbf{A}^{\mathsf{T}}\mathbf{c}) \geq 0,
$$

because $\mathbf{P}_x$ is positive semi-definite for every vector, including $\mathbf{A}^{\mathsf{T}}\mathbf{c}$. The sandwich keeps everything a covariance must have.

A computer is less tidy. Round-off can leave $\mathbf{A}\mathbf{P}\mathbf{A}^{\mathsf{T}}$ very slightly lopsided after many steps. So flight filters **[[symmetrise|square-root-filters]]** the result with $\tfrac{1}{2}(\mathbf{M} + \mathbf{M}^{\mathsf{T}})$, or carry a square-root factor of $\mathbf{P}$ instead of $\mathbf{P}$ itself.

::: note Units ride along
If $\mathbf{x}$ holds a position in metres and a velocity in metres per second, and $\mathbf{A}$ contains a time step $\Delta t$ in seconds, the units of $\mathbf{A}\mathbf{P}\mathbf{A}^{\mathsf{T}}$ come out consistent by themselves. That gives a useful check on any $\mathbf{A}$ you derive by hand: every entry of $\mathbf{A}\mathbf{P}\mathbf{A}^{\mathsf{T}}$ must have the units it should.
:::

## How motion creates correlation

Imagine you know roughly where a car is and roughly how fast it goes, and the two guesses have nothing to do with each other. Wait a minute. If the car was really going a bit faster than you thought, it is now a bit farther along than you think. The two errors have become tied together. The sandwich rule shows this happening.

Take a position $p$ and a velocity $v$ along one line, so $\mathbf{x} = (p, v)^{\mathsf{T}}$. Over a time step $\Delta t$ with no acceleration, $p' = p + v\,\Delta t$ and $v' = v$ (the prime, "p prime", marks the new value). As a matrix,

$$
\mathbf{x}' = \mathbf{F}\mathbf{x}, \qquad \mathbf{F} = \begin{bmatrix} 1 & \Delta t \\ 0 & 1 \end{bmatrix}.
$$

Start with uncorrelated errors, $\mathbf{P} = \operatorname{diag}(\sigma_p^2, \sigma_v^2)$. Multiplying out the sandwich gives

$$
\mathbf{F}\mathbf{P}\mathbf{F}^{\mathsf{T}} = \begin{bmatrix} \sigma_p^2 + \sigma_v^2\,\Delta t^2 & \sigma_v^2\,\Delta t \\ \sigma_v^2\,\Delta t & \sigma_v^2 \end{bmatrix}.
$$

Three things happened.

- The position variance grew by $\sigma_v^2\Delta t^2$. An uncertain speed piles up into an uncertain position.
- The velocity variance did not change. Nothing acted on the velocity.
- An off-diagonal entry appeared: $\operatorname{Cov}(p', v') = \sigma_v^2\Delta t$. The errors are now **[[correlated|coast-shear]]**.

That correlation is not a nuisance. It is how a later position measurement will be able to fix the velocity. If the velocity error was positive, the position error grew positive with it. So a position that reads too far is evidence of a velocity that is too high, and the covariance now records that link.

::: example Coasting for a minute
A vehicle's along-track position is known to $\sigma_p = 10\,\mathrm{m}$ and its along-track velocity to $\sigma_v = 0.1\,\mathrm{m/s}$, uncorrelated. It coasts for $\Delta t = 60\,\mathrm{s}$ with no measurements.

The pieces are $\sigma_p^2 = 100\,\mathrm{m^2}$, $\sigma_v^2 = 0.01\,\mathrm{m^2/s^2}$ and $\Delta t^2 = 3600\,\mathrm{s^2}$. So

$$
\mathbf{P}' = \begin{bmatrix} 100 + 0.01 \times 3600 & 0.01 \times 60 \\ 0.01 \times 60 & 0.01 \end{bmatrix}
= \begin{bmatrix} 136 & 0.6 \\ 0.6 & 0.01 \end{bmatrix},
$$

in units of $\mathrm{m^2}$, $\mathrm{m^2/s}$ and $\mathrm{m^2/s^2}$.

The position sigma has grown from $10$ to $\sqrt{136} = 11.7\,\mathrm{m}$. The correlation is $\rho = 0.6/\sqrt{136 \times 0.01} = 0.514$. A minute ago the two errors had nothing to do with each other; now they are strongly linked.

Coast for ten minutes ($600\,\mathrm{s}$) instead. The position variance becomes $100 + 0.01 \times 360\,000 = 3700\,\mathrm{m^2}$, so $\sigma_p = 60.8\,\mathrm{m}$, and $\rho = 6/\sqrt{3700 \times 0.01} = 0.986$. The position error is then almost entirely the piled-up velocity error — which makes sense, since $0.1\,\mathrm{m/s}$ for $600\,\mathrm{s}$ is $60\,\mathrm{m}$.
:::

## Picking, adding and subtracting parts

Not every $\mathbf{A}$ is square.

**Picking.** A row of $\mathbf{A}$ with a single $1$ picks out one part of $\mathbf{x}$. A matrix made of such rows pulls out a smaller vector, and $\mathbf{A}\mathbf{P}\mathbf{A}^{\mathsf{T}}$ is then the matching block of $\mathbf{P}$: cross out the rows and columns you do not want. For a Gaussian, the leftover parts are Gaussian with exactly that block. That is why a position-only error ellipse can be drawn from the top-left corner of a fifteen-state covariance with no further work.

**Adding.** A row of ones adds the parts. With $\mathbf{a} = (1, 1, \ldots, 1)^{\mathsf{T}}$, the variance of the sum is $\mathbf{a}^{\mathsf{T}}\mathbf{P}\mathbf{a} = \sum_i\sum_j P_{ij}$ — the sum of *every* entry of $\mathbf{P}$, on and off the diagonal. This is the vector form of $\operatorname{Var}(X + Y) = \operatorname{Var}(X) + \operatorname{Var}(Y) + 2\operatorname{Cov}(X, Y)$. Variances add on their own only when the off-diagonal entries are zero.

**Subtracting.** A row $(1, -1)$ takes a difference. Differencing shows the most important property a non-square $\mathbf{A}$ can have: a **null space**. That is the set of directions $\mathbf{n}$ with $\mathbf{A}\mathbf{n} = \mathbf{0}$ — directions the matrix squashes to nothing. Any part of $\mathbf{x}$ along such a direction is invisible in $\mathbf{y}$. Its uncertainty is not carried forward; it is destroyed.

The output covariance then has **rank** (number of independent directions) at most $\operatorname{rank}(\mathbf{A})$. When $m > \operatorname{rank}(\mathbf{A})$ — more outputs than independent directions — it is singular.

::: example Differencing three sensors
Three sensors measure the same quantity. Their error vector $\mathbf{x}$ has covariance

$$
\mathbf{P} = \begin{bmatrix} 4 & 1 & 0 \\ 1 & 2 & -0.5 \\ 0 & -0.5 & 1 \end{bmatrix},
$$

the same matrix as the previous lesson's 3-D example. Form two differences, $y_1 = x_1 - x_2$ and $y_2 = x_2 - x_3$:

$$
\mathbf{A} = \begin{bmatrix} 1 & -1 & 0 \\ 0 & 1 & -1 \end{bmatrix}, \qquad
\mathbf{A}\mathbf{P}\mathbf{A}^{\mathsf{T}} = \begin{bmatrix} 4 & -1.5 \\ -1.5 & 4 \end{bmatrix}.
$$

Check one entry by hand: $\operatorname{Var}(x_1 - x_2) = P_{11} + P_{22} - 2P_{12} = 4 + 2 - 2 = 4$.

The null space of $\mathbf{A}$ is the direction $(1, 1, 1)^{\mathsf{T}}$. An error shared equally by all three sensors cancels in every difference. That shared, **[[common-mode|common-mode]]** part of the input uncertainty has variance $\mathbf{a}^{\mathsf{T}}\mathbf{P}\mathbf{a} = 8$ for $\mathbf{a} = (1, 1, 1)^{\mathsf{T}}$ (add up all nine entries), and all of it has been thrown away. The differences tell you how the sensors disagree with one another, and nothing about what they agree on.

Add a third row $x_3 - x_1$ and the $3 \times 3$ result has rank two and a zero eigenvalue — that row is minus the sum of the other two — so it cannot be inverted.
:::

::: warning A singular output is a message, not a bug
A singular output covariance is not an arithmetic slip. It is the arithmetic telling you that some direction has zero variance because $\mathbf{A}$ wiped it out. The mistake is to treat the output as if it still described a full $m$-dimensional uncertainty — for instance, by inverting it. Look at the null space of $\mathbf{A}$ and name the direction that was lost.
:::

## Rotations keep the ellipse's shape

Turn a photo of an egg on the table and the egg does not change. The same is true of an error ellipse when you only change which axes you describe it in.

When $\mathbf{A}$ is a rotation matrix $\mathbf{R}$, with $\mathbf{R}^{\mathsf{T}}\mathbf{R} = \mathbf{I}$, the product $\mathbf{R}\mathbf{P}\mathbf{R}^{\mathsf{T}}$ keeps the eigenvalues of $\mathbf{P}$ and turns its eigenvectors by $\mathbf{R}$. The ellipsoid keeps its size and shape and turns with the frame. Its **trace** (sum of the diagonal, which is the total variance $\sum_i \sigma_i^2$) stays the same, and so does its determinant (which fixes the ellipsoid's volume). This is exactly right when you express a body-frame covariance in the navigation frame. The uncertainty is a physical thing and must not depend on which axes you use.

The diagonal entries *do* change. Rotate the previous lesson's $\mathbf{P} = \begin{bmatrix} 4 & 1 \\ 1 & 2 \end{bmatrix}$ by $22.5^\circ$, the tilt of its long axis, and you get $\operatorname{diag}(4.414, 1.586)$. The matrix becomes diagonal, the single-axis sigmas become the principal sigmas, and the correlation disappears. Correlation belongs to the axes you chose, not to the uncertainty itself.

## Making correlated samples, and undoing it

Now run the rule backwards. You want random samples from $\mathcal{N}(\boldsymbol{\mu}, \mathbf{P})$ for a simulation. But your random number generator gives only independent standard normals: a vector $\mathbf{z} \sim \mathcal{N}(\mathbf{0}, \mathbf{I})$, where $\mathbf{I}$ is the identity matrix.

Find any matrix $\mathbf{L}$ with $\mathbf{L}\mathbf{L}^{\mathsf{T}} = \mathbf{P}$ — a kind of square root of $\mathbf{P}$ — and set $\mathbf{x} = \boldsymbol{\mu} + \mathbf{L}\mathbf{z}$. By the sandwich rule, $\mathbb{E}[\mathbf{x}] = \boldsymbol{\mu}$ and $\operatorname{Cov}(\mathbf{x}) = \mathbf{L}\,\mathbf{I}\,\mathbf{L}^{\mathsf{T}} = \mathbf{P}$. And since $\mathbf{x}$ is a linear map of a Gaussian, it is Gaussian.

The standard choice is the **[[Cholesky factor|cholesky]]**: the one lower-triangular matrix (zeros above the diagonal) with positive diagonal that satisfies $\mathbf{L}\mathbf{L}^{\mathsf{T}} = \mathbf{P}$. It exists whenever $\mathbf{P}$ is positive definite. It is the matrix square root you will use for every Monte Carlo campaign in this course.

For a $2 \times 2$ covariance you can write it down directly:

$$
\mathbf{P} = \begin{bmatrix} P_{11} & P_{12} \\ P_{12} & P_{22} \end{bmatrix}
\quad\Longrightarrow\quad
\mathbf{L} = \begin{bmatrix} \sqrt{P_{11}} & 0 \\ P_{12}/\sqrt{P_{11}} & \sqrt{P_{22} - P_{12}^2/P_{11}} \end{bmatrix}.
$$

Read the second row as a recipe. The first sample, $x_1$, is a scaled standard normal. The second is a part that copies $x_1$ (through $P_{12}/\sqrt{P_{11}}$) plus a fresh, independent part. The fresh part's variance, $P_{22} - P_{12}^2/P_{11} = \sigma_2^2(1 - \rho^2)$, is the conditional variance from the end of the previous lesson. Cholesky factoring is conditioning, one variable at a time.

The reverse step is **[[whitening|whitening-word]]**. Given data $\mathbf{x}$ with known covariance $\mathbf{P} = \mathbf{L}\mathbf{L}^{\mathsf{T}}$, the vector $\mathbf{z} = \mathbf{L}^{-1}(\mathbf{x} - \boldsymbol{\mu})$ has covariance $\mathbf{L}^{-1}\mathbf{P}\mathbf{L}^{-\mathsf{T}} = \mathbf{I}$. Its parts are uncorrelated with unit variance. Whitened data are the natural input to any test of whether a filter's errors are behaving. And the squared length of the whitened vector is the squared Mahalanobis distance:

$$
\|\mathbf{z}\|^2 = (\mathbf{x} - \boldsymbol{\mu})^{\mathsf{T}}\mathbf{L}^{-\mathsf{T}}\mathbf{L}^{-1}(\mathbf{x} - \boldsymbol{\mu}) = (\mathbf{x} - \boldsymbol{\mu})^{\mathsf{T}}\mathbf{P}^{-1}(\mathbf{x} - \boldsymbol{\mu}) = d^2.
$$

The middle step uses $\mathbf{P}^{-1} = (\mathbf{L}\mathbf{L}^{\mathsf{T}})^{-1} = \mathbf{L}^{-\mathsf{T}}\mathbf{L}^{-1}$.

::: example Cholesky sampling and whitening in two dimensions
Take $\mathbf{P} = \begin{bmatrix} 4 & 1 \\ 1 & 2 \end{bmatrix}$. The formula gives $L_{11} = \sqrt{4} = 2$, $L_{21} = 1/2 = 0.5$ and $L_{22} = \sqrt{2 - 1/4} = \sqrt{1.75}$:

$$
\mathbf{L} = \begin{bmatrix} 2 & 0 \\ 0.5 & \sqrt{1.75} \end{bmatrix} = \begin{bmatrix} 2 & 0 \\ 0.5 & 1.323 \end{bmatrix}.
$$

Check: $\mathbf{L}\mathbf{L}^{\mathsf{T}} = \begin{bmatrix} 4 & 1 \\ 1 & 0.25 + 1.75 \end{bmatrix} = \mathbf{P}$.

Feed in $\mathbf{z} = (1, 0)^{\mathsf{T}}$ and out comes $\mathbf{x} = (2, 0.5)^{\mathsf{T}}$. Feed in $(0, 1)^{\mathsf{T}}$ and out comes $(0, 1.323)^{\mathsf{T}}$. Feed in $(1, 1)^{\mathsf{T}}$ and out comes $(2, 1.823)^{\mathsf{T}}$.

The squared Mahalanobis distances of those three points under $\mathbf{P}$ are $\|\mathbf{z}\|^2 = 1$, $1$ and $2$ — no need to form $\mathbf{P}^{-1}$. A point one unit out in whitened coordinates has $d^2 = 1$ in the original ones, whatever the correlation.
:::

Here is the same thing in code, checked on 200 000 samples:

```python
import numpy as np

rng = np.random.default_rng(0)
mu = np.array([1.0, -2.0])
P = np.array([[4.0, 1.0], [1.0, 2.0]])
L = np.linalg.cholesky(P)             # lower triangular, L @ L.T == P
z = rng.standard_normal((200_000, 2))  # independent standard normals
x = mu + z @ L.T                      # each row is one sample of N(mu, P)
print(np.round(np.cov(x, rowvar=False), 2))
# [[4.01 0.99]
#  [0.99 2.  ]]
w = np.linalg.solve(L, (x - mu).T).T  # whitened samples
print(np.round(np.cov(w, rowvar=False), 2))
# [[ 1. -0.]
#  [-0.  1.]]
```

## Where the Kalman gain comes from

Stack two random vectors into one and the sandwich rule handles both at once.

Let $\mathbf{x}$ be a state with covariance $\mathbf{P}$. A sensor delivers $\mathbf{z} = \mathbf{H}\mathbf{x} + \mathbf{v}$. Here $\mathbf{H}$ is a known $m \times n$ **measurement matrix** (it says what the sensor sees), and $\mathbf{v}$ is zero-mean measurement noise with covariance $\mathbf{R}$, independent of $\mathbf{x}$. The stacked vector $(\mathbf{x}, \mathbf{v})$ has covariance $\operatorname{diag}(\mathbf{P}, \mathbf{R})$ — blocks on the diagonal, zeros off it. Then

$$
\begin{bmatrix} \mathbf{x} \\ \mathbf{z} \end{bmatrix}
= \begin{bmatrix} \mathbf{I} & \mathbf{0} \\ \mathbf{H} & \mathbf{I} \end{bmatrix}
\begin{bmatrix} \mathbf{x} \\ \mathbf{v} \end{bmatrix}
\quad\Longrightarrow\quad
\operatorname{Cov}\begin{bmatrix} \mathbf{x} \\ \mathbf{z} \end{bmatrix}
= \begin{bmatrix} \mathbf{P} & \mathbf{P}\mathbf{H}^{\mathsf{T}} \\ \mathbf{H}\mathbf{P} & \mathbf{H}\mathbf{P}\mathbf{H}^{\mathsf{T}} + \mathbf{R} \end{bmatrix}.
$$

Multiply the sandwich out block by block to confirm it. The bottom-right block, $\mathbf{S} = \mathbf{H}\mathbf{P}\mathbf{H}^{\mathsf{T}} + \mathbf{R}$, is the covariance of the predicted measurement: the state's uncertainty seen through the sensor, plus the sensor's own noise. The off-diagonal block $\mathbf{P}\mathbf{H}^{\mathsf{T}}$ is the **cross-covariance** between state and measurement. It exists only because the measurement depends on the state.

Now recall the conditioning rule from the previous lesson: the guess for one variable moves by (covariance with the observed one) ÷ (variance of the observed one) × (the surprise). The same rule in matrix form, conditioning $\mathbf{x}$ on $\mathbf{z}$, is

$$
\hat{\mathbf{x}} = \boldsymbol{\mu}_x + \mathbf{K}(\mathbf{z} - \mathbf{H}\boldsymbol{\mu}_x), \qquad
\mathbf{K} = \mathbf{P}\mathbf{H}^{\mathsf{T}}\mathbf{S}^{-1}, \qquad
\mathbf{P}^{+} = \mathbf{P} - \mathbf{K}\mathbf{H}\mathbf{P}.
$$

That is the Kalman update, and $\mathbf{K}$ is the **[[Kalman gain|kalman-gain]]**. Every piece came from the sandwich applied to a stacked vector. The estimation track derives it in full. The point here is that the gain is a ratio of covariances, and both are linear transforms of $\mathbf{P}$.

Go back to the coasting example, where after a minute $\mathbf{P}' = \begin{bmatrix} 136 & 0.6 \\ 0.6 & 0.01 \end{bmatrix}$. A position fix with $\sigma = 5\,\mathrm{m}$ arrives, so $\mathbf{H} = \begin{bmatrix} 1 & 0 \end{bmatrix}$ and $R = 25\,\mathrm{m^2}$. Then $S = 136 + 25 = 161\,\mathrm{m^2}$, and

$$
\mathbf{K} = \left(\frac{136}{161},\ \frac{0.6}{161}\right)^{\mathsf{T}} = (0.845,\ 0.00373)^{\mathsf{T}}.
$$

The second part of the gain is not zero. A position measurement corrects the velocity, by $3.73\,\mathrm{mm/s}$ per metre of surprise, only because the coast made the two errors correlated. After the update, $\sigma_p = 4.60\,\mathrm{m}$ — better than both the $11.7\,\mathrm{m}$ prediction and the $5\,\mathrm{m}$ fix — and $\sigma_v = 0.0881\,\mathrm{m/s}$. The velocity was never measured, yet its sigma fell from $0.1$ to $0.088\,\mathrm{m/s}$.

## Curved maps and the Jacobian

Real measurements and real motion are rarely linear. A radar reports a range and a bearing, not $x$ and $y$. Gravity is not linear in position. For a smooth nonlinear map $\mathbf{y} = \mathbf{g}(\mathbf{x})$, zoom in near the mean until the curve looks straight — the same idea as a tangent line in calculus:

$$
\mathbf{g}(\mathbf{x}) \approx \mathbf{g}(\boldsymbol{\mu}_x) + \mathbf{J}(\mathbf{x} - \boldsymbol{\mu}_x), \qquad J_{ij} = \left.\frac{\partial g_i}{\partial x_j}\right|_{\boldsymbol{\mu}_x}.
$$

$\mathbf{J}$ is the **[[Jacobian|jacobian]]**: the table of slopes, with row $i$, column $j$ saying how much output $i$ changes per unit of input $j$, measured at the mean. To first order the map is affine, with $\mathbf{A} = \mathbf{J}$ and $\mathbf{b} = \mathbf{g}(\boldsymbol{\mu}_x) - \mathbf{J}\boldsymbol{\mu}_x$. So

$$
\boldsymbol{\mu}_y \approx \mathbf{g}(\boldsymbol{\mu}_x), \qquad \mathbf{P}_y \approx \mathbf{J}\mathbf{P}_x\mathbf{J}^{\mathsf{T}}.
$$

This is **linearised covariance propagation**, and it is the whole covariance side of the extended Kalman filter (EKF):

$$
\mathbf{P}_{k+1} = \mathbf{F}_k\mathbf{P}_k\mathbf{F}_k^{\mathsf{T}} + \mathbf{Q}_k.
$$

Here $\mathbf{F}_k$ is the Jacobian of the motion model at step $k$, and $\mathbf{Q}_k$ is the covariance of random disturbances added during the step. $\mathbf{Q}_k$ enters by the rule "variances of independent terms add".

The approximation is good when the map is nearly straight across the width of the uncertainty — roughly, when the curvature terms are small next to $\mathbf{J}(\mathbf{x} - \boldsymbol{\mu}_x)$ over a few sigma. When they are not, the mean comes out biased and the covariance wrong. The fixes — a second-order correction, an unscented transform or a Monte Carlo run — come later in the course.

::: example Range and bearing to x and y
A radar reports range $r = 1000\,\mathrm{m}$ with $\sigma_r = 5\,\mathrm{m}$, and bearing $\theta = 30^\circ$ with $\sigma_\theta = 1^\circ = 0.01745\,\mathrm{rad}$, uncorrelated. The flat position is $x = r\cos\theta$, $y = r\sin\theta$.

**The Jacobian.** Differentiate each output by each input: $\partial x/\partial r = \cos\theta$, $\partial x/\partial\theta = -r\sin\theta$, $\partial y/\partial r = \sin\theta$, $\partial y/\partial\theta = r\cos\theta$. At the mean,

$$
\mathbf{J} = \begin{bmatrix} \cos\theta & -r\sin\theta \\ \sin\theta & r\cos\theta \end{bmatrix}
= \begin{bmatrix} 0.866 & -500 \\ 0.500 & 866 \end{bmatrix}.
$$

The second column has units of metres per radian.

**The sandwich.** With $\mathbf{P}_{r\theta} = \operatorname{diag}(25\,\mathrm{m^2},\ 3.046 \times 10^{-4}\,\mathrm{rad^2})$,

$$
\mathbf{P}_{xy} = \mathbf{J}\mathbf{P}_{r\theta}\mathbf{J}^{\mathsf{T}} = \begin{bmatrix} 94.9 & -121.1 \\ -121.1 & 234.7 \end{bmatrix}\,\mathrm{m^2}.
$$

**Read it.** $\sigma_x = 9.74\,\mathrm{m}$, $\sigma_y = 15.3\,\mathrm{m}$ and $\rho = -0.811$. The correlation is strongly negative because a bearing error slides the point sideways, along a line that runs up-left to down-right. The eigenvalues are $304.6$ and $25.0\,\mathrm{m^2}$, so the principal sigmas are $17.45\,\mathrm{m}$ and $5.00\,\mathrm{m}$, and the long axis points at $-60^\circ$ — **[[square to the line of sight|range-bearing-picture]]**.

**Sanity check.** Those two numbers are no accident. $17.45\,\mathrm{m} = r\sigma_\theta = 1000 \times 0.01745$ is the sideways (cross-range) uncertainty, and $5\,\mathrm{m} = \sigma_r$ is the range uncertainty. The Jacobian has turned the range–bearing error ellipse into $x$–$y$ axes without changing its size, because at fixed $r$ the map is very nearly a rotation plus a stretch of the bearing axis by $r$. The linearisation is excellent here: $1^\circ$ is tiny next to the angles over which $\cos$ and $\sin$ bend.
:::

## Blending two estimates

One more transform turns up everywhere. You have two independent estimates of the same number: $x_1$ with variance $\sigma_1^2$ and $x_2$ with variance $\sigma_2^2$. Blend them with a weighted average, $\hat{x} = w x_1 + (1 - w) x_2$.

This is $\mathbf{A} = \begin{bmatrix} w & 1 - w \end{bmatrix}$ applied to $\operatorname{diag}(\sigma_1^2, \sigma_2^2)$, so $\operatorname{Var}(\hat{x}) = w^2\sigma_1^2 + (1 - w)^2\sigma_2^2$. Set the derivative with respect to $w$ to zero, $2w\sigma_1^2 - 2(1 - w)\sigma_2^2 = 0$, and solve:

$$
w = \frac{\sigma_2^2}{\sigma_1^2 + \sigma_2^2}, \qquad
\operatorname{Var}(\hat{x}) = \frac{\sigma_1^2\sigma_2^2}{\sigma_1^2 + \sigma_2^2}, \qquad
\frac{1}{\operatorname{Var}(\hat{x})} = \frac{1}{\sigma_1^2} + \frac{1}{\sigma_2^2}.
$$

Each estimate is weighted by the *other one's* variance: the noisier the other, the more you trust this one. And inverse variances add. Estimation calls one over a variance **[[information|information-adds]]**, so information adds.

For $\sigma_1 = 3\,\mathrm{m}$ and $\sigma_2 = 4\,\mathrm{m}$: $w = 16/(9 + 16) = 16/25 = 0.64$ on the better estimate, and the blended sigma is $\sqrt{9 \times 16/25} = \sqrt{5.76} = 2.4\,\mathrm{m}$ — better than either input, as it should be.

Had the two estimates been correlated, the off-diagonal term would enter the variance and the best weight would shift, as the correlated accelerometers in the expectation lesson showed.

::: warning Keep every correlation in the filling
The sandwich needs the covariance of the *inputs* to include every correlation among them. If you set the off-diagonal terms to zero because they were inconvenient, the output covariance is wrong in both directions: too large where the errors would have cancelled, too small where they would have added up. The most common case is blending two estimates that share an upstream error source and treating them as independent. The blended covariance then claims a precision that does not exist.
:::

## Check yourself

::: check
A state $\mathbf{x} = (x_1, x_2)^{\mathsf{T}}$ has covariance $\mathbf{P} = \begin{bmatrix} 9 & 2 \\ 2 & 4 \end{bmatrix}$. Find the variance of $y = 3x_1 - 2x_2 + 7$.
:::

::: answer
The $+7$ shifts the mean and does nothing to the variance. With $\mathbf{a} = (3, -2)^{\mathsf{T}}$,

$$
\operatorname{Var}(y) = \mathbf{a}^{\mathsf{T}}\mathbf{P}\mathbf{a} = 3^2 \times 9 + (-2)^2 \times 4 + 2 \times 3 \times (-2) \times 2 = 81 + 16 - 24 = 73.
$$

Ignoring the covariance would give $81 + 16 = 97$. The positive correlation between $x_1$ and $x_2$ partly cancels in a difference.
:::

::: check
The position–velocity state of the coasting example starts at $\mathbf{P} = \operatorname{diag}(\sigma_p^2, \sigma_v^2)$ and is stepped forward by $\Delta t$. Show that the correlation afterwards is $\rho = \sigma_v\Delta t/\sqrt{\sigma_p^2 + \sigma_v^2\Delta t^2}$, and say what happens to it as $\Delta t \to \infty$.
:::

::: answer
From $\mathbf{F}\mathbf{P}\mathbf{F}^{\mathsf{T}}$, the covariance is $\sigma_v^2\Delta t$ and the two variances are $\sigma_p^2 + \sigma_v^2\Delta t^2$ and $\sigma_v^2$. So

$$
\rho = \frac{\sigma_v^2\Delta t}{\sigma_v\sqrt{\sigma_p^2 + \sigma_v^2\Delta t^2}} = \frac{\sigma_v\Delta t}{\sqrt{\sigma_p^2 + \sigma_v^2\Delta t^2}}.
$$

As $\Delta t \to \infty$, the $\sigma_p^2$ under the root becomes tiny next to $\sigma_v^2\Delta t^2$, and $\rho \to 1$. After a long coast the position error is entirely the piled-up velocity error: knowing one is knowing the other. The covariance is then nearly singular, with its long eigenvector close to $(\Delta t, 1)^{\mathsf{T}}$.
:::

::: check
You need samples from $\mathcal{N}(\mathbf{0}, \mathbf{P})$ with $\mathbf{P} = \begin{bmatrix} 16 & 4 \\ 4 & 5 \end{bmatrix}$, but have only independent standard normals. Write down the matrix you would multiply them by, and check it.
:::

::: answer
The Cholesky factor has $L_{11} = \sqrt{16} = 4$, $L_{21} = 4/4 = 1$ and $L_{22} = \sqrt{5 - 1^2} = 2$, so $\mathbf{L} = \begin{bmatrix} 4 & 0 \\ 1 & 2 \end{bmatrix}$.

Check: $\mathbf{L}\mathbf{L}^{\mathsf{T}} = \begin{bmatrix} 16 & 4 \\ 4 & 1 + 4 \end{bmatrix} = \mathbf{P}$. So $\mathbf{x} = \mathbf{L}\mathbf{z}$ has covariance $\mathbf{L}\mathbf{I}\mathbf{L}^{\mathsf{T}} = \mathbf{P}$.

The second row says $x_2 = z_1 + 2z_2$: a part shared with $x_1 = 4z_1$, plus a fresh part with variance $4$. That matches $\sigma_2^2(1 - \rho^2) = 5(1 - 0.2) = 4$, since $\rho^2 = 16/(16 \times 5) = 0.2$.
:::

::: check
A three-state covariance is pushed through $\mathbf{A} = \begin{bmatrix} 1 & 1 & 0 \\ 0 & 0 & 1 \end{bmatrix}$. What is the most the rank of the output covariance can be, which direction of the input uncertainty is lost, and is the output singular?
:::

::: answer
$\mathbf{A}$ is $2 \times 3$ with rank $2$, so the output is $2 \times 2$ with rank at most $2$. It is usually *not* singular, because the number of outputs equals the rank.

The null space is the direction $(1, -1, 0)^{\mathsf{T}}$: the difference $x_1 - x_2$ is invisible in the output, since only the sum $x_1 + x_2$ survives. Its uncertainty is thrown away, not carried forward.

The output would be singular only if $\mathbf{A}$ had more rows than its rank, or if the input covariance already had zero variance along a direction that $\mathbf{A}$ maps onto.
:::

::: check
A measurement $z = h(x)$ with $h(x) = x^2$ is taken of a state $x \sim \mathcal{N}(10, 1)$ (units left out). Give the linearised mean and variance of $z$, then compute the exact mean and variance and comment.
:::

::: answer
**Linearised.** The slope is $h'(x) = 2x = 20$ at the mean. So $\mu_z \approx 10^2 = 100$ and $\sigma_z^2 \approx 20^2 \times 1 = 400$, $\sigma_z = 20$.

**Exact mean.** $\mathbb{E}[x^2] = \mu^2 + \sigma^2 = 100 + 1 = 101$. The linearisation misses the $\sigma^2$ that comes from curvature: a $1\%$ bias here.

**Exact variance.** $\operatorname{Var}(x^2) = \mathbb{E}[x^4] - 101^2$. For a Gaussian, $\mathbb{E}[x^4] = \mu^4 + 6\mu^2\sigma^2 + 3\sigma^4 = 10\,000 + 600 + 3 = 10\,603$. So $\operatorname{Var}(x^2) = 10\,603 - 10\,201 = 402$, and the linearised $400$ is within $0.5\%$.

The linearisation is good because $\sigma = 1$ is small next to the scale $\mu = 10$ over which $x^2$ bends. At $\mu = 2$ with the same $\sigma$ it would be poor.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\mathbf{y} = \mathbf{A}\mathbf{x} + \mathbf{b}$ | Affine map of a random vector |
| $\boldsymbol{\mu}_y = \mathbf{A}\boldsymbol{\mu}_x + \mathbf{b}$ | The mean follows the map; the shift moves it |
| $\mathbf{P}_y = \mathbf{A}\mathbf{P}_x\mathbf{A}^{\mathsf{T}}$ | The covariance follows the sandwich; the shift does nothing |
| $\mathbf{F} = \begin{bmatrix} 1 & \Delta t \\ 0 & 1 \end{bmatrix}$, $\operatorname{Cov}(p', v') = \sigma_v^2\Delta t$ | Motion creates correlation between states |
| $\mathbf{a}^{\mathsf{T}}\mathbf{P}\mathbf{a} = \sum_{ij} P_{ij}$ for $\mathbf{a} = \mathbf{1}$ | Variance of a sum includes every covariance |
| Null space of $\mathbf{A}$ | Input directions destroyed; the output may be singular |
| $\mathbf{R}\mathbf{P}\mathbf{R}^{\mathsf{T}}$ | Rotation: eigenvalues, trace and determinant unchanged |
| $\mathbf{P} = \mathbf{L}\mathbf{L}^{\mathsf{T}}$, $\mathbf{x} = \boldsymbol{\mu} + \mathbf{L}\mathbf{z}$ | Cholesky factor makes correlated samples |
| $\mathbf{z} = \mathbf{L}^{-1}(\mathbf{x} - \boldsymbol{\mu})$, $\lVert\mathbf{z}\rVert^2 = d^2$ | Whitening; squared length is the Mahalanobis distance |
| $\mathbf{S} = \mathbf{H}\mathbf{P}\mathbf{H}^{\mathsf{T}} + \mathbf{R}$, $\operatorname{Cov}(\mathbf{x}, \mathbf{z}) = \mathbf{P}\mathbf{H}^{\mathsf{T}}$ | Predicted-measurement covariance and cross-covariance |
| $\mathbf{K} = \mathbf{P}\mathbf{H}^{\mathsf{T}}\mathbf{S}^{-1}$ | Kalman gain: a ratio of covariances |
| $\mathbf{P}_y \approx \mathbf{J}\mathbf{P}_x\mathbf{J}^{\mathsf{T}}$, $\mathbf{P}_{k+1} = \mathbf{F}\mathbf{P}_k\mathbf{F}^{\mathsf{T}} + \mathbf{Q}$ | Linearised propagation; the EKF covariance step |
| $1/\operatorname{Var}(\hat{x}) = 1/\sigma_1^2 + 1/\sigma_2^2$ | Blending independent estimates: information adds |

Next lesson: what happens when many random pieces are added together. Their variances add, and their sum drifts toward a Gaussian whatever the pieces looked like — the central limit theorem, and the reason the Gaussian assumption is so often fair.

::: context affine-word Linear, or affine?
Strictly, a **linear** map sends zero to zero: $\mathbf{y} = \mathbf{A}\mathbf{x}$. Adding a shift, $\mathbf{y} = \mathbf{A}\mathbf{x} + \mathbf{b}$, makes it **affine** — from the Latin for "related". Engineers often say "linear" for both, and for covariance it makes no difference, because the shift drops out. Celsius to Fahrenheit is affine: $0\,^\circ\mathrm{C}$ goes to $32\,^\circ\mathrm{F}$, not to zero.
:::

::: context square-root-filters Why filters carry a square root
Early flight computers stored numbers with few digits, and after thousands of steps a covariance could drift until it was no longer symmetric — or even claimed a negative variance, which sends a filter off the rails. One cure, worked out by James Potter for Apollo, was to store a square root $\mathbf{L}$ with $\mathbf{P} = \mathbf{L}\mathbf{L}^{\mathsf{T}}$ and update that instead. Any $\mathbf{L}\mathbf{L}^{\mathsf{T}}$ is symmetric and positive semi-definite automatically, so round-off can never make it illegal.
:::

::: context coast-shear The ellipse leans as you coast
Position and velocity errors before and after the one-minute coast, each measured in its own starting sigma ($10\,\mathrm{m}$ across, $0.1\,\mathrm{m/s}$ up). Before, the $1\sigma$ curve is a circle. After, it is an ellipse leaning $36.7^\circ$, with semi-axes $1.34$ and $0.74$: fast errors have drifted right, slow ones left.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="90" y1="100" x2="270" y2="100" stroke="#6c7a93" stroke-width="1"/>
  <line x1="180" y1="30" x2="180" y2="170" stroke="#6c7a93" stroke-width="1"/>
  <circle cx="180" cy="100" r="50" fill="none" stroke="#6c7a93" stroke-width="2" stroke-dasharray="5,4"/>
  <ellipse cx="180" cy="100" rx="67.2" ry="37.2" transform="rotate(-36.65 180 100)" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="274" y="104" font-size="11" fill="#1f2a44">position</text>
  <text x="186" y="26" font-size="11" fill="#1f2a44">velocity</text>
  <text x="20" y="60" font-size="11" fill="#6c7a93">before (circle)</text>
  <text x="250" y="50" font-size="11" fill="#1d6fd1">after 60 s</text>
  <text x="20" y="190" font-size="11" fill="#1f2a44">axes in starting sigmas; 1σ = 50 px</text>
</svg>
```
:::

::: context common-mode What "common-mode" means
Electrical engineers borrowed this word. A **common-mode** error is one that hits every channel the same way — the whole building's power flickers, and every sensor on the bench reads a little high together. Subtracting two channels cancels it, which is why so many instruments measure a difference. The price is the one in the example: whatever the channels share, the difference can never tell you.
:::

::: context cholesky A surveyor's shortcut
André-Louis Cholesky was a French army officer who worked on mapping and surveying. Surveying produces big sets of equations with symmetric matrices, and he found a fast way to solve them by splitting the matrix into a triangle times its own transpose. He was killed in the First World War in 1918, and a fellow officer published the method after his death. Today every Monte Carlo campaign and many flight filters run it.
:::

::: context whitening-word Why "whitening"?
White light is a mix of every colour in equal amounts. Engineers call noise **white** when it is spread evenly across every frequency, with no pattern linking one moment to the next. Whitening borrows the word: it removes the correlations, so what is left looks like independent, equal-sized noise in every direction. You will meet white noise properly two lessons from now.
:::

::: context kalman-gain How much to trust a measurement
Think of the gain as a dial between "ignore the sensor" ($\mathbf{K} = \mathbf{0}$) and "believe it completely". In one dimension it is $P/(P + R)$: if your prediction is shaky ($P$ large) and the sensor is sharp ($R$ small), the dial turns toward the sensor. In the coasting example the first entry, $0.845$, sits near "believe" because $136\,\mathrm{m^2}$ is much larger than $25\,\mathrm{m^2}$.
:::

::: context jacobian A table of slopes
Named after the German mathematician Carl Gustav Jacob Jacobi, who studied these tables in the 1840s. For one input and one output, the Jacobian is the ordinary derivative — the slope of the tangent line. With many inputs and outputs it becomes a grid of slopes, one for every pairing. Near the mean, a small wiggle $\delta\mathbf{x}$ in the input moves the output by about $\mathbf{J}\,\delta\mathbf{x}$, and that is all the sandwich needs.
:::

::: context range-bearing-picture The ellipse lies across the line of sight
A radar at the bottom left sees a target $1000\,\mathrm{m}$ away at $30^\circ$. The $3\sigma$ ellipse is drawn at its own scale, $1$ pixel per metre: $52\,\mathrm{m}$ across the line of sight (from the $1^\circ$ bearing error) and $15\,\mathrm{m}$ along it (from the $5\,\mathrm{m}$ range error). The range line is shortened to fit.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <circle cx="40" cy="170" r="5" fill="#1f2a44"/>
  <line x1="40" y1="170" x2="213.2" y2="70" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="6,4"/>
  <line x1="40" y1="170" x2="120" y2="170" stroke="#6c7a93" stroke-width="1"/>
  <text x="100" y="163" font-size="11" fill="#1f2a44">30°</text>
  <ellipse cx="213.2" cy="70" rx="52.4" ry="15" transform="rotate(60 213.2 70)" fill="#8fb8f0" fill-opacity="0.5" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="213.2" cy="70" r="2.5" fill="#b4232c"/>
  <text x="140" y="160" font-size="11" fill="#1f2a44">r = 1000 m (shortened)</text>
  <text x="262" y="112" font-size="11" fill="#1d6fd1">cross-range</text>
  <text x="262" y="126" font-size="11" fill="#1d6fd1">3σ = 52 m</text>
  <text x="236" y="40" font-size="11" fill="#1f2a44">range 3σ = 15 m</text>
  <text x="16" y="186" font-size="11" fill="#1f2a44">radar</text>
</svg>
```
:::

::: context information-adds Two blurry guesses make a sharp one
The two estimates from the example, drawn as bells: one centred at $-2\,\mathrm{m}$ with $\sigma = 3\,\mathrm{m}$, one at $+3\,\mathrm{m}$ with $\sigma = 4\,\mathrm{m}$. The blended estimate sits at $0.64 \times (-2) + 0.36 \times 3 = -0.2\,\mathrm{m}$, nearer the sharper guess, and its bell (sigma $2.4\,\mathrm{m}$) is narrower and taller than either.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <polyline fill="none" stroke="#8fb8f0" stroke-width="2" points="20.0,139.7 33.3,139.1 46.7,137.7 60.0,134.7 73.3,129.2 86.7,120.1 100.0,107.1 113.3,91.5 126.7,75.9 140.0,64.3 146.7,61.1 153.3,60.0 160.0,61.1 166.7,64.3 180.0,75.9 193.3,91.5 206.7,107.1 220.0,120.1 233.3,129.2 246.7,134.7 260.0,137.7 273.3,139.1 286.7,139.7 300.0,139.9 340.0,140.0"/>
  <polyline fill="none" stroke="#f2b880" stroke-width="2" points="20.0,139.9 60.0,139.3 80.0,138.1 100.0,135.2 120.0,129.7 140.0,120.5 160.0,108.1 173.3,99.1 186.7,90.6 200.0,84.1 213.3,80.5 220.0,80.0 226.7,80.5 240.0,84.1 253.3,90.6 266.7,99.1 280.0,108.1 300.0,120.5 320.0,129.7 340.0,135.2"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="20.0,140.0 60.0,139.9 80.0,139.0 93.3,136.8 106.7,131.3 120.0,119.9 133.3,101.1 146.7,76.8 153.3,64.5 160.0,53.6 166.7,45.4 173.3,40.8 180.0,40.3 186.7,44.2 193.3,51.8 200.0,62.2 213.3,86.9 226.7,109.5 240.0,125.3 253.3,134.0 266.7,138.0 280.0,139.4 300.0,139.9 340.0,140.0"/>
  <line x1="20" y1="140" x2="340" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="46.7" y="155">−10</text><text x="113.3" y="155">−5</text><text x="180" y="155">0</text><text x="246.7" y="155">5</text><text x="313.3" y="155">10 m</text>
  </g>
  <text x="96" y="56" font-size="11" fill="#6c7a93" text-anchor="middle">σ = 3</text>
  <text x="262" y="76" font-size="11" fill="#6c7a93" text-anchor="middle">σ = 4</text>
  <text x="206" y="34" font-size="11" fill="#1d6fd1">blended σ = 2.4</text>
</svg>
```
:::
