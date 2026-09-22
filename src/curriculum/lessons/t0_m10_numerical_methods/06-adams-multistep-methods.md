---
id: l06-adams-multistep-methods
title: Adams-Bashforth and Adams-Moulton multistep methods
minutes: 26
covers:
  - Adams-Bashforth / Adams-Moulton multistep methods
---

RK4 throws away three quarters of its work. Each step evaluates $\mathbf{f}$ four times, and at the end of the step every one of those values is discarded; the next step starts again from nothing. That is fine when $\mathbf{f}$ is a two-body acceleration costing a square root and a division. It is not fine when $\mathbf{f}$ is a $70 \times 70$ spherical-harmonic gravity field with about 5,000 terms, plus a drag model that interpolates an atmospheric density table, plus solar radiation pressure with a shadow test. For a high-fidelity propagator the cost of a step is the cost of its force evaluations and nothing else, and a method that gets fourth-order accuracy from one evaluation per step instead of four is worth four times the throughput.

That is what a *multistep* method does. Instead of sampling new points inside the current step, it fits a polynomial to the derivative values it already has from previous steps and integrates that polynomial forward. The past values are free — they were computed and kept — so the only new evaluation is the one at the new point. The Adams family is the standard construction: **Adams–Bashforth** uses only past points and is explicit, **Adams–Moulton** also uses the new point and is implicit, and the two are run as a predictor–corrector pair that costs two evaluations per step and comes with a free error estimate.

These methods are not a historical curiosity. The special-perturbations catalogue that tracks tens of thousands of objects in Earth orbit is propagated with Gauss–Jackson, an eighth-order fixed-step member of this family, and has been for decades. This lesson builds the Adams methods from the integral form of the ODE, derives their coefficients and error constants, shows what the predictor–corrector difference tells you, and then confronts the two things that catch people out: multistep methods need starting values, and their stability regions are far smaller than RK4's.

## The integral form of the problem

Everything follows from writing the ODE $\dot{\mathbf{y}} = \mathbf{f}(t, \mathbf{y})$ in integral form over one step. Integrate both sides from $t_n$ to $t_{n+1} = t_n + h$:

$$
\mathbf{y}(t_{n+1}) = \mathbf{y}(t_n) + \int_{t_n}^{t_{n+1}} \mathbf{f}(t, \mathbf{y}(t))\,dt .
$$

This is exact. The integrand is unknown — it involves the solution you are trying to find — so every method is a choice of how to approximate it. Runge–Kutta methods sample the integrand at new interior points. Adams methods take the derivative values $\mathbf{f}_n, \mathbf{f}_{n-1}, \mathbf{f}_{n-2}, \ldots$ already computed at the previous mesh points, pass a polynomial through them, and integrate *that* over the step. The whole family is one idea applied with different sets of points.

Write $\mathbf{f}_k = \mathbf{f}(t_k, \mathbf{y}_k)$ throughout, and $s = (t - t_n)/h$ so that $s = 0$ at $t_n$ and $s = 1$ at $t_{n+1}$. The past points sit at $s = 0, -1, -2, \ldots$ and the new point at $s = 1$.

## Adams–Bashforth: extrapolate the derivative

Use only past points. With two of them, $\mathbf{f}_n$ at $s = 0$ and $\mathbf{f}_{n-1}$ at $s = -1$, the interpolating polynomial is the straight line

$$
\mathbf{p}(s) = \mathbf{f}_n + s\,(\mathbf{f}_n - \mathbf{f}_{n-1}) .
$$

Integrate it across the step, remembering $dt = h\,ds$:

$$
\int_0^1 \mathbf{p}(s)\,h\,ds = h\left[\mathbf{f}_n + \tfrac{1}{2}(\mathbf{f}_n - \mathbf{f}_{n-1})\right]
= \frac{h}{2}\left(3\mathbf{f}_n - \mathbf{f}_{n-1}\right).
$$

