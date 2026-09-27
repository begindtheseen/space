---
id: l08-mimo-margins-and-disk-margins
title: MIMO margins and the disk margin
minutes: 23
covers:
  - MIMO stability margins, disk margins, and why per-loop SISO margins mislead
---

Picture a ladder with a safety label. The maker tested it two ways. Standing straight up, it held a very heavy person. Leaning at a steep angle, with nobody on it, it did not slip. Both tests passed. But nobody tested a heavy person on a leaning ladder — and that is exactly how people actually use ladders.

Classical stability margins test a control loop the same way. "Six decibels of gain margin and sixty degrees of phase margin on every axis" appears in more flight-control review packages than any other sentence. On a coupled vehicle it is close to meaningless. The arithmetic is not wrong; the numbers come straight from the model. It is the wrong question, asked three times. Classical margins change one loop at a time, with the others held at their nominal values. They change the gain *or* the phase, never both. And they do it at one frozen flight condition. A real vehicle gets every channel wrong at once, and every error is a gain error and a phase error together.

The **disk margin** is the replacement. It treats the error at a loop-breaking point as one complex factor that lives inside a disk, so gain and phase vary together. It comes in a multi-loop form that perturbs every channel at the same time. It produces one number, $\alpha$ ("alpha"), from which a gain range and a phase range are read off. It is now the dominant practice in aerospace stability analysis, and not because of fashion: classical margins can be as optimistic as you like, and the disk margin cannot.

## What classical margins leave out

Here is the classical procedure. **[[Break the loop|loop-breaking]]** at one point, hold every other loop at nominal, and plot the loop gain $L(j\omega)$ in the complex plane — the Nyquist plot. The loop goes unstable when that plot passes through the critical point $-1$.

- The **gain margin** is the factor by which $\lvert L\rvert$ can grow before the plot hits $-1$. It is read where the phase crosses $-180^\circ$.
- The **phase margin** (PM) is the extra phase lag that can be added before the same thing happens. It is read at the gain crossover frequency $\omega_{gc}$, where $\lvert L\rvert = 1$.
- The **[[delay margin|delay-margin]]** turns the phase margin into time: $\tau = \mathrm{PM}_{\mathrm{rad}}/\omega_{gc}$, the phase margin in radians divided by the crossover frequency.

Three things are missing.

**Only one kind of error at a time.** Each margin moves the Nyquist plot in one way only. An actuator that is $3\,\mathrm{dB}$ too strong *and* $30^\circ$ late is not covered by a $6\,\mathrm{dB}$ gain margin or by a $60^\circ$ phase margin. Yet it is completely ordinary hardware behavior.

**Only one loop at a time.** On a coupled vehicle the other loops are not at nominal. They have their own errors, at the same moment. The classical procedure says nothing about that case.

**[[Infinities that are not real|infinite-gain-margin]].** A proportional-derivative loop on a double integrator never crosses $-180^\circ$, so its gain margin is reported as infinite. That is true of the nominal model and false of the vehicle. Add a few degrees of lag from an actuator and a finite gain margin appears. An infinite margin in a report is a sign that the wrong question was asked.

Two more gaps sit outside the linear model altogether. Margins are computed at **[[one frozen flight condition|frozen-envelope]]**, while the vehicle flies through a whole envelope. And the analysis is linear, while real hardware saturates, rate-limits, sloshes, and carries structural modes whose frequencies move as propellant drains. A disk margin fixes the first three gaps. For the last two you need margins swept across the envelope and Monte Carlo runs on a nonlinear simulation.

## The disk model

Replace "gain error" and "phase error" with one complex factor $f$ that multiplies the signal at the loop-breaking point:

$$f(\delta) = \frac{1 + (1-\sigma)\delta/2}{1 - (1+\sigma)\delta/2}, \qquad \lvert\delta\rvert < \alpha.$$

Here $\delta$ ("delta") is a complex number that stands for the error, $\alpha$ is how big it may be, and $\sigma$ is a **[[skew|skew]]** parameter that tilts the disk toward gain increase or gain decrease. (This $\sigma$ is not a singular value — it is a single tuning number, usually zero.) Take the **balanced** case $\sigma = 0$ first:

$$f(\delta) = \frac{1 + \delta/2}{1 - \delta/2}.$$

At $\delta = 0$ this is $1$: the nominal loop, no error. As $\delta$ ranges over the disk of radius $\alpha$, $f$ ranges over another disk. That is a property of this kind of fraction, a **[[Möbius map|mobius]]**: it always takes disks to disks. The image disk is symmetric about the real axis, and every point in it is a gain *and* a phase together.

### Finding α with the small gain theorem

To find the largest safe $\alpha$, pull $\delta$ out of the loop as an uncertainty block, as in the **[[small gain theorem|small-gain-bridge]]** lesson.

**Step 1: rewrite $f$.** $f(\delta) = 1 + \delta/(1 - \delta/2)$. Check: $1 + \frac{\delta}{1 - \delta/2} = \frac{1 - \delta/2 + \delta}{1 - \delta/2} = \frac{1 + \delta/2}{1 - \delta/2}$.

**Step 2: name the signals.** Let $u_f$ enter the perturbation and $y_f$ leave it. Introduce $q$ with $q = u_f + \tfrac{1}{2}w_\delta$ and $w_\delta = \delta q$. Then the perturbed signal is $y_f = u_f + w_\delta$, and the block $\delta$ sees $z_\delta = q = u_f + \tfrac{1}{2}w_\delta$.

**Step 3: close the loop.** The rest of the loop gives $u_f = -\mathbf{L}y_f = -\mathbf{L}(u_f + w_\delta)$. So $(\mathbf{I} + \mathbf{L})u_f = -\mathbf{L}w_\delta$, and $u_f = -\mathbf{T}w_\delta$, where $\mathbf{T} = (\mathbf{I} + \mathbf{L})^{-1}\mathbf{L}$ is the complementary sensitivity.

**Step 4: read off the block.** Substitute into $z_\delta$:

$$z_\delta = \left(\tfrac{1}{2}\mathbf{I} - \mathbf{T}\right)w_\delta, \qquad \mathbf{M} = \tfrac{1}{2}\mathbf{I} - \mathbf{T} = \mathbf{S} - \tfrac{1}{2}\mathbf{I},$$

using $\mathbf{S} + \mathbf{T} = \mathbf{I}$. Here $\mathbf{T}$ and $\mathbf{S}$ are taken *at the break point* — the plant input or the plant output, whichever end you opened.

The small gain theorem now says: the loop is stable for every $\lvert\delta\rvert < \alpha$ exactly when $\alpha\lVert\mathbf{M}\rVert_\infty \le 1$.

::: key Disk margin
The largest disk of simultaneous complex gain-and-phase perturbation tolerable at a loop-breaking point. The balanced ($\sigma = 0$) disk margin of a loop is

