---
id: l04-maximum-likelihood-equivalence-wls-gaussian
title: Maximum likelihood and its equivalence to WLS under Gaussian noise
minutes: 17
covers:
  - Maximum likelihood and its equivalence to WLS under Gaussian noise
---

The probability module introduced maximum likelihood estimation as a general principle: write down how likely the observed data are as a function of the unknown parameter, and choose the parameter that makes them most likely. This lesson applies that principle to the linear measurement model $\mathbf{y}=\mathbf{H}\mathbf{x}+\mathbf{v}$ with $\mathbf{v}$ Gaussian, and the answer it produces is not a new estimator. It is the weighted least squares estimator of two lessons ago, arrived at from a completely different starting point.

That coincidence is the reason WLS is the default estimator in navigation rather than merely a convenient linear one. The previous lesson proved WLS beats every other *linear* rule, using nothing about the shape of the noise. This lesson assumes the noise shape specifically — Gaussian — and gets a stronger conclusion: WLS beats every unbiased rule, linear or not. Sensor errors dominated by a large number of small, independent effects — thermal noise, quantization spread over many samples, atmospheric turbulence integrated along a path — are well approximated by a Gaussian by the same central limit reasoning the probability module used to justify it elsewhere, which is why this stronger result applies to so much of what a GNC engineer actually measures.

## The likelihood of a linear-Gaussian measurement

With $\mathbf{v}\sim\mathcal{N}(\mathbf{0},\mathbf{R})$, the measurement $\mathbf{y}=\mathbf{H}\mathbf{x}+\mathbf{v}$ is itself Gaussian, with mean $\mathbf{H}\mathbf{x}$ and covariance $\mathbf{R}$, so its density is the multivariate Gaussian the probability module derived, evaluated at $\mathbf{y}$ with that mean and covariance:

$$
p(\mathbf{y};\mathbf{x}) = \frac{1}{(2\pi)^{m/2}\lvert\mathbf{R}\rvert^{1/2}}\exp\left(-\tfrac12(\mathbf{y}-\mathbf{H}\mathbf{x})^\mathsf{T}\mathbf{R}^{-1}(\mathbf{y}-\mathbf{H}\mathbf{x})\right) .
$$

Read as a function of the data $\mathbf{y}$ with $\mathbf{x}$ fixed, this is a density. Read as a function of $\mathbf{x}$ with the observed $\mathbf{y}$ fixed, it is the **likelihood** $L(\mathbf{x})$, and maximum likelihood chooses $\hat{\mathbf{x}}_{\mathrm{ML}} = \arg\max_{\mathbf{x}} L(\mathbf{x})$. Because the logarithm is increasing, maximizing $L$ is the same as maximizing $\log L$, and

$$
\log L(\mathbf{x}) = -\tfrac12(\mathbf{y}-\mathbf{H}\mathbf{x})^\mathsf{T}\mathbf{R}^{-1}(\mathbf{y}-\mathbf{H}\mathbf{x}) \;-\; \tfrac{m}{2}\log(2\pi) - \tfrac12\log\lvert\mathbf{R}\rvert .
$$

The last two terms do not involve $\mathbf{x}$ at all — they depend only on $m$ and $\mathbf{R}$ — so maximizing $\log L(\mathbf{x})$ over $\mathbf{x}$ is exactly minimizing $(\mathbf{y}-\mathbf{H}\mathbf{x})^\mathsf{T}\mathbf{R}^{-1}(\mathbf{y}-\mathbf{H}\mathbf{x})$, which is twice the weighted least squares cost $J(\mathbf{x})$ of lesson two with $\mathbf{W}=\mathbf{R}^{-1}$. The maximizer of the likelihood and the minimizer of the WLS cost are the same point, for every $\mathbf{y}$:

$$
\hat{\mathbf{x}}_{\mathrm{ML}} = \hat{\mathbf{x}}_{\mathrm{WLS}} = (\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1}\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{y} .
$$

