---
id: l02-three-derivations-of-the-kalman-filter
title: Three derivations of the Kalman filter
minutes: 24
covers:
  - "Three derivations of the Kalman filter: minimum variance/orthogonality, Bayesian Gaussian conditioning, recursive least squares"
---

Strip the Kalman filter of its time index and one problem remains. You hold a **prior**: a belief that the state is $\hat{\mathbf{x}}^-$ with covariance $\mathbf{P}^-$, so $\mathbf{x} \sim \mathcal{N}(\hat{\mathbf{x}}^-, \mathbf{P}^-)$. A measurement arrives, $\mathbf{z} = \mathbf{H}\mathbf{x} + \mathbf{v}$ with $\mathbf{v} \sim \mathcal{N}(\mathbf{0}, \mathbf{R})$ independent of the prior error. What should you now believe, and how sure should you be? Where the prior came from — the previous answer, propagated through the dynamics of the last lesson — is the subject of the next lesson. This one solves the single step.

It solves it three times, because the three derivations are asked for in three different interviews and, more usefully, each proves something the others do not. The **minimum-variance** derivation assumes only that the update is linear and unbiased, and delivers the gain by calculus; it proves the filter is the best linear estimator whatever the distributions, and it produces along the way the covariance formula that holds for *any* gain. The **Bayesian** derivation assumes Gaussians and computes the posterior density exactly; it proves the filter is the best of *all* estimators when the noise is Gaussian, and it produces the information form in which evidence adds. The **recursive least squares** derivation shows the update is a weighted least-squares fit with the prior as one more measurement, tying the filter to the whole least-squares module and exposing what process noise is really for.

All three arrive at the same gain. By the end you should be able to reproduce any of them on a whiteboard, and to say which assumption each one leans on.

## The one-step problem and the linear update

Write the prior error as $\mathbf{e}^- = \mathbf{x} - \hat{\mathbf{x}}^-$, zero-mean with covariance $\mathbf{P}^-$. Whatever update you choose, its raw material is the **innovation**, the part of the measurement the prior did not predict:

$$
\boldsymbol{\nu} = \mathbf{z} - \mathbf{H}\hat{\mathbf{x}}^- = \mathbf{H}\mathbf{e}^- + \mathbf{v}.
$$

(The probability module wrote this $\tilde{\mathbf{y}}$; the estimation literature and this module's flashcards write $\boldsymbol{\nu}$.) Its covariance follows from the independence of $\mathbf{e}^-$ and $\mathbf{v}$: $\mathbf{S} = \mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}} + \mathbf{R}$, the **innovation covariance**.

The first two derivations begin from the same ansatz: correct the prior by a linear function of the innovation,

$$
\hat{\mathbf{x}}^+ = \hat{\mathbf{x}}^- + \mathbf{K}\boldsymbol{\nu},
$$

with $\mathbf{K}$ an $n \times m$ **gain** to be chosen. The posterior error is

$$
\mathbf{e}^+ = \mathbf{x} - \hat{\mathbf{x}}^+ = \mathbf{e}^- - \mathbf{K}(\mathbf{H}\mathbf{e}^- + \mathbf{v}) = (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{e}^- - \mathbf{K}\mathbf{v}.
$$

It has zero mean for every $\mathbf{K}$, so the update is unbiased whatever gain you pick. Its covariance is the sandwich formula of the probability module applied to two independent terms:

::: key Posterior covariance for an arbitrary gain (Joseph form)
For any gain $\mathbf{K}$, $\mathbf{P}^+ = (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^-(\mathbf{I} - \mathbf{K}\mathbf{H})^{\mathsf{T}} + \mathbf{K}\mathbf{R}\mathbf{K}^{\mathsf{T}}$. It is a sum of two symmetric positive semi-definite terms, so it is symmetric and positive semi-definite by construction. Only at the optimal gain does it collapse to $(\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^-$.
:::

This is the **Joseph form**, and it is the honest answer to "how uncertain am I after applying gain $\mathbf{K}$?" for any $\mathbf{K}$ at all — the optimal one, a rounded one, a deliberately detuned one. Keep it in view; the numerically stable filters later in the module are built on it.

## Derivation one: minimum variance and orthogonality

Choose $\mathbf{K}$ to make the posterior error as small as possible in the mean-square sense: minimise $J(\mathbf{K}) = \mathbb{E}[\mathbf{e}^{+\mathsf{T}}\mathbf{e}^+] = \operatorname{tr}\mathbf{P}^+$. Expand the Joseph form and use $\mathbf{S} = \mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}} + \mathbf{R}$:

$$
J(\mathbf{K}) = \operatorname{tr}\mathbf{P}^- - 2\operatorname{tr}(\mathbf{K}\mathbf{H}\mathbf{P}^-) + \operatorname{tr}(\mathbf{K}\mathbf{S}\mathbf{K}^{\mathsf{T}}).
$$

Two rules of matrix calculus do the rest. For a matrix $\mathbf{B}$ of compatible size, $\partial\operatorname{tr}(\mathbf{K}\mathbf{B})/\partial\mathbf{K} = \mathbf{B}^{\mathsf{T}}$, and for symmetric $\mathbf{S}$, $\partial\operatorname{tr}(\mathbf{K}\mathbf{S}\mathbf{K}^{\mathsf{T}})/\partial\mathbf{K} = 2\mathbf{K}\mathbf{S}$. Both are the matrix versions of $d(kb)/dk = b$ and $d(sk^2)/dk = 2sk$, and you can confirm them by writing out a $2\times2$ case. Setting the gradient to zero,

$$
\frac{\partial J}{\partial\mathbf{K}} = -2\,(\mathbf{H}\mathbf{P}^-)^{\mathsf{T}} + 2\mathbf{K}\mathbf{S} = \mathbf{0}
\quad\Longrightarrow\quad
\mathbf{K} = \mathbf{P}^-\mathbf{H}^{\mathsf{T}}\mathbf{S}^{-1} = \mathbf{P}^-\mathbf{H}^{\mathsf{T}}\left(\mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}} + \mathbf{R}\right)^{-1}.
$$

