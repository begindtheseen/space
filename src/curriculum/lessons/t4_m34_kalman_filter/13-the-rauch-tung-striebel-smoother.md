---
id: l13-the-rauch-tung-striebel-smoother
title: The Rauch-Tung-Striebel smoother
minutes: 20
covers:
  - The Rauch-Tung-Striebel smoother
---

Every estimate this module has produced so far, $\hat{\mathbf{x}}_k^+$, uses only $\mathbf{z}_1,\ldots,\mathbf{z}_k$ — the data available *at the time*, because a filter running onboard a vehicle has no other choice. Reconstructing a trajectory after the fact — a post-flight accuracy assessment, a calibration campaign, an orbit-determination solution built from a tracking pass that has already ended — has no such constraint: every measurement in the whole run is sitting in a file, available to improve the estimate at *every* point in it, including the earliest ones. Refusing to use $\mathbf{z}_{k+1},\ldots,\mathbf{z}_N$ to improve $\hat{\mathbf{x}}_k$ when they are already in hand is leaving real information on the table.

The **Rauch-Tung-Striebel (RTS) smoother** is exactly the correction: a backward pass over an already-computed forward filter, producing a smoothed estimate $\hat{\mathbf{x}}_k^s = \mathbb{E}[\mathbf{x}_k \mid \mathbf{z}_1,\ldots,\mathbf{z}_N]$ at every $k$, strictly better than the filtered $\hat{\mathbf{x}}_k^+$ everywhere except the very last sample, where there is no future left to use. It runs offline, after the forward pass has finished and been stored — it cannot run in real time, since it needs data from the future of the point it is correcting — but wherever offline reprocessing is possible, it is close to free: one backward sweep over data the filter already produced.

## The idea: the future reaches the past only through the present

The derivation leans on one structural fact, and it is worth stating precisely before doing any algebra. Because the state process is Markov — the first lesson's whiteness assumption, again — $\mathbf{x}_k$ and the future measurements $\mathbf{z}_{k+1},\ldots,\mathbf{z}_N$ are **conditionally independent given $\mathbf{x}_{k+1}$**: once $\mathbf{x}_{k+1}$ is known, nothing further about $\mathbf{x}_k$ can be learned from data that came after it, because everything the future measurements could reveal about $\mathbf{x}_k$ is already fully mediated by the one state that sits between them, $\mathbf{x}_{k+1}$. In symbols, $p(\mathbf{x}_k \mid \mathbf{x}_{k+1}, \mathbf{z}_{1:N}) = p(\mathbf{x}_k \mid \mathbf{x}_{k+1}, \mathbf{z}_{1:k})$ — the future measurements drop out entirely once $\mathbf{x}_{k+1}$ is conditioned on. This is the entire mechanism that makes a backward *recursion* possible at all, rather than needing to re-run a full batch solve centered on every single $k$.

## Deriving the backward recursion

The right-hand side of that conditional-independence statement is something the forward filter has already computed the ingredients for. Given data through step $k$, the **joint** distribution of $(\mathbf{x}_k, \mathbf{x}_{k+1})$ is Gaussian, since $\mathbf{x}_{k+1} = \mathbf{F}\mathbf{x}_k + \mathbf{w}_k$ is a linear function of $\mathbf{x}_k$ plus independent Gaussian noise, with mean $(\hat{\mathbf{x}}_k^+, \hat{\mathbf{x}}_{k+1}^-)$ and covariance blocks

$$
\begin{pmatrix}\mathbf{P}_k^+ & \mathbf{P}_k^+\mathbf{F}^{\mathsf{T}}\\ \mathbf{F}\mathbf{P}_k^+ & \mathbf{P}_{k+1}^-\end{pmatrix},
$$

the cross-covariance following directly from $\operatorname{Cov}(\mathbf{x}_k, \mathbf{x}_{k+1}) = \operatorname{Cov}(\mathbf{x}_k, \mathbf{F}\mathbf{x}_k+\mathbf{w}_k) = \mathbf{P}_k^+\mathbf{F}^{\mathsf{T}}$. Applying the probability module's Gaussian-conditioning rule — the exact tool the Bayesian derivation used, two lessons after the model itself — to condition $\mathbf{x}_k$ on $\mathbf{x}_{k+1}$ within this joint distribution gives

