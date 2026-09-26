---
id: l04-gaussian-and-covariance
title: The Gaussian, covariance matrices and error ellipsoids
minutes: 23
covers:
  - the Gaussian and multivariate Gaussian, covariance matrices, correlation
---

Throw a hundred darts at a target, aiming at the bullseye every time. Most land close. A few land farther out. Almost none land at the very edge. If you piled the darts up by how far left or right of centre they landed, the pile would have a hump in the middle and thin tails on each side. That hump is the **bell curve**, and it is the most important shape in navigation.

Open the memory of any navigation filter and you find two things. One is a vector $\hat{\mathbf{x}}$ (read "x hat"), the best guess of position, velocity and attitude. The other is a matrix $\mathbf{P}$, the **covariance** of the error in that guess — a table that says how big the errors are and how they go together. Those two objects describe a bell curve in many dimensions at once. The filter needs nothing else, because for this one shape the mean and the covariance *are* the whole distribution.

This lesson builds the bell from one number up to many. On the way it defines the covariance matrix — the object you will handle more than any other in this course — explains why it must be what mathematicians call symmetric positive semi-definite, and turns it into a picture: the error ellipse, whose size and tilt show at a glance where the uncertainty lives. It ends with a fact that surprises almost everyone the first time: a "3σ" ellipsoid in three dimensions does not hold $99.73\%$ of the probability.

## The bell curve

A random variable $X$ is **Gaussian** (also called **normal**) with mean $\mu$ ("mu") and variance $\sigma^2$ ("sigma squared") when its density is

$$
f_X(x) = \frac{1}{\sigma\sqrt{2\pi}}\,\exp\!\left(-\frac{(x - \mu)^2}{2\sigma^2}\right).
$$

We write this $X \sim \mathcal{N}(\mu, \sigma^2)$, read "X is normal with mean mu and variance sigma squared". The shape carries the name of **[[Gauss|gauss-name]]**.

Read the formula from the inside out. The piece $(x - \mu)^2$ is the squared distance from the centre. Dividing by $2\sigma^2$ measures that distance in units of the spread. The minus sign and the $\exp$ (the exponential, $e$ raised to that power) turn "far away" into "very unlikely": the density is largest at $x = \mu$ and falls off fast on both sides. The result is the bell, symmetric about $\mu$. Its sides are steepest — they change from curving down to curving up — at $\mu \pm \sigma$.

The fraction in front, $1/(\sigma\sqrt{2\pi})$, is there only to make the total area under the curve equal to one, as every density's must be.

::: note Why the area comes out to one
Call $I = \int_{-\infty}^{\infty} e^{-z^2/2}\,dz$. The trick is to square it. $I^2$ is a double integral over the whole plane of $e^{-(z_1^2 + z_2^2)/2}$. Switch to polar coordinates, where $z_1^2 + z_2^2 = r^2$ and the area element is $r\,dr\,d\theta$:

$$
I^2 = \int_0^{2\pi}\!\!\int_0^\infty e^{-r^2/2}\,r\,dr\,d\theta = 2\pi \times 1 = 2\pi.
$$

The inner integral is $1$ because the derivative of $-e^{-r^2/2}$ is $r e^{-r^2/2}$. So $I = \sqrt{2\pi}$. Substituting $z = (x - \mu)/\sigma$ stretches the axis by $\sigma$, which supplies the other factor.
:::

The two numbers in the formula are exactly the mean and the variance. $\mathbb{E}[X] = \mu$ because the bell is symmetric about $\mu$. $\operatorname{Var}(X) = \sigma^2$ comes out of an integration by parts, shown below.

The peak height is $1/(\sigma\sqrt{2\pi}) = 0.399/\sigma$. For a position error with $\sigma = 3\,\mathrm{m}$, that is $0.133\,\mathrm{m^{-1}}$ — "per metre". A density carries units, because it is probability per unit of $x$.

## Counting in sigmas

Every Gaussian is the same bell, slid sideways and stretched. So we can study one bell and read off all the others.

Subtract the mean and divide by the spread: $Z = (X - \mu)/\sigma$. This $Z$ is the **standard normal**, $Z \sim \mathcal{N}(0, 1)$ — mean zero, variance one. Its density is written $\phi(z) = e^{-z^2/2}/\sqrt{2\pi}$ ("phi of z"), and the chance of landing at or below $z$ is its CDF, written with a capital phi:

$$
\Phi(z) = \int_{-\infty}^{z} \phi(u)\,du = \frac{1}{2}\left[1 + \operatorname{erf}\!\left(\frac{z}{\sqrt{2}}\right)\right].
$$

Here $\operatorname{erf}$ is the **[[error function|error-function]]**. It has no formula made of ordinary pieces, but every numerical library computes it (`math.erf` in Python). Every probability question about any Gaussian comes down to $\Phi$:

$$
P(X \leq x) = \Phi\!\left(\frac{x - \mu}{\sigma}\right), \qquad \Phi(-z) = 1 - \Phi(z).
$$

The second rule is the bell's symmetry: the chance of being below $-z$ equals the chance of being above $+z$.

The chance of landing within $k$ standard deviations of the mean is $P(|Z| \leq k) = 2\Phi(k) - 1$. These are the numbers everyone in the field carries in their head:

| $k$ | $P(\lvert X - \mu\rvert \leq k\sigma)$ | Outside |
| --- | --- | --- |
| 1 | $68.27\%$ | $31.73\%$ |
| 2 | $95.45\%$ | $4.55\%$ |
| 3 | $99.73\%$ | $0.27\%$ |
| 1.645 | $90\%$ | $10\%$ |
| 1.960 | $95\%$ | $5\%$ |
| 2.576 | $99\%$ | $1\%$ |

