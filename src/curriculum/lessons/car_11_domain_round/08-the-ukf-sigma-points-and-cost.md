---
id: l08-the-ukf-sigma-points-and-cost
title: "The UKF: sigma points, and when it earns its cost"
minutes: 18
covers:
  - "the unscented Kalman filter: sigma points, why it exists and when it is worth the cost"
---

The UKF is the question after the EKF question, and it is asked in a specific way: not "what is it" but "when would you use it instead". That phrasing is deliberate. A candidate who answers "it is more accurate, so I would use it" has just said they would pay an unbounded computational premium for an unquantified benefit, which on flight hardware is not an engineering position. The answer the question is looking for is a trade, stated in both directions.

So this lesson gives you three things: the sigma-point construction in enough detail that you could write it on a board, a worked case where the difference between the two filters is visible in numbers, and the cost side of the trade stated honestly.

## The idea

The EKF approximates a nonlinear function by a linear one and then pushes an exact Gaussian through it. The unscented transform does the opposite: it approximates the *distribution* by a small set of points and then pushes them through the exact nonlinear function.

That inversion is the whole insight, and it is worth saying aloud in an interview because it explains everything that follows. Choosing a handful of points whose sample mean and sample covariance match a given mean and covariance exactly is easy. Approximating an arbitrary nonlinear function well is not. So do the easy approximation and keep the function exact.

## The sigma points and weights

For an $n$-dimensional state with mean $\hat{\mathbf{x}}$ and covariance $\mathbf{P}$, set the scaling parameter

$$\lambda = \alpha^2(n + \kappa) - n$$

and let $\mathbf{S}$ be any matrix square root satisfying $\mathbf{S}\mathbf{S}^{\mathsf{T}} = (n+\lambda)\mathbf{P}$ — in practice a Cholesky factor. (The letter $\mathbf{S}$ is standard for this factor; it is not the innovation covariance $\mathbf{S}_k$ of the previous lessons, and saying which you mean is worth one clause.) The $2n+1$ sigma points are

$$\boldsymbol{\chi}_0 = \hat{\mathbf{x}}, \qquad \boldsymbol{\chi}_i = \hat{\mathbf{x}} + [\mathbf{S}]_i, \qquad \boldsymbol{\chi}_{n+i} = \hat{\mathbf{x}} - [\mathbf{S}]_i \quad (i = 1,\ldots,n)$$

with $[\mathbf{S}]_i$ the $i$-th column of $\mathbf{S}$. The weights are

$$W_0^{(m)} = \frac{\lambda}{n+\lambda}, \qquad W_0^{(c)} = \frac{\lambda}{n+\lambda} + (1 - \alpha^2 + \beta), \qquad W_i^{(m)} = W_i^{(c)} = \frac{1}{2(n+\lambda)}$$

for $i = 1,\ldots,2n$. Propagate every point through the true function, $\mathbf{y}_i = \mathbf{g}(\boldsymbol{\chi}_i)$, with no linearisation anywhere, and recombine:

$$\hat{\mathbf{y}} = \sum_{i=0}^{2n} W_i^{(m)}\mathbf{y}_i, \qquad \mathbf{P}_{yy} = \sum_{i=0}^{2n} W_i^{(c)}(\mathbf{y}_i - \hat{\mathbf{y}})(\mathbf{y}_i - \hat{\mathbf{y}})^{\mathsf{T}}.$$

In the filter, the same machinery produces a cross-covariance $\mathbf{P}_{xy} = \sum_i W_i^{(c)}(\boldsymbol{\chi}_i - \hat{\mathbf{x}}^-)(\mathbf{y}_i - \hat{\mathbf{y}})^{\mathsf{T}}$, and the gain is $\mathbf{K} = \mathbf{P}_{xy}\mathbf{P}_{yy}^{-1}$, where $\mathbf{P}_{yy}$ — with the measurement noise $\mathbf{R}$ added to it — plays exactly the role the innovation covariance played in the linear filter. The state and covariance updates then read as before. **There is no $\mathbf{H}$ anywhere**, which is the point.

**The three parameters.** $\alpha$ sets the spread of the points, typically between $10^{-3}$ and $1$. $\kappa$ is a secondary scaling, usually $0$ or $3-n$. $\beta = 2$ is optimal for a Gaussian prior, encoding the known fourth moment of a normal distribution into the central covariance weight $W_0^{(c)}$. All three appear only in the weights and the spread factor $\sqrt{n+\lambda}$ — never as a derivative of anything.

