---
id: l06-computational-delay
title: Computational delay and where it shows up in the loop
minutes: 21
covers:
  - Computational delay and where it shows up in the loop
---

None of the discretization methods of the previous lesson knows that a computer takes time. Every one of them produces a difference equation with a $b_0$ term — this frame's output depending on this frame's input — which assumes the flight computer reads the gyro and drives the gimbal at the same instant. It does not. Between the sampling instant and the moment the new command reaches the actuator there is a gap, and on a well-instrumented vehicle you can measure it to the microsecond.

That gap is the **computational delay**, written $\tau_c$. It is pure phase lag in series with the plant, inside the loop, and at a typical crossover it costs about as much as the zero-order hold and the anti-alias filter put together. Unlike those two, where it lands is a *design decision*: the same control law, the same processor and the same sample rate can produce anything from a fifth of a frame to a full frame of delay depending on how the task is scheduled and how the code is ordered.

This lesson sets out the frame timeline, shows where each contribution enters, builds the phase budget that the sample-rate lesson will then use, and works through the four things you can actually do about it.

## The frame timeline

A fixed-step control task looks like this, once per frame:

1. A hardware timer fires. The interrupt latency — the time between the timer edge and the first instruction of the handler — is a few microseconds on a bare-metal target and can be tens of microseconds under an operating system.
2. The sensor sample is acquired, or a value already latched by a converter is read. The instant that matters for analysis is when the physical quantity was *measured*, which for a sigma-delta converter with an internal decimation filter is some tens of samples of its internal rate earlier, expressed as a group delay in the datasheet.
3. The control law runs: filters, the PID, limiters, mixing to actuators. This takes $\tau_{\text{exec}}$, which varies from frame to frame with branch outcomes, cache state and which mode the vehicle is in.
4. The command is written to the digital-to-analog converter or onto the actuator bus. From that instant the zero-order hold holds it for a frame.

The **actuation delay** is the time from (2) to (4). Everything before (2) — sensor group delay and anti-alias filtering — is separate, and everything after (4) is the hold. All three are in series in the loop and all three are, at crossover, pure phase lag.

The choice that matters is step 4's timing, and there are two schools.

**Output when ready.** Write the command as soon as the control law finishes. The delay is then $\tau_{\text{exec}}$, which is as small as it can be — but it is not constant. A control law whose execution time ranges from $0.8$ to $1.2\,\mathrm{ms}$ delivers a delay that ranges over the same $0.4\,\mathrm{ms}$, and a varying delay is jitter, which is a different and worse problem that the last lesson of this module takes up.

**Output at a fixed instant.** Write the command from a second timer interrupt at a fixed offset after the sample, chosen greater than the worst-case execution time. The delay is then exactly that offset, every frame, with no variation. The common and most conservative version sets the offset to one full frame: the value computed from $y[n]$ is written at the start of frame $n+1$. That is a delay of exactly $T$, worth one factor of $z^{-1}$, and it is what most flight software does because it is trivially analysable and trivially verifiable.

::: key
**Computational delay.** The time $\tau_c$ from the sampling instant to the actuation instant. It contributes phase lag $-\omega\tau_c$, that is $-360^\circ f \tau_c$, in series with the plant. A full-frame delay, $\tau_c = T$, is one factor of $z^{-1}$ and costs $-180^\circ f/f_s \times 2$ — twice the zero-order hold. Bound it by design; the rule of thumb is that the zero-order hold plus one sample of computational delay costs $3 \times 180^\circ f_c/f_s$ at crossover.
:::

## Putting it in the model

In the $s$ domain a delay is $e^{-s\tau_c}$: unity magnitude, phase $-\omega\tau_c$. In the $z$ domain, when $\tau_c$ is an exact multiple of the sample period, $\tau_c = dT$, it is $z^{-d}$ — append $d$ zeros to the denominator coefficient list and nothing else changes.

A fractional delay, $\tau_c = mT$ with $0 < m < 1$, has no exact representation as a power of $z$, and there are two honest ways to handle it. The rigorous one is the modified z-transform, which computes the ZOH equivalent of the plant with an offset sampling instant and produces an extra zero. The practical one, good enough for margins, is to analyse the loop in the frequency domain with an explicit factor $e^{-j\omega mT}$ alongside the discrete transfer functions; the frequency response is what you are reading margins from, and multiplying it by a complex exponential is exact.

