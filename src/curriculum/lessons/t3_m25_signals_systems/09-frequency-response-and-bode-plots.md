---
id: l09-frequency-response-and-bode-plots
title: Frequency response and Bode plot construction by hand
minutes: 19
covers:
  - "Frequency response: magnitude and phase; Bode plot construction by hand"
---

Push a child on a swing. Push slowly, once every ten seconds, and the swing follows your hand. Push at exactly the right rhythm and each push adds to the last, so the swing goes higher and higher. Push very fast, many times a second, and the swing hardly moves at all — it cannot keep up. Same swing, same push, three different results. The only thing that changed was the *frequency*.

Every linear system works like that swing. Shake it with a steady wave at one frequency and it answers with a wave at the same frequency, but bigger or smaller, and shifted later in time. Record how much bigger and how much later at every frequency, and you have the **frequency response**. Draw it on two graphs and you have a **Bode plot**.

This is the lesson the rest of the control tier stands on. Every design method after it — lead-lag, PID tuning by loop shaping, notch filters, robustness margins — is done on a picture of magnitude and phase against frequency. If you can draw that picture from a transfer function in ninety seconds on a whiteboard, and read a crossover frequency, a phase margin and a resonance off it, you can hold your own in any control review.

There is a practical reason too. The frequency response is what you can *measure*. [[Shake an actuator with a slow-to-fast sweep of sine waves|swept-sine]] and you get magnitude and phase directly, with no model assumed. It also stacks neatly: blocks in a chain multiply, and on logarithmic axes multiplying becomes adding. And the fundamental limits — a right-half-plane zero, a delay, a structural mode — each have an unmistakable signature here.

## Magnitude and phase

Lesson 1 showed that an LTI system driven by $e^{st}$ returns $G(s)e^{st}$. Put $s = j\omega$ and take the real parts: [[a sine wave in gives a sine wave out|sine-in-sine-out]] at the same frequency,

$$
u(t) = A\cos\omega t \quad\Longrightarrow\quad y_{ss}(t) = A\,\lvert G(j\omega)\rvert\cos\left(\omega t + \angle G(j\omega)\right).
$$

Here $y_{ss}$ is the **steady-state** output, what is left once the start-up transient has died away. $G(j\omega)$ is the frequency response: one complex number at each frequency. Its size $\lvert G(j\omega)\rvert$ is the **gain** — how many times bigger the output wave is. Its angle $\angle G(j\omega)$ is the **phase shift**. Negative phase is **lag**: the output arrives late, by $-\angle G/\omega$ seconds.

Working it out is mechanical. Substitute $s = j\omega$ into the transfer function and do the complex arithmetic. For a product of factors, sizes multiply and angles add:

$$
\left\lvert \frac{N_1N_2}{D_1D_2}\right\rvert = \frac{\lvert N_1\rvert\lvert N_2\rvert}{\lvert D_1\rvert\lvert D_2\rvert}, \qquad \angle\frac{N_1N_2}{D_1D_2} = \angle N_1 + \angle N_2 - \angle D_1 - \angle D_2.
$$

That second line is the whole reason sketching by hand works: each factor's phase can be worked out alone, then added.

## Decibels, decades, and the logarithmic axes

A **[[Bode plot|bode-name]]** is two graphs stacked, both against $\log_{10}\omega$. The top one is magnitude in **[[decibels|decibel]]**, $20\log_{10}\lvert G\rvert$. The bottom one is phase in degrees. Logarithms turn the products above into sums, so each factor draws its own curve and you add the curves.

Values to know without a calculator:

| ratio | $\tfrac{1}{2}$ | $\tfrac{1}{\sqrt2}$ | 1 | $\sqrt2$ | 2 | 5 | 10 | 100 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| dB | $-6.0$ | $-3.0$ | 0 | $+3.0$ | $+6.0$ | $+14.0$ | $+20$ | $+40$ |

A **decade** is a factor of ten in frequency, and an **octave** is a factor of two. A slope of $-20\,\mathrm{dB}$ per decade is the same as $-6\,\mathrm{dB}$ per octave. It means $\lvert G\rvert \propto 1/\omega$ (read "is proportional to"): double the frequency, halve the gain.

## The building blocks

Every rational transfer function in time-constant form is a product of five kinds of factor. Learn what each one does and you can draw anything.

**Constant $K$.** Magnitude $20\log_{10}\lvert K\rvert$ at every frequency: a flat line. Phase $0^\circ$ if $K > 0$, $-180^\circ$ if $K < 0$.

**Pole or zero at the origin, $s^{\pm n}$.** A factor $1/s$ gives magnitude $1/\omega$: a straight line of slope $-20\,\mathrm{dB}$/decade that passes through $0\,\mathrm{dB}$ at $\omega = 1\,\mathrm{rad/s}$. Its phase is a constant $-90^\circ$. A factor $s$ is the mirror image: $+20\,\mathrm{dB}$/decade and $+90^\circ$. No corner, no curve, no approximation — these are exact.

**Real pole $1/(1 + s/p)$.** Below the **corner frequency** $p$ the factor is about 1 ($0\,\mathrm{dB}$). Above it, the magnitude falls at $-20\,\mathrm{dB}$/decade. These two straight lines are the **[[asymptotes|asymptote-picture]]**, and they meet at $\omega = p$. There the true value is $-3.01\,\mathrm{dB}$ — the biggest error the straight-line sketch makes, and worth drawing in. The phase runs from $0^\circ$ to $-90^\circ$, passing exactly $-45^\circ$ at the corner. Exact values:

| $\omega/p$ | 0.1 | 0.5 | 1 | 2 | 10 |
| --- | --- | --- | --- | --- | --- |
| magnitude | $-0.04\,\mathrm{dB}$ | $-0.97\,\mathrm{dB}$ | $-3.01\,\mathrm{dB}$ | $-6.99\,\mathrm{dB}$ | $-20.04\,\mathrm{dB}$ |
| phase | $-5.7^\circ$ | $-26.6^\circ$ | $-45^\circ$ | $-63.4^\circ$ | $-84.3^\circ$ |

So the phase change is spread over about a decade either side of the corner. The straight-line phase sketch draws it as a ramp from $0^\circ$ at $p/10$ to $-90^\circ$ at $10p$.

**Real zero $(1 + s/z)$.** The exact mirror image: $+20\,\mathrm{dB}$/decade above the corner, $+3.01\,\mathrm{dB}$ at the corner, and phase from $0^\circ$ to $+90^\circ$ through $+45^\circ$. A **right-half-plane** zero $(1 - s/z)$ has the same magnitude and the *opposite* phase, $0^\circ$ to $-90^\circ$ — lesson 7.

**Complex pair $1/\left(1 + 2\zeta s/\omega_n + s^2/\omega_n^2\right)$.** Below $\omega_n$ it is $0\,\mathrm{dB}$. Above it, the magnitude falls at $-40\,\mathrm{dB}$/decade. The phase runs from $0^\circ$ to $-180^\circ$, passing exactly $-90^\circ$ at $\omega_n$ whatever the damping. What the straight lines miss is the [[resonant peak|resonance-picture]] — the swing pushed at its favorite rhythm. At $\omega = \omega_n$ the exact magnitude is $1/(2\zeta)$, and the true maximum is

$$
M_r = \frac{1}{2\zeta\sqrt{1 - \zeta^2}} \quad\text{at}\quad \omega_r = \omega_n\sqrt{1 - 2\zeta^2}, \qquad \zeta < \frac{1}{\sqrt{2}}.
$$

| $\zeta$ | 0.005 | 0.05 | 0.1 | 0.3 | 0.5 | 0.707 |
| --- | --- | --- | --- | --- | --- | --- |
| $M_r$ | $40.0\,\mathrm{dB}$ | $20.0\,\mathrm{dB}$ | $14.0\,\mathrm{dB}$ | $4.8\,\mathrm{dB}$ | $1.2\,\mathrm{dB}$ | $0\,\mathrm{dB}$ |

For $\zeta \ge 1/\sqrt{2}$ there is no peak at all. A bending mode with $\zeta = 0.005$ pokes $40\,\mathrm{dB}$ — a factor of 100 — above the straight line, over a band only a few percent wide. Its phase swings almost $180^\circ$ across that band. That is why lesson 6 refused to neglect it.

**Delay $e^{-sT}$.** $0\,\mathrm{dB}$ everywhere, phase $-57.3\,\omega T$ degrees (lesson 8). It touches only the lower graph.

::: key
Bode asymptote bookkeeping. Each real pole: $-20\,\mathrm{dB}$/decade above its corner and $-90^\circ$ of phase, spread over a decade either side of the corner. Each real zero: $+20\,\mathrm{dB}$/decade and $+90^\circ$. A complex pair counts double: $\mp40\,\mathrm{dB}$/decade and $\mp180^\circ$. A pole at the origin: $-20\,\mathrm{dB}$/decade everywhere and a constant $-90^\circ$. Corrections at a corner: $\mp3\,\mathrm{dB}$ for a real factor, $1/(2\zeta)$ for a complex pair.
:::

## Constructing the plot by hand

The recipe, in order:

1. **Put $G$ in time-constant form**, $K\prod(1 + s/z_i)/\left[s^n\prod(1 + s/p_i)\right]$, so every bracket equals 1 at low frequency. This is the step people skip, and then wonder why their plot sits at the wrong height.
2. **Start at low frequency.** Below the lowest corner, $G \approx K/(j\omega)^n$. Pick a handy frequency, work out $\lvert G\rvert$ there in dB, and draw a line of slope $-20n\,\mathrm{dB}$/decade through it.
3. **March up through the corners.** At each corner, change the slope: $-20$ for a real pole, $+20$ for a real zero, $\mp40$ for a complex pair.
4. **Correct at the corners.** Drop $3\,\mathrm{dB}$ at a real pole, add $3\,\mathrm{dB}$ at a real zero, draw the resonant peak $1/(2\zeta)$ at a complex pair.
5. **Do the phase separately**, adding each factor's angle at a few frequencies. Exact arctangents are quicker than the straight-line rule and no harder.

::: example Sketching a rate loop, then checking it
Take the loop transfer function

$$
L(s) = \frac{200}{s(s + 2)(s + 20)}.
$$

**Step 1, time-constant form.** Pull the constant out of each bracket: $s + 2 = 2(1 + s/2)$ and $s + 20 = 20(1 + s/20)$. So $L = 200/\left[s \cdot 2(1 + s/2) \cdot 20(1 + s/20)\right] = \dfrac{5}{s(1 + s/2)(1 + s/20)}$. That is $K = 5$, one integrator, and corners at $2$ and $20\,\mathrm{rad/s}$.

**Step 2, low frequency.** Here $\lvert L\rvert \approx 5/\omega$. At $\omega = 0.1$ that is $50$, or $20\log_{10}50 = 34\,\mathrm{dB}$, with slope $-20\,\mathrm{dB}$/decade. (Exact: $33.97\,\mathrm{dB}$.)

**Step 3, corners.** At $\omega = 2$ the straight line is at $5/2 = 2.5$, which is $7.96\,\mathrm{dB}$, and the slope steepens to $-40$. At $\omega = 20$ it steepens to $-60$. Between the corners the line is $\lvert L\rvert \approx 5/(\omega \cdot \omega/2) = 10/\omega^2$.

