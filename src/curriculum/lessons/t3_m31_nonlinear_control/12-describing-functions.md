---
id: l12-describing-functions
title: Describing functions for limit-cycle prediction
minutes: 20
covers:
  - 'Describing functions for limit-cycle prediction'
---

You step into a shower that is too cold and turn the knob toward hot. Nothing changes for a few seconds, because the hot water has to travel up the pipe, so you turn it further. Then it arrives scalding. You turn back toward cold, too far again. If you keep reacting to what you feel right now, you can swing between too hot and too cold forever, with a steady size and a steady rhythm. That steady swing is a **limit cycle**, and the lag in the pipe is what causes it.

Every actuator on a real vehicle has a hard nonlinearity hiding in it somewhere. A thruster valve is either open or shut. A gear train has **[[backlash|backlash]]**. An amplifier saturates. A rate limiter clips. For loops like these, the question an engineer asks is not only "is the origin stable?" It is: "will this loop settle down, or ring forever — and if it rings, how big and how fast?" A Lyapunov proof, when you can find one, answers the first question and is silent on the second. Linearization is worse than silent: a relay's slope is either zero or infinite, so there is no Jacobian to take.

The **[[describing function|df-history]]** method answers the second question with nothing heavier than a frequency response. It replaces the nonlinearity by the best single gain that copies its response to a sine wave of a given size, throws away the rest, and looks for the size and frequency at which that loop sits exactly on the edge of instability. It is approximate by design, and this lesson is honest about when the approximation holds. It is also the standard first tool for the nonlinearities a GNC engineer meets most: saturation, on-off thrusters, and the **[[Schmitt trigger|schmitt-bridge]]** that lesson 14 builds a whole control law around.

Both worked examples drive the same loop — a torque command, one integration to angular rate, and two matched lags standing in for actuator response and a rate filter — so that comparing a relay with a saturating actuator compares nonlinearities and nothing else.

## The describing function: a nonlinearity's best sine-wave impersonation

Feed a sine wave into a nonlinearity and look at what comes out. A relay turns it into a square wave. A saturating amplifier flattens its tops. Neither output is a sine. But any repeating wave can be built as a sum of sine waves, a **[[Fourier series|fourier-picture]]**: one at the input's own frequency, called the **fundamental** (or first **harmonic**), plus others at two, three, four times that frequency. The describing function keeps only the fundamental.

In symbols, drive the nonlinearity with $e(\theta) = A\sin\theta$, where $\theta = \omega t$ ("theta equals omega t") and $A$ is the amplitude. Call the output $y(\theta)$. Its fundamental has a sine part $b_1$ and a cosine part $a_1$, found the way any Fourier coefficient is found:

$$
a_1 = \frac{1}{\pi}\int_0^{2\pi} y(\theta)\cos\theta\,d\theta, \qquad b_1 = \frac{1}{\pi}\int_0^{2\pi} y(\theta)\sin\theta\,d\theta .
$$

The **describing function** is the complex gain from the input sine to that fundamental:

$$
N(A) = \frac{b_1 + ja_1}{A} .
$$

Read $N(A)$ as "N of A": it depends on the input's size, which is exactly what a linear gain cannot do. Here $j$ is the imaginary unit, so $a_1$ records any shift in timing between input and output.

For a nonlinearity with no memory — the output depends only on the input *right now* — $a_1 = 0$, and $N(A)$ is a plain real number. Relay, saturation and **[[dead zone|nonlinearity-shapes]]** are all like that, and so is every case in this lesson.

::: note Why it has to be true: a memoryless nonlinearity has $a_1 = 0$
The output is $y(\theta) = f(A\sin\theta)$ for some function $f$. Compare the moments $\theta$ and $\pi - \theta$. The input is the same at both, because $\sin(\pi - \theta) = \sin\theta$, so the output is the same too. But $\cos(\pi - \theta) = -\cos\theta$. So in the integral for $a_1$, each moment's contribution $y\cos\theta$ is canceled by its partner's, and $a_1 = 0$.

