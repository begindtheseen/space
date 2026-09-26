---
id: l05-forced-response-and-resonance
title: Forced response and resonance
minutes: 20
covers:
  - forced response and resonance
---

Push a child on a swing. If you push at random moments, the swing barely moves. If you push once each time it comes back to you — at the swing's own rhythm — small pushes pile up, and soon the swing is flying high. You have found **resonance**: a small push, repeated at a system's natural frequency, building a big motion.

Lessons 2 and 3 let the second-order system move on its own: start it off and watch the motion die away. A real vehicle is never left alone like that. Its actuators follow commands. Its structure is shaken by engine thrust and by **[[aerodynamic buffet|buffet]]**. Its sensors ride on a body that vibrates. This lesson asks what a second-order system does when it is pushed *all the time* — by a step, by a ramp, and above all by a steady back-and-forth shake.

Resonance is why a flexible booster's bending is on every launch-vehicle engineer's list of things that can end a flight. Lesson 3 showed that the first bending mode of a big rocket rings for almost a minute after one kick. This lesson shows the other side of the same fact: shake that mode at its own frequency and it multiplies the input a hundredfold. The same mathematics also gives how fast a nozzle actuator can follow commands, and it introduces the idea the whole control track is built on — describing a system by how it answers a sinusoid, as a size and a delay at each frequency.

## Pushed all the time

Here is lesson 3's canonical form with the input switched on:

$$
\ddot{y} + 2\zeta\omega_n\dot{y} + \omega_n^2 y = \omega_n^2 u(t).
$$

The input $u(t)$ is the **forcing**: a commanded angle, a disturbance torque divided by the stiffness, or the shaking of the panel a sensor is bolted to.

Lesson 2 gave the shape of every solution. Find *any one* solution of the forced equation — call it the **particular solution** $y_p(t)$ — and add the full free response:

$$
y(t) = y_p(t) + e^{-\zeta\omega_n t}\bigl(C_1\cos\omega_d t + C_2\sin\omega_d t\bigr).
$$

The constants $C_1$ and $C_2$ are chosen so that the *whole* $y$ matches the starting conditions. For a stable system the free part dies away, so after a few time constants $1/(\zeta\omega_n)$ only $y_p$ is left. That is why $y_p$ is also called the **steady-state response**, and the free part the **transient**. In one line: the system decides how it forgets; the input decides where it ends up.

### Guess the shape

Finding $y_p$ is easy for the inputs that matter, because of a handy property. Differentiate a polynomial and you get a polynomial. Differentiate an exponential and you get the same exponential. Differentiate a sinusoid and you get a sinusoid of the same frequency. So if $u$ is one of these, guess a $y_p$ of the same shape with unknown numbers in it, put it into the equation, and match the terms. This is the **method of undetermined coefficients**. The three inputs you need on a vehicle:

| Input $u(t)$ | Guess for $y_p$ |
| --- | --- |
| constant $U$ | constant $Y$ |
| ramp $rt$ | $Yt + Z$ |
| $A\cos\omega t$ | $P\cos\omega t + Q\sin\omega t$, or $\mathrm{Re}\{Ye^{j\omega t}\}$ |

The guess fails only when it matches one of the free motions — an undamped system shaken exactly at $\omega_n$. That case is resonance, and it gets its own section below.

### Step and ramp

**A step.** For a constant input $U$, the guess $y_p = Y$ has zero derivatives. The equation shrinks to $\omega_n^2 Y = \omega_n^2 U$, so $y_p = U$: the output settles on the command. That is exactly what the $\omega_n^2$ on the right of the canonical form was put there to do. Lesson 3 built the whole step response on this.

**A ramp.** Now let the command climb steadily, $u = rt$ — a turning attitude command, or a gimbal sweeping at a constant rate. Guess $y_p = Yt + Z$. Then $\dot{y}_p = Y$ and $\ddot{y}_p = 0$. Put these in:

$$
2\zeta\omega_n Y + \omega_n^2(Yt + Z) = \omega_n^2 rt.
$$

Match the terms with $t$: $\omega_n^2 Y = \omega_n^2 r$, so $Y = r$. Match the constant terms: $2\zeta\omega_n r + \omega_n^2 Z = 0$, so $Z = -2\zeta r/\omega_n$. So

$$
y_p(t) = r\left(t - \frac{2\zeta}{\omega_n}\right).
$$

The output climbs at the right rate but **[[runs behind|ramp-lag]]** the command, by $2\zeta/\omega_n$ seconds — or, in value, by $2\zeta r/\omega_n$. It is the second-order cousin of the one-time-constant lag of lesson 1. There the delay was $\tau$. Here it is $2\zeta/\omega_n$, which is the coefficient of $s$ in the characteristic polynomial divided by the constant term.

Put in lesson 3's numbers. The thrust-vector actuator has $\omega_n = 40\,\mathrm{rad/s}$ and $\zeta = 0.6$, so it follows a sweep $2 \times 0.6/40 = 0.03\,\mathrm{s}$ late. During a $10^\circ/\mathrm{s}$ sweep, the nozzle sits $10 \times 0.03 = 0.3^\circ$ behind its command. The pitch-rate loop with poles $-1.5 \pm 2j$ ($\omega_n = 2.5$, $\zeta = 0.6$) lags a ramp by $2 \times 0.6/2.5 = 0.48\,\mathrm{s}$ — sixteen times longer, because it is sixteen times slower.

::: key
Ramp response of the canonical second-order system: steady state $y_p = r(t - 2\zeta/\omega_n)$. The output follows the ramp delayed by $2\zeta/\omega_n$ seconds. Step response: steady state $y_p = U$; the free response carries the transient.
:::

## Shaking it: the sinusoidal response

Now the input that matters most: $u(t) = A\cos\omega t$. The **driving frequency** $\omega$ is whatever the shaker chooses. It is not, in general, the system's own $\omega_n$.

Guess $y_p = P\cos\omega t + Q\sin\omega t$. The derivatives are $\dot{y}_p = -P\omega\sin\omega t + Q\omega\cos\omega t$ and $\ddot{y}_p = -\omega^2 y_p$. Put them in, and collect the $\cos\omega t$ terms and the $\sin\omega t$ terms separately. They must match separately, because no mix of sines can fake a cosine:

$$
\begin{aligned}
\cos\omega t:\quad & (\omega_n^2 - \omega^2)P + 2\zeta\omega_n\omega\,Q = \omega_n^2 A, \\
\sin\omega t:\quad & -2\zeta\omega_n\omega\,P + (\omega_n^2 - \omega^2)Q = 0.
\end{aligned}
$$

Two linear equations, two unknowns. The second gives $Q = 2\zeta\omega_n\omega P/(\omega_n^2 - \omega^2)$. Put that into the first and clear the fractions:

$$
P = \frac{\omega_n^2(\omega_n^2 - \omega^2)}{(\omega_n^2 - \omega^2)^2 + (2\zeta\omega_n\omega)^2}\,A, \qquad Q = \frac{\omega_n^2\,(2\zeta\omega_n\omega)}{(\omega_n^2 - \omega^2)^2 + (2\zeta\omega_n\omega)^2}\,A.
$$

That is much easier to read as a single wave. A cosine plus a sine of the same frequency is one wave, with size $\sqrt{P^2 + Q^2}$ and delay angle $\phi$ where $\tan\phi = Q/P$:

$$
y_p(t) = A\,M(\omega)\cos\bigl(\omega t - \phi(\omega)\bigr),
$$

$$
M(\omega) = \frac{\omega_n^2}{\sqrt{(\omega_n^2 - \omega^2)^2 + (2\zeta\omega_n\omega)^2}}, \qquad \tan\phi(\omega) = \frac{2\zeta\omega_n\omega}{\omega_n^2 - \omega^2}.
$$

$M$ is the **magnitude ratio**: output size over input size. It has no units, because the canonical form has unit gain. $\phi$ ("phi") is the **phase lag** in radians: the angle by which the output peaks *after* the input. The pair $(M, \phi)$ as a function of $\omega$ is the **frequency response** of the system.

Notice what did *not* happen. A steady sinusoid went in and a steady sinusoid came out at the **[[same frequency|no-new-frequencies]]**. A linear system never creates new frequencies. All it can do is scale the wave by $M$ and delay it by $\phi/\omega$ seconds.

### The complex-exponential shortcut

That algebra is worth doing once by hand and never again. The fast route uses Euler's formula from the trigonometry module: $A\cos\omega t$ is the real part of $Ae^{j\omega t}$, written $\mathrm{Re}\{Ae^{j\omega t}\}$. Because the equation is linear with real coefficients, you may solve it for the complex input $Ae^{j\omega t}$ and take the real part at the end.

Guess $y_p = Ye^{j\omega t}$, with $Y$ a complex constant. Each derivative multiplies by $j\omega$, so

$$
\bigl((j\omega)^2 + 2\zeta\omega_n(j\omega) + \omega_n^2\bigr)Ye^{j\omega t} = \omega_n^2Ae^{j\omega t} \quad\Longrightarrow\quad Y = \frac{\omega_n^2}{\omega_n^2 - \omega^2 + 2j\zeta\omega_n\omega}\,A.
$$

The complex number multiplying $A$ has size $M(\omega)$ and angle $-\phi(\omega)$ — both formulas above, in one line. Call it $G(j\omega)$. It is the characteristic polynomial of lesson 2 evaluated at $s = j\omega$, turned upside down, times the input coefficient. Lesson 7 will define the **transfer function** $G(s) = \omega_n^2/(s^2 + 2\zeta\omega_n s + \omega_n^2)$, and $G(j\omega)$ is the frequency response you have found. Every **[[Bode plot|bode]]** in the control track is $|G(j\omega)|$ and $\angle G(j\omega)$ drawn against $\omega$.

::: key
Sinusoidal steady state of the canonical second-order system driven by $A\cos\omega t$: $y_p = AM\cos(\omega t - \phi)$ with
$M(\omega) = \omega_n^2\big/\sqrt{(\omega_n^2 - \omega^2)^2 + (2\zeta\omega_n\omega)^2}$ and $\tan\phi = 2\zeta\omega_n\omega/(\omega_n^2 - \omega^2)$. Equivalently $M e^{-j\phi} = G(j\omega)$ with $G(s) = \omega_n^2/(s^2 + 2\zeta\omega_n s + \omega_n^2)$. Output frequency equals input frequency; only size and phase change.
:::

### Reading the curves

Measure the driving frequency against the natural one with the **frequency ratio** $r = \omega/\omega_n$. Divide top and bottom by $\omega_n^2$ and the formulas get tidier:

$$
M = \frac{1}{\sqrt{(1 - r^2)^2 + (2\zeta r)^2}}, \qquad \tan\phi = \frac{2\zeta r}{1 - r^2}.
$$

There are **[[three regions|magnitude-curves]]**:

- **Well below $\omega_n$** ($r \ll 1$, read "r much less than one"): $M \to 1$ and $\phi \to 0$. The system follows faithfully. The spring does all the work; the mass and damper barely notice.
- **At $\omega_n$** ($r = 1$): $M = 1/(2\zeta)$ and $\phi = 90^\circ$ exactly, for any damping. The spring force and the inertia force cancel, and only the damper resists. That is why the size here is set by $\zeta$ alone.
- **Well above $\omega_n$** ($r \gg 1$): $M \to 1/r^2$ and $\phi \to 180^\circ$. Inertia wins; the output is small and upside down. Double the frequency and the size drops to a quarter.

The phase slides smoothly from $0^\circ$, through $90^\circ$ at $\omega_n$, to $180^\circ$. With little damping it slides *fast*: for the bending mode below, it swings from $14^\circ$ to $166^\circ$ across a band only 4% wide.

::: warning The phase above resonance
When $r > 1$ the bottom of $\tan\phi$, $1 - r^2$, is negative, and a calculator's $\arctan$ hands back a negative angle. The true lag is between $90^\circ$ and $180^\circ$. Use the **[[two-argument arctangent|atan2-again]]**, $\phi = \operatorname{atan2}(2\zeta r,\, 1 - r^2)$, or add $180^\circ$ by hand. The phase is smooth through $\omega_n$; it does not jump from $+90^\circ$ to $-90^\circ$.
:::

## Resonance

At $\omega_n$ the size is $1/(2\zeta)$, which is large when damping is light. **Resonance** is this blowing-up of an input near the natural frequency.

With damping, the very top of the $M$ curve sits a little below $\omega_n$. To find it, make the bottom of $M$ as small as possible. Call it $D(r) = (1 - r^2)^2 + 4\zeta^2 r^2$, treat $r^2$ as the variable, and set the derivative to zero:

$$
\frac{dD}{d(r^2)} = -2(1 - r^2) + 4\zeta^2 = 0 \quad\Longrightarrow\quad r_{\mathrm{peak}}^2 = 1 - 2\zeta^2.
$$

So the **resonant frequency** is $\omega_r = \omega_n\sqrt{1 - 2\zeta^2}$. That is a little below $\omega_n$, and below $\omega_d = \omega_n\sqrt{1 - \zeta^2}$ too. Putting it back into $M$ gives the **resonant peak**:

$$
M_{\mathrm{peak}} = \frac{1}{2\zeta\sqrt{1 - \zeta^2}}.
$$

A peak exists only when $1 - 2\zeta^2 > 0$, that is $\zeta < 1/\sqrt{2} = 0.707$. For $\zeta \ge 0.707$ the size only falls as frequency rises, and there is no resonance at all.

At exactly $\zeta = 1/\sqrt{2}$, the bottom becomes $D = 1 - 2r^2 + r^4 + 2r^2 = 1 + r^4$. The $r^2$ term cancels completely, so the response stays near $1$ as long as it possibly can before rolling off. This is the **maximally flat** response, also named after the engineer Stephen Butterworth.

| $\zeta$ | 0.005 | 0.1 | 0.2 | 0.3 | 0.5 | 0.6 | $1/\sqrt{2}$ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| $\omega_r/\omega_n$ | 1.000 | 0.990 | 0.959 | 0.906 | 0.707 | 0.529 | 0 |
| $M_{\mathrm{peak}}$ | 100 | 5.03 | 2.55 | 1.75 | 1.15 | 1.04 | 1 |
| $M(\omega_n) = 1/(2\zeta)$ | 100 | 5.00 | 2.50 | 1.67 | 1.00 | 0.833 | 0.707 |

For light damping the last two rows agree: $M_{\mathrm{peak}} \approx 1/(2\zeta)$ and $\omega_r \approx \omega_n$. Light damping also makes the peak narrow. The size falls to $M_{\mathrm{peak}}/\sqrt{2}$ — the **[[half-power points|half-power]]** — at about $\omega_n(1 \pm \zeta)$. So the whole resonance band is about $2\zeta\omega_n$ wide, twice the decay rate $\sigma$ of the free motion. A mode that rings for a long time and a sharp resonance are the same fact, seen two ways.

::: key
Resonant peak: $M_{\mathrm{peak}} = 1/(2\zeta\sqrt{1 - \zeta^2})$ at $\omega_r = \omega_n\sqrt{1 - 2\zeta^2}$, existing only for $\zeta < 0.707$. At $\omega = \omega_n$ the magnitude is exactly $1/(2\zeta)$ and the phase lag is exactly $90^\circ$. For light damping the resonance band is about $2\zeta\omega_n$ wide. $\zeta = 1/\sqrt{2}$ gives the maximally flat response, with no peak.
:::

### Is 0.707 always the target?

You now have two reasons designers like $\zeta \approx 0.707$. In time, lesson 3 showed it gives a step response with only about 4.3% overshoot. In frequency, it gives the flattest possible response with no peak. There is a third: for the standard loop that produces the canonical system, it leaves about $65^\circ$ of **[[phase margin|phase-margin]]** — a comfortable cushion against extra delay.

But a launch vehicle climbing through the air is a different animal. Its rigid body is **[[statically unstable|unstable-rocket]]**: left alone it would tumble, so there is no gentle step response to shape. Its bending and fuel-slosh modes cap how fast the controller may act. And the real limit is structural: the sideways air load, which grows with the **dynamic pressure** $\bar{q} = \tfrac{1}{2}\rho v^2$ times the angle of attack $\alpha$. Ascent autopilots are designed for stability margins and for easing that $\bar{q}\alpha$ load. The damping ratio comes out of that design; it is not the goal.

::: example The first bending mode under thrust-vector forcing
Lesson 3's booster bending mode has $f_n = 2.5\,\mathrm{Hz}$, so $\omega_n = 2\pi \times 2.5 = 15.7\,\mathrm{rad/s}$, and $\zeta = 0.005$. Suppose the nozzle wiggles back and forth sinusoidally. If its force were applied steadily, it would bend the tank wall by $1\,\mathrm{mm}$ at the sensor. What happens when it wiggles?

**Right at $2.5\,\mathrm{Hz}$:**

$$
M(\omega_n) = \frac{1}{2\zeta} = \frac{1}{0.01} = 100 \quad\Longrightarrow\quad 100\,\mathrm{mm},
$$

with the bending lagging the force by $90^\circ$. The true peak, at $\omega_r = \omega_n\sqrt{1 - 2(0.005)^2}$, is indistinguishable from this.

**A little off.** At $2.45\,\mathrm{Hz}$, $r = 0.98$, and

$$
M = \frac{1}{\sqrt{(1 - 0.9604)^2 + (2 \times 0.005 \times 0.98)^2}} = \frac{1}{\sqrt{0.0396^2 + 0.0098^2}} = 24.5.
$$

At $2.4\,\mathrm{Hz}$ ($r = 0.96$), $M = 12.7$. At $2.0\,\mathrm{Hz}$, $M = 2.78$. At $1.0\,\mathrm{Hz}$, $M = 1.19$. The half-power band is $2\zeta f_n = 0.025\,\mathrm{Hz}$ wide.

**What it means.** Sanity check: moving 2% off the peak cut the answer by a factor of four, as a narrow band should. A control loop that pushes at all at $2.5\,\mathrm{Hz}$ is a hazard, and one that is quiet there is harmless. That is why launch-vehicle autopilots carry **[[notch filters|notch-filter]]** at the bending frequencies. The loop's *phase* near $2.5\,\mathrm{Hz}$, which flips through $180^\circ$ across that narrow band, must be tracked as carefully as its size.
:::

::: example A pitch-rate loop following a rocking command
The pitch-rate loop of lesson 3, poles $-1.5 \pm 2j$, has $\omega_n = 2.5\,\mathrm{rad/s}$ and $\zeta = 0.6$. A pilot rocks the stick, asking for a pitch rate $0.5\cos(1.0\,t)\ \mathrm{rad/s}$.

**Frequency ratio:** $r = 1.0/2.5 = 0.4$, so $r^2 = 0.16$ and $2\zeta r = 2 \times 0.6 \times 0.4 = 0.48$.

