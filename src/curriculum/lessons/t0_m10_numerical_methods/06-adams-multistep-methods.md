---
id: l06-adams-multistep-methods
title: Adams-Bashforth and Adams-Moulton multistep methods
minutes: 22
covers:
  - Adams-Bashforth / Adams-Moulton multistep methods
---

Imagine you are guessing where a car will be one second from now. You could send a scout ahead to look (expensive). Or you could look at where the car was over the last few seconds — which you already wrote down — draw a smooth curve through those points, and extend it. That second way costs almost nothing, because the old notes are free.

RK4 is the scout. Each step it evaluates $\mathbf{f}$ four times, and at the end of the step it throws all four away. That is fine when $\mathbf{f}$ is a two-body acceleration: a square root and a division. It is not fine when $\mathbf{f}$ is a $70 \times 70$ **[[spherical-harmonic gravity field|spherical-harmonics]]** with about 5,000 terms, plus a drag model reading an air-density table, plus sunlight pressure with a shadow test. Then a step's cost *is* its force evaluations, and a method that gets fourth-order accuracy from one evaluation instead of four gives four times the throughput.

A **multistep** method is the second way. It fits a polynomial to derivative values it already has from earlier steps and integrates that polynomial forward. Only the value at the new point costs anything. The **[[Adams|adams-history]]** family is the standard version: **Adams–Bashforth** uses only past points and is explicit; **Adams–Moulton** also uses the new point and is implicit; together they run as a predictor–corrector pair that costs two evaluations per step and gives a free error estimate. The catalog that tracks tens of thousands of objects in orbit is propagated with a close relative. This lesson builds the methods, then faces their two traps: they need starting values, and they are far less stable than RK4.

## The integral form

Write the ODE $\dot{\mathbf{y}} = \mathbf{f}(t, \mathbf{y})$ and integrate both sides over one step, from $t_n$ to $t_{n+1} = t_n + h$:

$$
\mathbf{y}(t_{n+1}) = \mathbf{y}(t_n) + \int_{t_n}^{t_{n+1}} \mathbf{f}(t, \mathbf{y}(t))\,dt .
$$

This is exact. The catch is that the integrand involves the solution you are looking for, so every method is a way of approximating that integral. Runge–Kutta methods sample it at new points inside the step. Adams methods take the values $\mathbf{f}_n, \mathbf{f}_{n-1}, \mathbf{f}_{n-2}, \ldots$ already computed at earlier points, pass a polynomial through them, and integrate *that*.

Write $\mathbf{f}_k = \mathbf{f}(t_k, \mathbf{y}_k)$, and measure time in steps with $s = (t - t_n)/h$. Then $s = 0$ at $t_n$, $s = 1$ at $t_{n+1}$, and the past points sit at $s = -1, -2, \ldots$

## Adams–Bashforth: extend the line past the data

Use only past points. With two of them — $\mathbf{f}_n$ at $s = 0$ and $\mathbf{f}_{n-1}$ at $s = -1$ — the polynomial is a straight line:

$$
\mathbf{p}(s) = \mathbf{f}_n + s\,(\mathbf{f}_n - \mathbf{f}_{n-1}) .
$$

Integrate it across the step. Since $dt = h\,ds$:

$$
\int_0^1 \mathbf{p}(s)\,h\,ds = h\left[\mathbf{f}_n + \tfrac{1}{2}(\mathbf{f}_n - \mathbf{f}_{n-1})\right]
= \frac{h}{2}\left(3\mathbf{f}_n - \mathbf{f}_{n-1}\right).
$$

That is **AB2**, the two-step Adams–Bashforth method. Over the new step the line is being **[[extrapolated|extrapolate]]** — extended beyond the data it was fitted to. That is why the method is explicit, and why its weights are bigger than one and alternate in sign.

With $k$ past points it is the same idea. Let $L_j(s)$ be the **[[Lagrange basis polynomial|lagrange]]** that equals 1 at $s = -j$ and 0 at the other past points. Then the weights are $b_j = \int_0^1 L_j(s)\,ds$ and

$$
\mathbf{y}_{n+1} = \mathbf{y}_n + h\sum_{j=0}^{k-1} b_j\,\mathbf{f}_{n-j} .
$$

Doing those integrals exactly gives the table every code uses:

| Method | Order | Formula |
| --- | --- | --- |
| AB1 | 1 | $\mathbf{y}_{n+1} = \mathbf{y}_n + h\,\mathbf{f}_n$ (Euler) |
| AB2 | 2 | $\mathbf{y}_{n+1} = \mathbf{y}_n + \frac{h}{2}(3\mathbf{f}_n - \mathbf{f}_{n-1})$ |
| AB3 | 3 | $\mathbf{y}_{n+1} = \mathbf{y}_n + \frac{h}{12}(23\mathbf{f}_n - 16\mathbf{f}_{n-1} + 5\mathbf{f}_{n-2})$ |
| AB4 | 4 | $\mathbf{y}_{n+1} = \mathbf{y}_n + \frac{h}{24}(55\mathbf{f}_n - 59\mathbf{f}_{n-1} + 37\mathbf{f}_{n-2} - 9\mathbf{f}_{n-3})$ |

A $k$-step Adams–Bashforth method has order $k$: it uses $k$ values of $\mathbf{f}$ and integrates any polynomial of degree $k - 1$ exactly. Two checks work on any such table. The weights must add to 1 — $(55 - 59 + 37 - 9)/24 = 1$ — because a constant derivative must be integrated exactly. That is the **[[consistency|consistency]]** condition. And alternating signs with sizes above 1 are the mark of extrapolation: AB4's first weight is $55/24 = 2.29$, reaching well past its data.

