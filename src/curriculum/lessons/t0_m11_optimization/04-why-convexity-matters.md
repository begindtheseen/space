---
id: l04-why-convexity-matters
title: Why convexity matters: global optimum, polynomial time, certificates
minutes: 24
covers:
  - "why convexity matters: global optimum, polynomial time, certificates"
---

A landing burn is solved onboard, from scratch, once per guidance cycle. The computer has perhaps a tenth of a second. It cannot ask a human whether the answer looks right, it cannot try again with a different starting guess, and it cannot afford to be late – a solution that arrives after the cycle ends is worse than none. This lesson is about the three properties that make such a computation defensible, and about the fact that a convex formulation delivers all three at once.

The first property is that the answer is *the* answer: whatever the solver converges to is the global optimum, not a local one. The second is that the computation finishes within a number of steps that can be bounded before flight, independent of the particular state the vehicle happens to be in. The third is that the solver can hand back a proof – a certificate – that its answer is optimal to within a stated tolerance, or a proof that no feasible trajectory exists, and either proof can be checked by a few multiplications.

None of these hold for a general nonlinear program. All three hold for a convex one, and the previous lesson's skill – recognising convexity – is what tells you which side of that line a problem sits on.

## Every local minimum is global

Let $f$ be convex on a convex feasible set $C$ and suppose $\mathbf{x}^\star$ is a local minimiser: $f(\mathbf{x}^\star) \le f(\mathbf{x})$ for every feasible $\mathbf{x}$ within some radius $r$. Take any other feasible point $\mathbf{y}$, however far away. The segment from $\mathbf{x}^\star$ to $\mathbf{y}$ lies in $C$ because $C$ is convex, so for small $\theta > 0$ the point $\mathbf{z} = \mathbf{x}^\star + \theta(\mathbf{y} - \mathbf{x}^\star)$ is feasible and within the radius $r$. Local optimality gives $f(\mathbf{x}^\star) \le f(\mathbf{z})$, and convexity of $f$ gives

$$
f(\mathbf{z}) = f\big((1-\theta)\mathbf{x}^\star + \theta\mathbf{y}\big) \le (1-\theta) f(\mathbf{x}^\star) + \theta f(\mathbf{y}) .
$$

Chain the two: $f(\mathbf{x}^\star) \le (1-\theta)f(\mathbf{x}^\star) + \theta f(\mathbf{y})$, which rearranges to $\theta f(\mathbf{x}^\star) \le \theta f(\mathbf{y})$ and, dividing by $\theta > 0$, to $f(\mathbf{x}^\star) \le f(\mathbf{y})$. Since $\mathbf{y}$ was arbitrary, $\mathbf{x}^\star$ is a global minimiser.

The argument used nothing about derivatives, so it holds for nonsmooth convex functions too. Three corollaries follow at once. The set of all minimisers is convex (if two points achieve $p^\star$, the chord inequality forces every point between them to achieve it as well). If $f$ is strictly convex the minimiser is unique (two distinct minimisers would force a strictly smaller value between them). And for a differentiable convex $f$ on an open set, $\nabla f(\mathbf{x}^\star) = \mathbf{0}$ is sufficient as well as necessary, by the first-order condition $f(\mathbf{y}) \ge f(\mathbf{x}^\star) + \nabla f(\mathbf{x}^\star)^\top(\mathbf{y} - \mathbf{x}^\star) = f(\mathbf{x}^\star)$.

### KKT becomes sufficient

Lesson 2 left the KKT conditions as necessary only. For a convex problem they are also sufficient, and the proof is short. Suppose $\mathbf{x}^\star, \boldsymbol{\lambda}^\star, \boldsymbol{\nu}^\star$ satisfy KKT for a problem with convex $f$ and $g_i$ and affine $h_j$. The Lagrangian

$$
\mathcal{L}(\mathbf{x}, \boldsymbol{\lambda}^\star, \boldsymbol{\nu}^\star) = f(\mathbf{x}) + \sum_i \lambda_i^\star g_i(\mathbf{x}) + \sum_j \nu_j^\star h_j(\mathbf{x})
$$

