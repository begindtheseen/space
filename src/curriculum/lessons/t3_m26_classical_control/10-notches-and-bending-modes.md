---
id: l10-notches-and-bending-modes
title: Notch filters, and gain versus phase stabilization
minutes: 24
covers:
  - 'Notch filters for structural bending modes; gain stabilization vs phase stabilization'
---

Flick a plastic ruler hanging off the edge of a desk. It *twangs* — it wobbles at its own favorite speed, and the wobble takes a while to die out. A rocket does the same. It is a long, thin-walled tube full of liquid, and when something pushes on it, it bends and rings like that ruler.

That ringing is called a **bending mode** — a natural way for the structure to flex, with its own frequency. For a large booster early in flight, the first sideways bending mode sits somewhere between 1 and 3 Hz. It climbs as propellant burns away and the rocket gets lighter. And it is barely held back: its structural **[[damping|damping-ratio]]** — how fast the ringing dies out on its own — is perhaps half a percent.

Here is why a control engineer cares. The rate gyro, which measures how fast the vehicle turns, sits on the bending structure. When the rocket flexes, the gyro tilts too, and it cannot tell that apart from a real turn. So the controller reacts to the ringing. Whether that reaction calms the ringing down or pumps it up is decided by how you designed the loop.

Get it wrong and you lose the vehicle. There are two ways to get it right, and choosing between them is one of the real decisions in a launch-vehicle autopilot:

- **Gain stabilization** — make the loop so weak at the mode's frequency that it does not matter which way the controller pushes.
- **Phase stabilization** — keep the loop strong at the mode, but make sure it always pushes the right way, so it takes energy out of the ringing.

This lesson models a bending rocket, shows both ideas with real numbers, designs a notch filter, and works out what it costs at crossover. The plant is the earlier rate channel plus one bending mode; the controller is the same PI unless we say otherwise.

## The flexible plant

Push a bending rocket and it does two things at once: the whole body turns (the **rigid-body** motion the earlier lessons modeled), and the structure rings in each of its modes. The sensor sees the sum.

For a rate gyro, each mode adds one lightly damped second-order term to the transfer function from torque to measured rate:

$$
G(s) = \underbrace{\frac{1}{Js(\tau s + 1)}}_{\text{rigid}} \;+\; \sum_i \frac{R_i\,s}{s^2 + 2\zeta_i\omega_i s + \omega_i^2}.
$$

Here $J$ is the moment of inertia and $\tau$ the actuator lag, as before. For mode number $i$, $\omega_i$ ("omega sub i") is its natural frequency in rad/s and $\zeta_i$ ("zeta sub i") is its damping ratio. The sum sign $\sum_i$ means "add one such term for every mode".

The new number is $R_i$, the **modal residue** — how strongly this mode connects the actuator to the sensor. It is the product of two things the structure decides:

- how much the mode **tilts** the rocket at the place where the gyro sits (the slope of the bending shape there), and
- how much the mode **moves** the rocket at the place where the actuator pushes (the sideways deflection there).

Here is the point that matters most: **the product can have either sign.** Each factor changes sign at a particular place along the rocket. The deflection changes sign at a **node**, a point that stays still while the rest of the structure swings. The tilt changes sign where the bending shape is flattest — at the [[crest of the bend|tilt-sign]], halfway between nodes. So moving the gyro a meter along the rocket, across such a crest, can flip the sign of $R_i$. That is a real design lever on real vehicles.

### A mode with numbers

Take one mode with $\omega_m = 18\ \mathrm{rad/s}$ (that is $18/2\pi = 2.9\ \mathrm{Hz}$), damping $\zeta_m = 0.005$, and residue size $|R| = 3\times10^{-5}$ in SI units.

At the mode's own frequency, $s = j\omega_m$. The $s^2 + \omega_m^2$ part of the bottom cancels, leaving $2\zeta_m\omega_m s$. The $s$ on top cancels the $s$ below, so the modal term becomes the real number $R/(2\zeta_m\omega_m)$. Multiply by the controller $C$ and the mode adds an arrow to the loop $L = CG$ of length

$$
\bigl|C(j\omega_m)\bigr|\,\frac{|R|}{2\zeta_m\omega_m} = 12\,074 \times \frac{3\times10^{-5}}{0.18} = 2.01 .
$$

That is huge — the whole rigid loop at that frequency is less than 0.6 long. The tiny damping is to blame: $0.18$ in the bottom is a small number.

The arrow points along $\angle C(j\omega_m)$, or exactly opposite if $R$ is negative. As $\omega$ sweeps through the resonance, the modal term traces a **[[circle|modal-circle]]** of that diameter, hanging off the rigid Nyquist curve. That loop-the-loop is the classic bending-mode circle, and a launch vehicle's Nyquist plot is covered in them.

Now the numbers. The rigid loop at $18\ \mathrm{rad/s}$ sits at $L_{\text{rigid}}(j18) = -0.232 - 0.472j$. The controller's phase there is $-6.3^\circ$ — pointing almost straight along the positive real axis. So:

- with $R > 0$ the modal arrow is $+2.00 - 0.22j$. The circle bulges to the **right**, away from $-1$;
- with $R < 0$ it is $-2.00 + 0.22j$. It carries the curve out to $-2.23 - 0.25j$, and the circle wraps right around the critical point $-1$.

::: example The same mode, two signs
Close the PI loop ($k_p = 12\,000$, $k_i = 24\,000$) around the flexible plant and compute the closed-loop poles. Look at the pair near $18\ \mathrm{rad/s}$:

| Residue | closed-loop modal pole | damping | verdict |
| --- | --- | --- | --- |
| open loop | $-0.090 \pm 18.00j$ | $\zeta = 0.005$ | rings for $4/0.09 = 44\ \mathrm{s}$ |
| $R = +3\times10^{-5}$ | $-0.271 \pm 17.91j$ | $\zeta = 0.0151$ | feedback damps it threefold |
| $R = -3\times10^{-5}$ | $+0.092 \pm 18.08j$ | unstable | amplitude doubles every $7.5\ \mathrm{s}$ |

How to read the table. The real part of a pole says how fast the ringing grows or shrinks. A real part of $-0.090$ means the ringing takes about $4/0.090 = 44\ \mathrm{s}$ to die away. A real part of $+0.092$ means it *grows*, doubling every $\ln 2/0.092 = 7.5\ \mathrm{s}$.

Same structure, same controller, same modal frequency and damping. The only difference is a sign. One sign gives a loop that quietly helps the structures team. The other gives a loop that breaks the vehicle.

The negative-residue loop's magnitude now crosses 1 near $18.1\ \mathrm{rad/s}$ with a phase margin of $-34^\circ$. The modal circle has swallowed $-1$ and added two clockwise encirclements, which means two closed-loop poles in the right half plane — exactly the pair in the table.

Sanity check on "maybe the mode is weaker than we think": sweep the residue, and the negative-residue loop is unstable for any $|R| > 1.48\times10^{-5}$. That is about half the nominal value. There is no useful margin to be found by hoping.
:::

## The notch filter

Think of the equalizer on a music app: pull down one narrow slider to kill a hum and the rest of the song is untouched. A **notch filter** does that to the loop — it removes gain in a narrow band around one frequency.

The recipe is a pair of lightly damped zeros over a pair of well-damped poles, both at the same frequency:

$$
N(s) = \frac{s^2 + 2\zeta_n\omega_n s + \omega_n^2}{s^2 + 2\zeta_d\omega_n s + \omega_n^2},
\qquad \zeta_n \ll \zeta_d .
$$

Here $\omega_n$ is the notch frequency, $\zeta_n$ the damping of the top (numerator) and $\zeta_d$ the damping of the bottom (denominator). The sign $\ll$ reads "much less than".

Why does it work? Put $s = j\omega_n$. Then $s^2 = -\omega_n^2$ cancels the $\omega_n^2$ in both top and bottom, and what is left is

$$
N(j\omega_n) = \frac{2\zeta_n\omega_n \cdot j\omega_n}{2\zeta_d\omega_n \cdot j\omega_n} = \frac{\zeta_n}{\zeta_d}
$$

exactly. So the **depth** of the notch is the ratio of the two damping ratios: $20\log_{10}(\zeta_n/\zeta_d)$ in dB. Far from $\omega_n$, the $s^2$ or $\omega_n^2$ terms dominate both quadratics, they agree, and $N \to 1$. The notch is invisible at low frequency and at high frequency.

The bottom damping $\zeta_d$ sets the **width**. A large $\zeta_d$ spreads the cut over a wide band. You want that when you are not sure exactly where the mode is.

::: key
Notch filter for a structural mode: $N(s) = (s^2 + 2\zeta_n\omega_m s + \omega_m^2)/(s^2 + 2\zeta_d\omega_m s + \omega_m^2)$ with $\zeta_n \ll \zeta_d$. Depth is set by $\zeta_n/\zeta_d$. It always costs phase below $\omega_m$ and returns it above, which is why a notch near crossover is expensive.
:::

The phase is the whole story. Here is [[the notch|notch-picture]] with $\omega_n = 18\ \mathrm{rad/s}$, $\zeta_n = 0.05$, $\zeta_d = 0.3$:

| $\omega$ (rad/s) | 5 | 8 | 10 | 15 | 18 | 22 | 30 | 50 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| $\lvert N\rvert$ (dB) | −0.14 | −0.44 | −0.88 | −5.3 | −15.6 | −4.8 | −1.2 | −0.25 |
| phase | −8.5° | −15.2° | −21.1° | −43.3° | 0° | +42.1° | +24.0° | +11.6° |

Below $\omega_n$ the notch is a **lag** — it delays the signal — and a big one: $-21^\circ$ at $10\ \mathrm{rad/s}$, almost an octave (a factor of two) below the mode. Above $\omega_n$ it gives the phase back as **lead**. Crossover is nearly always *below* the mode you are notching. So in practice the notch costs you phase margin, and the closer the mode is to crossover, the more it costs.

## Gain stabilization

Gain stabilization is keeping a bully out of reach, whichever way he swings: push $|L|$ so far below 1 across the mode that the modal circle, whichever way it points, cannot reach $-1$.

The usual requirement is $|L| \le -6\ \mathrm{dB}$ — a gain of one half — across the mode's whole **uncertainty band**. It is a band, not a point, because modal frequencies move. Propellant use changes them by tens of percent over a burn. And the [[finite-element model|finite-element]] that predicted them is good to maybe 10–15% before a [[modal survey|modal-survey]] and about 5% after one.

::: example A notch that survives ±15% of modal frequency uncertainty
**Requirement.** With $R = -3\times10^{-5}$ and the mode anywhere in $18 \pm 15\% = [15.3,\ 20.7]\ \mathrm{rad/s}$, keep $|L| \le -6\ \mathrm{dB}$ over that whole band.

**First try: add a notch, keep the gains.** Notch at the nominal $18\ \mathrm{rad/s}$ with $\zeta_n = 0.05$, $\zeta_d = 0.3$. That is a $-15.6\ \mathrm{dB}$ notch. It still gives $-6.0\ \mathrm{dB}$ at $15.3\ \mathrm{rad/s}$ and $-6.9\ \mathrm{dB}$ at $20.7\ \mathrm{rad/s}$, so its width covers the band.

