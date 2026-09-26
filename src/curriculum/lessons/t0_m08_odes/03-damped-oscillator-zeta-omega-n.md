---
id: l03-damped-oscillator-zeta-omega-n
title: The damped oscillator, natural frequency and damping ratio
minutes: 22
covers:
  - "the damped oscillator: natural frequency and damping ratio"
---

Describe a playground swing to a friend. You would not list its mass, the length of its chains and the friction in its hinges. You would say two things: how fast it swings back and forth, and how quickly it dies down once you stop pushing. Those two facts capture the whole motion.

Lesson 2 solved $a\ddot{y} + b\dot{y} + cy = 0$ by finding the roots of a quadratic. Three coefficients went in, and the shape of the motion came out of a discriminant. That is correct, but clumsy. Multiplying all three coefficients by the same number changes nothing, so one of the three is wasted. And the two numbers that matter — how fast the system moves and how quickly the motion dies — are buried inside them. Control engineers fixed this about a century ago by rewriting every second-order system in a **[[canonical form|canonical]]** with exactly two numbers: the **natural frequency** $\omega_n$ and the **damping ratio** $\zeta$. Once you can read those two off a pole pair, you can predict overshoot and settling time in your head, before any simulation runs.

This vocabulary is not optional in GNC. A thrust-vector actuator is sold with a natural frequency and damping ratio on its data sheet. A pitch-rate loop is tuned to a target damping ratio. A flexible booster's first bending mode is quoted as a frequency and a damping ratio — and the fact that the damping ratio is tiny is exactly why the mode is dangerous. When a colleague says "the closed-loop poles are at $-2 \pm 5j$", she expects you to answer with $\zeta$, $\omega_n$ and the overshoot without reaching for a calculator. By the end of this lesson you will be able to.

## The canonical second-order system

Start from a mass on a spring with a damper, $m\ddot{x} + c\dot{x} + kx = F(t)$. Divide everything by $m$, so the first coefficient is one. Then give the two remaining coefficients new names:

$$
\ddot{x} + \frac{c}{m}\dot{x} + \frac{k}{m}x = \frac{F}{m}, \qquad \omega_n^2 \equiv \frac{k}{m}, \qquad 2\zeta\omega_n \equiv \frac{c}{m}.
$$

(The sign $\equiv$ means "is defined to be".) Write the push on the right as $\omega_n^2 u$, where the input $u$ has the same units as the output. The equation becomes the **canonical second-order system**:

$$
\ddot{y} + 2\zeta\omega_n\dot{y} + \omega_n^2 y = \omega_n^2 u(t).
$$

Read $\omega_n$ as "omega sub n" and $\zeta$ as "zeta".

Why put $\omega_n^2$ on the right? So that a constant input $u = U$ gives the resting value $y = U$. When nothing is changing, both derivatives are zero, and the equation says $\omega_n^2 y = \omega_n^2 U$. The system has **unit steady-state gain**: ask for 2 degrees, and once everything settles you get 2 degrees. Every stable second-order system with no extra terms in its input can be written this way, and most of the ones you meet can be approximated by it.

### The two numbers

The **[[natural frequency|natural-frequency]]** $\omega_n = \sqrt{k/m}$, in $\mathrm{rad/s}$, is the rate at which the system would swing if it had no damping at all. It sets the time scale of everything. Double $\omega_n$ and the whole response plays twice as fast, like a video at double speed.

The **damping ratio** is

$$
\zeta = \frac{c}{2\sqrt{km}} = \frac{c}{c_{\mathrm{crit}}}.
$$

It is the actual damping divided by the **[[critical damping|critical-damping]]** $c_{\mathrm{crit}} = 2\sqrt{km}$ — the boundary between ringing and not ringing that lesson 2 found. It has no units. Because it is a ratio, $\zeta$ describes the *shape* of the response, no matter how fast it plays. That is why specifications quote it.

::: key
Canonical second-order system: $\ddot{y} + 2\zeta\omega_n\dot{y} + \omega_n^2 y = \omega_n^2 u$. Natural frequency $\omega_n = \sqrt{k/m}$ in $\mathrm{rad/s}$; damping ratio $\zeta = c/(2\sqrt{km})$, dimensionless, equal to the damping divided by the critical damping. Its transfer function, which lesson 7 defines, is $G(s) = \omega_n^2/(s^2 + 2\zeta\omega_n s + \omega_n^2)$.
:::

## From $\zeta$ and $\omega_n$ to the poles, and back

The characteristic equation of the canonical form comes straight from lesson 2's quadratic formula, with $a = 1$, $b = 2\zeta\omega_n$ and $c = \omega_n^2$:

$$
s^2 + 2\zeta\omega_n s + \omega_n^2 = 0 \quad\Longrightarrow\quad s = -\zeta\omega_n \pm \omega_n\sqrt{\zeta^2 - 1}.
$$

When $\zeta < 1$, the number under the square root is negative, and the roots — the **poles** — are a complex pair:

$$
s = -\zeta\omega_n \pm j\,\omega_n\sqrt{1 - \zeta^2} \equiv -\sigma \pm j\omega_d.
$$

Two new names appear here, and you will use them constantly.

- The **decay rate** $\sigma = \zeta\omega_n$ ("sigma"), in $\mathrm{s^{-1}}$, is the size of the real part. The free motion dies inside the envelope $e^{-\sigma t}$, so $1/\sigma$ is the time constant of the ringing.
- The **damped natural frequency** $\omega_d = \omega_n\sqrt{1 - \zeta^2}$ ("omega sub d") is the imaginary part. It is the rate you actually *see* the system swing at. The ringing period is $2\pi/\omega_d$.

Damping slows the swing, but not by much until $\zeta$ is large. At $\zeta = 0.3$, $\omega_d = 0.954\,\omega_n$.

### Going backwards

Often you work the other way. A simulation or a design tool hands you poles, and you want $\zeta$ and $\omega_n$. Given poles at $s = -\sigma \pm j\omega_d$:

$$
\omega_n = \sqrt{\sigma^2 + \omega_d^2}, \qquad \zeta = \frac{\sigma}{\omega_n}.
$$

The first comes from adding the squares: $\sigma^2 + \omega_d^2 = \zeta^2\omega_n^2 + \omega_n^2(1 - \zeta^2) = \omega_n^2$. The second is the definition of $\sigma$ rearranged.

There is a lovely picture behind this. Plot the pole in the complex plane, and draw a line from the origin to it.

- The line's length is $\omega_n$ — it is the hypotenuse of a right triangle with sides $\sigma$ and $\omega_d$. So poles with the same natural frequency lie on a **circle** around the origin.
- Call $\theta$ ("theta") the angle the line makes with the negative real axis. Then $\cos\theta = \sigma/\omega_n = \zeta$. So poles with the same damping ratio lie on a **[[ray from the origin|pole-geometry]]**.

A pole on the negative real axis has $\zeta = 1$. A pole on the imaginary axis has $\zeta = 0$. The ray at $45^\circ$ is $\zeta = \cos 45^\circ = 0.707$. With this picture in your head, you can read $\zeta$ off a pole plot by eye.

::: key
Poles of the canonical system: $s = -\zeta\omega_n \pm j\omega_n\sqrt{1 - \zeta^2}$. The real part $-\sigma = -\zeta\omega_n$ sets the decay rate; the imaginary part is the damped frequency $\omega_d = \omega_n\sqrt{1 - \zeta^2}$, so the ringing period is $2\pi/\omega_d$. Given poles at $-\sigma \pm j\omega_d$: $\omega_n = \sqrt{\sigma^2 + \omega_d^2}$ and $\zeta = \sigma/\omega_n = \cos\theta$, with $\theta$ the angle from the negative real axis.
:::

::: example Reading a pitch-rate loop off its poles
A closed **[[pitch-rate loop|pitch-rate]]** on a small aircraft has its main poles at $s = -1.5 \pm 2j\ \mathrm{s^{-1}}$. So $\sigma = 1.5$ and $\omega_d = 2$.

**Natural frequency and damping ratio:**

$$
\omega_n = \sqrt{1.5^2 + 2^2} = \sqrt{6.25} = 2.5\,\mathrm{rad/s}, \qquad \zeta = \frac{1.5}{2.5} = 0.6, \qquad \omega_d = 2\,\mathrm{rad/s}.
$$

**Angle.** The pole makes an angle $\theta = \arccos 0.6 = 53.1^\circ$ with the negative real axis. ($\arccos$ is the inverse cosine: the angle whose cosine is 0.6.)

**Reading it.** The loop rings at $2\,\mathrm{rad/s}$, a period of $2\pi/2 = 3.14\,\mathrm{s}$, inside an envelope with time constant $1/1.5 = 0.667\,\mathrm{s}$. Later in this lesson you will see that these poles mean about 9.5% overshoot and a 2% settling time of about $2.7\,\mathrm{s}$.

**Sanity check.** $\zeta = 0.6$ is between 0 and 1, so the response should swing a little and settle — and the poles are complex, which agrees. If the designer wanted less overshoot at the same speed, she would rotate the poles toward the real axis along the same $\omega_n = 2.5$ circle.
:::

## The four damping regimes

The value of $\zeta$ alone sorts the free motion into lesson 2's three cases, plus the boundary case of no damping at all. Think of four car suspensions.

- $\zeta = 0$: **undamped**. The poles sit at $\pm j\omega_n$, on the imaginary axis. The motion $\cos\omega_n t$ never dies — a car with no shock absorbers at all, bouncing forever. A frictionless spring behaves this way.
- $0 < \zeta < 1$: **underdamped**. A complex pair in the left half of the plane. The motion swings at $\omega_d$ inside a shrinking envelope — worn shocks. Almost every well-tuned control loop lives here, usually between $\zeta = 0.4$ and $0.8$.
- $\zeta = 1$: **critically damped**. A repeated real pole at $-\omega_n$. The motion $(C_1 + C_2t)e^{-\omega_n t}$ returns to rest as fast as possible without overshooting — perfect shocks.
- $\zeta > 1$: **overdamped**. Two different real poles, $s_{1,2} = -\zeta\omega_n \pm \omega_n\sqrt{\zeta^2 - 1}$, both negative. The motion is a sum of two decays with no swing at all — shocks so stiff the car creeps back. It is *slower* than critical, because the pole nearer the origin, $s_1 = -\omega_n(\zeta - \sqrt{\zeta^2 - 1})$, drifts toward zero as $\zeta$ grows.

::: key
Classify by damping ratio: $\zeta = 0$ undamped · $0 < \zeta < 1$ underdamped (oscillatory) · $\zeta = 1$ critically damped (fastest return without overshoot) · $\zeta > 1$ overdamped.
:::

::: warning More damping is not always safer
"More damping is safer" is false past $\zeta = 1$. An overdamped actuator with $\zeta = 2$ has its slow pole at $-\omega_n(2 - \sqrt{3}) = -0.268\,\omega_n$, almost four times closer to the origin than the critically damped pole at $-\omega_n$. It takes about $14.9/\omega_n$ to settle within 2%, against $5.8/\omega_n$ for critical damping — about two and a half times longer. Excess damping trades overshoot for sluggishness, and a sluggish actuator adds delay to the control loop wrapped around it.
:::

## The step response

