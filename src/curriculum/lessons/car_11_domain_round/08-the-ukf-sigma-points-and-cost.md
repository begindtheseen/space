---
id: l08-the-ukf-sigma-points-and-cost
title: "The UKF: sigma points, and when it earns its cost"
minutes: 20
covers:
  - "the unscented Kalman filter: sigma points, why it exists and when it is worth the cost"
---

Suppose you want to know how a bag of oddly shaped pebbles will roll down a bumpy slide. You could try to write an exact formula for every bump — very hard. Or you could pick five pebbles that together represent the whole bag, roll each one down the real slide, and see where they land. The second way skips the hard math and uses the real slide.

That second way is the **[[unscented Kalman filter|unscented-name]]**, or **UKF** (said "U-K-F"). It is the question that comes after the EKF question, and it is asked in a specific way: not "what is it?" but "when would you use it instead?" That wording is on purpose. A candidate who says "it is more accurate, so I would use it" has agreed to pay an unlimited computing price for a benefit they have not measured. On flight hardware, that is not an engineering position. The answer the interviewer wants is a trade, stated in both directions.

This lesson gives you three things: the sigma-point recipe in enough detail to write on a board, a worked case where the difference between the two filters shows up in numbers, and the cost side of the trade, stated honestly.

## The idea

The EKF takes the curved function, replaces it with a straight-line version, and then pushes the exact bell-curve uncertainty through that straight line. The **unscented transform** does the opposite. It replaces the *uncertainty* with a small set of carefully chosen points, and pushes those points through the *exact* curved function.

That flip is the whole insight. Say it out loud in an interview, because it explains everything that follows. Picking a handful of points whose average and spread match a given mean and covariance exactly is easy. Approximating an arbitrary curved function well is hard. So do the easy approximation and keep the function exact.

## The sigma points and weights

The chosen points are called **[[sigma points|sigma-picture]]** — "sigma" because they sit a few standard deviations ($\sigma$) out from the mean in each direction. Here is the recipe.

Your state has $n$ numbers in it (so it is "$n$-dimensional"), with mean $\hat{\mathbf{x}}$ and covariance $\mathbf{P}$. First set a scaling number, $\lambda$ (the Greek letter "lambda"):

$$\lambda = \alpha^2(n + \kappa) - n$$

Here $\alpha$ ("alpha") and $\kappa$ ("kappa") are tuning parameters, explained below.

Next you need a "square root" of the covariance: a matrix $\mathbf{S}$ with $\mathbf{S}\mathbf{S}^{\mathsf{T}} = (n+\lambda)\mathbf{P}$. For a single number, the square root of a variance is the standard deviation. For a matrix, the usual choice is a **[[Cholesky factor|cholesky]]**. (The letter $\mathbf{S}$ is standard for this factor. It is *not* the innovation covariance $\mathbf{S}_k$ from the previous lessons. In an interview, say which one you mean — it takes one clause.)

The $2n+1$ sigma points are

$$\boldsymbol{\chi}_0 = \hat{\mathbf{x}}, \qquad \boldsymbol{\chi}_i = \hat{\mathbf{x}} + [\mathbf{S}]_i, \qquad \boldsymbol{\chi}_{n+i} = \hat{\mathbf{x}} - [\mathbf{S}]_i \quad (i = 1,\ldots,n)$$

where $[\mathbf{S}]_i$ is column $i$ of $\mathbf{S}$, and $\boldsymbol{\chi}$ is the Greek letter "chi" (said "kye"). In words: one point at the mean, then for each of the $n$ directions, one point pushed out along that direction and one pushed the same distance the other way. That gives $1 + 2n$ points.

Each point gets a **weight** — how much it counts in the average. There are two sets, one for the mean (superscript $(m)$) and one for the covariance (superscript $(c)$). Read $W_0^{(m)}$ as "W zero, m":

$$W_0^{(m)} = \frac{\lambda}{n+\lambda}, \qquad W_0^{(c)} = \frac{\lambda}{n+\lambda} + (1 - \alpha^2 + \beta), \qquad W_i^{(m)} = W_i^{(c)} = \frac{1}{2(n+\lambda)}$$

