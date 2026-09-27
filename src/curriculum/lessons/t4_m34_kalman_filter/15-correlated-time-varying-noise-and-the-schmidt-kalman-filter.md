---
id: l15-correlated-time-varying-noise-and-the-schmidt-kalman-filter
title: Correlated and time-varying noise; the Schmidt-Kalman consider filter
minutes: 24
covers:
  - Correlated and time-varying noise; the Schmidt-Kalman consider filter
---

Imagine flying a small drone on a gusty day. A gust shoves the drone sideways. The same gust also blows across the drone's little air-pressure sensor and makes its reading jump. One cause, two effects: the gust is part of the *process noise* that moves the vehicle, and part of the *measurement noise* that spoils the reading. The two noises are no longer strangers.

Or imagine a bathroom scale that reads $2\,\mathrm{kg}$ heavy all morning and only slowly drifts back. Its error is not fresh at each weighing; it remembers. Or a ruler whose markings might be printed a tiny bit wrong. You cannot check it, but you would be foolish to pretend it is perfect.

The stochastic-model lesson ended with four assumptions: the process noise $\mathbf{w}$ is white, the measurement noise $\mathbf{v}$ is white, the two are independent of each other, and the starting state is independent of both. Every lesson since has leaned on all four, and on the noise levels $\mathbf{Q}$ and $\mathbf{R}$ being known. This last lesson loosens them one at a time. First the drone: noises that share a cause. Then the scale: noise with memory, and noise whose size changes over time. Last the ruler: a state you should neither ignore nor try to estimate, and the filter built for it, the **Schmidt-Kalman consider filter**.

## When process and measurement noise share a cause

Measure how strongly the two noises move together with the **cross-covariance**

$$
\mathbb{E}[\mathbf{w}_k\mathbf{v}_k^{\mathsf{T}}] = \mathbf{M}.
$$

Read $\mathbb{E}[\cdot]$ as "the average of". Until now we assumed $\mathbf{M} = \mathbf{0}$. Suppose instead $\mathbf{M} \neq \mathbf{0}$: the noise $\mathbf{w}_k$ that pushes the state from step $k$ to step $k+1$ and the noise $\mathbf{v}_k$ that spoils the reading $\mathbf{z}_k$ partly come from a **[[shared cause|shared-cause]]**. This is not exotic. When a continuous system is sampled, the same underlying disturbance can end up in both the dynamics and the measurement.

**The update at step $k$ does not change.** The predicted error $\mathbf{e}_k^- = \mathbf{x}_k - \hat{\mathbf{x}}_k^-$ was built from data through step $k-1$, before $\mathbf{w}_k$ or $\mathbf{v}_k$ existed. So $\mathbf{v}_k$ is still uncorrelated with it, and the ordinary gain and update are still exactly right.

**The next predict step does change.** Here is the key thought. The reading $\mathbf{z}_k$ contains $\mathbf{v}_k$. Because $\mathbf{v}_k$ is linked to $\mathbf{w}_k$, the reading also carries a hint about $\mathbf{w}_k$ — the push the state is about to get. A drone that has seen its pressure reading jump has learned something about the gust that is shoving it right now. Throwing that hint away wastes information.

How big is the hint? The surprise in the reading is the innovation, $\boldsymbol{\nu}_k = \mathbf{H}\mathbf{e}_k^- + \mathbf{v}_k$, with covariance $\mathbf{S}_k$. Its cross-covariance with $\mathbf{w}_k$ is

$$
\operatorname{Cov}(\mathbf{w}_k, \boldsymbol{\nu}_k) = \operatorname{Cov}(\mathbf{w}_k,\mathbf{e}_k^-)\mathbf{H}^{\mathsf{T}} + \operatorname{Cov}(\mathbf{w}_k,\mathbf{v}_k) = \mathbf{0} + \mathbf{M} = \mathbf{M}.
$$

The first term is zero because $\mathbf{w}_k$ is new at step $k$. The best straight-line guess of one quantity from another is (cross-covariance) × (inverse variance of what you saw) × (what you saw). This is the same **[[regression|regression]]** rule the minimum-variance lesson used everywhere. So the best estimate of $\mathbf{w}_k$ from the innovation is $\mathbf{M}\mathbf{S}_k^{-1}\boldsymbol{\nu}_k$, and it belongs in the prediction.

