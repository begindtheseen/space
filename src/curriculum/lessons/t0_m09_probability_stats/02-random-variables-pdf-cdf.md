---
id: l02-random-variables-pdf-cdf
title: Random variables, PDF and CDF
minutes: 23
covers:
  - random variables, PDF and CDF
---

The last lesson was about events: things that either happen or do not. Most of what a GNC engineer measures is not like that. A range reading is a number. An attitude error is three numbers. A touchdown point is a pair of coordinates on a map. To ask "what is the chance the landing misses its target zone?" or "what is the chance the gyro's error goes over this limit?", you need to attach probabilities to *numbers*, not only to yes-or-no outcomes. That is what a random variable and its distribution do.

The **distribution** of a noisy quantity is its complete description: which values it can take and how likely each is. A sensor datasheet that quotes a noise figure is quoting one number that sums up a distribution. A requirement that says "the 99th-percentile miss distance shall be below $50\,\mathrm{m}$" is a statement about a distribution's far edge. A Monte Carlo campaign is an attempt to sample a distribution nobody can write down.

Two functions carry the description. The **cumulative distribution function** answers "what is the chance the value is at most this much?". The **probability density function** shows where the probability is piled up. You will use both in every later lesson.

## From outcomes to numbers

Think of a basketball game. The game itself — every pass, every shot — is the outcome. The scoreboard reads a number off it. The game is unpredictable, but the rule for reading the scoreboard is not.

A **[[random variable|not-random-not-variable]]** works the same way. It is a rule that assigns a real number to every outcome in the sample space, written $X : \Omega \to \mathbb{R}$ (read "X maps omega to the real numbers"). The randomness lives in the outcome. The variable is a fixed rule for reading a number off it. When a range sensor fires, the outcome is "everything that happened inside the sensor during that measurement", and $X$ is the number it sends out.

Two habits of notation. A capital letter ($X$) is the random variable; a lower-case letter ($x$) is a particular value it might take. So $P(X \leq x)$ is "the chance that the reading comes out at or below the number $x$". A value actually observed is called a **realisation** or a **sample**.

Random variables come in two kinds:

- A **discrete** random variable takes separate, countable values: the number of failed thrusters, the number of GNSS satellites in view, the number of Monte Carlo runs that break a requirement.
- A **continuous** random variable can take any value in a range: a distance, a turning rate, a miss distance.

The two kinds are described a little differently. The discrete kind is easier, so it comes first.

## Discrete random variables and the probability mass function

Roll two dice and add them. The total can be anything from $2$ to $12$, and some totals are more likely than others — $7$ comes up most. A bar chart with one bar per total, each bar as tall as that total's chance, describes the whole thing.

That bar chart is the **probability mass function** (PMF), $p_X(x) = P(X = x)$: the chance of each possible value. The bars are never negative and their heights add up to one. Three discrete distributions turn up again and again in GNC work.

**Bernoulli.** The simplest: $1$ with probability $p$, $0$ with probability $1 - p$. It is a yes-or-no event turned into a number — this run failed, this thruster did not ignite, this sample landed outside the zone.

**Binomial.** Run $n$ independent Bernoulli trials, each with the same $p$, and count the successes $K$:

$$
P(K = k) = \binom{n}{k}\,p^{k}\,(1 - p)^{n - k}, \qquad k = 0, 1, \ldots, n.
$$

Read it in two parts. The power terms give the chance of any *one particular* arrangement — say the first $k$ trials succeed and the rest fail — by multiplying independent chances. The **[[binomial coefficient|n-choose-k]]** $\binom{n}{k} = n!/(k!\,(n-k)!)$, read "n choose k", counts how many such arrangements there are. (The $!$ is **factorial**: $4! = 4 \times 3 \times 2 \times 1 = 24$.) The number of failures in a batch of $n$ Monte Carlo runs is binomial, which is why this distribution decides how many runs you need.

**Poisson.** Count events that happen at a steady average rate $\lambda$ ("lambda", events per unit time) over a stretch of time $t$, with no memory between events:

$$
P(N = k) = \frac{(\lambda t)^{k}}{k!}\,e^{-\lambda t}, \qquad k = 0, 1, 2, \ldots
$$

