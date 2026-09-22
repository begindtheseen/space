---
id: l08-why-margins-can-lie
title: Why margins can lie
minutes: 22
covers:
  - 'Why margins can lie: MIMO coupling, nonlinearity, simultaneous perturbations'
---

A margin is a promise about one perturbation applied to one loop of a linear model. Every word in that sentence is a place the promise can fail. Real errors arrive together rather than one at a time; real vehicles have several loops that share an airframe; and real actuators saturate, rate-limit and quantise, at which point the linear model that produced the margin has stopped describing anything.

This lesson takes the three failures apart with worked numbers. None of them is exotic — each has grounded vehicles — and none of them means the classical margins are useless. They mean the margins are necessary conditions computed on a model, and the last section says what modern practice adds on top. The honest summary is that gain margin and phase margin are the *first* questions you ask about a loop, not the last.

## One axis at a time is not the same as both at once

Gain margin perturbs $L$ along a ray through the origin; phase margin rotates it about the origin. Nothing perturbs it diagonally, which is how most errors actually arrive: an actuator that is both 20% stronger and 5 ms slower than modelled.

The combined boundary is computable. Multiplying $L$ by $k\,e^{-j\varphi}$ reaches $-1$ when $|L(j\omega)| = 1/k$ and $\angle L(j\omega) - \varphi = -180^\circ$ at some $\omega$. So for each gain factor $k$, find the frequency where $|L| = 1/k$ and read the phase margin *there*.

::: example The simultaneous boundary for the rate loop
Take the loop from the margins lesson, $L(s) = (12\,000s + 24\,000)e^{-0.008s}/(24s^3 + 1200s^2)$, with its $22.07\ \mathrm{dB}$ gain margin and $62.80^\circ$ phase margin.

| Gain factor $k$ | $\omega$ where $\lvert L\rvert = 1/k$ | phase then available | equivalent delay |
| --- | --- | --- | --- |
| 1.00 (0 dB) | 10.00 rad/s | 62.80° | 110 ms |
| 1.50 (3.5 dB) | 14.54 rad/s | 59.29° | 71 ms |
| 2.00 (6.0 dB) | 18.82 rad/s | 54.68° | 51 ms |
| 3.00 (9.5 dB) | 26.57 rad/s | 45.53° | 30 ms |
| 6.00 (15.6 dB) | 44.75 rad/s | 25.10° | 9.8 ms |
| 12.68 (22.1 dB) | 72.21 rad/s | 0° | 0 ms |

Read the last column. The design has a 110 ms delay margin — but only if the gain is exactly nominal. A vehicle that comes out 6 dB hot has 51 ms, and one that comes out 15.6 dB hot has 9.8 ms, which is less than one cycle of a 100 Hz flight loop. Neither number appears on a margin table that reports 22.07 dB and 62.80°.
:::

The modern name for the joint quantity is the **disk margin**. Instead of a ray and a circle, model the perturbation as a complex factor $f(\delta) = (2 + \alpha\delta)/(2 - \alpha\delta)$ with $|\delta| \le 1$, which fills a disk in the complex plane containing $f = 1$. The largest $\alpha$ the loop tolerates at every frequency is $\alpha = 1/\lVert S - \tfrac12\rVert_\infty$, and the disk's extreme gain and phase are

$$
\text{gain} \in \left[\frac{2-\alpha}{2+\alpha},\ \frac{2+\alpha}{2-\alpha}\right],
\qquad
\text{phase} \in \left[-2\arctan\frac{\alpha}{2},\ +2\arctan\frac{\alpha}{2}\right].
$$

For the rate loop, $\lVert S - \tfrac12\rVert_\infty = 0.834$, so $\alpha = 1.199$: the loop tolerates any perturbation inside a disk spanning $\pm12.0\ \mathrm{dB}$ of gain and $\pm61.9^\circ$ of phase. Those extremes are not achieved together — the disk boundary trades them — and checking against the exact table above, the disk allows $59.3^\circ$ at a gain of 1.5 (exact: 59.29°) and $53.9^\circ$ at a gain of 2.0 (exact: 54.68°). One number, $\alpha$, reproduces almost the whole boundary, and it covers gain reduction as well as increase, which the classical gain margin never does.

## Loop at a time is not the same as all loops at once

