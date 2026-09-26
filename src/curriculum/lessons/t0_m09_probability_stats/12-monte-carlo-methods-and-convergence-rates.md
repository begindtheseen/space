---
id: l12-monte-carlo-methods-and-convergence-rates
title: Monte Carlo methods and convergence rates
minutes: 22
covers:
  - Monte Carlo methods and convergence rates
---

Suppose you want to know how often a basketball player makes a free throw. You could study the physics of the arm, the ball and the hoop. Or you could watch her take a thousand shots and count. The second way is a **Monte Carlo** method: when a question is too tangled to answer with a formula, you play the game many times at random and count what happens.

Every launch vehicle, lander and spacecraft flies on the strength of exactly this. The vehicle model is a **[[six-degree-of-freedom|six-dof]]** simulation. The uncertainties are a few hundred **dispersions** — things that vary from flight to flight: winds, thrust, mass, aerodynamics, sensor noise, ignition timing, air density. No formula carries all of that through a trajectory with guidance switching modes along the way. So you draw the dispersions at random, fly the trajectory in the computer, and repeat a few thousand times. The histogram of outcomes is the answer. "We ran two thousand cases and the worst miss distance was 41 metres" is the kind of sentence heard at every flight readiness review.

That sentence is easy to misread. Two thousand cases say almost nothing about a one-in-ten-thousand event, and the worst of two thousand draws is not a bound on anything. This lesson is about knowing exactly how much a campaign is worth. The answer is precise: the error falls as $\sigma/\sqrt{N}$, in any number of dimensions. That rate is a bargain for many inputs and a disaster for rare events, and there are tricks that buy accuracy without buying runs.

## The estimator and its error

A Monte Carlo estimate is an average. Say you want $\theta = \mathbb{E}[g(\mathbf{X})]$ (read "theta equals the expected value of g of X"). Here $\mathbf{X}$ is the random input vector — all the dispersions — with a known distribution, and $g$ is the outcome you care about, such as miss distance. Draw $\mathbf{x}_1, \ldots, \mathbf{x}_N$ independently from that distribution, run each, and average:

$$
\hat{\theta}_N = \frac{1}{N}\sum_{i=1}^{N} g(\mathbf{x}_i).
$$

The hat on $\hat{\theta}_N$ ("theta hat sub N") marks it as an estimate built from $N$ runs.

Two facts from earlier lessons do all the work. First, the expected value of an average is the average of the expected values, so $\mathbb{E}[\hat{\theta}_N] = \theta$. The estimator is **unbiased** — right on average — at every $N$. Second, the draws are independent, so their variances add. Dividing the sum by $N$ divides its variance by $N^2$:

$$
\operatorname{Var}(\hat{\theta}_N) = \frac{N\sigma_g^2}{N^2} = \frac{\sigma_g^2}{N}, \qquad
\operatorname{sd}(\hat{\theta}_N) = \frac{\sigma_g}{\sqrt{N}},
\qquad \sigma_g^2 = \operatorname{Var}\big(g(\mathbf{X})\big).
$$

Here $\sigma_g$ is the spread of a single run's outcome, and $\operatorname{sd}$ means standard deviation. The standard deviation of an estimate is called its **standard error**.

That is the whole theory. The central limit theorem says the average is roughly Gaussian around $\theta$ with that standard error, so the previous lesson's confidence interval applies directly:

$$
\hat{\theta}_N \pm z_{\alpha/2}\,\frac{s_g}{\sqrt{N}},
$$

where $s_g$ is the sample standard deviation of your $N$ outcomes and $z_{\alpha/2}$ is the Gaussian multiplier ($1.96$ for $95\%$). A Monte Carlo number quoted without this interval is incomplete, and adding it costs one line of code.

### Estimating a probability

The case that dominates requirements work is a **probability**: how often does the miss exceed $50\,\mathrm{m}$? Use an **indicator** for $g$ — a function that is $1$ when the event $A$ happens and $0$ otherwise, written $\mathbf{1}_A$. Its average is the fraction of runs in which $A$ happened, $\hat{p} = k/N$, where $k$ counts the events. An indicator's variance is $p(1-p)$, so

$$
\operatorname{sd}(\hat{p}) = \sqrt{\frac{p(1-p)}{N}}, \qquad
\frac{\operatorname{sd}(\hat{p})}{p} = \sqrt{\frac{1-p}{Np}}.
$$

The first is the **absolute error**. The second is the **relative error**, the error as a fraction of $p$ itself. The relative error is the one that bites: as $p$ shrinks toward zero, it grows without limit. That lopsidedness is the central practical fact about Monte Carlo in aerospace.

