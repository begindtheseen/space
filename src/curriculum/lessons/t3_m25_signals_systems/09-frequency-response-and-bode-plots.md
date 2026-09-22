---
id: l09-frequency-response-and-bode-plots
title: Frequency response and Bode plot construction by hand
minutes: 18
covers:
  - "Frequency response: magnitude and phase; Bode plot construction by hand"
---

This is the lesson the rest of the control tier stands on. Every design method you will meet after it — lead-lag, PID tuning by loop shaping, notch filters, robustness margins, even the optimal methods — is carried out on a picture of magnitude and phase against frequency. If you can draw that picture from a transfer function in ninety seconds on a whiteboard, and read a crossover frequency, a phase margin and a resonance off it, you can hold your own in any control review. If you cannot, you will be stuck waiting for someone else's plot.

There is a practical reason the frequency domain dominates, beyond habit. It is what you can *measure*. Shake an actuator with a swept sine and you get magnitude and phase directly, with no model assumed and no differentiation of noisy data. It is also where the description composes: series blocks multiply, and on logarithmic axes multiplication is addition, so a plant, an actuator, a filter and a controller are drawn once each and stacked. And it is where a fundamental limit shows itself plainly — a right-half-plane zero, a delay and a structural mode each have an unmistakable frequency-domain signature that no time-domain plot makes obvious.

This lesson defines the frequency response, sets up decibels and decades, gives the five building blocks and their asymptotes, walks a full hand construction with the exact answer computed alongside, and finishes with the same data plotted the other way — as a curve in the complex plane, which is where the critical point $-1$ lives.

## Magnitude and phase

From lesson 1, an LTI system driven by $e^{st}$ returns $G(s)e^{st}$. Put $s = j\omega$ and take real parts: a sinusoid in gives a sinusoid out at the same frequency,

$$
u(t) = A\cos\omega t \quad\Longrightarrow\quad y_{ss}(t) = A\,\lvert G(j\omega)\rvert\cos\left(\omega t + \angle G(j\omega)\right).
$$

$G(j\omega)$ is the **frequency response**: a complex number at each frequency whose modulus is the gain and whose argument is the phase shift. Negative phase is lag — the output arrives late by $-\angle G/\omega$ seconds.

Evaluating it is mechanical. Substitute $s = j\omega$ into the transfer function and reduce the complex arithmetic. For a product of factors, magnitudes multiply and phases add:

$$
\left\lvert \frac{N_1N_2}{D_1D_2}\right\rvert = \frac{\lvert N_1\rvert\lvert N_2\rvert}{\lvert D_1\rvert\lvert D_2\rvert}, \qquad \angle\frac{N_1N_2}{D_1D_2} = \angle N_1 + \angle N_2 - \angle D_1 - \angle D_2.
$$

That second line is the whole reason hand sketching works.

## Decibels, decades, and the logarithmic axes

A **Bode plot** is two stacked graphs against $\log_{10}\omega$: magnitude in decibels, $20\log_{10}\lvert G\rvert$, and phase in degrees. Logarithms turn the products above into sums, so each factor contributes an independent curve that you add graphically.

Values to know without a calculator:

| ratio | $\tfrac{1}{2}$ | $\tfrac{1}{\sqrt2}$ | 1 | $\sqrt2$ | 2 | 5 | 10 | 100 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| dB | $-6.0$ | $-3.0$ | 0 | $+3.0$ | $+6.0$ | $+14.0$ | $+20$ | $+40$ |

A **decade** is a factor of ten in frequency, an **octave** a factor of two. A slope of $-20\,\mathrm{dB}$ per decade is the same as $-6\,\mathrm{dB}$ per octave and means $\lvert G\rvert \propto 1/\omega$.

## The building blocks

Every rational transfer function in time-constant form is a product of five kinds of factor. Learn what each one does and you can draw anything.

**Constant $K$.** Magnitude $20\log_{10}\lvert K\rvert$ at every frequency, flat. Phase $0^\circ$ if $K > 0$, $-180^\circ$ if $K < 0$.

**Pole or zero at the origin, $s^{\pm n}$.** A factor $1/s$ gives magnitude $1/\omega$ — a straight line of slope $-20\,\mathrm{dB}$/decade passing through $0\,\mathrm{dB}$ at $\omega = 1\,\mathrm{rad/s}$ — and a constant phase of $-90^\circ$. A factor $s$ mirrors it: $+20\,\mathrm{dB}$/decade and $+90^\circ$. No corner, no curvature, no approximation; these are exact.

