---
id: l03-euler-heun-rk4
title: Euler, Heun and RK4
minutes: 19
covers:
  - numerical ODE integration: Euler, Heun, RK4, RK45 / Dormand-Prince
  - local vs global truncation error
---

You are driving with no map, only a speedometer and a compass. Every minute you glance at them and say: "at this speed and heading, a minute from now I will be about *there*." Then you mark the spot and do it again. That is how every simulation you will run, and every flight computer you will program, moves a vehicle forward in time.

The mathematical version: you know the **[[state|state-vector]]** $\mathbf{y}$ now, and a rule $\dot{\mathbf{y}} = \mathbf{f}(t, \mathbf{y})$ for how fast it is changing. You want $\mathbf{y}$ a short time $h$ later. The rule might be two-body gravity on a six-number state, a rigid body with reaction wheels on a thirteen-number state, or a full vehicle model with hundreds. The integrator does not care. It sees a black box $\mathbf{f}$ that it may call as often as it likes. Its job is to use those calls to match the true solution as closely as possible.

This lesson builds the three single-step methods that matter most — **Euler**, **Heun**, and the classical fourth-order **Runge–Kutta** method, **RK4** — and shows what each buys per call of $\mathbf{f}$. RK4 is the one to know from memory. It is the default fixed-step integrator in flight software, in **[[six-degree-of-freedom simulators|six-dof]]**, and in most code you will inherit. Along the way the lesson pins down the difference between the error of one step and the error of a whole run, because that is what "fourth order" means. Methods that also *measure* their own error each step — the embedded pairs RK45 and Dormand–Prince — are the subject of the next lesson.

## The problem and its Taylor series

The **initial value problem** is

$$
\dot{\mathbf{y}} = \mathbf{f}(t, \mathbf{y}), \qquad \mathbf{y}(t_0) = \mathbf{y}_0 .
$$

Read $\dot{\mathbf{y}}$ as "y dot", the rate of change of $\mathbf{y}$. Here $\mathbf{y}$ is a list of $n$ numbers (in $\mathbb{R}^n$), and $\mathbf{f}$ is the **derivative function** that computes its rate of change. A fixed-step method produces approximations $\mathbf{y}_k \approx \mathbf{y}(t_k)$ at the times $t_k = t_0 + kh$.

The true solution, expanded as a Taylor series about $t_k$, is

$$
\mathbf{y}(t_k + h) = \mathbf{y}(t_k) + h\,\dot{\mathbf{y}}(t_k) + \frac{h^2}{2}\ddot{\mathbf{y}}(t_k) + \frac{h^3}{6}\dddot{\mathbf{y}}(t_k) + \cdots
$$

The first derivative is free: $\dot{\mathbf{y}} = \mathbf{f}$. The higher ones are not. By the chain rule, $\ddot{\mathbf{y}} = \partial_t \mathbf{f} + (\partial_{\mathbf{y}}\mathbf{f})\,\mathbf{f}$ (the $\partial$ symbols are partial derivatives), which needs the Jacobian of $\mathbf{f}$ — the table of all its slopes, and the third derivative is worse.

**Runge–Kutta methods** get around this. They call $\mathbf{f}$ at a few cleverly chosen points inside the step and blend the answers. When everything is expanded, the blend matches the Taylor series up to some power $h^p$ — without ever computing a second derivative.

The standard test problem is $\dot{y} = -y$, $y(0) = 1$. Its solution is $y = e^{-t}$, so every error can be measured exactly.

## Local and global truncation error

Back to the drive. Each glance-and-guess is a little off. Two questions: how far off is one guess, starting from the right spot? And how far off are you at the end of the trip, after all the little errors pile up? Those are two different errors, and the order of a method depends on keeping them apart.

The **local truncation error** is the error of one step started from the *exact* solution. Take $\mathbf{y}(t_k)$, advance it one step with the method, and compare with $\mathbf{y}(t_k + h)$. It is a property of the formula, found from the Taylor series. It scales as some power $h^{p+1}$.

The **global truncation error** is the error at the end of the run, $\mathbf{y}_N - \mathbf{y}(t_N)$, after $N = (t_N - t_0)/h$ steps, each started from the previous *approximate* value. Roughly, it is $N$ local errors added up:

$$
\text{global} \approx N \times O(h^{p+1}) = \frac{t_N - t_0}{h}\,O(h^{p+1}) = O(h^p).
$$

**[[Big-O notation|big-o]]** $O(h^p)$ means "about some constant times $h^p$ when $h$ is small". So the global error is one power of $h$ lower than the local error. Halving the step cuts each step's error by $2^{p+1}$ but doubles the number of steps.

A method is called **order $p$** when its global error is $O(h^p)$ — equivalently, its local error is $O(h^{p+1})$. Halving $h$ divides the global error by $2^p$: by 2 for Euler, 4 for Heun, 16 for RK4.

