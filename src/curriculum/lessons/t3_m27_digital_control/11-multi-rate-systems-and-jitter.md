---
id: l11-multi-rate-and-jitter
title: Multi-rate systems and jitter
minutes: 23
covers:
  - Multi-rate systems, jitter, and their effect on stability
---

Every result in this module so far has assumed one loop, one sample rate, and frames that start exactly when the schedule says. Real flight software has none of those properties. A launch vehicle's computer runs a rate loop at $400\,\mathrm{Hz}$, an attitude loop at $50\,\mathrm{Hz}$, navigation at $100\,\mathrm{Hz}$, guidance at $2\,\mathrm{Hz}$, fault detection somewhere between, and telemetry in whatever is left. They exchange data across frame boundaries, share a processor, and start late.

Two distinct things follow. **Multi-rate structure** is deliberate: it gives the fast dynamics the rate they need without charging every other task for it, and its cost is extra latency at each rate transition, which you can compute. **Jitter** is not deliberate: it is variation in when things actually happen, and its cost is that the linear time-invariant analysis your margins came from stops being exactly true.

The remedies are opposite. Multi-rate latency is a fixed, known delay, so you model it and design around it. Jitter is a time-varying delay, so you cannot model it as a delay at all — you bound it, and check that the bound fits inside the robustness the loop already has. This lesson does both, and ends with what happens when a frame does not fit at all.

## Rate groups

Flight software is organised into **rate groups**: sets of tasks that run at the same frequency, dispatched from one timer, with the slower rates as exact integer submultiples of the fastest. A $400\,\mathrm{Hz}$ base rate with groups at $400$, $200$, $100$, $50$, $20$ and $10\,\mathrm{Hz}$ is typical; every group's period is an integer number of base frames, every group's start instant is a known offset from a base frame boundary, and the whole schedule repeats on a **major frame** whose length is the least common multiple of the periods.

Making the ratios integers and the phases fixed is not an aesthetic preference. It is what turns the rate transitions into constant delays rather than varying ones, which is the difference between something you can put in a model and something you can only bound.

The allocation is the sample-rate lesson applied to each loop separately: the inner rate loop is fast because its crossover is high, the outer attitude loop is slower because its crossover is lower, and guidance is slowest because trajectory corrections happen on the scale of seconds.

## What a rate transition costs

Data crossing from one group to another picks up latency, and which kind depends on the direction.

**Slow to fast** — an outer loop's command consumed by an inner loop — is a zero-order hold at the *slow* rate. The inner loop sees a staircase that changes once per slow frame, so the outer loop carries a hold with $T_{\text{slow}}/2$ of lag. This is the outer loop's hold: there is no separate converter in the path, and counting both would be the double-counting error of the zero-order-hold lesson.

**Fast to slow** — a fast measurement decimated for a slow loop — is a decimation, and it needs an anti-alias filter in the digital domain before the rate is reduced, for exactly the reasons of the first lesson. Content between the slow loop's Nyquist frequency and the fast rate's folds when you throw samples away. A decimation filter's group delay then sits in the slow loop.

**Skew** is the offset between when the producer writes and when the consumer reads. With a fixed phase relationship it is a constant, and it adds to the delay budget like any other constant. Without one — two tasks dispatched from unrelated timers, or a task whose start slides with system load — the data age varies from frame to frame, and that is jitter rather than delay.

The unpleasant case is a non-integer rate ratio, which produces a varying age even when everything is perfectly periodic.

::: example A 100 Hz sensor read by a 150 Hz task
The sensor latches a new value every $10\,\mathrm{ms}$. The control task samples every $6.667\,\mathrm{ms}$. Both are perfectly regular, and both clocks are perfect. Tabulate the age of the value the task reads:

| Task frame $n$ | Sample instant | Newest sensor value | Age |
| --- | --- | --- | --- |
| 0 | $0.000\,\mathrm{ms}$ | $0\,\mathrm{ms}$ | $0.000\,\mathrm{ms}$ |
| 1 | $6.667\,\mathrm{ms}$ | $0\,\mathrm{ms}$ | $6.667\,\mathrm{ms}$ |
| 2 | $13.333\,\mathrm{ms}$ | $10\,\mathrm{ms}$ | $3.333\,\mathrm{ms}$ |
| 3 | $20.000\,\mathrm{ms}$ | $20\,\mathrm{ms}$ | $0.000\,\mathrm{ms}$ |

