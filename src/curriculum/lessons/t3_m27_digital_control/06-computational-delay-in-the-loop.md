---
id: l06-computational-delay
title: Computational delay and where it shows up in the loop
minutes: 21
covers:
  - Computational delay and where it shows up in the loop
---

Think of a conversation over a bad video call. You ask a question, and the answer arrives half a second later. Nothing is wrong with the answer — it is only late. But try to have a fast back-and-forth, and you keep talking over each other. A control loop with a delay in it has the same problem.

None of the discretization methods of the previous lesson knows that a computer takes time. Every one of them gives a difference equation with a $b_0$ term — this frame's output depending on this frame's input. That quietly assumes the flight computer reads the gyro and moves the gimbal at the same instant. It does not. Between the sampling instant and the moment the new command reaches the actuator there is a gap, and on a well-instrumented vehicle you can measure it to the microsecond.

That gap is the **computational delay**, written $\tau_c$ ("tau sub c"). It is pure phase lag in series with the plant, inside the loop. At a typical crossover it costs about as much as the zero-order hold and the anti-alias filter put together. Unlike those two, though, where it lands is a *design decision*. The same control law, processor and sample rate can give anything from a fifth of a frame to a full frame of delay, depending on how the task is scheduled and how the code is ordered. This lesson lays out the frame timeline, shows where each piece enters, builds the phase budget the sample-rate lesson will use, and works through the four things you can actually do about it.

## The frame timeline

A fixed-step control task does this once per frame (one frame is one sample period, $T$):

1. A hardware timer fires. The **[[interrupt|interrupt]] latency** — the time from the timer edge to the first instruction of the handler — is a few microseconds on bare metal, and can be tens of microseconds under an operating system.
2. The sensor sample is taken, or a value already captured by a converter is read. The instant that matters is when the physical quantity was *measured*. For a **[[sigma-delta converter|sigma-delta]]** with a built-in smoothing filter, that is some tens of its internal samples earlier, given as a group delay in the datasheet.
3. The control law runs: filters, the PID, limiters, mixing to actuators. This takes $\tau_{\text{exec}}$, which changes from frame to frame with branch outcomes, cache state and which mode the vehicle is in.
4. The command is written to the digital-to-analog converter or onto the actuator bus. From that instant the zero-order hold keeps it for a frame.

The **actuation delay** is the time from step 2 to step 4. Everything before step 2 — the sensor's own delay and the anti-alias filter — is separate. Everything after step 4 is the hold. All three sit in series in the loop, and at crossover all three are pure phase lag.

The choice that matters is the timing of step 4. There are two schools, shown on the **[[frame timeline|frame-timeline]]**.

**Output when ready.** Write the command as soon as the control law finishes. The delay is then $\tau_{\text{exec}}$, as small as it can be — but not constant. A control law whose run time ranges from $0.8$ to $1.2\,\mathrm{ms}$ gives a delay that ranges over the same $0.4\,\mathrm{ms}$. A delay that varies is **jitter**, a different and worse problem that the last lesson of this module takes up.

**Output at a fixed instant.** Write the command from a second timer interrupt at a fixed offset after the sample, chosen longer than the **[[worst-case execution time|wcet]]**. The delay is then exactly that offset, every frame. The common, most cautious version sets the offset to one full frame: the value computed from $y[n]$ is written at the start of frame $n+1$. That is a delay of exactly $T$, one factor of $z^{-1}$. Most flight software does this, because it is easy to analyze and easy to verify.

::: key
**Computational delay.** The time $\tau_c$ from the sampling instant to the actuation instant. It contributes phase lag $-\omega\tau_c$, that is $-360^\circ f \tau_c$, in series with the plant. A full-frame delay, $\tau_c = T$, is one factor of $z^{-1}$ and costs $-360^\circ f/f_s$ — twice the zero-order hold's $-180^\circ f/f_s$. Bound it by design. The rule of thumb: the zero-order hold plus one sample of computational delay costs $3 \times 180^\circ f_c/f_s$ at crossover.
:::

## Putting it in the model

In the $s$ domain a delay is $e^{-s\tau_c}$. Its size is 1 at every frequency, and its **[[phase lag grows in a straight line|delay-phase]]** with frequency, $-\omega\tau_c$. In the $z$ domain, when the delay is a whole number of samples, $\tau_c = dT$, it is $z^{-d}$: append $d$ zeros to the end of the denominator coefficient list, and nothing else changes.

