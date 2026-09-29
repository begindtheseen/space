---
id: l07-the-four-margins
title: Gain, phase, delay and modulus margins
minutes: 19
covers:
  - 'Gain margin, phase margin, delay margin, and the modulus (vector) margin'
---

Picture a mountain road with a cliff on one side. "Is the car on the road?" is a yes-or-no question. The question a careful driver asks is different: *how far* is the car from the edge? A car on the road but half a wheel from the drop is not a car you want to be in.

The Nyquist criterion from the last lesson is the yes-or-no question. It tells you whether a loop is stable. No vehicle has ever been approved on a yes alone. A design review asks how wrong the model can be before the answer flips. How much extra loop gain can it take? How much extra phase lag? How much extra time delay? How much of everything at once? Those four questions have four answers, called the four **margins**, and all four are read off [[the same Nyquist curve|four-on-one-curve]].

This lesson defines each margin, shows how they are tied together, and computes all four for the rate loop you have carried since the first lesson. Then it computes them for a second loop whose gain and phase margins look outstanding — and which you would still refuse to fly. That second loop is where the classical margins start to run out.

## The cliff edge and two special frequencies

Everything in this lesson is about the open-loop frequency response $L(j\omega)$ ("L of j omega"): the complex number the loop multiplies a sine wave by at frequency $\omega$. Its size $|L|$ says how much the loop amplifies. Its angle $\angle L$ says how far the output lags behind.

The closed loop goes unstable when $L(j\omega) = -1$ at some frequency, because then $1 + L = 0$ and the loop feeds a signal back exactly upside down and exactly as large as it started. The point $-1$ on the Nyquist plot is the cliff edge.

Two frequencies matter most:

- the **gain crossover frequency** $\omega_{gc}$ ("omega sub g c") — where the loop's size is exactly one, $|L| = 1$;
- the **phase crossover frequency** $\omega_{pc}$ ("omega sub p c") — where the loop's angle is exactly $-180^\circ$, so $L$ sits on the negative real axis.

To reach $-1$, the curve needs *both* a size of one *and* an angle of $-180^\circ$ at the same frequency. Each margin asks how far one of those two is from happening.

## Gain margin

Suppose the loop gain were multiplied by a real number $k$ bigger than one. The actuator might be stronger than modeled, the vehicle lighter, the control surfaces more effective. On the Nyquist plot, multiplying by $k$ stretches every point straight away from the origin by the factor $k$. No angle changes.

Now look at where the curve crosses the negative real axis — that is the phase crossover. Say it crosses at $-0.25$. Stretch by $k = 4$ and that point lands on $-1$. So the gain you can afford is the flip of the size at that crossing: $1/0.25 = 4$.

::: key
Gain margin — precise definition. The factor by which loop gain can increase before instability, measured **at the phase crossover frequency** where $\angle L = -180^\circ$. $\mathrm{GM} = 1/|L(j\omega_{pc})|$, usually quoted in dB. Aerospace loops target $\ge 6\ \mathrm{dB}$.
:::

Engineers quote it in **decibels** (dB), a log scale for ratios: a factor $k$ is $20\log_{10}k$ dB. A factor of 2 is $6.0\ \mathrm{dB}$ and a factor of 10 is $20\ \mathrm{dB}$. So the aerospace target of $6\ \mathrm{dB}$ says "the loop survives doubling its gain".

Three practical points.

- A loop whose angle never reaches $-180^\circ$ has infinite gain margin. That is real for the model, but it is often a sign the model left out the time delay.
- A loop that crosses $-180^\circ$ several times has several candidate margins. The one that counts is the crossing with the *largest* size, because it is nearest to $-1$.
- A plant that is unstable on its own also has a gain margin *from below*, as the Nyquist lesson showed. Cutting the gain shrinks the curve toward the origin until $-1$ is no longer circled the way stability needs.

## Phase margin

Now suppose the loop picks up extra phase lag but no change in size. An actuator responds a little slower than modeled, or somebody adds a filter. Extra lag rotates every point of the Nyquist curve clockwise around the origin. No distance from the origin changes.