The word "roughly" hides one real effect. An error made at step $k$ is not only added to the total. The dynamics carry it forward from $t_k$ to $t_N$. If the solutions squeeze together, as for $\dot{y} = -y$, early errors fade and the total is smaller than $N$ times the local error. If they spread apart, or circle like an orbit, errors persist or grow. The rigorous bound is $C\,h^p\,(e^{L(t_N - t_0)} - 1)/L$, where $L$ is a **[[Lipschitz constant|lipschitz]]** of $\mathbf{f}$. But the order $p$ is what you measure and what you use.

::: key
Local truncation error is the error of one step from exact data; global truncation error is the error after integrating over a fixed interval. RK4: local $O(h^5)$, global $O(h^4)$. Euler: local $O(h^2)$, global $O(h)$. Global is always one order below local because you take $O(1/h)$ steps.
:::

## Euler's method

The drive exactly: use the slope at the start of the step for the whole step. Keep only the first two terms of the Taylor series:

$$
\mathbf{y}_{k+1} = \mathbf{y}_k + h\,\mathbf{f}(t_k, \mathbf{y}_k).
$$

One call of $\mathbf{f}$ per step. The terms left out begin with $\tfrac12 h^2 \ddot{\mathbf{y}}$, so the local error is $O(h^2)$ and the method is first order.

Check it on $\dot y = -y$ from $y = 1$ with $h = 0.1$. One step gives $1 + 0.1 \times (-1) = 0.9$. The exact answer is $e^{-0.1} = 0.904837$. The local error is $4.84 \times 10^{-3}$, and the leading-term estimate $h^2/2 = 5.00 \times 10^{-3}$ gets it nearly right. (Here $\ddot y = y = 1$.)

Euler is worth writing down because every other method is a **[[repair of it|euler-picture]]**. And a later lesson derives, from this one line, why it makes orbits spiral outward. It is never the right choice for a production propagator. In the table below it needs $190{,}000$ calls to do what RK4 does in 32.

::: key
Euler: $\mathbf{y}_{k+1} = \mathbf{y}_k + h\,\mathbf{f}(t_k, \mathbf{y}_k)$. One call per step; first order.
:::

## Heun's method: predict, then correct

Euler uses the slope at the start for the whole step. But the slope changes during the step. A better guess is the *average* slope over the step. The **[[trapezoidal rule|trapezoid]]** says how to average: half the slope at the start plus half the slope at the end.

The slope at the end needs $\mathbf{y}_{k+1}$, which we do not have yet. So **predict** it with an Euler step, then **correct**:

$$
\begin{aligned}
\mathbf{k}_1 &= \mathbf{f}(t_k, \mathbf{y}_k), \\
\mathbf{k}_2 &= \mathbf{f}(t_k + h,\ \mathbf{y}_k + h\,\mathbf{k}_1), \\
\mathbf{y}_{k+1} &= \mathbf{y}_k + \frac{h}{2}\left(\mathbf{k}_1 + \mathbf{k}_2\right).
\end{aligned}
$$

In words: $\mathbf{k}_1$ is the slope now. $\mathbf{k}_2$ is the slope at the end of a trial Euler step. Then take the real step with their average. Two calls per step.

::: note Why Heun is second order
Apply it to the linear test $\dot y = \lambda y$ ($\lambda$ is "lambda", any constant), and write $z = h\lambda$. Then $k_1 = \lambda y$, and $k_2 = \lambda(y + h\lambda y) = \lambda y(1 + z)$. So

$$
y_{k+1} = y_k + \frac{h}{2}\,\lambda y_k\big(1 + (1 + z)\big) = y_k\left(1 + z + \tfrac{z^2}{2}\right).
$$

The exact answer is $y_k e^{z} = y_k(1 + z + z^2/2 + z^3/6 + \cdots)$. Heun matches through $z^2$. The first term it misses is $z^3/6$, so the local error is $O(h^3)$ and the method is second order.
:::

On the test step: $k_1 = -1$, the predictor is $0.9$, so $k_2 = -0.9$, and $y_1 = 1 + 0.05 \times (-1.9) = 0.905$. The exact value is $0.904837$, an error of $1.63 \times 10^{-4}$. The estimate $h^3/6 = 1.67 \times 10^{-4}$ is the leading term, and the next one, $-h^4/24 = -4 \times 10^{-6}$, accounts for the rest.

Heun's method is also called the **improved Euler** method or **RK2**. The **midpoint method** is its twin: use an Euler half-step to reach the middle of the step, take the slope there, and use it for the full step. Same cost, same order.

## The classical Runge–Kutta method, RK4

Four calls per step: one at the start, two at the midpoint, one at the end.

