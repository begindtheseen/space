---
id: l02-impulse-step-and-convolution
title: Impulse response, step response and convolution
minutes: 18
covers:
  - "Impulse response, step response, and convolution"
---

Lesson 1 promised that superposition reduces an LTI system to a single experiment. This lesson collects the payment. The experiment is an impulse, the result is the **impulse response** $h(t)$, and the rule that turns $h$ into the response to any other input is **convolution**. Every time-domain simulation you will ever run is doing convolution, whether it says so or not.

On a real vehicle you rarely get to apply an impulse. What a test conductor actually commands is a step: a $1^\circ$ nozzle deflection held for two seconds, a $0.5\,\mathrm{N\,m}$ wheel torque, a thruster on-pulse. So the **step response** $s(t)$ is the measured object and the impulse response is inferred from it, $h = \dot{s}$. The two carry identical information and it pays to be fluent in both — the step response is what a specification talks about (rise time, overshoot, settling time) and the impulse response is what the mathematics talks about.

Module 8 introduced $h(t)$, the convolution integral, and the theorem that convolution in time is multiplication in $s$. This lesson takes that further in the directions a control engineer needs: what you can read off $h$ and $s$ by inspection, how convolution behaves as an operation (it is commutative, associative and smoothing, and those three facts are block-diagram algebra in disguise), and how to evaluate it on sampled data without the two mistakes that people actually make.

## The impulse, step and ramp family

Three test inputs, each the integral of the one before it:

$$
\delta(t) \ \xrightarrow{\ \int\ }\ 1(t) \ \xrightarrow{\ \int\ }\ t\,1(t),
$$

where $1(t)$ is the unit step (zero for $t < 0$, one for $t \ge 0$) and $\delta(t)$ is the unit impulse — an idealised spike of zero width, infinite height and **unit area**. Its defining property is the sifting property, $\int_{-\infty}^{\infty}f(\tau)\delta(\tau - a)\,d\tau = f(a)$.

Because the system is linear and integration is a linear operation that commutes with it, the responses inherit the same relationship. Call them $h(t)$, $s(t)$ and $r(t)$:

$$
s(t) = \int_0^t h(\tau)\,d\tau, \qquad h(t) = \frac{ds}{dt}, \qquad r(t) = \int_0^t s(\tau)\,d\tau.
$$

In the transform domain this is the familiar division by $s$: $\mathcal{L}\{h\} = G(s)$, $\mathcal{L}\{s\} = G(s)/s$, $\mathcal{L}\{r\} = G(s)/s^2$.

Three consequences you should be able to state without thinking:

- **The final value of the step response is the DC gain.** $s(\infty) = \int_0^\infty h\,dt = G(0)$, for a stable system. A step response that settles at $0.909$ tells you $G(0) = 0.909$ with no further work.
- **The initial slope of the step response is $h(0^+)$.** For a strictly proper system of relative degree one, such as a first-order lag $a/(s + a)$, $h(0^+) = a$ and the step response leaves the origin with slope $a$. For relative degree two or more, $h(0^+) = 0$ and the step response leaves the origin flat.
- **The step response's first peak is where $h$ first crosses zero**, because $\dot{s} = h$.

::: warning
An impulse is specified by its **area**, not its height. A thruster firing at $0.5\,\mathrm{N}$ for $20\,\mathrm{ms}$ approximates an impulse of area $0.01\,\mathrm{N\,s}$, and the response is $0.01\,h(t)$ — with $h$ in units of output per unit of (input $\times$ second). If $h$ is quoted in $\mathrm{s^{-1}}$, as it is for a unit-gain actuator, that is because the output is dimensionless per unit input and the extra $\mathrm{s^{-1}}$ comes from the impulse's area carrying a second. Getting this wrong by a factor of the pulse width is the most common unit error in this subject.
:::

## Convolution, and what it does to signals

The response to an arbitrary input, from rest, is

$$
y(t) = (h * u)(t) = \int_0^t h(\tau)\,u(t - \tau)\,d\tau = \int_0^t h(t - \tau)\,u(\tau)\,d\tau.
$$

The graphical recipe for the second form, which is how you sketch one by hand: take $h$, reflect it about the vertical axis, slide it right by $t$, multiply it point by point against $u$, and integrate. Reflect, shift, multiply, integrate. The value at each $t$ is one number, the overlapping area, and the whole output is that number traced out as the reflected copy slides.

