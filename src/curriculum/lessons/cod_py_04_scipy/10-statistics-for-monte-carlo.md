---
id: l10-statistics-for-monte-carlo
title: Statistics for Monte Carlo runs
minutes: 22
covers:
  - 'scipy.stats: distributions, rvs, fit, percentile-based reporting for Monte Carlo'
---

Picture a bakery that makes a thousand cookies a day from the same recipe. No two come out exactly alike. One has a little more dough, one sat near the hot corner of the oven. If a customer asks "how big are your cookies?", the honest answer is not one number. It is something like "almost all of them are between 28 and 32 grams, and 99 out of 100 are under 31.5".

Rockets are the same. Every engine that leaves the factory pushes a little harder or softer than the drawing says. Every day the wind is different. Every sensor has its own small error. So an engineer who wants to know "will the booster land on the pad?" does not run the flight simulation once. She runs it thousands of times, each time with the uncertain inputs shaken a little, and then studies the pile of results. That is a **[[Monte Carlo|monte-carlo-name]] analysis** — answering a question by running many randomized trials and counting what happens. The shaken inputs are called **[[dispersions|dispersion-word]]**: the spread of each uncertain quantity around its nominal value.

`scipy.stats` is the SciPy toolbox for the three jobs this needs. It describes how an input is spread (a **distribution**), draws random samples from it (`rvs`), fits a distribution to measured data (`fit`), and lets you turn a pile of results into honest statements like "99% of runs land within 156 m". This lesson takes those four jobs in order.

## A distribution is an object you can ask questions

Think of a distribution as the recipe for the cookie sizes. It says which values are possible and how common each one is.

The most common recipe in engineering is the **normal distribution**, the familiar **[[bell curve|bell-curve]]**. Most values sit near the middle, and fewer and fewer sit far out on either side. Two numbers pin it down completely:

- the **mean** $\mu$ (read "mu"), the center of the bell;
- the **standard deviation** $\sigma$ (read "sigma"), how wide the bell is. About 68% of values fall within one $\sigma$ of the mean, and about 99.73% within three.

SciPy calls these two numbers by more general names. Every distribution in `scipy.stats` has a **`loc`** (location — where it sits) and a **`scale`** (how stretched it is). For the normal distribution, `loc` is the mean and `scale` is the standard deviation.

When you give a distribution its numbers, you get a **frozen distribution**: an object with its parameters locked in, which you can then ask questions. Here is an engine whose thrust is normal, with a mean of 845 kN (kilonewtons) and a standard deviation of 1%, which is 8.45 kN:

```python
from scipy import stats

thrust = stats.norm(loc=845.0, scale=8.45)  # kN: center 845, spread 8.45

print(thrust.mean(), thrust.std())          # the center and the spread
print(round(thrust.pdf(845.0), 4))          # height of the bell at its peak
print(round(thrust.cdf(830.0), 4))          # chance thrust is below 830 kN
print(round(thrust.ppf(0.99865), 1))        # thrust that 99.865% of engines stay under
print(round(thrust.sf(870.0), 5))           # chance thrust is above 870 kN
# 845.0 8.45
# 0.0472
# 0.0379
# 870.3
# 0.00155
```

Each method answers a different question. Learn them as a set, because every distribution in `scipy.stats` has the same ones.

- **`pdf(x)`**, the probability density function: how tall the curve is at $x$. It tells you which values are common. It is not itself a probability.
- **`cdf(x)`**, the cumulative distribution function: the chance of getting a value *at or below* $x$. It climbs from 0 to 1 as $x$ goes up.
- **`sf(x)`**, the survival function: the chance of getting a value *above* $x$. It equals `1 - cdf(x)`, but computed more accurately far out in the tail.
- **`ppf(q)`**, the **[[percent point function|cdf-and-ppf]]**: the value that a fraction $q$ of samples stay under. It runs the `cdf` backwards. You hand it a chance, it hands you a value.

