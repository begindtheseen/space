---
id: l14-ilqr-and-ddp
title: iLQR and DDP, the nonlinear extension
minutes: 22
covers:
  - iLQR and DDP as the nonlinear extension
---

Think about how you learn to throw a ball into a basket. You do not solve the physics first. You throw, watch where it lands, and adjust. Each throw corrects the last, and after a few tries you are close.

The previous lesson left the general optimal control problem in an awkward place. The Pontryagin conditions are correct and completely general. But what they hand you is a two-point boundary value problem in the state and costate, to be solved numerically, starting from a guess of the initial costate that nobody has any feel for. Shooting methods on that system are notoriously fragile. The costate equations run in the unstable direction, so a small error in $\boldsymbol{\lambda}(0)$ grows exponentially, and the trajectory blows up before it reaches $t_f$.

**[[Differential dynamic programming|ddp-history]]** (DDP) and its cheaper cousin **iterative LQR** (iLQR) take the basketball route. Start with a guessed trajectory. Around it, approximate the dynamics as linear and the cost as quadratic. That turns the problem into a time-varying LQR problem, which you already know how to solve with a Riccati sweep. Use the answer to improve the trajectory, and repeat. Each iteration is one backward sweep and one forward run. Everything runs backward from the terminal cost, which is the stable direction, and as a bonus the method hands you the feedback gains needed to fly the trajectory it found.

This is how nonlinear trajectories are optimized for landers and walking robots, and inside nonlinear model predictive control. It is also the natural end point of this module: the linear quadratic regulator used as a **subroutine** instead of as the final answer.

## The problem and the idea

Work in discrete time, because that is what a computer does. Choose the controls $\mathbf{u}_0,\dots,\mathbf{u}_{N-1}$ to

$$
\min_{\mathbf{u}_0,\dots,\mathbf{u}_{N-1}}\; \ell_f(\mathbf{x}_N) + \sum_{k=0}^{N-1}\ell(\mathbf{x}_k,\mathbf{u}_k)
\qquad\text{subject to}\qquad
\mathbf{x}_{k+1} = \mathbf{f}(\mathbf{x}_k,\mathbf{u}_k),
$$

with the start $\mathbf{x}_0$ given. Here $k$ counts time steps ("knots") from $0$ to $N$. The **stage cost** $\ell$ (a script "ell") is the charge for each step; $\ell_f$ is the terminal charge. The dynamics $\mathbf{f}$ and the costs are nonlinear but smooth.

Suppose you have a current guess: a control sequence $\bar{\mathbf{u}}_k$ (read "u bar sub k") and the trajectory $\bar{\mathbf{x}}_k$ it produces when you run the dynamics forward. The bar marks "the current nominal". One iteration turns this guess into a better one.

## The backward pass

Let $V_k(\mathbf{x})$ be the best **cost-to-go** — the lowest cost you can still achieve from state $\mathbf{x}$ at step $k$ — with $V_N = \ell_f$. Bellman's principle from the second lesson gives

$$
V_k(\mathbf{x}) = \min_{\mathbf{u}}\big[\ell(\mathbf{x},\mathbf{u}) + V_{k+1}(\mathbf{f}(\mathbf{x},\mathbf{u}))\big].
$$

The bracket is "pay for this step, then act optimally from wherever you land". We cannot minimize it exactly for a nonlinear $\mathbf{f}$. So look only at small **deviations** $(\delta\mathbf{x},\delta\mathbf{u})$ ("delta x, delta u") from the nominal, and define how much the bracket changes:

$$
Q(\delta\mathbf{x},\delta\mathbf{u}) = \ell(\bar{\mathbf{x}}+\delta\mathbf{x},\bar{\mathbf{u}}+\delta\mathbf{u}) - \ell(\bar{\mathbf{x}},\bar{\mathbf{u}})
+ V_{k+1}\big(\mathbf{f}(\bar{\mathbf{x}}+\delta\mathbf{x},\bar{\mathbf{u}}+\delta\mathbf{u})\big) - V_{k+1}\big(\mathbf{f}(\bar{\mathbf{x}},\bar{\mathbf{u}})\big).
$$

(This $Q$ is a function of the deviations, not an LQR weight matrix; its subscripted pieces below are its derivatives.) Now replace $Q$ by its **[[second-order Taylor expansion|quadratic-model]]** — the best-fitting bowl at the nominal:

$$
Q \approx \mathbf{Q}_x^\top\delta\mathbf{x} + \mathbf{Q}_u^\top\delta\mathbf{u}
+ \tfrac12\,\delta\mathbf{x}^\top\mathbf{Q}_{xx}\delta\mathbf{x} + \delta\mathbf{u}^\top\mathbf{Q}_{ux}\delta\mathbf{x} + \tfrac12\,\delta\mathbf{u}^\top\mathbf{Q}_{uu}\delta\mathbf{u}.
$$

Subscripts mean derivatives: $\mathbf{Q}_x$ is the slope with respect to $\mathbf{x}$, $\mathbf{Q}_{uu}$ the curvature with respect to $\mathbf{u}$, and so on. Write $\mathbf{f}_x, \mathbf{f}_u$ for the **[[Jacobians|jacobian-word]]** of the dynamics (the matrices of first derivatives, which play the part of $\mathbf{A}$ and $\mathbf{B}$), and $V'_x, V'_{xx}$ (read "V prime") for the slope and curvature of the value at step $k+1$. The chain rule gives

