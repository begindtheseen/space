---
id: l07-particle-filters
title: Particle filters — sequential importance sampling and resampling
minutes: 28
covers:
  - 'Particle filters: sequential importance sampling, resampling, degeneracy and sample impoverishment'
---

Imagine you have lost your dog in a big park. You call two thousand friends, and each one goes and stands at a spot where the dog *might* be. Every few seconds you get a clue — "someone heard barking near water" — and each friend asks: "if the dog were right where I am standing, how likely is that clue?" Friends standing by the pond get louder voices. Friends in the dry parking lot get quieter ones. Then everybody takes a step in the direction the dog was last seen running, and the next clue arrives. After a while the loud voices are all bunched in one place, and that place is where the dog is.

That crowd of guessers is a **particle filter**: a filter that describes what it believes about the state with a big crowd of sample guesses, each carrying a "how much do I believe this one" number. Each guess is called a **particle**. Its belief number is its **weight**.

Every filter so far in this module — EKF, UKF, CKF — promises that its belief is one bell curve: one mean, one covariance. A particle filter drops that promise. The crowd can take any shape the truth has: lopsided, long-tailed, or split into two bunches. As the number of particles grows without limit, the crowd settles onto the true answer, with no linearization and no Jacobian anywhere. Robots find themselves in buildings this way, and aircraft can fix their position by matching a **[[radar altimeter|terrain-matching]]** against a height map of the ground below.

That freedom has a price. Left alone, the weights pile up on a single particle — **degeneracy**. The standard fix, resampling, causes a second failure, **sample impoverishment**, if used carelessly. You will see both happen, with real counts from a running filter.

## A crowd of weighted guesses

Start with what the filter is trying to describe. At time step $k$, after the measurements $\mathbf z_1,\dots,\mathbf z_k$ have come in, everything the filter believes about the state $\mathbf x_k$ is a probability distribution, the **posterior** $p(\mathbf x_k\mid\mathbf z_{1:k})$. Read it as "the probability of x k, given z one through k". A Kalman filter stores it as a mean and a covariance. A particle filter stores it as a list.

The list has $N$ entries. Entry number $i$ is a pair: a particle $\mathbf x_k^{(i)}$ (read "x k, particle i"), which is one complete, concrete guess of the state, and its weight $w_k^{(i)}$. The weights are positive and add up to one:

$$
\sum_{i=1}^N w_k^{(i)} = 1.
$$

The list stands in for the whole distribution:

$$
p(\mathbf x_k\mid\mathbf z_{1:k})\approx\sum_{i=1}^N w_k^{(i)}\,\delta\big(\mathbf x_k-\mathbf x_k^{(i)}\big).
$$

The symbol $\delta$ ("delta") is a **[[spike|dirac-spike]]**: an infinitely thin, infinitely tall bump at one point, holding a total amount of one. So the right-hand side is a row of thin spikes, one at each particle, each as heavy as its weight. Up close it looks nothing like a smooth curve. But ask it any average — "what is the mean position?", "what is the chance the vehicle is past the ridge?" — and the answer comes out close to the true one, closer as $N$ grows.

For example, the filter's mean estimate is the weighted average of the particles:

$$
\hat{\mathbf x}_k = \sum_{i=1}^N w_k^{(i)}\mathbf x_k^{(i)}.
$$

An autopilot often wants that one number. But if the particles sit in two separate bunches, the cloud *says so*. A single mean and covariance cannot.

## One cycle: move, then weigh

A particle filter runs in the same rhythm as a Kalman filter: predict, then update. Here is the simplest and most common version, the **[[bootstrap particle filter|bootstrap-name]]**.

**Move.** Push every particle through the true motion rule $\mathbf f$, and give each one its own fresh random draw of process noise. Particle $i$ gets noise $\mathbf w^{(i)}$, drawn from the noise distribution $p(\mathbf w)$. Different particles get different draws, so the cloud spreads out the way the real uncertainty spreads out.

**Weigh.** When measurement $\mathbf z_k$ arrives, ask of each particle: "if the state really were $\mathbf x_k^{(i)}$, how probable is the reading I got?" That number is the **[[likelihood|likelihood-meaning]]** $p(\mathbf z_k\mid\mathbf x_k^{(i)})$, read "p of z k given x k i". Multiply the particle's old weight by it. Then divide every weight by their total so they add up to one again — that step is called **normalizing**.

