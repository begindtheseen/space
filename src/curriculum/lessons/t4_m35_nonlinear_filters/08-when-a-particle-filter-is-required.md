---
id: l08-when-a-particle-filter-is-required
title: When a particle filter is genuinely required
minutes: 19
covers:
  - 'When a particle filter is genuinely required: multi-modal and non-Gaussian posteriors'
---

You wake up in a hotel you have never seen. You step into the hallway, and it looks exactly like the hallway one floor down would: same carpet, same lamps, same door numbers. Are you on floor 3 or floor 4? A sensible person keeps *both* possibilities in mind and walks until something settles it — a window with a view, a sign by the elevator. What a sensible person does not do is stand halfway up the stairs because that is "the average of floor 3 and floor 4".

Every Gaussian filter in this module — the EKF, the UKF and the CKF — is stuck with one bell curve: one mean and one covariance, every cycle. A bell has exactly one peak. So when the truth has two separate possibilities, a Gaussian filter has only two moves. It can average them, landing on the stairs where neither possibility puts you. Or it can pick one and pretend the other does not exist. The particle filter from the last lesson can hold both.

This lesson pins down exactly when that difference stops being a detail and starts being the whole problem. It also measures, with real numbers, the one practical fact that stops particle filters from replacing every other filter: the number of particles needed grows explosively with the number of state dimensions the particles must cover.

## One peak or two

A probability distribution's peaks are its **[[modes|mode-word]]** — the places where the state is most likely to be. A distribution with one peak is **unimodal**. One with two or more separate peaks is **multi-modal**. A bell curve is always unimodal.

A distribution can also be **non-Gaussian** without having two peaks. It might be lopsided, or have **[[heavy tails|heavy-tails]]** — far more probability out at large distances than a bell curve allows. A single bell handles mild lopsidedness tolerably. It handles two well-separated peaks disastrously.

Here is why, with numbers. Suppose the truth is "valley 1 at $6\,\mathrm{km}$ or valley 2 at $14\,\mathrm{km}$, equally likely, each pinned to within a few tens of meters". The one bell that matches this distribution's mean and spread has its mean at $10\,\mathrm{km}$ and a standard deviation of $4\,\mathrm{km}$. Its peak — the single most likely place, according to the bell — is [[the ridge between the valleys|bimodal-picture]], the one place the truth says the vehicle is *not*. Lesson 9 works this averaging out in detail.

The other move, picking one peak, is no better. Whichever peak it picks, the filter's covariance then shrinks around it, and nothing in a single bell can say "or possibly the other valley, $8\,\mathrm{km}$ away".

## Where real posteriors split in two

Multi-modal posteriors are not rare curiosities. Three situations produce them over and over in navigation:

- **Terrain-referenced navigation over repeating ground.** Two valleys, two ridges or two stretches of sea floor that look alike to an altimeter or sonar give one peak per look-alike place.
- **Starting with no idea where you are.** A robot switched on somewhere in a building, or a spacecraft that has lost its attitude and must work it out from scratch — the **[[lost-in-space|lost-in-space]]** problem — begins with a belief spread over many possibilities, and early measurements often narrow it to several separate candidates before they narrow it to one.
- **Not knowing which measurement belongs to what.** A radar sees three blips near where the target should be. Which one is the target, and which are clutter or a second aircraft? This is **[[data association|data-association]]**. Each possible pairing of blip and target gives its own peak in the posterior.

Heavy tails show up whenever a sensor sometimes produces wild readings — a GPS signal bouncing off a building, a star tracker mistaking a planet for a star. A Gaussian filter believes every reading is bell-shaped, so it treats a wild one as real information and yanks its estimate toward it.

::: example A single-Gaussian filter commits early, and is often wrong
Go back to terrain matching with two identical valleys, $80\,\mathrm m$ deep and $8\,\mathrm{km}$ apart. Real ground is never perfectly flat between features, so add a gentle bowl-shaped slope that rises away from whichever valley is nearer: $0.3\,\mathrm m$ times the square of the distance in kilometers, about $5\,\mathrm m$ at $4\,\mathrm{km}$ out. That is small next to the valleys' $80\,\mathrm m$ depth, but it means the ground is never an exactly flat plateau. The vehicle flies $7\,\mathrm{km}$ at $100\,\mathrm{m/s}$; the altimeter noise is $2\,\mathrm m$.

Run an ordinary EKF — one mean, one covariance — $200$ times. Half the trials really start in valley 1, half in valley 2. Each trial starts the EKF from a guess with a $3\,\mathrm{km}$ standard deviation, the kind of error ordinary navigation builds up before the first terrain fix. Within a few readings, the EKF's one bell is pulled toward whichever feature sits nearest its starting guess, and its covariance shrinks around that choice. It has no second bell to keep the other valley in reserve.

