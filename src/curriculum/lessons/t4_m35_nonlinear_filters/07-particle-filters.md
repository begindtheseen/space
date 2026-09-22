---
id: l07-particle-filters
title: Particle filters — sequential importance sampling and resampling
minutes: 23
covers:
  - 'Particle filters: sequential importance sampling, resampling, degeneracy and sample impoverishment'
---

Every filter built so far in this module — EKF, UKF, CKF — keeps the same underlying commitment: the posterior is one Gaussian, and the only question is how carefully that Gaussian gets pushed through a nonlinear function. A **particle filter** drops that commitment entirely. It represents the posterior not as a mean and a covariance but as a weighted cloud of samples, each one a complete, concrete hypothesis about the state — "the target might be exactly here, with this much relative belief" — and lets that cloud take on whatever shape the true posterior actually has: skewed, multi-modal, with heavy tails, anything at all. In the limit of infinitely many particles, this representation converges to the true posterior with no linearization, no Gaussian assumption, and no Jacobian anywhere in the algorithm.

That generality is not free, and this lesson is built to show precisely what it costs as much as what it buys. A particle filter's weights can — and, left unmanaged, reliably will — collapse onto a single particle after enough cycles, a failure called **degeneracy**; the standard fix, resampling, introduces its own failure, **sample impoverishment**, if used carelessly. Both are demonstrated here with a real, running particle filter and honest counts, not analogies.

## Sequential importance sampling

Represent the posterior at time $k$ by $N$ weighted particles, $\{\mathbf x_k^{(i)},w_k^{(i)}\}_{i=1}^N$, with $\sum_i w_k^{(i)}=1$, standing in for the distribution $p(\mathbf x_k\mid\mathbf z_{1:k})\approx\sum_i w_k^{(i)}\delta(\mathbf x_k-\mathbf x_k^{(i)})$. The simplest and most common variant — the **bootstrap particle filter** — propagates every particle through the true dynamics with an independently sampled noise draw, then reweights by how well each particle's prediction matches the new measurement:

::: key The bootstrap particle filter, one cycle
$$
\mathbf x_k^{(i)} = \mathbf f\big(\mathbf x_{k-1}^{(i)}\big) + \mathbf w^{(i)}, \qquad \mathbf w^{(i)}\sim p(\mathbf w), \qquad w_k^{(i)} \propto w_{k-1}^{(i)}\cdot p\big(\mathbf z_k\mid \mathbf x_k^{(i)}\big),
$$
followed by normalizing $w_k^{(i)}$ so the weights sum to one. Both $\mathbf f$ and the measurement likelihood $p(\mathbf z_k\mid\mathbf x_k^{(i)})$ are the true, unmodified functions — nothing here is linearized, and $p(\mathbf z_k\mid\mathbf x_k^{(i)})$ need not even be Gaussian.
:::

Every particle is propagated through the *actual* nonlinear $\mathbf f$, with its own independent noise realization — there is no linearized covariance to propagate at all, because there is no single Gaussian to describe. Each particle's new weight measures how consistent that particle's own predicted measurement is with what was actually observed; particles whose predictions land far from $\mathbf z_k$ lose weight, particles that land close gain it, relative to the other particles in the cloud. Summed and normalized across all $N$ particles, the weighted cloud is the filter's entire representation of the posterior — its mean, if wanted, is just $\sum_i w_k^{(i)}\mathbf x_k^{(i)}$, but the cloud itself carries far more information than that one summary number, which is the entire point.

::: example A particle filter resolving a genuinely ambiguous position
A vehicle flies at a known, roughly constant altitude and airspeed along a track with a radar altimeter reading height above ground. The terrain has two valleys of nearly identical shape and depth, $80\,\mathrm m$ deep, centered $8\,\mathrm{km}$ apart, so a single altimeter reading taken near either valley is genuinely ambiguous about which one produced it. The vehicle's true along-track position starts inside the first valley's basin; $2000$ particles are seeded uniformly across a $14\,\mathrm{km}$ window spanning both valleys, with no prior bias toward either.

| $t\,(\mathrm s)$ | weight on valley $1$ (true) | weight on valley $2$ | $\mathrm{ESS}$ |
| --- | --- | --- | --- |
| $1$ | $0.379$ | $0.621$ | $70.8$ |
| $5$ | $0.314$ | $0.686$ | $1277.7$ |
| $10$ | $0.248$ | $0.752$ | $1986.7$ |
| $15$ | $0.404$ | $0.596$ | $1592.0$ |
| $20$ | $1.000$ | $0.000$ | $1885.9$ |
| $30$ | $1.000$ | $0.000$ | $1244.5$ |