::: key The bootstrap particle filter, one cycle
$$
\mathbf x_k^{(i)} = \mathbf f\big(\mathbf x_{k-1}^{(i)}\big) + \mathbf w^{(i)}, \qquad \mathbf w^{(i)}\sim p(\mathbf w), \qquad w_k^{(i)} \propto w_{k-1}^{(i)}\cdot p\big(\mathbf z_k\mid \mathbf x_k^{(i)}\big),
$$
followed by normalizing $w_k^{(i)}$ so the weights sum to one. Both $\mathbf f$ and the measurement likelihood $p(\mathbf z_k\mid\mathbf x_k^{(i)})$ are the true, unmodified functions — nothing here is linearized, and $p(\mathbf z_k\mid\mathbf x_k^{(i)})$ need not even be Gaussian.
:::

The symbol $\propto$ reads "is proportional to": the left side equals the right side times some constant that is the same for every particle. Normalizing fixes that constant.

::: key Bootstrap particle filter loop
Propagate each particle through the dynamics with sampled noise, weight by the measurement likelihood, normalize, and resample when the effective sample size drops below a threshold (often $N/2$).
:::

Notice what is *not* in the recipe: no covariance matrix to push forward, and no Jacobian. Every particle goes through the real, curved $\mathbf f$, and every weight uses the real sensor model, whatever shape its noise has.

This whole scheme has a name that says what it does. **Sequential importance sampling** means: represent a distribution by samples (sampling), give each sample a weight that corrects for where it was drawn from ([[importance|importance-name]]), and update both one time step after another (sequential).

::: example Weighing three particles against one altimeter reading
A plane's radar altimeter reads $z = 430\,\mathrm m$ above the ground. Its noise is Gaussian with standard deviation $\sigma = 2\,\mathrm m$. Three particles, currently of equal weight $1/3$, sit at three positions along the flight track. From the terrain map, each one predicts what the altimeter *should* read if the plane were there: $429\,\mathrm m$, $433\,\mathrm m$ and $440\,\mathrm m$.

**Step 1: the misses.** Subtract each prediction from the reading: $430-429 = 1\,\mathrm m$, $430-433=-3\,\mathrm m$, $430-440=-10\,\mathrm m$.

**Step 2: the likelihoods.** For Gaussian noise, the likelihood is proportional to $\exp\!\big(-\tfrac12 (r/\sigma)^2\big)$, where $r$ is the miss. (The constant in front of a bell curve is the same for all three, so it drops out at normalizing.)

$$
e^{-\frac12(1/2)^2}=0.8825, \qquad e^{-\frac12(3/2)^2}=0.3247, \qquad e^{-\frac12(10/2)^2}=3.727\times10^{-6}.
$$

**Step 3: multiply by the old weights and normalize.** The old weights are all equal, so they cancel. The total is $0.8825+0.3247+0.0000037=1.2072$. Divide each likelihood by it:

$$
w^{(1)} = 0.731, \qquad w^{(2)} = 0.269, \qquad w^{(3)} = 3.09\times10^{-6}.
$$

**Sanity check.** The weights add up to one. The half-sigma miss gets most of the belief; the five-sigma miss is all but ruled out. That is what a reading with $2\,\mathrm m$ of noise should do.
:::

::: note Why the weight update has to be true
Bayes' rule says the new belief is the old belief, pushed forward by the motion, times the likelihood of the new reading, divided by a constant:
$$
p(\mathbf x_k\mid\mathbf z_{1:k}) \propto p(\mathbf z_k\mid\mathbf x_k)\,p(\mathbf x_k\mid\mathbf z_{1:k-1}).
$$
The move step draws each particle from $p(\mathbf x_k\mid\mathbf x_{k-1}^{(i)})$, the motion rule plus noise, so before the reading the weighted cloud is a fair sample of the predicted belief $p(\mathbf x_k\mid\mathbf z_{1:k-1})$. To make it a fair sample of the posterior instead, reweight each particle by the ratio "posterior over predicted" at its own position. By Bayes' rule that ratio is the likelihood $p(\mathbf z_k\mid\mathbf x_k^{(i)})$, up to a constant. The constant is the same for every particle, so normalizing removes it. That is the key block's update, and nothing in it assumed a Gaussian.
:::

