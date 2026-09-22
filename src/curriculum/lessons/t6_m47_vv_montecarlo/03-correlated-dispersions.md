---
id: l03-correlated-dispersions
title: Distributions, their justification, and correlated dispersions
minutes: 17
covers:
  - Distributions and their justification; correlations between dispersed parameters and why ignoring them is not conservative
---

A dispersed parameter is not fully described by a mean and a standard deviation. It has a shape — Gaussian, lognormal, uniform, something else — and that shape has to be chosen deliberately and defended, the same way the number itself does. And no parameter lives alone: a real dispersion set has dozens of entries that share a common physical cause, and two entries that move together are not the same thing, statistically, as two entries that happen to have the same standard deviations and vary independently.

Both of these are places where an analysis can look complete — every parameter dispersed, every number sourced — while still being wrong in a way that does not announce itself. Choosing the wrong shape for a strictly positive quantity understates its tail. Dropping a correlation between two parameters that actually move together can make an output look tighter than it is, precisely where a requirement is checked. This lesson works through both, and spends most of its time on the second, because "independent sampling is conservative" is one of the most common and most damaging beliefs a Monte Carlo campaign can carry into a review.

## Choosing a distribution shape

The choice of shape is not a formality once a mean and standard deviation are known — it is a separate claim, with its own justification, about how a quantity actually behaves.

**Gaussian** is the right default for a quantity that is the sum of many small, roughly independent error sources with no particular direction — a position error built from a stack of small alignment and calibration errors, for instance. The central limit theorem, from the probability and statistics module, is the reason: a sum of many independent contributions tends toward a Gaussian shape regardless of what each individual contribution looks like, provided none of them dominates the sum.

**Lognormal** is the right choice for a quantity that is strictly positive and whose uncertainty is naturally multiplicative rather than additive — atmospheric density at a given altitude, a drag coefficient uncertainty, a propellant residual. If a quantity can be written as a product of several independent positive factors, its logarithm is a sum of their logarithms, and the same central-limit reasoning that produces a Gaussian sum now produces a Gaussian logarithm — a lognormal distribution by definition. A lognormal is right-skewed: it cannot go below zero, but its upper tail extends further than a Gaussian with the same mean and standard deviation would suggest, a fact a later lesson in this module quantifies precisely.

**Uniform** is the honest choice when the only available information is a bound with no further shape — a manufacturing tolerance specified as a plus-or-minus range with no distribution behind it, or a first-pass engineering judgment before test data exists. A uniform distribution does not claim values near the center are more likely, which is the correct posture when nothing justifies that claim.

Whichever shape is chosen, it is chosen for a reason that belongs in the same specification as the number itself: test data can be checked against a shape using the estimation techniques from earlier in the curriculum; heritage carries whatever shape the heritage system's own data supported; engineering judgment defaults to the shape that assumes the least, which is usually uniform. A dispersion set that assigns every parameter a Gaussian shape without asking whether that is true is making an unexamined claim about every one of them at once.

## Correlation, and why dropping it is not automatically safe

Two dispersed parameters are correlated when a common physical driver moves them together — propellant temperature at loading affects both specific impulse and bulk density, and a colder-than-nominal load can plausibly shift both at once. Building a dispersion set that samples each parameter from its own marginal distribution, independently of every other, is a modeling choice, and it is tempting to assume that choice is automatically conservative — that independence spreads things out more than reality would, so ignoring a real correlation can only widen the answer, never narrow it. That belief is false, and the direction of the error depends entirely on the sign of the correlation and how the two parameters enter the output.

For a downstream quantity that is (to good approximation, locally) a linear combination of two dispersed inputs, $Y = a X_1 + b X_2$, with $X_1$ and $X_2$ having standard deviations $\sigma_1, \sigma_2$ and correlation $\rho$, the true variance is

$$
\operatorname{Var}(Y) = a^2\sigma_1^2 + b^2\sigma_2^2 + 2ab\rho\sigma_1\sigma_2,
$$

which reduces to the independent-sampling formula only when $\rho = 0$. The correlation term can add to the independent-sampling variance or subtract from it, and the sign is set by the sign of $ab\rho$: when the sensitivities $a, b$ and the correlation $\rho$ all point the same way — a positive correlation reinforcing two effects that already push the output in the same direction — the true variance exceeds what independent sampling would report, and independent sampling **understates** the real spread. When the signs oppose, independent sampling **overstates** it. Neither direction is automatic; the only way to know which applies is to know the correlation and use it.

::: example A downrange miss requirement that quietly fails once correlation is included
A vehicle's downrange miss distance depends on an Isp-driven effective velocity error and a mass error, with linearized sensitivities $a = 0.45\,\mathrm{m}$ per $\mathrm{m/s}$ and $b = 0.0136\,\mathrm{m}$ per $\mathrm{kg}$, and dispersions $\sigma_1 = 3.0\,\mathrm{m/s}$ (Isp-equivalent) and $\sigma_2 = 70\,\mathrm{kg}$ (mass). Suppose engineering data shows propellant temperature at loading drives both — colder propellant is denser, raising loaded mass for a fixed tank volume, and simultaneously lowers combustion efficiency, lowering Isp — giving a correlation of $\rho = 0.65$ between the two.

