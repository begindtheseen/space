---
id: l07-the-ekf-jacobians-and-divergence
title: "The EKF: Jacobians, where it fails, and how it diverges"
minutes: 19
covers:
  - "the extended Kalman filter: Jacobians, where linearisation fails, and divergence modes"
---

Almost every filter that has ever flown is an extended Kalman filter, so an interviewer asking about it is asking about the thing you would actually be maintaining. The questions come in a predictable order: what does the EKF change, where do the Jacobians go, when does linearising stop being acceptable, and how does it fail. The last one is the one that matters, because an EKF does not fail by producing obviously wrong numbers. It fails by producing confident wrong numbers, and the mechanism by which it talks itself into that is specific and describable.

The good news for recall is that very little changes from the linear filter. If you can write the seven equations from the previous lesson, you can write the EKF by changing two of them and adding two definitions.

## What changes, and what does not

$$\hat{\mathbf{x}}_k^- = \mathbf{f}(\hat{\mathbf{x}}_{k-1}^+, \mathbf{u}_{k-1}), \qquad \mathbf{P}_k^- = \mathbf{F}_{k-1}\mathbf{P}_{k-1}^+\mathbf{F}_{k-1}^{\mathsf{T}} + \mathbf{Q}_{k-1}$$

$$\boldsymbol{\nu}_k = \mathbf{z}_k - \mathbf{h}(\hat{\mathbf{x}}_k^-), \qquad \mathbf{S}_k = \mathbf{H}_k\mathbf{P}_k^-\mathbf{H}_k^{\mathsf{T}} + \mathbf{R}_k$$

$$\mathbf{K}_k = \mathbf{P}_k^-\mathbf{H}_k^{\mathsf{T}}\mathbf{S}_k^{-1}, \qquad \hat{\mathbf{x}}_k^+ = \hat{\mathbf{x}}_k^- + \mathbf{K}_k\boldsymbol{\nu}_k, \qquad \mathbf{P}_k^+ = (\mathbf{I} - \mathbf{K}_k\mathbf{H}_k)\mathbf{P}_k^-$$

with the Jacobians

$$\mathbf{F}_{k-1} = \left.\frac{\partial\mathbf{f}}{\partial\mathbf{x}}\right|_{\hat{\mathbf{x}}_{k-1}^+}, \qquad \mathbf{H}_k = \left.\frac{\partial\mathbf{h}}{\partial\mathbf{x}}\right|_{\hat{\mathbf{x}}_k^-}.$$

The single sentence that organises all of it: **the nonlinear functions propagate the mean, the Jacobians propagate the covariance.** You never push a covariance through $\mathbf{f}$ or $\mathbf{h}$, and you never push the state through $\mathbf{F}$ or $\mathbf{H}$. Candidates who have the equations but not that sentence tend to write $\mathbf{F}\hat{\mathbf{x}}^+$ in the prediction, which is a real and visible error.

Everything else — the gain, the trust ratio reading, the Joseph form, the information form, the innovation as the only new information — is unchanged. So is every sanity check from the previous lesson.

::: key What the EKF changes
It propagates the state through the true nonlinear $\mathbf{f}$ and predicts the measurement through the true nonlinear $\mathbf{h}$, but propagates the covariance through Jacobians $\mathbf{F} = \partial\mathbf{f}/\partial\mathbf{x}$ and $\mathbf{H} = \partial\mathbf{h}/\partial\mathbf{x}$ evaluated at the current estimate. Nonlinear functions for the mean, linearised matrices for the covariance; the rest of the recursion is identical to the linear filter.
:::

## Two Jacobians worth having memorised

These come up constantly, and being able to write them without hesitating saves a minute you can spend elsewhere. With target position $(x, y)$ relative to a sensor at the origin and $r = \sqrt{x^2+y^2}$:

**Range**, $h = r$: the row is $\partial h/\partial(x,y) = (x/r,\ y/r)$ — a unit vector along the line of sight. Everything perpendicular to the line of sight has zero partial, which is the formal statement that a range measurement carries no transverse information.