**Step 4, crossover from the sketch.** Set the middle line to 1: $10/\omega^2 = 1$, so $\omega = \sqrt{10} = 3.16\,\mathrm{rad/s}$.

**Step 5, phase there.** $\angle L = -90^\circ - \arctan(3.16/2) - \arctan(3.16/20) = -90^\circ - 57.7^\circ - 9.0^\circ = -156.7^\circ$. So the sketch predicts a phase margin of $180 - 156.7 = 23.3^\circ$.

**Step 6, the exact answer.** Solve $\lvert L\rvert = 200/\left(\omega\sqrt{\omega^2 + 4}\sqrt{\omega^2 + 400}\right) = 1$ numerically: $\omega_c = 2.846\,\mathrm{rad/s}$. The phase there is $-90^\circ - 54.9^\circ - 8.1^\circ = -153.0^\circ$, so $\mathrm{PM} = 27.0^\circ$.

Sanity check: the sketch put crossover 11% high and the margin $3.7^\circ$ low. Why? It ignored the $3\,\mathrm{dB}$ drop at the corner at 2, which sits close to crossover — the true curve is lower there, so it reaches 1 sooner. That is the normal size of a hand-sketch error, and it is why you sketch first and compute second, not instead.

**Step 7, the other margin.** The phase reaches $-180^\circ$ where $\arctan(\omega/2) + \arctan(\omega/20) = 90^\circ$. Two angles add to $90^\circ$ when their tangents multiply to 1, so $(\omega/2)(\omega/20) = 1$ and $\omega_{180} = \sqrt{2 \times 20} = 6.325\,\mathrm{rad/s}$. There

$$
\lvert L(j\omega_{180})\rvert = \frac{K}{ab(a + b)} = \frac{200}{2 \times 20 \times 22} = 0.2273,
$$

using the general result for $K/\left[s(s+a)(s+b)\right]$ (here $K$ is the leading $200$ and $a = 2$, $b = 20$). The **gain margin** is its reciprocal, $\mathrm{GM} = 1/0.2273 = 4.40$, or $12.9\,\mathrm{dB}$: the loop gain could rise by a factor of 4.4 before the closed loop goes unstable. The delay margin (lesson 8) is $\mathrm{PM}/\omega_c = 0.4712/2.846 = 166\,\mathrm{ms}$.
:::

```python
import numpy as np

# Frequency response of L(s) = 200 / (s(s+2)(s+20)) by direct evaluation at s = j*w.
num = np.array([200.0])
den = np.array([1.0, 22.0, 40.0, 0.0])          # s^3 + 22 s^2 + 40 s

w = np.array([0.1, 1.0, 2.0, 2.84609, 3.16228, 6.32456, 20.0])
g = np.polyval(num, 1j * w) / np.polyval(den, 1j * w)
mag_db = 20 * np.log10(np.abs(g))
phase_deg = np.degrees(np.unwrap(np.angle(g)))

for wi, m, p in zip(w, mag_db, phase_deg):
    print(f"w = {wi:8.5f}   {m:8.3f} dB   {p:9.3f} deg")

# w =  0.10000     33.968 dB     -93.149 deg
# w =  1.00000     12.999 dB    -119.427 deg
# w =  2.00000      4.905 dB    -140.711 deg
# w =  2.84609      0.000 dB    -153.003 deg
# w =  3.16228     -1.569 dB    -156.673 deg
# w =  6.32456    -12.869 dB    -180.000 deg
# w = 20.00000    -35.095 dB    -219.289 deg
```

::: warning
[[Unwrap the phase|unwrap]]. A library that returns the principal angle reports the phase at $\omega = 20$ in the example above as $+140.7^\circ$, when the physically meaningful value is $-219.3^\circ$. A wrapped phase plot looks as if the loop won back $360^\circ$ of margin it never had, and it makes the phase crossover impossible to find. Always unwrap. And always check the high-frequency phase against the **[[relative degree|relative-degree]]** — the number of poles minus the number of zeros. A strictly proper $G$ of relative degree $r$ must approach $-90r$ degrees.
:::

## Crossover and margins

Two frequencies matter on a loop transfer function $L(s)$ = (controller)(actuator)(plant)(sensor), the product all the way around the loop:

- **Gain crossover** $\omega_c$: where $\lvert L(j\omega_c)\rvert = 1$ ($0\,\mathrm{dB}$). Roughly, this is the loop's bandwidth. Below it the loop follows commands and fights disturbances. Above it the loop does nothing.
- **Phase crossover** $\omega_{180}$: where $\angle L = -180^\circ$.

From them,

$$
\mathrm{PM} = 180^\circ + \angle L(j\omega_c), \qquad \mathrm{GM} = \frac{1}{\lvert L(j\omega_{180})\rvert}.
$$

A rule of thumb worth carrying: the closed loop's damping is roughly $\zeta \approx \mathrm{PM}/100$ for margins up to about $60^\circ$. So $\mathrm{PM} = 50^\circ$ means about $\zeta = 0.5$, and 16% overshoot.

Also look at the *slope* where the curve passes $0\,\mathrm{dB}$. A loop crossing at $-20\,\mathrm{dB}$/decade has good margins almost automatically. One crossing at $-40$ is marginal, and one at $-60$ is unstable. That is because, for minimum-phase systems, the slope and the phase are tied together: each $-20\,\mathrm{dB}$/decade of steady slope comes with about $-90^\circ$ of phase. The next module develops this link and the full Nyquist stability criterion.