The same gradient is often written directly from the Joseph form as $-2(\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^-\mathbf{H}^{\mathsf{T}} + 2\mathbf{K}\mathbf{R} = \mathbf{0}$; expand it and the two expressions are identical. Since $\mathbf{S}$ is positive definite, $J$ is a convex quadratic in $\mathbf{K}$ and this stationary point is its minimum.

::: key The Kalman gain from minimum variance
Minimising $\operatorname{tr}\mathbf{P}^+$ with $\mathbf{P}^+ = (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^-(\mathbf{I} - \mathbf{K}\mathbf{H})^{\mathsf{T}} + \mathbf{K}\mathbf{R}\mathbf{K}^{\mathsf{T}}$ over $\mathbf{K}$ gives $\mathbf{K} = \mathbf{P}^-\mathbf{H}^{\mathsf{T}}(\mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}} + \mathbf{R})^{-1}$. Substituting it back collapses the Joseph form to $\mathbf{P}^+ = (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^-$.
:::

The collapse is worth doing by hand, because it shows exactly where the simplified formula stops being true. Expand the Joseph form as $(\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^- - (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^-\mathbf{H}^{\mathsf{T}}\mathbf{K}^{\mathsf{T}} + \mathbf{K}\mathbf{R}\mathbf{K}^{\mathsf{T}}$ and collect the last two terms:

$$
-\left[\mathbf{P}^-\mathbf{H}^{\mathsf{T}} - \mathbf{K}\mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}} - \mathbf{K}\mathbf{R}\right]\mathbf{K}^{\mathsf{T}}
= -\left[\mathbf{P}^-\mathbf{H}^{\mathsf{T}} - \mathbf{K}\mathbf{S}\right]\mathbf{K}^{\mathsf{T}}.
$$

At the optimal gain $\mathbf{K}\mathbf{S} = \mathbf{P}^-\mathbf{H}^{\mathsf{T}}$, so the bracket vanishes and $\mathbf{P}^+ = (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^-$. For any other gain the bracket does not vanish, and the simplified formula is not the covariance of anything.

### The orthogonality principle

The bracket that vanished has a meaning. Compute the cross-covariance between the posterior error and the innovation:

$$
\mathbb{E}[\mathbf{e}^+\boldsymbol{\nu}^{\mathsf{T}}] = \mathbb{E}\left[\left((\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{e}^- - \mathbf{K}\mathbf{v}\right)\left(\mathbf{H}\mathbf{e}^- + \mathbf{v}\right)^{\mathsf{T}}\right]
= (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^-\mathbf{H}^{\mathsf{T}} - \mathbf{K}\mathbf{R} = \mathbf{P}^-\mathbf{H}^{\mathsf{T}} - \mathbf{K}\mathbf{S}.
$$

It is zero exactly at the Kalman gain. This is the **orthogonality principle**: the optimal estimate leaves an error that is uncorrelated with the data it was built from. If any correlation remained, a further linear correction could use it to shrink the error, so the estimate was not optimal. Geometrically the estimate is the projection of $\mathbf{x}$ onto the space spanned by the measurements, and the error is the perpendicular. Solving $\mathbb{E}[\mathbf{e}^+\boldsymbol{\nu}^{\mathsf{T}}] = \mathbf{0}$ for $\mathbf{K}$ is a one-line derivation of the gain, and it is the derivation that later explains why a healthy filter's innovation sequence is white.

Nothing in this derivation used Gaussianity. Only means and covariances entered, so the result holds for any zero-mean noise: among all *linear* unbiased updates, the Kalman gain has the smallest error covariance — it is the BLUE of the least-squares module, applied to a prior and a measurement. What Gaussianity adds is the subject of the second derivation.

::: example A scalar update three ways, and the cost of a wrong gain
A prior says a range is $10\,\mathrm{m}$ with variance $P^- = 4\,\mathrm{m^2}$; a sensor with $R = 1\,\mathrm{m^2}$ reads $z = 13\,\mathrm{m}$. With $H = 1$, $S = 4 + 1 = 5$ and $K = 4/5 = 0.8$, so $\hat{x}^+ = 10 + 0.8\times3 = 12.4\,\mathrm{m}$ and $P^+ = (1 - 0.8)\times4 = 0.8\,\mathrm{m^2}$. The estimate moved $80\%$ of the way to the measurement, because the measurement is four times more precise than the prior, and the posterior variance is smaller than either.

Now tabulate the Joseph form $P^+(K) = (1-K)^2P^- + K^2R$ against the simplified formula $(1-K)P^-$ for a range of gains:

| $K$ | $0.5$ | $0.7$ | $0.8$ | $0.9$ | $1.0$ |
| --- | --- | --- | --- | --- | --- |
| true $P^+(K)$ | $1.25$ | $0.85$ | $0.80$ | $0.85$ | $1.00$ |
| $(1-K)P^-$ | $2.00$ | $1.20$ | $0.80$ | $0.40$ | $0.00$ |

The true posterior variance is a parabola with its minimum $0.80$ at $K = 0.8$, and the two formulas agree only there. At $K = 1$ the update copies the measurement, so the error is the sensor's error and $P^+ = R = 1$; the simplified formula reports zero. At $K = 0.9$ it claims $0.40$ against a true $0.85$: a filter using an approximate gain with the simplified formula would believe itself twice as good as it is. That is the entire argument for the Joseph form, in one row of a table.
:::

## Derivation two: Bayesian conditioning of Gaussians

Now assume the distributions. The prior density is $p(\mathbf{x}) \propto \exp\left(-\tfrac12(\mathbf{x} - \hat{\mathbf{x}}^-)^{\mathsf{T}}\mathbf{P}^{-\,-1}(\mathbf{x} - \hat{\mathbf{x}}^-)\right)$ and the likelihood, the density of the measurement given the state, is $p(\mathbf{z}\mid\mathbf{x}) \propto \exp\left(-\tfrac12(\mathbf{z} - \mathbf{H}\mathbf{x})^{\mathsf{T}}\mathbf{R}^{-1}(\mathbf{z} - \mathbf{H}\mathbf{x})\right)$. Bayes' theorem gives the posterior as their product, up to a constant that does not depend on $\mathbf{x}$:

$$
-2\ln p(\mathbf{x}\mid\mathbf{z}) = (\mathbf{x} - \hat{\mathbf{x}}^-)^{\mathsf{T}}\mathbf{P}^{-\,-1}(\mathbf{x} - \hat{\mathbf{x}}^-) + (\mathbf{z} - \mathbf{H}\mathbf{x})^{\mathsf{T}}\mathbf{R}^{-1}(\mathbf{z} - \mathbf{H}\mathbf{x}) + \text{const}.
$$

The right-hand side is a quadratic in $\mathbf{x}$, so the posterior is Gaussian, and its mean and covariance can be read off by collecting terms. Expanding and keeping the terms that involve $\mathbf{x}$:

$$
\mathbf{x}^{\mathsf{T}}\left(\mathbf{P}^{-\,-1} + \mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{H}\right)\mathbf{x} - 2\,\mathbf{x}^{\mathsf{T}}\left(\mathbf{P}^{-\,-1}\hat{\mathbf{x}}^- + \mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{z}\right) + \text{const}.
$$

A Gaussian with mean $\boldsymbol{\mu}$ and covariance $\boldsymbol{\Sigma}$ has $-2\ln p = \mathbf{x}^{\mathsf{T}}\boldsymbol{\Sigma}^{-1}\mathbf{x} - 2\mathbf{x}^{\mathsf{T}}\boldsymbol{\Sigma}^{-1}\boldsymbol{\mu} + \text{const}$. Matching the quadratic and linear terms:

::: key The update in information form
$(\mathbf{P}^+)^{-1} = (\mathbf{P}^-)^{-1} + \mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{H}$ and $\hat{\mathbf{x}}^+ = \mathbf{P}^+\left((\mathbf{P}^-)^{-1}\hat{\mathbf{x}}^- + \mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{z}\right)$. Inverse covariances — **information** — add; the posterior mean is the information-weighted average of the prior and the measurement.
:::

This is the same update as the gain form, wearing different clothes. The bridge is the **matrix inversion lemma**, which you can verify by multiplying out: with $\mathbf{K} = \mathbf{P}^-\mathbf{H}^{\mathsf{T}}\mathbf{S}^{-1}$,

$$
\left((\mathbf{P}^-)^{-1} + \mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{H}\right)^{-1} = \mathbf{P}^- - \mathbf{P}^-\mathbf{H}^{\mathsf{T}}\left(\mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}} + \mathbf{R}\right)^{-1}\mathbf{H}\mathbf{P}^- = (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^-.
$$

To check it, multiply the right-hand side by $(\mathbf{P}^-)^{-1} + \mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{H}$: the product is $\mathbf{I} + \mathbf{P}^-\mathbf{H}^{\mathsf{T}}\mathbf{S}^{-1}\left[\mathbf{S}\mathbf{R}^{-1} - \mathbf{I} - \mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\right]\mathbf{H}$, and since $\mathbf{S}\mathbf{R}^{-1} = \mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1} + \mathbf{I}$ the bracket is zero. For the mean, $\hat{\mathbf{x}}^+ = \mathbf{P}^+(\mathbf{P}^-)^{-1}\hat{\mathbf{x}}^- + \mathbf{P}^+\mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{z} = (\mathbf{I} - \mathbf{K}\mathbf{H})\hat{\mathbf{x}}^- + \mathbf{P}^+\mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{z}$, and a short computation shows $\mathbf{P}^+\mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1} = \mathbf{K}$: expand $(\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^-\mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1} = [\mathbf{P}^-\mathbf{H}^{\mathsf{T}} - \mathbf{K}(\mathbf{S} - \mathbf{R})]\mathbf{R}^{-1} = [\mathbf{P}^-\mathbf{H}^{\mathsf{T}} - \mathbf{K}\mathbf{S} + \mathbf{K}\mathbf{R}]\mathbf{R}^{-1} = \mathbf{K}$, using $\mathbf{K}\mathbf{S} = \mathbf{P}^-\mathbf{H}^{\mathsf{T}}$ once more. So $\hat{\mathbf{x}}^+ = (\mathbf{I} - \mathbf{K}\mathbf{H})\hat{\mathbf{x}}^- + \mathbf{K}\mathbf{z} = \hat{\mathbf{x}}^- + \mathbf{K}\boldsymbol{\nu}$, the gain form.

Notice what the Bayesian route did *not* need: an ansatz. It never assumed the update was linear; it computed the exact posterior, and the posterior mean *turned out* to be linear in $\mathbf{z}$. Since the posterior mean is the minimum mean-square-error estimate for any distribution, the Kalman update is optimal among all estimators — linear or not — when the noise is Gaussian. It also shows a peculiarity of Gaussians the next lessons exploit: $\mathbf{P}^+$ does not depend on $\mathbf{z}$. How much you learn from a measurement is fixed before the measurement is read; only what you learn depends on its value. The probability module's Gaussian-conditioning formula, applied to the stacked vector $(\mathbf{x}, \mathbf{z})$, gives the same result in one line, and is the version to reach for when the joint covariance is already in hand.

The identity $\mathbf{K} = \mathbf{P}^+\mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}$ is worth keeping as an alternative form of the gain: posterior uncertainty times measurement precision. It is the form that makes the correlated-noise and information-filter lessons short.

