---
id: l02-lagrange-and-kkt
title: "Rules in the way: Lagrange multipliers and the KKT conditions"
minutes: 19
covers:
  - constrained optimization and Lagrange multipliers
  - KKT conditions
---

The last lesson walked downhill with nothing in the way. Real guidance problems are mostly things in the way. A landing burn must end at the pad with zero velocity — those are equality constraints. The engine cannot push harder than its rated thrust, the vehicle must stay above the glide slope, and the throttle cannot drop below its minimum — those are inequality constraints. The propellant cost is almost an afterthought. The physics lives in the constraints, and the best answer is usually pressed up against several of them at once.

Think of a hiker told to stay on a marked trail. The lowest point *of the trail* is usually not the bottom of the valley. It is a spot where the trail would have to leave the valley floor to go any lower. At that spot the ground's pull downhill is not zero; it is exactly canceled by the trail pushing back.

This lesson turns that picture into conditions a constrained minimizer must satisfy, called the **Karush–Kuhn–Tucker (KKT) conditions**. They replace "the gradient is zero" with "the gradient is balanced by the constraints". The balancing numbers are the **Lagrange multipliers**, and they are more than bookkeeping: a multiplier is the price of a constraint — the propellant one more newton of thrust would have saved. Every solver later in the module, from interior-point methods to IPOPT, is at heart a way of finding a point that satisfies KKT.

Throughout, the problem is the standard form of lesson 1: minimize $f(\mathbf{x})$ over $\mathbf{x} \in \mathbb{R}^n$ subject to $g_i(\mathbf{x}) \le 0$ for $i = 1,\dots,m$ and $h_j(\mathbf{x}) = 0$ for $j = 1,\dots,p$, with every function smooth.

## Equality constraints: the gradient must be balanced

Start with one equality constraint, $h(\mathbf{x}) = 0$. It carves out a surface — in two dimensions, a curve, like the trail. Suppose $\mathbf{x}^\star$ is the lowest point of $f$ on that surface.

Stand at $\mathbf{x}^\star$ and consider stepping along the surface in some direction $\mathbf{d}$. "Along the surface" means the constraint value does not change, to first order: $\nabla h(\mathbf{x}^\star)^\top\mathbf{d} = 0$. Such a $\mathbf{d}$ is a **tangent direction**.

If $f$ went down along a tangent direction, $\nabla f(\mathbf{x}^\star)^\top \mathbf{d} < 0$, you could slide along the surface and get lower while staying feasible. That contradicts $\mathbf{x}^\star$ being the lowest. The same argument with $-\mathbf{d}$ rules out $\nabla f^\top\mathbf{d} > 0$. So

$$
\nabla f(\mathbf{x}^\star)^\top \mathbf{d} = 0 \quad \text{for every tangent direction } \mathbf{d}.
$$

The gradient of $f$ is perpendicular to the whole tangent plane. But the vectors perpendicular to the tangent plane are exactly the multiples of $\nabla h(\mathbf{x}^\star)$. So $\nabla f$ must be a multiple of $\nabla h$: there is a number $\nu$ ("nu") with

$$
\nabla f(\mathbf{x}^\star) + \nu\,\nabla h(\mathbf{x}^\star) = \mathbf{0}.
$$

That number is the **[[Lagrange multiplier|lagrange-history]]** for the constraint. In a picture: the level curve of $f$ through $\mathbf{x}^\star$ barely touches the constraint curve there, without crossing it. The two curves kiss, and their perpendiculars line up.

### Several equality constraints

With $p$ equality constraints, a tangent direction must be perpendicular to all of $\nabla h_1, \dots, \nabla h_p$. The same reasoning puts $\nabla f$ in the span of the constraint gradients — it is some combination of them:

$$
\nabla f(\mathbf{x}^\star) + \sum_{j=1}^{p} \nu_j\,\nabla h_j(\mathbf{x}^\star) = \mathbf{0}.
$$

The argument quietly assumed that the tangent directions of the surface really are the vectors perpendicular to the constraint gradients. That is true when the constraint gradients are **linearly independent** at $\mathbf{x}^\star$ — none of them is a combination of the others. This assumption is the **linear independence constraint qualification**, or **LICQ**. It fails where the constraint surface is degenerate. For example, $h(x) = x^2 = 0$ has only the feasible point $x = 0$, where $\nabla h = 0$, and no multiplier can balance a nonzero $\nabla f$ there.

### The Lagrangian

It is handy to package everything into one function, the **Lagrangian**, written with a curly L and read "L":