$$
p(\mathbf{x}_k\mid\mathbf{x}_{k+1},\mathbf{z}_{1:k}):\quad \text{mean } \hat{\mathbf{x}}_k^+ + \mathbf{C}_k(\mathbf{x}_{k+1}-\hat{\mathbf{x}}_{k+1}^-), \qquad \mathbf{C}_k = \mathbf{P}_k^+\mathbf{F}^{\mathsf{T}}(\mathbf{P}_{k+1}^-)^{-1}.
$$

By the conditional-independence fact, this is *also* $p(\mathbf{x}_k\mid\mathbf{x}_{k+1},\mathbf{z}_{1:N})$ — adding the future measurements to the conditioning changes nothing, as long as $\mathbf{x}_{k+1}$ is already there. Since this conditional mean is linear in $\mathbf{x}_{k+1}$, taking its expectation over $\mathbf{x}_{k+1}$'s own distribution given *all* the data, $\mathbf{x}_{k+1}\mid\mathbf{z}_{1:N} \sim \mathcal{N}(\hat{\mathbf{x}}_{k+1}^s, \mathbf{P}_{k+1}^s)$ — the smoothed result one step ahead, assumed already computed by the same backward recursion — gives $\hat{\mathbf{x}}_k^s$ directly, by linearity of expectation:

::: key The RTS smoother
Running backward from $k=N-1$ down to $k=1$, with $\hat{\mathbf{x}}_N^s = \hat{\mathbf{x}}_N^+$, $\mathbf{P}_N^s = \mathbf{P}_N^+$:
$$
\mathbf{C}_k = \mathbf{P}_k^+\mathbf{F}^{\mathsf{T}}(\mathbf{P}_{k+1}^-)^{-1}, \qquad
\hat{\mathbf{x}}_k^s = \hat{\mathbf{x}}_k^+ + \mathbf{C}_k\big(\hat{\mathbf{x}}_{k+1}^s - \hat{\mathbf{x}}_{k+1}^-\big), \qquad
\mathbf{P}_k^s = \mathbf{P}_k^+ + \mathbf{C}_k\big(\mathbf{P}_{k+1}^s - \mathbf{P}_{k+1}^-\big)\mathbf{C}_k^{\mathsf{T}}.
$$
Every quantity on the right except $\hat{\mathbf{x}}_{k+1}^s$ and $\mathbf{P}_{k+1}^s$ comes straight from the stored forward pass — no re-filtering, one backward sweep.
:::

The covariance recursion follows the same conditioning: the variance of $\mathbf{x}_k$ given $\mathbf{x}_{k+1}$ alone is the ordinary conditional-Gaussian residual, $\mathbf{P}_k^+ - \mathbf{C}_k\mathbf{P}_{k+1}^-\mathbf{C}_k^{\mathsf{T}}$; adding back the genuine uncertainty that remains in $\mathbf{x}_{k+1}$ once *all* the data is used, propagated through the same linear relationship, contributes $\mathbf{C}_k\mathbf{P}_{k+1}^s\mathbf{C}_k^{\mathsf{T}}$, and the two combine into the formula above.

## Why smoothing can only help

$\mathbf{C}_k$ has exactly the shape of the predict step's own transpose relationship — it is not a new object, only $\mathbf{P}_k^+\mathbf{F}^{\mathsf{T}}$ rescaled by the inverse of the very quantity the predict step produces, $\mathbf{P}_{k+1}^-$. That connection makes the improvement provable rather than merely observed. At the final sample, $\mathbf{P}_N^s = \mathbf{P}_N^+$ by definition — no future data exists to help there, and the recursion's boundary condition says so directly. Suppose, by induction backward from that boundary, $\mathbf{P}_{k+1}^s \preceq \mathbf{P}_{k+1}^-$ (the smoothed covariance at step $k+1$ is no larger, in the Loewner sense, than the plain predicted one). Then $\mathbf{P}_{k+1}^s - \mathbf{P}_{k+1}^-$ is negative semi-definite, and sandwiching a negative semi-definite matrix between $\mathbf{C}_k$ and its transpose keeps it negative semi-definite, so

