---
id: l10-notches-and-bending-modes
title: Notch filters, and gain versus phase stabilization
minutes: 20
covers:
  - 'Notch filters for structural bending modes; gain stabilization vs phase stabilization'
---

A launch vehicle is not rigid. It is a long, thin, thin-walled tube full of liquid, and it rings: the first lateral bending mode of a large booster sits somewhere between 1 and 3 Hz early in flight and climbs as propellant leaves, with structural damping of perhaps half a per cent. The rate gyro cannot tell that ringing apart from a genuine attitude rate, so the controller acts on it, and whether that action damps the mode or drives it is decided by the loop design.

Getting it wrong destroys vehicles. The remedy has two forms, and choosing between them is one of the real decisions in a launch-vehicle autopilot. **Gain stabilization** attenuates the loop gain across the mode until its phase stops mattering. **Phase stabilization** leaves the gain alone and arranges the phase so the feedback damps the mode rather than exciting it. This lesson builds the flexible plant, shows both mechanisms on real numbers, designs a notch filter, and quantifies what the notch costs at crossover.

The plant is the rate channel with a single mode added, and the controller is the PI of the earlier lessons unless stated otherwise.

## The flexible plant

A flexible body's response is the rigid-body response plus a sum over modes. For a rate gyro measuring body rate, each mode contributes a lightly damped second-order term:

$$
G(s) = \underbrace{\frac{1}{Js(\tau s + 1)}}_{\text{rigid}} \;+\; \sum_i \frac{R_i\,s}{s^2 + 2\zeta_i\omega_i s + \omega_i^2}.
$$

The **modal residue** $R_i$ is the product of the mode shape's slope at the gyro station and the mode shape's deflection at the actuator station. Both are properties of the structure, and — this is the point that matters — **the product can have either sign**, depending on whether the sensor and the actuator sit on the same side of a node of the mode shape. Moving a gyro by a metre can flip the sign of $R_i$, and that is a real design lever on real vehicles.

Take $\omega_m = 18\ \mathrm{rad/s}$ (2.9 Hz), $\zeta_m = 0.005$ and $|R| = 3\times10^{-5}$ in SI units. At resonance the modal term is $R/(2\zeta_m\omega_m)$, a real number, so the mode adds to the loop a vector of length

$$
\bigl|C(j\omega_m)\bigr|\,\frac{|R|}{2\zeta_m\omega_m} = 12\,074 \times \frac{3\times10^{-5}}{0.18} = 2.01,
$$

pointing in the direction $\pm\angle C(j\omega_m)$. Sweeping $\omega$ through resonance, the modal term traces a **circle of that diameter** attached to the rigid Nyquist curve — the classic bending-mode loop that a launch-vehicle Nyquist plot is covered in.

The rigid loop at $18\ \mathrm{rad/s}$ sits at $L_{\text{rigid}}(j18) = -0.232 - 0.472j$. The controller's phase there is $-6.3^\circ$, essentially along the positive real axis. So:

- with $R > 0$ the modal excursion is $+2.00 - 0.22j$, and the mode's circle bulges to the **right**, away from $-1$;
- with $R < 0$ it is $-2.00 + 0.22j$, carrying the curve to $-2.23 - 0.25j$: the circle wraps around the critical point.

::: example The same mode, two signs
Closing the PI loop around the flexible plant and computing the closed-loop poles:

| Residue | closed-loop modal pole | damping | verdict |
| --- | --- | --- | --- |
| open loop | $-0.090 \pm 18.00j$ | $\zeta = 0.005$ | rings for $4/0.09 = 44\ \mathrm{s}$ |
| $R = +3\times10^{-5}$ | $-0.271 \pm 17.91j$ | $\zeta = 0.0151$ | feedback damps it threefold |
| $R = -3\times10^{-5}$ | $+0.092 \pm 18.08j$ | unstable | amplitude doubles every $7.5\ \mathrm{s}$ |

Same structure, same controller, same modal frequency and damping. The only difference is a sign, and it decides between a loop that quietly helps the structures team and a loop that breaks the vehicle. The negative-residue loop's gain crossover reads $18.1\ \mathrm{rad/s}$ with a phase margin of $-34^\circ$; the modal circle has engulfed $-1$, adding two clockwise encirclements.