Read the first form physically instead: $h(\tau)$ is the weight the system still gives to input applied $\tau$ seconds ago. A first-order lag with $h = ae^{-a\tau}$ forgets exponentially with time constant $1/a$; an integrator with $h = 1$ remembers everything equally and forever.

Four properties, each of which is a fact about block diagrams:

| Property | Statement | What it means in a diagram |
| --- | --- | --- |
| Commutative | $h * u = u * h$ | two blocks in cascade may be written in either order |
| Associative | $(h_1 * h_2) * u = h_1 * (h_2 * u)$ | a cascade has one equivalent impulse response, $h_1 * h_2$ |
| Distributive | $(h_1 + h_2) * u = h_1 * u + h_2 * u$ | parallel paths add |
| Identity | $h * \delta = h$ | an ideal wire is $\delta(t)$, whose transform is 1 |

And two facts about shapes. **Widths add**: convolving a signal of duration $T_1$ with one of duration $T_2$ gives a signal of duration $T_1 + T_2$. **Areas multiply**: $\int(h * u) = \left(\int h\right)\left(\int u\right)$, which is the $s \to 0$ limit of $Y = GU$. Convolving a $0.2\,\mathrm{s}$ rectangle of unit height with another gives a triangle of base $0.4\,\mathrm{s}$ and peak $0.2$; its area, $\tfrac{1}{2}(0.4)(0.2) = 0.04$, equals the product $0.2 \times 0.2$ of the two input areas. Convolution also **smooths**: the output is at least as smooth as the smoother of the two signals, which is why a lag turns a step into a rounded ramp and why a step command through an actuator never arrives as a step.

Finally, the stability test in this language. A system is BIBO stable exactly when $\int_0^\infty|h(t)|\,dt$ is finite, because $|y| \le \left(\max|u|\right)\int_0^\infty|h|\,dt$ and the bound is attained by an input that matches the sign of $h$. An integrator, $h = 1$, fails it; so does any $h$ with a growing or non-decaying mode.

::: key
$h(t) = \mathcal{L}^{-1}\{G(s)\}$; $s(t) = \int_0^t h$, so $h = \dot{s}$ and $s(\infty) = G(0)$. Zero-state response to any input: $y = h * u = \int_0^t h(\tau)u(t - \tau)\,d\tau$, equivalently $Y(s) = G(s)U(s)$. Convolution is commutative, associative and distributive; widths add, areas multiply. BIBO stable $\iff \int_0^\infty|h|\,dt < \infty$.
:::

::: example Building a TVC actuator's step response by convolution
An electromechanical thrust-vector actuator is specified as a second-order system with a $10\,\mathrm{Hz}$ natural frequency and $\zeta = 0.7$: $\omega_n = 2\pi(10) = 62.83\,\mathrm{rad/s}$, so $\sigma = \zeta\omega_n = 43.98\,\mathrm{s^{-1}}$ and $\omega_d = \omega_n\sqrt{1 - \zeta^2} = 44.87\,\mathrm{rad/s}$. Its impulse response is

$$
h(t) = \frac{\omega_n}{\sqrt{1 - \zeta^2}}e^{-\sigma t}\sin\omega_d t = 87.98\,e^{-43.98t}\sin(44.87t)\ \mathrm{s^{-1}}.
$$

The impulse response peaks where $\dot{h} = 0$, that is $\tan\omega_d t = \omega_d/\sigma$, at $t = \arctan(44.87/43.98)/44.87 = 17.7\,\mathrm{ms}$, where $h = 28.81\,\mathrm{s^{-1}}$. So a $1^\circ$ command pulse lasting $2\,\mathrm{ms}$ — area $0.002\,\mathrm{deg\,s}$ — moves the nozzle a peak of $0.002 \times 28.81 = 0.058^\circ$.

Now convolve $h$ with a unit step, numerically, by the midpoint rule with $\Delta\tau = 1\,\mathrm{\mu s}$, and compare with the closed form $s(t) = 1 - e^{-\sigma t}(\cos\omega_d t + 0.9802\sin\omega_d t)$:

| $t$ | $\int_0^t h\,d\tau$ | closed form |
| --- | --- | --- |
| $10\,\mathrm{ms}$ | $0.145715$ | $0.145715$ |
| $20\,\mathrm{ms}$ | $0.423302$ | $0.423302$ |
| $70.01\,\mathrm{ms}$ | $1.045988$ | $1.045988$ |
| $200\,\mathrm{ms}$ | $1.000072$ | $1.000072$ |

