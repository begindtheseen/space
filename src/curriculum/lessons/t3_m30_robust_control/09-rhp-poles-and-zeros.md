---
id: l09-rhp-poles-and-zeros
title: What right-half-plane poles and zeros forbid
minutes: 23
covers:
  - Performance limitations imposed by right-half-plane poles and zeros
---

Try balancing a broomstick upright on your palm. It wants to fall, so you must move your hand quickly — too slowly and it is on the floor. Now imagine you can only see the broom through a video feed that shows everything a moment late, or that shows the top of the broom lurching the wrong way before it goes the right way. Past a certain point, no amount of skill saves you. The limit is not in your hand. It is in the broom and the camera.

Everything so far in this module has been about what a controller can be made to do. This lesson is about what **no** controller can do. A plant with an unstable pole and a zero on the unstable side of the complex plane has a sensitivity peak with a floor you can compute from those two numbers alone, before any design work. Its usable bandwidth is squeezed between a floor and a ceiling that may not leave room for anything. These are not pessimistic estimates. They are exact consequences of the algebra of stable functions, and they hold for linear, nonlinear, adaptive and learned controllers alike.

That matters most for launch vehicles, which often have both. The **[[aerodynamic instability|aero-instability]]** of a rocket climbing through the atmosphere puts a pole at $\sqrt{\mu_\alpha}$, around half a radian per second at maximum dynamic pressure. Sensor placement, load-relief feedback from a forward accelerometer, and rate gyros mounted away from the actuators on a flexible body all produce right-half-plane zeros. When the two sit close together, the vehicle is hard to control in a way that no amount of design effort removes. The right engineering response is to move the sensor, change the aerodynamics, or accept a worse loop — not to keep iterating the controller.

## The interpolation constraints

First, the words. A **[[right-half-plane|rhp-picture]]** (RHP) pole is a pole with positive real part: a mode that grows by itself, like the falling broom. A right-half-plane zero is a zero with positive real part. It makes the response start off the wrong way, like the lurching video. Such a plant is called **non-minimum phase**.

Take a loop $L = GK$ — plant times controller — that is **[[internally stable|internal-stability]]**, with sensitivity $S = 1/(1+L)$ and complementary sensitivity $T = 1 - S$. Internal stability forbids canceling an unstable pole or an RHP zero between $G$ and $K$. So those factors survive into $L$. That single fact pins $S$ and $T$ down at specific points.

**At an RHP zero $z$ of the plant**, $L(z) = 0$. So

$$S(z) = \frac{1}{1 + 0} = 1, \qquad T(z) = 0.$$

**At an RHP pole $p$ of the plant**, $L(p) = \infty$. So

$$S(p) = \frac{1}{1 + \infty} = 0, \qquad T(p) = 1.$$

These are called **interpolation constraints**, because they force $S$ and $T$ to pass through fixed values at fixed points, the way a curve is forced through given dots.

::: key Interpolation constraints
$S(z) = 1$ at every right-half-plane zero $z$ and $T(p) = 1$ at every right-half-plane pole $p$, with $T(z) = 0$ and $S(p) = 0$. These are structural: no controller escapes them. For a multivariable plant they hold in directions — $\mathbf{y}_z^\mathsf{H}\mathbf{S}(z) = \mathbf{y}_z^\mathsf{H}$ for the output zero direction, and $\mathbf{S}(p)\mathbf{y}_p = \mathbf{0}$ for the output pole direction.
:::

The directional form hides a piece of good news. If the zero direction $\mathbf{y}_z$ and the pole direction $\mathbf{y}_p$ are **orthogonal** (at right angles), the two constraints act on different output directions and do not fight each other; the penalty below relaxes to nothing. If they line up, the full single-loop penalty applies. In between, the general bound blends the two using the cosine of the angle between them. So on a multivariable vehicle, the *geometry* of where the zero and the pole live matters as much as their frequencies.

## The sensitivity peak bound

::: key Sensitivity peak from a pole-zero pair
For a scalar plant with a right-half-plane zero $z$ and a right-half-plane pole $p$, both real,

$$\lVert S\rVert_\infty \ \ge\ \frac{\lvert z + p\rvert}{\lvert z - p\rvert},$$

and the same bound holds for $\lVert T\rVert_\infty$. It blows up as $z$ approaches $p$ and tends to one as they separate.
:::

Try numbers. With $z = 6$ and $p = 2$: $(6 + 2)/(6 - 2) = 8/4 = 2$. With $z = 20$ and $p = 2$: $22/18 = 1.22$. With $z = 2.5$ and $p = 2$: $4.5/0.5 = 9$. The closer the zero is to the pole, the worse the unavoidable peak.

::: note Why the peak bound has to be true
Since $T(p) = 1$, we have $S(p) = 0$: $S$ has a zero at $p$. Build the **[[Blaschke factor|blaschke]]**

$$B_p(s) = \frac{s - p}{s + p}.$$

On the imaginary axis it has size exactly one, $\lvert B_p(j\omega)\rvert = 1$ for every $\omega$, because $j\omega - p$ and $j\omega + p$ are the same distance from the origin. Its only zero is at $p$.

Now divide: $\tilde{S} = S/B_p$. The zero of $S$ at $p$ cancels the zero of $B_p$, so $\tilde{S}$ has no poles in the right half plane — it is analytic there. The **[[maximum modulus principle|maximum-modulus]]** says such a function reaches its largest size on the boundary, which here is the imaginary axis. So

$$\lVert S\rVert_\infty = \sup_\omega\lvert S(j\omega)\rvert = \sup_\omega\lvert\tilde{S}(j\omega)\rvert \ \ge\ \lvert\tilde{S}(z)\rvert = \frac{\lvert S(z)\rvert}{\lvert B_p(z)\rvert} = \frac{1}{\lvert (z-p)/(z+p)\rvert} = \frac{\lvert z+p\rvert}{\lvert z-p\rvert},$$

using $S(z) = 1$ in the second-to-last step. The second equals sign uses $\lvert B_p(j\omega)\rvert = 1$. The bound for $\lVert T\rVert_\infty$ follows the same way, with the roles of pole and zero swapped.
:::

Two consequences are worth remembering.

- **$z < p$ is effectively impossible.** The peak bound is still large, and the bandwidth window in the next section is empty from the start.
- **$z/p$ below about four is very hard.** At $z/p = 3$ the bound is $\lVert S\rVert_\infty \ge 2$, a $6\,\mathrm{dB}$ sensitivity peak. By the disk-margin lesson, that already puts the loop at or below the traditional $6\,\mathrm{dB}$ and $30^\circ$ requirements before any other imperfection is added.

## The bandwidth window

The pole and the zero push in opposite directions.

**An unstable pole sets a floor.** You must act faster than the divergence — move your hand before the broom falls. The constraint $T(p) = 1$ says the loop must have full authority at $p$, so it must be closed there, so crossover must be above $p$. The usual working rule is $\omega_B > 2p$. Below it, the loop cannot catch the divergence before the state has grown.

**An RHP zero sets a ceiling.** The H-infinity synthesis lesson computed this exactly. For the one-block problem with the standard performance weight $W_1$, the best achievable is $\gamma_{\text{opt}} = \lvert W_1(z)\rvert$, and $\gamma_{\text{opt}} \le 1$ needs $\omega_B \le z(1 - 1/M)$, where $M$ is the allowed sensitivity peak. With $M = 2$ that is $\omega_B \le z/2$.

Put the two together. A feasible design needs a **[[window|window-picture]]**

$$2p \ \lesssim\ \omega_B \ \lesssim\ \frac{z}{2}, \qquad\text{hence}\qquad \frac{z}{p} \gtrsim 4 .$$

The symbol $\lesssim$ reads "is less than about". That is where the rule "$z/p$ below four is very hard" comes from: below four, the window closes.

::: example A booster with a forward accelerometer
Take the launch vehicle of the atmospheric flight module at maximum dynamic pressure, where $\mu_\alpha = 0.228\,\mathrm{s^{-2}}$.

