---
id: l08-why-margins-can-lie
title: Why margins can lie
minutes: 24
covers:
  - 'Why margins can lie: MIMO coupling, nonlinearity, simultaneous perturbations'
---

A weather forecast of "20% chance of rain" is a promise about one place, one afternoon, under the forecaster's model of the atmosphere. Move the place, stretch the afternoon, or let the model be wrong, and the promise no longer covers you.

A stability margin is the same kind of promise. It is a promise about **one** error, applied to **one** loop, of a **linear** model. Every word in that sentence is a place the promise can fail:

- Real errors arrive together, not one at a time.
- Real vehicles have several loops sharing one airframe.
- Real actuators hit their stops, run out of speed, and switch on and off. Once they do, the linear model that produced the margin no longer describes anything.

This lesson takes those three failures apart with worked numbers. None of them is exotic — each has grounded vehicles — and none of them makes the classical margins useless. They make the margins *necessary* checks on a model, not proof. The last section says what modern practice adds on top. The honest summary: gain margin and phase margin are the *first* questions you ask about a loop, not the last.

## One error at a time is not the same as both at once

Gain margin stretches $L$ straight out from the origin. Phase margin rotates it around the origin. Neither test does both at once — yet that is how errors usually arrive. An actuator can easily be both 20% stronger *and* 5 ms slower than the model said.

The combined limit can be computed. Multiply $L$ by a gain $k$ and an extra lag $\varphi$ ("phi"), which is the factor $k\,e^{-j\varphi}$. The loop reaches $-1$ when, at some frequency, $|L(j\omega)| = 1/k$ and $\angle L(j\omega) - \varphi = -180^\circ$. So for each gain factor $k$, find the frequency where $|L| = 1/k$ — that is where the stronger loop will now cross over — and read the phase margin *there*. That gives [[the joint boundary|joint-boundary]].

::: example The simultaneous boundary for the rate loop
Take the loop from the margins lesson, $L(s) = (12\,000s + 24\,000)e^{-0.008s}/(24s^3 + 1200s^2)$. Alone, its gain margin is $22.07\ \mathrm{dB}$ and its phase margin is $62.80^\circ$.

For each gain factor, find where $|L| = 1/k$, read the phase margin there, and divide it (in radians) by that frequency to get the delay still affordable:

| Gain factor $k$ | $\omega$ where $\lvert L\rvert = 1/k$ | phase then available | equivalent delay |
| --- | --- | --- | --- |
| 1.00 (0 dB) | 10.00 rad/s | 62.80° | 110 ms |
| 1.50 (3.5 dB) | 14.54 rad/s | 59.29° | 71 ms |
| 2.00 (6.0 dB) | 18.82 rad/s | 54.68° | 51 ms |
| 3.00 (9.5 dB) | 26.57 rad/s | 45.53° | 30 ms |
| 6.00 (15.6 dB) | 44.75 rad/s | 25.10° | 9.8 ms |
| 12.68 (22.1 dB) | 72.21 rad/s | 0° | 0 ms |

Check one row. At $k = 2$: $54.68^\circ = 0.954\ \mathrm{rad}$, and $0.954/18.82 = 0.0507\ \mathrm{s} = 51\ \mathrm{ms}$.

Now read the last column. The design has a $110\ \mathrm{ms}$ delay margin — but only if the gain is exactly as modelled. A vehicle that comes out $6\ \mathrm{dB}$ "hot" (twice the gain) has $51\ \mathrm{ms}$. One that comes out $15.6\ \mathrm{dB}$ hot has $9.8\ \mathrm{ms}$, less than one cycle of a 100 Hz flight computer. Neither number appears on a margin table that reports $22.07\ \mathrm{dB}$ and $62.80^\circ$.
:::

### The disk margin

The modern name for the joint quantity is the **disk margin**. Instead of a line and a circle, it lets the loop be multiplied by any complex factor inside a round region — a **disk** — around $1$ (which means "no change"). The factor is written

$$
f(\delta) = \frac{2 + \alpha\delta}{2 - \alpha\delta}, \qquad |\delta| \le 1,
$$

where $\delta$ ("delta") is any complex number of size at most one and $\alpha$ ("alpha") sets how big the disk is. When $\delta = 0$, $f = 1$. As $\delta$ roams its unit disk, $f$ fills a disk of gain-and-phase changes.

