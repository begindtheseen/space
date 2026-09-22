---
id: l09-gaussian-sum-filters
title: Gaussian sum filters
minutes: 17
covers:
  - Gaussian sum filters
---

Between "one Gaussian" and "thousands of weighted samples" sits a middle option the last two lessons skipped past: a **small, fixed** number of Gaussians, run in parallel, each one a complete hypothesis about the state, mixed together by weights that update the same way a particle filter's do. A **Gaussian sum filter (GSF)** is exactly this — a bank of ordinary Kalman-family filters (EKF, UKF, whichever nonlinearity handling fits), each tracking its own mean and covariance, combined into one posterior $p(\mathbf x_k\mid\mathbf z_{1:k})\approx\sum_{j=1}^M \pi_k^{(j)}\,\mathcal N\big(\mathbf x_k;\hat{\mathbf x}_k^{(j)},\mathbf P_k^{(j)}\big)$. When the number of genuinely distinct hypotheses a problem can produce is small and known in advance, this can resolve exactly the kind of ambiguity a single-Gaussian filter cannot, at a cost far below a full particle cloud.

## The recipe

Each component propagates and updates exactly as an ordinary EKF or UKF would, entirely independently of the other components — component $j$ never sees component $i$'s state. What ties the bank together is the **mixture weight**, updated by how well each component's own predicted measurement matches what was actually observed:

::: key Gaussian sum filter update
For each component $j=1,\ldots,M$, run an ordinary Kalman-family predict and update using $\hat{\mathbf x}_{k-1}^{(j)},\mathbf P_{k-1}^{(j)}$, producing $\hat{\mathbf x}_k^{(j)},\mathbf P_k^{(j)}$ and its own innovation covariance $\mathbf S_k^{(j)}$ and innovation $\boldsymbol\nu_k^{(j)}$. Update the mixture weights by
$$
\pi_k^{(j)} \propto \pi_{k-1}^{(j)}\cdot\mathcal N\big(\boldsymbol\nu_k^{(j)};\mathbf 0,\mathbf S_k^{(j)}\big), \qquad \sum_j\pi_k^{(j)}=1.
$$
The combined posterior is the weighted mixture itself, $\sum_j\pi_k^{(j)}\mathcal N(\hat{\mathbf x}_k^{(j)},\mathbf P_k^{(j)})$ — not, in general, a single Gaussian.
:::

This is the particle filter's weight-update logic, at $M=2$ or $M=5$ instead of $N=2000$ or $N=50{,}000$, with one structural difference that matters: a particle's weight update uses only the *likelihood* of that one sample, while a GSF component's weight update uses the likelihood evaluated under that *component's own predicted Gaussian spread*, $\mathcal N(\boldsymbol\nu_k^{(j)};\mathbf 0,\mathbf S_k^{(j)})$ — each component is a small filter in its own right, not a single point.

::: example Two components resolve the same ambiguity a particle cloud did
Return to the terrain-matching scenario the particle filter lesson used — two valleys, nearly identical near their centers, distinguished only by a feature reached later in the flight. Replace the particle cloud with exactly two components, one initialized at each valley, $\pi_0=(0.5,0.5)$:

| $t\,(\mathrm s)$ | $\pi^{(1)}$ (true valley) | $\pi^{(2)}$ | $\hat x^{(1)}$ | $\hat x^{(2)}$ |
| --- | --- | --- | --- | --- |
| $1$ | $0.499999$ | $0.500001$ | $6.399$ | $14.399$ |
| $5$ | $0.500150$ | $0.499850$ | $6.791$ | $14.791$ |
| $10$ | $0.533136$ | $0.466864$ | $7.296$ | $15.296$ |
| $15$ | $0.915172$ | $0.084828$ | $7.794$ | $15.796$ |
| $20$ | $1.000000$ | $0.000000$ | $8.292$ | $16.298$ |
| $30$ | $1.000000$ | $0.000000$ | $9.280$ | $17.298$ |