::: key
A frozen distribution such as `stats.norm(loc=mu, scale=sigma)` answers: `pdf` (how common a value is), `cdf` (chance of being at or below), `sf` (chance of being above), `ppf` (the value a given fraction stays under — the inverse of `cdf`). For the normal distribution, `loc` is the mean and `scale` is the standard deviation.
:::

::: example Will the engine make its minimum thrust?
A customer needs every engine to make at least 830 kN. The engines are normal with mean 845 kN and standard deviation 8.45 kN. What fraction will fail, and what thrust do 99.865% of engines stay under?

Step 1. Failing means thrust at or below 830 kN, so this is a `cdf` question: `thrust.cdf(830.0)` gives $0.0379$. About 3.8% of engines, or roughly 38 in every 1,000, fall short.

Step 2. Sanity check by hand. The gap from the mean is $845 - 830 = 15$ kN. In standard deviations that is $15 / 8.45 \approx 1.78$. So 830 kN sits about 1.8 $\sigma$ below the mean. Only a few percent of a bell curve lies more than 1.8 $\sigma$ below the middle, so 3.8% makes sense.

Step 3. The second question hands us a chance and asks for a value, so it is a `ppf` question: `thrust.ppf(0.99865)` gives $870.3$ kN. That is $845 + 3 \times 8.45 = 870.35$ kN, three standard deviations up, as expected. The fraction $0.99865$ is the share of any normal distribution that lies below $+3\sigma$.
:::

## Drawing random samples with `rvs`

A Monte Carlo run needs actual numbers to feed into the simulation: this engine's thrust, this day's wind. The method **`rvs`** (random variates — random values drawn from the distribution) produces them.

Always pass a random-number generator made by NumPy, and give it a **[[seed|seed-reproducible]]** — a starting number that makes the "random" sequence repeat exactly. That way a colleague who runs your analysis gets the same draws you did, and a strange run can be replayed to find out what went wrong.

```python
import numpy as np
from scipy import stats

thrust = stats.norm(loc=845.0, scale=8.45)
rng = np.random.default_rng(7)               # seed 7: same numbers every run

draws = thrust.rvs(size=5, random_state=rng)
print(np.round(draws, 2))

big = thrust.rvs(size=100_000, random_state=rng)
print(round(big.mean(), 2), round(big.std(), 2))
# [845.01 847.52 842.68 837.47 841.16]
# 844.99 8.44
```

Five draws scatter around 845. A hundred thousand draws have a mean and spread that land within a hair of the recipe's 845 and 8.45. The more samples, the closer the pile matches the recipe.

Not every input is normal. A mixture-ratio error might be equally likely anywhere in a band, which is a **uniform distribution**: flat, with hard edges. SciPy has it as `stats.uniform`, and it is the one that trips up almost everyone.

::: warning `scale` is a width, not an upper limit
For `stats.uniform`, `loc` is the lower edge and `scale` is the *width* of the band. The upper edge is `loc + scale`. Writing the two edges as you would say them out loud gives a band 25 times too wide, and nothing warns you:

```python
from scipy import stats

mix = stats.uniform(loc=0.98, scale=0.04)   # from 0.98 to 0.98 + 0.04
print([float(v) for v in mix.support()])

wrong = stats.uniform(loc=0.98, scale=1.02) # meant "up to 1.02", got up to 2.0
print([float(v) for v in wrong.support()])
# [0.98, 1.02]
# [0.98, 2.0]
```

The method `support()` returns the smallest and largest possible values. Print it once for every distribution you build, before you trust a single run.
:::

## Fitting a distribution to measured data

So far we invented the recipe. In real work the recipe comes from test data. You fire 2,000 engines on a test stand, record each one's specific impulse (a measure of how much push the engine gets from each kilogram of propellant, stated in seconds), and ask: what normal distribution best describes these numbers?

That is what **`fit`** does. You call it on the distribution family, not on a frozen object, and hand it the data. It returns the parameters that make the data most likely, a method called **[[maximum likelihood|maximum-likelihood]]**.

