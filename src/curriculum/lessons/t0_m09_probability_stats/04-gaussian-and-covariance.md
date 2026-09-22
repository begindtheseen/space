---
id: l04-gaussian-and-covariance
title: The Gaussian, covariance matrices and error ellipsoids
minutes: 23
covers:
  - the Gaussian and multivariate Gaussian, covariance matrices, correlation
---

Open the state of any navigation filter and you will find two objects: a vector $\hat{\mathbf{x}}$, the best estimate of position, velocity and attitude, and a matrix $\mathbf{P}$, the covariance of the error in that estimate. Together they describe a Gaussian distribution. The filter does not carry the full density of the previous lesson, because for a Gaussian the mean and covariance *are* the full density; nothing else is needed. That is the first reason the Gaussian dominates estimation. The second is that it survives linear operations unchanged, so a linear filter can stay Gaussian forever. The third, the central limit theorem, is the subject of a later lesson: sums of many small independent errors come out Gaussian whether or not the individual errors were.

This lesson builds the Gaussian from the scalar case up to $n$ dimensions. On the way it defines the covariance matrix, which is the object you will handle more than any other in this curriculum, explains why it must be symmetric positive semi-definite, and turns it into a picture: the error ellipse or ellipsoid whose axes and orientation tell you at a glance where the uncertainty lives. It ends with a fact that surprises almost everyone the first time: a "3σ" ellipsoid in three dimensions does not contain $99.73\%$ of the probability.

## The scalar Gaussian

A random variable $X$ is **Gaussian** (or normal) with mean $\mu$ and variance $\sigma^2$, written $X \sim \mathcal{N}(\mu, \sigma^2)$, if its density is

$$
f_X(x) = \frac{1}{\sigma\sqrt{2\pi}}\,\exp\!\left(-\frac{(x - \mu)^2}{2\sigma^2}\right).
$$

The exponent is a downward parabola in $x$ centred on $\mu$, so the density is the familiar bell, symmetric about $\mu$, with inflection points at $\mu \pm \sigma$. The constant in front makes the area one. That constant is where the $\sqrt{2\pi}$ comes from, and it is worth seeing why once. Write $I = \int_{-\infty}^{\infty} e^{-z^2/2}\,dz$. Then $I^2$ is a double integral over the plane of $e^{-(z_1^2 + z_2^2)/2}$, which in polar coordinates becomes $\int_0^{2\pi}\!\int_0^\infty e^{-r^2/2}\,r\,dr\,d\theta = 2\pi$, so $I = \sqrt{2\pi}$. Substituting $z = (x - \mu)/\sigma$ supplies the factor $\sigma$.

The two parameters are exactly the mean and variance: $\mathbb{E}[X] = \mu$ by symmetry, and $\operatorname{Var}(X) = \sigma^2$ by an integration by parts you will meet in a moment. The density's peak height is $1/(\sigma\sqrt{2\pi}) = 0.399/\sigma$; for a $3\,\mathrm{m}$ position error that is $0.133\,\mathrm{m^{-1}}$, a reminder that densities carry units.

## The standard normal and what lies within $k\sigma$

Standardising $Z = (X - \mu)/\sigma$ gives the **standard normal** $Z \sim \mathcal{N}(0, 1)$, with density $\phi(z) = e^{-z^2/2}/\sqrt{2\pi}$ and CDF

$$
\Phi(z) = \int_{-\infty}^{z} \phi(u)\,du = \frac{1}{2}\left[1 + \operatorname{erf}\!\left(\frac{z}{\sqrt{2}}\right)\right],
$$

where $\operatorname{erf}$ is the error function, available in every numerical library (`math.erf` in Python). There is no closed form, but every probability question about any Gaussian reduces to $\Phi$: $P(X \leq x) = \Phi((x - \mu)/\sigma)$, and by symmetry $\Phi(-z) = 1 - \Phi(z)$.

The probability of lying within $k$ standard deviations of the mean is $P(|Z| \leq k) = 2\Phi(k) - 1$:

| $k$ | $P(\lvert X - \mu\rvert \leq k\sigma)$ | Outside |
| --- | --- | --- |
| 1 | $68.27\%$ | $31.73\%$ |
| 2 | $95.45\%$ | $4.55\%$ |
| 3 | $99.73\%$ | $0.27\%$ |
| 1.645 | $90\%$ | $10\%$ |
| 1.960 | $95\%$ | $5\%$ |
| 2.576 | $99\%$ | $1\%$ |