for $i = 1,\ldots,2n$. Now push every point through the true function $\mathbf{g}$, getting $\mathbf{y}_i = \mathbf{g}(\boldsymbol{\chi}_i)$. No linearizing anywhere. Then recombine with a weighted average and a weighted spread:

$$\hat{\mathbf{y}} = \sum_{i=0}^{2n} W_i^{(m)}\mathbf{y}_i, \qquad \mathbf{P}_{yy} = \sum_{i=0}^{2n} W_i^{(c)}(\mathbf{y}_i - \hat{\mathbf{y}})(\mathbf{y}_i - \hat{\mathbf{y}})^{\mathsf{T}}.$$

The big $\Sigma$ means "add up, for $i$ from $0$ to $2n$".

**Inside the filter.** The same machinery gives a **cross-covariance** — how the state errors and measurement errors move together:

$$\mathbf{P}_{xy} = \sum_i W_i^{(c)}(\boldsymbol{\chi}_i - \hat{\mathbf{x}}^-)(\mathbf{y}_i - \hat{\mathbf{y}})^{\mathsf{T}}.$$

The gain is $\mathbf{K} = \mathbf{P}_{xy}\mathbf{P}_{yy}^{-1}$. Here $\mathbf{P}_{yy}$, with the measurement noise $\mathbf{R}$ added to it, plays exactly the role the innovation covariance played in the linear filter. The state and covariance updates then read as before. **There is no $\mathbf{H}$ anywhere**, and that is the point.

**The three parameters.**

- $\alpha$ sets how far out the points spread, typically between $10^{-3}$ and $1$.
- $\kappa$ is a secondary scaling, usually $0$ or $3-n$.
- $\beta$ ("beta") $= 2$ is optimal for a Gaussian (bell-curve) prior. It builds the known **[[fourth moment|fourth-moment]]** of a normal distribution into the central covariance weight $W_0^{(c)}$.

All three appear only in the weights and in the spread factor $\sqrt{n+\lambda}$. None of them is ever a derivative of anything.

::: key The scaled unscented transform
$\lambda = \alpha^2(n+\kappa) - n$; sigma points $\hat{\mathbf{x}}$ and $\hat{\mathbf{x}} \pm [\mathbf{S}]_i$ with $\mathbf{S}\mathbf{S}^{\mathsf{T}} = (n+\lambda)\mathbf{P}$; weights $W_0^{(m)} = \lambda/(n+\lambda)$, $W_0^{(c)} = W_0^{(m)} + (1-\alpha^2+\beta)$, $W_i = 1/(2(n+\lambda))$. Propagate every point through the true nonlinear function and recombine. $2n+1$ points, no Jacobians.
:::

## Why it exists

There are two reasons, and they are separate. A candidate who gives only the accuracy reason has given half the answer.

**Accuracy.** The UKF captures the transformed mean and covariance to a **[[higher order|taylor-order]]** than a linearization does. For any smooth curved function, the unscented mean matches the true mean through third order in the Taylor sense; the EKF's matches only through first. The covariance is captured to second order. In practice: whenever the function curves across the covariance, the EKF's predicted measurement is *biased*, and the UKF's is not.

**No Jacobians.** Sometimes the slope is not available at all. The measurement model might use a table lookup, an atmosphere model, an interpolated gravity field, or a piece of vendor code you cannot differentiate. Sometimes the slope is available and wrong: somebody worked out a $9\times9$ Jacobian by hand and made a sign error in one entry that matters only in one flight regime. Removing a whole class of bug is a real engineering benefit, separate from accuracy. It is the one candidates forget.

::: key Why the UKF exists
It propagates a deterministic set of $2n+1$ sigma points through the true nonlinear functions instead of linearizing, capturing the mean and covariance to higher order, and it needs no Jacobians. It costs more computation and is worth it when the nonlinearity is strong.
:::

