---
id: l03-minimum-variance-blue-gauss-markov
title: Minimum variance and BLUE: the Gauss-Markov theorem
minutes: 16
covers:
  - Minimum variance and BLUE: the Gauss-Markov theorem
---

A jar of jellybeans sits on a teacher's desk, and two students write down guesses. One is careful and usually close. The other is quick and often far off. You may combine their guesses any way you like, as long as the rule is fixed in advance. You could average them. You could trust only the careful one. You could give the careful one 70% of the say. Is there a *best* rule — one that no clever alternative can beat?

For a large and useful family of rules, yes, and this lesson proves it. Lesson two ended on a claim: weighting each measurement by the inverse of its noise covariance is not merely sensible but *best*. Here is the proof. It is short, and once you have followed it, the question "could cleverer weights do better?" is closed for every linear estimator you will ever write. The result is the **[[Gauss-Markov theorem|gauss-markov-history]]**. The estimator it crowns is the **best linear unbiased estimator**, BLUE for short.

Why a navigation engineer cares: the alternative is guesswork. A calibration procedure inherited from an old mission might average two sensors evenly, or trust whichever has the better **[[spec sheet|spec-sheet]]**, or use weights nobody can trace to a covariance. Gauss-Markov settles it. Once $\mathbf{R}$ is known, weighted least squares with $\mathbf{W} = \mathbf{R}^{-1}$ has the smallest variance of every linear unbiased rule. And it needs no assumption about the *shape* of the noise distribution — only its **[[first two moments|moments]]**, the mean and the covariance. The noise can be bell-shaped, flat, or a shape with no name.

## The class of linear unbiased estimators

First, pin down exactly which rules are in the contest.

A **linear estimator** is any rule of the form

$$
\hat{\mathbf{x}} = \mathbf{K}\mathbf{y}
$$

for some fixed $n\times m$ matrix $\mathbf{K}$, the **gain**. "Fixed" means chosen before the data arrive. It may depend on $\mathbf{H}$ and $\mathbf{R}$, but not on $\mathbf{y}$. In the jellybean picture, $\mathbf{K}$ is the pair of percentages you give the two students.

An estimator is **[[unbiased|darts-bias]]** if, averaged over many repeats of the noise, it lands exactly on the truth. Put the model $\mathbf{y} = \mathbf{H}\mathbf{x} + \mathbf{v}$ in: $\hat{\mathbf{x}} = \mathbf{K}\mathbf{H}\mathbf{x} + \mathbf{K}\mathbf{v}$. The noise term averages to zero, so the average of $\hat{\mathbf{x}}$ is $\mathbf{K}\mathbf{H}\mathbf{x}$. For that to equal $\mathbf{x}$ for *every* possible true $\mathbf{x}$, we need

$$
\mathbf{K}\mathbf{H} = \mathbf{I}_n .
$$

That one matrix equation is the whole meaning of "linear and unbiased". For two guesses of one number, $\mathbf{H} = (1, 1)^\mathsf{T}$, and it says the two percentages must add to $100\%$.

### Every contestant, written one way

Lesson two's WLS gain

$$
\mathbf{K}_0 = (\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1}\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}
$$

passes the test: multiply by $\mathbf{H}$ and you get $\mathbf{I}$. But so does a plain average, so does a rule that ignores one measurement, and so does anything built by adding to $\mathbf{K}_0$ a matrix $\mathbf{D}$ that gives zero against $\mathbf{H}$:

$$
\mathbf{K} = \mathbf{K}_0 + \mathbf{D}, \qquad \mathbf{D}\mathbf{H} = \mathbf{0} .
$$

Check: $\mathbf{K}\mathbf{H} = \mathbf{K}_0\mathbf{H} + \mathbf{D}\mathbf{H} = \mathbf{I} + \mathbf{0} = \mathbf{I}$. And it works the other way too. Given any unbiased $\mathbf{K}$, set $\mathbf{D} = \mathbf{K} - \mathbf{K}_0$; then $\mathbf{D}\mathbf{H} = \mathbf{I} - \mathbf{I} = \mathbf{0}$. So every linear unbiased estimator is "WLS plus some $\mathbf{D}$", and $\mathbf{D} = \mathbf{0}$ is WLS itself.

