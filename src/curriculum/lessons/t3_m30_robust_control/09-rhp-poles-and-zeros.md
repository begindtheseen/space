---
id: l09-rhp-poles-and-zeros
title: What right-half-plane poles and zeros forbid
minutes: 21
covers:
  - Performance limitations imposed by right-half-plane poles and zeros
---

Everything so far has been about what a controller can be made to do. This lesson is about what no controller can do. A plant with a pole in the right half plane and a zero in the right half plane has a sensitivity peak bounded below by a number you can compute from those two locations alone, before any design work, and a bandwidth squeezed between a floor and a ceiling that may not leave room for anything. These are not conservative bounds from a conservative analysis — they are exact consequences of the algebra of stable rational functions, and they hold for linear, nonlinear, adaptive and learned controllers alike.

That matters most for launch vehicles, which routinely have both. The aerodynamic instability of a boosting rocket puts a pole at $\sqrt{\mu_\alpha}$, around half a radian per second at maximum dynamic pressure. Sensor placement, load-relief feedback from a forward accelerometer, and non-collocated rate gyros on a flexible body all produce right-half-plane zeros. Where the two are close together, the vehicle is hard to control in a way that no amount of design effort removes, and the correct engineering response is to move the sensor, change the aerodynamics, or accept a worse loop — not to iterate the controller.

This lesson derives the interpolation constraints that produce these bounds, turns them into the sensitivity peak bound and the bandwidth window, works the Bode sensitivity integral as a conservation law, and quantifies the undershoot that a right-half-plane zero forces on any step response.

## The interpolation constraints

Take a loop $L = GK$ that is internally stable, with $S = 1/(1+L)$ and $T = 1 - S$. Internal stability forbids cancelling an unstable pole or a right-half-plane zero between $G$ and $K$, so those factors survive into $L$. That single fact pins $S$ and $T$ at specific points.

At a **right-half-plane zero** $z$ of the plant: $L(z) = 0$, so

$$S(z) = 1, \qquad T(z) = 0.$$

At a **right-half-plane pole** $p$ of the plant: $L(p) = \infty$, so

$$S(p) = 0, \qquad T(p) = 1.$$

::: key Interpolation constraints
$S(z) = 1$ at every right-half-plane zero $z$ and $T(p) = 1$ at every right-half-plane pole $p$, with $T(z) = 0$ and $S(p) = 0$. These are structural: no controller escapes them. For a multivariable plant they hold in directions — $\mathbf{y}_z^\mathsf{H}\mathbf{S}(z) = \mathbf{y}_z^\mathsf{H}$ for the output zero direction, and $\mathbf{S}(p)\mathbf{y}_p = \mathbf{0}$ for the output pole direction.
:::

The directional form carries a piece of good news that the scalar case hides. If the zero direction $\mathbf{y}_z$ and the pole direction $\mathbf{y}_p$ are orthogonal, the constraints act on different output directions and do not fight each other; the penalty below relaxes to nothing. If they are aligned, the full scalar penalty applies. The general bound interpolates with the cosine of the angle between them, so on a multivariable vehicle the *geometry* of where the zero and the pole live is as important as their frequencies.

## The sensitivity peak bound

::: key Sensitivity peak from a pole-zero pair
For a scalar plant with a right-half-plane zero $z$ and a right-half-plane pole $p$, both real,

$$\lVert S\rVert_\infty \ \ge\ \frac{\lvert z + p\rvert}{\lvert z - p\rvert},$$

and the same bound holds for $\lVert T\rVert_\infty$. It blows up as $z$ approaches $p$ and tends to one as they separate.
:::

The proof is two lines of complex analysis. Since $T(p) = 1$, $S(p) = 0$, so $S$ has a zero at $p$. Define the Blaschke factor $B_p(s) = (s - p)/(s + p)$, which is all-pass — $\lvert B_p(j\omega)\rvert = 1$ for every $\omega$ — and has its only zero at $p$. Then $\tilde{S} = S/B_p$ is analytic in the closed right half plane, because the zero of $S$ at $p$ cancels the zero of $B_p$. The maximum modulus principle says an analytic function attains its largest magnitude on the boundary, so

$$\lVert S\rVert_\infty = \sup_\omega\lvert S(j\omega)\rvert = \sup_\omega\lvert\tilde{S}(j\omega)\rvert \ \ge\ \lvert\tilde{S}(z)\rvert = \frac{\lvert S(z)\rvert}{\lvert B_p(z)\rvert} = \frac{1}{\lvert (z-p)/(z+p)\rvert} = \frac{\lvert z+p\rvert}{\lvert z-p\rvert},$$