The one thing that is *not* acceptable is leaving it out because it is not a whole sample. A third of a frame at $100\,\mathrm{Hz}$ is $3.3\,\mathrm{ms}$, which at a $5\,\mathrm{Hz}$ crossover is $6^\circ$.

::: example The phase budget of a 200 Hz thrust-vector-control loop
A launch vehicle pitch loop runs at $f_s = 200\,\mathrm{Hz}$ and crosses over at $f_c = 5\,\mathrm{Hz}$. Four effects sit between the vehicle's true attitude rate and the gimbal command, each of which is, at $5\,\mathrm{Hz}$, effectively a delay.

- The rate gyro's internal decimation filter has a group delay of $1.50\,\mathrm{ms}$, from the datasheet.
- The analog anti-alias filter is a second-order Butterworth with a $60\,\mathrm{Hz}$ corner. Its group delay at DC is $2\zeta/\omega_c = 1.4142/376.99 = 3.75\,\mathrm{ms}$, and its exact phase at $5\,\mathrm{Hz}$ is $6.77^\circ$ against the $6.75^\circ$ the delay model gives — close enough to treat as a delay.
- The zero-order hold contributes $T/2 = 2.50\,\mathrm{ms}$.
- The control task is scheduled to write its output at the top of the next frame, so the computational delay is one full frame, $5.00\,\mathrm{ms}$.

```python
import numpy as np

fc = 5.0                       # Hz, loop crossover
w = 2 * np.pi * fc

budget = [                     # (name, equivalent delay in seconds)
    ("sensor internal filter", 1.50e-3),
    ("analog anti-alias, 2nd order at 60 Hz", 3.75e-3),
    ("zero-order hold, T/2 at 200 Hz", 2.50e-3),
    ("computational delay, one frame", 5.00e-3),
]

total = 0.0
for name, tau in budget:
    print("%-38s %5.2f ms   %5.2f deg" % (name, tau * 1e3, np.degrees(w * tau)))
    total += tau
print("%-38s %5.2f ms   %5.2f deg" % ("total", total * 1e3, np.degrees(w * total)))

# sensor internal filter                  1.50 ms    2.70 deg
# analog anti-alias, 2nd order at 60 Hz   3.75 ms    6.75 deg
# zero-order hold, T/2 at 200 Hz          2.50 ms    4.50 deg
# computational delay, one frame          5.00 ms    9.00 deg
# total                                  12.75 ms   22.95 deg
```

Twelve and three quarter milliseconds, $22.95^\circ$ at crossover. A continuous design carrying $50^\circ$ of phase margin flies with $27^\circ$ — acceptable, but not what the design review approved unless the review knew.

Notice the ranking. The single largest item is the computational delay, and it is the only one that is a scheduling choice rather than a physical property. Cutting it to a fixed $2\,\mathrm{ms}$ offset, which is achievable if the worst-case execution time is measured at $1.2\,\mathrm{ms}$, returns $5.4^\circ$ — more than doubling the sample rate would give, and at no CPU cost.
:::

## Delay margin: how much you have left

The classical control module defined the **delay margin** as the extra transport delay that drives the phase margin to zero:

$$
\tau_{\text{DM}} = \frac{\phi_m}{\omega_c},
$$

with $\phi_m$ in radians. In a sampled loop it is more useful in samples,

$$
d_{\text{DM}} = \frac{\phi_m}{\omega_c T} = \frac{\phi_m\,f_s}{\omega_c},
$$

because that is the number you compare against the schedule. A loop with $45^\circ$ of margin at $\omega_c = 6.2832\,\mathrm{rad/s}$ tolerates $0.7854/6.2832 = 125\,\mathrm{ms}$ of extra delay, which at $50\,\mathrm{Hz}$ is $6.25$ samples.

Two cautions. First, the delay margin is computed from the margin you have *left*, so it shrinks as you spend it: in the worked example below, the same loop has $5.75$ samples of delay margin after the hold is accounted for and $4.75$ after one sample of computational delay. Second, delay margin is a linear time-invariant quantity. A *varying* delay is not covered by it at all, and a loop with three samples of delay margin running with a delay that wanders between one and two samples is not "using two thirds of its margin" in any meaningful sense — that is the jitter argument of the last lesson.

