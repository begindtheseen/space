---
id: l10-sequential-quadratic-programming
title: Sequential quadratic programming
minutes: 30
covers:
  - sequential quadratic programming
---

Not every problem fits a cone. A thruster whose magnitude is fixed and whose direction is the only control gives an equality on a norm, which lesson 6 showed no slack can relax. Aerodynamic drag on a returning booster depends on the square of airspeed, the angle of attack and a lookup table. A six-degree-of-freedom formulation carries a quaternion whose unit-norm constraint is a nonlinear equality by construction. And the free final time – the one variable lesson 6 had to keep out of the SOCP – multiplies the controls in every dynamics equation. Each of these makes the problem a general **nonlinear program** (NLP), and the leading method for solving one is **sequential quadratic programming** (SQP).

The idea is the natural generalisation of Newton's method. Lesson 1 minimised a smooth function by repeatedly building a quadratic model and jumping to its minimum. SQP does the same for a constrained problem: at the current iterate it builds a quadratic model of the Lagrangian and a *linear* model of the constraints, solves the resulting QP – a problem lesson 5 showed how to handle – and takes the solution as a step. It converges quadratically near a solution satisfying the second-order conditions, and it handles inequality constraints naturally because the QP subproblem decides the active set for you.

What it does not do is give any of the guarantees of lesson 9. There is no global optimum, no bound on the iteration count, no certificate. It can converge to a local minimum, to a saddle point, or not at all; the answer depends on where you started. This lesson is honest about that trade, because the decision of whether a guidance problem can be forced into convex form – accepting some conservatism – or must be handed to an NLP is one of the real architectural decisions in a GNC group, and it is made on exactly these grounds.

## Newton's method on the KKT conditions

Take the equality-constrained problem first, since inequalities add bookkeeping but no new idea:

$$
\text{minimise } f(\mathbf{x}) \quad \text{subject to} \quad \mathbf{c}(\mathbf{x}) = \mathbf{0}, \qquad \mathbf{c}: \mathbb{R}^n \to \mathbb{R}^p .
$$

The KKT conditions of lesson 2 are a square system of $n + p$ equations in the $n + p$ unknowns $(\mathbf{x}, \boldsymbol{\lambda})$:

$$
\mathbf{R}(\mathbf{x}, \boldsymbol{\lambda}) = \begin{bmatrix} \nabla f(\mathbf{x}) + \nabla\mathbf{c}(\mathbf{x})^\top\boldsymbol{\lambda} \\ \mathbf{c}(\mathbf{x}) \end{bmatrix} = \mathbf{0},
$$

where $\nabla\mathbf{c}$ is the $p \times n$ Jacobian whose rows are $\nabla c_j^\top$. Apply Newton's method to $\mathbf{R} = \mathbf{0}$. The Jacobian of $\mathbf{R}$ is

$$
\begin{bmatrix} \mathbf{W} & \nabla\mathbf{c}^\top \\ \nabla\mathbf{c} & \mathbf{0}\end{bmatrix}, \qquad
\mathbf{W} = \nabla^2_{\mathbf{xx}}\mathcal{L}(\mathbf{x}, \boldsymbol{\lambda}) = \nabla^2 f(\mathbf{x}) + \sum_{j=1}^p \lambda_j\nabla^2 c_j(\mathbf{x}),
$$

so the Newton step $(\mathbf{d}, \Delta\boldsymbol{\lambda})$ solves

$$
\begin{bmatrix} \mathbf{W} & \nabla\mathbf{c}^\top \\ \nabla\mathbf{c} & \mathbf{0}\end{bmatrix}
\begin{bmatrix} \mathbf{d} \\ \Delta\boldsymbol{\lambda}\end{bmatrix}
= -\begin{bmatrix} \nabla f + \nabla\mathbf{c}^\top\boldsymbol{\lambda} \\ \mathbf{c}\end{bmatrix} .
$$