$$
\begin{aligned}
\mathbf{k}_1 &= \mathbf{f}(t_k,\ \mathbf{y}_k), \\
\mathbf{k}_2 &= \mathbf{f}\!\left(t_k + \tfrac{h}{2},\ \mathbf{y}_k + \tfrac{h}{2}\mathbf{k}_1\right), \\
\mathbf{k}_3 &= \mathbf{f}\!\left(t_k + \tfrac{h}{2},\ \mathbf{y}_k + \tfrac{h}{2}\mathbf{k}_2\right), \\
\mathbf{k}_4 &= \mathbf{f}\!\left(t_k + h,\ \mathbf{y}_k + h\,\mathbf{k}_3\right), \\
\mathbf{y}_{k+1} &= \mathbf{y}_k + \frac{h}{6}\left(\mathbf{k}_1 + 2\mathbf{k}_2 + 2\mathbf{k}_3 + \mathbf{k}_4\right).
\end{aligned}
$$

Read it as a **[[story of four scouts|rk4-stages]]**:

1. $\mathbf{k}_1$ is the slope at the start.
2. $\mathbf{k}_2$ is the slope at the midpoint, reached by following $\mathbf{k}_1$ for half a step.
3. $\mathbf{k}_3$ is a *better* midpoint slope, reached by following $\mathbf{k}_2$ for half a step instead.
4. $\mathbf{k}_4$ is the slope at the end, reached by following $\mathbf{k}_3$ for a full step.

The final update counts the ends once and the middle twice — the $1, 2, 2, 1$ pattern of Simpson's rule — and divides by 6 so the weights add to 1. When $\mathbf{f}$ depends on $t$ alone, RK4 *is* Simpson's rule applied to $\int \mathbf{f}\,dt$.

::: note Why RK4 is fourth order
Use the linear test again, $\dot y = \lambda y$ with $z = h\lambda$. Work the stages one at a time:

$$
k_1 = \lambda y, \quad
k_2 = \lambda y\left(1 + \tfrac{z}{2}\right), \quad
k_3 = \lambda y\left(1 + \tfrac{z}{2} + \tfrac{z^2}{4}\right), \quad
k_4 = \lambda y\left(1 + z + \tfrac{z^2}{2} + \tfrac{z^3}{4}\right).
$$

Now add $k_1 + 2k_2 + 2k_3 + k_4$, one power of $z$ at a time:

- constants: $1 + 2 + 2 + 1 = 6$;
- $z$ terms: $2 \cdot \tfrac{z}{2} + 2 \cdot \tfrac{z}{2} + z = 3z$;
- $z^2$ terms: $2 \cdot \tfrac{z^2}{4} + \tfrac{z^2}{2} = z^2$;
- $z^3$ term: $\tfrac{z^3}{4}$.

Multiply by $h/6$ (and remember $h\lambda = z$):

$$
y_{k+1} = y_k\left[1 + \tfrac{z}{6}\left(6 + 3z + z^2 + \tfrac{z^3}{4}\right)\right] = y_k\left(1 + z + \frac{z^2}{2} + \frac{z^3}{6} + \frac{z^4}{24}\right).
$$

That is exactly $e^z$ through the $z^4$ term. The first term missed is $z^5/120$: local error $O(h^5)$, global $O(h^4)$, order 4.

For a general nonlinear $\mathbf{f}$ the proof is longer — the stages must also reproduce the Jacobian terms inside $\ddot{\mathbf{y}}$ and $\dddot{\mathbf{y}}$. The coefficients $\tfrac12, \tfrac12, 1$ and $\tfrac16, \tfrac13, \tfrac13, \tfrac16$ were chosen by **[[Kutta in 1901|runge-kutta]]** precisely so that all of those terms match through $h^4$.
:::

::: key
Classical RK4: $\mathbf{k}_1 = \mathbf{f}(t, \mathbf{y})$, $\mathbf{k}_2 = \mathbf{f}(t + h/2,\ \mathbf{y} + h\mathbf{k}_1/2)$, $\mathbf{k}_3 = \mathbf{f}(t + h/2,\ \mathbf{y} + h\mathbf{k}_2/2)$, $\mathbf{k}_4 = \mathbf{f}(t + h,\ \mathbf{y} + h\mathbf{k}_3)$; then $\mathbf{y}_{n+1} = \mathbf{y}_n + \dfrac{h}{6}(\mathbf{k}_1 + 2\mathbf{k}_2 + 2\mathbf{k}_3 + \mathbf{k}_4)$. Four calls per step; matches the Taylor series through $h^4$; local error $O(h^5)$, global $O(h^4)$.
:::

::: example One RK4 step by hand
Take $\dot y = -y$, $y_0 = 1$, $h = 0.1$, so $f(t, y) = -y$.

**Stage 1.** $k_1 = f(0, 1) = -1$.

**Stage 2.** Half a step along $k_1$: $y + \tfrac{h}{2}k_1 = 1 - 0.05 = 0.95$. So $k_2 = -0.95$.

**Stage 3.** Half a step along $k_2$: $y + \tfrac{h}{2}k_2 = 1 - 0.0475 = 0.9525$. So $k_3 = -0.9525$.

**Stage 4.** A full step along $k_3$: $y + h k_3 = 1 - 0.09525 = 0.90475$. So $k_4 = -0.90475$.