A fractional delay, $\tau_c = mT$ with $0 < m < 1$, cannot be written as a power of $z$. There are two honest ways to handle it.

- The rigorous one is the **[[modified z-transform|modified-z]]**, which computes the ZOH equivalent of the plant with a shifted sampling instant and produces an extra zero.
- The practical one, good enough for margins, is to analyze the loop in the frequency domain with an explicit factor $e^{-j\omega mT}$ next to the discrete transfer functions. The frequency response is what you read margins from, and multiplying it by a complex exponential is exact.

The one thing you may *not* do is leave it out because it is not a whole sample. A third of a frame at $100\,\mathrm{Hz}$ is $3.3\,\mathrm{ms}$, which at a $5\,\mathrm{Hz}$ crossover is $360^\circ \times 5 \times 0.0033 = 6^\circ$.

::: example The phase budget of a 200 Hz thrust-vector-control loop
A launch vehicle's pitch loop runs at $f_s = 200\,\mathrm{Hz}$ and crosses over at $f_c = 5\,\mathrm{Hz}$. Four effects sit between the vehicle's true attitude rate and the gimbal command. At $5\,\mathrm{Hz}$ each one behaves like a delay.

- The rate gyro's internal smoothing filter has a group delay of $1.50\,\mathrm{ms}$, from the datasheet.
- The analog anti-alias filter is a second-order Butterworth with a $60\,\mathrm{Hz}$ corner. Its **[[group delay|group-delay]]** at low frequency is $2\zeta/\omega_c = 1.4142/376.99 = 3.75\,\mathrm{ms}$. Its exact phase at $5\,\mathrm{Hz}$ is $6.77^\circ$, against $6.75^\circ$ from the delay model — close enough to treat it as a delay.
- The zero-order hold adds $T/2 = 2.50\,\mathrm{ms}$.
- The control task writes its output at the top of the next frame, so the computational delay is one full frame, $5.00\,\mathrm{ms}$.

Each delay $\tau$ costs $\omega\tau$ radians at crossover. Add them up:

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

Twelve and three quarter milliseconds: $22.95^\circ$ at crossover. The **[[whole budget as one bar|phase-budget]]** makes the ranking plain. A continuous design with $50^\circ$ of phase margin flies with about $27^\circ$. That is acceptable, but it is not what the design review approved unless the review knew.

Look at the ranking. The biggest item is the computational delay, and it is the only one that is a scheduling choice rather than a physical property. Cutting it to a fixed $2\,\mathrm{ms}$ offset — possible if the worst-case execution time is measured at $1.2\,\mathrm{ms}$ — saves $3\,\mathrm{ms}$, which is $360^\circ \times 5 \times 0.003 = 5.4^\circ$. Doubling the sample rate to $400\,\mathrm{Hz}$ would save $6.75^\circ$ (the hold and the one-frame delay both halve), so the schedule change buys most of that, at no CPU cost.
:::

## Delay margin: how much you have left

The classical control module defined the **[[delay margin|delay-margin]]**: the extra delay that drives the phase margin to zero,

$$
\tau_{\text{DM}} = \frac{\phi_m}{\omega_c},
$$

with the phase margin $\phi_m$ ("phi sub m") in radians and the crossover $\omega_c$ in $\mathrm{rad/s}$. The reason: a delay $\tau$ costs $\omega_c\tau$ of phase at crossover, and that uses up the whole margin when $\omega_c\tau = \phi_m$. In a sampled loop it is handier counted in samples,

$$
d_{\text{DM}} = \frac{\phi_m}{\omega_c T} = \frac{\phi_m\,f_s}{\omega_c},
$$

because that is the number you compare against the schedule. A loop with $45^\circ$ of margin ($0.7854\,\mathrm{rad}$) at $\omega_c = 6.2832\,\mathrm{rad/s}$ tolerates $0.7854/6.2832 = 125\,\mathrm{ms}$ of extra delay. At $50\,\mathrm{Hz}$ that is $6.25$ samples.