$$\alpha = \frac{1}{\lVert\mathbf{S} - \tfrac{1}{2}\mathbf{I}\rVert_\infty},$$

and the loop is stable for every perturbation $f(\delta)$ with $\lvert\delta\rvert < \alpha$. It is reported as an equivalent gain range and phase range,

$$\left[\frac{2-\alpha}{2+\alpha},\ \frac{2+\alpha}{2-\alpha}\right], \qquad \pm\,2\arctan\frac{\alpha}{2},$$

and the guarantee covers gain and phase **simultaneously**: every factor inside the disk — a gain error and a phase error at once — is survivable. The multi-loop version perturbs all channels at once — the honest MIMO number.
:::

The gain range comes from putting real values $\delta = \pm\alpha$ into $f$. For example, $\delta = +\alpha$ gives $(1 + \alpha/2)/(1 - \alpha/2) = (2 + \alpha)/(2 - \alpha)$. Note that $\alpha < 2$ is needed for this to make sense: $\alpha = 2$ would mean the loop tolerates infinite gain and $90^\circ$ of phase.

Read the two ranges carefully. They are the *edges* of the disk: the gain range is the disk's pure-gain errors, and the phase range is its pure-phase errors. Combinations of a gain error and a phase error are covered when the combined factor lies inside the disk — which is a lot of combinations, but not the extreme corner of "full gain error *and* full phase error". To test a particular combination, invert $f$ and check that $\lvert\delta\rvert < \alpha$.

::: note Why the phase range has to be ±2 arctan(α/2)
The image disk crosses the real axis at the two ends of the gain range. So its center $c$ is their average and its radius $R$ is half their difference:

$$c = \frac{1}{2}\left(\frac{2-\alpha}{2+\alpha} + \frac{2+\alpha}{2-\alpha}\right) = \frac{4+\alpha^2}{4-\alpha^2}, \qquad R = \frac{1}{2}\left(\frac{2+\alpha}{2-\alpha} - \frac{2-\alpha}{2+\alpha}\right) = \frac{4\alpha}{4-\alpha^2}.$$

The biggest phase any point of the disk can have is where a line from the origin barely touches the disk. That touching line, the radius to the touching point, and the line to the center make a right triangle, so the angle is $\arcsin(R/c) = \arcsin\!\big(4\alpha/(4+\alpha^2)\big)$. Now use the identity $\sin(2\arctan x) = 2x/(1+x^2)$ with $x = \alpha/2$: $2(\alpha/2)/(1 + \alpha^2/4) = 4\alpha/(4 + \alpha^2)$. The two match, so the phase limit is exactly $2\arctan(\alpha/2)$.
:::

### The skew and the two classical peaks

The skew parameter connects the disk margin to two numbers you already know. With $b = (1+\sigma)/2$, the general block is $\mathbf{M} = b\mathbf{I} - \mathbf{T}$.

- $\sigma = 1$ gives $b = 1$, $\mathbf{M} = \mathbf{I} - \mathbf{T} = \mathbf{S}$, and $\alpha = 1/\lVert\mathbf{S}\rVert_\infty$. That is one over the peak sensitivity — the closest approach of the Nyquist plot to $-1$.
- $\sigma = -1$ gives $b = 0$, $\mathbf{M} = -\mathbf{T}$, and $\alpha = 1/\lVert\mathbf{T}\rVert_\infty$.

The balanced disk margin sits between these two classical peaks, and it is the one to quote.

::: example One spacecraft axis, three ways
A single axis with $J = 120\,\mathrm{kg\,m^2}$ and a proportional-derivative controller, $k_p = 40\,\mathrm{N\,m/rad}$ and $k_d = 90\,\mathrm{N\,m\,s/rad}$. The loop is $L(s) = (k_ds + k_p)/(Js^2)$.

**Classical margins.** Gain crossover is where $\lvert L(j\omega)\rvert = 1$, that is $\sqrt{k_p^2 + (k_d\omega)^2} = J\omega^2$. Solving gives $\omega_{gc} = 0.847\,\mathrm{rad/s}$. The phase margin is $\arctan(k_d\omega_{gc}/k_p) = \arctan(76.2/40) = 62.3^\circ$. The delay margin is $62.3^\circ = 1.088\,\mathrm{rad}$, divided by $0.847\,\mathrm{rad/s}$, which is $1.284\,\mathrm{s}$. The gain margin is infinite.

**Disk margin.** Compute $\lVert S - \tfrac{1}{2}\rVert_\infty$ on a fine frequency grid (code below): $\alpha = 1.0894$. Then

$$\frac{2 + 1.0894}{2 - 1.0894} = \frac{3.0894}{0.9106} = 3.393 = +10.61\,\mathrm{dB}, \qquad 2\arctan\frac{1.0894}{2} = 2\times 28.58^\circ = 57.15^\circ.$$

So the honest statement is a **[[disk|disk-picture]]** reaching $\pm 10.6\,\mathrm{dB}$ in gain and $\pm 57.2^\circ$ in phase, with every combination inside it covered. The phase figure is a little below the classical $62.3^\circ$, as it must be: one disk has to fit inside the whole region of safe gain-and-phase errors, so it can never claim more than the one-at-a-time margins. And the "infinite" gain margin has become a finite, believable $10.6\,\mathrm{dB}$.

**Sanity check with the peaks.** $\lVert S\rVert_\infty = 1.012$ and $\lVert T\rVert_\infty = 1.311$. The balanced $\alpha$ must be at most $1/(1.311 - 0.5) = 1.23$ and at least $1/((1.012 + 1.311)/2) = 0.861$; $1.089$ sits inside.
:::

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

A vehicle with $m$ inputs has two different MIMO disk margins.

The **loop-at-a-time** margin breaks channel $i$ only, with all the other loops closed, and applies the scalar disk model there. The quantity that matters is the $(i,i)$ entry of the sensitivity matrix — row $i$, column $i$ — and the answer is $\alpha_i = 1/\lVert S_{ii} - \tfrac{1}{2}\rVert_\infty$. This already beats a classical margin, because it covers gain and phase together and keeps the other loops closed. It still perturbs one channel at a time.

The **multi-loop** margin applies its own $\delta_i$ at every channel at the same time. The block is $\boldsymbol{\Delta} = \operatorname{diag}(\delta_1, \dots, \delta_m)$ — each channel gets its own error, and there are no cross-channel terms. The exact answer is a **structured singular value** $\mu$ ("mu"), from the $\mu$ lesson:

$$\alpha_{\text{mult}} = \frac{1}{\displaystyle\sup_\omega\ \mu_{\boldsymbol{\Delta}}\!\left(\tfrac{1}{2}\mathbf{I} - \mathbf{T}(j\omega)\right)}.$$

