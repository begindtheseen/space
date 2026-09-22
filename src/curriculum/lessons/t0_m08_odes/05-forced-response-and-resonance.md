---
id: l05-forced-response-and-resonance
title: Forced response and resonance
minutes: 18
covers:
  - forced response and resonance
---

Lessons 2 and 3 let the second-order system move on its own: release it from an initial condition and watch the free response die away. A vehicle is never left alone like that. Its actuators are driven by commands, its structure is shaken by engine thrust and aerodynamic buffet, its sensors ride on a body that vibrates. The question this lesson answers is what a second-order system does when it is pushed *continuously* — by a step, by a ramp, and above all by a sinusoid — and the one-word answer that matters most is **resonance**.

Resonance is the reason a flexible booster's bending mode is on every launch-vehicle controller's list of things that can end the flight. Lesson 3 showed that the first bending mode of a large vehicle rings for almost a minute after a single disturbance. This lesson shows the other side of the same fact: drive that mode at its own frequency and it amplifies the input a hundredfold. The same mathematics, with moderate damping, gives the bandwidth of a thrust-vector actuator and the tracking error of a pitch-rate loop, and it introduces the object the whole control track is built on: the response of a linear system to a sinusoid, as a magnitude and a phase at each frequency.

The lesson first sets up the general forced problem and the method of undetermined coefficients, then works through steps and ramps quickly, and spends most of its time on the sinusoid. It derives the magnitude and phase curves of the canonical second-order system, locates the resonant peak, explains why $\zeta = 0.707$ is the flattest choice, and finishes with the transient that builds a resonance up from rest.

## The forced equation and where its solution comes from

Return to the canonical form of lesson 3 with the input switched on:

$$
\ddot{y} + 2\zeta\omega_n\dot{y} + \omega_n^2 y = \omega_n^2 u(t).
$$

The input $u(t)$ is the **forcing**: a commanded angle, a disturbance torque divided by the stiffness, an acceleration of the base a sensor is bolted to. Lesson 2 established the structure of every solution: pick *any one* solution $y_p(t)$ of the forced equation — the **particular solution** — and add the full free response,

$$
y(t) = y_p(t) + e^{-\zeta\omega_n t}\bigl(C_1\cos\omega_d t + C_2\sin\omega_d t\bigr),
$$

with $C_1$, $C_2$ chosen so that the *whole* $y$ matches the initial conditions. For a stable system the free part decays, so after a few time constants $1/(\zeta\omega_n)$ only $y_p$ remains. That is why $y_p$ is also called the **steady-state response**, and the free part the **transient**. The system decides how it forgets; the input decides where it ends up.

Finding $y_p$ for the inputs that matter is easy because of a property of the equation: differentiating a polynomial gives a polynomial of lower degree, differentiating an exponential gives the same exponential, and differentiating a sinusoid gives a sinusoid of the same frequency. So if $u$ is one of these, guess a $y_p$ of the same shape with unknown coefficients, substitute, and match terms. This is the **method of undetermined coefficients**. The three cases you need on a vehicle:

| Input $u(t)$ | Guess for $y_p$ |
| --- | --- |
| constant $U$ | constant $Y$ |
| ramp $rt$ | $Yt + Z$ |
| $A\cos\omega t$ | $P\cos\omega t + Q\sin\omega t$, or $\mathrm{Re}\{Ye^{j\omega t}\}$ |

The guess fails only if it coincides with a free-response mode — an undamped system driven exactly at $\omega_n$ — and that case is exactly resonance, treated below.

### Step and ramp

For a constant input $U$ the guess $y_p = Y$ has zero derivatives, so $\omega_n^2 Y = \omega_n^2 U$ and $y_p = U$: the output settles at the command, which is what the unit steady-state gain in the canonical form was designed to do. Lesson 3 already built the complete step response on this.

For a ramp $u = rt$ — a slewing attitude command, a constant-rate gimbal sweep — guess $y_p = Yt + Z$. Then $\dot{y}_p = Y$, $\ddot{y}_p = 0$, and substituting,

