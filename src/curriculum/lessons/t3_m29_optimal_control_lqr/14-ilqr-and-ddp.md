---
id: l14-ilqr-and-ddp
title: iLQR and DDP, the nonlinear extension
minutes: 20
covers:
  - iLQR and DDP as the nonlinear extension
---

The previous lesson left the general optimal control problem in an awkward place. The Pontryagin conditions are correct and completely general, and what they give you is a two-point boundary value problem in the state and costate that has to be solved numerically, one trajectory at a time, with an initial costate guess that nobody has any intuition about. Shooting methods on that system are notoriously fragile: the costate dynamics run the wrong way for stability, so a small error in $\boldsymbol{\lambda}(0)$ grows exponentially and the trajectory diverges before it reaches $t_f$.

Differential dynamic programming and its cheaper cousin iterative LQR take the other route. Instead of solving the necessary conditions, they solve a sequence of problems you already know how to solve: linearise the dynamics and take a quadratic model of the cost about the current trajectory, run the time-varying LQR backward pass on that model, use the result to improve the trajectory, and repeat. Each iteration is a Riccati sweep. The method inherits the numerical robustness of dynamic programming — everything runs backwards from the terminal cost, which is the stable direction — and it produces, as a by-product, the feedback gains needed to fly the trajectory it found.

This is how nonlinear trajectory optimisation is done on landers, on walking robots, and in the inner loop of nonlinear model predictive control. It is also the natural end point of this module, because it is the linear quadratic regulator used as a subroutine rather than as an answer.

## The problem and the idea

Work in discrete time, since that is what a computer does:

$$
\min_{\mathbf{u}_0,\dots,\mathbf{u}_{N-1}}\; \ell_f(\mathbf{x}_N) + \sum_{k=0}^{N-1}\ell(\mathbf{x}_k,\mathbf{u}_k)
\qquad\text{subject to}\qquad
\mathbf{x}_{k+1} = \mathbf{f}(\mathbf{x}_k,\mathbf{u}_k),
$$

with $\mathbf{f}$ and $\ell$ nonlinear and smooth, and $\mathbf{x}_0$ given. Suppose you have a current guess: a control sequence $\bar{\mathbf{u}}_k$ and the trajectory $\bar{\mathbf{x}}_k$ it produces. The iteration improves it.

## The backward pass

Let $V_k(\mathbf{x})$ be the optimal cost-to-go, with $V_N = \ell_f$. Bellman's equation is $V_k(\mathbf{x}) = \min_{\mathbf{u}}\big[\ell(\mathbf{x},\mathbf{u}) + V_{k+1}(\mathbf{f}(\mathbf{x},\mathbf{u}))\big]$. Define the change in that bracket produced by deviations $(\delta\mathbf{x},\delta\mathbf{u})$ from the current trajectory,

$$
Q(\delta\mathbf{x},\delta\mathbf{u}) = \ell(\bar{\mathbf{x}}+\delta\mathbf{x},\bar{\mathbf{u}}+\delta\mathbf{u}) - \ell(\bar{\mathbf{x}},\bar{\mathbf{u}})
+ V_{k+1}\big(\mathbf{f}(\bar{\mathbf{x}}+\delta\mathbf{x},\bar{\mathbf{u}}+\delta\mathbf{u})\big) - V_{k+1}\big(\mathbf{f}(\bar{\mathbf{x}},\bar{\mathbf{u}})\big),
$$

and expand to second order. Writing $\mathbf{f}_x, \mathbf{f}_u$ for the Jacobians and $V'_x, V'_{xx}$ for the value derivatives at step $k+1$:

$$
\begin{aligned}
\mathbf{Q}_x &= \boldsymbol{\ell}_x + \mathbf{f}_x^\top V'_x, &
\mathbf{Q}_{xx} &= \boldsymbol{\ell}_{xx} + \mathbf{f}_x^\top V'_{xx}\mathbf{f}_x \;(+\; V'_x\!\cdot\!\mathbf{f}_{xx}),\\
\mathbf{Q}_u &= \boldsymbol{\ell}_u + \mathbf{f}_u^\top V'_x, &
\mathbf{Q}_{uu} &= \boldsymbol{\ell}_{uu} + \mathbf{f}_u^\top V'_{xx}\mathbf{f}_u \;(+\; V'_x\!\cdot\!\mathbf{f}_{uu}),\\
& & \mathbf{Q}_{ux} &= \boldsymbol{\ell}_{ux} + \mathbf{f}_u^\top V'_{xx}\mathbf{f}_x \;(+\; V'_x\!\cdot\!\mathbf{f}_{ux}).
\end{aligned}
$$