**Size and lag:**

$$
M = \frac{1}{\sqrt{(1 - 0.16)^2 + 0.48^2}} = \frac{1}{\sqrt{0.7056 + 0.2304}} = 1.034, \qquad \phi = \operatorname{atan2}(0.48,\ 0.84) = 29.7^\circ.
$$

**Result.** The rate the vehicle actually achieves swings with amplitude $0.5 \times 1.034 = 0.517\,\mathrm{rad/s}$ — 3.4% *more* than asked for. It peaks $\phi/\omega = 0.519\,\mathrm{rad} \div 1\,\mathrm{rad/s} = 0.52\,\mathrm{s}$ after the command.

**Why more than asked?** Because $\zeta = 0.6 < 0.707$, the loop has a mild resonance: $\omega_r = 2.5\sqrt{1 - 0.72} = 1.32\,\mathrm{rad/s}$ and $M_{\mathrm{peak}} = 1/(1.2 \times 0.8) = 1.04$. We are driving a little below that peak. At $\omega_n = 2.5\,\mathrm{rad/s}$ the ratio has already fallen to $1/(2 \times 0.6) = 0.833$ with $90^\circ$ of lag. At $5\,\mathrm{rad/s}$ it is $0.26$ with $141^\circ$ of lag — the loop no longer follows the stick in any useful way.

Solving the full equation from rest confirms it: once the transient dies (about $4/1.5 = 2.7\,\mathrm{s}$), the response swings between $\pm 0.517\,\mathrm{rad/s}$.
:::

::: note The nozzle actuator on the same curve
The thrust-vector actuator ($\omega_n = 40$, $\zeta = 0.6$) has the same curve with the frequency axis stretched by 16. At $10\,\mathrm{rad/s}$, $M = 1.016$ with $17.7^\circ$ of lag. At $20\,\mathrm{rad/s}$, $1.041$ and $38.7^\circ$. At $40\,\mathrm{rad/s}$, $0.833$ and $90^\circ$.

As a time delay, $\phi/\omega$, the lag is about $31\,\mathrm{ms}$ at $10\,\mathrm{rad/s}$ and $39\,\mathrm{ms}$ at $40\,\mathrm{rad/s}$. At low frequency that is close to the ramp lag, $2\zeta/\omega_n = 30\,\mathrm{ms}$ — as it should be, since a slow wave and a slow ramp look alike over a short stretch.
:::

## Building a resonance up from rest

The steady state says nothing about how *fast* the big motion appears. For a lightly damped mode that matters a lot: a push lasting one second cannot bend a mode to a hundred times its static amount.

Start the system at rest and switch on $u = A\cos\omega_n t$, exactly at resonance. The particular solution is $y_p = (A/2\zeta)\cos(\omega_n t - 90^\circ) = (A/2\zeta)\sin\omega_n t$. At $t = 0$ it has value $0$ but slope $A\omega_n/(2\zeta)$, while the real system starts with zero slope. So the transient must cancel that slope: $y_h(0) = 0$ and $\dot{y}_h(0) = -A\omega_n/(2\zeta)$.

From the free-response form, $C_1 = 0$ and $C_2\omega_d = -A\omega_n/(2\zeta)$. For light damping $\omega_d \approx \omega_n$, so $C_2 \approx -A/(2\zeta)$, and

$$
y(t) \approx \frac{A}{2\zeta}\bigl(1 - e^{-\zeta\omega_n t}\bigr)\sin\omega_n t.
$$

The shaking starts at once at frequency $\omega_n$. But its **[[size grows|buildup]]** along the same exponential that the free motion decays along: 63% of the final size after $1/(\zeta\omega_n)$, 95% after $3/(\zeta\omega_n)$, 98% after $4/(\zeta\omega_n)$.

For the bending mode, $1/\sigma = 1/(0.005 \times 15.7) = 12.7\,\mathrm{s}$. The formula gives $63\,\mathrm{mm}$ after $12.7\,\mathrm{s}$, $86\,\mathrm{mm}$ after $25\,\mathrm{s}$ and $95\,\mathrm{mm}$ after $38\,\mathrm{s}$. Solving the exact equation on a computer gives $63.1$, $85.9$ and $94.9\,\mathrm{mm}$. In the first second the biggest swing is only about $7\,\mathrm{mm}$. The final ratio is huge, but the mode has to be fed for dozens of cycles to get there. That is why a *sustained* wobble in the control loop at the mode frequency is the danger, not a single bump.

Now let the damping go to zero. The envelope $(1 - e^{-\zeta\omega_n t})/(2\zeta)$ tends to $\omega_n t/2$ (for small $x$, $1 - e^{-x} \approx x$), and the response becomes

$$
y(t) = \frac{A\omega_n t}{2}\sin\omega_n t.
$$

You can check it by putting it into $\ddot{y} + \omega_n^2 y = \omega_n^2 A\cos\omega_n t$. This is the case where the plain guess fails, because $\cos\omega_n t$ is itself a free motion. The fix, as for a repeated root in lesson 2, is an extra factor of $t$. The size grows without limit, in a straight line: after ten cycles ($\omega_n t = 20\pi$) it is $10\pi A = 31.4A$. No real structure is perfectly undamped, but a mode with $\zeta = 0.005$ behaves this way for the first several seconds.

::: warning Any repeating push can find a resonance
The input does not have to be a pure sinusoid. Any repeating input — a valve chattering on and off, a spinning **[[turbopump that is slightly out of balance|pogo]]**, the sampling rhythm of a digital controller — contains a set of frequencies called harmonics. Each harmonic that lands within about $\zeta\omega_n$ of a lightly damped mode is multiplied by roughly $1/(2\zeta)$. Check the frequencies of every persistent disturbance against every structural mode.
:::

## Check yourself

::: check
A sensor bracket behaves as a second-order system with $\omega_n = 200\,\mathrm{rad/s}$ and $\zeta = 0.05$. The panel it is mounted on shakes at $200\,\mathrm{rad/s}$ with amplitude $0.1\,\mathrm{mm}$. How much does the sensor move in steady state, and what is its phase relative to the panel? What if the panel shakes at $600\,\mathrm{rad/s}$ instead?
:::

::: answer
At $r = 1$: $M = 1/(2\zeta) = 1/0.1 = 10$. The sensor moves $10 \times 0.1 = 1.0\,\mathrm{mm}$, lagging the panel by exactly $90^\circ$.