With the original gains ($k_p = 12\,000$, $k_i = 24\,000$) this is stable when the mode sits at its nominal $18\ \mathrm{rad/s}$. It is *not* stable everywhere in the band: if the real mode sits between $15.3$ and about $15.7\ \mathrm{rad/s}$, the loop still goes unstable. The worst $|L|$ over the band is $+2.5\ \mathrm{dB}$, nowhere near $-6$.

Why? The band's low edge, $15.3\ \mathrm{rad/s}$, is only 1.5 times crossover, where the controller gain is still high. Before notching, a mode sitting there peaks at $+7.5\ \mathrm{dB}$. The notch takes off only $6\ \mathrm{dB}$ at that edge, which is not enough. And the phase cost is severe. The notch contributes $-21^\circ$ at $10\ \mathrm{rad/s}$, so crossover falls to $9.4\ \mathrm{rad/s}$ and the phase margin to $48.3^\circ$, down from $67.4^\circ$.

**Second try: lower the gains too.** Meeting $-6\ \mathrm{dB}$ needs the whole controller gain brought down. Reduce the gains to $k_p = 4200$, $k_i = 8400$ — each divided by about 2.9 — and keep the same notch:

| Quantity | Before | After |
| --- | --- | --- |
| Gain crossover | 10.0 rad/s | 3.90 rad/s |
| Phase margin | 67.4° | 51.9° |
| Modulus margin | 0.869 | 0.808 |
| Worst $\lvert L\rvert$ over $[15.3, 20.7]$, worst modal frequency | $+8.6\ \mathrm{dB}$ | $-6.6\ \mathrm{dB}$ |
| Notch phase cost at crossover | — | $-6.5^\circ$ |

"Before" is the plain PI loop; "after" is the lower gains plus the notch. The worst case now meets $-6\ \mathrm{dB}$.

**The honest price.** Gain-stabilizing a mode at $18\ \mathrm{rad/s}$ with $\pm15\%$ frequency uncertainty cost $1 - 3.90/10 = 61\%$ of the loop's bandwidth. Notice also that the notch's phase penalty shrank once crossover moved away from the mode: $-21^\circ$ at $10\ \mathrm{rad/s}$ became $-6.5^\circ$ at $3.9\ \mathrm{rad/s}$. The two costs are linked. The cheapest route to a gain-stabilized mode is usually a slower loop, not a deeper notch.
:::

The worst-case check in code, sweeping where the mode might really be:

```python
import numpy as np

J, tau, zm, R = 1200.0, 0.02, 0.005, -3e-5
w = np.linspace(15.3, 20.7, 5401)         # the uncertainty band, rad/s
s = 1j * w
notch = (s**2 + 2 * 0.05 * 18 * s + 18**2) / (s**2 + 2 * 0.3 * 18 * s + 18**2)

def worst_db(kp, ki, filt):
    """Largest |L| in the band, over every place the mode might really be."""
    C = (kp + ki / s) * filt
    worst = -np.inf
    for wm in np.linspace(15.3, 20.7, 541):
        G = 1 / (J * s * (tau * s + 1)) + R * s / (s**2 + 2 * zm * wm * s + wm**2)
        worst = max(worst, 20 * np.log10(np.abs(C * G).max()))
    return round(worst, 1)

print(worst_db(12000, 24000, 1.0), worst_db(12000, 24000, notch), worst_db(4200, 8400, notch))
# 8.6 2.5 -6.6
```

A plain **low-pass filter**, which cuts everything above its corner, also gain-stabilizes modes — many at once — but costs more phase at crossover than a notch aimed at one mode.

## Phase stabilization

Push a swing as it moves away from you and it goes higher. Push against it as it comes toward you and it slows down. Timing matters more than size.

Phase stabilization works on timing. It gives up on making the loop weak at the mode and instead controls the direction. If the modal circle points away from $-1$, it can be as big as it likes. The Nyquist encirclement count does not change, so the closed loop is stable. It is better than stable: a circle pointing away from $-1$ means the feedback [[takes energy out|why-damping]] of the mode.

::: example Phase stabilization on the same vehicle
Take $R = +3\times10^{-5}$ and no notch at all. The modal arrow is $+2.00 - 0.22j$. It points almost straight along the positive real axis, starting from the rigid curve at $-0.23 - 0.47j$, so the circle never comes near $-1$.

The closed-loop modal pole moves from $-0.090 \pm 18.00j$ to $-0.271 \pm 17.91j$. Damping rises from $0.005$ to $0.0151$, and the ring-down time falls from $44\ \mathrm{s}$ to $4/0.271 = 15\ \mathrm{s}$. The loop gain at the mode peaks at $+5.9\ \mathrm{dB}$ — far above the gain-stabilization requirement — and it does not matter.

**How robust is it?** Sweep the modal frequency from $6$ to $60\ \mathrm{rad/s}$, keeping the residue positive. The loop is stable at every frequency. The real part of the modal pole goes steadily from $-0.081$ to $-0.496$, so the feedback damps the mode everywhere. That is enormous robustness — to *frequency*.

