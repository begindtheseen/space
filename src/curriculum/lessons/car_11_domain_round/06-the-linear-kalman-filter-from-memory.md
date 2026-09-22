---
id: l06-the-linear-kalman-filter-from-memory
title: "The linear Kalman filter, from memory"
minutes: 17
covers:
  - "the Kalman filter in linear form: the predict and update equations and what each term does"
---

"Write down the Kalman filter" is the most literal question in this module, and this module's own exercise list asks you to be able to do it on blank paper with no reference in under five minutes. That is the standard, and it is reachable: there are seven equations, they are short, and every one of them has a sentence of physical meaning attached that makes it hard to forget once the meaning is attached.

The reason the question is asked so often is not that recall is interesting. It is that the follow-up — *what does each term do?* — cannot be faked, and the equations are a compact enough object that the interviewer can watch you produce the whole thing and see exactly where the understanding runs out. A candidate who writes the gain correctly and then cannot say what the bracket in it is has told them something specific.

This lesson gives the model, the seven equations, the meaning of every term, the two alternative forms worth knowing, and the checks that catch a mis-written equation before the interviewer does.

## State the model before you write the filter

The filter is the optimal estimator *for a particular model*, so writing the filter without the model is writing an answer to an unstated question. Say this first, and it takes fifteen seconds:

$$\mathbf{x}_k = \mathbf{F}\mathbf{x}_{k-1} + \mathbf{G}\mathbf{u}_{k-1} + \mathbf{w}_{k-1}, \qquad \mathbf{z}_k = \mathbf{H}\mathbf{x}_k + \mathbf{v}_k$$

with $\mathbf{x}$ the state ($n\times1$), $\mathbf{z}$ the measurement ($m\times1$), $\mathbf{F}$ the state transition matrix ($n\times n$), $\mathbf{G}$ the control-input matrix (written $\mathbf{B}$ in many texts), $\mathbf{H}$ the measurement matrix ($m\times n$), and two noises: process noise $\mathbf{w}_k \sim \mathcal{N}(\mathbf{0}, \mathbf{Q})$ and measurement noise $\mathbf{v}_k \sim \mathcal{N}(\mathbf{0}, \mathbf{R})$. The assumptions that make the filter optimal are that both noises are **white** — uncorrelated with themselves at any other time — **zero-mean**, and **uncorrelated with each other** and with the initial state $\mathbf{x}_0 \sim \mathcal{N}(\hat{\mathbf{x}}_0, \mathbf{P}_0)$.

Two things to say about those assumptions while you have the board. If the noises are Gaussian, the filter is the optimal estimator outright — it computes the exact conditional mean. If they are not, it is still the best *linear* unbiased estimator, which is a weaker and still very useful claim. And the whiteness assumption is the one that real systems break most often, because a slowly wandering sensor bias is not white; the remedy is to estimate the bias as a state rather than to pretend it is noise.

Notation for the recursion: $\hat{\mathbf{x}}_k^-$ and $\mathbf{P}_k^-$ are the estimate and covariance *before* the measurement at step $k$ is used, $\hat{\mathbf{x}}_k^+$ and $\mathbf{P}_k^+$ are the values *after*. The filter alternates between them forever.

## Predict

$$\hat{\mathbf{x}}_k^- = \mathbf{F}\hat{\mathbf{x}}_{k-1}^+ + \mathbf{G}\mathbf{u}_{k-1}, \qquad \mathbf{P}_k^- = \mathbf{F}\mathbf{P}_{k-1}^+\mathbf{F}^{\mathsf{T}} + \mathbf{Q}$$

The state prediction is the deterministic dynamics run forward on the best available estimate. The process noise contributes nothing to the mean, because it is zero-mean: noise with no bias cannot move where you expect to be, only how sure you are.

The covariance prediction has two parts and they do different things. $\mathbf{F}\mathbf{P}\mathbf{F}^{\mathsf{T}}$ is the existing uncertainty *transported* by the dynamics — a position uncertainty and a velocity uncertainty, pushed forward a time step, produce a larger position uncertainty and a correlation between the two that was not there before. $\mathbf{Q}$ is uncertainty *created* by everything the model leaves out. The covariance always grows in prediction, which is the formal statement of the obvious fact that coasting on a model makes you less sure.

## Update

