---
id: l07-the-ekf-jacobians-and-divergence
title: "The EKF: Jacobians, where it fails, and how it diverges"
minutes: 24
covers:
  - "the extended Kalman filter: Jacobians, where linearization fails, and divergence modes"
---

Stand on a hill in thick fog. You cannot see the land, but you can feel the slope under your feet. Take one small step, and the slope tells you almost exactly how much higher or lower you will be. Take a giant leap, and it is no longer a good guide — the hill may curve away under you.

That is the whole idea of the **[[extended Kalman filter|why-extended]]**, or **EKF** (said "E-K-F"): a Kalman filter for a world that is curved rather than straight. It treats each curved function as a straight slope near the current best guess. Almost every filter that has ever flown is an EKF, so an interviewer asking about it is asking about the thing you would actually maintain on the job.

The questions come in a predictable order. What does the EKF change? Where do the slopes go? When does pretending the world is straight stop being acceptable? And how does the filter fail? The last matters most. An EKF does not fail with silly-looking numbers; it fails with *confident* wrong ones, and the way it talks itself into that can be described step by step. The good news: from the linear filter's seven equations (previous lesson), you get the EKF by changing two and adding two definitions.

## What changes, and what does not

A quick notation reminder. $\hat{\mathbf{x}}$ (read "x hat") is the estimate of the **state** — the numbers the filter tracks, such as position and velocity. $\mathbf{P}$ is the **covariance** — how unsure the filter is, and in which directions. A minus superscript means "before this step's measurement", a plus means "after": $\hat{\mathbf{x}}_k^-$ is read "x hat k minus".

In the linear filter the dynamics and the sensor were matrices, $\mathbf{F}\mathbf{x}$ and $\mathbf{H}\mathbf{x}$. Real vehicles are not that polite: gravity falls off with distance squared, and a radar measures a length, which involves a square root. So the EKF uses general functions: $\mathbf{f}$ moves the state forward one step, and $\mathbf{h}$ says what the sensor should read for a given state. Here is the whole filter:

$$\hat{\mathbf{x}}_k^- = \mathbf{f}(\hat{\mathbf{x}}_{k-1}^+, \mathbf{u}_{k-1}), \qquad \mathbf{P}_k^- = \mathbf{F}_{k-1}\mathbf{P}_{k-1}^+\mathbf{F}_{k-1}^{\mathsf{T}} + \mathbf{Q}_{k-1}$$

$$\boldsymbol{\nu}_k = \mathbf{z}_k - \mathbf{h}(\hat{\mathbf{x}}_k^-), \qquad \mathbf{S}_k = \mathbf{H}_k\mathbf{P}_k^-\mathbf{H}_k^{\mathsf{T}} + \mathbf{R}_k$$

$$\mathbf{K}_k = \mathbf{P}_k^-\mathbf{H}_k^{\mathsf{T}}\mathbf{S}_k^{-1}, \qquad \hat{\mathbf{x}}_k^+ = \hat{\mathbf{x}}_k^- + \mathbf{K}_k\boldsymbol{\nu}_k, \qquad \mathbf{P}_k^+ = (\mathbf{I} - \mathbf{K}_k\mathbf{H}_k)\mathbf{P}_k^-$$

with the **Jacobians** — the slope matrices of the two functions —

$$\mathbf{F}_{k-1} = \left.\frac{\partial\mathbf{f}}{\partial\mathbf{x}}\right|_{\hat{\mathbf{x}}_{k-1}^+}, \qquad \mathbf{H}_k = \left.\frac{\partial\mathbf{h}}{\partial\mathbf{x}}\right|_{\hat{\mathbf{x}}_k^-}.$$

Read $\partial\mathbf{f}/\partial\mathbf{x}$ as "partial f by partial x". It is a table of **[[partial derivatives|partial-derivative]]**: entry $(i, j)$ says how much output $i$ changes when you nudge state $j$ slightly and hold everything else still. The vertical bar means "worked out at this point".

One sentence organizes all of it: **the nonlinear functions propagate the mean, the Jacobians propagate the covariance.** The best guess goes through the curved $\mathbf{f}$ and $\mathbf{h}$; the uncertainty goes through the slopes $\mathbf{F}$ and $\mathbf{H}$. You never push a covariance through $\mathbf{f}$ or $\mathbf{h}$, and you never push the state through $\mathbf{F}$ or $\mathbf{H}$. Candidates without that sentence tend to write $\mathbf{F}\hat{\mathbf{x}}^+$ in the prediction — a real, visible error.