What is $\mathbf{D}$ allowed to do? Its rows lie in the **[[left null space|left-null-space]]** of $\mathbf{H}$: the directions in data space that no true signal $\mathbf{H}\mathbf{x}$ can ever produce. So $\mathbf{D}$ can stir those "pure noise" directions into the estimate in any way it likes, as long as it never touches anything that looks like a real signal.

## Why the extra term never helps

Now compute the covariance of any contestant. With $\mathbf{K} = \mathbf{K}_0 + \mathbf{D}$ and $\operatorname{Cov}(\mathbf{v}) = \mathbf{R}$, multiply out $\mathbf{K}\mathbf{R}\mathbf{K}^\mathsf{T}$ into four pieces:

$$
\operatorname{Cov}(\hat{\mathbf{x}}) = \mathbf{K}_0\mathbf{R}\mathbf{K}_0^\mathsf{T} + \mathbf{K}_0\mathbf{R}\mathbf{D}^\mathsf{T} + \mathbf{D}\mathbf{R}\mathbf{K}_0^\mathsf{T} + \mathbf{D}\mathbf{R}\mathbf{D}^\mathsf{T} .
$$

**The first piece** is $\mathbf{P} = (\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1}$, the WLS covariance from lesson two.

**The two cross pieces are zero.** Write out the first one. $\mathbf{R}^{-1}\mathbf{R} = \mathbf{I}$ cancels in the middle, and then $\mathbf{H}^\mathsf{T}\mathbf{D}^\mathsf{T} = (\mathbf{D}\mathbf{H})^\mathsf{T} = \mathbf{0}$:

$$
\mathbf{K}_0\mathbf{R}\mathbf{D}^\mathsf{T} = (\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1}\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{R}\mathbf{D}^\mathsf{T} = (\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1}(\mathbf{D}\mathbf{H})^\mathsf{T} = \mathbf{0}.
$$

The other cross piece is its transpose, so it is zero too. What survives is

$$
\operatorname{Cov}(\hat{\mathbf{x}}) = \mathbf{P} + \mathbf{D}\mathbf{R}\mathbf{D}^\mathsf{T} .
$$

**The last piece can only add.** Pick any vector $\mathbf{a}$. Then $\mathbf{a}^\mathsf{T}\mathbf{D}\mathbf{R}\mathbf{D}^\mathsf{T}\mathbf{a} = (\mathbf{D}^\mathsf{T}\mathbf{a})^\mathsf{T}\mathbf{R}(\mathbf{D}^\mathsf{T}\mathbf{a})$. That is the variance of a combination of the noise, and a variance cannot be negative. So $\mathbf{D}\mathbf{R}\mathbf{D}^\mathsf{T}$ is positive semidefinite for every $\mathbf{D}$.

**It is zero only when $\mathbf{D}$ is.** If some row $\mathbf{d}_i^\mathsf{T}$ of $\mathbf{D}$ were not zero, then $\mathbf{d}_i^\mathsf{T}\mathbf{R}\mathbf{d}_i > 0$, because $\mathbf{R}$ is positive definite. That positive number sits on the diagonal of $\mathbf{D}\mathbf{R}\mathbf{D}^\mathsf{T}$.

Put together:

$$
\operatorname{Cov}(\hat{\mathbf{x}}) \succeq \mathbf{P}, \qquad \text{equality iff } \mathbf{D}=\mathbf{0} .
$$

Read "$\succeq$" as "is at least as big as, in the **[[positive-semidefinite ordering|psd-ellipses]]**": the difference of the two matrices is positive semidefinite. In plain words, WLS is no worse in *any* direction. For every vector $\mathbf{a}$, $\mathbf{a}^\mathsf{T}\operatorname{Cov}(\hat{\mathbf{x}})\mathbf{a} \ge \mathbf{a}^\mathsf{T}\mathbf{P}\mathbf{a}$. So every combination of the unknowns — each one alone, their sum, their difference — is estimated at least as precisely by WLS as by any rival. And nowhere did the argument use the shape of the noise, only its zero mean and its covariance $\mathbf{R}$.

