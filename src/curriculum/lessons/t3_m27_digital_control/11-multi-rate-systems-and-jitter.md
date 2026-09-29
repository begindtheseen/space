---
id: l11-multi-rate-and-jitter
title: Multi-rate systems and jitter
minutes: 24
covers:
  - Multi-rate systems, jitter, and their effect on stability
---

Every result in this module so far assumed one loop, one sample rate, and frames that start exactly on time. Real flight software has none of those. A launch vehicle's computer might run a rate loop at $400\,\mathrm{Hz}$, an attitude loop at $50\,\mathrm{Hz}$, navigation at $100\,\mathrm{Hz}$ and guidance at $2\,\mathrm{Hz}$, all passing data to each other on one processor, and sometimes starting late.

Think of a school timetable. Some classes meet daily, some twice a week, and a note passed between them arrives a little stale — exactly how stale, you can read off the timetable. That is **multi-rate** structure: planned, with a cost (delay at each hand-off) you can compute. Now imagine the bell sometimes rings a minute late. That is **jitter**: variation in *when* things happen. Its cost is that the time-invariant analysis your margins came from stops being exactly true.

The remedies are opposite. Multi-rate delay is fixed, so you model it and design around it. Jitter keeps changing, so you bound it and check that the bound fits inside the robustness the loop already has. This lesson does both, then looks at frames that do not fit their time slot at all.

## Rate groups

Flight software is organized into **rate groups**: sets of tasks that run at the same frequency, all started by one timer. The slower rates are exact whole-number fractions of the fastest. A $400\,\mathrm{Hz}$ base rate with groups at $400$, $200$, $100$, $50$, $20$ and $10\,\mathrm{Hz}$ is typical. Every group starts at a known offset from a base-frame boundary, and the whole schedule repeats on a **[[major frame|major-frame]]** whose length is the least common multiple of the periods — the shortest time that every period divides into evenly.

Whole-number ratios and fixed start times are not about neatness. They make each hand-off a *constant* delay, which can go in the model, instead of a varying one, which can only be bounded.

## What a rate transition costs

Data that crosses from one rate group to another picks up delay. Which kind depends on the direction.

**Slow to fast** — an outer loop's command read by an inner loop — acts as a zero-order hold at the *slow* rate. The inner loop sees a staircase that changes once per slow frame, so the outer loop carries a hold with $T_{\text{slow}}/2$ of lag, where $T_{\text{slow}}$ ("T slow") is the slow period. This *is* the outer loop's hold; count it once, not twice.

**Fast to slow** — a fast measurement handed to a slow loop — is a **[[decimation|decimation]]**: keeping only every $k$th sample. It needs a digital anti-alias filter *before* the rate drops: content above the slow loop's Nyquist frequency folds down when samples are thrown away, as in the first lesson. That filter's delay then sits in the slow loop.

**Skew** is the offset between when the producer writes a value and when the consumer reads it. With fixed start times it is a constant in the delay budget. Without them — separate timers, or a start that slides with processor load — the data's age changes from frame to frame, and that is jitter. The nasty case is a rate ratio that is not a whole number, which produces a changing age even when everything runs perfectly on time.

::: example A 100 Hz sensor read by a 150 Hz task
The sensor latches a new value every $10\,\mathrm{ms}$. The control task runs every $1/150\,\mathrm{s} = 6.667\,\mathrm{ms}$. Both are perfectly regular, and both clocks are perfect. List the age of the newest value the task sees:

| Task frame $n$ | Task runs at | Newest sensor value from | Age |
| --- | --- | --- | --- |
| 0 | $0.000\,\mathrm{ms}$ | $0\,\mathrm{ms}$ | $0.000\,\mathrm{ms}$ |
| 1 | $6.667\,\mathrm{ms}$ | $0\,\mathrm{ms}$ | $6.667\,\mathrm{ms}$ |
| 2 | $13.333\,\mathrm{ms}$ | $10\,\mathrm{ms}$ | $3.333\,\mathrm{ms}$ |
| 3 | $20.000\,\mathrm{ms}$ | $20\,\mathrm{ms}$ | $0.000\,\mathrm{ms}$ |

Each age is the task time minus the newest sensor time: row 1 is $6.667 - 0 = 6.667\,\mathrm{ms}$, because the $10\,\mathrm{ms}$ value has not arrived yet.