::: key Maximum likelihood equals WLS under Gaussian noise
With $\mathbf{y}=\mathbf{H}\mathbf{x}+\mathbf{v}$, $\mathbf{v}\sim\mathcal{N}(\mathbf{0},\mathbf{R})$, the log-likelihood is $-\tfrac12(\mathbf{y}-\mathbf{H}\mathbf{x})^\mathsf{T}\mathbf{R}^{-1}(\mathbf{y}-\mathbf{H}\mathbf{x})$ plus a constant that does not depend on $\mathbf{x}$, so maximizing it is exactly minimizing the $\mathbf{R}^{-1}$-weighted residual norm: $\hat{\mathbf{x}}_{\mathrm{ML}} = (\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1}\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{y} = \hat{\mathbf{x}}_{\mathrm{WLS}}$.
:::

::: example The likelihood peak, found two ways
Two independent range-correction estimates of the same bias give $y_1=10.4\,\mathrm{m}$ with $\sigma_1=2.0\,\mathrm{m}$ and $y_2=11.1\,\mathrm{m}$ with $\sigma_2=3.0\,\mathrm{m}$, so $\mathbf{H}=(1,1)^\mathsf{T}$ and $\mathbf{R}=\operatorname{diag}(4,9)$. The closed-form estimate is $\hat x = (y_1/\sigma_1^2+y_2/\sigma_2^2)/(1/\sigma_1^2+1/\sigma_2^2) = 10.6154\,\mathrm{m}$. Evaluate $J(x)=\tfrac12(\mathbf{y}-\mathbf{H}x)^\mathsf{T}\mathbf{R}^{-1}(\mathbf{y}-\mathbf{H}x)$, the negative log-likelihood up to the same additive constant, on a grid around it:

| $x\,(\mathrm{m})$ | $10.0$ | $10.4$ | $10.6$ | $10.68$ | $10.6154$ | $10.75$ | $10.9$ | $11.1$ |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| $J(x)$ | $0.0872$ | $0.0272$ | $0.0189$ | $0.0196$ | $\mathbf{0.01885}$ | $0.0221$ | $0.0335$ | $0.0613$ |

The tabulated values fall on both sides of $x=10.6154\,\mathrm{m}$ and rise moving away from it in either direction, and a search over four million grid points on $[9,13]\,\mathrm{m}$ finds its minimum at $10.615385\,\mathrm{m}$, matching the closed form to every digit shown. The gradient of $J$ at the closed-form point, computed directly from $-\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}(\mathbf{y}-\mathbf{H}\hat x)$, comes out at $4\times10^{-16}$ — zero to machine precision. Maximizing the likelihood by brute-force search and solving the WLS normal equation land on the same number because, for this model, they are the same problem written two ways.
:::

## Fisher information: WLS is not merely the best linear rule

Lesson three's Gauss-Markov theorem compared WLS only against other *linear* estimators. Gaussian noise supports a sharper claim: that WLS beats every unbiased estimator at all, including ones that are nonlinear functions of $\mathbf{y}$. The tool for that claim is the **Fisher information**.

Define the **score** as the gradient of the log-likelihood with respect to the unknown, $\mathbf{s}(\mathbf{x}) = \nabla_{\mathbf{x}}\log p(\mathbf{y};\mathbf{x})$. For the linear-Gaussian model,

$$
\mathbf{s}(\mathbf{x}) = \mathbf{H}^\mathsf{T}\mathbf{R}^{-1}(\mathbf{y}-\mathbf{H}\mathbf{x}) = \mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{v},
$$

substituting the true model in the second step. The score is a linear function of the noise, so it has zero mean, and its covariance is

$$
\mathcal{I}(\mathbf{x}) := \operatorname{Cov}(\mathbf{s}) = \mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\operatorname{Cov}(\mathbf{v})\,\mathbf{R}^{-1}\mathbf{H} = \mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H},
$$

using $\operatorname{Cov}(\mathbf{v})=\mathbf{R}$. This is the same matrix that appeared as the information matrix two lessons ago — no coincidence, and the reason it carries that name generally. Here it is constant in $\mathbf{x}$, a feature special to linear-Gaussian models.

