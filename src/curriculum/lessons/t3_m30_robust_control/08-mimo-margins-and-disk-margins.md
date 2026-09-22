---
id: l08-mimo-margins-and-disk-margins
title: MIMO margins and the disk margin
minutes: 22
covers:
  - MIMO stability margins, disk margins, and why per-loop SISO margins mislead
---

"Six decibels of gain margin and sixty degrees of phase margin on every axis" is the sentence that appears in more flight-control review packages than any other, and on a coupled vehicle it is close to meaningless. It is not wrong arithmetic; the numbers are computed correctly from the model. It is the wrong question, asked three times. Classical margins perturb one loop at a time, with the other loops at their nominal values, and they perturb gain *or* phase, never both. A real vehicle perturbs every channel at once, and every perturbation is a gain error and a phase error together.

The disk margin is the replacement. It models the perturbation at a loop-breaking point as a complex multiplicative factor confined to a disk in the complex plane, so gain and phase vary together, and it comes in a multi-loop form that perturbs every channel independently and simultaneously. It produces a single number, $\alpha$, from which an equivalent gain range and phase range are read off, and it reduces to something familiar in its extreme cases. It is now the dominant practice in aerospace stability analysis, and the reason is not fashion: classical margins can be arbitrarily optimistic and the disk margin cannot.

This lesson derives the disk margin from the small gain theorem, gets its gain and phase formulas out of the geometry of a Möbius map, distinguishes the loop-at-a-time from the multi-loop version, and works two vehicles — one mildly coupled, where the classical numbers are only somewhat optimistic, and one gyroscopically coupled, where they are dangerously so.

## What classical margins leave out

Break a single loop at one point, hold every other loop at nominal, and plot the loop gain $L(j\omega)$. The **gain margin** is the factor by which $\lvert L\rvert$ can be scaled before the Nyquist plot passes through $-1$, read where the phase crosses $-180^\circ$. The **phase margin** is the phase lag that can be added before the same thing happens, read where $\lvert L\rvert = 1$. The **delay margin** converts the latter into time: $\tau = \mathrm{PM}_{\mathrm{rad}}/\omega_{gc}$.

Three things are missing.

**Only one perturbation at a time.** Each margin moves the Nyquist plot along one axis only. A perturbation that is simultaneously $3\,\mathrm{dB}$ hot and $30^\circ$ late is not covered by a $6\,\mathrm{dB}$ gain margin or by a $60^\circ$ phase margin, and it is entirely ordinary hardware behaviour.

**Only one loop at a time.** On a coupled vehicle the other loops are not at nominal; they have their own errors, at the same moment. The classical procedure says nothing about that case.

**Infinities that are not real.** A proportional-derivative loop on a double integrator never crosses $-180^\circ$, so its gain margin is reported as infinite. That is true of the nominal model and false of the vehicle: add a few degrees of phase lag from an actuator and a finite gain margin appears. An infinite margin in a report is a sign that the wrong question was asked.

## The disk model

Replace "gain error" and "phase error" by one complex multiplicative factor at the loop-breaking point:

$$f(\delta) = \frac{1 + (1-\sigma)\delta/2}{1 - (1+\sigma)\delta/2}, \qquad \lvert\delta\rvert < \alpha,$$

with $\sigma$ a **skew** parameter and $\alpha$ the size. Take the balanced case $\sigma = 0$ first:

$$f(\delta) = \frac{1 + \delta/2}{1 - \delta/2}.$$

At $\delta = 0$ this is one, the nominal loop. As $\delta$ ranges over the disk of radius $\alpha$, $f$ ranges over another disk — Möbius maps take disks to disks — that is symmetric about the real axis and contains gains and phases together.

To find $\alpha$, pull $\delta$ out as an uncertainty block. Write $f(\delta) = 1 + \delta/(1 - \delta/2)$; introduce $q$ with $q = u_f + \tfrac{1}{2}w_\delta$ and $w_\delta = \delta q$, so the perturbed signal is $y_f = u_f + w_\delta$ and the block sees $z_\delta = q = u_f + \tfrac{1}{2}w_\delta$. Closing the loop with $u_f = -\mathbf{L}y_f$ gives $u_f = -\mathbf{T}w_\delta$, so

