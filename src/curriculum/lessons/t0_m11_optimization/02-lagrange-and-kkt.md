---
id: l02-lagrange-and-kkt
title: Constrained optimisation: Lagrange multipliers and the KKT conditions
minutes: 26
covers:
  - constrained optimisation and Lagrange multipliers
  - KKT conditions
---

The previous lesson minimised a function with nothing in the way. Real guidance problems are nothing but things in the way. A landing burn must end at the pad with zero velocity – equality constraints. The engine cannot produce more than its rated thrust, the vehicle must stay above the glide slope, the throttle cannot drop below its minimum – inequality constraints. The objective, propellant, is almost an afterthought; the constraints are where the physics lives, and the optimal solution is usually pinned against several of them at once.

This lesson builds the conditions that a constrained minimiser must satisfy. They are called the Karush–Kuhn–Tucker (KKT) conditions, and they generalise "the gradient vanishes" to "the gradient is balanced by the constraints". The balancing coefficients are the Lagrange multipliers, and they turn out to be more than bookkeeping: a multiplier is the price of a constraint, the number that tells you how much propellant one more newton of thrust would have saved. Every solver in the rest of the module – interior-point, SQP, IPOPT – is at heart a method for finding a point that satisfies KKT.

Throughout, the problem is the standard form of lesson 1: minimise $f(\mathbf{x})$ over $\mathbf{x} \in \mathbb{R}^n$ subject to $g_i(\mathbf{x}) \le 0$ for $i = 1,\dots,m$ and $h_j(\mathbf{x}) = 0$ for $j = 1,\dots,p$, with every function continuously differentiable.

## Equality constraints: the gradient must be balanced

Start with a single equality constraint, $h(\mathbf{x}) = 0$, which defines a surface in $\mathbb{R}^n$. Suppose $\mathbf{x}^\star$ is a local minimiser of $f$ on that surface. Move along the surface in any direction $\mathbf{d}$ tangent to it. Tangent means the constraint value does not change to first order, $\nabla h(\mathbf{x}^\star)^\top\mathbf{d} = 0$. If $f$ decreased along such a $\mathbf{d}$, that is if $\nabla f(\mathbf{x}^\star)^\top \mathbf{d} < 0$, you could slide a little way along the surface and reduce $f$ while staying feasible, contradicting minimality. The same argument with $-\mathbf{d}$ rules out $\nabla f^\top\mathbf{d} > 0$. So $\nabla f(\mathbf{x}^\star)^\top \mathbf{d} = 0$ for every tangent direction: the gradient of $f$ is orthogonal to the tangent plane.

The tangent plane is exactly the set of vectors orthogonal to $\nabla h(\mathbf{x}^\star)$. A vector orthogonal to that whole plane must be parallel to $\nabla h$. Therefore there is a scalar $\nu$ with

$$
\nabla f(\mathbf{x}^\star) + \nu\,\nabla h(\mathbf{x}^\star) = \mathbf{0}.
$$

That scalar is the **Lagrange multiplier** for the constraint. Geometrically, the level set of $f$ through $\mathbf{x}^\star$ is tangent to the constraint surface: the two surfaces kiss, and their normals line up.

With $p$ equality constraints the tangent space is the set of $\mathbf{d}$ orthogonal to all of $\nabla h_1, \dots, \nabla h_p$, and the same reasoning puts $\nabla f$ in the span of the constraint gradients:

$$
\nabla f(\mathbf{x}^\star) + \sum_{j=1}^{p} \nu_j\,\nabla h_j(\mathbf{x}^\star) = \mathbf{0}.
$$

The argument needs one technical assumption: that the tangent directions of the surface really are the vectors orthogonal to the constraint gradients, which holds when those gradients are linearly independent at $\mathbf{x}^\star$. This is the **linear independence constraint qualification (LICQ)**. It fails at points where the constraint surface is degenerate – for instance $h(x) = x^2 = 0$ has $\nabla h = 0$ at its only feasible point, and no multiplier can balance a nonzero $\nabla f$ there.

It is convenient to package everything into one function, the **Lagrangian**

$$
\mathcal{L}(\mathbf{x}, \boldsymbol{\nu}) = f(\mathbf{x}) + \sum_{j=1}^{p} \nu_j\,h_j(\mathbf{x}) .
$$