Why the split? Moving one point through a curved function is easy — plug it in. Moving a whole cloud of uncertainty through it has no neat formula. Near the guess, though, the function acts like a matrix, and a matrix moves a covariance as $\mathbf{F}\mathbf{P}\mathbf{F}^{\mathsf{T}}$.

Everything else is unchanged: the gain, reading the gain as a trust ratio, the Joseph form, the information form, and the **innovation** $\boldsymbol{\nu}$ (the Greek letter "nu": what the sensor said minus what the filter expected) as the only new information. So is every sanity check from the previous lesson.

::: key What the EKF changes
It propagates the state through the true nonlinear $\mathbf{f}$ and predicts the measurement through the true nonlinear $\mathbf{h}$, but propagates the covariance through Jacobians $\mathbf{F} = \partial\mathbf{f}/\partial\mathbf{x}$ and $\mathbf{H} = \partial\mathbf{h}/\partial\mathbf{x}$ evaluated at the current estimate. Nonlinear functions for the mean, linearized matrices for the covariance; the rest of the recursion is identical to the linear filter.
:::

::: key What the EKF changes, and how it fails
It linearizes the nonlinear dynamics and measurement models about the current estimate using Jacobians $F = df/dx$ and $H = dh/dx$. It diverges when nonlinearity is significant across the uncertainty, when the initial error is large, or when the covariance collapses and the filter stops listening to measurements.
:::

## Two Jacobians worth having memorized

These two come up constantly; writing them without hesitating saves a minute. Put a sensor at the origin and a target at position $(x, y)$. The straight-line distance to it is $r = \sqrt{x^2+y^2}$, by Pythagoras.

**Range** is that distance: $h = r$. Its Jacobian row is

$$\frac{\partial h}{\partial(x,y)} = \left(\frac{x}{r},\ \frac{y}{r}\right),$$

which is a **unit vector** (an arrow of length one) pointing along the **line of sight** from sensor to target. Any direction at right angles to the line of sight has a zero entry. So a range measurement carries no sideways information: slide the target a little sideways and its distance barely changes.

**Bearing** is the angle to the target: $h = \operatorname{atan2}(y, x)$. Read **[[atan2|atan2-picture]]** as "a-tan-two": the arctangent that checks the signs of $x$ and $y$ to land in the right quarter of the circle. Its Jacobian row is

$$\frac{\partial h}{\partial(x,y)} = \left(-\frac{y}{r^2},\ \frac{x}{r^2}\right).$$

This row points at right angles to the line of sight, with length $1/r$, so the sensitivity grows without limit as the target comes close — exactly what a straight-line approximation handles worst. That is why **[[bearing-only tracking|bearing-only]]** is the standard hard test of an EKF's toughness.

::: example Two Jacobians with numbers
A target sits at $x = 3\,\mathrm{km}$, $y = 4\,\mathrm{km}$ from the sensor.

**Distance.** $r = \sqrt{3000^2 + 4000^2} = \sqrt{25\,000\,000} = 5000\,\mathrm{m}$.

**Range row.** $(x/r,\ y/r) = (3000/5000,\ 4000/5000) = (0.6,\ 0.8)$. In words: move the target $1\,\mathrm{m}$ east and the range grows by $0.6\,\mathrm{m}$; move it $1\,\mathrm{m}$ north and the range grows by $0.8\,\mathrm{m}$. Check it is a unit vector: $0.6^2 + 0.8^2 = 0.36 + 0.64 = 1$. Good.

**Bearing row.** $(-y/r^2,\ x/r^2) = (-4000/25\,000\,000,\ 3000/25\,000\,000) = (-1.6\times10^{-4},\ 1.2\times10^{-4})\,\mathrm{rad/m}$. Its length is $\sqrt{1.6^2 + 1.2^2}\times 10^{-4} = 2.0\times10^{-4} = 1/5000$, which is $1/r$, as promised.

**Are they at right angles?** Multiply matching entries and add: $0.6 \times (-1.6\times10^{-4}) + 0.8 \times (1.2\times10^{-4}) = -0.96\times10^{-4} + 0.96\times10^{-4} = 0$. Zero means perpendicular. Range sees along the line; bearing sees across it.

**Ten times closer**, at $(300, 400)\,\mathrm{m}$, the range row is still $(0.6, 0.8)$, but the bearing row is $(-1.6\times10^{-3},\ 1.2\times10^{-3})$, ten times bigger: the $1/r$ blow-up.
:::