The pattern repeats every three task frames, that is every $20\,\mathrm{ms}$. The measurement delay is not a constant $3.33\,\mathrm{ms}$; it is a square-ish wave between $0$ and $6.67\,\mathrm{ms}$ repeating at $50\,\mathrm{Hz}$.

That is a deterministic, periodic modulation of the loop delay at $50\,\mathrm{Hz}$, and a loop with a periodically varying parameter is not linear time-invariant. It is linear time-*periodic*, which generates sidebands: content at crossover reappears at $\pm 50\,\mathrm{Hz}$ around it. Margins from a Bode plot do not describe it. One frame in three the task also reads a value it has already used, which is its own small $50\,\mathrm{Hz}$ disturbance.

The fix is structural: make the ratio an integer — run the task at $100$ or $200\,\mathrm{Hz}$, or configure the sensor to $150\,\mathrm{Hz}$. If the rates genuinely cannot be harmonised, timestamp every measurement at the source and let the estimator handle the varying age, which is the one case where compensation is both possible and correct.
:::

::: example The delay budget of a 400/50 Hz cascade
An inner rate loop runs at $400\,\mathrm{Hz}$ with a crossover of $8\,\mathrm{Hz}$ and one frame of computational delay, giving $29.2^\circ$ of phase margin. An outer attitude loop runs at $50\,\mathrm{Hz}$ with a crossover of $1\,\mathrm{Hz}$. What does the outer loop actually see?

First, the inner loop. Its closed-loop response $T_{\text{inner}}$ at the outer loop's frequencies:

| Frequency | $\lvert T_{\text{inner}}\rvert$ | Phase |
| --- | --- | --- |
| $1\,\mathrm{Hz}$ | $1.0206$ | $-0.10^\circ$ |
| $2\,\mathrm{Hz}$ | $1.0854$ | $-0.79^\circ$ |
| $4\,\mathrm{Hz}$ | $1.3915$ | $-7.16^\circ$ |

At $1\,\mathrm{Hz}$ the inner loop is unity to within $2\%$ and costs a tenth of a degree — the cascade rule of thumb from the classical control module, confirmed numerically. With an eightfold bandwidth separation the outer design reduces to the kinematic integrator from rate to attitude.

Now the outer loop's own budget at its $1\,\mathrm{Hz}$ crossover:

| Contribution | Phase at $1\,\mathrm{Hz}$ |
| --- | --- |
| Outer zero-order hold, $T_{\text{slow}}/2 = 10\,\mathrm{ms}$ | $3.60^\circ$ |
| Outer computational delay, one $50\,\mathrm{Hz}$ frame | $7.20^\circ$ |
| Inner loop's closed-loop phase | $0.10^\circ$ |
| Fixed skew, half an inner frame | $0.45^\circ$ |
| Total | $11.35^\circ$ |

Eleven and a third degrees, of which the inner loop contributes almost nothing and the outer loop's own discreteness contributes almost everything. That is the payoff of the cascade: the fast loop is fast where it has to be and the slow loop pays only for its own rate.

Shrink the separation and it changes. At a $4\,\mathrm{Hz}$ outer crossover the inner loop contributes $7.16^\circ$ of phase *and* $2.9\,\mathrm{dB}$ of gain rise, so the outer loop must be designed against the inner loop's actual closed-loop response rather than against unity. Three times separation is the usual minimum, and this is why.
:::

## Jitter

**Jitter** is variation in the timing of an event that is supposed to be periodic: interrupt latency that depends on what the processor was doing, cache and DMA contention, a higher-priority task that occasionally runs long, bus arbitration, and a sensor whose oscillator is a different crystal from the flight computer's. Two kinds matter, and they do different damage.

