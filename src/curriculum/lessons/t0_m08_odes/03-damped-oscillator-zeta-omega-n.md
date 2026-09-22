---
id: l03-damped-oscillator-zeta-omega-n
title: The damped oscillator, natural frequency and damping ratio
minutes: 19
covers:
  - "the damped oscillator: natural frequency and damping ratio"
---

Lesson 2 solved $a\ddot{y} + b\dot{y} + cy = 0$ by finding the roots of a quadratic. Three coefficients went in, and the shape of the motion came out of a discriminant. That is correct but clumsy: the three numbers $a$, $b$, $c$ carry one scale factor that does nothing, and the two numbers that matter — how fast the motion is and how quickly it dies — are buried inside them. Control engineers fixed this a century ago by rewriting every second-order system in a **canonical form** with exactly two parameters: the **natural frequency** $\omega_n$ and the **damping ratio** $\zeta$. Once you can read those two numbers off a pole pair, you can predict overshoot and settling time in your head, before any simulation runs.

This vocabulary is not optional in GNC. A thrust-vector actuator is specified by its natural frequency and damping ratio. A pitch-rate loop is tuned to a target damping ratio. A flexible booster's first bending mode is quoted as a frequency and a damping ratio, and the fact that the damping ratio is tiny is the whole reason the mode is dangerous. When a colleague says "the closed-loop poles are at $-2 \pm 5j$" she expects you to reply with $\zeta$, $\omega_n$ and the overshoot without reaching for a calculator.

This lesson defines the canonical form, maps its pole pair to $\zeta$ and $\omega_n$ and back, classifies the four damping regimes, derives the step response in each regime, and extracts the two numbers a designer cares about from it: percent overshoot and settling time.

## The canonical second-order system

Start from a mass–spring–damper, $m\ddot{x} + c\dot{x} + kx = F(t)$. Divide through by $m$ so that the leading coefficient is one, and give the remaining two coefficients names:

$$
\ddot{x} + \frac{c}{m}\dot{x} + \frac{k}{m}x = \frac{F}{m}, \qquad \omega_n^2 \equiv \frac{k}{m}, \qquad 2\zeta\omega_n \equiv \frac{c}{m}.
$$

With the forcing written as $\omega_n^2 u$, where $u$ has the same units as the output, the equation becomes the **canonical second-order system**

$$
\ddot{y} + 2\zeta\omega_n\dot{y} + \omega_n^2 y = \omega_n^2 u(t).
$$

The factor $\omega_n^2$ on the right is chosen so that a constant input $u = U$ gives the constant equilibrium $y = U$: the system has unit steady-state gain. Every stable second-order system with no zero can be put in this form, and most of the ones you meet can be approximated by it.

The **natural frequency** $\omega_n = \sqrt{k/m}$, in $\mathrm{rad/s}$, is the angular frequency at which the system would oscillate with no damping at all. It sets the time scale of everything: double $\omega_n$ and the whole response plays twice as fast. The **damping ratio**

$$
\zeta = \frac{c}{2\sqrt{km}} = \frac{c}{c_{\mathrm{crit}}}
$$

is dimensionless. It is the actual damping divided by the critical damping $c_{\mathrm{crit}} = 2\sqrt{km}$ that lesson 2 found as the boundary between ringing and not ringing. Because it is a ratio, $\zeta$ describes the *shape* of the response independent of how fast it is, which is why it is the number a specification quotes.

::: key
Canonical second-order system: $\ddot{y} + 2\zeta\omega_n\dot{y} + \omega_n^2 y = \omega_n^2 u$. Natural frequency $\omega_n = \sqrt{k/m}$ in $\mathrm{rad/s}$; damping ratio $\zeta = c/(2\sqrt{km})$, dimensionless, equal to the damping divided by the critical damping. Its transfer function, which lesson 7 defines, is $G(s) = \omega_n^2/(s^2 + 2\zeta\omega_n s + \omega_n^2)$.
:::

## From $\zeta$ and $\omega_n$ to the poles, and back