The pattern repeats every three task frames, which is every $20\,\mathrm{ms}$. So the measurement delay is not a constant $3.33\,\mathrm{ms}$. It is a **[[repeating pattern|age-pattern]]** between $0$ and $6.67\,\mathrm{ms}$ that cycles at $1/0.020\,\mathrm{s} = 50\,\mathrm{Hz}$.

A loop whose delay changes periodically is not linear time-invariant. It is linear time-*periodic*, and that kind of system creates **[[sidebands|sidebands]]**: content near crossover reappears shifted by $\pm 50\,\mathrm{Hz}$. Margins read off a Bode plot do not describe it. On top of that, one task frame in three reuses a value it has already used (frame 1 reuses frame 0's value), which is its own small $50\,\mathrm{Hz}$ disturbance.

The fix is structural: make the ratio a whole number — task at $100$ or $200\,\mathrm{Hz}$, or sensor at $150\,\mathrm{Hz}$. If the rates cannot be matched, timestamp every measurement at the source and let the estimator handle the changing age, the one case where compensating is both possible and correct.
:::

::: example The delay budget of a 400/50 Hz cascade
An inner rate loop runs at $400\,\mathrm{Hz}$. It crosses over at $8\,\mathrm{Hz}$ and has one frame of computational delay, which leaves it $29.2^\circ$ of phase margin. An outer attitude loop runs at $50\,\mathrm{Hz}$ and crosses over at $1\,\mathrm{Hz}$. What does the outer loop actually see?

Start with the inner loop, as the outer loop sees it: its closed-loop response $T_{\text{inner}}$ at the outer loop's frequencies.

| Frequency | $\lvert T_{\text{inner}}\rvert$ | Phase |
| --- | --- | --- |
| $1\,\mathrm{Hz}$ | $1.0206$ | $-0.10^\circ$ |
| $2\,\mathrm{Hz}$ | $1.0854$ | $-0.79^\circ$ |
| $4\,\mathrm{Hz}$ | $1.3915$ | $-7.17^\circ$ |

At $1\,\mathrm{Hz}$ the inner loop passes signals within $2\%$ of their size and costs a tenth of a degree — the classical cascade rule of thumb, with numbers. With eightfold separation the inner loop looks like a perfect wire, and the outer design reduces to the integrator from rate to attitude.

Now the outer loop's own budget at its $1\,\mathrm{Hz}$ crossover. A delay $\tau$ costs $360^\circ f\tau$ at frequency $f$.

| Contribution | Delay | Phase at $1\,\mathrm{Hz}$ |
| --- | --- | --- |
| Outer zero-order hold, $T_{\text{slow}}/2$ | $10\,\mathrm{ms}$ | $3.60^\circ$ |
| Outer computational delay, one $50\,\mathrm{Hz}$ frame | $20\,\mathrm{ms}$ | $7.20^\circ$ |
| Inner loop's closed-loop phase | — | $0.10^\circ$ |
| Fixed skew, half an inner frame | $1.25\,\mathrm{ms}$ | $0.45^\circ$ |
| Total | | $11.35^\circ$ |

Check one row: $360 \times 1 \times 0.010 = 3.60^\circ$. Of the eleven and a third degrees, the inner loop contributes almost nothing; the outer loop's own discreteness contributes almost everything. That is the payoff of a cascade: the slow loop pays only for its own rate.

Shrink the separation and that changes. At a $4\,\mathrm{Hz}$ outer crossover the inner loop adds $7.17^\circ$ of phase *and* $20\log_{10}(1.3915) = 2.9\,\mathrm{dB}$ of gain, so the outer loop must be designed against its real response. That is why about three times separation is the usual minimum.
:::

## Jitter

Clap along to a song. Even if you are good, each clap lands a little early or late. That wobble is **jitter**: variation in the timing of an event that is supposed to be periodic. In a flight computer it comes from interrupt latency, cache and memory contention, a higher-priority task that sometimes runs long, bus arbitration, and sensors whose **[[clock crystal|crystal-clocks]]** is not the flight computer's. Two kinds matter.

### Sampling jitter

**Sampling jitter** is variation in *when* the measurement is taken. Say the sample meant for time $t_n$ is actually taken at $t_n + \varepsilon_n$, where $\varepsilon_n$ ("epsilon sub n") is the timing error. Then the value read is

$$
x(t_n + \varepsilon_n) = x(t_n) + \dot{x}(t_n)\,\varepsilon_n + O(\varepsilon_n^2).
$$

In words: the error is the signal's slope, $\dot{x}$ ("x dot"), times the timing error, plus terms too small to matter ($O(\varepsilon_n^2)$). A steep signal read late is read badly; a flat one hardly suffers. So the error is broadband noise that grows with frequency and vibration.

For a sine wave of amplitude $A$ at angular frequency $\omega$, the slope is $A\omega\cos(\omega t)$, and its root-mean-square value is $A\omega/\sqrt2$. If the timing error has root-mean-square size $\sigma_\varepsilon$ ("sigma epsilon"), the noise it creates is

$$
\sigma_{\text{jitter}} = \sigma_\varepsilon \frac{A\omega}{\sqrt2}.
$$

Put in numbers. Take $50\,\mathrm{\mu s}$ of root-mean-square sampling jitter — modest under a general-purpose operating system — and a $10\,\mathrm{Hz}$ vibration of amplitude $1^\circ/\mathrm{s}$ on the gyro. Then $\omega = 2\pi \times 10 = 62.83\,\mathrm{rad/s}$ and

$$
\sigma_{\text{jitter}} = 5\times10^{-5} \times \frac{62.83}{\sqrt2} = 2.22\times10^{-3}\,{}^\circ/\mathrm{s}.
$$

That is almost the $2.64\times10^{-3}\,{}^\circ/\mathrm{s}$ from the $16$-bit converter in the quantization lesson. Timing jitter has roughly doubled the measurement noise, and no converter resolution will fix it.

### Actuation jitter

**Actuation jitter** is variation in *when* the command is written to the actuator. That is a delay that changes from frame to frame — a **time-varying delay** — and it is the kind that threatens stability.

::: key
**Jitter versus delay.** A fixed delay can be modeled and compensated. Jitter is a time-varying delay: it cannot be compensated, it injects broadband noise, and it invalidates the LTI analysis your margins came from. Bound it, do not correct it.
:::

## How much jitter a loop can take

Delay margin is the wrong tool here: it answers "how much *fixed* extra delay can this loop take?" The right tool is the **[[small-gain|small-gain]]** argument, which also covers changes that vary in time.

Write the actual delay as the nominal one plus an extra piece $\Delta\tau(t)$ ("delta tau of t") that stays between $0$ and a bound $\Delta$. If that extra piece were constant, the loop gain would become $L(j\omega)e^{-j\omega\Delta\tau}$ — the nominal loop multiplied by $1 + W$, with

$$
W(j\omega) = e^{-j\omega\Delta\tau} - 1,
\qquad
|W| = \left|2\sin\!\left(\frac{\omega\Delta\tau}{2}\right)\right| \le 2\left|\sin\!\left(\frac{\omega\Delta}{2}\right)\right| .
$$

When a change multiplies the loop like this, the small-gain condition for robust stability is $|T(j\omega)|\,|W(j\omega)| < 1$ at every frequency. Here $T = L/(1+L)$ is the complementary sensitivity from the classical control module. So for a delay that is unknown but fixed within $[0, \Delta]$,

$$
\sup_\omega\ |T(j\omega)| \cdot 2\left|\sin\!\left(\frac{\omega\Delta}{2}\right)\right| < 1 .
$$

Read $\sup_\omega$ ("soup over omega", short for *supremum*) as "the largest value over all frequencies".

A delay that changes *every frame* smears signals from one frequency into others, so a frequency-by-frequency test is no longer the whole story. The result proved for this case replaces $2|\sin(\omega\Delta/2)|$ by the straight line $\omega\Delta$, which is never smaller:

$$
\Delta < \frac{1}{\displaystyle\sup_\omega\ \omega\,|T(j\omega)|} .
$$

This is the **[[jitter bound|jitter-margin]]** to use. The allowable jitter is set by the peak of the complementary sensitivity weighted by frequency. A peaky closed loop tolerates little jitter.

::: example A jitter budget for the 400 Hz rate loop
Take the inner loop of the cascade example: $400\,\mathrm{Hz}$, $8\,\mathrm{Hz}$ crossover, one frame of computational delay, $29.2^\circ$ of phase margin.

Its complementary sensitivity peaks at $|T| = 2.175$ ($6.75\,\mathrm{dB}$) at $7.01\,\mathrm{Hz}$ — high, as the modest phase margin suggests.

The largest value of $\omega|T(j\omega)|$ is $100.5\,\mathrm{rad/s}$, a little above the peak of $|T|$ because the weighting by $\omega$ favors higher frequencies. So the jitter bound is

$$
\Delta_{\max} = \frac{1}{100.5} = 9.95\,\mathrm{ms} \approx 3.98 \text{ frames}.
$$

(One frame is $2.5\,\mathrm{ms}$, and $9.95/2.5 = 3.98$.)

Compare two neighbors. The sine test for a *fixed* unknown delay gives $10.05\,\mathrm{ms}$, slightly larger, as it must be since $2|\sin(x/2)| \le |x|$. The delay margin is $\phi_m/\omega_c = 0.5096/50.29 = 10.13\,\mathrm{ms}$ (with $\phi_m = 29.2^\circ = 0.5096\,\mathrm{rad}$, $\omega_c = 50.29\,\mathrm{rad/s}$). All three are close, as usual when the $|T|$ peak sits near crossover. What differs is meaning: the delay margin is how much *fixed* delay the loop tolerates; the jitter bound is how much the delay may *vary*, frame to frame, in any pattern.

About four frames sounds generous, but a general-purpose operating system with a $1\,\mathrm{ms}$ tick can deliver several milliseconds of variation under load — most of the budget. A hard **[[real-time executive|executive]]** on bare metal keeps it to tens of microseconds. That, not the arithmetic, is why flight software runs on a deterministic executive.
:::

::: warning
Do not "fix" jitter by measuring the elapsed time and recomputing the controller coefficients every frame. That turns a time-invariant filter into a time-varying one, which can be unstable even when every frozen snapshot of it is stable — and the recomputation takes a data-dependent time, which adds jitter.

There is one exception: the integrator. Accumulating $I \mathrel{+}= k_i\,\Delta t\,e$ with the *measured* $\Delta t$ is correct, because integrating a held value over a measured interval is what an integrator is for, and it costs one multiply. Everything else — filters, notches, derivatives — uses the nominal $T$ and treats the deviation as a bounded error.

The real remedy is upstream: a hardware-timed frame, a deterministic executive, a measured worst-case execution time inside the frame, and a fixed actuation instant driven by a timer rather than by the code finishing.
:::

## Overruns

A frame that does not fit in its time slot is the extreme case of jitter. It fails in two distinct ways.

**The task finishes late.** Preempted or running long, it writes the command after its intended instant. That is jitter of exactly the kind above, but a whole frame or more in size — beyond the budget of most loops.

**The frame is skipped.** The previous command is held for two frames — a zero-order hold at half the nominal rate, doubling that frame's hold lag. The integrator, filters and derivative all miss an update, so their states fall out of step with real time; a notch that skips a sample has its phase at the mode wrong for several frames.

Flight software handles both on purpose rather than hoping.

- **Detect.** The timer interrupt that starts frame $n+1$ finds frame $n$ still running, or its completion flag unset — a hardware fact, not a guess.
- **Contain.** Hold the last valid output, or run a degraded path whose execution time is bounded by construction. Never let a late frame's output overwrite a newer one.
- **Count.** Keep an overrun counter in telemetry for each rate group, and downlink the worst frame margin with it. Something that happens once in a hundred thousand frames on the pad happens thousands of times in flight.
- **Escalate.** Have a policy for repeats — a mode change, a switch to a redundant computer, or a **[[watchdog|watchdog]]** reset — chosen in the failure-modes analysis, not inside the control task.

The engineering position: worst-case execution time is bounded by design and verified on the target, with margin, and runtime overrun handling is the last line of defense, not the plan. A schedule built on *average* execution time is a bet, and the tail — cache misses, interrupt storms, memory contention — arrives at exactly the busy moments when the loop matters most.

## Check yourself

::: check
An outer loop at $25\,\mathrm{Hz}$ commands an inner loop at $250\,\mathrm{Hz}$. The two tasks are started from the same timer with a fixed phase relationship, and the inner loop reads the outer command at the start of its frame. Compute the delay cost the rate transition adds to the outer loop at its $0.8\,\mathrm{Hz}$ crossover, and say what changes if the tasks come from unrelated timers.
:::

::: answer
With a fixed phase relationship there are two constant contributions.

- The outer command is held for a whole outer frame of $40\,\mathrm{ms}$. That is the outer loop's zero-order hold, worth $T_{\text{slow}}/2 = 20\,\mathrm{ms}$. At $0.8\,\mathrm{Hz}$: $360 \times 0.8 \times 0.020 = 5.76^\circ$.
- The inner loop picks the command up at its next frame boundary: on average half an inner frame, $4/2 = 2\,\mathrm{ms}$. That is $360 \times 0.8 \times 0.002 = 0.58^\circ$.

Total $6.34^\circ$, constant, and it goes straight into the model.

With unrelated timers the second term stops being constant. The pickup offset drifts through the whole $4\,\mathrm{ms}$ inner frame as the oscillators wander, so the delay varies over $4\,\mathrm{ms}$ peak to peak. The size is the same; what is lost is the ability to model it. The drift is slow, so the loop looks fine for minutes and then behaves differently — the hardest kind of problem to reproduce. The fix costs nothing at design time and is nearly impossible to add later: one timebase for every rate group.
:::

::: check
A loop has a complementary sensitivity peaking at $4\,\mathrm{dB}$ at $6\,\mathrm{Hz}$ and crossing over at $5\,\mathrm{Hz}$. Estimate the jitter it can tolerate, and compare with the tolerance of an otherwise identical loop whose $|T|$ peaks at $10\,\mathrm{dB}$.
:::

::: answer
First turn decibels into a plain ratio: $4\,\mathrm{dB}$ is $|T| = 10^{4/20} = 1.585$. Estimate the bound using the peak, at $\omega = 2\pi \times 6 = 37.70\,\mathrm{rad/s}$:

$$
\Delta < \frac{1}{\omega|T|} = \frac{1}{37.70 \times 1.585} = 16.7\,\mathrm{ms}.
$$

This is an estimate, not the exact figure. The largest value of $\omega|T(j\omega)|$ need not sit at the peak of $|T|$: the weighting by $\omega$ pushes the worst case higher in frequency, so the true bound is somewhat smaller. It is the right size.

At $10\,\mathrm{dB}$, $|T| = 10^{10/20} = 3.162$, and the bound becomes $1/(37.70 \times 3.162) = 8.4\,\mathrm{ms}$ — half as much. A peaky closed loop, which goes hand in hand with a small phase margin and a small modulus margin, is intolerant of timing variation as well as of everything else. A high $|T|$ peak and a poor modulus margin travel together, because $|S| = |1 - T| \ge |T| - 1$.
:::

::: check
Why does sampling jitter hurt more on a vehicle with high-frequency vibration, and what can be done about it?
:::

::: answer
The error from a timing offset $\varepsilon$ is $\dot{x}\,\varepsilon$ — the slope times the offset. A $10\,\mathrm{Hz}$ component of amplitude $A$ has slope up to $A\omega = 62.8A$ per second. At $100\,\mathrm{Hz}$ the same amplitude gives ten times the slope and so ten times the error from the same jitter. Jitter turns vibration into measurement noise, with a conversion factor proportional to frequency.

Three things help, best first.

1. **Reduce the jitter itself.** Latch the sample in hardware from a timer, not in software at the top of the task, so it is taken at a fixed instant whatever the processor is doing. This standard arrangement removes sampling jitter almost entirely.
2. **Filter the vibration before the sampler.** The anti-alias filter of the first lesson does a second job here: content it removes cannot become jitter noise either.
3. **Account for it in the estimator** as extra measurement noise. Honest, but weakest, because the noise scales with the vibration environment — the thing you know least well.
:::

::: check
A $100\,\mathrm{Hz}$ control task sometimes exceeds its $10\,\mathrm{ms}$ budget. List the failure modes and the handling a flight-software design should have in place.
:::

::: answer
Two failure modes, with different signatures.

**Late output.** The command is written after its intended instant, so that frame's delay exceeds nominal by the overrun — a time-varying delay that eats phase margin, cannot be compensated, and injects jitter noise.

**Dropped frame.** The previous command is held, so the hold acts at half rate and its lag doubles; the integrator misses an update and every filter state falls out of step with elapsed time.

Handling: **detect** it in hardware (the next frame's timer finds the previous one unfinished); **contain** it by holding the last valid output or running a bounded degraded path; **count** it per rate group in telemetry; **escalate** on repeats per the failure-modes analysis. Underneath, worst-case execution time is bounded by design and verified on the target, with margin.
:::

::: check
An estimator receives GPS at $1\,\mathrm{Hz}$ with $180\,\mathrm{ms}$ of latency, and inertial data at $200\,\mathrm{Hz}$ with negligible latency. The control loop runs at $100\,\mathrm{Hz}$. Is this a multi-rate problem, a jitter problem, or neither?
:::

::: answer
It is a multi-rate problem with a large but *known* delay, and it is handled, not merely tolerated.

The $180\,\mathrm{ms}$ is not jitter if the receiver stamps its solution with a **[[time of validity|time-of-validity]]**, which aviation-grade receivers do. The measurement then belongs to an instant $180\,\mathrm{ms}$ in the past, and the remedy is to apply it there. Keep a short buffer of past states, apply the correction at the matching time, and re-propagate to the present with the inertial data that arrived since. The delay is removed exactly, because the data covering that interval is available.

A receiver with *variable* latency and no timestamp would make it a jitter problem: the correction would land at the wrong moment, giving a position error of velocity times the timing offset — an unmodelled, correlated error.

For the control loop the answer is simpler. At $1\,\mathrm{Hz}$, GPS is far below the loop's bandwidth and reaches it only through the estimator's slow bias states. The rate transition that matters to the $100\,\mathrm{Hz}$ controller is the inertial path, which is fast and a whole-number multiple.
:::

## Summary

| Item | Statement |
| --- | --- |
| Rate groups | Whole-number fractions of one base rate, fixed phases, one timebase; repeats on a major frame |
| Slow to fast | A zero-order hold at the *slow* rate: $T_{\text{slow}}/2$ of lag, counted once |
| Fast to slow | Decimation: needs a digital anti-alias filter before the rate drops; its delay joins the slow loop |
| Skew | Constant when phases are fixed; jitter when they are not |
| Non-integer ratio | Measurement age cycles: a $100\,\mathrm{Hz}$ sensor read at $150\,\mathrm{Hz}$ varies between $0$ and $6.67\,\mathrm{ms}$ at $50\,\mathrm{Hz}$ |
| Cascade separation | At $8\times$ the inner loop is unity to $2\%$ and $0.1^\circ$; below about $3\times$ its gain and phase must be modeled |
| Sampling jitter | Error $\dot{x}\varepsilon$; for a sinusoid, $\sigma = \sigma_\varepsilon A\omega/\sqrt2$ — broadband noise that grows with vibration |
| Actuation jitter | A time-varying delay; not covered by delay margin |
| Jitter bound | Varying delay: $\Delta < 1/\sup_\omega \omega\lvert T(j\omega)\rvert$. Fixed unknown delay: $\sup_\omega \lvert T\rvert \cdot 2\lvert\sin(\omega\Delta/2)\rvert < 1$ |
| Overrun modes | Late output (jitter of a frame or more) or dropped frame (held command, missed state updates) |
| Overrun handling | Detect, contain, count, escalate — with worst-case execution time bounded by design |

That closes the module, and it comes down to one habit: analyze the loop you will fly, not the loop you designed — the zero-order-hold equivalent plant, the discretized controller, the measured computational delay, the real coefficient word length, and the jitter bound the schedule can guarantee.

::: context major-frame The timetable that repeats
Here are three rate groups over $20\,\mathrm{ms}$ on a $400\,\mathrm{Hz}$ base frame of $2.5\,\mathrm{ms}$. The $400\,\mathrm{Hz}$ tasks run in every base frame, the $100\,\mathrm{Hz}$ tasks in every fourth, the $50\,\mathrm{Hz}$ tasks in every eighth. After $20\,\mathrm{ms}$ the pattern starts over.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g stroke="#8fb8f0" stroke-width="1">
    <line x1="60" y1="20" x2="60" y2="135"/><line x1="95" y1="20" x2="95" y2="135"/><line x1="130" y1="20" x2="130" y2="135"/>
    <line x1="165" y1="20" x2="165" y2="135"/><line x1="200" y1="20" x2="200" y2="135"/><line x1="235" y1="20" x2="235" y2="135"/>
    <line x1="270" y1="20" x2="270" y2="135"/><line x1="305" y1="20" x2="305" y2="135"/><line x1="340" y1="20" x2="340" y2="135"/>
  </g>
  <g fill="#1d6fd1">
    <rect x="60" y="32" width="10" height="16"/><rect x="95" y="32" width="10" height="16"/><rect x="130" y="32" width="10" height="16"/>
    <rect x="165" y="32" width="10" height="16"/><rect x="200" y="32" width="10" height="16"/><rect x="235" y="32" width="10" height="16"/>
    <rect x="270" y="32" width="10" height="16"/><rect x="305" y="32" width="10" height="16"/>
  </g>
  <g fill="#f2b880"><rect x="70" y="67" width="14" height="16"/><rect x="210" y="67" width="14" height="16"/></g>
  <rect x="84" y="102" width="20" height="16" fill="#b4232c"/>
  <g font-size="11" fill="#1f2a44">
    <text x="8" y="44">400 Hz</text><text x="8" y="79">100 Hz</text><text x="8" y="114">50 Hz</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="150">0</text><text x="130" y="150">5</text><text x="200" y="150">10</text><text x="270" y="150">15</text><text x="340" y="150">20 ms</text>
  </g>
  <text x="200" y="166" font-size="11" fill="#6c7a93" text-anchor="middle">each band is one 2.5 ms base frame</text>
</svg>
```

With groups at $400$ down to $10\,\mathrm{Hz}$, the periods are $2.5$, $5$, $10$, $20$, $50$ and $100\,\mathrm{ms}$, and the major frame is $100\,\mathrm{ms}$ — the first time all of them line up again.
:::

::: context decimation A word with a grim past
In the Roman army, *decimation* was a punishment: one soldier in ten was chosen by lot and killed. The word came to mean "remove one in ten", and today people loosely use it for "destroy most of".

In signal processing it means keeping only one sample in every $k$ and discarding the rest. Going from $400\,\mathrm{Hz}$ to $50\,\mathrm{Hz}$ is decimation by eight. The discarding is where aliasing sneaks in, which is why a digital low-pass filter must run at the fast rate *before* the samples are thrown away.
:::

::: context age-pattern The sawtooth of stale data
The gray sawtooth is the age of the newest sensor value, which resets to zero at every $10\,\mathrm{ms}$ sensor update. The red dots are the moments the $150\,\mathrm{Hz}$ task looks. It sees ages of $0$, $6.67$ and $3.33\,\mathrm{ms}$, over and over.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="170" x2="330" y2="170" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="40" y1="60" x2="40" y2="170" stroke="#1f2a44" stroke-width="1.2"/>
  <path d="M40,170 L110,70 M110,170 L180,70 M180,170 L250,70 M250,170 L320,70" fill="none" stroke="#6c7a93" stroke-width="2"/>
  <path d="M110,70 V170 M180,70 V170 M250,70 V170" fill="none" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
  <g fill="#b4232c">
    <circle cx="40" cy="170" r="4.5"/><circle cx="86.7" cy="103.3" r="4.5"/><circle cx="133.3" cy="136.7" r="4.5"/>
    <circle cx="180" cy="170" r="4.5"/><circle cx="226.7" cy="103.3" r="4.5"/><circle cx="273.3" cy="136.7" r="4.5"/>
    <circle cx="320" cy="170" r="4.5"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="35" y="174">0</text><text x="35" y="124">5</text><text x="35" y="74">10</text>
  </g>
  <text x="44" y="52" font-size="11" fill="#1f2a44">age, ms</text>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="186">0</text><text x="110" y="186">10</text><text x="180" y="186">20</text><text x="250" y="186">30</text><text x="320" y="186">40 ms</text>
  </g>
  <text x="234" y="100" font-size="11" fill="#b4232c">6.67 ms</text>
  <text x="140" y="130" font-size="11" fill="#b4232c">3.33 ms</text>
</svg>
```

The pattern repeats every $20\,\mathrm{ms}$ — a $50\,\mathrm{Hz}$ wobble in delay that no one designed in.
:::

::: context sidebands Why a wobbling delay makes new frequencies
Hum a steady note and slowly wave your hand in front of your mouth. The sound gets a "wah-wah" — the note is being changed periodically. Multiply a tone at frequency $f$ by something that repeats at frequency $f_m$ and the result contains new tones at $f + f_m$ and $f - f_m$. Those are **sidebands**.

The delay wobbling at $50\,\mathrm{Hz}$ does the same to every signal in the loop. A $1\,\mathrm{Hz}$ signal picks up faint copies near $49$ and $51\,\mathrm{Hz}$. A Bode plot cannot show that, because it assumes each frequency stays itself.
:::

::: context crystal-clocks No two clocks agree
Nearly every digital clock counts the vibrations of a tiny quartz crystal. Each crystal is slightly off its label — tens of parts per million is ordinary — and drifts with temperature and age.

A $50$ parts-per-million difference sounds like nothing. But it is $50\,\mathrm{\mu s}$ every second, so two "identical" $100\,\mathrm{Hz}$ clocks slide a whole $10\,\mathrm{ms}$ frame apart in $200\,\mathrm{s}$. A sensor with its own crystal therefore drifts steadily against the flight computer's frames. This is why flight systems either run every rate group from one clock, or synchronize sensors to it.
:::

::: context small-gain The small-gain idea
Stand between two mirrors and you see copies of copies. If each mirror is a little dim, the copies fade out. If each mirror were brighter than the light that hit it, the copies would grow without end.

A feedback loop is the same. If a signal comes back smaller after every trip around the loop — whatever route it takes and whatever changes along the way — nothing can build up, and the loop is stable. That is the **small-gain theorem**. It only asks about *size*, not timing or phase, which is why it still works when the thing in the loop changes with time. The price is that it can be cautious.
:::

::: context jitter-margin Why the straight line wins
The fixed-delay test uses $2|\sin(x/2)|$ with $x = \omega\Delta$. The varying-delay test uses the straight line $|x|$. The line is always on or above the curve, so the varying-delay test is always the stricter one — and for small $x$ they almost agree.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 205" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="180" x2="330" y2="180" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="50" y1="30" x2="50" y2="180" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="50" y1="180" x2="317" y2="38.6" stroke="#b4232c" stroke-width="2.5"/>
  <polyline points="50.0,180.0 63.4,172.9 76.7,165.9 90.1,159.0 103.4,152.2 116.8,145.6 130.1,139.1 143.5,133.0 156.8,127.1 170.2,121.5 183.5,116.4 196.9,111.6 210.2,107.2 223.6,103.3 236.9,99.8 250.3,96.9 263.6,94.4 277.0,92.5 290.3,91.1 303.7,90.3 317.0,90.0" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="235" y="70" font-size="11" fill="#b4232c">|x|: varying delay</text>
  <text x="225" y="120" font-size="11" fill="#1d6fd1">2|sin(x/2)|: fixed delay</text>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="194">0</text><text x="135" y="194">1</text><text x="220" y="194">2</text><text x="305" y="194">3</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="45" y="184">0</text><text x="45" y="139">1</text><text x="45" y="94">2</text><text x="45" y="49">3</text>
  </g>
</svg>
```

The straight-line test for time-varying delays was published by Chung-Yao Kao and Bo Lincoln in 2004, and it is the basis of the "jitter margin" used in real-time control research.
:::

::: context executive What a real-time executive does
A laptop's operating system tries to be fair and fast *on average*. It will happily pause your task to update a screen or fetch a file. A **real-time executive** (or real-time operating system) promises something different: the highest-priority ready task always runs, and it starts within a known, small time of its trigger.

Flight computers usually go further and use a fixed schedule driven by a hardware timer, so the same task starts at the same offset in every frame. Predictable is worth more than fast.
:::

::: context watchdog The timer that must be fed
A **watchdog** is a hardware timer that counts down on its own. Healthy software resets ("pets" or "kicks") it regularly. If the software hangs or falls badly behind and stops resetting it, the timer reaches zero and forces a reset or a switch to a backup.

It is deliberately simple and separate from the processor it guards, so that a fault in the main software cannot also stop the watchdog from doing its job.
:::

::: context time-of-validity When a measurement was true
A GPS receiver needs time to compute a position, so the answer it sends describes where the antenna *was*, not where it is. The **time of validity** is the timestamp saying exactly which instant the answer belongs to.

With it, the estimator can line the measurement up against its own stored history, as if it had arrived on time. Without it, a vehicle moving at $250\,\mathrm{m/s}$ with an unknown $100\,\mathrm{ms}$ latency would misplace each fix by up to $25\,\mathrm{m}$.
:::