**Bearing**, $h = \operatorname{atan2}(y, x)$: the row is $(-y/r^2,\ x/r^2)$. Note the $1/r$ scaling: the sensitivity grows without bound as the target approaches the sensor. That unbounded Jacobian is what makes bearing-only tracking the standard hard test of EKF robustness.

## Where linearisation stops being acceptable

The EKF keeps the constant and linear terms of a Taylor expansion of $\mathbf{f}$ and $\mathbf{h}$ about the current estimate and drops the rest. The dropped remainder is $O(\lVert\boldsymbol{\delta}\rVert^2)$, where $\boldsymbol{\delta}$ is the spread of the state uncertainty, and it grows with both the size of that spread and the local curvature of the function. **Nothing in the filter's own reported $\mathbf{P}$ accounts for this term** — it is gone entirely, which is why the failure is quiet.

The useful way to say when linearising is acceptable is therefore not "when the model is nonlinear" but **"when the model is close to linear across the region the covariance actually spans."** A very nonlinear function is fine if you are sure enough about where you are; a mildly nonlinear one is not if you are not.

::: example How big the linearisation error actually is
A spacecraft is being ranged from a station $100\,\mathrm{km}$ away along the line of sight, and the filter has some uncertainty $\sigma$ in the *transverse* direction. The measurement is $h = \sqrt{r^2 + d^2}$, where $d$ is the transverse offset.

The linearised model says the transverse partial is zero — at $d = 0$, $\partial h/\partial d = d/\sqrt{r^2+d^2} = 0$ — so the EKF predicts the range as exactly $100\,\mathrm{km}$ and assigns no information to the transverse direction from this measurement. The truth is that a transverse offset always makes the range *longer*, never shorter, so the expected measurement is biased upward by approximately $\sigma^2/(2r)$.

| Transverse $\sigma$ | True expected range minus $100\,\mathrm{km}$ | Second-order estimate $\sigma^2/(2r)$ |
| --- | --- | --- |
| $1\,\mathrm{km}$ | $5.00\,\mathrm{m}$ | $5.00\,\mathrm{m}$ |
| $3\,\mathrm{km}$ | $44.97\,\mathrm{m}$ | $45.00\,\mathrm{m}$ |
| $10\,\mathrm{km}$ | $496.3\,\mathrm{m}$ | $500.0\,\mathrm{m}$ |

The bias scales as the *square* of the uncertainty, which is the whole story in one column. Against a ranging sensor with $\sigma_{\mathrm{range}} = 10\,\mathrm{m}$, the $1\,\mathrm{km}$ case produces a bias of half a sensor sigma — invisible. The $10\,\mathrm{km}$ case produces a bias of about fifty sigma: every single innovation is enormous, in the same direction, and the filter has no state that can explain it, because its linearised $\mathbf{H}$ says the transverse direction cannot affect the range at all.

This is what "the EKF is fine when the nonlinearity is mild across the uncertainty" means quantitatively. It is the same function and the same sensor in all three rows; only the covariance changed.
:::

## The divergence modes

An interviewer asking "how does an EKF diverge?" is asking for a list with mechanisms. Six, in the order they are worth saying.

**One: covariance collapse from a bad linearisation point.** This is the EKF's own failure, not shared with the linear filter, and it is the one to lead with. The posterior covariance $(\mathbf{I} - \mathbf{K}_k\mathbf{H}_k)\mathbf{P}_k^-$ depends entirely on the *linearised* $\mathbf{H}_k$, which has no way of knowing it was evaluated somewhere unrepresentative. If the estimate is somewhere the curvature is severe, $\mathbf{H}_k$ can claim the measurement constrains the state far more than it really does, and $\mathbf{P}^+$ shrinks far more than the true uncertainty warrants. Once $\mathbf{P}$ is too small, every subsequent gain is too small to correct the error that caused it — a positive feedback loop the linear filter cannot exhibit, because a linear filter's $\mathbf{H}$ never depends on the estimate.

**Two: a large initial error.** Linearising about an estimate that is far from the truth means the Jacobians describe the sensitivity somewhere the vehicle is not. This is the single most common cause in orbit determination, and it is the reason a sequential filter is usually initialised from a batch solution rather than from a guess.

