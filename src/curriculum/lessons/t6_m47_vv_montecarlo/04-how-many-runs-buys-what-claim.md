---
id: l04-how-many-runs-buys-what-claim
title: How many runs buys what claim
minutes: 18
covers:
  - Number of runs against the confidence in the claim; the zero-failure formula and its assumptions
---

You have used the vending machine at school twenty times, and it has never eaten your money. Is it perfect? You cannot say that. A machine that eats one coin in fifty could easily go twenty tries without doing it. But if it had worked two thousand times in a row, you would feel very differently. The number of clean tries is what turns "it seems fine" into something you can defend.

A Monte Carlo campaign is the same situation with higher stakes. A verification report that says "we ran the campaign and saw no failures" has said almost nothing until it also says three things: how many runs, what **reliability** (the chance a flight succeeds), and at what **confidence** (how sure you are of that claim). Those three numbers are tied together by an exact rule, not a rule of thumb.

The rule is unforgiving. One more nine of reliability — going from $99\%$ to $99.9\%$ — costs about ten times as many runs. A single failure in an otherwise clean campaign costs far more than intuition suggests. This lesson derives the rule, checks it against numbers the module will keep coming back to, and then shows exactly what one bad run does to the claim.

## The zero-failure argument

Think of each Monte Carlo case as a coin flip with a lopsided coin. It lands "success" with some true probability $R$ and "failure" with probability $1-R$. That kind of yes-or-no draw is a **[[Bernoulli trial|bernoulli-trial]]**: one try, two outcomes, a fixed chance of each. The true $R$ is the vehicle's actual reliability. It is a fixed number, but nobody knows it.

Run $n$ such trials and see zero failures: all $n$ succeed. How large must $n$ be before "zero out of $n$" is strong evidence that $R$ is at least some target, rather than a lucky streak?

The trick is to argue against the opposite. Suppose the true reliability were only the target $R$ and no better — the least favorable case that still misses the target. Each trial succeeds with probability $R$, and the trials are independent, so the chance of $n$ straight successes is $R \times R \times \cdots \times R = R^n$. If that chance is small — no larger than $1-C$ for a chosen confidence level $C$ — then a clean streak of $n$ would be a rare fluke under the supposition. So seeing one is strong evidence against it, at **[[confidence|what-confidence-means]]** $C$:

$$
R^n \leq 1 - C.
$$

Now solve for $n$, one step at a time.

1. Take the natural logarithm of both sides. Both sides are positive, and $\ln$ always grows when its input grows, so the $\leq$ survives: $n\ln R \leq \ln(1-C)$.
2. Because $R$ is less than $1$, $\ln R$ is **[[negative|why-ln-negative]]**. Dividing both sides of an inequality by a negative number flips it:

$$
n \geq \frac{\ln(1-C)}{\ln R}.
$$

The smallest whole number $n$ that satisfies this is the answer. Run at least that many trials, see zero failures, and you may claim reliability of at least $R$ at confidence $C$. The symbol $\lceil x \rceil$, read "the ceiling of $x$", means "round $x$ up to the next whole number", so $n = \lceil \ln(1-C)/\ln R \rceil$.

This is not new machinery. It is the rule of three from the prerequisite probability and statistics module with new labels. That module found the exact upper bound on a failure probability $p$ after zero failures in $N$ trials by solving $(1-p)^N = \alpha$, where $\alpha = 1-C$ is the significance level. Put $R = 1-p$ and $C = 1-\alpha$ into that equation and you get exactly the one above. It is the same fact, told in terms of reliability and confidence, because that is the language a flight readiness review uses.

::: key
Zero-failure run count: $N = \dfrac{\ln(1-\text{confidence})}{\ln(\text{reliability})}$, rounded up — in symbols, $n = \dfrac{\ln(1-C)}{\ln R}$. For $99.87\%$ at $95\%$ confidence, $N = 2303$. It rests on one compound assumption: the trials are independent, identically distributed draws of a fixed true reliability $R$ — the same dispersion set, and the same failure mechanisms, that the real flight will be drawn from. If the model does not contain a failure mode, no number of clean runs finds it, and the formula's confidence says nothing about that mode at all.
:::

## What the assumption actually demands

The derivation used exactly one property of the trials: each one is an independent draw from the same fixed distribution, with success probability $R$. That single piece of mathematics unpacks into two separate engineering demands. Both must hold, or the $n$ from the formula is not buying what it seems to buy.

