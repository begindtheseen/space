---
id: l06-sums-and-central-limit-theorem
title: Sums of random variables and the central limit theorem
minutes: 23
covers:
  - sums of random variables and the central limit theorem
---

Roll one die and every number from $1$ to $6$ is equally likely: the chart of chances is flat. Roll two and add them, and $7$ is suddenly the most common total while $2$ and $12$ are rare: the chart has a peak. Roll ten and add them, and the chart is a smooth hump — very nearly the bell curve of two lessons ago. Nobody put a bell into the dice. It came out of the adding.

An error budget is a sum. The touchdown error of a lander is a navigation error plus a guidance error plus a control error plus a map error. One second of accelerometer output is the sum of two hundred separate samples. A Monte Carlo estimate of a probability is a sum of a few thousand ones and zeros divided by the number of runs. Whenever you add random quantities, two questions come up: what are the mean and variance of the total, and what shape does its distribution have?

The first question was answered in the expectation lesson; this lesson restates the answer in the form used for budgets. The second has one of the most remarkable answers in mathematics. Add enough independent pieces, none of which dominates, and the sum is close to Gaussian whatever the pieces looked like. That is the **central limit theorem**, and it is why the Gaussian is a fair model for sensor noise, navigation error and most of what this course handles. This lesson states it, shows why it is true, and then spends real time on where it fails. The far tails — the rare, extreme outcomes — are exactly where a miss-distance or structural-load requirement lives, and exactly where the theorem is weakest.

## The mean and variance of a sum

For any random variables $X_1, \ldots, X_N$, however they depend on each other,

$$
\mathbb{E}\Big[\sum_{i=1}^{N} X_i\Big] = \sum_{i=1}^{N}\mathbb{E}[X_i], \qquad
\operatorname{Var}\Big(\sum_{i=1}^{N} X_i\Big) = \sum_{i=1}^{N}\operatorname{Var}(X_i) + 2\sum_{i<j}\operatorname{Cov}(X_i, X_j).
$$

The $\sum$ ("sigma", capital) means "add up". The first rule is linearity of expectation. The second comes from squaring the total deviation $\sum_i (X_i - \mu_i)$ and averaging. The square has $N$ squared terms, which average to the variances, and $N(N-1)$ cross terms. The cross terms pair up — $(i, j)$ with $(j, i)$ — and each pair averages to $2\operatorname{Cov}(X_i, X_j)$. That is why the second sum runs over $i < j$ only.

In vector form, using the previous lesson's language, $\operatorname{Cov}(\mathbf{x} + \mathbf{y}) = \mathbf{P}_x + \mathbf{P}_y + \mathbf{P}_{xy} + \mathbf{P}_{yx}$, where $\mathbf{P}_{xy} = \mathbb{E}[(\mathbf{x} - \boldsymbol{\mu}_x)(\mathbf{y} - \boldsymbol{\mu}_y)^{\mathsf{T}}]$ is the cross-covariance.

### Root-sum-square

When the pieces are **uncorrelated**, every cross term is zero and variances add. The standard deviations then combine as the square root of the sum of squares, called the **[[root-sum-square|rss-pythagoras]]**, or RSS:

$$
\sigma_{\text{total}} = \sqrt{\sigma_1^2 + \sigma_2^2 + \cdots + \sigma_N^2}.
$$

This is how independent error sources are budgeted. Two consequences are worth seeing early.

- **A small piece barely matters.** Add $\sigma_2 = 1$ to $\sigma_1 = 5$ and you get $\sqrt{25 + 1} = \sqrt{26} = 5.10$ — only $2\%$ more.
- **The total is less than the plain sum of the sigmas,** often much less, because independent errors partly cancel. One pushes left while another pushes right.

If the errors share a common cause, the covariance terms come back. Positive correlation pushes the total up toward the plain sum; negative correlation pushes it below the RSS. The correlated accelerometers of the expectation lesson were a case of the first.

::: example A touchdown error budget
A lander's cross-range touchdown error has three independent sources: navigation, $\sigma = 12\,\mathrm{m}$; guidance scatter, $\sigma = 5\,\mathrm{m}$; and lining up the terrain map, $\sigma = 9\,\mathrm{m}$.

Square each, add, take the root:

$$
\sigma_{\text{total}} = \sqrt{12^2 + 5^2 + 9^2} = \sqrt{144 + 25 + 81} = \sqrt{250} = 15.8\,\mathrm{m}.
$$

Sanity check: the total is bigger than the largest piece ($12\,\mathrm{m}$) and smaller than the plain sum ($12 + 5 + 9 = 26\,\mathrm{m}$), as an RSS always is. Adding the sigmas straight would overstate the error by $64\%$ and could drive a redesign nobody needs.

