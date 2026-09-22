---
id: l10-filter-divergence-causes-and-remedies
title: 'Filter divergence: causes and remedies'
minutes: 23
covers:
  - 'Filter divergence: causes and remedies (fading memory, Q inflation, covariance symmetrization)'
---

Three lessons have each produced a filter that quietly stopped being trustworthy: an under-tuned $\mathbf{Q}$ that reported a covariance sixty-four times smaller than its actual error, an unobservable position that drifted without bound while looking perfectly ordinary in every printed digit, a numerically wrong gain that turned a covariance negative on its very first update. Each was studied in isolation, with its own scenario and its own fix. This lesson assembles them into one taxonomy, fills in the two causes and techniques not yet covered — an unrejected outlier, and the blunt-instrument remedies of fading memory and covariance symmetrization — and asks the question a working GNC engineer actually needs answered: given a filter that has gone wrong, which of these is it, and what do you do about it *today*, before a redesign is possible.

**Divergence** is this module's word for exactly the failure pattern each of those three lessons demonstrated: the filter's reported covariance and its actual error separate, usually with the covariance shrinking while the error grows, so the filter becomes simultaneously worse and more confident. A filter that is merely noisy is an annoyance. A filter that is diverging is dangerous precisely because nothing in its own output announces it.

## Five causes, assembled

::: key The five causes of filter divergence
Underestimated $\mathbf{Q}$; unmodelled dynamics or biases; unobservable states; numerical loss of symmetry or positive definiteness; and unrejected measurement outliers.
:::

Three of these are no longer abstractions. **Underestimated $\mathbf{Q}$**, the process-noise-tuning lesson showed directly: a filter tuned a hundred times too tight reported $\sigma_p = 0.43\,\mathrm{m}$ while its real error grew to $27.7\,\mathrm{m}$, sixty-four reported standard deviations away from the truth, with the covariance shrinking the entire time. **Unobservable states**, the observability lesson showed equally directly: a state with zero correlation to anything the sensor could see grew its covariance forever under nonzero $\mathbf{Q}$, or sat frozen at a possibly-wrong initial value under zero $\mathbf{Q}$ — either way, uncorrected, by construction rather than by bad luck. **Numerical loss of symmetry or positive definiteness**, the numerically-stable-forms lesson showed concretely: a $4\%$ gain error against a singular $\mathbf{Q}$ turned the simplified covariance update negative on its first application. **Unmodelled dynamics or biases** appeared already, in the same process-noise-tuning example — the unmodelled deceleration that the under-tuned filter could not track — but deserves its own treatment here, because "tune $\mathbf{Q}$ better" is only one of two genuinely different responses to it. **Unrejected measurement outliers** has not appeared yet at all, and it is the cause most directly under an operator's control, since it depends only on what the filter does with a single bad reading.

## A cause not yet seen: the unrejected outlier

Every example so far has fed the filter honest measurements, correctly modelled as $\mathbf{z} = \mathbf{H}\mathbf{x} + \mathbf{v}$ with $\mathbf{v}$ drawn from the assumed $\mathbf{R}$. Real sensors occasionally hand back something that is not that: a radar multipath return, a star tracker confused by a cosmic ray strike, a GPS fix corrupted by a spoofed or reflected signal. Nothing in the filter derived so far distinguishes an honest large innovation from a corrupted one — both move the estimate by $\mathbf{K}\boldsymbol{\nu}$ in exactly the same way — and that is precisely the problem.

::: example One bad return, and how long the filter believes it
Run the settled altitude filter ($\mathbf{F},\mathbf{Q}$ as throughout, $R=4\,\mathrm{m^2}$) for $30$ steps until it has converged to $\mathbf{P} = \operatorname{diag}(0.580,\ 0.659)$. Inject a single measurement $50\sigma$ away from truth — $z = x_{\mathrm{true}} + 50\sqrt{R} = x_{\mathrm{true}}+100\,\mathrm{m}$, the kind of return a multipath reflection or a dropped bit can produce — with no gating at all:

| | Position error |
| --- | --- |
| Immediately before the outlier | (settled, small) |
| Immediately after the outlier | $8.75\,\mathrm{m}$ |
| $1$ good measurement later | $8.42\,\mathrm{m}$ |
| $5$ good measurements later | $6.23\,\mathrm{m}$ |
| $10$ good measurements later | $4.87\,\mathrm{m}$ |

The outlier's innovation was $106.6\,\mathrm{m}$ against $S=4.673\,\mathrm{m^2}$ — a normalized innovation squared of $2432$, absurd for a $\chi^2_1$-distributed quantity whose entire distribution lives below about $9$ at three-sigma confidence, the consistency-testing lesson's coming subject. Nothing in the update step itself objected: the gain, computed from a perfectly ordinary $\mathbf{P}$, pulled the estimate $8.75\,\mathrm{m}$ off course regardless and shrank the covariance right along with it, because the filter has no way to know the measurement it just trusted was not real evidence. Ten *good* measurements later, the estimate has recovered less than half the distance — because the very same small, confident covariance the outlier helped tighten now assigns the good measurements a low gain too, so the filter believes its own (wrong) estimate more than it believes the honest data trying to correct it. This is exactly the "confidently wrong" pattern from every other cause in this lesson, produced by a single bad number instead of a systematic modelling error.
:::

The remedy — check each innovation against its predicted size before accepting it, and reject or down-weight what does not fit — is called **gating**, and doing it properly, with the right statistical threshold and the right bookkeeping, is substantial enough to be its own lesson shortly. What matters here is the failure mode itself: an outlier does not just corrupt one estimate, it corrupts the covariance's own confidence in a way that actively resists the correction that follows.

## Remedy: augment the state

Return to the unmodelled-deceleration scenario the process-noise lesson used to demonstrate divergence — true acceleration $-3\,\mathrm{m/s^2}$, invisible to a constant-velocity filter's $\mathbf{F}$. That lesson's fix was to inflate $\mathbf{Q}$; a different, often better fix is to stop pretending the missing physics is noise and give it a state of its own.

::: example Augmenting beats inflating, on the identical data
Add a third state, acceleration $a$, to the model — $\mathbf{x} = (p, v, a)^{\mathsf{T}}$, with $a$ itself a slowly-varying random walk driven by a small "jerk" spectral density $q_a$ — and run it against the exact same simulated flight the process-noise lesson used:

| Filter | Final position error | RMS error (last 50 steps) | Estimated acceleration (truth $-3.0\,\mathrm{m/s^2}$) |
| --- | --- | --- | --- |
| CV, $q=0.5$ (inflated $\mathbf{Q}$, from the earlier lesson) | $-1.874\,\mathrm{m}$ | $2.201\,\mathrm{m}$ | (not modelled) |
| CA (augmented), $q_a=10^{-4}$ | $0.756\,\mathrm{m}$ | $0.601\,\mathrm{m}$ | $-3.131\,\mathrm{m/s^2}$ |
| CA (augmented), $q_a=10^{-6}$ | $0.723\,\mathrm{m}$ | $0.604\,\mathrm{m}$ | $-3.127\,\mathrm{m/s^2}$ |

The augmented filter is nearly four times more accurate than the best inflated-$\mathbf{Q}$ constant-velocity filter, and it recovers the acceleration itself to within about $4\%$ of the truth — information the inflated filter never had access to at all, since $\mathbf{Q}$-inflation hides a modelling gap inside a covariance, while augmentation replaces the gap with an actual estimate. The result is essentially insensitive to exactly how small $q_a$ is set, because the state itself, not the noise budget around it, is now doing the work of tracking the acceleration.
:::

This is the remedy the flashcard lists first for a reason: it is the only one of the five that fixes the actual deficiency rather than compensating for it statistically. It is not always available — augmenting requires knowing *what* is missing, which an outlier or a numerical error does not offer the same way an omitted acceleration does — but whenever a specific, nameable physical effect is driving divergence, adding it as a state outperforms every other remedy in this lesson.