Sweeping the residue, the negative-residue loop is unstable for any $|R| > 1.48\times10^{-5}$ — about half the nominal value — so there is no useful margin to be found by hoping the mode is weaker than modelled.
:::

## The notch filter

The tool for removing loop gain at one frequency without disturbing the rest of the loop is a pair of lightly damped zeros over a pair of well-damped poles at the same frequency:

$$
N(s) = \frac{s^2 + 2\zeta_n\omega_n s + \omega_n^2}{s^2 + 2\zeta_d\omega_n s + \omega_n^2},
\qquad \zeta_n \ll \zeta_d .
$$

At $s = j\omega_n$ the real parts cancel in both numerator and denominator and $N(j\omega_n) = \zeta_n/\zeta_d$ exactly: the **depth is the damping ratio**, $20\log_{10}(\zeta_n/\zeta_d)$ dB. Far from $\omega_n$ the two quadratics agree and $N \to 1$, so the notch is invisible at DC and at high frequency. $\zeta_d$ sets the **width**: a large $\zeta_d$ spreads the attenuation over a wide band, which is what you need when the modal frequency is uncertain.

::: key
Notch filter for a structural mode: $N(s) = (s^2 + 2\zeta_n\omega_m s + \omega_m^2)/(s^2 + 2\zeta_d\omega_m s + \omega_m^2)$ with $\zeta_n \ll \zeta_d$. Depth is set by $\zeta_n/\zeta_d$. It always costs phase below $\omega_m$ and returns it above, which is why a notch near crossover is expensive.
:::

The phase is the whole story. Here is $N$ with $\omega_n = 18\ \mathrm{rad/s}$, $\zeta_n = 0.05$, $\zeta_d = 0.3$:

| $\omega$ (rad/s) | 5 | 10 | 15 | 18 | 22 | 30 | 50 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| $\lvert N\rvert$ (dB) | −0.14 | −0.88 | −5.3 | −15.6 | −4.8 | −1.2 | −0.25 |
| phase | −8.5° | −21.2° | −43.3° | 0° | +42.1° | +24.0° | +11.6° |

Below $\omega_n$ the notch is a lag and it is a deep one: $-21^\circ$ a full octave below the mode. Above $\omega_n$ it returns the phase as lead. Since crossover is essentially always *below* the mode being notched, the practical consequence is the one the key block states: a notch costs phase margin, and the closer the mode is to crossover, the more it costs.

## Gain stabilization

Gain stabilization means pushing $|L|$ far enough below 1 across the mode that the modal circle, whatever direction it points, cannot reach $-1$. The standard requirement is $-6\ \mathrm{dB}$ or better across the mode's whole *uncertainty band*, because modal frequencies move: propellant load changes them by tens of per cent over a burn, and the finite-element model that predicted them is good to maybe 10–15% before a modal survey and 5% after.

::: example A notch that survives ±15% of modal frequency uncertainty
Requirement: with $R = -3\times10^{-5}$ and the mode anywhere in $18 \pm 15\% = [15.3,\ 20.7]\ \mathrm{rad/s}$, keep $|L| \le -6\ \mathrm{dB}$ over that whole band.

Start by notching at the nominal $18\ \mathrm{rad/s}$ with $\zeta_n = 0.05$, $\zeta_d = 0.3$ — a $-15.6\ \mathrm{dB}$ notch that still gives $-6.0\ \mathrm{dB}$ at $15.3\ \mathrm{rad/s}$ and $-6.9\ \mathrm{dB}$ at $20.7\ \mathrm{rad/s}$. With the original gains ($k_p = 12\,000$, $k_i = 24\,000$) the loop is now stable for every modal frequency in the band, but the worst case of $|L|$ over the band is $+2.0\ \mathrm{dB}$, not $-6$: the notch has dealt with the mode itself, and the *rigid* loop gain is still too high at $15.3\ \mathrm{rad/s}$, which is only 1.5 times crossover. And the phase cost is severe — the notch contributes $-21^\circ$ at $10\ \mathrm{rad/s}$, so crossover falls to $9.4\ \mathrm{rad/s}$ and the phase margin to $48.3^\circ$ from $67.4^\circ$.

