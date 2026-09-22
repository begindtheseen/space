---
id: l02-random-variables-pdf-cdf
title: Random variables, PDF and CDF
minutes: 21
covers:
  - random variables, PDF and CDF
---

The previous lesson dealt with events: things that either happen or do not. Most of what a GNC engineer measures is not like that. A range reading is a number, an attitude error is three numbers, a touchdown point is a pair of coordinates on a map. To reason about the probability that a landing ellipse is missed, or that a gyro's rate error exceeds a threshold, you need a way to attach probabilities to numbers rather than to yes-or-no outcomes. That is what a random variable and its distribution do.

The distribution is the complete description of a noisy quantity. A sensor datasheet that quotes a noise figure is quoting one number summarising a distribution; a requirement that says "the 99th-percentile miss distance shall be below 50 m" is a statement about a distribution's tail; a Monte Carlo campaign is an attempt to sample a distribution you cannot write down. Two functions carry the description. The cumulative distribution function answers "what is the probability the value is at most this much?", and the probability density function tells you where the probability is concentrated. You will use both in every later lesson.

## From outcomes to numbers

A **random variable** is a function that assigns a real number to every outcome in the sample space: $X : \Omega \to \mathbb{R}$. The randomness lives in the outcome; the variable is a deterministic rule for reading a number off it. When a range sensor is triggered, the outcome is "everything that happened inside the sensor during that measurement", and $X$ is the number printed on the bus. Capital letters denote the random variable and lower-case letters denote a particular value it might take, so $P(X \leq x)$ is the probability that the reading falls at or below the specific number $x$. A value actually observed is called a **realisation** or a **sample**.

Random variables come in two kinds. A **discrete** random variable takes values in a countable set: the number of failed thrusters, the number of GNSS satellites in view, the number of Monte Carlo runs that violate a requirement. A **continuous** random variable takes values in a continuum: a range, a rate, a miss distance. The two kinds are described by different functions, but the cumulative distribution function is common to both, so we start there after a look at the discrete case, which is the easier one.

## Discrete random variables and the probability mass function

For a discrete random variable the natural description is the **probability mass function** (PMF), $p_X(x) = P(X = x)$, which lists the probability of every value. The masses are non-negative and sum to one over all possible values. Three discrete distributions turn up repeatedly in GNC work.

The **Bernoulli** variable takes the value $1$ with probability $p$ and $0$ with probability $1 - p$. It is the indicator of a single event: this run failed, this thruster did not ignite, this sample landed outside the ellipse.

The **binomial** variable counts successes in $n$ independent Bernoulli trials with the same $p$:

$$
P(K = k) = \binom{n}{k}\,p^{k}\,(1 - p)^{n - k}, \qquad k = 0, 1, \ldots, n.
$$

The binomial coefficient $\binom{n}{k} = n!/(k!\,(n-k)!)$ counts the arrangements of $k$ successes among $n$ trials, and the power terms give the probability of any one arrangement by the multiplication rule for independent events. The number of failures in a Monte Carlo campaign of $n$ runs is binomial, which is why this distribution governs how many runs you need.

The **Poisson** variable counts events that occur at a constant average rate $\lambda$ over an interval of length $t$, with no memory between events:

$$
P(N = k) = \frac{(\lambda t)^{k}}{k!}\,e^{-\lambda t}, \qquad k = 0, 1, 2, \ldots
$$

Star-tracker dropouts per hour, cosmic-ray upsets in a memory bank, micrometeoroid impacts per orbit: whenever events are rare, independent and arrive at a steady rate, the count is Poisson. It is also the limit of the binomial when $n$ is large and $p$ is small with $np = \lambda t$ fixed.

::: example How many failures should a Monte Carlo batch show?
Suppose a design truly violates a requirement on $5\%$ of trajectories, and you run a batch of $n = 20$ independent Monte Carlo cases. The number of violating runs is binomial with $n = 20$ and $p = 0.05$. The probability of seeing no violations at all is

$$
P(K = 0) = 0.95^{20} = 0.358,
$$