It is no robustness at all to the thing that really varies. The same sweep with $R = -3\times10^{-5}$ is unstable at every modal frequency from $6$ up to about $40\ \mathrm{rad/s}$. (Above that, the circle's diameter, which shrinks as the frequency rises, gets too small to reach $-1$ — gain stabilization happening by itself.)

So phase stabilization is a bet on the sign and phase of the residue, not on the modal frequency. The model must be right about which side of the crest the gyro sits on, and about the phase of the sensor, the actuator and every filter in the path. A modal survey that moves a crest by half a meter can flip the answer. On a real vehicle, the loop's phase also drifts with frequency — actuator lag, delays and filters all add more lag higher up — so a mode that moves far enough can rotate its circle toward $-1$ even with the right sign.
:::

::: key
Gain stabilization vs phase stabilization. **Gain-stabilize**: attenuate the mode below $0\ \mathrm{dB}$ (in practice $-6\ \mathrm{dB}$ with margin) so its phase does not matter — robust to modal frequency uncertainty, requires the mode above crossover. **Phase-stabilize**: keep the gain, arrange the phase so Nyquist encirclements are unchanged — the only option below crossover, but demands an accurate model.
:::

Why is gain stabilization impossible below crossover? Crossover is where $|L|$ falls through 1. Below it, $|L| > 1$ — that is what "below crossover" means. Pushing the loop to $-6\ \mathrm{dB}$ at a frequency inside your control band would destroy the very loop gain you built the controller to have. So either the mode gets phase-stabilized, or the bandwidth comes down until the mode sits above crossover.

On a real vehicle the low-frequency modes are often below crossover or straddling it: **[[propellant slosh|slosh]]** — liquid sloshing in the tanks, at a few tenths of a hertz — and the first bending mode of a very large vehicle. They are phase-stabilized because there is no other choice.

::: warning
Notches are not free anywhere. Each one adds two poles and two zeros to the flight software, costs phase below its frequency, and must be re-tuned when the modal frequency moves. On a booster that happens continuously through the burn, so the notch frequency is usually [[scheduled|notch-scheduling]] along with the gains. A vehicle with four modes to notch carries eight poles of filtering, and their combined phase lag at crossover is the sum, not the largest one. Count it before you promise a bandwidth.
:::

::: warning
Do not mix up modal *frequency* uncertainty with modal *residue* uncertainty. A wider notch protects you against the first. Phase stabilization stakes everything on the second, and no filter design protects against a residue whose sign is wrong. This is exactly the situation robust control handles by treating the residue as a [[structured uncertainty|robust-bridge]] and computing a bound that covers every value it might take.
:::

## Check yourself

::: check
A notch is specified as $\zeta_n = 0.02$, $\zeta_d = 0.4$ at $\omega_n = 30\ \mathrm{rad/s}$. What is its depth, and what is its magnitude and phase at $15\ \mathrm{rad/s}$?
:::

::: answer
**Depth.** $20\log_{10}(\zeta_n/\zeta_d) = 20\log_{10}(0.05) = -26.0\ \mathrm{dB}$, at $30\ \mathrm{rad/s}$.

**At $15\ \mathrm{rad/s}$.** Put $s = 15j$, so $s^2 = -225$.

- Numerator: $900 - 225 + j(2\times0.02\times30\times15) = 675 + 18j$.
- Denominator: $675 + j(2\times0.4\times30\times15) = 675 + 360j$.

The magnitude ratio is $\sqrt{675^2+18^2}/\sqrt{675^2+360^2} = 675.2/765.0 = 0.883$, which is $-1.08\ \mathrm{dB}$. The phase is $\arctan(18/675) - \arctan(360/675) = 1.53^\circ - 28.07^\circ = -26.5^\circ$.

Sanity check: an octave below the notch the gain is barely touched, yet $26^\circ$ of phase is gone.
:::

::: check
Why is the sign of the modal residue a property of where the sensor and the actuator sit, and what does that let a designer do?
:::

::: answer
The residue of mode $i$ in the gyro-to-torque transfer is a product of two factors: the tilt (slope) of the mode shape at the gyro station, and its deflection (or slope, for a moment input) at the actuator station. Each factor changes sign at a particular place. The deflection changes sign at a node. The slope changes sign where the shape is flattest, at a crest. Move the sensor or the actuator across such a place and that factor flips sign — and so does the residue.

That lets a designer choose: place the gyro so the modes you will phase-stabilize get the favorable sign, and accept whatever sign the gain-stabilized modes get. Gyro placement is a control decision made with the structures team, normally settled before the autopilot gains.
:::

::: check
A mode sits at $1.4\times$ your gain crossover frequency, with $\pm20\%$ frequency uncertainty. Argue from the numbers in this lesson whether gain stabilization is realistic.
:::

::: answer
The uncertainty band reaches down to $1.4 \times 0.8 = 1.12$ times crossover. There the loop gain is only a little below $0\ \mathrm{dB}$: a loop rolling off at $-20\ \mathrm{dB/decade}$ is about $20\log_{10}(1/1.12) = -1\ \mathrm{dB}$.

So to reach $-6\ \mathrm{dB}$ across the band, the notch has to supply about $5\ \mathrm{dB}$ of cut at a frequency only 12% above crossover. A notch wide enough to do that costs thirty or forty degrees of phase at crossover, and the loop does not have that to spare.

This lesson's own example was easier — the mode sat at $1.8\times$ crossover with $\pm15\%$ — and it still needed crossover cut by 61%. The realistic options: phase-stabilize the mode, or lower crossover until the mode sits at three or four times it, or move the sensor.
:::

::: check
A vehicle's first bending mode is gain-stabilized at $-8\ \mathrm{dB}$. Propellant depletion raises the modal frequency by 25% during the burn while the notch stays where it was set. What has to be checked, and what is the usual fix?
:::

::: answer
Two things move in opposite directions.

- The mode has climbed further above crossover, so the rigid loop's roll-off gives more attenuation there. That helps.
- But the notch is now tuned 25% low. At the new modal frequency it supplies far less than its full depth. It may even sit on its *upper* flank, where it adds phase lead and almost no cut.

Whether the net is better or worse than $-8\ \mathrm{dB}$ must be computed, not guessed.

The usual fix is to schedule the notch frequency against flight time or propellant mass, like the gains, so it follows the mode. The alternative is one wider notch — a bigger $\zeta_d$ — covering the whole flight range, paid for with extra phase lag at crossover all flight long.
:::

::: check
Explain, in terms of the Nyquist picture, why a phase-stabilized mode can have a loop gain of $+6\ \mathrm{dB}$ and still be perfectly stable, while a gain-stabilized mode is required to stay below $-6\ \mathrm{dB}$.
:::

::: answer
Stability is about encirclements of $-1$, not about size. The modal circle hangs off the rigid curve at the modal frequency and has diameter $|C||R|/(2\zeta_m\omega_m)$.

If the circle points away from the critical point — the phase-stabilized case — it adds no encirclements, however large it is. In fact a circle pointing away from $-1$ makes $|1+L|$ *larger* there than for the rigid loop. That is smaller sensitivity, and it shows up as extra modal damping.

If the circle points toward $-1$, it encircles the critical point as soon as it is big enough to reach, and the loop goes unstable.

Gain stabilization refuses to rely on knowing which way the circle points. So it requires the circle to be too small to reach $-1$ in any direction. $|L| \le -6\ \mathrm{dB}$ means $|L| \le 0.5$, which keeps the whole excursion at least $0.5$ away from $-1$. That is the modulus-margin requirement from the margins lesson, applied at the modal frequency.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| Flexible plant | $G = 1/\bigl(Js(\tau s+1)\bigr) + \sum_i R_is/(s^2 + 2\zeta_i\omega_is + \omega_i^2)$ |
| Modal residue $R_i$ | tilt of the mode shape at the gyro $\times$ deflection at the actuator; its sign depends on where they sit |
| Modal excursion | length $\lvert C(j\omega_m)\rvert\,\lvert R\rvert/(2\zeta_m\omega_m)$; traces a circle of that diameter |
| Example mode | $\omega_m = 18\ \mathrm{rad/s}$, $\zeta_m = 0.005$, $\lvert R\rvert = 3\times10^{-5}$: excursion 2.01 |
| $R > 0$ | circle points away from $-1$; modal damping rises $0.005 \to 0.0151$ |
| $R < 0$ | circle swallows $-1$; pole at $+0.092 \pm 18.1j$; unstable for $\lvert R\rvert > 1.48\times10^{-5}$ |
| Notch | $N(s) = (s^2 + 2\zeta_n\omega_ms + \omega_m^2)/(s^2 + 2\zeta_d\omega_ms + \omega_m^2)$ |
| Depth, width | $N(j\omega_m) = \zeta_n/\zeta_d$ exactly; width set by $\zeta_d$ |
| Notch phase | lag below $\omega_m$, lead above; $-21^\circ$ at $10\ \mathrm{rad/s}$ for $\zeta_n = 0.05$, $\zeta_d = 0.3$, $\omega_m = 18$ |
| Gain-stabilized design | $k_p = 4200$, notch at 18 rad/s: $\omega_{gc}$ 10 → 3.90 rad/s, PM 51.9°, worst band gain $-6.6\ \mathrm{dB}$ |
| Gain stabilization | robust to modal frequency; needs the mode above crossover; costs bandwidth |
| Phase stabilization | robust to modal frequency, fragile to residue sign and phase; the only option below crossover |

The last two lessons showed loop gain being spent and bought back. The next one proves that the trade is not optional: there is a conservation law over frequency that no compensator can escape.

::: context damping-ratio What half a percent of damping means
The **damping ratio** $\zeta$ says how quickly ringing dies out on its own. At $\zeta = 1$ a disturbed structure settles without a single wobble. At $\zeta = 0.005$ it rings for a long time: the swing shrinks by a factor of $e \approx 2.7$ only after about $1/(2\pi\zeta) \approx 32$ full cycles.

Low damping also means a tall resonance. Shake the structure exactly at its natural frequency and the response is about $1/(2\zeta) = 100$ times bigger than a slow push of the same size would give. That is why a tiny residue like $3\times10^{-5}$ can still produce a modal arrow twice as long as the whole rigid loop.
:::

::: context tilt-sign Where the tilt changes sign
This is the first bending shape of a free beam, drawn with the bend exaggerated. The two **nodes** stay still; the ends and the middle swing in opposite directions. A rate gyro senses *tilt* — the slope of the shape where it sits. Gyro A and gyro B sit on either side of the crest, so their tilts point opposite ways. Same mode, same actuator, opposite sign of $R$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="90" x2="330" y2="90" stroke="#6c7a93" stroke-width="1.2" stroke-dasharray="4 3"/>
  <path d="M30.0,50.0 L35.0,53.1 L40.0,56.2 L45.0,59.3 L50.0,62.4 L55.0,65.5 L60.0,68.5 L65.0,71.5 L70.0,74.6 L75.0,77.5 L80.0,80.4 L85.0,83.3 L90.0,86.1 L95.0,88.8 L100.0,91.4 L105.0,94.0 L110.0,96.4 L115.0,98.7 L120.0,100.9 L125.0,102.9 L130.0,104.8 L135.0,106.6 L140.0,108.2 L145.0,109.6 L150.0,110.8 L155.0,111.9 L160.0,112.7 L165.0,113.4 L170.0,113.9 L175.0,114.2 L180.0,114.3 L185.0,114.2 L190.0,113.9 L195.0,113.4 L200.0,112.7 L205.0,111.9 L210.0,110.8 L215.0,109.6 L220.0,108.2 L225.0,106.6 L230.0,104.8 L235.0,102.9 L240.0,100.9 L245.0,98.7 L250.0,96.4 L255.0,94.0 L260.0,91.4 L265.0,88.8 L270.0,86.1 L275.0,83.3 L280.0,80.4 L285.0,77.5 L290.0,74.6 L295.0,71.5 L300.0,68.5 L305.0,65.5 L310.0,62.4 L315.0,59.3 L320.0,56.2 L325.0,53.1 L330.0,50.0" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <circle cx="97.2" cy="90" r="4.5" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="262.8" cy="90" r="4.5" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="97.2" y="76" font-size="12" text-anchor="middle" fill="#1f2a44">node</text>
  <text x="262.8" y="76" font-size="12" text-anchor="middle" fill="#1f2a44">node</text>
  <circle cx="180.0" cy="138.6" r="4" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="160" font-size="12" text-anchor="middle" fill="#1f2a44">crest: tilt is zero here</text>
  <line x1="115.0" y1="109.8" x2="155.0" y2="136.5" stroke="#b4232c" stroke-width="2.5"/>
  <line x1="205.0" y1="136.5" x2="245.0" y2="109.8" stroke="#b4232c" stroke-width="2.5"/>
  <text x="135.0" y="147.1" font-size="12" text-anchor="middle" fill="#b4232c">gyro A</text>
  <text x="225.0" y="147.1" font-size="12" text-anchor="middle" fill="#b4232c">gyro B</text>
  <text x="30" y="36" font-size="12" fill="#1f2a44">engine (tail)</text>
  <text x="330" y="36" font-size="12" text-anchor="end" fill="#1f2a44">nose</text>
</svg>
```

For this shape the nodes sit at 22.4% and 77.6% of the length, and the tilt is zero exactly at the middle.
:::

::: context modal-circle The loop-the-loop on a Nyquist plot
Here are both versions of the rate loop, computed from the lesson's numbers and drawn to scale. Away from $18\ \mathrm{rad/s}$ they follow the same rigid curve. Near the mode each makes a circle about 2 across. The blue one ($R > 0$) swings to the right, away from $-1$. The red one ($R < 0$) swings left and wraps the critical point — two extra clockwise encirclements, two unstable poles.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="90" x2="350" y2="90" stroke="#6c7a93" stroke-width="1"/>
  <line x1="200" y1="15" x2="200" y2="195" stroke="#6c7a93" stroke-width="1"/>
  <path d="M155.5,184.2 L157.5,181.2 L159.3,178.5 L160.9,175.8 L162.5,173.3 L163.9,171.0 L165.2,168.7 L167.5,164.6 L169.5,160.8 L171.3,157.4 L172.8,154.2 L174.2,151.3 L175.3,148.6 L176.4,146.1 L177.4,143.8 L178.6,140.6 L179.7,137.7 L180.7,135.0 L181.5,132.5 L182.5,129.4 L183.4,126.4 L184.2,123.6 L185.0,120.7 L185.6,118.2 L186.3,115.1 L187.1,112.1 L187.8,109.7 L188.5,107.3 L189.4,104.9 L190.3,102.5 L191.4,100.1 L192.5,97.8 L193.7,95.5 L195.1,93.2 L196.5,91.1 L198.0,89.0 L199.6,86.9 L201.5,84.8 L203.4,82.8 L205.4,80.8 L207.5,79.0 L209.4,77.4 L211.7,75.8 L214.3,74.1 L216.6,72.7 L219.3,71.2 L222.2,69.9 L224.7,68.8 L227.4,67.9 L230.4,67.0 L233.7,66.2 L237.2,65.5 L239.8,65.2 L242.5,65.0 L245.4,64.9 L248.5,64.9 L251.7,65.1 L255.1,65.5 L258.6,66.1 L262.3,67.0 L266.2,68.2 L270.1,69.8 L274.2,71.7 L278.2,74.0 L282.3,76.8 L284.3,78.4 L286.3,80.1 L288.3,82.0 L290.2,83.9 L292.1,86.0 L293.9,88.2 L295.6,90.6 L297.3,93.1 L298.8,95.7 L300.2,98.4 L301.5,101.2 L302.7,104.1 L303.7,107.2 L304.6,110.3 L305.3,113.5 L305.9,116.7 L306.3,120.0 L306.4,123.3 L306.4,126.7 L306.3,130.0 L305.9,133.3 L305.3,136.6 L304.6,139.9 L303.7,143.1 L302.6,146.2 L301.4,149.3 L300.0,152.2 L298.4,155.0 L296.8,157.8 L295.0,160.4 L293.1,162.8 L291.1,165.1 L289.1,167.3 L286.9,169.4 L284.7,171.3 L282.5,173.1 L280.2,174.7 L278.0,176.2 L275.6,177.5 L273.3,178.8 L271.0,179.9 L266.5,181.7 L262.0,183.1 L257.7,184.1 L253.5,184.7 L249.5,185.1 L245.7,185.2 L242.1,185.0 L238.8,184.7 L235.6,184.2 L232.6,183.6 L229.8,182.9 L227.2,182.1 L224.8,181.2 L221.5,179.8 L218.5,178.3 L215.8,176.8 L213.4,175.3 L211.2,173.8 L208.6,171.8 L206.3,169.9 L204.3,168.1 L202.2,165.9 L200.4,163.8 L198.8,161.8 L197.2,159.6 L195.6,157.3 L194.2,154.9 L192.9,152.5 L191.7,150.1 L190.7,147.7 L189.8,145.4 L189.0,142.9 L188.3,140.4 L187.7,137.9 L187.2,135.4 L186.9,132.9 L186.6,130.4 L186.5,127.9 L186.6,123.0 L186.8,120.4 L187.3,117.0 L187.9,113.7 L188.7,110.6 L189.3,108.2 L190.0,105.8 L190.8,103.1 L191.8,100.5 L192.8,98.2 L194.0,95.9 L194.9,94.3" fill="none" stroke="#1d6fd1" stroke-width="2.2"/>
  <path d="M155.2,185.1 L157.1,182.2 L159.0,179.4 L160.6,176.8 L162.2,174.4 L163.6,172.1 L164.9,169.9 L167.2,165.8 L169.2,162.1 L170.9,158.8 L172.4,155.7 L173.8,152.9 L175.0,150.3 L176.0,148.0 L177.4,144.7 L178.6,141.8 L179.6,139.3 L180.7,136.2 L181.7,133.6 L182.7,130.9 L183.5,128.6 L183.3,131.1 L182.5,133.4 L181.5,135.8 L180.5,138.1 L179.3,140.4 L178.1,142.7 L176.7,144.9 L175.2,147.1 L173.6,149.3 L171.9,151.3 L170.0,153.4 L168.0,155.4 L165.9,157.4 L163.7,159.1 L161.7,160.7 L159.3,162.3 L157.2,163.7 L154.8,165.0 L152.0,166.4 L149.0,167.7 L146.5,168.7 L143.7,169.6 L140.6,170.5 L137.2,171.2 L133.6,171.7 L130.9,172.0 L128.1,172.2 L125.2,172.2 L122.0,172.0 L118.7,171.7 L115.3,171.2 L111.7,170.4 L107.9,169.4 L104.0,168.0 L100.0,166.2 L95.9,164.1 L91.9,161.5 L89.8,160.0 L87.8,158.4 L85.8,156.7 L83.8,154.9 L81.9,152.9 L80.1,150.8 L78.3,148.6 L76.5,146.2 L74.9,143.7 L73.4,141.1 L71.9,138.4 L70.6,135.6 L69.5,132.6 L68.4,129.6 L67.6,126.5 L66.8,123.3 L66.3,120.0 L65.9,116.7 L65.7,113.4 L65.7,110.0 L65.9,106.7 L66.3,103.3 L66.9,100.0 L67.6,96.7 L68.5,93.5 L69.6,90.4 L70.8,87.4 L72.2,84.4 L73.8,81.6 L75.4,78.8 L77.2,76.2 L79.1,73.7 L81.1,71.4 L83.2,69.2 L85.3,67.1 L87.5,65.2 L89.7,63.4 L92.0,61.8 L94.3,60.3 L96.6,58.9 L98.9,57.7 L101.2,56.6 L103.5,55.6 L108.0,54.0 L112.5,52.8 L116.7,51.9 L120.8,51.4 L124.7,51.2 L128.4,51.2 L131.9,51.4 L135.1,51.8 L138.2,52.4 L141.1,53.0 L143.8,53.8 L146.3,54.6 L148.6,55.5 L151.9,56.8 L154.8,58.3 L157.4,59.8 L159.8,61.3 L161.9,62.7 L164.4,64.7 L166.6,66.5 L168.5,68.3 L170.6,70.5 L172.4,72.5 L174.2,74.7 L175.8,76.8 L177.2,79.0 L178.6,81.3 L179.9,83.6 L181.0,85.8 L182.1,88.1 L183.0,90.5 L183.9,92.9 L184.6,95.3 L185.3,97.7 L185.9,100.2 L186.3,102.6 L186.7,105.1 L187.2,108.2 L189.0,106.5 L190.0,103.7 L190.9,101.2 L191.9,98.8 L193.1,96.5 L194.4,94.3 L195.0,93.5" fill="none" stroke="#b4232c" stroke-width="2.2"/>
  <line x1="134" y1="84" x2="146" y2="96" stroke="#1f2a44" stroke-width="2.5"/>
  <line x1="134" y1="96" x2="146" y2="84" stroke="#1f2a44" stroke-width="2.5"/>
  <text x="140" y="112" font-size="12" text-anchor="middle" fill="#1f2a44">−1</text>
  <text x="206" y="104" font-size="11" fill="#6c7a93">0</text>
  <text x="262" y="56" font-size="12" text-anchor="middle" fill="#1d6fd1">R &gt; 0</text>
  <text x="84" y="44" font-size="12" text-anchor="middle" fill="#b4232c">R &lt; 0</text>
  <text x="340" y="84" font-size="11" text-anchor="end" fill="#6c7a93">Re L</text>
</svg>
```

The circle is so big because the damping is so small: at resonance the mode's size is divided by only $2\zeta_m\omega_m = 0.18$.
:::

::: context notch-picture The shape of the notch
The notch from the table, drawn on a Bode magnitude plot. It dips to $-15.6\ \mathrm{dB}$ at $18\ \mathrm{rad/s}$ and is nearly $0\ \mathrm{dB}$ a decade either side. The shaded band is $18 \pm 15\%$, and the dashed line is the $-6\ \mathrm{dB}$ target: the curve crosses it right at the edges of the band, which is why this notch was chosen for the gain-stabilization example.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 175" font-family="Inter, Arial, sans-serif">
  <rect x="217.7" y="22" width="19.7" height="110" fill="#8fb8f0" opacity="0.45"/>
  <line x1="40" y1="30" x2="340" y2="30" stroke="#6c7a93" stroke-width="1"/>
  <line x1="40" y1="66" x2="340" y2="66" stroke="#f2b880" stroke-width="1.5" stroke-dasharray="5 3"/>
  <path d="M40.0,30.0 L44.0,30.0 L48.0,30.0 L52.0,30.0 L56.0,30.0 L60.0,30.1 L64.0,30.1 L68.0,30.1 L72.0,30.1 L76.0,30.1 L80.0,30.1 L84.0,30.1 L88.0,30.1 L92.0,30.1 L96.0,30.2 L100.0,30.2 L104.0,30.2 L108.0,30.2 L112.0,30.3 L116.0,30.3 L120.0,30.4 L124.0,30.4 L128.0,30.5 L132.0,30.5 L136.0,30.6 L140.0,30.7 L144.0,30.8 L148.0,30.9 L152.0,31.1 L156.0,31.2 L160.0,31.4 L164.0,31.7 L168.0,31.9 L172.0,32.3 L176.0,32.7 L180.0,33.2 L184.0,33.9 L188.0,34.8 L192.0,35.9 L196.0,37.3 L200.0,39.3 L203.5,41.7 L206.5,44.4 L209.5,48.0 L212.0,51.9 L214.0,55.9 L216.0,60.9 L217.5,65.5 L219.0,70.9 L220.0,75.2 L221.0,80.0 L222.0,85.4 L223.0,91.5 L224.0,98.4 L225.0,105.8 L226.0,113.3 L227.0,119.7 L228.3,123.4 L230.0,117.2 L231.0,110.2 L232.0,102.6 L233.0,95.4 L234.0,88.9 L235.0,83.0 L236.0,77.9 L237.0,73.3 L238.0,69.3 L239.5,64.1 L241.0,59.7 L243.0,55.0 L245.0,51.2 L247.5,47.4 L250.5,44.0 L254.0,41.0 L257.5,38.8 L261.5,37.0 L265.5,35.6 L269.5,34.5 L273.5,33.7 L277.5,33.1 L281.5,32.6 L285.5,32.2 L289.5,31.9 L293.5,31.6 L297.5,31.4 L301.5,31.2 L305.5,31.0 L309.5,30.9 L313.5,30.8 L317.5,30.7 L321.5,30.6 L325.5,30.5 L329.5,30.4 L333.5,30.4 L337.5,30.3 L340.0,30.3" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="36" y="34" font-size="11" text-anchor="end" fill="#1f2a44">0 dB</text>
  <text x="36" y="70" font-size="11" text-anchor="end" fill="#1f2a44">−6</text>
  <text x="36" y="127" font-size="11" text-anchor="end" fill="#1f2a44">−15.6</text>
  <line x1="40" y1="123.4" x2="228.3" y2="123.4" stroke="#6c7a93" stroke-width="0.8" stroke-dasharray="2 3"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="150">1</text><text x="190" y="150">10</text><text x="340" y="150">100</text><text x="190" y="166">ω (rad/s)</text>
    <text x="228.3" y="150">18</text>
  </g>
  <text x="227.5" y="16" font-size="11" text-anchor="middle" fill="#1f2a44">±15% band</text>
</svg>
```

Make $\zeta_d$ bigger and the dip gets wider; make $\zeta_n$ smaller and it gets deeper.
:::

::: context finite-element Where the modal numbers come from
A **finite-element model** chops the structure into thousands of small pieces — beams, plates, shells — each with simple, known stiffness and mass. The computer glues them together and solves for the shapes and frequencies at which the whole assembly likes to vibrate.

It is only as good as its inputs: how stiff the joints are, how the liquid in the tanks moves, how the engine is mounted. Those are hard to know exactly, which is why a predicted modal frequency is trusted to 10–15% until it has been measured.
:::

::: context modal-survey Shaking the real thing
A **modal survey**, or ground vibration test, measures the real structure's modes. Engineers hang or support the vehicle, shake it gently with electric shakers at many frequencies, and record the response with dozens or hundreds of accelerometers. From that they read off each mode's frequency, damping and shape, and correct the model.

In the 1960s NASA's Marshall Space Flight Center built a dynamic test stand tall enough to hold a complete Saturn V for exactly this kind of test. Modal surveys are still part of qualifying a new launch vehicle today.
:::

::: context why-damping Why the right direction adds damping
Damping is a force that opposes motion, like a shock absorber. A rate gyro measures a rate — a velocity. If the controller turns that velocity into a push that *opposes* the bending motion, it is acting as an electronic shock absorber, and energy drains out of the mode on every cycle.

That is what "the circle points away from $-1$" means in the time domain. With $R > 0$, the lesson's example gained three times as much damping, $0.005 \to 0.0151$. Flip the sign and the same controller pushes *with* the motion every cycle, like a well-timed push on a swing — and the ringing grows.
:::

::: context slosh Slosh
Carry a full bowl of soup across a room and you learn about **slosh**: the liquid rocks back and forth at its own slow rhythm and pushes on the bowl. Propellant in a rocket tank does the same, and because the tanks are huge, the pushes are large. Tanks carry **baffles** — rings and plates inside the tank — to damp the motion.

Slosh has caused real failures. On the second flight of SpaceX's Falcon 1, in March 2007, sloshing liquid oxygen in the second stage interacted with the control system, and the growing oscillation kept the stage from reaching orbit.
:::

::: context notch-scheduling Scheduling, coming up
**Scheduling** means changing a controller's settings as flight conditions change, using a table looked up against something the computer knows — flight time, propellant mass, dynamic pressure. The last lesson of this module builds a gain schedule for a booster whose mass and aerodynamics change through the burn. A scheduled notch uses the same machinery: its center frequency follows the predicted modal frequency as the tanks drain.
:::

::: context robust-bridge Structured uncertainty, coming later
Classical margins ask "how much can one thing change?" **Robust control** asks "if several specific things are uncertain, each within its own range, is the loop stable for *every* combination?" A residue known only to lie between two values is one such uncertain piece; a modal frequency is another. Tools like **μ-analysis** (read "mu") compute a guarantee over all of them at once. You will meet them in the robust and multivariable control module, and this lesson's sign problem is one of the classic reasons they exist.
:::