::: example The same transform three ways, with numbers
A radar reports a target at range $100\,\mathrm{km} \pm 1\,\mathrm{km}$ and bearing $0 \pm 5^\circ$. The filter's state is in $x$ and $y$ (Cartesian), so the measurement must be converted from **[[polar|polar-banana]]** form: $x = r\cos\theta$, $y = r\sin\theta$. This is the classic test, because the conversion is mildly curved and the bearing uncertainty is not small.

**Step 1: parameters.** Take $n = 2$, $\alpha = 1$, $\kappa = 1$, $\beta = 2$. Then $\lambda = 1\times(2+1) - 2 = 1$, so $n + \lambda = 3$, and the spread factor is $\sqrt{3} = 1.732$.

**Step 2: weights.** $W_0^{(m)} = 1/3$. $W_0^{(c)} = 1/3 + (1 - 1 + 2) = 2.333$. Each of the four outer points gets $W_i = 1/(2\times3) = 1/6$. Check: the mean weights sum to $1/3 + 4/6 = 1$, as they must.

**Step 3: points.** With $\sigma_r = 1\,\mathrm{km}$ and $\sigma_\theta = 5^\circ = 0.08727\,\mathrm{rad}$, the outer points move range by $\pm\sqrt{3}\times1 = \pm1.732\,\mathrm{km}$ or bearing by $\pm\sqrt{3}\times5^\circ = \pm8.66^\circ$. Converting each to $(x, y)$, in kilometers:

| Point | $x$ | $y$ |
| --- | --- | --- |
| Center | $100.0000$ | $0$ |
| $r + \sqrt{3}\sigma_r$ | $101.7321$ | $0$ |
| $r - \sqrt{3}\sigma_r$ | $98.2679$ | $0$ |
| $\theta + \sqrt{3}\sigma_\theta$ | $98.8599$ | $+15.0575$ |
| $\theta - \sqrt{3}\sigma_\theta$ | $98.8599$ | $-15.0575$ |

For the fourth row: $x = 100\cos(8.66^\circ) = 98.8599$ and $y = 100\sin(8.66^\circ) = 15.0575$.

Look at the last two rows. Swinging the bearing either way moves the target more than a kilometer *closer* in $x$. The two swings do not cancel, so the true mean of $x$ is less than $100\,\mathrm{km}$. A linearization cannot see this at all: a straight line moves equal amounts in opposite directions for opposite swings, so they always cancel.

**Step 4: recombine and compare.**

| Quantity | Truth | UKF | EKF |
| --- | --- | --- | --- |
| Mean $x$ (km) | $99.61995$ | $99.61995$ | $100.00000$ |
| Variance of $x$ ($\mathrm{km^2}$) | $1.280$ | $1.578$ | $1.000$ |
| Variance of $y$ ($\mathrm{km^2}$) | $75.58$ | $75.58$ | $76.15$ |

The truth row comes from exact formulas (a large **[[Monte Carlo|monte-carlo]]** run agrees). For the mean, $\mathbb{E}[x] = r\,\mathbb{E}[\cos\theta] = r\,e^{-\sigma_\theta^2/2} = 99.61995\,\mathrm{km}$, where $\mathbb{E}$ means "expected value", the long-run average. The unscented mean agrees with it to seven significant figures — within half a millimeter.

**What it means.** The EKF's mean is off by $380\,\mathrm{m}$ — every conversion, the same direction, forever. The variance column is worse. The EKF reports $1.000\,\mathrm{km^2}$ against a true $1.280$: about $22\%$ **[[optimistic|optimistic-bars]]**. That is the dangerous direction, because it makes the filter trust this measurement more than it should. The UKF with the standard $\beta = 2$ reports $1.578$, about $23\%$ conservative — safe rather than sharp. With $\beta = 0$, which drops the fourth-moment correction, it reports $1.289$, within $1\%$ of truth. So $\beta$ is a tuning choice about how much caution you want, not a correctness switch.

