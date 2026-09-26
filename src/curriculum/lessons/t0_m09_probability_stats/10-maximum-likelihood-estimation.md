---
id: l10-maximum-likelihood-estimation
title: Maximum likelihood estimation
minutes: 26
covers:
  - maximum likelihood estimation
---

A friend hands you a coin that might be a trick coin. You flip it ten times and get eight heads. Your best guess for its chance of heads? Most people say "about 0.8" without thinking. Behind that instinct is a real idea: of all the coins it *could* be, an 80% coin is the one that makes "eight heads out of ten" least surprising.

That idea is **maximum likelihood estimation** (MLE): pick the value of the unknown that makes the data you actually saw as probable as possible. So far this module handed you estimates as recipes — average for the mean, divide by $N - 1$ for the variance, weight sensors by inverse variance, read the correlation time off a plot. Maximum likelihood is the principle behind them. It also produces the weighted least-squares fit behind every sensor calibration and, one step further, the Kalman filter.

This lesson maximizes the likelihood for a Gaussian, measures how good any estimate can be (the Fisher information and the Cramér–Rao bound), and then solves two problems a GNC engineer meets constantly: calibrating a gyro on a rate table, and fitting the Gauss-Markov $\sigma$ and $T$ to a recorded bias, with an error bar.

## The likelihood: which setting best explains the data?

Start with a model. It says the data $x_1, \ldots, x_N$ came from a density $p(x \mid \theta)$ that depends on an unknown **parameter** $\theta$ ("theta") — a knob on the model, such as a mean or a noise level. Read $p(x \mid \theta)$ as "p of x given theta". If the samples are independent, the density of the whole data set is the product of the individual densities:

$$
L(\theta) = p(x_1, \ldots, x_N \mid \theta) = \prod_{i=1}^{N} p(x_i \mid \theta).
$$

The big $\prod$ ("product") is like $\sum$ but multiplies instead of adds.

Hold $\theta$ fixed and let the data vary, and this is an ordinary probability density. Hold the data fixed at what you observed and let $\theta$ vary, and it becomes the **[[likelihood function|likelihood-word]]** — a score for each setting of the knob: how probable your data would have been under that setting.

The likelihood is **not** a probability distribution over $\theta$. It does not add up to one over $\theta$, and it does not say how probable any $\theta$ is — only how probable the *data* would have been. The Bayes lesson met it as the sensor model evaluated at the measurement. Bayes multiplies it by a prior; maximum likelihood uses it alone.

> **Maximum likelihood estimate.** $\hat{\theta}_{\text{ML}} = \arg\max_\theta L(\theta)$: the parameter value that makes the observed data most probable.

Read $\hat{\theta}$ as "theta hat" — a hat always marks an estimate. Read $\arg\max_\theta$ as "the value of theta that maximizes": it returns the *location* of the peak, not the height.

A product of many small numbers is awkward to differentiate and rounds to zero on a computer. So work with the **[[log-likelihood|why-log]]** instead:

$$
\ell(\theta) = \ln L(\theta) = \sum_{i=1}^{N} \ln p(x_i \mid \theta).
$$

Because $\ln$ always increases with its input, the peak of $\ell$ sits at the same $\theta$ as the peak of $L$. At a smooth peak the slope is zero, so the estimate solves the **score equation**

$$
\frac{\partial \ell}{\partial \theta} = 0.
$$

The slope $\partial\ell/\partial\theta$ is called the **score**. The whole recipe is: write down $\ell$, differentiate, set to zero, solve.

## The Gaussian mean

Let each $x_i$ be drawn independently from $\mathcal{N}(\mu, \sigma^2)$, with the noise level $\sigma$ known and the mean $\mu$ unknown. Each factor of the likelihood is the Gaussian density

$$
p(x_i \mid \mu) = \frac{1}{\sigma\sqrt{2\pi}}\exp\!\left(-\frac{(x_i - \mu)^2}{2\sigma^2}\right).
$$

Take logs and add. The front constant appears $N$ times, and the log undoes the exponential:

$$
\ell(\mu) = -N\ln\big(\sigma\sqrt{2\pi}\big) - \frac{1}{2\sigma^2}\sum_{i=1}^{N}(x_i - \mu)^2.
$$

The first term cannot move the peak. The second is minus a sum of squares, so making $\ell$ large means making the squared deviations *small*: **for Gaussian data, maximum likelihood is least squares.**

Now differentiate. Each squared term $(x_i - \mu)^2$ has derivative $-2(x_i - \mu)$, and the $-2$ cancels the $-\tfrac{1}{2}$ in front:

$$
\frac{\partial\ell}{\partial\mu} = \frac{1}{\sigma^2}\sum_{i=1}^{N}(x_i - \mu) = 0 \quad\Longrightarrow\quad \sum_{i=1}^{N} x_i = N\mu \quad\Longrightarrow\quad \hat{\mu}_{\text{ML}} = \frac{1}{N}\sum_{i=1}^{N} x_i = \bar{x}.
$$

The sample mean is the maximum likelihood estimate, and $\sigma$ canceled out. What $\sigma$ controls is how *sharply peaked* the likelihood is. A sharp peak rules out nearby values firmly; a flat one means many values explain the data almost equally well. That sharpness is the precision of the estimate.

::: example How sharply does the data pin down a gyro bias?
The expectation lesson's eight one-second gyro averages, in $^\circ/\mathrm{h}$, were $0.52$, $0.75$, $0.31$, $0.70$, $0.45$, $0.45$, $0.88$, $0.53$, with $\bar{x} = 0.574$ and $s = 0.187$. Treat $\sigma = 0.187$ as known, so $\sigma^2 = 0.0350$.

How much lower is the log-likelihood at a nearby value $\mu = \bar{x} + \delta$ ("delta", a small shift)? Subtract the two sums of squares. Expanding $(x_i - \bar{x} - \delta)^2 = (x_i - \bar{x})^2 - 2\delta(x_i - \bar{x}) + \delta^2$, the middle terms add up to zero, because deviations from the mean always sum to zero. What is left is $N\delta^2$, so

$$
\ell(\bar{x}) - \ell(\bar{x} + \delta) = \frac{N\delta^2}{2\sigma^2}.
$$

**A shift of $0.1\,^\circ/\mathrm{h}$.** Put in $N = 8$, $\delta = 0.1$, $\sigma^2 = 0.0350$:

$$
\frac{8 \times 0.01}{2 \times 0.0350} = \frac{0.08}{0.0700} = 1.14.
$$

