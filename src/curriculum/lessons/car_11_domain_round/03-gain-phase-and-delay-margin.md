---
id: l03-gain-phase-and-delay-margin
title: "Gain, phase and delay margin"
minutes: 19
covers:
  - "stability margins: gain margin, phase margin and delay margin, what each means physically and why you need all three"
---

Try to stop a friend on a swing by pushing against the swing each time it comes toward you. Push at the right moment and it slows down. Now push half a swing late: your push lands while the swing is moving *away*, so you are pushing along with it, and it goes higher. A feedback loop is a machine that pushes back like this, and two things decide whether it calms the motion or feeds it: how hard it pushes, and how late.

A **stability margin** measures how much room is left before that pushing turns into a runaway. There are three: **gain margin** (how much harder it could push), **phase margin** (how much later, measured as an angle), and **delay margin** (how much later, measured in seconds). Every attitude, rate and guidance loop on a rocket or spacecraft is designed to hit targets for these numbers.

Margins open more GNC domain rounds than any other subject — not because control theory is the hardest part of the job, but because margins are the shortest complete test available. Each definition is two lines, easy to check, with a clear physical meaning. And the follow-up — *why do you need more than one?* — separates people who have designed a loop from people who have read about one. An interviewer can run the whole subject in four minutes and learn a great deal.

This lesson gives the three definitions in the form to write cold, the physical reading of each, the conversion of phase margin into the number the flight software team cares about, and the answer to *why all three*. The next lesson reads them off a plot and covers the Nyquist criterion underneath.

## The two frequencies, first

Much of the confusion about margins is a frequency mix-up, so settle the words first.

$L(j\omega)$, read "L of j omega", is the **[[open-loop|open-loop-cut]]** frequency response. It is everything around the loop multiplied together — plant times controller times sensor — with the loop cut open. Feed in a steady wiggle at frequency $\omega$ (omega, in radians per second). $L$ tells you what comes back after one trip around: its size, $\lvert L\rvert$, and its phase, $\angle L$ — how far the wiggle has been shifted in its cycle.

Two frequencies matter, and they are different:

- the **gain crossover** $\omega_{gc}$ (read "omega g-c"), where $\lvert L\rvert = 1$ — the wiggle comes back the same size;
- the **phase crossover** $\omega_{pc}$ (read "omega p-c"), where $\angle L = -180^\circ$ — the wiggle comes back flipped upside down.

Phase margin lives at the first. Gain margin lives at the second. Saying the wrong one is the single most common error in this subject.

## Gain margin

Imagine the loop's gain turns out larger than modeled: a stronger actuator, a lighter vehicle, more control authority than the aerodynamic database predicted. Gain margin asks how much of that you can absorb.

Here is the picture. At the phase crossover, the loop flips the sign of whatever goes around it: $-180^\circ$ of phase is a **[[sign flip|sign-flip]]**. So at that one frequency, negative feedback (which calms things) has become positive feedback (which feeds them). What stops a runaway is that the size there is less than one: a disturbance at $\omega_{pc}$ comes back smaller on each lap, and dies out. Scale the gain up by one over that size, and each lap comes back exactly the same size. The loop now sustains itself forever — the edge of instability.

::: key Gain margin
$\mathrm{GM} = 1/\lvert L(j\omega_{pc})\rvert$, evaluated at the frequency where $\angle L = -180^\circ$; usually quoted in dB. It is the factor by which the open-loop gain can increase before the closed loop becomes unstable. Aerospace loops target $6\,\mathrm{dB}$ or more — a factor of two.
:::

**[[dB|decibels]]**, said "dee-bee", is short for decibels, a log scale: a factor $x$ is $20\log_{10}x$ in dB. So a factor of $2$ is $20\log_{10}2 \approx 6.02\,\mathrm{dB}$.

Two facts to carry with it.

First, a loop whose phase never reaches $-180^\circ$ has *infinite* gain margin. That is a real property of the model, and it is usually a sign that the model left out a delay or an actuator's own lag.

