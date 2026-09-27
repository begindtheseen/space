---
id: l04-why-convexity-matters
title: Why convexity matters: global optimum, polynomial time, certificates
minutes: 24
covers:
  - "why convexity matters: global optimum, polynomial time, certificates"
---

Imagine hunting for the lowest point of a valley in thick fog. You can only feel the ground under your boots. You walk downhill until every direction goes up, and you stop. Did you find the bottom of the valley, or only the bottom of a little dip halfway down? In a bumpy landscape you cannot tell. In a single smooth bowl you can: the only place where every direction goes up *is* the bottom.

A landing rocket plays this game for real. Its computer solves the landing burn from scratch every guidance cycle, with perhaps a tenth of a second. It cannot ask a person, cannot retry from a different guess, and cannot be late — an answer after the cycle ends is worse than none.

Three properties make such a computation trustworthy. First, the answer is *the* answer: the best possible, not merely the best nearby. Second, the work finishes within a number of steps you can bound before flight. Third, the solver hands back a proof — a **certificate** — that its answer is optimal to a stated tolerance, or that no safe trajectory exists, and anyone can check it with a few multiplications.

None of the three holds for a general optimization problem. All three hold for a **convex** one — a bowl-shaped objective over a feasible set with no dents or holes, as lesson 3 defined it.

## Every local minimum is global

A **[[local minimizer|local-vs-global]]** is a point that beats every feasible point near it. A **global minimizer** beats every feasible point anywhere. A bumpy landscape can have many local ones. Convexity makes the two the same.

Let $f$ be a convex function on a convex feasible set $C$. Suppose $\mathbf{x}^\star$ (read "x star") is a local minimizer: $f(\mathbf{x}^\star) \le f(\mathbf{x})$ for every feasible $\mathbf{x}$ within some distance $r$. Now pick any other feasible point $\mathbf{y}$, however far away.

The idea: take a tiny step from $\mathbf{x}^\star$ toward $\mathbf{y}$. If $\mathbf{y}$ were lower, the bowl shape would make that step go downhill — which a local minimum forbids.

In symbols: the segment from $\mathbf{x}^\star$ to $\mathbf{y}$ lies in $C$ because $C$ is convex. So for a small number $\theta > 0$ ("theta"), the point $\mathbf{z} = \mathbf{x}^\star + \theta(\mathbf{y} - \mathbf{x}^\star)$ is feasible and within distance $r$. Local optimality gives $f(\mathbf{x}^\star) \le f(\mathbf{z})$. Convexity of $f$ — the graph lies below every chord — gives

$$
f(\mathbf{z}) = f\big((1-\theta)\mathbf{x}^\star + \theta\mathbf{y}\big) \le (1-\theta) f(\mathbf{x}^\star) + \theta f(\mathbf{y}) .
$$

Chain the two: $f(\mathbf{x}^\star) \le (1-\theta)f(\mathbf{x}^\star) + \theta f(\mathbf{y})$. Subtract $(1-\theta)f(\mathbf{x}^\star)$ from both sides to get $\theta f(\mathbf{x}^\star) \le \theta f(\mathbf{y})$. Divide by $\theta > 0$: $f(\mathbf{x}^\star) \le f(\mathbf{y})$. Since $\mathbf{y}$ was any feasible point at all, $\mathbf{x}^\star$ is a global minimizer.

The argument used no derivative, so it covers functions with corners, like $|x|$. Three more facts drop out:

- **The set of all minimizers is convex.** If two points both reach the lowest value $p^\star$ ("p star", the optimal value), the chord inequality forces every point between them to reach it as well.
- **Strict convexity gives a unique minimizer.** A **strictly convex** function lies strictly below its chords, so two different minimizers would force a strictly smaller value between them — impossible.
- **A zero gradient is enough.** For a differentiable convex $f$ on an open set, $\nabla f(\mathbf{x}^\star) = \mathbf{0}$ (read "grad f at x star is zero") is sufficient, not only necessary. The tangent-plane inequality of lesson 3 gives $f(\mathbf{y}) \ge f(\mathbf{x}^\star) + \nabla f(\mathbf{x}^\star)^\top(\mathbf{y} - \mathbf{x}^\star) = f(\mathbf{x}^\star)$ for every $\mathbf{y}$.