Now look at that system again. Writing $\boldsymbol{\lambda}^+ = \boldsymbol{\lambda} + \Delta\boldsymbol{\lambda}$ and moving the $\nabla\mathbf{c}^\top\boldsymbol{\lambda}$ term across, it becomes

$$
\mathbf{W}\mathbf{d} + \nabla\mathbf{c}^\top\boldsymbol{\lambda}^+ = -\nabla f, \qquad \nabla\mathbf{c}\,\mathbf{d} = -\mathbf{c},
$$

which is exactly the KKT system of lesson 5 for the quadratic program

$$
\text{minimise}_{\mathbf{d}} \ \nabla f(\mathbf{x})^\top\mathbf{d} + \tfrac{1}{2}\mathbf{d}^\top\mathbf{W}\mathbf{d} \quad \text{subject to} \quad \mathbf{c}(\mathbf{x}) + \nabla\mathbf{c}(\mathbf{x})\,\mathbf{d} = \mathbf{0},
$$

with $\boldsymbol{\lambda}^+$ as its multipliers. Newton's method on the KKT conditions *is* the repeated solution of a QP whose objective is a quadratic model of the Lagrangian and whose constraints are the linearised originals. That equivalence is the whole of SQP, and it tells you where the method's speed and its fragility both come from: it inherits Newton's quadratic local convergence, and Newton's indifference to whether you are near a minimum, a maximum or a saddle.

::: key The SQP subproblem
At the iterate $(\mathbf{x}_k, \boldsymbol{\lambda}_k)$, solve
$$
\min_{\mathbf{d}}\ \nabla f_k^\top\mathbf{d} + \tfrac{1}{2}\mathbf{d}^\top\mathbf{W}_k\mathbf{d} \quad \text{s.t.}\quad \mathbf{c}_{E,k} + \nabla\mathbf{c}_{E,k}\mathbf{d} = \mathbf{0}, \quad \mathbf{c}_{I,k} + \nabla\mathbf{c}_{I,k}\mathbf{d} \le \mathbf{0},
$$
with $\mathbf{W}_k = \nabla^2_{\mathbf{xx}}\mathcal{L}(\mathbf{x}_k, \boldsymbol{\lambda}_k)$. Set $\mathbf{x}_{k+1} = \mathbf{x}_k + \alpha_k\mathbf{d}_k$ and take $\boldsymbol{\lambda}_{k+1}$ from the QP's multipliers. Near a solution at which the second-order sufficient conditions and LICQ hold, full steps $\alpha_k = 1$ converge quadratically and the QP's active set matches the true one.
:::

Two details in that statement earn their place. First, the Hessian is that of the **Lagrangian**, not of the objective. The constraint curvature matters: a step that looks good against a linear model of a curved constraint will leave the feasible surface, and the $\sum_j\lambda_j\nabla^2 c_j$ term is precisely the correction that accounts for it. Using $\nabla^2 f$ alone destroys the quadratic convergence. Second, the QP's inequality constraints let the method choose an active set each iteration; near the solution it identifies the correct one and stops changing it, after which SQP is just Newton on the equality-constrained system.

## Making it converge from a bad guess

Pure Newton steps are excellent near the answer and unreliable far from it. Four mechanisms turn the local method into a usable algorithm.

**A merit function.** Unlike unconstrained minimisation, there is no single quantity that a constrained step is supposed to decrease – reducing $f$ may worsen feasibility and vice versa. A **merit function** combines them, most simply the $\ell_1$ form

$$
\phi(\mathbf{x};\eta) = f(\mathbf{x}) + \eta\,\|\mathbf{c}(\mathbf{x})\|_1 ,
$$

and the step length $\alpha_k$ is chosen by backtracking until $\phi$ decreases sufficiently (the Armijo condition of lesson 1, applied to $\phi$). The penalty weight $\eta$ must exceed the largest multiplier magnitude, or the merit function will happily trade feasibility for objective and the method will walk away from the constraints; practical codes set $\eta \ge \|\boldsymbol{\lambda}\|_\infty + \text{margin}$ and increase it when needed.

