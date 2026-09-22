---
id: l13-relative-od-and-autonomous-onboard-od
title: Relative orbit determination and autonomous onboard OD
minutes: 14
covers:
  - "Relative orbit determination for constellations; autonomous onboard orbit determination"
---

Every estimator this module has built treats one object at a time: an epoch state, a covariance, tracked from the ground. Two situations break that framing. A constellation or formation cares less about each member's absolute position than about its position *relative to its neighbours*, and that relative state can be determined far more precisely than either member's absolute state alone. And a spacecraft that has to know where it is without waiting for a ground-based fit — deep space, or simply operating faster than a ground loop can keep up with — needs orbit determination running onboard, with its own constraints. This closing lesson covers both, building on the whole module rather than introducing a new estimator.

## Why relative accuracy can beat absolute accuracy

Two satellites tracked by the same ground station share more than a coincidence of geometry — they share whatever systematic error that station's data carries. A station range bias, mismodelled tropospheric delay, an imperfectly known station location: each pulls *both* satellites' absolute fits in nearly the same direction, and an error that affects two quantities almost identically is exactly the kind of error that (mostly) cancels when one is subtracted from the other.

::: example A shared station bias, and what it does to relative accuracy
Two satellites in the same orbit family, $237\,\mathrm{km}$ apart along-track, each independently fit from the same three-pass ground-tracking arc used throughout this module, with an unconsidered but shared station range bias of varying size (using the consider-covariance construction from earlier in the module, now with the *same* bias affecting both satellites' fits and a nonzero cross-covariance between them, $\operatorname{Cov}(\hat{\mathbf x}_A,\hat{\mathbf x}_B)=\mathbf S_A\mathbf P_{cc}\mathbf S_B^\mathsf T$):

```python
# sigma_bias    absolute sigma (A, m)         relative sigma, correct     relative sigma, naive
#    5 m        (0.28, 0.16, 0.13)             (0.28, 0.15, 0.14)          (0.38, 0.20, 0.18)
#   30 m        (1.14, 0.65, 0.49)             (0.29, 0.21, 0.14)          (1.57, 0.83, 0.71)
#  100 m        (3.74, 2.15, 1.62)             (0.34, 0.52, 0.14)          (5.15, 2.71, 2.32)
```

As the shared bias grows from $5$ to $100\,\mathrm m$, each satellite's *absolute* position uncertainty grows in lockstep with it — to nearly four metres — but the *correctly computed relative* uncertainty barely moves at all, staying under half a metre throughout, because the dominant error source cancels almost exactly in the difference $\hat{\mathbf x}_A-\hat{\mathbf x}_B$. Treating the two fits as independent (the "naive" column, ignoring their shared-bias cross-covariance entirely) misses this cancellation completely and overstates the true relative uncertainty by up to $16\times$ at the largest bias tested.
:::

::: example Exactly zero, not merely small
For the same two satellites, applying an identical $2.6\,\mathrm{km}$ shift to *both* true positions at once — standing in for a shared ephemeris or gravity-field error large enough to matter operationally — and recomputing the crosslink range directly:

```python
baseline_range_km = 237.05048434707467
range_after_common_shift_km = 237.05048434707467      # identical, to every printed digit
change_km = 0.0

range_if_only_A_shifted_km = 238.31053625153518        # the SAME shift applied to one satellite only
change_km_indep = 1.2600519044605107
```

Shifting both satellites identically leaves the crosslink range completely unchanged — not approximately, exactly, to full floating-point precision — while shifting only one of them by the same amount changes it by $1.26\,\mathrm{km}$. A ground-tracked *absolute* fix has no such immunity: the same $2.6\,\mathrm{km}$ error would appear directly in either satellite's own position.
:::

A crosslink range or range-rate measurement between the two spacecraft — the inter-satellite link of the measurement-types lesson — is the practical way this cancellation is realized directly, rather than relying on correctly bookkeeping two separate absolute fits' cross-covariance after the fact. Because $\partial\rho_{AB}/\partial\mathbf r_A=-\partial\rho_{AB}/\partial\mathbf r_B$, a crosslink measures the relative geometry directly and is structurally blind to any error that shifts both spacecraft the same way — the same insensitivity the table above demonstrates through the covariance algebra, obtained here as a property of the measurement itself rather than of a careful joint estimate. This is the same principle behind differential and RTK GNSS positioning in the GNSS module: differencing two receivers' measurements of the same signal cancels whatever error source affects both nearly identically, leaving the relative baseline far better determined than either receiver's absolute fix.

::: key Relative accuracy is not bounded by absolute accuracy
Two objects can each be known to metres in an absolute sense while their *separation* is known to centimetres, whenever the dominant error sources act on both nearly identically. Crosslink measurements exploit this directly; a shared, correlated error between two independent absolute fits does the same thing more implicitly, provided the correlation is actually tracked rather than discarded by treating the two fits as independent.
:::

For spacecraft flying in a tight formation, the relative dynamics themselves are often worth modelling directly rather than as the difference of two absolute orbits — the Hill or Clohessy-Wiltshire equations, a linearization of relative motion about a circular reference orbit, are the standard tool for that regime and are out of scope here; what this lesson adds is the observability argument for *why* relative tracking is worth the extra modelling effort in the first place.

## Autonomous onboard orbit determination

Everything built in this module runs identically whether the normal equations are solved on the ground or on the spacecraft itself — the difference is entirely in what measurements are available and how much computation and latency the platform can afford. A GNSS receiver on an orbiting spacecraft gives a direct navigation solution the same way a terrestrial receiver does, using the iterative least-squares construction the GNSS module derived in full (pseudoranges, the receiver clock bias as a fourth unknown, dilution of precision from the visible constellation's geometry) — with the added complication that a receiver above the GNSS constellation sees satellites through their side lobes, at lower signal strength and worse geometry, and tracks a faster-moving, higher-dynamics platform than a ground user. Feeding that GNSS-derived position (or the raw pseudoranges directly) into an onboard sequential filter — the EKF or UKF architecture from earlier in this module, built once in the nonlinear-filters module — gives a spacecraft a continuously updated state estimate with no ground contact required at all, the same architecture the inertial-navigation module used to fuse a GNSS-aided position fix with an IMU's own propagation.

Where GNSS is unavailable — deep space, or a mission that must tolerate a GNSS outage — the same sequential-filter architecture runs on whatever measurements remain available onboard: crosslink ranging within a constellation, exactly as this lesson's opening example used it, gives a filter relative-state information without any ground link at all; star-tracker or optical landmark observations give angle-only information the same way the initial-orbit-determination lesson's angles-only methods did, now processed sequentially rather than as a one-time closed-form solution. None of this needs a new estimator — every predict/update step, every process-noise and consider-parameter choice, every observability caution from this module applies exactly as written, with the practical constraint that an onboard processor has to do it all with far less computation, memory and human oversight than a ground system does.

::: warning Onboard autonomy does not relax any of this module's cautions
A filter running without ground oversight cannot lean on an analyst noticing a rising edit rate or a suspicious residual trend the way the residual-editing lesson assumed — those checks either run autonomously too, or the risks they catch (an undetected manoeuvre, a badly observed short arc, an optimistic covariance) go unnoticed for longer, with no one watching. Autonomous onboard orbit determination is this module's machinery running with less supervision, not a reason to need less of it.
:::

## Where this module leaves you

Recovering an orbit from a handful of noisy measurements, the task this module opened with, turned out to need nearly everything built across it: closed-form methods to get started with nothing, the state transition matrix to turn one epoch state into a fit against measurements spread over days, sequential filtering for when the answer has to update in real time, honest accounting for every force and parameter the model does not solve for outright, and a discipline of checking — residuals, edit rates, RIC-frame shape, overlap comparisons — for the difference between a fit that converged and a fit that is correct. None of that discipline is specific to a single object tracked from the ground; it is the same discipline this lesson has just applied to a pair of spacecraft, and to a spacecraft determining its own orbit with nobody watching at all.

## Check yourself

::: check
Explain why the "naive" relative-covariance column in the worked example grows proportionally with the shared bias while the correctly computed relative covariance does not.
:::

::: answer
The naive column simply adds the two satellites' absolute covariances, $\operatorname{Cov}(\hat{\mathbf x}_A)+\operatorname{Cov}(\hat{\mathbf x}_B)$, both of which include the full consider-covariance contribution from the shared bias and therefore both grow with $\sigma_{\text{bias}}$; adding two growing quantities gives a growing sum regardless of any relationship between them. The correct relative covariance additionally subtracts $2\operatorname{Cov}(\hat{\mathbf x}_A,\hat{\mathbf x}_B)=2\mathbf S_A\mathbf P_{cc}\mathbf S_B^\mathsf T$, and because $\mathbf S_A$ and $\mathbf S_B$ are similar (the same station affects both satellites in nearly the same way), this cross term grows at almost the same rate as the two diagonal terms, so the growing parts very nearly cancel, leaving only the (bias-independent) measurement-noise contribution behind.
:::

::: check
Why is a crosslink range measurement described as "structurally blind" to a common-mode error, rather than merely "less sensitive" to one?
:::

::: answer
The crosslink's partial derivatives with respect to the two spacecraft states are exactly equal and opposite, $\partial\rho_{AB}/\partial\mathbf r_A=-\partial\rho_{AB}/\partial\mathbf r_B$; any error that shifts both true positions by the same vector $\boldsymbol\epsilon$ changes the predicted crosslink range by $\partial\rho_{AB}/\partial\mathbf r_A\cdot\boldsymbol\epsilon+\partial\rho_{AB}/\partial\mathbf r_B\cdot\boldsymbol\epsilon=0$ exactly, not merely approximately — the measurement's sensitivity to a perfectly common shift is exactly zero by construction, which is a stronger statement than "small."
:::

::: check
An autonomous onboard filter loses its GNSS signal for an extended period. Which specific machinery from this module, rather than the GNSS module, keeps it operating, and what does the tracking-geometry lesson say to expect from the result?
:::

::: answer
The sequential-filtering architecture (predict/update with $\boldsymbol\Phi$ and $\mathbf Q$) continues to run on whatever measurements remain — crosslink ranges, star-tracker angles, or simply dead-reckoning through the dynamics model with growing process-noise-driven uncertainty if no measurements are available at all. The tracking-geometry lesson's observability argument applies exactly as before: whatever measurements remain will constrain some combinations of the state far better than others (an angles-only sensor, for instance, contributes no range information at all, echoing the initial-orbit-determination lesson), so the resulting covariance should be expected to grow anisotropically, not uniformly, during the outage.
:::

::: check
A mission designer argues that since relative orbit determination can reach centimetre-level accuracy, the absolute orbit determination effort for a constellation can be reduced. Evaluate this claim using this lesson's own result.
:::

::: answer
Not in general — the dramatic relative accuracy in this lesson's example came specifically from a *shared* error source cancelling between two satellites tracked in a correlated way; it says nothing about the *absolute* accuracy, which still depends on the same tracking geometry, arc length, and data quality every earlier lesson in this module addressed, and which an application like conjunction assessment against a *third*, independently tracked object still needs directly (the shared-error cancellation this lesson relies on does not apply to an object that does not share the same error sources at all). Relative and absolute orbit determination answer different operational questions, and doing one well does not substitute for the other.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\operatorname{Cov}(\hat{\mathbf x}_A,\hat{\mathbf x}_B)=\mathbf S_A\mathbf P_{cc}\mathbf S_B^\mathsf T$ | Cross-covariance from a shared unconsidered error source between two fits |
| $\operatorname{Cov}(\hat{\mathbf x}_A-\hat{\mathbf x}_B)=\operatorname{Cov}(\hat{\mathbf x}_A)+\operatorname{Cov}(\hat{\mathbf x}_B)-2\operatorname{Cov}(\hat{\mathbf x}_A,\hat{\mathbf x}_B)$ | Relative covariance; the cross term is what a naive independence assumption discards |
| $\partial\rho_{AB}/\partial\mathbf r_A=-\partial\rho_{AB}/\partial\mathbf r_B$ | Why a crosslink is exactly, not approximately, insensitive to a common-mode shift |
| Hill / Clohessy-Wiltshire equations | Standard linearized relative-motion dynamics for tight formations (name only; out of scope here) |
| Onboard OD | The same predict/update architecture, run on GNSS, crosslink, or optical measurements, with less oversight, not less discipline |

This module set out to recover an orbit from a handful of noisy measurements and to be honest about what that orbit, and its covariance, actually mean. Every lesson after the first built one more piece of that honesty — in the estimator, in the dynamics, in the frame the answer is read in, and in the judgement of a team that checks its own work rather than trusting a fit simply because it converged.