**Real pole $1/(1 + s/p)$.** Below the **corner frequency** $p$ the factor is 1 ($0\,\mathrm{dB}$); above it the magnitude falls at $-20\,\mathrm{dB}$/decade. The two asymptotes meet at $\omega = p$, where the true value is $-3.01\,\mathrm{dB}$ — the largest error the straight-line sketch makes, and it is worth drawing in. The phase runs from $0^\circ$ to $-90^\circ$, passing exactly $-45^\circ$ at the corner. Exact values:

| $\omega/p$ | 0.1 | 0.5 | 1 | 2 | 10 |
| --- | --- | --- | --- | --- | --- |
| magnitude | $-0.04\,\mathrm{dB}$ | $-0.97\,\mathrm{dB}$ | $-3.01\,\mathrm{dB}$ | $-6.99\,\mathrm{dB}$ | $-20.04\,\mathrm{dB}$ |
| phase | $-5.7^\circ$ | $-26.6^\circ$ | $-45^\circ$ | $-63.4^\circ$ | $-84.3^\circ$ |

So the phase transition is effectively spread over a decade either side of the corner, and the straight-line phase approximation draws it as a ramp from $0^\circ$ at $p/10$ to $-90^\circ$ at $10p$.

**Real zero $(1 + s/z)$.** The exact mirror image: $+20\,\mathrm{dB}$/decade above the corner, $+3.01\,\mathrm{dB}$ at the corner, phase from $0^\circ$ to $+90^\circ$ through $+45^\circ$. A **right-half-plane** zero $(1 - s/z)$ has the same magnitude and the *opposite* phase, $0^\circ$ to $-90^\circ$ — lesson 7.

**Complex pair $1/\left(1 + 2\zeta s/\omega_n + s^2/\omega_n^2\right)$.** Below $\omega_n$ it is $0\,\mathrm{dB}$; above it the magnitude falls at $-40\,\mathrm{dB}$/decade. The phase runs $0^\circ$ to $-180^\circ$, passing exactly $-90^\circ$ at $\omega_n$ whatever the damping. What the asymptotes miss is the peak: at $\omega = \omega_n$ the exact magnitude is $1/(2\zeta)$, and the true maximum is

$$
M_r = \frac{1}{2\zeta\sqrt{1 - \zeta^2}} \quad\text{at}\quad \omega_r = \omega_n\sqrt{1 - 2\zeta^2}, \qquad \zeta < \frac{1}{\sqrt{2}}.
$$

| $\zeta$ | 0.005 | 0.05 | 0.1 | 0.3 | 0.5 | 0.707 |
| --- | --- | --- | --- | --- | --- | --- |
| $M_r$ | $40.0\,\mathrm{dB}$ | $20.0\,\mathrm{dB}$ | $14.0\,\mathrm{dB}$ | $4.8\,\mathrm{dB}$ | $1.2\,\mathrm{dB}$ | $0\,\mathrm{dB}$ |

For $\zeta \ge 1/\sqrt{2}$ there is no peak at all. A bending mode with $\zeta = 0.005$ pokes $40\,\mathrm{dB}$ above the asymptote over a band a few percent wide, and its phase swings almost $180^\circ$ across that band — which is why lesson 6 refused to neglect it.

**Delay $e^{-sT}$.** $0\,\mathrm{dB}$ everywhere, phase $-57.3\,\omega T$ degrees. It touches only the lower plot.

::: key
Bode asymptote bookkeeping. Each real pole: $-20\,\mathrm{dB}$/decade above its corner and $-90^\circ$ of phase, spread over a decade either side of the corner. Each real zero: $+20\,\mathrm{dB}$/decade and $+90^\circ$. A complex pair counts double: $\mp40\,\mathrm{dB}$/decade and $\mp180^\circ$. A pole at the origin: $-20\,\mathrm{dB}$/decade everywhere and a constant $-90^\circ$. Corrections at a corner: $\mp3\,\mathrm{dB}$ for a real factor, $1/(2\zeta)$ for a complex pair.
:::

## Constructing the plot by hand

The procedure, in order:

1. **Put $G$ in time-constant form**, $K\prod(1 + s/z_i)/\left[s^n\prod(1 + s/p_i)\right]$. This is the step people skip and then wonder why their plot sits at the wrong level.
2. **Start at low frequency.** Below the lowest corner, $G \approx K/(j\omega)^n$. Pick a convenient frequency, compute $\lvert G\rvert$ there in dB, and draw a line of slope $-20n\,\mathrm{dB}$/decade through it.
3. **March up through the corners.** At each corner add its slope contribution: $-20$ for a real pole, $+20$ for a real zero, $\mp40$ for a complex pair.
4. **Correct at the corners.** Drop $3\,\mathrm{dB}$ at a real pole, add $3\,\mathrm{dB}$ at a real zero, draw the resonant peak $1/(2\zeta)$ at a complex pair.
5. **Do the phase separately** by adding each factor's contribution at a few frequencies. Exact arctangents are faster than the straight-line rule and no harder.

::: example Sketching a rate loop, then checking it
Take the loop transfer function

$$
L(s) = \frac{200}{s(s + 2)(s + 20)}.
$$

**Time-constant form.** Factor the constants out of each bracket: $200/\left[s \cdot 2(1 + s/2) \cdot 20(1 + s/20)\right] = \dfrac{5}{s(1 + s/2)(1 + s/20)}$. So $K = 5$, one integrator, corners at $2$ and $20\,\mathrm{rad/s}$.

**Low frequency.** $\lvert L\rvert \approx 5/\omega$. At $\omega = 0.1$: $50$, or $34\,\mathrm{dB}$; slope $-20\,\mathrm{dB}$/decade. (Exact: $33.97\,\mathrm{dB}$.)

**Corners.** At $\omega = 2$ the asymptote is $5/2 = 2.5 = 7.96\,\mathrm{dB}$ and the slope steepens to $-40$. At $\omega = 20$ it steepens to $-60$. The middle asymptote is $\lvert L\rvert \approx 5/(\omega \cdot \omega/2) = 10/\omega^2$.

**Crossover from the sketch.** Set the middle asymptote to 1: $\omega = \sqrt{10} = 3.16\,\mathrm{rad/s}$.

**Phase at that frequency.** $\angle L = -90^\circ - \arctan(3.16/2) - \arctan(3.16/20) = -90^\circ - 57.7^\circ - 9.0^\circ = -156.7^\circ$, so the sketch predicts a phase margin of $23.3^\circ$.

**Now the exact answer.** $\lvert L\rvert = 200/\left(\omega\sqrt{\omega^2 + 4}\sqrt{\omega^2 + 400}\right) = 1$ gives $\omega_c = 2.846\,\mathrm{rad/s}$, where the phase is $-90^\circ - 54.9^\circ - 8.1^\circ = -153.0^\circ$ and $\mathrm{PM} = 27.0^\circ$. The sketch put crossover 11% high and the margin $3.7^\circ$ low, because it ignored the $3\,\mathrm{dB}$ correction at the corner at 2 — which sits close to crossover. That is the normal size of a hand-sketch error and it is exactly why you sketch first and compute second, not instead.

**The other margin.** The phase reaches $-180^\circ$ where $\arctan(\omega/2) + \arctan(\omega/20) = 90^\circ$, which happens when the two angles are complementary, that is when $(\omega/2)(\omega/20) = 1$: $\omega_{180} = \sqrt{2 \times 20} = 6.325\,\mathrm{rad/s}$. There

$$
\lvert L(j\omega_{180})\rvert = \frac{K}{ab(a + b)} = \frac{200}{2 \times 20 \times 22} = 0.2273,
$$

using the general result for $K/\left[s(s+a)(s+b)\right]$. The gain margin is its reciprocal, $\mathrm{GM} = 4.40 = 12.9\,\mathrm{dB}$: the loop gain could be raised by a factor of 4.4 before the closed loop goes unstable. The delay margin (lesson 8) is $\mathrm{PM}/\omega_c = 0.4712/2.846 = 166\,\mathrm{ms}$.
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
Unwrap the phase. A library that returns the principal argument reports the phase at $\omega = 20$ in the example above as $+140.7^\circ$ when the physically meaningful value is $-219.3^\circ$. A wrapped phase plot looks as though the loop recovered $360^\circ$ of margin it never had, and it makes the phase crossover impossible to find. Always unwrap, and always sanity-check the high-frequency phase against the relative degree: a strictly proper $G$ of relative degree $r$ must approach $-90r$ degrees.
:::

