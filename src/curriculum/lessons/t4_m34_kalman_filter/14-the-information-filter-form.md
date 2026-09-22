---
id: l14-the-information-filter-form
title: The information filter form and its use in sensor fusion
minutes: 22
covers:
  - The information filter form and its use in sensor fusion
---

The Bayesian derivation, in the three-derivations lesson, produced a second way to write the update — inverse covariances adding, $(\mathbf{P}^+)^{-1} = (\mathbf{P}^-)^{-1} + \mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{H}$ — and set it aside as an equivalent description of the single-step fusion problem. Building it into a complete, standalone recursive filter, with its own predict step and its own reasons to prefer it, is this lesson's job. The reward is specific: a form in which combining evidence from any number of sensors, arriving in any order, in any grouping, reduces to nothing more than addition, and a form that can represent *total ignorance* exactly, something the covariance form cannot write down at all.

Define the **information matrix** $\mathbf{Y} = \mathbf{P}^{-1}$ and the **information vector** $\mathbf{y} = \mathbf{Y}\hat{\mathbf{x}}$, and propagate those two objects instead of $\hat{\mathbf{x}}$ and $\mathbf{P}$ directly.

## The update: many sensors, one sum

The information-form update, already derived, generalizes to $m$ independent sensors — with rows $\mathbf{H}_1,\ldots,\mathbf{H}_m$ and noise $R_1,\ldots,R_m$ — by exactly the argument the sequential-updates lesson used to prove batch and sequential processing equivalent: each sensor's contribution to the running information is $\mathbf{H}_i^{\mathsf{T}}R_i^{-1}\mathbf{H}_i$ and $\mathbf{H}_i^{\mathsf{T}}R_i^{-1}z_i$, and matrix addition does not care what order, or what groupings, those contributions arrive in.

::: key The information-form update
$$
\mathbf{Y}^+ = \mathbf{Y}^- + \sum_{i=1}^m \mathbf{H}_i^{\mathsf{T}}R_i^{-1}\mathbf{H}_i, \qquad
\mathbf{y}^+ = \mathbf{y}^- + \sum_{i=1}^m \mathbf{H}_i^{\mathsf{T}}R_i^{-1}z_i.
$$
No matrix inverse appears anywhere in the update itself — only in recovering $\hat{\mathbf{x}}^+ = (\mathbf{Y}^+)^{-1}\mathbf{y}^+$ when an actual state estimate is needed.
:::

::: example Three sensors, three orders, one fused estimate
A prior with $\mathbf{Y}^- = \operatorname{diag}(0.5, 2.0)$ (equivalently $\mathbf{P}^- = \operatorname{diag}(2.0, 0.5)$) and mean $\hat{\mathbf{x}}^- = (2450,\ -70)$ (so $\mathbf{y}^- = \mathbf{Y}^-\hat{\mathbf{x}}^- = (1225,\ -140)$), fused with three independent readings — two position sensors of different quality and one velocity sensor — $\mathbf{H} = (1,0),\,(1,0),\,(0,1)$ with $R = 4.0,\,0.25,\,0.01$ and $z = 2450.3,\,2449.8,\,-68.2$. Summing the three contributions in the orders $(1,2,3)$, $(3,1,2)$ and $(2,3,1)$ all give the identical $\hat{\mathbf{x}}^+ = (2449.847,\ -68.235)$, to every digit — this is the sequential-updates lesson's equivalence, and here it is not a derived consequence of the covariance formula but the *native* operation the information form performs.
:::

This is the property that makes the information form the natural choice for **distributed sensor fusion**: several sensors, possibly on different subsystems, possibly not even aware of each other, each compute their own $\mathbf{H}_i^{\mathsf{T}}R_i^{-1}\mathbf{H}_i$ and $\mathbf{H}_i^{\mathsf{T}}R_i^{-1}z_i$ contribution independently and ship it to a fusion node that only ever adds; nothing about the architecture needs to know in advance how many sensors will report, in what order, or how frequently.

## The predict step: possible, but not cheap