and the probability of exactly one is $20 \times 0.05 \times 0.95^{19} = 0.377$. Two or more violations occur with probability $1 - 0.358 - 0.377 = 0.264$. A batch of twenty clean runs is therefore weak evidence: more than a third of the time, a design that fails one case in twenty will sail through such a batch untouched. The Monte Carlo lesson turns this observation into a sizing rule.
:::

## The cumulative distribution function

The **cumulative distribution function** (CDF) of any random variable, discrete or continuous, is

$$
F_X(x) = P(X \leq x).
$$

It is defined for every real $x$, and three properties follow directly from the axioms. It is non-decreasing, because $\{X \leq a\} \subseteq \{X \leq b\}$ when $a \leq b$. Its limits are $F_X(-\infty) = 0$ and $F_X(+\infty) = 1$. And the probability of falling in an interval is a difference of two values:

$$
P(a < X \leq b) = F_X(b) - F_X(a).
$$

For a discrete variable the CDF is a staircase that jumps by $p_X(x)$ at each possible value $x$ and is flat in between. For a continuous variable it is a continuous, smooth ramp from $0$ to $1$, and the probability that $X$ equals any single exact value is zero: $P(X = x) = F_X(x) - F_X(x^-) = 0$ because there is no jump. That is not a paradox. A range sensor with infinitely fine resolution never returns *exactly* 1000.000000 m; probability attaches to intervals, not points, and whether you write $P(a < X \leq b)$ or $P(a \leq X \leq b)$ makes no difference for a continuous variable.

## The probability density function

For a continuous random variable the CDF is differentiable almost everywhere, and its derivative is the **probability density function** (PDF):

$$
f_X(x) = \frac{dF_X}{dx}, \qquad F_X(x) = \int_{-\infty}^{x} f_X(u)\,du.
$$

The density is the probability per unit length of $X$. For a small interval,

$$
P(x < X \leq x + dx) \approx f_X(x)\,dx,
$$

and over any interval the probability is the area under the density:

$$
P(a < X \leq b) = \int_{a}^{b} f_X(x)\,dx.
$$

A density must be non-negative and integrate to one over the whole real line. It is not itself a probability, and it is not bounded by one. If $X$ is a range error in metres, $f_X$ has units of $\mathrm{m^{-1}}$; a range error uniformly spread over a band $1\,\mathrm{mm}$ wide has a density of $1000\,\mathrm{m^{-1}}$ across that band, and that is perfectly legitimate because the area is still one.

::: warning
A density value such as $f_X(0.3) = 2.5$ is not "the probability that $X = 0.3$", which is zero for any continuous variable. It is a probability *per unit of $X$*, and it carries the reciprocal of $X$'s units. Comparing density values across variables with different units, or reading a tall peak as a large probability without multiplying by a width, are both errors that appear in real analyses.
:::

Two continuous distributions are worth knowing before the Gaussian, which gets its own lessons.

The **uniform** distribution on $[a, b]$ spreads probability evenly:

$$
f_X(x) = \begin{cases} \dfrac{1}{b - a} & a \leq x \leq b, \\[6pt] 0 & \text{otherwise,} \end{cases}
\qquad
F_X(x) = \frac{x - a}{b - a} \quad \text{for } a \leq x \leq b.
$$

It is the honest model for a quantity about which you know only the limits, and it is the exact model for the rounding error of an analogue-to-digital converter.

The **exponential** distribution with rate $\lambda$ describes the waiting time until the first event of a Poisson process:

$$
f_T(t) = \lambda e^{-\lambda t}, \qquad F_T(t) = 1 - e^{-\lambda t}, \qquad t \geq 0.
$$

Its mean waiting time is $1/\lambda$, which in reliability work is the **mean time between failures** (MTBF). The exponential is *memoryless*: the probability of surviving a further time $s$ given survival to time $t$ is

$$
P(T > t + s \mid T > t) = \frac{e^{-\lambda (t + s)}}{e^{-\lambda t}} = e^{-\lambda s},
$$

the same as the probability of surviving $s$ from new. That is a strong physical claim, and it is right for random electronic failures and wrong for wear-out mechanisms such as bearing fatigue.

::: example Quantisation error of an ADC
A 12-bit converter digitises a sensor voltage spanning $\pm 10\,\mathrm{V}$. There are $2^{12} = 4096$ levels, so the step is