$$
2\zeta\omega_n Y + \omega_n^2(Yt + Z) = \omega_n^2 rt \quad\Longrightarrow\quad Y = r, \qquad Z = -\frac{2\zeta r}{\omega_n}.
$$

So

$$
y_p(t) = r\left(t - \frac{2\zeta}{\omega_n}\right).
$$

The output follows the ramp at the right rate but *behind* it, by $2\zeta/\omega_n$ seconds or, equivalently, by $2\zeta r/\omega_n$ in value. This is the second-order analogue of the one-time-constant lag of lesson 1 (there the delay was $\tau$; here $2\zeta/\omega_n$ plays the same role and is in fact the coefficient of $s$ in the characteristic polynomial divided by the constant term). The TVC actuator of lesson 3, with $\omega_n = 40\,\mathrm{rad/s}$ and $\zeta = 0.6$, follows a slew $2 \times 0.6/40 = 0.03\,\mathrm{s}$ late; during a $10^\circ/\mathrm{s}$ sweep the nozzle sits $0.3^\circ$ behind its command. The pitch-rate loop with poles at $-1.5 \pm 2j$ ($\omega_n = 2.5$, $\zeta = 0.6$) lags a ramp by $0.48\,\mathrm{s}$ — sixteen times longer, because it is sixteen times slower.

::: key
Ramp response of the canonical second-order system: steady state $y_p = r(t - 2\zeta/\omega_n)$. The output follows the ramp delayed by $2\zeta/\omega_n$ seconds. Step response: steady state $y_p = U$, the free response carries the transient.
:::

## The sinusoidal response

Now the input that matters most: $u(t) = A\cos\omega t$ with driving frequency $\omega$, which is *not* in general equal to $\omega_n$. Guess $y_p = P\cos\omega t + Q\sin\omega t$. The derivatives are $\dot{y}_p = -P\omega\sin\omega t + Q\omega\cos\omega t$ and $\ddot{y}_p = -\omega^2 y_p$. Substitute and collect the $\cos\omega t$ and $\sin\omega t$ terms separately, since they are independent functions:

$$
\begin{aligned}
\cos\omega t:\quad & (\omega_n^2 - \omega^2)P + 2\zeta\omega_n\omega\,Q = \omega_n^2 A, \\
\sin\omega t:\quad & -2\zeta\omega_n\omega\,P + (\omega_n^2 - \omega^2)Q = 0.
\end{aligned}
$$

Two linear equations, two unknowns. From the second, $Q = 2\zeta\omega_n\omega P/(\omega_n^2 - \omega^2)$; substitute into the first and clear denominators:

$$
P = \frac{\omega_n^2(\omega_n^2 - \omega^2)}{(\omega_n^2 - \omega^2)^2 + (2\zeta\omega_n\omega)^2}\,A, \qquad Q = \frac{\omega_n^2\,(2\zeta\omega_n\omega)}{(\omega_n^2 - \omega^2)^2 + (2\zeta\omega_n\omega)^2}\,A.
$$

The result is far more readable as one sinusoid of amplitude $\sqrt{P^2 + Q^2}$ and phase lag $\phi$ with $\tan\phi = Q/P$:

$$
y_p(t) = A\,M(\omega)\cos\bigl(\omega t - \phi(\omega)\bigr),
$$

$$
M(\omega) = \frac{\omega_n^2}{\sqrt{(\omega_n^2 - \omega^2)^2 + (2\zeta\omega_n\omega)^2}}, \qquad \tan\phi(\omega) = \frac{2\zeta\omega_n\omega}{\omega_n^2 - \omega^2}.
$$

$M$ is the **magnitude ratio** (output amplitude over input amplitude, dimensionless because the canonical form has unit gain) and $\phi$ is the **phase lag** in radians, the angle by which the output peaks *after* the input. The pair $(M, \phi)$ as a function of $\omega$ is the **frequency response** of the system. A steady sinusoid in produces a steady sinusoid out at the *same frequency* — a linear system never creates new frequencies — with its amplitude scaled by $M$ and its timing shifted by $\phi/\omega$ seconds.

### The complex-exponential shortcut

