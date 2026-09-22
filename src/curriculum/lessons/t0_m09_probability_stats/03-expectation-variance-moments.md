---
id: l03-expectation-variance-moments
title: Expectation, variance and moments
minutes: 21
covers:
  - expectation, variance, moments
---

A distribution is a whole function, and you rarely have the luxury of carrying a whole function around. A gyro datasheet gives you two or three numbers. A navigation filter carries, for each state, an estimate and an uncertainty, and nothing else. Requirements are written as "the mean shall be within" and "the standard deviation shall not exceed". The job of this lesson is to define the numbers that summarise a distribution, to show which summaries survive the operations you actually perform on random quantities, and to explain how those summaries are estimated from a finite batch of data.

The two summaries that matter most are the **expectation**, the centre of the distribution, and the **variance**, its spread. The variance is the single most important quantity in estimation: the Kalman filter is, at heart, a machine for propagating and reducing variances. The later lessons on the Gaussian and on linear transformations build directly on the algebra developed here, so it is worth being thorough now, even where the material feels elementary.

## Expectation

The **expectation** (or expected value, or mean) of a random variable is its probability-weighted average value. For a discrete variable with mass function $p_X$ and for a continuous variable with density $f_X$,

$$
\mathbb{E}[X] = \sum_x x\,p_X(x), \qquad \mathbb{E}[X] = \int_{-\infty}^{\infty} x\,f_X(x)\,dx.
$$

The symbol $\mu$ or $\mu_X$ is conventional for the expectation. Mechanically it is the centre of mass of the distribution: if you cut the density out of card, $\mu$ is where it balances. It is a number, not a random variable, and it need not be a value $X$ can take; the expected number of failed thrusters can be $0.03$.

The expectation of a function of a random variable does not require finding the new distribution first. For $Y = g(X)$,

$$
\mathbb{E}[g(X)] = \int_{-\infty}^{\infty} g(x)\,f_X(x)\,dx,
$$

and likewise with a sum in the discrete case. This is sometimes called the law of the unconscious statistician, because people use it without noticing that it needs proof; the proof is the change-of-variables formula from the previous lesson, applied and then undone.

Three properties of the expectation carry most of the weight in this module.

**Linearity.** For constants $a$ and $b$, $\mathbb{E}[aX + b] = a\,\mathbb{E}[X] + b$, and for any two random variables, dependent or not,

$$
\mathbb{E}[X + Y] = \mathbb{E}[X] + \mathbb{E}[Y].
$$

The second statement is the one people doubt, and it is true without any independence assumption, because the integral of a sum is the sum of the integrals whatever the joint density looks like.

**Products of independent variables.** If $X$ and $Y$ are independent, then $\mathbb{E}[XY] = \mathbb{E}[X]\,\mathbb{E}[Y]$, since the joint density factorises and the double integral separates. Without independence this fails, and the failure is measured by the covariance, defined below.

**Expectation of an indicator.** If $\mathbf{1}_A$ is the variable that equals $1$ when event $A$ happens and $0$ otherwise, then $\mathbb{E}[\mathbf{1}_A] = P(A)$. Every probability is an expectation. This is why a Monte Carlo campaign, which averages indicators of failure, is estimating a probability by estimating a mean.

## Variance and standard deviation

The **variance** measures how far $X$ typically sits from its mean, in squared units:

$$
\operatorname{Var}(X) = \mathbb{E}\big[(X - \mu)^2\big] = \mathbb{E}[X^2] - \mu^2.
$$

The second form follows by expanding the square and using linearity: $\mathbb{E}[X^2 - 2\mu X + \mu^2] = \mathbb{E}[X^2] - 2\mu^2 + \mu^2$. It is the form you use when computing by hand, and the form you should *not* use in floating-point code with large means, where the two terms nearly cancel and the difference is swamped by round-off.

The **standard deviation** $\sigma = \sqrt{\operatorname{Var}(X)}$ has the same units as $X$, which is why datasheets quote it rather than the variance. When a gyro is described as having $0.2\,^\circ/\mathrm{h}$ of noise, that is a standard deviation.

Scaling and shifting a variable have a definite effect on the variance. With $Y = aX + b$, the mean shifts to $a\mu + b$, so $Y - \mu_Y = a(X - \mu)$ and

$$
\operatorname{Var}(aX + b) = a^2\,\operatorname{Var}(X), \qquad \sigma_Y = |a|\,\sigma_X.
$$

