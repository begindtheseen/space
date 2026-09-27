---
id: l04-three-ways-to-tune-a-pid
title: Three ways to tune a PID, and what each one optimises
minutes: 22
covers:
  - 'PID tuning: Ziegler-Nichols, loop shaping, pole placement'
---

Think about getting a shower to the right temperature. You turn the knob, wait, feel the water, turn it again. If you turn it hard and the water takes a few seconds to reach you, you swing from freezing to scalding and back. That wait between turning the knob and feeling the result is what makes it hard.

Choosing the three numbers in a PID — $k_p$, $k_i$ and $k_d$ — is called **tuning**. On a test stand, tuning can look like turning knobs until the trace looks right. On a flight vehicle it cannot work that way. The vehicle you would tune against does not exist yet. The flight conditions you care about happen once. And getting it wrong costs much more than a slow response. So tuning has to be a calculation you can defend in a design review, against a written specification.

This lesson runs three tuning methods on the same plant and compares what comes out:

- **Ziegler–Nichols** — a recipe that gets gains from two measurements on the real hardware and needs no model at all.
- **Loop shaping** — start from a frequency-domain specification (how fast, how much margin) and build a controller that meets it.
- **Pole placement** — start from a time-domain specification, write down the closed-loop polynomial you want, and solve for the gains.

All three are used in practice, on different problems. The interesting part is where they disagree.

The plant is the rate channel from the earlier lessons, with one honest addition: a **[[transport delay|delay-sources]]** — a pure wait — of $T = 8\ \mathrm{ms}$ for sensor latency and computation. That is the shower's wait.

$$
G(s) = \frac{e^{-sT}}{J\,s\,(\tau s + 1)},
\qquad J = 1200\ \mathrm{kg\,m^2},\quad \tau = 0.02\ \mathrm{s},\quad T = 0.008\ \mathrm{s}.
$$

Here $J$ is the vehicle's moment of inertia, $\tau$ ("tau") is the actuator's time constant, and $e^{-sT}$ is the delay. The delay changes no magnitude at all. It only costs phase: $-\omega T$ radians at frequency $\omega$. You met that fact in the signals and systems module, and it decides more designs than any other. Without the delay this plant would have infinite gain margin, and the comparisons in this lesson would lose their teeth.

In every simulation below, the delay sits in the sensor path and the derivative acts on the measurement, as flight PIDs usually do.

## Write the specification first

A tuning method answers a question, so first you have to ask one. A rate loop's specification usually has four parts.

**Speed.** How fast the loop must respond, given as a **rise time** (how long the output takes to go from 10% to 90% of a step) or a **bandwidth** (the frequency up to which the loop follows its command well). It usually comes from the outer loop or the guidance update rate. The rule of thumb $t_r\,\omega_{bw} \approx 1.8$ converts one to the other. So a 0.2 s rise time asks for about $9\ \mathrm{rad/s}$ of closed-loop bandwidth, which means a crossover near $10\ \mathrm{rad/s}$.

**Stability margins.** Aerospace practice asks for at least 6 dB of gain margin and 30–45° of phase margin, often 60° where the plant is poorly known. Lesson 7 defines these precisely. For now, read them as "how wrong the plant model may be before the loop stops working".

**A ceiling on bandwidth.** Crossover must stay well below the lowest structural **[[bending mode|bending-ceiling]]**, below the frequency where the actuator model stops being true, and below a sensible fraction of the sample rate. On most vehicles this ceiling, not the speed requirement, is what sets the answer.

**Actuator effort.** How hard the actuator works: the noise-driven command from the first lesson, plus the peak command during the largest expected transient.

## Ziegler–Nichols

In 1942, **[[two engineers|zn-history]]** published a recipe that needs no model. It is the shower approach made systematic.

1. Turn off the integral and derivative terms.
2. Raise $k_p$ until the closed loop **[[oscillates at constant amplitude|sustained-oscillation]]** — not growing, not dying away.
3. Record that gain as $K_u$ (the **ultimate gain**, read "K sub u") and the time for one full swing as $T_u$ (the **ultimate period**).

