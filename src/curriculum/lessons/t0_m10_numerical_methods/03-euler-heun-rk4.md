---
id: l03-euler-heun-rk4
title: Euler, Heun and RK4
minutes: 28
covers:
  - numerical ODE integration: Euler, Heun, RK4, RK45 / Dormand-Prince
  - local vs global truncation error
---

Every simulation you will run, and every flight computer you will program, advances a state through time by the same act: given $\mathbf{y}$ now and a rule $\dot{\mathbf{y}} = \mathbf{f}(t, \mathbf{y})$ for how it changes, produce $\mathbf{y}$ a step $h$ later. The rule might be two-body gravity on a six-element state, or a rigid body with reaction wheels on a thirteen-element state, or a full vehicle model with hundreds. The integrator does not care. It sees a black box $\mathbf{f}$ that it may evaluate as often as it likes, and its job is to use those evaluations to match the Taylor expansion of the true solution through as many powers of $h$ as it can.

This lesson builds the three single-step methods that matter most — Euler, Heun and the classical fourth-order Runge–Kutta method, RK4 — and shows what each one buys per evaluation of $\mathbf{f}$. RK4 is the one to know from memory: it is the default fixed-step integrator in flight software, in six-degree-of-freedom simulators, and in most of the code you will inherit. Along the way the lesson makes precise the distinction the calculus module introduced, between the error of one step and the error of a whole integration, because that distinction is what the word "fourth order" refers to. Embedded pairs such as RK45 and Dormand–Prince, which add an error estimate to the step, are the subject of the next lesson.

## The problem and its Taylor expansion

The initial value problem is

$$
\dot{\mathbf{y}} = \mathbf{f}(t, \mathbf{y}), \qquad \mathbf{y}(t_0) = \mathbf{y}_0 ,
$$

with $\mathbf{y} \in \mathbb{R}^n$ the state and $\mathbf{f}$ the derivative function. A fixed-step method produces approximations $\mathbf{y}_k \approx \mathbf{y}(t_k)$ at $t_k = t_0 + kh$. The true solution, expanded about $t_k$, is

$$
\mathbf{y}(t_k + h) = \mathbf{y}(t_k) + h\,\dot{\mathbf{y}}(t_k) + \frac{h^2}{2}\ddot{\mathbf{y}}(t_k) + \frac{h^3}{6}\dddot{\mathbf{y}}(t_k) + \cdots
$$

The first derivative is free: $\dot{\mathbf{y}} = \mathbf{f}$. The higher derivatives are not — $\ddot{\mathbf{y}} = \partial_t \mathbf{f} + (\partial_{\mathbf{y}}\mathbf{f})\,\mathbf{f}$ involves the Jacobian of $\mathbf{f}$, and the third derivative is worse. Runge–Kutta methods sidestep this by evaluating $\mathbf{f}$ at cleverly chosen intermediate points and combining the results so that, when everything is expanded, the unwanted terms cancel and the combination reproduces the series through some power $h^p$. The standard test problem for checking all of this is the scalar $\dot{y} = -y$, $y(0) = 1$, whose solution $y = e^{-t}$ has every derivative available, so the errors can be measured exactly.

## Local and global truncation error

Two errors need names, and the order of a method depends on keeping them apart.

The **local truncation error** is the error of a single step started from the *exact* solution: take $\mathbf{y}(t_k)$, advance it one step with the method, and compare with $\mathbf{y}(t_k + h)$. It is a property of the formula, computable from the Taylor expansion, and it scales as some power $h^{p+1}$.

The **global truncation error** is the error at the end of the integration, $\mathbf{y}_N - \mathbf{y}(t_N)$, after $N = (t_N - t_0)/h$ steps, each started from the previous *approximate* value. Roughly, it is the sum of $N$ local errors, so

$$
\text{global} \approx N \times O(h^{p+1}) = \frac{t_N - t_0}{h}\,O(h^{p+1}) = O(h^p).
$$

The global error is one power of $h$ lower than the local error, because halving the step halves the error per step but doubles the number of steps. A method is called **order $p$** when its global error is $O(h^p)$, equivalently its local error is $O(h^{p+1})$. Halving $h$ divides the global error by $2^p$: by 2 for Euler, 4 for Heun, 16 for RK4.