The algebra above is worth doing once by hand and never again. The faster route uses the identity $A\cos\omega t = \mathrm{Re}\{Ae^{j\omega t}\}$. Because the equation is linear with real coefficients, you may solve it for the complex input $Ae^{j\omega t}$ and take the real part at the end. Guess $y_p = Ye^{j\omega t}$ with $Y$ a complex constant; each derivative multiplies by $j\omega$, so

$$
\bigl((j\omega)^2 + 2\zeta\omega_n(j\omega) + \omega_n^2\bigr)Ye^{j\omega t} = \omega_n^2Ae^{j\omega t} \quad\Longrightarrow\quad Y = \frac{\omega_n^2}{\omega_n^2 - \omega^2 + 2j\zeta\omega_n\omega}\,A.
$$

The complex number multiplying $A$ has magnitude $M(\omega)$ and argument $-\phi(\omega)$ — exactly the two formulas above, obtained in one line. Write it as $G(j\omega)$: the characteristic polynomial of lesson 2 evaluated at $s = j\omega$ and inverted, times the input coefficient. Lesson 7 will define the **transfer function** $G(s) = \omega_n^2/(s^2 + 2\zeta\omega_n s + \omega_n^2)$, and $G(j\omega)$ is the frequency response you have just derived. Every Bode plot in the control track is $|G(j\omega)|$ and $\angle G(j\omega)$ against $\omega$.

::: key
Sinusoidal steady state of the canonical second-order system driven by $A\cos\omega t$: $y_p = AM\cos(\omega t - \phi)$ with
$M(\omega) = \omega_n^2\big/\sqrt{(\omega_n^2 - \omega^2)^2 + (2\zeta\omega_n\omega)^2}$ and $\tan\phi = 2\zeta\omega_n\omega/(\omega_n^2 - \omega^2)$. Equivalently $M e^{-j\phi} = G(j\omega)$ with $G(s) = \omega_n^2/(s^2 + 2\zeta\omega_n s + \omega_n^2)$. Output frequency equals input frequency; only amplitude and phase change.
:::

### Reading the curves

Write $r = \omega/\omega_n$ for the frequency ratio, so that

$$
M = \frac{1}{\sqrt{(1 - r^2)^2 + (2\zeta r)^2}}, \qquad \tan\phi = \frac{2\zeta r}{1 - r^2}.
$$

Three regions:

- **Well below $\omega_n$** ($r \ll 1$): $M \to 1$ and $\phi \to 0$. The system follows the input faithfully. The spring dominates; the mass and damper barely notice.
- **At $\omega_n$** ($r = 1$): $M = 1/(2\zeta)$ and $\phi = 90^\circ$ exactly, for any damping. The spring and inertia forces cancel and only the damper resists the input, which is why the amplitude is set by $\zeta$ alone.
- **Well above $\omega_n$** ($r \gg 1$): $M \to 1/r^2$ and $\phi \to 180^\circ$. The inertia dominates; the output is small and inverted. Doubling the frequency quarters the amplitude — the response rolls off at two orders of magnitude per decade of frequency.

The phase moves smoothly from $0^\circ$ through $90^\circ$ at $\omega_n$ to $180^\circ$, and it moves *fast* when $\zeta$ is small: for the bending mode below, the phase swings from $14^\circ$ to $166^\circ$ over a band only 4% wide.

::: warning
When $r > 1$ the denominator $1 - r^2$ in $\tan\phi$ is negative and a calculator's $\arctan$ returns a negative angle. The correct phase lag is between $90^\circ$ and $180^\circ$: use the two-argument arctangent $\phi = \operatorname{atan2}(2\zeta r,\, 1 - r^2)$, or add $180^\circ$ by hand. Phase is continuous through $\omega_n$; it does not jump from $+90^\circ$ to $-90^\circ$.
:::

## Resonance

The magnitude at $\omega_n$ is $1/(2\zeta)$, which for light damping is large: **resonance** is this amplification of an input near the natural frequency. The peak of $M$ is not exactly at $\omega_n$ when damping is present. Minimise the denominator $D(r) = (1 - r^2)^2 + 4\zeta^2 r^2$ with respect to $r^2$:

$$
\frac{dD}{d(r^2)} = -2(1 - r^2) + 4\zeta^2 = 0 \quad\Longrightarrow\quad r_{\mathrm{peak}}^2 = 1 - 2\zeta^2.
$$