Using $\bar{\sigma}$ in place of $\mu$ gives a safe but pessimistic lower bound on $\alpha_{\text{mult}}$ — what a plain small gain analysis would report. For **[[three or fewer channels|mu-exact]]**, the $\mathbf{D}$-scaling upper bound on $\mu$ is exact. So the multi-loop disk margin of a three-axis vehicle is an exactly computable number.

::: example A mildly coupled three-axis spacecraft
Take the module's inertia tensor from the last lesson. Close a per-axis proportional-derivative loop designed as though the axes were independent. For each axis, $k_{p,i} = J_{ii}\omega_n^2$ and $k_{d,i} = 2\zeta\omega_nJ_{ii}$, with $\omega_n = 1/\sqrt{3} = 0.577\,\mathrm{rad/s}$ and $\zeta = 0.6495$. That gives $k_p = (40,\ 33.3,\ 46.7)\,\mathrm{N\,m/rad}$ and $k_d = (90,\ 75,\ 105)\,\mathrm{N\,m\,s/rad}$.

**The classical per-axis report**, on the decoupled model each gain was designed against: crossover $0.847\,\mathrm{rad/s}$, phase margin $62.3^\circ$, **gain margin infinite**, delay margin $1284\,\mathrm{ms}$. Three identical, excellent-looking lines — every axis is the single axis from the first example, scaled.

**The disk margins** tell a more useful story:

| Quantity | $\alpha$ | gain | phase |
| --- | --- | --- | --- |
| decoupled single axis | 1.089 | $\pm 10.61\,\mathrm{dB}$ | $\pm 57.2^\circ$ |
| loop-at-a-time, axis 1 | 1.118 | $\pm 10.97\,\mathrm{dB}$ | $\pm 58.4^\circ$ |
| loop-at-a-time, axis 3 | 1.102 | $\pm 10.76\,\mathrm{dB}$ | $\pm 57.7^\circ$ |
| multi-loop (structured $\mu$) | 1.012 | $\pm 9.68\,\mathrm{dB}$ | $\pm 53.7^\circ$ |

Two lessons here. First, the infinite gain margin is gone: once gain and phase may vary together, the honest figure is about $10\,\mathrm{dB}$, not infinity. Second, for *this* vehicle the per-loop numbers are only a little optimistic. The multi-loop margin is $10.97 - 9.68 = 1.3\,\mathrm{dB}$ and $58.4 - 53.7 = 4.7^\circ$ worse than the loop-at-a-time one. That fits the last lesson: the products of inertia are only ten to fifteen percent, and the relative gain array is within three percent of the identity. It is an honest, reassuring finding — worth having rather than assuming.

The unstructured bound (using $\bar{\sigma}$) gives $\alpha = 1.008$, within half a percent of the structured value. That is what you expect for a nearly diagonal plant.
:::

::: example A momentum-bias spacecraft, where the per-axis claim collapses
Now the gyroscopically coupled vehicle of the last lesson: transverse inertia $J_t = 120\,\mathrm{kg\,m^2}$, wheel momentum $h = 50\,\mathrm{N\,m\,s}$, nutation at $h/J_t = 0.4167\,\mathrm{rad/s}$. Close two per-axis proportional-derivative loops designed as though $h$ were zero, with $\omega_n = 0.3\,\mathrm{rad/s}$ and $\zeta = 0.7$:

$$k_p = J_t\omega_n^2 = 120\times 0.09 = 10.8\,\mathrm{N\,m/rad}, \qquad k_d = 2\zeta\omega_nJ_t = 2\times 0.7\times 0.3\times 120 = 50.4\,\mathrm{N\,m\,s/rad}.$$

**The per-axis report**, on the model the gains were designed against: crossover $0.463\,\mathrm{rad/s}$, phase margin $65.2^\circ$, gain margin infinite, delay margin $2.46\,\mathrm{s}$.

**Loop-at-a-time disk margin**, which already accounts for the other loop being closed: $\alpha = 1.274$, that is $\pm 13.1\,\mathrm{dB}$ and $\pm 65.0^\circ$. Everything still looks luxurious.

**Multi-loop disk margin:** the peak $\mu$ is $1.482$ at $\omega^* = 0.1397\,\mathrm{rad/s}$, so $\alpha = 1/1.482 = 0.675$, and

$$\text{gain } [0.496,\ 2.018] = \pm 6.10\,\mathrm{dB}, \qquad \text{phase } \pm 37.3^\circ .$$

The margin has fallen from $\pm 13.1\,\mathrm{dB}$ to $\pm 6.1\,\mathrm{dB}$, and from $\pm 65^\circ$ to $\pm 37^\circ$ — from comfortable to right at the traditional requirement — only by letting both channels be wrong at once.

**The perturbation itself.** Better than a number is the error that breaks the loop. Search the disk at $\omega^*$ for the $\boldsymbol{\Delta}$ that makes $\det(\mathbf{I} - \mathbf{M}\boldsymbol{\Delta}) = 0$. Both $\delta_1$ and $\delta_2$ come out with size $0.675$ and phase $-121.1^\circ$. Through $f$, that is the **[[same factor on both channels|destabilizing-pair]]**:

$$f_1 = f_2 = 0.723\,\angle\,{-33.1^\circ}\quad(-2.81\,\mathrm{dB}).$$

Apply that to both actuators and $\det(\mathbf{I} + \mathbf{F}\mathbf{L}(j\omega^*))$ is zero: the closed loop has a pole on the imaginary axis at $0.14\,\mathrm{rad/s}$, where it will oscillate forever. So a vehicle whose review package reports infinite gain margin and $65^\circ$ of phase margin on both axes goes unstable when both actuators are about three decibels weak and thirty-three degrees late. Those are modest errors — a slower wheel-drive loop or an added sensor filter could produce them — and no per-axis test would ever flag them.

**The mechanism is the nutation mode.** The gyroscopic term couples the two transverse axes and creates a lightly damped mode that neither per-axis loop was designed to see. An error on one channel alone cannot excite it well, because the mode rotates and needs both channels, a quarter-period apart. Matched errors on both channels drive it directly. That is the general shape of the problem: **per-axis margins are blind to exactly those modes that live in the coupling**, and those are usually the modes you most need to worry about.
:::

::: warning An infinite gain margin is a warning sign, not a result
Any loop whose Nyquist plot never crosses the negative real axis reports an infinite gain margin, and every proportional-derivative loop on a rigid body does. The number comes from an idealized model with no actuator lag, no computation delay and no structural dynamics. Add any of them and it becomes finite. When a margin report contains an infinity, compute the disk margin instead, and check it against a model that includes the actuator.
:::

::: warning Where you break the loop changes the answer
Breaking at the plant input gives the input complementary sensitivity $\mathbf{T}_I$. Breaking at the plant output gives $\mathbf{T}$. These are different matrices with different norms, and on an ill-conditioned plant the two disk margins can differ a lot. The meaningful break point is where the uncertainty lives: actuator errors at the input, sensor and alignment errors at the output. Report both, and say which is which.
:::

## Check yourself

