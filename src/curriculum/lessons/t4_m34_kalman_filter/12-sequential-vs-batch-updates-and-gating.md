---
id: l12-sequential-vs-batch-updates-and-gating
title: 'Sequential vs batch measurement updates; measurement editing and gating'
minutes: 21
covers:
  - Sequential vs batch measurement updates; measurement editing and gating
---

Every update so far has treated $\mathbf{z}_k$ as a single vector, processed in one matrix formula, and has quietly assumed every entry of that vector deserves to be trusted. Neither assumption survives contact with a real sensor suite. A vehicle in flight often has several measurements arriving at effectively the same instant — several stars from a tracker, several range returns from a lidar, a GPS fix and a barometric reading in the same cycle — and processing them as one large vector update is a choice, not a requirement. And any one of those measurements can also be wrong: a bad return, a dropped bit, a sensor glitch, exactly the outlier the divergence lesson showed corrupting a filter that accepted it without question. This lesson answers both questions the last several lessons deferred: how to process several measurements efficiently, and how to decide whether a given measurement should be processed at all.

## Sequential processing: information adds, in any order

Suppose $m$ measurements arrive together, with rows $\mathbf{H}_1,\ldots,\mathbf{H}_m$ and *mutually independent* noise, so $\mathbf{R} = \operatorname{diag}(R_1,\ldots,R_m)$. The batch update — treating them as one $m$-vector $\mathbf{z}$ — is the ordinary formula from the predict-and-update lesson, requiring one $m\times m$ matrix inverse. The alternative is **sequential processing**: run $m$ ordinary *scalar* updates, one measurement at a time, feeding each one's output $(\hat{\mathbf{x}}^+,\mathbf{P}^+)$ in as the next one's input.

The information form derived two lessons after the model itself makes the equivalence obvious rather than merely plausible. Each scalar update adds $\mathbf{H}_i^{\mathsf{T}}R_i^{-1}\mathbf{H}_i$ to the running information matrix $(\mathbf{P})^{-1}$ and $\mathbf{H}_i^{\mathsf{T}}R_i^{-1}z_i$ to the running information vector, regardless of what order the measurements are processed in — and matrix *addition* commutes. After all $m$ updates, in any order,

$$
(\mathbf{P}^+)^{-1} = (\mathbf{P}^-)^{-1} + \sum_{i=1}^m \mathbf{H}_i^{\mathsf{T}}R_i^{-1}\mathbf{H}_i = (\mathbf{P}^-)^{-1} + \mathbf{H}^{\mathsf{T}}\mathbf{R}^{-1}\mathbf{H},
$$

exactly the batch update's information matrix, since $\mathbf{R}^{-1}=\operatorname{diag}(R_1^{-1},\ldots,R_m^{-1})$ makes the sum and the single matrix product identical term by term. The same argument applied to the information vector gives the identical $\hat{\mathbf{x}}^+$.

::: key Sequential processing equals batch processing, for independent measurements
For $\mathbf{R}=\operatorname{diag}(R_1,\ldots,R_m)$, processing $m$ scalar measurements one at a time — in *any* order — gives exactly the same $\hat{\mathbf{x}}^+$ and $\mathbf{P}^+$ as one batch update with the full $\mathbf{H}$ and $\mathbf{R}$. Information adds; addition does not care about order.
:::

::: example Three independent measurements, three orders, one answer
For a random $3$-state prior and three independent scalar measurements ($R=\operatorname{diag}(0.5,1.2,0.8)$): the batch update gives $\hat{\mathbf{x}}^+ = (-0.3131,\ -2.2116,\ 1.6049)$. Processing the same three measurements sequentially in the order $(1,2,3)$, then again in the order $(3,1,2)$, then again as $(2,3,1)$, gives the identical vector each time, and the maximum entrywise difference in $\mathbf{P}^+$ across all three orderings and the batch result is $3.2\times10^{-15}$ — floating-point noise, not a real discrepancy. The filter genuinely does not care which measurement it looks at first.
:::