The condition above is $\nabla_{\mathbf{x}}\mathcal{L} = \mathbf{0}$, and $\nabla_{\boldsymbol{\nu}}\mathcal{L} = \mathbf{0}$ recovers the constraints $h_j = 0$. So a constrained minimiser is a stationary point of the Lagrangian with respect to both arguments: $n + p$ equations in $n + p$ unknowns.

::: example Minimum-norm control allocation
A spacecraft has three reaction wheels whose spin axes lie in the body $xy$-plane at $0^\circ$, $120^\circ$ and $240^\circ$. A wheel torque $u_k$ (in $\mathrm{N\,m}$) produces a body torque $u_k$ along its axis. The attitude controller asks for a body torque $\mathbf{b} = (1.0, 0.5)\,\mathrm{N\,m}$ about $x$ and $y$; the wheels have one more degree of freedom than the request, so infinitely many $\mathbf{u}$ work. The natural tie-breaker is the smallest total effort, $f(\mathbf{u}) = \tfrac{1}{2}\|\mathbf{u}\|^2$, subject to $\mathbf{A}\mathbf{u} = \mathbf{b}$ with

$$
\mathbf{A} = \begin{bmatrix} 1 & -\tfrac{1}{2} & -\tfrac{1}{2} \\ 0 & \tfrac{\sqrt{3}}{2} & -\tfrac{\sqrt{3}}{2} \end{bmatrix}.
$$

Lagrangian: $\mathcal{L} = \tfrac{1}{2}\mathbf{u}^\top\mathbf{u} + \boldsymbol{\nu}^\top(\mathbf{A}\mathbf{u} - \mathbf{b})$. Stationarity in $\mathbf{u}$ gives $\mathbf{u} + \mathbf{A}^\top\boldsymbol{\nu} = \mathbf{0}$, so $\mathbf{u} = -\mathbf{A}^\top\boldsymbol{\nu}$. Substitute into the constraint: $-\mathbf{A}\mathbf{A}^\top\boldsymbol{\nu} = \mathbf{b}$. For this symmetric wheel layout $\mathbf{A}\mathbf{A}^\top = 1.5\,\mathbf{I}$, so $\boldsymbol{\nu} = -\mathbf{b}/1.5 = (-0.667, -0.333)$ and

$$
\mathbf{u}^\star = \tfrac{2}{3}\mathbf{A}^\top\mathbf{b} = (0.667,\ -0.0447,\ -0.622)\,\mathrm{N\,m}, \qquad \|\mathbf{u}^\star\| = 0.913\,\mathrm{N\,m},\qquad f^\star = 0.417 .
$$

Check: $\mathbf{A}\mathbf{u}^\star = (1.0, 0.5)$. Compare the obvious alternative of leaving wheel 3 idle and solving the remaining $2\times 2$ system: $\mathbf{u} = (1.289, 0.577, 0)$ with $f = 0.997$, more than twice the effort. The formula $\mathbf{u}^\star = \mathbf{A}^\top(\mathbf{A}\mathbf{A}^\top)^{-1}\mathbf{b}$ is the minimum-norm solution of an underdetermined system – the pseudoinverse – and Lagrange multipliers are the shortest route to it.
:::

## Inequality constraints: active, inactive and the sign of the multiplier

An inequality $g(\mathbf{x}) \le 0$ behaves in one of two ways at a minimiser. If $g(\mathbf{x}^\star) < 0$ the constraint is **inactive**: there is slack, a small neighbourhood of $\mathbf{x}^\star$ is still feasible, and the constraint might as well not exist. If $g(\mathbf{x}^\star) = 0$ the constraint is **active**: the solution sits on its boundary.

An inactive constraint contributes nothing to the balance of gradients, so its multiplier is zero. An active constraint acts like an equality constraint, with one extra restriction. Consider the boundary surface $g = 0$ and the feasible side $g < 0$. Directions $\mathbf{d}$ with $\nabla g^\top\mathbf{d} < 0$ point into the feasible region; you are allowed to move that way. Along the boundary, the equality argument gives $\nabla f + \lambda\nabla g = \mathbf{0}$ for some $\lambda$. Now take $\mathbf{d} = -\nabla g$, a step into the interior. The change in $f$ is $\nabla f^\top\mathbf{d} = -\lambda\nabla g^\top\mathbf{d} = \lambda\|\nabla g\|^2$. If $\lambda < 0$ this is negative: stepping off the boundary into the feasible interior would reduce $f$, so $\mathbf{x}^\star$ was not a minimiser. Hence