Two cautions. First, the delay margin comes from the margin you have *left*, so it shrinks as you spend it. In the example below, the same loop has $5.75$ samples of delay margin after the hold is counted, and $4.75$ after one sample of computational delay. Second, delay margin is a linear time-invariant idea — it assumes the delay is fixed. A *varying* delay is not covered by it at all. A loop with three samples of delay margin, running with a delay that wanders between one and two samples, is not "using two thirds of its margin" in any useful sense. That is the jitter argument of the last lesson.

::: example One sample of delay, measured exactly
Take the attitude loop of the zero-order-hold lesson, now with a filtered derivative so it discretizes cleanly: $J = 500\,\mathrm{kg\,m^2}$, $P(s) = 1/(Js^2)$, and

$$
C(s) = k_p + k_d\,\frac{\omega_f\,s}{s + \omega_f},
\qquad \omega_f = 2\pi \cdot 20 = 125.66\,\mathrm{rad/s},
$$

with $k_p = 13{,}260$ and $k_d = 2{,}227$ chosen so the continuous loop crosses over at $\omega_c = 6.2832\,\mathrm{rad/s}$ with exactly $45.00^\circ$ of phase margin.

Now build the discrete loop honestly, using the previous lesson's advice:

1. Discretize the plant with ZOH equivalence, so the hold is in the model once, correctly.
2. Discretize the controller with Tustin prewarped at $\omega_c$, so its response is exact where the margin is read.
3. Compute the margin from the discrete open loop $L(z)$, with and without an extra $z^{-1}$ for a full-frame computational delay.

| $f_s$ | $f_s/f_c$ | Hold only | With one sample of delay | Cost of the delay |
| --- | --- | --- | --- | --- |
| $200\,\mathrm{Hz}$ | 200 | $44.10^\circ$ | $42.30^\circ$ | $1.80^\circ$ |
| $100\,\mathrm{Hz}$ | 100 | $43.20^\circ$ | $39.60^\circ$ | $3.60^\circ$ |
| $50\,\mathrm{Hz}$ | 50 | $41.39^\circ$ | $34.19^\circ$ | $7.20^\circ$ |
| $25\,\mathrm{Hz}$ | 25 | $37.77^\circ$ | $23.39^\circ$ | $14.37^\circ$ |

Every entry in the last column is $360^\circ f_c/f_s$ to three digits — the delay formula with $\tau_c = T$ and nothing else. At $50\,\mathrm{Hz}$, for example, $360^\circ \times 1/50 = 7.2^\circ$. The exact $z$-domain computation and the back-of-the-envelope agree. You do not need the discrete machinery to predict this; you need it to confirm that nothing else is going on.

Read the rows as a design statement. At $50\,\mathrm{Hz}$ — fifty samples per cycle at crossover, which sounds generous — a design with $45^\circ$ of continuous margin flies with $34^\circ$. At $25\,\mathrm{Hz}$ it flies with $23^\circ$, which gives a closed-loop resonant peak of about $8\,\mathrm{dB}$ and visible overshoot. Not a single gain was changed.

The delay margin left at $50\,\mathrm{Hz}$ is $\phi_m/(\omega_c T) = 0.5967/(6.2803 \times 0.02) = 4.75$ samples. (The discrete crossover has moved very slightly, to $6.2803\,\mathrm{rad/s}$.) That is the number to hand the software team: the loop can take about four and three quarter more frames of latency before it is on the edge of instability, so a scheduling change that adds two frames eats nearly half of what remains.
:::

## What to do about it

**Shorten the critical path.** Only the part of the control law that depends on the new measurement has to run between the sample and the actuation. Everything else — gain-schedule lookups, limit calculations, telemetry packing, the parts of a filter that depend only on stored state — can run in the *previous* frame. Splitting a control law into a long "prepare" stage and a short "apply" stage is a standard flight-software pattern. On a loop whose full run takes $1.2\,\mathrm{ms}$, the measurement-dependent path can often be cut below $200\,\mathrm{\mu s}$. This is the cheapest phase you will ever buy.

**Fix the actuation instant.** Whatever the run time, write the output from a hardware timer at a constant offset. The delay becomes fixed, so it can be analyzed, and the jitter disappears. Choose the offset as the measured worst-case execution time plus margin, not a full frame out of habit.

