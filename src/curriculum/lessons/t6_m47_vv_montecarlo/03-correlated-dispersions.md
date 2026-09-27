---
id: l03-correlated-dispersions
title: Distributions, their justification, and correlated dispersions
minutes: 20
covers:
  - Distributions and their justification; correlations between dispersed parameters and why ignoring them is not conservative
---

Think about the kids in your class. Tall kids tend to have bigger feet. Not always — but if you learn that someone is tall, you would bet on bigger shoes. Height and shoe size **move together**. Now imagine a computer game that builds pretend kids by picking a height at random and, separately, a shoe size at random. It would make tiny kids with huge feet and giants with tiny feet. Each number on its own would look fine. The *combinations* would be nonsense.

A dispersion set has the same trap, plus a second one. The first trap is **shape**: a dispersed parameter is not fully described by its mean and standard deviation. It also has a shape — a bell curve, a lopsided curve, a flat one — and that shape is a claim you must choose and defend, like the number itself. The second trap is **correlation**: many parameters share a physical cause, and two parameters that move together are not the same, statistically, as two that happen to have the same spreads and vary on their own.

Both are places where an analysis can look complete — every parameter dispersed, every number sourced — and still be wrong in a way that does not announce itself. The wrong shape for a strictly positive quantity understates its tail. Dropping a real correlation can make an output look tighter than it is, exactly where a requirement is checked. This lesson works through both, and spends most of its time on the second. "Sampling everything independently is the safe choice" is one of the most common and most damaging beliefs a Monte Carlo campaign can carry into a review.

## Choosing a distribution shape

The shape is not a formality once the mean and standard deviation are known. It is a separate claim, with its own reason, about how a quantity really behaves. Three shapes cover most of a dispersion set.

**Gaussian** (the bell curve, also called normal) is the right default for a quantity built from many small, roughly independent errors with no favored direction — say, a position error made of a stack of small alignment and calibration errors. The reason is the **[[central limit theorem|central-limit]]** from the probability and statistics module: add up many independent contributions and the total tends toward a bell curve, whatever each piece looks like, as long as no single piece dominates.

**Lognormal** is the right choice for a quantity that is strictly positive and whose uncertainty is naturally *multiplicative* — "$5\%$ high" rather than "$5$ units high". Atmospheric density at a given altitude, a drag coefficient's uncertainty and a propellant residual are all like this. Here is why the shape follows. If a quantity is a product of several independent positive factors, its logarithm is the *sum* of their logarithms. The same central-limit reasoning then makes the logarithm bell-shaped. A quantity whose logarithm is Gaussian is, by definition, **lognormal**.

A lognormal is **right-skewed**, meaning lopsided with a long tail on the high side. It can never go below zero, but its upper tail stretches further than a Gaussian with the same mean and standard deviation would suggest. A later lesson in this module puts a number on that.

**Uniform** — every value in a range equally likely — is the honest choice when all you know is a bound with no further shape. A manufacturing tolerance given as "plus or minus so much", with no data behind it, is the classic case. So is a first-pass engineering judgment before any tests exist. A uniform distribution does not claim that values near the middle are more likely, which is the right position when nothing supports that claim.

Whichever shape you pick, the reason belongs in the same specification as the number:

- test data can be checked against a shape with the estimation tools from earlier in the course;
- heritage carries whatever shape the older system's own data supported;
- engineering judgment defaults to the shape that assumes the least, which is usually uniform.

A dispersion set that gives every parameter a Gaussian shape without asking is making an unexamined claim about every one of them at once.

## Correlation, and why dropping it is not automatically safe

Two dispersed parameters are **correlated** when a common physical cause moves them together. Here is a real one. The temperature of the propellant when it is loaded affects both its specific impulse and its density. A colder-than-planned load can plausibly shift both at once.

We measure how tightly two quantities move together with the **[[correlation coefficient|rho-scatter]]**, written $\rho$ and read "rho". It runs from $-1$ to $+1$:

- $\rho = +1$: they move in perfect lockstep, same direction;
- $\rho = 0$: knowing one tells you nothing (in a straight-line sense) about the other;
- $\rho = -1$: perfect lockstep, opposite directions.

Sampling every parameter on its own, from its own distribution, is a modeling choice. It is tempting to think that choice is automatically **conservative** — erring on the safe side — because independence "spreads things out more". That belief is false. Whether dropping a correlation makes your answer too wide or too narrow depends on the sign of the correlation and on how the two parameters enter the output.

Here is the rule. Suppose an output is, to a good local approximation, a straight-line combination of two dispersed inputs, $Y = a X_1 + b X_2$. The numbers $a$ and $b$ are the **sensitivities**: how much $Y$ changes per unit change of each input. The inputs have standard deviations $\sigma_1, \sigma_2$ and correlation $\rho$. Then the true variance is

$$
\operatorname{Var}(Y) = a^2\sigma_1^2 + b^2\sigma_2^2 + 2ab\rho\sigma_1\sigma_2.
$$

The first two terms are the familiar independent part from the last lesson. The third is the **cross term**. It vanishes only when $\rho = 0$. Its sign is the sign of $ab\rho$:

- when $ab\rho > 0$ — a positive correlation reinforcing two effects that already push the output the same way — the true variance is *bigger* than the independent formula says, so independent sampling **understates** the real spread;
- when $ab\rho < 0$ — the two effects tend to cancel — independent sampling **overstates** it.

Neither direction is automatic. The only way to know which applies is to know the correlation and use it.

::: note Why it has to be true
Write each input as its mean plus a wiggle: $X_1 = \mu_1 + e_1$ and $X_2 = \mu_2 + e_2$, where each wiggle averages zero. Then $Y$ minus its mean is $a e_1 + b e_2$, and the variance is the average of its square:

$$
(a e_1 + b e_2)^2 = a^2 e_1^2 + b^2 e_2^2 + 2ab\,e_1 e_2.
$$

Average each term. The average of $e_1^2$ is $\sigma_1^2$, and of $e_2^2$ is $\sigma_2^2$. The average of $e_1 e_2$ is the **covariance**, which is $\rho\sigma_1\sigma_2$ — that is how $\rho$ is defined. Put the three averages back and you have the formula. When the wiggles are independent, $e_1 e_2$ is positive as often as negative and averages to zero, which is why the last lesson had no cross term.
:::

::: example A downrange miss requirement that quietly fails once correlation is included
A vehicle's **[[downrange|downrange-word]]** shortfall — how far short of the target it lands — depends on two things. $X_1$ is the effective velocity shortfall caused by low $I_{sp}$. $X_2$ is extra loaded mass. Both make the vehicle fall short, so both sensitivities are positive: $a = 0.45\,\mathrm{m}$ per $\mathrm{m/s}$ and $b = 0.0136\,\mathrm{m}$ per $\mathrm{kg}$. The spreads are $\sigma_1 = 3.0\,\mathrm{m/s}$ and $\sigma_2 = 70\,\mathrm{kg}$.

Suppose engineering data shows that **[[propellant temperature|cold-propellant]]** at loading drives both. Colder propellant is denser, so a fixed tank volume holds more mass. Suppose it also lowers combustion efficiency, so $I_{sp}$ drops and the velocity shortfall grows. Cold therefore raises *both* $X_1$ and $X_2$, and the data gives $\rho = 0.65$.

**Size each contribution.** $a\sigma_1 = 0.45 \times 3.0 = 1.35\,\mathrm{m}$ and $b\sigma_2 = 0.0136 \times 70 = 0.952\,\mathrm{m}$. They are comparable in size.

**Treat them as independent** (drop the cross term):

$$
\operatorname{Var}(Y)_{\text{indep}} = 1.35^2 + 0.952^2 = 2.729\,\mathrm{m^2}, \qquad \sigma_{Y,\text{indep}} = 1.652\,\mathrm{m}.
$$