**The results.**

| outcome | trials | median reported std dev | largest reported std dev |
| --- | --- | --- | --- |
| ends on the true valley's track | $60$ | $12\,\mathrm m$ | $69\,\mathrm m$ |
| ends on the other valley's track ($6$–$9\,\mathrm{km}$ wrong) | $64$ | $19\,\mathrm m$ | $71\,\mathrm m$ |
| ends somewhere else ($1.5$–$16\,\mathrm{km}$ wrong) | $76$ | $10\,\mathrm m$ | $78\,\mathrm m$ |

**Reading it.** Of the $124$ trials that ended on one of the two valley tracks, $64$ chose the **wrong** one: $52\%$. That is statistically the same as [[flipping a coin|coin-flip]]. The other $76$ did not end up "undecided" either: $69$ of them got stuck on the side of the first valley, as if the vehicle had stopped flying, reporting a standard deviation of about $10\,\mathrm m$ while being kilometers wrong.

Now look at the last two columns. A confidently wrong run reports as tight a covariance as a confidently right one — tens of meters, when the real error is kilometers. Nothing in a single bell's shape can say "this could, with real probability, be the other valley instead". The filter gives no warning at all.
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
    A0, v, dt, sigma_w, sigma_alt = 1500.0, 0.1, 1.0, 0.003, 2.0   # km, m
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
    return s_hat, P

sd = {'right': [], 'wrong': [], 'lost': []}
for i in range(200):
    true_valley = 6.3 if i % 2 == 0 else 14.3
    s_hat, P = run_trial(seed=7000+i, s_true0=true_valley)
    d1, d2 = abs(s_hat-(6.0+7.0)), abs(s_hat-(14.0+7.0))
    if min(d1, d2) > 1.5: group = 'lost'
    elif (d1 < d2) != (true_valley == 6.3): group = 'wrong'
    else: group = 'right'
    sd[group].append(1000*np.sqrt(P))      # reported std dev, in m
for g in sd:
    print(g, len(sd[g]), round(np.median(sd[g])), round(max(sd[g])))
# right 60 12 69
# wrong 64 19 71
# lost 76 10 78
```

## The curse of dimensionality

So why not use a particle filter for everything? Because of a bill that comes due in the number of particles.

Here is the picture. Throw darts at a dartboard, aiming roughly but not perfectly at the bull's-eye, and count a dart as "good" if it lands within some distance of the center. In one dimension — a line — plenty of darts are good. Now make every dart land in two dimensions, then three, then twenty. A dart is good only if it is close *in every direction at once*. Each extra direction is one more chance to miss. The fraction of good darts shrinks by a factor with every direction you add, which makes it shrink **exponentially** — like $0.9 \times 0.9 \times 0.9 \times\cdots$ — with the number of directions.

Particles are the darts. In a particle filter, the weight of a particle is a product of how well it fits along every dimension. If the particles are drawn from a spot only slightly off the true posterior, each dimension multiplies in one small, mild correction factor. Multiply enough mild factors together and a few particles end up with enormous weights while the rest get almost none. That is degeneracy, caused purely by the number of dimensions. This is the **[[curse of dimensionality|curse-name]]**.

::: example Effective sample size against dimension, measured directly
Draw $N = 20{,}000$ particles from a bell centered at zero in every dimension (a standard normal, $\mathcal N(\mathbf 0,\mathbf I_n)$, where $n$ is the number of dimensions). Weight them to represent a target bell shifted by half a standard deviation along every axis, $\mathcal N(0.5\,\mathbf 1,\mathbf I_n)$. The mismatch per axis is modest, and it is the same on every axis. Then work out $N_\text{eff}/N$ as $n$ grows (the average over $20$ repeats):

| $n$ (dimensions) | measured $N_\text{eff}/N$ | measured $N_\text{eff}$ | exact $N_\text{eff}/N$ for huge $N$ |
| --- | --- | --- | --- |
| $1$ | $0.778$ | $15{,}568$ | $0.779$ |
| $5$ | $0.292$ | $5{,}830$ | $0.287$ |
| $10$ | $0.088$ | $1{,}766$ | $0.082$ |
| $20$ | $0.017$ | $342$ | $0.0067$ |
| $30$ | $0.0054$ | $108$ | $5.5\times10^{-4}$ |
| $50$ | $0.0012$ | $24$ | $3.7\times10^{-6}$ |
| $80$ | $0.00057$ | $11$ | $2.1\times10^{-9}$ |
| $120$ | $0.00028$ | $6$ | $9.4\times10^{-14}$ |

**Reading it.** Nothing about the *size* of the mismatch changed down the table — every axis carries the same half-sigma offset. Only the number of axes changed. Twenty thousand particles, generous for a one-dimensional problem, are worth about a dozen effective samples at $n = 80$ and six at $n=120$.

**The last column is even worse.** It is the exact answer, $e^{-n/4}$, derived in the note below. From about $n = 20$ on, the measured values are *too hopeful*. The few particles that would carry nearly all the weight are so rare that $20{,}000$ draws usually miss them, and a cloud that misses them looks healthier than it is. To keep $100$ effective samples at $n=30$ you would need about $180{,}000$ particles; at $n = 50$, about $27$ million.

**Sanity check.** At $n = 1$ the measured and exact values agree to three digits, as they should when $N$ is large compared with what the problem needs.
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
    print(n, ess/N, ess, np.exp(-n*m**2))
# 1   0.7784  15568.5  0.779
# 5   0.2915   5830.1  0.287
# 10  0.0883   1765.7  0.0821
# 20  0.0171    341.7  0.00674
# 30  0.0054    108.1  5.53e-04
# 50  0.0012     24.3  3.73e-06
# 80  0.00057    11.5  2.06e-09
# 120 0.00028     5.5  9.36e-14
```

