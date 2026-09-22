---
id: l04-three-ways-to-tune-a-pid
title: Three ways to tune a PID, and what each one optimises
minutes: 22
covers:
  - 'PID tuning: Ziegler-Nichols, loop shaping, pole placement'
---

"Tuning" sounds like turning knobs until the trace looks right, and on a test stand that is sometimes what it is. On a vehicle it cannot be, because the vehicle you would tune against does not exist yet, the conditions you would tune for occur once, and the consequence of getting it wrong is not a longer settling time. Tuning has to be a calculation you can defend in a review, against a specification somebody wrote down.

This lesson puts three tuning methods on one plant and compares what comes out. **Ziegler–Nichols** derives gains from two measurements of the real hardware and needs no model at all. **Loop shaping** starts from the frequency-domain specification — crossover frequency and phase margin — and constructs a controller that meets it. **Pole placement** starts from the time-domain specification, writes down the closed-loop characteristic polynomial you want, and solves for the gains that produce it. All three are used in practice, on different problems, and the interesting part is where they disagree.

The plant is the rate channel from the previous lessons with one addition that makes it honest: a transport delay of $T = 8\ \mathrm{ms}$ for sensor latency and computation.

$$
G(s) = \frac{e^{-sT}}{J\,s\,(\tau s + 1)},
\qquad J = 1200\ \mathrm{kg\,m^2},\quad \tau = 0.02\ \mathrm{s},\quad T = 0.008\ \mathrm{s}.
$$

The delay costs nothing in magnitude and $-\omega T$ radians of phase — the fact from the signals and systems module that decides more designs than any other. Without it this plant has infinite gain margin and the interesting comparisons vanish.

## Write the specification first

A tuning method answers a question; you have to ask one. A rate loop's specification usually contains four things.

**Speed.** A rise-time or bandwidth requirement, usually inherited from the outer loop or the guidance update rate. The rule of thumb $t_r\,\omega_{bw} \approx 1.8$ converts one to the other, so a 0.2 s rise time asks for about $9\ \mathrm{rad/s}$ of closed-loop bandwidth and therefore a crossover near $10\ \mathrm{rad/s}$.

**Stability margins.** Aerospace practice is at least 6 dB of gain margin and 30–45° of phase margin, often 60° where the plant is poorly known. The next lessons define these precisely; for now read them as "how much the plant may be wrong before the loop is not a loop".

**A ceiling on bandwidth.** Crossover must stay well below the lowest structural bending mode, below the frequency where the actuator model stops being true, and below a sensible fraction of the sample rate. On most vehicles the ceiling, not the requirement, is what sets the answer.

**Actuator effort.** The noise-driven command computed in the first lesson, plus the peak command during the largest expected transient.

## Ziegler–Nichols

The ultimate-gain method needs no model. Set the integral and derivative terms to zero, raise $k_p$ until the closed loop oscillates at constant amplitude, and record that gain $K_u$ and the oscillation period $T_u$. In the language of the next lessons you have found the frequency where the loop phase is $-180^\circ$ and the gain that puts the magnitude at exactly 1 there. From those two numbers:

| Controller | $k_p$ | $T_i$ | $T_d$ |
| --- | --- | --- | --- |
| P | $0.5K_u$ | — | — |
| PI | $0.45K_u$ | $T_u/1.2$ | — |
| PID (classic) | $0.6K_u$ | $0.5T_u$ | $0.125T_u$ |

::: key
Ziegler–Nichols ultimate-gain tuning: raise $k_p$ until sustained oscillation at gain $K_u$ and period $T_u$. Classic PID: $k_p = 0.6K_u$, $T_i = 0.5T_u$, $T_d = 0.125T_u$. Aggressive (roughly quarter-decay) and rarely flown as-is, but a useful starting point.
:::

Note that the classic row has $T_i = 4T_d$ exactly, which is the boundary condition from the previous lesson: the Ziegler–Nichols PID has a double zero in series form, at $2/T_u$.

::: example Ultimate gain and period for the delayed rate plant
With proportional control only, the loop phase is $-90^\circ$ from the integrator, $-\arctan(\tau\omega)$ from the actuator and $-\omega T$ from the delay. Sustained oscillation needs their sum to be $-180^\circ$:

$$
\arctan(0.02\,\omega) + 0.008\,\omega = \frac{\pi}{2}.
$$

Bisection gives $\omega_u = 74.16\ \mathrm{rad/s}$, so $T_u = 2\pi/\omega_u = 0.0847\ \mathrm{s}$ — an oscillation at 11.8 Hz. The ultimate gain is whatever makes $|L| = 1$ there:

$$
K_u = J\,\omega_u\sqrt{1 + (\tau\omega_u)^2} = 1200 \times 74.16 \times \sqrt{1 + 1.483^2} = 1.59\times10^{5}.
$$

The classic PID settings are then $k_p = 0.6K_u = 95\,504$, $T_i = 0.0424\ \mathrm{s}$, $T_d = 0.0106\ \mathrm{s}$, or $k_i = 2.25\times10^6$ and $k_d = 1012$ in parallel gains. Putting the derivative filter pole at $10/T_d = 944\ \mathrm{rad/s}$ and computing: crossover lands at $55.7\ \mathrm{rad/s}$, phase margin $25.4^\circ$, gain margin $9.8\ \mathrm{dB}$, and the step response overshoots 74%.

That is a working controller and nobody would fly it. Crossover is five times the requirement, which puts the loop on top of any structural mode above 9 Hz; the phase margin is below every aerospace standard; and the delay margin is 8 ms, meaning one extra sample of latency destroys it. Ziegler–Nichols is targeting a quarter-amplitude decay ratio, which is a disturbance-rejection criterion from the process industries, not a margin.
:::

The open-loop or "reaction curve" variant fits a dead time $L$ and a slope $R$ (output rate per unit input) to the step response and sets $k_p = 1.2/(RL)$, $T_i = 2L$, $T_d = 0.5L$. For this plant $R = 1/J = 8.33\times10^{-4}\ \mathrm{rad\,s^{-2}/(N\,m)}$ and the apparent dead time is the true delay plus the actuator lag, $L \approx 0.028\ \mathrm{s}$, giving $k_p = 51\,429$, $T_i = 0.056\ \mathrm{s}$, $T_d = 0.014\ \mathrm{s}$: crossover $35.7\ \mathrm{rad/s}$, phase margin $38.0^\circ$, 55% overshoot. Less hot, same character.

::: warning
Both Ziegler–Nichols rules were developed for self-regulating process plants — a tank, a furnace, something that settles to a new steady value after a step. A vehicle rate channel is an integrator, and an integrator's response never settles, so the assumptions behind the rules do not hold. Use them to get a first number and an order of magnitude for $T_u$, then expect to halve the gain. And be careful how you find $K_u$ on real hardware: driving a flight vehicle to sustained oscillation is, by construction, driving it to the edge of instability.
:::

## Loop shaping

Loop shaping works directly on the specification. Choose the crossover frequency $\omega_c$ from the speed requirement and the ceilings; then ask what the controller must do at that one frequency. The plant contributes a known magnitude and phase there, so:

$$
|C(j\omega_c)| = \frac{1}{|G(j\omega_c)|},
\qquad
\angle C(j\omega_c) = -180^\circ + \mathrm{PM} - \angle G(j\omega_c).
$$

Then pick a controller structure that delivers both, placing its corners so it does not spoil the rest of the shape: the integral corner well below $\omega_c$ so its phase lag has decayed, the derivative corner near or above $\omega_c$ where its lead is wanted, and the derivative filter pole well above.

::: example Loop shaping the rate channel to 10 rad/s and 60°
Take $\omega_c = 10\ \mathrm{rad/s}$. The plant's phase there is

$$
\angle G(j10) = -90^\circ - \arctan(0.2) - (10)(0.008)\cdot\frac{180^\circ}{\pi} = -90^\circ - 11.31^\circ - 4.58^\circ = -105.89^\circ,
$$

so for $60^\circ$ of phase margin the controller may lag by at most $180^\circ - 60^\circ - 105.89^\circ = 14.11^\circ$. A PI contributes $-\arctan\bigl(1/(\omega_cT_i)\bigr)$, which for $T_i = 0.5\ \mathrm{s}$ is $-\arctan(0.2) = -11.31^\circ$: inside the budget, with $2.8^\circ$ to spare, and no derivative term is needed. The magnitude condition fixes the gain,

$$
|G(j10)| = \frac{1}{1200 \times 10 \times \sqrt{1 + 0.2^2}} = 8.171\times10^{-5},
\qquad
|C(j10)| = k_p\sqrt{1 + 0.2^2} = 1.0198\,k_p,
$$

so $k_p = 1/(1.0198 \times 8.171\times10^{-5}) = 12\,000\ \mathrm{N\,m\,s/rad}$ and $k_i = k_p/T_i = 24\,000\ \mathrm{N\,m/rad}$. Evaluating the finished loop: crossover $10.00\ \mathrm{rad/s}$, phase margin $62.8^\circ$, gain margin $22.1\ \mathrm{dB}$ at $72.2\ \mathrm{rad/s}$, delay margin $110\ \mathrm{ms}$, and a step response with 14.8% overshoot and a 0.117 s rise.