**Step 1: the pole.** $p = \sqrt{0.228} = 0.477\,\mathrm{rad/s}$. Its time to double is $\ln 2/p = 0.693/0.477 = 1.45\,\mathrm{s}$: left alone, any attitude error doubles every second and a half.

**Step 2: the zero.** Load relief feeds back lateral acceleration from a sensor mounted forward of the center of gravity, and that path has a **[[right-half-plane zero|wrong-way-sensor]]**. Suppose it sits at $z = 2.5\,\mathrm{rad/s}$.

**Step 3: the peak bound.**

$$\lVert S\rVert_\infty \ \ge\ \frac{2.5 + 0.477}{2.5 - 0.477} = \frac{2.977}{2.023} = 1.472 = 3.36\,\mathrm{dB}.$$

**Step 4: the window.** $z/p = 2.5/0.477 = 5.24$, above four. The window runs from $2p = 0.955\,\mathrm{rad/s}$ to $z/2 = 1.25\,\mathrm{rad/s}$. Narrow, but not empty, so a design exists — with a sensitivity peak of at least $1.47$.

**Step 5: the best possible disk margin.** Since $\lVert S - \tfrac{1}{2}\mathbf{I}\rVert_\infty \ge \lVert S\rVert_\infty - \tfrac{1}{2}$, the balanced disk margin obeys $\alpha \le 1/(1.472 - 0.5) = 1.029$. So no controller can give this vehicle better than $\pm 9.88\,\mathrm{dB}$ and $\pm 54.4^\circ$.

**Now move the sensor forward**, which moves the zero down to $z = 1.5\,\mathrm{rad/s}$. The bound becomes $1.977/1.023 = 1.93 = 5.73\,\mathrm{dB}$, and $z/p = 3.14$. The window is now $0.955$ up to $0.750\,\mathrm{rad/s}$ — the floor is above the ceiling. **It is empty. There is no controller.** The vehicle cannot be both stabilized against its aerodynamic divergence and kept insensitive through that sensor. The trade must be made in the vehicle, not the software: move the accelerometer aft, blend it with an inertial measurement that has no such zero, or reduce $\mu_\alpha$ by shifting the center of gravity.

**For contrast**, the textbook pair $z = 6$, $p = 2$ gives $\lVert S\rVert_\infty \ge 8/4 = 2$ exactly, a $6.02\,\mathrm{dB}$ peak, with $z/p = 3$ and a window from $4$ down to $3\,\mathrm{rad/s}$ — also empty. That is what "uncomfortably small" means in numbers.
:::

## The waterbed: Bode's sensitivity integral

Push down on a waterbed in one spot and it bulges up somewhere else. The water has to go somewhere. Sensitivity behaves the same way.