The bracketed terms contract the value gradient with the second derivative tensors of the dynamics. Keeping them is **DDP**; dropping them is **iLQR**. That single choice is the whole difference between the two methods.

Minimising the quadratic $Q$ over $\delta\mathbf{u}$ gives an affine law,

$$
\delta\mathbf{u}^\star = \mathbf{k} + \mathbf{K}\,\delta\mathbf{x},
\qquad
\mathbf{k} = -\mathbf{Q}_{uu}^{-1}\mathbf{Q}_u,
\qquad
\mathbf{K} = -\mathbf{Q}_{uu}^{-1}\mathbf{Q}_{ux},
$$

a **feedforward** correction $\mathbf{k}$ and a **feedback** gain $\mathbf{K}$. Substituting it back gives the recursion for the value derivatives,

$$
V_x = \mathbf{Q}_x + \mathbf{K}^\top\mathbf{Q}_{uu}\mathbf{k} + \mathbf{K}^\top\mathbf{Q}_u + \mathbf{Q}_{ux}^\top\mathbf{k},
\qquad
V_{xx} = \mathbf{Q}_{xx} + \mathbf{K}^\top\mathbf{Q}_{uu}\mathbf{K} + \mathbf{K}^\top\mathbf{Q}_{ux} + \mathbf{Q}_{ux}^\top\mathbf{K},
$$

together with the predicted cost reduction $\Delta V = \mathbf{k}^\top\mathbf{Q}_u + \tfrac12\mathbf{k}^\top\mathbf{Q}_{uu}\mathbf{k}$, accumulated over the whole sweep and used in the line search.

Compare these with the discrete Riccati recursion of the discrete-time lesson: they are the same equations, with $\mathbf{Q}_{uu}$ playing the role of $\mathbf{R}+\mathbf{B}^\top\mathbf{P}\mathbf{B}$ and $\mathbf{Q}_{ux}$ the role of $\mathbf{B}^\top\mathbf{P}\mathbf{A}$, plus a feedforward term $\mathbf{k}$ that exists because the current trajectory is not optimal and $\mathbf{Q}_u \neq \mathbf{0}$.

## The forward pass

The backward pass produced a *policy*, not a trajectory. Apply it by rolling the **nonlinear** dynamics forward:

$$
\hat{\mathbf{x}}_0 = \mathbf{x}_0,
\qquad
\hat{\mathbf{u}}_k = \bar{\mathbf{u}}_k + \alpha\,\mathbf{k}_k + \mathbf{K}_k\big(\hat{\mathbf{x}}_k - \bar{\mathbf{x}}_k\big),
\qquad
\hat{\mathbf{x}}_{k+1} = \mathbf{f}\big(\hat{\mathbf{x}}_k, \hat{\mathbf{u}}_k\big),
$$

with $\alpha \in (0,1]$ a step length. Two details matter enormously.

**The feedback term is not scaled by $\alpha$.** It is there to keep the rollout near the trajectory the quadratic model was built around, and damping it would defeat that. Only the feedforward correction is scaled.

**The line search compares against the predicted reduction.** The backward pass predicts $\Delta J(\alpha) = \alpha\sum\mathbf{k}^\top\mathbf{Q}_u + \alpha^2\sum\tfrac12\mathbf{k}^\top\mathbf{Q}_{uu}\mathbf{k}$. Try $\alpha = 1$, then halve, accepting the first $\alpha$ for which the actual reduction is a decent fraction of the predicted one. If no $\alpha$ works, the quadratic model is not trustworthy and the answer is regularisation, not a smaller step.

**Regularisation.** $\mathbf{Q}_{uu}$ must be positive definite for the minimisation to make sense, and far from the solution it often is not — especially for DDP, whose tensor terms are indefinite. Add $\mu\mathbf{I}$ to $\mathbf{Q}_{uu}$, or better, add it to $V'_{xx}$ before forming $\mathbf{Q}_{uu}$ and $\mathbf{Q}_{ux}$, which penalises deviation from the current *trajectory* rather than from the current *control* and behaves like a trust region on the states. Raise $\mu$ by a factor of ten whenever the backward pass fails its Cholesky factorisation or the line search finds no acceptable step; halve it on every success.