$$z_\delta = \left(\tfrac{1}{2}\mathbf{I} - \mathbf{T}\right)w_\delta, \qquad \mathbf{M} = \tfrac{1}{2}\mathbf{I} - \mathbf{T} = \mathbf{S} - \tfrac{1}{2}\mathbf{I},$$

using $\mathbf{S} + \mathbf{T} = \mathbf{I}$. Here $\mathbf{T}$ is the complementary sensitivity *at the break point* — input or output, whichever end the loop was opened. The small gain theorem then gives the answer directly.

::: key Disk margin
The balanced ($\sigma = 0$) disk margin of a loop is

$$\alpha = \frac{1}{\lVert\mathbf{S} - \tfrac{1}{2}\mathbf{I}\rVert_\infty},$$

and the loop is stable for every perturbation $f(\delta)$ with $\lvert\delta\rvert < \alpha$. The equivalent gain and phase ranges are

$$\left[\frac{2-\alpha}{2+\alpha},\ \frac{2+\alpha}{2-\alpha}\right], \qquad \pm\,2\arctan\frac{\alpha}{2},$$

and these hold **simultaneously**: any gain in the range combined with any phase in the range is covered. The multi-loop version perturbs all channels at once — the honest MIMO number.
:::

The gain range is immediate: put $\delta = \pm\alpha$ real into $f$. The phase range takes one more step. The image disk passes through those two real points, so its centre and radius are

$$c = \frac{1}{2}\left(\frac{2-\alpha}{2+\alpha} + \frac{2+\alpha}{2-\alpha}\right) = \frac{4+\alpha^2}{4-\alpha^2}, \qquad R = \frac{1}{2}\left(\frac{2+\alpha}{2-\alpha} - \frac{2-\alpha}{2+\alpha}\right) = \frac{4\alpha}{4-\alpha^2}.$$

The largest phase seen from the origin is $\arcsin(R/c) = \arcsin\!\big(4\alpha/(4+\alpha^2)\big)$, and since $\sin(2\arctan x) = 2x/(1+x^2)$, that equals $2\arctan(\alpha/2)$ exactly. Note $\alpha < 2$ is required for the gain range to make sense: $\alpha = 2$ would mean the loop tolerates infinite gain and $90^\circ$ of phase together.

The skew parameter interpolates between two familiar quantities. With $b = (1+\sigma)/2$ the general block is $\mathbf{M} = b\mathbf{I} - \mathbf{T}$, so $\sigma = 1$ gives $\mathbf{M} = \mathbf{S}$ and $\alpha = 1/\lVert\mathbf{S}\rVert_\infty$ — the peak sensitivity, the reciprocal of the closest approach of the Nyquist plot to $-1$. And $\sigma = -1$ gives $\mathbf{M} = -\mathbf{T}$ and $\alpha = 1/\lVert\mathbf{T}\rVert_\infty$. The balanced disk margin sits between these two classical peaks and is the one to quote.

```python
import numpy as np

w = np.logspace(-3, 3, 200001)
s = 1j * w
J, kp, kd = 120.0, 40.0, 90.0                 # kg m^2, N m/rad, N m s/rad
L = (kd * s + kp) / (J * s**2)
S = 1.0 / (1.0 + L)
alpha = 1.0 / np.abs(S - 0.5).max()           # balanced (skew = 0) disk margin
gmax = (2 + alpha) / (2 - alpha)
print(f"alpha      = {alpha:.4f}")
print(f"gain range = [{1 / gmax:.3f}, {gmax:.3f}]  ({20 * np.log10(gmax):+.2f} dB)")
print(f"phase      = +-{2 * np.degrees(np.arctan(alpha / 2)):.2f} deg")
print(f"peak |S|   = {np.abs(S).max():.4f},  peak |T| = {np.abs(1 - S).max():.4f}")
# alpha      = 1.0894
# gain range = [0.295, 3.393]  (+10.61 dB)
# phase      = +-57.15 deg
# peak |S|   = 1.0124,  peak |T| = 1.3114
```

## Loop-at-a-time and multi-loop

For a vehicle with $m$ inputs there are two distinct MIMO disk margins.

