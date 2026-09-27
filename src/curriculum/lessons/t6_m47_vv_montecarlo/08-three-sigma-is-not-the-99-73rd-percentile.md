---
id: l08-three-sigma-is-not-the-99-73rd-percentile
title: Three sigma is not the 99.73rd percentile
minutes: 18
covers:
  - Three sigma versus the 99.73rd percentile, and why they differ for anything non-Gaussian
---

Think about how long a pizza takes to arrive. Most nights it comes in about 25 minutes. It is almost never faster than 15 — the oven and the drive take time. But some nights it takes 45, or an hour, because the driver got lost or it was raining. The times bunch up near the middle, stop sharply on the fast side, and trail off in a long tail on the slow side. That lopsided shape is called **skewed**.

Now suppose someone promises: "the delivery time is within three standard deviations of the average almost every time — 99.73% of nights." That promise comes from the famous bell curve. But your pizza times are not a bell curve. So is the promise still true? That question is this whole lesson.

"**Three sigma**" is used all over this course and all over the industry as shorthand for a confident claim. Read $\sigma$ as "sigma", the **[[standard deviation|sigma-name]]** — the usual size of a random value's distance from its average. The claim is: a value inside three sigma of the mean is normal, and one outside is so rare you can design against it and move on. That shorthand is exactly right for one shape only, the **Gaussian** (the bell curve, also called the normal distribution).

Every closed-loop output from this module's campaigns — a landing miss pushed through a saturating guidance law, a propellant margin eaten by one dominant contributor, a delta-v cost driven by air density — comes out of nonlinear dynamics and discrete logic acting on dispersed inputs. No law of nature makes that result Gaussian. When it is not, "mean plus three sigma" and "the 99.73rd percentile" stop being two names for one number, and the gap between them is not a rounding error.

This lesson derives where the match comes from, so you know exactly which assumption breaks it. Then it breaks the match on purpose, with real numbers, in both directions: one shape where three sigma is dangerously optimistic, and the mirror image, with the identical spread, where it is needlessly pessimistic.

## Where "three sigma" and "99.73 percent" meet

A **[[percentile|percentile-word]]** is a value with a stated fraction of the data below it. The $99$th percentile of delivery times is the time that $99\%$ of nights beat.

For a Gaussian random variable $X \sim \mathcal{N}(\mu,\sigma^2)$ — read "X is normal with mean mu and variance sigma squared" — the chance of landing within $k$ standard deviations of the mean has an exact formula. It uses the **[[error function|erf-bell]]**, written $\operatorname{erf}$ and read "E-R-F":

$$
P(|X-\mu| \leq k\sigma) = \operatorname{erf}\!\left(\frac{k}{\sqrt{2}}\right).
$$

Plug in $k = 1, 2, 3$ and you get $0.682690$, $0.954500$ and

$$
\operatorname{erf}\!\left(\frac{3}{\sqrt{2}}\right) = 0.997300\ldots
$$

That is the whole origin of "$99.73\%$". It is the **two-sided** coverage of a Gaussian: the fraction inside the band from $\mu - 3\sigma$ to $\mu + 3\sigma$. It comes from the bell curve's particular formula. It is not a general fact about "three of anything".

A related **one-sided** figure matters more in practice. Margin and miss-distance requirements usually care about one direction only: "the miss shall not exceed this". The chance that a Gaussian falls *below* $\mu + 3\sigma$ is written $\Phi(3)$ — read "capital phi of three", where $\Phi$ is the Gaussian's cumulative probability — and it equals $0.998650$. The two figures fit together: the $0.27\%$ outside the two-sided band splits evenly, $0.135\%$ in each tail, so one side has $100\% - 0.135\% = 99.865\%$ below it.

::: warning Read "the 99.73rd percentile" carefully
"Three sigma equals 99.73%" is really a statement about the two-sided band $\mu \pm 3\sigma$. Even for a perfect Gaussian, the one-sided $99.73$rd percentile is at $\mu + 2.78\sigma$, not $\mu + 3\sigma$; the value $\mu + 3\sigma$ is the $99.865$th percentile. When a document says "three sigma", ask which one it means. That confusion is small next to the one this lesson is about, but it is real.
:::