::: key iLQR and DDP in one line
Linearise the dynamics and quadratise the cost about the current trajectory, solve the resulting time-varying LQR backward pass for a feedforward plus feedback update, roll forward with a line search, repeat. It is Newton's method on a trajectory.
:::

::: example A planar lander, from a guess that crashes
A hopper of mass $m = 500\,\mathrm{kg}$ and pitch inertia $J = 400\,\mathrm{kg\,m^2}$ in the vertical plane. States $\mathbf{x} = (p_x, p_z, \theta, v_x, v_z, \omega)$; controls $\mathbf{u} = (T, \tau)$, thrust along the body axis and a pitch torque:

$$
\dot v_x = -\frac{T}{m}\sin\theta,
\qquad
\dot v_z = \frac{T}{m}\cos\theta - g,
\qquad
\dot\omega = \frac{\tau}{J},
$$

with $g = 9.80665\,\mathrm{m/s^2}$, discretised with RK4 at $\Delta t = 0.05\,\mathrm{s}$ over $N = 120$ steps ($6\,\mathrm{s}$). The nonlinearity is the coupling of thrust into the horizontal and vertical channels through $\theta$, which is what makes the vehicle steer at all. The cost penalises deviation from the landing state at the origin, with a terminal weight $\mathrm{diag}(500,500,5000,500,500,5000)$, and penalises thrust away from hover ($T_{hov} = mg = 4903\,\mathrm{N}$) and any torque.

Start from $\mathbf{x}_0 = (-40\,\mathrm{m},\ 60\,\mathrm{m},\ 0,\ 5\,\mathrm{m/s},\ -15\,\mathrm{m/s},\ 0)$ and the laziest possible guess: hover thrust and zero torque for the whole horizon. That trajectory does nothing about the horizontal offset and falls thirty metres below the pad; its cost is $3.126\times10^{5}$.

| accepted iteration | cost | $\alpha$ | $\mu$ | $\max\lvert\mathbf{k}\rvert$ |
| --- | --- | --- | --- | --- |
| $1$ | $283.88$ | $1.00$ | $1.0$ | $1.96\times10^{5}$ |
| $2$ | $214.66$ | $0.50$ | $0.50$ | $1925$ |
| $3$ | $195.65$ | $0.50$ | $0.25$ | $987$ |
| $5$ | $187.30$ | $0.50$ | $6.3\times10^{-2}$ | $468$ |
| $10$ | $184.69$ | $0.50$ | $2.0\times10^{-3}$ | $401$ |
| $20$ | $183.99$ | $0.50$ | $1.9\times10^{-6}$ | $243$ |
| $50$ | $183.66$ | $0.50$ | $10^{-10}$ | $84.7$ |
| $100$ | $183.6188$ | $0.50$ | $10^{-10}$ | $18.3$ |
| $284$ | $183.6166$ | $0.25$ | $10^{-10}$ | $0.025$ |

The first iteration does almost all the work: a single backward pass and a full step take the cost from $3.13\times10^{5}$ to $283.9$, a factor of $1100$, because the quadratic model of a mostly-quadratic cost around a mostly-linear plant is extremely good. Four iterations reach within $5\,\%$ of the final cost, eight within $1\,\%$, thirty within $0.1\,\%$ — and then $254$ more iterations grind out the last four digits, with $\alpha$ stuck at $0.5$ and the feedforward $\mathbf{k}$ decaying slowly. That tail is the signature of iLQR: dropping the dynamics tensors makes it a Gauss–Newton method, and Gauss–Newton does not have Newton's quadratic endgame. For engineering purposes the answer arrives in the first thirty iterations; running to machine precision is a luxury.

The converged trajectory: touchdown at $p_x = -0.0048\,\mathrm{m}$, $p_z = 0.0066\,\mathrm{m}$, $\theta = 0.663^\circ$, $v_x = 0.018\,\mathrm{m/s}$, $v_z = -0.043\,\mathrm{m/s}$, $\omega = -0.149^\circ/\mathrm{s}$. Thrust ranges from $4940$ to $7496\,\mathrm{N}$, that is $1.01$ to $1.53$ times hover, peak torque $1164\,\mathrm{N\,m}$, and the vehicle pitches to $21.9^\circ$ to kill the $40\,\mathrm{m}$ of horizontal offset before straightening up. Nothing in the cost asked for that manoeuvre; it is what minimising the cost produced.
:::