The numbers a designer quotes — overshoot, settling time — come from one standard test, the **step response**. The command jumps from 0 to 1 at $t = 0$ and stays there ($u(t) = 1$ for $t \ge 0$), and the system starts from rest: $y(0) = \dot{y}(0) = 0$.

Because the equation is linear, the solution is a particular solution plus the free motion, as in lesson 1. For a constant push, the particular solution is the constant $y_p = 1$. Check: put it in and both derivatives vanish, leaving $\omega_n^2 \cdot 1 = \omega_n^2$. So

$$
y(t) = 1 + y_h(t),
$$

and the free motion $y_h$ must carry the starting facts $y_h(0) = -1$ and $\dot{y}_h(0) = 0$. Each regime gives a different $y_h$. The **[[family of step responses|step-family]]** shows them side by side.

### Underdamped, $0 < \zeta < 1$

From lesson 2, $y_h = e^{-\sigma t}(C_1\cos\omega_d t + C_2\sin\omega_d t)$.

- At $t = 0$: $y_h(0) = C_1 = -1$.
- The slope at $t = 0$ is $\dot{y}_h(0) = -\sigma C_1 + \omega_d C_2 = 0$, so $C_2 = \sigma C_1/\omega_d = -\sigma/\omega_d$.

Using $\sigma/\omega_d = \zeta\omega_n/(\omega_n\sqrt{1 - \zeta^2})$, this gives

$$
y(t) = 1 - e^{-\zeta\omega_n t}\left(\cos\omega_d t + \frac{\zeta}{\sqrt{1 - \zeta^2}}\sin\omega_d t\right).
$$

The bracket combines into one sine wave of amplitude $\sqrt{1 + \zeta^2/(1 - \zeta^2)} = 1/\sqrt{1 - \zeta^2}$, so a compact form is

$$
y(t) = 1 - \frac{e^{-\zeta\omega_n t}}{\sqrt{1 - \zeta^2}}\,\sin\!\bigl(\omega_d t + \theta\bigr), \qquad \cos\theta = \zeta.
$$

(This $\theta$ is the same angle as in the pole picture.) The response rises, overshoots 1, swings around it at $\omega_d$, and the swinging dies inside the envelope $e^{-\zeta\omega_n t}/\sqrt{1 - \zeta^2}$.

### Critically damped, $\zeta = 1$

Here $y_h = (C_1 + C_2t)e^{-\omega_n t}$. The start gives $C_1 = -1$. The slope condition $\dot{y}_h(0) = C_2 - \omega_n C_1 = 0$ gives $C_2 = -\omega_n$. So

$$
y(t) = 1 - (1 + \omega_n t)\,e^{-\omega_n t}.
$$

It climbs toward 1 from below and never crosses it, because $(1 + \omega_n t)e^{-\omega_n t}$ is positive for every $t$.

### Overdamped, $\zeta > 1$

With the real poles $s_1 = -\zeta\omega_n + \omega_n\sqrt{\zeta^2 - 1}$ and $s_2 = -\zeta\omega_n - \omega_n\sqrt{\zeta^2 - 1}$, write $y_h = C_1e^{s_1t} + C_2e^{s_2t}$. The two conditions are $C_1 + C_2 = -1$ and $s_1C_1 + s_2C_2 = 0$. Solving them gives $C_1 = s_2/(s_1 - s_2)$ and $C_2 = -s_1/(s_1 - s_2)$, so

$$
y(t) = 1 + \frac{s_2\,e^{s_1t} - s_1\,e^{s_2t}}{s_1 - s_2}.
$$

Check $t = 0$: $1 + (s_2 - s_1)/(s_1 - s_2) = 1 - 1 = 0$. As time goes on, the $e^{s_2t}$ term, with the more negative exponent, vanishes first, and the tail is ruled by the slow pole $s_1$.

::: warning Both coefficients come from the starting facts
In the overdamped case, do not write $y = 1 - e^{s_1t} - e^{s_2t}$, or any other guess that merely "looks like" two exponentials. Both coefficients are fixed by the two initial conditions, and they are not equal. If your step response does not start at exactly zero with zero slope, the coefficients are wrong.
:::

## Percent overshoot

How far past 1 does the underdamped response go? To find the highest point, find where the slope is zero. Differentiate the step response with the product rule; the $\cos\omega_d t$ terms cancel, leaving

$$
\dot{y}(t) = e^{-\sigma t}\left(\frac{\sigma^2}{\omega_d} + \omega_d\right)\sin\omega_d t = \frac{\omega_n^2}{\omega_d}\,e^{-\sigma t}\sin\omega_d t,
$$

using $\sigma^2 + \omega_d^2 = \omega_n^2$. The slope is zero whenever $\sin\omega_d t = 0$, which happens at $t = k\pi/\omega_d$ for whole numbers $k$. The first of these after the start is the **peak time**

$$
t_p = \frac{\pi}{\omega_d} = \frac{\pi}{\omega_n\sqrt{1 - \zeta^2}},
$$

half a ringing period. At that instant $\cos\omega_d t_p = -1$ and $\sin\omega_d t_p = 0$, so $y(t_p) = 1 + e^{-\sigma\pi/\omega_d}$. The **percent overshoot** — how far the peak goes past the final value, as a percentage of the step — is therefore

$$
\mathrm{PO} = 100\,\exp\!\left(-\frac{\pi\zeta}{\sqrt{1 - \zeta^2}}\right).
$$

Look at what is missing: $\omega_n$. **Overshoot depends on $\zeta$ alone.** A slow satellite pointing loop and a fast actuator with the same damping ratio of 0.5 both overshoot by the same 16%. The table is worth knowing by heart:

| $\zeta$ | 0.1 | 0.2 | 0.3 | 0.4 | 0.5 | 0.6 | 0.707 | 0.8 | 0.9 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PO (%) | 72.9 | 52.7 | 37.2 | 25.4 | 16.3 | 9.5 | 4.3 | 1.5 | 0.2 |

As $\zeta$ goes up, the overshoot always goes down, so the formula can be run backwards. A requirement of "no more than 10% overshoot" is the same as $\zeta \ge 0.59$ — which, in the pole picture, is a ray.

::: key
Percent overshoot of the second-order step response: $\mathrm{PO} = 100\exp\bigl(-\pi\zeta/\sqrt{1 - \zeta^2}\bigr)$, a function of $\zeta$ only. $\zeta = 0.707$ gives about 4.3%, $\zeta = 0.5$ about 16%, $\zeta = 0.1$ about 73%. The peak occurs at $t_p = \pi/\omega_d$.
:::

## Settling time

The **settling time** $t_s$ is how long until the response enters a narrow band around its final value and stays there. The band is usually $\pm 2\%$ of the step, sometimes $\pm 5\%$.

For the underdamped response, the swinging is bounded by the envelope $e^{-\zeta\omega_n t}/\sqrt{1 - \zeta^2}$. Set the envelope equal to 0.02, and ignore the $1/\sqrt{1 - \zeta^2}$ factor, which is close to one for moderate damping. That gives $e^{-\zeta\omega_n t_s} = 0.02$, so $t_s = \ln 50/(\zeta\omega_n) = 3.91/(\zeta\omega_n)$. Round it, and the working rule is

$$
t_s \approx \frac{4}{\zeta\omega_n} = \frac{4}{\sigma} \quad (2\%), \qquad t_s \approx \frac{3}{\zeta\omega_n} \quad (5\%),
$$

where the 5% rule uses $\ln 20 \approx 3.0$.

Settling time depends on the real part of the poles *alone*. It is four time constants of the envelope — exactly lesson 1's "settled after $4\tau$" rule, applied to the decay rate $\sigma$. Move the poles left and the response settles faster. Slide them straight up or down, keeping the real part fixed, and the settling time does not change; only the overshoot does. The **[[anatomy of a step response|step-anatomy]]** puts the peak, the envelope and the band on one picture.

Because the rule uses the envelope rather than the curve itself, it is a little cautious. The real response usually drops inside the band slightly earlier, at the moment a swing happens to end. For the pitch-rate poles above, $4/1.5 = 2.67\,\mathrm{s}$, while the exact response is inside 2% after $2.38\,\mathrm{s}$. Either number is fine for design; say "about $2.7\,\mathrm{s}$".

::: key
2% settling time: $t_s \approx 4/(\zeta\omega_n)$, set by the real part $\sigma = \zeta\omega_n$ of the pole pair alone. The 5% criterion uses $3/(\zeta\omega_n)$. Damped natural frequency $\omega_d = \omega_n\sqrt{1 - \zeta^2}$; ringing period $2\pi/\omega_d$.
:::

::: warning The rule is for the underdamped case
The rule $t_s \approx 4/(\zeta\omega_n)$ is for the underdamped regime. For an overdamped system, $\zeta\omega_n$ is the *average* of the two real poles, and the slow one is in charge. Use $t_s \approx 4/|s_1|$, with $s_1$ the pole nearest the origin. With $\zeta = 2$ and $\omega_n = 40\,\mathrm{rad/s}$, $4/(\zeta\omega_n) = 0.05\,\mathrm{s}$, but the true 2% settling time is $0.37\,\mathrm{s}$ — off by a factor of seven. For the critically damped case, the exact 2% time is about $5.8/\omega_n$, because of the $(1 + \omega_n t)$ factor.
:::

::: example A second-order thrust-vector actuator
Lesson 1 modelled a TVC actuator as a first-order lag. A better model includes the actuator's own inertia and is second order. The vendor quotes $\omega_n = 40\,\mathrm{rad/s}$ (about $6.4\,\mathrm{Hz}$) and $\zeta = 0.6$.

**Poles:**

$$
s = -0.6 \times 40 \pm j\,40\sqrt{1 - 0.36} = -24 \pm 32j\ \mathrm{s^{-1}}.
$$

**Peak.** For a $2^\circ$ step command, the deflection is $2\,y(t)$, with $y$ the unit step response. With $\omega_d = 32\,\mathrm{rad/s}$, the nozzle peaks at $t_p = \pi/32 = 0.098\,\mathrm{s}$, reaching $2 \times (1 + e^{-24\pi/32}) = 2 \times 1.095 = 2.19^\circ$. That is an overshoot of $9.5\%$, or $0.19^\circ$.

**Sanity check.** The table says $\zeta = 0.6$ gives 9.5%. It matches.

**Settling.** The rule gives about $4/24 = 0.17\,\mathrm{s}$; the exact figure is $0.149\,\mathrm{s}$.

Compare the first-order model with $\tau = 0.05\,\mathrm{s}$, which reached 98% at $0.2\,\mathrm{s}$ and never overshot. The second-order model is a little faster and rings once. The autopilot designer needs to know about that ring: a nozzle that overshoots its command by $0.19^\circ$ puts an unrequested push on the vehicle.
:::

## Why 0.707 is popular, and when it is the wrong target

The value $\zeta = 1/\sqrt{2} \approx 0.707$ turns up in design after design. It has three things going for it. Its step response overshoots only about 4%. As lesson 5 will show, it gives the flattest possible frequency response, with no resonant peak at all — the **[[Butterworth|butterworth]]** value. And when the canonical system is a feedback loop built around an integrator and a lag, $\zeta = 0.707$ leaves about $65^\circ$ of **[[phase margin|phase-margin]]**: a comfortable safety cushion before the loop would start to oscillate on its own.