$$\boldsymbol{\nu}_k = \mathbf{z}_k - \mathbf{H}\hat{\mathbf{x}}_k^-, \qquad \mathbf{S}_k = \mathbf{H}\mathbf{P}_k^-\mathbf{H}^{\mathsf{T}} + \mathbf{R}, \qquad \mathbf{K}_k = \mathbf{P}_k^-\mathbf{H}^{\mathsf{T}}\mathbf{S}_k^{-1}$$

$$\hat{\mathbf{x}}_k^+ = \hat{\mathbf{x}}_k^- + \mathbf{K}_k\boldsymbol{\nu}_k, \qquad \mathbf{P}_k^+ = (\mathbf{I} - \mathbf{K}_k\mathbf{H})\mathbf{P}_k^-$$

$\boldsymbol{\nu}_k$ is the **innovation** — what the sensor said minus what the filter expected it to say. It is the only new information in the cycle; everything else was already known.

$\mathbf{S}_k$ is the **innovation covariance**: how big the innovation should be, given both the prior uncertainty mapped into measurement space and the sensor's own noise. It is what makes the innovation interpretable — an innovation of $30\,\mathrm{m}$ is unremarkable if $\sqrt{\mathbf{S}}$ is $40\,\mathrm{m}$ and alarming if it is $3\,\mathrm{m}$. It is also what a measurement-gating test is built from.

$\mathbf{K}_k$ is the gain, and the way to read it is as a **trust ratio**: the prior covariance mapped into measurement space, divided by the total innovation covariance. Large $\mathbf{P}^-$ or small $\mathbf{R}$ means trust the measurement; small $\mathbf{P}^-$ or large $\mathbf{R}$ means trust the prediction. In the scalar case it is unmistakable:

$$K = \frac{P^-}{P^- + R} = \frac{\rho}{1 + \rho}, \qquad \rho = \frac{P^-}{R},$$

which lies strictly between $0$ and $1$ and is exactly the fraction of the residual you accept.

::: key The linear Kalman filter
**Predict.** $\hat{\mathbf{x}}_k^- = \mathbf{F}\hat{\mathbf{x}}_{k-1}^+ + \mathbf{G}\mathbf{u}_{k-1}$; $\mathbf{P}_k^- = \mathbf{F}\mathbf{P}_{k-1}^+\mathbf{F}^{\mathsf{T}} + \mathbf{Q}$. Propagate the state through the dynamics and grow the covariance by the process noise.

**Update.** $\boldsymbol{\nu}_k = \mathbf{z}_k - \mathbf{H}\hat{\mathbf{x}}_k^-$; $\mathbf{S}_k = \mathbf{H}\mathbf{P}_k^-\mathbf{H}^{\mathsf{T}} + \mathbf{R}$; $\mathbf{K}_k = \mathbf{P}_k^-\mathbf{H}^{\mathsf{T}}\mathbf{S}_k^{-1}$; $\hat{\mathbf{x}}_k^+ = \hat{\mathbf{x}}_k^- + \mathbf{K}_k\boldsymbol{\nu}_k$; $\mathbf{P}_k^+ = (\mathbf{I} - \mathbf{K}_k\mathbf{H})\mathbf{P}_k^-$. The gain trades prior covariance against measurement covariance.
:::

## Two forms worth having ready