**Predict.** If the controller is built on a state estimator, push the estimate forward by $\tau_c$ using the model before computing the command. Then the command is based on where the vehicle *will be* when the command lands, not where it was when the sample was taken. This is routine in estimator-based GNC, and it trades delay for model error: the prediction is only as good as the model over $\tau_c$. For $5\,\mathrm{ms}$ of rigid-body motion that is very good. For $5\,\mathrm{ms}$ of a structural mode it is not. Predicting through a known, fixed delay is sound. Predicting through jitter is not, because there is nothing fixed to predict. This idea has a long history as the **[[Smith predictor|smith-predictor]]**.

**Design for it.** Put $z^{-d}$ in the model from the start, tune against the discrete loop, and let the design absorb the delay instead of treating it as an error afterward. A controller designed against a model that includes its own delay is a different controller — typically a little less derivative action and a little more lead placed lower — and it is the right one.

::: warning Latency is a requirement, not slop
Do not treat computational delay as an uncertainty to be covered by margin. It is a known, measurable, repeatable property of the software. Treating it as slop wastes margin you need for things that really are uncertain: modal frequencies, aerodynamic coefficients, actuator nonlinearity.

Here is the failure this prevents. A loop is analyzed with $45^\circ$ of phase margin against an uncertainty budget that says $30^\circ$ is enough. Separately, during integration, the schedule grows from one frame of latency to three, because a new sensor was added to the same task. Nobody recomputes the margin, because latency was never a line item. At $50\,\mathrm{Hz}$ and a $1\,\mathrm{Hz}$ crossover, those two extra frames cost $2 \times 360^\circ \times 1/50 = 14.4^\circ$, and it comes out of the uncertainty budget, not out of some reserve. Latency is a requirement with a number, verified by measurement on the target, like mass and power.
:::

## Check yourself

::: check
A $400\,\mathrm{Hz}$ inner rate loop crosses over at $25\,\mathrm{Hz}$. The control law's worst-case execution time is $0.9\,\mathrm{ms}$, and the output is written as soon as it is ready. What phase does the computational delay cost? What does it cost if the schedule is changed to write at the top of the next frame?
:::

::: answer
Write when ready: $\tau_c$ is the run time, up to $0.9\,\mathrm{ms}$. At $25\,\mathrm{Hz}$ the lag is $360^\circ \times 25 \times 0.0009 = 8.1^\circ$ in the worst case, and less when the code runs faster. That variation is the hidden cost of this scheme.

Top of next frame: $\tau_c = T = 2.5\,\mathrm{ms}$, so $360^\circ \times 25 \times 0.0025 = 22.5^\circ$ — nearly three times as much.

At a $25\,\mathrm{Hz}$ crossover in a $400\,\mathrm{Hz}$ loop (sixteen samples per cycle), that difference is worth having. The engineering answer is neither extreme: write from a timer at a fixed offset of, say, $1.2\,\mathrm{ms}$, comfortably above the $0.9\,\mathrm{ms}$ worst case. That gives a fixed $360^\circ \times 25 \times 0.0012 = 10.8^\circ$. You get most of the phase back and keep the determinism.
:::

::: check
A loop has $38^\circ$ of phase margin at a crossover of $3\,\mathrm{Hz}$ and runs at $100\,\mathrm{Hz}$. How many frames of extra latency can it absorb? If integration testing shows the real latency is two frames instead of the one assumed, what is the new margin?
:::

::: answer
Delay margin: $\tau_{\text{DM}} = \phi_m/\omega_c = (38 \times \pi/180)/(2\pi \times 3) = 0.6632/18.850 = 35.2\,\mathrm{ms}$. At $T = 10\,\mathrm{ms}$ that is $3.52$ frames.

One extra frame costs $360^\circ \times 3 \times 0.01 = 10.8^\circ$, so the margin falls from $38^\circ$ to $27.2^\circ$. That is still positive, and the loop still flies. But $27^\circ$ means a closed-loop resonant peak near $6.6\,\mathrm{dB}$ and a step response with roughly $45\%$ overshoot. On a launch vehicle that shows up as attitude ringing after every guidance update.

The useful way to frame the discussion that follows is the delay-margin number: $3.52$ frames in total, one of them now spent, so the software has about two and a half frames of slack left, and every extra frame costs $10.8^\circ$.
:::