Meeting $-6\ \mathrm{dB}$ needs the rigid loop gain brought down as well. Reducing the gains to $k_p = 4200$, $k_i = 8400$ and keeping the same notch gives

| Quantity | Before | After |
| --- | --- | --- |
| Gain crossover | 10.0 rad/s | 3.90 rad/s |
| Phase margin | 67.4° | 51.9° |
| Modulus margin | 0.869 | 0.808 |
| Worst $\lvert L\rvert$ over $[15.3, 20.7]$, worst modal frequency | $+8.5\ \mathrm{dB}$ | $-6.75\ \mathrm{dB}$ |
| Notch phase cost at crossover | — | $-6.5^\circ$ |

That is the honest price. Gain-stabilising a mode at $18\ \mathrm{rad/s}$ with $\pm15\%$ of frequency uncertainty cost 61% of the loop's bandwidth. Note also how the notch's phase penalty shrank once crossover moved further from the mode, from $-21^\circ$ at $10\ \mathrm{rad/s}$ to $-6.5^\circ$ at $3.9\ \mathrm{rad/s}$: the two costs are not independent, and the cheapest route to a gain-stabilised mode is usually a slower loop rather than a deeper notch.
:::

```python
import numpy as np

J, tau, kp, ki, R = 1200.0, 0.02, 12000.0, 24000.0, -3e-5
wm, zm, zn, zd = 18.0, 0.005, 0.05, 0.3
w = np.logspace(0, 2, 200001)
s = 1j * w
G = 1 / (J * s * (tau * s + 1)) + R * s / (s**2 + 2 * zm * wm * s + wm**2)
notch = (s**2 + 2 * zn * wm * s + wm**2) / (s**2 + 2 * zd * wm * s + wm**2)
b = (w >= 15.3) & (w <= 20.7)
for C, name in ((kp + ki / s, "plain"), ((kp + ki / s) * notch, "notched")):
    L = C * G
    print(name, round(20 * np.log10(abs(L)[b].max()), 2))
# plain 7.2 / notched -8.36
```

## Phase stabilization

The alternative gives up on attenuation and manages direction instead. If the modal circle points away from $-1$, it can be as large as it likes: the Nyquist encirclement count is unchanged and the closed loop is stable — and better than stable, because a circle pointing away from $-1$ corresponds to feedback that *removes* energy from the mode.

::: example Phase stabilization on the same vehicle
Take $R = +3\times10^{-5}$ and no notch at all. The modal excursion is $+2.00 - 0.22j$, pointing essentially along the positive real axis from a rigid curve at $-0.23 - 0.47j$, so the circle never approaches $-1$. The closed-loop modal pole moves from $-0.090 \pm 18.00j$ to $-0.271 \pm 17.91j$: damping rises from $0.005$ to $0.0151$, and the ring-down time falls from 44 s to 15 s. The loop gain at the mode is $+5.9\ \mathrm{dB}$, far above the gain-stabilisation requirement, and it does not matter.

How robust is it? Sweeping the modal frequency over the whole range from $6$ to $60\ \mathrm{rad/s}$ with the residue held positive, the loop is stable at every frequency, and the modal damping it provides rises steadily from $-0.081$ to $-0.496$ of real part. That sounds like enormous robustness, and it is — to *frequency*. It is no robustness at all to the thing that actually varies: the same sweep with $R = -3\times10^{-5}$ is unstable at every modal frequency from 6 to 40 rad/s.

Phase stabilization is a bet on the sign and phase of the residue, not on the modal frequency. The finite-element model has to be right about which side of the node your gyro is on, about the sensor and actuator phase through the whole band, and about every filter in the signal path. A modal survey that moves a node by half a metre can flip the answer.
:::

::: key
Gain stabilization vs phase stabilization. **Gain-stabilize**: attenuate the mode below $0\ \mathrm{dB}$ (in practice $-6\ \mathrm{dB}$ with margin) so its phase does not matter — robust to modal frequency uncertainty, requires the mode above crossover. **Phase-stabilize**: keep the gain, arrange the phase so Nyquist encirclements are unchanged — the only option below crossover, but demands an accurate model.
:::

