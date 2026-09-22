---
id: l07-linear-covariance-analysis
title: Linear covariance analysis, and where it breaks
minutes: 17
covers:
  - 'Linear covariance analysis as the fast complement: one run gives the covariance a thousand runs would estimate'
  - Where LinCov is valid and where nonlinearity, saturation and discrete logic force you back to Monte Carlo
---

Every Monte Carlo campaign in this module has cost thousands of trajectory integrations to characterize the spread of one output. There is a cheaper way to get the same answer, when the system earns it: propagate the *covariance itself* through the linearized dynamics in a single pass, instead of propagating ten thousand individual sampled trajectories and computing their spread afterward. This is **linear covariance analysis**, LinCov, and it is one of the most useful tools in this module precisely because it is fast enough to run inside a design loop where a full Monte Carlo campaign is not — a parameter sweep that would take an afternoon by Monte Carlo takes seconds by LinCov.

The speed comes at the price of an assumption, and the assumption is not always announced when it breaks. This lesson derives the method, confirms with real numbers that it reproduces what a full campaign would estimate when its assumption holds, and then breaks that assumption on purpose — with a single actuator limit added to an otherwise identical system — to show exactly what happens to the answer, and by how much, once it does not.

## The covariance propagation

Recall the sandwich rule from the probability and statistics module: if $\mathbf{x}$ is a random vector with covariance $\mathbf{P}$ and $\mathbf{y} = \mathbf{A}\mathbf{x}$ for a fixed matrix $\mathbf{A}$, then $\operatorname{Cov}(\mathbf{y}) = \mathbf{A}\mathbf{P}\mathbf{A}^{\mathsf{T}}$. A vehicle's error dynamics, linearized about a reference trajectory, are exactly a sequence of such linear maps — a state transition matrix $\mathbf{\Phi}$ carrying an error state forward one step — with process noise $\mathbf{Q}$ injected at each step to represent whatever the linearization does not otherwise capture. Applying the sandwich rule once per step and adding the injected noise gives the same recursion the Kalman filter module derived for a covariance that is never updated by a measurement, because here nothing is being estimated — the vehicle itself, not an onboard filter, is what is being dispersed:

$$
\mathbf{P} \leftarrow \mathbf{\Phi}\,\mathbf{P}\,\mathbf{\Phi}^{\mathsf{T}} + \mathbf{Q}.
$$

Run this once per time step along the reference trajectory, from an initial dispersion covariance $\mathbf{P}_0$, and the final $\mathbf{P}$ is the covariance a Monte Carlo campaign of any size would estimate only approximately, and only after actually flying every one of its trajectories. When the process noise is zero across the interval of interest — a pure propagation of an initial-condition dispersion with nothing else feeding in along the way — the whole multi-step recursion collapses to a single matrix product against the composed transition matrix from start to end, $\mathbf{P}_{\mathrm{final}} = \mathbf{\Phi}_{\mathrm{total}}\mathbf{P}_0\mathbf{\Phi}_{\mathrm{total}}^{\mathsf{T}}$ — literally one linear-algebra operation standing in for the entire campaign, which is the case the first worked example below uses to make the comparison as direct as possible.

::: key
Linear covariance analysis: $\mathbf{P} \leftarrow \mathbf{\Phi}\mathbf{P}\mathbf{\Phi}^{\mathsf{T}} + \mathbf{Q}$, propagated through the linearized closed-loop system. One run gives the covariance a Monte Carlo campaign estimates with thousands of trajectories. Valid while deviations stay small enough for the linearization to hold and the driving uncertainties stay Gaussian; it breaks at saturations, deadbands and mode logic — exactly in the tail, which is usually where the answer matters most.
:::

::: example One run against ten thousand: an attitude error propagated over a coast
Take an attitude trim scenario: initial attitude error $\theta_0$ and rate error $\omega_0$ at the start of a $T=20\,\mathrm{s}$ coast, dispersed as Gaussian with $\sigma_\theta = 0.4^\circ$, $\sigma_\omega = 0.05^\circ/\mathrm{s}$, and a correlation of $\rho=0.25$ between them (a shared calibration source, in the spirit of the correlated-dispersions lesson), so

$$
\mathbf{P}_0 = \begin{pmatrix} 0.16 & 0.005 \\ 0.005 & 0.0025 \end{pmatrix}\ (\text{deg}^2,\ \text{deg}^2/\text{s},\ \text{deg}^2/\text{s}^2).
$$