The characteristic equation of the canonical form is

$$
s^2 + 2\zeta\omega_n s + \omega_n^2 = 0 \quad\Longrightarrow\quad s = -\zeta\omega_n \pm \omega_n\sqrt{\zeta^2 - 1}.
$$

When $\zeta < 1$ the square root is imaginary, and the roots — the **poles** — are the complex pair

$$
s = -\zeta\omega_n \pm j\,\omega_n\sqrt{1 - \zeta^2} \equiv -\sigma \pm j\omega_d.
$$

Two derived quantities appear here and are used constantly. The **decay rate** $\sigma = \zeta\omega_n$, in $\mathrm{s^{-1}}$, is the magnitude of the real part; the free response decays inside the envelope $e^{-\sigma t}$, so $1/\sigma$ is the time constant of the ringing. The **damped natural frequency** $\omega_d = \omega_n\sqrt{1 - \zeta^2}$ is the imaginary part, the frequency you actually see the system oscillate at; the ringing period is $2\pi/\omega_d$. Damping slows the oscillation, though not by much until $\zeta$ is large: at $\zeta = 0.3$, $\omega_d = 0.954\,\omega_n$.

Now the reverse direction, which is what you do when a simulation or a root locus hands you poles. Given $s = -\sigma \pm j\omega_d$,

$$
\omega_n = \sqrt{\sigma^2 + \omega_d^2}, \qquad \zeta = \frac{\sigma}{\omega_n}.
$$

The first follows from $\sigma^2 + \omega_d^2 = \zeta^2\omega_n^2 + \omega_n^2(1 - \zeta^2) = \omega_n^2$; the second is the definition of $\sigma$. Geometrically, plot the pole in the complex plane. Its distance from the origin is $\omega_n$: poles of equal natural frequency lie on circles about the origin. The angle $\theta$ it makes with the negative real axis satisfies $\cos\theta = \sigma/\omega_n = \zeta$: poles of equal damping ratio lie on rays from the origin. A pole on the negative real axis has $\zeta = 1$; a pole on the imaginary axis has $\zeta = 0$; the ray at $45^\circ$ is $\zeta = \cos 45^\circ = 0.707$. Once this picture is in your head you can read $\zeta$ off a pole plot by eye.

::: key
Poles of the canonical system: $s = -\zeta\omega_n \pm j\omega_n\sqrt{1 - \zeta^2}$. The real part $-\sigma = -\zeta\omega_n$ sets the decay rate; the imaginary part is the damped frequency $\omega_d = \omega_n\sqrt{1 - \zeta^2}$, so the ringing period is $2\pi/\omega_d$. Given poles at $-\sigma \pm j\omega_d$: $\omega_n = \sqrt{\sigma^2 + \omega_d^2}$ and $\zeta = \sigma/\omega_n = \cos\theta$, with $\theta$ the angle from the negative real axis.
:::

::: example Reading a pitch-rate loop off its poles
A closed pitch-rate loop on a small aircraft has its dominant poles at $s = -1.5 \pm 2j\ \mathrm{s^{-1}}$. Then

$$
\omega_n = \sqrt{1.5^2 + 2^2} = \sqrt{6.25} = 2.5\,\mathrm{rad/s}, \qquad \zeta = \frac{1.5}{2.5} = 0.6, \qquad \omega_d = 2\,\mathrm{rad/s}.
$$

The pole makes an angle $\theta = \arccos 0.6 = 53.1^\circ$ with the negative real axis. The loop rings at $2\,\mathrm{rad/s}$, period $3.14\,\mathrm{s}$, inside an envelope with time constant $1/1.5 = 0.667\,\mathrm{s}$. Later in this lesson you will see that these poles imply about 9.5% overshoot and a 2% settling time of about $2.7\,\mathrm{s}$. Had the designer wanted less overshoot at the same speed, she would rotate the poles toward the real axis on the same $\omega_n = 2.5$ circle.
:::

## The four damping regimes