So the **resonant frequency** is $\omega_r = \omega_n\sqrt{1 - 2\zeta^2}$, a little below $\omega_n$ (and below $\omega_d = \omega_n\sqrt{1 - \zeta^2}$ too). Substituting back, the **resonant peak** is

$$
M_{\mathrm{peak}} = \frac{1}{2\zeta\sqrt{1 - \zeta^2}}.
$$

A peak exists only when $1 - 2\zeta^2 > 0$, that is $\zeta < 1/\sqrt{2} = 0.707$. For $\zeta \ge 0.707$ the magnitude decreases monotonically from 1 and there is no resonance at all. At exactly $\zeta = 1/\sqrt{2}$ the denominator becomes $D = 1 - 2r^2 + r^4 + 2r^2 = 1 + r^4$: the $r^2$ term cancels identically, and the response stays as close to 1 for as long as possible before rolling off. This is the **maximally flat** or Butterworth response, and it is the frequency-domain reason $\zeta = 0.707$ is such a common design target — the time-domain reason being its 4.3% overshoot.

| $\zeta$ | 0.005 | 0.1 | 0.2 | 0.3 | 0.5 | 0.6 | 0.707 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| $\omega_r/\omega_n$ | 1.000 | 0.990 | 0.959 | 0.906 | 0.707 | 0.529 | 0 |
| $M_{\mathrm{peak}}$ | 100 | 5.03 | 2.55 | 1.75 | 1.15 | 1.04 | 1 |
| $M(\omega_n) = 1/(2\zeta)$ | 100 | 5.00 | 2.50 | 1.67 | 1.00 | 0.833 | 0.707 |

For light damping the two rows agree: $M_{\mathrm{peak}} \approx 1/(2\zeta)$ and $\omega_r \approx \omega_n$. Also for light damping, the peak is narrow. The magnitude falls to $M_{\mathrm{peak}}/\sqrt{2}$ (the half-power points) at $\omega \approx \omega_n(1 \pm \zeta)$, so the full width of the resonance band is about $2\zeta\omega_n$, twice the decay rate $\sigma$ of the free response. A long-ringing mode and a sharp resonance are the same fact seen in two domains.

::: key
Resonant peak: $M_{\mathrm{peak}} = 1/(2\zeta\sqrt{1 - \zeta^2})$ at $\omega_r = \omega_n\sqrt{1 - 2\zeta^2}$, existing only for $\zeta < 0.707$. At $\omega = \omega_n$ the magnitude is exactly $1/(2\zeta)$ and the phase lag is exactly $90^\circ$. For light damping the resonance band is about $2\zeta\omega_n$ wide. $\zeta = 1/\sqrt{2}$ gives the maximally flat response, with no peak.
:::

::: example The first bending mode under thrust-vector forcing
Lesson 3's booster bending mode has $f_n = 2.5\,\mathrm{Hz}$ ($\omega_n = 15.7\,\mathrm{rad/s}$) and $\zeta = 0.005$. Suppose the nozzle dithers sinusoidally, and the modal force it applies would, if applied statically, bend the tank wall by $1\,\mathrm{mm}$ at the sensor location. Driven at $2.5\,\mathrm{Hz}$ the steady-state deflection is

$$
M(\omega_n) = \frac{1}{2\zeta} = \frac{1}{0.01} = 100 \quad\Longrightarrow\quad 100\,\mathrm{mm},
$$

with the deflection lagging the force by $90^\circ$. The peak itself, at $\omega_r = \omega_n\sqrt{1 - 2(0.005)^2}$, is indistinguishable from this. Move the drive frequency to $2.45\,\mathrm{Hz}$ ($r = 0.98$) and $M = 1/\sqrt{(1 - 0.9604)^2 + (0.0098)^2} = 24.5$; at $2.4\,\mathrm{Hz}$ ($r = 0.96$), $M = 12.7$; at $2.0\,\mathrm{Hz}$, $M = 2.78$; at $1.0\,\mathrm{Hz}$, $M = 1.19$. The half-power band is $2\zeta f_n = 0.025\,\mathrm{Hz}$ wide. A control loop with any gain at $2.5\,\mathrm{Hz}$ is therefore a hazard, and a loop whose gain is small there is harmless — which is why launch-vehicle autopilots carry notch filters at the bending frequencies, and why the *phase* of the loop near $2.5\,\mathrm{Hz}$, which flips through $180^\circ$ across that narrow band, must be tracked as carefully as its gain.
:::

