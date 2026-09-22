---
id: l12-monte-carlo-methods-and-convergence-rates
title: Monte Carlo methods and convergence rates
minutes: 25
covers:
  - Monte Carlo methods and convergence rates
---

Every launch vehicle, lander and spacecraft flies on the strength of a Monte Carlo campaign. The vehicle model is a few hundred thousand lines of six-degree-of-freedom simulation; the uncertainties are a few hundred dispersions — winds, thrust and mass properties, aerodynamic coefficients, sensor noise, actuator lag, ignition timing, atmospheric density. No formula propagates that through a nonlinear, discontinuous, guidance-in-the-loop trajectory. So you draw the dispersions at random, fly the trajectory, and do it again a few thousand times, and the histogram of outcomes is the answer. "We ran two thousand cases and the worst miss distance was 41 metres" is the currency of flight readiness reviews.

That currency is easy to forge. Two thousand cases say almost nothing about a one-in-ten-thousand event, and the worst case out of two thousand draws is not a bound on anything. The value of this lesson is knowing exactly how much a campaign of a given size is worth, which is a question with a precise answer: the Monte Carlo error falls as $\sigma/\sqrt{N}$, always, in every dimension, and every estimate a campaign produces should be reported with the confidence interval the previous lesson built.

This lesson sets out the estimator and its error, explains why the convergence rate is what it is and why that rate is a bargain in high dimensions and a disaster in the tails, shows how the samples are generated, gives sizing rules for means and for rare events, and then covers the three techniques — antithetic variates, common random numbers and importance sampling — that buy accuracy without buying runs.

## The estimator and its error

A Monte Carlo estimate is a sample mean. To estimate $\theta = \mathbb{E}[g(\mathbf{X})]$ for some quantity of interest $g$ and a random input vector $\mathbf{X}$ with known distribution, draw $\mathbf{x}_1, \ldots, \mathbf{x}_N$ independently from that distribution and form

$$
\hat{\theta}_N = \frac{1}{N}\sum_{i=1}^{N} g(\mathbf{x}_i).
$$

By linearity $\mathbb{E}[\hat{\theta}_N] = \theta$, so the estimator is unbiased at every $N$, and because the draws are independent the variances add:

$$
\operatorname{Var}(\hat{\theta}_N) = \frac{\sigma_g^2}{N}, \qquad
\operatorname{sd}(\hat{\theta}_N) = \frac{\sigma_g}{\sqrt{N}},
\qquad \sigma_g^2 = \operatorname{Var}\big(g(\mathbf{X})\big).
$$

That is the whole theory. The law of large numbers says the estimate converges; the central limit theorem says it is approximately Gaussian about $\theta$ with that standard deviation, so the interval

$$
\hat{\theta}_N \pm z_{\alpha/2}\,\frac{s_g}{\sqrt{N}}
$$

with $s_g$ the sample standard deviation of the $N$ outcomes is a confidence interval for $\theta$. A Monte Carlo number quoted without that interval is incomplete: the campaign itself tells you how much to trust it, and it costs one extra line of code to say so.

The special case that dominates requirements work is a **probability**. Setting $g = \mathbf{1}_A$, the indicator of the event $A$, makes $\theta = P(A)$ and $\hat{\theta}_N = k/N$, the fraction of runs in which $A$ happened. The variance of an indicator is $p(1-p)$, so

$$
\operatorname{sd}(\hat{p}) = \sqrt{\frac{p(1-p)}{N}}, \qquad
\frac{\operatorname{sd}(\hat{p})}{p} = \sqrt{\frac{1-p}{Np}}.
$$

The absolute error behaves well; the **relative** error is the one that bites, and it blows up as $p \to 0$. That asymmetry is the central practical fact about Monte Carlo in aerospace, and the section on sizing makes it quantitative.

## Why $1/\sqrt{N}$, and why dimension does not matter