**The Joseph form.** The covariance update $(\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^-$ is only correct at the *optimal* gain. For any gain at all,

$$\mathbf{P}^+ = (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^-(\mathbf{I} - \mathbf{K}\mathbf{H})^{\mathsf{T}} + \mathbf{K}\mathbf{R}\mathbf{K}^{\mathsf{T}}.$$

It is a sum of two symmetric positive semi-definite terms, so it stays symmetric and positive semi-definite by construction — which the short form does not, and which is why flight implementations use it. Reach for it whenever the gain has been rounded, detuned, fixed at a steady-state value, or under-weighted deliberately.

**The information form.** Invert the update and it becomes an addition:

$$(\mathbf{P}^+)^{-1} = (\mathbf{P}^-)^{-1} + \mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{H}$$

Inverse covariances — **information** — add. This is the form that makes it obvious why a measurement can never increase uncertainty, why fusing many sensors is a sum rather than a sequence of compromises, and why an uninformative prior is written as zero information rather than as infinite covariance.

## Checks that catch a mis-written equation

Before the interviewer says anything, run these on what is on the board. They take ten seconds and they are what makes the recall answer a confident one.

**Dimensions.** $\mathbf{P}$ is $n\times n$, $\mathbf{R}$ and $\mathbf{S}$ are $m\times m$, $\mathbf{H}$ is $m\times n$, and the gain $\mathbf{K}$ must be $n\times m$ — it takes a measurement-sized object and returns a state-sized one. $\mathbf{P}^-\mathbf{H}^{\mathsf{T}}\mathbf{S}^{-1}$ is $(n\times n)(n\times m)(m\times m)$, which is $n\times m$. If your expression for the gain does not come out $n\times m$, a transpose is misplaced.

**Symmetry.** Every covariance expression must be symmetric. $\mathbf{F}\mathbf{P}\mathbf{F}^{\mathsf{T}}$ is; $\mathbf{F}\mathbf{P}\mathbf{F}$ is not.

**The two limits of the gain.** $\mathbf{R}\to\mathbf{0}$ must give a gain that takes the measurement outright; $\mathbf{R}\to\infty$ must give zero gain. Only $\mathbf{S} = \mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}} + \mathbf{R}$ in the denominator does both.

**Monotonicity.** Prediction must grow the covariance, update must shrink it. If your update can grow it, the sign is wrong.

**Units.** A covariance entry carries the product of the units of the two states it links. For a position-velocity state, the diagonal is $\mathrm{m^2}$ and $\mathrm{m^2/s^2}$ and the off-diagonal is $\mathrm{m^2/s}$.

::: example One full cycle, with numbers
A lander carries a radar altimeter. The state is altitude and descent rate, $\mathbf{x} = (h, \dot h)^{\mathsf{T}}$, the filter runs at $10\,\mathrm{Hz}$ so $\Delta t = 0.1\,\mathrm{s}$, and

$$\mathbf{F} = \begin{pmatrix}1 & 0.1\\ 0 & 1\end{pmatrix}, \qquad \mathbf{H} = \begin{pmatrix}1 & 0\end{pmatrix}.$$

The process noise comes from unmodelled acceleration with power spectral density $q = 0.5\,\mathrm{m^2/s^3}$, which for a constant-velocity model gives the standard discrete form

$$\mathbf{Q} = q\begin{pmatrix}\Delta t^3/3 & \Delta t^2/2\\ \Delta t^2/2 & \Delta t\end{pmatrix} = \begin{pmatrix}1.667\times10^{-4} & 2.5\times10^{-3}\\ 2.5\times10^{-3} & 5\times10^{-2}\end{pmatrix}.$$

**Update, worked as a scalar.** Suppose the prior altitude variance is $P^- = 4\,\mathrm{m^2}$ — a standard deviation of $2\,\mathrm{m}$ — and the altimeter has $\sigma = 1.5\,\mathrm{m}$, so $R = 2.25\,\mathrm{m^2}$. Then

$$S = 4 + 2.25 = 6.25\,\mathrm{m^2}, \qquad K = 4/6.25 = 0.64, \qquad P^+ = (1 - 0.64)\times 4 = 1.44\,\mathrm{m^2}.$$

The posterior standard deviation is $1.2\,\mathrm{m}$. Check it the other way, through the information form: $1/4 + 1/2.25 = 0.2500 + 0.4444 = 0.6944\,\mathrm{m^{-2}}$, and $1/0.6944 = 1.44\,\mathrm{m^2}$. The two routes agree, which is the check worth saying out loud.

Read the gain physically. $K = 0.64$ means the filter accepts $64\%$ of the discrepancy between what the altimeter said and what it expected. The prior is a little less certain than the sensor, so the sensor wins — but not outright, because the prior carries real information too.

**Predict, worked as a matrix.** Take the posterior after that update to be $\mathbf{P}^+ = \mathrm{diag}(1.44,\ 0.25)$ and propagate one step:

$$\mathbf{F}\mathbf{P}^+\mathbf{F}^{\mathsf{T}} = \begin{pmatrix}1.4425 & 0.025\\ 0.025 & 0.25\end{pmatrix}, \qquad \mathbf{P}^- = \mathbf{F}\mathbf{P}^+\mathbf{F}^{\mathsf{T}} + \mathbf{Q} = \begin{pmatrix}1.4427 & 0.0275\\ 0.0275 & 0.30\end{pmatrix}.$$