::: example A flexible spacecraft's frequency response
Lesson 4's hub-measured response, torque to hub angle, was

$$
\frac{\Theta_1}{U} = \frac{J_2s^2 + cs + k}{s^2\left[J_1J_2s^2 + (J_1+J_2)cs + (J_1+J_2)k\right]}.
$$

Use $J_1 = 1200$, $J_2 = 150\,\mathrm{kg\,m^2}$, $k = 600\,\mathrm{N\,m/rad}$ and $c = 3\,\mathrm{N\,m\,s/rad}$. In time-constant form:

$$
\frac{\Theta_1}{U} = \frac{1}{(J_1 + J_2)s^2}\cdot\frac{1 + 2\zeta_zs/\omega_z + s^2/\omega_z^2}{1 + 2\zeta_fs/\omega_f + s^2/\omega_f^2}, \quad \omega_z = 2.000,\ \zeta_z = 0.0050,\ \omega_f = 2.121,\ \zeta_f = 0.0053.
$$

Sketch it in two pieces. The rigid part is $1/(1350\,\omega^2)$: a $-40\,\mathrm{dB}$/decade line with a constant phase of $-180^\circ$, at $-22.6\,\mathrm{dB}$ when $\omega = 0.1\,\mathrm{rad/s}$. The flexible part is 1 ($0\,\mathrm{dB}$, $0^\circ$) everywhere except in a narrow band around $2\,\mathrm{rad/s}$. There the zero pair and the pole pair each do their $\pm40\,\mathrm{dB}$/decade and $\pm180^\circ$ within a few percent of frequency.

The exact numbers show how sharp "narrow" is:

| $\omega$ | magnitude | phase | ratio to the rigid line |
| --- | --- | --- | --- |
| 1.000 | $-62.9\,\mathrm{dB}$ | $-180.0^\circ$ | 0.96 |
| 1.900 | $-79.9\,\mathrm{dB}$ | $-177.2^\circ$ | 0.49 |
| 2.000 | $-95.6\,\mathrm{dB}$ | $-95.1^\circ$ | 0.090 |
| 2.050 | $-77.3\,\mathrm{dB}$ | $-20.3^\circ$ | 0.77 |
| 2.121 ($=\omega_f$) | $-54.2\,\mathrm{dB}$ | $-94.8^\circ$ | 11.8 |
| 2.200 | $-67.5\,\mathrm{dB}$ | $-174.7^\circ$ | 2.75 |
| 3.000 | $-79.8\,\mathrm{dB}$ | $-179.8^\circ$ | 1.25 |

Between $2.00$ and $2.12\,\mathrm{rad/s}$ — six percent of frequency — the magnitude swings $41\,\mathrm{dB}$, and the phase swings about $160^\circ$ and comes back. Outside $1.9$ to $2.2\,\mathrm{rad/s}$ the plot looks the same as a bare double integrator.

Two lessons in this. First, the resonant peak reaches only $11.8\times$ the rigid line, not the $1/(2\zeta_f) = 94\times$ a lone mode would give. The antiresonance (the dip from the zero pair) at $2.000\,\mathrm{rad/s}$ sits right beside it and pulls the curve down first. Zero-pole pairs this close always partly cancel. Second, the phase *comes back*. It rises at the zero, then falls again at the pole and recovers to $-180^\circ$. That round trip, rather than a one-way loss, is the signature of a collocated sensor and actuator. It is why a hub-mounted gyro is so much easier to close a loop around than a tip-mounted one.
:::

## The same data as a polar plot

A Bode plot is two graphs of one complex function. You can also plot that complex number directly. Mark $L(j\omega)$ as a point in the complex plane and let $\omega$ run from $0$ to $\infty$; the point traces a curve. That is the **polar plot**, the core of a **[[Nyquist diagram|nyquist-name]]**. Nothing new is in it. What changes is what is easy to see.

The **critical point** is $-1 + 0j$. Here is why. The closed loop's denominator is $1 + L(s)$. If $L(j\omega) = -1$ at some frequency, then $1 + L = 0$ there, the closed loop has a pole on the imaginary axis, and it oscillates forever at that frequency. So the distance from the curve to $-1$ measures how close the loop is to instability. Reading it off:

- Where the curve crosses the unit circle (size 1), the angle back to the negative real axis is the **phase margin**.
- Where it crosses the negative real axis, at $-1/\mathrm{GM}$, the reciprocal of that distance from the origin is the **gain margin**.
- The shortest distance from $-1$ to the curve, $\min_\omega\lvert 1 + L(j\omega)\rvert$, is one number that captures both at once. It is the **modulus margin**, and its reciprocal is the peak of the sensitivity function of lesson 12.

For the loop $L = 200/\left[s(s+2)(s+20)\right]$ above, [[the curve|polar-picture]] starts far out along the $-90^\circ$ direction (the integrator) and sweeps clockwise. It crosses the unit circle at $2.846\,\mathrm{rad/s}$, at $27.0^\circ$ from the negative real axis. It crosses the negative real axis at $-0.2273$, giving $\mathrm{GM} = 4.40$. Then it spirals into the origin from the $-270^\circ$ direction. Its closest approach to $-1$ is $0.402$, at $\omega = 3.25\,\mathrm{rad/s}$, so the peak sensitivity is $1/0.402 = 2.49$, or $7.9\,\mathrm{dB}$.

That last number is the honest one. Gain margin and phase margin each nudge the loop in one direction only. A loop can have $12.9\,\mathrm{dB}$ of gain margin and $27^\circ$ of phase margin while passing within $0.40$ of the critical point — comfortable on each measure alone, mediocre in combination. That is why the next module treats the Nyquist plot and the modulus margin properly, and why you should learn to draw both pictures from the same $G(j\omega)$.