The **loop-at-a-time** margin breaks channel $i$ only, with all other loops closed, and applies the scalar disk model there. The relevant quantity is the $(i,i)$ entry of the sensitivity matrix, and the answer is $\alpha_i = 1/\lVert S_{ii} - \tfrac{1}{2}\rVert_\infty$. This is already better than a classical margin, because it covers gain and phase together and because the other loops are closed rather than opened. It still perturbs one channel at a time.

The **multi-loop** margin applies an independent $\delta_i$ at every channel simultaneously, so the block is $\boldsymbol{\Delta} = \operatorname{diag}(\delta_1, \dots, \delta_m)$ and the exact answer is a structured singular value:

$$\alpha_{\text{mult}} = \frac{1}{\displaystyle\sup_\omega\ \mu_{\boldsymbol{\Delta}}\!\left(\tfrac{1}{2}\mathbf{I} - \mathbf{T}(j\omega)\right)}.$$

Replacing $\mu$ by $\bar{\sigma}$ gives a valid but conservative lower bound on $\alpha_{\text{mult}}$, which is what a small gain analysis would report. For three or fewer channels the $\mathbf{D}$-scaling bound on $\mu$ is exact, so the multi-loop disk margin of a three-axis vehicle is an exactly computable number.

::: example A mildly coupled three-axis spacecraft
Take the module's inertia tensor and close a per-axis proportional-derivative loop designed as though the axes were independent: for each axis, $k_{p,i} = J_{ii}\omega_n^2$ and $k_{d,i} = 2\zeta\omega_nJ_{ii}$ with $\omega_n = 0.577\,\mathrm{rad/s}$ and $\zeta = 0.6495$, giving $k_p = (40,\ 33.3,\ 46.7)\,\mathrm{N\,m/rad}$ and $k_d = (90,\ 75,\ 105)\,\mathrm{N\,m\,s/rad}$.

The classical per-axis report, computed on the decoupled model each gain was designed against: crossover $0.847\,\mathrm{rad/s}$, phase margin $62.3^\circ$, **gain margin infinite**, delay margin $1284\,\mathrm{ms}$. Three identical, excellent-looking lines.

The disk margins tell a more useful story:

| Quantity | $\alpha$ | gain | phase |
| --- | --- | --- | --- |
| decoupled single axis | 1.089 | $\pm 10.61\,\mathrm{dB}$ | $\pm 57.2^\circ$ |
| loop-at-a-time, axis 1 | 1.118 | $\pm 10.97\,\mathrm{dB}$ | $\pm 58.4^\circ$ |
| loop-at-a-time, axis 3 | 1.102 | $\pm 10.76\,\mathrm{dB}$ | $\pm 57.7^\circ$ |
| multi-loop (structured $\mu$) | 1.012 | $\pm 9.68\,\mathrm{dB}$ | $\pm 53.7^\circ$ |

Two things to take from this. First, the infinite gain margin has vanished: once gain and phase are allowed to vary together the honest figure is about $10\,\mathrm{dB}$, not infinity. Second, for *this* vehicle the per-loop numbers are only modestly optimistic — the multi-loop margin is $1.3\,\mathrm{dB}$ and $4.7^\circ$ worse than the loop-at-a-time one, because the products of inertia are only ten to fifteen percent and the relative gain array is within three percent of the identity. That is an honest and reassuring finding, and it is worth having rather than assuming. The unstructured bound gives $\alpha = 1.008$, within half a percent of the structured value, which is what one expects for a nearly diagonal plant.
:::

::: example A momentum-bias spacecraft, where the per-axis claim collapses
Now the gyroscopically coupled vehicle of the directionality lesson: transverse inertia $J_t = 120\,\mathrm{kg\,m^2}$, wheel momentum $h = 50\,\mathrm{N\,m\,s}$, nutation at $h/J_t = 0.4167\,\mathrm{rad/s}$. Close two per-axis proportional-derivative loops designed as though $h$ were zero, with $\omega_n = 0.3\,\mathrm{rad/s}$ and $\zeta = 0.7$: $k_p = 10.8\,\mathrm{N\,m/rad}$, $k_d = 50.4\,\mathrm{N\,m\,s/rad}$.