Where should the effort go? Removing the guidance term *completely* only brings the total to $\sqrt{144 + 81} = \sqrt{225} = 15.0\,\mathrm{m}$. Halving the navigation term to $6\,\mathrm{m}$ brings it to $\sqrt{36 + 25 + 81} = 11.9\,\mathrm{m}$. An RSS budget tells you to work on the biggest term, almost only.
:::

::: warning RSS needs independence
RSS is a statement about the variances of *uncorrelated* pieces. It says nothing about the shape of the total, and it is wrong whenever pieces share a cause. Two error terms that both grow with the same crooked mounting angle are not independent, and their sigmas add nearly straight. For every pair in a budget, ask whether one physical cause could move both.
:::

## The shape of a sum: convolution

Mean and variance do not settle the shape. For that we need the whole density of the sum.

Take two independent continuous variables $X$ and $Y$ with densities $f_X$ and $f_Y$, and let $S = X + Y$. The sum equals $s$ when $X$ takes some value $x$ and $Y$ takes exactly $s - x$. Add up the chances over every possible $x$:

$$
f_S(s) = \int_{-\infty}^{\infty} f_X(x)\,f_Y(s - x)\,dx.
$$

This is the **[[convolution|convolution-picture]]** of the two densities, written $f_S = f_X * f_Y$. Independence is what lets the joint density be the product $f_X(x)f_Y(s - x)$. For whole-number variables like dice, the integral becomes a sum over the values of $X$.

Watch the shape change. A variable uniform on $[0, 1]$ has a flat, box-shaped density. Add two of them and the sum has a triangle-shaped density:

$$
f_S(s) = \begin{cases} s, & 0 \leq s \leq 1, \\ 2 - s, & 1 \leq s \leq 2. \end{cases}
$$

The reason: the convolution integral of a box against a sliding box is the length of their overlap, which grows and then shrinks. Add a third uniform and the triangle convolved with a box is made of curved (quadratic) pieces, already rounded at the top. Each convolution smooths it further, and by twelve terms it looks, to the eye, like a bell. That is the central limit theorem at work. The sum of $n$ uniforms has a name, the **Irwin–Hall distribution**, and its CDF has an exact formula that we will use below to test how good the bell really is.

## Adding Gaussians gives a Gaussian

For one family, convolution never changes the shape. The cleanest proof uses a tool called the **[[moment generating function|mgf-name]]** (MGF):

$$
M_X(t) = \mathbb{E}[e^{tX}].
$$

It packs the whole distribution into one function of a helper variable $t$.

**The MGF of a Gaussian.** For $X \sim \mathcal{N}(\mu, \sigma^2)$, substitute $x = \mu + \sigma z$, so that $z$ is standard normal with density $\phi(z)$:

$$
M_X(t) = \int e^{tx}\,\frac{e^{-(x-\mu)^2/2\sigma^2}}{\sigma\sqrt{2\pi}}\,dx
= e^{t\mu}\int e^{t\sigma z}\,\phi(z)\,dz
= e^{t\mu}\int \frac{e^{-(z - t\sigma)^2/2}}{\sqrt{2\pi}}\,e^{t^2\sigma^2/2}\,dz
= \exp\!\Big(\mu t + \tfrac{1}{2}\sigma^2 t^2\Big).
$$

The third step completes the square: $t\sigma z - z^2/2 = -(z - t\sigma)^2/2 + t^2\sigma^2/2$. What is left inside the integral is a standard normal density slid over by $t\sigma$, whose area is one.

**The key property.** For independent $X$ and $Y$,

$$
M_{X+Y}(t) = \mathbb{E}[e^{tX}e^{tY}] = M_X(t)\,M_Y(t),
$$

because the average of a product of independent variables splits into the product of their averages. So the messy convolution becomes a plain multiplication.

Multiply two Gaussian MGFs and the exponents add: $\exp\big((\mu_X + \mu_Y)t + \tfrac{1}{2}(\sigma_X^2 + \sigma_Y^2)t^2\big)$. That is the MGF of $\mathcal{N}(\mu_X + \mu_Y, \sigma_X^2 + \sigma_Y^2)$. An MGF pins down its distribution, so the sum is Gaussian.

::: key
The sum of independent Gaussians is Gaussian, with means and variances added: $\mathcal{N}(\mu_1, \sigma_1^2) + \mathcal{N}(\mu_2, \sigma_2^2) = \mathcal{N}(\mu_1 + \mu_2, \sigma_1^2 + \sigma_2^2)$. A $3\,\mathrm{m}$ and a $4\,\mathrm{m}$ independent Gaussian error add to a $5\,\mathrm{m}$ Gaussian error. Together with the previous lesson, this means a linear filter fed Gaussian inputs stays Gaussian forever.
:::