$$
\mathcal{L}(\mathbf{x}, \boldsymbol{\nu}) = f(\mathbf{x}) + \sum_{j=1}^{p} \nu_j\,h_j(\mathbf{x}) .
$$

Setting its gradient in $\mathbf{x}$ to zero, $\nabla_{\mathbf{x}}\mathcal{L} = \mathbf{0}$, gives the balance condition above. Setting its gradient in $\boldsymbol{\nu}$ to zero, $\nabla_{\boldsymbol{\nu}}\mathcal{L} = \mathbf{0}$, gives back the constraints $h_j = 0$. So a constrained minimizer is a stationary point of the Lagrangian in both sets of variables: $n + p$ equations in $n + p$ unknowns.

::: example Minimum-effort reaction wheel torques
A spacecraft has three **[[reaction wheels|reaction-wheel]]** whose spin axes lie in the body $xy$-plane at $0^\circ$, $120^\circ$ and $240^\circ$. Wheel $k$ makes a torque $u_k$ (in $\mathrm{N\,m}$) along its own axis. The attitude controller asks for a body torque $\mathbf{b} = (1.0, 0.5)\,\mathrm{N\,m}$ about $x$ and $y$.

**Set up.** Two requirements, three wheels: infinitely many $\mathbf{u}$ work. A natural tie-breaker is the least total effort, $f(\mathbf{u}) = \tfrac{1}{2}\|\mathbf{u}\|^2$, subject to $\mathbf{A}\mathbf{u} = \mathbf{b}$. Each column of $\mathbf{A}$ is one wheel's axis, $(\cos\theta, \sin\theta)$:

$$
\mathbf{A} = \begin{bmatrix} 1 & -\tfrac{1}{2} & -\tfrac{1}{2} \\ 0 & \tfrac{\sqrt{3}}{2} & -\tfrac{\sqrt{3}}{2} \end{bmatrix}.
$$

**Lagrangian.** $\mathcal{L} = \tfrac{1}{2}\mathbf{u}^\top\mathbf{u} + \boldsymbol{\nu}^\top(\mathbf{A}\mathbf{u} - \mathbf{b})$.

**Stationarity in $\mathbf{u}$.** $\mathbf{u} + \mathbf{A}^\top\boldsymbol{\nu} = \mathbf{0}$, so $\mathbf{u} = -\mathbf{A}^\top\boldsymbol{\nu}$.

**Use the constraint.** Substitute into $\mathbf{A}\mathbf{u} = \mathbf{b}$: $-\mathbf{A}\mathbf{A}^\top\boldsymbol{\nu} = \mathbf{b}$. For this symmetric layout $\mathbf{A}\mathbf{A}^\top = 1.5\,\mathbf{I}$, so $\boldsymbol{\nu} = -\mathbf{b}/1.5 = (-0.667, -0.333)$.

**Answer.**

$$
\mathbf{u}^\star = \tfrac{2}{3}\mathbf{A}^\top\mathbf{b} = (0.667,\ -0.0447,\ -0.622)\,\mathrm{N\,m}, \qquad \|\mathbf{u}^\star\| = 0.913\,\mathrm{N\,m},\qquad f^\star = 0.417 .
$$

**Check.** $\mathbf{A}\mathbf{u}^\star = (1.0, 0.5)$, as required. Compare the obvious alternative of leaving wheel 3 idle and solving the $2 \times 2$ system for the other two: $\mathbf{u} = (1.289, 0.577, 0)$ with $f = 0.997$ — more than twice the effort. The general formula $\mathbf{u}^\star = \mathbf{A}^\top(\mathbf{A}\mathbf{A}^\top)^{-1}\mathbf{b}$ is the minimum-norm solution of an underdetermined system, the **[[pseudoinverse|pseudoinverse]]**, and Lagrange multipliers are the shortest road to it.
:::

## Inequality constraints: active, inactive, and the sign of the multiplier

An inequality is like a fence. At the lowest point you are either standing well away from the fence, or leaning on it.

- If $g(\mathbf{x}^\star) < 0$, the constraint is **inactive**. There is room to spare; every point nearby is still feasible, and the constraint might as well not exist.
- If $g(\mathbf{x}^\star) = 0$, the constraint is **active**. The answer sits right on its boundary.

An inactive constraint plays no part in the balance, so its multiplier is zero. An active one acts like an equality constraint, so the equality argument gives $\nabla f + \lambda\nabla g = \mathbf{0}$ for some $\lambda$ ("lambda"). But there is one extra restriction: the sign of $\lambda$.