## Derivation three: recursive least squares

The least-squares module solved $\mathbf{z} = \mathbf{H}\mathbf{x} + \mathbf{v}$ by weighted least squares: minimise $(\mathbf{z} - \mathbf{H}\mathbf{x})^{\mathsf{T}}\mathbf{W}(\mathbf{z} - \mathbf{H}\mathbf{x})$ with $\mathbf{W} = \mathbf{R}^{-1}$, giving $\hat{\mathbf{x}} = (\mathbf{H}^{\mathsf{T}}\mathbf{W}\mathbf{H})^{-1}\mathbf{H}^{\mathsf{T}}\mathbf{W}\mathbf{z}$ with covariance $(\mathbf{H}^{\mathsf{T}}\mathbf{W}\mathbf{H})^{-1}$, the inverse of the information matrix. Treat the prior as one more measurement. The statement "$\mathbf{x}$ is $\hat{\mathbf{x}}^-$ give or take $\mathbf{P}^-$" is the observation $\hat{\mathbf{x}}^- = \mathbf{I}\mathbf{x} + \mathbf{e}^-$ with noise covariance $\mathbf{P}^-$. Stack it on top of the real measurement:

$$
\begin{pmatrix} \hat{\mathbf{x}}^- \\ \mathbf{z} \end{pmatrix} = \begin{pmatrix} \mathbf{I} \\ \mathbf{H} \end{pmatrix}\mathbf{x} + \begin{pmatrix} \mathbf{e}^- \\ \mathbf{v} \end{pmatrix}, \qquad
\mathbf{W} = \begin{pmatrix} (\mathbf{P}^-)^{-1} & \mathbf{0} \\ \mathbf{0} & \mathbf{R}^{-1} \end{pmatrix}.
$$

