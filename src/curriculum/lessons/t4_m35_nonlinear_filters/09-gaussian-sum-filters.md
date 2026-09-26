---
id: l09-gaussian-sum-filters
title: Gaussian sum filters
minutes: 22
covers:
  - Gaussian sum filters
---

A detective has two suspects. She could blend them into one imaginary suspect — average height, average hair color — and go looking for a person who does not exist. She could hire two thousand helpers to each follow a random stranger. Or she could do the sensible thing: keep one careful file on each suspect, update both files as clues come in, and keep a running score of which suspect looks more likely. When a clue rules one out, its score drops to zero and she closes that file.

The last two lessons offered the first two choices: one bell curve, which averages or picks, and a particle cloud, which handles anything but needs thousands of particles. This lesson is the detective's choice. A **Gaussian sum filter** (**GSF**) runs a small, fixed number of ordinary Kalman-family filters side by side — one per hypothesis — and keeps a score for each.

When a problem has only a few distinct possibilities, and you know roughly what they are in advance, this can resolve exactly the ambiguity a single-bell filter cannot, at a tiny fraction of a particle filter's cost. Flight controllers use it to work out which way a drone is pointing when the compass cannot be trusted.

## A mixture of bells

Picture a few bell curves drawn on the same axis, each shrunk by its own weight, then stacked on top of each other. The result is a **[[Gaussian mixture|mixture-picture]]**: a distribution built by adding up bells. Each bell is a **component**. With two components far apart you get two peaks; with several you can build almost any shape.

Written out, the filter's belief after $k$ measurements is

$$
p(\mathbf x_k\mid\mathbf z_{1:k})\approx\sum_{j=1}^M \pi_k^{(j)}\,\mathcal N\big(\mathbf x_k;\hat{\mathbf x}_k^{(j)},\mathbf P_k^{(j)}\big).
$$

Here is how to read it:

- $M$ is the number of components, fixed when you design the filter — often $2$ to $10$.
- $\mathcal N(\mathbf x;\hat{\mathbf x},\mathbf P)$ is the bell curve with mean $\hat{\mathbf x}$ and covariance $\mathbf P$, evaluated at $\mathbf x$.
- $\hat{\mathbf x}_k^{(j)}$ and $\mathbf P_k^{(j)}$ ("x hat k, component j" and "P k, component j") are component $j$'s own mean and covariance.
- $\pi_k^{(j)}$ (read "pi k, component j" — here $\pi$ is a label, not $3.14159$) is the **mixture weight**: how much belief component $j$ carries. The weights are positive and add up to one.

Each component is a complete, careful hypothesis with its own local uncertainty. That is the difference from a particle, which is one bare point.

## The recipe

Each component runs predict and update exactly as an ordinary EKF or UKF would, on its own. Component $j$ never looks at component $i$'s state. What ties the bank together is the weights, and they update the way the particle filter's did: multiply the old weight by how well this hypothesis predicted the new measurement, then normalize.

::: key Gaussian sum filter update
For each component $j=1,\ldots,M$, run an ordinary Kalman-family predict and update using $\hat{\mathbf x}_{k-1}^{(j)},\mathbf P_{k-1}^{(j)}$, producing $\hat{\mathbf x}_k^{(j)},\mathbf P_k^{(j)}$ and its own innovation covariance $\mathbf S_k^{(j)}$ and innovation $\boldsymbol\nu_k^{(j)}$. Update the mixture weights by
$$
\pi_k^{(j)} \propto \pi_{k-1}^{(j)}\cdot\mathcal N\big(\boldsymbol\nu_k^{(j)};\mathbf 0,\mathbf S_k^{(j)}\big), \qquad \sum_j\pi_k^{(j)}=1.
$$
The combined posterior is the weighted mixture itself, $\sum_j\pi_k^{(j)}\mathcal N(\hat{\mathbf x}_k^{(j)},\mathbf P_k^{(j)})$ — not, in general, a single Gaussian.
:::

Recall the two ingredients from the Kalman filter. The **innovation** $\boldsymbol\nu_k^{(j)}$ ("nu") is the surprise: the actual measurement minus what component $j$ predicted. The **innovation covariance** $\mathbf S_k^{(j)}$ is how big that surprise is expected to be, counting both the sensor noise and the component's own uncertainty. So $\mathcal N(\boldsymbol\nu;\mathbf 0,\mathbf S)$ asks: "how normal a surprise is this, for a hypothesis as sure of itself as this one?"