**Now include the correlation.** The cross term is $2(1.35)(0.952)(0.65) = 1.671\,\mathrm{m^2}$, so

$$
\operatorname{Var}(Y)_{\text{true}} = 2.729 + 1.671 = 4.400\,\mathrm{m^2}, \qquad \sigma_{Y,\text{true}} = 2.098\,\mathrm{m}.
$$

**Compare.** The correlated standard deviation is $27.0\%$ larger than the independent one. A $10{,}000$-draw Monte Carlo sampled from the full correlated covariance gives about $2.07$ to $2.09\,\mathrm{m}$ depending on the random seed, within sampling error of the $2.098\,\mathrm{m}$ formula — a good check that the formula is right.

**See what it does to a requirement.** Suppose a requirement allows a one-sigma budget of $2.0\,\mathrm{m}$ for this pair of effects. The independent answer, $1.652\,\mathrm{m}$, passes with room to spare. The true answer, $2.098\,\mathrm{m}$, fails. A campaign that dropped the correlation would have signed off a requirement the vehicle, as built, does not meet.

**Flip the sign.** Had the correlation been $\rho = -0.65$ — the two effects tending to cancel — the cross term would be $-1.671\,\mathrm{m^2}$, the true standard deviation $\sqrt{2.729 - 1.671} = 1.029\,\mathrm{m}$, and the independent answer would have **overstated** the spread by about $61\%$, the opposite error.

So the lesson is not "correlation always makes things worse". It is that the sign and size of a correlation are facts about the physical system, they decide which way the error runs, and assuming independence is a guess about that sign — not a safe default.
:::

::: key
For $Y = aX_1 + bX_2$, $\operatorname{Var}(Y) = a^2\sigma_1^2 + b^2\sigma_2^2 + 2ab\rho\sigma_1\sigma_2$. Dropping a real correlation ($\rho \to 0$) understates the true variance when $ab\rho > 0$ and overstates it when $ab\rho < 0$. Independent sampling is not automatically conservative in either direction — the sign of the error is set by the physics, not by the act of ignoring it.
:::

Correlations like this are everywhere in a real dispersion set. Mass properties move together with the propellant load: more propellant means more mass, a shifted balance point and a bigger inertia, all at once. Aerodynamic coefficients from the same wind-tunnel campaign share that tunnel's calibration uncertainty, so they tend to be off together.

## Correlated fields: the wind

A second failure mode is subtler. It does not merely miscalculate one variance. It corrupts the whole joint sample.

Wind is the standard example. Picture smoke rising from a chimney on a breezy day. It does not zigzag wildly every few meters; it bends in smooth curves. A real wind profile is a **correlated field**: speed and direction at one altitude are close to the values a few hundred meters higher, because the air does not change abruptly over short vertical distances. And now and then a persistent, coherent **[[shear layer|shear-layer]]** — a band where the wind changes steadily with height — stretches over kilometers.

Sample the wind independently in each altitude bin and you break that structure in two ways at once:

- you create a profile that swings wildly from one bin to the next, which no real atmosphere does;
- you never create the sustained, coherent shear layer that real air sometimes does produce — and that layer is what drives the **[[q-alpha|q-alpha]]** loads, the worst aerodynamic bending a vehicle sees in flight.

The jagged profile's rapid swings mostly average out as the vehicle flies through them, so the loads come out too low. Independent sampling here is not conservative in the average or in the tail. It invents an unrealistic shape and misses the realistic worst case.

::: key
Independent sampling destroys the combinations that physically occur. Sampling wind independently per altitude gives impossible shear AND never produces the coherent shear layer that drives q-alpha loads — optimistic, not conservative.
:::

::: example How much a persistent shear layer changes the picture
Take the wind speed in two neighboring altitude bins, each with a one-sigma spread of $\sigma = 5\,\mathrm{m/s}$. The **shear** between them is the difference, upper minus lower.

