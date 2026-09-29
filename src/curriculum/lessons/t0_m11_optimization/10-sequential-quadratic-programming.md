---
id: l10-sequential-quadratic-programming
title: Sequential quadratic programming
minutes: 22
covers:
  - sequential quadratic programming
---

Picture a hiker in fog who must stay on a winding mountain trail and wants to reach its lowest point. She cannot see the whole trail. So she pretends the trail is straight, along the direction it heads right now. She pretends the ground around her is a smooth bowl. She works out where the bottom of that pretend bowl sits on the pretend trail, and walks there. Then she looks again, and repeats.

That is **sequential quadratic programming** (SQP). The stand-in is a bowl-shaped model of the Lagrangian with *straight-line* models of the constraints — lesson 5's quadratic program (QP) — and its answer is the next step. It is lesson 1's Newton method grown up. It is the leading method for a general **nonlinear program** (NLP) — a smooth objective and smooth constraints, with no promise of convexity.

Guidance needs it because not every problem fits a cone. A thruster with a fixed push and a steerable direction gives an equality on a norm, which lesson 6 showed no slack can relax. Drag on a returning booster depends on airspeed squared, angle of attack and a lookup table. A six-degree-of-freedom model carries a **[[quaternion|quaternion-word]]** whose length must equal one — a curved equality. And the free final time, kept out of lesson 6's SOCP, multiplies the controls in every dynamics equation.

What SQP does not give you is any of lesson 9's guarantees: no global optimum, no bound on the iteration count, no certificate. It can end at a local minimum, a saddle point, or nowhere, depending on where it started. Whether a guidance problem can be forced into convex form or must go to an NLP is one of the real design decisions in a GNC group, and it is made on exactly these grounds.

## Newton's method on the KKT conditions

Take equality constraints first. Inequalities add bookkeeping, not new ideas:

$$
\text{minimize } f(\mathbf{x}) \quad \text{subject to} \quad \mathbf{c}(\mathbf{x}) = \mathbf{0}, \qquad \mathbf{c}: \mathbb{R}^n \to \mathbb{R}^p .
$$

Here $\mathbf{x}$ holds the $n$ unknowns and $\mathbf{c}$ lists $p$ equality constraints. The KKT conditions of lesson 2 are $n + p$ equations in the $n + p$ unknowns $(\mathbf{x}, \boldsymbol{\lambda})$, where $\boldsymbol{\lambda}$ ("lambda") holds the multipliers:

$$
\mathbf{R}(\mathbf{x}, \boldsymbol{\lambda}) = \begin{bmatrix} \nabla f(\mathbf{x}) + \nabla\mathbf{c}(\mathbf{x})^\top\boldsymbol{\lambda} \\ \mathbf{c}(\mathbf{x}) \end{bmatrix} = \mathbf{0}.
$$

$\nabla\mathbf{c}$ is the $p \times n$ **Jacobian** — the table of first derivatives, one row $\nabla c_j^\top$ per constraint. Now apply Newton's method for equations (lesson 1) to $\mathbf{R} = \mathbf{0}$. The derivative of $\mathbf{R}$ is

$$
\begin{bmatrix} \mathbf{W} & \nabla\mathbf{c}^\top \\ \nabla\mathbf{c} & \mathbf{0}\end{bmatrix}, \qquad
\mathbf{W} = \nabla^2_{\mathbf{xx}}\mathcal{L}(\mathbf{x}, \boldsymbol{\lambda}) = \nabla^2 f(\mathbf{x}) + \sum_{j=1}^p \lambda_j\nabla^2 c_j(\mathbf{x}),
$$

where $\mathbf{W}$ is the **Hessian of the Lagrangian** $\mathcal{L} = f + \boldsymbol{\lambda}^\top\mathbf{c}$ — its matrix of second derivatives in $\mathbf{x}$. The Newton step $(\mathbf{d}, \Delta\boldsymbol{\lambda})$ solves

$$
\begin{bmatrix} \mathbf{W} & \nabla\mathbf{c}^\top \\ \nabla\mathbf{c} & \mathbf{0}\end{bmatrix}
\begin{bmatrix} \mathbf{d} \\ \Delta\boldsymbol{\lambda}\end{bmatrix}
= -\begin{bmatrix} \nabla f + \nabla\mathbf{c}^\top\boldsymbol{\lambda} \\ \mathbf{c}\end{bmatrix} .
$$

Now the surprise. Write $\boldsymbol{\lambda}^+ = \boldsymbol{\lambda} + \Delta\boldsymbol{\lambda}$ for the new multipliers and move the $\nabla\mathbf{c}^\top\boldsymbol{\lambda}$ term across. The system becomes

$$
\mathbf{W}\mathbf{d} + \nabla\mathbf{c}^\top\boldsymbol{\lambda}^+ = -\nabla f, \qquad \nabla\mathbf{c}\,\mathbf{d} = -\mathbf{c}.
$$

That is exactly lesson 5's KKT system for the quadratic program