Notice what the delay did and did not do. It removed $4.58^\circ$ of the phase budget at crossover — a fifth of what the loop had to spend — and it created a finite gain margin where the undelayed plant had none. It changed no magnitude anywhere.
:::

Loop shaping is the method the rest of this module develops, because it is the one whose intermediate quantities are the things a specification talks about.

## Pole placement

Pole placement inverts a different question: if you know where you want the closed-loop poles, solve for the gains that put them there. Write the closed-loop characteristic polynomial symbolically, write the polynomial you want, and match coefficients.

For the rate plant without the delay and a PI controller, the loop is $L = (k_ps + k_i)/\bigl(J\tau s^3 + Js^2\bigr)$ and the closed-loop characteristic polynomial is

$$
J\tau s^3 + J s^2 + k_p s + k_i = 0
\quad\Longrightarrow\quad
s^3 + \frac{1}{\tau}s^2 + \frac{k_p}{J\tau}s + \frac{k_i}{J\tau} = 0 .
$$

Three coefficients, two free gains — and the $s^2$ coefficient is $1/\tau = 50$ whatever you do. This is the general situation and worth stating plainly: **a controller with $m$ free parameters can place $m$ coefficients of the closed-loop polynomial, not $m$ poles of your choosing.** To place all three poles here you would need a third parameter, which is what the derivative term buys.

So choose a desired polynomial of the right family: a dominant second-order pair plus one real pole $p$, constrained by $p + 2\zeta\omega_n = 50$.

::: example Placing the rate loop's poles at $\zeta = 0.7$, $\omega_n = 8$
Take $\zeta = 0.7$ and $\omega_n = 8\ \mathrm{rad/s}$, so $2\zeta\omega_n = 11.2$ and the third pole must be at $p = 50 - 11.2 = 38.8$. The desired polynomial is

$$
(s + 38.8)(s^2 + 11.2s + 64) = s^3 + 50s^2 + 498.56\,s + 2483.2 .
$$

Matching, $k_p = J\tau \times 498.56 = 24 \times 498.56 = 11\,965$ and $k_i = 24 \times 2483.2 = 59\,597$. The roots of the closed-loop polynomial are exactly $-38.8$ and $-5.6 \pm 5.713j$, as designed.

Now simulate it with the delay restored. The step response overshoots **30.4%**, not the 4.6% that $\zeta = 0.7$ promises, and the phase margin is $48.1^\circ$ rather than the $65^\circ$ or so a $\zeta = 0.7$ pair suggests. Two things went wrong, and both are instructive. The delay was not in the design model, which costs phase. And more importantly, pole placement places *poles*: the PI controller also puts a closed-loop **zero** at $-k_i/k_p = -4.98$, sitting right on top of the dominant pair's real part, and a zero that close adds large overshoot regardless of the damping ratio.

The fix is the setpoint weighting of the previous lesson, which moves the zero without touching the loop. With $b = 0.5$ the zero goes to $-9.96$ and the overshoot falls to 8.8%, with the settling time essentially unchanged at 0.64 s.
:::

## The three side by side

All four designs on the same delayed plant, simulated with the same step:

| Design | $k_p$ | $k_i$ | $k_d$ | $\omega_{gc}$ | PM | GM | overshoot | 2% settling |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ZN ultimate PID | 95 504 | $2.25\times10^6$ | 1012 | 55.7 | 25.4° | 9.8 dB | 74.4% | 0.209 s |
| ZN reaction PID | 51 429 | 918 367 | 720 | 35.7 | 38.0° | 13.7 dB | 55.1% | 0.336 s |
| Loop-shaped PI | 12 000 | 24 000 | 0 | 10.0 | 62.8° | 22.1 dB | 14.8% | 1.179 s |
| Pole-placed PI | 11 965 | 59 597 | 0 | 10.7 | 48.1° | 21.5 dB | 30.4% | 0.593 s |

Read the table as a statement about what each method optimises rather than about which is best. Ziegler–Nichols buys speed with margin, and on this plant it settles four to six times faster than the loop-shaped design — which is a real advantage if you have the actuator, the structural clearance and the sample rate to support a 36–56 rad/s crossover, and a liability if you do not. Loop shaping meets a margin specification exactly and lets the settling time fall where it falls. Pole placement hits a time-domain target in the model it was given and tells you nothing about margins until you go and compute them.

::: note
Every one of these methods is a starting point. Real tuning ends with a sweep over the dispersed plant — inertia, centre of gravity, actuator gain, delay, modal frequency, each at its extremes and in combination — and the gains that survive it are usually more conservative than any single-point method produces. That sweep is also where you find out that the margins themselves can mislead, which is the subject of a later lesson in this module.
:::