**Sanity check.** The mean moved *toward* the radar, as the geometry of the last two rows said it must. And the $y$ variance barely changed between methods, because $y = r\sin\theta$ is nearly straight for small angles.
:::

## What it costs

**Computation.** The main cost is $2n+1$ runs of the propagation function per step instead of one, plus a matrix square root of an $n\times n$ covariance. For a $15$-state inertial error filter, that is $2\times15+1 = 31$ **[[propagations per cycle|cost-bars]]**. If each propagation is a numerical integration of a full force model, that factor of thirty-one is the whole conversation.

**A Cholesky factor every cycle.** The covariance must stay **positive definite** — positive spread in every direction — or the square root fails outright instead of degrading gently. An EKF with a slightly broken $\mathbf{P}$ limps along; a UKF stops. The **square-root UKF**, which carries the factor $\mathbf{S}$ forward instead of $\mathbf{P}$, exists for exactly this reason.

**Extreme weights at small $\alpha$.** As $\alpha \to 0$, $\lambda \to -n$, so $n+\lambda \to 0$ and the weights blow up. The central mean weight becomes large and negative, the outer weights large and positive, and they sum to one only by cancelling. For example, with $n = 15$, $\kappa = 0$ and $\alpha = 0.1$: $\lambda = 0.01\times15 - 15 = -14.85$, so $n + \lambda = 0.15$, $W_0^{(m)} = -14.85/0.15 = -99$, and each of the $30$ outer weights is $1/0.3 = 3.33$. Check: $-99 + 30\times3.333 = -99 + 100 = 1$. Nothing here is a mistake — those weights keep the mean accurate as the points crowd together. But any covariance built from them subtracts big numbers to get a small one, which is more exposed to **[[round-off|round-off]]** than the same sum at a moderate $\alpha$.

**The curvature has to be worth it.** For a mildly nonlinear problem, the two filters perform about the same, and the EKF is cheaper. Paying thirty times the propagation cost to move the third significant figure is not an engineering decision.

::: key When a UKF is preferable to an EKF
When the dynamics or measurement models are strongly nonlinear *over the current uncertainty*, or when Jacobians are unavailable or unreliable, and the extra computation is affordable. For mildly nonlinear problems the EKF is cheaper and performs comparably, so the choice is a cost–accuracy trade rather than an automatic upgrade.
:::

::: warning "More accurate" is not an answer
Every real system is nonlinear, and almost all of them fly EKFs. So "the system is nonlinear, therefore UKF" proves nothing. The question is always *how* nonlinear, across *this* covariance, compared with *this* sensor noise — and whether the answer is worth thirty-one propagations.
:::

::: example "When would you use a UKF instead of an EKF?"
**A weak answer:** "The UKF handles nonlinearity better because it does not linearize — it propagates sigma points through the actual nonlinear function. So for a nonlinear system I would use a UKF."

Every sentence is true, and the conclusion does not follow, because every system is nonlinear and almost all of them fly EKFs.

**A strong answer:**

"It is a trade, so let me give both sides and then the test I would apply.

What the UKF buys. It propagates $2n+1$ deterministic points through the true function instead of linearizing, so the transformed mean and covariance are captured to higher order — the mean to third order in the Taylor sense against the EKF's first, the covariance to second. Concretely, on a polar-to-Cartesian conversion at $100\,\mathrm{km}$ with five degrees of bearing uncertainty, the EKF's converted mean is biased by about $380\,\mathrm{m}$ and its reported variance is about twenty percent optimistic, while the unscented mean matches the truth to seven figures. And it needs no Jacobians at all. That matters when the model contains a table lookup or vendor code, or when the hand-derived Jacobian is the thing most likely to hide a sign error.

What it costs. Thirty-one propagations per cycle for a fifteen-state filter instead of one, plus a Cholesky factorization every step — which also means the covariance must stay strictly positive definite, or the filter stops rather than degrading.

The test I would apply. Compare the state uncertainty against the scale over which the model curves. Concretely, estimate the second-order term the EKF throws away and compare it with the measurement noise. If that bias is a small fraction of a sensor sigma, linearizing is fine, and the UKF is buying nothing worth thirty propagations. If it is several sigma, the EKF's predicted measurement is biased by something its own covariance does not account for, and no amount of tuning fixes that.

