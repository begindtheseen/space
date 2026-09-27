---
id: l05-dilution-of-precision
title: Dilution of precision
minutes: 19
covers:
  - "Dilution of precision: GDOP, PDOP, HDOP, VDOP, TDOP, and what geometry makes each bad"
---

Two friends each tell you, "the treasure is somewhere along this line", and each is a little unsure — their line might be off by a step either way. If their two lines cross at a right angle, the treasure is pinned inside a small square. If the lines cross at a shallow angle, nearly parallel, the same one-step wobble in each line smears the crossing point out along a long, thin sliver. Nobody's measurement got worse. Only the angle between them changed.

The previous lesson ended with exactly this effect in numbers. Six satellites over Cape Canaveral, $3.0\,\mathrm{m}$ of noise on every pseudorange, and a root-mean-square position error of $6.98\,\mathrm{m}$ — a factor of $2.3268$ bigger than the noise. That factor came only from where the satellites sat in the sky. This lesson will move the same six satellites into a tight bunch, keep the same $3.0\,\mathrm{m}$ noise, and watch the fix land about fifteen times further from the truth.

That factor is **[[dilution of precision|dilution-word]]**, or **DOP**: how much the satellite geometry magnifies ranging error into position error. It is worth knowing well, because it is the one number in this module you can work out *before* a single measurement is taken — from an **[[almanac|almanac]]**, the rough satellite orbits every receiver carries. A mission planner deciding whether a landing burn can trust GNSS, or a receiver choosing which of twelve visible satellites to use, is reasoning about DOP. This lesson derives it from the geometry matrix $\mathbf{G}$, splits it into the five numbers engineers quote, and tests it on two skies.

## How noise flows through the fix

Start from the least-squares step of the previous lesson:

$$
\delta = (\mathbf{G}^{\mathsf T}\mathbf{G})^{-1}\mathbf{G}^{\mathsf T}\Delta\boldsymbol\rho .
$$

Look at its shape. The answer $\delta$ is a fixed matrix times the measurements $\Delta\boldsymbol\rho$. So whatever noise is in the measurements passes through that matrix into the answer, stretched and mixed but in a predictable way.

Suppose each pseudorange has its own independent noise with **variance** $\sigma^2$ — the square of the standard deviation, here the square of the **user equivalent range error** (UERE) from the pseudorange lesson. The spread of the answer is then described by its **[[covariance|covariance]]** matrix, and the least-squares module derives it:

$$
\mathrm{Cov}(\delta) = \sigma^2(\mathbf{G}^{\mathsf T}\mathbf{G})^{-1}.
$$

::: note Why it has to be true
Call the fixed matrix $\mathbf{A} = (\mathbf{G}^{\mathsf T}\mathbf{G})^{-1}\mathbf{G}^{\mathsf T}$, so $\delta = \mathbf{A}\,\Delta\boldsymbol\rho$. A linear map sends a covariance $\mathbf{C}$ to $\mathbf{A}\mathbf{C}\mathbf{A}^{\mathsf T}$. The measurement covariance is $\sigma^2\mathbf{I}$ (same variance on each, no links between them), so $\mathrm{Cov}(\delta) = \sigma^2\mathbf{A}\mathbf{A}^{\mathsf T}$. Now multiply out, using the fact that $(\mathbf{G}^{\mathsf T}\mathbf{G})^{-1}$ is symmetric, so it is its own transpose:

$$
\mathbf{A}\mathbf{A}^{\mathsf T} = (\mathbf{G}^{\mathsf T}\mathbf{G})^{-1}\mathbf{G}^{\mathsf T}\mathbf{G}(\mathbf{G}^{\mathsf T}\mathbf{G})^{-1} = (\mathbf{G}^{\mathsf T}\mathbf{G})^{-1}.
$$

The middle $\mathbf{G}^{\mathsf T}\mathbf{G}$ cancels one of the inverses, leaving one.
:::

So the four-by-four matrix

$$
\mathbf{Q} = (\mathbf{G}^{\mathsf T}\mathbf{G})^{-1}
$$