**Sampling jitter** is variation in *when* the measurement is taken. If the sample intended for $t_n$ is actually taken at $t_n + \varepsilon_n$, the value read is

$$
x(t_n + \varepsilon_n) = x(t_n) + \dot{x}(t_n)\,\varepsilon_n + O(\varepsilon_n^2),
$$

so the error is the signal's slope times the timing error — broadband noise whose size grows with frequency and with vibration. For a sinusoid of amplitude $A$ at frequency $\omega$ the root-mean-square slope is $A\omega/\sqrt2$, so

$$
\sigma_{\text{jitter}} = \sigma_\varepsilon \frac{A\omega}{\sqrt2}.
$$

Take $50\,\mathrm{\mu s}$ of root-mean-square sampling jitter, a modest figure under a general-purpose operating system, and a $10\,\mathrm{Hz}$ vibration of amplitude $1^\circ/\mathrm{s}$ on the gyro. Then $\sigma_{\text{jitter}} = 5\times10^{-5} \times 62.83/\sqrt2 = 2.22\times10^{-3}\,{}^\circ/\mathrm{s}$ — almost exactly the $2.64\times10^{-3}\,{}^\circ/\mathrm{s}$ that the $16$-bit converter of the quantization lesson contributes. Timing jitter has doubled the measurement noise, and no amount of converter resolution will help.

**Actuation jitter** is variation in *when* the command is written. That is a time-varying delay, and it is the one that threatens stability.

::: key
**Jitter versus delay.** A fixed delay can be modelled and compensated. Jitter is a time-varying delay: it cannot be compensated, it injects broadband noise, and it invalidates the LTI analysis your margins came from. Bound it, do not correct it.
:::

## How much jitter a loop can take

Delay margin is the wrong tool: it is a linear time-invariant quantity and a varying delay is not a linear time-invariant perturbation. The right tool is the small-gain argument, which does cover time-varying perturbations.

Write the actual delay as the nominal one plus a variation $\Delta\tau(t)$ bounded by $\Delta$. The loop gain becomes $L(j\omega)e^{-j\omega\Delta\tau}$, the nominal loop multiplied by $1 + W$ with

$$
W(j\omega) = e^{-j\omega\Delta\tau} - 1,
\qquad
|W| = \left|2\sin\!\left(\frac{\omega\Delta\tau}{2}\right)\right| \le 2\left|\sin\!\left(\frac{\omega\Delta}{2}\right)\right| .
$$

For a multiplicative perturbation at the plant output, the small-gain condition for robust stability is $|T(j\omega)|\,|W(j\omega)| < 1$ at every frequency, where $T = L/(1+L)$ is the complementary sensitivity from the classical control module. So a sufficient bound on jitter is

$$
\sup_\omega\ |T(j\omega)| \cdot 2\left|\sin\!\left(\frac{\omega\Delta}{2}\right)\right| < 1 .
$$

For small $\omega\Delta$ the sine linearises and this becomes the memorable version,

$$
\Delta < \frac{1}{\displaystyle\sup_\omega\ \omega\,|T(j\omega)|} ,
$$

which says the allowable jitter is set by the peak of the complementary sensitivity weighted by frequency — that is, by how much closed-loop gain the loop still has at high frequency.

::: example A jitter budget for the 400 Hz rate loop
Take the inner loop of the cascade example: $400\,\mathrm{Hz}$, $8\,\mathrm{Hz}$ crossover, one frame of computational delay, $29.2^\circ$ of phase margin.

Its complementary sensitivity peaks at $|T| = 2.175$, that is $6.75\,\mathrm{dB}$, at $7.01\,\mathrm{Hz}$ — a high peak, consistent with the modest phase margin. Solving the condition above numerically gives

$$
\Delta_{\max} = 10.05\,\mathrm{ms} = 4.02 \text{ frames},
$$

and the linearised version gives $10.65\,\mathrm{ms}$, which is close because the binding frequency is well below Nyquist.

