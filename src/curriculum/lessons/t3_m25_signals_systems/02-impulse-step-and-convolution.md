---
id: l02-impulse-step-and-convolution
title: Impulse response, step response and convolution
minutes: 21
covers:
  - "Impulse response, step response, and convolution"
---

Tap a bell once with a hammer and listen. The ring you hear — loud at first, then fading — is the bell's whole personality in one sound. If you know that ring exactly, you can predict what the bell does when you tap it twice, or hit it softly, or run a stick along it. Every more complicated strike is a crowd of little taps, and the bell answers each tap with the same ring.

Lesson 1 promised that superposition reduces an LTI system to a single experiment. This lesson collects the payment. The experiment is a sharp tap, an **impulse**. The system's answer to it is the **impulse response**, written $h(t)$ ("h of t"). The rule that turns $h$ into the response to any other input is called **convolution**. Every time-domain simulation you will ever run is doing convolution, whether it says so or not.

On a real vehicle you rarely get to apply a perfect tap. What a test engineer actually commands is a **step**: move the nozzle $1^\circ$ and hold it there for two seconds, or switch a wheel torque on and leave it on. So the **step response** — written $s(t)$ here, the output after a sudden switch-on — is what gets measured, and the impulse response is worked out from it. The two carry exactly the same information. The step response is what specifications talk about (rise time, overshoot, settling time). The impulse response is what the mathematics talks about. You need both.

Module 8 introduced $h(t)$, the convolution integral, and the fact that convolution in time is multiplication in $s$. This lesson goes further in the directions a control engineer needs: what you can read off $h$ and $s$ at a glance, how convolution behaves (its rules turn out to be block-diagram algebra in disguise), and how to compute it on sampled data without the two mistakes people actually make.

## The impulse, step and ramp family

Three test inputs. Each is the running total (the integral) of the one before it.

- The **unit impulse** $\delta(t)$ ("delta of t"): an idealized spike of zero width, enormous height and **area exactly one**. Think of a hammer tap that is over before you can see it.
- The **unit step** $1(t)$ ("one of t"): zero before $t = 0$, one from then on. A switch flipped on.
- The **unit ramp** $t\,1(t)$: zero before $t = 0$, then rising steadily with slope one. A dial turned at a constant rate.

$$
\delta(t) \ \xrightarrow{\ \int\ }\ 1(t) \ \xrightarrow{\ \int\ }\ t\,1(t).
$$

What matters about an impulse is its **[[area, not its height|impulse-area]]**. Its defining rule is the **sifting property**:

$$
\int_{-\infty}^{\infty}f(\tau)\,\delta(\tau - a)\,d\tau = f(a).
$$

In words: an impulse at time $a$, multiplied into any smooth signal and integrated, picks out the value of that signal at $a$ and throws the rest away. Mathematicians call $\delta$ the **[[Dirac delta|dirac]]**.

Call the responses to these three inputs $h(t)$, $s(t)$ and $r(t)$. The system is linear, and integrating is a linear operation, so it makes no difference whether you integrate before the system or after it. The responses therefore inherit the same family relationship:

$$
s(t) = \int_0^t h(\tau)\,d\tau, \qquad h(t) = \frac{ds}{dt}, \qquad r(t) = \int_0^t s(\tau)\,d\tau.
$$

In the Laplace world, integrating is dividing by $s$: $\mathcal{L}\{h\} = G(s)$, $\mathcal{L}\{s\} = G(s)/s$, and $\mathcal{L}\{r\} = G(s)/s^2$. (Two different things share the letter $s$ here: the step response $s(t)$ and the Laplace variable $s$. Context always tells them apart.)

Three facts you should be able to state without thinking:

- **Where the step response ends up is the DC gain** — the system's gain for a steady, unchanging input. For a stable system, $s(\infty) = \int_0^\infty h\,dt = G(0)$. A step response that settles at $0.909$ tells you $G(0) = 0.909$ with no further work.
- **The step response's starting slope is $h(0^+)$** — the value of $h$ a hair after zero. For a system of **relative degree** one (denominator degree minus numerator degree equals one), such as the first-order lag $a/(s + a)$, $h(0^+) = a$ and the step response leaves the origin with slope $a$. For relative degree two or more, $h(0^+) = 0$ and the step response leaves the origin flat.
- **The step response's first peak is where $h$ first crosses zero**, because $\dot{s} = h$, and a peak is where the slope is zero.