They agree to ten digits. The peak sits at $t_p = \pi/\omega_d = 70.0\,\mathrm{ms}$ with value $1.04599$, an overshoot of 4.60% — which is $e^{-\pi\zeta/\sqrt{1 - \zeta^2}}$ to three figures, the formula lesson 5 derives. The area check: $\int_0^1 h\,dt = 1.00000000$, confirming $G(0) = 1$, as it must be for an actuator that tracks its command. And $\int_0^2|h|\,dt = 1.096$ is finite, so the actuator is BIBO stable; the excess over 1 is the ringing that changes sign. The 2% settling time is $4/\sigma = 91\,\mathrm{ms}$, so this actuator has effectively arrived within a tenth of a second — which is the number a launch-vehicle controller cares about, because the attitude loop crossing over near $1\,\mathrm{rad/s}$ must not see actuator dynamics.
:::

## Convolution on sampled data

Two practical forms.

**From the impulse response.** With $h$ and $u$ sampled uniformly at $\Delta t$, the causal discrete convolution is

$$
y[n] \approx \Delta t\sum_{k=0}^{n} h[k]\,u[n - k].
$$

The sum runs from $0$ to $n$ only — a causal system does not respond to input that has not happened. This is the whole content of a linear simulation.

**From the step response.** If what you have is a measured step response and the input is a staircase, as it is out of any flight computer holding its command constant between samples, then write the staircase as a sum of steps of height $\Delta u_k = u_k - u_{k-1}$ applied at times $t_k$, and superpose:

$$
y(t) = \sum_{k\,:\,t_k \le t} \Delta u_k\,s(t - t_k).
$$

This is Duhamel's form, and it is exact for a zero-order-held input — no impulse response needed, no differentiation of noisy test data. It is the cheapest honest way to propagate a commanded profile through a system whose step response you measured on a test stand.

::: example A commanded staircase through a measured lag
A gimbal command is held at $2^\circ$ for $0.5\,\mathrm{s}$, then $1^\circ$ for $0.5\,\mathrm{s}$, then $0^\circ$. The actuator's measured step response is well fitted by a first-order lag of time constant $\tau = 0.25\,\mathrm{s}$: $s(t) = 1 - e^{-t/\tau}$.

The staircase decomposes into three steps: $\Delta u = +2^\circ$ at $t = 0$, $-1^\circ$ at $t = 0.5\,\mathrm{s}$, $-1^\circ$ at $t = 1.0\,\mathrm{s}$. Then, for example,

$$
y(0.75) = 2\left(1 - e^{-3}\right) - 1\left(1 - e^{-1}\right) = 1.9004 - 0.6321 = 1.2683^\circ .
$$

Carrying that through: $y(0.25) = 1.2642^\circ$, $y(0.5) = 1.7293^\circ$, $y(0.75) = 1.2683^\circ$, $y(1.0) = 1.0987^\circ$, $y(1.5) = 0.1487^\circ$, $y(2.0) = 0.0201^\circ$. The nozzle never reaches the commanded $2^\circ$ — it gets to 86.5% of it in the half second available — and it is still $0.02^\circ$ away from zero a full second after the command returned to zero. That residual is what an attitude loop sees as actuator lag, and it is the reason lesson 8 treats slow actuators as a phase penalty rather than a gain error.
:::

::: warning
Two traps in numerical convolution. First, a fast Fourier transform multiplies spectra, and multiplying two finite DFTs performs **circular** convolution: the tail wraps around and corrupts the beginning of the record. Zero-pad both signals to at least the sum of their lengths before transforming, or the transient at the start of your simulation will be contaminated by the end of it. Second, the sum $\Delta t\sum h[k]u[n-k]$ is a rectangle rule; it is first-order accurate, and with a coarse $\Delta t$ it will quietly mis-scale a sharp impulse response. Refine $\Delta t$ until the answer stops moving, or integrate the differential equation instead.
:::

::: example A reaction-wheel slew, straight out of the convolution integral
A spacecraft with pitch inertia $I = 1200\,\mathrm{kg\,m^2}$ is slewed by a reaction wheel that commands $+0.2\,\mathrm{N\,m}$ for $10\,\mathrm{s}$, coasts for $20\,\mathrm{s}$, then commands $-0.2\,\mathrm{N\,m}$ for $10\,\mathrm{s}$. From torque to attitude the vehicle is a double integrator, $G(s) = 1/(Is^2)$, whose impulse response is $h(t) = t/I$.