This is the particle filter's weight logic with $M = 2$ or $5$ instead of $N = 2000$ or $50{,}000$ — plus one difference that matters. A particle's weight uses the likelihood at a single point. A component's weight uses the likelihood spread out by the component's *own* uncertainty, through $\mathbf S_k^{(j)}$. A component that is unsure of itself predicts a wide range of readings and is punished less for a big miss.

::: example Scoring two hypotheses by hand
Two components start with equal weights, $0.5$ each. A reading comes in, and each component computes its innovation and innovation covariance (one-dimensional, in meters):

- component A: $\nu = 1\,\mathrm m$, $S = 4\,\mathrm{m^2}$ (so an expected surprise of about $2\,\mathrm m$);
- component B: $\nu = -6\,\mathrm m$, $S = 9\,\mathrm{m^2}$ (about $3\,\mathrm m$).

**Step 1: the bell heights.** In one dimension, $\mathcal N(\nu;0,S) = \dfrac{1}{\sqrt{2\pi S}}\,e^{-\nu^2/(2S)}$.

$$
\text{A: } \frac{e^{-1/8}}{\sqrt{8\pi}} = \frac{0.8825}{5.013} = 0.1760, \qquad \text{B: } \frac{e^{-36/18}}{\sqrt{18\pi}} = \frac{0.1353}{7.520} = 0.0180.
$$

**Step 2: multiply by the old weights and normalize.** Both old weights are $0.5$, so they cancel. The total is $0.1760 + 0.0180 = 0.1940$:

$$
\pi^{(A)} = 0.1760/0.1940 = 0.907, \qquad \pi^{(B)} = 0.0180/0.1940 = 0.093.
$$

**Step 3: see what the spread did.** Suppose B had missed by the same $6\,\mathrm m$ but been as sure of itself as A, with $S = 4\,\mathrm{m^2}$. Its bell height would be $e^{-36/8}/\sqrt{8\pi}=0.0022$, and its weight would drop to $0.012$. A three-sigma miss is much more damning than a two-sigma one.

**Sanity check.** The weights add to one. The component whose prediction landed within half a standard deviation now carries about $91\%$ of the belief, which fits a single fairly clear reading.
:::

::: note Why the weight uses the innovation's bell
The GSF's score for component $j$ should be the probability of the new reading *if hypothesis $j$ is true*. Under hypothesis $j$, the state is spread as the bell $\mathcal N(\hat{\mathbf x}_k^{-(j)},\mathbf P_k^{-(j)})$, and the sensor adds noise with covariance $\mathbf R$. For a linear (or linearized) sensor $\mathbf z = \mathbf H\mathbf x + \mathbf v$, a bell pushed through $\mathbf H$ is still a bell, and adding independent noise adds covariances. So the predicted reading is a bell with mean $\mathbf H\hat{\mathbf x}_k^{-(j)}$ and covariance $\mathbf H\mathbf P_k^{-(j)}\mathbf H^{\mathsf T} + \mathbf R = \mathbf S_k^{(j)}$. The probability of the actual reading under that bell is $\mathcal N(\mathbf z_k;\mathbf H\hat{\mathbf x}_k^{-(j)},\mathbf S_k^{(j)}) = \mathcal N(\boldsymbol\nu_k^{(j)};\mathbf 0,\mathbf S_k^{(j)})$. Bayes' rule then says the new weight is the old weight times this probability, divided by the total — the key block's update.
:::

::: example Two components resolve the same ambiguity a particle cloud did
Go back to the terrain-matching problem of the particle filter lesson: two valleys $80\,\mathrm m$ deep and $8\,\mathrm{km}$ apart, told apart only by a small $15\,\mathrm m$ hump near the first one, with the altimeter's $2\,\mathrm m$ noise and a vehicle at $100\,\mathrm{m/s}$. Replace the $2000$ particles with exactly **two** EKF components, one started in each valley with a standard deviation of $0.5\,\mathrm{km}$ and $\pi_0=(0.5,0.5)$:

| $t\,(\mathrm s)$ | $\pi^{(1)}$ (true valley) | $\pi^{(2)}$ | $\hat x^{(1)}\,(\mathrm{km})$ | $\hat x^{(2)}\,(\mathrm{km})$ |
| --- | --- | --- | --- | --- |
| $1$ | $0.499999$ | $0.500001$ | $6.399$ | $14.399$ |
| $5$ | $0.500150$ | $0.499850$ | $6.791$ | $14.791$ |
| $10$ | $0.533136$ | $0.466864$ | $7.296$ | $15.296$ |
| $15$ | $0.915172$ | $0.084828$ | $7.794$ | $15.796$ |
| $20$ | $1.000000$ | $0.000000$ | $8.292$ | $16.298$ |
| $30$ | $1.000000$ | $0.000000$ | $9.280$ | $17.298$ |