The "roughly" hides one real effect. A local error committed at step $k$ is not simply added to the total; it is *propagated* by the dynamics from $t_k$ to $t_N$. If the flow is contracting, as for $\dot{y} = -y$, early errors are damped and the sum is smaller than $N$ times the local error. If the flow is expanding, or neutral like an orbit, they persist or grow. The rigorous bound has the form $C\,h^p\,(e^{L(t_N - t_0)} - 1)/L$, with $L$ a Lipschitz constant of $\mathbf{f}$, but the order $p$ is what you measure and what you use.

::: key
Local truncation error is the error of one step from exact data; global truncation error is the error after integrating over a fixed interval. A method with local error $O(h^{p+1})$ has global error $O(h^p)$ and is of order $p$, because it takes $O(1/h)$ steps. Euler: local $O(h^2)$, global $O(h)$. RK4: local $O(h^5)$, global $O(h^4)$.
:::

## Euler's method

Keep only the first two terms of the expansion:

$$
\mathbf{y}_{k+1} = \mathbf{y}_k + h\,\mathbf{f}(t_k, \mathbf{y}_k).
$$

One evaluation per step. The omitted terms begin with $\tfrac12 h^2 \ddot{\mathbf{y}}$, so the local error is $O(h^2)$ and the method is first order. For $\dot y = -y$ from $y = 1$ with $h = 0.1$, one step gives $0.9$ against $e^{-0.1} = 0.904837$: local error $4.84 \times 10^{-3}$, and the estimate $h^2/2 = 5.00 \times 10^{-3}$ is right to the leading term.

Euler is worth writing down because everything else is a repair of it, and because the mechanism of its failure on oscillatory problems — the outward spiral — is derived from this one line in a later lesson. It is never the right choice for a production propagator: in the convergence table below it needs $190{,}000$ evaluations to do what RK4 does in 32.

## Heun's method: predict, then correct

Euler uses the slope at the start of the step for the whole step. The true change is better approximated by the *average* slope over the step, and the trapezoidal rule of integration says how to average: half the slope at the start, half at the end. The slope at the end needs $\mathbf{y}_{k+1}$, which is unknown, so predict it with an Euler step and correct:

$$
\begin{aligned}
\mathbf{k}_1 &= \mathbf{f}(t_k, \mathbf{y}_k), \\
\mathbf{k}_2 &= \mathbf{f}(t_k + h,\ \mathbf{y}_k + h\,\mathbf{k}_1), \\
\mathbf{y}_{k+1} &= \mathbf{y}_k + \frac{h}{2}\left(\mathbf{k}_1 + \mathbf{k}_2\right).
\end{aligned}
$$

Two evaluations per step. To see the order, apply it to $\dot y = \lambda y$ and write $z = h\lambda$: $k_1 = \lambda y$, $k_2 = \lambda(y + h\lambda y) = \lambda y(1 + z)$, and

$$
y_{k+1} = y_k\left[1 + \tfrac{z}{2}\left(1 + (1 + z)\right)\right] = y_k\left(1 + z + \tfrac{z^2}{2}\right),
$$

which is $e^{z}$ through the quadratic term. The first omitted term is $z^3/6$: local error $O(h^3)$, second order. On the test step, $y_1 = 0.905$ against $0.904837$, an error of $1.63 \times 10^{-4}$; the estimate $h^3/6 = 1.67 \times 10^{-4}$ is the leading term, and the residual $-h^4/24 = -4 \times 10^{-6}$ accounts for the rest.

Heun's method is also called the improved Euler method or RK2. The *midpoint method* — evaluate the slope at $t_k + h/2$ using an Euler half-step, then take a full step with it — is the other common second-order scheme with the same cost and the same order.

## The classical Runge–Kutta method, RK4

Four evaluations per step, two of them at the midpoint, weighted like Simpson's rule:

$$
\begin{aligned}
\mathbf{k}_1 &= \mathbf{f}(t_k,\ \mathbf{y}_k), \\
\mathbf{k}_2 &= \mathbf{f}\!\left(t_k + \tfrac{h}{2},\ \mathbf{y}_k + \tfrac{h}{2}\mathbf{k}_1\right), \\
\mathbf{k}_3 &= \mathbf{f}\!\left(t_k + \tfrac{h}{2},\ \mathbf{y}_k + \tfrac{h}{2}\mathbf{k}_2\right), \\
\mathbf{k}_4 &= \mathbf{f}\!\left(t_k + h,\ \mathbf{y}_k + h\,\mathbf{k}_3\right), \\
\mathbf{y}_{k+1} &= \mathbf{y}_k + \frac{h}{6}\left(\mathbf{k}_1 + 2\mathbf{k}_2 + 2\mathbf{k}_3 + \mathbf{k}_4\right).
\end{aligned}
$$

