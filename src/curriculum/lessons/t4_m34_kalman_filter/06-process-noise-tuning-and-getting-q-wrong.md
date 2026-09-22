---
id: l06-process-noise-tuning-and-getting-q-wrong
title: Process noise tuning and the consequences of getting Q wrong
minutes: 19
covers:
  - Process noise tuning and the consequences of getting Q wrong
---

Every matrix in the filter has a source you can point to except one. $\mathbf{F}$ comes from the dynamics. $\mathbf{H}$ comes from the sensor geometry. $\mathbf{R}$ comes from a bench test. $\mathbf{Q}$, the stochastic-model lesson said, is "everything the dynamics model leaves out" — which is another way of saying it is whatever is left over after every honest source of physics has been accounted for, and there is no bench test for what you forgot to model. In practice $\mathbf{Q}$ is set by a mix of the physical reasoning the stochastic-model lesson demonstrated and plain trial against real data, and it is, by a wide margin, the number engineers spend the most time adjusting once a filter is actually flying.

This lesson is about what happens when that number is wrong in either direction, and how to choose it from data rather than by guessing. The two failure modes are not symmetric, and seeing exactly how they differ — one quiet and dangerous, the other loud and merely wasteful — is what turns "tune $\mathbf{Q}$" from folklore into an engineering procedure you can defend in front of a review board.

## What Q actually controls

Trace $\mathbf{Q}$'s effect through the machinery the last three lessons built. A larger $\mathbf{Q}$ makes $\mathbf{P}^-$ larger (the predict step, from the predict-and-update lesson). A larger $\mathbf{P}^-$ raises the trust ratio $\rho = \mathbf{P}^-/\mathbf{R}$ and so raises the gain (the trust-ratio lesson). A larger gain moves the estimate further toward each new measurement. Run that chain in reverse and a $\mathbf{Q}$ that is too small produces a small $\mathbf{P}^-$, a small gain, and an estimate that barely moves no matter what the sensor reports.

::: key What Q really represents
$\mathbf{Q}$ stands for everything the dynamics model leaves out. Too small: the covariance collapses, the gain goes to zero, and the filter ignores data it should be using — it diverges while its own reported uncertainty keeps shrinking. Too large: the estimate chases sensor noise the model should have smoothed away. $\mathbf{Q}$ is the primary tuning knob of a working filter.
:::

Both failures are consequences of the same mechanism, pointed in opposite directions, and both are demonstrated below with a real simulated filter rather than asserted.

## Too small: confident and wrong

The dangerous direction is under-estimation, and the danger is specifically that the filter's *reported* accuracy and its *actual* accuracy separate without any obvious symptom in the numbers themselves — nothing crashes, nothing throws a numerical exception, the covariance quietly stops meaning what it claims to mean.

::: example An unmodelled deceleration meets an under-tuned Q
Take the descending-booster model exactly as before, but let the truth include a genuine, unmodelled constant deceleration of $a = -3\,\mathrm{m/s^2}$ — a drag or throttle effect the constant-velocity filter's $\mathbf{F}$ does not carry, riding on top of the same process noise ($q_{\mathrm{true}} = 0.5$) used throughout the module. Run two filters against the identical $150$-step ($15\,\mathrm{s}$), identically noisy measurement stream, differing only in the $q$ used to build their own $\mathbf{Q}$:

| Step | True $p$ (m) | $q=0.5$: error (m) | $q=0.5$: $\sigma_p$ (m) | $q=0.005$: error (m) | $q=0.005$: $\sigma_p$ (m) |
| --- | --- | --- | --- | --- | --- |
| $10$ | $2428.02$ | $-1.10$ | $1.022$ | $-1.10$ | $1.016$ |
| $50$ | $2112.76$ | $-2.76$ | $0.746$ | $-4.98$ | $0.560$ |
| $100$ | $1651.91$ | $-2.03$ | $0.745$ | $-21.02$ | $0.441$ |
| $150$ | $1111.87$ | $-1.87$ | $0.745$ | $-27.73$ | $0.430$ |