In the language of the next lessons, you have found the frequency where the loop's phase is exactly $-180^\circ$, and the gain that makes the loop's magnitude exactly 1 there. The loop is sitting right on the edge of instability. From those two numbers the recipe reads:

| Controller | $k_p$ | $T_i$ | $T_d$ |
| --- | --- | --- | --- |
| P | $0.5K_u$ | — | — |
| PI | $0.45K_u$ | $T_u/1.2$ | — |
| PID (classic) | $0.6K_u$ | $0.5T_u$ | $0.125T_u$ |

Here $T_i$ is the integral time and $T_d$ the derivative time from lesson 2, so $k_i = k_p/T_i$ and $k_d = k_pT_d$.

::: key
Ziegler–Nichols ultimate-gain tuning: raise $k_p$ until sustained oscillation at gain $K_u$ and period $T_u$. Classic PID: $k_p = 0.6K_u$, $T_i = 0.5T_u$, $T_d = 0.125T_u$. Aggressive (roughly quarter-decay) and rarely flown as-is, but a useful starting point.
:::

Notice that the classic row has $T_i = 4T_d$ exactly. That is the boundary from lesson 2: the Ziegler–Nichols PID in series form has a double zero, at $s = -1/(2T_d) = -4/T_u$.

::: example Ultimate gain and period for the delayed rate plant
With proportional control only, three things add phase lag. The integrator gives $-90^\circ$. The actuator gives $-\arctan(\tau\omega)$. The delay gives $-\omega T$. Sustained oscillation needs the total to reach $-180^\circ$, so the other two must add up to $90^\circ$, which is $\pi/2$ radians:

$$
\arctan(0.02\,\omega) + 0.008\,\omega = \frac{\pi}{2}.
$$

There is no neat formula for this, so solve it numerically (bisection: try values, halve the interval each time). It gives $\omega_u = 74.16\ \mathrm{rad/s}$. One period is $T_u = 2\pi/\omega_u = 0.0847\ \mathrm{s}$ — a buzz at 11.8 Hz.

The ultimate gain is whatever makes $|L| = 1$ at that frequency. The plant's magnitude there is $1/\bigl(J\omega_u\sqrt{1 + (\tau\omega_u)^2}\bigr)$, and the delay has magnitude 1, so

$$
K_u = J\,\omega_u\sqrt{1 + (\tau\omega_u)^2} = 1200 \times 74.16 \times \sqrt{1 + 1.483^2} = 1.59\times10^{5}.
$$

Now apply the classic row: $k_p = 0.6K_u = 95\,504$, $T_i = 0.5 \times 0.0847 = 0.0424\ \mathrm{s}$ and $T_d = 0.125 \times 0.0847 = 0.0106\ \mathrm{s}$. In parallel gains, $k_i = k_p/T_i = 2.25\times10^6$ and $k_d = k_pT_d = 1012$.

Put the derivative filter pole at $10/T_d = 944\ \mathrm{rad/s}$ and compute the finished loop. Crossover lands at $55.7\ \mathrm{rad/s}$. The phase margin is $25.4^\circ$, the gain margin $9.8\ \mathrm{dB}$, and the step response overshoots by 74%.

That is a working controller, and nobody would fly it. Crossover is more than five times the 10 rad/s we needed, which puts the loop on top of any structural mode above about 9 Hz. The phase margin is below every aerospace standard. The delay margin is 8 ms, so one extra 8 ms of latency would destroy the loop. Sanity check: a controller tuned from the edge of instability should come out lively, and it does. The recipe aims at a **[[quarter-amplitude decay|quarter-decay]]**, a disturbance-rejection target from chemical plants, not at a stability margin.
:::

There is a second version, the open-loop or **reaction curve** method. You apply a step to the plant (no feedback) and fit two numbers to the response: an apparent dead time $L$ and a slope $R$ (how fast the output ramps per unit of input). Then $k_p = 1.2/(RL)$, $T_i = 2L$ and $T_d = 0.5L$.

For this plant, $R = 1/J = 8.33\times10^{-4}\ \mathrm{rad\,s^{-2}/(N\,m)}$. The apparent dead time is the true delay plus the actuator lag, $L \approx 0.008 + 0.02 = 0.028\ \mathrm{s}$. That gives $k_p = 51\,429$, $T_i = 0.056\ \mathrm{s}$ and $T_d = 0.014\ \mathrm{s}$. The result: crossover $35.7\ \mathrm{rad/s}$, phase margin $38.0^\circ$, 55% overshoot. Less hot, same character.