$$
\text{minimize}_{\mathbf{d}} \ \nabla f(\mathbf{x})^\top\mathbf{d} + \tfrac{1}{2}\mathbf{d}^\top\mathbf{W}\mathbf{d} \quad \text{subject to} \quad \mathbf{c}(\mathbf{x}) + \nabla\mathbf{c}(\mathbf{x})\,\mathbf{d} = \mathbf{0},
$$

with $\boldsymbol{\lambda}^+$ as its multipliers. So Newton's method on the KKT conditions *is* solving a QP again and again — the hiker's routine. The QP's objective is a bowl model of the Lagrangian. Its constraints are the **[[linearized constraints|linearised-picture]]** — each curved constraint replaced by its tangent. That one fact is all of SQP. It explains both the speed and the fragility: SQP inherits Newton's fast local convergence, and Newton's blindness to whether it is near a minimum, a maximum or a saddle.

::: key The SQP subproblem
At the iterate $(\mathbf{x}_k, \boldsymbol{\lambda}_k)$, solve
$$
\min_{\mathbf{d}}\ \nabla f_k^\top\mathbf{d} + \tfrac{1}{2}\mathbf{d}^\top\mathbf{W}_k\mathbf{d} \quad \text{s.t.}\quad \mathbf{c}_{E,k} + \nabla\mathbf{c}_{E,k}\mathbf{d} = \mathbf{0}, \quad \mathbf{c}_{I,k} + \nabla\mathbf{c}_{I,k}\mathbf{d} \le \mathbf{0},
$$
with $\mathbf{W}_k = \nabla^2_{\mathbf{xx}}\mathcal{L}(\mathbf{x}_k, \boldsymbol{\lambda}_k)$. Set $\mathbf{x}_{k+1} = \mathbf{x}_k + \alpha_k\mathbf{d}_k$ and take $\boldsymbol{\lambda}_{k+1}$ from the QP's multipliers. Near a solution where the second-order sufficient conditions, LICQ and strict complementarity hold, full steps $\alpha_k = 1$ converge quadratically and the QP's active set matches the true one.
:::

The subscripts $E$ and $I$ mark equality and inequality constraints; $\alpha_k$ ("alpha") is the step length. Two details matter.

First, $\mathbf{W}$ is the Hessian of the **Lagrangian**, not of the objective. The QP treats curved constraints as flat, so a step along the tangent drifts off the curved surface. The extra term $\sum_j\lambda_j\nabla^2 c_j$ is exactly the correction for that drift. Drop it and the fast convergence is gone.

Second, the QP's inequalities let the method choose which constraints are active at every iteration. Near the answer it settles on the right set and stops changing it. From then on, SQP is Newton's method on an equality system and nothing more.

## Making it converge from a bad guess

Newton steps are superb near the answer and unreliable far away. Four tools make a working algorithm.

**A merit function.** With constraints there is no single number to watch: lowering $f$ can worsen feasibility, and the other way round. A **[[merit function|merit-word]]** blends the two into one score. The simplest is the $\ell_1$ merit function

$$
\phi(\mathbf{x};\eta) = f(\mathbf{x}) + \eta\,\|\mathbf{c}(\mathbf{x})\|_1 ,
$$

read "phi of x", where $\|\mathbf{c}\|_1$ is the sum of the sizes of the constraint errors and $\eta$ ("eta") is a penalty weight. The step length $\alpha_k$ is chosen by backtracking until $\phi$ falls enough — lesson 1's Armijo test, applied to $\phi$. The weight $\eta$ must exceed the largest multiplier size, or the method trades feasibility for objective and walks away from the constraints. Practical codes set $\eta \ge \|\boldsymbol{\lambda}\|_\infty$ plus a margin, and raise it when needed.

**A trust region, or a modified Hessian.** Away from the answer, $\mathbf{W}_k$ is often **indefinite**: it curves up in some directions and down in others, like a saddle. A QP with an indefinite Hessian is nonconvex and can be unbounded. One cure is a **trust region**: allow only steps with $\|\mathbf{d}\| \le \Delta_k$, a distance where the model is believed. That makes even an indefinite QP well posed, and $\Delta_k$ shrinks when a step disappoints. The other is to use $\mathbf{W}_k + \sigma\mathbf{I}$ ("sigma" times the identity), with the smallest $\sigma$ that makes it positive definite on the directions the active constraints allow. The worked example below needs $\sigma = 1$ at the start.

**A filter instead of a merit function.** A **[[filter|filter-picture]]** accepts a step if it beats every earlier accepted point on either the objective or the constraint violation. This two-score test avoids picking $\eta$ at all. IPOPT's line search uses a filter; SNOPT uses an augmented-Lagrangian merit function.