Now take *any* unbiased estimator $T(\mathbf{y})$ of $\mathbf{x}$, not necessarily linear: $\mathbb{E}[T(\mathbf{y})]=\mathbf{x}$ for every possible true $\mathbf{x}$. Differentiating both sides with respect to $\mathbf{x}$ — exchanging derivative and integral, which holds under the mild regularity every measurement model in this module satisfies — and using $\nabla_{\mathbf{x}}p = p\,\mathbf{s}^\mathsf{T}$,

$$
\mathbb{E}\!\left[T(\mathbf{y})\,\mathbf{s}(\mathbf{x})^\mathsf{T}\right] = \mathbf{I}_n .
$$

Differentiating $\int p(\mathbf{y};\mathbf{x})\,d\mathbf{y}=1$ the same way gives $\mathbb{E}[\mathbf{s}]=\mathbf{0}$, so subtracting $\mathbf{x}\,\mathbb{E}[\mathbf{s}]^\mathsf{T}=\mathbf{0}$ changes nothing and $\mathbb{E}[(T-\mathbf{x})\mathbf{s}^\mathsf{T}] = \mathbf{I}_n$ as well. Stack the error $T-\mathbf{x}$ and the score $\mathbf{s}$ into one $2n$-long random vector. Its covariance matrix is a covariance matrix, hence positive semidefinite:

$$
\begin{pmatrix} \operatorname{Cov}(T) & \mathbf{I}_n \\ \mathbf{I}_n & \mathcal{I}(\mathbf{x}) \end{pmatrix} \succeq \mathbf{0} .
$$

A block matrix like this is positive semidefinite only if its Schur complement is: $\operatorname{Cov}(T) - \mathbf{I}_n\,\mathcal{I}(\mathbf{x})^{-1}\,\mathbf{I}_n \succeq \mathbf{0}$. That is the **Cramér-Rao lower bound**,

$$
\operatorname{Cov}(T) \succeq \mathcal{I}(\mathbf{x})^{-1} = (\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1} = \mathbf{P}_{\mathrm{WLS}},
$$

and it holds for *every* unbiased $T$, linear or not. WLS attains it with equality, since its own covariance is exactly $\mathbf{P}_{\mathrm{WLS}}$. An estimator that attains the Cramér-Rao bound is called **efficient**, and efficiency is the strongest optimality statement in this module: not "no linear rule beats it," but "nothing unbiased beats it, full stop." Gaussian noise is what buys the upgrade from Gauss-Markov's "best linear" to this lesson's "best, period."

## What Gaussianity buys you, and what its absence costs

Efficiency is not free — it is bought with the Gaussian assumption, and it is worth seeing concretely what happens to it when that assumption is wrong. Take the simplest possible instance of the model: $m$ repeated direct measurements of one scalar, $\mathbf{H}=\mathbf{1}$, equal $\sigma$. The WLS/ML estimate reduces to the **sample mean**. Compare it against the **sample median**, an unbiased but nonlinear estimator of the same quantity, under two noise shapes with the same $\sigma$.

::: example Mean against median, Gaussian against Laplace noise
Simulate $m=11$ measurements of $x_{\mathrm{true}}=5$ with $\sigma=2$, drawn $N=300{,}000$ times, once from a Gaussian and once from a Laplace distribution scaled to the same variance:

```python
import numpy as np

m, sigma, x_true, N = 11, 2.0, 5.0, 300_000
rng = np.random.default_rng(2026)
noise_gauss = rng.normal(0.0, sigma, size=(N, m))
noise_laplace = rng.laplace(0.0, sigma/np.sqrt(2.0), size=(N, m))   # same variance

for name, noise in (("Gaussian", noise_gauss), ("Laplace", noise_laplace)):
    y = x_true + noise
    mean_est, median_est = y.mean(axis=1), np.median(y, axis=1)
    print(f"{name:9s} Var(mean)={mean_est.var():.4f}  Var(median)={median_est.var():.4f}"
          f"  ratio median/mean={median_est.var()/mean_est.var():.3f}")
# Gaussian  Var(mean)=0.3635  Var(median)=0.5497  ratio median/mean=1.512
# Laplace   Var(mean)=0.3631  Var(median)=0.2767  ratio median/mean=0.762
```

