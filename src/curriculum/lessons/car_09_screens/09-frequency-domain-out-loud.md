---
id: l09-frequency-domain-out-loud
title: "Phase margin, explained out loud"
minutes: 23
covers:
  - reported topics: PD control, orbit determination, frequency-domain analysis
---

The previous lesson designed a loop and put its poles where they were wanted. That is a complete answer to the question *does this work?* and no answer at all to the question that actually decides whether a control law flies: *does it still work when the vehicle is not the vehicle you modelled?*

The inertia will not be what you assumed. The actuator has dynamics you left out. The flight computer takes a few milliseconds to produce each command, and the sensor filter adds a few more. There is a structural mode somewhere you did not model and possibly do not know about. Frequency-domain analysis exists to answer the robustness question quantitatively, and its two headline numbers — gain margin and phase margin — are the standard way that answer gets written down and reviewed.

That is why it appears on this module's reported list of phone-screen topics, and why the version of the question you are most likely to get is not *compute the phase margin* but *what does phase margin mean physically?* The second is the harder question, and it is the one this lesson is built around.

## The loop transfer function and the two crossings

Everything here is about one object: the **loop transfer function** $L(s) = C(s)G(s)$, the product of controller and plant, measured by breaking the loop open at any point and going all the way round. Not the closed-loop transfer function — the open-loop one. Getting this wrong is the commonest confusion in the subject, so say which one you mean out loud.

Two frequencies matter.

The **gain crossover frequency** $\omega_c$ is where the loop gain passes through unity: $|L(j\omega_c)| = 1$, or equivalently 0 dB. Below it the loop has authority and the closed-loop system tracks; above it the loop gives up. It is, to a good approximation, the closed-loop bandwidth.

The **phase crossover frequency** $\omega_{180}$ is where the loop phase passes through $-180^\circ$.

The margins are the distances from instability measured at each of those two frequencies.

$$\mathrm{PM} = 180^\circ + \angle L(j\omega_c), \qquad \mathrm{GM} = \frac{1}{|L(j\omega_{180})|}$$

Phase margin is how much *additional phase lag* at the gain crossover frequency would take the loop to marginal stability. Gain margin is the factor by which the loop gain could be multiplied, at the frequency where the phase is already $-180^\circ$, before the same thing happened.

::: warning Both margins presume a stable, minimum-phase loop
The simple reading of margins off a Bode plot is valid for a loop that is open-loop stable and minimum-phase — no right-half-plane poles or zeros — so that the Nyquist criterion requires zero encirclements of the $-1$ point. For a loop with a right-half-plane pole, such as an inverted-pendulum-like plant, closed-loop stability *requires* an encirclement, and a large apparent gain margin can hide the fact that reducing the gain destabilises it. Say the assumption before you give the definition. This module's source material reports the assumption being expected explicitly.
:::

## What phase margin means physically

The definition above is circular-sounding until you convert it into something with units of time, and that conversion is the answer an interviewer is looking for.

A pure time delay of $T$ seconds has unity magnitude at every frequency and contributes a phase of $-\omega T$ radians. It changes no gain anywhere and removes phase everywhere, in proportion to frequency. So if your loop has a phase margin of $\mathrm{PM}$ radians at a crossover frequency $\omega_c$, the largest pure delay you could insert before the loop reaches marginal stability is

$$T_{\max} = \frac{\mathrm{PM}\ \text{[rad]}}{\omega_c}$$

That is the physical content. **Phase margin is a budget for unmodelled lag, and dividing it by the crossover frequency turns it into seconds.** Everything that eats it is a real thing on a real vehicle: computation delay between reading the sensor and commanding the actuator, the zero-order hold's effective half-sample delay, actuator response time, anti-aliasing and noise filters, the transport lag of a slow bus.

It also explains why a fast loop is harder to make robust. The tolerable delay is the margin divided by the crossover frequency, so doubling the bandwidth halves the delay budget at the same phase margin. A twenty-millisecond computation delay is invisible in a slow spacecraft attitude loop and can be most of the margin in a launch vehicle rate loop.