::: key The scaled unscented transform
$\lambda = \alpha^2(n+\kappa) - n$; sigma points $\hat{\mathbf{x}}$ and $\hat{\mathbf{x}} \pm [\mathbf{S}]_i$ with $\mathbf{S}\mathbf{S}^{\mathsf{T}} = (n+\lambda)\mathbf{P}$; weights $W_0^{(m)} = \lambda/(n+\lambda)$, $W_0^{(c)} = W_0^{(m)} + (1-\alpha^2+\beta)$, $W_i = 1/(2(n+\lambda))$. Propagate every point through the true nonlinear function and recombine. $2n+1$ points, no Jacobians.
:::

## Why it exists

Two reasons, and they are separable — a candidate who gives only the accuracy one has given half.

**Accuracy.** The transformed mean and covariance are captured to higher order than a linearisation achieves. For any differentiable nonlinearity the unscented mean matches the true mean through third order in the Taylor sense, where the EKF's matches through first; the covariance is captured to second order. The practical consequence is that the EKF's predicted measurement is *biased* whenever the function curves across the covariance, and the UKF's is not.

**No Jacobians.** Sometimes the derivative is simply not available: a measurement model that involves a table lookup, an atmosphere model, an interpolated gravity field, a piece of vendor code you cannot differentiate. Sometimes it is available and wrong, because somebody hand-derived a $9\times9$ Jacobian and made a sign error in one entry that only matters in one flight regime. Removing an entire class of implementation bug is a real engineering benefit independent of the accuracy argument, and it is the one candidates forget.

::: example The same transform three ways, with numbers
A radar reports a target at range $100\,\mathrm{km} \pm 1\,\mathrm{km}$ and bearing $0 \pm 5^\circ$, and the filter's state is Cartesian, so the measurement has to be converted: $x = r\cos\theta$, $y = r\sin\theta$. This is the canonical test, because the conversion is mildly nonlinear and the bearing uncertainty is not small.

Take $n = 2$, $\alpha = 1$, $\kappa = 1$, $\beta = 2$. Then $\lambda = 1\times(2+1) - 2 = 1$, so $n + \lambda = 3$ and the spread factor is $\sqrt{3} = 1.732$. The weights are $W_0^{(m)} = 1/3$, $W_0^{(c)} = 1/3 + 2 = 2.333$, and $W_i = 1/6$ for the four outer points; the mean weights sum to $1/3 + 4/6 = 1$, as they must.

With $\sigma_\theta = 5^\circ = 0.08727\,\mathrm{rad}$, the five sigma points in $(x, y)$, in kilometres, are

| Point | $x$ | $y$ |
| --- | --- | --- |
| Centre | $100.0000$ | $0$ |
| $r + \sqrt{3}\sigma_r$ | $101.7321$ | $0$ |
| $r - \sqrt{3}\sigma_r$ | $98.2679$ | $0$ |
| $\theta + \sqrt{3}\sigma_\theta$ | $98.8599$ | $+15.0575$ |
| $\theta - \sqrt{3}\sigma_\theta$ | $98.8599$ | $-15.0575$ |

Note what the last two rows already show: swinging the bearing by a bit over $8.66^\circ$ moves the target more than a kilometre *closer* in $x$, and swinging it the other way does the same. The effect does not cancel, so the true mean of $x$ is less than $100\,\mathrm{km}$, and a linearisation — which is odd-symmetric about the centre — cannot see that at all.

| Quantity | Truth | UKF | EKF |
| --- | --- | --- | --- |
| Mean $x$ (km) | $99.61995$ | $99.61995$ | $100.00000$ |
| Variance of $x$ ($\mathrm{km^2}$) | $1.280$ | $1.578$ | $1.000$ |
| Variance of $y$ ($\mathrm{km^2}$) | $75.58$ | $75.58$ | $76.15$ |

The truth row is exact where a closed form exists and Monte Carlo over twenty million samples otherwise: $\mathbb{E}[x] = r\,\mathbb{E}[\cos\theta] = r\,e^{-\sigma_\theta^2/2}$, which evaluates to $99.61995\,\mathrm{km}$, and the unscented mean agrees with it to eight significant figures.

The EKF's mean is off by $380\,\mathrm{m}$ — every conversion, in the same direction, forever. Worse is the variance column: the EKF reports $1.000\,\mathrm{km^2}$ against a true $1.280$, about $22\%$ **optimistic**, which is the dangerous direction, because it makes the filter trust this measurement more than it should. The UKF with the standard $\beta = 2$ reports $1.578$, about $23\%$ conservative — safe rather than sharp. (With $\beta = 0$, which drops the fourth-moment correction, it reports $1.289$, within $1\%$ of truth; $\beta$ is a tuning choice about how much conservatism you want, not a correctness switch.)
:::

## What it costs

**Computation.** The dominant cost is $2n+1$ evaluations of the propagation function per step instead of one, plus a matrix square root of an $n\times n$ covariance. For a $15$-state inertial error filter that is $31$ propagations per cycle. If the propagation is a numerical integration of a full force model, that factor of thirty-one is the entire conversation.