A relay with **hysteresis** breaks this. It switches at different levels on the way up and on the way down, so the same input can give different outputs, and the output lags the input. Then $a_1 \ne 0$ and $N(A)$ is complex. Lesson 14 needs that case for exactly one device.
:::

::: warning
$N(A)$ throws away everything but the fundamental. The approximation is trustworthy only when the rest of the loop damps out the harmonics the nonlinearity creates — in practice, when the plant is well **low-pass** (passes slow signals, blocks fast ones) at the oscillation frequency and above. A plant with a lightly damped resonance near the third harmonic of a predicted limit cycle can make the whole prediction unreliable. No algebra inside $N(A)$ fixes that. It is a property of the *plant*, checked separately.
:::

## Predicting a limit cycle

Put the nonlinearity in the forward path of a unity-feedback loop. Lump everything else — plant, actuator, sensor filter — into one linear frequency response $L(j\omega)$. Ask whether the loop can keep oscillating with no outside input.

Replace the nonlinearity by $N(A)$ and the loop looks linear. A linear loop sits exactly on the edge of instability, able to ring forever, when $1 + N(A)L(j\omega) = 0$. Rearrange to put the two unknowns on separate sides:

$$
L(j\omega) = -\frac{1}{N(A)} .
$$

The left side is a curve in the complex plane traced out as frequency changes: the **[[Nyquist plot|nyquist-picture]]** of $L$. The right side is a second curve traced out as amplitude changes. Where they cross, both are satisfied at once. The frequency at that point is the predicted oscillation frequency, and the amplitude there is the predicted size. No crossing, no predicted limit cycle.

::: key Describing function and limit-cycle prediction
The describing function $N(A)$ is the quasi-linear gain of a nonlinearity to a sinusoid of amplitude $A$. A limit cycle is predicted where the Nyquist plot of $L(j\omega)$ intersects $-1/N(A)$. It is approximate — it assumes the loop filters out the harmonics — but it is the standard tool for thruster and saturation limit cycles.
:::

::: key Real describing functions: frequency from the plant, amplitude from the nonlinearity
For any memoryless nonlinearity, $-1/N(A)$ lies on the negative real axis, so the predicted **frequency** is where $L(j\omega)$ itself crosses that axis — a property of the linear part alone. Only the predicted **amplitude** depends on which nonlinearity you paired with it.
:::

**Will the loop settle onto it, or run away from it?** A crossing is only useful if the loop is drawn *toward* it. Here is a simple test when $N$ is real. At the crossing frequency, the loop is on the edge when $N(A)\,\lvert L(j\omega_0)\rvert = 1$. If a slightly *smaller* swing has a *bigger* gain, that smaller swing is "too hot" — above the edge — and grows. If a slightly bigger swing has a smaller gain, it shrinks. Either way the loop is pushed back to the predicted size: a **[[stable limit cycle|stable-cycle]]**. If $N(A)$ instead *rises* with $A$ near the crossing, the cycle repels: smaller swings die out, bigger ones run away.

## Two describing functions you can derive by hand

### The ideal relay

A relay outputs $+M$ when its input is positive and $-M$ when it is negative. Fed $A\sin\theta$, it gives $y = M$ for $\theta$ between $0$ and $\pi$ and $y = -M$ between $\pi$ and $2\pi$: a square wave that switches exactly when the input crosses zero. It has no memory, so $a_1 = 0$. For $b_1$, split the integral at $\pi$:

$$
b_1 = \frac{1}{\pi}\left[\int_0^\pi M\sin\theta\,d\theta - \int_\pi^{2\pi} M\sin\theta\,d\theta\right] = \frac{1}{\pi}\big[M(2) - M(-2)\big] = \frac{4M}{\pi} .
$$

The middle step uses $\int_0^\pi\sin\theta\,d\theta = 2$ and $\int_\pi^{2\pi}\sin\theta\,d\theta = -2$. Divide by $A$:

$$
N(A) = \frac{4M}{\pi A} .
$$

It is real, positive, and falls as $A$ grows. The relay's output does not get bigger when the input does, so relative to a bigger input it looks like a smaller gain.

### Saturation

