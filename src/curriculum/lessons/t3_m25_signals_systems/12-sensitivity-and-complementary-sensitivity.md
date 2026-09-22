---
id: l12-sensitivity-and-complementary-sensitivity
title: Sensitivity, complementary sensitivity and S + T = 1
minutes: 16
covers:
  - "Sensitivity S and complementary sensitivity T, and the identity S + T = 1"
---

The factor $1/(1 + L)$ has turned up three times already: as the error transfer function, as the disturbance attenuation, and as the factor by which feedback shrinks the effect of a plant modelling error. Its partner $L/(1 + L)$ turned up as the command response. This lesson gives them their names — the **sensitivity function** $S$ and the **complementary sensitivity function** $T$ — and then proves the one-line identity that governs what any feedback design can achieve:

$$
S(s) + T(s) = 1.
$$

That is not a normalisation or a convention. It is an algebraic identity, true at every frequency, for every plant, under every controller anyone will ever write. And because $S$ governs how well the loop rejects disturbances and follows commands, while $T$ governs how much sensor noise reaches the output and how much plant uncertainty the loop can survive, the identity says: **at any given frequency you may have one or the other, never both.**

Loop shaping is therefore not about making the loop good. It is about choosing the frequencies at which it is good at rejecting disturbances and the frequencies at which it is good at ignoring noise, and living with the handover in between. Understanding that is the difference between tuning a loop and designing one, and it is the note this module ends on because it is the frame for everything in the rest of the tier.

## Where the signals enter

Take a unity-feedback loop: reference $r$, controller $C$, plant $G$, and three unwanted inputs — an **input disturbance** $d_i$ added to the plant input (thrust misalignment, a stuck valve bias), an **output disturbance** $d$ added to the plant output (a wind gust turning the vehicle), and **sensor noise** $n$ added to the measurement. The error the controller sees is $r - (y + n)$.

Write the output:

$$
y = GC\left(r - y - n\right) + G\,d_i + d,
$$

collect the $y$ terms with $L = GC$, and divide:

$$
y = \frac{L}{1 + L}r - \frac{L}{1 + L}n + \frac{G}{1 + L}d_i + \frac{1}{1 + L}d.
$$

Define

$$
S(s) = \frac{1}{1 + L(s)}, \qquad T(s) = \frac{L(s)}{1 + L(s)},
$$

and the four coefficients above are $T$, $-T$, $GS$ and $S$. The true tracking error $e = r - y$ is then

$$
e = S\,r + T\,n - GS\,d_i - S\,d.
$$

The control signal follows the same way: $u = CS(r - n - d) - T\,d_i$. The four distinct transfer functions $S$, $T$, $GS$ and $CS$ are collectively called the **gang of four**, and a complete loop assessment looks at all of them. $CS$ is the one people forget, and it is the one that tells you whether the actuator can physically deliver what the controller is asking for.

::: key
Sensitivity and complementary sensitivity: $S = \dfrac{1}{1 + L}$, $T = \dfrac{L}{1 + L}$, where $L$ is the loop transfer function. $S$ maps disturbance and reference to error; $T$ maps sensor noise to output.
:::

## The identity

Add them:

$$
S + T = \frac{1}{1 + L} + \frac{L}{1 + L} = \frac{1 + L}{1 + L} = 1.
$$

That is the whole proof. It uses nothing about $G$, nothing about $C$, and nothing about stability. It holds at $s = 0$, at $s = j\omega$ for every $\omega$, and at every complex $s$ where the expressions are defined. The word "complementary" in $T$'s name is exactly this.

::: key
$S + T = 1$ at every frequency, always. You choose **where** each is small; you never make both small at the same frequency.
:::

The consequence is immediate and is worth stating in each direction:

- Wherever $\lvert S\rvert \ll 1$ — excellent disturbance rejection and tracking — the identity forces $T \approx 1$, so **all** of the sensor noise at that frequency arrives at the output, and the loop has no robustness margin against multiplicative plant error there.
- Wherever $\lvert T\rvert \ll 1$ — sensor noise rejected, plant uncertainty tolerated — the identity forces $S \approx 1$, so disturbances pass through completely and the loop does nothing about them.
- At any frequency where both are below 1 in magnitude, they must be very nearly $\tfrac{1}{2}$ each at best, since two complex numbers summing to 1 cannot both be small.

## Reading $S$ and $T$ off the loop gain

Both are determined by $L$ alone, and the two limits are what you sketch:

| regime | $\lvert S\rvert$ | $\lvert T\rvert$ | what it means |
| --- | --- | --- | --- |
| $\lvert L\rvert \gg 1$ (low frequency) | $\approx 1/\lvert L\rvert$ | $\approx 1$ | tracks, rejects disturbances, passes noise |
| $\lvert L\rvert = 1$ (crossover) | $1/\lvert 1 + L\rvert$ | $\lvert L\rvert/\lvert 1 + L\rvert$ | both near 1; the handover |
| $\lvert L\rvert \ll 1$ (high frequency) | $\approx 1$ | $\approx \lvert L\rvert$ | ignores noise, ignores disturbances |

At crossover the phase decides everything, because $\lvert 1 + L\rvert$ is the distance from $-1$ to a point on the unit circle:

| phase margin | $\lvert 1 + L\rvert$ | $\lvert S\rvert = \lvert T\rvert$ |
| --- | --- | --- |
| $30^\circ$ | 0.518 | 1.932 |
| $45^\circ$ | 0.765 | 1.307 |
| $60^\circ$ | 1.000 | 1.000 |
| $90^\circ$ | 1.414 | 0.707 |

A phase margin of $60^\circ$ is the value at which the loop neither amplifies nor attenuates a disturbance at its own crossover frequency. Below that it amplifies, which is the frequency-domain meaning of "not enough damping".

## $S$, the Nyquist plot and the modulus margin

Look again at $\lvert S(j\omega)\rvert = 1/\lvert 1 + L(j\omega)\rvert$. The quantity $\lvert 1 + L(j\omega)\rvert$ is the distance in the complex plane from the critical point $-1$ to the polar plot of $L$ at that frequency. So:

$$
M_s = \max_\omega\lvert S(j\omega)\rvert = \frac{1}{\min_\omega\lvert 1 + L(j\omega)\rvert} = \frac{1}{\text{closest approach to } -1}.
$$

$M_s$ is one number that measures how close the loop comes to instability in *any* direction at once, unlike gain margin and phase margin, each of which probes one direction only. Its reciprocal is the **modulus margin**, and a design target of $M_s \le 2$ (that is $6\,\mathrm{dB}$) is the usual industrial rule. It guarantees both classical margins:

$$
\mathrm{GM} \ge \frac{M_s}{M_s - 1}, \qquad \mathrm{PM} \ge 2\arcsin\frac{1}{2M_s}.
$$

| $M_s$ | guaranteed GM | guaranteed PM |
| --- | --- | --- |
| 1.5 | $3.0$ ($9.5\,\mathrm{dB}$) | $38.9^\circ$ |
| 2.0 | $2.0$ ($6.0\,\mathrm{dB}$) | $29.0^\circ$ |
| 3.0 | $1.5$ ($3.5\,\mathrm{dB}$) | $19.2^\circ$ |

The peak of $T$, written $M_t$, matters too: it is the closed-loop resonant peak, and by the second-order relation of lesson 9 a value of $1.3$ ($2.3\,\mathrm{dB}$) corresponds to roughly $\zeta = 0.45$ in the dominant pair.