::: check
A loop has a balanced disk margin of $\alpha = 0.8$. State the gain range, the phase range, and whether $+4\,\mathrm{dB}$ of gain error combined with $20^\circ$ of lag is covered.
:::

::: answer
Gain range: $[(2-0.8)/(2+0.8),\ (2+0.8)/(2-0.8)] = [1.2/2.8,\ 2.8/1.2] = [0.4286,\ 2.333]$. In decibels, $20\log_{10}2.333 = 7.36$, so $\pm 7.36\,\mathrm{dB}$.

Phase range: $\pm 2\arctan(0.4) = \pm 2\times 21.8^\circ = \pm 43.6^\circ$.

Taken one at a time, $+4\,\mathrm{dB}$ (a factor of $10^{4/20} = 1.585$) and $20^\circ$ are both well inside. Taken together, they are covered only if the combined factor lies inside the disk — being inside both ranges separately is not enough.

So check it. Invert $f$: $\delta = 2(f-1)/(f+1)$. With $f = 1.585\angle{-20^\circ} = 1.489 - 0.542j$,

$$\delta = \frac{2(0.489 - 0.542j)}{2.489 - 0.542j} = 0.466 - 0.334j,$$

of size $\sqrt{0.466^2 + 0.334^2} = 0.573$. That is less than $0.8$, so the combined error is inside the disk and the loop survives it.
:::

::: check
Explain, from $\mathbf{M} = b\mathbf{I} - \mathbf{T}$, why $\lVert S\rVert_\infty = 2$ goes with a poor design.
:::

::: answer
The skew $\sigma = 1$ case has $b = 1$ and $\mathbf{M} = \mathbf{I} - \mathbf{T} = \mathbf{S}$, so $\alpha = 1/\lVert S\rVert_\infty = 0.5$. In that model the perturbation is $f(\delta) = 1/(1-\delta)$, and $\lvert\delta\rvert < 0.5$ is the whole guarantee: the Nyquist plot passes within $0.5$ of the critical point.

The balanced margin is pinned by the same peak. Since $\lVert S\rVert_\infty - \tfrac{1}{2} \le \lVert S - \tfrac{1}{2}\mathbf{I}\rVert_\infty \le \lVert S\rVert_\infty + \tfrac{1}{2}$, we get $1/2.5 \le \alpha \le 1/1.5$, that is $0.4 \le \alpha \le 0.667$.

A concrete case: a proportional-derivative loop on a double integrator with $\zeta = 0.25$ has $\lVert S\rVert_\infty = 2.07$ and a balanced margin of $\alpha = 0.485$. That is a gain range of $\pm 4.30\,\mathrm{dB}$ and a phase range of $\pm 27.3^\circ$ — below the traditional $6\,\mathrm{dB}$ and $30^\circ$ requirements.

This is why $\lVert S\rVert_\infty \le 2$ shows up as a specification so often. It is roughly where margins become unacceptable, and it is also why the performance weight's peak allowance $M$ is rarely set above $2$.
:::

::: check
On the momentum-bias vehicle the loop-at-a-time margin was $\pm 13.1\,\mathrm{dB}$ and the multi-loop margin $\pm 6.1\,\mathrm{dB}$. A colleague proposes reporting the average. What is wrong with that, and what should be reported?
:::

::: answer
An average of two margins is not a margin. There is no set of errors for which it is the guarantee.

The multi-loop figure bounds what the vehicle can survive when both actuators are wrong at once, which is what really happens. So it is the number that belongs in the requirement verification.

The loop-at-a-time figures are still worth reporting as diagnostics. A big gap between them and the multi-loop number is itself information: it says the coupling is doing the damage, and it points the redesign at the coupling rather than at the individual loops.

The right report: the multi-loop disk margin with its frequency, the loop-at-a-time margins per channel, the break point used, and the destabilizing perturbation if the multi-loop number is close to the limit.
:::

::: check
Why does the multi-loop disk margin need $\mu$ rather than the H-infinity norm, and when is the difference small?
:::

::: answer
The multi-loop error is $\boldsymbol{\Delta} = \operatorname{diag}(\delta_1, \dots, \delta_m)$, a structured set: each channel gets its own complex error, and there are no cross-channel terms. The H-infinity norm of $\tfrac{1}{2}\mathbf{I} - \mathbf{T}$ answers for a *full* complex block. That block allows cross-channel errors the hardware cannot produce, so it understates $\alpha$.

The difference is small when $\tfrac{1}{2}\mathbf{I} - \mathbf{T}$ is close to diagonal, which happens when the loops are nearly decoupled. On the mildly coupled three-axis spacecraft the two numbers were $1.012$ and $1.008$, half a percent apart. It is large when the off-diagonal entries dominate — the coupled case, which is exactly when you needed the analysis.

So: use $\bar{\sigma}$ for a quick, safe check, and $\mu$ for the number that goes in the report.
:::

::: check
A design report gives $\lVert S\rVert_\infty = 1.4$ and $\lVert T\rVert_\infty = 1.9$ and nothing else. Bracket the balanced disk margin from those two numbers alone, and say which peak is binding.
:::

::: answer
Start from $\mathbf{S} - \tfrac{1}{2}\mathbf{I} = \tfrac{1}{2}(\mathbf{S} - \mathbf{T})$, which follows from $\mathbf{S} + \mathbf{T} = \mathbf{I}$.

**Lower bound on $\alpha$.** The triangle inequality gives $\lVert\mathbf{S} - \tfrac{1}{2}\mathbf{I}\rVert_\infty \le (\lVert S\rVert_\infty + \lVert T\rVert_\infty)/2 = (1.4 + 1.9)/2 = 1.65$. So $\alpha \ge 1/1.65 = 0.606$.

**Upper bound on $\alpha$.** The reverse triangle inequality, applied to $\mathbf{S} - \tfrac{1}{2}\mathbf{I}$ and to $\tfrac{1}{2}\mathbf{I} - \mathbf{T}$ (the same matrix up to sign), gives $\lVert\mathbf{S} - \tfrac{1}{2}\mathbf{I}\rVert_\infty \ge \max(1.4 - 0.5,\ 1.9 - 0.5) = 1.4$. So $\alpha \le 1/1.4 = 0.714$.

The bracket is $0.606 \le \alpha \le 0.714$: a gain range between $\pm 5.43$ and $\pm 6.49\,\mathrm{dB}$, and a phase range between $\pm 33.7^\circ$ and $\pm 39.3^\circ$.

The upper bound came from $\lVert T\rVert_\infty$, so the complementary sensitivity peak — a lightly damped closed-loop resonance — is the binding one. The design effort belongs on damping that closed-loop peak rather than on low-frequency rejection. Note how tight the bracket is: two scalar peaks pin the disk margin to within about a decibel without computing it.
:::

## Summary