$$
\Delta = \frac{20\,\mathrm{V}}{4096} = 4.88\,\mathrm{mV}.
$$

If the converter rounds to the nearest level and the input wanders over many steps, the error $E$ is uniform on $[-\Delta/2, \Delta/2]$, with density $f_E(e) = 1/\Delta = 205\,\mathrm{V^{-1}}$ on that interval. The probability that the error exceeds $1\,\mathrm{mV}$ in magnitude is the area outside $[-1, 1]\,\mathrm{mV}$:

$$
P(|E| > 1\,\mathrm{mV}) = 1 - \frac{2 \times 1\,\mathrm{mV}}{4.88\,\mathrm{mV}} = 1 - 0.410 = 0.590.
$$

For a $2\,\mathrm{mV}$ threshold the same calculation gives $1 - 4/4.88 = 0.181$. The density here is far greater than one, and there is nothing wrong with that: it is a probability per volt.
:::

::: example Survival of a flight computer
A flight computer has an MTBF of $50\,000\,\mathrm{h}$ and random failures modelled as exponential, so $\lambda = 2 \times 10^{-5}\,\mathrm{h^{-1}}$. The probability it survives a $5000\,\mathrm{h}$ mission is

$$
P(T > 5000) = e^{-5000/50\,000} = e^{-0.1} = 0.905.
$$

The **median** life, the time by which half of a large fleet would have failed, solves $F_T(t) = 0.5$: $t = \ln 2/\lambda = 34\,700\,\mathrm{h}$, noticeably less than the MTBF because the distribution has a long right tail. By memorylessness, a unit that has already run $50\,000\,\mathrm{h}$ has exactly the same $0.905$ probability of surviving the next $5000\,\mathrm{h}$ as a fresh one. If experience says older units fail more often, the exponential model is wrong for them and a distribution with wear-out, such as the Weibull, is needed instead.
:::

## Quantiles and the inverse CDF

Requirements are often written in terms of percentiles rather than probabilities. The **quantile function** is the inverse of the CDF: $Q(u) = F_X^{-1}(u)$ is the value below which $X$ falls with probability $u$. The median is $Q(0.5)$; the 99th-percentile miss distance is $Q(0.99)$. For the exponential, solving $1 - e^{-\lambda t} = u$ gives $Q(u) = -\ln(1 - u)/\lambda$, so the 95th percentile of the flight computer's life above is $-\ln(0.05) \times 50\,000 = 150\,000\,\mathrm{h}$ and the 5th percentile is $-\ln(0.95) \times 50\,000 = 2560\,\mathrm{h}$: a wide spread around the median.

The quantile function has a second job. If $U$ is uniform on $[0, 1]$, then $X = Q(U)$ has CDF $F_X$, because

$$
P(Q(U) \leq x) = P(U \leq F_X(x)) = F_X(x).
$$

This is **inverse-transform sampling**: any random number generator that produces uniforms can produce samples from any distribution whose quantile function you can evaluate. Setting $T = -\ln(1 - U)/\lambda$ produces exponential waiting times; since $1 - U$ is also uniform, $T = -\ln(U)/\lambda$ works as well. The Monte Carlo lesson relies on this.

## Functions of a random variable

Frequently you know the distribution of one quantity and need the distribution of a function of it: the range error in metres from a timing error in nanoseconds, the kinetic energy from a velocity. Let $Y = g(X)$ with $g$ strictly increasing and differentiable. Then the events $\{Y \leq y\}$ and $\{X \leq g^{-1}(y)\}$ are the same, so

$$
F_Y(y) = F_X\!\left(g^{-1}(y)\right),
$$

and differentiating with the chain rule gives the **change-of-variables formula**

$$
f_Y(y) = f_X\!\left(g^{-1}(y)\right)\,\left|\frac{d\,g^{-1}(y)}{dy}\right|.
$$

The absolute value covers the decreasing case, where the inequality flips and $F_Y(y) = 1 - F_X(g^{-1}(y))$; the derivative is then negative and the density formula is unchanged. The Jacobian factor is what keeps the total area equal to one: where $g$ stretches the axis, the density must thin out in proportion.