**Independent bins.** The difference is the sum formula with $a = 1$, $b = -1$, $\rho = 0$. Its variance is $1^2\sigma^2 + (-1)^2\sigma^2 = 2\sigma^2 = 50\,\mathrm{m^2/s^2}$, so its standard deviation is $\sqrt{2} \times 5 = 7.07\,\mathrm{m/s}$. That is the typical jump between *every* pair of neighboring bins, everywhere in the profile.

**Correlated bins.** Real air shows strong correlation between neighboring bins; take $\rho = 0.92$ as typical of a persistent layer. Now the cross term is $2(1)(-1)(0.92)\sigma^2$, and the variance becomes

$$
2\sigma^2(1 - \rho) = 2(25)(0.08) = 4.0\,\mathrm{m^2/s^2},
$$

a standard deviation of $2.0\,\mathrm{m/s}$. A direct $200{,}000$-draw simulation from the correlated pair gives $2.00\,\mathrm{m/s}$, matching.

**Compare.** $7.07 / 2.0 \approx 3.5$. The independent profile has a typical bin-to-bin shear more than three and a half times larger than the real, correlated one — not at one unlucky altitude, but everywhere, as its normal behavior. A vehicle flown through it sees constant buffeting unlike any real flight.

Meanwhile the thing that really drives peak loads — a sustained shear layer, a real event this two-bin picture cannot capture on its own — never appears, because independent sampling has no way to build a feature that lasts. The fix is not a bigger standard deviation. It is sampling whole profiles, from **[[measured databases|wind-databases]]** or from a model built to reproduce the real correlation with altitude, so both the shape and the extremes are physically possible.
:::

::: warning Zero correlation is a claim, not a null hypothesis
Setting a correlation to zero is not "making no assumption". It asserts that the two parameters share no physical cause — a factual claim about the system that can be right or wrong. When two parameters plausibly share a cause — a common temperature, a common manufacturing batch, a common calibration reference, a common weather process — the burden is on you to check the correlation, not to assume it away because zero is convenient. And when you do disperse correlated parameters, the sampler has to [[build the correlation in|cholesky-bridge]] on purpose.
:::

## Check yourself

::: check
Why is a lognormal, rather than a Gaussian, usually the right shape for atmospheric density uncertainty at a given altitude?
:::

::: answer
Density is strictly positive, and its uncertainty is naturally multiplicative: several independent positive factors — seasonal change, local weather, uncertainty in the reference model — combine by multiplying, not adding.

Take the logarithm and that product becomes a sum of independent terms. The central limit theorem then makes the logarithm roughly Gaussian, which is exactly the definition of a lognormal distribution for density itself. A Gaussian, by contrast, gives some probability to negative density, which is physically meaningless.
:::

::: check
Two dispersed parameters feed an output with sensitivities $a = 2.0$ and $b = -1.5$. Their standard deviations are $\sigma_1 = 4$ and $\sigma_2 = 5$, and their correlation is $\rho = 0.5$. Does dropping the correlation understate or overstate the true variance, and by how much?
:::

::: answer
**The sign first.** $ab\rho = (2.0)(-1.5)(0.5) = -1.5$, which is negative. So the cross term is negative, and dropping it removes a negative piece: independence **overstates** the variance.

**The independent part.** $a^2\sigma_1^2 = 4 \times 16 = 64$ and $b^2\sigma_2^2 = 2.25 \times 25 = 56.25$, so the independent variance is $64 + 56.25 = 120.25$.

**The cross term.** $2ab\rho\sigma_1\sigma_2 = 2(2.0)(-1.5)(0.5)(4)(5) = -60$.

**The true variance.** $120.25 - 60 = 60.25$.

So independence reports $120.25$ against a true $60.25$ — very nearly double ($120.25 / 60.25 \approx 2.0$). In standard deviations, about $11.0$ against $7.76$.
:::

::: check
A colleague argues that sampling every dispersed parameter independently is the conservative choice, because it spreads the output out more than reality would. Give a concrete counterexample.
:::

