---
id: l11-confidence-intervals-and-hypothesis-testing
title: Confidence intervals and hypothesis testing
minutes: 23
covers:
  - confidence intervals and hypothesis testing
---

A number without an uncertainty is not a measurement, and an engineering decision made on a point estimate alone is a guess wearing a decimal point. The previous lesson produced estimates: a gyro bias of $0.574\,^\circ/\mathrm{h}$, a scale factor of $1.00190$, a correlation time of $103.7\,\mathrm{s}$, a failure fraction of $0.0115$. Each came with a variance from the Fisher information. This lesson turns that variance into two things an engineer can actually use: an **interval** that states how well the parameter is pinned down, and a **test** that decides whether a difference you can see is a difference you should believe.

Both appear constantly in flight programmes. A rate-table calibration asks whether the measured scale-factor error is real or is bench noise. An acceptance test asks whether a delivered IMU meets its noise specification. A Monte Carlo campaign asks whether the observed violation rate is consistent with a requirement of one per cent. A flight-data review asks whether the navigation solution's mean error shifted after a software change. Every one of these is a hypothesis test with a confidence interval attached, and getting the logic right matters more than the arithmetic, because the most common failure is not a miscalculation but a claim the data do not support.

The lesson builds the interval first, then shows what "95 per cent confidence" does and does not mean, then handles the very common case in which the noise level is itself estimated from the same small sample, and finally assembles the testing machinery — null hypothesis, significance, p-value, the two kinds of error, and the sample size needed to detect an effect you care about.

## From a point estimate to an interval

Every estimator is a random variable: run the bench test again and you get a different $\bar{x}$. Its distribution over hypothetical repetitions is the **sampling distribution**, and its standard deviation is the **standard error**. For the mean of $N$ independent samples of a quantity with standard deviation $\sigma$, the expectation lesson established

$$
\operatorname{sd}(\bar{x}) = \frac{\sigma}{\sqrt{N}},
$$

and the central limit theorem says $\bar{x}$ is approximately Gaussian around the true $\mu$ whatever the shape of the individual samples, exactly Gaussian if they are.

That is enough to build an interval. If $\bar{x} \sim \mathcal{N}(\mu, \sigma^2/N)$ then the standardised error $(\bar{x} - \mu)\sqrt{N}/\sigma$ is standard normal, so for any $\alpha$,

$$
P\!\left(-z_{\alpha/2} \leq \frac{\bar{x} - \mu}{\sigma/\sqrt{N}} \leq z_{\alpha/2}\right) = 1 - \alpha,
$$

where $z_{\alpha/2}$ is the value with $\Phi(z_{\alpha/2}) = 1 - \alpha/2$: $1.645$ for $\alpha = 0.10$, $1.960$ for $\alpha = 0.05$, $2.576$ for $\alpha = 0.01$, the multipliers tabulated in the Gaussian lesson. Rearranging the inequality to put $\mu$ in the middle gives the **confidence interval**

$$
\bar{x} \pm z_{\alpha/2}\,\frac{\sigma}{\sqrt{N}},
$$

and $1 - \alpha$ is its **confidence level**. Nothing was assumed beyond the sampling distribution, so the same construction works for any estimator whose standard error you know: a maximum likelihood estimate $\hat{\theta}$ with Fisher information $I(\theta)$ is asymptotically $\mathcal{N}(\theta, 1/I)$, and its interval is $\hat{\theta} \pm z_{\alpha/2}/\sqrt{I(\hat{\theta})}$.

## What "95 per cent confidence" means

The interval is random; the parameter is not. Before the data are taken, the procedure "compute $\bar{x}$, add and subtract $1.96\sigma/\sqrt{N}$" produces an interval that will contain the true $\mu$ on $95\%$ of occasions. After the data are taken, the interval is a pair of specific numbers and $\mu$ is either in it or not. The $95\%$ describes the long-run behaviour of the method, not the probability that this particular interval is right.