::: key Gauss-Markov theorem
Among all linear unbiased estimators $\hat{\mathbf{x}}=\mathbf{K}\mathbf{y}$ with $\mathbf{K}\mathbf{H}=\mathbf{I}$, the weighted least squares estimator with $\mathbf{W}=\mathbf{R}^{-1}$ has the smallest covariance, in the positive-semidefinite ordering — it is the **Best Linear Unbiased Estimator (BLUE)**. It requires only $\mathbb{E}[\mathbf{v}]=\mathbf{0}$ and $\operatorname{Cov}(\mathbf{v})=\mathbf{R}$, not that $\mathbf{v}$ be Gaussian.
:::

::: warning "Gauss" is not "Gaussian"
The theorem is named for two mathematicians, Carl Friedrich Gauss and Andrei Markov — not for the Gaussian (normal) distribution. Reading "Gauss-Markov" and assuming it needs bell-shaped noise gets the theorem backwards. The next lesson brings in a genuinely different result that *does* need Gaussian noise. Keep the two apart.
:::

::: example Two independent mass estimates
After a burn, a spacecraft's mass is estimated two ways. Propellant bookkeeping — integrate the mass flow over the burn and subtract — gives $\hat m_1$ with $\sigma_1 = 12\,\mathrm{kg}$. A fit of commanded thrust against measured acceleration ($m = F/a$) gives $\hat m_2$ with $\sigma_2 = 20\,\mathrm{kg}$. The two methods share no instruments, so treat their errors as independent.

**The contestants.** Every linear unbiased combination is $\hat m = a\,\hat m_1 + (1-a)\hat m_2$ for some number $a$. The two coefficients must add to one; that is $\mathbf{K}\mathbf{H} = \mathbf{I}$ written out for $\mathbf{H} = (1,1)^\mathsf{T}$.

**The variance of each.** Independent errors add in variance, each scaled by its coefficient squared:

$$
\operatorname{Var}(\hat m) = a^2\sigma_1^2 + (1-a)^2\sigma_2^2 = 144\,a^2 + 400\,(1-a)^2\ \mathrm{kg^2}.
$$

**Find the best $a$.** This is a parabola in $a$. Its slope is $288\,a - 800(1-a)$. Setting that to zero gives $1088\,a = 800$, so

$$
a^\star = \frac{\sigma_2^2}{\sigma_1^2+\sigma_2^2} = \frac{400}{544} = 0.7353 .
$$

That is exactly what the WLS gain $(\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1}\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}$ gives for $\mathbf{R} = \operatorname{diag}(144, 400)\,\mathrm{kg^2}$.

**Compare three rules**, all unbiased:

| Rule | $a$ | Variance | Standard deviation |
| --- | --- | --- | --- |
| Trust the bookkeeping alone | $1$ | $144\,\mathrm{kg^2}$ | $12.0\,\mathrm{kg}$ |
| Simple average | $0.5$ | $136\,\mathrm{kg^2}$ | $11.7\,\mathrm{kg}$ |
| WLS | $0.7353$ | $105.9\,\mathrm{kg^2}$ | $10.3\,\mathrm{kg}$ |

The average: $0.25\times 144 + 0.25\times 400 = 136$. The WLS line: $144\times 0.7353^2 + 400\times 0.2647^2 = 105.9$.

**What to notice.** The simple average already beats trusting the better method alone — a noisier second opinion still carries information. The WLS weight beats the average by a wider margin still, while giving the noisier method barely more than a quarter of the say. Gauss-Markov guarantees that no other value of $a$ does better. It says nothing about rules outside the contest, such as one that uses $\hat m_1^2$: that is not linear.

**Sanity check.** $10.3\,\mathrm{kg}$ is below both $12$ and $20$, as combining independent information must be.
:::

## Checking it with noise that is not Gaussian

The proof used only the mean and covariance of the noise. So it should hold for noise of any shape with the same mean and covariance. Let us test that by brute force.

::: example BLUE under non-Gaussian noise
Take the bias-and-drift model from lesson one's clock example, $\mathbf{h}_i^\mathsf{T} = (1, t_i)$, now fitted to five Doppler measurements from one tracking pass. The samples are at $t = -2, -1, 0, 1, 2\,\mathrm{min}$ around closest approach. As in lesson two's position fix, the data are best in the middle and worst at the ends: $\sigma = (3,\ 1,\ 0.5,\ 1,\ 3)$ in consistent units.