That is **AB2**, the two-step Adams–Bashforth method. Note what it is doing: over $[t_n, t_{n+1}]$ the line through the last two derivatives is being *extrapolated*, not interpolated, which is why the method is explicit and also why its coefficients are larger than one and alternate in sign.

The general construction is the same with $k$ points. Let $L_j(s)$ be the Lagrange basis polynomial that is 1 at $s = -j$ and 0 at the other past nodes; then $b_j = \int_0^1 L_j(s)\,ds$ and

$$
\mathbf{y}_{n+1} = \mathbf{y}_n + h\sum_{j=0}^{k-1} b_j\,\mathbf{f}_{n-j} .
$$

Carrying out those integrals in exact arithmetic gives the table every implementation uses:

| Method | Order | Formula |
| --- | --- | --- |
| AB1 | 1 | $\mathbf{y}_{n+1} = \mathbf{y}_n + h\,\mathbf{f}_n$ (Euler) |
| AB2 | 2 | $\mathbf{y}_{n+1} = \mathbf{y}_n + \frac{h}{2}(3\mathbf{f}_n - \mathbf{f}_{n-1})$ |
| AB3 | 3 | $\mathbf{y}_{n+1} = \mathbf{y}_n + \frac{h}{12}(23\mathbf{f}_n - 16\mathbf{f}_{n-1} + 5\mathbf{f}_{n-2})$ |
| AB4 | 4 | $\mathbf{y}_{n+1} = \mathbf{y}_n + \frac{h}{24}(55\mathbf{f}_n - 59\mathbf{f}_{n-1} + 37\mathbf{f}_{n-2} - 9\mathbf{f}_{n-3})$ |

A $k$-step Adams–Bashforth method is of order $k$: it uses $k$ values of $\mathbf{f}$ and reproduces polynomials of degree $k-1$ exactly. Two checks are worth doing on any such table. The coefficients must sum to 1 — $(55 - 59 + 37 - 9)/24 = 1$ — because a constant derivative must be integrated exactly, which is the *consistency* condition. And their alternating signs with magnitudes above 1 are the signature of extrapolation; AB4's leading coefficient is $55/24 = 2.29$, so the method reaches well past the data it has.

The local truncation error follows by applying the formula to $y(t) = t^{k+1}$, for which it is not exact, and dividing by $(k+1)!$:

$$
\text{LTE}_{\text{AB4}} = \frac{251}{720}\,h^5 y^{(5)}(\xi) \approx 0.349\,h^5 y^{(5)} .
$$

Local error $O(h^5)$, global error $O(h^4)$, by the same argument as in the RK4 lesson: $O(1/h)$ steps each contributing $O(h^5)$.

::: key
Adams–Bashforth is explicit and uses only past derivative values: $\mathbf{y}_{n+1} = \mathbf{y}_n + h\sum_{j=0}^{k-1} b_j \mathbf{f}_{n-j}$, obtained by integrating the polynomial through $\mathbf{f}_n, \ldots, \mathbf{f}_{n-k+1}$ across $[t_n, t_{n+1}]$. A $k$-step method has order $k$. AB4: $\mathbf{y}_{n+1} = \mathbf{y}_n + \frac{h}{24}(55\mathbf{f}_n - 59\mathbf{f}_{n-1} + 37\mathbf{f}_{n-2} - 9\mathbf{f}_{n-3})$, local error $\frac{251}{720}h^5 y^{(5)}$, one new evaluation of $\mathbf{f}$ per step.
:::

## Adams–Moulton: include the point you are stepping to

Add the node $s = 1$ to the interpolation set. Now the polynomial passes through $\mathbf{f}_{n+1}$ as well, the step is genuine interpolation rather than extrapolation, and the method is implicit because $\mathbf{f}_{n+1}$ depends on the answer $\mathbf{y}_{n+1}$:

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

The implicit methods are better in three ways at once. They reach order $k+1$ from $k$ past values instead of order $k$, because the extra node buys a degree. Their coefficients are small and mostly positive, so they do not amplify the data. And their error constants are far smaller:

$$
\text{LTE}_{\text{AM4}} = -\frac{19}{720}\,h^5 y^{(5)}(\xi) \approx -0.0264\,h^5 y^{(5)} .
$$

AM4's error constant is $19/720$ against AB4's $251/720$: the same order, but a factor of $251/19 = 13.2$ smaller, and of the opposite sign. That opposite sign is not decoration — the next section turns it into a free error estimate.

The price is that you must solve for $\mathbf{y}_{n+1}$, which appears on both sides through $\mathbf{f}_{n+1}$. For a stiff problem that means a genuine Newton solve, which the next lesson takes up. For a non-stiff problem there is a cheaper route.

## Predictor–corrector: PECE and Milne's device

Predict with the explicit method, then use the prediction to evaluate the implicit one's right-hand side. The standard cycle is **PECE** — predict, evaluate, correct, evaluate:

$$
\begin{aligned}
\text{P:}\quad &\mathbf{y}^{P}_{n+1} = \mathbf{y}_n + \tfrac{h}{24}\left(55\mathbf{f}_n - 59\mathbf{f}_{n-1} + 37\mathbf{f}_{n-2} - 9\mathbf{f}_{n-3}\right), \\
\text{E:}\quad &\mathbf{f}^{P}_{n+1} = \mathbf{f}(t_{n+1}, \mathbf{y}^{P}_{n+1}), \\
\text{C:}\quad &\mathbf{y}_{n+1} = \mathbf{y}_n + \tfrac{h}{24}\left(9\mathbf{f}^{P}_{n+1} + 19\mathbf{f}_n - 5\mathbf{f}_{n-1} + \mathbf{f}_{n-2}\right), \\
\text{E:}\quad &\mathbf{f}_{n+1} = \mathbf{f}(t_{n+1}, \mathbf{y}_{n+1}) .
\end{aligned}
$$

Two evaluations per step, still half of RK4's four, and the result inherits AM4's small error constant to leading order because the prediction is already fourth-order accurate.

Now use the two error constants together. Writing $C_P = 251/720$ and $C_C = -19/720$, the exact solution satisfies

$$
\mathbf{y}(t_{n+1}) - \mathbf{y}^{P}_{n+1} \approx C_P\,h^5\mathbf{y}^{(5)}, \qquad
\mathbf{y}(t_{n+1}) - \mathbf{y}_{n+1} \approx C_C\,h^5\mathbf{y}^{(5)} .
$$

Subtract. The unknown $h^5\mathbf{y}^{(5)}$ drops out in favour of something you can measure:

$$
\mathbf{y}_{n+1} - \mathbf{y}^{P}_{n+1} \approx (C_P - C_C)h^5\mathbf{y}^{(5)} = \tfrac{270}{720}h^5\mathbf{y}^{(5)}
\;\Longrightarrow\;
\mathbf{y}(t_{n+1}) - \mathbf{y}_{n+1} \approx -\frac{19}{270}\left(\mathbf{y}_{n+1} - \mathbf{y}^{P}_{n+1}\right).
$$

This is **Milne's device**: the difference between predictor and corrector, scaled by $-19/270 \approx -0.0704$, estimates the local error of the corrector. It is the multistep analogue of the embedded pair from the adaptive-stepping lesson and feeds the same controller, $h_{\text{new}} = h \cdot \text{safety} \cdot (\text{tol}/\text{err})^{1/(p+1)}$ with $p = 4$ — subject to the caveat about changing $h$ at the end of this lesson.

::: example Milne's device on one orbit step
The circular 500 km orbit from the earlier lessons: $\mu = 398{,}600.4418\,\mathrm{km^3/s^2}$, $r_0 = 6{,}878.137\,\mathrm{km}$, $v_0 = 7.6126\,\mathrm{km/s}$, period $T = 5{,}677\,\mathrm{s}$. Take exact derivative values at $t = -180, -120, -60, 0\,\mathrm{s}$ from the analytic circular solution and take one PECE step of $h = 60\,\mathrm{s}$.