Only points on the **unit circle** — the circle of radius one — can be rotated onto $-1$, because $-1$ is at distance one from the origin. The curve meets the unit circle at the gain crossover. The rotation you can afford is the angle between that meeting point and the negative real axis.

::: key
Phase margin — precise definition. Additional phase lag tolerable before instability, measured **at the gain crossover frequency** where $|L| = 1$. $\mathrm{PM} = 180^\circ + \angle L(j\omega_{gc})$. Aerospace loops target $\ge 30\text{--}45^\circ$, often $60^\circ$.
:::

For example, if $\angle L(j\omega_{gc}) = -135^\circ$, then $\mathrm{PM} = 180^\circ - 135^\circ = 45^\circ$. The loop can lag another $45^\circ$ at that frequency before it reaches the cliff.

Phase margin is usually the more useful of the two, because most of what a model gets wrong is phase: actuator dynamics, sensor filters, computer delay, a flexing structure. It also tracks damping, roughly. For a loop that behaves like a simple second-order system, the closed-loop damping ratio is about $\zeta \approx \mathrm{PM}/100$ (with PM in degrees) for margins below about $65^\circ$. That is a rule of thumb about one loop shape, not a definition.

## Delay margin

Time delay is the one error the flight software team can put a number on, so it pays to turn phase margin into seconds.

Think of an echo. If a sound comes back a fixed $0.1\ \mathrm{s}$ late, a slow hum is barely out of step, but a fast buzz is badly out of step. A delay costs more phase at higher frequency.

A pure delay of $T$ seconds multiplies $L$ by $e^{-j\omega T}$. That factor has size one at every frequency, so it changes no size. It subtracts $\omega T$ [[radians|why-radians]] of phase. At the gain crossover the size is still one, and the phase margin shrinks to $\mathrm{PM} - \omega_{gc}T$. It hits zero when

$$
T = \frac{\mathrm{PM\ in\ radians}}{\omega_{gc}} .
$$

::: key
Delay margin. $\mathrm{DM} = \mathrm{PM}$ (in radians) $/\ \omega_{gc}$ (in rad/s), in seconds. The pure transport delay that would eat all remaining phase margin. This is the number you quote to the flight software team.
:::

Delay margin is the easiest quantity in a control design to negotiate over, because [[latency is built from things people can change|latency-budget]]: the sample rate, scheduling jitter, sensor filters, data-bus transport, the order in which software tasks run. A loop with a $110\ \mathrm{ms}$ delay margin and a $5\ \mathrm{ms}$ latency budget is comfortable. Redesign the same loop for four times the bandwidth, with the same phase margin, and its delay margin falls to about $27\ \mathrm{ms}$ — and the conversation with the software team gets difficult.

## Modulus (vector) margin

Gain margin checks the curve along one line, the negative real axis. Phase margin checks it along one circle. A curve can pass both checks and still swing close to $-1$ on a diagonal that neither check looks at. It is like measuring how far a car is from a cliff only straight ahead and only straight sideways.

The fix is to measure the real distance — straight-line, in any direction — from the cliff edge to the closest point of the curve. The distance from $L$ to $-1$ is $|L - (-1)| = |1 + L|$, so

$$
\mathrm{MM} = \min_\omega\bigl|1 + L(j\omega)\bigr| = \frac{1}{\max_\omega|S(j\omega)|} = \frac{1}{\lVert S\rVert_\infty}.
$$

Read $\min_\omega$ as "the smallest value over all frequencies". Here $S = 1/(1+L)$ is the **sensitivity function** from the first lesson: how much the closed loop lets a disturbance through. Where the curve comes close to $-1$, $|1+L|$ is small and $|S|$ is big. The largest value of $|S|$ over frequency is written $\lVert S\rVert_\infty$, read "the [[infinity norm|infinity-norm]] of S", and is called the **peak sensitivity** $M_s$.

The modulus margin is the smallest change you could *add* to $L$ — at any frequency, in any direction — that reaches $-1$.

::: key
Modulus (vector) margin. The minimum distance from the Nyquist curve of $L$ to the $-1$ point. It equals $1/\lVert S\rVert_\infty$. A value $\ge 0.5$ (peak sensitivity $\le 2$) is a common requirement — and it catches the fragile loops that GM and PM both miss.
:::

