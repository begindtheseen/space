---
id: l04-the-kalman-gain-as-a-trust-ratio
title: The Kalman gain as a trust ratio between prediction and measurement
minutes: 18
covers:
  - The Kalman gain as a trust ratio between prediction and measurement
---

You can recite $\mathbf{K} = \mathbf{P}^-\mathbf{H}^{\mathsf{T}}(\mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}} + \mathbf{R})^{-1}$ from the three-derivations lesson without having any feel for what a particular gain *means* when you see one printed out of a running filter. That feel is what an interviewer is checking for when they ask "your gain just dropped to near zero — what does that tell you?", and it is what you need at 2 a.m. when a real filter's telemetry looks wrong and the gain matrix is the only clue on the screen. This lesson builds that feel by treating $\mathbf{K}$ not as the output of a minimization but as a ratio: how much the filter believed its own prediction, divided by how much total disagreement it saw once the measurement came in.

The scalar case makes the ratio literal. The general case complicates it in one specific, learnable way — trust is not spent evenly across a correlated state — and breaks the "ratio never exceeds one" intuition in a way worth knowing before it surprises you in someone else's code.

## The trust ratio in closed form

Go back to the scalar update, $K = P^-/(P^- + R)$. Divide numerator and denominator by $R$ and define $\rho = P^-/R$, the **trust ratio**: how large the prediction's uncertainty is relative to the measurement's.

$$
K = \frac{\rho}{1 + \rho}.
$$

This is worth sitting with. $K$ is a function of $\rho$ alone — not of $P^-$ and $R$ separately, only their ratio. As $\rho \to 0$ (a confident prediction against a noisy sensor), $K \to 0$: the update barely moves the estimate. As $\rho \to \infty$ (a vague prediction against a sharp sensor), $K \to 1$: the update all but replaces the prediction with the measurement. At $\rho = 1$ — prediction and measurement equally uncertain — $K = 1/2$ exactly, regardless of whether that shared uncertainty is large or small.

::: example The ratio, not the scale, decides the gain
$K = P^-/(P^- + R)$ evaluated at four combinations, plus the running example's $P_0^+ = 25\,\mathrm{m^2}$ paired with an equally uncertain sensor:

| $P^-$ | $R$ | $\rho = P^-/R$ | $K$ |
| --- | --- | --- | --- |
| $1$ | $1$ | $1$ | $0.500$ |
| $1$ | $100$ | $0.01$ | $0.0099$ |
| $100$ | $1$ | $100$ | $0.9901$ |
| $100$ | $100$ | $1$ | $0.500$ |
| $25$ | $25$ | $1$ | $0.500$ |

The first and last three rows all have $\rho = 1$ and all give $K = 0.500$, whether the shared variance is $1\,\mathrm{m^2}$ or $100\,\mathrm{m^2}$. A filter with excellent sensors and an excellent dynamics model, and one with poor sensors and a poor model, can carry the identical gain — the gain reports relative confidence, never absolute accuracy. Reading $K = 0.5$ off a telemetry stream tells you the two sources were equally trusted; it tells you nothing about how good either one actually was without also knowing $P^-$ or $R$ on their own.
:::

::: key The Kalman gain as a trust ratio
$\mathbf{K} = \mathbf{P}^-\mathbf{H}^{\mathsf{T}}(\mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}} + \mathbf{R})^{-1}$. Large $\mathbf{P}^-$ or small $\mathbf{R}$ means trust the measurement; small $\mathbf{P}^-$ or large $\mathbf{R}$ means trust the prediction. In the scalar case $K = P^-/(P^- + R) = \rho/(1+\rho)$ with $\rho = P^-/R$.
:::

::: example Two sensors on the same prior
A prior says altitude is uncertain by $\sigma_p = 5\,\mathrm{m}$, so $P^- = 25\,\mathrm{m^2}$. Compare a differential-GPS altitude fix, $\sigma = 2\,\mathrm{cm}$ so $R = (0.02)^2 = 4\times10^{-4}\,\mathrm{m^2}$, against a barometric altimeter, $\sigma = 30\,\mathrm{m}$ so $R = 900\,\mathrm{m^2}$ — a plausible spread for a vehicle that has just decompressed a static port during a transonic pass.

