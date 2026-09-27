---
id: l02-three-derivations-of-the-kalman-filter
title: Three derivations of the Kalman filter
minutes: 20
covers:
  - "Three derivations of the Kalman filter: minimum variance/orthogonality, Bayesian Gaussian conditioning, recursive least squares"
---

Two friends pace out the distance to a tree. One is careful and says $13\,\mathrm{m}$. The other is sloppy and says $10\,\mathrm{m}$. You would not take the plain average. You would lean toward the careful friend, because her number is more trustworthy. How far should you lean? If you know how wobbly each friend is, there is an exact best answer. This lesson finds it.

Take away the clock ticking in a Kalman filter and exactly that problem is left. You hold a **[[prior|prior-posterior]]**: a belief, before the new reading, that the state is $\hat{\mathbf{x}}^-$ ("x hat minus") with covariance $\mathbf{P}^-$. In symbols, $\mathbf{x} \sim \mathcal{N}(\hat{\mathbf{x}}^-, \mathbf{P}^-)$. A measurement arrives, $\mathbf{z} = \mathbf{H}\mathbf{x} + \mathbf{v}$, with $\mathbf{v} \sim \mathcal{N}(\mathbf{0}, \mathbf{R})$ independent of the prior's error. What should you believe now, and how sure should you be? The answer is the **posterior**, written with a plus: $\hat{\mathbf{x}}^+$ and $\mathbf{P}^+$. Where the prior came from is the next lesson's job. This one solves the single step.

It solves it three times. Interviewers ask for each of the three derivations, and more usefully, each proves something the others do not:

- **Minimum variance** assumes only that the update is linear and unbiased, and finds the gain by calculus. It proves the filter is the best *linear* estimator whatever the noise looks like, and gives a covariance formula valid for *any* gain.
- **Bayesian** assumes Gaussians and computes the exact answer. It proves the filter is the best of *all* estimators when the noise is Gaussian, and gives the form in which evidence adds.
- **Recursive least squares** shows the update is a weighted least-squares fit, with the prior counted as one more measurement. It ties the filter to the least-squares module and shows what process noise is really for.

All three land on the same gain. By the end you should be able to reproduce any of them on a whiteboard, and say which assumption each one leans on.

## The one-step problem and the linear update

Call the prior's error $\mathbf{e}^- = \mathbf{x} - \hat{\mathbf{x}}^-$. It averages to zero and has covariance $\mathbf{P}^-$.

Whatever update you pick, its raw material is the **[[innovation|innovation-word]]**: the part of the reading the prior did not predict. Read $\boldsymbol{\nu}$ as "nu":

$$
\boldsymbol{\nu} = \mathbf{z} - \mathbf{H}\hat{\mathbf{x}}^- = \mathbf{H}\mathbf{e}^- + \mathbf{v}.
$$

(The probability module wrote it $\tilde{\mathbf{y}}$; this module's flashcards write $\boldsymbol{\nu}$.) The second form comes from putting $\mathbf{z} = \mathbf{H}\mathbf{x} + \mathbf{v}$ in the first. Its covariance adds the two independent pieces: $\mathbf{S} = \mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}} + \mathbf{R}$, the **innovation covariance**.

The first two derivations start from the same guess about the shape of the answer: correct the prior by some matrix times the innovation,

$$
\hat{\mathbf{x}}^+ = \hat{\mathbf{x}}^- + \mathbf{K}\boldsymbol{\nu}.
$$

The $n \times m$ matrix $\mathbf{K}$ is the **gain**, still to be chosen. In the tree story, it is how far you lean toward the new number. Subtract from the truth to get the posterior error:

$$
\mathbf{e}^+ = \mathbf{x} - \hat{\mathbf{x}}^+ = \mathbf{e}^- - \mathbf{K}(\mathbf{H}\mathbf{e}^- + \mathbf{v}) = (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{e}^- - \mathbf{K}\mathbf{v}.
$$

Both pieces average to zero, so $\mathbf{e}^+$ does too, for *every* $\mathbf{K}$. The update is unbiased whatever gain you pick. Its covariance follows from the probability module's sandwich rule ($\operatorname{Cov}(\mathbf{M}\mathbf{a}) = \mathbf{M}\operatorname{Cov}(\mathbf{a})\mathbf{M}^{\mathsf{T}}$) applied to each independent piece:

::: key Posterior covariance for an arbitrary gain (Joseph form)
For any gain $\mathbf{K}$, $\mathbf{P}^+ = (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^-(\mathbf{I} - \mathbf{K}\mathbf{H})^{\mathsf{T}} + \mathbf{K}\mathbf{R}\mathbf{K}^{\mathsf{T}}$. It is a sum of two symmetric positive semi-definite terms, so it is symmetric and positive semi-definite by construction. Only at the optimal gain does it collapse to $(\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^-$.
:::

This is the **[[Joseph form|joseph-name]]**. It is the honest answer to "how unsure am I after applying gain $\mathbf{K}$?" for *any* $\mathbf{K}$: the best one, a rounded one, or one deliberately turned down. Keep it in view. The numerically safe filters later in the module are built on it.

## Derivation one: minimum variance and orthogonality

Choose $\mathbf{K}$ to make the posterior error as small as possible on average. "Small" here means the mean of the squared error, added over all the states: $J(\mathbf{K}) = \mathbb{E}[\mathbf{e}^{+\mathsf{T}}\mathbf{e}^+] = \operatorname{tr}\mathbf{P}^+$. The **[[trace|trace-meaning]]** $\operatorname{tr}$ is the sum of a matrix's diagonal.

Multiply out the Joseph form and use $\mathbf{S} = \mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}} + \mathbf{R}$ to group the terms that have $\mathbf{K}$ on both sides:

$$
J(\mathbf{K}) = \operatorname{tr}\mathbf{P}^- - 2\operatorname{tr}(\mathbf{K}\mathbf{H}\mathbf{P}^-) + \operatorname{tr}(\mathbf{K}\mathbf{S}\mathbf{K}^{\mathsf{T}}).
$$

This is a bowl-shaped function of $\mathbf{K}$, like $s k^2 - 2bk + c$ for plain numbers. Find the bottom by setting the slope to zero. Two rules of matrix calculus do it:

- $\partial\operatorname{tr}(\mathbf{K}\mathbf{B})/\partial\mathbf{K} = \mathbf{B}^{\mathsf{T}}$, the matrix version of $d(kb)/dk = b$;
- for symmetric $\mathbf{S}$, $\partial\operatorname{tr}(\mathbf{K}\mathbf{S}\mathbf{K}^{\mathsf{T}})/\partial\mathbf{K} = 2\mathbf{K}\mathbf{S}$, the matrix version of $d(sk^2)/dk = 2sk$.

You can confirm both by writing out a $2\times2$ case. With $\mathbf{B} = \mathbf{H}\mathbf{P}^-$, set the slope to zero:

$$
\frac{\partial J}{\partial\mathbf{K}} = -2\,(\mathbf{H}\mathbf{P}^-)^{\mathsf{T}} + 2\mathbf{K}\mathbf{S} = \mathbf{0}
\quad\Longrightarrow\quad
\mathbf{K} = \mathbf{P}^-\mathbf{H}^{\mathsf{T}}\mathbf{S}^{-1} = \mathbf{P}^-\mathbf{H}^{\mathsf{T}}\left(\mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}} + \mathbf{R}\right)^{-1}.
$$