This is worth demonstrating rather than asserting. Take $\mu = 0.5$, $\sigma = 0.2$ and $N = 8$, generate two hundred thousand independent bench tests, build the interval each time, and count how often it catches the truth.

```python
import math
import random


def covers(n, mu, sigma, k, use_sample_sd, rng):
    """One trial: does the interval x-bar +/- k*spread/sqrt(n) contain mu?"""
    x = [rng.gauss(mu, sigma) for _ in range(n)]
    xbar = sum(x) / n
    if use_sample_sd:
        spread = math.sqrt(sum((xi - xbar) ** 2 for xi in x) / (n - 1))
    else:
        spread = sigma
    return abs(xbar - mu) <= k * spread / math.sqrt(n)


trials = 200_000
for k, use_sample_sd in [(1.960, False), (1.960, True), (2.365, True)]:
    rng = random.Random(7)
    hits = sum(covers(8, 0.5, 0.2, k, use_sample_sd, rng) for _ in range(trials))
    print(k, use_sample_sd, hits / trials)

# 1.96  False  0.95048    sigma known: 95% coverage, as advertised
# 1.96  True   0.909855   sigma estimated from 8 samples: only 91%
# 2.365 True   0.950115   Student's t multiplier restores it
```

The first line is the guarantee working. The second line is the trap, and the third line is the repair, and the next section explains both.

::: note
A **Bayesian credible interval** is the statement the confidence interval is so often mistaken for: given a prior, the posterior $p(\mu \mid \text{data})$ is a genuine distribution over $\mu$, and the interval containing $95\%$ of its mass really does carry a $95\%$ probability of holding the truth. With a flat prior and Gaussian data the two intervals coincide numerically, which is why the distinction is easy to ignore and easy to get wrong when the prior matters. A navigation filter is Bayesian throughout: its covariance $\mathbf{P}$ defines credible ellipsoids, not confidence regions.
:::

## When the noise level is unknown: Student's t

In practice you rarely know $\sigma$; you estimate it from the same data as $s$, the square root of the sample variance with Bessel's $N - 1$. Substituting $s$ for $\sigma$ adds a second source of scatter, and with a small sample that scatter is large: $s$ is as likely to come out small as large, and a small $s$ produces a narrow interval that misses. The simulation above shows the damage — $91\%$ coverage from a nominally $95\%$ recipe at $N = 8$.

The fix is exact, and it is the oldest result in applied statistics. For Gaussian data the ratio

$$
t = \frac{\bar{x} - \mu}{s/\sqrt{N}}
$$

follows **Student's t distribution** with $\nu = N - 1$ degrees of freedom. Its structure is $t = Z/\sqrt{V/\nu}$ with $Z$ standard normal and $V$ an independent chi-square variable with $\nu$ degrees of freedom, because $(N-1)s^2/\sigma^2$ is exactly such a chi-square — a fact the chi-square lesson proves. The t density looks Gaussian but with heavier tails, and it tends to the standard normal as $\nu \to \infty$. The interval becomes

$$
\bar{x} \pm t_{\nu,\,1-\alpha/2}\,\frac{s}{\sqrt{N}}, \qquad \nu = N - 1.
$$

| $\nu$ | $t_{\nu,\,0.975}$ | $t_{\nu,\,0.995}$ |
| --- | --- | --- |
| $2$ | $4.303$ | $9.925$ |
| $4$ | $2.776$ | $4.604$ |
| $7$ | $2.365$ | $3.499$ |
| $10$ | $2.228$ | $3.169$ |
| $30$ | $2.042$ | $2.750$ |
| $120$ | $1.980$ | $2.617$ |
| $\infty$ | $1.960$ | $2.576$ |

Read the table as a penalty for ignorance. At $\nu = 7$ the multiplier is $2.365$ against the Gaussian $1.960$, so the honest interval is $21\%$ wider. By $\nu = 30$ the penalty is $4\%$ and by $\nu = 120$ it is $1\%$: for a long record the distinction is cosmetic, and for a handful of samples it is the difference between a valid claim and an invalid one.