For the first fifteen seconds, weight is spread across both hypotheses — at $t=10\,\mathrm s$ the filter actually favors the *wrong* valley, $75\%$ to $25\%$, which is exactly the honest behavior a genuinely ambiguous measurement should produce, not a bug. A small feature in the terrain unique to the true valley's side (absent near the other valley) breaks the tie once the vehicle has flown far enough to reach it: by $t=20\,\mathrm s$ every particle consistent with the wrong valley has been weighted essentially to zero, and the filter has correctly resolved which valley it was in without ever having been forced, the way a single-Gaussian filter would be, to commit to one hypothesis before the data justified it. (This run resamples whenever $N_\text{eff}$ falls below $N/2$ — the standard practice the rest of this lesson explains — which is why $N_\text{eff}$ never collapses toward $1$ even while the cloud is genuinely representing two live hypotheses.)
:::

```python
import numpy as np

def terrain(s):
    s = np.asarray(s, dtype=float)
    dmin = np.minimum(np.abs(s-6.0), np.abs(s-14.0))
    return 500.0 - 80.0*np.exp(-(dmin**2)/(2*0.6**2)) + 15.0*np.exp(-((s-8.5)**2)/(2*0.4**2))

def systematic_resample(w, u):
    N = len(w); positions = (np.arange(N)+u)/N
    cumsum = np.cumsum(w); cumsum[-1] = 1.0
    return np.searchsorted(cumsum, positions)

rng = np.random.default_rng(11)
N, A0, v, dt = 2000, 1000.0, 0.1, 1.0
sigma_w, sigma_alt = 0.003, 2.0
s_true = 6.3
particles = rng.uniform(3.0, 17.0, N)
weights = np.full(N, 1.0/N)
for k in range(70):
    t = (k+1)*dt
    s_true += v*dt
    z = A0 - terrain(np.array([s_true]))[0] + rng.normal(0, sigma_alt)
    particles = particles + v*dt + rng.normal(0, sigma_w, N)
    resid = z - (A0 - terrain(particles))
    w_unnorm = np.exp(-0.5*(resid/sigma_alt)**2) * weights
    weights = w_unnorm/np.sum(w_unnorm)
    ess = 1.0/np.sum(weights**2)
    ref1, ref2 = 6.0+v*t, 14.0+v*t
    near1 = np.abs(particles-ref1) < np.abs(particles-ref2)
    if t in (1, 5, 10, 15, 20, 30):
        print(t, weights[near1].sum(), weights[~near1].sum(), ess)
    if ess < N/2:                       # resample only when needed -- see below
        idx = systematic_resample(weights, rng.uniform())
        particles = particles[idx]
        weights = np.full(N, 1.0/N)
# 1  0.3786 0.6214  70.8
# 5  0.3140 0.6860  1277.7
# 10 0.2480 0.7520  1986.7
# 15 0.4037 0.5963  1592.0
# 20 1.0000 0.0000  1885.9
# 30 1.0000 0.0000  1244.5
```

## Degeneracy and effective sample size

Even when a particle filter is working correctly, its weights do not stay uniform. Every cycle multiplies each particle's weight by that particle's own measurement likelihood, and over enough cycles the *product* of many likelihoods inevitably concentrates on whichever few particles happened to track the true trajectory best — this is not a bug, it is what a correctly-computed posterior weight is supposed to do, but carried to its extreme it leaves almost the entire weight on a single particle, called **degeneracy**: the other $N-1$ particles are still being propagated and evaluated every cycle, for essentially zero return, since they contribute almost nothing to any expectation computed from the cloud.

::: key Effective sample size
$$
N_{\text{eff}} = \frac{1}{\sum_{i=1}^N \big(w^{(i)}\big)^2}, \qquad w^{(i)}\text{ normalized so }\textstyle\sum_i w^{(i)}=1.
$$
$N_{\text{eff}}=N$ exactly when every weight is equal ($1/N$); $N_{\text{eff}}=1$ exactly when a single particle carries all the weight, regardless of how many particles are nominally in the cloud. $N_{\text{eff}}$ depends only on the *shape* of the weight distribution, not its overall scale — multiplying every unnormalized weight by the same constant leaves it unchanged.
:::

$N_\text{eff}$ falling well below $N$ is the standard, quantitative signal of degeneracy — in the terrain example, it fell to $70.8$ (from an initial $2000$) after just the first measurement, reflecting how strongly that first altimeter reading already discriminated between plausible and implausible positions. The fix is **resampling**: draw a new set of $N$ particles from the current weighted cloud, with particles carrying more weight more likely to be drawn (possibly several times), and reset every weight to $1/N$. This does not create new information — it redistributes the computational effort of the next cycle toward the particles that currently matter, and discards effort on the particles that do not.

## Resampling and its own failure mode

