---
id: l04-how-many-runs-buys-what-claim
title: How many runs buys what claim
minutes: 19
covers:
  - Number of runs against the confidence in the claim; the zero-failure formula and its assumptions
---

A verification report that says "we ran the campaign and saw no failures" has said almost nothing until it also says how many runs, and what reliability, at what confidence, that specific count actually supports. Those three numbers are locked together by an exact relationship, not a rule of thumb, and the relationship is unforgiving: reaching for one more decimal of reliability costs an order of magnitude in runs, and a single failure in an otherwise clean campaign costs far more than intuition suggests. This lesson derives the relationship, confirms it numerically against a fixed target the module will keep coming back to, and then shows exactly what one bad draw does to the claim.

## The zero-failure argument

Model each Monte Carlo case, or each physical trial, as an independent Bernoulli draw: it succeeds with some true probability $R$ — the vehicle's actual reliability, a fixed but unknown number — and fails with probability $1-R$. Run $n$ such trials and observe zero failures, all $n$ successes.

The question a review board is really asking is: how large does $n$ have to be before "zero failures out of $n$" becomes strong evidence that $R$ is at least some target value, rather than a fluke? Frame it as ruling out the alternative. Suppose the true reliability were no better than the target $R$ — the least favorable case consistent with failing to meet it. Under that supposition, the probability of observing $n$ straight successes by chance alone is $R^n$, since the trials are independent and each succeeds with probability $R$. If that probability is small — no larger than $1-C$ for a chosen confidence level $C$ — then seeing $n$ straight successes is strong evidence against the supposition, at confidence $C$:

$$
R^n \leq 1 - C.
$$

Solving for $n$ takes one careful step: take logarithms of both sides, which preserves the inequality since both sides are positive, giving $n\ln R \leq \ln(1-C)$. Because $R<1$, $\ln R$ is negative, and dividing an inequality by a negative number reverses it:

$$
n \geq \frac{\ln(1-C)}{\ln R}.
$$

The smallest integer $n$ satisfying this is the answer: run at least that many trials, observe zero failures, and you are entitled to claim reliability at least $R$ at confidence $C$. This is not new machinery — it is the rule of three from the prerequisite probability and statistics module, relabeled. That module derived the exact upper confidence bound on a failure probability $p$ from zero observed failures in $N$ trials by solving $(1-p)^N = \alpha$ for $p$, with $\alpha = 1-C$ the significance level. Substitute $R = 1-p$ and $C = 1-\alpha$ into that relationship and it is algebraically identical to the one derived above — the same fact, stated in terms of reliability and confidence instead of failure probability and significance, because that is the language a flight readiness review actually uses.

::: key
Zero-failure run count: $n = \dfrac{\ln(1-C)}{\ln R}$, rounded up. It rests on one compound assumption: the $n$ trials are independent, identically distributed draws of a fixed true reliability $R$ — the same dispersion set, the same failure mechanisms, that the real flight will effectively be drawn from. If the model does not contain a failure mode, no number of clean runs finds it, and the formula's confidence says nothing about that mode at all.
:::

## What the assumption actually demands

The formula's derivation used exactly one property of the trials: that each one is an independent draw from the same fixed distribution with success probability $R$. That single mathematical assumption unpacks into two separate engineering demands, and both have to hold or the number $n$ produced by the formula is not buying what it appears to buy.

**Independence and a fixed $R$.** Each case's outcome must not influence, or be influenced by, any other case's outcome, and every case must be drawn from the same underlying probability of success. A shared software bug that deterministically affects every case the same way, a dispersion sampler with a subtle bias that shifts partway through a campaign, or cases drawn from two different vehicle configurations lumped into one count all violate this — the trials are no longer exchangeable draws of one fixed $R$, and treating them as if they were manufactures a confidence claim the data does not support.

