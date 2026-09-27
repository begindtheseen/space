---
id: l04-maximum-likelihood-equivalence-wls-gaussian
title: Maximum likelihood and its equivalence to WLS under Gaussian noise
minutes: 19
covers:
  - Maximum likelihood and its equivalence to WLS under Gaussian noise
---

You come home and the kitchen floor is wet. Three explanations come to mind. It rained through an open window. The dog knocked over its water bowl. A pipe burst. You look around: the window is shut, the bowl is empty, and the dog is looking guilty. You pick the dog. You did not pick it because dogs are always to blame. You picked it because, of the three stories, it is the one that makes what you *see* the least surprising.

That habit has a name. **Maximum likelihood** means: among all the possible values of the thing you do not know, choose the one that would have made the data you actually got the most probable. The probability module met it as a general principle. This lesson applies it to the measurement model of this whole module, $\mathbf{y}=\mathbf{H}\mathbf{x}+\mathbf{v}$, with noise shaped like a bell curve. And the answer it gives is not new. It is the **weighted least squares** (WLS) estimate from lesson two, reached from a completely different starting point.

That match is why WLS is the default estimator in navigation, and not only a handy linear one. Lesson three proved WLS beats every other *linear* rule, and it used nothing about the shape of the noise. This lesson assumes one particular shape — the Gaussian bell — and gets a stronger result: WLS beats every unbiased rule, linear or not. Many sensor errors really are close to Gaussian, because they are the sum of lots of small, independent effects: thermal jiggling in the electronics, rounding spread over many samples, air turbulence added up along the path of a laser beam. The **[[central limit theorem|central-limit]]** says such sums come out bell-shaped. So the stronger result covers much of what a GNC engineer actually measures, from a GNSS receiver's pseudoranges to the ranges an orbit-determination team collects from ground stations.

## The likelihood of a measurement

Start with one number. A sensor reads $y$. Its noise is Gaussian with standard deviation $\sigma$ ("sigma", the typical size of the error). If the true value were $x$, the chance of reading something near $y$ is set by the bell curve centred at $x$:

$$
p(y;x) = \frac{1}{\sqrt{2\pi}\,\sigma}\exp\!\left(-\frac{(y-x)^2}{2\sigma^2}\right).
$$

Read $p(y;x)$ as "p of y, given the setting x". The semicolon says $x$ is a fixed setting, not something random. The formula is highest when $y = x$ and falls off fast once $y$ is more than a couple of $\sigma$ away.

Now flip your point of view. You already have the reading $y$ in your hand. Slide $x$ around and ask, for each $x$: how probable would my reading have been? The same formula, read as a function of $x$ with $y$ held fixed, is the **likelihood**, written $L(x)$. Maximum likelihood picks the $x$ at the top of that hill. For one reading, the top is at $x = y$, which is what common sense says.

With $m$ measurements stacked into a vector, the model is $\mathbf{y}=\mathbf{H}\mathbf{x}+\mathbf{v}$. The noise $\mathbf{v}$ is Gaussian with mean zero and covariance $\mathbf{R}$, written $\mathbf{v}\sim\mathcal{N}(\mathbf{0},\mathbf{R})$ — read "v is normal with mean zero and covariance R". Then $\mathbf{y}$ is also Gaussian, with mean $\mathbf{H}\mathbf{x}$ and covariance $\mathbf{R}$. Its density is the many-variable Gaussian from the probability module:

$$
p(\mathbf{y};\mathbf{x}) = \frac{1}{(2\pi)^{m/2}\lvert\mathbf{R}\rvert^{1/2}}\exp\left(-\tfrac12(\mathbf{y}-\mathbf{H}\mathbf{x})^\mathsf{T}\mathbf{R}^{-1}(\mathbf{y}-\mathbf{H}\mathbf{x})\right) .
$$

Here $\lvert\mathbf{R}\rvert$ is the determinant of $\mathbf{R}$. The quantity in the exponent, $(\mathbf{y}-\mathbf{H}\mathbf{x})^\mathsf{T}\mathbf{R}^{-1}(\mathbf{y}-\mathbf{H}\mathbf{x})$, is the **[[Mahalanobis distance|mahalanobis]]** squared: the size of the residual, measured in units of the noise. Maximum likelihood chooses

$$
\hat{\mathbf{x}}_{\mathrm{ML}} = \arg\max_{\mathbf{x}} L(\mathbf{x}),
$$

read "x hat ML is the x that makes L biggest".

## Taking the log turns the hill into a bowl

Exponentials are awkward to maximize. The **[[logarithm|log-trick]]** fixes that. The log is an increasing function: if $a > b$ then $\log a > \log b$. So whatever $\mathbf{x}$ makes $L$ biggest also makes $\log L$ biggest. Taking the log of the density above, the exponential and the log cancel, and the product in front becomes a sum:

$$
\log L(\mathbf{x}) = -\tfrac12(\mathbf{y}-\mathbf{H}\mathbf{x})^\mathsf{T}\mathbf{R}^{-1}(\mathbf{y}-\mathbf{H}\mathbf{x}) \;-\; \tfrac{m}{2}\log(2\pi) - \tfrac12\log\lvert\mathbf{R}\rvert .
$$

Look at the last two terms. They contain $m$ and $\mathbf{R}$, but no $\mathbf{x}$. Moving $\mathbf{x}$ cannot change them. They lift or lower the whole curve without moving its peak. So the only part that matters is the first term.

Maximizing $-\tfrac12(\ldots)$ is the same as minimizing $+\tfrac12(\ldots)$. And $\tfrac12(\mathbf{y}-\mathbf{H}\mathbf{x})^\mathsf{T}\mathbf{R}^{-1}(\mathbf{y}-\mathbf{H}\mathbf{x})$ is exactly the weighted least squares cost $J(\mathbf{x})$ of lesson two, with weight $\mathbf{W}=\mathbf{R}^{-1}$. The top of the likelihood hill and the bottom of the WLS bowl are the same point, for every possible $\mathbf{y}$:

$$
\hat{\mathbf{x}}_{\mathrm{ML}} = \hat{\mathbf{x}}_{\mathrm{WLS}} = (\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1}\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{y} .
$$