Why is gain stabilization impossible below crossover? By definition $|L| > 1$ below crossover — that is what crossover means. Attenuating the loop to $-6\ \mathrm{dB}$ at a frequency inside your control band means destroying the loop gain you built the controller to have, so either the mode gets phase-stabilised or the bandwidth comes down until the mode is above crossover. On a real vehicle the low-frequency modes — propellant slosh at a few tenths of a hertz, the first bending mode of a very large vehicle — are frequently below or straddling crossover, and they are phase-stabilised because there is no other choice.

::: warning
Notches are not free anywhere. Each one adds two poles and two zeros to the flight software, costs phase below its frequency, and must be re-tuned when the modal frequency moves — which on a booster it does continuously through the burn, so the notch frequency is usually scheduled along with the gains. A vehicle with four modes to notch is carrying eight poles of filtering, and their combined phase lag at crossover is the sum, not the maximum. Count it before you promise a bandwidth.
:::

::: warning
Do not confuse the modal *frequency* uncertainty with the modal *residue* uncertainty. The first is what a wider notch buys you protection against; the second is what phase stabilization stakes everything on, and no filter design protects against a residue whose sign is wrong. This is precisely the situation the robust-control material handles by treating the residue as a structured uncertainty and computing a bound that covers every value it might take.
:::

## Check yourself

::: check
A notch is specified as $\zeta_n = 0.02$, $\zeta_d = 0.4$ at $\omega_n = 30\ \mathrm{rad/s}$. What is its depth, and what is its magnitude and phase at $15\ \mathrm{rad/s}$?
:::

::: answer
Depth is $20\log_{10}(\zeta_n/\zeta_d) = 20\log_{10}(0.05) = -26.0\ \mathrm{dB}$ at $30\ \mathrm{rad/s}$. At $15\ \mathrm{rad/s}$: the numerator is $900 - 225 + j(2\times0.02\times30\times15) = 675 + 18j$ and the denominator is $675 + j(2\times0.4\times30\times15) = 675 + 360j$. The magnitude ratio is $\sqrt{675^2+18^2}/\sqrt{675^2+360^2} = 675.2/765.0 = 0.883$, i.e. $-1.08\ \mathrm{dB}$, and the phase is $\arctan(18/675) - \arctan(360/675) = 1.53^\circ - 28.07^\circ = -26.5^\circ$. A full octave below the notch, and it is still eating $26^\circ$ of phase.
:::

::: check
Why is the sign of the modal residue a property of where the sensor and the actuator sit, and what does that let a designer do?
:::

::: answer
The residue of mode $i$ in the gyro-to-torque transfer is the product of the mode shape's slope at the gyro station and its deflection (or slope, for a moment input) at the actuator station. A mode shape crosses zero at its nodes and changes sign there, so moving either the sensor or the actuator across a node flips the sign of that factor and hence of the residue. What it lets a designer do is choose: place the rate gyro so that the residues of the modes you intend to phase-stabilise all come out with the favourable sign, and accept whatever sign results for the modes you are going to gain-stabilise anyway. Gyro placement on a launch vehicle is a control decision taken jointly with structures, and it is normally settled before the autopilot gains are.
:::

::: check
A mode sits at $1.4\times$ your gain crossover frequency, with $\pm20\%$ frequency uncertainty. Argue from the numbers in this lesson whether gain stabilization is realistic.
:::

::: answer
The uncertainty band reaches down to $1.4 \times 0.8 = 1.12$ times crossover, where the loop gain is only slightly below $0\ \mathrm{dB}$ — a typical loop rolling off at $-20\ \mathrm{dB/decade}$ is about $-1\ \mathrm{dB}$ there. Getting to $-6\ \mathrm{dB}$ across the band therefore requires the notch to supply about $5\ \mathrm{dB}$ of attenuation at a frequency only 12% above crossover, and a notch deep enough to do that will cost thirty or forty degrees of phase at crossover, which the loop does not have. The lesson's own example is easier than this — the mode was at $1.8\times$ crossover with $\pm15\%$ — and it still required cutting crossover by 61%. The realistic options are to phase-stabilize the mode, or to reduce crossover until the mode sits at three or four times it, or to move the sensor.
:::