::: example The launch-vehicle attitude loop, assessed properly
Lesson 11 designed a PD attitude loop for the max-q vehicle: $C = 0.5883 + 0.8023s$ around $G = 1.745/(s^2 - 0.02657)$. Put the real hardware back in — the $10\,\mathrm{Hz}$, $\zeta = 0.7$ actuator of lesson 2 and the $25\,\mathrm{ms}$ digital latency of lesson 8 — so that

$$
L(s) = \frac{1.745\left(0.8023s + 0.5883\right)}{s^2 - 0.02657}\cdot\frac{3948}{s^2 + 87.96s + 3948}\cdot e^{-0.025s}.
$$

Crossover is at $\omega_c = 1.534\,\mathrm{rad/s}$ with $\mathrm{PM} = 60.3^\circ$; the phase reaches $-180^\circ$ at $31.6\,\mathrm{rad/s}$ where the gain is $27.3\,\mathrm{dB}$ down, so $\mathrm{GM} = 23.2$. Now the sensitivity picture:

| $\omega$ (rad/s) | $\lvert L\rvert$ | $\lvert S\rvert$ | $\lvert T\rvert$ | $S + T$ |
| --- | --- | --- | --- | --- |
| 0.01 | $31.7\,\mathrm{dB}$ | $-31.5\,\mathrm{dB}$ | $+0.23\,\mathrm{dB}$ | 1.000 |
| 0.10 | $29.0\,\mathrm{dB}$ | $-28.7\,\mathrm{dB}$ | $+0.31\,\mathrm{dB}$ | 1.000 |
| 1.00 | $4.56\,\mathrm{dB}$ | $-2.39\,\mathrm{dB}$ | $+2.18\,\mathrm{dB}$ | 1.000 |
| 1.534 | $0\,\mathrm{dB}$ | $-0.04\,\mathrm{dB}$ | $-0.04\,\mathrm{dB}$ | 1.000 |
| 5.0 | $-11.0\,\mathrm{dB}$ | $+0.61\,\mathrm{dB}$ | $-10.4\,\mathrm{dB}$ | 1.000 |
| 20.0 | $-23.1\,\mathrm{dB}$ | $+0.52\,\mathrm{dB}$ | $-22.6\,\mathrm{dB}$ | 1.000 |
| 100 | $-45.7\,\mathrm{dB}$ | $-0.05\,\mathrm{dB}$ | $-45.8\,\mathrm{dB}$ | 1.000 |

Every row sums to exactly 1, which is the arithmetic check you should run on any $S$ and $T$ you compute.

Reading the table as an engineer: a wind gust at $0.1\,\mathrm{rad/s}$ is attenuated to $\lvert S\rvert = 0.0366$, about 3.7% of what it would do to the unaided vehicle — that is what the loop is for. At that same frequency $\lvert T\rvert = 1.04$, so gyro noise at $0.1\,\mathrm{rad/s}$ goes straight to the attitude, which is why the gyro's low-frequency drift, not its high-frequency noise, sets the pointing accuracy. Above $5\,\mathrm{rad/s}$ the loop has effectively stopped: it neither rejects a disturbance nor transmits noise, and the vehicle behaves as though uncontrolled at those frequencies — which is exactly what you want at a structural bending frequency.

The peak values are $M_s = 1.073$ ($0.61\,\mathrm{dB}$) at $4.36\,\mathrm{rad/s}$ and $M_t = 1.319$ ($2.40\,\mathrm{dB}$) at $0.82\,\mathrm{rad/s}$. The closest the polar plot comes to $-1$ is $0.932$. From $M_s = 1.073$ the guaranteed margins are $\mathrm{GM} \ge 14.7$ ($23.4\,\mathrm{dB}$) and $\mathrm{PM} \ge 55.6^\circ$, and the actual values — $23.2$ and $60.3^\circ$ — comfortably exceed them, as they must. A modulus margin of $0.93$ is excellent; anything above $0.5$ ($M_s \le 2$) would pass review.
:::