::: example A pitch-rate loop tracking a sinusoidal command
The pitch-rate loop of lesson 3, poles $-1.5 \pm 2j$, has $\omega_n = 2.5\,\mathrm{rad/s}$ and $\zeta = 0.6$. A pilot rocks the stick, commanding a pitch rate $0.5\cos(1.0\,t)\ \mathrm{rad/s}$. With $r = 1.0/2.5 = 0.4$:

$$
M = \frac{1}{\sqrt{(1 - 0.16)^2 + (2 \times 0.6 \times 0.4)^2}} = \frac{1}{\sqrt{0.7056 + 0.2304}} = 1.034, \qquad \phi = \operatorname{atan2}(0.48,\ 0.84) = 29.7^\circ.
$$

The achieved rate has amplitude $0.5 \times 1.034 = 0.517\,\mathrm{rad/s}$, 3.4% *more* than commanded, and it peaks $\phi/\omega = 0.519\,\mathrm{rad}/(1\,\mathrm{rad/s}) = 0.52\,\mathrm{s}$ after the command. Since $\zeta = 0.6 < 0.707$ this loop has a mild resonance: $\omega_r = 2.5\sqrt{1 - 0.72} = 1.32\,\mathrm{rad/s}$ and $M_{\mathrm{peak}} = 1/(1.2 \times 0.8) = 1.04$. At $\omega_n = 2.5\,\mathrm{rad/s}$ the ratio has already fallen to $1/(2 \times 0.6) = 0.833$ with $90^\circ$ of lag, and at $5\,\mathrm{rad/s}$ it is $0.26$ with $141^\circ$ of lag — the loop no longer follows the stick in any useful sense. Integrating the full equation from rest confirms the steady state: after the transient dies (about $4/1.5 = 2.7\,\mathrm{s}$), the response oscillates between $\pm 0.517\,\mathrm{rad/s}$.
:::

::: note
For the TVC actuator ($\omega_n = 40$, $\zeta = 0.6$) the same curve applies with the frequency axis scaled by 16: $M = 1.016$ with $17.7^\circ$ lag at $10\,\mathrm{rad/s}$, $1.041$ and $38.7^\circ$ at $20\,\mathrm{rad/s}$, $0.833$ and $90^\circ$ at $40\,\mathrm{rad/s}$. Expressed as a time delay, $\phi/\omega$, the lag is about $31\,\mathrm{ms}$ at $10\,\mathrm{rad/s}$ and $39\,\mathrm{ms}$ at $40\,\mathrm{rad/s}$ — close to the ramp lag $2\zeta/\omega_n = 30\,\mathrm{ms}$ at low frequency, as it should be, since a slow ramp and a slow sinusoid are locally the same thing.
:::

## Building a resonance up from rest

The steady state says nothing about how fast the amplification appears, and for a lightly damped mode that matters: a disturbance that lasts one second cannot drive a mode to a hundred times its static deflection. Take the system at rest and switch on $u = A\cos\omega_n t$ exactly at resonance. The particular solution is $y_p = (A/2\zeta)\cos(\omega_n t - 90^\circ) = (A/2\zeta)\sin\omega_n t$. The transient must cancel its initial value and slope: $y_h(0) = 0$ and $\dot{y}_h(0) = -A\omega_n/(2\zeta)$. From the free-response form, $C_1 = 0$ and $C_2\omega_d = -A\omega_n/(2\zeta)$; for light damping $\omega_d \approx \omega_n$, so $C_2 \approx -A/(2\zeta)$ and

$$
y(t) \approx \frac{A}{2\zeta}\bigl(1 - e^{-\zeta\omega_n t}\bigr)\sin\omega_n t.
$$

