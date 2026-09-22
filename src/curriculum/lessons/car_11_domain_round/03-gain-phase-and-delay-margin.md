---
id: l03-gain-phase-and-delay-margin
title: "Gain, phase and delay margin"
minutes: 17
covers:
  - "stability margins: gain margin, phase margin and delay margin, what each means physically and why you need all three"
---

Margins open more GNC domain rounds than any other subject, for a reason that has nothing to do with control theory being the hardest part of the job. They are the shortest complete test available: the definitions are two lines each, they are trivially checkable, they have an unambiguous physical meaning, and the follow-up — *why do you need more than one of them?* — separates people who have designed a loop from people who have read about designing one. An interviewer can run the whole subject in four minutes and learn a great deal.

This lesson gives the three definitions in the form you should be able to write cold, the physical reading of each, the conversion of phase margin into the number the flight software team actually cares about, and the answer to the *why all three* question. The next lesson covers reading them off a plot and the Nyquist criterion underneath them.

One notational point first, because a large fraction of margin confusion is a frequency mix-up. Throughout, $L(j\omega)$ is the **open-loop** frequency response — plant times controller times sensor, everything around the loop, with the loop cut. Two frequencies matter and they are different frequencies: the **gain crossover** $\omega_{gc}$, where $\lvert L\rvert = 1$, and the **phase crossover** $\omega_{pc}$, where $\angle L = -180^\circ$. Phase margin lives at the first; gain margin lives at the second. Saying the wrong one is the single most common error in this subject.

## Gain margin

Imagine the loop gain comes out larger than modelled: a stronger actuator, a lighter vehicle, more control effectiveness than the aerodynamic database predicted. Gain margin asks how much of that you can absorb.

At the phase crossover the loop already inverts the sign of whatever goes round it — $-180^\circ$ of phase is a sign flip — so negative feedback has become positive feedback at that one frequency. What stops it growing is that the magnitude there is less than one, so a disturbance at $\omega_{pc}$ comes back smaller each time round. Scale the gain up by the reciprocal of that magnitude and the loop sustains itself.

::: key Gain margin
$\mathrm{GM} = 1/\lvert L(j\omega_{pc})\rvert$, evaluated at the frequency where $\angle L = -180^\circ$; usually quoted in dB. It is the factor by which the open-loop gain can increase before the closed loop becomes unstable. Aerospace loops target $6\,\mathrm{dB}$ or more — a factor of two.
:::

Two facts to carry with it. A loop whose phase never reaches $-180^\circ$ has *infinite* gain margin, which is a real property and usually an artefact of a model that left out a delay or an actuator pole. And an open-loop-unstable plant — a launch vehicle in the atmosphere, an aerodynamically unstable airframe — has a gain margin *from below* as well: reduce the gain too far and it goes unstable in the other direction.

## Phase margin

Now imagine the loop acquires extra lag with no change in magnitude: an actuator slower than modelled, a filter somebody added late, computational latency, structural compliance. Phase margin asks how much of that you can absorb.

At the gain crossover the magnitude is already exactly one, so anything that arrives at that frequency comes back the same size. What stops it sustaining is that the phase is not yet $-180^\circ$. The gap is the margin.

::: key Phase margin
$\mathrm{PM} = 180^\circ + \angle L(j\omega_{gc})$, evaluated at the frequency where $\lvert L\rvert = 1$. It is the additional phase lag the loop tolerates before the closed loop becomes unstable. Aerospace loops target $30^\circ$ to $45^\circ$, often $60^\circ$ where the plant is poorly known.
:::

Phase margin is the more useful of the two on most vehicles, because most of what a model gets wrong is phase rather than gain. It also correlates loosely with closed-loop damping: for a second-order loop, $\zeta \approx \mathrm{PM}/100$ for margins below about $65^\circ$, with $\mathrm{PM}$ in degrees. Quote that as a rule of thumb about a particular loop shape, never as a definition — it is a useful bridge between the frequency-domain number and the time-domain behaviour an interviewer may ask you to predict.

## Delay margin

Phase margin is an angle, and nobody outside the controls group has an intuition for angles. Convert it.

A pure transport delay $T$ multiplies the loop by $e^{-j\omega T}$. The magnitude of that factor is exactly one at every frequency, so **the delay does not move the gain crossover at all**; the phase it removes is $\omega T$ radians, growing linearly with frequency. At $\omega_{gc}$ the remaining phase margin is therefore $\mathrm{PM} - \omega_{gc}T$, and it reaches zero when

