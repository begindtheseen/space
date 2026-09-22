---
id: l05-dilution-of-precision
title: Dilution of precision
minutes: 19
covers:
  - "Dilution of precision: GDOP, PDOP, HDOP, VDOP, TDOP, and what geometry makes each bad"
---

The previous lesson ended with a number that had nothing to do with measurement quality: six satellites at Cape Canaveral, $3.0\,\mathrm{m}$ of noise on every pseudorange, and a root-mean-square position error of $6.98\,\mathrm{m}$ — a factor of $2.3268$ larger than the noise itself, and that factor came entirely from where the satellites were in the sky. Swap the satellites for a worse arrangement, keep the same $3.0\,\mathrm{m}$ noise, and this lesson will show the same fit landing more than fourteen times further from the truth. Nothing about the receiver changed. Only the geometry did.

That factor is **dilution of precision**, and it is worth understanding precisely because it is the one number in this module you can compute in advance, from an almanac, before a single measurement is taken. A mission planner deciding whether a landing burn can trust GNSS, or a receiver deciding which of twelve visible satellites to use, is reasoning about DOP. This lesson derives it from the geometry matrix the previous lesson built, splits it into the five numbers the field actually quotes, and uses the same two constellations throughout to keep the abstraction honest.

## The covariance behind the fix

Go back to the linear step the previous lesson iterates: $\delta = (\mathbf{G}^{\mathsf T}\mathbf{G})^{-1}\mathbf{G}^{\mathsf T}\Delta\boldsymbol\rho$, a linear function of the measurement vector $\Delta\boldsymbol\rho$. If each pseudorange carries independent noise of variance $\sigma^2$ — the user equivalent range error, squared — the sibling module on least squares derives how variance propagates through a linear estimator: $\mathrm{Cov}(\delta) = \sigma^2(\mathbf{G}^{\mathsf T}\mathbf{G})^{-1}$. Two lines confirm it directly. Write $\mathbf{A} = (\mathbf{G}^{\mathsf T}\mathbf{G})^{-1}\mathbf{G}^{\mathsf T}$, so $\delta = \mathbf{A}\,\Delta\boldsymbol\rho$ and $\mathrm{Cov}(\delta) = \mathbf{A}\,\mathrm{Cov}(\Delta\boldsymbol\rho)\,\mathbf{A}^{\mathsf T} = \sigma^2 \mathbf{A}\mathbf{A}^{\mathsf T}$; and

$$
\mathbf{A}\mathbf{A}^{\mathsf T} = (\mathbf{G}^{\mathsf T}\mathbf{G})^{-1}\mathbf{G}^{\mathsf T}\mathbf{G}(\mathbf{G}^{\mathsf T}\mathbf{G})^{-1} = (\mathbf{G}^{\mathsf T}\mathbf{G})^{-1},
$$

using the symmetry of $(\mathbf{G}^{\mathsf T}\mathbf{G})^{-1}$ to cancel one factor against the middle. So the four-by-four matrix

$$
\mathbf{Q} = (\mathbf{G}^{\mathsf T}\mathbf{G})^{-1}
$$

is the covariance of the position-and-clock estimate *per unit of measurement variance* — exactly the least-squares module's parameter-covariance result, evaluated at $\sigma = 1$. It depends only on the directions $\mathbf{e}_i$ that make up $\mathbf{G}$: nothing about the noise, the pseudoranges, or the receiver's clock enters it. $\mathbf{Q}$ is pure geometry, computable from an almanac alone, and dilution of precision is what you get by reading numbers off its diagonal.

## Five numbers from one matrix

$\mathbf{Q}$'s rows and columns are ordered $(x, y, z, b)$, the same order as $\mathbf{G}$'s columns. **GDOP**, geometric dilution of precision, is the square root of the whole trace:

$$
\mathrm{GDOP} = \sqrt{\mathrm{tr}(\mathbf{Q})} = \sqrt{Q_{11}+Q_{22}+Q_{33}+Q_{44}},
$$