So the likelihood drops by a factor $e^{1.14} = 3.1$: the data are about three times more probable if the bias is $0.574$ than if it is $0.674$.

**One standard error.** A drop of $\tfrac{1}{2}$ in log-likelihood marks one **[[standard error|half-unit-drop]]** away from the peak. Set $N\delta^2/(2\sigma^2) = \tfrac{1}{2}$ and solve: $\delta^2 = \sigma^2/N$, so

$$
\delta = \frac{\sigma}{\sqrt{N}} = \frac{0.187}{\sqrt{8}} = \frac{0.187}{2.83} = 0.066\,^\circ/\mathrm{h}.
$$

That is exactly the standard error of the mean from the expectation lesson. Sanity check: $0.1$ is about one and a half standard errors, and $1.14$ is indeed more than $0.5$. The curvature of the log-likelihood *is* the precision of the estimate.
:::

## The Gaussian variance, and a small bias

Now let both $\mu$ and $v = \sigma^2$ be unknown:

$$
\ell(\mu, v) = -\frac{N}{2}\ln(2\pi) - \frac{N}{2}\ln v - \frac{1}{2v}\sum_{i=1}^{N}(x_i - \mu)^2.
$$

Set both slopes to zero. The $\mu$ slope is unchanged, so $\hat{\mu} = \bar{x}$. The $v$ slope uses $\frac{d}{dv}\ln v = \frac{1}{v}$ and $\frac{d}{dv}\frac{1}{v} = -\frac{1}{v^2}$:

$$
\frac{\partial\ell}{\partial v} = -\frac{N}{2v} + \frac{1}{2v^2}\sum_{i=1}^{N}(x_i - \mu)^2 = 0.
$$

Multiply by $2v^2$: $-Nv + \sum(x_i - \mu)^2 = 0$. Put in $\hat{\mu} = \bar{x}$ and solve:

$$
\hat{\sigma}^2_{\text{ML}} = \frac{1}{N}\sum_{i=1}^{N}(x_i - \bar{x})^2.
$$

This divides by $N$, not $N - 1$. The expectation lesson showed that on average $\sum(x_i - \bar{x})^2 = (N - 1)\sigma^2$, because $\bar{x}$ was computed from the same data and hugs the samples a little too closely. So on average

$$
\mathbb{E}\big[\hat{\sigma}^2_{\text{ML}}\big] = \frac{N-1}{N}\,\sigma^2.
$$

The maximum likelihood variance is **biased** low — its average sits below the truth. For the eight gyro samples the factor is $7/8$: the ML standard deviation is $0.175\,^\circ/\mathrm{h}$ against $s = 0.187\,^\circ/\mathrm{h}$. The bias fades as $N$ grows.

The lesson about the method: maximum likelihood finds the parameter under which *this* data set is most probable. That is a different goal from "an estimator whose average over many data sets equals the truth". The goals often agree, as for the mean. When they do not, a known bias can be corrected — Bessel's factor $N/(N-1)$ does exactly that. What maximum likelihood *does* promise comes next.

## How sharp is the peak? Fisher information and the Cramér–Rao bound

The gyro example suggested a rule: the more sharply curved the log-likelihood, the more tightly the data pin down the parameter. The **Fisher information** turns that into a definition:

$$
I(\theta) = \mathbb{E}\!\left[\Big(\frac{\partial\ell}{\partial\theta}\Big)^2\right] = -\,\mathbb{E}\!\left[\frac{\partial^2\ell}{\partial\theta^2}\right].
$$

Read $I(\theta)$ as "the information about theta". It is the average squared slope of the log-likelihood — or, equally, its average *curvature* (second derivative), with a minus sign so a sharp downward peak gives a large positive number.

For $N$ independent samples, $\ell$ is a sum of $N$ terms, so $I$ is $N$ times the information in one sample. **Information adds**: twice the data, twice the information.

For the Gaussian mean, $\partial^2\ell/\partial\mu^2 = -N/\sigma^2$, which does not depend on the data, so

$$
I(\mu) = \frac{N}{\sigma^2}.
$$

Its reciprocal, $\sigma^2/N$, is exactly the variance of the sample mean. That is not luck but the central result of estimation theory.

> **[[Cramér–Rao bound|cramer-rao-names]].** For any unbiased estimator $\hat{\theta}$ of $\theta$,
> $$
> \operatorname{Var}(\hat{\theta}) \geq \frac{1}{I(\theta)}.
> $$

No unbiased estimator, however clever, beats one over the Fisher information: the data hold only so much information. An estimator that reaches the bound is **efficient**; the sample mean is efficient for the Gaussian mean. So when a colleague proposes a new way to estimate a bias from the same data, ask first: how far is each method from $1/I$? If the current one already sits on the bound, nothing can beat it.

::: note Why the two forms of the Fisher information agree
One sample's density integrates to one for every $\theta$: $\int p\,dx = 1$. Differentiate by $\theta$:

$$
\int \frac{\partial p}{\partial\theta}\,dx = 0.
$$

Since $\frac{\partial \ln p}{\partial\theta} = \frac{1}{p}\frac{\partial p}{\partial\theta}$, this says $\int \frac{\partial \ln p}{\partial\theta}\, p\,dx = 0$: the score has average zero. Differentiate that once more, using the product rule on $\frac{\partial \ln p}{\partial\theta}\cdot p$:

$$
\int \frac{\partial^2 \ln p}{\partial\theta^2}\,p\,dx + \int \frac{\partial \ln p}{\partial\theta}\,\frac{\partial p}{\partial\theta}\,dx = 0.
$$

The second integral is $\int \big(\frac{\partial \ln p}{\partial\theta}\big)^2 p\,dx$. So the average curvature plus the average squared slope is zero, which is the statement $\mathbb{E}[(\partial\ell/\partial\theta)^2] = -\mathbb{E}[\partial^2\ell/\partial\theta^2]$.
:::

### Three promises of maximum likelihood

Three properties make maximum likelihood the default. The first two hold as $N$ grows, under mild smoothness conditions.

- **Consistent.** The ML estimate homes in on the true $\theta$ as $N \to \infty$.
- **Asymptotically normal and efficient.** For large $N$, $\hat{\theta}_{\text{ML}}$ is approximately $\mathcal{N}\big(\theta, 1/I(\theta)\big)$ — a Gaussian centered on the truth whose variance sits right on the Cramér–Rao bound.
- **Invariant.** If $\hat{\theta}$ is the MLE of $\theta$, then $g(\hat{\theta})$ is the MLE of $g(\theta)$ for any one-to-one function $g$. Squash or stretch the axis, and the peak stays at the same place.