But a target is only as good as the problem it fits. For a launch vehicle climbing through the atmosphere, step overshoot is rarely what limits the design. The rigid rocket is aerodynamically unstable on its own — air pushes its nose further off course. The flexible **[[bending modes|bending-mode]]** set an upper limit on how fast the control loop may be. And the real constraint is structural: the sideways air load, which grows with **[[dynamic pressure times angle of attack|q-alpha]]**, must stay below what the airframe can carry. Engineers design ascent autopilots for stability margins and load relief, and the damping ratio comes out as a by-product, not a specification.

::: example A flexible booster mode
The first sideways bending mode of a large launch vehicle is quoted as $f = 2.5\,\mathrm{Hz}$, with a structural damping ratio $\zeta = 0.005$.

**Convert to canonical terms.** A frequency in hertz (cycles per second) must be multiplied by $2\pi$: $\omega_n = 2\pi \times 2.5 = 15.7\,\mathrm{rad/s}$. The damped frequency is $\omega_d = 15.7\sqrt{1 - 0.005^2} \approx 15.7\,\mathrm{rad/s}$ — you cannot tell it from $\omega_n$.

**Decay.** The decay rate is $\sigma = \zeta\omega_n = 0.0785\,\mathrm{s^{-1}}$, so the envelope's time constant is $1/\sigma = 12.7\,\mathrm{s}$. That is about 32 full swings. After a kick, the mode is still ringing at 2% of its starting size some $4/\sigma = 51\,\mathrm{s}$ later.

**Where the poles sit.** At $-0.0785 \pm 15.7j$ — almost exactly on the imaginary axis.

That is what a small damping ratio means. The mode stores energy and releases it very slowly, so a control loop that feeds in even a little energy at $2.5\,\mathrm{Hz}$ can build it up until the structure fails. Lesson 5 measures exactly how much it amplifies.
:::

::: note Reading a characteristic equation at a glance
$\omega_n$ is in $\mathrm{rad/s}$; a frequency quoted in hertz must be multiplied by $2\pi$ before it goes into the canonical form. $\sigma$ is in $\mathrm{s^{-1}}$, and $1/\sigma$ is a time. $\zeta$ has no units. When you see $s^2 + 6s + 25 = 0$, read it as $2\zeta\omega_n = 6$ and $\omega_n^2 = 25$. So $\omega_n = 5\,\mathrm{rad/s}$, $\zeta = 6/10 = 0.6$, and the poles are $-3 \pm 4j$. With practice this becomes instant.
:::

## Check yourself

::: check
A system obeys $\ddot{y} + 12\dot{y} + 400y = 400u$. Give $\omega_n$, $\zeta$, the poles, $\omega_d$, and the ringing period.
:::

::: answer
Match it to the canonical form. $\omega_n^2 = 400$, so $\omega_n = 20\,\mathrm{rad/s}$. $2\zeta\omega_n = 12$, so $\zeta = 12/40 = 0.3$: underdamped.

Then $\sigma = \zeta\omega_n = 6\,\mathrm{s^{-1}}$ and $\omega_d = 20\sqrt{1 - 0.09} = 19.1\,\mathrm{rad/s}$, so the poles are $-6 \pm 19.1j$. The ringing period is $2\pi/19.1 = 0.329\,\mathrm{s}$.

Notice how little damping has changed the frequency: $\omega_d$ is 95% of $\omega_n$.
:::

::: check
For the same system, predict the percent overshoot and the 2% settling time of the step response.
:::

::: answer
$$
\mathrm{PO} = 100\exp\bigl(-0.3\pi/\sqrt{0.91}\bigr) = 100\exp(-0.988) = 37.2\%.
$$

The 2% settling time is $t_s \approx 4/\sigma = 4/6 = 0.667\,\mathrm{s}$, about two ringing periods. The peak comes at $t_p = \pi/19.1 = 0.165\,\mathrm{s}$. The 37.2% agrees with the table's entry for $\zeta = 0.3$.
:::

::: check
A mass of $2\,\mathrm{kg}$ hangs on a spring of stiffness $800\,\mathrm{N/m}$ with a damper of $24\,\mathrm{N\,s/m}$. What are $\omega_n$ and $\zeta$, and what damper would make it critically damped?
:::

::: answer
$\omega_n = \sqrt{k/m} = \sqrt{800/2} = 20\,\mathrm{rad/s}$, and

$$
\zeta = \frac{c}{2\sqrt{km}} = \frac{24}{2\sqrt{1600}} = \frac{24}{80} = 0.3.
$$

It is the same system as the previous two questions, in physical clothing. Critical damping needs $c_{\mathrm{crit}} = 2\sqrt{km} = 80\,\mathrm{N\,s/m}$, so the damper must be made stronger by a factor of $1/\zeta = 3.33$.
:::

::: check
A designer moves a pair of poles from $-3 \pm 4j$ to $-3 \pm 8j$. What happens to $\omega_n$, $\zeta$, the overshoot and the settling time?
:::

::: answer
Before: $\omega_n = \sqrt{9 + 16} = 5$, $\zeta = 3/5 = 0.6$, PO $= 9.5\%$, and $t_s \approx 4/3 = 1.33\,\mathrm{s}$.

After: $\omega_n = \sqrt{9 + 64} = 8.54\,\mathrm{rad/s}$, $\zeta = 3/8.54 = 0.351$, and PO $= 100\exp(-0.351\pi/\sqrt{1 - 0.123}) = 30.8\%$.

The settling time stays at about $1.33\,\mathrm{s}$, because the real part did not move. The response swings faster and overshoots about three times as much, but dies away in the same time.
:::

::: check
Why does the percent overshoot depend on $\zeta$ alone, while the settling time depends on $\zeta\omega_n$?
:::

::: answer
The natural frequency only rescales time. Write the step response in terms of $\omega_n t$ and $\omega_n$ disappears entirely, so every feature of the curve's *shape* — such as how far above 1 the first peak reaches — depends only on $\zeta$.

Settling time is a *time*, so it must involve $\omega_n$. The envelope is $e^{-\zeta\omega_n t}$, and shrinking to 2% takes $\ln 50 \approx 4$ envelope time constants, which is $4/(\zeta\omega_n)$.

In the pole picture: overshoot is set by the ray (the angle), settling time by the vertical line (the real part).
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

The next lesson rewrites this second-order equation as two first-order equations in a state vector. There the pole pair reappears as the eigenvalues of a matrix, and the matrix exponential replaces this lesson's case-by-case solutions with a single formula.

::: context canonical Why "canonical"
A *canon* was originally a rule or a measuring rod. In mathematics, a **canonical form** is the agreed standard way of writing something, so that any two things of the same kind can be compared at a glance. Every second-order system, whether it is a car, a nozzle actuator or a satellite, becomes the same equation with only two numbers changed. Seeing $\zeta = 0.6$ tells you the shape of the motion, whatever the machine.
:::

::: context natural-frequency Every structure has a favourite rate
Pluck a guitar string, tap a wine glass or give a swing one push, and each moves back and forth at its own rate. That rate, set by stiffness and mass, is its natural frequency: stiffer means faster, heavier means slower — hence $\sqrt{k/m}$. Rockets, satellites and their solar panels all have natural frequencies, and engineers list them carefully, because pushing anything at its natural frequency makes it swing hard.
:::

::: context critical-damping The door closer
A good door closer is critically damped. Too little damping and the door slams and bounces; too much and it takes forever to shut. At exactly critical damping it closes as fast as possible without banging back open. The factor 2 in $c_{\mathrm{crit}} = 2\sqrt{km}$ comes from lesson 2: the discriminant $c^2 - 4km$ is zero when $c = 2\sqrt{km}$.
:::