The peak bound says how bad $\lvert S\rvert$ must get somewhere. **[[Bode's sensitivity integral|bode-integral-history]]** says that pushing it down in one band forces it up in another — and adds a fixed extra charge for instability.

::: key Bode sensitivity integral
If the open loop $L$ has **relative degree** at least two (its denominator's degree is at least two more than its numerator's) and right-half-plane poles $p_i$, then

$$\int_0^\infty\ln\lvert S(j\omega)\rvert\,d\omega = \pi\sum_i\operatorname{Re}(p_i).$$

For a stable open loop the right side is zero: every decibel of disturbance rejection bought below crossover is paid for in amplification above it. An unstable pole adds a fixed positive area that must be paid whatever the design.
:::

Here $\ln\lvert S\rvert$ is negative where the loop rejects disturbances ($\lvert S\rvert < 1$) and positive where it amplifies them ($\lvert S\rvert > 1$). The integral adds up the signed area under that curve. $\operatorname{Re}(p_i)$ is the real part of each unstable pole.

The integral is exact, and it is worth checking numerically once, because the constant is easy to misremember. Take the booster with plant $1/(s^2 - 0.228)$, a gimbal actuator $400/(s^2 + 28s + 400)$ (a $20\,\mathrm{rad/s}$ second-order lag), and the proportional-derivative controller $1 + s$. The loop has relative degree three. [[Numerical integration|waterbed-picture]] of $\ln\lvert S\rvert$ gives $1.50009$, and $\pi p = \pi\sqrt{0.228} = 1.50009$.

::: example What the waterbed costs the booster
The fixed area is $\pi p = 1.500\,\mathrm{rad/s}$, in natural-log units.

**Step 1: the requirement's credit.** Suppose disturbance rejection must reach $\lvert S\rvert \le 0.1$ below $0.5\,\mathrm{rad/s}$. That band adds at most $\ln(0.1)\times 0.5 = -2.303\times 0.5 = -1.151$ to the integral.

**Step 2: the bill.** The remaining frequencies must then supply at least $1.500 + 1.151 = 2.651$ of positive area.

**Step 3: where can it go?** Not to arbitrarily high frequency: above the loop's roll-off, $\lvert S\rvert \to 1$ and $\ln\lvert S\rvert \to 0$, so the positive area is confined to a finite band around crossover. If it must all fit between $0.5$ and $\omega_2$, then the peak satisfies $\ln M_s \ge 2.651/(\omega_2 - 0.5)$, so $M_s \ge e^{2.651/(\omega_2 - 0.5)}$:

| $\omega_2$ (rad/s) | minimum peak $M_s$ | in dB |
| --- | --- | --- |
| 3 | 2.888 | 9.21 |
| 5 | 1.803 | 5.12 |
| 8 | 1.424 | 3.07 |

Check the middle row: $2.651/4.5 = 0.589$, and $e^{0.589} = 1.80$.

So the requirement can only be met by spreading the penalty over a wide band — which means a high-bandwidth loop. And the RHP zero puts a ceiling on exactly that. The two constraints meet in the middle, and the design point is where they cross. This arithmetic, done on the back of an envelope before any controller exists, is often the most valuable half hour in a launch vehicle control program.
:::

## What an RHP zero does in time

The frequency-domain bounds have a blunt time-domain partner. Let $y(t)$ be the closed-loop step response of a system whose complementary sensitivity has an RHP zero at $z$, so $T(z) = 0$. The Laplace transform of the step response is $Y(s) = T(s)/s$. Evaluate it at $s = z$ (allowed, because the closed loop is stable, so the transform converges there):

$$\int_0^\infty y(t)\,e^{-zt}\,dt = Y(z) = \frac{T(z)}{z} = 0 .$$

Read that as a weighted average. The weight $e^{-zt}$ is always positive. If $y(t)$ were never negative, the integral would be positive — but it is zero. So $y(t)$ must go negative somewhere: the response moves the wrong way first. That is **[[undershoot|undershoot-picture]]**, and the identity makes it quantitative.

::: note Why the undershoot bound has to be true
Suppose the response has settled to within $\varepsilon$ ("epsilon", a small tolerance such as $0.05$) of one by time $\tau$ ("tau"), and let $y_{us}$ be its deepest wrong-way dip. Split the integral at $\tau$.

- After $\tau$, $y \ge 1 - \varepsilon$, so the tail contributes at least $(1-\varepsilon)\int_\tau^\infty e^{-zt}dt = (1-\varepsilon)e^{-z\tau}/z$.
- Before $\tau$, $y \ge -y_{us}$, so the head contributes at least $-y_{us}\int_0^\tau e^{-zt}dt = -y_{us}(1 - e^{-z\tau})/z$.

The two must add to zero, so $y_{us}(1 - e^{-z\tau}) \ge (1-\varepsilon)e^{-z\tau}$. Divide both sides by $1 - e^{-z\tau}$, then multiply top and bottom by $e^{z\tau}$:

$$y_{us} \ \ge\ \frac{1 - \varepsilon}{e^{z\tau} - 1}.$$
:::

Fast settling and a low zero frequency do not mix: the undershoot grows without limit as $\tau$ shrinks.

```python
import numpy as np

z, wn, zeta = 6.0, 2.0, 0.8              # RHP zero (rad/s), closed-loop frequency, damping
# T(s) = wn^2 (1 - s/z) / (s^2 + 2 zeta wn s + wn^2):  T(0) = 1, T(z) = 0
A = np.array([[0.0, 1.0], [-wn**2, -2 * zeta * wn]])
B = np.array([0.0, 1.0])
C = np.array([wn**2, -wn**2 / z])

dt, N = 1e-4, 100000
x, t = np.zeros(2), 0.0
ts, ys = np.empty(N), np.empty(N)
for k in range(N):
    f = lambda xx: A @ xx + B            # unit step command
    k1 = f(x); k2 = f(x + dt / 2 * k1); k3 = f(x + dt / 2 * k2); k4 = f(x + dt * k3)
    x = x + dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4)
    t += dt
    ts[k], ys[k] = t, C @ x

print(f"final value      = {ys[-1]:.4f}")
print(f"peak undershoot  = {ys.min():.4f} at t = {ts[np.argmin(ys)]:.3f} s")
print(f"int y(t)e^-zt dt = {np.trapezoid(ys * np.exp(-z * ts), ts):.2e}   (identically zero)")
# final value      = 1.0000
# peak undershoot  = -0.0407 at t = 0.131 s
# int y(t)e^-zt dt = 3.89e-09   (identically zero)
```

::: example How much undershoot a requirement buys
A landing vehicle's attitude loop has an RHP zero at $z = 6\,\mathrm{rad/s}$. Guidance asks the attitude to settle within five percent in $0.5\,\mathrm{s}$, so $\varepsilon = 0.05$ and $\tau = 0.5$.

**Step 1.** $z\tau = 6\times 0.5 = 3$, and $e^3 = 20.09$.

**Step 2.**

$$y_{us} \ \ge\ \frac{1 - 0.05}{e^{3} - 1} = \frac{0.95}{19.09} = 0.0498,$$

about five percent of undershoot — acceptable.

**Tighten the settling time to $0.2\,\mathrm{s}$.** Now $z\tau = 1.2$ and $e^{1.2} - 1 = 2.320$, so the bound is $0.95/2.320 = 0.409$. The attitude must first swing forty-one percent of the commanded amount *the wrong way*. For a vehicle fifty metres above the pad that is not a control problem; it is a way to lose the vehicle. The right response is to renegotiate the settling requirement.

**A lower zero**, $z = 2.5\,\mathrm{rad/s}$: settling within five percent in $1\,\mathrm{s}$ needs at least $0.95/(e^{2.5}-1) = 0.95/11.18 = 0.085$, eight and a half percent. Relaxing to $2\,\mathrm{s}$ drops it to $0.006$.

**Sanity check against the simulation.** The code above, with $z = 6$ and a closed-loop frequency of $2\,\mathrm{rad/s}$, shows $4.07\,\%$ undershoot at $t = 0.131\,\mathrm{s}$, and its weighted integral is zero to nine decimal places — the identity is not an approximation. It takes $1.83\,\mathrm{s}$ to settle within five percent, and for that slow a response the bound asks for almost nothing ($0.95/(e^{6\times 1.83} - 1) \approx 0.00002$). The $4\,\%$ dip it actually has sits comfortably above that floor, as it must.
:::

::: warning Do not try to cancel a right-half-plane zero or pole
Placing a controller zero on an unstable plant pole, or a controller pole on an RHP plant zero, makes the nominal transfer function look beautiful and the loop **[[internally unstable|hidden-growth]]**. An internal signal grows without limit while the measured output looks fine, and the slightest mismatch in the cancellation reveals it. Every bound in this lesson assumes internal stability, which is exactly what forbids the cancellation. A design tool that produces such a controller has found a hole in your problem statement, not a solution.
:::

::: warning The bounds are on the plant, not the controller
$\lVert S\rVert_\infty \ge \lvert z+p\rvert/\lvert z-p\rvert$ contains no controller. A report claiming a design "achieved" a sensitivity peak below the bound means an error somewhere: a canceled mode, a mislabeled zero, a frequency grid that missed the peak, or an analysis run on the wrong loop. Check the bound before trusting the design, every time.
:::

## Check yourself

::: check
A vehicle has an unstable pole at $p = 1.5\,\mathrm{rad/s}$ and an RHP zero at $z = 4\,\mathrm{rad/s}$ from its current sensor location. Moving the sensor would move the zero to $9\,\mathrm{rad/s}$. Put numbers on what the move buys.
:::

::: answer
**Before.** $\lVert S\rVert_\infty \ge (4 + 1.5)/(4 - 1.5) = 5.5/2.5 = 2.200$, that is $6.85\,\mathrm{dB}$. $z/p = 2.67$. The window runs from $2p = 3\,\mathrm{rad/s}$ up to $z/2 = 2\,\mathrm{rad/s}$ — floor above ceiling, empty. No acceptable design exists.

**After.** $\lVert S\rVert_\infty \ge (9 + 1.5)/(9 - 1.5) = 10.5/7.5 = 1.400$, that is $2.92\,\mathrm{dB}$. $z/p = 6.0$. The window runs from $3$ to $4.5\,\mathrm{rad/s}$ — narrow but usable.

The move turns an impossible problem into a feasible one and cuts the unavoidable sensitivity peak by $6.85 - 2.92 = 3.93\,\mathrm{dB}$.

The peak bound also caps the balanced disk margin, through $\alpha \le 1/(\lVert S\rVert_\infty - \tfrac{1}{2})$. The best achievable margin rises from $\alpha \le 1/1.7 = 0.588$ to $\alpha \le 1/0.9 = 1.111$, that is from $\pm 5.26\,\mathrm{dB}$ and $\pm 32.8^\circ$ to $\pm 10.88\,\mathrm{dB}$ and $\pm 58.1^\circ$.

This is the calculation that justifies a hardware change to a program: arithmetic on two numbers, and no amount of control design can stand in for it.
:::

::: check
Why does the bound $\lVert S\rVert_\infty \ge \lvert z+p\rvert/\lvert z-p\rvert$ need internal stability, and what does it become if there is an RHP zero but no unstable pole?
:::

::: answer
Internal stability is what forces $L$ to keep both the zero at $z$ and the pole at $p$. A controller allowed to cancel them would break the interpolation conditions, and with them the whole argument. Internal stability is also what makes $S$ analytic in the right half plane, which the maximum modulus principle needs.

With an RHP zero and no unstable pole, $S$ has no forced zero. There is no Blaschke factor to divide out, $\tilde{S} = S$, and the argument gives only $\lVert S\rVert_\infty \ge \lvert S(z)\rvert = 1$ — no useful limit on the peak.

The zero still limits bandwidth, through the weighted version $\lVert W_1S\rVert_\infty \ge \lvert W_1(z)\rvert$, which is where $\omega_B \le z/2$ comes from. The peak bound needs both features: it is the *interaction* between them that hurts.
:::

::: check
A design with a stable open loop achieves $\lvert S\rvert \le 0.01$ from $0$ to $1\,\mathrm{rad/s}$, and $\lvert S\rvert \approx 1$ above $10\,\mathrm{rad/s}$. What does the Bode integral say about the peak in between?
:::

::: answer
The open loop is stable, so $\int_0^\infty\ln\lvert S\rvert\,d\omega = 0$, provided the relative degree is at least two.

The low band contributes at most $\ln(0.01)\times 1 = -4.605$. That negative area must be canceled exactly by positive area. There are $10 - 1 = 9\,\mathrm{rad/s}$ between $1$ and $10$ to hold it, so the average of $\ln\lvert S\rvert$ there is at least $4.605/9 = 0.512$. That means an average $\lvert S\rvert$ of $e^{0.512} = 1.67$, and a peak of at least that.

If the roll-off were faster, so that $\lvert S\rvert$ returned to one by $4\,\mathrm{rad/s}$, the same area would need $\ln M_s \ge 4.605/3 = 1.535$, a peak of at least $e^{1.535} = 4.64$ — a badly behaved loop.

Deep rejection over a wide band needs a wide band in which to pay for it. A roll-off that is too abrupt is a hidden cause of sensitivity peaking.
:::

::: check
On a multivariable vehicle, the RHP zero has output direction $\mathbf{y}_z = (1, 0)^\mathsf{T}$ and the unstable pole has output direction $\mathbf{y}_p = (0, 1)^\mathsf{T}$. What happens to the peak bound, and why?
:::

::: answer
The directions are orthogonal: $\mathbf{y}_z^\mathsf{H}\mathbf{y}_p = 1\times 0 + 0\times 1 = 0$. So the constraints $\mathbf{y}_z^\mathsf{H}\mathbf{S}(z) = \mathbf{y}_z^\mathsf{H}$ and $\mathbf{S}(p)\mathbf{y}_p = \mathbf{0}$ act on different output channels. The first says the first row of $\mathbf{S}$ equals $(1, 0)$ at $s = z$. The second says the second column of $\mathbf{S}$ vanishes at $s = p$.

Nothing forces a single scalar function to satisfy both. The Blaschke argument no longer applies, and the bound relaxes to $\lVert\mathbf{S}\rVert_\infty \ge 1$ — no penalty.

Physically: the slow, awkward direction imposed by the zero and the urgent direction imposed by the unstable pole are different directions of the vehicle, so the controller can be fast in one and slow in the other. If the directions line up, the full scalar bound applies.

This is one of the few places where being multivariable *helps*, and it is a real design lever: choosing where to put a sensor changes the zero's direction as well as its frequency.
:::

::: check
A guidance engineer asks whether a faster inner loop would reduce the undershoot caused by an RHP zero at $z = 4\,\mathrm{rad/s}$. Answer with the identity.
:::

::: answer
No, and the identity says so directly. $\int_0^\infty y(t)e^{-zt}dt = 0$ holds for *any* internally stabilizing controller, because it follows from $T(z) = 0$, which follows from the zero being in the plant.

Making the loop faster shortens $\tau$, the time by which the response has settled. The bound $y_{us} \ge (1-\varepsilon)/(e^{z\tau}-1)$ then gets *larger*. At $z = 4$, settling to five percent in $1\,\mathrm{s}$ needs at least $0.95/(e^4 - 1) = 0.95/53.6 = 0.0177$. Settling in $0.3\,\mathrm{s}$ needs at least $0.95/(e^{1.2}-1) = 0.409$.

A faster loop trades a shorter wrong-way excursion for a much deeper one. The only ways to reduce undershoot are to accept slower settling, or to remove the zero by changing the sensor or actuator arrangement that produced it.
:::

## Summary

| Item | Statement |
| --- | --- |
| Interpolation | $S(z) = 1$, $T(z) = 0$ at RHP zeros; $T(p) = 1$, $S(p) = 0$ at RHP poles; structural |
| MIMO form | $\mathbf{y}_z^\mathsf{H}\mathbf{S}(z) = \mathbf{y}_z^\mathsf{H}$, $\mathbf{S}(p)\mathbf{y}_p = \mathbf{0}$; orthogonal directions remove the penalty |
| Peak bound | $\lVert S\rVert_\infty \ge \lvert z+p\rvert/\lvert z-p\rvert$, same for $\lVert T\rVert_\infty$; via Blaschke factor and maximum modulus |
| Bandwidth window | $2p \lesssim \omega_B \lesssim z/2$; feasible designs need $z/p \gtrsim 4$; $z < p$ is effectively impossible |
| Bode integral | $\int_0^\infty\ln\lvert S\rvert\,d\omega = \pi\sum\operatorname{Re}p_i$ for relative degree $\ge 2$ |
| Waterbed | rejection below crossover is paid for as amplification above it; instability adds a fixed extra area |
| Undershoot identity | $\int_0^\infty y(t)e^{-zt}dt = 0$ for a step response with $T(z) = 0$ |
| Undershoot bound | $y_{us} \ge (1-\varepsilon)/(e^{z\tau}-1)$ for settling to within $\varepsilon$ by $\tau$ |
| Booster example | $p = 0.477\,\mathrm{rad/s}$; $z = 2.5$ gives $\lVert S\rVert_\infty \ge 1.47$ and a window $0.955$ to $1.25\,\mathrm{rad/s}$; $z = 1.5$ closes the window |
| Waterbed example | $\lvert S\rvert \le 0.1$ below $0.5\,\mathrm{rad/s}$ with recovery by $5\,\mathrm{rad/s}$ forces a peak of at least $1.80$ |

The next lesson leaves the single frozen operating point behind. A launch vehicle's plant changes all through its flight, and designing a controller for each condition and blending between them is a practice with a well-known failure mode and a well-developed remedy.

::: context aero-instability Why a rocket is aerodynamically unstable
Air pushes on a rocket at its **center of pressure**. On most launch vehicles that point sits *ahead* of the center of gravity. So when the nose tilts a little off the airflow, the air pushes it further off — like trying to throw a dart backwards. The strength of that push, per unit of tilt, is $\mu_\alpha$ (units $\mathrm{s^{-2}}$), and it makes the tilt grow like $e^{\sqrt{\mu_\alpha}\,t}$. It peaks near maximum dynamic pressure, a minute or so into flight, which is why that is where the control loop is hardest.
:::

::: context rhp-picture Poles and zeros on the map
The complex plane is the map where poles and zeros live. The left half is the calm side: modes there die away. The right half is the unstable side.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="70" y="15" width="279.0" height="130" fill="#f2b880" fill-opacity="0.25"/>
  <line x1="10" y1="80" x2="352" y2="80" stroke="#1f2a44"/>
  <line x1="70" y1="15" x2="70" y2="145" stroke="#1f2a44"/>
  <text x="209.5" y="30" font-size="12" text-anchor="middle" fill="#1f2a44">right half plane (unstable side)</text>
  <text x="34.0" y="30" font-size="12" text-anchor="middle" fill="#1f2a44">left half</text>
  <g stroke="#b4232c" stroke-width="2.5"><line x1="107.0" y1="74" x2="119.0" y2="86"/><line x1="107.0" y1="86" x2="119.0" y2="74"/></g>
  <circle cx="295.0" cy="80" r="6" fill="#fff" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="205.0" cy="80" r="6" fill="#fff" stroke="#6c7a93" stroke-width="2" stroke-dasharray="3,2"/>
  <text x="113.0" y="104" font-size="11" text-anchor="middle" fill="#b4232c">p = 0.477</text>
  <text x="295.0" y="104" font-size="11" text-anchor="middle" fill="#1d6fd1">z = 2.5</text>
  <text x="205.0" y="104" font-size="11" text-anchor="middle" fill="#6c7a93">z = 1.5</text>
  <text x="66" y="96" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <g font-size="11" fill="#1f2a44" text-anchor="middle"><line x1="160" y1="77" x2="160" y2="83" stroke="#1f2a44"/><line x1="250" y1="77" x2="250" y2="83" stroke="#1f2a44"/><line x1="340" y1="77" x2="340" y2="83" stroke="#1f2a44"/><text x="160" y="120">1</text><text x="250" y="120">2</text><text x="340" y="120">3</text></g>
  <text x="352" y="72" font-size="11" text-anchor="end" fill="#1f2a44">Re s</text>
</svg>
```

This is the booster example to scale: the unstable pole at $0.477$ (cross), the zero at $2.5$ (solid circle), and where the zero moves to, $1.5$, if the sensor goes forward (dashed). The closer the zero crowds the pole, the worse every bound in this lesson gets.
:::

::: context internal-stability Internal stability
A loop is **internally stable** when *every* signal inside it stays bounded — not only the output you are watching, but also the controller's command, the actuator position, everything. It is possible to build a loop whose output transfer function looks stable while an internal signal quietly grows, because an unstable factor was canceled between plant and controller. Internal stability rules that out, and that is exactly why the plant's unstable poles and RHP zeros must survive into $L$.
:::

::: context blaschke The Blaschke factor
Named after the Austrian mathematician Wilhelm Blaschke, who studied products of such factors in 1915. $B_p(s) = (s - p)/(s + p)$ is what engineers call an **all-pass** filter: on the imaginary axis its size is always exactly one, so it changes only phase, never gain. That makes it the perfect tool for "removing" a zero at $p$ from a function without changing its size anywhere you can measure.
:::

::: context maximum-modulus The maximum modulus principle
Think of a tent. The fabric is lifted only at its edges and poles; with no pole inside, the fabric sags, and its highest point is on the edge. An analytic function behaves like that fabric: with no poles inside a region, its largest size is on the region's boundary. For stable transfer functions the region is the right half plane and the boundary is the imaginary axis — the frequencies you can measure. So the value at $z$, inside, can never beat the peak along the edge.
:::

::: context window-picture The window, drawn as a number line
Put frequency on a line. The unstable pole says "your bandwidth must be to the right of $2p$". The RHP zero says "your bandwidth must be to the left of $z/2$". If $2p < z/2$ there is a gap between them where the bandwidth can go. If $2p > z/2$ — that is, if $z/p < 4$ — the two arrows overlap in the wrong way, and no bandwidth satisfies both. Both "2"s are working rules, not laws, which is why the rule says "about four".
:::

::: context wrong-way-sensor How a sensor's position can make a wrong-way response
One way this happens: a sideways push at the tail of a long body moves the center of gravity in the push's direction, but also rotates the body, swinging the nose the *other* way. A sensor near the tail feels the push direction. A sensor far enough forward — past a point called the **center of percussion** — feels the nose swing first, the wrong way. That wrong-way start is the fingerprint of an RHP zero, and it comes from the sensor's position, not from any controller.
:::

::: context bode-integral-history Where the integral comes from
Hendrik Bode derived the stable-loop version at Bell Telephone Laboratories while designing feedback amplifiers for long-distance telephone lines, and published it in his 1945 book *Network Analysis and Feedback Amplifier Design*. The extra term for unstable open loops was worked out later; Freudenberg and Looze gave the general form, with the RHP-pole penalty, in 1985. Engineers call it the waterbed effect because of exactly the picture at the start of this section.
:::

::: context waterbed-picture The waterbed on the booster loop
Here is $\ln\lvert S\rvert$ for the booster loop used in the check above. The blue area below zero is disturbance rejection. The orange area above is amplification.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <polygon points="40.1,95 40.1,168.2 41.2,168.0 42.4,167.5 43.6,166.7 44.8,165.7 45.9,164.3 47.1,162.7 48.3,160.8 49.5,158.7 50.6,156.4 51.8,153.9 53.0,151.3 54.2,148.5 55.4,145.6 56.5,142.6 57.7,139.5 58.9,136.4 60.1,133.3 61.2,130.1 62.4,126.9 63.6,123.7 64.8,120.6 66.0,117.5 67.1,114.4 68.3,111.4 69.5,108.5 70.7,105.8 71.8,103.1 73.0,100.5 74.2,98.1 75.4,95.8 75.4,95" fill="#8fb8f0" fill-opacity="0.6"/><polygon points="76.6,95 76.6,93.6 77.7,91.6 78.9,89.8 80.1,88.1 81.3,86.5 82.4,85.1 83.6,83.9 84.8,82.8 86.0,81.8 87.1,81.0 88.3,80.2 89.5,79.6 90.7,79.1 91.9,78.7 93.0,78.4 94.2,78.1 95.4,77.9 96.6,77.8 97.7,77.7 98.9,77.6 100.1,77.7 101.3,77.7 102.5,77.8 103.6,77.8 104.8,78.0 106.0,78.1 107.2,78.2 108.3,78.4 109.5,78.6 110.7,78.8 111.9,78.9 113.1,79.1 114.2,79.3 115.4,79.5 116.6,79.7 117.8,79.9 118.9,80.1 120.1,80.3 121.3,80.5 122.5,80.7 123.6,80.9 124.8,81.1 126.0,81.2 127.2,81.4 128.4,81.6 129.5,81.8 130.7,81.9 131.9,82.1 133.1,82.3 134.2,82.4 135.4,82.6 136.6,82.8 137.8,82.9 139.0,83.1 140.1,83.2 141.3,83.3 142.5,83.5 143.7,83.6 144.8,83.7 146.0,83.9 147.2,84.0 148.4,84.1 149.5,84.2 150.7,84.4 151.9,84.5 153.1,84.6 154.3,84.7 155.4,84.8 156.6,84.9 157.8,85.0 159.0,85.1 160.1,85.2 161.3,85.3 162.5,85.4 163.7,85.5 164.9,85.5 166.0,85.6 167.2,85.7 168.4,85.8 169.6,85.9 170.7,86.0 171.9,86.0 173.1,86.1 174.3,86.2 175.5,86.3 176.6,86.3 177.8,86.4 179.0,86.5 180.2,86.5 181.3,86.6 182.5,86.6 183.7,86.7 184.9,86.8 186.0,86.8 187.2,86.9 188.4,86.9 189.6,87.0 190.8,87.0 191.9,87.1 193.1,87.1 194.3,87.2 195.5,87.2 196.6,87.3 197.8,87.3 199.0,87.4 200.2,87.4 201.4,87.5 202.5,87.5 203.7,87.6 204.9,87.6 206.1,87.6 207.2,87.7 208.4,87.7 209.6,87.8 210.8,87.8 212.0,87.8 213.1,87.9 214.3,87.9 215.5,87.9 216.7,88.0 217.8,88.0 219.0,88.0 220.2,88.1 221.4,88.1 222.5,88.1 223.7,88.2 224.9,88.2 226.1,88.2 227.3,88.3 228.4,88.3 229.6,88.3 230.8,88.3 232.0,88.4 233.1,88.4 234.3,88.4 235.5,88.5 236.7,88.5 237.9,88.5 239.0,88.5 240.2,88.5 241.4,88.6 242.6,88.6 243.7,88.6 244.9,88.6 246.1,88.7 247.3,88.7 248.5,88.7 249.6,88.7 250.8,88.8 252.0,88.8 253.2,88.8 254.3,88.8 255.5,88.8 256.7,88.9 257.9,88.9 259.0,88.9 260.2,88.9 261.4,88.9 262.6,88.9 263.8,89.0 264.9,89.0 266.1,89.0 267.3,89.0 268.5,89.0 269.6,89.0 270.8,89.1 272.0,89.1 273.2,89.1 274.4,89.1 275.5,89.1 276.7,89.1 277.9,89.2 279.1,89.2 280.2,89.2 281.4,89.2 282.6,89.2 283.8,89.2 285.0,89.2 286.1,89.3 287.3,89.3 288.5,89.3 289.7,89.3 290.8,89.3 292.0,89.3 293.2,89.3 294.4,89.3 295.5,89.4 296.7,89.4 297.9,89.4 299.1,89.4 300.3,89.4 301.4,89.4 302.6,89.4 303.8,89.4 305.0,89.4 306.1,89.5 307.3,89.5 308.5,89.5 309.7,89.5 310.9,89.5 312.0,89.5 313.2,89.5 314.4,89.5 315.6,89.5 316.7,89.5 317.9,89.6 319.1,89.6 320.3,89.6 321.5,89.6 322.6,89.6 323.8,89.6 325.0,89.6 326.2,89.6 327.3,89.6 328.5,89.6 329.7,89.6 330.9,89.7 332.0,89.7 333.2,89.7 334.4,89.7 335.6,89.7 336.8,89.7 337.9,89.7 339.1,89.7 340.3,89.7 341.5,89.7 342.6,89.7 343.8,89.7 345.0,89.8 345.0,95" fill="#f2b880" fill-opacity="0.6"/>
  <line x1="40" y1="95" x2="345" y2="95" stroke="#1f2a44"/>
  <line x1="40" y1="15" x2="40" y2="185" stroke="#1f2a44"/>
  <polyline points="40.1,168.2 41.2,168.0 42.4,167.5 43.6,166.7 44.8,165.7 45.9,164.3 47.1,162.7 48.3,160.8 49.5,158.7 50.6,156.4 51.8,153.9 53.0,151.3 54.2,148.5 55.4,145.6 56.5,142.6 57.7,139.5 58.9,136.4 60.1,133.3 61.2,130.1 62.4,126.9 63.6,123.7 64.8,120.6 66.0,117.5 67.1,114.4 68.3,111.4 69.5,108.5 70.7,105.8 71.8,103.1 73.0,100.5 74.2,98.1 75.4,95.8 76.6,93.6 77.7,91.6 78.9,89.8 80.1,88.1 81.3,86.5 82.4,85.1 83.6,83.9 84.8,82.8 86.0,81.8 87.1,81.0 88.3,80.2 89.5,79.6 90.7,79.1 91.9,78.7 93.0,78.4 94.2,78.1 95.4,77.9 96.6,77.8 97.7,77.7 98.9,77.6 100.1,77.7 101.3,77.7 102.5,77.8 103.6,77.8 104.8,78.0 106.0,78.1 107.2,78.2 108.3,78.4 109.5,78.6 110.7,78.8 111.9,78.9 113.1,79.1 114.2,79.3 115.4,79.5 116.6,79.7 117.8,79.9 118.9,80.1 120.1,80.3 121.3,80.5 122.5,80.7 123.6,80.9 124.8,81.1 126.0,81.2 127.2,81.4 128.4,81.6 129.5,81.8 130.7,81.9 131.9,82.1 133.1,82.3 134.2,82.4 135.4,82.6 136.6,82.8 137.8,82.9 139.0,83.1 140.1,83.2 141.3,83.3 142.5,83.5 143.7,83.6 144.8,83.7 146.0,83.9 147.2,84.0 148.4,84.1 149.5,84.2 150.7,84.4 151.9,84.5 153.1,84.6 154.3,84.7 155.4,84.8 156.6,84.9 157.8,85.0 159.0,85.1 160.1,85.2 161.3,85.3 162.5,85.4 163.7,85.5 164.9,85.5 166.0,85.6 167.2,85.7 168.4,85.8 169.6,85.9 170.7,86.0 171.9,86.0 173.1,86.1 174.3,86.2 175.5,86.3 176.6,86.3 177.8,86.4 179.0,86.5 180.2,86.5 181.3,86.6 182.5,86.6 183.7,86.7 184.9,86.8 186.0,86.8 187.2,86.9 188.4,86.9 189.6,87.0 190.8,87.0 191.9,87.1 193.1,87.1 194.3,87.2 195.5,87.2 196.6,87.3 197.8,87.3 199.0,87.4 200.2,87.4 201.4,87.5 202.5,87.5 203.7,87.6 204.9,87.6 206.1,87.6 207.2,87.7 208.4,87.7 209.6,87.8 210.8,87.8 212.0,87.8 213.1,87.9 214.3,87.9 215.5,87.9 216.7,88.0 217.8,88.0 219.0,88.0 220.2,88.1 221.4,88.1 222.5,88.1 223.7,88.2 224.9,88.2 226.1,88.2 227.3,88.3 228.4,88.3 229.6,88.3 230.8,88.3 232.0,88.4 233.1,88.4 234.3,88.4 235.5,88.5 236.7,88.5 237.9,88.5 239.0,88.5 240.2,88.5 241.4,88.6 242.6,88.6 243.7,88.6 244.9,88.6 246.1,88.7 247.3,88.7 248.5,88.7 249.6,88.7 250.8,88.8 252.0,88.8 253.2,88.8 254.3,88.8 255.5,88.8 256.7,88.9 257.9,88.9 259.0,88.9 260.2,88.9 261.4,88.9 262.6,88.9 263.8,89.0 264.9,89.0 266.1,89.0 267.3,89.0 268.5,89.0 269.6,89.0 270.8,89.1 272.0,89.1 273.2,89.1 274.4,89.1 275.5,89.1 276.7,89.1 277.9,89.2 279.1,89.2 280.2,89.2 281.4,89.2 282.6,89.2 283.8,89.2 285.0,89.2 286.1,89.3 287.3,89.3 288.5,89.3 289.7,89.3 290.8,89.3 292.0,89.3 293.2,89.3 294.4,89.3 295.5,89.4 296.7,89.4 297.9,89.4 299.1,89.4 300.3,89.4 301.4,89.4 302.6,89.4 303.8,89.4 305.0,89.4 306.1,89.5 307.3,89.5 308.5,89.5 309.7,89.5 310.9,89.5 312.0,89.5 313.2,89.5 314.4,89.5 315.6,89.5 316.7,89.5 317.9,89.6 319.1,89.6 320.3,89.6 321.5,89.6 322.6,89.6 323.8,89.6 325.0,89.6 326.2,89.6 327.3,89.6 328.5,89.6 329.7,89.6 330.9,89.7 332.0,89.7 333.2,89.7 334.4,89.7 335.6,89.7 336.8,89.7 337.9,89.7 339.1,89.7 340.3,89.7 341.5,89.7 342.6,89.7 343.8,89.7 345.0,89.8" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle"><line x1="90.8" y1="95" x2="90.8" y2="99" stroke="#1f2a44"/><text x="90.8" y="111">1</text><line x1="141.7" y1="95" x2="141.7" y2="99" stroke="#1f2a44"/><text x="141.7" y="111">2</text><line x1="192.5" y1="95" x2="192.5" y2="99" stroke="#1f2a44"/><text x="192.5" y="111">3</text><line x1="243.3" y1="95" x2="243.3" y2="99" stroke="#1f2a44"/><text x="243.3" y="111">4</text><line x1="294.2" y1="95" x2="294.2" y2="99" stroke="#1f2a44"/><text x="294.2" y="111">5</text><line x1="345.0" y1="95" x2="345.0" y2="99" stroke="#1f2a44"/><text x="345.0" y="111">6</text></g>
  <g font-size="11" fill="#1f2a44" text-anchor="end"><line x1="36" y1="155.0" x2="40" y2="155.0" stroke="#1f2a44"/><text x="34" y="159.0">-1</text><line x1="36" y1="95.0" x2="40" y2="95.0" stroke="#1f2a44"/><text x="34" y="99.0">0</text><line x1="36" y1="35.0" x2="40" y2="35.0" stroke="#1f2a44"/><text x="34" y="39.0">1</text></g>
  <text x="80.7" y="140" font-size="11" fill="#1d6fd1">rejection (area below)</text>
  <text x="202.7" y="55" font-size="11" text-anchor="middle" fill="#1f2a44">amplification (area above)</text>
  <text x="263.7" y="157" font-size="11" text-anchor="middle" fill="#1f2a44">thin tail continues past 6 rad/s</text>
  <text x="345" y="125" font-size="11" text-anchor="end" fill="#1f2a44">ω (rad/s)</text>
  <text x="46" y="22" font-size="11" fill="#1f2a44">ln |S|</text>
</svg>
```

The orange area minus the blue area equals $\pi p = 1.50$ exactly. Most of the orange is not in the hump near $1\,\mathrm{rad/s}$ but in a long, thin tail that stretches out toward the actuator at $20\,\mathrm{rad/s}$. That tail is the "spread the penalty over a wide band" trick in action.
:::

::: context undershoot-picture The wrong-way start
The step response from the code, with an RHP zero at $6\,\mathrm{rad/s}$:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="45" y1="148.6" x2="345" y2="148.6" stroke="#1f2a44"/>
  <line x1="45" y1="20" x2="45" y2="170" stroke="#1f2a44"/>
  <line x1="45" y1="41.4" x2="345" y2="41.4" stroke="#6c7a93" stroke-dasharray="4,3"/>
  <polyline points="45.0,148.6 45.4,148.9 45.8,149.3 46.1,149.6 46.5,149.9 46.9,150.2 47.3,150.4 47.6,150.7 48.0,150.9 48.4,151.1 48.8,151.4 49.1,151.6 49.5,151.7 49.9,151.9 50.3,152.1 50.6,152.2 51.0,152.3 51.4,152.5 51.8,152.6 52.1,152.6 52.5,152.7 52.9,152.8 53.3,152.8 53.6,152.9 54.0,152.9 54.4,152.9 54.8,152.9 55.1,152.9 55.5,152.9 55.9,152.9 56.3,152.8 56.6,152.8 57.0,152.7 57.4,152.7 57.8,152.6 58.1,152.5 58.5,152.4 58.9,152.3 59.3,152.2 59.6,152.1 60.0,151.9 60.4,151.8 60.8,151.6 61.1,151.5 61.5,151.3 61.9,151.1 62.3,150.9 62.6,150.7 63.0,150.5 63.4,150.3 63.8,150.1 64.1,149.9 64.5,149.7 64.9,149.4 65.3,149.2 65.7,148.9 66.0,148.7 66.4,148.4 66.8,148.1 67.2,147.9 67.5,147.6 67.9,147.3 68.3,147.0 68.7,146.7 69.0,146.4 69.4,146.1 69.8,145.7 70.2,145.4 70.5,145.1 70.9,144.8 71.3,144.4 71.7,144.1 72.0,143.7 72.4,143.4 72.8,143.0 73.2,142.7 73.5,142.3 73.9,141.9 74.3,141.5 74.7,141.2 75.0,140.8 75.4,140.4 75.8,140.0 76.2,139.6 76.5,139.2 76.9,138.8 77.3,138.4 77.7,138.0 78.0,137.6 78.4,137.2 78.8,136.8 79.2,136.3 79.5,135.9 79.9,135.5 80.3,135.1 80.7,134.6 81.0,134.2 81.4,133.8 81.8,133.3 82.2,132.9 82.5,132.5 82.9,132.0 83.3,131.6 83.7,131.1 84.0,130.7 84.4,130.2 84.8,129.8 85.2,129.3 85.6,128.9 85.9,128.4 86.3,127.9 86.7,127.5 87.1,127.0 87.4,126.6 87.8,126.1 88.2,125.6 88.6,125.2 88.9,124.7 89.3,124.2 89.7,123.8 90.1,123.3 90.4,122.8 90.8,122.4 91.2,121.9 91.6,121.4 91.9,120.9 92.3,120.5 92.7,120.0 93.1,119.5 93.4,119.1 93.8,118.6 94.2,118.1 94.6,117.6 94.9,117.2 95.3,116.7 95.7,116.2 96.1,115.7 96.4,115.3 96.8,114.8 97.2,114.3 97.6,113.9 97.9,113.4 98.3,112.9 98.7,112.4 99.1,112.0 99.4,111.5 99.8,111.0 100.2,110.6 100.6,110.1 100.9,109.6 101.3,109.1 101.7,108.7 102.1,108.2 102.4,107.8 102.8,107.3 103.2,106.8 103.6,106.4 103.9,105.9 104.3,105.4 104.7,105.0 105.1,104.5 105.5,104.1 105.8,103.6 106.2,103.1 106.6,102.7 107.0,102.2 107.3,101.8 107.7,101.3 108.1,100.9 108.5,100.4 108.8,100.0 109.2,99.5 109.6,99.1 110.0,98.7 110.3,98.2 110.7,97.8 111.1,97.3 111.5,96.9 111.8,96.5 112.2,96.0 112.6,95.6 113.0,95.2 113.3,94.7 113.7,94.3 114.1,93.9 114.5,93.4 114.8,93.0 115.2,92.6 115.6,92.2 116.0,91.8 116.3,91.3 116.7,90.9 117.1,90.5 117.5,90.1 117.8,89.7 118.2,89.3 118.6,88.9 119.0,88.5 119.3,88.1 119.7,87.7 120.1,87.3 120.5,86.9 120.8,86.5 121.2,86.1 121.6,85.7 122.0,85.3 122.3,84.9 122.7,84.5 123.1,84.1 123.5,83.7 123.8,83.3 124.2,83.0 124.6,82.6 125.0,82.2 125.4,81.8 125.7,81.5 126.1,81.1 126.5,80.7 126.9,80.4 127.2,80.0 127.6,79.6 128.0,79.3 128.4,78.9 128.7,78.6 129.1,78.2 129.5,77.8 129.9,77.5 130.2,77.1 130.6,76.8 131.0,76.5 131.4,76.1 131.7,75.8 132.1,75.4 132.5,75.1 132.9,74.8 133.2,74.4 133.6,74.1 134.0,73.8 134.4,73.4 134.7,73.1 135.1,72.8 135.5,72.5 135.9,72.2 136.2,71.8 136.6,71.5 137.0,71.2 137.4,70.9 137.7,70.6 138.1,70.3 138.5,70.0 138.9,69.7 139.2,69.4 139.6,69.1 140.0,68.8 140.4,68.5 140.7,68.2 141.1,67.9 141.5,67.6 141.9,67.3 142.2,67.0 142.6,66.8 143.0,66.5 143.4,66.2 143.7,65.9 144.1,65.7 144.5,65.4 144.9,65.1 145.3,64.8 145.6,64.6 146.0,64.3 146.4,64.0 146.8,63.8 147.1,63.5 147.5,63.3 147.9,63.0 148.3,62.8 148.6,62.5 149.0,62.3 149.4,62.0 149.8,61.8 150.1,61.5 150.5,61.3 150.9,61.0 151.3,60.8 151.6,60.6 152.0,60.3 152.4,60.1 152.8,59.9 153.1,59.6 153.5,59.4 153.9,59.2 154.3,59.0 154.6,58.7 155.0,58.5 155.4,58.3 155.8,58.1 156.1,57.9 156.5,57.7 156.9,57.4 157.3,57.2 157.6,57.0 158.0,56.8 158.4,56.6 158.8,56.4 159.1,56.2 159.5,56.0 159.9,55.8 160.3,55.6 160.6,55.4 161.0,55.2 161.4,55.0 161.8,54.9 162.1,54.7 162.5,54.5 162.9,54.3 163.3,54.1 163.6,53.9 164.0,53.8 164.4,53.6 164.8,53.4 165.2,53.2 165.5,53.1 165.9,52.9 166.3,52.7 166.7,52.5 167.0,52.4 167.4,52.2 167.8,52.1 168.2,51.9 168.5,51.7 168.9,51.6 169.3,51.4 169.7,51.3 170.0,51.1 170.4,51.0 170.8,50.8 171.2,50.7 171.5,50.5 171.9,50.4 172.3,50.2 172.7,50.1 173.0,49.9 173.4,49.8 173.8,49.6 174.2,49.5 174.5,49.4 174.9,49.2 175.3,49.1 175.7,49.0 176.0,48.8 176.4,48.7 176.8,48.6 177.2,48.5 177.5,48.3 177.9,48.2 178.3,48.1 178.7,48.0 179.0,47.8 179.4,47.7 179.8,47.6 180.2,47.5 180.5,47.4 180.9,47.2 181.3,47.1 181.7,47.0 182.0,46.9 182.4,46.8 182.8,46.7 183.2,46.6 183.5,46.5 183.9,46.4 184.3,46.3 184.7,46.2 185.1,46.1 185.4,46.0 185.8,45.9 186.2,45.8 186.6,45.7 186.9,45.6 187.3,45.5 187.7,45.4 188.1,45.3 188.4,45.2 188.8,45.1 189.2,45.0 189.6,44.9 189.9,44.9 190.3,44.8 190.7,44.7 191.1,44.6 191.4,44.5 191.8,44.4 192.2,44.4 192.6,44.3 192.9,44.2 193.3,44.1 193.7,44.0 194.1,44.0 194.4,43.9 194.8,43.8 195.2,43.7 195.6,43.7 195.9,43.6 196.3,43.5 196.7,43.5 197.1,43.4 197.4,43.3 197.8,43.3 198.2,43.2 198.6,43.1 198.9,43.1 199.3,43.0 199.7,42.9 200.1,42.9 200.4,42.8 200.8,42.8 201.2,42.7 201.6,42.6 201.9,42.6 202.3,42.5 202.7,42.5 203.1,42.4 203.4,42.4 203.8,42.3 204.2,42.3 204.6,42.2 204.9,42.1 205.3,42.1 205.7,42.0 206.1,42.0 206.5,42.0 206.8,41.9 207.2,41.9 207.6,41.8 208.0,41.8 208.3,41.7 208.7,41.7 209.1,41.6 209.5,41.6 209.8,41.5 210.2,41.5 210.6,41.5 211.0,41.4 211.3,41.4 211.7,41.3 212.1,41.3 212.5,41.3 212.8,41.2 213.2,41.2 213.6,41.2 214.0,41.1 214.3,41.1 214.7,41.1 215.1,41.0 215.5,41.0 215.8,41.0 216.2,40.9 216.6,40.9 217.0,40.9 217.3,40.8 217.7,40.8 218.1,40.8 218.5,40.7 218.8,40.7 219.2,40.7 219.6,40.7 220.0,40.6 220.3,40.6 220.7,40.6 221.1,40.6 221.5,40.5 221.8,40.5 222.2,40.5 222.6,40.5 223.0,40.4 223.3,40.4 223.7,40.4 224.1,40.4 224.5,40.4 224.8,40.3 225.2,40.3 225.6,40.3 226.0,40.3 226.4,40.3 226.7,40.2 227.1,40.2 227.5,40.2 227.9,40.2 228.2,40.2 228.6,40.2 229.0,40.1 229.4,40.1 229.7,40.1 230.1,40.1 230.5,40.1 230.9,40.1 231.2,40.1 231.6,40.0 232.0,40.0 232.4,40.0 232.7,40.0 233.1,40.0 233.5,40.0 233.9,40.0 234.2,40.0 234.6,39.9 235.0,39.9 235.4,39.9 235.7,39.9 236.1,39.9 236.5,39.9 236.9,39.9 237.2,39.9 237.6,39.9 238.0,39.9 238.4,39.9 238.7,39.8 239.1,39.8 239.5,39.8 239.9,39.8 240.2,39.8 240.6,39.8 241.0,39.8 241.4,39.8 241.7,39.8 242.1,39.8 242.5,39.8 242.9,39.8 243.2,39.8 243.6,39.8 244.0,39.8 244.4,39.8 244.7,39.8 245.1,39.8 245.5,39.8 245.9,39.8 246.3,39.8 246.6,39.8 247.0,39.7 247.4,39.7 247.8,39.7 248.1,39.7 248.5,39.7 248.9,39.7 249.3,39.7 249.6,39.7 250.0,39.7 250.4,39.7 250.8,39.7 251.1,39.7 251.5,39.7 251.9,39.7 252.3,39.7 252.6,39.7 253.0,39.7 253.4,39.7 253.8,39.7 254.1,39.7 254.5,39.7 254.9,39.7 255.3,39.7 255.6,39.7 256.0,39.8 256.4,39.8 256.8,39.8 257.1,39.8 257.5,39.8 257.9,39.8 258.3,39.8 258.6,39.8 259.0,39.8 259.4,39.8 259.8,39.8 260.1,39.8 260.5,39.8 260.9,39.8 261.3,39.8 261.6,39.8 262.0,39.8 262.4,39.8 262.8,39.8 263.1,39.8 263.5,39.8 263.9,39.8 264.3,39.8 264.6,39.8 265.0,39.8 265.4,39.8 265.8,39.8 266.2,39.8 266.5,39.9 266.9,39.9 267.3,39.9 267.7,39.9 268.0,39.9 268.4,39.9 268.8,39.9 269.2,39.9 269.5,39.9 269.9,39.9 270.3,39.9 270.7,39.9 271.0,39.9 271.4,39.9 271.8,39.9 272.2,39.9 272.5,39.9 272.9,39.9 273.3,40.0 273.7,40.0 274.0,40.0 274.4,40.0 274.8,40.0 275.2,40.0 275.5,40.0 275.9,40.0 276.3,40.0 276.7,40.0 277.0,40.0 277.4,40.0 277.8,40.0 278.2,40.0 278.5,40.0 278.9,40.0 279.3,40.1 279.7,40.1 280.0,40.1 280.4,40.1 280.8,40.1 281.2,40.1 281.5,40.1 281.9,40.1 282.3,40.1 282.7,40.1 283.0,40.1 283.4,40.1 283.8,40.1 284.2,40.1 284.5,40.2 284.9,40.2 285.3,40.2 285.7,40.2 286.1,40.2 286.4,40.2 286.8,40.2 287.2,40.2 287.6,40.2 287.9,40.2 288.3,40.2 288.7,40.2 289.1,40.2 289.4,40.2 289.8,40.3 290.2,40.3 290.6,40.3 290.9,40.3 291.3,40.3 291.7,40.3 292.1,40.3 292.4,40.3 292.8,40.3 293.2,40.3 293.6,40.3 293.9,40.3 294.3,40.3 294.7,40.3 295.1,40.4 295.4,40.4 295.8,40.4 296.2,40.4 296.6,40.4 296.9,40.4 297.3,40.4 297.7,40.4 298.1,40.4 298.4,40.4 298.8,40.4 299.2,40.4 299.6,40.4 299.9,40.4 300.3,40.5 300.7,40.5 301.1,40.5 301.4,40.5 301.8,40.5 302.2,40.5 302.6,40.5 302.9,40.5 303.3,40.5 303.7,40.5 304.1,40.5 304.4,40.5 304.8,40.5 305.2,40.5 305.6,40.5 306.0,40.6 306.3,40.6 306.7,40.6 307.1,40.6 307.5,40.6 307.8,40.6 308.2,40.6 308.6,40.6 309.0,40.6 309.3,40.6 309.7,40.6 310.1,40.6 310.5,40.6 310.8,40.6 311.2,40.6 311.6,40.7 312.0,40.7 312.3,40.7 312.7,40.7 313.1,40.7 313.5,40.7 313.8,40.7 314.2,40.7 314.6,40.7 315.0,40.7 315.3,40.7 315.7,40.7 316.1,40.7 316.5,40.7 316.8,40.7 317.2,40.7 317.6,40.8 318.0,40.8 318.3,40.8 318.7,40.8 319.1,40.8 319.5,40.8 319.8,40.8 320.2,40.8 320.6,40.8 321.0,40.8 321.3,40.8 321.7,40.8 322.1,40.8 322.5,40.8 322.8,40.8 323.2,40.8 323.6,40.8 324.0,40.8 324.3,40.9 324.7,40.9 325.1,40.9 325.5,40.9 325.9,40.9 326.2,40.9 326.6,40.9 327.0,40.9 327.4,40.9 327.7,40.9 328.1,40.9 328.5,40.9 328.9,40.9 329.2,40.9 329.6,40.9 330.0,40.9 330.4,40.9 330.7,40.9 331.1,40.9 331.5,41.0 331.9,41.0 332.2,41.0 332.6,41.0 333.0,41.0 333.4,41.0 333.7,41.0 334.1,41.0 334.5,41.0 334.9,41.0 335.2,41.0 335.6,41.0 336.0,41.0 336.4,41.0 336.7,41.0 337.1,41.0 337.5,41.0 337.9,41.0 338.2,41.0 338.6,41.0 339.0,41.0 339.4,41.0 339.7,41.1 340.1,41.1 340.5,41.1 340.9,41.1 341.2,41.1 341.6,41.1 342.0,41.1 342.4,41.1 342.7,41.1 343.1,41.1 343.5,41.1 343.9,41.1 344.2,41.1 344.6,41.1 345.0,41.1" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="end"><text x="40" y="152.6">0</text><text x="40" y="45.4">1</text></g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle"><text x="120.0" y="186">1</text><text x="195.0" y="186">2</text><text x="270.0" y="186">3</text><text x="345.0" y="186">4</text></g>
  <text x="345" y="198" font-size="11" text-anchor="end" fill="#1f2a44">t (s)</text>
  <line x1="54.8" y1="152.9" x2="82.5" y2="162.5" stroke="#b4232c"/>
  <text x="84.0" y="166.5" font-size="11" fill="#b4232c">wrong way first: −4.1% at 0.13 s</text>
</svg>
```

It dips below zero before it climbs. The dip is small here because the response is slow compared with the zero. Ask it to settle much faster and the dip must get much deeper.
:::

::: context hidden-growth What goes wrong when you cancel
Suppose the plant has a pole at $+1$ and you put a controller zero exactly at $+1$. On paper the factor $(s - 1)$ cancels and the loop looks stable. But the plant's unstable mode is still there — you only stopped *looking* at it. Any disturbance that excites it, or any tiny error that puts your zero at $1.001$ instead of $1$, and that mode grows like $e^{t}$, doubling every $0.69\,\mathrm{s}$, until something saturates.
:::