**The dispersion set must actually be the flight.** The formula's $R$ is the reliability of the *model* being sampled, not of the vehicle directly. If the dispersion set omits a real source of uncertainty, or gets a distribution's shape or correlation wrong in a way that hides a real failure mechanism, every run in the campaign is drawn from a distribution that does not describe the vehicle that will actually fly. No amount of increasing $n$ repairs this — a clean run of any length against the wrong model supports a confident, precise claim about the wrong thing. This is the single most common way a Monte Carlo verification argument fails in practice, and it is not a flaw in the arithmetic; the arithmetic is exact once the assumption holds.

::: warning Zero failures never proves zero failure probability
No finite $n$, however large, can ever certify $R=1$. The formula bounds $R$ from below at a stated confidence; it does not, and cannot, rule out a failure mode rare enough not to have appeared yet in $n$ tries. "We ran ten thousand cases and saw nothing" is evidence for a lower bound on reliability, stated with the formula above — it is never a claim that failure is impossible.
:::

## Confirming the numbers

::: example What 300 runs buys, and what the next nine costs
For a target reliability of $R = 0.99$ at confidence $C = 0.95$:

$$
n \geq \frac{\ln(0.05)}{\ln(0.99)} = \frac{-2.9957}{-0.010050} = 298.07 \ \Rightarrow\ n = 299.
$$

Three hundred clean runs, then, comfortably support a claim of $99\%$ reliability at $95\%$ confidence — checking the other direction, $300$ runs with zero failures imply confidence $1-0.99^{300} = 0.9510$, above the target. Pushing the reliability target to $R=0.999$ at the same confidence:

$$
n \geq \frac{\ln(0.05)}{\ln(0.999)} = \frac{-2.9957}{-0.0010005} = 2994.2 \ \Rightarrow\ n = 2995,
$$

about ten times as many runs — $2995/299 = 10.02$ — for one additional nine of reliability. This is the general pattern, not a coincidence of these particular numbers: because $\ln R \approx -(1-R)$ for $R$ close to $1$, the required $n$ scales approximately as $1/(1-R)$, so each additional nine multiplies the run count by about ten. A frequently quoted figure in this exact area — $99.87\%$ reliability, the Gaussian one-sided three-sigma value, at $95\%$ confidence — needs $n = \lceil \ln(0.05)/\ln(0.9987)\rceil = 2303$ clean runs, and a $99\%$ target at a relaxed $90\%$ confidence needs only $n = \lceil\ln(0.10)/\ln(0.99)\rceil = 230$. All four numbers come from the same one-line formula; only the inputs change.
:::

The pattern is worth sitting with before moving on: campaigns of a few hundred cases, which feel large, support only a two-nines reliability claim, and reaching three nines is an order-of-magnitude jump in compute, not a marginal increase. A program that budgets a few hundred dispersed cases for a subsystem and then reports "verified to 99.9% confidence" has, almost certainly, done the arithmetic wrong or misunderstood what a clean run history can say.

## The fragility of a single failure

Everything above assumed zero failures. Real campaigns occasionally see one, and the honest question is how much that single case costs the claim — not by intuition, but by the same exact machinery, generalized.

With $k$ failures observed in $n$ trials, the one-sided upper confidence bound on the failure probability $p$ at confidence $C$ is the Clopper–Pearson bound from the prerequisite module: the largest $p$ for which observing $k$ or fewer failures out of $n$ still has probability at least $1-C$. At $k=0$ this reduces to exactly the relationship derived above; for $k \geq 1$ it has to be solved numerically, but it is worth seeing what it does at a fixed campaign size.

::: example One failure in the same 300-run campaign
Fix $n=300$, the campaign sized above to support $R \geq 0.99$ at $95\%$ confidence on zero failures. Solving the Clopper–Pearson bound at $k=0,1,2$ failures gives:

| Failures $k$ | Upper bound on $p$ | Supported reliability $R = 1-p$ |
| --- | --- | --- |
| $0$ | $0.00994$ | $\geq 99.01\%$ |
| $1$ | $0.01572$ | $\geq 98.43\%$ |
| $2$ | $0.02084$ | $\geq 97.92\%$ |