$$T = \frac{\mathrm{PM}\ \text{in radians}}{\omega_{gc}}.$$

::: key Delay margin
$\tau_d = \mathrm{PM}$ (radians) $/\ \omega_{gc}$ (rad/s), in seconds. It converts phase margin into the physically meaningful quantity: how much pure transport delay the loop tolerates before going unstable. This is the number you take to the flight software team, because latency is built from things they can trade — sample rate, filter order, scheduling jitter, bus transport, task ordering.
:::

Note what the formula says about bandwidth. The crossover frequency is in the denominator, so **a faster loop has a smaller delay budget at the same phase margin**. That is the quantitative version of the experience that fast loops are the ones latency bites.

::: example All three margins for a reaction-wheel attitude loop
Take a rigid spacecraft, one axis, $J = 120\,\mathrm{kg\,m^2}$, with a PD controller designed for $\omega_n = 5\,\mathrm{rad/s}$ and $\zeta = 0.7$, so $k_p = J\omega_n^2 = 3000\,\mathrm{N\,m/rad}$ and $k_d = 2\zeta\omega_n J = 840\,\mathrm{N\,m\,s/rad}$. Add what a real implementation has: a $20\,\mathrm{ms}$ first-order actuator lag and a $10\,\mathrm{ms}$ computational delay. The open loop is

$$L(s) = \frac{(840s + 3000)\,e^{-0.01s}}{120\,s^2\,(0.02s + 1)}.$$

| Quantity | Value | Where |
| --- | --- | --- |
| Gain crossover | $\omega_{gc} = 7.639\,\mathrm{rad/s}$ | $\lvert L\rvert = 1$ |
| Phase margin | $51.9^\circ$ | at $\omega_{gc}$ |
| Phase crossover | $\omega_{pc} = 62.07\,\mathrm{rad/s}$ | $\angle L = -180^\circ$ |
| Gain margin | $23.0\,\mathrm{dB}$, a factor of $14.1$ | at $\omega_{pc}$ |
| Delay margin | $0.9055/7.639 = 0.1185\,\mathrm{s}$ | — |

Read the phase budget at crossover. The PD zero contributes $+64.9^\circ$ of lead above the double integrator's $-180^\circ$; the actuator lag takes back $\arctan(0.02 \times 7.639) = 8.69^\circ$; the $10\,\mathrm{ms}$ delay takes $\omega_{gc}T = 0.0764\,\mathrm{rad} = 4.38^\circ$. That leaves $51.9^\circ$, and the three contributions account for it exactly.

The delay margin is the useful output: $119\,\mathrm{ms}$ of further latency before this loop is unstable. A $100\,\mathrm{Hz}$ flight loop's zero-order hold alone behaves like about $T/2 = 5\,\mathrm{ms}$ of delay, so there is a great deal of room here.

Now ask for four times the bandwidth, $\omega_n = 20\,\mathrm{rad/s}$, leaving the actuator and the delay alone. The gains become $k_p = 48\,000\,\mathrm{N\,m/rad}$ and $k_d = 3360\,\mathrm{N\,m\,s/rad}$, the crossover moves to $27.6\,\mathrm{rad/s}$, and the phase margin collapses to $17.9^\circ$ — because the same $20\,\mathrm{ms}$ lag now costs $28.9^\circ$ instead of $8.7^\circ$, and the same $10\,\mathrm{ms}$ delay costs $15.8^\circ$ instead of $4.4^\circ$. The delay margin falls to $11.3\,\mathrm{ms}$: a factor of ten, for a factor of four in bandwidth, because both the numerator and the denominator moved against you.
:::

## Why you need all three

This is the follow-up, and it has a clean answer: **the three margins measure robustness to three different errors, and two of them are not even measured at the same frequency.**

Gain margin protects against an error in loop gain — a control effectiveness, an inertia, a wheel torque constant. Phase margin protects against an error in phase — an unmodelled lag, a filter, a mode. Delay margin is phase margin restated in the units of the error source that most often causes it, which makes it the one you can negotiate.