Resampling looks, at first, like an unambiguous improvement: weights are equal again, $N_\text{eff}$ is reset to $N$, degeneracy is gone. Applied every single cycle, though, it introduces a different problem. Every resampling step is a genealogical bottleneck: a particle with below-average weight is likely to vanish from the population entirely, replaced by copies of its higher-weight neighbors. Do this often enough with too little added diversity between resamples, and the population's genuine diversity — the number of *distinct* ancestral values still represented — collapses, even while the reported $N_\text{eff}$ looks perfectly healthy immediately after each resample. This is **sample impoverishment**, and it is dangerous precisely because the standard diagnostic for degeneracy does not catch it.

::: example Impoverishment, counted directly
Estimate a fixed, unknown range $r=500\,\mathrm m$ from repeated noisy measurements, $\sigma_z=5\,\mathrm m$, with $500$ particles and **systematic resampling every single cycle**, no added jitter. Track the number of *distinct* particle values surviving, not merely $N_\text{eff}$:

| cycle | $N_\text{eff}$ just before resampling | distinct particle values remaining |
| --- | --- | --- |
| $0$ | $158.9$ | $202$ |
| $8$ | $389.5$ | $69$ |
| $16$ | $454.8$ | $51$ |
| $24$ | $481.0$ | $41$ |
| $32$ | $379.0$ | $36$ |
| $39$ | $497.7$ | $35$ |

$N_\text{eff}$ just before each resample stays in a perfectly reasonable range throughout — never collapsing toward $1$ the way true degeneracy would show it — because each cycle only applies *one* likelihood update to an already-equal-weight population, which rarely peaks sharply enough to look degenerate on its own. Meanwhile the population's actual diversity is bleeding out underneath that healthy-looking number: from $500$ initial particles down to $35$ surviving distinct ancestral values after forty cycles, entirely invisible to $N_\text{eff}$ because $N_\text{eff}$ is recomputed fresh from equal weights every time and has no memory of which particles are, underneath, exact copies of one another. Adding a small amount of independent jitter after each resample — **roughening**, $0.4\,\mathrm m$ standard deviation here — is a complete fix on this problem: with roughening, all $500$ values remain distinct at every one of the same forty cycles.
:::

```python
import numpy as np

def effective_sample_size(w):
    w = w/np.sum(w); return 1.0/np.sum(w**2)

def systematic_resample(w, u):
    N = len(w); positions = (np.arange(N)+u)/N
    cumsum = np.cumsum(w); cumsum[-1] = 1.0
    return np.searchsorted(cumsum, positions)

rng = np.random.default_rng(5)
r_true, sigma_z, N = 500.0, 5.0, 500
particles = rng.normal(490.0, 20.0, N)
weights = np.full(N, 1.0/N)
for k in range(40):
    z = r_true + rng.normal(0, sigma_z)
    w_unnorm = np.exp(-0.5*((z-particles)/sigma_z)**2) * weights
    weights = w_unnorm/np.sum(w_unnorm)
    ess = effective_sample_size(weights)
    idx = systematic_resample(weights, rng.uniform())
    particles = particles[idx]
    weights = np.full(N, 1.0/N)
    n_unique = len(np.unique(np.round(particles, 9)))
    if k in (0, 8, 16, 24, 32, 39):
        print(k, ess, n_unique)
# 0  158.9  202
# 8  389.5   69
# 16 454.8   51
# 24 481.0   41
# 32 379.0   36
# 39 497.7   35
```

::: key The standard compromise
Resample only when $N_\text{eff}$ drops below a threshold, commonly $N/2$, rather than every cycle — this keeps degeneracy from ever becoming severe while resampling far less often than "always," which is most of what impoverishment needs to become a problem. Add a small amount of roughening after every resample regardless, since even threshold-triggered resampling is still a genealogical bottleneck each time it fires.
:::

::: warning "Effective sample size looks fine" does not mean the particle population is healthy
The impoverishment example's $N_\text{eff}$ never dropped below about $150$ out of $500$ at any point across forty aggressive resamples — by the usual degeneracy threshold, this filter never looked troubled for a moment. The distinct-value count tells a completely different story. Any diagnostic built only from the current weights, checked only immediately after a resample, is structurally blind to impoverishment, because resampling resets weights to uniform regardless of how few distinct ancestors those uniform weights are now describing.
:::

::: warning A particle filter with too few particles for the state dimension will not announce itself as broken
Nothing in the bootstrap recipe checks whether $N$ is large enough for the problem's dimensionality — the algorithm runs, produces weights, resamples, and reports an $N_\text{eff}$ regardless of whether the cloud is actually covering the relevant part of state space at all. The next lesson in this module makes this concern precise and quantifies it directly, because it is the single practical limitation that decides whether a particle filter is a reasonable engineering choice for a given problem.
:::

## Check yourself