Compare that with the delay margin, $\phi_m/\omega_c = 0.5098/50.29 = 10.14\,\mathrm{ms}$. The two are almost the same, as they usually are when the $|T|$ peak sits near crossover. What differs is their meaning: the delay margin says how much *fixed* delay the loop tolerates, the small-gain bound how much the delay may *vary*, frame to frame, arbitrarily.

Four frames sounds generous until you look at where jitter comes from. A general-purpose operating system with a $1\,\mathrm{ms}$ tick delivers several milliseconds of variation under load — most of the budget. A hard real-time executive on bare metal keeps it to tens of microseconds. That factor, not the arithmetic, is why flight software runs on a deterministic executive.
:::

::: warning
Do not compensate jitter by measuring the actual elapsed time and adjusting the controller coefficients each frame. It is an appealing idea and it makes things worse in two ways.

The filter coefficients were computed for the nominal $T$; recomputing them per frame turns a linear time-invariant filter into a time-varying one, whose stability is not implied by the stability of any of the frozen-time versions it passes through. And the recomputation itself has a data-dependent cost, which adds jitter.

There is one exception, and it is the integrator. Accumulating $I \mathrel{+}= k_i\,\Delta t\,e$ with the *measured* $\Delta t$ is correct, because integration of a held value over a measured interval is exactly what the integrator is supposed to do, and the operation is one multiply. Everything else — filters, notches, derivatives — uses the nominal $T$ and treats the deviation as a bounded error.

The real remedy is upstream: a hardware-timed frame, a deterministic executive, a measured worst-case execution time inside the frame, and a fixed actuation instant driven by a timer rather than by the completion of the code.
:::

## Overruns

A frame that does not fit is the limiting case of jitter, and it has two distinct failure modes.

**The task is preempted and finishes late.** The output is written after its intended instant, so the actuation delay for that frame is larger than nominal. That is jitter of exactly the kind above, except that its magnitude is a whole frame or more rather than microseconds, which will exceed the budget of most loops.

**The frame is skipped entirely.** The previous command is held for two frames — a zero-order hold at half the nominal rate, doubling that frame's hold lag — and the integrator, the filters and the derivative all miss an update, so their internal states are now out of step with the real elapsed time. A filter designed for $T$ that skips a sample has effectively been run with a $2T$ gap, which for a notch means its phase at the mode is wrong for the following several frames.

Flight software handles both explicitly rather than hoping.

- **Detect.** The timer interrupt starting frame $n+1$ finds frame $n$ still running, or a completion flag unset — a hardware-level fact rather than an inference.
- **Contain.** Hold the last valid output, or run a degraded path whose execution time is bounded by construction, and never let a late frame's output overwrite a newer one.
- **Count.** An overrun counter in telemetry, per rate group, with the worst-case frame margin downlinked alongside it. What happens once in a hundred thousand frames on the pad happens thousands of times in a flight.
- **Escalate.** A policy for repeats — a mode change, a switch to a redundant string, or a watchdog reset — chosen in the failure-modes analysis rather than in the control task.

The engineering position is that worst-case execution time is bounded by design and verified by measurement on the target, with margin; runtime overrun handling is the last line of defence, not the plan. A schedule that relies on average execution time makes the margins a statistical claim about the processor, and the tail is set by cache misses, interrupt storms and memory contention — all of which correlate with exactly the busy moments when the loop matters most.

## Check yourself

::: check
An outer loop at $25\,\mathrm{Hz}$ commands an inner loop at $250\,\mathrm{Hz}$. The two tasks are dispatched from the same timer with a fixed phase relationship, and the inner loop reads the outer command at the start of its frame. Compute the latency the rate transition adds to the outer loop at its $0.8\,\mathrm{Hz}$ crossover, and say what changes if the tasks come from unrelated timers.
:::

::: answer
With a fixed phase relationship, two constant contributions. The outer command is held for a whole outer frame, contributing the outer loop's zero-order hold, $T_{\text{slow}}/2 = 20\,\mathrm{ms}$, which at $0.8\,\mathrm{Hz}$ is $360 \times 0.8 \times 0.020 = 5.76^\circ$. And the inner loop picks the command up at the next inner frame boundary, an average of half an inner frame, $2\,\mathrm{ms}$, which is $0.58^\circ$. Total $6.34^\circ$, all of it constant and all of it modellable.