Here is why. The feasible side is where $g < 0$, so the direction $\mathbf{d} = -\nabla g$ steps off the fence into the allowed region. Along it, $f$ changes at the rate

$$
\nabla f^\top\mathbf{d} = (-\lambda\nabla g)^\top(-\nabla g) = \lambda\|\nabla g\|^2 .
$$

If $\lambda$ were negative, this rate would be negative: stepping away from the fence into the allowed region would lower $f$, so $\mathbf{x}^\star$ was not the minimizer. Therefore

$$
\lambda \ge 0 .
$$

Read it physically. The direction $-\nabla f$ is where the objective wants to go. The condition $-\nabla f = \lambda\nabla g$ with $\lambda \ge 0$ says the objective is pushing *outward* against the fence, and the fence is pushing back. A negative multiplier would mean the objective wants to walk away from the fence — in which case you would not be leaning on it.

Both cases fit one equation. Either $\lambda = 0$ (inactive) or $g = 0$ (active), so always

$$
\lambda_i\,g_i(\mathbf{x}^\star) = 0 .
$$

This is **complementary slackness** — "slack" being the room to spare. A constraint can have slack, or a nonzero multiplier, but never both. It is also why inequality problems are hard to solve by hand: you have to guess which constraints are active, and with $m$ inequalities there are $2^m$ possible **[[guesses|active-set-count]]**.

## The KKT conditions

Now put it all together. For the full standard-form problem the Lagrangian is

$$
\mathcal{L}(\mathbf{x}, \boldsymbol{\lambda}, \boldsymbol{\nu}) = f(\mathbf{x}) + \sum_{i=1}^{m}\lambda_i\,g_i(\mathbf{x}) + \sum_{j=1}^{p}\nu_j\,h_j(\mathbf{x}),
$$

and the **[[Karush–Kuhn–Tucker conditions|kkt-names]]** at a point $\mathbf{x}^\star$ with multipliers $\boldsymbol{\lambda}^\star, \boldsymbol{\nu}^\star$ are:

1. **Stationarity**: $\nabla f(\mathbf{x}^\star) + \sum_i \lambda_i^\star \nabla g_i(\mathbf{x}^\star) + \sum_j \nu_j^\star \nabla h_j(\mathbf{x}^\star) = \mathbf{0}$. The gradients balance.
2. **Primal feasibility**: $g_i(\mathbf{x}^\star) \le 0$ for all $i$ and $h_j(\mathbf{x}^\star) = 0$ for all $j$. The point obeys the rules.
3. **Dual feasibility**: $\lambda_i^\star \ge 0$ for all $i$. The fences only push.
4. **Complementary slackness**: $\lambda_i^\star\,g_i(\mathbf{x}^\star) = 0$ for all $i$. Only constraints you lean on get a multiplier.

("Primal" refers to the original variables $\mathbf{x}$; "dual" to the multipliers. Lesson 7 explains the names.)

**The theorem.** If $\mathbf{x}^\star$ is a local minimizer and a constraint qualification such as LICQ holds there, then multipliers exist that make all four conditions true.

So KKT is **necessary**. It is not, in general, **sufficient**. A constrained saddle point or maximum can satisfy KKT too, in the same way that $\nabla f = 0$ does not by itself prove an unconstrained minimum. The second-order test is that the Hessian of the Lagrangian, $\nabla^2_{\mathbf{xx}}\mathcal{L}$, be positive semidefinite along the tangent directions of the active constraints. The next two lessons show that for **convex** problems KKT becomes necessary *and* sufficient — one of the three gifts of convexity.

::: key The KKT conditions
For $\min f$ s.t. $g_i \le 0$, $h_j = 0$: stationarity $\nabla f + \sum_i \lambda_i \nabla g_i + \sum_j \nu_j \nabla h_j = 0$; primal feasibility $g_i \le 0$, $h_j = 0$; dual feasibility $\lambda_i \ge 0$; complementary slackness $\lambda_i g_i = 0$. Equality multipliers $\nu_j$ have no sign restriction; inequality multipliers $\lambda_i$ are nonnegative and vanish on inactive constraints.
:::

### Solving by guessing the active set

By hand, you solve a KKT system by trying cases:

1. Guess which inequalities are active.
2. Treat those as equalities and solve the Lagrange system.
3. Check that the multipliers you found are nonnegative.
4. Check that the constraints you assumed inactive really are satisfied.