::: example The feedback gains are the TVLQR gains
At convergence the feedforward $\mathbf{k}$ has gone to zero — that is what convergence means — and what remains is the schedule $\mathbf{K}_k$. It should be exactly the time-varying LQR gain for the linearisation about the optimal trajectory, because with $\mathbf{Q}_u = \mathbf{0}$ the backward pass is the discrete Riccati recursion and nothing else.

Checking that directly on the converged lander: solving the discrete Riccati recursion independently along the optimal trajectory with the same $\mathbf{Q}$, $\mathbf{R}$ and terminal weight, and comparing against the iLQR gains, gives a maximum discrepancy of $0.115$ against gains of magnitude up to $3.1\times10^{4}$ — a relative agreement of $3.7\times10^{-6}$, which is the convergence tolerance of the iteration rather than a difference in the mathematics. Entry by entry at $k = 0$:

| | $p_x$ | $p_z$ | $\theta$ | $v_x$ | $v_z$ | $\omega$ |
| --- | --- | --- | --- | --- | --- | --- |
| iLQR thrust row | $-10.161$ | $-64.597$ | $-187.299$ | $-39.431$ | $-253.230$ | $-141.322$ |
| Riccati sweep | $-10.161$ | $-64.597$ | $-187.298$ | $-39.431$ | $-253.230$ | $-141.322$ |

This is the practical payoff. One run of iLQR delivers both the nominal trajectory a vehicle should fly and the gain schedule that stabilizes it against dispersions — the trajectory-stabilization problem of the earlier lesson, solved for free as a by-product. The same $\mathbf{P}_k$ that generated the gains also provides the cost-to-go certificate for a funnel around the trajectory.
:::

## Constraints, and what is still missing

Real vehicles have a throttle range, a gimbal limit and a glide slope, and none of that appears above. Three standard extensions:

- **Control limits.** The backward pass minimises a quadratic in $\delta\mathbf{u}$; replace that unconstrained minimisation with a small box-constrained quadratic program solved at each step. This is control-limited DDP, it costs a projected-Newton solve per knot, and the feedback gain rows corresponding to clamped inputs are set to zero.
- **State constraints.** Penalty terms are the crude fix and distort the solution near the boundary. Augmented-Lagrangian iLQR is the standard alternative: put multipliers on the constraints, solve the unconstrained problem, update the multipliers, repeat — the constrained-optimisation machinery from the optimisation module wrapped around this one.
- **Squashing.** Pass the control through a saturating function such as a scaled hyperbolic tangent so that the limits are satisfied by construction. Simple, and it makes the problem badly conditioned near saturation.

::: warning What iLQR does not give you
It is a local method on a nonconvex problem, with all the consequences established in the optimisation module: no global optimum, no certificate, no iteration bound, and a result that depends on the initial guess. A different starting trajectory can converge to a qualitatively different flight path. It also needs derivatives — a Jacobian of the dynamics at every knot, and for DDP the second-derivative tensors too — and a wrong derivative shows up as a line search that never accepts a step rather than as a visibly wrong answer. Check the Jacobians against finite differences before blaming the algorithm. And note that the converged trajectory satisfies the discrete problem you posed, not the continuous one: a convergence study in $\Delta t$ belongs beside any claim about an optimal trajectory.
:::

::: note Where this sits among the alternatives
The methods in this family are **indirect in spirit but direct in practice**: they never form the costate explicitly, yet the value gradient $V_x$ they propagate backwards is the costate, and at convergence it satisfies the Pontryagin conditions of the previous lesson. Against a direct transcription handed to a general nonlinear programming solver, iLQR has two structural advantages — its cost per iteration is linear in the horizon length rather than cubic, because the Riccati recursion exploits the banded structure that a general solver has to discover; and it returns a feedback policy rather than an open-loop sequence. Against a sequential convex programming method it gives up the ability to enforce hard constraints exactly. Which one flies depends on whether the constraints or the horizon length is the binding difficulty.
:::

## Check yourself

::: check
State the single difference between iLQR and DDP, and say what it costs and buys.
:::