The first three rows are the ones to memorise; the last three are the multipliers behind $90\%$, $95\%$ and $99\%$ confidence intervals.

::: key
For a scalar Gaussian, the containment probabilities of $\pm 1\sigma$, $\pm 2\sigma$ and $\pm 3\sigma$ are $68.27\%$, $95.45\%$ and $99.73\%$. Equivalently, a $3\sigma$ bound is violated about $0.27\%$ of the time, or roughly once in 370 draws.
:::

The moments of $Z$ follow from one trick: $\phi'(z) = -z\,\phi(z)$. Then for any $k \geq 1$,

$$
\mathbb{E}[Z^{k+1}] = \int z^k \cdot z\,\phi(z)\,dz = \Big[-z^k \phi(z)\Big]_{-\infty}^{\infty} + k\int z^{k-1}\phi(z)\,dz = k\,\mathbb{E}[Z^{k-1}].
$$

With $\mathbb{E}[Z^0] = 1$ and $\mathbb{E}[Z^1] = 0$ this gives $\mathbb{E}[Z^2] = 1$, confirming that the parameter $\sigma^2$ is the variance, $\mathbb{E}[Z^3] = 0$, and $\mathbb{E}[Z^4] = 3$. So the Gaussian has zero skewness and kurtosis exactly $3$, the reference value quoted in the previous lesson. All odd moments vanish and all even moments are fixed by $\sigma$: nothing about the shape is left free.

::: example A GNSS position error budget
A receiver's horizontal cross-track error is modelled as $\mathcal{N}(0, (3\,\mathrm{m})^2)$. The probability that the error exceeds $5\,\mathrm{m}$ in magnitude is

$$
P(|X| > 5) = 2\big[1 - \Phi(5/3)\big] = 2\big[1 - \Phi(1.667)\big] = 0.0956,
$$

about one fix in ten. The probability that it exceeds $+7\,\mathrm{m}$ on one side only is $1 - \Phi(7/3) = 1 - \Phi(2.333) = 0.0098$, about one in a hundred. And $|X| > 9\,\mathrm{m}$, the $3\sigma$ level, has probability $0.0027$. If the requirement is that the error exceed $9\,\mathrm{m}$ no more than once per thousand fixes, this sensor fails it by nearly a factor of three even though $9\,\mathrm{m}$ is "three sigma" — a good reason to compute tail probabilities rather than reason in sigmas.
:::

## Random vectors and the covariance matrix

Stack $n$ random variables into a column vector $\mathbf{x} = (x_1, \ldots, x_n)^{\mathsf{T}}$. Its **mean vector** is $\boldsymbol{\mu} = \mathbb{E}[\mathbf{x}]$, the expectation taken component by component. Its **covariance matrix** is

$$
\mathbf{P} = \mathbb{E}\big[(\mathbf{x} - \boldsymbol{\mu})(\mathbf{x} - \boldsymbol{\mu})^{\mathsf{T}}\big],
$$

an $n \times n$ matrix whose $(i, j)$ entry is $\mathbb{E}[(x_i - \mu_i)(x_j - \mu_j)] = \operatorname{Cov}(x_i, x_j)$. The diagonal entries $P_{ii}$ are the variances $\sigma_i^2$ of the individual components, and the off-diagonal entries are the covariances between pairs. Because $\operatorname{Cov}(x_i, x_j) = \operatorname{Cov}(x_j, x_i)$, the matrix is symmetric.

It is also **positive semi-definite**, and the reason is worth understanding rather than memorising. Take any constant vector $\mathbf{a}$ and form the scalar $y = \mathbf{a}^{\mathsf{T}}\mathbf{x}$, a linear combination of the components. Its variance is

$$
\operatorname{Var}(y) = \mathbb{E}\big[(\mathbf{a}^{\mathsf{T}}(\mathbf{x} - \boldsymbol{\mu}))^2\big]
= \mathbb{E}\big[\mathbf{a}^{\mathsf{T}}(\mathbf{x} - \boldsymbol{\mu})(\mathbf{x} - \boldsymbol{\mu})^{\mathsf{T}}\mathbf{a}\big]
= \mathbf{a}^{\mathsf{T}}\mathbf{P}\mathbf{a}.
$$