$$
\mathbf{P}_k^s = \mathbf{P}_k^+ + \mathbf{C}_k(\mathbf{P}_{k+1}^s-\mathbf{P}_{k+1}^-)\mathbf{C}_k^{\mathsf{T}} \preceq \mathbf{P}_k^+ \preceq \mathbf{P}_k^-,
$$

the last step using the ordinary fact that an update never increases uncertainty. The induction closes: $\mathbf{P}_k^s \preceq \mathbf{P}_k^+$ at every step, with equality only at $k=N$. Smoothing cannot make an estimate worse; the only question is by how much better it makes one, which depends on how much the future genuinely had to say about that particular moment.

::: example A three-step run, traced by hand
Start from $\hat{\mathbf{x}}_0^+=(100,\,0)$, $\mathbf{P}_0^+=\operatorname{diag}(4,1)$, with $\mathbf{F},\mathbf{Q}$ as throughout this module ($\Delta t=0.1\,\mathrm{s}$, $q=0.5$) and $R=4$, and three measurements $z=101,\,103,\,108$, one per step.

Forward pass: $k=1$: $\hat{\mathbf{x}}_1^-=(100,\,0)$, $\mathbf{P}_1^-\approx\operatorname{diag}(4.010,1.050)$; updating with $z=101$ gives $\hat{\mathbf{x}}_1^+\approx(100.50,\,0.0128)$, $\mathbf{P}_1^+\approx\operatorname{diag}(2.003,1.049)$. $k=2$: $\hat{\mathbf{x}}_2^-\approx(100.50,\,0.0128)$, $\mathbf{P}_2^-\approx\operatorname{diag}(2.023,1.099)$; updating with $z=103$ gives $\hat{\mathbf{x}}_2^+\approx(101.34,\,0.0786)$, $\mathbf{P}_2^+\approx\operatorname{diag}(1.344,1.095)$. $k=3$: $\hat{\mathbf{x}}_3^-\approx(101.35,\,0.0786)$, $\mathbf{P}_3^-\approx\operatorname{diag}(1.376,1.145)$; updating with $z=108$ gives $\hat{\mathbf{x}}_3^+\approx(103.05,\,0.347)$, $\mathbf{P}_3^+\approx\operatorname{diag}(1.024,1.136)$ — and since $N=3$, this is also $\hat{\mathbf{x}}_3^s,\mathbf{P}_3^s$ by the boundary condition.

Backward pass: $\mathbf{C}_2 = \mathbf{P}_2^+\mathbf{F}^{\mathsf{T}}(\mathbf{P}_3^-)^{-1} \approx \begin{pmatrix}0.9997 & -0.0978\\ 0.0052 & 0.9553\end{pmatrix}$, giving $\hat{\mathbf{x}}_2^s \approx (103.02,\,0.344)$. Then $\mathbf{C}_1 \approx \begin{pmatrix}0.9999 & -0.0977\\ 0.0024 & 0.9542\end{pmatrix}$, giving $\hat{\mathbf{x}}_1^s \approx (102.98,\,0.335)$.

The early estimate moved substantially: $\hat{x}_{1,p}^+ = 100.50$, informed only by the first, modest measurement, becomes $\hat{x}_{1,p}^s = 102.98$ once the later measurements — which show the vehicle climbing quickly toward $108$ — are allowed to inform it. And $\mathbf{P}_1^s \approx \operatorname{diag}(1.003, 1.037)$ is smaller than $\mathbf{P}_1^+ \approx \operatorname{diag}(2.003, 1.049)$ in both entries, the Loewner-order improvement just derived, confirmed in three steps small enough to trace by hand.
:::

::: example A hundred-step run, filtered and smoothed
Run the altitude filter forward for $N=100$ steps, store $\hat{\mathbf{x}}_k^+, \mathbf{P}_k^+, \hat{\mathbf{x}}_k^-, \mathbf{P}_k^-$ at every step, then run the RTS backward pass:

| $k$ | $\sigma_{\mathrm{filt}}$ (m) | $\sigma_{\mathrm{smooth}}$ (m) | error, filtered (m) | error, smoothed (m) |
| --- | --- | --- | --- | --- |
| $1$ | $1.961$ | $0.739$ | $1.956$ | $-0.016$ |
| $10$ | $1.107$ | $0.437$ | $-1.684$ | $0.340$ |
| $50$ | $0.746$ | $0.387$ | $-1.088$ | $-0.203$ |
| $99$ | $0.745$ | $0.692$ | $0.489$ | $0.931$ |
| $100$ | $0.745$ | $0.745$ | $1.027$ | $1.027$ |

At $k=100$ the two columns are identical to every digit computed — the boundary condition, confirmed rather than assumed. At $k=1$, $\sigma$ falls from $1.961\,\mathrm{m}$ to $0.739\,\mathrm{m}$, and the actual error falls from $1.956\,\mathrm{m}$ to $-0.016\,\mathrm{m}$ — a state estimated with almost no data at the time is corrected dramatically once the rest of the run is available to inform it. Over the whole run, RMS position error falls from $0.857\,\mathrm{m}$ filtered to $0.452\,\mathrm{m}$ smoothed, a $47\%$ reduction; RMS **velocity** error — a state never measured directly at all — falls from $3.13\,\mathrm{m/s}$ to $0.53\,\mathrm{m/s}$, an $83\%$ reduction, because a velocity the filter could only ever infer indirectly is, after the fact, pinned down by every position measurement in the entire run rather than only the ones that had already arrived.
:::

::: warning Smoothing improves the estimate; it does not create real-time information
Every number in the table above depends on measurements that had not yet happened at the time being estimated — $\hat{\mathbf{x}}_1^s$ used $\mathbf{z}_2$ through $\mathbf{z}_{100}$. This is exactly why a smoother cannot run onboard a vehicle making real-time decisions: there is no way to "use the future" before it arrives. Its home is post-processing — reconstructing a trajectory after a test flight, refining an orbit solution from a completed tracking arc, producing the reference trajectory a calibration or comparison study needs — anywhere the data collection has already finished and only the estimate is still being computed.
:::

## Check yourself

::: check
Explain, in one sentence, why $\hat{\mathbf{x}}_N^s = \hat{\mathbf{x}}_N^+$ exactly, with no approximation involved.
:::

::: answer
$\hat{\mathbf{x}}_N^s$ is defined as $\mathbb{E}[\mathbf{x}_N \mid \mathbf{z}_{1:N}]$, and $\hat{\mathbf{x}}_N^+$ is defined identically — both condition on exactly the same data, $\mathbf{z}_1$ through $\mathbf{z}_N$, because there is no $\mathbf{z}_{N+1}$ or beyond in a run of length $N$; smoothing only ever adds *future* data to what the filter already used, and at the last sample there is none left to add.
:::

::: check
Where, precisely, does the derivation use the Markov property of the state process, and what would break if the process noise $\mathbf{w}_k$ were not white?
:::

::: answer
It is used to justify $p(\mathbf{x}_k\mid\mathbf{x}_{k+1},\mathbf{z}_{1:N}) = p(\mathbf{x}_k\mid\mathbf{x}_{k+1},\mathbf{z}_{1:k})$ — that conditioning on $\mathbf{x}_{k+1}$ screens off every measurement that came after it. If $\mathbf{w}_k$ were not white, the process would not be Markov: $\mathbf{x}_{k+1}$ would no longer summarize everything about the state's evolution, some memory of earlier disturbances would persist independently, and future measurements could carry information about $\mathbf{x}_k$ that is *not* fully captured by $\mathbf{x}_{k+1}$ alone — the conditional-independence step, and with it the entire single backward recursion, would no longer hold, and a correct smoother would need to condition on more than just the adjacent state.
:::

::: check
$\mathbf{C}_k$ requires $\mathbf{P}_{k+1}^-$, not $\mathbf{P}_{k+1}^+$. Explain why the *predicted*, not the *updated*, covariance is the correct one to invert.
:::