```python
import numpy as np
from scipy import stats

rng = np.random.default_rng(42)
isp = stats.norm(loc=311.0, scale=1.5).rvs(size=2000, random_state=rng)

loc, scale = stats.norm.fit(isp)
print(round(loc, 2), round(scale, 2))

model = stats.norm(loc=loc, scale=scale)    # freeze the fitted model
print(round(model.ppf(0.01), 1))            # Isp only 1% of engines fall below
# 310.92 1.5
# 307.4
```

Here we made fake test data from a known recipe (mean 311 s, standard deviation 1.5 s) so you can see `fit` recover it: 310.92 and 1.50. Then we froze the fitted model and asked it a design question. Only 1% of engines should come in below 307.4 s.

The workflow is always the same: **fit, freeze, ask**.

::: key
`stats.norm.fit(data)` returns `(loc, scale)` by maximum likelihood. Freeze the result with `stats.norm(loc=loc, scale=scale)` to ask it questions. Other families work the same way; `floc=0` pins the location at zero and fits only the rest.
:::

::: warning `fit` finds the best numbers, not the right shape
`fit` always returns an answer. It will happily fit a bell curve to data that is lopsided, or that can never be negative. The numbers it returns are the best *for the shape you chose*. Choosing the shape is your job, and the next section shows what the wrong shape costs.
:::

## Report percentiles, not "mean plus three sigma"

Now for the payoff. You have run the landing simulation 5,000 times. Each run gives one number, the **miss distance**: how far from the center of the pad the booster touched down. Management wants one number for the report: "how far off can it land?"

The tempting answer is "the mean plus three standard deviations". For a bell curve that is the value 99.865% of runs stay under. But a miss distance is not a bell curve. It can never be negative, and it has a long tail to the right. If the east–west error and the north–south error are each normal with the same $\sigma$, the distance itself follows the **[[Rayleigh distribution|rayleigh-shape]]**, which is lopsided.

The honest tool is the **percentile**: the value that a given percent of the runs stay under. The 99th percentile, written P99, is the distance that 99% of runs are within. NumPy computes it straight from the pile of results with `np.percentile`, with no assumption about the shape.

```python
import numpy as np
from scipy import stats

rng = np.random.default_rng(1)
n = 5000
dx = stats.norm(loc=0.0, scale=50.0).rvs(size=n, random_state=rng)  # m, east
dy = stats.norm(loc=0.0, scale=50.0).rvs(size=n, random_state=rng)  # m, north
miss = np.hypot(dx, dy)                     # distance from the pad center, m

m, s = miss.mean(), miss.std(ddof=1)
print(round(m, 1), round(s, 1), round(m + 3 * s, 1))
print(np.round(np.percentile(miss, [50, 99, 99.73]), 1))
print(round(np.mean(miss > m + 3 * s), 4))  # share of runs past "mean + 3 sigma"
# 62.5 32.8 161.0
# [ 58.5 155.5 173.2]
# 0.0074
```

`np.hypot(dx, dy)` computes $\sqrt{dx^2 + dy^2}$, the straight-line distance. The option `ddof=1` makes `std` divide by $N-1$ instead of $N$, the usual choice for a sample.

::: example Mean plus three sigma versus the real tail
Read the output above line by line.

Step 1. The mean miss is 62.5 m and the standard deviation is 32.8 m. "Mean plus three sigma" is $62.5 + 3 \times 32.8 = 160.9$ m, which the code prints as 161.0 m (it used the unrounded numbers).

Step 2. If the misses were a bell curve, only 0.135% of runs would go past that line. The last line says 0.0074, which is 0.74% of runs. That is $0.74 / 0.135 \approx 5.5$ times more runs past the line than the "three sigma" label promises.

Step 3. The percentiles tell the truth directly. Half the runs land within 58.5 m (P50). 99% land within 155.5 m (P99). 99.73% land within 173.2 m (P99.73), which is 12 m farther out than "mean plus three sigma".

Step 4. Sanity check: the tail on the right is long, so the true far percentiles sit beyond where a bell curve would put them. The lopsided shape is exactly why the shortcut under-reports.
:::

