---
id: l07-the-four-margins
title: Gain, phase, delay and modulus margins
minutes: 22
covers:
  - 'Gain margin, phase margin, delay margin, and the modulus (vector) margin'
---

Nyquist's criterion answers a yes-or-no question, and no vehicle has ever been certified on a yes. What a design review asks is *how much wrong* the model can be before the answer changes: how much extra loop gain, how much extra phase lag, how much extra latency, how much of everything at once. Those four questions have four answers, and all four are read off the same curve.

This lesson defines them precisely, derives the relationships between them, and computes all four for the rate loop you have been carrying since the first lesson. It then computes them for a second loop whose gain and phase margins are outstanding and which is nonetheless a loop you would not fly — which is the point where classical margins begin to run out, and where this module starts pointing at what replaces them.

Throughout, $L(j\omega)$ is the open-loop frequency response, $\omega_{gc}$ the **gain crossover frequency** where $|L| = 1$, and $\omega_{pc}$ the **phase crossover frequency** where $\angle L = -180^\circ$.

## Gain margin

Suppose the loop gain were multiplied by a real factor $k$ — a stronger actuator than modelled, a lighter vehicle, a higher control effectiveness. On the Nyquist plot that scales every point radially by $k$ without changing any angle. The curve reaches $-1$ when $k$ is large enough to push the negative-real-axis crossing out to the critical point, so the factor you can afford is the reciprocal of the magnitude at that crossing.

::: key
Gain margin — precise definition. The factor by which loop gain can increase before instability, measured **at the phase crossover frequency** where $\angle L = -180^\circ$. $\mathrm{GM} = 1/|L(j\omega_{pc})|$, usually quoted in dB. Aerospace loops target $\ge 6\ \mathrm{dB}$.
:::

Three practical points. A loop whose phase never reaches $-180^\circ$ has infinite gain margin — real, but often an artefact of a model that left out the delay. A loop with several $-180^\circ$ crossings has several candidate margins, and the binding one is the crossing with the *largest* magnitude. And an open-loop-unstable plant also has a gain margin *from below*, as the previous lesson showed: reducing gain moves the curve inward until $-1$ falls outside the encirclement.

## Phase margin

Now suppose the loop acquires extra phase lag with no change in magnitude — an unmodelled lag, a filter somebody added, a delay. That rotates every point of the Nyquist plot clockwise about the origin. The unit circle is where rotation can reach $-1$, so the affordable rotation is the angle between the curve's crossing of the unit circle and the negative real axis.

::: key
Phase margin — precise definition. Additional phase lag tolerable before instability, measured **at the gain crossover frequency** where $|L| = 1$. $\mathrm{PM} = 180^\circ + \angle L(j\omega_{gc})$. Aerospace loops target $\ge 30\text{--}45^\circ$, often $60^\circ$.
:::

Phase margin is the more useful of the two on most vehicles, because most of what a model gets wrong is phase: actuator dynamics, sensor filters, computational latency, structural compliance. It also correlates, loosely, with damping — for a second-order loop $\zeta \approx \mathrm{PM}/100$ for margins below about $65^\circ$ — but that correlation is a rule of thumb about a particular loop shape and not a definition.

## Delay margin

Delay is the perturbation the flight software team can actually give you a number for, so convert phase margin into time. A delay $T$ multiplies $L$ by $e^{-j\omega T}$: magnitude unchanged, phase reduced by $\omega T$ radians. The magnitude at $\omega_{gc}$ is therefore still 1, and the phase margin there is reduced to $\mathrm{PM} - \omega_{gc}T$. It vanishes when

$$
T = \frac{\mathrm{PM\ in\ radians}}{\omega_{gc}} .
$$

::: key
Delay margin. $\mathrm{DM} = \mathrm{PM}$ (in radians) $/\ \omega_{gc}$ (in rad/s), in seconds. The pure transport delay that would eat all remaining phase margin. This is the number you quote to the flight software team.
:::

This is the single most negotiable quantity in a control design, because latency is built from things people can change: sample rate, scheduling jitter, sensor filtering, bus transport, the order in which tasks run. A loop with a 110 ms delay margin and a 5 ms budget is comfortable; the same loop redesigned for four times the bandwidth has a 27 ms delay margin and the conversation becomes difficult.

## Modulus (vector) margin

Gain margin probes the curve along one ray; phase margin probes it along one circle. A curve can pass both tests and still come close to $-1$ on a diagonal that neither test looks at. The margin that closes the gap is the plain Euclidean distance from the critical point to the curve:

$$
\mathrm{MM} = \min_\omega\bigl|1 + L(j\omega)\bigr| = \frac{1}{\max_\omega|S(j\omega)|} = \frac{1}{\lVert S\rVert_\infty},
$$