Why only the Gaussian? A distribution's **[[first two moments|moments]]** are its mean and its variance. A Gaussian is completely pinned down by those two numbers. Any other shape needs more numbers to describe — how lopsided it is, how heavy its tails are. "Mean plus three sigma" only ever uses the first two. A percentile is different: it is read directly off the full distribution, however the shape bends to get there. The two agree only when there is no extra shape to miss — that is, only for a Gaussian.

::: key
For a Gaussian, $P(|X-\mu|\leq3\sigma) = \operatorname{erf}(3/\sqrt2) = 99.730\%$ (two-sided) and $P(X\leq\mu+3\sigma)=\Phi(3)=99.865\%$ (one-sided). Both are facts about the normal density specifically. For any other shape, mean plus three sigma is a number computed from two moments; the 99.73rd percentile is a number read off the actual distribution — and nothing guarantees they land at the same place.
:::

::: key Three sigma vs the 99.73rd percentile
Equal only for a Gaussian. Closed-loop outputs pushed through saturations and mode logic are skewed and heavy-tailed, so quote the observed percentile from the sample, not mean plus three standard deviations.
:::

## One skewed shape, read from both ends

Take a quantity that is always positive and leans to the right, like the pizza times. The dispersion-set lesson gave this shape to contributors that act by multiplying and have a hard physical floor. Now look at it from both ends.

::: example Delta-v consumed: three sigma understates the risk
A vehicle's ascent guidance carries a **[[delta-v reserve|performance-reserve]]** — extra speed-change capability, held back to absorb trajectory dispersions. The amount actually used, $C$, is right-skewed and always positive: most flights use a modest amount, a few use much more. Model it as **lognormal** with mean $\mu_C = 25.0\,\mathrm{m/s}$ and standard deviation $\sigma_C = 3.771\,\mathrm{m/s}$. That is a **coefficient of variation** (standard deviation divided by mean) of $3.771 / 25.0 = 0.151$ — a real skew, but not an extreme one.

**The conventional bound.** Three times sigma is $3 \times 3.771 = 11.31\,\mathrm{m/s}$. Add the mean: $\mu_C + 3\sigma_C = 25.0 + 11.31 = 36.31\,\mathrm{m/s}$.

**What it would mean for a Gaussian.** It would sit at the $99.865$th percentile, leaving a $0.135\%$ chance of using more.

**What it really means.** Evaluate the true lognormal cumulative probability at $36.31\,\mathrm{m/s}$. It gives $99.482\%$. So the real chance of exceeding the "three sigma" bound is $100\% - 99.482\% = 0.518\%$.

**Compare.** $0.518 / 0.135 \approx 3.8$ (with unrounded values, $3.83$). The real risk is almost four times what the Gaussian label promised. To actually buy $99.865\%$ coverage, the reserve would have to be $38.77\,\mathrm{m/s}$ — about $2.5\,\mathrm{m/s}$ more than the three-sigma number.

**Sanity check.** A right-skewed shape has its long tail on the high side, exactly where this bound sits. More mass lives out there than a bell curve would put there, so the bound should be exceeded more often, not less. It is. A requirement budgeted against mean plus three sigma, believing it buys $99.865\%$, is really buying under $99.5\%$ — thinner than the page says, in the direction that matters.
:::

::: example Delta-v remaining: three sigma overstates the risk, on the mirrored shape
Now look at the other side of the same budget: the margin *left over* out of a fixed budget $M_{\mathrm{budget}}$,

$$
R = M_{\mathrm{budget}} - C,
$$

using exactly the same consumption $C$ as above. Subtracting from a fixed number does not change the spread, so $\sigma_R = 3.771\,\mathrm{m/s}$ still. But it flips the shape left to right. $R$ is **[[left-skewed|mirror-shapes]]**: it is capped at the top (you cannot have more left over than if you used nothing), and its long tail now runs *downward*, toward the flights that used an unusually large amount.

**The same distance.** The three-sigma bound $\mu_R + 3\sigma_R$ sits $11.31\,\mathrm{m/s}$ above the mean of $R$, exactly as before, because $\sigma$ did not change.

**Mirror the event.** "$R$ is above its mean plus three sigma" happens exactly when "$C$ is below its mean minus three sigma", that is, $C < 25.0 - 11.31 = 13.69\,\mathrm{m/s}$. That is out on $C$'s *short* tail. The lognormal gives this a probability of $0.004050\%$.