The rate comes from the independence of the draws and nothing else. Averaging $N$ independent things divides the variance by $N$ and the standard deviation by $\sqrt{N}$. Nothing about $g$, the shape of the distribution or the number of dispersions enters, provided $\sigma_g$ is finite.

Two consequences follow. The first is bad news: accuracy is expensive. Ten times the accuracy costs a hundred times the runs, and a campaign that took a night to reach $\pm 1\,\mathrm{m}$ takes three months to reach $\pm 0.1\,\mathrm{m}$. There is no tuning and no better implementation that changes the exponent.

The second is the reason Monte Carlo is used at all: $\sigma_g/\sqrt{N}$ does not contain the dimension. A deterministic quadrature rule on a grid does. Lay $m$ points along each of $n$ axes and you have used $N = m^n$ evaluations with spacing $h = 1/m$, and the trapezoid rule's error is of order $h^2 = N^{-2/n}$. To reach one per cent in $n$ dimensions costs about $10^{n}$ grid evaluations:

| Dimensions $n$ | Grid points for $1\%$ | Monte Carlo runs for $1\%$ |
| --- | --- | --- |
| $1$ | $10$ | $10^4$ |
| $2$ | $10^2$ | $10^4$ |
| $4$ | $10^4$ | $10^4$ |
| $6$ | $10^6$ | $10^4$ |
| $12$ | $10^{12}$ | $10^4$ |

The Monte Carlo column assumes a relative standard deviation $\sigma_g/\theta$ of one, so $N = (\sigma_g/(0.01\theta))^2 = 10^4$. The crossover is around four dimensions, and a dispersion set has two or three hundred. This is the **curse of dimensionality**, and sampling is the standard escape from it.

::: example How far does a two-thousand-case campaign get you?
A lander's touchdown error has independent downrange and crossrange components, each Gaussian with $\sigma = 12\,\mathrm{m}$. The radial miss distance $R = \sqrt{x^2 + y^2}$ is then Rayleigh distributed, with

$$
\mathbb{E}[R] = \sigma\sqrt{\pi/2} = 15.04\,\mathrm{m}, \qquad
\operatorname{sd}(R) = \sigma\sqrt{2 - \pi/2} = 7.86\,\mathrm{m},
$$

and median $\sigma\sqrt{2\ln 2} = 1.177\sigma = 14.13\,\mathrm{m}$, the **circular error probable** or CEP. Suppose you did not know these formulas and had only the simulation. Drawing samples and averaging, the root-mean-square error of the estimate of $\mathbb{E}[R]$ over two hundred independent repetitions of each campaign size comes out as

| Runs $N$ | RMS error of $\hat{\mathbb{E}}[R]$ | Predicted $\operatorname{sd}(R)/\sqrt{N}$ |
| --- | --- | --- |
| $100$ | $0.80\,\mathrm{m}$ | $0.79\,\mathrm{m}$ |
| $400$ | $0.36\,\mathrm{m}$ | $0.39\,\mathrm{m}$ |
| $1600$ | $0.20\,\mathrm{m}$ | $0.20\,\mathrm{m}$ |
| $6400$ | $0.092\,\mathrm{m}$ | $0.098\,\mathrm{m}$ |
| $25\,600$ | $0.051\,\mathrm{m}$ | $0.049\,\mathrm{m}$ |

Each factor of four in runs halves the error, exactly as the theory says. So $2000$ runs estimate the mean miss to about $\pm 0.34\,\mathrm{m}$ of standard error, or $\pm 0.69\,\mathrm{m}$ at $95\%$ confidence — excellent. Pinning the mean to $\pm 0.5\,\mathrm{m}$ at $95\%$ takes $(1.96 \times 7.86/0.5)^2 = 950$ runs; to $\pm 0.1\,\mathrm{m}$ takes $23\,700$.