I would also try the middle options first. An **[[iterated EKF|middle-options]]** re-linearizes the update at the corrected estimate and costs almost nothing. An error-state formulation keeps the linearized quantity small by construction, which is what attitude filters do. Either can close most of the gap for a fraction of the cost."

**What the interviewer learns:** the candidate states both sides of the trade, measures the benefit instead of asserting it, names the computing cost for a realistic state size, gives a decision test that could actually be run, and knows the in-between options instead of treating the choice as either-or.
:::

## Check yourself

::: check
For a six-state filter with $\alpha = 1$, $\kappa = 0$ and $\beta = 2$, give $\lambda$, the number of sigma points, the spread factor, and all the weights.
:::

::: answer
$\lambda = \alpha^2(n+\kappa) - n = 1\times(6+0) - 6 = 0$.

With $\lambda = 0$, $n + \lambda = 6$, so the spread factor is $\sqrt{6} = 2.449$. There are $2n+1 = 13$ sigma points.

The weights: $W_0^{(m)} = 0/6 = 0$; $W_0^{(c)} = 0 + (1 - 1 + 2) = 2$; and $W_i^{(m)} = W_i^{(c)} = 1/(2\times6) = 1/12$ for the twelve outer points. Check: the mean weights sum to $0 + 12/12 = 1$.

Notice what $\lambda = 0$ does: the center point adds nothing to the mean at all. That is legal but a little odd, and it is why $\kappa = 3 - n$ (giving $\lambda = 3 - n$) is often preferred when $\alpha$ is left at one.
:::

::: check
Why does the unscented transform get the mean of a curved function right when a linearization cannot, even in principle?
:::

::: answer
A linearization replaces the function by its tangent plane at the mean. A tangent plane is **odd-symmetric** about that point: a step one way and an equal step the other way give equal and opposite changes, which cancel in the average. So a linearized prediction always returns $\mathbf{h}$ at the mean, however the function curves.

Curvature is **even-symmetric**: both steps move the output the same way. So it adds a bias that a linear model cannot represent, by its structure.

The sigma points evaluate the true function on both sides of the mean, so the two contributions do not cancel, and the even part survives into the weighted average. In the polar example, both bearing sigma points give $x = 98.8599\,\mathrm{km}$, below the center value of $100$ — exactly the bias the linearization misses.
:::

::: check
A colleague proposes replacing a $15$-state EKF with a UKF "for accuracy". State the cost in concrete terms and the question you would ask before agreeing.
:::

::: answer
The cost: $2n+1 = 31$ runs of the propagation function per cycle instead of one; a Cholesky factorization of a $15\times15$ covariance every cycle; and a covariance that must stay strictly positive definite, because a UKF fails outright where an EKF merely degrades. If the propagation integrates a full force model, that is roughly thirty times the filter's main cost.

The question to ask first: how nonlinear are the models *across the current covariance*? That can be answered. Estimate the second-order term the EKF discards and compare it with the measurement noise standard deviation. If the discarded bias is a small fraction of a sigma, the UKF will give almost identical estimates at thirty times the cost. If it is several sigma, the case is made — and even then an iterated EKF or an error-state formulation may close most of the gap far more cheaply.
:::

::: check
What does $\beta$ do, and why did the worked example's UKF report a larger variance than the truth?
:::

::: answer
$\beta$ appears only in the central covariance weight, $W_0^{(c)} = \lambda/(n+\lambda) + (1 - \alpha^2 + \beta)$. The value $\beta = 2$ encodes the fourth moment of a Gaussian prior. It changes the covariance and never the mean, which is why the example's means are the same for any $\beta$.

In the example, the center sigma point sits $0.38\,\mathrm{km}$ from the transformed mean. $\beta = 2$ weights that squared offset heavily (weight $2.333$), inflating the reported variance from about $1.289$ to $1.578\,\mathrm{km^2}$ against a true $1.280$.