The largest $\alpha$ the loop tolerates at every frequency is

$$
\alpha = \frac{1}{\lVert S - \tfrac12\rVert_\infty},
$$

the flip of the peak of $|S - \tfrac12|$ over frequency. The disk's extreme gain and phase are

$$
\text{gain} \in \left[\frac{2-\alpha}{2+\alpha},\ \frac{2+\alpha}{2-\alpha}\right],
\qquad
\text{phase} \in \left[-2\arctan\frac{\alpha}{2},\ +2\arctan\frac{\alpha}{2}\right].
$$

For the rate loop, $\lVert S - \tfrac12\rVert_\infty = 0.834$, so $\alpha = 1/0.834 = 1.199$. The top gain is $(2 + 1.199)/(2 - 1.199) = 3.99$, which is $12.0\ \mathrm{dB}$, and the phase reach is $2\arctan(0.600) = 61.9^\circ$. So the loop tolerates any error inside a disk spanning $\pm12.0\ \mathrm{dB}$ and $\pm61.9^\circ$.

Those extremes are not reached together — the disk's edge trades one for the other. Compare with the exact table: the disk allows $59.3^\circ$ at a gain of 1.5 (exact: $59.29^\circ$) and $53.9^\circ$ at a gain of 2.0 (exact: $54.68^\circ$). One number, $\alpha$, reproduces almost the whole boundary. It also covers gain *drops*, which the classical gain margin never checks.

## One loop at a time is not the same as all loops at once

Now the harder failure. A vehicle has a pitch loop, a yaw loop and a roll loop sharing one airframe, one set of inertias, one set of actuators. The standard practice is to "break" one loop, leave the others closed, and compute margins for the broken one. Then repeat for each loop.

There is a plant on which every one of those margins is perfect — and a 10% gain error destroys it.

::: example A spinning satellite with two transverse channels
Take a body spinning at $a = 10\ \mathrm{rad/s}$ about its third axis. Its two sideways rate channels are coupled by [[gyroscopic effects|gyroscopic]], and its sensors are cross-coupled too:

$$
\dot{\mathbf{x}} = \begin{bmatrix} 0 & a \\ -a & 0\end{bmatrix}\mathbf{x} + \mathbf{u},
\qquad
\mathbf{y} = \begin{bmatrix} 1 & a \\ -a & 1\end{bmatrix}\mathbf{x}.
$$

Here $\mathbf{x}$ holds the two rates, $\mathbf{u}$ the two commands and $\mathbf{y}$ the two measurements. The [[transfer matrix|transfer-matrix]] is $\mathbf{G}(s) = \mathbf{C}(s\mathbf{I} - \mathbf{A})^{-1}$. The inverse of the $2\times2$ matrix is $(s\mathbf{I}-\mathbf{A})^{-1} = \frac{1}{s^2+a^2}\begin{bmatrix}s & a\\ -a & s\end{bmatrix}$, and multiplying by $\mathbf{C}$ gives

$$
\mathbf{G}(s) = \frac{1}{s^2 + a^2}\begin{bmatrix} s - a^2 & a(s+1) \\ -a(s+1) & s - a^2 \end{bmatrix}.
$$

Close both channels with unit-gain negative feedback, $\mathbf{C} = \mathbf{I}$. Then $\det(\mathbf{I} + \mathbf{G}) = (s+1)^2/(s^2+a^2)$, so the closed-loop poles are $-1$ and $-1$. Clean, fast enough, critically damped.

**Break loop 1 with loop 2 closed.** The loop seen at channel 1 is $L_1 = g_{11} - g_{12}g_{21}/(1 + g_{22})$: the direct path, plus the path that goes over to channel 2, around its closed loop, and back. Substituting the entries,

$$
L_1(s) = \frac{s - a^2}{s^2+a^2} + \frac{a^2(s+1)}{s(s^2+a^2)} = \frac{s(s-a^2) + a^2(s+1)}{s(s^2+a^2)} = \frac{s^2 + a^2}{s(s^2+a^2)} = \frac{1}{s}.
$$

The second step put both fractions over the common bottom $s(s^2+a^2)$. The third multiplied out the top: $s^2 - a^2 s + a^2 s + a^2 = s^2 + a^2$. The last cancelled it with the bottom.

