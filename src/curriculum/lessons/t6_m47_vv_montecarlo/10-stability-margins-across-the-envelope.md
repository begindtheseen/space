---
id: l10-stability-margins-across-the-envelope
title: Stability margins across the envelope
minutes: 16
covers:
  - 'Stability margin verification across the envelope: frozen-time linearisation, gain, phase and delay margin against flight time'
---

A launch vehicle's control loop does not have one gain margin and one phase margin. Its inertia falls as propellant burns, its aerodynamic stability rises and falls with dynamic pressure, its actuator effectiveness changes with thrust and moment arm — the plant the controller is closing a loop around is a different linear system at every instant of flight, and margin is therefore a function of flight time, not a single number a review can check once. Verifying a margin requirement across a continuously changing vehicle without integrating a fully time-varying, infinite-dimensional stability proof is the practical problem this lesson solves.

The standard solution is **frozen-time linearization**: pick a dense set of flight times, linearize the closed loop at each one as though the vehicle's parameters were fixed at their value at that instant, and compute classical margins there. It is an approximation, and this lesson is honest about exactly what makes the approximation trustworthy, before working a full example that shows margins collapsing as flight time moves, for a reason worth understanding precisely.

## What frozen-time analysis assumes

At a chosen flight time $t^*$, treat every slowly-varying quantity — mass, inertia, dynamic pressure, the control gains a gain schedule would select at that point — as fixed, giving an ordinary linear time-invariant open-loop transfer function $G(s)$. Its gain crossover frequency $\omega_{gc}$ is where $|G(j\omega_{gc})|=1$; the **phase margin** is how far the phase sits above $-180^\circ$ there, $\mathrm{PM} = 180^\circ + \angle G(j\omega_{gc})$. Its phase crossover frequency $\omega_{pc}$ is where $\angle G(j\omega_{pc}) = -180^\circ$; the **gain margin** is how far the magnitude sits below unity there, $\mathrm{GM} = -20\log_{10}|G(j\omega_{pc})|$, in decibels. Both are properties of one frozen instant, computed exactly as the classical control curriculum this module assumes as background already established.

The open question is whether a stack of frozen-time snapshots, each individually stable with comfortable margin, says anything at all about the actual, continuously time-varying system the vehicle flies as. It does not, automatically — a linear time-varying system built by switching between two individually stable linear systems can be unstable even though every frozen point in the switch is comfortably stable on its own, a fact worth remembering from the gain-scheduling material of the control curriculum. What rescues frozen-time analysis in practice is a **slow-variation condition**: the plant's parameters must change slowly relative to how fast the closed loop itself responds, so that over the time the loop takes to react to a disturbance, the "frozen" plant it is reacting to has not moved far from where it was frozen. This condition is a rule of thumb rather than a certified bound, and the rule is worth quantifying explicitly rather than asserting, which the worked example below does directly.

::: key
Frozen-time margin verification: linearize the closed loop at closely spaced flight times (and over the dispersed cases, not only the nominal trajectory), compute gain, phase and delay margin at each, and plot the worst case against flight time against the requirement. It is valid only insofar as the plant's parameters vary slowly relative to the closed loop's own response time — a condition worth checking quantitatively, not assuming.
:::

## Delay margin, and why it earns its own line

Every digital control loop carries transport delay — sensor sampling, computation time, actuator response — and a fixed physical delay $\tau$ costs a frequency-dependent amount of phase, $\omega\tau$ radians at frequency $\omega$, since a pure delay's frequency response is $e^{-j\omega\tau}$. The loop's phase margin is exactly the phase budget available before instability, so the additional delay the loop can tolerate before the margin is consumed is

$$
\tau_{\mathrm{margin}} = \frac{\mathrm{PM}_{\mathrm{rad}}}{\omega_{gc}},
$$

the **delay margin**. It deserves a line of its own, separate from phase margin in degrees, because the same phase margin in degrees corresponds to a very different tolerable delay depending on where the crossover frequency sits — a slow loop can absorb a given delay comfortably where a fast loop, with an identical phase margin in degrees, cannot, exactly because a fixed delay costs more phase at a higher frequency.