### KKT becomes sufficient

Lesson 2 left the KKT conditions as *necessary*: every constrained minimizer satisfies them, but a point that satisfies them might not be a minimizer. For a convex problem they are also *sufficient* — a finish line.

Take a problem with convex objective $f$, convex inequality constraints $g_i(\mathbf{x}) \le 0$ and affine (straight-line) equality constraints $h_j(\mathbf{x}) = 0$. Suppose $\mathbf{x}^\star$ with multipliers $\boldsymbol{\lambda}^\star$ ("lambda star") and $\boldsymbol{\nu}^\star$ ("nu star") satisfies KKT. Look at the Lagrangian with those multipliers plugged in:

$$
\mathcal{L}(\mathbf{x}, \boldsymbol{\lambda}^\star, \boldsymbol{\nu}^\star) = f(\mathbf{x}) + \sum_i \lambda_i^\star g_i(\mathbf{x}) + \sum_j \nu_j^\star h_j(\mathbf{x})
$$

It is a convex function of $\mathbf{x}$. It is a convex $f$, plus convex $g_i$ with nonnegative weights $\lambda_i^\star \ge 0$ (dual feasibility is exactly what makes this step work), plus affine $h_j$ with any weights. Stationarity says its gradient is zero at $\mathbf{x}^\star$. By the fact above, $\mathbf{x}^\star$ minimizes this convex function over all of $\mathbb{R}^n$.

Now take any feasible $\mathbf{x}$. Each $\lambda_i^\star g_i(\mathbf{x}) \le 0$ (a nonnegative number times a nonpositive one) and each $h_j(\mathbf{x}) = 0$. So

$$
f(\mathbf{x}) \ \ge\ \mathcal{L}(\mathbf{x}, \boldsymbol{\lambda}^\star, \boldsymbol{\nu}^\star)\ \ge\ \mathcal{L}(\mathbf{x}^\star, \boldsymbol{\lambda}^\star, \boldsymbol{\nu}^\star)\ =\ f(\mathbf{x}^\star).
$$

The last equality is complementary slackness ($\lambda_i^\star g_i(\mathbf{x}^\star) = 0$) together with $h_j(\mathbf{x}^\star) = 0$. So $\mathbf{x}^\star$ is globally optimal.

This changes what "done" means. On a general problem, meeting KKT means "you found *a* flat spot, maybe not the one you wanted". On a convex problem it means "you are done, and here is the proof". A guidance algorithm that stops on a KKT residual (the leftover error in the conditions) of $10^{-8}$ is stopping on a proof of global optimality.

::: warning A convex problem still has to be well posed
Convexity promises that every local minimum is global, not that a minimum exists. Minimizing $x$ over the real line is convex with no bottom at all. Minimizing $e^{-x}$ is convex and bounded below by zero, but never reaches zero. A landing problem with an unreachable target has no feasible point. What convexity buys here is that a solver can *detect* the situation and say so. Bounded feasible sets and continuous objectives — the usual case in guidance, where every variable has a physical range — rule out the first two failures. The third is the job of certificates, below.
:::

## Polynomial time: a bound you can compute before flight

The second gift is about how long the computation takes. Careful: the point is not "fast". The point is *predictable*. A bus that is always exactly 12 minutes is more useful for catching a train than one that is usually 5 but sometimes an hour.

A **polynomial-time** algorithm is one whose worst-case work is bounded by a polynomial — a sum of powers like $n^3$ or $\sqrt{m}$, never something like $2^n$ — in the size of the problem. Size here means the number of variables $n$, the number of constraints $m$, and how many digits of accuracy you ask for, measured by $\log(1/\epsilon)$ ("log of one over epsilon"), where $\epsilon$ is the tolerance.

For convex problems such algorithms exist. The first was the **[[ellipsoid method|ellipsoid-history]]**. It proved the theory: any convex problem whose objective and constraints can be evaluated can be solved to accuracy $\epsilon$ in a number of steps polynomial in $n$ and $\log(1/\epsilon)$. The methods that actually fly are **interior-point methods**, the subject of lesson 9. For a problem with $m$ conic constraints, their theory gives an iteration bound of the form

