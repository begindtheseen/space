---
id: l08-fdir
title: 'FDIR: residual monitors, cross-checks and actuator health'
minutes: 22
covers:
  - 'FDIR: residual monitors on the filter, sensor cross-checks, actuator health, and the response of each'
---

Every lesson so far in this module built a piece of the stack and then showed what goes wrong when two correct pieces meet. FDIR — fault detection, isolation and recovery — is the piece whose entire job is noticing when one of those pieces has actually stopped being correct, in flight, with no access to the truth every earlier lesson's diagnosis quietly relied on. This lesson builds three specific monitors for the reference vehicle: a residual check on the navigation filter, a cross-check between two sensors that should agree, and a health check on the actuator — and, for each, states the response the mode manager takes when it trips, because a monitor with no defined response is not FDIR, it is a log message.

## Residual monitors on the filter: NIS, because NEES needs truth you do not have in flight

The navigation lesson in this module verified the filter using the normalized estimation error squared, comparing the filter's error against *truth*. That check is only available in simulation — flight has no truth to compare against. The monitor a real vehicle actually runs is the **normalized innovation squared** (NIS), computed from exactly the quantity the filter already has at every update: the difference between a measurement and what the filter predicted it would be, weighted by how much disagreement the filter itself expects.

$$
\mathrm{NIS} = \boldsymbol\nu^\top \mathbf S^{-1} \boldsymbol\nu, \qquad \boldsymbol\nu = \mathbf z - \mathbf H\hat{\mathbf x}, \quad \mathbf S = \mathbf H\mathbf P\mathbf H^\top+\mathbf R,
$$

which, for a consistent filter, follows the same chi-squared distribution NEES does, with degrees of freedom equal to the *measurement's* dimension rather than the state's — two, for a GNSS position update.

::: example Setting a NIS threshold, and pricing what it buys
At the $99.9\%$ level ($p=0.999$), a two-degree-of-freedom chi-squared threshold is $13.82$; at $99.99\%$, it is $18.42$. Over the roughly $240$ GNSS updates in one $24\,\mathrm s$ landing burn at $10\,\mathrm{Hz}$, the *expected number of false alarms from a perfectly healthy filter* is the per-update false-alarm probability times the update count: at the $99.9\%$ threshold, $0.001\times240\approx0.24$ false alarms per burn — roughly one nuisance trip every four landings, even with nothing wrong. At $99.99\%$, that falls to about $0.024$ per burn, one in forty. The tighter threshold is not free: it also misses more genuine faults of a given size, since a less sensitive gate lets more real disagreement through unflagged. Choosing between them is a real design trade, priced in actual numbers rather than a round figure picked by feel.
:::

::: key Why NIS, not NEES, is the flight monitor
NEES needs truth; it exists to verify a filter design in simulation, once, before flight. NIS needs only the filter's own predicted measurement and its own covariance — both available every single update, in flight, with no truth required — which is exactly why it is the residual monitor that actually flies, while NEES stays a verification-campaign tool.
:::

## Detecting a real fault: the GNSS-dropout case

A NIS-style consistency check earns its place by catching something a component-level test never exercises: a sensor that is silently unavailable, not merely noisy. The Monte-Carlo campaign later in this module disperses a GNSS dropout — a multi-second stretch with no position fix at all — into a fraction of its cases, and every single one of those dropout cases trips the navigation-consistency monitor built on exactly this residual logic, with zero false trips among the cases that never lost GNSS. That is not a coincidence of tuning; a dropout leaves the filter dead-reckoning on inertial data alone for long enough that its actual error genuinely grows past what its own covariance — still assuming regular aiding — reports, which is precisely the condition a residual monitor exists to catch, and precisely why waiting to notice a dropout only when miss distance turns out wrong at touchdown is too late to do anything about it.

::: warning A tripped monitor names a symptom, not automatically a cause
A NIS trip says the filter's predictions and its measurements disagree by more than the filter's own model of disagreement allows — it does not, by itself, say whether the measurement is wrong, the filter's dynamics model is wrong, or the vehicle is doing something genuinely unexpected. Isolating *which* of those is true, so the response can target the actual problem rather than the symptom, is a separate step the response logic below has to take deliberately, not something the threshold crossing settles on its own.
:::

## Sensor cross-checks: catching what the filter's own consistency check cannot