**Theory for WLS.** The information is $\sum_i \mathbf{h}_i\mathbf{h}_i^\mathsf{T}/\sigma_i^2$. Its entries are $\sum 1/\sigma_i^2 = 1/9 + 1 + 4 + 1 + 1/9 = 6.222$, $\sum t_i/\sigma_i^2 = 0$ (the times are symmetric), and $\sum t_i^2/\sigma_i^2 = 4/9 + 1 + 0 + 1 + 4/9 = 2.889$. So $\mathbf{P}_{\mathrm{WLS}}$ is diagonal, with variances $1/6.222 = 0.1607$ for the bias and $1/2.889 = 0.3462$ for the drift.

**Theory for plain least squares.** Here $\mathbf{H}^\mathsf{T}\mathbf{H} = \operatorname{diag}(5, 10)$, so the bias estimate is the plain mean and the drift estimate is $\sum t_i y_i/10$. By the sandwich, the bias variance is $\sum\sigma_i^2/25 = 20.25/25 = 0.81$ and the drift variance is $\sum t_i^2\sigma_i^2/100 = 74/100 = 0.74$.

**The noise.** Draw it not from a Gaussian but from a **[[Laplace distribution|laplace-shape]]** with the same $\sigma_i$. A Laplace with scale $b$ has variance $2b^2$, so $b_i = \sigma_i/\sqrt{2}$. It has the same mean and covariance, but a sharp peak and heavy tails: its **[[excess kurtosis|kurtosis]]** is $3$, against the Gaussian's $0$.

**The test.** Run $400{,}000$ trials in the code below. Every simulated variance matches its theory to within about half a percent: $0.811$ against $0.81$, $0.738$ against $0.74$, $0.1605$ against $0.1607$, $0.345$ against $0.346$.

**The verdict.** Plain least squares needs about three times the total variance — the trace ratio is $3.06$ — for the same five numbers. Nothing about the Laplace shape entered the theory; only $\mathbf{R}$ did.
:::

```python
import numpy as np
from scipy import stats

t = np.array([-2.0, -1.0, 0.0, 1.0, 2.0])
H = np.column_stack([np.ones(5), t])
sigma = np.array([3.0, 1.0, 0.5, 1.0, 3.0])
x_true = np.array([5.0, 2.0])
b = sigma / np.sqrt(2.0)                       # Laplace scale matching each sigma_i

R = np.diag(sigma**2)
K_ols = np.linalg.inv(H.T @ H) @ H.T
K_wls = np.linalg.inv(H.T @ np.linalg.inv(R) @ H) @ H.T @ np.linalg.inv(R)
P_ols_theory = K_ols @ R @ K_ols.T             # sandwich formula, lesson 2
P_wls_theory = np.linalg.inv(H.T @ np.linalg.inv(R) @ H)

rng = np.random.default_rng(777)
N = 400_000
noise = rng.laplace(scale=b, size=(N, 5))      # zero-mean, non-Gaussian, Cov = R
y = x_true @ H.T + noise

xhat_ols = (K_ols @ y.T).T
xhat_wls = (K_wls @ y.T).T
print("kurtosis of noise column 0 (excess):", round(stats.kurtosis(noise[:, 0]), 3))
print("P_ols theory vs empirical:", np.diag(P_ols_theory).round(4), np.diag(np.cov(xhat_ols.T)).round(4))
print("P_wls theory vs empirical:", np.diag(P_wls_theory).round(4), np.diag(np.cov(xhat_wls.T)).round(4))
print("trace ratio P_ols/P_wls:", round(np.trace(P_ols_theory) / np.trace(P_wls_theory), 3))
# kurtosis of noise column 0 (excess): 3.038
# P_ols theory vs empirical: [0.81 0.74] [0.811  0.7379]
# P_wls theory vs empirical: [0.1607 0.3462] [0.1605 0.3452]
# trace ratio P_ols/P_wls: 3.058
```

## What the theorem does not say

Three words in "best **linear unbiased** estimator" are doing real work. Each marks a place where it is tempting to read the theorem as promising more than it does.

**Linear.** A nonlinear rule can beat WLS in variance while staying unbiased. Gauss-Markov compares only linear rules. The next lesson shows exactly when WLS is also the best estimator of *any* kind: when the noise is Gaussian.