## Where linearizing stops being acceptable

The EKF replaces each curved function with its **[[Taylor expansion|taylor-picture]]** — the value at the guess, plus slope times step, plus curvature terms — and keeps only the first two parts. The thrown-away remainder is written $O(\lVert\boldsymbol{\delta}\rVert^2)$, read "order delta squared", where $\boldsymbol{\delta}$ is the spread of the state uncertainty. It grows with that spread and with how sharply the function curves.

**Nothing in the filter's own reported $\mathbf{P}$ accounts for this term.** It is gone entirely, which is why the failure is quiet.

So the test is not "is the model nonlinear?" but **"is the model close to linear across the region the covariance actually spans?"** On the foggy hill, a bumpy slope is fine if your steps are tiny, and a gentle one is not if your steps are enormous. A very nonlinear function is fine if you are sure enough about where you are; a mildly nonlinear one is not if you are not.

::: example How big the linearization error actually is
A ground station ranges a spacecraft $r = 100\,\mathrm{km}$ away along the line of sight. The filter is unsure of its *sideways* offset $d$, with standard deviation $\sigma$ (read "sigma", the typical size of the error). The measured range is

$$h = \sqrt{r^2 + d^2}.$$

**What the EKF believes.** At $d = 0$ the slope is $\partial h/\partial d = d/\sqrt{r^2+d^2} = 0$. So the linearized model predicts exactly $100\,\mathrm{km}$, and says the measurement tells you nothing sideways.

**What is actually true.** A sideways offset always makes the range *longer*, never shorter — the hypotenuse of a right triangle is longer than either side. So the expected measurement is pushed upward, by approximately $\sigma^2/(2r)$.

Working the formula for $\sigma = 1\,\mathrm{km}$: $\sigma^2/(2r) = 1000^2 / (2 \times 100\,000) = 1\,000\,000 / 200\,000 = 5\,\mathrm{m}$. The table compares that estimate with the exact average, computed numerically:

| Sideways $\sigma$ | True expected range minus $100\,\mathrm{km}$ | Second-order estimate $\sigma^2/(2r)$ |
| --- | --- | --- |
| $1\,\mathrm{km}$ | $5.00\,\mathrm{m}$ | $5.00\,\mathrm{m}$ |
| $3\,\mathrm{km}$ | $44.97\,\mathrm{m}$ | $45.00\,\mathrm{m}$ |
| $10\,\mathrm{km}$ | $496.3\,\mathrm{m}$ | $500.0\,\mathrm{m}$ |

The bias grows as the *square* of the uncertainty: ten times the $\sigma$, a hundred times the bias.

**Compare with the sensor.** Suppose the ranging sensor's noise is $\sigma_{\mathrm{range}} = 10\,\mathrm{m}$. The $1\,\mathrm{km}$ case gives a bias of $5/10 = 0.5$ sensor sigmas — invisible in the noise. The $10\,\mathrm{km}$ case gives about $500/10 = 50$ sigmas. Every innovation is enormous and points the same way, and no state can explain it, because the linearized $\mathbf{H}$ says sideways cannot affect range.

**Sanity check.** Same function and sensor in all three rows; only the covariance changed. That is what "the EKF is fine when the nonlinearity is mild across the uncertainty" means in numbers.
:::

::: note Why the bias is sigma squared over 2r
For small $d$, the square root can be expanded: $\sqrt{r^2 + d^2} = r\sqrt{1 + d^2/r^2} \approx r\left(1 + \dfrac{d^2}{2r^2}\right) = r + \dfrac{d^2}{2r}$. That used $\sqrt{1+\epsilon} \approx 1 + \epsilon/2$ for small $\epsilon$. Now average over the uncertainty. The average of $d^2$ is the variance, $\sigma^2$, so the average range is about $r + \sigma^2/(2r)$. The linear part of the expansion is zero here, so the whole error is the curvature term — the one the EKF threw away.
:::

## The divergence modes

A filter **diverges** when its estimate drifts away from the truth while it reports that all is well. "How does an EKF diverge?" wants a list with mechanisms. Six, in the order worth saying.

**One: covariance collapse from a bad linearization point.** This is the EKF's own failure, so lead with it. The new covariance $(\mathbf{I} - \mathbf{K}_k\mathbf{H}_k)\mathbf{P}_k^-$ depends entirely on the *linearized* $\mathbf{H}_k$, which cannot know it was worked out somewhere unrepresentative. If the estimate sits where the function curves sharply, $\mathbf{H}_k$ can claim the measurement pins the state down far more than it really does. Then $\mathbf{P}^+$ shrinks far more than the true uncertainty warrants. Once $\mathbf{P}$ is too small, every later gain is too small to fix the error that caused it. That is a **[[positive feedback loop|collapse-loop]]**. A linear filter cannot do this, because its $\mathbf{H}$ never depends on the estimate.