using $S(z) = 1$. The bound for $\lVert T\rVert_\infty$ follows by the same argument with the roles of pole and zero exchanged.

Two consequences are worth memorising. First, $z < p$ makes the ratio no better than one but the *bandwidth window* below becomes empty, and such plants are effectively impossible to control well. Second, a ratio $z/p$ below about four is considered very hard: at $z/p = 3$ the bound is $\lVert S\rVert_\infty \ge 2$, a $6\,\mathrm{dB}$ sensitivity peak, which by the disk-margin lesson already puts the loop at or below the traditional $6\,\mathrm{dB}$ and $30^\circ$ requirements before any other imperfection is added.

## The bandwidth window

The two features push in opposite directions.

**An unstable pole sets a floor.** You must act faster than the divergence. The interpolation $T(p) = 1$ says the loop has full authority at $p$, which requires the loop to be closed there, so crossover must be above $p$; the usual working rule is $\omega_B > 2p$. Below it the loop cannot arrest the divergence before the state has grown.

**A right-half-plane zero sets a ceiling.** The H-infinity synthesis lesson computed this exactly: for the one-block problem with the standard performance weight, the optimum is $\gamma_{\text{opt}} = \lvert W_1(z)\rvert$, and $\gamma_{\text{opt}} \le 1$ requires $\omega_B \le z(1 - 1/M)$. With a sensitivity peak allowance of $M = 2$ that is $\omega_B \le z/2$.

Putting them together, a feasible design needs

$$2p \ \lesssim\ \omega_B \ \lesssim\ \frac{z}{2}, \qquad\text{hence}\qquad \frac{z}{p} \gtrsim 4 .$$

That is where the "$z/p$ below four is very hard" rule comes from: below four the window closes.

::: example A booster with a forward accelerometer
Take the launch vehicle of the atmospheric flight module at maximum dynamic pressure: $\mu_\alpha = 0.228\,\mathrm{s^{-2}}$, so the unstable pole is at $p = \sqrt{0.228} = 0.477\,\mathrm{rad/s}$ with a time to double of $1.45\,\mathrm{s}$. Load relief feeds back lateral acceleration from a sensor mounted forward of the centre of gravity, and that path has a right-half-plane zero.

Suppose the zero sits at $z = 2.5\,\mathrm{rad/s}$. Then

$$\lVert S\rVert_\infty \ \ge\ \frac{2.5 + 0.477}{2.5 - 0.477} = \frac{2.977}{2.023} = 1.472 = 3.36\,\mathrm{dB},$$

and $z/p = 5.24$, above four. The bandwidth window is $2p = 0.955\,\mathrm{rad/s}$ to $z/2 = 1.25\,\mathrm{rad/s}$ — narrow, but not empty, so a design exists and the achievable sensitivity peak is at least $1.47$. Since $\lVert S - \tfrac{1}{2}\mathbf{I}\rVert_\infty \ge \lVert S\rVert_\infty - \tfrac{1}{2}$, the balanced disk margin obeys $\alpha \le 1/(1.472 - 0.5) = 1.029$, so no controller can give this vehicle better than $\pm 9.88\,\mathrm{dB}$ and $\pm 54.4^\circ$.

Now move the sensor forward, which moves the zero down to $z = 1.5\,\mathrm{rad/s}$. The bound becomes $1.977/1.023 = 1.934 = 5.73\,\mathrm{dB}$, and $z/p = 3.14$. The window is now $0.955$ to $0.750\,\mathrm{rad/s}$: **empty**. There is no controller. The vehicle cannot be both stabilised against its aerodynamic divergence and kept insensitive through that sensor, and the trade must be made in the vehicle, not the software — move the accelerometer aft, blend it with an inertial measurement that has no such zero, or reduce $\mu_\alpha$ by shifting the centre of gravity.

For contrast, the textbook pair $z = 6$, $p = 2$ gives $\lVert S\rVert_\infty \ge 8/4 = 2$ exactly, a $6.02\,\mathrm{dB}$ sensitivity peak, with $z/p = 3$ and a window from $4$ down to $3\,\mathrm{rad/s}$ — also empty. That is what "uncomfortably small" means quantitatively.
:::

## The waterbed: Bode's sensitivity integral

The peak bound says how bad $\lvert S\rvert$ must get somewhere. The Bode integral says that pushing it down in one band forces it up in another, and adds a mandatory penalty for instability.

::: key Bode sensitivity integral
If the open loop $L$ has relative degree at least two and right-half-plane poles $p_i$, then

$$\int_0^\infty\ln\lvert S(j\omega)\rvert\,d\omega = \pi\sum_i\operatorname{Re}(p_i).$$