## Remedy: fade memory when you cannot augment

Augmentation needs a hypothesis about what is missing. Sometimes there is no time to form one, or the missing effect genuinely is not a single identifiable state — and the three-derivations lesson's recursive-least-squares argument already named the blunt instrument for this case: a **forgetting factor**, here called **fading memory**, that inflates the predicted covariance a little beyond what $\mathbf{Q}$ alone would give, so the filter never becomes too certain of a model it should keep doubting.

::: key Fading-memory prediction
$$
\mathbf{P}_k^- = \lambda^2\,\mathbf{F}\mathbf{P}_{k-1}^+\mathbf{F}^{\mathsf{T}} + \mathbf{Q}, \qquad \lambda \geq 1.
$$
$\lambda=1$ recovers the ordinary predict step. $\lambda>1$ inflates the propagated covariance every cycle, which raises every gain and keeps the filter listening to new data even when its dynamics model is known to be incomplete.
:::

::: example A crude fix, honestly compared with the real one
Apply fading memory to the same badly under-tuned filter from the process-noise lesson ($q=0.005$, a hundred times too small) against the identical unmodelled-deceleration data:

| Setting | Final error | RMS (last 50 steps) |
| --- | --- | --- |
| $q=0.005$, $\lambda=1$ (no fading — the original divergence) | $-27.731\,\mathrm{m}$ | $25.811\,\mathrm{m}$ |
| $q=0.005$, $\lambda=1.01$ | $-16.885\,\mathrm{m}$ | $16.343\,\mathrm{m}$ |
| $q=0.005$, $\lambda=1.02$ | $-10.202\,\mathrm{m}$ | $10.237\,\mathrm{m}$ |
| $q=0.5$, $\lambda=1$ (correctly tuned, for reference) | $-1.874\,\mathrm{m}$ | $2.201\,\mathrm{m}$ |

Fading memory clearly helps — RMS error falls by more than half between $\lambda=1$ and $\lambda=1.02$ — and it needed no diagnosis of *why* the filter was diverging to apply. It also falls well short of either a correctly-tuned $\mathbf{Q}$ or the augmented state model from above: fading memory inflates uncertainty roughly uniformly across every direction of the state, whether or not that direction is the one actually missing physics, which is exactly why it is the remedy of last resort rather than first choice. A filter running fading memory permanently is a filter admitting it does not know what is wrong with its own model.
:::

## Remedy: symmetrize — necessary, but not sufficient

Covariance symmetrization, $\mathbf{P} \leftarrow \tfrac12(\mathbf{P}+\mathbf{P}^{\mathsf{T}})$, applied after every update, costs one addition and one scalar multiply per entry and can only ever remove asymmetry, never add it — which makes it tempting to treat as a universal safety net. Tested directly against the numerically-stable-forms lesson's dramatic failure — the $4\%$ gain error against the singular $\mathbf{Q}$ — it is not one.

::: warning Symmetrizing a broken update does not fix it
Re-running that exact failure with $\mathbf{P} \leftarrow \tfrac12(\mathbf{P}+\mathbf{P}^{\mathsf{T}})$ inserted after every update: the smallest eigenvalue is $-0.03847$ at the first update, identically, symmetrized or not. The raw asymmetry present at that step was only $2.4\times10^{-7}$ — negligible — because the failure there is genuine indefiniteness in the (already nearly symmetric) update, not an asymmetry problem at all. Symmetrizing a matrix that is validly symmetric but invalidly indefinite returns a matrix that is still symmetric and still indefinite.
:::