## The law of large numbers

Taste one spoonful of soup and you know roughly how salty the pot is. Taste a hundred spoonfuls from all over the pot, average your impressions, and you know it very well. Averaging many independent samples homes in on the truth.

To make that precise, let $X_1, \ldots, X_N$ be **i.i.d.** — independent and identically distributed: separate draws from the same distribution, with mean $\mu$ and variance $\sigma^2$. Their sample mean is $\bar{X}_N = \tfrac{1}{N}\sum_i X_i$ ("X bar"). From the sum rules, $\mathbb{E}[\bar{X}_N] = \mu$ and $\operatorname{Var}(\bar{X}_N) = \sigma^2/N$. Chebyshev's inequality from the expectation lesson then says, for any small margin $\varepsilon > 0$ ("epsilon"),

$$
P\big(|\bar{X}_N - \mu| \geq \varepsilon\big) \leq \frac{\sigma^2}{N\varepsilon^2} \to 0 \quad\text{as } N \to \infty.
$$

This is the **[[weak law of large numbers|lln-history]]**: the chance that the sample mean misses the true mean by more than $\varepsilon$ shrinks to zero as $N$ grows. It is the reason every Monte Carlo estimate works, and the reason you can calibrate a bias by averaging.

It says nothing about the *shape* of the misses, and Chebyshev's bound is loose. Suppose you want to be $99\%$ sure that $\bar{X}_N$ is within $0.1\sigma$ of $\mu$.

- Chebyshev needs $\sigma^2/(N \times 0.01\sigma^2) \leq 0.01$, so $N \geq 1/(0.01 \times 0.01) = 10\,000$.
- If the misses are Gaussian, you need $0.1\sqrt{N} \geq 2.576$ (the $99\%$ multiplier), so $N \geq 664$.

Knowing the shape is worth a factor of fifteen in sample count. That is why the next theorem matters.

## The central limit theorem

> **Central limit theorem.** Let $X_1, X_2, \ldots$ be i.i.d. with mean $\mu$ and finite variance $\sigma^2$, and let $S_N = \sum_{i=1}^{N} X_i$. Then the standardised sum
> $$
> Z_N = \frac{S_N - N\mu}{\sigma\sqrt{N}}
> $$
> converges in distribution to $\mathcal{N}(0, 1)$: for every $z$, $P(Z_N \leq z) \to \Phi(z)$ as $N \to \infty$.

Read $Z_N$ as "the sum, measured in sigmas from where you would expect it". The sum of $N$ pieces has mean $N\mu$ and standard deviation $\sigma\sqrt{N}$, so subtracting and dividing puts it on the standard scale.

Put another way: for large $N$, the sum $S_N$ is approximately $\mathcal{N}(N\mu, N\sigma^2)$, and the average $\bar{X}_N$ is approximately $\mathcal{N}(\mu, \sigma^2/N)$. The pieces can be uniform, exponential, coin flips — anything with a finite variance. The Gaussian comes out of the act of adding, as it did with the dice.

::: note Why it has to be true
Standardise each piece: $Y_i = (X_i - \mu)/\sigma$ has mean $0$ and variance $1$, and $Z_N = \tfrac{1}{\sqrt{N}}\sum_i Y_i$. By independence the MGFs multiply:

$$
M_{Z_N}(t) = \big[M_Y(t/\sqrt{N})\big]^N.
$$

Expand $M_Y$ near zero with a Taylor series. Because $\mathbb{E}[Y] = 0$ and $\mathbb{E}[Y^2] = 1$,

$$
M_Y(s) = \mathbb{E}[e^{sY}] = 1 + s\,\mathbb{E}[Y] + \tfrac{1}{2}s^2\,\mathbb{E}[Y^2] + O(s^3) = 1 + \tfrac{1}{2}s^2 + O(s^3).
$$

Here $O(s^3)$ means "terms no bigger than a constant times $s^3$". Put $s = t/\sqrt{N}$ and take the logarithm, using $\log(1 + u) \approx u$ for small $u$:

$$
\log M_{Z_N}(t) = N\log\!\Big(1 + \frac{t^2}{2N} + O(N^{-3/2})\Big) = N\Big(\frac{t^2}{2N} + O(N^{-3/2})\Big) \to \frac{t^2}{2}.
$$