With unrelated timers the second term is no longer constant. The pickup offset drifts through the whole $4\,\mathrm{ms}$ inner frame as the two oscillators wander against each other, so the loop carries a delay varying over $4\,\mathrm{ms}$ peak to peak — jitter, not delay. The size is the same; what is lost is the ability to put it in the model. It now has to be covered by the jitter bound, and the drift is slow, so the loop will look fine for minutes at a time and then look different, which is the hardest kind of problem to reproduce.

The fix costs nothing at design time and is close to impossible to retrofit: dispatch every rate group from one timebase.
:::

::: check
A loop has a complementary sensitivity peaking at $4\,\mathrm{dB}$ at $6\,\mathrm{Hz}$ and crossing over at $5\,\mathrm{Hz}$. Estimate the jitter it can tolerate, and compare with the tolerance of an otherwise identical loop whose $|T|$ peaks at $10\,\mathrm{dB}$.
:::

::: answer
$4\,\mathrm{dB}$ is $|T| = 10^{4/20} = 1.585$. Using the linearised bound with the peak at $\omega = 2\pi \times 6 = 37.70\,\mathrm{rad/s}$:

$$
\Delta < \frac{1}{\omega|T|} = \frac{1}{37.70 \times 1.585} = 16.7\,\mathrm{ms}.
$$

This is an estimate rather than the exact figure, because $\sup_\omega \omega|T(j\omega)|$ need not occur at the peak of $|T|$ — the weighting by $\omega$ pushes the worst case higher in frequency, so the true bound is somewhat smaller. It is the right order.

At $10\,\mathrm{dB}$, $|T| = 3.162$ and the bound becomes $1/(37.70 \times 3.162) = 8.4\,\mathrm{ms}$: half as much. The lesson generalises — a peaky closed loop, which is the same thing as a small phase margin or a small modulus margin, is intolerant of timing variation as well as of everything else. The modulus margin from the classical control module and the jitter budget are two readings of the same number.
:::

::: check
Why does sampling jitter hurt more on a vehicle with high-frequency vibration, and what can be done about it?
:::

::: answer
The error from a timing offset $\varepsilon$ is $\dot{x}\,\varepsilon$ — the signal's slope times the offset. A signal with a $10\,\mathrm{Hz}$ vibration component of amplitude $A$ has slope up to $A\omega = 62.8A$; at $100\,\mathrm{Hz}$ the same amplitude gives ten times the slope, and therefore ten times the error from the same jitter. Jitter converts vibration into measurement noise, with a conversion factor proportional to frequency.

Three things help, in order of effectiveness. Reduce the jitter itself: latch the sample in hardware, triggered by a timer, rather than in software at the top of the task — the converter's sample-and-hold then fires at a deterministic instant regardless of what the processor is doing, and the software reads a value acquired earlier. This is the standard arrangement and it removes sampling jitter almost entirely.

Second, filter the vibration before it reaches the sampler, which is the anti-alias filter of the first lesson doing a second job: content it removes cannot be converted into jitter noise either.

Third, accept it and account for it as measurement noise in the estimator, with the variance computed as above. That is honest but it is the weakest of the three, because the noise it adds is proportional to the vibration environment, which is the thing you know least accurately.
:::

::: check
A $100\,\mathrm{Hz}$ control task occasionally exceeds its $10\,\mathrm{ms}$ budget. List the failure modes and the handling a flight-software design should have in place.
:::

::: answer
Two failure modes, with different signatures.

**Late output.** The task is preempted or runs long, and the command is written after its intended instant. The actuation delay that frame is larger than nominal by the overrun, which is a time-varying delay: it eats phase margin, it cannot be compensated, and it injects jitter noise. If the overrun is a full frame or more, it is well outside the jitter budget of most loops.

**Dropped frame.** The frame is abandoned. The previous command is held, so the zero-order hold acts at half the nominal rate for that interval and its lag doubles. The integrator misses an update, the filters miss a sample, and every filter state is now out of step with elapsed time.

