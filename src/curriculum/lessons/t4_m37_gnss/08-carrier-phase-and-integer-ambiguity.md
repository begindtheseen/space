---
id: l08-carrier-phase-and-integer-ambiguity
title: Carrier phase and integer ambiguity resolution
minutes: 22
covers:
  - Carrier phase measurements, cycle slips, integer ambiguity resolution with LAMBDA
---

Everything so far in this module has measured range with the code: a ruler with marks every $293\,\mathrm{m}$ on C/A, read to a few percent of a chip. The carrier underneath that code is also a ruler, with marks every $19.03\,\mathrm{cm}$ on L1, and a receiver can read its phase to a few percent of a cycle — millimetres, three orders of magnitude finer than the code. That precision is not free. A phase is only ever known modulo one cycle; the receiver has no way to count, from a standing start, how many whole wavelengths of carrier lie between it and the satellite. This lesson is about that trade: a measurement a thousand times more precise than the code, contaminated by an integer it takes real machinery to pin down.

## The carrier phase measurement equation

Once a receiver's phase-lock loop has locked to a satellite's carrier, it tracks the beat phase between the incoming signal and its own local replica, and it *counts* — every time the tracked phase advances through a full cycle, an integer counter increments. What it measures, at any instant after lock, is the current fractional phase plus the accumulated integer count since lock; what it does not know is how many whole cycles existed between the satellite and the receiver *before* it started counting. Call that missing count $N_i$, the **integer ambiguity**. Converting the accumulated phase to range units (multiplying by $\lambda$) gives a measurement equation that looks like the pseudorange equation with two changes:

$$
\Phi_i = \|\mathbf{s}_i-\mathbf{x}\| + c\,\delta t_{rx} - c\,\delta t_{sat,i} - I_i + T_i + \lambda N_i + \varepsilon_{\Phi,i}.
$$

The troposphere enters with the same sign as it does for code, because it is not dispersive and delays phase and group velocity equally. The ionosphere enters with the *opposite* sign: the ionosphere lesson's plasma-physics derivation showed the phase refractive index is $n\approx1-40.3\,N_e/f^2$, less than one, so the carrier's phase *advances* through the ionosphere by exactly the amount the code's group delay is retarded. A receiver comparing its code and carrier measurements on the same frequency sees them drift apart at twice the ionospheric delay's rate — a fact the next lesson's differential and precise techniques put to direct use. The new term, $\lambda N_i$, is the unknown integer times the wavelength — for L1, $N_i$ multiplied by $19.03\,\mathrm{cm}$ — and it is *constant* for as long as the receiver holds lock, however far the satellite moves, however the geometry changes. Noise $\varepsilon_{\Phi,i}$ on a well-designed carrier tracking loop is a few millimetres, against the code's tens of centimetres to a few metres — the reason for everything in this lesson.

::: key
Carrier phase (in range units): $\Phi_i = \|\mathbf{s}_i-\mathbf{x}\| + c\,\delta t_{rx} - c\,\delta t_{sat,i} - I_i + T_i + \lambda N_i + \varepsilon_{\Phi,i}$ — ionosphere sign flipped from code, troposphere the same, plus an integer-cycle ambiguity $N_i$ that is constant while lock holds. Millimetre-level noise; on L1, $\lambda=19.03\,\mathrm{cm}$.
:::

::: example Turning an accumulated count into a range
A receiver reports an accumulated L1 carrier phase of $84{,}213{,}905.62$ cycles since it locked to a satellite. If the correct integer ambiguity is later determined to be $N=84{,}213{,}600$ cycles, the range this measurement corresponds to (ignoring clock and atmosphere, which are separate terms in the full equation) is $(84{,}213{,}905.62 - 84{,}213{,}600)\times0.1903 = 58.16\,\mathrm{m}$. Get $N$ wrong by even one cycle and the answer is off by $19.03\,\mathrm{cm}$ — which is exactly why an unresolved or mis-resolved ambiguity is worse than useless: a code-level position error hides in plain sight as noise, while a wrong integer produces a confident, precise, and wrong answer.
:::

## Cycle slips: when the count breaks

