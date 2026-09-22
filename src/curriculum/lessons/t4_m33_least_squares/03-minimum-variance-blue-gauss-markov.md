---
id: l03-minimum-variance-blue-gauss-markov
title: Minimum variance and BLUE: the Gauss-Markov theorem
minutes: 19
covers:
  - Minimum variance and BLUE: the Gauss-Markov theorem
---

Lesson two ended on a claim it did not prove: that weighting every measurement by the inverse of its own noise covariance is not merely a defensible choice but the best one available to any estimator that is linear in the data and unbiased. This lesson proves that claim, and the proof is short enough that once you have followed it, "could a cleverer set of weights do better?" stops being an open question for any linear estimator you will ever write. The result is called the **Gauss-Markov theorem**, and the estimator it crowns is the **best linear unbiased estimator**, BLUE for short.

The theorem earns its place in a navigation engineer's toolkit because the alternative to trusting it is trial and error. A calibration procedure inherited from an earlier mission might average two sensors evenly, or trust whichever one has the better spec sheet, or use weights nobody can trace back to a covariance. Gauss-Markov settles the question outright: once $\mathbf{R}$ is known, weighted least squares with $\mathbf{W}=\mathbf{R}^{-1}$ is provably the smallest-variance choice among every linear rule that could replace it, with no assumption about the shape of the noise distribution. That last part matters. The theorem is a nineteenth-century result about the first two moments of a distribution, proved decades before anyone connected it to the normal distribution in particular, and it holds exactly as stated whether the noise is Gaussian, uniform, or a shape with no name.

## The class of linear unbiased estimators

Generalize slightly beyond a single weight matrix. A **linear estimator** is any rule

$$
\hat{\mathbf{x}} = \mathbf{K}\mathbf{y}
$$

for some fixed $n\times m$ matrix $\mathbf{K}$ — fixed meaning chosen before the data arrive, so it may depend on $\mathbf{H}$ and $\mathbf{R}$ but not on $\mathbf{y}$. Substituting the model $\mathbf{y}=\mathbf{H}\mathbf{x}+\mathbf{v}$ gives $\hat{\mathbf{x}} = \mathbf{K}\mathbf{H}\mathbf{x} + \mathbf{K}\mathbf{v}$, which is unbiased for every possible true $\mathbf{x}$ exactly when

$$
\mathbf{K}\mathbf{H} = \mathbf{I}_n .
$$

This one matrix equation is the entire content of "linear and unbiased." Lesson two's weighted least squares gain $\mathbf{K}_0 = (\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1}\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}$ satisfies it, by direct multiplication, but so does the plain average of two equally scaled sensors, so does an estimator that ignores a measurement entirely, and so does any $\mathbf{K}$ built by adding to $\mathbf{K}_0$ a matrix that vanishes against $\mathbf{H}$:

$$
\mathbf{K} = \mathbf{K}_0 + \mathbf{D}, \qquad \mathbf{D}\mathbf{H} = \mathbf{0} .
$$

Every linear unbiased estimator has this form for some $\mathbf{D}$, and every choice of $\mathbf{D}$ with $\mathbf{D}\mathbf{H}=\mathbf{0}$ gives another one: $\mathbf{K}\mathbf{H} = \mathbf{K}_0\mathbf{H} + \mathbf{D}\mathbf{H} = \mathbf{I} + \mathbf{0} = \mathbf{I}$. Geometrically, $\mathbf{D}$'s rows lie in the left null space of $\mathbf{H}$: $\mathbf{D}$ can mix the part of the data space orthogonal to the model into the estimate in any way at all, as long as it does not touch anything that looks like a genuine signal $\mathbf{H}\mathbf{x}$. $\mathbf{D}=\mathbf{0}$ recovers weighted least squares; every other candidate estimator is some nonzero $\mathbf{D}$.

## The variance of any candidate, and why the extra term never helps

Take the covariance of an arbitrary such estimator. With $\mathbf{K} = \mathbf{K}_0 + \mathbf{D}$ and $\operatorname{Cov}(\mathbf{v}) = \mathbf{R}$,

$$
\operatorname{Cov}(\hat{\mathbf{x}}) = \mathbf{K}\mathbf{R}\mathbf{K}^\mathsf{T}
= \mathbf{K}_0\mathbf{R}\mathbf{K}_0^\mathsf{T} + \mathbf{K}_0\mathbf{R}\mathbf{D}^\mathsf{T} + \mathbf{D}\mathbf{R}\mathbf{K}_0^\mathsf{T} + \mathbf{D}\mathbf{R}\mathbf{D}^\mathsf{T} .
$$