$$
\begin{aligned}
\mathbf{Q}_x &= \boldsymbol{\ell}_x + \mathbf{f}_x^\top V'_x, &
\mathbf{Q}_{xx} &= \boldsymbol{\ell}_{xx} + \mathbf{f}_x^\top V'_{xx}\mathbf{f}_x \;(+\; V'_x\!\cdot\!\mathbf{f}_{xx}),\\
\mathbf{Q}_u &= \boldsymbol{\ell}_u + \mathbf{f}_u^\top V'_x, &
\mathbf{Q}_{uu} &= \boldsymbol{\ell}_{uu} + \mathbf{f}_u^\top V'_{xx}\mathbf{f}_u \;(+\; V'_x\!\cdot\!\mathbf{f}_{uu}),\\
& & \mathbf{Q}_{ux} &= \boldsymbol{\ell}_{ux} + \mathbf{f}_u^\top V'_{xx}\mathbf{f}_x \;(+\; V'_x\!\cdot\!\mathbf{f}_{ux}).
\end{aligned}
$$

Look at the terms in brackets. They take the value slope $V'_x$ and combine it with the second derivatives of the dynamics — how the dynamics *curve*. These are **[[tensors|tensor-word]]**, three-index arrays. Keeping them is **DDP**. Dropping them is **iLQR**. That single choice is the whole difference between the two methods.

### The update law

$Q$ is now a quadratic in $\delta\mathbf{u}$. Its bottom is where the slope in $\delta\mathbf{u}$ is zero: $\mathbf{Q}_u + \mathbf{Q}_{ux}\delta\mathbf{x} + \mathbf{Q}_{uu}\delta\mathbf{u} = \mathbf{0}$. Solve for $\delta\mathbf{u}$:

$$
\delta\mathbf{u}^\star = \mathbf{k} + \mathbf{K}\,\delta\mathbf{x},
\qquad
\mathbf{k} = -\mathbf{Q}_{uu}^{-1}\mathbf{Q}_u,
\qquad
\mathbf{K} = -\mathbf{Q}_{uu}^{-1}\mathbf{Q}_{ux}.
$$

Two pieces. The **feedforward** correction $\mathbf{k}$ is "change the plan by this much". The **feedback** gain $\mathbf{K}$ is "and if you find yourself off the plan by $\delta\mathbf{x}$, correct by $\mathbf{K}\delta\mathbf{x}$".

Put this law back into $Q$ to get the value at step $k$, and read off its slope and curvature:

$$
V_x = \mathbf{Q}_x + \mathbf{K}^\top\mathbf{Q}_{uu}\mathbf{k} + \mathbf{K}^\top\mathbf{Q}_u + \mathbf{Q}_{ux}^\top\mathbf{k},
\qquad
V_{xx} = \mathbf{Q}_{xx} + \mathbf{K}^\top\mathbf{Q}_{uu}\mathbf{K} + \mathbf{K}^\top\mathbf{Q}_{ux} + \mathbf{Q}_{ux}^\top\mathbf{K}.
$$

These feed the step before. Starting from $V_N = \ell_f$ at the end, you sweep backward to $k = 0$. Along the way, add up the **predicted cost reduction**, $\Delta V = \mathbf{k}^\top\mathbf{Q}_u + \tfrac12\mathbf{k}^\top\mathbf{Q}_{uu}\mathbf{k}$ at each step; the line search will use it.

Compare these with the discrete Riccati recursion of the discrete-time lesson. They are the same equations. $\mathbf{Q}_{uu}$ plays the role of $\mathbf{R}+\mathbf{B}^\top\mathbf{P}\mathbf{B}$, $\mathbf{Q}_{ux}$ plays $\mathbf{B}^\top\mathbf{P}\mathbf{A}$, and $V_{xx}$ plays $\mathbf{P}$. The one new thing is the feedforward $\mathbf{k}$, which exists because the current trajectory is not yet optimal, so $\mathbf{Q}_u \neq \mathbf{0}$.

::: note Why V_xx is exactly the Riccati update
Substitute $\mathbf{K} = -\mathbf{Q}_{uu}^{-1}\mathbf{Q}_{ux}$ into the $V_{xx}$ formula. The term $\mathbf{K}^\top\mathbf{Q}_{uu}\mathbf{K}$ becomes $\mathbf{Q}_{ux}^\top\mathbf{Q}_{uu}^{-1}\mathbf{Q}_{ux}$. Each of the two cross terms becomes $-\mathbf{Q}_{ux}^\top\mathbf{Q}_{uu}^{-1}\mathbf{Q}_{ux}$. One plus, two minus, so

$$
V_{xx} = \mathbf{Q}_{xx} - \mathbf{Q}_{ux}^\top\mathbf{Q}_{uu}^{-1}\mathbf{Q}_{ux}.
$$

With the tensors dropped (and $\boldsymbol{\ell}_{ux} = \mathbf{0}$, as for the lander), that is $\boldsymbol{\ell}_{xx} + \mathbf{A}^\top\mathbf{P}\mathbf{A} - \mathbf{A}^\top\mathbf{P}\mathbf{B}(\boldsymbol{\ell}_{uu} + \mathbf{B}^\top\mathbf{P}\mathbf{B})^{-1}\mathbf{B}^\top\mathbf{P}\mathbf{A}$ with $\mathbf{A} = \mathbf{f}_x$, $\mathbf{B} = \mathbf{f}_u$, $\mathbf{P} = V'_{xx}$ — the discrete Riccati step, word for word. Notice that $\mathbf{k}$ does not appear at all. So in iLQR, apart from the small regularization $\mu$, the gains $\mathbf{K}_k$ at *every* iteration are the time-varying LQR gains for the linearization about the current nominal.
:::