Weighted least squares on the stacked system gives information matrix $\mathbf{I}^{\mathsf{T}}(\mathbf{P}^-)^{-1}\mathbf{I} + \mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{H}$ and estimate $\left((\mathbf{P}^-)^{-1} + \mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{H}\right)^{-1}\left((\mathbf{P}^-)^{-1}\hat{\mathbf{x}}^- + \mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{z}\right)$ — the information form of the previous section, term for term, and hence the gain form by the same lemma. The cost being minimised is the sum of the two weighted residuals, prior and measurement, which is the maximum a posteriori estimate of the least-squares module: the Kalman update *is* MAP estimation with a Gaussian prior, and for Gaussians MAP, minimum variance and the conditional mean coincide.

Run this recursively — take the posterior as the next prior and stack the next measurement — and you have **recursive least squares**, the least-squares module's RLS, whose gain has exactly the Kalman form. Two things distinguish the Kalman filter from RLS, and both are in the propagation step the next lesson adds. The state moves between measurements, so the prior is $\mathbf{F}\hat{\mathbf{x}}^+$ rather than $\hat{\mathbf{x}}^+$. And process noise is added, so the prior covariance is $\mathbf{F}\mathbf{P}^+\mathbf{F}^{\mathsf{T}} + \mathbf{Q}$ rather than $\mathbf{P}^+$. Set $\mathbf{F} = \mathbf{I}$ and $\mathbf{Q} = \mathbf{0}$ and the Kalman filter is RLS. Keep $\mathbf{F} = \mathbf{I}$ but let $\mathbf{Q} > 0$ and it is RLS for a quantity that is admitted to be drifting: the information stops accumulating without bound, the covariance stops shrinking to zero, and the filter keeps listening. That is what process noise is for. The RLS variant with a forgetting factor is a cruder way of achieving the same thing, and this module's divergence lesson returns to it as fading memory.