Read it as a story. $\mathbf{k}_1$ is the slope at the start. $\mathbf{k}_2$ is the slope at the midpoint, reached by following $\mathbf{k}_1$ for half a step. $\mathbf{k}_3$ is a *better* midpoint slope, reached by following $\mathbf{k}_2$ instead. $\mathbf{k}_4$ is the slope at the end, reached by following $\mathbf{k}_3$ for the full step. The final update weights the ends once and the middle twice, the $1, 2, 2, 1$ of Simpson's rule, divided by 6 so the weights sum to 1. When $\mathbf{f}$ depends on $t$ alone, RK4 *is* Simpson's rule applied to $\int \mathbf{f}\,dt$.

The order comes out of the same expansion as for Heun. With $\dot y = \lambda y$ and $z = h\lambda$:

$$
k_1 = \lambda y, \quad
k_2 = \lambda y\left(1 + \tfrac{z}{2}\right), \quad
k_3 = \lambda y\left(1 + \tfrac{z}{2} + \tfrac{z^2}{4}\right), \quad
k_4 = \lambda y\left(1 + z + \tfrac{z^2}{2} + \tfrac{z^3}{4}\right).
$$

Form $\tfrac{h}{6}(k_1 + 2k_2 + 2k_3 + k_4)$. The constant terms give $1 + 2 + 2 + 1 = 6$; the $z$ terms give $2 \cdot \tfrac{z}{2} + 2 \cdot \tfrac{z}{2} + z = 3z$; the $z^2$ terms give $2 \cdot \tfrac{z^2}{4} + \tfrac{z^2}{2} = z^2$; the $z^3$ term is $\tfrac{z^3}{4}$. So

$$
y_{k+1} = y_k\left[1 + \tfrac{z}{6}\left(6 + 3z + z^2 + \tfrac{z^3}{4}\right)\right] = y_k\left(1 + z + \frac{z^2}{2} + \frac{z^3}{6} + \frac{z^4}{24}\right),
$$

exactly $e^z$ through the quartic term. The first omitted term is $z^5/120$: local error $O(h^5)$, global $O(h^4)$, order 4. For a general nonlinear $\mathbf{f}$ the proof is longer — the intermediate slopes have to reproduce the Jacobian terms in $\ddot{\mathbf{y}}$ and $\dddot{\mathbf{y}}$ — but the coefficients $\tfrac12, \tfrac12, 1$ and $\tfrac16, \tfrac13, \tfrac13, \tfrac16$ were chosen by Kutta in 1901 precisely so that all of those terms match through $h^4$.

::: key
Classical RK4: $\mathbf{k}_1 = \mathbf{f}(t, \mathbf{y})$, $\mathbf{k}_2 = \mathbf{f}(t + h/2,\ \mathbf{y} + h\mathbf{k}_1/2)$, $\mathbf{k}_3 = \mathbf{f}(t + h/2,\ \mathbf{y} + h\mathbf{k}_2/2)$, $\mathbf{k}_4 = \mathbf{f}(t + h,\ \mathbf{y} + h\mathbf{k}_3)$, then $\mathbf{y}_{n+1} = \mathbf{y}_n + \dfrac{h}{6}(\mathbf{k}_1 + 2\mathbf{k}_2 + 2\mathbf{k}_3 + \mathbf{k}_4)$. Four evaluations per step; matches the Taylor series through $h^4$; local error $O(h^5)$, global $O(h^4)$.
:::

::: example One RK4 step by hand
Take $\dot y = -y$, $y_0 = 1$, $h = 0.1$, so $f(t, y) = -y$.

$k_1 = -1$. Then $y + \tfrac{h}{2}k_1 = 1 - 0.05 = 0.95$, so $k_2 = -0.95$. Then $y + \tfrac{h}{2}k_2 = 1 - 0.0475 = 0.9525$, so $k_3 = -0.9525$. Then $y + h k_3 = 1 - 0.09525 = 0.90475$, so $k_4 = -0.90475$.

Weighted sum: $k_1 + 2k_2 + 2k_3 + k_4 = -1 - 1.9 - 1.905 - 0.90475 = -5.70975$. Update: $y_1 = 1 + \tfrac{0.1}{6}(-5.70975) = 1 - 0.0951625 = 0.9048375$.