Three things happened in one line. The altitude variance grew from $1.44$ to $1.4427\,\mathrm{m^2}$ — a standard deviation moving from $1.200$ to $1.201\,\mathrm{m}$, barely, because a tenth of a second of a half-metre-per-second velocity uncertainty is not much. The rate variance grew from $0.25$ to $0.30\,\mathrm{m^2/s^2}$, entirely from $\mathbf{Q}$, since nothing in the dynamics informs the rate. And an off-diagonal term appeared where there was none: $0.025$ from the dynamics, because an unknown velocity error becomes a correlated altitude error over a time step, plus $0.0025$ from the shared acceleration noise. The correlation coefficient is about $0.042$ — small after one step, and it is exactly this term that lets an altimeter-only filter estimate descent rate at all.
:::

::: example "Write the Kalman filter and explain every term"
**A weak answer** writes the seven equations correctly, in silence, and then says: "So you predict forward using $\mathbf{F}$, then you compute the gain, then you update the state and the covariance."

Nothing is wrong. Nothing has been demonstrated either, beyond memory, and the interviewer's next question is going to find that out.

**A strong answer, narrated:**

"Let me state the model first, because the filter is optimal for this model and not in general.

Linear dynamics, $\mathbf{x}_k = \mathbf{F}\mathbf{x}_{k-1} + \mathbf{G}\mathbf{u}_{k-1} + \mathbf{w}$, linear measurement, $\mathbf{z}_k = \mathbf{H}\mathbf{x}_k + \mathbf{v}$, both noises white, zero-mean, uncorrelated with each other, covariances $\mathbf{Q}$ and $\mathbf{R}$. If they are also Gaussian this is the exact conditional mean; if not, it is still the best linear unbiased estimator.

Predict. $\hat{\mathbf{x}}^- = \mathbf{F}\hat{\mathbf{x}}^+ + \mathbf{G}\mathbf{u}$ — run the dynamics; the noise has zero mean so it does not move the estimate. $\mathbf{P}^- = \mathbf{F}\mathbf{P}^+\mathbf{F}^{\mathsf{T}} + \mathbf{Q}$ — the first term transports the uncertainty you had, the second adds uncertainty for what the model leaves out. Covariance always grows here.

Update. The innovation $\boldsymbol{\nu} = \mathbf{z} - \mathbf{H}\hat{\mathbf{x}}^-$ is the only new information in the cycle. Its covariance is $\mathbf{S} = \mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}} + \mathbf{R}$: how big I expected the surprise to be, from my own uncertainty plus the sensor's. The gain is $\mathbf{K} = \mathbf{P}^-\mathbf{H}^{\mathsf{T}}\mathbf{S}^{-1}$, which is a trust ratio — prior uncertainty in measurement space over total uncertainty. Then $\hat{\mathbf{x}}^+ = \hat{\mathbf{x}}^- + \mathbf{K}\boldsymbol{\nu}$ and $\mathbf{P}^+ = (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^-$.

Two caveats on that last one. It is only valid at the optimal gain — for any other gain you need the Joseph form, $(\mathbf{I}-\mathbf{K}\mathbf{H})\mathbf{P}^-(\mathbf{I}-\mathbf{K}\mathbf{H})^{\mathsf{T}} + \mathbf{K}\mathbf{R}\mathbf{K}^{\mathsf{T}}$, which is also what flight code uses because it cannot go indefinite. And in the information form the whole update is an addition, $(\mathbf{P}^+)^{-1} = (\mathbf{P}^-)^{-1} + \mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{H}$, which makes it obvious that a measurement can never make you less certain.

Checks. The gain has to be $n$ by $m$, and $\mathbf{P}^-\mathbf{H}^{\mathsf{T}}\mathbf{S}^{-1}$ is. Let $\mathbf{R}$ go to infinity and the gain goes to zero, which is right. Let it go to zero and the filter takes the measurement outright, also right. And every covariance expression here is symmetric, which is the fastest way to catch a dropped transpose."

**What the interviewer learns from the difference:** same seven equations, but the strong answer states the model, gives the role of each term as it writes it, names the one place the standard form is not valid, offers a second form and says what it makes obvious, and closes on three checks. It is around two minutes, which is longer than ninety seconds — and correctly so, because this question is explicitly asking for the whole object rather than one fact.
:::