::: example A position measurement that corrects a velocity
A vehicle's prior is $\hat{\mathbf{x}}^- = (100\,\mathrm{m},\ 5\,\mathrm{m/s})^{\mathsf{T}}$ with

$$
\mathbf{P}^- = \begin{pmatrix} 4 & 1 \\ 1 & 1 \end{pmatrix}
$$

in $\mathrm{m^2}$, $\mathrm{m^2/s}$ and $\mathrm{m^2/s^2}$: $\sigma_p = 2\,\mathrm{m}$, $\sigma_v = 1\,\mathrm{m/s}$, correlation $0.5$. A position-only sensor, $\mathbf{H} = (1\ \ 0)$ and $R = 1\,\mathrm{m^2}$, reads $z = 103\,\mathrm{m}$.

*Gain form.* $\mathbf{P}^-\mathbf{H}^{\mathsf{T}} = (4,\ 1)^{\mathsf{T}}$, $S = 4 + 1 = 5$, so $\mathbf{K} = (0.8,\ 0.2)^{\mathsf{T}}$. The innovation is $\nu = 103 - 100 = 3\,\mathrm{m}$ and $\hat{\mathbf{x}}^+ = (100 + 2.4,\ 5 + 0.6) = (102.4\,\mathrm{m},\ 5.6\,\mathrm{m/s})$. The velocity, which no sensor measured, moved by $0.6\,\mathrm{m/s}$, because the prior said a position error and a velocity error tend to come together. Then $\mathbf{I} - \mathbf{K}\mathbf{H} = \begin{pmatrix} 0.2 & 0 \\ -0.2 & 1 \end{pmatrix}$ and