is a convex function of $\mathbf{x}$: a convex $f$, plus convex $g_i$ with nonnegative weights $\lambda_i^\star \ge 0$ (dual feasibility is exactly what makes this step work), plus affine $h_j$ with any weights. Stationarity says its gradient vanishes at $\mathbf{x}^\star$, so $\mathbf{x}^\star$ minimises this convex function over all of $\mathbb{R}^n$. Now for any feasible $\mathbf{x}$, each $\lambda_i^\star g_i(\mathbf{x}) \le 0$ and each $h_j(\mathbf{x}) = 0$, so

$$
f(\mathbf{x}) \ \ge\ \mathcal{L}(\mathbf{x}, \boldsymbol{\lambda}^\star, \boldsymbol{\nu}^\star)\ \ge\ \mathcal{L}(\mathbf{x}^\star, \boldsymbol{\lambda}^\star, \boldsymbol{\nu}^\star)\ =\ f(\mathbf{x}^\star),
$$

where the last equality is complementary slackness ($\lambda_i^\star g_i(\mathbf{x}^\star) = 0$) together with $h_j(\mathbf{x}^\star) = 0$. So $\mathbf{x}^\star$ is globally optimal.

This changes what a solver has to do. On a general problem, satisfying KKT to tolerance means "you have found *a* stationary point, and it may or may not be the minimum you wanted". On a convex problem it means "you are done, and here is the proof". A guidance algorithm that terminates on a KKT residual of $10^{-8}$ is, for a convex problem, terminating on a proof of global optimality.

::: warning A convex problem still has to be well posed
Convexity guarantees that every local minimum is global; it does not guarantee that a minimum exists. Minimising $x$ over the real line is convex and unbounded below. Minimising $e^{-x}$ is convex, bounded below by zero, and never attains its infimum. A landing problem with an infeasible target has no minimum at all. What convexity buys in those cases is that a solver can *detect* the situation and say so, rather than wandering. Bounded feasible sets and continuous objectives (the usual case in guidance, where every variable has a physical range) rule out the first two failures; the third is the subject of certificates below.
:::

## Polynomial time: a bound you can compute before flight

The second gift is about how long the computation takes, and the claim needs care because "fast" is not the point – *predictable* is.

A **polynomial-time** algorithm is one whose worst-case work is bounded by a polynomial in the size of the problem (the number of variables $n$, the number of constraints $m$, and the number of bits of accuracy $\log(1/\epsilon)$ requested). For convex problems such algorithms exist. The first was the ellipsoid method of the late 1970s, which established the theory: any convex problem with a computable objective and constraint oracle can be solved to accuracy $\epsilon$ in a number of steps polynomial in $n$ and $\log(1/\epsilon)$. The methods that actually fly are interior-point methods, whose theory (Nesterov and Nemirovski, 1990s) gives, for a problem with $m$ conic constraints, an iteration bound of the form

$$
N_{\text{iter}} = O\!\left(\sqrt{m}\,\log\frac{1}{\epsilon}\right),
$$

with each iteration a linear solve of cost roughly $O(n^3)$ for dense problems and far less for the sparse, banded structure that a discretised trajectory has. That expression has two features that matter for a flight computer. It depends on the *size* of the problem, which is fixed at design time – you choose $N$ steps and three thrust components per step, and the numbers never change in flight. And it does *not* depend on the problem's data: the initial position, velocity, wind, or mass at the moment guidance is called. Whatever state the vehicle is in, the bound is the same.

In practice the bound is loose, and interior-point solvers on well-scaled problems of any size converge in a few tens of iterations – the observed count barely grows with $m$, and it barely changes with the data. The card in this module says "tens", and that is what you will see in a solver's log for a landing problem with hundreds of variables and for one with thousands. Because the count is small and stable, the design procedure is: measure the iteration count over a large set of representative and adversarial cases, add margin, cap the solver at that many iterations, and multiply by the (fixed) cost per iteration. The result is a worst-case execution time that a certification authority can read.