The two contributions are comparable in size: $a\sigma_1 = 0.45\times3.0 = 1.35\,\mathrm{m}$ and $b\sigma_2 = 0.0136\times70 = 0.952\,\mathrm{m}$. Treated as independent,

$$
\operatorname{Var}(Y)_{\text{indep}} = 1.35^2 + 0.952^2 = 2.729\,\mathrm{m^2}, \qquad \sigma_{Y,\text{indep}} = 1.652\,\mathrm{m}.
$$

Including the true correlation adds the cross term $2(1.35)(0.952)(0.65) = 1.671\,\mathrm{m^2}$:

$$
\operatorname{Var}(Y)_{\text{true}} = 2.729 + 1.671 = 4.400\,\mathrm{m^2}, \qquad \sigma_{Y,\text{true}} = 2.098\,\mathrm{m}.
$$

The correlated standard deviation is $27.0\%$ larger than the independence assumption reports — confirmed by a $10{,}000$-draw Monte Carlo sampled directly from the full correlated covariance, which gives $\sigma_{Y,\mathrm{MC}} = 2.092\,\mathrm{m}$, matching the analytic $2.098\,\mathrm{m}$ to within sampling error. Now suppose a requirement allocates a one-sigma budget of $2.0\,\mathrm{m}$ to this pair of effects. The independence assumption reports $1.652\,\mathrm{m}$ — comfortably inside the budget, with room to spare. The true, correlated figure is $2.098\,\mathrm{m}$ — outside it. A campaign that dropped the correlation would have signed off a requirement that the vehicle, as actually built, does not meet.

Had the correlation instead been negative — $\rho = -0.65$, the two effects tending to cancel rather than reinforce — the true standard deviation falls to $1.029\,\mathrm{m}$, and the independence assumption would have **overstated** the spread by sixty percent, the opposite error. The lesson is not "correlation always makes things worse." It is that the sign and size of a correlation are facts about the physical system that determine which way the error runs, and assuming independence is a guess about that sign, not a safe default.
:::

::: key
For $Y = aX_1 + bX_2$, $\operatorname{Var}(Y) = a^2\sigma_1^2 + b^2\sigma_2^2 + 2ab\rho\sigma_1\sigma_2$. Dropping a real correlation ($\rho \to 0$) understates the true variance when $ab\rho > 0$ and overstates it when $ab\rho < 0$. Independent sampling is not automatically conservative in either direction — the sign of the error is set by the physics, not by the act of ignoring it.
:::

A second failure mode is subtler than a single miscalculated variance: it corrupts the entire joint sample, not one number in isolation. Wind is the standard example. A real wind profile is a spatially correlated field — speed and direction at one altitude are close to the values a few hundred meters away, because the atmosphere does not decorrelate over short vertical distances, and a persistent, coherent shear layer can extend over kilometers. Sampling wind independently at each altitude bin destroys that structure in both directions at once: it produces a profile that oscillates wildly from one bin to the next, which no real atmosphere does, and it simultaneously fails to produce the sustained, coherent shear layer that a real atmosphere occasionally does produce and that drives the worst aerodynamic loads a vehicle sees in flight. Independent sampling here is not conservative in either the mean sense or the tail sense — it manufactures an unrealistic profile shape while missing the realistic worst case entirely.

::: example How much a persistent shear layer changes the picture
Take wind speed at two adjacent altitude bins, each with a one-sigma dispersion of $\sigma = 5\,\mathrm{m/s}$. Sampled independently, the bin-to-bin difference — the local shear — has variance $2\sigma^2$ (a special case of the sum formula above, with $a=1,b=-1,\rho=0$), giving a standard deviation of $\sqrt{2}\times5 = 7.07\,\mathrm{m/s}$ between every adjacent pair of bins in the profile, everywhere, all the time.

A real atmosphere shows strong correlation between adjacent bins — take $\rho = 0.92$ as representative of a persistent layer. The shear variance is now $2\sigma^2(1-\rho) = 2(25)(0.08) = 4.0\,\mathrm{m^2/s^2}$, a standard deviation of $2.0\,\mathrm{m/s}$ — confirmed by a direct $200{,}000$-draw simulation from the correlated pair, which returns $2.005\,\mathrm{m/s}$. The independent-sampling profile has a typical bin-to-bin shear more than three and a half times larger than the correlated, physically real profile — not at one unlucky altitude, but as the generic behavior of the whole sampled profile. A vehicle flown against the independently sampled profile sees constant, unrealistic buffeting nothing like a real flight, while the specific, sustained shear layer that actually drives peak aerodynamic loading — a real, occasionally-occurring event this simple two-bin picture does not by itself capture — never appears at all, because independent sampling has no mechanism for producing a sustained feature. The fix is not a bigger standard deviation; it is sampling whole profiles from measured databases or from a model built to reproduce the real spatial correlation, so that both the shape and the extremes of the field are physically possible.
:::