The first term is $\mathbf{P} = (\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1}$, the WLS covariance from the previous lesson. The two cross terms vanish:

$$
\mathbf{K}_0\mathbf{R}\mathbf{D}^\mathsf{T} = (\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1}\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{R}\mathbf{D}^\mathsf{T} = (\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1}\mathbf{H}^\mathsf{T}\mathbf{D}^\mathsf{T} = (\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1}(\mathbf{D}\mathbf{H})^\mathsf{T} = \mathbf{0},
$$

using $\mathbf{R}^{-1}\mathbf{R}=\mathbf{I}$ and then $\mathbf{D}\mathbf{H}=\mathbf{0}$; the other cross term is its transpose, also zero. What survives is

$$
\operatorname{Cov}(\hat{\mathbf{x}}) = \mathbf{P} + \mathbf{D}\mathbf{R}\mathbf{D}^\mathsf{T} .
$$

$\mathbf{R}$ is positive definite, so $\mathbf{D}\mathbf{R}\mathbf{D}^\mathsf{T}$ is positive semidefinite for any $\mathbf{D}$: for any vector $\mathbf{a}$, $\mathbf{a}^\mathsf{T}\mathbf{D}\mathbf{R}\mathbf{D}^\mathsf{T}\mathbf{a} = (\mathbf{D}^\mathsf{T}\mathbf{a})^\mathsf{T}\mathbf{R}(\mathbf{D}^\mathsf{T}\mathbf{a}) \ge 0$, because $\mathbf{R}\succ\mathbf{0}$ and a quadratic form in a positive definite matrix cannot be negative. It is the zero matrix only when $\mathbf{D}=\mathbf{0}$: if some row $\mathbf{d}_i^\mathsf{T}$ of $\mathbf{D}$ were nonzero, $\mathbf{d}_i^\mathsf{T}\mathbf{R}\mathbf{d}_i>0$ because $\mathbf{R}\succ\mathbf{0}$, and that positive number sits on the diagonal of $\mathbf{D}\mathbf{R}\mathbf{D}^\mathsf{T}$. So every linear unbiased estimator has covariance $\mathbf{P}$ plus something positive semidefinite, with equality only at $\mathbf{D}=\mathbf{0}$:

$$
\operatorname{Cov}(\hat{\mathbf{x}}) \succeq \mathbf{P}, \qquad \text{equality iff } \mathbf{D}=\mathbf{0} .
$$

"$\succeq$" here means the difference is positive semidefinite, the matrix version of "no worse in every direction": for any vector $\mathbf{a}$, $\mathbf{a}^\mathsf{T}\operatorname{Cov}(\hat{\mathbf{x}})\mathbf{a} \ge \mathbf{a}^\mathsf{T}\mathbf{P}\mathbf{a}$, so every linear combination of the unknowns — not only each one individually — is estimated at least as precisely by WLS as by any competitor. Nothing in the argument used the shape of the noise distribution, only that $\mathbf{v}$ has zero mean and covariance $\mathbf{R}$.

::: key Gauss-Markov theorem
Among all linear unbiased estimators $\hat{\mathbf{x}}=\mathbf{K}\mathbf{y}$ with $\mathbf{K}\mathbf{H}=\mathbf{I}$, the weighted least squares estimator with $\mathbf{W}=\mathbf{R}^{-1}$ has the smallest covariance, in the positive-semidefinite ordering — it is the **Best Linear Unbiased Estimator (BLUE)**. It requires only $\mathbb{E}[\mathbf{v}]=\mathbf{0}$ and $\operatorname{Cov}(\mathbf{v})=\mathbf{R}$, not that $\mathbf{v}$ be Gaussian.
:::

::: warning "Gauss" is not "Gaussian"
The Gauss-Markov theorem is named for Carl Friedrich Gauss, who described the idea in 1809, and Andrei Markov, who gave it a rigorous statement around 1900 — not for the Gaussian distribution. It is one of the more common mix-ups in this subject: reading "Gauss-Markov" and assuming it must need normally distributed noise gets the theorem backwards. The next lesson introduces a genuinely different result that does need Gaussian noise; keeping the two apart is worth the sentence.
:::