::: warning An impulse is measured by its area
A thruster firing $0.5\,\mathrm{N}$ for $20\,\mathrm{ms}$ is close to an impulse of area $0.5 \times 0.02 = 0.01\,\mathrm{N\,s}$. The response is $0.01\,h(t)$, not $0.5\,h(t)$. That is why $h$ carries units of output per unit of (input $\times$ second). For a unit-gain actuator, output and input have the same units, so $h$ comes out in $\mathrm{s^{-1}}$ — the extra "per second" is there because the impulse's area carries a second. Getting this wrong by a factor of the pulse width is the most common unit error in this subject.
:::

## Convolution, and what it does to signals

Here is the rule that turns $h$ into the response to anything. Starting from rest,

$$
y(t) = (h * u)(t) = \int_0^t h(\tau)\,u(t - \tau)\,d\tau = \int_0^t h(t - \tau)\,u(\tau)\,d\tau.
$$

Read $h * u$ as "h convolved with u". The star is not multiplication.

**How to sketch one by hand** (use the second form). Take $h$. Flip it left-to-right. Slide it right until its front edge sits at time $t$. Multiply it point by point against $u$. Find the area under the product. That area is $y(t)$ — one number. Now slide a little further and do it again. The output is that area, traced out as the flipped copy slides. Flip, slide, multiply, add up — the note on [[the sliding window|flip-slide]] shows it.

**How to think about it** (use the first form). $h(\tau)$ is how much weight the system still gives to input that arrived $\tau$ seconds ago. It is the system's **[[memory|memory]]**. A first-order lag with $h = ae^{-a\tau}$ forgets exponentially, with time constant $1/a$. An integrator, with $h = 1$, remembers everything equally, forever.

Convolution follows four rules. Each one is a fact about block diagrams:

| Rule | Statement | What it means in a diagram |
| --- | --- | --- |
| Commutative | $h * u = u * h$ | two blocks in a row may be written in either order |
| Associative | $(h_1 * h_2) * u = h_1 * (h_2 * u)$ | a chain of blocks has one combined impulse response, $h_1 * h_2$ |
| Distributive | $(h_1 + h_2) * u = h_1 * u + h_2 * u$ | side-by-side paths add |
| Identity | $h * \delta = h$ | a plain wire is $\delta(t)$, whose transform is 1 |

It also follows two rules about shapes.

- **Widths add.** Convolve a signal lasting $T_1$ with one lasting $T_2$ and the result lasts $T_1 + T_2$.
- **Areas multiply.** $\int(h * u) = \left(\int h\right)\left(\int u\right)$. This is $Y = GU$ at $s = 0$.

For example, convolve a $0.2\,\mathrm{s}$ rectangle of height 1 with another one. You get a [[triangle|rect-triangle]] with base $0.2 + 0.2 = 0.4\,\mathrm{s}$ and peak $0.2$. Its area is $\tfrac{1}{2}(0.4)(0.2) = 0.04$, which equals $0.2 \times 0.2$, the product of the two input areas. Both rules check out.

Convolution also **smooths**. The output is at least as smooth as the smoother of the two signals. That is why a lag turns a step into a rounded curve, and why a step command sent through an actuator never arrives as a step.

Finally, stability in this language. A system is **[[BIBO stable|bibo]]** — every bounded input gives a bounded output — exactly when $\int_0^\infty|h(t)|\,dt$ is finite. An integrator, $h = 1$, fails. So does any $h$ with a mode that grows or never dies away.

::: note Why it has to be true
**The bound.** If the input never exceeds $U$ in size, then $|y(t)| = \left|\int_0^t h(\tau)u(t - \tau)\,d\tau\right| \le \int_0^t |h(\tau)|\,U\,d\tau \le U\int_0^\infty|h|\,d\tau$. So a finite $\int|h|$ keeps every bounded input's output bounded.

**The other direction.** Choose the input to be $+1$ wherever $h(t - \tau)$ is positive and $-1$ wherever it is negative. Then every piece of the integral adds up with the same sign, and $y(t)$ equals $\int_0^t|h|$. If that grows without limit, so does the output — from an input that never exceeded 1.
:::

::: key
$h(t) = \mathcal{L}^{-1}\{G(s)\}$; $s(t) = \int_0^t h$, so $h = \dot{s}$ and $s(\infty) = G(0)$. Zero-state response to any input: $y = h * u = \int_0^t h(\tau)u(t - \tau)\,d\tau$, equivalently $Y(s) = G(s)U(s)$. Convolution is commutative, associative and distributive; widths add, areas multiply. BIBO stable $\iff \int_0^\infty|h|\,dt < \infty$.
:::

::: example Building a TVC actuator's step response by convolution
A **thrust-vector-control (TVC)** actuator swings the engine nozzle. This one is specified as a second-order system with a $10\,\mathrm{Hz}$ natural frequency and damping $\zeta = 0.7$. Work out the pieces:

- natural frequency: $\omega_n = 2\pi(10) = 62.83\,\mathrm{rad/s}$;
- decay rate: $\sigma = \zeta\omega_n = 0.7 \times 62.83 = 43.98\,\mathrm{s^{-1}}$;
- ringing frequency: $\omega_d = \omega_n\sqrt{1 - \zeta^2} = 62.83 \times 0.7141 = 44.87\,\mathrm{rad/s}$.

Its impulse response is

$$
h(t) = \frac{\omega_n}{\sqrt{1 - \zeta^2}}e^{-\sigma t}\sin\omega_d t = 87.98\,e^{-43.98t}\sin(44.87t)\ \mathrm{s^{-1}}.
$$

**Peak of $h$.** It peaks where $\dot{h} = 0$, which works out to $\tan\omega_d t = \omega_d/\sigma$. So $t = \arctan(44.87/43.98)/44.87 = 17.7\,\mathrm{ms}$, where $h = 28.81\,\mathrm{s^{-1}}$. A $1^\circ$ command pulse lasting $2\,\mathrm{ms}$ has area $0.002\,\mathrm{deg\,s}$, so it moves the nozzle a peak of $0.002 \times 28.81 = 0.058^\circ$. Small, as a two-millisecond blip should be.

**Step response by convolution.** Convolve $h$ with a unit step. With $u = 1$ the integral is the running area under $h$. Do it numerically (midpoint rule, $\Delta\tau = 1\,\mathrm{\mu s}$) and compare with the closed form $s(t) = 1 - e^{-\sigma t}(\cos\omega_d t + 0.9802\sin\omega_d t)$:

| $t$ | $\int_0^t h\,d\tau$ | closed form |
| --- | --- | --- |
| $10\,\mathrm{ms}$ | $0.145715$ | $0.145715$ |
| $20\,\mathrm{ms}$ | $0.423302$ | $0.423302$ |
| $70.01\,\mathrm{ms}$ | $1.045988$ | $1.045988$ |
| $200\,\mathrm{ms}$ | $1.000072$ | $1.000072$ |

They agree to better than one part in a hundred million.

**Reading the result.** The step response peaks at $t_p = \pi/\omega_d = 70.0\,\mathrm{ms}$ with value $1.04599$, an overshoot of 4.60%. That equals $e^{-\pi\zeta/\sqrt{1 - \zeta^2}}$ to three figures, the formula lesson 5 derives.

**Checks.** The area under $h$ is $\int_0^1 h\,dt = 1.00000000$, confirming $G(0) = 1$, as it must be for an actuator that goes where it is told. The area under $|h|$ is $\int_0^2|h|\,dt = 1.096$: finite, so the actuator is BIBO stable. The extra $0.096$ is the ringing that changes sign. The 2% settling time is $4/\sigma = 4/43.98 = 91\,\mathrm{ms}$. So this actuator has arrived within a tenth of a second — which is what a launch-vehicle controller cares about, because an attitude loop crossing over near $1\,\mathrm{rad/s}$ must not feel actuator dynamics.
:::

## Convolution on sampled data

A computer does not integrate smoothly. It works with numbers taken at fixed intervals of $\Delta t$ ("delta t"). There are two practical ways to convolve.

**From the impulse response.** With $h$ and $u$ both sampled every $\Delta t$, write $h[k]$ for the $k$-th sample. The causal discrete convolution is

$$
y[n] \approx \Delta t\sum_{k=0}^{n} h[k]\,u[n - k].
$$

The sum runs from $0$ to $n$ only, because a real system cannot respond to input that has not happened yet. That is what **causal** means. This one line is the whole of a linear simulation.

**From the step response.** Suppose what you have is a *measured* step response, and the input is a staircase — as it is out of any flight computer, which holds each command constant until the next update (a **[[zero-order hold|zero-order-hold]]**). Write the staircase as a pile of steps. At each time $t_k$ the command jumps by $\Delta u_k = u_k - u_{k-1}$. Each jump gets its own copy of the step response, starting at $t_k$ and scaled by the jump. Add them up:

$$
y(t) = \sum_{k\,:\,t_k \le t} \Delta u_k\,s(t - t_k).
$$