**Blend.** $k_1 + 2k_2 + 2k_3 + k_4 = -1 - 1.9 - 1.905 - 0.90475 = -5.70975$. Then $y_1 = 1 + \tfrac{0.1}{6}(-5.70975) = 1 - 0.0951625 = 0.9048375$.

**Check.** The exact value is $e^{-0.1} = 0.904837418$, so the local error is $8.20 \times 10^{-8}$. The estimate $h^5/5! = 8.33 \times 10^{-8}$ gives the leading term. The next term, $-h^6/720 = -1.4 \times 10^{-9}$, accounts for the difference.

Compare the three methods on this one step: Euler $4.8 \times 10^{-3}$, Heun $1.6 \times 10^{-4}$, RK4 $8.2 \times 10^{-8}$. Four calls instead of one bought five powers of ten.
:::

## Measuring the order

The order is a prediction you can test, and testing it is how you find out whether an integrator is coded correctly. Integrate $\dot y = -y$ from $t = 0$ to $t = 1$ with each method, halving the step each time, and record the global error $|y_N - e^{-1}|$:

| $h$ | Euler | ratio | Heun | ratio | RK4 | ratio |
| --- | --- | --- | --- | --- | --- | --- |
| 0.2 | $4.02 \times 10^{-2}$ | — | $2.86 \times 10^{-3}$ | — | $5.80 \times 10^{-6}$ | — |
| 0.1 | $1.92 \times 10^{-2}$ | 2.09 | $6.62 \times 10^{-4}$ | 4.32 | $3.33 \times 10^{-7}$ | 17.4 |
| 0.05 | $9.39 \times 10^{-3}$ | 2.04 | $1.59 \times 10^{-4}$ | 4.16 | $2.00 \times 10^{-8}$ | 16.7 |
| 0.025 | $4.65 \times 10^{-3}$ | 2.02 | $3.90 \times 10^{-5}$ | 4.08 | $1.22 \times 10^{-9}$ | 16.3 |
| 0.0125 | $2.31 \times 10^{-3}$ | 2.01 | $9.67 \times 10^{-6}$ | 4.04 | $7.56 \times 10^{-11}$ | 16.2 |

The ratios settle toward $2^1$, $2^2$ and $2^4$ as $h$ shrinks and the higher terms fade. On a **[[log–log plot|log-log]]** of error against $h$, the three methods are straight lines with slopes 1, 2 and 4. This is the plot the module's first exercise asks for. It is the acceptance test for any integrator you write.

If your RK4 shows a ratio near 8 instead of 16, a stage is wrong. A common slip is forming $\mathbf{k}_4$ from $\mathbf{k}_2$ instead of $\mathbf{k}_3$. That quietly demotes the method to third order (ratio 8). Forming $\mathbf{k}_3$ from $\mathbf{k}_1$ instead of $\mathbf{k}_2$ is worse: it makes $\mathbf{k}_3 = \mathbf{k}_2$ and drops to second order (ratio 4).

::: example What accuracy costs
You need the global error at $t = 1$ below $10^{-6}$ for $\dot y = -y$. For each method, scale its $h = 0.1$ error from the table using its order, to find the step that just meets the target. Then count calls.

**Euler.** Error $\propto h$, so $h = 0.1 \times (10^{-6}/1.92 \times 10^{-2}) = 5.2 \times 10^{-6}$. That is about $192{,}000$ steps at one call each.

**Heun.** Error $\propto h^2$, so $h = 0.1 \times (10^{-6}/6.62 \times 10^{-4})^{1/2} = 3.9 \times 10^{-3}$. That is about 257 steps at two calls: 514 calls.

**RK4.** Error $\propto h^4$, so $h = 0.1 \times (10^{-6}/3.33 \times 10^{-7})^{1/4} = 0.13$. Round to 8 steps ($h = 0.125$) at four calls: 32 calls.

**Check.** Running each method at those step counts gives errors of $9.6 \times 10^{-7}$, $9.3 \times 10^{-7}$ and $8.3 \times 10^{-7}$ — all just under the target, as planned.

Six thousand to one between Euler and RK4, for the same answer. The gap only grows as the target tightens: each halving of the target costs Euler twice the work, and RK4 only $2^{1/4} = 1.19$ times. The exceptions, where a low-order method wins, are problems where $\mathbf{f}$ is not smooth — a thruster switching on, a stage separating. Across such an event the Taylor series that high order relies on does not exist.
:::

## A step on a real orbit

The test problem is gentle because its solution fades away. An orbit does not. The state goes round and round, and errors have nowhere to hide.

Take a circular orbit at $500\,\mathrm{km}$ altitude: $r_0 = 6{,}878.137\,\mathrm{km}$, speed $v_0 = \sqrt{\mu/r_0} = 7.6126\,\mathrm{km/s}$, period $T = 5{,}677\,\mathrm{s}$. The equations are $\dot{\mathbf{r}} = \mathbf{v}$ and $\dot{\mathbf{v}} = -\mu\,\mathbf{r}/r^3$. Start at $\mathbf{r} = (r_0, 0)$, $\mathbf{v} = (0, v_0)$, take one step, and compare with the exact circular motion:

| $h$ | Euler | Heun | RK4 |
| --- | --- | --- | --- |
| 60 s | $15.2\,\mathrm{km}$ | $0.336\,\mathrm{km}$ | $7.5 \times 10^{-5}\,\mathrm{km}$ |
| 30 s | $3.79\,\mathrm{km}$ | $0.042\,\mathrm{km}$ | $2.3 \times 10^{-6}\,\mathrm{km}$ |
| 15 s | $0.948\,\mathrm{km}$ | $0.0052\,\mathrm{km}$ | $7.2 \times 10^{-8}\,\mathrm{km}$ |

These are *local* errors, so halving $h$ divides Euler's by 4 ($h^2$), Heun's by 8 ($h^3$) and RK4's by 32 ($h^5$).

Euler's 15 km miss after one minute is almost all outward: $r_1 - r_0 = +15.1\,\mathrm{km}$. The Euler step moves the vehicle in a straight line along its velocity — along the **[[tangent to the circle|tangent-leaves-circle]]** — and a tangent line leaves a circle. It rises by about $(v_0 h)^2/(2r_0) = (456.8)^2/(2 \times 6{,}878) = 15.2\,\mathrm{km}$. Every Euler step does this, always outward. That is the spiral you will meet two lessons from now.

Now run a full revolution with $h = 60\,\mathrm{s}$ (95 steps, the last one short so the run ends exactly at $T$). The position errors are: Euler $16{,}000\,\mathrm{km}$ — the vehicle is not in orbit any more — Heun $280\,\mathrm{km}$, RK4 $26.6\,\mathrm{m}$. At $h = 30\,\mathrm{s}$ RK4 gives $1.43\,\mathrm{m}$, a ratio of 18.6, close to the 16 of fourth order. A 30 s step is coarse for RK4 in low orbit. A typical simulator uses 1 to 10 s and gets millimeters per revolution. At that point the force model, not the integrator, limits the answer.

::: warning Order is not accuracy
Order says how the error *scales* with $h$. The constant in front depends on the problem. An RK4 step of 60 s on a low circular orbit is accurate to 7 cm. The same step on a Molniya orbit near perigee, where the acceleration changes far faster, is accurate to nothing. To choose a fixed step, halve it until the answer stops changing at the level you care about, then keep a margin. To avoid the question altogether, use the adaptive control of the next lesson.
:::

::: warning Land exactly on the final time
If $(t_N - t_0)/h$ is not a whole number, take a short final step. Do not overshoot or stop early. An integrator that reports the state at $t = 5{,}640\,\mathrm{s}$ when you asked for $5{,}677\,\mathrm{s}$ is off by $280\,\mathrm{km}$ — and none of that is integration error. Integrators can only be compared at the same final time.
:::

::: note RK4 in code
Write RK4 exactly as the formulas read, on the whole state vector at once. Never unpack the state into named variables inside the stepper. The stepper should not know it is propagating an orbit.

```python
def rk4_step(f, t, y, h):
    k1 = f(t, y)
    k2 = f(t + h / 2, y + h * k1 / 2)
    k3 = f(t + h / 2, y + h * k2 / 2)
    k4 = f(t + h, y + h * k3)
    return y + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4)

print(rk4_step(lambda t, y: -y, 0.0, 1.0, 0.1))   # 0.9048375
```
:::

## Check yourself

::: check
State the local and global truncation error of Heun's method, and explain in one sentence why they differ by one power of $h$.
:::

::: answer
Heun matches the Taylor series of the solution through $h^2$, so its local error — the error of one step from exact data — is $O(h^3)$. A run over a fixed interval takes $N = (t_N - t_0)/h$ steps, so the global error is about $N \times O(h^3) = O(h^2)$, and the method is second order. One power is lost because the number of steps grows like $1/h$.
:::

::: check
Take one Heun step on $\dot y = -y$ from $y = 1$ with $h = 0.2$. Find the local error and compare it with the leading-term estimate.
:::

::: answer
$k_1 = -1$. The predictor is $y + hk_1 = 0.8$, so $k_2 = -0.8$. The update is $y_1 = 1 + 0.1 \times (-1 - 0.8) = 0.82$. The exact value is $e^{-0.2} = 0.818731$, so the local error is $1.27 \times 10^{-3}$.

The leading term is $h^3/6 = 1.33 \times 10^{-3}$. The next, $-h^4/24 = -6.7 \times 10^{-5}$, brings the estimate to $1.27 \times 10^{-3}$. With $h = 0.1$ the lesson found $1.63 \times 10^{-4}$, a ratio of 7.8 — close to $2^3 = 8$, as a local error of $O(h^3)$ predicts.
:::

