---
id: l11-confidence-intervals-and-hypothesis-testing
title: Confidence intervals and hypothesis testing
minutes: 23
covers:
  - confidence intervals and hypothesis testing
---

If a friend says "the bus comes at 8:05", you plan one way. If she says "8:05, give or take twenty minutes", you plan another. Same best guess, very different decision. A number without its uncertainty is not a measurement, and an engineering decision made on a best guess alone is a guess wearing a decimal point.

The previous lesson produced estimates: a gyro bias of $0.574\,^\circ/\mathrm{h}$, a scale factor of $1.00190$, a correlation time of $103\,\mathrm{s}$, a failure fraction of $0.0115$. Each came with a variance. This lesson turns that variance into two tools. A **confidence interval** states how tightly the data pin the parameter down. A **hypothesis test** decides whether a difference you can see is one you should believe.

Both appear all through a flight program. Is a rate-table scale-factor error real, or bench noise? Does a delivered IMU meet its noise spec? Is a Monte Carlo violation rate consistent with a 1% requirement? Did the navigation error shift after a software change? Each is a hypothesis test with an interval attached. The common failure is rarely bad arithmetic. It is a claim the data do not support.

## From a best guess to an interval

Every estimator is a random quantity: run the bench test again and you get a different $\bar{x}$. How it would scatter over many imagined repeats is its **sampling distribution**, and the standard deviation of that scatter is the **[[standard error|two-spreads]]**. For the mean of $N$ independent samples with standard deviation $\sigma$, the expectation lesson showed

$$
\operatorname{sd}(\bar{x}) = \frac{\sigma}{\sqrt{N}},
$$

and the central limit theorem says $\bar{x}$ is close to Gaussian around the true $\mu$ whatever the shape of the samples (exactly Gaussian if they are).

That is enough to build an interval. If $\bar{x} \sim \mathcal{N}(\mu, \sigma^2/N)$, then the standardized error $(\bar{x} - \mu)/(\sigma/\sqrt{N})$ is standard normal. So for any small probability $\alpha$ ("alpha"),

$$
P\!\left(-z_{\alpha/2} \leq \frac{\bar{x} - \mu}{\sigma/\sqrt{N}} \leq z_{\alpha/2}\right) = 1 - \alpha.
$$

Here $z_{\alpha/2}$ is the point with only $\alpha/2$ of the standard normal beyond it: $\Phi(z_{\alpha/2}) = 1 - \alpha/2$, where $\Phi$ ("capital phi") is the standard normal CDF. The familiar values from the Gaussian lesson: $1.645$ for $\alpha = 0.10$, $1.960$ for $\alpha = 0.05$, $2.576$ for $\alpha = 0.01$.

Rearrange the inequality to put $\mu$ in the middle (multiply through by $\sigma/\sqrt{N}$, then move $\bar{x}$ across). That gives the **confidence interval**

$$
\bar{x} \pm z_{\alpha/2}\,\frac{\sigma}{\sqrt{N}},
$$

and $1 - \alpha$ is its **confidence level** — $95\%$ when $\alpha = 0.05$.

Nothing special about the mean was used, only a Gaussian sampling distribution with a known standard error. So the same recipe works for any estimate whose standard error you know. A maximum likelihood estimate $\hat{\theta}$ is approximately $\mathcal{N}(\theta, 1/I)$ for large $N$, so its interval is $\hat{\theta} \pm z_{\alpha/2}/\sqrt{I(\hat{\theta})}$.

## What "95% confidence" means

Picture fishing in muddy water with a net. The fish sits still; you cannot see it. You throw the net, and a good throwing method lands it around the fish 95 times in 100. Once a particular throw lands, the fish is either in the net or not — there is no "95%" left about that throw. The 95% belonged to the *method*.

A confidence interval is the net. The true $\mu$ is fixed; the interval is what is random. Before the data are taken, the recipe "compute $\bar{x}$, add and subtract $1.96\sigma/\sqrt{N}$" will contain the truth on **[[95% of occasions|twenty-intervals]]**. After the data are taken, the interval is two fixed numbers, and $\mu$ is in it or not. The 95% is the long-run success rate of the method, not the probability that this particular interval is right.

That claim can be tested. Take $\mu = 0.5$, $\sigma = 0.2$, $N = 8$. Simulate two hundred thousand bench tests, build the interval each time, and count how often it catches the truth:

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