With no correction applied, the attitude error at the end of the coast is the linear kinematic map $y = \theta_0 + T\omega_0$, that is $\mathbf{h}^{\mathsf{T}} = (1,\ T)$ applied once — the one-shot special case above. The analytic variance is

$$
\operatorname{Var}(y) = \mathbf{h}^{\mathsf{T}}\mathbf{P}_0\mathbf{h} = 0.16 + 400(0.0025) + 2(20)(0.005) = 0.16 + 1.00 + 0.20 = 1.360\ \mathrm{deg}^2,
$$

giving $\sigma_y = 1.1662^\circ$. A Monte Carlo campaign of $N=10{,}000$ trajectories, each drawn from $\mathbf{P}_0$ by the Cholesky-factor construction of the probability module (seed $47472$, so the exact figure below reproduces), gives a sample variance of $1.3422\,\mathrm{deg}^2$ — a difference of $-1.31\%$ from the analytic value, comfortably inside the expected sampling scatter of a variance estimate from $10{,}000$ draws, which is $\pm\sqrt{2/(N-1)} = \pm1.41\%$ at one standard deviation. One matrix computation and a $10{,}000$-run campaign have reported the same physical quantity to within the accuracy the campaign itself is capable of — which is exactly the claim LinCov makes, confirmed rather than assumed.

```python
import numpy as np

sigma_th, sigma_w, rho, T = 0.4, 0.05, 0.25, 20.0
P0 = np.array([[sigma_th**2, rho*sigma_th*sigma_w],
               [rho*sigma_th*sigma_w, sigma_w**2]])
h = np.array([1.0, T])
var_analytic = h @ P0 @ h                                  # 1.360

rng = np.random.default_rng(47472)
L = np.linalg.cholesky(P0)
X = rng.standard_normal((10_000, 2)) @ L.T
var_mc = np.var(X @ h, ddof=1)                              # 1.3422
print(var_analytic, var_mc, (var_mc - var_analytic) / var_analytic)
# 1.3600000000000003 1.3422321367655612 -0.013064605319440532
```
:::

## Adding one saturation

Now give the vehicle a small trim actuator that tries to null the coasted attitude error: it commands a correction $c = k y$ with gain $k=0.7$, but the actuator can deliver at most $\pm L$ of correction, so the command actually applied is $\operatorname{sat}(ky, \pm L)$, and the residual attitude error is $z = y - \operatorname{sat}(ky, \pm L)$. This is a single, realistic nonlinearity — an actuator limit, exactly the kind every real trim thruster, reaction wheel or TVC channel has — added to an otherwise unchanged system.

A LinCov analysis of this system linearizes the actuator about the reference point, where the correction is unsaturated: locally, $z = y - ky = (1-k)y$, a fixed linear gain of $(1-k) = 0.3$, giving a predicted variance of $\operatorname{Var}(z)_{\mathrm{LinCov}} = (1-k)^2\operatorname{Var}(y) = 0.09 \times 1.360 = 0.1224\,\mathrm{deg}^2$ — the same one-line calculation as before, now through the linearized correction stage. This number never changes as $L$ changes, because the linearization does not know $L$ exists; it is the tangent to the actuator's response at zero, and a tangent line has no saturation in it.

::: example The two answers separating as the actuator limit tightens
Simulate the true, saturating system directly, using the identical $10{,}000$ draws of $(\theta_0,\omega_0)$ as the unsaturated example above, for several actuator limits $L$:

| $L$ (deg) | $P(\text{saturates})$ | $\operatorname{Var}(z)$, true (MC) | $\operatorname{Var}(z)$, LinCov | Gap in variance | Gap in $\sigma$ |
| --- | --- | --- | --- | --- | --- |
| $3.0$ | $0.03\%$ | $0.1209$ | $0.1224$ | $-1.2\%$ | $-0.6\%$ |
| $2.0$ | $1.35\%$ | $0.1298$ | $0.1224$ | $+6.1\%$ | $+3.0\%$ |
| $1.5$ | $6.36\%$ | $0.1677$ | $0.1224$ | $+37.0\%$ | $+17.1\%$ |
| $1.0$ | $21.59\%$ | $0.3011$ | $0.1224$ | $+146.0\%$ | $+56.8\%$ |
| $0.7$ | $38.54\%$ | $0.4722$ | $0.1224$ | $+285.8\%$ | $+96.4\%$ |