## The forward pass

The backward pass produced a **[[policy|two-passes]]** — a rule for what to do — not a trajectory. To get the new trajectory, run the rule through the real **nonlinear** dynamics:

$$
\hat{\mathbf{x}}_0 = \mathbf{x}_0,
\qquad
\hat{\mathbf{u}}_k = \bar{\mathbf{u}}_k + \alpha\,\mathbf{k}_k + \mathbf{K}_k\big(\hat{\mathbf{x}}_k - \bar{\mathbf{x}}_k\big),
\qquad
\hat{\mathbf{x}}_{k+1} = \mathbf{f}\big(\hat{\mathbf{x}}_k, \hat{\mathbf{u}}_k\big).
$$

The hat (read "x hat") marks the new candidate. The number $\alpha \in (0,1]$ ("alpha") is a **step length**: how much of the proposed change to take. Three details matter a great deal.

**The feedback term is not scaled by $\alpha$.** Its job is to keep the new run close to the nominal the quadratic model was built around. Damping it would defeat that. Only the feedforward correction is scaled.

**The [[line search|line-search]] compares against the predicted reduction.** The backward pass predicts that the cost will fall by $\alpha\sum\mathbf{k}^\top\mathbf{Q}_u + \alpha^2\sum\tfrac12\mathbf{k}^\top\mathbf{Q}_{uu}\mathbf{k}$ (a negative number, since the cost goes down). Try $\alpha = 1$. If the actual reduction is at least a set fraction (say a tenth) of the predicted one, accept. If not, halve $\alpha$ and try again. If no $\alpha$ works, the quadratic model is not trustworthy, and the fix is regularization, not an ever smaller step.

**Regularization.** $\mathbf{Q}_{uu}$ must be positive definite (a bowl, not a saddle) for "minimize $Q$" to make sense. Far from the solution it often is not, especially for DDP, whose tensor terms can curve either way. The fix is to add $\mu\mathbf{I}$ ("mu times the identity") to $\mathbf{Q}_{uu}$ — or better, add it to $V'_{xx}$ before forming $\mathbf{Q}_{uu}$ and $\mathbf{Q}_{ux}$. The second choice penalizes moving away from the current *trajectory*, not only the current *control*, and behaves like a **[[trust region|trust-region]]** on the states. Raise $\mu$ tenfold whenever the backward pass fails its **Cholesky factorization** (a quick matrix test that succeeds only for positive definite matrices) or the line search finds no acceptable step. Halve it after every success.

::: key iLQR and DDP in one line
Linearize the dynamics and quadratize the cost about the current trajectory, solve the resulting time-varying LQR backward pass for a feedforward plus feedback update, roll forward with a line search, repeat. It is Newton's method on a trajectory.
:::

Strictly, Newton's method is DDP, which keeps all the second derivatives. iLQR drops the dynamics' curvature, which makes it the **Gauss–Newton** version of the same idea. The difference shows up in how fast they finish, as the example below shows.

::: example A planar lander, from a guess that crashes
A hopper flies in a vertical plane. Mass $m = 500\,\mathrm{kg}$, pitch inertia $J = 400\,\mathrm{kg\,m^2}$. The state is $\mathbf{x} = (p_x, p_z, \theta, v_x, v_z, \omega)$: horizontal and vertical position, pitch angle, the two velocities, and pitch rate. The controls are $\mathbf{u} = (T, \tau)$: thrust along the body axis, and a pitch torque ($\tau$, "tau"). Tilting the body tilts the thrust:

$$
\dot v_x = -\frac{T}{m}\sin\theta,
\qquad
\dot v_z = \frac{T}{m}\cos\theta - g,
\qquad
\dot\omega = \frac{\tau}{J},
$$

with $g = 9.80665\,\mathrm{m/s^2}$. The nonlinearity is the $\sin\theta$ and $\cos\theta$ coupling thrust into the two directions — that is what lets the vehicle steer at all. The dynamics are stepped with **[[RK4|rk4]]** at $\Delta t = 0.05\,\mathrm{s}$ over $N = 120$ steps, so $6\,\mathrm{s}$.

**The cost.** Hover thrust is $T_{hov} = mg = 4903\,\mathrm{N}$. Each step is charged $\ell = \tfrac12\Delta t\,(\mathbf{x}^\top\mathbf{Q}\mathbf{x} + \delta\mathbf{u}^\top\mathbf{R}\,\delta\mathbf{u})$ with $\delta\mathbf{u} = (T - T_{hov},\ \tau)$, $\mathbf{Q} = 0.02\,\mathbf{I}$ and $\mathbf{R} = \mathrm{diag}(10^{-5},\ 10^{-4})$, all in SI units. The terminal charge is $\ell_f = \tfrac12\mathbf{x}_N^\top\mathbf{Q}_f\mathbf{x}_N$ with $\mathbf{Q}_f = \mathrm{diag}(500,500,5000,500,500,5000)$. The landing target is the origin: on the pad, upright, at rest.

**The guess.** Start from $\mathbf{x}_0 = (-40\,\mathrm{m},\ 60\,\mathrm{m},\ 0,\ 5\,\mathrm{m/s},\ -15\,\mathrm{m/s},\ 0)$ with the laziest guess possible: hover thrust and zero torque the whole time. The vehicle keeps drifting at its starting velocity. After $6\,\mathrm{s}$ it is at $p_x = -10\,\mathrm{m}$ and $p_z = -30\,\mathrm{m}$ — thirty meters below the pad. Its cost is $3.126\times10^{5}$, nearly all of it the terminal charge $\tfrac12 \cdot 500\,(10^2 + 30^2 + 5^2 + 15^2) = 312\,500$.