::: example One sample of delay, measured exactly
Take the attitude loop of the zero-order-hold lesson, now with a filtered derivative so it can be discretized cleanly: $J = 500\,\mathrm{kg\,m^2}$, $P(s) = 1/(Js^2)$, and

$$
C(s) = k_p + k_d\,\frac{\omega_f\,s}{s + \omega_f},
\qquad \omega_f = 2\pi \cdot 20 = 125.66\,\mathrm{rad/s},
$$

with $k_p = 13{,}260$ and $k_d = 2{,}227$ chosen so the continuous loop crosses over at $\omega_c = 6.2832\,\mathrm{rad/s}$ with exactly $45.00^\circ$ of phase margin.

Now build the discrete loop honestly. Discretize the plant with ZOH equivalence, so the hold is in the model once and correctly. Discretize the controller with Tustin prewarped at $\omega_c$, so its response is exact where the margin is read. Then compute the margin from the discrete open loop $L(z)$, with and without a factor $z^{-1}$ for a full-frame computational delay.

| $f_s$ | $f_s/f_c$ | Hold only | With one sample of delay | Cost of the delay |
| --- | --- | --- | --- | --- |
| $200\,\mathrm{Hz}$ | 200 | $44.10^\circ$ | $42.30^\circ$ | $1.80^\circ$ |
| $100\,\mathrm{Hz}$ | 100 | $43.20^\circ$ | $39.60^\circ$ | $3.60^\circ$ |
| $50\,\mathrm{Hz}$ | 50 | $41.39^\circ$ | $34.19^\circ$ | $7.20^\circ$ |
| $25\,\mathrm{Hz}$ | 25 | $37.77^\circ$ | $23.39^\circ$ | $14.37^\circ$ |

Every entry in the last column is $360^\circ f_c/f_s$ to three digits, which is the delay formula with $\tau_c = T$ and nothing else. The exact $z$-domain computation and the back-of-the-envelope agree, which is the point: you do not need the discrete machinery to predict this, you need it to confirm that nothing else is going on.

Read the rows as a design statement. At $50\,\mathrm{Hz}$ — fifty samples per cycle of crossover, which sounds generous — a design with $45^\circ$ of continuous margin flies with $34^\circ$. At $25\,\mathrm{Hz}$ it flies with $23^\circ$, which gives a closed-loop resonant peak around $8\,\mathrm{dB}$ and visible overshoot. Neither row involved changing a single gain.

The delay margin left at $50\,\mathrm{Hz}$ is $\phi_m/(\omega_c T) = 0.5967/(6.2803 \times 0.02) = 4.75$ samples. That is the number to hand the software team: the loop tolerates four and a half more frames of latency before it is neutrally stable, so a scheduling change that adds two frames consumes nearly half of what remains.
:::

## What to do about it

**Shorten the critical path.** Only the part of the control law that depends on the new measurement has to run between the sample and the actuation. Everything else — gain scheduling lookups, limit computation, telemetry packing, the parts of a filter that depend only on stored state — can run in the *previous* frame. Splitting a control law into a long "prepare" stage and a short "apply" stage is a standard flight-software pattern, and on a loop whose full execution takes $1.2\,\mathrm{ms}$ it is often possible to get the measurement-dependent path under $200\,\mathrm{\mu s}$. This is the cheapest phase you will ever buy.

**Fix the actuation instant.** Whatever the execution time, write the output from a hardware timer at a constant offset. The delay becomes deterministic and therefore analysable, and the jitter disappears. Choose the offset as the measured worst-case execution time plus margin, not as a full frame by habit.

**Predict.** If the controller is built on a state estimator, propagate the estimate forward by $\tau_c$ using the model before computing the command, so the command is based on where the vehicle will be when the command lands rather than on where it was when the sample was taken. This works, it is routine in estimator-based GNC, and it trades delay for model error: the prediction is only as good as the model over $\tau_c$, which for $5\,\mathrm{ms}$ of rigid-body motion is very good indeed and for $5\,\mathrm{ms}$ of a structural mode is not. Predicting through a known, fixed delay is sound. Predicting through jitter is not, because there is nothing to predict.

