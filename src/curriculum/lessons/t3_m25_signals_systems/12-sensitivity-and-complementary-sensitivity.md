---
id: l12-sensitivity-and-complementary-sensitivity
title: Sensitivity, complementary sensitivity and S + T = 1
minutes: 18
covers:
  - "Sensitivity S and complementary sensitivity T, and the identity S + T = 1"
---

Imagine a friend steering a canoe while you call out directions from the bank. If your friend reacts strongly to everything you shout, the canoe follows your directions closely — including every time you shout the wrong thing by mistake. If your friend mostly ignores you, your mistakes do no harm, but neither do your good directions, and the current pushes the canoe wherever it likes. At any moment your friend can trust you or ignore you. There is no setting that does both.

A feedback loop faces exactly that choice, and this lesson puts a number on it. The factor $1/(1 + L)$ has already turned up three times: as the error transfer function, as the disturbance attenuation, and as the factor by which feedback shrinks the effect of a plant modeling error. Its partner $L/(1 + L)$ turned up as the command response. This lesson gives them names — the **sensitivity function** $S$ and the **complementary sensitivity function** $T$ — and then proves the one-line identity that governs what any feedback design can achieve:

$$
S(s) + T(s) = 1.
$$

That is not a normalization or a convention. It is an algebraic identity, true at every frequency, for every plant, under every controller anyone will ever write. $S$ governs how well the loop rejects disturbances and follows commands. $T$ governs how much sensor noise reaches the output and how much plant uncertainty the loop can survive. So the identity says: **at any given frequency you may have one or the other, never both.**

Loop shaping is therefore not about making the loop good everywhere. It is about choosing the frequencies where it rejects disturbances, choosing the frequencies where it ignores noise, and living with the handover in between. Understanding that is the difference between tuning a loop and designing one. It is the note this module ends on, because it frames everything in the rest of the tier.

## Where the signals enter

Take a unity-feedback loop: reference $r$, controller $C$, plant $G$. Now add the three unwanted inputs every real loop has:

- an **input disturbance** $d_i$, added to the plant input — a thrust misalignment, a stuck valve bias;
- an **output disturbance** $d$, added to the plant output — a wind gust turning the vehicle;
- **sensor noise** $n$, added to the measurement — the sensor's own jitter and errors.

The controller cannot see the true output $y$. It sees $y + n$, so the error it acts on is $r - (y + n)$.

Write the output. The plant receives the controller's command plus $d_i$, and its output gets $d$ added:

$$
y = GC\left(r - y - n\right) + G\,d_i + d.
$$

Collect the $y$ terms on the left, using $L = GC$: $y(1 + L) = Lr - Ln + Gd_i + d$. Divide by $1 + L$:

$$
y = \frac{L}{1 + L}r - \frac{L}{1 + L}n + \frac{G}{1 + L}d_i + \frac{1}{1 + L}d.
$$

Now define

$$
S(s) = \frac{1}{1 + L(s)}, \qquad T(s) = \frac{L(s)}{1 + L(s)}.
$$

The four coefficients above are $T$, $-T$, $GS$ and $S$. The true tracking error $e = r - y$ is then

$$
e = S\,r + T\,n - GS\,d_i - S\,d.
$$

(The $Sr$ comes from $r - Tr = (1 - T)r$, which is $Sr$ by the identity below.)

The control signal follows the same way: $u = CS(r - n - d) - T\,d_i$. The four different transfer functions here — $S$, $T$, $GS$ and $CS$ — are together called the **[[gang of four|gang-of-four]]**, and a complete loop assessment looks at all of them. $CS$ is the one people forget. It is the one that tells you whether the actuator can physically deliver what the controller is asking for.

::: key
Sensitivity and complementary sensitivity: $S = \dfrac{1}{1 + L}$, $T = \dfrac{L}{1 + L}$, where $L$ is the loop transfer function. $S$ maps disturbance and reference to error; $T$ maps sensor noise to output.
:::

## The identity

Add them. They share the denominator $1 + L$, so add the numerators:

$$
S + T = \frac{1}{1 + L} + \frac{L}{1 + L} = \frac{1 + L}{1 + L} = 1.
$$

That is the whole proof. It uses nothing about $G$, nothing about $C$, and nothing about stability. It holds at $s = 0$, at $s = j\omega$ for every frequency $\omega$, and at every complex $s$ where the expressions are defined. The word **[["complementary"|complementary-word]]** in $T$'s name means exactly this: $T$ is whatever $S$ leaves over.

::: key
$S + T = 1$ at every frequency, always. You choose **where** each is small; you never make both small at the same frequency.
:::

The consequence is immediate. State it in each direction:

- Wherever $\lvert S\rvert \ll 1$ — excellent disturbance rejection and tracking — the identity forces $T \approx 1$. So **all** of the sensor noise at that frequency arrives at the output, and the loop has no robustness margin against multiplicative plant error there.
- Wherever $\lvert T\rvert \ll 1$ — sensor noise rejected, plant uncertainty tolerated — the identity forces $S \approx 1$. So disturbances pass straight through, and the loop does nothing about them.
- Two **[[complex numbers that add to 1|st-triangle]]** cannot both be small. Their lengths must add to at least $1$, so the larger of $\lvert S\rvert$ and $\lvert T\rvert$ is always at least $\tfrac{1}{2}$. The best you can ever do for both at one frequency is $\tfrac{1}{2}$ each.

## Reading $S$ and $T$ off the loop gain

Both are set by $L$ alone, and the two extremes are what you sketch. If $\lvert L\rvert$ is huge, then $1 + L \approx L$, so $S \approx 1/L$ and $T \approx 1$. If $\lvert L\rvert$ is tiny, then $1 + L \approx 1$, so $S \approx 1$ and $T \approx L$.

| regime | $\lvert S\rvert$ | $\lvert T\rvert$ | what it means |
| --- | --- | --- | --- |
| $\lvert L\rvert \gg 1$ (low frequency) | $\approx 1/\lvert L\rvert$ | $\approx 1$ | tracks, rejects disturbances, passes noise |
| $\lvert L\rvert = 1$ (crossover) | $1/\lvert 1 + L\rvert$ | $\lvert L\rvert/\lvert 1 + L\rvert$ | both near 1; the **[[handover|st-bode]]** |
| $\lvert L\rvert \ll 1$ (high frequency) | $\approx 1$ | $\approx \lvert L\rvert$ | ignores noise, ignores disturbances |

At crossover the phase decides everything. There $\lvert L\rvert = 1$, so $L$ is a point on the unit circle, and $\lvert 1 + L\rvert$ is the distance from that point to $-1$. With phase margin $\mathrm{PM}$, the point sits at angle $-180^\circ + \mathrm{PM}$, and that distance works out to $2\sin(\mathrm{PM}/2)$:

| phase margin | $\lvert 1 + L\rvert$ | $\lvert S\rvert = \lvert T\rvert$ |
| --- | --- | --- |
| $30^\circ$ | 0.518 | 1.932 |
| $45^\circ$ | 0.765 | 1.307 |
| $60^\circ$ | 1.000 | 1.000 |
| $90^\circ$ | 1.414 | 0.707 |

A phase margin of $60^\circ$ is the value at which the loop neither amplifies nor shrinks a disturbance at its own crossover frequency. Below that it amplifies. That is the frequency-domain meaning of "not enough damping".

## $S$, the Nyquist plot and the modulus margin

Look again at $\lvert S(j\omega)\rvert = 1/\lvert 1 + L(j\omega)\rvert$. Write $1 + L$ as $L - (-1)$: it is the arrow from the **critical point** $-1$ to the point $L(j\omega)$ in the complex plane. So $\lvert 1 + L\rvert$ is the distance from $-1$ to the polar plot of $L$ at that frequency, and the biggest value of $\lvert S\rvert$ comes where that plot passes nearest $-1$:

$$
M_s = \max_\omega\lvert S(j\omega)\rvert = \frac{1}{\min_\omega\lvert 1 + L(j\omega)\rvert} = \frac{1}{\text{closest approach to } -1}.
$$

$M_s$ ("M sub s", the sensitivity peak) is one number that measures how close the loop comes to instability in *any* direction at once. Gain margin and phase margin each probe one direction only. The reciprocal $1/M_s$ is the **modulus margin** — the [[closest approach|nyquist-closest]] itself. A design target of $M_s \le 2$ (that is, $6\,\mathrm{dB}$) is the usual industrial rule. It guarantees both classical margins:

$$
\mathrm{GM} \ge \frac{M_s}{M_s - 1}, \qquad \mathrm{PM} \ge 2\arcsin\frac{1}{2M_s}.
$$

| $M_s$ | guaranteed GM | guaranteed PM |
| --- | --- | --- |
| 1.5 | $3.0$ ($9.5\,\mathrm{dB}$) | $38.9^\circ$ |
| 2.0 | $2.0$ ($6.0\,\mathrm{dB}$) | $29.0^\circ$ |
| 3.0 | $1.5$ ($3.5\,\mathrm{dB}$) | $19.2^\circ$ |

::: note Why a small $M_s$ guarantees both margins
Everywhere, the polar plot of $L$ stays at least $1/M_s$ away from $-1$. Call that distance $\rho$ ("rho").

**Gain margin.** At the phase crossover, $L$ sits on the negative real axis at $-1/\mathrm{GM}$. Its distance from $-1$ is $1 - 1/\mathrm{GM}$, and that must be at least $\rho$. So $1/\mathrm{GM} \le 1 - \rho$, which rearranges to $\mathrm{GM} \ge 1/(1 - \rho) = M_s/(M_s - 1)$.