The per-axis report, on the model the gains were designed against: crossover $0.463\,\mathrm{rad/s}$, phase margin $65.2^\circ$, gain margin infinite, delay margin $2.46\,\mathrm{s}$. The loop-at-a-time disk margin, which already accounts for the other loop being closed, is $\alpha = 1.274$: $\pm 13.1\,\mathrm{dB}$ and $\pm 65.0^\circ$. Everything still looks luxurious.

The multi-loop disk margin is $\alpha = 0.675$, from a peak $\mu$ of $1.482$ at $\omega^* = 0.1397\,\mathrm{rad/s}$:

$$\text{gain } [0.496,\ 2.018] = \pm 6.10\,\mathrm{dB}, \qquad \text{phase } \pm 37.3^\circ .$$

The margin has fallen from $\pm 13.1\,\mathrm{dB}$ to $\pm 6.1\,\mathrm{dB}$ and from $\pm 65^\circ$ to $\pm 37^\circ$ — from comfortable to exactly at the traditional requirement — purely by allowing both channels to be wrong at once.

Better than a number, here is the perturbation. Searching the admissible set at $\omega^*$ for the $\boldsymbol{\Delta}$ that makes $\det(\mathbf{I} - \mathbf{M}\boldsymbol{\Delta})$ vanish gives $\delta_1$ and $\delta_2$ of magnitude $0.675$ at phases $-122.1^\circ$ and $-120.1^\circ$, which translate into multiplicative factors

$$f_1 = 0.716\,\angle\,{-32.8^\circ}\ (-2.90\,\mathrm{dB}), \qquad f_2 = 0.731\,\angle\,{-33.4^\circ}\ (-2.73\,\mathrm{dB}).$$

Apply those two together and $\det(\mathbf{I} + \mathbf{F}\mathbf{L}(j\omega^*))$ is zero to four decimal places: the closed loop has a pole on the imaginary axis at $0.14\,\mathrm{rad/s}$. So a vehicle whose review package reports infinite gain margin and $65^\circ$ of phase margin on both axes goes unstable when both actuators are three decibels weak and thirty-three degrees late — errors so modest that a thermal transient in a hydraulic actuator or a revised sensor filter could produce them, and that no per-axis test would ever flag.

The mechanism is the nutation mode. The gyroscopic term couples the two transverse axes and creates a lightly damped mode at $0.4167\,\mathrm{rad/s}$ that neither per-axis loop was designed to see. A perturbation applied to one channel alone cannot excite it efficiently, because the mode is circularly polarised and needs both channels; apply matched perturbations to both and it is driven directly. That is the general shape of the phenomenon: **per-axis margins are blind to exactly those modes that live in the coupling**, which are usually the modes you most need to worry about.
:::

::: warning An infinite gain margin is a warning sign, not a result
Any loop whose Nyquist plot never crosses the negative real axis reports an infinite gain margin, and every proportional-derivative loop on a rigid body does. The number is an artefact of an idealised model with no actuator lag, no computation delay and no structural dynamics. Add any of them and it becomes finite. When a margin report contains an infinity, compute the disk margin instead, and check the result against a model that includes the actuator.
:::

::: warning Where you break the loop changes the answer
Breaking at the plant input gives $\mathbf{T}_I$; breaking at the plant output gives $\mathbf{T}$. These are different matrices with different norms, and the two disk margins differ, sometimes substantially, on an ill-conditioned plant. The physically meaningful break point is where the uncertainty is: actuator errors at the input, sensor and alignment errors at the output. Report both, and say which is which.
:::

## Check yourself

::: check
A loop has a balanced disk margin of $\alpha = 0.8$. State the gain range, the phase range, and whether a perturbation of $+4\,\mathrm{dB}$ combined with $20^\circ$ of lag is covered.
:::