A NIS monitor built into the filter can only be as suspicious of a sensor as the filter's own noise model allows it to be — a sensor reporting confidently wrong values, within the noise the filter was told to expect, produces an innovation that looks statistically ordinary even though the measurement itself is bad. A radar altimeter that has frozen on its last good reading, or one reporting a value corrupted by a multipath return off nearby terrain, is exactly this case: each individual reading can sit comfortably inside the filter's expected noise band while being systematically wrong. The defense is a check the filter's own update logic does not perform at all — comparing the raw altimeter reading directly against the navigation solution's own propagated altitude, independent of whether the filter has decided to trust it.

::: example Sizing a cross-check threshold from the sensors' own numbers
Between two altimeter updates, $50\,\mathrm{ms}$ apart, the inertially propagated altitude can drift from the true value by an amount set by the accelerometer's own short-term noise and any residual, uncorrected bias — small over so short an interval, on the order of a few centimeters for this vehicle's IMU. The altimeter itself carries $0.15\,\mathrm m$ of one-sigma noise. A cross-check comparing the raw altimeter reading against the INS-propagated altitude, with a threshold set at several times the *combined* one-sigma figure of the two — comfortably wider than ordinary sensor noise on either side, so it does not fire on healthy data, but far tighter than the tens of meters a frozen or multipath-corrupted reading would actually show — catches a stuck or badly corrupted altimeter within one update interval, well before enough bad readings have passed through the filter's own, more forgiving statistical gate to raise a NIS alarm on their own.
:::

## Actuator health: watching how long the gimbal stays pinned

The control lesson in this module measured how long the actuator stayed pinned at its deflection limit under three different anti-windup schemes, responding to the same mode-transition step.

::: example Sustained saturation as a health signal
| Anti-windup scheme | Longest continuous time pinned at the limit |
| --- | --- |
| Naive | $3.41\,\mathrm s$ |
| Conditional integration | $1.99\,\mathrm s$ |
| Back-calculation | $0.70\,\mathrm s$ |

A monitor flagging "pinned at the deflection limit for more than one continuous second" trips for the naive and conditional cases and stays quiet for back-calculation — exactly tracking which of the three schemes the control lesson found genuinely failed to recover promptly. The monitor does not, on its own, know whether a long pinned interval means the actuator has lost authority or the control law feeding it is behaving badly; what it reliably detects is that control authority is under sustained stress, which is the fact the mode manager needs regardless of which of those two causes turns out to be responsible.
:::

## The response of each

::: key A monitor without a response is a log entry, not FDIR
Every threshold in this lesson exists to trigger a specific, pre-decided action — never merely a note for a post-flight review to read.