**Reading it.** It is the same story the particle filter told. At $t = 1\,\mathrm s$ the two hypotheses are essentially $50/50$: both valleys explain the readings equally well. As the vehicle nears the hump, the first component's predictions start to fit better, and by $t = 20\,\mathrm s$ its weight is $1$. Each component's own track stays sensible the whole time — both move $0.1\,\mathrm{km}$ per second, as the vehicle does.

**Sanity check.** The problem really has two competing hypotheses, known in advance, and near each valley a single bell describes the local uncertainty well. So two small Kalman filters do the job of two thousand particles.
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
A0, v, dt, sigma_w, sigma_alt = 1000.0, 0.1, 1.0, 0.003, 2.0   # km, m
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

## Squashing the mixture into one bell

Sooner or later something downstream wants one answer. An autopilot wants one position, not "91.5% here, 8.5% over there". The natural move is **[[moment matching|moments-word]]**: replace the mixture with the single bell that has the same mean and the same covariance.

The mean is the weighted average of the component means. The covariance has two parts: the average of the components' own covariances, *plus* the spread of the component means around the overall mean:

$$
\hat{\mathbf x}\approx\sum_j\pi^{(j)}\hat{\mathbf x}^{(j)}, \qquad \mathbf P\approx\sum_j\pi^{(j)}\Big(\mathbf P^{(j)}+\big(\hat{\mathbf x}^{(j)}-\hat{\mathbf x}\big)\big(\hat{\mathbf x}^{(j)}-\hat{\mathbf x}\big)^{\mathsf T}\Big).
$$

The term $(\hat{\mathbf x}^{(j)}-\hat{\mathbf x})(\hat{\mathbf x}^{(j)}-\hat{\mathbf x})^{\mathsf T}$ is a column times a row, which makes a matrix (an **[[outer product|outer-product]]**); in one dimension it is the squared distance of component $j$'s mean from the overall mean.

This bell has exactly the mixture's first two moments. And whenever the components are still well separated, it is a poor description of what the mixture actually says.

::: note Why the covariance has that second term
Think of a class split into two groups: one of $10$-year-olds, one of $14$-year-olds, each with a small spread of ages. The spread of ages across the *whole* class is not the small spread inside each group. It also includes how far each group's average is from the class average. That is the **[[law of total variance|total-variance]]**: total spread equals the average spread *within* groups plus the spread *between* the group averages. In symbols, with $J$ the component a state belongs to, $\operatorname{Cov}[\mathbf x] = \mathbb E\big[\operatorname{Cov}[\mathbf x\mid J]\big] + \operatorname{Cov}\big[\mathbb E[\mathbf x\mid J]\big]$. The first term is $\sum_j \pi^{(j)}\mathbf P^{(j)}$ and the second is $\sum_j \pi^{(j)}(\hat{\mathbf x}^{(j)}-\hat{\mathbf x})(\hat{\mathbf x}^{(j)}-\hat{\mathbf x})^{\mathsf T}$.
:::

::: example The collapse, at the moment it matters most
At $t=15\,\mathrm s$ in the terrain example, component 1 (soon confirmed correct) sits at $7.794\,\mathrm{km}$ with weight $0.915$. Component 2 sits at $15.796\,\mathrm{km}$ with weight $0.085$. Each has its own standard deviation of only about $13\,\mathrm m$ (variance $0.000169\,\mathrm{km^2}$).

**Step 1: the mean.** $0.915\times7.794 + 0.085\times15.796 = 8.473\,\mathrm{km}$ (with the unrounded weights).

**Step 2: the covariance.** Each component's own variance is about $0.00017\,\mathrm{km^2}$. The between-component term is $0.915\times(7.794-8.473)^2 + 0.085\times(15.796-8.473)^2 = 0.422 + 4.549 = 4.971\,\mathrm{km^2}$. The total is $4.971\,\mathrm{km^2}$, so the standard deviation is $\sqrt{4.971} = 2.230\,\mathrm{km}$.

**Reading it.** The single bell's mean sits $0.68\,\mathrm{km}$ from the dominant, soon-to-be-confirmed hypothesis — [[somewhere neither component puts the vehicle|collapse-picture]]. Its $2.23\,\mathrm{km}$ spread is about $170$ times wider than either component's own $13\,\mathrm m$. It honestly describes the mixture's first two moments, but not its shape.