The local truncation error comes from applying the formula to $y(t) = t^{k+1}$, where it is not exact, and dividing by $(k+1)!$:

$$
\text{LTE}_{\text{AB4}} = \frac{251}{720}\,h^5 y^{(5)}(\xi) \approx 0.349\,h^5 y^{(5)} .
$$

($y^{(5)}$ is the fifth derivative, and $\xi$, "xi", is some time inside the step.) Local error $O(h^5)$, so global error $O(h^4)$ — as in the RK4 lesson, $O(1/h)$ steps each add $O(h^5)$.

::: key Adams–Bashforth
Adams–Bashforth is explicit and uses only past derivative values: $\mathbf{y}_{n+1} = \mathbf{y}_n + h\sum_{j=0}^{k-1} b_j \mathbf{f}_{n-j}$, found by integrating the polynomial through $\mathbf{f}_n, \ldots, \mathbf{f}_{n-k+1}$ across $[t_n, t_{n+1}]$. A $k$-step method has order $k$. AB4: $\mathbf{y}_{n+1} = \mathbf{y}_n + \frac{h}{24}(55\mathbf{f}_n - 59\mathbf{f}_{n-1} + 37\mathbf{f}_{n-2} - 9\mathbf{f}_{n-3})$, local error $\frac{251}{720}h^5 y^{(5)}$, one new evaluation of $\mathbf{f}$ per step.
:::

## Adams–Moulton: include the point you are stepping to

Now add the new point, $s = 1$, to the polynomial. The step becomes **interpolation** — filling in between data — rather than extrapolation. But the method becomes **implicit**: $\mathbf{f}_{n+1}$ depends on the answer $\mathbf{y}_{n+1}$, which appears on both sides:

$$
\mathbf{y}_{n+1} = \mathbf{y}_n + h\left[\beta_{-1}\mathbf{f}_{n+1} + \sum_{j=0}^{k-1}\beta_j\,\mathbf{f}_{n-j}\right].
$$

The same exact integrals give:

| Method | Order | Formula |
| --- | --- | --- |
| AM1 | 1 | $\mathbf{y}_{n+1} = \mathbf{y}_n + h\,\mathbf{f}_{n+1}$ (backward Euler) |
| AM2 | 2 | $\mathbf{y}_{n+1} = \mathbf{y}_n + \frac{h}{2}(\mathbf{f}_{n+1} + \mathbf{f}_n)$ (trapezoidal) |
| AM3 | 3 | $\mathbf{y}_{n+1} = \mathbf{y}_n + \frac{h}{12}(5\mathbf{f}_{n+1} + 8\mathbf{f}_n - \mathbf{f}_{n-1})$ |
| AM4 | 4 | $\mathbf{y}_{n+1} = \mathbf{y}_n + \frac{h}{24}(9\mathbf{f}_{n+1} + 19\mathbf{f}_n - 5\mathbf{f}_{n-1} + \mathbf{f}_{n-2})$ |

The implicit methods win three ways at once. The extra point buys a degree, so $k$ past values give order $k + 1$. Their weights are small and mostly positive, so they do not magnify errors in the data. And their error constants are far smaller:

$$
\text{LTE}_{\text{AM4}} = -\frac{19}{720}\,h^5 y^{(5)}(\xi) \approx -0.0264\,h^5 y^{(5)} .
$$

Same order as AB4, but $251/19 = 13.2$ times smaller, and of the *opposite sign*. That opposite sign is about to become a free error estimate.

The price is solving for $\mathbf{y}_{n+1}$. For a stiff problem that means a real Newton solve, which the next lesson takes up. For a non-stiff problem there is a cheaper route.

## Predictor–corrector: PECE and Milne's device

Guess with the explicit method, then use the guess to fill in the implicit method's right-hand side. The standard cycle is **PECE** — predict, evaluate, correct, evaluate:

$$
\begin{aligned}
\text{P:}\quad &\mathbf{y}^{P}_{n+1} = \mathbf{y}_n + \tfrac{h}{24}\left(55\mathbf{f}_n - 59\mathbf{f}_{n-1} + 37\mathbf{f}_{n-2} - 9\mathbf{f}_{n-3}\right), \\
\text{E:}\quad &\mathbf{f}^{P}_{n+1} = \mathbf{f}(t_{n+1}, \mathbf{y}^{P}_{n+1}), \\
\text{C:}\quad &\mathbf{y}_{n+1} = \mathbf{y}_n + \tfrac{h}{24}\left(9\mathbf{f}^{P}_{n+1} + 19\mathbf{f}_n - 5\mathbf{f}_{n-1} + \mathbf{f}_{n-2}\right), \\
\text{E:}\quad &\mathbf{f}_{n+1} = \mathbf{f}(t_{n+1}, \mathbf{y}_{n+1}) .
\end{aligned}
$$

Two evaluations per step — half of RK4's four. Because the guess is already fourth-order accurate, the result inherits AM4's small error constant to leading order.

Now use the two error constants together. Write $C_P = 251/720$ and $C_C = -19/720$. The exact solution satisfies

$$
\mathbf{y}(t_{n+1}) - \mathbf{y}^{P}_{n+1} \approx C_P\,h^5\mathbf{y}^{(5)}, \qquad
\mathbf{y}(t_{n+1}) - \mathbf{y}_{n+1} \approx C_C\,h^5\mathbf{y}^{(5)} .
$$

Subtract the second from the first. The unknown exact solution cancels, leaving something you can measure; then eliminate $h^5\mathbf{y}^{(5)}$:

$$
\mathbf{y}_{n+1} - \mathbf{y}^{P}_{n+1} \approx (C_P - C_C)h^5\mathbf{y}^{(5)} = \tfrac{270}{720}h^5\mathbf{y}^{(5)}
\;\Longrightarrow\;
\mathbf{y}(t_{n+1}) - \mathbf{y}_{n+1} \approx -\frac{19}{270}\left(\mathbf{y}_{n+1} - \mathbf{y}^{P}_{n+1}\right).
$$

This is **[[Milne's device|milne]]**: the gap between predictor and corrector, times $-19/270 \approx -0.0704$, estimates the corrector's local error. It is the multistep cousin of the embedded pair and feeds the same controller, $h_{\text{new}} = h \cdot \text{safety} \cdot (\text{tol}/\text{err})^{1/(p+1)}$ with $p = 4$ — with a catch about changing $h$ that comes at the end of the lesson.

::: example Milne's device on one orbit step
The circular 500 km orbit: $\mu = 398{,}600.4418\,\mathrm{km^3/s^2}$, $r_0 = 6{,}878.137\,\mathrm{km}$, $v_0 = 7.6126\,\mathrm{km/s}$, $T = 5{,}677\,\mathrm{s}$. Take exact derivatives at $t = -180, -120, -60, 0\,\mathrm{s}$ from the known circular motion and take one PECE step of $h = 60\,\mathrm{s}$.

| quantity | $x$ (km) | $y$ (km) |
| --- | --- | --- |
| exact at $t = 60\,\mathrm{s}$ | 6,862.976656839 | 456.420856719 |
| AB4 predictor | 6,862.976440467 | 456.417769782 |
| AM4 corrector | 6,862.976738216 | 456.421085586 |

**True errors.** The predictor is $3.09\,\mathrm{m}$ off and the corrector $0.243\,\mathrm{m}$. Their ratio is $12.7$, close to the $13.2$ the constants predict.

**Milne's estimate.** The predictor–corrector gap is $\lVert\mathbf{y}_{n+1} - \mathbf{y}^{P}_{n+1}\rVert = 3.33\,\mathrm{m}$, so the estimated corrector error is $0.0704 \times 3.33 = 0.234\,\mathrm{m}$.

**Sanity check.** $0.234$ against the true $0.243\,\mathrm{m}$ is within 4%, and it cost one subtraction of two vectors you already had.
:::

## Starting the method

A four-step method needs $\mathbf{y}_n, \mathbf{y}_{n-1}, \mathbf{y}_{n-2}, \mathbf{y}_{n-3}$ before its first step. An initial value problem gives you one. The gap is filled by a **self-starting** method — one that needs only the current state — of the same order: run three RK4 steps, keep the four derivative values, then hand over. About a dozen extra evaluations, paid once.

The starter's order matters, and here is the trap. The starting error is made once, not every step, so it does not get the benefit of $1/h$ steps. Three Euler steps make an $O(h^2)$ error, nothing afterwards removes it, and the whole run drops to second order.

::: example A fourth-order method crippled by a first-order start
AB4 on the circular 500 km orbit, one lap, position error against the exact solution:

| $h$ | started with RK4 | started with three Euler steps |
| --- | --- | --- |
| $60\,\mathrm{s}$ | $0.282\,\mathrm{km}$ | $1{,}764\,\mathrm{km}$ |
| $30\,\mathrm{s}$ | $0.00384\,\mathrm{km}$ | $432\,\mathrm{km}$ |
| $15\,\mathrm{s}$ | $0.00060\,\mathrm{km}$ | $107\,\mathrm{km}$ |

**Read the Euler column.** Halving $h$ divides the error by $1{,}764/432 = 4.1$, then $432/107 = 4.0$: second order, as predicted.

**Compare the columns.** The Euler start is $6{,}000$ to $180{,}000$ times worse, and the RK4-started column falls much faster. The AB4 weights are the same in both. The whole difference is the three steps before the method took over. When a multistep propagator shows an order you did not expect, check the starter before the coefficients.
:::

Here is the whole scheme in code. The list `hist` holds the last four derivative values, newest first, and shifts by one slot each step:

```python
AB4 = (55/24, -59/24, 37/24, -9/24)
AM4 = (9/24, 19/24, -5/24, 1/24)


def abm4_step(f, t, y, h, hist):
    """One PECE step. hist holds f_n, f_{n-1}, f_{n-2}, f_{n-3}, newest first."""
    yp = y + h * sum(b * fk for b, fk in zip(AB4, hist))       # predict
    fp = f(t + h, yp)                                          # evaluate
    yc = y + h * (AM4[0] * fp + sum(b * fk for b, fk in zip(AM4[1:], hist)))
    err = -19 / 270 * (yc - yp)                                # Milne estimate
    return yc, f(t + h, yc), err                               # evaluate


def propagate(f, t0, y0, h, n_steps, start):
    """start: the three states after t0, from an RK4 starter."""
    ts = [t0 + i * h for i in range(4)]
    ys = [y0] + list(start)
    hist = [f(ts[3 - j], ys[3 - j]) for j in range(4)]
    t, y = ts[3], ys[3]
    for _ in range(n_steps - 3):
        y, fn, err = abm4_step(f, t, y, h, hist)
        t += h
        hist = [fn] + hist[:3]
    return t, y


import math
t, y = propagate(lambda t, y: -y, 0.0, 1.0, 0.1, 10,
                 [math.exp(-0.1 * i) for i in (1, 2, 3)])
print(y, math.exp(-1))   # 0.36787826631967274 0.36787944117144233
```

On $\dot y = -y$ from $y_0 = 1$ with $h = 0.1$ and exact starting values, the error at $t = 1$ is $-1.17 \times 10^{-6}$, from 18 evaluations of $\mathbf{f}$: four to fill the history, then two per step for seven steps.

## Stability: the price of the free evaluations

Apply a $k$-step method to the test equation $\dot y = \lambda y$ and put $z = h\lambda$. Every term becomes a multiple of an earlier $y$, so the numbers obey a fixed recipe from one step to the next. Its solutions are combinations of $\zeta^n$ ("zeta to the n"), where $\zeta$ solves the **characteristic polynomial**. For AB4:

$$
\zeta^4 - \zeta^3 - \frac{z}{24}\left(55\zeta^3 - 59\zeta^2 + 37\zeta - 9\right) = 0 .
$$

The method is stable at that $z$ when every root has $|\zeta| \le 1$. If any root is bigger, its part of the numerical solution grows geometrically. A one-step method has one root — its amplification factor $R(z)$ from the last lesson. A four-step method has four: one **principal root** that approximates $e^{z}$ and does the physics, and three **[[parasitic roots|parasitic]]** that are side effects of the recipe and must stay small.

Checking the roots along the negative real axis (decay) and the imaginary axis (oscillation) gives the numbers that set your step:

| Method | Real interval | Imaginary limit $\lvert z\rvert$ | Evaluations per step |
| --- | --- | --- | --- |
| AB2 | $(-1, 0)$ | 0 | 1 |
| AB3 | $(-6/11, 0) = (-0.545, 0)$ | 0.724 | 1 |
| AB4 | $(-0.3, 0)$ | 0.430 | 1 |
| AM3 | $(-6, 0)$ | — | implicit |
| AM4 | $(-3, 0)$ | — | implicit |
| PECE AB4–AM4 | $(-1.28, 0)$ | 0 | 2 |
| RK4 | $(-2.785, 0)$ | $2\sqrt{2} = 2.828$ | 4 |

Read the last two columns together. RK4 tolerates $|z|$ up to 2.83 on the imaginary axis; AB4 only 0.43, 6.6 times less — see the **[[stability regions|regions]]** drawn to scale. RK4 costs four times as much per step. So when *stability* sets the step, the multistep advantage vanishes and reverses. When *accuracy* sets it — the usual case for an orbit, where you want far more than 15 points per lap — the multistep method wins.

For an orbit the eigenvalues are $\lambda = \pm i n$, with $n$ the mean motion, as in the last lesson. On the 500 km orbit $n = 1.1068 \times 10^{-3}\,\mathrm{rad/s}$, so AB4 needs $hn < 0.430$: $h < 389\,\mathrm{s}$, at least 14.6 steps per lap. RK4's limit is $h < 2{,}556\,\mathrm{s}$, about 2.2 steps per lap — a limit you never approach, because the accuracy there is worthless.

::: example Crossing the AB4 stability limit
The spring $\ddot x = -x$ ($\omega = 1$, so $z = ih\omega$), started at $x = 1$, $\dot x = 0$ with an RK4 start. The table shows the size $\sqrt{x^2 + \dot x^2}$ after 20 periods; the true value is 1.

| $h\omega$ | AB4 | PECE AB4–AM4 | RK4 |
| --- | --- | --- | --- |
| 0.20 | 0.979 | 1.006 | 1.000 |
| 0.40 | 0.549 | 1.165 | 0.991 |
| 0.44 | 0.304 | 1.257 | 0.986 |
| 0.45 | 5.70 | 1.284 | 0.984 |
| 0.50 | $1.31 \times 10^{8}$ | 1.461 | 0.974 |
| 2.80 | diverged | diverged | 0.039 |
| 2.90 | diverged | diverged | $1.98 \times 10^{3}$ |

AB4 shrinks the swing below its limit and explodes above it; RK4 does the same at $h\omega = 2\sqrt{2}$.

**Watch the onset.** At $h\omega = 0.50$ the largest root has size $1.1031$. A period is $2\pi/0.5 = 12.57$ steps, so the bad part grows by $1.1031^{12.57} = 3.43$ per period. But it starts at the size of the start-up and round-off errors, so at first you cannot see it. The swing reads $0.927$ after one period, $0.866$ after two, $1.60$ after five, $621$ after ten and $1.31 \times 10^{8}$ after twenty.

**Lesson.** A multistep instability does not show on the first step. It appears as a fast, growing wiggle at the step frequency after the run has looked healthy for a while.
:::

::: warning PECE creeps upward
The PECE pair's stability region touches the imaginary axis only at the origin: for pure oscillation, every $h$ gives a root slightly bigger than 1. The growth is very weak — $1.006$ after 20 periods at $h\omega = 0.2$ — but one-way, so on a long orbit run the energy drifts *upward*, where plain AB4's drifts downward. Neither is a bug. No Adams method is symplectic, and all of them drift secularly.
:::

## What it buys on a real orbit

Compare at equal cost. RK4 at $h = 60\,\mathrm{s}$, PECE at $30\,\mathrm{s}$ and AB4 at $15\,\mathrm{s}$ all spend one force evaluation per 15 s of flight. On the circular 500 km orbit, over 100 laps (about 37,850 evaluations each):

| Method | $h$ | position error, 1 lap | position error, 100 laps | $\delta\varepsilon$, 100 laps |
| --- | --- | --- | --- | --- |
| RK4 | $60\,\mathrm{s}$ | $26.6\,\mathrm{m}$ | $75.1\,\mathrm{km}$ | $-2.26 \times 10^{-5}$ |
| PECE AB4–AM4 | $30\,\mathrm{s}$ | $3.82\,\mathrm{m}$ | $52.8\,\mathrm{km}$ | $+1.63 \times 10^{-5}$ |
| AB4 | $15\,\mathrm{s}$ | $0.60\,\mathrm{m}$ | $5.45\,\mathrm{km}$ | $-1.72 \times 10^{-6}$ |

At the same cost AB4 is 44 times more accurate than RK4 over one lap and 14 times over a hundred. The arithmetic: both are fourth order and AB4's step is a quarter of RK4's, which alone would make it $4^4 = 256$ times better; AB4's larger error constant gives back a factor of about 6. PECE sits between, buying a smaller error constant and an error estimate at twice AB4's cost.

The energy column echoes the last lesson. All three drifts are secular — each is close to 100 times its one-lap value. AB4 and RK4 lose energy, PECE gains it, each as its imaginary-axis root size predicts.

::: warning Never change the step and keep the history
The Adams weights were derived for equally spaced past points. Change $h$ and the stored history no longer fits. Production **[[variable-step Adams codes|variable-step]]** handle this by storing differences and recomputing the weights every step — real machinery. A homemade multistep propagator that changes $h$ and reuses the old $\mathbf{f}$ values is quietly solving a different problem. Want an adaptive step? Use an embedded Runge–Kutta pair. Want one evaluation per step? Commit to a fixed step.
:::

## Where this lives in GNC

Fixed step, cheap steps, an expensive force model, a long arc: that is orbit determination and catalog maintenance, so multistep methods own that domain. **[[Gauss–Jackson|gauss-jackson]]** is the standard tool — an eighth-order, fixed-step Adams-type method built for second-order equations $\ddot{\mathbf{r}} = \mathbf{a}(t, \mathbf{r})$, integrating acceleration straight to position without first splitting into first-order form. The United States space-object catalog's special-perturbations propagator has used it for decades.

On a flight computer the argument points the same way. A fixed-step multistep method has a small, fixed, data-independent cost per frame — what the adaptive-stepping lesson said a real-time scheduler demands — and one force evaluation per frame instead of four matters when the on-board gravity model is a $20 \times 20$ or $40 \times 40$ field. Against that, it needs memory for the history and has a thinner stability margin. Worst, it must **[[restart|restart]]** after any jump in the dynamics — an engine firing, staging, a mode switch — because the stored derivatives describe dynamics that no longer apply. That is why RK4 stays the default in ascent and landing software, while multistep methods rule the long, quiet, unpowered arcs.

## Check yourself

::: check
Derive AB3 from the integral form: integrate the quadratic through $\mathbf{f}_n$, $\mathbf{f}_{n-1}$, $\mathbf{f}_{n-2}$ over one step, and check that the weights add up correctly.
:::

::: answer
With $s = (t - t_n)/h$ the points are $s = 0, -1, -2$. The Lagrange basis is

$$
L_0 = \frac{(s+1)(s+2)}{(0+1)(0+2)} = \frac{s^2 + 3s + 2}{2}, \quad L_1 = \frac{s(s+2)}{(-1)(1)} = -(s^2 + 2s), \quad L_2 = \frac{s(s+1)}{(-2)(-1)} = \frac{s^2+s}{2} .
$$

Integrate each from 0 to 1, using $\int_0^1 s^2\,ds = 1/3$ and $\int_0^1 s\,ds = 1/2$:

$$
b_0 = \tfrac{1}{2}\left(\tfrac13 + \tfrac32 + 2\right) = \tfrac{23}{12}, \quad b_1 = -\left(\tfrac13 + 1\right) = -\tfrac{16}{12}, \quad b_2 = \tfrac{1}{2}\left(\tfrac13 + \tfrac12\right) = \tfrac{5}{12} .
$$

So $\mathbf{y}_{n+1} = \mathbf{y}_n + \frac{h}{12}(23\mathbf{f}_n - 16\mathbf{f}_{n-1} + 5\mathbf{f}_{n-2})$. Check: $(23 - 16 + 5)/12 = 12/12 = 1$, the consistency condition, so a constant derivative is integrated exactly.
:::

::: check
A PECE step of an AB4–AM4 propagator at $h = 60\,\mathrm{s}$ gives a predictor–corrector gap of $\lVert\mathbf{y}_{n+1} - \mathbf{y}^{P}_{n+1}\rVert = 4.0 \times 10^{-4}\,\mathrm{km}$. Estimate the local error, and find the step that would bring it to $10^{-6}\,\mathrm{km}$.
:::

::: answer
Milne's device: $\frac{19}{270} \times 4.0 \times 10^{-4} = 2.81 \times 10^{-5}\,\mathrm{km}$, about 28 mm.

The local error is $O(h^5)$, so the step ratio is $(10^{-6}/2.81 \times 10^{-5})^{1/5} = (0.0355)^{0.2} = 0.513$, giving $h_{\text{new}} = 60 \times 0.513 = 30.8\,\mathrm{s}$. With the usual safety factor of 0.9 a controller would propose about $27.7\,\mathrm{s}$ — and, being multistep, would then have to rebuild its history at the new spacing rather than reuse the old values.
:::

::: check
A propagator switches from RK4 at $h = 60\,\mathrm{s}$ to AB4 at $h = 60\,\mathrm{s}$ for a geostationary satellite, mean motion $n = 7.2921 \times 10^{-5}\,\mathrm{rad/s}$. Is that inside AB4's stability limit? What about the same swap on a 400 km orbit, $n = 1.1313 \times 10^{-3}\,\mathrm{rad/s}$, at $h = 400\,\mathrm{s}$?
:::

::: answer
AB4 needs $hn < 0.430$.

Geostationary: $hn = 60 \times 7.2921 \times 10^{-5} = 4.38 \times 10^{-3}$, far inside. No stability worry, and accuracy will be excellent: a day of $86{,}164\,\mathrm{s}$ is $1{,}436$ steps.

400 km: $hn = 400 \times 1.1313 \times 10^{-3} = 0.4525$, *outside* the limit. AB4 will run, look fine for several laps while the parasitic root grows from round-off, then diverge. RK4 at that step is comfortably stable ($0.4525 \ll 2.828$) — which is exactly how such a swap gets made and why it fails later, not at once.
:::

::: check
AM4 and AB4 both use four derivative values and both are fourth order. Why is AM4's error constant so much smaller?
:::

::: answer
AB4 *extrapolates*: its polynomial is fitted at $s = 0, -1, -2, -3$ and then integrated over $[0, 1]$, outside its data, where a polynomial's error grows fastest. AM4 *interpolates*: its points are $s = 1, 0, -1, -2$ and the interval $[0, 1]$ lies inside them. The constants $251/720$ and $19/720$ put numbers on that difference. The same reasoning explains why AM4 reaches order 4 from three past values plus the new one: the new point adds a degree.
:::

::: check
A colleague proposes AB4 for a launch vehicle upper stage's on-board propagator, because it is four times cheaper per step than RK4. Give the two conditions under which he is right, and the event in the mission that breaks the method.
:::

::: answer
He is right when (1) *accuracy*, not stability, sets the step — $hn$ well below 0.430, which it will be for a parking orbit at a sensible loop rate — and (2) the force evaluation dominates a step's cost, as it does with a spherical-harmonic gravity model. Both usually hold on a coast arc.

What breaks it is any jump in the dynamics: engine ignition or cutoff, staging, a change in mass. The stored $\mathbf{f}_{n-1}, \mathbf{f}_{n-2}, \mathbf{f}_{n-3}$ then describe dynamics that no longer apply, the polynomial is fitted across a jump, and the step is badly wrong. The fix is to restart with three RK4 steps after every jump — so the flight code carries RK4 anyway, and the real question is whether the coast arcs are long enough to repay the extra complexity.
:::

## Summary

| Item | Statement |
| --- | --- |
| Integral form | $\mathbf{y}(t_{n+1}) = \mathbf{y}(t_n) + \int_{t_n}^{t_{n+1}}\mathbf{f}\,dt$; Adams methods integrate the polynomial through known $\mathbf{f}$ values |
| AB2 | $\mathbf{y}_{n+1} = \mathbf{y}_n + \frac{h}{2}(3\mathbf{f}_n - \mathbf{f}_{n-1})$, order 2 |
| AB4 | $\mathbf{y}_{n+1} = \mathbf{y}_n + \frac{h}{24}(55\mathbf{f}_n - 59\mathbf{f}_{n-1} + 37\mathbf{f}_{n-2} - 9\mathbf{f}_{n-3})$, order 4, LTE $\frac{251}{720}h^5y^{(5)}$, 1 evaluation per step |
| AM4 | $\mathbf{y}_{n+1} = \mathbf{y}_n + \frac{h}{24}(9\mathbf{f}_{n+1} + 19\mathbf{f}_n - 5\mathbf{f}_{n-1} + \mathbf{f}_{n-2})$, order 4, LTE $-\frac{19}{720}h^5y^{(5)}$, implicit |
| Consistency | The weights of any Adams formula add to 1 |
| Milne's device | Corrector's local error $\approx -\frac{19}{270}(\mathbf{y}_{n+1} - \mathbf{y}^{P}_{n+1})$; feeds the usual $\text{tol}^{1/(p+1)}$ controller |
| Starting | Needs $k$ past values; start with RK4. A first-order start drops the whole run to second order |
| Stability | AB4 real $(-0.3, 0)$, imaginary $\lvert z\rvert < 0.430$; PECE real $(-1.28,0)$; RK4 real $(-2.785,0)$, imaginary $2\sqrt{2}$ |
| Orbit step limit | AB4 needs $hn < 0.430$: at least 14.6 steps per lap |
| Failure mode | A parasitic root leaves the unit circle; growth starts from round-off, so divergence shows only after many steps |
| Equal cost, 500 km orbit | One evaluation per 15 s: AB4 $0.60\,\mathrm{m}$, PECE $3.82\,\mathrm{m}$, RK4 $26.6\,\mathrm{m}$ after one lap |
| Fixed step | Adams weights assume equal spacing; never change $h$ and reuse the history |
| In GNC | Gauss–Jackson (8th order, fixed step) for catalog and orbit determination; restart after any jump in the dynamics |

Every implicit method here was dodged by predicting instead of solving, which works only because these problems were not stiff. The next lesson asks what stiffness is, shows why an explicit method's step on a stiff problem is set by stability rather than accuracy, and solves the implicit equations properly with backward Euler and the BDF family.

::: context spherical-harmonics A lumpy Earth, written as a sum
Earth is not a perfect ball: it bulges at the equator and has mountains, trenches and dense rock. Its gravity is written as a long sum of wave-like patterns over the sphere, called spherical harmonics. A "$70 \times 70$" field keeps every pattern up to degree and order 70, which is $(70 + 1)^2 = 5{,}041$ terms, each needing sines, cosines and recurrences to evaluate. That is why one force evaluation can cost thousands of times more than the simple $-\mu\mathbf{r}/r^3$.
:::

::: context adams-history An astronomer's side project
John Couch Adams, the English astronomer who in the 1840s predicted where the planet Neptune must be, worked out these formulas while helping Francis Bashforth with a study of the shape of liquid drops; they were published in Bashforth's book of 1883. The implicit versions were popularized by the American astronomer Forest Ray Moulton in the 1920s, for computing artillery shell trajectories. Both uses were long, smooth calculations done by hand, where every saved evaluation meant hours of saved arithmetic.
:::

::: context extrapolate The AB2 step as a picture
Two past slope values, $\mathbf{f}_{n-1}$ and $\mathbf{f}_n$, fix a straight line. AB2 extends that line across the new step and takes the area under it. With $\mathbf{f}_{n-1} = 1.0$ and $\mathbf{f}_n = 1.5$, the line reaches $2.0$ at the end of the step, and the shaded area is $\tfrac12(3 \times 1.5 - 1.0) = 1.75$ (times $h$).

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 215" font-family="Inter, Arial, sans-serif">
  <polygon points="190,190 190,85 310,50 310,190" fill="#8fb8f0"/>
  <line x1="40" y1="190" x2="340" y2="190" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="70" y1="120" x2="190" y2="85" stroke="#1f2a44" stroke-width="2"/>
  <line x1="190" y1="85" x2="310" y2="50" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="6 4"/>
  <circle cx="70" cy="120" r="5" fill="#1f2a44"/>
  <circle cx="190" cy="85" r="5" fill="#1f2a44"/>
  <circle cx="310" cy="50" r="5" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <text x="70" y="108" font-size="11" text-anchor="middle" fill="#1f2a44">f(n−1) = 1.0</text>
  <text x="190" y="72" font-size="11" text-anchor="middle" fill="#1f2a44">f(n) = 1.5</text>
  <text x="310" y="37" font-size="11" text-anchor="middle" fill="#1d6fd1">2.0 (guessed)</text>
  <text x="250" y="150" font-size="12" text-anchor="middle" fill="#1f2a44">area 1.75 h</text>
  <text x="70" y="206" font-size="11" text-anchor="middle" fill="#1f2a44">s = −1</text>
  <text x="190" y="206" font-size="11" text-anchor="middle" fill="#1f2a44">s = 0</text>
  <text x="310" y="206" font-size="11" text-anchor="middle" fill="#1f2a44">s = 1</text>
</svg>
```

The dashed part is the guess: the line is used where it has no data. Adams–Moulton instead fits through the end point too, so it only fills in between known values.
:::

::: context lagrange Building a curve from on–off pieces
A Lagrange basis polynomial is a curve designed to be 1 at one chosen point and 0 at all the others. To pass a polynomial through several data values, multiply each value by its own basis curve and add: at each data point only one curve is "on", so the sum hits every value exactly. Integrating each basis curve once, ahead of time, gives the fixed weights in the Adams tables — so the method never has to build a polynomial while it runs.
:::

::: context consistency Why the weights must add to 1
Suppose the derivative is the same value $c$ at every point, so the true answer over one step is $\mathbf{y}_n + hc$. An Adams step gives $\mathbf{y}_n + h\,c\,(b_0 + b_1 + \cdots)$. These agree only if the weights add to 1. A method that fails this test is wrong even for the simplest possible motion, and no small step can rescue it — its error does not shrink as $h$ shrinks.
:::

::: context milne Two guesses that miss in opposite directions
The predictor misses by about $+251$ units and the corrector by about $-19$, in the same unknown currency. You cannot see either miss, but you can see the gap between them: $270$ units. So one unit is the gap divided by 270, and the corrector's miss is $-19$ of those. The trick is named for W. E. Milne, an American numerical analyst whose mid-20th-century books made predictor–corrector methods standard practice.
:::

::: context parasitic Roots that come with the recipe
The true equation $\dot y = \lambda y$ has one solution. A four-step recipe links four stored values, so its numbers can follow four different patterns. One tracks the real motion; the other three are ghosts of the recipe. Normally the ghosts shrink each step and vanish. Past the stability limit one of them grows, and a tiny seed — a start-up error, a round-off in the 16th digit — becomes the whole answer.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 215" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="190" x2="345" y2="190" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="190" x2="50" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="173" x2="345" y2="173" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2" points="50.0,173.0 64.5,173.6 79.0,174.1 93.5,175.0 108.0,173.0 122.5,169.5 137.0,161.5 151.5,152.8 166.0,143.6 180.5,134.9 195.0,125.5 209.5,116.8 224.0,107.4 238.5,98.7 253.0,89.3 267.5,80.6 282.0,71.2 296.5,61.8 311.0,53.1 325.5,43.7 340.0,35.0"/>
  <text x="44" y="177" font-size="11" text-anchor="end" fill="#1f2a44">1</text>
  <text x="44" y="126" font-size="11" text-anchor="end" fill="#1f2a44">10³</text>
  <text x="44" y="75" font-size="11" text-anchor="end" fill="#1f2a44">10⁶</text>
  <text x="44" y="24" font-size="11" text-anchor="end" fill="#1f2a44">10⁹</text>
  <text x="340" y="168" font-size="11" text-anchor="end" fill="#6c7a93">true size 1</text>
  <text x="58" y="158" font-size="11" fill="#1f2a44">looks healthy</text>
  <text x="195" y="206" font-size="11" text-anchor="middle" fill="#1f2a44">periods (0 to 20)</text>
  <text x="56" y="20" font-size="11" fill="#1f2a44">swing size (log scale)</text>
</svg>
```

This is AB4 on the spring at $h\omega = 0.5$: the swing even shrinks for three periods, then the parasitic root takes over and multiplies it by about 3.4 every period.
:::

::: context regions Stability regions to scale
Each shape is the set of $z = h\lambda$ for which the method does not blow up, drawn to the same scale (the axes cross at $z = 0$). RK4's region is large; AB4's is a small sliver near the origin.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <line x1="130" y1="110" x2="350" y2="110" stroke="#6c7a93" stroke-width="1"/>
  <line x1="250" y1="5" x2="250" y2="215" stroke="#6c7a93" stroke-width="1"/>
  <polygon fill="#8fb8f0" fill-opacity="0.6" stroke="#1d6fd1" stroke-width="1.5" points="250.0,110.0 250.0,107.6 250.0,105.2 250.0,102.8 250.0,100.3 250.0,97.6 250.0,94.9 250.0,91.9 250.0,88.7 250.0,85.3 250.1,81.4 250.2,77.0 250.4,71.8 251.0,65.2 252.9,55.3 257.5,38.2 257.3,25.3 253.5,17.2 247.7,12.4 240.9,10.2 233.5,10.8 226.1,14.2 219.1,19.9 213.1,26.1 207.7,31.0 202.7,34.7 197.9,37.6 193.3,40.2 188.8,42.7 184.5,45.3 180.3,48.1 176.3,51.1 172.6,54.4 169.2,58.1 166.2,61.9 163.6,66.1 161.4,70.4 159.7,74.8 158.3,79.3 157.2,83.8 156.5,88.3 156.0,92.8 155.6,97.2 155.4,101.5 155.3,105.8 155.3,110.0 155.3,114.2 155.4,118.5 155.6,122.8 156.0,127.2 156.5,131.7 157.2,136.2 158.3,140.7 159.7,145.2 161.4,149.6 163.6,153.9 166.2,158.1 169.2,161.9 172.6,165.6 176.3,168.9 180.3,171.9 184.5,174.7 188.8,177.3 193.3,179.8 197.9,182.4 202.7,185.3 207.7,189.0 213.1,193.9 219.1,200.1 226.1,205.8 233.5,209.2 240.9,209.8 247.7,207.6 253.5,202.8 257.3,194.7 257.5,181.8 252.9,164.7 251.0,154.8 250.4,148.2 250.2,143.0 250.1,138.6 250.0,134.7 250.0,131.3 250.0,128.1 250.0,125.1 250.0,122.4 250.0,119.7 250.0,117.2 250.0,114.8 250.0,112.4 250.0,110.0"/>
  <polygon fill="#b4232c" stroke="#b4232c" stroke-width="1" points="250.0,110.0 250.0,109.6 250.0,109.3 250.0,108.9 250.0,108.5 250.0,108.1 250.0,107.7 250.0,107.3 250.0,106.8 250.0,106.3 250.0,105.7 250.0,105.1 250.0,104.3 250.0,103.5 250.0,102.4 250.0,101.2 250.0,99.5 250.0,97.3 249.6,95.6 248.3,96.4 247.2,97.2 246.2,97.9 245.3,98.7 244.5,99.4 243.9,100.1 243.3,100.8 242.8,101.4 242.3,102.0 241.9,102.6 241.6,103.2 241.3,103.8 241.0,104.3 240.8,104.8 240.6,105.3 240.5,105.7 240.3,106.2 240.2,106.6 240.1,107.0 240.0,107.4 240.0,107.8 239.9,108.2 239.9,108.6 239.8,108.9 239.8,109.3 239.8,109.6 239.8,110.0 239.8,110.4 239.8,110.7 239.8,111.1 239.9,111.4 239.9,111.8 240.0,112.2 240.0,112.6 240.1,113.0 240.2,113.4 240.3,113.8 240.5,114.3 240.6,114.7 240.8,115.2 241.0,115.7 241.3,116.2 241.6,116.8 241.9,117.4 242.3,118.0 242.8,118.6 243.3,119.2 243.9,119.9 244.5,120.6 245.3,121.3 246.2,122.1 247.2,122.8 248.3,123.6 249.6,124.4 250.0,122.7 250.0,120.5 250.0,118.8 250.0,117.6 250.0,116.5 250.0,115.7 250.0,114.9 250.0,114.3 250.0,113.7 250.0,113.2 250.0,112.7 250.0,112.3 250.0,111.9 250.0,111.5 250.0,111.1 250.0,110.7 250.0,110.4 250.0,110.0"/>
  <line x1="262" y1="104" x2="300" y2="80" stroke="#b4232c" stroke-width="1"/>
  <text x="303" y="78" font-size="11" fill="#b4232c">AB4</text>
  <text x="180" y="100" font-size="12" fill="#1d6fd1">RK4</text>
  <line x1="246" y1="13.8" x2="254" y2="13.8" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="262" y="12" font-size="11" fill="#1f2a44">2.83 i</text>
  <text x="152" y="126" font-size="11" text-anchor="end" fill="#1f2a44">−2.79</text>
  <text x="340" y="125" font-size="11" text-anchor="end" fill="#6c7a93">real</text>
  <text x="256" y="215" font-size="11" fill="#6c7a93">imaginary</text>
</svg>
```

An orbit's $z$ sits on the imaginary axis, so the height of each shape along that axis is what limits the step.
:::

::: context variable-step How the real codes change step
Variable-step Adams codes, such as the LSODE family written by Alan Hindmarsh at Lawrence Livermore around 1980 and the `LSODA` option in SciPy's `solve_ivp`, store the history as *divided differences* — differences scaled by the actual spacing between points. From those they rebuild the weights at every step for whatever spacing the history has. They also change their own order on the fly. That is a lot of bookkeeping, which is why a homemade version rarely gets it right.
:::

::: context gauss-jackson The method behind the catalog
Gauss–Jackson goes back to Carl Friedrich Gauss's work on planetary orbits and to the British astronomer John Jackson, who set it out for computing orbits in the 1920s. It stores sums of past accelerations rather than past positions, and steps straight to the new position. The special-perturbations catalog run by the US Space Force keeps track of tens of thousands of objects this way, day after day.
:::

::: context restart Why a jump ruins the history
Picture fitting a smooth curve through the last four speedometer readings of a car that has slammed on the brakes. Three readings are from before the braking, one from after. The curve through them is nonsense, and so is any guess made from it. A multistep method after an engine cutoff is in the same spot until its history has refilled with post-jump values — which is why it restarts with a one-step method.
:::