::: example The gyro bias interval, and the decision that follows
The eight one-second gyro averages from the expectation lesson, in $^\circ/\mathrm{h}$, are $0.52$, $0.75$, $0.31$, $0.70$, $0.45$, $0.45$, $0.88$, $0.53$, with $\bar{x} = 0.574$ and $s = 0.187$. The standard error is $s/\sqrt{8} = 0.0663\,^\circ/\mathrm{h}$, and with $\nu = 7$ the $95\%$ interval is

$$
0.574 \pm 2.365 \times 0.0663 = 0.574 \pm 0.157 = [0.417,\ 0.731]\,^\circ/\mathrm{h}.
$$

Using $1.960$ instead would have given $[0.444,\ 0.704]$, too narrow by a fifth. The $90\%$ interval, with $t_{7,\,0.95} = 1.895$, is $[0.448,\ 0.699]$; the $99\%$ interval, with $t_{7,\,0.995} = 3.499$, is $[0.342,\ 0.806]$. Higher confidence buys a wider interval and nothing else — you cannot become both more certain and more precise without more data.

Now the decision. Is there a bias at all? Under the null hypothesis $\mu = 0$ the statistic $t = 0.574/0.0663 = 8.66$ would have to be produced by chance from a t distribution with seven degrees of freedom, which happens with probability $5.5 \times 10^{-5}$ counting both tails. The bias is real. Equivalently: zero lies far outside $[0.417,\ 0.731]$, which is the same statement.

Is the unit within a $1\,^\circ/\mathrm{h}$ bias specification? The whole interval lies below $1\,^\circ/\mathrm{h}$, so yes, at $95\%$ confidence, and the margin is comfortable. Is it within $0.6\,^\circ/\mathrm{h}$? The interval straddles $0.6$, so the test is inconclusive and the answer is more samples, not a louder assertion. Eight samples pin the bias to about $\pm 0.16\,^\circ/\mathrm{h}$; reaching $\pm 0.05$ needs $(0.187 \times 2/0.05)^2 \approx 56$ samples, and reaching $\pm 0.01$ needs about $1400$ — provided they are independent, which for a real gyro over that many seconds they are not.
:::

::: key
A confidence interval for a mean is $\bar{x} \pm z_{\alpha/2}\,\sigma/\sqrt{N}$ when $\sigma$ is known and $\bar{x} \pm t_{\nu,\,1-\alpha/2}\,s/\sqrt{N}$ with $\nu = N - 1$ when it is estimated from the data. The multipliers are $1.645$, $1.960$ and $2.576$ for $90\%$, $95\%$ and $99\%$. The confidence level is the long-run fraction of intervals built this way that contain the true parameter, not the probability that this one does.
:::

::: warning
The $1/\sqrt{N}$ in the standard error assumes independent samples. If the samples come from a process with correlation time $T$ sampled at $\Delta t$, the number of effectively independent pieces is roughly $N_{\text{eff}} \approx N\Delta t/(2T)$, not $N$, and the interval must be built from $N_{\text{eff}}$. One hour of a $T = 100\,\mathrm{s}$ Gauss-Markov bias at $1\,\mathrm{Hz}$ gives $N = 3600$ but $N_{\text{eff}} \approx 18$, and the naive interval is $\sqrt{3600/18} = 14$ times too narrow. Averaging a slowly wandering signal for longer does not make the average as good as the sample count suggests; this is precisely the plateau the Allan deviation shows.
:::

## The machinery of a hypothesis test

A test is a rule for choosing between two statements about the world, built so that the rate of one kind of mistake is controlled.

