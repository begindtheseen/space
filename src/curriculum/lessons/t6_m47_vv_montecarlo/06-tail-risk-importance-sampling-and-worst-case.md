---
id: l06-tail-risk-importance-sampling-and-worst-case
title: Tail risk, extreme-value estimation, and worst-case analysis
minutes: 20
covers:
  - Extreme-value estimation and importance sampling when the failure probability is too small to sample directly
  - Worst-case and corner-case analysis as a complement to, not a substitute for, Monte Carlo
---

A town wants a flood wall tall enough for the worst flood in a hundred years. But the river gauge has only forty years of records. The flood they fear has, in all likelihood, never been measured. Counting is useless: you cannot count something that never happened in your data. Engineers still build that wall, and they build it with numbers. They study the shape of the biggest floods they *have* seen and extend that shape past the edge of the record. That is the **[[hundred-year flood|hundred-year-flood]]** problem, and it is exactly the problem a launch vehicle's rarest failures pose.

The prerequisite probability and statistics module showed why direct sampling runs out. A probability's **relative standard error** — its typical error as a fraction of itself — is $\sqrt{(1-p)/(Np)}$ for $N$ runs. That is fine for $p$ near a tenth and ruinous for $p$ near $10^{-5}$. Pinning a $10^{-5}$ probability to within ten percent needs about $100$ observed events, so about $10^7$ direct runs. A vehicle's truly dangerous failure modes often live exactly there. A campaign sized for the reliability claims of the last two lessons will usually see none of them at all.

There are three responses, and a working verification effort uses more than one.

- **Importance sampling** tilts the sampling so rare events become common in the simulation, then undoes the tilt with weights. The prerequisite module built it; this lesson recalls it briefly.
- **Extreme-value estimation** fits a model to the shape of the tail from data already in hand, and extends it past where counting runs out — the flood-wall method.
- **Worst-case or corner-case analysis** drops probability altogether and asks a different question: does the vehicle survive this deliberately chosen combination of extremes? It is most valuable exactly where Monte Carlo has already found trouble.

## A brief return to importance sampling

Imagine hunting for one rare kind of shell on a long beach. Walking the whole beach at random wastes most of your time. If you know the rare shells wash up near the rocks, you search there — and then, to report how common they are on the *whole* beach, you scale your count back down to account for where you looked.

Here is the precise version. Instead of drawing from the true dispersion density $f$, draw from a **[[proposal density|proposal-picture]]** $q$ that puts more of its draws where the rare event happens. Correct each draw $\mathbf{x}_i$ by the **likelihood ratio** $w = f/q$ — the weight, which is small wherever $q$ over-samples. The estimator

$$
\hat\theta = \frac{1}{N}\sum_{i=1}^{N} g(\mathbf{x}_i)\,w(\mathbf{x}_i)
$$

(read $\hat\theta$ as "theta hat", the estimate) stays unbiased for $\theta = \mathbb{E}_f[g(\mathbf{X})]$, the true average of $g$ under $f$. For a tail probability, $g$ is $1$ when the case fails and $0$ otherwise. Usually $q$ shifts or widens the dispersion that drives the failure, so a large fraction of draws land past the threshold instead of one in a hundred thousand.

A tiny demonstration: the chance a standard Gaussian exceeds $4$ is $3.17 \times 10^{-5}$. Ten thousand direct draws expect only $0.3$ hits. Ten thousand draws centered on the threshold, with weights, do far better:

```python
import numpy as np
from scipy import stats

rng = np.random.default_rng(1)
x = rng.normal(4.0, 1.0, size=10_000)          # draws from q: centered on the threshold
w = stats.norm.pdf(x) / stats.norm.pdf(x, 4.0, 1.0)   # weights w = f/q
est = np.mean((x > 4.0) * w)
print(f"estimate {est:.3e}, exact {stats.norm.sf(4.0):.3e}")
# estimate 3.114e-05, exact 3.167e-05
```

The catch is aiming. The enormous gain in precision comes only once $q$ points at the right dispersion, and the method does not tell you which one that is. Everything else carries over unchanged from the prerequisite module: it is unbiased for any valid proposal, a proposal with thinner tails than the truth is dangerous, and the weights must be inspected before the answer is trusted. This module adds the judgment of where to aim, which comes from the sensitivity analysis of a later lesson.