**The iterations.**

| accepted iteration | cost | $\alpha$ | $\mu$ | $\max\lvert\mathbf{k}\rvert$ |
| --- | --- | --- | --- | --- |
| $1$ | $459.22$ | $1$ | $1$ | $2.63\times10^{5}$ |
| $2$ | $200.88$ | $1$ | $0.5$ | $1966$ |
| $3$ | $189.55$ | $1$ | $0.25$ | $917$ |
| $4$ | $188.00$ | $1$ | $0.125$ | $172$ |
| $5$ | $187.59$ | $1$ | $6.3\times10^{-2}$ | $131$ |
| $10$ | $187.374$ | $1$ | $2.0\times10^{-3}$ | $8.22$ |
| $20$ | $187.37318$ | $1$ | $1.9\times10^{-6}$ | $4.98\times10^{-2}$ |
| $29$ | $187.37318$ | $1$ | $3.7\times10^{-9}$ | $4.9\times10^{-4}$ |

**Reading the table.** The first iteration does almost all the work: one backward pass and one full step take the cost from $3.13\times10^{5}$ to $459$, a factor of about $680$. The quadratic model of a mostly-quadratic cost around a mostly-linear plant is very good.

The first $\max|\mathbf{k}|$ looks absurd: $2.63\times10^{5}\,\mathrm{N}$ of extra thrust, at step $114$. It is not what the vehicle flies. By then the new run is far from the old nominal, and the feedback term $\mathbf{K}(\hat{\mathbf{x}}-\bar{\mathbf{x}})$ cancels nearly all of it. The thrust actually flown on that iteration stayed between $3326$ and $8149\,\mathrm{N}$.

Then the finish. The cost is within $5\,\%$ of its final value after $3$ iterations, within $1\,\%$ after $4$, and within $0.1\,\%$ after $6$. After that, the leftover error shrinks by the same factor, about $0.36$, every iteration: $0.622$, $0.215$, $0.075$, $0.027$, … That steady ratio is **[[linear convergence|convergence-plot]]**, the signature of Gauss–Newton. It took $29$ iterations to settle to about twelve digits. On this run, each iteration took about $50\,\mathrm{ms}$ in plain Python with finite-difference Jacobians.

**The answer.** Touchdown at $p_x = -4.6\,\mathrm{mm}$, $p_z = 3.6\,\mathrm{mm}$, $\theta = 0.91^\circ$, $v_x = 0.016\,\mathrm{m/s}$, $v_z = -0.025\,\mathrm{m/s}$, $\omega = -0.32^\circ/\mathrm{s}$. Thrust ranges from $4661$ to $7437\,\mathrm{N}$ — $0.95$ to $1.52$ times hover. Peak torque is $643\,\mathrm{N\,m}$. The vehicle first tilts about $20^\circ$ toward the pad to start moving sideways, then about $23^\circ$ the other way to brake, and straightens up to land. Nobody wrote that maneuver into the cost; minimizing the cost produced it.

Sanity check: millimeters and centimeters per second at touchdown is what a terminal weight of $500$ against running weights of $0.02$ should buy.
:::

::: example The feedback gains are the TVLQR gains
At convergence the feedforward $\mathbf{k}$ has gone to zero — that is what convergence means. What remains is the gain schedule $\mathbf{K}_k$. By the note above, iLQR's gains are always the time-varying LQR gains for the linearization about the current nominal. At convergence the nominal *is* the optimal trajectory, so $\mathbf{K}_k$ should be the TVLQR gain schedule for flying it.

Check that directly on the converged lander. Solve the discrete Riccati recursion independently along the optimal trajectory, with the same $\mathbf{Q}$, $\mathbf{R}$, $\mathbf{Q}_f$ and $\Delta t$, and compare. The largest difference is $0.0060$, against gains as large as $1.85\times10^{4}$ — a relative agreement of $3.3\times10^{-7}$. That leftover is not different mathematics: the stored gains were computed about the trajectory from one iteration earlier, and the last step moved it very slightly. Entry by entry at $k = 0$:

| | $p_x$ | $p_z$ | $\theta$ | $v_x$ | $v_z$ | $\omega$ |
| --- | --- | --- | --- | --- | --- | --- |
| iLQR thrust row | $-10.355$ | $-87.403$ | $-156.511$ | $-47.045$ | $-328.686$ | $-171.695$ |
| Riccati sweep | $-10.355$ | $-87.403$ | $-156.512$ | $-47.045$ | $-328.686$ | $-171.695$ |

Sanity check on the signs: the $p_z$ entry says that if the vehicle is one meter lower than planned, thrust goes up by $87\,\mathrm{N}$. The $v_z$ entry says that if it is sinking $1\,\mathrm{m/s}$ faster than planned, thrust goes up by $329\,\mathrm{N}$. Both push it back toward the plan.

This is the practical payoff. One run of iLQR delivers both the nominal trajectory to fly and the gain schedule that holds the vehicle on it against dispersions. That is the trajectory-stabilization problem of the time-varying LQR lesson, solved for free. The same $\mathbf{P}_k$ that produced the gains also gives the cost-to-go certificate for a funnel around the trajectory.
:::

## Constraints, and what is still missing

Real vehicles have a throttle range, a gimbal limit and a glide slope, and none of that appears above. Three standard extensions:

- **Control limits.** Instead of minimizing the quadratic in $\delta\mathbf{u}$ freely, solve a small box-constrained quadratic program at each step. This is control-limited DDP. It costs a small projected-Newton solve per knot, and the feedback gain rows for inputs pinned at a limit are set to zero.
- **State constraints.** Penalty terms are the crude fix, and they bend the solution near the boundary. Augmented-Lagrangian iLQR is the standard alternative: put multipliers on the constraints, solve the unconstrained problem, update the multipliers, repeat. It is the constrained-optimization machinery from the optimization module wrapped around this one.
- **Squashing.** Pass the control through a saturating function, such as a scaled hyperbolic tangent, so the limits hold by construction. Simple, but it makes the problem badly conditioned near saturation.

::: warning What iLQR does not give you
It is a local method on a nonconvex problem, with every consequence from the optimization module: no global optimum, no certificate, no bound on the number of iterations, and an answer that depends on the starting guess. A different starting trajectory can converge to a quite different flight path.

It also needs derivatives — a Jacobian of the dynamics at every knot, and for DDP the second-derivative tensors too. A wrong derivative shows up as a line search that never accepts a step, not as a visibly wrong answer. Check the Jacobians against **[[finite differences|finite-differences]]** before blaming the algorithm.

And the converged trajectory solves the discrete problem you posed, not the continuous one. A convergence study in $\Delta t$ belongs beside any claim about an optimal trajectory.
:::

::: note Where this sits among the alternatives
These methods are **indirect in spirit but direct in practice**. They never form the costate explicitly, yet the value slope $V_x$ they carry backward *is* the costate, and at convergence it satisfies the Pontryagin conditions of the previous lesson.

Against a direct transcription handed to a general nonlinear programming solver, iLQR has two structural advantages. Its cost per iteration grows linearly with the horizon length $N$, because the Riccati sweep exploits the step-by-step structure that a dense solver would pay for as $N^3$ and a sparse one has to discover. And it returns a feedback policy, not only an open-loop sequence. Against sequential convex programming, it gives up the ability to enforce hard constraints exactly. Which one flies depends on whether the constraints or the horizon length is the harder part.
:::

## Check yourself

::: check
State the single difference between iLQR and DDP, and say what it costs and buys.
:::

::: answer
DDP keeps the second-derivative tensors of the dynamics in the quadratic model — the terms $V'_x\!\cdot\!\mathbf{f}_{xx}$, $V'_x\!\cdot\!\mathbf{f}_{uu}$ and $V'_x\!\cdot\!\mathbf{f}_{ux}$ in $\mathbf{Q}_{xx}$, $\mathbf{Q}_{uu}$ and $\mathbf{Q}_{ux}$. iLQR drops them.

What keeping them buys: DDP is a true Newton method on the trajectory, with quadratic convergence near the solution — the number of correct digits roughly doubles each iteration. iLQR is Gauss–Newton, with linear convergence: in the worked example the error shrank by a steady factor of about $0.36$ per iteration.

What it costs: the tensors themselves — $n$ second-derivative matrices of size $(n+m)\times(n+m)$ at every knot, which for six states and two inputs over $120$ knots is a lot of differentiation. They also make $\mathbf{Q}_{uu}$ indefinite more often, so DDP needs more regularization. Run on the same lander from the same guess, DDP needed $\mu$ as large as $6250$ early on and took $21$ iterations to get within $1\,\%$ of the optimum, against iLQR's $4$. Then it finished dramatically: $1.27$, $0.019$, $1.1\times10^{-5}$, $5.7\times10^{-9}$ above the optimum on successive iterations. Both reached the same cost, $187.37318$. The usual engineering choice is iLQR, because the early iterations are what matter.
:::

::: check
Why is the feedback term $\mathbf{K}_k(\hat{\mathbf{x}}_k-\bar{\mathbf{x}}_k)$ not multiplied by the step length $\alpha$?
:::

::: answer
Because it has a different job from the feedforward term. $\mathbf{k}_k$ is the proposed *improvement*, and $\alpha$ exists to take less of it when the quadratic model overreaches. $\mathbf{K}_k$ keeps the new run close to the nominal the model was built around: as soon as the nonlinear rollout drifts from $\bar{\mathbf{x}}_k$, the feedback pulls it back toward where the linearization is valid. The first iteration of the worked example shows it doing exactly that, cancelling a feedforward of $2.63\times10^{5}\,\mathrm{N}$.

Scaling the feedback down would let the rollout wander exactly when the step is being cut because the model is already in trouble. The line search would then fail for both reasons at once. Implementations that damp the feedback term are a known way to make iLQR converge badly on stiff or unstable systems.
:::

::: check
Your iLQR run rejects every step length at the first iteration. List what you would check.
:::

::: answer
First, the derivatives. Compare $\mathbf{f}_x$ and $\mathbf{f}_u$ at a few knots against central finite differences. A wrong Jacobian gives a "downhill" direction that is not downhill, and the line search is right to refuse it.

Second, the regularization. If $\mathbf{Q}_{uu}$ is barely positive definite, $\mathbf{k}$ is enormous, and even $\alpha = 2^{-10}$ may overshoot. Raise $\mu$ and try again — which the algorithm does automatically.

Third, the initial guess. A rollout that blows up or produces non-finite numbers gives a meaningless quadratic model. The fix is a better nominal, often found by solving a simpler problem first.

Fourth, the cost scaling. If the terminal weight is many orders of magnitude above the stage cost, the model is dominated by one term and the step is effectively a pure terminal correction.

Fifth, and only then, the possibility that the horizon is too short for the maneuver to be possible at all.
:::