The value of $\zeta$ alone sorts the free response into the three cases of lesson 2 plus the boundary at zero damping.

- $\zeta = 0$: **undamped**. Poles at $\pm j\omega_n$ on the imaginary axis; the free response $\cos\omega_n t$ never decays. A frictionless spring, or an ideal orbit oscillation.
- $0 < \zeta < 1$: **underdamped**. A complex pair in the left half plane; the response oscillates at $\omega_d$ inside a decaying envelope. Almost every well-tuned control loop lives here, typically between $\zeta = 0.4$ and $0.8$.
- $\zeta = 1$: **critically damped**. A repeated real pole at $-\omega_n$; the response $(C_1 + C_2t)e^{-\omega_n t}$ returns to rest as fast as possible without overshooting.
- $\zeta > 1$: **overdamped**. Two distinct real poles $s_{1,2} = -\zeta\omega_n \pm \omega_n\sqrt{\zeta^2 - 1}$, both negative; the response is a sum of two decaying exponentials with no oscillation, and it is *slower* than critical, because the pole nearer the origin, $s_1 = -\omega_n(\zeta - \sqrt{\zeta^2 - 1})$, drifts toward zero as $\zeta$ grows.

::: key
Classify by damping ratio: $\zeta = 0$ undamped · $0 < \zeta < 1$ underdamped (oscillatory) · $\zeta = 1$ critically damped (fastest return without overshoot) · $\zeta > 1$ overdamped.
:::

::: warning
"More damping is safer" is false past $\zeta = 1$. An overdamped actuator with $\zeta = 2$ has a slow pole at $-\omega_n(2 - \sqrt{3}) = -0.268\,\omega_n$, so it settles almost four times more slowly than a critically damped one with the same $\omega_n$. Excess damping trades overshoot for sluggishness, and a sluggish actuator costs phase in the loop wrapped around it.
:::

## The step response

The number a designer quotes — overshoot, settling time, rise time — comes from the response to a unit step: $u(t) = 1$ for $t \ge 0$, starting from rest, $y(0) = \dot{y}(0) = 0$. Because the equation is linear, the solution is a particular solution plus the free response (lesson 1). For constant forcing the particular solution is the constant $y_p = 1$: substitute it and both derivatives vanish, leaving $\omega_n^2 \cdot 1 = \omega_n^2$. So

$$
y(t) = 1 + y_h(t),
$$

and the free response $y_h$ must carry the initial conditions $y_h(0) = -1$, $\dot{y}_h(0) = 0$. Each regime gives a different $y_h$.

### Underdamped, $0 < \zeta < 1$

From lesson 2, $y_h = e^{-\sigma t}(C_1\cos\omega_d t + C_2\sin\omega_d t)$. Then $y_h(0) = C_1 = -1$, and since $\dot{y}_h(0) = -\sigma C_1 + \omega_d C_2 = 0$, $C_2 = \sigma C_1/\omega_d = -\sigma/\omega_d$. Hence

$$
y(t) = 1 - e^{-\zeta\omega_n t}\left(\cos\omega_d t + \frac{\zeta}{\sqrt{1 - \zeta^2}}\sin\omega_d t\right),
$$

using $\sigma/\omega_d = \zeta\omega_n/(\omega_n\sqrt{1 - \zeta^2})$. The bracket has amplitude $\sqrt{1 + \zeta^2/(1 - \zeta^2)} = 1/\sqrt{1 - \zeta^2}$, so a compact form is

$$
y(t) = 1 - \frac{e^{-\zeta\omega_n t}}{\sqrt{1 - \zeta^2}}\,\sin\!\bigl(\omega_d t + \theta\bigr), \qquad \cos\theta = \zeta.
$$

The response rises, overshoots 1, rings about it at $\omega_d$, and the ringing dies inside the envelope $e^{-\zeta\omega_n t}/\sqrt{1 - \zeta^2}$.

### Critically damped, $\zeta = 1$