::: warning Ziegler–Nichols was built for a different kind of plant
Both rules were developed for **self-regulating** process plants — a tank or a furnace, something that settles to a new steady value after a step. A vehicle's rate channel is an integrator: give it a torque step and the rate keeps ramping and never settles. The assumptions behind the rules do not hold. Use them for a first number and a feel for $T_u$, then expect to halve the gain. And think hard before finding $K_u$ on real hardware. Driving a flight vehicle into sustained oscillation means, by design, driving it to the edge of instability.
:::

## Loop shaping

Loop shaping works straight from the specification. Here is the idea in one picture. The loop has a **[[phase budget|phase-budget]]** of $180^\circ$ at crossover. The plant spends some of it. You decide how much to keep as margin. Whatever is left is what the controller may spend.

The steps:

1. Choose the crossover frequency $\omega_c$ from the speed requirement and the ceilings.
2. Look up the plant's magnitude and phase at $\omega_c$.
3. Ask what the controller must do at that one frequency to put the loop's magnitude at 1 and leave the phase margin you want:

$$
|C(j\omega_c)| = \frac{1}{|G(j\omega_c)|},
\qquad
\angle C(j\omega_c) = -180^\circ + \mathrm{PM} - \angle G(j\omega_c).
$$

4. Pick a controller shape that delivers both, and place its corners so they do not spoil the rest of the curve. The integral corner goes well below $\omega_c$, so its phase lag has mostly faded by crossover. The derivative corner goes near or above $\omega_c$, where its lead is wanted. The derivative filter pole goes well above.

::: example Loop shaping the rate channel to 10 rad/s and 60°
Take $\omega_c = 10\ \mathrm{rad/s}$. The plant's phase there has three pieces — integrator, actuator, delay (the delay converted from radians to degrees):

$$
\angle G(j10) = -90^\circ - \arctan(0.2) - (10)(0.008)\cdot\frac{180^\circ}{\pi} = -90^\circ - 11.31^\circ - 4.58^\circ = -105.89^\circ.
$$

For $60^\circ$ of phase margin, the controller may add at most $180^\circ - 60^\circ - 105.89^\circ = 14.11^\circ$ of lag.

A PI controller adds lag of $\arctan\bigl(1/(\omega_cT_i)\bigr)$. With $T_i = 0.5\ \mathrm{s}$ that is $\arctan(0.2) = 11.31^\circ$. That fits inside the budget with $2.8^\circ$ to spare, so no derivative term is needed.

The magnitude condition fixes the gain. The plant's magnitude at 10 rad/s and the PI's magnitude are

$$
|G(j10)| = \frac{1}{1200 \times 10 \times \sqrt{1 + 0.2^2}} = 8.171\times10^{-5},
\qquad
|C(j10)| = k_p\sqrt{1 + 0.2^2} = 1.0198\,k_p .
$$

Setting their product to 1 gives $k_p = 1/(1.0198 \times 8.171\times10^{-5}) = 12\,000\ \mathrm{N\,m\,s/rad}$. Then $k_i = k_p/T_i = 24\,000\ \mathrm{N\,m/rad}$.

Check the finished loop. Crossover is $10.00\ \mathrm{rad/s}$, as designed. The phase margin is $62.8^\circ$ — a little more than 60°, because we left $2.8^\circ$ unspent. The gain margin is $22.1\ \mathrm{dB}$ at $72.2\ \mathrm{rad/s}$, the delay margin $110\ \mathrm{ms}$. The step response overshoots 14.8% and rises in 0.117 s.

Notice what the delay did, and what it did not do. It took $4.58^\circ$ of the phase budget at crossover — about a third of the $14.11^\circ$ the controller was left to spend. It created a finite gain margin where the plant without delay had none. And it changed no magnitude anywhere.
:::

Loop shaping is the method the rest of this module develops. Its in-between numbers — crossover, phase at crossover, margins — are exactly the things a specification talks about.

## Pole placement