is the covariance of the position-and-clock answer *per unit of measurement variance* — the answer's spread if every pseudorange had noise of exactly $1\,\mathrm{m}$. Now the key fact. $\mathbf{G}$ holds only the directions $\mathbf{e}_i$ to the satellites. Nothing about the noise, the pseudoranges or the receiver's clock is in it. So $\mathbf{Q}$ is pure geometry. You can compute it from an almanac alone, and every kind of DOP is read off its diagonal.

## Five numbers from one matrix

The rows and columns of $\mathbf{Q}$ come in the order $(x, y, z, b)$, the same order as the columns of $\mathbf{G}$. The diagonal entries $Q_{11}$, $Q_{22}$, $Q_{33}$ and $Q_{44}$ (read "Q one one" and so on) are the variances of $x$, $y$, $z$ and $b$ for unit noise.

**GDOP**, the geometric dilution of precision, lumps position and time together. It is the square root of the **[[trace|trace]]** — the sum of the diagonal:

$$
\mathrm{GDOP} = \sqrt{\mathrm{tr}(\mathbf{Q})} = \sqrt{Q_{11}+Q_{22}+Q_{33}+Q_{44}} .
$$

**PDOP**, position dilution of precision, keeps only the three position entries:

$$
\mathrm{PDOP} = \sqrt{Q_{11}+Q_{22}+Q_{33}} .
$$

**TDOP**, time dilution of precision, is the clock entry alone: $\mathrm{TDOP} = \sqrt{Q_{44}}$. The trace splits exactly into a position part and a clock part, so

$$
\mathrm{GDOP}^2 = \mathrm{PDOP}^2 + \mathrm{TDOP}^2 .
$$

Work out any two of the three and the third is a free check.

### Horizontal and vertical need a turn first

A pilot or a lander does not care about "ECEF $x$". She cares about "how far off sideways" and "how far off in height". Those are **HDOP** and **VDOP**, the horizontal and vertical dilution of precision. They cannot be read straight off $Q_{11}$, $Q_{22}$ and $Q_{33}$. Those are errors along Earth-centered axes, and at Cape Canaveral none of those axes points up.

So first turn the axes. Build the local **[[east-north-up|enu]]** directions at the receiver, $\hat{\mathbf{e}}$, $\hat{\mathbf{n}}$ and $\hat{\mathbf{u}}$ (read "e hat", "n hat", "u hat"), exactly as the earlier azimuth–elevation examples did. Stack them as the rows of a rotation matrix $\mathbf{R}$. Then rotate the position block of $\mathbf{Q}$:

$$
\mathbf{Q}_{\mathrm{enu}} = \mathbf{R}\,\mathbf{Q}_{\mathrm{pos}}\,\mathbf{R}^{\mathsf T}, \qquad \mathbf{Q}_{\mathrm{pos}} = \begin{pmatrix} Q_{11}&Q_{12}&Q_{13}\\Q_{21}&Q_{22}&Q_{23}\\Q_{31}&Q_{32}&Q_{33}\end{pmatrix}.
$$

Now the diagonal of $\mathbf{Q}_{\mathrm{enu}}$ is east, north and up, and

$$
\mathrm{HDOP} = \sqrt{(Q_{\mathrm{enu}})_{11} + (Q_{\mathrm{enu}})_{22}}, \qquad \mathrm{VDOP} = \sqrt{(Q_{\mathrm{enu}})_{33}} .
$$

Why did PDOP not need the turn? Because turning the axes never changes the trace. It shuffles variance between the diagonal entries, but the total stays put, the way turning a box on a table does not change how much it holds. So $(Q_{\mathrm{enu}})_{11}+(Q_{\mathrm{enu}})_{22}+(Q_{\mathrm{enu}})_{33} = Q_{11}+Q_{22}+Q_{33}$, and

$$
\mathrm{PDOP}^2 = \mathrm{HDOP}^2 + \mathrm{VDOP}^2 .
$$

PDOP is the same in any frame. HDOP and VDOP each depend on which way is up, which is exactly why they need the turn.

Finally, the rule that makes DOP useful. Multiply a DOP by the UERE and you get the matching error:

$$
\sigma_{\mathrm{position}} \approx \mathrm{PDOP} \times \sigma_{\mathrm{UERE}}, \qquad \sigma_{\mathrm{vertical}} \approx \mathrm{VDOP}\times\sigma_{\mathrm{UERE}},
$$

and so on. The previous lesson's Monte Carlo run already confirmed the PDOP version.

::: key
Dilution of precision: $\mathbf{Q} = (\mathbf{G}^{\mathsf T}\mathbf{G})^{-1}$. $\mathrm{GDOP}=\sqrt{\mathrm{tr}\,\mathbf{Q}}$; $\mathrm{PDOP}=\sqrt{Q_{11}+Q_{22}+Q_{33}}$; HDOP, VDOP and TDOP take the corresponding entries in a local ENU frame ($\mathrm{TDOP}=\sqrt{Q_{44}}$ needs no turn). $\mathrm{GDOP}^2=\mathrm{PDOP}^2+\mathrm{TDOP}^2$ and $\mathrm{PDOP}^2=\mathrm{HDOP}^2+\mathrm{VDOP}^2$. Position sigma is approximately DOP times the UERE.
:::

## The six satellites, named properly

Here is the previous lesson's sky again: four satellites at azimuth and elevation $(135^\circ,60^\circ)$, $(45^\circ,30^\circ)$, $(225^\circ,25^\circ)$ and $(315^\circ,45^\circ)$, plus one nearly overhead at $(10^\circ,75^\circ)$ and one low on the far side at $(200^\circ,15^\circ)$. On a **[[sky plot|skyplot]]** they are spread all round the compass and from low to high. Build $\mathbf{Q}$ from that geometry and read off all five numbers:

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

Both identities hold to the last digit. So with $3\,\mathrm{m}$ of range noise you would expect about $1.33 \times 3 = 4.0\,\mathrm{m}$ of horizontal error and $1.91 \times 3 = 5.7\,\mathrm{m}$ of vertical error. Notice that VDOP, $1.9117$, is bigger than HDOP, $1.3266$, even for this well-spread sky. The vertical is the weaker direction. The last section explains why.

## Bunch the satellites, keep the noise

Keep everything else fixed — same receiver, same $\sigma = 3.0\,\mathrm{m}$ noise, same solver — and swap the six well-spread satellites for six crowded into one corner of the sky: $(60^\circ,55^\circ)$, $(75^\circ,60^\circ)$, $(50^\circ,45^\circ)$, $(65^\circ,50^\circ)$, $(80^\circ,65^\circ)$ and $(55^\circ,40^\circ)$. The azimuths span only $30^\circ$ and the elevations only $25^\circ$.

Each of these is a perfectly good measurement on its own: a real signal with the same $3.0\,\mathrm{m}$ error as before. What changed is that the six arrows $\mathbf{e}_i$ now point in nearly the same direction. That is the treasure hunt's [[nearly parallel lines|crossing-angle]] again. Mathematically, $\mathbf{G}^{\mathsf T}\mathbf{G}$ is close to a matrix with no inverse, and when you invert something that is almost zero, you get something huge:

$$
\mathrm{GDOP}=47.04,\quad \mathrm{PDOP}=34.32,\quad \mathrm{HDOP}=21.72,\quad \mathrm{VDOP}=26.58,\quad \mathrm{TDOP}=32.17.
$$

Each one is between about fourteen and twenty-five times its value for the good sky. Now test the prediction. Run the same Monte Carlo as the previous lesson — $20{,}000$ noisy draws through the identical solver — and the root-mean-square position error comes out at $102.2\,\mathrm{m}$, against $6.98\,\mathrm{m}$ before. That is a factor of $14.6$. The PDOP ratio predicted $34.3243/2.3268=14.75$, a match to within the Monte Carlo's own scatter.

The noise never changed. Geometry alone turned a few-meter fix into one with errors over $100\,\mathrm{m}$. A tall building, a mountainside or a high **[[elevation mask|elevation-mask]]** can do this to a receiver without a single satellite failing.

::: example Good sky against bad sky, same noise
Put the two skies side by side, with $\sigma = 3\,\mathrm{m}$ on every pseudorange in both.