### One number that guarantees the other two

The modulus margin sets a floor under the other two margins. Write $M_s = \lVert S\rVert_\infty$. Every point of the curve is then at least $1/M_s$ away from $-1$. Apply that to the two special points.

**At the phase crossover**, the curve sits on the negative real axis at $-1/\mathrm{GM}$. Its distance from $-1$ is $1 - 1/\mathrm{GM}$. That must be at least $1/M_s$:

$$
1 - \frac{1}{\mathrm{GM}} \ge \frac{1}{M_s}
\quad\Longrightarrow\quad
\frac{1}{\mathrm{GM}} \le \frac{M_s - 1}{M_s}
\quad\Longrightarrow\quad
\mathrm{GM} \ge \frac{M_s}{M_s - 1}.
$$

The first step moved $1/\mathrm{GM}$ to one side; the second flipped both sides, which reverses the inequality.

**At the gain crossover**, the curve sits on the unit circle, $\mathrm{PM}$ degrees around from $-1$. The straight line from $-1$ to that point is a [[chord of the circle|chord-picture]] of length $2\sin(\mathrm{PM}/2)$. That must be at least $1/M_s$:

$$
2\sin\frac{\mathrm{PM}}{2} \ge \frac{1}{M_s}
\quad\Longrightarrow\quad
\mathrm{PM} \ge 2\arcsin\frac{1}{2M_s}.
$$

So the common requirement $M_s \le 2$ guarantees at least $2/(2-1) = 2$, which is $6.0\ \mathrm{dB}$, of gain margin, and $2\arcsin(0.25) = 29.0^\circ$ of phase margin — both at once, from one number. It does not work the other way round: good gain and phase margins guarantee nothing about $M_s$.

::: example All four margins for the rate loop
The rate loop from the tuning lesson: a PI controller on a $1200\ \mathrm{kg\,m^2}$ body with a $0.02\ \mathrm{s}$ actuator lag, with an $8\ \mathrm{ms}$ delay included:

$$
L(s) = \frac{(12\,000\,s + 24\,000)\,e^{-0.008s}}{24s^3 + 1200s^2}.
$$

Sweep $\omega$ on a computer and read off each definition:

| Quantity | Value | Where |
| --- | --- | --- |
| Gain crossover | $\omega_{gc} = 10.00\ \mathrm{rad/s}$ | $\lvert L\rvert = 1$ |
| Phase margin | $62.80^\circ$ | at $\omega_{gc}$ |
| Phase crossover | $\omega_{pc} = 72.23\ \mathrm{rad/s}$ | $\angle L = -180^\circ$ |
| Gain margin | $22.07\ \mathrm{dB}$ (a factor of 12.7) | at $\omega_{pc}$ |
| Delay margin | $\mathrm{PM}/\omega_{gc} = 1.096/10.0 = 110\ \mathrm{ms}$ | — |
| Modulus margin | $0.802$, so $\lVert S\rVert_\infty = 1.247$ (1.92 dB) | at about $25\ \mathrm{rad/s}$ |

For the delay margin, the phase margin was turned into radians first: $62.80 \times \pi/180 = 1.096\ \mathrm{rad}$.

Every requirement is met with room to spare. Now check that the numbers agree with each other. With $M_s = 1.247$, the guaranteed gain margin is $1.247/0.247 = 5.05$, which is $14.1\ \mathrm{dB}$. The guaranteed phase margin is $2\arcsin(1/2.494) = 2\arcsin(0.401) = 47.3^\circ$. The actual margins, $22.1\ \mathrm{dB}$ and $62.8^\circ$, beat both floors, as they must.

Now use the delay margin. Suppose the software team finds another $20\ \mathrm{ms}$ of latency. It costs $\omega_{gc}T = 10 \times 0.020 = 0.20\ \mathrm{rad}$, which is $11.5^\circ$. The phase margin drops to $62.8 - 11.5 = 51.3^\circ$ — still fine. The crossover does not move, because a delay changes no size.

The $8\ \mathrm{ms}$ already in the model cost $10 \times 0.008 = 0.08\ \mathrm{rad} = 4.6^\circ$. Without it the phase margin would be $67.4^\circ$, so that delay used about 7% of the loop's total phase budget.
:::