::: context pole-geometry The pole triangle
The pole $-1.5 + 2j$ from the pitch-rate example, drawn in the complex plane. The line from the origin has length $\omega_n = 2.5$ — the hypotenuse of a 1.5–2–2.5 triangle. The angle $\theta$ from the negative real axis has $\cos\theta = 1.5/2.5 = 0.6 = \zeta$. The pole's mirror image sits below the axis.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
<line x1="20" y1="110" x2="345" y2="110" stroke="#1f2a44" stroke-width="1.5"/>
<line x1="250" y1="8" x2="250" y2="212" stroke="#1f2a44" stroke-width="1.5"/>
<path d="M250,20.0 A90.0,90.0 0 0,0 250,200.0" fill="none" stroke="#8fb8f0" stroke-width="2" stroke-dasharray="5 4"/>
<line x1="250" y1="110" x2="196.0" y2="38" stroke="#1d6fd1" stroke-width="2"/>
<line x1="196.0" y1="38" x2="196.0" y2="110" stroke="#6c7a93" stroke-width="1.2" stroke-dasharray="3 3"/>
<path d="M222.0,110.0 A28,28 0 0,1 233.2,87.6" fill="none" stroke="#b4232c" stroke-width="2"/>
<text x="206" y="102" font-size="11" fill="#b4232c">θ</text>
<g stroke="#1d6fd1" stroke-width="2.5"><line x1="191.0" y1="33" x2="201.0" y2="43"/><line x1="191.0" y1="43" x2="201.0" y2="33"/></g>
<g stroke="#1d6fd1" stroke-width="2.5"><line x1="191.0" y1="177" x2="201.0" y2="187"/><line x1="191.0" y1="187" x2="201.0" y2="177"/></g>
<text x="188.0" y="30" font-size="11" text-anchor="end" fill="#1d6fd1">−1.5 + 2j</text>
<text x="188.0" y="198" font-size="11" text-anchor="end" fill="#1d6fd1">−1.5 − 2j</text>
<text x="223.0" y="126" font-size="11" text-anchor="middle" fill="#1f2a44">σ = 1.5</text>
<text x="190.0" y="86" font-size="11" text-anchor="end" fill="#1f2a44">ωd = 2</text>
<text x="256" y="18" font-size="11" fill="#1f2a44">Im s</text>
<text x="345" y="126" font-size="11" text-anchor="end" fill="#1f2a44">Re s</text>
<text x="156.0" y="126" font-size="11" text-anchor="end" fill="#8fb8f0">radius ωn = 2.5</text>
<text x="260" y="170" font-size="11" fill="#1f2a44">ζ = cos θ = 0.6</text>
</svg>
```

Poles on the dashed circle share the same $\omega_n$; poles on the same ray share the same $\zeta$.
:::

::: context pitch-rate What a pitch-rate loop does
**Pitch** is the nose-up or nose-down angle of an aircraft or rocket. A **pitch-rate loop** is the innermost part of an autopilot: it measures how fast the nose is turning with a gyro, compares that with the rate the pilot or guidance asked for, and moves the control surfaces or the engine nozzle to close the gap. Slower outer loops for attitude and trajectory are built on top of it.
:::

::: context step-family Four damping ratios at once
Step responses of the canonical system for $\zeta = 0.2$, $0.707$, $1$ and $2$, plotted against $\omega_n t$ so the speed drops out. The $0.2$ curve overshoots by about 53% and rings; $0.707$ peaks a little over 1 (by 4.3%); $1$ creeps up without overshooting; $2$ is the slowest of all.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 205" font-family="Inter, Arial, sans-serif">
<line x1="40" y1="180" x2="340" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
<line x1="40" y1="180" x2="40" y2="12" stroke="#1f2a44" stroke-width="1.5"/>
<line x1="40" y1="75.0" x2="340" y2="75.0" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
<path d="M40.0,180.0 L41.0,179.9 L42.0,179.7 L43.0,179.3 L44.0,178.7 L45.0,178.0 L46.0,177.1 L47.0,176.1 L48.0,174.9 L49.0,173.6 L50.0,172.1 L51.0,170.6 L52.0,168.9 L53.0,167.0 L54.0,165.1 L55.0,163.0 L56.0,160.9 L57.0,158.6 L58.0,156.3 L59.0,153.8 L60.0,151.3 L61.0,148.6 L62.0,145.9 L63.0,143.2 L64.0,140.4 L65.0,137.5 L66.0,134.5 L67.0,131.5 L68.0,128.5 L69.0,125.4 L70.0,122.3 L71.0,119.2 L72.0,116.1 L73.0,112.9 L74.0,109.7 L75.0,106.6 L76.0,103.4 L77.0,100.2 L78.0,97.1 L79.0,93.9 L80.0,90.8 L81.0,87.7 L82.0,84.6 L83.0,81.6 L84.0,78.6 L85.0,75.6 L86.0,72.7 L87.0,69.9 L88.0,67.1 L89.0,64.3 L90.0,61.6 L91.0,59.0 L92.0,56.4 L93.0,53.9 L94.0,51.5 L95.0,49.2 L96.0,46.9 L97.0,44.7 L98.0,42.6 L99.0,40.6 L100.0,38.7 L101.0,36.9 L102.0,35.1 L103.0,33.4 L104.0,31.9 L105.0,30.4 L106.0,29.0 L107.0,27.7 L108.0,26.6 L109.0,25.5 L110.0,24.5 L111.0,23.6 L112.0,22.8 L113.0,22.0 L114.0,21.4 L115.0,20.9 L116.0,20.5 L117.0,20.2 L118.0,19.9 L119.0,19.8 L120.0,19.7 L121.0,19.7 L122.0,19.9 L123.0,20.1 L124.0,20.3 L125.0,20.7 L126.0,21.2 L127.0,21.7 L128.0,22.3 L129.0,23.0 L130.0,23.7 L131.0,24.5 L132.0,25.4 L133.0,26.4 L134.0,27.4 L135.0,28.5 L136.0,29.6 L137.0,30.8 L138.0,32.0 L139.0,33.3 L140.0,34.6 L141.0,36.0 L142.0,37.4 L143.0,38.9 L144.0,40.3 L145.0,41.9 L146.0,43.4 L147.0,45.0 L148.0,46.6 L149.0,48.2 L150.0,49.8 L151.0,51.4 L152.0,53.1 L153.0,54.8 L154.0,56.4 L155.0,58.1 L156.0,59.8 L157.0,61.4 L158.0,63.1 L159.0,64.8 L160.0,66.4 L161.0,68.1 L162.0,69.7 L163.0,71.3 L164.0,72.9 L165.0,74.4 L166.0,76.0 L167.0,77.5 L168.0,79.0 L169.0,80.4 L170.0,81.8 L171.0,83.2 L172.0,84.6 L173.0,85.9 L174.0,87.2 L175.0,88.4 L176.0,89.6 L177.0,90.8 L178.0,91.9 L179.0,92.9 L180.0,94.0 L181.0,94.9 L182.0,95.9 L183.0,96.7 L184.0,97.6 L185.0,98.4 L186.0,99.1 L187.0,99.8 L188.0,100.4 L189.0,101.0 L190.0,101.5 L191.0,102.0 L192.0,102.4 L193.0,102.8 L194.0,103.2 L195.0,103.4 L196.0,103.7 L197.0,103.9 L198.0,104.0 L199.0,104.1 L200.0,104.1 L201.0,104.1 L202.0,104.1 L203.0,104.0 L204.0,103.8 L205.0,103.6 L206.0,103.4 L207.0,103.1 L208.0,102.8 L209.0,102.5 L210.0,102.1 L211.0,101.6 L212.0,101.2 L213.0,100.7 L214.0,100.2 L215.0,99.6 L216.0,99.0 L217.0,98.4 L218.0,97.7 L219.0,97.1 L220.0,96.4 L221.0,95.7 L222.0,94.9 L223.0,94.2 L224.0,93.4 L225.0,92.6 L226.0,91.8 L227.0,90.9 L228.0,90.1 L229.0,89.3 L230.0,88.4 L231.0,87.5 L232.0,86.7 L233.0,85.8 L234.0,84.9 L235.0,84.0 L236.0,83.2 L237.0,82.3 L238.0,81.4 L239.0,80.5 L240.0,79.7 L241.0,78.8 L242.0,77.9 L243.0,77.1 L244.0,76.3 L245.0,75.4 L246.0,74.6 L247.0,73.8 L248.0,73.0 L249.0,72.3 L250.0,71.5 L251.0,70.8 L252.0,70.1 L253.0,69.4 L254.0,68.7 L255.0,68.0 L256.0,67.4 L257.0,66.8 L258.0,66.2 L259.0,65.6 L260.0,65.1 L261.0,64.6 L262.0,64.1 L263.0,63.6 L264.0,63.2 L265.0,62.8 L266.0,62.4 L267.0,62.0 L268.0,61.7 L269.0,61.4 L270.0,61.1 L271.0,60.8 L272.0,60.6 L273.0,60.4 L274.0,60.2 L275.0,60.0 L276.0,59.9 L277.0,59.8 L278.0,59.7 L279.0,59.7 L280.0,59.7 L281.0,59.7 L282.0,59.7 L283.0,59.7 L284.0,59.8 L285.0,59.9 L286.0,60.0 L287.0,60.2 L288.0,60.3 L289.0,60.5 L290.0,60.7 L291.0,60.9 L292.0,61.2 L293.0,61.4 L294.0,61.7 L295.0,62.0 L296.0,62.3 L297.0,62.6 L298.0,63.0 L299.0,63.3 L300.0,63.7 L301.0,64.1 L302.0,64.4 L303.0,64.8 L304.0,65.3 L305.0,65.7 L306.0,66.1 L307.0,66.5 L308.0,67.0 L309.0,67.4 L310.0,67.9 L311.0,68.3 L312.0,68.8 L313.0,69.2 L314.0,69.7 L315.0,70.2 L316.0,70.6 L317.0,71.1 L318.0,71.6 L319.0,72.0 L320.0,72.5 L321.0,72.9 L322.0,73.4 L323.0,73.8 L324.0,74.3 L325.0,74.7 L326.0,75.1 L327.0,75.6 L328.0,76.0 L329.0,76.4 L330.0,76.8 L331.0,77.2 L332.0,77.5 L333.0,77.9 L334.0,78.3 L335.0,78.6 L336.0,78.9 L337.0,79.3 L338.0,79.6 L339.0,79.9 L340.0,80.2" fill="none" stroke="#b4232c" stroke-width="2.2"/>
<path d="M40.0,180.0 L41.0,179.9 L42.0,179.7 L43.0,179.3 L44.0,178.8 L45.0,178.1 L46.0,177.3 L47.0,176.4 L48.0,175.4 L49.0,174.3 L50.0,173.1 L51.0,171.8 L52.0,170.4 L53.0,169.0 L54.0,167.5 L55.0,165.9 L56.0,164.3 L57.0,162.6 L58.0,160.9 L59.0,159.1 L60.0,157.3 L61.0,155.5 L62.0,153.6 L63.0,151.8 L64.0,149.9 L65.0,148.0 L66.0,146.1 L67.0,144.2 L68.0,142.3 L69.0,140.3 L70.0,138.4 L71.0,136.5 L72.0,134.6 L73.0,132.7 L74.0,130.9 L75.0,129.0 L76.0,127.2 L77.0,125.4 L78.0,123.6 L79.0,121.8 L80.0,120.1 L81.0,118.3 L82.0,116.6 L83.0,115.0 L84.0,113.3 L85.0,111.7 L86.0,110.2 L87.0,108.6 L88.0,107.1 L89.0,105.6 L90.0,104.2 L91.0,102.8 L92.0,101.4 L93.0,100.1 L94.0,98.8 L95.0,97.5 L96.0,96.3 L97.0,95.1 L98.0,93.9 L99.0,92.8 L100.0,91.7 L101.0,90.6 L102.0,89.6 L103.0,88.6 L104.0,87.6 L105.0,86.7 L106.0,85.8 L107.0,84.9 L108.0,84.1 L109.0,83.3 L110.0,82.5 L111.0,81.8 L112.0,81.1 L113.0,80.4 L114.0,79.8 L115.0,79.1 L116.0,78.5 L117.0,78.0 L118.0,77.4 L119.0,76.9 L120.0,76.4 L121.0,76.0 L122.0,75.5 L123.0,75.1 L124.0,74.7 L125.0,74.3 L126.0,74.0 L127.0,73.7 L128.0,73.4 L129.0,73.1 L130.0,72.8 L131.0,72.5 L132.0,72.3 L133.0,72.1 L134.0,71.9 L135.0,71.7 L136.0,71.5 L137.0,71.4 L138.0,71.2 L139.0,71.1 L140.0,71.0 L141.0,70.9 L142.0,70.8 L143.0,70.7 L144.0,70.7 L145.0,70.6 L146.0,70.6 L147.0,70.5 L148.0,70.5 L149.0,70.5 L150.0,70.5 L151.0,70.5 L152.0,70.5 L153.0,70.5 L154.0,70.5 L155.0,70.5 L156.0,70.5 L157.0,70.6 L158.0,70.6 L159.0,70.7 L160.0,70.7 L161.0,70.8 L162.0,70.8 L163.0,70.9 L164.0,70.9 L165.0,71.0 L166.0,71.1 L167.0,71.1 L168.0,71.2 L169.0,71.3 L170.0,71.4 L171.0,71.4 L172.0,71.5 L173.0,71.6 L174.0,71.7 L175.0,71.8 L176.0,71.8 L177.0,71.9 L178.0,72.0 L179.0,72.1 L180.0,72.2 L181.0,72.3 L182.0,72.3 L183.0,72.4 L184.0,72.5 L185.0,72.6 L186.0,72.7 L187.0,72.7 L188.0,72.8 L189.0,72.9 L190.0,73.0 L191.0,73.0 L192.0,73.1 L193.0,73.2 L194.0,73.3 L195.0,73.3 L196.0,73.4 L197.0,73.5 L198.0,73.5 L199.0,73.6 L200.0,73.7 L201.0,73.7 L202.0,73.8 L203.0,73.9 L204.0,73.9 L205.0,74.0 L206.0,74.0 L207.0,74.1 L208.0,74.1 L209.0,74.2 L210.0,74.2 L211.0,74.3 L212.0,74.3 L213.0,74.4 L214.0,74.4 L215.0,74.5 L216.0,74.5 L217.0,74.5 L218.0,74.6 L219.0,74.6 L220.0,74.6 L221.0,74.7 L222.0,74.7 L223.0,74.7 L224.0,74.8 L225.0,74.8 L226.0,74.8 L227.0,74.8 L228.0,74.9 L229.0,74.9 L230.0,74.9 L231.0,74.9 L232.0,75.0 L233.0,75.0 L234.0,75.0 L235.0,75.0 L236.0,75.0 L237.0,75.0 L238.0,75.1 L239.0,75.1 L240.0,75.1 L241.0,75.1 L242.0,75.1 L243.0,75.1 L244.0,75.1 L245.0,75.1 L246.0,75.1 L247.0,75.1 L248.0,75.2 L249.0,75.2 L250.0,75.2 L251.0,75.2 L252.0,75.2 L253.0,75.2 L254.0,75.2 L255.0,75.2 L256.0,75.2 L257.0,75.2 L258.0,75.2 L259.0,75.2 L260.0,75.2 L261.0,75.2 L262.0,75.2 L263.0,75.2 L264.0,75.2 L265.0,75.2 L266.0,75.2 L267.0,75.2 L268.0,75.2 L269.0,75.2 L270.0,75.2 L271.0,75.2 L272.0,75.2 L273.0,75.2 L274.0,75.2 L275.0,75.2 L276.0,75.2 L277.0,75.2 L278.0,75.2 L279.0,75.2 L280.0,75.2 L281.0,75.2 L282.0,75.2 L283.0,75.2 L284.0,75.1 L285.0,75.1 L286.0,75.1 L287.0,75.1 L288.0,75.1 L289.0,75.1 L290.0,75.1 L291.0,75.1 L292.0,75.1 L293.0,75.1 L294.0,75.1 L295.0,75.1 L296.0,75.1 L297.0,75.1 L298.0,75.1 L299.0,75.1 L300.0,75.1 L301.0,75.1 L302.0,75.1 L303.0,75.1 L304.0,75.1 L305.0,75.1 L306.0,75.1 L307.0,75.1 L308.0,75.1 L309.0,75.1 L310.0,75.1 L311.0,75.1 L312.0,75.1 L313.0,75.1 L314.0,75.0 L315.0,75.0 L316.0,75.0 L317.0,75.0 L318.0,75.0 L319.0,75.0 L320.0,75.0 L321.0,75.0 L322.0,75.0 L323.0,75.0 L324.0,75.0 L325.0,75.0 L326.0,75.0 L327.0,75.0 L328.0,75.0 L329.0,75.0 L330.0,75.0 L331.0,75.0 L332.0,75.0 L333.0,75.0 L334.0,75.0 L335.0,75.0 L336.0,75.0 L337.0,75.0 L338.0,75.0 L339.0,75.0 L340.0,75.0" fill="none" stroke="#1d6fd1" stroke-width="2.2"/>
<path d="M40.0,180.0 L41.0,179.9 L42.0,179.7 L43.0,179.3 L44.0,178.8 L45.0,178.2 L46.0,177.4 L47.0,176.6 L48.0,175.6 L49.0,174.6 L50.0,173.5 L51.0,172.4 L52.0,171.2 L53.0,169.9 L54.0,168.6 L55.0,167.2 L56.0,165.8 L57.0,164.4 L58.0,162.9 L59.0,161.4 L60.0,159.9 L61.0,158.4 L62.0,156.9 L63.0,155.3 L64.0,153.8 L65.0,152.3 L66.0,150.7 L67.0,149.2 L68.0,147.6 L69.0,146.1 L70.0,144.6 L71.0,143.1 L72.0,141.6 L73.0,140.1 L74.0,138.6 L75.0,137.1 L76.0,135.7 L77.0,134.3 L78.0,132.9 L79.0,131.5 L80.0,130.1 L81.0,128.8 L82.0,127.4 L83.0,126.1 L84.0,124.9 L85.0,123.6 L86.0,122.4 L87.0,121.1 L88.0,119.9 L89.0,118.8 L90.0,117.6 L91.0,116.5 L92.0,115.4 L93.0,114.3 L94.0,113.3 L95.0,112.2 L96.0,111.2 L97.0,110.2 L98.0,109.3 L99.0,108.3 L100.0,107.4 L101.0,106.5 L102.0,105.6 L103.0,104.7 L104.0,103.9 L105.0,103.1 L106.0,102.3 L107.0,101.5 L108.0,100.7 L109.0,100.0 L110.0,99.3 L111.0,98.6 L112.0,97.9 L113.0,97.2 L114.0,96.5 L115.0,95.9 L116.0,95.3 L117.0,94.7 L118.0,94.1 L119.0,93.5 L120.0,93.0 L121.0,92.4 L122.0,91.9 L123.0,91.4 L124.0,90.9 L125.0,90.4 L126.0,89.9 L127.0,89.5 L128.0,89.0 L129.0,88.6 L130.0,88.2 L131.0,87.8 L132.0,87.4 L133.0,87.0 L134.0,86.6 L135.0,86.3 L136.0,85.9 L137.0,85.6 L138.0,85.2 L139.0,84.9 L140.0,84.6 L141.0,84.3 L142.0,84.0 L143.0,83.7 L144.0,83.5 L145.0,83.2 L146.0,82.9 L147.0,82.7 L148.0,82.4 L149.0,82.2 L150.0,82.0 L151.0,81.7 L152.0,81.5 L153.0,81.3 L154.0,81.1 L155.0,80.9 L156.0,80.7 L157.0,80.5 L158.0,80.4 L159.0,80.2 L160.0,80.0 L161.0,79.8 L162.0,79.7 L163.0,79.5 L164.0,79.4 L165.0,79.2 L166.0,79.1 L167.0,79.0 L168.0,78.8 L169.0,78.7 L170.0,78.6 L171.0,78.5 L172.0,78.4 L173.0,78.2 L174.0,78.1 L175.0,78.0 L176.0,77.9 L177.0,77.8 L178.0,77.7 L179.0,77.7 L180.0,77.6 L181.0,77.5 L182.0,77.4 L183.0,77.3 L184.0,77.2 L185.0,77.2 L186.0,77.1 L187.0,77.0 L188.0,77.0 L189.0,76.9 L190.0,76.8 L191.0,76.8 L192.0,76.7 L193.0,76.6 L194.0,76.6 L195.0,76.5 L196.0,76.5 L197.0,76.4 L198.0,76.4 L199.0,76.3 L200.0,76.3 L201.0,76.2 L202.0,76.2 L203.0,76.2 L204.0,76.1 L205.0,76.1 L206.0,76.0 L207.0,76.0 L208.0,76.0 L209.0,75.9 L210.0,75.9 L211.0,75.9 L212.0,75.9 L213.0,75.8 L214.0,75.8 L215.0,75.8 L216.0,75.7 L217.0,75.7 L218.0,75.7 L219.0,75.7 L220.0,75.6 L221.0,75.6 L222.0,75.6 L223.0,75.6 L224.0,75.6 L225.0,75.5 L226.0,75.5 L227.0,75.5 L228.0,75.5 L229.0,75.5 L230.0,75.5 L231.0,75.4 L232.0,75.4 L233.0,75.4 L234.0,75.4 L235.0,75.4 L236.0,75.4 L237.0,75.4 L238.0,75.3 L239.0,75.3 L240.0,75.3 L241.0,75.3 L242.0,75.3 L243.0,75.3 L244.0,75.3 L245.0,75.3 L246.0,75.3 L247.0,75.2 L248.0,75.2 L249.0,75.2 L250.0,75.2 L251.0,75.2 L252.0,75.2 L253.0,75.2 L254.0,75.2 L255.0,75.2 L256.0,75.2 L257.0,75.2 L258.0,75.2 L259.0,75.2 L260.0,75.2 L261.0,75.1 L262.0,75.1 L263.0,75.1 L264.0,75.1 L265.0,75.1 L266.0,75.1 L267.0,75.1 L268.0,75.1 L269.0,75.1 L270.0,75.1 L271.0,75.1 L272.0,75.1 L273.0,75.1 L274.0,75.1 L275.0,75.1 L276.0,75.1 L277.0,75.1 L278.0,75.1 L279.0,75.1 L280.0,75.1 L281.0,75.1 L282.0,75.1 L283.0,75.1 L284.0,75.1 L285.0,75.1 L286.0,75.1 L287.0,75.1 L288.0,75.1 L289.0,75.1 L290.0,75.1 L291.0,75.1 L292.0,75.0 L293.0,75.0 L294.0,75.0 L295.0,75.0 L296.0,75.0 L297.0,75.0 L298.0,75.0 L299.0,75.0 L300.0,75.0 L301.0,75.0 L302.0,75.0 L303.0,75.0 L304.0,75.0 L305.0,75.0 L306.0,75.0 L307.0,75.0 L308.0,75.0 L309.0,75.0 L310.0,75.0 L311.0,75.0 L312.0,75.0 L313.0,75.0 L314.0,75.0 L315.0,75.0 L316.0,75.0 L317.0,75.0 L318.0,75.0 L319.0,75.0 L320.0,75.0 L321.0,75.0 L322.0,75.0 L323.0,75.0 L324.0,75.0 L325.0,75.0 L326.0,75.0 L327.0,75.0 L328.0,75.0 L329.0,75.0 L330.0,75.0 L331.0,75.0 L332.0,75.0 L333.0,75.0 L334.0,75.0 L335.0,75.0 L336.0,75.0 L337.0,75.0 L338.0,75.0 L339.0,75.0 L340.0,75.0" fill="none" stroke="#1f2a44" stroke-width="2.2"/>
<path d="M40.0,180.0 L41.0,179.9 L42.0,179.7 L43.0,179.4 L44.0,178.9 L45.0,178.4 L46.0,177.8 L47.0,177.1 L48.0,176.4 L49.0,175.6 L50.0,174.8 L51.0,174.0 L52.0,173.1 L53.0,172.2 L54.0,171.4 L55.0,170.5 L56.0,169.5 L57.0,168.6 L58.0,167.7 L59.0,166.8 L60.0,165.9 L61.0,165.0 L62.0,164.1 L63.0,163.1 L64.0,162.2 L65.0,161.3 L66.0,160.4 L67.0,159.6 L68.0,158.7 L69.0,157.8 L70.0,156.9 L71.0,156.1 L72.0,155.2 L73.0,154.4 L74.0,153.5 L75.0,152.7 L76.0,151.9 L77.0,151.1 L78.0,150.2 L79.0,149.5 L80.0,148.7 L81.0,147.9 L82.0,147.1 L83.0,146.3 L84.0,145.6 L85.0,144.8 L86.0,144.1 L87.0,143.3 L88.0,142.6 L89.0,141.9 L90.0,141.2 L91.0,140.5 L92.0,139.8 L93.0,139.1 L94.0,138.4 L95.0,137.7 L96.0,137.1 L97.0,136.4 L98.0,135.8 L99.0,135.1 L100.0,134.5 L101.0,133.8 L102.0,133.2 L103.0,132.6 L104.0,132.0 L105.0,131.4 L106.0,130.8 L107.0,130.2 L108.0,129.6 L109.0,129.0 L110.0,128.4 L111.0,127.9 L112.0,127.3 L113.0,126.7 L114.0,126.2 L115.0,125.6 L116.0,125.1 L117.0,124.6 L118.0,124.0 L119.0,123.5 L120.0,123.0 L121.0,122.5 L122.0,122.0 L123.0,121.5 L124.0,121.0 L125.0,120.5 L126.0,120.0 L127.0,119.5 L128.0,119.0 L129.0,118.6 L130.0,118.1 L131.0,117.7 L132.0,117.2 L133.0,116.7 L134.0,116.3 L135.0,115.9 L136.0,115.4 L137.0,115.0 L138.0,114.6 L139.0,114.1 L140.0,113.7 L141.0,113.3 L142.0,112.9 L143.0,112.5 L144.0,112.1 L145.0,111.7 L146.0,111.3 L147.0,110.9 L148.0,110.5 L149.0,110.2 L150.0,109.8 L151.0,109.4 L152.0,109.1 L153.0,108.7 L154.0,108.3 L155.0,108.0 L156.0,107.6 L157.0,107.3 L158.0,106.9 L159.0,106.6 L160.0,106.3 L161.0,105.9 L162.0,105.6 L163.0,105.3 L164.0,104.9 L165.0,104.6 L166.0,104.3 L167.0,104.0 L168.0,103.7 L169.0,103.4 L170.0,103.1 L171.0,102.8 L172.0,102.5 L173.0,102.2 L174.0,101.9 L175.0,101.6 L176.0,101.3 L177.0,101.1 L178.0,100.8 L179.0,100.5 L180.0,100.2 L181.0,100.0 L182.0,99.7 L183.0,99.4 L184.0,99.2 L185.0,98.9 L186.0,98.7 L187.0,98.4 L188.0,98.2 L189.0,97.9 L190.0,97.7 L191.0,97.4 L192.0,97.2 L193.0,96.9 L194.0,96.7 L195.0,96.5 L196.0,96.3 L197.0,96.0 L198.0,95.8 L199.0,95.6 L200.0,95.4 L201.0,95.1 L202.0,94.9 L203.0,94.7 L204.0,94.5 L205.0,94.3 L206.0,94.1 L207.0,93.9 L208.0,93.7 L209.0,93.5 L210.0,93.3 L211.0,93.1 L212.0,92.9 L213.0,92.7 L214.0,92.5 L215.0,92.3 L216.0,92.2 L217.0,92.0 L218.0,91.8 L219.0,91.6 L220.0,91.4 L221.0,91.3 L222.0,91.1 L223.0,90.9 L224.0,90.7 L225.0,90.6 L226.0,90.4 L227.0,90.2 L228.0,90.1 L229.0,89.9 L230.0,89.8 L231.0,89.6 L232.0,89.4 L233.0,89.3 L234.0,89.1 L235.0,89.0 L236.0,88.8 L237.0,88.7 L238.0,88.5 L239.0,88.4 L240.0,88.3 L241.0,88.1 L242.0,88.0 L243.0,87.8 L244.0,87.7 L245.0,87.6 L246.0,87.4 L247.0,87.3 L248.0,87.2 L249.0,87.0 L250.0,86.9 L251.0,86.8 L252.0,86.7 L253.0,86.5 L254.0,86.4 L255.0,86.3 L256.0,86.2 L257.0,86.1 L258.0,85.9 L259.0,85.8 L260.0,85.7 L261.0,85.6 L262.0,85.5 L263.0,85.4 L264.0,85.3 L265.0,85.1 L266.0,85.0 L267.0,84.9 L268.0,84.8 L269.0,84.7 L270.0,84.6 L271.0,84.5 L272.0,84.4 L273.0,84.3 L274.0,84.2 L275.0,84.1 L276.0,84.0 L277.0,83.9 L278.0,83.8 L279.0,83.7 L280.0,83.6 L281.0,83.5 L282.0,83.5 L283.0,83.4 L284.0,83.3 L285.0,83.2 L286.0,83.1 L287.0,83.0 L288.0,82.9 L289.0,82.8 L290.0,82.8 L291.0,82.7 L292.0,82.6 L293.0,82.5 L294.0,82.4 L295.0,82.4 L296.0,82.3 L297.0,82.2 L298.0,82.1 L299.0,82.0 L300.0,82.0 L301.0,81.9 L302.0,81.8 L303.0,81.8 L304.0,81.7 L305.0,81.6 L306.0,81.5 L307.0,81.5 L308.0,81.4 L309.0,81.3 L310.0,81.3 L311.0,81.2 L312.0,81.1 L313.0,81.1 L314.0,81.0 L315.0,80.9 L316.0,80.9 L317.0,80.8 L318.0,80.7 L319.0,80.7 L320.0,80.6 L321.0,80.6 L322.0,80.5 L323.0,80.4 L324.0,80.4 L325.0,80.3 L326.0,80.3 L327.0,80.2 L328.0,80.2 L329.0,80.1 L330.0,80.1 L331.0,80.0 L332.0,79.9 L333.0,79.9 L334.0,79.8 L335.0,79.8 L336.0,79.7 L337.0,79.7 L338.0,79.6 L339.0,79.6 L340.0,79.5" fill="none" stroke="#f2b880" stroke-width="2.2"/>
<text x="34" y="79.0" font-size="11" text-anchor="end" fill="#1f2a44">1</text>
<text x="34" y="184" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
<text x="136.2" y="25.7" font-size="11" fill="#b4232c">ζ = 0.2</text>
<text x="170.0" y="62.4" font-size="11" fill="#1d6fd1">ζ = 0.707</text>
<text x="120.0" y="110.7" font-size="11" fill="#1f2a44">ζ = 1</text>
<text x="170.0" y="127.5" font-size="11" fill="#1f2a44">ζ = 2</text>
<text x="340" y="195" font-size="11" text-anchor="end" fill="#1f2a44">ωn t = 12</text>
</svg>
```
:::