Now the tail. The true probability of exceeding $50\,\mathrm{m}$ is $\exp(-c^2/2\sigma^2) = \exp(-2500/288) = 1.70 \times 10^{-4}$. In $2000$ runs the expected number of exceedances is $0.34$: most campaigns see none at all, and the honest conclusion from a clean campaign is the rule of three, $p < 3/2000 = 1.5 \times 10^{-3}$ at $95\%$ confidence — a bound nine times above the truth. The same campaign that nails the mean to four per cent is useless on the tail, and no amount of staring at the worst of the $2000$ outcomes changes that.
:::

## Generating the samples

A Monte Carlo campaign needs a stream of numbers that behave like independent uniforms on $[0, 1)$ and then a way to turn them into the dispersions the model wants.

**The generator.** A pseudorandom generator is a deterministic recursion whose output passes statistical tests for independence and uniformity. Modern default choices — the Mersenne Twister, PCG, Philox — all have periods far beyond any campaign. Two rules matter in practice. Record the **seed** with the results, so that any run can be reproduced exactly when it needs investigating; a Monte Carlo finding you cannot reproduce is not a finding. And give independent tasks independent streams rather than letting parallel workers share or re-seed a single generator, since overlapping streams silently correlate runs and shrink the effective sample size without any warning.

**Uniform to anything.** Two constructions do nearly all the work.

- **Inverse transform.** If $U$ is uniform then $X = F^{-1}(U)$ has CDF $F$, since $P(X \leq x) = P(U \leq F(x)) = F(x)$. This gives exponential waiting times as $-\ln(U)/\lambda$, and it handles any tabulated or empirical distribution.
- **Box–Muller.** For Gaussians there is no closed-form $F^{-1}$, so use the polar trick: with $U_1, U_2$ independent uniforms,
  $$
  Z_1 = \sqrt{-2\ln U_1}\,\cos(2\pi U_2), \qquad Z_2 = \sqrt{-2\ln U_1}\,\sin(2\pi U_2)
  $$
  are independent standard normals. The reason is that $-2\ln U_1$ is exponential with mean $2$, which is exactly the distribution of $Z_1^2 + Z_2^2$, and $2\pi U_2$ spreads that radius uniformly in angle, which is the circular symmetry of a two-dimensional standard Gaussian.

**Correlated dispersions.** Real dispersion sets are correlated: a heavy vehicle is usually also a high-drag vehicle. The linear-transformations lesson supplies the machinery. Factor the covariance as $\mathbf{P} = \mathbf{L}\mathbf{L}^{\mathsf{T}}$ with $\mathbf{L}$ the Cholesky factor, draw a vector $\mathbf{z}$ of independent standard normals, and set $\mathbf{x} = \boldsymbol{\mu} + \mathbf{L}\mathbf{z}$, which has mean $\boldsymbol{\mu}$ and covariance $\mathbf{L}\mathbf{L}^{\mathsf{T}} = \mathbf{P}$ by the sandwich formula. For a non-Gaussian marginal, draw the correlated Gaussians, map each through $\Phi$ to a uniform and then through the desired $F^{-1}$; this preserves the rank correlation, which is usually what the dispersion table meant anyway.

::: key
A Monte Carlo estimate is a sample mean, unbiased, with standard error $\sigma_g/\sqrt{N}$ — independent of dimension. Ten times the accuracy costs a hundred times the runs. For a probability, $\operatorname{sd}(\hat{p}) = \sqrt{p(1-p)/N}$ and the relative error is $\sqrt{(1-p)/(Np)}$, which grows without limit as $p \to 0$.
:::

## Sizing a campaign

For a **mean**, invert the standard error. To achieve a half-width $\varepsilon$ at confidence $1 - \alpha$,

$$
N \geq \left(\frac{z_{\alpha/2}\,\sigma_g}{\varepsilon}\right)^{\!2},
$$

with $\sigma_g$ taken from a small pilot campaign of a few hundred runs. This is the same formula that sized the bench test in the previous lesson, with runs in place of samples.