# 1.96 False 0.95048      sigma known: 95% coverage, as advertised
# 1.96 True 0.909855      sigma estimated from 8 samples: only 91%
# 2.365 True 0.950115     Student's t multiplier restores it
```

The first line is the guarantee working. The second is a trap, and the third is the repair. The next section explains both.

::: note Credible intervals: the statement people think they are making
A **Bayesian credible interval** says what a confidence interval is so often mistaken for. Start from a prior; the posterior $p(\mu \mid \text{data})$ is a genuine distribution over $\mu$, and an interval holding $95\%$ of it really does carry a $95\%$ probability of containing the truth. With a flat prior and Gaussian data the two intervals come out numerically equal, which is why the difference is easy to ignore — and easy to get wrong when the prior matters. A navigation filter is Bayesian throughout: its covariance $\mathbf{P}$ defines credible ellipsoids, not confidence regions.
:::

## When the noise level is unknown: Student's t

You rarely know $\sigma$. Usually you estimate it from the same data as $s$, with Bessel's $N - 1$. That swap adds a second source of wobble. With few samples, $s$ may come out small by bad luck, which makes a narrow interval that misses. The simulation shows the damage: $91\%$ coverage from a "95%" recipe at $N = 8$.

The fix is exact. For Gaussian data the ratio

$$
t = \frac{\bar{x} - \mu}{s/\sqrt{N}}
$$

follows **[[Student's t distribution|student]]** with $\nu = N - 1$ **[[degrees of freedom|degrees-of-freedom]]** ($\nu$ is the Greek letter "nu"). Its structure is $t = Z/\sqrt{V/\nu}$, where $Z$ is standard normal and $V$ is an independent chi-square variable with $\nu$ degrees of freedom, because $(N-1)s^2/\sigma^2$ is exactly such a chi-square — the chi-square lesson proves it. The t density looks like a Gaussian with **[[heavier tails|heavy-tails]]**, and it becomes the standard normal as $\nu \to \infty$. The interval becomes

$$
\bar{x} \pm t_{\nu,\,1-\alpha/2}\,\frac{s}{\sqrt{N}}, \qquad \nu = N - 1,
$$

where $t_{\nu,\,1-\alpha/2}$ is the point with $1 - \alpha/2$ of the t distribution below it.

| $\nu$ | $t_{\nu,\,0.975}$ (95%) | $t_{\nu,\,0.995}$ (99%) |
| --- | --- | --- |
| $2$ | $4.303$ | $9.925$ |
| $4$ | $2.776$ | $4.604$ |
| $7$ | $2.365$ | $3.499$ |
| $10$ | $2.228$ | $3.169$ |
| $30$ | $2.042$ | $2.750$ |
| $120$ | $1.980$ | $2.617$ |
| $\infty$ | $1.960$ | $2.576$ |

Read the table as a penalty for not knowing $\sigma$. At $\nu = 7$ the multiplier is $2.365$ against the Gaussian $1.960$, so the honest interval is $2.365/1.960 = 1.21$ times, or $21\%$, wider. At $\nu = 30$ the penalty is $4\%$, and at $\nu = 120$ it is $1\%$. For a long record the difference is cosmetic. For a handful of samples, it separates a valid claim from an invalid one.

::: example The gyro bias interval, and the decisions it supports
The expectation lesson's eight one-second gyro averages, in $^\circ/\mathrm{h}$, are $0.52$, $0.75$, $0.31$, $0.70$, $0.45$, $0.45$, $0.88$, $0.53$, with $\bar{x} = 0.574$ and $s = 0.187$.

**The 95% interval.** The standard error is $s/\sqrt{8} = 0.187/2.83 = 0.0663\,^\circ/\mathrm{h}$. With $\nu = 7$ the multiplier is $2.365$, and $2.365 \times 0.0663 = 0.157$:

$$
0.574 \pm 0.157 = [0.417,\ 0.731]\,^\circ/\mathrm{h}.
$$

Using $1.960$ by mistake gives $[0.444,\ 0.704]$ — a fifth too narrow.

**Other levels.** The $90\%$ interval ($t_{7,\,0.95} = 1.895$) is $[0.448,\ 0.699]$. The $99\%$ interval ($t_{7,\,0.995} = 3.499$) is $[0.342,\ 0.806]$. More confidence costs width. You cannot be both more certain and more precise without more data.

**Is there a bias at all?** Suppose the true bias were zero. Then $t = 0.574/0.0663 = 8.66$ would have to come by chance from a t distribution with $7$ degrees of freedom. The probability of a value that far out, either side, is $5.5 \times 10^{-5}$. The bias is real. Equivalently: zero lies far outside $[0.417,\ 0.731]$.

**Does it meet a $1\,^\circ/\mathrm{h}$ spec?** The whole interval lies below $1$, so yes, at $95\%$ confidence, with room to spare. **A $0.6\,^\circ/\mathrm{h}$ spec?** The interval straddles $0.6$, so the answer is "not known yet" — more samples, not a louder claim.

**How many samples for a tighter interval?** Using $2$ as a round multiplier, a half-width of $0.05$ needs $(2 \times 0.187/0.05)^2 \approx 56$ samples, and $\pm 0.01$ needs about $1400$ — provided they are independent, which a real gyro over that many seconds is not.
:::

::: key
A confidence interval for a mean is $\bar{x} \pm z_{\alpha/2}\,\sigma/\sqrt{N}$ when $\sigma$ is known and $\bar{x} \pm t_{\nu,\,1-\alpha/2}\,s/\sqrt{N}$ with $\nu = N - 1$ when it is estimated from the data. The multipliers are $1.645$, $1.960$ and $2.576$ for $90\%$, $95\%$ and $99\%$. The confidence level is the long-run fraction of intervals built this way that contain the true parameter, not the probability that this one does.
:::

::: warning Correlated samples are fewer than they look
The $1/\sqrt{N}$ assumes independent samples. If the samples come from a process with correlation time $T$ sampled every $\Delta t$, the number of effectively independent pieces is roughly $N_{\text{eff}} \approx N\Delta t/(2T)$, and the interval must use $N_{\text{eff}}$. One hour of a $T = 100\,\mathrm{s}$ Gauss-Markov bias at $1\,\mathrm{Hz}$ gives $N = 3600$ but $N_{\text{eff}} \approx 3600/200 = 18$. The naive interval is $\sqrt{3600/18} = 14$ times too narrow. Averaging a slowly wandering signal for longer does not help as much as the sample count suggests — this is the plateau the **[[Allan deviation|allan-plateau]]** shows.
:::

## The machinery of a hypothesis test

A test works like a **[[courtroom|courtroom]]**. The defendant is presumed innocent. The prosecution must bring evidence so strong that "innocent" becomes hard to believe. And the rules are set so that innocent people are rarely convicted.

- The **null hypothesis** $H_0$ ("H nought") is the default, boring explanation: the scale factor is exactly $1$, the two lots have equal noise, the change made no difference. It must be specific enough to compute with.
- The **alternative** $H_1$ is what you would claim instead. It is two-sided ($\theta \neq \theta_0$) when a deviation either way matters, one-sided ($\theta > \theta_0$) when only one direction does.
- A **test statistic** is a number computed from the data whose distribution under $H_0$ is known. For a mean: $z = (\bar{x} - \mu_0)/(\sigma/\sqrt{N})$, or $t = (\bar{x} - \mu_0)/(s/\sqrt{N})$ when $\sigma$ is estimated.
- The **[[significance level|point-oh-five]]** $\alpha$ is the probability of rejecting $H_0$ when it is true, chosen *before* you look. Reject when the statistic lands outside $\pm z_{\alpha/2}$.
- The **p-value** is the probability, assuming $H_0$, of a statistic at least as extreme as the one you got. Reject when $p < \alpha$.

Tests and intervals are two views of one thing. A two-sided test at level $\alpha$ rejects $\theta_0$ exactly when $\theta_0$ lies outside the $(1-\alpha)$ confidence interval. The interval is the set of values the data do not reject. That makes the interval more informative than the verdict: it shows how big the effect is, not only whether it exists.

The p-value is the most misread number in engineering. It is the probability of the data given the null — not the probability of the null given the data. A p-value of $0.03$ does not mean a $3\%$ chance the scale factor is exactly $1$. It means: *if* the scale factor were exactly $1$, data this far off would turn up three times in a hundred. And "fail to reject" is not "accept". A test too weak to see an effect proves nothing about its absence; that is what power, below, measures.

::: example Does the rate table show a real scale-factor error?
The previous lesson's rate-table fit gave $\hat{k} = 1.00190$ with standard error $\sigma_k = 3.16 \times 10^{-4}$, and $\hat{b} = 0.312\,^\circ/\mathrm{s}$ with $\sigma_b = 0.0224\,^\circ/\mathrm{s}$.

**Set up.** $H_0: k = 1$ (no scale-factor error), two-sided alternative. The noise level was known, so use $z$:

$$
z = \frac{1.00190 - 1}{3.16 \times 10^{-4}} = \frac{0.00190}{0.000316} = 6.01.
$$

**Decide.** The two-sided p-value is $2[1 - \Phi(6.01)] = 1.8 \times 10^{-9}$. The $1900\,\mathrm{ppm}$ error is real beyond doubt.

**Size it.** The $95\%$ interval is $1.00190 \pm 1.96 \times 3.16 \times 10^{-4} = 1.00190 \pm 0.00062 = [1.00128,\ 1.00252]$, that is, $1280$ to $2520\,\mathrm{ppm}$. The bias test gives $z = 0.312/0.0224 = 13.9$, even more decisive, with interval $0.312 \pm 0.044 = [0.268,\ 0.356]\,^\circ/\mathrm{s}$.

**Does it matter?** Significance is not the end. A $1900\,\mathrm{ppm}$ error means a $100\,^\circ/\mathrm{s}$ turn reads $0.19\,^\circ/\mathrm{s}$ wrong, piling up $0.19^\circ$ of attitude error per second of turning — large, and worth correcting. A $20\,\mathrm{ppm}$ error detected at $z = 6$ from a very long test would be equally "significant" and operationally irrelevant. Always ask both questions: is the effect there, and is it big enough to matter?
:::

## Two kinds of error, and how many samples you need

A test can go wrong in two ways.

| | $H_0$ true | $H_0$ false |
| --- | --- | --- |
| Reject $H_0$ | Type I error, probability $\alpha$ | Correct detection, probability $1 - \beta$ |
| Do not reject | Correct, probability $1 - \alpha$ | Type II error, probability $\beta$ |

A **[[Type I error|error-types]]** is a false alarm: scrapping a good unit, chasing an anomaly that is not there. Its rate is $\alpha$, and you set it. A **Type II error** is a miss: shipping an out-of-spec unit, calling a sick filter healthy. Its rate is $\beta$ ("beta"), and it depends on how big the true effect is. The **power** of the test, $1 - \beta$, is its chance of catching that effect. At a fixed sample size, lowering $\alpha$ to avoid false alarms raises $\beta$. The only way to lower both is more data.

That gives a sizing rule. Suppose the true mean has shifted by $\Delta$ ("delta"). Then the test statistic is centered at $\Delta\sqrt{N}/\sigma$ instead of $0$. To catch the shift with probability $1 - \beta$, that center must sit at least $z_\beta$ standard units beyond the threshold $z_{\alpha/2}$, where $z_\beta$ has $\beta$ of the normal beyond it. So $\Delta\sqrt{N}/\sigma \geq z_{\alpha/2} + z_\beta$, and squaring,

$$
N \geq \left(\frac{(z_{\alpha/2} + z_\beta)\,\sigma}{\Delta}\right)^{\!2}.
$$

With $\alpha = 0.05$ and power $0.90$, the multiplier is $1.960 + 1.282 = 3.242$. For the gyro with $\sigma = 0.187\,^\circ/\mathrm{h}$ per sample, catching a bias shift of $\Delta = 0.1\,^\circ/\mathrm{h}$ needs $N \geq (3.242 \times 0.187/0.1)^2 = 6.06^2 = 37$ samples. Catching $\Delta = 0.05$ needs $147$.

Sample count grows as $1/\Delta^2$: an effect half as large costs four times the data — the same square-root law behind every averaging problem in this module. Turned around, the eight-sample t test has power of only about $26\%$ against a $0.1\,^\circ/\mathrm{h}$ shift. It would miss such a shift about three times in four, which is why "the test came back clean" from a short run means very little.

## Intervals for a probability

Monte Carlo campaigns estimate probabilities, and a probability near zero needs care. The previous lesson derived $\hat{p} = k/N$ for $k$ failures in $N$ independent runs, with variance $p(1-p)/N$. The obvious interval is the **Wald interval**:

$$
\hat{p} \pm z_{\alpha/2}\sqrt{\frac{\hat{p}(1 - \hat{p})}{N}}.
$$

It works only when there are plenty of both outcomes, roughly $k \geq 10$ and $N - k \geq 10$. For small $k$ it fails, because it plugs the rough guess $\hat{p}$ into the very formula that sets its own width. At $k = 0$ it shrinks to the single point zero — claiming perfect knowledge from no evidence.

Two repairs are standard. The **Wilson interval** solves $|\hat{p} - p| = z\sqrt{p(1-p)/N}$ for $p$, instead of plugging in $\hat{p}$. That keeps it inside $[0, 1]$ and honest at small counts. The **Clopper–Pearson** interval uses the exact binomial distribution. Its upper end is the largest $p$ for which seeing $k$ or fewer failures still has probability at least $\alpha/2$, and its lower end mirrors that (use $\alpha$ for a one-sided bound). Clopper–Pearson never under-covers, so for small $k$ it is the one to quote.

### Zero failures: the rule of three

Suppose no run failed. What can you claim? If the true failure probability were $p$, the chance of $N$ clean runs in a row is $(1 - p)^N$. The largest $p$ still consistent with what you saw at confidence $1 - \alpha$ makes that chance equal $\alpha$:

$$
(1 - p_{\max})^N = \alpha \quad\Longrightarrow\quad p_{\max} = 1 - \alpha^{1/N} \approx \frac{-\ln\alpha}{N}.
$$

(The last step uses $\ln(1 - p) \approx -p$ for small $p$.) With $\alpha = 0.05$, $-\ln 0.05 = \ln 20 = 2.996 \approx 3$, which gives the **[[rule of three|rule-of-three]]**:

$$
p_{\max} \approx \frac{3}{N} \quad \text{at } 95\% \text{ confidence, when no failure is seen in } N \text{ runs.}
$$

Three hundred clean runs bound the failure probability at $1\%$; a thousand bound it at $0.3\%$. No number of clean runs bounds it at zero.

::: example Can the campaign claim compliance?
A requirement: the probability of a miss distance over $50\,\mathrm{m}$ shall not exceed $1\%$. A campaign of $N = 2000$ runs gives $k = 23$ exceedances.

**Estimate.** $\hat{p} = 23/2000 = 0.0115$, with standard error $\sqrt{0.0115 \times 0.9885/2000} = 0.00238$.

**Intervals.** Wald: $0.0115 \pm 1.96 \times 0.00238 = [0.0068,\ 0.0162]$. Wilson: $[0.0077,\ 0.0172]$. Exact Clopper–Pearson: $[0.0073,\ 0.0172]$ — close to Wilson at $k = 23$, as expected.

**Is it proven non-compliant?** Test $H_0: p = 0.01$ against $p > 0.01$. If $p$ really were $0.01$, the exact chance of $23$ or more exceedances in $2000$ runs is $0.279$ — entirely ordinary. No violation has been shown.

**Is it proven compliant?** That needs the one-sided $95\%$ upper bound below $0.01$. The exact bound is $0.0163$. It is not. The campaign has shown nothing either way — the honest, unwelcome answer.

**What would settle it?** If the true probability were $0.005$, the one-sided upper bound $\hat{p} + 1.645\sqrt{\hat{p}(1-\hat{p})/N}$ would typically fall below $0.01$ once $N \geq 0.005 \times 0.995 \times (1.645/0.005)^2 = 539$ runs. If it were $0.007$, about $2100$ runs; at $0.009$, about $24\,000$. The count grows as one over the square of the gap between the truth and the limit, so proving compliance gets very expensive as the truth nears the limit. That is why margin is designed in, not argued about afterward.
:::

::: warning Many tests, one false alarm
Run twenty independent tests at $\alpha = 0.05$ on data where nothing is wrong. The chance at least one rejects is $1 - 0.95^{20} = 0.64$. A dispersion report that tests fifty channels and highlights the three that "failed" has found nothing. If you must test many things, lower the per-test level — dividing $\alpha$ by the number of tests is the crude, safe **[[Bonferroni correction|bonferroni]]** — or say plainly that the search was exploratory. The same trap catches anyone who keeps adding Monte Carlo runs until the p-value dips under $0.05$ and then stops. The stopping rule is part of the experiment, and a test whose sample size depends on its result has no valid level.
:::

## Check yourself

::: check
Twelve independent range residuals from a radar altimeter have $\bar{x} = 1.8\,\mathrm{m}$ and $s = 2.4\,\mathrm{m}$. Build the $95\%$ confidence interval for the mean residual, and decide whether the altimeter shows a bias.
:::

::: answer
The standard error is $2.4/\sqrt{12} = 2.4/3.46 = 0.693\,\mathrm{m}$. With $\nu = 11$ the multiplier is $t_{11,\,0.975} = 2.201$, so the half-width is $2.201 \times 0.693 = 1.53\,\mathrm{m}$ and the interval is $1.8 \pm 1.53 = [0.27,\ 3.33]\,\mathrm{m}$.

Zero lies outside it, so there is a bias at the $5\%$ level. Equivalently, $t = 1.8/0.693 = 2.60$ beats the critical $2.201$. But the interval is wide: the bias could be anywhere from a quarter of a meter to over three meters. "There is a bias" is established; "the bias is $1.8\,\mathrm{m}$" is not.
:::

::: check
A colleague reports a p-value of $0.04$ and concludes "there is a $96\%$ probability that the new filter is better." What is wrong, and what is the correct statement?
:::

::: answer
The p-value is computed *assuming* the null is true: it is $P(\text{data this extreme} \mid H_0)$, not $P(H_0 \mid \text{data})$. The two are linked only through Bayes' theorem with a prior on $H_0$.

Correct statement: if the new filter were no better, data this favorable would turn up about four times in a hundred, so the null is rejected at the $5\%$ level. A probability about the filter itself needs a prior and a posterior — the Bayesian route. Report the size of the improvement and its confidence interval too, since the p-value alone says nothing about how much better.
:::

::: check
An accelerometer's noise is $\sigma = 0.8\,\mathrm{mg}$ per sample. How many samples are needed to detect a mean bias shift of $0.2\,\mathrm{mg}$ at significance $0.05$ with power $0.90$? What happens if the shift you care about is halved?
:::

::: answer
The multiplier is $z_{0.025} + z_{0.10} = 1.960 + 1.282 = 3.242$. Then $3.242 \times 0.8/0.2 = 12.97$, and $N \geq 12.97^2 = 168$ samples.

Halving the shift to $0.1\,\mathrm{mg}$ doubles the bracket to $25.9$, so $N$ quadruples to $673$. Sample count grows as $1/\Delta^2$ because the standard error falls only as $1/\sqrt{N}$: each factor of two in resolution costs a factor of four in test time.
:::

::: check
A qualification campaign runs $400$ dispersed cases with no requirement violations. What can you claim about the violation probability, and at what confidence?
:::

::: answer
By the rule of three, the $95\%$ upper bound is about $3/400 = 0.0075$; the exact $1 - 0.05^{1/400} = 0.00746$ agrees. So: the violation probability is below about $0.75\%$, with $95\%$ confidence.

You may not claim it is zero. You may not claim compliance with a $10^{-3}$ requirement either — that needs about $3/10^{-3} = 3000$ clean runs. The estimate $\hat{p} = 0/400 = 0$ is the maximum likelihood value and is useless on its own; the upper bound is the whole content of the result.
:::

::: check
The same bench record is used twice: once to estimate the gyro's noise standard deviation $s$, and once to test whether its mean differs from zero. Why does that force a t distribution instead of a normal, and when does the difference stop mattering?
:::

::: answer
$s$ is itself random, estimated from the same $N$ samples, so the bottom of $(\bar{x} - \mu)/(s/\sqrt{N})$ wobbles along with the top. A sample that happens to give a small $s$ inflates the statistic. That extra scatter gives the ratio heavier tails than a standard normal — exactly the t distribution with $N - 1$ degrees of freedom.

The penalty shrinks as $s$ gets closer to $\sigma$: the $95\%$ multiplier falls from $2.365$ at $\nu = 7$ to $2.042$ at $\nu = 30$ and $1.980$ at $\nu = 120$. Beyond a few dozen samples the Gaussian multiplier is within a few percent, and the difference is cosmetic.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\operatorname{sd}(\bar{x}) = \sigma/\sqrt{N}$ | Standard error of the mean; sets the width of every interval below |
| $\bar{x} \pm z_{\alpha/2}\,\sigma/\sqrt{N}$ | Confidence interval, $\sigma$ known; $z = 1.645,\ 1.960,\ 2.576$ at $90\%,\ 95\%,\ 99\%$ |
| $\bar{x} \pm t_{\nu,\,1-\alpha/2}\,s/\sqrt{N}$, $\nu = N-1$ | Interval with $\sigma$ estimated; $t_{7,\,0.975} = 2.365$, $t_{30,\,0.975} = 2.042$ |
| $\hat{\theta} \pm z_{\alpha/2}/\sqrt{I(\hat{\theta})}$ | Interval for any maximum likelihood estimate, from the Fisher information |
| Coverage | $1-\alpha$ is the long-run fraction of such intervals containing the truth |
| $N_{\text{eff}} \approx N\Delta t/(2T)$ | Effective sample count for correlated data; use it in place of $N$ |
| $H_0$, $H_1$, $\alpha$, p-value | Null, alternative, significance level, $P(\text{data this extreme} \mid H_0)$ |
| $z = (\bar{x} - \mu_0)/(\sigma/\sqrt{N})$, $t = (\bar{x} - \mu_0)/(s/\sqrt{N})$ | Test statistics for a mean |
| Type I rate $\alpha$; Type II rate $\beta$; power $1-\beta$ | False alarm and miss; a test rejects $\theta_0$ exactly when $\theta_0$ is outside the interval |
| $N \geq \big((z_{\alpha/2} + z_\beta)\sigma/\Delta\big)^2$ | Samples to detect a shift $\Delta$; $z_{0.025} + z_{0.10} = 3.242$ |
| $\hat{p} \pm z_{\alpha/2}\sqrt{\hat{p}(1-\hat{p})/N}$ | Wald interval for a probability; use Wilson or Clopper–Pearson at small counts |
| $p_{\max} \approx 3/N$ | Rule of three: $95\%$ upper bound after $N$ runs with zero failures |

The next lesson makes Monte Carlo the subject instead of the example: how to generate the samples, why the error falls as $1/\sqrt{N}$ in any number of dimensions, and how to size and shrink a campaign that must resolve a rare event. Every result it quotes will carry one of the intervals built here.

::: context two-spreads Two different spreads
It is easy to mix up two standard deviations. The **standard deviation** $\sigma$ describes how much individual readings scatter; it is a property of the sensor and does not shrink with more data. The **standard error** $\sigma/\sqrt{N}$ describes how much the *average* would scatter if you repeated the whole test; it shrinks as you collect more. A datasheet quotes the first. A calibration report should quote the second. Eight gyro readings with $s = 0.187\,^\circ/\mathrm{h}$ give a standard error of $0.066\,^\circ/\mathrm{h}$.
:::

::: context twenty-intervals Twenty throws of the net
Twenty simulated bench tests, each with $N = 8$ samples from a gyro whose true bias is $0.5$ and $\sigma = 0.2$ known. Each bar is one $95\%$ interval, $\bar{x} \pm 0.139$. The dashed line is the truth. Nineteen intervals catch it; one (red) misses. Over many more tests, the catch rate settles at $95\%$ — but no single bar knows whether it is a catch.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="180" y1="12" x2="180" y2="182" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="4 3"/>
  <g stroke-width="2.5">
    <line x1="113.9" y1="22" x2="232.7" y2="22" stroke="#1d6fd1"/><line x1="142.4" y1="30" x2="261.2" y2="30" stroke="#1d6fd1"/>
    <line x1="87.6" y1="38" x2="206.4" y2="38" stroke="#1d6fd1"/><line x1="91.5" y1="46" x2="210.3" y2="46" stroke="#1d6fd1"/>
    <line x1="117.0" y1="54" x2="235.8" y2="54" stroke="#1d6fd1"/><line x1="104.9" y1="62" x2="223.6" y2="62" stroke="#1d6fd1"/>
    <line x1="133.3" y1="70" x2="252.1" y2="70" stroke="#1d6fd1"/><line x1="148.6" y1="78" x2="267.4" y2="78" stroke="#1d6fd1"/>
    <line x1="124.9" y1="86" x2="243.7" y2="86" stroke="#1d6fd1"/><line x1="85.6" y1="94" x2="204.4" y2="94" stroke="#1d6fd1"/>
    <line x1="135.5" y1="102" x2="254.3" y2="102" stroke="#1d6fd1"/><line x1="75.2" y1="110" x2="194.0" y2="110" stroke="#1d6fd1"/>
    <line x1="157.4" y1="118" x2="276.2" y2="118" stroke="#1d6fd1"/><line x1="135.0" y1="126" x2="253.7" y2="126" stroke="#1d6fd1"/>
    <line x1="114.8" y1="134" x2="233.6" y2="134" stroke="#1d6fd1"/><line x1="203.9" y1="142" x2="322.7" y2="142" stroke="#b4232c"/>
    <line x1="157.1" y1="150" x2="275.9" y2="150" stroke="#1d6fd1"/><line x1="106.1" y1="158" x2="224.9" y2="158" stroke="#1d6fd1"/>
    <line x1="115.7" y1="166" x2="234.5" y2="166" stroke="#1d6fd1"/><line x1="118.6" y1="174" x2="237.4" y2="174" stroke="#1d6fd1"/>
  </g>
  <line x1="30" y1="186" x2="330" y2="186" stroke="#1f2a44" stroke-width="1.2"/>
  <g stroke="#1f2a44" stroke-width="1"><line x1="51.4" y1="186" x2="51.4" y2="190"/><line x1="94.3" y1="186" x2="94.3" y2="190"/><line x1="137.1" y1="186" x2="137.1" y2="190"/><line x1="180" y1="186" x2="180" y2="190"/><line x1="222.9" y1="186" x2="222.9" y2="190"/><line x1="265.7" y1="186" x2="265.7" y2="190"/><line x1="308.6" y1="186" x2="308.6" y2="190"/></g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle"><text x="51.4" y="202">0.2</text><text x="94.3" y="202">0.3</text><text x="137.1" y="202">0.4</text><text x="180" y="202">0.5</text><text x="222.9" y="202">0.6</text><text x="265.7" y="202">0.7</text><text x="308.6" y="202">0.8</text></g>
  <text x="326" y="138" font-size="11" fill="#b4232c" text-anchor="end">miss</text>
  <text x="186" y="12" font-size="11" fill="#1f2a44">true μ</text>
</svg>
```
:::