Star-tracker dropouts per hour, radiation upsets in a memory chip, micrometeoroid hits per orbit: whenever events are rare, independent and arrive at a steady rate, the count is **[[Poisson|poisson-story]]**. It is also what the binomial becomes when $n$ is large and $p$ is small with $np = \lambda t$ held fixed.

::: example How many failures should a Monte Carlo batch show?
Suppose a design truly breaks a requirement on $5\%$ of trajectories, and you run $n = 20$ independent Monte Carlo cases. The number of failing runs is binomial with $n = 20$ and $p = 0.05$.

**No failures at all:** every run must pass, each with chance $0.95$:

$$
P(K = 0) = 0.95^{20} = 0.358.
$$

**Exactly one:** there are $\binom{20}{1} = 20$ places the failure could be, and each arrangement has chance $0.05 \times 0.95^{19}$:

$$
P(K = 1) = 20 \times 0.05 \times 0.95^{19} = 0.377.
$$

**Two or more:** everything else, $1 - 0.358 - 0.377 = 0.264$.

So more than a third of the time, a design that fails one case in twenty sails through a batch of twenty untouched. Twenty clean runs are weak evidence. The Monte Carlo lesson turns this into a sizing rule.
:::

## The cumulative distribution function

Picture the kids in a class lined up by height. Point at any height — say $150\,\mathrm{cm}$ — and ask: what fraction of the class is that tall or shorter? As your chosen height rises, the fraction can only go up, from zero (shorter than everyone) to one (taller than everyone).

That running fraction is the **cumulative distribution function** (CDF). For any random variable, discrete or continuous,

$$
F_X(x) = P(X \leq x).
$$

Read $F_X(x)$ as "F sub X of x". It is defined for every real number $x$, and three properties follow straight from the rules of probability:

- It never goes down as $x$ grows, because "at most $a$" is contained in "at most $b$" when $a \leq b$.
- It starts at $0$ far to the left and ends at $1$ far to the right: $F_X(-\infty) = 0$, $F_X(+\infty) = 1$.
- The chance of landing in an interval is a difference of two values:

$$
P(a < X \leq b) = F_X(b) - F_X(a).
$$

For a discrete variable the CDF is a **[[staircase|cdf-staircase]]**: flat between the possible values, jumping up by $p_X(x)$ at each one. For a continuous variable it is a ramp with no jumps at all — and that has a surprising consequence. The chance that $X$ equals any single exact value is zero, because there is no jump there to give it any probability.

That is not a paradox. A range sensor with perfectly fine resolution never returns *exactly* $1000.000000\ldots\,\mathrm{m}$. Probability sits on intervals, not on points. So for a continuous variable, $P(a < X \leq b)$ and $P(a \leq X \leq b)$ are the same number.

## The probability density function

Imagine pouring exactly one kilogram of sand along a ruler. Some places get a tall pile, others a thin layer. The height of the pile at any spot is not an amount of sand — a single point holds none. But the sand *between* two marks is a definite amount, and it is bigger where the pile is taller.

For a continuous random variable, the pile of sand is the **probability density function** (PDF). It is the slope of the CDF:

$$
f_X(x) = \frac{dF_X}{dx}, \qquad F_X(x) = \int_{-\infty}^{x} f_X(u)\,du.
$$

The density is *probability per unit length of $X$*. Over a tiny interval of width $dx$,

$$
P(x < X \leq x + dx) \approx f_X(x)\,dx,
$$

and over any interval the probability is the **[[area under the density|area-is-probability]]**:

$$
P(a < X \leq b) = \int_{a}^{b} f_X(x)\,dx.
$$

A density must never be negative, and its total area must be one — all the sand is somewhere. But the density is not itself a probability, and it can be bigger than one. If $X$ is a range error in metres, $f_X$ has units of $\mathrm{m^{-1}}$ ("per metre"). An error spread evenly over a band only $1\,\mathrm{mm}$ wide has a density of $1000\,\mathrm{m^{-1}}$ across that band. That is perfectly fine, because the area — $1000\,\mathrm{m^{-1}} \times 0.001\,\mathrm{m}$ — is still one.