For a **tail probability** $p$, the relative standard error $\sqrt{(1-p)/(Np)}$ is essentially $1/\sqrt{Np}$ when $p$ is small, and $Np$ is the expected number of events in the campaign. So the sizing rule is written directly in terms of that count: to resolve $p$ to $\pm 32\%$ you need about ten events, to $\pm 10\%$ about a hundred, and to $\pm 3.2\%$ about a thousand. In runs,

$$
N \approx \frac{10}{p} \ \text{to}\ \frac{100}{p}.
$$

| $p$ | $N = 10^4$ | $N = 10^5$ | $N = 10^6$ | $N = 10^7$ |
| --- | --- | --- | --- | --- |
| $10^{-2}$ | $10\%$ | $3.2\%$ | $1.0\%$ | $0.3\%$ |
| $10^{-3}$ | $32\%$ | $10\%$ | $3.2\%$ | $1.0\%$ |
| $10^{-4}$ | $100\%$ | $32\%$ | $10\%$ | $3.2\%$ |

The entries are relative standard errors. Read off the practical rule: a $10^{-4}$ requirement needs $10^5$ to $10^6$ direct runs before the answer is worth quoting. For the lander above, resolving $p = 1.7 \times 10^{-4}$ to ten per cent takes $5.9 \times 10^5$ runs; at twenty seconds of CPU per six-degree-of-freedom trajectory that is $3300$ core-hours, about a day and a half on a hundred cores — feasible, but not something you repeat after every design change. At $10^{-6}$ the direct approach stops being feasible at all, and three alternatives take over: **importance sampling**, below; fitting an extreme-value model such as a generalised Pareto distribution to the runs above a high threshold and extrapolating; or abandoning sampling in favour of **linear covariance analysis**, propagating the covariance analytically through the linearised trajectory wherever the linearisation is defensible.

::: warning
The largest outcome in $N$ runs is not a bound and is not a $3\sigma$ value. It is a random variable, it grows slowly with $N$, and it has a distribution of its own. Reporting "the worst case in $2000$ runs was $41\,\mathrm{m}$" as though it were a limit invites two errors at once: it hides that a re-run with a different seed would produce a different worst case, and it invites the reader to treat an unknown quantile as a certified maximum. Quote an estimated probability with its interval, or an estimated quantile with its interval, and say which.
:::

## Buying accuracy without buying runs

Variance reduction changes the constant $\sigma_g$ rather than the exponent in $\sigma_g/\sqrt{N}$, and the constants available are large enough to decide whether a campaign is possible.

**Antithetic variates.** For each draw $\mathbf{z}$, also run $-\mathbf{z}$, and average the pair. The pair average has variance $\tfrac{1}{2}\big[\operatorname{Var}(g) + \operatorname{Cov}(g(\mathbf{z}), g(-\mathbf{z}))\big]$, against $\tfrac{1}{2}\operatorname{Var}(g)$ for two independent draws, so the technique wins whenever the covariance is negative — that is, whenever $g$ is monotone in the inputs, so that a favourable draw is paired with an unfavourable one. It costs nothing but the pairing, and it fails, mildly, for a response that is symmetric in its inputs, where the covariance is positive.

**Common random numbers.** When comparing two designs, fly both on the *same* draws. The estimate of the difference then has variance $\operatorname{Var}(A) + \operatorname{Var}(B) - 2\operatorname{Cov}(A, B)$, and since the two designs respond to the same wind and the same mass error almost identically, that covariance is large. For equal variances $\sigma^2$ and a correlation of $0.95$, the variance of the difference is $2\sigma^2(1 - 0.95) = 0.1\sigma^2$ instead of $2\sigma^2$: a twentyfold reduction, for free, by reusing seeds. This is why a design comparison must never be run against fresh dispersions for each candidate.