::: check
A colleague's RK4 gives errors of $3.2 \times 10^{-6}$ at $h = 0.1$ and $4.1 \times 10^{-7}$ at $h = 0.05$ on the test problem. What order is the code really achieving, and what kind of bug does that suggest?
:::

::: answer
The ratio is $3.2 \times 10^{-6}/4.1 \times 10^{-7} = 7.8 \approx 2^3$, so the code is third order, not fourth. RK4's fourth order depends on the exact stage structure. A slip that breaks one stage but still gives a sensible method typically leaves a lower order. The classic third-order instance is forming $\mathbf{k}_4$ from $\mathbf{k}_2$ instead of $\mathbf{k}_3$. (Forming $\mathbf{k}_3$ from $\mathbf{k}_1$ would give second order, a ratio of 4. A wrong time in a stage, such as $\mathbf{k}_4$ at $t + h/2$, cannot show up on $\dot y = -y$ at all, because $\mathbf{f}$ there ignores $t$ — test on a problem that depends on time too.) A second clue: the error at $h = 0.1$ is ten times the correct RK4 value of $3.3 \times 10^{-7}$.
:::

::: check
Explain why RK4 applied to $\dot y = g(t)$, with no dependence on $y$, reduces to Simpson's rule for $\int_{t_k}^{t_k + h} g\,dt$.
:::

::: answer
When $\mathbf{f}$ does not depend on $\mathbf{y}$, the trial states inside the step do not matter. So $k_1 = g(t_k)$, $k_2 = k_3 = g(t_k + h/2)$, and $k_4 = g(t_k + h)$. The update adds

$$
\frac{h}{6}\left[g(t_k) + 4g(t_k + h/2) + g(t_k + h)\right],
$$

which is Simpson's rule on the step, with points $h/2$ apart: $\tfrac{h/2}{3}[g_0 + 4g_1 + g_2]$. Simpson's rule is exact for cubics and has error $O(h^5)$ per panel, which fits RK4's local error.
:::

::: check
For the 500 km circular orbit, RK4 with $h = 60\,\mathrm{s}$ gives a position error of about $26.6\,\mathrm{m}$ per revolution. Estimate the error per revolution at $h = 10\,\mathrm{s}$, and the number of calls of $\mathbf{f}$ per revolution.
:::

::: answer
Global error scales as $h^4$. Cutting $h$ by a factor of 6 cuts the error by $6^4 = 1{,}296$: about $26.6/1{,}296 = 0.021\,\mathrm{m}$, two centimeters per revolution. Steps per revolution: $5{,}677/10 \approx 568$, at four calls each, about $2{,}270$ calls.

The measured ratio from 60 s to 30 s was 18.6 rather than 16, so expect the real figure to be a little smaller. Running it gives $1.6\,\mathrm{cm}$. Either way it is below the level at which uncertainty in atmospheric drag dominates.
:::

## Summary

| Item | Statement |
| --- | --- |
| Local truncation error | Error of one step from exact data; $O(h^{p+1})$ for a method of order $p$ |
| Global truncation error | Error after a fixed interval; $O(h^p)$, one order lower, because $N = O(1/h)$ steps |
| Euler | $\mathbf{y}_{k+1} = \mathbf{y}_k + h\,\mathbf{f}(t_k, \mathbf{y}_k)$; order 1; 1 call |
| Heun (RK2) | $\mathbf{k}_1 = \mathbf{f}(t_k, \mathbf{y}_k)$, $\mathbf{k}_2 = \mathbf{f}(t_k + h, \mathbf{y}_k + h\mathbf{k}_1)$, $\mathbf{y}_{k+1} = \mathbf{y}_k + \tfrac{h}{2}(\mathbf{k}_1 + \mathbf{k}_2)$; order 2 |
| RK4 | Stages at $0, h/2, h/2, h$; weights $\tfrac{1}{6}(1, 2, 2, 1)$; order 4; 4 calls |
| Linear test $\dot y = \lambda y$ | Euler $1 + z$, Heun $1 + z + z^2/2$, RK4 through $z^4/24$, with $z = h\lambda$ |
| Order test | Halve $h$; global error ratio $\to 2^p$: 2, 4, 16 |
| Test-problem errors at $h = 0.1$, $t = 1$ | Euler $1.9 \times 10^{-2}$, Heun $6.6 \times 10^{-4}$, RK4 $3.3 \times 10^{-7}$ |
| Cost for $10^{-6}$ on the test problem | Euler $1.9 \times 10^{5}$ calls, Heun 514, RK4 32 |

RK4 takes the same step whatever the solution is doing. The next lesson gives the integrator a way to measure its own local error every step, using an **[[embedded pair such as Dormand–Prince|dormand-prince]]**, and to choose $h$ to match.

::: context state-vector Everything you need to know, in one list
The **state** of a system is the smallest set of numbers that, together with the rules, fixes its whole future. For a satellite coasting under gravity it is six numbers: three for position and three for velocity. For a spinning spacecraft you add the attitude (four numbers for a quaternion) and three spin rates — thirteen in all. Stacking them into one list, the state vector, lets one integrator handle any system: it only ever sees "a list of numbers and its rate of change".
:::