(The step used $(\mathbf{H}\mathbf{P}^-)^{\mathsf{T}} = \mathbf{P}^-\mathbf{H}^{\mathsf{T}}$, since $\mathbf{P}^-$ is symmetric; then multiply both sides by $\mathbf{S}^{-1}$ on the right.) The same slope is often written straight from the Joseph form as $-2(\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^-\mathbf{H}^{\mathsf{T}} + 2\mathbf{K}\mathbf{R} = \mathbf{0}$. Multiply it out and it is the same expression. Because $\mathbf{S}$ is positive definite, the bowl opens upward, so this flat spot is the minimum.

::: key The Kalman gain from minimum variance
Minimizing $\operatorname{tr}\mathbf{P}^+$ with $\mathbf{P}^+ = (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^-(\mathbf{I} - \mathbf{K}\mathbf{H})^{\mathsf{T}} + \mathbf{K}\mathbf{R}\mathbf{K}^{\mathsf{T}}$ over $\mathbf{K}$ gives $\mathbf{K} = \mathbf{P}^-\mathbf{H}^{\mathsf{T}}(\mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}} + \mathbf{R})^{-1}$. Substituting it back collapses the Joseph form to $\mathbf{P}^+ = (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^-$.
:::

::: note Why it has to be true: the collapse
Do this by hand once, because it shows exactly where the short formula stops being true. Multiply out the Joseph form as

$$
(\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^- - (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^-\mathbf{H}^{\mathsf{T}}\mathbf{K}^{\mathsf{T}} + \mathbf{K}\mathbf{R}\mathbf{K}^{\mathsf{T}}
$$

and collect the last two terms, pulling $\mathbf{K}^{\mathsf{T}}$ out on the right:

$$
-\left[\mathbf{P}^-\mathbf{H}^{\mathsf{T}} - \mathbf{K}\mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}} - \mathbf{K}\mathbf{R}\right]\mathbf{K}^{\mathsf{T}}
= -\left[\mathbf{P}^-\mathbf{H}^{\mathsf{T}} - \mathbf{K}\mathbf{S}\right]\mathbf{K}^{\mathsf{T}}.
$$

At the optimal gain $\mathbf{K}\mathbf{S} = \mathbf{P}^-\mathbf{H}^{\mathsf{T}}$, so the bracket is zero and $\mathbf{P}^+ = (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^-$. For any other gain the bracket is not zero, and the short formula is not the covariance of anything.
:::

### The orthogonality principle

The bracket that vanished has a meaning. Compute the cross-covariance between the posterior error and the innovation. Multiply the two expressions, and keep only the terms where independent pieces do not meet ($\mathbb{E}[\mathbf{e}^-\mathbf{e}^{-\mathsf{T}}] = \mathbf{P}^-$, $\mathbb{E}[\mathbf{v}\mathbf{v}^{\mathsf{T}}] = \mathbf{R}$, and the mixed terms are zero):

$$
\mathbb{E}[\mathbf{e}^+\boldsymbol{\nu}^{\mathsf{T}}] = \mathbb{E}\left[\left((\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{e}^- - \mathbf{K}\mathbf{v}\right)\left(\mathbf{H}\mathbf{e}^- + \mathbf{v}\right)^{\mathsf{T}}\right]
= (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^-\mathbf{H}^{\mathsf{T}} - \mathbf{K}\mathbf{R} = \mathbf{P}^-\mathbf{H}^{\mathsf{T}} - \mathbf{K}\mathbf{S}.
$$

It is zero exactly at the Kalman gain. This is the **orthogonality principle**: the best estimate leaves an error that is uncorrelated with the data it was built from. Why must that be so? If some correlation were left, you could use it: a further small correction along the innovation would shrink the error, so the estimate was not the best. In a picture, the estimate is the **[[projection|projection-picture]]** of $\mathbf{x}$ onto the data, and the error sticks out at a right angle.

Setting $\mathbb{E}[\mathbf{e}^+\boldsymbol{\nu}^{\mathsf{T}}] = \mathbf{0}$ and solving for $\mathbf{K}$ is a one-line derivation of the gain. It is also the derivation that later explains why a healthy filter's innovations are white.

Nothing here used the bell curve. Only means and covariances appeared, so the result holds for any zero-mean noise. Among all *linear* unbiased updates, the Kalman gain gives the smallest error covariance: it is the BLUE of the least-squares module, applied to a prior and a measurement.

::: example A scalar update, and the cost of a wrong gain
A prior says a range is $10\,\mathrm{m}$ with variance $P^- = 4\,\mathrm{m^2}$ (so $\sigma = 2\,\mathrm{m}$). A sensor with $R = 1\,\mathrm{m^2}$ reads $z = 13\,\mathrm{m}$. With $H = 1$:

- innovation covariance $S = 4 + 1 = 5$;
- gain $K = 4/5 = 0.8$;
- innovation $\nu = 13 - 10 = 3\,\mathrm{m}$, so $\hat{x}^+ = 10 + 0.8\times3 = 12.4\,\mathrm{m}$;
- variance $P^+ = (1 - 0.8)\times4 = 0.8\,\mathrm{m^2}$.

The estimate moved $80\%$ of the way to the reading, because the sensor is four times more precise than the prior. The posterior variance, $0.8$, is smaller than either $4$ or $1$, as combining two pieces of evidence should give.

Now compare the true (Joseph) variance $P^+(K) = (1-K)^2P^- + K^2R$ with the short formula $(1-K)P^-$ for several gains. At $K = 0.9$, for instance, the Joseph form gives $0.01\times4 + 0.81\times1 = 0.85$:

| $K$ | $0.5$ | $0.7$ | $0.8$ | $0.9$ | $1.0$ |
| --- | --- | --- | --- | --- | --- |
| true $P^+(K)$ | $1.25$ | $0.85$ | $0.80$ | $0.85$ | $1.00$ |
| $(1-K)P^-$ | $2.00$ | $1.20$ | $0.80$ | $0.40$ | $0.00$ |

The true variance is a [[parabola|gain-parabola]] with its lowest point, $0.80$, at $K = 0.8$. The two formulas agree only there. At $K = 1$ the update copies the reading, so the error is the sensor's error and $P^+ = R = 1$; the short formula says zero. At $K = 0.9$ it claims $0.40$ against a true $0.85$. A filter using a slightly-off gain with the short formula would think itself twice as good as it is. That one row is the whole case for the Joseph form.
:::

## Derivation two: Bayesian conditioning of Gaussians

Now assume bell curves. **[[Bayes' theorem|bayes]]** says: what you believe after the reading is proportional to what you believed before, times how likely the reading is for each possible state. Both factors are Gaussian. Write $(\mathbf{P}^-)^{-1}$ for the inverse of $\mathbf{P}^-$:

$$
p(\mathbf{x}) \propto \exp\left(-\tfrac12(\mathbf{x} - \hat{\mathbf{x}}^-)^{\mathsf{T}}(\mathbf{P}^-)^{-1}(\mathbf{x} - \hat{\mathbf{x}}^-)\right), \qquad
p(\mathbf{z}\mid\mathbf{x}) \propto \exp\left(-\tfrac12(\mathbf{z} - \mathbf{H}\mathbf{x})^{\mathsf{T}}\mathbf{R}^{-1}(\mathbf{z} - \mathbf{H}\mathbf{x})\right).
$$

Read $p(\mathbf{z}\mid\mathbf{x})$ as "the probability of z given x", the **likelihood**. Multiply them and take $-2\ln$ to turn the product of exponentials into a sum:

$$
-2\ln p(\mathbf{x}\mid\mathbf{z}) = (\mathbf{x} - \hat{\mathbf{x}}^-)^{\mathsf{T}}(\mathbf{P}^-)^{-1}(\mathbf{x} - \hat{\mathbf{x}}^-) + (\mathbf{z} - \mathbf{H}\mathbf{x})^{\mathsf{T}}\mathbf{R}^{-1}(\mathbf{z} - \mathbf{H}\mathbf{x}) + \text{const}.
$$

The right side is a quadratic in $\mathbf{x}$, so the posterior is Gaussian too. Expand and keep the terms with $\mathbf{x}$ in them:

$$
\mathbf{x}^{\mathsf{T}}\left((\mathbf{P}^-)^{-1} + \mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{H}\right)\mathbf{x} - 2\,\mathbf{x}^{\mathsf{T}}\left((\mathbf{P}^-)^{-1}\hat{\mathbf{x}}^- + \mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{z}\right) + \text{const}.
$$

A Gaussian with mean $\boldsymbol{\mu}$ ("mu") and covariance $\boldsymbol{\Sigma}$ ("sigma") has $-2\ln p = \mathbf{x}^{\mathsf{T}}\boldsymbol{\Sigma}^{-1}\mathbf{x} - 2\mathbf{x}^{\mathsf{T}}\boldsymbol{\Sigma}^{-1}\boldsymbol{\mu} + \text{const}$. Match the squared terms, then the single terms:

::: key The update in information form
$(\mathbf{P}^+)^{-1} = (\mathbf{P}^-)^{-1} + \mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{H}$ and $\hat{\mathbf{x}}^+ = \mathbf{P}^+\left((\mathbf{P}^-)^{-1}\hat{\mathbf{x}}^- + \mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{z}\right)$. Inverse covariances — **information** — add; the posterior mean is the information-weighted average of the prior and the measurement.
:::

Inverse covariance is called **information** because a small spread means a lot of knowledge. In the tree story, each friend's information is one over their variance, and the answer weights each number by its information. This is the same update as the gain form in different clothes. The bridge is the **[[matrix inversion lemma|inversion-lemma]]**: with $\mathbf{K} = \mathbf{P}^-\mathbf{H}^{\mathsf{T}}\mathbf{S}^{-1}$,

$$
\left((\mathbf{P}^-)^{-1} + \mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{H}\right)^{-1} = \mathbf{P}^- - \mathbf{P}^-\mathbf{H}^{\mathsf{T}}\left(\mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}} + \mathbf{R}\right)^{-1}\mathbf{H}\mathbf{P}^- = (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^-.
$$

::: note Why it has to be true: the two forms agree
**Covariance.** Multiply the right side by $(\mathbf{P}^-)^{-1} + \mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{H}$. The product is $\mathbf{I} + \mathbf{P}^-\mathbf{H}^{\mathsf{T}}\mathbf{S}^{-1}\left[\mathbf{S}\mathbf{R}^{-1} - \mathbf{I} - \mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\right]\mathbf{H}$. Since $\mathbf{S}\mathbf{R}^{-1} = \mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1} + \mathbf{I}$, the bracket is zero, and the product is $\mathbf{I}$.

**A new form of the gain.** Expand, write $\mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}} = \mathbf{S} - \mathbf{R}$, and use $\mathbf{K}\mathbf{S} = \mathbf{P}^-\mathbf{H}^{\mathsf{T}}$:

$$
\mathbf{P}^+\mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1} = [\mathbf{P}^-\mathbf{H}^{\mathsf{T}} - \mathbf{K}(\mathbf{S} - \mathbf{R})]\mathbf{R}^{-1} = [\mathbf{P}^-\mathbf{H}^{\mathsf{T}} - \mathbf{K}\mathbf{S} + \mathbf{K}\mathbf{R}]\mathbf{R}^{-1} = \mathbf{K}.
$$

**Mean.** $\hat{\mathbf{x}}^+ = \mathbf{P}^+(\mathbf{P}^-)^{-1}\hat{\mathbf{x}}^- + \mathbf{P}^+\mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{z} = (\mathbf{I} - \mathbf{K}\mathbf{H})\hat{\mathbf{x}}^- + \mathbf{K}\mathbf{z} = \hat{\mathbf{x}}^- + \mathbf{K}\boldsymbol{\nu}$, the gain form.
:::

That middle line gives a second form of the gain worth keeping: $\mathbf{K} = \mathbf{P}^+\mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}$, posterior uncertainty times measurement precision. It makes the correlated-noise and information-filter lessons short.