::: warning A density is not a probability
$f_X(0.3) = 2.5$ does *not* mean "the chance that $X = 0.3$ is $2.5$" — that chance is zero for any continuous variable. It is a chance *per unit of $X$*, and it carries the units of one over $X$. Comparing densities of variables measured in different units, or reading a tall peak as a big probability without multiplying by a width, are both mistakes that turn up in real analyses.
:::

Two continuous distributions are worth knowing now. The Gaussian, the most important of all, gets lessons of its own.

### The uniform distribution

The **uniform** distribution on $[a, b]$ spreads the sand in a perfectly flat layer:

$$
f_X(x) = \begin{cases} \dfrac{1}{b - a} & a \leq x \leq b, \\[6pt] 0 & \text{otherwise,} \end{cases}
\qquad
F_X(x) = \frac{x - a}{b - a} \quad \text{for } a \leq x \leq b.
$$

The height $1/(b - a)$ is whatever makes the area of the rectangle one. The uniform is the honest model when all you know about a quantity is its limits. It is also the exact model for the rounding error of an **[[analogue-to-digital converter|adc]]**.

### The exponential distribution

The **exponential** distribution with rate $\lambda$ describes how long you wait for the first event of a Poisson process — the first dropout, the first failure:

$$
f_T(t) = \lambda e^{-\lambda t}, \qquad F_T(t) = 1 - e^{-\lambda t}, \qquad t \geq 0.
$$

The average wait is $1/\lambda$. In reliability work that average is the **mean time between failures** (MTBF).

The exponential has a strange property: it is **memoryless**. Picture a light bulb that never ages — an old one is exactly as good as a new one. The chance of surviving a further time $s$, given that it has already survived to time $t$, is

$$
P(T > t + s \mid T > t) = \frac{P(T > t + s)}{P(T > t)} = \frac{e^{-\lambda (t + s)}}{e^{-\lambda t}} = e^{-\lambda s},
$$

which is the same as the chance of surviving $s$ from brand new. (The first step is conditional probability: surviving past $t + s$ already includes surviving past $t$.) That is a strong physical claim. It is right for random electronic failures and wrong for parts that **[[wear out|bathtub]]**, like bearings.

::: example Rounding error of a converter
A 12-bit converter turns a sensor voltage between $-10\,\mathrm{V}$ and $+10\,\mathrm{V}$ into a whole number. Twelve bits give $2^{12} = 4096$ levels spread over a $20\,\mathrm{V}$ span, so the step between levels is

$$
\Delta = \frac{20\,\mathrm{V}}{4096} = 4.88\,\mathrm{mV}.
$$

The converter rounds to the nearest level. If the input wanders across many steps, the rounding error $E$ is uniform on $[-\Delta/2, \Delta/2]$, with density $f_E(e) = 1/\Delta = 1/(0.00488\,\mathrm{V}) = 205\,\mathrm{V^{-1}}$.

What is the chance the error is bigger than $1\,\mathrm{mV}$ either way? The band $[-1, 1]\,\mathrm{mV}$ is $2\,\mathrm{mV}$ wide, so it holds a fraction $2/4.88$ of the total. The rest lies outside:

$$
P(|E| > 1\,\mathrm{mV}) = 1 - \frac{2\,\mathrm{mV}}{4.88\,\mathrm{mV}} = 1 - 0.410 = 0.590.
$$

For a $2\,\mathrm{mV}$ threshold the band is $4\,\mathrm{mV}$ wide: $1 - 4/4.88 = 0.181$. Sanity check: the wider band leaves less outside, as it should. And the density, $205$ per volt, is far bigger than one — nothing wrong with that.
:::

::: example Survival of a flight computer
A flight computer has an MTBF of $50\,000\,\mathrm{h}$, with random failures modelled as exponential, so $\lambda = 1/50\,000 = 2 \times 10^{-5}$ per hour.

**Surviving a $5000\,\mathrm{h}$ mission:**

$$
P(T > 5000) = 1 - F_T(5000) = e^{-5000/50\,000} = e^{-0.1} = 0.905.
$$

**The median life** — the time by which half of a big fleet would have failed — solves $F_T(t) = 0.5$, that is $e^{-\lambda t} = 0.5$. Taking logs, $t = \ln 2/\lambda = 0.693 \times 50\,000 = 34\,700\,\mathrm{h}$. That is well below the MTBF, because a few very long-lived units drag the average up: the distribution has a long right-hand tail.

