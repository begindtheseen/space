---
id: l09-solving-kepler
title: Solving Kepler's equation robustly
minutes: 22
covers:
  - Kepler equation: elliptic, hyperbolic and parabolic (Barker)
---

Kepler's equation, $M = E - e\sin E$, works beautifully in one direction. Give it the eccentric anomaly $E$ and it hands back the mean anomaly $M$ – the time – in one line. Ask the reverse – *here is the time, where is the spacecraft?* – and there is no formula at all. You have to search for the answer.

That search sits inside every orbit propagator, and it gets called millions of times: once per time step for every object in a catalogue, once per measurement in a navigation filter, once per candidate path in a trajectory optimizer. So it must be fast. And it must never fail, because one silent failure buried in a [[Monte Carlo run|monte-carlo]] quietly poisons the statistics.

The standard tool is Newton's method. For most orbits it lands in four or five tries even from a crude first guess. For very stretched orbits – comet-like paths, some lunar transfer ellipses, the $e = 0.99$ test orbits used to break software – Newton's method from a bad start can take a hundred tries or wander off entirely. The fixes are well understood: a better starting point, a fallback that cannot fail, or a method that does not care where it starts. This lesson derives each one, shows exactly how and why the naive method breaks, and does the same for the hyperbolic equation and for Barker's cubic, which can be solved exactly.

You will need the three forms of Kepler's equation from the last lesson, and Newton's method from the numerical-methods module.

## The problem and its structure

Here is the job. Given $M$ (wrapped into $[0, 2\pi)$) and $e < 1$, find the $E$ that makes

$$
f(E) = E - e\sin E - M = 0 .
$$

Before hunting for the answer, make sure there is exactly one, and fence in where it is. Think of a game of "warmer, colder": it only works if the prize exists and you know which room it is in.

The slope of $f$ is

$$
f'(E) = 1 - e\cos E \ge 1 - e > 0 .
$$