**Design for it.** Include $z^{-d}$ in the model from the start, tune against the discrete loop, and let the design absorb the delay rather than treating it as an error afterwards. A controller designed against a model that includes its own delay is a different controller — typically a little less derivative action and a little more lead placed lower — and it is the right one.

::: warning
Do not treat the computational delay as an uncertainty to be covered by margin. It is a known, measurable, repeatable property of the software, and treating it as slop wastes margin you will need for the things that genuinely are uncertain: modal frequencies, aerodynamic coefficients, actuator nonlinearity.

The specific failure this prevents: a loop is analysed with $45^\circ$ of phase margin against an uncertainty budget that assumes $30^\circ$ is enough, and separately the schedule grows from one frame of latency to three during integration because a new sensor was added to the same task. Nobody recomputes the margin, because latency was never a line item. At $50\,\mathrm{Hz}$ and a $1\,\mathrm{Hz}$ crossover those two extra frames are $14.4^\circ$, and they come out of the uncertainty budget, not out of some reserve. Latency is a requirement with a number, verified by measurement on the target, like mass and power.
:::

## Check yourself

::: check
A $400\,\mathrm{Hz}$ inner rate loop crosses over at $25\,\mathrm{Hz}$. The control law's worst-case execution time is $0.9\,\mathrm{ms}$ and the output is written as soon as it is ready. What phase does the computational delay cost, and what does it cost if the schedule is changed to write at the top of the next frame instead?
:::

::: answer
Write-when-ready: $\tau_c$ is the execution time, up to $0.9\,\mathrm{ms}$. At $25\,\mathrm{Hz}$ the lag is $360^\circ \times 25 \times 0.0009 = 8.1^\circ$ in the worst case, and less when the code runs faster — which is the hidden cost of this scheme, since the lag varies.

Top-of-next-frame: $\tau_c = T = 2.5\,\mathrm{ms}$, giving $360^\circ \times 25 \times 0.0025 = 22.5^\circ$. Nearly three times as much.

At a $25\,\mathrm{Hz}$ crossover in a $400\,\mathrm{Hz}$ loop — sixteen samples per cycle — that difference is worth having. The engineering answer is neither extreme: write from a timer at a fixed offset of, say, $1.2\,\mathrm{ms}$, comfortably above the $0.9\,\mathrm{ms}$ worst case, for a deterministic $10.8^\circ$. You get most of the phase back and keep the determinism.
:::

::: check
A loop has $38^\circ$ of phase margin at a crossover of $3\,\mathrm{Hz}$ and runs at $100\,\mathrm{Hz}$. How many frames of additional latency can it absorb? If integration testing reveals the actual latency is two frames rather than the one assumed, what is the new margin?
:::

::: answer
Delay margin: $\tau_{\text{DM}} = \phi_m/\omega_c = (38 \times \pi/180)/(2\pi \times 3) = 0.6632/18.850 = 35.2\,\mathrm{ms}$, which at $T = 10\,\mathrm{ms}$ is $3.52$ frames.

One extra frame costs $360^\circ \times 3 \times 0.01 = 10.8^\circ$, so the margin falls from $38^\circ$ to $27.2^\circ$. That is still positive and the loop still flies, but $27^\circ$ gives a closed-loop resonant peak near $6.7\,\mathrm{dB}$ and a step response with roughly $45\%$ overshoot, which on a launch vehicle shows up as attitude ringing after every guidance update.

The useful framing for the discussion that follows is the delay-margin number: $3.52$ frames total, one of them already spent, so the software has about two and a half frames of slack and every additional frame costs $10.8^\circ$.
:::

::: check
Why does a computational delay cost phase margin but not gain margin, and why is that worse than it sounds?
:::

::: answer
A pure delay is $e^{-j\omega\tau_c}$, whose magnitude is exactly 1 at every frequency. It therefore cannot change where the loop gain crosses unity — the crossover frequency is unmoved — and it cannot change the gain at any frequency. What it changes is the phase, by $-\omega\tau_c$, growing linearly and without bound.

