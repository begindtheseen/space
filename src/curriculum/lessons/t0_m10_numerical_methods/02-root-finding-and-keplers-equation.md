---
id: l02-root-finding-and-keplers-equation
title: Root finding and Kepler's equation
minutes: 26
covers:
  - "root finding: bisection, Newton-Raphson, secant, and convergence rates"
---

Half of the equations a GNC engineer meets cannot be solved by rearranging them. Kepler's equation, $E - e\sin E = M$, tells you where a satellite is on its ellipse at a given time, and no algebra isolates $E$. The time at which a re-entry vehicle reaches a target altitude, the throttle setting that trims a lander against gravity, the burn duration that delivers a given $\Delta v$ with a changing mass — all of these are statements of the form "find $x$ such that $f(x) = 0$", and all are solved the same way: guess, evaluate, correct, repeat.

The methods in this lesson differ in what they demand and what they promise. Bisection asks for almost nothing and delivers a guaranteed but slow answer. Newton–Raphson asks for a derivative and, close to the root, doubles the number of correct digits every step. The secant method sits between them. Knowing which to use, and being able to predict from the first few iterates how many more you need, is the skill. Kepler's equation runs through the lesson as the example, because you will solve it thousands of times in a propagator and it exhibits every behaviour — quick convergence, slow convergence, and a divergent first step — that the methods can show.

## The problem and how you know you are done

You have a continuous function $f$ and want a root $x^*$ with $f(x^*) = 0$. An iterative method produces a sequence $x_0, x_1, x_2, \ldots$ meant to approach $x^*$, and you stop when some measure of error is below a tolerance. Two measures are in common use, and they are not the same thing.

The *residual* $|f(x_k)|$ is what you can compute. The *error* $e_k = |x_k - x^*|$ is what you care about and cannot compute, since $x^*$ is unknown. Near a simple root, where $f'(x^*) \ne 0$, the two are related by the linearisation $f(x_k) \approx f'(x^*)\,(x_k - x^*)$, so