::: key The correlated-noise predict step
$$
\hat{\mathbf{x}}_{k+1}^- = \mathbf{F}\hat{\mathbf{x}}_k^+ + \mathbf{G}\mathbf{u}_k + \mathbf{M}\mathbf{S}_k^{-1}\boldsymbol{\nu}_k,
$$
$$
\mathbf{P}_{k+1}^- = \mathbf{F}\mathbf{P}_k^+\mathbf{F}^{\mathsf{T}} + \mathbf{Q} - \mathbf{M}\mathbf{S}_k^{-1}\mathbf{M}^{\mathsf{T}} - \mathbf{F}\mathbf{K}_k\mathbf{M}^{\mathsf{T}} - \mathbf{M}\mathbf{K}_k^{\mathsf{T}}\mathbf{F}^{\mathsf{T}}.
$$
The extra term uses the same innovation the update has already used, scaled by the process-measurement cross-covariance rather than the state gain. Ignoring it when $\mathbf{M}\neq\mathbf{0}$ discards real, available information about the very next step's process noise. With $\mathbf{M} = \mathbf{0}$ both lines are exactly the ordinary predict step.
:::

::: note Why it has to be true: the covariance line
Write the new predicted error. The truth is $\mathbf{x}_{k+1} = \mathbf{F}\mathbf{x}_k + \mathbf{G}\mathbf{u}_k + \mathbf{w}_k$. Subtract the prediction:

$$
\mathbf{e}_{k+1}^- = \mathbf{F}\mathbf{e}_k^+ + \mathbf{w}_k - \mathbf{M}\mathbf{S}_k^{-1}\boldsymbol{\nu}_k.
$$

Its covariance is the sum of the three pieces' variances plus the cross-terms between each pair. Take them one by one.

- Variances: $\mathbf{F}\mathbf{P}_k^+\mathbf{F}^{\mathsf{T}}$, then $\mathbf{Q}$, then $\mathbf{M}\mathbf{S}_k^{-1}\mathbf{S}_k\mathbf{S}_k^{-1}\mathbf{M}^{\mathsf{T}} = \mathbf{M}\mathbf{S}_k^{-1}\mathbf{M}^{\mathsf{T}}$.
- $\mathbf{F}\mathbf{e}_k^+$ with $\mathbf{w}_k$: since $\mathbf{e}_k^+ = \mathbf{e}_k^- - \mathbf{K}_k\boldsymbol{\nu}_k$ and only $\boldsymbol{\nu}_k$ is linked to $\mathbf{w}_k$, this is $-\mathbf{F}\mathbf{K}_k\mathbf{M}^{\mathsf{T}}$, plus its transpose from the mirror-image pair.
- $\mathbf{F}\mathbf{e}_k^+$ with $\boldsymbol{\nu}_k$: zero. The optimal update leaves its error uncorrelated with the innovation — the orthogonality principle.
- $\mathbf{w}_k$ with $-\mathbf{M}\mathbf{S}_k^{-1}\boldsymbol{\nu}_k$: $-\mathbf{M}\mathbf{S}_k^{-1}\mathbf{M}^{\mathsf{T}}$, twice (once for each ordering).

Add it all: $+\mathbf{M}\mathbf{S}_k^{-1}\mathbf{M}^{\mathsf{T}} - 2\mathbf{M}\mathbf{S}_k^{-1}\mathbf{M}^{\mathsf{T}} = -\mathbf{M}\mathbf{S}_k^{-1}\mathbf{M}^{\mathsf{T}}$, and the result is the key block's second line. Using the hint makes the predicted covariance *smaller* by $\mathbf{M}\mathbf{S}_k^{-1}\mathbf{M}^{\mathsf{T}}$: that is the value of the information.
:::

::: example A correlated pair, and the cost of pretending it is not there
Take a constant-velocity model with a step of $\Delta t = 1\,\mathrm{s}$, process noise $q = 0.1\,\mathrm{m^2/s^3}$ and a position sensor with $R = 0.25\,\mathrm{m^2}$. Try two different cross-covariances: case A, $\mathbf{M} = (0.05,\ 0.12)^{\mathsf{T}}$, and case B, $\mathbf{M} = (-0.08,\ -0.14)^{\mathsf{T}}$.