::: key
Phase margin is the additional phase lag at the gain crossover frequency that would drive the loop to marginal stability. Converted to time, the tolerable pure delay is the phase margin in radians divided by the crossover frequency. It is a budget for unmodelled lag — computation delay, the hold, actuator dynamics, filters — and it shrinks in seconds as the bandwidth rises.
:::

## Design targets, and what they are

Common engineering practice targets something like $30^\circ$ to $60^\circ$ of phase margin and a gain margin of about 6 dB — a factor of 2 in gain, since 6 dB corresponds to a factor of 1.995, and a factor of 2 is 6.02 dB. These are conventions from control practice, of the kind Franklin, Powell and Emami-Naeini set out, not requirements from any particular employer, and a specific programme will have its own numbers in a specific requirements document. Quote them as what they are: the values you would use to sanity check a design in the absence of a stated requirement.

The reason for a floor around $30^\circ$ is that margin below it leaves almost nothing for the lags you did not model, and the closed-loop response becomes badly underdamped — which connects the frequency-domain number back to the time-domain one from the previous lesson.

## Phase margin and damping are the same statement

For the canonical second-order loop, phase margin and closed-loop damping ratio are two readings of one design choice. The useful approximation is

$$\zeta \approx \frac{\mathrm{PM}\ \text{[degrees]}}{100}$$

good up to a phase margin of roughly $60^\circ$ to $70^\circ$. Exact values for the standard loop: a damping ratio of 0.3 corresponds to about $33^\circ$, 0.5 to about $52^\circ$, and 0.7 to about $65^\circ$. Knowing this pair lets you answer a frequency-domain question with a time-domain check and vice versa, which is the single most useful sanity check available in this area — and it is the kind of closing move the previous lessons have been asking for.

## Slope at crossover

One more standard fact, because it is the shortest route to a reasoned answer about *why* a loop is designed the way it is.

For a minimum-phase system, Bode's gain–phase relationship ties the phase to the slope of the magnitude curve: a magnitude slope of $-20\,\mathrm{dB}$ per decade sustained around a frequency corresponds to about $-90^\circ$ of phase there, and $-40\,\mathrm{dB}$ per decade to about $-180^\circ$.

That is why the design rule is to cross over at a slope of $-20\,\mathrm{dB}$ per decade. At $-40$ you are at roughly $-180^\circ$ at the crossover frequency, which is zero phase margin. And it is exactly why the double integrator needs derivative action: $1/(Js^2)$ has a slope of $-40\,\mathrm{dB}$ per decade everywhere and a phase of $-180^\circ$ everywhere, so *any* proportional-only loop closed around it crosses over at the worst possible slope. The derivative term contributes a zero, which lifts the slope to $-20$ and the phase toward $-90^\circ$ in the region around crossover. The PD controller's phase contribution is $\arctan(k_d\omega/k_p)$, rising from $0^\circ$ at low frequency toward $+90^\circ$ at high frequency — and the whole of the phase margin on that loop is that lead term.

::: key
For a minimum-phase loop, a magnitude slope of $-20\,\mathrm{dB}$/decade at crossover corresponds to roughly $-90^\circ$ of phase and $-40\,\mathrm{dB}$/decade to roughly $-180^\circ$, so designs aim to cross over at $-20$. A double integrator is $-40\,\mathrm{dB}$/decade at every frequency, which is why proportional-only feedback around it has zero phase margin, and why the PD zero — contributing $\arctan(k_d\omega/k_p)$ of lead — is what creates the margin.
:::

::: example "What does phase margin mean physically?"
**Weak answer:** "Phase margin is the amount of phase you can add before the system becomes unstable. You read it off the Bode plot at the frequency where the gain is 0 dB — it is 180 degrees plus the phase there. You generally want at least 30 to 45 degrees."

**Strong answer:**

"I will state the assumption, give the definition, then say what it means in physical terms and check it against something.