The oscillation appears immediately at frequency $\omega_n$, but its amplitude grows along the same exponential the free response decays along: 63% of the final amplitude after $1/(\zeta\omega_n)$, 95% after $3/(\zeta\omega_n)$, 98% after $4/(\zeta\omega_n)$. For the bending mode, $1/\sigma = 12.7\,\mathrm{s}$, so the deflection reaches $63\,\mathrm{mm}$ after $12.7\,\mathrm{s}$, $86\,\mathrm{mm}$ after $25\,\mathrm{s}$ and $95\,\mathrm{mm}$ after $38\,\mathrm{s}$; a numerical integration of the exact equation gives $63.1$, $85.9$ and $94.9\,\mathrm{mm}$ at those times. In the first second the amplitude is only $6.8\,\mathrm{mm}$. The ratio of steady amplitude to input is large, but the mode has to be fed for tens of cycles to get there, which is why a *sustained* loop oscillation at the mode frequency is the danger, not a single transient.

In the limit $\zeta \to 0$ the envelope $(1 - e^{-\zeta\omega_n t})/(2\zeta) \to \omega_n t/2$, and the response is

$$
y(t) = \frac{A\omega_n t}{2}\sin\omega_n t,
$$

which you can verify by direct substitution into $\ddot{y} + \omega_n^2 y = \omega_n^2 A\cos\omega_n t$. This is the case where the undetermined-coefficients guess fails, because $\cos\omega_n t$ is itself a free mode; the fix, as with a repeated root in lesson 2, is a factor of $t$. The amplitude grows without bound, linearly: after ten cycles it is $10\pi A = 31.4A$. No real structure is undamped, but a mode with $\zeta = 0.005$ behaves this way for the first several seconds.

::: warning
Resonance does not require the input to be a pure sinusoid. Any periodic input — a limit-cycling valve, a spinning unbalanced turbopump, the sampling pattern of a digital controller — contains harmonics, and each harmonic that lands within about $\zeta\omega_n$ of a lightly damped mode is amplified by roughly $1/(2\zeta)$. Check the spectrum of every persistent disturbance against every structural mode.
:::

## Check yourself

::: check
A sensor bracket behaves as a second-order system with $\omega_n = 200\,\mathrm{rad/s}$ and $\zeta = 0.05$. The mounting panel vibrates sinusoidally at $200\,\mathrm{rad/s}$ with amplitude $0.1\,\mathrm{mm}$. What is the steady-state amplitude of the sensor and its phase relative to the panel? What if the panel vibrates at $600\,\mathrm{rad/s}$ instead?
:::

::: answer
At $r = 1$: $M = 1/(2\zeta) = 1/0.1 = 10$, so the sensor moves $1.0\,\mathrm{mm}$, lagging the panel by exactly $90^\circ$. At $r = 3$: $M = 1/\sqrt{(1 - 9)^2 + (2 \times 0.05 \times 3)^2} = 1/\sqrt{64 + 0.09} = 0.125$, so the amplitude is $0.0125\,\mathrm{mm}$, and $\phi = \operatorname{atan2}(0.3, -8) = 177.9^\circ$: the sensor moves almost exactly opposite to the panel, and barely. Above resonance the bracket isolates; at resonance it amplifies tenfold.
:::

::: check
For what damping ratio does the canonical second-order magnitude curve have no resonant peak? Show where that value comes from.
:::

::: answer
The denominator of $M^2$ is $D(r) = (1 - r^2)^2 + 4\zeta^2r^2$. Its minimum over $r^2$ sits at $r^2 = 1 - 2\zeta^2$, which is a positive frequency only if $\zeta < 1/\sqrt{2}$. For $\zeta \ge 1/\sqrt{2} = 0.707$ the minimum of $D$ is at $r = 0$, so $M$ falls monotonically from 1 and there is no peak. At exactly $1/\sqrt{2}$, $D = 1 + r^4$ with no $r^2$ term — the maximally flat response.
:::

::: check
A gimbal is commanded to sweep at a constant $0.2\,\mathrm{rad/s}$. Its servo is second order with $\omega_n = 12\,\mathrm{rad/s}$ and $\zeta = 0.7$. How far behind the command is the gimbal once the transient has died, in time and in angle?
:::