Pole placement asks a different question: if you know where you want the closed-loop poles, which gains put them there? You write the closed-loop **[[characteristic polynomial|char-poly]]** with the gains as unknowns, write the polynomial you want, and make the two match coefficient by coefficient.

Leave the delay out of the design model for now, and use a PI controller. The loop is $L = (k_ps + k_i)/\bigl(J\tau s^3 + Js^2\bigr)$. The closed-loop poles are the roots of $1 + L = 0$. Multiply through by the denominator:

$$
J\tau s^3 + J s^2 + k_p s + k_i = 0 .
$$

Divide by $J\tau$ so the leading coefficient is 1:

$$
s^3 + \frac{1}{\tau}s^2 + \frac{k_p}{J\tau}s + \frac{k_i}{J\tau} = 0 .
$$

Three coefficients, two free gains. And the $s^2$ coefficient is $1/\tau = 50$ no matter what you choose. This is the general situation, so here it is plainly:

::: note The rule about free parameters
A controller with $m$ free parameters can set $m$ coefficients of the closed-loop polynomial — not $m$ poles of your choosing. Here two gains set two coefficients, and the third coefficient is fixed by the plant. To place all three poles freely you would need a third parameter. That is what the derivative term buys.
:::

So you must choose a target polynomial of the right family: a dominant second-order pair plus one real pole at $-p$. The coefficient of $s^2$ is minus the sum of the poles, so the constraint is $p + 2\zeta\omega_n = 50$. Here $\zeta$ ("zeta") is the damping ratio and $\omega_n$ the natural frequency of the dominant pair.

::: example Placing the rate loop's poles at $\zeta = 0.7$, $\omega_n = 8$
Take $\zeta = 0.7$ and $\omega_n = 8\ \mathrm{rad/s}$. Then $2\zeta\omega_n = 11.2$, so the third pole must sit at $p = 50 - 11.2 = 38.8$. Multiply out the target:

$$
(s + 38.8)(s^2 + 11.2s + 64) = s^3 + 50s^2 + 498.56\,s + 2483.2 .
$$

The $s^2$ coefficient came out as 50, as it had to. Now match the other two. $J\tau = 1200 \times 0.02 = 24$, so

$$
k_p = 24 \times 498.56 = 11\,965, \qquad k_i = 24 \times 2483.2 = 59\,597 .
$$

The roots of the closed-loop polynomial are exactly $-38.8$ and $-5.6 \pm 5.713j$, as designed.

Now put the delay back and simulate. The step response overshoots **30.4%**, not the 4.6% that $\zeta = 0.7$ promises. The phase margin is $48.1^\circ$, not the $65^\circ$ or so a $\zeta = 0.7$ pair suggests. Two things went wrong, and both are worth learning.

First, the delay was not in the design model, and it costs phase.

Second, and bigger: pole placement places *poles*. The PI controller also puts a **[[closed-loop zero|pi-zero]]** at $-k_i/k_p = -4.98$. That sits right beside the dominant pair's real part, $-5.6$, and a zero that close adds a lot of overshoot whatever the damping ratio says.

The fix is the setpoint weighting from lesson 3, which moves the zero without touching the loop. With $b = 0.5$ the zero moves to $-9.96$. The overshoot falls to 8.8%, and the settling time stays about the same, 0.64 s.
:::

## The three side by side

Here are all four designs on the same delayed plant, each given the same step. The last two columns are the overshoot and the **2% settling time** (how long until the output stays within 2% of its final value).

| Design | $k_p$ | $k_i$ | $k_d$ | $\omega_{gc}$ | PM | GM | overshoot | 2% settling |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ZN ultimate PID | 95 504 | $2.25\times10^6$ | 1012 | 55.7 | 25.4° | 9.8 dB | 74.4% | 0.209 s |
| ZN reaction PID | 51 429 | 918 367 | 720 | 35.7 | 38.0° | 13.7 dB | 55.1% | 0.336 s |
| Loop-shaped PI | 12 000 | 24 000 | 0 | 10.0 | 62.8° | 22.1 dB | 14.8% | 1.179 s |
| Pole-placed PI | 11 965 | 59 597 | 0 | 10.7 | 48.1° | 21.5 dB | 30.4% | 0.593 s |