## Check yourself

::: check
For $G(s) = \dfrac{50}{s(s + 5)}$, find the gain crossover frequency and the phase margin, by hand.
:::

::: answer
Time-constant form: $50/\left[5s(1 + s/5)\right] = 10/\left[s(1 + s/5)\right]$. Below $5\,\mathrm{rad/s}$ the magnitude is about $10/\omega$, so the low-frequency line alone would cross $0\,\mathrm{dB}$ at $10\,\mathrm{rad/s}$. But that is past the corner, so the second segment decides, and crossover will be lower.

Exactly: $\lvert G\rvert = 50/\left(\omega\sqrt{\omega^2 + 25}\right) = 1$ gives $\omega^2(\omega^2 + 25) = 2500$. With $x = \omega^2$, $x^2 + 25x - 2500 = 0$, so $x = (-25 + \sqrt{625 + 10000})/2 = 39.04$ and $\omega_c = 6.25\,\mathrm{rad/s}$.

Phase: $-90^\circ - \arctan(6.25/5) = -90^\circ - 51.3^\circ = -141.3^\circ$, so $\mathrm{PM} = 38.7^\circ$.

The pattern works for every plant of the form $K/\left[s(s+a)\right]$: set the squared magnitude to 1, clear the square roots, and solve the quadratic in $\omega^2$. It is worth being able to do without a calculator.
:::

::: check
A plant is $G(s) = \dfrac{1 - s}{1 + s}$. Sketch its Bode plot and say what it does to a loop.
:::

::: answer
Top and bottom have the same size at every frequency, $\sqrt{1 + \omega^2}$, so $\lvert G(j\omega)\rvert = 1$ exactly. The magnitude plot is a flat $0\,\mathrm{dB}$ line, with no corner visible at all.

The phase is $\arctan(-\omega) - \arctan(\omega) = -2\arctan\omega$: $-11.4^\circ$ at $0.1\,\mathrm{rad/s}$, $-53.1^\circ$ at $0.5$, $-90^\circ$ at $1$, $-126.9^\circ$ at $2$, heading to $-180^\circ$.

This is an all-pass, the non-minimum-phase element of lesson 7 with $z = 1$. In a loop it changes no gain anywhere and removes phase everywhere. So no gain adjustment can compensate it, and it forces crossover well below $1\,\mathrm{rad/s}$ — the same conclusion as for a delay, which it resembles.
:::

::: check
A loop has $L(s) = \dfrac{K}{s^2}$. What is its phase margin for any $K$, and what does that tell you about controlling a rigid body with proportional feedback alone?
:::

::: answer
$\angle L = -180^\circ$ at every frequency. So wherever crossover happens, the phase margin is exactly $0^\circ$, and the gain margin is $1$ ($0\,\mathrm{dB}$).

Changing $K$ moves $\omega_c = \sqrt{K}$ but changes nothing else. The closed-loop poles sit at $\pm j\sqrt{K}$, on the imaginary axis, and the vehicle oscillates forever.

A rigid body from torque to attitude is exactly $1/(Is^2)$. So proportional attitude feedback alone is never enough: you must add phase near crossover, which is what a derivative term, a lead compensator or a rate inner loop does. This single fact is why every attitude control system in existence has rate feedback in it somewhere.
:::

::: check
An actuator has $\omega_n = 62.8\,\mathrm{rad/s}$ and $\zeta = 0.7$; a structural mode has $\omega_n = 20\,\mathrm{rad/s}$ and $\zeta = 0.004$. Compare what each does to a Bode magnitude plot near its own corner.
:::

::: answer
The actuator, at $\zeta = 0.7$, sits slightly below the threshold $1/\sqrt2 = 0.707$ where a resonant peak appears, so its magnitude has essentially no peak. At $\omega_n$ it is $1/(2\zeta) = 1/1.4 = 0.714$, which is $-2.9\,\mathrm{dB}$, and it rolls off at $-40\,\mathrm{dB}$/decade above. The curve is smooth over a decade either side, and a straight-line sketch is accurate within $3\,\mathrm{dB}$.

The structural mode, at $\zeta = 0.004$, peaks at $M_r = 1/(2\zeta\sqrt{1 - \zeta^2}) = 125$, which is $+41.9\,\mathrm{dB}$, within a fraction of a percent of $20\,\mathrm{rad/s}$. Its phase falls $180^\circ$ across a band roughly $2\zeta\omega_n = 2 \times 0.004 \times 20 = 0.16\,\mathrm{rad/s}$ wide. On a plot with one point per decade you would miss it completely. Always space the frequency points finely enough that $2\zeta\omega_n$ spans several of them.
:::

::: check
Why does putting a transfer function in time-constant form matter before sketching, and what goes wrong if you use pole-zero form instead?
:::

::: answer
The sketch starts from a low-frequency level and adds slopes at corners. That starting level is $K = G(0)$ — or, with $n$ integrators, the constant in $K/(j\omega)^n$. In time-constant form every factor equals 1 below its corner, so only $K$ sets the level and the construction hangs together.

In pole-zero form the leading constant is $k$, the ratio of leading coefficients. Each factor $(s + p)$ equals $p$, not 1, at low frequency, so the true level is $k\prod z_i/\prod p_i$ — a product you must compute separately, and will get wrong under time pressure.

For $L = 200/\left[s(s+2)(s+20)\right]$, $k = 200$ while $K = 5$. That is a factor of forty, a level error of $20\log_{10}40 = 32\,\mathrm{dB}$. The slopes and corner frequencies come out right either way; it is the height of the curve that goes wrong.
:::

