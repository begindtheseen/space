---
id: l06-sums-and-central-limit-theorem
title: Sums of random variables and the central limit theorem
minutes: 24
covers:
  - sums of random variables and the central limit theorem
---

An error budget is a sum. The touchdown error of a lander is the sum of a navigation error, a guidance error, a control error and a terrain-knowledge error. The output of an accelerometer over one second is the sum of two hundred individual samples. A Monte Carlo estimate of a probability is the sum of a few thousand ones and zeros divided by the number of runs. Whenever you add random quantities, two questions arise: what are the mean and variance of the total, and what shape does its distribution take?

The first question was answered in the expectation lesson, and this lesson restates the answer in the form used for budgets. The second has an answer that is one of the most remarkable facts in mathematics. If you add enough independent contributions, none of which dominates, the sum is approximately Gaussian regardless of what the individual contributions looked like. That is the central limit theorem, and it is why the Gaussian is defensible as a model for sensor noise, navigation error and almost everything else in this curriculum. This lesson states it, sketches why it is true, and then spends a deliberate amount of time on its limits, because the places where it fails, the far tails, are exactly the places where a miss-distance requirement or a structural load requirement lives.

## Mean and variance of a sum

For any random variables $X_1, \ldots, X_N$, whatever their dependence,

$$
\mathbb{E}\Big[\sum_{i=1}^{N} X_i\Big] = \sum_{i=1}^{N}\mathbb{E}[X_i], \qquad
\operatorname{Var}\Big(\sum_{i=1}^{N} X_i\Big) = \sum_{i=1}^{N}\operatorname{Var}(X_i) + 2\sum_{i<j}\operatorname{Cov}(X_i, X_j).
$$

The first is linearity of expectation. The second follows from expanding $\mathbb{E}[(\sum_i (X_i - \mu_i))^2]$ into $N$ squared terms and $N(N-1)$ cross terms, each pair of cross terms contributing $2\operatorname{Cov}(X_i, X_j)$. In vector form, from the previous lesson, $\operatorname{Cov}(\mathbf{x} + \mathbf{y}) = \mathbf{P}_x + \mathbf{P}_y + \mathbf{P}_{xy} + \mathbf{P}_{yx}$, where $\mathbf{P}_{xy} = \mathbb{E}[(\mathbf{x} - \boldsymbol{\mu}_x)(\mathbf{y} - \boldsymbol{\mu}_y)^{\mathsf{T}}]$ is the cross-covariance.

When the terms are **uncorrelated**, the cross terms vanish and variances add. Standard deviations then combine as the square root of the sum of squares, the **root-sum-square** or RSS:

$$
\sigma_{\text{total}} = \sqrt{\sigma_1^2 + \sigma_2^2 + \cdots + \sigma_N^2}.
$$

This is how independent error contributions are budgeted. Two consequences deserve attention. A contribution that is small compared with the largest one barely matters: adding $\sigma_2 = 1$ to $\sigma_1 = 5$ gives $\sqrt{26} = 5.10$, a $2\%$ increase. And the total is always less than the linear sum of the sigmas, often much less, because independent errors partly cancel. If the errors share a common cause the covariance terms come back, positive correlation pushes the total toward the linear sum, and negative correlation pushes it below the RSS. The expectation lesson's correlated accelerometers were an instance of the first.

::: example A touchdown error budget
A lander's cross-range touchdown error has three independent contributors: navigation, $\sigma = 12\,\mathrm{m}$; guidance dispersion, $\sigma = 5\,\mathrm{m}$; and terrain-map registration, $\sigma = 9\,\mathrm{m}$. The RSS total is

$$
\sigma_{\text{total}} = \sqrt{12^2 + 5^2 + 9^2} = \sqrt{144 + 25 + 81} = \sqrt{250} = 15.8\,\mathrm{m}.
$$

Adding the sigmas linearly would have given $26\,\mathrm{m}$, an overstatement of $64\%$ that could drive an unnecessary redesign. Removing the guidance term entirely would reduce the total only to $\sqrt{225} = 15.0\,\mathrm{m}$, so effort spent there is nearly wasted; halving the navigation term to $6\,\mathrm{m}$ brings the total to $\sqrt{36 + 25 + 81} = 11.9\,\mathrm{m}$. Budgets combined by RSS tell you where to spend engineering effort: on the largest term, almost exclusively.
:::