Under Gaussian noise the mean's variance, $0.3635$, matches $\sigma^2/m = 4/11 = 0.3636$, the Cramér-Rao bound $(\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1}$ for this problem — the mean is efficient, and the median needs $51\%$ more variance to estimate the same quantity. Under Laplace noise, with identical $\sigma$, the ranking flips: the median's variance is $24\%$ *lower* than the mean's. The mean is still unbiased — both estimators recover $x_{\mathrm{true}}=5$ to three decimal places in this simulation — and by the previous lesson's theorem the mean is still BLUE, the best *linear* rule available, since Gauss-Markov never asked about the noise shape. But it is no longer the best rule of any kind, because the median happens to be the maximum likelihood estimator for Laplace-distributed noise, exactly as the mean is for Gaussian noise, and Laplace noise concentrates enough probability in its heavier tails that a rule less sensitive to any single extreme value does better.
:::

The pattern generalizes beyond this toy case: for any noise density, there is a maximum likelihood estimator matched to that density, and it is efficient for that density. WLS is the maximum likelihood estimator for exactly one density, the Gaussian, and it is efficient exactly there. Away from Gaussian noise it remains unbiased and remains BLUE — Gauss-Markov's guarantee costs you nothing you did not already know you were paying — but the stronger claim of this lesson quietly stops applying, and nothing about the residuals or the fit will announce that it has. Knowing the actual shape of a sensor's error distribution, not only its variance, is therefore worth establishing during calibration, not assumed by default.

::: warning Gaussian noise is an assumption about R, and a further one about shape
$\mathbf{R}$ alone — the covariance — is enough for Gauss-Markov. Efficiency additionally assumes the noise is Gaussian in *distribution*, not only in its first two moments. A sensor with well-characterized $\sigma$ but heavy-tailed or skewed errors (a star tracker centroiding algorithm that occasionally misidentifies a star, a receiver in multipath) can have exactly the $\mathbf{R}$ that WLS is built from and still not be well served by it. The residual-analysis lesson later in this module is about detecting when this is happening.
:::

## Check yourself

::: check
Write the log-likelihood for $\mathbf{y}=\mathbf{H}\mathbf{x}+\mathbf{v}$, $\mathbf{v}\sim\mathcal{N}(\mathbf{0},\mathbf{R})$, and identify exactly which term makes maximizing it the same problem as minimizing the WLS cost.
:::

::: answer
$\log L(\mathbf{x}) = -\tfrac12(\mathbf{y}-\mathbf{H}\mathbf{x})^\mathsf{T}\mathbf{R}^{-1}(\mathbf{y}-\mathbf{H}\mathbf{x}) - \tfrac{m}{2}\log(2\pi) - \tfrac12\log\lvert\mathbf{R}\rvert$. The last two terms do not depend on $\mathbf{x}$, so they shift $\log L$ up or down without moving its maximizer. Only the first term, $-J(\mathbf{x})$ with $J$ the WLS cost from lesson two, depends on $\mathbf{x}$, so maximizing $\log L$ and minimizing $J$ have the same solution.
:::

::: check
Why does the Fisher information $\mathcal{I}(\mathbf{x}) = \mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}$ not actually depend on $\mathbf{x}$ for this model, even though its definition, $\operatorname{Cov}$ of the score, looks like it should be evaluated at a particular $\mathbf{x}$?
:::

::: answer
The score is $\mathbf{s}(\mathbf{x}) = \mathbf{H}^\mathsf{T}\mathbf{R}^{-1}(\mathbf{y}-\mathbf{H}\mathbf{x})$, and substituting the true model $\mathbf{y}=\mathbf{H}\mathbf{x}+\mathbf{v}$ gives $\mathbf{s}=\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{v}$: the unknown $\mathbf{x}$ cancels, because the model is linear in $\mathbf{x}$. What is left is a fixed linear function of the noise, whose covariance $\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}$ involves only $\mathbf{H}$ and $\mathbf{R}$, both known in advance. This is special to linear models; the nonlinear least squares lesson later in this module meets a Fisher information that does depend on $\mathbf{x}$, because the cancellation no longer happens exactly.
:::