- The **null hypothesis** $H_0$ is the default, the boring explanation: the scale factor is exactly $1$, the two lots have the same noise, the change made no difference. It is specific enough to compute with.
- The **alternative** $H_1$ is what you would claim instead — two-sided ($\theta \neq \theta_0$) when a deviation either way matters, one-sided ($\theta > \theta_0$) when only one direction does.
- A **test statistic** is a number computed from the data whose distribution under $H_0$ is known: for a mean, $z = (\bar{x} - \mu_0)/(\sigma/\sqrt{N})$, or $t = (\bar{x} - \mu_0)/(s/\sqrt{N})$ when $\sigma$ is estimated.
- The **significance level** $\alpha$ is the probability of rejecting $H_0$ when it is true, chosen before looking at the data. Reject when the statistic falls outside $\pm z_{\alpha/2}$.
- The **p-value** is the probability, computed under $H_0$, of a statistic at least as extreme as the one observed. Reject when $p < \alpha$.

A two-sided test at level $\alpha$ rejects $\theta_0$ exactly when $\theta_0$ falls outside the $(1-\alpha)$ confidence interval. The interval is the set of null values the data do not reject, which is why reporting the interval is strictly more informative than reporting the verdict: it shows the size of the effect as well as its existence.

The p-value is the most misread number in engineering. It is the probability of the data given the null, not the probability of the null given the data. A p-value of $0.03$ does not mean there is a $3\%$ chance the scale factor is exactly $1$; it means that if the scale factor were exactly $1$, data this discrepant would arise three times in a hundred. And "fail to reject" is not "accept": a test that cannot see an effect proves nothing about its absence, which is what power is for.

::: example Does the rate table show a real scale-factor error?
The five-point rate-table fit of the previous lesson gave $\hat{k} = 1.00190$ with standard error $\sigma_k = 3.16 \times 10^{-4}$ and $\hat{b} = 0.312\,^\circ/\mathrm{s}$ with $\sigma_b = 0.0224\,^\circ/\mathrm{s}$. Take $H_0: k = 1$, that is no scale-factor error, against a two-sided alternative. The statistic is

$$
z = \frac{1.00190 - 1}{3.16 \times 10^{-4}} = 6.01,
$$

with two-sided p-value $2[1 - \Phi(6.01)] = 1.8 \times 10^{-9}$. The scale-factor error of $1900$ parts per million is real beyond any doubt, and its $95\%$ interval is $1.00190 \pm 1.96 \times 3.16 \times 10^{-4} = [1.00128,\ 1.00252]$, that is $1280$ to $2520\,\mathrm{ppm}$. The bias test gives $z = 0.312/0.0224 = 13.9$, even more decisive, with interval $[0.268,\ 0.356]\,^\circ/\mathrm{s}$.

Statistical significance is not the end of the story. A $1900\,\mathrm{ppm}$ scale-factor error means a $100\,^\circ/\mathrm{s}$ turn is measured $0.19\,^\circ/\mathrm{s}$ wrong, accumulating $0.19^\circ$ of attitude error per second of that turn — large, and worth compensating. A hypothetical error of $20\,\mathrm{ppm}$ detected at $z = 6$ from a very long test would be equally significant statistically and completely irrelevant operationally. Always ask both questions: is the effect there, and is it big enough to matter.
:::

## Two kinds of error, and how many samples you need

A test can go wrong in two ways.

| | $H_0$ true | $H_0$ false |
| --- | --- | --- |
| Reject $H_0$ | Type I error, probability $\alpha$ | Correct detection, probability $1 - \beta$ |
| Do not reject | Correct, probability $1 - \alpha$ | Type II error, probability $\beta$ |

A **Type I error** is a false alarm: scrapping a good unit, chasing a nonexistent anomaly. Its rate is $\alpha$, set by you. A **Type II error** is a miss: shipping a unit that is out of spec, declaring a filter healthy when it is not. Its rate $\beta$ depends on how large the true effect is, and $1 - \beta$ is the **power** of the test against that effect. Tightening $\alpha$ to avoid false alarms raises $\beta$ at fixed sample size; the only way to reduce both is more data.