A variance cannot be negative, so $\mathbf{a}^{\mathsf{T}}\mathbf{P}\mathbf{a} \geq 0$ for every $\mathbf{a}$, which is the definition of positive semi-definiteness. Consequently all eigenvalues of $\mathbf{P}$ are non-negative, and its determinant is non-negative. The matrix is *singular* precisely when some combination $\mathbf{a}^{\mathsf{T}}\mathbf{x}$ has zero variance, that is, when one direction of the state is known exactly. That is unusual but perfectly legal: a filter initialised with a perfectly known component has a singular, still valid, covariance. Positive semi-definite does not mean invertible.

::: key
The covariance matrix of a random vector is $\mathbf{P} = \mathbb{E}[(\mathbf{x} - \boldsymbol{\mu})(\mathbf{x} - \boldsymbol{\mu})^{\mathsf{T}}]$. It is symmetric and positive semi-definite, with the variances on the diagonal and the covariances off it. The quadratic form $\mathbf{a}^{\mathsf{T}}\mathbf{P}\mathbf{a}$ is the variance of $\mathbf{a}^{\mathsf{T}}\mathbf{x}$, which is why it can never be negative.
:::

Dividing each covariance by the two standard deviations gives the **correlation matrix** with entries $\rho_{ij} = P_{ij}/\sqrt{P_{ii}P_{jj}}$, ones on the diagonal and values in $[-1, 1]$ elsewhere. A quick validity check on any proposed covariance is that every $|\rho_{ij}| \leq 1$; a necessary condition that catches many typos, though not sufficient in more than two dimensions.

## The multivariate Gaussian

The vector $\mathbf{x}$ is **jointly Gaussian** with mean $\boldsymbol{\mu}$ and covariance $\mathbf{P}$, written $\mathbf{x} \sim \mathcal{N}(\boldsymbol{\mu}, \mathbf{P})$, if its density is

$$
p(\mathbf{x}) = \frac{1}{(2\pi)^{n/2}\,|\mathbf{P}|^{1/2}}\,
\exp\!\left(-\tfrac{1}{2}(\mathbf{x} - \boldsymbol{\mu})^{\mathsf{T}}\mathbf{P}^{-1}(\mathbf{x} - \boldsymbol{\mu})\right),
$$

where $|\mathbf{P}|$ is the determinant. For $n = 1$, $\mathbf{P} = \sigma^2$ and this is the scalar density. For a diagonal $\mathbf{P} = \operatorname{diag}(\sigma_1^2, \ldots, \sigma_n^2)$ the quadratic form is $\sum_i (x_i - \mu_i)^2/\sigma_i^2$ and the determinant is $\prod_i \sigma_i^2$, so the density factorises into a product of scalar Gaussians: uncorrelated jointly Gaussian components are independent. That is special to the Gaussian; the previous lesson showed that in general uncorrelated does not imply independent.

::: key
The multivariate Gaussian density is $p(\mathbf{x}) = \big((2\pi)^{n/2}|\mathbf{P}|^{1/2}\big)^{-1}\exp\!\big(-\tfrac{1}{2}(\mathbf{x}-\boldsymbol{\mu})^{\mathsf{T}}\mathbf{P}^{-1}(\mathbf{x}-\boldsymbol{\mu})\big)$. The mean vector and covariance matrix determine it completely.
:::

The scalar in the exponent,

$$
d^2 = (\mathbf{x} - \boldsymbol{\mu})^{\mathsf{T}}\mathbf{P}^{-1}(\mathbf{x} - \boldsymbol{\mu}),
$$

is the squared **Mahalanobis distance** of $\mathbf{x}$ from the mean. It measures distance in units of standard deviations *along each direction of the distribution*, so a point $2\sigma$ out along a well-known axis and a point $2\sigma$ out along a poorly-known axis have the same $d^2 = 4$ even though their Euclidean distances differ enormously. Every contour of constant density is a contour of constant $d^2$. In code, compute $d^2$ by solving $\mathbf{P}\mathbf{v} = \mathbf{x} - \boldsymbol{\mu}$ for $\mathbf{v}$ and taking $(\mathbf{x} - \boldsymbol{\mu})^{\mathsf{T}}\mathbf{v}$, rather than forming the inverse explicitly; it is cheaper and better conditioned.