Saturation is linear with slope $k$ until the input reaches $\pm a$, and flat beyond: the output never exceeds $ka$ in size. If $A \le a$, the input never reaches the flat part and $N(A) = k$ exactly.

For $A \gt a$, let $\theta_1 = \arcsin(a/A)$ be the angle at which the input first hits the limit. The output is odd and symmetric about $\theta = \pi/2$, so the four quarters of a cycle contribute equally, and

$$
b_1 = \frac{4}{\pi}\int_0^{\pi/2}y(\theta)\sin\theta\,d\theta = \frac{4}{\pi}\left[\underbrace{kA\int_0^{\theta_1}\sin^2\theta\,d\theta}_{\text{linear part}} + \underbrace{ka\int_{\theta_1}^{\pi/2}\sin\theta\,d\theta}_{\text{flat part}}\right] .
$$

Work the two pieces.

1. The linear part: $\int_0^{\theta_1}\sin^2\theta\,d\theta = \tfrac{\theta_1}{2} - \tfrac{\sin\theta_1\cos\theta_1}{2}$, so it contributes $kA\left(\tfrac{\theta_1}{2} - \tfrac{\sin\theta_1\cos\theta_1}{2}\right)$.
2. The flat part: $\int_{\theta_1}^{\pi/2}\sin\theta\,d\theta = \cos\theta_1$, so it contributes $ka\cos\theta_1$. Since $a = A\sin\theta_1$, that is $kA\sin\theta_1\cos\theta_1$.
3. Add them: $-\tfrac12 + 1 = \tfrac12$ of the $\sin\theta_1\cos\theta_1$ term survives, giving $\tfrac{kA}{2}\left(\theta_1 + \sin\theta_1\cos\theta_1\right)$.
4. Multiply by $4/\pi$ and divide by $A$, and write $\sin\theta_1 = a/A$, $\cos\theta_1 = \sqrt{1 - (a/A)^2}$:

$$
N(A) = \frac{2k}{\pi}\left(\arcsin\frac{a}{A} + \frac{a}{A}\sqrt{1 - \left(\frac{a}{A}\right)^2}\right), \qquad A \gt a .
$$

**Sanity checks.** At $A = a$, $\arcsin 1 = \pi/2$ and the square root is $0$, so $N = k$: it joins the linear value smoothly. For huge $A$, $\arcsin(a/A) \approx a/A$ and the root is about $1$, so $N \approx 4ka/(\pi A)$ — a relay with $M = ka$, as it should be when the linear part is too narrow to matter. And a direct numerical Fourier integral agrees with the formula to about $10^{-9}$ for a test case ($k = 37$, $a = 0.6$, $A = 2.3$).

This is the saturation that lesson 8 used for the boundary layer, now asked a different question: not "what does removing chattering cost?" but "does it, on its own, ring?"

::: example A relay drives the loop into a limit cycle
**The plant.** A torque goes through two matched lags of time constant $\tau = 1\,\mathrm{s}$ ("tau": actuator response and a rate filter), then one integration through inertia $J = 100\,\mathrm{kg\,m^2}$ to angular rate:

$$
L(s) = \frac{1}{Js(1 + \tau s)^2} .
$$

**Step 1: the frequency.** The integrator contributes $-90^\circ$ of phase. Each lag contributes $-\arctan(\omega\tau)$. The total reaches $-180^\circ$ when $2\arctan(\omega\tau) = 90^\circ$, that is $\omega\tau = 1$. So $\omega_0 = 1/\tau = 1\,\mathrm{rad/s}$, whatever $J$ is.

**Step 2: where it crosses.** At $\omega_0 = 1/\tau$, $(1 + j)^2 = 2j$, so $L(j\omega_0) = 1/(Jj\omega_0\cdot 2j) = -1/(2J\omega_0) = -\tau/(2J) = -1/200 = -0.005$.

**Step 3: the amplitude.** Relay $M = 5\,\mathrm{N\,m}$. Set $-1/N(A) = -\pi A/(4M)$ equal to $-0.005$ and solve for $A$:

$$
A = \frac{2M\tau}{\pi J} = \frac{2(5)(1)}{\pi(100)} = 0.031831\,\mathrm{rad/s}, \qquad \omega_0 = 1\,\mathrm{rad/s}\ (\text{period } 2\pi/\omega_0 = 6.2832\,\mathrm{s}) .
$$

**Step 4: fly it.** Simulate the real loop — relay in negative feedback around $L(s)$ — at $\Delta t = 1\,\mathrm{ms}$. From three starting rates spread over four orders of magnitude ($10^{-4}$, $10^{-2}$ and $1\,\mathrm{rad/s}$), the rate settles into the same steady oscillation: amplitude $0.032918\,\mathrm{rad/s}$, period $6.424\,\mathrm{s}$.

**How good is that?** $0.032918/0.031831 = 1.034$: $3.4\%$ high in amplitude. $6.424/6.2832 = 1.022$: $2.2\%$ high in period. For a method that keeps one harmonic, that is a good prediction, and it came from three lines of algebra instead of a simulation campaign. The same answer from every start also says the cycle attracts, as the gain test predicts: $N(A) = 4M/(\pi A)$ falls as $A$ grows.
:::

::: example The same plant with a saturating actuator
**The prediction.** Same $L(s)$, so the same $\omega_0 = 1\,\mathrm{rad/s}$ — it belongs to $L$ alone. Use saturation with slope $k = 250\,\mathrm{N\,m\,s/rad}$ up to $a = 0.02\,\mathrm{rad/s}$, so the torque tops out at $ka = 5\,\mathrm{N\,m}$, the same as the relay. The loop is on the edge when $N(A) = 1/\lvert L(j\omega_0)\rvert = 2J/\tau = 200$. Since $k = 250 \gt 200$, the swing must be big enough to saturate. Solving $N(A) = 200$ by bisection on the closed form gives $A = 0.029110\,\mathrm{rad/s}$, about $1.46$ times $a$.

**Fly it from a large start.** The loop settles at amplitude $0.029283\,\mathrm{rad/s}$, period $6.3055\,\mathrm{s}$: $0.6\%$ high in amplitude and $0.4\%$ high in period. Better than the relay, because a clipped sine is closer to a sine than a square wave is, so less of its energy sits in the harmonics the method throws away.

**Fly it from a tiny start.** Start at $0.0005\,\mathrm{rad/s}$, a sixtieth of the predicted swing. Now the loop takes a long time to get there, and a simulation cut short looks like a disagreement. Inside the linear region the actuator is the gain $u = -ky$, so the closed loop's characteristic polynomial is $Js(1 + s)^2 + k = 0$. Divide by $J = 100$:

$$
s^3 + 2s^2 + s + 2.5 = 0 ,
$$

with roots $-2.0929$ and $0.0465 \pm 1.0919j$. The complex pair has a **positive** real part: the small-signal loop is itself unstable. It grows with an **[[e-folding time|e-folding]]** of $1/0.0465 \approx 21.5\,\mathrm{s}$. Measuring the biggest $\lvert y\rvert$ in the seven seconds before each time:

| $t$ (s) | 20 | 40 | 60 | 80 | 100 | 150 |
| --- | --- | --- | --- | --- | --- | --- |
| peak $\lvert y\rvert$ (rad/s) | 0.000991 | 0.002527 | 0.006442 | 0.016423 | 0.028873 | 0.029283 |

From $t = 20$ to $t = 40\,\mathrm{s}$ the peak grows by $0.002527/0.000991 = 2.550$. Solve $e^{20r} = 2.550$: $r = \ln(2.550)/20 = 0.0468\,\mathrm{s^{-1}}$, against the root's $0.0465$. Then the swing reaches the predicted size and stays.

**What it means.** The slow start does not contradict the prediction. It is the same prediction seen before it has finished. Stopped at $30\,\mathrm{s}$, this run would show a loop barely moving at a thousandth of a radian per second, and someone might conclude there is no limit cycle. The describing function names the destination; it says nothing about the journey.
:::

## When the prediction is trustworthy

Two checks, both visible in the examples.