**[[Memorise the first three rows|sigma-bands]]**. The last three are the multipliers behind $90\%$, $95\%$ and $99\%$ bands, which come back when we build confidence intervals.

::: key
For a scalar Gaussian, the containment probabilities of $\pm 1\sigma$, $\pm 2\sigma$ and $\pm 3\sigma$ are $68.27\%$, $95.45\%$ and $99.73\%$. So a $3\sigma$ bound is broken about $0.27\%$ of the time — roughly once in 370 tries.
:::

### Nothing about the shape is left free

The previous lesson measured shape with higher moments: skewness (lopsidedness) and kurtosis (how heavy the tails are). For the bell, both are fixed.

The result: all odd moments of $Z$ are zero, $\mathbb{E}[Z^2] = 1$, and $\mathbb{E}[Z^4] = 3$. So a Gaussian has zero skewness and kurtosis exactly $3$ — the reference value from the previous lesson. Once you know $\mu$ and $\sigma$, there is nothing else to know.

::: note Why it has to be true
The one trick is that $\phi'(z) = -z\,\phi(z)$ (differentiate the exponent). Write $\mathbb{E}[Z^{k+1}] = \int z^k \cdot z\,\phi(z)\,dz$ and integrate by parts, with $z\,\phi(z)\,dz = -d\phi$:

$$
\mathbb{E}[Z^{k+1}] = \Big[-z^k \phi(z)\Big]_{-\infty}^{\infty} + k\int z^{k-1}\phi(z)\,dz = k\,\mathbb{E}[Z^{k-1}].
$$

The bracket is zero, because $\phi$ dies off faster than any power grows. Start from $\mathbb{E}[Z^0] = 1$ and $\mathbb{E}[Z^1] = 0$ and step up two at a time: $\mathbb{E}[Z^2] = 1 \times 1 = 1$, which confirms $\sigma^2$ is the variance; $\mathbb{E}[Z^3] = 2 \times 0 = 0$; $\mathbb{E}[Z^4] = 3 \times 1 = 3$.
:::

::: example A GNSS position error budget
A receiver's cross-track error is modelled as $\mathcal{N}(0, (3\,\mathrm{m})^2)$. How often is the error bigger than $5\,\mathrm{m}$ either way?

First, turn $5\,\mathrm{m}$ into sigmas: $5/3 = 1.667$. Then use symmetry — the two tails are equal, so double one of them:

$$
P(|X| > 5) = 2\big[1 - \Phi(1.667)\big] = 0.0956.
$$

About one fix in ten. That is between the $31.7\%$ outside $1\sigma$ and the $4.6\%$ outside $2\sigma$, as it should be.

How often is it more than $+7\,\mathrm{m}$, on one side only? $7/3 = 2.333$ sigmas, and $1 - \Phi(2.333) = 0.0098$: about one in a hundred.

And $|X| > 9\,\mathrm{m}$, the $3\sigma$ level, has probability $0.0027$. Suppose the requirement says the error may exceed $9\,\mathrm{m}$ no more than once per thousand fixes. This sensor breaks it by nearly a factor of three ($0.0027$ against $0.001$), even though $9\,\mathrm{m}$ is "three sigma". Compute the tail probability; do not argue in sigmas.
:::

## Many numbers at once: the covariance matrix

Taller people tend to have bigger feet. The previous lesson put a number on that tendency, the covariance. A navigation error has many parts — three of position, three of velocity, three of attitude — and every pair of them can go together like height and foot size. We need a way to keep all those pairs in one place.

Stack $n$ random numbers into a column, a **random vector** $\mathbf{x} = (x_1, \ldots, x_n)^{\mathsf{T}}$. (The little $\mathsf{T}$, "transpose", turns the row into a column.) Its **mean vector** $\boldsymbol{\mu} = \mathbb{E}[\mathbf{x}]$ is the list of the individual means. Its **covariance matrix** is

$$
\mathbf{P} = \mathbb{E}\big[(\mathbf{x} - \boldsymbol{\mu})(\mathbf{x} - \boldsymbol{\mu})^{\mathsf{T}}\big].
$$

A column times a row is a square table. So $\mathbf{P}$ is an $n \times n$ table whose entry in row $i$, column $j$ is $\mathbb{E}[(x_i - \mu_i)(x_j - \mu_j)] = \operatorname{Cov}(x_i, x_j)$.

- The **diagonal** entries $P_{ii}$ are the variances $\sigma_i^2$ of the separate parts.
- The **off-diagonal** entries are the covariances between pairs.
- Because $\operatorname{Cov}(x_i, x_j) = \operatorname{Cov}(x_j, x_i)$, the table is a mirror image across its diagonal: it is **symmetric**.

It has one more property, and it is worth understanding rather than memorising. Mix the parts of $\mathbf{x}$ in any fixed recipe $\mathbf{a}$ — say "twice the north error minus the east error" — to get one number $y = \mathbf{a}^{\mathsf{T}}\mathbf{x}$. Its variance is

$$
\operatorname{Var}(y) = \mathbb{E}\big[(\mathbf{a}^{\mathsf{T}}(\mathbf{x} - \boldsymbol{\mu}))^2\big]
= \mathbb{E}\big[\mathbf{a}^{\mathsf{T}}(\mathbf{x} - \boldsymbol{\mu})(\mathbf{x} - \boldsymbol{\mu})^{\mathsf{T}}\mathbf{a}\big]
= \mathbf{a}^{\mathsf{T}}\mathbf{P}\mathbf{a}.
$$