::: note Why the exact answer is e to the minus n over 4
For huge $N$, $N_\text{eff}/N$ tends to $\big(\mathbb E[w]\big)^2/\mathbb E[w^2]$, where $w$ is the unnormalized weight and $\mathbb E$ averages over the particles' distribution. The weight is the ratio of the two bells: $w(\mathbf x) = \exp\!\big(\mathbf x\cdot\boldsymbol\mu - \tfrac12|\boldsymbol\mu|^2\big)$, with $\boldsymbol\mu = 0.5\,\mathbf 1$. For a standard normal $\mathbf x$ and any fixed vector $\mathbf a$, $\mathbb E[e^{\mathbf a\cdot\mathbf x}] = e^{|\mathbf a|^2/2}$. Take $\mathbf a=\boldsymbol\mu$: $\mathbb E[w] = e^{|\boldsymbol\mu|^2/2}e^{-|\boldsymbol\mu|^2/2}=1$. Take $\mathbf a = 2\boldsymbol\mu$: $\mathbb E[w^2] = e^{2|\boldsymbol\mu|^2}e^{-|\boldsymbol\mu|^2} = e^{|\boldsymbol\mu|^2}$. So $N_\text{eff}/N \to e^{-|\boldsymbol\mu|^2}$. With $|\boldsymbol\mu|^2 = n\cdot 0.5^2 = n/4$, that is $e^{-n/4}$ — a fixed factor of $e^{-1/4}\approx0.78$ lost per extra dimension. That is exponential decay, and the particles needed grow like $e^{n/4}$.
:::

::: key The practical killer of particle filters
Particle count needed grows exponentially with effective state dimension. Beyond a handful of dimensions you must Rao-Blackwellise: sample only the ambiguous dimensions, run an analytic Kalman filter for the rest.
:::

This is not a defect of any particular resampling or proposal trick. It is built into importance weighting itself in many dimensions. That is why a full-state particle filter on a navigation state with ten or more dimensions is rarely practical, however good it is at multiple peaks.

## Rao-Blackwellization: particles only where they are needed

The standard way out is not to give up on particles, but to shrink what they have to cover. Split the state in two:

- a small part that is truly nonlinear, non-Gaussian or ambiguous — the part that needs particles;
- the rest, which, *once you fix* the first part at one particle's value, is linear and Gaussian enough for an ordinary Kalman filter (or an EKF or UKF).

Then give each particle its own small Kalman filter for the second part. This is **[[Rao-Blackwellization|rao-blackwell-name]]**: sample the hard part, compute the easy part exactly.

In terrain matching the split is almost ready-made. Along-track position is the one genuinely ambiguous quantity — which valley am I over? — so it stays as particles. Velocity, attitude and sensor biases, once a particular along-track position is assumed, are well behaved, so they ride along in each particle's own Kalman filter. The particles then need to cover one dimension, not fifteen. The same split powers [[FastSLAM|fastslam]], where robot position is sampled and each landmark is a small Kalman filter.

::: key When a particle filter is the right call
Two conditions, both needed: the posterior is genuinely multi-modal or strongly non-Gaussian, **and** the part of the state that is ambiguous is small — a handful of dimensions, after Rao-Blackwellizing everything that can be.
:::