since $S = 1/(1+L)$. It is the smallest *additive* perturbation of $L$, at any frequency and in any direction, that reaches $-1$.

::: key
Modulus (vector) margin. The minimum distance from the Nyquist curve of $L$ to the $-1$ point. It equals $1/\lVert S\rVert_\infty$. A value $\ge 0.5$ (peak sensitivity $\le 2$) is a common requirement — and it catches the fragile loops that GM and PM both miss.
:::

The modulus margin bounds the other two from below, and the derivations are two lines each. Write $M_s = \lVert S\rVert_\infty$, so every point of the curve is at least $1/M_s$ from $-1$.

At the phase crossover the curve is on the negative real axis at $-1/\mathrm{GM}$, whose distance from $-1$ is $1 - 1/\mathrm{GM}$. Requiring that to be at least $1/M_s$ gives

$$
\mathrm{GM} \ge \frac{M_s}{M_s - 1}.
$$

At the gain crossover the curve is on the unit circle, and the chord from $-1$ to a point at angle $-180^\circ + \mathrm{PM}$ has length $2\sin(\mathrm{PM}/2)$. Requiring that to be at least $1/M_s$ gives

$$
\mathrm{PM} \ge 2\arcsin\frac{1}{2M_s}.
$$

The common requirement $M_s \le 2$ therefore guarantees at least $6.0\ \mathrm{dB}$ of gain margin and $29.0^\circ$ of phase margin, all at once, from one number. The converse does not hold: good gain and phase margins guarantee nothing about $M_s$.

::: example All four margins for the rate loop
The loop from the tuning lesson, with the 8 ms delay included:

$$
L(s) = \frac{(12\,000\,s + 24\,000)\,e^{-0.008s}}{24s^3 + 1200s^2}.
$$

Sweeping $\omega$ and reading the four definitions off directly:

| Quantity | Value | Where |
| --- | --- | --- |
| Gain crossover | $\omega_{gc} = 10.00\ \mathrm{rad/s}$ | $\lvert L\rvert = 1$ |
| Phase margin | $62.80^\circ$ | at $\omega_{gc}$ |
| Phase crossover | $\omega_{pc} = 72.23\ \mathrm{rad/s}$ | $\angle L = -180^\circ$ |
| Gain margin | $22.07\ \mathrm{dB}$ (a factor of 12.7) | at $\omega_{pc}$ |
| Delay margin | $\mathrm{PM}/\omega_{gc} = 1.096/10.0 = 110\ \mathrm{ms}$ | — |
| Modulus margin | $0.802$, so $\lVert S\rVert_\infty = 1.247$ (1.92 dB) | at $28\ \mathrm{rad/s}$ |

Every requirement is met with room. Check the bounds for consistency: $M_s = 1.247$ guarantees $\mathrm{GM} \ge 1.247/0.247 = 5.05$, i.e. $14.1\ \mathrm{dB}$, and $\mathrm{PM} \ge 2\arcsin(0.401) = 47.3^\circ$. The actual margins, 22.1 dB and 62.8°, exceed both, as they must.

Use the delay margin. The 8 ms already in the model leaves 110 ms before instability; a further 20 ms of latency would cost $\omega_{gc}T = 10 \times 0.020 = 0.20\ \mathrm{rad} = 11.5^\circ$, bringing the phase margin to $51.3^\circ$ — still acceptable. Notice that the 8 ms modelled delay is a fifth of the raw phase budget at crossover but only 7% of the delay margin, because the delay margin is measured from the delayed loop.
:::

## Where the classical margins stop being enough

::: example Excellent margins, a loop you would not fly
Give the same vehicle a structural bending mode. A rate gyro on a flexible body measures the rigid rate plus the modal rate, so the plant becomes

$$
G(s) = \frac{1}{Js(\tau s + 1)} + \frac{R\,s}{s^2 + 2\zeta_m\omega_m s + \omega_m^2},
$$

with $\omega_m = 18\ \mathrm{rad/s}$, $\zeta_m = 0.005$ and a modal gain $R = -8\times10^{-6}$ in SI units — negative because the gyro is mounted on the far side of the mode's node from the actuator. At resonance the modal term contributes $|R|/(2\zeta_m\omega_m) = 4.44\times10^{-5}$ of rate per newton-metre, about the same as the rigid channel does at that frequency. Keep the PI controller unchanged.

The classical margins are superb. Gain crossover is still at $10.04\ \mathrm{rad/s}$ with a phase margin of $67.4^\circ$. The phase reaches $-180^\circ$ only far above, at $497\ \mathrm{rad/s}$, where $|L| = 0.002$: a gain margin of $54\ \mathrm{dB}$. On a margin table this loop looks better than the nominal one.