::: context six-dof Six ways to move
A rigid body can move in six independent ways: three translations (forward, sideways, up) and three rotations (roll, pitch, yaw). Those are its six **degrees of freedom**. A 6-DOF simulator models all of them at once — where the vehicle is *and* which way it points — which is what you need to test a guidance and control system before flight.
:::

::: context big-o Reading O(h^p)
$O(h^p)$, read "order h to the p" or "big-O of h to the p", is shorthand for "no bigger than some fixed number times $h^p$, once $h$ is small enough". It deliberately ignores the constant, because what matters here is how the error *scales*. If an error is $O(h^2)$, halving $h$ makes it about four times smaller, whatever the constant was.
:::

::: context lipschitz How fast solutions can pull apart
A function $\mathbf{f}$ has a **Lipschitz constant** $L$ if changing its input by some amount never changes its output by more than $L$ times that amount. For an ODE it limits how quickly two nearby solutions can separate: at worst like $e^{Lt}$. That is why $e^{L(t_N - t_0)}$ appears in the error bound — an early error can be stretched by the dynamics before the run ends. The constant is named for the German mathematician Rudolf Lipschitz.
:::

::: context euler-picture Euler's staircase
Euler's method with a large step, $h = 0.5$, on $\dot y = -y$. The blue curve is the true solution $e^{-t}$. Each red segment follows the slope at its left end for the whole step, so it always lands too low here: the solution curves up away from the straight line. At $t = 2$ Euler gives $0.0625$ against the true $0.135$. Leonhard Euler described the method in his textbook on integral calculus in 1768.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 205" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="180" x2="340" y2="180" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="40" y1="15" x2="40" y2="180" stroke="#1f2a44" stroke-width="1.2"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="40.0,20.0 47.2,27.8 54.5,35.2 61.8,42.3 69.0,49.0 76.2,55.4 83.5,61.5 90.8,67.2 98.0,72.7 105.2,78.0 112.5,83.0 119.8,87.7 127.0,92.2 134.2,96.5 141.5,100.5 148.8,104.4 156.0,108.1 163.2,111.6 170.5,114.9 177.8,118.1 185.0,121.1 192.2,124.0 199.5,126.7 206.8,129.3 214.0,131.8 221.2,134.2 228.5,136.4 235.8,138.5 243.0,140.5 250.2,142.5 257.5,144.3 264.8,146.0 272.0,147.7 279.2,149.3 286.5,150.8 293.8,152.2 301.0,153.6 308.2,154.8 315.5,156.1 322.8,157.2 330.0,158.3"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2" points="40.0,20.0 112.5,100.0 185.0,140.0 257.5,160.0 330.0,170.0"/>
  <g fill="#b4232c"><circle cx="40" cy="20" r="3.5"/><circle cx="112.5" cy="100" r="3.5"/><circle cx="185" cy="140" r="3.5"/><circle cx="257.5" cy="160" r="3.5"/><circle cx="330" cy="170" r="3.5"/></g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle"><text x="40" y="196">0</text><text x="112.5" y="196">0.5</text><text x="185" y="196">1</text><text x="257.5" y="196">1.5</text><text x="330" y="196">2</text></g>
  <g font-size="11" fill="#1f2a44" text-anchor="end"><text x="35" y="24">1</text><text x="35" y="104">0.5</text><text x="35" y="184">0</text></g>
  <text x="150" y="80" font-size="11" fill="#1d6fd1">true e^(−t)</text>
  <text x="100" y="140" font-size="11" fill="#b4232c">Euler, h = 0.5</text>