::: check
A vehicle's first bending mode is gain-stabilised at $-8\ \mathrm{dB}$. Propellant depletion raises the modal frequency by 25% during the burn while the notch stays where it was set. What has to be checked, and what is the usual fix?
:::

::: answer
Two things move in opposite directions. The mode has climbed further above crossover, so the rigid loop's roll-off gives more attenuation there — helpful. But the notch is now tuned 25% low, so at the new modal frequency it supplies far less than its nominal depth, and it may even be on its *upper* flank where it contributes phase lead and almost no attenuation. Whether the net is better or worse than $-8\ \mathrm{dB}$ has to be computed, not guessed. The usual fix is to schedule the notch frequency with flight time or with propellant mass, exactly as the gains are scheduled, so the notch tracks the mode. A common alternative on modes whose excursion is large is a single wider notch — a bigger $\zeta_d$ — sized to cover the whole flight range, paid for with extra phase at crossover throughout the flight.
:::

::: check
Explain, in terms of the Nyquist picture, why a phase-stabilised mode can have a loop gain of $+6\ \mathrm{dB}$ and still be perfectly stable, while a gain-stabilised mode is required to stay below $-6\ \mathrm{dB}$.
:::

::: answer
Stability is about encirclements of $-1$, not about magnitude. The modal circle is attached to the rigid curve at the modal frequency and has diameter $|C||R|/(2\zeta_m\omega_m)$. If it points away from the critical point — the phase-stabilised case — then no matter how large it is, it adds no encirclements, and in fact a circle pointing away from $-1$ means $|1+L|$ is *larger* there than for the rigid loop, which is sensitivity reduction and shows up as added modal damping. If the circle points toward $-1$, it encircles the critical point as soon as its size exceeds the distance, and the loop is unstable. Gain stabilization refuses to rely on knowing which way the circle points, so it requires the circle to be small enough that it cannot reach $-1$ in any direction: $|L| \le -6\ \mathrm{dB}$ keeps the whole excursion at least $0.5$ away from $-1$, which is the modulus-margin requirement from the margins lesson applied at the modal frequency.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| Flexible plant | $G = 1/\bigl(Js(\tau s+1)\bigr) + \sum_i R_is/(s^2 + 2\zeta_i\omega_is + \omega_i^2)$ |
| Modal residue $R_i$ | mode shape at the gyro $\times$ mode shape at the actuator; sign depends on node positions |
| Modal excursion | length $\lvert C(j\omega_m)\rvert\,\lvert R\rvert/(2\zeta_m\omega_m)$; traces a circle of that diameter |
| Example mode | $\omega_m = 18\ \mathrm{rad/s}$, $\zeta_m = 0.005$, $\lvert R\rvert = 3\times10^{-5}$: excursion 2.01 |
| $R > 0$ | circle points away from $-1$; modal damping rises $0.005 \to 0.0151$ |
| $R < 0$ | circle engulfs $-1$; pole at $+0.092 \pm 18.1j$, unstable for $\lvert R\rvert > 1.48\times10^{-5}$ |
| Notch | $N(s) = (s^2 + 2\zeta_n\omega_ms + \omega_m^2)/(s^2 + 2\zeta_d\omega_ms + \omega_m^2)$ |
| Depth, width | depth $= \zeta_n/\zeta_d$; width set by $\zeta_d$; $N(j\omega_m) = \zeta_n/\zeta_d$ exactly |
| Notch phase | lag below $\omega_m$, lead above; $-21^\circ$ at $\omega_m/1.8$ for $\zeta_n = 0.05$, $\zeta_d = 0.3$ |
| Gain-stabilised design | $k_p = 4200$, notch at 18 rad/s: $\omega_{gc}$ 10 → 3.90 rad/s, PM 51.9°, band gain $-6.75\ \mathrm{dB}$ |
| Gain stabilization | robust to modal frequency; needs the mode above crossover; costs bandwidth |
| Phase stabilization | robust to modal frequency, fragile to residue sign and phase; the only option below crossover |

The last two lessons showed loop gain being spent and bought back. The next one proves that the trade is not optional: there is a conservation law over frequency that no compensator can escape.