## Crossover and margins

Two frequencies matter on a loop transfer function $L(s) = $ (controller)(actuator)(plant)(sensor), the product around the loop:

- **Gain crossover** $\omega_c$: where $\lvert L(j\omega_c)\rvert = 1$ ($0\,\mathrm{dB}$). This is the loop's bandwidth, roughly: below it the loop follows commands and rejects disturbances, above it the loop does nothing.
- **Phase crossover** $\omega_{180}$: where $\angle L = -180^\circ$.

From them,

$$
\mathrm{PM} = 180^\circ + \angle L(j\omega_c), \qquad \mathrm{GM} = \frac{1}{\lvert L(j\omega_{180})\rvert}.
$$

A rule of thumb worth carrying: the closed loop's damping is roughly $\zeta \approx \mathrm{PM}/100$ for margins up to about $60^\circ$, so $\mathrm{PM} = 50^\circ$ corresponds to about $\zeta = 0.5$ and 16% overshoot. And a loop that crosses over at $-20\,\mathrm{dB}$/decade has good margins almost automatically, while one crossing at $-40$ is marginal and one at $-60$ is unstable — because the slope at crossover and the phase there are tied together for minimum-phase systems. The machinery behind that link, and the full Nyquist stability criterion, belong to the next module; what you need here is the habit of looking at the slope where the curve passes $0\,\mathrm{dB}$.

::: example A flexible spacecraft's frequency response
Lesson 4's hub-measured response, torque to hub angle, was

$$
\frac{\Theta_1}{U} = \frac{J_2s^2 + cs + k}{s^2\left[J_1J_2s^2 + (J_1+J_2)cs + (J_1+J_2)k\right]}.
$$

In time-constant form, with $J_1 = 1200$, $J_2 = 150\,\mathrm{kg\,m^2}$, $k = 600\,\mathrm{N\,m/rad}$, $c = 3\,\mathrm{N\,m\,s/rad}$:

$$
\frac{\Theta_1}{U} = \frac{1}{(J_1 + J_2)s^2}\cdot\frac{1 + 2\zeta_zs/\omega_z + s^2/\omega_z^2}{1 + 2\zeta_fs/\omega_f + s^2/\omega_f^2}, \quad \omega_z = 2.000,\ \zeta_z = 0.0050,\ \omega_f = 2.121,\ \zeta_f = 0.0053.
$$

Sketch it in two pieces. The rigid part is $1/(1350\,\omega^2)$: a $-40\,\mathrm{dB}$/decade line with a constant phase of $-180^\circ$, passing $-22.6\,\mathrm{dB}$ at $\omega = 0.1\,\mathrm{rad/s}$. The flexible part is 1 (that is $0\,\mathrm{dB}$, $0^\circ$) everywhere except in a narrow band around $2\,\mathrm{rad/s}$, where the zero pair and the pole pair each do their $\mp40\,\mathrm{dB}$/decade and $\mp180^\circ$ within a few percent of frequency.

The exact numbers show how sharp "narrow" is:

| $\omega$ | magnitude | phase | ratio to the rigid line |
| --- | --- | --- | --- |
| 1.000 | $-62.9\,\mathrm{dB}$ | $-180.0^\circ$ | 0.96 |
| 1.900 | $-79.9\,\mathrm{dB}$ | $-177.2^\circ$ | 0.49 |
| 2.000 | $-95.6\,\mathrm{dB}$ | $-95.1^\circ$ | 0.090 |
| 2.050 | $-77.3\,\mathrm{dB}$ | $-20.3^\circ$ | 0.77 |
| 2.121 | $-54.2\,\mathrm{dB}$ | $-94.9^\circ$ | 11.8 |
| 2.200 | $-67.5\,\mathrm{dB}$ | $-174.7^\circ$ | 2.75 |
| 3.000 | $-79.8\,\mathrm{dB}$ | $-179.8^\circ$ | 1.25 |

Between $2.00$ and $2.12\,\mathrm{rad/s}$ — six percent of frequency — the magnitude swings $41\,\mathrm{dB}$ and the phase swings $160^\circ$ and comes back. Outside $1.9$ to $2.2\,\mathrm{rad/s}$ the plot is indistinguishable from a bare double integrator.