This also explains the weights. Each measurement is weighted by the inverse of its noise covariance, that is, by how much information it carries. A noisy sensor gets a small weight because a big miss from it is not surprising.

::: key Maximum likelihood equals WLS under Gaussian noise
With $\mathbf{y}=\mathbf{H}\mathbf{x}+\mathbf{v}$, $\mathbf{v}\sim\mathcal{N}(\mathbf{0},\mathbf{R})$, the Gaussian negative log-likelihood is $\tfrac12(\mathbf{y}-\mathbf{H}\mathbf{x})^\mathsf{T}\mathbf{R}^{-1}(\mathbf{y}-\mathbf{H}\mathbf{x})$ plus a constant that does not depend on $\mathbf{x}$. So maximizing likelihood *is* minimizing the inverse-covariance-weighted residual: $\hat{\mathbf{x}}_{\mathrm{ML}} = (\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1}\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{y} = \hat{\mathbf{x}}_{\mathrm{WLS}}$.
:::

::: warning Likelihood is not the probability of x
$L(\mathbf{x})$ is the probability density of the *data* you saw, if the unknown had been $\mathbf{x}$. It is not "the probability that $\mathbf{x}$ is the true value". The area under $L(\mathbf{x})$ need not be $1$, and nothing here treats $\mathbf{x}$ as random. Talking about the probability of $\mathbf{x}$ itself needs a prior belief about $\mathbf{x}$ — that is the next lesson.
:::

::: example The likelihood peak, found two ways
Two independent estimates of the same range bias arrive: $y_1=10.4\,\mathrm{m}$ with $\sigma_1=2.0\,\mathrm{m}$, and $y_2=11.1\,\mathrm{m}$ with $\sigma_2=3.0\,\mathrm{m}$. Both measure $x$ directly, so $\mathbf{H}=(1,1)^\mathsf{T}$ and $\mathbf{R}=\operatorname{diag}(4,9)\,\mathrm{m^2}$.

**The formula.** With a diagonal $\mathbf{R}$ and $\mathbf{H}$ all ones, the WLS formula becomes a weighted average, each reading weighted by $1/\sigma^2$:

$$
\hat x = \frac{y_1/\sigma_1^2+y_2/\sigma_2^2}{1/\sigma_1^2+1/\sigma_2^2} = \frac{10.4/4 + 11.1/9}{1/4 + 1/9} = \frac{2.6 + 1.2333}{0.36111} = 10.6154\,\mathrm{m}.
$$

The weights work out to $0.692$ on the first reading and $0.308$ on the second.

**The search.** Now forget the formula and hunt for the lowest point of the cost $J(x)=\tfrac12(\mathbf{y}-\mathbf{H}x)^\mathsf{T}\mathbf{R}^{-1}(\mathbf{y}-\mathbf{H}x)$. That is the negative log-likelihood, minus its constant. Try a handful of values:

| $x\,(\mathrm{m})$ | $10.0$ | $10.4$ | $10.6$ | $10.6154$ | $10.68$ | $10.75$ | $10.9$ | $11.1$ |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| $J(x)$ | $0.0872$ | $0.0272$ | $0.0189$ | $\mathbf{0.01885}$ | $0.0196$ | $0.0221$ | $0.0335$ | $0.0613$ |

The cost drops as you walk toward $10.6154\,\mathrm{m}$ and rises again past it. A fine computer search over $[9, 13]\,\mathrm{m}$ lands on $10.615385\,\mathrm{m}$, the same as the formula to every digit shown. The slope of $J$ at the formula's answer, $-\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}(\mathbf{y}-\mathbf{H}\hat x)$, comes out at $4\times10^{-16}$ — zero, up to computer rounding.

**Sanity check.** The answer sits between the two readings and closer to $10.4$, the more precise one. That is what a sensible blend should do. The brute-force likelihood search and the WLS normal equation agree because, for this model, they are one problem written two ways.
:::

## Fisher information: how sharp is the peak?

Picture two likelihood hills with their tops in the same place. One is a tall, thin spike. The other is a low, wide mound. With the spike, moving $\mathbf{x}$ even a little makes the data much less likely, so the data pin $\mathbf{x}$ down tightly. With the mound, lots of $\mathbf{x}$ values explain the data almost equally well. The sharpness of the peak measures how much the data tell you. That sharpness has a name: **[[Fisher information|fisher-sharpness]]**.

To make it precise, first define the **score**: the slope of the log-likelihood with respect to the unknown, $\mathbf{s}(\mathbf{x}) = \nabla_{\mathbf{x}}\log p(\mathbf{y};\mathbf{x})$. Read $\nabla_{\mathbf{x}}$ as "the gradient with respect to x": the vector of slopes, one per unknown. For the linear-Gaussian model, differentiate the log-likelihood above:

$$
\mathbf{s}(\mathbf{x}) = \mathbf{H}^\mathsf{T}\mathbf{R}^{-1}(\mathbf{y}-\mathbf{H}\mathbf{x}) = \mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{v}.
$$

The second step puts in the true model, $\mathbf{y}-\mathbf{H}\mathbf{x}=\mathbf{v}$, at the true $\mathbf{x}$. The score is a fixed matrix times the noise. So its average is zero, and its covariance is

$$
\mathcal{I}(\mathbf{x}) := \operatorname{Cov}(\mathbf{s}) = \mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\operatorname{Cov}(\mathbf{v})\,\mathbf{R}^{-1}\mathbf{H} = \mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}.
$$

The symbol $\mathcal{I}$ is a curly "I", read "Fisher information". The last step used $\operatorname{Cov}(\mathbf{v})=\mathbf{R}$, so one $\mathbf{R}^{-1}$ cancels the $\mathbf{R}$. The result is the same matrix lesson two called the **information matrix**. That is not a coincidence; it is where the name comes from. For a linear model it does not depend on $\mathbf{x}$ at all, because $\mathbf{x}$ cancelled out of the score. That is special to linear models.

Why does the spread of the *slope* measure the sharpness of the *peak*? For this model, the curvature of $\log L$ — how fast its slope changes — is $-\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}$, the same matrix with a minus sign. A sharply curved hill has a slope that swings a lot when the noise nudges the data. Both views give one number.