Now the harder failure. A vehicle has a pitch loop, a yaw loop and a roll loop sharing one airframe, one inertia tensor, one set of actuators. The standard practice is to break one loop, leave the others closed, and compute margins — and there is a plant on which every such margin is perfect and the system is destroyed by a 10% gain error.

::: example A spinning satellite with two transverse channels
Take a body spinning at $a = 10\ \mathrm{rad/s}$ about its third axis, with the two transverse rate channels coupled gyroscopically and the sensors also cross-coupled by the spin:

$$
\dot{\mathbf{x}} = \begin{bmatrix} 0 & a \\ -a & 0\end{bmatrix}\mathbf{x} + \mathbf{u},
\qquad
\mathbf{y} = \begin{bmatrix} 1 & a \\ -a & 1\end{bmatrix}\mathbf{x}.
$$

Its transfer matrix is $\mathbf{G}(s) = \mathbf{C}(s\mathbf{I} - \mathbf{A})^{-1}$, and since $(s\mathbf{I}-\mathbf{A})^{-1} = \frac{1}{s^2+a^2}\begin{bmatrix}s & a\\ -a & s\end{bmatrix}$,

$$
\mathbf{G}(s) = \frac{1}{s^2 + a^2}\begin{bmatrix} s - a^2 & a(s+1) \\ -a(s+1) & s - a^2 \end{bmatrix}.
$$

Close both channels with unit-gain negative feedback, $\mathbf{C} = \mathbf{I}$. Then $\det(\mathbf{I} + \mathbf{G}) = (s+1)^2/(s^2+a^2)$, so the closed-loop poles are $-1$ and $-1$: clean, fast enough, critically damped.

Break loop 1 with loop 2 closed. The loop transfer seen is $L_1 = g_{11} - g_{12}g_{21}/(1 + g_{22})$, and substituting,

$$
L_1(s) = \frac{s - a^2}{s^2+a^2} + \frac{a^2(s+1)}{s(s^2+a^2)} = \frac{s(s-a^2) + a^2(s+1)}{s(s^2+a^2)} = \frac{s^2 + a^2}{s(s^2+a^2)} = \frac{1}{s}.
$$

A pure integrator. Gain crossover at $1\ \mathrm{rad/s}$, phase margin $90^\circ$, phase never reaches $-180^\circ$ so the gain margin is infinite, $\lVert S\rVert_\infty = 1$ so the modulus margin is 1 — the best value any loop can have. By symmetry loop 2 is identical. Perturbing channel 1 alone by any positive factor $d$ gives the closed-loop polynomial $(s+1)(s+d)$: stable for every $d > 0$, so the gain margin really is infinite in both directions.

Now perturb both channels at once, by $1 + x$ on channel 1 and $1 - x$ on channel 2 — two actuators whose gains are slightly off in opposite directions, which is what a calibration error looks like. The characteristic polynomial becomes

$$
s^2 + 2s + \bigl(1 - (1+a^2)x^2\bigr) = 0,
$$

with roots $-1 \pm \sqrt{1+a^2}\,x$. The loop is unstable as soon as $|x| > 1/\sqrt{1+a^2} = 1/\sqrt{101} = 0.0995$. At $x = 0.10$ the poles are $-2.005$ and $+0.005$: a system with infinite gain margin on both loops, brought down by a 10% gain error.
:::

The mechanism is directional. The two channels have a strongly preferred direction — the spin couples them — and the single-loop tests only ever perturb along the coordinate axes. A perturbation that is small but points the wrong way in the two-dimensional input space is invisible to every loop-at-a-time test. The larger the coupling $a$, the smaller the fatal perturbation, as $1/\sqrt{1+a^2}$ says directly.

::: warning
Loop-at-a-time margins on a coupled plant are necessary but not sufficient, and they get worse as the coupling gets stronger. If your vehicle's channels are genuinely coupled — a spinning upper stage, a lifting body with roll-yaw coupling, a quadrotor, anything with a momentum bias — the single-loop margins are an incomplete report and you must say so. The multivariable quantity that closes the gap is the structured singular value $\mu$, and computing it is a robust-control task, not a classical one.
:::

## The plant is not linear

The third failure is the one every vehicle has, because every actuator has a stop. Once the loop saturates, superposition is gone and $L(j\omega)$ describes nothing. The classical tool for getting a foothold again is the **describing function**: feed the nonlinearity a sinusoid of amplitude $A$, keep only the first harmonic of the output, and call the complex ratio $N(A)$ an amplitude-dependent gain. It is an approximation — it assumes the rest of the loop filters away the harmonics — but it is usually a good one and it tells you the right story.