**Independence and a fixed $R$.** No case's outcome may affect any other case's, and every case must be drawn with the same underlying chance of success. Several ordinary slips break this. A shared software bug hits every case the same way. A dispersion sampler has a subtle bias that shifts partway through the campaign. Cases from two different vehicle configurations get lumped into one count. In each, the trials are no longer interchangeable draws of one fixed $R$. Treating them as if they were manufactures a confidence the data does not support.

**The dispersion set must actually be the flight.** The formula's $R$ is the reliability of the *model being sampled*, not of the vehicle directly. Suppose the dispersion set leaves out a real source of uncertainty, or gets a distribution's shape or correlation wrong in a way that hides a real failure mechanism. Then every run is drawn from a distribution that does not describe the vehicle that will fly. Making $n$ bigger does not repair that. A clean campaign of any length against the wrong model gives a confident, precise claim about the wrong thing.

This is the most common way a Monte Carlo verification argument fails in practice. It is not a flaw in the arithmetic, which is exact once the assumption holds.

::: warning Zero failures never proves zero failure probability
No finite $n$, however large, can ever certify $R=1$. The formula bounds $R$ from below at a stated confidence. It cannot rule out a failure mode rare enough not to have shown up yet in $n$ tries. "We ran ten thousand cases and saw nothing" is evidence for a lower bound on reliability. It is never a claim that failure is impossible.
:::

## Confirming the numbers

::: example What 300 runs buys, and what the next nine costs
**Two nines.** Take a target reliability $R = 0.99$ at confidence $C = 0.95$. Put the numbers into the formula:

$$
n \geq \frac{\ln(0.05)}{\ln(0.99)} = \frac{-2.9957}{-0.010050} = 298.07 \ \Rightarrow\ n = 299.
$$

The two minus signs cancel, and $298.07$ rounds up to $299$. So three hundred clean runs support a claim of $99\%$ reliability at $95\%$ confidence. Check it from the other side: $300$ runs with zero failures give confidence $1-0.99^{300} = 0.9510$, just above the target.

**Three nines.** Push the target to $R=0.999$ at the same confidence:

$$
n \geq \frac{\ln(0.05)}{\ln(0.999)} = \frac{-2.9957}{-0.0010005} = 2994.2 \ \Rightarrow\ n = 2995.
$$

That is $2995/299 = 10.02$ times as many runs for one more nine.

**Why ten times?** For $R$ close to $1$, $\ln R \approx -(1-R)$. (Check: $\ln 0.99 = -0.01005$, very nearly $-0.01$.) So $n \approx \ln(1/(1-C))/(1-R)$: the run count grows like $1/(1-R)$, and each extra nine divides $1-R$ by ten.

**Two more targets.** A figure quoted constantly in this area is $99.87\%$ reliability — the Gaussian **[[one-sided three-sigma|one-sided-three-sigma]]** value — at $95\%$ confidence. It needs $n = \lceil \ln(0.05)/\ln(0.9987)\rceil = \lceil 2302.9 \rceil = 2303$ clean runs. A $99\%$ target at a relaxed $90\%$ confidence needs only $n = \lceil\ln(0.10)/\ln(0.99)\rceil = \lceil 229.1 \rceil = 230$.

All four numbers come from the same one-line formula. Only the inputs change.
:::

Sit with that pattern for a moment. A campaign of a few hundred cases feels large, but it supports only a two-nines claim. Reaching three nines is a tenfold jump in computing, not a small top-up. A program that budgets a few hundred dispersed cases for a subsystem and then reports "verified to 99.9%" has almost certainly done the arithmetic wrong.

## The fragility of a single failure

Everything so far assumed zero failures. Real campaigns sometimes see one. How much does that single case cost the claim? Not by gut feeling, but by the same exact machinery, widened a little.

With $k$ failures in $n$ trials, the one-sided upper confidence bound on the failure probability $p$ at confidence $C$ is the **[[Clopper–Pearson|clopper-pearson]]** bound from the prerequisite module. It is the largest $p$ for which seeing $k$ or fewer failures out of $n$ still has probability at least $1-C$. At $k=0$ it reduces to the formula above. For $k \geq 1$ it must be solved numerically, but its behavior at a fixed campaign size is easy to read.

::: example One failure in the same 300-run campaign
Fix $n=300$, the campaign sized above for $R \geq 0.99$ at $95\%$ confidence with zero failures. Solving the Clopper–Pearson bound at $k=0$, $1$ and $2$ failures gives:

| Failures $k$ | Upper bound on $p$ | Supported reliability $R = 1-p$ |
| --- | --- | --- |
| $0$ | $0.00994$ | $\geq 99.01\%$ |
| $1$ | $0.01572$ | $\geq 98.43\%$ |
| $2$ | $0.02084$ | $\geq 97.92\%$ |

One failure drops the defensible claim from "at least $99\%$ reliable" to "at least $98.4\%$ reliable". It no longer supports the original target at all.

How many runs would win the claim back, with one failure allowed? Solve the same bound for $n$ instead of $p$: the smallest $n$ whose one-failure bound on $p$ is at most $0.01$ is $n = 473$. That is $473/299 \approx 1.58$, so about $58\%$ more runs than the zero-failure campaign, all to absorb one bad draw.

**Checking it by simulation.** Is $p=0.01572$ really the rate at which "one failure or fewer in $300$" happens exactly five percent of the time? Simulate two million $300$-run campaigns at that failure rate and count:

```python
import numpy as np
from scipy import stats

n, p_upper = 300, 0.015715
rng = np.random.default_rng(20260922)
fails = rng.binomial(n, p_upper, size=2_000_000)
print("simulated P(K<=1):", round(np.mean(fails <= 1), 4))
print("exact P(K<=1):    ", round(stats.binom.cdf(1, n, p_upper), 4))
# simulated P(K<=1): 0.0502
# exact P(K<=1):     0.05
```

The simulated $0.0502$ matches the exact $0.0500$ within the sampling scatter of two million trials. That is precisely what a correctly sized $95\%$ one-sided bound means.

**Why one failure does not, by itself, mean "bad vehicle".** Now suppose the true reliability is $R=0.999$, so the failure chance is ten times smaller than the $0.99$ target allows. Fly a $300$-run campaign against it. The expected number of failures is only $300 \times 0.001 = 0.3$. Yet a clean campaign happens only $0.999^{300} = 74.1\%$ of the time. Exactly one failure happens $22.2\%$ of the time, and at least one failure $25.9\%$ of the time — about one campaign in four, from a vehicle ten times better than the target. (Simulating $200{,}000$ such campaigns agrees with all three fractions to about a tenth of a percentage point.)

So a single failure is genuinely ambiguous. It fits a mediocre vehicle, and it is also a common, unremarkable outcome for a very good one. What it does not fit is claiming, from that campaign alone, the confidence a clean run would have given. The honest reading is the weaker bound in the table.
:::

::: key
A campaign sized for zero failures loses its claim sharply if even one occurs: at $n=300$, the reliability the data supports at $95\%$ confidence falls from $99.01\%$ (zero failures) to $98.43\%$ (one failure) — and restoring the original claim with one failure allowed takes about $58\%$ more runs. A single failure is real evidence, but weak evidence: a vehicle well above the target still shows one by chance in a meaningful fraction of campaigns this size.
:::

## Two more numbers for the report

Next to the reliability bound, a landing campaign's report should quote two more numbers. The first is the **circular error probable** (CEP): the radius of the circle around the target that holds half the landings — in other words, the median miss distance. The second is a **high percentile** of the same miss distance, such as the $99$th. The CEP alone is a median, so it says nothing about the tail. Never quote the single worst observed case instead; the prerequisite module showed that the largest value in a sample is not a bound on anything.

Take the percentile by **[[nearest rank|nearest-rank]]**, not by interpolation. The $p$-th percentile is the $\lceil p/100 \times N\rceil$-th smallest observed value. For $N = 100$ sorted values, the $99$th percentile is the $\lceil 99 \rceil = 99$th smallest. That way the number in the report is a real run that exists, with a **[[seed|replay-seed]]** you can replay and inspect — not a value invented between two runs.

## Check yourself

::: check
Starting from $R^n \leq 1-C$, show why the inequality flips direction when you solve for $n$, and state the final formula.
:::

::: answer
Take the natural log of both sides of $R^n \leq 1-C$. This is allowed because both sides are positive, and it keeps the direction because $\ln$ is increasing. That gives $n\ln R \leq \ln(1-C)$.

Because $0<R<1$, $\ln R$ is negative. Dividing both sides of an inequality by a negative number reverses it, so $n \geq \ln(1-C)/\ln R$. The smallest whole number satisfying this, $\lceil \ln(1-C)/\ln R \rceil$, is the minimum run count for the claim.
:::

::: check
How many zero-failure runs support $R=0.995$ at $C=0.95$? Compare it with the $R=0.99$, $C=0.95$ figure from this lesson.
:::