**Two: a large initial error.** Linearizing about an estimate far from the truth means the Jacobians describe the slope somewhere the vehicle is not. This is the most common cause in orbit determination. It is why a sequential filter is usually started from a **[[batch solution|batch-init]]** rather than from a guess.

**Three: unmodeled dynamics or biases — equivalently, $\mathbf{Q}$ too small.** The linear filter shares this one. $\mathbf{Q}$, the process noise, is how wrong the filter expects its model to be each step. Too small, and the covariance contracts, the gain goes to zero, and the filter stops listening while the real error grows.

**Four: unobservable states.** A combination of states invisible to every sensor either grows its covariance forever (nonzero $\mathbf{Q}$) or sits frozen at a possibly wrong starting value (zero $\mathbf{Q}$). Either way it is never corrected.

**Five: numerical loss of symmetry or [[positive definiteness|positive-definite]].** The short covariance update subtracts matrices, and in finite precision it can come out lopsided or even claim a negative variance — most likely with a nearly singular $\mathbf{Q}$ or with numbers of very different sizes in $\mathbf{P}$.

**Six: unrejected outliers.** One bad measurement enters with the full gain and moves the estimate — and with it the point where the *next* Jacobians are worked out. So one outlier can start cause one.

::: key EKF divergence
Six mechanisms: covariance collapse from Jacobians evaluated at a poor estimate, a large initial error, unmodeled dynamics or an underestimated $\mathbf{Q}$, unobservable states, numerical loss of positive definiteness, and unrejected outliers. The first is the EKF's own — $\mathbf{P}^+$ depends on the linearized $\mathbf{H}$, which does not know where it was evaluated, so the filter can become confident and closed to the very measurements that would fix it.
:::

::: warning Two failures that sound the same and are not
A filter diverging because $\mathbf{Q}$ is mistuned can be fixed by tuning, and consistency testing finds it. A filter diverging because the Jacobians are worked out at a bad estimate *cannot* be fixed by tuning. With $\mathbf{Q}$, $\mathbf{R}$ and the dynamics all exact, the gap between "linearized about the estimate" and "linearized about the truth" is still there. The fixes are different in kind: re-linearize more often, start better, or change how the curve is approximated. Saying "I would retune $\mathbf{Q}$" to a linearization failure is a wrong answer delivered confidently.
:::

## Remedies, ranked

**Start better.** A batch least-squares or initial-orbit-determination solution removes cause two outright — and cause two usually triggers cause one.

**Re-linearize more often.** The **[[iterated EKF|iterated-ekf]]** repeats the update a few times, re-working $\mathbf{h}$ and $\mathbf{H}$ at the newly corrected estimate. It costs almost nothing and directly attacks a measurement Jacobian worked out in the wrong place.

**Gate measurements.** Compute the **normalized innovation squared**, $\boldsymbol{\nu}^{\mathsf{T}}\mathbf{S}^{-1}\boldsymbol{\nu}$ — the innovation measured against the size the filter expected — against a **[[chi-squared threshold|chi-squared-gate]]**, and reject what fails. This removes cause six, one trigger of cause one.

**Use the Joseph form and a square-root or factored implementation.** They keep the covariance healthy in finite precision: cause five.

**Change the error coordinates.** For attitude, the multiplicative error-state formulation keeps the linearized quantity small by construction (a later lesson).

**Change the approximation.** If the curve is severe across the uncertainty, no care with Jacobians helps, because the straight-line approximation itself is the problem. That is when a sigma-point filter earns its cost — the next lesson.

::: example "Why does an EKF diverge, and how would you tell which one is happening?"
**A weak answer:** "It diverges when the system is too nonlinear, or when the initial error is too large, or when the tuning is wrong. You would see the estimate drift away from the truth."

Three causes with no mechanism, and a detection method that needs the truth, which a flight team never has.

**A strong answer:**

"Let me split it into the failure the EKF shares with a linear filter and the one that is its own, because the fixes differ.

Shared: the covariance is too small for the real error, usually because $\mathbf{Q}$ understates what the dynamics leave out. The gain contracts with it, and the filter stops using the data that could fix it.