folding position and time together into one number. **PDOP**, position dilution of precision, takes only the position block:

$$
\mathrm{PDOP} = \sqrt{Q_{11}+Q_{22}+Q_{33}},
$$

and **TDOP**, time dilution of precision, is the clock term alone, $\mathrm{TDOP} = \sqrt{Q_{44}}$. Since $\mathrm{GDOP}^2 = \mathrm{PDOP}^2 + \mathrm{TDOP}^2$ by construction — the trace splits exactly into the position part and the clock part — computing any two of the three checks the third.

Splitting position further, into horizontal and vertical, needs a rotation that $Q_{11}, Q_{22}, Q_{33}$ do not give you for free, because those are ECEF $x$, $y$, $z$ — an axis system with no relationship to "up" at the receiver's location unless the receiver happens to sit on the equator at zero longitude. Build the local east-north-up basis at the receiver, exactly as the earlier lessons' azimuth-elevation examples did, and collect it as the rows of a rotation matrix $\mathbf{R} = [\hat{\mathbf{e}};\ \hat{\mathbf{n}};\ \hat{\mathbf{u}}]$. Rotating the position block of $\mathbf{Q}$,

$$
\mathbf{Q}_{\mathrm{enu}} = \mathbf{R}\,\mathbf{Q}_{\mathrm{pos}}\,\mathbf{R}^{\mathsf T}, \qquad \mathbf{Q}_{\mathrm{pos}} = \begin{pmatrix} Q_{11}&Q_{12}&Q_{13}\\Q_{21}&Q_{22}&Q_{23}\\Q_{31}&Q_{32}&Q_{33}\end{pmatrix},
$$

gives **HDOP** and **VDOP**, horizontal and vertical dilution of precision:

$$
\mathrm{HDOP} = \sqrt{(Q_{\mathrm{enu}})_{11} + (Q_{\mathrm{enu}})_{22}}, \qquad \mathrm{VDOP} = \sqrt{(Q_{\mathrm{enu}})_{33}}.
$$

A rotation preserves the trace of the matrix it rotates, so $(Q_{\mathrm{enu}})_{11}+(Q_{\mathrm{enu}})_{22}+(Q_{\mathrm{enu}})_{33} = Q_{11}+Q_{22}+Q_{33}$, and therefore $\mathrm{PDOP}^2 = \mathrm{HDOP}^2 + \mathrm{VDOP}^2$ — PDOP does not care which frame you compute it in, but HDOP and VDOP individually do, which is exactly why they need the rotation and PDOP does not. Multiplying any of these by the user equivalent range error gives an approximate position or time error in the corresponding sense: $\sigma_{\mathrm{position}} \approx \mathrm{PDOP} \times \sigma_{\mathrm{UERE}}$, $\sigma_{\mathrm{vertical}} \approx \mathrm{VDOP}\times\sigma_{\mathrm{UERE}}$, and so on — the rule the previous lesson's Monte Carlo run confirmed numerically for PDOP.

::: key
$\mathbf{Q} = (\mathbf{G}^{\mathsf T}\mathbf{G})^{-1}$, the unit-variance parameter covariance. $\mathrm{GDOP}=\sqrt{\mathrm{tr}\,\mathbf{Q}}$; $\mathrm{PDOP}=\sqrt{Q_{11}+Q_{22}+Q_{33}}$ (ECEF, frame-independent); $\mathrm{TDOP}=\sqrt{Q_{44}}$; $\mathrm{HDOP}$ and $\mathrm{VDOP}$ come from rotating the position block to a local ENU frame first. $\mathrm{GDOP}^2=\mathrm{PDOP}^2+\mathrm{TDOP}^2$ and $\mathrm{PDOP}^2=\mathrm{HDOP}^2+\mathrm{VDOP}^2$. Position error is approximately DOP times the UERE.
:::

## The same six satellites, named properly