The weight trajectory is the same qualitative story the particle filter told — genuine early ambiguity ($t=1$: essentially $50/50$), resolving decisively once the distinguishing feature is reached ($\pi^{(1)}\to1$ by $t=20$) — reached here with **two** Kalman filters running in parallel rather than two thousand particles, because the problem genuinely only has two competing hypotheses, known in advance, and each one is well described locally by a single Gaussian.
:::

```python
import numpy as np

def terrain(s):
    s = np.asarray(s, dtype=float)
    dmin = np.minimum(np.abs(s-6.0), np.abs(s-14.0))
    return 500.0 - 80.0*np.exp(-(dmin**2)/(2*0.6**2)) + 15.0*np.exp(-((s-8.5)**2)/(2*0.4**2))

def dterrain_ds(s, h=1e-4):
    return (terrain(s+h)-terrain(s-h))/(2*h)

rng = np.random.default_rng(11)
A0, v, dt, sigma_w, sigma_alt = 1000.0, 0.1, 1.0, 0.003, 2.0
s_true = 6.3
means = np.array([6.3, 14.3]); covs = np.array([0.5**2, 0.5**2]); w = np.array([0.5, 0.5])
for k in range(70):
    s_true += v*dt
    z = A0 - terrain(np.array([s_true]))[0] + rng.normal(0, sigma_alt)
    means = means + v*dt; covs = covs + sigma_w**2
    lik = np.zeros(2)
    for i in range(2):
        H = -dterrain_ds(np.array([means[i]]))[0]
        pred_z = A0 - terrain(np.array([means[i]]))[0]
        S = H*covs[i]*H + sigma_alt**2
        lik[i] = np.exp(-0.5*(z-pred_z)**2/S)/np.sqrt(2*np.pi*S)
        K = covs[i]*H/S
        means[i] += K*(z-pred_z); covs[i] = (1-K*H)*covs[i]
    w = w*lik; w = w/np.sum(w)
    if (k+1) in (1, 5, 10, 15, 20, 30):
        print(k+1, w[0], w[1], means[0], means[1])
# 1  0.499999 0.500001  6.399 14.399
# 5  0.500150 0.499850  6.791 14.791
# 10 0.533136 0.466864  7.296 15.296
# 15 0.915172 0.084828  7.794 15.796
# 20 1.000000 0.000000  8.292 16.298
# 30 1.000000 0.000000  9.280 17.298
```

## Why not just collapse it to one Gaussian?

If a single downstream number is needed — an autopilot that wants one position, not a weighted pair — the obvious move is moment-matching: replace the mixture with the one Gaussian that has the same mean and covariance,
$$
\hat{\mathbf x}\approx\sum_j\pi^{(j)}\hat{\mathbf x}^{(j)}, \qquad \mathbf P\approx\sum_j\pi^{(j)}\Big(\mathbf P^{(j)}+\big(\hat{\mathbf x}^{(j)}-\hat{\mathbf x}\big)\big(\hat{\mathbf x}^{(j)}-\hat{\mathbf x}\big)^{\mathsf T}\Big).
$$
This is a real Gaussian with the mixture's exact first two moments — and, whenever the components are still meaningfully separated, a poor summary of what the mixture actually says.

::: example The collapse, at the moment it matters most
At $t=15\,\mathrm s$ in the worked example, component $1$ (soon to be confirmed correct) sits at $7.794\,\mathrm{km}$ with weight $0.915$; component $2$ sits at $15.796\,\mathrm{km}$ with weight $0.085$. Moment-matching the two into one Gaussian gives mean $8.473\,\mathrm{km}$, standard deviation $2.230\,\mathrm{km}$: a single number sitting $0.68\,\mathrm{km}$ from the dominant, soon-to-be-vindicated hypothesis, with an inflated spread that does not honestly describe either component's own (much tighter) local uncertainty — it describes neither, because it is the description of a bimodal distribution's first two moments only, not its shape. Five seconds later, once $\pi^{(1)}$ has reached essentially $1$, this problem disappears on its own; the moment-matched Gaussian becomes an excellent summary again, because by then there is only one hypothesis left with any real weight.
:::