What symmetrization actually buys is cheaper insurance against a different, slower failure: round-off accumulating asymmetry over a very long run, which can eventually confuse any downstream routine that assumes exact symmetry — an eigenvalue solver that silently reads only one triangle of $\mathbf{P}$ and ignores disagreement in the other, or a Cholesky factorization (needed for the square-root form of the previous lesson) that errors out outright on a matrix that is not exactly symmetric. Run the correctly-tuned filter for $300{,}000$ steps in single precision with no artificial perturbation at all: without symmetrizing, the worst asymmetry observed over the entire run is $4.8\times10^{-7}$ — bounded, not accumulating, for this well-conditioned two-state problem. A less well-conditioned filter, a longer mission, or more states gives round-off more room to compound, and symmetrizing every cycle is cheap enough that there is no real reason to skip it — but it is hygiene, not a substitute for the numerically-stable-forms lesson's actual guarantees. Joseph form, or the square-root and UD forms, remain the tools that make an indefinite $\mathbf{P}$ structurally impossible; symmetrization only ever cleans up what was symmetric to begin with.

## Reading the innovations: the common thread

All five causes, for all their differences, corrupt the same evidence. Underestimated $\mathbf{Q}$ and unmodelled dynamics both leave a trace in the innovations no longer being white — a biased or autocorrelated $\boldsymbol{\nu}_k$, because the model is systematically missing something the data keeps trying to say. An unobservable direction leaves the innovations looking perfectly healthy on the observed states while the unobserved one silently drifts, detectable only by watching the covariance itself rather than the innovations alone. A numerically broken $\mathbf{P}$ announces itself directly, the moment anything checks an eigenvalue or attempts a Cholesky factor. An outlier leaves one enormous innovation, exactly once, followed by an innovation sequence that takes visibly too long to return to its usual size. Every one of these is a statistical signature, not a crash, which is exactly why none of them shows up as an error message — and exactly why the next lesson turns the innovation sequence into a formal test rather than something to eyeball.

## Check yourself

::: check
A filter has been running for months with no obvious problems, then a single bad measurement arrives. Explain why the filter's estimate takes noticeably longer than one cycle to recover, using the trust-ratio lesson's own language.
:::

::: answer
Before the outlier, a long-settled filter has a small $\mathbf{P}^-$, so its trust ratio $\rho = \mathbf{P}^-/\mathbf{R}$ is small and its gain is small — appropriately, since the filter has genuinely converged. The outlier is absorbed with that same small gain, so it does not move the estimate as far as a fresh, uncertain filter would let it, but the covariance shrinks further regardless (an update always reduces $\mathbf{P}$, whether the measurement that produced it was honest or not), leaving an even smaller gain immediately afterward. Every subsequent good measurement now faces that same small gain and can only pull the estimate back a small fraction of the remaining error each cycle — the recovery is geometric, governed by the very same $(1-K)$ factor the steady-state lesson used to describe ordinary convergence, except now it is converging back from a wrong answer instead of an uninformed one.
:::

::: check
Why does state augmentation outperform Q-inflation in the deceleration example even though both are, in some sense, "adding more freedom" to the filter?
:::

::: answer
$\mathbf{Q}$-inflation adds freedom *everywhere*, uniformly, as an admission of ignorance about what is wrong; it never learns the acceleration's actual value, only tolerates its effect by staying less certain in general. Augmentation adds freedom in exactly the one direction the physics actually requires — a state whose own dynamics and correlation with velocity let the filter's ordinary update machinery estimate the acceleration itself from the same data, not merely tolerate its presence. The augmented filter converges to $-3.13\,\mathrm{m/s^2}$, a genuine estimate of the missing physics; the inflated filter never produces any equivalent number, because inflating $\mathbf{Q}$ never asked the model to explain the discrepancy, only to shrug at it.
:::

::: check
Fading memory with $\lambda=1.02$ helped substantially but left the filter well short of the correctly-tuned reference. Explain why increasing $\lambda$ further would not be a free improvement.
:::