**Second-order corrections.** Close to the answer, a good full SQP step can *raise* the $\ell_1$ merit function. The linearized constraints are met exactly, but the curved ones are missed by an amount that grows with the square of the step, while the objective improves only in proportion to the step. The line search rejects the unit step and the fast convergence is lost. This is the **[[Maratos effect|maratos-history]]**. The cure is a **second-order correction**: evaluate $\mathbf{c}$ at the trial point, solve one small extra system for a correction $\hat{\mathbf{d}}$ that removes the leftover violation, and test $\mathbf{x}_k + \mathbf{d}_k + \hat{\mathbf{d}}_k$ instead.

::: example The SQP subproblem, with numbers
Here is the free-final-time landing that lesson 6 kept out of the SOCP, at its smallest honest size. A vehicle descends vertically from $h_0 = 1000\,\mathrm{m}$ at $v_0 = -50\,\mathrm{m/s}$, with $g = 9.80665\,\mathrm{m/s^2}$. The flight is split into two equal steps of length $\tau = T/2$ ("tau"), with thrust accelerations $a_1, a_2 \in [0, 30]\,\mathrm{m/s^2}$ held constant over each.

The unknowns are $\mathbf{x} = (a_1, a_2, T)$. The objective is the total impulse $f = (a_1 + a_2)T/2$. Integrating exactly over each step gives the two landing conditions, final speed zero and final height zero:

$$
c_1 = v_0 + (a_1 + a_2 - 2g)\frac{T}{2} = 0, \qquad
c_2 = h_0 + v_0 T + \big(3(a_1 - g) + (a_2 - g)\big)\frac{T^2}{8} = 0 .
$$

Both contain products of unknowns, so this is an NLP, and $T$ is a real decision variable rather than lesson 6's outer search.

**Start.** Take $\mathbf{x}_0 = (2, 24, 12)$: burn gently, then hard, for $12\,\mathrm{s}$. Plugging in gives $c_1 = -11.68\,\mathrm{m/s}$ and $c_2 = 233.9\,\mathrm{m}$. This trajectory ends $234\,\mathrm{m}$ above the pad, still falling at $11.7\,\mathrm{m/s}$.

**Derivatives.**

$$
\nabla f = (6,\ 6,\ 13), \qquad
\nabla\mathbf{c} = \begin{bmatrix} 6 & 6 & 3.193 \\ 54 & 18 & -77.68\end{bmatrix} .
$$

**The Hessian is a saddle.** With $\boldsymbol{\lambda}_0 = \mathbf{0}$, the Lagrangian Hessian is $\nabla^2 f$ alone: zeros on the diagonal and $\tfrac{1}{2}$ in the $(a_i, T)$ positions. Its eigenvalues are $0$ and $\pm 0.707$. That is **indefinite**, so the raw QP is nonconvex. Adding $\sigma\mathbf{I}$ with $\sigma = 1$ gives leading minors $1$, $1$ and $0.5$, all positive, so the matrix is positive definite and the QP is well posed.

**Solve the QP.**

$$
\mathbf{d}_0 = (-1.819,\ 2.524,\ 2.332), \qquad \|\mathbf{d}_0\| = 3.89,
$$

with QP multipliers $(-1.977,\ 0.1206)$.

**Check what the step did.** It meets the *linearized* constraints exactly: $\mathbf{c}_0 + \nabla\mathbf{c}_0\mathbf{d}_0 = \mathbf{0}$ to machine precision. But the new point $\mathbf{x}_1 = (0.181, 26.52, 14.33)$ has true errors $c_1 = 0.82\,\mathrm{m/s}$ and $c_2 = -28.8\,\mathrm{m}$. That is the method in one picture: each QP solves a straightened problem, and the curvature it ignored becomes the error the next QP cleans up. Still, the height miss fell from $234\,\mathrm{m}$ to $29\,\mathrm{m}$ in one step — the quadratic model earning its keep.
:::

## Quasi-Newton: BFGS in place of the Hessian

Building $\nabla^2_{\mathbf{xx}}\mathcal{L}$ means second derivatives of every constraint — for a trajectory, of the dynamics at every node. Often those are unavailable, expensive, or not worth the trouble. A **quasi-Newton** method learns the curvature instead, the way you could feel the shape of a dark room by noting how the floor's slope changes under your feet. The standard one is **[[BFGS|bfgs-names]]**.

Let $\mathbf{s}_k = \mathbf{x}_{k+1} - \mathbf{x}_k$ be the step, and $\mathbf{y}_k = \nabla_{\mathbf{x}}\mathcal{L}(\mathbf{x}_{k+1}, \boldsymbol{\lambda}_{k+1}) - \nabla_{\mathbf{x}}\mathcal{L}(\mathbf{x}_k, \boldsymbol{\lambda}_{k+1})$ the change in the Lagrangian's gradient, with the multipliers held fixed. A true Hessian would nearly satisfy the **secant condition** $\mathbf{W}\mathbf{s}_k \approx \mathbf{y}_k$ ("curvature times step equals change in slope"). So demand that the approximation $\mathbf{B}$ satisfy it exactly and otherwise change as little as possible. Several symmetric rank-two updates do this; the one that works best in practice is BFGS:

$$
\mathbf{B}_{k+1} = \mathbf{B}_k - \frac{\mathbf{B}_k\mathbf{s}_k\mathbf{s}_k^\top\mathbf{B}_k}{\mathbf{s}_k^\top\mathbf{B}_k\mathbf{s}_k} + \frac{\mathbf{y}_k\mathbf{y}_k^\top}{\mathbf{y}_k^\top\mathbf{s}_k} .
$$

Lesson 1 wrote the same update for the inverse $\mathbf{M} = \mathbf{B}^{-1}$, also a rank-two change.

If $\mathbf{y}_k^\top\mathbf{s}_k > 0$ — the **curvature condition**, which lesson 1's Wolfe line search enforces without constraints — then $\mathbf{B}_{k+1}$ stays positive definite whenever $\mathbf{B}_k$ was, so the QP subproblem is always convex. With constraints it can fail even at good steps, because the Lagrangian really does curve downward in some directions. **Powell's damping** repairs it: replace $\mathbf{y}_k$ by $\theta\mathbf{y}_k + (1-\theta)\mathbf{B}_k\mathbf{s}_k$ ("theta"), with the largest $\theta \in (0,1]$ that gives $\mathbf{y}_k^\top\mathbf{s}_k \ge 0.2\,\mathbf{s}_k^\top\mathbf{B}_k\mathbf{s}_k$. It keeps as much of the real measurement as it safely can.

For large problems the matrix is never formed. **Limited-memory BFGS** (L-BFGS) keeps only the last five to twenty $(\mathbf{s}, \mathbf{y})$ pairs and applies their effect by a short recursion. That is why an NLP with a hundred thousand unknowns is tractable at all.

::: key BFGS
Builds an approximate inverse Hessian from successive gradient differences (a rank-two update), giving near-Newton convergence without ever forming or factorizing the true Hessian. Exact Newton converges quadratically; BFGS converges superlinearly, and costs one gradient evaluation and a rank-two update per iteration instead of a full second-derivative evaluation.
:::

::: example The full SQP run, and what it says about the landing
Continue from $\mathbf{x}_0 = (2, 24, 12)$ with the exact Lagrangian Hessian (plus $\sigma\mathbf{I}$ only when it is not positive on the allowed directions), an $\ell_1$ merit line search, and the bounds $0 \le a_i \le 30$ inside the QP.

| $k$ | $a_1$ | $a_2$ | $T$ | impulse | $\|\mathbf{c}\|_1$ | $\|\mathbf{d}\|$ | $\alpha$ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | $2.000$ | $24.000$ | $12.000$ | $156.00$ | $2.46\times10^{2}$ | $3.89$ | $1$ |
| 1 | $0.1812$ | $26.524$ | $14.332$ | $191.37$ | $2.96\times10^{1}$ | $4.98\times10^{-1}$ | $1$ |
| 2 | $0$ | $26.7818$ | $13.9458$ | $186.747$ | $1.79\times10^{-1}$ | $2.30\times10^{-3}$ | $1$ |
| 3 | $0$ | $26.78285$ | $13.94788$ | $186.78197$ | $2.21\times10^{-6}$ | $1.45\times10^{-7}$ | $1$ |
| 4 | $0$ | $26.78285$ | $13.94788$ | $186.78196$ | $1.7\times10^{-13}$ | $1.8\times10^{-15}$ | — |

**Reading the table.** Four full-length steps; only the first needed $\sigma = 1$. At step 2 the QP drove $a_1$ onto its bound, and the active set never changed again. The last errors go $10^{-1}$, $10^{-6}$, $10^{-13}$: the number of correct digits roughly doubles each time. That doubling is what **[[quadratic convergence|quadratic-picture]]** looks like.

**Other starts, other Hessians.** From a worse start, $(5, 20, 10)$, the same code takes six iterations, and **[[damped BFGS|other-hessians]]** from the identity converges from $(2, 24, 12)$ in four.

**The answer.** $a_1 = 0$, $a_2 = 26.783\,\mathrm{m/s^2}$, $T = 13.948\,\mathrm{s}$, total impulse $186.78\,\mathrm{m/s}$. The bound $a_1 \ge 0$ is active: the vehicle **coasts through the whole first half and burns in the second**. It is the two-step echo of lesson 5's coast-then-burn profile.

**Check it by hand.** With $a_1 = 0$ known, the landing conditions reduce to $h_0 + 1.5v_0\tau - g\tau^2 = 0$, with $\tau = T/2$. Its positive root is $\tau = 6.9739\,\mathrm{s}$. Then $a_2 = -v_0/\tau + 2g = 26.783$ and the impulse is $-v_0 + 2g\tau = 186.78$ — the SQP answer to every digit.

**The multipliers mean something.** For $\mathcal{L} = f + \lambda_1c_1 + \lambda_2c_2$ they are $\boldsymbol{\lambda} = (-1.323,\ 0.0926)$. Differentiate the hand formula: one more meter of starting height costs $0.09261\,\mathrm{m/s}$ of impulse, and a finite difference agrees. That is exactly $\lambda_2$ — lesson 2's **[[shadow price|shadow-price-landing]]**, showing up where it should.