::: check
At convergence the iLQR feedback gains matched an independent Riccati sweep to $3.3\times10^{-7}$. Explain why they must agree, and what it would mean if they did not.
:::

::: answer
With the tensor terms dropped, the $V_{xx}$ update simplifies to $V_{xx} = \mathbf{Q}_{xx} - \mathbf{Q}_{ux}^\top\mathbf{Q}_{uu}^{-1}\mathbf{Q}_{ux}$ and the gain is $\mathbf{K} = -\mathbf{Q}_{uu}^{-1}\mathbf{Q}_{ux}$. The feedforward $\mathbf{k}$ never enters either one. With $\mathbf{A} = \mathbf{f}_x$, $\mathbf{B} = \mathbf{f}_u$ and $\mathbf{P}_k$ in the place of $V_{xx}$, those are exactly the discrete Riccati recursion and gain formula for the linearization about the nominal. At convergence $\mathbf{Q}_u = \mathbf{0}$, so $\mathbf{k} = \mathbf{0}$ and the nominal stops moving: it is the optimal trajectory, and the gains are the TVLQR gains about it.

A disagreement would mean one of four things. The two calculations are linearized about different trajectories (the iteration has not converged, so the nominal is still moving). The regularization $\mu$ is still large and is distorting $\mathbf{Q}_{uu}$ and $\mathbf{Q}_{ux}$. The two use different stage weights, terminal weight or time step. Or one has a sign or transpose error, which this comparison is a cheap way to catch.

One more subtlety: for DDP the gains would *not* match, even at convergence. Its tensor terms contain $V'_x$, which is the costate, and the costate is not zero at the optimum.
:::

::: check
You need a nonlinear [[model predictive controller|mpc]] running at $20\,\mathrm{Hz}$ on a flight processor. Can iLQR be the solver?
:::

::: answer
Plausibly, with three commitments.

First, a hard cap on iterations, with defined behavior when it is hit. Typically one or two iterations per cycle, **warm-started** from the previous cycle's solution shifted by one step. That is a very good initial guess, which is why the first iterations' large improvements matter most.

Second, bounded, statically allocated work. The backward pass is $O(N)$ (work proportional to $N$) with fixed-size matrix operations, so its running time is predictable in a way a general nonlinear programming solver's is not. That is the main reason this family is attractive for embedded use.

Third, an independent check that the returned trajectory is feasible. A truncated iteration returns the best found so far, not a solution, and the warning above applies in full: no certificate, no global optimum, dependence on the guess.

On timing: the worked example took about $50\,\mathrm{ms}$ per iteration for six states and $120$ knots in plain Python with finite-difference Jacobians. That alone would fill the whole $50\,\mathrm{ms}$ cycle. A compiled implementation with analytic Jacobians on a shorter horizon is typically one to two orders of magnitude faster and fits comfortably.
:::

## Summary

| Object | Statement |
| --- | --- |
| Problem | $\min\ \ell_f(\mathbf{x}_N) + \sum\ell(\mathbf{x}_k,\mathbf{u}_k)$ s.t. $\mathbf{x}_{k+1} = \mathbf{f}(\mathbf{x}_k,\mathbf{u}_k)$, nonlinear |
| $\mathbf{Q}$ terms | $\mathbf{Q}_x = \boldsymbol{\ell}_x + \mathbf{f}_x^\top V'_x$, $\mathbf{Q}_u = \boldsymbol{\ell}_u + \mathbf{f}_u^\top V'_x$, $\mathbf{Q}_{uu} = \boldsymbol{\ell}_{uu} + \mathbf{f}_u^\top V'_{xx}\mathbf{f}_u$, $\mathbf{Q}_{ux} = \boldsymbol{\ell}_{ux} + \mathbf{f}_u^\top V'_{xx}\mathbf{f}_x$ |
| iLQR versus DDP | DDP adds $V'_x\!\cdot\!\mathbf{f}_{xx}$, $V'_x\!\cdot\!\mathbf{f}_{uu}$, $V'_x\!\cdot\!\mathbf{f}_{ux}$; Newton against Gauss–Newton |
| Update | $\mathbf{k} = -\mathbf{Q}_{uu}^{-1}\mathbf{Q}_u$ (feedforward), $\mathbf{K} = -\mathbf{Q}_{uu}^{-1}\mathbf{Q}_{ux}$ (feedback) |
| Value recursion | $V_x = \mathbf{Q}_x + \mathbf{K}^\top\mathbf{Q}_{uu}\mathbf{k} + \mathbf{K}^\top\mathbf{Q}_u + \mathbf{Q}_{ux}^\top\mathbf{k}$; $V_{xx} = \mathbf{Q}_{xx} - \mathbf{Q}_{ux}^\top\mathbf{Q}_{uu}^{-1}\mathbf{Q}_{ux}$ |
| Forward pass | $\hat{\mathbf{u}}_k = \bar{\mathbf{u}}_k + \alpha\mathbf{k}_k + \mathbf{K}_k(\hat{\mathbf{x}}_k-\bar{\mathbf{x}}_k)$, rolled through the nonlinear dynamics |
| Line search | Compare the actual reduction with $\alpha\sum\mathbf{k}^\top\mathbf{Q}_u + \alpha^2\sum\tfrac12\mathbf{k}^\top\mathbf{Q}_{uu}\mathbf{k}$ |
| Regularization | $\mu$ added to $V'_{xx}$ or $\mathbf{Q}_{uu}$; raise on failure, lower on success |
| Worked lander | Cost $3.13\times10^{5} \to 459$ in one iteration, $187.37$ at convergence |
| Convergence profile | $5\,\%$ in $3$ iterations, $1\,\%$ in $4$, $0.1\,\%$ in $6$; then error $\times 0.36$ per iteration, $29$ in all |
| Converged result | Touchdown within $5\,\mathrm{mm}$ and $0.9^\circ$, thrust $0.95$–$1.52\times$ hover, pitch $-20^\circ$ then $+23^\circ$ |
| By-product | The converged $\mathbf{K}_k$ is the TVLQR gain schedule, matched here to $3.3\times10^{-7}$ |
| Constraints | Box-constrained backward pass, augmented Lagrangian, or control squashing |
| Status | Local, no certificate, derivative-dependent, guess-dependent |