## Why $1/\sqrt{N}$, and why dimension does not matter

Think of asking people to guess the number of beans in a jar. One guess is wild. The average of a hundred guesses is much steadier, but only ten times steadier, not a hundred. The rate comes from independence and nothing else: averaging $N$ independent things divides the variance by $N$, so it divides the standard deviation by $\sqrt{N}$. Nothing about $g$, the shape of the distribution or the number of dispersions enters, as long as $\sigma_g$ is finite.

::: key Monte Carlo convergence
The standard error falls as $\sigma/\sqrt{N}$ — independent of dimension. Ten times the accuracy costs a hundred times the runs.
:::

The bad news: accuracy is expensive. A campaign that took one night to reach $\pm 1\,\mathrm{m}$ takes a hundred nights to reach $\pm 0.1\,\mathrm{m}$. No tuning changes the exponent.

The good news, and the reason Monte Carlo is used at all: $\sigma_g/\sqrt{N}$ does not contain the number of inputs. A grid method does. Suppose you tried every combination of inputs on an even grid, $m$ points along each of $n$ axes. That costs $N = m^n$ runs. With spacing $h = 1/m$, the trapezoid rule's error is of order $h^2 = N^{-2/n}$. To reach one per cent you need $h = 0.1$, so $m = 10$ points per axis and $10^n$ runs in all. This blow-up is the **[[curse of dimensionality|dimension-curse]]**:

| Dimensions $n$ | Grid points for $1\%$ | Monte Carlo runs for $1\%$ |
| --- | --- | --- |
| $1$ | $10$ | $10^4$ |
| $2$ | $10^2$ | $10^4$ |
| $4$ | $10^4$ | $10^4$ |
| $6$ | $10^6$ | $10^4$ |
| $12$ | $10^{12}$ | $10^4$ |

The Monte Carlo column assumes a relative spread $\sigma_g/\theta$ of one, so $N = (\sigma_g/(0.01\,\theta))^2 = 10^4$. The two break even near four dimensions. A real dispersion set has two or three hundred, and sampling is the standard escape.

::: example How far does a two-thousand-case campaign get you?
A lander's touchdown error has independent downrange and crossrange parts, each Gaussian with $\sigma = 12\,\mathrm{m}$. The miss distance $R = \sqrt{x^2 + y^2}$ then follows a **Rayleigh distribution**, with

$$
\mathbb{E}[R] = \sigma\sqrt{\pi/2} = 15.04\,\mathrm{m}, \qquad
\operatorname{sd}(R) = \sigma\sqrt{2 - \pi/2} = 7.86\,\mathrm{m}.
$$

Its median is $\sigma\sqrt{2\ln 2} = 1.177\sigma = 14.13\,\mathrm{m}$, the **[[circular error probable|cep]]** or CEP: half of all landings fall inside that circle.

Pretend you had only the simulation. For each campaign size, run the campaign $200$ times and measure how far its estimate of $\mathbb{E}[R]$ lands from the truth, as a root-mean-square (RMS) error:

| Runs $N$ | RMS error of the estimate | Predicted $\operatorname{sd}(R)/\sqrt{N}$ |
| --- | --- | --- |
| $100$ | $0.78\,\mathrm{m}$ | $0.79\,\mathrm{m}$ |
| $400$ | $0.41\,\mathrm{m}$ | $0.39\,\mathrm{m}$ |
| $1600$ | $0.19\,\mathrm{m}$ | $0.20\,\mathrm{m}$ |
| $6400$ | $0.095\,\mathrm{m}$ | $0.098\,\mathrm{m}$ |
| $25\,600$ | $0.051\,\mathrm{m}$ | $0.049\,\mathrm{m}$ |

Each factor of four in runs halves the error, as **[[the theory says|sqrt-n-plot]]**.

**The mean.** With $2000$ runs the standard error is $7.86/\sqrt{2000} = 0.18\,\mathrm{m}$. At $95\%$ confidence that is $\pm 1.96 \times 0.18 = \pm 0.34\,\mathrm{m}$ — excellent. To pin the mean to $\pm 0.5\,\mathrm{m}$ takes $(1.96 \times 7.86/0.5)^2 = 950$ runs; to $\pm 0.1\,\mathrm{m}$ takes $23\,700$.

**The tail.** For a Rayleigh distribution, the chance of exceeding a distance $c$ is $\exp(-c^2/2\sigma^2)$. At $c = 50\,\mathrm{m}$:

$$
P(R > 50) = \exp\!\left(-\frac{2500}{2 \times 144}\right) = \exp(-8.68) = 1.70 \times 10^{-4}.
$$