## Extreme-value estimation: fitting the tail instead of counting it

Importance sampling needs to know where to aim before it helps. Extreme-value estimation asks a humbler question of a sample you already have. Given the cases that did land far out, what does the shape of that far region say about probabilities beyond where any case landed?

### The limiting shape of a tail

Pick a high threshold $u$ and look only at the cases above it. For each, record its **excess** $X - u$: how far past the line it went. The **[[Pickands–Balkema–de Haan theorem|pickands-names]]** says that, for a very wide class of parent distributions, the excesses over a high enough threshold follow one family of shapes, the **generalized Pareto distribution**, whatever the parent looked like. It plays the same role for tails that the central limit theorem plays for averages.

Its **[[survival function|survival-function]]** — the chance an excess is bigger than $y$ — is

$$
\bar{H}_{\xi,\sigma}(y) = \left(1 + \xi \frac{y}{\sigma}\right)^{-1/\xi}, \qquad y \geq 0.
$$

Read $\bar H$ as "H bar". It has two knobs. The scale $\sigma > 0$ ("sigma") sets how far typical excesses go, in the units of $X$. The **[[shape parameter|tail-shape]]** $\xi$ ("ksee") sets how fast the tail dies away. As $\xi \to 0$ the formula becomes the exponential tail $e^{-y/\sigma}$.

This is why the tool is general-purpose. It does not need the parent distribution, only a threshold high enough for the limit to have taken hold. In practice you check that by refitting at several thresholds and confirming the fitted shape stays put.

### From the fit to a probability

Fit $\xi$ and $\sigma$ to the excesses over $u$ by **[[maximum likelihood|mle-bridge]]**, from the prerequisite module. Then the probability of going past any level $x > u$ — including levels beyond everything observed — takes one conditional-probability step. To exceed $x$, a case must first exceed $u$, and then its excess must exceed $x - u$:

$$
P(X > x) = P(X > u)\,P(X - u > x - u \mid X > u) \approx \hat{p}_u\,\bar{H}_{\xi,\sigma}(x-u).
$$

Here $\hat{p}_u$ ("p hat sub u") is the observed fraction of the sample above $u$. That part is counted directly, because $u$ is low enough that plenty of cases clear it. Only the shape *beyond* $u$ is extended, and it is extended by a model with real theory behind it.

::: example Extrapolating past where the sample has any data at all
Draw $N=5000$ samples from a lopsided parent distribution with a long right tail (a lognormal with mean $40$ — but the fitting never uses that fact). Set the threshold at the sample's own $90$th percentile, which leaves exactly $500$ cases above it, so $\hat p_u = 0.100$. Fit the generalized Pareto tail to those $500$ excesses:

```python
import numpy as np
from scipy import stats

s = 0.35
parent = stats.lognorm(s, scale=np.exp(np.log(40.0) - s**2 / 2))  # mean 40
x = parent.rvs(size=5000, random_state=np.random.default_rng(27))
u = np.sort(x)[4499]                   # 90th percentile: 500 values above it
xi, _, sig = stats.genpareto.fit(x[x > u] - u, floc=0)
print(f"u = {u:.2f}, xi = {xi:.4f}, sigma = {sig:.3f}")
for level in (100.0, 140.0):
    count = int(np.sum(x > level))
    evt = 0.1 * stats.genpareto.sf(level - u, xi, scale=sig)
    print(f"x={level:.0f}: {count} above, fit {evt:.3e}, truth {parent.sf(level):.3e}")
# u = 59.26, xi = -0.0086, sigma = 12.022
# x=100: 13 above, fit 3.209e-03, truth 2.611e-03
# x=140: 0 above, fit 9.896e-05, truth 8.691e-05
```

**At $x = 100$.** Thirteen of the $5000$ samples are above it, so the direct count gives $13/5000 = 0.00260$. The fit gives $0.100 \times \bar H(100 - 59.26) = 0.00321$. The truth, known here only because we chose the parent, is $0.00261$. With thirteen events you can still count, and counting wins.

**At $x = 140$.** Not one sample is above it. The direct estimate is not merely rough — it does not exist. The fit, from the same $500$ excesses, gives $9.90 \times 10^{-5}$ against a true $8.69 \times 10^{-5}$: about $14\%$ high, but the right size, at a level the direct count says nothing about.
:::