If a check fails, change the guess and go again.

::: example The closest point of a triangle
Find the point of the triangle $x + y \le 2$, $x \ge 0$, $y \ge 0$ that is **[[closest to (3, 2)|projection-picture]]**. That means minimizing $f(x, y) = (x-3)^2 + (y-2)^2$, the squared distance. Write the constraints in standard form: $g_1 = x + y - 2 \le 0$, $g_2 = -x \le 0$, $g_3 = -y \le 0$.

**First guess.** The unconstrained minimizer $(3, 2)$ breaks $g_1$ (since $3 + 2 > 2$), so something is active. Guess that only $g_1$ is.

**Stationarity.** $\nabla f + \lambda_1\nabla g_1 = (2(x-3) + \lambda_1,\ 2(y-2) + \lambda_1) = \mathbf{0}$. Both entries contain the same $\lambda_1$, so $2(x - 3) = 2(y - 2)$, which says $x - y = 1$.

**Solve.** Together with $x + y = 2$: adding gives $2x = 3$, so $(x, y) = (1.5, 0.5)$. Then $\lambda_1 = -2(1.5 - 3) = 3$.

**Check everything.** $\lambda_1 = 3 \ge 0$, so dual feasibility holds. $g_2 = -1.5 < 0$ and $g_3 = -0.5 < 0$, so the other two really are inactive, with $\lambda_2 = \lambda_3 = 0$. Complementary slackness holds because $g_1 = 0$. All four conditions pass, and $f^\star = 1.5^2 + 1.5^2 = 4.5$.

**What a wrong guess looks like.** Guess "$g_1$ and $g_3$ active" instead. That is the corner $(2, 0)$. Stationarity reads $(-2 + \lambda_1,\ -4 + \lambda_1 - \lambda_3) = \mathbf{0}$, so $\lambda_1 = 2$ and $\lambda_3 = -2 < 0$. Dual feasibility fails. The negative sign is telling you something true: $f$ drops if you move off the edge $y = 0$ into the triangle. Indeed $f(2, 0) = 5 > 4.5$.
:::

## What a multiplier means: the shadow price

Picture a parking lot that charges by the hour. If your whole day is limited by the parking time, then one extra hour is worth something to you — and how much it is worth is a number you could state. A multiplier is that number for a constraint.

Suppose the constraint is $g(\mathbf{x}) \le b$ instead of $g(\mathbf{x}) \le 0$, and let $p^\star(b)$ be the best cost as the bound $b$ changes. Raising $b$ loosens the rule, so $p^\star(b)$ can only go down or stay put. How fast?

At the optimum $\mathbf{x}^\star(b)$ the constraint is active, $g(\mathbf{x}^\star(b)) = b$, and stationarity says $\nabla f = -\lambda\nabla g$. Differentiate $p^\star(b) = f(\mathbf{x}^\star(b))$ with the chain rule, then use each fact in turn:

$$
\frac{dp^\star}{db} = \nabla f^\top\frac{d\mathbf{x}^\star}{db} = -\lambda\,\nabla g^\top\frac{d\mathbf{x}^\star}{db} = -\lambda\,\frac{d}{db}\,g(\mathbf{x}^\star(b)) = -\lambda\,\frac{d}{db}\,b = -\lambda .
$$

So, for each constraint $i$,

$$
\frac{\partial p^\star}{\partial b_i} = -\lambda_i .
$$

Loosening constraint $i$ by one unit lowers the best cost by $\lambda_i$ units. This is the multiplier's real meaning: the **[[shadow price|shadow-price-picture]]** of the constraint, the value of loosening it a little. An inactive constraint has $\lambda_i = 0$, and sure enough, loosening it changes nothing.

For an equality constraint $h_j(\mathbf{x}) = c_j$ the same steps give $\partial p^\star/\partial c_j = -\nu_j$. That is why equality multipliers can have either sign: moving a target one way may cost fuel, the other way may save it.

Test it on the triangle. There $\lambda_1 = 3$, so moving the edge out to $x + y \le 2.01$ should lower $f^\star$ by about $3 \times 0.01 = 0.03$. The exact new optimum is $f^\star(2.01) = 4.4700$, a drop of $0.02995$. The prediction is off by only $0.00005$, a second-order effect.

::: key Physical meaning of a Lagrange multiplier
A multiplier on an active constraint is its shadow price: the rate at which the optimal cost improves per unit relaxation of that constraint, $\partial p^\star / \partial b_i = -\lambda_i$. A multiplier on a thrust bound tells you how much fuel one more newton would save; a zero multiplier means the constraint is not binding and could be dropped without changing the answer.
:::