| Item | Statement |
| --- | --- |
| Classical margins | one loop at a time, gain or phase but not both, on a frozen nominal model |
| Delay margin | $\tau = \mathrm{PM}_{\mathrm{rad}}/\omega_{gc}$ |
| Disk model | $f(\delta) = (1 + (1-\sigma)\delta/2)/(1 - (1+\sigma)\delta/2)$, $\lvert\delta\rvert < \alpha$; $\sigma = 0$ is balanced |
| Block seen | $\mathbf{M} = b\mathbf{I} - \mathbf{T}$ with $b = (1+\sigma)/2$; balanced: $\mathbf{M} = \mathbf{S} - \tfrac{1}{2}\mathbf{I}$ |
| Disk margin | $\alpha = 1/\lVert\mathbf{S} - \tfrac{1}{2}\mathbf{I}\rVert_\infty$ |
| Equivalent ranges | gain $[(2-\alpha)/(2+\alpha),\ (2+\alpha)/(2-\alpha)]$, phase $\pm 2\arctan(\alpha/2)$; every combined factor inside the disk is covered |
| Skew extremes | $\sigma = 1$: $\alpha = 1/\lVert\mathbf{S}\rVert_\infty$; $\sigma = -1$: $\alpha = 1/\lVert\mathbf{T}\rVert_\infty$ |
| Loop-at-a-time | break channel $i$ with others closed: $\alpha_i = 1/\lVert S_{ii} - \tfrac{1}{2}\rVert_\infty$ |
| Multi-loop | $\alpha = 1/\sup_\omega\mu_{\boldsymbol{\Delta}}(\tfrac{1}{2}\mathbf{I} - \mathbf{T})$, $\boldsymbol{\Delta}$ diagonal complex; exact for three or fewer channels |
| Mildly coupled example | per-axis PM $62.3^\circ$ and infinite GM; multi-loop $\alpha = 1.012$, $\pm 9.68\,\mathrm{dB}$, $\pm 53.7^\circ$ |
| Momentum-bias example | per-axis PM $65.2^\circ$, loop-at-a-time $\pm 13.1\,\mathrm{dB}$; multi-loop $\pm 6.10\,\mathrm{dB}$, $\pm 37.3^\circ$ |
| Destabilizing pair | $0.723\angle{-33.1^\circ}$ on both channels together puts a pole at $0.14\,\mathrm{rad/s}$ |

The next lesson turns from what the controller does to what no controller can do: the bandwidth and sensitivity limits set by right-half-plane poles and zeros.

::: context loop-breaking Breaking the loop
To measure a margin you imagine cutting the loop at one wire — say, the command going into one actuator — and asking what goes around the loop and comes back to the cut. That round trip is the loop gain. Where you cut matters: at the actuators you see actuator errors; at the sensors you see sensor errors. On a multi-axis vehicle there is one wire per channel, so "the" loop gain is really a matrix.
:::

::: context delay-margin Why delay eats phase
A pure time delay $\tau$ does not change a sine wave's size. It only shifts it later, by $\omega\tau$ radians of phase — more phase at higher frequency. At crossover, the loop can afford $\mathrm{PM}$ radians before it goes unstable, so the largest safe delay is $\mathrm{PM}_{\mathrm{rad}}/\omega_{gc}$. For the example axis, $1.088/0.847 = 1.28\,\mathrm{s}$. Delay is the margin that sensor filters and flight-computer timing quietly use up, and the one people forget to check.
:::

