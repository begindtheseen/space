---
id: l02-zero-order-hold
title: The zero-order hold and its half-sample phase penalty
minutes: 18
covers:
  - The zero-order hold and its half-sample phase penalty
---

The previous lesson dealt with getting a measurement into the flight computer. This one deals with getting a command out, and it turns out to be the more expensive half of the transaction.

A digital-to-analog converter has one output register. When the control task writes a number to it, the converter drives that value until something writes a different number, which happens one frame later. The command that reaches the gimbal actuator or the thruster driver is therefore a staircase: flat for $T$ seconds, then a step, then flat again. That staircase is not the smooth signal your continuous design assumed, and the difference is not a modelling nicety. It is the single largest, most unavoidable phase cost in a digital loop, and unlike the anti-alias filter you cannot trade it away by choosing better components.

The device that turns a sequence back into a continuous signal by holding each value for one sample period is called a **zero-order hold** — zero-order because it reconstructs with a polynomial of degree zero, a constant, between samples. This lesson derives its frequency response, extracts the half-sample delay hiding in it, and puts numbers on what that delay does to a loop you already tuned.

## The hold as a transfer function

Feed the hold a single unit sample at $t = 0$ and nothing afterwards. Its output is a rectangular pulse: height 1, from $t = 0$ to $t = T$. That is the hold's impulse response, and its Laplace transform is the transfer function. A unit step at $t = 0$ transforms to $1/s$; the same step delayed to $t = T$ transforms to $e^{-sT}/s$; the pulse is their difference:

$$
G_{h0}(s) = \frac{1 - e^{-sT}}{s}.
$$

The factor $T$ in that expression carries units of time, which is correct for a device fed impulses: the idealised sampler of the previous lesson produces impulses of *area* $x[n]$, and the hold converts area into a level over a duration. In loop analysis the sampler's $1/T$ and the hold's $T$ cancel, so the combination has unity DC gain. Everything below is written for that normalised combination, $G_{h0}(s)/T$, whose value at $s = 0$ is 1.

## Its frequency response contains an exact half-sample delay

Put $s = j\omega$ and factor out half the exponent — the step that makes the whole thing readable:

$$
\begin{aligned}
G_{h0}(j\omega) &= \frac{1 - e^{-j\omega T}}{j\omega}
= \frac{e^{-j\omega T/2}\left(e^{\,j\omega T/2} - e^{-j\omega T/2}\right)}{j\omega} \\[4pt]
&= e^{-j\omega T/2}\,\frac{2j\sin(\omega T/2)}{j\omega}
= T\,e^{-j\omega T/2}\,\frac{\sin(\omega T/2)}{\omega T/2}.
\end{aligned}
$$

Three factors, each with a clear meaning. The $T$ is the units-and-gain factor already accounted for. The $\sin(x)/x$ with $x = \omega T/2$ is a real, positive, slowly falling magnitude — the **sinc droop**. And $e^{-j\omega T/2}$ is a pure delay of exactly half a sample period.

So, for the normalised hold,

$$
|G_{h0}(j\omega)| = \left|\frac{\sin(\omega T/2)}{\omega T/2}\right|,
\qquad
\angle G_{h0}(j\omega) = -\frac{\omega T}{2}.
$$

The phase result deserves emphasis: it is **exact**, not an approximation, for every frequency up to the Nyquist frequency. The zero-order hold contributes phase lag $-\omega T/2$, identical to a transport delay of $T/2$ seconds, with no error term. The approximation people talk about is in the *magnitude*: modelling the hold as $e^{-sT/2}$ gives unity gain where the true hold rolls off as a sinc. Since $|\sin x / x| < 1$, that approximation overestimates the loop gain at high frequency, which errs in the safe direction for gain margin.

Convert the phase to the units you will work in. With $\omega = 2\pi f$ and $T = 1/f_s$,

$$
\angle G_{h0} = -\frac{2\pi f}{2 f_s}\ \mathrm{rad}
= -\pi\frac{f}{f_s}\ \mathrm{rad}
= -180^\circ \cdot \frac{f}{f_s}.
$$