If you do want a smooth model of the tail, fit the right shape. A Rayleigh fit with the location pinned at zero recovers the per-axis spread and predicts the far tail well:

```python
import numpy as np
from scipy import stats

rng = np.random.default_rng(1)
dx = stats.norm(0.0, 50.0).rvs(size=5000, random_state=rng)
dy = stats.norm(0.0, 50.0).rvs(size=5000, random_state=rng)
miss = np.hypot(dx, dy)

scale = stats.rayleigh.fit(miss, floc=0)[1]  # pin loc at 0, fit only the scale
print(round(scale, 1))
print(round(stats.rayleigh(scale=scale).ppf(0.9973), 1))

loc_n, scale_n = stats.norm.fit(miss)        # the wrong shape, for comparison
print(round(stats.norm(loc_n, scale_n).cdf(0.0), 3))  # "chance" of a negative distance
# 49.9
# 171.7
# 0.028
```

The Rayleigh fit finds a scale of 49.9 m (the truth is 50) and puts P99.73 at 171.7 m, close to the 173.2 m counted from the runs. The normal fit, by contrast, claims a 2.8% chance of a *negative* distance, which is impossible. That one number is enough to reject the shape.

::: key
Report Monte Carlo results as percentiles of the outputs (`np.percentile(results, 99)` for P99), not as mean ± 3σ. Output distributions are often lopsided, and then "mean + 3σ" does not mean what the reader thinks it means.
:::

## How many runs buy how much confidence?

A percentile computed from runs is itself a little random. Run another 1,000 cases with a different seed and P99 moves. So a careful report says not only "P99 is 155 m" but also how sure you are that the true P99 is no worse.

Here is the idea. Sort the $N$ results from smallest to largest. The $k$-th value in that sorted list is called the $k$-th **[[order statistic|order-statistic]]**. Each run has a 99% chance of landing below the true P99, independently of the others. So the *number* of runs below the true P99 behaves like the number of heads in $N$ coin flips of a coin that comes up heads 99% of the time. That count follows a **binomial distribution**, which SciPy has as `stats.binom`.

The $k$-th sorted value is at or above the true P99 whenever at most $k-1$ runs fell below it. So the confidence that the $k$-th value is a safe upper bound on P99 is `stats.binom.cdf(k - 1, N, 0.99)`.

```python
from scipy import stats

n = 1000
for k in (990, 995, 996):
    conf = stats.binom.cdf(k - 1, n, 0.99)
    print(k, round(conf, 3))
# 990 0.417
# 995 0.934
# 996 0.971
```

With 1,000 runs, the 990th value — roughly what `np.percentile(x, 99)` hands you — is a safe bound on the true P99 only about 42% of the time. To be at least 95% sure, go out to the 996th value, the fifth-largest result.

::: note Why the binomial count is the right tool
Call the true P99 the number $p_{99}$. By definition each run lands below it with probability $0.99$. Let $B$ be how many of the $N$ runs land below it. Each run is a yes-or-no trial with the same chance, independent of the others, so $B$ is binomial with $N$ trials and success chance $0.99$.

The $k$-th smallest result is below $p_{99}$ exactly when at least $k$ runs are below $p_{99}$. So it is at or above $p_{99}$ exactly when $B \le k-1$, and

$$
P(\text{k-th value} \ge p_{99}) = P(B \le k-1),
$$

which is the binomial `cdf` at $k-1$. Nothing here assumed the shape of the miss distribution. That is why this bound is trusted for any output.
:::

The same thinking answers the other question every review asks: "how often does it fail?" If $k$ of $N$ runs failed, the raw rate $k/N$ is only an estimate. A one-sided 95% upper bound on the true failure rate comes from the **beta distribution**: `stats.beta.ppf(0.95, k + 1, N - k)`.

::: example Two bad landings in a thousand
A campaign of 1,000 runs has 2 landings off the pad. What failure rate can you promise with 95% confidence?