That closes the module. The linear quadratic regulator began as a way to avoid placing closed-loop poles by hand. It ends as the subroutine inside the algorithm that designs a nonlinear trajectory and the controller that flies it.

::: context ddp-history Where the names come from
Differential dynamic programming was introduced by David Mayne in 1966 and developed in the book *Differential Dynamic Programming* by David Jacobson and Mayne in 1970 — "differential" because it applies Bellman's dynamic programming to small differences around a nominal. The name iterative LQR came much later, from Weiwei Li and Emanuel Todorov in 2004, who used it to study how the brain might control arm movements. The robotics community then adopted both for legged robots and aerial vehicles.
:::

::: context quadratic-model A bowl that fits at one point
A second-order Taylor expansion replaces a curvy function near a point with the parabola (or, in many dimensions, the bowl) that has the same value, the same slope and the same curvature there. Near the point it is an excellent stand-in; far away it can be badly wrong. That is the whole story of iLQR in one sentence: minimize the stand-in, move, build a fresh stand-in where you landed. The line search and the regularization exist for the moments when you have moved too far for the stand-in to be trusted.
:::

::: context jacobian-word What a Jacobian is
A Jacobian is the table of first derivatives of a vector function: entry $(i, j)$ says how much output $i$ changes per unit change of input $j$. For a one-step map $\mathbf{x}_{k+1} = \mathbf{f}(\mathbf{x}_k, \mathbf{u}_k)$, the Jacobian with respect to $\mathbf{x}$ is exactly the $\mathbf{A}$ matrix you would get by linearizing, and the one with respect to $\mathbf{u}$ is $\mathbf{B}$. The name honors Carl Jacobi, a 19th-century German mathematician.
:::

::: context tensor-word Three-index arrays
A vector has one index, a matrix two. The second derivatives of a vector function need three: which output, and which pair of inputs you differentiate by. For the lander that is $6 \times 8 \times 8$ numbers at every knot. DDP never stores the whole thing in the $\mathbf{Q}$ terms; it immediately weights the six output layers by the six entries of $V'_x$ and adds them up, which is what the dot in $V'_x\!\cdot\!\mathbf{f}_{xx}$ means. The result is an ordinary matrix.
:::

::: context two-passes Backward for the plan, forward for the truth
Each iteration sweeps the knots twice. The backward pass starts at the end, where the cost-to-go is known exactly, and works toward the start, producing $\mathbf{k}_k$ and $\mathbf{K}_k$ at each knot. The forward pass starts at the known initial state and runs the real nonlinear dynamics with that rule, producing the new trajectory.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="75" x2="320" y2="75" stroke="#1f2a44" stroke-width="1.5"/>
  <g fill="#1f2a44">
    <circle cx="40" cy="75" r="4"/><circle cx="80" cy="75" r="4"/><circle cx="120" cy="75" r="4"/><circle cx="160" cy="75" r="4"/><circle cx="200" cy="75" r="4"/><circle cx="240" cy="75" r="4"/><circle cx="280" cy="75" r="4"/><circle cx="320" cy="75" r="4"/>
  </g>
  <text x="40" y="95" font-size="11" text-anchor="middle" fill="#1f2a44">k = 0</text>
  <text x="320" y="95" font-size="11" text-anchor="middle" fill="#1f2a44">k = N</text>
  <line x1="310" y1="45" x2="55" y2="45" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="45,45 57,39 57,51" fill="#b4232c"/>
  <text x="180" y="22" font-size="12" text-anchor="middle" fill="#b4232c">backward: start from V_N = ℓ_f</text>
  <text x="180" y="37" font-size="11" text-anchor="middle" fill="#b4232c">Riccati sweep gives k and K at each knot</text>
  <line x1="50" y1="112" x2="305" y2="112" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="315,112 303,106 303,118" fill="#1d6fd1"/>
  <text x="180" y="132" font-size="12" text-anchor="middle" fill="#1d6fd1">forward: start from x_0, run the nonlinear f</text>
  <text x="180" y="146" font-size="11" text-anchor="middle" fill="#1d6fd1">with the new rule, get the new trajectory</text>