$$
\rho_{\mathrm{DGPS}} = \frac{25}{4\times10^{-4}} = 62{,}500, \qquad
\rho_{\mathrm{baro}} = \frac{25}{900} = 0.0278.
$$

The DGPS gain is $K = 62{,}500/62{,}501 = 0.999984$: the update all but discards the prior and adopts the measurement, leaving $P^+ = (1-K)P^- = 4.00\times10^{-4}\,\mathrm{m^2}$ — the posterior inherits the sensor's own variance, because there was nothing left of the prior worth keeping. The barometric gain is $K = 0.0278/1.0278 = 0.02703$: the update moves the estimate only $2.7\%$ of the way toward the reading, and $P^+ = 24.32\,\mathrm{m^2}$, $\sigma^+ = 4.93\,\mathrm{m}$ — barely improved over the $5\,\mathrm{m}$ prior, because the altimeter is not telling the filter much it did not already believe. Same prior, same physical update equations, a gain that differs by four orders of magnitude, because the trust ratio differs by the same four orders of magnitude.
:::

## The general gain: a map into measurement space, then a rescale

The vector formula does two conceptually separate things, and it is worth pulling them apart. $\mathbf{P}^-\mathbf{H}^{\mathsf{T}}$ is the covariance between the *full state error* and the *predicted measurement error* — it takes the state-space uncertainty and reports how much of it lines up with what the sensor can see, mapping an $n\times n$ object into an $n\times m$ one. Then $\mathbf{S}^{-1} = (\mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}} + \mathbf{R})^{-1}$ rescales that cross-covariance by the *total* uncertainty in the measurement's own space — prediction uncertainty as seen through $\mathbf{H}$, plus sensor uncertainty. The product is the trust ratio's exact generalization: correlation with the measurement, divided by how much total disagreement that measurement can produce.

The alternate form derived as a check-yourself answer in the three-derivations lesson makes the same point differently and is worth having at hand for this lesson specifically:

$$
\mathbf{K} = \mathbf{P}^+\mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}.
$$

Read this one right to left: $\mathbf{R}^{-1}$ is the measurement's **precision** — how sharp the new information is. $\mathbf{H}^{\mathsf{T}}$ carries that precision back into state space. $\mathbf{P}^+$, the uncertainty that is *still there after* the update, scales it once more. A gain is large exactly when the incoming information is precise *and* the state remains genuinely uncertain about the directions that information touches — a precise sensor pointed at a state the filter already knows cold earns a small gain regardless of how good the sensor is, because $\mathbf{P}^+$ there is already small. This is the same content as $\rho/(1+\rho)$, seen through posterior rather than prior uncertainty.

## Trust is not spent evenly across a correlated state

The scalar ratio suggests a single dial between "believe the model" and "believe the sensor." A vector state has one dial per direction, and a correlated $\mathbf{P}^-$ couples them. Return to the eight-step altitude filter of the last lesson. At $k=1$, starting from an uncorrelated $\mathbf{P}_0^+ = \operatorname{diag}(100, 25)$, the gain was $\mathbf{K}_1 = (0.962,\ 0.0240)^{\mathsf{T}}$: heavy trust in the position correction, almost none in velocity, because one predict step had barely begun to correlate the two. By $k=2$ the velocity gain had grown to $0.320$; by $k=4$, to $0.721$ — larger, at that point, than some of the position gains later in the run. Nothing changed about how the altimeter measures position; what changed is how much the filter's own model had linked a position surprise to a velocity correction, through the position–velocity covariance that accumulates every predict step. Trust in an unmeasured state is borrowed entirely from its correlation with a measured one, and that correlation is itself something the filter learns as it runs, not a fixed property of $\mathbf{H}$.

::: example When a gain component exceeds one
Trust ratios in $[0,1]$ are a scalar-case intuition, not a law. Take $\mathbf{P}^- = \begin{pmatrix}1.0 & 1.5\\ 1.5 & 3.0\end{pmatrix}$ (positive definite: eigenvalues $0.197$ and $3.803$, both positive) with $\mathbf{H} = (1\ \ 0)$ and a precise sensor, $R = 0.01$. Then $S = 1.0 + 0.01 = 1.01$ and

$$
\mathbf{K} = \mathbf{P}^-\mathbf{H}^{\mathsf{T}}S^{-1} = \frac{1}{1.01}\begin{pmatrix}1.0\\ 1.5\end{pmatrix} = \begin{pmatrix}0.9901\\ 1.4851\end{pmatrix}.
$$