::: answer
The downrange example in this lesson is one. The sensitivities and the positive correlation reinforce each other ($ab\rho > 0$). The independent standard deviation was $1.652\,\mathrm{m}$ against a true, correlated $2.098\,\mathrm{m}$. Independence understated the spread by about $21\%$ of the true value (the truth is $27\%$ larger), the opposite of conservative.

And it was wrong exactly where it mattered: against a $2.0\,\mathrm{m}$ budget it turned a failure into an apparent pass. Whether independence over- or understates the truth depends on the sign of $ab\rho$, which is a property of the physical system, not of the sampling method.
:::

::: check
Explain, in physical terms, why sampling a wind profile independently at each altitude bin produces a profile that is both unrealistic and non-conservative for aerodynamic loads.
:::

::: answer
Real air is correlated with altitude. Wind speed and direction change smoothly over most of the profile, with occasional sustained shear layers stretching over a large vertical distance.

Independent sampling in each bin breaks that in both directions. It produces constant, large jumps between neighboring bins everywhere, which no real atmosphere shows. And it has no way to produce a sustained, coherent shear layer — a feature like that needs correlated structure to exist at all — yet that layer is what drives the worst aerodynamic loads. The independent profile is wrong in shape everywhere and, at the same time, blind to the real worst case.
:::

::: check
A dispersion-set specification gives a Gaussian shape to every parameter, including a manufacturing tolerance stated only as a plus-or-minus bound with no test data. What is wrong with that choice, and what shape is more defensible?
:::

::: answer
A Gaussian claims that values near the middle of the range are more likely than values near the edges. That is a specific statistical claim, and nothing supports it when the only information is a bound.

A uniform distribution over the stated range is more defensible, because it assumes no more than the information supports. Save the Gaussian for parameters where test data, or a central-limit argument — many small independent contributions adding up — really justifies it.
:::

## Summary

| Item | Statement |
| --- | --- |
| Gaussian shape | Justified by a central-limit argument: many small, independent, additive contributions |
| Lognormal shape | Justified for strictly positive, multiplicative quantities — density, drag coefficient, propellant residual |
| Uniform shape | The honest default when only a bound, with no further shape information, is available |
| Correlation $\rho$ | From $-1$ to $+1$; how tightly two quantities move together; covariance is $\rho\sigma_1\sigma_2$ |
| Correlated sum | $\operatorname{Var}(aX_1+bX_2) = a^2\sigma_1^2+b^2\sigma_2^2+2ab\rho\sigma_1\sigma_2$ |
| Error from dropping $\rho$ | Understates the true variance when $ab\rho>0$; overstates it when $ab\rho<0$ — never automatically safe |
| Correlated fields (winds) | Sample whole profiles from measured data or a correlated model; per-bin sampling is wrong in shape and blind to the real worst case |

The dispersion set is now built, with its shapes and correlations justified. The next lesson turns to the question the whole set exists to answer: given a campaign of some size run against it, exactly what reliability claim, at what confidence, does a clean run history support?

::: context central-limit Why sums turn into bell curves
Roll one die and every face from $1$ to $6$ is equally likely: a flat shape. Roll two and add them, and $7$ is six times as likely as $2$ or $12$, because six pairs make $7$ and only one pair makes $2$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g fill="#8fb8f0" stroke="#1f2a44" stroke-width="1">
    <rect x="20" y="30" width="16" height="90"/><rect x="38" y="30" width="16" height="90"/><rect x="56" y="30" width="16" height="90"/>
    <rect x="74" y="30" width="16" height="90"/><rect x="92" y="30" width="16" height="90"/><rect x="110" y="30" width="16" height="90"/>
  </g>
  <g fill="#1d6fd1" stroke="#1f2a44" stroke-width="1">
    <rect x="160" y="105" width="15" height="15"/><rect x="177" y="90" width="15" height="30"/><rect x="194" y="75" width="15" height="45"/>
    <rect x="211" y="60" width="15" height="60"/><rect x="228" y="45" width="15" height="75"/><rect x="245" y="30" width="15" height="90"/>
    <rect x="262" y="45" width="15" height="75"/><rect x="279" y="60" width="15" height="60"/><rect x="296" y="75" width="15" height="45"/>
    <rect x="313" y="90" width="15" height="30"/><rect x="330" y="105" width="15" height="15"/>
  </g>
  <line x1="15" y1="120" x2="350" y2="120" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="73" y="140" font-size="12" text-anchor="middle" fill="#1f2a44">one die: 1 to 6</text>
  <text x="252" y="140" font-size="12" text-anchor="middle" fill="#1f2a44">two dice: 2 to 12</text>