The integer count survives only as long as the phase-lock loop keeps continuous lock. Signal blockage, a sudden drop in carrier-to-noise density, or dynamics beyond what the loop's bandwidth can follow — the tracking-loop lesson ahead works out exactly how much — all cause the loop to lose lock and reacquire moments later, at a *different*, unknown starting count. The phase measurement itself looks almost the same before and after; what has silently changed is $N_i$, now offset by some integer number of cycles from what it was. This is a **cycle slip**, and if it goes undetected, every measurement after it is precise, smooth, and wrong by a fixed offset.

Detection exploits the one thing a cycle slip is not: smooth. Geometric range changes continuously, bounded by the satellite's and receiver's real accelerations, so consecutive phase measurements should be almost perfectly predictable from the recent past — in particular, the *second difference* of phase across three consecutive epochs should be small and steady, reflecting only genuine range curvature and measurement noise. A slip breaks that pattern sharply, for exactly one interval.

::: example Catching a thirty-seven-cycle slip
Simulate ten seconds of phase tracking at $1\,\mathrm{Hz}$ for a satellite closing in range at a steady $700\,\mathrm{m/s}$ (no significant range acceleration over this short a window), with $1\,\mathrm{cm}$-class phase noise, and inject a $+37$-cycle slip starting at epoch $5$:

```python
import numpy as np

lam = 0.1903
t = np.arange(0, 10, 1.0)
R = 2.2e7 - 700.0 * t                       # smooth, near-linear range, m
rng = np.random.default_rng(11)
phase = R / lam + 15_342_871 + rng.normal(0, 0.01, size=len(t))   # cycles
phase[5:] += 37                              # a cycle slip at epoch 5

d2 = np.diff(phase, 2)                       # second difference, cycles
np.set_printoptions(suppress=True, precision=3)
print(d2)
# [ -0.015  -0.016   0.019  36.996 -36.987  -0.017   0.014  -0.034]
```

Every second difference away from the slip sits at the $0.01$–$0.03$-cycle noise floor; the slip produces a sharp doublet of nearly $+37$ then $-37$ cycles — the unmistakable signature of a single-epoch step discontinuity under double differencing, thresholded in practice at a handful of cycles, far above anything ordinary noise or real range curvature produces. Once flagged, the receiver either resolves a fresh ambiguity from that epoch onward or, if enough redundant information survives (a second frequency, for instance, whose geometry-free combination isolates ambiguity and ionosphere from the shared geometric range), estimates the slip's exact integer size and repairs the count without losing continuity.
:::

::: warning
A slip need not be an integer number of *full* cycles. Some carrier trackers — a Costas-type loop, historically necessary when the L1 signal's data modulation flips the carrier's sign every navigation bit — can only resolve phase modulo half a cycle, so a slip in that architecture can leave a spurious half-cycle offset as well as any integer one. Modern civil signals with a dataless pilot component (L2C, L5, L1C) sidestep the problem by giving the loop a component with no sign flips to track, but a receiver relying on the original L1 C/A signal's data channel must account for the half-cycle case separately.
:::

## Resolving the ambiguity: from float to fixed

A single receiver, alone, cannot resolve $N_i$ from carrier phase — the ambiguity and the receiver clock bias are both unknowns that shift every measurement, and nothing in one receiver's data tells them apart. Ambiguity resolution is done on **differenced** measurements between two receivers and pairs of satellites, which the next lesson derives in full; the short version is that differencing cancels the clock terms and, over a short baseline, most of the atmosphere, leaving a linear measurement in position and a set of *integer* ambiguities alone. Solving that system by ordinary least squares — ignoring, for a moment, that the ambiguities must be integers — gives a **float solution**: a real-valued estimate $\hat{\mathbf{N}}$ for each ambiguity, together with a covariance matrix $\mathbf{Q}_N$ that is, in practice, strongly correlated, because every ambiguity shares the same satellite geometry.

The right question is not "what is the nearest integer to each float ambiguity," rounded independently — it is which integer *vector* $\mathbf{N}$ minimises the correlation-weighted distance

$$
(\mathbf{N}-\hat{\mathbf{N}})^{\mathsf T}\mathbf{Q}_N^{-1}(\mathbf{N}-\hat{\mathbf{N}}),
$$