## Where the classical margins stop being enough

::: example Excellent margins, a loop you would not fly
Give the same vehicle a structural **bending mode** — a natural wobble of the airframe, like a ruler twanged on the edge of a desk. A rate gyro on a flexible body measures the rigid-body rate plus the rate from the wobble. The plant becomes

$$
G(s) = \frac{1}{Js(\tau s + 1)} + \frac{R\,s}{s^2 + 2\zeta_m\omega_m s + \omega_m^2},
$$

with $J = 1200\ \mathrm{kg\,m^2}$, $\tau = 0.02\ \mathrm{s}$, a mode at $\omega_m = 18\ \mathrm{rad/s}$ with damping $\zeta_m = 0.005$, and a modal gain $R = -8\times10^{-6}$ in SI units. $R$ is negative because of [[where the gyro sits along the bending shape|mode-shape]] relative to the engine. Keep the same PI controller. To keep the arithmetic clean, this example leaves out the $8\ \mathrm{ms}$ delay.

How strong is the mode? At resonance the modal term has size $|R|/(2\zeta_m\omega_m) = 8\times10^{-6}/0.18 = 4.44\times10^{-5}$ rad/s per newton-meter. The rigid body at $18\ \mathrm{rad/s}$ gives $4.36\times10^{-5}$. So at that one frequency the wobble is as loud as the whole rigid vehicle.

The classical margins look superb. Gain crossover is still at $10.04\ \mathrm{rad/s}$, with a phase margin of $67.4^\circ$. The angle reaches $-180^\circ$ only far above, at $497\ \mathrm{rad/s}$, where $|L| = 0.002$: a gain margin of $54\ \mathrm{dB}$. On a margin table this loop looks *better* than the rigid one.

The modulus margin tells the truth. At $\omega = 18.03\ \mathrm{rad/s}$ the curve reaches $L = -0.699 - 0.264j$. Its distance from $-1$ is $|0.301 - 0.264j| = 0.400$, so $\lVert S\rVert_\infty = 1/0.400 = 2.50$. That fails the usual $\le 2$ requirement. The size there is $0.747$, which is $-2.5\ \mathrm{dB}$, and the angle is $-159^\circ$. The mode is kept below a size of one — [[gain-stabilized|gain-stabilised]] — but by only $2.5\ \mathrm{dB}$, and its angle points the curve almost straight at the cliff edge.

The result is physical. Work out the closed-loop poles and the modal pair moves from $-0.09 \pm 18.0j$ (open loop) to $-0.0415 \pm 18.02j$ (closed loop). The real part, which sets how fast a wobble dies, has halved: the feedback has **halved the mode's damping**, from $\zeta_m = 0.005$ to $0.0415/18.02 = 0.0023$. A wobble now takes [[about 96 seconds|four-over-sigma]], $4/0.0415$, to die away. The loop is stable, its gain margin is $54\ \mathrm{dB}$, and it will shake the vehicle for a minute and a half after every gust. Only the distance to $-1$ saw it coming.
:::

You can check the closest approach yourself:

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

That example explains a rule found in every structural-stability specification: keep the loop gain at least $6\ \mathrm{dB}$ below one across a gain-stabilized mode. At $-6\ \mathrm{dB}$ (a size of $0.5$) and the same $-159^\circ$, the distance to $-1$ would be $0.56$ instead of $0.40$. That clears the $M_s \le 2$ requirement. The 6 dB rule is the modulus-margin requirement in disguise.

::: warning
Several crossings, several margins. A loop with a resonance can cross the unit circle three times and the $-180^\circ$ line twice. "The" phase margin then depends on which crossing your software picked, and many tools report the highest-frequency one, which is not always the one that matters. Report every crossing — or report the modulus margin, which has no such doubt because it is a minimum over all frequencies.
:::

::: warning
Margins belong to a model. A 22 dB gain margin from a plant that leaves out the actuator's dynamics, the sampling delay and the first bending mode is a statement about a vehicle that does not exist. Before quoting a margin, be able to say what was in the model. And the classical margins say nothing about coupling between channels, about behavior when the actuator saturates, or about two errors arriving together. The next lesson takes each of those apart.
:::