The exact value is $e^{-0.1} = 0.904837418$, so the local error is $8.20 \times 10^{-8}$. The estimate $h^5/5! = 8.33 \times 10^{-8}$ gives the leading term, and the next term of the exponential series, $-h^6/720 = -1.4 \times 10^{-9}$, accounts for the difference. Compare the three methods on this same single step: Euler $4.8 \times 10^{-3}$, Heun $1.6 \times 10^{-4}$, RK4 $8.2 \times 10^{-8}$. Four evaluations instead of one bought five orders of magnitude.
:::

## Measuring the order

The order is a testable prediction, and testing it is how you find out whether an integrator is coded correctly. Integrate $\dot y = -y$ from $t = 0$ to $t = 1$ with each method at a sequence of halving step sizes, and record the global error $|y_N - e^{-1}|$:

| $h$ | Euler | ratio | Heun | ratio | RK4 | ratio |
| --- | --- | --- | --- | --- | --- | --- |
| 0.2 | $4.02 \times 10^{-2}$ | — | $2.86 \times 10^{-3}$ | — | $5.80 \times 10^{-6}$ | — |
| 0.1 | $1.92 \times 10^{-2}$ | 2.09 | $6.62 \times 10^{-4}$ | 4.32 | $3.33 \times 10^{-7}$ | 17.4 |
| 0.05 | $9.39 \times 10^{-3}$ | 2.04 | $1.59 \times 10^{-4}$ | 4.16 | $2.00 \times 10^{-8}$ | 16.7 |
| 0.025 | $4.65 \times 10^{-3}$ | 2.02 | $3.91 \times 10^{-5}$ | 4.08 | $1.22 \times 10^{-9}$ | 16.3 |
| 0.0125 | $2.31 \times 10^{-3}$ | 2.01 | $9.67 \times 10^{-6}$ | 4.04 | $7.56 \times 10^{-11}$ | 16.2 |

The ratios approach $2^1$, $2^2$ and $2^4$ from above as $h$ shrinks and the higher-order terms fade. On a log–log plot of error against $h$ the three methods are straight lines of slope 1, 2 and 4. This is the plot the module's first exercise asks for, and it is the acceptance test for any integrator you write: a measured RK4 ratio near 8 instead of 16 means a stage is wrong — a common slip is using $\mathbf{k}_1$ instead of $\mathbf{k}_2$ when forming $\mathbf{k}_3$, which silently demotes the method to third order.

::: example What accuracy costs
Suppose you need the global error at $t = 1$ below $10^{-6}$ for $\dot y = -y$. Scale each method's $h = 0.1$ error in the table by its order to find the step that meets the target, then count evaluations.

Euler: error $\propto h$, so $h = 0.1 \times (10^{-6}/1.92 \times 10^{-2}) = 5.2 \times 10^{-6}$, about $192{,}000$ steps at one evaluation each.

Heun: error $\propto h^2$, so $h = 0.1 \times (10^{-6}/6.62 \times 10^{-4})^{1/2} = 3.9 \times 10^{-3}$, about 257 steps at two evaluations: 514 evaluations.

RK4: error $\propto h^4$, so $h = 0.1 \times (10^{-6}/3.33 \times 10^{-7})^{1/4} = 0.13$, 8 steps at four evaluations: 32 evaluations.

Six thousand to one between Euler and RK4, for the same answer. This ratio only widens as the tolerance tightens, because each halving of the target costs Euler a doubling of work and RK4 a factor of $2^{1/4} = 1.19$. The higher-order method is cheaper for any accuracy an engineer would actually ask for; the exceptions, where a low-order method wins, are problems whose $\mathbf{f}$ is not smooth — a thruster switching on, a stage separating — where the Taylor expansion the high order relies on does not exist across the event.
:::

## A step on a real orbit

The test problem is tame because its solution decays. An orbit does not: the state goes round and round, and errors have nowhere to hide. Take a circular orbit at $500\,\mathrm{km}$ altitude, $r_0 = 6{,}878.137\,\mathrm{km}$, $v_0 = \sqrt{\mu/r_0} = 7.6126\,\mathrm{km/s}$, period $T = 5{,}677\,\mathrm{s}$, with $\dot{\mathbf{r}} = \mathbf{v}$ and $\dot{\mathbf{v}} = -\mu\,\mathbf{r}/r^3$. Start at $\mathbf{r} = (r_0, 0)$, $\mathbf{v} = (0, v_0)$ and take one step, comparing with the exact circular motion:

| $h$ | Euler | Heun | RK4 |
| --- | --- | --- | --- |
| 60 s | $15.2\,\mathrm{km}$ | $0.336\,\mathrm{km}$ | $7.5 \times 10^{-5}\,\mathrm{km}$ |
| 30 s | $3.79\,\mathrm{km}$ | $0.042\,\mathrm{km}$ | $2.3 \times 10^{-6}\,\mathrm{km}$ |
| 15 s | $0.948\,\mathrm{km}$ | $0.0052\,\mathrm{km}$ | $7.2 \times 10^{-8}\,\mathrm{km}$ |

Local orders again: halving $h$ divides Euler's error by 4 ($h^2$), Heun's by 8 ($h^3$), RK4's by 32 ($h^5$). Euler's 15 km error after one minute is almost entirely radial and outward, $r_1 - r_0 = +15.1\,\mathrm{km}$: the Euler step moves the vehicle along its velocity, tangent to the circle, and the tangent leaves the circle by $(v_0 h)^2/(2r_0) = (456.8)^2/(2 \times 6{,}878) = 15.2\,\mathrm{km}$. Every Euler step does this, always outward, which is the spiral you will meet two lessons from now.

After one full revolution at $h \approx 60\,\mathrm{s}$ (95 steps) the position errors are: Euler $16{,}000\,\mathrm{km}$ — the vehicle is not in orbit any more — Heun $277\,\mathrm{km}$, RK4 $26\,\mathrm{m}$. At $h \approx 30\,\mathrm{s}$ RK4 gives $1.4\,\mathrm{m}$, a ratio of 18, consistent with fourth order. A 30 s step is a coarse step for RK4 on a LEO orbit; a typical simulator uses 1 to 10 s and gets millimetres per revolution, at which point force-model error, not integration error, limits the answer.

::: warning
Do not confuse the order with the accuracy. Order says how the error *scales* with $h$; the constant in front depends on the problem. An RK4 step of 60 s on a LEO orbit is accurate to 7 cm; the same step on a Molniya orbit near perigee, where the acceleration changes far faster, is accurate to nothing. The way to choose a fixed step is to halve it until the answer stops changing at the level you care about, then keep a margin. The way to avoid the question altogether is the adaptive control of the next lesson.
:::

::: warning
Always land exactly on the final time. If $(t_N - t_0)/h$ is not an integer, take a short final step rather than overshooting or stopping early; an integrator that reports the state at $t = 5{,}640\,\mathrm{s}$ when you asked for $5{,}677\,\mathrm{s}$ has a $280\,\mathrm{km}$ "error" that is not an integration error at all. Comparisons of integrators are only meaningful at the same final time.
:::

::: note
In code, write RK4 exactly as the tableau reads, on the whole state vector at once, and never unpack the state into named scalars inside the stepper. The stepper should not know it is propagating an orbit.

```python
def rk4_step(f, t, y, h):
    k1 = f(t, y)
    k2 = f(t + h / 2, y + h * k1 / 2)
    k3 = f(t + h / 2, y + h * k2 / 2)
    k4 = f(t + h, y + h * k3)
    return y + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4)

# rk4_step(lambda t, y: -y, 0.0, 1.0, 0.1)  ->  0.9048375
```
:::

## Check yourself

::: check
State the local and global truncation error of Heun's method, and explain in one sentence why they differ by one power of $h$.
:::

::: answer
Heun matches the Taylor series of the solution through $h^2$, so its local error — the error of one step from exact data — is $O(h^3)$. Integrating over a fixed interval takes $N = (t_N - t_0)/h$ steps, so the accumulated global error is about $N \times O(h^3) = O(h^2)$: the method is second order. One power is lost because the number of steps grows as $1/h$.
:::

::: check
Apply one Heun step to $\dot y = -y$ from $y = 1$ with $h = 0.2$, compute the local error, and compare it with the leading-term estimate.
:::

::: answer
$k_1 = -1$; predictor $y + hk_1 = 0.8$, so $k_2 = -0.8$; update $y_1 = 1 + 0.1(-1 - 0.8) = 0.82$. Exact: $e^{-0.2} = 0.818731$. Local error $1.27 \times 10^{-3}$. The leading term is $h^3/6 = 1.33 \times 10^{-3}$; the next, $-h^4/24 = -6.7 \times 10^{-5}$, brings the estimate to $1.27 \times 10^{-3}$. Halving $h$ to 0.1 gave $1.63 \times 10^{-4}$ in the lesson, a ratio of 7.8, close to $2^3 = 8$.
:::