**Unbiased.** Allow a small, deliberate offset and the contest changes. A biased estimator can have a smaller **[[mean squared error|mse-bridge]]** — bias squared plus variance — than any unbiased one, by trading a little bias for a big cut in variance. The lesson on maximum a posteriori estimation, later in this module, gives the concrete case: folding in prior knowledge pulls the estimate off the unbiased answer and often reduces the total error, especially in badly conditioned problems where the WLS variance is largest.

**Variance.** BLUE minimizes variance. That is the right target when variance is what you act on: a $1\sigma$ error bar, a covariance handed to a filter. It says nothing about, say, the chance that the error exceeds a hard safety limit. That depends on the whole shape of the noise distribution, not only on $\mathbf{R}$.

::: warning BLUE is not "the only good estimator"
It is easy to read Gauss-Markov as settling how to estimate $\mathbf{x}$, full stop. It settles the question only inside the linear-unbiased box. **[[Robust estimators|robust-bridge]]**, built to resist outliers and covered later in this module, are deliberately nonlinear. They give up a little variance on good data to avoid a disaster on bad data. They are not trying to beat Gauss-Markov and do not break it: they are not playing inside its box.
:::

## Check yourself

::: check
State the Gauss-Markov theorem precisely. Which estimators are being compared, what is being made smallest, and what is the only thing assumed about the noise?
:::

::: answer
**Compared:** linear estimators $\hat{\mathbf{x}} = \mathbf{K}\mathbf{y}$ that are unbiased, meaning $\mathbf{K}\mathbf{H} = \mathbf{I}$.

**Made smallest:** the covariance, in the positive-semidefinite ordering. The winner is $\mathbf{K}_0 = (\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1}\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}$, and every other unbiased linear $\mathbf{K}$ has $\operatorname{Cov}(\hat{\mathbf{x}}) \succeq \mathbf{P} = (\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1}$.

**Assumed:** only $\mathbb{E}[\mathbf{v}] = \mathbf{0}$ and $\operatorname{Cov}(\mathbf{v}) = \mathbf{R}$. Nothing about the shape of the noise distribution.
:::

::: check
In the proof, $\operatorname{Cov}(\hat{\mathbf{x}}) = \mathbf{P} + \mathbf{D}\mathbf{R}\mathbf{D}^\mathsf{T}$. Explain why $\mathbf{D}\mathbf{R}\mathbf{D}^\mathsf{T}$ can never make the covariance smaller, and say exactly when it is zero.
:::

::: answer
For any vector $\mathbf{a}$, $\mathbf{a}^\mathsf{T}\mathbf{D}\mathbf{R}\mathbf{D}^\mathsf{T}\mathbf{a} = (\mathbf{D}^\mathsf{T}\mathbf{a})^\mathsf{T}\mathbf{R}(\mathbf{D}^\mathsf{T}\mathbf{a})$. That is a quadratic form in the positive definite $\mathbf{R}$, so it is $\ge 0$. Hence $\mathbf{D}\mathbf{R}\mathbf{D}^\mathsf{T}$ is positive semidefinite for every $\mathbf{D}$: it can add variance in some directions, never remove it.

It is the zero matrix only when $\mathbf{D} = \mathbf{0}$. If any row $\mathbf{d}_i^\mathsf{T}$ were nonzero, $\mathbf{d}_i^\mathsf{T}\mathbf{R}\mathbf{d}_i > 0$ would appear on its diagonal. So the WLS gain is not merely *a* minimizer among linear unbiased estimators — it is the only one.
:::

::: check
Two independent estimates of the same number have $\sigma_1 = 5$ and $\sigma_2 = 15$. Find the BLUE weight on the first, the resulting variance and standard deviation, and compare with a $50/50$ average.
:::

::: answer
**Information:** $\Lambda = 1/25 + 1/225 = 0.04444$. So $P = 1/\Lambda = 22.5$ and $\sigma_{\hat x} = \sqrt{22.5} = 4.74$.

**Weight:** $a^\star = (1/25)/\Lambda = 0.04/0.04444 = 0.9$. The second estimate has nine times the variance of the first and gets a tenth of the say.