::: example A particle filter resolving a genuinely ambiguous position
A vehicle flies at a known, steady altitude and airspeed ($100\,\mathrm{m/s}$) along a track, with a radar altimeter reading its height above the ground (noise $\sigma = 2\,\mathrm m$). The terrain has two valleys of nearly the same shape, each $80\,\mathrm m$ deep, with centers $8\,\mathrm{km}$ apart. So one altimeter reading taken near either valley cannot tell you which valley produced it. The only difference is a small $15\,\mathrm m$ hump on the far side of the first valley, with nothing like it near the second.

The vehicle really starts in the first valley; the filter does not know that. It scatters $2000$ particles evenly across a $14\,\mathrm{km}$ window covering both valleys, and resamples whenever the effective sample size $N_\text{eff}$ drops below $N/2$ (explained later in this lesson). The table adds up the weight of the particles nearer each valley's track.

| $t\,(\mathrm s)$ | weight on valley $1$ (true) | weight on valley $2$ | $N_\text{eff}$ |
| --- | --- | --- | --- |
| $1$ | $0.379$ | $0.621$ | $70.8$ |
| $5$ | $0.314$ | $0.686$ | $1277.7$ |
| $10$ | $0.248$ | $0.752$ | $1986.7$ |
| $15$ | $0.404$ | $0.596$ | $1592.0$ |
| $20$ | $1.000$ | $0.000$ | $1885.9$ |
| $30$ | $1.000$ | $0.000$ | $1244.5$ |

**Reading the table.** For fifteen seconds the weight is split between the valleys. At $t=10\,\mathrm s$ the filter even leans toward the *wrong* one, $75\%$ to $25\%$. That is not a bug: the readings so far fit both valleys, and the noise happened to fit the wrong one a little better.

Then the vehicle reaches the hump. Only valley-1 particles predicted it; the valley-2 particles predicted flat ground and missed by many standard deviations. By $t=20\,\mathrm s$ their weight is essentially zero. The filter never had to bet on one valley before the data justified it.

**Sanity check.** $N_\text{eff}$ is $70.8$ at $t=1\,\mathrm s$: the very first reading already ruled out most of the $14\,\mathrm{km}$ window (particles over flat ground, where the altimeter would have read something else). Resampling then restored a healthy cloud, which is why the column never falls toward $1$ even while two hypotheses are alive.
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
N, A0, v, dt = 2000, 1000.0, 0.1, 1.0        # distances in km, heights in m
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

## When the weights pile up: degeneracy

Even a correctly working particle filter does not keep its weights even. Think of a game where each round, every player's score is multiplied by how well they guessed. After many rounds, one or two players have almost all the points.

Each cycle multiplies every weight by one more likelihood, so the same thing happens — that is Bayes' rule at work. Pushed to the extreme, nearly all the weight sits on a single particle: **degeneracy**. The other $N-1$ particles still cost computer time every cycle, while adding almost nothing to any average.

You need a number that says how bad it is. That number is the **effective sample size**: roughly, "how many equally weighted particles is this lopsided cloud worth?"

::: key Effective sample size
$$
N_{\text{eff}} = \frac{1}{\sum_{i=1}^N \big(w^{(i)}\big)^2}, \qquad w^{(i)}\text{ normalized so }\textstyle\sum_i w^{(i)}=1.
$$
$N_{\text{eff}}=N$ exactly when every weight is equal ($1/N$); $N_{\text{eff}}=1$ exactly when a single particle carries all the weight, regardless of how many particles are nominally in the cloud. $N_{\text{eff}}$ depends only on the *shape* of the weight distribution, not its overall scale — multiplying every unnormalized weight by the same constant leaves it unchanged.
:::

::: key Effective sample size, in one line
$N_\text{eff}$ = 1 / sum of the squared normalized weights. It falls to $1$ when one particle holds all the weight (degeneracy). Resample on $N_\text{eff}$, not every step, and add roughening to avoid impoverishment.
:::

Check the ends: all weights $1/N$ gives a sum of squares $N\cdot(1/N)^2 = 1/N$, so $N_\text{eff} = N$; one weight of $1$ gives $N_\text{eff}=1$.

::: example Two small clouds
**Four particles, weights $0.4, 0.3, 0.2, 0.1$.** Square each: $0.16, 0.09, 0.04, 0.01$. Add: $0.30$. Flip: $N_\text{eff} = 1/0.30 = 3.33$. Mildly lopsided.