$$
\lambda \ge 0 .
$$

The sign has a physical reading. At a minimiser $-\nabla f$ is the direction the objective wants to go; the condition $-\nabla f = \lambda\nabla g$ with $\lambda \ge 0$ says the objective is pushing *outward* through the constraint, and the constraint is pushing back. A negative multiplier would mean the objective wants to move away from the boundary, in which case the constraint should not have been active.

Both cases are summarised by a single equation. Either $\lambda = 0$ (inactive) or $g = 0$ (active), so in every case

$$
\lambda_i\,g_i(\mathbf{x}^\star) = 0 .
$$

This is **complementary slackness**. It is the reason inequality-constrained problems are combinatorial in nature: to solve one directly you would have to guess which constraints are active, and there are $2^m$ possible guesses.

## The KKT conditions

Putting everything together for the full standard-form problem, with Lagrangian

$$
\mathcal{L}(\mathbf{x}, \boldsymbol{\lambda}, \boldsymbol{\nu}) = f(\mathbf{x}) + \sum_{i=1}^{m}\lambda_i\,g_i(\mathbf{x}) + \sum_{j=1}^{p}\nu_j\,h_j(\mathbf{x}),
$$

the **Karush–Kuhn–Tucker conditions** at a point $\mathbf{x}^\star$ with multipliers $\boldsymbol{\lambda}^\star, \boldsymbol{\nu}^\star$ are:

1. **Stationarity**: $\nabla f(\mathbf{x}^\star) + \sum_i \lambda_i^\star \nabla g_i(\mathbf{x}^\star) + \sum_j \nu_j^\star \nabla h_j(\mathbf{x}^\star) = \mathbf{0}$.
2. **Primal feasibility**: $g_i(\mathbf{x}^\star) \le 0$ for all $i$ and $h_j(\mathbf{x}^\star) = 0$ for all $j$.
3. **Dual feasibility**: $\lambda_i^\star \ge 0$ for all $i$.
4. **Complementary slackness**: $\lambda_i^\star\,g_i(\mathbf{x}^\star) = 0$ for all $i$.

The theorem: if $\mathbf{x}^\star$ is a local minimiser and a constraint qualification such as LICQ holds at $\mathbf{x}^\star$, then multipliers exist making all four conditions true. KKT is *necessary*. It is not in general sufficient: a constrained saddle point or maximum can satisfy KKT too, exactly as $\nabla f = 0$ does not by itself certify an unconstrained minimum. The second-order condition is that the Hessian of the Lagrangian, $\nabla^2_{\mathbf{xx}}\mathcal{L}$, be positive semidefinite on the tangent space of the active constraints. The next lessons show that for convex problems KKT becomes necessary *and* sufficient, and that is one of the three gifts of convexity.

::: key The KKT conditions
For $\min f$ s.t. $g_i \le 0$, $h_j = 0$: stationarity $\nabla f + \sum_i \lambda_i \nabla g_i + \sum_j \nu_j \nabla h_j = 0$; primal feasibility $g_i \le 0$, $h_j = 0$; dual feasibility $\lambda_i \ge 0$; complementary slackness $\lambda_i g_i = 0$. Equality multipliers $\nu_j$ have no sign restriction; inequality multipliers $\lambda_i$ are nonnegative and vanish on inactive constraints.
:::

Solving a KKT system by hand is a case analysis over active sets: guess which inequalities are active, treat them as equalities, solve the resulting Lagrange system, then check that the multipliers you found are nonnegative and that the constraints you assumed inactive really are satisfied. If either check fails, change the guess.

::: example A projection with three inequality constraints
Find the point of the triangle $x + y \le 2$, $x \ge 0$, $y \ge 0$ closest to $(3, 2)$, that is minimise $f(x, y) = (x-3)^2 + (y-2)^2$. Write the constraints as $g_1 = x + y - 2 \le 0$, $g_2 = -x \le 0$, $g_3 = -y \le 0$.