**Stratification and Latin hypercube sampling.** Divide an input's range into $M$ equal-probability strata and take exactly one draw from each, instead of $M$ draws that may cluster. This removes the part of the variance due to uneven coverage of that input. Latin hypercube sampling does it in every dimension at once, and for a response dominated by a few near-additive inputs it is a reliable factor of a few for no extra cost.

**Importance sampling.** The heavy machinery, and the one that makes rare events reachable. Write the target as an integral and multiply by one:

$$
\theta = \int g(\mathbf{x})\,f(\mathbf{x})\,d\mathbf{x}
= \int g(\mathbf{x})\,\frac{f(\mathbf{x})}{q(\mathbf{x})}\,q(\mathbf{x})\,d\mathbf{x}
= \mathbb{E}_q\!\left[g(\mathbf{X})\,w(\mathbf{X})\right],
\qquad w = \frac{f}{q}.
$$

Draw from a proposal density $q$ of your choosing instead of the true density $f$, and weight each outcome by $w = f/q$ to undo the bias you deliberately introduced. Any $q$ that is non-zero wherever $g f$ is gives an unbiased estimate. Choose $q$ to put most of its mass where the event happens — for a tail, shift or inflate the dispersion that drives the failure — and almost every run becomes informative instead of one in ten thousand. The variance is $\operatorname{Var}_q(gw)/N$, which is small when $gw$ is nearly constant, and which can be *worse* than direct sampling if $q$ has thinner tails than $f$, because then a rare large weight dominates everything. That is the one real hazard: always inspect the weights, and treat an estimate whose largest few weights carry most of the total as unconverged.

::: example Importance sampling the lander's tail
Take the lander again: $\sigma = 12\,\mathrm{m}$ per axis, and the quantity wanted is $P(R > 50\,\mathrm{m}) = 1.70 \times 10^{-4}$. Direct sampling has a per-run relative standard deviation of $\sqrt{(1-p)/p} = 76.7$, so reaching $2.4\%$ relative error would take $(76.7/0.024)^2 \approx 1.0 \times 10^7$ runs.

Instead draw both error components from $\mathcal{N}(0, s^2)$ with an inflated $s$, and weight each run by

$$
w = \frac{f(x)f(y)}{q(x)q(y)} = \frac{s^2}{\sigma^2}\exp\!\left[-\frac{x^2 + y^2}{2}\left(\frac{1}{\sigma^2} - \frac{1}{s^2}\right)\right].
$$

The per-run relative standard deviation is a function of $s$ alone, and evaluating it gives $17.2$ at $s = 15\,\mathrm{m}$, $6.13$ at $20$, $4.14$ at $25$, $3.55$ at $30$, $3.40$ at $35$ and $3.42$ at $40$. The optimum is broad and sits near $s = 35\,\mathrm{m}$, roughly where the threshold divided by the number of effective dimensions puts most of the proposal's mass just inside the failure region. At that setting the per-run variance is $(76.7/3.40)^2 = 510$ times smaller than direct sampling: the campaign gets the same answer for a five-hundredth of the compute.

Running it for real, $20\,000$ importance-sampled trajectories give $\hat{p} = 1.691 \times 10^{-4}$ with a standard error of $4.07 \times 10^{-6}$, that is $\pm 2.4\%$, against the exact $1.6986 \times 10^{-4}$. Twenty thousand runs have done the work of ten million.