The practical case for choosing sequential processing is computational. A batch update needs one $m\times m$ inverse, roughly $O(m^3)$ work by direct methods; $m$ scalar updates need $m$ scalar divisions and $m$ rank-one matrix corrections, each $O(n^2)$, with no matrix inverse of any size larger than $1\times1$ anywhere. For a handful of measurements the difference is academic; for a star tracker returning dozens of star vectors, or a lidar point cloud with hundreds of independent range returns in a single cycle, avoiding the growing matrix inverse entirely is the difference between a filter that can run in real time and one that cannot. It is also, incidentally, exactly what the square-root and UD algorithms of two lessons back were built to do efficiently — those factorizations process a vector measurement as a sequence of scalar updates internally, for the same reason.

::: warning Sequential processing needs independence, not just a diagonal-looking R
If the $m$ measurements share a common error source — the same clock, the same reference frame, the same uncorrected atmospheric delay — their true $\mathbf{R}$ has off-diagonal terms even if each measurement's *own* noise looks independent in isolation. Processing such measurements sequentially, treating them as if $\mathbf{R}$ were diagonal, silently double-counts the shared error as independent evidence from each one — the filter becomes more confident than the data actually justifies, in exactly the overconfident direction the divergence lesson's causes tend to point. The correlated-noise lesson later in this module treats this properly, by decorrelating the measurements first (a whitening transform, built from a factor of the true $\mathbf{R}$) rather than pretending it is not there.
:::

## Gating: deciding whether a measurement deserves to be trusted at all

Sequential or batch, every update so far has processed whatever $\mathbf{z}_k$ arrived. The consistency-testing lesson built exactly the tool needed to ask, before committing to that: is this particular measurement statistically plausible, given what the filter currently believes? The single-measurement NIS, $\mathrm{NIS}_k = \boldsymbol{\nu}_k^{\mathsf{T}}\mathbf{S}_k^{-1}\boldsymbol{\nu}_k$, is $\chi^2_m$-distributed for a *genuine* measurement under a *correctly-tuned* filter — so an implausibly large NIS is grounds to doubt the measurement itself, not the filter.

::: key Measurement gating
Accept a measurement only if $\boldsymbol{\nu}^{\mathsf{T}}\mathbf{S}^{-1}\boldsymbol{\nu} < \gamma$, with $\gamma$ read from the $\chi^2_m$ table at a chosen confidence level. For a scalar measurement ($m=1$) at the "three-sigma" level, $\gamma \approx 9$ — verified directly: $\chi^2_1$ at the probability $P(|Z|<3)=0.99730$ evaluates to $8.99999\ldots$, i.e. exactly $3^2$, since a $\chi^2_1$ variable *is*, by construction, the square of a standard normal. Always count and telemeter rejections; a rising rejection rate is an early warning, not merely a nuisance statistic.
:::

The scalar "gamma equals nine" result is a coincidence of $m=1$: a $\chi^2_1$ threshold at probability $p$ is, by definition, the square of the corresponding normal quantile, so "three sigma" and "the $\chi^2_1$ value at $p=0.9973$" are the same number by construction. For $m>1$ there is no single universal "sigma," only the $\chi^2_m$ quantile at whatever confidence level the mission chooses — $\chi^2_2$ at that same $99.73\%$ probability is $11.83$, $\chi^2_4$ is $16.25$, each a genuinely different threshold, not a reuse of "$9$."

::: example Gating rescues exactly the outlier the divergence lesson let through
Return to that lesson's scenario precisely: a settled filter, $\mathbf{P} = \operatorname{diag}(0.580, 0.659)$, hit with a single measurement $50\sigma$ from truth. Its NIS is $2432.3$ against a gate of $\gamma \approx 9$ — rejected without any ambiguity, by four orders of magnitude. Skipping the update entirely for this cycle (predicting forward and not incorporating $z$ at all) leaves the state at $(2281.5,\ -70.38)$, tracking the true trajectory closely; accepting the same measurement without gating, as the earlier lesson did, left the estimate $8.75\,\mathrm{m}$ off and took ten further good measurements to even half-recover. The entire difference between those two outcomes is one comparison against a precomputed number.
:::

## The other failure mode: gating a filter that was already wrong

Gating protects a healthy filter from bad data. Applied to a filter that is *already* diverging, it can do the opposite — and this is the finding worth carrying away from this lesson above the mechanics.