**Four particles, weights $0.97, 0.01, 0.01, 0.01$.** Squares: $0.9409$ and three of $0.0001$. Sum: $0.9412$. $N_\text{eff} = 1/0.9412 = 1.06$. Four particles on paper, but worth barely more than one. That cloud is degenerate.

**Sanity check.** Both answers sit between $1$ and $N = 4$, as they must.
:::

::: note Why N_eff always lands between 1 and N
The upper end: the weights add up to one, and the sum of squares of $N$ positive numbers with a fixed total is smallest when they are all equal (spreading evenly always lowers a sum of squares). The smallest sum of squares is $1/N$, so $N_\text{eff}\le N$. The lower end: each weight is at most one, so $(w^{(i)})^2 \le w^{(i)}$, and adding up gives $\sum_i (w^{(i)})^2 \le \sum_i w^{(i)} = 1$. So $N_\text{eff}\ge 1$.
:::

In the terrain example, $N_\text{eff}$ fell from $2000$ to $70.8$ after the first measurement alone. That is how sharply one altimeter reading separated plausible positions from impossible ones.

## Resampling: moving the crowd to where it matters

The fix for degeneracy is **resampling**: build a brand-new set of $N$ particles by drawing from the current weighted cloud. Heavy particles are likely to be drawn, possibly several times. Light particles are likely to be dropped. Then every weight is reset to $1/N$.

Resampling adds no new information. It moves the computer's effort onto the particles that currently matter, and off the ones that do not.

The standard way to draw is **systematic resampling**, which needs only one random number. Lay the weights end to end along a ruler from $0$ to $1$, each particle owning a stretch as long as its weight. Lay a [[comb|comb-picture]] of $N$ teeth, $1/N$ apart, along the ruler, shifted by one random amount $u/N$ with $u$ between $0$ and $1$. Each tooth gives one copy to the particle whose stretch it lands in. A particle with weight $w$ gets about $N w$ copies — never fewer than the whole part of $Nw$ rounded down, never more than rounded up.

::: example Systematic resampling by hand
Four particles have weights $0.1, 0.4, 0.3, 0.2$. Take $u = 0.5$.

**Step 1: the ruler.** Add the weights up as you go (the **cumulative sum**): $0.1, 0.5, 0.8, 1.0$. So particle 0 owns $[0, 0.1)$, particle 1 owns $[0.1, 0.5)$, particle 2 owns $[0.5, 0.8)$ and particle 3 owns $[0.8, 1.0]$.

**Step 2: the comb.** The teeth sit at $(j + u)/N$ for $j = 0,1,2,3$: that is $0.125, 0.375, 0.625, 0.875$.

**Step 3: read off the owners.** $0.125$ and $0.375$ fall in particle 1's stretch. $0.625$ falls in particle 2's. $0.875$ falls in particle 3's. The new parents are $[1, 1, 2, 3]$.

**Sanity check.** The expected copies are $N w = 0.4, 1.6, 1.2, 0.8$. Particle 0 got $0$, particle 1 got $2$, particle 2 got $1$, particle 3 got $1$ — each one within one of its expected count, and four particles in total, as there must be.
:::

## Resampling's own trap: impoverishment

Resampling looks like pure improvement: even weights, $N_\text{eff}$ back to $N$. So why not resample every cycle?

Because every resample is a [[family-tree bottleneck|family-tree]]. Light particles vanish, replaced by exact copies of heavier ones. Do this over and over, with nothing to make the copies differ, and the number of *distinct* values shrinks: $500$ particles, but copies of a handful of ancestors. This is **sample impoverishment**. It is dangerous because $N_\text{eff}$ cannot see it: right after a resample every weight is equal, so $N_\text{eff}$ looks perfect however many particles are twins.

::: example Impoverishment, counted directly
Estimate a fixed, unknown range $r=500\,\mathrm m$ from repeated noisy measurements with $\sigma_z=5\,\mathrm m$. Use $500$ particles, start them spread around $490\,\mathrm m$ with standard deviation $20\,\mathrm m$, and apply **systematic resampling every single cycle**, adding nothing afterward. Nothing moves — the range is fixed, so there is no process noise to spread copies apart. Track both $N_\text{eff}$ and the number of *distinct* particle values still alive:

| cycle | $N_\text{eff}$ immediately before resampling | distinct particle values remaining |
| --- | --- | --- |
| $0$ | $158.9$ | $202$ |
| $8$ | $389.5$ | $69$ |
| $16$ | $454.8$ | $51$ |
| $24$ | $481.0$ | $41$ |
| $32$ | $379.0$ | $36$ |
| $39$ | $497.7$ | $35$ |

**Reading the table.** $N_\text{eff}$ never comes near $1$; its lowest value in all forty cycles is $158.9$, in the first. Each cycle applies only *one* likelihood to an evenly weighted cloud, which rarely looks lopsided. Meanwhile the diversity drains away: $500$ distinct values down to $35$. $N_\text{eff}$ is worked out fresh from equal weights each time and has no memory of which particles are copies.

**The fix.** After each resample, add a little independent random jitter to every particle — **[[roughening|roughening-name]]** — here with standard deviation $0.4\,\mathrm m$. Rerun the same forty cycles and all $500$ values stay distinct at every cycle.

**Sanity check.** Forty readings with $5\,\mathrm m$ noise should pin the range to about $5/\sqrt{40} \approx 0.79\,\mathrm m$. The un-roughened cloud's spread at the end is $0.77\,\mathrm m$ — about right, but carried by only $35$ distinct values. The roughened cloud's spread is $1.46\,\mathrm m$: every value is distinct, but the jitter has made the cloud wider than the data justify. Roughening has a cost too (the last Check yourself question comes back to this).
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
    # roughening would go here: particles += rng.normal(0, 0.4, N)
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
Resample only when $N_\text{eff}$ drops below a threshold, commonly $N/2$, rather than every cycle — this keeps degeneracy from ever becoming severe while resampling far less often than "always", which is most of what impoverishment needs to become a problem. Add a small amount of roughening after every resample regardless, since even threshold-triggered resampling is still a genealogical bottleneck each time it fires.
:::

::: warning "Effective sample size looks fine" does not mean the particle population is healthy
In the impoverishment example, $N_\text{eff}$ never dropped below about $150$ out of $500$. By the usual degeneracy test, the filter never looked troubled; the distinct-value count tells a different story. Any check built only from the current weights, looked at right after a resample, is blind to impoverishment, because resampling resets the weights to equal however few distinct ancestors they describe.
:::

::: warning A particle filter with too few particles for the state dimension will not announce itself as broken
Nothing in the bootstrap recipe checks whether $N$ is big enough. The algorithm runs and reports an $N_\text{eff}$ whether or not the cloud covers the part of the state space that matters. The [[next lesson|next-lesson-curse]] makes this precise and measures it, because it is the one practical limit that decides whether a particle filter is a sensible engineering choice.
:::

## Check yourself

::: check
In the bootstrap particle filter's weight update, which parts of the algorithm involve any linearization of $\mathbf f$ or of the measurement model?
:::

::: answer
None. Every particle goes through the true $\mathbf f$ with its own sampled noise, and every weight uses the true likelihood $p(\mathbf z_k\mid\mathbf x_k^{(i)})$ at that particle's own predicted measurement. No Jacobian, no Taylor expansion and no Gaussian assumption appears anywhere.
:::

::: check
At $t=10\,\mathrm s$ in the terrain example, the particle filter put more weight on the wrong valley than on the right one. Was this a filter error?
:::

::: answer
No — it was the honest response to ambiguous data. The vehicle had not yet reached the hump, so readings that fit both basins can slightly favor whichever one the noise happened to match. A filter that locked onto one valley before the data justified it would be the one making the mistake. The weight moving firmly to the true valley once the hump arrived, instead of staying stuck on the early favorite, shows the filter working.
:::

::: check
Explain precisely why $N_\text{eff}$ is unaffected by multiplying every particle's unnormalized weight by the same constant.
:::

::: answer
$N_\text{eff}=1/\sum_i(w^{(i)})^2$ is defined on the *normalized* weights, and normalizing divides out any common factor before the squares are added. If every raw weight is multiplied by $c$, the normalized weight is $c\,w^{(i)}_{\text{raw}}/\sum_j c\,w^{(j)}_{\text{raw}}$. The $c$ on top and the $c$ on the bottom cancel exactly, leaving the same normalized weights and so the same $N_\text{eff}$. It depends only on the relative shape of the weights, never on their overall size. (For example, raw weights $3, 1, 1, 1$ and $51, 17, 17, 17$ both normalize to $0.5, 1/6, 1/6, 1/6$ and give $N_\text{eff} = 3$.)
:::