The middle step writes the square of a number as the number times itself, $(\mathbf{a}^{\mathsf{T}}\mathbf{d})(\mathbf{d}^{\mathsf{T}}\mathbf{a})$. The last step moves the constant $\mathbf{a}$ outside the average.

A variance can never be negative. So $\mathbf{a}^{\mathsf{T}}\mathbf{P}\mathbf{a} \geq 0$ for every recipe $\mathbf{a}$. That is the definition of **[[positive semi-definite|psd-meaning]]**. It follows that every eigenvalue of $\mathbf{P}$ is zero or positive, and so is its determinant.

$\mathbf{P}$ is **singular** — it has no inverse — exactly when some recipe $\mathbf{a}^{\mathsf{T}}\mathbf{x}$ has zero variance: one direction of the state is known perfectly. That is unusual but perfectly legal. A filter started with one part known exactly has a singular, still valid, covariance. Positive semi-definite does not mean invertible.

::: key
The covariance matrix of a random vector is $\mathbf{P} = \mathbb{E}[(\mathbf{x} - \boldsymbol{\mu})(\mathbf{x} - \boldsymbol{\mu})^{\mathsf{T}}]$. It is symmetric and positive semi-definite, with the variances on the diagonal and the covariances off it. The quadratic form $\mathbf{a}^{\mathsf{T}}\mathbf{P}\mathbf{a}$ is the variance of $\mathbf{a}^{\mathsf{T}}\mathbf{x}$, which is why it can never be negative.
:::

Divide each covariance by its two standard deviations and you get the **correlation matrix**, with entries $\rho_{ij} = P_{ij}/\sqrt{P_{ii}P_{jj}}$ ("rho i j"). It has ones on the diagonal and numbers between $-1$ and $1$ everywhere else. A quick test of any proposed covariance is that every $|\rho_{ij}| \leq 1$. That catches many typos. It is not a full test in three or more dimensions: a matrix can pass it and still fail to be positive semi-definite.

## The bell in many dimensions

The vector $\mathbf{x}$ is **jointly Gaussian** with mean $\boldsymbol{\mu}$ and covariance $\mathbf{P}$, written $\mathbf{x} \sim \mathcal{N}(\boldsymbol{\mu}, \mathbf{P})$, when its density is

$$
p(\mathbf{x}) = \frac{1}{(2\pi)^{n/2}\,|\mathbf{P}|^{1/2}}\,
\exp\!\left(-\tfrac{1}{2}(\mathbf{x} - \boldsymbol{\mu})^{\mathsf{T}}\mathbf{P}^{-1}(\mathbf{x} - \boldsymbol{\mu})\right).
$$

Here $|\mathbf{P}|$ is the determinant of $\mathbf{P}$ and $\mathbf{P}^{-1}$ its inverse. Compare it piece by piece with the one-number bell:

- $(x - \mu)^2/\sigma^2$ has become $(\mathbf{x} - \boldsymbol{\mu})^{\mathsf{T}}\mathbf{P}^{-1}(\mathbf{x} - \boldsymbol{\mu})$ — "squared distance divided by variance", in matrix form.
- $\sigma\sqrt{2\pi}$ has become $(2\pi)^{n/2}|\mathbf{P}|^{1/2}$ — one $\sqrt{2\pi}$ per dimension, and the square root of the determinant in place of $\sigma$.

For $n = 1$, $\mathbf{P} = \sigma^2$ and you get the scalar formula back.

Now take a diagonal covariance, $\mathbf{P} = \operatorname{diag}(\sigma_1^2, \ldots, \sigma_n^2)$ — no correlations. The quadratic form becomes $\sum_i (x_i - \mu_i)^2/\sigma_i^2$ and the determinant is $\prod_i \sigma_i^2$, the product of the variances. The density then splits into a product of one-number bells. So for jointly Gaussian variables, **uncorrelated means independent**. That is special to the Gaussian. The previous lesson showed that in general, zero covariance does not mean independent.

::: key
The multivariate Gaussian density is $p(\mathbf{x}) = \big((2\pi)^{n/2}|\mathbf{P}|^{1/2}\big)^{-1}\exp\!\big(-\tfrac{1}{2}(\mathbf{x}-\boldsymbol{\mu})^{\mathsf{T}}\mathbf{P}^{-1}(\mathbf{x}-\boldsymbol{\mu})\big)$. The mean vector and covariance matrix fix it completely.
:::

### Distance measured in sigmas

The number in the exponent,

$$
d^2 = (\mathbf{x} - \boldsymbol{\mu})^{\mathsf{T}}\mathbf{P}^{-1}(\mathbf{x} - \boldsymbol{\mu}),
$$

is the squared **[[Mahalanobis distance|mahalanobis]]** of $\mathbf{x}$ from the mean. It is distance counted in standard deviations *along each direction of the spread*.

Think of the dart board again, but now your throws scatter far more left–right than up–down. A dart $10\,\mathrm{cm}$ to the side is ordinary. A dart $10\,\mathrm{cm}$ high is strange. A ruler says they are equally far from the bullseye. The Mahalanobis distance says the high one is much farther, because it counts in each direction's own sigma. Every contour of equal density is a contour of equal $d^2$.

In code, do not form $\mathbf{P}^{-1}$. Solve $\mathbf{P}\mathbf{v} = \mathbf{x} - \boldsymbol{\mu}$ for $\mathbf{v}$, then take $(\mathbf{x} - \boldsymbol{\mu})^{\mathsf{T}}\mathbf{v}$. It is cheaper and more accurate.

::: warning A singular covariance has no density
The formula needs $\mathbf{P}^{-1}$. When $\mathbf{P}$ is singular, all the probability sits on a flat slice of lower dimension, and there is no density in the usual sense. This is one of several reasons filters guard against their covariance collapsing, and why engineers sometimes add a small positive floor to the diagonal.
:::

