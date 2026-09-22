---
id: l09-solving-kepler
title: Solving Kepler's equation robustly
minutes: 20
covers:
  - Kepler equation: elliptic, hyperbolic and parabolic (Barker)
---

Kepler's equation $M = E - e\sin E$ gives time from position in one line and position from time in no lines at all: there is no closed-form inverse. Every propagator therefore contains an iterative solver, and that solver will be called millions of times – once per time step per object in a catalogue, once per measurement in a filter, once per candidate trajectory in an optimiser. It must be fast, and it must never fail, because a single non-converged call buried in a Monte Carlo run poisons the statistics silently.

The standard method is Newton's, and for most orbits it converges in four or five iterations from the crudest starting guess. For highly eccentric orbits – comet-like trajectories, the transfer ellipses of some lunar missions, the $e = 0.99$ orbits used to test software – Newton's method from a bad start can take a hundred iterations or wander off entirely. The fixes are well understood: a better starting point, a bracketed fallback that cannot fail, or an iteration that is insensitive to where it starts. This lesson derives each, shows exactly how and why the naive method breaks, and does the same for the hyperbolic equation and for Barker's cubic, which has a closed-form solution.

The reader should have the three forms of Kepler's equation from the previous lesson and Newton's method from the numerical-methods module.

## The problem and its structure

Given $M$ (wrapped to $[0, 2\pi)$) and $e < 1$, find $E$ such that

$$
f(E) = E - e\sin E - M = 0 .
$$

Before iterating, establish that the root exists, is unique, and lies in a known interval. The derivative

$$
f'(E) = 1 - e\cos E \ge 1 - e > 0
$$

is strictly positive, so $f$ is strictly increasing and has exactly one root. Moreover $f(M) = -e\sin M$ and $f(M + e) = e - e\sin(M + e) \ge 0$; for $0 \le M \le \pi$, $\sin M \ge 0$ so $f(M) \le 0$ and the root lies in $[M, M + e]$. For $\pi \le M < 2\pi$ the same argument places it in $[M - e, M]$. Either way the root is within $e$ of $M$, and it certainly lies in $[0, 2\pi]$. These brackets are what make a fail-safe method possible.

The difficulty is entirely in the derivative's size. Near periapsis $\cos E \approx 1$ and $f' \approx 1 - e$, which for $e = 0.99$ is $0.01$: the function is nearly flat there, and a Newton step – which divides by $f'$ – can be a hundred times larger than the error it is trying to remove.

## Newton's method

Newton's iteration for $f(E) = 0$ is