Second, a plant that is **[[unstable on its own|open-loop-unstable]]** — a launch vehicle in the atmosphere, an aerodynamically unstable airframe — also has a gain margin *from below*. Lower its gain too far and it goes unstable the other way.

## Phase margin

Now imagine the loop picks up extra lag with no change in size: an actuator slower than modeled, a filter somebody added late, computer latency, a structure that bends a little. Phase margin asks how much of that you can absorb.

At the gain crossover, the size is exactly one, so anything at that frequency comes back the same size. What stops it sustaining is that the phase has not yet reached $-180^\circ$. The gap between where the phase is and $-180^\circ$ is the margin.

::: key Phase margin
$\mathrm{PM} = 180^\circ + \angle L(j\omega_{gc})$, evaluated at the frequency where $\lvert L\rvert = 1$. It is the additional phase lag the loop tolerates before the closed loop becomes unstable. Aerospace loops target $30^\circ$ to $45^\circ$, often $60^\circ$ where the plant is poorly known.
:::

For example, if the phase at $\omega_{gc}$ is $-128^\circ$, the phase margin is $180^\circ - 128^\circ = 52^\circ$.

On most vehicles phase margin is the more useful of the two, because most of what a model gets wrong is phase rather than gain. It also hints at how springy the closed loop will be. For a second-order loop, the **[[damping ratio|damping-ratio]]** is roughly $\zeta \approx \mathrm{PM}/100$ for margins below about $65^\circ$, with $\mathrm{PM}$ in degrees ($\zeta$ is the Greek letter zeta). So $45^\circ$ suggests $\zeta \approx 0.45$. Quote that as a rule of thumb for one loop shape, never as a definition. It is a handy bridge between the frequency-domain number and the time-domain behavior an interviewer may ask you to predict.

## Delay margin

Phase margin is an angle, and nobody outside the controls group has a feel for angles. So convert it into time.

A pure **[[transport delay|transport-delay]]** of $T$ seconds — the signal arrives exactly $T$ late, otherwise unchanged — multiplies the loop by $e^{-j\omega T}$. Here is what that factor does, one piece at a time:

1. Its size is exactly $1$ at every frequency. So **the delay does not move the gain crossover at all**.
2. Its phase is $-\omega T$ radians. So it removes phase, and removes more at higher frequency.
3. At $\omega_{gc}$, the phase margin left over is $\mathrm{PM} - \omega_{gc}T$.
4. That reaches zero when $\omega_{gc}T = \mathrm{PM}$. Divide both sides by $\omega_{gc}$:

$$T = \frac{\mathrm{PM}\ \text{in radians}}{\omega_{gc}}.$$

::: key Delay margin
$\tau_d = \mathrm{PM}$ (radians) $/\ \omega_{gc}$ (rad/s), in seconds. It converts phase margin into the physically meaningful quantity: how much pure transport delay the loop tolerates before going unstable. This is the number you take to the flight software team, because latency is built from things they can trade — sample rate, filter order, scheduling jitter, bus transport, task ordering.
:::

Read $\tau_d$ as "tau sub d". A units check: radians divided by radians per second leaves seconds, as a delay should.

Look at what the formula says about speed. The crossover frequency is on the bottom, so **a faster loop has a smaller delay budget at the same phase margin**. That is the number behind the experience that fast loops are the ones latency bites.

::: example All three margins for a reaction-wheel attitude loop
Take a rigid spacecraft turning about one axis, with moment of inertia $J = 120\,\mathrm{kg\,m^2}$ (how hard it is to spin up), steered by a **[[reaction wheel|reaction-wheel]]**. A PD controller — proportional plus derivative — is designed for natural frequency $\omega_n = 5\,\mathrm{rad/s}$ and damping $\zeta = 0.7$. The gains follow:

- $k_p = J\omega_n^2 = 120 \times 25 = 3000\,\mathrm{N\,m/rad}$;
- $k_d = 2\zeta\omega_n J = 2 \times 0.7 \times 5 \times 120 = 840\,\mathrm{N\,m\,s/rad}$.