**Sanity check.** Earlier, at $t = 1\,\mathrm s$ with weights near $50/50$, the same collapse gives a mean of $10.40\,\mathrm{km}$ — on the ridge between the valleys — with a spread of $4.00\,\mathrm{km}$. Five seconds after $t=15\,\mathrm s$, once $\pi^{(1)}$ is essentially $1$, the problem disappears: with only one hypothesis left, the collapsed bell and component 1 are the same bell.
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

(Each component is also only as good as its own EKF or UKF. If a nonlinearity is strong across one component's spread, that component's bell is itself an approximation — one reason practical GSFs [[split wide components|split-merge]] into narrower ones.)

::: warning Moment-matching for display is not the same as moment-matching for the filter's own use
Collapsing to one bell for a downstream user that needs one number is reasonable, as long as it happens *after* the mixture has been used for everything that needed its real shape. Collapsing too early — feeding the matched mean and covariance back into the filter's next cycle instead of keeping the components — throws away exactly the information the GSF exists to keep, at exactly the moments (like $t=15\,\mathrm s$) when it matters most.
:::

::: warning A fixed number of components does not grow to meet a harder problem
A particle cloud can be made as large as needed (within the dimension limits of the last lesson). A Gaussian sum filter's component count $M$ is normally fixed at design time by how many hypotheses the engineer expects. A problem that turns out to need more — a third look-alike valley found only after the filter is flying — is not something the GSF recipe will ever reveal. It needs a redesign, not more running.
:::

## Choosing between one bell, a few bells and a cloud

Put the three options side by side.

- **One bell** (EKF, UKF, CKF): cheapest. Right when the posterior really has one peak.
- **A few bells** (GSF): a handful of Kalman filters. Right when there are a few distinct hypotheses, known in advance, each locally bell-shaped.
- **A cloud** (particle filter): most general, most expensive. Right when the number or shape of the peaks is unknown, and the ambiguous part of the state is low-dimensional.

A close cousin of the GSF, the [[multiple-model filter|imm-bridge]], keeps a bank of filters too, but its members disagree about the *motion rule* rather than about where the state is.

The GSF idea is old — Harold Sorenson and Daniel Alspach published it in the early [[1970s|gsf-history]] — and it is still in use in the flight code of small drones.

## Check yourself

::: check
State the one respect in which a Gaussian sum filter's weight update is the same as a particle filter's, and the one respect in which it differs.
:::

::: answer
The same: both multiply each hypothesis's old weight by how well its prediction matches the new measurement, then normalize — the same Bayes' rule. The difference is what "prediction" means. A particle's likelihood is worked out at one point. A Gaussian sum component's likelihood is worked out against the component's own predicted spread, $\mathcal N(\boldsymbol\nu_k^{(j)};\mathbf 0,\mathbf S_k^{(j)})$, because each component is a small filter with a mean and a covariance, not a single sample.
:::

::: check
Explain why the moment-matched single Gaussian at $t=15\,\mathrm s$ had a standard deviation ($2.230\,\mathrm{km}$) much larger than either individual component's own uncertainty.
:::

::: answer
The matched covariance has two parts: the average of the components' own covariances, and the between-component term $\sum_j\pi^{(j)}(\hat{\mathbf x}^{(j)}-\hat{\mathbf x})(\hat{\mathbf x}^{(j)}-\hat{\mathbf x})^{\mathsf T}$ — the spread of the component *means* around the overall mean. With the components $8\,\mathrm{km}$ apart and $8.5\%$ of the weight still on the minority one, the between-component term ($4.97\,\mathrm{km^2}$) dwarfs the components' own variances (about $0.00017\,\mathrm{km^2}$). A one-bell summary of "probably valley one, but possibly valley two, $8\,\mathrm{km}$ away" has to be wide to be honest. It is wide because both hypotheses are still alive, not because either component is unsure of itself.
:::

::: check
A Gaussian sum filter is built with three components for a problem that, unknown to its designer, actually has four physically plausible modes. What does the filter do when data consistent with the fourth mode arrive?
:::

::: answer
It reweights among its three components, optimally for those three, but it has no way to represent or discover the fourth. The data will be explained, badly, by whichever existing component fits best, and the weights will show confidence among the wrong set of alternatives with no built-in signal that something is missing. That is the key block's limit: correct only among the hypotheses provided.
:::

::: check
Why might an engineer choose a two-component Gaussian sum filter over a two-thousand-particle bootstrap filter for this lesson's terrain problem, when both resolved the ambiguity correctly?
:::

::: answer
The terrain problem has exactly two distinct, well-separated hypotheses, each well described locally by one bell (a smooth valley floor, not a jagged or heavy-tailed shape). That is exactly the GSF's home ground. Two small Kalman filters cost far less than moving and weighing two thousand particles every cycle, and they reach the same resolution. The particle filter's extra generality — any number of peaks of any shape — is not needed here, and it is not free.
:::