::: context infinite-gain-margin Why a PD loop never reaches −180°
For $L(s) = (k_ds + k_p)/(Js^2)$, the double integrator contributes a fixed $-180^\circ$ of phase. The controller's zero adds back $\arctan(k_d\omega/k_p)$, which is positive at every frequency. So the phase is always *above* $-180^\circ$ and the Nyquist plot never crosses the negative real axis.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="8" y1="40" x2="352" y2="40" stroke="#6c7a93"/>
  <line x1="300" y1="8" x2="300" y2="205" stroke="#6c7a93"/>
  <polyline points="395.0,40.0 394.9,35.0 394.5,30.1 393.8,25.1 392.9,20.2 391.8,15.4 390.4,10.6 388.7,6.0 386.8,1.4 384.6,-3.1 382.3,-7.5 379.7,-11.7 376.9,-15.8 373.8,-19.8 370.6,-23.6 367.2,-27.2 363.6,-30.6 359.8,-33.8 355.8,-36.9 351.7,-39.7 347.5,-42.3 343.1,-44.6 338.6,-46.8 334.0,-48.7 329.4,-50.4 324.6,-51.8 319.8,-52.9 314.9,-53.8 309.9,-54.5 305.0,-54.9 300.0,-55.0 295.0,-54.9 290.1,-54.5 285.1,-53.8 280.2,-52.9 275.4,-51.8 270.6,-50.4 266.0,-48.7 261.4,-46.8 256.9,-44.6 252.5,-42.3 248.3,-39.7 244.2,-36.9 240.2,-33.8 236.4,-30.6 232.8,-27.2 229.4,-23.6 226.2,-19.8 223.1,-15.8 220.3,-11.7 217.7,-7.5 215.4,-3.1 213.2,1.4 211.3,6.0 209.6,10.6 208.2,15.4 207.1,20.2 206.2,25.1 205.5,30.1 205.1,35.0 205.0,40.0 205.1,45.0 205.5,49.9 206.2,54.9 207.1,59.8 208.2,64.6 209.6,69.4 211.3,74.0 213.2,78.6 215.4,83.1 217.7,87.5 220.3,91.7 223.1,95.8 226.2,99.8 229.4,103.6 232.8,107.2 236.4,110.6 240.2,113.8 244.2,116.9 248.3,119.7 252.5,122.3 256.9,124.6 261.4,126.8 266.0,128.7 270.6,130.4 275.4,131.8 280.2,132.9 285.1,133.8 290.1,134.5 295.0,134.9 300.0,135.0 305.0,134.9 309.9,134.5 314.9,133.8 319.8,132.9 324.6,131.8 329.4,130.4 334.0,128.7 338.6,126.8 343.1,124.6 347.5,122.3 351.7,119.7 355.8,116.9 359.8,113.8 363.6,110.6 367.2,107.2 370.6,103.6 373.8,99.8 376.9,95.8 379.7,91.7 382.3,87.5 384.6,83.1 386.8,78.6 388.7,74.0 390.4,69.4 391.8,64.6 392.9,59.8 393.8,54.9 394.5,49.9 394.9,45.0 395.0,40.0" fill="none" stroke="#6c7a93" stroke-dasharray="3,3"/>
  <polyline points="140.6,199.8 144.7,197.8 148.7,195.8 152.5,193.8 156.3,191.8 160.0,189.8 163.6,187.9 167.1,186.0 170.5,184.1 173.8,182.3 177.0,180.4 180.1,178.6 183.2,176.8 186.2,175.1 189.1,173.3 191.9,171.6 194.7,169.9 197.4,168.3 200.0,166.6 202.6,165.0 205.1,163.4 207.5,161.8 209.9,160.2 212.2,158.7 214.4,157.1 216.6,155.6 218.7,154.1 220.8,152.7 222.8,151.2 224.8,149.8 226.7,148.4 228.6,147.0 230.4,145.6 232.2,144.2 233.9,142.9 235.6,141.6 237.3,140.3 238.9,139.0 240.5,137.7 242.0,136.4 243.5,135.2 244.9,134.0 246.3,132.8 247.7,131.6 249.0,130.4 250.3,129.2 251.6,128.1 252.8,127.0 254.0,125.8 255.2,124.7 256.4,123.6 257.5,122.6 258.6,121.5 259.6,120.5 260.7,119.4 261.7,118.4 262.6,117.4 263.6,116.4 264.5,115.4 265.4,114.4 266.3,113.5 267.2,112.5 268.0,111.6 268.8,110.7 269.6,109.8 270.4,108.9 271.2,108.0 271.9,107.1 272.6,106.2 273.3,105.4 274.0,104.5 274.7,103.7 275.3,102.9 276.0,102.1 276.6,101.3 277.2,100.5 277.8,99.7 278.3,99.0 278.9,98.2 279.4,97.4 279.9,96.7 280.5,96.0 281.0,95.3 281.4,94.5 281.9,93.8 282.4,93.1 282.8,92.5 283.3,91.8 283.7,91.1 284.1,90.5 284.5,89.8 284.9,89.2 285.3,88.5 285.7,87.9 286.0,87.3 286.4,86.7 286.7,86.1 287.1,85.5 287.4,84.9 287.7,84.3 288.1,83.8 288.4,83.2 288.7,82.6 288.9,82.1 289.2,81.6 289.5,81.0 289.8,80.5 290.0,80.0 290.3,79.5 290.5,78.9 290.8,78.4 291.0,78.0 291.2,77.5 291.5,77.0 291.7,76.5 291.9,76.0 292.1,75.6 292.3,75.1 292.5,74.7 292.7,74.2 292.9,73.8 293.1,73.3 293.2,72.9 293.4,72.5 293.6,72.1 293.7,71.7 293.9,71.2 294.1,70.8 294.2,70.5 294.4,70.1 294.5,69.7 294.6,69.3 294.8,68.9 294.9,68.5 295.0,68.2 295.2,67.8 295.3,67.5 295.4,67.1 295.5,66.8 295.7,66.4 295.8,66.1 295.9,65.7 296.0,65.4 296.1,65.1 296.2,64.7 296.3,64.4 296.4,64.1 296.5,63.8 296.6,63.5 296.6,63.2 296.7,62.9 296.8,62.6 296.9,62.3 297.0,62.0 297.1,61.7 297.1,61.5 297.2,61.2 297.3,60.9 297.3,60.6 297.4,60.4 297.5,60.1 297.5,59.9 297.6,59.6 297.7,59.4 297.7,59.1 297.8,58.9 297.8,58.6 297.9,58.4 297.9,58.1 298.0,57.9 298.1,57.7 298.1,57.4 298.2,57.2 298.2,57.0 298.2,56.8 298.3,56.6 298.3,56.4 298.4,56.1 298.4,55.9 298.5,55.7 298.5,55.5 298.5,55.3 298.6,55.1 298.6,54.9 298.6,54.7 298.7,54.6 298.7,54.4 298.7,54.2 298.8,54.0 298.8,53.8 298.8,53.6 298.9,53.5 298.9,53.3 298.9,53.1 299.0,53.0 299.0,52.8 299.0,52.6 299.0,52.5 299.1,52.3 299.1,52.1 299.1,52.0 299.1,51.8 299.1,51.7 299.2,51.5 299.2,51.4 299.2,51.2 299.2,51.1 299.3,50.9 299.3,50.8 299.3,50.7 299.3,50.5 299.3,50.4 299.3,50.3 299.4,50.1 299.4,50.0 299.4,49.9 299.4,49.7 299.4,49.6 299.4,49.5 299.5,49.4 299.5,49.2 299.5,49.1 299.5,49.0 299.5,48.9 299.5,48.8 299.5,48.7 299.5,48.6 299.6,48.4 299.6,48.3 299.6,48.2 299.6,48.1 299.6,48.0 299.6,47.9 299.6,47.8 299.6,47.7 299.6,47.6 299.6,47.5 299.7,47.4 299.7,47.3 299.7,47.2 299.7,47.1 299.7,47.0 299.7,47.0 299.7,46.9 299.7,46.8 299.7,46.7 299.7,46.6 299.7,46.5 299.7,46.4 299.7,46.4 299.8,46.3 299.8,46.2 299.8,46.1 299.8,46.0 299.8,46.0 299.8,45.9 299.8,45.8 299.8,45.7 299.8,45.7 299.8,45.6 299.8,45.5 299.8,45.4 299.8,45.4 299.8,45.3 299.8,45.2 299.8,45.2 299.8,45.1 299.8,45.0 299.8,45.0 299.9,44.9 299.9,44.8 299.9,44.8 299.9,44.7 299.9,44.7 299.9,44.6 299.9,44.5 299.9,44.5 299.9,44.4 299.9,44.4 299.9,44.3 299.9,44.3 299.9,44.2 299.9,44.1 299.9,44.1 299.9,44.0 299.9,44.0 299.9,43.9 299.9,43.9 299.9,43.8 299.9,43.8 299.9,43.7 299.9,43.7 299.9,43.6 299.9,43.6 299.9,43.5 299.9,43.5 299.9,43.5 299.9,43.4 299.9,43.4 299.9,43.3 299.9,43.3 299.9,43.2 299.9,43.2 299.9,43.2 299.9,43.1 299.9,43.1 299.9,43.0 299.9,43.0 299.9,43.0 299.9,42.9 299.9,42.9 299.9,42.8 300.0,42.8 300.0,42.8 300.0,42.7 300.0,42.7 300.0,42.7 300.0,42.6 300.0,42.6 300.0,42.6 300.0,42.5 300.0,42.5 300.0,42.5 300.0,42.4 300.0,42.4 300.0,42.4 300.0,42.3 300.0,42.3 300.0,42.3 300.0,42.3" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="205" cy="40" r="4" fill="#b4232c"/>
  <text x="205" y="31" font-size="12" text-anchor="middle" fill="#b4232c">−1</text>
  <circle cx="255.9" cy="124.1" r="3.5" fill="#1f2a44"/>
  <text x="263.9" y="128.1" font-size="11" fill="#1f2a44">|L| = 1, PM 62.3°</text>
  <text x="40" y="200" font-size="11" fill="#1d6fd1">small ω</text>
  <text x="308" y="72" font-size="11" fill="#1d6fd1">large ω</text>
  <text x="306" y="54" font-size="11" fill="#1f2a44">0</text>
  <text x="90" y="31" font-size="11" text-anchor="middle" fill="#1f2a44">never crosses this axis</text>