For a symmetric saturation with limit $U$ and $A \ge U$,

$$
N(A) = \frac{2}{\pi}\left[\arcsin\frac{U}{A} + \frac{U}{A}\sqrt{1 - \left(\frac{U}{A}\right)^2}\right],
$$

falling from 1 at $A = U$ to $0.609$ at $A = 2U$ ($-4.3\ \mathrm{dB}$), $0.253$ at $A = 5U$ ($-11.9\ \mathrm{dB}$) and $0.127$ at $A = 10U$ ($-17.9\ \mathrm{dB}$). Saturation is a *gain reduction* that grows with amplitude.

::: example What amplitude-dependent gain does to an unstable vehicle
For a stable plant, losing loop gain is uncomfortable but survivable — it walks you back along the root locus toward sluggishness. For an unstable plant there is a **minimum** gain, and losing gain is fatal.

The atmospheric flight module's booster needs $K_p > \mu_\alpha/\mu_\delta = 0.173$ and is flown at $K_p = 1.88$: a low-gain margin of $20\log_{10}(1.88/0.173) = 20.7\ \mathrm{dB}$. Saturation consumes that margin when $N(A) = 0.173/1.88 = 0.0921$, which the describing function reaches at $A = 13.8\,U$. With a $\pm5^\circ$ gimbal, that is a commanded gimbal oscillation of $69^\circ$ amplitude — far beyond anything a healthy flight produces, so this vehicle is comfortable.

Redo the arithmetic for a vehicle with only $6\ \mathrm{dB}$ of low-gain margin, which is the usual requirement rather than a luxury. Then $N = 0.5$, reached at $A = 2.48\,U$: a command only two and a half times the gimbal limit takes the effective gain below the minimum, and the vehicle diverges while its controller is working as designed. A low-gain margin and an actuator authority budget are the same conversation.
:::

**Rate limiting** is worse than saturation because it costs phase as well as gain. An actuator whose output slew rate is capped at $R$ cannot follow $A\sin\omega t$ once $A\omega > R$; beyond that its output degenerates toward a triangular wave that lags the command. Computing the first harmonic numerically:

| $A\omega/R$ | gain | phase |
| --- | --- | --- |
| 1.0 | 1.00 (0 dB) | 0° |
| 1.5 | 0.84 (−1.5 dB) | −15.8° |
| 2.0 | 0.64 (−3.9 dB) | −38.2° |
| 5.0 | 0.25 (−11.9 dB) | −71.7° |
| 10.0 | 0.13 (−17.9 dB) | −81.0° |

A loop with $45^\circ$ of phase margin is unstable once its command exceeds twice the rate-limit onset, and the phase lag tends toward $-90^\circ$ as the command grows. The onset condition $A\omega > R$ is the design rule: check it at the largest command amplitude the vehicle will see at its crossover frequency, not at the amplitudes of the linear simulation.

**Relays and deadbands create oscillations from nothing.** An ideal on-off actuator of magnitude $M$ has $N(A) = 4M/(\pi A)$, so $-1/N(A) = -\pi A/(4M)$ sweeps the entire negative real axis as $A$ grows: it *must* intersect the Nyquist curve of anything whose phase reaches $-180^\circ$. Solving $N(A)|G(j\omega_{pc})| = 1$ predicts a sustained oscillation at $\omega_{pc}$ with amplitude $A = 4M|G(j\omega_{pc})|/\pi$.

::: example Thruster chatter on the rate channel
Drive the rate channel $G(s) = e^{-0.008s}/\bigl(1200\,s(0.02s+1)\bigr)$ with an on-off thruster pair of $\pm50\ \mathrm{N\,m}$ switching on the sign of the rate error. From the tuning lesson, the plant's phase reaches $-180^\circ$ at $\omega_{pc} = 74.16\ \mathrm{rad/s}$, where $|G| = 1/K_u = 6.28\times10^{-6}$.

The predicted limit cycle is at $74.16\ \mathrm{rad/s}$, that is $11.8\ \mathrm{Hz}$, with rate amplitude