Now the honest part. That run was a fair draw, not the luckiest one, but it was one draw. Repeat the whole experiment with $200$ different seeds and the fitted $P(X > 140)$ lands within a factor of two of the truth only about half the time. One run in ten comes out more than about eight times too low. The reason is visible in the fit: the fitted $\hat\xi$ is often slightly negative, and a negative shape says the tail *ends* — it bends the extrapolation down. A lognormal tail is known to approach its limiting shape slowly, so at a $90$th-percentile threshold the limit has not fully taken hold.

So extreme-value estimation buys a defensible number where counting gives none, not a certified one. Report it with its own uncertainty — a bootstrap (refit on resampled data) or a likelihood-based interval — and with the threshold-stability check. The theorem is real mathematics, but it is a statement about the limit. A threshold chosen too low biases the fit in ways that do not announce themselves.

::: key
For a threshold $u$ high enough that the tail has converged, $P(X>x) \approx \hat p_u\left(1+\hat\xi\frac{x-u}{\hat\sigma}\right)^{-1/\hat\xi}$ for $x>u$, fit from the observed exceedances. This extends past the reach of direct counting. It does not produce a certified probability: its scatter from sample to sample is large, it must be reported with an interval, and its validity depends on the threshold being high enough for the limiting shape to have taken hold — checked by refitting at several thresholds.
:::

## Worst-case and corner-case analysis: a different question entirely

A bridge engineer does not only ask how heavy traffic usually is. She also checks the bridge with the heaviest allowed trucks parked bumper to bumper in a gale. That is a worst-case check: not "how likely?", but "does it survive this?"

A **corner-case analysis** sets every dispersed parameter to one of its extreme values at once — typically the ends of a stated range, such as plus or minus three sigma. It then evaluates the vehicle at every combination, or at a chosen subset judged most dangerous. It answers a question Monte Carlo does not: not "how probable is failure?", but "does the vehicle survive this specific, fully stated, worst-imaginable combination?"

The counting makes exhaustive enumeration hopeless almost at once. With two extremes per parameter, $n$ parameters give $2^n$ **[[corners|corners-of-a-cube]]**, because each parameter doubles the number of combinations:

| Parameters $n$ | Corners $2^n$ |
| --- | --- |
| $4$ | $16$ |
| $6$ | $64$ |
| $10$ | $1024$ |
| $15$ | $32{,}768$ |
| $20$ | $1{,}048{,}576$ |
| $30$ | $1{,}073{,}741{,}824$ |

A real dispersion set has dozens to hundreds of parameters, so nobody runs every corner. In practice, corner analysis means choosing a few physically motivated combinations — the ones an engineer, reasoning about the physics, expects to be dangerous together.

That is also why a corner-case result is not a probability and must never be reported as one. The all-extremes corner is a deliberately pessimistic point. Real dispersions rarely push every parameter to its own extreme at the same moment, and correlated ones may never get there at all — the correlation structure the earlier lesson on correlated dispersions insisted you take seriously.

### Following Monte Carlo into a cluster

Corner analysis earns its place not as a stand-alone campaign but as the tool that follows a Monte Carlo campaign into trouble it has found. Sometimes a large campaign turns up a handful of failures bunched in one region of the input space instead of scattered evenly. A bunch like that is a **cluster**, not noise. It is the campaign telling you where a real cliff in the vehicle's behavior is.

The right response is not to quote the overall failure rate and move on. Replay each clustered failure exactly, using the seed that produced it. Trace the mechanism through its state history. Classify it: a real vehicle limitation, a controller deficiency, or a simulation artifact. Then map the edge. Random sampling is a poor way to find the exact edge of a cliff once you know roughly where it is. A dense, focused sweep or a deliberate worst-case search in that region maps the boundary far more efficiently than waiting for random draws to land near it.

::: example From a Monte Carlo cluster to a mapped boundary
An $8000$-case campaign shows $4$ failures. All four have engine thrust near the bottom of its dispersed range *and* a strong crosswind gust near touchdown. That is a cluster, not four unlucky draws spread across the input space. The requirement is a failure rate below $0.1\%$.

**The tempting report.** "$4/8000 = 0.05\%$, meets the $0.1\%$ requirement." Two things are wrong with it.