**Compare with the continuous answer.** Lesson 5's continuous thrust history for the same vehicle gives $t_f = 13.384\,\mathrm{s}$ and impulse $181.25\,\mathrm{m/s}$. The two-step version is $4.2\,\%$ long and $3.1\,\%$ expensive, because a control held constant for $7\,\mathrm{s}$ cannot put the ignition where it belongs. That error is the discretization's, not the optimizer's, and it shrinks as $N$ grows — which is why flight formulations use $50$ to $200$ nodes, not two.
:::

## What SQP gives up

On a convex problem, lesson 9's interior-point method returns the global optimum with a certificate, in an iteration count bounded before flight. SQP on a nonconvex problem offers none of that.

- **Local, not global.** The QP is built from derivatives at the current point; nothing looks at the rest of the space. A different start can land on a different local minimum — for a trajectory, a completely different flight path.
- **No iteration bound.** The theory promises quadratic convergence only *near* a solution. How long it takes to get near, or whether it gets there at all, depends on the data. Codes routinely take five iterations on one case and three hundred on the next.
- **Infeasible subproblems.** The linearized constraints can contradict each other even when the real feasible set is not empty, and then there is no step to take. Production codes switch to an **elastic mode**: they relax the linearized constraints with penalized slack variables, so the subproblem always has a solution, and the size of the slack reports how badly the relaxation was needed.
- **Derivatives are the whole game.** A gradient wrong in the sixth digit — a sign error in a hand-coded Jacobian, a finite difference with a bad step — shows up as slow convergence, or as convergence to a point that is not a solution. Check every derivative against finite differences, or better, generate them by **[[algorithmic differentiation|ad-bridge]]**.

So SQP belongs where its weaknesses are affordable: trajectory design on the ground, where an engineer looks at the answer; mission planning, where hours are available; and offline generation of the reference trajectory that an onboard convex solver then tracks. Not in a loop with a hard deadline and nobody watching.

::: warning An NLP solution is not a certificate
SQP stops when the KKT error and the constraint violation fall below tolerance. That means "this point meets the first-order necessary conditions" — and lesson 2 was explicit that for a nonconvex problem KKT is necessary, not sufficient. The point could be a local minimum, a saddle, or, if nobody checked the second-order conditions, a maximum along some direction. Lesson 7's dual bound does not rescue you: the dual of a nonconvex problem generally has a gap. The discipline: re-solve from many random starts, compare the objective values, check the second-order conditions on the reduced Hessian, and call the best answer the best *found*, never the best possible.
:::

Modern powered-descent work often uses SQP's convex cousin, **sequential convex programming** — in guidance, usually the **[[successive convexification|scvx-history]]** (SCvx) family. It linearizes only the truly nonconvex parts, so each subproblem is an SOCP with a trust region and **virtual controls** (penalized slacks that keep it feasible).

## Check yourself

::: check
Why does the SQP subproblem use the Hessian of the Lagrangian rather than the Hessian of the objective? Build a small case where the difference matters.
:::

::: answer
Because the constraints are curved and the subproblem treats them as flat. The term $\sum_j\lambda_j\nabla^2c_j$ accounts for the way a step along the linearized constraint leaves the true one, and the correct Newton step on the KKT system contains it. Drop it and you lose the quadratic convergence at best; the step can fail outright.

A small case: minimize $f = x_1$ subject to $c = x_1^2 + x_2^2 - 1 = 0$. The answer is $(-1, 0)$, where stationarity $(1, 0) + \lambda(-2, 0) = \mathbf{0}$ gives $\lambda = 1/2$. Here $\nabla^2 f = \mathbf{0}$, so an "SQP" with the objective Hessian solves a *linear* program over a line each iteration. Nothing stops the step; it flies off along the tangent. The Lagrangian Hessian is $\lambda\nabla^2c = 2\lambda\mathbf{I} = \mathbf{I}$ at the answer — positive definite — so the correct subproblem is a well-posed QP. The constraint's curvature is the only curvature in the problem.
:::

::: check
In the worked example, the Lagrangian Hessian at the first iterate is indefinite. What goes wrong if you hand that QP to a solver unchanged, and what are the two standard fixes?
:::

::: answer
An indefinite $\mathbf{W}$ makes the subproblem a nonconvex QP, which lesson 5 noted is NP-hard in general. Here, concretely, the objective can be pushed toward $-\infty$ along a direction of negative curvature that stays on the linearized constraints, so the "step" is unbounded or meaningless.

The fixes: (1) use $\mathbf{W} + \sigma\mathbf{I}$, with the smallest $\sigma$ that makes it positive definite on the null space of the active constraint Jacobian. In the example $\sigma = 1$ was enough, with leading minors $1, 1, 0.5$. (2) Impose a trust region $\|\mathbf{d}\| \le \Delta$. That bounds the subproblem whatever the curvature, and gives a principled way to shrink the step when the model proves unreliable. Quasi-Newton SQP avoids the problem altogether, because damped BFGS keeps $\mathbf{B}_k$ positive definite by construction.
:::

