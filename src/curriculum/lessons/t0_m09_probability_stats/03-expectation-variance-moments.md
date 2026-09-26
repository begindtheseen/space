---
id: l03-expectation-variance-moments
title: Expectation, variance and moments
minutes: 21
covers:
  - expectation, variance, moments
---

A distribution is a whole function, and you rarely get to carry a whole function around. A gyro datasheet gives you two or three numbers. A navigation filter keeps, for each quantity it tracks, a best guess and an uncertainty — and nothing else. Requirements are written as "the mean shall be within…" and "the standard deviation shall not exceed…".

This lesson defines the numbers that sum up a distribution, shows which of them survive the things you actually do to random quantities (scale them, add them, average them), and explains how to estimate them from a finite batch of data.

The two summaries that matter most are the **expectation**, the centre of the distribution, and the **variance**, its spread. The variance is the single most important quantity in estimation: a Kalman filter is, at heart, a machine for pushing variances forward in time and shrinking them with measurements. The lessons on the Gaussian and on linear transformations build directly on the algebra here, so it pays to be thorough now, even where it feels easy.

## Expectation

Your test scores this term are $70$, $80$, $80$ and $90$. The average is $80$. Notice you could also compute it as "$70$ a quarter of the time, $80$ half the time, $90$ a quarter of the time": $70 \times 0.25 + 80 \times 0.5 + 90 \times 0.25 = 80$. Each value, weighted by how often it happens.

The **expectation** (also called the expected value, or the mean) of a random variable is exactly that: its probability-weighted average. For a discrete variable with mass function $p_X$, and for a continuous one with density $f_X$,

$$
\mathbb{E}[X] = \sum_x x\,p_X(x), \qquad \mathbb{E}[X] = \int_{-\infty}^{\infty} x\,f_X(x)\,dx.
$$

Read $\mathbb{E}[X]$ as "E of X" or "the expected value of X". The usual symbol for it is $\mu$ ("mu") or $\mu_X$. In the continuous formula, the integral plays the role of the sum and $f_X(x)\,dx$ plays the role of "how often".

There is a physical picture too. Cut the density out of cardboard and it **[[balances|balance-point]]** on a finger placed at $\mu$: the expectation is the centre of mass of the distribution. It is a fixed number, not a random one. And it need not be a value $X$ can actually take — the expected number of failed thrusters can be $0.03$.

### The expectation of a function

To find the expected value of some function of $X$, say $Y = g(X)$, you do not need $Y$'s distribution first. Weight $g(x)$ instead of $x$:

$$
\mathbb{E}[g(X)] = \int_{-\infty}^{\infty} g(x)\,f_X(x)\,dx,
$$

and the same with a sum for a discrete variable. This rule has a **[[funny name|unconscious-statistician]]**, because people use it without noticing that it needs a proof. The proof is the change-of-variables formula from the last lesson, applied and then undone.

### Three rules that carry the weight

**Linearity.** Scaling and shifting pass straight through: for constants $a$ and $b$, $\mathbb{E}[aX + b] = a\,\mathbb{E}[X] + b$. And for *any* two random variables, related or not,

$$
\mathbb{E}[X + Y] = \mathbb{E}[X] + \mathbb{E}[Y].
$$

This second statement is the one people doubt. It is true with no independence assumption at all, because the integral of a sum is the sum of the integrals, whatever the joint density looks like.

**Products need independence.** If $X$ and $Y$ are independent, then $\mathbb{E}[XY] = \mathbb{E}[X]\,\mathbb{E}[Y]$: the joint density splits into a product, and the double integral splits into two single ones. Without independence this fails, and the covariance (below) measures by how much.

**Every probability is an expectation.** Let $\mathbf{1}_A$, the **indicator** of event $A$, be the variable that equals $1$ when $A$ happens and $0$ otherwise. Then $\mathbb{E}[\mathbf{1}_A] = 1 \cdot P(A) + 0 \cdot P(A^c) = P(A)$. That is why a Monte Carlo campaign, which averages "did this run fail? 1 or 0", is estimating a probability by estimating a mean.

## Variance and standard deviation

Two archers each hit the centre of the target *on average*. One groups every arrow within a hand's width. The other scatters arrows across the whole board. Same mean, very different archers. The variance is the number that tells them apart.

The **variance** measures how far $X$ typically sits from its mean, in squared units:

$$
\operatorname{Var}(X) = \mathbb{E}\big[(X - \mu)^2\big] = \mathbb{E}[X^2] - \mu^2.
$$

Read the first form as "the average squared distance from the mean". The **[[squaring|why-square]]** makes every distance count as positive and makes big misses count extra.

The second form comes from expanding the square and using linearity:

$$
\mathbb{E}[X^2 - 2\mu X + \mu^2] = \mathbb{E}[X^2] - 2\mu\,\mathbb{E}[X] + \mu^2 = \mathbb{E}[X^2] - 2\mu^2 + \mu^2 = \mathbb{E}[X^2] - \mu^2.
$$

It is the handy form for working by hand. It is the form you should *not* use in computer code when the mean is large compared with the spread, because then the two terms nearly cancel and **[[round-off error swamps the difference|cancellation]]**.