::: check
State the Cramér-Rao bound and explain in one sentence why WLS being efficient is a stronger statement than WLS being BLUE.
:::

::: answer
For any unbiased estimator $T(\mathbf{y})$ of $\mathbf{x}$, $\operatorname{Cov}(T) \succeq \mathcal{I}(\mathbf{x})^{-1}$, with $\mathcal{I}$ the Fisher information; WLS attains this bound with equality under Gaussian noise. It is stronger than BLUE because BLUE only ranks WLS against other *linear* unbiased estimators, while the Cramér-Rao bound ranks it against every unbiased estimator, linear or not — WLS is not merely the best of a restricted class, it is unbeatable.
:::

::: check
In the mean-versus-median simulation, both estimators are unbiased under both noise distributions, yet their variances rank oppositely under Gaussian and Laplace noise. What does this say about the Gauss-Markov theorem's guarantee for the mean, and what does it say about the *efficiency* claim of this lesson?
:::

::: answer
Gauss-Markov's guarantee for the mean holds in both cases without qualification, because the mean is the WLS/BLUE estimator for equal-variance measurements and the theorem asked nothing about noise shape: the mean is never beaten by another *linear unbiased* rule, in either simulation. The efficiency claim of this lesson is different and narrower: it holds only under Gaussian noise, where the mean is also the ML estimator. Under Laplace noise the mean is still BLUE but no longer efficient, because the median — nonlinear, and the actual ML estimator for Laplace noise — beats it.
:::

::: check
A colleague argues that since $\mathbf{R}$ fully describes the noise for the purposes of WLS, checking whether the noise is "really" Gaussian is unnecessary busywork. Using this lesson, say what is lost if they are wrong.
:::

::: answer
Nothing about the point estimate or its computed covariance $\mathbf{P}=(\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1}$ changes if the noise is non-Gaussian with the same $\mathbf{R}$: WLS remains unbiased and remains BLUE, by the previous lesson. What is lost silently is the claim that no better *unbiased* estimator exists at all — efficiency, from the Cramér-Rao bound, which this lesson showed requires the Gaussian assumption specifically. A better estimator, matched to the true noise shape, may be sitting unused, and nothing in the residuals or the reported covariance would reveal it; only knowledge of how the sensor actually fails does.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\log L(\mathbf{x}) = -J(\mathbf{x}) + \text{const}$ | Gaussian log-likelihood; maximizing it equals minimizing the WLS cost |
| $\hat{\mathbf{x}}_{\mathrm{ML}} = \hat{\mathbf{x}}_{\mathrm{WLS}} = (\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1}\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{y}$ | ML and WLS coincide exactly under Gaussian noise |
| $\mathbf{s}(\mathbf{x}) = \nabla_{\mathbf{x}}\log p(\mathbf{y};\mathbf{x})$ | Score: zero mean, $\operatorname{Cov}(\mathbf{s}) = \mathcal{I}(\mathbf{x})$ |
| $\mathcal{I}(\mathbf{x}) = \mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}$ | Fisher information; constant in $\mathbf{x}$ for a linear-Gaussian model |
| $\operatorname{Cov}(T) \succeq \mathcal{I}(\mathbf{x})^{-1}$ | Cramér-Rao lower bound, for any unbiased $T$, linear or not |
| WLS attains the bound with equality | WLS is **efficient** under Gaussian noise: unbeatable, not merely best-among-linear |
| Away from Gaussian noise | WLS stays unbiased and BLUE; efficiency specifically can fail (mean vs. median under Laplace noise) |

Maximum likelihood needed a distribution to maximize. The next lesson adds one more ingredient — a prior distribution on $\mathbf{x}$ itself — and asks what estimator results when you maximize not the likelihood of the data alone, but the probability of $\mathbf{x}$ given the data.