First, a validity check. A cross-covariance cannot be anything you like: the full covariance of $(\mathbf{w}_k, v_k)$ together must be a real covariance. For case A it is

$$
\begin{pmatrix}\mathbf{Q} & \mathbf{M}\\ \mathbf{M}^{\mathsf{T}} & R\end{pmatrix} = \begin{pmatrix}0.0333 & 0.05 & 0.05\\ 0.05 & 0.1 & 0.12\\ 0.05 & 0.12 & 0.25\end{pmatrix},
$$

with eigenvalues $0.0051$, $0.0462$ and $0.332$, all positive. Case B's eigenvalues are $0.0059$, $0.0165$ and $0.361$, also all positive. Both are valid.

Now run $400$ independent Monte Carlo trials of $60$ steps each, with truly correlated noise. Run two filters on every trial: one with the corrected predict step, one with the ordinary predict step, as if $\mathbf{M}$ were zero. Average the NEES (the normalized estimation error squared from the consistency lesson) over the $400$ trials and over steps $21$ to $60$, once the filters have settled. For two states and $400$ trials, the $95\%$ band at each step is $[1.809,\ 2.201]$, around the ideal value of $2$.

| Case | Corrected filter | Naive filter ($\mathbf{M}$ ignored) |
| --- | --- | --- |
| A: $\mathbf{M} = (0.05,\ 0.12)$ | $2.03$ | $2.51$ |
| B: $\mathbf{M} = (-0.08,\ -0.14)$ | $2.00$ | $1.56$ |

The corrected filter sits on the ideal value in both cases. The naive filter falls outside the band in both, but in *opposite directions*. In case A it is optimistic: its real error is bigger than its covariance claims, the dangerous direction. In case B it is conservative: safe, but wasting information.

Sanity check: set $\mathbf{M} = \mathbf{0}$ and the two filters become the same filter, digit for digit. The corrected formula is a generalization, not a different filter.

The lesson: a $\mathbf{Q}$ that is too small always makes a filter optimistic. Ignoring a real $\mathbf{M}$ has no fixed direction. It always costs calibration, and which way depends on the sign of the correlation.
:::

## When noise is not white, or not steady

### Noise with memory is a state

**Colored noise** is noise with memory: this sample is linked to the last one, like the bathroom scale that reads heavy all morning. The stochastic-model lesson's rule for it was direct. Colored noise is not noise; it is a state. Put it in $\mathbf{x}$ with its own **[[Gauss-Markov|gauss-markov]]** dynamics, driven by genuinely white noise. That rule needs no new maths. What is worth seeing is what happens when you skip it: the consistency lesson's whiteness test catches it red-handed.

::: example A drifting bias, caught by its own innovations
A position $x$ does a slow random walk (step variance $0.1\,\mathrm{m^2}$). The sensor reads $z = x + b + v$. Here $v$ is white noise with $R_v = 0.5\,\mathrm{m^2}$, and $b$ is a slowly wandering bias: a Gauss-Markov process with a correlation time of $5$ steps and a steady-state standard deviation of $2.0\,\mathrm{m}$.

**The shortcut.** Pretend $b$ is extra white noise and fold its steady-state variance into $R$: $R_{\mathrm{naive}} = R_v + \sigma_b^2 = 0.5 + 2.0^2 = 4.5\,\mathrm{m^2}$. Do not model $b$ at all.

**The right way.** Add $b$ to the state, exactly as the stochastic-model lesson did for a gyro bias. Each step it shrinks by the factor $\phi = e^{-1/5} \approx 0.819$ and picks up fresh white noise of variance $\sigma_b^2(1-\phi^2) \approx 1.32\,\mathrm{m^2}$, which keeps its spread at $2.0\,\mathrm{m}$.

Run both filters on the same $400$ simulated steps and compute the **[[autocorrelation|acf-picture]]** of the normalized innovations: how much each innovation looks like the one a few steps earlier. For white innovations it should sit inside $\pm 1.96/\sqrt{400} = \pm 0.098$.

| Lag (steps) | $1$ | $2$ | $3$ | $4$ | $5$ |
| --- | --- | --- | --- | --- | --- |
| Bias folded into $R$ | $0.648$ | $0.475$ | $0.354$ | $0.254$ | $0.152$ |
| Bias as a state | $0.041$ | $0.012$ | $0.039$ | $0.053$ | $-0.010$ |