The unconstrained minimiser $(3, 2)$ violates $g_1$, so something is active. Guess that only $g_1$ is active. Stationarity: $\nabla f + \lambda_1\nabla g_1 = (2(x-3) + \lambda_1,\ 2(y-2) + \lambda_1) = \mathbf{0}$, so $x - 3 = y - 2$, i.e. $x - y = 1$. With $x + y = 2$ this gives $(x, y) = (1.5, 0.5)$ and $\lambda_1 = -2(1.5 - 3) = 3$.

Check the rest: $\lambda_1 = 3 \ge 0$ (dual feasibility holds), $g_2 = -1.5 < 0$ and $g_3 = -0.5 < 0$ (the other constraints are inactive as assumed, with $\lambda_2 = \lambda_3 = 0$), and complementary slackness holds because $g_1 = 0$. Every KKT condition is satisfied, and $f^\star = 1.5^2 + 1.5^2 = 4.5$.

Had the guess failed – say a multiplier had come out negative – you would drop that constraint from the active set and try again. A wrong guess of "$g_1$ and $g_3$ active" gives the vertex $(2, 0)$ with stationarity $(-2 + \lambda_1,\ -4 + \lambda_1 - \lambda_3) = \mathbf{0}$, hence $\lambda_1 = 2$ and $\lambda_3 = -2 < 0$: dual feasibility fails, so $(2,0)$ is not the minimiser, and the negative sign says $f$ would drop by moving off the $y = 0$ edge into the interior – which is exactly what happens, since $f(2, 0) = 5 > 4.5$.
:::

## What a multiplier means: the shadow price

Suppose the constraint is $g(\mathbf{x}) \le b$ instead of $g(\mathbf{x}) \le 0$, and let $p^\star(b)$ be the optimal value as a function of the bound. Increasing $b$ relaxes the constraint, so $p^\star(b)$ can only go down or stay put. How fast?

Write the constraint as $\tilde g(\mathbf{x}) = g(\mathbf{x}) - b \le 0$. At the optimum $\mathbf{x}^\star(b)$ the constraint is active, $g(\mathbf{x}^\star(b)) = b$, and stationarity gives $\nabla f = -\lambda\nabla g$. Differentiate $p^\star(b) = f(\mathbf{x}^\star(b))$ with respect to $b$:

$$
\frac{dp^\star}{db} = \nabla f^\top\frac{d\mathbf{x}^\star}{db} = -\lambda\,\nabla g^\top\frac{d\mathbf{x}^\star}{db} = -\lambda\,\frac{d}{db}\,g(\mathbf{x}^\star(b)) = -\lambda\,\frac{d}{db}\,b = -\lambda .
$$

So

$$
\frac{\partial p^\star}{\partial b_i} = -\lambda_i .
$$

Relaxing constraint $i$ by one unit reduces the optimal cost by $\lambda_i$ units. This is the multiplier's real meaning: it is the **shadow price** of the constraint, the marginal value of loosening it. An inactive constraint has $\lambda_i = 0$ and, consistently, relaxing it changes nothing. The same computation for an equality constraint $h_j(\mathbf{x}) = c_j$ gives $\partial p^\star/\partial c_j = -\nu_j$, which is why equality multipliers can have either sign: pushing a target one way may cost fuel, pushing it the other way may save it.

In the projection example, $\lambda_1 = 3$ predicts that moving the edge to $x + y \le 2.01$ should lower $f^\star$ by about $0.03$. The exact new optimum is $f^\star(2.01) = 4.4700$, a drop of $0.02995$ – the prediction is off only at second order.

::: key Physical meaning of a Lagrange multiplier
A multiplier on an active constraint is its shadow price: the rate at which the optimal cost improves per unit relaxation of that constraint, $\partial p^\star / \partial b_i = -\lambda_i$. A multiplier on a thrust bound tells you how much fuel one more newton would save; a zero multiplier means the constraint is not binding and could be dropped without changing the answer.
:::

::: note Multipliers carry units
Since $\lambda_i = -\partial p^\star/\partial b_i$, a multiplier has the units of the objective divided by the units of the constraint. In a fuel-optimal landing with propellant in kilograms and a thrust bound in newtons, the multiplier on the thrust bound is in $\mathrm{kg/N}$. If the objective is a dimensionless normalised cost, so is the multiplier's numerator. Get in the habit of reading a solver's multiplier output with units attached; it turns a diagnostic dump into an engineering sensitivity study for free.
:::