In $2000$ runs you expect $2000 \times 1.70 \times 10^{-4} = 0.34$ exceedances. So most campaigns (about $71\%$ of them) see none at all. The honest conclusion from a clean campaign is the previous lesson's rule of three: $p < 3/2000 = 1.5 \times 10^{-3}$ at $95\%$ confidence. That bound is about nine times the true value. The campaign that nails the mean to two per cent is useless on the tail.
:::

## Generating the samples

A campaign needs a stream of numbers that behave like independent draws, evenly spread between $0$ and $1$ — **uniform** draws. Then it needs a way to turn those into the dispersions the model wants.

### The generator

A **pseudorandom generator** is a fixed recipe that turns one number into the next, chosen so the output passes statistical tests for independence and evenness. Common choices — the Mersenne Twister, PCG, Philox — never repeat within any campaign. Two rules matter.

First, record the **[[seed|seed]]** — the starting number — with the results. Then any run can be reproduced exactly when it needs investigating. A Monte Carlo finding you cannot reproduce is not a finding.

Second, give each parallel worker its own independent stream. Overlapping streams quietly correlate runs and shrink the true sample size, with no warning.

### Uniform to anything

Two constructions do nearly all the work.

**[[Inverse transform sampling|inverse-transform]]**, from the random-variable lesson: if $U$ is uniform, then $X = F^{-1}(U)$ has CDF $F$. The reason is one line:

$$
P(X \leq x) = P\big(F^{-1}(U) \leq x\big) = P\big(U \leq F(x)\big) = F(x).
$$

For an exponential waiting time with rate $\lambda$ ("lambda"), $F(x) = 1 - e^{-\lambda x}$, so $F^{-1}(u) = -\ln(1-u)/\lambda$. Since $1 - U$ is also uniform, $-\ln(U)/\lambda$ works too. The same trick handles any tabulated or measured distribution.

The Gaussian has no formula for $F^{-1}$, so it gets the **Box–Muller transform**. With $U_1$ and $U_2$ independent uniforms,

$$
Z_1 = \sqrt{-2\ln U_1}\,\cos(2\pi U_2), \qquad Z_2 = \sqrt{-2\ln U_1}\,\sin(2\pi U_2)
$$

are independent standard normals. Think of it as choosing a point on a dartboard by picking a distance and a direction.

::: note Why Box–Muller works
A pair of independent standard normals $(Z_1, Z_2)$ is round: its density depends only on the distance from the centre. So its direction is uniform, which is what $2\pi U_2$ supplies. Its squared radius $Z_1^2 + Z_2^2$ is exponential with mean $2$ (you met this as $P(d \leq k) = 1 - e^{-k^2/2}$ in the Gaussian lesson). By inverse transform, $-2\ln U_1$ is exactly such an exponential. Radius and angle together rebuild the pair.
:::

### Correlated dispersions

Real dispersions are correlated: a heavy vehicle is often also a high-drag one. The linear-transformations lesson has the tool. Factor the covariance as $\mathbf{P} = \mathbf{L}\mathbf{L}^{\mathsf{T}}$, with $\mathbf{L}$ the lower-triangular Cholesky factor. Draw a vector $\mathbf{z}$ of independent standard normals and set

$$
\mathbf{x} = \boldsymbol{\mu} + \mathbf{L}\mathbf{z}.
$$

By the sandwich formula, $\mathbf{x}$ has mean $\boldsymbol{\mu}$ and covariance $\mathbf{L}\,\mathbf{I}\,\mathbf{L}^{\mathsf{T}} = \mathbf{P}$.

For a dispersion that is not Gaussian, draw the correlated Gaussians first. Push each through $\Phi$, the standard normal CDF, to get a uniform, then through the $F^{-1}$ you want. Both maps only stretch the number line without reordering it, so the ranking of values is kept. That preserves the **rank correlation**, which is usually what the dispersion table meant anyway.

::: key Monte Carlo in one box
A Monte Carlo estimate is a sample mean, unbiased, with standard error $\sigma_g/\sqrt{N}$ — independent of dimension. For a probability, $\operatorname{sd}(\hat{p}) = \sqrt{p(1-p)/N}$ and the relative error is $\sqrt{(1-p)/(Np)}$, which grows without limit as $p \to 0$.
:::

## Sizing a campaign

### For a mean

Turn the standard error around. To get a half-width $\varepsilon$ ("epsilon") at confidence $1 - \alpha$, you need

$$
N \geq \left(\frac{z_{\alpha/2}\,\sigma_g}{\varepsilon}\right)^{\!2},
$$