Engineers use the last one constantly. Estimate $\phi = e^{-\Delta t/T}$ by maximum likelihood, and $\hat{T} = -\Delta t/\ln\hat{\phi}$ is automatically the MLE of the correlation time $T$. Estimate a variance, and its square root is the MLE of the standard deviation.

::: key
The maximum likelihood estimate maximizes $\ell(\theta) = \sum_i \ln p(x_i \mid \theta)$, the log-probability of the observed data. For Gaussian data it is least squares: $\hat{\mu} = \bar{x}$ and $\hat{\sigma}^2 = \frac{1}{N}\sum(x_i - \bar{x})^2$ (biased by $(N-1)/N$). The Fisher information $I(\theta) = -\mathbb{E}[\partial^2\ell/\partial\theta^2]$ bounds every unbiased estimator by $\operatorname{Var}(\hat{\theta}) \geq 1/I(\theta)$ (Cramér–Rao), and the MLE attains this bound asymptotically.
:::

## Weighted least squares: maximum likelihood for a linear model

Now the problem that leads to the Kalman filter. Several instruments each see a mix of the same few unknowns, each with its own noise. Write the $n$ unknowns as a vector $\mathbf{x}$ and the $m \geq n$ measurements as $\mathbf{z}$, each a known linear mix of the unknowns plus Gaussian noise:

$$
\mathbf{z} = \mathbf{H}\mathbf{x} + \mathbf{v}, \qquad \mathbf{v} \sim \mathcal{N}(\mathbf{0}, \mathbf{R}).
$$

$\mathbf{H}$ is a known $m \times n$ matrix (row $i$ says how measurement $i$ mixes the unknowns) and $\mathbf{R}$ is the known noise covariance, not necessarily diagonal. The likelihood is the multivariate Gaussian density of $\mathbf{z}$ centered on $\mathbf{H}\mathbf{x}$, so

$$
\ell(\mathbf{x}) = -\tfrac{1}{2}(\mathbf{z} - \mathbf{H}\mathbf{x})^{\mathsf{T}}\mathbf{R}^{-1}(\mathbf{z} - \mathbf{H}\mathbf{x}) + \text{const}.
$$

Maximizing $\ell$ means minimizing the quadratic form

$$
J(\mathbf{x}) = (\mathbf{z} - \mathbf{H}\mathbf{x})^{\mathsf{T}}\mathbf{R}^{-1}(\mathbf{z} - \mathbf{H}\mathbf{x}),
$$

the squared **[[Mahalanobis distance|mahalanobis]]** between data and prediction. The vector $\mathbf{z} - \mathbf{H}\mathbf{x}$ holds the **residuals** — measurement minus prediction — and $\mathbf{R}^{-1}$ weights each by the inverse of its noise. A precise measurement pulls hard; a noisy one pulls gently; shared noise is handled by the off-diagonal entries.

The gradient (vector of slopes) of $J$ is $-2\mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}(\mathbf{z} - \mathbf{H}\mathbf{x})$. Setting it to zero gives the **normal equations**:

$$
\mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{H}\,\hat{\mathbf{x}} = \mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{z}
\quad\Longrightarrow\quad
\hat{\mathbf{x}} = \big(\mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{H}\big)^{-1}\mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{z}.
$$

This is the **weighted least squares** estimate. It is a fixed matrix times $\mathbf{z}$, so the sandwich rule of the linear-transformation lesson gives its covariance, which simplifies to

$$
\mathbf{P}_{\hat{x}} = \big(\mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{H}\big)^{-1}.
$$

::: note Why the covariance simplifies so neatly
Call the estimator's matrix $\mathbf{A} = \mathbf{M}^{-1}\mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}$, with $\mathbf{M} = \mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{H}$. Both $\mathbf{M}$ and $\mathbf{R}$ are symmetric, so $\mathbf{A}^{\mathsf{T}} = \mathbf{R}^{-1}\mathbf{H}\mathbf{M}^{-1}$. The sandwich rule gives

$$
\mathbf{A}\mathbf{R}\mathbf{A}^{\mathsf{T}} = \mathbf{M}^{-1}\mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\,\mathbf{R}\,\mathbf{R}^{-1}\mathbf{H}\mathbf{M}^{-1} = \mathbf{M}^{-1}\big(\mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{H}\big)\mathbf{M}^{-1} = \mathbf{M}^{-1}\mathbf{M}\mathbf{M}^{-1} = \mathbf{M}^{-1}.
$$

:::

$\mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{H}$ is the many-parameter Fisher information — the negative second-derivative matrix of $\ell$ — called the **information matrix**, and the covariance is its inverse, as $1/I$ was before. Because the model is linear and the noise Gaussian, weighted least squares is unbiased and reaches the Cramér–Rao bound *exactly*. "Information adds" becomes concrete: a new scalar measurement with row $\mathbf{h}$ and noise variance $r$ adds $\mathbf{h}^{\mathsf{T}}\mathbf{h}/r$.

**Check it against something you know.** Two sensors measure the same scalar $x$, with independent noise variances $\sigma_1^2$ and $\sigma_2^2$. Then $\mathbf{H} = (1, 1)^{\mathsf{T}}$ and $\mathbf{R} = \operatorname{diag}(\sigma_1^2, \sigma_2^2)$, and:

$$
\mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{H} = \frac{1}{\sigma_1^2} + \frac{1}{\sigma_2^2}, \qquad
\hat{x} = \frac{z_1/\sigma_1^2 + z_2/\sigma_2^2}{1/\sigma_1^2 + 1/\sigma_2^2}, \qquad
\operatorname{Var}(\hat{x}) = \left(\frac{1}{\sigma_1^2} + \frac{1}{\sigma_2^2}\right)^{-1}.
$$

This is the inverse-variance combination of the linear-transformation lesson, there found by minimizing variance and here by maximizing likelihood. With $\sigma_1 = 3\,\mathrm{m}$, $\sigma_2 = 4\,\mathrm{m}$, $z_1 = 10.2\,\mathrm{m}$ and $z_2 = 9.5\,\mathrm{m}$, the information is $1/9 + 1/16 = 0.174$, the estimate is $\hat{x} = 9.95\,\mathrm{m}$ and its standard deviation is $2.4\,\mathrm{m}$ — closer to the better sensor, and better than either sensor alone.

::: example Gyro scale factor and bias from a rate table
A gyro is bolted to a **[[rate table|rate-table]]** and spun at five known rates, $\omega_i = -100$, $-50$, $0$, $50$ and $100\,^\circ/\mathrm{s}$. At each rate the output is averaged long enough that its noise is $\sigma = 0.05\,^\circ/\mathrm{s}$. The averaged outputs are $z_i = -99.895$, $-49.737$, $0.253$, $50.450$ and $100.487\,^\circ/\mathrm{s}$.