::: example What derivative gain does to the actuator
The spacecraft pointing loop of lesson 11 — $I = 1200\,\mathrm{kg\,m^2}$, $C = 300 + 840s$, $G = 1/(1200s^2)$ — designed to $\omega_n = 0.5\,\mathrm{rad/s}$, $\zeta = 0.7$. Its sensitivity picture:

| $\omega$ (rad/s) | $\lvert L\rvert$ | $\lvert S\rvert$ | $\lvert T\rvert$ | $\lvert CS\rvert$ ($\mathrm{N\,m}$ per rad of noise) |
| --- | --- | --- | --- | --- |
| 0.01 | $68.0\,\mathrm{dB}$ | $-68.0\,\mathrm{dB}$ | $0.00\,\mathrm{dB}$ | 0.12 |
| 0.10 | $28.3\,\mathrm{dB}$ | $-28.0\,\mathrm{dB}$ | $+0.33\,\mathrm{dB}$ | 12.5 |
| 0.50 | $4.71\,\mathrm{dB}$ | $-2.92\,\mathrm{dB}$ | $+1.79\,\mathrm{dB}$ | 369 |
| 5.0 | $-17.1\,\mathrm{dB}$ | $0.00\,\mathrm{dB}$ | $-17.1\,\mathrm{dB}$ | 4211 |
| 20.0 | $-29.1\,\mathrm{dB}$ | $0.00\,\mathrm{dB}$ | $-29.1\,\mathrm{dB}$ | 16803 |

$S$ and $T$ look healthy everywhere: $M_s = 1.0002$, $M_t = 1.276$. But $\lvert CS\rvert$ grows without bound, because $CS \to C$ once $\lvert L\rvert \ll 1$ and $C$ contains a pure derivative. Attitude noise of $1\,\mathrm{mdeg}$ at $20\,\mathrm{rad/s}$ — $1.745\times10^{-5}\,\mathrm{rad}$ — therefore demands

$$
0.293\,\mathrm{N\,m}
$$

of wheel torque, against a wheel capable of $0.2\,\mathrm{N\,m}$. The loop is perfectly stable, its $S$ and $T$ are textbook, and it saturates the actuator on sensor noise alone. This is why derivative action is never implemented as $K_ds$ but as $K_ds/(1 + s/\omega_f)$ with $\omega_f$ a few times crossover, and it is why the gang of four is four functions and not two.
:::

::: warning
$S$ and $T$ describe a loop only if that loop is stable. Both are ratios whose denominator is $1 + L$, so both are perfectly finite-looking expressions for an unstable closed loop — they have right-half-plane poles instead, and evaluating them on the imaginary axis gives numbers that mean nothing physical. Check stability first (the roots of $1 + L$, or the Nyquist criterion of the next module), then read $S$ and $T$.
:::

::: note
One more limit is worth knowing about, though its proof belongs to the next module. For a stable loop with relative degree at least two, the *area* under $\ln\lvert S(j\omega)\rvert$ is fixed: pushing $\lvert S\rvert$ down over one band forces it up over another. That is the **Bode sensitivity integral**, known to every practitioner as the waterbed effect, and right-half-plane poles make the fixed area positive rather than zero, so an unstable plant must pay for its stabilisation with a sensitivity peak somewhere. The identity $S + T = 1$ says you cannot be good at both things at one frequency; the waterbed says you cannot even be good at one thing at all frequencies.
:::

## Check yourself

::: check
A pointing loop achieves $\lvert S\rvert = -30\,\mathrm{dB}$ at $0.05\,\mathrm{rad/s}$. What is $\lvert T\rvert$ there, how accurately can you state it, and what two engineering consequences follow?
:::

::: answer
$\lvert S\rvert = 10^{-30/20} = 0.0316$. Since $T = 1 - S$ exactly, $\lvert T\rvert$ lies between $1 - 0.0316 = 0.968$ and $1 + 0.0316 = 1.032$ depending on the phase of $S$ — that is between $-0.28\,\mathrm{dB}$ and $+0.27\,\mathrm{dB}$. So you can state it to within a third of a decibel without knowing anything else about the loop.