::: warning
RSS is a statement about variances of *uncorrelated* contributions. It says nothing about the shape of the total distribution, and it is wrong whenever contributions share a cause. Two error terms that both scale with the same misaligned mounting angle are not independent, and their sigmas add nearly linearly. Ask, for every pair in a budget, whether a single physical cause could move both.
:::

## The distribution of a sum: convolution

Mean and variance do not settle the shape. For two independent continuous variables $X$ and $Y$ with densities $f_X$ and $f_Y$, the density of $S = X + Y$ comes from the law of total probability: the event $S = s$ occurs when $X = x$ and $Y = s - x$ for some $x$, so

$$
f_S(s) = \int_{-\infty}^{\infty} f_X(x)\,f_Y(s - x)\,dx,
$$

the **convolution** of the two densities, written $f_S = f_X * f_Y$. Independence is what allows the joint density to be written as the product $f_X(x)f_Y(s - x)$. For discrete variables the integral becomes a sum over the possible values of $X$.

Watch the shape change. Two independent variables uniform on $[0, 1]$ each have a flat density, but their sum has the triangular density $f_S(s) = s$ for $0 \leq s \leq 1$ and $2 - s$ for $1 \leq s \leq 2$: the integral of a box against a shifted box is the length of their overlap. Add a third uniform and the convolution of the triangle with a box is piecewise quadratic, already rounded at the top and curved at the shoulders. Each convolution smooths the density further, and by twelve terms it is, to the eye, a bell. This progression is the central limit theorem in action, and the sum of $n$ uniforms has a name, the Irwin–Hall distribution, whose CDF can be written in closed form and will be used below to test how good the bell really is.

## Sums of Gaussians are Gaussian

For one family the convolution never changes the shape at all. The cleanest way to see it uses the **moment generating function** (MGF), $M_X(t) = \mathbb{E}[e^{tX}]$. For $X \sim \mathcal{N}(\mu, \sigma^2)$, substitute $x = \mu + \sigma z$ and complete the square in the exponent:

$$
M_X(t) = \int e^{tx}\,\frac{e^{-(x-\mu)^2/2\sigma^2}}{\sigma\sqrt{2\pi}}\,dx
= e^{t\mu}\int e^{t\sigma z}\,\phi(z)\,dz
= e^{t\mu}\int \frac{e^{-(z - t\sigma)^2/2}}{\sqrt{2\pi}}\,e^{t^2\sigma^2/2}\,dz
= \exp\!\Big(\mu t + \tfrac{1}{2}\sigma^2 t^2\Big).
$$

The step before last used $t\sigma z - z^2/2 = -(z - t\sigma)^2/2 + t^2\sigma^2/2$, and the remaining integral is a shifted standard normal density integrating to one. Now the key property of the MGF: for independent $X$ and $Y$, $M_{X+Y}(t) = \mathbb{E}[e^{tX}e^{tY}] = M_X(t)M_Y(t)$, because the expectation of a product of independent variables factorises. Multiplying two Gaussian MGFs adds the exponents, giving $\exp((\mu_X + \mu_Y)t + \tfrac{1}{2}(\sigma_X^2 + \sigma_Y^2)t^2)$, which is the MGF of $\mathcal{N}(\mu_X + \mu_Y, \sigma_X^2 + \sigma_Y^2)$. Since the MGF determines the distribution, the sum is Gaussian.

::: key
The sum of independent Gaussians is Gaussian, with means and variances added: $\mathcal{N}(\mu_1, \sigma_1^2) + \mathcal{N}(\mu_2, \sigma_2^2) = \mathcal{N}(\mu_1 + \mu_2, \sigma_1^2 + \sigma_2^2)$. A $3\,\mathrm{m}$ and a $4\,\mathrm{m}$ independent Gaussian error sum to a $5\,\mathrm{m}$ Gaussian error. Combined with the previous lesson, this means any linear filter fed Gaussian inputs stays Gaussian forever.
:::

## The law of large numbers

Let $X_1, \ldots, X_N$ be independent with the same distribution, mean $\mu$ and variance $\sigma^2$ (**i.i.d.**, independent and identically distributed), and let $\bar{X}_N = \tfrac{1}{N}\sum_i X_i$ be their sample mean. From the sum rules, $\mathbb{E}[\bar{X}_N] = \mu$ and $\operatorname{Var}(\bar{X}_N) = \sigma^2/N$. Chebyshev's inequality from the expectation lesson then gives, for any $\varepsilon > 0$,