- *Four events are too few to certify anything.* By the prerequisite module's formula, the relative standard error is about $\sqrt{(1 - 0.0005)/4} \approx 1/\sqrt{4} = 50\%$. The estimate could easily be half or double the truth.
- *The overall rate is the wrong number to look at.* The failures are not spread randomly through the envelope. They sit exactly where two dispersions reinforce each other.

**The corrected process.** Replay all four cases bit for bit. Suppose the mechanism turns out to be a real shortfall of **[[control authority|control-authority]]**, not a simulation bug. Then run a dense grid of thrust against gust strength in exactly that corner — a two-parameter corner-case sweep, not a random resample — to trace the actual edge of the failure region and measure how much margin separates the nominal design from it.

The Monte Carlo campaign found that a cliff exists. The corner-case sweep found where it is. A random sample answers that second question only by chance; a structured, targeted search answers it by construction.
:::

::: warning A clean corner-case sweep does not certify a probability, and a clean Monte Carlo does not map a boundary
Passing every selected corner case proves the vehicle survives those specific combinations. It says nothing about the chance of meeting conditions between them, and a dispersion set with real correlations may never visit the tested corners at all. The other way round, a Monte Carlo campaign with no failures proves nothing about how close the design came to a cliff it never sampled near. The two methods answer different questions. A verification argument that relies on only one of them is missing what the other was built to supply.
:::

## Check yourself

::: check
State the Pickands–Balkema–de Haan result in one sentence, and explain what makes it useful for a tail an analyst has never observed directly.
:::

::: answer
For a wide class of parent distributions, the excesses over a high enough threshold follow a generalized Pareto distribution, whatever the parent's detailed shape.

It is useful because it lets you fit a tail model to the exceedances that *were* observed above a lower threshold, and then extend it to levels beyond anything in the sample — using a shape with mathematical grounds, rather than a guess about how the tail continues.
:::

::: check
A $5000$-sample campaign has zero exceedances above a level of interest. Why is "the probability is zero" not a valid conclusion, and what could an extreme-value fit offer instead?
:::

::: answer
Zero exceedances in a finite sample only means the event did not happen in this sample, not that it is impossible — the same logic as lesson 4's warning that zero failures never proves zero failure probability.

An extreme-value fit uses the exceedances the sample does contain over a lower threshold, and extends the fitted generalized Pareto tail out to the level of interest. It returns a specific estimate, with an uncertainty interval and a threshold-stability check you can report, instead of either an unsupported "zero" or no answer at all. The estimate can still be off by a large factor, which is why the interval matters.
:::

::: check
Why does the number of corner combinations make exhaustive corner analysis impractical for a real dispersion set, and how is corner-case analysis used in practice as a result?
:::

::: answer
Exhaustive enumeration needs $2^n$ combinations for $n$ parameters at two extremes each. That passes a million at $n=20$ and is astronomically large for the hundreds of parameters in a real dispersion set, so no program evaluates them all.

Instead, corner analysis picks a small number of physically motivated combinations — especially a region where a Monte Carlo campaign has already found a cluster of failures — and runs a dense, targeted sweep there to map the boundary precisely, rather than trying to cover the whole space.
:::

::: check
One campaign finds three failures scattered across the input space with nothing in common. A second campaign finds three failures bunched in one region. Why do these call for different next steps?
:::

::: answer
Scattered failures with no shared cause look more like separate low-probability events near the edge of an otherwise well-behaved envelope. The response is mainly statistical: replay each to confirm it is real, and remember that three events give only a rough estimate of the rate.

Bunched failures point to a specific mechanism or boundary in the input space, not bad luck. The response adds a targeted corner-case or dense local sweep to map that boundary, because random sampling is an inefficient way to trace the edge of a region whose rough location is already known.
:::

::: check
Why can't a corner-case sweep that finds no failures at any tested combination be used, by itself, to claim a numerical reliability?
:::

::: answer
A corner-case sweep tests specific, chosen combinations of extreme values, not a probability distribution over the inputs. Passing them says the vehicle survives them. It says nothing about how likely any of them is to occur, and nothing at all about the huge rest of the input space that was never tried — including regions a real, correlated dispersion might actually visit.

A reliability figure needs a probabilistic campaign — Monte Carlo, sized as lesson 4 describes — because only a probabilistic sample supports a probabilistic claim.
:::