$$
\mathbf{P}^+ = (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^- = \begin{pmatrix} 0.8 & 0.2 \\ 0.2 & 0.8 \end{pmatrix}.
$$

*Information form.* $(\mathbf{P}^-)^{-1} = \tfrac13\begin{pmatrix} 1 & -1 \\ -1 & 4 \end{pmatrix}$, and $\mathbf{H}^{\mathsf{T}}R^{-1}\mathbf{H}$ adds $1$ to the top-left entry, so $(\mathbf{P}^+)^{-1} = \tfrac13\begin{pmatrix} 4 & -1 \\ -1 & 4 \end{pmatrix}$. Its determinant is $15/9$ and its inverse is $\tfrac{3}{5}\begin{pmatrix} 4/3 & 1/3 \\ 1/3 & 4/3 \end{pmatrix} = \begin{pmatrix} 0.8 & 0.2 \\ 0.2 & 0.8 \end{pmatrix}$, the same matrix. The mean: $(\mathbf{P}^-)^{-1}\hat{\mathbf{x}}^- + \mathbf{H}^{\mathsf{T}}R^{-1}z = \tfrac13(100 - 5,\ -100 + 20)^{\mathsf{T}} + (103,\ 0)^{\mathsf{T}} = (134.667,\ -26.667)^{\mathsf{T}}$, and $\mathbf{P}^+$ times that is $(102.4,\ 5.6)^{\mathsf{T}}$.

*Least squares.* Stacking the prior as two pseudo-measurements with weight $(\mathbf{P}^-)^{-1}$ above the real one with weight $1$ and solving the normal equations returns $(102.4,\ 5.6)$ and the same $\mathbf{P}^+$; the code below does it.

The posterior standard deviations are $0.894\,\mathrm{m}$ and $0.894\,\mathrm{m/s}$, and the correlation has fallen from $0.5$ to $0.25$: the measurement explained part of the shared error. Finally the orthogonality check: $(\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^-\mathbf{H}^{\mathsf{T}} - \mathbf{K}R = (0.8,\ 0.2)^{\mathsf{T}} - (0.8,\ 0.2)^{\mathsf{T}} = \mathbf{0}$. Try instead the plausible-looking gain $\mathbf{K}' = (0.5,\ 0.5)^{\mathsf{T}}$: the cross-covariance is $(1.5,\ -1.5)^{\mathsf{T}}$, the Joseph form gives $\operatorname{tr}\mathbf{P}^+ = 2.5$ against the optimal $1.6$, and the simplified formula returns $\begin{pmatrix} 2 & 0.5 \\ -1 & 0.5 \end{pmatrix}$, which is not even symmetric.
:::

```python
import numpy as np

P_prior = np.array([[4.0, 1.0], [1.0, 1.0]])
x_prior = np.array([100.0, 5.0])
H = np.array([[1.0, 0.0]]); R = np.array([[1.0]]); z = np.array([103.0])

# gain form
S = H @ P_prior @ H.T + R
K = P_prior @ H.T @ np.linalg.inv(S)
x_gain = x_prior + K @ (z - H @ x_prior)
P_gain = (np.eye(2) - K @ H) @ P_prior

# information form
Y = np.linalg.inv(P_prior) + H.T @ np.linalg.inv(R) @ H
x_info = np.linalg.solve(Y, np.linalg.solve(P_prior, x_prior) + H.T @ np.linalg.solve(R, z))

# weighted least squares with the prior stacked as a pseudo-measurement
H_s = np.vstack([np.eye(2), H])
z_s = np.concatenate([x_prior, z])
W = np.linalg.inv(np.block([[P_prior, np.zeros((2, 1))], [np.zeros((1, 2)), R]]))
x_wls = np.linalg.solve(H_s.T @ W @ H_s, H_s.T @ W @ z_s)

print(K.ravel(), x_gain, x_info, x_wls)
print(P_gain, np.linalg.inv(Y), np.linalg.inv(H_s.T @ W @ H_s), sep="\n")
# [0.8 0.2] [102.4   5.6] [102.4   5.6] [102.4   5.6]
# [[0.8 0.2]
#  [0.2 0.8]]   (three times)
```

## What each derivation proves

| Derivation | Assumes | Proves | Generalises to |
| --- | --- | --- | --- |
| Minimum variance / orthogonality | Linear unbiased update; known means and covariances | Best *linear* estimator for any noise distribution; Joseph form for any gain; error orthogonal to data | Suboptimal and constrained gains, consider filters, error analysis of mistuned filters |
| Bayesian Gaussian conditioning | Gaussian prior and noise | Exact posterior; best of *all* estimators; information adds; $\mathbf{P}^+$ independent of $\mathbf{z}$ | Nonlinear and non-Gaussian filters (the EKF, UKF and particle filters approximate this step) |
| Recursive least squares | Weighted least squares with the prior as a pseudo-measurement | Update equals MAP estimation; filter equals RLS plus dynamics and process noise | Batch orbit determination, information filters, smoothers |

::: warning The simplified covariance is a theorem, not a formula
$\mathbf{P}^+ = (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^-$ was *derived* by substituting the optimal gain into the Joseph form. It is the covariance of the posterior error only when $\mathbf{K}$ is exactly $\mathbf{P}^-\mathbf{H}^{\mathsf{T}}\mathbf{S}^{-1}$ — computed in exact arithmetic from the same $\mathbf{P}^-$. With a rounded gain, a gain read from a table, a gain deliberately reduced, or a $\mathbf{P}^-$ that has drifted from symmetry, it reports a number that is not a variance and can be negative. The Joseph form costs about twice the multiplications and is never wrong.
:::

::: note Three names for one quantity
The estimation literature calls $\hat{\mathbf{x}}^+$ the minimum mean-square-error estimate, the maximum a posteriori estimate, the conditional mean and the linear least-squares estimate, depending on which derivation the author has in mind. For a linear model with Gaussian noise the four are the same vector. The distinctions matter only once the model is nonlinear or the noise is not Gaussian, when they part company and each generalises differently.
:::

## Check yourself

::: check
For the scalar case $H = 1$, derive the gain by minimising the Joseph form directly, and state what the second derivative tells you.
:::

::: answer
$P^+(K) = (1-K)^2P^- + K^2R$. Differentiating, $dP^+/dK = -2(1-K)P^- + 2KR = 0$ gives $K(P^- + R) = P^-$, so $K = P^-/(P^- + R)$. The second derivative is $2(P^- + R) > 0$, so the stationary point is a minimum, and the minimum value is $(1-K)^2P^- + K^2R = P^-R/(P^- + R) = (1-K)P^-$, the simplified form. In the two-state example this is exactly what the table showed: a parabola in $K$ with its floor at the Kalman gain.
:::

::: check
Show that $\mathbf{P}^+\mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1} = \mathbf{K}$, and say in words what this form of the gain means.
:::

::: answer
With $\mathbf{P}^+ = (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^-$, $\mathbf{P}^+\mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1} = [\mathbf{P}^-\mathbf{H}^{\mathsf{T}} - \mathbf{K}\mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}}]\mathbf{R}^{-1}$. Write $\mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}} = \mathbf{S} - \mathbf{R}$ to get $[\mathbf{P}^-\mathbf{H}^{\mathsf{T}} - \mathbf{K}\mathbf{S} + \mathbf{K}\mathbf{R}]\mathbf{R}^{-1}$, and since $\mathbf{K}\mathbf{S} = \mathbf{P}^-\mathbf{H}^{\mathsf{T}}$ the first two terms cancel, leaving $\mathbf{K}\mathbf{R}\mathbf{R}^{-1} = \mathbf{K}$. In words: the gain is the posterior uncertainty of the state, mapped into measurement space by $\mathbf{H}^{\mathsf{T}}$, times the precision of the measurement. A measurement is weighted by how precise it is and by how uncertain you remain after using it — a precise sensor still gets little weight on a state you already know well.
:::