::: warning Sign conventions differ between books and solvers
This module writes inequalities as $g_i \le 0$ and adds $+\lambda_i g_i$ to the Lagrangian, so $\lambda_i \ge 0$. Some texts write $g_i \ge 0$ and subtract; others write the Lagrangian with a minus sign throughout. Solver interfaces are worse: IPOPT reports multipliers for lower and upper bounds separately, and some codes return the negative of what is derived here. The invariant is complementary slackness and the shadow-price relation. If a multiplier from a solver has a sign that makes "relaxing the constraint lowers the cost" come out backwards, the convention is flipped, not the physics.
:::

## Where KKT shows up on a vehicle

A powered-descent problem discretised over $N$ steps has state and thrust variables at each step, dynamics as equality constraints, and thrust magnitude bounds as inequality constraints. Its KKT conditions are the discrete-time version of what optimal control calls the necessary conditions of Pontryagin's principle: the equality multipliers $\boldsymbol{\nu}$ on the dynamics are the **costates**, the stationarity condition in the controls is the minimisation of a Hamiltonian at each step, and complementary slackness on the thrust bounds is what forces the thrust to sit at its maximum or minimum whenever the bound's multiplier is nonzero. When you later read that a minimum-fuel thrust profile is bang-bang, that is complementary slackness speaking.

The active set also decides how a solution responds to perturbations. If the wind changes slightly and the same constraints stay active, the optimal trajectory moves smoothly and the multipliers tell you by how much. If a constraint switches from inactive to active, the solution structure changes – a burn that did not touch the throttle limit now saturates – and the map from parameters to solution has a kink there. Guidance designers care about these kinks because a controller that tracks a reference trajectory sees them as sudden changes in behaviour.

Finally, KKT is what a solver *checks* to decide it has converged. Interior-point methods and SQP both iterate until the KKT residuals – the norm of the stationarity equation, the constraint violations, and the complementarity products $\lambda_i g_i$ – are all below tolerance. A solver's "optimality tolerance" is a bound on the KKT residual, and when a landing algorithm declares a solution, it is declaring that these four conditions hold to within about $10^{-8}$.

## Check yourself

::: check
Minimise $f(\mathbf{x}) = \mathbf{c}^\top\mathbf{x}$ over the unit sphere $\|\mathbf{x}\|^2 = 1$, for a fixed nonzero vector $\mathbf{c} \in \mathbb{R}^n$. Use a Lagrange multiplier and identify the minimiser and the optimal value.
:::

::: answer
With $h(\mathbf{x}) = \|\mathbf{x}\|^2 - 1$, stationarity is $\mathbf{c} + 2\nu\mathbf{x} = \mathbf{0}$, so $\mathbf{x} = -\mathbf{c}/(2\nu)$. Feasibility gives $\|\mathbf{c}\|/(2|\nu|) = 1$, so $\nu = \pm\|\mathbf{c}\|/2$. The two stationary points are $\mathbf{x} = \mp\mathbf{c}/\|\mathbf{c}\|$ with $f = \mp\|\mathbf{c}\|$. The minimiser is $\mathbf{x}^\star = -\mathbf{c}/\|\mathbf{c}\|$ with $p^\star = -\|\mathbf{c}\|$ (and $\nu = \|\mathbf{c}\|/2 > 0$); the other point is the constrained maximum, which also satisfies the first-order conditions – a reminder that stationarity alone does not distinguish them.
:::

::: check
A solver returns a solution in which constraint $g_4 \le 0$ has $g_4(\mathbf{x}^\star) = -0.3$ and multiplier $\lambda_4 = 1.7$. What is wrong?
:::

::: answer
Complementary slackness requires $\lambda_4 g_4 = 0$, but here the product is $-0.51$. The constraint is inactive (there is slack of 0.3) yet the multiplier is nonzero, which cannot happen at a KKT point. Either the solver has not converged – interior-point methods keep both quantities slightly nonzero until the final iterations – or the reported multiplier belongs to a different constraint, or the sign convention has been misread. Check the solver's KKT residual before trusting anything else in the output.
:::

::: check
A fuel-optimal ascent has an active dynamic-pressure constraint $q \le 35\,\mathrm{kPa}$ with multiplier $\lambda = 12\,\mathrm{kg/kPa}$. The structures group offers to certify the vehicle to $36\,\mathrm{kPa}$. About how much propellant does that save, and what assumption is being made?
:::