A single failure in the same $300$-run campaign drops the defensible claim from "at least $99\%$ reliable" to only "at least $98.4\%$ reliable" — it no longer supports the original target at all. Recovering the ability to claim $R \geq 0.99$ at $95\%$ confidence with one failure allowed takes solving the same bound for $n$ instead of $p$, which gives $n \approx 473$ — fifty-eight percent more runs than the zero-failure campaign needed, all to absorb one bad draw.

This is not a peculiarity of the Clopper–Pearson formula; it is a fact about how little information a small failure count carries, confirmed directly by simulation. Draw $2{,}000{,}000$ independent $300$-trial campaigns at the true failure probability $p = 0.015715$ — exactly the $k=1$ upper bound above — and count how often at most one failure occurs:

```python
import numpy as np
from scipy import stats

n, p_upper = 300, 0.015715
rng = np.random.default_rng(20260922)
fails = rng.binomial(n, p_upper, size=2_000_000)
print("simulated P(K<=1):", np.mean(fails <= 1))
print("exact P(K<=1):    ", stats.binom.cdf(1, n, p_upper))
# simulated P(K<=1): 0.0502125
# exact P(K<=1):     0.05
```

The simulation returns $0.05021$ against the exact $0.05000$ — agreement well inside the sampling error of two million trials, confirming that $p=0.01572$ really is the failure rate at which observing one failure or fewer in $300$ trials happens exactly five percent of the time, which is precisely what a correctly sized $95\%$ one-sided bound means.

A separate, complementary simulation shows why a single failure should not, by itself, be read as "the vehicle is bad." Suppose the true reliability is actually $R=0.999$ — ten times better than the $R=0.99$ target — and a $300$-run campaign is flown against it. The expected number of failures is only $0.3$, but simulating $200{,}000$ such campaigns shows a clean run occurs only $74.1\%$ of the time; a single failure occurs by pure chance in $22.2\%$ of campaigns, and at least one failure in $25.9\%$ — about one campaign in four, from a vehicle four times better than the target reliability. A single observed failure is genuinely ambiguous evidence: it is consistent with a mediocre vehicle and it is also a common, unremarkable outcome for a very good one. What it is not consistent with is claiming, from that campaign alone, the same confidence a clean run would have supported — the campaign has to be read for what it actually shows, and what it shows, honestly stated, is the weaker bound in the table above.
:::

::: key
A campaign sized for zero failures loses its claim sharply if even one occurs: at $n=300$, the reliability the data supports at $95\%$ confidence falls from $99.01\%$ (zero failures) to $98.43\%$ (one failure) — and restoring the original claim with one failure allowed takes about $58\%$ more runs. A single failure is real evidence, but it is weak evidence, and a vehicle well above the target reliability still shows one by chance in a meaningful fraction of campaigns of this size.
:::

A verification report built from a campaign like this should quote two further numbers alongside the reliability bound: the **circular error probable**, the median miss radius, and a **high percentile** of the same quantity — never the single worst observed case, which the earlier probability and statistics module already showed is not a bound on anything. Reporting an empirical percentile from a finite sample is best done by **nearest rank** rather than interpolation — the $p$-th percentile taken as the $\lceil p/100 \times N\rceil$-th smallest observed value — so that the number quoted in a verification report is an actual run that exists and can be replayed and inspected, not a value invented by interpolating between two of them.

## Check yourself

::: check
Derive, from $R^n \leq 1-C$, why the inequality for $n$ flips direction when solving for it, and state the final formula.
:::

::: answer
Taking the natural log of both sides of $R^n \leq 1-C$ (valid since both sides are positive) gives $n\ln R \leq \ln(1-C)$. Because $0<R<1$, $\ln R$ is negative, and dividing both sides of an inequality by a negative number reverses its direction, giving $n \geq \ln(1-C)/\ln R$. The smallest integer satisfying this is the minimum run count for the claim.
:::

::: check
Compute the number of zero-failure runs needed to support $R=0.995$ reliability at $C=0.95$ confidence, and compare it to the $R=0.99$, $C=0.95$ figure from this lesson.
:::