Propagating $\mathbf{Y}$ forward is genuinely new work, because $\mathbf{Y}^- = (\mathbf{F}\mathbf{P}^+\mathbf{F}^{\mathsf{T}}+\mathbf{Q})^{-1} = (\mathbf{F}(\mathbf{Y}^+)^{-1}\mathbf{F}^{\mathsf{T}}+\mathbf{Q})^{-1}$ appears, at first glance, to need $\mathbf{Y}^+$ inverted back to $\mathbf{P}^+$ before anything else can happen — precisely defeating the point. The matrix inversion lemma, proved by direct multiplication in the three-derivations lesson, removes that need whenever $\mathbf{Q}$ is invertible:

::: key The information-form predict step
$$
\mathbf{Y}^- = \mathbf{Q}^{-1} - \mathbf{Q}^{-1}\mathbf{F}\big(\mathbf{Y}^+ + \mathbf{F}^{\mathsf{T}}\mathbf{Q}^{-1}\mathbf{F}\big)^{-1}\mathbf{F}^{\mathsf{T}}\mathbf{Q}^{-1}.
$$
Recovering $\hat{\mathbf{x}}^-$ needs $\mathbf{y}^- = \mathbf{Y}^-\mathbf{F}\hat{\mathbf{x}}^+$, with $\hat{\mathbf{x}}^+$ obtained by solving $\mathbf{Y}^+\hat{\mathbf{x}}^+ = \mathbf{y}^+$ (a linear solve, not an explicit inverse) rather than tracked separately.
:::

::: example Verified against the ordinary predict step, fifty steps running
For the altitude filter's usual $\mathbf{F}, \mathbf{Q}, \mathbf{H}, R$, running the information form (predict via the formula above, update via addition) alongside the ordinary covariance-form filter for $50$ steps on identical data: the maximum entrywise disagreement between the two filters' $\hat{\mathbf{x}}^+$ is $1.3\times10^{-9}$, and between their $\mathbf{P}^+$ is $1.1\times10^{-10}$ — machine-precision agreement, not approximate equivalence. The two filters compute the same thing; only the intermediate bookkeeping differs.
:::