Step 1. The raw rate is $2 / 1000 = 0.002$, or 0.2%.

Step 2. The upper bound is `stats.beta.ppf(0.95, 3, 998)`, which gives $0.0063$. So with 95% confidence, the true failure rate is below 0.63%.

Step 3. Compare with zero failures in 1,000 runs: `stats.beta.ppf(0.95, 1, 1000)` gives $0.003$, or 0.3%. Even a perfect campaign cannot promise better than that. This is the **[[rule of three|rule-of-three]]**: with zero failures in $N$ runs, the 95% upper bound is about $3/N$.

Step 4. Sanity check: two failures leave you less sure than zero failures, and 0.63% is indeed worse than 0.3%. To promise something like 0.1%, you need several thousand clean runs.
:::

```python
from scipy import stats

n, k = 1000, 2                                 # 2 bad runs out of 1000
upper = stats.beta.ppf(0.95, k + 1, n - k)     # 95% upper bound on the true rate
print(round(k / n, 4), round(upper, 4))
print(round(stats.beta.ppf(0.95, 1, 1000), 4)) # zero bad runs out of 1000
# 0.002 0.0063
# 0.003
```

::: warning The run count is part of the claim
"P99 = 155 m" from 100 runs and from 10,000 runs are very different statements. With 100 runs, the 99th percentile rests on about one result. Always state $N$, and when the claim matters, state the order statistic or confidence you used.
:::

## Check yourself

::: check
A pressure sensor's error is normal with mean 0 and standard deviation 2 kPa. Which method of `stats.norm(loc=0, scale=2)` gives the chance that the error is larger than 5 kPa, and roughly what should it be?
:::

::: answer
"Larger than" is a question about the upper tail, so use `sf(5.0)` (or `1 - cdf(5.0)`, which is less accurate far out). The value 5 kPa is $5 / 2 = 2.5$ standard deviations above the mean. The chance of landing beyond $+2.5\sigma$ on a bell curve is small, well under 1%. In fact `sf(5.0)` gives about $0.0062$, or 0.62%.
:::

::: check
A teammate writes `stats.uniform(loc=-0.5, scale=0.5)` to model a timing error that should be anywhere from $-0.5$ to $+0.5$ ms. What band did they actually build, and how do you fix it?
:::

::: answer
For `uniform`, `scale` is the width, so the band runs from `loc` to `loc + scale`: from $-0.5$ to $-0.5 + 0.5 = 0$ ms. Every draw will be negative or zero. The band they want is 1 ms wide, so the fix is `stats.uniform(loc=-0.5, scale=1.0)`. Printing `support()` would have shown `(-0.5, 0.0)` and caught it.
:::

::: check
Why should every call to `rvs` in a Monte Carlo analysis take a seeded `random_state`?
:::

::: answer
A seeded generator makes the random draws repeat exactly. Anyone who reruns the analysis gets the same inputs and the same results, and a single strange run can be replayed with its exact inputs to debug it. Without a seed, a failure that happened once may never be seen again.
:::

::: check
A Monte Carlo of peak structural load gives a mean of 40 kN and a standard deviation of 5 kN. The report says "the 99.865% load is $40 + 3 \times 5 = 55$ kN". What is wrong with that claim, and what should the report use instead?
:::

::: answer
"Mean + 3σ" equals the 99.865% value only if the loads follow a bell curve. Peak loads are often lopsided, with a long tail on the high side, and then more than 0.135% of runs can exceed 55 kN. The report should compute the percentile straight from the runs, `np.percentile(loads, 99.865)`, and state how many runs it came from. If the claim has to be a safe bound, use a high order statistic chosen with `stats.binom.cdf`, as in the lesson.
:::

::: check
You ran 3,000 landing cases and none failed. Roughly what is the 95% upper bound on the true failure rate? Which SciPy call gives it exactly?
:::

::: answer
By the rule of three, the bound is about $3 / 3000 = 0.001$, or 0.1%. The exact value is `stats.beta.ppf(0.95, 1, 3000)` (that is, $k = 0$ failures, so the arguments are $k+1 = 1$ and $N-k = 3000$). It also comes out to about 0.001.
:::