</svg>
```

No amount of extra gain pushes it through $-1$, so the gain margin is "infinite". Add actuator lag, and the plot bends round and crosses.
:::

::: context frozen-envelope Margins across the whole flight
A launch vehicle's aerodynamics, mass and bending modes change every second. A margin computed at one instant describes a vehicle that exists for that instant only. Flight programs compute margins at many **frozen** points along the trajectory and check every one, then run thousands of nonlinear simulations with randomized errors — Monte Carlo — to catch saturation, rate limits and slosh. The flight qualification lesson at the end of this module shows such a sweep.
:::

::: context skew What the skew does
Real actuators often err more one way than the other. A hydraulic actuator losing pressure gets weaker, not stronger. The skew $\sigma$ lets the disk lean. With $\sigma > 0$ the disk stretches toward large gains; with $\sigma < 0$ it stretches toward small gains. At $\sigma = 0$ the gain range is balanced: the upper limit is exactly one over the lower one, so equal decibels up and down.
:::

::: context mobius Möbius maps
A fraction of the form $(a\delta + b)/(c\delta + d)$ is called a **Möbius transformation**, after the German mathematician August Möbius, who also gave his name to the one-sided strip. Its special property is that it sends circles to circles (counting straight lines as circles of infinite radius). That is why a disk of $\delta$ values becomes a neat disk of gain-and-phase factors $f$, and why the whole margin can be summed up in the single radius $\alpha$.
:::

::: context small-gain-bridge The small gain theorem again
Back in the small gain lesson: if a stable loop $\mathbf{M}$ is closed through a stable error block $\boldsymbol{\Delta}$, and $\lVert\mathbf{M}\rVert_\infty\,\lVert\boldsymbol{\Delta}\rVert_\infty < 1$, the loop stays stable. The disk margin is that theorem, applied with a clever choice of error block. All the work goes into rewriting "gain and phase errors" so they look like one block $\delta$, and finding the $\mathbf{M}$ it sees.
:::

::: context disk-picture The disk of the single-axis example
For the example axis, $\alpha = 1.089$. Every combined gain-and-phase factor inside this disk leaves the loop stable. The disk crosses the real axis at $0.295$ and $3.393$ ($\pm 10.6\,\mathrm{dB}$), and the widest phase any point reaches is $\pm 57.2^\circ$, where the dashed lines touch.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="10" y1="100.0" x2="352" y2="100.0" stroke="#6c7a93" stroke-width="1"/>
  <line x1="30" y1="8" x2="30" y2="192" stroke="#6c7a93" stroke-width="1"/>
  <polyline points="233.6,100.0 233.5,96.8 233.3,93.5 233.1,90.3 232.7,87.1 232.2,83.9 231.5,80.7 230.8,77.5 230.0,74.4 229.0,71.3 228.0,68.2 226.8,65.2 225.5,62.2 224.2,59.3 222.7,56.4 221.1,53.5 219.4,50.7 217.7,48.0 215.8,45.4 213.9,42.8 211.8,40.3 209.7,37.8 207.5,35.4 205.2,33.1 202.8,30.9 200.4,28.8 197.8,26.8 195.3,24.8 192.6,23.0 189.9,21.2 187.1,19.5 184.3,17.9 181.4,16.5 178.4,15.1 175.4,13.8 172.4,12.7 169.3,11.6 166.2,10.7 163.1,9.8 159.9,9.1 156.8,8.5 153.6,8.0 150.3,7.6 147.1,7.3 143.9,7.1 140.6,7.1 137.4,7.1 134.1,7.3 130.9,7.6 127.7,8.0 124.5,8.5 121.3,9.1 118.1,9.8 115.0,10.7 111.9,11.6 108.8,12.7 105.8,13.8 102.8,15.1 99.9,16.5 97.0,17.9 94.2,19.5 91.4,21.2 88.7,23.0 86.0,24.8 83.4,26.8 80.9,28.8 78.4,30.9 76.1,33.1 73.8,35.4 71.6,37.8 69.4,40.3 67.4,42.8 65.4,45.4 63.6,48.0 61.8,50.7 60.1,53.5 58.6,56.4 57.1,59.3 55.7,62.2 54.5,65.2 53.3,68.2 52.2,71.3 51.3,74.4 50.4,77.5 49.7,80.7 49.1,83.9 48.6,87.1 48.2,90.3 47.9,93.5 47.7,96.8 47.7,100.0 47.7,103.2 47.9,106.5 48.2,109.7 48.6,112.9 49.1,116.1 49.7,119.3 50.4,122.5 51.3,125.6 52.2,128.7 53.3,131.8 54.5,134.8 55.7,137.8 57.1,140.7 58.6,143.6 60.1,146.5 61.8,149.3 63.6,152.0 65.4,154.6 67.4,157.2 69.4,159.7 71.6,162.2 73.8,164.6 76.1,166.9 78.4,169.1 80.9,171.2 83.4,173.2 86.0,175.2 88.7,177.0 91.4,178.8 94.2,180.5 97.0,182.1 99.9,183.5 102.8,184.9 105.8,186.2 108.8,187.3 111.9,188.4 115.0,189.3 118.1,190.2 121.3,190.9 124.5,191.5 127.7,192.0 130.9,192.4 134.1,192.7 137.4,192.9 140.6,192.9 143.9,192.9 147.1,192.7 150.3,192.4 153.6,192.0 156.8,191.5 159.9,190.9 163.1,190.2 166.2,189.3 169.3,188.4 172.4,187.3 175.4,186.2 178.4,184.9 181.4,183.5 184.3,182.1 187.1,180.5 189.9,178.8 192.6,177.0 195.3,175.2 197.8,173.2 200.4,171.2 202.8,169.1 205.2,166.9 207.5,164.6 209.7,162.2 211.8,159.7 213.9,157.2 215.8,154.6 217.7,152.0 219.4,149.3 221.1,146.5 222.7,143.6 224.2,140.7 225.5,137.8 226.8,134.8 228.0,131.8 229.0,128.7 230.0,125.6 230.8,122.5 231.5,119.3 232.2,116.1 232.7,112.9 233.1,109.7 233.3,106.5 233.5,103.2 233.6,100.0" fill="#8fb8f0" fill-opacity="0.5" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="30" y1="100.0" x2="142.6" y2="-74.4" stroke="#1f2a44" stroke-dasharray="4,3"/>
  <line x1="30" y1="100.0" x2="142.6" y2="274.4" stroke="#1f2a44" stroke-dasharray="4,3"/>
  <circle cx="90.0" cy="100.0" r="3" fill="#1f2a44"/>
  <text x="90.0" y="115.0" font-size="11" text-anchor="middle" fill="#1f2a44">1</text>
  <circle cx="47.7" cy="100.0" r="3" fill="#b4232c"/><circle cx="233.6" cy="100.0" r="3" fill="#b4232c"/>
  <text x="47.7" y="93.0" font-size="11" text-anchor="middle" fill="#b4232c">0.295</text>
  <text x="229.6" y="93.0" font-size="11" text-anchor="end" fill="#b4232c">3.393</text>
  <text x="24" y="115.0" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <text x="64.3" y="34.5" font-size="11" text-anchor="end" fill="#1f2a44">+57.2°</text>
  <text x="64.3" y="175.5" font-size="11" text-anchor="end" fill="#1f2a44">−57.2°</text>
</svg>
```