::: check
A colleague's SQP converges in twelve iterations from one starting guess, and stalls at a constraint violation of $10^{-3}$ from another. List what you would check, in order.
:::

::: answer
1. The derivatives. Compare the analytic Jacobian and gradient with central finite differences at the stalling point. A wrong derivative is by far the most common cause, and cheap to rule out.
2. Scaling. If the variables differ by many orders of magnitude — meters beside radians beside seconds — the QP is badly conditioned and one group dominates the merit function. Rescale so a unit change in each variable matters about equally.
3. A Maratos effect. If unit steps are rejected while the KKT error is small, add a second-order correction or switch to a filter.
4. An infeasible linearized subproblem at that point. That needs elastic mode, not a better step.
5. Only then: the second guess may sit in the basin of a different, worse, or nonexistent solution. That is not a bug; it is the nature of a nonconvex problem.
:::

::: check
The two-step example costs $186.78\,\mathrm{m/s}$ of impulse against the continuous optimum of $181.25$. Why is the discrete answer larger rather than smaller, and what happens as $N$ grows?
:::

::: answer
Every two-step thrust history is also a continuous one, so the discrete feasible set is a subset of the continuous one, and its optimum can only be worse — a larger impulse.

The specific loss is timing. With two steps, ignition must fall on the boundary between them, at $6.97\,\mathrm{s}$; the continuous optimum ignites at $7.34\,\mathrm{s}$. Forced to brake early, the vehicle spends longer fighting gravity, and by lesson 5's identity the impulse is $-v_0 + gT$, so a longer $T$ costs directly. Check: $-(-50) + 9.80665 \times 13.948 = 186.78$.

As $N$ grows, the switch can be placed within one step length $\Delta t$ of its true time, and the excess shrinks roughly in proportion to $\Delta t$ — here $3.1\,\%$ at $N = 2$. That measures the discretization, not the optimizer, so a convergence study in $N$ should come before any claim about an optimal trajectory.
:::

::: check
When would you choose SQP over lesson 6's convex formulation for a landing problem, and what must you then add to the flight software?
:::

::: answer
Choose it when the physics cannot be convexified without unacceptable conservatism — the opening's cases: state-dependent aerodynamics, a six-degree-of-freedom model with a unit quaternion, a fixed-push steerable thruster, or a free final time to optimize rather than search over.

What you must add, because SQP supplies none of it:

- a hard iteration cap, with a defined behavior when it is hit;
- an independent feasibility check on the returned trajectory, since a converged NLP is not a certificate;
- a deterministic starting guess — usually the previous cycle's solution or a stored reference — so the answer is reproducible;
- bounded, statically allocated memory, which general NLP codes do not provide;
- a Monte Carlo campaign that maps the iteration count over the whole envelope, not only the nominal point.

In practice the sequential convex programming route above is preferred, because it keeps most of these properties while handling the nonconvex physics.
:::

## Summary

| Idea | In one line |
| --- | --- |
| Problem | minimize $f(\mathbf{x})$ s.t. $\mathbf{c}_E(\mathbf{x}) = \mathbf{0}$, $\mathbf{c}_I(\mathbf{x}) \le \mathbf{0}$; smooth, maybe nonconvex |
| Key identity | Newton on the KKT system = repeated QPs with linearized constraints |
| Subproblem | $\min\ \nabla f_k^\top\mathbf{d} + \tfrac{1}{2}\mathbf{d}^\top\mathbf{W}_k\mathbf{d}$ s.t. $\mathbf{c}_k + \nabla\mathbf{c}_k\mathbf{d} = \mathbf{0}$ (and $\le\mathbf{0}$) |
| Hessian | $\mathbf{W}_k = \nabla^2 f + \sum_j\lambda_j\nabla^2c_j$; constraint curvature essential; often indefinite |
| Globalization | $\ell_1$ merit $\phi = f + \eta\|\mathbf{c}\|_1$, $\eta > \|\boldsymbol{\lambda}\|_\infty$, or a filter; trust region or $\mathbf{W} + \sigma\mathbf{I}$ |
| Maratos effect | A good unit step raises the merit function; fixed by a second-order correction |
| BFGS | $\mathbf{B}_{k+1} = \mathbf{B}_k - \frac{\mathbf{B}_k\mathbf{s}\mathbf{s}^\top\mathbf{B}_k}{\mathbf{s}^\top\mathbf{B}_k\mathbf{s}} + \frac{\mathbf{y}\mathbf{y}^\top}{\mathbf{y}^\top\mathbf{s}}$; Powell damping; L-BFGS for large $n$ |
| Convergence | Quadratic near a solution with LICQ and second-order sufficiency; nothing promised far away |
| Worked landing | $(a_1, a_2, T) = (0,\ 26.783\,\mathrm{m/s^2},\ 13.948\,\mathrm{s})$, impulse $186.78\,\mathrm{m/s}$, four steps |
| Multipliers | $\boldsymbol{\lambda} = (-1.323, 0.0926)$; $\lambda_2 = \mathrm{d}(\text{impulse})/\mathrm{d}h_0 = 0.09261\,\mathrm{(m/s)/m}$ |
| Discretization | $N = 2$: $T$ $4.2\,\%$ long, impulse $3.1\,\%$ high vs continuous $13.384\,\mathrm{s}$, $181.25\,\mathrm{m/s}$ |
| Gives up | Global optimality, iteration bounds, certificates, independence from the start |
| Cousin | Sequential convex programming: SOCP subproblems, trust region, virtual controls |