with $\sigma_g$ taken from a small **pilot campaign** of a few hundred runs. It is the bench-test formula of the previous lesson, with runs in place of samples.

### For a tail probability

When $p$ is small, $1 - p$ is almost $1$, so the relative error $\sqrt{(1-p)/(Np)}$ is almost $1/\sqrt{Np}$. And $Np$ is the number of events you expect to see. So think in events, not runs:

- about $10$ events resolve $p$ to $\pm 32\%$;
- about $100$ events, to $\pm 10\%$;
- about $1000$ events, to $\pm 3.2\%$.

In runs, that is

$$
N \approx \frac{10}{p} \ \text{to}\ \frac{100}{p}.
$$

Here are the relative standard errors:

| $p$ | $N = 10^4$ | $N = 10^5$ | $N = 10^6$ | $N = 10^7$ |
| --- | --- | --- | --- | --- |
| $10^{-2}$ | $10\%$ | $3.2\%$ | $1.0\%$ | $0.3\%$ |
| $10^{-3}$ | $32\%$ | $10\%$ | $3.2\%$ | $1.0\%$ |
| $10^{-4}$ | $100\%$ | $32\%$ | $10\%$ | $3.2\%$ |

::: key Sizing for a tail
$N \approx 10$ to $100/p$, so a $10^{-4}$ event needs $10^5$ to $10^6$ runs for a usable relative error of $\sqrt{(1-p)/(Np)}$.
:::

For the lander, resolving $p = 1.70 \times 10^{-4}$ to ten per cent takes $(1-p)/(0.01\,p) = 5.9 \times 10^5$ runs. At twenty seconds of computer time per trajectory, that is $5.9 \times 10^5 \times 20 / 3600 \approx 3300$ **[[core-hours|core-hours]]** — about a day and a half on a hundred cores. Feasible, but not after every design change.

At $10^{-6}$, direct sampling stops being feasible at all. Three alternatives take over:

1. **Importance sampling** — aim the draws at the failure and correct with weights. It is the last section of this lesson.
2. **[[Extreme-value fitting|extreme-value]]** — fit a tail model, such as a generalised Pareto distribution, to the runs above a high threshold, and extrapolate further out.
3. **[[Linear covariance analysis|lincov]]** — stop sampling. Propagate the covariance through a linearised model of the trajectory with the sandwich formula, wherever the linearisation can be defended.

::: warning The worst case is not a bound
The largest outcome in $N$ runs is not a limit and is not a $3\sigma$ value. It is a random variable with a distribution of its own, and it creeps upward as $N$ grows. Reporting "the worst case in $2000$ runs was $41\,\mathrm{m}$" as a limit invites two errors. It hides that a different seed would give a different worst case. And it invites the reader to treat an unknown quantile as a certified maximum. Quote an estimated probability with its interval, or an estimated quantile with its interval, and say which.
:::

## Buying accuracy without buying runs

**Variance reduction** changes the constant $\sigma_g$ in $\sigma_g/\sqrt{N}$, never the exponent. But the constants on offer are large enough to decide whether a campaign is possible at all.

### Antithetic variates

For every draw $\mathbf{z}$, also run its mirror image $-\mathbf{z}$, and average the pair. A lucky draw is paired with an unlucky one, so the pair average is steadier. Precisely, the pair average has variance

$$
\tfrac{1}{2}\big[\operatorname{Var}(g) + \operatorname{Cov}\big(g(\mathbf{z}), g(-\mathbf{z})\big)\big],
$$

against $\tfrac{1}{2}\operatorname{Var}(g)$ for two independent draws. It wins whenever that covariance is negative — whenever $g$ moves steadily one way as the inputs grow, so that the mirror moves it the other way.

Take a propellant-use model $m_p = 1150\exp(0.06 z_1 + 0.03 z_2)\,\mathrm{kg}$, with $z_1$, $z_2$ standard normal. Its mean is $1152.6\,\mathrm{kg}$ and its standard deviation $77.4\,\mathrm{kg}$, and it is nearly a straight line over the range the dispersions explore. Two independent draws give an average with variance $\operatorname{Var}(g)/2 = 2996\,\mathrm{kg^2}$. The antithetic pair gives $13.5\,\mathrm{kg^2}$ — a factor of $223$ smaller, confirmed by simulating a million pairs. That is worth two hundred times as many trajectories, and it costs nothing but the pairing. It fails, mildly, for a response symmetric in its inputs (like $z^2$), where the covariance is positive.

### Common random numbers

When comparing two designs, fly both on the *same* draws. It is like racing two runners on the same windy day, not on different days. The difference $A - B$ has variance