**Phase margin.** At the gain crossover, $L$ sits on the unit circle, and the table above showed its distance from $-1$ is $2\sin(\mathrm{PM}/2)$. That must be at least $\rho = 1/M_s$. So $\sin(\mathrm{PM}/2) \ge 1/(2M_s)$, which gives $\mathrm{PM} \ge 2\arcsin(1/(2M_s))$.
:::

The peak of $T$, written $M_t$, matters too. It is the closed-loop resonant peak. By the second-order relation $M_r = 1/(2\zeta\sqrt{1 - \zeta^2})$ of lesson 9, a value of $1.3$ ($2.3\,\mathrm{dB}$) corresponds to roughly $\zeta = 0.42$ in the dominant pair.

::: example The launch-vehicle attitude loop, assessed properly
Lesson 11 designed a PD attitude loop for the max-q vehicle: $C = 0.5883 + 0.8023s$ around $G = 1.745/(s^2 - 0.02657)$. Now put the real hardware back in: the $10\,\mathrm{Hz}$, $\zeta = 0.7$ actuator of lesson 2 and the $25\,\mathrm{ms}$ digital latency of lesson 8. The loop gain becomes

$$
L(s) = \frac{1.745\left(0.8023s + 0.5883\right)}{s^2 - 0.02657}\cdot\frac{3948}{s^2 + 87.96s + 3948}\cdot e^{-0.025s}.
$$

**Classical margins.** Crossover is at $\omega_c = 1.534\,\mathrm{rad/s}$ with $\mathrm{PM} = 60.3^\circ$. The phase reaches $-180^\circ$ at $31.6\,\mathrm{rad/s}$, where the gain is $27.3\,\mathrm{dB}$ below 1, so $\mathrm{GM} = 23.2$.

**The sensitivity picture.** Evaluate $L$, $S = 1/(1 + L)$ and $T = L/(1 + L)$ at a spread of frequencies:

| $\omega$ (rad/s) | $\lvert L\rvert$ | $\lvert S\rvert$ | $\lvert T\rvert$ | $S + T$ |
| --- | --- | --- | --- | --- |
| 0.01 | $31.7\,\mathrm{dB}$ | $-31.5\,\mathrm{dB}$ | $+0.23\,\mathrm{dB}$ | 1.000 |
| 0.10 | $29.0\,\mathrm{dB}$ | $-28.7\,\mathrm{dB}$ | $+0.31\,\mathrm{dB}$ | 1.000 |
| 1.00 | $4.56\,\mathrm{dB}$ | $-2.39\,\mathrm{dB}$ | $+2.18\,\mathrm{dB}$ | 1.000 |
| 1.534 | $0\,\mathrm{dB}$ | $-0.04\,\mathrm{dB}$ | $-0.04\,\mathrm{dB}$ | 1.000 |
| 5.0 | $-11.0\,\mathrm{dB}$ | $+0.61\,\mathrm{dB}$ | $-10.4\,\mathrm{dB}$ | 1.000 |
| 20.0 | $-23.1\,\mathrm{dB}$ | $+0.52\,\mathrm{dB}$ | $-22.6\,\mathrm{dB}$ | 1.000 |
| 100 | $-45.7\,\mathrm{dB}$ | $-0.04\,\mathrm{dB}$ | $-45.8\,\mathrm{dB}$ | 1.000 |

Every row sums to exactly 1 (as complex numbers, not as decibels). That is the arithmetic check to run on any $S$ and $T$ you compute.

**Reading it as an engineer.** A wind gust at $0.1\,\mathrm{rad/s}$ is cut to $\lvert S\rvert = 0.0366$ — about 3.7% of what it would do to the unaided vehicle. That is what the loop is for. At that same frequency $\lvert T\rvert = 1.04$, so gyro noise at $0.1\,\mathrm{rad/s}$ goes straight to the attitude. That is why the gyro's low-frequency **[[drift|gyro-drift]]**, not its high-frequency noise, sets the pointing accuracy.

Above $5\,\mathrm{rad/s}$ the loop has effectively stopped. It neither rejects a disturbance nor transmits noise, and the vehicle behaves as though uncontrolled at those frequencies — which is exactly what you want at a **[[structural bending frequency|bending-mode]]**.

**Peaks and the modulus margin.** The peak values are $M_s = 1.073$ ($0.61\,\mathrm{dB}$) at $4.36\,\mathrm{rad/s}$ and $M_t = 1.319$ ($2.40\,\mathrm{dB}$) at $0.82\,\mathrm{rad/s}$. The closest the polar plot comes to $-1$ is $1/1.073 = 0.932$. From $M_s = 1.073$ the guaranteed margins are $\mathrm{GM} \ge 1.073/0.073 = 14.7$ ($23.4\,\mathrm{dB}$) and $\mathrm{PM} \ge 55.6^\circ$. The actual values, $23.2$ and $60.3^\circ$, comfortably exceed them, as they must. A modulus margin of $0.93$ is excellent; anything above $0.5$ ($M_s \le 2$) would pass review.
:::