Assumption first: I am talking about a loop that is open-loop stable and minimum-phase, so that the Nyquist criterion wants zero encirclements of minus one and the margins read straight off the Bode plot mean what they appear to mean. For a plant with a right-half-plane pole that reading is not valid.

Definition: take the loop transfer function — controller times plant, open loop. Find the gain crossover frequency, where the magnitude passes through unity. The phase margin is 180 degrees plus the loop phase at that frequency; equivalently, it is the extra phase lag you could add at that one frequency before the loop sits exactly on the point of marginal stability.

Physically, the thing that adds phase lag without adding gain is a time delay. A pure delay of $T$ seconds contributes minus omega $T$ radians of phase and leaves the magnitude alone. So the phase margin, in radians, divided by the crossover frequency, is the largest pure delay the loop tolerates. That makes it a budget for everything I did not model: the computation delay between reading the gyro and commanding the actuator, the effective half-sample delay of the zero-order hold, the actuator's own response, the anti-aliasing filter.

And it explains why fast loops are hard: the delay budget is the margin over the crossover frequency, so at fixed phase margin, doubling the bandwidth halves the number of milliseconds I can afford.

Sanity check with a typical value. Sixty degrees of phase margin is about 1.05 radians. On a slow spacecraft attitude loop crossing over near 1 radian per second, that is about a second of tolerable delay, which is enormous — delay is a non-issue there. On a launch vehicle rate loop crossing over near 30 radians per second, the same 60 degrees is about 35 milliseconds, which is the same order as the computation and filtering delays actually present. Same margin, completely different engineering problem, and that is the point of expressing it in time."

**What makes the difference:** the weak answer is a correct definition and nothing else. It would pass a written exam and it fails the follow-up, which is always *yes, but what does that mean on a vehicle?* — because a phase margin stated in degrees is not yet connected to anything an engineer can measure or trade.

The strong answer does four things in roughly three minutes: it states the assumption, gives the definition, converts it into seconds of tolerable lag, and then performs the conversion on two real systems whose answers differ by a factor of thirty. The closing comparison is doing the most work, because it demonstrates that the candidate understands why the number is expressed as an angle and what it costs to leave it that way.
:::

::: example Estimating crossover and phase margin in your head
Take the loop from the previous lesson: $J = 120\,\mathrm{kg\,m^2}$, $k_p = 30\,\mathrm{N\,m/rad}$, $k_d = 84\,\mathrm{N\,m\,s/rad}$, so

$$L(s) = \frac{k_p + k_d s}{Js^2}$$

**Interviewer:** Roughly where does that cross over, and what is the phase margin?

Solving $|L(j\omega)| = 1$ exactly means a quartic, which you are not going to do out loud. Here is the estimate you can do.

"At crossover the derivative term is the bigger one — the zero is at $k_p/k_d$, about 0.36 radians per second, so by the time we are near crossover the numerator is dominated by $k_d\omega$. That gives magnitude about $k_d\omega/(J\omega^2) = k_d/(J\omega)$, which is one when $\omega \approx k_d/J$. That is $84/120$, so about 0.7 radians per second.

For the phase: the plant contributes a flat minus 180 degrees, and the controller contributes $\arctan(k_d\omega/k_p)$ of lead. At 0.7 radians per second that is $\arctan(84 \times 0.7/30)$, and $84 \times 0.7/30 = 1.96$, so the arctangent is about 63 degrees. The phase at crossover is therefore about minus 117 degrees, and the phase margin is about 63 degrees.

Two checks. The rule that damping ratio is roughly phase margin over one hundred gives about 0.63, and I designed this loop for $\zeta = 0.7$ — consistent, and the small shortfall is because my crossover estimate was low. And converting to time: 63 degrees is about 1.1 radians, over 0.7 radians per second, so roughly one and a half seconds of tolerable delay. For a reaction-wheel loop, delay will never be the binding constraint here."