::: answer
DDP keeps the second-derivative tensors of the dynamics in the quadratic model — the terms $V'_x\!\cdot\!\mathbf{f}_{xx}$, $V'_x\!\cdot\!\mathbf{f}_{uu}$ and $V'_x\!\cdot\!\mathbf{f}_{ux}$ in $\mathbf{Q}_{xx}$, $\mathbf{Q}_{uu}$ and $\mathbf{Q}_{ux}$ — and iLQR drops them. Keeping them makes the method a true Newton method on the trajectory, with quadratic convergence near the solution; dropping them makes it Gauss–Newton, which converges superlinearly at best and in practice has the long tail seen in the worked example, where $254$ of the $284$ iterations bought the last $0.1\,\%$ of cost. What it costs is the tensors themselves: $n$ Hessians of size $(n+m)^2$ at every knot, which for a six-state two-input problem over $120$ knots is a substantial amount of differentiation, and which also make $\mathbf{Q}_{uu}$ indefinite more often, so DDP needs more regularisation. The usual engineering choice is iLQR, because the first ten iterations are what matters and they are nearly identical.
:::

::: check
Why is the feedback term $\mathbf{K}_k(\hat{\mathbf{x}}_k-\bar{\mathbf{x}}_k)$ not multiplied by the step length $\alpha$?
:::

::: answer
Because it serves a different purpose from the feedforward term. $\mathbf{k}_k$ is the proposed *improvement*, and $\alpha$ exists to take less of it when the quadratic model overreaches. $\mathbf{K}_k$ is what keeps the rolled-out trajectory close to the nominal about which that model was built: as soon as the nonlinear rollout deviates from $\bar{\mathbf{x}}_k$, the feedback pulls it back towards the region where the linearisation is valid. Scaling it down would let the rollout wander exactly when the step is being reduced because the model is already in trouble, and the line search would then fail for both reasons at once. Implementations that damp the feedback term are a known way to make iLQR converge badly on stiff or unstable systems.
:::

::: check
Your iLQR run rejects every step length at the first iteration. List what you would check.
:::

::: answer
First, the derivatives: compare $\mathbf{f}_x$ and $\mathbf{f}_u$ at a few knots against central finite differences, since a wrong Jacobian produces a descent direction that is not one and the line search correctly refuses it. Second, the regularisation: if $\mathbf{Q}_{uu}$ is barely positive definite, $\mathbf{k}$ is enormous — the worked example's first iteration had $\max|\mathbf{k}| = 1.96\times10^{5}$ — and even $\alpha = 2^{-10}$ may overshoot; raise $\mu$ and try again, which is what the algorithm does automatically. Third, the initial guess: a rollout that diverges or produces non-finite states gives a meaningless quadratic model, and the fix is a better nominal, often obtained by solving a simpler problem first. Fourth, the cost scaling: if the terminal weight is many orders of magnitude above the stage cost, the quadratic model is dominated by one term and the step is effectively a pure terminal correction. Fifth, and only then, the possibility that the horizon is too short for the manoeuvre to be feasible at all.
:::

::: check
At convergence the iLQR feedback gains matched an independent Riccati sweep to $3.7\times10^{-6}$. Explain why they must agree, and what it would mean if they did not.
:::

::: answer
At convergence $\mathbf{Q}_u = \boldsymbol{\ell}_u + \mathbf{f}_u^\top V'_x = \mathbf{0}$ at every knot — that is the stationarity condition the iteration drives to zero — so $\mathbf{k} = -\mathbf{Q}_{uu}^{-1}\mathbf{Q}_u = \mathbf{0}$ and the backward pass reduces to propagating $V_{xx}$ through $V_{xx} = \mathbf{Q}_{xx} - \mathbf{Q}_{ux}^\top\mathbf{Q}_{uu}^{-1}\mathbf{Q}_{ux}$ with $\mathbf{K} = -\mathbf{Q}_{uu}^{-1}\mathbf{Q}_{ux}$. With the tensor terms dropped, those are exactly the discrete Riccati recursion and gain formula for the linearisation $(\mathbf{f}_x, \mathbf{f}_u)$ about the converged trajectory, with $V_{xx}$ playing the part of $\mathbf{P}_k$. Disagreement would mean one of three things: the iteration has not converged, so $\mathbf{Q}_u$ is not yet zero and the value recursion carries feedforward cross terms; the two calculations are using different stage weights or a different terminal weight; or one of them has a sign or transpose error, which this comparison is a cheap way to catch.
:::

::: check
You need a nonlinear model predictive controller running at $20\,\mathrm{Hz}$ on a flight processor. Can iLQR be the solver?
:::