Next lesson: you will rarely write an SQP or interior-point code — you will call one. It opens up the two that GNC engineers use for nonlinear problems, IPOPT and SNOPT: what they ask for, how they exploit sparsity, and why neither flies.

::: context quaternion-word Four numbers for a direction
A **quaternion** is a set of four numbers that describes how a body is turned in space — which way the nose points and how far it is rolled. It is used instead of three angles because it never hits the "gimbal lock" dead spots that angles have. The price is a rule: the four numbers, squared and added, must equal exactly $1$. That rule is a curved equality — a sphere in four dimensions — so any optimization that carries a quaternion is nonconvex. The attitude modules later in the course use quaternions everywhere.
:::

::: context linearised-picture Following the tangent, missing the curve
The QP replaces each curved constraint by its tangent line at the current point. A step that lands exactly on the tangent lands a little off the curve. The gap grows with the square of the step, which is why it shrinks so fast near the answer.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <path d="M 30 40 A 150 150 0 0 1 180 190" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="38.2" y1="12.6" x2="226.6" y2="144.6" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <line x1="116.0" y1="67.1" x2="176.7" y2="109.6" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="185.7,115.9 173.8,113.7 179.5,105.5" fill="#1f2a44"/>
  <line x1="185.7" y1="115.9" x2="165.4" y2="125.5" stroke="#b4232c" stroke-width="2" stroke-dasharray="3 3"/>
  <circle cx="116.0" cy="67.1" r="5" fill="#1f2a44"/>
  <circle cx="185.7" cy="115.9" r="4" fill="#b4232c"/>
  <circle cx="165.4" cy="125.5" r="3" fill="#1d6fd1"/>
  <text x="104" y="88" font-size="12" fill="#1f2a44" text-anchor="end">x_k</text>
  <text x="196" y="112" font-size="12" fill="#b4232c">x_k + d</text>
  <text x="40" y="176" font-size="11" fill="#1d6fd1">curved constraint</text>
  <text x="232" y="152" font-size="11" fill="#6c7a93">tangent (linearised)</text>
  <text x="160" y="146" font-size="11" fill="#b4232c" text-anchor="end">miss</text>
</svg>
```
:::

::: context merit-word One score from two
"Merit" means a score for how good something is. A step in a constrained problem has two report cards: did the objective go down, and did the constraint errors go down? The merit function adds them into one number, with the weight $\eta$ saying how many units of objective one unit of constraint error is worth. If $\eta$ is too small, cheating on the constraints looks like a bargain. That is why it must exceed the largest multiplier — the multiplier is exactly the exchange rate between the two.
:::

::: context filter-picture A filter as a staircase
Plot each filter entry by its constraint violation (across) and its objective (up). Entries never beat each other on both scores, so they form a staircase going down to the right. A trial point is rejected if some entry beats it on both scores at once — if it lands in the shaded region up and to the right of an entry. Anything that improves on either score against every entry gets in.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <path d="M 80 15 L 80 40 L 150 40 L 150 85 L 230 85 L 230 125 L 340 125 L 340 15 Z" fill="#8fb8f0" opacity="0.6"/>
  <polyline points="80,15 80,40 150,40 150,85 230,85 230,125 340,125" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="40" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="170" x2="40" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="80" cy="40" r="5" fill="#1d6fd1"/>
  <circle cx="150" cy="85" r="5" fill="#1d6fd1"/>
  <circle cx="230" cy="125" r="5" fill="#1d6fd1"/>
  <circle cx="110" cy="120" r="5" fill="#1f2a44"/>
  <circle cx="270" cy="100" r="5" fill="#b4232c"/>
  <text x="120" y="124" font-size="11" fill="#1f2a44">accepted</text>
  <text x="280" y="104" font-size="11" fill="#b4232c">rejected</text>
  <text x="250" y="45" font-size="11" fill="#1f2a44">dominated</text>
  <text x="190" y="190" font-size="12" text-anchor="middle" fill="#1f2a44">constraint violation</text>
  <text x="28" y="95" font-size="12" text-anchor="middle" fill="#1f2a44" transform="rotate(-90 28 95)">objective</text>
</svg>
```
:::