## Check yourself

::: check
A loop oscillates at constant amplitude with a period of 1.2 s when $k_p$ reaches 8.0. Give the Ziegler–Nichols classic PID settings in both standard and parallel form.
:::

::: answer
$K_u = 8.0$ and $T_u = 1.2\ \mathrm{s}$. Standard form: $k_p = 0.6 \times 8.0 = 4.8$, $T_i = 0.5 \times 1.2 = 0.6\ \mathrm{s}$, $T_d = 0.125 \times 1.2 = 0.15\ \mathrm{s}$. Parallel: $k_i = k_p/T_i = 8.0$ and $k_d = k_pT_d = 0.72$. As a check, $T_i = 4T_d$ as the rule always gives, and the loop's phase crossover frequency was $2\pi/1.2 = 5.24\ \mathrm{rad/s}$ with $|L| = 1/8.0$ there before the gain was raised.
:::

::: check
For the delayed rate plant, how much phase does the 8 ms delay cost at a crossover of 10 rad/s, and at the Ziegler–Nichols crossover of 55.7 rad/s? What does that say about where delay hurts?
:::

::: answer
Phase lost is $\omega T$ radians: at $10\ \mathrm{rad/s}$, $0.08\ \mathrm{rad} = 4.58^\circ$; at $55.7\ \mathrm{rad/s}$, $0.446\ \mathrm{rad} = 25.5^\circ$. The cost grows linearly with crossover while the phase a controller can generate does not, so delay sets a hard ceiling on achievable bandwidth. It is also why a fast design is far more fragile to a latency change than a slow one: adding 2 ms costs the 10 rad/s loop $1.1^\circ$ and the 55.7 rad/s loop $6.4^\circ$.
:::

::: check
You want a crossover of 4 rad/s with 60° phase margin on the plant $G(s) = 2/\bigl(s(s+3)\bigr)$. What magnitude and phase must the controller supply at 4 rad/s?
:::

::: answer
$G(j4) = 2/\bigl(j4(j4+3)\bigr)$. The magnitude is $2/\bigl(4\sqrt{16+9}\bigr) = 2/20 = 0.1$ and the phase is $-90^\circ - \arctan(4/3) = -90^\circ - 53.13^\circ = -143.13^\circ$. So the controller needs $|C(j4)| = 1/0.1 = 10$ and $\angle C(j4) = -180^\circ + 60^\circ + 143.13^\circ = +23.13^\circ$ — a magnitude of 10 and 23° of phase *lead*, which no PI can provide. A lead compensator or a PD term is required, and the lessons on lead-lag design construct exactly that.
:::

::: check
A pole-placement design puts the closed-loop poles exactly where you asked, yet the step response overshoots far more than the damping ratio predicts. Give two distinct causes and how you would distinguish them.
:::

::: answer
First, a closed-loop **zero** near the dominant poles. Pole placement constrains the denominator only; the numerator comes from wherever the reference enters, and a PI or PID controller contributes zeros at its own corners. A zero at $-z$ with $z$ comparable to the dominant real part adds overshoot that no pole location predicts. Second, **unmodelled dynamics** — a delay, an actuator pole, a flexible mode left out of the design model — which move the real poles away from the designed ones. Distinguish them by computing the closed-loop poles of the *full* model: if they are still where you placed them, the zero is the culprit and setpoint weighting or a prefilter fixes it without touching the loop; if they have moved, the model was wrong and the gains must be redesigned.
:::

::: check
Why can a PI controller not place all three closed-loop poles of the plant $1/\bigl(Js(\tau s+1)\bigr)$, and what changes if you use a PID with an ideal derivative?
:::

::: answer
The closed-loop polynomial is $J\tau s^3 + Js^2 + k_ps + k_i$. Normalising to a monic cubic, the $s^2$ coefficient is $1/\tau$ and contains no gain, so it is fixed by the plant; only the $s^1$ and $s^0$ coefficients are free. Two free parameters can set two coefficients, and a cubic has three, so the pole set is constrained to those whose sum of magnitudes is $1/\tau$. With an ideal PID the polynomial becomes $J\tau s^4 + Js^3 + k_ds^2 + k_ps + k_i$: the fixed coefficient moves to $s^3$ and the three gains set the lower three, so all four roots of a quartic with that constrained $s^3$ coefficient are reachable. Adding the derivative filter adds a fifth state and a fourth parameter, which restores full freedom at the cost of a pole you did not want.
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

Loop shaping and pole placement both need a way to see where the closed-loop poles go as a gain changes. The next lesson draws that picture.