## Check yourself

::: check
A loop crosses over at $6\ \mathrm{rad/s}$ with a phase margin of $45^\circ$. Give its delay margin, and the phase margin left after a 30 ms latency is discovered.
:::

::: answer
First turn the phase margin into radians: $45^\circ = 45 \times \pi/180 = 0.7854\ \mathrm{rad}$. Then $\mathrm{DM} = 0.7854/6 = 0.131\ \mathrm{s} = 131\ \mathrm{ms}$.

A 30 ms delay costs $\omega_{gc}T = 6 \times 0.030 = 0.18\ \mathrm{rad}$, which is $0.18 \times 180/\pi = 10.3^\circ$. That leaves $45 - 10.3 = 34.7^\circ$ — still stable, having used $30/131 = 23\%$ of the delay budget. The crossover frequency itself does not move, because a delay changes no size.
:::

::: check
A loop has $\lVert S\rVert_\infty = 1.6$. What are the guaranteed gain and phase margins, and why is "guaranteed" the right word?
:::

::: answer
$\mathrm{GM} \ge M_s/(M_s-1) = 1.6/0.6 = 2.67$, which is $20\log_{10}2.67 = 8.5\ \mathrm{dB}$. And $\mathrm{PM} \ge 2\arcsin\bigl(1/3.2\bigr) = 2 \times 18.21^\circ = 36.4^\circ$.

"Guaranteed" is right because these are floors worked out from one overall number. The true margins are at least this good and usually much better. The value of the floor is that one number certifies both margins at once, and a curve cannot sneak past it by dodging between the two single-direction tests.
:::

::: check
A pure transport delay changes no size anywhere on the Nyquist plot, yet it lowers the gain margin. How can both be true, and where does the change show up?
:::

::: answer
A delay has size one at every frequency, so it moves no point closer to or farther from the origin. What it changes is phase: it subtracts $\omega T$. That pulls the frequency where the angle reaches $-180^\circ$ **down** to a lower $\omega_{pc}$, where the undelayed loop was bigger. So the gain margin falls, not because any size changed, but because the crossing moved to a place where the size is larger.

In the rate loop, removing the 8 ms delay entirely means the angle never quite reaches $-180^\circ$, so the gain margin is infinite. Adding the delay pulls the crossing in to $72.2\ \mathrm{rad/s}$ and $22.1\ \mathrm{dB}$. The delay margin captures this directly and is the better number to track.
:::

::: check
A loop is reported with $\mathrm{GM} = 15\ \mathrm{dB}$ and $\mathrm{PM} = 70^\circ$. What is the largest $\lVert S\rVert_\infty$ consistent with those numbers, and what is the smallest?
:::

::: answer
There is no largest. The curve can swing toward $-1$ at a frequency between the two crossings without changing either margin — exactly what the flexible-mode example did. So $M_s$ can be as large as you like while both classical margins stay excellent. That one-way street is the whole reason $M_s$ is reported separately.

The smallest value is pinned down, because the two margins name two points the curve passes through. A gain margin of $15\ \mathrm{dB}$ is a factor of $10^{15/20} = 5.62$, so the curve passes through $-1/5.62 = -0.178$, at distance $1 - 0.178 = 0.822$ from $-1$. A phase margin of $70^\circ$ puts a point on the unit circle at chord distance $2\sin35^\circ = 1.147$. The closest approach over all frequencies can be no bigger than the smaller of these, so $\mathrm{MM} \le 0.822$ and $M_s \ge 1/0.822 = 1.22$. A loop with exactly $M_s = 1.22$ would be one whose closest approach to $-1$ happens right at the phase crossover.
:::

::: check
The flexible loop in the example halved the bending mode's damping while showing a 54 dB gain margin. Explain, using the Nyquist picture, how those two facts live together.
:::

::: answer
Gain margin is measured only where the curve crosses the negative real axis. For this loop that happens at $497\ \mathrm{rad/s}$, far above anything of interest, where the size is only $0.002$. The modal swing near $18\ \mathrm{rad/s}$ never crosses that axis. It reaches $-0.699 - 0.264j$, at an angle of $-159^\circ$, and turns back. So the gain-margin test cannot see it. The phase-margin test cannot see it either, because the curve is inside the unit circle there.