| | Good (spread) | Bad (clustered) | Ratio |
| --- | --- | --- | --- |
| GDOP | $2.6642$ | $47.0409$ | $17.66\times$ |
| PDOP | $2.3268$ | $34.3243$ | $14.75\times$ |
| HDOP | $1.3266$ | $21.7179$ | $16.37\times$ |
| VDOP | $1.9117$ | $26.5799$ | $13.90\times$ |
| TDOP | $1.2976$ | $32.1666$ | $24.79\times$ |
| RMS position error, $M=20{,}000$ runs | $6.98\,\mathrm{m}$ | $102.2\,\mathrm{m}$ | $14.6\times$ |

Predicted position error from the rule "PDOP times UERE": $2.3268 \times 3 = 6.98\,\mathrm{m}$ for the good sky and $34.3243 \times 3 = 103.0\,\mathrm{m}$ for the bad one. The Monte Carlo gave $6.98$ and $102.2\,\mathrm{m}$. Close, as it should be.

The last row of the table came from running twenty thousand fits. The PDOP ratio predicted it without running a single one. That is the whole point of DOP: you can compute it from an almanac before the measurements exist.
:::

## Why the vertical is usually the weak axis

Every satellite a ground receiver can see is above the horizon. So every arrow $\mathbf{e}_i$ has a positive "up" part. For the well-spread six they are $0.9659$, $0.8660$, $0.7071$, $0.5000$, $0.4226$ and $0.2588$ — all positive, none even near zero. The sideways parts, by contrast, come in every direction, positive and negative, because the satellites sit all round the compass.

Think of a camera tripod. Spread the legs all round and it stands firm. Put all the legs on one side and it tips easily in that direction. The horizontal directions have "legs" all round. The vertical has legs on the upper side only — balancing it would take a satellite below the horizon, and the Earth is in the way. That is why VDOP ($1.9117$) beats HDOP ($1.3266$) for the good sky, and VDOP ($26.58$) still beats HDOP ($21.72$) for the bad one.

It is a strong tendency, not a law. A sky with a big empty wedge in azimuth can make the horizontal worse than the vertical. Drop the $(315^\circ,45^\circ)$ satellite from the good six and the west and north-west go empty: HDOP rises to $2.02$ while VDOP stays near $1.91$. For a sky well spread round the compass, though, the vertical loses.

### The clock rides with the vertical

The receiver-clock lesson claimed that this same "everything points up" fact makes the clock bias and the height hard to tell apart. Now it can be made exact. Look at the columns of $\mathbf{G}$. The clock column is all ones. The up part of the position columns is all positive numbers, between $0.26$ and $0.97$. Two columns that are both "all positive" are never far from parallel. So a small error in height and a small error in clock bias make nearly the same pattern in the pseudoranges, and the fix cannot fully separate them.

You can measure how tangled they are with a **[[correlation coefficient|correlation]]** read from $\mathbf{Q}$: turn its position-clock entries into east-north-up, and divide the up-clock entry by the two standard deviations. For the well-spread six it comes out at $0.947$. For the clustered six, $0.991$. Both are close to one — they always will be, for any ground receiver — but $0.947$ is measurably looser, and the gap is what a wide spread of elevations buys.

The lowest satellites do much of that untangling. Their up parts are the smallest, so their rows look least like the clock's row of ones. Drop the $15^\circ$ satellite from the good six: VDOP rises from $1.9117$ to $2.227$, TDOP from $1.2976$ to $1.609$, and the correlation climbs from $0.947$ to $0.959$.

It is not the only satellite that matters, though. Drop the $(45^\circ,30^\circ)$ satellite instead and the damage is far worse — PDOP jumps to $7.07$ and VDOP to $6.03$ — because it leaves a wide empty wedge of sky between north and south-east. Good geometry needs spread in *both* azimuth and elevation.

::: example Trading a noisy satellite for good geometry
The pseudorange lesson showed that a low satellite gives the noisiest measurement in the sky: more atmosphere, more ground bounce, weaker signal. So why not ignore everything below $20^\circ$?