```python
import numpy as np

# w, means and covs exactly as computed by the loop above, at t = 15 s
w15 = np.array([0.91517216, 0.08482784])
means15 = np.array([7.79378231, 15.79604078])
covs15 = np.array([0.00016897, 0.00017578])

m = w15 @ means15
var = np.sum(w15*(covs15 + (means15-m)**2))
print(m, np.sqrt(var))
# 8.472596622542303 2.2296699922823358
```

::: key A Gaussian sum filter is exact only for the hypotheses it was given
Every component's weight update is a correct application of Bayes' rule *restricted to the $M$ hypotheses the filter started with*. If the true posterior genuinely has a mode the filter never allocated a component to, the GSF cannot discover it — it will faithfully, optimally reweight among the wrong set of $M$ hypotheses forever, and report high confidence in whichever of them fits best, with no signal that a better hypothesis was never in the running. A particle filter's samples can, at least in principle, land anywhere; a Gaussian sum filter's components can only ever be where they were placed.
:::

::: warning Moment-matching for display is not the same as moment-matching for the filter's own use
Collapsing to one Gaussian for a downstream consumer that genuinely needs a single number is reasonable, provided the collapse happens *after* the mixture has been used for everything that needed its real shape. Collapsing prematurely — feeding the moment-matched mean and covariance back into a filter's own next cycle instead of keeping the components separate — throws away exactly the information the GSF exists to keep, at precisely the moments (like $t=15\,\mathrm s$ above) where that information matters most.
:::

::: warning A fixed number of components does not grow to meet a harder problem
Unlike the particle filter's cloud, which can be made as large as needed (subject to the dimensionality limits the previous lesson quantified), a Gaussian sum filter's component count $M$ is normally fixed at design time by how many hypotheses the engineer expects. A problem that turns out to need more distinct hypotheses than were provisioned — a third possible valley discovered only after the filter is already flying — is not something the GSF recipe itself will ever surface; it requires redesigning the filter, not merely running the one built.
:::

## Check yourself

::: check
State the one respect in which a Gaussian sum filter's weight update is the same as a particle filter's, and the one respect in which it differs.
:::

::: answer
Both update relative confidence in each hypothesis by multiplying its prior weight by how well that hypothesis's prediction matches the new measurement, then renormalizing — the same Bayesian mechanics. They differ in what "prediction" means for a single hypothesis: a particle's likelihood is evaluated at one point, while a Gaussian sum component's likelihood is evaluated against that component's own predicted spread, $\mathcal N(\boldsymbol\nu_k^{(j)};\mathbf 0,\mathbf S_k^{(j)})$, since each component is itself a small filter carrying a mean and a covariance, not a single sample.
:::

::: check
Explain why the moment-matched single Gaussian at $t=15\,\mathrm s$ had a standard deviation ($2.230\,\mathrm{km}$) much larger than either individual component's own uncertainty.
:::

::: answer
The moment-matching formula's covariance term includes $\sum_j\pi^{(j)}(\hat{\mathbf x}^{(j)}-\hat{\mathbf x})^{\mathsf T}(\hat{\mathbf x}^{(j)}-\hat{\mathbf x})$ — the *spread between the component means themselves*, weighted by how much probability mass is still on the minority component — in addition to each component's own internal variance. With the two components still $8\,\mathrm{km}$ apart and $8.5\%$ of the weight still on the wrong one, this between-component term dominates the sum, correctly reflecting that a single Gaussian summary of "probably valley one, but meaningfully possibly valley two, $8\,\mathrm{km}$ away" has to be wide to be honest — it is wide because the two hypotheses are still genuinely both live, not because either component itself is uncertain.
:::