The lag in degrees is $180$ times the ratio of the frequency to the sample rate. Nothing else. At one twentieth of the sample rate the hold costs $9^\circ$; at one fortieth, $4.5^\circ$; at Nyquist, $90^\circ$. Commit that line to memory — it is the arithmetic behind the sample-rate rule of thumb a later lesson in this module derives, and it is the fastest sanity check you can run on somebody else's digital design.

| $f/f_s$ | Phase lag | $\lvert G_{h0}\rvert$ | in dB |
| --- | --- | --- | --- |
| $0.010$ | $1.80^\circ$ | $0.99984$ | $-0.001$ |
| $0.025$ | $4.50^\circ$ | $0.99897$ | $-0.009$ |
| $0.050$ | $9.00^\circ$ | $0.99589$ | $-0.036$ |
| $0.100$ | $18.00^\circ$ | $0.98363$ | $-0.143$ |
| $0.250$ | $45.00^\circ$ | $0.90032$ | $-0.912$ |
| $0.500$ | $90.00^\circ$ | $0.63662$ | $-3.922$ |

Read the two columns against each other. Through the whole useful range the magnitude is within a tenth of a decibel of unity while the phase runs away. The zero-order hold is, for practical purposes, a pure phase lag: it takes nothing from your gain margin and a great deal from your phase margin.

::: key
**Zero-order hold phase penalty.** A ZOH behaves like a delay of $T/2$, so $\phi = -\omega T/2$, equivalently $-180^\circ f/f_s$. At $100\,\mathrm{Hz}$ and $5\,\mathrm{Hz}$ that is $-9^\circ$. Computational delay adds roughly one more sample on top.
:::

::: example What the hold costs a 100 Hz loop at 5 Hz
A reaction-wheel attitude loop runs at $f_s = 100\,\mathrm{Hz}$, so $T = 10\,\mathrm{ms}$, and crosses over at $5\,\mathrm{Hz}$.

Half a sample is $T/2 = 5\,\mathrm{ms}$. At $5\,\mathrm{Hz}$, $\omega = 2\pi \cdot 5 = 31.416\,\mathrm{rad/s}$, so

$$
\phi = -\omega \frac{T}{2} = -31.416 \times 0.005 = -0.15708\ \mathrm{rad} = -9.00^\circ .
$$

The shortcut gives the same thing at sight: $-180^\circ \times 5/100 = -9.00^\circ$. The magnitude at that frequency is $\sin(0.15708)/0.15708 = 0.99589$, which is $-0.036\,\mathrm{dB}$ and changes nothing.

Now put it in context. The computational delay of the next lesson typically costs one more sample, $-180^\circ \times 5/100 \times 2 = -18^\circ$, for $-27^\circ$ total from digital implementation alone. If the sensor sits behind the second-order anti-alias filter sized in the previous lesson, add several degrees more. A continuous design carrying $35^\circ$ of phase margin has, after implementation, well under $10^\circ$ — which is not a margin, it is a resonant peak in the closed-loop response and an overshoot the vehicle will show you on the first flight. This is the arithmetic behind the standard advice to design continuous loops with $50$ to $60^\circ$ of phase margin when you know they will be flown digitally.
:::

## What the staircase does on the way out

The phase lag is the effect on the loop. There is a second effect, on the actuator and the structure, that the phase number does not capture: the staircase is discontinuous, and a discontinuity has energy at high frequency.

Look again at the spectrum. The sampled signal's spectrum has copies of the command at every multiple of $f_s$, and the hold multiplies all of them by the same sinc. A command tone at $f$ therefore emerges from the converter accompanied by **images** at $f_s - f$, $f_s + f$, $2f_s - f$, and so on. The first image's amplitude relative to the fundamental is a ratio of sinc values, and because $\sin(\pi(f_s - f)/f_s) = \sin(\pi f/f_s)$ the sines cancel and only the arguments remain:

$$
\frac{A_{\text{image}}}{A_{\text{fundamental}}} = \frac{f}{f_s - f}.
$$