Count the cost. Removing the $15^\circ$ satellite from the good six leaves five, and PDOP rises from $2.3268$ to $2.6398$. The ratio is $2.6398 / 2.3268 = 1.13$, a $13\%$ increase in how much every meter of range error is magnified — purely from losing a satellite that helped spread the sky.

So an aggressive elevation mask buys cleaner measurements at a real, computable price in geometry. The elevation-dependent weighting from the pseudorange lesson keeps some of both: it *trusts* a low satellite less, instead of throwing it away.
:::

::: warning
HDOP and VDOP need the east-north-up turn. Skipping it and reading $Q_{11}$, $Q_{22}$ and $Q_{33}$ straight off the ECEF matrix does not give "another valid version" — it gives wrong numbers. For the good sky above, $\sqrt{Q_{11}+Q_{22}}=2.138$ against the true HDOP of $1.327$, and $\sqrt{Q_{33}}=0.917$ against the true VDOP of $1.912$. The fake vertical figure is more than two times *too small*, which is the dangerous direction to be wrong for a number meant to bound an error. PDOP and GDOP are safe to read in any frame, because they are whole traces. HDOP and VDOP are pieces of a trace, and pieces depend on where you cut.
:::

## Check yourself

::: check
Write GDOP, PDOP and TDOP in terms of $\mathbf{Q}=(\mathbf{G}^{\mathsf T}\mathbf{G})^{-1}$, and give the identity that links all three.
:::

::: answer
$\mathrm{GDOP}=\sqrt{\mathrm{tr}(\mathbf{Q})}=\sqrt{Q_{11}+Q_{22}+Q_{33}+Q_{44}}$. $\mathrm{PDOP}=\sqrt{Q_{11}+Q_{22}+Q_{33}}$. $\mathrm{TDOP}=\sqrt{Q_{44}}$. The trace is the position part plus the clock part, so squaring each gives $\mathrm{GDOP}^2=\mathrm{PDOP}^2+\mathrm{TDOP}^2$.
:::

::: check
A made-up geometry gives $\mathbf{Q}=\mathrm{diag}(2.0,\ 3.0,\ 6.0,\ 1.5)$ in ECEF — that is, those numbers on the diagonal and zeros elsewhere. Compute PDOP, TDOP and GDOP.
:::

::: answer
PDOP: add the three position entries and take the root, $\sqrt{2.0+3.0+6.0}=\sqrt{11.0}=3.317$.

TDOP: $\sqrt{1.5}=1.225$.

GDOP: $\sqrt{11.0+1.5}=\sqrt{12.5}=3.536$.

Check with the identity: $\sqrt{3.317^2+1.225^2}=3.536$. It matches.
:::

::: check
PDOP, HDOP and VDOP all come from the same position block of $\mathbf{Q}$. Why does PDOP not need the turn into east-north-up, when HDOP and VDOP do?
:::

::: answer
PDOP uses the *whole* trace of the position block, $Q_{11}+Q_{22}+Q_{33}$, and turning the axes never changes a trace: it moves variance between the diagonal entries but keeps the total. HDOP and VDOP split that total into a horizontal pair and a vertical single, and which entries count as "horizontal" or "vertical" depends entirely on the axes. ECEF $x$, $y$, $z$ have nothing to do with the local ground and sky, so the split has to be done after turning into east-north-up.
:::

::: check
In your own words, why is VDOP usually bigger than HDOP for a receiver on the ground? And what kind of sky could make it the other way round?
:::

::: answer
Every satellite a ground receiver can see is above the horizon, so every line of sight leans up and none leans down. Measurements that all lean the same way pin down that direction poorly, like a tripod with all its legs on one side. Sideways, the satellites sit all round the compass, so each horizontal direction has "legs" on both sides. Only satellites below the horizon — hidden by the Earth — could balance the vertical.

The other way round needs a sky that is badly spread in azimuth: a big empty wedge of compass directions. Then one horizontal direction has legs on only one side too, and HDOP can exceed VDOP. Dropping the north-west satellite from this lesson's good sky does exactly that: HDOP $2.02$, VDOP $1.91$.
:::

