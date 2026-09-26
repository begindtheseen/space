---
id: l02-root-finding-and-keplers-equation
title: Root finding and Kepler's equation
minutes: 22
covers:
  - root finding: bisection, Newton-Raphson, secant, and convergence rates
---

Play "guess my number" with a friend. You say 50, she says "too high". You say 25, she says "too low". Every answer tells you which way to go, and in a handful of guesses you have it. That game is the whole of this lesson. It is how a computer solves an equation that algebra cannot.

Half the equations a GNC engineer meets cannot be solved by rearranging them. **[[Kepler's equation|kepler-geometry]]**, $E - e\sin E = M$, tells you where a satellite is on its ellipse at a given time, and no algebra gets $E$ by itself on one side. Others are like it: the time a re-entry vehicle reaches a target altitude, the throttle setting that holds a lander steady against gravity, the burn length that delivers a given $\Delta v$ while the mass changes. Each one is a statement "find $x$ such that $f(x) = 0$". Each is solved the same way: guess, evaluate, correct, repeat. A value of $x$ that makes $f(x) = 0$ is called a **root** of $f$.

The methods here differ in what they need and what they promise. **Bisection** needs almost nothing and gives a guaranteed but slow answer. **Newton–Raphson** needs a derivative and, close to the root, doubles the number of correct digits every step. The **secant method** sits between them. The skill is knowing which to use, and reading from the first few guesses how many more you need. Kepler's equation runs through the lesson as the example. You will solve it thousands of times in a propagator, and it shows every behavior these methods can show: fast convergence, slow convergence, and a wild first step.

## How do you know you are done?

You have a continuous function $f$ and want a root $x^*$ ("x star"). An iterative method makes a list of guesses $x_0, x_1, x_2, \ldots$ that should close in on $x^*$. You stop when some measure of error is below a **tolerance** — the error you are willing to accept. Two measures are in common use, and they are not the same thing.

- The **residual** $|f(x_k)|$ — how far $f$ is from zero at your guess. You can compute it.
- The **error** $e_k = |x_k - x^*|$ — how far your guess is from the root. This is what you care about, and you cannot compute it, because you do not know $x^*$.

Near a **[[simple root|simple-root]]** — one where the curve crosses zero with a nonzero slope, $f'(x^*) \ne 0$ — the curve is nearly a straight line: $f(x_k) \approx f'(x^*)\,(x_k - x^*)$. Divide by the slope:

$$
e_k \approx \frac{|f(x_k)|}{|f'(x^*)|}.
$$

So a small residual means a small error only if the slope $f'$ is not small. For Kepler's equation $f'(E) = 1 - e\cos E$, which is close to $1 - e$ near **[[perigee|perigee]]**. At $e = 0.99$ the slope there is about $0.01$, so a residual of $10^{-12}$ can hide an error of $10^{-10}$.

Robust code therefore tests the **step** $|x_{k+1} - x_k|$. For a fast method that is a direct estimate of the error. It uses the two-part tolerance from the floating-point lesson:

$$
|x_{k+1} - x_k| \le \text{atol} + \text{rtol}\,|x_{k+1}|.
$$

Do not ask for a step smaller than the gap between floating-point numbers at the root. For $E \approx 1.2\,\mathrm{rad}$ that gap is $2^{-52} \approx 2.2 \times 10^{-16}$. Ask for less and the loop never ends. So always pair a tolerance with a cap on the number of iterations.

## Convergence rates

Methods are compared by how fast the error shrinks. A sequence **converges with order $p$** and **asymptotic constant $C$** if, once you are close,

$$
e_{k+1} \approx C\,e_k^{\,p}.
$$

Read it as: "the next error is about $C$ times this error raised to the power $p$." Three cases matter.

- **Linear**, $p = 1$ with $0 < C < 1$. Each step multiplies the error by $C$. So each step adds the same number of correct digits, $-\log_{10} C$ of them. With $C = 0.5$ that is one binary digit per step, or 0.30 decimal digits.
- **Superlinear**, $1 < p < 2$. The error shrinks faster than any fixed multiplier could make it. The secant method has $p = (1 + \sqrt{5})/2 \approx 1.618$.
- **Quadratic**, $p = 2$. The number of correct digits roughly doubles each step. If $e_k = 10^{-d}$ then $e_{k+1} \approx C \times 10^{-2d}$: from $10^{-3}$ to $10^{-6}$ to $10^{-12}$ in two steps.

The order describes the method *near the root*. Far away, none of these estimates holds, and a quadratic method can wander for many steps before it locks on. The tables below show both.

::: key
Convergence order $p$: $e_{k+1} \approx C e_k^{\,p}$. Bisection is linear ($p = 1$, $C = \tfrac12$: one bit per step) but guaranteed given a sign change. The secant method is superlinear with order $p \approx 1.618$ and needs no derivative. Newton–Raphson is quadratic ($p = 2$) near a simple root: the number of correct digits roughly doubles per iteration.
:::

## Bisection

Suppose $f$ is continuous — its graph has no jumps — and $f(a)$ is negative while $f(b)$ is positive. To get from below zero to above zero without jumping, the graph must cross zero somewhere between. That is the **[[intermediate value theorem|intermediate-value]]**. The pair $a, b$ is called a **bracket**: it is known to hold a root.

**Bisection** keeps that guarantee at every step. Evaluate $f$ at the midpoint $c = (a + b)/2$. Keep whichever half still has a sign change. Repeat. It is the guessing game exactly. The bracket halves each time, so after $k$ halvings the root is pinned inside a width of $(b - a)/2^k$, and the midpoint is within half of that.

The number of steps for a tolerance $\tau$ (tau) is known before you start:

$$
k = \left\lceil \log_2 \frac{b - a}{\tau} \right\rceil .
$$

The brackets $\lceil\ \rceil$ mean "round up to the next whole number". For Kepler's equation on $[0, \pi]$ with $\tau = 10^{-12}$ that is $\lceil \log_2(3.14 \times 10^{12}) \rceil = 42$ steps.

Slow — Newton does it in five. But bisection cannot fail, needs no derivative, and its cost is known in advance. Real-time software prizes exactly that last property. Bisection is also the safety net for faster methods: if a Newton step would leave the bracket, take a bisection step instead.

One surprise: bisection's *error* does not shrink every step. The midpoint can land close to the root by luck and then move away on the next step, as the table in the first worked example shows. What shrinks every single step is the **[[bracket|bisection-bars]]**.

## Newton–Raphson

Here is the idea in a picture. Stand on the curve at your guess. Draw the **tangent line** — the straight line that just touches the curve there, with the same slope. Slide down that line to where it hits zero. That is your next guess. Near the root the curve is almost straight, so the line lands almost exactly on the root.

In symbols, expand $f$ about the current guess with the Taylor series from the calculus module. At the root $f(x^*) = 0$, so

$$
0 = f(x_k) + f'(x_k)\,(x^* - x_k) + \tfrac12 f''(\xi)\,(x^* - x_k)^2 .
$$

The last term is the exact remainder: $\xi$ (the Greek letter xi) is some point between $x_k$ and $x^*$. Drop that squared term, solve for $x^*$, and call the answer $x_{k+1}$:

$$
x_{k+1} = x_k - \frac{f(x_k)}{f'(x_k)} .
$$

That is the **[[tangent-line|newton-tangent]]** step.

### Why the digits double

The term you dropped is the error you make. Let $e_k = x_k - x^*$ (with its sign, for now). Rearranging the expansion gives $f(x_k) = f'(x_k)\,e_k - \tfrac12 f''(\xi)\,e_k^2$. Subtract $x^*$ from both sides of the update and substitute:

$$
e_{k+1} = e_k - \frac{f(x_k)}{f'(x_k)} = \frac{f'(x_k)\,e_k - f(x_k)}{f'(x_k)} = \frac{\tfrac12 f''(\xi)\,e_k^2}{f'(x_k)} .
$$

Close to the root, $x_k$ and $\xi$ are both nearly $x^*$, so

$$
|e_{k+1}| \approx \frac{|f''(x^*)|}{2\,|f'(x^*)|}\,e_k^2 .
$$

The next error is a constant times the *square* of this one — the quadratic law, with $C = |f''|/(2|f'|)$ at the root. For Kepler's equation $f'' = e\sin E$, so $C = e\sin E^*/(2(1 - e\cos E^*))$. That is a number you can compute and check against the table below.

### How Newton fails

Three ways, all visible in the formula.

- **A flat slope.** If $f'(x_k) = 0$ the step is infinite. If $f'(x_k)$ is merely small, the step is huge and lands far away. That is what happens to Kepler's equation near perigee at high eccentricity.
- **A multiple root.** If the curve only *touches* zero instead of crossing, then $f'(x^*) = 0$ and the derivation breaks down. For $f = x^2$ the step is $x_{k+1} = x_k/2$: linear with $C = \tfrac12$, no better than bisection.
- **A cycle.** For $f = x^3 - 2x + 2$ starting at $x_0 = 0$, Newton goes to 1, back to 0, and repeats forever.

None of these is exotic. The defense is the same for all three: bracket the root first, and refuse any Newton step that leaves the bracket.

::: key
Newton–Raphson: $x_{n+1} = x_n - \dfrac{f(x_n)}{f'(x_n)}$, converging quadratically near a simple root — the number of correct digits roughly doubles per iteration. The error obeys $e_{k+1} \approx \dfrac{|f''(x^*)|}{2|f'(x^*)|}\,e_k^2$. It needs $f'$, a good starting point, and a guard against $f' \approx 0$.
:::

::: example Kepler's equation for a Molniya-type orbit
A satellite is on an orbit with semi-major axis $a = 26{,}600\,\mathrm{km}$ (half the ellipse's long width) and eccentricity $e = 0.7$ (how stretched it is: $0$ is a circle) — a **[[Molniya-type orbit|molniya]]**. With $\mu = 398{,}600.4\,\mathrm{km^3/s^2}$:

- mean motion (the average turning rate) $n = \sqrt{\mu/a^3} = 1.455 \times 10^{-4}\,\mathrm{rad/s}$;
- period $2\pi/n \approx 11.99\,\mathrm{h}$.

About one hour after perigee ($t = 3{,}598\,\mathrm{s}$), the mean anomaly is $M = n t = 30.0^\circ = 0.523599\,\mathrm{rad}$. Find the eccentric anomaly $E$.

**Set up.** Solve $f(E) = E - e\sin E - M = 0$, with slope $f'(E) = 1 - e\cos E$. The converged root, to all sixteen digits, is $E^* = 1.1674164642219194\,\mathrm{rad} = 66.888^\circ$.

**Run Newton** from the obvious guess $E_0 = M$:

| $k$ | $E_k$ (rad) | $e_k = \lvert E_k - E^*\rvert$ |
| --- | --- | --- |
| 0 | 0.5235987756 | $6.44 \times 10^{-1}$ |
| 1 | 1.4124149399 | $2.45 \times 10^{-1}$ |
| 2 | 1.1903169669 | $2.29 \times 10^{-2}$ |
| 3 | 1.1676460416 | $2.30 \times 10^{-4}$ |
| 4 | 1.1674164876 | $2.34 \times 10^{-8}$ |
| 5 | 1.1674164642 | $2.2 \times 10^{-16}$ |

**Read the table.** The first step overshoots, from below the root to above it, because $M$ is far from $E^*$ and the tangent line is a poor guide there. From $k = 2$ on, the correct digits go 2, 4, 8, 16 — doubling.

**Check the constant.** $C = e\sin E^*/(2(1 - e\cos E^*)) = 0.4439$. Then $C e_3^2 = 0.4439 \times (2.30 \times 10^{-4})^2 = 2.34 \times 10^{-8}$, which matches $e_4$ to three digits. At $k = 5$ the error is one ulp of $E^*$. The next step reproduces the root exactly and nothing changes after that. Five Newton steps, five evaluations of $\sin$ and $\cos$.

**Now bisection** on $[0, \pi]$ for the same root, sampled ($k$ counts midpoints from 0; the width is that of the bracket whose midpoint it is):

| $k$ | midpoint (rad) | error | bracket width |
| --- | --- | --- | --- |
| 2 | 1.178097 | $1.07 \times 10^{-2}$ | 0.785 |
| 3 | 0.981748 | $1.86 \times 10^{-1}$ | 0.393 |
| 10 | 1.167359 | $5.71 \times 10^{-5}$ | $3.07 \times 10^{-3}$ |
| 20 | 1.167418 | $1.34 \times 10^{-6}$ | $3.00 \times 10^{-6}$ |
| 30 | 1.167416464 | $1.15 \times 10^{-10}$ | $2.93 \times 10^{-9}$ |
| 40 | 1.1674164642 | $1.14 \times 10^{-12}$ | $2.86 \times 10^{-12}$ |

Step 2 happened to land within $0.011$ of the root, and step 3 moved away again. The bracket, not the error, halves every time. Forty-two steps reach $10^{-12}$, as the formula predicted, against Newton's five.

**Finish the job.** The true anomaly — the actual angle from perigee, seen from Earth — follows from $\tan(\nu/2) = \sqrt{(1+e)/(1-e)}\,\tan(E^*/2)$, giving $\nu = 115.1^\circ$. The distance is $r = a(1 - e\cos E^*) = 19{,}291\,\mathrm{km}$. **Sanity check:** $r$ lies between perigee $a(1-e) = 7{,}980\,\mathrm{km}$ and apogee $a(1+e) = 45{,}220\,\mathrm{km}$, as it must.
:::

## The secant method

Newton needs $f'$. Sometimes the derivative is not available, or costs too much, or was written by someone you do not trust. Then estimate the slope from the last two guesses — "rise over run" between two points on the curve:

$$
f'(x_k) \approx \frac{f(x_k) - f(x_{k-1})}{x_k - x_{k-1}}, \qquad
x_{k+1} = x_k - f(x_k)\,\frac{x_k - x_{k-1}}{f(x_k) - f(x_{k-1})} .
$$

In the picture, the tangent line becomes a **secant line** — a line through two points of the curve. Each step costs one new evaluation of $f$ and no derivative.

The price is a lower order. The slope estimate carries its own error, proportional to the older error $e_{k-1}$. The analysis mirrors Newton's and gives

$$
e_{k+1} \approx \frac{|f''(x^*)|}{2|f'(x^*)|}\,e_k\,e_{k-1} .
$$

::: note Why the order is the golden ratio
Suppose $e_{k+1} \approx C' e_k^{\,p}$ for some order $p$. The same rule one step earlier says $e_k \approx C' e_{k-1}^{\,p}$, so $e_{k-1} \approx (e_k/C')^{1/p}$. Put that into the secant law: the left side goes like $e_k^{\,p}$, and the right side like $e_k \cdot e_k^{1/p}$. The powers must match:

$$
p = 1 + \frac{1}{p} \quad\Longrightarrow\quad p^2 - p - 1 = 0 .
$$

The positive root is the **[[golden ratio|golden-ratio]]**, $p = (1 + \sqrt{5})/2 \approx 1.618$.
:::

Per *step*, Newton wins. Per *function evaluation* it is closer. Suppose $f'$ costs about as much as $f$. A Newton step costs two evaluations and squares the error, so per evaluation it raises the error to the power $\sqrt{2} \approx 1.414$. The secant method gets $1.618$ per evaluation. So when derivatives are expensive, the secant method is the faster of the two.

::: example Secant on the same Kepler problem
Start from two points, $x_0 = M = 0.5236$ and $x_1 = M + e = 1.2236$. (That pair is a common choice: for $0 < M < \pi$ the root always lies between them.) Iterate the secant formula:

| $k$ | $x_k$ (rad) | $e_k$ | $e_k / (e_{k-1} e_{k-2})$ |
| --- | --- | --- | --- |
| 1 | 1.2235987756 | $5.62 \times 10^{-2}$ | — |
| 2 | 1.1489672699 | $1.85 \times 10^{-2}$ | — |
| 3 | 1.1669616934 | $4.55 \times 10^{-4}$ | 0.439 |
| 4 | 1.1674202096 | $3.75 \times 10^{-6}$ | 0.446 |
| 5 | 1.1674164635 | $7.56 \times 10^{-10}$ | 0.444 |
| 6 | 1.1674164642 | $1.3 \times 10^{-15}$ | 0.470 |

**The last column** checks the error law. The predicted constant $|f''|/(2|f'|) = 0.444$ is the same one Newton had, and it holds from step 3 on.

**Digits gained** per step: 1, 2, 3, 6. They grow, as superlinear convergence should, but they do not double.

**Cost.** Six evaluations of $f$ reach round-off, against Newton's five evaluations of $f$ *and* five of $f'$. The last ratio is off because $e_6$ has hit the round-off floor and no longer measures the method.
:::

## Choosing the starting point

Newton is fast only if it starts close enough, and for Kepler's equation "close enough" depends on $e$.

The historical method is the **fixed-point iteration** $E_{k+1} = M + e\sin E_k$: plug the guess into the right side, get a new guess, repeat. It converges linearly with $C = e\cos E^*$. For the orbit above that is $0.275$, about 22 iterations to $10^{-12}$. For a very eccentric orbit near perigee it is close to 1, which means painfully slow.

Newton converges from $E_0 = M$ for modest $e$. The better guess $E_0 = M + e\sin M$ removes the overshoot; from it the same problem reaches $10^{-13}$ in four steps.

::: example A near-parabolic orbit and a bad first step
Take $e = 0.99$ and $M = 5^\circ = 0.08727\,\mathrm{rad}$. The root is $E^* = 0.79170\,\mathrm{rad} = 45.36^\circ$ — nine times the mean anomaly. Near perigee, a very eccentric orbit sweeps eccentric anomaly far faster than mean anomaly. Newton from $E_0 = M$:

| $k$ | $E_k$ (rad) | $e_k$ |
| --- | --- | --- |
| 0 | 0.0873 | $0.70$ |
| 1 | 6.35 | $5.6$ |
| 2 | $-488.4$ | $489$ |
| 3 | $-48.8$ | $49.6$ |
| 6 | 1.472 | $0.68$ |
| 9 | 0.79400 | $2.3 \times 10^{-3}$ |
| 11 | 0.791699202 | $4.3 \times 10^{-11}$ |

**Why step 1 goes wild.** At $E_0 = M$ the slope is $f' = 1 - 0.99\cos(0.087) = 0.0138$, and $f = -0.0863$. So the step is $-f/f' = 0.0863/0.0138 \approx 6.3\,\mathrm{rad}$. The tangent line is nearly flat and throws the guess past $2\pi$. From there, where $\cos E \approx 1$ again, the second step is about $-490\,\mathrm{rad}$.

**Why it recovers anyway.** Here $f' > 0$ everywhere, so $f$ only ever climbs and the root is the only one — there is nowhere else to go. But it takes eight wasted steps.

**A better start.** From $E_0 = \pi$, where $f' = 1 + e$ is as large as it gets, the errors fall steadily: $2.35$, $0.82$, $0.30$, $0.070$, $5.0 \times 10^{-3}$, $2.9 \times 10^{-5}$, $9.7 \times 10^{-10}$, then exact — seven steps. Flight-quality Kepler solvers use $E_0 = M + e\sin M$ for $e$ below about $0.8$, and $E_0 = \pi$ above it.
:::

::: warning A Newton loop can hang
A Newton solver without a bracket and an iteration cap is a hang waiting to happen. Two failures cause it. A near-zero derivative flings the guess away. Or the tolerance is below the round-off floor, so $|x_{k+1} - x_k|$ never gets small enough. Both give an endless loop, and both have happened in flight software. Bracket the root. Replace any step that leaves the bracket with a bisection step. Cap the iterations (twenty is generous for Newton). Set the tolerance to a few ulps of the expected root, not to zero.
:::

## Systems of equations

Everything above extends to $n$ equations in $n$ unknowns, $\mathbf{f}(\mathbf{x}) = \mathbf{0}$ (bold letters are vectors). That is how a targeting problem (find the burn that reaches a given state) or a trim problem (find the controls that zero the accelerations) is set up.

The straight-line model becomes $\mathbf{f}(\mathbf{x}_k + \boldsymbol{\delta}) \approx \mathbf{f}(\mathbf{x}_k) + \mathbf{J}(\mathbf{x}_k)\,\boldsymbol{\delta}$. Here $\mathbf{J}$ is the **[[Jacobian|jacobian]]** matrix, $J_{ij} = \partial f_i/\partial x_j$: row $i$, column $j$ holds how fast equation $i$ changes when unknown $j$ moves. The Newton step solves a linear system:

$$
\mathbf{J}(\mathbf{x}_k)\,\boldsymbol{\delta}_k = -\mathbf{f}(\mathbf{x}_k), \qquad \mathbf{x}_{k+1} = \mathbf{x}_k + \boldsymbol{\delta}_k .
$$

Never invert $\mathbf{J}$. Solve the system instead, for reasons the linear-solves lesson explains. Convergence is again quadratic near a root where $\mathbf{J}$ is **nonsingular** (has an inverse). Two later lessons feed this: the complex-step lesson gives you a Jacobian accurate to machine precision, and the conditioning lesson tells you when the solve for $\boldsymbol{\delta}_k$ can be trusted.

Bracketing has no equivalent in more than one dimension. So multidimensional Newton always comes with a step-length control — a **line search** or **trust region**, from the optimization module — that shortens $\boldsymbol{\delta}_k$ whenever the full step fails to shrink $\|\mathbf{f}\|$, the length of the residual vector.

::: note Read the convergence table, not the answer
The test of a root finder is its table of errors, not its final answer. List $e_k$ against $k$ (or $|x_{k+1} - x_k|$ when the root is unknown) and read off the order. A steady ratio $e_{k+1}/e_k$ means linear. A steady $e_{k+1}/e_k^2$ means quadratic. A Newton code that shows linear convergence has a wrong derivative or a multiple root, and either is worth knowing.
:::

## Check yourself

::: check
Newton's iteration for $\sqrt{a}$ is $x_{k+1} = \tfrac12(x_k + a/x_k)$. Derive it, then run it for $a = 2$ from $x_0 = 1$ and identify the order from the errors.
:::

::: answer
The square root of $a$ is the positive root of $f(x) = x^2 - a$, with $f' = 2x$. Newton gives

$$
x_{k+1} = x_k - \frac{x_k^2 - a}{2x_k} = \frac{2x_k^2 - x_k^2 + a}{2x_k} = \frac12\left(x_k + \frac{a}{x_k}\right).
$$

From $x_0 = 1$: $1.5$, $1.416667$, $1.4142157$, $1.41421356237469$, $1.414213562373095$. The errors against $\sqrt{2}$ are $8.6 \times 10^{-2}$, $2.5 \times 10^{-3}$, $2.1 \times 10^{-6}$, $1.6 \times 10^{-12}$, $2.2 \times 10^{-16}$ — the last one a single ulp, the round-off floor. Correct digits: 1, 3, 6, 12, 16. They double until they hit the 53-bit limit, so the order is quadratic. The constant $|f''|/(2|f'|) = 2/(4\sqrt 2) = 0.354$ predicts $e_4 \approx 0.354 \times (2.1 \times 10^{-6})^2 = 1.6 \times 10^{-12}$, as observed.
:::

::: check
A re-entry simulation gives altitude as a function of time only by integrating a full trajectory, which is expensive and has no formula for its derivative. You must find when the vehicle passes $80\,\mathrm{km}$ to within $1\,\mathrm{ms}$, knowing it happens between $t = 400$ and $t = 500\,\mathrm{s}$. Which method, and roughly how many trajectory runs?
:::

::: answer
There is no derivative, so the choice is bisection or secant. Bisection needs $\lceil \log_2(100/0.001) \rceil = \lceil 16.6 \rceil = 17$ runs, guaranteed. The secant method, started from the two ends of the bracket, typically needs five to seven runs for a smooth function, but is not guaranteed.

The right engineering answer is the hybrid: take secant steps (or use the closely related **[[Brent method|brent]]**), and fall back to a bisection step whenever a guess would leave the current bracket. Expect six or seven runs, with seventeen as the worst case.
:::

::: check
Newton's method on $f(x) = (x - 1)^2$ from $x_0 = 2$ gives the errors $1, 0.5, 0.25, 0.125, \ldots$. Explain why the convergence is linear, and state its constant.
:::

::: answer
The root $x^* = 1$ is a **double root**: the curve touches zero without crossing, so $f'(x^*) = 0$. The quadratic derivation divides by $f'(x^*)$, so it does not apply.

Work it out directly: $x_{k+1} = x_k - (x_k - 1)^2/(2(x_k - 1)) = x_k - (x_k - 1)/2$. So $e_{k+1} = e_k/2$: linear with $C = \tfrac12$, one bit per step, the same rate as bisection. In general a root of multiplicity $m$ gives Newton a linear rate $C = 1 - 1/m$. If $m$ is known, the modified step $x_{k+1} = x_k - m f/f'$ restores quadratic convergence.
:::

::: check
For an orbit with $e = 0.3$, someone proposes the fixed-point iteration $E_{k+1} = M + e\sin E_k$ instead of Newton, to save the cosine. Estimate the worst-case number of iterations to reach $10^{-12}$ from an initial error of $1\,\mathrm{rad}$, and compare with Newton.
:::

::: answer
The fixed-point map $g(E) = M + e\sin E$ has slope $g'(E) = e\cos E$. So the error shrinks by $C = e|\cos E^*| \le 0.3$ per step; take the worst case, $C = 0.3$. Steps needed: $\log(10^{-12})/\log(0.3) = 22.9$, so 23 iterations, each with one sine.

Newton from $E_0 = M + e\sin M$ at this eccentricity reaches $10^{-12}$ in about three steps, each with a sine and a cosine: six trig evaluations against 23. Newton is cheaper even counting the derivative. At higher $e$ the gap widens, because the fixed-point rate $e$ approaches 1.
:::

::: check
You are given a Newton code for Kepler's equation, and its error table reads $10^{-1}, 10^{-2}, 10^{-3}, 10^{-4}, \ldots$. What is the most likely bug?
:::

::: answer
Errors falling by a steady factor of ten are linear convergence, not the quadratic convergence Newton must show at a simple root. Kepler's equation has only simple roots for $e < 1$, because $f' = 1 - e\cos E > 0$. So a multiple root is ruled out.

What remains is a wrong derivative. A step $-f/g$ with $g \ne f'$ converges linearly with $C = |1 - f'/g|$, here about 0.1. A sign error such as $f' = 1 + e\cos E$, or a missing factor, is the usual culprit. The error table found a bug that the final answer — correct, after enough iterations — would have hidden.
:::

## Summary

| Item | Statement |
| --- | --- |
| Convergence order | $e_{k+1} \approx C e_k^{\,p}$; digits per step fixed ($p = 1$), growing ($1 < p < 2$), doubling ($p = 2$) |
| Bisection | Halve a bracket with a sign change; $p = 1$, $C = \tfrac12$; steps $= \lceil \log_2((b-a)/\tau) \rceil$; cannot fail |
| Newton–Raphson | $x_{n+1} = x_n - f(x_n)/f'(x_n)$; $p = 2$ with $C = \lvert f''\rvert/(2\lvert f'\rvert)$ near a simple root |
| Secant | Replace $f'$ by $\dfrac{f(x_k) - f(x_{k-1})}{x_k - x_{k-1}}$; $p = (1 + \sqrt5)/2 \approx 1.618$; no derivative |
| Fixed point $x = g(x)$ | Linear with $C = \lvert g'(x^*)\rvert$; Kepler: $C = e\cos E^*$ |
| Kepler's equation | $f(E) = E - e\sin E - M$, $f' = 1 - e\cos E$; start $E_0 = M + e\sin M$, or $\pi$ for $e \gtrsim 0.8$ |
| Stopping | Test the step $\lvert x_{k+1} - x_k\rvert$ against $\text{atol} + \text{rtol}\lvert x\rvert$; never below a few ulps; always cap iterations |
| Systems | Solve $\mathbf{J}\boldsymbol{\delta} = -\mathbf{f}$, then $\mathbf{x} \leftarrow \mathbf{x} + \boldsymbol{\delta}$; pair with a line search |

The next lesson turns from solving for a number to solving for a whole function: stepping $\dot{\mathbf{y}} = \mathbf{f}(t, \mathbf{y})$ forward in time. The same Taylor-series bookkeeping decides how far a single step can be trusted.

::: context kepler-geometry What M and E measure
Draw the orbit's ellipse, and around it a circle with radius $a$ sharing its center. Earth sits at a focus F, not the center. From the satellite P, go straight up to the circle at Q. The angle at the center from perigee to Q is the **eccentric anomaly** $E$. The **mean anomaly** $M$ is not a drawn angle: it grows at a steady rate, $M = nt$, like the hand of a clock. Kepler's equation links the steady clock to the real position. Here $e = 0.7$ and $E = 66.9^\circ$, as in the worked example.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <circle cx="130" cy="112" r="100" fill="none" stroke="#8fb8f0" stroke-width="1.5"/>
  <ellipse cx="130" cy="112" rx="100" ry="71.4" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <line x1="20" y1="112" x2="250" y2="112" stroke="#6c7a93" stroke-width="1"/>
  <line x1="130" y1="112" x2="169.3" y2="20.0" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="169.3" y1="20.0" x2="169.3" y2="112" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
  <line x1="200" y1="112" x2="169.3" y2="46.3" stroke="#b4232c" stroke-width="1.5"/>
  <path d="M152,112 A22,22 0 0,0 138.6,91.8" fill="none" stroke="#1d6fd1" stroke-width="1.5"/>
  <circle cx="130" cy="112" r="2.5" fill="#1f2a44"/>
  <circle cx="200" cy="112" r="4" fill="#1d6fd1"/>
  <circle cx="169.3" cy="46.3" r="4" fill="#b4232c"/>
  <circle cx="169.3" cy="20.0" r="3" fill="#1d6fd1"/>
  <g font-size="12" fill="#1f2a44">
    <text x="116" y="128">center</text><text x="196" y="130">F</text>
    <text x="177" y="50">P</text><text x="176" y="20">Q</text>
    <text x="156" y="102" fill="#1d6fd1">E</text><text x="232" y="106">perigee</text>
  </g>
  <text x="268" y="170" font-size="11" fill="#6c7a93">circle: radius a</text>
  <text x="268" y="186" font-size="11" fill="#1f2a44">ellipse: the orbit</text>
  <text x="268" y="202" font-size="11" fill="#b4232c">F to P: distance r</text>
</svg>
```
:::

::: context simple-root Crossing versus touching
A **simple root** is where the graph cuts through zero at a slant, like a road crossing a river on a bridge. A **multiple root** is where the graph only touches zero and turns back, like $y = (x-1)^2$ at $x = 1$. At a touching root the slope is zero, so a small residual says almost nothing about how far you are from the root, and methods that rely on the slope slow down badly.
:::

::: context perigee Near and far from Earth
**Perigee** is the point of an orbit closest to Earth; **apogee** is the farthest. The words come from Greek: *peri* means "near", *apo* means "away from", and *gee* comes from *gē*, "Earth". Around other bodies the ending changes — perihelion and aphelion for the Sun. A satellite moves fastest at perigee, which is why every quantity in Kepler's equation changes most quickly there.
:::

::: context intermediate-value Why a sign change guarantees a root
If you walk from a valley floor below sea level to a hilltop above it, without ever jumping, you must at some moment be exactly at sea level. That is the intermediate value theorem. It needs the function to be **continuous** — no jumps. A function like $1/x$ changes sign between $-1$ and $1$ with no root at all, because it jumps at $x = 0$. So bisection's guarantee is only as good as the continuity of $f$ inside the bracket.
:::

::: context bisection-bars The bracket halving on Kepler's equation
The first five brackets of bisection on $[0, \pi]$ for the worked example. Each bar is the bracket, each dot its midpoint, and the red line is the root $E^* = 1.167$. Every bar still holds the root, and each is half as long as the one above.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="141.5" y1="10" x2="141.5" y2="140" stroke="#b4232c" stroke-width="1.5"/>
  <g stroke="#1d6fd1" stroke-width="6" stroke-linecap="butt">
    <line x1="30" y1="22" x2="330" y2="22"/>
    <line x1="30" y1="46" x2="180" y2="46"/>
    <line x1="105" y1="70" x2="180" y2="70"/>
    <line x1="105" y1="94" x2="142.5" y2="94"/>
    <line x1="123.8" y1="118" x2="142.5" y2="118"/>
  </g>
  <g fill="#1f2a44">
    <circle cx="180" cy="22" r="3.5"/><circle cx="105" cy="46" r="3.5"/><circle cx="142.5" cy="70" r="3.5"/><circle cx="123.8" cy="94" r="3.5"/><circle cx="133.1" cy="118" r="3.5"/>
  </g>
  <line x1="30" y1="140" x2="330" y2="140" stroke="#1f2a44" stroke-width="1"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="30" y="156">0</text><text x="180" y="156">π/2</text><text x="330" y="156">π</text>
  </g>
  <text x="146" y="160" font-size="11" fill="#b4232c">root</text>
</svg>
```
:::

::: context newton-tangent The tangent step, drawn
The curve is $f(E) = E - 0.7\sin E - M$ with $M = 30^\circ$, from the worked example. Newton starts at $E_0 = M$ (where $f = -0.35$), follows the tangent line (dashed) down to zero, and lands at $E_1 = 1.412$ — past the root at $1.167$. That is the overshoot in the table. The method is named for Isaac Newton, who used it around 1669, and Joseph Raphson, who published a simpler version in 1690.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="117.1" x2="345" y2="117.1" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="40" y1="20" x2="40" y2="195" stroke="#1f2a44" stroke-width="1.2"/>
  <polyline fill="none" stroke="#1f2a44" stroke-width="2" points="40.0,180.7 50.0,178.5 60.0,176.3 70.0,174.1 80.0,171.8 90.0,169.4 100.0,167.0 110.0,164.4 120.0,161.7 130.0,158.9 140.0,155.9 150.0,152.7 160.0,149.3 170.0,145.8 180.0,142.0 190.0,138.0 200.0,133.8 210.0,129.3 220.0,124.5 230.0,119.5 240.0,114.2 250.0,108.7 260.0,102.8 270.0,96.6 280.0,90.1 290.0,83.4 300.0,76.3 310.0,68.9 320.0,61.2 330.0,53.2 340.0,44.9"/>
  <line x1="90.0" y1="170.3" x2="298.3" y2="110.6" stroke="#1d6fd1" stroke-width="1.5" stroke-dasharray="5 4"/>
  <line x1="127.3" y1="159.6" x2="127.3" y2="117.1" stroke="#6c7a93" stroke-width="1" stroke-dasharray="2 3"/>
  <circle cx="127.3" cy="159.6" r="4" fill="#1d6fd1"/>
  <circle cx="275.4" cy="117.1" r="4" fill="#1d6fd1"/>
  <circle cx="234.6" cy="117.1" r="4" fill="#b4232c"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="123.3" y="132">E₀</text><text x="279" y="132">E₁</text><text x="234.6" y="106" fill="#b4232c">root</text>
    <text x="40" y="208">0</text><text x="123.3" y="208">0.5</text><text x="206.7" y="208">1.0</text><text x="290" y="208">1.5 rad</text>
  </g>
  <text x="300" y="40" font-size="11" fill="#1f2a44">f(E)</text>
</svg>
```
:::

::: context molniya The Molniya orbit
Molniya means "lightning" in Russian. The Soviet Union launched communication satellites into these orbits from 1965 on. A Molniya orbit is tilted about $63.4^\circ$ to the equator, has a 12-hour period and an eccentricity near 0.7. The satellite swings quickly through perigee over the southern hemisphere, then hangs for hours near apogee high over Russia, where a satellite in a circular equatorial orbit would sit too low on the horizon to be useful. Its high eccentricity makes it a demanding test for a Kepler solver.
:::

::: context golden-ratio The same number as the sunflower
The golden ratio $\varphi$ ("phi") $= 1.618\ldots$ is the positive number that satisfies $\varphi^2 = \varphi + 1$. It is also the limit of the ratios of neighboring Fibonacci numbers ($1, 1, 2, 3, 5, 8, 13, \ldots$): $13/8 = 1.625$, $21/13 = 1.615$. That is no accident here. The secant error is roughly the product of the last two errors, so the number of correct digits behaves like the Fibonacci sequence: each new count is about the sum of the previous two.
:::

::: context brent Brent's method
Richard Brent published this hybrid in 1973. It keeps a bracket at all times like bisection, but tries faster steps first — the secant step, or a step through a curve fitted to the last three points — and falls back to bisection whenever the fast step misbehaves. It is guaranteed to converge and is usually nearly as fast as the secant method. In SciPy it is `scipy.optimize.brentq`, and it is the sensible default for a one-dimensional root with a known bracket.
:::

::: context jacobian A table of slopes
With one equation and one unknown, the slope $f'(x)$ tells you how $f$ changes when $x$ moves. With several equations and unknowns you need a slope for every pair: how much does equation $i$ change when unknown $j$ moves a little? Those numbers, arranged in rows and columns, form the Jacobian, named for the mathematician Carl Jacobi. Getting it right is most of the work in multidimensional Newton — which is why a later lesson teaches the complex-step trick for computing it to full precision.
:::