Sizing follows. To detect a shift of size $\Delta$ in a mean, with significance $\alpha$ and power $1 - \beta$, the test statistic must clear $z_{\alpha/2}$ while it is centred at $\Delta\sqrt{N}/\sigma$, so $\Delta\sqrt{N}/\sigma \geq z_{\alpha/2} + z_\beta$ and

$$
N \geq \left(\frac{(z_{\alpha/2} + z_\beta)\,\sigma}{\Delta}\right)^{\!2}.
$$

With $\alpha = 0.05$ and power $0.90$ the bracket multiplier is $1.960 + 1.282 = 3.242$. For the gyro with $\sigma = 0.187\,^\circ/\mathrm{h}$ per one-second sample, detecting a bias shift of $\Delta = 0.1\,^\circ/\mathrm{h}$ needs $N \geq (3.242 \times 0.187/0.1)^2 = 37$ samples; detecting $\Delta = 0.05\,^\circ/\mathrm{h}$ needs $147$. Sample count scales as $1/\Delta^2$: resolving an effect half as large costs four times the data, the same square-root law that governs every averaging problem in this module. Turn it around and the eight-sample t test has power of only about $26\%$ against a $0.1\,^\circ/\mathrm{h}$ shift — it would miss such a shift three times in four, which is why "the test came back clean" from a short run means very little.

## Intervals for a probability

Monte Carlo campaigns estimate probabilities, not means, and a probability near zero needs its own treatment. The previous lesson derived the maximum likelihood estimate $\hat{p} = k/N$ for $k$ failures in $N$ independent runs, with variance $p(1-p)/N$. The obvious interval,

$$
\hat{p} \pm z_{\alpha/2}\sqrt{\frac{\hat{p}(1 - \hat{p})}{N}},
$$

is the **Wald interval**, and it is reliable only when $k$ is comfortably large, say $k \geq 10$ and $N - k \geq 10$. It fails badly for small $k$ because it uses $\hat{p}$ in place of $p$ in the very quantity that sets its width: at $k = 0$ it collapses to the single point zero, claiming perfect knowledge from no evidence at all.

Two repairs are standard. The **Wilson interval** solves $|\hat{p} - p| = z\sqrt{p(1-p)/N}$ for $p$ instead of substituting $\hat{p}$, which keeps the interval inside $[0, 1]$ and keeps it honest at small counts. The **Clopper–Pearson** interval inverts the exact binomial distribution: its upper limit is the largest $p$ for which observing $k$ or fewer failures still has probability $\alpha$. Clopper–Pearson never under-covers, and for small $k$ it is the one to quote.

The special case of zero failures deserves its own name. If $k = 0$, the exact upper bound at confidence $1 - \alpha$ solves $(1 - p)^N = \alpha$, giving $p_{\max} = 1 - \alpha^{1/N} \approx -\ln\alpha/N$. With $\alpha = 0.05$ and $\ln 20 = 2.996$ this is the **rule of three**:

$$
p_{\max} \approx \frac{3}{N} \quad \text{at } 95\% \text{ confidence, when no failure is seen in } N \text{ runs.}
$$

Three hundred clean runs bound the failure probability at $1\%$; a thousand bound it at $0.3\%$. No number of clean runs bounds it at zero.

::: example Can the campaign claim compliance?
A requirement says the probability of exceeding a $50\,\mathrm{m}$ miss distance shall not exceed $1\%$. A campaign of $N = 2000$ dispersed runs produces $k = 23$ exceedances, so $\hat{p} = 0.0115$ with standard error $\sqrt{0.0115 \times 0.9885/2000} = 0.00238$. The Wald interval is $[0.0068,\ 0.0162]$ and the Wilson interval $[0.0077,\ 0.0172]$; the exact Clopper–Pearson interval is $[0.0073,\ 0.0172]$, which at $k = 23$ is close to Wilson, as it should be.

Two questions, two answers. Is the design proven non-compliant? Test $H_0: p = 0.01$ against $p > 0.01$. Under $H_0$ the exact probability of seeing $23$ or more exceedances in $2000$ runs is $0.279$ — entirely ordinary. The campaign has not shown a violation. Is the design proven compliant? For that the one-sided $95\%$ upper bound must fall below $0.01$, and it is $0.0163$. It does not. The campaign has shown nothing either way, which is the honest and unwelcome answer.