## Summary

| Item | Statement |
| --- | --- |
| Frequency response | $G(j\omega)$; $A\cos\omega t \to A\lvert G\rvert\cos(\omega t + \angle G)$ |
| Decibels | $20\log_{10}\lvert G\rvert$; $\times 2 = 6\,\mathrm{dB}$, $\times10 = 20\,\mathrm{dB}$, $1/\sqrt2 = -3\,\mathrm{dB}$ |
| Constant $K$ | flat $20\log_{10}\lvert K\rvert$, phase $0^\circ$ (or $-180^\circ$ if negative) |
| $1/s^n$ | $-20n\,\mathrm{dB}$/decade, constant $-90n$ degrees, $0\,\mathrm{dB}$ at $\omega = 1$ for $n = 1$ |
| Real pole $1/(1 + s/p)$ | corner $p$; $-20\,\mathrm{dB}$/dec above; $-3\,\mathrm{dB}$ and $-45^\circ$ at $p$; $-5.7^\circ$ at $p/10$, $-84.3^\circ$ at $10p$ |
| Real zero $(1 + s/z)$ | mirror: $+20\,\mathrm{dB}$/dec, $+3\,\mathrm{dB}$, $+45^\circ$. Right-half-plane zero: same magnitude, phase $-\arctan(\omega/z)$ |
| Complex pair | $\mp40\,\mathrm{dB}$/dec, $\mp180^\circ$, $-90^\circ$ at $\omega_n$; peak $M_r = 1/(2\zeta\sqrt{1-\zeta^2})$ at $\omega_n\sqrt{1 - 2\zeta^2}$; $1/(2\zeta)$ at $\omega_n$ |
| Delay | $0\,\mathrm{dB}$, phase $-57.3\,\omega T$ degrees |
| Construction | time-constant form; low-frequency level and slope; add slopes at corners; correct $\mp3\,\mathrm{dB}$; phase by arctangents |
| Margins | $\omega_c$ where $\lvert L\rvert = 1$; $\mathrm{PM} = 180^\circ + \angle L(j\omega_c)$; $\omega_{180}$ where $\angle L = -180^\circ$; $\mathrm{GM} = 1/\lvert L(j\omega_{180})\rvert$ |
| Useful closed forms | for $K/\left[s(s+a)(s+b)\right]$: $\omega_{180} = \sqrt{ab}$, $\mathrm{GM} = ab(a+b)/K$ |
| Polar plot | $L(j\omega)$ in the complex plane; critical point $-1$; $\min\lvert 1 + L\rvert$ is the modulus margin |

So far every transfer function has been handed to you. The next lesson builds them: how to reduce any block diagram — chains, inner loops, feedforward paths — to a single ratio of polynomials, by algebra and by the Mason gain formula.

::: context swept-sine How a frequency response is measured
Engineers bolt the hardware to a test stand and feed it a sine wave, starting slow and sweeping up to fast — a **swept sine**, or "chirp". A frequency response analyzer compares the output wave with the input at each frequency and records the size ratio and the time shift. That gives magnitude and phase straight from the hardware. Actuators, whole spacecraft on shaker tables, and aircraft in flight-test "frequency sweeps" are all measured this way, and the measured plot is then compared with the model's Bode plot.
:::

::: context sine-in-sine-out Same frequency, new size, later
A first-order lag $1/(1 + s/p)$ driven exactly at its corner, $\omega = p$. The output (red) is the same wave as the input (blue), shrunk to $0.707$ of the size and shifted $45^\circ$ — one eighth of a cycle — later.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="85" x2="345" y2="85" stroke="#6c7a93" stroke-width="1"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="40.0,40.0 44.7,40.9 49.4,43.4 54.1,47.6 58.8,53.2 63.4,60.0 68.1,67.8 72.8,76.2 77.5,85.0 82.2,93.8 86.9,102.2 91.6,110.0 96.2,116.8 100.9,122.4 105.6,126.6 110.3,129.1 115.0,130.0 119.7,129.1 124.4,126.6 129.1,122.4 133.8,116.8 138.4,110.0 143.1,102.2 147.8,93.8 152.5,85.0 157.2,76.2 161.9,67.8 166.6,60.0 171.2,53.2 175.9,47.6 180.6,43.4 185.3,40.9 190.0,40.0 194.7,40.9 199.4,43.4 204.1,47.6 208.8,53.2 213.4,60.0 218.1,67.8 222.8,76.2 227.5,85.0 232.2,93.8 236.9,102.2 241.6,110.0 246.2,116.8 250.9,122.4 255.6,126.6 260.3,129.1 265.0,130.0 269.7,129.1 274.4,126.6 279.1,122.4 283.8,116.8 288.4,110.0 293.1,102.2 297.8,93.8 302.5,85.0 307.2,76.2 311.9,67.8 316.6,60.0 321.2,53.2 325.9,47.6 330.6,43.4 335.3,40.9 340.0,40.0"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2" points="40.0,62.5 44.7,58.5 49.4,55.6 54.1,53.8 58.8,53.2 63.4,53.8 68.1,55.6 72.8,58.5 77.5,62.5 82.2,67.3 86.9,72.8 91.6,78.8 96.2,85.0 100.9,91.2 105.6,97.2 110.3,102.7 115.0,107.5 119.7,111.5 124.4,114.4 129.1,116.2 133.8,116.8 138.4,116.2 143.1,114.4 147.8,111.5 152.5,107.5 157.2,102.7 161.9,97.2 166.6,91.2 171.2,85.0 175.9,78.8 180.6,72.8 185.3,67.3 190.0,62.5 194.7,58.5 199.4,55.6 204.1,53.8 208.8,53.2 213.4,53.8 218.1,55.6 222.8,58.5 227.5,62.5 232.2,67.3 236.9,72.8 241.6,78.8 246.2,85.0 250.9,91.2 255.6,97.2 260.3,102.7 265.0,107.5 269.7,111.5 274.4,114.4 279.1,116.2 283.8,116.8 288.4,116.2 293.1,114.4 297.8,111.5 302.5,107.5 307.2,102.7 311.9,97.2 316.6,91.2 321.2,85.0 325.9,78.8 330.6,72.8 335.3,67.3 340.0,62.5"/>
  <line x1="190" y1="30" x2="190" y2="40" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="208.8" y1="30" x2="208.8" y2="53" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="200" y="24" font-size="11" fill="#1f2a44" text-anchor="middle">45° late</text>
  <text x="40" y="150" font-size="12" fill="#1d6fd1">input, size 1</text>
  <text x="200" y="150" font-size="12" fill="#b4232c">output, size 0.707</text>