$$
N_{\text{iter}} = O\!\left(\sqrt{m}\,\log\frac{1}{\epsilon}\right),
$$

read "**[[big O|big-o]]** of root m times log one over epsilon". Each iteration is one linear solve. For a dense problem that costs roughly $O(n^3)$. For the sparse, banded structure of a discretized trajectory it costs far less.

Two features of that bound matter to a flight computer. It depends on the *size* of the problem, fixed at design time: $N$ time steps, three thrust components per step. And it does *not* depend on the data — the position, velocity, wind or mass when guidance is called. Whatever state the vehicle is in, the bound is the same.

In practice the bound is loose. On well-scaled problems of any size, interior-point solvers finish in a few tens of iterations, and the count barely changes with $m$ or with the data — "tens" for a landing problem with hundreds of variables and for one with thousands. So the design procedure is:

1. Measure the iteration count over a large set of normal and nasty test cases.
2. Add margin and cap the solver at that many iterations.
3. Multiply by the fixed cost per iteration.

The result is a **[[worst-case execution time|wcet]]** that a certification authority can read.

Now the alternative. For a nonconvex problem no such bound exists in general. A local method — sequential quadratic programming, say — converges to *some* KKT point, in a number of iterations that depends on the starting point and the data in ways nobody can predict.

Finding the *global* minimum of a general nonconvex problem is **[[NP-hard|np-hard]]**: the number of candidate local minima can grow exponentially with $n$. Even an innocent-looking function like $\sum_{i=1}^{n}(x_i^2 - 1)^2$ has $2^n$ local minima, one for every pattern of signs $x_i = \pm 1$. These happen to be equally good, but nudge the coefficients and exactly one becomes best, and finding it means searching all of them. At $n = 100$ that is $1.27 \times 10^{30}$ candidates; checking a billion per second takes about $4 \times 10^{13}$ years. Real guidance problems are usually not that bad. But nothing *rules it out*, and a certification argument needs a rule.

::: example Iteration budgets for a descent problem
Take a 1-D minimum-fuel landing cut into $N = 200$ time steps. It has 200 thrust variables and 402 state variables (altitude and velocity at 201 instants). There are 400 dynamics equalities, 400 thrust bounds and 201 altitude bounds, so about $m = 600$ inequality constraints.

**Gradient descent.** On a smooth version of this problem, gradient descent needs iterations in proportion to the condition number $\kappa$ ("kappa") of the Hessian. For trajectory problems $\kappa$ is routinely $10^4$ or worse. From lesson 1, cutting the error by a factor $10^{-6}$ takes about $6.9\kappa$ iterations: $6.9 \times 10^4 \approx 69{,}000$.

**Interior point.** The bound scales as $\sqrt{m}\log(1/\epsilon)$. With $\epsilon = 10^{-6}$, $\log(10^6) = 13.8$, so the bound is $\sqrt{600} \times 13.8 = 24.5 \times 13.8 \approx 338$ iterations. The theory is pessimistic; the count you actually see on such a problem is a few tens.

**Double the horizon** to $N = 400$. The condition number of a discretized double integrator grows at least as $N^2$, so gradient descent's count at least quadruples. The interior-point bound grows only by $\sqrt{2}$, to $\sqrt{1200} \times 13.8 \approx 479$, and the observed count barely moves. The cost of each iteration grows, but only in proportion to $N$ for a banded system.

Sanity check: $338 \times \sqrt{2} = 478$, matching. This is what "a known iteration bound" means in a design meeting: you pick the horizon for accuracy, and the runtime budget follows from a formula instead of from hope.
:::

## Certificates: proof you can check with a multiplication

The third gift most separates convex optimization from clever guessing. Think of a math contest where you must show your work: a bare answer earns nothing, but an answer with a short proof anyone can check earns full marks.

When a convex solver stops, it also returns a set of multipliers from which anyone can compute a *lower bound* on the best possible value, without re-solving. If that bound and the achieved objective agree to $10^{-8}$, the solution is optimal to $10^{-8}$.

The machinery is the Lagrangian again (the duality lesson develops it fully). Pick any $\boldsymbol{\lambda} \ge \mathbf{0}$ and any $\boldsymbol{\nu}$. Define the **dual function**