::: check
A measurement becomes perfect, $\mathbf{R} \to \mathbf{0}$. What happens to each form of the update, and which one would you implement?
:::

::: answer
In the gain form $\mathbf{K} \to \mathbf{P}^-\mathbf{H}^{\mathsf{T}}(\mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}})^{-1}$, which is finite as long as $\mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}}$ is invertible; for the scalar example with $R = 10^{-6}$ it gives $K = 0.99999975$ and $P^+ = 1.0\times10^{-6}$, the posterior inheriting the measurement's variance as it should. In the information form $\mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{H}$ grows without bound and the addition is numerically useless. The situation reverses when there is *no prior*, $\mathbf{P}^- \to \infty$: the gain form cannot represent an infinite covariance while the information form takes $(\mathbf{P}^-)^{-1} = \mathbf{0}$ without complaint. Implement the gain form for precise measurements and the information form for weak or absent priors; the information-filter lesson makes this choice systematic.
:::

::: check
The noise is known to be non-Gaussian — an altimeter with heavy-tailed returns. Which of the three derivations still holds, and what exactly is lost?
:::

::: answer
The minimum-variance derivation survives intact, because it used only the means and covariances of $\mathbf{e}^-$ and $\mathbf{v}$: the Kalman gain is still the best *linear* unbiased update and the Joseph form is still its exact covariance. The least-squares derivation survives as an algorithm but loses its MAP interpretation, since the cost is no longer the negative log posterior. The Bayesian derivation is what fails: the true posterior is not Gaussian, its mean is not linear in $\mathbf{z}$, and a nonlinear estimator can beat the Kalman update. What is lost is optimality among all estimators, and — more dangerously in practice — the heavy tails mean a single outlier moves the linear estimate far more than a Gaussian model expects, which is why real filters gate their measurements.
:::