::: check
In the bootstrap particle filter's weight update, which parts of the algorithm involve any linearization of $\mathbf f$ or of the measurement model?
:::

::: answer
None. Every particle is propagated through the true, unmodified $\mathbf f$ with its own sampled noise realization, and every weight is computed from the true measurement likelihood $p(\mathbf z_k\mid\mathbf x_k^{(i)})$ evaluated at that particle's actual predicted measurement — no Jacobian, no Taylor expansion, and no assumption that the likelihood is Gaussian appears anywhere in the recipe.
:::

::: check
At $t=10\,\mathrm s$ in the terrain example, the particle filter assigned more weight to the wrong valley than the correct one. Was this a filter error?
:::

::: answer
No — it is the correct, honest response to genuinely ambiguous data. At that point the vehicle had not yet reached the terrain feature that distinguishes the two valleys, so an altimeter reading consistent with either basin really does slightly favor whichever one the specific noise realization happened to match better; a filter that instead locked onto one hypothesis early, before the data justified it, would be the one making an error. The weight shifting correctly to the true valley once the distinguishing feature was reached, rather than staying stuck on the early, noise-driven favorite, is exactly the behavior that shows the filter working as intended.
:::

::: check
Explain precisely why $N_\text{eff}$ is unaffected by multiplying every particle's unnormalized weight by the same constant.
:::

::: answer
$N_\text{eff}=1/\sum_i(w^{(i)})^2$ is defined on the *normalized* weights, and normalizing divides out any common scale factor before the sum of squares is computed: if every unnormalized weight is scaled by $c$, the normalization step $w^{(i)}=cw^{(i)}_{\text{raw}}/\sum_j cw^{(j)}_{\text{raw}}$ cancels the $c$ exactly, leaving identical normalized weights and therefore an identical $N_\text{eff}$ — the quantity depends only on the relative shape of the weight distribution, never on its absolute scale.
:::

::: check
A colleague suggests resampling every cycle is the "safest" choice because it guarantees $N_\text{eff}=N$ immediately afterward, at every step. What is wrong with using this reasoning alone to justify the choice?
:::

::: answer
$N_\text{eff}=N$ immediately after any resample is true by construction — every weight is reset to $1/N$ — so it says nothing at all about whether the resampled particles still represent a genuinely diverse population or are increasingly copies of a shrinking set of ancestors. The impoverishment example showed exactly this: resampling every cycle kept $N_\text{eff}$ looking healthy throughout while the distinct-value count collapsed from $500$ to $35$, which is precisely the failure "resample every cycle to be safe" causes rather than prevents.
:::

::: check
Suppose roughening is added, but its standard deviation is chosen far too large relative to the actual measurement precision. What would you expect to happen to the filter's accuracy, even though impoverishment itself would no longer be a problem?
:::

::: answer
Roughening adds noise to the particle values independent of what the data actually supports, so choosing its scale far larger than the measurement precision would spread the particles out well beyond where the true posterior actually concentrates, degrading the filter's accuracy and inflating its effective uncertainty even though the *diversity* problem (impoverishment) would indeed be solved. Roughening's scale is a real tuning choice with a genuine trade-off — too little and impoverishment returns, too much and the filter's own added noise starts to dominate the very information the measurements were supposed to provide — not a parameter with an obviously safe, large default.
:::

## Summary

| Item | Statement |
| --- | --- |
| Bootstrap particle filter | Propagate every particle through the true $\mathbf f$ with sampled noise; reweight by the true measurement likelihood $p(\mathbf z_k\mid\mathbf x_k^{(i)})$; no linearization anywhere |
| Effective sample size | $N_\text{eff}=1/\sum_i(w^{(i)})^2$; falls toward $1$ as weight concentrates on few particles (degeneracy), independent of the weights' overall scale |
| Resampling | Draw a new population weighted toward high-weight particles, reset weights to $1/N$; fixes degeneracy, but each application is a genealogical bottleneck |
| Sample impoverishment | Resampling too often, with too little added diversity, collapses the number of *distinct* surviving particle values — invisible to $N_\text{eff}$, which resets to a healthy value at every resample regardless |
| Standard practice | Resample only when $N_\text{eff}$ falls below a threshold (often $N/2$), and add roughening after every resample that does fire |
| Demonstrated | Terrain example: genuine early ambiguity ($30\%$–$70\%$ split), correctly resolved once distinguishing data arrived. Impoverishment example: $500\to35$ distinct values over $40$ unconditional resamples with no roughening; $500\to500$ with it |

This lesson showed a particle filter succeeding at a problem a single-Gaussian filter is structurally unable to represent honestly. The next lesson makes precise exactly when that gap is worth the cost — and names the specific, practical limitation that keeps particle filters from simply replacing the EKF and UKF everywhere.
