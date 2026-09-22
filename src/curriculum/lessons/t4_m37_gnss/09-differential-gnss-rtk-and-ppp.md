---
id: l09-differential-gnss-rtk-and-ppp
title: Differential GNSS, RTK and precise point positioning
minutes: 22
covers:
  - Differential GNSS, RTK, and precise point positioning
---

The carrier-phase lesson promised that differencing between two receivers removes the clock terms and clears the way for integer ambiguity resolution, and left the details for here. Those details are also the entire basis of every technique that beats a single receiver's own error budget: differential GNSS, real-time kinematic positioning, and precise point positioning are three different answers to the same question — what do you do with a second source of information about the same errors? — and this lesson derives the differencing that all three start from before showing how each one uses it.

## Single differences: cancel the satellite

Take two receivers, $A$ and $B$, both tracking satellite $i$ at the same epoch. Subtracting their pseudorange equations,

$$
\nabla\rho^i \equiv \rho_A^i - \rho_B^i = \big(\|\mathbf{s}_i-\mathbf{x}_A\| - \|\mathbf{s}_i-\mathbf{x}_B\|\big) + c(\delta t_A - \delta t_B) + (I_A^i-I_B^i) + (T_A^i-T_B^i) + (\varepsilon_A^i-\varepsilon_B^i),
$$

the satellite clock term $c\,\delta t_{sat,i}$ cancels exactly — it was identical in both equations, since both receivers looked at the same satellite at (very nearly) the same instant. If the two receivers are close together, the ionospheric and tropospheric paths to the same satellite are nearly identical too, so $I_A^i-I_B^i$ and $T_A^i-T_B^i$ shrink toward zero as the baseline between $A$ and $B$ shortens; over a baseline of a few kilometres, in ordinary conditions, what is left of the atmosphere is a small residual rather than the metres either receiver saw alone. What survives in full is the *difference* of the two receiver clock biases, $c(\delta t_A-\delta t_B)$ — a single difference removes the satellite's contamination but not the receivers'.

## Double differences: cancel the receiver too

Form a second single difference to a different satellite $j$ and subtract again:

$$
\nabla\Delta\rho^{ij} \equiv \nabla\rho^i - \nabla\rho^j = \Big[\big(\|\mathbf{s}_i-\mathbf{x}_A\|-\|\mathbf{s}_i-\mathbf{x}_B\|\big) - \big(\|\mathbf{s}_j-\mathbf{x}_A\|-\|\mathbf{s}_j-\mathbf{x}_B\|\big)\Big] + \big(\text{residual atmosphere}\big) + \big(\text{residual noise}\big).
$$

The receiver clock difference, common to both single differences, cancels exactly the same way the satellite clock did. What remains is pure geometry — a function only of the two satellite positions and the two receiver positions, with no clock of either kind anywhere in it — plus whatever atmosphere and multipath did not cancel, plus measurement noise. This is the **double difference**, and it is the equation every worked example in this lesson, and the whole of the previous lesson's ambiguity resolution, is built on: with the clocks gone, position (or more precisely, the baseline between the two receivers) is the only unknown structure left.

Combining four one-way measurements with coefficients $(+1,-1,-1,+1)$ changes the noise. If each pseudorange carries independent noise of variance $\sigma^2$, a single difference has variance $2\sigma^2$ and a double difference $4\sigma^2$:

$$
\sigma_{\nabla\rho} = \sqrt{2}\,\sigma, \qquad \sigma_{\nabla\Delta\rho} = 2\sigma,
$$

