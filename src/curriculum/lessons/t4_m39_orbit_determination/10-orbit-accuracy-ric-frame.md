---
id: l10-orbit-accuracy-ric-frame
title: "Orbit accuracy metrics and covariance in the RIC frame"
minutes: 13
covers:
  - "Orbit accuracy metrics and covariance in the RIC (radial, in-track, cross-track) frame"
---

Every covariance in this module so far has been reported in inertial $(x,y,z)$ components — correct, but not something a person can look at and understand. The tracking-geometry lesson's worst-observed eigenvector was a mixture of all six state components with no obvious meaning; the consider-covariance lesson's numbers were honest but not physically legible either. Radial, in-track, cross-track (RIC) is the frame that fixes this: not a different covariance, the same one, rotated into axes tied to the orbit itself, in which an orbit determination team can read the shape of the uncertainty at a glance rather than infer it from a matrix.

## The RIC frame

At any point on the orbit, three unit vectors follow directly from the state itself:
$$
\hat{\mathbf R} = \frac{\mathbf r}{r}\ \text{(radial, outward)}, \qquad
\hat{\mathbf C} = \frac{\mathbf h}{h}\ \text{(cross-track, the orbit normal)}, \qquad
\hat{\mathbf I} = \hat{\mathbf C}\times\hat{\mathbf R}\ \text{(in-track, completing a right-handed triad)}.
$$
$\hat{\mathbf I}$ is close to, but not exactly, the velocity direction except on a circular orbit — on an eccentric orbit velocity has a radial component too, and $\hat{\mathbf I}$ is defined to be exactly perpendicular to $\hat{\mathbf R}$ within the orbit plane rather than parallel to $\mathbf v$. Stacking the three as rows of a matrix $\mathbf T=(\hat{\mathbf R},\hat{\mathbf I},\hat{\mathbf C})^\mathsf T$ rotates any inertial vector into RIC components, and a covariance transforms the way any covariance does under a change of coordinates, block by block for position and velocity:
$$
\mathbf P_{\text{RIC}} = \begin{pmatrix}\mathbf T&\mathbf 0\\ \mathbf 0&\mathbf T\end{pmatrix}\mathbf P_{XYZ}\begin{pmatrix}\mathbf T&\mathbf 0\\ \mathbf 0&\mathbf T\end{pmatrix}^{\!\mathsf T}.
$$
$\mathbf T$ is orthogonal (its rows are unit vectors, mutually perpendicular by construction), so this is a pure rotation — no information is added or lost, only re-expressed in axes a person can reason about physically.

## Why in-track dominates: a derivation, not an assertion

Kepler's third law, $T_{\text{period}}=2\pi\sqrt{a^3/\mu}$, ties the orbital period to the semi-major axis alone. Taking the logarithm and differentiating,
$$
\ln T_{\text{period}} = \ln(2\pi) + \tfrac32\ln a - \tfrac12\ln\mu \quad\Longrightarrow\quad \frac{\delta T_{\text{period}}}{T_{\text{period}}} = \frac32\,\frac{\delta a}{a}.
$$
A small error in semi-major axis is therefore a small error in *period*, and a period error compounds: after $N$ orbits, the two objects — the true one and the one described by a slightly wrong $a$ — differ in where they are along the orbit by a phase that grows with $N$, not one that stays bounded. In terms of the mean motion $n=\sqrt{\mu/a^3}\propto a^{-3/2}$, $\delta n/n=-\tfrac32\,\delta a/a$, and the along-track position error after time $t$ grows as
$$
\delta s_{\text{in-track}}(t) \approx r\,|\delta n|\,t = \frac{3}{2}\,r\,n\,\frac{|\delta a|}{a}\,t,
$$
**linear in $t$**, while a radial or cross-track error, which corresponds to no change in $a$ or period at all, only rotates the orbit's orientation or shifts the observer's position within a bounded ellipse — it oscillates at the orbital frequency and never accumulates. This is the entire mechanism behind the module's own flashcard and quiz explanation for why RIC covariance ellipsoids are cigars pointed along-track: a semi-major-axis (equivalently, energy) error is secular, everything else in the geometry is periodic.