This is **[[Duhamel's form|duhamel]]**. It is exact for a staircase input. It needs no impulse response, and no differentiating of noisy test data. It is the cheapest honest way to push a command profile through a system whose step response you measured on a test stand.

::: example A commanded staircase through a measured lag
A gimbal command is held at $2^\circ$ for $0.5\,\mathrm{s}$, then $1^\circ$ for $0.5\,\mathrm{s}$, then $0^\circ$. The actuator's measured step response fits a first-order lag with time constant $\tau = 0.25\,\mathrm{s}$: $s(t) = 1 - e^{-t/\tau}$.

**Step 1: break the staircase into jumps.** Up $2^\circ$ at $t = 0$. Down $1^\circ$ at $t = 0.5\,\mathrm{s}$. Down $1^\circ$ at $t = 1.0\,\mathrm{s}$. (Check: $2 - 1 - 1 = 0$, the final command.)

**Step 2: add up the scaled, delayed step responses.** At $t = 0.75\,\mathrm{s}$, the first jump has been running for $0.75\,\mathrm{s}$ ($3\tau$) and the second for $0.25\,\mathrm{s}$ ($1\tau$). The third has not happened yet. So

$$
y(0.75) = 2\left(1 - e^{-3}\right) - 1\left(1 - e^{-1}\right) = 1.9004 - 0.6321 = 1.2683^\circ .
$$

**Step 3: repeat at other times.** $y(0.25) = 1.2642^\circ$, $y(0.5) = 1.7293^\circ$, $y(0.75) = 1.2683^\circ$, $y(1.0) = 1.0987^\circ$, $y(1.5) = 0.1487^\circ$, $y(2.0) = 0.0201^\circ$.

**What it says.** The nozzle never reaches the commanded $2^\circ$. It gets to $1.7293/2 = 86.5\%$ of it in the half second it is given — sensible, since half a second is only two time constants. And it is still $0.02^\circ$ from zero a full second after the command went back to zero. That leftover is what an attitude loop feels as actuator lag, and it is why lesson 8 treats a slow actuator as a time delay — a phase penalty — rather than a gain error.
:::

::: warning Two traps in numerical convolution
**Wrap-around.** The fast Fourier transform (FFT) convolves by multiplying spectra. But multiplying two finite FFTs performs **[[circular convolution|circular]]**: the tail of the answer wraps around and lands on top of the beginning. Pad both signals with zeros to at least the sum of their lengths before transforming, or the start of your simulation will be polluted by its end.

**Coarse steps.** The sum $\Delta t\sum h[k]u[n-k]$ is a rectangle rule. Its error shrinks only in proportion to $\Delta t$, and with a coarse $\Delta t$ it will quietly mis-scale a sharp impulse response. Shrink $\Delta t$ until the answer stops moving, or integrate the differential equation instead.
:::

::: example A reaction-wheel slew, straight from the convolution integral
A spacecraft with pitch inertia $I = 1200\,\mathrm{kg\,m^2}$ is turned by a **[[reaction wheel|reaction-wheel]]**. The wheel applies $+0.2\,\mathrm{N\,m}$ for $10\,\mathrm{s}$, nothing for $20\,\mathrm{s}$, then $-0.2\,\mathrm{N\,m}$ for $10\,\mathrm{s}$. From torque to attitude the spacecraft is a double integrator, $G(s) = 1/(Is^2)$: torque gives angular acceleration, which integrates to rate, which integrates to angle. Its impulse response is $h(t) = t/I$ — a tap leaves it turning at a steady rate, so the angle grows in a straight line.

No partial fractions needed. Convolve directly. During the first pulse, for $t$ up to $10\,\mathrm{s}$:

$$
\theta(t) = \int_0^t \frac{t - \tau}{I}(0.2)\,d\tau = \frac{0.2}{I}\cdot\frac{t^2}{2}.
$$

So $\theta(10) = 0.2 \times 100/(2 \times 1200) = 8.333\,\mathrm{mrad} = 0.4775^\circ$. The rate there is $0.2 \times 10/1200 = 1.667\,\mathrm{mrad/s} = 0.0955\,^\circ/\mathrm{s}$.

Through the coast the attitude climbs in a straight line: $\theta(20) = 25.0\,\mathrm{mrad} = 1.4324^\circ$ and $\theta(30) = 41.7\,\mathrm{mrad} = 2.3873^\circ$. The braking pulse then removes exactly the spin the first pulse added. For any $t \ge 40\,\mathrm{s}$ the first pulse contributes $\frac{0.2}{I}(10t - 50)$ and the braking pulse $-\frac{0.2}{I}(10t - 350)$, so

$$
\theta(t \ge 40) = \frac{0.2}{1200}\Bigl[(10t - 50) - (10t - 350)\Bigr] = \frac{0.2}{1200}(300) = 50.0\,\mathrm{mrad} = 2.865^\circ.
$$

The $t$ cancels, so the spacecraft stops and stays there.

**Two sanity checks from the rules.** The final rate is $\left(\int u\right)/I = 0$, because the torque profile has zero net area — areas multiply, and one of them is zero. And the attitude never comes back to zero: $h = t/I$ lasts forever, so widths add to infinity. The output only stops *changing* at $40\,\mathrm{s}$, because the net torque area is zero. That is why a double integrator never settles back on its own.

**The wheel.** At its peak the wheel stored $0.2 \times 10 = 2.0\,\mathrm{N\,m\,s}$ of angular momentum. Spinning at $2000\,\mathrm{rpm} = 209\,\mathrm{rad/s}$, that needs a rotor inertia of $2.0/209 = 9.55 \times 10^{-3}\,\mathrm{kg\,m^2}$.
:::

The same slew, done the way a simulation does it:

```python
import numpy as np

# Reaction-wheel torque profile on a spacecraft with I = 1200 kg m^2, convolved
# with the double integrator's impulse response h(t) = t / I.
I = 1200.0
dt = 0.02
t = np.arange(0.0, 60.0 + dt, dt)
u = np.where(t < 10.0, 0.2, np.where((t >= 30.0) & (t < 40.0), -0.2, 0.0))
h = t / I

y = np.convolve(u, h)[: t.size] * dt        # causal discrete convolution
for tq in (10.0, 20.0, 30.0, 40.0, 60.0):
    k = int(round(tq / dt))
    print(f"{tq:5.1f} s   {y[k]:.6f} rad   {np.degrees(y[k]):7.4f} deg")

#  10.0 s   0.008350 rad    0.4784 deg
#  20.0 s   0.025017 rad    1.4333 deg
#  30.0 s   0.041683 rad    2.3883 deg
#  40.0 s   0.050000 rad    2.8648 deg
#  60.0 s   0.050000 rad    2.8648 deg
```

The small excess at $10\,\mathrm{s}$ — $0.008350$ against the exact $0.008333$ — is the rectangle rule's error at $\Delta t = 20\,\mathrm{ms}$. Halve the step and the error roughly halves.

## Check yourself

::: check
A system's step response rises from zero with a starting slope of $8\,\mathrm{s^{-1}}$, overshoots to $1.18$ at $t = 0.4\,\mathrm{s}$, and settles at $0.8$. What do you know about $h(t)$, $G(0)$ and the relative degree?
:::

::: answer
Since $h = \dot{s}$, $h(0^+) = 8\,\mathrm{s^{-1}}$. That is not zero, and the response starts from zero rather than jumping, so the relative degree is exactly one.

$h$ is positive up to $t = 0.4\,\mathrm{s}$. It crosses zero there, because the first peak of $s$ is where $h$ first vanishes. Then it goes negative while the response falls back.

The DC gain is the final value: $G(0) = \int_0^\infty h\,dt = 0.8$.

Notice that $\int h = 0.8$ while $\int|h|$ is bigger: at least $1.18 + (1.18 - 0.8) = 1.56$, counting only the rise and the fall after the first peak. It is the second number that limits the response to a worst-case bounded input.
:::

::: check
Two identical first-order lags with $\tau = 0.1\,\mathrm{s}$ are connected in a row. Use the rules of convolution to say, without solving anything, what the pair's impulse response looks like at $t = 0$ and roughly how long it lasts.
:::

::: answer
By associativity, the pair's impulse response is $h_1 * h_2$. Each $h_i = 10e^{-10t}$ starts at $10\,\mathrm{s^{-1}}$ and has effectively died by $4\tau = 0.4\,\mathrm{s}$.

Convolution smooths, and widths add. So the combination starts at zero — at $t = 0$ the sliding copy overlaps the other over zero width, so the area is zero — and lasts roughly twice as long, about $0.8\,\mathrm{s}$. Areas multiply, so its area is $1 \times 1 = 1$ and the DC gain is still 1.

Working it out confirms the sketch: $h(t) = 100\,t\,e^{-10t}$, zero at the origin, peaking at $t = 0.1\,\mathrm{s}$.
:::

::: check
A micrometeoroid hits a spacecraft, delivering an angular impulse of $0.004\,\mathrm{N\,m\,s}$ about the pitch axis. The inertia is $1200\,\mathrm{kg\,m^2}$ and no control is active. What is the attitude error one minute later, and what does this say about $\int|h|$?
:::

::: answer
From torque to attitude, $h(t) = t/I$, so an impulse of area $\alpha$ gives $\theta = \alpha t/I$. The rate jumps to $\alpha/I = 0.004/1200 = 3.33\,\mathrm{\mu rad/s}$ and the attitude drifts in a straight line.

After $60\,\mathrm{s}$: $3.33 \times 10^{-6} \times 60 = 2.0 \times 10^{-4}\,\mathrm{rad} = 0.0115^\circ$. After an hour: $0.69^\circ$.

Since $h = t/I$ grows without limit, $\int_0^\infty|h|\,dt$ is infinite and the free spacecraft is not BIBO stable — a bounded torque can produce an unbounded attitude. That is the mathematical way of saying "a spacecraft will not hold its attitude by itself".
:::

::: check
You measured a step response on a test stand at $1\,\mathrm{kHz}$. You want the response to a command profile that the flight computer updates at $100\,\mathrm{Hz}$. Would you differentiate the measurement to get $h$ and convolve, or use the staircase form? Why?
:::

::: answer
Use the staircase form, $y(t) = \sum_k \Delta u_k\,s(t - t_k)$.

Differentiating a measured signal amplifies sensor noise, more and more at higher frequencies. A $1\,\mathrm{kHz}$ record differentiated numerically is mostly noise unless you filter it first — and filtering changes the very dynamics you were trying to capture.

The staircase form uses the measurement as recorded. It needs one value of $s$ per command update per output sample. And it is *exact* for a held command, which is what the flight computer actually produces. You only need $s$ at the delays $t - t_k$, so interpolating the $1\,\mathrm{kHz}$ record is enough.
:::

::: check
Explain why convolving a $0.2\,\mathrm{s}$ rectangular pulse of height 1 with itself gives a triangle, and state its base, peak and area from the rules alone.
:::

::: answer
Flip one rectangle and slide it across the other. When the shift is more than $0.2\,\mathrm{s}$ either way there is no overlap, so the result is zero. As the shift goes from $-0.2\,\mathrm{s}$ to zero, the overlap grows steadily to full. Then it shrinks steadily back. Steady rise, steady fall: a triangle.

Widths add, so the base is $0.2 + 0.2 = 0.4\,\mathrm{s}$. The peak is the full overlap area, $1 \times 0.2 = 0.2$. Areas multiply, so the total area is $0.2 \times 0.2 = 0.04$. Check with the triangle formula: $\tfrac{1}{2}(0.4)(0.2) = 0.04$.

This is also why a zero-order hold followed by another averaging stage smooths a command into something with a continuous slope.
:::

## Summary

| Item | Statement |
| --- | --- |
| Test inputs | $\delta(t)$, $1(t)$, $t\,1(t)$; each the integral of the one before |
| Responses | $h(t)$, $s(t) = \int_0^t h$, $r(t) = \int_0^t s$; $h = \dot{s}$ |
| Transforms | $\mathcal{L}\{h\} = G(s)$, $\mathcal{L}\{s\} = G(s)/s$, $\mathcal{L}\{r\} = G(s)/s^2$ |
| DC gain | $s(\infty) = \int_0^\infty h\,dt = G(0)$ |
| Starting slope | $\dot{s}(0^+) = h(0^+) = \lim_{s\to\infty}sG(s)$; zero if and only if relative degree $\ge 2$ |
| Convolution | $y = h * u = \int_0^t h(\tau)u(t - \tau)\,d\tau$; $Y(s) = G(s)U(s)$ |
| Algebra | commutative, associative (a chain is $h_1 * h_2$), distributive (parallel paths add), identity $\delta$ |
| Shapes | widths add; areas multiply; convolution smooths |
| BIBO stability | $\int_0^\infty|h(t)|\,dt < \infty$ |
| Sampled forms | $y[n] = \Delta t\sum_{k=0}^{n}h[k]u[n-k]$; staircase $y(t) = \sum_k \Delta u_k\,s(t - t_k)$ |

Both descriptions so far have been integrals. The next lesson swaps them for algebra: the Laplace transform turns the convolution integral into a product and the impulse response into the transfer function, and from there the whole module is polynomials.

::: context impulse-area Taller and thinner, same kick
Picture a push that is squeezed into less and less time but made harder to match. Each of these pulses has area 1, so each gives the same total kick:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 188" font-family="Inter, Arial, sans-serif">
  <line x1="15" y1="150" x2="345" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="40" y="120" width="48" height="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="64.0" y="166" font-size="11" fill="#1f2a44" text-anchor="middle">width 1, height 1</text>
  <text x="64.0" y="180" font-size="11" fill="#1d6fd1" text-anchor="middle">area 1</text>
  <rect x="160" y="90" width="24" height="60" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="172.0" y="166" font-size="11" fill="#1f2a44" text-anchor="middle">width 1/2, height 2</text>
  <text x="172.0" y="180" font-size="11" fill="#1d6fd1" text-anchor="middle">area 1</text>
  <rect x="280" y="30" width="12" height="120" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="286.0" y="166" font-size="11" fill="#1f2a44" text-anchor="middle">width 1/4, height 4</text>
  <text x="286.0" y="180" font-size="11" fill="#1d6fd1" text-anchor="middle">area 1</text>
</svg>
```

Keep going and the width heads to zero while the height heads to infinity. The limit is the impulse. What survives the squeeze is the area — which, for a force, is the change in momentum it delivers. That is why a sharp enough hammer tap and a longer, gentler push of the same area leave a slow system in the same state.
:::

::: context dirac A spike named for a physicist
The impulse is named for Paul Dirac, the British physicist who used it freely in his quantum mechanics of the late 1920s. Strictly, no ordinary function can be zero everywhere except one point and still have area one. Mathematicians later made the idea rigorous by treating $\delta$ as a "distribution" — something defined only by what it does inside an integral. The sifting property is exactly that definition. Engineers use it the way Dirac did, and it has never let them down.
:::

::: context flip-slide Flip, slide, multiply, add up
Here the input is a unit step (blue). The impulse response $h(\tau) = e^{-\tau}$ has been flipped and slid so its front edge sits at the current time $t = 2.5$ (red). The shaded area under their product is the output at that instant.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <path d="M60.0,133.4 L63.8,133.0 L67.7,132.5 L71.5,132.0 L75.4,131.5 L79.2,131.0 L83.1,130.4 L86.9,129.7 L90.8,129.0 L94.6,128.3 L98.5,127.5 L102.3,126.7 L106.2,125.8 L110.0,124.9 L113.8,123.9 L117.7,122.8 L121.5,121.7 L125.4,120.5 L129.2,119.2 L133.1,117.8 L136.9,116.3 L140.8,114.8 L144.6,113.1 L148.5,111.3 L152.3,109.4 L156.2,107.4 L160.0,105.2 L163.8,102.9 L167.7,100.5 L171.5,97.9 L175.4,95.1 L179.2,92.1 L183.1,88.9 L186.9,85.5 L190.8,81.9 L194.6,78.1 L198.5,74.0 L202.3,69.6 L206.2,65.0 L210.0,60.0 L210.0,140.0 L60.0,140.0 Z" fill="#f2b880" stroke="none"/>
  <line x1="20" y1="140" x2="345" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="60" y1="140" x2="60" y2="30" stroke="#1f2a44" stroke-width="1"/>
  <path d="M24.0,140.0 L60.0,140.0 L60.0,60.0 L336.0,60.0" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <path d="M24.0,136.4 L27.8,136.2 L31.6,135.9 L35.4,135.6 L39.2,135.4 L43.0,135.1 L46.8,134.7 L50.6,134.4 L54.4,134.0 L58.2,133.6 L62.0,133.2 L65.8,132.8 L69.6,132.3 L73.3,131.8 L77.1,131.3 L80.9,130.7 L84.7,130.1 L88.5,129.4 L92.3,128.7 L96.1,128.0 L99.9,127.2 L103.7,126.4 L107.5,125.5 L111.3,124.6 L115.1,123.5 L118.9,122.5 L122.7,121.3 L126.5,120.1 L130.3,118.8 L134.1,117.4 L137.9,116.0 L141.7,114.4 L145.5,112.7 L149.3,110.9 L153.1,109.0 L156.9,107.0 L160.7,104.9 L164.4,102.6 L168.2,100.1 L172.0,97.5 L175.8,94.7 L179.6,91.8 L183.4,88.6 L187.2,85.3 L191.0,81.7 L194.8,77.9 L198.6,73.8 L202.4,69.5 L206.2,64.9 L210.0,60.0 L210.0,140.0" fill="none" stroke="#b4232c" stroke-width="2"/>
  <line x1="210.0" y1="140" x2="210.0" y2="146" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="210.0" y="160" font-size="12" fill="#1f2a44" text-anchor="middle">τ = t</text>
  <text x="60" y="160" font-size="12" fill="#1f2a44" text-anchor="middle">0</text>
  <text x="336.0" y="52" font-size="12" fill="#1d6fd1" text-anchor="end">input u(τ)</text>
  <text x="204.0" y="40" font-size="12" fill="#b4232c" text-anchor="end">h(t − τ), flipped and slid to t</text>
  <text x="165.0" y="133" font-size="12" fill="#1f2a44" text-anchor="middle">area = y(t)</text>
  <text x="340" y="160" font-size="12" fill="#6c7a93" text-anchor="end">τ</text>
</svg>
```

Slide the red curve right and the shaded area grows toward 1 — the step response of a first-order lag, rising toward its DC gain.
:::

::: context memory The system remembers, then forgets
Think of how a warm room cools after the heater goes off. It is still a little warm from an hour ago, much warmer from five minutes ago. The impulse response is that fading memory written down: $h(\tau)$ is how much of an input from $\tau$ seconds ago still shows in the output now. Convolution adds up every past input, each weighted by how well the system still remembers it.
:::

::: context rect-triangle Two boxes make a tent
Sliding one box across another, the overlap grows steadily, peaks when they line up, then shrinks steadily. Widths add and areas multiply. (The triangle's height is drawn on its own scale.)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 165" font-family="Inter, Arial, sans-serif">
  <line x1="15" y1="120" x2="90" y2="120" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="20" y="50" width="60" height="70" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="50" y="138" font-size="11" fill="#1f2a44" text-anchor="middle">0.2 s</text>
  <text x="16" y="55" font-size="11" fill="#1f2a44" text-anchor="end">1</text>
  <line x1="115" y1="120" x2="190" y2="120" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="120" y="50" width="60" height="70" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="150" y="138" font-size="11" fill="#1f2a44" text-anchor="middle">0.2 s</text>
  <text x="116" y="55" font-size="11" fill="#1f2a44" text-anchor="end">1</text>
  <text x="100" y="92" font-size="22" fill="#1f2a44" text-anchor="middle">∗</text>
  <text x="200" y="92" font-size="20" fill="#1f2a44" text-anchor="middle">=</text>
  <line x1="220" y1="120" x2="350" y2="120" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M225,120 L285,50 L345,120 Z" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="285" y1="50" x2="285" y2="120" stroke="#1f2a44" stroke-width="1" stroke-dasharray="3 2"/>
  <line x1="220" y1="50" x2="226" y2="50" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="216" y="55" font-size="11" fill="#1f2a44" text-anchor="end">0.2</text>
  <text x="285" y="40" font-size="11" fill="#1f2a44" text-anchor="middle">peak 0.2</text>
  <text x="285" y="138" font-size="11" fill="#1f2a44" text-anchor="middle">base 0.4 s</text>
  <text x="285" y="156" font-size="11" fill="#1d6fd1" text-anchor="middle">area 0.04 = 0.2 × 0.2</text>
  <text x="70" y="30" font-size="11" fill="#1d6fd1" text-anchor="middle">each: area 0.2</text>
</svg>
```

Convolve the triangle with a third box and the corners round off into a smooth hump. Keep going and the shape heads toward the bell curve — a hint of why so many smoothing processes end up bell-shaped.
:::

::: context bibo Bounded in, bounded out
**BIBO** stands for "bounded input, bounded output". A bounded signal is one that never exceeds some fixed size. The test asks: is there *any* input, however cleverly chosen, that stays small but drives the output to infinity? A spacecraft with no attitude control fails. A steady push, never exceeding a fraction of a newton-meter, spins it up faster and faster. Later lessons test the same property by asking whether every pole lies in the left half plane.
:::

::: context zero-order-hold Holding each command until the next
A flight computer computes a new command, say, every $10\,\mathrm{ms}$. Between updates the command does not fade away or ramp — the electronics hold the last value until a new one arrives. Plotted against time, the command becomes a staircase. The name "zero-order" means the held value is a polynomial of degree zero — a constant — until the next sample. Lesson 8 shows that holding like this acts, on average, like a delay of half a sample period.
:::

::: context duhamel An old trick from heat flow
Jean-Marie Duhamel was a French mathematician who worked on heat conduction in the 1830s. He showed how to build the temperature inside a solid whose surface temperature keeps changing, by adding up the responses to many small step changes. That is the same idea as the staircase sum here. Engineers still call the step-response form of convolution "Duhamel's integral", especially in structural dynamics.
:::

::: context circular Why FFT convolution wraps around
The FFT treats every signal as if it repeats forever, like a pattern printed around a drum. So when a response runs past the end of the record, it reappears at the start, the way a clock goes from 12 back to 1. Padding with zeros makes the drum bigger than the whole response, so the tail lands on empty space instead of on your data.
:::

::: context reaction-wheel Turning by spinning the other way
A reaction wheel is a heavy disk driven by an electric motor. Speed the wheel up one way and the spacecraft turns the other way, because the total angular momentum of wheel plus spacecraft cannot change without an outside torque. Hubble points at its targets this way, with four reaction wheels. When a wheel reaches its top speed it can no longer absorb momentum, and thrusters or magnetic torquers must be used to slow it down.
:::