Here $y_h = (C_1 + C_2t)e^{-\omega_n t}$ with $C_1 = -1$ and $\dot{y}_h(0) = C_2 - \omega_n C_1 = 0$, so $C_2 = -\omega_n$:

$$
y(t) = 1 - (1 + \omega_n t)\,e^{-\omega_n t}.
$$

It approaches 1 from below and never crosses it, because $(1 + \omega_n t)e^{-\omega_n t}$ is positive for all $t$.

### Overdamped, $\zeta > 1$

With real poles $s_1 = -\zeta\omega_n + \omega_n\sqrt{\zeta^2 - 1}$ and $s_2 = -\zeta\omega_n - \omega_n\sqrt{\zeta^2 - 1}$, write $y_h = C_1e^{s_1t} + C_2e^{s_2t}$. The conditions $C_1 + C_2 = -1$ and $s_1C_1 + s_2C_2 = 0$ give $C_1 = s_2/(s_1 - s_2)$ and $C_2 = -s_1/(s_1 - s_2)$, so

$$
y(t) = 1 + \frac{s_2\,e^{s_1t} - s_1\,e^{s_2t}}{s_1 - s_2}.
$$

Check $t = 0$: $1 + (s_2 - s_1)/(s_1 - s_2) = 0$. As $t$ grows the $e^{s_2t}$ term, with the more negative exponent, vanishes first and the tail is governed by the slow pole $s_1$.

::: warning
In the overdamped case do not write $y = 1 - e^{s_1t} - e^{s_2t}$ or any other guess that "looks like" the two-exponential form. Both coefficients are fixed by the two initial conditions and they are not equal. If your step response does not start at exactly zero with zero slope, the coefficients are wrong.
:::

## Percent overshoot

Differentiate the underdamped step response. The product rule on the first form gives, after the $\cos\omega_d t$ terms cancel,

$$
\dot{y}(t) = e^{-\sigma t}\left(\frac{\sigma^2}{\omega_d} + \omega_d\right)\sin\omega_d t = \frac{\omega_n^2}{\omega_d}\,e^{-\sigma t}\sin\omega_d t,
$$

using $\sigma^2 + \omega_d^2 = \omega_n^2$. The slope is zero whenever $\sin\omega_d t = 0$, that is at $t = k\pi/\omega_d$. The first of these after $t = 0$ is the **peak time**

$$
t_p = \frac{\pi}{\omega_d} = \frac{\pi}{\omega_n\sqrt{1 - \zeta^2}},
$$

half a ringing period. At that instant $\cos\omega_d t_p = -1$ and $\sin\omega_d t_p = 0$, so $y(t_p) = 1 + e^{-\sigma\pi/\omega_d}$, and the **percent overshoot** — the peak excess over the final value, as a percentage of the step — is

$$
\mathrm{PO} = 100\,\exp\!\left(-\frac{\pi\zeta}{\sqrt{1 - \zeta^2}}\right).
$$

Overshoot depends on $\zeta$ alone. Whether the loop is a slow satellite pointing loop or a fast actuator, a damping ratio of 0.5 overshoots by the same 16%. The table is worth knowing cold:

| $\zeta$ | 0.1 | 0.2 | 0.3 | 0.4 | 0.5 | 0.6 | 0.707 | 0.8 | 0.9 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PO (%) | 72.9 | 52.7 | 37.2 | 25.4 | 16.3 | 9.5 | 4.3 | 1.5 | 0.2 |

The formula is monotone, so it inverts: a specification of "no more than 10% overshoot" is a specification of $\zeta \ge 0.59$, which is a ray in the pole plane. The value $\zeta = 1/\sqrt{2} = 0.707$ appears in many designs because it gives about 4% overshoot and, as lesson 5 shows, the flattest possible frequency response.

::: key
Percent overshoot of the second-order step response: $\mathrm{PO} = 100\exp\bigl(-\pi\zeta/\sqrt{1 - \zeta^2}\bigr)$, a function of $\zeta$ only. $\zeta = 0.707$ gives about 4.3%, $\zeta = 0.5$ about 16%, $\zeta = 0.1$ about 73%. The peak occurs at $t_p = \pi/\omega_d$.
:::