At $r = 3$: $M = 1/\sqrt{(1 - 9)^2 + (2 \times 0.05 \times 3)^2} = 1/\sqrt{64 + 0.09} = 0.125$. The amplitude is $0.0125\,\mathrm{mm}$, and $\phi = \operatorname{atan2}(0.3, -8) = 177.9^\circ$: the sensor moves almost exactly opposite to the panel, and barely. Above resonance the bracket isolates the sensor; at resonance it multiplies the shaking tenfold.
:::

::: check
For what damping ratios does the canonical second-order magnitude curve have no resonant peak? Show where the boundary value comes from.
:::

::: answer
The bottom of $M^2$ is $D(r) = (1 - r^2)^2 + 4\zeta^2r^2$. Its lowest point, over $r^2$, is at $r^2 = 1 - 2\zeta^2$. That is a real, positive frequency only if $\zeta < 1/\sqrt{2}$.

For $\zeta \ge 1/\sqrt{2} = 0.707$ the lowest point of $D$ is at $r = 0$, so $M$ only falls from $1$ and there is no peak. At exactly $1/\sqrt{2}$, $D = 1 + r^4$ with no $r^2$ term — the maximally flat response.
:::

::: check
A gimbal is commanded to sweep at a steady $0.2\,\mathrm{rad/s}$. Its servo is second order with $\omega_n = 12\,\mathrm{rad/s}$ and $\zeta = 0.7$. Once the transient has died, how far behind the command is the gimbal, in time and in angle?
:::

::: answer
The ramp lag is $2\zeta/\omega_n = 1.4/12 = 0.117\,\mathrm{s}$. In angle that is $0.2 \times 0.117 = 0.0233\,\mathrm{rad}$, about $1.3^\circ$.

If that error matters, the designer either raises $\omega_n$ or adds integral action so the loop follows ramps with no error — a topic for the control track.
:::

::: check
A second-order system is driven by $\cos\omega t$, and the measured steady output is $0.5\cos(\omega t - 90^\circ)$. What can you conclude about $\omega$ and $\zeta$?
:::

::: answer
A lag of exactly $90^\circ$ happens only at $\omega = \omega_n$, because $\tan\phi = 2\zeta r/(1 - r^2)$ is infinite only at $r = 1$. There $M = 1/(2\zeta)$, so $0.5 = 1/(2\zeta)$ gives $\zeta = 1$. The system is critically damped and being driven at its natural frequency; the output is half the input.
:::

::: check
The bending mode above is shaken by a nozzle wiggle at exactly $2.5\,\mathrm{Hz}$ that lasts $5\,\mathrm{s}$ and then stops. Roughly how big does the bending get, and how long after the wiggle stops is it still above $10\,\mathrm{mm}$?
:::

::: answer
While driven, the envelope is $100(1 - e^{-\sigma t})\,\mathrm{mm}$ with $\sigma = \zeta\omega_n = 0.0785\,\mathrm{s^{-1}}$. At $5\,\mathrm{s}$: $100(1 - e^{-0.393}) = 32.5\,\mathrm{mm}$. (Solving the exact equation gives $31.9\,\mathrm{mm}$.)

After the wiggle stops, the mode rings freely and decays like $32\,e^{-0.0785(t - 5)}$. It falls to $10\,\mathrm{mm}$ when $e^{-0.0785\Delta t} = 10/32$, that is $\Delta t = \ln 3.2/0.0785 = 14.8\,\mathrm{s}$. Five seconds of forcing leave about fifteen more seconds of ringing above a tenth of the full resonant size.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $y = y_p + y_h$ | Particular (steady-state) plus free (transient) response; the starting conditions fix $y_h$ after $y_p$ is chosen |
| $y_p = U$; $y_p = r(t - 2\zeta/\omega_n)$ | Steady state for a step and a ramp; ramp lag $2\zeta/\omega_n$ seconds |
| $y_p = AM\cos(\omega t - \phi)$ | Sinusoidal steady state: same frequency, scaled and delayed |
| $M = \omega_n^2\big/\sqrt{(\omega_n^2 - \omega^2)^2 + (2\zeta\omega_n\omega)^2}$ | Magnitude ratio, no units |
| $\tan\phi = 2\zeta\omega_n\omega/(\omega_n^2 - \omega^2)$ | Phase lag: $0^\circ$ at low frequency, $90^\circ$ at $\omega_n$, $180^\circ$ at high frequency; use atan2 |
| $Me^{-j\phi} = G(j\omega)$, $G(s) = \omega_n^2/(s^2 + 2\zeta\omega_n s + \omega_n^2)$ | Frequency response is the transfer function on the imaginary axis |
| $M(\omega_n) = 1/(2\zeta)$ | Size at the natural frequency |
| $\omega_r = \omega_n\sqrt{1 - 2\zeta^2}$, $M_{\mathrm{peak}} = 1/(2\zeta\sqrt{1 - \zeta^2})$ | Resonant frequency and peak, only for $\zeta < 0.707$ |
| $\zeta = 1/\sqrt{2}$ | Maximally flat (Butterworth) response, no peak; about 4.3% overshoot and $65^\circ$ phase margin |
| $\approx 2\zeta\omega_n$ | Width of the resonance band for light damping |
| $y \approx \dfrac{A}{2\zeta}(1 - e^{-\zeta\omega_n t})\sin\omega_n t$ | Build-up at resonance from rest; $\to (A\omega_n t/2)\sin\omega_n t$ as $\zeta \to 0$ |

The next lesson brings in the Laplace transform. It turns a differential equation into algebra, handles the starting conditions and the forcing in one step, and makes the $G(s)$ that appeared here the main character of the rest of the module.

::: context buffet What aerodynamic buffet is
**Buffet** is the shaking a vehicle feels when the air flowing over it turns rough and bumpy instead of smooth. It is worst near the speed of sound, where shock waves form and wander across the body, and where the air tears away from the surface behind bulges and steps.

On a rocket this happens in the first minute or two of flight. Buffet does not push at one tidy frequency; it shakes at many at once. Any of them that lands near a bending mode gets amplified — which is exactly what this lesson is about.
:::