::: warning
The density requires $\mathbf{P}^{-1}$, so a singular covariance has no density in the usual sense: all its probability lives on a lower-dimensional subspace. This is one of several reasons filters guard against covariances collapsing to singularity, and why in practice a small positive floor is sometimes added to the diagonal.
:::

## Error ellipses and ellipsoids

Because $\mathbf{P}$ is symmetric positive semi-definite, it has an eigen-decomposition $\mathbf{P} = \mathbf{V}\boldsymbol{\Lambda}\mathbf{V}^{\mathsf{T}}$ with orthonormal eigenvectors in the columns of $\mathbf{V}$ and non-negative eigenvalues $\lambda_i$ on the diagonal of $\boldsymbol{\Lambda}$. Define rotated coordinates $\mathbf{y} = \mathbf{V}^{\mathsf{T}}(\mathbf{x} - \boldsymbol{\mu})$. Then $\mathbf{P}^{-1} = \mathbf{V}\boldsymbol{\Lambda}^{-1}\mathbf{V}^{\mathsf{T}}$ and

$$
d^2 = \mathbf{y}^{\mathsf{T}}\boldsymbol{\Lambda}^{-1}\mathbf{y} = \sum_{i=1}^{n} \frac{y_i^2}{\lambda_i}.
$$

The surface $d^2 = k^2$ is therefore an ellipsoid centred on $\boldsymbol{\mu}$, with axes along the eigenvectors of $\mathbf{P}$ and semi-axis lengths $k\sqrt{\lambda_i}$. Along each principal axis the distribution is an independent scalar Gaussian with standard deviation $\sqrt{\lambda_i}$; the eigenvalues are the variances in the principal directions, and the eigenvectors say which directions those are. This is the **$k$-sigma ellipsoid**, and drawing it over a scatter of samples is the standard way to visualise a covariance.

In two dimensions the picture is an ellipse, and its tilt has a closed form. With $\mathbf{P} = \begin{bmatrix} P_{11} & P_{12} \\ P_{12} & P_{22} \end{bmatrix}$, the angle $\theta$ of the major axis from the first coordinate axis satisfies

$$
\theta = \tfrac{1}{2}\operatorname{atan2}\!\big(2P_{12},\; P_{11} - P_{22}\big),
$$

and the eigenvalues are $\lambda_{1,2} = \tfrac{1}{2}\big(P_{11} + P_{22}\big) \pm \tfrac{1}{2}\sqrt{(P_{11} - P_{22})^2 + 4P_{12}^2}$. A positive covariance tilts the ellipse toward the first quadrant; an ellipse with axes aligned to the coordinate axes means zero correlation.

::: example A tilted position covariance
A horizontal position error has covariance $\mathbf{P} = \begin{bmatrix} 4 & 1 \\ 1 & 2 \end{bmatrix}\,\mathrm{m^2}$, so $\sigma_1 = 2\,\mathrm{m}$, $\sigma_2 = 1.41\,\mathrm{m}$ and $\rho = 1/\sqrt{8} = 0.354$. The eigenvalues are $3 \pm \sqrt{2}$, that is $\lambda_1 = 4.414$ and $\lambda_2 = 1.586\,\mathrm{m^2}$, with square roots $2.10$ and $1.26\,\mathrm{m}$. The tilt is $\theta = \tfrac{1}{2}\operatorname{atan2}(2, 2) = 22.5^\circ$. The $3\sigma$ ellipse has semi-axes $3 \times 2.10 = 6.30\,\mathrm{m}$ and $3 \times 1.26 = 3.78\,\mathrm{m}$, rotated $22.5^\circ$ from the first axis. Notice that the largest principal standard deviation, $2.10\,\mathrm{m}$, exceeds the largest marginal one, $2\,\mathrm{m}$: correlation stretches the ellipse beyond the box formed by the marginal sigmas.

The determinant is $|\mathbf{P}| = 8 - 1 = 7\,\mathrm{m^4}$, so the density's normalising constant is $1/(2\pi\sqrt{7}) = 0.0602\,\mathrm{m^{-2}}$. At the point one metre from the mean along the first axis, $d^2 = P_{22}/|\mathbf{P}| = 2/7 = 0.286$ and the density is $0.0602\,e^{-0.143} = 0.0521\,\mathrm{m^{-2}}$.
:::