::: note Multipliers carry units
Since $\lambda_i = -\partial p^\star/\partial b_i$, a multiplier has the units of the objective divided by the units of the constraint. In a fuel-optimal landing with propellant in kilograms and a thrust bound in newtons, the multiplier on the thrust bound is in $\mathrm{kg/N}$. Read a solver's multipliers with their units attached, and a page of diagnostic numbers becomes a free engineering sensitivity study.
:::

::: warning Sign conventions differ between books and solvers
This module writes inequalities as $g_i \le 0$ and adds $+\lambda_i g_i$ to the Lagrangian, so $\lambda_i \ge 0$. Some books write $g_i \ge 0$ and subtract; others put a minus sign on the whole Lagrangian. Solvers are worse: **[[IPOPT|ipopt]]** reports multipliers for lower and upper bounds separately, and some codes return the negative of what is derived here. What never changes is complementary slackness and the shadow-price meaning. If a solver's multiplier makes "loosening the constraint lowers the cost" come out backwards, the convention is flipped, not the physics.
:::

## Where KKT shows up on a vehicle

**Optimal control.** A powered-descent problem cut into $N$ time steps has state and thrust variables at each step, the dynamics as equality constraints, and thrust limits as inequalities. Its KKT conditions are the step-by-step version of what optimal control calls **Pontryagin's principle**. The equality multipliers $\boldsymbol{\nu}$ on the dynamics are the **[[costates|costates]]**. Stationarity in the controls becomes minimizing a function called the Hamiltonian at each step. And complementary slackness on the thrust limits forces the thrust to sit at its maximum or minimum whenever that limit's multiplier is nonzero. When you later read that a minimum-fuel thrust profile is **bang-bang** — full on or full off — that is complementary slackness speaking.

**Sensitivity.** The active set also decides how the answer reacts to small changes. If the wind shifts a little and the same constraints stay active, the best trajectory moves smoothly, and the multipliers tell you by how much. If a constraint switches from inactive to active — a burn that did not touch the throttle limit now hits it — the structure of the answer changes, and there is a kink. Guidance designers watch for these kinks, because a controller tracking a reference trajectory feels them as sudden changes in behavior.

**Convergence.** KKT is what a solver *checks* to decide it is done. Interior-point and SQP methods iterate until the KKT residuals — the size of the stationarity equation, the constraint violations, and the products $\lambda_i g_i$ — are all below tolerance. When a landing algorithm declares a solution, it is declaring that these four conditions hold to within about $10^{-8}$.

## Check yourself

::: check
Minimize $f(\mathbf{x}) = \mathbf{c}^\top\mathbf{x}$ over the unit sphere $\|\mathbf{x}\|^2 = 1$, for a fixed nonzero vector $\mathbf{c} \in \mathbb{R}^n$. Use a Lagrange multiplier to find the minimizer and the optimal value.
:::

::: answer
Take $h(\mathbf{x}) = \|\mathbf{x}\|^2 - 1$, whose gradient is $2\mathbf{x}$. Stationarity: $\mathbf{c} + 2\nu\mathbf{x} = \mathbf{0}$, so $\mathbf{x} = -\mathbf{c}/(2\nu)$.

Feasibility: $\|\mathbf{x}\| = \|\mathbf{c}\|/(2|\nu|) = 1$, so $\nu = \pm\|\mathbf{c}\|/2$.

That gives two stationary points, $\mathbf{x} = \mp\mathbf{c}/\|\mathbf{c}\|$, with $f = \mp\|\mathbf{c}\|$. The minimizer is $\mathbf{x}^\star = -\mathbf{c}/\|\mathbf{c}\|$ (pointing straight against $\mathbf{c}$), with $p^\star = -\|\mathbf{c}\|$ and $\nu = \|\mathbf{c}\|/2 > 0$. The other point is the constrained *maximum*, which satisfies the same first-order conditions — a reminder that stationarity alone cannot tell them apart.
:::

::: check
A solver returns an answer in which constraint $g_4 \le 0$ has $g_4(\mathbf{x}^\star) = -0.3$ and multiplier $\lambda_4 = 1.7$. What is wrong?
:::

::: answer
Complementary slackness requires $\lambda_4 g_4 = 0$, but here the product is $1.7 \times (-0.3) = -0.51$. The constraint has $0.3$ of slack, so it is inactive, yet its multiplier is nonzero. That cannot happen at a KKT point.