At a generous limit ($L=3.0^\circ$, saturating in only three cases out of ten thousand), LinCov and the true system agree to within the same sampling noise the unsaturated baseline showed — the actuator is, for practical purposes, never in the nonlinear regime the linearization ignores, so ignoring it costs nothing. As the limit tightens, the true residual grows sharply while the LinCov prediction, blind to $L$ by construction, does not move at all: by $L=1.0^\circ$, where the actuator saturates on better than one case in five, the true dispersion is $2.46$ times the LinCov variance — the standard deviation LinCov reports is barely more than half of what actually occurs.

The direction of the error is not an accident. When the actuator saturates, it delivers *less* correction than the full linear law would call for, so the true residual $z$ is systematically larger, on the cases that saturate, than the unsaturated linear model predicts — and because those are exactly the large-$|y|$ cases that dominate the variance, the effect on $\operatorname{Var}(z)$ is large even when the saturating fraction is modest. LinCov's blindness to saturation is therefore not a random error that might go either way; it is a one-sided, non-conservative error that understates the true dispersion whenever the actuator's authority is not comfortably larger than what the unsaturated law would ask of it.
:::

::: warning A LinCov result carries no signal that it has become wrong
The single most dangerous property of this failure mode is that the LinCov output does not look different when it is wrong. It is a clean, precise-looking covariance matrix at $L=3.0^\circ$ and an equally clean, equally precise-looking covariance matrix at $L=0.7^\circ$ — nothing about the number itself, or how it was computed, flags that the second one is off by a factor of two and a half. The check has to come from outside the LinCov run: either a nonlinear simulation of the actual saturating system, or an explicit examination of how large the unsaturated correction would need to be relative to the actuator's real limit.
:::

## The rule for when LinCov may stand in for Monte Carlo

Generalizing from the actuator example to the condition it illustrates: LinCov is valid exactly when every element between the dispersed inputs and the output of interest — dynamics, sensors, and control law alike — is well approximated by its linearization across the range of deviations the dispersion set actually produces, and the driving uncertainties are themselves Gaussian, since the sandwich rule and the recursion above assume nothing else about the shape of the distribution being propagated. Every one of the following breaks that condition, and every one of them is ordinary hardware and software, not an exotic edge case: actuator and sensor saturation, a control deadband, a discrete mode switch or an FDIR trip that changes which control law is active, and any dispersed input that is not itself Gaussian — a lognormal density or drag coefficient, for instance, propagated through even a perfectly linear dynamic model still produces a non-Gaussian output that a covariance alone does not fully describe. A question about the tail of a distribution is a further, independent reason to distrust LinCov even where the mean behavior is well linearized, since a covariance is a statement about spread, not shape, and the next lesson in this module is entirely about how much those two can differ.

The professional pattern is not to choose one method and discard the other, but to use both for what each is good at: LinCov for design iteration, where its speed lets a parameter sweep or a sensitivity study run in seconds, and as a standing sanity check that a full Monte Carlo campaign's sample covariance is in the right neighborhood before trusting the campaign's more expensive tail statistics; Monte Carlo for the verification claim itself, wherever the system it is verifying contains any of the nonlinearities above — which, on a real vehicle with real actuators and real mode logic, is nearly always.

## Check yourself

::: check
Derive $\operatorname{Var}(z) = (1-k)^2\operatorname{Var}(y)$ for the unsaturated correction $z = y - ky$, starting from the sandwich rule for a linear map.
:::

::: answer
Write $z = (1-k)y$, a linear map with scalar coefficient $(1-k)$ applied to the random variable $y$. The one-dimensional sandwich rule for $\operatorname{Cov}(\mathbf{A}\mathbf{x}) = \mathbf{A}\mathbf{P}\mathbf{A}^{\mathsf{T}}$ reduces, for a scalar $A=(1-k)$ and scalar variance $\operatorname{Var}(y)$, to $\operatorname{Var}((1-k)y) = (1-k)^2\operatorname{Var}(y)$, since a $1\times1$ "matrix sandwich" reduces to the coefficient squared times the variance.
:::

::: check
At $L=1.5^\circ$ in the worked example, the true variance is $37.0\%$ higher than the LinCov prediction while the saturation probability is only $6.36\%$. Explain why a fairly small saturating fraction produces a much larger variance gap.
:::