::: example Two independent mass estimates, and why averaging is not enough
A spacecraft's dry mass after a burn is estimated two ways: propellant bookkeeping, mass flow integrated over the burn and subtracted from the pre-burn mass, gives $\hat m_1$ with $\sigma_1=12\,\mathrm{kg}$; a fit of commanded thrust against measured acceleration gives $\hat m_2$ with $\sigma_2=20\,\mathrm{kg}$. The two methods share no instrumentation, so treat their errors as independent. Every linear unbiased combination has the form $\hat m = a\,\hat m_1 + (1-a)\hat m_2$ for some $a$ — the coefficients must sum to one for $\mathbb{E}[\hat m]=m$ to hold regardless of the true $m$, which is $\mathbf{K}\mathbf{H}=\mathbf{I}$ written out for $\mathbf{H}=(1,1)^\mathsf{T}$. Its variance is

$$
\operatorname{Var}(\hat m) = a^2\sigma_1^2 + (1-a)^2\sigma_2^2 = 144\,a^2 + 400\,(1-a)^2\ \mathrm{kg^2},
$$

a parabola in $a$, minimized where its derivative $288\,a - 800(1-a)=0$, giving $a^\star = \sigma_2^2/(\sigma_1^2+\sigma_2^2) = 400/544 = 0.7353$ — exactly the weight $(\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1}\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}$ works out to for this $\mathbf{H}$ and diagonal $\mathbf{R}=\operatorname{diag}(144,400)\,\mathrm{kg^2}$. Three candidates, all unbiased:

| Rule | $a$ | Variance | Standard deviation |
| --- | --- | --- | --- |
| Trust the bookkeeping alone | $1$ | $144\,\mathrm{kg^2}$ | $12.0\,\mathrm{kg}$ |
| Simple average | $0.5$ | $136\,\mathrm{kg^2}$ | $11.7\,\mathrm{kg}$ |
| WLS ($a^\star=0.7353$) | $0.7353$ | $105.9\,\mathrm{kg^2}$ | $10.3\,\mathrm{kg}$ |

Two things are worth noticing. First, the simple average beats trusting the better sensor alone, which is already a mild surprise to an engineer's intuition — even a much noisier second opinion carries information worth including. Second, the WLS weight beats the simple average by a wider margin than the average beat the single sensor, and it does so while giving the noisier sensor barely more than a quarter of the say — not zero, but not parity either. Gauss-Markov guarantees no other value of $a$, and no rule that also tried folding in $\hat m_1^2$ or a constant offset, can do better while staying linear in $\hat m_1,\hat m_2$ and unbiased.
:::

## Confirming it by simulation, with noise that is not Gaussian

The proof used no property of $\mathbf{v}$ beyond its first two moments, so it should hold for noise of any shape with the same mean and covariance.

::: example BLUE under non-Gaussian noise
Reuse the bias-and-drift measurement model from the receiver-clock example two lessons back, $\mathbf{h}_i^\mathsf{T}=(1,t_i)$, but apply it here to a Doppler range-rate fit gathered through a single tracking pass, sampled at $t=-2,-1,0,1,2\,\mathrm{min}$ about closest approach. As in the elevation-weighted position fix of the previous lesson, the geometry is best — least noisy — near the middle of the pass and worst at the ends: $\sigma=(3,\ 1,\ 0.5,\ 1,\ 3)$ in consistent units. Draw the noise not from a Gaussian but from a **Laplace distribution** scaled to match each $\sigma_i$ ($\operatorname{Var}=2b^2$ for scale parameter $b$, so $b_i=\sigma_i/\sqrt{2}$) — a distribution with the same mean and covariance as before but a sharp peak and heavy tails, confirmed below by an excess kurtosis near $3$ against the Gaussian's $0$.
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

Every diagonal entry of the simulated covariance matches its theoretical value to three significant figures at $N=400{,}000$ trials, for noise that is measurably not Gaussian. The unweighted fit needs about three times the trace of covariance — $3.06\times$ — to deliver what the weighted fit gets from the same five numbers; that ratio is the sandwich formula of the previous lesson evaluated once, and it is exactly what Gauss-Markov promises the weighted fit will never fall short of. Nothing about the Laplace shape entered the derivation of $\mathbf{P}$; only $\mathbf{R}$ did.

## What the theorem does not say

Three restrictions are doing real work in "best **linear unbiased** estimator," and each is worth stating plainly, because each is where it is tempting to read the theorem as promising more than it does.