## Settling time

The **settling time** $t_s$ is the time after which the response stays within a band about its final value, conventionally $\pm 2\%$ or $\pm 5\%$ of the step. For the underdamped response the ringing is bounded by the envelope $e^{-\zeta\omega_n t}/\sqrt{1 - \zeta^2}$. Setting the envelope equal to 0.02 and ignoring the $1/\sqrt{1 - \zeta^2}$ factor, which is near one for moderate damping, gives $e^{-\zeta\omega_n t_s} = 0.02$, so $t_s = \ln 50/(\zeta\omega_n) = 3.91/(\zeta\omega_n)$. The working rule is

$$
t_s \approx \frac{4}{\zeta\omega_n} = \frac{4}{\sigma} \quad (2\%), \qquad t_s \approx \frac{3}{\zeta\omega_n} \quad (5\%),
$$

since $\ln 20 = 3.0$. Settling time depends on the real part of the poles *alone*: it is four time constants of the envelope, exactly the "settled after $4\tau$" rule of lesson 1 applied to the decay rate $\sigma$. Move the poles left and the response settles faster; move them up or down along a vertical line and the settling time does not change, only the overshoot.

Because the rule uses the envelope rather than the curve itself, it is a slightly conservative estimate: the actual response usually drops inside the band a little earlier, at the moment a ringing cycle happens to end. For the pitch-rate poles above, $4/1.5 = 2.67\,\mathrm{s}$, while the exact response is inside 2% after $2.38\,\mathrm{s}$. Either number is fine for design; quote "about $2.7\,\mathrm{s}$".

::: key
2% settling time: $t_s \approx 4/(\zeta\omega_n)$, set by the real part $\sigma = \zeta\omega_n$ of the pole pair alone. The 5% criterion uses $3/(\zeta\omega_n)$. Damped natural frequency $\omega_d = \omega_n\sqrt{1 - \zeta^2}$; ringing period $2\pi/\omega_d$.
:::

::: warning
The rule $t_s \approx 4/(\zeta\omega_n)$ is for the underdamped regime. For an overdamped system the product $\zeta\omega_n$ is the *average* of the two real poles, and the slow one governs: use $t_s \approx 4/|s_1|$ with $s_1$ the pole nearest the origin. With $\zeta = 2$ and $\omega_n = 40\,\mathrm{rad/s}$, $4/(\zeta\omega_n) = 0.05\,\mathrm{s}$ but the true 2% settling time is $0.37\,\mathrm{s}$ — off by a factor of seven. For the critically damped case the exact 2% time is about $5.8/\omega_n$, because of the $(1 + \omega_n t)$ factor.
:::

::: example A second-order thrust-vector actuator
Lesson 1 modelled a TVC actuator as a first-order lag. A better model includes the actuator's own inertia and is second order: the vendor quotes $\omega_n = 40\,\mathrm{rad/s}$ (about $6.4\,\mathrm{Hz}$) and $\zeta = 0.6$. The poles are

$$
s = -0.6 \times 40 \pm j\,40\sqrt{1 - 0.36} = -24 \pm 32j\ \mathrm{s^{-1}}.
$$

For a $2^\circ$ step command, the deflection follows $2\,y(t)$ with $y$ the unit step response: $\omega_d = 32\,\mathrm{rad/s}$, so the nozzle peaks at $t_p = \pi/32 = 0.098\,\mathrm{s}$, reaching $2 \times (1 + e^{-24\pi/32}) = 2 \times 1.095 = 2.19^\circ$ — an overshoot of $9.5\%$, or $0.19^\circ$. It settles to within 2% after about $4/24 = 0.17\,\mathrm{s}$ (the exact figure is $0.149\,\mathrm{s}$). Compare the first-order model with $\tau = 0.05\,\mathrm{s}$, which reached 98% at $0.2\,\mathrm{s}$ and never overshot. The second-order model is a little faster and rings once; the autopilot designer needs to know about that ring, because a nozzle that overshoots its command by $0.19^\circ$ puts an unrequested torque on the vehicle.
:::