The EKF's own: the posterior covariance is computed from the linearized $\mathbf{H}$, evaluated at the filter's estimate rather than at the truth — because the truth is the one thing a filter never has. If that estimate is unrepresentative, $\mathbf{H}$ can overstate how much the measurement constrains the state, and the covariance and gain collapse together. That is a positive feedback loop a linear filter cannot have, because its $\mathbf{H}$ does not depend on the estimate.

Telling them apart without truth: both show up in the innovations — a running mean that is not zero, and a normalized innovation squared, $\boldsymbol{\nu}^{\mathsf{T}}\mathbf{S}^{-1}\boldsymbol{\nu}$, above its chi-squared bound. Then the test that separates them: inflate $\mathbf{Q}$, or run with a **[[fading-memory|fading-memory]]** factor, and reprocess the same data. If consistency comes back, it was the tuning. If the innovations stay large and patterned while the covariance is now generous, it is the linearization, and I would go after it differently — start from a batch solution, iterate the update so the measurement Jacobian is re-evaluated at the corrected estimate, gate the outliers, and if the nonlinearity is genuinely severe across the covariance, move to a sigma-point filter.

One quantitative check: compare the state uncertainty with the scale over which the measurement function curves. For a range measurement at $100\,\mathrm{km}$, a sideways uncertainty of $1\,\mathrm{km}$ gives a predicted-measurement bias of about $5\,\mathrm{m}$, and $10\,\mathrm{km}$ gives about $500\,\mathrm{m}$, because the bias goes as the square of the spread. Small next to the sensor noise, linearizing is fine; tens of sigma, it is not, and no tuning will rescue it."

**What the interviewer learns:** the candidate separates two look-alike mechanisms, detects them from real **[[telemetry|telemetry]]** with no truth, proposes an experiment that tells them apart, and gives a number for whether linearizing was ever appropriate.
:::

## Check yourself

::: check
Write the EKF prediction step and say precisely which object goes through the nonlinear function and which through the Jacobian.
:::

::: answer
$\hat{\mathbf{x}}_k^- = \mathbf{f}(\hat{\mathbf{x}}_{k-1}^+, \mathbf{u}_{k-1})$ and $\mathbf{P}_k^- = \mathbf{F}_{k-1}\mathbf{P}_{k-1}^+\mathbf{F}_{k-1}^{\mathsf{T}} + \mathbf{Q}_{k-1}$, with $\mathbf{F}_{k-1} = \partial\mathbf{f}/\partial\mathbf{x}$ evaluated at $\hat{\mathbf{x}}_{k-1}^+$.

The **state** goes through the true $\mathbf{f}$ — moving one point is equally easy either way, so there is no reason to approximate. The **covariance** goes through the Jacobian, because there is no exact closed-form way to push a spread through a nonlinear function. Writing $\mathbf{F}\hat{\mathbf{x}}_{k-1}^+$ in the first equation is the common error: it throws away the nonlinearity where keeping it was free.
:::

::: check
Give the measurement Jacobian for a range sensor and for a bearing sensor in two dimensions, and say what each one tells you about the information the measurement carries.
:::

::: answer
Sensor at the origin, target at $(x,y)$, $r = \sqrt{x^2+y^2}$.

Range, $h = r$, gives $\mathbf{H} = (x/r,\ y/r)$: a unit vector along the line of sight. The measurement informs only the along-range direction, and carries exactly zero sideways information at the linearization point.

Bearing, $h = \operatorname{atan2}(y,x)$, gives $\mathbf{H} = (-y/r^2,\ x/r^2)$: perpendicular to the line of sight, with length $1/r$. It informs only the sideways direction, and its sensitivity grows without limit as the target approaches.

The two are complementary, so range plus bearing is well conditioned and either alone is not; the $1/r$ blow-up makes bearing-only tracking the standard EKF divergence test.
:::

::: check
An EKF's $\mathbf{Q}$ and $\mathbf{R}$ are exactly correct and its dynamics model is exact, and it still diverges on some runs. What is the mechanism, and why does retuning not help?
:::

::: answer
The mechanism is linearization at a poor evaluation point. The Jacobians are worked out at the filter's own estimate. The posterior covariance $(\mathbf{I}-\mathbf{K}\mathbf{H})\mathbf{P}^-$ depends on that linearized $\mathbf{H}$ alone, and nothing in it knows the point was unrepresentative. An overstated $\mathbf{H}$ makes the filter claim the measurement pinned the state down more than it did; $\mathbf{P}$ and the gain collapse, and the filter closes itself to the measurements that could recover the error.