$$
\operatorname{Var}(A) + \operatorname{Var}(B) - 2\operatorname{Cov}(A, B).
$$

Two designs respond almost alike to the same wind and mass error, so the covariance is large. With equal variances $\sigma^2$ and a correlation of $0.95$, the difference has variance $2\sigma^2(1 - 0.95) = 0.1\sigma^2$ instead of $2\sigma^2$. That is twenty times smaller, for free, by reusing seeds. A design comparison must never use fresh dispersions for each candidate.

### Stratification and Latin hypercube sampling

Random draws clump by bad luck. **Stratification** divides an input's range into $M$ slices of equal probability and takes exactly one draw from each. This removes the part of the variance caused by uneven coverage. **Latin hypercube sampling** does it for every input at once. For a response dominated by a few inputs that add up nearly independently, it is a reliable factor of a few, at no extra cost.

### Importance sampling

This is the heavy machinery, and the one that makes rare events reachable. The idea: if failures hide in a corner, send most of your draws into that corner, then correct for having cheated.

Write the target as an integral over the true density $f$, and multiply by one in a clever form:

$$
\theta = \int g(\mathbf{x})\,f(\mathbf{x})\,d\mathbf{x}
= \int g(\mathbf{x})\,\frac{f(\mathbf{x})}{q(\mathbf{x})}\,q(\mathbf{x})\,d\mathbf{x}
= \mathbb{E}_q\!\left[g(\mathbf{X})\,w(\mathbf{X})\right],
\qquad w = \frac{f}{q}.
$$

Draw from a **proposal density** $q$ of your choosing, and weight each outcome by $w = f/q$ to undo the deliberate bias. Any $q$ that is non-zero wherever $g f$ is non-zero gives an unbiased estimate. Choose $q$ to put its draws where the event happens — for a tail, shift or widen the dispersion that drives the failure. Then almost every run is informative, instead of one in ten thousand.

The variance is $\operatorname{Var}_q(gw)/N$. It is small when $gw$ is nearly constant. It can be *worse* than direct sampling if $q$ has thinner tails than $f$, because then a rare, huge weight dominates everything. That is the one real hazard: always inspect the weights. An estimate whose few largest weights carry most of the total has not converged.

::: example Importance sampling the lander's tail
Back to the lander: $\sigma = 12\,\mathrm{m}$ per axis, and we want $P(R > 50\,\mathrm{m}) = 1.70 \times 10^{-4}$.

**Direct sampling.** One run's relative spread is $\sqrt{(1-p)/p} = 76.7$. To reach $2.4\%$ relative error needs $(76.7/0.024)^2 \approx 1.0 \times 10^7$ runs.

**Importance sampling.** Draw both error parts from a wider Gaussian $\mathcal{N}(0, s^2)$, and weight each run by the ratio of the densities:

$$
w = \frac{f(x)f(y)}{q(x)q(y)} = \frac{s^2}{\sigma^2}\exp\!\left[-\frac{x^2 + y^2}{2}\left(\frac{1}{\sigma^2} - \frac{1}{s^2}\right)\right].
$$

One run's relative spread now depends only on $s$. Working it out gives $17.2$ at $s = 15\,\mathrm{m}$, $6.13$ at $20$, $4.14$ at $25$, $3.55$ at $30$, $3.40$ at $35$ and $3.42$ at $40$. The best choice is broad and sits near $s = 35\,\mathrm{m}$. There, the proposal's own miss distance has mean $35\sqrt{\pi/2} = 43.9\,\mathrm{m}$, and $\exp(-2500/(2 \times 35^2)) = 36\%$ of its draws land beyond $50\,\mathrm{m}$. So about a third of the runs are informative, instead of one in six thousand.

At $s = 35\,\mathrm{m}$ the per-run variance is $(76.7/3.40)^2 = 510$ times smaller than direct sampling. The campaign gets the same answer for a five-hundredth of the computing.

Running it for real, $20\,000$ importance-sampled draws give $\hat{p} = 1.691 \times 10^{-4}$ with a standard error of $4.07 \times 10^{-6}$ — that is, $\pm 2.4\%$ — against the exact $1.6986 \times 10^{-4}$. Sanity check: the truth sits $0.2$ standard errors from the estimate, well inside the interval. Twenty thousand runs have done the work of ten million.

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

The catch: the proposal had to be aimed. Widening a dispersion that does not drive the failure buys nothing, and finding the ones that matter takes a pilot study and engineering judgement. So importance sampling is a specialist's tool for a known failure mode, not a default setting for a whole campaign.
:::

A last family is worth knowing by name: **[[quasi-Monte Carlo|quasi-mc]]**, which replaces random draws with carefully even ones.