The velocity-row gain is $1.485$ — a one-metre innovation moves the velocity estimate by $1.485$ units, more than the innovation itself. Nothing is wrong: $\mathbf{P}^+ = (\mathbf{I}-\mathbf{K}\mathbf{H})\mathbf{P}^- = \begin{pmatrix}0.00990 & 0.01485\\ 0.01485 & 0.77228\end{pmatrix}$ is still positive definite (eigenvalues $0.0096$ and $0.773$, both positive), so uncertainty still fell in every direction, exactly as the last lesson proved it must. The state that is *not* directly measured here is more uncertain to begin with ($P^-_{vv}=3$ against $P^-_{pp}=1$) and strongly correlated with the one that is ($0.87$ correlation coefficient), so a position surprise is read as unusually strong evidence about velocity — strong enough to move the velocity estimate by more than the raw residual. The trust-ratio picture still holds in spirit — more correlation and more relative uncertainty both raise the gain — but "ratio" here is a matrix acting on a vector, not a number confined to $[0,1]$.
:::

::: warning Do not read an individual gain entry as a probability
Because the scalar gain lives in $(0,1)$, it is tempting to expect every entry of a gain matrix to as well, and to treat an entry near $1$ as "full trust" and near $0$ as "no trust." Only the gain for a state that is *itself* directly and uncorrelatedly measured behaves that cleanly. Any correlated, unmeasured state can carry a gain entry above $1$ or below $0$ (a negative correlation flips the sign of the correction), and neither is a bug. What the trust-ratio intuition gets right without qualification is monotonicity: shrinking $\mathbf{R}$, or growing $\mathbf{P}^-$ in a direction the measurement can see, can only move the gain toward trusting the measurement more, never less.
:::

## The two failure directions of trust

Every gain lives between two extremes, and both have a name worth attaching now, ahead of the divergence lesson later in the module that studies them as failures rather than limits. A gain pinned near zero **for a reason the model does not actually justify** — a prior that is more confident than it has earned the right to be — means the filter has stopped listening to correct data, and no measurement, however good, can fix an estimate the filter refuses to move. A gain pinned near one for a poorly-characterised sensor means the filter is chasing noise it should be smoothing out, trading a stable estimate for a jumpy one. Both are visible in the same place: watch $\mathbf{K}$, not just the state estimate, and a filter that has quietly stopped trusting its measurements announces itself long before its output looks wrong to the eye.

## Check yourself

::: check
Two scalar filters report the same gain, $K = 0.9$. Filter A has $P^- = 9$, $R = 1$; filter B has $P^- = 900$, $R = 100$. Are they equally accurate?
:::

::: answer
Not necessarily, and the gain alone cannot tell you. Both have $\rho = 9$, so both give $K = 9/10 = 0.9$ — the gain depends only on the ratio, matching the lesson's central point. Filter A's posterior variance is $P^+ = (1-0.9)\times 9 = 0.9$; filter B's is $(1-0.9)\times900 = 90$, a hundred times larger. Filter A is far more accurate in an absolute sense despite reporting the identical gain, because filter B started from — and ends with — a proportionally identical but absolutely much larger uncertainty. Judging accuracy requires $P^+$ itself, not the gain that produced it.
:::

::: check
For the vector gain $\mathbf{K} = \mathbf{P}^-\mathbf{H}^{\mathsf{T}}\mathbf{S}^{-1}$, explain in words what would happen to $\mathbf{K}$ if $\mathbf{P}^-$ were exactly diagonal and the measured state were uncorrelated with every other state.
:::

::: answer
If $\mathbf{P}^-$ is diagonal, $\mathbf{P}^-\mathbf{H}^{\mathsf{T}}$ (with $\mathbf{H}$ picking out one state) has a single nonzero entry, in the row of the measured state; every other row of $\mathbf{K}$ is exactly zero, since $S^{-1}$ is a positive scalar and cannot create a nonzero entry where $\mathbf{P}^-\mathbf{H}^{\mathsf{T}}$ has none. The update then corrects only the measured state, by the ordinary scalar trust ratio for that state's own $P^-_{ii}$ and $R$, and leaves every other state's mean and variance untouched at this step — no trust is extended to anything not measured, because nothing links it to what was measured. This is exactly the situation at $k=1$ of the running altitude example before correlation has had a chance to build.
:::