The consequence is that a comfortable gain margin does not buy you a phase margin. The two are read at different frequencies off different features of the same curve, and a loop can have $20\,\mathrm{dB}$ of gain margin and $8^\circ$ of phase margin at the same time. Such a loop passes the gain check, is nominally stable, and rings violently on any unmodelled delay. That case is the subject of the next lesson.

::: key Why all three
Gain margin guards against an error in loop gain, at the phase crossover. Phase margin guards against an error in phase or lag, at the gain crossover. Delay margin restates phase margin in seconds, which is the currency latency is actually traded in. A loop can have a comfortable gain margin and a dangerously small phase margin, and will then oscillate badly on any unmodelled delay.
:::

::: warning Three errors that cost the question
**Wrong frequency.** Gain margin at the gain crossover, or phase margin at the phase crossover, is the error interviewers listen for. They are measured at each other's frequencies, which is easy to say and easy to invert under pressure.

**Degrees where radians belong.** The delay margin formula needs the phase margin in radians. Forty-five degrees is $0.785$, not $45$.

**Treating infinite gain margin as good news.** It usually means the model has no delay and no high-frequency actuator dynamics in it. The delay margin is the honest number for such a loop.
:::

::: example "You have a loop with 45 degrees of phase margin. Is that enough?"
**A weak answer:** "Yes, that is within the normal range. You usually want between thirty and sixty degrees, so forty-five is fine."

True, and it answers a different question from the one asked. "Is that enough" is a requirements question, and the candidate has answered it with a rule of thumb.

**A strong answer:**

"It depends on what the loop has to be robust to, and I would want to convert it before deciding. Forty-five degrees is $\pi/4$, so about $0.785\,\mathrm{rad}$. Divide by the crossover frequency and I have the delay margin, which is the thing I can actually compare against a budget.

If this is a slow attitude loop crossing over at $1\,\mathrm{rad/s}$, that is $785\,\mathrm{ms}$ of tolerable latency, and forty-five degrees is generous. If it is a rate loop crossing over at $50\,\mathrm{rad/s}$, it is $15.7\,\mathrm{ms}$ — and a $200\,\mathrm{Hz}$ control task with its zero-order hold, a sensor filter and some scheduling jitter can eat a third of that before anyone has done anything wrong. Same margin in degrees, completely different engineering situation.

Three things I would want before answering properly. What is the gain margin, and at what frequency — because forty-five degrees of phase margin tells me nothing about gain robustness. How well is the plant known, since a poorly characterised plant is where the $60^\circ$ convention comes from. And is there a flexible mode anywhere near crossover, because a margin computed on a rigid model is a margin for a vehicle that does not exist.

Sanity check on the conversion: phase margin in radians over a frequency in radians per second gives seconds, which is what a delay should be."

**What the interviewer learns:** the weak answer recites a convention. The strong answer converts the margin into a quantity with engineering consequences, shows that the same number means different things at different bandwidths, names what else it would need to decide, and closes on a units check. It is about eighty seconds.
:::

## Check yourself

::: check
State the three margins, each with the frequency it is measured at and the error it protects against.
:::

::: answer
Gain margin, $\mathrm{GM} = 1/\lvert L(j\omega_{pc})\rvert$, measured at the phase crossover where $\angle L = -180^\circ$; it protects against an error in loop gain. Phase margin, $\mathrm{PM} = 180^\circ + \angle L(j\omega_{gc})$, measured at the gain crossover where $\lvert L\rvert = 1$; it protects against an error in phase or lag. Delay margin, $\tau_d = \mathrm{PM}$ in radians divided by $\omega_{gc}$, derived from phase margin at the same frequency; it protects against transport latency and is the form in which the margin can be traded with the software team.
:::

::: check
A loop has a phase margin of $35^\circ$ at a gain crossover of $25\,\mathrm{rad/s}$. Give the delay margin, and say whether a $200\,\mathrm{Hz}$ control task is comfortable in it.
:::

::: answer
Convert the angle: $35^\circ = 35\pi/180 = 0.6109\,\mathrm{rad}$. Divide by the crossover: $0.6109/25 = 0.02443\,\mathrm{s}$, about $24.4\,\mathrm{ms}$. A $200\,\mathrm{Hz}$ task has a sample period of $5\,\mathrm{ms}$, and a zero-order hold contributes roughly half a sample of equivalent delay, so about $2.5\,\mathrm{ms}$ from the hold alone — around a tenth of the budget. That leaves room, but not a lot of it once a sensor filter, bus transport and scheduling jitter are added, and $35^\circ$ is already at the low end of the usual target. The honest answer is that it fits, that the margin is the constraint rather than a comfort, and that the latency chain should be budgeted explicitly rather than assumed.
:::