Now add what a real implementation has: a $20\,\mathrm{ms}$ first-order actuator lag and a $10\,\mathrm{ms}$ computing delay. The open loop is

$$L(s) = \frac{(840s + 3000)\,e^{-0.01s}}{120\,s^2\,(0.02s + 1)}.$$

Solving numerically gives:

| Quantity | Value | Where |
| --- | --- | --- |
| Gain crossover | $\omega_{gc} = 7.639\,\mathrm{rad/s}$ | $\lvert L\rvert = 1$ |
| Phase margin | $51.9^\circ$ | at $\omega_{gc}$ |
| Phase crossover | $\omega_{pc} = 62.07\,\mathrm{rad/s}$ | $\angle L = -180^\circ$ |
| Gain margin | $23.0\,\mathrm{dB}$, a factor of $14.1$ | at $\omega_{pc}$ |
| Delay margin | $0.9055/7.639 = 0.1185\,\mathrm{s}$ | — |

**Check the phase budget at crossover.** The $1/s^2$ (a double integrator: torque sets acceleration, which integrates twice to angle) contributes $-180^\circ$. The PD zero adds $\arctan(840 \times 7.639 / 3000) = +64.9^\circ$ of lead. The actuator lag takes back $\arctan(0.02 \times 7.639) = 8.69^\circ$. The $10\,\mathrm{ms}$ delay takes $\omega_{gc}T = 0.0764\,\mathrm{rad} = 4.38^\circ$. Add them: $-180 + 64.9 - 8.69 - 4.38 = -128.1^\circ$, so the margin is $51.9^\circ$. The pieces account for it exactly.

**Read the delay margin.** $51.9^\circ$ is $0.9055\,\mathrm{rad}$, and $0.9055/7.639 = 0.1185\,\mathrm{s}$: about $119\,\mathrm{ms}$ of *further* latency before this loop goes unstable. A $100\,\mathrm{Hz}$ flight loop's **[[zero-order hold|zero-order-hold]]** behaves like about half a sample of delay, $T/2 = 5\,\mathrm{ms}$. So there is a great deal of room here.

**Now ask for four times the bandwidth**, $\omega_n = 20\,\mathrm{rad/s}$, leaving the actuator and the delay alone. The gains become $k_p = 48\,000\,\mathrm{N\,m/rad}$ and $k_d = 3360\,\mathrm{N\,m\,s/rad}$. The crossover moves to $27.6\,\mathrm{rad/s}$, and the phase margin collapses to $17.9^\circ$. Why? The same $20\,\mathrm{ms}$ lag now costs $28.9^\circ$ instead of $8.7^\circ$, and the same $10\,\mathrm{ms}$ delay costs $15.8^\circ$ instead of $4.4^\circ$.

The delay margin falls to $11.3\,\mathrm{ms}$ — a factor of about ten, for a factor of four in bandwidth. Both the top and the bottom of the fraction moved against you: the phase margin shrank *and* the crossover grew.

**Sanity check:** the slow design's $119\,\mathrm{ms}$ is far larger than its $10\,\mathrm{ms}$ built-in delay, while the fast design's $11.3\,\mathrm{ms}$ is about the same size — which matches its thin $17.9^\circ$ margin.
:::

## Why you need all three

This is the follow-up, and it has a clean answer: **the three margins measure robustness to three different errors, and two of them are not even measured at the same frequency.**

- Gain margin protects against an error in loop gain — control effectiveness, inertia, a wheel's torque constant.
- Phase margin protects against an error in phase — an unmodeled lag, a filter, a bending mode.
- Delay margin is phase margin restated in the units of the error that most often eats it, which makes it the one you can negotiate.

So a comfortable gain margin does not buy you a phase margin. The two are read at different frequencies, off different features of the same curve. A loop can have $20\,\mathrm{dB}$ of gain margin and $8^\circ$ of phase margin at the same time. Such a loop passes the gain check, is stable on paper, and rings violently on any unmodeled delay. The next lesson builds exactly that case.