::: context student A brewer called Student
The t distribution was published in 1908 by William Sealy Gosset, a chemist at the Guinness brewery in Dublin. He worked with tiny samples — a few batches of barley or hops — and noticed the normal-curve multipliers gave intervals that were too narrow. Guinness did not let its staff publish under their own names, so he signed the paper "Student". Ronald Fisher later put the result on a rigorous footing and made it famous.
:::

::: context degrees-of-freedom What a degree of freedom is
With $N$ numbers you have $N$ independent pieces of information. Computing $\bar{x}$ from them and then measuring deviations *from* $\bar{x}$ uses one piece up: the deviations must add to zero, so once you know $N - 1$ of them, the last is forced. Only $N - 1$ deviations are free to vary. That count, $\nu = N - 1$, is the degrees of freedom, and it is the same $N - 1$ as in Bessel's correction.
:::

::: context heavy-tails How much heavier the tails are
The t distribution with $\nu = 2$ (blue) against the standard normal (grey). The t peak is lower and the tails are fatter. Beyond $\pm 3$, the normal holds only $0.27\%$ of its probability; the $\nu = 2$ t holds $9.5\%$ — about 35 times more. That is why the multiplier for $95\%$ jumps from $1.96$ to $4.30$ when you have only three samples.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="160" x2="330" y2="160" stroke="#1f2a44" stroke-width="1.2"/>
  <polyline fill="none" stroke="#6c7a93" stroke-width="2" points="30.0,160.0 34.7,159.9 39.4,159.9 44.1,159.8 48.8,159.7 53.4,159.6 58.1,159.4 62.8,159.0 67.5,158.6 72.2,158.0 76.9,157.1 81.6,155.9 86.2,154.4 90.9,152.4 95.6,149.8 100.3,146.6 105.0,142.7 109.7,138.0 114.4,132.4 119.1,125.9 123.8,118.6 128.4,110.4 133.1,101.6 137.8,92.2 142.5,82.6 147.2,72.9 151.9,63.6 156.6,55.0 161.2,47.3 165.9,41.0 170.6,36.3 175.3,33.3 180.0,32.3 184.7,33.3 189.4,36.3 194.1,41.0 198.8,47.3 203.4,55.0 208.1,63.6 212.8,72.9 217.5,82.6 222.2,92.2 226.9,101.6 231.6,110.4 236.2,118.6 240.9,125.9 245.6,132.4 250.3,138.0 255.0,142.7 259.7,146.6 264.4,149.8 269.1,152.4 273.8,154.4 278.4,155.9 283.1,157.1 287.8,158.0 292.5,158.6 297.2,159.0 301.9,159.4 306.6,159.6 311.2,159.7 315.9,159.8 320.6,159.9 325.3,159.9 330.0,160.0"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="30.0,155.8 34.7,155.4 39.4,155.0 44.1,154.6 48.8,154.1 53.4,153.5 58.1,152.8 62.8,152.1 67.5,151.2 72.2,150.3 76.9,149.2 81.6,147.9 86.2,146.5 90.9,144.8 95.6,143.0 100.3,140.8 105.0,138.2 109.7,135.3 114.4,131.9 119.1,128.0 123.8,123.5 128.4,118.3 133.1,112.4 137.8,105.8 142.5,98.4 147.2,90.4 151.9,82.0 156.6,73.4 161.2,65.2 165.9,57.8 170.6,52.0 175.3,48.2 180.0,46.9 184.7,48.2 189.4,52.0 194.1,57.8 198.8,65.2 203.4,73.4 208.1,82.0 212.8,90.4 217.5,98.4 222.2,105.8 226.9,112.4 231.6,118.3 236.2,123.5 240.9,128.0 245.6,131.9 250.3,135.3 255.0,138.2 259.7,140.8 264.4,143.0 269.1,144.8 273.8,146.5 278.4,147.9 283.1,149.2 287.8,150.3 292.5,151.2 297.2,152.1 301.9,152.8 306.6,153.5 311.2,154.1 315.9,154.6 320.6,155.0 325.3,155.4 330.0,155.8"/>
  <g stroke="#1f2a44" stroke-width="1"><line x1="67.5" y1="160" x2="67.5" y2="164"/><line x1="142.5" y1="160" x2="142.5" y2="164"/><line x1="180" y1="160" x2="180" y2="164"/><line x1="217.5" y1="160" x2="217.5" y2="164"/><line x1="292.5" y1="160" x2="292.5" y2="164"/></g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle"><text x="67.5" y="177">−3</text><text x="142.5" y="177">−1</text><text x="180" y="177">0</text><text x="217.5" y="177">1</text><text x="292.5" y="177">3</text></g>
  <text x="200" y="30" font-size="11" fill="#6c7a93">normal</text>
  <text x="222" y="72" font-size="11" fill="#1d6fd1">t, ν = 2</text>
  <text x="300" y="140" font-size="11" fill="#1d6fd1" text-anchor="middle">fat tail</text>