::: warning A particle filter's failure from too few particles does not announce itself
Nothing in the bootstrap recipe checks whether $N$ is enough for the problem's dimension. An under-provisioned filter still runs, still produces weights that sum to one, still reports an $N_\text{eff}$, and looks ordinary in code review. The only way to know is to measure, as this lesson did: compute $N_\text{eff}$ on the real problem and compare it with $N$ — and remember from the table that in many dimensions even a measured $N_\text{eff}$ can be too hopeful.
:::

::: warning Multi-modality alone does not automatically justify the dimensionality cost
The terrain example's ambiguity lived in one dimension — along-track position — which is exactly why a particle filter was a cheap, comfortable choice there. A problem that is multi-modal *and* high-dimensional in the ambiguous part is the hard case. Needing particles for the right reason (real multiple peaks) does not excuse a design from the wrong-reason cost (dimension) if the ambiguous part is not kept small.
:::

## Check yourself

::: check
In the single-Gaussian EKF example, $76$ of the $200$ trials ended on neither valley's track. Were those trials at least being honest about their uncertainty?
:::

::: answer
No. It would be tempting to read "ended on neither valley" as "stayed undecided", with a wide covariance saying "I don't know". The numbers say otherwise. Their median reported standard deviation was about $10\,\mathrm m$ — the tightest of the three groups — while their real errors were $1.5$ to $16\,\mathrm{km}$, and $69$ of them were stuck on the side of the first valley. They were confidently wrong, the same failure as the $64$ that locked onto the other valley. A single bell cannot hold two sharp, well-separated hypotheses at once, so it collapses around *something*, whether or not that something is right.
:::

::: check
Explain why the effective-sample-size table shows collapse even though every dimension carries the identical, modest half-sigma mismatch — nothing in any single axis got harder as $n$ grew.
:::

::: answer
The importance weight for $n$ independent axes is a product of $n$ per-axis correction factors. Each factor alone is mild, but their product's spread compounds with every axis added. Many "not too surprising" factors multiplied together give an overall weight distribution far more lopsided than any one axis suggests. Exactly, $N_\text{eff}/N \to e^{-n/4}$: each extra axis multiplies it by about $0.78$. The collapse comes purely from the number of axes, not from any axis getting harder.
:::

::: check
A team proposes a full-state, twelve-dimensional bootstrap particle filter for a spacecraft's position, velocity and attitude, citing this module's demonstration that particle filters handle multi-modal terrain matching well. What single number from this lesson would you ask them to check first?
:::

::: answer
The effective sample size their planned particle count actually achieves at twelve dimensions, measured on their problem — not assumed from the terrain example, whose ambiguity lived in one dimension. In this lesson's table, $N_\text{eff}/N$ was already down to about $1.7\%$ measured (and $0.7\%$ exact) at twenty dimensions for a mild mismatch. A particle count that felt generous in one dimension could be giving only a handful of effective samples in twelve, which is exactly what Rao-Blackwellization exists to avoid.
:::

::: check
How does Rao-Blackwellization change what the "dimension" in the curse-of-dimensionality argument actually refers to, for a filter that uses it?
:::

::: answer
It shrinks the dimension the particle weights must cover to only the genuinely ambiguous or strongly nonlinear part of the state. The well-behaved remainder is tracked by a Kalman-family filter attached to each particle, not by extra particle dimensions. The curse still applies in full to whatever dimension is left in the particle part. Rao-Blackwellization does not repeal it; it makes the number it applies to small.
:::

::: check
Suppose the two valleys in the EKF example had noticeably different depths — say $80\,\mathrm m$ and $50\,\mathrm m$ — instead of identical ones. Would you expect the $52\%$ wrong-valley rate to persist?
:::

::: answer
No. With different depths, even one altimeter reading near a valley has real power to tell which valley produced it, because the two hypotheses no longer predict the same height. The coin-flip rate came directly from building the valleys to look identical. Make them distinguishable and even a single-Gaussian filter should commit correctly more often than not. It would still be unable to represent the in-between stretch — while the data are ambiguous but not yet decisive — as honestly as a particle filter's weighted cloud.
:::

## Summary

| Item | Statement |
| --- | --- |
| Multi-modal posterior | Two or more separate peaks; a single bell can only average them (landing where neither says) or lock onto one |
| Where it happens | Terrain matching over look-alike ground, starting with no idea of the state (lost-in-space), data association; heavy tails from wild sensor readings |
| Terrain EKF, $200$ trials | $60$ right, $64$ on the other valley ($52\%$ of those that picked a valley), $76$ stuck elsewhere; all reporting tens of meters of uncertainty |
| Curse of dimensionality | $N_\text{eff}/N \to e^{-n/4}$ for a half-sigma offset per axis: $0.78$ at $n=1$, $5.5\times10^{-4}$ at $n=30$; measured values are optimistic in high $n$ |
| The practical killer | Particle count grows exponentially with effective state dimension |
| Remedy | Rao-Blackwellize: particles for the ambiguous few dimensions, a Kalman filter per particle for the rest |
| When to use a particle filter | Genuinely multi-modal or non-Gaussian **and** the ambiguous part is low-dimensional — both, not either |

