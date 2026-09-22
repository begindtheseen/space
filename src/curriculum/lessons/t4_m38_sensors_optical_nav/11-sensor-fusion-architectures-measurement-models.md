---
id: l11-sensor-fusion-architectures-measurement-models
title: Sensor fusion architectures and per-sensor measurement models
minutes: 15
covers:
  - Sensor fusion architectures and per-sensor measurement models
---

Every lesson in this module has ended in the same place: a measurement $\mathbf{z}$, a prediction $h(\mathbf{x})$ built from the current state estimate, and a noise level that says how much the difference between them should be trusted. That is exactly the form the Kalman filter module's update step consumes, $\boldsymbol{\nu}=\mathbf{z}-h(\hat{\mathbf{x}}^-)$, and every sensor this module has built is, underneath, a specific $h(\cdot)$ and a specific noise model waiting to be plugged into that one equation. This lesson gathers them in one place, and then asks the question a flight software architecture actually has to answer: when a vehicle carries several of these sensors at once, how do their measurements actually get combined, and what happens when that combination is done carelessly.

The honest answer is that combining sensors well is not the same as "use all of them." Two entirely reasonable-looking fusion strategies can produce different answers from the identical data, and one of the most common mistakes — treating two locally fused estimates as independent when they secretly share information — makes a filter report itself more confident than it has any right to be. This lesson builds that mistake with real numbers, alongside the fix, and closes with what this module's own sensor accuracies say about when adding a sensor is actually worth the complexity.

## Per-sensor measurement models, gathered in one place

Every sensor this module covered reduces to the same shape: a measurement $\mathbf{z}$, a model $h(\mathbf{x})$ predicting it from the current state, and a noise covariance describing how far apart the two are allowed to be before something is wrong.

| Sensor | Measurement $\mathbf{z}$ | Model $h(\mathbf{x})$ |
| --- | --- | --- |
| Star tracker | Identified star directions $\hat{\mathbf{b}}_i$ | $\mathbf{A}(\mathbf{q})\hat{\mathbf{r}}_i$, catalog direction rotated by attitude |
| Coarse sun sensor | Six photodiode currents $I_j$ | $I_0\max(0,\hat{\mathbf{n}}_j\cdot\mathbf{A}(\mathbf{q})\hat{\mathbf{s}})$ |
| Magnetometer | Calibrated field vector $\mathbf{m}$ | $\mathbf{A}(\mathbf{q})\,\mathbf{B}_{\text{IGRF}}(\mathbf{r},t)$ |
| Horizon sensor | Crossing phases $(\phi_N,\Delta\phi)$ | Spherical-trigonometry function of attitude and orbit position |
| Radar or laser altimeter | Range $R$ | $\lVert\mathbf{r}_{\text{ground}}-\mathbf{r}_{\text{vehicle}}\rVert$ along the beam |
| Navigation camera | Pixel $(u,v)$ | $\mathbf{K}\,\mathbf{R}(\mathbf{P}_{\text{world}}-\mathbf{t})$, projected landmark |
| Docking retroreflector | Range and bearing, or full 3-D position | Relative position from the estimated relative state |

Nothing in this table is new; each row is the same $h(\mathbf{x})$ this module derived in full, in its own lesson, with its own noise budget. What is new is what happens once a filter is asked to use more than one row at a time.

## Centralized fusion: combine what you have, weighted by what it is worth

The most direct architecture stacks every available measurement into one filter update at once — exactly the attitude information matrix $\mathbf{F}=\sum_i a_i(\mathbf{I}-\hat{\mathbf{b}}_i\hat{\mathbf{b}}_i^\mathsf{T})$ this module has used since the second lesson, now summed across *sensor types*, not only across stars within one tracker.

::: example Does a coarse sensor actually help a star tracker's weak axis?
The two-tracker example earlier in this module showed a second star tracker fixing the first one's roll weakness almost completely. Try the same idea with sensors this module has already characterized as far coarser — a sun sensor and a magnetometer, each contributing one vector, mounted along body axes the star tracker's own roll axis cannot see:

```python
import numpy as np
arcsec = np.radians(1/3600)

sigma_c = 10*arcsec
rng = np.random.default_rng(1)
cat = rng.standard_normal((3000,3)); cat /= np.linalg.norm(cat, axis=1, keepdims=True)
fov = np.radians(15.0)

def rotation(axis, ang):
    k = np.asarray(axis, float)/np.linalg.norm(axis)
    K = np.array([[0,-k[2],k[1]],[k[2],0,-k[0]],[-k[1],k[0],0]])
    return np.eye(3) + np.sin(ang)*K + (1-np.cos(ang))*K@K

A_true = rotation([0.3,-0.5,0.8], 1.1)
body = cat @ A_true.T
b_star = body[body[:,2] > np.cos(fov/2)]
F_star = sum((1/sigma_c**2)*(np.eye(3)-np.outer(b,b)) for b in b_star)

sigma_sun, sigma_mag = np.radians(2.0), np.radians(3.0)     # this module's own accuracy figures
F_sun = (1/sigma_sun**2) * (np.eye(3) - np.outer([1.,0,0], [1.,0,0]))   # boresight along body x
F_mag = (1/sigma_mag**2) * (np.eye(3) - np.outer([0.,1,0], [0.,1,0]))   # boresight along body y

def sigma_xyz(F):
    return np.sqrt(np.diag(np.linalg.inv(F))) / arcsec

print("star tracker alone,                sigma xyz (arcsec):", np.round(sigma_xyz(F_star), 3))
F_all = F_star + F_sun + F_mag
print("star tracker + sun + magnetometer, sigma xyz (arcsec):", np.round(sigma_xyz(F_all), 3))
print("F_star zz vs F_sun zz contribution:", F_star[2,2], "vs", F_sun[2,2],
      " ratio:", round(F_star[2,2]/F_sun[2,2]))
# star tracker alone,                sigma xyz (arcsec): [ 2.993  2.914 28.34 ]
# star tracker + sun + magnetometer, sigma xyz (arcsec): [ 2.993  2.914 28.339]
# F_star zz vs F_sun zz contribution: 57322056.22555028 vs 820.701587502936  ratio: 69845
```

Adding two well-placed vectors barely moves the roll accuracy at all — from $28.34''$ to $28.339''$ — because the star tracker's own information about roll, weak as it is, still outweighs the sun sensor's *entire* contribution along that axis by a factor of nearly seventy thousand. A second star tracker helped in this module's own earlier example because it was comparably precise; a sensor three orders of magnitude coarser cannot backstop even a strong sensor's weakest direction, no matter how favourably it is oriented. Geometric diversity only pays off between sensors whose accuracies are in the same neighbourhood — knowing each sensor's actual noise level, which is most of what this module has built, is exactly what tells a filter designer which combinations are worth the added complexity and which are not.
:::

## Federated fusion and the double-counting trap

A single, centralized filter that ingests every raw measurement is statistically the best a filter can do, but it is not how every mission architecture works. A **federated** (or decentralized) design instead runs a separate local filter per sensor, each producing its own state estimate and covariance, and fuses those *estimates* at a slower rate in a central node — trading some statistical efficiency for real engineering benefits: a bad sensor can be caught and excluded at the local level before it contaminates anything else, exactly the residual-gate philosophy this module used from its first lesson onward; each local filter can run at its own natural rate without forcing every sensor onto one common clock; and a sensor can be added, removed, or swapped without redesigning one monolithic filter.

The benefit comes with a genuine hazard. If two local filters both start from the same shared prior — the same propagated dynamics estimate, say — and their two resulting posteriors are later combined as though they were independent, the shared prior's information gets counted twice.

::: example A shared prior, double-counted, and the conservative fix
```python
P0, x0 = 25.0, 100.0                       # a shared prior both local filters start from
R_A, R_B = 4.0, 9.0                        # two independent sensors' own measurement variances
z_A, z_B = 102.0, 96.0

def scalar_update(x_prior, P_prior, z, R):
    K = P_prior / (P_prior + R)
    return x_prior + K*(z - x_prior), (1-K)*P_prior

x_A, P_A = scalar_update(x0, P0, z_A, R_A)   # local filter A's posterior
x_B, P_B = scalar_update(x0, P0, z_B, R_B)   # local filter B's posterior, same shared prior
print("local posterior A: x=%.4f P=%.4f   local posterior B: x=%.4f P=%.4f" % (x_A, P_A, x_B, P_B))

P_central = 1.0/(1.0/P0 + 1.0/R_A + 1.0/R_B)                 # the correct answer: fuse the prior once
x_central = P_central*(x0/P0 + z_A/R_A + z_B/R_B)
print("centralized (correct):   x=%.4f  P=%.4f" % (x_central, P_central))

P_naive = 1.0/(1.0/P_A + 1.0/P_B)                             # treats A, B as independent -- they are not
x_naive = P_naive*(x_A/P_A + x_B/P_B)
print("naive federated (wrong): x=%.4f  P=%.4f  -- double-counts 1/P0=%.4f exactly (1/P_naive-1/P_central=%.4f)"
      % (x_naive, P_naive, 1/P0, 1/P_naive - 1/P_central))
# local posterior A: x=101.7241 P=3.4483   local posterior B: x=97.0588 P=6.6176
# centralized (correct):   x=100.1385  P=2.4931
# naive federated (wrong): x=100.1259  P=2.2670  -- double-counts 1/P0=0.0400 exactly (1/P_naive-1/P_central=0.0400)
```