**Three: unmodelled dynamics or biases, equivalently $\mathbf{Q}$ too small.** Shared with the linear filter: the covariance contracts, the gain goes to zero, the filter stops listening, and the real error grows unchecked while the reported one shrinks.

**Four: unobservable states.** A state combination the measurements cannot see either grows its covariance forever under nonzero $\mathbf{Q}$ or sits frozen at a possibly wrong initial value under zero $\mathbf{Q}$. Either way it is never corrected, by construction.

**Five: numerical loss of symmetry or positive definiteness.** The short covariance update is a difference of matrices and can go indefinite in finite precision, particularly with a nearly singular $\mathbf{Q}$ or a large dynamic range in $\mathbf{P}$.

**Six: unrejected outliers.** A single bad measurement enters with the full gain, moves the estimate, and — in a nonlinear filter — moves the point the *next* set of Jacobians is evaluated at, so one outlier can start cause number one.

::: key EKF divergence
Six mechanisms: covariance collapse from Jacobians evaluated at a poor estimate, a large initial error, unmodelled dynamics or an underestimated $\mathbf{Q}$, unobservable states, numerical loss of positive definiteness, and unrejected outliers. The first is the EKF's own — $\mathbf{P}^+$ depends on the linearised $\mathbf{H}$, which does not know where it was evaluated, so the filter can become confident and closed to the very measurements that would fix it.
:::

::: warning Two failures that sound the same and are not
A filter diverging because $\mathbf{Q}$ is mistuned is fixable by tuning, and consistency testing finds it. A filter diverging because the Jacobians are evaluated at a bad estimate is *not* fixable by tuning: $\mathbf{Q}$ and $\mathbf{R}$ can be exactly correct and the dynamics model exact, and the gap between "linearised about the estimate" and "linearised about the truth" remains. The remedies are different in kind — re-linearise more often, initialise better, or change how the transformation is approximated. Saying "I would retune $\mathbf{Q}$" to a linearisation failure is a wrong answer delivered confidently.
:::

## Remedies, ranked

**Initialise better.** A batch least-squares or initial-orbit-determination solution before the filter starts removes cause two outright, and cause two is what usually triggers cause one.

**Re-linearise more often.** The iterated EKF repeats the update, re-evaluating $\mathbf{h}$ and $\mathbf{H}$ at the newly corrected estimate, one or a few times. It costs almost nothing and directly attacks a measurement Jacobian evaluated in the wrong place.

**Gate measurements.** Test the normalised innovation squared, $\boldsymbol{\nu}^{\mathsf{T}}\mathbf{S}^{-1}\boldsymbol{\nu}$, against a chi-squared threshold and reject what fails. This removes cause six and therefore one of the triggers for cause one.

**Use the Joseph form and a square-root or factorised implementation.** Removes cause five.

**Change the error coordinates.** For attitude, the multiplicative error-state formulation keeps the linearised quantity small by construction, which is the subject of a later lesson in this module.

**Change the approximation.** If the nonlinearity really is severe across the uncertainty, no amount of care with Jacobians helps, because the problem is the linearisation itself. That is when a sigma-point filter earns its cost, which is the next lesson.

::: example "Why does an EKF diverge, and how would you tell which one is happening?"
**A weak answer:** "It diverges when the system is too nonlinear, or when the initial error is too large, or when the tuning is wrong. You would see the estimate drift away from the truth."

Three causes named with no mechanism, and a detection method that requires knowing the truth — which a flight team does not have.

**A strong answer:**

"Let me split it into the failure the EKF shares with a linear filter and the one that is its own, because the remedies differ.

Shared: the covariance is too small for the real error, usually because $\mathbf{Q}$ understates what the dynamics leave out. The covariance contracts, the gain contracts with it, and the filter stops using the data that could fix it.

The EKF's own: the posterior covariance is computed from the linearised $\mathbf{H}$, evaluated at the filter's estimate rather than at the truth — because the truth is the one thing a filter never has. If that estimate sits somewhere unrepresentative, $\mathbf{H}$ can overstate how much the measurement constrains the state, the covariance collapses, and the gain collapses with it. That is a positive feedback loop, and a linear filter cannot do it because its $\mathbf{H}$ does not depend on the estimate.