</svg>
```
:::

::: context trapezoid Averaging the two ends
To find the area under a curve over a short stretch, the **trapezoidal rule** joins the curve's two end heights with a straight line and takes the area of the trapezoid underneath: width times the average of the two heights. Heun's method does exactly this with slopes: the change in $y$ over a step is the area under the slope curve, so it multiplies $h$ by the average of the start and end slopes. The German mathematician Karl Heun published the method in 1900.
:::

::: context rk4-stages The four scouts on one step
One RK4 step on $\dot y = -y$ with a deliberately huge step, $h = 1$. Each dot is where $\mathbf{f}$ is called, and the short line through it is the slope found there: $k_1 = -1$ at the start, $k_2 = -0.5$ and $k_3 = -0.75$ at the midpoint, $k_4 = -0.25$ at the end. The blend lands at $0.375$ (open circle) against the true $e^{-1} = 0.368$ — close, even with a step this large.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 215" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="190" x2="340" y2="190" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="50" y1="15" x2="50" y2="190" stroke="#1f2a44" stroke-width="1.2"/>
  <polyline fill="none" stroke="#8fb8f0" stroke-width="2.5" points="50.0,30.0 63.0,37.8 76.0,45.2 89.0,52.3 102.0,59.0 115.0,65.4 128.0,71.5 141.0,77.2 154.0,82.7 167.0,88.0 180.0,93.0 193.0,97.7 206.0,102.2 219.0,106.5 232.0,110.5 245.0,114.4 258.0,118.1 271.0,121.6 284.0,124.9 297.0,128.1 310.0,131.1"/>
  <g stroke="#1f2a44" stroke-width="2">
    <line x1="29.2" y1="17.2" x2="70.8" y2="42.8"/><line x1="159.2" y1="103.6" x2="200.8" y2="116.4"/>
    <line x1="159.2" y1="60.4" x2="200.8" y2="79.6"/><line x1="289.2" y1="146.8" x2="330.8" y2="153.2"/>
  </g>
  <g fill="#b4232c"><circle cx="50" cy="30" r="4"/><circle cx="180" cy="110" r="4"/><circle cx="180" cy="70" r="4"/><circle cx="310" cy="150" r="4"/></g>
  <circle cx="310" cy="130" r="5" fill="#fff" stroke="#1d6fd1" stroke-width="2"/>
  <g font-size="12" fill="#1f2a44">
    <text x="60" y="24">k₁</text><text x="186" y="126">k₂</text><text x="186" y="62">k₃</text><text x="296" y="168">k₄</text>
  </g>
  <text x="318" y="122" font-size="11" fill="#1d6fd1">y₁</text>
  <g font-size="11" fill="#1f2a44" text-anchor="middle"><text x="50" y="206">t</text><text x="180" y="206">t + h/2</text><text x="310" y="206">t + h</text></g>
</svg>
```
:::

::: context runge-kutta Two names on one method
Carl Runge published the first methods of this kind in 1895, while studying how to solve differential equations numerically. Martin Wilhelm Kutta extended the idea in 1901, worked out the conditions a four-stage method must satisfy to be fourth order, and gave the coefficients now called classical RK4. More than a century later, the same four lines run in flight computers.
:::

::: context log-log Straight lines of slope p
If error $= C h^p$, then taking logarithms gives $\log(\text{error}) = \log C + p \log h$ — a straight line whose slope is the order $p$. Here are the three columns of the table, plotted on logarithmic axes. Each step to the left halves $h$. Euler (red) drops by a factor of 2 per halving, Heun (orange) by 4, RK4 (blue) by 16.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 215" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="185" x2="340" y2="185" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="60" y1="10" x2="60" y2="185" stroke="#1f2a44" stroke-width="1.2"/>
  <g stroke="#e3e7ee" stroke-width="1"><line x1="60" y1="151" x2="340" y2="151"/><line x1="60" y1="117" x2="340" y2="117"/><line x1="60" y1="83" x2="340" y2="83"/><line x1="60" y1="49" x2="340" y2="49"/><line x1="60" y1="15" x2="340" y2="15"/></g>
  <g font-size="11" fill="#1f2a44" text-anchor="end"><text x="55" y="189">1e−11</text><text x="55" y="121">1e−7</text><text x="55" y="53">1e−3</text></g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle"><text x="78.7" y="201">0.0125</text><text x="194.8" y="201">0.05</text><text x="310.9" y="201">0.2</text><text x="200" y="213">step h</text></g>
  <polyline fill="none" stroke="#b4232c" stroke-width="2" points="310.9,21.7 252.9,27.2 194.8,32.5 136.7,37.7 78.7,42.8"/>
  <polyline fill="none" stroke="#f2b880" stroke-width="2.5" points="310.9,41.2 252.9,52.0 194.8,62.6 136.7,73.0 78.7,83.2"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="310.9,87.0 252.9,108.1 194.8,128.9 136.7,149.5 78.7,170.1"/>
  <g font-size="11"><text x="316" y="25" fill="#b4232c">Euler</text><text x="316" y="45" fill="#1f2a44">Heun</text><text x="316" y="91" fill="#1d6fd1">RK4</text></g>
</svg>
```
:::

::: context tangent-leaves-circle Why the tangent step climbs
Stand on a circle of radius $r$ and walk a distance $d$ straight along the tangent. Your path, the radius to where you started, and the line back to the center make a right triangle. By Pythagoras your new distance from the center is $\sqrt{r^2 + d^2}$, which is always more than $r$. For small $d$ that is about $r + d^2/(2r)$. With $d = v_0 h = 456.8\,\mathrm{km}$ and $r = 6{,}878\,\mathrm{km}$, the climb is $15.2\,\mathrm{km}$ — the Euler error in the table, all of it outward.
:::

::: context dormand-prince Where RK45 comes from
In 1980 John Dormand and Peter Prince published a seven-stage Runge–Kutta method that computes a fifth-order and a fourth-order answer from the same stages. The difference between the two estimates the error of the step for almost no extra cost. It is the default in SciPy's `solve_ivp` and MATLAB's `ode45`. The next lesson takes it apart and builds the step-size controller that goes with it.
:::