::: example What derivative gain does to the actuator
Take the spacecraft pointing loop of lesson 11: $I = 1200\,\mathrm{kg\,m^2}$, $C = 300 + 840s$, $G = 1/(1200s^2)$, designed for $\omega_n = 0.5\,\mathrm{rad/s}$ and $\zeta = 0.7$. Here is its sensitivity picture, now with the fourth gang member, $CS$ — the wheel torque produced per radian of sensor noise:

| $\omega$ (rad/s) | $\lvert L\rvert$ | $\lvert S\rvert$ | $\lvert T\rvert$ | $\lvert CS\rvert$ ($\mathrm{N\,m}$ per rad of noise) |
| --- | --- | --- | --- | --- |
| 0.01 | $68.0\,\mathrm{dB}$ | $-68.0\,\mathrm{dB}$ | $0.00\,\mathrm{dB}$ | 0.12 |
| 0.10 | $28.3\,\mathrm{dB}$ | $-28.0\,\mathrm{dB}$ | $+0.33\,\mathrm{dB}$ | 12.5 |
| 0.50 | $4.71\,\mathrm{dB}$ | $-2.92\,\mathrm{dB}$ | $+1.79\,\mathrm{dB}$ | 369 |
| 5.0 | $-17.1\,\mathrm{dB}$ | $0.00\,\mathrm{dB}$ | $-17.1\,\mathrm{dB}$ | 4211 |
| 20.0 | $-29.1\,\mathrm{dB}$ | $0.00\,\mathrm{dB}$ | $-29.1\,\mathrm{dB}$ | 16803 |

$S$ and $T$ look healthy everywhere: $M_s = 1.0002$ and $M_t = 1.276$. But $\lvert CS\rvert$ keeps growing. Once $\lvert L\rvert \ll 1$, $S \approx 1$, so $CS \approx C$ — and $C$ contains a pure derivative, $840s$, whose gain rises with frequency.

**The torque.** Attitude noise of $1\,\mathrm{mdeg}$ (a thousandth of a degree) at $20\,\mathrm{rad/s}$ is $10^{-3} \times \pi/180 = 1.745\times10^{-5}\,\mathrm{rad}$. Multiply by $\lvert CS\rvert = 16803$:

$$
16803 \times 1.745\times10^{-5} = 0.293\,\mathrm{N\,m}
$$

of wheel torque, against a wheel that can make only $0.2\,\mathrm{N\,m}$. The loop is perfectly stable, its $S$ and $T$ are textbook, and it saturates the actuator on sensor noise alone. That is why derivative action is never built as a bare $K_ds$ but as a **[[filtered derivative|derivative-filter]]**, $K_ds/(1 + s/\omega_f)$, with $\omega_f$ a few times crossover. And it is why the gang of four is four functions and not two.
:::

::: warning
$S$ and $T$ describe a loop only if that loop is stable. Both have $1 + L$ as their denominator, so both give perfectly finite-looking numbers for an unstable closed loop too — but they then have right-half-plane poles, and evaluating them on the imaginary axis gives numbers that mean nothing physical. Check stability first (the roots of $1 + L$, or the Nyquist criterion of the next module), then read $S$ and $T$.
:::

::: note The waterbed
One more limit is worth knowing about, though its proof belongs to the next module. For a stable loop whose $L$ has a relative degree of at least two (at least two more poles than zeros), the *area* under $\ln\lvert S(j\omega)\rvert$, plotted against $\omega$, is fixed. Pushing $\lvert S\rvert$ down over one band forces it up over another. That is the **Bode sensitivity integral**, known to every practitioner as the **[[waterbed effect|waterbed]]**. Right-half-plane poles in $L$ make the fixed area positive rather than zero, so an unstable plant must pay for its stabilization with a sensitivity peak somewhere. The identity $S + T = 1$ says you cannot be good at both things at one frequency. The waterbed says you cannot even be good at one thing at all frequencies.
:::

## Check yourself

::: check
A pointing loop achieves $\lvert S\rvert = -30\,\mathrm{dB}$ at $0.05\,\mathrm{rad/s}$. What is $\lvert T\rvert$ there, how accurately can you state it, and what two engineering consequences follow?
:::

::: answer
**The size of $T$.** Convert from decibels: $\lvert S\rvert = 10^{-30/20} = 0.0316$. Since $T = 1 - S$ exactly, $\lvert T\rvert$ lies between $1 - 0.0316 = 0.968$ and $1 + 0.0316 = 1.032$, depending on the phase of $S$. In decibels that is between $-0.28\,\mathrm{dB}$ and $+0.27\,\mathrm{dB}$. So you can state it to within about a third of a decibel without knowing anything else about the loop.

**First consequence.** Sensor error at $0.05\,\mathrm{rad/s}$ reaches the output almost undiminished. So the loop's pointing accuracy at that frequency is the *sensor's* accuracy, and the controller cannot improve it. That is why low-frequency gyro drift and star-tracker bias, rather than high-frequency noise, set a spacecraft's pointing budget.