What would settle it? If the true probability is $0.005$, the upper bound $\hat{p} + 1.645\sqrt{\hat{p}(1-\hat{p})/N}$ falls below $0.01$ once $N \geq 0.005 \times 0.995 \times (1.645/0.005)^2 = 539$ runs — the existing campaign already suffices at that true rate, and the observed $0.0115$ is simply not that rate. If the true probability is $0.007$, it takes about $2100$ runs; if it is $0.009$, tens of thousands. Demonstrating compliance with a limit gets exponentially harder as the truth approaches the limit, which is why margin is designed in rather than argued about afterwards.
:::

::: warning
Run twenty independent tests at $\alpha = 0.05$ on data where nothing is wrong and the probability that at least one rejects is $1 - 0.95^{20} = 0.64$. A dispersion report that tests fifty channels and highlights the three that "failed" has found nothing. If you must test many things, lower the per-test level — dividing $\alpha$ by the number of tests is the crude and safe Bonferroni correction — or state plainly that the search was exploratory. The same trap catches anyone who keeps adding Monte Carlo runs until the p-value crosses $0.05$ and then stops: the stopping rule is part of the experiment, and a test whose sample size depends on the result has no valid level.
:::

## Check yourself

::: check
Twelve independent range residuals from a radar altimeter have $\bar{x} = 1.8\,\mathrm{m}$ and $s = 2.4\,\mathrm{m}$. Build the $95\%$ confidence interval for the mean residual and decide whether the altimeter shows a bias.
:::

::: answer
The standard error is $2.4/\sqrt{12} = 0.693\,\mathrm{m}$. With $\nu = 11$ degrees of freedom the multiplier is $t_{11,\,0.975} = 2.201$, so the interval is $1.8 \pm 2.201 \times 0.693 = 1.8 \pm 1.53 = [0.27,\ 3.33]\,\mathrm{m}$. Zero lies outside it, so there is a bias at the $5\%$ level; equivalently $t = 1.8/0.693 = 2.60$ against a critical value of $2.201$. The interval is wide, though: the data are consistent with a bias anywhere from a quarter of a metre to more than three metres, so "there is a bias" is established while "the bias is $1.8\,\mathrm{m}$" is not.
:::

::: check
A colleague reports a p-value of $0.04$ and concludes "there is a $96\%$ probability that the new filter is better." What is wrong with that sentence, and what would the correct statement be?
:::

::: answer
The p-value is computed under the assumption that the null hypothesis is true: it is $P(\text{data this extreme} \mid H_0)$, not $P(H_0 \mid \text{data})$, and the two are related only through Bayes' theorem with a prior on $H_0$. The correct statement is: if the new filter were no better, data this favourable would arise about four times in a hundred, so the null is rejected at the $5\%$ level. To make a probability statement about the filter itself you need a prior and a posterior, which is the Bayesian route. Report the effect size and its confidence interval alongside the p-value, since the p-value alone says nothing about how much better.
:::

::: check
An accelerometer's noise is $\sigma = 0.8\,\mathrm{mg}$ per sample. How many samples are needed to detect a mean bias shift of $0.2\,\mathrm{mg}$ at significance $0.05$ with power $0.90$? What happens to that count if the shift you care about is halved?
:::

::: answer
The multiplier is $z_{0.025} + z_{0.10} = 1.960 + 1.282 = 3.242$, so $N \geq (3.242 \times 0.8/0.2)^2 = (12.97)^2 = 168$ samples. Halving the shift to $0.1\,\mathrm{mg}$ multiplies $N$ by four, to $673$. Sample count grows as $1/\Delta^2$ because the standard error falls only as $1/\sqrt{N}$; every factor of two in resolution costs a factor of four in test time.
:::