## Check yourself

::: check
Write the predict and update equations from memory, then say which single assumption about $\mathbf{w}$ and $\mathbf{v}$ is the one real systems break most often, and what you do about it.
:::

::: answer
Predict: $\hat{\mathbf{x}}_k^- = \mathbf{F}\hat{\mathbf{x}}_{k-1}^+ + \mathbf{G}\mathbf{u}_{k-1}$ and $\mathbf{P}_k^- = \mathbf{F}\mathbf{P}_{k-1}^+\mathbf{F}^{\mathsf{T}} + \mathbf{Q}$. Update: $\boldsymbol{\nu}_k = \mathbf{z}_k - \mathbf{H}\hat{\mathbf{x}}_k^-$, $\mathbf{S}_k = \mathbf{H}\mathbf{P}_k^-\mathbf{H}^{\mathsf{T}} + \mathbf{R}$, $\mathbf{K}_k = \mathbf{P}_k^-\mathbf{H}^{\mathsf{T}}\mathbf{S}_k^{-1}$, $\hat{\mathbf{x}}_k^+ = \hat{\mathbf{x}}_k^- + \mathbf{K}_k\boldsymbol{\nu}_k$, $\mathbf{P}_k^+ = (\mathbf{I} - \mathbf{K}_k\mathbf{H})\mathbf{P}_k^-$. The assumption most often broken is **whiteness**: real sensors carry slowly wandering biases and real dynamics carry slowly varying unmodelled forces, and neither is uncorrelated from one step to the next. The remedy is to move the offending quantity out of the noise and into the state — estimate the bias, or the drag coefficient, or the residual acceleration, as an augmented state with its own dynamics — rather than inflating $\mathbf{Q}$ or $\mathbf{R}$ to cover for it.
:::

::: check
A prior altitude variance is $P^- = 9\,\mathrm{m^2}$ and a sensor has $\sigma = 1\,\mathrm{m}$. Give the gain, the posterior variance, and the physical reading of the gain. Then repeat with a sensor of $\sigma = 6\,\mathrm{m}$.
:::

::: answer
With $R = 1\,\mathrm{m^2}$: $S = 9 + 1 = 10\,\mathrm{m^2}$, $K = 9/10 = 0.9$, and $P^+ = (1-0.9)\times 9 = 0.9\,\mathrm{m^2}$, a standard deviation of about $0.949\,\mathrm{m}$ — slightly better than the sensor alone, as it must be, since the prior still contributes. The filter accepts $90\%$ of the discrepancy: the sensor is much sharper than the prior, so it dominates. With $R = 36\,\mathrm{m^2}$: $S = 9 + 36 = 45\,\mathrm{m^2}$, $K = 9/45 = 0.2$, and $P^+ = 0.8 \times 9 = 7.2\,\mathrm{m^2}$. The filter accepts only a fifth of the discrepancy, because the measurement is four times noisier than the prior in standard deviation, and the covariance barely improves. Same prior, same equations, opposite behaviour — that is the trust ratio doing its job.
:::