::: answer
Gain range $[(2-0.8)/(2+0.8),\ (2+0.8)/(2-0.8)] = [0.4286,\ 2.333]$, that is $\pm 7.36\,\mathrm{dB}$. Phase range $\pm 2\arctan(0.4) = \pm 43.6^\circ$. Taken separately, $+4\,\mathrm{dB}$ (a factor $1.585$) and $20^\circ$ are both comfortably inside. Taken together they are also covered, and this is the point of the disk model: the guarantee is for the whole disk, so *any* gain in the range combined with *any* phase in the range is admissible. The corresponding $\delta$ must lie inside the disk of radius $0.8$, and inverting $f$ gives $\delta = 2(f-1)/(f+1)$; with $f = 1.585\angle{-20^\circ} = 1.489 - 0.542j$, $\delta = 2(0.489 - 0.542j)/(2.489 - 0.542j) = 0.466 - 0.334j$, of magnitude $0.573$, comfortably inside the disk of radius $0.8$.
:::

::: check
Explain, from $\mathbf{M} = b\mathbf{I} - \mathbf{T}$, why $\lVert S\rVert_\infty = 2$ corresponds to a poor design.
:::

::: answer
The skew $\sigma = 1$ case has $b = 1$ and $\mathbf{M} = \mathbf{I} - \mathbf{T} = \mathbf{S}$, so $\alpha = 1/\lVert S\rVert_\infty = 0.5$. In that model the perturbation is $f(\delta) = 1/(1-\delta)$, and $\lvert\delta\rvert < 0.5$ is the whole guarantee: the Nyquist plot passes within $0.5$ of the critical point. The balanced margin is bracketed by the same peak, since $\lVert S\rVert_\infty - \tfrac{1}{2} \le \lVert S - \tfrac{1}{2}\mathbf{I}\rVert_\infty \le \lVert S\rVert_\infty + \tfrac{1}{2}$ gives $0.4 \le \alpha \le 0.667$. For a proportional-derivative loop on a double integrator with $\zeta = 0.25$, which has $\lVert S\rVert_\infty = 2.07$, the balanced margin comes out at $\alpha = 0.485$: a gain range of $\pm 4.30\,\mathrm{dB}$ and a phase range of $\pm 27.3^\circ$, below the traditional $6\,\mathrm{dB}$ and $30^\circ$ requirements. This is the reason $\lVert S\rVert_\infty \le 2$ appears as a specification so often: it is the point at which margins become unacceptable, which is also why the performance weight's parameter $M$ is rarely set above $2$.
:::

::: check
On the momentum-bias vehicle the loop-at-a-time margin was $\pm 13.1\,\mathrm{dB}$ and the multi-loop margin $\pm 6.1\,\mathrm{dB}$. A colleague proposes reporting the average. What is wrong with that, and what should be reported?
:::

::: answer
An average of two margins is not a margin: there is no perturbation set for which it is the guarantee. The multi-loop figure is the one that bounds what the vehicle can survive when both actuators are wrong at once, which is the case that happens, so it is the number that belongs in the requirement verification. The loop-at-a-time figures are still worth reporting as diagnostics, because a large gap between them and the multi-loop number is itself information — it says the coupling is doing the damage and points the redesign at the coupling rather than at the individual loops. The right report is: multi-loop disk margin with its frequency, loop-at-a-time margins per channel, the break point used, and the destabilising perturbation if the multi-loop number is marginal.
:::

::: check
Why does the multi-loop disk margin require $\mu$ rather than the H-infinity norm, and when is the difference small?
:::

::: answer
The multi-loop perturbation is $\boldsymbol{\Delta} = \operatorname{diag}(\delta_1, \dots, \delta_m)$, a structured set: each channel gets its own complex perturbation and no cross-channel terms are allowed. The H-infinity norm of $\tfrac{1}{2}\mathbf{I} - \mathbf{T}$ answers for a full complex block, which admits cross-channel perturbations the hardware cannot produce, so it understates $\alpha$. The difference is small when the matrix $\tfrac{1}{2}\mathbf{I} - \mathbf{T}$ is close to diagonal, which happens when the loops are nearly decoupled — on the mildly coupled three-axis spacecraft the two numbers were $1.012$ and $1.008$, half a percent apart. It is large when the off-diagonal entries dominate, which is the coupled case, which is exactly when you needed the analysis. So: use $\bar{\sigma}$ for a quick conservative check, and $\mu$ for the number that goes in the report.
:::