::: context maratos-history A good step that looks bad
The effect is named after Nicholas Maratos, who described it in his 1978 PhD thesis at Imperial College London. The trouble is scoring, not steering. Near the answer the objective improves in proportion to the step, but the curved constraints are missed by the square of the step, and the $\ell_1$ merit function can weigh that miss more heavily than the gain. So the line search refuses a step that would have been fine. Second-order corrections, filters, and "watchdog" strategies that tolerate a temporary rise in the merit function were all invented to get around it.
:::

::: context bfgs-names Four people, one year
BFGS is named for Charles Broyden, Roger Fletcher, Donald Goldfarb and David Shanno, who each published the update independently in 1970. Four people arriving at the same formula in the same year is a hint that it is a natural answer to the question "what is the smallest sensible change to my curvature estimate that agrees with the latest step?" It is still the default unconstrained method in SciPy's `minimize`, and its limited-memory form, L-BFGS, trains many machine-learning models today.
:::

::: context quadratic-picture Watching the digits double
Plot the constraint error of the worked example on a logarithmic scale, one bar per iteration. Linear convergence would shrink the bars by a fixed amount each step. Quadratic convergence shrinks them faster and faster: the exponent roughly doubles.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="20" x2="60" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="60" y1="47.3" x2="340" y2="47.3" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="80" y="26.4" width="36" height="20.9" fill="#1d6fd1"/>
  <rect x="135" y="34.6" width="36" height="12.7" fill="#1d6fd1"/>
  <rect x="190" y="47.3" width="36" height="6.5" fill="#1d6fd1"/>
  <rect x="245" y="47.3" width="36" height="49.1" fill="#1d6fd1"/>
  <rect x="300" y="47.3" width="36" height="110.5" fill="#1d6fd1"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="98" y="20">246</text><text x="153" y="28">29.6</text><text x="208" y="67">0.18</text>
    <text x="263" y="110">2e-6</text><text x="318" y="171">1.7e-13</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="55" y="51">1</text><text x="55" y="95">1e-5</text><text x="55" y="138">1e-10</text>
  </g>
  <line x1="56" y1="90.7" x2="60" y2="90.7" stroke="#1f2a44"/>
  <line x1="56" y1="134.0" x2="60" y2="134.0" stroke="#1f2a44"/>
  <text x="200" y="196" font-size="11" text-anchor="middle" fill="#6c7a93">iterations 0 to 4, error on a log scale</text>
</svg>
```
:::

::: context other-hessians Why BFGS loses nothing here
Damped BFGS, started from the identity matrix, needs the same four steps as the exact Hessian on this problem. No surprise: at the answer three active constraints — the two landing conditions and the bound $a_1 \ge 0$ — pin all three unknowns, so there is no free direction left for the curvature model to matter in. A cruder exact-Hessian version that shifts the whole Hessian by $\sigma\mathbf{I}$ every time takes nine iterations from $(5, 20, 10)$, and its line search halves several steps — the merit function doing real work. On a large trajectory problem BFGS usually costs a few extra iterations, in exchange for never touching a second derivative.
:::

::: context shadow-price-landing Reading the multiplier as a price
$\lambda_2 = 0.0926$ is measured in meters per second of impulse per meter of starting height. Start $100\,\mathrm{m}$ higher and the landing costs about $9.3\,\mathrm{m/s}$ more. Why more? A higher start means more speed to kill and a longer burn spent holding the vehicle up against gravity. The first multiplier, $\lambda_1 = -1.323$, is the price on the final-velocity condition, and its sign depends on the convention for which way you loosen it — the same sign trap lesson 2 warned about.
:::

::: context ad-bridge Derivatives computed by the program itself
**Algorithmic differentiation** (also called automatic differentiation) takes the code that computes a function and, rule by rule, builds code that computes its exact derivatives — no hand algebra, no finite-difference step to choose. It is the same idea that trains neural networks, where it goes by the name backpropagation. The next lesson shows how trajectory tools such as CasADi use it to hand an NLP solver exact Jacobians and Hessians for free.
:::

::: context scvx-history SQP's convex cousin
Sequential convex programming linearizes only the truly nonconvex parts of the problem, around a reference trajectory. The convex parts — thrust cone, glide slope, throttle limits — stay exactly as they are, so each subproblem is an SOCP rather than a QP. It adds a trust region on how far the trajectory may move from the reference, and **virtual controls**: small penalized slacks on the dynamics that keep every subproblem feasible even when the linearization is poor. That cures the artificial infeasibility that plagues plain SQP. Under stated assumptions, convergence to a KKT point of the original problem can be proved, and every iteration is a convex solve with all of lesson 9's properties.

The method grew out of the Mars powered-descent research of Behçet Açıkmeşe and colleagues, the line of work that produced lossless convexification. Yuanqi Mao, Michael Szmuk and Açıkmeşe published a convergence analysis in 2016, and it has since been applied to six-degree-of-freedom rocket landing with aerodynamic and attitude constraints: an outer loop that is SQP in spirit, around lesson 6's SOCP.
:::