**Compare.** A Gaussian would say $0.135\%$. The real figure is $0.135 / 0.004050 = 33.3$ times smaller — about one flight in twenty-five thousand. Here mean plus three sigma is wildly conservative. A design sized for "remaining margin up to three sigma", thinking it covers all but $0.135\%$ of cases, has paid — perhaps in real mass or complexity — to cover an event far rarer than anyone asked for.

**What changed?** Same shape, same standard deviation. Only the tail that "three sigma" pointed at changed, and the answer flipped from dangerously optimistic to needlessly pessimistic. There is no way to know which case you are in without checking — and no way to check without either the exact distribution or a sample big enough to read the percentile directly.
:::

The same thing happens with other skewed shapes, not only the lognormal pair. Take an **[[exponential|exponential-tail]]** quantity with mean and standard deviation both equal to $1$. Mean plus three sigma is $1 + 3 = 4$. Its true $99.73$rd percentile, from the exact exponential formula, is $-\ln(1 - 0.9973) = 5.91$ — about $48\%$ further out. That is far past a $10\%$ gap, which would already count as a material difference. The reason is the same as before: a right-skewed shape puts more mass far out on its right than a Gaussian with the same mean and spread, so its high percentiles sit further out than mean plus three sigma suggests, whichever right-skewed family produced it.

::: warning A clean three-sigma number does not say which way it is wrong
A value of $\mu+3\sigma$ is computed the same way from the mean and standard deviation whatever shape is behind them. Nothing in it tells you whether it is optimistic, pessimistic, or right by luck, and a design review that sees only that number cannot tell either. The only defenses: know the shape, and once you know it is not Gaussian, use its actual percentile formula rather than a sigma multiple; or have enough sample data to read the percentile straight off the empirical distribution.
:::

## What to report instead

Report the **empirical percentile** — the value actually observed in the campaign — instead of a sigma multiple computed from the sample mean and standard deviation. This matches the reporting rule from the run-count lesson. Use the **nearest-rank** method: sort the $N$ results from smallest to largest, and the $p$-th percentile is the $\lceil pN/100 \rceil$-th value in that list. (Read $\lceil\,\cdot\,\rceil$ as "round up to a whole number".) For $N = 10{,}000$ and $p = 99.73$, that is the $\lceil 9973 \rceil = 9973$rd smallest result.

A percentile read this way assumes nothing about shape. It is simply the value that the required fraction of the actual sample falls at or below, skewed or not. And it is a real, replayable case — you can pull it up, look at its time history, and see what happened — rather than a number from a formula that quietly assumes a bell curve.

This has a limit, and the tail-risk lesson already built the tools for it. Reading a percentile from the sample needs enough samples out in that tail for the nearest-rank value to be stable. In a $10{,}000$-case campaign, only $27$ cases lie beyond the $99.73$rd percentile, and the far end of a list that short wobbles from campaign to campaign. A requirement stated at a very high percentile may need more direct samples than you can afford. That is exactly when the **[[extreme-value and importance-sampling|tail-tools]]** techniques take over: fit the tail's shape from the exceedances you do have, or reweight the sampling to make the rare region common. What you should not do is fall back on a sigma multiple, which this lesson has shown can be wrong by a large, unpredictable factor in either direction.

## Check yourself

::: check
Derive the value $99.73\%$ from the Gaussian coverage formula, and say exactly what assumption it depends on.
:::

::: answer
The chance of a Gaussian landing within $k$ standard deviations of its mean is $\operatorname{erf}(k/\sqrt2)$. Put in $k = 3$: $\operatorname{erf}(3/\sqrt2) = 0.997300$, which is $99.73\%$. It depends entirely on $X$ being Gaussian. The formula comes from the normal density itself; it is not a general property of "three of any spread measure" for an arbitrary distribution.
:::

::: check
A right-skewed dispersion has its mean plus three sigma at the $99.5$th percentile, instead of the Gaussian $99.865$th. Is a design bound set at that value more or less protective than intended, and by roughly what factor on the chance of exceeding it?
:::

::: answer
Less protective. The real chance of exceeding the bound is $100\% - 99.5\% = 0.5\%$. The Gaussian label promised $100\% - 99.865\% = 0.135\%$. So the real risk is about $0.5 / 0.135 \approx 3.7$ times bigger than the "three sigma" label implies — understated, in the same direction as the delta-v-consumed example.
:::