The $q=0.5$ filter's error stays within about three times its own reported $\sigma_p$ throughout — not perfect, since the constant-velocity model is still structurally wrong about the acceleration, but bounded, because a process noise large enough to plausibly cover "some unmodelled acceleration" keeps the gain high enough to keep correcting toward the truth. The $q=0.005$ filter — process noise set a hundred times smaller — starts identically, then comes apart: by step $150$ its position error is $-27.73\,\mathrm{m}$ while it reports $\sigma_p = 0.430\,\mathrm{m}$, an error **sixty-four times** its own claimed standard deviation. Its RMS error over the last fifty steps is $25.8\,\mathrm{m}$ against a self-reported $\sigma_p$ averaging $0.433\,\mathrm{m}$. The filter has not crashed. It is producing smooth, confident, plausible-looking numbers, every one of them wrong, and nothing about its output format distinguishes this run from the healthy one — which is exactly why the consistency-testing lesson later in this module exists: this filter needs to be caught by a statistical test, because it will not announce itself.
:::

The mechanism is precisely the gain-starvation the last lesson previewed as a failure direction. A tiny $\mathbf{Q}$ shrinks $\mathbf{P}^-$ every predict step; a tiny $\mathbf{P}^-$ shrinks the gain; a tiny gain means each new, informative measurement moves the estimate almost not at all, so the bias the unmodelled acceleration keeps injecting is never fully corrected and instead accumulates step after step — even though every single measurement, examined on its own, was telling the filter exactly where the truth had gone.

## Too large: accurate model, noisy estimate

Over-estimation fails loudly rather than quietly, which is part of why it is the safer of the two mistakes to make by accident — but it is still a real cost, paid continuously in estimate quality rather than in a single dramatic divergence.

::: example The sweet spot, found by sweeping Q against a truth with no model error at all
Remove the unmodelled acceleration — truth is now genuinely constant-velocity, still driven by real process noise $q_{\mathrm{true}} = 0.5$, so the filter's own assumptions are exactly correct at $q=0.5$ and *only* the tuning is being tested. Sweep $q$ over two orders of magnitude and measure RMS position error against truth, plus how much the position estimate jumps from one step to the next (its standard deviation, a direct measure of how jittery the output is):

| $q$ | RMS position error (m) | step-to-step jitter (m) |
| --- | --- | --- |
| $0.005$ | $1.738$ | $0.107$ |
| $0.05$ | $0.939$ | $0.161$ |
| $0.5$ (truth) | $0.624$ | $0.271$ |
| $5.0$ | $0.745$ | $0.455$ |
| $50.0$ | $0.924$ | $0.750$ |

RMS error is smallest exactly at $q=0.5$, the true value, and rises on *both* sides — the first clean numerical confirmation that "tune $\mathbf{Q}$" has a genuine optimum rather than being a matter of taste. The jitter column tells the other half of the story: it climbs monotonically with $q$, a factor of seven from the smallest to the largest setting, because a larger assumed process noise raises the gain and a higher gain means every measurement's own noise gets carried more directly into the state estimate. At $q=50$ the filter is noticeably more accurate than at $q=0.005$ (RMS $0.924\,\mathrm{m}$ against $1.738\,\mathrm{m}$) precisely because $0.005$ is *also* wrong here — it understates the real process noise that truly is present — but it is visibly the jumpiest output of the five, "chasing" each measurement's own error into the reported state exactly as the flashcard describes.
:::

Notice what the small-$q$ row shows in this second experiment, with no unmodelled dynamics at all: it is *still* the second-worst RMS error in the table, not the best. A common intuition says "when in doubt, trust the model" — set $\mathbf{Q}$ small and let the filter be confident — but the model here includes a real, correctly-sized process noise of its own ($q_{\mathrm{true}}=0.5$), and an under-sized $\mathbf{Q}$ discounts genuine motion along with any unmodelled error. There is no direction in which "smaller $\mathbf{Q}$ is always safer" is true; there is only the true value, unknown in general, and the two kinds of wrongness on either side of it.

## Tuning Q from data: matching the innovations

The physical construction of the stochastic-model lesson — spectral densities from datasheets, ARW from a gyro's noise-density figure — gets you close, but "close" leaves a real number to pin down, and the tool for pinning it down is already built: the innovation $\boldsymbol{\nu}_k = \mathbf{z}_k - \mathbf{H}\hat{\mathbf{x}}_k^-$ and its predicted covariance $\mathbf{S}_k = \mathbf{H}\mathbf{P}_k^-\mathbf{H}^{\mathsf{T}} + \mathbf{R}$. For a correctly-tuned filter the innovations are, by the orthogonality principle established in the three-derivations lesson, zero-mean and distributed as $\boldsymbol{\nu}_k \sim \mathcal{N}(\mathbf{0}, \mathbf{S}_k)$ — and $\mathbf{S}_k$ is a function of $\mathbf{Q}$, since $\mathbf{Q}$ feeds directly into $\mathbf{P}_k^-$ through the Riccati recursion of the last lesson. That makes the average Gaussian log-likelihood of the observed innovations, as a function of the assumed $\mathbf{Q}$,