$$
A = \frac{4 \times 50 \times 6.28\times10^{-6}}{\pi} = 4.0\times10^{-4}\ \mathrm{rad/s} = 0.023^\circ/\mathrm{s}.
$$

The amplitude is small; the frequency is not, and 11.8 Hz of continuous thruster cycling is a propellant budget and a fatigue problem rather than a pointing problem. No linear margin predicts it, because the relay has no linear gain to compute a margin from. The standard cure is a deadband or hysteresis, which moves $-1/N$ off the negative real axis so that the intersection either disappears or moves to a much lower frequency.
:::

## What replaces the margins

None of this argues for abandoning gain and phase margin. They are cheap, they are interpretable, they are what a specification is written in, and a loop that fails them is finished. What modern practice does is add quantities that are honest about the three failures above.

- **Disk margins** replace the two single-axis tests with one family of simultaneous gain-and-phase perturbations, as computed above. They are the natural first upgrade and are now standard in flight-controls toolchains.
- **The sensitivity peak $\lVert S\rVert_\infty$** — the modulus margin of the previous lesson — bounds every additive perturbation at once. Designing directly against a bound on $\lVert S\rVert_\infty$, together with bounds on $\lVert T\rVert_\infty$ and on the actuator transfer $\lVert CS\rVert_\infty$, is **mixed-sensitivity $H_\infty$ synthesis**, and it produces a controller with a certificate rather than a controller you then measure.
- **The structured singular value $\mu$** handles exactly the multivariable case: uncertainty that enters at several places with known structure, such as one gain error per actuator. For the spinning satellite, $\mu$ returns $0.0995$ where the loop-at-a-time margins return infinity.
- **Dispersion analysis** is the practical backstop: sample the uncertain parameters — inertia, centre of gravity, aerodynamic derivatives, actuator gain and lag, modal frequencies and residues, delay — thousands of times, and compute margins for each draw. It proves nothing about the cases you did not sample, and it catches most of what the analytic tools miss.

The robust-control material in the later part of this track builds all four. What to carry out of this lesson is the habit: whenever you quote a margin, say what model it was computed on, what was perturbed, and what was held fixed.

## Check yourself

::: check
A loop has 10 dB of gain margin and $50^\circ$ of phase margin. The actuator turns out 4 dB stronger than modelled. What can you say about the remaining phase margin without recomputing?
:::

::: answer
Almost nothing, and that is the point. The remaining phase margin is the loop's phase margin measured at the *new* crossover frequency, which is wherever $|L|$ of the nominal loop equals $10^{-4/20} = 0.63$ — a higher frequency than the old crossover. Since phase generally falls with frequency, the remaining margin is less than $50^\circ$, but how much less depends entirely on the slope of the phase curve between the two frequencies, which the two published numbers do not contain. You have to go back to the frequency response. Quoting a disk margin instead would have answered it directly.
:::

::: check
For the spinning satellite, what happens to the fatal perturbation size if the spin rate is doubled to $a = 20\ \mathrm{rad/s}$, and what does that say about designing for a vehicle whose spin rate changes?
:::

::: answer
The destabilising perturbation is $|x| = 1/\sqrt{1+a^2}$, which falls from $1/\sqrt{101} = 0.0995$ to $1/\sqrt{401} = 0.0499$ — a 5% channel gain mismatch is now fatal. The single-loop margins are unchanged: $L_1$ is still exactly $1/s$ whatever $a$ is, with infinite gain margin and $90^\circ$ of phase margin. So the loop-at-a-time analysis reports identical, perfect margins for a vehicle that has become twice as fragile. For a vehicle whose spin rate varies — a spin-stabilised upper stage bleeding momentum, a vehicle in a coning recovery — the multivariable robustness must be evaluated across the range, because nothing in the per-channel numbers moves.
:::

::: check
An engineer argues that saturation cannot destabilise a loop because the describing function of a saturation is always less than or equal to 1, so saturation only ever reduces the loop gain. Where is this right and where is it wrong?
:::

::: answer
It is right that $N(A) \le 1$ for a symmetric saturation, and right that for a plant with no right-half-plane poles this pushes the loop toward the stable end of its gain range — which is why a stable, minimum-phase loop with a saturating actuator does not develop a limit cycle from the saturation alone. It is wrong in three ways. On an open-loop-unstable plant there is a minimum gain, and reducing gain crosses it: the booster example fails at $N = 0.0921$. It ignores windup, which is a state accumulated during saturation rather than a gain change and which is not captured by any describing function. And it ignores that a real actuator limit is usually a *rate* limit as well as a position limit, and rate limiting adds phase lag, which destabilises loops of any kind.
:::