**A trust region, or a modified Hessian.** The Lagrangian Hessian $\mathbf{W}_k$ is generally **indefinite** away from the solution, and a QP with an indefinite Hessian is nonconvex and may be unbounded. Two cures: restrict the step to a region $\|\mathbf{d}\| \le \Delta_k$ in which the model is trusted, which makes even an indefinite QP well posed and shrinks $\Delta_k$ when the step disappoints; or convexify, replacing $\mathbf{W}_k$ by $\mathbf{W}_k + \sigma\mathbf{I}$ with $\sigma$ just large enough to make it positive definite on the null space of the active constraint Jacobian. The second is what the worked example below does, and the value of $\sigma$ it needs at the first iterate is not small.

**A filter, instead of a merit function.** A filter accepts a step if it improves either the objective or the constraint violation relative to every previously accepted pair $(f, \|\mathbf{c}\|)$ – a two-objective acceptance test that avoids having to pick $\eta$ at all. IPOPT's line search is a filter; SNOPT uses an augmented-Lagrangian merit function.

**Second-order corrections.** Close to the solution a full SQP step can *increase* the $\ell_1$ merit function even though it is a good step, because the linearised constraints are satisfied while the curved ones are not, and the violation grows quadratically while the objective improves only linearly. The line search then rejects the unit step and destroys the quadratic convergence. This is the **Maratos effect**. The cure is a second-order correction: re-evaluate $\mathbf{c}$ at the trial point and solve a small extra system to add a correction $\hat{\mathbf{d}}$ that removes the quadratic feasibility error, then test $\mathbf{x}_k + \mathbf{d}_k + \hat{\mathbf{d}}_k$.

::: example The SQP subproblem, with numbers
Here is the free-final-time landing that lesson 6 kept out of the SOCP, at its smallest honest size. Vertical descent from $h_0 = 1000\,\mathrm{m}$ at $v_0 = -50\,\mathrm{m/s}$ with $g = 9.80665\,\mathrm{m/s^2}$, two equal steps of length $\tau = T/2$ with thrust accelerations $a_1, a_2 \in [0, 30]\,\mathrm{m/s^2}$ held constant over each. The unknowns are $\mathbf{x} = (a_1, a_2, T)$, the objective is the total impulse $f = (a_1 + a_2)T/2$, and exact integration over each step gives the two terminal conditions

$$
c_1 = v_0 + (a_1 + a_2 - 2g)\frac{T}{2} = 0, \qquad
c_2 = h_0 + v_0 T + \big(3(a_1 - g) + (a_2 - g)\big)\frac{T^2}{8} = 0 .
$$

Both are nonlinear – products of unknowns – so this is an NLP, not an SOCP, and $T$ is a genuine decision variable rather than the outer search of lesson 6.

Start at $\mathbf{x}_0 = (2, 24, 12)$: a guess that burns gently then hard for $12\,\mathrm{s}$. Evaluating, $c_1 = -11.68\,\mathrm{m/s}$ and $c_2 = 233.9\,\mathrm{m}$ – this trajectory ends $234\,\mathrm{m}$ above the pad still falling at $11.7\,\mathrm{m/s}$. The derivatives are

$$
\nabla f = (6,\ 6,\ 13), \qquad
\nabla\mathbf{c} = \begin{bmatrix} 6 & 6 & 3.193 \\ 54 & 18 & -77.68\end{bmatrix} .
$$

With $\boldsymbol{\lambda}_0 = \mathbf{0}$ the Lagrangian Hessian is just $\nabla^2 f$, which has a zero diagonal and $\tfrac{1}{2}$ in the $(a_i, T)$ positions; its eigenvalues are $0$ and $\pm 0.707$ – **indefinite**, so the raw QP is nonconvex. Adding $\sigma\mathbf{I}$ with $\sigma = 1$ gives leading minors $1$, $1$ and $0.5$: positive definite, and the QP is now well posed. Solving it gives