::: check
A receiver's almanac predicts $\mathrm{PDOP}=6.5$ for the next twenty minutes, and its dual-frequency UERE is $1.2\,\mathrm{m}$. Estimate the position error. Is this window good enough for a $5\,\mathrm{m}$ requirement?
:::

::: answer
$\sigma_{\mathrm{position}} \approx \mathrm{PDOP}\times\sigma_{\mathrm{UERE}} = 6.5\times1.2 = 7.8\,\mathrm{m}$. That misses the $5\,\mathrm{m}$ requirement, even though a $1.2\,\mathrm{m}$ range error alone would easily meet it. The geometry is the problem here, not the measurement quality. The fixes are to wait for a better spread of satellites, or to add information from elsewhere (more constellations, a differential correction, height aiding) that shrinks the error or improves the geometry.
:::

## Summary

| Idea | Statement |
| --- | --- |
| DOP matrix | $\mathbf{Q}=(\mathbf{G}^{\mathsf T}\mathbf{G})^{-1}$: the answer's covariance for unit range noise; pure geometry |
| GDOP | $\sqrt{\mathrm{tr}\,\mathbf{Q}}$; $\mathrm{GDOP}^2=\mathrm{PDOP}^2+\mathrm{TDOP}^2$ |
| PDOP | $\sqrt{Q_{11}+Q_{22}+Q_{33}}$, the same in any frame |
| TDOP | $\sqrt{Q_{44}}$ |
| HDOP, VDOP | from $\mathbf{Q}_{\mathrm{enu}}=\mathbf{R}\mathbf{Q}_{\mathrm{pos}}\mathbf{R}^{\mathsf T}$: $\sqrt{(Q_{\mathrm{enu}})_{11}+(Q_{\mathrm{enu}})_{22}}$ and $\sqrt{(Q_{\mathrm{enu}})_{33}}$; $\mathrm{PDOP}^2=\mathrm{HDOP}^2+\mathrm{VDOP}^2$ |
| Error rule | $\sigma \approx \mathrm{DOP}\times\sigma_{\mathrm{UERE}}$ |
| Good versus bad sky, $\sigma=3\,\mathrm{m}$ | PDOP $2.33$ to $34.3$; RMS position error $6.98\,\mathrm{m}$ to $102.2\,\mathrm{m}$ |
| What makes DOP bad | satellites bunched together, all at similar elevation, or on one side of the sky: nearly parallel lines of sight |
| Vertical is usually weakest | every line of sight leans up; VDOP exceeds HDOP for a sky spread round the compass |
| Clock rides with height | up-clock correlation $0.947$ (good sky) and $0.991$ (bad sky); low satellites untangle them most |

Every number here came from a snapshot: one receiver, one instant. Real satellites move, so PDOP rises and falls over the hours, and choosing [[safe windows to fly through|launch-windows]] is a planning question built on exactly this machinery. Before returning to geometry, the next two lessons finish the error budget: what the ionosphere and troposphere really cost, what a second frequency buys, and what is left in multipath, orbit and clock errors.

::: context dilution-word Watering down the juice
To **dilute** something is to water it down — the way adding water to juice makes it weaker. Here, the "precision" of each range measurement gets watered down on its way into a position. A DOP of $1$ would mean no loss at all; a DOP of $2$ means your position is twice as uncertain as each range.

A common rule of thumb calls a DOP of $1$ to $2$ excellent, $2$ to $5$ good, $5$ to $10$ moderate and above $20$ poor. Many receivers let the user set a PDOP limit, above which they stop reporting a fix.
:::

::: context almanac The satellites' timetable
Every GPS satellite broadcasts an **almanac**: a coarse description of the orbits of the whole constellation. It is good to a few kilometers for weeks, which is plenty to know which satellites are above the horizon and in what direction.

Because DOP needs only directions, the almanac is enough to compute it hours or days ahead. That is how launch teams and survey crews plan around bad-geometry windows before they ever switch a receiver on. The precise orbits used in the actual fix — the ephemeris — come from each satellite separately and are only good for a few hours.
:::

::: context covariance How two errors move together
The **variance** of one quantity measures how much it scatters. The **covariance** of two quantities measures whether they scatter *together*: positive if one tends to be high when the other is high, negative if one is high when the other is low, zero if they have nothing to do with each other.