No partial fractions are needed: convolve directly. Up to $t = 10\,\mathrm{s}$,

$$
\theta(t) = \int_0^t \frac{t - \tau}{I}(0.2)\,d\tau = \frac{0.2}{I}\cdot\frac{t^2}{2},
$$

so $\theta(10) = 0.2(100)/(2 \times 1200) = 8.333\,\mathrm{mrad} = 0.4775^\circ$ and the rate there is $0.2(10)/1200 = 1.667\,\mathrm{mrad/s} = 0.0955\,^\circ/\mathrm{s}$. Through the coast the attitude ramps: $\theta(20) = 25.0\,\mathrm{mrad} = 1.4324^\circ$, $\theta(30) = 41.7\,\mathrm{mrad} = 2.3873^\circ$. The braking pulse then removes exactly the momentum the first pulse added, and the manoeuvre ends at rest with

$$
\theta(40) = \frac{0.2}{1200}\Bigl[(40\times10 - 50) - (40\times10 - 350)\Bigr] = \frac{0.2}{1200}(300) = 50.0\,\mathrm{mrad} = 2.865^\circ,
$$

and stays there. Two sanity checks fall out of the properties above. The rate at the end is $\left(\int u\right)/I = 0$ because the torque profile has zero net area — areas multiply, and one of them is zero. And the motion lasts $40\,\mathrm{s}$: the input is $40\,\mathrm{s}$ wide, $h$ is unbounded in width, so widths do not add to anything finite, which is exactly why a double integrator never settles on its own. The wheel stored $0.2 \times 10 = 2.0\,\mathrm{N\,m\,s}$ of momentum at its peak; spinning at $2000\,\mathrm{rpm} = 209\,\mathrm{rad/s}$, that needs a rotor inertia of $9.55 \times 10^{-3}\,\mathrm{kg\,m^2}$.
:::

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

The small excess at $10\,\mathrm{s}$ — $0.008350$ against the exact $0.008333$ — is the rectangle rule's first-order error at $\Delta t = 20\,\mathrm{ms}$; halving the step halves it.

## Check yourself

::: check
A system's step response rises from zero with an initial slope of $8\,\mathrm{s^{-1}}$, overshoots to $1.18$ at $t = 0.4\,\mathrm{s}$, and settles at $0.8$. What do you know about $h(t)$, $G(0)$ and the relative degree?
:::

::: answer
$h = \dot{s}$, so $h(0^+) = 8\,\mathrm{s^{-1}}$ — nonzero, so the relative degree (denominator degree minus numerator degree) is exactly one. $h$ is positive up to $t = 0.4\,\mathrm{s}$, crosses zero there (the peak of $s$ is where $h$ first vanishes), and then goes negative during the undershoot that follows. The DC gain is the final value, $G(0) = \int_0^\infty h\,dt = 0.8$. Note that $\int h$ is $0.8$ while $\int|h|$ is larger — at least $1.18 + (1.18 - 0.8) = 1.56$ counting only the first overshoot — and it is the second number that bounds the response to a worst-case bounded input.
:::

::: check
Two identical first-order lags with $\tau = 0.1\,\mathrm{s}$ are cascaded. Use the properties of convolution to say, without solving anything, what the cascade's impulse response looks like at $t = 0$ and roughly how long it lasts.
:::

::: answer
The cascade's impulse response is $h_1 * h_2$ by associativity. Each $h_i = 10e^{-10t}$ starts at $10\,\mathrm{s^{-1}}$ and has effectively died by $4\tau = 0.4\,\mathrm{s}$. Convolution smooths and widths add, so the cascade starts at zero (the convolution of two functions that are finite at the origin is continuous and vanishes at $t = 0$, since the overlap area is zero there) and lasts roughly twice as long, around $0.8\,\mathrm{s}$. Its area is the product of the areas, $1 \times 1 = 1$, so the DC gain is still 1. Evaluating it confirms the sketch: $h(t) = 100\,t\,e^{-10t}$, zero at the origin, peaking at $t = 0.1\,\mathrm{s}$.
:::