## Summary

| Idea | What it does | SciPy / NumPy |
|---|---|---|
| Frozen distribution | A recipe with its numbers locked in | `stats.norm(loc=mu, scale=sigma)` |
| `pdf`, `cdf`, `sf` | How common; chance at or below; chance above | `d.pdf(x)`, `d.cdf(x)`, `d.sf(x)` |
| `ppf` | Value a fraction $q$ stays under (inverse of `cdf`) | `d.ppf(q)` |
| Random draws | Samples for Monte Carlo runs, repeatable | `d.rvs(size=n, random_state=rng)` |
| Uniform | Flat band from `loc` to `loc + scale` | `stats.uniform(loc=a, scale=b - a)` |
| Fit | Maximum-likelihood parameters from data | `stats.norm.fit(data)`, `floc=0` to pin |
| Percentile | Value a percent of runs stay under | `np.percentile(results, 99)` |
| Confidence in P99 | Chance the $k$-th sorted value bounds P99 | `stats.binom.cdf(k - 1, N, 0.99)` |
| Failure-rate bound | 95% upper bound with $k$ of $N$ failed | `stats.beta.ppf(0.95, k + 1, N - k)`; about $3/N$ if $k=0$ |

The next and last lesson of the module steps back. It shows how `scipy.constants` keeps units honest, and then ties the whole module together into one question: given a problem's structure, which SciPy tool should you reach for?

::: context monte-carlo-name Named after a casino
The method is named after the Monte Carlo casino in Monaco, because it runs on chance, like a roulette wheel. The name came from scientists at Los Alamos in the late 1940s, including Stanislaw Ulam, John von Neumann and Nicholas Metropolis, who used random sampling on the first electronic computers to study neutrons in nuclear materials. Today almost every launch vehicle's guidance and landing design is signed off partly on Monte Carlo results.
:::

::: context dispersion-word What goes into a dispersion list
A real list of dispersions for a booster landing can have hundreds of entries: engine thrust and mixture ratio, the mass and center of mass of the vehicle, winds at every altitude, air density, sensor biases and noise, actuator delays, and more. Each entry gets a distribution and a spread, usually taken from test data or supplier specifications. Choosing and justifying that list is a large part of the work, and the Verification, Validation and Monte Carlo module later in the course is built around it.
:::

::: context bell-curve Where 68% and 99.73% come from
The normal curve is highest at the mean and falls off symmetrically. The share of the area within one $\sigma$ of the middle is about 68.3%; within two, about 95.4%; within three, about 99.73%. So only about 1 value in 370 falls more than $3\sigma$ from the mean, split equally between the two tails.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <path d="M130.0,125 L130.0,67.4 L135.0,61.6 L140.0,56.0 L145.0,50.6 L150.0,45.6 L155.0,41.2 L160.0,37.3 L165.0,34.2 L170.0,31.9 L175.0,30.5 L180.0,30.0 L185.0,30.5 L190.0,31.9 L195.0,34.2 L200.0,37.3 L205.0,41.2 L210.0,45.6 L215.0,50.6 L220.0,56.0 L225.0,61.6 L230.0,67.4 L230.0,125 Z" fill="#8fb8f0"/>
  <path d="M20.0,124.4 L30.0,123.9 L40.0,123.1 L50.0,121.8 L60.0,119.7 L70.0,116.6 L80.0,112.1 L90.0,106.2 L100.0,98.6 L110.0,89.3 L120.0,78.8 L130.0,67.4 L140.0,56.0 L150.0,45.6 L160.0,37.3 L170.0,31.9 L175.0,30.5 L180.0,30.0 L185.0,30.5 L190.0,31.9 L200.0,37.3 L210.0,45.6 L220.0,56.0 L230.0,67.4 L240.0,78.8 L250.0,89.3 L260.0,98.6 L270.0,106.2 L280.0,112.1 L290.0,116.6 L300.0,119.7 L310.0,121.8 L320.0,123.1 L330.0,123.9 L340.0,124.4" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <line x1="15" y1="125" x2="345" y2="125" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#6c7a93" stroke-width="1.5">
    <line x1="30" y1="125" x2="30" y2="131"/><line x1="80" y1="125" x2="80" y2="131"/><line x1="130" y1="125" x2="130" y2="131"/>
    <line x1="180" y1="125" x2="180" y2="131"/><line x1="230" y1="125" x2="230" y2="131"/><line x1="280" y1="125" x2="280" y2="131"/><line x1="330" y1="125" x2="330" y2="131"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="30" y="145">−3σ</text><text x="80" y="145">−2σ</text><text x="130" y="145">−1σ</text><text x="180" y="145">μ</text>
    <text x="230" y="145">+1σ</text><text x="280" y="145">+2σ</text><text x="330" y="145">+3σ</text>
  </g>
  <text x="180" y="100" font-size="12" text-anchor="middle" fill="#1f2a44">68.3%</text>
  <text x="180" y="18" font-size="11" text-anchor="middle" fill="#6c7a93">99.73% lies between −3σ and +3σ</text>