A covariance matrix collects all of these. The diagonal holds each quantity's own variance. The off-diagonal entries hold the covariances between pairs. For GNSS, the off-diagonal entry between height and clock is the one that matters most, as the end of this lesson shows. The Kalman filter module carries exactly this matrix, called $\mathbf{P}$, from step to step.
:::

::: context trace Adding up the diagonal
The **trace** of a square matrix is the sum of the numbers on its main diagonal, from top left to bottom right. It is written $\mathrm{tr}$.

For a covariance matrix, the trace is the total variance in all directions together. Turning the axes cannot change that total, the same way turning a map on the table does not change how far apart two towns are. That is why PDOP and GDOP come out the same in any frame, while HDOP and VDOP, which use only part of the diagonal, do not.
:::

::: context enu Three directions at the receiver
At any spot on Earth, **up** points straight away from Earth's center, **north** points along the ground toward the North Pole, and **east** points along the ground at right angles to both. In this side view, with the receiver on the right-hand edge of the Earth, east points straight into the page.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <circle cx="100" cy="150" r="90" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <line x1="100" y1="150" x2="100" y2="30" stroke="#6c7a93" stroke-width="2" stroke-dasharray="5 4"/>
  <polygon points="100,22 95,34 105,34" fill="#6c7a93"/>
  <text x="108" y="30" font-size="12" fill="#6c7a93">ECEF z (pole)</text>
  <circle cx="100" cy="150" r="3" fill="#1f2a44"/>
  <circle cx="177.9" cy="105" r="5" fill="#b4232c"/>
  <line x1="177.9" y1="105" x2="225.5" y2="77.5" stroke="#1f2a44" stroke-width="3"/>
  <polygon points="232.4,73.5 219.6,74.8 225.1,84.3" fill="#1f2a44"/>
  <text x="238" y="72" font-size="12" fill="#1f2a44">up</text>
  <line x1="177.9" y1="105" x2="152.9" y2="61.7" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="148.9,54.8 148.0,67.6 157.5,62.1" fill="#1d6fd1"/>
  <text x="130" y="50" font-size="12" fill="#1d6fd1">north</text>
  <circle cx="290" cy="150" r="9" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <line x1="284" y1="144" x2="296" y2="156" stroke="#1f2a44" stroke-width="2"/>
  <line x1="296" y1="144" x2="284" y2="156" stroke="#1f2a44" stroke-width="2"/>
  <text x="290" y="178" font-size="12" fill="#1f2a44" text-anchor="middle">east: into the page</text>
  <text x="192" y="125" font-size="12" fill="#b4232c">receiver, 30° N</text>
</svg>
```

Only at the North Pole would "up" match ECEF $z$. Everywhere else, the two are tilted apart by the angle from the pole — which is why HDOP and VDOP need the turn.
:::

::: context skyplot A map of the sky
A **sky plot** is a map of the sky seen from the receiver. The center is straight overhead, the outer ring is the horizon, and the middle ring is $45^\circ$ up. North is at the top. Left: the six well-spread satellites. Right: the six clustered ones.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 215" font-family="Inter, Arial, sans-serif">
  <g fill="none" stroke="#6c7a93" stroke-width="1.2">
    <circle cx="90" cy="115" r="72"/><circle cx="90" cy="115" r="36"/>
    <circle cx="270" cy="115" r="72"/><circle cx="270" cy="115" r="36"/>
  </g>
  <text x="90" y="38" font-size="12" fill="#1f2a44" text-anchor="middle">N</text>
  <text x="270" y="38" font-size="12" fill="#1f2a44" text-anchor="middle">N</text>
  <g fill="#1d6fd1">
    <circle cx="107.0" cy="132.0" r="5"/><circle cx="123.9" cy="81.1" r="5"/><circle cx="53.2" cy="151.8" r="5"/>
    <circle cx="64.5" cy="89.5" r="5"/><circle cx="92.1" cy="103.2" r="5"/><circle cx="69.5" cy="171.4" r="5"/>
  </g>
  <g fill="#b4232c">
    <circle cx="294.2" cy="101.0" r="5"/><circle cx="293.2" cy="108.8" r="5"/><circle cx="297.6" cy="91.9" r="5"/>
    <circle cx="299.0" cy="101.5" r="5"/><circle cx="289.7" cy="111.5" r="5"/><circle cx="302.8" cy="92.1" r="5"/>
  </g>
  <text x="90" y="18" font-size="12" fill="#1d6fd1" text-anchor="middle">spread: PDOP 2.33</text>
  <text x="270" y="18" font-size="12" fill="#b4232c" text-anchor="middle">clustered: PDOP 34.3</text>
  <text x="90" y="206" font-size="11" fill="#6c7a93" text-anchor="middle">rings: horizon, 45° up</text>
  <text x="270" y="206" font-size="11" fill="#6c7a93" text-anchor="middle">rings: horizon, 45° up</text>
</svg>
```