Retuning does not help because $\mathbf{Q}$ and $\mathbf{R}$ are already right: there is no noise mismatch to correct. The fix must change the approximation or the evaluation point — iterate the update, start from a batch solution, use error-state coordinates that keep the linearized quantity small, or move to a sigma-point filter that does not linearize at all.
:::

::: check
Why does the linearization error in a predicted measurement scale as the square of the state uncertainty, and what practical test does that give you?
:::

::: answer
The EKF keeps the constant and linear terms of the Taylor expansion of $\mathbf{h}$ and drops everything from the quadratic term onward. The leading dropped term is quadratic in the deviation. When the deviation has standard deviation $\sigma$, the expected error in the predicted measurement scales as $\sigma^2$ times the local curvature.

For the range example the curvature term is $1/(2r)$, giving a bias of $\sigma^2/(2r)$: $5\,\mathrm{m}$ at $\sigma = 1\,\mathrm{km}$ and about $500\,\mathrm{m}$ at $\sigma = 10\,\mathrm{km}$ — a hundredfold increase for a tenfold increase in uncertainty.

The practical test: compare that bias with the measurement noise standard deviation. Much smaller, linearize happily. Comparable or larger, the predicted measurement is biased by something the covariance does not know about, and a sigma-point or iterated approach is warranted.
:::

::: check
Name two remedies that attack EKF divergence at its cause rather than at its symptom, and say which cause each one addresses.
:::

::: answer
Starting from a batch least-squares solution attacks cause two, a large initial error: the filter begins where linearizing is valid, which also removes the usual trigger for the collapse loop.

The iterated EKF attacks the measurement half of cause one. It re-evaluates $\mathbf{h}$ and $\mathbf{H}$ at the corrected estimate and repeats the update, so the Jacobian used to shrink the covariance is worked out at a better point than the one the prediction handed over.

Inflating $\mathbf{Q}$, by contrast, treats a symptom: it keeps the gain from collapsing, which buys time, but does nothing about where the Jacobian was evaluated.
:::

## Summary

| Item | Content |
| --- | --- |
| EKF prediction | $\hat{\mathbf{x}}^- = \mathbf{f}(\hat{\mathbf{x}}^+, \mathbf{u})$; $\mathbf{P}^- = \mathbf{F}\mathbf{P}^+\mathbf{F}^{\mathsf{T}} + \mathbf{Q}$ |
| EKF update | $\boldsymbol{\nu} = \mathbf{z} - \mathbf{h}(\hat{\mathbf{x}}^-)$; rest of the recursion as in the linear filter |
| Jacobians | $\mathbf{F} = \partial\mathbf{f}/\partial\mathbf{x}$ at $\hat{\mathbf{x}}_{k-1}^+$; $\mathbf{H} = \partial\mathbf{h}/\partial\mathbf{x}$ at $\hat{\mathbf{x}}_k^-$ |
| The organizing sentence | Nonlinear functions propagate the mean; Jacobians propagate the covariance |
| Range Jacobian | $(x/r,\ y/r)$ — no sideways information |
| Bearing Jacobian | $(-y/r^2,\ x/r^2)$ — sensitivity grows as $1/r$ |
| Truncation error | $O(\lVert\boldsymbol{\delta}\rVert^2)$; bias $\approx \sigma^2/(2r)$ for range; nothing in $\mathbf{P}$ accounts for it |
| Six divergence modes | Covariance collapse from a bad linearization point; large initial error; $\mathbf{Q}$ too small or unmodeled dynamics; unobservable states; numerical indefiniteness; unrejected outliers |
| Remedies | Batch initialization, iterated update, innovation gating, Joseph or square-root form, error-state coordinates, sigma-point filter |

The next lesson takes the last of those remedies seriously: what the unscented transform does instead of linearizing, what it costs, and how to answer the question of when it is worth paying.

::: context why-extended Why "extended"
The original Kalman filter of 1960 was for linear systems only. Engineers who needed it for spacecraft navigation, where gravity and sensor geometry are curved, *extended* it by linearizing about the current estimate at each step. Much of that early work was done at NASA's Ames Research Center by Stanley Schmidt's group, for navigating Apollo spacecraft toward the Moon. The name stuck: "extended" means "the linear filter, stretched to cover nonlinear models by using slopes".
:::