</svg>
```
:::

::: context cdf-and-ppf Reading the same curve both ways
The `cdf` curve climbs from 0 to 1. Read it forward — start at a value on the bottom axis, go up to the curve, then across — and you get a chance. Read it backward — start at a chance on the side, go across to the curve, then down — and you get a value. That backward reading is `ppf`. Here, a chance of 0.841 reads back to exactly one $\sigma$ above the mean.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="135" x2="340" y2="135" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="60" y1="135" x2="60" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="60" y1="25" x2="340" y2="25" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
  <path d="M60.0,134.9 L69.0,134.7 L78.0,134.5 L87.0,134.1 L96.0,133.5 L105.0,132.5 L114.0,131.0 L123.0,129.0 L132.0,126.1 L141.0,122.3 L150.0,117.5 L159.0,111.7 L168.0,104.8 L177.0,97.1 L186.0,88.7 L195.0,80.0 L204.0,71.3 L213.0,62.9 L222.0,55.2 L231.0,48.3 L240.0,42.5 L249.0,37.7 L258.0,33.9 L267.0,31.0 L276.0,29.0 L285.0,27.5 L294.0,26.5 L303.0,25.9 L312.0,25.5 L321.0,25.3 L330.0,25.1" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="60" y1="42.5" x2="240" y2="42.5" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="5 3"/>
  <line x1="240" y1="42.5" x2="240" y2="135" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="5 3"/>
  <polygon points="240,135 235,125 245,125" fill="#b4232c"/>
  <g font-size="11" fill="#1f2a44">
    <text x="54" y="139" text-anchor="end">0</text>
    <text x="54" y="29" text-anchor="end">1</text>
    <text x="54" y="46" text-anchor="end" fill="#b4232c">0.841</text>
    <text x="195" y="152" text-anchor="middle">μ</text>
    <text x="240" y="152" text-anchor="middle" fill="#b4232c">μ + 1σ</text>
    <text x="68" y="70" fill="#1d6fd1">cdf: value → chance</text>
    <text x="246" y="80" fill="#b4232c">ppf: chance → value</text>
  </g>
</svg>
```
:::

::: context seed-reproducible Random, but repeatable
Computers do not flip real coins. A **pseudo-random number generator** is a formula that turns one number into the next in a way that looks random and passes statistical tests. Start it from the same seed and it produces the same sequence every time. NumPy's `default_rng` uses a generator called PCG64. In flight-software testing this repeatability matters: when run 3,817 of 5,000 fails, you want to rerun exactly that case, with exactly those inputs, under a debugger.
:::

::: context maximum-likelihood The parameters that best explain the data
Imagine sliding a bell curve left and right and stretching it wider and narrower over your data points. For each setting, ask: if this were the true recipe, how likely would it be to produce exactly the data I have? Maximum likelihood picks the setting where that answer is largest. For the normal distribution it gives the sample mean and a standard deviation that divides by $N$, not $N-1$. With 2,000 points the difference is about 0.03%, far too small to matter here.
:::