::: check
A rate loop crosses over at $12\ \mathrm{rad/s}$ and the gimbal actuator slews at no more than $40^\circ/\mathrm{s}$. At what commanded gimbal amplitude does rate limiting begin at crossover, and what is the phase lag at twice that amplitude?
:::

::: answer
Rate limiting begins when $A\omega = R$, so $A = 40/12 = 3.33^\circ$ of gimbal amplitude at $12\ \mathrm{rad/s}$. At twice that, $A = 6.67^\circ$, the ratio $A\omega/R = 2$ and the table gives a gain of $0.64$ and a phase lag of $38^\circ$. A loop with $45^\circ$ of phase margin has $7^\circ$ left at that amplitude, which for practical purposes means the loop is oscillating. Note how small the amplitude is: $6.7^\circ$ of gimbal is an ordinary response to a wind gust, so the rate limit, not the position limit, is the binding constraint on a fast loop.
:::

::: check
Why is it reasonable to say that the disk margin is "the classical margins done properly", but not reasonable to say the same about $\lVert S\rVert_\infty$?
:::

::: answer
The disk margin answers the same question as gain and phase margin — how much may the loop transfer function be multiplied by, and in what directions — but with a two-dimensional family of factors instead of two one-dimensional families. It reduces to the classical margins at the extremes of its disk, so it is strictly a generalisation, and it fixes the specific defect that gain and phase errors arrive together. $\lVert S\rVert_\infty$ answers a different question: how large can the closed-loop amplification of a disturbance get, equivalently how close does the curve come to $-1$ under an *additive* perturbation. It bounds the classical margins, as the previous lesson showed, but it does not generalise them — a loop can have an excellent $\lVert S\rVert_\infty$ and a gain margin you would not accept if the curve has an unusual shape. The two are complementary numbers, not one replacing the other.
:::

## Summary

| Fact | Statement |
| --- | --- |
| Simultaneous perturbation | at gain $k$, the available phase is the phase margin at the frequency where $\lvert L\rvert = 1/k$ |
| Rate loop example | 62.8° at nominal gain, 54.7° at $+6\ \mathrm{dB}$, 25.1° at $+15.6\ \mathrm{dB}$ |
| Disk margin | $f(\delta) = (2+\alpha\delta)/(2-\alpha\delta)$, $\alpha = 1/\lVert S - \tfrac12\rVert_\infty$ |
| Its extremes | gain $\bigl[(2-\alpha)/(2+\alpha),\,(2+\alpha)/(2-\alpha)\bigr]$, phase $\pm2\arctan(\alpha/2)$ |
| For the rate loop | $\alpha = 1.199$: $\pm12.0\ \mathrm{dB}$ and $\pm61.9^\circ$, in one number |
| MIMO loop-at-a-time | $L_1 = g_{11} - g_{12}g_{21}/(1+g_{22})$ with the other loop closed |
| Spinning satellite | each loop $L_i = 1/s$ (infinite GM, 90° PM, $\lVert S\rVert_\infty = 1$); unstable at $\lvert x\rvert > 1/\sqrt{1+a^2} = 0.0995$ |
| Saturation | $N(A) = \frac{2}{\pi}\bigl[\arcsin\frac{U}{A} + \frac{U}{A}\sqrt{1-(U/A)^2}\bigr]$; $-4.3\ \mathrm{dB}$ at $A = 2U$ |
| Unstable plant | needs $N(A)K_p > \mu_\alpha/\mu_\delta$; 6 dB of low-gain margin is gone at $A = 2.48U$ |
| Rate limiting | onset at $A\omega > R$; $-3.9\ \mathrm{dB}$ and $-38^\circ$ at $A\omega/R = 2$, tending to $-90^\circ$ |
| Relay | $N(A) = 4M/(\pi A)$; limit cycle at $\omega_{pc}$ with $A = 4M\lvert G(j\omega_{pc})\rvert/\pi$ |
| Robust tools | disk margins, mixed-sensitivity $H_\infty$, structured singular value $\mu$, dispersion analysis |

The next lessons go back to design, with the compensators that buy phase where you need it and take gain away where you do not.