Any measure of distance sees it plainly. How close the curve passes to $-1$ near a mode's frequency decides that mode's closed-loop damping: a small $|1+L|$ means a large $|S|$, which means the loop is amplifying rather than calming motion at that frequency. Distance to $-1$ is the number that connects the Nyquist picture to the shaking you will actually see.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\omega_{gc}$, $\omega_{pc}$ | gain crossover ($\lvert L\rvert = 1$) and phase crossover ($\angle L = -180^\circ$) |
| $\mathrm{GM} = 1/\lvert L(j\omega_{pc})\rvert$ | gain margin, in dB; target $\ge 6\ \mathrm{dB}$; the binding crossing is the one with largest $\lvert L\rvert$ |
| $\mathrm{PM} = 180^\circ + \angle L(j\omega_{gc})$ | phase margin; target $\ge 30\text{--}45^\circ$, often $60^\circ$ |
| $\mathrm{DM} = \mathrm{PM_{rad}}/\omega_{gc}$ | delay margin, in seconds |
| $\mathrm{MM} = \min_\omega\lvert 1 + L\rvert = 1/\lVert S\rVert_\infty$ | modulus (vector) margin; target $\ge 0.5$, that is $\lVert S\rVert_\infty \le 2$ |
| $\mathrm{GM} \ge M_s/(M_s-1)$ | gain margin guaranteed by the sensitivity peak |
| $\mathrm{PM} \ge 2\arcsin\bigl(1/(2M_s)\bigr)$ | phase margin guaranteed by it; $M_s = 2$ gives 6.0 dB and 29.0° |
| Rate loop (8 ms delay) | $\omega_{gc} = 10.0$, PM $62.8^\circ$, GM 22.1 dB, DM 110 ms, $\lVert S\rVert_\infty = 1.247$ |
| Flexible loop | PM $67.4^\circ$, GM 54 dB, but MM $= 0.400$; modal damping halved to $\zeta = 0.0023$ |
| The 6 dB rule for modes | gain-stabilize a mode 6 dB below one, and the distance to $-1$ clears $M_s \le 2$ |

Every margin here tests one kind of error on a single-input, single-output linear model. The next lesson asks what happens when errors arrive together, when the loop is one of several sharing a vehicle, and when the vehicle stops behaving linearly.

::: context four-on-one-curve All four margins on one picture
Here is the real Nyquist curve of this lesson's rate loop, for frequencies from about 4.5 to 200 rad/s, drawn to scale. The red dot is the cliff edge, $-1$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <line x1="10" y1="60" x2="350" y2="60" stroke="#6c7a93" stroke-width="1"/>
  <line x1="240" y1="5" x2="240" y2="218" stroke="#6c7a93" stroke-width="1"/>
  <path d="M140,60 A100,100 0 0,0 340,60" fill="none" stroke="#1f2a44" stroke-width="1.2" stroke-dasharray="5 3"/>
  <path d="M59.8,60 A80.2,80.2 0 0,0 220.2,60" fill="none" stroke="#f2b880" stroke-width="2"/>
  <path d="M157.9,214.2 L165.4,203.1 L171.9,192.7 L177.5,183.0 L182.5,173.9 L186.8,165.4 L190.5,157.5 L193.8,150.0 L196.7,143.1 L199.2,136.6 L201.5,130.4 L203.5,124.7 L205.3,119.3 L206.9,114.2 L208.4,109.5 L209.8,105.0 L211.1,100.8 L212.3,96.8 L213.5,93.1 L214.6,89.6 L215.8,86.3 L216.9,83.2 L218.0,80.3 L219.1,77.7 L220.2,75.2 L221.4,72.9 L222.5,70.8 L223.7,68.9 L224.8,67.2 L226.0,65.7 L227.1,64.3 L228.2,63.1 L229.3,62.1 L230.4,61.2 L231.4,60.5 L232.3,59.9 L233.2,59.4 L234.1,59.0 L234.9,58.7 L235.6,58.5 L236.3,58.4 L236.9,58.3 L237.4,58.2 L237.9,58.2 L238.3,58.3 L238.7,58.4 L239.0,58.5 L239.3,58.6 L239.5,58.7 L239.8,58.8" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="240" y1="60" x2="194.3" y2="148.9" stroke="#1d6fd1" stroke-width="1" stroke-dasharray="3 3"/>
  <path d="M210,60 A30,30 0 0,0 226.3,86.7" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="250" y="94" font-size="11" fill="#1f2a44">PM 62.8°</text>
  <circle cx="194.3" cy="148.9" r="4" fill="#1d6fd1"/>
  <text x="112" y="152" font-size="11" fill="#1d6fd1">|L| = 1 here</text>
  <line x1="140" y1="60" x2="215.7" y2="86.4" stroke="#b4232c" stroke-width="2"/>
  <text x="120" y="104" font-size="11" fill="#b4232c">closest: 0.802</text>
  <circle cx="232.1" cy="60" r="3.5" fill="#1f2a44"/>
  <text x="246" y="50" font-size="11" fill="#1f2a44">−1/GM = −0.079</text>
  <circle cx="140" cy="60" r="5" fill="#b4232c"/>
  <text x="128" y="50" font-size="12" fill="#b4232c">−1</text>
  <text x="262" y="150" font-size="11" fill="#1f2a44">unit circle</text>
  <text x="20" y="180" font-size="11" fill="#1f2a44">orange: radius 0.802</text>
