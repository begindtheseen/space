---
id: l06-linearisation-and-differentials
title: Linearisation and differentials
minutes: 25
covers:
  - linearisation and differentials
---

Almost nothing on a vehicle is linear. Gravity falls off as the inverse square of distance, drag grows as the square of speed, a star tracker's measurement is a trigonometric function of attitude, and the rocket equation has a logarithm in it. Yet almost every tool a GNC engineer reaches for — the Kalman filter, the LQR controller, the stability analysis of a flight-control loop, the error budget of a navigation system — is a linear tool. The bridge between the two is **linearisation**: replace the nonlinear function near an operating point by its tangent line, and keep track of what you threw away.

This is the single most important move in the module. Done well, it is the reason an Extended Kalman Filter can track a spacecraft with linear algebra alone. Done carelessly, it is the reason the same filter diverges. So this lesson does two things with equal seriousness: it builds the tangent-line approximation and its notation, and it derives an exact expression for the error, so that "small" always comes with a number attached. Along the way it recovers the small-angle approximations, gives the differential notation $dy = f'(x)\,dx$ a precise meaning, and turns the tangent line into Newton's method for solving equations.

## The tangent line as an approximation

Let $f$ be differentiable at $x_0$. The tangent line there passes through $(x_0, f(x_0))$ with slope $f'(x_0)$:

$$
L(x) = f(x_0) + f'(x_0)\,(x - x_0).
$$

$L$ is the **linearisation** of $f$ about $x_0$, and $x_0$ is the **operating point**, the **reference** or the **trim point** depending on who is speaking. The claim is that $f(x) \approx L(x)$ for $x$ near $x_0$. Why should the tangent be a better approximation than any other line through the point? Because the definition of the derivative says exactly this: $\dfrac{f(x_0 + h) - f(x_0)}{h} \to f'(x_0)$ as $h \to 0$, which rearranges to

$$
f(x_0 + h) = f(x_0) + f'(x_0)\,h + \varepsilon(h)\,h, \qquad \varepsilon(h) \to 0 \text{ as } h \to 0.
$$

The error $\varepsilon(h)\,h$ is not merely small — it is small *compared with $h$*. Any other line through $(x_0, f(x_0))$ with slope $s \ne f'(x_0)$ has error $(f'(x_0) - s)h + \varepsilon(h) h$, which is proportional to $h$ and does not shrink faster than the step. The tangent is the unique line whose error vanishes to first order.

Writing $h = x - x_0$ for the displacement from the operating point, the increment of the function splits into a linear part and a remainder:

$$
\Delta f = f(x_0 + h) - f(x_0) = \underbrace{f'(x_0)\,h}_{\text{linear part}} + \underbrace{R(h)}_{\text{remainder}}.
$$

Linearising means keeping the first term and dropping $R$. Everything that follows is about how large $R$ is.

## The error, exactly

Assume $f''$ exists on the interval between $x_0$ and $x_0 + h$. Then the remainder has the **Lagrange form**

$$
R(h) = f(x_0 + h) - f(x_0) - f'(x_0)\,h = \frac{f''(\xi)}{2}\,h^2 \quad \text{for some } \xi \text{ between } x_0 \text{ and } x_0 + h.
$$

The proof uses Rolle's theorem from the previous lesson twice. Fix $h \ne 0$ and let $x = x_0 + h$. Define, for $t$ between $x_0$ and $x$,

$$
\phi(t) = f(t) - f(x_0) - f'(x_0)(t - x_0) - K\,(t - x_0)^2,
$$

and choose the constant $K$ so that $\phi(x) = 0$; that is, $K = R(h)/h^2$. Now $\phi(x_0) = 0$ as well, so Rolle gives a point $\xi_1$ strictly between $x_0$ and $x$ with $\phi'(\xi_1) = 0$. But $\phi'(t) = f'(t) - f'(x_0) - 2K(t - x_0)$, which is also zero at $t = x_0$. Apply Rolle to $\phi'$ on the interval from $x_0$ to $\xi_1$: there is a $\xi$ between them with $\phi''(\xi) = 0$, that is $f''(\xi) - 2K = 0$. Hence $K = f''(\xi)/2$, and $R(h) = K h^2 = \tfrac12 f''(\xi) h^2$.

Three things to read off this formula.

- The error is proportional to $h^2$. Halve the step and the error falls by four. This is written $R(h) = O(h^2)$, "of order $h^2$", meaning $|R(h)| \le C h^2$ for some constant $C$ once $h$ is small. Here $C$ can be taken as half the largest value of $|f''|$ on the interval.
- The error is proportional to the curvature $f''$. A function that is nearly straight near $x_0$ linearises well over a wide range; one that bends sharply does not. Where $f''(x_0) = 0$ the tangent is exceptionally good.
- The point $\xi$ is unknown. For a *bound* replace $f''(\xi)$ by the maximum of $|f''|$ between $x_0$ and $x_0 + h$; for an *estimate* replace it by $f''(x_0)$, which is what you get by keeping one more term of the Taylor series in the next lesson.

::: key
First-order linearisation of $f$ about $x_0$: $f(x) \approx f(x_0) + f'(x_0)(x - x_0)$, with error $O\big((x - x_0)^2\big)$. Exactly, the Lagrange remainder is $\dfrac{f''(\xi)}{2}(x - x_0)^2$ for some $\xi$ between $x_0$ and $x$. Halving the displacement quarters the error.
:::

::: example Gravity as a function of altitude
Gravitational acceleration at altitude $h$ above a spherical Earth is $g(h) = \dfrac{\mu}{(R_E + h)^2}$, with $\mu = 3.986 \times 10^{14}\,\mathrm{m^3/s^2}$ and $R_E = 6371\,\mathrm{km}$. Linearise about $h = 0$ and assess the approximation at $100$, $400$ and $1000\,\mathrm{km}$.

At the surface $g(0) = \mu/R_E^2 = 9.820\,\mathrm{m/s^2}$. By the chain rule $g'(h) = -\dfrac{2\mu}{(R_E + h)^3}$, so $g'(0) = -2\mu/R_E^3 = -2g(0)/R_E = -3.08 \times 10^{-6}\,\mathrm{s^{-2}}$, and

$$
g(h) \approx g(0) - \frac{2g(0)}{R_E}\,h = g(0)\left(1 - \frac{2h}{R_E}\right).
$$

Gravity falls by about $2h/R_E$ in relative terms — $3.1\%$ per $100\,\mathrm{km}$. Now the error. $g''(h) = \dfrac{6\mu}{(R_E + h)^4}$ is largest at $h = 0$, so the bound is $|R| \le \tfrac12 g''(0) h^2 = \dfrac{3\mu h^2}{R_E^4}$.

| $h$ | Exact $g$ | Linear | Error | Relative | Bound |
| --- | --- | --- | --- | --- | --- |
| $100\,\mathrm{km}$ | $9.519$ | $9.512$ | $0.007$ | $0.07\%$ | $0.007$ |
| $400\,\mathrm{km}$ | $8.694$ | $8.587$ | $0.107$ | $1.2\%$ | $0.116$ |
| $1000\,\mathrm{km}$ | $7.336$ | $6.737$ | $0.599$ | $8.2\%$ | $0.726$ |

The error grows sixteen-fold from $100$ to $400\,\mathrm{km}$ — four times the displacement, squared — exactly as $O(h^2)$ predicts, and the bound holds every time. Notice the error is always positive: the linear model *underestimates* $g$, because $g'' > 0$ means the true curve bends upward away from its tangent. For the atmosphere-scale altitudes of an ascent the linear model is fine; for orbit it is not, and a propagator uses the inverse-square law directly.
:::

## Differentials and the propagation of small errors

The **differential** notation makes the linear part of an increment into an object in its own right. If $y = f(x)$, define the differential of $x$ to be an arbitrary small change $dx$, and the differential of $y$ to be

$$
dy = f'(x)\,dx.
$$

Then $dy$ is the change in $y$ *predicted by the tangent line* when $x$ changes by $dx$, while $\Delta y = f(x + dx) - f(x)$ is the true change. The two differ by the remainder, $O(dx^2)$. Leibniz's $\dfrac{dy}{dx}$ is now literally a quotient of differentials, and the chain rule $\dfrac{dy}{dx} = \dfrac{dy}{du}\dfrac{du}{dx}$ reads as cancelling a common factor — which is the reason the notation survived three centuries.

The most common use is **error propagation**: a quantity $x$ is known with a small uncertainty $\delta x$, and you want the resulting uncertainty in $y = f(x)$. To first order, $\delta y \approx |f'(x)|\,\delta x$. Dividing by $y$ gives the relative version,

$$
\frac{\delta y}{y} \approx \left|\frac{x f'(x)}{f(x)}\right|\frac{\delta x}{x},
$$

and the factor $x f'(x)/f(x)$ is the **sensitivity** (or condition number) of $f$ at $x$: the percentage change in output per percentage change in input. For a power law $f(x) = c\,x^n$ it is exactly $n$: a relative error in $x$ becomes $n$ times that relative error in $y$, a rule you will use constantly.

::: example Orbital period from semi-major axis
The period of an orbit is $T = 2\pi\sqrt{a^3/\mu}$. For a station orbit with $a = 6778\,\mathrm{km}$, how much does a $1\,\mathrm{km}$ error in $a$ change the period?

First the period: $T = 2\pi\sqrt{(6.778 \times 10^6)^3 / 3.986 \times 10^{14}} = 5553.5\,\mathrm{s} = 92.6\,\mathrm{min}$. Then the differential, treating $T = 2\pi\mu^{-1/2} a^{3/2}$ as a power law:

$$
dT = 2\pi\mu^{-1/2}\cdot\tfrac32 a^{1/2}\,da = 3\pi\sqrt{\frac{a}{\mu}}\,da, \qquad \frac{dT}{T} = \frac{3}{2}\frac{da}{a}.
$$

The sensitivity is $3/2$, the exponent. Numerically $dT/da = 3\pi\sqrt{6.778 \times 10^6/3.986 \times 10^{14}} = 1.229 \times 10^{-3}\,\mathrm{s/m}$, so $da = 1\,\mathrm{km}$ gives $dT = 1.229\,\mathrm{s}$. The exact change, recomputing $T$ at $a + 1\,\mathrm{km}$, is $1.2290\,\mathrm{s}$: at $da/a = 1.5 \times 10^{-4}$ the remainder is invisible. Push $da$ to $100\,\mathrm{km}$ and the linear estimate is $122.9\,\mathrm{s}$ against an exact $123.4\,\mathrm{s}$ — still within half a percent, because $a^{3/2}$ is a gently curving function. Over one day, $15.6$ orbits, a $1\,\mathrm{s}$ period error accumulates to $19\,\mathrm{s}$ of timing error, about $150\,\mathrm{km}$ along-track at $7.7\,\mathrm{km/s}$. That is why orbit determination cares about the semi-major axis to metres.
:::

::: example Drag about a flight condition
A re-entering body at $v_0 = 1000\,\mathrm{m/s}$ where the air density is $\rho = 0.4\,\mathrm{kg/m^3}$ has drag $D(v) = \tfrac12 \rho v^2 C_D A$ with $C_D A = 3.0\,\mathrm{m^2}$. Linearise about $v_0$ and compare with the exact drag at $1050\,\mathrm{m/s}$.

$D(v_0) = \tfrac12(0.4)(10^6)(3.0) = 600\,\mathrm{kN}$ and $D'(v) = \rho v C_D A$, so $D'(v_0) = (0.4)(1000)(3.0) = 1200\,\mathrm{N}$ per $\mathrm{m/s}$. The linear model is

$$
\Delta D \approx 1200\,\Delta v \quad\Longrightarrow\quad \Delta D(50\,\mathrm{m/s}) = 60.0\,\mathrm{kN}.
$$

Exactly, $D(1050) - D(1000) = \tfrac12(0.4)(3.0)(1050^2 - 1000^2) = 61.5\,\mathrm{kN}$. The $1.5\,\mathrm{kN}$ gap is $\tfrac12 D''\,\Delta v^2 = \tfrac12(\rho C_D A)(50)^2$ — and because $D$ is a quadratic, $D''$ is the constant $\rho C_D A = 1.2\,\mathrm{kg/m}$, so here the Lagrange remainder is exact with any $\xi$. The linear coefficient $1200\,\mathrm{N\,s/m}$ is the "aerodynamic damping" that would appear in a linearised model of this body's speed dynamics: it is the slope of the drag curve at the trim speed, not the drag itself.
:::

## The small-angle approximations

Linearising the trigonometric functions about $\theta = 0$ gives the approximations that permeate attitude dynamics, where angular errors are a fraction of a degree, and guidance, where flight-path angles are steered in small increments.

- $\sin\theta$: $\sin 0 = 0$, $\cos 0 = 1$, so $\sin\theta \approx \theta$. The second derivative is $-\sin\xi$, so $|R| \le \tfrac12|\sin\xi|\,\theta^2 \le \tfrac12|\theta|^3$ (using $|\sin\xi| \le |\xi| \le |\theta|$). The next lesson sharpens this to $\theta^3/6$.
- $\cos\theta$: $\cos 0 = 1$ and $-\sin 0 = 0$, so the tangent line is flat: $\cos\theta \approx 1$. The remainder is $-\tfrac12\cos\xi\,\theta^2$, so $|R| \le \theta^2/2$ — and the approximation is only first-order-accurate, which is why $\cos\theta \approx 1 - \theta^2/2$ is what engineers actually use.
- $\tan\theta$: $\tan 0 = 0$, $\sec^2 0 = 1$, so $\tan\theta \approx \theta$.

The angle must be in radians for any of this to hold; $\sin\theta \approx \theta$ with $\theta$ in degrees is off by a factor of $57.3$.

| $\theta$ | $\theta\,(\mathrm{rad})$ | $\theta - \sin\theta$ | $1 - \cos\theta$ | $\tan\theta - \theta$ |
| --- | --- | --- | --- | --- |
| $5^\circ$ | $0.0873$ | $1.11 \times 10^{-4}$ | $3.81 \times 10^{-3}$ | $2.22 \times 10^{-4}$ |
| $10^\circ$ | $0.1745$ | $8.85 \times 10^{-4}$ | $1.52 \times 10^{-2}$ | $1.79 \times 10^{-3}$ |
| $15^\circ$ | $0.2618$ | $2.98 \times 10^{-3}$ | $3.41 \times 10^{-2}$ | $6.15 \times 10^{-3}$ |
| $30^\circ$ | $0.5236$ | $2.36 \times 10^{-2}$ | $1.34 \times 10^{-1}$ | $5.38 \times 10^{-2}$ |

At $15^\circ$, $\sin\theta \approx \theta$ is good to $1.1\%$ and $\cos\theta \approx 1$ to $3.5\%$. Doubling the angle to $30^\circ$ multiplies the sine error by eight, not four: the sine's linearisation is better than $O(\theta^2)$, because $f''(0) = 0$ kills the quadratic term, and the true leading error is cubic. When a stationary point of the curvature coincides with your operating point, you get a free order of accuracy.

## Linearising a model: the pendulum and the filter

The same idea applies to an equation of motion, not only to a formula. A pendulum of length $\ell$ obeys $\ddot\theta = -\dfrac{g_0}{\ell}\sin\theta$. Linearise the right-hand side about the hanging equilibrium $\theta_0 = 0$: $\sin\theta \approx \theta$, so

$$
\ddot\theta \approx -\frac{g_0}{\ell}\,\theta,
$$

a linear equation whose solutions are sinusoids of angular frequency $\sqrt{g_0/\ell}$ — $3.13\,\mathrm{rad/s}$ for a one-metre pendulum, a period of $2.0\,\mathrm{s}$. The linear model is accurate while $\theta$ stays small enough for $\sin\theta \approx \theta$; at $30^\circ$ amplitude the restoring torque is $4.5\%$ weaker than the linear model claims and the true period is correspondingly longer. About the *inverted* equilibrium $\theta_0 = \pi$, write $\theta = \pi + \delta$: $\sin(\pi + \delta) = -\sin\delta \approx -\delta$, giving $\ddot\delta \approx +\dfrac{g_0}{\ell}\delta$, whose solutions grow exponentially. Same pendulum, different operating point, opposite stability — and the linearisation is what told you, without solving anything nonlinear. This is exactly the procedure by which a launch vehicle's attitude dynamics, which are nonlinear, become the linear plant that its autopilot is designed against.

The Kalman filter is the other great consumer. Its recursion — propagate a mean and a covariance, then correct them with a measurement — is exact only when the dynamics $\dot x = f(x)$ and the measurement $z = h(x)$ are linear and the noise is Gaussian, because only then do the mean and covariance describe the distribution completely and evolve by matrix algebra. Real models are not linear. The **Extended Kalman Filter** keeps the recursion by linearising both functions about the current estimate $\hat x$:

$$
f(x) \approx f(\hat x) + f'(\hat x)(x - \hat x), \qquad h(x) \approx h(\hat x) + h'(\hat x)(x - \hat x),
$$

and using the slopes $f'(\hat x)$ and $h'(\hat x)$ — Jacobians, in several variables — where the linear filter used its constant matrices. The cost is the remainder. The neglected $\tfrac12 f''(\xi)(x - \hat x)^2$ term is not zero-mean: for $g'' > 0$ in the gravity example every linearisation error had the same sign. So the propagated mean acquires a bias, the covariance stops describing the true spread of the error, and the filter becomes over-confident. If the estimate $\hat x$ is far from the truth, or the curvature $f''$ is strong at the scale of the estimation error, the errors compound and the filter can diverge. Sigma-point (unscented) and particle filters exist to avoid exactly this remainder.

::: key
Linearising a nonlinear model about an operating point $x_0$ replaces $f(x)$ by $f(x_0) + f'(x_0)(x - x_0)$. The neglected term is $\tfrac12 f''(\xi)(x - x_0)^2$: second order, but *not* zero-mean, so a linearised filter carries a bias that grows with curvature and with the distance between the reference and the truth.
:::

## Newton's method

Turn the tangent line around. To solve $f(x) = 0$, start from a guess $x_n$, replace $f$ by its linearisation there, and solve the linear equation instead: $f(x_n) + f'(x_n)(x - x_n) = 0$ gives

$$
x_{n+1} = x_n - \frac{f(x_n)}{f'(x_n)}.
$$

Geometrically you slide down the tangent to the axis and start again. The error analysis is the Lagrange remainder in disguise. Let $r$ be the root, so $0 = f(r) = f(x_n) + f'(x_n)(r - x_n) + \tfrac12 f''(\xi)(r - x_n)^2$. Divide by $f'(x_n)$ and rearrange:

$$
r - x_{n+1} = r - x_n + \frac{f(x_n)}{f'(x_n)} = -\frac{f''(\xi)}{2f'(x_n)}\,(r - x_n)^2.
$$

The new error is proportional to the *square* of the old one: **quadratic convergence**. Once the error is $10^{-3}$ it becomes about $10^{-6}$, then $10^{-12}$ — the number of correct digits doubles per step. Contrast the bisection method of the first lesson, which gains one binary digit per step. Newton needs a derivative and a starting point close enough that the tangent points toward the right root; where $f'(x_n) \approx 0$ the step is enormous and the method can wander off.

::: example Solving Kepler's equation
Kepler's equation $E - e\sin E = M$ has no closed-form solution for $E$, and every orbit propagator solves it numerically. Take $e = 0.1$, $M = 1\,\mathrm{rad}$, and start from $E_0 = M$.

Here $f(E) = E - e\sin E - M$ and $f'(E) = 1 - e\cos E$, the very derivative found by implicit differentiation two lessons ago. The iteration is $E_{n+1} = E_n - \dfrac{E_n - e\sin E_n - M}{1 - e\cos E_n}$.

| $n$ | $E_n$ | $f(E_n)$ | $\lvert E_n - E^* \rvert$ |
| --- | --- | --- | --- |
| 0 | $1.000000000$ | $-8.42 \times 10^{-2}$ | $8.9 \times 10^{-2}$ |
| 1 | $1.088953264$ | $3.39 \times 10^{-4}$ | $3.6 \times 10^{-4}$ |
| 2 | $1.088597758$ | $5.60 \times 10^{-9}$ | $5.9 \times 10^{-9}$ |
| 3 | $1.088597752$ | $0$ | $0$ |

The converged value is $E^* = 1.088597752\,\mathrm{rad}$. Each error is close to $0.045$ times the square of the one before — and $\dfrac{f''}{2f'} = \dfrac{e\sin E}{2(1 - e\cos E)} = 0.046$ at the root, as the analysis predicts. Three iterations give twelve digits. For eccentricities near $1$ the derivative $1 - e\cos E$ approaches zero near periapsis and a better starting guess than $E_0 = M$ is needed; that is the one place this method needs care.
:::

::: warning
Linearise about a point *on* the curve, at the operating point you will actually be near. Students linearise $\sin\theta$ about $0$ and then use it at $\theta = 60^\circ$, where the error is $17\%$ of $\theta$; or linearise the pendulum about hanging and apply it to an inverted one. The linearisation belongs to the point; move the operating point and every coefficient must be recomputed. An EKF recomputes its Jacobians at every step for exactly this reason.
:::

::: warning
$O(h^2)$ is a statement about how the error *scales*, not a guarantee that it is small. The constant is $\tfrac12|f''|$, and if the curvature is large — a saturation, a near-singular geometry, $1/(1 - e\cos E)$ near $e = 1$ — the "second-order" error can dominate at displacements you would have called small. Check the constant, not only the order.
:::

## Check yourself

::: check
Use the linearisation of $\sqrt{x}$ about $x_0 = 100$ to estimate $\sqrt{104}$, bound the error with the Lagrange remainder, and compare with the exact value.
:::

::: answer
$f(x) = \sqrt{x}$, $f(100) = 10$, $f'(x) = \dfrac{1}{2\sqrt{x}}$ so $f'(100) = 0.05$. Then $L(104) = 10 + 0.05 \times 4 = 10.2$. The second derivative is $f''(x) = -\dfrac{1}{4}x^{-3/2}$, and on $[100, 104]$ its magnitude is largest at $100$: $|f''| \le \dfrac{1}{4 \times 1000} = 2.5 \times 10^{-4}$. So $|R| \le \tfrac12 (2.5 \times 10^{-4})(4)^2 = 2.0 \times 10^{-3}$. Exactly, $\sqrt{104} = 10.19804$, so the error is $1.96 \times 10^{-3}$, inside the bound; the estimate is high because $f'' < 0$ puts the curve below its tangent.
:::

::: check
Circular orbital speed is $v = \sqrt{\mu/r}$. What is the sensitivity of $v$ to $r$? If $r = 6771\,\mathrm{km}$ is uncertain by $10\,\mathrm{km}$, how uncertain is $v$?
:::

::: answer
$v = \mu^{1/2} r^{-1/2}$ is a power law with exponent $-\tfrac12$, so $\dfrac{dv}{v} = -\tfrac12\dfrac{dr}{r}$ and the sensitivity is $\tfrac12$ in magnitude: a $1\%$ error in radius gives $0.5\%$ in speed, in the opposite direction. Numbers: $v = \sqrt{3.986 \times 10^{14}/6.771 \times 10^6} = 7672.6\,\mathrm{m/s}$, and $\delta v \approx \tfrac12 \times \dfrac{10}{6771} \times 7672.6 = 5.67\,\mathrm{m/s}$. Recomputing exactly at $6781\,\mathrm{km}$ gives a speed lower by $5.66\,\mathrm{m/s}$, so the differential is accurate to better than $0.2\%$ of itself.
:::

::: check
A spherical liquid-oxygen tank of radius $r = 1.5\,\mathrm{m}$ is full (density $1141\,\mathrm{kg/m^3}$). A $1\,\mathrm{mm}$ error in the radius corresponds to how many kilograms of propellant? Use a differential, then check against the exact figure.
:::

::: answer
$m = \tfrac43\pi\rho r^3$, so $dm = 4\pi\rho r^2\,dr = 4\pi(1141)(1.5)^2(0.001) = 32.3\,\mathrm{kg}$. The total mass is $16\,130\,\mathrm{kg}$, so the relative sensitivity is $3$ — the exponent — and $dm/m = 3\,dr/r = 0.2\%$. Exactly, $\tfrac43\pi\rho\big[(1.501)^3 - (1.5)^3\big] = 32.28\,\mathrm{kg}$. The differential is off by $0.02\,\mathrm{kg}$, the $O(dr^2)$ remainder. Thirty kilograms per millimetre is why tank geometry is measured, not assumed, before loading is computed from level sensors.
:::

::: check
Linearise $f(x) = \dfrac{1}{1 + x}$ about $x_0 = 0$. Find the *exact* remainder, and from it the range of $x$ over which the linearisation is accurate to $1\%$ relative to $f$.
:::

::: answer
$f(0) = 1$ and $f'(x) = -(1 + x)^{-2}$, so $f'(0) = -1$ and $L(x) = 1 - x$. The remainder is $\dfrac{1}{1 + x} - (1 - x) = \dfrac{1 - (1 - x^2)}{1 + x} = \dfrac{x^2}{1 + x}$, which agrees with the Lagrange form $\tfrac12 f''(\xi)x^2 = \dfrac{x^2}{(1 + \xi)^3}$ for $\xi$ with $(1 + \xi)^3 = 1 + x$. The relative error is $R/f = x^2$ exactly. So $1\%$ accuracy needs $x^2 \le 0.01$, or $|x| \le 0.1$: at $x = 0.1$ the linear value $0.9$ against the true $0.9091$ is indeed $1.0\%$ low. Doubling to $|x| = 0.2$ gives a $4\%$ error, the quadrupling that $O(x^2)$ promises.
:::

::: check
Apply two Newton steps to $\cos x = x$ from $x_0 = 0.75$ and compare with the bisection result $0.74 \pm 0.01$ from the first lesson.
:::

::: answer
Let $f(x) = \cos x - x$, so $f'(x) = -\sin x - 1$. At $x_0 = 0.75$: $f = 0.73169 - 0.75 = -0.01831$ and $f' = -1.68164$, so $x_1 = 0.75 - (-0.01831)/(-1.68164) = 0.739111$. At $x_1$: $f = -4.35 \times 10^{-5}$, $f' = -1.6736$, so $x_2 = 0.7390851$. The true root is $0.7390851332$. Two Newton steps from a guess with error $0.011$ reach seven correct digits; bisection needed six halvings to get two. The errors $1.1 \times 10^{-2}$, $2.6 \times 10^{-5}$, $2 \times 10^{-10}$ each square the last, times a constant $\dfrac{|f''|}{2|f'|} = \dfrac{\cos r}{2(1 + \sin r)} \approx 0.22$.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Linearisation about $x_0$ | $f(x) \approx L(x) = f(x_0) + f'(x_0)(x - x_0)$ |
| Lagrange remainder | $f(x) - L(x) = \tfrac12 f''(\xi)(x - x_0)^2$, $\xi$ between $x_0$ and $x$ |
| Order notation | $R = O(h^2)$: $|R| \le C h^2$ for small $h$, $C = \tfrac12\max|f''|$ |
| Differential | $dy = f'(x)\,dx$; $\Delta y = dy + O(dx^2)$ |
| Relative sensitivity | $\dfrac{\delta y}{y} \approx \left|\dfrac{x f'(x)}{f(x)}\right|\dfrac{\delta x}{x}$; equals $n$ for $y = c\,x^n$ |
| Small angles (radians) | $\sin\theta \approx \theta$, $\cos\theta \approx 1$ (error $\le \theta^2/2$), $\tan\theta \approx \theta$ |
| Gravity with altitude | $g(h) \approx g(0)(1 - 2h/R_E)$ |
| Period sensitivity | $dT/T = \tfrac32\,da/a$ |
| EKF | Linearise $f, h$ about $\hat x$; neglected $\tfrac12 f''(\xi)(x - \hat x)^2$ biases the covariance |
| Newton's method | $x_{n+1} = x_n - f(x_n)/f'(x_n)$; error squares each step |

The tangent line is the first term of a longer story. The next lesson keeps the second, third and higher terms — the Taylor series — and turns the remainder into a precise tool for deciding how many terms a numerical integrator or a filter needs.