And $e^{t^2/2}$ is the MGF of the standard normal. Every detail of the original distribution beyond its mean and variance lives in the $O(N^{-3/2})$ term, and even $N$ copies of it vanish as $N$ grows. That is the whole mechanism: third and higher moments are squashed by powers of $1/\sqrt{N}$. (A fully rigorous proof uses $\mathbb{E}[e^{itX}]$, the characteristic function, which exists even when the MGF does not. The algebra is the same.)
:::

The theorem has a **[[long history|clt-history]]**, but the result you need is in the box.

::: key
The central limit theorem: the normalised sum $(S_N - N\mu)/(\sigma\sqrt{N})$ of $N$ i.i.d. random variables with finite variance converges to $\mathcal{N}(0, 1)$. The caveat for GNC: it converges fastest in the centre of the distribution and slowest in the far tails, so it says nothing useful about the $10^{-4}$-probability events where miss-distance and load requirements live.
:::

## How fast, and where, does it converge?

The proof shows the leading corrections. If one piece has skewness $\gamma_1$ ("gamma one") and kurtosis $\kappa$ ("kappa"), the standardised sum has skewness $\gamma_1/\sqrt{N}$ and excess kurtosis $(\kappa - 3)/N$. Lopsidedness dies off as $1/\sqrt{N}$; extra tail weight as $1/N$. Exponential pieces have skewness $2$, so even a sum of $N = 100$ still has skewness $2/\sqrt{100} = 0.2$ — plainly visible in a histogram.

The **Berry–Esseen theorem** puts a number on the worst-case error:

$$
\sup_z \big|P(Z_N \leq z) - \Phi(z)\big| \leq \frac{0.4748\,\rho}{\sigma^3\sqrt{N}}, \qquad \rho = \mathbb{E}|X - \mu|^3.
$$

($\sup_z$, "soup over z", means the largest value over all $z$.) It guarantees that the CDF error shrinks like $1/\sqrt{N}$. But it bounds the *absolute* error, and the absolute error is biggest in the centre. For a sum of twelve uniforms it allows an error of $0.178$ — hopelessly loose against the real error of a few thousandths near the mean.

The far tails are another matter. The honest way to see this is to compute an exact case.

::: example Twelve uniforms against the Gaussian
Let $S$ be the sum of **[[twelve independent|twelve-uniforms]]** $U(0, 1)$ variables (uniform on $0$ to $1$). Each has mean $\tfrac{1}{2}$ and variance $\tfrac{1}{12}$. So $S$ has mean $12 \times \tfrac{1}{2} = 6$ and variance $12 \times \tfrac{1}{12} = 1$: $S - 6$ is already standardised. The Irwin–Hall CDF gives the exact tails, which we can set against the Gaussian's:

| Threshold | $P(S - 6 > k)$ exact | $1 - \Phi(k)$ | Ratio |
| --- | --- | --- | --- |
| $k = 1$ | $0.1607$ | $0.1587$ | $1.01$ |
| $k = 2$ | $0.02228$ | $0.02275$ | $0.98$ |
| $k = 3$ | $1.007 \times 10^{-3}$ | $1.350 \times 10^{-3}$ | $0.75$ |
| $k = 4$ | $8.53 \times 10^{-6}$ | $3.17 \times 10^{-5}$ | $0.27$ |
| $k = 6$ | $0$ | $9.87 \times 10^{-10}$ | $0$ |

Within one sigma the match is better than $1\%$: $P(|S - 6| \leq 1) = 0.6785$ against the Gaussian's $0.6827$.

At three sigma the Gaussian overstates the tail by a third. At four sigma it is off by a factor of nearly four ($1/0.27 = 3.7$). And beyond six sigma the true chance is exactly zero — twelve numbers between $0$ and $1$ cannot add to more than $12$ — while the Gaussian still promises about one event in a billion.

The old trick of making "Gaussian" random numbers by adding twelve uniforms produces exactly this distribution. That is why it must never be used in a tail study: it can never produce the events you are looking for.
:::

The lesson of the table is general. As you move outward, the *relative* error of a Gaussian tail grows without limit, even while the absolute error shrinks. A sum of bounded pieces has a **[[hard edge|tail-ratio]]** the Gaussian knows nothing about. A sum of heavy-tailed pieces, such as exponentials, has far more probability in the tail than the Gaussian predicts.

::: example Ten exponential outages
A star tracker loses lock at random, and each outage lasts an exponentially distributed time with mean $1\,\mathrm{min}$ — so $\sigma = 1\,\mathrm{min}$ too. The total of ten independent outages has mean $10\,\mathrm{min}$ and standard deviation $\sqrt{10} = 3.16\,\mathrm{min}$.