</svg>
```

The dashed circle is the unit circle; the curve meets it where $|L| = 1$, and the angle from there to the negative axis is the phase margin. The curve crosses the negative axis very near the origin, at $-0.079$, so the gain can grow 12.7 times. The orange circle around $-1$ has radius $0.802$: the curve touches it without crossing, and that radius is the modulus margin.
:::

::: context why-radians Why the delay margin wants radians
A delay of $T$ seconds at frequency $\omega$ shifts a sine wave by $\omega T$. Because $\omega$ is in radians per second, $\omega T$ comes out in radians — the natural unit of angle, where one full turn is $2\pi$. So to compare a delay with a phase margin you must put both in the same unit.

Forget to convert and you divide $62.8$ by $10$ and get a "delay margin" of $6.28\ \mathrm{s}$ — about 57 times too big, since one radian is $57.3^\circ$. A delay margin that looks absurdly generous is the first sign of this slip.
:::

::: context latency-budget Where the milliseconds come from
On a real flight computer, the time from "the gyro sees motion" to "the actuator starts moving" is a chain of small waits. The sensor averages its readings before sending them. The data crosses a bus. The software waits for its turn in the schedule. The control law runs. The command waits for the next output slot, and the actuator's electronics add their own lag.

Each link might be only a few milliseconds, but they add up. That is why the delay margin is a budget: the controls team says how many milliseconds the loop can afford, and the software and avionics teams decide how to spend them.
:::

::: context infinity-norm Reading ‖S‖∞ aloud
The double bars with a small infinity, $\lVert S\rVert_\infty$, are read "the infinity norm of S", or often "the H-infinity norm". For a single-loop system it means one plain thing: sweep every frequency, compute $|S(j\omega)|$, and keep the biggest value.

The name comes from mathematics, where a family of "norms" measures the size of a function in different ways, and the one labeled infinity picks out the worst case. It returns in the robust-control part of the course, where whole design methods — "$H_\infty$ control" — are built around keeping this peak small.
:::

::: context chord-picture The chord that sets the phase margin
Both $-1$ and the gain-crossover point sit on the unit circle, $\mathrm{PM}$ degrees apart. The straight line joining them is a chord. Cut the triangle from the origin in half and each half has a hypotenuse of one and an angle of $\mathrm{PM}/2$, so each half-chord is $\sin(\mathrm{PM}/2)$ and the whole chord is $2\sin(\mathrm{PM}/2)$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="100" x2="340" y2="100" stroke="#6c7a93" stroke-width="1"/>
  <line x1="180" y1="10" x2="180" y2="195" stroke="#6c7a93" stroke-width="1"/>
  <circle cx="180" cy="100" r="80" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="100" x2="100" y2="100" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <line x1="180" y1="100" x2="123.4" y2="156.6" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <path d="M150,100 A30,30 0 0,0 158.8,121.2" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <text x="128" y="122" font-size="12" fill="#1d6fd1">PM</text>
  <line x1="100" y1="100" x2="123.4" y2="156.6" stroke="#b4232c" stroke-width="3"/>
  <circle cx="100" cy="100" r="5" fill="#b4232c"/>
  <circle cx="123.4" cy="156.6" r="5" fill="#1d6fd1"/>
  <text x="60" y="92" font-size="12" fill="#b4232c">−1</text>
  <text x="130" y="176" font-size="12" fill="#1d6fd1">L at ω_gc</text>
  <text x="46" y="140" font-size="12" fill="#b4232c">chord</text>
  <text x="228" y="40" font-size="12" fill="#1f2a44">unit circle</text>
  <text x="222" y="150" font-size="12" fill="#1f2a44">PM = 45° here:</text>
  <text x="222" y="166" font-size="12" fill="#1f2a44">chord = 2 sin 22.5°</text>
  <text x="222" y="182" font-size="12" fill="#1f2a44">= 0.765</text>
</svg>
```
:::