**A Cholesky factor every cycle.** The covariance must stay positive definite, or the square root fails outright rather than degrading gracefully. An EKF with a slightly indefinite $\mathbf{P}$ limps; a UKF stops. The square-root UKF, which propagates the factor rather than the covariance, exists for exactly this reason.

**Extreme weights at small $\alpha$.** As $\alpha \to 0$, $\lambda \to -n$, so $n+\lambda \to 0$ and the weights blow up: the central mean weight goes large and negative while the outer weights go large and positive, and they sum to one only through cancellation. Nothing here is a mistake — those weights are what preserve the mean's accuracy as the points crowd together — but any covariance computed from them subtracts large quantities to get a small one, which is more exposed to round-off than the same computation at a moderate $\alpha$.

**The nonlinearity has to be worth it.** For a mildly nonlinear problem the two filters perform comparably and the EKF is cheaper. Paying thirty times the propagation cost to move the third significant figure is not an engineering decision.

::: key When a UKF is preferable to an EKF
When the dynamics or measurement models are strongly nonlinear *over the current uncertainty*, or when Jacobians are unavailable or unreliable, and the extra computation is affordable. For mildly nonlinear problems the EKF is cheaper and performs comparably, so the choice is a cost–accuracy trade rather than an automatic upgrade.
:::

::: example "When would you use a UKF instead of an EKF?"
**A weak answer:** "The UKF handles nonlinearity better because it does not linearise — it propagates sigma points through the actual nonlinear function. So for a nonlinear system I would use a UKF."

Every sentence is true and the conclusion does not follow, because every system is nonlinear and almost all of them fly EKFs.

**A strong answer:**

"It is a trade, so let me give both sides and then the test I would apply.

What the UKF buys. It propagates $2n+1$ deterministic points through the true function instead of linearising, so the transformed mean and covariance are captured to higher order — the mean to third order in the Taylor sense against the EKF's first, the covariance to second. Concretely, on a polar-to-Cartesian conversion at $100\,\mathrm{km}$ with five degrees of bearing uncertainty, the EKF's converted mean is biased by about $380\,\mathrm{m}$ and its reported variance is about twenty percent optimistic, while the unscented mean matches the truth to eight figures. And it needs no Jacobians at all, which matters when the model contains a table lookup or vendor code, or when the hand-derived Jacobian is the thing most likely to have a sign error in it.

What it costs. Thirty-one propagations per cycle for a fifteen-state filter instead of one, plus a Cholesky factorisation every step, which also means the covariance has to stay strictly positive definite or the filter stops rather than degrading.

The test I would apply. Compare the state uncertainty against the scale over which the model curves — concretely, estimate the second-order term the EKF throws away and compare it with the measurement noise. If that bias is a small fraction of a sensor sigma, linearising is fine and the UKF is buying nothing worth thirty propagations. If it is several sigma, the EKF's predicted measurement is biased by something its own covariance does not account for, and no amount of tuning fixes that.

I would also note the middle options before jumping. An iterated EKF re-linearises the update at the corrected estimate and costs almost nothing. An error-state formulation keeps the linearised quantity small by construction, which is what attitude filters do. Either can close most of the gap for a fraction of the cost, and I would try them before paying for sigma points."

**What the interviewer learns:** the candidate states both sides of the trade, quantifies the benefit rather than asserting it, names the specific computational cost on a realistic state dimension, gives a decision test that could actually be run, and knows the intermediate options rather than treating the choice as binary.
:::

## Check yourself

::: check
For a six-state filter with $\alpha = 1$, $\kappa = 0$ and $\beta = 2$, give $\lambda$, the number of sigma points, the spread factor, and all the weights.
:::

::: answer
$\lambda = \alpha^2(n+\kappa) - n = 1\times(6+0) - 6 = 0$. With $\lambda = 0$, $n + \lambda = 6$, so the spread factor is $\sqrt{6} = 2.449$, and there are $2n+1 = 13$ sigma points. The weights are $W_0^{(m)} = 0/6 = 0$, $W_0^{(c)} = 0 + (1 - 1 + 2) = 2$, and $W_i^{(m)} = W_i^{(c)} = 1/12$ for the twelve outer points. Check: the mean weights sum to $0 + 12/12 = 1$. Note the consequence of $\lambda = 0$ — the centre point contributes nothing to the mean at all, which is a legitimate but slightly odd configuration, and it is why $\kappa = 3 - n$ (giving $\lambda = 3 - n$) is often preferred when $\alpha$ is left at one.
:::

::: check
Why does the unscented transform get the mean of a curved function right when a linearisation cannot, even in principle?
:::