Read the table as a statement about what each method optimises, not about which one is best.

Ziegler–Nichols trades margin for speed. On this plant it settles three and a half to six times faster than the loop-shaped design. That is a real advantage if you have the actuator, the structural clearance and the sample rate to support a 36–56 rad/s crossover. It is a liability if you do not.

Loop shaping meets a margin specification exactly, and lets the settling time fall where it falls.

Pole placement hits a time-domain target in the model it was given, and tells you nothing about margins until you go and compute them.

::: note Every method is only a starting point
Real tuning ends with a sweep over the **[[dispersed plant|dispersions]]**: inertia, centre of gravity, actuator gain, delay and modal frequency, each pushed to its extremes and in combinations. The gains that survive that sweep are usually more conservative than any single-point method gives. The sweep is also where you find out that the margins themselves can mislead — the subject of lesson 8.
:::

## Check yourself

::: check
A loop oscillates at constant amplitude with a period of 1.2 s when $k_p$ reaches 8.0. Give the Ziegler–Nichols classic PID settings in both standard and parallel form.
:::

::: answer
The measurements give $K_u = 8.0$ and $T_u = 1.2\ \mathrm{s}$.

Standard form: $k_p = 0.6 \times 8.0 = 4.8$, $T_i = 0.5 \times 1.2 = 0.6\ \mathrm{s}$, $T_d = 0.125 \times 1.2 = 0.15\ \mathrm{s}$.

Parallel form: $k_i = k_p/T_i = 4.8/0.6 = 8.0$ and $k_d = k_pT_d = 4.8 \times 0.15 = 0.72$.

Two checks. $T_i = 0.6 = 4 \times 0.15 = 4T_d$, as the rule always gives. And the loop's phase crossover frequency was $2\pi/1.2 = 5.24\ \mathrm{rad/s}$, where the plant's own magnitude must have been $1/8.0$ for a gain of 8.0 to bring $|L|$ to 1.
:::

::: check
For the delayed rate plant, how much phase does the 8 ms delay cost at a crossover of 10 rad/s, and at the Ziegler–Nichols crossover of 55.7 rad/s? What does that say about where delay hurts?
:::

::: answer
The phase lost is $\omega T$ radians.

At $10\ \mathrm{rad/s}$: $10 \times 0.008 = 0.08\ \mathrm{rad} = 4.58^\circ$.

At $55.7\ \mathrm{rad/s}$: $55.7 \times 0.008 = 0.446\ \mathrm{rad} = 25.5^\circ$.

The cost grows in step with crossover, while the phase a controller can generate does not. So delay puts a hard ceiling on achievable bandwidth. It also makes a fast design far more fragile to a latency change than a slow one: 2 ms more delay costs the 10 rad/s loop $1.1^\circ$ and the 55.7 rad/s loop $6.4^\circ$.
:::

::: check
You want a crossover of 4 rad/s with 60° phase margin on the plant $G(s) = 2/\bigl(s(s+3)\bigr)$. What magnitude and phase must the controller supply at 4 rad/s?
:::

::: answer
Put $s = j4$: $G(j4) = 2/\bigl(j4(j4+3)\bigr)$.

Magnitude: $|j4| = 4$ and $|j4 + 3| = \sqrt{16+9} = 5$, so $|G| = 2/(4 \times 5) = 0.1$.

Phase: $-90^\circ$ from the $s$, and $-\arctan(4/3) = -53.13^\circ$ from the $(s+3)$, so $\angle G = -143.13^\circ$.

The controller therefore needs $|C(j4)| = 1/0.1 = 10$ and $\angle C(j4) = -180^\circ + 60^\circ + 143.13^\circ = +23.13^\circ$. That is 23° of phase *lead*, and a PI can only add lag. You need a lead compensator or a PD term, and the lead-lag lesson builds exactly that.
:::

::: check
A pole-placement design puts the closed-loop poles exactly where you asked, yet the step response overshoots far more than the damping ratio predicts. Give two distinct causes and how you would tell them apart.
:::