::: answer
$\mathbf{C}_k$ comes from conditioning the joint distribution of $(\mathbf{x}_k,\mathbf{x}_{k+1})$ *given data through step $k$ only* — before $\mathbf{z}_{k+1}$ has been used at all — since that is the joint distribution the forward filter has actually computed at the moment it produced $\hat{\mathbf{x}}_k^+$ and predicted forward. The variance of $\mathbf{x}_{k+1}$ in that specific joint distribution is $\mathbf{P}_{k+1}^-$, the predicted covariance, by definition; $\mathbf{P}_{k+1}^+$ already incorporates $\mathbf{z}_{k+1}$, which is not yet part of the conditioning this particular step of the derivation is built on.
:::

::: check
A colleague suggests approximating the smoother by simply averaging $\hat{\mathbf{x}}_k^+$ with a second filter run *backward* in time, rather than computing $\mathbf{C}_k$ properly. What is likely to go wrong with an unweighted average?
:::

::: answer
An unweighted average treats the forward and backward estimates as equally informative at every step, but their relative uncertainty generally is not equal and varies with $k$ — near the start of the run, the forward filter is barely converged (large $\mathbf{P}_k^+$) while a backward filter running from the end has had the whole rest of the data to settle, and the reverse holds near the end. The RTS recursion's $\mathbf{C}_k$ weights the correction by exactly $\mathbf{P}_k^+(\mathbf{P}_{k+1}^-)^{-1}$, an information-based weighting that adapts automatically to how much each direction actually knows at that specific step; a fixed, unweighted average would systematically over-trust whichever direction happens to be less reliable at a given $k$, and would not, in general, reproduce the exact conditional mean the derivation computed.
:::

::: check
Why would running the RTS smoother on a filter that is already diverging (the previous two lessons' subject) fail to fix the underlying problem, even though the smoothed estimate is provably at least as good as the filtered one?
:::

::: answer
The smoother's guarantee, $\mathbf{P}_k^s \preceq \mathbf{P}_k^+$, is relative to the filter's *own* covariance, computed from the same (possibly wrong) $\mathbf{Q}$, $\mathbf{R}$, and dynamics model the forward pass used; it is a statement about extracting the most the data can offer *given that model*, not a check on whether the model is correct. A diverging filter's $\mathbf{P}_k^+$ is already a poor description of its actual error, and smoothing, built entirely from that same filter's stored $\hat{\mathbf{x}}^+, \mathbf{P}^+, \mathbf{P}^-$, inherits the same mis-calibration — it can only ever improve on a wrong answer by using more of the same wrong model's data, never diagnose that the model itself needs fixing, which remains the consistency-testing lesson's job.
:::

## Summary

| Item | Statement |
| --- | --- |
| Smoothed estimate | $\hat{\mathbf{x}}_k^s = \mathbb{E}[\mathbf{x}_k\mid\mathbf{z}_{1:N}]$, using the whole stored run, $N>k$; offline only |
| Key structural fact | $\mathbf{x}_k \perp \mathbf{z}_{k+1:N} \mid \mathbf{x}_{k+1}$, from the Markov property |
| Gain | $\mathbf{C}_k = \mathbf{P}_k^+\mathbf{F}^{\mathsf{T}}(\mathbf{P}_{k+1}^-)^{-1}$ |
| Backward recursion | $\hat{\mathbf{x}}_k^s = \hat{\mathbf{x}}_k^+ + \mathbf{C}_k(\hat{\mathbf{x}}_{k+1}^s-\hat{\mathbf{x}}_{k+1}^-)$, $\mathbf{P}_k^s = \mathbf{P}_k^+ + \mathbf{C}_k(\mathbf{P}_{k+1}^s-\mathbf{P}_{k+1}^-)\mathbf{C}_k^{\mathsf{T}}$ |
| Boundary | $\hat{\mathbf{x}}_N^s=\hat{\mathbf{x}}_N^+$, $\mathbf{P}_N^s=\mathbf{P}_N^+$ |
| Guarantee | $\mathbf{P}_k^s \preceq \mathbf{P}_k^+$ everywhere, by backward induction from the boundary; demonstrated $47\%$ RMS reduction in position, $83\%$ in the never-directly-measured velocity |

The smoother improved every estimate using data the filter already had, just not yet. The next lesson changes what the filter stores in the first place — propagating information directly rather than covariance — a form built for a different kind of abundance: not more time, but more sensors reporting at once.