$$
P\big(|\bar{X}_N - \mu| \geq \varepsilon\big) \leq \frac{\sigma^2}{N\varepsilon^2} \to 0 \quad\text{as } N \to \infty.
$$

This is the **weak law of large numbers**: the sample mean converges in probability to the true mean. It is the justification for every Monte Carlo estimate and for calibrating a bias by averaging. It says nothing about the shape of the fluctuations, and Chebyshev's bound is loose: to be $99\%$ sure that $\bar{X}_N$ is within $0.1\sigma$ of $\mu$, Chebyshev demands $N \geq 1/(0.01 \times 0.01) = 10\,000$, whereas if the fluctuations are Gaussian the requirement is $0.1\sqrt{N} \geq 2.576$, that is $N \geq 664$. Knowing the shape is worth a factor of fifteen in sample count, which is why the next theorem matters.

## The central limit theorem

> **Central limit theorem.** Let $X_1, X_2, \ldots$ be i.i.d. with mean $\mu$ and finite variance $\sigma^2$, and let $S_N = \sum_{i=1}^{N} X_i$. Then the standardised sum
> $$
> Z_N = \frac{S_N - N\mu}{\sigma\sqrt{N}}
> $$
> converges in distribution to $\mathcal{N}(0, 1)$: for every $z$, $P(Z_N \leq z) \to \Phi(z)$ as $N \to \infty$.

Equivalently, for large $N$, $S_N$ is approximately $\mathcal{N}(N\mu, N\sigma^2)$ and $\bar{X}_N$ is approximately $\mathcal{N}(\mu, \sigma^2/N)$. The individual $X_i$ can be uniform, exponential, Bernoulli, anything with a finite variance; the Gaussian emerges from the act of adding.

Here is why, in the language of MGFs. Write $Y_i = (X_i - \mu)/\sigma$, so each $Y_i$ has mean $0$ and variance $1$, and $Z_N = \tfrac{1}{\sqrt{N}}\sum_i Y_i$. By independence, $M_{Z_N}(t) = \big[M_Y(t/\sqrt{N})\big]^N$. Expand $M_Y$ in a Taylor series about zero: $M_Y(s) = \mathbb{E}[e^{sY}] = 1 + s\,\mathbb{E}[Y] + \tfrac{1}{2}s^2\,\mathbb{E}[Y^2] + O(s^3) = 1 + \tfrac{1}{2}s^2 + O(s^3)$, the linear term vanishing because $\mathbb{E}[Y] = 0$. With $s = t/\sqrt{N}$,

$$
\log M_{Z_N}(t) = N\log\!\Big(1 + \frac{t^2}{2N} + O(N^{-3/2})\Big) = N\Big(\frac{t^2}{2N} + O(N^{-3/2})\Big) \to \frac{t^2}{2},
$$

and $e^{t^2/2}$ is the MGF of the standard normal. Every detail of the original distribution beyond its mean and variance sits in the $O(N^{-3/2})$ term, and $N$ copies of it still vanish as $N$ grows. That is the whole mechanism: the third and higher moments are suppressed by powers of $1/\sqrt{N}$. (A fully rigorous proof uses characteristic functions, $\mathbb{E}[e^{itX}]$, which exist even when the MGF does not; the algebra is identical.)

::: key
The central limit theorem: the normalised sum $(S_N - N\mu)/(\sigma\sqrt{N})$ of $N$ i.i.d. random variables with finite variance converges to $\mathcal{N}(0, 1)$. The caveat for GNC: convergence is fastest in the centre of the distribution and slowest in the far tails, so the theorem says nothing useful about the $10^{-4}$-probability events where miss-distance and load requirements live.
:::

## How fast, and where, does it converge?