::: check
A colleague says resampling every cycle is the "safest" choice because it guarantees $N_\text{eff}=N$ right afterward, at every step. What is wrong with using this reasoning alone to justify the choice?
:::

::: answer
$N_\text{eff}=N$ right after any resample is true by construction — every weight is reset to $1/N$. It says nothing about whether the particles are still diverse or copies of a shrinking set of ancestors. The impoverishment example showed exactly this: $N_\text{eff}$ looked healthy while distinct values collapsed from $500$ to $35$. "Resample every cycle to be safe" causes that failure rather than preventing it.
:::

::: check
Suppose roughening is added, but its standard deviation is chosen far too large compared with the measurement precision. What would you expect to happen to the filter's accuracy, even though impoverishment would no longer be a problem?
:::

::: answer
Roughening adds noise that no data asked for. Make it far larger than the measurement precision and it spreads the particles well beyond the true posterior, hurting accuracy and inflating the uncertainty — even though diversity is restored. The impoverishment example already shows the start of this: $0.4\,\mathrm m$ of roughening every cycle left the cloud $1.46\,\mathrm m$ wide where the data supported about $0.79\,\mathrm m$. Too little and impoverishment returns; too much and the added noise drowns the measurements. There is no safe large default.
:::

## Summary

| Item | Statement |
| --- | --- |
| Particles and weights | The posterior is a cloud of $N$ guesses $\mathbf x_k^{(i)}$ with weights $w_k^{(i)}$ that sum to one; the mean estimate is $\sum_i w_k^{(i)}\mathbf x_k^{(i)}$ |
| Bootstrap particle filter | Propagate every particle through the true $\mathbf f$ with sampled noise; reweight by the true measurement likelihood $p(\mathbf z_k\mid\mathbf x_k^{(i)})$; normalize; no linearization anywhere |
| Effective sample size | $N_\text{eff}=1/\sum_i(w^{(i)})^2$; between $1$ and $N$; falls toward $1$ as weight piles onto few particles (degeneracy); unaffected by the weights' overall scale |
| Resampling | Draw a new cloud weighted toward heavy particles, reset weights to $1/N$; systematic resampling uses one random number and a comb of $N$ evenly spaced teeth |
| Sample impoverishment | Frequent resampling without jitter collapses the number of *distinct* values — invisible to $N_\text{eff}$ |
| Standard practice | Resample only when $N_\text{eff}$ falls below a threshold (often $N/2$), and add roughening after every resample that fires |
| Demonstrated | Terrain: $25\%$–$40\%$ on the true valley early, resolved once the hump arrived. Impoverishment: $500\to35$ distinct values in $40$ resamples; $500\to500$ with roughening |

The next lesson makes precise when a particle filter is worth its cost, and names the practical limit that keeps it from replacing the EKF and UKF everywhere.

::: context terrain-matching Navigating by the shape of the ground
A radar altimeter bounces radio waves straight down and times the echo, so it measures height above the ground directly below. Subtract that from your altitude above sea level and you get the ground's own height. Compare a string of those heights with a stored height map and you can work out where you are — the way you might recognize a road by its hills with your eyes shut.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 165" font-family="Inter, Arial, sans-serif">
  <path d="M10,112 L80,112 C95,112 98,140 110,140 C122,140 125,112 140,112 L150,112 C155,112 157,106 162,106 C167,106 169,112 174,112 L245,112 C257,112 262,140 275,140 C288,140 291,112 305,112 L350,112" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <line x1="10" y1="30" x2="350" y2="30" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 4"/>
  <polygon points="100,24 124,30 100,36" fill="#1d6fd1"/>
  <line x1="110" y1="36" x2="110" y2="138" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="3 3"/>
  <text x="116" y="80" font-size="11" fill="#b4232c">altimeter</text>
  <text x="110" y="158" font-size="11" fill="#1f2a44" text-anchor="middle">valley 1</text>
  <text x="162" y="98" font-size="11" fill="#1f2a44" text-anchor="middle">hump</text>
  <text x="275" y="158" font-size="11" fill="#1f2a44" text-anchor="middle">valley 2</text>
  <text x="340" y="24" font-size="11" fill="#6c7a93" text-anchor="end">steady altitude</text>