$$
q(\boldsymbol{\lambda}, \boldsymbol{\nu}) = \inf_{\mathbf{x}} \mathcal{L}(\mathbf{x}, \boldsymbol{\lambda}, \boldsymbol{\nu}),
$$

the **[[smallest value|infimum]]** the Lagrangian takes over all $\mathbf{x}$, feasible or not. For any *feasible* $\mathbf{x}$, each term $\lambda_i g_i(\mathbf{x})$ is $\le 0$ and each $\nu_j h_j(\mathbf{x})$ is zero, so $\mathcal{L}(\mathbf{x}, \boldsymbol{\lambda}, \boldsymbol{\nu}) \le f(\mathbf{x})$. The smallest value of $\mathcal{L}$ is no bigger than that, so

$$
q(\boldsymbol{\lambda}, \boldsymbol{\nu}) \le f(\mathbf{x}) \quad \text{for every feasible } \mathbf{x}, \qquad\text{hence}\qquad q(\boldsymbol{\lambda}, \boldsymbol{\nu}) \le p^\star .
$$

Every choice of $\boldsymbol{\lambda} \ge \mathbf{0}$ produces a number that is provably no larger than the optimal value. That is a **certificate of optimality**. Suppose a solver hands you a feasible $\mathbf{x}$ with $f(\mathbf{x}) = 5.0000$ and multipliers with $q = 4.9999$. Then $p^\star$ is **[[trapped|bracket-picture]]** between $4.9999$ and $5.0000$, and $\mathbf{x}$ is optimal to within $10^{-4}$ — whatever the solver did inside.

The difference $f(\mathbf{x}) - q(\boldsymbol{\lambda}, \boldsymbol{\nu})$ is the **duality gap**. For convex problems (under a mild condition, met in practice) it can be driven to zero, so the certificate is not only available but tight.

::: example An optimality certificate for a small linear program
Minimize $x_1 + 2x_2$ subject to $x_1 + x_2 \ge 4$, $x_1 \le 3$, $x_1 \ge 0$, $x_2 \ge 0$. A sketch shows the optimum at the corner $(3, 1)$ with value $3 + 2 = 5$. The certificate proves it without the sketch.

**Step 1.** Take the constraint $x_1 + x_2 \ge 4$ with multiplier $1$, and the constraint $x_1 \le 3$, written $-x_1 \ge -3$, with multiplier $1$. Add them: $x_2 \ge 1$ for every feasible point.

**Step 2.** Split the objective: $x_1 + 2x_2 = (x_1 + x_2) + x_2 \ge 4 + 1 = 5$ for every feasible point.

**Step 3.** The point $(3, 1)$ is feasible ($3 + 1 = 4 \ge 4$, $3 \le 3$, both nonnegative) and achieves exactly $5$. Nothing feasible can go lower, so it is optimal and $p^\star = 5$.

The certificate is a nonnegative combination of the constraints that rebuilds the objective as a lower bound: $\boldsymbol{\lambda} = (1, 1, 0, 0)$ on the four constraints, and $q(\boldsymbol{\lambda}) = 5$. Checking it took two additions. A solver's "dual variables" output holds exactly this, which is why an onboard algorithm can *verify* its own solution, as a separate cheap step, before it commands the engine.
:::

