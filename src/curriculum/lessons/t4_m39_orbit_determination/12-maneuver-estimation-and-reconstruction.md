---
id: l12-maneuver-estimation-and-reconstruction
title: Maneuver estimation and reconstruction
minutes: 12
covers:
  - Maneuver estimation and reconstruction
---

Every fit so far in this module has assumed the object was following the same dynamics for the entire arc. Spacecraft manoeuvre — deliberately, for stationkeeping or a phasing burn, or through undocumented thruster activity a ground team only learns about from the data itself. A manoeuvre is not measurement noise and not quite the slowly-varying unmodelled force the process-noise lesson was built for either: it is a real, (usually) sudden, discrete change to the velocity at one identifiable moment, and this lesson builds the two standard ways to handle it.

## What happens if it goes unnoticed

::: example An unmodelled five-centimetre-per-second burn, and a confidently wrong answer
The same three-pass tracking arc as earlier lessons, with a genuine $50\,\mathrm{mm/s}$ velocity change applied to the truth trajectory between the second and third passes, fitted with ordinary two-body-plus-J2 dynamics that know nothing about it:

```python
# epoch state error:      dr = (-2661, 926, 1218) m        dv = (-771, -6194, -75) mm/s
# formal sigma:            dr = (0.21, 0.11, 0.10) m        dv = (0.053, 0.71, 0.075) mm/s
# |error| / |sigma|, worst component: about 14,500
```

The fit converges — nothing about the iteration signals distress — to an epoch state that is *kilometres* wrong, while its own formal covariance claims sub-metre, sub-millimetre-per-second precision. This is the module's own flashcard warning made concrete with real numbers: an undetected manoeuvre is a textbook cause of a covariance that is not only optimistic but wrong by four orders of magnitude, because the fit is doing exactly what least squares does with a systematic model error it cannot see — quietly biasing the whole-arc epoch state to compromise between dynamics that fit the early data and dynamics that fit the late data, and reporting a covariance that only reflects random measurement noise, never the possibility that the dynamics themselves are wrong.
:::

## Solving for the manoeuvre directly

If the approximate time of a suspected manoeuvre is known — from a rising edit rate concentrated after some epoch, exactly as the residual-editing lesson's own example showed, or from an operator's report — the cleanest fix extends the state with the manoeuvre's three velocity components as solve-for parameters, applied as an instantaneous jump at $t_m$. The state transition matrix chains across the discontinuity exactly the way the batch lesson's $\boldsymbol\Phi(t_2,t_0)=\boldsymbol\Phi(t_2,t_1)\boldsymbol\Phi(t_1,t_0)$ composition already allows: a measurement's sensitivity to the manoeuvre, for any $t\ge t_m$, is $\mathbf H(t)\,\boldsymbol\Phi(t,t_m)\begin{pmatrix}\mathbf 0\\ \mathbf I\end{pmatrix}$ — the STM from the manoeuvre epoch forward, with only the velocity block active, since the manoeuvre is a pure velocity jump at that instant. Measurements before $t_m$ get a zero column; there is nothing yet to be sensitive to.

::: example Recovering the burn
Extending the state to nine components (epoch position, epoch velocity, manoeuvre $\Delta\mathbf v$) and re-running the same contaminated arc:

```python
# it 0: RMS range  477.8 m   |dv correction|  49.7 mm/s
# it 1: RMS range    5.2 m   |dv correction|  15.1 mm/s
# it 2: RMS range    5.0 m   |dv correction| 1.1e-05 mm/s   <- converged
#
# estimated dv (mm/s): (46.80, 14.84, -10.29)     true dv (mm/s): (46.29, 14.52, -12.12)
# |dv error|: 1.9 mm/s                             formal sigma on dv: (1.3, 2.2, 2.6) mm/s
# pre-maneuver epoch state error: 0.39 m, -0.03 m, 0.38 m (position); sub-mm/s to ~1 mm/s (velocity)
```

Three iterations bring the range residual down to $5.0\,\mathrm m$ — matching the injected noise — and the recovered manoeuvre is within about one formal sigma of the truth in every component, with the pre-manoeuvre epoch state recovered to well under a metre, an enormous improvement over pretending the manoeuvre never happened.
:::

## Detecting it instead: splitting the arc

When the manoeuvre's timing is not known, or several suspected events need to be screened, the alternative is to fit the data on each side of a candidate split time *independently*, propagate both results to the split time, and compare: a position discontinuity should be zero (position cannot jump), and a velocity discontinuity, if the split point is real, reveals the manoeuvre as the difference $\hat{\mathbf v}^+-\hat{\mathbf v}^-$ directly, with covariance $\mathbf P^-_{vv}+\mathbf P^+_{vv}$ from the two independent fits' own velocity uncertainties.

::: warning Arc-splitting needs enough data on each side to work at all
Attempting exactly this construction with only the single, isolated third pass on the post-manoeuvre side — thirty-nine observations from one station, one geometry — does not converge to a sensible answer: the resulting normal equations are exactly as ill-conditioned as the tracking-geometry lesson's own single-pass example predicted ($\operatorname{cond}(\widetilde{\mathbf H})$ of order $10^9$ for one isolated pass), and the fit diverges rather than producing a usable $\Delta\mathbf v$, regardless of how the initial guess is chosen. This is not a flaw in the arc-splitting *idea* — it is the same observability lesson from earlier in the module, now costing a maneuver reconstruction rather than an epoch fit: each side of the split needs to be independently well observed (multiple passes, or a station geometry good enough on its own) before a difference between the two sides means anything. Solving for the manoeuvre directly, as in the previous example, does not have this weakness, because it lets the *entire* arc — both sides at once — constrain the single set of manoeuvre parameters, rather than asking one side to determine a full independent state on its own.
:::