The previous lesson's second worked example used six satellites at Cape Canaveral — four reused from the receiver-clock lesson at $(\mathrm{az},\mathrm{el})$ of $(135^\circ,60^\circ)$, $(45^\circ,30^\circ)$, $(225^\circ,25^\circ)$ and $(315^\circ,45^\circ)$, plus one nearly overhead at $(10^\circ,75^\circ)$ and one low on the opposite side at $(200^\circ,15^\circ)$ — and found $\mathrm{PDOP}=2.3268$ by a route that did not yet have a name. Building $\mathbf{Q}$ from that same geometry gives the full set:

```python
import numpy as np


def dop(sats, x, east, north, up):
    los = sats - x
    e = los / np.linalg.norm(los, axis=1)[:, None]
    G = np.column_stack([-e, np.ones(len(sats))])
    Q = np.linalg.inv(G.T @ G)
    gdop = np.sqrt(np.trace(Q))
    pdop = np.sqrt(Q[0, 0] + Q[1, 1] + Q[2, 2])
    tdop = np.sqrt(Q[3, 3])
    R = np.vstack([east, north, up])
    Qenu = R @ Q[:3, :3] @ R.T
    hdop = np.sqrt(Qenu[0, 0] + Qenu[1, 1])
    vdop = np.sqrt(Qenu[2, 2])
    return gdop, pdop, hdop, vdop, tdop


x_true = np.array([914936.61, -5526684.03, 3049186.55])    # Cape Canaveral, ECEF, m
sats6 = np.array([                                            # the six satellites used throughout
    [11350562.41, -23441217.26, 5206502.33],
    [15228615.04, -6538895.01, 20754896.68],
    [-11200404.28, -23485162.13, -5332138.78],
    [-8420060.43, -15461050.49, 19886983.18],
    [4231690.58, -19962286.90, 17000985.17],
    [-4355633.71, -22609494.10, -13239064.60],
])
lat, lon = np.radians(28.56), np.radians(-80.60)               # local ENU basis, Cape Canaveral
east = np.array([-np.sin(lon), np.cos(lon), 0.0])
north = np.array([-np.sin(lat) * np.cos(lon), -np.sin(lat) * np.sin(lon), np.cos(lat)])
up = np.array([np.cos(lat) * np.cos(lon), np.cos(lat) * np.sin(lon), np.sin(lat)])

gdop, pdop, hdop, vdop, tdop = dop(sats6, x_true, east, north, up)
print(f"GDOP={gdop:.4f} PDOP={pdop:.4f} HDOP={hdop:.4f} VDOP={vdop:.4f} TDOP={tdop:.4f}")
# GDOP=2.6642 PDOP=2.3268 HDOP=1.3266 VDOP=1.9117 TDOP=1.2976
print("check:", pdop**2 + tdop**2, "vs", gdop**2, " | ", hdop**2 + vdop**2, "vs", pdop**2)
# check: 7.098030005998015 vs 7.098030005998015  |  5.41418136237961 vs 5.41418136237961
```

Both identities check to machine precision. Notice $\mathrm{VDOP}=1.9117$ against $\mathrm{HDOP}=1.3266$ — the vertical is already the weaker axis even for a well-spread constellation like this one, for a reason worked out below.

## A clustered constellation, and the same noise

Keep everything else fixed — same receiver, same $\sigma=3.0\,\mathrm{m}$ pseudorange noise, same solver — and replace the six well-spread satellites with six crowded into one corner of the sky: $(60^\circ,55^\circ)$, $(75^\circ,60^\circ)$, $(50^\circ,45^\circ)$, $(65^\circ,50^\circ)$, $(80^\circ,65^\circ)$ and $(55^\circ,40^\circ)$ — azimuths spanning only $30^\circ$, elevations only $25^\circ$. Every one of these is a perfectly good measurement on its own: real satellites, real signals, the same $3.0\,\mathrm{m}$ one-sigma pseudorange error as before. What has changed is that the six line-of-sight unit vectors now point in nearly the same direction, so $\mathbf{G}^{\mathsf T}\mathbf{G}$ is close to singular and its inverse is large:

$$
\mathrm{GDOP}=47.04,\quad \mathrm{PDOP}=34.32,\quad \mathrm{HDOP}=21.72,\quad \mathrm{VDOP}=26.58,\quad \mathrm{TDOP}=32.17.
$$

Every entry is fourteen to fifteen times its counterpart from the well-spread geometry. Running the same $3.0\,\mathrm{m}$-noise Monte Carlo used previously, twenty thousand draws through the identical solver, gives a root-mean-square position error of $102.2\,\mathrm{m}$ against the earlier $6.98\,\mathrm{m}$ — a factor of $14.65$, matching the $\mathrm{PDOP}$ ratio of $34.3243/2.3268=14.75$ to within Monte Carlo sampling noise. The measurement noise never changed. The geometry alone turned a metre-class fix into one with worse than $100\,\mathrm{m}$ errors, the kind of degradation an elevation-mask or a partially obstructed sky can produce without a single satellite failing or a single extra metre of atmospheric delay.

::: example Good sky against bad sky, same noise
| | Good (spread) | Bad (clustered) | Ratio |
| --- | --- | --- | --- |
| GDOP | $2.6642$ | $47.0409$ | $17.66\times$ |
| PDOP | $2.3268$ | $34.3243$ | $14.75\times$ |
| HDOP | $1.3266$ | $21.7179$ | $16.37\times$ |
| VDOP | $1.9117$ | $26.5799$ | $13.91\times$ |
| TDOP | $1.2976$ | $32.1666$ | $24.79\times$ |
| RMS position error, $\sigma=3\,\mathrm{m}$, $M=20{,}000$ | $6.98\,\mathrm{m}$ | $102.2\,\mathrm{m}$ | $14.65\times$ |

The last row is Monte Carlo truth, not a formula; the PDOP ratio predicts it without running a single fit, which is the entire point of computing DOP from an almanac before the measurements exist.
:::

## Why the vertical is always the weak axis

Every visible satellite is above the horizon, so every line-of-sight unit vector's up-component is positive: for the well-spread six, they run $0.9659$, $0.8660$, $0.7071$, $0.5000$, $0.4226$ and $0.2588$ — none negative, none even close to zero. Compare that to the horizontal components, which range freely over positive and negative values because satellites sit in every azimuth. A set of vectors that all lean the same way is worse at pinning down that direction than a set spread symmetrically around it, for the same reason a tripod with its legs bunched together is less stable than one with its legs spread — the geometry lesson's identity $\mathrm{PDOP}^2=\mathrm{HDOP}^2+\mathrm{VDOP}^2$ turns that intuition into the numbers above, $\mathrm{VDOP}=1.9117 > \mathrm{HDOP}=1.3266$ for the good geometry and $\mathrm{VDOP}=26.58$ still exceeding $\mathrm{HDOP}=21.72$ for the bad one. No ground-based GNSS geometry escapes this; it would take a satellite below the horizon to balance it, and Earth is in the way.

The receiver-clock lesson claimed something stronger: that this same "everything points up" fact makes the clock bias and the vertical position nearly indistinguishable, so an error in one looks like an error in the other. That claim can now be made exact. Read the correlation directly off $\mathbf{Q}$: the covariance between the estimated clock bias and the vertical position is the $(b,\mathrm{up})$ entry of $\mathbf{Q}$ after rotating its position-clock cross terms into ENU, and dividing by the two standard deviations gives a correlation coefficient. For the well-spread six satellites it comes out to $0.947$; for the clustered six, $0.991$. Both are close to one — the structural reason is exactly the paragraph above, since the clock column of $\mathbf{G}$ is all ones and the vertical component of every row is also positive, the two columns are never far from parallel for *any* ground receiver — but $0.947$ is measurably less than $0.991$, and the gap is what a wider spread of elevations buys. Drop the single lowest satellite, the one at $15^\circ$, from the well-spread six and keep the other five: $\mathrm{VDOP}$ rises from $1.9117$ to $2.227$, $\mathrm{TDOP}$ from $1.2976$ to $1.609$, and the correlation climbs from $0.947$ to $0.959$. That satellite's line of sight has an up-component of only $0.2588$ — the smallest of the six, closest to the horizontal plane, furthest from the clock direction's all-up leaning — and losing it cost more in $\mathrm{VDOP}$ and $\mathrm{TDOP}$ than losing any of the higher satellites would have. This is the geometric side of the elevation-mask trade the pseudorange lesson raised: a low satellite is the noisiest measurement in the sky, and also the one doing the most work to keep the vertical and the clock apart.