**Memorylessness:** a unit that has already run $50\,000\,\mathrm{h}$ has exactly the same $0.905$ chance of surviving the next $5000\,\mathrm{h}$ as a fresh one. If experience says old units fail more often, the exponential model is wrong for them, and a model with wear-out, such as the Weibull distribution, is needed instead.
:::

## Quantiles and the inverse CDF

At a check-up, a doctor might say a child is "in the 90th percentile for height": $90\%$ of children that age are shorter. Requirements are often written the same way.

The **quantile function** runs the CDF backwards. $Q(u) = F_X^{-1}(u)$ is the value below which $X$ falls with probability $u$. The median is $Q(0.5)$. The 99th-percentile miss distance is $Q(0.99)$.

For the exponential, solve $1 - e^{-\lambda t} = u$ for $t$: $e^{-\lambda t} = 1 - u$, so

$$
Q(u) = -\frac{\ln(1 - u)}{\lambda}.
$$

For the flight computer above, the 95th percentile is $-\ln(0.05) \times 50\,000 = 150\,000\,\mathrm{h}$ and the 5th percentile is $-\ln(0.95) \times 50\,000 = 2560\,\mathrm{h}$. That is a very wide spread around the $34\,700\,\mathrm{h}$ median.

### Making any distribution from a uniform one

The quantile function has a second job. Computers are good at producing random numbers spread evenly between $0$ and $1$. Feed such a number $U$ into $Q$, and $X = Q(U)$ has exactly the CDF $F_X$:

$$
P(Q(U) \leq x) = P(U \leq F_X(x)) = F_X(x).
$$

The first step undoes $Q$ by applying $F_X$ to both sides (it never goes down, so the inequality keeps its direction). The second uses the fact that a uniform $U$ is below any number $c$ between $0$ and $1$ with chance exactly $c$.

This is **[[inverse-transform sampling|inverse-transform]]**: any random number generator that makes uniforms can make samples from any distribution whose quantile function you can compute. $T = -\ln(1 - U)/\lambda$ gives exponential waiting times — and since $1 - U$ is also uniform, $T = -\ln(U)/\lambda$ works too. The Monte Carlo lesson relies on this.

## Functions of a random variable

Often you know the distribution of one quantity and need the distribution of something computed from it: a range error in metres from a timing error in nanoseconds, or an energy from a speed.

Picture sand spread on a rubber band. Stretch part of the band to twice its length and the same sand now covers twice the length, so the layer is half as thick. Densities behave exactly like that.

Let $Y = g(X)$, where $g$ is a smooth function that only ever goes up (**strictly increasing**). Then "$Y \leq y$" and "$X \leq g^{-1}(y)$" are the same event — $g^{-1}$ is the inverse function, which undoes $g$. So

$$
F_Y(y) = F_X\!\left(g^{-1}(y)\right).
$$

Differentiate with the chain rule and you get the **change-of-variables formula**:

$$
f_Y(y) = f_X\!\left(g^{-1}(y)\right)\,\left|\frac{d\,g^{-1}(y)}{dy}\right|.
$$

The absolute value $|\cdot|$ covers a function that only goes *down*. Then the inequality flips, $F_Y(y) = 1 - F_X(g^{-1}(y))$, the derivative is negative, and the formula with the absolute value is still right. The derivative factor is the rubber band: where $g$ stretches the axis, the density thins out in proportion, so the total area stays one.

The straight-line case $Y = aX + b$, with $a \neq 0$, is the one you will use most. Here $g^{-1}(y) = (y - b)/a$ and its derivative is $1/a$:

$$
f_Y(y) = \frac{1}{|a|}\, f_X\!\left(\frac{y - b}{a}\right).
$$

A gyro error that is uniform in raw counts becomes a uniform error in $\mathrm{rad/s}$ after multiplying by the scale factor, with the density divided by that factor. This one formula is **[[the seed of a bigger result|det-bridge]]** in the lesson on linear transformations, where $1/|a|$ becomes $1/|\det \mathbf{A}|$.

## Two variables at once

A vehicle's state is never a single number, so these ideas must stretch to several random variables together. Think of the sand now spread over a table instead of a ruler: its height at each point $(x, y)$ is the **joint density** $f_{XY}(x, y)$. The chance that the pair lands in a region $R$ of the table is the volume of sand over that region:

$$
P\big((X, Y) \in R\big) = \iint_R f_{XY}(x, y)\,dx\,dy,
$$

and the total over the whole table is one. The double integral $\iint_R$ is read "the integral over the region $R$": chop $R$ into tiny patches of area $dx\,dy$, multiply each by the height of the sand there, and add them all up.

Sweep all the sand across the table onto the $x$ edge and you get the **marginal density** of $X$ alone:

$$
f_X(x) = \int_{-\infty}^{\infty} f_{XY}(x, y)\,dy.
$$

This is the law of total probability with integrals instead of sums.

Cut a thin slice through the sand at one value $x$, and rescale that slice so its area is one. That is the **conditional density** of $Y$ given $X = x$:

$$
f_{Y \mid X}(y \mid x) = \frac{f_{XY}(x, y)}{f_X(x)}.
$$

Two variables are **independent** when the joint density splits into a product, $f_{XY}(x, y) = f_X(x)\,f_Y(y)$. That is the same as saying every slice has the same shape, whatever $x$ you cut at. And Bayes' theorem for densities is last lesson's formula with densities in place of probabilities:

$$
f_{X \mid Y}(x \mid y) = \frac{f_{Y \mid X}(y \mid x)\,f_X(x)}{f_Y(y)}.
$$

Read it once more with the estimation names attached. $X$ is the state, $Y$ the measurement, $f_{Y \mid X}$ the sensor model (the likelihood), $f_X$ the prior, and $f_{X \mid Y}$ the posterior. Every navigation filter computes some approximation of this density.

::: key PDF and CDF
For a continuous random variable, $F_X(x) = P(X \leq x)$ is the CDF, $f_X = dF_X/dx$ is the PDF, and $P(a < X \leq b) = F_X(b) - F_X(a) = \int_a^b f_X\,dx$. The density is a probability per unit of $X$, not a probability, and may exceed one. A function $Y = g(X)$ has density $f_Y(y) = f_X(g^{-1}(y))\,|d g^{-1}/dy|$; for $Y = aX + b$ this is $f_X((y - b)/a)/|a|$.
:::

::: note Jumps and ramps together
One notation can handle both kinds of variable if the CDF is allowed both jumps and ramps. A range sensor that returns a real reading $90\%$ of the time, and a fixed "no reading" code number otherwise, has a mixed distribution: a smooth ramp carrying $0.9$ of the probability, plus a jump of $0.1$ at the code value. A filter that ignores the jump treats the code as a real range and goes badly wrong. The mixture has to be handled, usually by a validity check before the measurement is used.
:::

## Check yourself

::: check
A random variable has density $f_X(x) = c\,x$ on $[0, 2]$ and zero elsewhere. Find $c$, the CDF, the median and $P(X > 1.5)$.
:::

::: answer
The total area must be one: $\int_0^2 c\,x\,dx = c \cdot \frac{2^2}{2} = 2c = 1$, so $c = 1/2$.

The CDF is the area up to $x$: $F_X(x) = \int_0^x \frac{u}{2}\,du = x^2/4$ for $0 \leq x \leq 2$.

The median solves $x^2/4 = 0.5$, so $x^2 = 2$ and $x = \sqrt{2} = 1.41$.

Finally $P(X > 1.5) = 1 - F_X(1.5) = 1 - 2.25/4 = 0.4375$. Notice the density reaches $f_X(2) = 1$ at the right end. That is fine — only the area must equal one.
:::

::: check
Field data show an actuator survives $1000\,\mathrm{h}$ of running with probability $0.90$. Assuming exponential failures, find $\lambda$, the MTBF and the chance of surviving $5000\,\mathrm{h}$.
:::

::: answer
$P(T > 1000) = e^{-1000\lambda} = 0.90$. Take logs: $-1000\lambda = \ln 0.90$, so $\lambda = -\ln(0.90)/1000 = 1.05 \times 10^{-4}$ per hour, and the MTBF is $1/\lambda = 9490\,\mathrm{h}$.