$$
\mathcal{L}(\mathbf{Q}) = -\frac{1}{2N}\sum_{k=1}^{N}\Big[\boldsymbol{\nu}_k^{\mathsf{T}}\mathbf{S}_k(\mathbf{Q})^{-1}\boldsymbol{\nu}_k + \ln\det\big(2\pi\mathbf{S}_k(\mathbf{Q})\big)\Big],
$$

a genuine, data-driven objective: run the filter once for each candidate $\mathbf{Q}$, record every innovation it produces, and score that candidate by how probable its own innovations were under its own predicted $\mathbf{S}_k$. A $\mathbf{Q}$ too small makes $\mathbf{S}_k$ too small, so ordinary-sized innovations look implausibly large under it — a heavy penalty from the quadratic term. A $\mathbf{Q}$ too large makes $\mathbf{S}_k$ needlessly large, which the $\ln\det\mathbf{S}_k$ term penalises directly, since a filter that claims to be very uncertain and is then quite accurate has also mis-predicted itself, in the other direction.

::: example Tuning Q by maximizing the innovation likelihood
Score every $q$ from the jitter table above using $\mathcal{L}(q)$ on the last hundred steps of the same no-model-error run:

| $q$ | $0.005$ | $0.05$ | $0.5$ | $5.0$ | $50.0$ |
| --- | --- | --- | --- | --- | --- |
| $\mathcal{L}(q)$ | $-2.470$ | $-2.183$ | $-2.113$ | $-2.141$ | $-2.219$ |

The maximum is at $q=0.5$ — the true value — among this grid. Refining around it, $q \in \{0.1, 0.2, 0.3, 0.5, 0.7, 1.0, 2.0, 3.0\}$ gives log-likelihoods of $-2.142, -2.121, -2.115, -2.113, -2.114, -2.116, -2.124, -2.131$: a smooth peak sitting almost exactly at $q=0.5$, with $q=0.3$ and $q=0.7$ both already visibly worse. This is the procedure to defend in a design review: not "I tried a few values and this one looked fine," but "this is the value that makes the observed innovations most probable under the model's own predicted covariance," backed by a curve with a visible, computed maximum.
:::

::: warning A likelihood peak is not a certificate of correctness
Maximizing $\mathcal{L}(\mathbf{Q})$ finds the $\mathbf{Q}$ that best explains the innovations *given every other assumption in the model* — $\mathbf{F}$, $\mathbf{H}$ and $\mathbf{R}$ all held fixed and assumed correct. If $\mathbf{R}$ is itself wrong, or the dynamics are missing a state the way the unmodelled-deceleration example did, the likelihood-maximizing $\mathbf{Q}$ will quietly absorb that error too, inflating to compensate for a mistake that is not really process noise at all. A large fitted $\mathbf{Q}$ is a symptom worth investigating, not automatically a finished tuning — the process-noise-tuning literature calls this exact failure "$\mathbf{Q}$ as a dumping ground," and the observability lesson later in this module gives one concrete reason a state can be impossible to separate from $\mathbf{Q}$ no matter how much data you collect.
:::

## Check yourself

::: check
Without redoing the simulation, explain qualitatively why the $q=0.005$ filter's $\sigma_p$ in the unmodelled-deceleration example kept *shrinking* even as its actual error kept growing.
:::

::: answer
$\sigma_p$ shrinks because the Riccati recursion of the last lesson computes $\mathbf{P}_k^-$ from $\mathbf{F}, \mathbf{Q}, \mathbf{H}, \mathbf{R}$ alone — it has no way to see the actual error, only the model's own assumptions, and with $q$ tiny those assumptions say very little uncertainty should remain after a few updates. The true error grows because the real dynamics include an acceleration the filter's $\mathbf{F}$ does not model, and the tiny gain that comes from the tiny $\mathbf{P}^-$ is not large enough to correct for it each step; the two quantities are computed by entirely different mechanisms — one from the model, one from reality — and a badly-tuned $\mathbf{Q}$ is precisely a case where they disagree without either calculation containing an error.
:::