## How much probability does a $k$-sigma ellipsoid contain?

Here is the surprise. In the principal coordinates, $d^2 = \sum_i (y_i/\sqrt{\lambda_i})^2$ is a sum of $n$ squared *independent standard normal* variables. The probability that a Gaussian sample lies inside its own $k$-sigma ellipsoid is therefore $P(d^2 \leq k^2)$, the CDF of a sum of $n$ squared standard normals evaluated at $k^2$. That distribution is the **chi-square distribution with $n$ degrees of freedom**, which has its own lesson at the end of this module; the point here is that the containment depends on $n$.

For $n = 2$ the computation is short enough to do now. The pair $(y_1/\sqrt{\lambda_1}, y_2/\sqrt{\lambda_2})$ has the circular density $e^{-r^2/2}/(2\pi)$, and in polar coordinates

$$
P(d \leq k) = \int_0^{2\pi}\!\!\int_0^{k} \frac{e^{-r^2/2}}{2\pi}\,r\,dr\,d\theta = 1 - e^{-k^2/2}.
$$

At $k = 1$ this is $0.3935$, at $k = 2$ it is $0.8647$ and at $k = 3$ it is $0.9889$. The three-dimensional values come from the chi-square CDF with three degrees of freedom:

| $k$ | $n = 1$ | $n = 2$ | $n = 3$ |
| --- | --- | --- | --- |
| 1 | $68.27\%$ | $39.35\%$ | $19.87\%$ |
| 2 | $95.45\%$ | $86.47\%$ | $73.85\%$ |
| 3 | $99.73\%$ | $98.89\%$ | $97.07\%$ |

::: key
The fraction of a 3-D Gaussian inside its $3\sigma$ ellipsoid is about $97.07\%$, not $99.73\%$. The containment probability of a $k$-sigma ellipsoid comes from the chi-square CDF with $n$ degrees of freedom evaluated at $k^2$; in 2-D the $3\sigma$ ellipse holds $98.89\%$ and the $1\sigma$ ellipse only $39.35\%$.
:::

The reason is geometric. In one dimension, "inside $3\sigma$" is a single interval. In three dimensions a sample must be inside along *every* direction at once, and there are more ways to be far from the centre when there are more directions in which to be far. If instead you ask for the probability of lying inside the $\pm 3\sigma$ *box* (each component within its own $3\sigma$), independence in the principal frame gives $0.9973^3 = 99.19\%$; the box is a different, larger region than the ellipsoid inscribed in it, and neither is $99.73\%$.

::: example A three-dimensional navigation covariance
A position covariance in a local frame is

$$
\mathbf{P} = \begin{bmatrix} 4 & 1 & 0 \\ 1 & 2 & -0.5 \\ 0 & -0.5 & 1 \end{bmatrix}\,\mathrm{m^2}.
$$

Its eigenvalues are $4.425$, $1.837$ and $0.738\,\mathrm{m^2}$, so the principal standard deviations are $2.10$, $1.36$ and $0.86\,\mathrm{m}$, and the $3\sigma$ ellipsoid has semi-axes $6.31$, $4.07$ and $2.58\,\mathrm{m}$. Its volume is $\tfrac{4}{3}\pi \times 27 \times \sqrt{|\mathbf{P}|} = \tfrac{4}{3}\pi \times 27 \times \sqrt{6} = 277\,\mathrm{m^3}$. If you drew $10\,000$ samples from this distribution you should expect about $9707$ of them inside that ellipsoid and roughly $293$ outside; if you found $27$ outside you would have made an error, most likely by expecting the one-dimensional figure.
:::

## Correlation, conditioning and the seed of the Kalman update

What does an off-diagonal element of $\mathbf{P}$ buy you? Information. If two components are correlated, learning one tells you about the other. For a two-dimensional Gaussian with correlation $\rho$, the conditional distribution of $x_2$ given that $x_1 = a$ is again Gaussian, with

$$
\mathbb{E}[x_2 \mid x_1 = a] = \mu_2 + \rho\,\frac{\sigma_2}{\sigma_1}\,(a - \mu_1) = \mu_2 + \frac{P_{12}}{P_{11}}(a - \mu_1),
\qquad
\operatorname{Var}(x_2 \mid x_1 = a) = \sigma_2^2\,(1 - \rho^2).
$$