::: check
Suppose a Gaussian sum filter's two component means were only $50\,\mathrm m$ apart instead of $8\,\mathrm{km}$, with each component's own standard deviation around $200\,\mathrm m$. Would collapsing to one bell still lose as much information as in this lesson's example?
:::

::: answer
No, not nearly as much. The between-component term grows with the square of the distance between the component means. At $50\,\mathrm m$ apart, with $200\,\mathrm m$ of spread each, the two bells overlap heavily, and their sum has a single peak. One matched bell is then a close description of the mixture. The lesson's example was costly because the components were far apart compared with their own spreads — two genuinely separate hypotheses — not merely because there were two components.
:::

## Summary

| Item | Statement |
| --- | --- |
| Gaussian mixture | $\sum_j\pi^{(j)}\mathcal N(\hat{\mathbf x}^{(j)},\mathbf P^{(j)})$: weighted bells added together; weights positive, summing to one |
| Gaussian sum filter | $M$ Kalman-family filters run independently; weights updated by each component's own innovation likelihood $\mathcal N(\boldsymbol\nu^{(j)};\mathbf 0,\mathbf S^{(j)})$ |
| Cost against a particle filter | A small fixed $M$ (here $2$) instead of thousands of particles; right when the hypotheses are few and known |
| Terrain comparison | Near $50/50$ at $t=1\,\mathrm s$, resolved to $\pi^{(1)}=1$ by $t=20\,\mathrm s$ — same as the particle filter |
| Moment matching | Mean $\sum_j\pi^{(j)}\hat{\mathbf x}^{(j)}$; covariance = average own covariance + spread of the means |
| Collapse pitfall | At $t=15\,\mathrm s$: mean $8.473\,\mathrm{km}$, std $2.230\,\mathrm{km}$ — $0.68\,\mathrm{km}$ from the dominant hypothesis and about $170$ times wider than either component |
| Structural limit | Exact only among the $M$ hypotheses provided; cannot discover a mode no component was placed at |

This closes the module's survey of ways to handle nonlinearity without betting everything on one bell: linearize once (EKF), sample deterministically (UKF, CKF), sample randomly (particle filter), or keep a small bank of bells (this lesson). The next lesson turns to a different problem — a state that is best estimated as a small error around a large, precisely integrated nominal — starting with the error-state architecture every attitude filter in this curriculum depends on.