::: check
Why does a computational delay cost phase margin but not gain margin, and why is that worse than it sounds?
:::

::: answer
A pure delay is $e^{-j\omega\tau_c}$, whose size is exactly 1 at every frequency. So it cannot change where the loop gain crosses 1 — the crossover frequency stays put — and it cannot change the gain at any frequency. What it changes is the phase, by $-\omega\tau_c$, growing in a straight line without limit.

It is worse than it sounds for two reasons. Gain margin is measured at the frequency where the phase reaches $-180^\circ$, and the delay *moves that frequency down*. So the gain margin does change, indirectly and usually for the worse, even though the delay has no gain of its own. And because the lag grows with frequency, a delay hurts most exactly where fast loops want to work. Double a loop's crossover frequency and the same delay costs twice the phase. That is why, once the sample rate is fixed, delay is what sets the bandwidth you can reach.
:::

::: check
A colleague proposes getting rid of computational delay entirely: read the sensor, compute and write the actuator in a tight loop with no timer, running as fast as the processor allows. What is wrong with this?
:::

::: answer
Several things, and the phase is the least of them.

The loop period now depends on the data. It varies with cache state, with interrupts from other subsystems, with every branch in the control law. So both the sample period $T$ and the delay $\tau_c$ change from one pass to the next. Every result in this module assumes a fixed $T$ — the z-transform, the discretization coefficients, the pole locations, the margins — and none of them applies to a loop whose period wanders. The controller's own coefficients were computed for one $T$ and are now wrong by however much the period drifts.

It also makes the system impossible to verify. There is no worst-case execution time to bound, no frame boundary to measure overruns against, no fixed schedule for other tasks to share the processor with, and no way to reproduce a failure, since the timing is different on every run.

The right answer is the opposite: a hardware-timed frame, a measured worst-case execution time comfortably inside it, and a fixed actuation offset. Determinism is what makes the analysis in this module true of the flight software, not only true of a model of it.
:::

::: check
The estimator in a $100\,\mathrm{Hz}$ navigation loop pushes its state forward by one frame before the control law uses it, to make up for the computational delay. When does this work, and when does it make things worse?
:::

::: answer
It works when the prediction model is accurate over the $10\,\mathrm{ms}$ horizon and the delay being made up is fixed. For rigid-body attitude, pushing a rate estimate forward $10\,\mathrm{ms}$ is a small, well-modeled extrapolation, and the phase recovered is real.

It makes things worse in three cases.

- **The delay is not fixed.** Then the correction is right on average and wrong every frame. The error it injects is a time-varying signal in the loop: you have turned a delay into noise.
- **The model leaves out fast dynamics.** Prediction then extrapolates along the wrong path. A $47\,\mathrm{Hz}$ bending mode goes through about half a cycle in $10\,\mathrm{ms}$ (its period is $21\,\mathrm{ms}$), so a rigid-body predictor applied to a signal containing that mode passes the modal content through with the wrong phase and a larger size.
- **The estimate is noisy.** Prediction amplifies the noise, because extrapolating forward multiplies rate errors by the horizon.

The practical rule: predict with a model you trust over the horizon you are predicting across, and make up only the fixed part of the delay. Making up a delay you have not bounded is guessing.
:::

## Summary

| Item | Statement |
| --- | --- |
| Computational delay | $\tau_c$, from the sampling instant to the actuation instant |
| In the model | $e^{-s\tau_c}$; $z^{-d}$ when $\tau_c = dT$; an explicit $e^{-j\omega mT}$ factor for a fractional delay |
| Phase cost | $-\omega\tau_c = -360^\circ f\tau_c$; a full frame costs twice the zero-order hold |
| Rule of thumb | Hold plus one frame of computation costs $3 \times 180^\circ f_c/f_s$ at crossover |
| Write when ready | $\tau_c = \tau_{\text{exec}}$: smallest, but varies frame to frame — jitter |
| Write at a fixed offset | $\tau_c$ constant and analyzable; choose the offset from the measured worst-case execution time |
| Top of next frame | $\tau_c = T$ exactly, one factor of $z^{-1}$; the cautious default |
| Delay margin | $\tau_{\text{DM}} = \phi_m/\omega_c$, or $d_{\text{DM}} = \phi_m/(\omega_c T)$ frames; valid for a fixed delay only |
| Remedies | Shorten the measurement-dependent path; fix the actuation instant; predict through a known delay; design against a model containing $z^{-d}$ |
| Not a remedy | Absorbing it into uncertainty margin — latency is measurable and belongs in a requirement |