Possible causes: the solver has not converged (interior-point methods keep both numbers slightly nonzero until the last iterations), the multiplier belongs to a different constraint, or the sign convention was misread. Check the solver's KKT residual before trusting anything else in the output.
:::

::: check
A fuel-optimal ascent has an active **[[dynamic-pressure|max-q]]** limit $q \le 35\,\mathrm{kPa}$ with multiplier $\lambda = 12\,\mathrm{kg/kPa}$. The structures team offers to certify the vehicle to $36\,\mathrm{kPa}$. About how much propellant does that save, and what are you assuming?
:::

::: answer
The shadow-price relation $\partial p^\star/\partial b = -\lambda$ predicts a saving of about $12\,\mathrm{kg/kPa} \times 1\,\mathrm{kPa} = 12\,\mathrm{kg}$.

The assumption is that the change is small enough that the same constraints stay active and the straight-line estimate holds. Loosening $35\,\mathrm{kPa}$ by $1\,\mathrm{kPa}$ is about a $3\%$ change, so the estimate should be good to a few percent — but re-solving is the honest check. If a different limit becomes active first (a heating limit, say), the real saving will be smaller than predicted.
:::

::: check
Minimize $f(x_1, x_2) = x_1^2 + 2x_2^2$ subject to $x_1 + x_2 \ge 3$. Find the KKT point and its multiplier, then check the shadow-price formula by working out $p^\star(b)$ for the constraint $x_1 + x_2 \ge b$.
:::

::: answer
**Standard form.** $g = 3 - x_1 - x_2 \le 0$. The unconstrained minimizer is the origin, which breaks the constraint, so $g$ is active.

**Stationarity.** $\nabla f + \lambda\nabla g = (2x_1, 4x_2) + \lambda(-1, -1) = \mathbf{0}$, so $x_1 = \lambda/2$ and $x_2 = \lambda/4$.

**Feasibility.** $x_1 + x_2 = 3$ gives $3\lambda/4 = 3$, so $\lambda = 4 \ge 0$, $\mathbf{x}^\star = (2, 1)$ and $p^\star = 4 + 2 = 6$.

**Shadow price.** For a general $b$ the same steps give $x_1 = 2b/3$ and $x_2 = b/3$, so $p^\star(b) = 4b^2/9 + 2b^2/9 = 2b^2/3$. Then $dp^\star/db = 4b/3$, which is $4$ at $b = 3$. Here raising $b$ *tightens* the constraint (it is a $\ge$ rule), so the cost rises at the rate $\lambda = 4$ per unit: the same shadow price, with the sign following the direction of loosening.
:::

::: check
Why do the inequality multipliers need $\lambda_i \ge 0$, while the equality multipliers $\nu_j$ can have either sign?
:::

::: answer
An inequality $g_i \le 0$ can only be broken in one direction. At a minimizer the objective must either push outward through that boundary or not touch it, which forces $-\nabla f$ to point along $+\nabla g_i$: $\lambda_i \ge 0$.

An equality $h_j = 0$ can be broken in either direction, and both are forbidden. So the objective may push either way against it, and $\nabla f$ only needs to be some multiple of $\nabla h_j$, of either sign. Another way to see it: $h_j = 0$ is the pair $h_j \le 0$ and $-h_j \le 0$, each with a nonnegative multiplier, and $\nu_j$ is their difference.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| $\mathcal{L}(\mathbf{x},\boldsymbol{\lambda},\boldsymbol{\nu}) = f + \sum_i\lambda_i g_i + \sum_j \nu_j h_j$ | The Lagrangian |
| $\nabla f + \sum_i\lambda_i\nabla g_i + \sum_j\nu_j\nabla h_j = \mathbf{0}$ | KKT stationarity: the gradients balance |
| $g_i \le 0$, $h_j = 0$ | Primal feasibility |
| $\lambda_i \ge 0$ | Dual feasibility (equality multipliers have no sign rule) |
| $\lambda_i g_i = 0$ | Complementary slackness: inactive constraints have zero multiplier |
| LICQ | Constraint gradients linearly independent; makes KKT necessary |
| $\partial p^\star/\partial b_i = -\lambda_i$ | Shadow price: cost saved per unit of loosening constraint $i$ |
| $\mathbf{u}^\star = \mathbf{A}^\top(\mathbf{A}\mathbf{A}^\top)^{-1}\mathbf{b}$ | Minimum-norm solution of $\mathbf{A}\mathbf{u} = \mathbf{b}$, from Lagrange multipliers |
| Active set | The inequalities holding with equality at the answer; $2^m$ possible guesses |

