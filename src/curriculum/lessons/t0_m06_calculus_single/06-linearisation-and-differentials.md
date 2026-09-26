---
id: l06-linearisation-and-differentials
title: Linearisation and differentials
minutes: 23
covers:
  - linearisation and differentials
---

Stand in a big flat field and the Earth looks flat. It is not — it is a ball — but the piece you can see is so small that a flat plane matches it almost perfectly. Zoom in close enough on any smooth curve and the same thing happens: it looks like a straight line. This lesson turns that everyday fact into the most useful tool in the module.

Almost nothing on a vehicle is **linear** — that is, a straight-line relationship where doubling the input doubles the output. Gravity weakens with the square of distance. Drag grows with the square of speed. A star tracker's reading is a trig function of the attitude. The rocket equation has a logarithm in it. Yet almost every tool a GNC engineer reaches for — the Kalman filter, the LQR controller, the stability analysis of a flight-control loop, the error budget of a navigation system — is a linear tool.

The bridge between the two is **linearisation**: near an operating point, replace the curved function by its tangent line, and keep track of what you threw away.

Done well, this is why an Extended Kalman Filter can track a spacecraft using linear algebra alone. Done carelessly, it is why the same filter goes off the rails. So this lesson does two things with equal care. It builds the tangent-line approximation and its notation. And it finds an exact formula for the error, so that "small" always comes with a number attached. Along the way it recovers the small-angle approximations, gives the notation $dy = f'(x)\,dx$ a precise meaning, and turns the tangent line into Newton's method for solving equations.

## The tangent line as an approximation

Let $f$ have a derivative at $x_0$ ("x nought", or "x zero"). The tangent line there passes through the point $(x_0, f(x_0))$ with slope $f'(x_0)$:

$$
L(x) = f(x_0) + f'(x_0)\,(x - x_0).
$$

Read it as: start at the known height $f(x_0)$, then add slope times distance moved. $L$ is the **linearisation** of $f$ about $x_0$. The point $x_0$ is called the **operating point**, the **reference**, or the **[[trim point|trim-point]]**, depending on who is talking.

The claim is that $f(x) \approx L(x)$ when $x$ is near $x_0$. But why the tangent, and not some other line through the same point? Because the definition of the derivative says so. It says $\dfrac{f(x_0 + h) - f(x_0)}{h} \to f'(x_0)$ as $h \to 0$. Multiply out and it becomes

$$
f(x_0 + h) = f(x_0) + f'(x_0)\,h + \varepsilon(h)\,h, \qquad \varepsilon(h) \to 0 \text{ as } h \to 0.
$$

Here $\varepsilon(h)$ ("epsilon of h") is a name for "the part that goes to zero". The error, $\varepsilon(h)\,h$, is not only small — it is small *compared with $h$ itself*.

Now try any other line through the point, with a slope $s$ different from $f'(x_0)$. Its error is $(f'(x_0) - s)h + \varepsilon(h) h$. The first part is a fixed number times $h$, so the error shrinks only as fast as the step does. The tangent is the one line whose error vanishes faster than the step.

Write $h = x - x_0$ for how far you have moved from the operating point. Then the change in the function splits into two pieces:

$$
\Delta f = f(x_0 + h) - f(x_0) = \underbrace{f'(x_0)\,h}_{\text{linear part}} + \underbrace{R(h)}_{\text{remainder}}.
$$

($\Delta$, capital "delta", means "change in".) To linearise is to keep the first piece and drop $R$, the **remainder**. Everything that follows is about how big $R$ is.

## The error, exactly

Suppose $f$ also has a second derivative between $x_0$ and $x_0 + h$. Then the remainder has an exact form, called the **Lagrange form**:

$$
R(h) = f(x_0 + h) - f(x_0) - f'(x_0)\,h = \frac{f''(\xi)}{2}\,h^2 \quad \text{for some } \xi \text{ between } x_0 \text{ and } x_0 + h.
$$

As in the last lesson, $\xi$ ("xi") is a point we know exists but cannot pin down.

::: note Why it has to be true
The proof uses Rolle's theorem from the previous lesson twice. Fix $h \ne 0$ and let $x = x_0 + h$. For $t$ between $x_0$ and $x$, define

$$
\phi(t) = f(t) - f(x_0) - f'(x_0)(t - x_0) - K\,(t - x_0)^2,
$$

and choose the constant $K$ so that $\phi(x) = 0$. That means $K = R(h)/h^2$.

- $\phi(x_0) = 0$ as well, so Rolle gives a point $\xi_1$ strictly between $x_0$ and $x$ with $\phi'(\xi_1) = 0$.
- Differentiate: $\phi'(t) = f'(t) - f'(x_0) - 2K(t - x_0)$. This is also zero at $t = x_0$.
- So apply Rolle to $\phi'$ on the stretch from $x_0$ to $\xi_1$. There is a $\xi$ between them with $\phi''(\xi) = 0$, that is, $f''(\xi) - 2K = 0$.

Hence $K = f''(\xi)/2$, and $R(h) = K h^2 = \tfrac12 f''(\xi) h^2$.
:::

Here are three things to read off this formula.

- **The error grows like $h^2$.** Halve the step and the error drops to a quarter. This is written $R(h) = O(h^2)$, read "**[[big O|big-o]]** of h squared", meaning $|R(h)| \le C h^2$ for some constant $C$ once $h$ is small. Here $C$ can be half the largest value of $|f''|$ on the interval.
- **The error grows with the bending, $f''$.** A function that is nearly straight near $x_0$ linearises well over a wide range. One that bends sharply does not. Where $f''(x_0) = 0$, the tangent is exceptionally good.
- **The point $\xi$ is unknown.** For a guaranteed *bound*, replace $f''(\xi)$ by the largest $|f''|$ between $x_0$ and $x_0 + h$. For an *estimate*, use $f''(x_0)$ — which is what keeping one more term of the Taylor series gives you in the next lesson.

::: key
First-order linearisation of $f$ about $x_0$: $f(x) \approx f(x_0) + f'(x_0)(x - x_0)$, with error $O\big((x - x_0)^2\big)$. Exactly, the Lagrange remainder is $\dfrac{f''(\xi)}{2}(x - x_0)^2$ for some $\xi$ between $x_0$ and $x$. Halving the displacement quarters the error.
:::

::: example Gravity as a function of altitude
Gravity at altitude $h$ above a round Earth is

$$
g(h) = \frac{\mu}{(R_E + h)^2},
$$

with $\mu = 3.986 \times 10^{14}\,\mathrm{m^3/s^2}$ (Earth's gravity constant, read "mew") and Earth radius $R_E = 6371\,\mathrm{km}$. Linearise about $h = 0$, then test the approximation at $100$, $400$ and $1000\,\mathrm{km}$.

**Value at the operating point.** $g(0) = \mu/R_E^2 = 9.820\,\mathrm{m/s^2}$.

**Slope.** By the chain rule, $g'(h) = -\dfrac{2\mu}{(R_E + h)^3}$. At $h = 0$ that is $-2\mu/R_E^3$, which is the same as $-2g(0)/R_E = -3.08 \times 10^{-6}\,\mathrm{s^{-2}}$.

**The linearisation.**

$$
g(h) \approx g(0) - \frac{2g(0)}{R_E}\,h = g(0)\left(1 - \frac{2h}{R_E}\right).
$$

So gravity drops by a fraction of about $2h/R_E$ — about $3.1\%$ for every $100\,\mathrm{km}$ of height.

**The error bound.** $g''(h) = \dfrac{6\mu}{(R_E + h)^4}$, which is largest at $h = 0$. So $|R| \le \tfrac12 g''(0) h^2 = \dfrac{3\mu h^2}{R_E^4}$.

| $h$ | Exact $g$ | Linear | Error | Relative | Bound |
| --- | --- | --- | --- | --- | --- |
| $100\,\mathrm{km}$ | $9.519$ | $9.512$ | $0.007$ | $0.07\%$ | $0.007$ |
| $400\,\mathrm{km}$ | $8.694$ | $8.587$ | $0.107$ | $1.2\%$ | $0.116$ |
| $1000\,\mathrm{km}$ | $7.336$ | $6.737$ | $0.599$ | $8.2\%$ | $0.726$ |

(All $g$ values in $\mathrm{m/s^2}$.)

**Reading the table.** From $100$ to $400\,\mathrm{km}$ the step is four times bigger, and the error grows about sixteen-fold — four squared — as $O(h^2)$ predicts. The bound holds every time.

Notice the error is always positive: the straight line **[[always comes out low|gravity-picture]]**. That is because $g'' > 0$, so the true curve bends upward, away from its tangent. For the heights a rocket climbs through in the thick part of the atmosphere, the linear model is fine. For orbit it is not, and an orbit propagator uses the inverse-square law directly.
:::

## Differentials and how small errors spread

The **differential** notation turns the linear part of a change into an object of its own. If $y = f(x)$, let $dx$ ("d x") stand for any small change in $x$, and define the differential of $y$ as

$$
dy = f'(x)\,dx.
$$

So $dy$ is the change in $y$ *predicted by the tangent line* when $x$ moves by $dx$. The true change is $\Delta y = f(x + dx) - f(x)$. The two differ by the remainder, which is $O(dx^2)$.

With this reading, **[[Leibniz's|leibniz]]** $\dfrac{dy}{dx}$ really is one differential divided by another. The chain rule $\dfrac{dy}{dx} = \dfrac{dy}{du}\dfrac{du}{dx}$ then looks like cancelling a common factor — which is why the notation has lasted over three hundred years.

The most common use is **error propagation**. Suppose you know $x$ only to within a small uncertainty $\delta x$ ("delta x"). How uncertain is $y = f(x)$? To first order,

$$
\delta y \approx |f'(x)|\,\delta x.
$$

Divide both sides by $y$ to get the relative version:

$$
\frac{\delta y}{y} \approx \left|\frac{x f'(x)}{f(x)}\right|\frac{\delta x}{x}.
$$

The factor $x f'(x)/f(x)$ is the **[[sensitivity|sensitivity]]** of $f$ at $x$: the percent change in the output for each percent change in the input. For a power law $f(x) = c\,x^n$ it equals exactly $n$. (Check: $f'(x) = cnx^{n-1}$, so $x f'(x)/f(x) = cnx^n/(cx^n) = n$.) So a $1\%$ error in $x$ becomes an $n\%$ error in $y$. You will use this rule constantly.

::: example Orbital period from semi-major axis
The period of an orbit — the time for one lap — is $T = 2\pi\sqrt{a^3/\mu}$, where $a$ is the semi-major axis. For a space-station orbit with $a = 6778\,\mathrm{km}$, how much does a $1\,\mathrm{km}$ error in $a$ change the period?

**The period.**

$$
T = 2\pi\sqrt{\frac{(6.778 \times 10^6)^3}{3.986 \times 10^{14}}} = 5553.5\,\mathrm{s} = 92.6\,\mathrm{min}.
$$

**The differential.** Write $T = 2\pi\mu^{-1/2} a^{3/2}$, a power law in $a$, and differentiate with the power rule:

$$
dT = 2\pi\mu^{-1/2}\cdot\tfrac32 a^{1/2}\,da = 3\pi\sqrt{\frac{a}{\mu}}\,da, \qquad \frac{dT}{T} = \frac{3}{2}\frac{da}{a}.
$$

The sensitivity is $3/2$, the exponent.

**Numbers.** $\dfrac{dT}{da} = 3\pi\sqrt{\dfrac{6.778 \times 10^6}{3.986 \times 10^{14}}} = 1.229 \times 10^{-3}\,\mathrm{s/m}$. So $da = 1\,\mathrm{km} = 1000\,\mathrm{m}$ gives $dT = 1.229\,\mathrm{s}$.

**Sanity check.** Recomputing $T$ exactly at $a + 1\,\mathrm{km}$ gives a change of $1.2290\,\mathrm{s}$. With $da/a = 1.5 \times 10^{-4}$, the remainder is invisible. Push $da$ to $100\,\mathrm{km}$: the linear estimate is $122.9\,\mathrm{s}$ against an exact $123.4\,\mathrm{s}$. Still within half a percent, because $a^{3/2}$ bends only gently.

**Why it matters.** In one day the station makes $86\,400/5553.5 = 15.6$ orbits. A $1\,\mathrm{km}$ error in $a$ puts each lap $1.23\,\mathrm{s}$ off, and those add up to about $19\,\mathrm{s}$ a day. At $7.7\,\mathrm{km/s}$ that is roughly $150\,\mathrm{km}$ of **[[along-track|along-track]]** error. That is why orbit determination cares about the semi-major axis down to metres.
:::

::: example Drag about a flight condition
A re-entering body moves at $v_0 = 1000\,\mathrm{m/s}$ through air of density $\rho = 0.4\,\mathrm{kg/m^3}$. Its drag is $D(v) = \tfrac12 \rho v^2 C_D A$, with $C_D A = 3.0\,\mathrm{m^2}$ (drag coefficient times area). Linearise about $v_0$, and compare with the exact drag at $1050\,\mathrm{m/s}$.

**Value and slope.** $D(v_0) = \tfrac12(0.4)(10^6)(3.0) = 600\,\mathrm{kN}$. The derivative is $D'(v) = \rho v C_D A$, so $D'(v_0) = (0.4)(1000)(3.0) = 1200\,\mathrm{N}$ per $\mathrm{m/s}$.

**The linear model.**

$$
\Delta D \approx 1200\,\Delta v \quad\Longrightarrow\quad \Delta D(50\,\mathrm{m/s}) = 1200 \times 50 = 60.0\,\mathrm{kN}.
$$

**Exact.** $D(1050) - D(1000) = \tfrac12(0.4)(3.0)(1050^2 - 1000^2) = 0.6 \times 102\,500 = 61.5\,\mathrm{kN}$.

**The gap.** The difference, $1.5\,\mathrm{kN}$, is exactly $\tfrac12 D''\,\Delta v^2 = \tfrac12(\rho C_D A)(50)^2 = \tfrac12(1.2)(2500)$. Because $D$ is a quadratic, $D''$ is the constant $\rho C_D A = 1.2\,\mathrm{kg/m}$, so the Lagrange remainder is exact for any $\xi$.

The coefficient $1200\,\mathrm{N\,s/m}$ is the "aerodynamic damping" that appears in a linearised model of this body's speed. It is the *slope* of the drag curve at the trim speed, not the drag itself.
:::

## The small-angle approximations

Linearise the trig functions about $\theta = 0$ and you get the approximations that run all through attitude control (where pointing errors are a fraction of a degree) and guidance (where flight-path angles are steered in small steps).

- **Sine.** $\sin 0 = 0$ and $\cos 0 = 1$, so $\sin\theta \approx \theta$. The second derivative is $-\sin\xi$, so $|R| \le \tfrac12|\sin\xi|\,\theta^2 \le \tfrac12|\theta|^3$, using $|\sin\xi| \le |\xi| \le |\theta|$. The next lesson sharpens this to $\theta^3/6$.
- **Cosine.** $\cos 0 = 1$ and its slope $-\sin 0 = 0$, so the tangent line is flat: $\cos\theta \approx 1$. The remainder is $-\tfrac12\cos\xi\,\theta^2$, so $|R| \le \theta^2/2$. Here the linearisation throws away the whole effect, which is why engineers use $\cos\theta \approx 1 - \theta^2/2$ instead.
- **Tangent.** $\tan 0 = 0$ and $\sec^2 0 = 1$, so $\tan\theta \approx \theta$.

The angle must be in radians for any of this to work. $\sin\theta \approx \theta$ with $\theta$ in degrees is off by a factor of $57.3$.

| $\theta$ | $\theta\,(\mathrm{rad})$ | $\theta - \sin\theta$ | $1 - \cos\theta$ | $\tan\theta - \theta$ |
| --- | --- | --- | --- | --- |
| $5^\circ$ | $0.0873$ | $1.11 \times 10^{-4}$ | $3.81 \times 10^{-3}$ | $2.22 \times 10^{-4}$ |
| $10^\circ$ | $0.1745$ | $8.85 \times 10^{-4}$ | $1.52 \times 10^{-2}$ | $1.79 \times 10^{-3}$ |
| $15^\circ$ | $0.2618$ | $2.98 \times 10^{-3}$ | $3.41 \times 10^{-2}$ | $6.15 \times 10^{-3}$ |
| $30^\circ$ | $0.5236$ | $2.36 \times 10^{-2}$ | $1.34 \times 10^{-1}$ | $5.38 \times 10^{-2}$ |

At $15^\circ$, $\sin\theta \approx \theta$ is good to $1.1\%$ and $\cos\theta \approx 1$ to $3.5\%$.

Now double the angle to $30^\circ$. The sine error grows by a factor of eight, not four. The sine's linearisation is better than $O(\theta^2)$: since $f''(0) = -\sin 0 = 0$, there is no quadratic error term, and the true leading error is cubic — and $2^3 = 8$. When the curvature happens to be zero at your operating point (an **inflection point**), you get an extra order of accuracy for free.

## Linearising a model: the pendulum and the filter

The same idea works on an equation of motion, not only on a formula.

A pendulum of length $\ell$ swings by the rule

$$
\ddot\theta = -\frac{g_0}{\ell}\sin\theta.
$$

($\ddot\theta$, "theta double dot", is the angular acceleration.) Linearise the right side about the hanging-down equilibrium $\theta_0 = 0$. There $\sin\theta \approx \theta$, so

$$
\ddot\theta \approx -\frac{g_0}{\ell}\,\theta.
$$

This is a linear equation. Its solutions are sine waves with angular frequency $\sqrt{g_0/\ell}$: $3.13\,\mathrm{rad/s}$ for a one-metre pendulum, which is a period of $2\pi/3.13 = 2.0\,\mathrm{s}$. The linear model holds while $\theta$ stays small. At a $30^\circ$ swing, the real pull back toward the middle is $4.5\%$ weaker than the linear model says ($\sin 30^\circ/0.5236 = 0.955$), so the true period is a little longer.

Now linearise about the *upside-down* equilibrium, $\theta_0 = \pi$. Write $\theta = \pi + \delta$, where $\delta$ is a small tilt away from straight up. Since $\sin(\pi + \delta) = -\sin\delta \approx -\delta$,

$$
\ddot\delta \approx +\frac{g_0}{\ell}\,\delta.
$$

The sign flipped. Now any tilt makes the acceleration push it *further* away, and the solutions grow exponentially. Same pendulum, different operating point, **[[opposite stability|pendulum-picture]]** — and the linearisation told you so without solving anything nonlinear. This is exactly how a launch vehicle's nonlinear attitude dynamics become the linear model its autopilot is designed around.

The Kalman filter is the other big user of linearisation. Its cycle — predict a mean and a spread, then correct them with a measurement — is exact only when the dynamics $\dot x = f(x)$ and the measurement $z = h(x)$ are linear and the noise is Gaussian (bell-curve shaped). Only then do a mean and a **covariance** (the filter's measure of its own uncertainty) describe everything, and evolve by matrix algebra.

Real models are not linear. The **[[Extended Kalman Filter|ekf-history]]** keeps the same cycle by linearising both functions about the current best estimate $\hat x$ ("x hat"):

$$
f(x) \approx f(\hat x) + f'(\hat x)(x - \hat x), \qquad h(x) \approx h(\hat x) + h'(\hat x)(x - \hat x).
$$

It then uses the slopes $f'(\hat x)$ and $h'(\hat x)$ — called Jacobians when there are many variables — where the linear filter used its fixed matrices.

The price is the remainder. The dropped term $\tfrac12 f''(\xi)(x - \hat x)^2$ does not average out to zero. In the gravity example, every linearisation error had the same sign, because $g'' > 0$. So the predicted mean drifts off (a **bias**), the covariance stops describing the real spread of the error, and the filter becomes over-confident. If $\hat x$ is far from the truth, or the curvature $f''$ is strong over the size of the error, the mistakes pile up and the filter can **diverge** — lose track entirely. Sigma-point (unscented) and particle filters exist to avoid exactly this remainder.

::: key
Linearising a nonlinear model about an operating point $x_0$ replaces $f(x)$ by $f(x_0) + f'(x_0)(x - x_0)$. The neglected term is $\tfrac12 f''(\xi)(x - x_0)^2$: second order, but *not* zero-mean, so a linearised filter carries a bias that grows with curvature and with the distance between the reference and the truth.
:::

## Newton's method

Now turn the tangent line around and use it to *solve* equations. To solve $f(x) = 0$:

1. Start from a guess $x_n$.
2. Replace $f$ by its tangent line there, and solve that easy linear equation instead: $f(x_n) + f'(x_n)(x - x_n) = 0$.
3. Call the answer your next guess.

Solving step 2 for $x$ gives

$$
x_{n+1} = x_n - \frac{f(x_n)}{f'(x_n)}.
$$

In a picture, you **[[slide down the tangent|newton-picture]]** to the axis, then start again from there.

How fast does it close in? Let $r$ be the true root, so $f(r) = 0$. Write $f(r)$ with the Lagrange remainder about $x_n$:

$$
0 = f(r) = f(x_n) + f'(x_n)(r - x_n) + \tfrac12 f''(\xi)(r - x_n)^2.
$$

Divide by $f'(x_n)$ and rearrange, using the Newton formula for $x_{n+1}$:

$$
r - x_{n+1} = r - x_n + \frac{f(x_n)}{f'(x_n)} = -\frac{f''(\xi)}{2f'(x_n)}\,(r - x_n)^2.
$$

The new error is proportional to the *square* of the old one. This is **quadratic convergence**. An error of $10^{-3}$ becomes about $10^{-6}$, then $10^{-12}$: the number of correct digits roughly doubles each step. Compare bisection from the first lesson, which gains one binary digit (a factor of two) per step.

Newton's method needs two things: a derivative, and a starting guess close enough that the tangent points toward the right root. Where $f'(x_n) \approx 0$ the tangent is nearly flat, the step is enormous, and the method can wander off.

::: example Solving Kepler's equation
Kepler's equation $E - e\sin E = M$ has no formula for $E$, so every orbit propagator solves it numerically. Take $e = 0.1$ and $M = 1\,\mathrm{rad}$, and start from $E_0 = M$.

**Set up.** $f(E) = E - e\sin E - M$ and $f'(E) = 1 - e\cos E$ — the very derivative found by implicit differentiation two lessons ago. The iteration is

$$
E_{n+1} = E_n - \frac{E_n - e\sin E_n - M}{1 - e\cos E_n}.
$$

**Run it.**

| $n$ | $E_n$ | $f(E_n)$ | $\lvert E_n - E^* \rvert$ |
| --- | --- | --- | --- |
| 0 | $1.000000000$ | $-8.42 \times 10^{-2}$ | $8.9 \times 10^{-2}$ |
| 1 | $1.088953264$ | $3.39 \times 10^{-4}$ | $3.6 \times 10^{-4}$ |
| 2 | $1.088597758$ | $5.60 \times 10^{-9}$ | $5.9 \times 10^{-9}$ |
| 3 | $1.088597752$ | $0$ | $0$ |

The converged value is $E^* = 1.088597752\,\mathrm{rad}$.

**Check against the theory.** Each error is close to $0.045$ times the square of the one before: $0.045 \times (8.9 \times 10^{-2})^2 = 3.6 \times 10^{-4}$. The analysis predicts the factor $\dfrac{f''}{2f'} = \dfrac{e\sin E}{2(1 - e\cos E)} = 0.046$ at the root. They match. Three steps give twelve digits.

For eccentricities near $1$, the derivative $1 - e\cos E$ gets close to zero near periapsis, and a better starting guess than $E_0 = M$ is needed. That is the one place this method needs care.
:::

::: warning Linearise where you will operate
Linearise about the point you will actually be near. A common slip is linearising $\sin\theta$ about $0$ and then using it at $\theta = 60^\circ$, where the error is $17\%$ of $\theta$. Another is linearising the pendulum about hanging and applying it upside down. The linearisation belongs to its point. Move the operating point and every coefficient must be recomputed — which is why an EKF recomputes its Jacobians at every step.
:::

::: warning Second order is not the same as small
$O(h^2)$ says how the error *scales*, not that it is small. The constant in front is $\tfrac12|f''|$. If the curvature is large — near a saturation, a near-singular geometry, or $1/(1 - e\cos E)$ with $e$ near $1$ — the "second-order" error can dominate at steps you would have called small. Check the constant, not only the order.
:::

## Check yourself

::: check
Use the linearisation of $\sqrt{x}$ about $x_0 = 100$ to estimate $\sqrt{104}$. Bound the error with the Lagrange remainder, and compare with the exact value.
:::

::: answer
$f(x) = \sqrt{x}$, so $f(100) = 10$. The slope is $f'(x) = \dfrac{1}{2\sqrt{x}}$, so $f'(100) = \dfrac{1}{20} = 0.05$.

Estimate: $L(104) = 10 + 0.05 \times 4 = 10.2$.

Bound: $f''(x) = -\dfrac{1}{4}x^{-3/2}$. On $[100, 104]$ its size is largest at $100$, where it is $\dfrac{1}{4 \times 1000} = 2.5 \times 10^{-4}$. So

$$
|R| \le \tfrac12 (2.5 \times 10^{-4})(4)^2 = 2.0 \times 10^{-3}.
$$

Exact: $\sqrt{104} = 10.19804$, so the true error is $1.96 \times 10^{-3}$, inside the bound. The estimate is high because $f'' < 0$: the curve bends down below its tangent.
:::

::: check
Circular orbital speed is $v = \sqrt{\mu/r}$. What is the sensitivity of $v$ to $r$? If $r = 6771\,\mathrm{km}$ is uncertain by $10\,\mathrm{km}$, how uncertain is $v$?
:::

::: answer
$v = \mu^{1/2} r^{-1/2}$ is a power law with exponent $-\tfrac12$. So $\dfrac{dv}{v} = -\tfrac12\dfrac{dr}{r}$, and the sensitivity has size $\tfrac12$: a $1\%$ error in radius gives a $0.5\%$ error in speed, in the opposite direction.

Numbers: $v = \sqrt{3.986 \times 10^{14}/6.771 \times 10^6} = 7672.6\,\mathrm{m/s}$, and

$$
\delta v \approx \tfrac12 \times \frac{10}{6771} \times 7672.6 = 5.67\,\mathrm{m/s}.
$$

Recomputing exactly at $6781\,\mathrm{km}$ gives a speed lower by $5.66\,\mathrm{m/s}$. The differential is accurate to better than $0.2\%$ of itself.
:::

::: check
A full spherical liquid-oxygen tank has radius $r = 1.5\,\mathrm{m}$ (density $1141\,\mathrm{kg/m^3}$). A $1\,\mathrm{mm}$ error in the radius is worth how many kilograms of propellant? Use a differential, then check against the exact figure.
:::

::: answer
The mass is $m = \tfrac43\pi\rho r^3$, so

$$
dm = 4\pi\rho r^2\,dr = 4\pi(1141)(1.5)^2(0.001) = 32.3\,\mathrm{kg}.
$$

The total mass is $16\,130\,\mathrm{kg}$. The relative sensitivity is $3$ — the exponent — so $dm/m = 3\,dr/r = 3 \times 0.001/1.5 = 0.2\%$.

Exact: $\tfrac43\pi\rho\big[(1.501)^3 - (1.5)^3\big] = 32.28\,\mathrm{kg}$. The differential is off by about $0.02\,\mathrm{kg}$, the $O(dr^2)$ remainder. Thirty kilograms per millimetre is why tank geometry is measured, not assumed, before propellant loads are worked out from level sensors.
:::

::: check
Linearise $f(x) = \dfrac{1}{1 + x}$ about $x_0 = 0$. Find the *exact* remainder, and use it to find the range of $x$ over which the linearisation is accurate to $1\%$ of $f$.
:::

::: answer
$f(0) = 1$ and $f'(x) = -(1 + x)^{-2}$, so $f'(0) = -1$ and $L(x) = 1 - x$.

The remainder, over a common denominator:

$$
\frac{1}{1 + x} - (1 - x) = \frac{1 - (1 - x)(1 + x)}{1 + x} = \frac{1 - (1 - x^2)}{1 + x} = \frac{x^2}{1 + x}.
$$

This agrees with the Lagrange form: $f''(x) = 2(1 + x)^{-3}$, so $\tfrac12 f''(\xi)x^2 = \dfrac{x^2}{(1 + \xi)^3}$, which matches when $(1 + \xi)^3 = 1 + x$.

The relative error is $R/f = \dfrac{x^2}{1 + x} \cdot (1 + x) = x^2$, exactly. So $1\%$ accuracy needs $x^2 \le 0.01$, or $|x| \le 0.1$. Check: at $x = 0.1$ the linear value $0.9$ against the true $0.9091$ is indeed $1.0\%$ low. At $|x| = 0.2$ the error is $4\%$ — double the step, four times the error, as $O(x^2)$ promises.
:::

::: check
Take two Newton steps on $\cos x = x$ starting from $x_0 = 0.75$. Compare with the bisection result $0.74 \pm 0.01$ from the first lesson.
:::

::: answer
Let $f(x) = \cos x - x$, so $f'(x) = -\sin x - 1$.

**Step 1.** At $x_0 = 0.75$: $f = 0.73169 - 0.75 = -0.01831$ and $f' = -1.68164$. So

$$
x_1 = 0.75 - \frac{-0.01831}{-1.68164} = 0.75 - 0.01089 = 0.739111.
$$

**Step 2.** At $x_1$: $f = -4.35 \times 10^{-5}$ and $f' = -1.6736$. So $x_2 = 0.7390851$.

The true root is $0.7390851332$. The errors go $1.1 \times 10^{-2}$, then $2.6 \times 10^{-5}$, then $1.5 \times 10^{-10}$. Each is roughly the square of the one before, times the constant $\dfrac{|f''|}{2|f'|} = \dfrac{\cos r}{2(1 + \sin r)} \approx 0.22$.

So two Newton steps from a guess off by $0.011$ land within $2 \times 10^{-10}$ of the root — about nine correct digits. Bisection needed six halvings to get two.
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
| Pendulum | Hanging: $\ddot\theta \approx -(g_0/\ell)\theta$, stable; inverted: $\ddot\delta \approx +(g_0/\ell)\delta$, unstable |
| EKF | Linearise $f, h$ about $\hat x$; neglected $\tfrac12 f''(\xi)(x - \hat x)^2$ biases the covariance |
| Newton's method | $x_{n+1} = x_n - f(x_n)/f'(x_n)$; error squares each step |

The tangent line is the first chapter of a longer story. The next lesson keeps the second, third and higher terms — the Taylor series — and turns the remainder into a precise tool for deciding how many terms a numerical integrator or a filter needs.

::: context trim-point Where "trim" comes from
An airplane is **trimmed** when it is balanced to fly steadily with the pilot's hands off the controls: lift equals weight, thrust equals drag, and nothing is twisting it. Pilots set small tabs on the control surfaces, called trim tabs, to hold that balance. Control engineers borrowed the word: the trim point is the steady condition a vehicle normally sits at, and the linear model describes small wobbles around it.
:::

::: context big-o Where the O comes from
The **O** stands for *Ordnung*, German for "order". German mathematicians introduced the notation in the 1890s and early 1900s to say how fast something grows or shrinks, while ignoring the constant in front.

$O(h^2)$ means "no bigger than some fixed number times $h^2$ once $h$ is small". It does not say what the fixed number is. So $0.001h^2$ and $1000h^2$ are both $O(h^2)$ — which is why the lesson warns you to check the constant too.
:::

::: context gravity-picture The tangent sits under the curve
Here is the gravity example drawn to scale, from the ground to $1000\,\mathrm{km}$. The blue curve is the true inverse-square law. The red line is its tangent at the ground. The curve bends upward ($g'' > 0$), so it pulls away above the line, and the gap grows like $h^2$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 185" font-family="Inter, Arial, sans-serif">
  <line x1="55" y1="160" x2="350" y2="160" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="55" y1="160" x2="55" y2="12" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline points="55.0,27.2 69.5,33.3 84.0,39.2 98.5,45.1 113.0,50.7 127.5,56.3 142.0,61.7 156.5,67.0 171.0,72.2 185.5,77.3 200.0,82.3 214.5,87.1 229.0,91.9 243.5,96.6 258.0,101.1 272.5,105.6 287.0,109.9 301.5,114.2 316.0,118.4 330.5,122.5 345.0,126.5" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="55" y1="27.2" x2="345" y2="150.5" stroke="#b4232c" stroke-width="2"/>
  <line x1="345" y1="126.5" x2="345" y2="150.5" stroke="#f2b880" stroke-width="3"/>
  <g font-size="11" fill="#1f2a44">
    <text x="49" y="24" text-anchor="end">10</text>
    <text x="49" y="104" text-anchor="end">8</text>
    <text x="49" y="164" text-anchor="end">6.5</text>
    <text x="55" y="176" text-anchor="middle">0</text>
    <text x="200" y="176" text-anchor="middle">500</text>
    <text x="343" y="176" text-anchor="middle">1000</text>
    <text x="272" y="176" text-anchor="middle">h (km)</text>
    <text x="62" y="14">g (m/s²)</text>
  </g>
  <text x="190" y="66" font-size="12" fill="#1d6fd1">exact</text>
  <text x="150" y="128" font-size="12" fill="#b4232c">tangent line</text>
  <text x="345" y="108" font-size="11" fill="#1f2a44" text-anchor="end">gap 0.60</text>
</svg>
```
:::

::: context leibniz Leibniz's d
Gottfried Wilhelm Leibniz, who developed calculus at the same time as Isaac Newton, wrote $dx$ for a tiny change in $x$ and $\dfrac{dy}{dx}$ for the ratio of two tiny changes. Newton used dots instead — $\dot x$ — which is why physics still writes time derivatives with a dot. For centuries people argued about what an "infinitely small" $dx$ really was. The definition here sidesteps the argument: $dx$ is any ordinary small number, and $dy$ is what the tangent line predicts.
:::

::: context sensitivity A dial for "how much does this matter?"
Sensitivity answers a design question: if this input is $1\%$ off, how far off is the output? A sensitivity of $3$ means errors triple, so that input needs careful measuring. A sensitivity of $0.1$ means errors shrink, so a rough value will do.

Numerical analysts call the same number the **condition number**. A problem with a huge condition number is called **ill-conditioned**: tiny input errors blow up into large output errors, however carefully you compute.
:::

::: context along-track Along-track error
A satellite's position error is usually split three ways: **along-track** (ahead of or behind where it should be), **cross-track** (off to the side), and **radial** (too high or too low). A period error does not move the orbit sideways; it makes the satellite run early or late around the same path. So it shows up as along-track error, growing steadily lap after lap. That is why a prediction that is good today can put a satellite many kilometres from its true spot a few days later.
:::

::: context pendulum-picture Same pendulum, two operating points
Hanging down, a tilt makes gravity pull the bob back toward the middle: stable. Balanced upside down, a tilt makes gravity pull it further over: unstable. The linearisations say the same thing through the sign of $g_0/\ell$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="30" x2="120" y2="30" stroke="#1f2a44" stroke-width="3"/>
  <line x1="90" y1="30" x2="90" y2="150" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="90" y1="30" x2="136.5" y2="129.7" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="136.5" cy="129.7" r="8" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="136.5" y1="129.7" x2="100.2" y2="146.6" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="100.2,146.6 107.6,138.8 111.0,146.0" fill="#1d6fd1"/>
  <text x="90" y="182" font-size="12" fill="#1d6fd1" text-anchor="middle">hanging: pulled back</text>
  <line x1="240" y1="170" x2="300" y2="170" stroke="#1f2a44" stroke-width="3"/>
  <line x1="270" y1="170" x2="270" y2="50" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="270" y1="170" x2="316.5" y2="70.3" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="316.5" cy="70.3" r="8" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="316.5" y1="70.3" x2="343.7" y2="83.0" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="343.7,83.0 333.0,82.4 336.3,75.2" fill="#b4232c"/>
  <text x="262" y="192" font-size="12" fill="#b4232c" text-anchor="middle">inverted: pushed over</text>
</svg>
```
:::

::: context ekf-history The filter that went to the Moon
Rudolf Kálmán published his filter in 1960, for linear systems. Almost at once, Stanley Schmidt's group at NASA Ames saw that it could navigate a spacecraft to the Moon if the nonlinear orbit equations were linearised about the current estimate. That extended form flew in the Apollo navigation software. Today it runs in phones, drones, aircraft and nearly every spacecraft — and the warning in this lesson about the dropped remainder is the one its users still have to respect.
:::

::: context newton-picture Sliding down the tangent
Each Newton step follows the tangent line from the current point on the curve down to the axis. Here $f(x) = x^2 - 2$, whose root is $\sqrt2 \approx 1.414$. Starting at $x_0 = 3$, the first tangent lands at $x_1 = 1.833$ and the second at $x_2 = 1.462$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="150" x2="345" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline points="40.0,181.5 51.0,179.5 62.0,177.2 73.0,174.5 84.0,171.4 95.0,168.0 106.0,164.2 117.0,160.1 128.0,155.6 139.0,150.7 150.0,145.5 161.0,139.9 172.0,134.0 183.0,127.7 194.0,121.0 205.0,114.0 216.0,106.6 227.0,98.9 238.0,90.8 249.0,82.3 260.0,73.5 271.0,64.3 282.0,54.8 293.0,44.9 304.0,34.6 315.0,24.0 326.0,13.0" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <line x1="315" y1="24" x2="186.7" y2="150" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="186.7" y1="150" x2="186.7" y2="125.5" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="186.7" y1="125.5" x2="145.8" y2="150" stroke="#b4232c" stroke-width="2"/>
  <line x1="315" y1="24" x2="315" y2="150" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <circle cx="315" cy="24" r="3.5" fill="#1d6fd1"/>
  <circle cx="186.7" cy="125.5" r="3.5" fill="#b4232c"/>
  <circle cx="140.6" cy="150" r="3.5" fill="#1f2a44"/>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="315" y="166">x₀ = 3</text>
    <text x="192" y="166">x₁</text>
    <text x="150" y="166">x₂</text>
    <text x="120" y="140">root</text>
  </g>
</svg>
```

Near the root the curve looks more and more like its tangent, which is why each step does so much better than the last.
:::