The linear case $Y = aX + b$ with $a \neq 0$ is the one you will use most:

$$
f_Y(y) = \frac{1}{|a|}\, f_X\!\left(\frac{y - b}{a}\right).
$$

A gyro error that is uniform in raw counts becomes a uniform error in $\mathrm{rad/s}$ after multiplying by the scale factor, with the density divided by that factor. This one-dimensional formula is the seed of the multivariate result in the lesson on linear transformations, where $1/|a|$ becomes $1/|\det \mathbf{A}|$.

## Two variables at once

A vehicle's state is never a single number, so the ideas above must extend to several random variables considered together. For two continuous variables the **joint density** $f_{XY}(x, y)$ satisfies

$$
P\big((X, Y) \in R\big) = \iint_R f_{XY}(x, y)\,dx\,dy
$$

for any region $R$ of the plane, and integrates to one over the whole plane. Integrating out one variable gives the **marginal density** of the other,

$$
f_X(x) = \int_{-\infty}^{\infty} f_{XY}(x, y)\,dy,
$$

which is the law of total probability in continuous form. The **conditional density** of $Y$ given that $X = x$ is

$$
f_{Y \mid X}(y \mid x) = \frac{f_{XY}(x, y)}{f_X(x)},
$$

the slice of the joint density at $x$, rescaled to have unit area. Two variables are **independent** when the joint density factorises, $f_{XY}(x, y) = f_X(x)\,f_Y(y)$, which is the same as saying that the conditional density does not depend on the conditioning value. Bayes' theorem for densities is the previous lesson's formula with densities in place of probabilities:

$$
f_{X \mid Y}(x \mid y) = \frac{f_{Y \mid X}(y \mid x)\,f_X(x)}{f_Y(y)}.
$$

Read it once more with the estimation names attached. $X$ is the state, $Y$ the measurement, $f_{Y \mid X}$ the sensor model, $f_X$ the prior, and $f_{X \mid Y}$ the posterior. Every navigation filter computes some approximation of this density.

::: key
For a continuous random variable, $F_X(x) = P(X \leq x)$ is the CDF, $f_X = dF_X/dx$ is the PDF, and $P(a < X \leq b) = F_X(b) - F_X(a) = \int_a^b f_X\,dx$. The density is a probability per unit of $X$, not a probability, and may exceed one. A function $Y = g(X)$ has density $f_Y(y) = f_X(g^{-1}(y))\,|d g^{-1}/dy|$; for $Y = aX + b$ this is $f_X((y - b)/a)/|a|$.
:::

::: note
Discrete and continuous variables can be handled with one notation by allowing the CDF to have both jumps and ramps. A range sensor that returns a valid reading $90\%$ of the time and a fixed sentinel value otherwise has a mixed distribution: a continuous ramp carrying $0.9$ of the probability plus a jump of $0.1$ at the sentinel. Filters that ignore the jump treat the sentinel as a real range and diverge; the mixture must be modelled, usually by a validity test before the measurement is used.
:::

## Check yourself

::: check
A random variable has density $f_X(x) = c\,x$ on $[0, 2]$ and zero elsewhere. Find $c$, the CDF, the median and $P(X > 1.5)$.
:::

::: answer
Normalisation requires $\int_0^2 c\,x\,dx = 2c = 1$, so $c = 1/2$. Integrating, $F_X(x) = x^2/4$ on $[0, 2]$. The median solves $x^2/4 = 0.5$, giving $x = \sqrt{2} = 1.41$. Finally $P(X > 1.5) = 1 - F_X(1.5) = 1 - 2.25/4 = 0.4375$. Note that the density reaches $f_X(2) = 1$ at the right end; that is fine, the area is what must equal one.
:::

::: check
Field data show that a certain actuator survives $1000\,\mathrm{h}$ of operation with probability $0.90$. Assuming exponential failures, find $\lambda$, the MTBF and the probability of surviving $5000\,\mathrm{h}$.
:::