**The model.** A real gyro reads $z_i = k\,\omega_i + b + v_i$. The **scale factor** $k$ says how much output you get per unit of true rate (ideally exactly $1$). The **bias** $b$ is the output when not rotating at all (ideally $0$). So $\mathbf{x} = (k, b)^{\mathsf{T}}$, and row $i$ of $\mathbf{H}$ is $(\omega_i, 1)$.

**The normal equations.** All noises are equal, $\mathbf{R} = \sigma^2\mathbf{I}$, so the weights cancel and this is an ordinary straight-line fit:

$$
\mathbf{H}^{\mathsf{T}}\mathbf{H} = \begin{bmatrix} \sum\omega_i^2 & \sum\omega_i \\ \sum\omega_i & 5 \end{bmatrix} = \begin{bmatrix} 25\,000 & 0 \\ 0 & 5 \end{bmatrix},
\qquad
\mathbf{H}^{\mathsf{T}}\mathbf{z} = \begin{bmatrix} \sum\omega_i z_i \\ \sum z_i \end{bmatrix} = \begin{bmatrix} 25\,047.6 \\ 1.558 \end{bmatrix}.
$$

($\sum\omega_i^2 = 10\,000 + 2500 + 0 + 2500 + 10\,000$, and $\sum\omega_i = 0$ because the rates are symmetric.)

**Solve.** The symmetric choice of rates made the information matrix diagonal, so the two unknowns separate:

$$
\hat{k} = \frac{25\,047.6}{25\,000} = 1.00190, \qquad \hat{b} = \frac{1.558}{5} = 0.312\,^\circ/\mathrm{s}.
$$

**How precise?** The covariance is $\sigma^2(\mathbf{H}^{\mathsf{T}}\mathbf{H})^{-1} = \operatorname{diag}(0.0025/25\,000,\ 0.0025/5)$. Taking square roots, $\sigma_k = 3.16 \times 10^{-4}$ — that is, $316$ **[[parts per million|ppm]]** — and $\sigma_b = 0.0224\,^\circ/\mathrm{s}$.

**Is it real?** The scale factor is off by $0.00190$, or $1900\,\mathrm{ppm}$. That is $1900/316 = 6$ standard errors from zero, so it is a real error, not bench noise. The bias is $0.312/0.0224 = 14$ standard errors from zero — also real.

**Sanity check.** The residuals $\mathbf{z} - \mathbf{H}\hat{\mathbf{x}}$ are $-0.016$, $0.047$, $-0.059$, $0.043$ and $-0.015\,^\circ/\mathrm{s}$ — about the size of $\sigma = 0.05$, as they should be. Their sum of squares divided by $\sigma^2$ is $3.18$. The chi-square lesson explains why that number should be close to $m - n = 5 - 2 = 3$, and what to conclude when it is not.
:::

::: warning Weight by the inverse noise, and trust R
The quantity minimized has $\mathbf{R}^{-1}$ in the middle. Fitting unequally noisy measurements with unweighted least squares is not maximum likelihood, not efficient, and reports the wrong covariance.

And the covariance $(\mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{H})^{-1}$ is only as honest as $\mathbf{R}$. A fit that assumes $\sigma = 0.05$ when the true noise is $0.15$ will report parameter uncertainties three times too small. Only the residuals will give it away.
:::

## Other distributions, same recipe

The recipe does not need Gaussian data: write the log-likelihood, differentiate, set to zero.

::: example Two non-Gaussian estimates
**Exponential: how often does a star tracker drop out?** Ten star-tracker outages last $0.4$, $1.7$, $0.9$, $2.6$, $0.3$, $1.1$, $0.8$, $3.2$, $0.6$ and $1.4$ minutes. Model each length as **exponential** with rate $\lambda$ ("lambda"), density $\lambda e^{-\lambda t}$ — the standard model for waiting times with no memory.

The log of each factor is $\ln\lambda - \lambda t_i$. Add them up:

$$
\ell(\lambda) = N\ln\lambda - \lambda\sum_i t_i, \qquad \frac{\partial\ell}{\partial\lambda} = \frac{N}{\lambda} - \sum_i t_i = 0 \quad\Longrightarrow\quad \hat{\lambda} = \frac{N}{\sum_i t_i} = \frac{1}{\bar{t}}.
$$

The outages total $13.0\,\mathrm{min}$, so $\hat{\lambda} = 10/13.0 = 0.769\,\mathrm{min^{-1}}$: a mean outage of $1.3\,\mathrm{min}$. How precise? The second derivative is $-N/\lambda^2$, so $I(\lambda) = N/\lambda^2$ and the standard error is about $\hat{\lambda}/\sqrt{N} = 0.769/3.16 = 0.24\,\mathrm{min^{-1}}$. Ten outages fix the rate only to about $30\%$ — sensible for so few events.

**Bernoulli: the failure rate of a Monte Carlo campaign.** A campaign of $N$ runs has $k$ failures, and each run fails independently with probability $p$. The likelihood is $p^k(1 - p)^{N-k}$, so

$$
\ell = k\ln p + (N - k)\ln(1 - p), \qquad \frac{\partial\ell}{\partial p} = \frac{k}{p} - \frac{N - k}{1 - p} = 0 \quad\Longrightarrow\quad \hat{p} = \frac{k}{N}.
$$

The failure fraction — your instinct from the trick coin, now derived. The Fisher information is $N/(p(1 - p))$, so the variance is $p(1 - p)/N$. With $23$ failures in $2000$ runs, $\hat{p} = 0.0115$ and the standard error is $\sqrt{0.0115 \times 0.9885/2000} = 0.0024$. The Monte Carlo lesson builds its sizing rules on exactly this.
:::

## Fitting a Gauss-Markov model to a bias record

Last lesson read the correlation time $T$ off the autocorrelation plot. Maximum likelihood does it properly, with an error bar.

The exact discrete Gauss-Markov model says each sample is a fraction $\phi$ ("phi") of the previous one plus fresh noise:

$$
b_{k+1} = \phi\,b_k + n_k, \qquad n_k \sim \mathcal{N}(0, \sigma_n^2) \text{ independent}, \qquad \phi = e^{-\Delta t/T}.
$$

Statisticians call this a first-order **[[autoregression|autoregression]]**, AR(1).