::: key Why all three
Gain margin guards against an error in loop gain, at the phase crossover. Phase margin guards against an error in phase or lag, at the gain crossover. Delay margin restates phase margin in seconds, which is the currency latency is actually traded in. A loop can have a comfortable gain margin and a dangerously small phase margin, and will then oscillate badly on any unmodeled delay.
:::

::: warning Three errors that cost the question
**Wrong frequency.** Gain margin at the gain crossover, or phase margin at the phase crossover, is the error interviewers listen for. Each is measured at the *other's* crossover — easy to say, and easy to flip under pressure.

**Degrees where radians belong.** The delay margin formula needs the phase margin in radians. Forty-five degrees is $0.785$, not $45$.

**Treating infinite gain margin as good news.** It usually means the model has no delay and no fast actuator dynamics in it. The delay margin is the honest number for such a loop.
:::

::: example "You have a loop with 45 degrees of phase margin. Is that enough?"
**A weak answer:** "Yes, that is within the normal range. You usually want between thirty and sixty degrees, so forty-five is fine."

True, but it answers a different question. "Is that enough?" is a requirements question, and the candidate has answered it with a rule of thumb.

**A strong answer:**

"It depends on what the loop has to be robust to, and I would convert it before deciding. Forty-five degrees is $\pi/4$, about $0.785\,\mathrm{rad}$. Divide by the crossover frequency and I have the delay margin, which I can compare against a budget.

If this is a slow attitude loop crossing over at $1\,\mathrm{rad/s}$, that is $785\,\mathrm{ms}$ of tolerable latency, and forty-five degrees is generous. If it is a **[[rate loop|rate-loop]]** crossing over at $50\,\mathrm{rad/s}$, it is $15.7\,\mathrm{ms}$ — and a $200\,\mathrm{Hz}$ control task with its zero-order hold, a sensor filter and some scheduling jitter can eat a third of that before anyone has done anything wrong. Same margin in degrees, completely different engineering situation.

I would want three things before answering properly. What is the gain margin, and at what frequency? Forty-five degrees of phase margin tells me nothing about gain robustness. How well is the plant known? A poorly characterized plant is where the $60^\circ$ convention comes from. And is there a **[[flexible mode|flexible-mode]]** anywhere near crossover? A margin computed on a rigid model is a margin for a vehicle that does not exist.

Sanity check on the conversion: radians over radians per second gives seconds, which is what a delay should be."

Check the arithmetic: $0.785/1 = 0.785\,\mathrm{s}$, and $0.785/50 = 0.0157\,\mathrm{s} = 15.7\,\mathrm{ms}$.

**What the interviewer learns:** the weak answer recites a convention. The strong answer turns the margin into a quantity with engineering consequences, shows that the same number means different things at different bandwidths, names what else it needs to decide, and closes on a units check — in about eighty seconds.
:::

## Check yourself

::: check
State the three margins, each with the frequency it is measured at and the error it protects against.
:::

::: answer
**Gain margin**, $\mathrm{GM} = 1/\lvert L(j\omega_{pc})\rvert$, measured at the phase crossover where $\angle L = -180^\circ$. It protects against an error in loop gain.

**Phase margin**, $\mathrm{PM} = 180^\circ + \angle L(j\omega_{gc})$, measured at the gain crossover where $\lvert L\rvert = 1$. It protects against an error in phase or lag.

**Delay margin**, $\tau_d = \mathrm{PM}$ in radians divided by $\omega_{gc}$, built from the phase margin at the same frequency. It protects against transport latency, and it is the form in which the margin can be traded with the software team.
:::

::: check
A loop has a phase margin of $35^\circ$ at a gain crossover of $25\,\mathrm{rad/s}$. Give the delay margin, and say whether a $200\,\mathrm{Hz}$ control task is comfortable in it.
:::