::: answer
First cause: a closed-loop **zero** near the dominant poles. Pole placement sets only the denominator. The numerator depends on where the reference enters, and a PI or PID puts zeros at its own corners. A zero at $-z$, with $z$ close to the dominant poles' real part, adds overshoot that no pole location predicts.

Second cause: **unmodelled dynamics** — a delay, an actuator pole or a flexible mode left out of the design model. These move the real poles away from the designed ones.

To tell them apart, compute the closed-loop poles of the *full* model. If they are still where you placed them, the zero is the culprit, and setpoint weighting or a prefilter fixes it without touching the loop. If they have moved, the model was wrong and the gains must be redesigned.
:::

::: check
Why can a PI controller not place all three closed-loop poles of the plant $1/\bigl(Js(\tau s+1)\bigr)$, and what changes if you use a PID with an ideal derivative, or with a filtered one?
:::

::: answer
With PI, the closed-loop polynomial is $J\tau s^3 + Js^2 + k_ps + k_i$. Divided by $J\tau$, its $s^2$ coefficient is $1/\tau$, with no gain in it, so the plant fixes it. Only the $s^1$ and $s^0$ coefficients are free. Two gains cannot set three coefficients, so you can only reach pole sets whose sum is $-1/\tau$.

With an ideal PID the controller is $(k_ds^2 + k_ps + k_i)/s$, and the polynomial becomes $J\tau s^3 + (J + k_d)s^2 + k_ps + k_i$. It is still a cubic, but now every coefficient below the leading one contains a gain. Three gains set three coefficients, so all three poles can go anywhere you like.

With the filtered derivative $k_dNs/(s+N)$, the filter adds one more state, so the polynomial becomes a quartic:
$J\tau s^4 + J(1 + \tau N)s^3 + (JN + k_p + k_dN)s^2 + (k_pN + k_i)s + k_iN$. It has four free parameters, $k_p$, $k_i$, $k_d$ and $N$, for four coefficients, so full freedom is kept — at the cost of a fourth pole you now have to place as well.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| $t_r\,\omega_{bw} \approx 1.8$ | rise-time to bandwidth conversion; 0.2 s asks for about 9 rad/s |
| ZN ultimate gain | raise $k_p$ to sustained oscillation: record $K_u$, $T_u$ |
| ZN classic PID | $k_p = 0.6K_u$, $T_i = 0.5T_u$, $T_d = 0.125T_u$ (so $T_i = 4T_d$) |
| ZN reaction curve | $k_p = 1.2/(RL)$, $T_i = 2L$, $T_d = 0.5L$ |
| Example plant | $K_u = 1.59\times10^5$, $T_u = 0.0847\ \mathrm{s}$, $\omega_u = 74.2\ \mathrm{rad/s}$ |
| Loop shaping | $\lvert C(j\omega_c)\rvert = 1/\lvert G(j\omega_c)\rvert$, $\angle C(j\omega_c) = -180^\circ + \mathrm{PM} - \angle G(j\omega_c)$ |
| Loop-shaped result | $k_p = 12\,000$, $k_i = 24\,000$: $\omega_{gc} = 10\ \mathrm{rad/s}$, PM $62.8^\circ$, GM 22.1 dB |
| Pole placement | match the closed-loop characteristic polynomial coefficient by coefficient |
| Its limit | $m$ free gains set $m$ coefficients, not $m$ pole locations; zeros are not placed |
| Delay phase cost | $\omega T$ radians; 8 ms costs $4.58^\circ$ at 10 rad/s, $25.5^\circ$ at 55.7 rad/s |

Loop shaping and pole placement both need a way to see where the closed-loop poles go as a gain changes. The next lesson draws that picture: the root locus.

::: context delay-sources Where 8 milliseconds comes from
No single part of a flight computer takes 8 ms, but the pieces add up. The gyro filters its own output before sending it. The data crosses a bus. The software waits for its next cycle, runs the control law, and sends the command. And a digital controller holds each command constant for a whole sample period, which behaves roughly like an extra delay of half a sample: about 5 ms at a 100 Hz loop rate.

Engineers add these up into a **latency budget** and treat the total as one delay $e^{-sT}$ — which is why the flight software team is the first to hear about delay margin.
:::