over all integer vectors, not only the nearest one componentwise. **LAMBDA** — the Least-squares AMBiguity Decorrelation Adjustment — solves exactly this integer least-squares problem. Its contribution is not the criterion above, which is a direct consequence of the float solution's covariance; it is an efficient way to search for the minimiser when there are ten, twenty, or more correlated ambiguities, where a naive search over nearby integers is computationally hopeless. LAMBDA applies an integer-preserving transformation — one that maps integer vectors to integer vectors, invertibly — chosen to decorrelate $\mathbf{Q}_N$ as much as possible, turning a long, thin, tilted search ellipsoid into something close to a sphere; searching a near-spherical region for the best integer point is vastly cheaper than searching the original elongated one, and the transformation is undone at the end to recover the answer in the original ambiguities.

::: example Why independent rounding gets it wrong
Take two correlated ambiguities with float estimate $\hat{\mathbf{N}}=(3.10,\,-4.45)$ and covariance $\mathbf{Q}_N=\begin{pmatrix}1.0&0.85\\0.85&3.0\end{pmatrix}$ (correlation $0.49$ — a realistic value for double-differenced ambiguities sharing geometry). Rounded independently, componentwise, the answer is $(3,-4)$. Searching the correlation-weighted criterion directly:

```python
import numpy as np

Q_N = np.array([[1.0, 0.85], [0.85, 3.0]])
Qinv = np.linalg.inv(Q_N)
N_float = np.array([3.10, -4.45])

results = []
for n1 in range(0, 7):
    for n2 in range(-8, -1):
        d = np.array([n1, n2]) - N_float
        results.append((d @ Qinv @ d, n1, n2))
results.sort()
for cost, n1, n2 in results[:2]:
    print(f"N=({n1},{n2})  cost={cost:.4f}")
# N=(3,-5)  cost=0.1049
# N=(3,-4)  cost=0.1357
```

The correlation-weighted search finds $(3,-5)$, *not* $(3,-4)$ — independent rounding is not even the best integer point once the covariance's off-diagonal term is accounted for, because a positive error in the first ambiguity is statistically linked to a positive error in the second, and $(3,-4)$ moves both away from $\hat{\mathbf{N}}$ in a direction the correlation says is jointly less likely than $(3,-5)$'s. This is precisely the effect a decorrelating transformation is built to exploit efficiently once there are far more than two ambiguities to search over.
:::

Finding the best integer candidate is not the end of it: a wrong integer, once accepted, produces a confidently wrong position, so every resolution is checked with a **ratio test** — the second-best candidate's cost divided by the best's. A large ratio means the best candidate stands out clearly; a ratio near one means the data cannot yet distinguish between two (or more) integer vectors, and the correct response is to *not* fix, carrying the float solution forward until more epochs, more satellites, or a second frequency sharpen $\hat{\mathbf{N}}$ enough to separate the candidates. In the example above, the ratio is $0.1357/0.1049=1.29$ — comfortably below the ratios of two to three or more that operational systems typically require before accepting a fix, so this particular epoch's data would correctly be left float rather than forced to an integer that is only marginally preferred.

::: warning
Do not fix on the best integer candidate alone, however much better its cost looks by eye. A ratio test exists because the float covariance $\mathbf{Q}_N$ already tells you how confident the *closest* integer is relative to the *next*-closest, and accepting a low-ratio fix trades a known, honest, real-valued uncertainty for an unknown, possibly wrong, and falsely precise integer. A receiver that fixes too eagerly in poor geometry or short observation spans is the single most common source of a carrier-phase solution that is precise, consistent, and metres from the truth.
:::

## Check yourself

::: check
Write the carrier phase measurement equation and state which sign differs from the pseudorange equation, and why.
:::

::: answer
$\Phi_i = \|\mathbf{s}_i-\mathbf{x}\| + c\,\delta t_{rx} - c\,\delta t_{sat,i} - I_i + T_i + \lambda N_i + \varepsilon_{\Phi,i}$. The ionospheric term is $-I_i$ instead of $+I_i$: the ionosphere delays the code's group velocity but advances the carrier's phase velocity by the same magnitude, a direct consequence of the plasma's refractive index being less than one for phase. The tropospheric term keeps the same sign as the pseudorange equation because the troposphere is not dispersive and delays phase and group equally.
:::