::: key WLS covariance is the inverse Fisher information
$\hat{\mathbf{x}}_{\mathrm{WLS}} = (\mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{H})^{-1}\mathbf{H}^\mathsf{T}\mathbf{W}\mathbf{y}$ with $\mathbf{W}=\mathbf{R}^{-1}$. Its covariance is $\mathbf{P} = (\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1}$, the inverse of the Fisher information $\mathcal{I} = \mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}$.
:::

## The Cramér-Rao bound: nothing unbiased does better

Lesson three's Gauss-Markov theorem compared WLS only with other *linear* estimators. Gaussian noise lets us say more. Take *any* rule $T(\mathbf{y})$ that turns data into an estimate — a median, a trimmed mean, a neural network, anything. Ask only that it be **unbiased**: on average it lands on the truth, $\mathbb{E}[T(\mathbf{y})]=\mathbf{x}$, whatever the true $\mathbf{x}$ is. Then its covariance can never be smaller than the inverse Fisher information:

$$
\operatorname{Cov}(T) \succeq \mathcal{I}(\mathbf{x})^{-1} = (\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1} = \mathbf{P}_{\mathrm{WLS}} .
$$

The symbol $\succeq$, read "is at least", compares matrices: $\mathbf{A}\succeq\mathbf{B}$ means $\mathbf{A}-\mathbf{B}$ is positive semidefinite, so no direction has less spread under $\mathbf{A}$ than under $\mathbf{B}$. This is the **[[Cramér-Rao lower bound|cramer-rao]]**. It is a floor on how precise any unbiased estimate can be, set by the information in the data.

WLS sits exactly on the floor: its covariance *is* $\mathbf{P}_{\mathrm{WLS}}$. An estimator that reaches the Cramér-Rao bound is called **efficient**. This is the strongest guarantee in the module. Gauss-Markov said "no linear rule beats it". Efficiency says "no unbiased rule of any kind beats it". Gaussian noise is what buys the upgrade from "best linear" to "best, period".

::: note Why it has to be true
Start from unbiasedness, $\int T(\mathbf{y})\,p(\mathbf{y};\mathbf{x})\,d\mathbf{y} = \mathbf{x}$, true for every $\mathbf{x}$. Differentiate both sides with respect to $\mathbf{x}$. Moving the derivative inside the integral is allowed for every measurement model in this module. The derivative of the density is $\nabla_{\mathbf{x}}p = p\,\mathbf{s}^\mathsf{T}$, because the score is the slope of $\log p$. So

$$
\mathbb{E}\!\left[T(\mathbf{y})\,\mathbf{s}(\mathbf{x})^\mathsf{T}\right] = \mathbf{I}_n .
$$

Doing the same to $\int p\,d\mathbf{y}=1$ gives $\mathbb{E}[\mathbf{s}]=\mathbf{0}$. So subtracting $\mathbf{x}\,\mathbb{E}[\mathbf{s}]^\mathsf{T}=\mathbf{0}$ changes nothing, and $\mathbb{E}[(T-\mathbf{x})\mathbf{s}^\mathsf{T}] = \mathbf{I}_n$ too.

Now stack the error $T-\mathbf{x}$ on top of the score $\mathbf{s}$, making one random vector of length $2n$. Its covariance matrix, like every covariance matrix, is positive semidefinite:

$$
\begin{pmatrix} \operatorname{Cov}(T) & \mathbf{I}_n \\ \mathbf{I}_n & \mathcal{I}(\mathbf{x}) \end{pmatrix} \succeq \mathbf{0} .
$$

A block matrix like this is positive semidefinite only if its **[[Schur complement|schur]]** is: $\operatorname{Cov}(T) - \mathbf{I}_n\,\mathcal{I}(\mathbf{x})^{-1}\,\mathbf{I}_n \succeq \mathbf{0}$. Rearranged, that is the bound. Nothing in the argument asked $T$ to be linear.
:::

## What the bell shape buys, and what its absence costs

Efficiency is bought with the Gaussian assumption. It is worth seeing what happens when that assumption is wrong. Take the simplest case: $m$ repeated readings of one number, all with the same $\sigma$, so $\mathbf{H}=\mathbf{1}$ (a column of ones). The WLS answer is then the **sample mean**, the ordinary average. Compare it with the **sample median**, the middle reading once they are sorted. The median is also unbiased here, but it is not linear in the data. Try both under two noise shapes with the same $\sigma$: the Gaussian, and the **[[Laplace distribution|laplace-tails]]**, which has a sharper peak and fatter tails.

::: example Mean against median, Gaussian against Laplace noise
Simulate $m=11$ readings of $x_{\mathrm{true}}=5$ with $\sigma=2$, repeated $N=300{,}000$ times. Do it once with Gaussian noise and once with Laplace noise scaled to the same variance:

```python
import numpy as np

m, sigma, x_true, N = 11, 2.0, 5.0, 300_000
rng = np.random.default_rng(2026)
noise_gauss = rng.normal(0.0, sigma, size=(N, m))
noise_laplace = rng.laplace(0.0, sigma/np.sqrt(2.0), size=(N, m))   # same variance

for name, noise in (("Gaussian", noise_gauss), ("Laplace", noise_laplace)):
    y = x_true + noise
    mean_est, median_est = y.mean(axis=1), np.median(y, axis=1)
    print(f"{name:9s} Var(mean)={mean_est.var():.4f}  Var(median)={median_est.var():.4f}"
          f"  ratio median/mean={median_est.var()/mean_est.var():.3f}")
# Gaussian  Var(mean)=0.3635  Var(median)=0.5497  ratio median/mean=1.512
# Laplace   Var(mean)=0.3631  Var(median)=0.2767  ratio median/mean=0.762
```

**Gaussian noise.** The mean's variance is $0.3635$. The Cramér-Rao bound for this problem is $(\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1} = \sigma^2/m = 4/11 = 0.3636$. The mean sits on the floor: it is efficient. The median needs $51\%$ more variance to estimate the same thing.

**Laplace noise.** Same $\sigma$, and the ranking flips. The median's variance is $24\%$ *lower* than the mean's.