**Simple average:** variance $0.25\times 25 + 0.25\times 225 = 62.5$, standard deviation $7.91$. Much worse, because it lets the noisy estimate pull as hard as the precise one. It is even worse than using the first estimate alone ($\sigma = 5$).
:::

::: check
A colleague says: "Gauss-Markov needs Gaussian noise, so it doesn't apply to my sensor — its errors are nowhere near bell-shaped." Are they right?
:::

::: answer
No. The theorem is named after Gauss and Markov, not after the Gaussian distribution. Its proof uses only the mean and covariance of the noise, never its shape. So it holds for any zero-mean noise with known covariance $\mathbf{R}$, bell-shaped or not — the Laplace simulation in this lesson checks exactly that.

What *does* need Gaussian noise is a different, stronger claim, in the next lesson: that WLS is the best estimator of any kind, not only the best linear one.
:::

::: check
An engineer wants to hand-tune the weights of a two-sensor fit to down-weight a sensor that occasionally glitches — even during normal operation, when the sensor is healthy and $\mathbf{R}$ is exactly as specified. What does the theorem say this costs when the sensor is healthy, and why might the engineer still be right?
:::

::: answer
**The cost.** Any change from $\mathbf{K}_0$ is some nonzero $\mathbf{D}$. Gauss-Markov then gives $\operatorname{Cov}(\hat{\mathbf{x}}) = \mathbf{P} + \mathbf{D}\mathbf{R}\mathbf{D}^\mathsf{T}$, strictly worse than $\mathbf{P}$ in at least one direction. On healthy data the hand-tuned rule loses, by an amount you can compute exactly from $\mathbf{D}\mathbf{R}\mathbf{D}^\mathsf{T}$.

**Why it may still be right.** The guarantee assumes $\mathbf{R}$ describes the noise *all* the time, glitches included. A sensor that sometimes produces errors far outside $\mathbf{R}$ is not described by $\mathbf{R}$, and Gauss-Markov offers no protection against that. Paying a known, small cost on good data to limit an unknown, possibly large cost on bad data is a reasonable trade. The robust-estimation lesson later in the module makes that trade systematic.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\hat{\mathbf{x}}=\mathbf{K}\mathbf{y}$, $\mathbf{K}\mathbf{H}=\mathbf{I}$ | Linear unbiased estimator: the whole class Gauss-Markov compares |
| $\mathbf{K}=\mathbf{K}_0+\mathbf{D}$, $\mathbf{D}\mathbf{H}=\mathbf{0}$ | Every contestant is the WLS gain plus something that gives zero against $\mathbf{H}$ |
| $\operatorname{Cov}(\hat{\mathbf{x}}) = \mathbf{P} + \mathbf{D}\mathbf{R}\mathbf{D}^\mathsf{T}$ | Covariance of any contestant; the extra term is positive semidefinite, zero only at $\mathbf{D}=\mathbf{0}$ |
| $\operatorname{Cov}(\hat{\mathbf{x}}) \succeq \mathbf{P}$ | Gauss-Markov / BLUE: WLS with $\mathbf{W}=\mathbf{R}^{-1}$ has minimum covariance among linear unbiased estimators |
| Needs only $\mathbb{E}[\mathbf{v}]=\mathbf{0}$, $\operatorname{Cov}(\mathbf{v})=\mathbf{R}$ | No assumption on the shape of the noise; checked here with Laplace noise |
| Does not cover | Nonlinear estimators, biased estimators, or targets other than variance |

This is the best you can do with a *linear* rule. The next lesson assumes the noise really is Gaussian and finds that the same weighted least squares estimator becomes the best estimator there is — the maximum likelihood estimator, with no "linear" attached.

::: context gauss-markov-history Two centuries in one theorem
Carl Friedrich Gauss published least squares in 1809, justifying it by assuming the errors follow the bell curve that now carries his name. In 1821–1823 he gave a second argument that needed no bell curve at all: among linear unbiased rules, least squares has the smallest variance. That is this theorem. Andrei Markov presented it again in his probability textbook around 1900, and the two names were joined later. In 1935 Alexander Aitken extended it to correlated noise — the general $\mathbf{R}^{-1}$ weighting used here.
:::