::: example A filter that gates itself blind
Take the under-tuned filter from the process-noise-tuning lesson ($q=0.005$, a hundred times too small, unmodelled $-3\,\mathrm{m/s^2}$ deceleration in the truth) and apply ordinary $\gamma\approx9$ gating to it, against a stream of **entirely honest** measurements — no real outliers anywhere in this data:

| Steps | Rejection rate |
| --- | --- |
| $1$–$20$ | $0.0\%$ |
| $21$–$40$ | $5.0\%$ |
| $41$–$60$ | $70.0\%$ |
| $61$–$150$ | $100.0\%$ |

By step $61$ the filter is rejecting *every single measurement*, forever, and every one of them is a perfectly honest reading. The mechanism is the same overconfidence the process-noise lesson demonstrated: the under-tuned filter's $\mathbf{S}_k$ shrinks as its covariance collapses, so the gate $\gamma \approx 9$, evaluated against an ever-smaller $\mathbf{S}_k$, starts flagging perfectly ordinary innovations as statistically impossible. Once rejection reaches $100\%$, the filter is predicting forward on its own dynamics alone, forever, with no measurement ever again given the chance to correct it — gating has converted a recoverable bad tuning into a filter that is now, structurally, permanently blind.
:::

::: warning A rising rejection rate is a symptom, not a success
It is tempting to read a high rejection rate as the gate "doing its job," filtering out noisy data. The example above is the counter-case: not one of the rejected measurements was actually bad. A gate cannot distinguish "the filter is right and this measurement is an outlier" from "the filter is wrong and this measurement is correctly disagreeing with it" — both look identical from inside the gate, a large NIS. The only way to tell them apart is exactly what the card states: count rejections, telemeter the rate, and treat a *rising* rate as a filter-health alarm to be investigated with the previous lesson's consistency tests, not as evidence the gate is protecting the filter successfully. A gate with no rejection-rate monitoring attached is a filter that can fail silently and permanently, with a perfectly clean-looking accepted-measurement log the entire time.
:::

Two remedies follow directly from recognising the failure. First, widen the gate — or better, replace outright rejection with **down-weighting**: inflate $R$ for a borderline measurement rather than discarding it entirely, so a filter that is mildly overconfident still gets some correction instead of none. Second, and more fundamentally, treat a climbing rejection rate as exactly the trigger the divergence lesson's remedies were built for: it is independent evidence, visible without needing simulated truth, that the filter's own model of its uncertainty no longer matches reality, and the fix belongs in $\mathbf{Q}$, in the state vector, or in the arithmetic — never in loosening the gate until the alarm stops firing.

## Check yourself

::: check
Explain, using the information-form argument, why processing measurements in the wrong physical order (say, a slightly stale reading processed after a fresher one) still gives the mathematically correct answer, as long as both are genuinely independent and both use the correct $\mathbf{H}$ and $R$ for what they actually measured.
:::

::: answer
The information-form update adds $\mathbf{H}_i^{\mathsf{T}}R_i^{-1}\mathbf{H}_i$ and $\mathbf{H}_i^{\mathsf{T}}R_i^{-1}z_i$ to a running total, and matrix and vector addition are commutative and associative regardless of the order terms are added in; nothing in the final sum depends on which measurement's contribution was added first. What *does* matter is that each measurement's own $\mathbf{H}_i$ correctly describes what it measured and when — if "stale" means the measurement actually corresponds to an earlier true state, its $\mathbf{H}_i$ (or a time-tag correction upstream of the filter) needs to reflect that, a timing problem this lesson's algebra does not fix, only the mislabeling of information as coming from the wrong moment.
:::

::: check
A designer proposes processing every measurement sequentially by default, even when R is not diagonal, arguing it is always cheaper. What goes wrong?
:::

::: answer
The equivalence proved in this lesson depends entirely on the measurements being independent, encoded by $\mathbf{R}$ being (at least effectively) diagonal; sequential processing implicitly assumes each measurement's noise is uncorrelated with every other's, which is false whenever $\mathbf{R}$ has genuine off-diagonal structure. Applying it anyway does not merely lose some efficiency — it uses the wrong update equations entirely, understating the true joint uncertainty and overweighting the correlated measurements as though they were independent confirmations of each other, exactly the overconfidence failure this module has returned to repeatedly. The fix, when correlation is real, is to decorrelate first, not to process sequentially regardless.
:::