**First: are the harmonics really filtered?** Relay and saturation are odd — flip the input and the output flips — so their outputs have no even harmonics, only the 3rd, 5th and so on. The one to worry about is the third. A square wave's third harmonic is $1/3$ the size of its fundamental. The clipped sine in the saturation example has a third harmonic $0.140$ times its fundamental. Now look at the plant: $\lvert L(j\omega)\rvert = 1/\big(J\omega(1 + \omega^2\tau^2)\big)$, which is $0.005$ at $\omega_0$ and $1/3000 \approx 0.000333$ at $3\omega_0$ — fifteen times smaller. So after the plant, the relay's third harmonic is about $1/45$ of the fundamental, and saturation's about $1/107$. That is why both predictions landed within a few percent, and why saturation did better.

**Second: is the crossing an attracting cycle?** Use the gain test. For the saturation loop, small swings have gain $k = 250$, above the critical $200$, so they grow — exactly the positive-real-part roots. Big swings have $N(A) \lt 200$ and shrink, which is what the large start did. Both sides push toward $A = 0.0291$. That is evidence, not an assumption, that this crossing is the cycle the loop settles into.

::: warning
Take away the lags and drive a bare double integrator with a relay: $L(s) = 1/(Js^2)$, output the angle. Now $L(j\omega) = -1/(J\omega^2)$ lies on the negative real axis at *every* frequency, and $-1/N(A)$ covers that same axis. The two curves overlap instead of crossing, so there is a solution for every amplitude: $\omega = \sqrt{4M/(\pi AJ)}$. The method predicts no single limit cycle but a whole family of oscillations — and that is what the real system does. With no lag and no friction, the relay makes a frictionless "V-shaped valley": the angle swings back and forth at whatever size it started with, never growing or shrinking. The exact period is $4\sqrt{2AJ/M}$; the describing-function period $\pi\sqrt{\pi AJ/M}$ is $1.6\%$ short of it. It takes an actuator or sensor lag — never absent on real hardware — to pick out one isolated, predictable ring, which is the mechanism behind both examples.
:::

## Check yourself

::: check
Why does the describing function of an ideal relay get smaller as the input amplitude $A$ grows, when the relay's output $M$ never changes?
:::

::: answer
$N(A) = b_1/A$ compares the fundamental of a *fixed-height* square wave with an input amplitude that keeps growing.

The square wave's fundamental, $b_1 = 4M/\pi$, does not depend on $A$ at all. The relay only knows the input's sign, not its size. So as $A$ grows, the same $b_1$ is divided by a bigger number. A relay acts like an automatic gain reducer: weaker, relative to the input, at large amplitudes. That falling gain is also what makes the relay's limit cycle attracting.
:::

::: check
The relay example predicted the oscillation frequency without using the relay amplitude $M$. Explain why, and say what $M$ *did* decide.
:::

::: answer
The frequency comes from where $L(j\omega)$ crosses the negative real axis, $\omega_0 = 1/\tau$ here — a fact about the plant's phase alone. $N(A)$ is real for every amplitude, so it adds no phase and cannot move that crossing.

$M$ enters only the amplitude equation, $-\pi A/(4M) = L(j\omega_0)$, which you solve after $\omega_0$ is known. It gives $A = 2M\tau/(\pi J)$, proportional to $M$: double the relay's torque and the ring doubles in size, at the same frequency. Change $\tau$, or add another lag, and the frequency itself moves.
:::

::: check
A colleague notes the saturation prediction was $0.6\%$ off while the relay's was $3.4\%$ off, and concludes the describing function method is "more accurate for saturation" in general. Is that the right lesson?
:::

::: answer
No. It is more accurate for *this pairing* of nonlinearity and plant, for a reason you can name.

A clipped sine is closer to a pure sine than a square wave is: its third harmonic is $0.14$ of the fundamental here, against $0.33$ for the relay. So less energy sits in what the method throws away, and the plant's filtering has less work to do.

The comparison that matters is not relay against saturation in general. It is how strongly *this* $L(j\omega)$ damps the harmonics of *this* nonlinearity's output. A saturation that is driven far into its flat part looks almost like a relay, and a plant with a resonance near $3\omega_0$ could spoil either prediction. Check that ratio on every new plant.
:::