::: example A flexible booster mode
The first lateral bending mode of a large launch vehicle is quoted as $f = 2.5\,\mathrm{Hz}$ with a structural damping ratio $\zeta = 0.005$. In canonical terms $\omega_n = 2\pi \times 2.5 = 15.7\,\mathrm{rad/s}$, $\omega_d = 15.7\sqrt{1 - 0.005^2} \approx 15.7\,\mathrm{rad/s}$ (indistinguishable from $\omega_n$), and the decay rate is $\sigma = \zeta\omega_n = 0.0785\,\mathrm{s^{-1}}$. The time constant of the envelope is $1/\sigma = 12.7\,\mathrm{s}$, which is about 32 oscillation cycles; a disturbance excites the mode and it is still ringing at 2% amplitude some $4/\sigma = 51\,\mathrm{s}$ later. The poles sit at $-0.0785 \pm 15.7j$, almost exactly on the imaginary axis. That is the significance of a small damping ratio: the mode stores energy and releases it very slowly, so a control loop that feeds even a little energy into it at $2.5\,\mathrm{Hz}$ can drive it to structural failure. Lesson 5 quantifies that amplification.
:::

::: note
Dimensional habits. $\omega_n$ is in $\mathrm{rad/s}$; a frequency quoted in hertz must be multiplied by $2\pi$ before it goes into the canonical form. $\sigma$ is in $\mathrm{s^{-1}}$ and $1/\sigma$ is a time. $\zeta$ has no units. When you see $s^2 + 6s + 25 = 0$, read it as $2\zeta\omega_n = 6$ and $\omega_n^2 = 25$: $\omega_n = 5\,\mathrm{rad/s}$, $\zeta = 0.6$, poles $-3 \pm 4j$. With practice this becomes instant.
:::

## Check yourself

::: check
A system obeys $\ddot{y} + 12\dot{y} + 400y = 400u$. Give $\omega_n$, $\zeta$, the poles, $\omega_d$, and the ringing period.
:::

::: answer
Match to the canonical form: $\omega_n^2 = 400$, so $\omega_n = 20\,\mathrm{rad/s}$; $2\zeta\omega_n = 12$, so $\zeta = 12/40 = 0.3$. Underdamped. $\sigma = \zeta\omega_n = 6\,\mathrm{s^{-1}}$ and $\omega_d = 20\sqrt{1 - 0.09} = 19.1\,\mathrm{rad/s}$, so the poles are $-6 \pm 19.1j$. The ringing period is $2\pi/19.1 = 0.329\,\mathrm{s}$. Note how little damping has changed the frequency: $\omega_d$ is 95% of $\omega_n$.
:::

::: check
For the same system, predict the percent overshoot and the 2% settling time of the step response.
:::

::: answer
$\mathrm{PO} = 100\exp(-0.3\pi/\sqrt{0.91}) = 100\exp(-0.988) = 37.2\%$. The 2% settling time is $t_s \approx 4/\sigma = 4/6 = 0.667\,\mathrm{s}$, about two ringing periods. The peak occurs at $t_p = \pi/19.1 = 0.165\,\mathrm{s}$.
:::

::: check
A mass of $2\,\mathrm{kg}$ hangs on a spring of stiffness $800\,\mathrm{N/m}$ with a damper of $24\,\mathrm{N\,s/m}$. What are $\omega_n$ and $\zeta$, and what damper would make it critically damped?
:::

::: answer
$\omega_n = \sqrt{k/m} = \sqrt{800/2} = 20\,\mathrm{rad/s}$ and $\zeta = c/(2\sqrt{km}) = 24/(2\sqrt{1600}) = 24/80 = 0.3$ — the same system as the previous two questions in physical clothing. Critical damping needs $c_{\mathrm{crit}} = 2\sqrt{km} = 80\,\mathrm{N\,s/m}$, so the damper must be increased by a factor of $1/\zeta = 3.33$.
:::