::: check
Why does the "gamma equals nine" figure not generalize directly to "gamma equals sixteen" for a two-dimensional measurement by an analogous four-sigma argument?
:::

::: answer
"Three sigma" is a statement about a single Gaussian coordinate, $|Z|<3$, and $\chi^2_1$ is defined as exactly $Z^2$ for a single standard normal $Z$, so the two numbers ($9$ and the $\chi^2_1$ quantile at $P(|Z|<3)$) are the same object by definition, not by coincidence. A two-dimensional measurement's NIS is $\chi^2_2$-distributed, the sum of *two* squared standard normals, and there is no single scalar "sigma" whose square reproduces that sum's quantile at the same probability — the correct threshold is $\chi^2_2$ evaluated at whatever confidence level is chosen, $11.83$ at the same $99.73\%$ probability the scalar case used, not $9$ and not $16$.
:::

::: check
The vicious-cycle example gated an under-tuned filter and watched its rejection rate climb to $100\%$. Would gating the *over-tuned* filter from the consistency-testing lesson ($q=50$, a hundred times too large) show a similar rising rejection rate? Explain.
:::

::: answer
No — the opposite risk applies. An over-tuned filter's $\mathbf{S}_k$ is inflated, not shrunk, so genuinely large innovations (including real outliers) look small relative to that inflated $\mathbf{S}_k$ and the gate becomes too permissive rather than too strict; the rejection rate would stay near zero (or below what a correctly-tuned filter would show) even in the presence of an actual bad measurement, which would then be accepted and allowed to corrupt the state. Rejection rate is diagnostic in both directions: a rate far above what the chosen confidence level predicts points at an overconfident filter, exactly as in the worked example, while a rate far below it — especially alongside NIS values sitting persistently under the acceptance band, as the consistency-testing lesson found for this same over-tuned filter — points at a gate too loose to be doing anything at all.
:::

::: check
Propose one telemetry quantity, beyond the raw rejection count, that would let a ground team distinguish "this filter just met one real outlier" from "this filter has entered the vicious cycle."
:::

::: answer
A rolling rejection rate over a fixed recent window (the worked example's twenty-step chunks are exactly this), rather than a single cumulative count: one real outlier produces a single-step spike that a twenty-step window absorbs and then returns to its baseline, while the vicious cycle produces a rate that climbs and *stays* climbed, window after window, because the underlying cause — a collapsed $\mathbf{S}_k$ — does not self-correct once the filter has stopped accepting the measurements that could fix it. A cumulative all-time count cannot distinguish these two shapes; a windowed rate, watched over time, can.
:::

## Summary

| Item | Statement |
| --- | --- |
| Sequential = batch | For diagonal $\mathbf{R}$, $m$ scalar updates in any order give the identical $\hat{\mathbf{x}}^+,\mathbf{P}^+$ as one batch update — information adds regardless of order |
| Why sequential | $O(m)$ scalar operations, no matrix inverse larger than $1\times1$, versus one $m\times m$ inverse for batch — decisive for large $m$ |
| Correlated measurements | Sequential processing needs true independence; shared error sources need decorrelation first, treated properly in the correlated-noise lesson |
| Gating | Reject (or down-weight) if $\boldsymbol{\nu}^{\mathsf{T}}\mathbf{S}^{-1}\boldsymbol{\nu} > \gamma$, $\gamma$ from $\chi^2_m$; $\gamma\approx9$ specifically for $m=1$ at three-sigma confidence |
| Gating's blind spot | A gate on an overconfident (diverging) filter rejects honest data too, producing a rising rejection rate that deepens the divergence instead of curing it |
| Operational rule | Always telemeter the rejection rate; a persistent rise is a filter-health alarm, investigated with consistency tests, never resolved by loosening the gate |

Gating decides, cycle by cycle, whether one measurement deserves the filter's trust. The next lesson asks a related but forward-looking question about the *whole run at once*: given every measurement a filter has already processed, can the earlier estimates in that run be made better in hindsight, now that later data exists to inform them.