A mission rule says the vehicle can go $10 + 3 \times 3.16 = 19.5\,\mathrm{min}$ in total without star fixes. A colleague argues from the central limit theorem that this "$3\sigma$" limit is broken with probability $0.135\%$ (the one-sided Gaussian tail beyond $3\sigma$).

The exact distribution of a sum of $N$ independent exponentials with rate $\lambda$ is the **Erlang** (or Gamma) distribution. Its tail is

$$
P(S > s) = e^{-\lambda s}\sum_{k=0}^{N-1}\frac{(\lambda s)^k}{k!}.
$$

With $s = 19.5$, $N = 10$ and $\lambda = 1$, this is $0.0067$ — five times the Gaussian figure. Ten strongly right-leaning pieces still add up to something with a long right tail: the skewness is $2/\sqrt{10} = 0.63$.

With a hundred outages, the same "$3\sigma$" line ($100 + 3 \times 10 = 130\,\mathrm{min}$) is crossed with probability $0.00275$, twice the Gaussian value. The theorem is converging, but slowly, and slowest in the tail.
:::

::: warning Three hidden conditions
"I.i.d. with finite variance" hides three conditions, and each one fails somewhere in GNC.

- **Finite variance.** The ratio of two zero-mean Gaussians has the **[[Cauchy distribution|cauchy]]**, whose variance is infinite. The mean of $N$ Cauchy samples has exactly the same distribution as one sample: averaging does nothing. A bearing computed as the arctangent of a noisy ratio near a bad geometry can behave this way.
- **Independence.** A common-cause error present in every piece does not average away, and the sum stays as non-Gaussian as that shared piece.
- **No dominant piece.** The theorem stretches to pieces that are not identical, as long as none of them controls the variance. But if one non-Gaussian piece supplies $90\%$ of the variance, the total is shaped like that piece, however many small Gaussian pieces you add.
:::

## Two uses you will meet right away

**Counting events.** A binomial count $K$ — the number of "successes" in $N$ independent tries with chance $p$ each — is a sum of $N$ zero-or-one (Bernoulli) variables. So for large $N$ it is approximately $\mathcal{N}(Np, Np(1 - p))$.

Take a Monte Carlo campaign of $N = 2000$ runs with a true failure chance $p = 0.01$. The expected count is $2000 \times 0.01 = 20$, with standard deviation $\sqrt{20 \times 0.99} = \sqrt{19.8} = 4.45$. The exact chance of seeing $30$ or more failures is $0.0213$. The normal approximation, with the usual half-step correction for a whole-number count, gives $1 - \Phi\big((29.5 - 20)/4.45\big) = 0.0164$. That is in the right neighbourhood but $23\%$ low, because the binomial leans right at this small $p$. Use the approximation to get your bearings, and the exact binomial for the decision.

**Averaging measurements.** The gyro bench test in the expectation lesson gave $s = 0.187\,^\circ/\mathrm{h}$ per one-second sample. Averaging $N = 100$ such samples estimates the bias with standard error $0.187/\sqrt{100} = 0.0187\,^\circ/\mathrm{h}$. By the central limit theorem, that estimate is very nearly Gaussian even if the single samples were not — which is what makes the confidence intervals of a later lesson legitimate. Averaging $10\,000$ samples brings the standard error to $0.00187\,^\circ/\mathrm{h}$, *if* the samples are independent. A slowly wandering bias breaks that assumption, and the random-process lessons that follow explain what happens then.

::: note Sums, not transforms
The central limit theorem is also why the Gaussian is the right *default* for sensor noise: electronic **[[noise|thermal-noise]]** is the sum of a vast number of tiny independent kicks from jiggling electrons. It is not a reason to assume a Gaussian for something produced by one nonlinear operation on a Gaussian — a range squared, a length, a product. Those are transformed, not summed, and the previous lesson's Jacobian is the tool for them.
:::

One more sum will matter soon. If $Z_1, \ldots, Z_k$ are independent standard normals, the sum of their *squares* is not Gaussian. Each $Z_i^2$ has mean $1$ and variance $2$ (because $\mathbb{E}[Z^4] = 3$, so $3 - 1^2 = 2$), so the sum has mean $k$ and variance $2k$. Its exact distribution is the chi-square with $k$ degrees of freedom — the one the Gaussian lesson used for ellipsoid containment, and the one that closes this module. For large $k$ the central limit theorem applies to it too: $\chi^2_k \approx \mathcal{N}(k, 2k)$.

## Check yourself

::: check
Four independent error sources have standard deviations $2$, $3$, $6$ and $1\,\mathrm{cm}$. What is the RSS total, and how much does removing the $1\,\mathrm{cm}$ source improve it?
:::