$$
\mathbf{d}_0 = (-1.819,\ 2.524,\ 2.332), \qquad \|\mathbf{d}_0\| = 3.89,
$$

with QP multipliers $(-1.977, 0.1206)$. Check what the step does: it satisfies the *linearised* constraints exactly, $\mathbf{c}_0 + \nabla\mathbf{c}_0\mathbf{d}_0 = \mathbf{0}$ to machine precision, but the new point $\mathbf{x}_1 = (0.181, 26.52, 14.33)$ has true residuals $c_1 = 0.82\,\mathrm{m/s}$ and $c_2 = -28.8\,\mathrm{m}$. That is the method in one picture: each QP solves a straightened version of the problem, and the curvature it ignored becomes the residual that the next QP has to clean up. The residual fell from $234\,\mathrm{m}$ to $29\,\mathrm{m}$ in one step, which is the quadratic model earning its keep.
:::

## Quasi-Newton: BFGS in place of the Hessian

Forming $\nabla^2_{\mathbf{xx}}\mathcal{L}$ means second derivatives of every constraint – for a trajectory problem, second derivatives of the dynamics at every node. Often these are unavailable, expensive, or simply not worth the trouble, and a **quasi-Newton** approximation is used instead. The standard one is BFGS.

Let $\mathbf{s}_k = \mathbf{x}_{k+1} - \mathbf{x}_k$ and $\mathbf{y}_k = \nabla_{\mathbf{x}}\mathcal{L}(\mathbf{x}_{k+1}, \boldsymbol{\lambda}_{k+1}) - \nabla_{\mathbf{x}}\mathcal{L}(\mathbf{x}_k, \boldsymbol{\lambda}_{k+1})$, the change in the Lagrangian gradient at fixed multipliers. A true Hessian would satisfy the **secant condition** $\mathbf{W}\mathbf{s}_k \approx \mathbf{y}_k$, so require the approximation to satisfy it exactly and change as little as possible otherwise. The unique such symmetric rank-two update is

$$
\mathbf{B}_{k+1} = \mathbf{B}_k - \frac{\mathbf{B}_k\mathbf{s}_k\mathbf{s}_k^\top\mathbf{B}_k}{\mathbf{s}_k^\top\mathbf{B}_k\mathbf{s}_k} + \frac{\mathbf{y}_k\mathbf{y}_k^\top}{\mathbf{y}_k^\top\mathbf{s}_k} .
$$

If $\mathbf{y}_k^\top\mathbf{s}_k > 0$ – the curvature condition, which the Wolfe line search of lesson 1 enforces in the unconstrained case – then $\mathbf{B}_{k+1}$ inherits positive definiteness from $\mathbf{B}_k$, so the QP subproblem is always convex. In constrained problems the curvature condition can fail even at good steps, because the Lagrangian genuinely has negative curvature in some directions; Powell's **damping** repairs it by replacing $\mathbf{y}_k$ with $\theta\mathbf{y}_k + (1-\theta)\mathbf{B}_k\mathbf{s}_k$, choosing the smallest $\theta \in (0,1]$ that restores $\mathbf{y}_k^\top\mathbf{s}_k \ge 0.2\,\mathbf{s}_k^\top\mathbf{B}_k\mathbf{s}_k$. For large problems the matrix is never formed at all: **limited-memory BFGS** keeps the last five to twenty $(\mathbf{s}, \mathbf{y})$ pairs and applies the implied operator by a short recursion, which is why an NLP with a hundred thousand variables is tractable at all.