**How good is the estimate?** Solved exactly, the crossover is at $0.771\,\mathrm{rad/s}$ and the phase margin is $65.2^\circ$, against the estimated $0.7$ and $63^\circ$. The estimate is low by about nine percent in frequency and two degrees in margin — far inside the accuracy anyone wants on a phone call, and obtained with two divisions and an arctangent.

**What makes this worth practising:** the move that makes it work is identifying which term dominates at the frequency of interest and dropping the other one. That is the general technique for frequency-domain questions without a plot, and it generalises: find the region, keep the dominant term, estimate, then say how far off you expect to be. Note also the last line of the answer — converting the margin into seconds and then saying whether it matters for this vehicle. Stopping at "63 degrees" would have answered the question; going one step further answers the question behind it.
:::

## Gain margin, and when it lies

Gain margin is the simpler number and the less informative one. For the PD loop above there is no finite gain margin at all: the phase is $-180^\circ + \arctan(k_d\omega/k_p)$, which is strictly greater than $-180^\circ$ for every positive frequency, so the phase never crosses and the gain margin is infinite.

That sounds wonderful and means very little, because it is an artefact of the model. Add a computation delay, an actuator lag, or a lightly damped structural mode above the crossover frequency and the phase does cross $-180^\circ$, at which point the gain margin becomes finite and may be small. An infinite gain margin in an idealised model is a statement about the model, not about the vehicle.

There is a better single number for robustness, worth having as a follow-up: the shortest distance from the $-1$ point to the Nyquist curve. Its reciprocal is the peak of the sensitivity function, and unlike either classical margin it cannot be made to look good by a loop that passes close to $-1$ while keeping both margins nominally acceptable. If an interviewer asks whether adequate gain and phase margins guarantee robustness, that is the answer: not on their own, because a loop can skirt the critical point while satisfying both.

## Check yourself

::: check
Define gain crossover frequency, phase crossover frequency, phase margin and gain margin, and state the assumption under which reading the two margins off a Bode plot is valid.
:::

::: answer
All four are properties of the loop transfer function $L(s) = C(s)G(s)$, the open-loop product of controller and plant. The gain crossover frequency $\omega_c$ is where $|L(j\omega)| = 1$; the phase crossover frequency $\omega_{180}$ is where $\angle L(j\omega) = -180^\circ$. Phase margin is $180^\circ + \angle L(j\omega_c)$, the extra lag at crossover that would produce marginal stability; gain margin is $1/|L(j\omega_{180})|$, the factor the gain could be multiplied by at that frequency before the same thing happened. The reading is valid for an open-loop stable, minimum-phase loop, where the Nyquist criterion requires zero encirclements of $-1$; with a right-half-plane pole the closed loop requires an encirclement and the plain reading can be badly misleading.
:::

::: check
A rate loop crosses over at $30\,\mathrm{rad/s}$ with $60^\circ$ of phase margin. A software change adds 20 ms of computation delay. What is left?
:::

::: answer
A pure delay contributes $-\omega T$ radians of phase at frequency $\omega$. At the crossover frequency that is $30 \times 0.02 = 0.6$ radians, which is about 34 degrees. The remaining phase margin is $60 - 34 = 26$ degrees, so the change has consumed more than half of the budget and left the loop at the bottom edge of what is normally considered acceptable. The same 20 ms in a loop crossing over at 1 rad/s would cost 0.02 radians, a little over one degree, and would not be worth mentioning — the cost of a delay scales with the crossover frequency, which is the whole reason phase margin has to be converted into time before it can be traded.
:::

::: check
Explain why a double integrator under pure proportional control has zero phase margin, using the gain–phase relationship rather than the pole locations.
:::

::: answer
The magnitude of $1/(Js^2)$ falls at $-40\,\mathrm{dB}$ per decade at every frequency. For a minimum-phase system a sustained slope of $-40\,\mathrm{dB}$ per decade corresponds to a phase of about $-180^\circ$, and here it is exactly $-180^\circ$ at all frequencies. A proportional gain is a constant: it shifts the magnitude curve up or down, moving the crossover frequency, and contributes no phase at all. So whatever gain is chosen, the phase at crossover is $-180^\circ$ and the phase margin is zero — which is the frequency-domain statement of the same fact the root locus gives, that the closed-loop poles sit on the imaginary axis for every gain.
:::