::: context mixture-picture Adding bells to build a shape
Two bells, one carrying weight $0.7$ and one $0.3$, drawn separately (dashed) and added together (solid). Where they are far apart, the sum has two peaks. Slide them together and the peaks merge into one lopsided hump.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 175" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="150" x2="340" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M20.0,150.0 L24.0,150.0 L28.0,150.0 L32.0,150.0 L36.0,149.9 L40.0,149.9 L44.0,149.8 L48.0,149.6 L52.0,149.4 L56.0,148.9 L60.0,148.1 L64.0,147.0 L68.0,145.3 L72.0,142.9 L76.0,139.6 L80.0,135.3 L84.0,129.8 L88.0,123.3 L92.0,115.7 L96.0,107.5 L100.0,99.1 L104.0,90.9 L108.0,83.6 L112.0,77.9 L116.0,74.3 L120.0,73.0 L124.0,74.3 L128.0,77.9 L132.0,83.6 L136.0,90.9 L140.0,99.1 L144.0,107.5 L148.0,115.7 L152.0,123.3 L156.0,129.8 L160.0,135.3 L164.0,139.6 L168.0,142.9 L172.0,145.3 L176.0,147.0 L180.0,148.1 L184.0,148.9 L188.0,149.4 L192.0,149.6 L196.0,149.8 L200.0,149.9 L204.0,149.9 L208.0,150.0 L212.0,150.0 L216.0,150.0 L220.0,150.0 L224.0,150.0 L228.0,150.0 L232.0,150.0 L236.0,150.0 L240.0,150.0 L244.0,150.0 L248.0,150.0 L252.0,150.0 L256.0,150.0 L260.0,150.0 L264.0,150.0 L268.0,150.0 L272.0,150.0 L276.0,150.0 L280.0,150.0 L284.0,150.0 L288.0,150.0 L292.0,150.0 L296.0,150.0 L300.0,150.0 L304.0,150.0 L308.0,150.0 L312.0,150.0 L316.0,150.0 L320.0,150.0 L324.0,150.0 L328.0,150.0 L332.0,150.0 L336.0,150.0 L340.0,150.0" fill="none" stroke="#1d6fd1" stroke-width="1.5" stroke-dasharray="4 3"/>
  <path d="M20.0,150.0 L24.0,150.0 L28.0,150.0 L32.0,150.0 L36.0,150.0 L40.0,150.0 L44.0,150.0 L48.0,150.0 L52.0,150.0 L56.0,150.0 L60.0,150.0 L64.0,150.0 L68.0,150.0 L72.0,150.0 L76.0,150.0 L80.0,150.0 L84.0,150.0 L88.0,150.0 L92.0,150.0 L96.0,150.0 L100.0,150.0 L104.0,150.0 L108.0,150.0 L112.0,150.0 L116.0,150.0 L120.0,150.0 L124.0,150.0 L128.0,150.0 L132.0,150.0 L136.0,150.0 L140.0,150.0 L144.0,150.0 L148.0,150.0 L152.0,150.0 L156.0,150.0 L160.0,150.0 L164.0,150.0 L168.0,150.0 L172.0,149.9 L176.0,149.9 L180.0,149.8 L184.0,149.6 L188.0,149.4 L192.0,149.0 L196.0,148.4 L200.0,147.5 L204.0,146.3 L208.0,144.7 L212.0,142.6 L216.0,140.0 L220.0,137.0 L224.0,133.6 L228.0,130.0 L232.0,126.4 L236.0,123.0 L240.0,120.2 L244.0,118.2 L248.0,117.1 L252.0,117.1 L256.0,118.2 L260.0,120.2 L264.0,123.0 L268.0,126.4 L272.0,130.0 L276.0,133.6 L280.0,137.0 L284.0,140.0 L288.0,142.6 L292.0,144.7 L296.0,146.3 L300.0,147.5 L304.0,148.4 L308.0,149.0 L312.0,149.4 L316.0,149.6 L320.0,149.8 L324.0,149.9 L328.0,149.9 L332.0,150.0 L336.0,150.0 L340.0,150.0" fill="none" stroke="#f2b880" stroke-width="2" stroke-dasharray="4 3"/>
  <path d="M20.0,150.0 L22.0,150.0 L24.0,150.0 L26.0,150.0 L28.0,150.0 L30.0,150.0 L32.0,150.0 L34.0,150.0 L36.0,149.9 L38.0,149.9 L40.0,149.9 L42.0,149.9 L44.0,149.8 L46.0,149.7 L48.0,149.6 L50.0,149.5 L52.0,149.4 L54.0,149.1 L56.0,148.9 L58.0,148.5 L60.0,148.1 L62.0,147.6 L64.0,147.0 L66.0,146.2 L68.0,145.3 L70.0,144.2 L72.0,142.9 L74.0,141.3 L76.0,139.6 L78.0,137.6 L80.0,135.3 L82.0,132.7 L84.0,129.8 L86.0,126.7 L88.0,123.3 L90.0,119.6 L92.0,115.7 L94.0,111.7 L96.0,107.5 L98.0,103.3 L100.0,99.1 L102.0,94.9 L104.0,90.9 L106.0,87.1 L108.0,83.6 L110.0,80.6 L112.0,77.9 L114.0,75.8 L116.0,74.3 L118.0,73.3 L120.0,73.0 L122.0,73.3 L124.0,74.3 L126.0,75.8 L128.0,77.9 L130.0,80.6 L132.0,83.6 L134.0,87.1 L136.0,90.9 L138.0,94.9 L140.0,99.1 L142.0,103.3 L144.0,107.5 L146.0,111.7 L148.0,115.7 L150.0,119.6 L152.0,123.3 L154.0,126.7 L156.0,129.8 L158.0,132.7 L160.0,135.2 L162.0,137.5 L164.0,139.6 L166.0,141.3 L168.0,142.8 L170.0,144.1 L172.0,145.2 L174.0,146.1 L176.0,146.9 L178.0,147.5 L180.0,147.9 L182.0,148.3 L184.0,148.5 L186.0,148.7 L188.0,148.7 L190.0,148.7 L192.0,148.6 L194.0,148.4 L196.0,148.2 L198.0,147.8 L200.0,147.4 L202.0,146.9 L204.0,146.2 L206.0,145.5 L208.0,144.6 L210.0,143.7 L212.0,142.6 L214.0,141.3 L216.0,140.0 L218.0,138.5 L220.0,137.0 L222.0,135.3 L224.0,133.6 L226.0,131.8 L228.0,130.0 L230.0,128.2 L232.0,126.4 L234.0,124.7 L236.0,123.0 L238.0,121.6 L240.0,120.2 L242.0,119.1 L244.0,118.2 L246.0,117.5 L248.0,117.1 L250.0,117.0 L252.0,117.1 L254.0,117.5 L256.0,118.2 L258.0,119.1 L260.0,120.2 L262.0,121.6 L264.0,123.0 L266.0,124.7 L268.0,126.4 L270.0,128.2 L272.0,130.0 L274.0,131.8 L276.0,133.6 L278.0,135.3 L280.0,137.0 L282.0,138.5 L284.0,140.0 L286.0,141.3 L288.0,142.6 L290.0,143.7 L292.0,144.7 L294.0,145.5 L296.0,146.3 L298.0,146.9 L300.0,147.5 L302.0,148.0 L304.0,148.4 L306.0,148.7 L308.0,149.0 L310.0,149.2 L312.0,149.4 L314.0,149.5 L316.0,149.6 L318.0,149.7 L320.0,149.8 L322.0,149.8 L324.0,149.9 L326.0,149.9 L328.0,149.9 L330.0,150.0 L332.0,150.0 L334.0,150.0 L336.0,150.0 L338.0,150.0 L340.0,150.0" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <text x="120" y="62" font-size="11" fill="#1d6fd1" text-anchor="middle">weight 0.7</text>
  <text x="250" y="102" font-size="11" fill="#1f2a44" text-anchor="middle">weight 0.3</text>
  <text x="180" y="168" font-size="11" fill="#1f2a44" text-anchor="middle">solid line = the sum of the two</text>
