---
id: l08-three-sigma-is-not-the-99-73rd-percentile
title: Three sigma is not the 99.73rd percentile
minutes: 17
covers:
  - Three sigma versus the 99.73rd percentile, and why they differ for anything non-Gaussian
---

"Three sigma" is used throughout this curriculum, and throughout the industry, as shorthand for a specific, confident-sounding claim about coverage — that a value falling within three standard deviations of the mean is the normal case, and one falling outside it is rare enough to design against and move on. That shorthand is exactly correct for one distribution shape and only one: the Gaussian. Every closed-loop output this module's campaigns produce — a landing miss distance pushed through a saturating guidance law, a propellant margin eaten by one dominant contributor, a density-driven delta-v cost — is the result of nonlinear dynamics and discrete logic acting on dispersed inputs, and there is no law of nature requiring the result to come out Gaussian. When it does not, "mean plus three sigma" and "the 99.73rd percentile" stop being two names for the same number, and the gap between them is not a rounding error.

This lesson derives exactly where the equivalence comes from, so it is clear precisely what assumption breaks it, and then breaks it on purpose with real numbers on both sides — a distribution where three sigma is dangerously optimistic, and one, built from the identical spread, where it is needlessly pessimistic. Both numbers are worth carrying forward, because a working GNC engineer needs to recognize which failure she is looking at, not only that one of them is possible.

## Where "three sigma" and "99.73 percent" coincide

For a Gaussian random variable $X \sim \mathcal{N}(\mu,\sigma^2)$, the probability mass within $k$ standard deviations of the mean has a closed form in terms of the error function,

$$
P(|X-\mu| \leq k\sigma) = \operatorname{erf}\!\left(\frac{k}{\sqrt{2}}\right),
$$

which evaluates to $0.682690$ at $k=1$, $0.954500$ at $k=2$, and, at $k=3$,

$$
\operatorname{erf}\!\left(\frac{3}{\sqrt{2}}\right) = 0.997300\ldots
$$

That is the entire origin of "$99.73\%$": it is the two-sided coverage of a Gaussian within three standard deviations of its mean, and it is a fact about the normal distribution specifically, derived from its particular density, not a general property of "three of anything." The related one-sided figure — the probability that a Gaussian falls **below** $\mu+3\sigma$ — is $\Phi(3) = 0.998650$, the value used whenever "mean plus three sigma" is quoted as a single upper design bound rather than a symmetric interval, as it usually is in a margin or a miss-distance requirement.

Both numbers are properties of the normal density specifically. A distribution is fully described by its mean and variance only when it is Gaussian; for anything else, the mean and standard deviation are two numbers extracted from a shape that needs more than two numbers to describe, and "mean plus three sigma" is only ever a statement about those first two numbers. A percentile, in contrast, is defined directly from the full distribution — the value below which a stated fraction of the mass actually lies, however the rest of the shape bends to get there. The two constructions agree only when the extra shape is absent, which is to say, only for a Gaussian.

::: key
For a Gaussian, $P(|X-\mu|\leq3\sigma) = \operatorname{erf}(3/\sqrt2) = 99.730\%$ (two-sided) and $P(X\leq\mu+3\sigma)=\Phi(3)=99.865\%$ (one-sided). Both are facts about the normal density specifically. For any other shape, mean plus three sigma is a number computed from two moments; the 99.73rd percentile is a number read off the actual distribution — and nothing guarantees they land at the same place.
:::

## A single skewed shape, read two ways

Take a strictly positive, right-skewed quantity — the kind of shape the earlier lesson on distribution choice assigned to a multiplicative, physically bounded contributor — and examine it from both ends.

::: example Delta-v margin consumed: three sigma understates the risk
A vehicle's ascent guidance carries a delta-v reserve to absorb trajectory dispersions. The amount actually consumed, $C$, is right-skewed and strictly positive — most flights use a modest amount, a few use much more — modeled as lognormal with mean $\mu_C = 25.0\,\mathrm{m/s}$ and standard deviation $\sigma_C = 3.771\,\mathrm{m/s}$ (a coefficient of variation of $0.151$, chosen to be a real but not extreme skew).

The design bound, computed the conventional way, is $\mu_C + 3\sigma_C = 25.0 + 3(3.771) = 36.31\,\mathrm{m/s}$. If $C$ were Gaussian, that number would sit at the $99.865$th percentile, leaving a $0.135\%$ chance of exceeding it. Evaluating the true lognormal CDF at $36.31$ gives a percentile of $99.482\%$ instead — the true probability of exceeding the "three sigma" bound is $0.518\%$, not $0.135\%$, **3.84 times** larger than the Gaussian figure assumed. A requirement that budgets its reserve against mean-plus-three-sigma, believing it is buying $99.865\%$ coverage, is actually buying under $99.5\%$ — a materially thinner margin than the number on the page suggests, in exactly the direction that matters: understated risk.
:::