**Second consequence.** Robust stability needs $\lvert T\rvert < 1/\lvert\Delta\rvert$ (the last question shows why). With $\lvert T\rvert \approx 1$, the loop tolerates less than 100% multiplicative plant error at that frequency. That is acceptable at $0.05\,\mathrm{rad/s}$, where a rigid-body model is trustworthy. It is the reason $\lvert T\rvert$ must be pushed well below 1 before reaching frequencies where the model is not.
:::

::: check
A loop has $\lvert L(j\omega_1)\rvert = 100$ at $\omega_1 = 0.02\,\mathrm{rad/s}$ and $\lvert L(j\omega_2)\rvert = 0.02$ at $\omega_2 = 30\,\mathrm{rad/s}$. Estimate $\lvert S\rvert$ and $\lvert T\rvert$ at each, and say what the loop does to a gust at $\omega_1$ and to gyro noise at $\omega_2$.
:::

::: answer
**At $\omega_1$**, $\lvert L\rvert$ is large: $\lvert S\rvert \approx 1/100 = 0.01$ ($-40\,\mathrm{dB}$) and $\lvert T\rvert \approx 1$ ($0\,\mathrm{dB}$). A gust at $0.02\,\mathrm{rad/s}$ is cut a hundredfold — the loop is doing its job — while any gyro noise at that frequency passes to the attitude undiminished.

**At $\omega_2$**, $\lvert L\rvert$ is small: $\lvert S\rvert \approx 1$ and $\lvert T\rvert \approx 0.02$ ($-34\,\mathrm{dB}$). Gyro noise at $30\,\mathrm{rad/s}$ is cut fiftyfold at the output, and a disturbance at that frequency passes straight through, because the loop is no longer paying attention.

Both estimates satisfy $S + T = 1$ to the accuracy of the approximation. The design is the standard one: high loop gain where the disturbances live, low loop gain where the noise and the unmodeled dynamics live.
:::

::: check
A design review reports $\mathrm{GM} = 8\,\mathrm{dB}$ and $\mathrm{PM} = 35^\circ$. Can you conclude that $M_s \le 2$?
:::

::: answer
No — the implication runs the other way. $M_s \le 2$ *guarantees* $\mathrm{GM} \ge 6\,\mathrm{dB}$ and $\mathrm{PM} \ge 29^\circ$, but good classical margins do not guarantee a small $M_s$.

Each classical margin checks the polar plot at one point only. Gain margin looks at the phase crossover; phase margin looks at the gain crossover. A polar plot can swing close to $-1$ at some frequency in between while staying far from it at both of those points. Then the margins look comfortable and $M_s$ is large.

The only way to know is to compute $\min_\omega\lvert 1 + L(j\omega)\rvert$ over a frequency grid fine enough to catch a narrow approach. For a lightly damped structural mode, that means resolving a band about $2\zeta\omega_n$ wide.
:::

::: check
For the launch-vehicle loop above, a bending mode at $18\,\mathrm{rad/s}$ with $\zeta = 0.005$ is found in the structural model. From the $S$ and $T$ table, is it likely to matter?
:::

::: answer
The table shows $\lvert L\rvert = -23.1\,\mathrm{dB}$ at $20\,\mathrm{rad/s}$ — a factor of $0.070$ — so the rigid loop gain at $18\,\mathrm{rad/s}$ is about $-22\,\mathrm{dB}$.

A mode with $\zeta = 0.005$ has a resonant peak of about $1/(2\zeta) = 100$, which is $+40\,\mathrm{dB}$, at its own frequency. Depending on how strongly the mode couples into the gyro and the nozzle, the loop gain at $18\,\mathrm{rad/s}$ could rise to about $-22 + 40 = +18\,\mathrm{dB}$. That is far above 1, with a phase that swings $180^\circ$ across the mode. It creates a second gain crossover in a place with no phase margin, and the loop would very likely be unstable at the bending frequency.

So yes, it matters. The remedies — a notch filter to gain-stabilize it, or a deliberate phase arrangement to phase-stabilize it — are the business of the next module. The general lesson: a small $\lvert L\rvert$ *on the rigid model* says nothing until the flexible model has been added.
:::

::: check
Show that $T$ is also the transfer function from reference to output, and explain why the same function governs robustness to multiplicative plant uncertainty.
:::

::: answer
**Command response.** In the output equation, the coefficient of $r$ is $L/(1 + L) = T$. So $T$ is the command response: the "closed-loop transfer function" of lesson 11 and $T$ are the same object.

**Robustness.** Let the true plant be $G(1 + \Delta)$, where $\Delta$ ("delta") is an unknown **[[multiplicative error|multiplicative-uncertainty]]** — a fractional error that can vary with frequency. The loop gain becomes $L(1 + \Delta)$, and the characteristic function becomes