::: answer
The ramp lag is $2\zeta/\omega_n = 1.4/12 = 0.117\,\mathrm{s}$. In angle that is $0.2 \times 0.117 = 0.0233\,\mathrm{rad}$, about $1.3^\circ$. If that error matters, the designer either raises $\omega_n$ or adds integral action so the loop tracks ramps without error — a topic for the control track.
:::

::: check
A second-order system is driven by $\cos\omega t$ and the measured steady-state output is $0.5\cos(\omega t - 90^\circ)$. What can you conclude about $\omega$ and $\zeta$?
:::

::: answer
A phase lag of exactly $90^\circ$ occurs only at $\omega = \omega_n$, because $\tan\phi = 2\zeta r/(1 - r^2)$ is infinite only at $r = 1$. There $M = 1/(2\zeta)$, so $0.5 = 1/(2\zeta)$ gives $\zeta = 1$. The system is critically damped and being driven at its natural frequency; the output is half the input.
:::

::: check
The bending mode above is excited by a nozzle dither at exactly $2.5\,\mathrm{Hz}$ that lasts $5\,\mathrm{s}$ and then stops. Roughly what deflection does it reach, and how long afterwards is it still above $10\,\mathrm{mm}$?
:::

::: answer
During the drive the envelope is $100(1 - e^{-\sigma t})\,\mathrm{mm}$ with $\sigma = \zeta\omega_n = 0.0785\,\mathrm{s^{-1}}$; at $5\,\mathrm{s}$, $100(1 - e^{-0.393}) = 32.5\,\mathrm{mm}$ (a full integration gives $31.9\,\mathrm{mm}$). After the drive stops the mode rings freely and decays as $32\,e^{-0.0785(t - 5)}$. It falls to $10\,\mathrm{mm}$ when $e^{-0.0785\Delta t} = 10/32$, i.e. $\Delta t = \ln 3.2/0.0785 = 14.8\,\mathrm{s}$. Five seconds of forcing produce twenty seconds of ringing above a tenth of the resonant amplitude.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $y = y_p + y_h$ | Particular (steady-state) plus free (transient) response; initial conditions fix $y_h$ after $y_p$ is chosen |
| $y_p = U$; $y_p = r(t - 2\zeta/\omega_n)$ | Steady state for a step and a ramp; ramp lag $2\zeta/\omega_n$ seconds |
| $y_p = AM\cos(\omega t - \phi)$ | Sinusoidal steady state: same frequency, scaled and delayed |
| $M = \omega_n^2\big/\sqrt{(\omega_n^2 - \omega^2)^2 + (2\zeta\omega_n\omega)^2}$ | Magnitude ratio, dimensionless |
| $\tan\phi = 2\zeta\omega_n\omega/(\omega_n^2 - \omega^2)$ | Phase lag; $0^\circ$ at low frequency, $90^\circ$ at $\omega_n$, $180^\circ$ at high frequency |
| $Me^{-j\phi} = G(j\omega)$, $G(s) = \omega_n^2/(s^2 + 2\zeta\omega_n s + \omega_n^2)$ | Frequency response as the transfer function on the imaginary axis |
| $M(\omega_n) = 1/(2\zeta)$ | Magnitude at the natural frequency |
| $\omega_r = \omega_n\sqrt{1 - 2\zeta^2}$, $M_{\mathrm{peak}} = 1/(2\zeta\sqrt{1 - \zeta^2})$ | Resonant frequency and peak, only for $\zeta < 0.707$ |
| $\zeta = 1/\sqrt{2}$ | Maximally flat (Butterworth) response, no peak |
| $\approx 2\zeta\omega_n$ | Width of the resonance band for light damping |
| $y \approx \dfrac{A}{2\zeta}(1 - e^{-\zeta\omega_n t})\sin\omega_n t$ | Build-up at resonance from rest; $\to (A\omega_n t/2)\sin\omega_n t$ as $\zeta \to 0$ |

The next lesson introduces the Laplace transform, which turns the differential equation into algebra, handles initial conditions and forcing in one step, and makes the quantity $G(s)$ that appeared here the central object of the rest of the module.