## Error ellipses and ellipsoids

Scatter a thousand samples of a two-dimensional Gaussian on paper and the cloud is shaped like an egg, usually tilted. Draw the curve of equal $d^2$ and you get a clean **ellipse** around the cloud. In three dimensions it is an **ellipsoid**, a stretched and tilted sphere. Its axes come from the eigenvectors of $\mathbf{P}$ — the special directions a matrix only stretches, from the linear algebra module.

Because $\mathbf{P}$ is symmetric positive semi-definite, it splits as $\mathbf{P} = \mathbf{V}\boldsymbol{\Lambda}\mathbf{V}^{\mathsf{T}}$. The columns of $\mathbf{V}$ are unit eigenvectors at right angles to each other. The diagonal of $\boldsymbol{\Lambda}$ ("capital lambda") holds the eigenvalues $\lambda_i$, all zero or positive. Turn the axes to line up with the eigenvectors: $\mathbf{y} = \mathbf{V}^{\mathsf{T}}(\mathbf{x} - \boldsymbol{\mu})$. Since $\mathbf{P}^{-1} = \mathbf{V}\boldsymbol{\Lambda}^{-1}\mathbf{V}^{\mathsf{T}}$,

$$
d^2 = \mathbf{y}^{\mathsf{T}}\boldsymbol{\Lambda}^{-1}\mathbf{y} = \sum_{i=1}^{n} \frac{y_i^2}{\lambda_i}.
$$

Set that equal to $k^2$ and you have the equation of an ellipsoid centred on $\boldsymbol{\mu}$. Its axes point along the eigenvectors of $\mathbf{P}$. Its semi-axis lengths (centre to edge) are $k\sqrt{\lambda_i}$. Along each axis the spread is an independent one-number bell with standard deviation $\sqrt{\lambda_i}$. So the eigenvalues are the variances in the principal directions, and the eigenvectors say which directions those are. This is the **$k$-sigma ellipsoid**. Drawing it over a scatter of samples is the standard way to picture a covariance.

In two dimensions the tilt has a formula. With $\mathbf{P} = \begin{bmatrix} P_{11} & P_{12} \\ P_{12} & P_{22} \end{bmatrix}$, the angle $\theta$ of the long axis from the first coordinate axis is

$$
\theta = \tfrac{1}{2}\operatorname{atan2}\!\big(2P_{12},\; P_{11} - P_{22}\big),
$$

and the eigenvalues are

$$
\lambda_{1,2} = \tfrac{1}{2}\big(P_{11} + P_{22}\big) \pm \tfrac{1}{2}\sqrt{(P_{11} - P_{22})^2 + 4P_{12}^2}.
$$

A positive covariance tilts the ellipse up to the right. An ellipse lined up with the coordinate axes means zero correlation.

::: example A tilted position covariance
A horizontal position error has covariance $\mathbf{P} = \begin{bmatrix} 4 & 1 \\ 1 & 2 \end{bmatrix}\,\mathrm{m^2}$.

**Read the table.** $\sigma_1 = \sqrt{4} = 2\,\mathrm{m}$, $\sigma_2 = \sqrt{2} = 1.41\,\mathrm{m}$, and $\rho = 1/\sqrt{4 \times 2} = 1/\sqrt{8} = 0.354$.

**Eigenvalues.** $\tfrac{1}{2}(4 + 2) = 3$, and $\tfrac{1}{2}\sqrt{(4-2)^2 + 4} = \tfrac{1}{2}\sqrt{8} = \sqrt{2}$. So $\lambda = 3 \pm \sqrt{2}$: $\lambda_1 = 4.414$ and $\lambda_2 = 1.586\,\mathrm{m^2}$, with square roots $2.10$ and $1.26\,\mathrm{m}$.

**Tilt.** $\theta = \tfrac{1}{2}\operatorname{atan2}(2, 2) = \tfrac{1}{2} \times 45^\circ = 22.5^\circ$.

**The $3\sigma$ ellipse** has semi-axes $3 \times 2.10 = 6.30\,\mathrm{m}$ and $3 \times 1.26 = 3.78\,\mathrm{m}$, turned $22.5^\circ$ from the first axis. Notice that the biggest principal sigma, $2.10\,\mathrm{m}$, is larger than the biggest single-axis sigma, $2\,\mathrm{m}$. Correlation stretches the ellipse along the diagonal, **[[beyond the box|ellipse-in-box]]** the single-axis sigmas suggest.

**The density.** $|\mathbf{P}| = 4 \times 2 - 1 \times 1 = 7\,\mathrm{m^4}$, so the constant in front is $1/(2\pi\sqrt{7}) = 0.0602\,\mathrm{m^{-2}}$. At the point one metre from the mean along the first axis, $d^2 = P_{22}/|\mathbf{P}| = 2/7 = 0.286$, and the density is $0.0602\,e^{-0.143} = 0.0521\,\mathrm{m^{-2}}$ — a little below the peak, as a nearby point should be.
:::

## How much does a $k$-sigma ellipsoid hold?

Here is the surprise. In the principal axes, $d^2 = \sum_i (y_i/\sqrt{\lambda_i})^2$. Each $y_i/\sqrt{\lambda_i}$ is an *independent standard normal*. So the chance that a sample lies inside its own $k$-sigma ellipsoid is the chance that a sum of $n$ squared standard normals is at most $k^2$.

That sum has its own distribution, the **chi-square distribution with $n$ degrees of freedom** (chi is the Greek letter χ, said "kye"). It gets its own lesson at the end of this module. The point for now: the answer depends on $n$.