::: context partial-derivative A slope in one direction at a time
On a hillside, the slope depends on which way you face. Facing east it might be steep; facing north it might be flat. A **partial derivative** is the slope in one chosen direction while you keep every other direction fixed. The symbol $\partial$ is a curly "d", read "partial". The Jacobian collects all of these slopes into one table: one row per output, one column per input. The word comes from Carl Gustav Jacob Jacobi, a German mathematician of the 1800s who studied these tables of derivatives.
:::

::: context atan2-picture Range along the line, bearing across it
Range and bearing measure a target in two directions that are always at right angles. The range Jacobian points along the line of sight; the bearing Jacobian points across it. The plain arctangent of $y/x$ cannot tell $(1, 1)$ from $(-1, -1)$, because both give the same ratio. The two-argument version, atan2, looks at the signs of $y$ and $x$ separately, so it returns the correct angle anywhere around the full circle.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="175" x2="340" y2="175" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="40" y1="175" x2="40" y2="15" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="332" y="192" font-size="12" fill="#6c7a93">x</text>
  <text x="26" y="24" font-size="12" fill="#6c7a93">y</text>
  <circle cx="40" cy="175" r="5" fill="#1f2a44"/>
  <text x="48" y="194" font-size="12" fill="#1f2a44">sensor</text>
  <line x1="40" y1="175" x2="190" y2="55" stroke="#1f2a44" stroke-width="2" stroke-dasharray="6 4"/>
  <circle cx="190" cy="55" r="6" fill="#b4232c"/>
  <text x="200" y="50" font-size="12" fill="#b4232c">target (x, y)</text>
  <line x1="190" y1="55" x2="252" y2="5.4" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="252,5.4 238.1,10.3 245.6,19.7" fill="#1d6fd1"/>
  <text x="258" y="22" font-size="12" fill="#1d6fd1">range: along</text>
  <line x1="190" y1="55" x2="162" y2="20" stroke="#f2b880" stroke-width="4"/>
  <polygon points="158.75,16 172.2,23.2 162.8,30.7" fill="#f2b880" stroke="#1f2a44" stroke-width="0.5"/>
  <text x="150" y="16" font-size="12" fill="#1f2a44" text-anchor="end">bearing: across</text>
  <path d="M 90 175 A 50 50 0 0 0 79 144" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="96" y="160" font-size="12" fill="#1f2a44">bearing angle</text>
  <text x="120" y="128" font-size="12" fill="#1f2a44">r</text>
</svg>
```
:::

::: context bearing-only The classic hard case
Bearing-only tracking means working out where something is and how it moves from angles alone, with no distance. Submarines face it when they listen with passive sonar: they hear the direction of a sound but cannot ping for range without giving themselves away. Missile seekers and some camera-based navigation face the same problem. With angles alone, distance can only be pieced together as the observer moves, the Jacobian blows up at short range, and a poor first guess is easy to make. That combination makes it the test case researchers reach for when they want to break a filter.
:::

::: context taylor-picture The straight line and the curve
A **Taylor expansion** writes a function near a point as: value, plus slope times step, plus a curvature term times step squared, and so on. The EKF keeps the straight tangent line and discards the rest. Near the guess, the gap between line and curve is tiny. Double the step and the gap roughly quadruples, because it grows as the step squared. The name comes from Brook Taylor, an English mathematician who published the idea in 1715.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <path d="M 30 150 Q 180 -30 330 150" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <line x1="30" y1="60" x2="330" y2="60" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="180" cy="60" r="5" fill="#1f2a44"/>
  <text x="180" y="32" font-size="12" fill="#1f2a44" text-anchor="middle">estimate</text>
  <line x1="220" y1="60" x2="220" y2="66.4" stroke="#b4232c" stroke-width="2"/>
  <line x1="260" y1="60" x2="260" y2="85.6" stroke="#b4232c" stroke-width="2"/>
  <line x1="300" y1="60" x2="300" y2="117.6" stroke="#b4232c" stroke-width="2"/>
  <text x="262" y="140" font-size="12" fill="#b4232c" text-anchor="middle">gaps 1 : 4 : 9</text>
  <text x="40" y="52" font-size="12" fill="#1f2a44">tangent (what the EKF keeps)</text>
  <text x="40" y="172" font-size="12" fill="#1d6fd1">true curve</text>
</svg>
```

The three red gaps sit one, two and three steps from the estimate; their lengths go 1 : 4 : 9.
:::