</svg>
```

Cruise missiles such as the Tomahawk have navigated with this idea, called TERCOM (terrain contour matching). Two similar valleys are its classic trap.
:::

::: context dirac-spike A spike with all its weight at one point
The spike $\delta$ is named after the physicist Paul Dirac. Think of it as a bell curve squeezed thinner and thinner while keeping its area at one. In the limit, all the "stuff" sits at a single point.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="100" x2="340" y2="100" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#1d6fd1" stroke-width="3">
    <line x1="60" y1="100" x2="60" y2="90"/>
    <line x1="110" y1="100" x2="110" y2="70"/>
    <line x1="160" y1="100" x2="160" y2="30"/>
    <line x1="210" y1="100" x2="210" y2="50"/>
    <line x1="260" y1="100" x2="260" y2="70"/>
    <line x1="310" y1="100" x2="310" y2="90"/>
  </g>
  <g fill="#1d6fd1"><circle cx="60" cy="90" r="3"/><circle cx="110" cy="70" r="3"/><circle cx="160" cy="30" r="3"/><circle cx="210" cy="50" r="3"/><circle cx="260" cy="70" r="3"/><circle cx="310" cy="90" r="3"/></g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle"><text x="60" y="116">0.05</text><text x="110" y="116">0.15</text><text x="160" y="116">0.35</text><text x="210" y="116">0.25</text><text x="260" y="116">0.15</text><text x="310" y="116">0.05</text></g>
  <text x="340" y="20" font-size="11" fill="#6c7a93" text-anchor="end">height = weight</text>
</svg>
```

Six particles drawn as spikes, each as tall as its weight. The heights add up to one. Blur them a little and a bell shape appears.
:::

::: context bootstrap-name Why "bootstrap"
"Pulling yourself up by your bootstraps" means getting something done with nothing but what you already have. The bootstrap filter makes its new guesses using nothing but the motion model itself — no cleverer proposal, no peeking at the new measurement first. It was introduced under that name by Neil Gordon, David Salmond and Adrian Smith in 1993, and it is still the version most people write first. Fancier particle filters draw their new particles with help from the latest measurement, and then need a more complicated weight to correct for it.
:::

::: context likelihood-meaning Likelihood is a question asked backward
Probability usually runs forward: "the plane is here; what will the altimeter probably read?" Likelihood runs the same formula backward: "the altimeter read this; how well does *here* explain it?" For each particle the reading is fixed and the position varies. A likelihood is not itself a probability of the position — it does not have to add up to one over positions — which is exactly why the particle weights are normalized after multiplying.
:::

::: context importance-name Where "importance" comes from
Importance sampling is an old trick for averages. Suppose you want the average of something under distribution $p$, but you can only draw samples from a different distribution $q$. Draw from $q$ anyway, then give each sample the weight $p/q$ at its position: samples that $q$ produced too often get turned down, and samples it produced too rarely get turned up. The weights say how *important* each sample is to the average you really want. In the bootstrap filter, $q$ is the prediction and $p$ is the posterior, so the ratio is the likelihood.
:::

::: context comb-picture The comb, drawn
The ruler is the four weights $0.1, 0.4, 0.3, 0.2$ laid end to end. The four comb teeth, spaced $1/4$ apart and shifted by $u/N = 0.125$, pick the parents.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="50" width="32" height="26" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="52" y="50" width="128" height="26" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="180" y="50" width="96" height="26" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="276" y="50" width="64" height="26" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle"><text x="36" y="94">0</text><text x="116" y="94">1</text><text x="228" y="94">2</text><text x="308" y="94">3</text></g>
  <text x="20" y="110" font-size="11" fill="#6c7a93">particle owning each stretch</text>
  <g stroke="#b4232c" stroke-width="2"><line x1="60" y1="20" x2="60" y2="76"/><line x1="140" y1="20" x2="140" y2="76"/><line x1="220" y1="20" x2="220" y2="76"/><line x1="300" y1="20" x2="300" y2="76"/></g>
  <line x1="60" y1="20" x2="300" y2="20" stroke="#b4232c" stroke-width="2"/>
  <text x="180" y="14" font-size="11" fill="#b4232c" text-anchor="middle">teeth at 0.125, 0.375, 0.625, 0.875</text>