## Check yourself

::: check
A pilot campaign of $200$ runs gives a mean peak dynamic pressure of $34.2\,\mathrm{kPa}$ with a sample standard deviation of $3.8\,\mathrm{kPa}$. How many runs are needed to state the mean to $\pm 0.2\,\mathrm{kPa}$ at $95\%$ confidence, and what is the interval from the pilot campaign itself?
:::

::: answer
**The pilot's own interval.** Its standard error is $3.8/\sqrt{200} = 0.269\,\mathrm{kPa}$. The $95\%$ interval is $34.2 \pm 1.96 \times 0.269 = 34.2 \pm 0.53\,\mathrm{kPa}$.

**Runs for $\pm 0.2\,\mathrm{kPa}$.** $N \geq (1.96 \times 3.8/0.2)^2 = 37.2^2 = 1387$, so about $1400$ runs.

Sanity check: shrinking the half-width from $0.53$ to $0.2$ is a factor of about $2.6$, and $2.6^2 \times 200 \approx 1400$. This is a statement about the *mean*, which needs far fewer runs than a statement about a tail of the same distribution.
:::

::: check
A campaign of $50\,000$ runs produces $8$ violations of a requirement. Estimate the violation probability, give its relative standard error, and say whether the campaign supports a claim of compliance with a $10^{-4}$ limit.
:::

::: answer
**Estimate.** $\hat{p} = 8/50\,000 = 1.6 \times 10^{-4}$.

**Relative error.** $\sqrt{(1-p)/(Np)} \approx 1/\sqrt{8} = 0.354$, about $\pm 35\%$. So the estimate is $1.6 \times 10^{-4}$ give or take about $0.57 \times 10^{-4}$.

**Verdict.** Eight events is at the very bottom of the usable range, so use an exact (Clopper–Pearson) interval rather than the Wald one. It runs from about $0.69 \times 10^{-4}$ to $3.15 \times 10^{-4}$. The point estimate already exceeds $10^{-4}$, so compliance is not demonstrated. Non-compliance is not demonstrated either, since the interval covers $10^{-4}$. Resolving this to $\pm 10\%$ would need about $100/p \approx 6 \times 10^5$ runs.
:::

::: check
Why does the Monte Carlo standard error not depend on the number of dispersed parameters, and in what sense is that an advantage over a grid?
:::

::: answer
The standard error is $\sigma_g/\sqrt{N}$. It comes only from averaging $N$ independent draws of the single outcome $g$. The length of the input vector never enters.

A grid must place points along every axis, so $N = m^n$, and its error of order $N^{-2/n}$ worsens fast as $n$ grows. Reaching $1\%$ costs about $10^n$ runs: $10^4$ at $n = 4$ and $10^{12}$ at $n = 12$. Monte Carlo stays near $10^4$ throughout. They break even near four dimensions, and a real dispersion set has hundreds.

The advantage is in dimension, not accuracy: for one smooth input, the grid wins easily ($10$ points against $10^4$ runs).
:::

::: check
You must compare two guidance gains by Monte Carlo. Why is it wrong to generate fresh dispersions for each candidate, and how much does reusing them help?
:::

::: answer
Fresh draws make the two results independent, so the difference has variance $\operatorname{Var}(A) + \operatorname{Var}(B) = 2\sigma^2$, and the comparison drowns in scatter unrelated to the gains.

Reusing the same dispersions — common random numbers — makes both runs see the same wind and the same mass error. They become strongly correlated, and the difference variance drops to $2\sigma^2(1 - \rho)$, where $\rho$ ("rho") is the correlation. At $\rho = 0.95$ that is $0.1\sigma^2$: twenty times less variance, and $\sqrt{20} \approx 4.5$ times less error in the comparison, for the cost of keeping the seeds fixed.
:::

::: check
An importance-sampling run returns an estimate whose three largest weights account for eighty per cent of the total. What has gone wrong, and what would you change?
:::

::: answer
The proposal is badly matched. It puts too few draws where $f/q$ is large, so a handful of draws with enormous weights carry the whole estimate.

The estimator is still unbiased, but its variance is dominated by barely sampled events, so the central limit theorem has not taken hold and the reported standard error is unreliable — usually too small. The usual cause is a proposal with thinner tails than the true density, or one aimed away from the event.