::: answer
The shadow-price relation $\partial p^\star/\partial b = -\lambda$ predicts a saving of about $12\,\mathrm{kg/kPa} \times 1\,\mathrm{kPa} = 12\,\mathrm{kg}$. The assumption is that the perturbation is small enough that the active set does not change and the linearisation holds; a 1 kPa relaxation of a 35 kPa limit is a 3 % change, so the estimate should be good to a few percent, but re-solving is the honest check. If a different constraint becomes active first (a heating limit, say), the saving will be less than predicted.
:::

::: check
Minimise $f(x_1, x_2) = x_1^2 + 2x_2^2$ subject to $x_1 + x_2 \ge 3$. Find the KKT point, the multiplier, and verify the shadow-price formula by computing $p^\star(b)$ for the constraint $x_1 + x_2 \ge b$.
:::

::: answer
Write $g = 3 - x_1 - x_2 \le 0$. The unconstrained minimiser is the origin, which is infeasible, so $g$ is active. Stationarity: $(2x_1, 4x_2) + \lambda(-1, -1) = \mathbf{0}$, so $x_1 = \lambda/2$ and $x_2 = \lambda/4$. Feasibility $x_1 + x_2 = 3$ gives $3\lambda/4 = 3$, so $\lambda = 4 \ge 0$, $\mathbf{x}^\star = (2, 1)$ and $p^\star = 4 + 2 = 6$. For general $b$ the same steps give $x_1 = 2b/3$, $x_2 = b/3$, $p^\star(b) = 4b^2/9 + 2b^2/9 = 2b^2/3$, so $dp^\star/db = 4b/3 = 4$ at $b = 3$. Here increasing $b$ *tightens* the constraint (it is a $\ge$ bound), so the cost rises at rate $\lambda = 4$ per unit – the same shadow price with the sign following the direction of relaxation.
:::

::: check
Why does the KKT stationarity condition contain no sign restriction on the equality multipliers $\nu_j$, while the inequality multipliers must satisfy $\lambda_i \ge 0$?
:::

::: answer
An inequality $g_i \le 0$ can be violated in only one direction, so at a minimiser the objective must be pushing outward through the boundary (or not touching it), which forces $-\nabla f$ to point along $+\nabla g_i$: $\lambda_i \ge 0$. An equality $h_j = 0$ can be left in either direction and both are equally forbidden, so the objective may push either way against it; $\nabla f$ need only lie in the span of $\nabla h_j$, with a coefficient of either sign. Equivalently, $h_j = 0$ is the pair $h_j \le 0$ and $-h_j \le 0$, with two nonnegative multipliers whose difference is $\nu_j$.
:::

## Summary

| Symbol / result | Meaning |
| --- | --- |
| $\mathcal{L}(\mathbf{x},\boldsymbol{\lambda},\boldsymbol{\nu}) = f + \sum_i\lambda_i g_i + \sum_j \nu_j h_j$ | The Lagrangian |
| $\nabla f + \sum_i\lambda_i\nabla g_i + \sum_j\nu_j\nabla h_j = \mathbf{0}$ | KKT stationarity |
| $g_i \le 0$, $h_j = 0$ | Primal feasibility |
| $\lambda_i \ge 0$ | Dual feasibility (equality multipliers unsigned) |
| $\lambda_i g_i = 0$ | Complementary slackness: inactive constraints have zero multiplier |
| LICQ | Constraint gradients linearly independent; makes KKT necessary |
| $\partial p^\star/\partial b_i = -\lambda_i$ | Shadow price: cost saved per unit relaxation of constraint $i$ |
| $\mathbf{u}^\star = \mathbf{A}^\top(\mathbf{A}\mathbf{A}^\top)^{-1}\mathbf{b}$ | Minimum-norm solution of $\mathbf{A}\mathbf{u} = \mathbf{b}$, from Lagrange multipliers |
| Active set | The inequalities holding with equality at the solution; $2^m$ candidates |

KKT is necessary for a local minimum of any smooth problem, and sufficient for none without more structure. The next two lessons supply that structure: for a convex problem every KKT point is a global minimiser, and that single fact is what lets a landing algorithm trust the first answer it finds.