So the standard setting is conservative here rather than exact. That is the safe direction for a filter: an overstated covariance still lets it use the data it should use, whereas the EKF's understated $1.000$ makes it trust a measurement more than it deserves.
:::

::: check
Name a situation where you would choose a UKF even though the nonlinearity is mild.
:::

::: answer
When the Jacobians are unavailable or untrustworthy. A measurement model built on a table lookup, an interpolated gravity or atmosphere model, or third-party code you cannot differentiate has no formula-based Jacobian to write. A **[[finite-difference|finite-difference]]** Jacobian is possible, but it adds its own step-size tuning and its own noise.

And a large hand-derived Jacobian is one of the most reliable hiding places for bugs in a filter, because an error in one entry can be invisible in most flight regimes and decisive in one. The UKF removes that whole class of defect by construction. That is an argument about implementation risk rather than accuracy, and it stands on its own.
:::

## Summary

| Item | Content |
| --- | --- |
| The idea | Approximate the distribution by points, keep the function exact — the reverse of linearizing |
| Scaling | $\lambda = \alpha^2(n+\kappa) - n$; spread factor $\sqrt{n+\lambda}$ |
| Sigma points | $\boldsymbol{\chi}_0 = \hat{\mathbf{x}}$, $\boldsymbol{\chi}_{i} = \hat{\mathbf{x}} \pm [\mathbf{S}]_i$ with $\mathbf{S}\mathbf{S}^{\mathsf{T}} = (n+\lambda)\mathbf{P}$; $2n+1$ of them |
| Weights | $W_0^{(m)} = \lambda/(n+\lambda)$; $W_0^{(c)} = W_0^{(m)} + (1-\alpha^2+\beta)$; $W_i = 1/(2(n+\lambda))$ |
| Parameters | $\alpha$ spread, $10^{-3}$ to $1$; $\kappa$ usually $0$ or $3-n$; $\beta = 2$ for a Gaussian prior |
| What it buys | Mean accurate to third order, covariance to second, in the Taylor sense; no Jacobians at all |
| Worked case | Polar to Cartesian at $100\,\mathrm{km}$, $\sigma_\theta = 5^\circ$: EKF mean off by $380\,\mathrm{m}$ and $22\%$ optimistic in variance; unscented mean right to seven figures |
| What it costs | $2n+1$ propagations ($31$ for $n=15$), a Cholesky each cycle, strict positive definiteness, extreme weights at small $\alpha$ |
| The decision test | Compare the discarded second-order term with the measurement noise; try an iterated EKF or error-state form first |

The next lesson is the one that tells you whether any of these filters is actually working: process and measurement noise as tuning knobs, and the two consistency statistics that turn "it looks fine" into a test.

::: context unscented-name A filter named after deodorant
The unscented transform was developed in the mid-1990s by Simon Julier and Jeffrey Uhlmann. Uhlmann has said the name came from a stick of unscented deodorant he happened to see, and that he picked it partly so the method would not end up called "the Uhlmann filter". So the word says nothing about smells, and nothing technical either — it is a label that stuck.
:::

::: context sigma-picture Where the five points sit
For a two-number state, the recipe gives five points: one at the mean and two along each direction. The dashed ellipse is the one-standard-deviation boundary. With $n + \lambda = 3$, the outer points sit $\sqrt{3} \approx 1.73$ standard deviations out, on the solid ellipse.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <ellipse cx="180" cy="100" rx="60" ry="30" fill="#8fb8f0" fill-opacity="0.35" stroke="#1d6fd1" stroke-width="1.5" stroke-dasharray="5 4"/>
  <ellipse cx="180" cy="100" rx="103.9" ry="52" fill="none" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="76.1" y1="100" x2="283.9" y2="100" stroke="#6c7a93" stroke-width="1"/>
  <line x1="180" y1="48" x2="180" y2="152" stroke="#6c7a93" stroke-width="1"/>
  <g fill="#b4232c">
    <circle cx="180" cy="100" r="6"/>
    <circle cx="283.9" cy="100" r="6"/><circle cx="76.1" cy="100" r="6"/>
    <circle cx="180" cy="48" r="6"/><circle cx="180" cy="152" r="6"/>
  </g>
  <g font-size="12" fill="#1f2a44">
    <text x="190" y="93">mean</text>
    <text x="292" y="104">+ column 1</text>
    <text x="6" y="104">− column 1</text>
    <text x="190" y="44">+ column 2</text>
    <text x="190" y="166">− column 2</text>
    <text x="6" y="192">dashed: 1σ   solid: √3 σ</text>
  </g>