Two lessons in this. First, the resonant peak reaches only $11.8\times$ the rigid asymptote rather than the $1/(2\zeta_f) = 94\times$ a lone mode would give, because the antiresonance at $2.000\,\mathrm{rad/s}$ sits right beside it and pulls the curve down first. Zero-pole pairs this close always partly cancel. Second, the phase *returns*: it dips at the zero, swings up, dips again at the pole and recovers to $-180^\circ$. That round trip, not a one-way loss, is the signature of a collocated sensor and actuator, and it is why a hub-mounted gyro is so much easier to close a loop around than a tip-mounted one.
:::

## The same data as a polar plot

A Bode plot is two graphs of one complex function. The alternative is to plot that complex number directly: mark $L(j\omega)$ in the complex plane as $\omega$ runs from $0$ to $\infty$, and you get the **polar plot**, the core of a Nyquist diagram. Nothing new is in it; what changes is what is easy to see.

The critical point is $-1 + 0j$. Its importance is immediate from the closed-loop denominator $1 + L(s)$: if $L(j\omega) = -1$ at some frequency, then $1 + L = 0$ there, the closed loop has a pole on the imaginary axis, and it oscillates forever at that frequency. So the distance of the curve from $-1$ is a measure of how close the loop is to instability. Reading it off:

- Where the curve crosses the unit circle, the angle back to the negative real axis is the **phase margin**.
- Where it crosses the negative real axis, at $-1/\mathrm{GM}$, the reciprocal of that distance is the **gain margin**.
- The shortest distance from $-1$ to the curve, $\min_\omega\lvert 1 + L(j\omega)\rvert$, is a single number that captures both at once. It is the **modulus margin**, and its reciprocal is the peak of the sensitivity function of lesson 12.

For the loop $L = 200/\left[s(s+2)(s+20)\right]$ above, the curve starts at infinity along the $-90^\circ$ direction (the integrator), sweeps clockwise, crosses the unit circle at $2.846\,\mathrm{rad/s}$ at an angle of $27.0^\circ$ from the negative real axis, crosses the negative real axis at $-0.2273$ (giving $\mathrm{GM} = 4.40$), and spirals into the origin at $-270^\circ$. Its closest approach to $-1$ is $0.402$, at $\omega = 3.25\,\mathrm{rad/s}$, so the peak sensitivity is $1/0.402 = 2.49$, or $7.9\,\mathrm{dB}$.

That last number is the honest one. Gain margin and phase margin each perturb the loop in one direction only, and a loop can have $12.9\,\mathrm{dB}$ of gain margin and $27^\circ$ of phase margin while passing within $0.40$ of the critical point — comfortable on each axis separately and mediocre in combination. Which is why the next module treats the Nyquist plot and the modulus margin properly, and why you should learn to draw both pictures from the same $G(j\omega)$.

## Check yourself

::: check
For $G(s) = \dfrac{50}{s(s + 5)}$, find the gain crossover frequency and the phase margin, by hand.
:::

::: answer
Time-constant form: $50/\left[5s(1 + s/5)\right] = 10/\left[s(1 + s/5)\right]$. Below $5\,\mathrm{rad/s}$ the magnitude is $10/\omega$, so the low-frequency asymptote alone would cross $0\,\mathrm{dB}$ at $10\,\mathrm{rad/s}$ — but that is past the corner, so the second segment decides. Exactly: $\lvert G\rvert = 50/\left(\omega\sqrt{\omega^2 + 25}\right) = 1$ gives $\omega^2(\omega^2 + 25) = 2500$; with $x = \omega^2$, $x^2 + 25x - 2500 = 0$ and $x = (-25 + \sqrt{625 + 10000})/2 = 39.04$, so $\omega_c = 6.25\,\mathrm{rad/s}$. Phase: $-90^\circ - \arctan(6.25/5) = -90^\circ - 51.3^\circ = -141.3^\circ$, so $\mathrm{PM} = 38.7^\circ$. Being able to do this arithmetic on a whiteboard is a standard screening question, and the pattern — set the squared magnitude to 1, solve the quadratic in $\omega^2$ — is the same for every plant of this shape.
:::

::: check
A plant is $G(s) = \dfrac{1 - s}{1 + s}$. Sketch its Bode plot and say what it does to a loop.
:::