In two dimensions you can work it out by hand, and the result is

$$
P(d \leq k) = 1 - e^{-k^2/2}.
$$

At $k = 1$ that is $0.3935$. At $k = 2$ it is $0.8647$. At $k = 3$ it is $0.9889$. The three-dimensional numbers come from the chi-square CDF with three degrees of freedom:

| $k$ | $n = 1$ | $n = 2$ | $n = 3$ |
| --- | --- | --- | --- |
| 1 | $68.27\%$ | $39.35\%$ | $19.87\%$ |
| 2 | $95.45\%$ | $86.47\%$ | $73.85\%$ |
| 3 | $99.73\%$ | $98.89\%$ | $97.07\%$ |

::: note Why it has to be true
In two dimensions, the pair $(y_1/\sqrt{\lambda_1},\ y_2/\sqrt{\lambda_2})$ has the round density $e^{-r^2/2}/(2\pi)$, where $r$ is distance from the centre. Add up the probability inside the circle of radius $k$ using polar coordinates:

$$
P(d \leq k) = \int_0^{2\pi}\!\!\int_0^{k} \frac{e^{-r^2/2}}{2\pi}\,r\,dr\,d\theta = \Big[-e^{-r^2/2}\Big]_0^k = 1 - e^{-k^2/2}.
$$

The $\theta$ integral gives $2\pi$, which cancels the $2\pi$ below.
:::

::: key
The fraction of a 3-D Gaussian inside its $3\sigma$ ellipsoid is about $97.07\%$, not $99.73\%$. The containment probability of a $k$-sigma ellipsoid comes from the chi-square CDF with $n$ degrees of freedom evaluated at $k^2$. In 2-D the $3\sigma$ ellipse holds $98.89\%$, and the $1\sigma$ ellipse only $39.35\%$.
:::

Why do more dimensions mean less inside? In one dimension, "inside $3\sigma$" means one number is small. In three dimensions a sample must be close in *every* direction at once. There are more ways to be **[[far from the centre|dimension-bars]]** when there are more directions to be far in.

A box is different again. The chance of each part being within its own $\pm 3\sigma$ — in the principal frame, where they are independent — is $0.9973^3 = 99.19\%$. The box is a bigger region than the ellipsoid tucked inside it, and neither holds $99.73\%$.

::: example A three-dimensional navigation covariance
A position covariance in a local frame is

$$
\mathbf{P} = \begin{bmatrix} 4 & 1 & 0 \\ 1 & 2 & -0.5 \\ 0 & -0.5 & 1 \end{bmatrix}\,\mathrm{m^2}.
$$

Its eigenvalues are $4.425$, $1.837$ and $0.738\,\mathrm{m^2}$. Their square roots, the principal sigmas, are $2.10$, $1.36$ and $0.86\,\mathrm{m}$. So the $3\sigma$ ellipsoid has semi-axes $6.31$, $4.07$ and $2.58\,\mathrm{m}$.

An ellipsoid with semi-axes $a$, $b$, $c$ has volume $\tfrac{4}{3}\pi abc$. Here $abc = 27\sqrt{\lambda_1\lambda_2\lambda_3} = 27\sqrt{|\mathbf{P}|}$, and $|\mathbf{P}| = 6$, so the volume is $\tfrac{4}{3}\pi \times 27 \times \sqrt{6} = 277\,\mathrm{m^3}$.

Draw $10\,000$ samples and you should find about $9707$ inside that ellipsoid and about $293$ outside. If you found only $27$ outside, you would have made a mistake — most likely by expecting the one-dimensional $99.73\%$.
:::

## Correlation is information

What does an off-diagonal entry of $\mathbf{P}$ buy you? Information. If two errors go together, learning one tells you about the other — the way knowing someone's height lets you guess their shoe size better.

For a two-dimensional Gaussian with correlation $\rho$, suppose you learn that $x_1 = a$. The distribution of $x_2$ given that fact — its **conditional** distribution — is again Gaussian, with

$$
\mathbb{E}[x_2 \mid x_1 = a] = \mu_2 + \rho\,\frac{\sigma_2}{\sigma_1}\,(a - \mu_1) = \mu_2 + \frac{P_{12}}{P_{11}}(a - \mu_1),
\qquad
\operatorname{Var}(x_2 \mid x_1 = a) = \sigma_2^2\,(1 - \rho^2).
$$

The bar $\mid$ reads "given". You get this by writing the joint density as (density of $x_1$) times (density of $x_2$ given $x_1$) and completing the square in $x_2$. The algebra is routine; the result is what matters.

Two things happen. The best guess for $x_2$ moves in a straight line with the observed value, by the **gain** $P_{12}/P_{11}$ per unit of surprise. And the variance shrinks by the factor $1 - \rho^2$, whatever value was observed.

For the covariance of the tilted-ellipse example, $\rho^2 = 1/8 = 0.125$. Learning $x_1$ exactly cuts the variance of $x_2$ from $2$ to $2 \times 0.875 = 1.75\,\mathrm{m^2}$. And every metre by which $x_1$ beats its mean raises the guess for $x_2$ by $P_{12}/P_{11} = 1/4 = 0.25\,\mathrm{m}$.

Now read that again with filter names. Call $x_1$ a measurement and $x_2$ a state. "New estimate = old estimate + gain × (measurement − predicted measurement)" and "new variance = old variance × a factor below one" is the **[[Kalman update|kalman-seed]]** in its simplest form, and $P_{12}/P_{11}$ is the Kalman gain. The covariance between state and measurement is what makes the measurement useful. The next lesson shows where that covariance comes from.