A pure integrator. Its gain crossover is at $1\ \mathrm{rad/s}$ with a phase margin of $90^\circ$. Its angle never reaches $-180^\circ$, so the gain margin is infinite. And $\lVert S\rVert_\infty = 1$, so the modulus margin is $1$ — the best any loop can have. By symmetry, loop 2 is identical. Scale channel 1 alone by any positive factor $d$ and the closed-loop polynomial is $(s+1)(s+d)$: stable for every $d > 0$. The gain margin really is infinite, in both directions.

**Now perturb both channels at once**, by $1 + x$ on channel 1 and $1 - x$ on channel 2. That is two actuators whose gains are off in opposite directions — what a calibration error looks like. The characteristic polynomial becomes

$$
s^2 + 2s + \bigl(1 - (1+a^2)x^2\bigr) = 0,
$$

with roots $-1 \pm \sqrt{1+a^2}\,x$. A root turns positive as soon as $\sqrt{1+a^2}\,|x| > 1$, that is $|x| > 1/\sqrt{1+a^2} = 1/\sqrt{101} = 0.0995$. At $x = 0.10$ the poles are $-2.005$ and $+0.005$. Check: $\sqrt{101} \times 0.10 = 1.005$, and $-1 \pm 1.005$ gives exactly those. A system with infinite gain margin on both loops, brought down by a 10% gain error.
:::

The failure has a direction. The spin ties the two channels together, so the system is very sensitive to errors that push the channels *oppositely*. Loop-at-a-time tests only ever nudge one channel — along the axes of a two-dimensional space of errors. A small error pointing the wrong way, off the axes, is invisible to all of them. The stronger the coupling $a$, the smaller the fatal error, as $1/\sqrt{1+a^2}$ says.

::: warning
Loop-at-a-time margins on a coupled plant are necessary but not sufficient, and they get worse as the coupling gets stronger. If your vehicle's channels are genuinely coupled — a spinning upper stage, a lifting body with roll–yaw coupling, a quadrotor, anything carrying a spinning momentum wheel — the single-loop margins are an incomplete report, and you must say so. The multivariable tool that closes the gap is the **[[structured singular value|mu-reading]]** $\mu$ ("mu"). Computing it is a robust-control job, not a classical one.
:::

## The plant is not linear

The third failure is one every vehicle has, because every actuator has a stop. Once the loop **saturates** — the actuator is pinned at its limit — doubling the input no longer doubles the output, and $L(j\omega)$ describes nothing.

The classical tool for getting a foothold back is the **describing function**. Feed the nonlinear part a sine wave of amplitude $A$. Its output is some distorted repeating wave. Keep only its [[first harmonic|first-harmonic]] — the single sine wave at the input frequency that best matches the output — and call the ratio of that sine to the input $N(A)$: a gain that depends on amplitude. It is an approximation. It assumes the rest of the loop filters out the higher harmonics. But it is usually a good one, and it tells the right story.

For a symmetric saturation with limit $U$, and $A \ge U$,

$$
N(A) = \frac{2}{\pi}\left[\arcsin\frac{U}{A} + \frac{U}{A}\sqrt{1 - \left(\frac{U}{A}\right)^2}\right].
$$

It is $1$ at $A = U$ (no clipping yet). It falls to $0.609$ at $A = 2U$ ($-4.3\ \mathrm{dB}$), $0.253$ at $A = 5U$ ($-11.9\ \mathrm{dB}$) and $0.127$ at $A = 10U$ ($-17.9\ \mathrm{dB}$). Saturation is a *gain reduction* that grows with amplitude.

::: example What amplitude-dependent gain does to an unstable vehicle
For a stable plant, losing loop gain is uncomfortable but survivable — the closed-loop poles walk back along the root locus toward sluggishness. For an [[unstable plant there is a *minimum* gain|minimum-gain]], and losing gain is fatal.