The shift $b$ vanishes entirely: adding a constant moves the distribution without changing its spread. The factor $a^2$ rather than $a$ is the source of many errors, because a factor of ten on the scale is a factor of a hundred on the variance.

::: example Quantisation noise
The rounding error of a converter with step $\Delta$ is uniform on $[-\Delta/2, \Delta/2]$, with density $1/\Delta$. Its mean is zero by symmetry, so the variance is $\mathbb{E}[E^2]$:

$$
\operatorname{Var}(E) = \int_{-\Delta/2}^{\Delta/2} \frac{e^2}{\Delta}\,de = \frac{1}{\Delta}\left[\frac{e^3}{3}\right]_{-\Delta/2}^{\Delta/2} = \frac{1}{\Delta}\cdot\frac{2}{3}\cdot\frac{\Delta^3}{8} = \frac{\Delta^2}{12}.
$$

The standard deviation is $\sigma_q = \Delta/\sqrt{12} = 0.289\,\Delta$. For the 12-bit converter of the previous lesson, $\Delta = 4.88\,\mathrm{mV}$ and $\sigma_q = 1.41\,\mathrm{mV}$. This is the number you enter into a noise budget for a quantised sensor, and the same result gives the general variance of a uniform distribution on $[a, b]$ as $(b - a)^2/12$.
:::

The means and variances of the distributions met so far are worth memorising, since they recur constantly:

| Distribution | Mean | Variance |
| --- | --- | --- |
| Bernoulli($p$) | $p$ | $p(1 - p)$ |
| Binomial($n, p$) | $np$ | $np(1 - p)$ |
| Poisson($\lambda t$) | $\lambda t$ | $\lambda t$ |
| Uniform on $[a, b]$ | $(a + b)/2$ | $(b - a)^2/12$ |
| Exponential($\lambda$) | $1/\lambda$ | $1/\lambda^2$ |

The Bernoulli variance follows from $\mathbb{E}[X^2] = \mathbb{E}[X] = p$, so $\operatorname{Var} = p - p^2$. The binomial mean and variance come from the sum rules of the next lesson applied to $n$ independent Bernoullis. The exponential's variance comes from $\mathbb{E}[T^2] = \int_0^\infty t^2 \lambda e^{-\lambda t}\,dt = 2/\lambda^2$, so $\operatorname{Var}(T) = 2/\lambda^2 - 1/\lambda^2 = 1/\lambda^2$.

## Higher moments: shape beyond the spread

The **$k$-th moment** of $X$ is $\mathbb{E}[X^k]$ and the **$k$-th central moment** is $\mathbb{E}[(X - \mu)^k]$. The first moment is the mean; the second central moment is the variance. The third and fourth central moments, made dimensionless by dividing by the appropriate power of $\sigma$, describe the shape of the distribution:

$$
\gamma_1 = \frac{\mathbb{E}[(X - \mu)^3]}{\sigma^3} \quad\text{(skewness)}, \qquad
\kappa = \frac{\mathbb{E}[(X - \mu)^4]}{\sigma^4} \quad\text{(kurtosis)}.
$$

Skewness is zero for any symmetric distribution, positive when the right tail is longer (the exponential has $\gamma_1 = 2$), negative when the left tail is longer. Kurtosis measures how much of the variance comes from rare large deviations rather than frequent small ones. The Gaussian has $\kappa = 3$, a fact the next lesson proves, and $\kappa - 3$ is called the **excess kurtosis**. The uniform distribution has $\kappa = 9/5 = 1.8$ (no tails at all), and the exponential has $\kappa = 9$. A sensor whose error has excess kurtosis well above zero produces occasional large outliers far more often than a Gaussian with the same $\sigma$ would predict, and a filter tuned to that $\sigma$ will be surprised by them. Checking the kurtosis of residuals is a quick, cheap diagnostic for heavy tails.

## Chebyshev's inequality

How much can you say about the tails from the variance alone? Remarkably, something. For any random variable with finite variance and any $k > 0$,

$$
P\big(|X - \mu| \geq k\sigma\big) \leq \frac{1}{k^2}.
$$

The proof is two lines. Let $D = (X - \mu)^2$. Then $\sigma^2 = \mathbb{E}[D] \geq \mathbb{E}[D\,\mathbf{1}_{D \geq k^2\sigma^2}] \geq k^2\sigma^2\,P(D \geq k^2\sigma^2)$, and dividing through gives the result. So no matter how the distribution is shaped, at most $1/9 = 11.1\%$ of its probability lies beyond three standard deviations. For a Gaussian the true figure is $0.27\%$, forty times smaller, which shows both how loose Chebyshev is and how much the Gaussian assumption buys you. When you cannot defend that assumption, Chebyshev is the honest bound.