For a stable open loop the right side is zero: every decibel of disturbance rejection bought below crossover is paid for in amplification above it. An unstable pole adds a fixed positive area that must be paid whatever the design.
:::

The integral is exact and is worth verifying numerically once, because the constant is easy to misremember. For the booster loop with its proportional-derivative controller and a second-order gimbal actuator — relative degree three — numerical integration of $\ln\lvert S\rvert$ over frequency returns $1.50009$, against $\pi p = \pi\times 0.4775 = 1.50009$.

::: example What the waterbed costs the booster
The mandatory area is $\pi p = 1.500\,\mathrm{rad/s}$ in natural-log units. Suppose the disturbance-rejection requirement is $\lvert S\rvert \le 0.1$ below $0.5\,\mathrm{rad/s}$. That band contributes $\ln(0.1)\times 0.5 = -1.151$ to the integral, so the remaining frequencies must supply $1.500 + 1.151 = 2.651$ of positive area.

Where can that area go? Not to arbitrarily high frequency: above the loop's roll-off $\lvert S\rvert \to 1$ and $\ln\lvert S\rvert \to 0$, so the positive area is confined to a finite band around crossover. If it must all fit between $0.5$ and $\omega_2$, the peak satisfies $\ln M_s \ge 2.651/(\omega_2 - 0.5)$:

| $\omega_2$ (rad/s) | minimum peak $M_s$ | in dB |
| --- | --- | --- |
| 3 | 2.888 | 9.21 |
| 5 | 1.803 | 5.12 |
| 8 | 1.424 | 3.07 |

So the requirement can only be met by spreading the penalty over a wide band, which means a high-bandwidth loop — and the right-half-plane zero puts a ceiling on exactly that. The two constraints meet in the middle, and the design point is where they cross. This arithmetic, done on the back of an envelope before any controller exists, is often the most valuable half hour in a launch vehicle control programme.
:::

## What a right-half-plane zero does in the time domain

The frequency-domain bounds have a blunt time-domain counterpart. Let $y(t)$ be the closed-loop step response of a system whose complementary sensitivity has a right-half-plane zero at $z$, so $T(z) = 0$. The Laplace transform of the step response is $Y(s) = T(s)/s$, and evaluating at $s = z$,

$$\int_0^\infty y(t)\,e^{-zt}\,dt = Y(z) = \frac{T(z)}{z} = 0 .$$

A non-negative function cannot integrate to zero against a positive weight, so $y(t)$ must go negative somewhere: the response moves the wrong way first. That is **undershoot**, and the identity makes it quantitative. Suppose the response has settled to within $\varepsilon$ of one by time $\tau$. Split the integral at $\tau$: the tail contributes at least $(1-\varepsilon)e^{-z\tau}/z$, and the head contributes at least $-y_{us}(1 - e^{-z\tau})/z$ where $y_{us}$ is the peak undershoot. Setting the sum to zero,

$$y_{us} \ \ge\ \frac{1 - \varepsilon}{e^{z\tau} - 1}.$$

Fast settling and a low zero frequency are incompatible: the undershoot grows without bound as $\tau$ shrinks.

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
A landing vehicle's attitude loop has a right-half-plane zero at $z = 6\,\mathrm{rad/s}$, and guidance asks the attitude to settle within five percent in $0.5\,\mathrm{s}$. The bound gives

$$y_{us} \ \ge\ \frac{1 - 0.05}{e^{6\times 0.5} - 1} = \frac{0.95}{19.09} = 0.0498,$$

about five percent of undershoot — acceptable. Tighten the settling time to $0.2\,\mathrm{s}$ and the bound becomes $0.95/(e^{1.2} - 1) = 0.95/2.320 = 0.409$: the attitude must first swing forty-one percent of the commanded amplitude *the wrong way*. For a vehicle at fifty metres above the pad that is not a control problem, it is a vehicle-loss mechanism, and the right response is to renegotiate the settling requirement.

The same arithmetic with a lower zero, $z = 2.5\,\mathrm{rad/s}$: settling within five percent in $1\,\mathrm{s}$ needs at least $0.95/(e^{2.5}-1) = 0.085$, eight and a half percent; relaxing to $2\,\mathrm{s}$ drops it to $0.006$. The simulated second-order example in the code above, with $z = 6$ and a closed-loop frequency of $2\,\mathrm{rad/s}$, shows $4.07\,\%$ undershoot at $t = 0.131\,\mathrm{s}$, and its weighted integral is zero to nine decimal places — the identity is not an approximation.
:::

