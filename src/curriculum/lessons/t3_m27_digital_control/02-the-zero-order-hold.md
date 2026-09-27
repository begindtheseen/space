---
id: l02-zero-order-hold
title: The zero-order hold and its half-sample phase penalty
minutes: 18
covers:
  - The zero-order hold and its half-sample phase penalty
---

The last lesson was about getting a measurement *into* the flight computer. This one is about getting a command *out*. It turns out to be the more expensive half.

Picture a flip-book animation drawn with only a few pages per second. Each drawing stays on screen until the next page flips. The motion comes out jerky, and, less noticeably, it comes out *late*: on average, what you see is half a page behind where the smooth motion would be.

A **[[digital-to-analog converter|dac]]** does the same thing. It has one output register. When the control task writes a number, the converter drives that value until the next number arrives, one frame later. So the command that reaches the gimbal actuator or the thruster valve driver is a **[[staircase|staircase-picture]]**: flat for $T$ seconds, a step, flat again. That staircase is not the smooth signal your continuous design assumed. The difference is the single largest, most unavoidable phase cost in a digital loop, and unlike the anti-alias filter, you cannot trade it away with better parts.

The device that turns a sequence back into a continuous signal by holding each value for one sample period is called a **[[zero-order hold|zero-order-name]]** (ZOH). "Zero-order" means that between samples it draws a polynomial of degree zero — a constant. This lesson finds its frequency response, pulls out the half-sample delay hiding inside it, and puts numbers on what that delay does to a loop you already tuned.

## The hold as a transfer function

Feed the hold a single unit sample at $t = 0$ and nothing after. Its output is a rectangular pulse: height 1, from $t = 0$ to $t = T$. That pulse is the hold's impulse response, and its Laplace transform is the hold's transfer function.

Build the pulse from two steps. A unit step switched on at $t = 0$ transforms to $1/s$. The same step switched on at $t = T$ is a **[[delayed step|delay-laplace]]**, which transforms to $e^{-sT}/s$. The pulse is the first step minus the second:

$$
G_{h0}(s) = \frac{1 - e^{-sT}}{s}.
$$

Read $G_{h0}$ as "G sub h zero": the transfer function of the hold of order zero.

Its value at $s = 0$ is $T$, not 1. That factor $T$ is right for a device fed impulses. The idealized sampler of the last lesson produces spikes of *area* $x[n]$, and the hold turns an area into a level lasting $T$ seconds. In loop analysis the sampler's $1/T$ and the hold's $T$ cancel, so the pair together has a DC gain of 1. Everything below uses that normalized pair, $G_{h0}(s)/T$, whose value at $s = 0$ is 1.

## Its frequency response contains an exact half-sample delay

Put $s = j\omega$ to get the frequency response. After some algebra (shown in the note below), it splits into three clean pieces:

$$
G_{h0}(j\omega) = T\,e^{-j\omega T/2}\,\frac{\sin(\omega T/2)}{\omega T/2}.
$$

Each piece means something.

- $T$ is the gain factor we already dealt with.
- $\dfrac{\sin(x)}{x}$ with $x = \omega T/2$ is a real, positive, slowly falling gain — the **sinc droop**.
- $e^{-j\omega T/2}$ is a pure delay of exactly half a sample period.

::: note Why it has to be true
Start from $G_{h0}(j\omega) = (1 - e^{-j\omega T})/(j\omega)$. The trick is to pull out half of the exponent, so what is left is balanced around zero:

$$
\begin{aligned}
G_{h0}(j\omega) &= \frac{1 - e^{-j\omega T}}{j\omega}
= \frac{e^{-j\omega T/2}\left(e^{\,j\omega T/2} - e^{-j\omega T/2}\right)}{j\omega} \\[4pt]
&= e^{-j\omega T/2}\,\frac{2j\sin(\omega T/2)}{j\omega}
= T\,e^{-j\omega T/2}\,\frac{\sin(\omega T/2)}{\omega T/2}.
\end{aligned}
$$