## Covariance and correlation

For two random variables, the natural generalisation of variance is the **covariance**:

$$
\operatorname{Cov}(X, Y) = \mathbb{E}\big[(X - \mu_X)(Y - \mu_Y)\big] = \mathbb{E}[XY] - \mu_X\mu_Y.
$$

It is positive when $X$ and $Y$ tend to be above their means together, negative when one tends to be high while the other is low, and $\operatorname{Cov}(X, X) = \operatorname{Var}(X)$. If the variables are independent, $\mathbb{E}[XY] = \mu_X\mu_Y$ and the covariance is zero. The converse is false: zero covariance does not imply independence. Take $X$ uniform on $[-1, 1]$ and $Y = X^2$. Then $\mathbb{E}[XY] = \mathbb{E}[X^3] = 0$ and $\mu_X = 0$, so $\operatorname{Cov}(X, Y) = 0$, yet $Y$ is completely determined by $X$. Covariance detects *linear* association only.

The **correlation coefficient** removes the units:

$$
\rho_{XY} = \frac{\operatorname{Cov}(X, Y)}{\sigma_X\,\sigma_Y}, \qquad -1 \leq \rho_{XY} \leq 1.
$$

The bounds come from the Cauchy–Schwarz inequality, $|\mathbb{E}[UV]| \leq \sqrt{\mathbb{E}[U^2]\,\mathbb{E}[V^2]}$, applied to the centred variables. The extreme values $\rho = \pm 1$ occur exactly when $Y$ is an exact linear function of $X$. Variables with $\rho = 0$ are called **uncorrelated**.

Covariance is what makes the variance of a sum interesting:

$$
\operatorname{Var}(X + Y) = \operatorname{Var}(X) + \operatorname{Var}(Y) + 2\operatorname{Cov}(X, Y),
$$

which follows by expanding $\mathbb{E}[((X - \mu_X) + (Y - \mu_Y))^2]$. Only when the covariance is zero do variances add. The next lessons generalise this to vectors, where the covariances of every pair are collected into a matrix, and to sums of many variables.

::: example Averaging two correlated accelerometers
Two accelerometers on the same bracket each have a bias with standard deviation $50\,\mu\mathrm{g}$, and because they share a thermal environment their biases are correlated with $\rho = 0.8$. Averaging the two outputs gives a bias $B = (B_1 + B_2)/2$, whose variance is

$$
\operatorname{Var}(B) = \tfrac{1}{4}\big(\sigma^2 + \sigma^2 + 2\rho\sigma^2\big) = \tfrac{1}{4}\,(2500 + 2500 + 4000) = 2250\,\mu\mathrm{g}^2,
$$

so $\sigma_B = 47.4\,\mu\mathrm{g}$. Had the biases been independent, the average would have had $\sigma_B = 50/\sqrt{2} = 35.4\,\mu\mathrm{g}$. The correlation has removed most of the benefit of averaging: two sensors that err together are not much better than one. The difference $B_1 - B_2$, on the other hand, has variance $2\sigma^2(1 - \rho) = 1000\,\mu\mathrm{g}^2$ and $\sigma = 31.6\,\mu\mathrm{g}$, smaller than either sensor alone, because the shared part cancels. Correlation hurts averaging and helps differencing.
:::

## Estimating moments from data: sample mean and sample variance

Everything so far assumed the distribution was known. In practice you have $N$ realisations $x_1, \ldots, x_N$ from a bench test or a simulation, and want to estimate $\mu$ and $\sigma^2$ from them. The **sample mean** and **sample variance** are

$$
\bar{x} = \frac{1}{N}\sum_{i=1}^{N} x_i, \qquad s^2 = \frac{1}{N - 1}\sum_{i=1}^{N} (x_i - \bar{x})^2.
$$

Treat the $x_i$ as independent random variables with the same distribution. The sample mean is then itself a random variable, with

$$
\mathbb{E}[\bar{x}] = \mu, \qquad \operatorname{Var}(\bar{x}) = \frac{\sigma^2}{N}, \qquad \sigma_{\bar{x}} = \frac{\sigma}{\sqrt{N}}.
$$