The naive combination's reported information, $1/P_{\text{naive}}-1/P_{\text{central}}$, equals $1/P_0$ to four decimal places — not approximately, exactly, because each local posterior already carries the shared prior's information once, and combining them as independent counts it a second time. The naive filter reports itself more confident than the data justify, which is the worst kind of estimation error: not merely wrong, but wrong while claiming to know it is right.

**Covariance Intersection** is the standard, provably safe answer when the correlation between two estimates is unknown rather than assumed away: fuse with $1/P_{\text{CI}}=\omega/P_A+(1-\omega)/P_B$ for whichever $\omega\in[0,1]$ minimizes $P_{\text{CI}}$, guaranteed never to be smaller than the truly correct fused covariance, however the two inputs are correlated.

```python
# in one dimension, 1/P_CI(w) is linear in w, so its minimum P_CI sits at one of the two endpoints
P_ci = min(P_A, P_B)
x_ci = x_A if P_A < P_B else x_B
print("covariance intersection: x=%.4f  P=%.4f  (the more precise single source)" % (x_ci, P_ci))
print("consistent (P_ci >= P_central)?", P_ci >= P_central, "   naive was overconfident (P_naive < P_central)?", P_naive < P_central)
# covariance intersection: x=101.7241  P=3.4483  (the more precise single source)
# consistent (P_ci >= P_central)?  True    naive was overconfident (P_naive < P_central)?  True
```

In this one-dimensional case Covariance Intersection reduces to trusting whichever local estimate already had the smaller variance and discarding the other outright, since blending in a less precise scalar source can only widen a purely one-dimensional interval — its real value appears in multiple dimensions, where two sources can be strong along different axes and a careful blend keeps more of both while remaining provably safe against whatever correlation the shared prior introduced. Either way, $P_{\text{CI}}\ge P_{\text{central}}$: it costs some efficiency, in exchange for never reporting confidence the data did not earn.
:::

::: key Fusion architectures
Centralized fusion — one filter, every raw measurement — is statistically optimal but couples every sensor into one design. Federated fusion — local filters, combined estimates — is modular and fault-tolerant, at the cost of a real hazard: combining estimates that secretly share prior information as though independent double-counts that information and produces an overconfident, inconsistent result. Covariance Intersection fuses without assuming independence, guaranteed conservative rather than wrong.
:::

## Check yourself

::: check
Explain, from this lesson's own numbers, why adding a $2^\circ$ sun sensor to a star tracker whose worst axis is already $28.34''$ improves that axis by only a fraction of a percent, even though the sun sensor is mounted along a body axis the star tracker cannot see at all.
:::

::: answer
Being mounted along a direction the star tracker cannot see means the sun sensor's information does not compete with redundant star-tracker information on that axis, but it says nothing about how *much* information the sun sensor actually contributes. Converting $2^\circ$ and $28.34''$ to the same units shows the star tracker's own roll information already exceeds the sun sensor's total contribution to that axis by almost five orders of magnitude, so even placed perfectly, the sun sensor adds a negligible fraction to a much larger existing number. Favourable geometry only helps when the contributing sensor's own precision is not overwhelmed before the geometry gets a chance to matter.
:::

::: check
State, in one sentence each, one genuine engineering advantage of a federated fusion architecture over a centralized one, and one genuine advantage of centralized over federated.
:::

::: answer
Federated fusion lets a bad sensor be detected and excluded at the local level, before it can contaminate a combined estimate, and lets sensors be added, removed, or run at different rates without redesigning one shared filter. Centralized fusion is statistically optimal — it never discards or double-counts information the way a careless federated combination can — because it processes every raw measurement against the true prior exactly once.
:::