::: check
Repeat the two-state example with the correlation reversed, $\mathbf{P}^- = \begin{pmatrix} 4 & -1 \\ -1 & 1 \end{pmatrix}$, same prior mean and same measurement. What changes?
:::

::: answer
$\mathbf{P}^-\mathbf{H}^{\mathsf{T}} = (4,\ -1)^{\mathsf{T}}$ and $S = 5$ again, so $\mathbf{K} = (0.8,\ -0.2)^{\mathsf{T}}$. The position update is unchanged, $102.4\,\mathrm{m}$, but the velocity now moves the other way: $5 - 0.2\times3 = 4.4\,\mathrm{m/s}$. The covariance becomes $\mathbf{P}^+ = \begin{pmatrix} 0.8 & -0.2 \\ -0.2 & 0.8 \end{pmatrix}$: the same variances, the same amount learned, with the sign of the remaining correlation flipped. The magnitude of what a measurement teaches about an unmeasured state is set by the size of the correlation; the direction of the correction is set by its sign. Both come from $\mathbf{P}^-$, which is why a wrong off-diagonal entry in the covariance corrupts states no sensor touches.
:::

## Summary

| Item | Statement |
| --- | --- |
| One-step problem | Prior $\mathbf{x} \sim \mathcal{N}(\hat{\mathbf{x}}^-, \mathbf{P}^-)$, measurement $\mathbf{z} = \mathbf{H}\mathbf{x} + \mathbf{v}$, $\mathbf{v} \sim \mathcal{N}(\mathbf{0}, \mathbf{R})$ independent of the prior error |
| Innovation | $\boldsymbol{\nu} = \mathbf{z} - \mathbf{H}\hat{\mathbf{x}}^-$, covariance $\mathbf{S} = \mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}} + \mathbf{R}$ |
| Linear update | $\hat{\mathbf{x}}^+ = \hat{\mathbf{x}}^- + \mathbf{K}\boldsymbol{\nu}$; error $\mathbf{e}^+ = (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{e}^- - \mathbf{K}\mathbf{v}$, unbiased for any $\mathbf{K}$ |
| Joseph form | $\mathbf{P}^+ = (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^-(\mathbf{I} - \mathbf{K}\mathbf{H})^{\mathsf{T}} + \mathbf{K}\mathbf{R}\mathbf{K}^{\mathsf{T}}$, valid for any gain |
| Minimum variance | $\partial\operatorname{tr}\mathbf{P}^+/\partial\mathbf{K} = -2(\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^-\mathbf{H}^{\mathsf{T}} + 2\mathbf{K}\mathbf{R} = \mathbf{0}$ gives $\mathbf{K} = \mathbf{P}^-\mathbf{H}^{\mathsf{T}}(\mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}} + \mathbf{R})^{-1}$ |
| Orthogonality | $\mathbb{E}[\mathbf{e}^+\boldsymbol{\nu}^{\mathsf{T}}] = \mathbf{P}^-\mathbf{H}^{\mathsf{T}} - \mathbf{K}\mathbf{S} = \mathbf{0}$ at the optimum; the error is orthogonal to the data |
| Simplified covariance | $\mathbf{P}^+ = (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^-$, true only at the optimal gain |
| Information form | $(\mathbf{P}^+)^{-1} = (\mathbf{P}^-)^{-1} + \mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{H}$, $\hat{\mathbf{x}}^+ = \mathbf{P}^+((\mathbf{P}^-)^{-1}\hat{\mathbf{x}}^- + \mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{z})$ |
| Matrix inversion lemma | $((\mathbf{P}^-)^{-1} + \mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{H})^{-1} = \mathbf{P}^- - \mathbf{P}^-\mathbf{H}^{\mathsf{T}}\mathbf{S}^{-1}\mathbf{H}\mathbf{P}^-$ |
| Alternative gain | $\mathbf{K} = \mathbf{P}^+\mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}$: posterior uncertainty times measurement precision |
| Least-squares view | The prior is a pseudo-measurement $\hat{\mathbf{x}}^- = \mathbf{x} + \mathbf{e}^-$ with weight $(\mathbf{P}^-)^{-1}$; the update is MAP; with $\mathbf{F} = \mathbf{I}$, $\mathbf{Q} = \mathbf{0}$ the filter is RLS |

The single step is solved. The next lesson puts the time index back: the posterior is propagated through $\mathbf{F}$ and $\mathbf{Q}$ to become the next prior, and the pair of steps, repeated, is the Kalman filter — run in full on a descending vehicle, with every number reported.