::: answer
$n \geq \ln(0.05)/\ln(0.995) = -2.9957/-0.0050125 = 597.6$, so $n=598$.

That is almost exactly double the $299$ runs for $R=0.99$ at the same confidence. Halving the allowed failure probability, from $1\%$ to $0.5\%$, roughly doubles the run count — just what $n$ growing like $1/(1-R)$ predicts.
:::

::: check
A campaign of $500$ dispersed cases produces zero failures. Unknown to the analysts, the dispersion set leaves out a real sensor failure mode. What, precisely, does the zero-failure formula entitle the team to claim, and what does it not?
:::

::: answer
It entitles a claim about the *model that was actually sampled*. Solving $R^{500} = 0.05$ gives $R = 0.05^{1/500} = 0.9940$. So at $95\%$ confidence, the sampled model's reliability, against the failure modes it represents, is at least $99.4\%$ (equivalently, its failure probability is at most $1 - 0.05^{1/500} = 0.60\%$).

It entitles no claim at all about the real vehicle's reliability against the missing sensor failure mode. That mode was never sampled: every one of the $500$ trials came from a distribution that cannot produce it. The independence-and-fixed-$R$ part of the assumption held for the model that was run. The other part — that the dispersion set represents the real flight — did not, and the confidence number cannot tell the difference.
:::

::: check
Why does this lesson call exactly one failure in a $300$-run campaign "genuinely ambiguous evidence" rather than a clear sign of a bad vehicle?
:::

::: answer
Because even a vehicle at $R=0.999$ — ten times better than a $0.99$ target — shows at least one failure in a $300$-run campaign about $25.9\%$ of the time, purely by chance. The expected count is only $0.3$, and the natural scatter around such a small expected count is large compared with the count itself.

So one failure fits both a vehicle that truly misses the target and a vehicle well above it that had one unlucky draw. The honest response is not to guess which. Report the weaker bound the data supports, and investigate that specific failure to find out which case you are in — a later lesson in this module shows how.
:::

::: check
After one failure in their original $300$-run campaign, a team wants to win back a $99\%$-reliability claim at $95\%$ confidence. They plan to run $173$ more cases (bringing the total to $473$) and count any new failures the same way. Is this valid, and what must be true about the extra runs?
:::

::: answer
It is valid only if the extra $173$ runs are independent, identically distributed draws from the same dispersion set as the first $300$: the same models, the same distributions, the same correlations, and no hardware or software change in between that would change the true $R$ being sampled.

If that holds, and the extra runs are all clean, the combined result is $473$ runs with $1$ failure. That is exactly the case this lesson showed recovers the $R\geq0.99$ claim at $95\%$ confidence. (A second failure would need $628$ runs in total.) If the design changed between the two batches, the pooled count is no longer draws of one fixed $R$, and the formula's confidence does not apply to the combined campaign.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $n \geq \ln(1-C)/\ln R$ | Zero-failure run count for reliability $R$ at confidence $C$; round up |
| $R=0.99,\,C=0.95 \Rightarrow n=299$ | About $300$ clean runs for two nines of reliability |
| $R=0.999,\,C=0.95 \Rightarrow n=2995$ | About ten times as many runs for a third nine |
| $R=0.9987,\,C=0.95 \Rightarrow n=2303$ | The Gaussian one-sided three-sigma reliability, at $95\%$ confidence |
| Compound assumption | Independent, identically distributed trials of a fixed $R$, drawn from a dispersion set that actually contains the flight's failure mechanisms |
| One failure at $n=300$ | Claim falls from $R\geq99.01\%$ to $R\geq98.43\%$; winning back the original claim needs $473$ runs |
| Reporting convention | CEP (median miss) and a high percentile (nearest rank), never the single worst observed case |

The formula answers "how many runs", but it says nothing about what a run must do to count as a failure in the first place. That decision has to be made before the campaign, not after, and it is the subject of the next lesson.

::: context bernoulli-trial A coin flip with a name
A Bernoulli trial is the simplest random experiment there is: one try, two outcomes, and the same chance of "yes" every time. A coin toss is one. So is a free throw by a steady player, or one Monte Carlo case scored pass or fail. It is named after Jacob Bernoulli, a Swiss mathematician whose book on probability, *Ars Conjectandi* ("The Art of Conjecturing"), was published in 1713, after his death. String $n$ independent Bernoulli trials together and count the successes, and you get the binomial distribution — the distribution behind every bound in this lesson.
:::