::: warning Do not try to cancel a right-half-plane zero or pole
Placing a controller zero on an unstable plant pole, or a controller pole on a right-half-plane plant zero, makes the nominal transfer function look beautiful and the loop internally unstable: an internal signal grows without bound while the measured output looks fine, and the slightest mismatch in the cancellation reveals it. Every bound in this lesson assumes internal stability, which is precisely what forbids the cancellation. A design tool that produces such a controller has found a hole in your problem statement, not a solution.
:::

::: warning The bounds are on the plant, not the controller
$\lVert S\rVert_\infty \ge \lvert z+p\rvert/\lvert z-p\rvert$ contains no controller. Reporting that a design "achieved" a sensitivity peak below the bound means an error somewhere: a cancelled mode, a mislabelled zero, a frequency grid that missed the peak, or an analysis run on the wrong loop. Check the bound before trusting the design, every time.
:::

## Check yourself

::: check
A vehicle has an unstable pole at $p = 1.5\,\mathrm{rad/s}$ and a right-half-plane zero at $z = 4\,\mathrm{rad/s}$ from its current sensor location. Relocating the sensor would move the zero to $9\,\mathrm{rad/s}$. Quantify what the relocation buys.
:::

::: answer
Before: $\lVert S\rVert_\infty \ge (4 + 1.5)/(4 - 1.5) = 5.5/2.5 = 2.200$, that is $6.85\,\mathrm{dB}$, with $z/p = 2.67$ and a bandwidth window running from $2p = 3\,\mathrm{rad/s}$ down to $z/2 = 2\,\mathrm{rad/s}$ — empty, so no acceptable design exists at all. After: $\lVert S\rVert_\infty \ge (9 + 1.5)/(9 - 1.5) = 10.5/7.5 = 1.400$, that is $2.92\,\mathrm{dB}$, with $z/p = 6.0$ and a window from $3$ to $4.5\,\mathrm{rad/s}$ — narrow but usable. The relocation converts an infeasible problem into a feasible one and cuts the unavoidable sensitivity peak by $3.93\,\mathrm{dB}$. Because the peak bound also caps the balanced disk margin through $\alpha \le 1/(\lVert S\rVert_\infty - \tfrac{1}{2})$, the best achievable margin rises from $\alpha \le 0.588$ to $\alpha \le 1.111$, that is from $\pm 5.26\,\mathrm{dB}$ and $\pm 32.8^\circ$ to $\pm 10.88\,\mathrm{dB}$ and $\pm 58.1^\circ$. This is the calculation that justifies a hardware change to a programme: arithmetic on two numbers, and no amount of control design substitutes for it.
:::

::: check
Why does the bound $\lVert S\rVert_\infty \ge \lvert z+p\rvert/\lvert z-p\rvert$ require internal stability, and what does it become if only a right-half-plane zero is present with no unstable pole?
:::

::: answer
Internal stability is what forces $L$ to retain both the zero at $z$ and the pole at $p$ — a controller allowed to cancel them would break the interpolation conditions, and the whole argument. It is also what makes $S$ analytic in the right half plane, which the maximum modulus principle needs. With a right-half-plane zero and no unstable pole, $S$ has no forced zero, so there is no Blaschke factor to divide out, $\tilde{S} = S$, and the argument gives only $\lVert S\rVert_\infty \ge \lvert S(z)\rvert = 1$ — no useful constraint on the peak. The zero still limits bandwidth, through the weighted version $\lVert W_PS\rVert_\infty \ge \lvert W_P(z)\rvert$, which is where $\omega_B \le z/2$ comes from. The peak bound needs both features: it is the *interaction* that hurts.
:::

::: check
A stable-open-loop design achieves $\lvert S\rvert \le 0.01$ from $0$ to $1\,\mathrm{rad/s}$ and $\lvert S\rvert \approx 1$ above $10\,\mathrm{rad/s}$. What does the Bode integral say about the peak in between?
:::

::: answer
The open loop is stable, so $\int_0^\infty\ln\lvert S\rvert\,d\omega = 0$ provided the relative degree is at least two. The low-frequency band contributes $\ln(0.01)\times 1 = -4.605$. That negative area must be exactly cancelled by positive area, and there are $9\,\mathrm{rad/s}$ of band between $1$ and $10$ to put it in, so the average of $\ln\lvert S\rvert$ there is at least $4.605/9 = 0.512$, giving an average $\lvert S\rvert$ of $1.67$ and a peak of at least that. If the roll-off were faster, so that $\lvert S\rvert$ returned to one by $4\,\mathrm{rad/s}$ instead, the same area would need $\ln M_s \ge 4.605/3 = 1.535$, a peak of at least $4.64$ — a badly behaved loop. The lesson is that deep rejection over a wide band demands a correspondingly wide band in which to pay for it, and roll-off that is too abrupt is a hidden cause of sensitivity peaking.
:::