Contrast the alternative. For a nonconvex problem no such bound exists in general. A local method – SQP, an interior-point method applied to nonconvex constraints – converges to *some* KKT point, and how many iterations it takes depends on the starting point and on the data in ways that cannot be characterised in advance. Finding the *global* minimum of a general nonconvex problem is NP-hard: the number of candidate local minima can grow exponentially with $n$. A function as innocent as $\sum_{i=1}^{n}(x_i^2 - 1)^2$ has $2^n$ local minima (every sign pattern of $\pm 1$), and while these happen to be equally good, a small perturbation of the coefficients makes exactly one of them best and forces a search over all of them. At $n = 100$ that is $1.27 \times 10^{30}$ candidates, and a computer checking a billion per second would need $4 \times 10^{13}$ years. The point is not that real nonconvex guidance problems are that bad – they usually are not – but that nothing about them *rules it out*, and a certification argument needs a rule.

::: example Iteration budgets for a descent problem
Take a 1-D minimum-fuel landing discretised into $N = 200$ steps: 200 thrust variables, 402 state variables, 400 dynamics equalities, 400 thrust bounds and 201 altitude bounds, so $m \approx 600$ inequality constraints. Gradient descent on a smooth version of this problem would need iterations proportional to the condition number $\kappa$ of the reduced Hessian, and for trajectory problems $\kappa$ is routinely $10^4$ or worse; from lesson 1, reducing the error by $10^{-6}$ then takes about $6.9\kappa \approx 69{,}000$ iterations. The interior-point theoretical bound scales as $\sqrt{m}\log(1/\epsilon) = \sqrt{600}\times 13.8 \approx 338$ iterations for $\epsilon = 10^{-6}$ – and, as the theory is pessimistic, the observed count on such a problem is a few tens.

Now double the horizon to $N = 400$. Gradient descent's bound roughly quadruples (the condition number of a discretised double integrator grows as $N^2$). The interior-point bound grows by $\sqrt{2}$ to about 478, and the observed count barely moves. The per-iteration cost grows, but linearly in $N$ for a banded system. That is what "polynomial time with a known iteration bound" means in a design meeting: the horizon can be chosen for accuracy, and the runtime budget follows from a formula rather than from hope.
:::

## Certificates: proof you can check with a multiplication

The third gift is the one that most distinguishes convex optimisation from numerical heuristics. When a convex solver stops, it does not merely say "this looks optimal". It returns a second object – a set of multipliers – from which a *lower bound* on the optimal value can be computed by anyone, without re-solving. If the lower bound and the achieved objective agree to $10^{-8}$, the solution is optimal to $10^{-8}$, and the checker needs only to verify a few inequalities and multiply some numbers together.

The mechanism is the Lagrangian, and its full development is the duality lesson. The core idea fits in a paragraph. For any $\boldsymbol{\lambda} \ge \mathbf{0}$ and any $\boldsymbol{\nu}$, define the **dual function** $q(\boldsymbol{\lambda}, \boldsymbol{\nu}) = \inf_{\mathbf{x}} \mathcal{L}(\mathbf{x}, \boldsymbol{\lambda}, \boldsymbol{\nu})$, the smallest value the Lagrangian takes over all $\mathbf{x}$, feasible or not. For any *feasible* $\mathbf{x}$, each term $\lambda_i g_i(\mathbf{x})$ is $\le 0$ and each $\nu_j h_j(\mathbf{x})$ is zero, so $\mathcal{L}(\mathbf{x}, \boldsymbol{\lambda}, \boldsymbol{\nu}) \le f(\mathbf{x})$, and therefore

$$
q(\boldsymbol{\lambda}, \boldsymbol{\nu}) \le f(\mathbf{x}) \quad \text{for every feasible } \mathbf{x}, \qquad\text{hence}\qquad q(\boldsymbol{\lambda}, \boldsymbol{\nu}) \le p^\star .
$$