::: key Two philosophies, one failure mode to watch for
Solve directly for an impulsive $\Delta\mathbf v$ at a known or suspected epoch when the whole arc can be fit together; it shares information across the entire data set and tolerates a data-poor side of the split that arc-splitting cannot. Detect a manoeuvre by fitting independent segments and comparing states at the boundary when the timing is unknown and needs to be discovered, but only when each segment individually has the tracking geometry to support an independent fit. An undetected manoeuvre, handled by neither method, produces a covariance that looks fine and is not — the single most operationally dangerous failure mode this lesson describes.
:::

## Check yourself

::: check
Explain why the sensitivity of a post-manoeuvre measurement to $\Delta\mathbf v$ is $\mathbf H(t)\,\boldsymbol\Phi(t,t_m)\begin{pmatrix}\mathbf 0\\\mathbf I\end{pmatrix}$ rather than $\mathbf H(t)\,\boldsymbol\Phi(t,t_m)$ alone.
:::

::: answer
$\Delta\mathbf v$ is a change to *velocity only*, applied at $t_m$ — it has no direct effect on position at that instant. $\boldsymbol\Phi(t,t_m)$ maps a full six-component state perturbation at $t_m$ forward to $t$, so restricting the input perturbation to "velocity only, magnitude $\Delta\mathbf v$" means multiplying by the selector $\begin{pmatrix}\mathbf 0\\\mathbf I\end{pmatrix}$ before applying $\boldsymbol\Phi$, which picks out exactly $\boldsymbol\Phi$'s right-hand (velocity) columns — the same object the batch lesson called the $\partial\mathbf r/\partial\mathbf v_0$ and $\partial\mathbf v/\partial\mathbf v_0$ blocks, evaluated from $t_m$ instead of the epoch.
:::

::: check
The unmodelled-manoeuvre example reported an error-to-sigma ratio around $14{,}500$ in one velocity component. What, specifically, does a ratio that large tell you that a ratio of, say, $3$ would not?
:::

::: answer
A ratio of a few (consistent with ordinary sampling variation of a correctly specified fit) says the covariance is basically honest for this one realization. A ratio in the thousands is not sampling variation under any plausible noise model — it says the covariance itself is wrong, not merely that this particular fit happened to land unluckily, and points directly at a structural problem (an unmodelled force or event) rather than at ordinary estimation noise, which is exactly why the residual-editing lesson treated a large, structured error as a modelling signal rather than something to average away.
:::

::: check
Why does the arc-splitting method's position check — that $\hat{\mathbf r}^+$ and $\hat{\mathbf r}^-$ at the split time should agree — provide a useful sanity check independent of the velocity discontinuity itself?
:::

::: answer
An impulsive manoeuvre changes velocity instantaneously but leaves position continuous, since position cannot jump in zero time; if the two independent fits' propagated positions at the split time disagree by more than their combined uncertainty, something beyond a clean, correctly timed impulsive burn is wrong — the assumed split time may be off, there may be two events rather than one, or one side's fit may itself be biased by bad data or an unmodelled force — before the estimated $\Delta\mathbf v$ is trusted at all.
:::

::: check
A team suspects a satellite manoeuvred at some point during a data gap but does not know exactly when. Based on this lesson and the residual-editing lesson, describe a reasonable strategy for finding out, without assuming which single method solves the whole problem.
:::

::: answer
First fit the arc as a whole with ordinary dynamics and look at the residual pattern the way the residual-editing lesson did: a rising, time-concentrated edit rate or a persistent trend after some point is the signature to look for, and it narrows down roughly when the event happened even before anything is solved for explicitly. With that rough window, either extend the state with a solve-for $\Delta\mathbf v$ at a trial epoch within it (robust even if data is sparse on one side, as this lesson showed) or, if there is enough independent data on both sides of a candidate split, use arc-splitting to both locate the timing more precisely and cross-check the solve-for result — checking, in either case, that the post-fit residuals actually whiten once the manoeuvre is accounted for, not only that the iteration converged.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| Undetected manoeuvre | Converges to a confidently wrong epoch state; formal sigma can understate true error by $10^3$–$10^4\times$ |
| $\mathbf H(t)\boldsymbol\Phi(t,t_m)\begin{pmatrix}\mathbf 0\\\mathbf I\end{pmatrix}$ | Sensitivity of a post-manoeuvre measurement to a solved-for $\Delta\mathbf v$ at $t_m$ |
| Solve-for $\Delta\mathbf v$ | Whole arc fit together; tolerant of sparse data on either side of the event |
| Arc-splitting | Fit each side independently, compare at the boundary; needs each side independently well observed |
| Position continuity check | $\hat{\mathbf r}^+\approx\hat{\mathbf r}^-$ at the split time; a basic sanity check on the impulsive-burn assumption |

Every method in this module, up to this lesson, has treated one object's orbit in isolation. The final lesson turns to what changes — for better observability, and for a different set of tools — when several objects are tracked and estimated together.