```python
import math
import random


def tail_by_importance_sampling(sigma, c, scale, n, seed=9):
    """P(radial miss > c) for two independent N(0, sigma^2) error components,
    drawing instead from the inflated N(0, scale^2) and reweighting."""
    rng = random.Random(seed)
    k = 0.5 * (1.0 / sigma**2 - 1.0 / scale**2)
    total = total_sq = 0.0
    for _ in range(n):
        x, y = rng.gauss(0.0, scale), rng.gauss(0.0, scale)
        r2 = x * x + y * y
        w = (scale / sigma) ** 2 * math.exp(-k * r2) if r2 > c * c else 0.0
        total += w
        total_sq += w * w
    est = total / n
    return est, math.sqrt((total_sq / n - est * est) / n)


est, se = tail_by_importance_sampling(12.0, 50.0, 35.0, 20_000)
print(est, se, se / est)

# 0.00016910968641209358 4.0706036247584435e-06 0.024070789267736124
# exact value exp(-50**2 / (2 * 12**2)) = 0.00016985667656141068
```

The catch is that the proposal had to be aimed. Inflating a dispersion that does not drive the failure buys nothing, and in a real campaign the aiming takes a pilot study to find which dispersions matter. That is engineering judgement that the method does not supply, which is why importance sampling is a specialist's tool applied to a known failure mode rather than a default setting for the whole campaign.
:::

::: note
**Quasi-Monte Carlo** replaces the random draws with a low-discrepancy sequence — Sobol or Halton — that covers the unit cube more evenly than chance allows. For smooth integrands its error falls roughly as $(\ln N)^n/N$ rather than $N^{-1/2}$, a real gain in moderate dimension. The price is that the samples are not independent, so the confidence interval of this lesson does not apply; the standard repair is to randomise the sequence and run a handful of independent replicates, taking their scatter as the error bar. For a discontinuous response, which is what a guidance mode switch produces, the advantage largely evaporates.
:::

## Check yourself

::: check
A pilot campaign of $200$ runs gives a mean peak dynamic pressure of $34.2\,\mathrm{kPa}$ with a sample standard deviation of $3.8\,\mathrm{kPa}$. How many runs are needed to state the mean to $\pm 0.2\,\mathrm{kPa}$ at $95\%$ confidence, and what is the interval from the pilot campaign itself?
:::

::: answer
The pilot's standard error is $3.8/\sqrt{200} = 0.269\,\mathrm{kPa}$, so its own $95\%$ interval is $34.2 \pm 1.96 \times 0.269 = 34.2 \pm 0.53\,\mathrm{kPa}$. For a half-width of $0.2\,\mathrm{kPa}$, $N \geq (1.96 \times 3.8/0.2)^2 = (37.2)^2 = 1387$, so about $1400$ runs. Note that this is a statement about the *mean*, which needs far fewer runs than a statement about a tail of the same distribution.
:::

::: check
A campaign of $50\,000$ runs produces $8$ violations of a requirement. Estimate the violation probability, give its relative standard error, and say whether the campaign supports a claim of compliance with a $10^{-4}$ limit.
:::

::: answer
$\hat{p} = 8/50\,000 = 1.6 \times 10^{-4}$, with relative standard error $\sqrt{(1-p)/(Np)} \approx 1/\sqrt{8} = 0.354$, that is $\pm 35\%$: the estimate is $1.6 \times 10^{-4}$ give or take about $0.57 \times 10^{-4}$. Eight events is at the very bottom of the usable range, so use an exact interval rather than the Wald one. The point estimate already exceeds $10^{-4}$, so compliance is certainly not demonstrated; neither is non-compliance, since the interval comfortably covers $10^{-4}$. Resolving this to $\pm 10\%$ would need about $100/p = 6 \times 10^5$ runs.
:::

::: check
Why does the Monte Carlo standard error not depend on the number of dispersed parameters, and in what sense is that an advantage over a grid?
:::

::: answer
The standard error is $\sigma_g/\sqrt{N}$, and it comes only from averaging $N$ independent draws of the scalar outcome $g$; the dimension of the input vector never enters. A grid rule must place points along every axis, so $N = m^n$ and its error of order $N^{-2/n}$ degrades rapidly with $n$: reaching $1\%$ costs about $10^n$ evaluations, which is $10^4$ at $n = 4$ and $10^{12}$ at $n = 12$, while Monte Carlo stays at about $10^4$ throughout. The crossover is near four dimensions, and a real dispersion set has hundreds, so sampling is the only option. The advantage is in dimension, not in accuracy: for one smooth dimension the grid wins easily.
:::