$$
1 + L + L\Delta = (1 + L)\left(1 + \frac{L}{1 + L}\Delta\right) = (1 + L)\left(1 + T\Delta\right).
$$

The nominal loop's stability survives the error exactly when the second factor, $1 + T\Delta$, adds no right-half-plane zeros. That is assured when $\lvert T(j\omega)\Delta(j\omega)\rvert < 1$ at every frequency, that is $\lvert T\rvert < 1/\lvert\Delta\rvert$: then $T\Delta$ can never reach $-1$.

Plant uncertainty is almost always largest at high frequency — unmodeled actuator lag, structural modes, delay. So this says $\lvert T\rvert$ must roll off before the uncertainty grows past 100%. That is the same instruction as "keep crossover below the frequencies where you do not trust your model".
:::

## Summary

| Item | Statement |
| --- | --- |
| Sensitivity | $S = \dfrac{1}{1 + L}$; reference and output disturbance to error |
| Complementary sensitivity | $T = \dfrac{L}{1 + L}$; sensor noise to output, and reference to output |
| The identity | $S + T = 1$ at every frequency, for every plant and controller |
| Both at once | $\lvert S\rvert + \lvert T\rvert \ge 1$, so the larger is always at least $\tfrac{1}{2}$ |
| Gang of four | $S$, $T$, $GS$ (input disturbance to output), $CS$ (noise to control signal) |
| Output equation | $y = Tr - Tn + GS\,d_i + S\,d$; error $e = Sr + Tn - GS\,d_i - S\,d$ |
| Low frequency | $\lvert L\rvert \gg 1 \Rightarrow \lvert S\rvert \approx 1/\lvert L\rvert$, $\lvert T\rvert \approx 1$ |
| High frequency | $\lvert L\rvert \ll 1 \Rightarrow \lvert S\rvert \approx 1$, $\lvert T\rvert \approx \lvert L\rvert$ |
| At crossover | $\lvert S\rvert = \lvert T\rvert = 1/\lvert 1 + L\rvert$; equal to 1 when $\mathrm{PM} = 60^\circ$ |
| Modulus margin | $M_s = \max_\omega\lvert S\rvert = 1/\min_\omega\lvert 1 + L\rvert$; target $M_s \le 2$ |
| Guaranteed margins | $\mathrm{GM} \ge M_s/(M_s - 1)$, $\mathrm{PM} \ge 2\arcsin\left(1/(2M_s)\right)$ |
| Robust stability | $\lvert T\rvert < 1/\lvert\Delta\rvert$ against multiplicative uncertainty $\Delta$ |

That closes the module. You can now take a differential-equation model of a vehicle, linearize it, write its transfer function, read its poles and zeros, predict its step response, reduce it to the part that matters, sketch its Bode plot, close a loop around it, and say precisely what that loop will and will not do. The next module uses all of it to design controllers — PID and lead-lag, root locus, the Nyquist criterion, notch filters for bending modes, and the cascaded rate-inside-attitude architecture that every launch vehicle flies.

::: context gang-of-four Four functions, one loop
A loop has three outside inputs worth worrying about (reference, disturbances, noise) and two signals worth watching (the output, and the actuator command). Every path from one to the other turns out to be one of only four transfer functions — $S$, $T$, $GS$ and $CS$ — up to a sign.

The nickname "gang of four" is used in Åström and Murray's free textbook *Feedback Systems*, listed in this module's resources. Their advice is the one this lesson follows: never judge a loop from one of the four alone.
:::

::: context complementary-word Why "complementary"
Two angles are complementary when they add up to $90^\circ$: knowing one tells you the other. Complementary colors mix to white. In the same way, $T$ is called the *complementary* sensitivity because it and $S$ always add up to exactly $1$. Know one and you know the other — which is precisely why you cannot choose them separately.
:::

::: context st-triangle The identity as a triangle
At any one frequency, $S$ and $T$ are two arrows in the complex plane that, placed head to tail, must reach from $0$ to $1$. Here they are for the launch-vehicle loop of the first example at $\omega = 1\,\mathrm{rad/s}$, where $S = -0.037 + 0.759j$ and $T = 1.037 - 0.759j$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="160" x2="340" y2="160" stroke="#6c7a93" stroke-width="1.5"/>
  <circle cx="60" cy="160" r="4" fill="#1f2a44"/>
  <circle cx="220" cy="160" r="4" fill="#1f2a44"/>
  <text x="60" y="180" font-size="12" text-anchor="middle" fill="#1f2a44">0</text>
  <text x="220" y="180" font-size="12" text-anchor="middle" fill="#1f2a44">1</text>
  <line x1="60" y1="160" x2="54.8" y2="50.6" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="54.2,38.6 49.4,50.4 60.4,49.9" fill="#1d6fd1"/>
  <line x1="54.2" y1="38.6" x2="210.3" y2="152.9" stroke="#b4232c" stroke-width="3"/>
  <polygon points="220,160 207.1,157.3 213.6,148.5" fill="#b4232c"/>
  <text x="30" y="104" font-size="12" fill="#1d6fd1">S</text>
  <text x="146" y="92" font-size="12" fill="#b4232c">T</text>
  <text x="236" y="60" font-size="11" fill="#1f2a44">|S| = 0.76</text>
  <text x="236" y="78" font-size="11" fill="#1f2a44">|T| = 1.28</text>
  <text x="236" y="96" font-size="11" fill="#1f2a44">S + T = 1</text>