**What did not change.** Both estimators still land on $x_{\mathrm{true}}=5$ on average — to three decimal places in this run. And the mean is still the best *linear* rule, BLUE, because Gauss-Markov never asked about the noise shape. It is simply no longer the best rule of any kind. The median happens to be the maximum likelihood estimator for Laplace noise, exactly as the mean is for Gaussian noise. Laplace noise puts more probability in its tails, so a rule that ignores how far out the extreme readings sit does better.
:::

The pattern is general. For any noise shape there is a maximum likelihood estimator matched to it, and it is efficient for that shape. WLS is the maximum likelihood estimator for one shape, the Gaussian, and it is efficient exactly there. Away from Gaussian noise it stays unbiased and stays BLUE. But the stronger claim of this lesson quietly stops applying, and nothing in the residuals or the fit will announce it. So during calibration, find out the actual shape of a sensor's errors, not only their size. Do not assume it.

::: warning Gaussian is an assumption about shape, not only about R
The covariance $\mathbf{R}$ alone is enough for Gauss-Markov. Efficiency also needs the noise to be Gaussian in *shape*, not only in its mean and covariance. A sensor can have a perfectly measured $\sigma$ and still have heavy-tailed or lopsided errors: a star tracker that now and then misidentifies a star, or a GNSS receiver bothered by **[[multipath|multipath]]**. It can have exactly the $\mathbf{R}$ that WLS is built from and still not be well served by it. The residual-analysis lesson later in this module is about catching this.
:::

## Check yourself

::: check
A single sensor reading $y=7.0$ comes from $y = x + v$ with $v\sim\mathcal{N}(0,\sigma^2)$. Write the log-likelihood $\log L(x)$ and find the maximum likelihood estimate by setting its slope to zero.
:::

::: answer
The density is $p(y;x) = \frac{1}{\sqrt{2\pi}\,\sigma}\exp\!\left(-\frac{(y-x)^2}{2\sigma^2}\right)$, so

$\log L(x) = -\dfrac{(y-x)^2}{2\sigma^2} - \log(\sqrt{2\pi}\,\sigma)$.

The second term has no $x$ in it. The slope is $\dfrac{d}{dx}\log L = \dfrac{y-x}{\sigma^2}$. Setting it to zero gives $x = y$, so $\hat x_{\mathrm{ML}} = 7.0$. The best guess from one reading is the reading itself, whatever $\sigma$ is — $\sigma$ changes how sharp the peak is, not where it is.
:::

::: check
Write the log-likelihood for $\mathbf{y}=\mathbf{H}\mathbf{x}+\mathbf{v}$, $\mathbf{v}\sim\mathcal{N}(\mathbf{0},\mathbf{R})$, and say exactly which term makes maximizing it the same problem as minimizing the WLS cost.
:::

::: answer
$\log L(\mathbf{x}) = -\tfrac12(\mathbf{y}-\mathbf{H}\mathbf{x})^\mathsf{T}\mathbf{R}^{-1}(\mathbf{y}-\mathbf{H}\mathbf{x}) - \tfrac{m}{2}\log(2\pi) - \tfrac12\log\lvert\mathbf{R}\rvert$.

The last two terms do not depend on $\mathbf{x}$. They shift $\log L$ up or down without moving its peak. Only the first term depends on $\mathbf{x}$, and it is $-J(\mathbf{x})$, with $J$ the WLS cost of lesson two and $\mathbf{W}=\mathbf{R}^{-1}$. So maximizing $\log L$ and minimizing $J$ have the same solution.
:::

::: check
The Fisher information $\mathcal{I}(\mathbf{x}) = \mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}$ has an $\mathbf{x}$ in its name, yet for this model it does not depend on $\mathbf{x}$. Why not?
:::

::: answer
The score is $\mathbf{s}(\mathbf{x}) = \mathbf{H}^\mathsf{T}\mathbf{R}^{-1}(\mathbf{y}-\mathbf{H}\mathbf{x})$. Putting in the true model $\mathbf{y}=\mathbf{H}\mathbf{x}+\mathbf{v}$ gives $\mathbf{s}=\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{v}$: the unknown $\mathbf{x}$ cancels, because the model is linear in $\mathbf{x}$. What is left is a fixed matrix times the noise. Its covariance, $\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}$, involves only $\mathbf{H}$ and $\mathbf{R}$, both known before any data arrive.

This is special to linear models. The nonlinear least squares lesson later in this module meets a Fisher information that does depend on $\mathbf{x}$, because the cancellation no longer happens exactly.
:::

::: check
State the Cramér-Rao bound. In one sentence, say why WLS being efficient is a stronger statement than WLS being BLUE.
:::

::: answer
For any unbiased estimator $T(\mathbf{y})$ of $\mathbf{x}$, $\operatorname{Cov}(T) \succeq \mathcal{I}(\mathbf{x})^{-1}$, where $\mathcal{I}$ is the Fisher information. Under Gaussian noise WLS reaches this bound exactly.

It is stronger than BLUE because BLUE ranks WLS only against other *linear* unbiased estimators, while the Cramér-Rao bound ranks it against every unbiased estimator, linear or not.
:::

::: check
In the mean-versus-median simulation, both estimators are unbiased under both noise shapes, yet their variances rank in opposite orders. What does this say about Gauss-Markov's guarantee for the mean, and what does it say about this lesson's efficiency claim?
:::

::: answer
Gauss-Markov's guarantee holds in both cases. With equal-variance readings, the mean is the WLS (BLUE) estimator, and the theorem asked nothing about noise shape. So no other *linear* unbiased rule beats the mean in either simulation.

The efficiency claim is narrower. It holds only under Gaussian noise, where the mean is also the maximum likelihood estimator. Under Laplace noise the mean is still BLUE but no longer efficient: the median — nonlinear, and the maximum likelihood estimator for Laplace noise — beats it.
:::

::: check
A colleague says: "$\mathbf{R}$ fully describes the noise for WLS, so checking whether the noise is really Gaussian is busywork." Using this lesson, say what is lost if they are wrong.
:::

::: answer
The estimate and its computed covariance $\mathbf{P}=(\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1}$ do not change if the noise is non-Gaussian with the same $\mathbf{R}$. WLS stays unbiased and stays BLUE.