Line one: multiply out $e^{-j\omega T/2}$ times the bracket and you get $1 - e^{-j\omega T}$ back, so nothing changed. Line two: the bracket is $2j\sin(\omega T/2)$, by **[[Euler's formula|euler-sine]]**. Last step: cancel the $j$, then multiply top and bottom by $T/2$ so the fraction becomes $\sin(x)/x$.
:::

So, for the normalized hold,

$$
|G_{h0}(j\omega)| = \left|\frac{\sin(\omega T/2)}{\omega T/2}\right|,
\qquad
\angle G_{h0}(j\omega) = -\frac{\omega T}{2}.
$$

The phase result is **exact**, not an approximation, at every frequency up to Nyquist. The zero-order hold's phase lag is $-\omega T/2$, the same as a transport delay of $T/2$ seconds, with no error term. The approximation people talk about is in the *magnitude*. Modeling the hold as $e^{-sT/2}$ gives a gain of exactly 1, where the true hold droops like a sinc. Since $|\sin x / x| < 1$, that model slightly overstates the loop gain at high frequency, which errs on the safe side for gain margin.

Now convert to the units you will work in. With $\omega = 2\pi f$ and $T = 1/f_s$,

$$
\angle G_{h0} = -\frac{2\pi f}{2 f_s}\ \mathrm{rad}
= -\pi\frac{f}{f_s}\ \mathrm{rad}
= -180^\circ \cdot \frac{f}{f_s}.
$$

The lag in degrees is $180$ times the ratio of the frequency to the sample rate. Nothing else. At one twentieth of the sample rate the hold costs $9^\circ$. At one fortieth, $4.5^\circ$. At Nyquist, $90^\circ$. Memorize that line. It is the arithmetic behind the sample-rate rule of thumb a later lesson derives, and the fastest sanity check you can run on someone else's digital design.

| $f/f_s$ | Phase lag | $\lvert G_{h0}\rvert$ | in dB |
| --- | --- | --- | --- |
| $0.010$ | $1.80^\circ$ | $0.99984$ | $-0.001$ |
| $0.025$ | $4.50^\circ$ | $0.99897$ | $-0.009$ |
| $0.050$ | $9.00^\circ$ | $0.99589$ | $-0.036$ |
| $0.100$ | $18.00^\circ$ | $0.98363$ | $-0.143$ |
| $0.250$ | $45.00^\circ$ | $0.90032$ | $-0.912$ |
| $0.500$ | $90.00^\circ$ | $0.63662$ | $-3.922$ |

Read the columns against each other. Across the whole useful range, the gain stays within a tenth of a decibel of 1, while the phase runs away. For practical purposes the zero-order hold is a pure phase lag — the **[[sinc droop|droop-picture]]** is tiny. It takes almost nothing from your gain margin and a great deal from your **[[phase margin|phase-margin-recap]]**.

::: key
**Zero-order hold phase penalty.** A ZOH behaves like a delay of $T/2$, so $\phi = -\omega T/2$, equivalently $-180^\circ f/f_s$. At $100\,\mathrm{Hz}$ and $5\,\mathrm{Hz}$ that is $-9^\circ$. Computational delay adds roughly one more sample on top.
:::

::: example What the hold costs a 100 Hz loop at 5 Hz
A reaction-wheel attitude loop runs at $f_s = 100\,\mathrm{Hz}$, so $T = 10\,\mathrm{ms}$. It crosses over at $5\,\mathrm{Hz}$.

**Half a sample.** $T/2 = 5\,\mathrm{ms}$.

**Frequency in rad/s.** $\omega = 2\pi \times 5 = 31.416\,\mathrm{rad/s}$.

**Phase.** Multiply them:

$$
\phi = -\omega \frac{T}{2} = -31.416 \times 0.005 = -0.15708\ \mathrm{rad} = -9.00^\circ .
$$

The shortcut agrees at a glance: $-180^\circ \times 5/100 = -9.00^\circ$.

**Gain.** $\sin(0.15708)/0.15708 = 0.99589$, which is $-0.036\,\mathrm{dB}$. That changes nothing.

**In context.** The computational delay, treated fully in a later lesson, typically costs one more whole sample: $-180^\circ \times 5/100 \times 2 = -18^\circ$. That makes $-27^\circ$ from digital implementation alone. If the sensor sits behind the second-order anti-alias filter from the last lesson, add several degrees more. A continuous design with $35^\circ$ of phase margin has, once implemented, well under $10^\circ$. That is not a margin. It is a resonant peak in the closed-loop response and an overshoot the vehicle will show you on the first flight. This is why the standard advice is to design continuous loops with $50$ to $60^\circ$ of phase margin when you know they will fly digitally.
:::

## What the staircase does on the way out

The phase lag is the hold's effect on the loop. There is a second effect, on the actuator and the structure, that the phase number misses. The staircase has sharp corners, and sharp corners carry energy at high frequency.

Recall from the last lesson that sampled signals have copies of their spectrum at every multiple of $f_s$. The hold multiplies all of those copies by the same sinc gain, but it does not remove them. So a command tone at $f$ leaves the converter together with **[[images|images-picture]]** — unwanted echo tones — at $f_s - f$, $f_s + f$, $2f_s - f$, and so on.

How big is the first image? Its size relative to the command is a ratio of two sinc values. Because $\sin(\pi(f_s - f)/f_s) = \sin(\pi f/f_s)$, the sines cancel and only the arguments remain:

$$
\frac{A_{\text{image}}}{A_{\text{fundamental}}} = \frac{f}{f_s - f}.
$$

Exact, and pleasantly simple. A $2\,\mathrm{Hz}$ command from a $50\,\mathrm{Hz}$ loop carries an image at $48\,\mathrm{Hz}$, $2/48 = 1/24$ as large, which is $-27.6\,\mathrm{dB}$. A $1\,\mathrm{Hz}$ command from the same loop images at $49\,\mathrm{Hz}$, at $-33.8\,\mathrm{dB}$.

Whether that matters depends on what lives at $48\,\mathrm{Hz}$. On most vehicles, nothing, and the actuator's own sluggishness swallows it. But a lightly damped structural mode near the sample rate is another story. A mode with **[[quality factor|q-factor]]** $Q = 50$ amplifies whatever reaches it fifty times, turning $-27.6\,\mathrm{dB}$ of image into $+6\,\mathrm{dB}$ of structural response. Now a bending mode is being driven at a frequency set by your frame rate, not by anything the vehicle is doing. The usual symptoms are an audible actuator buzz on the test stand and accelerometer content at exactly $f_s - f$. The usual fixes: move the sample rate, add an analog smoothing filter after the converter, or send commands at a higher output rate than the control law runs — a multi-rate design the last lesson of this module returns to.

::: warning
Do not count the hold's phase twice, and do not leave it out. Both mistakes are common, and they pull in opposite directions.

The first: analyze the loop with the discrete-equivalent plant — which *already contains* the hold, because ZOH equivalence is defined as hold, plant and sampler together — and then multiply by an extra $e^{-sT/2}$ "for the hold". The penalty is counted twice and the design ends up needlessly slow.

The second: analyze the loop continuously with the true plant, find $45^\circ$ of phase margin, and ship it. Nothing in that analysis knows the command is a staircase. The hold's lag is real and in the loop whether or not your model has it.

The rule: decide once. Either work in the $s$ domain with an explicit $e^{-sT/2}$ factor, or in the $z$ domain with a ZOH-equivalent plant. Both are correct. Both together are not.
:::

::: example A 45-degree design dropped onto slower and slower loops
Take a single-axis rigid spacecraft. Inertia $J = 500\,\mathrm{kg\,m^2}$, plant $P(s) = 1/(J s^2)$, and a PD controller $C(s) = k_p + k_d s$. Aim for crossover at $\omega_c = 2\pi \times 1.0 = 6.283\,\mathrm{rad/s}$ with $45^\circ$ of phase margin.

**Design the gains.** The loop is $L(s) = (k_p + k_d s)/(J s^2)$. Its phase is $-180^\circ + \arctan(k_d\omega/k_p)$. For $45^\circ$ of margin the arctangent must be $45^\circ$ at crossover, so $k_d\omega_c = k_p$. The loop gain at $\omega_c$ is then $k_p\sqrt{2}/(J\omega_c^2)$, and setting that to 1 gives

$$
k_p = \frac{J\omega_c^2}{\sqrt 2} = 13{,}958\ \mathrm{N\,m/rad},
\qquad
k_d = \frac{k_p}{\omega_c} = 2{,}221\ \mathrm{N\,m\,s/rad}.
$$

**Add the hold.** Multiply $L(j\omega)$ by $\mathrm{sinc}(\omega T/2)\,e^{-j\omega T/2}$, find the new crossover, and read the margin, at a range of sample rates. The gains stay fixed.

| $f_s$ | $f_s/f_c$ | Hold lag at $1\,\mathrm{Hz}$ | New $\omega_c$ | Phase margin |
| --- | --- | --- | --- | --- |
| $200\,\mathrm{Hz}$ | 200 | $0.90^\circ$ | $6.2830\,\mathrm{rad/s}$ | $44.10^\circ$ |
| $100\,\mathrm{Hz}$ | 100 | $1.80^\circ$ | $6.2825\,\mathrm{rad/s}$ | $43.20^\circ$ |
| $50\,\mathrm{Hz}$ | 50 | $3.60^\circ$ | $6.2804\,\mathrm{rad/s}$ | $41.39^\circ$ |
| $20\,\mathrm{Hz}$ | 20 | $9.00^\circ$ | $6.2661\,\mathrm{rad/s}$ | $35.95^\circ$ |
| $10\,\mathrm{Hz}$ | 10 | $18.00^\circ$ | $6.2160\,\mathrm{rad/s}$ | $26.88^\circ$ |
| $5\,\mathrm{Hz}$ | 5 | $36.00^\circ$ | $6.0328\,\mathrm{rad/s}$ | $9.27^\circ$ |
| $4\,\mathrm{Hz}$ | 4 | $45.00^\circ$ | $5.9104\,\mathrm{rad/s}$ | $0.92^\circ$ |
| $3.5\,\mathrm{Hz}$ | 3.5 | $51.43^\circ$ | $5.8146\,\mathrm{rad/s}$ | $-4.81^\circ$ |

Three things to take from it.

**The shortcut works.** The margin falls almost exactly as $45^\circ - 180^\circ f_c/f_s$ predicts. At $20\,\mathrm{Hz}$ it predicts $36.00^\circ$; the table has $35.95^\circ$. At $10\,\mathrm{Hz}$, $27.00^\circ$ against $26.88^\circ$. At the slowest rates the sinc droop pulls the crossover down a little, and the hold's lag is smaller at that lower frequency, so the true margin beats the shortcut: at $4\,\mathrm{Hz}$ the shortcut says $0^\circ$ and the model gives $0.92^\circ$. The shortcut errs on the safe side, so it is safe to use.

**There is a hard floor.** The loop goes unstable between $4$ and $3.5$ samples per cycle of the crossover frequency — from the hold alone, with no computing delay and no filters. Even a flight computer that answered instantly could not close this loop at $3.5\,\mathrm{Hz}$.

**None of it is a tuning problem.** $k_p$ and $k_d$ are the same in every row. The only change is how often the answer is written to the converter.
:::

::: note
A **first-order hold** draws a straight line through the last two samples instead of a flat step, and it is the natural next thing to try. It is worse for feedback. Its phase lag near DC is smaller, but it overshoots on sudden changes, and its gain rises above 1 before rolling off. Because it needs two samples to draw its line, it also adds delay on exactly the sample that matters. It is useful for rebuilding trajectories or replaying recorded data offline, where the extra smoothness is worth having. Inside a feedback loop, the zero-order hold is what flies, and its lag is paid for in the controller design, not fixed in the reconstruction.
:::

## Check yourself

::: check
A thrust-vector-control loop runs at $200\,\mathrm{Hz}$ and crosses over at $8\,\mathrm{Hz}$. How much phase does the zero-order hold cost at crossover, and how much gain? If no single implementation effect may cost more than $5^\circ$, does the hold pass?
:::

::: answer
**Phase.** The ratio is $f/f_s = 8/200 = 0.04$, so the lag is $180^\circ \times 0.04 = 7.2^\circ$. In radians, $\omega T/2 = 2\pi \times 8 \times 0.0025 = 0.1257\,\mathrm{rad}$, which is the same $7.2^\circ$.

**Gain.** $\sin(0.1257)/0.1257 = 0.99737$, that is $-0.023\,\mathrm{dB}$ — nothing.

**Verdict.** The hold fails the $5^\circ$ rule. To pass, $180 \times 8/f_s \le 5$, so $f_s \ge 288\,\mathrm{Hz}$ — in practice $320\,\mathrm{Hz}$ or $400\,\mathrm{Hz}$. Whether that rule is wise is a separate question. A flat per-effect budget is crude; the usual approach is to budget the *total* implementation lag at crossover and let the pieces trade against each other.
:::

::: check
Explain, from the frequency response, why the zero-order hold takes almost nothing from gain margin but a great deal from phase margin, and why that makes it more dangerous than an equal-sized gain error.
:::

::: answer
The normalized hold is $\mathrm{sinc}(\omega T/2)\,e^{-j\omega T/2}$: a gain that stays within $0.15\,\mathrm{dB}$ of 1 out to a tenth of the sample rate, times a pure delay whose phase grows in a straight line without limit. Gain margin asks about the *gain* at the frequency where the phase is $-180^\circ$. Phase margin asks about the *phase* at the frequency where the gain is 1. The hold barely touches the first and moves the second by $180^\circ f_c/f_s$.

It is more dangerous than a gain error for two reasons. A gain error shows up at once in a step response as the wrong size, and an analysis with a gain uncertainty band catches it. Phase lag shows up as reduced damping, which looks like imperfect tuning rather than a modeling error. And gain errors are bounded by hardware calibration, while the hold's lag keeps growing with frequency, so it decides how fast you can make the loop.
:::

::: check
A $50\,\mathrm{Hz}$ loop commands a gimbal at $3\,\mathrm{Hz}$. Where does the first image of that command land, how big is it relative to the command, and what would make it a problem?
:::

::: answer
**Where.** $f_s - f = 50 - 3 = 47\,\mathrm{Hz}$.

**How big.** $f/(f_s - f) = 3/47 = 0.0638$, that is $-23.9\,\mathrm{dB}$.

**When it matters.** When something resonant lives near $47\,\mathrm{Hz}$. A structural mode there with $1\%$ damping has $Q = 1/(2\zeta) = 50$, so it amplifies the image fifty times: $0.0638 \times 50 = 3.2$ times the response the command itself produces at low frequency. The vehicle now has a $47\,\mathrm{Hz}$ vibration driven purely by the steps in the command.

Notice the nasty pairing with the last lesson. If the $50\,\mathrm{Hz}$ sampler then reads that $47\,\mathrm{Hz}$ mode, it folds to $3\,\mathrm{Hz}$ — the commanded frequency. The excitation and the aliased measurement are locked together. That is exactly how you get a slowly growing oscillation nobody can pin on a gain.
:::

::: check
A colleague models the zero-order hold as a pure delay of $T/2$, instead of $\mathrm{sinc}(\omega T/2)e^{-j\omega T/2}$. At a crossover of one eighth of the sample rate, what error does that introduce, and in which direction?
:::

::: answer
None in phase: the $e^{-j\omega T/2}$ factor *is* the hold's phase, exactly, at every frequency. The error is in the gain. At $f/f_s = 1/8$, $\omega T/2 = \pi/8 = 0.3927\,\mathrm{rad}$, and $\mathrm{sinc} = \sin(0.3927)/0.3927 = 0.9745$. So the true hold has $0.22\,\mathrm{dB}$ less gain than the pure-delay model.

The direction is friendly. The model claims a little more loop gain than exists, so it predicts a slightly high crossover and a slightly small gain margin. Both errors are conservative, and both are a fraction of a decibel at any sensible sample rate. That is why $e^{-sT/2}$ is the standard tool for a quick budget: exact where it matters, pessimistic where it does not.
:::

::: check
Two designs cross over at $2\,\mathrm{Hz}$. One samples at $40\,\mathrm{Hz}$, the other at $80\,\mathrm{Hz}$. How much phase margin does doubling the rate recover, and what would you have to do to recover the same amount without changing the rate?
:::

::: answer
**Doubling.** At $40\,\mathrm{Hz}$ the hold costs $180 \times 2/40 = 9.0^\circ$. At $80\,\mathrm{Hz}$ it costs $4.5^\circ$. Doubling gives back $4.5^\circ$. Each further doubling gives back half of what is left — diminishing returns, which is what sets the upper end of any sample-rate argument.

**Without changing the rate.** Add **[[lead|lead-bridge]]**: a zero-pole pair straddling crossover. The classical relation between maximum lead $\phi_m$ and the pole-zero ratio $\alpha$ is $\sin\phi_m = (1-\alpha)/(1+\alpha)$. For $\phi_m = 4.5^\circ$, $\alpha = 0.855$ — a very gentle lead, centered at $2\,\mathrm{Hz}$. It raises the gain by $1/\sqrt{\alpha} = 1.08$ at crossover, and more above it.

That extra high-frequency gain is the catch: it amplifies sensor noise and any structural content that got past the anti-alias filter. Doubling the rate costs CPU time; buying the same phase with lead costs noise. Which you choose depends on which budget has room — the subject of the sample-rate lesson later in this module.
:::

## Summary

| Item | Statement |
| --- | --- |
| Zero-order hold | Holds each command constant for one sample period; what a DAC does |
| Transfer function | $G_{h0}(s) = (1 - e^{-sT})/s$; with the sampler's $1/T$, DC gain 1 |
| Frequency response | $G_{h0}(j\omega) = T\,e^{-j\omega T/2}\,\dfrac{\sin(\omega T/2)}{\omega T/2}$ |
| Phase | $\angle G_{h0} = -\omega T/2$ exactly — a half-sample delay; equivalently $-180^\circ f/f_s$ |
| Gain | $\lvert \mathrm{sinc}(\omega T/2)\rvert$: $-0.036\,\mathrm{dB}$ at $f_s/20$, $-3.92\,\mathrm{dB}$ at Nyquist |
| Quick number | $100\,\mathrm{Hz}$ loop, $5\,\mathrm{Hz}$ crossover: the hold costs $9^\circ$; computational delay adds roughly one more sample |
| Output images | A command at $f$ comes out with images at $kf_s \pm f$; the first is smaller by $f/(f_s - f)$ |
| Modeling rule | Use an explicit $e^{-sT/2}$ in the $s$ domain *or* a ZOH-equivalent plant in the $z$ domain, never both |
| Design habit | A continuous design meant to fly digitally should carry $50$ to $60^\circ$ of phase margin |

The next lesson gives you algebra that works on sequences directly, instead of patching continuous results with delay factors: the z-transform, and the discrete transfer functions built from it.

::: context dac Numbers in, voltage out
A **digital-to-analog converter**, or DAC, is the mirror image of the ADC from the last lesson. The flight computer writes a number into it, and it produces a matching voltage or current that drives an actuator — a gimbal servo valve, a reaction-wheel motor, a thruster driver.

It has no idea what the next number will be, so the only sensible thing it can do between writes is keep putting out the last one. That is the zero-order hold. It is not a design choice somebody made; it is what a register does.
:::

::: context staircase-picture The staircase and its hidden delay
Below, a smooth command (blue) is sampled eight times per cycle and held (black). The orange dashed curve is the *same* smooth command shifted half a sample later. It runs through the middle of every stair.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 204" font-family="Inter, Arial, sans-serif">
<line x1="30" y1="90" x2="350" y2="90" stroke="#6c7a93"/>
<polyline points="30.0,90.0 31.1,88.7 32.1,87.3 33.2,86.0 34.2,84.6 35.3,83.3 36.4,82.0 37.4,80.7 38.5,79.3 39.5,78.0 40.6,76.7 41.7,75.4 42.7,74.1 43.8,72.8 44.8,71.6 45.9,70.3 47.0,69.0 48.0,67.8 49.1,66.6 50.1,65.3 51.2,64.1 52.3,62.9 53.3,61.8 54.4,60.6 55.4,59.4 56.5,58.3 57.5,57.2 58.6,56.1 59.7,55.0 60.7,54.0 61.8,52.9 62.8,51.9 63.9,50.9 65.0,49.9 66.0,49.0 67.1,48.0 68.1,47.1 69.2,46.2 70.3,45.4 71.3,44.5 72.4,43.7 73.4,42.9 74.5,42.1 75.6,41.4 76.6,40.7 77.7,40.0 78.7,39.3 79.8,38.7 80.9,38.1 81.9,37.5 83.0,36.9 84.0,36.4 85.1,35.9 86.2,35.4 87.2,35.0 88.3,34.6 89.3,34.2 90.4,33.8 91.5,33.5 92.5,33.2 93.6,33.0 94.6,32.7 95.7,32.5 96.8,32.4 97.8,32.2 98.9,32.1 99.9,32.1 101.0,32.0 102.0,32.0 103.1,32.0 104.2,32.1 105.2,32.1 106.3,32.3 107.3,32.4 108.4,32.6 109.5,32.8 110.5,33.0 111.6,33.3 112.6,33.6 113.7,33.9 114.8,34.2 115.8,34.6 116.9,35.0 117.9,35.5 119.0,35.9 120.1,36.4 121.1,37.0 122.2,37.5 123.2,38.1 124.3,38.7 125.4,39.4 126.4,40.0 127.5,40.7 128.5,41.5 129.6,42.2 130.7,43.0 131.7,43.8 132.8,44.6 133.8,45.4 134.9,46.3 136.0,47.2 137.0,48.1 138.1,49.1 139.1,50.0 140.2,51.0 141.3,52.0 142.3,53.0 143.4,54.1 144.4,55.1 145.5,56.2 146.5,57.3 147.6,58.4 148.7,59.6 149.7,60.7 150.8,61.9 151.8,63.0 152.9,64.2 154.0,65.4 155.0,66.7 156.1,67.9 157.1,69.1 158.2,70.4 159.3,71.7 160.3,72.9 161.4,74.2 162.4,75.5 163.5,76.8 164.6,78.1 165.6,79.5 166.7,80.8 167.7,82.1 168.8,83.4 169.9,84.8 170.9,86.1 172.0,87.4 173.0,88.8 174.1,90.1 175.2,91.5 176.2,92.8 177.3,94.1 178.3,95.5 179.4,96.8 180.5,98.1 181.5,99.5 182.6,100.8 183.6,102.1 184.7,103.4 185.8,104.7 186.8,106.0 187.9,107.3 188.9,108.6 190.0,109.8 191.0,111.1 192.1,112.3 193.2,113.6 194.2,114.8 195.3,116.0 196.3,117.2 197.4,118.3 198.5,119.5 199.5,120.7 200.6,121.8 201.6,122.9 202.7,124.0 203.8,125.1 204.8,126.1 205.9,127.2 206.9,128.2 208.0,129.2 209.1,130.2 210.1,131.1 211.2,132.1 212.2,133.0 213.3,133.9 214.4,134.7 215.4,135.6 216.5,136.4 217.5,137.2 218.6,137.9 219.7,138.7 220.7,139.4 221.8,140.1 222.8,140.7 223.9,141.4 225.0,142.0 226.0,142.6 227.1,143.1 228.1,143.6 229.2,144.1 230.3,144.6 231.3,145.0 232.4,145.5 233.4,145.8 234.5,146.2 235.5,146.5 236.6,146.8 237.7,147.0 238.7,147.3 239.8,147.5 240.8,147.6 241.9,147.8 243.0,147.9 244.0,147.9 245.1,148.0 246.1,148.0 247.2,148.0 248.3,147.9 249.3,147.8 250.4,147.7 251.4,147.6 252.5,147.4 253.6,147.2 254.6,147.0 255.7,146.7 256.7,146.4 257.8,146.1 258.9,145.7 259.9,145.3 261.0,144.9 262.0,144.5 263.1,144.0 264.2,143.5 265.2,143.0 266.3,142.4 267.3,141.8 268.4,141.2 269.5,140.6 270.5,139.9 271.6,139.2 272.6,138.5 273.7,137.7 274.8,137.0 275.8,136.2 276.9,135.3 277.9,134.5 279.0,133.6 280.0,132.7 281.1,131.8 282.2,130.9 283.2,129.9 284.3,128.9 285.3,127.9 286.4,126.9 287.5,125.8 288.5,124.8 289.6,123.7 290.6,122.6 291.7,121.5 292.8,120.3 293.8,119.2 294.9,118.0 295.9,116.8 297.0,115.7 298.1,114.4 299.1,113.2 300.2,112.0 301.2,110.7 302.3,109.5 303.4,108.2 304.4,106.9 305.5,105.6 306.5,104.4 307.6,103.1 308.7,101.7 309.7,100.4 310.8,99.1 311.8,97.8 312.9,96.4 314.0,95.1 315.0,93.8 316.1,92.4 317.1,91.1 318.2,89.8 319.3,88.4 320.3,87.1 321.4,85.7 322.4,84.4 323.5,83.1 324.5,81.7 325.6,80.4 326.7,79.1 327.7,77.8 328.8,76.5 329.8,75.2 330.9,73.9 332.0,72.6 333.0,71.3 334.1,70.1 335.1,68.8 336.2,67.6 337.3,66.3 338.3,65.1 339.4,63.9 340.4,62.7 341.5,61.5 342.6,60.4 343.6,59.2 344.7,58.1 345.7,57.0 346.8,55.9" fill="none" stroke="#1d6fd1" stroke-width="1.5"/>
<polyline points="48.0,90.0 49.0,88.7 50.0,87.5 51.0,86.2 52.0,84.9 53.0,83.7 54.0,82.4 55.0,81.2 56.0,79.9 57.0,78.7 58.0,77.5 59.0,76.2 60.0,75.0 61.0,73.8 62.0,72.6 63.0,71.4 64.0,70.2 65.0,69.0 66.0,67.8 67.0,66.7 68.0,65.5 69.0,64.4 70.0,63.2 71.0,62.1 72.0,61.0 73.0,59.9 74.0,58.9 75.0,57.8 76.0,56.8 77.0,55.7 78.0,54.7 79.0,53.7 80.0,52.7 81.0,51.8 82.0,50.8 83.0,49.9 84.0,49.0 85.0,48.1 86.0,47.3 87.0,46.4 88.0,45.6 89.0,44.8 90.0,44.0 91.0,43.2 92.0,42.5 93.0,41.8 94.0,41.1 95.0,40.4 96.0,39.8 97.0,39.2 98.0,38.6 99.0,38.0 100.0,37.5 101.0,36.9 102.0,36.4 103.0,36.0 104.0,35.5 105.0,35.1 106.0,34.7 107.0,34.3 108.0,34.0 109.0,33.7 110.0,33.4 111.0,33.1 112.0,32.9 113.0,32.7 114.0,32.5 115.0,32.4 116.0,32.2 117.0,32.1 118.0,32.1 119.0,32.0 120.0,32.0 121.0,32.0 122.0,32.1 122.9,32.1 123.9,32.2 124.9,32.3 125.9,32.5 126.9,32.7 127.9,32.9 128.9,33.1 129.9,33.4 130.9,33.6 131.9,34.0 132.9,34.3 133.9,34.7 134.9,35.1 135.9,35.5 136.9,35.9 137.9,36.4 138.9,36.9 139.9,37.4 140.9,37.9 141.9,38.5 142.9,39.1 143.9,39.7 144.9,40.4 145.9,41.0 146.9,41.7 147.9,42.4 148.9,43.2 149.9,43.9 150.9,44.7 151.9,45.5 152.9,46.3 153.9,47.2 154.9,48.0 155.9,48.9 156.9,49.8 157.9,50.7 158.9,51.7 159.9,52.6 160.9,53.6 161.9,54.6 162.9,55.6 163.9,56.7 164.9,57.7 165.9,58.8 166.9,59.8 167.9,60.9 168.9,62.0 169.9,63.1 170.9,64.3 171.9,65.4 172.9,66.5 173.9,67.7 174.9,68.9 175.9,70.1 176.9,71.3 177.9,72.5 178.9,73.7 179.9,74.9 180.9,76.1 181.9,77.3 182.9,78.6 183.9,79.8 184.9,81.1 185.9,82.3 186.9,83.6 187.9,84.8 188.9,86.1 189.9,87.4 190.9,88.6 191.9,89.9 192.9,91.1 193.9,92.4 194.9,93.7 195.9,94.9 196.9,96.2 197.9,97.4 198.9,98.7 199.9,99.9 200.9,101.2 201.9,102.4 202.9,103.7 203.9,104.9 204.9,106.1 205.9,107.3 206.9,108.5 207.9,109.7 208.9,110.9 209.9,112.1 210.9,113.2 211.9,114.4 212.9,115.5 213.9,116.7 214.9,117.8 215.9,118.9 216.9,120.0 217.9,121.0 218.9,122.1 219.9,123.1 220.9,124.2 221.9,125.2 222.9,126.2 223.9,127.2 224.9,128.1 225.9,129.1 226.9,130.0 227.9,130.9 228.9,131.8 229.9,132.7 230.9,133.5 231.9,134.3 232.9,135.1 233.9,135.9 234.9,136.7 235.9,137.4 236.9,138.1 237.9,138.8 238.9,139.5 239.9,140.1 240.9,140.8 241.9,141.4 242.9,141.9 243.9,142.5 244.9,143.0 245.9,143.5 246.9,144.0 247.9,144.4 248.9,144.9 249.9,145.3 250.9,145.6 251.9,146.0 252.9,146.3 253.9,146.6 254.9,146.9 255.9,147.1 256.9,147.3 257.9,147.5 258.9,147.6 259.9,147.8 260.9,147.9 261.9,147.9 262.9,148.0 263.9,148.0 264.9,148.0 265.9,148.0 266.9,147.9 267.9,147.8 268.9,147.7 269.9,147.5 270.9,147.4 271.9,147.2 272.8,146.9 273.8,146.7 274.8,146.4 275.8,146.1 276.8,145.7 277.8,145.4 278.8,145.0 279.8,144.6 280.8,144.1 281.8,143.7 282.8,143.2 283.8,142.6 284.8,142.1 285.8,141.5 286.8,140.9 287.8,140.3 288.8,139.7 289.8,139.0 290.8,138.3 291.8,137.6 292.8,136.9 293.8,136.1 294.8,135.4 295.8,134.6 296.8,133.7 297.8,132.9 298.8,132.0 299.8,131.2 300.8,130.3 301.8,129.3 302.8,128.4 303.8,127.4 304.8,126.5 305.8,125.5 306.8,124.5 307.8,123.4 308.8,122.4 309.8,121.4 310.8,120.3 311.8,119.2 312.8,118.1 313.8,117.0 314.8,115.9 315.8,114.7 316.8,113.6 317.8,112.4 318.8,111.2 319.8,110.1 320.8,108.9 321.8,107.7 322.8,106.5 323.8,105.2 324.8,104.0 325.8,102.8 326.8,101.5 327.8,100.3 328.8,99.1 329.8,97.8 330.8,96.6 331.8,95.3 332.8,94.0 333.8,92.8 334.8,91.5 335.8,90.2 336.8,89.0 337.8,87.7 338.8,86.5 339.8,85.2 340.8,83.9 341.8,82.7 342.8,81.4 343.8,80.2 344.8,78.9 345.8,77.7 346.8,76.5" fill="none" stroke="#f2b880" stroke-width="2.5" stroke-dasharray="6 4"/>
<polyline points="30.0,90.0 66.0,90.0 66.0,49.0 102.0,49.0 102.0,32.0 138.0,32.0 138.0,49.0 174.0,49.0 174.0,90.0 210.0,90.0 210.0,131.0 246.0,131.0 246.0,148.0 282.0,148.0 282.0,131.0 318.0,131.0 318.0,90.0 346.8,90.0" fill="none" stroke="#1f2a44" stroke-width="2"/>
<circle cx="30.0" cy="90.0" r="3.5" fill="#1f2a44"/>
<circle cx="66.0" cy="49.0" r="3.5" fill="#1f2a44"/>
<circle cx="102.0" cy="32.0" r="3.5" fill="#1f2a44"/>
<circle cx="138.0" cy="49.0" r="3.5" fill="#1f2a44"/>
<circle cx="174.0" cy="90.0" r="3.5" fill="#1f2a44"/>
<circle cx="210.0" cy="131.0" r="3.5" fill="#1f2a44"/>
<circle cx="246.0" cy="148.0" r="3.5" fill="#1f2a44"/>
<circle cx="282.0" cy="131.0" r="3.5" fill="#1f2a44"/>
<circle cx="318.0" cy="90.0" r="3.5" fill="#1f2a44"/>
<text x="30" y="166" font-size="12" fill="#1d6fd1" text-anchor="start">blue: the smooth command</text>
<text x="30" y="181" font-size="12" fill="#1f2a44" text-anchor="start">black: the held staircase the actuator gets</text>
<text x="30" y="196" font-size="12" fill="#b86a1e" text-anchor="start">orange: the smooth command delayed by T/2</text>
</svg>
```

That is the zero-order hold in one picture. On average the staircase sits where the smooth signal was half a sample ago. The small sharp corners are the images discussed later; the half-sample shift is the phase lag.
:::

::: context zero-order-name Why "zero-order"
Between two samples, a reconstructor has to guess the signal. The simplest guess is a **polynomial** — a sum of powers of time — through recent samples. A polynomial of degree zero is a constant: that is the zero-order hold. Degree one is a straight line through the last two samples: the first-order hold. Higher degrees fit curves through more samples.

Each step up needs more past samples, and in real time it has to wait for them. That wait is why higher-order holds lose in feedback loops.
:::

::: context delay-laplace Why a delay is e to the minus sT
Shift any signal $f(t)$ later by $T$ seconds and its Laplace transform gets multiplied by $e^{-sT}$. The reason is one substitution. The delayed signal's transform is $\int_T^\infty f(t - T)e^{-st}\,dt$. Put $\tau = t - T$ and it becomes $e^{-sT}\int_0^\infty f(\tau)e^{-s\tau}\,d\tau = e^{-sT}F(s)$.

At $s = j\omega$, $e^{-j\omega T}$ has size 1 and angle $-\omega T$. A delay changes no gains; it only adds phase lag that grows with frequency. You met this in the signals and systems module as the transport delay that Padé approximations stand in for.
:::

::: context euler-sine The sine hiding in two exponentials
Euler's formula says $e^{jx} = \cos x + j\sin x$, and so $e^{-jx} = \cos x - j\sin x$. Subtract the second from the first. The cosines cancel and the sines double:

$$
e^{jx} - e^{-jx} = 2j\sin x.
$$

With $x = \omega T/2$, that turns the bracket in the derivation into a plain sine. Pulling out half the exponent first was the move that made this possible — a balanced pair $e^{jx}$ and $e^{-jx}$ always collapses to a sine or a cosine.
:::

::: context droop-picture Gain barely moves, phase runs away
Here are both parts of the hold's response, from DC to Nyquist, on scales chosen so each fills the same box. The phase (red) falls in a straight line to $-90^\circ$. The gain (blue) has lost only $0.14\,\mathrm{dB}$ by a tenth of the sample rate and $3.92\,\mathrm{dB}$ at Nyquist.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
<rect x="50" y="30" width="260" height="110" fill="none" stroke="#6c7a93"/>
<polyline points="50.1,30.0 51.4,30.0 52.7,30.0 54.0,30.0 55.3,30.0 56.6,30.0 57.9,30.0 59.2,30.0 60.5,30.1 61.8,30.1 63.1,30.1 64.4,30.1 65.7,30.1 67.0,30.1 68.3,30.2 69.6,30.2 71.0,30.2 72.3,30.2 73.6,30.3 74.9,30.3 76.2,30.3 77.5,30.4 78.8,30.4 80.1,30.4 81.4,30.5 82.7,30.5 84.0,30.6 85.3,30.6 86.6,30.7 87.9,30.7 89.2,30.7 90.5,30.8 91.9,30.9 93.2,30.9 94.5,31.0 95.8,31.0 97.1,31.1 98.4,31.1 99.7,31.2 101.0,31.3 102.3,31.3 103.6,31.4 104.9,31.5 106.2,31.5 107.5,31.6 108.8,31.7 110.1,31.8 111.4,31.8 112.8,31.9 114.1,32.0 115.4,32.1 116.7,32.2 118.0,32.3 119.3,32.3 120.6,32.4 121.9,32.5 123.2,32.6 124.5,32.7 125.8,32.8 127.1,32.9 128.4,33.0 129.7,33.1 131.0,33.2 132.3,33.3 133.7,33.4 135.0,33.5 136.3,33.6 137.6,33.7 138.9,33.9 140.2,34.0 141.5,34.1 142.8,34.2 144.1,34.3 145.4,34.5 146.7,34.6 148.0,34.7 149.3,34.8 150.6,35.0 151.9,35.1 153.2,35.2 154.6,35.4 155.9,35.5 157.2,35.6 158.5,35.8 159.8,35.9 161.1,36.1 162.4,36.2 163.7,36.4 165.0,36.5 166.3,36.7 167.6,36.8 168.9,37.0 170.2,37.1 171.5,37.3 172.8,37.4 174.1,37.6 175.5,37.8 176.8,37.9 178.1,38.1 179.4,38.3 180.7,38.5 182.0,38.6 183.3,38.8 184.6,39.0 185.9,39.2 187.2,39.3 188.5,39.5 189.8,39.7 191.1,39.9 192.4,40.1 193.7,40.3 195.0,40.5 196.4,40.7 197.7,40.9 199.0,41.1 200.3,41.3 201.6,41.5 202.9,41.7 204.2,41.9 205.5,42.1 206.8,42.3 208.1,42.5 209.4,42.7 210.7,42.9 212.0,43.1 213.3,43.4 214.6,43.6 215.9,43.8 217.3,44.0 218.6,44.3 219.9,44.5 221.2,44.7 222.5,45.0 223.8,45.2 225.1,45.4 226.4,45.7 227.7,45.9 229.0,46.2 230.3,46.4 231.6,46.7 232.9,46.9 234.2,47.2 235.5,47.4 236.8,47.7 238.2,48.0 239.5,48.2 240.8,48.5 242.1,48.7 243.4,49.0 244.7,49.3 246.0,49.6 247.3,49.8 248.6,50.1 249.9,50.4 251.2,50.7 252.5,51.0 253.8,51.3 255.1,51.5 256.4,51.8 257.7,52.1 259.1,52.4 260.4,52.7 261.7,53.0 263.0,53.3 264.3,53.6 265.6,53.9 266.9,54.3 268.2,54.6 269.5,54.9 270.8,55.2 272.1,55.5 273.4,55.8 274.7,56.2 276.0,56.5 277.3,56.8 278.6,57.2 280.0,57.5 281.3,57.8 282.6,58.2 283.9,58.5 285.2,58.9 286.5,59.2 287.8,59.6 289.1,59.9 290.4,60.3 291.7,60.6 293.0,61.0 294.3,61.4 295.6,61.7 296.9,62.1 298.2,62.5 299.5,62.8 300.9,63.2 302.2,63.6 303.5,64.0 304.8,64.4 306.1,64.8 307.4,65.2 308.7,65.6 310.0,66.0" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
<polyline points="50.1,30.0 51.4,30.6 52.7,31.1 54.0,31.7 55.3,32.2 56.6,32.8 57.9,33.3 59.2,33.9 60.5,34.4 61.8,35.0 63.1,35.5 64.4,36.1 65.7,36.7 67.0,37.2 68.3,37.8 69.6,38.3 71.0,38.9 72.3,39.4 73.6,40.0 74.9,40.5 76.2,41.1 77.5,41.6 78.8,42.2 80.1,42.7 81.4,43.3 82.7,43.8 84.0,44.4 85.3,44.9 86.6,45.5 87.9,46.0 89.2,46.6 90.5,47.2 91.9,47.7 93.2,48.3 94.5,48.8 95.8,49.4 97.1,49.9 98.4,50.5 99.7,51.0 101.0,51.6 102.3,52.1 103.6,52.7 104.9,53.2 106.2,53.8 107.5,54.3 108.8,54.9 110.1,55.4 111.4,56.0 112.8,56.5 114.1,57.1 115.4,57.7 116.7,58.2 118.0,58.8 119.3,59.3 120.6,59.9 121.9,60.4 123.2,61.0 124.5,61.5 125.8,62.1 127.1,62.6 128.4,63.2 129.7,63.7 131.0,64.3 132.3,64.8 133.7,65.4 135.0,65.9 136.3,66.5 137.6,67.0 138.9,67.6 140.2,68.2 141.5,68.7 142.8,69.3 144.1,69.8 145.4,70.4 146.7,70.9 148.0,71.5 149.3,72.0 150.6,72.6 151.9,73.1 153.2,73.7 154.6,74.2 155.9,74.8 157.2,75.3 158.5,75.9 159.8,76.4 161.1,77.0 162.4,77.6 163.7,78.1 165.0,78.7 166.3,79.2 167.6,79.8 168.9,80.3 170.2,80.9 171.5,81.4 172.8,82.0 174.1,82.5 175.5,83.1 176.8,83.6 178.1,84.2 179.4,84.7 180.7,85.3 182.0,85.8 183.3,86.4 184.6,86.9 185.9,87.5 187.2,88.1 188.5,88.6 189.8,89.2 191.1,89.7 192.4,90.3 193.7,90.8 195.0,91.4 196.4,91.9 197.7,92.5 199.0,93.0 200.3,93.6 201.6,94.1 202.9,94.7 204.2,95.2 205.5,95.8 206.8,96.3 208.1,96.9 209.4,97.4 210.7,98.0 212.0,98.6 213.3,99.1 214.6,99.7 215.9,100.2 217.3,100.8 218.6,101.3 219.9,101.9 221.2,102.4 222.5,103.0 223.8,103.5 225.1,104.1 226.4,104.6 227.7,105.2 229.0,105.7 230.3,106.3 231.6,106.8 232.9,107.4 234.2,107.9 235.5,108.5 236.8,109.1 238.2,109.6 239.5,110.2 240.8,110.7 242.1,111.3 243.4,111.8 244.7,112.4 246.0,112.9 247.3,113.5 248.6,114.0 249.9,114.6 251.2,115.1 252.5,115.7 253.8,116.2 255.1,116.8 256.4,117.3 257.7,117.9 259.1,118.4 260.4,119.0 261.7,119.6 263.0,120.1 264.3,120.7 265.6,121.2 266.9,121.8 268.2,122.3 269.5,122.9 270.8,123.4 272.1,124.0 273.4,124.5 274.7,125.1 276.0,125.6 277.3,126.2 278.6,126.7 280.0,127.3 281.3,127.8 282.6,128.4 283.9,128.9 285.2,129.5 286.5,130.1 287.8,130.6 289.1,131.2 290.4,131.7 291.7,132.3 293.0,132.8 294.3,133.4 295.6,133.9 296.9,134.5 298.2,135.0 299.5,135.6 300.9,136.1 302.2,136.7 303.5,137.2 304.8,137.8 306.1,138.3 307.4,138.9 308.7,139.4 310.0,140.0" fill="none" stroke="#b4232c" stroke-width="2.5"/>
<text x="45" y="34.0" font-size="11" fill="#1d6fd1" text-anchor="end">0 dB</text>
<text x="45" y="89.0" font-size="11" fill="#1d6fd1" text-anchor="end">−6 dB</text>
<text x="45" y="144.0" font-size="11" fill="#1d6fd1" text-anchor="end">−12 dB</text>
<text x="315" y="34.0" font-size="11" fill="#b4232c" text-anchor="start">0°</text>
<text x="315" y="89.0" font-size="11" fill="#b4232c" text-anchor="start">−45°</text>
<text x="315" y="144.0" font-size="11" fill="#b4232c" text-anchor="start">−90°</text>
<text x="50.0" y="156" font-size="11" fill="#1f2a44" text-anchor="middle">0</text>
<text x="102.0" y="156" font-size="11" fill="#1f2a44" text-anchor="middle">0.1</text>
<text x="154.0" y="156" font-size="11" fill="#1f2a44" text-anchor="middle">0.2</text>
<text x="206.0" y="156" font-size="11" fill="#1f2a44" text-anchor="middle">0.3</text>
<text x="258.0" y="156" font-size="11" fill="#1f2a44" text-anchor="middle">0.4</text>
<text x="310.0" y="156" font-size="11" fill="#1f2a44" text-anchor="middle">0.5</text>
<text x="180" y="172" font-size="11" fill="#1f2a44" text-anchor="middle">f / fs (0.5 is Nyquist)</text>
<text x="60" y="22" font-size="12" fill="#1d6fd1" text-anchor="start">blue: gain of the hold</text>
<text x="210" y="22" font-size="12" fill="#b4232c" text-anchor="start">red: its phase</text>
</svg>
```

In the range where control loops actually cross over — below about $f_s/10$ — the blue line is flat and the red line is not. That is why engineers treat the hold as a pure delay.
:::

::: context phase-margin-recap Phase margin, briefly
From the classical control module: at the **crossover frequency**, where the loop gain is exactly 1, the **phase margin** is how far the loop's phase is from $-180^\circ$. At $-180^\circ$ with gain 1, the loop turns a signal upside down and the minus sign of negative feedback turns it upright again, so it comes back identical and keeps itself going forever.

Less margin means more overshoot and ringing. About $45^\circ$ gives a well-behaved response; below about $20^\circ$ the ringing is severe. Every degree the hold takes comes straight out of this number.
:::

::: context images-picture Where the images sit
A command at $f = 0.1 f_s$ comes out of the converter with echo tones. Their heights follow the hold's sinc gain (dashed), which has zeros at every multiple of $f_s$ — so the images near $f_s$ and $2f_s$ are small, but not zero.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 184" font-family="Inter, Arial, sans-serif">
<line x1="24" y1="140" x2="340" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
<polyline points="30.1,40.0 30.9,40.0 31.7,40.0 32.4,40.0 33.2,40.1 33.9,40.1 34.7,40.2 35.4,40.2 36.2,40.3 36.9,40.3 37.7,40.4 38.4,40.5 39.2,40.6 39.9,40.7 40.7,40.8 41.4,41.0 42.2,41.1 42.9,41.2 43.7,41.4 44.4,41.5 45.2,41.7 45.9,41.8 46.7,42.0 47.4,42.2 48.2,42.4 48.9,42.6 49.7,42.8 50.4,43.0 51.2,43.3 51.9,43.5 52.7,43.7 53.4,44.0 54.2,44.2 54.9,44.5 55.7,44.8 56.5,45.0 57.2,45.3 58.0,45.6 58.7,45.9 59.5,46.2 60.2,46.5 61.0,46.9 61.7,47.2 62.5,47.5 63.2,47.9 64.0,48.2 64.7,48.6 65.5,48.9 66.2,49.3 67.0,49.7 67.7,50.1 68.5,50.5 69.2,50.9 70.0,51.3 70.7,51.7 71.5,52.1 72.2,52.5 73.0,53.0 73.7,53.4 74.5,53.9 75.2,54.3 76.0,54.8 76.7,55.2 77.5,55.7 78.2,56.2 79.0,56.7 79.7,57.1 80.5,57.6 81.3,58.1 82.0,58.6 82.8,59.1 83.5,59.7 84.3,60.2 85.0,60.7 85.8,61.2 86.5,61.8 87.3,62.3 88.0,62.9 88.8,63.4 89.5,64.0 90.3,64.5 91.0,65.1 91.8,65.7 92.5,66.2 93.3,66.8 94.0,67.4 94.8,68.0 95.5,68.6 96.3,69.2 97.0,69.8 97.8,70.4 98.5,71.0 99.3,71.6 100.0,72.2 100.8,72.8 101.5,73.4 102.3,74.1 103.0,74.7 103.8,75.3 104.5,76.0 105.3,76.6 106.1,77.2 106.8,77.9 107.6,78.5 108.3,79.2 109.1,79.8 109.8,80.5 110.6,81.1 111.3,81.8 112.1,82.5 112.8,83.1 113.6,83.8 114.3,84.4 115.1,85.1 115.8,85.8 116.6,86.5 117.3,87.1 118.1,87.8 118.8,88.5 119.6,89.2 120.3,89.8 121.1,90.5 121.8,91.2 122.6,91.9 123.3,92.6 124.1,93.3 124.8,93.9 125.6,94.6 126.3,95.3 127.1,96.0 127.8,96.7 128.6,97.4 129.3,98.1 130.1,98.7 130.9,99.4 131.6,100.1 132.4,100.8 133.1,101.5 133.9,102.2 134.6,102.9 135.4,103.5 136.1,104.2 136.9,104.9 137.6,105.6 138.4,106.3 139.1,106.9 139.9,107.6 140.6,108.3 141.4,109.0 142.1,109.7 142.9,110.3 143.6,111.0 144.4,111.7 145.1,112.3 145.9,113.0 146.6,113.7 147.4,114.3 148.1,115.0 148.9,115.6 149.6,116.3 150.4,117.0 151.1,117.6 151.9,118.3 152.6,118.9 153.4,119.5 154.1,120.2 154.9,120.8 155.7,121.5 156.4,122.1 157.2,122.7 157.9,123.3 158.7,124.0 159.4,124.6 160.2,125.2 160.9,125.8 161.7,126.4 162.4,127.0 163.2,127.6 163.9,128.2 164.7,128.8 165.4,129.4 166.2,130.0 166.9,130.6 167.7,131.1 168.4,131.7 169.2,132.3 169.9,132.9 170.7,133.4 171.4,134.0 172.2,134.5 172.9,135.1 173.7,135.6 174.4,136.2 175.2,136.7 175.9,137.2 176.7,137.7 177.4,138.3 178.2,138.8 178.9,139.3 179.7,139.8 180.5,139.7 181.2,139.2 182.0,138.7 182.7,138.2 183.5,137.7 184.2,137.3 185.0,136.8 185.7,136.3 186.5,135.9 187.2,135.4 188.0,135.0 188.7,134.5 189.5,134.1 190.2,133.7 191.0,133.2 191.7,132.8 192.5,132.4 193.2,132.0 194.0,131.6 194.7,131.2 195.5,130.8 196.2,130.4 197.0,130.0 197.7,129.7 198.5,129.3 199.2,128.9 200.0,128.6 200.7,128.2 201.5,127.9 202.2,127.5 203.0,127.2 203.7,126.9 204.5,126.6 205.3,126.3 206.0,125.9 206.8,125.6 207.5,125.3 208.3,125.1 209.0,124.8 209.8,124.5 210.5,124.2 211.3,124.0 212.0,123.7 212.8,123.4 213.5,123.2 214.3,123.0 215.0,122.7 215.8,122.5 216.5,122.3 217.3,122.1 218.0,121.8 218.8,121.6 219.5,121.4 220.3,121.3 221.0,121.1 221.8,120.9 222.5,120.7 223.3,120.5 224.0,120.4 224.8,120.2 225.5,120.1 226.3,119.9 227.0,119.8 227.8,119.7 228.5,119.5 229.3,119.4 230.0,119.3 230.8,119.2 231.6,119.1 232.3,119.0 233.1,118.9 233.8,118.8 234.6,118.8 235.3,118.7 236.1,118.6 236.8,118.6 237.6,118.5 238.3,118.5 239.1,118.4 239.8,118.4 240.6,118.4 241.3,118.3 242.1,118.3 242.8,118.3 243.6,118.3 244.3,118.3 245.1,118.3 245.8,118.3 246.6,118.3 247.3,118.3 248.1,118.3 248.8,118.4 249.6,118.4 250.3,118.4 251.1,118.5 251.8,118.5 252.6,118.6 253.3,118.6 254.1,118.7 254.8,118.8 255.6,118.8 256.4,118.9 257.1,119.0 257.9,119.1 258.6,119.2 259.4,119.3 260.1,119.4 260.9,119.5 261.6,119.6 262.4,119.7 263.1,119.8 263.9,119.9 264.6,120.1 265.4,120.2 266.1,120.3 266.9,120.5 267.6,120.6 268.4,120.8 269.1,120.9 269.9,121.1 270.6,121.2 271.4,121.4 272.1,121.5 272.9,121.7 273.6,121.9 274.4,122.1 275.1,122.2 275.9,122.4 276.6,122.6 277.4,122.8 278.1,123.0 278.9,123.2 279.6,123.4 280.4,123.6 281.2,123.8 281.9,124.0 282.7,124.2 283.4,124.4 284.2,124.6 284.9,124.8 285.7,125.0 286.4,125.3 287.2,125.5 287.9,125.7 288.7,125.9 289.4,126.2 290.2,126.4 290.9,126.6 291.7,126.9 292.4,127.1 293.2,127.4 293.9,127.6 294.7,127.8 295.4,128.1 296.2,128.3 296.9,128.6 297.7,128.8 298.4,129.1 299.2,129.3 299.9,129.6 300.7,129.8 301.4,130.1 302.2,130.4 302.9,130.6 303.7,130.9 304.4,131.1 305.2,131.4 306.0,131.6 306.7,131.9 307.5,132.2 308.2,132.4 309.0,132.7 309.7,133.0 310.5,133.2 311.2,133.5 312.0,133.8 312.7,134.0 313.5,134.3 314.2,134.5 315.0,134.8 315.7,135.1 316.5,135.3 317.2,135.6 318.0,135.9 318.7,136.1 319.5,136.4 320.2,136.7 321.0,136.9 321.7,137.2 322.5,137.4 323.2,137.7 324.0,138.0 324.7,138.2 325.5,138.5 326.2,138.7 327.0,139.0 327.7,139.2 328.5,139.5 329.2,139.7 330.0,140.0" fill="none" stroke="#6c7a93" stroke-dasharray="4 3"/>
<line x1="45.0" y1="140" x2="45.0" y2="41.6" stroke="#1d6fd1" stroke-width="3"/>
<circle cx="45.0" cy="41.6" r="3.5" fill="#1d6fd1"/>
<line x1="165.0" y1="140" x2="165.0" y2="129.1" stroke="#b4232c" stroke-width="3"/>
<circle cx="165.0" cy="129.1" r="3.5" fill="#b4232c"/>
<line x1="195.0" y1="140" x2="195.0" y2="131.1" stroke="#b4232c" stroke-width="3"/>
<circle cx="195.0" cy="131.1" r="3.5" fill="#b4232c"/>
<line x1="315.0" y1="140" x2="315.0" y2="134.8" stroke="#b4232c" stroke-width="3"/>
<circle cx="315.0" cy="134.8" r="3.5" fill="#b4232c"/>
<text x="30.0" y="155" font-size="11" fill="#1f2a44" text-anchor="middle">0</text>
<text x="180.0" y="155" font-size="11" fill="#1f2a44" text-anchor="middle">fs</text>
<text x="330.0" y="155" font-size="11" fill="#1f2a44" text-anchor="middle">2fs</text>
<text x="51.0" y="54" font-size="11" fill="#1d6fd1" text-anchor="start">command at f = 0.1 fs</text>
<text x="157.0" y="100" font-size="11" fill="#b4232c" text-anchor="end">image at fs − f: 1/9 as tall</text>
<text x="203.0" y="118" font-size="11" fill="#b4232c" text-anchor="start">fs + f</text>
<text x="311.0" y="126" font-size="11" fill="#b4232c" text-anchor="end">2fs − f</text>
<text x="30" y="176" font-size="11" fill="#6c7a93" text-anchor="start">dashed: the hold’s sinc gain, which sets every height</text>
</svg>
```

The first image, at $f_s - f = 0.9 f_s$, is $0.1/0.9 = 1/9$ as tall as the command, exactly as $f/(f_s - f)$ says.
:::

::: context q-factor The quality factor Q
The **quality factor** $Q$ says how sharply a resonance rings. Driven exactly at its natural frequency, a lightly damped mode responds $Q$ times more than it would to a slow push of the same size. For small damping ratio $\zeta$, $Q = 1/(2\zeta)$.

Rocket and spacecraft structures often have $\zeta$ around $0.5\%$ to $2\%$, so $Q$ from $25$ to $100$. That is why a small tone landing on a structural mode is never automatically harmless: the structure is an amplifier tuned to that one frequency.
:::

::: context lead-bridge Buying phase with a lead compensator
A **lead compensator**, $C(s) = (s/\omega_z + 1)/(s/\omega_p + 1)$ with the zero below the pole, adds positive phase in a band between them. Its peak lead $\phi_m$ sits at the geometric mean $\sqrt{\omega_z\omega_p}$, and with $\alpha = \omega_z/\omega_p$ it obeys $\sin\phi_m = (1 - \alpha)/(1 + \alpha)$.

You designed these in the classical control module. Here it plays a new role: paying back phase that digital implementation took. The price is always the same — gain rising at high frequency, where noise and structural modes live.
:::