::: example Trading a noisy satellite for good geometry
Removing the $15^\circ$ satellite from the well-spread six leaves five: $\mathrm{PDOP}$ rises from $2.3268$ to $2.6398$, a $13\%$ increase in position-error amplification, purely from losing the satellite that was doing the most to spread the sky. A receiver applying an aggressive elevation mask to protect itself from multipath and tropospheric error is buying measurement quality at a real, computable cost in geometry — the elevation-dependent weighting from the pseudorange lesson, which down-weights a low satellite rather than discarding it outright, is the way to keep some of both.
:::

::: warning
$\mathrm{HDOP}$ and $\mathrm{VDOP}$ require the ENU rotation; skipping it and reading $Q_{11}$, $Q_{22}$ and $Q_{33}$ off the raw ECEF matrix does not give "some other valid decomposition" — it gives the wrong numbers. For the well-spread geometry above, $\sqrt{Q_{11}+Q_{22}}=2.138$ against the true $\mathrm{HDOP}=1.327$, and $\sqrt{Q_{33}}=0.917$ against the true $\mathrm{VDOP}=1.912$ — the naive vertical figure is not just inaccurate, it is more than a factor of two *too small*, which is the dangerous direction to be wrong in for a number meant to bound an error. $\mathrm{PDOP}$ and $\mathrm{GDOP}$ are safe to read directly from the ECEF trace because a trace does not care about rotation; $\mathrm{HDOP}$ and $\mathrm{VDOP}$ are not traces of the full position block, they are traces of *pieces* of it, and pieces do depend on which axes you cut along.
:::

## Check yourself

::: check
Write down the definitions of GDOP, PDOP and TDOP in terms of $\mathbf{Q}=(\mathbf{G}^{\mathsf T}\mathbf{G})^{-1}$, and state the identity relating all three.
:::

::: answer
$\mathrm{GDOP}=\sqrt{\mathrm{tr}(\mathbf{Q})}=\sqrt{Q_{11}+Q_{22}+Q_{33}+Q_{44}}$; $\mathrm{PDOP}=\sqrt{Q_{11}+Q_{22}+Q_{33}}$; $\mathrm{TDOP}=\sqrt{Q_{44}}$. Since the trace splits additively into the position part and the clock part, $\mathrm{GDOP}^2=\mathrm{PDOP}^2+\mathrm{TDOP}^2$.
:::

::: check
A toy geometry gives $\mathbf{Q}=\mathrm{diag}(2.0,\ 3.0,\ 6.0,\ 1.5)$ in ECEF. Compute PDOP, TDOP and GDOP.
:::

::: answer
$\mathrm{PDOP}=\sqrt{2.0+3.0+6.0}=\sqrt{11.0}=3.317$. $\mathrm{TDOP}=\sqrt{1.5}=1.225$. $\mathrm{GDOP}=\sqrt{11.0+1.5}=\sqrt{12.5}=3.536$, matching $\sqrt{3.317^2+1.225^2}$.
:::

::: check
Why does PDOP not need the ENU rotation that HDOP and VDOP require, even though all three come from the same position block of $\mathbf{Q}$?
:::

::: answer
PDOP is the square root of the *trace* of the position block, $Q_{11}+Q_{22}+Q_{33}$, and the trace of a matrix is invariant under rotation — rotating the axes redistributes the diagonal entries among each other but does not change their sum. HDOP and VDOP are not the whole trace; they are sums of specific diagonal entries after splitting the trace into a horizontal pair and a vertical singleton, and which entries count as "horizontal" or "vertical" depends entirely on which axes you are using. ECEF's $x,y,z$ have no relationship to local horizontal and vertical, so the split has to be done after rotating into a local ENU frame.
:::