</svg>
```
:::

::: context allan-plateau Why averaging stops helping
You met the Allan deviation in the IMU-error lesson: average a gyro's output over longer and longer windows and plot how much those averages scatter. At first the scatter falls as $1/\sqrt{\tau}$, exactly the standard-error law, because the noise is nearly white. Then it flattens and eventually rises, because the bias is wandering on its own slow timescale. On that flat part, longer averaging buys nothing — the independent-sample assumption behind $\sigma/\sqrt{N}$ has broken down, and $N_{\text{eff}}$ has stopped growing.
:::

::: context courtroom Innocent until proven guilty
The courtroom picture explains the lopsided language of testing. A jury says "guilty" or "not guilty" — never "innocent". "Not guilty" means the evidence fell short, not that innocence was proven. In the same way, a test "rejects $H_0$" or "fails to reject" it; it never "accepts" it. The system is built to make convicting an innocent person (a Type I error) rare, and it pays for that with some guilty people going free (Type II errors).
:::

::: context point-oh-five Why 0.05?
There is nothing magic about $0.05$. Ronald Fisher suggested one-in-twenty as a convenient line in his 1925 book *Statistical Methods for Research Workers*, and it stuck. Engineering uses whatever the cost of a mistake demands. A false alarm that aborts a launch is expensive, so on-board fault detectors use far smaller false-alarm rates — often thresholds of several sigma. Particle physicists demand "five sigma", a one-sided p-value of about $3 \times 10^{-7}$, before announcing a discovery.
:::

::: context error-types Two ways to be wrong
The null distribution of the test statistic (grey, centered at $0$) and one alternative (blue, centered at $3$). The dashed lines are the thresholds $\pm 1.96$. Red: the Type I area, $\alpha = 0.05$ split across both tails of the null. Orange: the Type II area, $\beta \approx 0.15$ — the part of the alternative that lands inside the thresholds and is missed. Move the threshold right and red shrinks but orange grows; only more data pulls the two curves apart.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 185" font-family="Inter, Arial, sans-serif">
  <path d="M123.3,150 L123.3,149.7 L127.6,149.6 L132.0,149.4 L136.3,149.1 L140.6,148.6 L144.9,148.0 L149.2,147.1 L153.5,145.9 L157.9,144.3 L162.2,142.2 L166.5,139.5 L170.8,136.1 L175.1,132.0 L179.4,127.0 L183.8,121.2 L188.1,114.4 L192.4,106.9 L196.7,98.5 L201.0,89.6 L205.3,80.3 L205.3,150 Z" fill="#f2b880"/>
  <path d="M205.3,150 L205.3,132.5 L211.4,137.9 L217.4,141.9 L223.5,144.8 L229.5,146.8 L235.6,148.0 L241.6,148.9 L247.7,149.4 L253.7,149.6 L259.8,149.8 L265.8,149.9 L271.9,150.0 L277.9,150.0 L284.0,150.0 L290.0,150.0 L290.0,150 Z" fill="#b4232c"/>
  <path d="M40.0,150 L40.0,148.7 L42.5,148.3 L45.0,147.9 L47.4,147.5 L49.9,146.9 L52.4,146.2 L54.9,145.4 L57.3,144.5 L59.8,143.4 L62.3,142.1 L64.8,140.6 L67.2,139.0 L69.7,137.0 L72.2,134.9 L74.7,132.5 L74.7,150 Z" fill="#b4232c"/>
  <polyline fill="none" stroke="#6c7a93" stroke-width="2" points="40.0,148.7 46.7,147.6 53.3,145.9 60.0,143.3 66.7,139.4 73.3,133.8 80.0,126.3 86.7,116.7 93.3,105.1 100.0,91.7 106.7,77.4 113.3,63.1 120.0,50.0 126.7,39.5 133.3,32.7 140.0,30.3 146.7,32.7 153.3,39.5 160.0,50.0 166.7,63.1 173.3,77.4 180.0,91.7 186.7,105.1 193.3,116.7 200.0,126.3 206.7,133.8 213.3,139.4 220.0,143.3 226.7,145.9 233.3,147.6 240.0,148.7 246.7,149.3 253.3,149.6 260.0,149.8 266.7,149.9 273.3,150.0 280.0,150.0 340.0,150.0"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="40.0,150.0 106.7,150.0 113.3,149.9 120.0,149.8 126.7,149.6 133.3,149.3 140.0,148.7 146.7,147.6 153.3,145.9 160.0,143.3 166.7,139.4 173.3,133.8 180.0,126.3 186.7,116.7 193.3,105.1 200.0,91.7 206.7,77.4 213.3,63.1 220.0,50.0 226.7,39.5 233.3,32.7 240.0,30.3 246.7,32.7 253.3,39.5 260.0,50.0 266.7,63.1 273.3,77.4 280.0,91.7 286.7,105.1 293.3,116.7 300.0,126.3 306.7,133.8 313.3,139.4 320.0,143.3 326.7,145.9 333.3,147.6 340.0,148.7"/>
  <line x1="40" y1="150" x2="340" y2="150" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="205.3" y1="20" x2="205.3" y2="150" stroke="#1f2a44" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="74.7" y1="20" x2="74.7" y2="150" stroke="#1f2a44" stroke-width="1" stroke-dasharray="4 3"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle"><text x="73.3" y="166">−2</text><text x="140" y="166">0</text><text x="206.7" y="166">2</text><text x="273.3" y="166">4</text><text x="340" y="166">6</text></g>
  <text x="140" y="22" font-size="11" fill="#6c7a93" text-anchor="middle">H₀ true</text>
  <text x="240" y="22" font-size="11" fill="#1d6fd1" text-anchor="middle">shift of 3</text>
  <text x="175" y="178" font-size="11" fill="#1f2a44" text-anchor="middle">test statistic; thresholds ±1.96</text>
</svg>
```
:::

::: context rule-of-three Borrowed from medicine
The rule of three became widely known through a 1983 medical paper by Hanley and Lippman-Hand with the memorable title "If nothing goes wrong, is everything all right?" Doctors faced the same question as flight engineers: a new drug given to $300$ patients with no serious side effect is not proven safe — at $95\%$ confidence the rate could still be as high as $1\%$. The same arithmetic tells a GNC team that $3000$ clean Monte Carlo runs are the least that can support a $10^{-3}$ claim.
:::

::: context bonferroni Paying for many looks
The correction is named after the Italian mathematician Carlo Emilio Bonferroni, whose probability inequality it rests on: the chance that *any* of several events happens is at most the sum of their chances. Test $m$ things each at level $\alpha/m$, and the chance of one or more false alarms is at most $m \times \alpha/m = \alpha$. It is conservative — when the tests are correlated, as channels in one simulation often are, it throws away some power — but it is never wrong.
:::