::: check
For $L(s) = 1/[Js(1 + \tau s)^2]$, if $\tau$ were doubled with $J$ unchanged, what happens to the predicted limit-cycle frequency and amplitude with the same relay?
:::

::: answer
**Frequency.** The crossing is at $\omega_0 = 1/\tau$, so doubling $\tau$ halves it, to $0.5\,\mathrm{rad/s}$.

**Amplitude.** Do the algebra instead of assuming the crossing point stays put. At $\omega_0 = 1/\tau$, the two lags give $(1 + j)^2 = 2j$, so $L(j\omega_0) = 1/(Jj\omega_0\cdot 2j) = -1/(2J\omega_0) = -\tau/(2J)$ — proportional to $\tau$. Put that into $-\pi A/(4M) = L(j\omega_0)$: $A = 2M\tau/(\pi J)$. Doubling $\tau$ **doubles** the amplitude, from $0.031831$ to $0.063662\,\mathrm{rad/s}$.

**Check by simulation.** The doubled-$\tau$ loop settles at $0.065842\,\mathrm{rad/s}$ with a period of $12.85\,\mathrm{s}$: the same $3.4\%$ high as before, and about twice the $6.42\,\mathrm{s}$ period.

A slower actuator or filter on this plant buys a slower ring *and* a bigger one. You pay twice for the lag.
:::

::: check
The saturation example took about two minutes of simulated time to reach its predicted amplitude from a tiny start, while the describing-function calculation took a few lines. What does that tell you about using a simulation to certify that a design is *free* of limit cycles?
:::

::: answer
It says a short test that shows no oscillation is weak evidence of safety when the small-signal loop is unstable with a small growth rate. The ring may not have had time to appear.

To certify, check the *linearized* loop's roots using the nonlinearity's small-signal gain — here, $k = 250$ gave roots with real part $+0.0465$ — and check where $L(j\omega)$ meets $-1/N(A)$. Do not rely only on watching a simulation. A system can pass a ten-second test while riding a two-minute exponential toward the amplitude this method would have predicted directly.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $N(A) = (b_1+ja_1)/A$ | Describing function: fundamental-harmonic gain to a sinusoid of amplitude $A$ |
| $a_1=0$ | True for memoryless nonlinearities (relay, saturation, dead zone); hysteresis makes $N$ complex |
| $L(j\omega) = -1/N(A)$ | Limit-cycle condition; the crossing gives the predicted frequency and amplitude |
| Real $N(A)$ | Predicted frequency depends on $L(j\omega)$ alone |
| $N(A)$ falling through the critical gain | Stable (attracting) limit cycle; rising means it repels |
| $N(A) = 4M/(\pi A)$ | Ideal relay, output $\pm M$ |
| $N(A) = \tfrac{2k}{\pi}\left(\arcsin\tfrac{a}{A}+\tfrac{a}{A}\sqrt{1-(a/A)^2}\right)$ | Saturation, slope $k$ to $\pm a$; $N(A)=k$ for $A\le a$ |
| $L(s)=1/[Js(1+\tau s)^2]$, $\omega_0=1/\tau$ | Crossing at $-\tau/(2J)$, frequency independent of $J$ |
| Relay, $M=5$, $J=100$, $\tau = 1$ | $A=0.03183$ predicted against $0.03292$ simulated ($3.4\%$) |
| Saturation, $k=250$, $a=0.02$ | $A=0.02911$ predicted against $0.02928$ simulated ($0.6\%$) |
| Small-signal roots of the linearized loop | Positive real part: the loop is pushed toward the predicted amplitude, possibly slowly |
| Relay on a bare $1/(Js^2)$ | A continuous family of oscillations, not one limit cycle; a lag picks one out |

Describing functions treat the nonlinearity as fixed and ask what loop around it produces a ring. The next lesson asks a different question: when the actuators give fewer independent channels than the vehicle has degrees of freedom, what can you reach at all?