::: check
An analysis reports infinite gain margin for a launch vehicle pitch loop. Is that good news? What would you ask for instead?
:::

::: answer
It is not, on its own, good news. Infinite gain margin means the open-loop phase never reaches $-180^\circ$ at any frequency, which almost always means the model stops short: no transport delay, no high-frequency actuator dynamics, no structural modes. Any of those, added, brings the phase down and produces a finite margin. The quantity to ask for is the delay margin, which is finite whenever the phase margin is, and which forces the analysis to say how much latency the loop actually tolerates. For an open-loop-unstable airframe there is also a low-gain margin to ask about: too *little* gain destabilises it, and an analysis reporting only a high-side margin has answered half the question.
:::

::: check
Two designs for the same vehicle have identical phase margins of $50^\circ$. One crosses over at $3\,\mathrm{rad/s}$, the other at $30\,\mathrm{rad/s}$. Which is more exposed to a late discovery that the avionics add $15\,\mathrm{ms}$ of latency, and by how much?
:::

::: answer
The fast one, by a factor of ten. $50^\circ$ is $0.8727\,\mathrm{rad}$, so the slow design has a delay margin of $0.8727/3 = 0.2909\,\mathrm{s}$ and the fast one $0.8727/30 = 0.02909\,\mathrm{s}$. An extra $15\,\mathrm{ms}$ consumes about $5\%$ of the slow design's budget and about half of the fast design's — the fast loop's phase margin drops by $\omega_{gc}T = 30 \times 0.015 = 0.45\,\mathrm{rad}$, which is $25.8^\circ$, leaving $24.2^\circ$, while the slow loop loses $2.6^\circ$. Identical phase margins, entirely different exposure, because delay margin scales inversely with bandwidth.
:::

::: check
Why does adding a pure delay to a loop leave the gain crossover frequency unchanged, and what does that let you compute without re-plotting anything?
:::

::: answer
A pure delay of $T$ multiplies the loop by $e^{-j\omega T}$, whose magnitude is $1$ at every frequency. Since the magnitude of $L$ is unchanged everywhere, the frequency at which it equals one does not move. Only the phase changes, by $-\omega T$ radians. That is exactly why the delay margin can be computed from the undelayed loop's phase margin and crossover frequency with no new plot: the new phase margin is simply $\mathrm{PM} - \omega_{gc}T$, linear in $T$, and it hits zero at $T = \mathrm{PM}/\omega_{gc}$. The same argument is why a delay is far more damaging to a fast loop than a slow one at equal phase margin.
:::

## Summary

| Quantity | Definition | Where measured | Target |
| --- | --- | --- | --- |
| Gain crossover $\omega_{gc}$ | $\lvert L(j\omega)\rvert = 1$ | — | — |
| Phase crossover $\omega_{pc}$ | $\angle L(j\omega) = -180^\circ$ | — | — |
| Gain margin | $\mathrm{GM} = 1/\lvert L(j\omega_{pc})\rvert$ | at $\omega_{pc}$ | $\ge 6\,\mathrm{dB}$ |
| Phase margin | $\mathrm{PM} = 180^\circ + \angle L(j\omega_{gc})$ | at $\omega_{gc}$ | $30^\circ$–$60^\circ$ |
| Delay margin | $\tau_d = \mathrm{PM}_{\mathrm{rad}}/\omega_{gc}$ | at $\omega_{gc}$ | against the latency budget |
| Damping rule of thumb | $\zeta \approx \mathrm{PM}/100$ below about $65^\circ$ | second-order loops only | — |
| Wheel loop worked above | $\omega_{gc} = 7.64$, $\mathrm{PM} = 51.9^\circ$, $\mathrm{GM} = 23.0\,\mathrm{dB}$, $\tau_d = 119\,\mathrm{ms}$ | — | — |

The next lesson reads these three numbers off a Bode plot and a Nyquist plot, states the criterion that makes the whole construction valid, and then builds the loop this lesson promised: excellent gain margin, terrible phase margin, and unflyable.