::: example The same phase margin, two very different delay budgets
Two loops both carry a phase margin of $45^\circ$ ($0.7854\,\mathrm{rad}$), a figure that looks identical on paper. The first has a gain crossover frequency $\omega_{gc}=5\,\mathrm{rad/s}$, giving a delay margin of $0.7854/5 = 0.1571\,\mathrm{s} = 157.1\,\mathrm{ms}$. The second crosses over ten times faster, $\omega_{gc}=50\,\mathrm{rad/s}$, giving a delay margin of $0.7854/50=0.01571\,\mathrm{s}=15.7\,\mathrm{ms}$ — a tenfold smaller tolerance for the identical phase margin in degrees, purely because the same radian budget is divided by a crossover frequency ten times larger. A verification report that quotes phase margin alone would show these two loops as equally healthy; the delay margin shows the second loop has an order of magnitude less room for the sensor, computation and actuator latency every real digital controller carries, which is exactly why delay margin is plotted as its own line rather than assumed to track phase margin automatically.
:::

::: example A fixed computational delay, three frozen flight times
A rigid-body attitude loop uses proportional-derivative gains $k_p = 5.2\times10^5$, $k_d=3.6\times10^5$ (N·m per radian and per rad/s) against a plant $1/(I s^2)$, closed through a fixed computational and actuator delay of $T_d = 30\,\mathrm{ms}$ — a representative one-and-a-half-sample-period figure for a moderate-rate digital controller. The open-loop transfer function is

$$
G(s) = \frac{k_d s + k_p}{I s^2}\,e^{-sT_d}.
$$

Evaluating the frequency response directly (a pure delay has no rational transfer function, so margins here are read from $|G(j\omega)|$ and $\angle G(j\omega)$ swept numerically rather than from a Bode-plot library that assumes a rational system) at three flight times, with inertia falling as propellant burns:

| Flight time | $I$ (kg·m²) | $\omega_{gc}$ (rad/s) | PM | $\omega_{pc}$ (rad/s) | GM | Delay margin |
| --- | --- | --- | --- | --- | --- | --- |
| $t=0\,\mathrm{s}$ (liftoff) | $48{,}000$ | $7.633$ | $66.2^\circ$ | $51.42$ | $16.7\,\mathrm{dB}$ | $151\,\mathrm{ms}$ |
| $t=75\,\mathrm{s}$ (max-Q) | $39{,}000$ | $9.341$ | $65.2^\circ$ | $51.42$ | $14.9\,\mathrm{dB}$ | $122\,\mathrm{ms}$ |
| $t=150\,\mathrm{s}$ (near MECO) | $9{,}000$ | $40.03$ | $19.1^\circ$ | $51.42$ | $2.2\,\mathrm{dB}$ | $8.3\,\mathrm{ms}$ |

The phase crossover frequency $\omega_{pc}$ does not move between the three cases — it is set entirely by the PD gains and the delay, neither of which changed, since inertia only scales the loop's *magnitude*, not its phase. What moves is the gain crossover $\omega_{gc}$, which climbs sharply as inertia falls and the loop's effective gain rises: by $t=150\,\mathrm{s}$, $\omega_{gc}$ has risen to within a factor of $1.3$ of the fixed $\omega_{pc}$, and both phase and gain margin have collapsed accordingly — phase margin from a comfortable $66^\circ$ to a thin $19^\circ$, delay margin from $151\,\mathrm{ms}$ to $8.3\,\mathrm{ms}$, an eighteenfold drop for a delay that has not itself changed at all. A margin requirement checked only at liftoff or only at the nominal design point would have missed this collapse entirely; it is visible only by sweeping flight time.

Whether this sweep is trustworthy comes back to the slow-variation condition. Take the inertia burn as approximately linear between the two endpoints above, $dI/dt \approx -260\,\mathrm{kg\,m^2/s}$, and compare that rate, relative to the local inertia, against the local loop period $2\pi/\omega_{gc}$:

| Flight time | $|dI/dt|/I$ | Loop period | Relative change per loop period |
| --- | --- | --- | --- |
| $t=0\,\mathrm{s}$ | $0.542\%/\mathrm{s}$ | $823\,\mathrm{ms}$ | $0.446\%$ |
| $t=75\,\mathrm{s}$ | $0.667\%/\mathrm{s}$ | $673\,\mathrm{ms}$ | $0.448\%$ |
| $t=150\,\mathrm{s}$ | $2.889\%/\mathrm{s}$ | $157\,\mathrm{ms}$ | $0.453\%$ |

Remarkably, the inertia changes by almost exactly the same small fraction — about $0.45\%$ — within one loop period at every point along the burn, because the crossover frequency speeds up in step with the inertia's own falling rate. The vehicle's parameters are moving comfortably slowly relative to the loop throughout, so the frozen-time picture is trustworthy here: the thin margin found at $t=150\,\mathrm{s}$ is a real property of the vehicle at that instant, not an artifact of an invalid analysis method. Contrast a staging event, where a substantial fraction of inertia is shed over a fraction of a second rather than smoothly over the whole burn — a $25\%$ change in $0.3\,\mathrm{s}$ near $t=150\,\mathrm{s}$ gives a relative rate of $83\%/\mathrm{s}$ and a change of $13\%$ within one loop period, thirty times larger than anywhere in the smooth burn. That is exactly the regime where frozen-time snapshots on either side of the event no longer say anything reliable about behavior through it, and staging requires a dedicated transient analysis across the discontinuity rather than being read off a frozen-time sweep that treats it as one more point on a smooth curve.
:::

::: warning The rigid-body crossover is rarely the binding margin on a real vehicle
The worked example above uses a rigid-body plant to keep the mechanism visible, but on a real vehicle the margin that actually fails first is usually at a structural bending mode or a propellant slosh mode, not at the rigid-body crossover shown here. The same frozen-time procedure applies without modification — linearize at each flight time, including the flex and slosh dynamics in the plant model, and sweep gain, phase and delay margin exactly as above — but a verification package that stops at the rigid-body loop and never extends the swept plant model to include the vehicle's actual flexible modes has not verified the margin that is most likely to be the real constraint.
:::

A complete verification package repeats every frozen-time margin sweep not only along the nominal trajectory but across the dispersed cases from earlier in this module — mass, inertia and aerodynamic uncertainty all shift where the crossover and the margins land — and reports the *worst case over the dispersion* at each flight time, plotted as a single curve against the requirement. A margin plotted only for the nominal case, with dispersion assessed separately or not at all, is exactly the deficiency the flight-qualification material in the control curriculum warns against, and it is a deficiency a review board catches by asking one question: is this the worst case, or the average one.

## Check yourself

::: check
Derive the delay margin formula $\tau_{\mathrm{margin}} = \mathrm{PM}_{\mathrm{rad}}/\omega_{gc}$ from the fact that a pure delay $\tau$ contributes phase $-\omega\tau$ at frequency $\omega$.
:::

::: answer
Phase margin is the additional phase lag, at the gain crossover frequency, the loop can absorb before reaching $-180^\circ$ and losing stability. An added pure delay $\tau$ contributes exactly $-\omega_{gc}\tau$ radians of phase at that frequency, so the loop remains stable as long as $\omega_{gc}\tau \leq \mathrm{PM}_{\mathrm{rad}}$ (the phase margin expressed in radians). The largest tolerable delay is therefore $\tau_{\mathrm{margin}} = \mathrm{PM}_{\mathrm{rad}}/\omega_{gc}$, the point at which the delay's own phase loss exactly consumes the available margin.
:::

::: check
In the worked example, why does the phase crossover frequency $\omega_{pc}$ stay fixed at $51.42\,\mathrm{rad/s}$ across all three flight times, while the gain crossover frequency $\omega_{gc}$ rises sharply?
:::