This follows from writing the joint density as a marginal times a conditional and completing the square in $x_2$; the algebra is routine and the result is what matters. The conditional mean shifts linearly with the observed value, by the gain $P_{12}/P_{11}$, and the conditional variance shrinks by the factor $1 - \rho^2$ regardless of what was observed. For the covariance of the earlier example, $\rho^2 = 0.125$, so observing $x_1$ exactly cuts the variance of $x_2$ from $2$ to $1.75\,\mathrm{m^2}$, and every metre by which $x_1$ exceeds its mean raises the estimate of $x_2$ by $0.25\,\mathrm{m}$.

Read that again with filter names attached. Treat $x_1$ as a measurement and $x_2$ as a state. The update "new estimate equals old estimate plus gain times (measurement minus predicted measurement)" and "new variance equals old variance times a factor less than one" is the Kalman update in its simplest form, and the gain $P_{12}/P_{11}$ is the Kalman gain. The covariance between state and measurement is what makes the measurement useful, and the lesson on linear transformations shows how that covariance is created.

::: warning
Three distinct things are called "sigma" in this subject, and mixing them up causes real errors. The marginal standard deviations $\sqrt{P_{ii}}$ describe each component alone. The principal standard deviations $\sqrt{\lambda_i}$ describe the ellipsoid's axes. And the containment of a $k$-sigma region depends on dimension. A requirement written as "3σ position error below 10 m" is ambiguous until it says which of these it means.
:::

## Check yourself

::: check
A range error is $\mathcal{N}(0, (2\,\mathrm{m})^2)$. What is the probability that its magnitude is below $3\,\mathrm{m}$? What multiplier of $\sigma$ would give a $95\%$ two-sided bound?
:::

::: answer
$P(|X| < 3) = 2\Phi(3/2) - 1 = 2\Phi(1.5) - 1 = 0.866$. A $95\%$ two-sided bound uses $k = 1.960$, so the bound is $1.96 \times 2 = 3.92\,\mathrm{m}$. Note that $1.5\sigma$ gives $86.6\%$, which lies between the $68.27\%$ of $1\sigma$ and the $95.45\%$ of $2\sigma$, as it must.
:::

::: check
A colleague proposes $\mathbf{P} = \begin{bmatrix} 4 & 3 \\ 3 & 2 \end{bmatrix}$ as the covariance of a two-state error. Is it a valid covariance matrix? Give two independent reasons for your answer.
:::

::: answer
It is not valid. First, its determinant is $8 - 9 = -1 < 0$, so one eigenvalue is negative and the matrix is not positive semi-definite; some linear combination of the two states would have negative variance. Second, the implied correlation coefficient is $\rho = 3/\sqrt{4 \times 2} = 1.06$, outside $[-1, 1]$, which is impossible by the Cauchy–Schwarz inequality. Either check alone is enough to reject it.
:::

::: check
For $\mathbf{P} = \begin{bmatrix} 9 & -6 \\ -6 & 9 \end{bmatrix}\,\mathrm{m^2}$, find the correlation coefficient, the eigenvalues, the orientation of the major axis and the semi-axes of the $2\sigma$ ellipse.
:::

::: answer
$\rho = -6/9 = -0.667$. The eigenvalues are $9 \pm 6$, that is $15$ and $3\,\mathrm{m^2}$, with square roots $3.87$ and $1.73\,\mathrm{m}$. The orientation is $\theta = \tfrac{1}{2}\operatorname{atan2}(-12, 0) = -45^\circ$: the major axis runs along the line $x_2 = -x_1$, as a negative correlation requires. The $2\sigma$ ellipse has semi-axes $2 \times 3.87 = 7.75\,\mathrm{m}$ and $2 \times 1.73 = 3.46\,\mathrm{m}$. Both marginal sigmas are $3\,\mathrm{m}$, yet the ellipse reaches $3.87\,\mathrm{m}$ along its long axis.
:::

::: check
A two-dimensional Gaussian scatter plot shows the $1\sigma$ ellipse. Roughly what fraction of the points should lie inside it, and why is the answer not $68\%$?
:::