The expansion above shows the leading correction. The skewness of the standardised sum is $\gamma_1/\sqrt{N}$, where $\gamma_1$ is the skewness of a single term, and the excess kurtosis is $(\kappa - 3)/N$. Asymmetry dies off as $1/\sqrt{N}$, tail weight as $1/N$. For exponential terms, whose skewness is $2$, a sum of $N = 100$ still has skewness $0.2$, plainly visible in a histogram. The Berry–Esseen theorem makes the worst-case error explicit: $\sup_z |P(Z_N \leq z) - \Phi(z)| \leq 0.4748\,\rho/(\sigma^3\sqrt{N})$, where $\rho = \mathbb{E}|X - \mu|^3$. It guarantees $1/\sqrt{N}$ convergence of the CDF but is a bound on the *absolute* error, which is dominated by the centre. For a sum of twelve uniforms it allows an error of $0.178$, hopelessly loose against the actual error of a few thousandths near the mean.

The far tails are another matter, and the honest way to see it is to compute an exact case.

::: example Twelve uniforms against the Gaussian
Let $S$ be the sum of twelve independent $U(0, 1)$ variables. Each has mean $\tfrac{1}{2}$ and variance $\tfrac{1}{12}$, so $S$ has mean $6$ and variance exactly $1$: it is its own standardised form. The Irwin–Hall CDF gives exact tail probabilities, which can be set against the Gaussian's:

| Threshold | $P(S - 6 > k)$ exact | $1 - \Phi(k)$ | Ratio |
| --- | --- | --- | --- |
| $k = 1$ | $0.1607$ | $0.1587$ | $1.01$ |
| $k = 2$ | $0.02228$ | $0.02275$ | $0.98$ |
| $k = 3$ | $1.007 \times 10^{-3}$ | $1.350 \times 10^{-3}$ | $0.75$ |
| $k = 4$ | $8.53 \times 10^{-6}$ | $3.17 \times 10^{-5}$ | $0.27$ |
| $k = 6$ | $0$ | $9.87 \times 10^{-10}$ | $0$ |

Within one sigma the agreement is better than $1\%$, and $P(|S - 6| \leq 1) = 0.6785$ against the Gaussian $0.6827$. At three sigma the Gaussian overstates the tail by a third. At four sigma it is wrong by a factor of nearly four. And beyond six sigma the true probability is exactly zero, because twelve numbers in $[0, 1]$ cannot sum to more than $12$, while the Gaussian still promises about one event per billion. The old trick of generating "Gaussian" samples by summing twelve uniforms is exactly this distribution, and it is why that trick must never be used in a tail study: it can never produce the events you are looking for.
:::

The lesson of the table is general. The relative error of a Gaussian tail approximation grows without bound as you move outward, even as the absolute error shrinks. A sum of bounded terms has a hard limit the Gaussian does not know about; a sum of heavy-tailed terms, such as exponentials, has far more probability in the tail than the Gaussian predicts.

::: example Ten exponential outages
A star tracker loses lock at random, and each outage lasts an exponentially distributed time with mean $1\,\mathrm{min}$, so $\sigma = 1\,\mathrm{min}$. The total duration of ten independent outages has mean $10\,\mathrm{min}$ and standard deviation $\sqrt{10} = 3.16\,\mathrm{min}$. A mission rule says the vehicle can tolerate a total of $10 + 3 \times 3.16 = 19.5\,\mathrm{min}$ without star fixes, and a colleague argues, from the central limit theorem, that this "$3\sigma$" limit is exceeded with probability $0.135\%$.

The exact distribution of a sum of $N$ independent exponentials with rate $\lambda$ is the Erlang (Gamma) distribution, whose tail is $P(S > s) = e^{-\lambda s}\sum_{k=0}^{N-1}(\lambda s)^k/k!$. At $s = 19.5$, $N = 10$, $\lambda = 1$ this evaluates to $0.00672$: five times the Gaussian figure, because the sum of ten strongly right-skewed terms (skewness $2/\sqrt{10} = 0.63$) still has a long right tail. With a hundred outages the same "$3\sigma$" exceedance probability is $0.00275$, twice the Gaussian value; the theorem is converging, but slowly, and in the tail.
:::

::: warning
Three conditions hide inside "i.i.d. with finite variance", and each fails somewhere in GNC. **Finite variance**: the ratio of two zero-mean Gaussians has the Cauchy distribution, whose variance is infinite, and the mean of $N$ Cauchy samples has exactly the same distribution as one of them; averaging does nothing. A bearing computed as $\operatorname{atan}$ of a noisy ratio near a singular geometry can behave this way. **Independence**: a common-cause error present in every term does not average away, and the sum stays as non-Gaussian as that common term is. **No dominant term**: the theorem extends to non-identical terms provided none of them controls the variance, but a budget in which one non-Gaussian term contributes $90\%$ of the variance has a total shaped like that term, however many small Gaussian terms are added.
:::