::: check
Why is the covariance update $\mathbf{P}^+ = (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^-$ not the form to use in flight software, and what replaces it?
:::

::: answer
Because it is only valid at the exactly optimal gain, and because it is a difference of two matrices rather than a sum of positive semi-definite ones, so finite-precision arithmetic can drive it asymmetric or even indefinite — at which point the filter is computing with something that is not a covariance and its behaviour is undefined. The replacement is the Joseph form, $\mathbf{P}^+ = (\mathbf{I} - \mathbf{K}\mathbf{H})\mathbf{P}^-(\mathbf{I} - \mathbf{K}\mathbf{H})^{\mathsf{T}} + \mathbf{K}\mathbf{R}\mathbf{K}^{\mathsf{T}}$, which is a sum of two symmetric positive semi-definite terms and is therefore symmetric and positive semi-definite by construction, and which is correct for *any* gain — a rounded one, a steady-state one, a deliberately detuned one.
:::

::: check
An interviewer asks what the bracket in the Kalman gain is. Answer in one sentence of algebra and one of physics, and give one practical use of it that is not computing the gain.
:::

::: answer
Algebraically, $\mathbf{S} = \mathbf{H}\mathbf{P}^-\mathbf{H}^{\mathsf{T}} + \mathbf{R}$ is the covariance of the innovation: the prior state covariance mapped into measurement space, plus the measurement noise covariance. Physically, it is how large a surprise the filter should expect this measurement to deliver, given how unsure it is about the state and how noisy the sensor is. The practical use beyond the gain is **gating**: form the normalised innovation squared, $\boldsymbol{\nu}^{\mathsf{T}}\mathbf{S}^{-1}\boldsymbol{\nu}$, compare it against a chi-squared threshold, and reject the measurement if it fails. That single test is what keeps one bad reading from destroying an otherwise healthy filter, and it uses $\mathbf{S}$ and nothing else.
:::

::: check
You write the gain as $\mathbf{K} = \mathbf{P}^-\mathbf{H}\mathbf{S}^{-1}$ on the board. Catch the error with a dimension check.
:::

::: answer
$\mathbf{P}^-$ is $n\times n$ and $\mathbf{H}$ is $m\times n$, so the product $\mathbf{P}^-\mathbf{H}$ requires $n = m$ and is undefined unless the measurement happens to have the same dimension as the state. Even when it is defined it is the wrong object: the gain must be $n\times m$, because it multiplies an $m\times1$ innovation and produces an $n\times1$ state correction. The correct form has $\mathbf{H}^{\mathsf{T}}$, which is $n\times m$, giving $(n\times n)(n\times m)(m\times m) = n\times m$. The whole check takes five seconds and it is the reason to write the dimensions beside the symbols the first time they appear.
:::

## Summary

| Symbol or equation | Meaning |
| --- | --- |
| $\mathbf{x}_k = \mathbf{F}\mathbf{x}_{k-1} + \mathbf{G}\mathbf{u}_{k-1} + \mathbf{w}_{k-1}$ | Linear dynamics; $\mathbf{w}\sim\mathcal{N}(\mathbf{0},\mathbf{Q})$, white |
| $\mathbf{z}_k = \mathbf{H}\mathbf{x}_k + \mathbf{v}_k$ | Linear measurement; $\mathbf{v}\sim\mathcal{N}(\mathbf{0},\mathbf{R})$, white |
| $\hat{\mathbf{x}}_k^- = \mathbf{F}\hat{\mathbf{x}}_{k-1}^+ + \mathbf{G}\mathbf{u}_{k-1}$ | Predict the state; zero-mean noise does not move the mean |
| $\mathbf{P}_k^- = \mathbf{F}\mathbf{P}_{k-1}^+\mathbf{F}^{\mathsf{T}} + \mathbf{Q}$ | Transport the uncertainty, then add what the model omits |
| $\boldsymbol{\nu}_k = \mathbf{z}_k - \mathbf{H}\hat{\mathbf{x}}_k^-$ | Innovation: the only new information in the cycle |
| $\mathbf{S}_k = \mathbf{H}\mathbf{P}_k^-\mathbf{H}^{\mathsf{T}} + \mathbf{R}$ | Innovation covariance; also the basis of measurement gating |
| $\mathbf{K}_k = \mathbf{P}_k^-\mathbf{H}^{\mathsf{T}}\mathbf{S}_k^{-1}$ | Trust ratio, $n\times m$; scalar case $K = \rho/(1+\rho)$, $\rho = P^-/R$ |
| $\hat{\mathbf{x}}_k^+ = \hat{\mathbf{x}}_k^- + \mathbf{K}_k\boldsymbol{\nu}_k$ | Accept a fraction of the surprise |
| $\mathbf{P}_k^+ = (\mathbf{I} - \mathbf{K}_k\mathbf{H})\mathbf{P}_k^-$ | Optimal gain only |
| Joseph form | $(\mathbf{I}-\mathbf{K}\mathbf{H})\mathbf{P}^-(\mathbf{I}-\mathbf{K}\mathbf{H})^{\mathsf{T}} + \mathbf{K}\mathbf{R}\mathbf{K}^{\mathsf{T}}$; any gain, numerically safe |
| Information form | $(\mathbf{P}^+)^{-1} = (\mathbf{P}^-)^{-1} + \mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{H}$ |

The next lesson takes the same recursion nonlinear: what the extended Kalman filter changes, where the linearisation stops being valid, and the specific way an EKF talks itself into confident failure.