The first is linearity; the second uses the fact that variances of independent variables add, so the sum of $N$ terms has variance $N\sigma^2$, and dividing by $N$ divides the variance by $N^2$. The quantity $\sigma/\sqrt{N}$ is the **standard error** of the mean. Averaging $100$ samples cuts the uncertainty by a factor of $10$, not $100$, and this square-root law will reappear in the Monte Carlo lesson as the fundamental limit on simulation accuracy.

The $N - 1$ in the sample variance is **Bessel's correction**, and it is not a convention. Expanding $\sum (x_i - \bar{x})^2 = \sum (x_i - \mu)^2 - N(\bar{x} - \mu)^2$ and taking expectations gives $N\sigma^2 - N \cdot \sigma^2/N = (N - 1)\sigma^2$. The deviations are measured from $\bar{x}$, which was fitted to the same data and therefore sits closer to the samples than $\mu$ does; one degree of freedom has been spent on estimating the mean, and dividing by $N - 1$ rather than $N$ makes $\mathbb{E}[s^2] = \sigma^2$ exactly. Such an estimator is called **unbiased**.

::: example Sample statistics of a gyro bench test
Eight one-second averages of a stationary gyro's output, in $^\circ/\mathrm{h}$, are

$$
0.52,\ 0.75,\ 0.31,\ 0.70,\ 0.45,\ 0.45,\ 0.88,\ 0.53.
$$

The sample mean is $\bar{x} = 4.59/8 = 0.574\,^\circ/\mathrm{h}$; this is the estimate of the bias. The squared deviations from $\bar{x}$ sum to $0.2458$, so

$$
s^2 = \frac{0.2458}{7} = 0.0351\,(^\circ/\mathrm{h})^2, \qquad s = 0.187\,^\circ/\mathrm{h}.
$$

Dividing by $N = 8$ instead would give $0.0307$ and $s = 0.175\,^\circ/\mathrm{h}$, about $6\%$ too small on average. With only eight samples the bias estimate itself carries a standard error of roughly $s/\sqrt{8} = 0.066\,^\circ/\mathrm{h}$, so the second decimal place of $0.574$ is not to be trusted; the confidence-interval lesson makes that statement precise.
:::

::: warning
The variance of a sum is not the sum of the variances unless the terms are uncorrelated, and the standard deviation of a sum is never the sum of the standard deviations unless the terms are perfectly correlated. Adding sigmas linearly, which datasheet-driven error budgets sometimes do, overstates the error of independent contributions and understates it when a common cause is present. Add variances, then take the square root, and include the covariance terms when you know they are there.
:::

::: key
$\mathbb{E}[aX + b] = a\mathbb{E}[X] + b$ and $\mathbb{E}[X + Y] = \mathbb{E}[X] + \mathbb{E}[Y]$ always; $\mathbb{E}[XY] = \mathbb{E}[X]\mathbb{E}[Y]$ needs independence. $\operatorname{Var}(X) = \mathbb{E}[(X - \mu)^2] = \mathbb{E}[X^2] - \mu^2$, $\operatorname{Var}(aX + b) = a^2\operatorname{Var}(X)$, and $\operatorname{Var}(X + Y) = \operatorname{Var}(X) + \operatorname{Var}(Y) + 2\operatorname{Cov}(X, Y)$. The sample mean of $N$ independent samples has standard error $\sigma/\sqrt{N}$, and the unbiased sample variance divides by $N - 1$.
:::

## Check yourself

::: check
The number of GNSS satellites in view during a segment takes the values $6, 7, 8, 9$ with probabilities $0.1, 0.3, 0.4, 0.2$. Find the mean, the variance and the standard deviation.
:::

::: answer
$\mu = 6(0.1) + 7(0.3) + 8(0.4) + 9(0.2) = 7.7$. Then $\mathbb{E}[X^2] = 36(0.1) + 49(0.3) + 64(0.4) + 81(0.2) = 60.1$, so $\operatorname{Var}(X) = 60.1 - 7.7^2 = 60.1 - 59.29 = 0.81$ and $\sigma = 0.9$. The mean $7.7$ is not a possible count, which is normal for an expectation.
:::

::: check
A barometric altimeter reports altitude in counts with a noise standard deviation of $2$ counts, and the scale factor is $0.25\,\mathrm{m}$ per count. What is the noise standard deviation in metres? If a constant offset of $40\,\mathrm{m}$ is subtracted from the output, what happens to the standard deviation?
:::