::: answer
Fading memory inflates the *entire* predicted covariance every cycle, not only the direction that actually needs it; pushed higher, $\lambda$ would keep raising every gain, including the gain on states whose dynamics really were captured correctly, making the filter increasingly willing to let ordinary measurement noise move states that did not need correcting. This is precisely the "too large Q chases noise" failure from the process-noise-tuning lesson, reached by a different route — fading memory is a global inflation, so pushing it far enough to fully fix one badly-modelled direction necessarily over-inflates every well-modelled one along with it.
:::

::: check
Symmetrization left the smallest eigenvalue at exactly $-0.03847$, unchanged, in the numerically-stable-forms lesson's failure case. If instead the raw asymmetry at that step had been $0.5$ rather than $2.4\times10^{-7}$, would symmetrizing likely have changed the outcome?
:::

::: answer
Possibly, but not necessarily favourably or predictably: symmetrizing replaces $\mathbf{P}$ with $\tfrac12(\mathbf{P}+\mathbf{P}^{\mathsf{T}})$, which shifts every off-diagonal entry toward the average of its two mirror entries. If the true (symmetric-part) matrix were only mildly indefinite and a large raw asymmetry happened to be masking that, symmetrizing could reveal the problem (a small negative eigenvalue appearing where a lucky cancellation had hidden it) or could equally well leave it unchanged, since averaging two off-diagonal numbers has no particular relationship to whether the underlying symmetric matrix is positive definite. The lesson's actual numbers make the more reliable point: whether symmetrizing helps or not, in general, is not something to rely on without checking, which is exactly why Joseph form's structural guarantee is the tool to reach for when the gain itself might be wrong, and symmetrization is reserved for cleaning up round-off after the fact.
:::

::: check
Of the five causes, which is the only one that a filter's own covariance report can fully hide, even from someone actively watching the innovations?
:::

::: answer
An unobservable direction. Every other cause leaves some mark on the innovation sequence — a bias or autocorrelation from unmodelled dynamics or an under-tuned $\mathbf{Q}$, a single enormous spike from an outlier, an outright invalid number from a numerical failure. An unobservable state, by definition, has no correlation with anything the sensor measures, so its innovations (there are none, in the direction that matters) and the innovations of every *observed* state can look perfectly healthy indefinitely while that one direction's true error grows or sits wrong, entirely off the pages the innovation sequence writes on. Finding it requires checking the model's observability structure directly — the previous lesson's rank test — not watching the data the filter happens to receive.
:::

## Summary

| Item | Statement |
| --- | --- |
| Divergence | Reported covariance and actual error separate, usually with the covariance shrinking while the error grows |
| Five causes | Underestimated $\mathbf{Q}$; unmodelled dynamics/bias; unobservable states; numerical loss of symmetry/PD; unrejected outliers |
| Outlier signature | One innovation far too large for its $\mathbf{S}$, followed by a slow recovery because the update shrank $\mathbf{P}$ around the corrupted estimate |
| Augment the state | Add the missing physics as a state; recovers both accuracy and an estimate of the missing quantity itself — the best available fix when the gap is identifiable |
| Fade memory | $\mathbf{P}_k^- = \lambda^2\mathbf{F}\mathbf{P}_{k-1}^+\mathbf{F}^{\mathsf{T}}+\mathbf{Q}$, $\lambda\geq1$; a global, crude substitute when the missing physics cannot be identified |
| Symmetrize | $\mathbf{P}\leftarrow\tfrac12(\mathbf{P}+\mathbf{P}^{\mathsf{T}})$; cheap, harmless, real protection against long-run round-off accumulation; no protection against a genuinely bad gain |
| Structural fix | Joseph, square-root, or UD forms (previous lesson) — the only remedies that make an indefinite $\mathbf{P}$ impossible rather than merely unlikely |

Every cause in this lesson leaves some trace in data the filter already has — an innovation, a covariance, an eigenvalue. The next lesson turns those traces into formal statistical tests, run the way a real flight team runs them: over many trials, against a precise numerical threshold, so that "the filter looks fine" stops being an eyeball judgment and becomes a number you can defend.