::: check
Without recomputing the lognormal, explain why the "margin remaining" example has the opposite bias from the "margin consumed" example, even though both use the same distribution shape.
:::

::: answer
Margin remaining is a fixed budget minus consumption, which flips the shape left to right. Consumption's long right tail (rare heavy use) becomes the remaining margin's long left tail (rare big shortfall). Consumption's short left tail (it cannot go much below zero) becomes the remaining margin's short right tail (it cannot exceed the full budget). So "mean plus three sigma" on the remaining-margin side probes the short, thin tail instead of the long, heavy one. It lands at an unusually high percentile — far more conservative than a Gaussian would suggest — the mirror image of what happened on the consumption side.
:::

::: check
Why is quoting an empirical percentile by nearest rank better than quoting mean plus three sigma, and what does the nearest-rank percentile need to be trustworthy?
:::

::: answer
A nearest-rank percentile is read straight from the actual sample, so it assumes nothing about the shape being Gaussian, and it cannot suffer the large, invisible errors this lesson showed for a sigma-multiple bound. It is also a real observed case that can be replayed and inspected, not a value from a formula. To be trustworthy it needs enough samples in the relevant tail for the value to be stable. A percentile far out in a thin tail, estimated from too small a sample, can itself be noisy — which is exactly the problem the extreme-value and importance-sampling techniques from the tail-risk lesson solve.
:::

::: check
A colleague argues: "Three-sigma bounds are sometimes too conservative and sometimes not conservative enough, so the errors average out and three sigma is still a fine general design rule." Evaluate this.
:::

::: answer
The argument fails because the two errors never apply to the same quantity at once, so they cannot cancel. Any one quantity is right-skewed or left-skewed (or lopsided in some other particular way), and for that quantity mean plus three sigma is wrong in one specific direction. A design that under-protects a right-skewed quantity is not made safe because some unrelated left-skewed quantity elsewhere on the vehicle happens to be over-protected. Each requirement has to be checked against its own distribution, not excused by a property of a different one.
:::

## Summary

| Item | Statement |
| --- | --- |
| Two-sided Gaussian coverage | $P(|X-\mu|\leq3\sigma) = \operatorname{erf}(3/\sqrt2) = 99.730\%$ |
| One-sided Gaussian coverage | $P(X\leq\mu+3\sigma) = \Phi(3) = 99.865\%$ |
| Why they part ways off-Gaussian | Mean plus three sigma uses only the first two moments; a percentile uses the full shape — they coincide only for a Gaussian |
| Right-skewed example | $\mu+3\sigma$ at the $99.482$th percentile, not the $99.865$th; true chance of exceeding it about $3.8\times$ the Gaussian figure |
| Left-skewed (mirrored) example | Same $\sigma$, opposite bias: $\mu+3\sigma$ at the $99.996$th percentile; true chance of exceeding it $33.3\times$ smaller than the Gaussian figure |
| Reporting rule | Quote the empirical percentile by nearest rank ($\lceil pN/100\rceil$-th smallest) from the campaign, not a sigma multiple, unless the output is known to be Gaussian |
| When the sample cannot resolve it | Use the extreme-value or importance-sampling techniques from the tail-risk lesson |

Distribution shape is one way a campaign's numbers can mislead without a sound. The next lesson turns to a second quiet trap: finding out, after the campaign, which of the dozens of dispersed inputs actually drove the result — and whether the campaign even looked in every part of the flight envelope.

::: context sigma-name Where "standard deviation" and σ come from
The statistician Karl Pearson coined the term "standard deviation" in the 1890s and wrote it with the lowercase Greek letter sigma, $\sigma$. It is the square root of the variance, so it has the same units as the quantity itself: a standard deviation of a delta-v is in $\mathrm{m/s}$. That is why engineers talk in sigmas: "a two-sigma wind" or "three-sigma dispersions" are distances measured in units of the typical spread.
:::

::: context percentile-word Percentiles, told with a race
Line up 100 runners by finishing time. The runner in 90th place finished at the 90th percentile of times: 90% of the field crossed the line at or before that time. A percentile never needs a formula about the shape of the data — you sort and count. The median is simply the 50th percentile. For a landing campaign, a "99th percentile miss of $42\,\mathrm{m}$" means 99% of simulated landings were within $42\,\mathrm{m}$.
:::