Every choice of $\boldsymbol{\lambda} \ge \mathbf{0}$ produces a number that is provably no larger than the optimal value. That is a **certificate of optimality**: if a solver hands you $\mathbf{x}$ feasible with $f(\mathbf{x}) = 5.0000$ and multipliers with $q = 4.9999$, then $p^\star$ is trapped in $[4.9999, 5.0000]$ and $\mathbf{x}$ is optimal to within $10^{-4}$, whatever the solver did internally. The gap $f(\mathbf{x}) - q(\boldsymbol{\lambda}, \boldsymbol{\nu})$ is the **duality gap**, and for convex problems (under a mild condition) it can be driven to zero – so the certificate is not merely available but tight.

::: example An optimality certificate for a small linear program
Minimise $x_1 + 2x_2$ subject to $x_1 + x_2 \ge 4$, $x_1 \le 3$, $x_1 \ge 0$, $x_2 \ge 0$. A sketch shows the optimum at the corner $(3, 1)$ with value $5$; the certificate proves it without the sketch.

Multiply the constraint $x_1 + x_2 \ge 4$ by $1$ and the constraint $-x_1 \ge -3$ by $1$ and add: $x_2 \ge 1$ for every feasible point. Then $x_1 + 2x_2 = (x_1 + x_2) + x_2 \ge 4 + 1 = 5$ for every feasible point. Two multipliers, both equal to $1$, both nonnegative, and the objective has been shown to be at least $5$ everywhere on the feasible set. Since $(3, 1)$ is feasible and achieves exactly $5$, it is optimal, and $p^\star = 5$.

Notice what the certificate is: a nonnegative combination of the constraint inequalities that reproduces the objective as a lower bound. In the language above, $\boldsymbol{\lambda} = (1, 1, 0, 0)$ on the four constraints and $q(\boldsymbol{\lambda}) = 5$. The check took two additions. This is what a solver's "dual variables" output contains for any convex problem, and it is why an onboard algorithm can *verify* its own solution as a separate, cheap step before it commands the engine.
:::

The same machinery certifies **infeasibility**. If the feasible set is empty, there is no $p^\star$ to bound, but there is a dual object that proves emptiness: a nonnegative combination of the constraints that yields a contradiction such as $0 \le -1$. For linear constraints this is Farkas' lemma, and a convex solver that finds no feasible point returns exactly such a combination.

::: example An infeasibility certificate for a two-step landing
A 1-D lander with $g = 9.80665\,\mathrm{m/s^2}$ and thrust-acceleration bounds $0 \le T_k \le 20\,\mathrm{m/s^2}$ must come to rest in two steps of $\Delta t = 1\,\mathrm{s}$ (explicit Euler). Starting from $v_0 = -20\,\mathrm{m/s}$, the velocity equations $v_1 = v_0 + (T_0 - g)$ and $v_2 = v_1 + (T_1 - g) = 0$ require $T_0 + T_1 = -v_0 + 2g = 39.6$, achievable with $T_0 = T_1 = 19.8$; with $h_0 = 30\,\mathrm{m}$ the altitude constraint $h_2 = h_0 + v_0 + v_1 = 0$ is met by exactly that split, so the problem is feasible.

Now start from $v_0 = -21\,\mathrm{m/s}$. The velocity equations require $T_0 + T_1 = 21 + 19.61 = 40.6$, and the certificate is the multiplier vector that combines them with the bounds: add the two equalities (multiplier $1$ each) to get $T_0 + T_1 = 40.6$; add the two upper bounds $T_0 \le 20$ and $T_1 \le 20$ (multiplier $1$ each) to get $T_0 + T_1 \le 40$. Together: $40.6 \le 40$, a contradiction, so no feasible thrust history exists. Four multipliers, all equal to one, prove that the vehicle cannot stop in time regardless of what any solver might try.