::: context collapse-loop A loop that feeds itself
Positive feedback means a change causes more of the same change, like a microphone squealing when it hears its own speaker. In covariance collapse, each step makes the next one worse.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g fill="#ffffff" stroke="#1d6fd1" stroke-width="2">
    <rect x="10" y="12" width="150" height="40" rx="6"/>
    <rect x="200" y="12" width="150" height="40" rx="6"/>
    <rect x="200" y="112" width="150" height="40" rx="6"/>
    <rect x="10" y="112" width="150" height="40" rx="6"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="85" y="30">H worked out at a</text><text x="85" y="45">poor estimate</text>
    <text x="275" y="30">P shrinks too</text><text x="275" y="45">much</text>
    <text x="275" y="130">gain K becomes</text><text x="275" y="145">too small</text>
    <text x="85" y="130">error is not fixed,</text><text x="85" y="145">estimate stays poor</text>
  </g>
  <g stroke="#b4232c" stroke-width="2" fill="#b4232c">
    <line x1="160" y1="32" x2="192" y2="32"/><polygon points="198,32 190,27 190,37"/>
    <line x1="275" y1="52" x2="275" y2="104"/><polygon points="275,110 270,102 280,102"/>
    <line x1="200" y1="132" x2="168" y2="132"/><polygon points="162,132 170,127 170,137"/>
    <line x1="85" y1="112" x2="85" y2="60"/><polygon points="85,54 80,62 90,62"/>
  </g>
</svg>
```

The linear filter's $\mathbf{H}$ does not depend on the estimate, so the top-left box never happens and the loop cannot start.
:::

::: context batch-init Starting from a batch fit
A **batch** method collects a whole stretch of measurements first and then finds the one trajectory that fits all of them best, adjusting and refitting several times. Because it looks at everything together and iterates, it can recover from a poor first guess. Its answer then makes an excellent starting point for a sequential filter, which processes one measurement at a time. Lesson 13 compares the two for orbit determination.
:::

::: context positive-definite What positive definite means for a covariance
A covariance can be pictured as an ellipse of uncertainty around the estimate. **Positive definite** means every direction through that ellipse has a positive width: the filter is at least a little unsure in every direction. A variance is a squared spread, so it can never truly be negative. If rounding errors make the computed $\mathbf{P}$ claim a zero or negative variance in some direction, the filter will treat that direction as perfectly known, or worse, and the math breaks.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <ellipse cx="90" cy="65" rx="60" ry="30" transform="rotate(-25 90 65)" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="90" cy="65" r="3" fill="#1f2a44"/>
  <text x="90" y="125" font-size="12" fill="#1f2a44" text-anchor="middle">healthy: some width</text>
  <text x="90" y="141" font-size="12" fill="#1f2a44" text-anchor="middle">in every direction</text>
  <line x1="215" y1="90" x2="325" y2="40" stroke="#b4232c" stroke-width="3"/>
  <circle cx="270" cy="65" r="3" fill="#1f2a44"/>
  <text x="270" y="125" font-size="12" fill="#1f2a44" text-anchor="middle">collapsed: zero width</text>
  <text x="270" y="141" font-size="12" fill="#1f2a44" text-anchor="middle">across the line</text>
</svg>
```
:::

::: context iterated-ekf Why iterating helps
The ordinary EKF works out $\mathbf{H}$ at the predicted estimate, before the measurement arrives. After the update, the estimate has moved — usually closer to the truth. The iterated EKF says: now that we are standing somewhere better, measure the slope again and redo the update from the same prediction. Two or three passes are typical. It is like re-reading the slope under your feet after a first step in the fog, instead of trusting the slope from where you started.
:::

::: context chi-squared-gate A bouncer for measurements
If the filter is honest about its uncertainty, the normalized innovation squared follows a known pattern called the **chi-squared** distribution (said "kye-squared"). That pattern says how often a value above any given level should happen by chance. A gate sets a threshold that a good measurement would exceed only rarely — say one time in a hundred — and throws out anything above it. Lesson 9 builds the test in full.
:::

::: context fading-memory Forgetting old data on purpose
A **fading-memory** filter multiplies the predicted covariance by a factor slightly bigger than one each step, so older information counts for a little less. The effect is similar to adding process noise: the filter stays more open to new measurements. Using it as a diagnostic works because it changes only how much the filter trusts itself, not where it linearizes.
:::

::: context telemetry Telemetry
**Telemetry** is the stream of data a vehicle sends back to the ground by radio — sensor readings, filter estimates, innovations, temperatures, switch states. The word comes from Greek roots meaning "far" and "measure". A flight team sees the vehicle only through telemetry, so any diagnosis they make must use what is in it. The true position is never in the stream; the innovations always are.
:::