::: check
In the double-counting example, $1/P_{\text{naive}}-1/P_{\text{central}}$ came out to exactly $1/P_0$. Explain why this difference is *exactly* the shared prior's own information, not merely approximately so.
:::

::: answer
Each local posterior's information is $1/P_A=1/P_0+1/R_A$ and $1/P_B=1/P_0+1/R_B$, since each local filter fused the same prior with its own independent measurement. Naively summing them as if independent gives $1/P_{\text{naive}}=1/P_A+1/P_B=2/P_0+1/R_A+1/R_B$, while the correct centralized information is $1/P_{\text{central}}=1/P_0+1/R_A+1/R_B$. Subtracting leaves exactly $1/P_0$ — the prior's information appears twice in the naive sum and once in the correct one, so the difference is precisely one full copy of it, not an approximation.
:::

::: check
Why does Covariance Intersection in this lesson's one-dimensional example reduce to picking the more precise of the two local estimates outright, rather than blending them?
:::

::: answer
Covariance Intersection searches over $\omega\in[0,1]$ for the value that minimizes the fused variance $P_{\text{CI}}(\omega)$, and in one dimension $1/P_{\text{CI}}(\omega)=\omega/P_A+(1-\omega)/P_B$ is a linear function of $\omega$. A linear function on a bounded interval always reaches its extreme values at the interval's endpoints, so the maximum of $1/P_{\text{CI}}$ — equivalently, the minimum of $P_{\text{CI}}$ — is always achieved at $\omega=0$ or $\omega=1$, meaning the "fused" estimate is always exactly one of the two original inputs, whichever already had the smaller variance. Genuine blending only emerges once there is more than one dimension for the two sources to trade strength across.
:::

::: check
A mission argues that because Covariance Intersection is "always safe," it should replace centralized fusion everywhere, even when the correlation between two estimates is actually known and accounted for. Evaluate this argument using this lesson's own numbers.
:::

::: answer
This lesson's own centralized result, $P=2.4931$, is smaller than the covariance-intersection result, $P=3.4483$ — Covariance Intersection is deliberately conservative precisely because it assumes nothing about the correlation between its two inputs, and that assumption costs real precision when the correlation is in fact known, as it is in the centralized case where the shared prior is accounted for explicitly rather than hidden. Replacing a correctly-modelled centralized fusion with Covariance Intersection everywhere would throw away that known-correlation information and report an estimate less precise than the data actually supports, the opposite failure from the naive federated case but still a real cost.
:::

::: check
A flight team is deciding whether to add a second, independent star tracker or a second, independent sun sensor to improve a vehicle's worst-axis attitude accuracy. Based on this lesson, which is the better investment, and why?
:::

::: answer
A second star tracker is the better investment. This lesson's own numbers showed that a sensor coarser than the weakest axis it is meant to help contributes a negligible fraction of the needed information, however well it is placed geometrically, while the earlier two-tracker example in this module showed a second, comparably precise star tracker improving the same worst axis by close to an order of magnitude. The lesson generalizes beyond star trackers specifically: an additional sensor only meaningfully improves a fusion result when its own precision is within reach of the axis it is meant to strengthen, not merely oriented favourably toward it.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\boldsymbol{\nu}=\mathbf{z}-h(\hat{\mathbf{x}}^-)$ | Every sensor in this module reduces to this one form for a Kalman-style filter |
| $\mathbf{F}=\sum_i a_i(\mathbf{I}-\hat{\mathbf{b}}_i\hat{\mathbf{b}}_i^\mathsf{T})$, summed across sensor types | Centralized attitude fusion; optimal, but only as good as each sensor's own weight |
| A sensor's benefit is capped by its own information | A $2^\circ$ sensor cannot meaningfully backstop a $28''$ axis regardless of geometry |
| Federated fusion | Modular and fault-isolating, combines local estimates rather than raw measurements |
| $1/P_{\text{naive}}-1/P_{\text{central}}=1/P_0$ | The exact size of a shared-prior double-counting error in naive federated fusion |
| Covariance Intersection | $1/P_{\text{CI}}=\omega/P_A+(1-\omega)/P_B$, minimized over $\omega$; conservative but never overconfident |

Every fact in this lesson assumed each sensor was working as designed. The final lesson of this module takes up what a flight system does when that assumption fails — an alignment that drifts, a sensor that degrades slowly rather than breaking outright, and how the fusion architectures built here are the same machinery that catches it.