The samples are not independent, but the *next* sample, given the current one, is Gaussian with mean $\phi b_k$ and variance $\sigma_n^2$. Chaining these conditional densities gives the log-likelihood of the record $b_0, \ldots, b_{N-1}$:

$$
\ell(\phi, \sigma_n^2) = -\frac{N - 1}{2}\ln(2\pi\sigma_n^2) - \frac{1}{2\sigma_n^2}\sum_{k=0}^{N-2}\big(b_{k+1} - \phi\,b_k\big)^2,
$$

plus a term for $b_0$ that hardly matters in a long record. It is the Gaussian mean problem with $\phi b_k$ in place of $\mu$: least squares on the one-step prediction errors. The score equation $\sum_k b_k(b_{k+1} - \phi b_k) = 0$ gives

$$
\hat{\phi} = \frac{\sum_{k} b_k\,b_{k+1}}{\sum_{k} b_k^2}, \qquad
\hat{\sigma}_n^2 = \frac{1}{N - 1}\sum_{k}\big(b_{k+1} - \hat{\phi}\,b_k\big)^2.
$$

Then invariance hands you the physical parameters for free:

$$
\hat{T} = -\frac{\Delta t}{\ln\hat{\phi}}, \qquad \hat{\sigma}^2 = \frac{\hat{\sigma}_n^2}{1 - \hat{\phi}^2}.
$$

$\hat{\phi}$ is the lag-one autocorrelation over the lag-zero one — the first step of last lesson's plot — but now it comes with a variance.

### How long must the record be?

The Fisher information for $\phi$ gives $\operatorname{sd}(\hat{\phi}) \approx \sqrt{(1 - \phi^2)/N}$. Carried through $T = -\Delta t/\ln\phi$ for $\Delta t \ll T$, it becomes

$$
\frac{\operatorname{sd}(\hat{T})}{T} \approx \sqrt{\frac{2T}{N\,\Delta t}} = \sqrt{\frac{2T}{t_{\text{record}}}}.
$$

The relative precision of the correlation time depends only on **[[how many correlation times the record holds|record-length]]**. To know $T$ to $10\%$, set $2T/t_{\text{record}} = 0.01$: the record must be about $200$ correlation times long. To know it to $1\%$, $2T/t_{\text{record}} = 0.0001$: about $20\,000$ correlation times. This is why bias-characterization bench tests run overnight.

::: note Where the record-length rule comes from
**Information for $\phi$.** The log-likelihood has the same shape as the Gaussian mean problem, with $b_k$ multiplying the unknown. Its second derivative in $\phi$ is $-\sum b_k^2/\sigma_n^2$. For a long record, $\sum b_k^2 \approx N\sigma^2$, and $\sigma_n^2 = \sigma^2(1 - \phi^2)$, so

$$
I(\phi) \approx \frac{N\sigma^2}{\sigma^2(1 - \phi^2)} = \frac{N}{1 - \phi^2}, \qquad \operatorname{sd}(\hat{\phi}) \approx \sqrt{\frac{1 - \phi^2}{N}}.
$$

**From $\phi$ to $T$.** A small error $d\phi$ becomes $dT = \frac{dT}{d\phi}\,d\phi$ with $\frac{dT}{d\phi} = \frac{\Delta t}{\phi(\ln\phi)^2}$. When $\Delta t \ll T$, $\phi \approx 1$, $\ln\phi = -\Delta t/T$ and $1 - \phi^2 \approx 2\Delta t/T$. So $\frac{dT}{d\phi} \approx \frac{T^2}{\Delta t}$ and

$$
\frac{\operatorname{sd}(\hat{T})}{T} \approx \frac{T}{\Delta t}\sqrt{\frac{2\Delta t}{T N}} = \sqrt{\frac{2T}{N\Delta t}}.
$$
:::

::: example Fitting σ and T to a ten-hour bias record
A simulated ten-hour record of a gyro bias with true $\sigma = 3\,^\circ/\mathrm{h}$ and $T = 100\,\mathrm{s}$, sampled at $\Delta t = 1\,\mathrm{s}$, has $N = 36\,000$ samples. The code below generates it and fits it.

**Step 1: $\phi$.** The ratio of sums gives $\hat{\phi} = 0.99034$.

**Step 2: $T$.** $\hat{T} = -1/\ln(0.99034) = 1/0.009707 = 103.0\,\mathrm{s}$.

**Step 3: $\sigma$.** The one-step residual variance is $\hat{\sigma}_n^2 = 0.1772\,(^\circ/\mathrm{h})^2$. Then $1 - \hat{\phi}^2 = 1 - 0.98077 = 0.01923$, and $\hat{\sigma} = \sqrt{0.1772/0.01923} = \sqrt{9.21} = 3.04\,^\circ/\mathrm{h}$.

**Is that good?** Both are within $3\%$ of the truth ($100\,\mathrm{s}$, $3\,^\circ/\mathrm{h}$). The predicted relative error of $\hat{T}$ is $\sqrt{2 \times 100/36\,000} = 0.075$, or $7.5\,\mathrm{s}$, so the $3.0\,\mathrm{s}$ miss is ordinary. A one-hour record would give $\sqrt{200/3600} = 0.24$, or $\pm 24\%$ — distrust a correlation time from a short test.

$\hat{\sigma}$ is tighter, but only by about a factor of two: repeated experiments scatter by about $3.7\%$ in $\hat{\sigma}$ against $7.5\%$ in $\hat{T}$. Both are limited by the same $360$ correlation times; a standard deviation, as the square root of a variance, halves the relative error.
:::

```python
import numpy as np

def gauss_markov(sigma, T, dt, n, seed=0):
    """Exact discrete Gauss-Markov record, started in steady state."""
    rng = np.random.default_rng(seed)
    phi = np.exp(-dt / T)
    sigma_n = sigma * np.sqrt(1 - phi**2)
    b = np.empty(n)
    b[0] = sigma * rng.standard_normal()
    for k in range(n - 1):
        b[k + 1] = phi * b[k] + sigma_n * rng.standard_normal()
    return b

def fit_gauss_markov(b, dt):
    """Maximum likelihood (conditional) fit of a Gauss-Markov / AR(1) model."""
    phi = np.dot(b[:-1], b[1:]) / np.dot(b[:-1], b[:-1])
    resid = b[1:] - phi * b[:-1]
    sigma_n2 = np.mean(resid**2)
    T = -dt / np.log(phi)
    sigma = np.sqrt(sigma_n2 / (1 - phi**2))
    return phi, sigma_n2, T, sigma

b = gauss_markov(3.0, 100.0, 1.0, 36_000, seed=3)
phi, sigma_n2, T, sigma = fit_gauss_markov(b, 1.0)
print(f"phi = {phi:.5f}, sigma_n^2 = {sigma_n2:.4f}")
print(f"T = {T:.1f} s, sigma = {sigma:.2f} deg/h")
# phi = 0.99034, sigma_n^2 = 0.1772
# T = 103.0 s, sigma = 3.04 deg/h
```