::: answer
Convert the angle: $35^\circ = 35\pi/180 = 0.6109\,\mathrm{rad}$. Divide by the crossover: $0.6109/25 = 0.02443\,\mathrm{s}$, about $24.4\,\mathrm{ms}$.

A $200\,\mathrm{Hz}$ task has a sample period of $1/200 = 5\,\mathrm{ms}$. A zero-order hold adds roughly half a sample of equivalent delay, so about $2.5\,\mathrm{ms}$ from the hold alone — around a **[[tenth of the budget|latency-budget]]**.

That leaves room, but not much once a sensor filter, bus transport and scheduling jitter are added, and $35^\circ$ is already at the low end of the usual target. The honest answer: it fits, the margin is the constraint rather than a comfort, and the latency chain should be budgeted explicitly rather than assumed.
:::

::: check
An analysis reports infinite gain margin for a launch vehicle pitch loop. Is that good news? What would you ask for instead?
:::

::: answer
Not on its own. Infinite gain margin means the open-loop phase never reaches $-180^\circ$ at any frequency. That almost always means the model stops short: no transport delay, no fast actuator dynamics, no structural modes. Add any of those and the phase drops, giving a finite margin.

Ask for the delay margin. It is finite whenever the phase margin is, and it forces the analysis to say how much latency the loop really tolerates.

For an open-loop-unstable airframe there is also a low-gain margin to ask about: too *little* gain destabilizes it, and an analysis reporting only the high side has answered half the question.
:::

::: check
Two designs for the same vehicle have identical phase margins of $50^\circ$. One crosses over at $3\,\mathrm{rad/s}$, the other at $30\,\mathrm{rad/s}$. Which is more exposed to a late discovery that the avionics add $15\,\mathrm{ms}$ of latency, and by how much?
:::

::: answer
The fast one, by a factor of ten.

$50^\circ$ is $0.8727\,\mathrm{rad}$. The slow design's delay margin is $0.8727/3 = 0.2909\,\mathrm{s}$. The fast one's is $0.8727/30 = 0.02909\,\mathrm{s}$.

An extra $15\,\mathrm{ms}$ uses about $5\%$ of the slow design's budget and about half of the fast design's. In angles: the fast loop loses $\omega_{gc}T = 30 \times 0.015 = 0.45\,\mathrm{rad} = 25.8^\circ$, leaving $24.2^\circ$. The slow loop loses $3 \times 0.015 = 0.045\,\mathrm{rad} = 2.6^\circ$.

Identical phase margins, entirely different exposure, because delay margin scales inversely with bandwidth.
:::

::: check
Why does adding a pure delay to a loop leave the gain crossover frequency unchanged, and what does that let you compute without re-plotting anything?
:::

::: answer
A pure delay of $T$ multiplies the loop by $e^{-j\omega T}$, whose size is $1$ at every frequency. Since the size of $L$ is unchanged everywhere, the frequency where it equals one does not move. Only the phase changes, by $-\omega T$ radians.

That is exactly why the delay margin can be computed from the undelayed loop's phase margin and crossover with no new plot. The new phase margin is $\mathrm{PM} - \omega_{gc}T$, a straight line in $T$, and it hits zero at $T = \mathrm{PM}/\omega_{gc}$. The same argument explains why a delay hurts a fast loop far more than a slow one at equal phase margin.
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