::: answer
$\sigma_{\text{total}} = \sqrt{4 + 9 + 36 + 1} = \sqrt{50} = 7.07\,\mathrm{cm}$.

Without the $1\,\mathrm{cm}$ term, $\sqrt{49} = 7.00\,\mathrm{cm}$: an improvement of $0.07\,\mathrm{cm}$, or $1\%$. The $6\,\mathrm{cm}$ term supplies $36/50 = 72\%$ of the variance and is the only one worth attacking.
:::

::: check
$X$ and $Y$ are independent, each uniform on $[0, 1]$. Use the convolution to find $P(X + Y > 1.5)$, then compare it with the Gaussian approximation that uses the exact mean and variance of the sum.
:::

::: answer
**Exact.** The sum's density is the triangle, equal to $2 - s$ on $[1, 2]$. The area of the small triangle from $1.5$ to $2$ is

$$
P(S > 1.5) = \int_{1.5}^{2}(2 - s)\,ds = \tfrac{1}{2}(0.5)^2 = 0.125.
$$

**Gaussian.** The sum has mean $\tfrac{1}{2} + \tfrac{1}{2} = 1$ and variance $\tfrac{1}{12} + \tfrac{1}{12} = \tfrac{1}{6}$, so $\sigma = 0.408$. Then $1.5$ is $0.5/0.408 = 1.22\sigma$ above the mean, and $1 - \Phi(1.225) = 0.110$.

With only two pieces the approximation is already within $12\%$ at this moderate distance. But at $s = 2$ the exact tail is zero, while the Gaussian gives $1 - \Phi(2.45) = 0.0071$.
:::

::: check
Two independent GNSS position errors along one axis are $\mathcal{N}(0.5, 2^2)$ and $\mathcal{N}(-0.2, 1.5^2)$, in metres. What is the distribution of their difference, and what is the chance the difference exceeds $5\,\mathrm{m}$?
:::

::: answer
The difference is Gaussian, since it is a linear mix of independent Gaussians. Its mean is $0.5 - (-0.2) = 0.7\,\mathrm{m}$. Its variance is $4 + 2.25 = 6.25\,\mathrm{m^2}$, so $\sigma = 2.5\,\mathrm{m}$. Subtracting adds variances in the same way adding does, because $\operatorname{Var}(-Y) = (-1)^2\operatorname{Var}(Y) = \operatorname{Var}(Y)$.

Then $P(D > 5) = 1 - \Phi\big((5 - 0.7)/2.5\big) = 1 - \Phi(1.72) = 0.0427$, about $4\%$.
:::

::: check
A Monte Carlo estimate of the mean of a quantity with $\sigma = 40\,\mathrm{m}$ must have a standard error below $1\,\mathrm{m}$. How many independent runs are needed, and what does the central limit theorem add to the law of large numbers here?
:::

::: answer
The standard error is $\sigma/\sqrt{N}$, so $40/\sqrt{N} \leq 1$ needs $\sqrt{N} \geq 40$, that is $N \geq 1600$ runs.

The law of large numbers only promises that the estimate homes in. The central limit theorem adds that, at this $N$, the estimate is approximately $\mathcal{N}(\mu, 1\,\mathrm{m^2})$. So you can say "the true mean is within $\pm 1.96\,\mathrm{m}$ of the estimate" with $95\%$ confidence. Chebyshev alone, with $k = 1.96$, could promise only $1 - 1/1.96^2 = 74\%$.
:::

::: check
A colleague wants to verify a $10^{-6}$ failure probability by adding up many independent error terms, citing the central limit theorem to justify a Gaussian tail, and reading $P(Z > 4.75)$ from a table. Give two separate reasons this is unsafe.
:::

::: answer
**First, the tail is where the theorem is weakest.** It controls the absolute error of the CDF, which is dominated by the centre. The *relative* error in the tail has no limit. The twelve-uniform example is already off by a factor of nearly four at $4\sigma$, and its true probability drops to zero not far beyond. A $10^{-6}$ event at $4.75\sigma$ is deep in the region where the approximation is out of control.

**Second, the conditions may fail.** If one term dominates the variance, or the terms share a common cause, the sum keeps the shape of that term. If any term has heavy tails, the true probability may be many times — even orders of magnitude — larger than the Gaussian's.