($f'$, read "f-prime", is the derivative – how steeply $f$ climbs.) The slope is always positive, so $f$ only ever goes uphill. A function that only goes uphill crosses zero exactly once. So the answer exists, and it is unique.

Now fence it in. At $E = M$, $f(M) = -e\sin M$. At $E = M + e$, $f(M + e) = e - e\sin(M + e) \ge 0$, since a sine is never more than $1$. For $0 \le M \le \pi$, $\sin M \ge 0$, so $f(M) \le 0$. The function is at or below zero at $M$ and at or above zero at $M + e$, so the root lies in $[M, M + e]$. For $\pi \le M < 2\pi$ the same argument puts it in $[M - e, M]$.

Either way, **the root is within $e$ of $M$**, and it certainly lies in $[0, 2\pi]$. Such a fence is called a **bracket**, and it is what makes a fail-safe method possible.

The whole difficulty is the *size* of that slope. Near periapsis, $\cos E \approx 1$ and $f' \approx 1 - e$. For $e = 0.99$ that is $0.01$: the curve is almost flat. A Newton step divides by $f'$, so from there a step can be a hundred times bigger than the error it is trying to fix.

## Newton's method

Newton's idea: stand at your current guess, lay a ruler along the curve's slope, and slide down the ruler to where it crosses zero. That crossing is your next guess. In symbols,

$$
E_{k+1} = E_k - \frac{f(E_k)}{f'(E_k)} = E_k - \frac{E_k - e\sin E_k - M}{1 - e\cos E_k} .
$$

Here $E_k$ is the guess after $k$ steps. Near the root, the error is roughly squared at each step – **[[quadratic convergence|quadratic-convergence]]** – so the number of correct digits about doubles every time. Once a guess is within, say, $0.1$ of the root, four more steps reach $10^{-12}$. The only real question is how to get within $0.1$.

### Starting points

- $E_0 = M$. The root is within $e$ of $M$, so this is excellent for small $e$ and useless as $e \to 1$.
- $E_0 = M + e\sin M$. One step of the simpler iteration $E \leftarrow M + e\sin E$; better for moderate $e$.
- $E_0 = M + e$ for $M < \pi$, and $E_0 = M - e$ for $M \ge \pi$ (Vallado's choice). This starts at the far end of the bracket, where the slope is larger, so the first Newton step is a careful one.
- $E_0 = \pi$ when $e > 0.8$. The slope there, $f'(\pi) = 1 + e$, is the largest it gets anywhere. So the first step is *small*, and it moves toward the root from the steep side, away from the flat part. After that the guesses approach steadily from one side.
- Danby's $E_0 = M + 0.85\,e\,\operatorname{sign}(\sin M)$, a compromise between the last two. ($\operatorname{sign}$ is $+1$ for a positive number and $-1$ for a negative one.)

### How it fails at high eccentricity

::: example Newton from three starting points at e = 0.99
Take $e = 0.99$ and $M = 0.1\,\mathrm{rad}$: a spacecraft a little past periapsis on a very stretched orbit. The root is $E = 0.83166\,\mathrm{rad}$ – eight times the mean anomaly, because near periapsis $E$ runs far ahead of $M$ when $e$ is large.

**From $E_0 = M = 0.1$.** The value is $f(0.1) = 0.1 - 0.99\sin 0.1 - 0.1 = -0.09884$. The slope is $f'(0.1) = 1 - 0.99\cos 0.1 = 0.01495$ – nearly flat. The step is $+0.09884/0.01495 = +6.61$, so $E_1 = 6.71\,\mathrm{rad}$: more than a full turn past the root. The next guesses are $-55.3$, $26.4$, $-11.8$, $30.5$, and the iteration [[wanders for sixteen steps|newton-tangent]] before it happens to land near the root and converge.

**From $E_0 = \pi$.** The slope is $f'(\pi) = 1.99$. The guesses are $3.1416 \to 1.6132 \to 1.1102 \to 0.8899 \to 0.8351 \to 0.83167 \to 0.831660424 \to 0.8316604238$ – converged to $10^{-12}$ in eight steps, getting smaller every time.

**From $E_0 = M + e = 1.09$.** The guesses are $1.09 \to 0.8830 \to 0.8343 \to 0.831668 \to 0.8316604239$, converged in six steps.

**Over a whole grid.** Try $360$ mean anomalies, one in the middle of each degree ($0.5^\circ, 1.5^\circ, \ldots, 359.5^\circ$). From $E_0 = M$ at $e = 0.99$, the worst converging case takes $177$ steps and one never converges within $200$; at $e = 0.999$, two never converge within $200$. From $E_0 = M \pm e$, no case needs more than $8$ steps at any eccentricity up to $0.999$. From $E_0 = \pi$, none needs more than $10$.
:::

The lesson is not that Newton's method is bad. It is that the first step must not be taken from the flat part of the curve. A good starting point fixes the practical problem. It does not, however, *prove* the method will always converge, and production code wants a guarantee.

## Fallbacks that cannot fail

**Bisection.** Play "higher or lower". The root is bracketed in $[0, 2\pi]$ (or more tightly in $[M, M + e]$), and $f$ has opposite signs at the two ends. Check the middle. Keep whichever half still has a sign change. Repeat. Each step [[halves the bracket|bisection]], so $43$ halvings shrink $2\pi$ below $10^{-12}$. Bisection is slow, but its number of steps is fixed and known in advance, and it needs no slope.

**Safeguarded Newton.** Take the Newton step. If it would land outside the current bracket, take a bisection step instead. Then shrink the bracket using the sign of $f$ at the new point. This keeps Newton's speed wherever Newton works and bisection's guarantee everywhere else. Most library root-finders follow this pattern.

**Laguerre–Conway.** [[Conway|laguerre-conway]] noticed that Laguerre's method for polynomial roots, applied to Kepler's equation as if it were a polynomial of degree $n$, converges from almost any starting point:

$$
E_{k+1} = E_k - \frac{n\,f}{f' \pm \sqrt{\left\lvert (n - 1)^2 f'^2 - n(n - 1)\,f f'' \right\rvert}}, \qquad f'' = e\sin E,
$$

with the sign chosen to match the sign of $f'$, so the bottom is as large as possible. A common choice is $n = 5$. ($f''$, "f-double-prime", is the curvature – how fast the slope changes.)

Compare it with Newton. The bottom of the fraction gets an extra boost from the curvature term, and that boost is exactly what damps the step where the slope is small. Near the root it converges even faster than Newton: the number of correct digits roughly triples each step (**cubic** convergence).

::: example Laguerre–Conway from anywhere
Same case: $e = 0.99$, $M = 0.1$, with $n = 5$.

From $E_0 = 0.1$ it converges to $E = 0.8316604238$ in $5$ steps. From $E_0 = \pi$, also $5$. From $E_0 = 6.0$ – nearly a full turn away – in $4$.

Now the same $360$-point grid, for $e = 0.9$, $0.99$ and $0.999$, starting from the naive $E_0 = M$ every time: the worst case is $6$ steps. That indifference to the starting point is why it shows up in production propagators.
:::

::: key A robust Kepler solver
Newton's iteration $E \leftarrow E - (E - e\sin E - M)/(1 - e\cos E)$ converges in a handful of steps from a good start: $E_0 = M \pm e$, or $E_0 = \pi$ when $e > 0.8$. Guarantee it with a bracket ($E$ lies within $e$ of $M$, inside $[0, 2\pi]$) and a bisection fallback, or use the Laguerre–Conway iteration, which converges from almost any starting point. Test convergence on the residual $\lvert f(E) \rvert$ as well as the step.
:::

## The hyperbolic equation

For $e > 1$, solve

$$
g(H) = e\sinh H - H - M_h = 0, \qquad g'(H) = e\cosh H - 1 \ge e - 1 > 0 .
$$

Again the slope is always positive, so $g$ only goes uphill and the root is unique.

There is more. The curvature $g''(H) = e\sinh H$ has the same sign as $H$. So for $H > 0$ – where the root lies whenever $M_h > 0$ – the curve bends upward like a bowl. Mathematicians call that **[[convex|convex-newton]]**.

For a function that goes uphill and bends upward, Newton's method behaves beautifully. Start anywhere to the right of the root and the guesses march down to it, never overshooting. Start to the left and the first step overshoots to the right – after which the same steady march follows. The only danger is a first step so large that $\sinh$ [[overflows|overflow]], and a sensible starting point avoids that.

Two rough starting guesses come from simplifying the equation:

- For small $M_h$, replace $\sinh H$ by $H$ (true for small $H$). Then $eH - H = M_h$, so the root is near $M_h/(e - 1)$.
- For large $M_h$, drop the lone $-H$, which is small next to $e\sinh H$. Then the root is near $\operatorname{arsinh}(M_h/e)$ ("area-sinh", the inverse of $\sinh$).

The second works acceptably everywhere. It never overflows, and when it is too small (at low $M_h$) the iteration recovers in a step or two. Newton from $H_0 = \operatorname{arsinh}(M_h/e)$ converges to $10^{-12}$ in at most $7$ steps for $e$ from $1.2$ to $5$ and $M_h$ from $0.1$ to $10$. From $H_0 = M_h/(e - 1)$ it can take $53$ steps – at $e = 1.2$, $M_h = 10$ – because the straight-line guess is then $50$, absurdly large.

::: example Newton on the hyperbolic equation
Solve for $e = 2$, $M_h = 1$.

**Start.** $H_0 = \operatorname{arsinh}(1/2) = 0.48121$.

**Iterate.** The guesses are $0.87052$, $0.81579$, $0.81410$, $0.8140968$, $0.8140967963$. The first step overshoots to the right of the root; every step after that comes down toward it from the right, never passing it – exactly as the convexity argument predicts. Five steps.

**Check.** The leftover $e\sinh H - H - M_h$ at the end is about $10^{-16}$ – round-off, nothing more.

**True anomaly.** $\tan(\nu/2) = \sqrt{(e+1)/(e-1)}\tanh(H/2) = \sqrt{3}\tanh(0.40705) = 0.66851$, so $\nu = 2\arctan 0.66851 = 67.5^\circ$.
:::

## Barker's equation in closed form

The parabola is the easy case. Write $\tau = \tan(\nu/2)$ and $B = \sqrt{\mu/p^3}\,(t - t_p)$. Barker's equation becomes

$$
\tfrac{1}{6}\tau^3 + \tfrac{1}{2}\tau - B = 0 \quad\Longleftrightarrow\quad \tau^3 + 3\tau - 6B = 0 .
$$

(Multiply every term by $6$ to get the second form.)

This is a **depressed cubic** – a cubic with no $\tau^2$ term – of the form $\tau^3 + p_c\tau + q_c = 0$, with $p_c = 3$ and $q_c = -6B$. Because $p_c > 0$, the left side only goes uphill, so there is exactly one real root. [[Cardano's formula|cardano]] gives it:

$$
\tau = \sqrt[3]{3B + \sqrt{9B^2 + 1}} + \sqrt[3]{3B - \sqrt{9B^2 + 1}} .
$$

The number inside the second cube root is negative, so take the [[negative real cube root|negative-cube-root]].

There is a tidier form. The two cube roots multiply to $\sqrt[3]{9B^2 - (9B^2 + 1)} = \sqrt[3]{-1} = -1$. So if you call the first one $A = \sqrt[3]{3B + \sqrt{9B^2 + 1}}$, the second is $-1/A$, and

$$
\tau = A - \frac{1}{A}.
$$

This also avoids subtracting two nearly equal cube roots when $B$ is small. Then $\nu = 2\arctan\tau$ and $r = \tfrac{p}{2}(1 + \tau^2)$.

::: example One hour after periapsis on a parabola
Take the parabola from last lesson: $p = 13\,356.27\,\mathrm{km}$ and $\sqrt{\mu/p^3} = 4.0902 \times 10^{-4}\,\mathrm{s^{-1}}$. Where is it $t - t_p = 3600\,\mathrm{s}$ after periapsis?

**The clock number.** $B = 4.0902 \times 10^{-4} \times 3600 = 1.47246$.

**The pieces.** $9B^2 + 1 = 20.513$, so $\sqrt{20.513} = 4.5292$. And $3B = 4.4174$.

**The cube root.** $A = \sqrt[3]{4.4174 + 4.5292} = \sqrt[3]{8.9466} = 2.07596$.

**The answer.**
$$
\tau = 2.07596 - \frac{1}{2.07596} = 2.07596 - 0.48171 = 1.59425 .
$$

**Check.** Put it back into Barker's equation: $\tfrac{1}{2}(1.59425) + \tfrac{1}{6}(1.59425)^3 = 0.79713 + 0.67533 = 1.47246 = B$. It fits.

**Where it is.** $\nu = 2\arctan 1.59425 = 115.8^\circ$, and $r = \tfrac{p}{2}(1 + \tau^2) = 6678.14\,(1 + 2.54163) = 23\,652\,\mathrm{km}$. Sensible: last lesson it reached $120^\circ$ after $70.6$ minutes, so after $60$ minutes it should be a little short of $120^\circ$. No iteration was needed.
:::

## Near the parabola

As $e \to 1$, both the elliptic and hyperbolic forms get into a second kind of trouble, different from the flat slope.

Near periapsis on an almost-parabolic orbit, $E$ is small, and $M = E - e\sin E \approx (1 - e)E + E^3/6$ is the difference of two nearly equal numbers. Take $e = 0.9999$ and $E = 0.01$. The two terms are $0.01$ and $e\sin E = 0.0099988$, and their difference, about $1.2 \times 10^{-6}$, has lost four of its significant figures – [[catastrophic cancellation|cancellation]]. The same happens with $e\sinh H - H$.

Solvers still converge, but the anomaly they return carries that round-off. The cure is not a better iteration but a better variable: the universal anomaly of the lesson after next, which handles $e = 0.999$, $1$ and $1.001$ with one formula and no cancellation.

## A solver in code

```python
import math

def solve_kepler(M, e, tol=1e-12, max_iter=60):
    """Elliptic Kepler equation: return E with E - e sin E = M (radians)."""
    M = M % (2 * math.pi)                         # wrap to [0, 2 pi)
    E = math.pi if e > 0.8 else (M + e if M < math.pi else M - e)
    lo, hi = 0.0, 2 * math.pi                     # the root is in here
    for _ in range(max_iter):
        f = E - e * math.sin(E) - M
        if f == 0.0:                              # landed exactly on it
            return E
        if f > 0:
            hi = E                                # root is to the left
        else:
            lo = E                                # root is to the right
        E_new = E - f / (1 - e * math.cos(E))     # Newton step
        if not (lo <= E_new <= hi):               # Newton left the bracket
            E_new = 0.5 * (lo + hi)               # so bisect instead
        if abs(E_new - E) < tol and abs(f) < tol:
            return E_new
        E = E_new
    raise RuntimeError("Kepler solver did not converge")

print(solve_kepler(0.1, 0.99))   # 0.8316604237910569
```

It starts well, keeps a bracket, bisects when Newton misbehaves, and raises an error rather than returning a wrong answer. It passes the module exercise's tests and a million random cases with $e$ up to $0.999999$.

Look at the `f == 0.0` line. It seems pointless, but without it a guess that lands *exactly* on the root would be recorded as the bracket's left end, the Newton step of zero would count as "leaving the bracket", and the bisection step would push the guess away again. Edge cases like this are why solvers need testing on huge numbers of random inputs.

The exercise for this module asks you to build this and its hyperbolic sibling, and to plot iteration counts against $e$ for each starting-point strategy. Do it – the plot makes the flat-slope failure unforgettable.

::: warning Loosening the tolerance is not a fix
If the solver "fails to converge" at $e = 0.995$, relaxing the tolerance from $10^{-12}$ to $10^{-6}$ will make the error message go away – and leave you with an anomaly that is wrong by whatever the last wild Newton step happened to be. Divergence is a starting-point problem, not a precision problem. Fix the start or add the bracket.
:::

::: warning Wrap M first, and use the right equation
Reduce $M$ to $[0, 2\pi)$ (or $[-\pi, \pi]$) before solving. A mean anomaly of $250$ radians makes every starting-point rule meaningless. And check $e$: an orbit with $e = 0.995$ is still elliptical, and the hyperbolic form $M_h = e\sinh H - H$ has nothing to say about it.
:::

## Check yourself

::: check
Show that Kepler's equation has exactly one solution $E$ for any $M$ and any $0 \le e < 1$, and that it lies within $e$ of $M$.
:::

::: answer
**One at most.** $f(E) = E - e\sin E - M$ has slope $1 - e\cos E \ge 1 - e > 0$. It only goes uphill, so it crosses zero at most once.

**At least one.** As $E \to -\infty$, $f \to -\infty$, and as $E \to +\infty$, $f \to +\infty$. So it must cross zero somewhere.

**Within $e$ of $M$.** At the root, $E - M = e\sin E$, and $\lvert e\sin E \rvert \le e$. So $\lvert E - M \rvert \le e$.
:::

::: check
For $e = 0.95$ and $M = 0.05\,\mathrm{rad}$, compute the first Newton step from $E_0 = M$ and from $E_0 = \pi$, and comment.
:::

::: answer
**From $E_0 = 0.05$.** $f = 0.05 - 0.95\sin 0.05 - 0.05 = -0.047480$ and $f' = 1 - 0.95\cos 0.05 = 0.051187$. The step is $+0.047480/0.051187 = +0.9276$, so $E_1 = 0.978$.

**From $E_0 = \pi$.** $f = \pi - 0 - 0.05 = 3.0916$ and $f' = 1.95$. The step is $-3.0916/1.95 = -1.5854$, so $E_1 = 1.556$.

**Comment.** The true root is $0.531$. The start at $M$ overshoots it by $0.45$, but lands where the slope is healthy and converges from there. The start at $\pi$ takes a controlled step and comes down steadily. At $e = 0.99$ the same calculation from $M$ gives a step of $6.6$ – the flat region has widened and the luck runs out.
:::

::: check
Why does Newton's method on the hyperbolic equation approach the root steadily once a guess is to the right of it?
:::

::: answer
For $H > 0$, $g(H) = e\sinh H - H - M_h$ goes uphill ($g' > 0$) and bends upward ($g'' = e\sinh H > 0$). For such a curve, the tangent line at any point lies *below* the curve. So the tangent at a point right of the root crosses zero somewhere between the root and that point. The next guess therefore moves toward the root but never past it. Each step lands closer, on the same side, so the guesses decrease steadily to the root.
:::

::: check
A parabolic trajectory has $p = 20\,000\,\mathrm{km}$. Find the true anomaly $2$ hours after periapsis.
:::

::: answer
**Rate.** $\sqrt{\mu/p^3} = \sqrt{398\,600.4418/8 \times 10^{12}} = 2.2321 \times 10^{-4}\,\mathrm{s^{-1}}$.

**Clock number.** $B = 2.2321 \times 10^{-4} \times 7200 = 1.6071$.

**Pieces.** $9B^2 + 1 = 24.246$, $\sqrt{24.246} = 4.9240$, and $3B = 4.8214$.

**Cube root.** $A = \sqrt[3]{4.8214 + 4.9240} = \sqrt[3]{9.7455} = 2.1360$, so $1/A = 0.4682$.

**Answer.** $\tau = 2.1360 - 0.4682 = 1.6678$, and $\nu = 2\arctan 1.6678 = 118.1^\circ$.

**Check.** $\tfrac{1}{2}(1.6678) + \tfrac{1}{6}(1.6678)^3 = 0.8339 + 0.7732 = 1.6071 = B$. The radius is $r = 10\,000\,(1 + 2.7817) = 37\,817\,\mathrm{km}$.
:::

::: check
Your Monte Carlo run of ten thousand propagations at $e = 0.98$ produces three wildly wrong final states and no error messages. What is the most likely cause, and how do you find it?
:::

::: answer
**Likely cause.** A Kepler solver that hit its iteration limit without converging and quietly returned its last guess. Most likely it uses Newton from $E_0 = M$ with no bracket, and three of the ten thousand mean anomalies fell in the flat region near periapsis, where the first step is enormous.

**How to find it.** At exit, check the residual $\lvert E - e\sin E - M \rvert$ and raise an error instead of returning when it is too big. The three bad cases will then announce themselves.

**The fix.** A better start ($\pi$ or $M \pm e$) plus a bisection or Laguerre–Conway fallback.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $f(E) = E - e\sin E - M$, $f' = 1 - e\cos E \ge 1 - e$ | Only goes uphill; unique root within $e$ of $M$ |
| $E_{k+1} = E_k - f/f'$ | Newton's method, quadratic convergence near the root |
| $E_0 = M \pm e$, or $\pi$ if $e > 0.8$ | Starting points that avoid the flat region near periapsis |
| Bracket $[M, M + e]$ or $[0, 2\pi]$ | Basis for bisection ($43$ steps to $10^{-12}$) or safeguarded Newton |
| Laguerre–Conway, $n = 5$ | $E \leftarrow E - nf/\big(f' \pm \sqrt{\lvert (n-1)^2 f'^2 - n(n-1) f f'' \rvert}\big)$; converges from almost anywhere |
| $g(H) = e\sinh H - H - M_h$ | Hyperbolic form; convex, Newton from $H_0 = \operatorname{arsinh}(M_h/e)$ |
| $\tau = A - 1/A$, $A = \sqrt[3]{3B + \sqrt{9B^2 + 1}}$ | Closed-form Barker solution, $B = \sqrt{\mu/p^3}(t - t_p)$, $\tau = \tan(\nu/2)$ |
| Ill-conditioning as $e \to 1$ | Cancellation in $E - e\sin E$; cured by universal variables |

With the anomaly now recoverable from time, the next lesson computes times of flight between any two points on any conic, builds a complete analytic propagator – and checks it against a numerical integration.

::: context monte-carlo Thousands of dice rolls
A **Monte Carlo** run answers "what could happen?" by simulating a mission thousands of times, each with slightly different random errors – engine thrust a bit high, a sensor a bit noisy, a launch a few seconds late – and looking at the spread of results. The name comes from the famous casino in Monaco, because the method runs on random numbers. Engineers trust the spread only if every single run is right, which is why a solver that fails silently once in ten thousand calls is so dangerous.
:::

::: context quadratic-convergence Digits that double
Here is the $E_0 = \pi$ run from the example, showing how many digits of each guess are correct. From step $3$ on, each step roughly doubles the count, until the computer's 16-digit limit is reached.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <text x="20" y="18" font-size="12" fill="#1f2a44">step</text>
  <text x="62" y="18" font-size="12" fill="#1f2a44">correct digits</text>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="30" y="44">0</text><text x="30" y="64">1</text><text x="30" y="84">2</text><text x="30" y="104">3</text>
    <text x="30" y="124">4</text><text x="30" y="144">5</text><text x="30" y="164">6</text><text x="30" y="184">7</text>
  </g>
  <g fill="#1d6fd1">
    <rect x="60" y="33" width="1" height="14"/><rect x="60" y="53" width="1.8" height="14"/>
    <rect x="60" y="73" width="9.4" height="14"/><rect x="60" y="93" width="21" height="14"/>
    <rect x="60" y="113" width="42" height="14"/><rect x="60" y="133" width="83.3" height="14"/>
    <rect x="60" y="153" width="165.8" height="14"/><rect x="60" y="173" width="272" height="14"/>
  </g>
  <g font-size="11" fill="#1f2a44">
    <text x="88" y="104">1.2</text><text x="109" y="124">2.5</text><text x="150" y="144">4.9</text>
    <text x="232" y="164">9.8</text><text x="300" y="184" fill="#fff">16</text>
  </g>
</svg>
```

Far from the root there is no such magic – steps $0$ to $2$ gain almost nothing. That is why the start matters so much.
:::

::: context newton-tangent Why the first step flies off
The curve $f(E) = E - 0.99\sin E - 0.1$ is nearly flat near $E = 0.1$. Newton's tangent line there dips barely below the axis and crawls along it, reaching zero only at $E = 6.71$ – far past the root at $0.83$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="150" x2="345" y2="150" stroke="#6c7a93" stroke-width="1"/>
  <line x1="30" y1="10" x2="30" y2="180" stroke="#6c7a93" stroke-width="1"/>
  <polyline fill="none" stroke="#1f2a44" stroke-width="2.5" points="30.0,158.0 34.3,157.9 38.6,157.7 42.9,157.4 47.1,156.8 51.4,156.0 55.7,154.7 60.0,153.0 64.3,150.8 68.6,148.0 72.9,144.6 77.1,140.6 81.4,135.8 85.7,130.3 90.0,124.0 94.3,117.0 98.6,109.2 102.9,100.5 107.1,91.1 111.4,80.9 115.7,70.0 120.0,58.4 124.3,46.0 128.6,33.1 132.9,19.5"/>
  <line x1="34.3" y1="157.9" x2="317.6" y2="150" stroke="#b4232c" stroke-width="2"/>
  <circle cx="34.3" cy="157.9" r="4" fill="#b4232c"/>
  <circle cx="317.6" cy="150" r="4" fill="#b4232c"/>
  <circle cx="65.6" cy="150" r="4" fill="#1d6fd1"/>
  <text x="100" y="143" font-size="12" fill="#1d6fd1">← root 0.83</text>
  <text x="36" y="176" font-size="11" fill="#b4232c">start 0.1</text>
  <text x="340" y="140" font-size="12" fill="#b4232c" text-anchor="end">next guess 6.71</text>
  <text x="150" y="176" font-size="11" fill="#b4232c">tangent, slope 0.015</text>
  <text x="140" y="30" font-size="12" fill="#1f2a44">f(E), e = 0.99, M = 0.1</text>
  <text x="340" y="165" font-size="11" fill="#6c7a93" text-anchor="end">E →</text>
</svg>
```

From $6.71$ the next tangent is steep again, and the guesses bounce around until one happens to land near the root.
:::

::: context bisection Higher or lower
Bisection is the game where someone thinks of a number from $1$ to $100$ and answers only "higher" or "lower". Always guess the middle and you never need more than $7$ guesses, because $2^7 = 128 > 100$. For Kepler's equation the "range" is $2\pi \approx 6.28$ and we want it below $10^{-12}$: that needs $2^k > 6.28 \times 10^{12}$, and $2^{43} \approx 8.8 \times 10^{12}$ is the first power big enough.
:::

::: context laguerre-conway A 19th-century method, rediscovered
Edmond Laguerre was a 19th-century French mathematician who devised his method for finding roots of polynomials; it is famous for converging from almost anywhere. In 1986 Bruce Conway published the observation that the same formula, applied to Kepler's equation, keeps that robustness. It has since become a common choice in software that must solve Kepler's equation for any orbit without ever failing.
:::

::: context convex-newton Why a bowl-shaped curve is kind to Newton
On a curve that bends upward, every tangent line lies below the curve. Start right of the root, follow the tangent down to zero, and you land between the root and where you were – closer, but never past it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="132" x2="345" y2="132" stroke="#6c7a93" stroke-width="1"/>
  <line x1="40" y1="5" x2="40" y2="185" stroke="#6c7a93" stroke-width="1"/>
  <polyline fill="none" stroke="#1f2a44" stroke-width="2.5" points="40.0,172.0 56.0,168.0 72.0,163.9 88.0,159.6 104.0,155.1 120.0,150.3 136.0,145.1 152.0,139.3 168.0,133.0 184.0,125.9 200.0,118.0 216.0,109.1 232.0,99.2 248.0,88.1 264.0,75.7 280.0,61.7 296.0,46.0 312.0,28.3 328.0,8.6"/>
  <line x1="296" y1="46" x2="200" y2="145.7" stroke="#b4232c" stroke-width="2"/>
  <circle cx="296" cy="46" r="4" fill="#b4232c"/>
  <circle cx="213.2" cy="132" r="4" fill="#b4232c"/>
  <circle cx="170.3" cy="132" r="4" fill="#1d6fd1"/>
  <text x="302" y="60" font-size="12" fill="#b4232c">H = 1.6</text>
  <text x="216" y="152" font-size="12" fill="#b4232c">next 1.08</text>
  <text x="120" y="122" font-size="12" fill="#1d6fd1">root 0.81</text>
  <text x="50" y="20" font-size="12" fill="#1f2a44">g(H) = 2 sinh H − H − 1</text>
</svg>
```

The next guess, $1.08$, sits between the root, $0.81$, and the start, $1.6$. Repeat, and the guesses slide down to the root from the right.
:::

::: context overflow When sinh is too big to store
A computer's ordinary numbers top out near $1.8 \times 10^{308}$. $\sinh H$ grows like $e^H/2$, so it passes that limit at about $H = 710$. A careless first guess such as $M_h/(e - 1)$ with a large $M_h$ and $e$ close to $1$ can land there, and the solver returns "infinity" instead of an answer. The $\operatorname{arsinh}$ start grows only like a logarithm, so it stays small.
:::

::: context cardano Cubics solved in the Renaissance
The formula for a depressed cubic was found in 16th-century Italy – first by Scipione del Ferro and then Niccolò Tartaglia – and published by Gerolamo Cardano in his book *Ars Magna* in 1545, which is why it carries his name. Barker's equation is one of the rare places in orbital mechanics where this old algebra gives an exact answer with no iteration at all.
:::

::: context negative-cube-root Cube roots of negative numbers
Unlike square roots, cube roots of negative numbers are ordinary real numbers: $\sqrt[3]{-8} = -2$, because $(-2)^3 = -8$. But beware code: in Python, `(-8) ** (1/3)` returns a complex number, not $-2$. Use `math.cbrt(-8)` (Python 3.11 and later), or compute the cube root of the size and put the sign back. The $A - 1/A$ form sidesteps the issue entirely, since $A$ is always the cube root of a positive number.
:::

::: context cancellation Subtracting away your digits
Keep eight significant digits of each number: $0.010000000$ and $0.0099988334$. Their difference is $0.0000011666$. The leading four digits of the two inputs matched and cancelled, so the answer has only four trustworthy digits left – an error in the eighth digit of either input is now an error in the fourth digit of the answer. That is catastrophic cancellation. It is not a bug in the arithmetic; it is information that was never there, and only a different formula can recover it.
:::