Then $P(T > 5000) = e^{-5000\lambda} = (e^{-1000\lambda})^5 = 0.90^{5} = 0.590$. That makes sense: memorylessness means five back-to-back $1000\,\mathrm{h}$ stretches must each be survived, each with chance $0.90$.
:::

::: check
A star tracker loses lock on average $0.2$ times per hour, and losses are rare and independent enough to be Poisson. Over a $3\,\mathrm{h}$ observation arc, what is the chance of no loss of lock, and of two or more?
:::

::: answer
The expected count is $\lambda t = 0.2 \times 3 = 0.6$.

$P(N = 0) = e^{-0.6} = 0.549$ and $P(N = 1) = 0.6\,e^{-0.6} = 0.329$.

So $P(N \geq 2) = 1 - 0.549 - 0.329 = 0.122$. About one arc in eight sees at least two dropouts — the number the attitude filter's re-acquisition logic must be designed for.
:::

::: check
$U$ is uniform on $[0, 1]$ and $T = -\ln(U)/\lambda$. Use the change-of-variables formula to show that $T$ is exponential with rate $\lambda$.
:::

::: answer
The map $t = g(u) = -\ln(u)/\lambda$ only goes down on $(0, 1]$. Undo it: $\ln u = -\lambda t$, so $u = g^{-1}(t) = e^{-\lambda t}$, with derivative $d g^{-1}/dt = -\lambda e^{-\lambda t}$.

The uniform density is $f_U = 1$ on $[0, 1]$, so the formula gives

$$
f_T(t) = 1 \times \left|{-\lambda e^{-\lambda t}}\right| = \lambda e^{-\lambda t}, \qquad t \geq 0,
$$

which is the exponential density. A second way: $P(T \leq t) = P(U \geq e^{-\lambda t}) = 1 - e^{-\lambda t}$, the exponential CDF.
:::

::: check
A laser rangefinder rounds range to the nearest centimetre. Write the density of the rounding error and find the chance its size exceeds $2\,\mathrm{mm}$. What physical assumption makes the uniform model right?
:::

::: answer
Rounding to the nearest $10\,\mathrm{mm}$ leaves an error between $-5$ and $+5\,\mathrm{mm}$, uniform with density $f_E(e) = 1/(10\,\mathrm{mm}) = 0.1\,\mathrm{mm^{-1}}$.

$|E| > 2\,\mathrm{mm}$ means the two outer strips, $[-5, -2]$ and $[2, 5]$, each $3\,\mathrm{mm}$ wide. Their area is $2 \times 3\,\mathrm{mm} \times 0.1\,\mathrm{mm^{-1}} = 0.6$.

The uniform model needs the true range to change by many centimetres between readings, so where it lands inside a rounding cell is effectively random. For a target that does not move, the error is one fixed offset, not a random variable at all.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $X : \Omega \to \mathbb{R}$ | Random variable: a number attached to each outcome; $x$ is a realisation |
| $p_X(x) = P(X = x)$ | Probability mass function of a discrete variable |
| $\binom{n}{k}p^k(1-p)^{n-k}$ | Binomial: successes in $n$ independent trials |
| $(\lambda t)^k e^{-\lambda t}/k!$ | Poisson: counts at steady rate $\lambda$ over time $t$ |
| $F_X(x) = P(X \leq x)$ | Cumulative distribution function, for any variable |
| $f_X = dF_X/dx$ | Probability density, units of $1/X$; area over an interval is probability |
| $1/(b-a)$ on $[a,b]$ | Uniform density, e.g. rounding error with $\Delta = b - a$ |
| $\lambda e^{-\lambda t}$ | Exponential density; mean $1/\lambda$ (MTBF); memoryless |
| $Q(u) = F_X^{-1}(u)$ | Quantile function; $Q(U)$ with $U$ uniform samples $F_X$ |
| $f_Y(y) = f_X(g^{-1}(y))\,\lvert dg^{-1}/dy \rvert$ | Change of variables for $Y = g(X)$ |
| $f_{XY}$, $f_X = \int f_{XY}\,dy$, $f_{Y\mid X} = f_{XY}/f_X$ | Joint, marginal and conditional densities |

Next lesson: squeezing a whole distribution into a few numbers — the expectation, the variance and the higher moments — and estimating them from real data with the sample mean and sample variance.