The shortcut leaves a slow, fading pattern: every lag from $1$ to $5$ is outside the band, dying away on roughly the bias's own timescale. Each innovation leans the same way as the one before, because $b$ persists from step to step. With $b$ as a state, every lag is inside the band: the innovations look like white noise.

As a bonus, the RMS position error falls from $2.01\,\mathrm{m}$ to $1.76\,\mathrm{m}$. Once the bias has somewhere to live, the filter estimates it and stops blaming it on $x$.
:::

### Noise whose size changes

The other half of this topic is gentler. **Time-varying noise** means $\mathbf{Q}_k$ or $\mathbf{R}_k$ changes from step to step, but each value is still known and the noise is still white. Examples are everywhere. A radar altimeter's error grows with altitude. GPS accuracy changes as satellites rise and set and the **[[geometry of the satellites|gps-geometry]]** shifts. If the time step $\Delta t_k$ varies, the exact $\mathbf{Q}_k$ varies with it.

The Kalman filter handles this with no new theory: at each step, use that step's $\mathbf{Q}_k$ and $\mathbf{R}_k$. Nothing in the derivation assumed they were constant. Two things do change. The steady-state filter from earlier in the module no longer applies, because there is no fixed Riccati equation to settle. And every consistency test must use the $\mathbf{R}_k$ that was actually in force, or a perfectly good filter will fail its NIS test.

::: example A radar altimeter on the way down
Suppose a lander's radar altimeter has an error of $1\%$ of altitude. At $2000\,\mathrm{m}$ that is $\sigma = 20\,\mathrm{m}$, so $R = 400\,\mathrm{m^2}$. At $50\,\mathrm{m}$ it is $\sigma = 0.5\,\mathrm{m}$, so $R = 0.25\,\mathrm{m^2}$. Say the filter's predicted altitude variance is $4\,\mathrm{m^2}$ at both moments.

The scalar gain is $K = P/(P+R)$.

- High up: $K = 4/(4+400) \approx 0.0099$. The filter moves about $1\%$ of the way toward the reading. Its variance drops only from $4$ to $3.96\,\mathrm{m^2}$.
- Near the ground: $K = 4/(4+0.25) \approx 0.941$. The filter moves $94\%$ of the way. Its standard deviation drops from $2\,\mathrm{m}$ to about $0.49\,\mathrm{m}$.

Same sensor, same filter, a hundredfold change in trust — because the filter was told the truth about $R_k$ at each moment. A filter stuck with one fixed $R$ would over-trust the altimeter up high and under-trust it exactly when the landing needs it most.
:::

## The Schmidt-Kalman consider filter

Some **[[nuisance parameters|nuisance]]** — quantities you do not care about for their own sake, but which spoil the ones you do — resist both remedies above. Think of a small constant bias that the measurements can only separate from the real signal very weakly, over a very long time. The rule says: add it to the state. You can. But a weakly observed state has a gain that is very sensitive to any error in $\mathbf{Q}$ or $\mathbf{R}$. If the filter commits to a bad estimate of the bias, the error leaks into every state linked to it.

Ignoring the bias is worse: the filter then claims an accuracy it does not have. The **[[Schmidt-Kalman consider filter|schmidt]]** answers a narrower question: how do you let a nuisance parameter's uncertainty correctly widen everything it touches, without ever letting the filter act on a guess about its value?

The construction uses a fact already proved. The Joseph form,

$$
\mathbf{P}^+=(\mathbf{I}-\mathbf{K}\mathbf{H})\mathbf{P}^-(\mathbf{I}-\mathbf{K}\mathbf{H})^{\mathsf{T}}+\mathbf{K}\mathbf{R}\mathbf{K}^{\mathsf{T}},
$$

gives the true covariance after an update with **any** gain $\mathbf{K}$, not only the optimal one. So split the state into two parts: $\mathbf{x}$, the part you estimate, and $\mathbf{y}$, the **considered** part — carried in the covariance, but never corrected. Then pick the gain on purpose:

::: key The consider filter as a constrained Joseph form
$$
\mathbf{K}_{\mathrm{consider}} = \begin{pmatrix}\mathbf{K}_x\\ \mathbf{0}\end{pmatrix},
$$
with $\mathbf{K}_x$ the $\mathbf{x}$-block of the *full*, jointly-optimal gain — computed from the complete joint $\mathbf{P}^-$, cross-covariance with $\mathbf{y}$ included — and the $\mathbf{y}$-block forced to zero. Applying the Joseph form with this gain updates $\hat{\mathbf{x}}$ and correctly propagates every entry of $\mathbf{P}$, including $\mathbf{y}$'s own variance and its cross-covariance with $\mathbf{x}$, while leaving $\hat{\mathbf{y}}$ untouched at every step. The Joseph form's guarantee — valid, symmetric, positive semi-definite for any gain — is exactly what makes deliberately choosing a suboptimal one safe to do.
:::

::: key Schmidt-Kalman (consider) filter
Carry a nuisance parameter in the covariance so its uncertainty correctly inflates the estimate, but do not update it. Used for poorly observable biases where estimating them would destabilize the filter.
:::

Notice that $\mathbf{K}_x$ uses the *joint* covariance, not one with $\mathbf{y}$ deleted. So $\mathbf{y}$'s uncertainty, and its link to $\mathbf{x}$, still widen $\mathbf{S}$, still lower how much $\mathbf{x}$ trusts each reading, and still widen the reported $\mathbf{P}_x$. The filter behaves like a person who knows what they do not know — at every step, without ever spending effort trying to pin $\mathbf{y}$ down.

::: example Honest uncertainty, not a free lunch
A quantity $x$ wanders around zero: a Gauss-Markov process with $x_{k+1} = 0.98\,x_k + w_k$ and a steady-state standard deviation of $1$. It is measured only as $z = x + y + v$, where $v$ is white with $R = 0.25$ and $y$ is an unknown constant bias. The prior on $y$ has mean $0$ and standard deviation $2$; the true value is $y = 3.0$.

Can $y$ be separated from $x$ at all? Slowly, yes. Because $x$ keeps being pulled back toward zero, the long-run average of $z$ reveals $y$. But it takes many steps.

Compare three filters over $500$ Monte Carlo trials of $200$ steps each, scoring the last $50$ steps:

| Filter | RMS error in $x$ | Reported $\sigma_x$ | $(\text{error}/\sigma_x)^2$, averaged |
| --- | --- | --- | --- |
| Full estimation of $x$ and $y$ | $0.665$ | $0.624$ | $1.14$ |
| $y$ ignored entirely | $2.89$ | $0.281$ | $106$ |
| Consider $y$ ($K_y = 0$) | $1.15$ | $0.998$ | $1.33$ |

The last column should be about $1$ for an honest filter.

- **Full estimation** is the most accurate. It really learns $y$: its final $\hat{y}$ averages $2.78$ across trials, against the true $3.0$. It is honest too.
- **Ignoring $y$** is a disaster. It claims $\sigma_x = 0.281$ while its real error is almost $2.9$: a ratio of $106$ where $1$ is ideal. The consistency tools would flag it at once.
- **Considering $y$** never moves $\hat{y}$ off $0$, so it cannot remove the bias. But it *knows* it cannot. It reports $\sigma_x \approx 1.0$, and its ratio of $1.33$ is close to honest. Here it is also more accurate than ignoring, because a filter aware of the unknown bias leans more on its model of $x$ and chases the biased readings less.

That accuracy edge is not guaranteed. Rerun with the true $y = 0$ — the lucky case where ignoring it is correct — and ignoring gives an RMS error of $0.28$ against considering's $0.90$. What the consider filter guarantees is not better accuracy. It is a claim about its own accuracy that you can trust.
:::

::: warning Consider filtering is a calibration choice, not a free accuracy gain
The example shows the trade. Full estimation bought the best accuracy by betting on a slowly, weakly identifiable parameter, and in this clean simulation the bet paid. It does not always. The process-noise lesson showed how sensitive a filter is to a wrong $\mathbf{Q}$, and a weakly observable state is where that sensitivity is sharpest: a small modeling error can be amplified into a large, confident, wrong correction to everything linked to it. Use the consider filter when that risk outweighs the accuracy full estimation could offer — not by default, and not because estimating $\mathbf{y}$ is impossible, but because getting it wrong would cost more than never trying.
:::

## Check yourself

::: check
In the correlated-noise predict step, explain why the correction term uses $\mathbf{S}_k^{-1}$ rather than $\mathbf{R}^{-1}$, even though $\mathbf{M}$ is a covariance with $\mathbf{v}_k$ specifically.
:::