::: context what-confidence-means What the 95 percent is about
"$95\%$ confidence" does not mean "there is a $95\%$ chance the vehicle is at least $99\%$ reliable." The true $R$ is a fixed number, not a random one. The $95\%$ describes the *procedure*: if the true reliability were only at the target, a campaign this size would come back clean no more than $5\%$ of the time.

The curve below shows $0.99^n$, the chance of a clean streak of length $n$ for a vehicle exactly at $99\%$. It crosses the $5\%$ line at $n = 299$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="20" x2="50" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="44" y="34" font-size="11" fill="#1f2a44" text-anchor="end">1</text>
  <text x="44" y="174" font-size="11" fill="#1f2a44" text-anchor="end">0</text>
  <text x="50" y="186" font-size="11" fill="#1f2a44" text-anchor="middle">0</text>
  <text x="330" y="186" font-size="11" fill="#1f2a44" text-anchor="middle">600</text>
  <text x="200" y="198" font-size="11" fill="#6c7a93" text-anchor="middle">clean runs n</text>
  <line x1="50" y1="163" x2="340" y2="163" stroke="#b4232c" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="336" y="158" font-size="11" fill="#b4232c" text-anchor="end">5%</text>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="50.0,30.0 54.7,43.4 59.3,55.5 64.0,66.4 68.7,76.3 73.3,85.3 78.0,93.4 82.7,100.7 87.3,107.3 92.0,113.3 96.7,118.8 101.3,123.7 106.0,128.1 110.7,132.1 115.3,135.7 120.0,139.0 124.7,142.0 129.3,144.6 134.0,147.1 138.7,149.3 143.3,151.2 148.0,153.0 152.7,154.7 157.3,156.1 162.0,157.5 166.7,158.7 171.3,159.7 176.0,160.7 180.7,161.6 185.3,162.4 190.0,163.1 194.7,163.8 199.3,164.4 204.0,164.9 208.7,165.4 213.3,165.8 218.0,166.2 222.7,166.6 227.3,166.9 232.0,167.2 236.7,167.5 241.3,167.7 246.0,167.9 250.7,168.1 255.3,168.3 260.0,168.5 264.7,168.6 269.3,168.8 274.0,168.9 278.7,169.0 283.3,169.1 288.0,169.2 292.7,169.2 297.3,169.3 302.0,169.4 306.7,169.4 311.3,169.5 316.0,169.5 320.7,169.6 325.3,169.6 330.0,169.7"/>
  <line x1="189.5" y1="163" x2="189.5" y2="110" stroke="#1f2a44" stroke-width="1"/>
  <circle cx="189.5" cy="163" r="3.5" fill="#b4232c"/>
  <text x="194" y="106" font-size="12" fill="#1f2a44">n = 299</text>
  <text x="120" y="60" font-size="12" fill="#1d6fd1">0.99ⁿ</text>