::: check
A colleague argues that setting Q to a very small value is "the conservative choice" because it makes the filter trust its physics-based model. Use this lesson's second experiment to argue against that framing.
:::

::: answer
"Conservative" implies safer in the face of uncertainty, but the no-model-error sweep showed the smallest $q$ tested, $0.005$, gave the *second-worst* RMS error of the five values tried — worse than the true $q=0.5$ and worse even than $q=5.0$, a tenfold overestimate. A small $\mathbf{Q}$ is not neutral: it actively discounts real process noise that is genuinely present, so it is only "conservative" in the narrow sense of producing a small reported $\sigma_p$, which is the opposite of safe when that small $\sigma_p$ does not match the actual error. The unmodelled-deceleration experiment makes the same point more sharply: the small-$\mathbf{Q}$ filter was both less accurate and more confident than the correctly-tuned one, the worst possible combination.
:::

::: check
Sketch what the likelihood curve $\mathcal{L}(q)$ would look like if it were computed against the unmodelled-deceleration truth instead of the no-model-error truth. Would you still expect the peak near $q=0.5$?
:::

::: answer
Not necessarily at the same location. With a genuine unmodelled acceleration present, there is no $q$ that makes the constant-velocity model exactly correct, so the likelihood-maximizing $q$ in that case would be whatever value best trades off the two errors it can control — enough process noise to keep the gain high enough to chase the acceleration-induced drift, not so much that it needlessly amplifies measurement noise on top of that. That optimal $q$ would typically come out *larger* than the true stochastic $q_{\mathrm{true}} = 0.5$, since part of its job is now covering a real, if unmodelled, deterministic effect — which is exactly the "Q as a dumping ground" warning above, made concrete: the fitted number would be doing double duty, and a large fitted $\mathbf{Q}$ here would be a hint that a state is missing from the model, not only that the noise level was under-measured.
:::

::: check
Why does the log-likelihood objective include the $\ln\det\mathbf{S}_k$ term rather than scoring $\mathbf{Q}$ by innovation size alone?
:::

::: answer
Scoring by innovation size alone — say, minimizing $\sum_k \boldsymbol{\nu}_k^{\mathsf{T}}\mathbf{S}_k^{-1}\boldsymbol{\nu}_k$ without the determinant term — is minimized by making $\mathbf{S}_k$ as large as possible, since a large $\mathbf{S}_k^{-1}$ shrinks every quadratic term toward zero regardless of how large the actual innovations are; taken to the extreme it would reward an absurdly inflated $\mathbf{Q}$ that predicts huge uncertainty and is never "surprised" by anything. The $\ln\det\mathbf{S}_k$ term is the calibration penalty: it grows whenever $\mathbf{S}_k$ grows, so an inflated covariance is charged directly for the false modesty of claiming more uncertainty than the data need. Only the combination is a proper log-likelihood, and only the combination has a genuine interior maximum rather than a runaway solution at one extreme.
:::

## Summary

| Item | Statement |
| --- | --- |
| Q too small | Covariance and gain collapse; the filter ignores real evidence and biases accumulate uncorrected — confident and wrong, with no visible symptom in the filter's own output |
| Q too large | Covariance and gain stay high; the estimate visibly jitters, chasing measurement noise the model should smooth away |
| Mechanism | Q → P⁻ (predict step) → gain (trust ratio) → how strongly each new measurement moves the estimate |
| No model error is not "Q should be zero" | Real process noise exists even in a structurally correct model; the RMS-minimizing Q matched the true stochastic Q, not zero |
| Innovation likelihood | $\mathcal{L}(\mathbf{Q}) = -\tfrac{1}{2N}\sum_k\big[\boldsymbol{\nu}_k^{\mathsf{T}}\mathbf{S}_k^{-1}\boldsymbol{\nu}_k + \ln\det(2\pi\mathbf{S}_k)\big]$, maximized over candidate Q using real innovations |
| Q as a dumping ground | A fitted Q that has to cover an unmodelled state will run larger than the true stochastic noise, and is a hint to look for a missing state, not only a bigger number |

$\mathbf{Q}$ this lesson treated as a free dial, turned until the innovations looked right. The next lesson asks what happens to a *correctly* tuned filter if you let its recursion run forever — whether the settling behaviour glimpsed in the last two lessons' tables is a coincidence of those particular numbers or a guaranteed destination.