</svg>
```

Their weighted average is the mean and their weighted spread is the covariance, exactly.
:::

::: context cholesky The Cholesky factor
André-Louis Cholesky was a French army officer and surveyor who worked out, in the early 1900s, how to split a symmetric positive-definite matrix into a lower-triangular matrix times its own transpose: $\mathbf{P} = \mathbf{L}\mathbf{L}^{\mathsf{T}}$. It was published after he was killed in the First World War. It is the matrix version of a square root, it is fast (about $n^3/3$ multiplications), and it only works when every direction has positive variance — which is why a UKF fails outright if $\mathbf{P}$ goes bad.
:::

::: context fourth-moment What the fourth moment is
The mean (first moment) tells you where a spread of values is centered. The variance (second moment) tells you how wide it is. The **fourth moment** tells you how heavy the tails are — how often you see values far from the middle. For a bell curve it is exactly $3\sigma^4$. The sigma points on their own do not get that number right, and setting $\beta = 2$ adds a correction to the center weight that accounts for it when the uncertainty really is bell-shaped.
:::

::: context taylor-order What "third order" means
A Taylor expansion writes the output as the value at the mean plus terms in the deviation, the deviation squared, the deviation cubed, and so on. "Accurate to first order" means the answer is right if you keep only the straight-line term; the squared term and beyond are missed. "Accurate to third order" means the squared and cubed terms are also captured. For the mean of a curved function, the squared term is where the bias lives, so the EKF misses it and the UKF does not.
:::

::: context polar-banana Why polar-to-Cartesian is the classic test
A radar naturally measures in **polar** form: how far (range) and which way (bearing). Plot many possible target positions with a small range error and a wide bearing error and they fall along an arc of a circle centered on the radar — a curved "banana" shape rather than an oval. The center of a banana is not on the banana: the average position sits slightly inside the arc, closer to the radar. That is the $380\,\mathrm{m}$ bias in the example. The bigger the bearing error, the more the arc bends and the bigger the bias.
:::

::: context monte-carlo Checking by brute force
A **Monte Carlo** method answers a probability question by drawing millions of random samples and averaging. Here: draw a random range and bearing, convert to $x$, repeat twenty million times, average. The name comes from the casino in Monaco, a nod to games of chance; it was used by scientists at Los Alamos in the 1940s. It is slow but needs no clever math, so engineers use it to check the clever methods.
:::

::: context optimistic-bars Optimistic versus conservative, to scale
The bars show the variance of $x$ each method reports, in square kilometers. The EKF's bar is shorter than the truth — it claims more certainty than it has. The UKF's is longer — it is more cautious than it needs to be.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="90" y1="16" x2="90" y2="126" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="90" y="22" width="200" height="24" fill="#6c7a93"/>
  <rect x="90" y="58" width="246.6" height="24" fill="#1d6fd1"/>
  <rect x="90" y="94" width="156.3" height="24" fill="#b4232c"/>
  <line x1="290" y1="14" x2="290" y2="126" stroke="#1f2a44" stroke-width="1" stroke-dasharray="4 3"/>
  <g font-size="12" fill="#1f2a44">
    <text x="8" y="39">Truth</text><text x="8" y="75">UKF, β = 2</text><text x="8" y="111">EKF</text>
    <text x="252" y="39" fill="#ffffff">1.280</text>
    <text x="298" y="75" fill="#ffffff">1.578</text>
    <text x="254" y="111">1.000</text>
    <text x="150" y="144">dashed line: true variance</text>
  </g>
</svg>
```
:::