First consequence: sensor error at $0.05\,\mathrm{rad/s}$ reaches the output essentially undiminished, so the loop's pointing accuracy at that frequency is the *sensor's* accuracy, not something the controller can improve. This is why low-frequency gyro drift and star-tracker bias, rather than high-frequency noise, set a spacecraft's pointing budget. Second consequence: robust stability needs $\lvert T\rvert < 1/\lvert\Delta\rvert$, so with $\lvert T\rvert \approx 1$ the loop tolerates less than 100% multiplicative plant error at that frequency — acceptable at $0.05\,\mathrm{rad/s}$, where a rigid-body model is trustworthy, and the reason $\lvert T\rvert$ must be pushed well below 1 before reaching frequencies where it is not.
:::

::: check
A loop has $\lvert L(j\omega_1)\rvert = 100$ at $\omega_1 = 0.02\,\mathrm{rad/s}$ and $\lvert L(j\omega_2)\rvert = 0.02$ at $\omega_2 = 30\,\mathrm{rad/s}$. Estimate $\lvert S\rvert$ and $\lvert T\rvert$ at each, and say what the loop does to a gust at $\omega_1$ and to gyro noise at $\omega_2$.
:::

::: answer
At $\omega_1$: $\lvert S\rvert \approx 1/100 = 0.01$ ($-40\,\mathrm{dB}$) and $\lvert T\rvert \approx 1$ ($0\,\mathrm{dB}$). A gust at $0.02\,\mathrm{rad/s}$ is attenuated a hundredfold — the loop is doing its job — while any gyro noise at that frequency is passed to the attitude undiminished. At $\omega_2$: $\lvert S\rvert \approx 1$ and $\lvert T\rvert \approx 0.02$ ($-34\,\mathrm{dB}$). Gyro noise at $30\,\mathrm{rad/s}$ is attenuated fiftyfold at the output, and a disturbance at that frequency passes straight through because the loop is no longer paying attention. Both estimates satisfy $S + T = 1$ to the accuracy of the approximation. The design is the standard one: high loop gain where the disturbances live, low loop gain where the noise and the unmodelled dynamics live.
:::

::: check
A design review reports $\mathrm{GM} = 8\,\mathrm{dB}$ and $\mathrm{PM} = 35^\circ$. Can you conclude that $M_s \le 2$?
:::

::: answer
No — the implication runs the other way. $M_s \le 2$ *guarantees* $\mathrm{GM} \ge 6\,\mathrm{dB}$ and $\mathrm{PM} \ge 29^\circ$, but good values of the two classical margins do not guarantee a small $M_s$. Each classical margin perturbs the loop along one axis only: gain margin moves the polar plot radially at the phase crossover, phase margin rotates it at the gain crossover. A polar plot can pass close to $-1$ at some intermediate frequency while being far from it at both of those points, giving comfortable margins and a large $M_s$. The only way to know is to compute $\min_\omega\lvert 1 + L(j\omega)\rvert$ over a frequency grid fine enough to catch a narrow approach — which for a lightly damped structural mode means resolving a band of width $2\zeta\omega_n$.
:::

::: check
For the launch-vehicle loop above, a bending mode at $18\,\mathrm{rad/s}$ with $\zeta = 0.005$ is found in the structural model. From the $S$ and $T$ table, is it likely to matter?
:::