::: check
A spacecraft is hit by a micrometeoroid delivering an angular impulse of $0.004\,\mathrm{N\,m\,s}$ about the pitch axis. Its inertia is $1200\,\mathrm{kg\,m^2}$ and no control is active. What is the attitude error one minute later, and what does this say about $\int|h|$?
:::

::: answer
From torque to attitude, $h(t) = t/I$, so the response to an impulse of area $\alpha$ is $\alpha t/I$: the rate jumps to $\alpha/I = 0.004/1200 = 3.33\,\mathrm{\mu rad/s}$ and the attitude drifts linearly. After $60\,\mathrm{s}$ the error is $3.33 \times 10^{-6} \times 60 = 2.0 \times 10^{-4}\,\mathrm{rad} = 0.0115^\circ$; after an hour it is $0.69^\circ$. Since $h = t/I$ grows without bound, $\int_0^\infty|h|\,dt$ diverges and the free rigid body is not BIBO stable — a bounded torque can produce an unbounded attitude. That is the mathematical statement of "a spacecraft will not hold attitude by itself".
:::

::: check
You measured a step response on a test stand at $1\,\mathrm{kHz}$ and want the response to a commanded profile that the flight computer updates at $100\,\mathrm{Hz}$. Would you differentiate the measurement to get $h$ and convolve, or use the staircase form? Why?
:::

::: answer
Use the staircase form, $y(t) = \sum_k \Delta u_k\,s(t - t_k)$. Differentiating a measured signal amplifies sensor noise by a factor proportional to frequency, and a $1\,\mathrm{kHz}$ record differentiated numerically is dominated by noise unless it is filtered first, which changes the very dynamics you are trying to capture. The staircase form uses the measurement as recorded, needs one evaluation of $s$ per command update per output sample, and is *exact* for a zero-order-held command rather than an approximation — which is what the flight computer actually produces. You need $s$ only at the delays $t - t_k$, so interpolating the $1\,\mathrm{kHz}$ record is enough.
:::

::: check
Explain why convolving a $0.2\,\mathrm{s}$ rectangular pulse of height 1 with itself gives a triangle, and state its base, peak and area from the properties alone.
:::

::: answer
Reflect one rectangle and slide it across the other. For shifts beyond $\pm 0.2\,\mathrm{s}$ there is no overlap, so the result is zero; the overlap grows linearly from zero at a shift of $-0.2\,\mathrm{s}$ to full at zero shift, then falls linearly back — a triangle. Widths add, so the base is $0.2 + 0.2 = 0.4\,\mathrm{s}$; the peak is the full overlap area, $1 \times 0.2 = 0.2$; and areas multiply, so the total area is $0.2 \times 0.2 = 0.04$, which the triangle's $\tfrac{1}{2}(0.4)(0.2)$ confirms. This is also the reason a zero-order hold followed by another averaging stage smooths a command into something with a continuous slope.
:::

## Summary

| Item | Statement |
| --- | --- |
| Test inputs | $\delta(t)$, $1(t)$, $t\,1(t)$; each the integral of the previous |
| Responses | $h(t)$, $s(t) = \int_0^t h$, $r(t) = \int_0^t s$; $h = \dot{s}$ |
| Transforms | $\mathcal{L}\{h\} = G(s)$, $\mathcal{L}\{s\} = G(s)/s$, $\mathcal{L}\{r\} = G(s)/s^2$ |
| DC gain | $s(\infty) = \int_0^\infty h\,dt = G(0)$ |
| Initial slope | $\dot{s}(0^+) = h(0^+) = \lim_{s\to\infty}sG(s)$; zero iff relative degree $\ge 2$ |
| Convolution | $y = h * u = \int_0^t h(\tau)u(t - \tau)\,d\tau$; $Y(s) = G(s)U(s)$ |
| Algebra | commutative, associative (cascade $= h_1 * h_2$), distributive (parallel adds), identity $\delta$ |
| Shapes | widths add; areas multiply; convolution smooths |
| BIBO stability | $\int_0^\infty|h(t)|\,dt < \infty$ |
| Sampled forms | $y[n] = \Delta t\sum_{k=0}^{n}h[k]u[n-k]$; staircase $y(t) = \sum_k \Delta u_k\,s(t - t_k)$ |

Both descriptions so far have been integrals. The next lesson replaces them with algebra: the Laplace transform turns the convolution integral into a product and the impulse response into the transfer function, and from there the whole module is polynomials.