$$
e_k \approx \frac{|f(x_k)|}{|f'(x^*)|}.
$$

A small residual means a small error only if $f'$ is not small. For Kepler's equation $f'(E) = 1 - e\cos E$, which is near $1 - e$ close to perigee: at $e = 0.99$ a residual of $10^{-12}$ can hide an error of $10^{-10}$. Robust code therefore tests the step $|x_{k+1} - x_k|$, which is a direct estimate of $e_k$ for a fast method, and uses the two-part tolerance from the floating-point lesson, $|x_{k+1} - x_k| \le \text{atol} + \text{rtol}\,|x_{k+1}|$. Asking for a step below the spacing of representable numbers at $x^*$ — for $E \approx 1.2\,\mathrm{rad}$ that spacing is $2^{-52} \approx 2.2 \times 10^{-16}$ — asks for something the arithmetic cannot deliver, and the loop never terminates. Always pair a tolerance with an iteration cap.

## Convergence rates

The methods are compared by how fast $e_k$ shrinks. A sequence converges with *order* $p$ and *asymptotic constant* $C$ if, for large $k$,

$$
e_{k+1} \approx C\,e_k^{\,p}.
$$

Three cases matter:

- **Linear**, $p = 1$ with $0 < C < 1$: each step multiplies the error by $C$, so each step adds a fixed number of correct digits, $-\log_{10} C$ of them. With $C = 0.5$ that is one binary digit, 0.30 decimal digits, per step.
- **Superlinear**, $1 < p < 2$: the error shrinks faster than any geometric sequence. The secant method has $p = (1 + \sqrt{5})/2 \approx 1.618$.
- **Quadratic**, $p = 2$: the number of correct digits roughly doubles at each step, because if $e_k = 10^{-d}$ then $e_{k+1} \approx C \times 10^{-2d}$. From $10^{-3}$ to $10^{-6}$ to $10^{-12}$ in two steps.

The order is a property of the method *near the root*. Far from it, none of these estimates holds, and a quadratically convergent method can wander for many iterations before it locks on. The tables below show both regimes.

::: key
Convergence order $p$: $e_{k+1} \approx C e_k^{\,p}$. Bisection is linear ($p = 1$, $C = \tfrac12$: one bit per step). The secant method is superlinear with $p \approx 1.618$. Newton–Raphson is quadratic ($p = 2$) near a simple root: the number of correct digits roughly doubles per iteration.
:::

## Bisection

If $f$ is continuous and $f(a)$ and $f(b)$ have opposite signs, the intermediate value theorem guarantees a root in $(a, b)$. Bisection keeps that guarantee at every step: evaluate $f$ at the midpoint $c = (a + b)/2$, keep whichever half still has a sign change, repeat. The interval halves each time, so after $k$ steps the root is pinned inside a width of $(b - a)/2^k$, and the midpoint is within half that of the root.

The number of steps needed for a tolerance $\tau$ is fixed in advance:

$$
k = \left\lceil \log_2 \frac{b - a}{\tau} \right\rceil.
$$

For Kepler's equation on $[0, \pi]$ and $\tau = 10^{-12}$ that is $\lceil \log_2(3.14 \times 10^{12}) \rceil = 42$ steps. Slow — Newton will do it in five — but it cannot fail, it needs no derivative, and its cost is known before you start, which is exactly the property real-time software prizes. Bisection is also the fallback that makes hybrid methods safe: if a Newton step leaves the bracket, take a bisection step instead.

Bisection's error is not monotone. The midpoint can land close to the root by luck and then move away on the next step, as the table in the first worked example shows; what shrinks monotonically is the bracket.

## Newton–Raphson

Expand $f$ about the current iterate with the Taylor series from the calculus module and keep the linear term:

$$
f(x^*) = 0 = f(x_k) + f'(x_k)\,(x^* - x_k) + \tfrac12 f''(\xi)\,(x^* - x_k)^2 .
$$

Dropping the quadratic remainder and solving for $x^*$ gives the next iterate — the point where the tangent line at $x_k$ crosses zero:

$$
x_{k+1} = x_k - \frac{f(x_k)}{f'(x_k)}.
$$

The remainder you dropped is the error you make. Subtract $x^*$ from both sides of the update and use the full expansion: with $e_k = x_k - x^*$ (signed, for the moment),

$$
e_{k+1} = e_k - \frac{f(x_k)}{f'(x_k)} = \frac{f'(x_k)\,e_k - f(x_k)}{f'(x_k)} = \frac{\tfrac12 f''(\xi)\,e_k^2}{f'(x_k)},
$$

because $f(x_k) = f'(x_k)e_k - \tfrac12 f''(\xi)e_k^2$ from the expansion rearranged. Hence

$$
|e_{k+1}| \approx \frac{|f''(x^*)|}{2\,|f'(x^*)|}\,e_k^2 ,
$$

which is the quadratic law with $C = |f''|/(2|f'|)$ at the root. For Kepler's equation $f'' = e\sin E$, so $C = e\sin E^*/(2(1 - e\cos E^*))$, a number you can evaluate and check against the table.

Three ways Newton fails, all visible in the formula. If $f'(x_k) = 0$ the step is infinite; if $f'(x_k)$ is merely small the step is huge and lands far away, which is what happens to Kepler's equation near perigee at high eccentricity. If the root is a *multiple* root, $f'(x^*) = 0$ and the derivation breaks down: for $f = x^2$ the iteration is $x_{k+1} = x_k/2$, linear with $C = \tfrac12$, no better than bisection. And there are functions with cycles: $f = x^3 - 2x + 2$ from $x_0 = 0$ goes to 1, back to 0, and repeats forever. None of these is exotic. Every one of them is defended against by bracketing the root first and refusing any Newton step that leaves the bracket.

::: key
Newton–Raphson: $x_{k+1} = x_k - \dfrac{f(x_k)}{f'(x_k)}$. Near a simple root the error obeys $e_{k+1} \approx \dfrac{|f''(x^*)|}{2|f'(x^*)|}\,e_k^2$: quadratic convergence, digits doubling each step. It needs $f'$, a good starting point, and a guard against $f' \approx 0$.
:::

::: example Kepler's equation for a Molniya-type orbit
A satellite is on an orbit with semi-major axis $a = 26{,}600\,\mathrm{km}$ and eccentricity $e = 0.7$, so its period is $2\pi\sqrt{a^3/\mu} \approx 11.99\,\mathrm{h}$ with $\mu = 398{,}600.4\,\mathrm{km^3/s^2}$. One hour after perigee the mean anomaly is $M = n t = 30.0^\circ = 0.523599\,\mathrm{rad}$ (mean motion $n = \sqrt{\mu/a^3} = 1.455 \times 10^{-4}\,\mathrm{rad/s}$, so $t = 3{,}598\,\mathrm{s}$). Find the eccentric anomaly $E$.

Solve $f(E) = E - e\sin E - M = 0$ with $f'(E) = 1 - e\cos E$. The converged root, to all sixteen digits, is $E^* = 1.1674164642219194\,\mathrm{rad} = 66.888^\circ$. Starting Newton from the obvious guess $E_0 = M$:

| $k$ | $E_k$ (rad) | $e_k = \lvert E_k - E^*\rvert$ |
| --- | --- | --- |
| 0 | 0.5235987756 | $6.44 \times 10^{-1}$ |
| 1 | 1.4124149399 | $2.45 \times 10^{-1}$ |
| 2 | 1.1903169669 | $2.29 \times 10^{-2}$ |
| 3 | 1.1676460416 | $2.30 \times 10^{-4}$ |
| 4 | 1.1674164876 | $2.34 \times 10^{-8}$ |
| 5 | 1.1674164642 | $2.2 \times 10^{-16}$ |

The first step overshoots — from the low side of the root to the high side — because $M$ is far from $E^*$ and the tangent-line model is poor there. From $k = 2$ on the digits double: 2, 4, 8, 16. The predicted constant is $C = e\sin E^*/(2(1 - e\cos E^*)) = 0.4439$, and $C e_3^2 = 0.4439 \times (2.30 \times 10^{-4})^2 = 2.34 \times 10^{-8}$, matching $e_4$ to three digits. At $k = 5$ the error equals one ulp of $E^*$; the next iterate reproduces the root exactly, and further iterations change nothing. Five Newton steps, five evaluations of $\sin$ and $\cos$.

Bisection on $[0, \pi]$ for the same root, sampled:

| $k$ | midpoint (rad) | error | bracket width |
| --- | --- | --- | --- |
| 2 | 1.178097 | $1.07 \times 10^{-2}$ | 0.785 |
| 3 | 0.981748 | $1.86 \times 10^{-1}$ | 0.393 |
| 10 | 1.167359 | $5.71 \times 10^{-5}$ | $3.07 \times 10^{-3}$ |
| 20 | 1.167418 | $1.34 \times 10^{-6}$ | $3.00 \times 10^{-6}$ |
| 30 | 1.167416464 | $1.15 \times 10^{-10}$ | $2.93 \times 10^{-9}$ |
| 40 | 1.1674164642 | $1.14 \times 10^{-12}$ | $2.86 \times 10^{-12}$ |

Step 2 happened to land within $0.011$ of the root and step 3 moved away again; the bracket, not the error, is what halves each time. Forty-two steps reach $10^{-12}$, as the formula predicted, against Newton's five. The true anomaly follows from $E^*$: $\tan(\nu/2) = \sqrt{(1+e)/(1-e)}\,\tan(E^*/2)$ gives $\nu = 115.1^\circ$, and $r = a(1 - e\cos E^*) = 19{,}291\,\mathrm{km}$.
:::

## The secant method

Newton needs $f'$. When the derivative is unavailable, expensive, or written by someone you do not trust, replace it with the slope through the last two iterates:

$$
f'(x_k) \approx \frac{f(x_k) - f(x_{k-1})}{x_k - x_{k-1}}, \qquad
x_{k+1} = x_k - f(x_k)\,\frac{x_k - x_{k-1}}{f(x_k) - f(x_{k-1})}.
$$

Geometrically, the tangent line becomes the secant line through the two most recent points. Each step costs one new function evaluation and no derivative.

The price is a lower order. The error analysis mirrors Newton's but the slope estimate itself carries an error proportional to $e_{k-1}$, and the result is

$$
e_{k+1} \approx \frac{|f''(x^*)|}{2|f'(x^*)|}\,e_k\,e_{k-1}.
$$

To turn this into an order, suppose $e_{k+1} \approx C' e_k^{\,p}$ and therefore $e_k \approx C' e_{k-1}^{\,p}$, so $e_{k-1} \approx (e_k/C')^{1/p}$. Substituting, $e_k^{\,p} \propto e_k \cdot e_k^{1/p}$, so $p = 1 + 1/p$, that is $p^2 - p - 1 = 0$, whose positive root is the golden ratio

$$
p = \frac{1 + \sqrt{5}}{2} \approx 1.618.
$$

Per *step* Newton wins. Per *function evaluation* the comparison is closer: if $f'$ costs about as much as $f$, a Newton step costs two evaluations and gains order 2, so its order per evaluation is $\sqrt{2} \approx 1.414$, while the secant method gains $1.618$ per evaluation. When derivatives are expensive the secant method is the faster of the two.

::: example Secant on the same Kepler problem
Take $x_0 = M = 0.5236$ and $x_1 = M + e = 1.2236$ as the two starting points (a common pair: $M$ and $M + e$ bracket the root for $0 < M < \pi$). Iterating the secant formula:

| $k$ | $x_k$ (rad) | $e_k$ | $e_k / (e_{k-1} e_{k-2})$ |
| --- | --- | --- | --- |
| 1 | 1.2235987756 | $5.62 \times 10^{-2}$ | — |
| 2 | 1.1489672699 | $1.85 \times 10^{-2}$ | — |
| 3 | 1.1669616934 | $4.55 \times 10^{-4}$ | 0.439 |
| 4 | 1.1674202096 | $3.75 \times 10^{-6}$ | 0.446 |
| 5 | 1.1674164635 | $7.56 \times 10^{-10}$ | 0.444 |
| 6 | 1.1674164642 | $1.3 \times 10^{-15}$ | 0.470 |

The last column is the predicted secant constant $|f''|/(2|f'|) = 0.444$, the same constant as Newton's, and it holds from step 3 on. Digits gained per step: 1, 2, 3, 6 — growing, as superlinear convergence should, but not doubling. Six evaluations of $f$ reach round-off, against Newton's five evaluations of $f$ *and* five of $f'$. The final ratio is off because $e_6$ is at the round-off floor and no longer measures truncation.
:::

## Choosing the starting point

Newton's speed is conditional on starting close enough, and for Kepler's equation "close enough" depends on $e$. The fixed-point iteration $E_{k+1} = M + e\sin E_k$ — the historical method — converges linearly with $C = e\cos E^*$, which is $0.275$ for the orbit above (about 22 iterations to $10^{-12}$) and near 1 for a highly eccentric orbit near perigee. Newton converges from $E_0 = M$ for modest $e$, but the better guess $E_0 = M + e\sin M$ removes the overshoot; from it the same problem reaches $10^{-13}$ in four steps.

::: example A near-parabolic orbit and a bad first step
For $e = 0.99$ and $M = 5^\circ = 0.08727\,\mathrm{rad}$, the root is $E^* = 0.79170\,\mathrm{rad} = 45.36^\circ$ — nine times the mean anomaly, because near perigee a highly eccentric orbit sweeps eccentric anomaly far faster than mean anomaly. Newton from $E_0 = M$:

| $k$ | $E_k$ (rad) | $e_k$ |
| --- | --- | --- |
| 0 | 0.0873 | $0.70$ |
| 1 | 6.35 | $5.6$ |
| 2 | $-488.4$ | $489$ |
| 3 | $-48.8$ | $49.6$ |
| 6 | 1.472 | $0.68$ |
| 9 | 0.79400 | $2.3 \times 10^{-3}$ |
| 11 | 0.791699202 | $4.3 \times 10^{-11}$ |

At $E_0 = M$ the slope is $f' = 1 - 0.99\cos(0.087) = 0.0138$, so the first step is $-f/f' = 0.0863/0.0138 \approx 6.3\,\mathrm{rad}$: the tangent line is nearly flat and throws the iterate past $2\pi$. The second step, from a point where $\cos E \approx 1$ again, is $-490\,\mathrm{rad}$. Newton does recover here — the root is unique because $f' > 0$ everywhere, so there is nowhere else to go — but only after eight wasted steps. From $E_0 = \pi$ instead, where $f' = 1 + e$ is as large as it gets, the same problem converges monotonically: errors $2.35$, $0.82$, $0.30$, $0.070$, $5.0 \times 10^{-3}$, $2.9 \times 10^{-5}$, $9.7 \times 10^{-10}$, then exact — seven steps. The rule used in flight-quality Kepler solvers is $E_0 = M + e\sin M$ for $e$ below about $0.8$ and $E_0 = \pi$ above it.
:::

::: warning
A Newton solver without a bracket and an iteration cap is a latent hang. The two failure modes — a near-zero derivative flinging the iterate away, and a tolerance below the round-off floor so that $|x_{k+1} - x_k|$ never reaches it — both produce an infinite loop, and both have happened in flight software. Bracket the root, reject steps that leave the bracket in favour of a bisection step, cap the iterations (twenty is generous for Newton), and set the tolerance to a few ulps of the expected root, not to zero.
:::

## Systems of equations

Everything above extends to $\mathbf{f}(\mathbf{x}) = \mathbf{0}$ with $n$ equations in $n$ unknowns, which is how a targeting problem (find the burn that hits a state) or a trim problem (find the control that zeroes the accelerations) is posed. The linearisation is now $\mathbf{f}(\mathbf{x}_k + \boldsymbol{\delta}) \approx \mathbf{f}(\mathbf{x}_k) + \mathbf{J}(\mathbf{x}_k)\,\boldsymbol{\delta}$, where $\mathbf{J}$ is the Jacobian matrix $J_{ij} = \partial f_i/\partial x_j$, and the Newton step solves the linear system

$$
\mathbf{J}(\mathbf{x}_k)\,\boldsymbol{\delta}_k = -\mathbf{f}(\mathbf{x}_k), \qquad \mathbf{x}_{k+1} = \mathbf{x}_k + \boldsymbol{\delta}_k .
$$

Never invert $\mathbf{J}$; solve the system, for reasons the linear-solves lesson explains. Convergence is again quadratic near a root where $\mathbf{J}$ is nonsingular. Two of the later lessons feed this: the complex-step lesson gives you a Jacobian accurate to machine precision, and the conditioning lesson tells you when the solve for $\boldsymbol{\delta}_k$ can be trusted. Bracketing has no analogue in more than one dimension, which is why multidimensional Newton is always paired with a step-length control (a *line search* or *trust region*, from the optimisation module) that shortens $\boldsymbol{\delta}_k$ whenever the full step fails to reduce $\|\mathbf{f}\|$.

::: note
The test of a root finder is its convergence table, not its final answer. Tabulate $e_k$ against $k$ (or $|x_{k+1} - x_k|$ when the root is unknown) and read off the order: a constant ratio $e_{k+1}/e_k$ means linear, a constant $e_{k+1}/e_k^2$ means quadratic. A Newton implementation that shows linear convergence has a wrong derivative or a multiple root; either is worth knowing.
:::

## Check yourself

::: check
Newton's iteration for $\sqrt{a}$ is $x_{k+1} = \tfrac12(x_k + a/x_k)$. Derive it, then run it for $a = 2$ from $x_0 = 1$ and identify the order from the errors.
:::

::: answer
Apply Newton to $f(x) = x^2 - a$ with $f' = 2x$: $x_{k+1} = x_k - (x_k^2 - a)/(2x_k) = \tfrac12(x_k + a/x_k)$. From $x_0 = 1$: $1.5$, $1.416667$, $1.4142157$, $1.41421356237469$, $1.4142135623730951$. Errors against $\sqrt{2}$: $4.1 \times 10^{-1}$, $8.6 \times 10^{-2}$, $2.5 \times 10^{-3}$, $2.1 \times 10^{-6}$, $1.6 \times 10^{-12}$, then round-off. Digits: 0, 1, 3, 6, 12 — doubling, so quadratic. The constant $|f''|/(2|f'|) = 2/(4\sqrt 2) = 0.354$ predicts $e_4 \approx 0.354 \times (2.1 \times 10^{-6})^2 = 1.6 \times 10^{-12}$, as observed.
:::

::: check
A re-entry simulation gives altitude as a function of time only through a full trajectory integration, which is expensive and has no analytic derivative. You must find the time the vehicle passes $80\,\mathrm{km}$ to within $1\,\mathrm{ms}$, knowing it happens between $t = 400$ and $t = 500\,\mathrm{s}$. Which method, and roughly how many trajectory evaluations?
:::

::: answer
No derivative is available, so the choice is bisection or secant. Bisection needs $\lceil \log_2(100/0.001) \rceil = 17$ evaluations, guaranteed. The secant method, started from the two bracket ends, typically needs five to seven evaluations for a smooth function, but is not guaranteed. The right engineering answer is the hybrid: run secant (or the closely related Brent method) steps, and fall back to a bisection step whenever an iterate would leave the current bracket. Expect six or seven evaluations, with seventeen as the worst case.
:::

::: check
Newton's method applied to $f(x) = (x - 1)^2$ from $x_0 = 2$ produces the errors $1, 0.5, 0.25, 0.125, \ldots$. Explain why the convergence is linear, and state its constant.
:::

::: answer
The root $x^* = 1$ is a double root: $f'(x^*) = 0$, so the quadratic-convergence derivation, which divides by $f'(x^*)$, does not apply. Directly, $x_{k+1} = x_k - (x_k - 1)^2/(2(x_k - 1)) = x_k - (x_k - 1)/2$, so $e_{k+1} = e_k/2$: linear with $C = \tfrac12$, one bit per step, the same rate as bisection. In general a root of multiplicity $m$ gives Newton a linear rate $C = 1 - 1/m$; the modified iteration $x_{k+1} = x_k - m f/f'$ restores quadratic convergence when $m$ is known.
:::

::: check
For an orbit with $e = 0.3$, the fixed-point iteration $E_{k+1} = M + e\sin E_k$ is proposed instead of Newton to save the cosine evaluation. Estimate the worst-case number of iterations to reach $10^{-12}$ from an initial error of $1\,\mathrm{rad}$, and compare with Newton.
:::

::: answer
The fixed-point map $g(E) = M + e\sin E$ has $g'(E) = e\cos E$, so the error shrinks by $C = e|\cos E^*| \le 0.3$ per step; worst case $C = 0.3$. Steps needed: $\log(10^{-12})/\log(0.3) = 22.9$, so 23 iterations, each with one sine. Newton from $E_0 = M + e\sin M$ at this eccentricity reaches $10^{-12}$ in about four steps, each with a sine and a cosine: eight trigonometric evaluations against 23. Newton is cheaper even counting the derivative, and at higher $e$ the gap widens because the fixed-point rate $e$ approaches 1.
:::

::: check
You are given a Newton implementation for Kepler's equation and its convergence table shows errors $10^{-1}, 10^{-2}, 10^{-3}, 10^{-4}, \ldots$. What is the most likely bug?
:::

::: answer
Errors falling by a constant factor of ten are linear convergence, not the quadratic convergence Newton must show at a simple root. Kepler's equation has only simple roots for $e < 1$ ($f' = 1 - e\cos E > 0$), so the multiple-root explanation is excluded. The remaining cause is a wrong derivative: a step $-f/g$ with $g \ne f'$ converges linearly with $C = |1 - f'/g|$, here about 0.1. A sign error such as $f' = 1 + e\cos E$, or an omitted factor, is the usual culprit. The convergence table found the bug that the final answer, which is correct after enough iterations, would have hidden.
:::

## Summary

| Item | Statement |
| --- | --- |
| Convergence order | $e_{k+1} \approx C e_k^{\,p}$; digits per step fixed ($p = 1$), growing ($1 < p < 2$), doubling ($p = 2$) |
| Bisection | Halve a bracket with a sign change; $p = 1$, $C = \tfrac12$; steps $= \lceil \log_2((b-a)/\tau) \rceil$; cannot fail |
| Newton–Raphson | $x_{k+1} = x_k - f(x_k)/f'(x_k)$; $p = 2$ with $C = \lvert f''\rvert/(2\lvert f'\rvert)$ near a simple root |
| Secant | Replace $f'$ by $\dfrac{f(x_k) - f(x_{k-1})}{x_k - x_{k-1}}$; $p = (1 + \sqrt5)/2 \approx 1.618$; no derivative |
| Fixed point $x = g(x)$ | Linear with $C = \lvert g'(x^*)\rvert$; Kepler: $C = e\cos E^*$ |
| Kepler's equation | $f(E) = E - e\sin E - M$, $f' = 1 - e\cos E$; start $E_0 = M + e\sin M$, or $\pi$ for $e \gtrsim 0.8$ |
| Stopping | Test the step $\lvert x_{k+1} - x_k\rvert$ against $\text{atol} + \text{rtol}\lvert x\rvert$; never below a few ulps; always cap iterations |
| Systems | Solve $\mathbf{J}\boldsymbol{\delta} = -\mathbf{f}$, then $\mathbf{x} \leftarrow \mathbf{x} + \boldsymbol{\delta}$; pair with a line search |

The next lesson turns from solving for a number to solving for a function: integrating $\dot{\mathbf{y}} = \mathbf{f}(t, \mathbf{y})$ forward in time, where the same Taylor-series bookkeeping decides how far a single step can be trusted.