The next lesson takes the middle road between one bell and thousands of particles: a small, fixed number of bells running side by side, enough to hold a handful of hypotheses at a cost far below a particle cloud.

::: context mode-word Why a peak is called a mode
"Mode" comes from the Latin *modus*, "measure" or "manner", and in everyday statistics the mode is the most common value — the shoe size a store sells most. For a smooth distribution, the most common values sit at the peaks, so each peak is a mode. "Bimodal" means two peaks: the heights of a mixed class of adults and small children, or the weight on two valleys.
:::

::: context heavy-tails Heavy tails, with numbers
A bell curve's tails fall off extremely fast. The chance of a reading more than $5$ standard deviations out is about $1$ in $1.7$ million. Real sensors produce "$5$-sigma" readings far more often than that — a GPS signal reflecting off a glass building, a radar echo from a bird. A distribution that allows those more often has heavy tails. A Gaussian filter, trusting its bell, treats such a reading as precious information and moves its estimate a long way to fit it.
:::

::: context bimodal-picture Two peaks and the one bell that matches them
Blue: the true belief, two sharp, equally likely peaks. Red dashed: the single bell with the same mean and spread. Its peak sits exactly where the truth has almost nothing.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 175" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="140" x2="340" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M20.0,140.0 L21.0,140.0 L22.0,140.0 L23.0,140.0 L24.0,140.0 L25.0,140.0 L26.0,140.0 L27.0,140.0 L28.0,140.0 L29.0,140.0 L30.0,140.0 L31.0,140.0 L32.0,140.0 L33.0,140.0 L34.0,140.0 L35.0,140.0 L36.0,140.0 L37.0,140.0 L38.0,140.0 L39.0,140.0 L40.0,140.0 L41.0,140.0 L42.0,140.0 L43.0,140.0 L44.0,140.0 L45.0,140.0 L46.0,140.0 L47.0,140.0 L48.0,140.0 L49.0,140.0 L50.0,140.0 L51.0,140.0 L52.0,140.0 L53.0,140.0 L54.0,140.0 L55.0,140.0 L56.0,140.0 L57.0,140.0 L58.0,140.0 L59.0,140.0 L60.0,140.0 L61.0,139.9 L62.0,139.9 L63.0,139.9 L64.0,139.8 L65.0,139.8 L66.0,139.7 L67.0,139.5 L68.0,139.3 L69.0,139.1 L70.0,138.8 L71.0,138.4 L72.0,137.8 L73.0,137.1 L74.0,136.3 L75.0,135.2 L76.0,133.8 L77.0,132.2 L78.0,130.2 L79.0,127.9 L80.0,125.1 L81.0,121.9 L82.0,118.2 L83.0,114.1 L84.0,109.4 L85.0,104.3 L86.0,98.7 L87.0,92.7 L88.0,86.5 L89.0,79.9 L90.0,73.3 L91.0,66.6 L92.0,60.1 L93.0,53.9 L94.0,48.1 L95.0,42.9 L96.0,38.5 L97.0,34.8 L98.0,32.2 L99.0,30.5 L100.0,30.0 L101.0,30.5 L102.0,32.2 L103.0,34.8 L104.0,38.5 L105.0,42.9 L106.0,48.1 L107.0,53.9 L108.0,60.1 L109.0,66.6 L110.0,73.3 L111.0,79.9 L112.0,86.5 L113.0,92.7 L114.0,98.7 L115.0,104.3 L116.0,109.4 L117.0,114.1 L118.0,118.2 L119.0,121.9 L120.0,125.1 L121.0,127.9 L122.0,130.2 L123.0,132.2 L124.0,133.8 L125.0,135.2 L126.0,136.3 L127.0,137.1 L128.0,137.8 L129.0,138.4 L130.0,138.8 L131.0,139.1 L132.0,139.3 L133.0,139.5 L134.0,139.7 L135.0,139.8 L136.0,139.8 L137.0,139.9 L138.0,139.9 L139.0,139.9 L140.0,140.0 L141.0,140.0 L142.0,140.0 L143.0,140.0 L144.0,140.0 L145.0,140.0 L146.0,140.0 L147.0,140.0 L148.0,140.0 L149.0,140.0 L150.0,140.0 L151.0,140.0 L152.0,140.0 L153.0,140.0 L154.0,140.0 L155.0,140.0 L156.0,140.0 L157.0,140.0 L158.0,140.0 L159.0,140.0 L160.0,140.0 L161.0,140.0 L162.0,140.0 L163.0,140.0 L164.0,140.0 L165.0,140.0 L166.0,140.0 L167.0,140.0 L168.0,140.0 L169.0,140.0 L170.0,140.0 L171.0,140.0 L172.0,140.0 L173.0,140.0 L174.0,140.0 L175.0,140.0 L176.0,140.0 L177.0,140.0 L178.0,140.0 L179.0,140.0 L180.0,140.0 L181.0,140.0 L182.0,140.0 L183.0,140.0 L184.0,140.0 L185.0,140.0 L186.0,140.0 L187.0,140.0 L188.0,140.0 L189.0,140.0 L190.0,140.0 L191.0,140.0 L192.0,140.0 L193.0,140.0 L194.0,140.0 L195.0,140.0 L196.0,140.0 L197.0,140.0 L198.0,140.0 L199.0,140.0 L200.0,140.0 L201.0,140.0 L202.0,140.0 L203.0,140.0 L204.0,140.0 L205.0,140.0 L206.0,140.0 L207.0,140.0 L208.0,140.0 L209.0,140.0 L210.0,140.0 L211.0,140.0 L212.0,140.0 L213.0,140.0 L214.0,140.0 L215.0,140.0 L216.0,140.0 L217.0,140.0 L218.0,140.0 L219.0,140.0 L220.0,140.0 L221.0,139.9 L222.0,139.9 L223.0,139.9 L224.0,139.8 L225.0,139.8 L226.0,139.7 L227.0,139.5 L228.0,139.3 L229.0,139.1 L230.0,138.8 L231.0,138.4 L232.0,137.8 L233.0,137.1 L234.0,136.3 L235.0,135.2 L236.0,133.8 L237.0,132.2 L238.0,130.2 L239.0,127.9 L240.0,125.1 L241.0,121.9 L242.0,118.2 L243.0,114.1 L244.0,109.4 L245.0,104.3 L246.0,98.7 L247.0,92.7 L248.0,86.5 L249.0,79.9 L250.0,73.3 L251.0,66.6 L252.0,60.1 L253.0,53.9 L254.0,48.1 L255.0,42.9 L256.0,38.5 L257.0,34.8 L258.0,32.2 L259.0,30.5 L260.0,30.0 L261.0,30.5 L262.0,32.2 L263.0,34.8 L264.0,38.5 L265.0,42.9 L266.0,48.1 L267.0,53.9 L268.0,60.1 L269.0,66.6 L270.0,73.3 L271.0,79.9 L272.0,86.5 L273.0,92.7 L274.0,98.7 L275.0,104.3 L276.0,109.4 L277.0,114.1 L278.0,118.2 L279.0,121.9 L280.0,125.1 L281.0,127.9 L282.0,130.2 L283.0,132.2 L284.0,133.8 L285.0,135.2 L286.0,136.3 L287.0,137.1 L288.0,137.8 L289.0,138.4 L290.0,138.8 L291.0,139.1 L292.0,139.3 L293.0,139.5 L294.0,139.7 L295.0,139.8 L296.0,139.8 L297.0,139.9 L298.0,139.9 L299.0,139.9 L300.0,140.0 L301.0,140.0 L302.0,140.0 L303.0,140.0 L304.0,140.0 L305.0,140.0 L306.0,140.0 L307.0,140.0 L308.0,140.0 L309.0,140.0 L310.0,140.0 L311.0,140.0 L312.0,140.0 L313.0,140.0 L314.0,140.0 L315.0,140.0 L316.0,140.0 L317.0,140.0 L318.0,140.0 L319.0,140.0 L320.0,140.0 L321.0,140.0 L322.0,140.0 L323.0,140.0 L324.0,140.0 L325.0,140.0 L326.0,140.0 L327.0,140.0 L328.0,140.0 L329.0,140.0 L330.0,140.0 L331.0,140.0 L332.0,140.0 L333.0,140.0 L334.0,140.0 L335.0,140.0 L336.0,140.0 L337.0,140.0 L338.0,140.0 L339.0,140.0 L340.0,140.0" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <path d="M20.0,136.2 L24.0,135.8 L28.0,135.4 L32.0,134.9 L36.0,134.5 L40.0,134.0 L44.0,133.4 L48.0,132.9 L52.0,132.3 L56.0,131.6 L60.0,131.0 L64.0,130.3 L68.0,129.6 L72.0,128.9 L76.0,128.1 L80.0,127.4 L84.0,126.6 L88.0,125.8 L92.0,125.0 L96.0,124.1 L100.0,123.3 L104.0,122.5 L108.0,121.7 L112.0,120.9 L116.0,120.1 L120.0,119.3 L124.0,118.6 L128.0,117.8 L132.0,117.1 L136.0,116.5 L140.0,115.9 L144.0,115.3 L148.0,114.8 L152.0,114.3 L156.0,113.9 L160.0,113.5 L164.0,113.2 L168.0,113.0 L172.0,112.8 L176.0,112.7 L180.0,112.7 L184.0,112.7 L188.0,112.8 L192.0,113.0 L196.0,113.2 L200.0,113.5 L204.0,113.9 L208.0,114.3 L212.0,114.8 L216.0,115.3 L220.0,115.9 L224.0,116.5 L228.0,117.1 L232.0,117.8 L236.0,118.6 L240.0,119.3 L244.0,120.1 L248.0,120.9 L252.0,121.7 L256.0,122.5 L260.0,123.3 L264.0,124.1 L268.0,125.0 L272.0,125.8 L276.0,126.6 L280.0,127.4 L284.0,128.1 L288.0,128.9 L292.0,129.6 L296.0,130.3 L300.0,131.0 L304.0,131.6 L308.0,132.3 L312.0,132.9 L316.0,133.4 L320.0,134.0 L324.0,134.5 L328.0,134.9 L332.0,135.4 L336.0,135.8 L340.0,136.2" fill="none" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 4"/>
  <line x1="180" y1="140" x2="180" y2="146" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="100" y1="140" x2="100" y2="146" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="260" y1="140" x2="260" y2="146" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle"><text x="100" y="160">6 km</text><text x="180" y="160">10 km</text><text x="260" y="160">14 km</text></g>
  <text x="112" y="40" font-size="11" fill="#1d6fd1">valley 1</text>
  <text x="272" y="40" font-size="11" fill="#1d6fd1">valley 2</text>
  <text x="180" y="104" font-size="11" fill="#b4232c" text-anchor="middle">one bell</text>