The booster from the atmospheric-flight module needs $K_p > \mu_\alpha/\mu_\delta = 0.173$ and is flown at $K_p = 1.88$. (Here $\mu_\alpha$ and $\mu_\delta$ are that module's aerodynamic and control-effectiveness coefficients, not the $\mu$ of the last section.) Its low-gain margin is $20\log_{10}(1.88/0.173) = 20\log_{10}10.9 = 20.7\ \mathrm{dB}$.

Saturation eats that margin when $N(A) = 0.173/1.88 = 0.0921$. Solving the formula, that happens at $A = 13.8\,U$. With a $\pm5^\circ$ engine gimbal, that is a commanded gimbal swing of $13.8 \times 5 = 69^\circ$ — far beyond anything a healthy flight produces. This vehicle is comfortable.

Now redo it for a vehicle with only $6\ \mathrm{dB}$ of low-gain margin, which is the usual requirement rather than a luxury. Six dB is a factor of 2, so trouble starts when $N = 0.5$. The formula reaches $0.5$ at $A = 2.48\,U$. A command only two and a half times the gimbal limit takes the effective gain below the minimum, and the vehicle diverges while its controller works exactly as designed. A low-gain margin and an actuator-authority budget are the same conversation.
:::

### Rate limiting costs phase too

**Rate limiting** is worse than saturation, because it costs phase as well as gain. An actuator whose output can move no faster than $R$ cannot follow a command $A\sin\omega t$ once $A\omega > R$ — the command's fastest slope, $A\omega$, is more than the actuator can do. Beyond that point [[the output turns into a lagging triangle wave|rate-limit-wave]]. Computing its first harmonic numerically:

| $A\omega/R$ | gain | phase |
| --- | --- | --- |
| 1.0 | 1.00 (0 dB) | 0° |
| 1.5 | 0.84 (−1.5 dB) | −15.8° |
| 2.0 | 0.64 (−3.9 dB) | −38.2° |
| 5.0 | 0.25 (−11.9 dB) | −71.7° |
| 10.0 | 0.13 (−17.9 dB) | −81.0° |

A loop with $45^\circ$ of phase margin has only $7^\circ$ left once its command reaches twice the rate-limit onset, and loses all of it at about $2.2$ times the onset. As the command grows, the lag creeps toward $-90^\circ$. The onset condition $A\omega > R$ is the design rule. Check it at the *largest* command the vehicle will see at its crossover frequency — not at the gentle amplitudes of a linear simulation.

### Relays make oscillations from nothing

An on–off actuator, like a thruster that is either firing or not, is called a **relay**. An ideal relay of strength $M$ has

$$
N(A) = \frac{4M}{\pi A}.
$$

The loop oscillates wherever $N(A)\,G(j\omega) = -1$, that is, wherever the Nyquist curve of the plant $G$ meets the point $-1/N(A) = -\pi A/(4M)$. As $A$ grows, that point slides along the *entire* negative real axis. So it *must* meet the Nyquist curve of anything whose angle reaches $-180^\circ$. Setting $N(A)|G(j\omega_{pc})| = 1$ predicts a sustained oscillation — a **[[limit cycle|limit-cycle]]** — at $\omega_{pc}$ with amplitude

$$
A = \frac{4M|G(j\omega_{pc})|}{\pi}.
$$

::: example Thruster chatter on the rate channel
Drive the rate channel $G(s) = e^{-0.008s}/\bigl(1200\,s(0.02s+1)\bigr)$ with a pair of on–off thrusters giving $\pm50\ \mathrm{N\,m}$, switching on the sign of the rate error. From the tuning lesson, the plant's angle reaches $-180^\circ$ at $\omega_{pc} = 74.16\ \mathrm{rad/s}$, where $|G| = 1/K_u = 6.28\times10^{-6}$.

The predicted oscillation is at $74.16\ \mathrm{rad/s}$. Dividing by $2\pi$, that is $11.8\ \mathrm{Hz}$. Its rate amplitude is

$$
A = \frac{4 \times 50 \times 6.28\times10^{-6}}{\pi} = \frac{1.256\times10^{-3}}{3.1416} = 4.0\times10^{-4}\ \mathrm{rad/s} = 0.023^\circ/\mathrm{s}.
$$

The amplitude is tiny. The frequency is not: 11.8 Hz of nonstop thruster cycling is a propellant bill and a fatigue problem, not a pointing problem. No linear margin predicts it, because a relay has no fixed gain to compute a margin from. The standard cure is a deadband or hysteresis in the switching logic. That moves $-1/N$ off the negative real axis, so the meeting point either disappears or moves to a much lower frequency.
:::

## What replaces the margins

None of this argues for throwing out gain and phase margin. They are cheap, easy to interpret, and what specifications are written in — and a loop that fails them is finished. What modern practice does is add numbers that are honest about the three failures above.

- **Disk margins** replace the two single-direction tests with one family of simultaneous gain-and-phase errors, as computed above. They are the natural first upgrade and are now standard in flight-control toolchains.
- **The sensitivity peak $\lVert S\rVert_\infty$** — the modulus margin of the previous lesson — bounds every additive error at once. Designing directly against a limit on $\lVert S\rVert_\infty$, together with limits on $\lVert T\rVert_\infty$ and on the actuator transfer $\lVert CS\rVert_\infty$, is **mixed-sensitivity $H_\infty$ synthesis**. It produces a controller with a certificate, rather than a controller you then measure.
- **The structured singular value $\mu$** handles the multivariable case: errors that enter at several places with a known structure, such as one gain error per actuator. For the spinning satellite, $\mu$ analysis finds a peak of $\mu = 10.05$, which means an error of size $1/10.05 = 0.0995$ per channel is enough — exactly the fatal $x$ found above — where the loop-at-a-time margins said infinity.
- **[[Dispersion analysis|monte-carlo]]** is the practical backstop. Sample the uncertain parameters — inertia, center of gravity, aerodynamic coefficients, actuator gain and lag, modal frequencies, delay — thousands of times, and compute margins for each draw. It proves nothing about the cases you did not sample, and it catches most of what the analytic tools miss.

The robust-control material later in this track builds all four. The habit to carry out of this lesson: whenever you quote a margin, say what model it came from, what was perturbed, and what was held fixed.

## Check yourself

::: check
A loop has 10 dB of gain margin and $50^\circ$ of phase margin. The actuator turns out 4 dB stronger than modelled. What can you say about the remaining phase margin without recomputing?
:::

::: answer
Almost nothing — and that is the point. The remaining phase margin is the loop's phase margin measured at the *new* crossover. That is wherever the nominal loop has $|L| = 10^{-4/20} = 0.63$, which is a higher frequency than the old crossover. Since phase usually falls as frequency rises, the remaining margin is less than $50^\circ$. But how much less depends entirely on how steeply the phase falls between the two frequencies, and the two published numbers do not contain that. You have to go back to the frequency response. A disk margin would have answered it directly.
:::

::: check
For the spinning satellite, what happens to the fatal error size if the spin rate is doubled to $a = 20\ \mathrm{rad/s}$, and what does that say about designing for a vehicle whose spin rate changes?
:::

::: answer
The fatal error is $|x| = 1/\sqrt{1+a^2}$. It falls from $1/\sqrt{101} = 0.0995$ to $1/\sqrt{401} = 0.0499$: a 5% mismatch between the channel gains is now fatal.

The single-loop margins do not change at all. $L_1$ is still exactly $1/s$ whatever $a$ is, with infinite gain margin and $90^\circ$ of phase margin. So the loop-at-a-time analysis reports identical, perfect margins for a vehicle that has become twice as fragile. For a vehicle whose spin rate varies — a spin-stabilized upper stage slowing down, a vehicle recovering from coning — the multivariable robustness must be checked across the whole range, because nothing in the per-channel numbers moves.
:::

::: check
An engineer argues that saturation cannot destabilize a loop: the describing function of a saturation is never more than 1, so saturation only ever reduces the loop gain. Where is this right and where is it wrong?
:::

::: answer
It is right that $N(A) \le 1$ for a symmetric saturation. And for a plant with no unstable poles, lowering the gain pushes the loop toward the safe end of its gain range — which is why a stable, well-behaved loop does not start oscillating from saturation alone.

It is wrong in three ways. First, on an open-loop-unstable plant there is a minimum gain, and lowering the gain crosses it: the booster example fails at $N = 0.0921$. Second, it ignores windup, which is a state that builds up during saturation rather than a gain change, and no describing function captures it. Third, a real actuator limit is usually a *rate* limit as well as a position limit, and rate limiting adds phase lag, which can destabilize loops of any kind.
:::

::: check
A rate loop crosses over at $12\ \mathrm{rad/s}$ and the gimbal actuator slews at no more than $40^\circ/\mathrm{s}$. At what commanded gimbal amplitude does rate limiting begin at crossover, and what is the phase lag at twice that amplitude?
:::

::: answer
Rate limiting begins when $A\omega = R$, so $A = R/\omega = 40/12 = 3.33^\circ$ of gimbal amplitude at $12\ \mathrm{rad/s}$. At twice that, $A = 6.67^\circ$, the ratio $A\omega/R$ is 2, and the table gives a gain of $0.64$ and a phase lag of $38^\circ$.

A loop with $45^\circ$ of phase margin has $45 - 38 = 7^\circ$ left at that amplitude — for practical purposes it is oscillating. Notice how small the amplitude is: $6.7^\circ$ of gimbal is an ordinary response to a wind gust. On a fast loop the rate limit, not the position limit, is the constraint that bites.
:::

::: check
Why is it fair to call the disk margin "the classical margins done properly", but not fair to say the same about $\lVert S\rVert_\infty$?
:::

::: answer
The disk margin answers the same question as gain and phase margin — how much may the loop be *multiplied* by, and in which directions — but with a two-dimensional family of factors instead of two one-dimensional ones. At the extremes of its disk it reduces to pure gain and pure phase changes, so it is a true generalization. And it fixes the specific defect that gain and phase errors arrive together.

$\lVert S\rVert_\infty$ answers a different question: how much can the closed loop amplify a disturbance — equivalently, how close does the curve come to $-1$ under an error that is *added* to $L$. It sets floors under the classical margins, as the previous lesson showed, but it does not generalize them. A loop can have an excellent $\lVert S\rVert_\infty$ and still a gain margin you would not accept, if the curve has an unusual shape. The two are complementary numbers; neither replaces the other.
:::

## Summary

| Fact | Statement |
| --- | --- |
| Simultaneous error | at gain $k$, the available phase is the phase margin at the frequency where $\lvert L\rvert = 1/k$ |
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

::: context joint-boundary The boundary, drawn
Each point on the dark curve is a gain error (across) and the most extra phase lag the rate loop can take on top of it (up). Anything under the curve is stable. The blue curve is the edge of the disk margin, from the single number $\alpha = 1.199$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="170" x2="335" y2="170" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="50" y1="170" x2="50" y2="25" stroke="#1f2a44" stroke-width="1.2"/>
  <g stroke="#6c7a93" stroke-width="0.6" stroke-dasharray="2 3">
    <line x1="50" y1="130" x2="330" y2="130"/><line x1="50" y1="90" x2="330" y2="90"/><line x1="50" y1="50" x2="330" y2="50"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="186">0</text><text x="120" y="186">6</text><text x="190" y="186">12</text><text x="260" y="186">18</text><text x="330" y="186">24</text>
    <text x="190" y="202">extra gain (dB)</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="44" y="174">0°</text><text x="44" y="134">20°</text><text x="44" y="94">40°</text><text x="44" y="54">60°</text>
  </g>
  <text x="56" y="20" font-size="11" fill="#1f2a44">extra phase lag</text>
  <path d="M50.0,44.4 L56.6,45.1 L63.2,45.9 L69.8,46.9 L76.4,48.1 L83.0,49.5 L89.6,51.0 L96.2,52.8 L102.8,54.7 L109.4,56.8 L116.0,59.1 L122.6,61.5 L129.2,64.1 L135.8,66.9 L142.4,69.8 L149.0,72.9 L155.6,76.1 L162.2,79.4 L168.8,82.8 L175.4,86.4 L182.0,90.0 L188.6,93.7 L195.2,97.6 L201.8,101.5 L208.4,105.4 L215.0,109.5 L221.6,113.6 L228.2,117.7 L234.8,121.9 L241.4,126.1 L248.0,130.3 L254.6,134.6 L261.2,139.0 L267.8,143.3 L274.4,147.7 L281.0,152.1 L287.6,156.5 L294.2,161.0 L300.8,165.5 L307.4,170.0" fill="none" stroke="#1f2a44" stroke-width="2.5"/>
  <path d="M50.0,46.3 L57.2,46.4 L64.5,46.9 L71.7,47.7 L79.1,48.8 L86.5,50.3 L94.1,52.2 L101.8,54.6 L109.8,57.5 L117.8,61.1 L126.2,65.3 L134.6,70.4 L143.2,76.5 L151.8,83.8 L160.4,92.5 L168.6,102.8 L176.2,115.0 L182.6,128.9 L187.4,144.6 L189.9,161.3 L190.3,170.0" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <text x="250" y="118" font-size="11" fill="#1f2a44">exact</text>
  <text x="150" y="150" font-size="11" fill="#1d6fd1">disk</text>
</svg>
```

The disk is a little cautious — it gives up at 12 dB where the exact curve reaches 22 dB — but it gets the part that matters, where gain and phase errors come together, almost right.
:::

::: context gyroscopic Why spin couples the two channels
A spinning top does something strange when you push it: it moves sideways, at right angles to the push. That is gyroscopic coupling. On a spinning spacecraft, a torque meant to turn it about one sideways axis also swings it about the other.

So the two sideways channels are not independent. Whatever one controller does leaks into the other, and the faster the spin, the stronger the leak. That is why the coupling term in this example is the spin rate $a$ itself.
:::

::: context transfer-matrix A table of transfer functions
With two inputs and two outputs, one transfer function is not enough. You need four: how input 1 moves output 1, how input 2 moves output 1, and so on. Arranged in a $2\times2$ grid, they make the transfer matrix $\mathbf{G}(s)$, and $g_{12}$ ("g one two") is the entry in row 1, column 2 — how input 2 shows up in output 1.

The off-diagonal entries, $g_{12}$ and $g_{21}$, are the coupling. If they were zero, each loop would live alone and the one-loop-at-a-time tests would tell the whole story.
:::

::: context mu-reading Reading μ the right way round
$\mu$ is the Greek letter "mu". The structured singular value is a number computed at each frequency from the closed loop and the *shape* of the allowed errors — here, one independent gain error per channel. Big $\mu$ is bad: the smallest error of that shape that causes instability has size $1/\mu$.

For the spinning satellite the peak is $\mu = 10.05$, so errors of size $1/10.05 = 0.0995$ are enough. That matches the fatal $x$ found by hand. The robust-control module teaches how to compute it; for now, remember that it is the tool that looks in the directions the single-loop tests cannot.
:::

::: context first-harmonic Keeping only the first harmonic
Any repeating wave can be built from sine waves: one at the repeat frequency — the **first harmonic** — plus faster ones at 3, 5, 7 times it, and so on. Here a sine of amplitude $2U$ is clipped at $\pm U$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="80" x2="335" y2="80" stroke="#6c7a93" stroke-width="1"/>
  <line x1="30" y1="50" x2="335" y2="50" stroke="#6c7a93" stroke-width="0.8" stroke-dasharray="3 3"/>
  <line x1="30" y1="110" x2="335" y2="110" stroke="#6c7a93" stroke-width="0.8" stroke-dasharray="3 3"/>
  <path d="M30.0,80.0 L40.0,67.5 L50.0,55.6 L60.0,44.7 L70.0,35.4 L80.0,28.0 L90.0,22.9 L100.0,20.3 L105.0,20.0 L110.0,20.3 L120.0,22.9 L130.0,28.0 L140.0,35.4 L150.0,44.7 L160.0,55.6 L170.0,67.5 L180.0,80.0 L190.0,92.5 L200.0,104.4 L210.0,115.3 L220.0,124.6 L230.0,132.0 L240.0,137.1 L250.0,139.7 L255.0,140.0 L260.0,139.7 L270.0,137.1 L280.0,132.0 L290.0,124.6 L300.0,115.3 L310.0,104.4 L320.0,92.5 L330.0,80.0" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 3"/>
  <path d="M30.0,80.0 L35.0,73.7 L40.0,67.5 L45.0,61.5 L50.0,55.6 L55.0,50.0 L155.0,50.0 L160.0,55.6 L165.0,61.5 L170.0,67.5 L175.0,73.7 L180.0,80.0 L185.0,86.3 L190.0,92.5 L195.0,98.5 L200.0,104.4 L205.0,110.0 L305.0,110.0 L310.0,104.4 L315.0,98.5 L320.0,92.5 L325.0,86.3 L330.0,80.0" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <path d="M30.0,80.0 L40.0,72.4 L50.0,65.1 L60.0,58.5 L70.0,52.8 L80.0,48.4 L90.0,45.2 L100.0,43.7 L105.0,43.5 L110.0,43.7 L120.0,45.2 L130.0,48.4 L140.0,52.8 L150.0,58.5 L160.0,65.1 L170.0,72.4 L180.0,80.0 L190.0,87.6 L200.0,94.9 L210.0,101.5 L220.0,107.2 L230.0,111.6 L240.0,114.8 L250.0,116.3 L255.0,116.5 L260.0,116.3 L270.0,114.8 L280.0,111.6 L290.0,107.2 L300.0,101.5 L310.0,94.9 L320.0,87.6 L330.0,80.0" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="112" y="14" font-size="11" fill="#6c7a93">input, 2U</text>
  <text x="8" y="47" font-size="11" fill="#1f2a44">+U</text>
  <text x="8" y="114" font-size="11" fill="#1f2a44">−U</text>
  <text x="200" y="40" font-size="11" fill="#1d6fd1">clipped output</text>
  <text x="120" y="160" font-size="11" fill="#b4232c">first harmonic: 0.609 × 2U = 1.22U</text>
</svg>
```

The red sine is the best single-sine match to the blue clipped wave. Its amplitude is $0.609$ of the input's: that is $N(2U)$. The describing function throws away the faster harmonics, betting the rest of the loop filters them out.
:::

::: context minimum-gain Why an unstable vehicle needs enough gain
Balance a broom upright on your palm. If you react too gently, the broom falls faster than your hand can catch up. There is a smallest reaction that works.

A rocket steered by a swiveling engine is the same: aerodynamic forces try to tip it over, and the controller must push back harder than they push. The ratio $\mu_\alpha/\mu_\delta$ says how strong the tipping is compared with the engine's steering power, so it sets the smallest gain that keeps the vehicle upright.
:::

::: context rate-limit-wave What a rate limit does to a sine
Here the grey sine is the command, and the blue line is what an actuator limited to half the command's top speed ($A\omega/R = 2$) actually does.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="80" x2="335" y2="80" stroke="#6c7a93" stroke-width="1"/>
  <path d="M30.0,80.0 L40.0,68.6 L50.0,57.6 L60.0,47.7 L70.0,39.1 L80.0,32.4 L90.0,27.7 L100.0,25.3 L105.0,25.0 L110.0,25.3 L120.0,27.7 L130.0,32.4 L140.0,39.1 L150.0,47.7 L160.0,57.6 L170.0,68.6 L180.0,80.0 L190.0,91.4 L200.0,102.4 L210.0,112.3 L220.0,120.9 L230.0,127.6 L240.0,132.3 L250.0,134.7 L255.0,135.0 L260.0,134.7 L270.0,132.3 L280.0,127.6 L290.0,120.9 L300.0,112.3 L310.0,102.4 L320.0,91.4 L330.0,80.0" fill="none" stroke="#6c7a93" stroke-width="2" stroke-dasharray="5 3"/>
  <path d="M30.0,98.4 L136.9,36.8 L286.9,123.2 L330.0,98.4" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="105" y1="20" x2="105" y2="140" stroke="#6c7a93" stroke-width="0.8" stroke-dasharray="2 3"/>
  <line x1="136.9" y1="20" x2="136.9" y2="140" stroke="#1d6fd1" stroke-width="0.8" stroke-dasharray="2 3"/>
  <text x="60" y="152" font-size="11" fill="#6c7a93">command peak</text>
  <text x="140" y="152" font-size="11" fill="#1d6fd1">output peak, 38° later</text>
  <text x="250" y="30" font-size="11" fill="#1f2a44">A·ω / R = 2</text>
</svg>
```

The output is a triangle: the actuator ramps at full speed all the time, always chasing. Its peak arrives $38^\circ$ of a cycle late and reaches only about $0.79$ of the command. Lag and lost gain together are what make rate limits so dangerous to phase margin.
:::

::: context limit-cycle What a limit cycle is
A **limit cycle** is an oscillation that sustains itself at a fixed size. Nudge it bigger and it shrinks back; nudge it smaller and it grows back. A dripping tap and a squealing microphone are everyday examples.

Linear systems cannot do this — in a linear model an oscillation either grows, dies, or sits exactly on the edge. Only a nonlinearity, like a relay or a saturation, can settle on one particular amplitude, which is why describing functions are the tool for predicting one.
:::

::: context monte-carlo Thousands of imaginary flights
Dispersion analysis is often called **Monte Carlo** analysis, after the casino, because it uses random draws. Each run picks every uncertain number from its expected spread — this vehicle a little heavier, that actuator a little slow — and checks the result.

Launch-vehicle teams run thousands of such cases before flight. The value is breadth: it tries combinations no engineer would think to test by hand. The weakness is that a rare bad corner can still be missed, which is why it sits alongside the analytic tools rather than replacing them.
:::