Notice what the Bayesian route did *not* need: a guess that the update is linear. It computed the exact posterior, and the posterior mean *turned out* to be linear in $\mathbf{z}$. The posterior mean is the minimum mean-square-error estimate for any distribution. So when the noise is Gaussian, the Kalman update is the best of all estimators, linear or not.

It also shows a quirk of Gaussians that later lessons use: $\mathbf{P}^+$ does not depend on $\mathbf{z}$. *How much* you learn from a reading is fixed before you read it. Only *what* you learn depends on its value. (The probability module's Gaussian-conditioning formula, applied to the stacked vector $(\mathbf{x}, \mathbf{z})$, gives the same result in one line, when the joint covariance is already in hand.)

## Derivation three: recursive least squares

The least-squares module solved $\mathbf{z} = \mathbf{H}\mathbf{x} + \mathbf{v}$ by weighted least squares. You minimize $(\mathbf{z} - \mathbf{H}\mathbf{x})^{\mathsf{T}}\mathbf{W}(\mathbf{z} - \mathbf{H}\mathbf{x})$ with weight $\mathbf{W} = \mathbf{R}^{-1}$, and get $\hat{\mathbf{x}} = (\mathbf{H}^{\mathsf{T}}\mathbf{W}\mathbf{H})^{-1}\mathbf{H}^{\mathsf{T}}\mathbf{W}\mathbf{z}$ with covariance $(\mathbf{H}^{\mathsf{T}}\mathbf{W}\mathbf{H})^{-1}$.

Here is the trick: treat the prior as one more measurement. The statement "$\mathbf{x}$ is $\hat{\mathbf{x}}^-$, give or take $\mathbf{P}^-$" is the same as a reading $\hat{\mathbf{x}}^- = \mathbf{I}\mathbf{x} + \mathbf{e}^-$ whose noise has covariance $\mathbf{P}^-$. Stack it on top of the real reading:

$$
\begin{pmatrix} \hat{\mathbf{x}}^- \\ \mathbf{z} \end{pmatrix} = \begin{pmatrix} \mathbf{I} \\ \mathbf{H} \end{pmatrix}\mathbf{x} + \begin{pmatrix} \mathbf{e}^- \\ \mathbf{v} \end{pmatrix}, \qquad
\mathbf{W} = \begin{pmatrix} (\mathbf{P}^-)^{-1} & \mathbf{0} \\ \mathbf{0} & \mathbf{R}^{-1} \end{pmatrix}.
$$

Weighted least squares on the stack gives the information matrix $\mathbf{I}^{\mathsf{T}}(\mathbf{P}^-)^{-1}\mathbf{I} + \mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{H}$ and the estimate $\left((\mathbf{P}^-)^{-1} + \mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{H}\right)^{-1}\left((\mathbf{P}^-)^{-1}\hat{\mathbf{x}}^- + \mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{z}\right)$. That is the information form, term for term, and so the gain form by the same lemma.

The cost being minimized is the sum of two weighted misfits, one to the prior and one to the reading. That is the **[[maximum a posteriori|map-estimate]]** (MAP) estimate of the least-squares module. So the Kalman update *is* MAP estimation with a Gaussian prior. For Gaussians, MAP, minimum variance and the posterior mean all give the same vector.

Now run it again and again: the posterior becomes the next prior, and the next reading is stacked on. That is **recursive least squares** (RLS), and its gain has exactly the Kalman form. Two things separate the Kalman filter from RLS, and the next lesson adds both:

- **The state moves** between readings, so the next prior is $\mathbf{F}\hat{\mathbf{x}}^+$, not $\hat{\mathbf{x}}^+$.
- **Process noise is added**, so the next prior covariance is $\mathbf{F}\mathbf{P}^+\mathbf{F}^{\mathsf{T}} + \mathbf{Q}$, not $\mathbf{P}^+$.

Set $\mathbf{F} = \mathbf{I}$ and $\mathbf{Q} = \mathbf{0}$ and the Kalman filter *is* RLS. Keep $\mathbf{F} = \mathbf{I}$ but let $\mathbf{Q} > 0$, and it becomes RLS for a quantity that is admitted to drift. Information stops piling up forever, the covariance stops shrinking to zero, and the filter keeps listening. That is what process noise is for. RLS with a **[[forgetting factor|forgetting]]** is a cruder way to get the same effect.

::: example A position measurement that corrects a velocity
A vehicle's prior is $\hat{\mathbf{x}}^- = (100\,\mathrm{m},\ 5\,\mathrm{m/s})^{\mathsf{T}}$ with

$$
\mathbf{P}^- = \begin{pmatrix} 4 & 1 \\ 1 & 1 \end{pmatrix}
$$

in $\mathrm{m^2}$, $\mathrm{m^2/s}$ and $\mathrm{m^2/s^2}$. That means $\sigma_p = 2\,\mathrm{m}$, $\sigma_v = 1\,\mathrm{m/s}$, and correlation $1/(2\times1) = 0.5$. A position-only sensor, $\mathbf{H} = (1\ \ 0)$ with $R = 1\,\mathrm{m^2}$, reads $z = 103\,\mathrm{m}$.

**Gain form.** $\mathbf{P}^-\mathbf{H}^{\mathsf{T}}$ is the first column of $\mathbf{P}^-$, $(4,\ 1)^{\mathsf{T}}$. Then $S = 4 + 1 = 5$, so $\mathbf{K} = (4/5,\ 1/5)^{\mathsf{T}} = (0.8,\ 0.2)^{\mathsf{T}}$. The innovation is $\nu = 103 - 100 = 3\,\mathrm{m}$, so $\hat{\mathbf{x}}^+ = (100 + 0.8\times3,\ 5 + 0.2\times3) = (102.4\,\mathrm{m},\ 5.6\,\mathrm{m/s})$.

The velocity, which no sensor measured, moved by $0.6\,\mathrm{m/s}$. The prior said position errors and velocity errors tend to come together, so a position surprise is partly a velocity surprise. For the covariance, $\mathbf{I} - \mathbf{K}\mathbf{H} = \begin{pmatrix} 0.2 & 0 \\ -0.2 & 1 \end{pmatrix}$ and

$$
\mathbf{P}^+ = (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^- = \begin{pmatrix} 0.8 & 0.2 \\ 0.2 & 0.8 \end{pmatrix}.
$$

**Information form.** $\mathbf{P}^-$ has determinant $4 - 1 = 3$, so $(\mathbf{P}^-)^{-1} = \tfrac13\begin{pmatrix} 1 & -1 \\ -1 & 4 \end{pmatrix}$. The term $\mathbf{H}^{\mathsf{T}}R^{-1}\mathbf{H}$ adds $1$ to the top-left entry, giving $(\mathbf{P}^+)^{-1} = \tfrac13\begin{pmatrix} 4 & -1 \\ -1 & 4 \end{pmatrix}$. Its inverse is $\begin{pmatrix} 0.8 & 0.2 \\ 0.2 & 0.8 \end{pmatrix}$, the same matrix. For the mean, $(\mathbf{P}^-)^{-1}\hat{\mathbf{x}}^- + \mathbf{H}^{\mathsf{T}}R^{-1}z = \tfrac13(100 - 5,\ -100 + 20)^{\mathsf{T}} + (103,\ 0)^{\mathsf{T}} = (134.667,\ -26.667)^{\mathsf{T}}$, and $\mathbf{P}^+$ times that is $(102.4,\ 5.6)^{\mathsf{T}}$.

**Least squares.** Stack the prior as two pseudo-measurements weighted by $(\mathbf{P}^-)^{-1}$, above the real one weighted by $1$, and solve. The code below returns $(102.4,\ 5.6)$ and the same $\mathbf{P}^+$.

**Sanity checks.** The posterior spreads are $\sqrt{0.8} = 0.894\,\mathrm{m}$ and $0.894\,\mathrm{m/s}$, both smaller than before. The correlation fell from $0.5$ to $0.2/0.8 = 0.25$: the reading explained part of the shared error. Orthogonality holds: $(\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^-\mathbf{H}^{\mathsf{T}} - \mathbf{K}R = (0.8,\ 0.2)^{\mathsf{T}} - (0.8,\ 0.2)^{\mathsf{T}} = \mathbf{0}$.

Now try a plausible-looking wrong gain, $\mathbf{K}' = (0.5,\ 0.5)^{\mathsf{T}}$. The cross-covariance becomes $(4,\ 1)^{\mathsf{T}} - 5\,(0.5,\ 0.5)^{\mathsf{T}} = (1.5,\ -1.5)^{\mathsf{T}}$, not zero. The Joseph form gives $\operatorname{tr}\mathbf{P}^+ = 2.5$, against the optimal $1.6$. And the short formula returns $\begin{pmatrix} 2 & 0.5 \\ -1 & 0.5 \end{pmatrix}$, which is not even symmetric, so it cannot be a covariance.
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

| Derivation | Assumes | Proves | Generalizes to |
| --- | --- | --- | --- |
| Minimum variance / orthogonality | Linear unbiased update; known means and covariances | Best *linear* estimator for any noise distribution; Joseph form for any gain; error orthogonal to data | Suboptimal and constrained gains, consider filters, error analysis of mistuned filters |
| Bayesian Gaussian conditioning | Gaussian prior and noise | Exact posterior; best of *all* estimators; information adds; $\mathbf{P}^+$ independent of $\mathbf{z}$ | Nonlinear and non-Gaussian filters (the EKF, UKF and particle filters approximate this step) |
| Recursive least squares | Weighted least squares with the prior as a pseudo-measurement | Update equals MAP estimation; filter equals RLS plus dynamics and process noise | Batch orbit determination, information filters, smoothers |

::: warning The short covariance formula is a theorem, not a formula
$\mathbf{P}^+ = (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^-$ was *derived* by putting the optimal gain into the Joseph form. It is the true covariance only when $\mathbf{K}$ is exactly $\mathbf{P}^-\mathbf{H}^{\mathsf{T}}\mathbf{S}^{-1}$, computed in exact arithmetic from the same $\mathbf{P}^-$. With a rounded gain, a gain read from a table, a gain deliberately turned down, or a $\mathbf{P}^-$ that has drifted from symmetric, it reports a number that is not a variance and can even be negative. The Joseph form costs about twice the multiplications and is never wrong.
:::

::: note Four names for one quantity
Books call $\hat{\mathbf{x}}^+$ the minimum mean-square-error estimate, the maximum a posteriori estimate, the conditional mean, or the linear least-squares estimate, depending on which derivation the author has in mind. For a linear model with Gaussian noise, all four are the same vector. They part company only when the model is nonlinear or the noise is not Gaussian, and then each one generalizes differently.
:::

## Check yourself

::: check
For the scalar case $H = 1$, derive the gain by minimizing the Joseph form directly. What does the second derivative tell you?
:::

::: answer
$P^+(K) = (1-K)^2P^- + K^2R$. Differentiate: $dP^+/dK = -2(1-K)P^- + 2KR$. Set it to zero: $K(P^- + R) = P^-$, so $K = P^-/(P^- + R)$.

The second derivative is $2(P^- + R) > 0$, so this is a minimum. The minimum value is $(1-K)^2P^- + K^2R = P^-R/(P^- + R) = (1-K)P^-$, the short form. The scalar example's table showed exactly this: a parabola in $K$ with its floor at the Kalman gain.
:::

::: check
Show that $\mathbf{P}^+\mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1} = \mathbf{K}$, and say in words what this form of the gain means.
:::

::: answer
With $\mathbf{P}^+ = (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^-$, we get $\mathbf{P}^+\mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1} = [\mathbf{P}^-\mathbf{H}^{\mathsf{T}} - \mathbf{K}\mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}}]\mathbf{R}^{-1}$. Write $\mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}} = \mathbf{S} - \mathbf{R}$ to get $[\mathbf{P}^-\mathbf{H}^{\mathsf{T}} - \mathbf{K}\mathbf{S} + \mathbf{K}\mathbf{R}]\mathbf{R}^{-1}$. Since $\mathbf{K}\mathbf{S} = \mathbf{P}^-\mathbf{H}^{\mathsf{T}}$, the first two terms cancel, leaving $\mathbf{K}\mathbf{R}\mathbf{R}^{-1} = \mathbf{K}$.