::: check
A candidate reports that their loop has infinite gain margin and concludes it is very robust. What is wrong with the conclusion?
:::

::: answer
Infinite gain margin only means that in the model as written the loop phase never reaches $-180^\circ$, which is common for simple idealised loops — a PD controller on a double integrator has phase strictly above $-180^\circ$ at every positive frequency. It is a property of the model rather than of the vehicle. Any of the things the model omits — computation delay, the hold, actuator dynamics, a lightly damped structural mode above crossover — adds phase lag that grows with frequency and will bring the phase across $-180^\circ$, at which point the gain margin becomes finite and may be small. The robust conclusion needs the unmodelled dynamics included, and a better single number is the shortest distance from the Nyquist curve to $-1$, whose reciprocal is the peak sensitivity.
:::

::: check
You are told a loop has $45^\circ$ of phase margin. Estimate the closed-loop damping ratio and say what you would expect the step response to look like.
:::

::: answer
Using the approximation that damping ratio is roughly phase margin in degrees divided by one hundred, $\zeta \approx 0.45$ — consistent with the exact values for the canonical second-order loop, where 0.5 corresponds to about $52^\circ$ and 0.3 to about $33^\circ$. A damping ratio near 0.45 means a step response that overshoots noticeably and rings for a couple of cycles before settling, rather than one that approaches monotonically. Two caveats worth stating: the approximation is for the canonical second-order loop and degrades for higher-order or lightly damped systems, and if the closed-loop command path carries a zero — as a PD controller acting on the error does — the actual overshoot will exceed what the damping ratio alone suggests.
:::

::: check
Why is the tolerable delay budget the thing to quote rather than the phase margin itself, when discussing a specific vehicle?
:::

::: answer
Because phase margin in degrees is not comparable across loops of different bandwidth, and the quantity engineers actually trade is time. The same $60^\circ$ is about a second of tolerable delay in a loop crossing over near 1 rad/s and about 35 milliseconds in one crossing over near 30 rad/s, which are completely different engineering situations: in the first, delay is irrelevant; in the second it is the same order as the real computation, hold and filter delays and must be budgeted explicitly. Converting to time makes the margin directly comparable with the delays you can measure, which is what turns it from a number on a plot into a design constraint.
:::

## Summary

| Quantity | Definition | Note |
| --- | --- | --- |
| Loop transfer function | $L(s) = C(s)G(s)$, open loop | Not the closed-loop function; say which you mean |
| Gain crossover $\omega_c$ | $\lvert L(j\omega_c)\rvert = 1$ | Approximately the closed-loop bandwidth |
| Phase crossover $\omega_{180}$ | $\angle L = -180^\circ$ | May not exist for a simple loop |
| Phase margin | $180^\circ + \angle L(j\omega_c)$ | Extra lag at $\omega_c$ giving marginal stability |
| Gain margin | $1/\lvert L(j\omega_{180})\rvert$ | Infinite in idealised models; finite once lag is added |
| Tolerable delay | $T_{\max} = \mathrm{PM}\,[\text{rad}]/\omega_c$ | The physical reading of phase margin |
| Damping estimate | $\zeta \approx \mathrm{PM}[^\circ]/100$ | Good to about $60^\circ$–$70^\circ$ |
| Slope at crossover | $-20\,\mathrm{dB}$/decade $\to$ about $-90^\circ$ | $-40$ gives about $-180^\circ$, zero margin |
| Common design targets | $30^\circ$–$60^\circ$ PM, about 6 dB GM | Practice convention, not any employer's requirement |

The next lesson takes the third of the reported topics — orbit determination — where the question is less about a formula and more about knowing which method matches which set of observations.