Exact, and pleasantly simple. A $2\,\mathrm{Hz}$ command from a $50\,\mathrm{Hz}$ loop carries an image at $48\,\mathrm{Hz}$ at $2/48 = 1/24$ of the amplitude, which is $-27.6\,\mathrm{dB}$. A $1\,\mathrm{Hz}$ command from the same loop images at $49\,\mathrm{Hz}$ at $-33.8\,\mathrm{dB}$.

Whether that matters depends entirely on what is sitting at $48\,\mathrm{Hz}$. Nothing, on most vehicles, and the actuator's own bandwidth swallows it. But a lightly damped structural mode near the sample rate is a different story: a mode with quality factor $Q = 50$ amplifies whatever reaches it by a factor of 50, turning $-27.6\,\mathrm{dB}$ of image into $+6\,\mathrm{dB}$ of structural response. You now have a bending mode being driven at a frequency set by your frame rate rather than by anything the vehicle is doing. The standard symptoms are audible actuator buzz on the test stand and accelerometer content at exactly $f_s - f$, and the standard fixes are to move the sample rate, to add an analog smoothing filter after the converter, or to interpolate the command at a higher output rate than the control law runs at — a multi-rate arrangement the last lesson of this module returns to.

::: warning
Do not count the hold's phase twice, and do not leave it out. Two mistakes are common and they pull in opposite directions.

The first is analysing the loop with the discrete-equivalent plant — which already contains the hold, because ZOH equivalence is defined as the hold, the plant and the sampler together — and then multiplying by an extra $e^{-sT/2}$ "for the hold". The penalty is then double-counted and the design is needlessly slow.

The second is analysing the loop continuously with the true plant, finding $45^\circ$ of phase margin, and shipping it. Nothing in that analysis knows the command is a staircase. The hold's lag is real and is in the loop whether or not your model has it.

The rule: decide once whether you are working in the $s$ domain with an explicit $e^{-sT/2}$ factor, or in the $z$ domain with a ZOH-equivalent plant. Both are correct; the sum of both is not.
:::

::: example A 45-degree design dropped onto slower and slower loops
Take a single-axis rigid-body attitude loop: spacecraft inertia $J = 500\,\mathrm{kg\,m^2}$, plant $P(s) = 1/(J s^2)$, and a PD controller $C(s) = k_p + k_d s$. Size it for crossover at $\omega_c = 2\pi \cdot 1.0 = 6.283\,\mathrm{rad/s}$ with $45^\circ$ of phase margin. The loop is $L(s) = (k_p + k_d s)/(J s^2)$, whose phase is $-180^\circ + \arctan(k_d\omega/k_p)$, so $45^\circ$ of margin requires $k_d\omega_c = k_p$; unity gain at $\omega_c$ then requires $k_p\sqrt{2} = J\omega_c^2$, giving

$$
k_p = \frac{J\omega_c^2}{\sqrt 2} = 13{,}958\ \mathrm{N\,m/rad},
\qquad
k_d = \frac{k_p}{\omega_c} = 2{,}221\ \mathrm{N\,m\,s/rad}.
$$

Now hold the command. Multiply $L(j\omega)$ by $\mathrm{sinc}(\omega T/2)\,e^{-j\omega T/2}$ and recompute the crossover and the margin at a range of sample rates.

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

Three things to take from the table.

The phase margin falls almost exactly as $45^\circ - 180^\circ f_c/f_s$ predicts. At $20\,\mathrm{Hz}$ the prediction is $36.00^\circ$ against $35.95^\circ$ computed; at $10\,\mathrm{Hz}$, $27.00^\circ$ against $26.88^\circ$. The small surplus is the sinc droop lowering the crossover slightly, which buys back a fraction of a degree because the hold's lag is smaller at the lower frequency. Below about ten samples per cycle the shortcut becomes visibly conservative — at $4\,\mathrm{Hz}$ it says $0^\circ$ and the true value is $0.92^\circ$ — but it is conservative, so it is safe to use.

The loop goes unstable between $4$ and $3.5$ samples per cycle of the crossover frequency, from the hold alone, with no computational delay and no filters. That is the hard floor: even a perfect flight computer that produced its answer instantaneously could not close this loop at $3.5\,\mathrm{Hz}$.

And nothing in the table is a tuning problem. The gains $k_p$ and $k_d$ are the same in every row. The only thing that changed is how often the answer is written to the converter.
:::