::: check
You must compare two guidance gains by Monte Carlo. Why is it wrong to generate fresh dispersions for each candidate, and how much does reusing them help?
:::

::: answer
Fresh draws make the two results independent, so the variance of the estimated difference is $\operatorname{Var}(A) + \operatorname{Var}(B) = 2\sigma^2$ and the comparison is swamped by run-to-run scatter that has nothing to do with the gains. Reusing the same dispersions — common random numbers — makes the two runs respond to the same wind and the same mass error, so they are strongly correlated and the difference variance drops to $2\sigma^2(1 - \rho)$. At $\rho = 0.95$ that is $0.1\sigma^2$, a twentyfold reduction in variance and more than a fourfold reduction in the error of the comparison, at no cost beyond keeping the seeds fixed.
:::

::: check
An importance-sampling run returns an estimate whose three largest weights account for eighty per cent of the total. What has gone wrong, and what would you change?
:::

::: answer
The proposal is badly matched: it is putting too little mass in the region where $f/q$ is large, so a handful of draws with enormous weights carry the estimate. The estimator is still unbiased, but its variance is dominated by events that have barely been sampled, the central limit theorem has not taken hold, and the reported standard error is itself unreliable and typically too small. The usual cause is a proposal with thinner tails than the true density, or one shifted away from where the event actually occurs. The repairs are to widen or re-aim $q$, to mix it with a fraction of the original density so that $w$ is bounded, and to check convergence by watching the effective sample size rather than trusting the nominal $N$.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\hat{\theta}_N = \frac{1}{N}\sum_i g(\mathbf{x}_i)$ | Monte Carlo estimator; unbiased at every $N$ |
| $\operatorname{sd}(\hat{\theta}_N) = \sigma_g/\sqrt{N}$ | Convergence rate; independent of dimension; ten times the accuracy costs $100\times$ the runs |
| $\hat{\theta}_N \pm z_{\alpha/2}s_g/\sqrt{N}$ | The interval every Monte Carlo result should carry |
| $\hat{p} = k/N$, $\operatorname{sd}(\hat{p}) = \sqrt{p(1-p)/N}$ | Probability from an indicator; relative error $\sqrt{(1-p)/(Np)}$ |
| $N \approx 10/p$ to $100/p$ | Tail sizing: $10$ events for $\pm 32\%$, $100$ for $\pm 10\%$; $10^{-4}$ needs $10^5$–$10^6$ runs |
| $N \geq (z_{\alpha/2}\sigma_g/\varepsilon)^2$ | Runs for a mean to half-width $\varepsilon$ |
| Grid error $N^{-2/n}$ versus $N^{-1/2}$ | Curse of dimensionality; crossover near $n = 4$ |
| $X = F^{-1}(U)$; Box–Muller; $\mathbf{x} = \boldsymbol{\mu} + \mathbf{L}\mathbf{z}$ | Inverse transform, Gaussian draws, correlated draws via the Cholesky factor |
| Antithetic $\mathbf{z}$ and $-\mathbf{z}$; common random numbers | Variance reduction; difference variance $2\sigma^2(1-\rho)$ |
| $\theta = \mathbb{E}_q[g\,w]$, $w = f/q$ | Importance sampling; unbiased for any valid $q$; inspect the weights |
| Extreme-value tail fit; linear covariance analysis | The other two escapes when direct sampling cannot reach $p$ |

The campaign has now produced numbers with honest error bars. The final lesson asks the question that decides whether the simulation and the filter inside it deserve to be believed at all: are the filter's own error statistics consistent with the covariance it reports? The chi-square distribution provides the test, and the Monte Carlo machinery of this lesson provides the runs it needs.