What is lost, silently, is the claim that no better *unbiased* estimator exists at all. That is efficiency, from the Cramér-Rao bound, and it needs the Gaussian shape. A better estimator, matched to the true noise shape, may be sitting unused. Nothing in the residuals or the reported covariance would reveal it; only knowing how the sensor actually misbehaves does.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $L(\mathbf{x}) = p(\mathbf{y};\mathbf{x})$ | Likelihood: how probable the data you got would be, for each possible $\mathbf{x}$ |
| $\log L(\mathbf{x}) = -J(\mathbf{x}) + \text{const}$ | Gaussian log-likelihood; maximizing it equals minimizing the WLS cost |
| $\hat{\mathbf{x}}_{\mathrm{ML}} = \hat{\mathbf{x}}_{\mathrm{WLS}} = (\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H})^{-1}\mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{y}$ | ML and WLS are the same estimate under Gaussian noise |
| $\mathbf{s}(\mathbf{x}) = \nabla_{\mathbf{x}}\log p(\mathbf{y};\mathbf{x})$ | Score: zero mean, $\operatorname{Cov}(\mathbf{s}) = \mathcal{I}(\mathbf{x})$ |
| $\mathcal{I}(\mathbf{x}) = \mathbf{H}^\mathsf{T}\mathbf{R}^{-1}\mathbf{H}$ | Fisher information: the sharpness of the likelihood peak; constant in $\mathbf{x}$ for a linear model |
| $\operatorname{Cov}(T) \succeq \mathcal{I}(\mathbf{x})^{-1}$ | Cramér-Rao lower bound, for any unbiased $T$, linear or not |
| $\mathbf{P}_{\mathrm{WLS}} = \mathcal{I}^{-1}$ | WLS reaches the bound: it is **efficient** under Gaussian noise |
| Non-Gaussian noise | WLS stays unbiased and BLUE; efficiency can fail (mean against median under Laplace noise) |

Maximum likelihood needed only the probability of the data. The next lesson adds one more ingredient — a belief about $\mathbf{x}$ held *before* the data arrive — and asks which estimate is most probable once that belief and the data are combined.

::: context central-limit Why so much noise is bell-shaped
Add up many small, independent random nudges and the total comes out bell-shaped, almost no matter what shape each nudge had. That is the central limit theorem. Roll one die and every face is equally likely — a flat shape. Add ten dice and the totals pile up in a bell around $35$. A voltage reading is the sum of the jiggles of countless electrons, so its noise looks Gaussian too. The theorem is why engineers reach for the Gaussian first, and also why it fails when one big effect dominates, like a single bad star match.
:::

::: context mahalanobis Distance measured in sigmas
An error of $5\,\mathrm{m}$ is huge for a laser rangefinder and tiny for a GNSS fix. The Mahalanobis distance measures a miss in units of the expected noise instead of in metres. For one measurement it is $(y - x)/\sigma$, squared. For many correlated measurements, $\mathbf{R}^{-1}$ does the same job in every direction at once. It is named after Prasanta Chandra Mahalanobis, an Indian statistician who published it in 1936; he was comparing body measurements between groups of people.
:::

::: context log-trick Why the log helps
Two things make logs the right tool here. First, the log keeps order: bigger in, bigger out. So the peak of $L$ and the peak of $\log L$ are at the same $\mathbf{x}$. Second, the log turns an exponential into its exponent and a product into a sum. Independent measurements multiply their likelihoods together; after the log, they add. A Gaussian hill becomes an upside-down parabola, and a parabola's top is found with one derivative.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="20.0" y1="150.0" x2="170.0" y2="150.0" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="190.0" y1="150.0" x2="340.0" y2="150.0" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline points="20.0,148.9 21.9,148.6 23.7,148.3 25.6,147.9 27.5,147.4 29.4,146.8 31.3,146.1 33.1,145.3 35.0,144.4 36.9,143.3 38.8,142.0 40.6,140.6 42.5,139.0 44.4,137.1 46.2,135.1 48.1,132.8 50.0,130.2 51.9,127.4 53.8,124.4 55.6,121.1 57.5,117.5 59.4,113.8 61.2,109.8 63.1,105.6 65.0,101.3 66.9,96.9 68.8,92.4 70.6,87.8 72.5,83.3 74.4,78.8 76.2,74.5 78.1,70.4 80.0,66.5 81.9,62.9 83.8,59.6 85.6,56.8 87.5,54.4 89.4,52.5 91.2,51.1 93.1,50.3 95.0,50.0 96.9,50.3 98.8,51.1 100.6,52.5 102.5,54.4 104.4,56.8 106.2,59.6 108.1,62.9 110.0,66.5 111.9,70.4 113.8,74.5 115.6,78.8 117.5,83.3 119.4,87.8 121.2,92.4 123.1,96.9 125.0,101.3 126.9,105.6 128.8,109.8 130.6,113.8 132.5,117.5 134.4,121.1 136.2,124.4 138.1,127.4 140.0,130.2 141.9,132.8 143.8,135.1 145.6,137.1 147.5,139.0 149.4,140.6 151.2,142.0 153.1,143.3 155.0,144.4 156.9,145.3 158.8,146.1 160.6,146.8 162.5,147.4 164.4,147.9 166.2,148.3 168.1,148.6 170.0,148.9" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <polyline points="190.0,50.0 191.9,54.9 193.8,59.8 195.6,64.4 197.5,69.0 199.4,73.4 201.2,77.8 203.1,81.9 205.0,86.0 206.9,89.9 208.8,93.8 210.6,97.4 212.5,101.0 214.4,104.4 216.2,107.8 218.1,110.9 220.0,114.0 221.9,116.9 223.8,119.8 225.6,122.4 227.5,125.0 229.4,127.4 231.2,129.8 233.1,131.9 235.0,134.0 236.9,135.9 238.8,137.8 240.6,139.4 242.5,141.0 244.4,142.4 246.2,143.8 248.1,144.9 250.0,146.0 251.9,146.9 253.8,147.8 255.6,148.4 257.5,149.0 259.4,149.4 261.2,149.8 263.1,149.9 265.0,150.0 266.9,149.9 268.8,149.8 270.6,149.4 272.5,149.0 274.4,148.4 276.2,147.8 278.1,146.9 280.0,146.0 281.9,144.9 283.8,143.8 285.6,142.4 287.5,141.0 289.4,139.4 291.2,137.8 293.1,135.9 295.0,134.0 296.9,131.9 298.8,129.8 300.6,127.4 302.5,125.0 304.4,122.4 306.2,119.8 308.1,116.9 310.0,114.0 311.9,110.9 313.8,107.8 315.6,104.4 317.5,101.0 319.4,97.4 321.2,93.8 323.1,89.9 325.0,86.0 326.9,81.9 328.8,77.8 330.6,73.4 332.5,69.0 334.4,64.4 336.2,59.8 338.1,54.9 340.0,50.0" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <line x1="95.0" y1="150.0" x2="95.0" y2="50.0" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="265.0" y1="150.0" x2="265.0" y2="50.0" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="95.0" y="40.0" font-size="12" fill="#1d6fd1" text-anchor="middle">likelihood: a hill</text>
  <text x="265.0" y="40.0" font-size="12" fill="#b4232c" text-anchor="middle">minus its log: a bowl</text>
  <text x="95.0" y="168.0" font-size="11" fill="#1f2a44" text-anchor="middle">x̂: top of the hill</text>
  <text x="265.0" y="168.0" font-size="11" fill="#1f2a44" text-anchor="middle">x̂: bottom of the bowl</text>
  <text x="180.0" y="186.0" font-size="11" fill="#6c7a93" text-anchor="middle">same x̂ for both</text>