::: note
A **first-order hold** reconstructs with a straight line through the last two samples instead of a constant, and it is the obvious next thing to try. It is worse for feedback. Its phase lag near DC is smaller, but it overshoots on transients and its magnitude peaks above unity before rolling off, and because it needs two samples to draw the line it adds delay of its own on the sample that matters. It has real uses in trajectory reconstruction and in replaying recorded data, where you are interpolating offline and the extra smoothness is worth having. Inside a feedback loop, the zero-order hold is what flies, and the compensation for its lag is built into the controller design rather than into the reconstructor.
:::

## Check yourself

::: check
A thrust-vector-control loop runs at $200\,\mathrm{Hz}$ and crosses over at $8\,\mathrm{Hz}$. How much phase does the zero-order hold cost at crossover, and how much gain? If the requirement is that no single implementation effect may cost more than $5^\circ$, does the hold pass?
:::

::: answer
The ratio is $f/f_s = 8/200 = 0.04$, so the lag is $180^\circ \times 0.04 = 7.2^\circ$. In radians, $\omega T/2 = 2\pi \cdot 8 \cdot 0.0025 = 0.1257\,\mathrm{rad}$, which is the same $7.2^\circ$.

The gain is $\sin(0.1257)/0.1257 = 0.99737$, that is $-0.023\,\mathrm{dB}$ — nothing.

The hold fails the $5^\circ$ requirement. To meet it the rate would have to satisfy $180 \times 8/f_s \le 5$, that is $f_s \ge 288\,\mathrm{Hz}$, so $320\,\mathrm{Hz}$ or $400\,\mathrm{Hz}$ in practice. Whether that requirement is the right one is a separate question: a flat per-effect budget is a crude instrument, and the usual approach is to budget the *total* implementation lag at crossover and let the pieces trade against each other.
:::

::: check
Explain, from the frequency response, why the zero-order hold takes almost nothing from gain margin but a great deal from phase margin, and why that makes it more dangerous than an equivalent gain error.
:::

::: answer
The normalised hold is $\mathrm{sinc}(\omega T/2)\,e^{-j\omega T/2}$: a magnitude that stays within $0.15\,\mathrm{dB}$ of unity out to a tenth of the sample rate, multiplied by a pure delay whose phase grows linearly and without bound. Gain margin is a question about magnitude at the frequency where the phase is $-180^\circ$; phase margin is a question about phase at the frequency where the magnitude is 1. The hold barely touches the first quantity and moves the second by $180^\circ f_c/f_s$.

It is more dangerous than a gain error for two reasons. A gain error shows up immediately in a step response as the wrong amplitude, and a linear analysis with a gain uncertainty band catches it; phase lag shows up as reduced damping, which looks like a tuning imperfection rather than a modelling error. And gain errors are bounded by hardware calibration, while the hold's lag grows without limit as you move up in frequency, so it is the thing that decides how fast you can make the loop.
:::

::: check
A $50\,\mathrm{Hz}$ loop commands a gimbal at $3\,\mathrm{Hz}$. Where does the first image of that command land, how big is it relative to the command, and what would make it a problem?
:::

::: answer
The first image is at $f_s - f = 50 - 3 = 47\,\mathrm{Hz}$, with relative amplitude $f/(f_s - f) = 3/47 = 0.0638$, that is $-23.9\,\mathrm{dB}$.

It becomes a problem when something resonant lives near $47\,\mathrm{Hz}$. A structural mode there with $1\%$ damping has $Q = 1/(2\zeta) = 50$, so it amplifies the image by a factor of 50: the modal response is $0.0638 \times 50 = 3.2$ times the amplitude the command itself produces at low frequency, and the vehicle now has a $47\,\mathrm{Hz}$ oscillation driven purely by the discreteness of the command. Note the unpleasant pairing with the previous lesson — if the same mode at $47\,\mathrm{Hz}$ is then read by the $50\,\mathrm{Hz}$ sampler, it folds to $3\,\mathrm{Hz}$, which is the commanded frequency. The excitation and the aliased measurement are locked together, which is exactly the situation that produces a slowly growing oscillation nobody can attribute to a gain.
:::