In words: the gain is the state's remaining uncertainty after the update, mapped into measurement space by $\mathbf{H}^{\mathsf{T}}$, times the measurement's precision. A reading is weighted by how precise it is *and* by how unsure you still are after using it. A precise sensor still gets little weight on a state you already know well.
:::

::: check
A measurement becomes perfect, $\mathbf{R} \to \mathbf{0}$. What happens to each form of the update, and which would you implement?
:::

::: answer
In the gain form, $\mathbf{K} \to \mathbf{P}^-\mathbf{H}^{\mathsf{T}}(\mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}})^{-1}$, which stays finite as long as $\mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}}$ can be inverted. In the scalar example with $R = 10^{-6}$, $K = 4/4.000001 = 0.99999975$ and $P^+ = 1.0\times10^{-6}$: the posterior inherits the sensor's variance, as it should.

In the information form, $\mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{H}$ grows without limit and the addition is numerically useless.

The roles swap when there is *no prior*, $\mathbf{P}^- \to \infty$. The gain form cannot hold an infinite covariance, but the information form takes $(\mathbf{P}^-)^{-1} = \mathbf{0}$ without complaint. So use the gain form for precise measurements and the information form for weak or missing priors. The information-filter lesson makes this choice systematic.
:::

::: check
The noise is known to be non-Gaussian: an altimeter that now and then returns a wild value (heavy tails). Which of the three derivations still holds, and what exactly is lost?
:::