</svg>
```
:::

::: context fisher-sharpness A sharp peak means a precise answer
Both curves below peak at the same best guess. The sharp one comes from data that say a lot: move $x$ a little and the data become far less likely. The flat one comes from weak data. Fisher information measures that sharpness, and its inverse is the spread of the best estimate. Ronald Fisher, a British statistician and biologist, developed the idea in the 1920s; he also coined the word "likelihood" for the data's probability read as a function of the unknown.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 185" font-family="Inter, Arial, sans-serif">
  <line x1="20.0" y1="150.0" x2="340.0" y2="150.0" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline points="20.0,136.5 22.7,135.5 25.3,134.6 28.0,133.6 30.7,132.5 33.3,131.4 36.0,130.2 38.7,129.0 41.3,127.7 44.0,126.4 46.7,125.1 49.3,123.7 52.0,122.2 54.7,120.7 57.3,119.1 60.0,117.5 62.7,115.9 65.3,114.2 68.0,112.5 70.7,110.7 73.3,108.9 76.0,107.0 78.7,105.2 81.3,103.3 84.0,101.3 86.7,99.4 89.3,97.4 92.0,95.4 94.7,93.4 97.3,91.4 100.0,89.3 102.7,87.3 105.3,85.3 108.0,83.3 110.7,81.3 113.3,79.3 116.0,77.4 118.7,75.5 121.3,73.6 124.0,71.7 126.7,69.9 129.3,68.2 132.0,66.5 134.7,64.8 137.3,63.3 140.0,61.8 142.7,60.3 145.3,59.0 148.0,57.7 150.7,56.5 153.3,55.4 156.0,54.4 158.7,53.5 161.3,52.7 164.0,52.0 166.7,51.4 169.3,50.9 172.0,50.5 174.7,50.2 177.3,50.1 180.0,50.0 182.7,50.1 185.3,50.2 188.0,50.5 190.7,50.9 193.3,51.4 196.0,52.0 198.7,52.7 201.3,53.5 204.0,54.4 206.7,55.4 209.3,56.5 212.0,57.7 214.7,59.0 217.3,60.3 220.0,61.8 222.7,63.3 225.3,64.8 228.0,66.5 230.7,68.2 233.3,69.9 236.0,71.7 238.7,73.6 241.3,75.5 244.0,77.4 246.7,79.3 249.3,81.3 252.0,83.3 254.7,85.3 257.3,87.3 260.0,89.3 262.7,91.4 265.3,93.4 268.0,95.4 270.7,97.4 273.3,99.4 276.0,101.3 278.7,103.3 281.3,105.2 284.0,107.0 286.7,108.9 289.3,110.7 292.0,112.5 294.7,114.2 297.3,115.9 300.0,117.5 302.7,119.1 305.3,120.7 308.0,122.2 310.7,123.7 313.3,125.1 316.0,126.4 318.7,127.7 321.3,129.0 324.0,130.2 326.7,131.4 329.3,132.5 332.0,133.6 334.7,134.6 337.3,135.5 340.0,136.5" fill="none" stroke="#8fb8f0" stroke-width="2.5"/>
  <polyline points="20.0,150.0 22.7,150.0 25.3,150.0 28.0,150.0 30.7,150.0 33.3,150.0 36.0,150.0 38.7,150.0 41.3,150.0 44.0,150.0 46.7,150.0 49.3,150.0 52.0,150.0 54.7,150.0 57.3,150.0 60.0,150.0 62.7,150.0 65.3,150.0 68.0,150.0 70.7,150.0 73.3,150.0 76.0,150.0 78.7,149.9 81.3,149.9 84.0,149.8 86.7,149.8 89.3,149.7 92.0,149.6 94.7,149.4 97.3,149.2 100.0,148.9 102.7,148.5 105.3,148.0 108.0,147.4 110.7,146.6 113.3,145.6 116.0,144.4 118.7,142.9 121.3,141.1 124.0,139.0 126.7,136.5 129.3,133.6 132.0,130.2 134.7,126.4 137.3,122.2 140.0,117.5 142.7,112.5 145.3,107.0 148.0,101.3 150.7,95.4 153.3,89.3 156.0,83.3 158.7,77.4 161.3,71.7 164.0,66.5 166.7,61.8 169.3,57.7 172.0,54.4 174.7,52.0 177.3,50.5 180.0,50.0 182.7,50.5 185.3,52.0 188.0,54.4 190.7,57.7 193.3,61.8 196.0,66.5 198.7,71.7 201.3,77.4 204.0,83.3 206.7,89.3 209.3,95.4 212.0,101.3 214.7,107.0 217.3,112.5 220.0,117.5 222.7,122.2 225.3,126.4 228.0,130.2 230.7,133.6 233.3,136.5 236.0,139.0 238.7,141.1 241.3,142.9 244.0,144.4 246.7,145.6 249.3,146.6 252.0,147.4 254.7,148.0 257.3,148.5 260.0,148.9 262.7,149.2 265.3,149.4 268.0,149.6 270.7,149.7 273.3,149.8 276.0,149.8 278.7,149.9 281.3,149.9 284.0,150.0 286.7,150.0 289.3,150.0 292.0,150.0 294.7,150.0 297.3,150.0 300.0,150.0 302.7,150.0 305.3,150.0 308.0,150.0 310.7,150.0 313.3,150.0 316.0,150.0 318.7,150.0 321.3,150.0 324.0,150.0 326.7,150.0 329.3,150.0 332.0,150.0 334.7,150.0 337.3,150.0 340.0,150.0" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="180.0" y1="150.0" x2="180.0" y2="45.0" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="180.0" y="36.0" font-size="11" fill="#1f2a44" text-anchor="middle">best guess x̂</text>
  <text x="236.0" y="82.0" font-size="11" fill="#1d6fd1" text-anchor="start">lots of information:</text>
  <text x="236.0" y="96.0" font-size="11" fill="#1d6fd1" text-anchor="start">sharp peak</text>
  <text x="20.0" y="112.0" font-size="11" fill="#6c7a93" text-anchor="start">little information:</text>
  <text x="20.0" y="126.0" font-size="11" fill="#6c7a93" text-anchor="start">flat peak</text>
  <text x="180.0" y="172.0" font-size="11" fill="#1f2a44" text-anchor="middle">unknown x</text>
</svg>
```
:::