The same machinery certifies **infeasibility** — that no feasible point exists at all. Then there is no $p^\star$ to bound, but there is a dual object that proves the feasible set is empty: a nonnegative combination of the constraints that produces a contradiction, such as $0 \le -1$. For linear constraints this is **[[Farkas' lemma|farkas]]**, and a convex solver that finds no feasible point returns exactly such a combination.

::: example An infeasibility certificate for a two-step landing
A 1-D lander with $g = 9.80665\,\mathrm{m/s^2}$ and thrust acceleration limited to $0 \le T_k \le 20\,\mathrm{m/s^2}$ must come to rest in two steps of $\Delta t = 1\,\mathrm{s}$, using explicit Euler updates. Velocity is positive upward.

**A feasible case.** Start at $h_0 = 30\,\mathrm{m}$, $v_0 = -20\,\mathrm{m/s}$. The velocity equations are $v_1 = v_0 + (T_0 - g)$ and $v_2 = v_1 + (T_1 - g) = 0$. Adding them gives $T_0 + T_1 = -v_0 + 2g = 20 + 19.61 = 39.61$. The split $T_0 = T_1 = 19.81$ works: then $v_1 = -20 + 19.81 - 9.81 = -10\,\mathrm{m/s}$, and the altitude $h_2 = h_0 + v_0 + v_1 = 30 - 20 - 10 = 0$. Feasible.

**An infeasible case.** Start instead from $v_0 = -21\,\mathrm{m/s}$. Add the two velocity equations (multiplier $1$ each): $T_0 + T_1 = 21 + 19.61 = 40.61$. Add the two upper bounds $T_0 \le 20$ and $T_1 \le 20$ (multiplier $1$ each): $T_0 + T_1 \le 40$. Together they say $40.61 \le 40$ — a contradiction.

Four multipliers, all equal to one, prove that the vehicle cannot stop in time, whatever any solver might try.

That is what a landing algorithm does with an infeasible result. The certificate is the signal to switch modes — extend the horizon, relax a constraint, or **[[divert|divert]]** — and it arrives in the same bounded number of iterations a solution would have. A nonconvex solver that fails to converge cannot tell you whether the problem was infeasible or whether it merely got stuck.
:::

::: key Three things convexity buys you
Every local minimum is global, so any KKT point is the optimum and the first answer found is the right one. The problem is solvable in polynomial time with a known iteration bound — for interior-point methods $O(\sqrt{m}\log(1/\epsilon))$ in theory, tens in practice, independent of the data — so worst-case runtime can be certified. Duality provides a certificate of optimality (a dual lower bound matching the primal value) or a certificate of infeasibility (a nonnegative combination of constraints yielding a contradiction), each checkable without re-solving.
:::

## What this means for a vehicle

Put the three together and you get the shape of flight-worthy guidance.

At design time, the engineer writes the descent as a convex program, proving convexity constraint by constraint with the tools of lesson 3. Where the physics is nonconvex — the throttle's lower bound, the changing mass — the engineer finds a convex reformulation that is provably equivalent. The solver is an interior-point method with a hard iteration cap.

In flight, every cycle ends in one of two ways, inside the cap: a solution with a certificate of optimality, or a certificate of infeasibility that triggers a mode change. There is no third outcome. No "converged to a bad local minimum". No "ran out of time". No "the answer depends on the initial guess".

That is not how most engineering optimization works. A trajectory designer on the ground, with hours to spare, happily runs a nonlinear program from several starting points and keeps the best — a legitimate world, covered in the lesson on nonlinear solvers. The difference is *offline* optimization, where an unpredictable runtime or a local minimum is an inconvenience, versus *onboard* optimization, where it is a failure mode. The reason to insist on convexity is not elegance. A guarantee is the only thing a certification argument can be built on, and convexity produces guarantees.

::: note A word about "convex" as a design constraint
Insisting on convexity limits what you can model. A convex landing formulation may be slightly more cautious than the true optimum; a keep-out zone becomes a flat halfspace; a nonlinear drag term must be bounded or linearized. Engineers accept this because a certified, slightly suboptimal answer beats an uncertified optimal one whenever the engine is live. The art, developed over the next lessons, is to give up as little as possible — and lossless convexification is the case where you give up nothing at all.
:::

## Check yourself

::: check
A convex function $f$ has two different global minimizers, $\mathbf{x}_1$ and $\mathbf{x}_2$. What can you say about $f$ on the segment between them, and what does this tell you about $f$?
:::

::: answer
By the chord inequality, $f(\theta\mathbf{x}_1 + (1-\theta)\mathbf{x}_2) \le \theta p^\star + (1-\theta)p^\star = p^\star$. Since $p^\star$ is the minimum, nothing can be below it, so equality holds: $f$ equals $p^\star$ along the whole segment.

So the set of minimizers contains a whole segment, and $f$ is not strictly convex (that would allow at most one minimizer). A least-squares problem with a rank-deficient matrix behaves this way: a straight-line family of solutions, all with the same residual.
:::

::: check
A nonlinear solver on a nonconvex problem returns a point with KKT residual $10^{-10}$. A convex solver on a convex problem returns a point with KKT residual $10^{-6}$. Which result tells you more about optimality?
:::

::: answer
The convex one. On a convex problem KKT is sufficient, so a residual of $10^{-6}$ means the point is globally optimal to within a tolerance of that order, with a dual bound to prove it.

On a nonconvex problem KKT is only necessary. A residual of $10^{-10}$ pins down a flat spot very precisely, but says nothing about whether it is the global minimum, a poor local minimum, or a saddle. Precision and optimality are different things, and only convexity connects them.
:::

::: check
A feasible point $\mathbf{x}$ of a convex problem has objective $f(\mathbf{x}) = 12.40$. Multipliers $\boldsymbol{\lambda} \ge 0$ give a dual value $q(\boldsymbol{\lambda}) = 12.35$. What do you know about $p^\star$ and about how good $\mathbf{x}$ is? Can $p^\star$ be $12.30$?
:::

::: answer
Weak duality gives $q \le p^\star$, and feasibility of $\mathbf{x}$ gives $p^\star \le f(\mathbf{x})$. So $12.35 \le p^\star \le 12.40$.

The point $\mathbf{x}$ is worse than optimal by at most $12.40 - 12.35 = 0.05$, which is $0.05/12.40 \approx 0.4\,\%$ of the objective. $p^\star = 12.30$ is impossible: it would break the lower bound the certificate provides.

If a tolerance of $0.05$ is too loose, more solver iterations will shrink the gap. The certificate as it stands is already a proof of the bracket.
:::

::: check
Why does the interior-point iteration bound $O(\sqrt{m}\log(1/\epsilon))$ matter more to a flight-software engineer than the fact that the solver is fast on a laptop?
:::

::: answer
Speed on a laptop is a measurement on the data you happened to try. The bound is a statement about *every* possible data set: whatever initial state, mass or wind the vehicle meets, the iteration count cannot exceed a number fixed by the problem's dimensions, which are chosen at design time.

A real-time schedule is built from worst cases, and only the bound gives one. In practice engineers set an iteration cap above the observed count and below the bound, then show by testing that it is never hit. The bound is what makes that cap meaningful instead of a guess.
:::

::: check
For a nonconvex problem a solver returns "failed to converge". For a convex problem a solver returns "infeasible" with a certificate. Explain why the second message is something you can act on and the first is not.
:::

::: answer
The convex solver's infeasibility certificate is a nonnegative combination of the constraints that produces a contradiction. It proves that no feasible point exists. Guidance can immediately switch to a fallback — longer horizon, relaxed target, divert — knowing that searching longer is pointless.

The nonconvex solver's failure could mean the problem is infeasible, or that the solver got stuck, or the iteration limit was too low, or the scaling was poor. Nothing in the message tells these apart, so no single response is correct, and a flight computer cannot afford to investigate.
:::

## Summary

| Result | Statement |
| --- | --- |
| Local is global | For convex $f$ on convex $C$, every local minimizer is a global minimizer; the minimizer set is convex; strict convexity gives uniqueness |
| KKT sufficient | For a convex problem, any point satisfying KKT is globally optimal (the Lagrangian is convex in $\mathbf{x}$ when $\boldsymbol{\lambda} \ge 0$) |
| Polynomial time | Interior-point methods: $O(\sqrt{m}\log(1/\epsilon))$ iterations, each a linear solve; observed count is tens and nearly data-independent |
| Nonconvex worst case | Global optimization is NP-hard; local minima can number $2^n$ |
| Dual function | $q(\boldsymbol{\lambda}, \boldsymbol{\nu}) = \inf_{\mathbf{x}}\mathcal{L}(\mathbf{x}, \boldsymbol{\lambda}, \boldsymbol{\nu})$, with $q \le p^\star$ for all $\boldsymbol{\lambda} \ge 0$ |
| Optimality certificate | Feasible $\mathbf{x}$ and $\boldsymbol{\lambda} \ge 0$ with $f(\mathbf{x}) - q(\boldsymbol{\lambda}, \boldsymbol{\nu}) \le \epsilon$ proves $\mathbf{x}$ is $\epsilon$-optimal |
| Infeasibility certificate | A nonnegative combination of constraints yielding a contradiction such as $40.61 \le 40$ |
| Onboard consequence | Two outcomes only, both within the iteration cap: certified solution or certified infeasibility |

The next lessons name the convex problem classes a solver actually accepts — linear, quadratic, second-order cone and semidefinite programs — and show how a descent problem is written in each. The certificates sketched here are developed fully in the duality lesson.

::: context local-vs-global A dip versus the bottom
On the left, a bumpy curve has two low spots. A walker who stops where every direction goes up could stop at the orange one — a local minimum — and never learn that the blue one is lower. On the right, a convex bowl has only one low spot, so wherever the walker stops is the bottom.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <polyline fill="none" stroke="#1f2a44" stroke-width="2" points="25.0,61.7 30.0,82.6 34.9,97.4 39.9,107.3 44.9,113.2 49.8,115.8 54.8,116.0 59.7,114.5 64.7,111.8 69.7,108.4 74.6,104.9 79.6,101.5 84.6,98.7 89.5,96.5 94.5,95.1 99.4,94.6 104.4,94.9 109.4,95.9 114.3,97.4 119.3,99.2 124.3,100.9 129.2,102.0 134.2,102.1 139.1,100.6 144.1,96.8 149.1,90.0 154.0,79.2 159.0,63.7"/>
  <circle cx="52.7" cy="116.2" r="5" fill="#1d6fd1"/>
  <circle cx="132.2" cy="102.2" r="5" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <text x="52.7" y="138" font-size="11" text-anchor="middle" fill="#1d6fd1">global</text>
  <text x="132.2" y="124" font-size="11" text-anchor="middle" fill="#1f2a44">local only</text>
  <text x="92" y="22" font-size="12" text-anchor="middle" fill="#1f2a44">nonconvex</text>
  <polyline fill="none" stroke="#1f2a44" stroke-width="2" points="190.0,42.5 197.5,55.3 205.0,66.8 212.5,76.9 220.0,85.7 227.5,93.1 235.0,99.2 242.5,103.9 250.0,107.3 257.5,109.3 265.0,110.0 272.5,109.3 280.0,107.3 287.5,103.9 295.0,99.2 302.5,93.1 310.0,85.7 317.5,76.9 325.0,66.8 332.5,55.3 340.0,42.5"/>
  <circle cx="265" cy="110" r="5" fill="#1d6fd1"/>
  <text x="265" y="132" font-size="11" text-anchor="middle" fill="#1d6fd1">the only minimum</text>
  <text x="265" y="22" font-size="12" text-anchor="middle" fill="#1f2a44">convex</text>
</svg>
```
:::

::: context ellipsoid-history Where the polynomial-time idea came from
The ellipsoid method grew out of work by Naum Shor and by David Yudin and Arkadi Nemirovski in the Soviet Union in the 1970s. In 1979 Leonid Khachiyan used it to prove that linear programs can be solved in polynomial time — front-page news in its day. It is too slow to use in practice, but it settled the theory. In 1984 Narendra Karmarkar published a practical polynomial-time interior-point method for linear programs, and in the late 1980s and 1990s Yurii Nesterov and Nemirovski extended interior-point theory to the conic problems that landing guidance uses.
:::

::: context big-o What the big O means
$O(\cdot)$, read "big O of", describes how a cost *grows*, ignoring fixed multipliers. $O(\sqrt{m})$ means "at most some constant times $\sqrt{m}$" once $m$ is large. So quadrupling $m$ roughly doubles the bound, whatever the constant is. Engineers use it to compare how algorithms scale: an $O(n^3)$ linear solve on a problem twice as big takes about eight times as long. It says nothing about the constant itself, which is why the lesson also quotes observed counts.
:::

::: context wcet Worst-case execution time
Flight software runs on a fixed schedule: guidance might run ten times a second, and each task gets a time slot. Certification standards for flight software, such as DO-178C for aircraft, require evidence that every task finishes inside its slot. That evidence is the **worst-case execution time**: the longest the code can ever take. A solver whose running time depends on luck cannot produce this number; one with a proven iteration cap can.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <text x="10" y="18" font-size="12" fill="#1f2a44">iterations, log scale</text>
  <line x1="100" y1="28" x2="100" y2="100" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="100" y="32" width="242" height="16" fill="#b4232c"/>
  <text x="95" y="44" font-size="11" text-anchor="end" fill="#1f2a44">gradient</text>
  <text x="338" y="44" font-size="11" text-anchor="end" fill="#fff">69,000</text>
  <rect x="100" y="56" width="126" height="16" fill="#8fb8f0"/>
  <text x="95" y="68" font-size="11" text-anchor="end" fill="#1f2a44">IP bound</text>
  <text x="232" y="68" font-size="11" fill="#1f2a44">338</text>
  <rect x="100" y="80" width="74" height="16" fill="#1d6fd1"/>
  <text x="95" y="92" font-size="11" text-anchor="end" fill="#1f2a44">IP seen</text>
  <text x="180" y="92" font-size="11" fill="#1f2a44">about 30</text>
  <text x="100" y="114" font-size="11" fill="#6c7a93">each 50 px is a factor of 10</text>
</svg>
```

The bars show the $N = 200$ example: gradient descent's estimate, the interior-point bound, and a typical observed count.
:::

::: context np-hard What "NP-hard" means
Computer scientists sort problems by how their cost grows. **NP-hard** problems are at least as hard as a huge family of puzzles — scheduling, packing, route planning — for which nobody has ever found an algorithm that stays polynomial in the worst case. Most experts believe none exists. Calling general nonconvex optimization NP-hard means: do not expect any solver to guarantee the global optimum quickly on every instance.
:::

::: context infimum The "inf" in the dual function
$\inf$ is short for **infimum**, the greatest lower bound. It is like "minimum", except that it still makes sense when the lowest value is approached but never reached. For $e^{-x}$ over all real $x$, there is no minimum, but the infimum is $0$. The infimum can also be $-\infty$; then that choice of multipliers gives a useless bound, and you pick different ones.
:::

::: context bracket-picture Trapping the answer
Every feasible point gives a value *at or above* $p^\star$. Every choice of nonnegative multipliers gives a dual value *at or below* it. Together they fence $p^\star$ in. Here are the numbers from the third Check yourself question.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="55" x2="340" y2="55" stroke="#1f2a44" stroke-width="2"/>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="40" y1="50" x2="40" y2="60"/><line x1="120" y1="50" x2="120" y2="60"/><line x1="200" y1="50" x2="200" y2="60"/><line x1="280" y1="50" x2="280" y2="60"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="76">12.25</text><text x="120" y="76">12.30</text><text x="200" y="76">12.35</text><text x="280" y="76">12.40</text>
  </g>
  <rect x="200" y="46" width="80" height="18" fill="#8fb8f0" opacity="0.6"/>
  <circle cx="200" cy="55" r="5" fill="#1d6fd1"/>
  <circle cx="280" cy="55" r="5" fill="#b4232c"/>
  <text x="200" y="32" font-size="11" text-anchor="middle" fill="#1d6fd1">dual q</text>
  <text x="280" y="32" font-size="11" text-anchor="middle" fill="#b4232c">primal f(x)</text>
  <text x="240" y="98" font-size="11" text-anchor="middle" fill="#1f2a44">p* must be in here</text>
  <text x="120" y="98" font-size="11" text-anchor="middle" fill="#6c7a93">ruled out</text>
</svg>
```
:::

::: context farkas A lemma from 1902
Gyula Farkas, a Hungarian physicist and mathematician, published the result in 1902 while studying equilibrium in mechanics. It says that a system of linear inequalities either has a solution, or there is a nonnegative combination of them that adds up to something impossible like $0 \le -1$ — exactly one of the two, never both. That "either–or" is what lets a solver return a proof of emptiness instead of a shrug. The duality lesson proves it.
:::

::: context divert Why a lander needs to know it cannot land
A lander that learns its target is out of reach must pick a new one, and fast. The convex landing algorithm tested by NASA's Jet Propulsion Laboratory on Masten Space Systems' Xombie rocket in 2012 and 2013, called G-FOLD, was built around exactly this: solve the problem, and if the pad is unreachable, find the closest point that can be reached and fly there. Lesson 6 shows how the problem behind it is written.
:::