::: answer
The minimum-variance derivation survives whole, because it used only the means and covariances of $\mathbf{e}^-$ and $\mathbf{v}$. The Kalman gain is still the best *linear* unbiased update, and the Joseph form is still its exact covariance.

The least-squares derivation survives as an algorithm but loses its MAP meaning, because the cost is no longer the negative log of the posterior.

The Bayesian derivation fails. The true posterior is not Gaussian, its mean is not linear in $\mathbf{z}$, and a nonlinear estimator can beat the Kalman update. What is lost is being best among *all* estimators. More dangerous in practice: with heavy tails, one wild reading moves the linear estimate far more than a Gaussian model expects. That is why real filters gate their measurements.
:::

::: check
Repeat the two-state example with the correlation reversed, $\mathbf{P}^- = \begin{pmatrix} 4 & -1 \\ -1 & 1 \end{pmatrix}$, with the same prior mean and the same reading. What changes?
:::

::: answer
$\mathbf{P}^-\mathbf{H}^{\mathsf{T}} = (4,\ -1)^{\mathsf{T}}$ and $S = 5$ again, so $\mathbf{K} = (0.8,\ -0.2)^{\mathsf{T}}$. The position update is unchanged, $102.4\,\mathrm{m}$. The velocity now moves the other way: $5 - 0.2\times3 = 4.4\,\mathrm{m/s}$.