::: check
Your colleague models the zero-order hold as a pure delay of $T/2$ rather than as $\mathrm{sinc}(\omega T/2)e^{-j\omega T/2}$. At a crossover of one eighth of the sample rate, what error does that introduce, and in which direction?
:::

::: answer
None in phase: the $e^{-j\omega T/2}$ factor is the hold's phase exactly, at every frequency. The error is in magnitude. At $f/f_s = 1/8$, $\omega T/2 = \pi/8 = 0.3927\,\mathrm{rad}$ and $\mathrm{sinc} = \sin(0.3927)/0.3927 = 0.9745$, so the true hold has $0.22\,\mathrm{dB}$ less gain than the pure-delay model.

The direction is favourable. The model claims slightly more loop gain than exists, so the predicted crossover frequency is slightly high and the predicted gain margin slightly small. Both errors are conservative, and both are a fraction of a decibel at any sensible sample rate. This is why the $e^{-sT/2}$ approximation is the standard tool for a quick budget: it is exact where it matters and pessimistic where it is not.
:::

::: check
Two designs cross over at $2\,\mathrm{Hz}$. One samples at $40\,\mathrm{Hz}$, the other at $80\,\mathrm{Hz}$. How much phase margin does doubling the rate recover, and what would you have to do to recover the same amount without changing the rate?
:::

::: answer
At $40\,\mathrm{Hz}$ the hold costs $180 \times 2/40 = 9.0^\circ$; at $80\,\mathrm{Hz}$ it costs $4.5^\circ$. Doubling the rate returns $4.5^\circ$. Every doubling returns half of what remains, which is the shape of the diminishing return that sets the upper end of any sample-rate argument.

To recover $4.5^\circ$ at crossover without changing the rate, you would add lead: a lead compensator contributing $4.5^\circ$ at $2\,\mathrm{Hz}$ needs a zero-pole pair straddling crossover, and the classical relation between maximum lead and the pole-zero ratio $\alpha$ gives $\sin\phi_m = (1-\alpha)/(1+\alpha)$, so $\phi_m = 4.5^\circ$ needs $\alpha = 0.855$ — a very gentle lead, centred at $2\,\mathrm{Hz}$, costing a gain rise of $1/\sqrt{\alpha} = 1.08$ at crossover and more above it. That extra high-frequency gain is the catch: it amplifies sensor noise and any structural content that survived the anti-alias filter. Doubling the sample rate costs CPU; buying the same phase with lead costs noise. Which one you choose depends on which budget has room, and that trade is the substance of the sample-rate lesson later in this module.
:::

## Summary

| Item | Statement |
| --- | --- |
| Zero-order hold | Holds each command constant for one sample period; the reconstruction a DAC performs |
| Transfer function | $G_{h0}(s) = (1 - e^{-sT})/s$; normalised with the sampler's $1/T$ to unity DC gain |
| Frequency response | $G_{h0}(j\omega) = T\,e^{-j\omega T/2}\,\dfrac{\sin(\omega T/2)}{\omega T/2}$ |
| Phase | $\angle G_{h0} = -\omega T/2$ exactly — a half-sample delay; equivalently $-180^\circ f/f_s$ |
| Magnitude | $\lvert \mathrm{sinc}(\omega T/2)\rvert$: $-0.036\,\mathrm{dB}$ at $f_s/20$, $-3.92\,\mathrm{dB}$ at Nyquist |
| Quick number | $100\,\mathrm{Hz}$ loop, $5\,\mathrm{Hz}$ crossover, hold costs $9^\circ$; computational delay adds roughly one more sample |
| Output images | A command at $f$ emerges with images at $kf_s \pm f$; the first is down by $f/(f_s - f)$ |
| Modelling rule | Use either an explicit $e^{-sT/2}$ in the $s$ domain or a ZOH-equivalent plant in the $z$ domain, never both |
| Design implication | A continuous design intended for digital flight should carry $50$ to $60^\circ$ of phase margin |

The next lesson gives you the algebra to work with sequences directly, rather than patching continuous results with delay factors: the z-transform, and the discrete transfer functions built from it.