::: context not-random-not-variable A name that fits badly
Mathematicians like to joke that a random variable is neither random nor a variable. It is a *function*: a fixed rule, like "read the scoreboard". The chance part comes from the outcome it is fed.

The name stuck because in practice you treat $X$ like an unknown number whose value will be revealed. That habit is fine, as long as you remember that the probabilities belong to the outcomes, and $X$ only carries them over onto the number line.
:::

::: context n-choose-k Counting the arrangements
How many ways can $2$ failures fall among $4$ runs? List them, writing F for fail and P for pass: FFPP, FPFP, FPPF, PFFP, PFPF, PPFF. Six ways, and the formula agrees:

$$
\binom{4}{2} = \frac{4!}{2!\,2!} = \frac{24}{2 \times 2} = 6.
$$

The $n!$ on top counts every way to order $n$ runs. Dividing by $k!$ and $(n-k)!$ removes orderings that only shuffle the failures among themselves, or the passes among themselves — they look identical.
:::

::: context poisson-story Horses and soldiers
The distribution is named after the French mathematician Siméon Denis Poisson, who described it in 1837. Its most famous early use came in 1898, when Ladislaus Bortkiewicz showed that the yearly number of Prussian cavalry soldiers killed by horse kicks followed it closely.

The recipe is the same today: many opportunities, each very unlikely, all independent. Swap horse kicks for radiation hits on a memory chip and the mathematics is unchanged.
:::

::: context cdf-staircase A staircase CDF
The CDF of the Monte Carlo example — failures in 20 runs with $p = 0.05$ — jumps at each whole number and is flat in between. Each step's height is the chance of that exact count.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="30" y1="25" x2="30" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="26" y1="30" x2="340" y2="30" stroke="#6c7a93" stroke-dasharray="3 3"/>
  <text x="22" y="34" font-size="11" fill="#1f2a44" text-anchor="end">1</text>
  <text x="22" y="174" font-size="11" fill="#1f2a44" text-anchor="end">0</text>
  <g stroke="#1d6fd1" stroke-width="3">
    <line x1="30" y1="170" x2="50" y2="170"/>
    <line x1="50" y1="119.8" x2="100" y2="119.8"/>
    <line x1="100" y1="67" x2="150" y2="67"/>
    <line x1="150" y1="40.6" x2="200" y2="40.6"/>
    <line x1="200" y1="32.2" x2="250" y2="32.2"/>
    <line x1="250" y1="30.4" x2="300" y2="30.4"/>
    <line x1="300" y1="30" x2="340" y2="30"/>
  </g>
  <g fill="#1d6fd1">
    <circle cx="50" cy="119.8" r="3.5"/><circle cx="100" cy="67" r="3.5"/><circle cx="150" cy="40.6" r="3.5"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="186">0</text><text x="100" y="186">1</text><text x="150" y="186">2</text>
    <text x="200" y="186">3</text><text x="250" y="186">4</text><text x="300" y="186">5</text>
    <text x="75" y="112">0.358</text><text x="125" y="60">0.736</text><text x="175" y="55">0.925</text>
  </g>
  <text x="330" y="160" font-size="11" fill="#6c7a93" text-anchor="end">failures k</text>
</svg>
```

The jump at $1$ is $0.7358 - 0.3585 = 0.377$, the chance of exactly one failure.
:::

::: context area-is-probability Probability is area
For the density $f_X(x) = x/2$ on $[0, 2]$ from the first Check-yourself question, the chance that $X > 1.5$ is the shaded area under the line.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <polygon points="250,170 250,72.5 320,40 320,170" fill="#8fb8f0" stroke="none"/>
  <line x1="40" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="30" x2="40" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="170" x2="320" y2="40" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="320" y1="40" x2="320" y2="170" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="36" y1="40" x2="320" y2="40" stroke="#6c7a93" stroke-dasharray="3 3"/>
  <text x="32" y="44" font-size="11" fill="#1f2a44" text-anchor="end">1</text>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="186">0</text><text x="180" y="186">1</text><text x="250" y="186">1.5</text><text x="320" y="186">2</text>
  </g>
  <text x="285" y="140" font-size="12" fill="#1f2a44" text-anchor="middle">0.4375</text>
  <text x="130" y="110" font-size="12" fill="#1d6fd1" text-anchor="middle">f(x) = x/2</text>
</svg>
```