</svg>
```

With enough components, a mixture of bells can imitate almost any smooth distribution — which is why the idea keeps returning in estimation and in machine learning.
:::

::: context moments-word What a "moment" is
The word comes from mechanics. The first moment of a mass distribution tells you its balance point — its center of mass. The second moment tells you how spread out it is around that point — its moment of inertia. Probability borrowed both: the mean is the balance point of a distribution, and the variance is its spread. Matching the first two moments makes the new bell balance at the same place with the same spread, but it can still have a very different shape.
:::

::: context outer-product A column times a row
A column of two numbers times a row of two numbers gives a two-by-two table: every entry of the column times every entry of the row. If component $j$'s mean is off from the overall mean by $2\,\mathrm{km}$ east and $1\,\mathrm{km}$ north, the outer product is
$$
\begin{bmatrix}2\\1\end{bmatrix}\begin{bmatrix}2 & 1\end{bmatrix} = \begin{bmatrix}4 & 2\\2 & 1\end{bmatrix}\,\mathrm{km^2}.
$$
The diagonal holds the squared offsets ($4$ east, $1$ north); the off-diagonal $2$ says the offsets go together — this component lies off toward the northeast. Swap the order, row times column, and you get the single number $2\cdot2+1\cdot1 = 5$ instead.
:::

::: context total-variance The class-ages picture, with numbers
Ten $10$-year-olds and ten $14$-year-olds, every child exactly their group's age. Inside each group the spread is zero. But the class average is $12$, and every child is $2$ years from it, so the class's variance is $4$ and its standard deviation $2$ years. All of that spread is "between groups".

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="80" x2="330" y2="80" stroke="#1f2a44" stroke-width="1.5"/>
  <g fill="#1d6fd1"><circle cx="80" cy="68" r="6"/><circle cx="80" cy="54" r="6"/><circle cx="80" cy="40" r="6"/></g>
  <g fill="#f2b880" stroke="#1f2a44" stroke-width="1"><circle cx="280" cy="68" r="6"/><circle cx="280" cy="54" r="6"/><circle cx="280" cy="40" r="6"/></g>
  <line x1="180" y1="30" x2="180" y2="80" stroke="#b4232c" stroke-width="2" stroke-dasharray="4 3"/>
  <line x1="80" y1="22" x2="176" y2="22" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="184" y1="22" x2="280" y2="22" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="128" y="16" font-size="11" fill="#6c7a93" text-anchor="middle">2 years</text>
  <text x="232" y="16" font-size="11" fill="#6c7a93" text-anchor="middle">2 years</text>
  <g font-size="11" fill="#1f2a44" text-anchor="middle"><text x="80" y="98">age 10</text><text x="180" y="98" fill="#b4232c">class mean 12</text><text x="280" y="98">age 14</text></g>
</svg>
```

A GSF's collapsed bell at $t = 15\,\mathrm s$ is the same story: almost all of its $2.23\,\mathrm{km}$ comes from the gap between the components.
:::