| quantity | $x$ (km) | $y$ (km) |
| --- | --- | --- |
| exact at $t = 60\,\mathrm{s}$ | 6,862.976656839 | 456.420856719 |
| AB4 predictor | 6,862.976440467 | 456.417769782 |
| AM4 corrector | 6,862.976738216 | 456.421085586 |

The predictor's position error is $3.09\,\mathrm{m}$ and the corrector's is $0.243\,\mathrm{m}$: a ratio of 12.7, against the 13.2 the error constants predict. The predictor–corrector difference is $\lVert\mathbf{y}_{n+1} - \mathbf{y}^{P}_{n+1}\rVert = 3.33\,\mathrm{m}$, so Milne's estimate of the corrector's local error is $0.0704 \times 3.33 = 0.234\,\mathrm{m}$ — within 4% of the true $0.243\,\mathrm{m}$, and it cost nothing but a subtraction of two vectors you already had.
:::

## Starting the method, and what happens if you start it badly

A four-step method needs $\mathbf{y}_n, \mathbf{y}_{n-1}, \mathbf{y}_{n-2}, \mathbf{y}_{n-3}$ before it can take its first step, and an initial value problem gives you one of them. The gap is filled by a **self-starting** method of the same order: run three steps of RK4, keep the four derivative values, then hand over. The cost is about a dozen extra evaluations, paid once.

The order of the starter matters, and this is where the trap is. The starting error is committed once, not once per step, so it does not shrink with $1/h$ the way a per-step error does. Three Euler steps commit $O(h^2)$ of error; nothing the fourth-order method does afterwards removes it, and the whole integration degrades to second order.

::: example A fourth-order method crippled by a first-order start
AB4 on the circular 500 km orbit, one revolution, position error against the analytic solution:

| $h$ | started with RK4 | started with three Euler steps |
| --- | --- | --- |
| $60\,\mathrm{s}$ | $0.282\,\mathrm{km}$ | $1{,}764\,\mathrm{km}$ |
| $30\,\mathrm{s}$ | $0.00384\,\mathrm{km}$ | $432\,\mathrm{km}$ |
| $15\,\mathrm{s}$ | $0.00060\,\mathrm{km}$ | $107\,\mathrm{km}$ |

The Euler-started column falls by a factor of 4.1 then 4.0 as the step halves: second order, exactly as predicted, and six orders of magnitude worse in absolute terms. The RK4-started column falls much faster. Nothing is wrong with the AB4 coefficients in either column; the difference is entirely in the three steps before the method took over. When a multistep propagator shows an order you did not expect, look at the starter before you look at the coefficients.
:::