</svg>
```
:::

::: context bode-name Hendrik Bode
Hendrik Wade Bode (1905–1982) was an engineer at Bell Telephone Laboratories. In the 1930s and 1940s he worked on feedback amplifiers for long-distance telephone lines, which had to stay stable across huge ranges of frequency. His 1945 book *Network Analysis and Feedback Amplifier Design* set out the gain-and-phase methods, including the link between a minimum-phase system's slope and its phase. His name is usually said "BOH-dee".
:::

::: context decibel Why 20 times the log
The **bel**, named for Alexander Graham Bell, is the base-ten logarithm of a *power* ratio; a decibel is a tenth of a bel, so a power ratio $P$ is $10\log_{10}P$ decibels. Power goes as the square of an amplitude — double the voltage and you get four times the power. So for an amplitude ratio $A$, $10\log_{10}A^2 = 20\log_{10}A$. That is where the 20 comes from, and why doubling a gain adds $6\,\mathrm{dB}$ rather than $3$.
:::

::: context asymptote-picture Straight lines versus the true curve
Magnitude of $1/(1 + s/p)$ over three decades. The grey straight lines are the asymptotes: flat, then $-20\,\mathrm{dB}$ per decade from the corner. The blue curve is exact. The biggest gap is at the corner, $3\,\mathrm{dB}$; a decade away the two agree within $0.04\,\mathrm{dB}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="20" x2="40" y2="160" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="160" x2="345" y2="160" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#6c7a93" stroke-width="2" stroke-dasharray="6 3" points="40,30 140,30 340,123.3"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40.0,30.1 50.0,30.2 60.0,30.3 70.0,30.4 80.0,30.6 90.0,31.0 100.0,31.5 110.0,32.3 120.0,33.4 130.0,35.0 140.0,37.0 150.0,39.6 160.0,42.7 170.0,46.3 180.0,50.2 190.0,54.3 200.0,58.6 210.0,63.1 220.0,67.6 230.0,72.2 240.0,76.8 250.0,81.4 260.0,86.0 270.0,90.7 280.0,95.3 290.0,100.0 300.0,104.7 310.0,109.3 320.0,114.0 330.0,118.7 340.0,123.3"/>
  <circle cx="140" cy="37" r="3.5" fill="#b4232c"/>
  <text x="148" y="24" font-size="11" fill="#b4232c">−3 dB at the corner</text>
  <text x="34" y="34" font-size="11" fill="#1f2a44" text-anchor="end">0</text>
  <text x="34" y="127" font-size="11" fill="#1f2a44" text-anchor="end">−40</text>
  <text x="40" y="174" font-size="11" fill="#1f2a44" text-anchor="middle">p/10</text>
  <text x="140" y="174" font-size="11" fill="#1f2a44" text-anchor="middle">p</text>
  <text x="240" y="174" font-size="11" fill="#1f2a44" text-anchor="middle">10p</text>
  <text x="340" y="174" font-size="11" fill="#1f2a44" text-anchor="middle">100p</text>
</svg>
```
:::