::: check
A Gaussian sum filter is built with three components for a problem that, unknown to the filter's designer, actually has four physically plausible modes. What does the filter do when data consistent with the fourth mode arrives?
:::

::: answer
It reweights among the three components it has, optimally with respect to those three, but it has no mechanism to represent or discover the fourth mode at all — the data consistent with it will simply be explained, imperfectly, by whichever of the three existing components fits best, and the filter's reported weights will reflect confidence among the wrong set of alternatives without any built-in signal that something is missing. This is exactly the limitation the key block states: correctness restricted to the hypotheses actually provided.
:::

::: check
Why might an engineer choose a two-component Gaussian sum filter over a two-thousand-particle bootstrap filter for the terrain-matching problem in this lesson, given that both resolved the ambiguity correctly?
:::

::: answer
The terrain problem has exactly two genuinely distinct, well-separated hypotheses, each of which is locally well described by a single Gaussian (a smooth valley bottom, not a jagged or heavy-tailed local shape) — precisely the situation a Gaussian sum filter is built for. Running two small Kalman filters in parallel is far cheaper than propagating and weighting two thousand particles every cycle, and it produces the same qualitative resolution of the ambiguity; the particle filter's extra generality — representing an unknown number of modes of arbitrary shape — is not needed here and is not free, so paying for it would not buy anything this specific problem requires.
:::

::: check
Suppose a Gaussian sum filter's two components' means, instead of being $8\,\mathrm{km}$ apart, were only $50\,\mathrm m$ apart, with each component's own standard deviation around $200\,\mathrm m$. Would the moment-matching collapse still lose as much information as it did in this lesson's example?
:::

::: answer
No, not nearly as much. The between-component spread term in the moment-matching formula scales with how far apart the component means actually are; at $50\,\mathrm m$ separation against a $200\,\mathrm m$ per-component standard deviation, the two components already overlap substantially, so collapsing them into one Gaussian would be a much closer approximation to the true (only mildly non-Gaussian) mixture shape. The lesson's example was chosen with components far enough apart, relative to their own spread, that they represented two genuinely separate hypotheses rather than two overlapping descriptions of essentially the same one — that separation, not the mere existence of two components, is what made the collapse costly.
:::

## Summary

| Item | Statement |
| --- | --- |
| Gaussian sum filter | $M$ independent Kalman-family filters run in parallel, combined as $\sum_j\pi^{(j)}\mathcal N(\hat{\mathbf x}^{(j)},\mathbf P^{(j)})$; weights updated by each component's own innovation likelihood |
| Cost against a particle filter | Fixed, small $M$ (here, $2$) against thousands of particles, appropriate when the number of genuine hypotheses is small and known |
| Worked comparison | Two components resolved the terrain-matching ambiguity the same way the particle filter did: near-$50/50$ at $t=1\,\mathrm s$, resolved to $\pi^{(1)}=1$ by $t=20\,\mathrm s$ |
| Moment-matching pitfall | At $t=15\,\mathrm s$, collapsing to one Gaussian gave mean $8.473\,\mathrm{km}$, std $2.230\,\mathrm{km}$ — $0.68\,\mathrm{km}$ from the dominant, soon-correct hypothesis, and far wider than either component's own local uncertainty |
| Structural limit | Exact only among the $M$ hypotheses provided; cannot discover or represent a mode no component was placed at |

This closes the module's survey of ways to handle a nonlinearity without committing to exactly one Gaussian pushed through it: linearize once (EKF), sample deterministically (UKF, CKF), sample stochastically (particle filter), or maintain a small fixed bank of Gaussians (this lesson). The next lesson turns to a different kind of problem entirely — not how to handle nonlinearity in general, but how to handle a state that does not live in an ordinary vector space at all, starting with the general architecture every attitude filter in this curriculum ultimately depends on.