::: context mode-shape Why the sign of the mode depends on where the gyro sits
When a long rocket bends in its first mode, it curves like a drawn bow. The two ends swing one way and the middle the other, with two **nodes** — points that do not move sideways — about 22% of the length in from each end.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="90" x2="320" y2="90" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <path d="M40.0,50.0 L54.0,59.3 L68.0,68.5 L82.0,77.5 L96.0,86.1 L110.0,94.0 L124.0,100.9 L138.0,106.6 L152.0,110.8 L166.0,113.4 L180.0,114.3 L194.0,113.4 L208.0,110.8 L222.0,106.6 L236.0,100.9 L250.0,94.0 L264.0,86.1 L278.0,77.5 L292.0,68.5 L306.0,59.3 L320.0,50.0" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <circle cx="102.8" cy="90" r="4" fill="#1f2a44"/>
  <circle cx="257.2" cy="90" r="4" fill="#1f2a44"/>
  <text x="102.8" y="80" font-size="11" text-anchor="middle" fill="#1f2a44">node</text>
  <text x="257.2" y="80" font-size="11" text-anchor="middle" fill="#1f2a44">node</text>
  <polygon points="40,50 26,44 26,56" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <text x="40" y="136" font-size="11" text-anchor="middle" fill="#1f2a44">engine (tail)</text>
  <text x="320" y="136" font-size="11" text-anchor="middle" fill="#1f2a44">nose</text>
  <text x="180" y="136" font-size="11" text-anchor="middle" fill="#1f2a44">tilt reverses at the middle</text>
</svg>
```

A rate gyro feels the *tilt* of the structure where it is bolted, which is the slope of this curve. The slope in the aft half has one sign and in the forward half the other. So whether the modal term adds to or fights the rigid-body rate depends on where the gyro sits relative to the engine that excites the mode. Designers pick the gyro location with this in mind.
:::

::: context gain-stabilised Gain-stabilized, and the other way
A mode is **gain-stabilized** when the loop's size across the mode is kept below one, so however its phase swings the curve cannot circle $-1$. The other option, **phase-stabilization**, keeps the size up but arranges the phase so the feedback damps the mode instead of pumping it.

Lesson 10 builds both, with a notch filter to push the gain down, and shows why the "6 dB below one" rule is what engineers write into specifications.
:::

::: context four-over-sigma Where "4 divided by the real part" comes from
A lightly damped wobble dies away like $e^{-\sigma t}$, where $\sigma$ ("sigma") is the size of the pole's real part. After a time $4/\sigma$ the envelope is down to $e^{-4} = 0.018$, about 2% of where it started. That is the usual meaning of "settled".

With $\sigma = 0.0415\ \mathrm{s^{-1}}$ that is $4/0.0415 = 96\ \mathrm{s}$. Before the loop closed, $\sigma$ was $0.09$ and the same wobble settled in $44\ \mathrm{s}$. Halving the real part doubles the ringing time.
:::