::: context erf-bell The area under the bell
The error function measures the area under the bell curve between two points placed symmetrically around the middle. Shaded here: the band from $\mu - 3\sigma$ to $\mu + 3\sigma$, holding $99.73\%$ of the area. The unshaded slivers, $0.135\%$ on each side, are too thin to see at this scale.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <polygon points="60,150 60.0,148.8 72.0,147.1 84.0,143.8 96.0,137.9 108.0,128.2 120.0,114.3 132.0,96.5 144.0,76.6 156.0,58.1 164.0,48.5 172.0,42.2 180.0,40.0 188.0,42.2 196.0,48.5 204.0,58.1 216.0,76.6 228.0,96.5 240.0,114.3 252.0,128.2 264.0,137.9 276.0,143.8 288.0,147.1 300.0,148.8 300,150" fill="#8fb8f0" stroke="none"/>
  <polyline points="20.0,150.0 32.0,149.9 44.0,149.7 52.0,149.3 60.0,148.8 72.0,147.1 84.0,143.8 96.0,137.9 108.0,128.2 120.0,114.3 132.0,96.5 144.0,76.6 156.0,58.1 164.0,48.5 172.0,42.2 180.0,40.0 188.0,42.2 196.0,48.5 204.0,58.1 216.0,76.6 228.0,96.5 240.0,114.3 252.0,128.2 264.0,137.9 276.0,143.8 288.0,147.1 300.0,148.8 308.0,149.3 316.0,149.7 328.0,149.9 340.0,150.0" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <line x1="20" y1="150" x2="340" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="60" y1="145" x2="60" y2="155" stroke="#b4232c" stroke-width="2"/>
  <line x1="300" y1="145" x2="300" y2="155" stroke="#b4232c" stroke-width="2"/>
  <line x1="180" y1="145" x2="180" y2="155" stroke="#1f2a44" stroke-width="2"/>
  <text x="60" y="170" font-size="12" text-anchor="middle" fill="#b4232c">μ − 3σ</text>
  <text x="180" y="170" font-size="12" text-anchor="middle" fill="#1f2a44">μ</text>
  <text x="300" y="170" font-size="12" text-anchor="middle" fill="#b4232c">μ + 3σ</text>
  <text x="180" y="110" font-size="13" text-anchor="middle" fill="#1f2a44">99.73%</text>
  <text x="330" y="130" font-size="11" text-anchor="end" fill="#6c7a93">0.135% each side</text>