Telling them apart without truth. Both show up in the innovations, so that is where I would look first: a running mean of the innovations that is not zero, and a normalised innovation squared, $\boldsymbol{\nu}^{\mathsf{T}}\mathbf{S}^{-1}\boldsymbol{\nu}$, sitting above its chi-squared bound. Then the discriminator: inflate $\mathbf{Q}$, or run with a fading-memory factor, and re-process the same data. If the consistency comes back, it was the tuning. If the innovations stay large and structured while the covariance is now generous, the problem is the linearisation, and I would go after it differently — initialise from a batch solution, iterate the update so the measurement Jacobian is re-evaluated at the corrected estimate, gate the outliers, and if the nonlinearity is genuinely severe across the covariance, move to a sigma-point filter.

One quantitative sanity check I like: compare the state uncertainty to the scale over which the measurement function curves. For a range measurement at $100\,\mathrm{km}$, a transverse uncertainty of $1\,\mathrm{km}$ produces a predicted-measurement bias of about $5\,\mathrm{m}$, and $10\,\mathrm{km}$ produces about $500\,\mathrm{m}$, because the bias goes as the square of the spread. If that number is small compared with the sensor noise, linearising is fine; if it is tens of sigma, it is not, and no tuning will rescue it."

**What the interviewer learns:** the candidate separates two mechanisms that produce identical-looking symptoms, gives a detection method that works on real telemetry with no truth available, proposes an experiment that discriminates between them, and offers a quantitative test for whether linearising was ever appropriate. Every piece of it is usable on a Monday morning.
:::

## Check yourself

::: check
Write the EKF prediction step and say precisely which object goes through the nonlinear function and which through the Jacobian.
:::

::: answer
$\hat{\mathbf{x}}_k^- = \mathbf{f}(\hat{\mathbf{x}}_{k-1}^+, \mathbf{u}_{k-1})$ and $\mathbf{P}_k^- = \mathbf{F}_{k-1}\mathbf{P}_{k-1}^+\mathbf{F}_{k-1}^{\mathsf{T}} + \mathbf{Q}_{k-1}$, with $\mathbf{F}_{k-1} = \partial\mathbf{f}/\partial\mathbf{x}$ evaluated at $\hat{\mathbf{x}}_{k-1}^+$. The **state** goes through the true nonlinear $\mathbf{f}$ — there is no reason to approximate it, since propagating one point is exactly as easy either way. The **covariance** goes through the Jacobian, because a covariance is a second-moment object and there is no exact way to push it through a nonlinear map in closed form. Writing $\mathbf{F}\hat{\mathbf{x}}_{k-1}^+$ in the first equation is the common error and it discards the nonlinearity in the one place it was free to keep.
:::

::: check
Give the measurement Jacobian for a range sensor and for a bearing sensor in two dimensions, and say what each one tells you about the information the measurement carries.
:::

::: answer
With the sensor at the origin, target at $(x,y)$ and $r = \sqrt{x^2+y^2}$: range, $h = r$, gives $\mathbf{H} = (x/r,\ y/r)$, a unit vector along the line of sight — so the measurement informs only the along-range direction and carries exactly zero transverse information at the linearisation point. Bearing, $h = \operatorname{atan2}(y,x)$, gives $\mathbf{H} = (-y/r^2,\ x/r^2)$, perpendicular to the line of sight and scaling as $1/r$ — so it informs only the transverse direction, and its sensitivity grows without bound as the target approaches. The two are complementary, which is why range-plus-bearing is well conditioned and either alone is not, and the $1/r$ blow-up is why bearing-only tracking is the standard test case for EKF divergence.
:::

::: check
An EKF's $\mathbf{Q}$ and $\mathbf{R}$ are exactly correct and its dynamics model is exact, and it still diverges on some runs. What is the mechanism, and why does retuning not help?
:::