## Summary

| Item | Statement |
| --- | --- |
| Direct sampling limit | Relative error $\sqrt{(1-p)/(Np)}$; about $100$ events, so $N \approx 100/p$ runs, for $\pm 10\%$ |
| Importance sampling | Reweight toward the rare event with $w=f/q$; unbiased for any valid proposal, but it has to be aimed |
| Generalized Pareto tail | $\bar H_{\xi,\sigma}(y) = (1+\xi y/\sigma)^{-1/\xi}$; the limiting shape of excesses over a high threshold, by Pickands–Balkema–de Haan |
| Extreme-value tail estimate | $P(X>x) \approx \hat p_u\,\bar H_{\hat\xi,\hat\sigma}(x-u)$; reaches past direct counting, with large scatter — report an interval and check threshold stability |
| Corner-case combinatorics | $2^n$ combinations for $n$ parameters at two extremes each; exhaustive search is impractical beyond a handful |
| Corner analysis's role | A complement to Monte Carlo, not a substitute: maps a boundary a cluster of failures has located, and proves survival of specific combinations without ever giving a probability |
| Cluster response | Replay exactly, find the mechanism, classify it, then map the boundary with a targeted sweep instead of trusting a small failure count's overall rate |

Every method in this lesson still runs the full nonlinear simulation many times. The next lesson takes up a much faster route: how one linear covariance propagation can reproduce what a whole campaign estimates, and exactly where that shortcut stops being valid.

::: context hundred-year-flood Where extreme-value statistics came from
Extreme-value statistics grew up around floods, storms and breaking materials long before rockets. Emil Gumbel's 1958 book *Statistics of Extremes* was written largely for hydrologists sizing dams and levees. A "hundred-year flood" does not mean one that comes every hundred years like a clock. It means a flood with a $1\%$ chance of being exceeded in any given year — so a town can see two in a decade, and a $1\%$-per-year event has about a $63\%$ chance of happening at least once in a century.
:::

::: context proposal-picture Sampling where the action is
The true density $f$ (blue) almost never reaches the threshold at $4$. The proposal $q$ (orange) is centered on it, so about half its draws land past the line. Each of those draws gets the weight $w = f/q$, which is tiny out there, so the weighted average still estimates the true, tiny probability.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 175" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="140" x2="340" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="20.0,138.9 26.4,138.0 32.8,136.6 39.2,134.4 45.6,131.1 52.0,126.5 58.4,120.2 64.8,112.2 71.2,102.5 77.6,91.3 84.0,79.3 90.4,67.4 96.8,56.5 103.2,47.7 109.6,42.0 116.0,40.0 122.4,42.0 128.8,47.7 135.2,56.5 141.6,67.4 148.0,79.3 154.4,91.3 160.8,102.5 167.2,112.2 173.6,120.2 180.0,126.5 186.4,131.1 192.8,134.4 199.2,136.6 205.6,138.0 212.0,138.9 218.4,139.4 224.8,139.7 231.2,139.8 237.6,139.9 244.0,140.0 250.4,140.0 256.8,140.0 263.2,140.0 269.6,140.0 276.0,140.0 282.4,140.0 288.8,140.0 295.2,140.0 301.6,140.0 308.0,140.0 314.4,140.0 320.8,140.0 327.2,140.0 333.6,140.0 340.0,140.0"/>
  <polyline fill="none" stroke="#f2b880" stroke-width="2.5" points="20.0,140.0 26.4,140.0 32.8,140.0 39.2,140.0 45.6,140.0 52.0,140.0 58.4,140.0 64.8,140.0 71.2,140.0 77.6,140.0 84.0,140.0 90.4,140.0 96.8,140.0 103.2,140.0 109.6,140.0 116.0,140.0 122.4,139.9 128.8,139.8 135.2,139.7 141.6,139.4 148.0,138.9 154.4,138.0 160.8,136.6 167.2,134.4 173.6,131.1 180.0,126.5 186.4,120.2 192.8,112.2 199.2,102.5 205.6,91.3 212.0,79.3 218.4,67.4 224.8,56.5 231.2,47.7 237.6,42.0 244.0,40.0 250.4,42.0 256.8,47.7 263.2,56.5 269.6,67.4 276.0,79.3 282.4,91.3 288.8,102.5 295.2,112.2 301.6,120.2 308.0,126.5 314.4,131.1 320.8,134.4 327.2,136.6 333.6,138.0 340.0,138.9"/>
  <line x1="244" y1="24" x2="244" y2="140" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="116" y="30" font-size="12" fill="#1d6fd1" text-anchor="middle">true f</text>
  <text x="300" y="36" font-size="12" fill="#1f2a44" text-anchor="middle">proposal q</text>
  <text x="250" y="20" font-size="11" fill="#b4232c">threshold</text>
  <text x="116" y="158" font-size="11" fill="#1f2a44" text-anchor="middle">0</text>
  <text x="244" y="158" font-size="11" fill="#1f2a44" text-anchor="middle">4</text>