::: context spec-sheet What a spec sheet promises
A sensor's specification sheet lists its noise, bias and drift, usually as a "typical" or "maximum" value measured on the manufacturer's test bench. It is a starting point for $\mathbf{R}$, not the truth for your unit on your vehicle. Temperature, vibration and aging all change the numbers. Engineers check the spec against their own data — and the variance-factor test from lesson two is one way to do it.
:::

::: context moments Mean and spread, and nothing else
The **mean** of a random number is its average value. The **variance** measures its spread around the mean. These are its first two "moments" — a word borrowed from mechanics, where the first moment of a mass gives its balance point and the second its resistance to spinning. Two very different shapes of noise can share both moments. Gauss-Markov cannot tell them apart, and does not need to.
:::

::: context darts-bias Aim versus scatter
Think of darts. An **unbiased** thrower's darts centre on the bullseye, even if they scatter. A **biased** thrower's darts cluster around the wrong spot, however tight the group. Variance measures the scatter; bias measures the aim.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g transform="translate(90,80)">
    <circle r="60" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
    <circle r="38" fill="none" stroke="#6c7a93" stroke-width="1"/>
    <circle r="16" fill="none" stroke="#6c7a93" stroke-width="1"/>
    <circle r="3" fill="#1f2a44"/>
    <g fill="#1d6fd1">
      <circle cx="-30" cy="-12" r="4"/><circle cx="26" cy="18" r="4"/><circle cx="8" cy="-34" r="4"/>
      <circle cx="-10" cy="30" r="4"/><circle cx="34" cy="-16" r="4"/><circle cx="-28" cy="14" r="4"/>
    </g>
  </g>
  <text x="90" y="160" font-size="12" fill="#1f2a44" text-anchor="middle">unbiased, wide scatter</text>
  <g transform="translate(270,80)">
    <circle r="60" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
    <circle r="38" fill="none" stroke="#6c7a93" stroke-width="1"/>
    <circle r="16" fill="none" stroke="#6c7a93" stroke-width="1"/>
    <circle r="3" fill="#1f2a44"/>
    <g fill="#b4232c">
      <circle cx="24" cy="-26" r="4"/><circle cx="31" cy="-22" r="4"/><circle cx="27" cy="-17" r="4"/>
      <circle cx="21" cy="-20" r="4"/><circle cx="29" cy="-29" r="4"/><circle cx="34" cy="-25" r="4"/>
    </g>
  </g>
  <text x="270" y="160" font-size="12" fill="#1f2a44" text-anchor="middle">biased, tight group</text>
</svg>
```

The six blue darts average exactly to the centre. Gauss-Markov only enters throwers of the first kind.
:::

::: context left-null-space Directions no signal can reach
Every possible noise-free data vector has the form $\mathbf{H}\mathbf{x}$; together they fill the column space of $\mathbf{H}$. The **left null space** is everything perpendicular to that: data directions that no true state could ever produce. The residual of lesson one lives there. $\mathbf{D}$ may only read from these directions — which is why it cannot shift the average of the estimate, and also why it can only add noise.
:::

::: context psd-ellipses One ellipse inside the other
Draw each covariance as an ellipse whose half-widths are the standard deviations. These are the real ellipses from this lesson's Doppler example: bias on the horizontal axis, drift on the vertical. "$\succeq$" means the plain least-squares ellipse (grey) wraps completely around the WLS ellipse (blue) — bigger in every direction, not only on average.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="10" y1="100" x2="220" y2="100" stroke="#6c7a93" stroke-width="1"/>
  <line x1="115" y1="5" x2="115" y2="195" stroke="#6c7a93" stroke-width="1"/>
  <ellipse cx="115" cy="100" rx="90" ry="86" fill="none" stroke="#6c7a93" stroke-width="2" stroke-dasharray="6,4"/>
  <ellipse cx="115" cy="100" rx="40.1" ry="58.8" fill="#8fb8f0" fill-opacity="0.5" stroke="#1d6fd1" stroke-width="2"/>
  <text x="228" y="60" font-size="12" fill="#6c7a93">plain LS: 0.90 × 0.86</text>
  <text x="228" y="80" font-size="12" fill="#1d6fd1">WLS: 0.40 × 0.59</text>
  <text x="228" y="120" font-size="11" fill="#1f2a44">horizontal: bias σ</text>
  <text x="228" y="136" font-size="11" fill="#1f2a44">vertical: drift σ</text>
</svg>
```
:::