::: check
A filter's gain for a particular state has been essentially zero for the last hundred cycles, and the state's reported uncertainty has also been essentially zero for that whole stretch. Give two different explanations consistent with these facts, one benign and one worrying.
:::

::: answer
Benign: the state genuinely is that well known — a slowly varying bias identified early and pinned down by abundant, consistent measurements, so $P^-$ for that state has legitimately fallen to the point where even a precise sensor changes little. Worrying: the covariance collapsed for a reason unconnected to real accuracy — a process noise entry left at zero or set too small, an unobserved numerical underflow, or measurements that happened by chance to agree with a wrong prediction for a while — and now $\mathbf{P}^-$ is artificially tiny, so the trust ratio $\rho = P^-/R$ stays near zero and new evidence is discounted regardless of what it says. The two cases look identical in the gain and covariance alone; telling them apart needs the innovation itself, which the consistency-testing lesson later in this module turns into a formal test rather than a guess.
:::

::: check
Using $\mathbf{K} = \mathbf{P}^+\mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}$, explain why a state the filter has already pinned down extremely well earns almost no gain from a new measurement of it, even if that measurement is very precise.
:::

::: answer
$\mathbf{P}^+$ is the uncertainty that would remain *after* the very update whose gain is being computed, so a state already pinned down has a small $\mathbf{P}^+$ regardless of how precise the incoming measurement is, and a small $\mathbf{P}^+$ multiplying even a large $\mathbf{R}^{-1}$ can still give a small product. Concretely, in the scalar case $K = P^+/R = \big[(1-K)P^-\big]/R$, and solving this for $K$ returns exactly $P^-/(P^-+R)$: a state with tiny $P^-$ has tiny $K$ no matter how small $R$ also is, because there is very little left for even a perfect sensor to correct. Precision in the sensor cannot manufacture uncertainty in the state that is not already there.
:::

::: check
Sketch how $K = \rho/(1+\rho)$ behaves as $\rho$ ranges from $0.01$ to $100$, without recomputing the earlier table. Where is $K$ changing fastest with $\rho$?
:::

::: answer
$K$ rises monotonically from near $0$ toward near $1$, passing through exactly $0.5$ at $\rho=1$, and is symmetric under $\rho \to 1/\rho$ in the sense that $K(\rho) = 1 - K(1/\rho)$ — the earlier table's $\rho=100$ row giving $K=0.9901$ and its implied $\rho=0.01$ row giving $K=0.0099$ are reflections of each other through $0.5$. The derivative $dK/d\rho = 1/(1+\rho)^2$ is largest at $\rho=0$ and falls off as $\rho$ grows, so $K$ is most sensitive to changes in $\rho$ when $\rho$ is small — near $\rho=1$ a modest change in relative trust still moves $K$ noticeably, while out at $\rho=100$ the gain is already saturating near $1$ and a further tenfold change in $\rho$ moves $K$ by very little.
:::

## Summary

| Item | Statement |
| --- | --- |
| Scalar trust ratio | $\rho = P^-/R$, $K = \rho/(1+\rho)$ — depends only on the ratio, not the absolute scale |
| Vector gain | $\mathbf{K} = \mathbf{P}^-\mathbf{H}^{\mathsf{T}}\mathbf{S}^{-1}$: cross-covariance with the measurement, rescaled by total measurement-space uncertainty $\mathbf{S}$ |
| Alternate form | $\mathbf{K} = \mathbf{P}^+\mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}$ — remaining uncertainty times measurement precision |
| Correlation carries trust | An unmeasured but correlated state earns nonzero gain; the correlation itself grows with each predict step |
| Bounds | Scalar $K \in (0,1)$ always; a correlated vector gain entry can exceed $1$ or be negative, and $\mathbf{P}^+$ stays positive definite regardless |
| Two failure directions | Gain pinned low without justification: the filter stops listening. Gain pinned high on a poorly characterised sensor: the filter chases noise |

Both of the vector gain's ingredients, $\mathbf{P}^-$ and $\mathbf{S}$, are themselves produced by a recursion running in the background — the covariance propagating forward every predict step, shrinking every update. The next lesson writes that recursion down on its own, as the discrete Riccati equation, and asks where it goes if you run it forever.