</svg>
```
:::

::: context line-search Taking less of a good idea
The backward pass says "change the plan by $\mathbf{k}$, and expect the cost to drop by this much". A line search tests that promise: try the full step; if the real drop is much smaller than promised, try half; then a quarter. It is the same caution as testing a new recipe on half a batch. In the worked lander every accepted step was a full step, $\alpha = 1$, because the model was good. On harder problems — tighter turns, stronger nonlinearity — the halving does real work.
:::

::: context trust-region Don't wander off the map
Adding $\mu\mathbf{I}$ to $V'_{xx}$ is like adding a spring that pulls the new trajectory toward the old one. With a stiff spring (large $\mu$), steps are short and safe but slow. With a weak spring, you take the model's full advice. Raising $\mu$ after a failure and lowering it after a success lets the method find its own pace.

:::

::: context rk4 Stepping the dynamics
RK4, the fourth-order Runge–Kutta method, advances a differential equation by one time step by sampling the slope four times — at the start, twice in the middle, and at the end — and taking a weighted average. Its error per step shrinks like $\Delta t^5$, so a $0.05\,\mathrm{s}$ step on a lander this slow is very accurate. For iLQR, the RK4 step *is* the dynamics $\mathbf{f}$: the Jacobians are of the whole four-stage step, not of the underlying differential equation.
:::

::: context convergence-plot Two ways to finish
This plot shows how far above the optimum each method is, iteration by iteration, on the worked lander, on a logarithmic scale (each gridline is a factor of $10^4$). iLQR (blue) plunges at once and then falls along a straight line — the same factor, $0.36$, every iteration. DDP (red), run from the same guess, crawls for twenty iterations with heavy regularization, then drops off a cliff: the number of correct digits doubles each time. Both end at the same cost.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <g stroke="#6c7a93" stroke-width="0.8" stroke-dasharray="3 3">
    <line x1="40" y1="20" x2="340" y2="20"/><line x1="40" y1="57.5" x2="340" y2="57.5"/><line x1="40" y1="95" x2="340" y2="95"/><line x1="40" y1="132.5" x2="340" y2="132.5"/><line x1="40" y1="170" x2="340" y2="170"/>
  </g>
  <line x1="40" y1="15" x2="40" y2="170" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="40" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.2"/>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="36" y="24">1e6</text><text x="36" y="61.5">1e2</text><text x="36" y="99">1e−2</text><text x="36" y="136.5">1e−6</text><text x="36" y="174">1e−10</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="186">0</text><text x="140" y="186">10</text><text x="240" y="186">20</text><text x="340" y="186">30</text>
  </g>
  <text x="190" y="199" font-size="11" text-anchor="middle" fill="#1f2a44">iteration</text>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40,24.7 50,53.4 60,65.7 70,73.1 80,78.2 90,82.5 100,86.8 110,91.0 120,95.2 130,99.3 140,103.5 150,107.7 160,111.9 170,116.0 180,120.2 190,124.4 200,128.5 210,132.7 220,136.9 230,141.1 240,145.2 250,149.4 260,153.6 270,157.7 280,161.9 290,166.1"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2.5" points="40,24.7 50,25.9 60,29.1 70,30.4 80,30.8 90,34.2 100,36.2 110,37.9 120,40.1 130,41.9 140,43.2 150,44.6 160,46.3 170,48.6 180,50.3 190,52.8 200,54.5 210,56.2 220,59.8 230,60.2 240,63.2 250,75.3 260,92.3 270,122.9 280,153.5"/>
  <text x="120" y="120" font-size="12" fill="#1d6fd1">iLQR</text>
  <text x="200" y="45" font-size="12" fill="#b4232c">DDP</text>
</svg>
```
:::

::: context finite-differences Checking derivatives by nudging
To check a derivative, nudge one input by a tiny $h$ both ways and divide the change in the output by $2h$. This central difference is accurate to about $h^2$. Compare it, entry by entry, with your analytic Jacobian: if they disagree beyond the fifth or sixth digit, the analytic one is usually wrong. The worked lander used central differences as its Jacobians, which is slower but hard to get wrong.
:::

::: context mpc Planning again every cycle
Model predictive control solves a short trajectory-optimization problem, applies only the first control, then measures the state and solves again on the next cycle. Because each new problem is almost the same as the last, the previous answer shifted by one step is a superb first guess. Here is the lander's optimal path at true scale, with the body axis drawn every second; a model predictive controller would re-plan a path like this twenty times a second.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="185" x2="330" y2="185" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="192" y="185" width="24" height="6" fill="#1f2a44"/>
  <text x="204" y="204" font-size="11" text-anchor="middle" fill="#1f2a44">pad</text>
  <polyline fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4" points="100.0,29.0 152.0,185.0"/>
  <text x="142" y="204" font-size="11" text-anchor="middle" fill="#6c7a93">guess hits here</text>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="100.0,29.0 102.6,36.8 105.2,44.7 108.0,52.5 110.9,60.2 114.1,67.8 117.6,75.4 121.6,82.9 125.9,90.2 130.7,97.4 135.8,104.5 141.2,111.4 146.8,118.1 152.6,124.5 158.5,130.7 164.3,136.6 170.0,142.2 175.4,147.5 180.5,152.4 185.1,157.1 189.3,161.5 193.0,165.6 196.1,169.3 198.7,172.8 200.6,175.8 202.1,178.5 203.0,180.8 203.6,182.6 203.9,183.9 204.0,184.7 204.0,185.0"/>
  <g stroke="#b4232c" stroke-width="3" stroke-linecap="round">
    <line x1="100.0" y1="38.0" x2="100.0" y2="20.0"/>
    <line x1="111.4" y1="76.4" x2="116.8" y2="59.3"/>
    <line x1="133.5" y1="113.2" x2="138.0" y2="95.8"/>
    <line x1="165.3" y1="145.5" x2="163.3" y2="127.6"/>
    <line x1="192.6" y1="169.9" x2="186.0" y2="153.1"/>
  </g>
  <text x="110" y="24" font-size="11" fill="#1f2a44">start (−40 m, 60 m)</text>
  <text x="124" y="62" font-size="11" fill="#1f2a44">tilt toward pad</text>
  <text x="196" y="140" font-size="11" fill="#1f2a44">tilt back to brake</text>
</svg>
```
:::