::: context laplace-shape Same spread, different shape
Both curves below have mean $0$ and standard deviation $1$. The Laplace (red) has a sharp point in the middle and fatter tails: most of its errors are tiny, but big ones come more often than the Gaussian (blue) would allow. Pierre-Simon Laplace proposed this shape for errors in 1774, decades before the bell curve took over.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 175" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="150" x2="340" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M 20.0,150.0 L 28.0,150.0 L 36.0,149.9 L 44.0,149.8 L 52.0,149.6 L 60.0,149.3 L 68.0,148.7 L 76.0,147.8 L 84.0,146.4 L 92.0,144.3 L 100.0,141.4 L 108.0,137.4 L 116.0,132.3 L 124.0,126.0 L 132.0,118.9 L 140.0,111.3 L 148.0,103.6 L 156.0,96.7 L 164.0,91.1 L 172.0,87.4 L 180.0,86.2 L 188.0,87.4 L 196.0,91.1 L 204.0,96.7 L 212.0,103.6 L 220.0,111.3 L 228.0,118.9 L 236.0,126.0 L 244.0,132.3 L 252.0,137.4 L 260.0,141.4 L 268.0,144.3 L 276.0,146.4 L 284.0,147.8 L 292.0,148.7 L 300.0,149.3 L 308.0,149.6 L 316.0,149.8 L 324.0,149.9 L 332.0,150.0 L 340.0,150.0" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <path d="M 20.0,149.6 L 28.0,149.5 L 36.0,149.3 L 44.0,149.1 L 52.0,148.8 L 60.0,148.4 L 68.0,147.8 L 76.0,147.1 L 84.0,146.2 L 92.0,145.0 L 100.0,143.3 L 108.0,141.1 L 116.0,138.2 L 124.0,134.4 L 132.0,129.3 L 140.0,122.5 L 148.0,113.5 L 156.0,101.6 L 164.0,85.7 L 172.0,64.7 L 180.0,36.9 L 188.0,64.7 L 196.0,85.7 L 204.0,101.6 L 212.0,113.5 L 220.0,122.5 L 228.0,129.3 L 236.0,134.4 L 244.0,138.2 L 252.0,141.1 L 260.0,143.3 L 268.0,145.0 L 276.0,146.2 L 284.0,147.1 L 292.0,147.8 L 300.0,148.4 L 308.0,148.8 L 316.0,149.1 L 324.0,149.3 L 332.0,149.5 L 340.0,149.6" fill="none" stroke="#b4232c" stroke-width="2"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="20" y="166">−4</text><text x="100" y="166">−2</text><text x="180" y="166">0</text><text x="260" y="166">2</text><text x="340" y="166">4</text>
  </g>
  <text x="196" y="40" font-size="12" fill="#b4232c">Laplace</text>
  <text x="222" y="92" font-size="12" fill="#1d6fd1">Gaussian</text>
</svg>
```
:::

::: context kurtosis A number for heavy tails
**Kurtosis** measures how much of a distribution's variance comes from rare, large values. It is the average of the fourth power of the standardized error. A Gaussian has kurtosis $3$, so statisticians subtract $3$ and call the rest "excess kurtosis". Laplace noise has excess kurtosis $3$; the simulation measured $3.04$. Real sensor noise with occasional spikes — radio interference, a star misidentified — often has large excess kurtosis.
:::

::: context mse-bridge Trading aim for steadiness
Mean squared error is the average of (estimate − truth)², and it splits exactly into bias² + variance. Picture a gun sight bolted slightly off-centre but on a very steady mount: its shots miss by a little, every time, yet they often land closer on average than a perfectly aimed but shaky rifle. The MAP lesson shows that adding a prior does this on purpose.
:::

::: context robust-bridge Where this comes back
In the residual-analysis lesson of this module you will meet the Huber loss, which acts like least squares for small residuals and like an absolute value for big ones, and RANSAC, which fits many small random subsets and keeps the one most measurements agree with. Both are nonlinear in the data, so they sit outside Gauss-Markov's box — on purpose.
:::