The defensible routes are an exact distribution where one exists, or a Monte Carlo or importance-sampling study of the tail itself.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\operatorname{Var}(\sum X_i) = \sum\operatorname{Var}(X_i) + 2\sum_{i<j}\operatorname{Cov}(X_i, X_j)$ | Variance of a sum, any dependence |
| $\sigma_{\text{total}} = \sqrt{\sum_i \sigma_i^2}$ | RSS: uncorrelated pieces only |
| $f_S = f_X * f_Y = \int f_X(x)f_Y(s - x)\,dx$ | Density of a sum of independent variables |
| $M_X(t) = \mathbb{E}[e^{tX}]$, $M_{X+Y} = M_X M_Y$ | Moment generating function; multiplies for independent sums |
| $M(t) = \exp(\mu t + \tfrac{1}{2}\sigma^2 t^2)$ | Gaussian MGF; sums of Gaussians are Gaussian |
| $P(\lvert\bar{X}_N - \mu\rvert \geq \varepsilon) \leq \sigma^2/(N\varepsilon^2)$ | Weak law of large numbers, via Chebyshev |
| $Z_N = (S_N - N\mu)/(\sigma\sqrt{N}) \to \mathcal{N}(0, 1)$ | Central limit theorem |
| Skewness $\gamma_1/\sqrt{N}$, excess kurtosis $(\kappa - 3)/N$ | How fast shape corrections fade |
| $\sup_z\lvert F_N(z) - \Phi(z)\rvert \leq 0.4748\,\rho/(\sigma^3\sqrt{N})$ | Berry–Esseen: absolute CDF error, dominated by the centre |
| $K \sim \operatorname{Bin}(N, p) \approx \mathcal{N}(Np, Np(1-p))$ | Normal approximation to a count |
| $\sum_{i=1}^{k} Z_i^2 \sim \chi^2_k$, mean $k$, variance $2k$ | Sum of squared standard normals (chi-square) |

Next lesson: from random numbers to random *processes* — quantities that wander in time, like a gyro's output. It introduces white noise, the random walk you get by adding up white noise, and Brownian motion, the smooth-time limit of a sum of many tiny independent steps.

::: context rss-pythagoras Errors add like the sides of a triangle
Two independent errors add the way two walks at right angles do. Walk $12\,\mathrm{m}$ east and $5\,\mathrm{m}$ north and you end up $13\,\mathrm{m}$ from the start, not $17$. That is Pythagoras: $\sqrt{12^2 + 5^2} = 13$. Independent errors are "at right angles" in the sense that one tells you nothing about the other.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="130" x2="256" y2="130" stroke="#1d6fd1" stroke-width="3"/>
  <line x1="256" y1="130" x2="256" y2="40" stroke="#f2b880" stroke-width="3"/>
  <line x1="40" y1="130" x2="256" y2="40" stroke="#b4232c" stroke-width="3"/>
  <polyline points="244,130 244,118 256,118" fill="none" stroke="#1f2a44" stroke-width="1"/>
  <text x="148" y="148" font-size="12" fill="#1d6fd1" text-anchor="middle">σ₁ = 12 m</text>
  <text x="264" y="90" font-size="12" fill="#1f2a44">σ₂ = 5 m</text>
  <text x="120" y="76" font-size="12" fill="#b4232c" text-anchor="middle">total = 13 m</text>
  <text x="264" y="150" font-size="11" fill="#6c7a93">straight sum: 17 m</text>
</svg>
```

With three or more independent errors the same rule holds in more dimensions, which is why the touchdown budget uses $\sqrt{12^2 + 5^2 + 9^2}$.
:::

::: context convolution-picture Box plus box makes a triangle
Slide one box across the other and record how much they overlap at each position. The overlap starts at zero, grows to a full box when they line up, then shrinks again. That record is the triangle — the density of the sum of two uniforms.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <line x1="15" y1="100" x2="85" y2="100" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="25" y="50" width="50" height="50" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <text x="25" y="116" font-size="11" fill="#1f2a44" text-anchor="middle">0</text>
  <text x="75" y="116" font-size="11" fill="#1f2a44" text-anchor="middle">1</text>
  <text x="100" y="80" font-size="20" fill="#1f2a44" text-anchor="middle">*</text>
  <line x1="115" y1="100" x2="185" y2="100" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="125" y="50" width="50" height="50" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <text x="125" y="116" font-size="11" fill="#1f2a44" text-anchor="middle">0</text>
  <text x="175" y="116" font-size="11" fill="#1f2a44" text-anchor="middle">1</text>
  <text x="203" y="80" font-size="20" fill="#1f2a44" text-anchor="middle">=</text>
  <line x1="218" y1="100" x2="338" y2="100" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="228,100 278,50 328,100" fill="#f2b880" stroke="#b4232c" stroke-width="2"/>
  <text x="228" y="116" font-size="11" fill="#1f2a44" text-anchor="middle">0</text>
  <text x="278" y="116" font-size="11" fill="#1f2a44" text-anchor="middle">1</text>
  <text x="328" y="116" font-size="11" fill="#1f2a44" text-anchor="middle">2</text>
  <text x="180" y="30" font-size="11" fill="#1f2a44" text-anchor="middle">same scale throughout: boxes of height 1, triangle peaks at 1</text>
</svg>
```
:::