</svg>
```
:::

::: context pickands-names Two papers, three names
The theorem is named for Guus Balkema and Laurens de Haan, who published it in 1974, and James Pickands III, who published it independently in 1975. Its older cousin, the Fisher–Tippett–Gnedenko theorem, says what shape the *largest* value of a big sample must take. The two are close relatives: one describes the biggest value, the other everything past a high line. Using all the values past a line uses more of the data, which is why the threshold version is the everyday tool.
:::

::: context survival-function Why "survival"?
The name comes from life tables used by insurance companies: the survival function gives the chance someone lives past age $y$. In any field, it is one minus the cumulative distribution, $P(Y > y)$ — the chance of getting past $y$. For a tail problem, it is exactly the number you want: the chance a miss distance, a load, or a temperature goes past a given level. It starts at $1$ at $y = 0$ and falls toward $0$.
:::

::: context tail-shape Three kinds of tail
The shape $\xi$ sorts tails into three families. With $\xi > 0$ the tail is heavy and falls off like a power, so huge values stay possible. With $\xi = 0$ it falls off exponentially. With $\xi < 0$ it stops dead at $y = \sigma/|\xi|$: nothing can go past that point. Below, $\sigma = 1$; the $\xi = -0.3$ curve hits zero at $y = 3.33$. A fit that wrongly lands on a negative $\xi$ claims the tail ends, which is how an extrapolation comes out far too low.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="160" x2="340" y2="160" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="24" x2="50" y2="160" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="44" y="34" font-size="11" fill="#1f2a44" text-anchor="end">1</text>
  <text x="44" y="164" font-size="11" fill="#1f2a44" text-anchor="end">0</text>
  <text x="50" y="176" font-size="11" fill="#1f2a44" text-anchor="middle">0</text>
  <text x="330" y="176" font-size="11" fill="#1f2a44" text-anchor="middle">5</text>
  <text x="190" y="186" font-size="11" fill="#6c7a93" text-anchor="middle">excess y</text>
  <polyline fill="none" stroke="#b4232c" stroke-width="2" points="50.0,30.0 55.6,42.1 61.2,52.6 66.8,61.7 72.4,69.7 78.0,76.8 83.6,83.1 89.2,88.7 94.8,93.7 100.4,98.2 106.0,102.2 111.6,105.9 117.2,109.2 122.8,112.2 128.4,115.0 134.0,117.6 139.6,119.9 145.2,122.0 150.8,124.0 156.4,125.8 162.0,127.5 167.6,129.1 173.2,130.5 178.8,131.9 184.4,133.1 190.0,134.3 195.6,135.4 201.2,136.5 206.8,137.4 212.4,138.3 218.0,139.2 223.6,140.0 229.2,140.8 234.8,141.5 240.4,142.2 246.0,142.8 251.6,143.4 257.2,144.0 262.8,144.5 268.4,145.1 274.0,145.6 279.6,146.0 285.2,146.5 290.8,146.9 296.4,147.3 302.0,147.7 307.6,148.1 313.2,148.4 318.8,148.8 324.4,149.1 330.0,149.4"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="50.0,30.0 55.6,42.4 61.2,53.6 66.8,63.7 72.4,72.9 78.0,81.2 83.6,88.7 89.2,95.4 94.8,101.6 100.4,107.1 106.0,112.2 111.6,116.7 117.2,120.8 122.8,124.6 128.4,127.9 134.0,131.0 139.6,133.8 145.2,136.3 150.8,138.5 156.4,140.6 162.0,142.4 167.6,144.1 173.2,145.6 178.8,147.0 184.4,148.2 190.0,149.3 195.6,150.3 201.2,151.3 206.8,152.1 212.4,152.8 218.0,153.5 223.6,154.1 229.2,154.7 234.8,155.2 240.4,155.7 246.0,156.1 251.6,156.4 257.2,156.8 262.8,157.1 268.4,157.4 274.0,157.6 279.6,157.8 285.2,158.1 290.8,158.2 296.4,158.4 302.0,158.6 307.6,158.7 313.2,158.8 318.8,158.9 324.4,159.0 330.0,159.1"/>
  <polyline fill="none" stroke="#6c7a93" stroke-width="2" stroke-dasharray="5 3" points="50.0,30.0 55.6,42.6 61.2,54.2 66.8,65.1 72.4,75.1 78.0,84.4 83.6,92.9 89.2,100.7 94.8,107.9 100.4,114.5 106.0,120.4 111.6,125.8 117.2,130.6 122.8,135.0 128.4,138.8 134.0,142.3 139.6,145.3 145.2,147.9 150.8,150.2 156.4,152.2 162.0,153.9 167.6,155.3 173.2,156.4 178.8,157.4 184.4,158.1 190.0,158.7 195.6,159.2 201.2,159.5 206.8,159.7 212.4,159.9 218.0,159.9 223.6,160.0 236.7,160.0"/>
  <circle cx="236.7" cy="160" r="3.5" fill="#6c7a93"/>
  <text x="200" y="108" font-size="12" fill="#b4232c">ξ = 0.5 (heavy)</text>
  <text x="200" y="126" font-size="12" fill="#1d6fd1">ξ = 0 (exponential)</text>
  <text x="200" y="144" font-size="12" fill="#6c7a93">ξ = −0.3 (ends)</text>
</svg>
```
:::