$$
E_{k+1} = E_k - \frac{f(E_k)}{f'(E_k)} = E_k - \frac{E_k - e\sin E_k - M}{1 - e\cos E_k} .
$$

Near the root the error is squared at each step (quadratic convergence), so once the iterate is within, say, $0.1$ of the root, four more steps reach $10^{-12}$. The question is only how to get within $0.1$.

### Starting points

- $E_0 = M$. Since the root lies within $e$ of $M$, this is within $e$ of the answer, which is excellent for small $e$ and useless for $e \to 1$.
- $E_0 = M + e\sin M$. One step of the fixed-point iteration $E \leftarrow M + e\sin E$; better for moderate $e$.
- $E_0 = M + e$ for $M < \pi$, $E_0 = M - e$ for $M \ge \pi$ (Vallado's choice). This starts at the far end of the bracket, on the side where $f'$ is larger, so the first Newton step is conservative.
- $E_0 = \pi$ for $e > 0.8$. The derivative $f'(\pi) = 1 + e$ is the largest it can be anywhere, so the first step is *small* and moves toward the root from the flat side's opposite, and subsequent iterates approach monotonically.
- Danby's $E_0 = M + 0.85\,e\,\operatorname{sign}(\sin M)$, a compromise between the last two.

### How it fails at high eccentricity

::: example Newton from three starting points at e = 0.99
Take $e = 0.99$ and $M = 0.1\,\mathrm{rad}$ (a spacecraft just past periapsis on a very elongated orbit). The root is $E = 0.83166\,\mathrm{rad}$ – eight times the mean anomaly, because $E$ runs far ahead of $M$ near periapsis when $e$ is large.

From $E_0 = M = 0.1$: $f(0.1) = 0.1 - 0.99\sin 0.1 - 0.1 = -0.09884$ and $f'(0.1) = 1 - 0.99\cos 0.1 = 0.01495$. The Newton step is $+0.09884/0.01495 = +6.61$, so $E_1 = 6.71\,\mathrm{rad}$ – more than a full revolution past the root. The next iterates are $-55.3$, $26.4$, $-11.8$, $30.5$, and the iteration wanders for sixteen steps before landing, by luck, in the basin of the root and converging. Over a grid of $M$ values the worst case at $e = 0.99$ is $72$ iterations, and at $e = 0.999$ some starting values never converge within $200$.

From $E_0 = \pi$: $f'(\pi) = 1.99$, and the iterates are $3.1416 \to 1.6132 \to 1.1102 \to 0.8899 \to 0.8351 \to 0.83167 \to 0.831660424 \to 0.8316604238$, converged to $10^{-12}$ in eight steps, decreasing monotonically the whole way.

From $E_0 = M + e = 1.09$: $1.09 \to 0.8830 \to 0.8343 \to 0.831668 \to 0.8316604239$, six steps.

Over the same grid of $M$ values, the worst case for the $M \pm e$ starter is $7$ iterations at every eccentricity up to $0.999$, and for $E_0 = \pi$ it is $9$.
:::

The lesson is not that Newton's method is bad but that its first step must not be taken from the flat part of the curve. A good starting point fixes the practical problem. It does not, however, *prove* convergence, and production code wants a guarantee.

## Fallbacks that cannot fail

**Bisection.** The root is bracketed in $[0, 2\pi]$ (or more tightly in $[M, M + e]$), and $f$ changes sign across the bracket. Halving the bracket $43$ times reduces $2\pi$ below $10^{-12}$. Bisection is slow but its iteration count is fixed and known, and it needs no derivative.

**Safeguarded Newton.** Take the Newton step; if it would leave the current bracket, take a bisection step instead; update the bracket from the sign of $f$ at the new point. This keeps Newton's speed wherever Newton works and bisection's guarantee everywhere else. It is the pattern behind most library root-finders.

**Laguerre–Conway.** Conway observed that Laguerre's method for polynomial roots, applied to Kepler's equation as if it were a polynomial of degree $n$, converges from essentially any starting point:

$$
E_{k+1} = E_k - \frac{n\,f}{f' \pm \sqrt{\left\lvert (n - 1)^2 f'^2 - n(n - 1)\,f f'' \right\rvert}}, \qquad f'' = e\sin E,
$$

with the sign chosen to match the sign of $f'$ (so the denominator is as large as possible) and $n = 5$ a customary choice. Compared with Newton, the denominator is inflated by a term involving the curvature $f''$, which is exactly what damps the step where $f'$ is small. Convergence is cubic near the root.

::: example Laguerre–Conway from anywhere
For the same $e = 0.99$, $M = 0.1$ case, Laguerre–Conway with $n = 5$ converges to $E = 0.8316604238$ in $5$ iterations from $E_0 = 0.1$, in $5$ from $E_0 = \pi$, and in $4$ from $E_0 = 6.0$. Over the grid of $M$ values and $e \in \{0.9, 0.99, 0.999\}$, started from the naive $E_0 = M$ every time, the worst case is $5$ iterations. That insensitivity to the start is why it appears in production propagators.
:::

::: key A robust Kepler solver
Newton's iteration $E \leftarrow E - (E - e\sin E - M)/(1 - e\cos E)$ converges in a handful of steps from a good start: $E_0 = M \pm e$, or $E_0 = \pi$ when $e > 0.8$. Guarantee it with a bracket ($E$ lies within $e$ of $M$, inside $[0, 2\pi]$) and a bisection fallback, or use the Laguerre–Conway iteration, which converges from almost any starting point. Test convergence on the residual $\lvert f(E) \rvert$ as well as the step.
:::

## The hyperbolic equation

For $e > 1$, solve

$$
g(H) = e\sinh H - H - M_h = 0, \qquad g'(H) = e\cosh H - 1 \ge e - 1 > 0 .
$$

Again $g$ is strictly increasing, so the root is unique; and $g''(H) = e\sinh H$ has the sign of $H$, so $g$ is convex for $H > 0$ (where the root lies when $M_h > 0$). For a convex increasing function Newton's method behaves beautifully: from any start to the right of the root the iterates decrease monotonically to it, and from any start to the left the first step overshoots to the right and the same monotone convergence follows. The only danger is a first step so large that $\sinh$ overflows, which a sensible starting point avoids.

For small $M_h$ the root is near $M_h/(e - 1)$ (linearise $\sinh$); for large $M_h$ it is near $\operatorname{arsinh}(M_h/e)$ (drop the $-H$). The second works acceptably everywhere: it never overflows, and the iteration recovers from its being too small at low $M_h$ within a step or two. Newton from $H_0 = \operatorname{arsinh}(M_h/e)$ converges to $10^{-12}$ in at most $8$ iterations for $e$ from $1.2$ to $5$ and $M_h$ from $0.1$ to $10$; from $H_0 = M_h/(e - 1)$ it takes up to $53$ at $e = 1.2$, $M_h = 10$, because the linearised guess is then absurdly large.

::: example Newton on the hyperbolic equation
$e = 2$, $M_h = 1$. Start at $H_0 = \operatorname{arsinh}(0.5) = 0.48121$. Iterates: $0.87052$, $0.81579$, $0.81410$, $0.8140968$, $0.8140967963$ – five steps, the first overshooting to the right and the rest descending monotonically, as the convexity argument predicts. The true anomaly follows from $\tan(\nu/2) = \sqrt{3}\tanh(0.40705) = 0.66851$, so $\nu = 67.5^\circ$. The residual $e\sinh H - H - M_h$ at the end is $2 \times 10^{-16}$.
:::

## Barker's equation in closed form

The parabolic case is the easy one. Writing $\tau = \tan(\nu/2)$ and $B = \sqrt{\mu/p^3}\,(t - t_p)$, Barker's equation is

$$
\tfrac{1}{6}\tau^3 + \tfrac{1}{2}\tau - B = 0 \quad\Longleftrightarrow\quad \tau^3 + 3\tau - 6B = 0 .
$$

This is a depressed cubic $\tau^3 + p_c\tau + q_c = 0$ with $p_c = 3 > 0$, so its discriminant is positive and it has exactly one real root, given by Cardano's formula

$$
\tau = \sqrt[3]{3B + \sqrt{9B^2 + 1}} + \sqrt[3]{3B - \sqrt{9B^2 + 1}} .
$$

The second cube root is of a negative number and is the negative real cube root. The two cube roots multiply to $\sqrt[3]{9B^2 - (9B^2 + 1)} = -1$, so with $A = \sqrt[3]{3B + \sqrt{9B^2 + 1}}$ the formula collapses to

$$
\tau = A - \frac{1}{A},
$$

which also avoids the cancellation between two nearly equal cube roots when $B$ is small. Then $\nu = 2\arctan\tau$ and $r = \tfrac{p}{2}(1 + \tau^2)$.

::: example One hour after periapsis on a parabola
For the parabola with $p = 13\,356.27\,\mathrm{km}$, $\sqrt{\mu/p^3} = 4.0902 \times 10^{-4}\,\mathrm{s^{-1}}$ and after $t - t_p = 3600\,\mathrm{s}$, $B = 1.47246$. Then $9B^2 + 1 = 20.513$, $\sqrt{20.513} = 4.5292$, $3B = 4.4174$, $A = \sqrt[3]{8.9466} = 2.07596$, and
$$
\tau = 2.07596 - \frac{1}{2.07596} = 1.59425 .
$$
Check: $\tfrac{1}{2}(1.59425) + \tfrac{1}{6}(1.59425)^3 = 0.79713 + 0.67533 = 1.47246 = B$. The true anomaly is $\nu = 2\arctan 1.59425 = 115.8^\circ$ and the radius $r = 6678.14\,(1 + 2.54163) = 23\,652\,\mathrm{km}$. No iteration was needed.
:::

## Near the parabola

Both the elliptic and hyperbolic forms become ill-conditioned as $e \to 1$ for a different reason than the flat-derivative problem. Near periapsis on a near-parabolic orbit, $E$ is small and $M = E - e\sin E \approx (1 - e)E + E^3/6$ is the difference of two nearly equal quantities: for $e = 0.9999$ and $E = 0.01$, the two terms are $0.01$ and $0.0099993$ and their difference has lost four significant figures. The same happens with $e\sinh H - H$. Solvers still converge, but the anomaly they return carries the round-off. The cure is not a better iteration but a better variable – the universal anomaly of the lesson after next, which treats $e = 0.999$, $1$ and $1.001$ with one formula and no cancellation.

## A solver in code

```python
import math

def solve_kepler(M, e, tol=1e-12, max_iter=50):
    """Elliptic Kepler equation: return E with E - e sin E = M (radians)."""
    M = M % (2 * math.pi)
    E = math.pi if e > 0.8 else (M + e if M < math.pi else M - e)
    lo, hi = 0.0, 2 * math.pi                     # bracket for the fallback
    for _ in range(max_iter):
        f = E - e * math.sin(E) - M
        if f > 0: hi = E
        else: lo = E
        step = f / (1 - e * math.cos(E))
        E_new = E - step
        if not (lo < E_new < hi):                 # Newton left the bracket
            E_new = 0.5 * (lo + hi)               # bisect instead
        if abs(E_new - E) < tol and abs(f) < tol:
            return E_new
        E = E_new
    raise RuntimeError("Kepler solver did not converge")

print(solve_kepler(0.1, 0.99))   # 0.8316604237910568
```

Twelve lines, two guards, and it has never been observed to fail. The exercise for this module asks you to build this and its hyperbolic sibling, and to plot iteration counts against $e$ for each starting-point strategy – do it; the plot makes the flat-derivative failure unforgettable.

::: warning Loosening the tolerance is not a fix
If the solver "fails to converge" at $e = 0.995$, relaxing the tolerance from $10^{-12}$ to $10^{-6}$ will make the failure message go away and leave you with an anomaly that is wrong by whatever the last wild Newton step happened to be. Divergence is a starting-point problem, not a precision problem, and double-double arithmetic would not help either. Fix the start or add the bracket.
:::

::: warning Wrap M first, and use the right equation
Reduce $M$ to $[0, 2\pi)$ (or $[-\pi, \pi]$) before solving; a mean anomaly of $250$ radians makes every starting-point rule meaningless. And check $e$: an elliptical orbit with $e = 0.995$ is still elliptical, and the hyperbolic form $M_h = e\sinh H - H$ has nothing to say about it.
:::

## Check yourself

::: check
Show that Kepler's equation has exactly one solution $E$ for any $M$ and any $0 \le e < 1$, and that it lies within $e$ of $M$.
:::

::: answer
$f(E) = E - e\sin E - M$ has derivative $1 - e\cos E \ge 1 - e > 0$, so it is strictly increasing and crosses zero at most once; since $f \to \mp\infty$ as $E \to \mp\infty$ it crosses at least once. At the root, $E - M = e\sin E$, and $\lvert e\sin E \rvert \le e$, so $\lvert E - M \rvert \le e$.
:::

::: check
For $e = 0.95$ and $M = 0.05\,\mathrm{rad}$, compute the first Newton step from $E_0 = M$ and from $E_0 = \pi$, and comment.
:::

::: answer
From $E_0 = 0.05$: $f = 0.05 - 0.95\sin 0.05 - 0.05 = -0.04748$, $f' = 1 - 0.95\cos 0.05 = 0.05119$, step $= +0.9276$, so $E_1 = 0.978$. From $E_0 = \pi$: $f = \pi - 0 - 0.05 = 3.0916$, $f' = 1.95$, step $= -1.5854$, so $E_1 = 1.556$. The true root is $0.531$. The start at $M$ overshoots it by $0.45$ but lands where $f'$ is healthy and converges from there; the start at $\pi$ takes a controlled step and descends monotonically. At $e = 0.99$ the same calculation from $M$ gives a step of $6.6$ – the flat region has widened and the luck runs out.
:::

::: check
Why does Newton's method on the hyperbolic equation converge monotonically once the iterate is to the right of the root?
:::

::: answer
For $H > 0$, $g(H) = e\sinh H - H - M_h$ is increasing ($g' > 0$) and convex ($g'' = e\sinh H > 0$). The tangent line at a point to the right of the root lies below the curve, so it crosses zero between the root and the current point: the Newton iterate moves toward the root but never past it. Each step therefore lands closer, on the same side, and the sequence decreases monotonically to the root.
:::

::: check
A parabolic trajectory has $p = 20\,000\,\mathrm{km}$. Find the true anomaly $2$ hours after periapsis.
:::

::: answer
$\sqrt{\mu/p^3} = \sqrt{398\,600.4418/8 \times 10^{12}} = 2.2321 \times 10^{-4}\,\mathrm{s^{-1}}$, so $B = 2.2321 \times 10^{-4} \times 7200 = 1.6071$. Then $9B^2 + 1 = 24.245$, $\sqrt{24.245} = 4.9240$, $3B = 4.8214$, $A = \sqrt[3]{9.7454} = 2.1360$, $\tau = 2.1360 - 0.4682 = 1.6678$, and $\nu = 2\arctan 1.6678 = 118.1^\circ$. Check: $0.8339 + 0.7732 = 1.6071 = B$. The radius is $10\,000\,(1 + 2.7817) = 37\,817\,\mathrm{km}$.
:::

::: check
Your Monte Carlo run of ten thousand propagations at $e = 0.98$ produces three wildly wrong final states and no error messages. What is the most likely cause and how do you find it?
:::

::: answer
A Kepler solver that stopped at its iteration limit without converging and returned its last iterate without complaint. Most likely it uses Newton from $E_0 = M$ with no bracket, and three of the ten thousand mean anomalies fell in the flat region near periapsis where the first step is enormous. Find it by asserting on the residual $\lvert E - e\sin E - M \rvert$ at exit and raising an error instead of returning; then fix it with a better start ($\pi$ or $M \pm e$) and a bisection or Laguerre–Conway fallback.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $f(E) = E - e\sin E - M$, $f' = 1 - e\cos E \ge 1 - e$ | Monotone; unique root within $e$ of $M$ |
| $E_{k+1} = E_k - f/f'$ | Newton's method, quadratic convergence near the root |
| $E_0 = M \pm e$, or $\pi$ if $e > 0.8$ | Starting points that avoid the flat region near periapsis |
| Bracket $[M, M + e]$ or $[0, 2\pi]$ | Basis for bisection ($43$ steps to $10^{-12}$) or safeguarded Newton |
| Laguerre–Conway, $n = 5$ | $E \leftarrow E - nf/\big(f' \pm \sqrt{\lvert (n-1)^2 f'^2 - n(n-1) f f'' \rvert}\big)$; converges from almost anywhere |
| $g(H) = e\sinh H - H - M_h$ | Hyperbolic form; convex, Newton from $H_0 = \operatorname{arsinh}(M_h/e)$ |
| $\tau = A - 1/A$, $A = \sqrt[3]{3B + \sqrt{9B^2 + 1}}$ | Closed-form Barker solution, $B = \sqrt{\mu/p^3}(t - t_p)$, $\tau = \tan(\nu/2)$ |
| Ill-conditioning as $e \to 1$ | Cancellation in $E - e\sin E$; cured by universal variables |

With the anomaly recoverable from time, the next lesson computes times of flight between two points on any conic and propagates a state analytically – then checks the result against a numerical integration.