The repairs: widen or re-aim $q$; mix it with a fraction of the original density so that $w$ stays bounded; and judge convergence by the effective sample size rather than the nominal $N$.
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
| Grid error $N^{-2/n}$ versus $N^{-1/2}$ | Curse of dimensionality; break-even near $n = 4$ |
| $X = F^{-1}(U)$; Box–Muller; $\mathbf{x} = \boldsymbol{\mu} + \mathbf{L}\mathbf{z}$ | Inverse transform, Gaussian draws, correlated draws via the Cholesky factor |
| Antithetic $\mathbf{z}$ and $-\mathbf{z}$; common random numbers | Variance reduction; difference variance $2\sigma^2(1-\rho)$ |
| $\theta = \mathbb{E}_q[g\,w]$, $w = f/q$ | Importance sampling; unbiased for any valid $q$; inspect the weights |
| Extreme-value tail fit; linear covariance analysis | The other two escapes when direct sampling cannot reach $p$ |

The campaign now produces numbers with honest error bars. The final lesson asks whether the navigation filter inside the simulation deserves to be believed: are its actual errors consistent with the covariance it reports? The chi-square distribution supplies the test, and the Monte Carlo runs of this lesson supply the data it needs.

::: context six-dof Six ways to move
A **degree of freedom** is one independent way something can move. A rigid body in space has six: it can slide along three directions (forward, sideways, up) and turn about three axes (roll, pitch, yaw). A six-degree-of-freedom, or "6-DOF", simulation tracks all six at once, together with the engines, fins, sensors and flight software that push on them. It is the most faithful — and slowest — model of a flight, which is why each Monte Carlo run of one can take tens of seconds.
:::

::: context dimension-curse A grid explodes, sampling does not
Grid points needed for $1\%$ accuracy (blue bars, on a scale where each step up is ten times more) against the flat $10^4$ runs Monte Carlo needs in any dimension (red line). The bars cross the line at four dimensions.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="150" x2="345" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="150" x2="50" y2="25" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="65" y="140" width="40" height="10" fill="#8fb8f0"/>
  <rect x="120" y="130" width="40" height="20" fill="#8fb8f0"/>
  <rect x="175" y="110" width="40" height="40" fill="#8fb8f0"/>
  <rect x="230" y="90" width="40" height="60" fill="#8fb8f0"/>
  <rect x="285" y="30" width="40" height="120" fill="#1d6fd1"/>
  <line x1="50" y1="110" x2="345" y2="110" stroke="#b4232c" stroke-width="2" stroke-dasharray="6,4"/>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="45" y="154">1</text><text x="45" y="114">10⁴</text><text x="45" y="34">10¹²</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="85" y="166">n=1</text><text x="140" y="166">n=2</text><text x="195" y="166">n=4</text><text x="250" y="166">n=6</text><text x="305" y="166">n=12</text>
  </g>
  <text x="120" y="104" font-size="11" fill="#b4232c">Monte Carlo: 10⁴ runs</text>
  <text x="60" y="20" font-size="11" fill="#1f2a44">runs for 1% accuracy (log scale)</text>
</svg>
```
:::

::: context cep An old artillery yardstick
**Circular error probable** started as a way to rate the accuracy of guns and bombs, and was later used for missiles: draw the circle around the aim point that catches half the shots. Its radius is the median miss distance. For a round Gaussian scatter with spread $\sigma$ on each axis it is $1.177\sigma$. A CEP says nothing about the far tail, though — a weapon or lander with a small CEP can still have rare wild misses, and a requirement about those needs the tail analysis in this lesson.
:::

::: context sqrt-n-plot The slope of one half
The table's RMS errors (dots) against the prediction $7.86/\sqrt{N}$ (line), both axes on logarithmic scales. On such a plot, "error proportional to $1/\sqrt{N}$" is a straight line falling one step for every two steps across: multiply $N$ by $100$ and the error drops by $10$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 185" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="150" x2="340" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="60" y1="150" x2="60" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="60" y1="29.7" x2="330" y2="141.7" stroke="#1d6fd1" stroke-width="2"/>
  <g fill="#b4232c">
    <circle cx="60" cy="30.2" r="4"/><circle cx="127.5" cy="55.5" r="4"/><circle cx="195" cy="86.9" r="4"/>
    <circle cx="262.5" cy="115" r="4"/><circle cx="330" cy="140" r="4"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="166">100</text><text x="172.1" y="166">1000</text><text x="284.2" y="166">10 000</text>
    <text x="200" y="181">runs N</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="172.1" y1="150" x2="172.1" y2="155"/><line x1="284.2" y1="150" x2="284.2" y2="155"/>
    <line x1="55" y1="20" x2="60" y2="20"/><line x1="55" y1="113" x2="60" y2="113"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="52" y="24">1 m</text><text x="52" y="117">0.1 m</text>
  </g>
  <text x="200" y="45" font-size="11" fill="#1d6fd1">predicted 7.86/√N</text>
  <text x="200" y="60" font-size="11" fill="#b4232c">measured RMS error</text>
</svg>
```
:::