::: example Delta-v margin remaining: three sigma overstates the risk, on the mirrored shape
Now look at the complementary quantity — margin *remaining* out of a fixed budget, $R = M_{\mathrm{budget}} - C$, using the identical consumption distribution $C$ from above. $R$ has exactly the same standard deviation as $C$, $\sigma_R = 3.771\,\mathrm{m/s}$, and it is left-skewed by construction: it is bounded above by the case where nothing at all was consumed, and its long tail runs downward, toward the cases where consumption was unusually large.

The three-sigma bound is, numerically, $\mu_R + 3\sigma_R$, exactly $11.31\,\mathrm{m/s}$ above the mean of $R$ — the same distance from the mean as before, since the standard deviation did not change. The event "$R$ exceeds its own mean plus three sigma" is exactly the mirror of the event "$C$ falls three sigma **below** its mean," which, evaluated against the same lognormal, occurs with probability $0.004049\%$ — not $0.135\%$, but **33.3 times smaller**. Here, mean plus three sigma is a wildly conservative bound: a system designed to accommodate margin remaining "up to three sigma," believing that leaves a $0.135\%$ chance of needing more capability than provided, has actually provided for an event roughly one in twenty-five thousand — far beyond what a genuine $99.865$th-percentile requirement would have asked for, potentially at real cost in mass or complexity that bought protection against an outcome dramatically rarer than intended.

Both examples used the identical distribution shape and the identical standard deviation; only which tail "three sigma" was pointed at changed, and the result flipped from dangerously optimistic to needlessly pessimistic. There is no way to know which case applies without checking — and no way to check without either the closed-form distribution or a large enough sample to read the actual percentile off directly.
:::

The same effect shows up for other skewed shapes, not only the lognormal pair above. An exponentially distributed quantity with mean and standard deviation both equal to $1$ has mean plus three sigma at $4$; its true $99.73$rd percentile, read off the exact exponential quantile function, is $5.91$ — about $48\%$ further out, comfortably past the ten percent gap that would already be enough to call the two figures materially different. The mechanism is the same as the lognormal case: a right-skewed shape has more mass in its far right tail than a Gaussian with the same first two moments would predict, so its true high percentiles sit further out than "mean plus three sigma" suggests, regardless of which specific right-skewed family produced the shape.

::: warning A clean three-sigma number does not announce which way it is wrong
Nothing about a computed value of $\mu+3\sigma$ signals whether it is optimistic, pessimistic, or accidentally correct — the number is computed identically from the mean and standard deviation regardless of the shape behind them, and a design review reading only that number has no way to tell. The only defenses are to know the shape (and use its actual quantile function, not a sigma multiple, once it is known to be non-Gaussian) or to have enough sample data to read the percentile directly from an empirical distribution rather than computing it from two moments.
:::

## What to report instead

The practical response, consistent with the reporting convention introduced earlier in this module, is to quote the **empirical percentile actually observed in the campaign**, by nearest rank, rather than a sigma multiple computed from the sample mean and standard deviation. A percentile read this way makes no assumption about shape at all — it is the value at or below which the required fraction of the actual sample falls, skewed or not, and it is a number that corresponds to a real, replayable case rather than a value computed from a formula that silently assumes Gaussian behavior.

This has a direct limit, and it is the one the earlier lesson on tail risk already built the machinery for: reading a percentile empirically needs enough samples in the relevant tail for the nearest-rank value to be a stable estimate, and a requirement stated at a very high percentile — the far tail of a large campaign — may need more direct samples than are affordable to resolve that way. That is precisely when the extreme-value and importance-sampling techniques from that earlier lesson take over: fitting the tail's shape from the exceedances that are available, or reweighting the sampling to make the relevant region common, rather than falling back on a sigma multiple that this lesson has shown can be wrong by a large, unpredictable factor in either direction.

## Check yourself

::: check
Derive the numeric value $99.73\%$ from the Gaussian coverage formula, and state precisely what distributional assumption it depends on.
:::

::: answer
The two-sided coverage within $k$ standard deviations of a Gaussian mean is $\operatorname{erf}(k/\sqrt2)$; at $k=3$ this evaluates to $\operatorname{erf}(3/\sqrt2) = 0.997300$, or $99.73\%$. It depends entirely on $X$ being Gaussian — the formula is derived from the normal density specifically, and it is not a general property of "three of any spread measure" for an arbitrary distribution.
:::