::: answer
The altitude in metres is $Y = 0.25\,X$, so $\sigma_Y = 0.25 \times 2 = 0.5\,\mathrm{m}$ and $\operatorname{Var}(Y) = 0.0625 \times 4 = 0.25\,\mathrm{m^2}$. Subtracting a constant does nothing to the spread: $\operatorname{Var}(Y - 40) = \operatorname{Var}(Y)$, so $\sigma$ remains $0.5\,\mathrm{m}$. Only the mean moves.
:::

::: check
Without assuming any particular distribution, what is the largest possible probability that a measurement lies more than two standard deviations from its mean? Compare with the Gaussian value of $4.55\%$ and explain the gap.
:::

::: answer
Chebyshev with $k = 2$ gives $P(|X - \mu| \geq 2\sigma) \leq 1/4 = 25\%$. The Gaussian's $4.55\%$ is more than five times smaller because Chebyshev must hold for every distribution with that variance, including pathological ones that put all their probability at exactly $\mu \pm 2\sigma$, for which the bound is achieved. The Gaussian is far better behaved than the worst case, and assuming it lets you make much stronger tail statements, provided the assumption is justified.
:::

::: check
Give an example of two random variables that are uncorrelated but not independent, and say what feature of covariance allows this.
:::

::: answer
Let $X$ be uniform on $[-1, 1]$ and $Y = X^2$. Then $\operatorname{Cov}(X, Y) = \mathbb{E}[X^3] - \mathbb{E}[X]\mathbb{E}[X^2] = 0 - 0 = 0$, since odd moments of a symmetric zero-mean variable vanish. Yet knowing $X$ fixes $Y$ exactly, so they are as dependent as two variables can be. Covariance measures only the linear part of the relationship; a purely even (quadratic) dependence is invisible to it.
:::

::: check
An accelerometer's white noise has a standard deviation of $200\,\mu\mathrm{g}$ per sample. How many independent samples must be averaged to estimate its bias with a standard error of $1\,\mu\mathrm{g}$? With $1000$ samples, what standard error do you get?
:::

::: answer
The standard error is $\sigma/\sqrt{N}$, so $N = (\sigma/\text{SE})^2 = (200/1)^2 = 40\,000$ samples. With $N = 1000$ the standard error is $200/\sqrt{1000} = 6.32\,\mu\mathrm{g}$. Improving the estimate by a factor of ten costs a factor of a hundred in samples, and if the samples are correlated in time, as real accelerometer noise is at high rates, even more are needed because the effective number of independent samples is smaller than $N$.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\mathbb{E}[X] = \int x f_X\,dx$ | Expectation (mean $\mu$): centre of mass of the distribution |
| $\mathbb{E}[g(X)] = \int g(x) f_X\,dx$ | Expectation of a function, no new distribution needed |
| $\mathbb{E}[X + Y] = \mathbb{E}[X] + \mathbb{E}[Y]$ | Linearity, with no independence required |
| $\operatorname{Var}(X) = \mathbb{E}[(X-\mu)^2] = \mathbb{E}[X^2] - \mu^2$ | Variance; $\sigma = \sqrt{\operatorname{Var}}$ has the units of $X$ |
| $\operatorname{Var}(aX + b) = a^2 \operatorname{Var}(X)$ | Scaling squares, shifting does nothing |
| $\Delta^2/12$ | Variance of a uniform of width $\Delta$: quantisation noise |
| $\gamma_1$, $\kappa$ | Skewness and kurtosis; Gaussian has $\kappa = 3$ |
| $P(\lvert X - \mu\rvert \geq k\sigma) \leq 1/k^2$ | Chebyshev's inequality, distribution-free |
| $\operatorname{Cov}(X,Y) = \mathbb{E}[XY] - \mu_X \mu_Y$, $\rho = \operatorname{Cov}/(\sigma_X\sigma_Y)$ | Covariance and correlation coefficient, $\lvert\rho\rvert \leq 1$ |
| $\operatorname{Var}(X+Y) = \operatorname{Var} X + \operatorname{Var} Y + 2\operatorname{Cov}(X,Y)$ | Variance of a sum |
| $\bar{x}$, $s^2 = \frac{1}{N-1}\sum (x_i - \bar{x})^2$ | Sample mean (standard error $\sigma/\sqrt{N}$) and unbiased sample variance |

The next lesson introduces the distribution that turns these summaries into a complete description: the Gaussian, for which the mean and covariance are everything, and whose multivariate form is the object every navigation filter carries.