::: context seed Randomness you can replay
A pseudorandom generator is a machine that always does the same thing. Give it the same starting number — the **seed** — and it produces the same "random" stream, every time, on every computer. That sounds like a flaw, but it is a gift: when run 1417 of a campaign crashes the lander, you can re-run exactly run 1417 with extra logging switched on. Teams store the seed next to every result for this reason.
:::

::: context inverse-transform Running the CDF backwards
Pick a uniform number $u$ on the vertical axis, go across to the CDF curve, and drop down: the $x$ you land on is your sample. Here the curve is the exponential CDF $F(x) = 1 - e^{-x}$, and $u = 0.7$ lands at $x = -\ln 0.3 = 1.20$. Where the curve is steep, many values of $u$ land close together, so samples crowd where the density is high — exactly as they should.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="170" x2="40" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="30" x2="340" y2="30" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4,4"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40.0,170.0 47.2,156.7 54.5,144.6 61.8,133.7 69.0,123.8 76.2,114.9 83.5,106.8 90.8,99.5 98.0,92.9 105.2,86.9 112.5,81.5 119.8,76.6 127.0,72.2 134.2,68.2 141.5,64.5 148.8,61.2 156.0,58.3 163.2,55.6 170.5,53.1 177.8,50.9 185.0,48.9 192.2,47.1 199.5,45.5 206.8,44.0 214.0,42.7 221.2,41.5 228.5,40.4 235.8,39.4 243.0,38.5 250.3,37.7 257.5,37.0 264.8,36.3 272.0,35.7 279.2,35.2 286.5,34.7 293.8,34.2 301.0,33.8 308.2,33.5 315.5,33.1 322.8,32.8 330.0,32.6"/>
  <line x1="40" y1="72" x2="127.3" y2="72" stroke="#b4232c" stroke-width="2"/>
  <line x1="127.3" y1="72" x2="127.3" y2="170" stroke="#b4232c" stroke-width="2"/>
  <polygon points="127.3,170 122.3,160 132.3,160" fill="#b4232c"/>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="35" y="174">0</text><text x="35" y="76">0.7</text><text x="35" y="34">1</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="127.3" y="186">1.20</text><text x="185" y="186">2</text><text x="330" y="186">4</text><text x="260" y="186">x</text>
  </g>
  <text x="200" y="64" font-size="11" fill="#1d6fd1">F(x) = 1 − e^(−x)</text>
  <text x="45" y="64" font-size="11" fill="#b4232c">u</text>
</svg>
```
:::

::: context core-hours Measuring computer time
A **core** is one processor inside a computer; a modern server has dozens. A **core-hour** is one core busy for one hour. $3300$ core-hours could be one core running for about $140$ days, or a hundred cores running for about a day and a half. Because Monte Carlo runs are independent, they split perfectly across cores, which is why campaigns run on large computer clusters overnight.
:::

::: context extreme-value Modelling only the tail
Extreme-value theory is the branch of statistics built for floods, storms and material failures. Its key result says that, far enough out, the tails of a very wide range of distributions look like one family — the generalised Pareto distribution. So you fit that shape to the few hundred runs beyond a high threshold and use it to extrapolate to probabilities your campaign never sampled. The result is only as good as the assumption that the fitted shape still holds further out, so it is quoted with care.
:::

::: context lincov Sampling without samples
Linear covariance analysis, often called **LinCov**, carries the mean and covariance of the errors along the trajectory with the rule $\mathbf{P} \to \mathbf{F}\mathbf{P}\mathbf{F}^{\mathsf{T}} + \mathbf{Q}$ from the linear-transformations lesson, instead of flying thousands of random cases. One LinCov run gives the whole statistical answer in the time of a single simulation. The price is that it trusts a linearised model, so it misses effects like mode switches and saturation. Engineers often use LinCov for fast trade studies and Monte Carlo to confirm the final design.
:::

::: context quasi-mc Evenly spread instead of random
**Quasi-Monte Carlo** replaces the random draws with a low-discrepancy sequence, such as a Sobol or Halton sequence, that fills the space more evenly than chance does. For smooth outcomes its error falls roughly as $(\ln N)^n/N$ rather than $N^{-1/2}$, a real gain in moderate dimension. The price is that the samples are not independent, so this lesson's confidence interval no longer applies. The usual repair is to scramble the sequence randomly and run a handful of independent copies, taking their scatter as the error bar. For an outcome with jumps, such as a guidance mode switch, most of the advantage disappears.
:::