::: check
Explain, without appealing to a formula, why VDOP is always at least as large as HDOP for a ground-based GNSS fix.
:::

::: answer
Every satellite a ground receiver can see is above the horizon, so every line-of-sight direction leans toward "up" and none lean away from it. A set of measurement directions that all agree on leaning one way constrains that direction relatively poorly, in the same sense that a tripod with its legs bunched close together wobbles more along the direction they are bunched toward than a tripod with widely spread legs. The horizontal directions, by contrast, are populated in every azimuth around the compass, positive and negative in both horizontal axes, so they constrain the horizontal plane far better. Only satellites below the horizon — impossible for a ground receiver — would balance the vertical the way azimuth already balances the horizontal.
:::

::: check
A receiver's almanac predicts $\mathrm{PDOP}=6.5$ for the next twenty minutes and its dual-frequency UERE is $1.2\,\mathrm{m}$. Estimate the position error, and say whether this window is usable for a requirement of $5\,\mathrm{m}$.
:::

::: answer
$\sigma_{\mathrm{position}} \approx \mathrm{PDOP}\times\sigma_{\mathrm{UERE}} = 6.5\times1.2 = 7.8\,\mathrm{m}$, above the $5\,\mathrm{m}$ requirement despite a UERE that alone would easily meet it — this window's geometry, not its measurement quality, is the problem, and the fix is to wait for better satellite spread or add a differential correction that shrinks the effective UERE rather than the geometry.
:::

## Summary

| Item | Statement |
| --- | --- |
| DOP matrix | $\mathbf{Q}=(\mathbf{G}^{\mathsf T}\mathbf{G})^{-1}$, the unit-variance parameter covariance; pure geometry |
| GDOP | $\sqrt{\mathrm{tr}\,\mathbf{Q}}$; $\mathrm{GDOP}^2=\mathrm{PDOP}^2+\mathrm{TDOP}^2$ |
| PDOP | $\sqrt{Q_{11}+Q_{22}+Q_{33}}$ (ECEF trace, rotation-invariant) |
| TDOP | $\sqrt{Q_{44}}$ |
| HDOP, VDOP | From $\mathbf{Q}_{\mathrm{enu}}=\mathbf{R}\mathbf{Q}_{\mathrm{pos}}\mathbf{R}^{\mathsf T}$; $\mathrm{HDOP}=\sqrt{(Q_{\mathrm{enu}})_{11}+(Q_{\mathrm{enu}})_{22}}$, $\mathrm{VDOP}=\sqrt{(Q_{\mathrm{enu}})_{33}}$; $\mathrm{PDOP}^2=\mathrm{HDOP}^2+\mathrm{VDOP}^2$ |
| Position error rule | $\sigma_{\mathrm{position}} \approx \mathrm{DOP}\times\sigma_{\mathrm{UERE}}$ |
| Good vs. bad geometry, same $\sigma=3\,\mathrm{m}$ | $\mathrm{PDOP}\ 2.33\to34.3$; RMS position error $6.98\,\mathrm{m}\to102.2\,\mathrm{m}$ |
| Vertical is always weakest | Every line of sight leans up, none leans down; $\mathrm{VDOP}\ge\mathrm{HDOP}$ always for a ground receiver |
| Clock rides with vertical | $\mathrm{corr}(\mathrm{up},b)=0.947$ (good) to $0.991$ (bad); low-elevation satellites reduce it most |

Every number in this lesson came from a snapshot: one receiver, one instant, one fixed set of satellite directions. A real constellation moves, and PDOP with it, rising and falling over hours as satellites rise, cross the sky and set — which windows are safe to fly through is a launch-planning question built entirely on the machinery derived here. Before returning to geometry, the next two lessons finish the error budget the pseudorange lesson opened: what the ionosphere and troposphere actually cost after modelling, what dual-frequency buys, and what is left in multipath, ephemeris and clock errors once the easy corrections are made.