::: key BFGS
Builds an approximate inverse Hessian from successive gradient differences (a rank-two update), giving near-Newton convergence without ever forming or factorising the true Hessian. Exact Newton converges quadratically; BFGS converges superlinearly, and costs one gradient evaluation and a rank-two update per iteration instead of a full second-derivative evaluation.
:::

::: example The full SQP run, and what it says about the landing
Continue the two-step landing from $\mathbf{x}_0 = (2, 24, 12)$ with the exact Lagrangian Hessian (regularised when indefinite), an $\ell_1$ merit line search, and the bounds $0 \le a_i \le 30$ handled inside the QP.

| $k$ | $a_1$ | $a_2$ | $T$ | impulse | $\|\mathbf{c}\|_1$ | $\|\mathbf{d}\|$ | $\alpha$ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | $2.000$ | $24.000$ | $12.000$ | $156.00$ | $2.46\times10^{2}$ | $3.89$ | $1$ |
| 1 | $0.1812$ | $26.524$ | $14.332$ | $191.37$ | $2.96\times10^{1}$ | $3.87\times10^{-1}$ | $1$ |
| 2 | $0.0871$ | $26.674$ | $13.988$ | $187.17$ | $2.77\times10^{-2}$ | $1.45\times10^{-1}$ | $1$ |
| 3 | $0.0000$ | $26.783$ | $13.9477$ | $186.780$ | $1.93\times10^{-2}$ | $1.96\times10^{-4}$ | $1$ |
| 4 | $0$ | $26.7828$ | $13.94788$ | $186.7820$ | $8.6\times10^{-8}$ | $1.07\times10^{-9}$ | $1$ |
| 5 | $0$ | $26.7828$ | $13.94788$ | $186.7820$ | $7\times10^{-15}$ | $2.6\times10^{-15}$ | $1$ |

Six iterations, unit steps throughout, and the last three residuals go $10^{-2}$, $10^{-8}$, $10^{-15}$ – the squaring of the error that says "quadratic convergence". From a worse start, $\mathbf{x}_0 = (5, 20, 10)$, the same code takes eleven iterations and the line search cuts several steps to $\alpha = 0.25$ before the iterates settle; the merit function is doing real work there. Replacing the exact Hessian by damped BFGS from $(2, 24, 12)$ converges in five iterations to the same point – on a problem this small the quasi-Newton approximation loses nothing, and on a large trajectory problem it typically costs a modest number of extra iterations in exchange for never touching a second derivative.

The answer: $a_1 = 0$, $a_2 = 26.783\,\mathrm{m/s^2}$, $T = 13.948\,\mathrm{s}$, total impulse $186.78\,\mathrm{m/s}$. The lower bound $a_1 \ge 0$ is active – the vehicle **coasts through the whole first half and burns in the second**, which is the two-step echo of the coast-then-burn profile lesson 5 derived analytically. The multipliers are $\boldsymbol{\lambda} = (-1.323,\ 0.0926)$ for $\mathcal{L} = f + \lambda_1c_1 + \lambda_2c_2$, and they can be checked independently. Because the active set is known, the solution satisfies $h_0 + 1.5v_0\tau - g\tau^2 = 0$ with $\tau = T/2$, whose root is $\tau = 6.9739\,\mathrm{s}$, giving $a_2 = -v_0/\tau + 2g = 26.783$ and impulse $-v_0 + 2g\tau = 186.78$ – the SQP answer to every digit. Differentiating that closed form, one more metre of initial altitude costs $0.09261\,\mathrm{m/s}$ of impulse, and a finite difference on the closed form gives $0.09261$: exactly $\lambda_2$, the shadow price of lesson 2 appearing where it should.

Finally, compare with the continuous answer of lesson 5 for the same vehicle: $t_f = 13.384\,\mathrm{s}$ and impulse $181.25\,\mathrm{m/s}$. The two-step discretisation is $4.2\,\%$ long and $3.1\,\%$ expensive, because a control held constant over $7\,\mathrm{s}$ cannot put the ignition point where it belongs. That error is the discretisation's, not the optimiser's, and it shrinks as $N$ grows – the reason flight formulations use $50$ to $200$ nodes rather than two.
:::