confirmed by simulating $500{,}000$ draws of eight independent noise terms ($\sigma=0.3\,\mathrm{m}$): the empirical single-difference variance comes out to $0.180\,\mathrm{m}^2$ against the predicted $2\times0.3^2=0.18\,\mathrm{m}^2$, and the empirical double-difference variance to $0.361\,\mathrm{m}^2$ against the predicted $4\times0.3^2=0.36\,\mathrm{m}^2$. A second consequence matters equally for how these measurements must be weighted: two double differences that share the same reference satellite are *correlated*, because both contain that satellite's single difference. For double differences $\nabla\Delta\rho^{ij}$ and $\nabla\Delta\rho^{ik}$ sharing reference satellite $i$, the same simulation gives an empirical covariance of $0.180\,\mathrm{m}^2$ against a predicted $2\sigma^2=0.18\,\mathrm{m}^2$ — exactly half the diagonal variance, a correlation coefficient of $0.5$ regardless of $\sigma$. The receiver-clock lesson warned that differencing correlates the noise; this is the exact size of it, and it is why a properly weighted double-difference solution needs the *full* covariance matrix the sibling module on least squares works with, not a diagonal approximation.

::: key
Single difference (two receivers, one satellite) cancels the satellite clock; $\sigma_{\nabla\rho}=\sqrt2\,\sigma$. Double difference (two receivers, two satellites) additionally cancels the receiver clock difference, leaving pure geometry plus residual atmosphere; $\sigma_{\nabla\Delta\rho}=2\sigma$, and double differences sharing a reference satellite are correlated at $\mathrm{Cov}=2\sigma^2$ (correlation $0.5$).
:::

## DGNSS: code corrections from a point that already knows where it is

A reference station at a precisely surveyed location computes, for each satellite, the pseudorange its own known position predicts, and compares that to what it actually measured. The difference — the *correction* — absorbs the satellite clock error, the ephemeris error, and (over a short enough baseline) most of the atmosphere, exactly the terms a single difference cancels; broadcasting it to a rover and adding it to the rover's own raw pseudorange is single-differencing implemented as a communication protocol rather than a simultaneous computation.

::: example A correction shrinking a four-metre error to decimetres
A base station and a rover $5.4\,\mathrm{km}$ apart, both seeing a satellite at true ranges of $20{,}844{,}346.9\,\mathrm{m}$ and $20{,}843{,}278.3\,\mathrm{m}$, carrying a shared clock-plus-ephemeris-plus-atmosphere error of $4.6\,\mathrm{m}$, plus $\sigma=0.5\,\mathrm{m}$ of independent code noise and multipath at each site:

```python
import numpy as np

rng = np.random.default_rng(5)
true_range_A, true_range_B = 20_844_346.9, 20_843_278.3
common_err = 4.6
sigma_code = 0.5

rho_A = true_range_A + common_err + rng.normal(0, sigma_code)
rho_B_raw = true_range_B + common_err + rng.normal(0, sigma_code)

correction = true_range_A - rho_A          # base broadcasts this
rho_B_corrected = rho_B_raw + correction

print("uncorrected rover error (m):", round(rho_B_raw - true_range_B, 2))
print("DGNSS-corrected rover error (m):", round(rho_B_corrected - true_range_B, 2))
# uncorrected rover error (m): 3.94
# DGNSS-corrected rover error (m): -0.26
```

The shared $4.6\,\mathrm{m}$ error is gone; what is left is only the independent noise at each receiver, which does not cancel because it was never common to begin with. This is exactly the "metre to decimetre" figure attached to differential GNSS: it removes what two receivers share and leaves what they do not.
:::

The correction degrades with distance and with age: as the baseline grows, the atmosphere is no longer common, and as the correction ages, the satellite clock and ephemeris it captured have moved on — a rover applying a stale or distant correction is trusting a cancellation that has partly stopped holding.

::: warning
A differential correction is only as good as how recently, and from how nearby, it was computed. Applying a base station's correction across a baseline of hundreds of kilometres, or minutes after it was generated, does not fail outright — the correction still removes the bulk of the satellite clock error, which does not depend on location — but it silently reintroduces the atmospheric and orbital error the correction was supposed to remove, in proportion to distance and age, with no warning flag anywhere in the rover's own measurements.
:::