::: check
On a multivariable vehicle, the right-half-plane zero has output direction $\mathbf{y}_z = (1, 0)^\mathsf{T}$ and the unstable pole has output direction $\mathbf{y}_p = (0, 1)^\mathsf{T}$. What happens to the peak bound, and why?
:::

::: answer
The directions are orthogonal, so the interpolation constraints $\mathbf{y}_z^\mathsf{H}\mathbf{S}(z) = \mathbf{y}_z^\mathsf{H}$ and $\mathbf{S}(p)\mathbf{y}_p = \mathbf{0}$ act on different output channels. The first says the first output row of $\mathbf{S}$ takes the value $(1, 0)$ at $s = z$; the second says the second column of $\mathbf{S}$ vanishes at $s = p$. Nothing forces a single scalar function to satisfy both, so the Blaschke argument no longer applies and the bound relaxes to $\lVert\mathbf{S}\rVert_\infty \ge 1$, that is, no penalty. Physically: the slow, awkward direction imposed by the zero and the urgent direction imposed by the unstable pole are different directions of the vehicle, and the controller can be fast in one and slow in the other. Conversely, if the directions are aligned, the full scalar bound applies. This is one of the few places where being multivariable *helps*, and it is a real design lever — choosing where to put a sensor changes the zero direction as well as the zero frequency.
:::

::: check
A guidance engineer asks whether a faster inner loop would reduce the undershoot caused by a right-half-plane zero at $z = 4\,\mathrm{rad/s}$. Answer with the identity.
:::

::: answer
No, and the identity says so directly. $\int_0^\infty y(t)e^{-zt}dt = 0$ holds for *any* internally stabilising controller, because it follows from $T(z) = 0$, which follows from the zero being in the plant. Making the loop faster reduces $\tau$, the time by which the response has settled, and the bound $y_{us} \ge (1-\varepsilon)/(e^{z\tau}-1)$ then gets *larger*: at $z = 4$, settling to five percent in $1\,\mathrm{s}$ needs at least $0.95/(e^4 - 1) = 0.0177$, while settling in $0.3\,\mathrm{s}$ needs at least $0.95/(e^{1.2}-1) = 0.409$. A faster loop trades a shorter wrong-way excursion for a much deeper one. The only ways to reduce undershoot are to accept slower settling, or to remove the zero by changing the sensor or the actuator arrangement that produced it.
:::

## Summary

| Item | Statement |
| --- | --- |
| Interpolation | $S(z) = 1$, $T(z) = 0$ at RHP zeros; $T(p) = 1$, $S(p) = 0$ at RHP poles; structural |
| MIMO form | $\mathbf{y}_z^\mathsf{H}\mathbf{S}(z) = \mathbf{y}_z^\mathsf{H}$, $\mathbf{S}(p)\mathbf{y}_p = \mathbf{0}$; orthogonal directions remove the penalty |
| Peak bound | $\lVert S\rVert_\infty \ge \lvert z+p\rvert/\lvert z-p\rvert$, same for $\lVert T\rVert_\infty$; via Blaschke factor and maximum modulus |
| Bandwidth window | $2p \lesssim \omega_B \lesssim z/2$; feasible designs need $z/p \gtrsim 4$; $z < p$ is effectively impossible |
| Bode integral | $\int_0^\infty\ln\lvert S\rvert\,d\omega = \pi\sum\operatorname{Re}p_i$ for relative degree $\ge 2$ |
| Waterbed | rejection below crossover is paid for as amplification above it; instability adds mandatory area |
| Undershoot identity | $\int_0^\infty y(t)e^{-zt}dt = 0$ for a step response with $T(z) = 0$ |
| Undershoot bound | $y_{us} \ge (1-\varepsilon)/(e^{z\tau}-1)$ for settling to $\varepsilon$ by $\tau$ |
| Booster example | $p = 0.477\,\mathrm{rad/s}$; $z = 2.5$ gives $\lVert S\rVert_\infty \ge 1.47$ and a window $0.955$ to $1.25\,\mathrm{rad/s}$; $z = 1.5$ closes the window |
| Waterbed example | $\lvert S\rvert \le 0.1$ below $0.5\,\mathrm{rad/s}$ with recovery by $5\,\mathrm{rad/s}$ forces a peak of at least $1.80$ |

The next lesson leaves the single frozen operating point behind. A launch vehicle's plant changes throughout its flight, and designing a controller for each condition and interpolating between them is a practice with a well-known failure mode and a well-developed remedy.