::: warning Three different "sigmas"
Three different things get called "sigma" here, and mixing them up causes real errors. The single-axis sigmas $\sqrt{P_{ii}}$ describe each part alone. The principal sigmas $\sqrt{\lambda_i}$ describe the ellipsoid's axes. And how much a $k$-sigma region holds depends on the dimension. A requirement written as "3σ position error below 10 m" is ambiguous until it says which one it means.
:::

## Check yourself

::: check
A range error is $\mathcal{N}(0, (2\,\mathrm{m})^2)$. What is the probability that its size is below $3\,\mathrm{m}$? What multiple of $\sigma$ gives a $95\%$ two-sided bound, and how many metres is that?
:::

::: answer
In sigmas, $3\,\mathrm{m}$ is $3/2 = 1.5\sigma$. So $P(|X| < 3) = 2\Phi(1.5) - 1 = 0.866$. That sits between the $68.27\%$ of $1\sigma$ and the $95.45\%$ of $2\sigma$, as it must.

A $95\%$ two-sided bound uses $k = 1.960$, so the bound is $1.96 \times 2 = 3.92\,\mathrm{m}$.
:::

::: check
A colleague proposes $\mathbf{P} = \begin{bmatrix} 4 & 3 \\ 3 & 2 \end{bmatrix}$ as the covariance of a two-part error. Is it a valid covariance matrix? Give two separate reasons.
:::

::: answer
It is not valid.

First, its determinant is $4 \times 2 - 3 \times 3 = 8 - 9 = -1$. A negative determinant of a $2 \times 2$ matrix means one eigenvalue is negative, so the matrix is not positive semi-definite: some mix of the two errors would have negative variance.

Second, the correlation it implies is $\rho = 3/\sqrt{4 \times 2} = 1.06$, outside $[-1, 1]$. That is impossible by the Cauchy–Schwarz inequality from the previous lesson. Either check alone is enough to reject it.
:::

::: check
For $\mathbf{P} = \begin{bmatrix} 9 & -6 \\ -6 & 9 \end{bmatrix}\,\mathrm{m^2}$, find the correlation coefficient, the eigenvalues, the direction of the long axis and the semi-axes of the $2\sigma$ ellipse.
:::

::: answer
**Correlation:** $\rho = -6/\sqrt{9 \times 9} = -6/9 = -0.667$.

**Eigenvalues:** the average of the diagonal is $9$, and $\tfrac{1}{2}\sqrt{0^2 + 4 \times 36} = 6$, so $\lambda = 9 \pm 6$: $15$ and $3\,\mathrm{m^2}$. Their square roots are $3.87$ and $1.73\,\mathrm{m}$.

**Direction:** $\theta = \tfrac{1}{2}\operatorname{atan2}(-12, 0) = \tfrac{1}{2} \times (-90^\circ) = -45^\circ$. The long axis runs along the line $x_2 = -x_1$, down to the right, as a negative correlation requires.

**$2\sigma$ ellipse:** semi-axes $2 \times 3.87 = 7.75\,\mathrm{m}$ and $2 \times 1.73 = 3.46\,\mathrm{m}$. Both single-axis sigmas are $3\,\mathrm{m}$, yet the ellipse reaches $3.87\,\mathrm{m}$ per sigma along its long axis.
:::

::: check
A scatter plot of a two-dimensional Gaussian shows its $1\sigma$ ellipse. Roughly what fraction of the points should be inside it, and why is the answer not $68\%$?
:::

::: answer
About $39\%$, since $1 - e^{-1/2} = 0.3935$.

The $68.27\%$ figure is the chance that *one* standardised part is within one sigma. Being inside the ellipse needs the squared Mahalanobis distance — a sum of two squared standard normals — to be at most one. That is stricter: both parts, in the principal frame, must be small at the same time. More dimensions give more ways to fall outside, so the fraction inside at a fixed $k$ drops as $n$ grows.
:::

::: check
Explain why the covariance matrix of any random vector must be positive semi-definite, and give an example of a valid covariance that is singular.
:::

::: answer
Pick any fixed vector $\mathbf{a}$. The number $\mathbf{a}^{\mathsf{T}}\mathbf{x}$ is a random variable, and its variance is $\mathbf{a}^{\mathsf{T}}\mathbf{P}\mathbf{a}$. A variance is the average of a square, so it cannot be negative. So $\mathbf{a}^{\mathsf{T}}\mathbf{P}\mathbf{a} \geq 0$ for every $\mathbf{a}$ — which is the definition of positive semi-definite.