</svg>
```

Both panels use the same scale of probability. Add more dice and the shape rounds into a bell. That is the central limit theorem at work.
:::

::: context rho-scatter What a correlation looks like
Each dot below is one pair of values, measured in standard deviations. On the left the two are independent ($\rho \approx 0$): a round cloud. On the right they are strongly correlated ($\rho \approx 0.9$): a narrow cloud tilted uphill.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="10" width="150" height="120" fill="#fff" stroke="#6c7a93" stroke-width="1"/>
  <rect x="190" y="10" width="150" height="120" fill="#fff" stroke="#6c7a93" stroke-width="1"/>
  <g fill="#1d6fd1">
<circle cx="135.8" cy="118.0" r="2.2"/><circle cx="103.4" cy="81.4" r="2.2"/><circle cx="85.9" cy="74.3" r="2.2"/><circle cx="54.6" cy="74.6" r="2.2"/><circle cx="77.7" cy="22.0" r="2.2"/><circle cx="99.5" cy="77.1" r="2.2"/><circle cx="89.4" cy="83.4" r="2.2"/><circle cx="73.9" cy="77.8" r="2.2"/><circle cx="104.6" cy="74.8" r="2.2"/><circle cx="114.2" cy="74.0" r="2.2"/><circle cx="95.5" cy="39.1" r="2.2"/><circle cx="105.9" cy="80.1" r="2.2"/><circle cx="91.3" cy="59.2" r="2.2"/><circle cx="133.7" cy="75.4" r="2.2"/><circle cx="90.1" cy="50.0" r="2.2"/><circle cx="77.3" cy="75.8" r="2.2"/><circle cx="112.7" cy="58.4" r="2.2"/><circle cx="96.8" cy="56.6" r="2.2"/><circle cx="39.0" cy="49.6" r="2.2"/><circle cx="75.8" cy="103.4" r="2.2"/><circle cx="100.5" cy="56.0" r="2.2"/><circle cx="86.1" cy="91.5" r="2.2"/><circle cx="95.5" cy="71.1" r="2.2"/><circle cx="123.1" cy="55.1" r="2.2"/><circle cx="98.9" cy="47.8" r="2.2"/><circle cx="90.9" cy="88.5" r="2.2"/><circle cx="106.7" cy="58.3" r="2.2"/><circle cx="90.7" cy="85.7" r="2.2"/><circle cx="99.6" cy="118.0" r="2.2"/><circle cx="108.8" cy="60.2" r="2.2"/><circle cx="62.2" cy="68.8" r="2.2"/><circle cx="75.7" cy="54.9" r="2.2"/><circle cx="54.3" cy="88.3" r="2.2"/><circle cx="109.2" cy="46.9" r="2.2"/><circle cx="51.8" cy="80.0" r="2.2"/><circle cx="101.6" cy="82.2" r="2.2"/><circle cx="126.8" cy="93.8" r="2.2"/><circle cx="102.1" cy="91.0" r="2.2"/><circle cx="123.1" cy="70.4" r="2.2"/><circle cx="87.6" cy="104.4" r="2.2"/><circle cx="128.6" cy="54.9" r="2.2"/><circle cx="110.1" cy="47.2" r="2.2"/><circle cx="102.0" cy="82.8" r="2.2"/><circle cx="79.0" cy="86.0" r="2.2"/><circle cx="122.4" cy="99.2" r="2.2"/><circle cx="83.1" cy="76.4" r="2.2"/><circle cx="99.5" cy="58.5" r="2.2"/><circle cx="70.0" cy="104.6" r="2.2"/><circle cx="94.9" cy="45.7" r="2.2"/><circle cx="110.1" cy="65.7" r="2.2"/><circle cx="88.7" cy="64.1" r="2.2"/><circle cx="90.1" cy="53.7" r="2.2"/><circle cx="79.1" cy="67.3" r="2.2"/><circle cx="92.8" cy="59.1" r="2.2"/><circle cx="99.5" cy="22.0" r="2.2"/><circle cx="125.0" cy="40.1" r="2.2"/><circle cx="54.2" cy="76.8" r="2.2"/><circle cx="82.8" cy="59.3" r="2.2"/><circle cx="49.4" cy="46.5" r="2.2"/><circle cx="116.3" cy="96.0" r="2.2"/>
<circle cx="245.4" cy="94.6" r="2.2"/><circle cx="265.9" cy="63.6" r="2.2"/><circle cx="306.0" cy="34.9" r="2.2"/><circle cx="280.4" cy="54.8" r="2.2"/><circle cx="300.2" cy="31.9" r="2.2"/><circle cx="292.4" cy="54.8" r="2.2"/><circle cx="261.2" cy="80.6" r="2.2"/><circle cx="295.1" cy="37.2" r="2.2"/><circle cx="258.9" cy="79.4" r="2.2"/><circle cx="274.7" cy="67.4" r="2.2"/><circle cx="246.4" cy="82.6" r="2.2"/><circle cx="314.3" cy="27.8" r="2.2"/><circle cx="253.9" cy="90.2" r="2.2"/><circle cx="238.3" cy="89.5" r="2.2"/><circle cx="282.0" cy="54.6" r="2.2"/><circle cx="271.7" cy="63.0" r="2.2"/><circle cx="267.8" cy="80.8" r="2.2"/><circle cx="255.8" cy="77.3" r="2.2"/><circle cx="249.3" cy="88.3" r="2.2"/><circle cx="248.6" cy="87.7" r="2.2"/><circle cx="282.1" cy="58.2" r="2.2"/><circle cx="261.9" cy="65.7" r="2.2"/><circle cx="277.9" cy="43.6" r="2.2"/><circle cx="223.2" cy="100.2" r="2.2"/><circle cx="255.4" cy="77.5" r="2.2"/><circle cx="281.8" cy="45.5" r="2.2"/><circle cx="285.8" cy="49.9" r="2.2"/><circle cx="297.2" cy="43.5" r="2.2"/><circle cx="262.2" cy="65.6" r="2.2"/><circle cx="254.0" cy="61.1" r="2.2"/><circle cx="285.4" cy="32.7" r="2.2"/><circle cx="264.5" cy="73.8" r="2.2"/><circle cx="268.3" cy="60.6" r="2.2"/><circle cx="253.3" cy="77.3" r="2.2"/><circle cx="264.7" cy="56.2" r="2.2"/><circle cx="251.7" cy="72.8" r="2.2"/><circle cx="252.1" cy="90.0" r="2.2"/><circle cx="250.8" cy="93.2" r="2.2"/><circle cx="267.9" cy="58.4" r="2.2"/><circle cx="268.3" cy="61.6" r="2.2"/><circle cx="297.6" cy="38.3" r="2.2"/><circle cx="268.9" cy="68.9" r="2.2"/><circle cx="232.8" cy="92.3" r="2.2"/><circle cx="229.9" cy="95.9" r="2.2"/><circle cx="264.7" cy="60.4" r="2.2"/><circle cx="263.6" cy="78.4" r="2.2"/><circle cx="272.2" cy="68.4" r="2.2"/><circle cx="261.4" cy="72.9" r="2.2"/><circle cx="262.3" cy="74.1" r="2.2"/><circle cx="248.4" cy="86.6" r="2.2"/><circle cx="222.2" cy="109.9" r="2.2"/><circle cx="241.0" cy="81.8" r="2.2"/><circle cx="290.4" cy="64.1" r="2.2"/><circle cx="267.9" cy="68.5" r="2.2"/><circle cx="244.1" cy="84.2" r="2.2"/><circle cx="255.8" cy="93.7" r="2.2"/><circle cx="259.7" cy="76.1" r="2.2"/><circle cx="267.1" cy="78.8" r="2.2"/><circle cx="277.3" cy="52.5" r="2.2"/><circle cx="242.1" cy="96.4" r="2.2"/>
  </g>
  <text x="95" y="148" font-size="12" text-anchor="middle" fill="#1f2a44">independent, ρ ≈ 0</text>
  <text x="265" y="148" font-size="12" text-anchor="middle" fill="#1f2a44">correlated, ρ ≈ 0.9</text>
</svg>
```