</svg>
```

The name comes from its first use: the theory of errors in astronomical and survey measurements.
:::

::: context moments Moments: numbers that describe a shape
Statisticians describe a distribution by a ladder of **moments**. The first is the mean (where it sits). The second is the variance (how wide it is). The third, **skewness**, measures how lopsided it is. The fourth, **kurtosis**, measures how heavy its tails are. A Gaussian has skewness zero and a fixed kurtosis, so the first two rungs say everything. The lognormal in this lesson has a skewness of about $0.45$ — small, yet already enough to move the three-sigma point from the $99.865$th to the $99.482$th percentile.
:::

::: context performance-reserve Keeping some fuel back
Launch vehicles do not plan to burn every last kilogram. They carry a **flight performance reserve**: propellant held back so that a flight with a slightly weak engine, a headwind or a heavy payload still reaches orbit. It costs payload, so engineers size it as tightly as they dare — usually to a stated probability, such as "enough for 99.865% of dispersed flights". That is exactly where the difference between a sigma multiple and a true percentile becomes kilograms of payload gained or lost.
:::

::: context mirror-shapes The same shape, flipped
Left: the consumption $C$, with its long tail to the right. Right: the margin remaining $R = 50 - C$ (a $50\,\mathrm{m/s}$ budget), the same curve flipped. Each red mark is that quantity's own mean plus three sigma, $11.3\,\mathrm{m/s}$ from its mean. On the left it sits in the long tail; on the right, out past the short one.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 185" font-family="Inter, Arial, sans-serif">
  <polyline points="10.0,150.0 20.0,149.9 30.0,147.7 40.0,135.5 47.5,114.1 55.0,85.5 60.0,67.8 65.0,55.2 70.0,50.0 75.0,52.4 80.0,61.1 85.0,73.8 90.0,88.1 95.0,102.1 100.0,114.5 105.0,124.7 110.0,132.6 115.0,138.4 120.0,142.5 125.0,145.2 130.0,147.1 140.0,148.9 150.0,149.6 160.0,149.9 170.0,150.0" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <polyline points="350.0,150.0 340.0,149.9 330.0,147.7 320.0,135.5 312.5,114.1 305.0,85.5 300.0,67.8 295.0,55.2 290.0,50.0 285.0,52.4 280.0,61.1 275.0,73.8 270.0,88.1 265.0,102.1 260.0,114.5 255.0,124.7 250.0,132.6 245.0,138.4 240.0,142.5 235.0,145.2 230.0,147.1 220.0,148.9 210.0,149.6 200.0,149.9 190.0,150.0" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="10" y1="150" x2="170" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="190" y1="150" x2="350" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="75" y1="40" x2="75" y2="150" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
  <line x1="285" y1="40" x2="285" y2="150" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
  <line x1="131.6" y1="100" x2="131.6" y2="155" stroke="#b4232c" stroke-width="2"/>
  <line x1="341.6" y1="100" x2="341.6" y2="155" stroke="#b4232c" stroke-width="2"/>
  <text x="90" y="24" font-size="12" text-anchor="middle" fill="#1f2a44">consumed C</text>
  <text x="270" y="24" font-size="12" text-anchor="middle" fill="#1f2a44">remaining R</text>
  <text x="75" y="36" font-size="11" text-anchor="middle" fill="#6c7a93">mean</text>
  <text x="285" y="36" font-size="11" text-anchor="middle" fill="#6c7a93">mean</text>
  <text x="131.6" y="95" font-size="11" text-anchor="middle" fill="#b4232c">μ+3σ</text>
  <text x="330" y="95" font-size="11" text-anchor="middle" fill="#b4232c">μ+3σ</text>
  <text x="90" y="172" font-size="11" text-anchor="middle" fill="#b4232c">0.518% beyond</text>
  <text x="270" y="172" font-size="11" text-anchor="middle" fill="#b4232c">0.004% beyond</text>
</svg>
```
:::

::: context exponential-tail Waiting times and the exponential
The exponential distribution describes waiting for something that can happen at any moment with the same chance — the next radioactive decay, the next micrometeoroid hit. Its chance of lasting beyond $x$ is $e^{-x}$ (for mean $1$), so its $p$-th percentile is $-\ln(1 - p)$. Here are its landmarks on one line, next to where a Gaussian's one-sided $99.73$rd percentile would sit:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="60" x2="340" y2="60" stroke="#1f2a44" stroke-width="2"/>
  <line x1="20" y1="54" x2="20" y2="66" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="20" y="82" font-size="11" text-anchor="middle" fill="#1f2a44">0</text>
  <line x1="68" y1="52" x2="68" y2="68" stroke="#1f2a44" stroke-width="2"/>
  <text x="68" y="82" font-size="11" text-anchor="middle" fill="#1f2a44">mean 1</text>
  <line x1="201.4" y1="52" x2="201.4" y2="68" stroke="#6c7a93" stroke-width="2"/>
  <text x="201.4" y="42" font-size="11" text-anchor="middle" fill="#6c7a93">3.78</text>
  <line x1="212" y1="52" x2="212" y2="68" stroke="#1d6fd1" stroke-width="2"/>
  <text x="212" y="82" font-size="11" text-anchor="middle" fill="#1d6fd1">μ+3σ = 4</text>
  <line x1="303.8" y1="50" x2="303.8" y2="70" stroke="#b4232c" stroke-width="3"/>
  <text x="303.8" y="82" font-size="11" text-anchor="middle" fill="#b4232c">true 5.91</text>
  <text x="180" y="104" font-size="11" text-anchor="middle" fill="#6c7a93">grey: Gaussian 99.73rd percentile, μ + 2.78σ</text>
</svg>
```

The exercise for this module asks you to show this gap with a real sample.
:::

::: context tail-tools Back to the tail-risk toolkit
Two tools from the tail-risk lesson take over where counting runs out. **Extreme-value estimation** fits a curve to the largest results you did observe and uses that curve to reach further out than the sample itself. **Importance sampling** deliberately draws more cases from the dangerous region, then corrects each one with a weight so the final answer is still unbiased. Both answer the question a sigma multiple pretends to answer, but without assuming the shape is a bell curve.
:::