::: context backlash Backlash
Gears never mesh perfectly. There is a little gap between the teeth, so when a motor reverses direction it turns a small angle before the teeth on the other side engage and the output moves. That dead play is **backlash**.

You can feel it on an old bicycle's pedals or a worn steering wheel: a bit of free movement before anything happens. In a pointing mechanism it acts like a small delay plus a jump every time the motion reverses — exactly the kind of nonlinearity that can make a loop hunt back and forth in a steady limit cycle.
:::

::: context df-history Where the method came from
The describing function grew up in the late 1940s, when engineers needed to analyze servos driven by relays, on-off contactors and gears with play — hardware no linear theory could handle. Arnold Tustin in Britain used it on backlash, and Ralph Kochenburger in the United States on relay servos; related work appeared in the Soviet Union at about the same time.

Its appeal was, and still is, that it reuses the frequency-response tools every control engineer already knows. The price is the one-harmonic approximation this lesson keeps warning about.
:::

::: context schmitt-bridge Where this goes next
A Schmitt trigger is a relay with hysteresis: it switches on at one level and off at a lower one. Spacecraft use it to decide when to fire an on-off thruster, so that a noisy attitude error does not make the valves flicker.

Because of its hysteresis, its describing function is complex, not real, and the predicted ring no longer sits at the plant's phase crossover. Lesson 14 works out that complex describing function, and shows how the hysteresis band sets the size of the slow back-and-forth drift that thruster-controlled spacecraft live with: the attitude limit cycle.
:::

::: context fourier-picture A square wave built from sines
A square wave of height $M$ is a sum of sines at odd multiples of its frequency: $\tfrac{4M}{\pi}\left(\sin\theta + \tfrac13\sin 3\theta + \tfrac15\sin 5\theta + \cdots\right)$. The describing function keeps only the first term.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="85" x2="340" y2="85" stroke="#6c7a93" stroke-width="1"/>
  <polyline fill="none" stroke="#1f2a44" stroke-width="2" points="20,85 20,45 180,45 180,125 340,125 340,85"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="20.0,85.0 28.0,77.0 36.0,69.3 44.0,61.9 52.0,55.1 60.0,49.0 68.0,43.8 76.0,39.6 84.0,36.6 92.0,34.7 100.0,34.1 108.0,34.7 116.0,36.6 124.0,39.6 132.0,43.8 140.0,49.0 148.0,55.1 156.0,61.9 164.0,69.3 172.0,77.0 180.0,85.0 188.0,93.0 196.0,100.7 204.0,108.1 212.0,114.9 220.0,121.0 228.0,126.2 236.0,130.4 244.0,133.4 252.0,135.3 260.0,135.9 268.0,135.3 276.0,133.4 284.0,130.4 292.0,126.2 300.0,121.0 308.0,114.9 316.0,108.1 324.0,100.7 332.0,93.0 340.0,85.0"/>
  <text x="100" y="22" font-size="11" text-anchor="middle" fill="#1f2a44">square wave, height M</text>
  <text x="258" y="160" font-size="11" text-anchor="middle" fill="#1d6fd1">fundamental, height 4M/π ≈ 1.27M</text>
</svg>
```

The fundamental is taller than the square wave itself, by $4/\pi \approx 1.27$. That is why the relay's describing function has $4M/\pi$ in it rather than $M$.
:::

::: context nonlinearity-shapes Three common nonlinearities
Each picture plots output (up) against input (across).

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <g stroke="#6c7a93" stroke-width="1">
    <line x1="15" y1="60" x2="105" y2="60"/><line x1="60" y1="15" x2="60" y2="105"/>
    <line x1="135" y1="60" x2="225" y2="60"/><line x1="180" y1="15" x2="180" y2="105"/>
    <line x1="255" y1="60" x2="345" y2="60"/><line x1="300" y1="15" x2="300" y2="105"/>
  </g>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="15,90 60,90 60,30 105,30"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="135,90 160,90 200,30 225,30"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="255,90 280,60 320,60 345,30"/>
  <text x="60" y="128" font-size="12" text-anchor="middle" fill="#1f2a44">relay</text>
  <text x="180" y="128" font-size="12" text-anchor="middle" fill="#1f2a44">saturation</text>
  <text x="300" y="128" font-size="12" text-anchor="middle" fill="#1f2a44">dead zone</text>
</svg>
```