::: answer
Plausibly, with three commitments. First, a hard iteration cap with defined behaviour when it is hit — typically one or two iterations per cycle, warm-started from the previous cycle's solution shifted by one step, which is a very good initial guess and is why the first-iteration improvement dominates. Second, bounded and statically allocated work: the backward pass is $O(N)$ with fixed-size matrix operations, so its execution time is predictable in a way that a general nonlinear programming solver's is not, which is the main reason this family is attractive for embedded use. Third, an independent feasibility check on the returned trajectory, because a truncated iteration returns the best found rather than a solution, and the warning above applies in full: no certificate, no global optimum, dependence on the guess. The worked example took roughly $10\,\mathrm{ms}$-scale work per iteration on six states and $120$ knots in interpreted code; a compiled implementation with analytic Jacobians on a shorter horizon is comfortably inside a $50\,\mathrm{ms}$ budget.
:::

## Summary

| Object | Statement |
| --- | --- |
| Problem | $\min\ \ell_f(\mathbf{x}_N) + \sum\ell(\mathbf{x}_k,\mathbf{u}_k)$ s.t. $\mathbf{x}_{k+1} = \mathbf{f}(\mathbf{x}_k,\mathbf{u}_k)$, nonlinear |
| $\mathbf{Q}$ terms | $\mathbf{Q}_x = \boldsymbol{\ell}_x + \mathbf{f}_x^\top V'_x$, $\mathbf{Q}_u = \boldsymbol{\ell}_u + \mathbf{f}_u^\top V'_x$, $\mathbf{Q}_{uu} = \boldsymbol{\ell}_{uu} + \mathbf{f}_u^\top V'_{xx}\mathbf{f}_u$, $\mathbf{Q}_{ux} = \boldsymbol{\ell}_{ux} + \mathbf{f}_u^\top V'_{xx}\mathbf{f}_x$ |
| iLQR versus DDP | DDP adds $V'_x\!\cdot\!\mathbf{f}_{xx}$, $V'_x\!\cdot\!\mathbf{f}_{uu}$, $V'_x\!\cdot\!\mathbf{f}_{ux}$; Newton against Gauss–Newton |
| Update | $\mathbf{k} = -\mathbf{Q}_{uu}^{-1}\mathbf{Q}_u$ (feedforward), $\mathbf{K} = -\mathbf{Q}_{uu}^{-1}\mathbf{Q}_{ux}$ (feedback) |
| Value recursion | $V_x = \mathbf{Q}_x + \mathbf{K}^\top\mathbf{Q}_{uu}\mathbf{k} + \mathbf{K}^\top\mathbf{Q}_u + \mathbf{Q}_{ux}^\top\mathbf{k}$; similarly for $V_{xx}$ |
| Forward pass | $\hat{\mathbf{u}}_k = \bar{\mathbf{u}}_k + \alpha\mathbf{k}_k + \mathbf{K}_k(\hat{\mathbf{x}}_k-\bar{\mathbf{x}}_k)$, rolled through the nonlinear dynamics |
| Line search | Compare the actual reduction with $\alpha\sum\mathbf{k}^\top\mathbf{Q}_u + \alpha^2\sum\tfrac12\mathbf{k}^\top\mathbf{Q}_{uu}\mathbf{k}$ |
| Regularisation | $\mu$ added to $V'_{xx}$ or $\mathbf{Q}_{uu}$; raise on failure, lower on success |
| Worked lander | Cost $3.13\times10^{5} \to 283.9$ in one iteration, $183.62$ at convergence |
| Convergence profile | $5\,\%$ in $4$ iterations, $1\,\%$ in $8$, $0.1\,\%$ in $30$, machine precision in $284$ |
| Converged result | Touchdown within $5\,\mathrm{mm}$ and $0.66^\circ$, thrust $1.01$–$1.53\times$ hover, peak pitch $21.9^\circ$ |
| By-product | The converged $\mathbf{K}_k$ is the TVLQR gain schedule, matched here to $3.7\times10^{-6}$ |
| Constraints | Box-constrained backward pass, augmented Lagrangian, or control squashing |
| Status | Local, no certificate, derivative-dependent, guess-dependent |

That closes the module. The linear quadratic regulator began as a way to avoid choosing closed-loop poles by hand; it ends as the subroutine inside the algorithm that designs a nonlinear trajectory and the controller that flies it.