::: answer
The table shows $\lvert L\rvert = -23.1\,\mathrm{dB}$ at $20\,\mathrm{rad/s}$ — a factor of 0.070 — so the rigid loop gain at $18\,\mathrm{rad/s}$ is about $-22\,\mathrm{dB}$. A mode with $\zeta = 0.005$ contributes a peak of $1/(2\zeta) = 100$, that is $+40\,\mathrm{dB}$, at its own frequency. Depending on how strongly the mode couples into the gyro and the nozzle, the loop gain at $18\,\mathrm{rad/s}$ could therefore rise to about $+18\,\mathrm{dB}$: far above 1, with a phase that swings $180^\circ$ across the mode. That is a second gain crossover in a place with no phase margin, and the loop would very likely be unstable at the bending frequency. So yes, it matters — and the remedies (a notch to gain-stabilise it, or a deliberate phase arrangement to phase-stabilise it) are the business of the next module. The general lesson: $\lvert L\rvert$ being small *on the rigid model* says nothing until the flexible model has been added.
:::

::: check
Show that $T$ is also the transfer function from reference to output, and explain why the same function governs robustness to multiplicative plant uncertainty.
:::

::: answer
From the output expression, the coefficient of $r$ is $L/(1 + L) = T$, so $T$ is the command response — hence the "closed-loop transfer function" of lesson 11 and $T$ are the same object. For robustness, let the true plant be $G(1 + \Delta)$ with $\Delta$ an unknown multiplicative error. The loop gain becomes $L(1 + \Delta)$ and the characteristic function becomes $1 + L + L\Delta = (1 + L)\left(1 + T\Delta\right)$. The nominal loop's poles are unchanged by the perturbation exactly when $1 + T\Delta$ has no right-half-plane zeros, which is assured when $\lvert T(j\omega)\Delta(j\omega)\rvert < 1$ at every frequency, that is $\lvert T\rvert < 1/\lvert\Delta\rvert$. Since plant uncertainty is almost always largest at high frequency — unmodelled actuator lag, structural modes, delay — this says $\lvert T\rvert$ must roll off before the uncertainty grows past 100%, which is the same instruction as "keep crossover below the frequencies you do not trust your model at".
:::

## Summary

| Item | Statement |
| --- | --- |
| Sensitivity | $S = \dfrac{1}{1 + L}$; reference and output disturbance to error |
| Complementary sensitivity | $T = \dfrac{L}{1 + L}$; sensor noise to output, and reference to output |
| The identity | $S + T = 1$ at every frequency, for every plant and controller |
| Gang of four | $S$, $T$, $GS$ (input disturbance to output), $CS$ (noise to control signal) |
| Output equation | $y = Tr - Tn + GS\,d_i + S\,d$; error $e = Sr + Tn - GS\,d_i - S\,d$ |
| Low frequency | $\lvert L\rvert \gg 1 \Rightarrow \lvert S\rvert \approx 1/\lvert L\rvert$, $\lvert T\rvert \approx 1$ |
| High frequency | $\lvert L\rvert \ll 1 \Rightarrow \lvert S\rvert \approx 1$, $\lvert T\rvert \approx \lvert L\rvert$ |
| At crossover | $\lvert S\rvert = \lvert T\rvert = 1/\lvert 1 + L\rvert$; equal to 1 when $\mathrm{PM} = 60^\circ$ |
| Modulus margin | $M_s = \max_\omega\lvert S\rvert = 1/\min_\omega\lvert 1 + L\rvert$; target $M_s \le 2$ |
| Guaranteed margins | $\mathrm{GM} \ge M_s/(M_s - 1)$, $\mathrm{PM} \ge 2\arcsin\left(1/(2M_s)\right)$ |
| Robust stability | $\lvert T\rvert < 1/\lvert\Delta\rvert$ against multiplicative uncertainty $\Delta$ |

That closes the module. You can now take a differential-equation model of a vehicle, linearise it, write its transfer function, read its poles and zeros, predict its step response, reduce it to the part that matters, sketch its Bode plot, close a loop around it and say precisely what that loop will and will not do. The next module uses all of it to design controllers — PID and lead-lag, root locus, the Nyquist criterion, notch filters for bending modes, and the cascaded rate-inside-attitude architecture that every launch vehicle flies.