::: answer
The correction is the best linear estimate of $\mathbf{w}_k$ given the *innovation* $\boldsymbol{\nu}_k$, not given $\mathbf{v}_k$. The filter never sees $\mathbf{v}_k$ on its own; it sees only $\boldsymbol{\nu}_k = \mathbf{H}\mathbf{e}_k^-+\mathbf{v}_k$, whose covariance is $\mathbf{S}_k$, not $\mathbf{R}$. The regression rule is (cross-covariance with what you saw) × (variance of what you saw)⁻¹ × (what you saw): $\operatorname{Cov}(\mathbf{w}_k,\boldsymbol{\nu}_k)\operatorname{Var}(\boldsymbol{\nu}_k)^{-1}\boldsymbol{\nu}_k = \mathbf{M}\mathbf{S}_k^{-1}\boldsymbol{\nu}_k$. The inverse must be of the variance of the thing actually observed.
:::

::: check
Why does setting $\mathbf{M}=\mathbf{0}$ in the corrected predict-step formula reduce exactly to the ordinary predict step, rather than merely approximately?
:::

::: answer
Every extra term contains $\mathbf{M}$ as a factor: $\mathbf{M}\mathbf{S}_k^{-1}\boldsymbol{\nu}_k$ in the mean, and $\mathbf{M}\mathbf{S}_k^{-1}\mathbf{M}^{\mathsf{T}}$, $\mathbf{F}\mathbf{K}_k\mathbf{M}^{\mathsf{T}}$ and its transpose in the covariance. With $\mathbf{M} = \mathbf{0}$, each is exactly the zero matrix, whatever $\mathbf{S}_k$, $\mathbf{K}_k$ and $\boldsymbol{\nu}_k$ are. The formula was built as an *addition* to the ordinary step, carrying the extra information the correlation provides. No correlation means no extra information, so the terms whose whole job is to carry it vanish exactly.
:::

::: check
The drifting-bias example folded $b$'s steady-state variance into $R$ and found autocorrelated innovations. Would using a *larger* naive $R$ — inflating it further, beyond $R_v + \sigma_b^2$ — fix the autocorrelation problem?
:::

::: answer
No. Inflating $R$ changes the *gain*: the filter trusts each measurement less. It does nothing about the cause of the correlation, which is $b$ persisting from one sample to the next. That is a fact about $b$'s dynamics, and no number in front of the innovation can change it.

In fact it makes things worse here. With a smaller gain the filter also lags behind the wandering $x$, and that lag is another slow, persistent error. In the same simulated run, raising $R$ from $4.5$ to $10$ pushes the lag-1 autocorrelation from $0.648$ to $0.706$, and $R = 40$ pushes it to $0.775$. Only giving $b$ its own dynamics, as the augmented filter did, removes the cause.
:::