::: key Why in-track grows without bound and radial/cross-track do not
$\delta T_{\text{period}}/T_{\text{period}}=\tfrac32\,\delta a/a$ (Kepler's third law). A semi-major-axis error therefore desynchronizes phase at a constant rate, so its in-track footprint grows linearly with elapsed time. Radial and cross-track errors correspond to the orbit's shape and orientation, not its period, so they stay bounded and oscillate once per orbit instead of growing.
:::

## The mechanism, isolated

::: example Two orbits differing only in semi-major axis
Two $420\,\mathrm{km}$-class orbits, identical in every element except $a$, which differs by exactly $1\,\mathrm{km}$ ($\delta a/a\approx1.47\times10^{-4}$), propagated (two-body dynamics, so the effect is isolated from any other perturbation) and compared in RIC at the second orbit's own instantaneous frame:

```python
# n_orbits    t (s)      R (m)        I (m)         C (m)
#      0         0.0    999.0           0.0           0.0
#      1      5578.2    992.5       -9433.9           0.0
#      2     11156.4    972.8      -18867.7           0.0
#      4     22312.9    894.3      -37735.2           0.0
#      8     44625.8    580.1      -75469.3           0.0
#     16     89251.6   -676.4     -150929.4           0.0
```

Cross-track is exactly zero throughout — both orbits share the same plane, so there is no out-of-plane separation to speak of, by construction. Radial oscillates, never straying far from its initial $\sim\!1\,\mathrm{km}$ scale even after sixteen orbits. In-track grows essentially linearly — doubling the number of orbits doubles the separation almost exactly ($-9434\to-18868\to-37735\to-75469\,\mathrm m$) — and the fitted drift rate from this data, $1.691\,\mathrm{m/s}$, matches the formula above, $\tfrac32\,r\,n\,(\delta a/a)=1.690\,\mathrm{m/s}$, to three significant figures. The orbit with the larger $a$ moves slower (Kepler's third law again) and steadily falls behind, which is the source of the growing in-track separation and its sign.
:::

## The same mechanism in a real fit's propagated covariance

::: example An epoch covariance, propagated and re-examined in RIC
The three-pass batch fit's own epoch covariance, rotated into RIC at the epoch itself, is only mildly anisotropic: position sigma $(R,I,C)=(0.048,\ 0.220,\ 0.115)\,\mathrm m$, in-track about $4.6\times$ radial. Propagating that *same* covariance forward with the state transition matrix — $\mathbf P(t)=\boldsymbol\Phi(t,t_0)\mathbf P_0\boldsymbol\Phi(t,t_0)^\mathsf T$, exactly the batch lesson's covariance-mapping formula — and re-expressing it in RIC at each later time:

```python
# t             R sigma (m)   I sigma (m)   C sigma (m)   I/R      I/C
# epoch             0.048         0.220         0.115      4.6      1.9
# +1 day             0.046         0.341         0.119      7.4      2.9
# +3 days            0.054         3.001         0.126     55.3     23.8
# +7 days            0.077         8.442         0.128    110.3     65.8
```

Radial and cross-track sigma barely move — a few centimetres throughout, the oscillating-and-bounded behaviour the derivation predicted. In-track sigma grows by nearly two orders of magnitude over a week, and the ratio to radial climbs from under five at the epoch to over a hundred a week later. This is the same epoch covariance the batch and consider-covariance lessons reported as a single matrix; only once it is mapped forward in time and rotated into RIC does the physically dominant direction — and how fast it is growing — become visible at all.
:::

::: warning A small epoch covariance does not mean a small covariance next week
The epoch RIC ratios above ($I/R\approx4.6$) look almost tame; a week of free propagation turns the same covariance into a cigar over a hundred times longer along-track than it is radial. Reporting only the epoch covariance, or only its trace, hides exactly the information a conjunction screening or a hand-off to another tracking asset needs — how much the uncertainty will have grown, and in which direction, by the time it matters.
:::

## Beyond a single number: how accuracy actually gets judged

A single formal covariance, however honestly computed, is not the only accuracy check an operational team relies on, because it only reflects what the assumed noise models and dynamics say should be true. The most direct external check is an **overlap comparison**: fit two independent, overlapping arcs (recent data against slightly older data, or two different tracking networks' data over the same interval) and compare the resulting states at a common epoch. Disagreement between two independently fitted, supposedly consistent solutions is real, external evidence about accuracy that no single fit's own covariance can provide — it is possible for a fit to be perfectly self-consistent, with a converged, sensible-looking covariance, and still be measurably wrong, which an overlap comparison and only an overlap comparison will reveal. This is the same "converged is not correct" caution the residual-editing lesson raised, now applied across two fits instead of within one, and it is a routine part of how a flight dynamics team validates that its formal covariance can actually be trusted before handing it to a conjunction screening or a manoeuvre plan.

## Check yourself

::: check
A colleague reports "the position uncertainty is $50\,\mathrm{cm}$" without specifying a frame or a time. What two pieces of information does this lesson say are missing before that number means anything operationally?
:::

::: answer
Which direction it applies to — a $50\,\mathrm{cm}$ radial uncertainty and a $50\,\mathrm{cm}$ in-track uncertainty carry very different operational meaning, since one is bounded for as long as the orbit is tracked and the other is a snapshot of a quantity that may be tens of metres a week later — and at what epoch the number was computed, since (as the worked example showed) the same covariance's RIC decomposition changes by nearly two orders of magnitude in the in-track direction over the course of a single week of free propagation.
:::

::: check
Why is cross-track separation exactly zero in the two-orbit worked example, and would you expect that to remain true if the two orbits also differed slightly in inclination?
:::

::: answer
Cross-track separation measures how far apart the two orbits are perpendicular to the orbit plane, and the two orbits in the example share the same inclination and RAAN — the same plane — so by construction neither object ever leaves the other's plane, and $\hat{\mathbf C}\cdot(\mathbf r_B-\mathbf r_A)=0$ identically. A small inclination or RAAN difference would tilt the two planes relative to each other, and the cross-track separation would become nonzero and oscillate at the orbital frequency (bounded, like the radial component here), rather than staying at exactly zero.
:::

::: check
Using $\delta T_{\text{period}}/T_{\text{period}}=\tfrac32\,\delta a/a$, estimate (order of magnitude) how large a semi-major-axis error would produce a one-second period error on a $90$-minute LEO orbit, and explain why that translates directly into an in-track position error that grows every subsequent orbit.
:::

::: answer
$\delta a/a = \tfrac23\,\delta T_{\text{period}}/T_{\text{period}} = \tfrac23\times\dfrac{1\,\mathrm s}{5400\,\mathrm s}\approx1.2\times10^{-4}$, so for $a\approx6800\,\mathrm{km}$, $\delta a\approx0.83\,\mathrm{km}$ — under a kilometre of semi-major-axis error already produces a one-second-per-orbit timing error. Because the period error is the same every orbit (it is a property of $a$, which does not change under two-body dynamics), the accumulated timing offset after $N$ orbits is $N$ seconds, translating to an in-track position error of roughly $N$ seconds times the orbital speed — growing without bound as more orbits pass, unlike a radial or cross-track error of the same original size.
:::

::: check
An operator has only ever looked at one fit's formal covariance and never compared it against an independent overlapping solution. What specific failure mode can that formal covariance never catch on its own?
:::

::: answer
A formal covariance is only as good as the noise and dynamics models that produced it; if those models are subtly wrong in a way that biases the fit — an unmodelled force, a mis-set measurement noise, a station bias never solved for or considered — the covariance can be entirely self-consistent and still describe the wrong region of state space, confidently. Only comparing the result against an independently derived estimate (an overlap from different data, a different arc, or a different processing choice) can reveal that kind of bias; no amount of scrutinizing one fit's own reported uncertainty, by itself, can distinguish a correct fit from a confidently wrong one.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\hat{\mathbf R}=\mathbf r/r$, $\hat{\mathbf C}=\mathbf h/h$, $\hat{\mathbf I}=\hat{\mathbf C}\times\hat{\mathbf R}$ | RIC unit vectors, built directly from the state |
| $\mathbf P_{\text{RIC}}=\mathrm{diag}(\mathbf T,\mathbf T)\,\mathbf P_{XYZ}\,\mathrm{diag}(\mathbf T,\mathbf T)^\mathsf T$ | Pure rotation of the covariance; no information gained or lost |
| $\delta T_{\text{period}}/T_{\text{period}} = \tfrac32\,\delta a/a$ | Kepler's third law linearized; the source of secular in-track growth |
| $\delta s_{\text{in-track}}(t)\approx\tfrac32\,r\,n\,(\delta a/a)\,t$ | In-track error grows linearly with time; radial/cross-track stay bounded and oscillatory |
| $I/R$ ratio growing with propagation time | Verified directly: $4.6$ at epoch, over $100$ after one week, same covariance |
| Overlap comparison | Independent external accuracy check; the only way to catch a self-consistent but biased fit |

The RIC frame turned a covariance into something with physical shape. The next lesson uses that shape directly, mapping it into a probability that two objects — each with their own RIC-framed uncertainty — actually collide.