::: context mgf-name Why "moment generating"?
Expand $e^{tX} = 1 + tX + \tfrac{1}{2}t^2X^2 + \tfrac{1}{6}t^3X^3 + \cdots$ and average term by term. The MGF becomes $1 + t\,\mathbb{E}[X] + \tfrac{1}{2}t^2\,\mathbb{E}[X^2] + \cdots$ — every moment of $X$, lined up in order. Take derivatives at $t = 0$ and out they come, one at a time: the first derivative gives the mean, the second gives $\mathbb{E}[X^2]$. The function "generates" the moments, which is where the name comes from.
:::

::: context lln-history Twenty years to prove it
Jacob Bernoulli, a Swiss mathematician, proved the first version of the law of large numbers for coin-flip-like trials, and said it took him twenty years of thought. It appeared in his book *Ars Conjectandi* ("The Art of Conjecturing"), published in 1713, after his death. Gamblers had long believed that long-run frequencies settle down; Bernoulli showed exactly why.
:::

::: context clt-history From coin tosses to a name
Abraham de Moivre found the bell curve in 1733 as an approximation to the number of heads in many coin tosses. Pierre-Simon Laplace widened it around 1810 to sums of many kinds of errors. The name came much later: in 1920 George Pólya called it the "central" limit theorem because of its central place in probability — not because it is about the centre of a distribution, though, as this lesson shows, that is also where it works best.
:::

::: context twelve-uniforms A shortcut from the early days
Early computers could easily make uniform random numbers but found Gaussian ones expensive. A popular shortcut was to add twelve uniforms and subtract $6$: the result has mean $0$ and variance exactly $1$, and it looks like a bell. Better methods (such as the Box–Muller transform, and the ones inside NumPy today) produce true Gaussian samples. The shortcut still turns up in old code, where it quietly caps every sample at $\pm 6$.
:::

::: context tail-ratio Good in the middle, wrong in the tails
Each bar is the exact tail chance for the sum of twelve uniforms divided by the Gaussian's tail chance, at $k$ sigmas. A bar reaching the dashed line means a perfect match. Near the centre the match is excellent; by four sigmas the Gaussian is too big by a factor of nearly four; at six sigmas the true chance is zero.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="140" x2="340" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="40" x2="340" y2="40" stroke="#6c7a93" stroke-width="1" stroke-dasharray="5,4"/>
  <text x="44" y="34" font-size="11" fill="#6c7a93">ratio = 1 (perfect match)</text>
  <rect x="60" y="38.7" width="40" height="101.3" fill="#1d6fd1"/>
  <rect x="120" y="42.1" width="40" height="97.9" fill="#1d6fd1"/>
  <rect x="180" y="65.4" width="40" height="74.6" fill="#8fb8f0"/>
  <rect x="240" y="113.1" width="40" height="26.9" fill="#f2b880"/>
  <line x1="300" y1="140" x2="340" y2="140" stroke="#b4232c" stroke-width="3"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="80" y="156">k = 1</text><text x="140" y="156">k = 2</text><text x="200" y="156">k = 3</text><text x="260" y="156">k = 4</text><text x="320" y="156">k = 6</text>
    <text x="200" y="60">0.75</text><text x="260" y="108">0.27</text><text x="320" y="132">0</text>
  </g>
</svg>
```
:::

::: context cauchy A distribution with no average
The Cauchy distribution looks like a bell at first glance, but its tails are so heavy that its mean and variance do not exist: the integrals that define them never settle. One way to picture it: shine a torch from a spinning stand at a long wall, stopping at a random angle. Most spots land near the middle, but now and then the beam is almost parallel to the wall and the spot lands enormously far away. Those rare wild values never average out, however many you collect.
:::

::: context thermal-noise Noise from warm electrons
In 1926–1928 John B. Johnson measured, and Harry Nyquist explained, the faint random voltage across any resistor at room temperature. It comes from the heat-driven jiggling of an enormous number of electrons, each nudging the voltage a tiny amount. Add up that many tiny independent nudges and the central limit theorem makes the result Gaussian — which is why the noise floor of nearly every electronic sensor, including the ones in an IMU, is modelled that way.
:::