A **dead zone** ignores small inputs entirely — like a thruster that will not fire for a command below its minimum pulse. All three are memoryless and odd, so all three have real describing functions.
:::

::: context nyquist-picture The two curves, drawn
The blue curve is $L(j\omega)$ for the example plant, drawn to scale, with frequency rising toward the origin. The red line is $-1/N(A)$ for the relay, moving left as $A$ grows. They meet at $-0.005$, at $\omega = 1\,\mathrm{rad/s}$ and $A = 0.0318\,\mathrm{rad/s}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="10" y1="40" x2="350" y2="40" stroke="#6c7a93" stroke-width="1"/>
  <line x1="320" y1="10" x2="320" y2="190" stroke="#6c7a93" stroke-width="1"/>
  <line x1="316" y1="40" x2="30" y2="40" stroke="#b4232c" stroke-width="3"/>
  <polygon points="20,40 32,34 32,46" fill="#b4232c"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="146.1,146.6 157.8,126.5 169.0,109.6 179.7,95.5 189.9,83.5 199.5,73.5 208.5,65.1 216.9,58.1 224.7,52.2 232.0,47.3 238.8,43.3 245.0,40.0 252.1,36.7 264.7,32.1 274.8,29.6 282.9,28.5 289.4,28.1 294.7,28.3 298.9,28.8 302.4,29.4 305.2,30.1 307.5,30.8 309.4,31.5 310.9,32.2 312.2,32.8 313.3,33.4 314.2,33.9 314.9,34.4 315.6,34.9 316.1,35.3 316.6,35.7 317.0,36.0 319.0,38.1 319.8,39.4 320.0,39.9 320.0,40.0"/>
  <circle cx="245" cy="40" r="5" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <line x1="245" y1="36" x2="245" y2="44" stroke="#1f2a44"/>
  <line x1="170" y1="36" x2="170" y2="44" stroke="#1f2a44"/>
  <line x1="95" y1="36" x2="95" y2="44" stroke="#1f2a44"/>
  <text x="245" y="62" font-size="11" text-anchor="middle" fill="#1f2a44">−0.005</text>
  <text x="170" y="30" font-size="11" text-anchor="middle" fill="#1f2a44">−0.010</text>
  <text x="95" y="30" font-size="11" text-anchor="middle" fill="#1f2a44">−0.015</text>
  <text x="326" y="54" font-size="11" fill="#1f2a44">0</text>
  <text x="40" y="60" font-size="11" fill="#b4232c">−1/N(A), A growing</text>
  <text x="160" y="170" font-size="11" fill="#1d6fd1">L(jω), ω rising →</text>
</svg>
```

For saturation the red line would start at $-1/k = -0.004$ instead of at $0$, because a small swing sees the full slope $k$.
:::

::: context stable-cycle Stable and unstable rings
Picture a round groove cut into a tabletop, with a marble rolling around it. Nudge the marble toward the center or toward the edge and it slides back into the groove. That is a **stable** limit cycle: nearby motions are drawn onto it.

Now picture a round ridge instead. A marble could circle along the top only if it were placed exactly there; the smallest nudge sends it off one side or the other. That is an **unstable** limit cycle. You never see one in a test, but it marks a boundary: disturbances smaller than it die away, and bigger ones do not. The describing function finds both kinds, which is why the gain test matters.
:::

::: context e-folding What "e-folding time" means
Anything that grows like $e^{rt}$ multiplies by $e \approx 2.718$ every $1/r$ seconds. That time is the **e-folding time**. It is the growth version of a time constant.

Here $r = 0.0465\,\mathrm{s^{-1}}$ gives $21.5\,\mathrm{s}$. Going from $0.0005$ to about $0.029\,\mathrm{rad/s}$ is a factor of about $58$, which is $\ln 58 \approx 4.1$ e-foldings, or about $87\,\mathrm{s}$ — about when the table shows the swing arriving. After that, saturation stops the growth.
:::