You now have all three pieces of the digital phase budget: the anti-alias filter, the zero-order hold and the computational delay. The next lesson spends that budget, turning it into the rule that sets a sample rate from a bandwidth requirement, and looks at what limits the rate from above.

::: context interrupt A tap on the shoulder
An interrupt is a hardware signal that makes the processor stop whatever it is doing and jump to a specific piece of code, the handler. A timer interrupt is how a flight computer keeps a steady beat: a clock chip taps the processor's shoulder every $5\,\mathrm{ms}$, and the control task starts.

The processor cannot always respond at once. It may be finishing an instruction or have interrupts briefly switched off, and an operating system adds its own bookkeeping. That wait is the interrupt latency, and it is one small slice of the delay budget.
:::

::: context sigma-delta Converters with a built-in filter
Many modern sensors digitize with a sigma-delta converter. It samples very fast with very coarse steps, then averages many of those samples with a digital filter to get fine, slower readings.

That averaging is a filter, and every filter delays. The datasheet quotes it as a **group delay**, often a millisecond or more. The number your software reads at a given instant describes the world a little while ago, and the control analysis has to count that time too.
:::

::: context frame-timeline One 5 ms frame at 200 Hz
The sample is taken at time zero. The control law runs for about $1.2\,\mathrm{ms}$. Written as soon as it is ready, the command goes out at the end of that bar, at a time that varies. From a fixed-offset timer it goes out at exactly $2\,\mathrm{ms}$. The cautious default waits for the top of the next frame at $5\,\mathrm{ms}$ — a full $z^{-1}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="35" y1="90" x2="345" y2="90" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="35" y1="40" x2="35" y2="96" stroke="#1f2a44" stroke-width="2"/>
  <line x1="310" y1="40" x2="310" y2="96" stroke="#1f2a44" stroke-width="2"/>
  <rect x="35" y="70" width="66" height="16" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1"/>
  <text x="68" y="64" font-size="11" fill="#1d6fd1" text-anchor="middle">compute</text>
  <line x1="145" y1="50" x2="145" y2="90" stroke="#f2b880" stroke-width="3"/>
  <line x1="310" y1="50" x2="310" y2="90" stroke="#b4232c" stroke-width="3"/>
  <text x="145" y="44" font-size="11" fill="#1f2a44" text-anchor="middle">fixed offset</text>
  <text x="300" y="34" font-size="11" fill="#b4232c" text-anchor="end">next frame</text>
  <text x="35" y="34" font-size="11" fill="#1f2a44" text-anchor="middle">sample</text>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="35" y="108">0</text><text x="101" y="108">1.2</text><text x="145" y="108">2</text><text x="310" y="108">5 ms</text>
  </g>
  <text x="190" y="136" font-size="11" fill="#1f2a44" text-anchor="middle">time since the sample (ms)</text>
</svg>
```
:::

::: context wcet Measuring the worst case
The worst-case execution time is the longest the control code can ever take, over every path, input and processor state. Flight projects estimate it two ways: by measuring millions of runs on the real hardware under stress, and by static analysis tools that bound every path through the code. Then they add margin.

The average run time is not enough. Slow runs come from cache misses and bursts of interrupts, which tend to arrive at the busiest moments. The multi-rate lesson returns to what happens when a frame overruns anyway.
:::

::: context delay-phase A straight line that never stops
A delay does not weaken any frequency; it only shifts each one in time. Shifting a slow wave by $5\,\mathrm{ms}$ barely moves it through its cycle. Shifting a fast wave by the same $5\,\mathrm{ms}$ moves it much further. So the phase lag is proportional to frequency.

The lines show one frame of delay at two sample rates. At $200\,\mathrm{Hz}$ ($5\,\mathrm{ms}$) the lag is $18^\circ$ at $10\,\mathrm{Hz}$; at $50\,\mathrm{Hz}$ ($20\,\mathrm{ms}$) it is $72^\circ$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="170" x2="335" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="170" x2="50" y2="25" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="170" x2="330" y2="138.5" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="50" y1="170" x2="330" y2="44" stroke="#b4232c" stroke-width="2.5"/>
  <text x="326" y="130" font-size="11" fill="#1d6fd1" text-anchor="end">5 ms: 18° at 10 Hz</text>
  <text x="326" y="38" font-size="11" fill="#b4232c" text-anchor="end">20 ms: 72° at 10 Hz</text>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="184">0</text><text x="190" y="184">5</text><text x="330" y="184">10 Hz</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="45" y="174">0°</text><text x="45" y="104">40°</text><text x="45" y="34">80°</text>
  </g>
  <text x="190" y="198" font-size="11" fill="#1f2a44" text-anchor="middle">frequency</text>
</svg>
```
:::