Sample the right-hand pair independently and you would fill the empty top-left and bottom-right corners with combinations that never happen — and thin out the corners where both are high together.
:::

::: context downrange-word Downrange and crossrange
**Downrange** is distance measured along the direction the vehicle is flying, away from the launch site. **Crossrange** is distance sideways to that path. A landing miss is often split into these two parts because different things cause them: propulsion and mass errors mostly push the landing point long or short (downrange), while winds and steering errors push it sideways (crossrange).
:::

::: context cold-propellant Chilling propellant on purpose
Colder liquids are denser, so a tank holds more of them. SpaceX's Falcon 9 exploits this: it loads liquid oxygen chilled to around $-207\,^\circ\mathrm{C}$, well below its normal boiling point, and cools its kerosene too, squeezing extra propellant into the same tanks. The flip side is that loading temperature becomes a real source of dispersion. A few degrees of difference shifts the loaded mass and the engine's behavior together — exactly the kind of shared cause that creates a correlation.
:::

::: context shear-layer What wind shear is
**Wind shear** is a change in wind speed or direction over a short distance — here, over a change in altitude. Picture a rocket punching up through a layer where the wind goes from gentle to $30\,\mathrm{m/s}$ within a kilometer. As it passes through, the air suddenly hits it from a different angle, and the vehicle must steer hard to stay on course. A single sharp, sustained layer like that does more harm than lots of small random wiggles.
:::