::: check
A qualification campaign runs $400$ dispersed cases with no requirement violations. What can you claim about the violation probability, and at what confidence?
:::

::: answer
By the rule of three, the $95\%$ upper bound is about $3/400 = 0.0075$, and the exact value $1 - 0.05^{1/400} = 0.00746$ agrees. So you may claim the violation probability is below about $0.75\%$ with $95\%$ confidence. You may not claim it is zero, and you may not claim compliance with a $10^{-3}$ requirement: that would need roughly $3/10^{-3} = 3000$ clean runs. The estimate $\hat{p} = 0/400 = 0$ is the maximum likelihood value and is useless on its own; the upper bound is the whole content of the result.
:::

::: check
The same bench record is used twice: once to estimate the gyro's noise standard deviation $s$, and once to test whether its mean differs from zero. Why does that force a t distribution rather than a normal, and when does the distinction stop mattering?
:::

::: answer
Because $s$ is a random variable estimated from the same $N$ samples, the denominator of $(\bar{x} - \mu)/(s/\sqrt{N})$ fluctuates along with the numerator, and a sample that happens to give a small $s$ produces an inflated statistic. That extra scatter gives the ratio heavier tails than a standard normal, exactly the t distribution with $N - 1$ degrees of freedom. The penalty shrinks as $s$ becomes a better estimate of $\sigma$: the multiplier at $95\%$ falls from $2.365$ at $\nu = 7$ to $2.042$ at $\nu = 30$ and $1.980$ at $\nu = 120$, so beyond a few dozen samples the Gaussian multiplier is within a few per cent and the distinction is cosmetic.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\operatorname{sd}(\bar{x}) = \sigma/\sqrt{N}$ | Standard error of the mean; the width scale of every interval below |
| $\bar{x} \pm z_{\alpha/2}\,\sigma/\sqrt{N}$ | Confidence interval, $\sigma$ known; $z = 1.645,\ 1.960,\ 2.576$ at $90\%,\ 95\%,\ 99\%$ |
| $\bar{x} \pm t_{\nu,\,1-\alpha/2}\,s/\sqrt{N}$, $\nu = N-1$ | Interval with $\sigma$ estimated; $t_{7,\,0.975} = 2.365$, $t_{30,\,0.975} = 2.042$ |
| $\hat{\theta} \pm z_{\alpha/2}/\sqrt{I(\hat{\theta})}$ | Interval for any maximum likelihood estimate, from the Fisher information |
| Coverage | $1-\alpha$ is the long-run fraction of such intervals containing the truth |
| $N_{\text{eff}} \approx N\Delta t/(2T)$ | Effective sample count for correlated data; use it in place of $N$ |
| $H_0$, $H_1$, $\alpha$, p-value | Null, alternative, significance level, $P(\text{data this extreme} \mid H_0)$ |
| $z = (\bar{x} - \mu_0)/(\sigma/\sqrt{N})$, $t = (\bar{x} - \mu_0)/(s/\sqrt{N})$ | Test statistics for a mean |
| Type I rate $\alpha$; Type II rate $\beta$; power $1-\beta$ | False alarm and miss; a test rejects $\theta_0$ iff $\theta_0$ is outside the interval |
| $N \geq \big((z_{\alpha/2} + z_\beta)\sigma/\Delta\big)^2$ | Samples to detect a shift $\Delta$; $z_{0.025} + z_{0.10} = 3.242$ |
| $\hat{p} \pm z_{\alpha/2}\sqrt{\hat{p}(1-\hat{p})/N}$ | Wald interval for a probability; use Wilson or Clopper–Pearson at small counts |
| $p_{\max} \approx 3/N$ | Rule of three: $95\%$ upper bound after $N$ runs with zero failures |

The next lesson makes Monte Carlo the subject rather than the example: how to generate the samples, how fast the error falls, why the rate is $1/\sqrt{N}$ regardless of dimension, and how to size and shrink a campaign that has to resolve a rare event. Every result it quotes will carry one of the intervals built here.