::: check
A designer moves a pair of poles from $-3 \pm 4j$ to $-3 \pm 8j$. What happens to $\omega_n$, $\zeta$, the overshoot and the settling time?
:::

::: answer
Before: $\omega_n = 5$, $\zeta = 0.6$, PO $= 9.5\%$, $t_s \approx 4/3 = 1.33\,\mathrm{s}$. After: $\omega_n = \sqrt{9 + 64} = 8.54\,\mathrm{rad/s}$, $\zeta = 3/8.54 = 0.351$, PO $= 100\exp(-0.351\pi/\sqrt{1 - 0.123}) = 30.8\%$. The settling time is unchanged at about $1.33\,\mathrm{s}$ because the real part did not move. The response rings faster and overshoots three times as much, but dies away in the same time.
:::

::: check
Why does the percent overshoot depend on $\zeta$ alone, while the settling time depends on $\zeta\omega_n$?
:::

::: answer
The natural frequency only rescales time: writing the step response in terms of $\omega_n t$ removes $\omega_n$ entirely, so every dimensionless feature of the curve — how far above 1 the first peak reaches — depends only on $\zeta$. Settling time is a *time*, so it must involve $\omega_n$; specifically the envelope is $e^{-\zeta\omega_n t}$, and reaching 2% takes $\ln 50 \approx 4$ envelope time constants, $4/(\zeta\omega_n)$. In the pole plane: overshoot is set by the ray (angle), settling time by the vertical line (real part).
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\ddot{y} + 2\zeta\omega_n\dot{y} + \omega_n^2y = \omega_n^2u$ | Canonical second-order system, unit steady-state gain |
| $\omega_n = \sqrt{k/m}$ | Natural frequency, $\mathrm{rad/s}$ |
| $\zeta = c/(2\sqrt{km})$ | Damping ratio, dimensionless; damping over critical damping |
| $s = -\zeta\omega_n \pm j\omega_n\sqrt{1 - \zeta^2}$ | Pole pair for $\zeta < 1$ |
| $\sigma = \zeta\omega_n$, $\omega_d = \omega_n\sqrt{1 - \zeta^2}$ | Decay rate ($\mathrm{s^{-1}}$) and damped frequency ($\mathrm{rad/s}$); period $2\pi/\omega_d$ |
| $\omega_n = \sqrt{\sigma^2 + \omega_d^2}$, $\zeta = \sigma/\omega_n = \cos\theta$ | Recovering $\zeta$, $\omega_n$ from poles at $-\sigma \pm j\omega_d$ |
| $\zeta = 0$, $0 < \zeta < 1$, $\zeta = 1$, $\zeta > 1$ | Undamped, underdamped, critically damped, overdamped |
| $y = 1 - \dfrac{e^{-\zeta\omega_n t}}{\sqrt{1 - \zeta^2}}\sin(\omega_d t + \theta)$ | Underdamped unit step response, $\cos\theta = \zeta$ |
| $y = 1 - (1 + \omega_n t)e^{-\omega_n t}$ | Critically damped step response |
| $y = 1 + \dfrac{s_2e^{s_1t} - s_1e^{s_2t}}{s_1 - s_2}$ | Overdamped step response |
| $t_p = \pi/\omega_d$ | Peak time |
| $\mathrm{PO} = 100\exp(-\pi\zeta/\sqrt{1 - \zeta^2})$ | Percent overshoot; 0.707 → 4.3%, 0.5 → 16%, 0.1 → 73% |
| $t_s \approx 4/(\zeta\omega_n)$ | 2% settling time (5%: $3/(\zeta\omega_n)$); overdamped: $4/\lvert s_1\rvert$ |

The next lesson rewrites this second-order equation as two first-order equations in a state vector, where the pole pair reappears as the eigenvalues of a matrix, and the matrix exponential replaces the case-by-case solution with a single formula.