The shape is a trapezoid, so you can check without calculus: width $0.5$ times the average height $(0.75 + 1)/2$ gives $0.4375$. The whole triangle has area $\frac{1}{2} \times 2 \times 1 = 1$, as a density must.
:::

::: context adc Turning voltages into numbers
An analogue-to-digital converter (ADC) is the chip that turns a smoothly varying voltage from a sensor into a whole number a computer can store. A 12-bit ADC can output $2^{12} = 4096$ different numbers, so it chops its voltage range into 4096 steps and reports which step the voltage is nearest.

Whatever falls between steps is lost — that lost bit is the rounding error. More bits mean smaller steps: a 16-bit converter on the same $\pm 10\,\mathrm{V}$ range has steps of about $0.305\,\mathrm{mV}$, sixteen times finer.
:::

::: context bathtub The bathtub curve
Plot how often a part fails at each age and you often get a bathtub shape. Early on, failures are high — manufacturing defects show up fast (engineers call this infant mortality, and they "burn in" electronics to weed it out). Then comes a long flat stretch where failures are rare and random. Finally wear-out sets in and failures climb again.

The exponential model describes only the flat bottom of the tub, where the failure rate is constant. The Weibull distribution, named after the Swedish engineer Waloddi Weibull, has a shape setting that can describe the falling, flat or rising parts.
:::

::: context inverse-transform Running the CDF backwards
Pick a uniform random number $u$ on the vertical axis, go across to the CDF curve, then drop straight down: the value you land on is a sample. Here the curve is the exponential CDF, with time in units of $1/\lambda$, and $u = 0.7$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="170" x2="345" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="22" x2="40" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="36" y1="30" x2="340" y2="30" stroke="#6c7a93" stroke-dasharray="3 3"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40.0,170.0 47.5,156.7 55.0,144.6 62.5,133.7 70.0,123.8 77.5,114.9 85.0,106.8 92.5,99.5 100.0,92.9 107.5,86.9 115.0,81.5 122.5,76.6 130.0,72.2 137.5,68.2 145.0,64.5 152.5,61.2 160.0,58.3 167.5,55.6 175.0,53.1 182.5,50.9 190.0,48.9 197.5,47.1 205.0,45.5 212.5,44.0 220.0,42.7 227.5,41.5 235.0,40.4 242.5,39.4 250.0,38.5 257.5,37.7 265.0,37.0 272.5,36.3 280.0,35.7 287.5,35.2 295.0,34.7 302.5,34.2 310.0,33.8 317.5,33.5 325.0,33.1 332.5,32.8 340.0,32.6"/>
  <line x1="40" y1="72" x2="130.3" y2="72" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="5 3"/>
  <line x1="130.3" y1="72" x2="130.3" y2="170" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="5 3"/>
  <circle cx="130.3" cy="72" r="3.5" fill="#b4232c"/>
  <text x="32" y="34" font-size="11" fill="#1f2a44" text-anchor="end">1</text>
  <text x="32" y="76" font-size="11" fill="#b4232c" text-anchor="end">0.7</text>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="186">0</text><text x="115" y="186">1</text><text x="190" y="186">2</text><text x="265" y="186">3</text><text x="340" y="186">4</text>
  </g>
  <text x="140" y="160" font-size="11" fill="#b4232c">t = 1.20</text>
</svg>
```

Here $Q(0.7) = -\ln(0.3) = 1.20$ (times $1/\lambda$). Uniform numbers pile up evenly on the vertical axis; where the curve is steep they land close together on the time axis, which is where the density is high.
:::

::: context det-bridge From one number to a matrix
Why $1/|a|$? The map $y = ax + b$ stretches every length on the number line by a factor $|a|$, so the sand must thin out by the same factor.

For a vector, $\mathbf{y} = \mathbf{A}\mathbf{x} + \mathbf{b}$ stretches areas (or volumes) by $|\det \mathbf{A}|$, the size of the determinant from the linear algebra module. So the density divides by $|\det \mathbf{A}|$ instead. That fact, in lesson 5, is what makes a Gaussian stay Gaussian when a navigation filter pushes it through the vehicle's equations of motion.
:::