The derivation is worth being honest about, because it corrects a common overstatement: the information-form predict step is **not** cheaper than the ordinary one. It trades one $n\times n$ inverse (of $\mathbf{P}^+$, in the ordinary form's Riccati recursion) for effectively two — $\mathbf{Q}^{-1}$ and the bracketed term above — and it fails outright if $\mathbf{Q}$ is singular, precisely the short-step process-noise approximation the stochastic-model and numerically-stable-forms lessons both warned against, for unrelated reasons. Everything this lesson recommends the information form *for* lives in the update step and in initialization; the predict step is a cost paid to keep the whole recursion in information form, not a benefit in its own right.

::: warning A barely-invertible Y is numerically dangerous to predict from
Attempting the predict step from $\mathbf{Y}^+$ that is technically invertible but only weakly so — close to the $\operatorname{rank}$-deficient case below — is numerically treacherous even though the formula above is exact in principle: solving $\mathbf{Y}^+\hat{\mathbf{x}}^+=\mathbf{y}^+$ for a nearly-singular $\mathbf{Y}^+$ amplifies whatever round-off is present, and a single position-only measurement's information, propagated through one predict step from a barely-informative prior, produced a velocity *estimate* of $8081\,\mathrm{m/s}$ in a direct test — a number with no physical meaning, from perfectly correct formulas applied to an ill-conditioned matrix. The remedy is the numerically-stable-forms lesson's own warning, restated: never trust an inverse (or a solve) without checking the conditioning of what it is inverting.
:::

## Representing total ignorance: Y = 0

The covariance form has no way to write down "I know nothing at all" — $\mathbf{P} = \infty$ is not a matrix. The information form writes it exactly: $\mathbf{Y} = \mathbf{0}$, $\mathbf{y} = \mathbf{0}$, a perfectly finite, perfectly well-defined starting point that says every direction in state space is completely unconstrained.

::: example From zero information to a fully-determined state
Two independent sensors, one measuring $a$ ($\mathbf{H}=(1,0)$, $R=4$), one measuring $b$ ($\mathbf{H}=(0,1)$, $R=0.25$), starting from $\mathbf{Y}=\mathbf{0}$. After the $a$-sensor alone, $\mathbf{Y} = \operatorname{diag}(0.25,\ 0)$ — rank $1$, correctly representing that $a$ is now known while $b$ remains entirely unconstrained, a state of partial knowledge the covariance form could only express with an infinite entry. After the $b$-sensor is added, $\mathbf{Y}=\operatorname{diag}(0.25,\ 4.0)$, full rank, and $\hat{\mathbf{x}} = (\mathbf{Y})^{-1}\mathbf{y}$ recovers exactly $(z_a, z_b)$ with $\mathbf{P} = \operatorname{diag}(4, 0.25)$ — precisely $R_a$ and $R_b$, because with no prior at all, the posterior variance in each direction is exactly the variance of the single measurement that established it, confirmed to match a direct hand calculation exactly.
:::

This is precisely the least-squares module's own device for an uninformative prior, and it is why the recursive-least-squares connection from the three-derivations lesson runs both ways: setting $\mathbf{Y}_0=\mathbf{0}$ and running the information-form recursion *is* ordinary batch least squares, one measurement's information added at a time, with the Kalman machinery's dynamics and process noise available the moment they are needed and not a line of the batch formulation disturbed when they are not.

## When to reach for which form

::: note Two forms, two different strengths
The covariance form is the right default: its predict step is cheap and needs no invertible $\mathbf{Q}$, and it directly reports the quantity — $\mathbf{P}$ — that every consistency test in this module reads. Reach for the information form specifically when the update side dominates: fusing many independent, possibly asynchronous sensors into one estimate, initializing with no prior knowledge at all, or building a batch/recursive-least-squares solution where the dynamics step is occasional or absent. A filter with a fast, invertible-$\mathbf{Q}$ predict step and few sensors gains nothing from the information form and pays its extra predict-step cost for no benefit; a fusion centre summing reports from a dozen independent instruments gains everything from it.
:::

## Check yourself

::: check
Explain why the information-form update needs no matrix inverse at all, while the ordinary covariance-form update needs one (to form $\mathbf{K}$).
:::

::: answer
The ordinary update's gain, $\mathbf{K}=\mathbf{P}^-\mathbf{H}^{\mathsf{T}}(\mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}}+R)^{-1}$, inverts the innovation covariance $\mathbf{S}$, an $m\times m$ matrix, every single update. The information-form update never constructs $\mathbf{S}$ or anything like it — it adds $\mathbf{H}^{\mathsf{T}}R^{-1}\mathbf{H}$ directly to $\mathbf{Y}$, and since $R$ is typically diagonal or block-diagonal across independent sensors, $R^{-1}$ is cheap or even precomputed once per sensor. The only inverse in the whole information-form recursion is recovering $\hat{\mathbf{x}}$ from $\mathbf{Y}$ and $\mathbf{y}$, which is needed only when an actual state estimate must be reported, not on every internal fusion step.
:::

::: check
A distributed fusion architecture has four sensors reporting at slightly different times within the same nominal cycle, and a fifth sensor that occasionally drops out entirely. Explain why the information form tolerates this more gracefully than accumulating a batch $\mathbf{H}$ matrix and running one covariance-form update.
:::

::: answer
The information-form update is a running sum, $\mathbf{Y}^+ = \mathbf{Y}^- + \sum_i \mathbf{H}_i^{\mathsf{T}}R_i^{-1}\mathbf{H}_i$, and each term can be added the moment that sensor's report arrives, in whatever order, with no term needed from a sensor that did not report at all — dropping sensor five means one fewer term in the sum and nothing else, since nothing else in the formula changes. A batch update needs to assemble one $\mathbf{H}$ stacking every expected sensor's row before it can run, which means either waiting for every sensor (defeating the purpose of processing sensors as they arrive) or rebuilding the stacked matrix's dimensions every time a sensor is late or missing.
:::

::: check
Why does the information-form predict step require $\mathbf{Q}$ to be invertible, while the ordinary covariance-form predict step, $\mathbf{P}^-=\mathbf{F}\mathbf{P}^+\mathbf{F}^{\mathsf{T}}+\mathbf{Q}$, does not?
:::

::: answer
The ordinary predict step only ever *adds* $\mathbf{Q}$ to something already computed — a singular $\mathbf{Q}$ (the short-step approximation from the stochastic-model lesson, for instance) is added without incident, since addition needs nothing about $\mathbf{Q}$'s invertibility. The information-form predict step's derivation, via the matrix inversion lemma, uses $\mathbf{Q}^{-1}$ explicitly, twice; a singular $\mathbf{Q}$ makes that formula undefined outright, which is exactly why the numerically-stable-forms lesson's warning about the exact, non-singular process noise matters even more in information form than it already did in covariance form.
:::

::: check
After the $a$-sensor alone in the Y=0 example, $\mathbf{Y}=\operatorname{diag}(0.25,0)$. What would `np.linalg.inv(Y)` do if called at that point, and why is checking rank first the right practice rather than calling it and handling the resulting error?
:::

::: answer
`np.linalg.inv` on a singular matrix either raises a `LinAlgError` or, depending on how close to singular floating-point round-off makes it look, silently returns a matrix full of enormous or `inf`-like entries without necessarily erroring at all — the exact numerically-dangerous behaviour the warning above demonstrated with a real number, $8081\,\mathrm{m/s}$, that looked like a valid answer while being meaningless. Checking $\operatorname{rank}(\mathbf{Y})$ (or, more robustly, its smallest eigenvalue) before inverting distinguishes "genuinely no information yet, handle this state explicitly" from "technically invertible but so ill-conditioned the inverse is noise," a distinction a bare exception handler cannot make since the second case often does not raise anything at all.
:::

::: check
Restate, in the information filter's own language, what the observability lesson's unobservable direction looks like.
:::

::: answer
An unobservable direction is exactly a direction along which $\mathbf{H}^{\mathsf{T}}R^{-1}\mathbf{H}$ contributes nothing, for every measurement the sensor suite can ever produce — the update sum in this lesson's key formula never adds anything to $\mathbf{Y}$ along that direction at all, so $\mathbf{Y}$ stays exactly as informative (or uninformative) there as the predict step alone leaves it, forever. This is the same fact the observability lesson proved in covariance language — the update is structurally blind along that direction — restated as: the information the update sum can ever accumulate there is exactly zero, term after term, no matter how many measurements arrive.
:::

## Summary

| Item | Statement |
| --- | --- |
| Information objects | $\mathbf{Y}=\mathbf{P}^{-1}$, $\mathbf{y}=\mathbf{Y}\hat{\mathbf{x}}$ |
| Update | $\mathbf{Y}^+=\mathbf{Y}^-+\sum_i\mathbf{H}_i^{\mathsf{T}}R_i^{-1}\mathbf{H}_i$, $\mathbf{y}^+=\mathbf{y}^-+\sum_i\mathbf{H}_i^{\mathsf{T}}R_i^{-1}z_i$ — pure addition, any order, any grouping |
| Predict | $\mathbf{Y}^-=\mathbf{Q}^{-1}-\mathbf{Q}^{-1}\mathbf{F}(\mathbf{Y}^++\mathbf{F}^{\mathsf{T}}\mathbf{Q}^{-1}\mathbf{F})^{-1}\mathbf{F}^{\mathsf{T}}\mathbf{Q}^{-1}$; needs $\mathbf{Q}$ invertible, costs more than the ordinary predict step |
| Diffuse prior | $\mathbf{Y}=\mathbf{0}$ is exact and well-defined; $\mathbf{P}=\infty$ is not representable at all |
| Best use | Many independent, possibly asynchronous sensors; uninformative initialization; batch/recursive least squares. Not a general replacement for the covariance form |
| Numerical caution | A barely-invertible $\mathbf{Y}$ predicted or inverted without checking conditioning can return a confident, meaningless answer |

Every form this module has built — covariance, Joseph, square-root, UD, information — assumes the noise sources feeding the filter are exactly as independent as the stochastic model first described them. The final lesson removes that assumption, for both the process and the measurement side, and treats the one kind of nuisance parameter this module has, until now, always been able to either estimate outright or ignore.