## Two uses you will meet immediately

**Counting events.** A binomial variable, the number $K$ of "successes" in $N$ independent trials of probability $p$, is a sum of $N$ Bernoulli variables, so for large $N$ it is approximately $\mathcal{N}(Np, Np(1 - p))$. In a Monte Carlo campaign of $N = 2000$ runs with a true failure probability $p = 0.01$, the expected count is $20$ with standard deviation $\sqrt{19.8} = 4.45$. The probability of seeing $30$ or more failures is exactly $0.0213$; the normal approximation with the usual half-unit continuity correction, $1 - \Phi((29.5 - 20)/4.45) = 0.0164$, is in the right neighbourhood but $23\%$ low, because the binomial is right-skewed at this $p$. Use it for orientation, and the exact binomial for the decision.

**Averaging measurements.** The gyro bench test in the expectation lesson gave $s = 0.187\,^\circ/\mathrm{h}$ per one-second sample. Averaging $N = 100$ such samples estimates the bias with standard error $0.187/\sqrt{100} = 0.0187\,^\circ/\mathrm{h}$, and by the central limit theorem that estimate is very nearly Gaussian even if the individual samples were not, which is what licenses the confidence intervals of a later lesson. Averaging $10\,000$ samples brings the standard error to $0.00187\,^\circ/\mathrm{h}$, assuming the samples are independent; a slowly wandering bias violates that assumption, and the random-process lessons that follow explain what happens then.

::: note
The central limit theorem is also the reason the Gaussian is the right *default* for sensor noise: an electronic noise source is the sum of a vast number of tiny independent thermal contributions. It is not a reason to assume Gaussianity for a quantity produced by a single nonlinear operation on a Gaussian, such as a range squared, a norm or a product. Those are transformed, not summed, and the previous lesson's Jacobian is the tool for them.
:::

One more sum will matter shortly. If $Z_1, \ldots, Z_k$ are independent standard normals, the sum of their *squares* is not Gaussian; each $Z_i^2$ has mean $1$ and variance $2$, so the sum has mean $k$ and variance $2k$, and its exact distribution is the chi-square with $k$ degrees of freedom, which the Gaussian lesson invoked for ellipsoid containment and which closes this module. For large $k$ the central limit theorem applies to it too: $\chi^2_k \approx \mathcal{N}(k, 2k)$.

## Check yourself

::: check
Four independent error sources have standard deviations $2$, $3$, $6$ and $1\,\mathrm{cm}$. What is the RSS total, and by how much does removing the $1\,\mathrm{cm}$ source improve it?
:::

::: answer
$\sigma_{\text{total}} = \sqrt{4 + 9 + 36 + 1} = \sqrt{50} = 7.07\,\mathrm{cm}$. Without the $1\,\mathrm{cm}$ term, $\sqrt{49} = 7.00\,\mathrm{cm}$, an improvement of $0.07\,\mathrm{cm}$, or $1\%$. The $6\,\mathrm{cm}$ term accounts for $36/50 = 72\%$ of the variance and is the only one worth attacking.
:::

::: check
$X$ and $Y$ are independent, each uniform on $[0, 1]$. Using the convolution, find $P(X + Y > 1.5)$, then compare with the Gaussian approximation using the exact mean and variance of the sum.
:::

::: answer
The sum's density is triangular, equal to $2 - s$ on $[1, 2]$, so $P(S > 1.5) = \int_{1.5}^{2}(2 - s)\,ds = \tfrac{1}{2}(0.5)^2 = 0.125$. The sum has mean $1$ and variance $2/12 = 1/6$, so $\sigma = 0.408$ and $1.5$ is $1.22\sigma$ above the mean; the Gaussian gives $1 - \Phi(1.225) = 0.110$. With only two terms the approximation is already within $12\%$ at this moderate deviation, but at $s = 2$ the exact tail is zero while the Gaussian gives $1 - \Phi(2.45) = 0.0071$.
:::

::: check
Two independent GNSS position errors along one axis are $\mathcal{N}(0.5, 2^2)$ and $\mathcal{N}(-0.2, 1.5^2)$, in metres. What is the distribution of their difference, and the probability that the difference exceeds $5\,\mathrm{m}$?
:::