</svg>
```

Shrink one arrow and the other must stretch toward the full length from $0$ to $1$. The lengths always add to at least $1$ — the triangle inequality — so they cannot both be small.
:::

::: context st-bode S and T across frequency
The launch-vehicle loop of the first example, in decibels. $\lvert S\rvert$ (blue) is deep down at low frequency and rises to $0\,\mathrm{dB}$; $\lvert T\rvert$ (red) sits at $0\,\mathrm{dB}$ and falls away at high frequency. They cross near the $1.53\,\mathrm{rad/s}$ crossover, where the handover happens.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 225" font-family="Inter, Arial, sans-serif">
  <g stroke="#6c7a93" stroke-width="1">
    <line x1="40" y1="20" x2="40" y2="200"/><line x1="40" y1="200" x2="340" y2="200"/>
  </g>
  <line x1="40" y1="50" x2="340" y2="50" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
  <line x1="40" y1="110" x2="340" y2="110" stroke="#6c7a93" stroke-width="0.8" stroke-dasharray="2 4"/>
  <line x1="40" y1="170" x2="340" y2="170" stroke="#6c7a93" stroke-width="0.8" stroke-dasharray="2 4"/>
  <line x1="203.9" y1="20" x2="203.9" y2="200" stroke="#8fb8f0" stroke-width="1" stroke-dasharray="4 3"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40.0,144.4 47.5,144.4 55.0,144.3 62.5,144.1 70.0,143.9 77.5,143.6 85.0,143.0 92.5,142.2 100.0,140.9 107.5,139.0 115.0,136.2 122.5,132.3 130.0,127.2 137.5,120.7 145.0,112.9 152.5,103.9 160.0,94.2 167.5,83.9 175.0,73.8 182.5,64.5 190.0,57.2 197.5,52.4 205.0,49.9 212.5,48.8 220.0,48.3 227.5,48.2 235.0,48.2 242.5,48.2 250.0,48.2 257.5,48.2 265.0,48.2 272.5,48.3 280.0,48.3 287.5,48.4 295.0,48.6 302.5,48.9 310.0,49.2 317.5,49.6 325.0,50.0 332.5,50.2 340.0,50.1"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2.5" points="40.0,49.3 47.5,49.3 55.0,49.3 62.5,49.3 70.0,49.3 77.5,49.3 85.0,49.3 92.5,49.3 100.0,49.2 107.5,49.2 115.0,49.1 122.5,48.9 130.0,48.7 137.5,48.4 145.0,47.9 152.5,47.2 160.0,46.1 167.5,44.9 175.0,43.6 182.5,42.8 190.0,43.5 197.5,46.2 205.0,50.9 212.5,56.5 220.0,62.6 227.5,68.8 235.0,75.0 242.5,81.2 250.0,87.3 257.5,93.3 265.0,99.4 272.5,105.5 280.0,111.6 287.5,117.7 295.0,124.1 302.5,130.8 310.0,138.2 317.5,147.1 325.0,158.1 332.5,171.7 340.0,187.3"/>
  <g font-size="11" fill="#6c7a93" text-anchor="end">
    <text x="36" y="54">0 dB</text><text x="36" y="114">−20</text><text x="36" y="174">−40</text>
  </g>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="40" y="215">0.01</text><text x="115" y="215">0.1</text><text x="190" y="215">1</text><text x="265" y="215">10</text><text x="334" y="215">100 rad/s</text>
  </g>
  <text x="70" y="136" font-size="12" fill="#1d6fd1">|S|</text>
  <text x="70" y="40" font-size="12" fill="#b4232c">|T|</text>
  <text x="262" y="140" font-size="12" fill="#b4232c">|T|</text>
  <text x="262" y="40" font-size="12" fill="#1d6fd1">|S|</text>
</svg>
```
:::