The handling has four parts. **Detect** the overrun at the hardware level, from the timer that starts the next frame finding the previous one incomplete. **Contain** it deterministically: hold the last valid output, or run a degraded path whose execution time is bounded by construction, and never let a late frame's output overwrite a newer one. **Count** it, with a per-rate-group overrun counter and the worst-case frame margin in telemetry, because an event that is rare on the pad is common over a flight. **Escalate** on repeats, according to a policy written in the failure-modes analysis — a mode change, a switch to a redundant string, or a watchdog reset.

Underneath all of it: the worst-case execution time is bounded by design and verified by measurement on the target, with margin. The runtime handling is the last line of defence, not the plan.
:::

::: check
An estimator receives GPS at $1\,\mathrm{Hz}$ with $180\,\mathrm{ms}$ of latency, and inertial data at $200\,\mathrm{Hz}$ with negligible latency, and the control loop runs at $100\,\mathrm{Hz}$. Is this a multi-rate problem, a jitter problem, or neither?
:::

::: answer
It is a multi-rate problem with a large but *known* delay, and it is handled rather than tolerated.

The $180\,\mathrm{ms}$ is not jitter if the receiver timestamps its solution with a time of validity, which every aviation-grade receiver does. The measurement then belongs to an instant $180\,\mathrm{ms}$ in the past, and the standard remedy is to apply it there: keep a short buffer of past states, apply the correction at the matching time, and re-propagate to the present with the inertial data that has arrived since. The delay is removed exactly, because the data covering that interval is available.

A receiver with *variable* latency and no timestamp would make it a jitter problem: the time of validity is then unknown to within the variation, the correction lands at the wrong epoch, and in a moving vehicle that is a position error of velocity times the offset, entering the estimator as an unmodelled correlated error.

For the control loop the answer is simpler. At $1\,\mathrm{Hz}$, GPS is far below the loop's bandwidth and reaches it only through the estimator's slow bias states; the rate transition that matters to the $100\,\mathrm{Hz}$ controller is the inertial path, which is fast and harmonically related.
:::

## Summary

| Item | Statement |
| --- | --- |
| Rate groups | Integer submultiples of one base rate, fixed phases, one timebase; the schedule repeats on a major frame |
| Slow to fast | A zero-order hold at the *slow* rate: $T_{\text{slow}}/2$ of lag, counted once |
| Fast to slow | Decimation: needs a digital anti-alias filter before the rate drops, whose group delay joins the slow loop |
| Skew | Constant when phases are fixed; jitter when they are not |
| Non-integer ratio | Measurement age cycles: a $100\,\mathrm{Hz}$ sensor read at $150\,\mathrm{Hz}$ varies between $0$ and $6.67\,\mathrm{ms}$ at $50\,\mathrm{Hz}$ |
| Cascade separation | At $8\times$ the inner loop is unity to $2\%$ and $0.1^\circ$; below about $3\times$ its gain and phase must be modelled |
| Sampling jitter | Amplitude error $\dot{x}\varepsilon$; for a sinusoid, $\sigma = \sigma_\varepsilon A\omega/\sqrt2$ — broadband noise that grows with vibration |
| Actuation jitter | A time-varying delay; not covered by delay margin |
| Jitter bound | $\sup_\omega \lvert T(j\omega)\rvert \cdot 2\lvert\sin(\omega\Delta/2)\rvert < 1$, or $\Delta < 1/\sup_\omega \omega\lvert T(j\omega)\rvert$ |
| Overrun modes | Late output (jitter of a frame or more) or dropped frame (held command, missed state updates) |
| Overrun handling | Detect in hardware, contain deterministically, count in telemetry, escalate on repeats — with worst-case execution time bounded by design |

That closes the module, and its whole content reduces to one habit: analyse the loop you are going to fly, not the loop you designed. That means the discrete open loop, built from the ZOH-equivalent plant, the discretized controller, the measured computational delay, the real coefficient word length, and the jitter bound the schedule can guarantee. Every worked example here was a case where those two loops differed, and in several of them the difference was the whole answer.