::: answer
Inertia $I$ appears in the open-loop transfer function only as a real, positive scalar dividing the magnitude, $|G(j\omega)| \propto 1/I$; it does not appear in the phase at all, since dividing a complex number by a positive real scalar does not change its angle. The phase crossover, defined purely by where the phase reaches $-180^\circ$, is therefore set entirely by the PD gains and the delay, both unchanged across the three cases, while the gain crossover, defined by where the magnitude reaches unity, shifts outward as $I$ falls and the loop's overall gain rises.
:::

::: check
A frozen-time sweep at three flight times all shows comfortable margins. A colleague concludes the vehicle is verified stable throughout flight. What additional check does this lesson say is required before accepting that conclusion?
:::

::: answer
A quantitative check that the vehicle's parameters vary slowly relative to the closed loop's own response time — for instance, comparing the relative rate of change of each swept parameter to the loop period at each flight time, as the worked example did for inertia — since frozen-time analysis assumes slow variation and does not verify it automatically. Three comfortable snapshots do not, by themselves, rule out a fast transition (a staging event, an abrupt mode switch) between or near them that the snapshots are too sparse or too slow-varying an assumption to capture.
:::

::: check
Explain, using the worked numbers, why an $18\times$ drop in delay margin between liftoff and near-MECO is a real finding about the vehicle rather than a symptom of an invalid frozen-time analysis.
:::

::: answer
The slow-variation check in this lesson showed the inertia changes by only about $0.45\%$ within one loop period at every flight time examined, including near MECO — comfortably slow relative to the loop's own dynamics throughout — so the frozen-time assumption holds at all three points and the margins computed there are trustworthy individually. The delay-margin collapse is instead a real physical consequence of the loop's gain crossover frequency rising as inertia falls late in the burn, which pushes $\omega_{gc}$ toward the fixed phase crossover $\omega_{pc}$ set by the delay and the gains — a genuine narrowing of the stability boundary the vehicle actually experiences, correctly captured rather than manufactured by the method.
:::

::: check
Why is a margin sweep run only along the nominal trajectory, with no dispersion applied, considered incomplete for verification purposes?
:::

::: answer
Mass, inertia and aerodynamic properties are themselves dispersed quantities, from the dispersion-set lessons earlier in this module, and the margin at a given flight time shifts as those properties shift away from their nominal values — a nominal-only sweep reports the margin for one specific, average case rather than the worst case a real, dispersed vehicle might actually present. Verification requires the frozen-time sweep to be repeated across the dispersed cases at each flight time and the worst margin over that dispersion reported, exactly analogous to how a Monte Carlo reliability claim reports the campaign's tail behavior rather than its average outcome.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\mathrm{PM} = 180^\circ + \angle G(j\omega_{gc})$, $|G(j\omega_{gc})|=1$ | Phase margin, at the gain crossover frequency |
| $\mathrm{GM} = -20\log_{10}|G(j\omega_{pc})|$, $\angle G(j\omega_{pc})=-180^\circ$ | Gain margin, at the phase crossover frequency |
| $\tau_{\mathrm{margin}} = \mathrm{PM}_{\mathrm{rad}}/\omega_{gc}$ | Delay margin: the added pure delay that exactly consumes the phase margin |
| Frozen-time validity | Requires the plant's parameters to vary slowly relative to the loop's own response time — check the relative change per loop period explicitly |
| Worked collapse | PM $66^\circ\to19^\circ$, delay margin $151\,\mathrm{ms}\to8.3\,\mathrm{ms}$ from liftoff to near-MECO, with the slow-variation check confirming the sweep is trustworthy throughout |
| What a complete sweep reports | Worst-case margin over the dispersed cases, plotted against flight time, against the requirement — never the nominal-only case |
| Common binding constraint | Often a flex or slosh mode, not the rigid-body crossover; the same procedure applies with the swept plant model extended to include them |

Margins verified across the envelope are an analysis result — the next two lessons turn to the other half of verification entirely, the flight and simulation code itself, starting with what it actually means to test that code thoroughly rather than merely exercise it.