## What SQP gives up

Lesson 9's interior-point method on a convex problem returns the global optimum with a certificate, in a number of iterations bounded before flight. SQP on a nonconvex problem offers none of that.

- **Local, not global.** The QP subproblem is built from derivatives at the current point; nothing sees the rest of the space. A different start can land on a different local minimum. For a trajectory problem, "different local minimum" can mean a qualitatively different flight path.
- **No iteration bound.** The convergence theory is asymptotic: *near* a solution satisfying second-order conditions, convergence is quadratic. How many iterations it takes to get near, or whether it gets there at all, depends on the data. Codes routinely take five iterations on one case and three hundred on the next.
- **Infeasible subproblems.** The linearised constraints of the QP can be inconsistent even when the true feasible set is not empty, in which case there is no step to take. Production codes enter an **elastic mode**, relaxing the linearised constraints with penalised slacks so that the subproblem is always solvable, and the price of the relaxation reports how badly it was needed.
- **Derivatives are the whole game.** A gradient that is wrong in the sixth digit – a hand-coded Jacobian with a sign error, a finite difference with a badly chosen step – shows up as slow convergence or as convergence to a point that is not a solution. Check every derivative against finite differences or, better, generate them by algorithmic differentiation.

None of this means SQP is unsuitable. It means SQP belongs where its weaknesses are affordable: trajectory design on the ground, where an engineer looks at the answer; mission planning, where hours are available; offline generation of the reference trajectory that an onboard convex solver then tracks or refines. It does not belong in a loop with a hard deadline and nobody watching.

::: warning An NLP solution is not a certificate
SQP terminates when the KKT residual and the constraint violation are below tolerance. That means "this point satisfies the first-order necessary conditions to within tolerance" – and lesson 2 was explicit that KKT is necessary, not sufficient, for a nonconvex problem. The point could be a local minimum, a saddle, or, if the second-order conditions were not checked, a local maximum along some direction. There is no analogue of the dual bound of lesson 7, because the dual of a nonconvex problem generally has a positive gap. The practical discipline is to re-solve from many random starts, compare the objective values, check the second-order conditions on the reduced Hessian, and treat the best answer as the best *found*, never as the best possible.
:::

::: note Sequential convex programming: SQP's convex cousin
Modern powered-descent work often uses a hybrid. **Sequential convex programming** (in guidance, usually the successive-convexification or SCvx family) linearises only the genuinely nonconvex parts of the problem about a reference trajectory and keeps the convex parts – the thrust cone, the glide slope, the throttle slab – exactly as they are, so each subproblem is an SOCP rather than a QP. It adds a trust region on the deviation from the reference, and **virtual controls**: small penalised slacks on the dynamics that guarantee each subproblem is feasible even when the linearisation is poor, curing the artificial infeasibility that plagues plain SQP. Convergence to a point satisfying the original problem's KKT conditions can be proved under stated assumptions, and each iteration is a convex solve with all of lesson 9's properties. This is how six-degree-of-freedom landing with aerodynamics and attitude constraints is solved today: an outer loop that is SQP in spirit around an inner problem that is the SOCP of lesson 6.
:::

## Check yourself

::: check
Why does the SQP subproblem use the Hessian of the Lagrangian rather than the Hessian of the objective? Construct a case where the difference matters.
:::