A singular example: let $x_2 = 2x_1$ exactly, with $\operatorname{Var}(x_1) = 1$. Then $\operatorname{Var}(x_2) = 4$ and $\operatorname{Cov}(x_1, x_2) = 2$, so $\mathbf{P} = \begin{bmatrix} 1 & 2 \\ 2 & 4 \end{bmatrix}$, with determinant $4 - 4 = 0$. The recipe $\mathbf{a} = (2, -1)^{\mathsf{T}}$ gives $\mathbf{a}^{\mathsf{T}}\mathbf{P}\mathbf{a} = 0$, because $2x_1 - x_2$ is always exactly zero. Positive semi-definite does not mean invertible.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $f_X(x) = \frac{1}{\sigma\sqrt{2\pi}}\exp\!\big(-\frac{(x-\mu)^2}{2\sigma^2}\big)$ | Scalar Gaussian $\mathcal{N}(\mu, \sigma^2)$ |
| $\Phi(z) = \tfrac{1}{2}[1 + \operatorname{erf}(z/\sqrt{2})]$ | Standard normal CDF; $P(X \leq x) = \Phi((x-\mu)/\sigma)$ |
| $68.27\%$, $95.45\%$, $99.73\%$ | Scalar containment of $\pm 1\sigma$, $\pm 2\sigma$, $\pm 3\sigma$ |
| $\mathbb{E}[Z^4] = 3$ | Gaussian kurtosis is 3; all odd moments are zero |
| $\mathbf{P} = \mathbb{E}[(\mathbf{x}-\boldsymbol{\mu})(\mathbf{x}-\boldsymbol{\mu})^{\mathsf{T}}]$ | Covariance matrix: symmetric, PSD, variances on the diagonal |
| $\mathbf{a}^{\mathsf{T}}\mathbf{P}\mathbf{a} = \operatorname{Var}(\mathbf{a}^{\mathsf{T}}\mathbf{x}) \geq 0$ | Why $\mathbf{P}$ is positive semi-definite |
| $\rho_{ij} = P_{ij}/\sqrt{P_{ii}P_{jj}}$ | Correlation coefficient, in $[-1, 1]$ |
| $p(\mathbf{x}) = ((2\pi)^{n/2}\lvert\mathbf{P}\rvert^{1/2})^{-1}\exp(-\tfrac{1}{2}d^2)$ | Multivariate Gaussian density |
| $d^2 = (\mathbf{x}-\boldsymbol{\mu})^{\mathsf{T}}\mathbf{P}^{-1}(\mathbf{x}-\boldsymbol{\mu})$ | Squared Mahalanobis distance |
| $\mathbf{P} = \mathbf{V}\boldsymbol{\Lambda}\mathbf{V}^{\mathsf{T}}$, semi-axes $k\sqrt{\lambda_i}$ | $k$-sigma ellipsoid: axes along the eigenvectors |
| $\theta = \tfrac{1}{2}\operatorname{atan2}(2P_{12}, P_{11} - P_{22})$ | Tilt of a 2-D error ellipse |
| $97.07\%$ (3-D), $98.89\%$ (2-D) | Containment of the $3\sigma$ ellipsoid, from the chi-square CDF |
| $\mathbb{E}[x_2 \mid x_1] = \mu_2 + \frac{P_{12}}{P_{11}}(x_1 - \mu_1)$, $\operatorname{Var} = \sigma_2^2(1-\rho^2)$ | Conditioning a Gaussian: the seed of the Kalman update |

Next lesson: what happens to $\boldsymbol{\mu}$ and $\mathbf{P}$ when you push a random vector through a matrix. That one rule is how a covariance moves forward through the dynamics, how correlated samples are made from independent ones, and how two uncertain estimates are blended into one better one.

::: context gauss-name Why it carries Gauss's name
Carl Friedrich Gauss used this curve in 1809 to explain how to fit an orbit to imperfect telescope sightings. He had used the method a few years earlier to predict where the newly found dwarf planet Ceres would reappear after it slipped behind the Sun's glare — and astronomers found it close to where he said. That is why the curve carries his name, even though Abraham de Moivre had met it decades earlier while studying coin tosses. It was born, in other words, as a navigation tool.
:::

::: context error-function A function with no formula
Some integrals have no answer built from powers, roots, sines and logarithms. The area under the bell is one of them. So mathematicians gave it a name, the **error function**, and worked out ways to compute it to any accuracy — the same way $\sqrt{2}$ has no exact decimal but your calculator still knows it. The word "error" is a leftover from Gauss's time, when this curve was the law of measurement errors.
:::

::: context sigma-bands The 68–95–99.7 picture
The bell with its bands shaded. The dark middle band, within one sigma of the centre, holds $68.27\%$ of the area. Adding the light blue bands takes you out to two sigmas and $95.45\%$; adding the orange ones takes you to three sigmas and $99.73\%$. The thin tails beyond hold the last $0.27\%$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <path d="M42.9,130 L42.9,128.9 48.8,128.4 54.8,127.7 60.7,126.7 66.7,125.4 72.7,123.6 78.6,121.4 84.6,118.7 88.6,116.5 L88.6,130 Z" fill="#f2b880"/>
  <path d="M271.4,130 L271.4,116.5 275.4,118.7 281.4,121.4 287.3,123.6 293.3,125.4 299.3,126.7 305.2,127.7 311.2,128.4 317.1,128.9 L317.1,130 Z" fill="#f2b880"/>
  <path d="M88.6,130 L88.6,116.5 94.5,112.6 100.5,108.0 106.5,102.6 112.4,96.5 118.4,89.7 124.3,82.3 130.3,74.6 134.3,69.3 L134.3,130 Z" fill="#8fb8f0"/>
  <path d="M225.7,130 L225.7,69.3 229.7,74.6 235.7,82.3 241.6,89.7 247.6,96.5 253.5,102.6 259.5,108.0 265.5,112.6 271.4,116.5 L271.4,130 Z" fill="#8fb8f0"/>
  <path d="M134.3,130 L134.3,69.3 138.3,64.1 142.2,58.9 146.2,53.9 150.2,49.2 154.2,44.8 158.1,40.8 162.1,37.4 166.1,34.5 170.1,32.3 174.0,30.8 178.0,30.1 182.0,30.1 186.0,30.8 189.9,32.3 193.9,34.5 197.9,37.4 201.9,40.8 205.8,44.8 209.8,49.2 213.8,53.9 217.8,58.9 221.7,64.1 225.7,69.3 L225.7,130 Z" fill="#1d6fd1"/>
  <polyline fill="none" stroke="#1f2a44" stroke-width="2" points="20.0,129.8 29.1,129.6 38.3,129.2 47.4,128.5 56.6,127.4 65.7,125.6 74.9,122.9 84.0,119.0 93.1,113.6 102.3,106.4 111.4,97.5 120.6,87.0 129.7,75.4 138.9,63.3 148.0,51.7 157.1,41.7 166.3,34.4 175.4,30.5 180.0,30.0 184.6,30.5 193.7,34.4 202.9,41.7 212.0,51.7 221.1,63.3 230.3,75.4 239.4,87.0 248.6,97.5 257.7,106.4 266.9,113.6 276.0,119.0 285.1,122.9 294.3,125.6 303.4,127.4 312.6,128.5 321.7,129.2 330.9,129.6 340.0,129.8"/>
  <line x1="16" y1="130" x2="344" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="42.9" y="145">−3σ</text><text x="88.6" y="145">−2σ</text><text x="134.3" y="145">−1σ</text><text x="180" y="145">μ</text>
    <text x="225.7" y="145">+1σ</text><text x="271.4" y="145">+2σ</text><text x="317.1" y="145">+3σ</text>
  </g>
  <text x="180" y="100" font-size="12" fill="#ffffff" text-anchor="middle" font-weight="700">68.27%</text>
  <text x="180" y="162" font-size="11" fill="#1f2a44" text-anchor="middle">±2σ: 95.45%   ·   ±3σ: 99.73%</text>