::: context rayleigh-shape Why distance is lopsided
Add two independent normal errors at right angles, each with spread $\sigma$, and the distance from the center follows the Rayleigh distribution, named after the British physicist Lord Rayleigh. It starts at zero, peaks at $\sigma$, and trails off slowly to the right. Its median, $\sigma\sqrt{2\ln 2} \approx 1.177\sigma$, is the **circular error probable**, the radius that half the hits land inside: 58.9 m when $\sigma = 50$ m. The picture puts "mean + 3σ" (161 m) and the true P99.73 (172 m) on the same curve.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="25" y1="130" x2="345" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M30.0,130.0 L35.6,117.5 L41.2,105.3 L46.8,93.5 L52.4,82.4 L58.0,72.2 L63.6,63.0 L69.2,55.0 L74.8,48.3 L80.4,43.0 L86.0,39.0 L91.6,36.4 L97.2,35.2 L102.8,35.1 L108.4,36.3 L114.0,38.5 L119.6,41.6 L125.2,45.5 L130.8,50.0 L136.4,55.0 L142.0,60.3 L147.6,65.8 L153.2,71.4 L158.8,77.0 L164.4,82.4 L170.0,87.6 L175.6,92.5 L181.2,97.2 L186.8,101.5 L192.4,105.4 L198.0,108.9 L203.6,112.1 L209.2,114.9 L214.8,117.3 L220.4,119.5 L226.0,121.3 L231.6,122.9 L237.2,124.2 L242.8,125.3 L248.4,126.2 L254.0,127.0 L259.6,127.6 L265.2,128.1 L270.8,128.5 L276.4,128.9 L282.0,129.1 L287.6,129.3 L293.2,129.5 L298.8,129.6 L304.4,129.7 L310.0,129.8 L321.2,129.9 L338.0,130.0" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="112.5" y1="130" x2="112.5" y2="37.8" stroke="#1f2a44" stroke-width="1.2" stroke-dasharray="4 3"/>
  <line x1="255.4" y1="130" x2="255.4" y2="60" stroke="#f2b880" stroke-width="2"/>
  <line x1="270.8" y1="130" x2="270.8" y2="40" stroke="#b4232c" stroke-width="2"/>
  <g font-size="11">
    <text x="112.5" y="148" text-anchor="middle" fill="#1f2a44">median 59 m</text>
    <text x="250" y="55" text-anchor="end" fill="#1f2a44">mean + 3σ = 161 m</text>
    <text x="276" y="36" fill="#b4232c">P99.73 = 172 m</text>
    <text x="30" y="148" fill="#6c7a93">0</text>
    <text x="330" y="148" text-anchor="end" fill="#6c7a93">220 m</text>
  </g>
</svg>
```
:::

::: context order-statistic Sorting is the whole trick
An order statistic is a value picked by its rank after sorting: the smallest, the fifth-largest, the median. Because the rank argument uses only counting, it works for any distribution, which is why reviewers trust it. The statistician Samuel Wilks worked out these "tolerance limits" in the 1940s. His best-known special case: if you run 59 cases and use the largest result, you are 95% sure it is above the true P95, since $0.95^{59} \approx 0.048$. With 299 runs, the largest result bounds P99 with 95% confidence, since $0.99^{299} \approx 0.0495$.
:::

::: context rule-of-three Where the 3 comes from
If the true failure rate were $p$, the chance of seeing zero failures in $N$ runs is $(1-p)^N$. The 95% upper bound is the $p$ at which that chance drops to 5%: $(1-p)^N = 0.05$. For small $p$, $(1-p)^N \approx e^{-pN}$, so $pN = -\ln 0.05 \approx 3.0$ and $p \approx 3/N$. That is the whole rule: zero failures in 1,000 runs means "below about 0.3%", not "zero".
:::