::: context ramp-lag The output runs behind the ramp
The pitch-rate loop ($\omega_n = 2.5\,\mathrm{rad/s}$, $\zeta = 0.6$) following a unit ramp from rest. The command is the grey line. The output (red) starts slowly, then climbs at the same rate, but always $2\zeta/\omega_n = 0.48\,\mathrm{s}$ behind.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 205" font-family="Inter, Arial, sans-serif">
  <defs><marker id="la" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 Z" fill="#1d6fd1"/></marker></defs>
  <line x1="40" y1="180" x2="330" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="180" x2="40" y2="12" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="180" x2="320" y2="20" stroke="#6c7a93" stroke-width="2.5"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2.5" points="40.0,180.0 47.0,180.0 54.0,179.7 61.0,179.1 68.0,178.1 75.0,176.5 82.0,174.5 89.0,172.0 96.0,169.1 103.0,165.7 110.0,162.1 117.0,158.2 124.0,154.2 131.0,150.0 138.0,145.6 145.0,141.3 152.0,136.9 159.0,132.5 166.0,128.2 173.0,123.9 180.0,119.6 187.0,115.4 194.0,111.2 201.0,107.1 208.0,103.0 215.0,98.9 222.0,94.9 229.0,90.9 236.0,86.9 243.0,82.9 250.0,79.0 257.0,75.0 264.0,71.0 271.0,67.1 278.0,63.1 285.0,59.1 292.0,55.2 299.0,51.2 306.0,47.2 313.0,43.2 320.0,39.2"/>
  <line x1="250.0" y1="60" x2="283.6" y2="60" stroke="#1d6fd1" stroke-width="2" marker-start="url(#la)" marker-end="url(#la)"/>
  <text x="292" y="66" font-size="12" fill="#1d6fd1">0.48 s</text>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="196">0</text><text x="110" y="196">1</text><text x="180" y="196">2</text><text x="250" y="196">3</text><text x="320" y="196">4 s</text>
  </g>
  <text x="56" y="100" font-size="12" fill="#6c7a93">command</text>
  <text x="196" y="160" font-size="12" fill="#b4232c">output</text>
</svg>
```

The gap stays constant forever: the loop has the right speed but never catches up.
:::

::: context no-new-frequencies Why a linear system keeps the frequency
Every term on the left of the equation is $y$ or one of its derivatives, times a constant. Differentiating a wave of frequency $\omega$ gives a wave of the same frequency, and adding waves of the same frequency gives another one. So only a wave of frequency $\omega$ can balance an input of frequency $\omega$.

A **nonlinear** system can make new frequencies. An overdriven guitar amplifier turns one clean note into a buzz of higher notes called harmonics. So if a test shows a new frequency in a vehicle's response, something in it is not behaving linearly — a loose joint, a saturating actuator, a valve slamming open and shut.
:::

::: context bode Hendrik Bode and his plots
A **Bode plot** (say "BOH-dee") draws a system's frequency response as two graphs, one above the other: the size $|G(j\omega)|$ and the phase $\angle G(j\omega)$, both against frequency on a logarithmic scale. Hendrik Bode developed these methods at Bell Telephone Laboratories in the 1930s and 1940s, while designing amplifiers for long-distance telephone lines.

Control engineers today read stability margins straight off these two curves. The control track uses them constantly.
:::

::: context magnitude-curves Three damping ratios on one graph
The magnitude ratio $M$ against the frequency ratio $r = \omega/\omega_n$. With $\zeta = 0.1$ (red) the peak reaches about $5$. With $\zeta = 0.3$ (orange) it reaches $1.75$. With $\zeta = 0.707$ (blue) there is no peak at all. Every curve starts at $1$ and falls toward zero at high frequency.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="190" x2="345" y2="190" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="190" x2="40" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="160" x2="345" y2="160" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="160" y1="190" x2="160" y2="30" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2.5" points="40.0,160.0 46.0,159.9 52.0,159.7 58.0,159.3 64.0,158.8 70.0,158.0 76.0,157.1 82.0,155.9 88.0,154.4 94.0,152.6 100.0,150.4 106.0,147.5 112.0,143.9 118.0,139.3 124.0,133.3 130.0,125.1 136.0,113.8 142.0,97.8 148.0,75.4 150.4,64.8 151.6,59.5 152.8,54.3 154.0,49.5 155.2,45.3 156.4,42.1 157.6,40.0 158.8,39.2 160.0,40.0 161.2,42.2 162.4,45.7 163.6,50.3 164.8,55.7 166.0,61.6 167.2,67.8 168.4,73.9 169.6,80.0 172.0,91.4 178.0,114.3 184.0,130.1 190.0,141.3 196.0,149.3 202.0,155.3 208.0,160.0 214.0,163.7 220.0,166.7 226.0,169.1 232.0,171.2 238.0,172.9 244.0,174.4 250.0,175.7 256.0,176.8 262.0,177.8 268.0,178.6 274.0,179.4 280.0,180.1 286.0,180.7 292.0,181.3 298.0,181.8 304.0,182.2 310.0,182.7 316.0,183.0 322.0,183.4 328.0,183.7 334.0,184.0 340.0,184.3"/>
  <polyline fill="none" stroke="#f2b880" stroke-width="2.5" points="40.0,160.0 46.0,159.9 52.0,159.8 58.0,159.4 64.0,159.0 70.0,158.4 76.0,157.7 82.0,156.8 88.0,155.7 94.0,154.4 100.0,152.9 106.0,151.1 112.0,149.1 118.0,146.9 124.0,144.6 130.0,142.2 136.0,140.0 142.0,138.3 148.0,137.6 150.4,137.6 151.6,137.7 152.8,137.9 154.0,138.1 155.2,138.4 156.4,138.7 157.6,139.1 158.8,139.5 160.0,140.0 161.2,140.5 162.4,141.1 163.6,141.7 164.8,142.3 166.0,143.0 167.2,143.7 168.4,144.4 169.6,145.2 172.0,146.7 178.0,150.6 184.0,154.4 190.0,158.0 196.0,161.2 202.0,164.0 208.0,166.5 214.0,168.6 220.0,170.5 226.0,172.2 232.0,173.6 238.0,174.9 244.0,176.0 250.0,177.0 256.0,177.9 262.0,178.7 268.0,179.5 274.0,180.1 280.0,180.7 286.0,181.3 292.0,181.7 298.0,182.2 304.0,182.6 310.0,183.0 316.0,183.3 322.0,183.7 328.0,184.0 334.0,184.2 340.0,184.5"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40.0,160.0 46.0,160.0 52.0,160.0 58.0,160.0 64.0,160.0 70.0,160.1 76.0,160.1 82.0,160.2 88.0,160.4 94.0,160.6 100.0,160.9 106.0,161.3 112.0,161.8 118.0,162.4 124.0,163.1 130.0,163.8 136.0,164.7 142.0,165.7 148.0,166.7 150.4,167.1 151.6,167.3 152.8,167.5 154.0,167.7 155.2,167.9 156.4,168.1 157.6,168.4 158.8,168.6 160.0,168.8 161.2,169.0 162.4,169.2 163.6,169.4 164.8,169.6 166.0,169.8 167.2,170.1 168.4,170.3 169.6,170.5 172.0,170.9 178.0,171.9 184.0,172.9 190.0,173.8 196.0,174.7 202.0,175.6 208.0,176.4 214.0,177.1 220.0,177.8 226.0,178.5 232.0,179.1 238.0,179.7 244.0,180.2 250.0,180.7 256.0,181.2 262.0,181.6 268.0,182.0 274.0,182.4 280.0,182.7 286.0,183.1 292.0,183.4 298.0,183.7 304.0,183.9 310.0,184.2 316.0,184.4 322.0,184.7 328.0,184.9 334.0,185.1 340.0,185.3"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="205">0</text><text x="160" y="205">1</text><text x="280" y="205">2</text><text x="330" y="205">r</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="34" y="164">1</text><text x="34" y="104">3</text><text x="34" y="44">5</text><text x="34" y="20">M</text>
  </g>
  <line x1="36" y1="130" x2="40" y2="130" stroke="#1f2a44"/><line x1="36" y1="100" x2="40" y2="100" stroke="#1f2a44"/><line x1="36" y1="70" x2="40" y2="70" stroke="#1f2a44"/><line x1="36" y1="40" x2="40" y2="40" stroke="#1f2a44"/>
  <text x="172" y="44" font-size="12" fill="#b4232c">ζ = 0.1</text>
  <text x="52" y="126" font-size="12" fill="#1f2a44">ζ = 0.3</text>
  <line x1="100" y1="128" x2="138" y2="137" stroke="#1f2a44" stroke-width="1"/>
  <text x="84" y="182" font-size="12" fill="#1d6fd1">ζ = 0.707</text>
</svg>
```

