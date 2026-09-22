---
id: l08-when-a-particle-filter-is-required
title: When a particle filter is genuinely required
minutes: 20
covers:
  - 'When a particle filter is genuinely required: multi-modal and non-Gaussian posteriors'
---

Nothing in the last two modules' worth of filters — EKF, UKF, CKF — can represent two competing hypotheses at once. Each one collapses the posterior into exactly one mean and one covariance every cycle, no matter how the mean or covariance gets there. That is a real limitation, not a minor stylistic one, and this lesson pins down exactly when it stops being tolerable: when the true posterior is genuinely multi-modal or heavy-tailed enough that squeezing it into one Gaussian throws away information the filter needs, not merely accuracy it can spare. It also states, with a real computed number rather than a slogan, the one practical fact that keeps particle filters from replacing every Gaussian filter in this module: the number of particles a filter needs grows brutally fast with the dimension of the state it has to resolve.

## What "genuinely multi-modal" costs a Gaussian filter

Return to the terrain-matching problem the particle filter lesson used: two valleys, nearly identical near their centers, distinguishable only once the vehicle flies far enough to reach a small, valley-specific feature. Real terrain is essentially never perfectly flat in between two features the way that lesson's idealized profile was — add a gentle, physically ordinary slope that leans, everywhere along the track, a little toward whichever valley is nearer. This changes nothing about the ambiguity *near* either valley (the slope's effect there is tiny next to the valleys' own $80\,\mathrm m$ depth and the sensor's few meters of noise) — it only means a filter's estimate, wherever it starts, is not sitting on an exactly flat, gradient-free plateau.

::: example A single-Gaussian filter commits early, and is wrong about half the time
Run an ordinary EKF — one mean, one covariance, exactly the recipe this module opened with — on this terrain, starting each trial from a plausible-but-uncertain along-track position estimate (representing ordinary navigation error before the first terrain fix), across $200$ independent trials, half truly beginning near each valley. Within the first several measurements, the EKF's single Gaussian is pulled toward whichever valley happens to sit nearer its noisy starting guess, and its covariance shrinks around that choice — exactly the way a single-hypothesis filter has to behave, since it has no second component available to hold the alternative in reserve.

Of the $200$ trials, $76$ never settle confidently on either valley within the observation window — the filter's estimate lingers in the shallow region between them, informative on neither side. Of the $124$ that do commit clearly to one valley or the other, $64$ commit to the **wrong** one: a $52\%$ error rate among the filter's own confident conclusions, statistically indistinguishable from a coin flip. The filter's own reported covariance offers no warning of this — a confidently wrong run reports exactly as tight a covariance as a confidently right one, because nothing in a single Gaussian's own shape can express "this could also, with real probability, be the other valley instead."
:::

```python
import numpy as np

def terrain(s, width=0.6, eps=0.3):
    s = np.asarray(s, dtype=float)
    d1 = np.abs(s-6.0); d2 = np.abs(s-14.0); dmin = np.minimum(d1, d2)
    return 500.0 - 80.0*np.exp(-d1**2/(2*width**2)) - 80.0*np.exp(-d2**2/(2*width**2)) + eps*dmin**2

def dterrain_ds(s, h=1e-4):
    return (terrain(s+h)-terrain(s-h))/(2*h)

def run_trial(seed, s_true0, sigma_nav=3.0, N=70):
    rng = np.random.default_rng(seed)
    A0, v, dt, sigma_w, sigma_alt = 1500.0, 0.1, 1.0, 0.003, 2.0
    s_true = s_true0
    s_hat = s_true0 + rng.normal(0.0, sigma_nav)
    P = sigma_nav**2
    for k in range(N):
        s_true += v*dt
        z = A0 - terrain(np.array([s_true]))[0] + rng.normal(0, sigma_alt)
        s_hat += v*dt; P += sigma_w**2
        H = -dterrain_ds(np.array([s_hat]))[0]
        S = H*P*H + sigma_alt**2
        K = P*H/S if S > 1e-12 else 0.0
        s_hat += K*(z - (A0-terrain(np.array([s_hat]))[0]))
        P = max((1-K*H)*P, 1e-6)
    return s_hat

wrong = lost = 0
for i in range(200):
    true_valley = 6.3 if i % 2 == 0 else 14.3
    s_hat = run_trial(seed=7000+i, s_true0=true_valley)
    d1, d2 = abs(s_hat-(6.0+7.0)), abs(s_hat-(14.0+7.0))
    if min(d1, d2) > 1.5: lost += 1
    elif (d1 < d2) != (true_valley == 6.3): wrong += 1
print(wrong, 200-lost, lost)   # 64 124 76
```

## The curse of dimensionality