::: check
A design report gives $\lVert S\rVert_\infty = 1.4$ and $\lVert T\rVert_\infty = 1.9$ and nothing else. Bracket the balanced disk margin from those two numbers alone, and say which of the two peaks is binding.
:::

::: answer
Use $\mathbf{S} - \tfrac{1}{2}\mathbf{I} = \tfrac{1}{2}(\mathbf{S} - \mathbf{T})$. The triangle inequality gives $\lVert\mathbf{S} - \tfrac{1}{2}\mathbf{I}\rVert_\infty \le (\lVert S\rVert_\infty + \lVert T\rVert_\infty)/2 = 1.65$, so $\alpha \ge 1/1.65 = 0.606$. The reverse triangle inequality applied to $\mathbf{S} - \tfrac{1}{2}\mathbf{I}$ and to $\tfrac{1}{2}\mathbf{I} - \mathbf{T}$ gives $\lVert\mathbf{S} - \tfrac{1}{2}\mathbf{I}\rVert_\infty \ge \max(\lVert S\rVert_\infty - \tfrac{1}{2},\ \lVert T\rVert_\infty - \tfrac{1}{2}) = 1.4$, so $\alpha \le 0.714$. The bracket is $\alpha\in[0.606,\ 0.714]$, that is a gain range between $\pm 5.43$ and $\pm 6.49\,\mathrm{dB}$ and a phase range between $\pm 33.7^\circ$ and $\pm 39.3^\circ$. The upper bound came from $\lVert T\rVert_\infty$, so the complementary sensitivity peak is the binding one — the loop is closer to trouble under a perturbation that scales the loop gain up than under one that scales it down, and the design effort belongs on damping the closed-loop peak rather than on low-frequency rejection. Note also how tight the bracket is: two scalar peaks pin the disk margin to within a decibel without computing it.
:::

## Summary

| Item | Statement |
| --- | --- |
| Classical margins | one loop at a time, gain or phase but not both, on a frozen nominal model |
| Disk model | $f(\delta) = (1 + (1-\sigma)\delta/2)/(1 - (1+\sigma)\delta/2)$, $\lvert\delta\rvert < \alpha$; $\sigma = 0$ is balanced |
| Block seen | $\mathbf{M} = b\mathbf{I} - \mathbf{T}$ with $b = (1+\sigma)/2$; balanced: $\mathbf{M} = \mathbf{S} - \tfrac{1}{2}\mathbf{I}$ |
| Disk margin | $\alpha = 1/\lVert\mathbf{S} - \tfrac{1}{2}\mathbf{I}\rVert_\infty$ |
| Equivalent ranges | gain $[(2-\alpha)/(2+\alpha),\ (2+\alpha)/(2-\alpha)]$, phase $\pm 2\arctan(\alpha/2)$, simultaneously |
| Skew extremes | $\sigma = 1$: $\alpha = 1/\lVert\mathbf{S}\rVert_\infty$; $\sigma = -1$: $\alpha = 1/\lVert\mathbf{T}\rVert_\infty$ |
| Loop-at-a-time | break channel $i$ with others closed: $\alpha_i = 1/\lVert S_{ii} - \tfrac{1}{2}\rVert_\infty$ |
| Multi-loop | $\alpha = 1/\sup_\omega\mu_{\boldsymbol{\Delta}}(\tfrac{1}{2}\mathbf{I} - \mathbf{T})$, $\boldsymbol{\Delta}$ diagonal complex; exact for three or fewer channels |
| Mildly coupled example | per-axis PM $62.3^\circ$ and infinite GM; multi-loop $\alpha = 1.012$, $\pm 9.68\,\mathrm{dB}$, $\pm 53.7^\circ$ |
| Momentum-bias example | per-axis PM $65.2^\circ$, loop-at-a-time $\pm 13.1\,\mathrm{dB}$; multi-loop $\pm 6.10\,\mathrm{dB}$, $\pm 37.3^\circ$ |
| Destabilising pair | $0.716\angle{-32.8^\circ}$ and $0.731\angle{-33.4^\circ}$ applied together put a pole at $0.14\,\mathrm{rad/s}$ |

The next lesson turns from what the controller does to what no controller can do: the bandwidth and sensitivity limits imposed by right-half-plane poles and zeros.