## Adding a prior: the step to the Kalman filter

Maximum likelihood is Bayes with a flat prior — no opinion at the start. With a prior $p(\theta)$, maximize the posterior $p(\theta \mid \text{data}) \propto L(\theta)\,p(\theta)$ instead: the **maximum a posteriori** (MAP) estimate.

For a Gaussian prior $\mathcal{N}(\mu_0, \sigma_0^2)$ on a Gaussian mean, the log-posterior gains one squared term, $-(\mu - \mu_0)^2/(2\sigma_0^2)$ — exactly one more measurement of value $\mu_0$ and variance $\sigma_0^2$. So the MAP estimate is the inverse-variance combination of prior and data.

The **[[Kalman filter|kalman-bridge]]** is this idea run over and over. Yesterday's posterior becomes today's prior; today's measurement enters through its likelihood; the update is the MAP estimate. Every gain, covariance and residual in the estimation track comes from the likelihood function defined at the start of this lesson.

## Check yourself

::: check
Five independent samples from $\mathcal{N}(\mu, 4)$ are $3.1$, $2.4$, $4.0$, $3.3$ and $2.7$. Find the maximum likelihood estimate of $\mu$, its Fisher information, and the Cramér–Rao standard deviation.
:::

::: answer
The MLE of a Gaussian mean is the sample mean: $\hat{\mu} = (3.1 + 2.4 + 4.0 + 3.3 + 2.7)/5 = 15.5/5 = 3.10$.

Here $\sigma^2 = 4$ and $N = 5$, so $I(\mu) = N/\sigma^2 = 5/4 = 1.25$. The bound on any unbiased estimator's variance is $1/1.25 = 0.8$, so the smallest possible standard deviation is $\sqrt{0.8} = 0.894$. The sample mean reaches it exactly (check: $\sigma/\sqrt{N} = 2/\sqrt{5} = 0.894$).
:::

::: check
Event counts in five equal time intervals are $3$, $5$, $2$, $4$, $6$. Model them as Poisson with mean $\lambda$ per interval, $p(k \mid \lambda) = \lambda^k e^{-\lambda}/k!$. Derive the MLE of $\lambda$ and its approximate standard error.
:::

::: answer
The log of one factor is $k_i\ln\lambda - \lambda - \ln k_i!$. Add them up:

$$
\ell(\lambda) = \Big(\sum k_i\Big)\ln\lambda - N\lambda + \text{const}.
$$

The slope is $\sum k_i/\lambda - N$. Setting it to zero gives $\hat{\lambda} = \bar{k} = 20/5 = 4.0$ events per interval.

The second derivative is $-\sum k_i/\lambda^2$. Its average uses $\mathbb{E}[\sum k_i] = N\lambda$, giving $-N/\lambda$. So $I(\lambda) = N/\lambda$ and the standard error is $\sqrt{\lambda/N} \approx \sqrt{4/5} = 0.894$. Since a Poisson variable's variance equals its mean, this is also $\sigma/\sqrt{N}$ — a good consistency check.
:::

::: check
For $N = 8$ samples, by what percentage does the maximum likelihood variance estimate fall short of $\sigma^2$ on average? What does this say about the claim "the MLE is the best estimator"?
:::

::: answer
$\mathbb{E}[\hat{\sigma}^2_{\text{ML}}] = \frac{N-1}{N}\sigma^2 = \frac{7}{8}\sigma^2$, which is $12.5\%$ low in variance. In standard deviation that is about $6\%$ low, since $\sqrt{7/8} = 0.935$.

The MLE is "best" in specific senses: it makes the observed data most probable, and it becomes efficient as $N$ grows. It is not guaranteed unbiased for small $N$. "Best" always needs a criterion. For a small sample, the bias-corrected $s^2$ (dividing by $N - 1$) is preferred for the variance.
:::

::: check
Two altimeters read the same altitude $x$ with independent Gaussian errors of $\sigma_1 = 2\,\mathrm{m}$ and $\sigma_2 = 6\,\mathrm{m}$. Find the weighted least-squares weights and the standard deviation of the combined estimate. What goes wrong if you use unweighted least squares instead?
:::

::: answer
The information from each is $1/\sigma^2$: $1/4$ and $1/36$. The total is $1/4 + 1/36 = 9/36 + 1/36 = 10/36$.

Each weight is that sensor's share of the information: $(1/4)/(10/36) = 0.9$ on the first altimeter and $(1/36)/(10/36) = 0.1$ on the second. The combined variance is $36/10 = 3.6\,\mathrm{m^2}$, so the standard deviation is $\sqrt{3.6} = 1.90\,\mathrm{m}$ — slightly better than the good sensor's $2\,\mathrm{m}$ alone.

Unweighted least squares uses $0.5$ and $0.5$. Its variance is $0.25 \times 4 + 0.25 \times 36 = 10\,\mathrm{m^2}$, a standard deviation of $3.16\,\mathrm{m}$. That is worse than ignoring the poor sensor entirely, because the noisy measurement was allowed to pull as hard as the precise one.
:::

::: check
A bias record sampled at $\Delta t = 0.5\,\mathrm{s}$ gives $\hat{\phi} = 0.980$. What is the maximum likelihood estimate of the correlation time, and which property of the MLE lets you say so without redoing the maximization?
:::

::: answer
$\hat{T} = -\Delta t/\ln\hat{\phi} = -0.5/\ln(0.980) = -0.5/(-0.0202) = 24.7\,\mathrm{s}$.