The covariance becomes $\mathbf{P}^+ = \begin{pmatrix} 0.8 & -0.2 \\ -0.2 & 0.8 \end{pmatrix}$: the same variances and the same amount learned, with the leftover correlation's sign flipped.

The *size* of what a reading teaches about an unmeasured state is set by the size of the correlation; the *direction* of the correction is set by its sign. Both come from $\mathbf{P}^-$. That is why a wrong off-diagonal entry in the covariance corrupts states no sensor touches.
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
| Short covariance form | $\mathbf{P}^+ = (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^-$, true only at the optimal gain |
| Information form | $(\mathbf{P}^+)^{-1} = (\mathbf{P}^-)^{-1} + \mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{H}$, $\hat{\mathbf{x}}^+ = \mathbf{P}^+((\mathbf{P}^-)^{-1}\hat{\mathbf{x}}^- + \mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{z})$ |
| Matrix inversion lemma | $((\mathbf{P}^-)^{-1} + \mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{H})^{-1} = \mathbf{P}^- - \mathbf{P}^-\mathbf{H}^{\mathsf{T}}\mathbf{S}^{-1}\mathbf{H}\mathbf{P}^-$ |
| Second gain form | $\mathbf{K} = \mathbf{P}^+\mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}$: posterior uncertainty times measurement precision |
| Least-squares view | The prior is a pseudo-measurement $\hat{\mathbf{x}}^- = \mathbf{x} + \mathbf{e}^-$ with weight $(\mathbf{P}^-)^{-1}$; the update is MAP; with $\mathbf{F} = \mathbf{I}$, $\mathbf{Q} = \mathbf{0}$ the filter is RLS |