::: answer
Variance weights large deviations heavily, since it involves squared distance from the mean, and the cases that saturate are precisely the cases with the largest $|y|$ — the ones already contributing the most to the variance before saturation is even considered. When the actuator saturates on those specific large-deviation cases, it under-corrects exactly where the correction matters most for controlling the spread, so a saturating fraction that looks modest in raw percentage terms still removes a disproportionate share of the correction's variance-reducing effect.
:::

::: check
State the conditions under which LinCov may substitute for Monte Carlo, and name at least three specific mechanisms that violate them.
:::

::: answer
LinCov is valid when the full path from dispersed inputs to the output of interest — dynamics, sensors and control together — is well approximated by its linearization across the range of deviations the dispersion set produces, and the driving inputs are Gaussian. Mechanisms that violate this include actuator or sensor saturation, a control deadband, a discrete mode switch or FDIR trip that changes the active control law, and a non-Gaussian dispersed input such as a lognormal density or drag coefficient.
:::

::: check
Explain why the LinCov prediction in the worked example does not change at all as the actuator limit $L$ is tightened, even though the true system's behavior changes sharply.
:::

::: answer
LinCov propagates a covariance through the *linearization* of the system about the reference point, and the linearization of a saturating actuator is its tangent line at the unsaturated operating point — a fixed gain, $(1-k)$ in this case, that has no dependence on where the saturation limit $L$ actually sits, since a tangent line by construction extends without bending. The LinCov calculation therefore never reads the value of $L$ at all; the entire effect of tightening the actuator's authority is invisible to a method that only ever evaluates the system's behavior infinitesimally close to the reference trajectory.
:::

::: check
A design team uses LinCov exclusively through an entire design cycle, including for a final verification report, on a vehicle whose attitude controller includes a rate-limited actuator and a discrete safe-mode transition triggered above a fixed error threshold. Evaluate this choice.
:::

::: answer
The choice is defensible for design iteration — LinCov's speed is exactly what a design cycle needs for rapid parameter sweeps — but indefensible for the final verification report, because both a rate-limited actuator and a discrete mode transition are precisely the mechanisms this lesson identifies as breaking LinCov's linearity assumption. A verification claim built entirely on LinCov here would be blind to whatever the actuator limit and the mode switch actually do to the true dispersion, in exactly the way the worked example showed a saturation understating variance by more than a factor of two; the correct practice is LinCov for the iteration, with a full Monte Carlo campaign — capable of representing the rate limit and the mode switch exactly as coded — carrying the verification claim itself.
:::

## Summary

| Item | Statement |
| --- | --- |
| Covariance recursion | $\mathbf{P} \leftarrow \mathbf{\Phi}\mathbf{P}\mathbf{\Phi}^{\mathsf{T}}+\mathbf{Q}$; one-shot special case $\mathbf{P}_{\mathrm{final}} = \mathbf{\Phi}_{\mathrm{total}}\mathbf{P}_0\mathbf{\Phi}_{\mathrm{total}}^{\mathsf{T}}$ when $\mathbf{Q}=0$ over the interval |
| Baseline agreement | Analytic $\operatorname{Var}(y)=1.360\,\mathrm{deg}^2$ vs.\ $10{,}000$-run MC $1.3422\,\mathrm{deg}^2$ ($-1.31\%$, within the $\pm1.41\%$ expected sampling error) |
| Saturation gap | LinCov fixed at $0.1224\,\mathrm{deg}^2$ regardless of $L$; true variance rises to $2.46\times$ that value by $L=1.0^\circ$ ($21.6\%$ saturating) |
| Direction of the error | Always non-conservative: a saturating actuator under-corrects the large-deviation cases that dominate the variance, so LinCov understates the true dispersion |
| Validity condition | Full path (dynamics, sensors, control) well linearized across the dispersion's range, and Gaussian inputs |
| Breaking mechanisms | Saturation, deadbands, discrete mode switches and FDIR trips, non-Gaussian inputs, tail questions |
| Professional pattern | LinCov for design iteration and as a sanity check on the Monte Carlo covariance; Monte Carlo for the verification claim itself |

LinCov's blind spot — a covariance says nothing about shape — is worth its own lesson, because even where LinCov is entirely valid and Monte Carlo confirms it exactly, the covariance alone can still mislead about how far into the tail a given multiple of sigma actually reaches. That is the next lesson's subject.