</svg>
```
:::

::: context psd-meaning What "positive semi-definite" says
Break the phrase apart. **Definite** means the quadratic form $\mathbf{a}^{\mathsf{T}}\mathbf{P}\mathbf{a}$ has a definite sign. **Positive** says that sign is plus. **Semi** allows it to be exactly zero for some directions. So the whole phrase says: "whichever way you mix the errors, the variance of the mix is zero or more." It is the matrix version of "a variance cannot be negative". A matrix that is positive for every non-zero $\mathbf{a}$, never zero, is called **positive definite**; that is the kind that has an inverse.
:::

::: context mahalanobis A distance from a survey of people
Prasanta Chandra Mahalanobis was an Indian statistician who founded the Indian Statistical Institute. In the 1930s he wanted to compare groups of people by many body measurements at once, and saw that a ruler distance was misleading when the measurements were on different scales and went together. His fix — divide out the covariance — is the same one a navigation filter uses today to decide whether a new measurement is believable or should be thrown away.
:::

::: context ellipse-in-box The ellipse inside the sigma box
The $1\sigma$, $2\sigma$ and $3\sigma$ ellipses of $\mathbf{P} = \begin{bmatrix} 4 & 1 \\ 1 & 2 \end{bmatrix}\,\mathrm{m^2}$, drawn to scale (the first axis points right, the second up). The dashed box marks $\pm 3$ single-axis sigmas: $\pm 6\,\mathrm{m}$ across and $\pm 4.24\,\mathrm{m}$ up. The $3\sigma$ ellipse touches all four sides, but its long axis, tilted $22.5^\circ$, reaches $6.30\,\mathrm{m}$ from the centre.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="100" x2="300" y2="100" stroke="#6c7a93" stroke-width="1"/>
  <line x1="180" y1="30" x2="180" y2="170" stroke="#6c7a93" stroke-width="1"/>
  <rect x="108" y="49.1" width="144" height="101.8" fill="none" stroke="#6c7a93" stroke-width="1.2" stroke-dasharray="5,4"/>
  <g transform="rotate(-22.5 180 100)" fill="none" stroke-width="2">
    <ellipse cx="180" cy="100" rx="75.6" ry="45.3" stroke="#1d6fd1"/>
    <ellipse cx="180" cy="100" rx="50.4" ry="30.2" stroke="#8fb8f0"/>
    <ellipse cx="180" cy="100" rx="25.2" ry="15.1" stroke="#1f2a44"/>
    <line x1="180" y1="100" x2="255.6" y2="100" stroke="#b4232c"/>
  </g>
  <text x="262" y="60" font-size="11" fill="#b4232c">6.30 m at 22.5°</text>
  <text x="256" y="162" font-size="11" fill="#6c7a93">±3σ box</text>
  <text x="304" y="104" font-size="11" fill="#1f2a44">x₁</text>
  <text x="184" y="26" font-size="11" fill="#1f2a44">x₂</text>
  <text x="20" y="190" font-size="11" fill="#1f2a44">rings: 1σ (dark), 2σ, 3σ (blue)</text>
</svg>
```
:::

::: context dimension-bars Containment falls with dimension
The share of samples inside the $1\sigma$ region, for one, two and three dimensions. The drop is steep: in three dimensions, four samples out of five fall outside the $1\sigma$ ellipsoid.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="130" x2="340" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="70" y="61.7" width="60" height="68.3" fill="#1d6fd1"/>
  <rect x="160" y="90.7" width="60" height="39.3" fill="#8fb8f0"/>
  <rect x="250" y="110.1" width="60" height="19.9" fill="#f2b880"/>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="100" y="54">68.3%</text><text x="190" y="83">39.3%</text><text x="280" y="103">19.9%</text>
    <text x="100" y="147">n = 1</text><text x="190" y="147">n = 2</text><text x="280" y="147">n = 3</text>
  </g>
  <text x="40" y="20" font-size="11" fill="#1f2a44">inside the 1σ region (bar height = percent)</text>
</svg>
```
:::

::: context kalman-seed Where this comes back
Rudolf Kálmán published his filter in 1960, and within a few years it was flying on Apollo, helping the spacecraft work out where it was on the way to the Moon. Strip away the matrices and every Kalman update is this two-line conditioning rule: shift the guess by gain times surprise, and shrink the variance. In the estimation track you will derive the full matrix version; in the next lesson you will see the first half of it appear from a single covariance formula.
:::