::: context modified-z Sampling a little off the beat
The ordinary z-transform looks at a signal exactly at $t = nT$. The modified z-transform looks at $t = nT + \Delta$ instead, for some fraction of a frame $\Delta$. Shifting where you look is the same as the plant's response arriving a fraction of a frame late, so it captures a fractional delay exactly.

The result is still a ratio of polynomials in $z$, with the delay showing up as an extra zero whose position depends on the fraction. Textbooks on sampled-data control, such as Franklin, Powell and Workman, cover it in detail.
:::

::: context group-delay Why a smooth filter acts like a delay
At low frequency, a smooth low-pass filter mostly holds the signal back in time. A second-order Butterworth, $\omega_c^2/(s^2 + 2\zeta\omega_c s + \omega_c^2)$ with $\zeta = 0.707$, has phase $-\arctan\!\big(2\zeta(\omega/\omega_c)/(1 - (\omega/\omega_c)^2)\big)$. For $\omega$ far below $\omega_c$ that is about $-2\zeta\omega/\omega_c$.

A lag that is proportional to $\omega$ is exactly what a delay of $2\zeta/\omega_c$ seconds produces. That time is the **group delay**. It is why a $60\,\mathrm{Hz}$ filter can be counted as $3.75\,\mathrm{ms}$ in a $5\,\mathrm{Hz}$ phase budget.
:::

::: context phase-budget Where the 22.95 degrees go
Each block's width is its phase cost at the $5\,\mathrm{Hz}$ crossover. The red block, one frame of computational delay, is the largest, and it is the only one set by a scheduling choice rather than by hardware.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="40" y="35" width="32.4" height="34" fill="#6c7a93"/>
  <rect x="72.4" y="35" width="81" height="34" fill="#8fb8f0"/>
  <rect x="153.4" y="35" width="54" height="34" fill="#f2b880"/>
  <rect x="207.4" y="35" width="108" height="34" fill="#b4232c"/>
  <rect x="40" y="35" width="275.4" height="34" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" text-anchor="middle" fill="#1f2a44">
    <text x="56.2" y="26">2.70</text><text x="112.9" y="26">6.75</text><text x="180.4" y="26">4.50</text><text x="261.4" y="26">9.00</text>
    <text x="56.2" y="86">gyro</text><text x="112.9" y="86">anti-alias</text><text x="180.4" y="86">hold</text><text x="261.4" y="86">computation</text>
  </g>
  <text x="178" y="104" font-size="11" fill="#1f2a44" text-anchor="middle">total 22.95° at 5 Hz (widths to scale)</text>
</svg>
```
:::

::: context delay-margin Margin measured in time
Phase margin says how many degrees you can lose before the loop goes unstable. Delay margin turns that into seconds, because degrees are hard to budget but milliseconds are what software engineers actually control.

It works because a delay's phase cost at the crossover frequency is exactly $\omega_c\tau$. Set that equal to the phase margin and solve for $\tau$. The result is the latency the loop can survive, as a single number that can go into a requirements document.
:::

::: context smith-predictor Controlling through a known delay
In 1957 the control engineer Otto J. M. Smith proposed a way to control processes with long, known dead times, like chemical plants where a change takes minutes to show at the sensor. His controller runs a model of the plant without the delay alongside the real loop, and uses the model to act on what the output will be rather than what it was.

State prediction in a flight estimator is the same idea at millisecond scale. Like Smith's scheme, it is only as good as the model, and only for a delay that is known and fixed.
:::