::: context bending-ceiling Why a rocket bends
A launch vehicle is a long, thin tube, a bit like a flagpole. Tap it and it rings at its lowest bending frequency, often only a few hertz for a big booster. The gyro sits somewhere along that tube, so it measures the bending wobble as well as the real rotation. If the control loop is fast enough to respond at that frequency, it can pump energy into the bending and shake the vehicle apart. Lesson 10 shows how notch filters deal with this. For now it is the reason crossover has a ceiling.
:::

::: context zn-history Who Ziegler and Nichols were
John G. Ziegler and Nathaniel B. Nichols worked for the Taylor Instrument Companies, which made industrial controllers. Their 1942 paper, "Optimum Settings for Automatic Controllers", gave plant operators a way to set the knobs on a new controller with no mathematical model of the process at all. That is why the rules are tied to chemical plants and furnaces. Nichols later gave his name to the Nichols chart, another classical design plot.
:::

::: context sustained-oscillation The edge of stability
At the ultimate gain the loop neither settles nor blows up. It rings forever at the same size, like a swing pushed exactly enough each time to replace what friction takes away. The time from one peak to the next is the ultimate period $T_u$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="65" x2="345" y2="65" stroke="#6c7a93" stroke-width="1"/>
  <path d="M30,65 C46.6,24 63.3,24 80,65 C96.6,106 113.3,106 130,65 C146.6,24 163.3,24 180,65 C196.6,106 213.3,106 230,65 C246.6,24 263.3,24 280,65 C296.6,106 313.3,106 330,65" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="55" y1="30" x2="155" y2="30" stroke="#b4232c" stroke-width="1.5"/>
  <line x1="55" y1="24" x2="55" y2="36" stroke="#b4232c" stroke-width="1.5"/>
  <line x1="155" y1="24" x2="155" y2="36" stroke="#b4232c" stroke-width="1.5"/>
  <text x="105" y="20" font-size="12" text-anchor="middle" fill="#b4232c">one period T_u = 0.0847 s</text>
  <text x="30" y="122" font-size="11" fill="#1f2a44">k_p = K_u: same size every swing</text>
</svg>
```
:::

::: context quarter-decay What "quarter-amplitude decay" means
After a disturbance, each swing is a quarter the size of the one before: 1, then 1/4, then 1/16. That is a damping ratio of only about $\zeta = 0.22$. For a chemical plant, where the goal is to shake off a disturbance quickly, that is acceptable. For a flight vehicle it is far too lively.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <line x1="25" y1="95" x2="345" y2="95" stroke="#6c7a93" stroke-width="1"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="30.0,35.0 36.0,43.7 42.0,58.0 48.0,75.1 54.0,92.3 60.0,107.2 66.0,118.2 72.0,124.4 78.0,125.6 84.0,122.5 90.0,116.1 96.0,107.9 102.0,99.1 108.0,91.2 114.0,85.0 120.0,81.1 126.0,79.6 132.0,80.5 138.0,83.2 144.0,87.1 150.0,91.5 156.0,95.7 162.0,99.1 168.0,101.5 174.0,102.6 180.0,102.5 186.0,101.4 192.0,99.6 198.0,97.5 204.0,95.3 210.0,93.5 216.0,92.1 222.0,91.3 228.0,91.2 234.0,91.6 240.0,92.4 246.0,93.4 252.0,94.5 258.0,95.5 264.0,96.3 270.0,96.7 276.0,96.9 282.0,96.8 288.0,96.5 294.0,96.0 300.0,95.4 306.0,94.9 312.0,94.5 318.0,94.2 324.0,94.1 330.0,94.1"/>
  <text x="40" y="30" font-size="12" fill="#1f2a44">1</text>
  <text x="130" y="72" font-size="12" text-anchor="middle" fill="#1f2a44">1/4</text>
  <text x="230" y="84" font-size="12" text-anchor="middle" fill="#1f2a44">1/16</text>
  <text x="180" y="132" font-size="11" text-anchor="middle" fill="#1f2a44">each peak is a quarter of the one before (ζ ≈ 0.22)</text>
</svg>
```
:::