::: context resonance-picture How damping shapes the peak
Magnitude of the complex pair over two decades around $\omega_n$, for $\zeta = 0.1$ (red, $+14\,\mathrm{dB}$ peak), $\zeta = 0.3$ (orange, $+4.8\,\mathrm{dB}$) and $\zeta = 0.707$ (blue, no peak). Grey: the straight lines, flat then $-40\,\mathrm{dB}$ per decade. Far from $\omega_n$ all three agree with them.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="15" x2="40" y2="182" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="182" x2="345" y2="182" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#6c7a93" stroke-width="2" stroke-dasharray="6 3" points="40,65.7 190,65.7 340,180"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="40.0,65.7 62.5,65.7 85.0,65.7 107.5,65.8 122.5,65.9 137.5,66.2 145.0,66.5 152.5,66.9 160.0,67.5 167.5,68.5 175.0,69.9 182.5,71.8 190.0,74.3 197.5,77.5 205.0,81.3 212.5,85.6 220.0,90.4 227.5,95.5 235.0,100.8 242.5,106.2 250.0,111.7 257.5,117.3 265.0,123.0 272.5,128.6 280.0,134.3 287.5,140.0 295.0,145.7 302.5,151.4 310.0,157.2 317.5,162.9 325.0,168.6 332.5,174.3 340.0,180.0"/>
  <polyline fill="none" stroke="#f2b880" stroke-width="2.5" points="40.0,65.5 62.5,65.3 85.0,64.9 107.5,64.1 122.5,63.1 137.5,61.5 145.0,60.4 152.5,59.0 160.0,57.3 167.5,55.2 175.0,53.2 178.8,52.3 182.5,51.9 186.2,52.1 190.0,53.0 197.5,57.6 205.0,64.6 212.5,72.4 220.0,80.1 227.5,87.6 235.0,94.7 242.5,101.5 250.0,108.1 257.5,114.5 265.0,120.8 272.5,126.9 280.0,133.0 287.5,139.0 295.0,144.9 302.5,150.8 310.0,156.6 317.5,162.4 325.0,168.2 332.5,174.0 340.0,179.8"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2" points="40.0,65.5 62.5,65.2 85.0,64.7 107.5,63.7 122.5,62.5 137.5,60.3 145.0,58.8 152.5,56.6 160.0,53.6 167.5,49.4 171.2,46.6 175.0,43.1 178.8,38.7 182.5,33.4 186.2,27.9 190.0,25.8 193.8,30.8 197.5,39.1 201.2,47.3 205.0,54.5 212.5,66.6 220.0,76.5 227.5,85.2 235.0,93.0 242.5,100.3 250.0,107.3 257.5,113.9 265.0,120.3 272.5,126.6 280.0,132.7 287.5,138.8 295.0,144.7 302.5,150.6 310.0,156.5 317.5,162.4 325.0,168.2 332.5,174.0 340.0,179.8"/>
  <text x="34" y="70" font-size="11" fill="#1f2a44" text-anchor="end">0 dB</text>
  <text x="40" y="196" font-size="11" fill="#1f2a44" text-anchor="middle">ωn/10</text>
  <text x="190" y="196" font-size="11" fill="#1f2a44" text-anchor="middle">ωn</text>
  <text x="340" y="196" font-size="11" fill="#1f2a44" text-anchor="middle">10ωn</text>
  <text x="200" y="24" font-size="11" fill="#b4232c">ζ = 0.1</text>
</svg>
```
:::

::: context unwrap Why phase wraps around
A computer finds the angle of a complex number with a function like `atan2`, which always answers between $-180^\circ$ and $+180^\circ$. An angle of $-219.3^\circ$ points the same way as $+140.7^\circ$, so that is what it reports. Unwrapping walks along the frequencies and adds or subtracts $360^\circ$ whenever the angle jumps by more than $180^\circ$ between neighbors, rebuilding the smooth curve. NumPy's `np.unwrap` does this — on radians, so convert to degrees after.
:::

::: context relative-degree Relative degree
Count the poles, count the zeros, subtract: that is the **relative degree**. At very high frequency each pole contributes $-90^\circ$ and each zero $+90^\circ$ (for left-half-plane factors), so the phase heads to $-90^\circ$ times the relative degree. The example loop has three poles and no zeros, so its phase must head to $-270^\circ$. The magnitude slope heads to $-20\,\mathrm{dB}$ per decade times the same number. "Strictly proper" means relative degree at least 1, so the gain dies away at high frequency, as every physical system's does.
:::

::: context nyquist-name Harry Nyquist
Harry Nyquist (1889–1976), Bode's colleague at Bell Labs, published his stability criterion in 1932. It counts how many times the polar curve of $L(j\omega)$ circles the critical point $-1$ to decide whether the closed loop is stable, without ever solving for its poles. It works directly from measured frequency-response data, and it handles delays, which have no poles to find. The next module teaches it in full.
:::

::: context polar-picture The loop as one curve
The polar plot of $L = 200/[s(s+2)(s+20)]$ from $\omega = 1.3\,\mathrm{rad/s}$ up. Grey: the unit circle. The curve crosses it at $2.85\,\mathrm{rad/s}$, $27^\circ$ below the negative real axis (the phase margin), and crosses that axis at $-0.227$ (gain margin $4.4$). The red line is the closest approach to $-1$: $0.402$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="70" x2="350" y2="70" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="250" y1="10" x2="250" y2="215" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="250" cy="70" r="100" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="98.1,212.5 101.9,204.5 105.7,196.8 109.5,189.4 115.2,178.9 119.0,172.3 122.9,166.0 126.7,159.9 130.4,154.1 134.2,148.6 137.9,143.4 141.6,138.4 145.3,133.7 148.9,129.2 152.4,124.9 155.9,120.9 159.4,117.1 162.7,113.5 166.1,110.1 169.3,106.9 172.5,103.9 175.6,101.0 178.6,98.4 183.0,94.7 187.2,91.4 191.3,88.4 195.1,85.8 198.8,83.4 202.3,81.2 206.6,78.7 210.7,76.6 214.5,74.8 218.7,73.0 222.6,71.5 226.7,70.2 230.8,69.1 234.8,68.3 239.1,67.8 243.2,67.7 247.2,68.3 250.0,70.0"/>
  <circle cx="150" cy="70" r="4" fill="#b4232c"/>
  <text x="150" y="58" font-size="12" fill="#b4232c" text-anchor="middle">−1</text>
  <line x1="150" y1="70" x2="176.6" y2="100.2" stroke="#b4232c" stroke-width="2"/>
  <text x="120" y="112" font-size="11" fill="#b4232c">0.402</text>
  <circle cx="160.9" cy="115.4" r="3.5" fill="#1f2a44"/>
  <text x="80" y="135" font-size="11" fill="#1f2a44">ωc = 2.85</text>
  <circle cx="227.3" cy="70" r="3.5" fill="#1f2a44"/>
  <text x="222" y="58" font-size="11" fill="#1f2a44" text-anchor="middle">−0.227</text>
  <text x="344" y="84" font-size="11" fill="#1f2a44" text-anchor="end">Re</text>
  <text x="256" y="22" font-size="11" fill="#1f2a44">Im</text>
</svg>
```
:::