::: context nyquist-closest The closest approach, drawn
The polar plot of the first example's $L(j\omega)$ near the critical point $-1$ (only the part inside this window is drawn). The dashed circle around $-1$ has radius $0.932$, the modulus margin: the curve touches it at $4.36\,\mathrm{rad/s}$ and never gets closer. The grey circle is $\lvert L\rvert = 1$; where the curve crosses it is the gain crossover.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 215" font-family="Inter, Arial, sans-serif">
  <g transform="translate(0,10)">
    <line x1="20" y1="50" x2="345" y2="50" stroke="#6c7a93" stroke-width="1"/>
    <line x1="220" y1="-5" x2="220" y2="200" stroke="#6c7a93" stroke-width="1"/>
    <circle cx="220" cy="50" r="60" fill="none" stroke="#6c7a93" stroke-width="1" stroke-dasharray="2 3"/>
    <circle cx="160" cy="50" r="55.9" fill="none" stroke="#1d6fd1" stroke-width="1.5" stroke-dasharray="5 4"/>
    <polyline fill="none" stroke="#b4232c" stroke-width="2.5" points="40,181.2 46.2,179.7 55.6,176.3 64.6,173.0 73.0,169.7 81.1,166.5 88.7,163.4 97.2,159.8 105.1,156.2 113.0,152.6 120.3,149.0 127.4,145.4 134.9,141.4 141.9,137.6 148.9,133.4 155.6,129.3 162.0,125.0 168.3,120.6 174.4,116.1 180.1,111.4 185.7,106.5 190.9,101.5 195.9,96.1 200.7,90.3 205.0,84.1 208.8,77.6 212.0,70.5 214.5,62.7 216.1,54.0 217.3,50.1 218.7,48.9 220.4,49.7"/>
    <circle cx="160" cy="50" r="4" fill="#1f2a44"/>
    <text x="160" y="40" font-size="12" text-anchor="middle" fill="#1f2a44">−1</text>
    <text x="228" y="44" font-size="11" fill="#6c7a93">0</text>
    <line x1="160" y1="50" x2="212.9" y2="68.2" stroke="#1f2a44" stroke-width="1.5"/>
    <circle cx="212.9" cy="68.2" r="3.5" fill="#1f2a44"/>
    <text x="232" y="84" font-size="11" fill="#1f2a44">closest: 0.932</text>
    <text x="232" y="98" font-size="11" fill="#1f2a44">at 4.36 rad/s</text>
    <text x="44" y="165" font-size="11" fill="#b4232c">L(jω)</text>
  </g>
</svg>
```

Every point of the curve's distance from $-1$ is $1/\lvert S\rvert$ at that frequency, so the closest point is where $\lvert S\rvert$ peaks.
:::

::: context gyro-drift Drift: the slow error
A gyro measures rotation rate, and an attitude estimate comes from adding up (integrating) that rate. A tiny constant error in the rate — a **bias** — adds up too, so the attitude estimate slowly creeps away from the truth. That slow creep is **drift**, and it is a low-frequency error.

The loop cannot tell drift from real motion: it faithfully steers the vehicle to follow the drifting estimate. That is why spacecraft correct their gyros with star trackers, and launch vehicles use the best gyros they can afford.
:::

::: context bending-mode A rocket bends
A tall rocket is a long, thin tube, and it flexes like a fishing rod. The shapes it bends in, each with its own frequency, are its **bending modes**. On a large launch vehicle the first one is low — often only a few hertz — and lightly damped, so it rings for a long time once excited.

The gyros sit somewhere along the flexing body, so they feel the bending as well as the rigid rotation. If the control loop still has gain at the bending frequency, it can pump energy into the bending. Keeping the loop quiet there is a central job of launch-vehicle control design.
:::

::: context derivative-filter Taming the derivative
A pure derivative, $K_ds$, has a gain of $K_d\omega$ that keeps rising with frequency, so fast noise gets amplified the most. Adding a first-order low-pass filter,

$$
\frac{K_ds}{1 + s/\omega_f},
$$

keeps the derivative's behavior below $\omega_f$ but makes the gain level off at $K_d\omega_f$ above it. With $\omega_f$ a few times crossover, the loop barely notices the change near crossover, while the noise reaching the actuator stops growing. Every real PID implementation does something like this.
:::

::: context waterbed Why "waterbed"
Push down on a waterbed in one spot and it bulges up somewhere else: the water has to go somewhere. The sensitivity integral says $\ln\lvert S\rvert$ behaves the same way — press it down over one band of frequencies and it rises over another.

The result goes back to Hendrik Bode's 1945 book *Network Analysis and Feedback Amplifier Design*, written about amplifiers at Bell Labs; it was later extended to unstable plants. The next module uses it to explain why every design has a sensitivity peak somewhere.
:::

::: context multiplicative-uncertainty Error as a percentage
A **multiplicative** error describes how wrong the model is as a fraction of the model itself: the true plant is $G(1 + \Delta)$. A $\Delta$ of $0.2$ means 20% off; a $\Delta$ with magnitude $1$ means the error is as big as the model — at that frequency you know essentially nothing.

Engineers describe it this way because model errors usually grow with frequency: the rigid-body model is excellent when things move slowly and poor near actuator lags and bending modes. Then $\lvert T\rvert < 1/\lvert\Delta\rvert$ becomes a picture: $\lvert T\rvert$ has to sink below the rising $1/\lvert\Delta\rvert$ curve.
:::