::: answer
The difference is Gaussian (a linear combination of independent Gaussians) with mean $0.5 - (-0.2) = 0.7\,\mathrm{m}$ and variance $4 + 2.25 = 6.25$, so $\sigma = 2.5\,\mathrm{m}$; subtracting adds variances just as adding does, because $\operatorname{Var}(-Y) = \operatorname{Var}(Y)$. Then $P(D > 5) = 1 - \Phi((5 - 0.7)/2.5) = 1 - \Phi(1.72) = 0.0427$, about $4\%$.
:::

::: check
A Monte Carlo estimate of the mean of a quantity with $\sigma = 40\,\mathrm{m}$ must have a standard error below $1\,\mathrm{m}$. How many independent runs are needed, and what does the central limit theorem add to the law of large numbers in this situation?
:::

::: answer
The standard error is $\sigma/\sqrt{N}$, so $40/\sqrt{N} \leq 1$ requires $N \geq 1600$ runs. The law of large numbers guarantees only that the estimate converges; the central limit theorem says the estimate is approximately $\mathcal{N}(\mu, 1\,\mathrm{m^2})$ at that $N$, so "the true mean lies within $\pm 1.96\,\mathrm{m}$ of the estimate" can be asserted with $95\%$ confidence, a statement Chebyshev alone could make only at $74\%$.
:::

::: check
A colleague proposes to verify a $10^{-6}$ failure probability by summing many independent error terms, invoking the central limit theorem to justify a Gaussian tail, and then reading $P(Z > 4.75)$ off a table. Give two distinct reasons this is unsafe.
:::

::: answer
First, the theorem controls the absolute error of the CDF, which is dominated by the centre; the *relative* error in the tail is unbounded, and the twelve-uniform example shows a factor-of-four error at $4\sigma$ with the true probability collapsing to zero not far beyond. A $10^{-6}$ event at $4.75\sigma$ is deep in the region where the approximation is uncontrolled. Second, the premises may fail: if one term dominates the variance or the terms share a common cause, the sum keeps the shape of that term, and if any term has heavy tails the true probability may be orders of magnitude larger than Gaussian. The defensible routes are an exact distribution where one exists, or a Monte Carlo or importance-sampling study of the tail itself.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\operatorname{Var}(\sum X_i) = \sum\operatorname{Var}(X_i) + 2\sum_{i<j}\operatorname{Cov}(X_i, X_j)$ | Variance of a sum, any dependence |
| $\sigma_{\text{total}} = \sqrt{\sum_i \sigma_i^2}$ | RSS: uncorrelated contributions only |
| $f_S = f_X * f_Y = \int f_X(x)f_Y(s - x)\,dx$ | Density of a sum of independent variables |
| $M_X(t) = \mathbb{E}[e^{tX}]$, $M_{X+Y} = M_X M_Y$ | Moment generating function; multiplies under independent sums |
| $M(t) = \exp(\mu t + \tfrac{1}{2}\sigma^2 t^2)$ | Gaussian MGF; Gaussian sums are Gaussian |
| $P(\lvert\bar{X}_N - \mu\rvert \geq \varepsilon) \leq \sigma^2/(N\varepsilon^2)$ | Weak law of large numbers, via Chebyshev |
| $Z_N = (S_N - N\mu)/(\sigma\sqrt{N}) \to \mathcal{N}(0, 1)$ | Central limit theorem |
| Skewness $\gamma_1/\sqrt{N}$, excess kurtosis $(\kappa - 3)/N$ | Rate at which shape corrections decay |
| $\sup_z\lvert F_N(z) - \Phi(z)\rvert \leq 0.4748\,\rho/(\sigma^3\sqrt{N})$ | Berry–Esseen: absolute CDF error, dominated by the centre |
| $K \sim \operatorname{Bin}(N, p) \approx \mathcal{N}(Np, Np(1-p))$ | Normal approximation to a count |
| $\sum_{i=1}^{k} Z_i^2 \sim \chi^2_k$, mean $k$, variance $2k$ | Sum of squared standard normals (chi-square) |

The next lesson moves from random variables to random *processes*, quantities that evolve in time, and introduces the autocorrelation and power spectral density that describe how a noise signal is spread across time and frequency, together with Brownian motion, the continuous-time limit of a sum of many small independent steps.