::: context step-anatomy Peak, envelope and band
A step response with $\zeta = 0.4$. The first peak comes at $t_p = \pi/\omega_d$ and overshoots by 25.4%. The dashed envelope $1 \pm e^{-\zeta\omega_n t}/\sqrt{1 - \zeta^2}$ closes in on the final value, and by about $4/(\zeta\omega_n)$ the curve is inside the shaded $\pm 2\%$ band for good.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 205" font-family="Inter, Arial, sans-serif">
<rect x="40" y="57.6" width="300" height="4.8" fill="#8fb8f0" opacity="0.6"/>
<line x1="40" y1="180" x2="340" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
<line x1="40" y1="180" x2="40" y2="12" stroke="#1f2a44" stroke-width="1.5"/>
<path d="M94.0,12.2 L94.8,12.9 L95.5,13.5 L96.2,14.2 L97.0,14.8 L97.8,15.4 L98.5,16.1 L99.2,16.7 L100.0,17.3 L100.8,17.9 L101.5,18.5 L102.2,19.0 L103.0,19.6 L103.8,20.2 L104.5,20.7 L105.3,21.3 L106.0,21.8 L106.8,22.3 L107.5,22.9 L108.3,23.4 L109.0,23.9 L109.8,24.4 L110.5,24.9 L111.2,25.4 L112.0,25.9 L112.8,26.3 L113.5,26.8 L114.2,27.3 L115.0,27.7 L115.8,28.2 L116.5,28.6 L117.3,29.0 L118.0,29.5 L118.8,29.9 L119.5,30.3 L120.3,30.7 L121.0,31.1 L121.8,31.5 L122.5,31.9 L123.2,32.3 L124.0,32.7 L124.8,33.1 L125.5,33.5 L126.2,33.8 L127.0,34.2 L127.8,34.6 L128.5,34.9 L129.2,35.3 L130.0,35.6 L130.8,35.9 L131.5,36.3 L132.2,36.6 L133.0,36.9 L133.8,37.2 L134.5,37.6 L135.2,37.9 L136.0,38.2 L136.8,38.5 L137.5,38.8 L138.2,39.1 L139.0,39.4 L139.8,39.7 L140.5,39.9 L141.2,40.2 L142.0,40.5 L142.8,40.8 L143.5,41.0 L144.2,41.3 L145.0,41.6 L145.8,41.8 L146.5,42.1 L147.2,42.3 L148.0,42.6 L148.8,42.8 L149.5,43.0 L150.2,43.3 L151.0,43.5 L151.8,43.7 L152.5,44.0 L153.2,44.2 L154.0,44.4 L154.8,44.6 L155.5,44.8 L156.2,45.1 L157.0,45.3 L157.8,45.5 L158.5,45.7 L159.2,45.9 L160.0,46.1 L160.8,46.3 L161.5,46.4 L162.2,46.6 L163.0,46.8 L163.8,47.0 L164.5,47.2 L165.2,47.4 L166.0,47.5 L166.8,47.7 L167.5,47.9 L168.2,48.1 L169.0,48.2 L169.8,48.4 L170.5,48.5 L171.3,48.7 L172.0,48.9 L172.8,49.0 L173.5,49.2 L174.3,49.3 L175.0,49.5 L175.8,49.6 L176.5,49.8 L177.2,49.9 L178.0,50.0 L178.8,50.2 L179.5,50.3 L180.3,50.4 L181.0,50.6 L181.8,50.7 L182.5,50.8 L183.3,51.0 L184.0,51.1 L184.8,51.2 L185.5,51.3 L186.3,51.5 L187.0,51.6 L187.8,51.7 L188.5,51.8 L189.2,51.9 L190.0,52.0 L190.8,52.1 L191.5,52.3 L192.2,52.4 L193.0,52.5 L193.8,52.6 L194.5,52.7 L195.3,52.8 L196.0,52.9 L196.8,53.0 L197.5,53.1 L198.2,53.2 L199.0,53.3 L199.8,53.4 L200.5,53.5 L201.2,53.5 L202.0,53.6 L202.8,53.7 L203.5,53.8 L204.3,53.9 L205.0,54.0 L205.8,54.1 L206.5,54.1 L207.2,54.2 L208.0,54.3 L208.8,54.4 L209.5,54.5 L210.3,54.5 L211.0,54.6 L211.8,54.7 L212.5,54.8 L213.3,54.8 L214.0,54.9 L214.8,55.0 L215.5,55.1 L216.3,55.1 L217.0,55.2 L217.8,55.3 L218.5,55.3 L219.2,55.4 L220.0,55.5 L220.8,55.5 L221.5,55.6 L222.3,55.6 L223.0,55.7 L223.8,55.8 L224.5,55.8 L225.3,55.9 L226.0,55.9 L226.8,56.0 L227.5,56.0 L228.2,56.1 L229.0,56.2 L229.8,56.2 L230.5,56.3 L231.2,56.3 L232.0,56.4 L232.8,56.4 L233.5,56.5 L234.3,56.5 L235.0,56.6 L235.8,56.6 L236.5,56.7 L237.2,56.7 L238.0,56.7 L238.8,56.8 L239.5,56.8 L240.2,56.9 L241.0,56.9 L241.8,57.0 L242.5,57.0 L243.3,57.1 L244.0,57.1 L244.8,57.1 L245.5,57.2 L246.3,57.2 L247.0,57.3 L247.8,57.3 L248.5,57.3 L249.2,57.4 L250.0,57.4 L250.8,57.4 L251.5,57.5 L252.3,57.5 L253.0,57.5 L253.8,57.6 L254.5,57.6 L255.3,57.6 L256.0,57.7 L256.8,57.7 L257.5,57.7 L258.2,57.8 L259.0,57.8 L259.8,57.8 L260.5,57.9 L261.2,57.9 L262.0,57.9 L262.8,58.0 L263.5,58.0 L264.2,58.0 L265.0,58.0 L265.8,58.1 L266.5,58.1 L267.2,58.1 L268.0,58.1 L268.8,58.2 L269.5,58.2 L270.2,58.2 L271.0,58.2 L271.8,58.3 L272.5,58.3 L273.2,58.3 L274.0,58.3 L274.8,58.4 L275.5,58.4 L276.2,58.4 L277.0,58.4 L277.8,58.5 L278.5,58.5 L279.2,58.5 L280.0,58.5 L280.8,58.5 L281.5,58.6 L282.2,58.6 L283.0,58.6 L283.8,58.6 L284.5,58.6 L285.2,58.7 L286.0,58.7 L286.8,58.7 L287.5,58.7 L288.2,58.7 L289.0,58.7 L289.8,58.8 L290.5,58.8 L291.2,58.8 L292.0,58.8 L292.8,58.8 L293.5,58.8 L294.2,58.9 L295.0,58.9 L295.8,58.9 L296.5,58.9 L297.3,58.9 L298.0,58.9 L298.8,59.0 L299.5,59.0 L300.3,59.0 L301.0,59.0 L301.8,59.0 L302.5,59.0 L303.3,59.0 L304.0,59.1 L304.8,59.1 L305.5,59.1 L306.2,59.1 L307.0,59.1 L307.8,59.1 L308.5,59.1 L309.3,59.1 L310.0,59.2 L310.8,59.2 L311.5,59.2 L312.3,59.2 L313.0,59.2 L313.8,59.2 L314.5,59.2 L315.2,59.2 L316.0,59.2 L316.8,59.3 L317.5,59.3 L318.3,59.3 L319.0,59.3 L319.8,59.3 L320.5,59.3 L321.3,59.3 L322.0,59.3 L322.8,59.3 L323.5,59.3 L324.2,59.4 L325.0,59.4 L325.8,59.4 L326.5,59.4 L327.3,59.4 L328.0,59.4 L328.8,59.4 L329.5,59.4 L330.3,59.4 L331.0,59.4 L331.8,59.4 L332.5,59.4 L333.2,59.5 L334.0,59.5 L334.8,59.5 L335.5,59.5 L336.2,59.5 L337.0,59.5 L337.8,59.5 L338.5,59.5 L339.3,59.5 L340.0,59.5" fill="none" stroke="#b4232c" stroke-width="1.2" stroke-dasharray="4 3"/>
<path d="M57.2,154.9 L58.0,153.6 L58.8,152.3 L59.5,151.0 L60.2,149.7 L61.0,148.5 L61.8,147.2 L62.5,146.0 L63.2,144.8 L64.0,143.7 L64.8,142.5 L65.5,141.3 L66.2,140.2 L67.0,139.1 L67.8,138.0 L68.5,136.9 L69.2,135.8 L70.0,134.8 L70.8,133.7 L71.5,132.7 L72.2,131.7 L73.0,130.7 L73.8,129.7 L74.5,128.8 L75.2,127.8 L76.0,126.9 L76.8,125.9 L77.5,125.0 L78.2,124.1 L79.0,123.2 L79.8,122.3 L80.5,121.5 L81.2,120.6 L82.0,119.8 L82.8,118.9 L83.5,118.1 L84.2,117.3 L85.0,116.5 L85.8,115.7 L86.5,115.0 L87.2,114.2 L88.0,113.4 L88.8,112.7 L89.5,112.0 L90.2,111.2 L91.0,110.5 L91.8,109.8 L92.5,109.1 L93.2,108.5 L94.0,107.8 L94.8,107.1 L95.5,106.5 L96.2,105.8 L97.0,105.2 L97.8,104.6 L98.5,103.9 L99.2,103.3 L100.0,102.7 L100.8,102.1 L101.5,101.5 L102.2,101.0 L103.0,100.4 L103.8,99.8 L104.5,99.3 L105.3,98.7 L106.0,98.2 L106.8,97.7 L107.5,97.1 L108.3,96.6 L109.0,96.1 L109.8,95.6 L110.5,95.1 L111.2,94.6 L112.0,94.1 L112.8,93.7 L113.5,93.2 L114.2,92.7 L115.0,92.3 L115.8,91.8 L116.5,91.4 L117.3,91.0 L118.0,90.5 L118.8,90.1 L119.5,89.7 L120.3,89.3 L121.0,88.9 L121.8,88.5 L122.5,88.1 L123.2,87.7 L124.0,87.3 L124.8,86.9 L125.5,86.5 L126.2,86.2 L127.0,85.8 L127.8,85.4 L128.5,85.1 L129.2,84.7 L130.0,84.4 L130.8,84.1 L131.5,83.7 L132.2,83.4 L133.0,83.1 L133.8,82.8 L134.5,82.4 L135.2,82.1 L136.0,81.8 L136.8,81.5 L137.5,81.2 L138.2,80.9 L139.0,80.6 L139.8,80.3 L140.5,80.1 L141.2,79.8 L142.0,79.5 L142.8,79.2 L143.5,79.0 L144.2,78.7 L145.0,78.4 L145.8,78.2 L146.5,77.9 L147.2,77.7 L148.0,77.4 L148.8,77.2 L149.5,77.0 L150.2,76.7 L151.0,76.5 L151.8,76.3 L152.5,76.0 L153.2,75.8 L154.0,75.6 L154.8,75.4 L155.5,75.2 L156.2,74.9 L157.0,74.7 L157.8,74.5 L158.5,74.3 L159.2,74.1 L160.0,73.9 L160.8,73.7 L161.5,73.6 L162.2,73.4 L163.0,73.2 L163.8,73.0 L164.5,72.8 L165.2,72.6 L166.0,72.5 L166.8,72.3 L167.5,72.1 L168.2,71.9 L169.0,71.8 L169.8,71.6 L170.5,71.5 L171.3,71.3 L172.0,71.1 L172.8,71.0 L173.5,70.8 L174.3,70.7 L175.0,70.5 L175.8,70.4 L176.5,70.2 L177.2,70.1 L178.0,70.0 L178.8,69.8 L179.5,69.7 L180.3,69.6 L181.0,69.4 L181.8,69.3 L182.5,69.2 L183.3,69.0 L184.0,68.9 L184.8,68.8 L185.5,68.7 L186.3,68.5 L187.0,68.4 L187.8,68.3 L188.5,68.2 L189.2,68.1 L190.0,68.0 L190.8,67.9 L191.5,67.7 L192.2,67.6 L193.0,67.5 L193.8,67.4 L194.5,67.3 L195.3,67.2 L196.0,67.1 L196.8,67.0 L197.5,66.9 L198.2,66.8 L199.0,66.7 L199.8,66.6 L200.5,66.5 L201.2,66.5 L202.0,66.4 L202.8,66.3 L203.5,66.2 L204.3,66.1 L205.0,66.0 L205.8,65.9 L206.5,65.9 L207.2,65.8 L208.0,65.7 L208.8,65.6 L209.5,65.5 L210.3,65.5 L211.0,65.4 L211.8,65.3 L212.5,65.2 L213.3,65.2 L214.0,65.1 L214.8,65.0 L215.5,64.9 L216.3,64.9 L217.0,64.8 L217.8,64.7 L218.5,64.7 L219.2,64.6 L220.0,64.5 L220.8,64.5 L221.5,64.4 L222.3,64.4 L223.0,64.3 L223.8,64.2 L224.5,64.2 L225.3,64.1 L226.0,64.1 L226.8,64.0 L227.5,64.0 L228.2,63.9 L229.0,63.8 L229.8,63.8 L230.5,63.7 L231.2,63.7 L232.0,63.6 L232.8,63.6 L233.5,63.5 L234.3,63.5 L235.0,63.4 L235.8,63.4 L236.5,63.3 L237.2,63.3 L238.0,63.3 L238.8,63.2 L239.5,63.2 L240.2,63.1 L241.0,63.1 L241.8,63.0 L242.5,63.0 L243.3,62.9 L244.0,62.9 L244.8,62.9 L245.5,62.8 L246.3,62.8 L247.0,62.7 L247.8,62.7 L248.5,62.7 L249.2,62.6 L250.0,62.6 L250.8,62.6 L251.5,62.5 L252.3,62.5 L253.0,62.5 L253.8,62.4 L254.5,62.4 L255.3,62.4 L256.0,62.3 L256.8,62.3 L257.5,62.3 L258.2,62.2 L259.0,62.2 L259.8,62.2 L260.5,62.1 L261.2,62.1 L262.0,62.1 L262.8,62.0 L263.5,62.0 L264.2,62.0 L265.0,62.0 L265.8,61.9 L266.5,61.9 L267.2,61.9 L268.0,61.9 L268.8,61.8 L269.5,61.8 L270.2,61.8 L271.0,61.8 L271.8,61.7 L272.5,61.7 L273.2,61.7 L274.0,61.7 L274.8,61.6 L275.5,61.6 L276.2,61.6 L277.0,61.6 L277.8,61.5 L278.5,61.5 L279.2,61.5 L280.0,61.5 L280.8,61.5 L281.5,61.4 L282.2,61.4 L283.0,61.4 L283.8,61.4 L284.5,61.4 L285.2,61.3 L286.0,61.3 L286.8,61.3 L287.5,61.3 L288.2,61.3 L289.0,61.3 L289.8,61.2 L290.5,61.2 L291.2,61.2 L292.0,61.2 L292.8,61.2 L293.5,61.2 L294.2,61.1 L295.0,61.1 L295.8,61.1 L296.5,61.1 L297.3,61.1 L298.0,61.1 L298.8,61.0 L299.5,61.0 L300.3,61.0 L301.0,61.0 L301.8,61.0 L302.5,61.0 L303.3,61.0 L304.0,60.9 L304.8,60.9 L305.5,60.9 L306.2,60.9 L307.0,60.9 L307.8,60.9 L308.5,60.9 L309.3,60.9 L310.0,60.8 L310.8,60.8 L311.5,60.8 L312.3,60.8 L313.0,60.8 L313.8,60.8 L314.5,60.8 L315.2,60.8 L316.0,60.8 L316.8,60.7 L317.5,60.7 L318.3,60.7 L319.0,60.7 L319.8,60.7 L320.5,60.7 L321.3,60.7 L322.0,60.7 L322.8,60.7 L323.5,60.7 L324.2,60.6 L325.0,60.6 L325.8,60.6 L326.5,60.6 L327.3,60.6 L328.0,60.6 L328.8,60.6 L329.5,60.6 L330.3,60.6 L331.0,60.6 L331.8,60.6 L332.5,60.6 L333.2,60.5 L334.0,60.5 L334.8,60.5 L335.5,60.5 L336.2,60.5 L337.0,60.5 L337.8,60.5 L338.5,60.5 L339.3,60.5 L340.0,60.5" fill="none" stroke="#b4232c" stroke-width="1.2" stroke-dasharray="4 3"/>
<path d="M40.0,180.0 L40.8,179.9 L41.5,179.7 L42.2,179.4 L43.0,178.9 L43.8,178.2 L44.5,177.5 L45.2,176.6 L46.0,175.7 L46.8,174.6 L47.5,173.4 L48.2,172.1 L49.0,170.6 L49.8,169.1 L50.5,167.6 L51.2,165.9 L52.0,164.1 L52.8,162.3 L53.5,160.4 L54.2,158.4 L55.0,156.3 L55.8,154.2 L56.5,152.1 L57.2,149.9 L58.0,147.6 L58.8,145.3 L59.5,143.0 L60.2,140.6 L61.0,138.2 L61.8,135.8 L62.5,133.3 L63.2,130.8 L64.0,128.3 L64.8,125.8 L65.5,123.3 L66.2,120.8 L67.0,118.2 L67.8,115.7 L68.5,113.2 L69.2,110.6 L70.0,108.1 L70.8,105.6 L71.5,103.1 L72.2,100.7 L73.0,98.2 L73.8,95.8 L74.5,93.4 L75.2,91.0 L76.0,88.6 L76.8,86.3 L77.5,84.0 L78.2,81.8 L79.0,79.5 L79.8,77.4 L80.5,75.2 L81.2,73.1 L82.0,71.1 L82.8,69.0 L83.5,67.1 L84.2,65.1 L85.0,63.3 L85.8,61.4 L86.5,59.6 L87.2,57.9 L88.0,56.2 L88.8,54.6 L89.5,53.0 L90.2,51.5 L91.0,50.0 L91.8,48.6 L92.5,47.2 L93.2,45.9 L94.0,44.6 L94.8,43.4 L95.5,42.3 L96.2,41.2 L97.0,40.1 L97.8,39.1 L98.5,38.2 L99.2,37.3 L100.0,36.4 L100.8,35.7 L101.5,34.9 L102.2,34.2 L103.0,33.6 L103.8,33.0 L104.5,32.5 L105.3,32.0 L106.0,31.5 L106.8,31.1 L107.5,30.8 L108.3,30.5 L109.0,30.2 L109.8,30.0 L110.5,29.8 L111.2,29.7 L112.0,29.6 L112.8,29.6 L113.5,29.5 L114.2,29.6 L115.0,29.6 L115.8,29.7 L116.5,29.8 L117.3,30.0 L118.0,30.2 L118.8,30.4 L119.5,30.7 L120.3,30.9 L121.0,31.2 L121.8,31.6 L122.5,31.9 L123.2,32.3 L124.0,32.7 L124.8,33.2 L125.5,33.6 L126.2,34.1 L127.0,34.6 L127.8,35.1 L128.5,35.6 L129.2,36.1 L130.0,36.7 L130.8,37.2 L131.5,37.8 L132.2,38.4 L133.0,39.0 L133.8,39.6 L134.5,40.2 L135.2,40.8 L136.0,41.4 L136.8,42.1 L137.5,42.7 L138.2,43.3 L139.0,44.0 L139.8,44.6 L140.5,45.3 L141.2,45.9 L142.0,46.5 L142.8,47.2 L143.5,47.8 L144.2,48.5 L145.0,49.1 L145.8,49.7 L146.5,50.3 L147.2,51.0 L148.0,51.6 L148.8,52.2 L149.5,52.8 L150.2,53.4 L151.0,53.9 L151.8,54.5 L152.5,55.1 L153.2,55.6 L154.0,56.2 L154.8,56.7 L155.5,57.2 L156.2,57.7 L157.0,58.2 L157.8,58.7 L158.5,59.2 L159.2,59.7 L160.0,60.1 L160.8,60.6 L161.5,61.0 L162.2,61.4 L163.0,61.8 L163.8,62.2 L164.5,62.6 L165.2,62.9 L166.0,63.3 L166.8,63.6 L167.5,63.9 L168.2,64.2 L169.0,64.5 L169.8,64.8 L170.5,65.1 L171.3,65.3 L172.0,65.6 L172.8,65.8 L173.5,66.0 L174.3,66.2 L175.0,66.4 L175.8,66.5 L176.5,66.7 L177.2,66.9 L178.0,67.0 L178.8,67.1 L179.5,67.2 L180.3,67.3 L181.0,67.4 L181.8,67.5 L182.5,67.6 L183.3,67.6 L184.0,67.7 L184.8,67.7 L185.5,67.7 L186.3,67.7 L187.0,67.7 L187.8,67.7 L188.5,67.7 L189.2,67.7 L190.0,67.7 L190.8,67.6 L191.5,67.6 L192.2,67.5 L193.0,67.4 L193.8,67.4 L194.5,67.3 L195.3,67.2 L196.0,67.1 L196.8,67.0 L197.5,66.9 L198.2,66.8 L199.0,66.7 L199.8,66.6 L200.5,66.5 L201.2,66.3 L202.0,66.2 L202.8,66.1 L203.5,65.9 L204.3,65.8 L205.0,65.6 L205.8,65.5 L206.5,65.3 L207.2,65.2 L208.0,65.0 L208.8,64.9 L209.5,64.7 L210.3,64.5 L211.0,64.4 L211.8,64.2 L212.5,64.1 L213.3,63.9 L214.0,63.7 L214.8,63.6 L215.5,63.4 L216.3,63.2 L217.0,63.1 L217.8,62.9 L218.5,62.8 L219.2,62.6 L220.0,62.4 L220.8,62.3 L221.5,62.1 L222.3,62.0 L223.0,61.8 L223.8,61.7 L224.5,61.5 L225.3,61.4 L226.0,61.2 L226.8,61.1 L227.5,61.0 L228.2,60.8 L229.0,60.7 L229.8,60.6 L230.5,60.4 L231.2,60.3 L232.0,60.2 L232.8,60.1 L233.5,60.0 L234.3,59.9 L235.0,59.7 L235.8,59.6 L236.5,59.5 L237.2,59.4 L238.0,59.3 L238.8,59.3 L239.5,59.2 L240.2,59.1 L241.0,59.0 L241.8,58.9 L242.5,58.8 L243.3,58.8 L244.0,58.7 L244.8,58.6 L245.5,58.6 L246.3,58.5 L247.0,58.5 L247.8,58.4 L248.5,58.4 L249.2,58.3 L250.0,58.3 L250.8,58.3 L251.5,58.2 L252.3,58.2 L253.0,58.2 L253.8,58.1 L254.5,58.1 L255.3,58.1 L256.0,58.1 L256.8,58.1 L257.5,58.1 L258.2,58.0 L259.0,58.0 L259.8,58.0 L260.5,58.0 L261.2,58.0 L262.0,58.0 L262.8,58.0 L263.5,58.1 L264.2,58.1 L265.0,58.1 L265.8,58.1 L266.5,58.1 L267.2,58.1 L268.0,58.2 L268.8,58.2 L269.5,58.2 L270.2,58.2 L271.0,58.2 L271.8,58.3 L272.5,58.3 L273.2,58.3 L274.0,58.4 L274.8,58.4 L275.5,58.4 L276.2,58.5 L277.0,58.5 L277.8,58.5 L278.5,58.6 L279.2,58.6 L280.0,58.7 L280.8,58.7 L281.5,58.7 L282.2,58.8 L283.0,58.8 L283.8,58.8 L284.5,58.9 L285.2,58.9 L286.0,59.0 L286.8,59.0 L287.5,59.1 L288.2,59.1 L289.0,59.1 L289.8,59.2 L290.5,59.2 L291.2,59.3 L292.0,59.3 L292.8,59.3 L293.5,59.4 L294.2,59.4 L295.0,59.5 L295.8,59.5 L296.5,59.5 L297.3,59.6 L298.0,59.6 L298.8,59.7 L299.5,59.7 L300.3,59.7 L301.0,59.8 L301.8,59.8 L302.5,59.8 L303.3,59.9 L304.0,59.9 L304.8,59.9 L305.5,60.0 L306.2,60.0 L307.0,60.0 L307.8,60.0 L308.5,60.1 L309.3,60.1 L310.0,60.1 L310.8,60.1 L311.5,60.2 L312.3,60.2 L313.0,60.2 L313.8,60.2 L314.5,60.3 L315.2,60.3 L316.0,60.3 L316.8,60.3 L317.5,60.3 L318.3,60.3 L319.0,60.4 L319.8,60.4 L320.5,60.4 L321.3,60.4 L322.0,60.4 L322.8,60.4 L323.5,60.4 L324.2,60.4 L325.0,60.5 L325.8,60.5 L326.5,60.5 L327.3,60.5 L328.0,60.5 L328.8,60.5 L329.5,60.5 L330.3,60.5 L331.0,60.5 L331.8,60.5 L332.5,60.5 L333.2,60.5 L334.0,60.5 L334.8,60.5 L335.5,60.5 L336.2,60.5 L337.0,60.5 L337.8,60.5 L338.5,60.5 L339.3,60.5 L340.0,60.5" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
<line x1="113.5" y1="29.5" x2="113.5" y2="180" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
<line x1="123.5" y1="29.5" x2="123.5" y2="60.0" stroke="#1f2a44" stroke-width="1.5"/>
<text x="129.5" y="43.2" font-size="11" fill="#1f2a44">overshoot 25%</text>
<text x="113.5" y="194" font-size="11" text-anchor="middle" fill="#1f2a44">tp</text>
<line x1="254.3" y1="60.0" x2="254.3" y2="180" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
<text x="254.3" y="194" font-size="11" text-anchor="middle" fill="#1f2a44">4/(ζωn)</text>
<text x="267.1" y="72.0" font-size="11" fill="#1d6fd1">±2% band</text>
<text x="153.6" y="114.0" font-size="11" fill="#b4232c">envelope</text>
<text x="34" y="64.0" font-size="11" text-anchor="end" fill="#1f2a44">1</text>
<text x="34" y="184" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
</svg>
```
:::

::: context butterworth Named after a radio engineer
The British engineer Stephen Butterworth described this filter shape in a 1930 paper on amplifiers. He was after a response as flat as possible across the range of frequencies it should pass, and the second-order version of his design has exactly $\zeta = 1/\sqrt{2}$. Audio equipment and sensor filters still use Butterworth filters today.
:::

::: context phase-margin A cushion against delay
Every real control loop has delays: sensors take time to measure, computers take time to calculate, actuators take time to move. Too much delay turns a steady loop into one that oscillates on its own. **Phase margin** measures how much extra delay the loop could absorb, expressed as an angle in degrees, before that happens. Designers usually want at least $30^\circ$ to $60^\circ$. You will compute it properly in the control modules.
:::

::: context q-alpha Air load on a climbing rocket
**Dynamic pressure**, written $\bar{q}$ ("q bar"), is how hard the oncoming air hits the vehicle; it peaks about a minute after launch at "max-q". **Angle of attack**, $\alpha$ ("alpha"), is how far the rocket's nose points away from the direction it is actually moving. The sideways force on the long, thin body grows with their product, $\bar{q}\alpha$, and a tall rocket can snap if it gets too big. Autopilots steer to keep $\alpha$ small near max-q — this is called **load relief**.
:::

::: context bending-mode A rocket is a flexible tube
A launch vehicle is long and thin — Falcon 9 is about $70\,\mathrm{m}$ tall and under $4\,\mathrm{m}$ across — so it bends like a fishing rod. The first bending mode is the simplest shape: the middle bowing one way while the ends go the other. The gyros that feel the rocket's rotation also feel this bending. If the autopilot reacts to it at the wrong moment, it pumps energy into the bending instead of steering, so the control loop has to stay well away from the bending frequency.
:::