KKT is necessary for a local minimum of any smooth problem, but sufficient for none without more structure. The next lesson starts building that structure — convex sets and convex functions — and the one after shows that for a convex problem every KKT point is a global minimizer, which is what lets a landing algorithm trust the first answer it finds.

::: context lagrange-history Where multipliers came from
Joseph-Louis Lagrange, an Italian-born mathematician working in Berlin and Paris, used these multipliers in his 1788 book on mechanics. His problem was a physical one: how does a body move when it is forced to stay on a surface or at the end of a rod? The multiplier turned out to be the size of the force the constraint exerts — the push of the rod or the surface. That is still the best way to think of it: $\nu\,\nabla h$ is the force the rule applies to keep you on it.
:::

::: context reaction-wheel Turning a spacecraft without fuel
A **reaction wheel** is a heavy flywheel driven by an electric motor. Speed the wheel up one way and the spacecraft turns the other way, because the total spin of the two together cannot change. Space telescopes and most satellites point this way, using electricity from their solar panels instead of propellant. Spacecraft often carry more wheels than they strictly need — three or four for three axes — so that one can fail without ending the mission.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <circle cx="180" cy="100" r="8" fill="#1f2a44"/>
  <line x1="180" y1="100" x2="250" y2="100" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="258,100 248,95 248,105" fill="#1d6fd1"/>
  <line x1="180" y1="100" x2="145" y2="39.4" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="141,32.5 141.3,43.7 150,38.7" fill="#1d6fd1"/>
  <line x1="180" y1="100" x2="145" y2="160.6" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="141,167.5 150,161.3 141.3,156.3" fill="#1d6fd1"/>
  <line x1="180" y1="100" x2="234" y2="73" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="241.2,69.4 229.6,70.8 234.1,79.7" fill="#b4232c"/>
  <text x="264" y="104" font-size="12" fill="#1d6fd1">wheel 1 (0°)</text>
  <text x="104" y="28" font-size="12" fill="#1d6fd1">wheel 2 (120°)</text>
  <text x="104" y="186" font-size="12" fill="#1d6fd1">wheel 3 (240°)</text>
  <text x="246" y="62" font-size="12" fill="#b4232c">wanted torque b</text>
</svg>
```

The blue arrows are the three wheel axes in the example; the red arrow is the requested torque $(1.0, 0.5)\,\mathrm{N\,m}$.
:::

::: context pseudoinverse The shortest of many answers
When a system $\mathbf{A}\mathbf{u} = \mathbf{b}$ has more unknowns than equations, it has a whole line or plane of solutions. The **pseudoinverse** picks the one closest to zero — the shortest vector that still does the job. Mathematicians E. H. Moore and Roger Penrose worked it out independently, decades apart, which is why it is often called the Moore–Penrose inverse. Control engineers use it constantly to share a command among more actuators than strictly needed: thrusters, wheels, control surfaces.
:::

::: context active-set-count Why guessing gets out of hand
Each inequality is either active or inactive: two options. With $m$ inequalities there are $2 \times 2 \times \dots \times 2 = 2^m$ combinations. Ten constraints give $1{,}024$ guesses. Twenty give $1{,}048{,}576$. A landing problem with a few hundred throttle limits has more combinations than there are atoms in the observable universe. Good solvers never try them all; they move from guess to guess cleverly, or, like interior-point methods, avoid guessing altogether.
:::

::: context kkt-names Three names, twelve years apart
William Karush wrote down these conditions in his 1939 master's thesis at the University of Chicago, but it was never published and went unnoticed. Harold Kuhn and Albert Tucker found them again and published them in 1951, and for years they were called the Kuhn–Tucker conditions. Once Karush's thesis came to light, his name was added to the front. It is a good reminder that the same idea is often discovered more than once.
:::

::: context projection-picture The closest point, drawn
The circles are level curves of $f$, the squared distance from $(3, 2)$. The shaded triangle is the feasible set. The smallest circle that still reaches the triangle touches the edge $x + y = 2$ at $(1.5, 0.5)$. There the circle and the edge kiss, and the outward arrow of the edge, $\nabla g_1 = (1, 1)$, points the same way as $-\nabla f = (3, 3)$. That is stationarity with $\lambda_1 = 3$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="170" x2="280" y2="170" stroke="#6c7a93" stroke-width="1"/>
  <line x1="55" y1="185" x2="55" y2="20" stroke="#6c7a93" stroke-width="1"/>
  <polygon points="55,170 155,170 55,70" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <g fill="none" stroke="#f2b880" stroke-width="1.5">
    <circle cx="205" cy="70" r="40"/>
    <circle cx="205" cy="70" r="75"/>
    <circle cx="205" cy="70" r="106.07"/>
  </g>
  <circle cx="205" cy="70" r="4" fill="#1f2a44"/>
  <circle cx="130" cy="145" r="4" fill="#b4232c"/>
  <line x1="130" y1="145" x2="148.2" y2="126.8" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="153.9,121.1 143.3,124.7 150.3,131.7" fill="#1d6fd1"/>
  <text x="212" y="64" font-size="12" fill="#1f2a44">(3, 2)</text>
  <text x="160" y="160" font-size="12" fill="#b4232c">(1.5, 0.5)</text>
  <text x="160" y="118" font-size="11" fill="#1d6fd1">∇g₁</text>
  <text x="70" y="150" font-size="11" fill="#1f2a44">feasible</text>
</svg>
```
:::