## RTK: carrier phase, a nearby base, and a resolved integer

Real-time kinematic positioning runs the identical double-difference machinery, but on carrier phase with its millimetre noise, and with the integer ambiguities the previous lesson resolved rather than left float. Solve for the baseline vector $\mathbf{b}=\mathbf{x}_B-\mathbf{x}_A$ directly — with both clocks gone, there is no fourth unknown, only the three components of $\mathbf{b}$, so the Jacobian row for a double difference against reference satellite $\mathrm{ref}$ is $\mathbf{e}_i(\mathbf{x}_B) - \mathbf{e}_{\mathrm{ref}}(\mathbf{x}_B)$, the difference of two of the same unit line-of-sight vectors the navigation-solution lesson built $\mathbf{G}$ from, now evaluated at the rover.

::: example A baseline recovered to a centimetre
Six satellites, the well-spread geometry used throughout the module, a $5.4\,\mathrm{km}$ baseline, per-receiver carrier noise of $3\,\mathrm{mm}$, a shared (short-baseline) error of up to several metres per satellite that cancels in the double difference exactly as in the DGNSS example, and two different, unresolved receiver clock biases that also cancel:

```python
import numpy as np

x_A = np.array([914936.61, -5526684.03, 3049186.55])         # base, ECEF, m
baseline_true = np.array([4778.13, 1751.28, 1761.41])          # rover minus base, m
x_B_true = x_A + baseline_true

sats = np.array([                                               # the module's six-satellite geometry
    [11350562.41, -23441217.26, 5206502.33],
    [15228615.04, -6538895.01, 20754896.68],
    [-11200404.28, -23485162.13, -5332138.78],
    [-8420060.43, -15461050.49, 19886983.18],
    [4231690.58, -19962286.90, 17000985.17],
    [-4355633.71, -22609494.10, -13239064.60],
])
s_ref, sats_dd = sats[0], sats[1:]

rng = np.random.default_rng(77)
common_err = rng.normal(0, 5.0, size=6)                          # shared error, up to several metres
b_A, b_B = 18500.0, -7340.0                                       # different receiver clocks, m
sigma_phi = 0.003                                                 # 3 mm carrier noise, resolved ambiguities


def phase(sats, x, b, common):
    return np.linalg.norm(sats - x, axis=1) + b + common


rA = phase(sats, x_A, b_A, common_err) + rng.normal(0, sigma_phi, 6)
rB = phase(sats, x_B_true, b_B, common_err) + rng.normal(0, sigma_phi, 6)
DD_obs = ((rA - rB) - (rA - rB)[0])[1:]                            # double difference vs satellite 0


def dd_model_and_jac(baseline, sats_dd, s_ref, x_A):
    x_B = x_A + baseline
    e_dd = (sats_dd - x_B) / np.linalg.norm(sats_dd - x_B, axis=1)[:, None]
    e_ref = (s_ref - x_B) / np.linalg.norm(s_ref - x_B)
    model = (np.linalg.norm(sats_dd - x_A, axis=1) - np.linalg.norm(sats_dd - x_B, axis=1)) \
          - (np.linalg.norm(s_ref - x_A) - np.linalg.norm(s_ref - x_B))
    return model, e_dd - e_ref                # Jacobian row: e_i(B) - e_ref(B)

baseline_est = np.zeros(3)
for it in range(10):
    model, J = dd_model_and_jac(baseline_est, sats_dd, s_ref, x_A)
    step, *_ = np.linalg.lstsq(J, DD_obs - model, rcond=None)
    baseline_est += step
    if np.linalg.norm(step) < 1e-8:
        break

print(it + 1, np.round((baseline_est - baseline_true) * 1000, 2))
print("error magnitude (mm):", round(np.linalg.norm(baseline_est - baseline_true) * 1000, 2))
# 4 [-1.13  7.94 -5.47]
# error magnitude (mm): 9.71
```