::: context phase-budget Spending the 180 degrees
At crossover, the loop's phase lag must stay short of $180^\circ$. Whatever is left over is the phase margin. Here is how the loop-shaped design spends it, drawn to scale: the plant takes $105.89^\circ$ (integrator, actuator and delay), the PI takes $11.31^\circ$, and $62.8^\circ$ is kept.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="30" y="40" width="150" height="30" fill="#6c7a93" stroke="#1f2a44" stroke-width="1"/>
  <rect x="180" y="40" width="18.85" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <rect x="198.85" y="40" width="7.63" height="30" fill="#b4232c" stroke="#1f2a44" stroke-width="1"/>
  <rect x="206.48" y="40" width="18.85" height="30" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <rect x="225.33" y="40" width="104.67" height="30" fill="#ffffff" stroke="#1d6fd1" stroke-width="2"/>
  <text x="105" y="60" font-size="12" text-anchor="middle" fill="#ffffff">integrator 90°</text>
  <text x="189" y="32" font-size="11" text-anchor="middle" fill="#1f2a44">actuator</text>
  <text x="202" y="88" font-size="11" text-anchor="middle" fill="#b4232c">delay</text>
  <text x="216" y="102" font-size="11" text-anchor="middle" fill="#1f2a44">PI</text>
  <text x="277" y="60" font-size="12" text-anchor="middle" fill="#1d6fd1">margin 62.8°</text>
  <text x="30" y="20" font-size="11" fill="#1f2a44">0°</text>
  <text x="330" y="20" font-size="11" text-anchor="end" fill="#1f2a44">180°</text>
</svg>
```
:::

::: context char-poly Why the roots are the poles
The closed-loop transfer function is $L/(1 + L)$. Write $L$ as a fraction $N/D$, and the closed loop becomes $N/(D + N)$. Its poles — the values of $s$ where it blows up — are where the bottom, $D + N$, is zero. That bottom is the **characteristic polynomial**. Every root is a pole, and each pole is a pattern of motion the loop can make: a real root is a smooth decay, a complex pair is a ringing.
:::

::: context pi-zero Why a nearby zero adds overshoot
A zero at $-z$ makes the response behave partly like its own derivative: roughly $y + \dot y/z$. When $z$ is small, the derivative part is large, and it pushes the early response up and past the target.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="10" y1="100" x2="352" y2="100" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="330" y1="20" x2="330" y2="185" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#b4232c" stroke-width="2.5">
    <line x1="34" y1="95" x2="44" y2="105"/><line x1="34" y1="105" x2="44" y2="95"/>
    <line x1="283" y1="52.2" x2="293" y2="62.2"/><line x1="283" y1="62.2" x2="293" y2="52.2"/>
    <line x1="283" y1="137.8" x2="293" y2="147.8"/><line x1="283" y1="147.8" x2="293" y2="137.8"/>
  </g>
  <circle cx="292.65" cy="100" r="5.5" fill="#ffffff" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="255.3" cy="100" r="5.5" fill="#ffffff" stroke="#6c7a93" stroke-width="2" stroke-dasharray="3,2"/>
  <text x="39" y="122" font-size="11" text-anchor="middle" fill="#1f2a44">−38.8</text>
  <text x="270" y="44" font-size="11" text-anchor="middle" fill="#1f2a44">−5.6 ± 5.71j</text>
  <text x="286" y="122" font-size="11" text-anchor="end" fill="#1d6fd1">zero −4.98</text>
  <text x="240" y="85" font-size="11" text-anchor="middle" fill="#6c7a93">b = 0.5: −9.96</text>
  <text x="336" y="30" font-size="11" fill="#1f2a44">jω</text>
  <text x="120" y="190" font-size="11" fill="#1f2a44">× pole   ○ zero   (drawn to scale)</text>
</svg>
```

Here the zero sits almost under the dominant pair. Setpoint weighting slides it out to $-9.96$, where its push is much weaker.
:::

::: context dispersions Dispersions and Monte Carlo
A **dispersion** is the spread in a value you do not know exactly: the inertia after a partial propellant load, the actuator gain from a hardware batch, the delay on a busy computer cycle. Flight control teams run thousands of simulations with every dispersed value drawn at random within its limits — a **Monte Carlo** analysis, named after the casino — and check that the loop meets its requirements in all of them.
:::