::: warning Zero correlation is a claim, not a null hypothesis
Setting a correlation to zero in a dispersion set is not "making no assumption" — it is asserting, specifically, that the two parameters have no shared physical driver, which is a factual claim about the system that can be right or wrong. When two parameters plausibly share a cause — a common temperature, a common manufacturing batch, a common calibration reference, a common atmospheric process — the burden is to check the correlation, not to assume it away because zero is arithmetically convenient.
:::

## Check yourself

::: check
Why is a lognormal, rather than a Gaussian, usually the right shape for atmospheric density uncertainty at a given altitude?
:::

::: answer
Density is strictly positive and its uncertainty is naturally multiplicative — several independent positive factors (seasonal variation, local weather, measurement uncertainty in the reference model) combine by multiplication rather than addition. Taking the logarithm turns that product into a sum of independent terms, and the central limit theorem then makes the logarithm approximately Gaussian, which is exactly the definition of a lognormal distribution for density itself. A Gaussian, by contrast, assigns nonzero probability to negative density, which is physically meaningless.
:::

::: check
Two dispersed parameters feeding an output with sensitivities $a = 2.0$ and $b = -1.5$ have standard deviations $\sigma_1 = 4$ and $\sigma_2 = 5$ and correlation $\rho = 0.5$. Does dropping the correlation understate or overstate the true variance, and by how much?
:::

::: answer
The sign of the cross term is set by $ab\rho = (2.0)(-1.5)(0.5) = -1.5 < 0$, so the correlation term is negative and dropping it (setting $\rho=0$) removes a negative contribution, which overstates the true variance. Numerically: independent variance $= 2.0^2(4^2) + (-1.5)^2(5^2) = 256+56.25=... $ — more carefully, $a^2\sigma_1^2 = 4(16)=64$, $b^2\sigma_2^2=2.25(25)=56.25$, sum $=120.25$; the cross term is $2ab\rho\sigma_1\sigma_2 = 2(2.0)(-1.5)(0.5)(4)(5) = -60$, so the true variance is $120.25-60=60.25$ against the independent figure of $120.25$ — independence very nearly doubles the reported variance relative to the truth.
:::

::: check
A colleague argues that sampling every dispersed parameter independently is the conservative choice because it spreads the output distribution out more than reality would. Give a concrete counterexample.
:::

::: answer
The downrange-miss example in this lesson is a direct counterexample: with sensitivities and a positive correlation that reinforce each other, the independent-sampling standard deviation was $1.652\,\mathrm{m}$ against a true, correlated value of $2.098\,\mathrm{m}$ — independence understated the spread by twenty-seven percent, the opposite of conservative, and it was specifically wrong at the point that mattered, since it made a requirement violation look like a pass. Whether independence over- or understates the truth depends on the sign of $ab\rho$, which is a property of the physical system, not a property of the sampling method.
:::

::: check
Explain, in physical terms, why sampling a wind profile independently at each altitude bin produces a profile that is simultaneously unrealistic and non-conservative for aerodynamic loads.
:::

::: answer
A real atmosphere is spatially correlated: wind speed and direction change smoothly with altitude over most of the profile, with occasional sustained shear layers extending over a substantial vertical distance. Independent per-bin sampling destroys that structure in both directions: it produces constant, large bin-to-bin oscillation everywhere in the profile, which no real atmosphere exhibits, while having no mechanism to produce the specific, sustained, coherent shear layer that drives the worst aerodynamic loading a vehicle actually experiences — that kind of persistent feature requires correlated structure to exist at all. The independent profile is therefore wrong in shape everywhere and, at the same time, blind to the real worst case.
:::

::: check
A dispersion-set specification assigns a Gaussian shape to every parameter, including a manufacturing tolerance with no test data behind it, stated only as a plus-or-minus bound. What is wrong with that choice, and what shape would be more defensible?
:::

::: answer
A Gaussian shape claims that values near the center of the range are more likely than values near the edges, which is a specific statistical claim with no support when the only information available is a bound with no distribution behind it. A uniform distribution over the stated range is the more defensible choice in that situation, since it assumes no more than the available information actually supports; a Gaussian should be reserved for parameters where either test data or a central-limit argument — many small independent contributions summing together — genuinely justifies it.
:::

## Summary

| Item | Statement |
| --- | --- |
| Gaussian shape | Justified by a central-limit argument: many small, independent, additive contributions |
| Lognormal shape | Justified for strictly positive, multiplicative quantities — density, drag coefficient, propellant residual |
| Uniform shape | The honest default when only a bound, with no further shape information, is available |
| Correlated sum | $\operatorname{Var}(aX_1+bX_2) = a^2\sigma_1^2+b^2\sigma_2^2+2ab\rho\sigma_1\sigma_2$ |
| Direction of the error from dropping $\rho$ | Understates the true variance when $ab\rho>0$; overstates it when $ab\rho<0$ — never automatically safe |
| Correlated fields (winds) | Sample whole profiles from measured data or a spatially correlated model; independent-per-bin sampling is wrong in shape and blind to the real worst case |

The dispersion set is now built and its shapes and correlations are justified. The next lesson turns to the question the whole set exists to answer: given a campaign of some size run against this set, exactly what reliability claim, at what confidence, does a clean run history actually support.