::: context shadow-price-picture The shadow price is a slope
For the triangle example, loosen the edge to $x + y \le b$. The best squared distance is $p^\star(b) = (5 - b)^2/2$ until $b = 5$, where the target $(3, 2)$ itself becomes feasible and the cost drops to zero. The red line is the tangent at $b = 2$: its slope is $-3$, which is $-\lambda_1$. Past $b = 5$ the constraint is inactive, the curve is flat, and the multiplier is zero.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="180" x2="340" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="180" x2="50" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="50.0,20.0 61.2,35.6 72.4,50.4 83.6,64.4 94.8,77.6 106.0,90.0 117.2,101.6 128.4,112.4 139.6,122.4 150.8,131.6 162.0,140.0 173.2,147.6 184.4,154.4 195.6,160.4 206.8,165.6 218.0,170.0 229.2,173.6 240.4,176.4 251.6,178.4 262.8,179.6 274.0,180.0 330.0,180.0"/>
  <line x1="50" y1="30" x2="190" y2="180" stroke="#b4232c" stroke-width="1.8" stroke-dasharray="5 4"/>
  <circle cx="106" cy="90" r="4" fill="#b4232c"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="196">1</text><text x="106" y="196">2</text><text x="162" y="196">3</text>
    <text x="218" y="196">4</text><text x="274" y="196">5</text><text x="330" y="196">6</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="44" y="184">0</text><text x="44" y="104">4</text><text x="44" y="24">8</text>
  </g>
  <text x="112" y="84" font-size="12" fill="#b4232c">slope −3 at b = 2</text>
  <text x="300" y="170" font-size="12" text-anchor="middle" fill="#1d6fd1">inactive: λ = 0</text>
  <text x="195" y="208" font-size="11" text-anchor="middle" fill="#1f2a44">bound b</text>
  <text x="58" y="14" font-size="11" fill="#1f2a44">p*(b)</text>
</svg>
```
:::

::: context ipopt A workhorse solver
IPOPT, short for Interior Point OPTimizer, is a free, open-source solver for large nonlinear problems, written by Andreas Wächter and Lorenz Biegler and described in a 2006 paper. It is widely used for trajectory optimization, including ascent and entry studies. Because it handles lower and upper bounds on variables specially, it hands back separate multipliers for each side, which is exactly where sign confusion creeps in. Lesson 11 looks at it in detail.
:::

::: context costates Costates: prices that change over time
In a trajectory problem there is one dynamics constraint per time step, so there is one multiplier per step, and together they form a signal that changes along the flight. Optimal control calls it the **costate**. Read as a shadow price, the costate at time $t$ says how much the final cost would change if the state were nudged at that moment. Lev Pontryagin and his students in Moscow built the continuous-time theory in the 1950s, and the attitude and guidance modules use it again.
:::

::: context max-q The hardest squeeze on ascent
**Dynamic pressure**, $q = \tfrac{1}{2}\rho v^2$, measures how hard the air pushes on a vehicle moving at speed $v$ through air of density $\rho$. Early in ascent the rocket speeds up faster than the air thins, so $q$ climbs; later the thinning air wins and $q$ falls. The peak, called **max Q**, usually comes about a minute or so after lift-off, and it is where the structure feels the largest aerodynamic loads. Many rockets throttle down briefly to pass through it gently — a constraint that costs propellant, which is exactly what its multiplier measures.
:::