Here is the whole scheme in code. The history list holds the last four derivative values, newest first, and is rotated by one slot each step:

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
```

On $\dot y = -y$ from $y_0 = 1$ with $h = 0.1$ and exact starting values, `propagate` returns $y(1) = 0.36787826631967274$ against $e^{-1} = 0.36787944117144233$: an error of $-1.17 \times 10^{-6}$ from 20 evaluations of $\mathbf{f}$.

## Stability: the price of the free evaluations

Apply a $k$-step method to $\dot y = \lambda y$ and put $z = h\lambda$. Every term becomes a multiple of a previous $y$, so the recurrence is linear with constant coefficients and its solutions are combinations of $\zeta^n$, where $\zeta$ solves the *characteristic polynomial*. For AB4,

$$
\zeta^4 - \zeta^3 - \frac{z}{24}\left(55\zeta^3 - 59\zeta^2 + 37\zeta - 9\right) = 0 .
$$

The method is stable at that $z$ when every root satisfies $|\zeta| \le 1$; if any root exceeds 1, the component of the numerical solution belonging to it grows geometrically. A one-step method has one root, which is the amplification factor $R(z)$ of the earlier lessons. A four-step method has four: one *principal* root that approximates $e^{z}$ and does the physics, and three *parasitic* roots that are artefacts of the recurrence and should stay small.

Solving the root condition along the negative real axis and along the imaginary axis gives the numbers that decide your step size:

| Method | Real interval | Imaginary limit $\lvert z\rvert$ | Evaluations per step |
| --- | --- | --- | --- |
| AB2 | $(-1, 0)$ | 0 | 1 |
| AB3 | $(-6/11, 0) = (-0.545, 0)$ | 0.724 | 1 |
| AB4 | $(-0.3, 0)$ | 0.430 | 1 |
| AM3 | $(-6, 0)$ | — | implicit |
| AM4 | $(-3, 0)$ | — | implicit |
| PECE AB4–AM4 | $(-1.28, 0)$ | 0 | 2 |
| RK4 | $(-2.785, 0)$ | $2\sqrt{2} = 2.828$ | 4 |

Read the last two columns together. RK4 tolerates $|z|$ up to 2.83 on the imaginary axis; AB4 tolerates 0.43, a factor of 6.6 smaller. RK4 costs four times as much per step. So on a problem where stability rather than accuracy sets the step, the multistep method's advantage evaporates and then reverses. On a problem where accuracy sets the step — which is the usual case for an orbit, where you want far more than the 15 points per revolution that AB4's stability limit allows — the multistep method wins.

For an orbit the relevant eigenvalues are $\lambda = \pm i n$, with $n$ the mean motion, exactly as in the symplectic lesson. On the 500 km orbit $n = 1.1068 \times 10^{-3}\,\mathrm{rad/s}$, so AB4 requires $h n < 0.430$, that is $h < 389\,\mathrm{s}$, or at least 14.6 steps per revolution. RK4's limit is $h < 2{,}556\,\mathrm{s}$, under 3 steps per revolution — a limit you would never approach, because the accuracy at that step is worthless.

::: example Crossing the AB4 stability limit
The harmonic oscillator $\ddot x = -x$, so $\omega = 1$ and $z = ih\omega$, started at $x = 1$, $\dot x = 0$ with an RK4 start. Amplitude $\sqrt{x^2 + \dot x^2}$ after 20 periods:

| $h\omega$ | AB4 | PECE AB4–AM4 | RK4 |
| --- | --- | --- | --- |
| 0.20 | 0.979 | 1.006 | — |
| 0.40 | 0.549 | 1.165 | 0.991 |
| 0.44 | 0.304 | — | — |
| 0.45 | 5.70 | — | — |
| 0.50 | $1.31 \times 10^{8}$ | 1.461 | — |
| 2.80 | — | — | 0.039 |
| 2.90 | — | — | $1.98 \times 10^{3}$ |

AB4 damps below the limit and explodes above it, and RK4 does the same at $h\omega = 2\sqrt{2}$. The interesting column is the onset. At $h\omega = 0.50$ the dominant root has modulus 1.1031, so the unstable component multiplies by $1.1031^{12.57} = 3.43$ per period — but it starts at the size of the startup and round-off error, so it is invisible at first. The amplitude reads 0.927 after one period, 0.866 after two, 1.60 after five, $6.2 \times 10^{2}$ after ten and $1.3 \times 10^{8}$ after twenty. A multistep instability does not announce itself on the first step; it appears as a fast, growing oscillation at the step frequency after the run has looked healthy for a while.
:::

::: warning
The PECE pair's stability region touches the imaginary axis at the origin and lies entirely to the right of it there: for a purely oscillatory problem, every $h$ gives a root of modulus slightly above 1. The growth is very weak — at $h\omega = 0.2$ the amplitude after 20 periods is 1.006, not 1.3 — but it is one-directional, so on a long orbit propagation the energy drifts *upward*, where plain AB4's drifts downward. Neither is a bug; both are the amplification factor doing what the table above says. Compare with the symplectic lesson: no Adams method is symplectic, and all of them drift secularly.
:::

## What it buys on a real orbit

Compare the three methods at equal cost. RK4 at $h = 60\,\mathrm{s}$, PECE at $h = 30\,\mathrm{s}$ and AB4 at $h = 15\,\mathrm{s}$ all spend one force evaluation per 15 s of propagation. On the circular 500 km orbit, starting from $(r_0, 0)$ with velocity $(0, v_0)$:

| Method | $h$ | position error, 1 rev | position error, 100 rev | $\delta\varepsilon$, 100 rev | evaluations, 100 rev |
| --- | --- | --- | --- | --- | --- |
| RK4 | $60\,\mathrm{s}$ | $26.6\,\mathrm{m}$ | $75.1\,\mathrm{km}$ | $-2.26 \times 10^{-5}$ | 37,848 |
| PECE AB4–AM4 | $30\,\mathrm{s}$ | $3.82\,\mathrm{m}$ | $52.8\,\mathrm{km}$ | $+1.63 \times 10^{-5}$ | 37,856 |
| AB4 | $15\,\mathrm{s}$ | $0.60\,\mathrm{m}$ | $5.45\,\mathrm{km}$ | $-1.72 \times 10^{-6}$ | 37,860 |

At the same cost AB4 is 44 times more accurate than RK4 over one revolution and 14 times over a hundred. The mechanism is simple arithmetic: both are fourth order, AB4's step is a quarter of RK4's, and $4^4 = 256$ beats the factor of about 11 by which AB4's error constant is worse at this step. PECE sits between them, buying a smaller error constant and an error estimate at twice AB4's cost.

The energy columns are worth reading against the previous lesson. All three drifts are *secular*: each is very close to 100 times its one-revolution value, so each grows linearly in the number of revolutions. The signs differ — AB4 and RK4 lose energy, PECE gains it — and each sign is the one the imaginary-axis root modulus predicts.

::: warning
Everything above assumes a fixed step. The Adams coefficients are derived for equally spaced past points, so changing $h$ invalidates the history you are holding. Production variable-step Adams codes handle this by storing divided differences and re-deriving the coefficients at every step, which is real machinery and is why `solve_ivp`'s `LSODA` and `DOP853` behave so differently in this respect. A homegrown multistep propagator that simply changes $h$ and reuses the old $\mathbf{f}$ values is silently solving a different problem. If you want an adaptive step, use an embedded Runge–Kutta pair; if you want one evaluation per step, commit to a fixed step.
:::

## Where this lives in GNC

Fixed step, cheap per step, expensive force model, long arc: that is exactly the shape of orbit determination and catalogue maintenance, which is why the multistep methods own that domain. **Gauss–Jackson** is the standard tool — an eighth-order fixed-step Adams-type method specialised for second-order equations $\ddot{\mathbf{r}} = \mathbf{a}(t, \mathbf{r})$, which integrates the acceleration twice rather than reducing to first order, halving the work again. It is what the United States space-object catalogue's special-perturbations propagator has used for decades, and it is standard in astrodynamics toolkits.

On a flight computer the argument is different but points the same way. A fixed-step multistep method has a fixed, small, data-independent cost per frame — the property the adaptive-stepping lesson said a real-time scheduler demands — and it needs one force evaluation per frame instead of RK4's four, which matters when the on-board gravity model is a $20 \times 20$ or $40 \times 40$ field. Against that it costs memory for the history, it needs restarting after any discontinuity (a thruster firing, a staging event, a mode switch) because the stored derivatives no longer describe the current dynamics, and its stability margin is thinner. Restarting is the decisive point for a vehicle under thrust, and it is why RK4 remains the default in ascent and landing software while multistep methods dominate the long, quiet, unthrusted arcs.

## Check yourself

::: check
Derive AB3 from the integral form: integrate the quadratic through $\mathbf{f}_n$, $\mathbf{f}_{n-1}$, $\mathbf{f}_{n-2}$ over one step, and check the coefficients sum correctly.
:::

::: answer
With $s = (t - t_n)/h$, the nodes are $s = 0, -1, -2$. The Lagrange basis is
$L_0 = \frac{(s+1)(s+2)}{(0+1)(0+2)} = \frac{s^2 + 3s + 2}{2}$, $L_1 = \frac{s(s+2)}{(-1)(1)} = -(s^2 + 2s)$, $L_2 = \frac{s(s+1)}{(-2)(-1)} = \frac{s^2+s}{2}$.
Integrating each from 0 to 1 using $\int_0^1 s^2 ds = 1/3$ and $\int_0^1 s\,ds = 1/2$:
$b_0 = \frac{1}{2}(\frac13 + \frac32 + 2) = \frac{23}{12}$, $b_1 = -(\frac13 + 1) = -\frac{16}{12}$, $b_2 = \frac{1}{2}(\frac13 + \frac12) = \frac{5}{12}$.
So $\mathbf{y}_{n+1} = \mathbf{y}_n + \frac{h}{12}(23\mathbf{f}_n - 16\mathbf{f}_{n-1} + 5\mathbf{f}_{n-2})$, and $(23 - 16 + 5)/12 = 12/12 = 1$, the consistency condition. A constant derivative is integrated exactly.
:::

::: check
A PECE step of an AB4–AM4 propagator gives a predictor–corrector difference of $\lVert\mathbf{y}_{n+1} - \mathbf{y}^{P}_{n+1}\rVert = 4.0 \times 10^{-4}\,\mathrm{km}$ at $h = 60\,\mathrm{s}$. Estimate the local error, and find the step that would bring the local error to $10^{-6}\,\mathrm{km}$.
:::

::: answer
Milne's device gives the corrector's local error as $\frac{19}{270} \times 4.0 \times 10^{-4} = 2.81 \times 10^{-5}\,\mathrm{km}$, about 28 mm. The local error is $O(h^5)$, so the required ratio is $h_{\text{new}}/h = (10^{-6}/2.81 \times 10^{-5})^{1/5} = (0.0355)^{0.2} = 0.513$, giving $h_{\text{new}} = 30.8\,\mathrm{s}$. With the usual safety factor of 0.9 a controller would propose about $27.7\,\mathrm{s}$ — and, since this is a multistep method, would then have to rebuild its history at the new spacing rather than reuse the old derivative values.
:::

::: check
A propagator switches from RK4 at $h = 60\,\mathrm{s}$ to AB4 at $h = 60\,\mathrm{s}$ to save time on a geostationary satellite, mean motion $n = 7.2921 \times 10^{-5}\,\mathrm{rad/s}$. Is that step inside AB4's stability limit? What about the same swap on a 400 km orbit with $n = 1.1313 \times 10^{-3}\,\mathrm{rad/s}$ and $h = 400\,\mathrm{s}$?
:::

::: answer
AB4's imaginary-axis limit is $|z| = hn < 0.430$. Geostationary: $hn = 60 \times 7.2921 \times 10^{-5} = 4.38 \times 10^{-3}$, far inside — no stability concern, and the accuracy will be excellent since the orbit is covered in $86{,}164/60 = 1{,}436$ steps. The 400 km case: $hn = 400 \times 1.1313 \times 10^{-3} = 0.4525$, *outside* the limit of 0.430. AB4 will run, look plausible for several revolutions while the unstable parasitic root grows from round-off, and then diverge. The same step in RK4 is comfortably stable, since $0.4525 \ll 2.828$ — which is exactly how such a swap gets made and why it fails later rather than immediately.
:::

::: check
Why is AM4's error constant smaller than AB4's, given that both use four derivative values and both are fourth order?
:::

::: answer
AB4 *extrapolates*: the interpolating polynomial is built from nodes at $s = 0, -1, -2, -3$ and then integrated over $s \in [0, 1]$, outside the range of its data, where the polynomial's error grows fastest. AM4 *interpolates*: its nodes are $s = 1, 0, -1, -2$ and the integration interval $[0,1]$ lies inside them. The error constants, $251/720$ against $19/720$, are the quantitative version of that geometric difference. The same reasoning explains why AM4 reaches order 4 from three past values plus the new one while AB4 needs four past values: the new node adds a degree to the polynomial.
:::

::: check
Your colleague proposes AB4 for the on-board propagator of a launch vehicle's upper stage, arguing it is four times cheaper than RK4 per step. Give the two conditions under which he is right, and the one event during the mission that breaks the method.
:::

::: answer
He is right when the step is set by accuracy rather than stability — so $hn$ is well below 0.430, which for an upper-stage parking orbit at a sensible loop rate it will be — and when the force evaluation dominates the cost of a step, which it does if the on-board gravity model is a spherical-harmonic field rather than a point mass. Both conditions usually hold on a coast arc. The event that breaks it is any discontinuity in the dynamics: an engine ignition or cutoff, a staging event, a change of mass properties. The stored derivatives $\mathbf{f}_{n-1}, \mathbf{f}_{n-2}, \mathbf{f}_{n-3}$ then describe dynamics that no longer apply, the interpolating polynomial is fitted across a jump, and the step is badly wrong. The fix is to restart with RK4 for three steps after every discontinuity — which means the flight software carries an RK4 implementation anyway, and the engineering question becomes whether the coast arcs are long enough to repay the extra complexity.
:::

## Summary

| Item | Statement |
| --- | --- |
| Integral form | $\mathbf{y}(t_{n+1}) = \mathbf{y}(t_n) + \int_{t_n}^{t_{n+1}}\mathbf{f}\,dt$; Adams methods integrate the polynomial through known $\mathbf{f}$ values |
| AB2 | $\mathbf{y}_{n+1} = \mathbf{y}_n + \frac{h}{2}(3\mathbf{f}_n - \mathbf{f}_{n-1})$, order 2 |
| AB4 | $\mathbf{y}_{n+1} = \mathbf{y}_n + \frac{h}{24}(55\mathbf{f}_n - 59\mathbf{f}_{n-1} + 37\mathbf{f}_{n-2} - 9\mathbf{f}_{n-3})$, order 4, LTE $\frac{251}{720}h^5y^{(5)}$, 1 evaluation per step |
| AM4 | $\mathbf{y}_{n+1} = \mathbf{y}_n + \frac{h}{24}(9\mathbf{f}_{n+1} + 19\mathbf{f}_n - 5\mathbf{f}_{n-1} + \mathbf{f}_{n-2})$, order 4, LTE $-\frac{19}{720}h^5y^{(5)}$, implicit |
| Consistency | Coefficients of any Adams formula sum to 1 |
| Milne's device | Local error of the corrector $\approx -\frac{19}{270}(\mathbf{y}_{n+1} - \mathbf{y}^{P}_{n+1})$; feeds the usual $\text{tol}^{1/(p+1)}$ controller |
| Starting | Needs $k$ past values; start with RK4. A first-order start drops the whole integration to second order |
| Stability | AB4 real $(-0.3, 0)$, imaginary $\lvert z\rvert < 0.430$; PECE real $(-1.28,0)$; RK4 real $(-2.785,0)$, imaginary $2\sqrt{2}$ |
| Orbit step limit | AB4 needs $hn < 0.430$: at least 14.6 steps per revolution |
| Failure mode | A parasitic root leaves the unit circle; growth is seeded by round-off, so divergence appears only after many steps |
| Equal cost, 500 km orbit | 1 evaluation per 15 s: AB4 $0.60\,\mathrm{m}$, PECE $3.82\,\mathrm{m}$, RK4 $26.6\,\mathrm{m}$ after one revolution |
| Fixed step | Adams coefficients assume equal spacing; never change $h$ and reuse the history |
| In GNC | Gauss–Jackson (8th-order, fixed step) for catalogue and orbit-determination propagation; restart after any discontinuity |

Every implicit method in this lesson was sidestepped by predicting rather than solving, which works only because the problems were non-stiff. The next lesson asks what stiffness is, shows why an explicit method's step on a stiff problem is set by stability rather than accuracy, and solves the implicit equations properly with backward Euler and the BDF family.