</svg>
```

The bell is also far lower and wider than either true peak: it is spreading its belief across kilometers of empty ground between the valleys.
:::

::: context lost-in-space The lost-in-space problem
A star tracker normally knows roughly where it is pointing and only needs to refine that. After a reset or a tumble it knows nothing, and must recognize a patch of sky from scratch by matching the pattern of bright stars against a catalog. Engineers call this "lost in space". Several patches of sky can look alike to a small camera, so the early belief can have several peaks — exactly the situation a single bell cannot hold. Star trackers usually solve it with pattern-matching searches, but the filter that takes over afterward must be told which peak won.
:::

::: context data-association Which blip is which
Air-traffic and missile-defense radars track many objects at once. Each sweep returns a set of unlabeled blips. Deciding which blip came from which object is data association. If you guess wrong, the filter updates the right target with the wrong measurement, and the error can stick. Keeping several pairings alive until later sweeps settle them is one of the oldest uses of multi-hypothesis filters in tracking.
:::

::: context coin-flip Is 64 out of 124 really a coin flip?
If each of the $124$ trials had a fair $50\%$ chance of going wrong, you would expect $62$ wrong, give or take about $5.6$ (the standard deviation of that count). Getting $64$ is less than half a standard deviation from $62$. A standard test puts the chance of landing at least this far from $62$ by luck alone at about $79\%$. So the data give no evidence the EKF does any better than guessing when it picks a valley.
:::

::: context curse-name Who named the curse
The phrase "curse of dimensionality" was coined by the mathematician Richard Bellman in 1957, in his work on dynamic programming. He meant that a grid with $10$ points per axis needs $10$ points in one dimension, $100$ in two, and $10^{n}$ in $n$ dimensions. Particle filters meet the same curse in a sneakier form: the particles are not on a grid, but they still have to land near the truth in every dimension at once.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 195" font-family="Inter, Arial, sans-serif">
  <line x1="26" y1="133" x2="350" y2="133" stroke="#6c7a93" stroke-width="0.8" stroke-dasharray="3 3"/>
  <text x="24" y="137" font-size="11" fill="#6c7a93" text-anchor="end">10³</text>
  <line x1="26" y1="106" x2="350" y2="106" stroke="#6c7a93" stroke-width="0.8" stroke-dasharray="3 3"/>
  <text x="24" y="110" font-size="11" fill="#6c7a93" text-anchor="end">10⁶</text>
  <line x1="26" y1="79" x2="350" y2="79" stroke="#6c7a93" stroke-width="0.8" stroke-dasharray="3 3"/>
  <text x="24" y="83" font-size="11" fill="#6c7a93" text-anchor="end">10⁹</text>
  <line x1="26" y1="52" x2="350" y2="52" stroke="#6c7a93" stroke-width="0.8" stroke-dasharray="3 3"/>
  <text x="24" y="56" font-size="11" fill="#6c7a93" text-anchor="end">10¹²</text>
  <line x1="26" y1="25" x2="350" y2="25" stroke="#6c7a93" stroke-width="0.8" stroke-dasharray="3 3"/>
  <text x="24" y="29" font-size="11" fill="#6c7a93" text-anchor="end">10¹⁵</text>
  <line x1="26" y1="160" x2="350" y2="160" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="32" y="141.0" width="26" height="19.0" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <text x="45" y="174" font-size="11" fill="#1f2a44" text-anchor="middle">1</text>
  <rect x="76" y="132.2" width="26" height="27.8" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <text x="89" y="174" font-size="11" fill="#1f2a44" text-anchor="middle">10</text>
  <rect x="120" y="122.5" width="26" height="37.5" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <text x="133" y="174" font-size="11" fill="#1f2a44" text-anchor="middle">20</text>
  <rect x="164" y="112.7" width="26" height="47.3" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <text x="177" y="174" font-size="11" fill="#1f2a44" text-anchor="middle">30</text>
  <rect x="208" y="93.1" width="26" height="66.9" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <text x="221" y="174" font-size="11" fill="#1f2a44" text-anchor="middle">50</text>
  <rect x="252" y="63.8" width="26" height="96.2" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <text x="265" y="174" font-size="11" fill="#1f2a44" text-anchor="middle">80</text>
  <rect x="296" y="24.7" width="26" height="135.3" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <text x="309" y="174" font-size="11" fill="#1f2a44" text-anchor="middle">120</text>
  <text x="190" y="190" font-size="11" fill="#1f2a44" text-anchor="middle">dimensions n</text>
</svg>
```