::: check
A colleague's RK4 gives errors of $3.2 \times 10^{-6}$ at $h = 0.1$ and $4.1 \times 10^{-7}$ at $h = 0.05$ on the test problem. What order is the code actually achieving, and what kind of bug does that suggest?
:::

::: answer
The ratio is $3.2 \times 10^{-6}/4.1 \times 10^{-7} = 7.8 \approx 2^3$, so the implementation is third order, not fourth. RK4's fourth-order property depends on the specific stage structure; a slip that breaks one stage while keeping the method consistent typically leaves a third-order method. The classic instance is computing $\mathbf{k}_3$ from $\mathbf{k}_1$ instead of $\mathbf{k}_2$, or evaluating $\mathbf{k}_4$ at $t + h/2$. The absolute error at $h = 0.1$ being ten times the correct RK4 value ($3.3 \times 10^{-7}$) is a second clue.
:::

::: check
Explain why RK4 applied to $\dot y = g(t)$, with no dependence on $y$, reduces to Simpson's rule for $\int_{t_k}^{t_k + h} g\,dt$.
:::

::: answer
When $\mathbf{f}$ does not depend on $\mathbf{y}$ the intermediate states are irrelevant: $k_1 = g(t_k)$, $k_2 = k_3 = g(t_k + h/2)$, $k_4 = g(t_k + h)$. The update is $\tfrac{h}{6}\left[g(t_k) + 4g(t_k + h/2) + g(t_k + h)\right]$, which is Simpson's rule on the interval with half-width $h/2$: $\tfrac{h/2}{3}[g_0 + 4g_1 + g_2]$. Simpson's rule is exact for cubics and has error $O(h^5)$ per panel, consistent with RK4's local error.
:::

::: check
For the 500 km circular orbit, RK4 with $h = 60\,\mathrm{s}$ gives a position error of about $26\,\mathrm{m}$ per revolution. Estimate the error per revolution at $h = 10\,\mathrm{s}$, and the number of function evaluations per revolution.
:::

::: answer
Global error scales as $h^4$, so reducing $h$ by a factor of 6 reduces the error by $6^4 = 1{,}296$: about $26/1{,}296 = 0.020\,\mathrm{m}$, two centimetres per revolution. Steps per revolution: $5{,}677/10 = 568$, at four evaluations each, about $2{,}270$ evaluations. The measured ratio from 60 s to 30 s was 18 rather than 16, so expect the true figure to be somewhat smaller than 2 cm; either way it is below the level at which atmospheric drag uncertainty dominates.
:::

## Summary

| Item | Statement |
| --- | --- |
| Local truncation error | Error of one step from exact data; $O(h^{p+1})$ for a method of order $p$ |
| Global truncation error | Error after a fixed interval; $O(h^p)$, one order lower, because $N = O(1/h)$ steps |
| Euler | $\mathbf{y}_{k+1} = \mathbf{y}_k + h\,\mathbf{f}(t_k, \mathbf{y}_k)$; order 1; 1 evaluation |
| Heun (RK2) | $\mathbf{k}_1 = \mathbf{f}(t_k, \mathbf{y}_k)$, $\mathbf{k}_2 = \mathbf{f}(t_k + h, \mathbf{y}_k + h\mathbf{k}_1)$, $\mathbf{y}_{k+1} = \mathbf{y}_k + \tfrac{h}{2}(\mathbf{k}_1 + \mathbf{k}_2)$; order 2 |
| RK4 | Stages at $0, h/2, h/2, h$; weights $\tfrac{1}{6}(1, 2, 2, 1)$; order 4; 4 evaluations |
| Linear test $\dot y = \lambda y$ | Euler $1 + z$, Heun $1 + z + z^2/2$, RK4 through $z^4/24$, with $z = h\lambda$ |
| Order test | Halve $h$; global error ratio $\to 2^p$: 2, 4, 16 |
| Test-problem errors at $h = 0.1$, $t = 1$ | Euler $1.9 \times 10^{-2}$, Heun $6.6 \times 10^{-4}$, RK4 $3.3 \times 10^{-7}$ |
| Cost for $10^{-6}$ on the test problem | Euler $1.9 \times 10^{5}$ evaluations, Heun 514, RK4 32 |

RK4 takes the same step regardless of what the solution is doing. The next lesson gives the integrator a way to measure its own local error each step, using an embedded pair such as Dormand–Prince, and to choose $h$ accordingly.