| Monitor | Trips on | Response |
| --- | --- | --- |
| NIS (filter residual) | Innovation inconsistent with the filter's own covariance | Reject the offending measurement for this cycle; if sustained, flag navigation degraded to the mode manager |
| Altimeter–INS cross-check | Raw altimeter disagrees with propagated altitude beyond the sized threshold | Drop the altimeter from the update; revert to GNSS-only aiding (or IMU-only, below GNSS's own useful altitude) |
| Actuator sustained saturation | Gimbal pinned beyond the time threshold | Flag control authority degraded; mode manager may command a gentler guidance target or, if response does not improve, escalate toward safe |
:::

Isolation and recovery are not automatic consequences of detection. A dropped altimeter still leaves the filter navigating on GNSS and inertial data alone — degraded, not blind — and a program's response logic has to know, in advance, which sensors remain sufficient for which mode, exactly the kind of question the mode-management lesson's transition logic already has to answer for ordinary mode changes.

::: warning Every monitor in this lesson was tuned against this vehicle's own numbers
The specific thresholds in this lesson — a $13.82$ or $18.42$ NIS gate, a one-second pinned-actuator limit — are not universal constants; they were sized from this vehicle's own sensor noise, update rates and actuator authority. A different vehicle, with a faster GNSS rate or a more capable actuator, needs its own thresholds recomputed from its own numbers the same way, not this lesson's figures copied across.
:::

## Check yourself

::: check
Explain why NIS, rather than NEES, is the monitor a real flight computer runs, using only what each quantity requires as an input.
:::

::: answer
NEES compares the filter's error against the true state, which is available only in a simulation where truth is known by construction; a real vehicle in flight has no such truth to compare against. NIS compares the filter's own predicted measurement against the measurement actually received, using only the innovation and the covariance the filter already computes at every update — both available in flight with no external truth required — which is why NIS is the monitor that actually runs onboard while NEES stays a pre-flight verification tool.
:::

::: check
This lesson computed an expected $0.24$ false alarms per landing burn at a $99.9\%$ NIS threshold. Explain, in terms of the trade this lesson names, why a program might still choose that threshold over the tighter $99.99\%$ one despite the higher nuisance-alarm rate.
:::

::: answer
A tighter threshold reduces false alarms but also raises the bar a genuine fault's innovation has to clear before it is caught, so it detects smaller real faults more slowly or misses them outright at a given severity. A program willing to accept roughly one nuisance trip every four landings, provided its response to a trip is proportionate rather than catastrophic — rejecting one measurement, not aborting the mission — may prefer the more sensitive $99.9\%$ gate specifically because it catches real, smaller faults the looser gate would let through unflagged; the right choice depends on how expensive a false alarm's response actually is, which this lesson's numbers make an explicit trade rather than a default.
:::

::: check
A radar altimeter freezes on its last good reading rather than failing outright or going silent. Explain why this specific failure mode is the clearest justification for a sensor cross-check that exists independently of the filter's own NIS gate.
:::

::: answer
A frozen reading, repeated every cycle, produces an innovation that looks like ordinary, correlated sensor behavior rather than a stark outlier — especially once the vehicle's true altitude has moved only a little from where the sensor froze, the innovation can sit comfortably inside the filter's expected noise band for several cycles before the accumulating disagreement is large enough to trip NIS. A cross-check comparing the raw reading directly against an independently propagated altitude catches the freeze immediately, because it does not rely on the filter's own noise model finding the reading implausible — it only needs the two values to disagree by more than the sized threshold, which a frozen reading eventually and reliably does.
:::

::: check
The actuator-health monitor in this lesson flags "pinned beyond one second" without distinguishing an actual hardware fault from a demanding but recoverable command. Is this a shortcoming that should be fixed before the monitor is used, or an acceptable property of this specific monitor? Justify the answer.
:::

::: answer
It is an acceptable property, not a shortcoming to eliminate, as long as the *response* is matched to what the monitor can actually tell — this monitor reliably detects that control authority is under sustained stress, and the appropriate response (flag degraded control, let the mode manager decide whether to soften the guidance target or escalate) is correct regardless of which underlying cause turns out to be responsible. Demanding the monitor itself distinguish hardware failure from a large recoverable command would require inputs — a direct actuator-health telemetry channel, or a comparison against an independent authority model — this simple timing check was never built to use, and conflating detection with full diagnosis is exactly the mistake this lesson's earlier warning about a tripped monitor naming a symptom, not a cause, cautions against.
:::

::: check
Why does this lesson insist that every monitor's threshold be recomputed for a different vehicle rather than reused, when the underlying chi-squared mathematics behind the NIS gate is exactly the same formula regardless of which vehicle is flying?
:::

::: answer
The chi-squared *formula* for a given false-alarm probability and degrees of freedom is universal, but the *threshold value* it produces depends on inputs specific to this vehicle — its sensor noise levels, which set $\mathbf R$ and hence $\mathbf S$, and its update rates, which set how many chances per burn a false alarm has to occur. A different vehicle with different sensors and a different GNSS rate would compute a numerically different threshold from the identical formula, and reusing this vehicle's specific number on a different vehicle would be sizing a gate against noise and timing that vehicle does not actually have.
:::

## Summary

| Monitor | Basis | Response when tripped |
| --- | --- | --- |
| NIS (filter residual) | $\boldsymbol\nu^\top\mathbf S^{-1}\boldsymbol\nu$, chi-squared, dof = measurement dimension | Reject measurement this cycle; flag navigation degraded if sustained |
| Threshold trade | $99.9\%$: $13.82$ (dof $2$), $\approx0.24$ false alarms/burn. $99.99\%$: $18.42$, $\approx0.024$/burn | Tighter threshold trades nuisance-alarm rate against smaller-fault sensitivity |
| Sensor cross-check | Raw altimeter vs. independently propagated INS altitude | Drop the disagreeing sensor; revert to remaining aiding sources |
| Actuator health | Continuous time pinned at the deflection limit ($3.41\,\mathrm s$ naive, $0.70\,\mathrm s$ back-calculation, against a $1\,\mathrm s$ gate) | Flag control degraded; mode manager softens the target or escalates |
| Governing rule | A monitor with no defined response is a log entry, not FDIR | — |

With navigation, guidance, control, mode management and fault response all built and joined, the next lesson takes up the hardest kind of failure this module has left to show: a case where every one of these monitors, and every component test behind them, passes cleanly, and the closed loop still does worse than any single piece's own test predicted.