The modulus margin says otherwise. At $\omega = 18.03\ \mathrm{rad/s}$ the curve reaches $L = -0.699 - 0.264j$, a distance of $0.400$ from $-1$, so $\lVert S\rVert_\infty = 2.50$ — a failure against the usual $\le 2$ requirement. The magnitude there is $0.747$, which is $-2.5\ \mathrm{dB}$: the mode is gain-stabilised, but by only 2.5 dB, and at a phase of $-159^\circ$, which points the curve almost straight at the critical point.

The consequence is physical. Computing the closed-loop poles, the modal pair moves from $-0.09 \pm 18.0j$ open loop to $-0.0415 \pm 18.02j$ closed loop: the feedback has **halved the mode's damping**, from $\zeta_m = 0.005$ to $0.0023$. Every gust now excites a structural oscillation that takes $4/0.0415 = 96\ \mathrm{s}$ to decay. The loop is stable, its gain margin is 54 dB, and it will shake the vehicle for a minute and a half after every disturbance. Only the distance to $-1$ saw it coming.
:::

```python
import numpy as np

J, tau, kp, ki, wm, zm, R = 1200.0, 0.02, 12000.0, 24000.0, 18.0, 0.005, -8e-6
w = np.logspace(-2, 4, 600001)
s = 1j * w
G = 1 / (J * s * (tau * s + 1)) + R * s / (s**2 + 2 * zm * wm * s + wm**2)
L = (kp + ki / s) * G
i = np.argmin(abs(1 + L))
print(round(w[i], 2), np.round(L[i], 4), round(abs(1 + L[i]), 4), round(1 / abs(1 + L[i]), 3))
# 18.03 (-0.6992-0.264j) 0.4002 2.499
```

That example also explains a rule you will meet in every structural-stability specification: keep the loop gain at least 6 dB below unity across a gain-stabilised mode. At $-6\ \mathrm{dB}$ and the same $-159^\circ$ of phase, the distance to $-1$ would be $0.56$ rather than $0.40$, which clears the $M_s \le 2$ requirement. The 6 dB rule is the modulus-margin requirement in disguise.

::: warning
Several crossings, several margins. A loop with a resonance can cross the unit circle three times and the $-180^\circ$ line twice, and "the" phase margin then depends on which crossing your tool picked. Most software reports the highest gain crossover, which is not always the binding one. Report every crossing, or report the modulus margin, which has no such ambiguity because it is a minimum over all frequencies.
:::

::: warning
Margins are properties of a model. A 22 dB gain margin computed from a plant that omits the actuator's second-order dynamics, the sampling delay and the first bending mode is a statement about a vehicle that does not exist. Before quoting a margin, be able to say what is in the model that produced it — and note that the classical margins say nothing at all about coupling between channels, about behaviour under saturation, or about two perturbations occurring together. The next lesson takes each of those apart.
:::

## Check yourself

::: check
A loop crosses over at $6\ \mathrm{rad/s}$ with a phase margin of $45^\circ$. Give its delay margin, and the phase margin left after a 30 ms latency is discovered.
:::

::: answer
$\mathrm{PM} = 45^\circ = 0.7854\ \mathrm{rad}$, so $\mathrm{DM} = 0.7854/6 = 0.131\ \mathrm{s} = 131\ \mathrm{ms}$. A 30 ms delay costs $\omega_{gc}T = 6 \times 0.030 = 0.18\ \mathrm{rad} = 10.3^\circ$, leaving $34.7^\circ$ — still stable, and it has consumed 23% of the available delay budget. Note that the crossover frequency itself does not move, because a delay changes no magnitude.
:::

::: check
A loop has $\lVert S\rVert_\infty = 1.6$. What are the guaranteed gain and phase margins, and why is "guaranteed" the right word?
:::

::: answer
$\mathrm{GM} \ge M_s/(M_s-1) = 1.6/0.6 = 2.67$, i.e. $8.5\ \mathrm{dB}$, and $\mathrm{PM} \ge 2\arcsin\bigl(1/3.2\bigr) = 2 \times 18.21^\circ = 36.4^\circ$. "Guaranteed" is right because these are lower bounds derived from one global quantity: the actual margins are at least this good and are usually much better. The value of the bound is that it runs the other way from the usual practice — it lets one number certify both margins at once, and it cannot be defeated by a curve that dodges between the two single-axis tests.
:::

::: check
Why does a pure transport delay leave the gain margin's *value* unchanged in dB while making the loop less stable, and where does the change show up?
:::