::: check
A right-skewed dispersion has mean plus three sigma landing at the $99.5$th percentile instead of the Gaussian $99.865$th. Is a design bound set at that mean-plus-three-sigma value more or less protective than intended, and by roughly what factor on the excess probability?
:::

::: answer
Less protective than intended: the true probability of exceeding the bound is $1-0.995=0.5\%$, against the Gaussian-assumed $1-0.99865=0.135\%$ — the actual risk of exceeding the bound is about $0.5/0.135 \approx 3.7$ times larger than the number the "three sigma" label implies, understating the true risk in the same direction as the delta-v-consumed example in this lesson.
:::

::: check
Explain, without recomputing the lognormal CDF, why the "margin remaining" example in this lesson has the opposite bias from the "margin consumed" example, given that both use the same underlying distribution shape.
:::

::: answer
Margin remaining is defined as a fixed budget minus the consumption, which flips left and right: the consumption's long right tail (rare large consumption) becomes the remaining margin's long left tail (rare large shortfall), and the consumption's short left tail (consumption cannot go much below zero) becomes the remaining margin's short right tail (remaining margin cannot exceed the full budget by much). "Mean plus three sigma" on the remaining-margin side therefore probes the short, thin tail instead of the long, heavy one, so it lands at an unusually high percentile — far more conservative than the Gaussian assumption — which is the mirror image of what happened when the same distance was measured on the consumption side.
:::

::: check
Why is quoting an empirical percentile by nearest rank preferable to quoting mean plus three sigma, and what does the nearest-rank percentile itself require to be trustworthy?
:::

::: answer
A nearest-rank empirical percentile is read directly from the actual sample's distribution shape, so it makes no assumption that the shape is Gaussian and is not vulnerable to the kind of large, undetectable error this lesson demonstrated for a sigma-multiple bound; it also corresponds to an actual observed case that can be replayed and inspected, rather than a value computed from a formula. Its trustworthiness depends on having enough samples in the relevant tail for the nearest-rank value to be stable — a percentile far out in a thin tail, estimated from too small a sample, can itself be noisy, which is exactly the situation the extreme-value and importance-sampling techniques from the tail-risk lesson exist to address.
:::

::: check
A colleague argues that since three-sigma bounds are sometimes too conservative and sometimes not conservative enough, the two errors "average out" and three-sigma remains a reasonable general-purpose design rule. Evaluate this argument.
:::

::: answer
The argument fails because the two errors do not apply to the same case or cancel within it — a given skewed quantity is either right-skewed or left-skewed (or, in the more general case, mixed in a way that is not cleanly symmetric), and whichever it is, mean-plus-three-sigma is wrong in one specific, predictable direction for that quantity, not averaged across two possibilities. A design that under-protects its actual worst-case risk because a right-skewed quantity was treated with a Gaussian assumption does not become safe because some other, unrelated left-skewed quantity elsewhere in the vehicle happened to be over-protected — each requirement has to be checked on its own distribution, not excused by a property of a different one.
:::

## Summary

| Item | Statement |
| --- | --- |
| Two-sided Gaussian coverage | $P(|X-\mu|\leq3\sigma) = \operatorname{erf}(3/\sqrt2) = 99.730\%$ |
| One-sided Gaussian coverage | $P(X\leq\mu+3\sigma) = \Phi(3) = 99.865\%$ |
| Why they diverge off-Gaussian | Mean plus three sigma uses only the first two moments; a percentile uses the full shape — they coincide only when the shape is fully Gaussian |
| Right-skewed example | $\mu+3\sigma$ at the $99.482$th percentile (not $99.865$th); true exceedance probability $3.84\times$ the Gaussian figure |
| Left-skewed (mirrored) example | Same $\sigma$, opposite bias: $\mu+3\sigma$ at the $99.996$th percentile; true exceedance probability $33.3\times$ smaller than the Gaussian figure |
| Reporting convention | Quote the empirical percentile by nearest rank from the actual campaign, not a sigma multiple, when the distribution is not known to be Gaussian |
| When the sample cannot resolve it | Fall back on the extreme-value or importance-sampling techniques from the tail-risk lesson |

Distribution shape is one way a campaign's numbers can mislead without announcing it; the next lesson turns to a second, equally quiet failure mode — finding, after the fact, which of the dozens of dispersed inputs actually drove the result, and whether the campaign even looked in the right part of the flight envelope to find out.