::: context collapse-picture The collapsed bell, drawn
Blue spikes: the two components at $t = 15\,\mathrm s$, as tall as their weights (each is only about $13\,\mathrm m$ wide, far too thin to draw). Red dashed: the single matched bell, drawn to its own height scale.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 175" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="140" x2="340" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M20.0,115.7 L24.0,113.8 L28.0,112.0 L32.0,110.2 L36.0,108.4 L40.0,106.6 L44.0,104.9 L48.0,103.3 L52.0,101.8 L56.0,100.4 L60.0,99.1 L64.0,98.0 L68.0,97.0 L72.0,96.2 L76.0,95.6 L80.0,95.2 L84.0,95.0 L88.0,95.0 L92.0,95.2 L96.0,95.6 L100.0,96.2 L104.0,97.0 L108.0,98.0 L112.0,99.1 L116.0,100.4 L120.0,101.8 L124.0,103.3 L128.0,105.0 L132.0,106.7 L136.0,108.4 L140.0,110.2 L144.0,112.1 L148.0,113.9 L152.0,115.7 L156.0,117.5 L160.0,119.3 L164.0,121.0 L168.0,122.6 L172.0,124.2 L176.0,125.7 L180.0,127.1 L184.0,128.5 L188.0,129.7 L192.0,130.8 L196.0,131.9 L200.0,132.9 L204.0,133.7 L208.0,134.5 L212.0,135.2 L216.0,135.9 L220.0,136.5 L224.0,137.0 L228.0,137.4 L232.0,137.8 L236.0,138.1 L240.0,138.4 L244.0,138.7 L248.0,138.9 L252.0,139.1 L256.0,139.2 L260.0,139.4 L264.0,139.5 L268.0,139.6 L272.0,139.7 L276.0,139.7 L280.0,139.8 L284.0,139.8 L288.0,139.9 L292.0,139.9 L296.0,139.9 L300.0,139.9 L304.0,139.9 L308.0,140.0 L312.0,140.0 L316.0,140.0 L320.0,140.0 L324.0,140.0 L328.0,140.0 L332.0,140.0 L336.0,140.0 L340.0,140.0" fill="none" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 4"/>
  <line x1="67.8" y1="140" x2="67.8" y2="39.3" stroke="#1d6fd1" stroke-width="4"/>
  <line x1="281.2" y1="140" x2="281.2" y2="130.7" stroke="#1d6fd1" stroke-width="4"/>
  <line x1="85.9" y1="140" x2="85.9" y2="146" stroke="#b4232c" stroke-width="2"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="20.0" y="158">6</text><text x="126.7" y="158">10</text><text x="233.3" y="158">14</text><text x="340.0" y="158">18 km</text>
  </g>
  <text x="75.8" y="44" font-size="11" fill="#1d6fd1">0.915 at 7.79 km</text>
  <text x="281.2" y="118" font-size="11" fill="#1d6fd1" text-anchor="middle">0.085 at 15.80 km</text>
  <text x="95.9" y="172" font-size="11" fill="#b4232c">one bell: 8.47 ± 2.23 km</text>
</svg>
```

The bell's center, $8.47\,\mathrm{km}$, is pulled off the tall spike toward the short one, and its body covers kilometers where neither hypothesis puts the vehicle.
:::

::: context split-merge Splitting and merging components
When one component's bell is too wide for its EKF's straight-line approximation to hold, a common fix is to split it into several narrower bells whose mixture has the same mean and covariance. Each narrow bell then sees a nearly straight piece of the nonlinearity. The opposite housekeeping also matters: components that drift on top of each other are merged, and components whose weight falls near zero are dropped, so $M$ does not grow without bound.
:::

::: context imm-bridge Coming later: filters that switch models
Lesson 14 builds the interacting multiple-model (IMM) filter. Like a GSF, it runs a small bank of Kalman filters and scores each one by its innovation bell. But each IMM filter assumes a different way the vehicle might be moving — coasting, turning, thrusting — and every cycle the filters are allowed to mix, because a vehicle that was turning a moment ago is likely still turning. The weight update you learned here is the heart of both.
:::

::: context gsf-history From 1971 to your drone
Harold Sorenson and Daniel Alspach introduced Gaussian sum approximations for Bayesian filtering in 1971 and 1972 — about a decade after Kalman's filter. The idea sat quietly for years and then found a modern home in small drones. The open-source autopilots PX4 and ArduPilot include a Gaussian sum filter for yaw: several EKFs, each started with a different guess of which way the vehicle is pointing, run side by side, and the one whose predictions keep matching the GPS velocity wins. That lets a drone recover its heading when its magnetometer is fooled by nearby steel.
:::