::: context cost-bars One propagation against thirty-one
Each step, the EKF runs the dynamics model once (and works out the Jacobian). The UKF runs it once per sigma point. For a $15$-state filter that is $31$ runs. If one run means numerically integrating gravity, drag and Sun and Moon pulls, the UKF's step costs roughly thirty times as much. On a slow, radiation-tolerant flight computer, that can decide whether the filter fits in its time slot at all.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44">
    <text x="8" y="36">EKF</text><text x="8" y="76">UKF</text>
  </g>
  <rect x="50" y="22" width="9" height="22" fill="#1d6fd1"/>
  <text x="66" y="38" font-size="12" fill="#1f2a44">1 run</text>
  <g fill="#b4232c">
    <rect x="50" y="62" width="279" height="22"/>
  </g>
  <g stroke="#ffffff" stroke-width="1"><line x1="59" y1="62" x2="59" y2="84"/><line x1="68" y1="62" x2="68" y2="84"/><line x1="77" y1="62" x2="77" y2="84"/><line x1="86" y1="62" x2="86" y2="84"/><line x1="95" y1="62" x2="95" y2="84"/><line x1="104" y1="62" x2="104" y2="84"/><line x1="113" y1="62" x2="113" y2="84"/><line x1="122" y1="62" x2="122" y2="84"/><line x1="131" y1="62" x2="131" y2="84"/><line x1="140" y1="62" x2="140" y2="84"/><line x1="149" y1="62" x2="149" y2="84"/><line x1="158" y1="62" x2="158" y2="84"/><line x1="167" y1="62" x2="167" y2="84"/><line x1="176" y1="62" x2="176" y2="84"/><line x1="185" y1="62" x2="185" y2="84"/><line x1="194" y1="62" x2="194" y2="84"/><line x1="203" y1="62" x2="203" y2="84"/><line x1="212" y1="62" x2="212" y2="84"/><line x1="221" y1="62" x2="221" y2="84"/><line x1="230" y1="62" x2="230" y2="84"/><line x1="239" y1="62" x2="239" y2="84"/><line x1="248" y1="62" x2="248" y2="84"/><line x1="257" y1="62" x2="257" y2="84"/><line x1="266" y1="62" x2="266" y2="84"/><line x1="275" y1="62" x2="275" y2="84"/><line x1="284" y1="62" x2="284" y2="84"/><line x1="293" y1="62" x2="293" y2="84"/><line x1="302" y1="62" x2="302" y2="84"/><line x1="311" y1="62" x2="311" y2="84"/><line x1="320" y1="62" x2="320" y2="84"/></g>
  <text x="200" y="104" font-size="12" fill="#1f2a44" text-anchor="middle">31 runs for n = 15, one block each</text>
</svg>
```
:::

::: context round-off Round-off, the computer's rounding
A computer stores each number with a fixed number of digits — about 16 significant digits for a standard double. Subtracting two big, nearly equal numbers throws away the matching leading digits and leaves only the noisy tail. With weights like $-99$ and $3.33$, a covariance is built by adding and cancelling large terms, so the small answer carries more rounding noise than it would with gentle weights.
:::

::: context middle-options Cheaper fixes to try first
The iterated EKF from the previous lesson repeats the measurement update, re-working the Jacobian at the improved estimate each time. The error-state idea, which Lesson 11 builds for attitude, keeps the filter estimating a small correction instead of the full state, so the slopes are always taken where the function is nearly straight. Both keep the EKF's cost of one propagation per step.
:::

::: context finite-difference Slopes by nudging
A **finite-difference** Jacobian finds each slope by nudging one input a small step, running the function again, and dividing the change in output by the step. It needs no formula, but the step size is a trap: too big and you measure the curvature, not the slope; too small and round-off noise swamps the change. It also costs one extra function run per state, which starts to look like the UKF's cost anyway.
:::