::: answer
$P(T > 1000) = e^{-1000\lambda} = 0.90$, so $\lambda = -\ln(0.90)/1000 = 1.05 \times 10^{-4}\,\mathrm{h^{-1}}$ and the MTBF is $1/\lambda = 9490\,\mathrm{h}$. Then $P(T > 5000) = e^{-5000\lambda} = 0.90^{5} = 0.590$, because five independent $1000\,\mathrm{h}$ stretches must each be survived and the exponential is memoryless.
:::

::: check
A star tracker loses lock on average $0.2$ times per hour, and losses are independent and rare enough to be Poisson. Over a $3\,\mathrm{h}$ observation arc, what is the probability of no loss of lock, and of two or more?
:::

::: answer
The expected count is $\lambda t = 0.6$. $P(N = 0) = e^{-0.6} = 0.549$ and $P(N = 1) = 0.6\,e^{-0.6} = 0.329$, so $P(N \geq 2) = 1 - 0.549 - 0.329 = 0.122$. About one arc in eight will see at least two dropouts, which is the number the attitude filter's reacquisition logic must be designed for.
:::

::: check
$U$ is uniform on $[0, 1]$ and $T = -\ln(U)/\lambda$. Use the change-of-variables formula to show that $T$ is exponential with rate $\lambda$.
:::

::: answer
The map $t = g(u) = -\ln(u)/\lambda$ is strictly decreasing on $(0, 1]$ with inverse $u = g^{-1}(t) = e^{-\lambda t}$ and derivative $d g^{-1}/dt = -\lambda e^{-\lambda t}$. Since $f_U = 1$ on $[0, 1]$, the formula gives $f_T(t) = 1 \times |{-\lambda e^{-\lambda t}}| = \lambda e^{-\lambda t}$ for $t \geq 0$, which is the exponential density. Equivalently, $P(T \leq t) = P(U \geq e^{-\lambda t}) = 1 - e^{-\lambda t}$.
:::

::: check
A laser rangefinder reports range with a resolution of $1\,\mathrm{cm}$, rounding to the nearest centimetre. Write the density of the rounding error and find the probability that its magnitude exceeds $2\,\mathrm{mm}$. What physical assumption makes the uniform model appropriate?
:::

::: answer
The error is uniform on $[-5, 5]\,\mathrm{mm}$ with density $f_E(e) = 1/(10\,\mathrm{mm}) = 0.1\,\mathrm{mm^{-1}}$. The probability that $|E| > 2\,\mathrm{mm}$ is the area of the two outer strips: $2 \times 3\,\mathrm{mm} \times 0.1\,\mathrm{mm^{-1}} = 0.6$. The uniform model requires the true range to vary by many centimetres between readings relative to the rounding grid, so that where it falls within a cell is effectively random; for a static target the error is a fixed offset, not a random variable at all.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $X : \Omega \to \mathbb{R}$ | Random variable: a number attached to each outcome; $x$ is a realisation |
| $p_X(x) = P(X = x)$ | Probability mass function of a discrete variable |
| $\binom{n}{k}p^k(1-p)^{n-k}$ | Binomial: successes in $n$ independent trials |
| $(\lambda t)^k e^{-\lambda t}/k!$ | Poisson: counts at constant rate $\lambda$ over time $t$ |
| $F_X(x) = P(X \leq x)$ | Cumulative distribution function, valid for any variable |
| $f_X = dF_X/dx$ | Probability density, units of $1/X$; area over an interval is probability |
| $1/(b-a)$ on $[a,b]$ | Uniform density, e.g. quantisation error with $\Delta = b - a$ |
| $\lambda e^{-\lambda t}$ | Exponential density; mean $1/\lambda$ (MTBF); memoryless |
| $Q(u) = F_X^{-1}(u)$ | Quantile function; $Q(U)$ with $U$ uniform samples $F_X$ |
| $f_Y(y) = f_X(g^{-1}(y))\,\lvert dg^{-1}/dy \rvert$ | Change of variables for $Y = g(X)$ |
| $f_{XY}$, $f_X = \int f_{XY}\,dy$, $f_{Y\mid X} = f_{XY}/f_X$ | Joint, marginal and conditional densities |

The next lesson compresses a distribution into a few numbers, the expectation, the variance and the higher moments, and shows how the sample mean and sample variance estimate them from data.