::: context cramer-rao Two people, one bound
The bound is named after the Swedish mathematician Harald Cramér and the Indian statistician C. R. Rao, who reached it independently: Rao in a 1945 paper, Cramér in his 1946 textbook. Engineers use it as a yardstick. Before building an estimator, they compute $\mathcal{I}^{-1}$ for a proposed sensor layout. If even the best possible unbiased estimator cannot meet the accuracy requirement, no clever software will — the sensors or their geometry must change. The Kalman filter module compares filter covariances against this same kind of bound.
:::

::: context schur The Schur complement
Split a symmetric matrix into four blocks, $\begin{pmatrix}\mathbf{A} & \mathbf{B}\\ \mathbf{B}^\mathsf{T} & \mathbf{C}\end{pmatrix}$, with $\mathbf{C}$ invertible. The Schur complement is $\mathbf{A} - \mathbf{B}\mathbf{C}^{-1}\mathbf{B}^\mathsf{T}$: what is left of $\mathbf{A}$ after removing the part the other block explains. It is the matrix version of "complete the square". The whole matrix is positive semidefinite exactly when $\mathbf{C}$ is positive definite and this leftover is positive semidefinite. In the proof, $\mathbf{A}$ is $\operatorname{Cov}(T)$, $\mathbf{B}$ is $\mathbf{I}_n$ and $\mathbf{C}$ is $\mathcal{I}$.
:::