The single step is solved. The next lesson puts the clock back: the posterior is carried through $\mathbf{F}$ and $\mathbf{Q}$ to become the next prior, and that pair of steps, repeated, is the Kalman filter. It is run in full on a descending booster, with every number shown.

::: context prior-posterior Before and after
"Prior" is Latin for "earlier" and "posterior" for "later". In estimation they mean your belief before and after a particular reading. The minus and plus signs on $\hat{\mathbf{x}}^-$ and $\hat{\mathbf{x}}^+$ are the same idea in shorthand. One reading's posterior becomes, after a prediction step, the next reading's prior. That hand-off is the whole rhythm of the filter.
:::

::: context innovation-word Why "innovation"
An innovation is something genuinely new. The innovation $\boldsymbol{\nu}$ is the part of a reading that the filter could not have predicted from everything it already knew. If the filter is working, the innovations carry no pattern at all, since any pattern would have been predictable. Later in this module, flight engineers check exactly that: they watch the innovations in telemetry, and a pattern there is the earliest sign a filter is going wrong.
:::

::: context joseph-name Where the name comes from
The form is named for Peter Joseph, an engineer who worked on guidance and filtering in the early 1960s, when filters had to run on tiny flight computers with few digits of precision. It appears in Richard Bucy and Joseph's 1968 book on filtering for guidance. Its selling point then is the same now: rounding in the gain cannot make the covariance lose symmetry or go negative, because it is built from two terms that can never be negative.
:::

::: context trace-meaning Why the trace is the right thing to shrink
The diagonal of $\mathbf{P}^+$ holds each state's mean squared error: $\mathbb{E}[e_1^2]$, $\mathbb{E}[e_2^2]$, and so on. Adding them up gives $\mathbb{E}[e_1^2 + e_2^2 + \cdots] = \mathbb{E}[\mathbf{e}^{\mathsf{T}}\mathbf{e}]$, the expected squared length of the error vector. So minimizing the trace makes the error as short as possible on average. A pleasant surprise: the gain that minimizes the trace also minimizes every individual diagonal entry at once.
:::

::: context projection-picture The error stands at a right angle
Think of the data as a flat floor and the true state as a point in the air above it. The best estimate you can build from the data is the point on the floor directly below: the projection. The error is the vertical line from the floor up to the truth, at a right angle to the floor. Any other point on the floor is farther away. "Uncorrelated" is the statistics word for this right angle.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="140" x2="340" y2="140" stroke="#1f2a44" stroke-width="2"/>
  <text x="340" y="160" font-size="12" fill="#1f2a44" text-anchor="end">what the data can build</text>
  <line x1="60" y1="140" x2="230" y2="40" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="230" cy="40" r="4" fill="#1d6fd1"/>
  <text x="238" y="38" font-size="12" fill="#1d6fd1">true state x</text>
  <line x1="230" y1="40" x2="230" y2="140" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 4"/>
  <text x="238" y="95" font-size="12" fill="#b4232c">error e⁺</text>
  <polyline points="218,140 218,128 230,128" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="230" cy="140" r="4" fill="#1f2a44"/>
  <text x="230" y="160" font-size="12" fill="#1f2a44" text-anchor="middle">estimate x̂⁺</text>
  <circle cx="60" cy="140" r="3" fill="#1f2a44"/>