Four iterations, and the recovered baseline is within $9.7\,\mathrm{mm}$ of the truth in three dimensions — from millimetre-noise measurements, a metres-scale common error that vanished entirely, and no clock unknown at all. This is what "resolve the ambiguity and you have centimetre positioning" means concretely: the same Gauss-Newton machinery the navigation-solution lesson built, applied to a measurement with three orders of magnitude less noise and one fewer unknown to solve for.
:::

The catch is the baseline length. As $A$ and $B$ move further apart, the residual atmosphere in the double difference grows, and a residual of even a few centimetres is enough to make the correlation-weighted integer search from the previous lesson land on the wrong candidate or fail its ratio test outright — an ambiguity fix needs the leftover error to be small compared to a fraction of a wavelength, a far tighter demand than DGNSS's metre-level target. This is why RTK baselines are conventionally kept to tens of kilometres, why network RTK services interpolate corrections from several reference stations to extend that range, and why, beyond a point, the only honest fallback is to stop trying to fix the integers and accept the float solution's decimetre-level accuracy instead.

## PPP: no base station, precise products instead

Precise point positioning drops the second receiver entirely and instead replaces the broadcast ephemeris and clock — good to about a metre, the ephemeris-and-clock lesson found — with **precise** orbit and clock products, computed after the fact (or with a few hours' delay in real time) from a global tracking network, accurate to centimetres. Without a nearby reference receiver there is nothing to difference the atmosphere against, so PPP estimates the ionosphere directly (usually via the dual-frequency ionosphere-free combination) and carries the tropospheric zenith wet delay as an explicit unknown, updated over time — the estimated filter state the troposphere lesson flagged, typically a slowly varying random walk driven exactly the way the Kalman filtering module's process-noise models describe.

That state is also why PPP converges slowly where RTK converges almost immediately. At a single epoch, the zenith wet delay maps onto every line of sight through the same elevation-dependent factor that maps vertical position onto it, and the receiver clock maps onto every line of sight through the same all-ones direction the dilution-of-precision lesson identified — three different unknowns (vertical position, clock, zenith delay) all leaning on nearly the same combination of measurements at any single instant, on top of the float carrier ambiguities riding along beside them. None of this is resolved by more satellites at one epoch; it is resolved by *time*, as the satellite geometry rotates through the sky over the following tens of minutes and the directions these unknowns lean on stop being so nearly parallel — precisely the kind of state estimation the Kalman filtering module builds, here applied to a filter state that includes position, clock, zenith wet delay and every tracked ambiguity together. The result, after that convergence, is decimetre accuracy with no reference station anywhere nearby; with fixed (rather than float) ambiguities, using additional fractional-cycle-bias products that let the same integer machinery from the previous lesson apply even without a local double difference, PPP can reach RTK-like precision, at the cost of the long convergence remaining.

::: key
DGNSS: broadcast code corrections from a surveyed base, metre to decimetre, degrading with baseline distance and correction age. RTK: carrier phase, double-differenced against a nearby base, resolved integer ambiguities, centimetre — limited by how far the atmosphere can be trusted to cancel. PPP: precise orbit and clock products, no base station, estimated ionosphere and zenith wet delay, decimetre after a convergence of tens of minutes (faster, to comparable precision, with fixed ambiguities via fractional-cycle-bias products).
:::

## Check yourself

::: check
Write the single-difference and double-difference pseudorange equations and state exactly what cancels in each.
:::

::: answer
Single difference, $\nabla\rho^i = \rho_A^i-\rho_B^i$: cancels the satellite clock term $c\,\delta t_{sat,i}$ exactly (identical in both receivers' measurements); leaves the receiver clock difference $c(\delta t_A-\delta t_B)$, and shrinks (but does not exactly cancel) the atmospheric terms as the baseline shortens. Double difference, $\nabla\Delta\rho^{ij}=\nabla\rho^i-\nabla\rho^j$: additionally cancels the receiver clock difference, since it is common to both single differences, leaving pure geometry plus residual atmosphere and noise.
:::

::: check
Pseudorange noise is $\sigma=0.4\,\mathrm{m}$ at each receiver. What are the single-difference and double-difference noise standard deviations?
:::

::: answer
$\sigma_{\nabla\rho}=\sqrt2\times0.4=0.566\,\mathrm{m}$; $\sigma_{\nabla\Delta\rho}=2\times0.4=0.8\,\mathrm{m}$.
:::

::: check
Two double differences share the same reference satellite. What is their covariance, in terms of the one-way pseudorange variance $\sigma^2$, and the resulting correlation coefficient?
:::

::: answer
$\mathrm{Cov}=2\sigma^2$, from the two shared one-way terms (the reference satellite's measurement at each receiver) that appear in both double differences. Since each double difference has variance $4\sigma^2$, the correlation coefficient is $2\sigma^2/4\sigma^2=0.5$, independent of $\sigma$ itself.
:::

::: check
Why does single-differencing fail to remove the receiver clock bias, when it does remove the satellite clock bias?
:::

::: answer
The satellite clock term is the same number in both receivers' equations, because both receivers observed the same satellite at (very nearly) the same instant, so subtracting one equation from the other cancels it exactly. The receiver clock bias is a *different* number at each receiver — each has its own independent oscillator — so subtracting the two equations leaves the difference of two different quantities rather than cancelling a shared one. Removing it requires a second subtraction against a second satellite, which is exactly what makes it a double difference.
:::

::: check
Why does RTK's ambiguity resolution demand much shorter baselines than DGNSS's code corrections tolerate, even though both rely on the same atmospheric cancellation over a short baseline?
:::

::: answer
DGNSS only needs the residual (uncancelled) atmosphere to be small compared to its target accuracy of a metre or so — a fairly loose requirement. RTK's integer ambiguity resolution needs the residual atmosphere to be small compared to a *fraction of a carrier wavelength*, centimetres, because the correlation-weighted integer search from the previous lesson can only find the correct integer, and pass its ratio test, when the float solution is already close enough to the truth that the right integer is the clear winner. The same residual atmosphere that is negligible against a metre-level target can be large enough to flip which integer looks best, which is why RTK's usable baseline is measured in tens of kilometres while DGNSS corrections remain useful over distances an order of magnitude larger.
:::

## Summary

| Item | Statement |
| --- | --- |
| Single difference | $\nabla\rho^i=\rho_A^i-\rho_B^i$; cancels satellite clock; $\sigma_{\nabla\rho}=\sqrt2\,\sigma$ |
| Double difference | $\nabla\Delta\rho^{ij}=\nabla\rho^i-\nabla\rho^j$; additionally cancels receiver clock difference; $\sigma_{\nabla\Delta\rho}=2\sigma$; correlated ($\mathrm{Cov}=2\sigma^2$) with any other DD sharing the reference satellite |
| DGNSS | Broadcast code corrections from a surveyed base; metre to decimetre; degrades with baseline and correction age |
| RTK | Double-differenced carrier phase, resolved integer ambiguities, centimetre; baseline limited by how well the atmosphere still cancels |
| PPP | Precise orbit/clock products, no base station; estimates ionosphere and zenith wet delay as filter states; decimetre after tens of minutes' convergence; fixed ambiguities (fractional-cycle-bias products) recover RTK-like precision |
| Baseline Jacobian (RTK) | Row $i$: $\mathbf{e}_i(\mathbf{x}_B) - \mathbf{e}_{\mathrm{ref}}(\mathbf{x}_B)$; three unknowns, no clock |

Every technique in this lesson assumed a receiver sitting still, or moving gently, on or near the Earth's surface. The next two lessons leave that assumption behind: a receiver above the constellation altogether, and a receiver riding a launch vehicle through the highest dynamics any GNSS receiver has to survive.