::: context laplace-tails Same spread, different shape
Both curves below have exactly the same standard deviation. The Laplace curve has a pointy middle and fatter tails: at $3\sigma$ out it is about $2.3$ times as likely as the Gaussian. That is why the median wins under Laplace noise. The median only cares which readings are above or below the middle, not how far out the wild ones sit. Pierre-Simon Laplace proposed this curve in 1774 as a model for measurement errors, decades before Gauss's bell became the standard.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="20.0" y1="160.0" x2="340.0" y2="160.0" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline points="20.0,160.0 22.0,160.0 24.0,160.0 26.0,160.0 28.0,160.0 30.0,159.9 32.0,159.9 34.0,159.9 36.0,159.9 38.0,159.9 40.0,159.9 42.0,159.8 44.0,159.8 46.0,159.8 48.0,159.7 50.0,159.7 52.0,159.6 54.0,159.6 56.0,159.5 58.0,159.4 60.0,159.3 62.0,159.2 64.0,159.1 66.0,158.9 68.0,158.8 70.0,158.6 72.0,158.4 74.0,158.1 76.0,157.9 78.0,157.6 80.0,157.3 82.0,156.9 84.0,156.5 86.0,156.1 88.0,155.6 90.0,155.1 92.0,154.5 94.0,153.8 96.0,153.2 98.0,152.4 100.0,151.6 102.0,150.7 104.0,149.8 106.0,148.8 108.0,147.7 110.0,146.6 112.0,145.4 114.0,144.1 116.0,142.7 118.0,141.3 120.0,139.9 122.0,138.3 124.0,136.7 126.0,135.1 128.0,133.3 130.0,131.6 132.0,129.8 134.0,128.0 136.0,126.1 138.0,124.2 140.0,122.4 142.0,120.5 144.0,118.6 146.0,116.8 148.0,114.9 150.0,113.2 152.0,111.4 154.0,109.8 156.0,108.2 158.0,106.7 160.0,105.2 162.0,103.9 164.0,102.7 166.0,101.6 168.0,100.7 170.0,99.8 172.0,99.2 174.0,98.6 176.0,98.2 178.0,98.0 180.0,97.9 182.0,98.0 184.0,98.2 186.0,98.6 188.0,99.2 190.0,99.8 192.0,100.7 194.0,101.6 196.0,102.7 198.0,103.9 200.0,105.2 202.0,106.7 204.0,108.2 206.0,109.8 208.0,111.4 210.0,113.2 212.0,114.9 214.0,116.8 216.0,118.6 218.0,120.5 220.0,122.4 222.0,124.2 224.0,126.1 226.0,128.0 228.0,129.8 230.0,131.6 232.0,133.3 234.0,135.1 236.0,136.7 238.0,138.3 240.0,139.9 242.0,141.3 244.0,142.7 246.0,144.1 248.0,145.4 250.0,146.6 252.0,147.7 254.0,148.8 256.0,149.8 258.0,150.7 260.0,151.6 262.0,152.4 264.0,153.2 266.0,153.8 268.0,154.5 270.0,155.1 272.0,155.6 274.0,156.1 276.0,156.5 278.0,156.9 280.0,157.3 282.0,157.6 284.0,157.9 286.0,158.1 288.0,158.4 290.0,158.6 292.0,158.8 294.0,158.9 296.0,159.1 298.0,159.2 300.0,159.3 302.0,159.4 304.0,159.5 306.0,159.6 308.0,159.6 310.0,159.7 312.0,159.7 314.0,159.8 316.0,159.8 318.0,159.8 320.0,159.9 322.0,159.9 324.0,159.9 326.0,159.9 328.0,159.9 330.0,159.9 332.0,160.0 334.0,160.0 336.0,160.0 338.0,160.0 340.0,160.0" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <polyline points="20.0,159.6 22.0,159.6 24.0,159.6 26.0,159.5 28.0,159.5 30.0,159.5 32.0,159.4 34.0,159.4 36.0,159.3 38.0,159.3 40.0,159.2 42.0,159.2 44.0,159.1 46.0,159.0 48.0,159.0 50.0,158.9 52.0,158.8 54.0,158.7 56.0,158.6 58.0,158.5 60.0,158.4 62.0,158.3 64.0,158.2 66.0,158.0 68.0,157.9 70.0,157.7 72.0,157.6 74.0,157.4 76.0,157.2 78.0,157.0 80.0,156.8 82.0,156.6 84.0,156.3 86.0,156.0 88.0,155.7 90.0,155.4 92.0,155.1 94.0,154.7 96.0,154.4 98.0,153.9 100.0,153.5 102.0,153.0 104.0,152.5 106.0,152.0 108.0,151.4 110.0,150.7 112.0,150.1 114.0,149.3 116.0,148.6 118.0,147.7 120.0,146.8 122.0,145.8 124.0,144.8 126.0,143.7 128.0,142.5 130.0,141.2 132.0,139.8 134.0,138.4 136.0,136.8 138.0,135.1 140.0,133.3 142.0,131.3 144.0,129.2 146.0,126.9 148.0,124.5 150.0,121.9 152.0,119.1 154.0,116.1 156.0,112.9 158.0,109.5 160.0,105.8 162.0,101.8 164.0,97.5 166.0,92.9 168.0,88.0 170.0,82.8 172.0,77.1 174.0,71.0 176.0,64.5 178.0,57.5 180.0,50.0 182.0,57.5 184.0,64.5 186.0,71.0 188.0,77.1 190.0,82.8 192.0,88.0 194.0,92.9 196.0,97.5 198.0,101.8 200.0,105.8 202.0,109.5 204.0,112.9 206.0,116.1 208.0,119.1 210.0,121.9 212.0,124.5 214.0,126.9 216.0,129.2 218.0,131.3 220.0,133.3 222.0,135.1 224.0,136.8 226.0,138.4 228.0,139.8 230.0,141.2 232.0,142.5 234.0,143.7 236.0,144.8 238.0,145.8 240.0,146.8 242.0,147.7 244.0,148.6 246.0,149.3 248.0,150.1 250.0,150.7 252.0,151.4 254.0,152.0 256.0,152.5 258.0,153.0 260.0,153.5 262.0,153.9 264.0,154.4 266.0,154.7 268.0,155.1 270.0,155.4 272.0,155.7 274.0,156.0 276.0,156.3 278.0,156.6 280.0,156.8 282.0,157.0 284.0,157.2 286.0,157.4 288.0,157.6 290.0,157.7 292.0,157.9 294.0,158.0 296.0,158.2 298.0,158.3 300.0,158.4 302.0,158.5 304.0,158.6 306.0,158.7 308.0,158.8 310.0,158.9 312.0,159.0 314.0,159.0 316.0,159.1 318.0,159.2 320.0,159.2 322.0,159.3 324.0,159.3 326.0,159.4 328.0,159.4 330.0,159.5 332.0,159.5 334.0,159.5 336.0,159.6 338.0,159.6 340.0,159.6" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <line x1="60.0" y1="160.0" x2="60.0" y2="165.0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="60.0" y="178.0" font-size="11" fill="#1f2a44" text-anchor="middle">-3σ</text>
  <line x1="100.0" y1="160.0" x2="100.0" y2="165.0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="100.0" y="178.0" font-size="11" fill="#1f2a44" text-anchor="middle">-2σ</text>
  <line x1="140.0" y1="160.0" x2="140.0" y2="165.0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="140.0" y="178.0" font-size="11" fill="#1f2a44" text-anchor="middle">-1σ</text>
  <line x1="180.0" y1="160.0" x2="180.0" y2="165.0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180.0" y="178.0" font-size="11" fill="#1f2a44" text-anchor="middle">0</text>
  <line x1="220.0" y1="160.0" x2="220.0" y2="165.0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="220.0" y="178.0" font-size="11" fill="#1f2a44" text-anchor="middle">1σ</text>
  <line x1="260.0" y1="160.0" x2="260.0" y2="165.0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="260.0" y="178.0" font-size="11" fill="#1f2a44" text-anchor="middle">2σ</text>
  <line x1="300.0" y1="160.0" x2="300.0" y2="165.0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="300.0" y="178.0" font-size="11" fill="#1f2a44" text-anchor="middle">3σ</text>
  <text x="262.0" y="62.0" font-size="12" fill="#1d6fd1" text-anchor="start">Gaussian</text>
  <text x="262.0" y="78.0" font-size="11" fill="#1d6fd1" text-anchor="start">(the mean wins)</text>
  <text x="22.0" y="62.0" font-size="12" fill="#b4232c" text-anchor="start">Laplace: sharper</text>
  <text x="22.0" y="78.0" font-size="11" fill="#b4232c" text-anchor="start">peak, fatter tails</text>
  <text x="180.0" y="196.0" font-size="11" fill="#6c7a93" text-anchor="middle">both curves have the same σ</text>
</svg>
```
:::

::: context multipath When a signal takes the long way
A GNSS antenna expects the satellite's signal straight from the sky. Near a building, a ship's mast or the ground, a copy also arrives after bouncing, a little late, because the bounced path is longer. The receiver mixes the two and measures a distorted range. That error is not a gentle bell around zero. It depends on the geometry, drifts slowly, and now and then gets large. Receivers fight it with special antennas, and estimators fight it with the outlier and robust methods later in this module.
:::