::: context mle-bridge The same fitting tool as before
Maximum likelihood, from lesson 10 of the probability and statistics module, picks the parameter values that make the observed data most probable. Here the data are the $500$ excesses, and the parameters are $\xi$ and $\sigma$. The same idea tunes a Kalman filter's noise model and fits a sensor's error model; in Python, `scipy.stats.genpareto.fit` does it for this distribution.
:::

::: context corners-of-a-cube Why the count doubles
With one parameter at "low" or "high" there are two cases. Add a second and each of those splits in two: four. With three parameters the combinations are the eight corners of a cube, with the nominal design at its center. Every new parameter adds a dimension and doubles the count again — $2^n$ corners for $n$ parameters.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <g fill="none" stroke="#1f2a44" stroke-width="1.5">
    <rect x="100" y="60" width="100" height="100"/>
    <rect x="150" y="20" width="100" height="100"/>
    <line x1="100" y1="60" x2="150" y2="20"/><line x1="200" y1="60" x2="250" y2="20"/>
    <line x1="100" y1="160" x2="150" y2="120"/><line x1="200" y1="160" x2="250" y2="120"/>
  </g>
  <g fill="#b4232c">
    <circle cx="100" cy="60" r="5"/><circle cx="200" cy="60" r="5"/><circle cx="100" cy="160" r="5"/><circle cx="200" cy="160" r="5"/>
    <circle cx="150" cy="20" r="5"/><circle cx="250" cy="20" r="5"/><circle cx="150" cy="120" r="5"/><circle cx="250" cy="120" r="5"/>
  </g>
  <circle cx="175" cy="90" r="5" fill="#1d6fd1"/>
  <text x="182" y="94" font-size="11" fill="#1d6fd1">nominal</text>
  <text x="270" y="80" font-size="12" fill="#1f2a44">3 parameters</text>
  <text x="270" y="98" font-size="12" fill="#b4232c">2³ = 8 corners</text>
</svg>
```
:::

::: context control-authority Running out of push
Control authority is how much the control system can actually do: how far the engine can swivel, how much thrust is available, how fast the actuators can move. A controller can be perfectly designed and still fail if the disturbance needs more than the hardware can give. Low thrust plus a strong gust is a classic squeeze: less push to fight with, exactly when more is needed. When the control command hits its limit and stays there, the actuator is **saturated** — a nonlinearity you will meet again in the next lesson, as one of the things that breaks linear covariance analysis.
:::