::: check
In the consider-filter example, why is $\mathbf{K}_x$ computed from the full joint $\mathbf{P}^-$ (including $y$'s row and column) rather than from a version of $\mathbf{P}^-$ with $y$ deleted outright?
:::

::: answer
Deleting $y$ from $\mathbf{P}^-$ before computing $\mathbf{K}_x$ is exactly what the "ignore $y$" filter did, and it was badly overconfident: $\sigma_x = 0.281$ against a real error near $2.9$. Keeping $y$'s row and column is what lets $y$'s uncertainty widen $\mathbf{S}_k$, which lowers $\mathbf{K}_x$ compared with the ignore case, and widens the reported $\mathbf{P}_x$ afterward. The entire benefit of considering $y$, rather than ignoring it, lives in that row and column, even though $y$'s own gain is held at zero.
:::

::: check
A colleague proposes a "partial consider filter": instead of forcing $K_y$ to exactly zero, scale it down by some factor between zero and one. Is the Joseph-form guarantee of a valid, positive semi-definite $\mathbf{P}^+$ still available for this choice?
:::

::: answer
Yes. The Joseph form gives the true covariance for *any* gain at all; that is exactly why forcing $K_y$ to zero was safe in the first place. A scaled-down $K_y$ is one more choice of gain, no more and no less valid than zero or the optimal value.

What changes is the *behavior*, not the covariance's validity. Now $\hat{y}$ moves a little each step. That trades some of the consider filter's protection against a badly wrong $\hat{y}$ for some of full estimation's accuracy — a point between the two ends of the trade-off the example showed.
:::

## Summary

| Symbol or idea | Meaning | Formula or fact |
| --- | --- | --- |
| $\mathbf{M}$ | How process and measurement noise move together | $\mathbf{M} = \mathbb{E}[\mathbf{w}_k\mathbf{v}_k^{\mathsf{T}}]$ |
| Correlated predict | Use the hint the reading gives about $\mathbf{w}_k$ | $\hat{\mathbf{x}}_{k+1}^- = \mathbf{F}\hat{\mathbf{x}}_k^+ + \mathbf{G}\mathbf{u}_k + \mathbf{M}\mathbf{S}_k^{-1}\boldsymbol{\nu}_k$; the update at step $k$ is unchanged |
| Ignoring $\mathbf{M}$ | Costs calibration | Optimistic or conservative, depending on the sign of $\mathbf{M}$ |
| Colored noise | Noise with memory | Make it a Gauss-Markov state; folding it into $R$ leaves autocorrelated innovations |
| Time-varying noise | Known $\mathbf{Q}_k$, $\mathbf{R}_k$ that change | Use each step's own values; no steady state; test NIS with the right $\mathbf{R}_k$ |
| Consider gain | Estimate $\mathbf{x}$, never correct $\mathbf{y}$ | $\mathbf{K}_{\mathrm{consider}}=(\mathbf{K}_x;\mathbf{0})$ in the Joseph form, $\mathbf{K}_x$ from the joint $\mathbf{P}^-$ |
| Consider vs. ignore | Honesty | Ratio $1.33$ vs. $106$ in the example |
| Consider vs. estimate | Safety vs. accuracy | Full estimation wins when its model of the nuisance is right; consider is safe when it might not be |

That closes the linear Kalman filter as this module built it: derived three ways, run step by step, tuned, driven to steady state, tested for observability, made numerically tough, diagnosed when it diverges, checked statistically, smoothed in hindsight, rewritten for fusion, and finally protected against the states it should not gamble on. All of it assumed the model was linear and the noise Gaussian. What happens when a vehicle's dynamics or sensors bend those straight lines is the subject of the **[[next module|nonlinear-bridge]]**.

::: context shared-cause One gust, two effects
When one physical event feeds both the process noise and the measurement noise, the two stop being independent. Draw it as a fork: the cause at the top, one branch pushing the vehicle, the other spoiling the sensor.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="130" y="10" width="100" height="30" rx="6" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="30" font-size="12" text-anchor="middle" fill="#1f2a44">wind gust</text>
  <line x1="160" y1="40" x2="90" y2="90" stroke="#1f2a44" stroke-width="2"/>
  <line x1="200" y1="40" x2="270" y2="90" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="90,90 94,79 101,86" fill="#1f2a44"/>
  <polygon points="270,90 259,86 266,79" fill="#1f2a44"/>
  <rect x="30" y="92" width="120" height="30" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="210" y="92" width="120" height="30" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="90" y="112" font-size="12" text-anchor="middle" fill="#1f2a44">pushes drone: w</text>
  <text x="270" y="112" font-size="12" text-anchor="middle" fill="#1f2a44">jolts sensor: v</text>
  <text x="180" y="142" font-size="11" text-anchor="middle" fill="#b4232c">so E[w v'] = M is not zero</text>
</svg>
```
:::

::: context regression The best straight-line guess
If you know how two quantities vary together, you can guess one from the other. Tall parents tend to have tall children; the best straight-line guess of a child's height from a parent's is the cross-covariance divided by the parent-height variance, times how far the parent is from average. The Kalman gain is this same rule, with the state in place of the child and the innovation in place of the parent. Here it is used once more, with $\mathbf{w}_k$ as the thing being guessed.
:::

::: context gauss-markov Noise that forgets slowly
A first-order Gauss-Markov process shrinks a little toward zero each step and gets a fresh random kick: $b_{k+1} = \phi\,b_k + \eta_k$, with $0 < \phi < 1$. With $\phi = e^{-\Delta t/\tau}$, its memory fades over a **correlation time** $\tau$. Choosing the kick's variance as $\sigma_b^2(1-\phi^2)$ keeps its spread steady at $\sigma_b$. The kick $\eta_k$ is white, so adding $b$ to the state makes the enlarged model Markov again, and every tool in this module works.
:::

::: context acf-picture What a leaning pattern looks like
The autocorrelation from the drifting-bias example, lag by lag. Red bars (bias folded into $R$) tower over the dashed $\pm 0.098$ band and fade slowly. Blue bars (bias as a state) stay inside it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 175" font-family="Inter, Arial, sans-serif">
  <line x1="45" y1="130" x2="340" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="45" y1="130" x2="45" y2="25" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="41" y1="80" x2="45" y2="80" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="41" y1="30" x2="45" y2="30" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="37" y="134" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <text x="37" y="84" font-size="11" text-anchor="end" fill="#1f2a44">0.5</text>
  <text x="37" y="34" font-size="11" text-anchor="end" fill="#1f2a44">1</text>
  <line x1="45" y1="120.2" x2="340" y2="120.2" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="45" y1="139.8" x2="340" y2="139.8" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <rect x="67" y="65.2" width="12" height="64.8" fill="#b4232c"/>
  <rect x="81" y="125.9" width="12" height="4.1" fill="#1d6fd1"/>
  <rect x="122" y="82.5" width="12" height="47.5" fill="#b4232c"/>
  <rect x="136" y="128.8" width="12" height="1.2" fill="#1d6fd1"/>
  <rect x="177" y="94.6" width="12" height="35.4" fill="#b4232c"/>
  <rect x="191" y="126.1" width="12" height="3.9" fill="#1d6fd1"/>
  <rect x="232" y="104.6" width="12" height="25.4" fill="#b4232c"/>
  <rect x="246" y="124.7" width="12" height="5.3" fill="#1d6fd1"/>
  <rect x="287" y="114.8" width="12" height="15.2" fill="#b4232c"/>
  <rect x="301" y="130.0" width="12" height="1.0" fill="#1d6fd1"/>
  <text x="80" y="155" font-size="11" text-anchor="middle" fill="#1f2a44">1</text>
  <text x="135" y="155" font-size="11" text-anchor="middle" fill="#1f2a44">2</text>
  <text x="190" y="155" font-size="11" text-anchor="middle" fill="#1f2a44">3</text>
  <text x="245" y="155" font-size="11" text-anchor="middle" fill="#1f2a44">4</text>
  <text x="300" y="155" font-size="11" text-anchor="middle" fill="#1f2a44">5</text>
  <text x="190" y="171" font-size="11" text-anchor="middle" fill="#6c7a93">lag (steps)</text>
  <text x="200" y="45" font-size="11" fill="#b4232c">bias folded into R</text>
  <text x="200" y="62" font-size="11" fill="#1d6fd1">bias as a state</text>
</svg>
```
:::

::: context gps-geometry Why GPS accuracy changes through the day
A GPS receiver finds its position from distances to several satellites. When the satellites it can see are spread widely across the sky, those distances cross at sharp angles and pin the position down well. When they bunch together, the crossings are shallow and the same ranging error becomes a bigger position error. Receivers report this as a *dilution of precision* number, and because the satellites keep moving, it changes minute by minute. A navigation filter uses it to set $\mathbf{R}_k$.
:::

::: context nuisance Things you need but do not want
A nuisance parameter is like the weight of the box when you are weighing a parcel: you do not care about the box, but you cannot get the parcel's weight right without it. In navigation, typical nuisances are sensor biases, scale-factor errors, clock drifts, and the exact positions of the ground stations doing the tracking.
:::

::: context schmidt Named for an Apollo navigator
Stanley F. Schmidt worked at NASA's Ames Research Center when Kalman's 1960 paper appeared. He saw that it could solve the navigation problem for the Apollo lunar missions, and his group did much of the work of turning Kalman's linear theory into a filter that could run on a real trajectory. The consider filter carries his name for the idea in this lesson: account for parameters you cannot afford to estimate, without estimating them.
:::

::: context nonlinear-bridge Where the straight lines curve
The next module takes this one's derivations off the linear road. The extended Kalman filter linearizes the dynamics and sensors around the current estimate. The unscented filter pushes a handful of carefully chosen points through the real nonlinear functions instead. Particle filters use thousands of samples. And error-state filters handle attitude, where a rotation cannot be added the way this module's states were. Joseph forms, consistency tests, smoothers and consider parameters all come along for the ride.
:::