::: answer
Because the constraints are curved and the subproblem models them as flat. The term $\sum_j\lambda_j\nabla^2c_j$ accounts for the fact that moving along the linearised constraint leaves the true one, and the correct Newton step on the KKT system contains it; dropping it gives a method that still converges, but only linearly. A minimal case: minimise $f = x_1$ subject to $c = x_1^2 + x_2^2 - 1 = 0$, with the solution at $(-1, 0)$ and $\lambda = 1/2$. Here $\nabla^2 f = \mathbf{0}$, so an "SQP" using the objective Hessian solves a *linear* program over a line at every iteration and its step is governed entirely by the linearised circle – it flies off along the tangent. The Lagrangian Hessian is $\lambda\nabla^2c = 2\lambda\mathbf{I} = \mathbf{I}$ at the solution, positive definite, and the correct subproblem is a well-posed QP. The constraint curvature is the only curvature in the problem.
:::

::: check
In the worked example the Lagrangian Hessian at the first iterate is indefinite. What goes wrong if you hand that QP to a solver unchanged, and what are the two standard fixes?
:::

::: answer
An indefinite $\mathbf{W}$ makes the subproblem a nonconvex QP: lesson 5 noted that such a problem is NP-hard in general, and here, concretely, the objective can be driven to $-\infty$ along a direction of negative curvature that stays within the linearised constraints, so the "step" is unbounded or meaningless. The fixes: (1) add a multiple of the identity, $\mathbf{W} + \sigma\mathbf{I}$, with $\sigma$ just large enough for positive definiteness on the null space of the active constraint Jacobian – in the example $\sigma = 1$ sufficed, giving leading minors $1, 1, 0.5$; (2) impose a trust region $\|\mathbf{d}\| \le \Delta$, which bounds the subproblem regardless of the curvature and additionally gives a principled way to shrink the step when the model proves unreliable. Quasi-Newton SQP sidesteps the issue entirely, since damped BFGS keeps $\mathbf{B}_k$ positive definite by construction.
:::

::: check
A colleague's SQP converges in twelve iterations from one initial guess and stalls at a constraint violation of $10^{-3}$ from another. List the things you would check, in order.
:::

::: answer
First, the derivatives: compare the analytic Jacobian and gradient with central finite differences at the stalling iterate. A wrong derivative is by far the most common cause and it is cheap to rule out. Second, scaling: if the variables differ by many orders of magnitude – metres beside radians beside seconds – the QP is badly conditioned and the merit function's units are dominated by one group; rescale so a unit change in each variable is comparably significant. Third, whether the stall is a Maratos effect: if unit steps are being rejected while the KKT residual is small, add a second-order correction or switch to a filter. Fourth, whether the linearised subproblem is infeasible at that point, which needs elastic mode rather than a better step. Fifth, and only then, whether the second guess is simply in the basin of a different, worse, or nonexistent solution – which is not a bug but the nature of a nonconvex problem.
:::

::: check
The two-step example gives $186.78\,\mathrm{m/s}$ of impulse against the continuous optimum of $181.25$. Why is the discrete answer larger rather than smaller, and what happens as $N$ grows?
:::

::: answer
Both problems have the same feasible physics, but the discrete one restricts the control to two piecewise-constant values, so its feasible set is a subset of the continuous problem's and its optimum can only be worse (larger impulse). The specific loss is that the ignition point must fall on the boundary between the two half-intervals, at $6.97\,\mathrm{s}$, whereas the continuous optimum ignites at $7.34\,\mathrm{s}$; forced to start decelerating early, the vehicle spends longer fighting gravity, and by the identity of lesson 5 the impulse is $-v_0 + gT$, so a longer $T$ costs directly. As $N$ grows the switch can be placed to within $\Delta t$ of its true location and the excess falls roughly in proportion to $\Delta t$: here $3.1\,\%$ at $N = 2$. It is the discretisation, not the optimiser, that is being measured, which is why a convergence study in $N$ should precede any claim about an optimal trajectory.
:::

::: check
Under what circumstances would you choose SQP over the convex formulation of lesson 6 for a landing problem, and what must you then add to the flight software?
:::