::: check
A cycle slip shifts the integer ambiguity by $-12$ cycles on L2 ($\lambda=24.42\,\mathrm{cm}$). If undetected, by how much does every subsequent range measurement on that satellite shift, and in which direction?
:::

::: answer
$\lambda N$ appears with a positive sign in the measurement equation, so a $-12$-cycle shift in $N$ decreases the modelled range contribution by $12\times0.2442=2.93\,\mathrm{m}$; left uncorrected, every measurement after the slip reads $2.93\,\mathrm{m}$ short, a constant offset the receiver would otherwise treat as genuine range.
:::

::: check
Why does the second difference of carrier phase, rather than the phase itself or its first difference, serve as the natural cycle-slip detector?
:::

::: answer
Geometric range is smooth, so its own second difference is small and slowly varying, reflecting only genuine range acceleration; the phase's first difference is dominated by the (potentially large) range rate itself and is not near zero, making a threshold hard to set, while the raw phase carries the full, large range value and is not directly comparable epoch to epoch at all. A single-epoch integer jump in $N$ is a step discontinuity in the phase sequence, and a step discontinuity produces a sharp, large doublet in the second difference — easily separated from the small, steady values normal tracking produces — while leaving the underlying range trend undisturbed everywhere else.
:::

::: check
Two integer ambiguity candidates have correlation-weighted costs of $0.041$ and $0.052$. Compute the ratio test and say whether this looks like a safe fix.
:::

::: answer
Ratio $=0.052/0.041=1.27$. This is close to one, meaning the second-best candidate is nearly as consistent with the data as the best — not a safe fix by the standards used in the lesson's worked example (ratios of two to three or higher). The correct action is to keep the float solution and wait for more data.
:::

::: check
Why can a single, standalone receiver not resolve its own carrier-phase integer ambiguities from one epoch's measurements, no matter how many satellites it tracks?
:::

::: answer
Every measurement carries both the unknown integer ambiguity $N_i$ (one per satellite) and the unknown receiver clock bias (common to all satellites), and nothing in a single receiver's own data distinguishes a constant added to every range (the clock) from a satellite-specific integer number of wavelengths (each $N_i$) — both are unknowns to be estimated alongside position, and there are more unknowns than any single-receiver, single-epoch measurement set can separate cleanly enough to force $N_i$ to an integer. Differencing between two receivers, taken up in the next lesson, removes the clock terms entirely and leaves a system where the integer constraint has something to bite on.
:::

## Summary

| Item | Statement |
| --- | --- |
| Carrier phase equation | $\Phi_i = \|\mathbf{s}_i-\mathbf{x}\| + c\,\delta t_{rx} - c\,\delta t_{sat,i} - I_i + T_i + \lambda N_i + \varepsilon_{\Phi,i}$; millimetre noise |
| Integer ambiguity | $N_i$, constant while lock holds; on L1, one cycle $=19.03\,\mathrm{cm}$ |
| Cycle slip | An undetected jump in $N_i$; detected by an anomalous spike in the phase's second difference against a small, steady baseline |
| Float solution | Least-squares real-valued $\hat{\mathbf{N}}$ with covariance $\mathbf{Q}_N$, from differenced carrier phase (next lesson) |
| Integer least squares | Minimise $(\mathbf{N}-\hat{\mathbf{N}})^{\mathsf T}\mathbf{Q}_N^{-1}(\mathbf{N}-\hat{\mathbf{N}})$ over integer $\mathbf{N}$ — not componentwise rounding when ambiguities are correlated |
| LAMBDA | Decorrelates $\mathbf{Q}_N$ with an integer-preserving transformation, making the integer search efficient at real ambiguity-vector sizes |
| Ratio test | Second-best cost over best cost; low ratio (near 1) means do not fix yet |

With the integer resolved, a receiver's range measurements go from metre-class to millimetre-class — the entire basis of the centimetre-level positioning the next lesson builds, alongside the differencing that made ambiguity resolution possible in the first place and the precise point positioning that resolves ambiguities without a nearby reference station at all.