This is the MLE of $T$ by the **invariance** property. $T$ is a one-to-one function of $\phi$, and the MLE of a function of a parameter is that function of the MLE. The likelihood has its peak at the same place whichever way you label the axis; only the numbers along the axis change.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $L(\theta) = \prod_i p(x_i \mid \theta)$, $\ell = \ln L$ | Likelihood and log-likelihood of the observed data, as a function of $\theta$ |
| $\hat{\theta}_{\text{ML}} = \arg\max_\theta \ell(\theta)$, $\partial\ell/\partial\theta = 0$ | Maximum likelihood estimate; score equation |
| $\hat{\mu} = \bar{x}$, $\hat{\sigma}^2_{\text{ML}} = \frac{1}{N}\sum(x_i - \bar{x})^2$ | Gaussian MLEs; the variance is biased by $(N-1)/N$ |
| $I(\theta) = -\mathbb{E}[\partial^2\ell/\partial\theta^2]$ | Fisher information; adds over independent samples; $N/\sigma^2$ for a Gaussian mean |
| $\operatorname{Var}(\hat{\theta}) \geq 1/I(\theta)$ | Cramér–Rao bound; efficient estimators reach it |
| Consistent; $\hat{\theta} \sim \mathcal{N}(\theta, 1/I)$ for large $N$; $g(\hat{\theta})$ is the MLE of $g(\theta)$ | The three promises of the MLE |
| $\hat{\mathbf{x}} = (\mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{H})^{-1}\mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{z}$, $\mathbf{P} = (\mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{H})^{-1}$ | Weighted least squares: the MLE for $\mathbf{z} = \mathbf{H}\mathbf{x} + \mathbf{v}$, $\mathbf{v} \sim \mathcal{N}(\mathbf{0}, \mathbf{R})$ |
| $\hat{\lambda} = 1/\bar{t}$; $\hat{p} = k/N$ | Exponential rate; Bernoulli probability |
| $\hat{\phi} = \sum b_k b_{k+1}/\sum b_k^2$, $\hat{T} = -\Delta t/\ln\hat{\phi}$ | AR(1) fit of a Gauss-Markov process; $\operatorname{sd}(\hat{T})/T \approx \sqrt{2T/t_{\text{record}}}$ |
| MAP: $\arg\max L(\theta)p(\theta)$ | Maximum likelihood with a prior; the Kalman update |

Maximum likelihood gives you a best guess and, through the Fisher information, a variance for it. The next lesson turns that variance into a statement with a probability attached — the confidence interval — and into a way of deciding — the hypothesis test — and shows what both do and do not mean.

::: context likelihood-word A word chosen on purpose
In everyday English, "likely" and "probable" mean the same thing. The statistician Ronald Fisher picked "likelihood" in the early 1920s precisely so that it would *not* be confused with probability. Probability is about outcomes, with the model fixed: how probable are eight heads from a fair coin? Likelihood is about models, with the outcome fixed: how well does "fair coin" explain the eight heads I already saw, compared with "80% coin"? Only ratios of likelihoods mean anything — "this setting explains the data three times better than that one".
:::

::: context why-log Why take the log?
Two reasons, one mathematical and one practical. Mathematically, the log turns a product into a sum, and sums are easy to differentiate term by term. Practically, computers cannot hold very small numbers. A Gaussian density is typically below $1$, and a ten-hour gyro record has $36\,000$ samples. Multiplying $36\,000$ numbers each around $0.5$ gives about $10^{-10\,800}$, far below the smallest number a double-precision float can store (about $10^{-308}$). The computer would round the likelihood to exactly zero for every $\theta$ and find no peak at all. The sum of logs is an ordinary number in the tens of thousands.
:::

::: context half-unit-drop The peak of the gyro likelihood
Here is the log-likelihood of the eight gyro samples, relative to its peak, as the guessed bias $\mu$ varies. It is a downward parabola, highest at $\bar{x} = 0.574$. Where it has dropped by $\tfrac{1}{2}$ you are one standard error, $0.066\,^\circ/\mathrm{h}$, from the peak. At $\mu = 0.674$ it has dropped by $1.14$. A narrower parabola would mean a more precise estimate.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="30" x2="40" y2="185" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="185" x2="345" y2="185" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#6c7a93" stroke-width="1"><line x1="36" y1="30" x2="40" y2="30"/><line x1="36" y1="80" x2="40" y2="80"/><line x1="36" y1="130" x2="40" y2="130"/><line x1="36" y1="180" x2="40" y2="180"/></g>
  <g font-size="11" fill="#1f2a44" text-anchor="end"><text x="33" y="34">0</text><text x="33" y="84">−2</text><text x="33" y="134">−4</text><text x="33" y="184">−6</text></g>
  <g stroke="#6c7a93" stroke-width="1"><line x1="73.3" y1="185" x2="73.3" y2="189"/><line x1="140" y1="185" x2="140" y2="189"/><line x1="206.7" y1="185" x2="206.7" y2="189"/><line x1="273.3" y1="185" x2="273.3" y2="189"/><line x1="340" y1="185" x2="340" y2="189"/></g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle"><text x="73.3" y="201">0.4</text><text x="140" y="201">0.5</text><text x="206.7" y="201">0.6</text><text x="273.3" y="201">0.7</text><text x="340" y="201">0.8</text></g>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="40.0,173.5 46.7,161.0 53.3,149.0 60.0,137.6 66.7,126.8 73.3,116.6 80.0,106.9 86.7,97.8 93.3,89.3 100.0,81.3 106.7,74.0 113.3,67.2 120.0,60.9 126.7,55.3 133.3,50.2 140.0,45.7 146.7,41.7 153.3,38.3 160.0,35.5 166.7,33.3 173.3,31.6 180.0,30.6 186.7,30.0 193.3,30.1 200.0,30.7 206.7,31.9 213.3,33.7 220.0,36.1 226.7,39.0 233.3,42.5 240.0,46.5 246.7,51.2 253.3,56.4 260.0,62.1 266.7,68.5 273.3,75.4 280.0,82.9 286.7,91.0 293.3,99.6 300.0,108.8 306.7,118.6 313.3,128.9 320.0,139.9 326.7,151.4 333.3,163.4 340.0,176.1"/>
  <line x1="189.3" y1="30" x2="189.3" y2="185" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
  <line x1="145.3" y1="42.5" x2="233.3" y2="42.5" stroke="#b4232c" stroke-width="2"/>
  <circle cx="256" cy="58.6" r="3.5" fill="#f2b880" stroke="#1f2a44"/>
  <text x="262" y="62" font-size="11" fill="#1f2a44">μ = 0.674: drop 1.14</text>
  <text x="104" y="24" font-size="11" fill="#b4232c">drop of ½: ±0.066</text>
  <text x="194" y="170" font-size="11" fill="#1f2a44">x̄ = 0.574</text>
  <text x="300" y="180" font-size="11" fill="#1f2a44">μ, °/h</text>