::: context open-loop-cut What "cutting the loop" means
In a feedback loop, the sensor's reading goes to the controller, the controller drives the actuator, the actuator moves the vehicle, and the sensor reads the vehicle again — round and round. To study it, engineers imagine snipping the wire at one point, feeding a test wiggle in on one side, and measuring what arrives at the other side after one full lap. That lap is $L$, the open loop. The margins ask how close that one lap comes to returning the wiggle the same size and flipped over, which is the recipe for a wiggle that feeds itself forever.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g fill="#ffffff" stroke="#1d6fd1" stroke-width="2">
    <rect x="70" y="20" width="90" height="36" rx="6"/>
    <rect x="200" y="20" width="90" height="36" rx="6"/>
    <rect x="135" y="94" width="90" height="36" rx="6"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="115" y="43">controller</text><text x="245" y="43">vehicle</text><text x="180" y="117">sensor</text>
  </g>
  <g stroke="#1f2a44" stroke-width="2" fill="none">
    <line x1="160" y1="38" x2="194" y2="38"/>
    <path d="M290 38 L325 38 L325 112 L231 112"/>
    <path d="M135 112 L40 112 L40 38 L50 38"/>
  </g>
  <g fill="#1f2a44">
    <polygon points="200,38 192,33 192,43"/><polygon points="225,112 233,107 233,117"/>
  </g>
  <line x1="56" y1="26" x2="64" y2="50" stroke="#b4232c" stroke-width="2.5"/>
  <line x1="50" y1="26" x2="58" y2="50" stroke="#b4232c" stroke-width="2.5"/>
  <text x="36" y="16" font-size="11" fill="#b4232c">cut here</text>
  <text x="316" y="80" font-size="11" fill="#6c7a93" text-anchor="end">one lap = L</text>
</svg>
```
:::

::: context sign-flip Why 180 degrees flips the sign
A steady wiggle is a wave going up and down. Shifting it by half a cycle — $180^\circ$ — puts every peak where a trough was. That is the same wave multiplied by $-1$. A feedback loop already subtracts its output (that is the "negative" in negative feedback), so an extra flip turns the subtraction into addition: the loop now pushes *with* the motion instead of against it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="60" x2="340" y2="60" stroke="#6c7a93" stroke-width="1"/>
  <path d="M20 60 C 46.7 20, 73.3 20, 100 60 C 126.7 100, 153.3 100, 180 60 C 206.7 20, 233.3 20, 260 60 C 286.7 100, 313.3 100, 340 60" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <path d="M20 60 C 46.7 100, 73.3 100, 100 60 C 126.7 20, 153.3 20, 180 60 C 206.7 100, 233.3 100, 260 60 C 286.7 20, 313.3 20, 340 60" fill="none" stroke="#b4232c" stroke-width="2.5" stroke-dasharray="6 4"/>
  <text x="24" y="18" font-size="11" fill="#1d6fd1">signal</text>
  <text x="24" y="114" font-size="11" fill="#b4232c">shifted 180°: upside down</text>
</svg>
```
:::

::: context decibels Decibels in one minute
Engineers deal with factors from a thousandth to a thousand, so they use a log scale. In control work, a factor $x$ in size is $20\log_{10}x$ decibels. A factor of $1$ is $0\,\mathrm{dB}$; $2$ is about $6\,\mathrm{dB}$; $10$ is $20\,\mathrm{dB}$; $0.1$ is $-20\,\mathrm{dB}$. Multiplying factors becomes adding decibels, which is why stacking loop pieces on a log plot is easy. The worked loop's gain margin, a factor of $14.1$, is $20\log_{10}14.1 \approx 23.0\,\mathrm{dB}$. The "bel" honors Alexander Graham Bell; "deci" means a tenth.
:::

::: context open-loop-unstable Vehicles that cannot fly without control
Some vehicles fall over by themselves, like a broomstick balanced on your palm. A rocket climbing through the air is often like this: if the point where aerodynamic forces act sits ahead of the center of mass, any small tilt makes the air push it further over. Only the control system, steering the engine, keeps it upright. For such a vehicle, gain that is too *low* is as dangerous as gain that is too high — the controller must push at least hard enough to beat the tipping.
:::

::: context damping-ratio How springy is the loop?
The **damping ratio** $\zeta$ describes how a system settles after a kick. At $\zeta = 0$ it rings forever, like a struck bell. Around $\zeta = 0.7$ it settles quickly with a small overshoot, like a good car suspension. At $\zeta = 1$ and above it creeps back without overshooting. The rule $\zeta \approx \mathrm{PM}/100$ links this everyday behavior to phase margin, so a thin margin predicts a ringing, underdamped response. Lesson 5 returns to damping when tuning a PID controller.
:::