It is worse than it sounds for two reasons. Gain margin is computed at the frequency where the phase reaches $-180^\circ$, and the delay *moves that frequency down*, so the gain margin does change, indirectly and usually for the worse — the measured gain margin falls even though the delay has no gain. And because the lag grows linearly with frequency, a delay is most harmful exactly where fast loops want to operate. Doubling the crossover frequency of a loop doubles the phase the same delay costs, so delay is the effect that sets the achievable bandwidth once the sample rate is fixed.
:::

::: check
A colleague proposes eliminating computational delay entirely by reading the sensor, computing, and writing the actuator in a tight polling loop with no timer, running as fast as the processor allows. What is wrong with this?
:::

::: answer
Several things, and the phase is the least of them.

The loop period is now data-dependent: it varies with cache state, with interrupt activity from other subsystems, with any branch in the control law. Both the sample period $T$ and the delay $\tau_c$ vary from iteration to iteration. Every result in this module assumes a fixed $T$ — the z-transform, the discretization coefficients, the pole locations, the margins — and none of them applies to a loop whose period wanders. The controller's own coefficients were computed for one $T$ and are now wrong by whatever the period drifts.

It also makes the system unverifiable. There is no worst-case execution time to bound, no frame boundary to measure overruns against, no deterministic schedule for other tasks to share the processor with, and no way to reproduce a failure, since the timing is different on every run.

The right answer is the opposite: a hardware-timed frame, a measured worst-case execution time comfortably inside it, and a fixed actuation offset. Determinism is what makes the analysis in this module true of the flight software, rather than true of a model of it.
:::

::: check
The estimator in a $100\,\mathrm{Hz}$ navigation loop propagates its state forward by one frame before the control law uses it, to compensate the computational delay. Under what circumstances does this work, and under what circumstances does it make things worse?
:::

::: answer
It works when the propagation model is accurate over the $10\,\mathrm{ms}$ horizon and the delay being compensated is fixed. For rigid-body attitude, propagating a rate estimate forward $10\,\mathrm{ms}$ is a small, well-modelled extrapolation, and the phase recovered is real.

It makes things worse in three cases. If the delay is not fixed, the compensation is right on average and wrong every frame, and the error it injects is a time-varying signal in the loop — you have converted a delay into noise. If the model omits dynamics that are fast on a $10\,\mathrm{ms}$ scale, propagation extrapolates along the wrong trajectory: a $47\,\mathrm{Hz}$ bending mode moves through most of a cycle in $10\,\mathrm{ms}$, so a rigid-body propagator applied to a signal containing that mode amplifies the modal content with the wrong phase. And if the estimate is noisy, propagation amplifies the noise, because extrapolating forward multiplies rate errors by the horizon.

The practical rule is to predict with the model you trust over the horizon you are predicting across, and to compensate only the deterministic part of the delay. Compensating a delay you have not bounded is guessing.
:::

## Summary

| Item | Statement |
| --- | --- |
| Computational delay | $\tau_c$, from the sampling instant to the actuation instant |
| In the model | $e^{-s\tau_c}$; $z^{-d}$ when $\tau_c = dT$; an explicit $e^{-j\omega mT}$ factor for a fractional delay |
| Phase cost | $-\omega\tau_c = -360^\circ f\tau_c$; a full frame costs twice the zero-order hold |
| Rule of thumb | Hold plus one frame of computation costs $3 \times 180^\circ f_c/f_s$ at crossover |
| Write when ready | $\tau_c = \tau_{\text{exec}}$: smallest, but varies frame to frame — jitter |
| Write at a fixed offset | $\tau_c$ constant and analysable; choose the offset from measured worst-case execution time |
| Top of next frame | $\tau_c = T$ exactly, one factor of $z^{-1}$; the conservative default |
| Delay margin | $\tau_{\text{DM}} = \phi_m/\omega_c$, or $d_{\text{DM}} = \phi_m/(\omega_c T)$ frames; a linear time-invariant quantity only |
| Remedies | Shorten the measurement-dependent path; fix the actuation instant; predict through a known delay; design against a model containing $z^{-d}$ |
| Not a remedy | Absorbing it into uncertainty margin — latency is measurable and belongs in a requirement |

You now have all three contributors to the digital phase budget: the anti-alias filter, the zero-order hold and the computational delay. The next lesson spends that budget, turning it into the rule that sets a sample rate from a bandwidth requirement, and examines what limits the rate from above.