::: answer
Numerator and denominator have the same magnitude at every frequency, $\sqrt{1 + \omega^2}$, so $\lvert G(j\omega)\rvert = 1$ exactly: the magnitude plot is a flat $0\,\mathrm{dB}$ line, with no corner visible at all. The phase is $\arctan(-\omega) - \arctan(\omega) = -2\arctan\omega$: $-11.4^\circ$ at $0.1\,\mathrm{rad/s}$, $-53.1^\circ$ at $0.5$, $-90^\circ$ at $1$, $-126.9^\circ$ at $2$, tending to $-180^\circ$. This is an all-pass, the non-minimum-phase element of lesson 7 with $z = 1$. In a loop it changes no gain anywhere and removes phase everywhere, so it cannot be compensated by gain adjustment and it forces crossover well below $1\,\mathrm{rad/s}$ — the same conclusion as for a delay, which is what it resembles.
:::

::: check
A loop has $L(s) = \dfrac{K}{s^2}$. What is its phase margin for any $K$, and what does that tell you about controlling a rigid body with proportional feedback alone?
:::

::: answer
$\angle L = -180^\circ$ at every frequency, so wherever crossover happens the phase margin is exactly $0^\circ$ and the gain margin is $1$ ($0\,\mathrm{dB}$). Changing $K$ moves $\omega_c = \sqrt{K}$ but changes nothing else: the closed-loop poles sit at $\pm j\sqrt{K}$, on the imaginary axis, and the vehicle oscillates forever. A rigid body from torque to attitude is exactly $1/(Is^2)$, so proportional attitude feedback alone is never enough — you must add phase near crossover, which is what a derivative term, a lead compensator or a rate inner loop does. This single fact is the reason every attitude control system in existence has rate feedback in it somewhere.
:::

::: check
An actuator has $\omega_n = 62.8\,\mathrm{rad/s}$ and $\zeta = 0.7$; a structural mode has $\omega_n = 20\,\mathrm{rad/s}$ and $\zeta = 0.004$. Compare what each does to a Bode magnitude plot near its own corner.
:::

::: answer
The actuator, at $\zeta = 0.7$, sits slightly below the threshold $1/\sqrt2 = 0.707$ at which a resonant peak appears, so its magnitude has essentially no peak: at $\omega_n$ it is $1/(2\zeta) = 0.714$, that is $-2.9\,\mathrm{dB}$, and it rolls off at $-40\,\mathrm{dB}$/decade above. The curve is smooth over a decade either side and a straight-line sketch is accurate within $3\,\mathrm{dB}$. The structural mode, at $\zeta = 0.004$, peaks at $M_r = 1/(2\zeta\sqrt{1 - \zeta^2}) = 125$, that is $+41.9\,\mathrm{dB}$, within a fraction of a percent of $20\,\mathrm{rad/s}$, and its phase falls $180^\circ$ across a band roughly $2\zeta\omega_n = 0.16\,\mathrm{rad/s}$ wide. On a plot with one point per decade you would miss it completely. Always grid the frequency axis finely enough that $2\zeta\omega_n$ spans several points.
:::

::: check
Why does putting a transfer function in time-constant form matter before sketching, and what goes wrong if you use pole-zero form instead?
:::

::: answer
The sketch is built by starting from a low-frequency level and adding slopes at corners, and that starting level is $K = G(0)$ (or, with $n$ integrators, the constant in $K/(j\omega)^n$). In time-constant form every factor equals 1 below its corner, so the only thing setting the level is $K$ and the construction is self-consistent. In pole-zero form the leading constant is $k$, the ratio of leading coefficients, and each factor $(s + p)$ equals $p$ rather than 1 at low frequency, so the level is $k\prod z_i/\prod p_i$ — a product you must compute separately and will get wrong under time pressure. For $L = 200/\left[s(s+2)(s+20)\right]$, $k = 200$ while $K = 5$: a level error of $32\,\mathrm{dB}$, which is a factor of forty in crossover gain. The slopes and corner frequencies come out right either way; it is the height of the curve that goes wrong.
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

So far every transfer function has been handed to you. The next lesson builds them: how to reduce an arbitrary block diagram — cascades, inner loops, feedforward paths — to a single ratio of polynomials, by algebra and by the Mason gain formula.