This is what a landing algorithm does with an infeasible return: the certificate is the signal to switch modes – extend the horizon, relax a constraint, or divert – and it arrives in the same bounded number of iterations as a solution would have. A nonconvex solver that fails to converge cannot tell you whether the problem was infeasible or whether it simply got stuck.
:::

::: key Three things convexity buys you
Every local minimum is global, so any KKT point is the optimum and the first answer found is the right one. The problem is solvable in polynomial time with a known iteration bound – for interior-point methods $O(\sqrt{m}\log(1/\epsilon))$ in theory, tens in practice, independent of the data – so worst-case runtime can be certified. Duality provides a certificate of optimality (a dual lower bound matching the primal value) or a certificate of infeasibility (a nonnegative combination of constraints yielding a contradiction), each checkable without re-solving.
:::

## What this means for a vehicle

Put the three together and the shape of flight-worthy guidance emerges. The engineer formulates the descent as a convex program at design time, proving convexity constraint by constraint with the tools of the previous lesson – and, where the physics is nonconvex (the throttle lower bound, the mass-varying dynamics), finding a reformulation or relaxation that is convex and provably equivalent. The solver is an interior-point method with a hard iteration cap set from the theory and from testing. In flight, every cycle produces one of two outcomes within the cap: a solution with a certificate of optimality, or a certificate of infeasibility that triggers a mode change. There is no third outcome. There is no "converged to a bad local minimum", no "ran out of time", no "answer depends on the initial guess".

This is not how most optimisation in engineering works. A trajectory designer on the ground, with hours available and a human in the loop, is happy to run a nonlinear program from several starting points and take the best result. The lesson on NLP solvers covers that world, and it is a legitimate one. The distinction is between *offline* optimisation, where an unpredictable runtime and an occasional local minimum are inconveniences, and *onboard* optimisation, where they are failure modes. The reason to insist on convexity is not elegance. It is that a guarantee is the only thing a certification argument can be built on, and convexity is the property that produces guarantees.

::: note A word about "convex" as a design constraint
Insisting on convexity restricts what you can model, and the restriction costs something: a convex landing formulation may be slightly more conservative than the true nonconvex optimum, a keep-out zone becomes a halfspace, a nonlinear aerodynamic drag term must be bounded or linearised. Practitioners accept these costs because a certified, slightly suboptimal answer beats an uncertified optimal one every time the engine is live. The art, developed over the next lessons, is to give up as little as possible – and lossless convexification is the case where you give up nothing at all.
:::

## Check yourself

::: check
A convex function $f$ has two distinct global minimisers $\mathbf{x}_1$ and $\mathbf{x}_2$. What can you say about $f$ on the segment between them, and what does this tell you about $f$?
:::

::: answer
By the chord inequality, $f(\theta\mathbf{x}_1 + (1-\theta)\mathbf{x}_2) \le \theta p^\star + (1-\theta)p^\star = p^\star$, and since $p^\star$ is the minimum, equality holds: $f$ equals $p^\star$ along the whole segment. So the set of minimisers is convex and contains a line segment, and $f$ is not strictly convex (a strictly convex function has at most one minimiser). A least-squares problem with a rank-deficient matrix behaves exactly this way: a whole affine family of solutions with the same residual.
:::

::: check
An NLP solver on a nonconvex problem returns a point with KKT residual $10^{-10}$. A convex solver on a convex problem returns a point with KKT residual $10^{-6}$. Which result tells you more about optimality?
:::

::: answer
The convex one. On a convex problem KKT is sufficient, so a residual of $10^{-6}$ means the point is globally optimal to within a tolerance of that order, with a dual bound to prove it. On a nonconvex problem KKT is only necessary: a residual of $10^{-10}$ certifies a stationary point to high precision, but says nothing about whether it is the global minimum, a poor local minimum, or a saddle. Precision and optimality are different things, and only convexity connects them.
:::