::: answer
$n \geq \ln(0.05)/\ln(0.995) = -2.9957/-0.0050125 = 597.6$, so $n=598$. This is almost exactly double the $299$ runs needed for $R=0.99$ at the same confidence — halving the allowed failure probability from $1\%$ to $0.5\%$ roughly doubles the required run count, consistent with $n$ scaling approximately as $1/(1-R)$ for $R$ near one.
:::

::: check
A campaign of $500$ dispersed cases, run against a dispersion set that — unknown to the analysts — omits a real sensor failure mode, produces zero failures. What, precisely, does the zero-failure formula entitle the team to claim, and what does it not?
:::

::: answer
The formula entitles a claim about the reliability of the *model actually sampled*: at $95\%$ confidence, the sampled model's reliability (against the failure modes it represents) is at least $1-\alpha^{1/500}$, a strong-looking number. It entitles no claim whatsoever about the real vehicle's reliability against the omitted sensor failure mode, because that mode was never sampled — every one of the $500$ trials was drawn from a distribution that cannot produce it. The independence and fixed-$R$ assumption was satisfied for the model that was run; the separate assumption that the dispersion set represents the actual flight was not, and the formula's confidence number does not know the difference.
:::

::: check
Explain why observing exactly one failure in a 300-run campaign is described in this lesson as "genuinely ambiguous evidence" rather than a clear sign of a bad vehicle.
:::

::: answer
Because the simulation in this lesson showed that even a vehicle at $R=0.999$ — ten times better than a $0.99$ target — produces at least one failure in a $300$-run campaign about $25.9\%$ of the time purely by chance, since the expected failure count is only $0.3$ and the Poisson-like scatter around a small expectation is large relative to the expectation itself. A single failure is therefore consistent with both a vehicle that genuinely fails to meet the target and a vehicle well above it that had one unlucky draw; the honest response is not to guess which, but to report the weaker bound the data actually supports and, per a later lesson in this module, investigate the specific failure to find out which case applies.
:::

::: check
A team wants to recover a $99\%$-reliability claim at $95\%$ confidence after seeing one failure in their original $300$-run campaign, by running $173$ more cases (bringing the total to $473$) and treating any additional failures the same way. Is this valid, and what must be true about the additional runs for it to be?
:::

::: answer
It is valid only if the extra $173$ runs are independent, identically distributed draws from the same dispersion set as the original $300$ — the same models, same distributions, same correlations, run at the same point in the design (no hardware or software changes in between that would change the true $R$ being sampled). If that holds, the combined $473$-run, $1$-failure result is exactly the case this lesson's Clopper–Pearson table shows recovers the $R\geq0.99$ claim at $95\%$ confidence. If the design changed between the two batches, the pooled count no longer represents draws of one fixed $R$, and the formula's confidence is no longer valid for the combined campaign.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $n \geq \ln(1-C)/\ln R$ | Zero-failure run count for reliability $R$ at confidence $C$; round up |
| $R=0.99,\,C=0.95 \Rightarrow n=299$ | About $300$ clean runs for two nines of reliability |
| $R=0.999,\,C=0.95 \Rightarrow n=2995$ | About ten times as many runs for a third nine |
| $R=0.9987,\,C=0.95 \Rightarrow n=2303$ | The Gaussian one-sided three-sigma reliability target, at $95\%$ confidence |
| Compound assumption | Independent, identically distributed trials of a fixed $R$, drawn from a dispersion set that actually contains the flight's failure mechanisms |
| One failure at $n=300$ | Claim falls from $R\geq99.01\%$ to $R\geq98.43\%$; recovering the original claim needs about $473$ runs |
| Reporting convention | CEP (median miss) and a high percentile (nearest rank), never the single worst observed case |

The formula in this lesson answers "how many runs," but it says nothing about what a run has to do to count as a failure in the first place — a decision that has to be made before the campaign, not after. That is the subject of the next lesson.