</svg>
```
:::

::: context why-ln-negative Why the logarithm of a probability is negative
The natural logarithm $\ln x$ answers "what power of $e$ gives $x$?" (with $e \approx 2.718$). Since $e^0 = 1$, $\ln 1 = 0$. Any number between $0$ and $1$ needs a *negative* power: $e^{-0.01005} = 0.99$, so $\ln 0.99 = -0.01005$. Every reliability and every $1-C$ is below $1$, so both logarithms in the run-count formula are negative. Their ratio is positive, which is why the formula gives a sensible positive $n$. It is also why the inequality flips: you divided by a negative number.
:::

::: context one-sided-three-sigma Where 99.87 percent comes from
For a bell-shaped (Gaussian) quantity, $99.865\%$ of values lie below the mean plus three standard deviations. Only the thin right-hand tail beyond $+3\sigma$, about $0.135\%$, is left over. Engineers round that to $99.87\%$ and use it as a stock reliability target: "three sigma, one side". The two-sided figure, $99.73\%$, counts both tails; lesson 8 of this module explains why neither figure should be trusted for a quantity that is not Gaussian.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="150" x2="330" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon fill="#8fb8f0" points="30.0,150.0 37.5,149.9 45.0,149.8 52.5,149.7 60.0,149.3 67.5,148.8 75.0,147.8 82.5,146.3 90.0,143.8 97.5,140.2 105.0,135.1 112.5,128.2 120.0,119.4 127.5,108.7 135.0,96.5 142.5,83.3 150.0,70.1 157.5,58.1 165.0,48.5 172.5,42.2 180.0,40.0 187.5,42.2 195.0,48.5 202.5,58.1 210.0,70.1 217.5,83.3 225.0,96.5 232.5,108.7 240.0,119.4 247.5,128.2 255.0,135.1 262.5,140.2 270.0,143.8 277.5,146.3 285.0,147.8 292.5,150"/>
  <polyline fill="none" stroke="#1f2a44" stroke-width="1.5" points="30.0,150.0 37.5,149.9 45.0,149.8 52.5,149.7 60.0,149.3 67.5,148.8 75.0,147.8 82.5,146.3 90.0,143.8 97.5,140.2 105.0,135.1 112.5,128.2 120.0,119.4 127.5,108.7 135.0,96.5 142.5,83.3 150.0,70.1 157.5,58.1 165.0,48.5 172.5,42.2 180.0,40.0 187.5,42.2 195.0,48.5 202.5,58.1 210.0,70.1 217.5,83.3 225.0,96.5 232.5,108.7 240.0,119.4 247.5,128.2 255.0,135.1 262.5,140.2 270.0,143.8 277.5,146.3 285.0,147.8 292.5,148.8 300.0,149.3 307.5,149.7 315.0,149.8 322.5,149.9 330.0,150.0"/>
  <line x1="292.5" y1="150" x2="292.5" y2="95" stroke="#b4232c" stroke-width="1.5"/>
  <text x="292.5" y="166" font-size="11" fill="#1f2a44" text-anchor="middle">+3σ</text>
  <text x="180" y="166" font-size="11" fill="#1f2a44" text-anchor="middle">mean</text>
  <text x="180" y="110" font-size="12" fill="#1f2a44" text-anchor="middle">99.87% below</text>
  <text x="300" y="88" font-size="11" fill="#b4232c">0.13% above</text>
  <text x="300" y="102" font-size="11" fill="#b4232c">(too thin to see)</text>
</svg>
```
:::

::: context clopper-pearson An exact bound from 1934
Charles Clopper and Egon Pearson published their interval for a binomial proportion in the journal *Biometrika* in 1934. Instead of approximating the binomial with a bell curve, it uses the exact binomial probabilities, so it never claims more confidence than it has. That makes it the right tool when failures are few — exactly the situation in a verification campaign, where $k$ is $0$, $1$ or $2$. In Python, the one-sided $95\%$ upper bound for $k$ failures in $n$ runs is `scipy.stats.beta.ppf(0.95, k + 1, n - k)`, which returns $0.01572$ for $k=1$, $n=300$.
:::

::: context nearest-rank Picking a real run, not an in-between value
Sort the results from smallest to largest and count along to position $\lceil p/100 \times N \rceil$. With $N = 10$ miss distances, the $90$th percentile is the $\lceil 9 \rceil = 9$th smallest. Interpolation would instead blend two neighbors into a number no run ever produced — and a number no run produced cannot be replayed or investigated.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="60" x2="340" y2="60" stroke="#6c7a93" stroke-width="1"/>
  <g fill="#8fb8f0" stroke="#1f2a44" stroke-width="1">
    <circle cx="36" cy="60" r="9"/><circle cx="68" cy="60" r="9"/><circle cx="100" cy="60" r="9"/>
    <circle cx="132" cy="60" r="9"/><circle cx="164" cy="60" r="9"/><circle cx="196" cy="60" r="9"/>
    <circle cx="228" cy="60" r="9"/><circle cx="260" cy="60" r="9"/><circle cx="324" cy="60" r="9"/>
  </g>
  <circle cx="292" cy="60" r="11" fill="#b4232c" stroke="#1f2a44" stroke-width="1"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="36" y="88">1</text><text x="68" y="88">2</text><text x="100" y="88">3</text><text x="132" y="88">4</text>
    <text x="164" y="88">5</text><text x="196" y="88">6</text><text x="228" y="88">7</text><text x="260" y="88">8</text>
    <text x="292" y="88">9</text><text x="324" y="88">10</text>
  </g>
  <text x="292" y="34" font-size="12" fill="#b4232c" text-anchor="middle">90th percentile</text>
  <text x="20" y="20" font-size="11" fill="#6c7a93">sorted runs, smallest to largest</text>
</svg>
```
:::

::: context replay-seed The seed that makes a run come back
A computer's "random" numbers come from a formula started by a number called the seed. The same seed gives the same sequence every time. If each Monte Carlo case records its own seed, any case — the one at the $99$th percentile, or one that failed — can be run again bit for bit and examined in slow motion. Without recorded seeds, an interesting case is gone the moment the campaign ends. The campaign exercise in this module asks for exactly this per-case seeding.
:::