The dashed line marks $M = 1$: above it the system amplifies the input, below it the system shrinks it.
:::

::: context atan2-again atan2 comes back
In the trigonometry module you met `atan2(y, x)`, the arctangent that looks at the signs of both parts, so it knows which quadrant the angle is in. Plain $\arctan(y/x)$ loses that, because dividing throws away the signs.

Here the "y" is $2\zeta r$, always positive, and the "x" is $1 - r^2$, which turns negative above resonance. So the angle moves into the second quadrant, between $90^\circ$ and $180^\circ$. Plain arctan would wrongly put it in the fourth.
:::

::: context half-power Why "half power"
The energy of a vibration goes as the square of its size. If the size drops to $1/\sqrt{2} \approx 0.707$ of the peak, the square drops to $\tfrac{1}{2}$: half the power.

The width of the band between the two half-power points compared with the center frequency tells you how sharp a resonance is. Radio engineers call the inverse of that fraction the **quality factor**, $Q$. For a lightly damped mode $Q \approx 1/(2\zeta)$, so the bending mode with $\zeta = 0.005$ has $Q \approx 100$.
:::

::: context phase-margin What phase margin measures
A feedback loop goes unstable when a signal can travel around the loop and come back the same size and exactly upside down, so that each trip round feeds the next. **Phase margin** is how many extra degrees of lag the loop could take, at the frequency where its gain is one, before it reaches that point.

A delay adds lag, so phase margin is the loop's cushion against slow sensors, computer delays and actuator lags. For the loop that closes into the canonical system, $\zeta = 0.5$ gives about $52^\circ$, $\zeta = 0.6$ about $59^\circ$, and $\zeta = 0.707$ about $65^\circ$. The control track works this out in full.
:::

::: context unstable-rocket A rocket is a balanced broomstick
Try to balance a broom upright on your hand. Left alone it falls over; only constant small corrections keep it up. A rocket in the air is like that. The air's push on the body acts at a point called the **center of pressure**, which on most large rockets sits ahead of the center of mass. Any small tilt makes the air push the nose further round, so the tilt grows.

The engine's swiveling nozzle is the hand under the broom. The autopilot has to keep it correcting all the way up through the thick part of the atmosphere, without bending the vehicle too hard.
:::

::: context notch-filter What a notch filter does
A **notch filter** is a piece of the control software that blocks one narrow band of frequencies and lets everything else through. The graph of its size against frequency looks flat with one deep, narrow dip — the notch.

Put the notch at the bending frequency and the autopilot becomes almost deaf and mute there. It will not react to the bending the sensors feel, and it will not push the nozzle in a way that feeds the bending. Engineers have to know the bending frequency well, and it drifts as propellant burns off and the rocket gets lighter, so the notch is often scheduled to move during flight.
:::