The **standard deviation** $\sigma = \sqrt{\operatorname{Var}(X)}$ ("sigma") has the same units as $X$, which is why datasheets quote it rather than the variance. When a gyro is described as having $0.2\,^\circ/\mathrm{h}$ of noise, that is a standard deviation. So variance is written $\sigma^2$.

### Scaling and shifting

Convert a week of temperatures from Celsius to Fahrenheit with $F = 1.8\,C + 32$. The $+32$ slides every reading up by the same amount, so the spread does not change at all. The $\times 1.8$ stretches every gap by $1.8$. So the Fahrenheit spread is $1.8$ times the Celsius spread.

In general, with $Y = aX + b$ the mean moves to $a\mu + b$, so $Y - \mu_Y = a(X - \mu)$. Square it and take the expectation:

$$
\operatorname{Var}(aX + b) = a^2\,\operatorname{Var}(X), \qquad \sigma_Y = |a|\,\sigma_X.
$$

The shift $b$ disappears entirely. The factor is $a^2$, not $a$, and that trips people up: a scale factor of ten on the measurement is a factor of a hundred on the variance.

::: example Quantisation noise
The rounding error of a converter with step $\Delta$ is uniform on $[-\Delta/2, \Delta/2]$, with density $1/\Delta$. By symmetry its mean is zero, so its variance is $\mathbb{E}[E^2]$:

$$
\operatorname{Var}(E) = \int_{-\Delta/2}^{\Delta/2} \frac{e^2}{\Delta}\,de = \frac{1}{\Delta}\left[\frac{e^3}{3}\right]_{-\Delta/2}^{\Delta/2} = \frac{1}{\Delta}\cdot\frac{2}{3}\cdot\frac{\Delta^3}{8} = \frac{\Delta^2}{12}.
$$

Step by step: the integral of $e^2$ is $e^3/3$; evaluating from $-\Delta/2$ to $\Delta/2$ gives $\frac{1}{3}\left(\frac{\Delta^3}{8} + \frac{\Delta^3}{8}\right) = \frac{2}{3}\cdot\frac{\Delta^3}{8}$; dividing by $\Delta$ leaves $\Delta^2/12$.

The standard deviation is $\sigma_q = \Delta/\sqrt{12} = 0.289\,\Delta$. For the 12-bit converter of the last lesson, $\Delta = 4.88\,\mathrm{mV}$, so $\sigma_q = 0.289 \times 4.88 = 1.41\,\mathrm{mV}$. Sanity check: the error never exceeds $\Delta/2 = 2.44\,\mathrm{mV}$, and a typical size of $1.41\,\mathrm{mV}$ sits comfortably inside that. This is the number you enter into a noise budget for a quantised sensor. The same calculation gives the variance of any uniform distribution on $[a, b]$ as $(b - a)^2/12$.
:::

### A table worth memorising

The means and variances of the distributions from the last lesson come up constantly:

| Distribution | Mean | Variance |
| --- | --- | --- |
| Bernoulli($p$) | $p$ | $p(1 - p)$ |
| Binomial($n, p$) | $np$ | $np(1 - p)$ |
| Poisson($\lambda t$) | $\lambda t$ | $\lambda t$ |
| Uniform on $[a, b]$ | $(a + b)/2$ | $(b - a)^2/12$ |
| Exponential($\lambda$) | $1/\lambda$ | $1/\lambda^2$ |

Where they come from:

- **Bernoulli:** $X$ is $0$ or $1$, so $X^2 = X$ and $\mathbb{E}[X^2] = \mathbb{E}[X] = p$. Then $\operatorname{Var} = p - p^2 = p(1 - p)$.
- **Binomial:** a binomial is the sum of $n$ independent Bernoullis. Linearity gives the mean $np$. The variance-of-a-sum rule later in this lesson, with zero covariances, gives $n \times p(1-p)$.
- **Exponential:** integrating by parts twice gives $\mathbb{E}[T^2] = \int_0^\infty t^2 \lambda e^{-\lambda t}\,dt = 2/\lambda^2$, so $\operatorname{Var}(T) = 2/\lambda^2 - 1/\lambda^2 = 1/\lambda^2$.

## Higher moments: shape beyond the spread

Mean and variance say where a distribution sits and how wide it is. They do not say whether it is lopsided, or whether it hides rare huge values. For that you need higher powers.

The **$k$-th moment** of $X$ is $\mathbb{E}[X^k]$, and the **$k$-th central moment** is $\mathbb{E}[(X - \mu)^k]$ ("central" because it is measured from the centre, $\mu$). The first moment is the mean. The second central moment is the variance. The third and fourth, divided by the right power of $\sigma$ so they have no units, describe shape:

$$
\gamma_1 = \frac{\mathbb{E}[(X - \mu)^3]}{\sigma^3} \quad\text{(skewness)}, \qquad
\kappa = \frac{\mathbb{E}[(X - \mu)^4]}{\sigma^4} \quad\text{(kurtosis)}.
$$

**Skewness** ($\gamma_1$, "gamma one") measures lopsidedness. Cubing keeps the sign of each deviation, so long stretches out to the right push it positive and long stretches to the left push it negative. It is zero for any symmetric distribution. The exponential, with its long right tail, has $\gamma_1 = 2$.