::: answer
A linearisation replaces the function by its tangent plane at the mean, and a tangent plane is odd-symmetric about that point: a deviation one way and an equal deviation the other way produce equal and opposite changes, which cancel in the average. So a linearised prediction always returns $\mathbf{h}$ evaluated at the mean, no matter how the function curves. Curvature is even-symmetric — both deviations move the output the same way — so it contributes a bias that a linear model structurally cannot represent. The sigma-point set evaluates the true function at points on both sides, so the two contributions do not cancel and the even part survives into the weighted average. In the polar example both bearing sigma points give $x = 98.8599\,\mathrm{km}$, below the centre value of $100$, and that is exactly the bias the linearisation misses.
:::

::: check
A colleague proposes replacing a $15$-state EKF with a UKF "for accuracy". State the cost in concrete terms and the question you would ask before agreeing.
:::

::: answer
The cost is $2n+1 = 31$ evaluations of the propagation function per cycle instead of one, plus a Cholesky factorisation of a $15\times15$ covariance every cycle, plus the requirement that the covariance remain strictly positive definite — a UKF fails outright where an EKF merely degrades. If the propagation integrates a full force model, that is roughly thirty times the dominant cost of the filter. The question to ask first is how nonlinear the models actually are *across the current covariance*, which is answerable: estimate the second-order term the EKF discards and compare it with the measurement noise standard deviation. If the discarded bias is a small fraction of a sigma, the UKF will produce almost identical estimates at thirty times the cost. If it is several sigma, the case is made — and even then an iterated EKF or an error-state formulation may close most of the gap far more cheaply.
:::

::: check
What does $\beta$ do, and why did the worked example's UKF report a larger variance than the truth?
:::

::: answer
$\beta$ appears only in the central covariance weight, $W_0^{(c)} = \lambda/(n+\lambda) + (1 - \alpha^2 + \beta)$, and $\beta = 2$ is the value that encodes the fourth moment of a Gaussian prior. It affects the covariance and never the mean, which is why the example's means are identical for any $\beta$. In that example the centre sigma point sits $0.38\,\mathrm{km}$ from the transformed mean, and $\beta = 2$ weights that squared offset heavily, inflating the reported variance from about $1.289$ to $1.578\,\mathrm{km^2}$ against a true $1.280$. So the standard setting is conservative here rather than exact — which is the safe direction for a filter, since an overstated covariance makes it use data it should use, whereas the EKF's understated $1.000$ makes it trust a measurement more than it deserves.
:::

::: check
Name a situation where you would choose a UKF even though the nonlinearity is mild.
:::

::: answer
When the Jacobians are unavailable or untrustworthy. A measurement model built on a table lookup, an interpolated gravity or atmosphere model, or third-party code you cannot differentiate has no analytic Jacobian to write; a finite-difference Jacobian is possible but adds its own step-size tuning and its own noise. And a large hand-derived Jacobian is one of the most reliable sources of latent bugs in a filter, because an error in one entry can be invisible in most flight regimes and decisive in one. The UKF removes that entire class of defect by construction. That is an argument about implementation risk rather than about accuracy, and it stands on its own.
:::

## Summary

| Item | Content |
| --- | --- |
| The idea | Approximate the distribution by points, keep the function exact — the reverse of linearising |
| Scaling | $\lambda = \alpha^2(n+\kappa) - n$; spread factor $\sqrt{n+\lambda}$ |
| Sigma points | $\boldsymbol{\chi}_0 = \hat{\mathbf{x}}$, $\boldsymbol{\chi}_{i} = \hat{\mathbf{x}} \pm [\mathbf{S}]_i$ with $\mathbf{S}\mathbf{S}^{\mathsf{T}} = (n+\lambda)\mathbf{P}$; $2n+1$ of them |
| Weights | $W_0^{(m)} = \lambda/(n+\lambda)$; $W_0^{(c)} = W_0^{(m)} + (1-\alpha^2+\beta)$; $W_i = 1/(2(n+\lambda))$ |
| Parameters | $\alpha$ spread, $10^{-3}$ to $1$; $\kappa$ usually $0$ or $3-n$; $\beta = 2$ for a Gaussian prior |
| What it buys | Mean accurate to third order, covariance to second, in the Taylor sense; no Jacobians at all |
| Worked case | Polar to Cartesian at $100\,\mathrm{km}$, $\sigma_\theta = 5^\circ$: EKF mean off by $380\,\mathrm{m}$ and $22\%$ optimistic in variance; unscented mean exact to eight figures |
| What it costs | $2n+1$ propagations ($31$ for $n=15$), a Cholesky each cycle, strict positive definiteness, extreme weights at small $\alpha$ |
| The decision test | Compare the discarded second-order term with the measurement noise; try an iterated EKF or error-state form first |

The next lesson is the one that tells you whether any of these filters is actually working: process and measurement noise as tuning knobs, and the two consistency statistics that turn "it looks fine" into a test.