::: answer
A delay has unit magnitude at every frequency, so it changes no point's distance from the origin. What it changes is phase, $-\omega T$, which moves the frequency at which the phase reaches $-180^\circ$ **downward** — to a lower $\omega_{pc}$, where the magnitude of the undelayed loop was larger. So the gain margin falls not because magnitudes changed but because the crossing moved to a place where the magnitude is bigger. In the rate loop, removing the 8 ms delay entirely moves the phase crossover out to infinity and the gain margin becomes infinite; adding delay pulls it in to 72.2 rad/s and 22.1 dB. The delay margin captures this directly and is the better quantity to track.
:::

::: check
A loop is reported with $\mathrm{GM} = 15\ \mathrm{dB}$ and $\mathrm{PM} = 70^\circ$. What is the largest $\lVert S\rVert_\infty$ consistent with those numbers, and what is the smallest?
:::

::: answer
There is no upper bound. The curve can make an excursion toward $-1$ at a frequency between the two crossings without altering either margin, exactly as the flexible-mode example does, so $M_s$ can be arbitrarily large while both classical margins stay excellent. That asymmetry is the whole reason $M_s$ is reported separately.

The smallest value is pinned down, because the two margins tell you two points the curve passes through. A gain margin of $15\ \mathrm{dB} = 5.62$ puts a point at $-1/5.62 = -0.178$, a distance of $0.822$ from $-1$. A phase margin of $70^\circ$ puts a point on the unit circle at a chord distance of $2\sin35^\circ = 1.147$. The minimum over all frequencies is at most the smaller of these, so $\mathrm{MM} \le 0.822$ and therefore $M_s \ge 1/0.822 = 1.22$. A loop achieving exactly $M_s = 1.22$ would be one whose closest approach to $-1$ happens to be at the phase crossover.
:::

::: check
The flexible loop in the example halved the bending mode's damping while showing a 54 dB gain margin. Explain, using the Nyquist picture, how those two facts live together.
:::

::: answer
Gain margin is measured only where the curve crosses the negative real axis, and for this loop that happens at $497\ \mathrm{rad/s}$, far above everything of interest, at a magnitude of 0.002. The modal excursion near $18\ \mathrm{rad/s}$ never crosses that axis: it reaches $-0.699 - 0.264j$, which is at $-159^\circ$, and turns back. So it is invisible to the gain-margin test, invisible to the phase-margin test (the curve is inside the unit circle there), and plainly visible to any measure of distance. Damping of a closed-loop mode is governed by how close the curve passes to $-1$ near that mode's frequency, because $|1+L|$ small means $|S|$ large means the loop is amplifying rather than suppressing at that frequency. Distance to $-1$ is the quantity that connects the frequency-domain picture to the damping you will actually observe.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\omega_{gc}$, $\omega_{pc}$ | gain crossover ($\lvert L\rvert = 1$) and phase crossover ($\angle L = -180^\circ$) |
| $\mathrm{GM} = 1/\lvert L(j\omega_{pc})\rvert$ | gain margin, in dB; target $\ge 6\ \mathrm{dB}$; binding crossing is the one with largest $\lvert L\rvert$ |
| $\mathrm{PM} = 180^\circ + \angle L(j\omega_{gc})$ | phase margin; target $\ge 30\text{--}45^\circ$, often $60^\circ$ |
| $\mathrm{DM} = \mathrm{PM_{rad}}/\omega_{gc}$ | delay margin, in seconds |
| $\mathrm{MM} = \min_\omega\lvert 1 + L\rvert = 1/\lVert S\rVert_\infty$ | modulus (vector) margin; target $\ge 0.5$, i.e. $\lVert S\rVert_\infty \le 2$ |
| $\mathrm{GM} \ge M_s/(M_s-1)$ | gain margin guaranteed by the sensitivity peak |
| $\mathrm{PM} \ge 2\arcsin\bigl(1/(2M_s)\bigr)$ | phase margin guaranteed by it; $M_s = 2$ gives 6.0 dB and 29.0° |
| Rate loop (8 ms delay) | $\omega_{gc} = 10.0$, PM $62.8^\circ$, GM 22.1 dB, DM 110 ms, $\lVert S\rVert_\infty = 1.247$ |
| Flexible loop | PM $67.4^\circ$, GM 54 dB, but MM $= 0.400$; modal damping halved to $\zeta = 0.0023$ |
| The 6 dB rule for modes | gain-stabilise a mode 6 dB below unity, and the distance to $-1$ clears $M_s \le 2$ |

Every margin in this lesson is a single-axis test on a single-input, single-output model. The next lesson asks what happens when the perturbations arrive together, when the loop is one of several, and when the vehicle stops behaving linearly.