Particles needed to keep $100$ effective samples, for the half-sigma offset of this lesson, on a scale where each grid line is a factor of $1000$.
:::

::: context rao-blackwell-name Two statisticians, one theorem
The name comes from the Rao–Blackwell theorem, proved independently by C. R. Rao in 1945 and David Blackwell in 1947. It says, roughly: if you can replace part of a random estimate with its exact average, the estimate can only get better, never worse. In a particle filter, the "exact average" is the Kalman filter's answer for the easy part of the state. Sampling that part too would only add noise.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="120" x2="340" y2="120" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="340,120 330,115 330,125" fill="#1f2a44"/>
  <g fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5">
    <ellipse cx="60" cy="75" rx="9" ry="22"/><ellipse cx="110" cy="70" rx="9" ry="16"/><ellipse cx="150" cy="80" rx="9" ry="26"/>
    <ellipse cx="230" cy="72" rx="9" ry="18"/><ellipse cx="275" cy="78" rx="9" ry="24"/><ellipse cx="310" cy="70" rx="9" ry="15"/>
  </g>
  <g fill="#b4232c"><circle cx="60" cy="120" r="4"/><circle cx="110" cy="120" r="4"/><circle cx="150" cy="120" r="4"/><circle cx="230" cy="120" r="4"/><circle cx="275" cy="120" r="4"/><circle cx="310" cy="120" r="4"/></g>
  <g stroke="#6c7a93" stroke-width="1" stroke-dasharray="2 3"><line x1="60" y1="97" x2="60" y2="116"/><line x1="110" y1="86" x2="110" y2="116"/><line x1="150" y1="106" x2="150" y2="116"/><line x1="230" y1="90" x2="230" y2="116"/><line x1="275" y1="102" x2="275" y2="116"/><line x1="310" y1="85" x2="310" y2="116"/></g>
  <text x="20" y="142" font-size="11" fill="#b4232c">particles: along-track position only</text>
  <text x="20" y="28" font-size="11" fill="#1d6fd1">each carries its own small Kalman filter</text>
  <text x="20" y="42" font-size="11" fill="#1d6fd1">for velocity, attitude and biases</text>
</svg>
```
:::

::: context fastslam Mapping and locating at the same time
SLAM stands for simultaneous localization and mapping: a robot builds a map of landmarks while working out where it is on that map. FastSLAM, published by Michael Montemerlo and colleagues in 2002, uses particles only for the robot's path. Given one particle's path, each landmark's position is an independent, well-behaved problem, so each gets its own tiny Kalman filter. That split lets a few hundred particles handle maps with thousands of landmarks.
:::