</svg>
```
:::

::: context cramer-rao-names Two names, one limit
The bound is named after the Swedish mathematician Harald Cramér and the Indian statistician C. R. Rao, who each published it in the mid-1940s. Rao was only in his mid-twenties when his paper appeared, and he lived to be 102. It plays the role in estimation that the speed of light plays in travel: a hard limit you can approach but never beat. Navigation engineers use it to ask whether a proposed sensor suite *could* ever meet a requirement, before anyone writes filter code.
:::

::: context mahalanobis Distance measured in sigmas
Ordinary distance treats every direction alike. Mahalanobis distance, introduced by the Indian statistician P. C. Mahalanobis in 1936, measures distance in units of the local uncertainty. A $3\,\mathrm{m}$ residual on a sensor with $\sigma = 1\,\mathrm{m}$ counts as $3$ sigmas, while the same $3\,\mathrm{m}$ on a sensor with $\sigma = 10\,\mathrm{m}$ counts as only $0.3$. With correlated noise, the $\mathbf{R}^{-1}$ also accounts for the tilt of the uncertainty ellipse. You will meet it again as the filter consistency test in the chi-square lesson.
:::

::: context rate-table The turntable that calibrates gyros
A rate table is a precision turntable that spins at an exactly known angular rate, often with its own optical encoder to measure its angle. Bolt an inertial measurement unit on top, command a series of rates, and compare what the gyros report with what the table is really doing. Every navigation-grade IMU goes through this before flight. Tilting the unit to different orientations on the table lets engineers separate scale factor, bias and misalignment for all three gyro axes in one test campaign.
:::

::: context ppm Parts per million
Scale-factor errors are tiny fractions, so engineers quote them in parts per million: $1\,\mathrm{ppm} = 10^{-6}$. A scale factor of $1.00190$ is off by $0.00190 = 1900 \times 10^{-6}$, or $1900\,\mathrm{ppm}$. In practice this means a gyro turning at $100\,^\circ/\mathrm{s}$ reports $100.19\,^\circ/\mathrm{s}$. Navigation-grade gyros are held to a few ppm; the unit in this example would need calibrating before flight.

Here are its five residuals against the table rate, with the $\pm\sigma = \pm 0.05\,^\circ/\mathrm{s}$ band dashed. They scatter on both sides of zero with no pattern — the sign of a model that fits.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="52.5" x2="320" y2="52.5" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="60" y1="127.5" x2="320" y2="127.5" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="50" y1="90" x2="330" y2="90" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="end"><text x="46" y="56">+0.05</text><text x="46" y="94">0</text><text x="46" y="131">−0.05</text></g>
  <g stroke="#1d6fd1" stroke-width="2">
    <line x1="60" y1="90" x2="60" y2="102.3"/><line x1="125" y1="90" x2="125" y2="55.1"/><line x1="190" y1="90" x2="190" y2="134"/><line x1="255" y1="90" x2="255" y2="57.5"/><line x1="320" y1="90" x2="320" y2="101.1"/>
  </g>
  <g fill="#1d6fd1"><circle cx="60" cy="102.3" r="4"/><circle cx="125" cy="55.1" r="4"/><circle cx="190" cy="134" r="4"/><circle cx="255" cy="57.5" r="4"/><circle cx="320" cy="101.1" r="4"/></g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle"><text x="60" y="160">−100</text><text x="125" y="160">−50</text><text x="190" y="160">0</text><text x="255" y="160">50</text><text x="320" y="160">100</text></g>
  <text x="190" y="176" font-size="11" fill="#1f2a44" text-anchor="middle">table rate, °/s</text>
  <text x="60" y="22" font-size="11" fill="#1f2a44">residual z − Hx̂, °/s</text>
</svg>
```
:::

::: context autoregression Predicting a signal from its own past
"Auto" means self, and "regression" is the statistician's word for fitting a line. An autoregression fits each sample as a straight-line function of the samples before it — the signal regressed on itself. First order means only one step back: $b_{k+1} = \phi b_k + \text{noise}$. The same models are used for weather, stock prices and speech, and a first-order one is exactly the discrete Gauss-Markov process of the previous lessons. That shared identity is why statistics software for AR models can fit a gyro bias directly.
:::

::: context record-length Longer records, sharper T
The relative error of the fitted correlation time is $\sqrt{2/x}$, where $x$ is the record length in correlation times. On log scales that is a straight line falling one decade for every two decades of record. For a $T = 100\,\mathrm{s}$ gyro, one hour is $36$ correlation times ($24\%$), $200$ correlation times is about $5.6$ hours ($10\%$), and $1\%$ would take $20\,000$ correlation times — about $23$ days.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="25" x2="60" y2="165" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="60" y1="165" x2="335" y2="165" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#6c7a93" stroke-width="0.6" stroke-dasharray="2 3"><line x1="60" y1="75.4" x2="335" y2="75.4"/><line x1="60" y1="140.4" x2="335" y2="140.4"/><line x1="127.5" y1="25" x2="127.5" y2="165"/><line x1="195" y1="25" x2="195" y2="165"/><line x1="262.5" y1="25" x2="262.5" y2="165"/></g>
  <g font-size="11" fill="#1f2a44" text-anchor="end"><text x="55" y="34">50%</text><text x="55" y="79">10%</text><text x="55" y="144">1%</text></g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle"><text x="60" y="180">10</text><text x="127.5" y="180">100</text><text x="195" y="180">1000</text><text x="262.5" y="180">10⁴</text></g>
  <line x1="60" y1="33.1" x2="309.7" y2="153.4" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="97.6" cy="51.2" r="4" fill="#f2b880" stroke="#1f2a44"/>
  <circle cx="147.8" cy="75.4" r="4" fill="#f2b880" stroke="#1f2a44"/>
  <circle cx="282.8" cy="140.4" r="4" fill="#f2b880" stroke="#1f2a44"/>
  <text x="104" y="47" font-size="11" fill="#1f2a44">1 h: 24%</text>
  <text x="154" y="71" font-size="11" fill="#1f2a44">200 T: 10%</text>
  <text x="226" y="132" font-size="11" fill="#1f2a44">20 000 T: 1%</text>
  <text x="198" y="196" font-size="11" fill="#1f2a44" text-anchor="middle">record length, in correlation times</text>
  <text x="66" y="20" font-size="11" fill="#1f2a44">sd(T̂)/T</text>
</svg>
```
:::

::: context kalman-bridge Where this comes back
In the estimation track you will build a Kalman filter, and its update step will look like the weighted least-squares formula with one extra "measurement" — the prediction from the last step, weighted by its own covariance. Before Kalman, Carl Friedrich Gauss used least squares in 1801 to recover the newly found dwarf planet Ceres after it vanished behind the Sun, and later justified the method by assuming Gaussian errors — which is exactly the maximum likelihood argument of this lesson. Orbit determination still works this way.
:::