The widest-phase points have a gain of exactly $1$, so $\pm 57.2^\circ$ is a pure phase error. Notice the disk is not a rectangle: a factor with the full $+10.6\,\mathrm{dB}$ *and* $57^\circ$ of lag lies outside it. What the margin promises is the disk itself.
:::

::: context mu-exact Why three blocks is the magic number
Computing $\mu$ exactly is very hard in general, so tools compute an upper bound by searching over diagonal scalings $\mathbf{D}$. John Doyle proved in 1982 that this upper bound equals $\mu$ exactly when the structure is small enough — in particular, for up to three independent complex scalar blocks. A three-axis attitude loop, with one complex error per axis, falls inside that case. With four or more channels the bound can be pessimistic.
:::

::: context destabilizing-pair Where the killer error sits
The multi-loop margin $\alpha = 0.675$ makes this disk of allowed factors $f$. The error that breaks the loop sits right on its edge, at $0.723\angle{-33.1^\circ}$ — the same on both channels.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="10" y1="100.0" x2="352" y2="100.0" stroke="#6c7a93" stroke-width="1"/>
  <line x1="30" y1="8" x2="30" y2="192" stroke="#6c7a93" stroke-width="1"/>
  <polyline points="268.1,100.0 268.1,96.9 267.9,93.7 267.7,90.6 267.3,87.5 266.8,84.4 266.2,81.3 265.5,78.3 264.7,75.2 263.7,72.2 262.7,69.3 261.6,66.3 260.4,63.5 259.1,60.6 257.6,57.8 256.1,55.1 254.5,52.4 252.8,49.8 251.0,47.2 249.1,44.7 247.1,42.3 245.1,39.9 242.9,37.6 240.7,35.4 238.4,33.2 236.1,31.2 233.6,29.2 231.1,27.3 228.5,25.5 225.9,23.8 223.2,22.2 220.5,20.7 217.7,19.3 214.8,17.9 212.0,16.7 209.0,15.6 206.1,14.6 203.1,13.6 200.0,12.8 197.0,12.1 193.9,11.5 190.8,11.0 187.7,10.7 184.6,10.4 181.4,10.2 178.3,10.2 175.2,10.2 172.0,10.4 168.9,10.7 165.8,11.0 162.7,11.5 159.6,12.1 156.6,12.8 153.5,13.6 150.5,14.6 147.6,15.6 144.7,16.7 141.8,17.9 138.9,19.3 136.1,20.7 133.4,22.2 130.7,23.8 128.1,25.5 125.5,27.3 123.0,29.2 120.6,31.2 118.2,33.2 115.9,35.4 113.7,37.6 111.5,39.9 109.5,42.3 107.5,44.7 105.6,47.2 103.8,49.8 102.1,52.4 100.5,55.1 99.0,57.8 97.6,60.6 96.2,63.5 95.0,66.3 93.9,69.3 92.9,72.2 91.9,75.2 91.1,78.3 90.4,81.3 89.8,84.4 89.3,87.5 89.0,90.6 88.7,93.7 88.5,96.9 88.5,100.0 88.5,103.1 88.7,106.3 89.0,109.4 89.3,112.5 89.8,115.6 90.4,118.7 91.1,121.7 91.9,124.8 92.9,127.8 93.9,130.7 95.0,133.7 96.2,136.5 97.6,139.4 99.0,142.2 100.5,144.9 102.1,147.6 103.8,150.2 105.6,152.8 107.5,155.3 109.5,157.7 111.5,160.1 113.7,162.4 115.9,164.6 118.2,166.8 120.6,168.8 123.0,170.8 125.5,172.7 128.1,174.5 130.7,176.2 133.4,177.8 136.1,179.3 138.9,180.7 141.8,182.1 144.7,183.3 147.6,184.4 150.5,185.4 153.5,186.4 156.6,187.2 159.6,187.9 162.7,188.5 165.8,189.0 168.9,189.3 172.0,189.6 175.2,189.8 178.3,189.8 181.4,189.8 184.6,189.6 187.7,189.3 190.8,189.0 193.9,188.5 197.0,187.9 200.0,187.2 203.1,186.4 206.1,185.4 209.0,184.4 212.0,183.3 214.8,182.1 217.7,180.7 220.5,179.3 223.2,177.8 225.9,176.2 228.5,174.5 231.1,172.7 233.6,170.8 236.1,168.8 238.4,166.8 240.7,164.6 242.9,162.4 245.1,160.1 247.1,157.7 249.1,155.3 251.0,152.8 252.8,150.2 254.5,147.6 256.1,144.9 257.6,142.2 259.1,139.4 260.4,136.5 261.6,133.7 262.7,130.7 263.7,127.8 264.7,124.8 265.5,121.7 266.2,118.7 266.8,115.6 267.3,112.5 267.7,109.4 267.9,106.3 268.1,103.1 268.1,100.0" fill="#8fb8f0" fill-opacity="0.5" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="30" y1="100.0" x2="223.3" y2="-47.1" stroke="#1f2a44" stroke-dasharray="4,3"/>
  <line x1="30" y1="100.0" x2="223.3" y2="247.1" stroke="#1f2a44" stroke-dasharray="4,3"/>
  <circle cx="148.0" cy="100.0" r="3" fill="#1f2a44"/>
  <text x="148.0" y="115.0" font-size="11" text-anchor="middle" fill="#1f2a44">1</text>
  <circle cx="88.5" cy="100.0" r="3" fill="#b4232c"/><circle cx="268.1" cy="100.0" r="3" fill="#b4232c"/>
  <text x="88.5" y="93.0" font-size="11" text-anchor="middle" fill="#b4232c">0.495</text>
  <text x="264.1" y="93.0" font-size="11" text-anchor="end" fill="#b4232c">2.018</text>
  <text x="24" y="115.0" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <circle cx="101.5" cy="146.6" r="4.5" fill="#b4232c"/>
  <text x="103.5" y="164.6" font-size="11" fill="#b4232c">f = 0.723 at -33.1°</text>
  <text x="132.6" y="22.4" font-size="11" fill="#1f2a44">±37.3°</text>
</svg>
```

Every point strictly inside the disk is survivable. The dot is not: both actuators $2.8\,\mathrm{dB}$ weak and $33^\circ$ late, together.
:::