::: context transport-delay Delay as a phase shift
A delay does not change a wave's height; it slides the whole wave later in time by $T$. For a wave that repeats every $2\pi/\omega$ seconds, sliding it by $T$ shifts it by the fraction $T\omega/2\pi$ of a cycle, which is $\omega T$ radians. So the same delay is a tiny shift for a slow wave and a large one for a fast wave. That single fact is why delay hurts fast loops most. In the worked loop, $10\,\mathrm{ms}$ costs $4.4^\circ$ at $7.6\,\mathrm{rad/s}$ but $15.8^\circ$ at $27.6\,\mathrm{rad/s}$.
:::

::: context reaction-wheel Turning a spacecraft without fuel
A **reaction wheel** is a heavy flywheel driven by an electric motor. Spin the wheel one way and the spacecraft turns the other way, because the total spin (angular momentum) has to stay the same. By speeding up or slowing down three or more wheels, a spacecraft can point anywhere using only electricity from its solar panels. Telescopes such as Hubble point this way. The motor's torque is what the controller commands, which is why $k_p$ has units of newton-meters per radian.
:::

::: context zero-order-hold Why a hold acts like half a sample of delay
A flight computer computes a new command once per sample period, say every $10\,\mathrm{ms}$ at $100\,\mathrm{Hz}$, and holds it fixed until the next one — a staircase. The **zero-order hold** is that "hold it flat" step. On average, the staircase lags the smooth command it approximates by half a step, so for a loop crossing over well below the sample rate it behaves much like a pure delay of $T/2$: $5\,\mathrm{ms}$ at $100\,\mathrm{Hz}$, $2.5\,\mathrm{ms}$ at $200\,\mathrm{Hz}$.
:::

::: context rate-loop Loops inside loops
Attitude control is usually built in layers. An inner **rate loop** controls how fast the vehicle is turning, using the gyros; it has to be fast, so it crosses over at a high frequency. An outer attitude loop decides which way the vehicle should point and asks the rate loop for a turn rate; it can be slower. Because the inner loop is faster, it has the tighter delay budget — the same $45^\circ$ buys $785\,\mathrm{ms}$ at $1\,\mathrm{rad/s}$ but only $15.7\,\mathrm{ms}$ at $50\,\mathrm{rad/s}$.
:::

::: context flexible-mode The vehicle is not a rigid brick
A real rocket or spacecraft bends and sways. A long launch vehicle flexes like a diving board, and solar panels wobble like a springboard. Each natural way of bending is a **flexible mode**, with its own frequency. If one sits near the control loop's crossover, it can add sharp swings of phase and gain that a rigid-body model never shows. Engineers add notch filters or keep the crossover well below the first bending frequency — and a margin computed without the modes can be badly optimistic.
:::

::: context latency-budget The 200 Hz budget, drawn to scale
With $35^\circ$ at $25\,\mathrm{rad/s}$, the whole delay budget is $24.4\,\mathrm{ms}$. The zero-order hold at $200\,\mathrm{Hz}$ uses $2.5\,\mathrm{ms}$ of it, about a tenth. Everything else in the chain — sensor filtering, bus transfer, scheduling jitter — has to fit in what remains.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="40" y="36" width="300" height="30" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <rect x="40" y="36" width="31" height="30" fill="#f2b880"/>
  <rect x="71" y="36" width="269" height="30" fill="#8fb8f0"/>
  <text x="44" y="26" font-size="11" fill="#1f2a44">hold 2.5 ms</text>
  <text x="200" y="56" font-size="12" fill="#1f2a44" text-anchor="middle">left for filters, bus, jitter: 21.9 ms</text>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="40" y="84">0</text><text x="340" y="84">24.4 ms</text>
  </g>
  <text x="190" y="102" font-size="11" fill="#6c7a93" text-anchor="middle">delay margin, 35° at 25 rad/s</text>
</svg>
```
:::