</svg>
```
:::

::: context gain-parabola The parabola and the straight line
Plotting the table: the true variance $(1-K)^2 \cdot 4 + K^2$ is a parabola with its floor of $0.8$ at $K = 0.8$. The short formula $(1-K)\cdot 4$ is a straight line. They meet only at the floor. To the right of it, the line lies below the parabola, so the short formula reports less uncertainty than you really have.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="150" x2="345" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="20" x2="40" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40,70 65,79.4 90,87.5 115,94.4 140,100 165,104.4 190,107.5 215,109.4 240,110 265,109.4 290,107.5 315,104.4 340,100"/>
  <line x1="40" y1="30" x2="340" y2="150" stroke="#b4232c" stroke-width="2" stroke-dasharray="6 4"/>
  <circle cx="240" cy="110" r="4" fill="#1f2a44"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="166">0.4</text><text x="140" y="166">0.6</text><text x="240" y="166">0.8</text><text x="340" y="166">1.0</text>
  </g>
  <text x="190" y="184" font-size="12" fill="#1f2a44" text-anchor="middle">gain K</text>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="35" y="154">0</text><text x="35" y="104">1</text><text x="35" y="54">2</text>
  </g>
  <text x="60" y="62" font-size="11" fill="#1d6fd1">true P⁺(K)</text>
  <text x="120" y="45" font-size="11" fill="#b4232c">(1 − K)P⁻</text>
  <text x="248" y="126" font-size="11" fill="#1f2a44">K = 0.8</text>
</svg>
```
:::

::: context bayes An old rule for updating beliefs
Thomas Bayes was an English minister whose essay on probability was published in 1763, two years after his death. His rule says how to update a belief when evidence arrives: multiply what you believed before by how well each possibility explains the evidence, then rescale so the total is one. For bell curves the multiplication can be done on paper, and the Kalman update is the result. For other shapes it cannot, which is why nonlinear filters need approximations. The picture is the scalar example: prior at $10\,\mathrm{m}$, reading at $13\,\mathrm{m}$, posterior at $12.4\,\mathrm{m}$ and narrower than both.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="140" x2="340" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#6c7a93" stroke-width="2" points="30,133.5 38,131.7 45,129.6 52,127.2 60,124.5 68,121.4 75,118.1 82,114.6 90,111 98,107.4 105,103.9 112,100.6 120,97.8 128,95.4 135,93.6 142,92.5 150,92.1 158,92.5 165,93.6 172,95.4 180,97.8 188,100.6 195,103.9 202,107.4 210,111 218,114.6 225,118.1 232,121.4 240,124.5 248,127.2 255,129.6 262,131.7 270,133.5 278,135 285,136.2 292,137.1 300,137.9 308,138.5 315,138.9 322,139.2 330,139.5"/>
  <polyline fill="none" stroke="#f2b880" stroke-width="2.5" points="120,140 128,139.9 135,139.8 142,139.5 150,138.9 158,137.8 165,135.8 172,132.4 180,127 188,119.3 195,108.9 202,96.2 210,81.9 218,67.7 225,55.5 232,47.2 240,44.3 248,47.2 255,55.5 262,67.7 270,81.9 278,96.2 285,108.9 292,119.3 300,127 308,132.4 315,135.8 322,137.8 330,138.9"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="120,139.9 128,139.8 135,139.4 142,138.7 150,137.1 158,134 165,128.8 172,120.5 180,108.6 188,93.2 195,75.5 202,57.8 210,43.1 218,34.4 225,33.6 232,40.8 240,54.5 248,71.9 255,89.7 262,105.7 270,118.4 278,127.4 285,133.2 292,136.6 300,138.4 308,139.3 315,139.7"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="90" y="156">8</text><text x="150" y="156">10</text><text x="210" y="156">12</text><text x="270" y="156">14</text><text x="330" y="156">16 m</text>
  </g>
  <text x="70" y="86" font-size="11" fill="#6c7a93">prior (σ = 2)</text>
  <text x="262" y="44" font-size="11" fill="#b4232c">reading (σ = 1)</text>
  <text x="140" y="30" font-size="11" fill="#1d6fd1">posterior (σ = 0.89)</text>
</svg>
```
:::

::: context inversion-lemma A shortcut for inverting a sum
The matrix inversion lemma, also called the Woodbury identity after Max Woodbury's 1950 report, rewrites the inverse of "a big matrix plus a small correction" using only the inverse of a small matrix. Here it means the filter inverts $\mathbf{S}$, which is $m \times m$ with $m$ the number of readings, instead of an $n \times n$ matrix, with $n$ the number of states. With one altimeter reading and fifteen states, that is dividing by one number instead of inverting a $15 \times 15$ matrix.
:::

::: context map-estimate The peak of the posterior
The maximum a posteriori estimate is the single most probable state after the reading: the top of the posterior's hill. The posterior mean is its balance point. For a symmetric bell curve the top and the balance point are the same place, so for Gaussians the two estimates agree. For a lopsided posterior they separate, and which one you want depends on how you are scored.
:::

::: context forgetting Forgetting on purpose
Recursive least squares with a forgetting factor $\lambda$ ("lambda"), a number a little below $1$, multiplies all old information by $\lambda$ at each step, so a reading from $100$ steps ago counts only $\lambda^{100}$ as much. With $\lambda = 0.99$, that is about $0.37$. Adding $\mathbf{Q}$ does the same job with physical meaning attached. The divergence lesson brings this idea back as a "fading memory" filter.
:::