A particle filter's honesty about multi-modal posteriors comes with a bill, and the bill is due in the number of particles $N$ needed, which grows explosively with the dimension of the state a set of importance weights has to resolve. The mechanism is visible directly in the weight formula itself: suppose particles are proposed from a distribution that is *slightly* off the true posterior's location — off by half a standard deviation, say, in every one of $n$ independent dimensions. The importance weight correcting for this mismatch is a product of $n$ independent per-axis correction factors, and the **effective** sample size after weighting falls off correspondingly fast.

::: example Effective sample size against dimension, measured directly
Draw $20{,}000$ samples from a proposal $\mathcal N(\mathbf 0,\mathbf I_n)$, weight them by the importance ratio for a target $\mathcal N(\mathbf 0.5\mathbf 1,\mathbf I_n)$ — a fixed, modest, half-a-standard-deviation offset *per axis* — and compute $N_\text{eff}/N$ as $n$ grows:

| $n$ (dimensions) | mean $N_\text{eff}/N$ | mean $N_\text{eff}$ |
| --- | --- | --- |
| $1$ | $0.778$ | $15{,}568$ |
| $5$ | $0.292$ | $5{,}830$ |
| $10$ | $0.088$ | $1{,}766$ |
| $20$ | $0.017$ | $342$ |
| $30$ | $0.0054$ | $108$ |
| $50$ | $0.0012$ | $24$ |
| $80$ | $0.00057$ | $11$ |
| $120$ | $0.00028$ | $6$ |

Nothing about the *size* of the mismatch changed anywhere in this table — every axis carries exactly the same, modest, half-a-sigma offset the whole way across. What changed is only how many axes are being resolved simultaneously. Twenty thousand particles, comfortably large for a low-dimensional problem, are functionally down to about six or eleven *effective* samples by $n=80$–$120$: nearly all of the weight has piled onto a vanishingly small subset of the cloud, and the rest are, for practical purposes, dead weight being propagated and evaluated every cycle for nothing.
:::

```python
import numpy as np

rng = np.random.default_rng(21)
N, m, trials = 20000, 0.5, 20
for n in [1, 5, 10, 20, 30, 50, 80, 120]:
    ratios = []
    for _ in range(trials):
        x = rng.standard_normal((N, n))
        mu = np.full(n, m)
        logw = x @ mu - 0.5*np.dot(mu, mu)
        logw -= logw.max()
        w = np.exp(logw); w /= w.sum()
        ratios.append(1.0/np.sum(w**2))
    ess = np.mean(ratios)
    print(n, ess/N, ess)
# 1   0.7784  15568.5
# 5   0.2915   5830.1
# 10  0.0883   1765.7
# 20  0.0171    341.7
# 30  0.0054    108.1
# 50  0.0012     24.3
# 80  0.00057    11.5
# 120 0.00028     5.5
```

::: key The practical killer of particle filters
Particle count needed to maintain a given effective sample size grows explosively with the number of dimensions the weighting has to discriminate against, even for a fixed, modest per-axis mismatch. This is not a defect in any particular resampling or proposal scheme — it is a structural property of importance weighting itself in high dimensions, and it is why a full-state particle filter on a ten-or-more-dimensional navigation state is rarely a practical choice, however attractive its handling of multi-modality would otherwise be.
:::

The standard practical answer is not to abandon particle filtering on high-dimensional problems, but to narrow what the particles have to work for. **Rao-Blackwellization** splits the state into a small subset that is genuinely nonlinear, non-Gaussian, or ambiguous — the part that actually needs samples — and a remaining subset whose distribution, *conditioned on* each particle's value for the first subset, is exactly Gaussian and linear enough to be tracked analytically, with an ordinary (or extended, or unscented) Kalman filter running once per particle. In the terrain-matching problem, that split is almost exactly the structure already in play: along-track position, the genuinely ambiguous, low-dimensional quantity, is the natural candidate to keep as particles, while velocity, attitude, or other well-behaved states conditioned on a given along-track hypothesis can ride along in each particle's own small Kalman filter rather than needing their own dimensions of particle spread.

::: warning A particle filter's failure from too few particles does not announce itself
Nothing about the bootstrap recipe from the previous lesson checks whether $N$ is adequate for the problem's dimension — a badly under-provisioned filter still runs, still produces weights that sum to one, still reports an $N_\text{eff}$, and can look perfectly ordinary in code review. The only way to know whether $N$ is enough is the kind of direct measurement this lesson made: compute $N_\text{eff}$ (or a closer surrogate for the dimensions that actually matter) and check it against $N$, on the actual problem, not against a rule of thumb borrowed from a lower-dimensional one.
:::

::: warning Multi-modality alone does not automatically justify the dimensionality cost
The terrain example's ambiguity lived in exactly one dimension — along-track position — which is precisely why a particle filter was a comfortable, cheap choice for it. A problem that is both genuinely multi-modal *and* high-dimensional in the part that is ambiguous is the hard case this lesson's two examples, taken together, actually warn about: needing particles for the right reason (real multi-modality) does not exempt a design from the wrong-reason cost (dimensionality) if the ambiguous part of the state is not kept small.
:::