::: check
A feasible point $\mathbf{x}$ of a convex problem has objective $f(\mathbf{x}) = 12.40$, and multipliers $\boldsymbol{\lambda} \ge 0$ give a dual value $q(\boldsymbol{\lambda}) = 12.35$. What do you know about $p^\star$ and about the quality of $\mathbf{x}$? Can $p^\star$ be $12.30$?
:::

::: answer
Weak duality gives $q \le p^\star$, and feasibility gives $p^\star \le f(\mathbf{x})$, so $12.35 \le p^\star \le 12.40$. The point $\mathbf{x}$ is suboptimal by at most $0.05$, about $0.4\,\%$ of the objective. $p^\star = 12.30$ is impossible: it would violate the lower bound provided by the certificate. If the tolerance of $0.05$ is too loose, more solver iterations will shrink the gap; the certificate as it stands is already a proof of the bracket.
:::

::: check
Why does the interior-point iteration bound $O(\sqrt{m}\log(1/\epsilon))$ matter more to a flight-software engineer than the fact that the solver is fast on a laptop?
:::

::: answer
Speed on a laptop is a measurement on the data you happened to try. The bound is a statement about *every* possible data set: whatever initial state, mass or wind the vehicle encounters, the iteration count cannot exceed a number fixed by the problem's dimensions, which are chosen at design time. A real-time schedule is built from worst cases, not typical cases, and only the bound gives a worst case. In practice engineers set an iteration cap well above the observed count and below the bound, and prove by test that the cap is never hit on representative and adversarial scenarios; the bound is what makes such a cap meaningful rather than a guess.
:::

::: check
For a nonconvex problem a solver returns "failed to converge". For a convex problem a solver returns "infeasible" with a certificate. Explain why the second message is actionable and the first is not.
:::

::: answer
The convex solver's infeasibility certificate is a nonnegative combination of the constraints that produces a contradiction, so it proves that no feasible point exists; guidance can immediately switch to a fallback (longer horizon, relaxed target, divert) knowing that continuing to search is pointless. The nonconvex solver's failure could mean the problem is infeasible, or that it is feasible and the solver got stuck, or that the iteration limit was too low, or that scaling was poor. Nothing in the message distinguishes these, so no single response is correct, and a flight computer cannot afford to investigate.
:::

## Summary

| Result | Statement |
| --- | --- |
| Local is global | For convex $f$ on convex $C$, every local minimiser is a global minimiser; the minimiser set is convex; strict convexity gives uniqueness |
| KKT sufficient | For a convex problem, any point satisfying KKT is globally optimal (Lagrangian is convex in $\mathbf{x}$ when $\boldsymbol{\lambda} \ge 0$) |
| Polynomial time | Interior-point methods: $O(\sqrt{m}\log(1/\epsilon))$ iterations, each a linear solve; observed count is tens and nearly data-independent |
| Nonconvex worst case | Global optimisation is NP-hard; local minima can number $2^n$ |
| Dual function | $q(\boldsymbol{\lambda}, \boldsymbol{\nu}) = \inf_{\mathbf{x}}\mathcal{L}(\mathbf{x}, \boldsymbol{\lambda}, \boldsymbol{\nu})$, with $q \le p^\star$ for all $\boldsymbol{\lambda} \ge 0$ |
| Optimality certificate | Feasible $\mathbf{x}$ and $\boldsymbol{\lambda} \ge 0$ with $f(\mathbf{x}) - q(\boldsymbol{\lambda}, \boldsymbol{\nu}) \le \epsilon$ proves $\mathbf{x}$ is $\epsilon$-optimal |
| Infeasibility certificate | Nonnegative combination of constraints yielding a contradiction such as $40.6 \le 40$ |
| Onboard consequence | Two outcomes only, both within the iteration cap: certified solution or certified infeasibility |

The next lessons name the convex problem classes a solver actually accepts – linear, quadratic, second-order cone and semidefinite programs – and show how a descent problem is written in each. The certificates sketched here are developed fully in the duality lesson.