**Kurtosis** ($\kappa$, "kappa") measures how much of the variance comes from rare big deviations rather than frequent small ones. The fourth power makes big deviations count enormously. The Gaussian has $\kappa = 3$, a fact the next lesson proves, so $\kappa - 3$ is called the **excess kurtosis**. The uniform distribution, which has no tails at all, has $\kappa = 9/5 = 1.8$. The exponential has $\kappa = 9$.

A sensor whose error has excess kurtosis well above zero throws **[[occasional big outliers|heavy-tails]]** far more often than a Gaussian with the same $\sigma$ would. A filter tuned to that $\sigma$ will be surprised by them. Checking the kurtosis of a filter's residuals is a quick, cheap test for heavy tails.

## Chebyshev's inequality

How much can the variance alone tell you about the tails, if you know nothing else about the shape? Surprisingly, something definite. For any random variable with finite variance, and any $k > 0$,

$$
P\big(|X - \mu| \geq k\sigma\big) \leq \frac{1}{k^2}.
$$

This is **[[Chebyshev's inequality|chebyshev]]**. Read it as: "the chance of landing $k$ or more standard deviations from the mean is at most one over $k$ squared". Whatever the distribution looks like, at most $1/9 = 11.1\%$ of its probability lies three or more standard deviations out. For a Gaussian the true figure is $0.27\%$ — about forty times smaller. That shows both how loose Chebyshev is and how much the Gaussian assumption buys you. When you cannot defend that assumption, Chebyshev is the honest bound.

::: note Why it has to be true
Let $D = (X - \mu)^2$, the squared distance from the mean. Its average is $\sigma^2$. Now throw away every outcome where $D$ is less than $k^2\sigma^2$ — that can only make the average smaller. On the outcomes that are left, $D$ is at least $k^2\sigma^2$. So

$$
\sigma^2 = \mathbb{E}[D] \geq \mathbb{E}\big[D\,\mathbf{1}_{D \geq k^2\sigma^2}\big] \geq k^2\sigma^2\,P(D \geq k^2\sigma^2).
$$

Divide both sides by $k^2\sigma^2$. Since $D \geq k^2\sigma^2$ is the same event as $|X - \mu| \geq k\sigma$, that is the inequality.
:::

## Covariance and correlation

Taller people tend to have bigger feet. Not always — but when one is above average, the other usually is too. **Covariance** puts a number on that "tend to go together":

$$
\operatorname{Cov}(X, Y) = \mathbb{E}\big[(X - \mu_X)(Y - \mu_Y)\big] = \mathbb{E}[XY] - \mu_X\mu_Y.
$$

When $X$ and $Y$ are above their means together (or below together), the product of the two deviations is positive, and the covariance comes out positive. When one tends to be high while the other is low, it comes out negative. And $\operatorname{Cov}(X, X) = \operatorname{Var}(X)$: variance is a variable's covariance with itself.

If the variables are independent, $\mathbb{E}[XY] = \mu_X\mu_Y$, so the covariance is zero. **The reverse is false**: zero covariance does not mean independent. Take $X$ uniform on $[-1, 1]$ and $Y = X^2$. Then $\mu_X = 0$ and $\mathbb{E}[XY] = \mathbb{E}[X^3] = 0$ (positive and negative cubes cancel), so $\operatorname{Cov}(X, Y) = 0$. Yet $Y$ is completely fixed by $X$. Covariance only detects *straight-line* association.

The **correlation coefficient** removes the units by dividing by both standard deviations:

$$
\rho_{XY} = \frac{\operatorname{Cov}(X, Y)}{\sigma_X\,\sigma_Y}, \qquad -1 \leq \rho_{XY} \leq 1.
$$

Here $\rho$ is "rho". The bounds come from the **Cauchy–Schwarz inequality**, $|\mathbb{E}[UV]| \leq \sqrt{\mathbb{E}[U^2]\,\mathbb{E}[V^2]}$, applied to the centred variables $U = X - \mu_X$ and $V = Y - \mu_Y$. The extremes $\rho = \pm 1$ happen exactly when $Y$ is an exact straight-line function of $X$. Variables with $\rho = 0$ are called **uncorrelated**. The **[[scatter plots|scatter-pictures]]** in the note show what different values look like.

### The variance of a sum

Covariance is what makes the variance of a sum interesting. Expand $\mathbb{E}\big[\big((X - \mu_X) + (Y - \mu_Y)\big)^2\big]$ into its three pieces:

$$
\operatorname{Var}(X + Y) = \operatorname{Var}(X) + \operatorname{Var}(Y) + 2\operatorname{Cov}(X, Y).
$$

Only when the covariance is zero do variances add on their own, with nothing extra. The next lessons stretch this to vectors, where the covariances of every pair are collected into a matrix, and to sums of many variables.

::: example Averaging two correlated accelerometers
Two accelerometers on the same bracket each have a bias with standard deviation $\sigma = 50\,\mu\mathrm{g}$ (a $\mu\mathrm{g}$, "micro-g", is a millionth of Earth's gravity). Because they share the same heat, their biases are correlated with $\rho = 0.8$, so $\operatorname{Cov}(B_1, B_2) = \rho\sigma^2 = 0.8 \times 2500 = 2000\,\mu\mathrm{g}^2$.

**The average** $B = (B_1 + B_2)/2$. Scaling by $\frac{1}{2}$ multiplies the variance by $\frac{1}{4}$, and the sum rule gives the inside:

$$
\operatorname{Var}(B) = \tfrac{1}{4}\big(\sigma^2 + \sigma^2 + 2\rho\sigma^2\big) = \tfrac{1}{4}\,(2500 + 2500 + 4000) = 2250\,\mu\mathrm{g}^2,
$$

so $\sigma_B = \sqrt{2250} = 47.4\,\mu\mathrm{g}$. Had the biases been independent, the average would have $\sigma_B = 50/\sqrt{2} = 35.4\,\mu\mathrm{g}$. The correlation has removed most of the benefit of averaging: two sensors that err together are not much better than one.

**The difference** $B_1 - B_2$ has variance $\sigma^2 + \sigma^2 - 2\rho\sigma^2 = 2\sigma^2(1 - \rho) = 5000 \times 0.2 = 1000\,\mu\mathrm{g}^2$, so $\sigma = 31.6\,\mu\mathrm{g}$ — smaller than either sensor alone, because the shared part cancels. Correlation hurts averaging and helps differencing.
:::

::: warning Add variances, not sigmas
The variance of a sum is not the sum of the variances unless the terms are uncorrelated. And the standard deviation of a sum is never the sum of the standard deviations unless the terms are perfectly correlated. Adding sigmas straight, which some datasheet-driven **[[error budgets|error-budget]]** do, overstates the error of independent contributions and understates it when a common cause is present. Add variances, then take the square root — and include the covariance terms when you know they are there.
:::

## Estimating moments from data

Everything so far assumed you knew the distribution. In practice you have $N$ numbers $x_1, \ldots, x_N$ from a bench test or a simulation, and want to estimate $\mu$ and $\sigma^2$ from them. It is like tasting soup: one spoonful tells you about the whole pot, but not perfectly.

The **sample mean** and **sample variance** are

$$
\bar{x} = \frac{1}{N}\sum_{i=1}^{N} x_i, \qquad s^2 = \frac{1}{N - 1}\sum_{i=1}^{N} (x_i - \bar{x})^2.
$$

Read $\bar{x}$ as "x bar". Now treat the $x_i$ as independent random variables that all share the same distribution. The sample mean is then itself a random variable — a different batch would give a different $\bar{x}$ — with

$$
\mathbb{E}[\bar{x}] = \mu, \qquad \operatorname{Var}(\bar{x}) = \frac{\sigma^2}{N}, \qquad \sigma_{\bar{x}} = \frac{\sigma}{\sqrt{N}}.
$$

The first is linearity. For the second: variances of independent variables add, so the sum of $N$ terms has variance $N\sigma^2$; dividing by $N$ divides the variance by $N^2$, leaving $\sigma^2/N$.

The quantity $\sigma/\sqrt{N}$ is the **standard error** of the mean. Averaging $100$ samples cuts the uncertainty by a factor of $10$, not $100$. This square-root law returns in the Monte Carlo lesson as the basic limit on how accurate a simulation campaign can be.

### Why divide by $N - 1$?

The $N - 1$ in $s^2$ is **[[Bessel's correction|bessel]]**, and it is not a matter of taste. The deviations are measured from $\bar{x}$, which was worked out from the same data, so it sits closer to the samples than the true $\mu$ does. That makes the squared deviations a little too small on average. One "degree of freedom" has been used up estimating the mean, and dividing by $N - 1$ instead of $N$ exactly makes up for it: $\mathbb{E}[s^2] = \sigma^2$. An estimator whose average is the true value is called **unbiased**.

::: note Why it has to be true
Write each deviation as $x_i - \bar{x} = (x_i - \mu) - (\bar{x} - \mu)$ and add up the squares. Because $\sum_i (x_i - \mu) = N(\bar{x} - \mu)$, the cross terms combine and

$$
\sum_{i=1}^{N} (x_i - \bar{x})^2 = \sum_{i=1}^{N} (x_i - \mu)^2 - N(\bar{x} - \mu)^2.
$$

Take expectations. Each $(x_i - \mu)^2$ averages $\sigma^2$, so the first sum averages $N\sigma^2$. The last term averages $N \cdot \operatorname{Var}(\bar{x}) = N \cdot \sigma^2/N = \sigma^2$. The total averages $N\sigma^2 - \sigma^2 = (N - 1)\sigma^2$, so dividing by $N - 1$ gives exactly $\sigma^2$ on average.
:::

::: example Sample statistics of a gyro bench test
Eight one-second averages of a stationary gyro's output, in $^\circ/\mathrm{h}$, are

$$
0.52,\ 0.75,\ 0.31,\ 0.70,\ 0.45,\ 0.45,\ 0.88,\ 0.53.
$$

**Mean.** They add to $4.59$, so $\bar{x} = 4.59/8 = 0.574\,^\circ/\mathrm{h}$. A gyro sitting still should read zero, so this is the estimate of its bias.

**Variance.** Subtract $0.574$ from each reading, square, and add: the squared deviations sum to $0.2458$. Divide by $N - 1 = 7$:

$$
s^2 = \frac{0.2458}{7} = 0.0351\,(^\circ/\mathrm{h})^2, \qquad s = \sqrt{0.0351} = 0.187\,^\circ/\mathrm{h}.
$$

Dividing by $N = 8$ instead would give $0.0307$ and $s = 0.175\,^\circ/\mathrm{h}$. That variance is $7/8$ of the unbiased one — $12.5\%$ smaller — and the standard deviation about $6.5\%$ smaller.

**How good is the bias estimate?** Its standard error is about $s/\sqrt{8} = 0.187/2.83 = 0.066\,^\circ/\mathrm{h}$. So the second decimal place of $0.574$ is not to be trusted. The confidence-interval lesson makes that statement precise.
:::

::: key Moments
$\mathbb{E}[aX + b] = a\mathbb{E}[X] + b$ and $\mathbb{E}[X + Y] = \mathbb{E}[X] + \mathbb{E}[Y]$ always; $\mathbb{E}[XY] = \mathbb{E}[X]\mathbb{E}[Y]$ needs independence. $\operatorname{Var}(X) = \mathbb{E}[(X - \mu)^2] = \mathbb{E}[X^2] - \mu^2$, $\operatorname{Var}(aX + b) = a^2\operatorname{Var}(X)$, and $\operatorname{Var}(X + Y) = \operatorname{Var}(X) + \operatorname{Var}(Y) + 2\operatorname{Cov}(X, Y)$. The sample mean of $N$ independent samples has standard error $\sigma/\sqrt{N}$, and the unbiased sample variance divides by $N - 1$.
:::

## Check yourself

::: check
The number of GNSS satellites in view during a flight segment is $6, 7, 8$ or $9$, with probabilities $0.1, 0.3, 0.4, 0.2$. Find the mean, the variance and the standard deviation.
:::

::: answer
Mean: $\mu = 6(0.1) + 7(0.3) + 8(0.4) + 9(0.2) = 0.6 + 2.1 + 3.2 + 1.8 = 7.7$.

Mean of the square: $\mathbb{E}[X^2] = 36(0.1) + 49(0.3) + 64(0.4) + 81(0.2) = 3.6 + 14.7 + 25.6 + 16.2 = 60.1$.

So $\operatorname{Var}(X) = 60.1 - 7.7^2 = 60.1 - 59.29 = 0.81$ and $\sigma = \sqrt{0.81} = 0.9$. The mean $7.7$ is not a possible count, which is normal for an expectation.
:::

::: check
A barometric altimeter reports altitude in counts, with noise of standard deviation $2$ counts, and the scale factor is $0.25\,\mathrm{m}$ per count. What is the noise standard deviation in metres? If a constant offset of $40\,\mathrm{m}$ is subtracted from the output, what happens to it?
:::

::: answer
Altitude in metres is $Y = 0.25\,X$, so $\sigma_Y = 0.25 \times 2 = 0.5\,\mathrm{m}$, and $\operatorname{Var}(Y) = 0.25^2 \times 2^2 = 0.0625 \times 4 = 0.25\,\mathrm{m^2}$.

Subtracting a constant does nothing to the spread: $\operatorname{Var}(Y - 40) = \operatorname{Var}(Y)$, so $\sigma$ stays $0.5\,\mathrm{m}$. Only the mean moves.
:::

::: check
Without assuming any particular distribution, what is the largest possible chance that a measurement lands two or more standard deviations from its mean? Compare with the Gaussian value of $4.55\%$ and explain the gap.
:::

::: answer
Chebyshev with $k = 2$ gives $P(|X - \mu| \geq 2\sigma) \leq 1/2^2 = 25\%$.

The Gaussian's $4.55\%$ is more than five times smaller. Chebyshev must hold for *every* distribution with that variance, including extreme ones built to hit the bound: put probability $1/8$ at $\mu - 2\sigma$, $1/8$ at $\mu + 2\sigma$ and the remaining $3/4$ exactly at $\mu$. Its variance is $\frac{1}{8}(2\sigma)^2 + \frac{1}{8}(2\sigma)^2 = \sigma^2$, and it lands $2\sigma$ out with chance exactly $1/4$. The Gaussian is far better behaved than that worst case, and assuming it lets you make much stronger statements about the tails — provided the assumption is justified.
:::

::: check
Give an example of two random variables that are uncorrelated but not independent, and say what feature of covariance allows this.
:::

::: answer
Let $X$ be uniform on $[-1, 1]$ and $Y = X^2$. Then

$$
\operatorname{Cov}(X, Y) = \mathbb{E}[X^3] - \mathbb{E}[X]\,\mathbb{E}[X^2] = 0 - 0 \times \tfrac{1}{3} = 0,
$$

since the odd powers of a variable that is symmetric about zero average to zero. Yet knowing $X$ fixes $Y$ exactly, so they are as dependent as two variables can be. Covariance measures only the straight-line part of a relationship; a U-shaped (quadratic) dependence is invisible to it.
:::

::: check
An accelerometer's white noise has a standard deviation of $200\,\mu\mathrm{g}$ per sample. How many independent samples must be averaged to estimate its bias with a standard error of $1\,\mu\mathrm{g}$? With $1000$ samples, what standard error do you get?
:::

::: answer
The standard error is $\sigma/\sqrt{N}$. Set it to $1$ and solve: $\sqrt{N} = 200/1$, so $N = 200^2 = 40\,000$ samples.

With $N = 1000$, the standard error is $200/\sqrt{1000} = 200/31.6 = 6.32\,\mu\mathrm{g}$.

Improving the estimate ten times costs a hundred times the samples. And if the samples are correlated in time, as real accelerometer noise is at high sample rates, you need even more, because the number of effectively independent samples is smaller than $N$.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\mathbb{E}[X] = \int x f_X\,dx$ | Expectation (mean $\mu$): the balance point of the distribution |
| $\mathbb{E}[g(X)] = \int g(x) f_X\,dx$ | Expectation of a function, no new distribution needed |
| $\mathbb{E}[X + Y] = \mathbb{E}[X] + \mathbb{E}[Y]$ | Linearity, with no independence required |
| $\mathbb{E}[\mathbf{1}_A] = P(A)$ | Every probability is the mean of an indicator |
| $\operatorname{Var}(X) = \mathbb{E}[(X-\mu)^2] = \mathbb{E}[X^2] - \mu^2$ | Variance; $\sigma = \sqrt{\operatorname{Var}}$ has the units of $X$ |
| $\operatorname{Var}(aX + b) = a^2 \operatorname{Var}(X)$ | Scaling squares, shifting does nothing |
| $\Delta^2/12$ | Variance of a uniform of width $\Delta$: quantisation noise |
| $\gamma_1$, $\kappa$ | Skewness and kurtosis; the Gaussian has $\kappa = 3$ |
| $P(\lvert X - \mu\rvert \geq k\sigma) \leq 1/k^2$ | Chebyshev's inequality, true for any distribution |
| $\operatorname{Cov}(X,Y) = \mathbb{E}[XY] - \mu_X \mu_Y$, $\rho = \operatorname{Cov}/(\sigma_X\sigma_Y)$ | Covariance and correlation coefficient, $\lvert\rho\rvert \leq 1$ |
| $\operatorname{Var}(X+Y) = \operatorname{Var} X + \operatorname{Var} Y + 2\operatorname{Cov}(X,Y)$ | Variance of a sum |
| $\bar{x}$, $s^2 = \frac{1}{N-1}\sum (x_i - \bar{x})^2$ | Sample mean (standard error $\sigma/\sqrt{N}$) and unbiased sample variance |

Next lesson: the distribution that turns these summaries into a complete description — the Gaussian, for which the mean and covariance are everything, and whose many-dimensional form is the object every navigation filter carries.

::: context balance-point The mean is where it balances
Here is the satellite-count distribution from the first Check-yourself question, drawn as weights on a plank. Bar heights are the probabilities $0.1, 0.3, 0.4, 0.2$. The plank balances at $7.7$, not at $7.5$ (the middle of the range), because more weight sits on the right.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="140" x2="330" y2="140" stroke="#1f2a44" stroke-width="3"/>
  <rect x="45" y="115" width="30" height="25" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="125" y="65" width="30" height="75" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="205" y="40" width="30" height="100" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="285" y="90" width="30" height="50" fill="#8fb8f0" stroke="#1f2a44"/>
  <polygon points="196,141 184,166 208,166" fill="#b4232c"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="108">0.1</text><text x="140" y="58">0.3</text><text x="220" y="33">0.4</text><text x="300" y="83">0.2</text>
    <text x="60" y="158">6</text><text x="140" y="158">7</text><text x="220" y="158">8</text><text x="300" y="158">9</text>
  </g>
  <text x="196" y="182" font-size="12" fill="#b4232c" text-anchor="middle">balance point μ = 7.7</text>
</svg>
```

Try it in your head: the moments about $7.7$ are $0.1 \times (-1.7) + 0.3 \times (-0.7) + 0.4 \times 0.3 + 0.2 \times 1.3 = -0.17 - 0.21 + 0.12 + 0.26 = 0$. Left and right turning effects cancel exactly.
:::

::: context unconscious-statistician A rule with a funny name
The rule $\mathbb{E}[g(X)] = \int g(x) f_X(x)\,dx$ is nicknamed the "law of the unconscious statistician". The joke is that people apply it without realising it is a theorem at all — it feels like the definition of expectation, but the definition is $\int y\,f_Y(y)\,dy$, which needs the density of $Y$.

It saves real work. To find the average kinetic energy $\frac{1}{2}mv^2$ of a noisy speed $v$, you do not need the distribution of the energy. Weight $\frac{1}{2}mv^2$ by the density of $v$ and integrate.
:::

::: context why-square Why square the distances?
Why not average the plain distances $|X - \mu|$ instead? You can — that is the **mean absolute deviation**, and it is a perfectly sensible measure of spread.

Squares win because of what they let you do. They have smooth derivatives, so they fit neatly into calculus and least squares. And above all, variances of independent quantities *add*: $\operatorname{Var}(X + Y) = \operatorname{Var} X + \operatorname{Var} Y$. Absolute deviations have no such rule. That one property is what lets a filter track uncertainty through thousands of steps with a few multiplications.
:::

::: context cancellation When a computer gets variance wrong
Take four readings: $1\,000\,000\,004$, $\ldots007$, $\ldots013$, $\ldots016$. The mean is $1\,000\,000\,010$, and the true variance (dividing by $4$) is $(36 + 9 + 9 + 36)/4 = 22.5$.

Now compute $\mathbb{E}[X^2] - \mu^2$ in ordinary double-precision arithmetic, which keeps about 16 significant digits. Both terms are about $10^{18}$, where the gap between neighbouring numbers the computer can store is $128$. NumPy gives $-128$: a *negative* variance, which is impossible. Subtracting from the mean first, $\mathbb{E}[(X - \mu)^2]$, gives the right $22.5$.

This is called catastrophic cancellation. Careful software subtracts the mean first, or uses a running method such as Welford's that never forms the two huge terms. The numerical methods module returns to cancellation in general.
:::

::: context heavy-tails Heavy tails in real sensors
A **heavy-tailed** distribution has more of its probability far from the centre than a Gaussian with the same $\sigma$. The word kurtosis comes from a Greek word for "curved" or "bulging".

Heavy tails show up whenever an error sometimes has a different cause from its usual one: a GNSS signal that bounces off a building before reaching the receiver, a star tracker that occasionally mistakes a planet for a star, a radar return from a bird. Filters defend themselves by rejecting measurements that are too far from the prediction — the chi-square tests of lesson 13 are one way to decide "too far".
:::

::: context chebyshev A guarantee with no assumptions
The inequality is named after the Russian mathematician Pafnuty Chebyshev, who published it in 1867; the French mathematician Irénée-Jules Bienaymé had stated it some years earlier, so it is sometimes called the Bienaymé–Chebyshev inequality.

The bars compare Chebyshev's worst-case limit with the true Gaussian chance of landing $k$ or more sigmas out.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="20" x2="40" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="34" y="24" font-size="11" fill="#1f2a44" text-anchor="end">100%</text>
  <text x="34" y="174" font-size="11" fill="#1f2a44" text-anchor="end">0</text>
  <rect x="70" y="20" width="32" height="150" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="104" y="122.4" width="32" height="47.6" fill="#1d6fd1" stroke="#1f2a44"/>
  <rect x="170" y="132.5" width="32" height="37.5" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="204" y="163.2" width="32" height="6.8" fill="#1d6fd1" stroke="#1f2a44"/>
  <rect x="270" y="153.3" width="32" height="16.7" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="304" y="169.6" width="32" height="0.4" fill="#1d6fd1" stroke="#1f2a44"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="120" y="116">31.7%</text><text x="186" y="126">25%</text><text x="220" y="157">4.55%</text>
    <text x="286" y="147">11.1%</text><text x="320" y="163">0.27%</text>
    <text x="103" y="186">k = 1</text><text x="203" y="186">k = 2</text><text x="303" y="186">k = 3</text>
  </g>
  <rect x="200" y="30" width="12" height="12" fill="#f2b880" stroke="#1f2a44"/>
  <text x="218" y="40" font-size="11" fill="#1f2a44">Chebyshev limit</text>
  <rect x="200" y="50" width="12" height="12" fill="#1d6fd1" stroke="#1f2a44"/>
  <text x="218" y="60" font-size="11" fill="#1f2a44">Gaussian</text>
</svg>
```

At $k = 1$ the limit is $100\%$, which says nothing at all; the bound only starts to bite past $k = 1$.
:::

::: context scatter-pictures What correlation looks like
Each panel has its sample correlation computed exactly. Left: $\rho = 0.8$, the cloud leans along a line. Middle: $\rho = 0$, no lean. Right: $Y = X^2$ — every point is fixed by its $X$, yet $\rho = 0$, because the left half slopes down and the right half slopes up and they cancel.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <g fill="none" stroke="#6c7a93" stroke-width="1">
    <rect x="10" y="25" width="100" height="100"/><rect x="130" y="25" width="100" height="100"/><rect x="250" y="25" width="100" height="100"/>
  </g>
  <g fill="#1d6fd1">
    <circle cx="92.7" cy="66.5" r="2.2"/><circle cx="66.5" cy="73.5" r="2.2"/><circle cx="52.5" cy="83.4" r="2.2"/><circle cx="27.3" cy="106.8" r="2.2"/><circle cx="45.9" cy="59.2" r="2.2"/><circle cx="63.4" cy="74.5" r="2.2"/><circle cx="55.3" cy="84.7" r="2.2"/><circle cx="42.8" cy="93.8" r="2.2"/><circle cx="67.6" cy="69.8" r="2.2"/><circle cx="75.2" cy="62.4" r="2.2"/><circle cx="60.2" cy="61.2" r="2.2"/><circle cx="68.6" cy="71.1" r="2.2"/><circle cx="56.9" cy="72.9" r="2.2"/><circle cx="91.0" cy="48.5" r="2.2"/><circle cx="55.9" cy="69.9" r="2.2"/><circle cx="45.5" cy="90.5" r="2.2"/><circle cx="74.0" cy="56.8" r="2.2"/><circle cx="61.3" cy="67.8" r="2.2"/><circle cx="14.3" cy="108.0" r="2.2"/><circle cx="44.4" cy="103.4" r="2.2"/><circle cx="64.3" cy="64.8" r="2.2"/><circle cx="52.6" cy="90.7" r="2.2"/><circle cx="60.2" cy="74.9" r="2.2"/><circle cx="82.4" cy="47.6" r="2.2"/><circle cx="62.9" cy="62.5" r="2.2"/><circle cx="56.5" cy="85.8" r="2.2"/><circle cx="69.2" cy="61.2" r="2.2"/><circle cx="56.3" cy="84.7" r="2.2"/><circle cx="63.5" cy="92.8" r="2.2"/><circle cx="70.9" cy="60.4" r="2.2"/>
    <circle cx="159.0" cy="72.7" r="2.2"/><circle cx="168.4" cy="62.7" r="2.2"/><circle cx="153.6" cy="87.4" r="2.2"/><circle cx="191.7" cy="58.5" r="2.2"/><circle cx="151.8" cy="80.8" r="2.2"/><circle cx="186.4" cy="85.4" r="2.2"/><circle cx="203.9" cy="95.9" r="2.2"/><circle cx="186.7" cy="92.3" r="2.2"/><circle cx="201.3" cy="77.6" r="2.2"/><circle cx="176.6" cy="101.8" r="2.2"/><circle cx="205.2" cy="65.9" r="2.2"/><circle cx="192.3" cy="58.8" r="2.2"/><circle cx="186.7" cy="85.9" r="2.2"/><circle cx="170.7" cy="87.1" r="2.2"/><circle cx="200.8" cy="99.9" r="2.2"/><circle cx="173.5" cy="79.9" r="2.2"/><circle cx="184.9" cy="66.9" r="2.2"/><circle cx="164.5" cy="101.0" r="2.2"/><circle cx="181.7" cy="56.7" r="2.2"/><circle cx="192.3" cy="73.1" r="2.2"/><circle cx="177.4" cy="70.7" r="2.2"/><circle cx="178.4" cy="62.6" r="2.2"/><circle cx="170.8" cy="72.6" r="2.2"/><circle cx="180.3" cy="67.0" r="2.2"/><circle cx="184.9" cy="36.3" r="2.2"/><circle cx="202.6" cy="54.1" r="2.2"/><circle cx="153.5" cy="78.5" r="2.2"/><circle cx="173.4" cy="66.6" r="2.2"/><circle cx="150.2" cy="54.7" r="2.2"/><circle cx="196.6" cy="97.0" r="2.2"/>
    <circle cx="255.0" cy="35.0" r="2.2"/><circle cx="259.5" cy="50.2" r="2.2"/><circle cx="264.0" cy="63.8" r="2.2"/><circle cx="268.5" cy="75.8" r="2.2"/><circle cx="273.0" cy="86.2" r="2.2"/><circle cx="277.5" cy="95.0" r="2.2"/><circle cx="282.0" cy="102.2" r="2.2"/><circle cx="286.5" cy="107.8" r="2.2"/><circle cx="291.0" cy="111.8" r="2.2"/><circle cx="295.5" cy="114.2" r="2.2"/><circle cx="300.0" cy="115.0" r="2.2"/><circle cx="304.5" cy="114.2" r="2.2"/><circle cx="309.0" cy="111.8" r="2.2"/><circle cx="313.5" cy="107.8" r="2.2"/><circle cx="318.0" cy="102.2" r="2.2"/><circle cx="322.5" cy="95.0" r="2.2"/><circle cx="327.0" cy="86.2" r="2.2"/><circle cx="331.5" cy="75.8" r="2.2"/><circle cx="336.0" cy="63.8" r="2.2"/><circle cx="340.5" cy="50.2" r="2.2"/><circle cx="345.0" cy="35.0" r="2.2"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="145">ρ = 0.8</text><text x="180" y="145">ρ = 0</text><text x="300" y="145">Y = X², ρ = 0</text>
  </g>
</svg>
```

Correlation measures lean, not connection.
:::

::: context error-budget How error budgets are built
An **error budget** is a table listing every source of error in a system — sensor noise, misalignment, timing, rounding — with the size each contributes, and a total at the bottom.

When the sources are independent, the total is the **root-sum-square** (RSS): square each standard deviation, add, take the square root. Three independent errors of $3$, $4$ and $12\,\mathrm{m}$ give $\sqrt{9 + 16 + 144} = 13\,\mathrm{m}$, not $19\,\mathrm{m}$. Engineers keep straight addition for errors that truly share one cause, such as two readings taken with the same miscalibrated instrument.
:::

::: context bessel Named after an astronomer
The $N - 1$ is named after Friedrich Bessel, the German astronomer who, in 1838, made the first reliable measurement of the distance to a star other than the Sun. Astronomers of his time lived and died by careful error analysis, because their measurements were tiny angles buried in noise.

A handy way to remember why: with a single sample, $N = 1$, the sample is its own mean and every deviation is zero. Dividing by $N - 1 = 0$ correctly refuses to give any estimate of spread from one number.
:::