## Check yourself

::: check
In the single-Gaussian EKF example, $76$ of $200$ trials never confidently committed to either valley. Is this a third failure mode distinct from "confidently right" and "confidently wrong," or is it evidence the filter is behaving more honestly there?
:::

::: answer
It is a genuinely distinct outcome, and on its own it is closer to honest than either confident outcome, since it reflects the filter's covariance staying wide rather than collapsing around an unjustified choice. It is not, however, a solution to the underlying problem: a filter sitting indefinitely undecided is still failing to extract the information the terrain eventually provides, and nothing about a single Gaussian lets it hold two sharp, well-separated hypotheses open simultaneously the way the particle filter's weighted cloud did in the previous lesson's identical-in-spirit scenario.
:::

::: check
Explain why the effective-sample-size table shows collapse even though every dimension carries the identical, modest half-sigma mismatch — nothing in any single axis got harder as $n$ grew.
:::

::: answer
The importance weight for an $n$-dimensional mismatch is a product of $n$ independent per-axis correction factors, so the overall weight's variability compounds multiplicatively across dimensions even though each individual factor is mild; a "not too surprising" per-axis likelihood ratio, raised to a large power by having many independent axes each contribute one, produces an overall weight distribution far more skewed than any single axis would suggest, and effective sample size falls accordingly, purely as a consequence of dimension count rather than of any one axis becoming harder.
:::

::: check
A team proposes running a full-state, twelve-dimensional bootstrap particle filter for a spacecraft's combined position, velocity, and attitude estimation problem, citing this module's demonstration that particle filters handle multi-modal terrain matching well. What single number from this lesson would you ask them to check first?
:::

::: answer
The effective sample size the particle count they plan to use would actually achieve at twelve dimensions, measured the way this lesson measured it — not assumed from the terrain example's success, which lived in one dimension. The dimensionality table showed $N_\text{eff}/N$ already down to about $1.7\%$ by twenty dimensions for a comparatively mild mismatch; a naively-sized particle count that felt generous for the one-dimensional terrain problem could easily be providing only a handful of effective samples for a twelve-dimensional state, which is precisely the situation Rao-Blackwellization exists to avoid.
:::

::: check
How does Rao-Blackwellization change what the "dimension" in the curse-of-dimensionality argument actually refers to, for a filter that uses it?
:::

::: answer
It shrinks the dimension the particle weighting has to discriminate against down to only the genuinely ambiguous or strongly nonlinear subset of the state, while the remaining, well-behaved states are tracked by an analytic (Kalman-family) filter conditioned on each particle rather than by additional particle dimensions at all. The curse-of-dimensionality argument still applies in full force to whatever dimension is left in the particle part — Rao-Blackwellization does not repeal it, it reduces the number the argument has to be applied to.
:::

::: check
Suppose the terrain-matching EKF example were changed so both valleys had noticeably different depths (say $80\,\mathrm m$ and $50\,\mathrm m$) rather than nearly identical ones. Would you expect the $52\%$ wrong-commitment rate to persist?
:::

::: answer
No — a measurable depth difference gives even a single altimeter reading near either valley some genuine power to distinguish which one produced it, since the two hypotheses would no longer predict nearly the same height. The $52\%$, coin-flip-like error rate in this lesson's example was a direct consequence of the two valleys being deliberately built to look identical near their centers; make them genuinely distinguishable and even a single-Gaussian filter should start committing correctly more often than not, though it would still be structurally unable to represent the *transition period* — while the data is ambiguous but not yet decisive — as honestly as the particle filter's weighted cloud does.
:::

## Summary

| Item | Statement |
| --- | --- |
| Genuine multi-modality | Terrain-matching EKF (one Gaussian): $76/200$ trials never confidently committed; of the $124$ that did, $64$ ($52\%$) committed to the wrong hypothesis, with no warning in the reported covariance |
| Curse of dimensionality | $N_\text{eff}/N$ measured directly against dimension, fixed per-axis mismatch: $0.778$ at $n=1$, falling to $0.00028$ by $n=120$ — a purely dimension-driven collapse |
| The practical killer | Particle count needed grows explosively with the dimension the weighting must resolve, independent of how mild any single axis's mismatch is |
| Standard remedy | Rao-Blackwellize: keep particles only for the genuinely ambiguous, low-dimensional subset of the state; track the rest analytically, conditioned on each particle |
| When a particle filter is the right call | The posterior is genuinely multi-modal or strongly non-Gaussian **and** the ambiguous part of the state is low-dimensional — both conditions, not either alone |

Two Gaussian-mixture-flavored ideas remain before this module turns to error-state and attitude-specific filtering: the next lesson asks what happens if, instead of committing to one Gaussian or scattering thousands of particles, a filter keeps a small, fixed number of Gaussians running in parallel — enough to represent a handful of genuine hypotheses, at a cost far below a full particle cloud.