::: answer
The mechanism is linearisation at a poor evaluation point. The Jacobians are computed at the filter's own estimate, and the posterior covariance $(\mathbf{I}-\mathbf{K}\mathbf{H})\mathbf{P}^-$ is a function of that linearised $\mathbf{H}$ alone, with nothing in it that knows the point was unrepresentative. An overstated $\mathbf{H}$ makes the filter claim the measurement pinned the state down more than it did, $\mathbf{P}$ collapses, the gain collapses with it, and the filter is now closed to the measurements that could recover the error. Retuning does not help because $\mathbf{Q}$ and $\mathbf{R}$ are already right: there is no mismatch between assumed and actual noise to correct. The remedies have to change the approximation or the evaluation point — iterate the update, initialise from a batch solution, use error-state coordinates that keep the linearised quantity small, or move to a sigma-point filter that does not linearise at all.
:::

::: check
Why does the linearisation error in a predicted measurement scale as the square of the state uncertainty, and what practical test does that give you?
:::

::: answer
Because the EKF keeps the constant and linear terms of the Taylor expansion of $\mathbf{h}$ and drops everything from the quadratic term onward. The leading dropped term is quadratic in the deviation, so when the deviation is characterised by a standard deviation $\sigma$, the expected error in the predicted measurement scales as $\sigma^2$ times the local curvature. For the range example in this lesson the curvature term is $1/(2r)$, giving a bias of $\sigma^2/(2r)$: $5\,\mathrm{m}$ at $\sigma = 1\,\mathrm{km}$ and about $500\,\mathrm{m}$ at $\sigma = 10\,\mathrm{km}$, a hundredfold increase for a tenfold increase in uncertainty. The practical test is to compute that bias and compare it with the measurement noise standard deviation. Much smaller: linearise happily. Comparable or larger: the EKF's predicted measurement is biased by something its covariance does not know about, and a sigma-point or iterated approach is warranted.
:::

::: check
Name two remedies that attack EKF divergence at its cause rather than at its symptom, and say which cause each one addresses.
:::

::: answer
Initialising the filter from a batch least-squares solution attacks cause two, a large initial error: the filter starts where linearising is valid instead of somewhere the Jacobians describe the wrong sensitivity, which also removes the usual trigger for the covariance-collapse loop. The iterated EKF attacks the measurement half of cause one: it re-evaluates $\mathbf{h}$ and $\mathbf{H}$ at the corrected estimate and repeats the update, so the Jacobian used to shrink the covariance is computed at a better point than the one the prediction handed over. By contrast, inflating $\mathbf{Q}$ is a symptom treatment — it keeps the gain from collapsing, which buys time, but it does nothing about the fact that the Jacobian was evaluated in the wrong place.
:::

## Summary

| Item | Content |
| --- | --- |
| EKF prediction | $\hat{\mathbf{x}}^- = \mathbf{f}(\hat{\mathbf{x}}^+, \mathbf{u})$; $\mathbf{P}^- = \mathbf{F}\mathbf{P}^+\mathbf{F}^{\mathsf{T}} + \mathbf{Q}$ |
| EKF update | $\boldsymbol{\nu} = \mathbf{z} - \mathbf{h}(\hat{\mathbf{x}}^-)$; rest of the recursion as in the linear filter |
| Jacobians | $\mathbf{F} = \partial\mathbf{f}/\partial\mathbf{x}$ at $\hat{\mathbf{x}}_{k-1}^+$; $\mathbf{H} = \partial\mathbf{h}/\partial\mathbf{x}$ at $\hat{\mathbf{x}}_k^-$ |
| The organising sentence | Nonlinear functions propagate the mean; Jacobians propagate the covariance |
| Range Jacobian | $(x/r,\ y/r)$ — no transverse information |
| Bearing Jacobian | $(-y/r^2,\ x/r^2)$ — sensitivity grows as $1/r$ |
| Truncation error | $O(\lVert\boldsymbol{\delta}\rVert^2)$; bias $\approx \sigma^2/(2r)$ for range; nothing in $\mathbf{P}$ accounts for it |
| Six divergence modes | Covariance collapse from a bad linearisation point; large initial error; $\mathbf{Q}$ too small or unmodelled dynamics; unobservable states; numerical indefiniteness; unrejected outliers |
| Remedies | Batch initialisation, iterated update, innovation gating, Joseph or square-root form, error-state coordinates, sigma-point filter |

The next lesson takes the last of those remedies seriously: what the unscented transform does instead of linearising, what it costs, and how to answer the question of when it is worth paying.