::: answer
You would choose it when the physics genuinely cannot be convexified without unacceptable conservatism: aerodynamic forces that depend nonlinearly on state during atmospheric descent, a six-degree-of-freedom formulation with attitude dynamics and a unit-quaternion constraint, a thruster with fixed magnitude and steerable direction, or a free final time that must be optimised rather than searched over. What you must add, because SQP supplies none of it: a hard iteration cap with a defined behaviour when it is hit; an independent feasibility check on the returned trajectory, since a converged NLP is not a certificate; a deterministic initial guess, usually the previous cycle's solution or a precomputed reference, so the answer is reproducible; bounded, statically allocated memory, which general NLP codes do not provide; and a Monte-Carlo campaign large enough to characterise the iteration count over the whole envelope rather than at the nominal point. In practice the sequential convex programming route of the note above is preferred precisely because it keeps most of these properties while handling the nonconvex physics.
:::

## Summary

| Object | Statement |
| --- | --- |
| Problem | minimise $f(\mathbf{x})$ s.t. $\mathbf{c}_E(\mathbf{x}) = \mathbf{0}$, $\mathbf{c}_I(\mathbf{x}) \le \mathbf{0}$, all smooth, not necessarily convex |
| Key identity | Newton's method on the KKT system equals repeated solution of a QP with a linearised constraint set |
| Subproblem | $\min\ \nabla f_k^\top\mathbf{d} + \tfrac{1}{2}\mathbf{d}^\top\mathbf{W}_k\mathbf{d}$ s.t. $\mathbf{c}_k + \nabla\mathbf{c}_k\mathbf{d} = \mathbf{0}$ (and $\le\mathbf{0}$) |
| Hessian | $\mathbf{W}_k = \nabla^2 f + \sum_j\lambda_j\nabla^2c_j$; constraint curvature is essential, and $\mathbf{W}_k$ is often indefinite |
| Globalisation | $\ell_1$ merit $\phi = f + \eta\|\mathbf{c}\|_1$ with $\eta > \|\boldsymbol{\lambda}\|_\infty$; or a filter; plus a trust region or $\mathbf{W} + \sigma\mathbf{I}$ |
| Maratos effect | A good unit step can increase the merit function; cured by a second-order correction |
| BFGS | $\mathbf{B}_{k+1} = \mathbf{B}_k - \frac{\mathbf{B}_k\mathbf{s}\mathbf{s}^\top\mathbf{B}_k}{\mathbf{s}^\top\mathbf{B}_k\mathbf{s}} + \frac{\mathbf{y}\mathbf{y}^\top}{\mathbf{y}^\top\mathbf{s}}$; Powell damping keeps it positive definite; limited memory for large $n$ |
| Convergence | Quadratic near a solution with LICQ and second-order sufficiency; nothing guaranteed far away |
| Worked landing | $\mathbf{x} = (a_1, a_2, T)$, two nonlinear equalities; converged $(0,\ 26.783\,\mathrm{m/s^2},\ 13.948\,\mathrm{s})$, impulse $186.78\,\mathrm{m/s}$, six iterations |
| Multipliers | $\boldsymbol{\lambda} = (-1.323, 0.0926)$; $\lambda_2$ matches $\mathrm{d}(\text{impulse})/\mathrm{d}h_0 = 0.09261\,\mathrm{(m/s)/m}$ |
| Discretisation error | $N = 2$ gives $T$ $4.2\,\%$ long and impulse $3.1\,\%$ high against the continuous $13.384\,\mathrm{s}$, $181.25\,\mathrm{m/s}$ |
| Gives up | Global optimality, iteration bounds, certificates, independence from the initial guess |
| Cousin | Sequential convex programming: linearise only the nonconvex parts, solve an SOCP per iteration, trust region plus virtual controls |

The next lesson takes SQP and the interior-point method of lesson 9 out of the abstract and into the two codes a GNC engineer actually calls for nonlinear problems – IPOPT and SNOPT – and looks at what their interfaces demand, how they exploit sparsity, and why neither of them flies.