Same noise on every dot. The right-hand fix is about fifteen times worse.
:::

::: context crossing-angle Where two fuzzy lines meet
Each measurement pins you to a band, not a thin line. Where two bands cross at a wide angle (left), the overlap — the red patch where you might be — is small. Cross them at a shallow angle (right) and the same bands overlap in a long sliver.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 205" font-family="Inter, Arial, sans-serif">
  <line x1="29.9" y1="146.0" x2="136.0" y2="39.9" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="44.0" y1="160.1" x2="150.1" y2="54.0" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="136.0" y1="160.1" x2="29.9" y2="54.0" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="150.1" y1="146.0" x2="44.0" y2="39.9" stroke="#1d6fd1" stroke-width="1.5"/>
  <polygon points="104.1,100.0 90.0,114.1 75.9,100.0 90.0,85.9" fill="#b4232c"/>
  <line x1="247.1" y1="172.1" x2="273.2" y2="24.4" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="266.8" y1="175.6" x2="292.9" y2="27.9" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="273.2" y1="175.6" x2="247.1" y2="27.9" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="292.9" y1="172.1" x2="266.8" y2="24.4" stroke="#1d6fd1" stroke-width="1.5"/>
  <polygon points="280.2,100.0 270.0,157.6 259.8,100.0 270.0,42.4" fill="#b4232c"/>
  <text x="90" y="195" font-size="12" fill="#1f2a44" text-anchor="middle">cross at 90°</text>
  <text x="270" y="195" font-size="12" fill="#1f2a44" text-anchor="middle">cross at 20°</text>
</svg>
```

The bands are equally wide in both pictures. Only the angle changed, and the sliver on the right is about four times longer than the patch on the left.
:::

::: context elevation-mask Ignoring the low sky
An **elevation mask** is a cut-off angle: the receiver ignores any satellite lower than, say, $5^\circ$ or $15^\circ$ above the horizon. Low signals travel through the most atmosphere and are the likeliest to bounce off the ground or buildings, so masking them out makes each measurement cleaner.

But low satellites are also the ones that spread the sky. A launch pad hemmed in by a service tower, a city street between tall buildings, or a rocket whose own body hides part of the sky from its antenna all act like a high mask — and all push DOP up.
:::

::: context correlation A number from minus one to one
A **correlation coefficient** is a covariance divided by the two standard deviations, so it always lands between $-1$ and $1$. Near $1$ means two errors almost always move together; near $0$ means they are unrelated.

A value of $0.947$ between height error and clock error says: when the fix is too high, the clock estimate is almost always off in the matching way too. That is why a good clock helps height so much, and why the receiver-clock lesson's clock-coasting mode pays off mostly in the vertical.
:::

::: context launch-windows DOP on the launch calendar
Because DOP can be predicted from the almanac, a launch team can plot PDOP against time for the whole day and mark the stretches where it spikes. If the vehicle's navigation or the range-safety tracking depends on GNSS at some point in the flight, those stretches become part of the launch-window analysis.

This module's DOP exercise asks you to do exactly that: compute PDOP over a day at a launch site's latitude with a $5^\circ$ mask, confirm with Monte Carlo that position error follows PDOP times UERE, then raise the mask to $15^\circ$ and watch the bad windows grow.
:::