**Linear.** A nonlinear rule can beat WLS in variance while staying unbiased — Gauss-Markov says nothing about the wider class of all unbiased estimators, only the linear ones. The next lesson identifies exactly when WLS also happens to be the best estimator of any kind: when the noise is Gaussian.

**Unbiased.** Allow a systematic offset and the comparison changes entirely. A biased estimator can have smaller *total* error — mean squared error, bias squared plus variance — than any unbiased one, by trading a little bias for a larger cut in variance. This sounds like a trick until you see a concrete case, which the lesson on maximum a posteriori estimation, later in this module, provides: folding in prior information shifts the estimate off the unbiased answer and very often reduces total error, particularly in the ill-conditioned problems where WLS variance is largest.

**Variance as the criterion.** BLUE minimizes variance, the right criterion when variance is what you act on — a $1\sigma$ error bar, a covariance handed to a filter. It says nothing about, for instance, the probability the error exceeds some hard threshold, which depends on the whole distribution of $\mathbf{v}$, not only on $\mathbf{R}$.

::: warning BLUE is not "the only good estimator"
It is easy to read Gauss-Markov as settling how to estimate $\mathbf{x}$, full stop. It settles the question only inside the linear-unbiased box. Robust estimators built to resist outliers, which this module returns to later, are deliberately nonlinear functions of the data and deliberately give up a little variance on good data to avoid catastrophic error on bad data. They are not attempting to beat Gauss-Markov and are not violating it either, because they are not competing inside its box.
:::

## Check yourself

::: check
State the Gauss-Markov theorem precisely: what class of estimators is being compared, what is being minimized, and what is the only assumption made about the measurement noise?
:::

::: answer
Among linear estimators $\hat{\mathbf{x}}=\mathbf{K}\mathbf{y}$ that are unbiased ($\mathbf{K}\mathbf{H}=\mathbf{I}$), the one with $\mathbf{K}=\mathbf{K}_0=(\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1}\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}$ minimizes $\operatorname{Cov}(\hat{\mathbf{x}})$ in the positive-semidefinite ordering: for every other unbiased linear $\mathbf{K}$, $\operatorname{Cov}(\hat{\mathbf{x}}) \succeq \mathbf{P} = (\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1}$. The only assumption on $\mathbf{v}$ is $\mathbb{E}[\mathbf{v}]=\mathbf{0}$ and $\operatorname{Cov}(\mathbf{v})=\mathbf{R}$; no assumption is made about the shape of its distribution.
:::

::: check
In the proof, $\operatorname{Cov}(\hat{\mathbf{x}}) = \mathbf{P} + \mathbf{D}\mathbf{R}\mathbf{D}^\mathsf{T}$. Explain why $\mathbf{D}\mathbf{R}\mathbf{D}^\mathsf{T}$ can never be negative definite, and state precisely when it is exactly zero.
:::

::: answer
For any vector $\mathbf{a}$, $\mathbf{a}^\mathsf{T}\mathbf{D}\mathbf{R}\mathbf{D}^\mathsf{T}\mathbf{a} = (\mathbf{D}^\mathsf{T}\mathbf{a})^\mathsf{T}\mathbf{R}(\mathbf{D}^\mathsf{T}\mathbf{a})$, a quadratic form in the positive definite matrix $\mathbf{R}$ evaluated at the vector $\mathbf{D}^\mathsf{T}\mathbf{a}$, which is $\ge 0$ because $\mathbf{R}\succ\mathbf{0}$; so $\mathbf{D}\mathbf{R}\mathbf{D}^\mathsf{T}$ is positive semidefinite for any $\mathbf{D}$ whatsoever. It is the zero matrix only when $\mathbf{D}=\mathbf{0}$: if any row $\mathbf{d}_i^\mathsf{T}$ of $\mathbf{D}$ were nonzero, then because $\mathbf{R}$ is positive definite $\mathbf{d}_i^\mathsf{T}\mathbf{R}\mathbf{d}_i>0$, a strictly positive number appearing on the diagonal of $\mathbf{D}\mathbf{R}\mathbf{D}^\mathsf{T}$. So the WLS gain $\mathbf{K}_0$ is not merely a minimizer of variance among unbiased linear estimators, it is the unique one.
:::