::: context q-alpha The number that bends rockets
**Dynamic pressure**, $q = \tfrac{1}{2}\rho v^2$, measures how hard the oncoming air presses on the vehicle (here $\rho$ is air density, not a correlation). **Angle of attack**, $\alpha$ (read "alpha"), is the angle between the vehicle's nose and the airflow. Their product, "q-alpha", roughly sets the sideways aerodynamic load that tries to bend the rocket. It peaks around maximum dynamic pressure, about a minute after launch, and wind shear there is what drives $\alpha$ up. Many launch vehicles have a q-alpha limit that decides whether it is safe to launch on a given day.
:::

::: context wind-databases Measuring the day's wind
Launch sites keep long records of wind profiles measured by weather balloons and ground radars, season by season. Engineers sample whole historical profiles from these records, so every sampled profile is a wind that really happened. On launch day, fresh balloon or radar measurements are fed into the analysis so the vehicle's steering can be checked against the actual winds aloft a few hours before liftoff. The Space Shuttle program used special radar-tracked balloons called Jimspheres for this.
:::

::: context cholesky-bridge How a computer makes correlated numbers
A random number generator hands you independent numbers. To get correlated ones, you mix them. For two standard normal numbers $z_1$ and $z_2$, set $x_1 = z_1$ and $x_2 = \rho z_1 + \sqrt{1 - \rho^2}\,z_2$. Then $x_2$ has standard deviation $1$ and correlation $\rho$ with $x_1$. For many variables the same mixing is done with a matrix, the **Cholesky factor** $\mathbf{L}$ of the covariance, where $\mathbf{L}\mathbf{L}^T$ equals the covariance: $\mathbf{x} = \mathbf{L}\mathbf{z}$. You will use it again in the linear covariance lesson and its exercise.
:::