::: answer
About $39\%$, since $1 - e^{-1/2} = 0.3935$. The $68.27\%$ figure is the probability that *one* standardised component lies within one standard deviation. Being inside the ellipse requires the squared Mahalanobis distance, a sum of two squared standard normals, to be at most one, which is a stricter condition: both components must be small at once, in the principal frame. More dimensions means more ways to fall outside, so containment at fixed $k$ drops with $n$.
:::

::: check
Explain why the covariance matrix of any random vector must be positive semi-definite, and give an example of a valid covariance that is singular.
:::

::: answer
For any fixed vector $\mathbf{a}$, the scalar $\mathbf{a}^{\mathsf{T}}\mathbf{x}$ is a random variable whose variance is $\mathbf{a}^{\mathsf{T}}\mathbf{P}\mathbf{a}$; a variance is an expectation of a square and cannot be negative, so the quadratic form is non-negative for every $\mathbf{a}$, which is the definition of positive semi-definite. A singular example: if $x_2 = 2x_1$ exactly with $\operatorname{Var}(x_1) = 1$, then $\mathbf{P} = \begin{bmatrix} 1 & 2 \\ 2 & 4 \end{bmatrix}$, which has determinant zero. The direction $\mathbf{a} = (2, -1)^{\mathsf{T}}$ gives $\mathbf{a}^{\mathsf{T}}\mathbf{P}\mathbf{a} = 0$ because $2x_1 - x_2$ is identically zero. Positive semi-definite does not imply invertible.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $f_X(x) = \frac{1}{\sigma\sqrt{2\pi}}\exp\!\big(-\frac{(x-\mu)^2}{2\sigma^2}\big)$ | Scalar Gaussian $\mathcal{N}(\mu, \sigma^2)$ |
| $\Phi(z) = \tfrac{1}{2}[1 + \operatorname{erf}(z/\sqrt{2})]$ | Standard normal CDF; $P(X \leq x) = \Phi((x-\mu)/\sigma)$ |
| $68.27\%$, $95.45\%$, $99.73\%$ | Scalar containment of $\pm 1\sigma$, $\pm 2\sigma$, $\pm 3\sigma$ |
| $\mathbb{E}[Z^4] = 3$ | Gaussian kurtosis is 3; all odd moments vanish |
| $\mathbf{P} = \mathbb{E}[(\mathbf{x}-\boldsymbol{\mu})(\mathbf{x}-\boldsymbol{\mu})^{\mathsf{T}}]$ | Covariance matrix: symmetric, PSD, variances on the diagonal |
| $\mathbf{a}^{\mathsf{T}}\mathbf{P}\mathbf{a} = \operatorname{Var}(\mathbf{a}^{\mathsf{T}}\mathbf{x}) \geq 0$ | Why $\mathbf{P}$ is positive semi-definite |
| $\rho_{ij} = P_{ij}/\sqrt{P_{ii}P_{jj}}$ | Correlation coefficient, in $[-1, 1]$ |
| $p(\mathbf{x}) = ((2\pi)^{n/2}\lvert\mathbf{P}\rvert^{1/2})^{-1}\exp(-\tfrac{1}{2}d^2)$ | Multivariate Gaussian density |
| $d^2 = (\mathbf{x}-\boldsymbol{\mu})^{\mathsf{T}}\mathbf{P}^{-1}(\mathbf{x}-\boldsymbol{\mu})$ | Squared Mahalanobis distance |
| $\mathbf{P} = \mathbf{V}\boldsymbol{\Lambda}\mathbf{V}^{\mathsf{T}}$, semi-axes $k\sqrt{\lambda_i}$ | $k$-sigma ellipsoid: axes along eigenvectors |
| $\theta = \tfrac{1}{2}\operatorname{atan2}(2P_{12}, P_{11} - P_{22})$ | Tilt of a 2-D error ellipse |
| $97.07\%$ (3-D), $98.89\%$ (2-D) | Containment of the $3\sigma$ ellipsoid, from the chi-square CDF |
| $\mathbb{E}[x_2 \mid x_1] = \mu_2 + \frac{P_{12}}{P_{11}}(x_1 - \mu_1)$, $\operatorname{Var} = \sigma_2^2(1-\rho^2)$ | Conditioning a Gaussian: the seed of the Kalman update |

The next lesson shows how $\boldsymbol{\mu}$ and $\mathbf{P}$ transform under a linear map, which is how a covariance is propagated through dynamics, how correlated samples are generated from independent ones, and how two uncertain estimates are fused into one.