</svg>
```

Two teeth land in particle 1, one each in 2 and 3, none in 0: parents $[1,1,2,3]$.
:::

::: context family-tree The family tree narrows
Draw each resampled particle joined to the parent it was copied from. Here six particles go through three resamples. Lines that stop are lineages that died out. By the bottom row, all six particles descend from only two of the original six — and with no roughening, they hold only two distinct values.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <g stroke-width="1.5">
    <line x1="80" y1="30" x2="40" y2="80" stroke="#1d6fd1"/><line x1="80" y1="30" x2="80" y2="80" stroke="#1d6fd1"/>
    <line x1="120" y1="30" x2="120" y2="80" stroke="#6c7a93"/>
    <line x1="160" y1="30" x2="160" y2="80" stroke="#b4232c"/><line x1="160" y1="30" x2="200" y2="80" stroke="#b4232c"/>
    <line x1="200" y1="30" x2="240" y2="80" stroke="#6c7a93"/>
    <line x1="40" y1="80" x2="40" y2="130" stroke="#1d6fd1"/><line x1="80" y1="80" x2="80" y2="130" stroke="#1d6fd1"/><line x1="80" y1="80" x2="120" y2="130" stroke="#1d6fd1"/>
    <line x1="160" y1="80" x2="160" y2="130" stroke="#b4232c"/><line x1="200" y1="80" x2="200" y2="130" stroke="#b4232c"/><line x1="200" y1="80" x2="240" y2="130" stroke="#b4232c"/>
    <line x1="80" y1="130" x2="40" y2="180" stroke="#1d6fd1"/><line x1="120" y1="130" x2="80" y2="180" stroke="#1d6fd1"/><line x1="120" y1="130" x2="120" y2="180" stroke="#1d6fd1"/>
    <line x1="160" y1="130" x2="160" y2="180" stroke="#b4232c"/><line x1="200" y1="130" x2="200" y2="180" stroke="#b4232c"/><line x1="240" y1="130" x2="240" y2="180" stroke="#b4232c"/>
  </g>
  <g fill="#1f2a44">
    <circle cx="40" cy="30" r="5"/><circle cx="80" cy="30" r="5"/><circle cx="120" cy="30" r="5"/><circle cx="160" cy="30" r="5"/><circle cx="200" cy="30" r="5"/><circle cx="240" cy="30" r="5"/>
    <circle cx="40" cy="80" r="5"/><circle cx="80" cy="80" r="5"/><circle cx="120" cy="80" r="5"/><circle cx="160" cy="80" r="5"/><circle cx="200" cy="80" r="5"/><circle cx="240" cy="80" r="5"/>
    <circle cx="40" cy="130" r="5"/><circle cx="80" cy="130" r="5"/><circle cx="120" cy="130" r="5"/><circle cx="160" cy="130" r="5"/><circle cx="200" cy="130" r="5"/><circle cx="240" cy="130" r="5"/>
  </g>
  <g fill="#1d6fd1"><circle cx="40" cy="180" r="5"/><circle cx="80" cy="180" r="5"/><circle cx="120" cy="180" r="5"/></g>
  <g fill="#b4232c"><circle cx="160" cy="180" r="5"/><circle cx="200" cy="180" r="5"/><circle cx="240" cy="180" r="5"/></g>
  <g font-size="11" fill="#1f2a44"><text x="262" y="34">start: 6 values</text><text x="262" y="84">resample 1</text><text x="262" y="134">resample 2</text><text x="262" y="184">resample 3</text></g>
</svg>
```
:::

::: context roughening-name Roughening, and why it is allowed
The name comes from the 1993 bootstrap-filter paper: after resampling, the cloud is "rough-ened" by a small random nudge to every particle, so duplicates stop being exact twins. It works like a tiny extra dose of process noise. That is also why it is not free — it is noise the real system did not add. A common rule of thumb scales the jitter with the spread of the cloud and shrinks it as the number of particles grows.
:::

::: context next-lesson-curse Coming next: the curse of dimensionality
In one dimension, $2000$ particles cover a $14\,\mathrm{km}$ window with one every $7\,\mathrm m$. In ten dimensions, the same trick needs a grid in every direction at once, and the number of particles needed explodes. The next lesson measures exactly how fast, and shows the standard escape: use particles only for the few truly ambiguous parts of the state, and let small Kalman filters handle the rest.
:::