::: check
Two further independent estimates of the same scalar have $\sigma_1=5$ and $\sigma_2=15$. Compute the BLUE weight on the first estimate, the resulting variance and standard deviation, and compare to a simple $50/50$ average.
:::

::: answer
$\Lambda = 1/25 + 1/225 = 0.044444\,\mathrm{units^{-2}}$, so $P=1/\Lambda=22.5$ and $\sigma_{\hat x}=4.74$. The weight on the first estimate is $a^\star=(1/25)/\Lambda=0.9$: the noisier sensor, nine times the variance of the first, gets only a tenth of the say. A simple average has variance $0.25\times25+0.25\times225=62.5$, standard deviation $7.91$ — substantially worse, because it gives the much noisier sensor as much influence as the precise one.
:::

::: check
A colleague says "the Gauss-Markov theorem needs Gaussian noise, so it doesn't apply to my sensor, whose errors are clearly not bell-shaped." Are they right?
:::

::: answer
No. The theorem is named for Gauss and Markov, not for the Gaussian distribution, and its proof — the argument of this lesson — uses only the mean and covariance of the noise, never its shape. It applies exactly as stated to any zero-mean noise with a known covariance $\mathbf{R}$, bell-shaped or not, as the Laplace-noise simulation in this lesson confirms numerically. What *does* require Gaussian noise specifically is a different, stronger claim covered next: that WLS is not merely the best linear estimator but the best estimator of any kind.
:::

::: check
An engineer proposes hand-tuning the weights on a two-sensor fit to down-weight a sensor suspected of occasional glitches, even during normal operation when that sensor is healthy and $\mathbf{R}$ is as specified. Using the theorem, state the guaranteed cost of this choice when the sensor is in fact healthy, and explain why the engineer might still be right to make it.
:::

::: answer
Any deviation from $\mathbf{K}_0$ is some nonzero $\mathbf{D}$, and Gauss-Markov guarantees $\operatorname{Cov}(\hat{\mathbf{x}}) = \mathbf{P} + \mathbf{D}\mathbf{R}\mathbf{D}^\mathsf{T} \succ \mathbf{P}$ whenever $\mathbf{D}\ne\mathbf{0}$: in the nominal case, with $\mathbf{R}$ exactly as specified, the hand-tuned estimator is strictly worse, with a cost you could compute exactly from $\mathbf{D}\mathbf{R}\mathbf{D}^\mathsf{T}$. The guarantee, though, is conditional on $\mathbf{R}$ being the true noise covariance in every case, including the glitches. A sensor that occasionally produces an error far outside $\mathbf{R}$ is not described by $\mathbf{R}$ at all, and Gauss-Markov offers no protection against that model failure — accepting a known, quantified cost on healthy data to bound an unquantified cost on faulty data is a reasonable trade, and it is the same trade the robust-estimation lesson later in the module makes systematic.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\hat{\mathbf{x}}=\mathbf{K}\mathbf{y}$, $\mathbf{K}\mathbf{H}=\mathbf{I}$ | Linear unbiased estimator: the entire class Gauss-Markov compares |
| $\mathbf{K}=\mathbf{K}_0+\mathbf{D}$, $\mathbf{D}\mathbf{H}=\mathbf{0}$ | Every candidate is the WLS gain plus something that annihilates $\mathbf{H}$ |
| $\operatorname{Cov}(\hat{\mathbf{x}}) = \mathbf{P} + \mathbf{D}\mathbf{R}\mathbf{D}^\mathsf{T}$ | Covariance of any candidate; the second term is positive semidefinite, zero only at $\mathbf{D}=\mathbf{0}$ |
| $\operatorname{Cov}(\hat{\mathbf{x}}) \succeq \mathbf{P}$ | Gauss-Markov / BLUE: WLS with $\mathbf{W}=\mathbf{R}^{-1}$ has minimum covariance among linear unbiased estimators |
| Needs only $\mathbb{E}[\mathbf{v}]=\mathbf{0}$, $\operatorname{Cov}(\mathbf{v})=\mathbf{R}$ | No assumption on the shape of the noise distribution; confirmed here with Laplace noise |
| Does not cover | Nonlinear estimators, biased estimators, or criteria other than variance |

The theorem just proved is the best you can do with a *linear* rule. The next lesson asks what happens once the noise is actually assumed Gaussian, and finds that the same weighted least squares estimator stops being merely the best linear one and becomes the best estimator there is — the maximum likelihood estimator, with no "linear" qualifier attached.