::: context buildup How a resonance builds up
Driving exactly at resonance from rest, with $\zeta = 0.05$ so the growth fits on the page. The red curve is the exact response, scaled so that the final steady size is $1$ (grey dashed lines). It starts at zero and grows inside the blue envelope $1 - e^{-\zeta\omega_n t}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="100" x2="335" y2="100" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="30" y1="30" x2="330" y2="30" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="30" y1="170" x2="330" y2="170" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="1.8" stroke-dasharray="5 3" points="30.0,100.0 40.0,93.3 50.0,87.3 60.0,81.9 70.0,76.9 80.0,72.5 90.0,68.4 100.0,64.8 110.0,61.5 120.0,58.5 130.0,55.8 140.0,53.3 150.0,51.1 160.0,49.1 170.0,47.3 180.0,45.6 190.0,44.1 200.0,42.8 210.0,41.6 220.0,40.5 230.0,39.5 240.0,38.6 250.0,37.8 260.0,37.0 270.0,36.4 280.0,35.7 290.0,35.2 300.0,34.7 310.0,34.3 320.0,33.9 330.0,33.5"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="1.8" stroke-dasharray="5 3" points="30.0,100.0 40.0,106.7 50.0,112.7 60.0,118.1 70.0,123.1 80.0,127.5 90.0,131.6 100.0,135.2 110.0,138.5 120.0,141.5 130.0,144.2 140.0,146.7 150.0,148.9 160.0,150.9 170.0,152.7 180.0,154.4 190.0,155.9 200.0,157.2 210.0,158.4 220.0,159.5 230.0,160.5 240.0,161.4 250.0,162.2 260.0,163.0 270.0,163.6 280.0,164.3 290.0,164.8 300.0,165.3 310.0,165.7 320.0,166.1 330.0,166.5"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="1.6" points="30.0,100.0 31.2,99.8 32.5,99.2 33.8,98.3 35.0,97.2 36.2,96.0 37.5,95.0 38.8,94.3 40.0,94.1 41.2,94.4 42.5,95.3 43.8,96.8 45.0,98.9 46.2,101.4 47.5,104.2 48.8,107.0 50.0,109.7 51.2,112.1 52.5,113.8 53.8,114.7 55.0,114.7 56.2,113.6 57.5,111.6 58.8,108.5 60.0,104.7 61.2,100.2 62.5,95.4 63.8,90.6 65.0,86.1 66.2,82.3 67.5,79.4 68.8,77.6 70.0,77.3 71.2,78.4 72.5,81.0 73.8,84.9 75.0,90.0 76.2,96.0 77.5,102.5 78.8,109.1 80.0,115.4 81.2,121.0 82.5,125.4 83.8,128.3 85.0,129.6 86.2,129.0 87.5,126.5 88.8,122.2 90.0,116.4 91.2,109.4 92.5,101.6 93.8,93.4 95.0,85.4 96.2,78.1 97.5,72.1 98.8,67.6 100.0,65.0 101.2,64.7 102.5,66.5 103.8,70.5 105.0,76.5 106.2,84.1 107.5,92.8 108.8,102.2 110.0,111.7 111.2,120.6 112.5,128.4 113.8,134.6 115.0,138.7 116.2,140.4 117.5,139.7 118.8,136.4 120.0,130.8 121.2,123.1 122.5,113.9 123.8,103.6 125.0,92.9 126.2,82.6 127.5,73.1 128.8,65.2 130.0,59.4 131.2,56.0 132.5,55.3 133.8,57.5 135.0,62.3 136.2,69.6 137.5,78.8 138.8,89.5 140.0,101.1 141.2,112.6 142.5,123.6 143.8,133.2 145.0,140.8 146.2,146.0 147.5,148.3 148.8,147.7 150.0,144.0 151.2,137.6 152.5,128.7 153.8,118.0 155.0,106.0 156.2,93.5 157.5,81.3 158.8,70.2 160.0,60.8 161.2,53.8 162.5,49.6 163.8,48.5 165.0,50.6 166.2,55.8 167.5,63.9 168.8,74.2 170.0,86.3 171.2,99.3 172.5,112.5 173.8,125.0 175.0,136.0 176.2,144.9 177.5,151.0 178.8,154.0 180.0,153.6 181.2,149.9 182.5,143.1 183.8,133.5 185.0,121.7 186.2,108.6 187.5,94.8 188.8,81.2 190.0,68.7 191.2,58.1 192.5,50.1 193.8,45.1 195.0,43.5 196.2,45.4 197.5,50.7 198.8,59.2 200.0,70.2 201.2,83.2 202.5,97.2 203.8,111.6 205.0,125.2 206.2,137.4 207.5,147.3 208.8,154.4 210.0,158.0 211.2,158.1 212.5,154.5 213.8,147.5 215.0,137.6 216.2,125.2 217.5,111.2 218.8,96.5 220.0,81.9 221.2,68.3 222.5,56.7 223.8,47.8 225.0,42.0 226.2,39.8 227.5,41.4 228.8,46.6 230.0,55.2 231.2,66.6 232.5,80.1 233.8,94.9 235.0,110.1 236.2,124.7 237.5,137.9 238.8,148.7 240.0,156.5 241.2,160.8 242.5,161.4 243.8,158.1 245.0,151.2 246.2,141.1 247.5,128.4 248.8,113.9 250.0,98.5 251.2,83.1 252.5,68.7 253.8,56.3 255.0,46.5 256.2,40.0 257.5,37.3 258.8,38.4 260.0,43.4 261.2,51.9 262.5,63.4 263.8,77.3 265.0,92.6 266.2,108.4 267.5,123.7 268.8,137.6 270.0,149.1 271.2,157.7 272.5,162.7 273.8,163.8 275.0,160.9 276.2,154.2 277.5,144.2 278.8,131.3 280.0,116.5 281.2,100.6 282.5,84.7 283.8,69.7 285.0,56.5 286.2,46.0 287.5,38.8 288.8,35.5 290.0,36.1 291.2,40.7 292.5,49.1 293.8,60.6 295.0,74.5 296.2,90.1 297.5,106.4 298.8,122.2 300.0,136.8 301.2,149.0 302.5,158.2 303.8,163.9 305.0,165.5 306.2,163.1 307.5,156.7 308.8,146.9 310.0,134.0 311.2,119.1 312.5,102.9 313.8,86.5 315.0,71.0 316.2,57.2 317.5,46.1 318.8,38.3 320.0,34.3 321.2,34.4 322.5,38.6 323.8,46.6 325.0,58.0 326.2,72.0 327.5,87.7 328.8,104.2 330.0,120.5"/>
  <text x="26" y="34" font-size="11" fill="#1f2a44" text-anchor="end">1</text>
  <text x="26" y="174" font-size="11" fill="#1f2a44" text-anchor="end">−1</text>
  <text x="26" y="104" font-size="11" fill="#1f2a44" text-anchor="end">0</text>
  <text x="330" y="192" font-size="11" fill="#1f2a44" text-anchor="end">time: about 10 cycles</text>
</svg>
```

After about ten cycles it has reached only $95\%$ of full size. With $\zeta = 0.005$ it would take ten times as many cycles.
:::

::: context pogo Pogo: when a rocket shakes itself
**Pogo** is a resonance between a rocket's structure and its engines. The stage stretches and squeezes along its length, which changes the pressure of the propellant flowing to the engines. That changes the thrust, which squeezes the structure again. If the two rhythms line up, the shaking grows — like a pogo stick.

On Apollo 13 in April 1970, pogo on the Saturn V's second stage shook the center engine so violently, at about $16\,\mathrm{Hz}$, that it shut down early. The other engines burned longer to make up the difference. Engineers later added gas-filled accumulators to the propellant lines to damp the oscillation.
:::
