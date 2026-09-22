---
id: l02-the-finite-horizon-problem
title: The finite-horizon constrained optimal control problem
minutes: 19
covers:
  - The finite-horizon constrained optimal control problem
---

Step two of the cycle — "solve an optimal control problem over the next $N$ samples" — is where every design decision in an MPC actually lives. The weights, the horizon, the constraints and the terminal condition are the controller. Everything after this lesson is either algebra for solving the problem faster or theory about what the problem guarantees, but the specification is here, and a formulation with the wrong constraint in it will be solved beautifully and fly badly.

This lesson writes the problem down completely, names every symbol, and answers three questions a reviewer will ask about it: why the horizon is finite when the mission is not, what the weights mean physically, and how a regulator that drives the state to zero becomes a controller that tracks a setpoint without a steady-state offset.

The notation here is the one the rest of the module uses. It is worth learning in the form given, because the stability results later are statements about exactly these objects.

## The problem, term by term

At the current sample the navigation filter hands you a state $\mathbf{x}$. The controller solves

$$
\begin{aligned}
V_N^0(\mathbf{x}) = \min_{\mathbf{u}_0,\dots,\mathbf{u}_{N-1}} \quad & \sum_{k=0}^{N-1} \ell(\mathbf{x}_k, \mathbf{u}_k) \;+\; V_f(\mathbf{x}_N) \\
\text{subject to} \quad & \mathbf{x}_{k+1} = \mathbf{A}\mathbf{x}_k + \mathbf{B}\mathbf{u}_k, \qquad k = 0,\dots,N-1, \\
& \mathbf{x}_0 = \mathbf{x}, \\
& \mathbf{u}_k \in \mathbb{U}, \qquad k = 0,\dots,N-1, \\
& \mathbf{x}_k \in \mathbb{X}, \qquad k = 1,\dots,N-1, \\
& \mathbf{x}_N \in \mathbb{X}_f .
\end{aligned}
$$

Read the pieces one at a time.

**The prediction states $\mathbf{x}_k$** are not the vehicle's future states. They are what the model says will happen if the plan is executed and the model is right, and they exist only inside the optimiser. The subscript $k$ counts samples into the future from the current instant, so $\mathbf{x}_0$ is now and $\mathbf{x}_N$ is $N T_s$ seconds from now.

**The stage cost** $\ell(\mathbf{x}, \mathbf{u})$ prices one sample of the plan. For linear MPC it is the quadratic

$$
\ell(\mathbf{x}, \mathbf{u}) = \mathbf{x}^\top\mathbf{Q}\mathbf{x} + \mathbf{u}^\top\mathbf{R}\mathbf{u}, \qquad \mathbf{Q} \succeq 0,\ \ \mathbf{R} \succ 0 .
$$

$\mathbf{R} \succ 0$ is not a formality: it is what makes the cost strictly convex in the inputs, which gives a unique minimiser and a well-conditioned solve. $\mathbf{Q} \succeq 0$ allows states to be left unpenalised, though the stability theory later asks for $\ell$ to be positive definite in a weaker sense — detectability of $(\mathbf{A}, \mathbf{Q}^{1/2})$ — so that a state cannot hide from the cost forever.

**The terminal cost** $V_f(\mathbf{x}_N) = \mathbf{x}_N^\top\mathbf{P}\mathbf{x}_N$ prices everything after the horizon ends, in one term. Choosing it well is the difference between a controller that happens to work and one that is provably stable, and it has its own lesson later in this module.

**The constraint sets.** $\mathbb{U} \subset \mathbb{R}^m$ holds the input constraints — actuator limits, throttle bounds, a thrust-direction cone. $\mathbb{X} \subset \mathbb{R}^n$ holds the state constraints — a speed limit, a glide slope, an attitude-rate limit, a keep-out plane. $\mathbb{X}_f \subseteq \mathbb{X}$ is the terminal set, an extra constraint on where the plan is allowed to end. For linear MPC all three are polyhedra, described by linear inequalities, which is what keeps the problem a quadratic program.

**The value function** $V_N^0(\mathbf{x})$ is the optimal cost from state $\mathbf{x}$. It is the object the stability proof turns into a Lyapunov function, so it is worth naming even though the controller never uses its numerical value.

**The feasible set** $\mathcal{X}_N$ is the set of states $\mathbf{x}$ for which the problem above has at least one solution. Outside it the controller has no answer at all, and one of the central results of this module is that $\mathcal{X}_N$ can be made forward invariant so the loop never leaves it.

::: key The finite-horizon constrained optimal control problem
Minimise $\sum_{k=0}^{N-1}\ell(\mathbf{x}_k,\mathbf{u}_k) + V_f(\mathbf{x}_N)$ over the input sequence, subject to $\mathbf{x}_{k+1} = \mathbf{A}\mathbf{x}_k + \mathbf{B}\mathbf{u}_k$, $\mathbf{x}_0 = \mathbf{x}$, $\mathbf{u}_k \in \mathbb{U}$, $\mathbf{x}_k \in \mathbb{X}$, $\mathbf{x}_N \in \mathbb{X}_f$, with $\ell(\mathbf{x},\mathbf{u}) = \mathbf{x}^\top\mathbf{Q}\mathbf{x} + \mathbf{u}^\top\mathbf{R}\mathbf{u}$, $\mathbf{Q} \succeq 0$, $\mathbf{R} \succ 0$ and $V_f(\mathbf{x}) = \mathbf{x}^\top\mathbf{P}\mathbf{x}$. Its optimal value is $V_N^0(\mathbf{x})$ and its set of solvable initial states is $\mathcal{X}_N$.
:::

## Why the horizon is finite, and what that hides

The problem the vehicle actually faces runs to infinity, or at least to the end of the mission. It is truncated at $N$ for one reason: an infinite sum is not a finite-dimensional optimisation, and a flight computer solves finite-dimensional problems. The truncation is a modelling choice with consequences, and the honest way to see them is to compute the optimal cost at several horizons and compare against the true infinite-horizon value.

::: example What truncation costs, in numbers
Take the proximity-ops axis of the previous lesson: $\mathbf{A} = \begin{bmatrix} 1 & 0.1 \\ 0 & 1\end{bmatrix}$, $\mathbf{B} = \begin{bmatrix} 0.005 \\ 0.1\end{bmatrix}$, $\mathbf{Q} = \mathbf{I}$, $R = 0.1$, $|u| \le 1\,\mathrm{m/s^2}$, starting from $\mathbf{x} = (2\,\mathrm{m},\ 0)$. Solve the problem above with no terminal cost at all ($\mathbf{P} = \mathbf{0}$, $\mathbb{X}_f = \mathbb{R}^2$) and with the Riccati terminal cost $\mathbf{P}$ from the LQR module:

| $N$ | horizon (s) | $V_N^0$ with $\mathbf{P} = \mathbf{0}$ | $V_N^0$ with $\mathbf{P}$ from the Riccati equation |
| --- | --- | --- | --- |
| $5$ | $0.5$ | $19.79$ | $62.18$ |
| $10$ | $1.0$ | $37.08$ | $63.4959$ |
| $20$ | $2.0$ | $57.29$ | $63.4959$ |
| $40$ | $4.0$ | $63.38$ | $63.4959$ |
| $80$ | $8.0$ | $63.4959$ | $63.4959$ |

The true infinite-horizon constrained optimal cost is $63.4959$ (the $\mathbf{P} = \mathbf{0}$ column has converged to eight digits by $N = 80$, and $N = 200$ and $N = 400$ return the same number). Two things stand out. Without a terminal cost, a short horizon does not merely give a slightly wrong answer — at $N = 5$ it reports a cost of $19.79$, less than a third of the truth, because it charges nothing for the state it leaves behind at $0.5\,\mathrm{s}$. An optimiser that is not charged for the mess it leaves will leave a mess. With the right terminal cost, $N = 10$ already returns the exact infinite-horizon value.

Why exactly? Track the optimal trajectory. It saturates at $u = -1\,\mathrm{m/s^2}$ for exactly ten samples; at $k = 10$ the state is $(1.500, -1.000)$ and the unconstrained LQR command there is $-0.4351\,\mathrm{m/s^2}$, inside the limit for the first time. From that point the constraint never binds again and the optimal tail *is* the LQR tail, whose exact cost is $\mathbf{x}_{10}^\top\mathbf{P}\mathbf{x}_{10}$. The terminal cost is not an approximation in this case; it is the answer. That is the whole idea behind the terminal ingredients, seen once before it is proved.

For comparison, the unconstrained LQR cost from the same state is $\mathbf{x}^\top\mathbf{P}\mathbf{x} = 53.27$. The input limit costs $63.50 - 53.27 = 10.23$, about $19\,\%$ — which is what you are buying the optimiser for.
:::

::: warning A short horizon is a different controller, not a cheaper one
It is tempting to trim $N$ until the solve fits the frame and treat the result as the same controller, slightly degraded. The table above says otherwise: with $\mathbf{P} = \mathbf{0}$ and $N = 5$, the problem being solved has almost nothing to do with the problem you meant. The failure mode on a real vehicle is characteristic — the controller behaves well until a constraint appears slightly beyond the horizon, then commits to a trajectory it cannot stop from, discovers the constraint one sample later, and saturates. A descent guidance with a horizon shorter than the braking distance will fly straight at the ground with a perfectly optimal-looking plan. If $N$ has to be short, buy the lookahead back with a terminal cost and a terminal set rather than by hoping.
:::

## What the weights mean

$\mathbf{Q}$ and $\mathbf{R}$ are inherited from the LQR module, and the same guidance applies: scale each state and input by the largest deviation you are willing to accept, so that a diagonal $\mathbf{Q}$ has entries $1/x_{i,\max}^2$ and $\mathbf{R}$ has entries $1/u_{j,\max}^2$ (Bryson's rule), then adjust the ratio until the control effort matches the budget. What is specific to MPC is that two of the usual reasons for a large $\mathbf{R}$ have gone away. You no longer need $\mathbf{R}$ to keep the command inside the actuator limit, because the limit is a constraint; and you no longer need it to keep the vehicle away from a state boundary, because that is a constraint too. $\mathbf{R}$ is left doing what it should: pricing propellant, smoothness and actuator wear.

Three additions to the stage cost are common enough to know by name.

An **input-rate penalty** $\Delta\mathbf{u}_k = \mathbf{u}_k - \mathbf{u}_{k-1}$ with a weight $\mathbf{S}$ adds $\Delta\mathbf{u}_k^\top\mathbf{S}\,\Delta\mathbf{u}_k$ to each stage. It smooths the command, and it needs $\mathbf{u}_{-1}$ — the input already commanded — as an extra piece of initial condition. Reformulating with $\Delta\mathbf{u}$ as the decision variable and $\mathbf{u}$ as an extra state gives the controller integral action, at the cost of $m$ more states.

A **terminal or intermediate reference** replaces $\mathbf{x}_k$ by $\mathbf{x}_k - \mathbf{x}_k^{\text{ref}}$ in the stage cost, which is how preview enters: a time-stamped reference trajectory over the horizon costs nothing extra to solve and is the single largest advantage MPC has over a gain.

**Slack penalties** appear when state constraints are softened, and they are the subject of the constraints lesson.

## Tracking without an offset

The problem as written drives the state to the origin. Real tasks hold a standoff distance, track a glide slope, or point at a target, and the previous lesson showed that a plain regulator leaves a steady-state offset under a constant disturbance. The standard fix has two parts, and it is worth doing properly because "add an integrator" is not a well-defined instruction for a multi-input plant with constraints.

First, **estimate the disturbance**. Augment the model with a disturbance state $\mathbf{d}$ entering like an input, $\mathbf{x}_{k+1} = \mathbf{A}\mathbf{x}_k + \mathbf{B}(\mathbf{u}_k + \mathbf{d}_k)$ with $\mathbf{d}_{k+1} = \mathbf{d}_k$, and let the navigation filter estimate $\hat{\mathbf{d}}$ from the prediction error. This is the same augmentation used for accelerometer-bias estimation in the navigation modules.

Second, **compute a steady-state target** consistent with that disturbance and the setpoint $\mathbf{r}$ for the tracked output $\mathbf{y} = \mathbf{C}\mathbf{x}$. The pair $(\mathbf{x}_{ss}, \mathbf{u}_{ss})$ must be an equilibrium of the disturbed model that puts the output on target:

$$
\begin{bmatrix} \mathbf{A} - \mathbf{I} & \mathbf{B} \\ \mathbf{C} & \mathbf{0} \end{bmatrix}
\begin{bmatrix} \mathbf{x}_{ss} \\ \mathbf{u}_{ss} \end{bmatrix}
=
\begin{bmatrix} -\mathbf{B}\hat{\mathbf{d}} \\ \mathbf{r} \end{bmatrix} .
$$

Then solve the MPC problem in the deviation variables $\delta\mathbf{x} = \mathbf{x} - \mathbf{x}_{ss}$, $\delta\mathbf{u} = \mathbf{u} - \mathbf{u}_{ss}$, whose dynamics are the original $\mathbf{A}$, $\mathbf{B}$ with no disturbance term, and shift the input constraint set accordingly: $\mathbf{u} \in \mathbb{U}$ becomes $\delta\mathbf{u} \in \mathbb{U} - \mathbf{u}_{ss}$, the same set translated by the steady input.

::: example The target calculation on the proximity-ops axis
Take the tracked output to be position, $\mathbf{C} = [\,1\ \ 0\,]$, and a known disturbance acceleration $\hat{d} = 0.05\,\mathrm{m/s^2}$. The three equations are, row by row: $0.1\,x_{ss,2} + 0.005\,u_{ss} = -0.005\hat{d}$, then $0.1\,u_{ss} = -0.1\hat{d}$, then $x_{ss,1} = r$. The second gives $u_{ss} = -\hat{d} = -0.05\,\mathrm{m/s^2}$; substituting into the first gives $x_{ss,2} = 0$; and the third sets the position. So $\mathbf{x}_{ss} = (r, 0)$ and $u_{ss} = -0.05\,\mathrm{m/s^2}$ — the steady input is the one that cancels the disturbance, which is what you would have written by hand, and the matrix equation is the version that still works when there are six states and four thrusters.

Running the loop in deviation variables with $r = 0$ from $\mathbf{x} = (2, 0)$, the vehicle settles at $\mathbf{x} = (0, 0)$ to eight decimal places with $u = -0.0500\,\mathrm{m/s^2}$ — the $19.3\,\mathrm{mm}$ offset of the previous lesson is gone, because the optimiser is now penalising the deviation from an input that already carries the disturbance.

The same machinery does setpoint changes. Commanding $r = -5\,\mathrm{m}$ from rest at the origin, with the input constraint shifted to $-0.95 \le \delta u \le 1.05$, the loop accelerates at the $1\,\mathrm{m/s^2}$ limit for about $2.1\,\mathrm{s}$, coasts through a peak speed near $2\,\mathrm{m/s}$, brakes at the limit, and is within $0.8\,\mathrm{mm}$ of the target at $t = 10\,\mathrm{s}$. The command profile is bang-bang at both ends and smooth in between — the signature of a quadratic cost meeting a box constraint, exactly as the optimization module's treatment of quadratic programs predicts.
:::

## Is the problem well posed?

Three properties have to hold before any of this is worth solving, and all three are inherited from the convex analysis of the optimization module.

**Convexity.** The cost is a convex quadratic, the dynamics are affine equality constraints, and $\mathbb{U}$, $\mathbb{X}$, $\mathbb{X}_f$ are polyhedra. So the feasible set is a polyhedron and the problem is a convex quadratic program: any local minimum is global, and the solver returns a certificate rather than a hope.

**Existence.** If the feasible set is non-empty and $\mathbb{U}$ is compact — which it is, because actuators are bounded — a continuous cost attains its minimum on it. If $\mathbb{U}$ were unbounded you would need $\mathbf{R} \succ 0$ to keep the cost coercive, which you have anyway.

**Uniqueness.** Eliminate the states, as the next lesson does, and the cost becomes a quadratic in the stacked input sequence with Hessian $2(\mathbf{S}_u^\top\bar{\mathbf{Q}}\mathbf{S}_u + \bar{\mathbf{R}})$. With $\mathbf{R} \succ 0$ the $\bar{\mathbf{R}}$ term alone makes it positive definite, so the minimiser is unique and the implicit feedback law $\boldsymbol{\kappa}_N$ is a genuine function rather than a set-valued map. This matters more than it sounds: a controller that can return either of two different commands for the same state is not something you can certify.

One property the problem does *not* have for free is feasibility at every state. $\mathcal{X}_N$ is generally a strict subset of $\mathbb{X}$ — if the terminal set is small and $N$ is short, most states cannot reach it in time — and a formulation with hard state constraints can be driven out of $\mathcal{X}_N$ by a disturbance. That is the feasibility problem, and it gets two lessons of its own.

## Check yourself

::: check
In the problem statement the state constraint is imposed for $k = 1,\dots,N-1$, with $k = 0$ left out. Why?
:::

::: answer
Because $\mathbf{x}_0 = \mathbf{x}$ is data, not a decision variable. Imposing $\mathbf{x} \in \mathbb{X}$ as a constraint would make the problem infeasible whenever the vehicle is already outside the state constraint — after a disturbance, a sensor glitch or a mode transition — which is exactly the moment you most want a command. Leaving $k = 0$ out means the optimiser accepts where it is and plans to get back inside, and $k = N$ is covered separately by the terminal set $\mathbb{X}_f \subseteq \mathbb{X}$. On a real vehicle this is not hypothetical: the state constraint is often violated at the instant MPC takes over from another mode, and a formulation that constrains $\mathbf{x}_0$ hands the mode logic an infeasible problem on its first cycle.
:::

::: check
Your formulation has $\mathbf{Q} = \mathrm{diag}(1, 1)$ for a state in metres and metres per second, and $R = 0.1$ for an input in $\mathrm{m/s^2}$. A colleague changes the position unit to millimetres without changing $\mathbf{Q}$. What happens to the closed loop?
:::

::: answer
The position entry of the state is multiplied by $1000$, so the term $x_1^2$ in the stage cost is multiplied by $10^6$, and position error now dominates the cost completely. The controller becomes extremely aggressive on position and indifferent to velocity and effort, hitting the input limit for far longer and, if there were a velocity constraint, riding it. Weights are not dimensionless numbers; each carries units that make $\ell$ a consistent quantity, and $\mathbf{Q}$ would have to be rescaled to $\mathrm{diag}(10^{-6}, 1)$ to preserve the same controller. This is the reason for scaling states and inputs to order one before choosing weights — Bryson's rule is a unit-normalisation device before it is a tuning heuristic.
:::

::: check
From the truncation table, the $\mathbf{P} = \mathbf{0}$ value at $N = 5$ is $19.79$ while the true optimal cost is $63.50$. Is the optimiser wrong?
:::

::: answer
No — it is solving the problem it was given, correctly. The $N = 5$ problem charges for half a second of motion and then stops counting, so a plan that arrives at $t = 0.5\,\mathrm{s}$ with $1.875\,\mathrm{m}$ of position error and $0.5\,\mathrm{m/s}$ of closing speed pays nothing for that state. The value $19.79$ is the exact optimal cost of that truncated problem. The error is in the formulation, not the solver, which is the general lesson: MPC failures are almost never solver failures, they are specification failures, and the way to find them is to compare the value function against a long-horizon reference exactly as the table does. Adding the Riccati terminal cost raises the $N = 5$ value to $62.18$, within $2\,\%$ of the truth, without changing the solve size at all.
:::

::: check
Write the steady-state target equations for a vehicle where the number of tracked outputs exceeds the number of inputs. What goes wrong, and what is done instead?
:::

::: answer
The matrix $\begin{bmatrix} \mathbf{A} - \mathbf{I} & \mathbf{B} \\ \mathbf{C} & \mathbf{0}\end{bmatrix}$ has more rows than columns, so the system is overdetermined and generally has no solution: you cannot hold more independent outputs at arbitrary values than you have independent inputs. The standard treatment replaces the equality by a least-squares problem — minimise $\|\mathbf{C}\mathbf{x}_{ss} - \mathbf{r}\|^2_{\mathbf{T}}$ over equilibria of the disturbed model, with a weight $\mathbf{T}$ saying which outputs matter most, and usually with the input constraints imposed so the target is reachable. That target quadratic program runs once per cycle before the MPC solve, and it is where a designer states which objective is sacrificed when the vehicle cannot do everything at once. Getting an unreachable target is a common cause of an MPC that looks unstable: it is chasing a setpoint that no equilibrium satisfies.
:::

::: check
Why does the module insist on $\mathbf{R} \succ 0$ rather than $\mathbf{R} \succeq 0$, given that a zero input weight would seem to give the most aggressive controller?
:::

::: answer
With $\mathbf{R} = \mathbf{0}$ the cost is flat in any input direction that does not change the predicted states — and for a plant with more inputs than states, or with a redundant actuator set, those directions exist. The minimiser is then not unique: the solver may return any point on a flat face, the command can jump between equally optimal values from cycle to cycle, and the condensed Hessian is singular so the solve is ill-conditioned. The controller also becomes bang-bang against the input limits, since nothing prices effort. A small $\mathbf{R}$ is often right — it is the cheap-control limit of the LQR module — but it should be small and positive, chosen so the effort term is a known fraction of the total cost rather than zero. In a flight formulation $\mathbf{R} \succ 0$ is additionally what guarantees a unique, repeatable command for a given state, which is a testability requirement.
:::

## Summary

| Object | Statement |
| --- | --- |
| Problem $P_N(\mathbf{x})$ | $\min \sum_{k=0}^{N-1}\ell(\mathbf{x}_k,\mathbf{u}_k) + V_f(\mathbf{x}_N)$ s.t. dynamics, $\mathbf{x}_0 = \mathbf{x}$, $\mathbf{u}_k \in \mathbb{U}$, $\mathbf{x}_k \in \mathbb{X}$, $\mathbf{x}_N \in \mathbb{X}_f$ |
| Stage cost | $\ell(\mathbf{x},\mathbf{u}) = \mathbf{x}^\top\mathbf{Q}\mathbf{x} + \mathbf{u}^\top\mathbf{R}\mathbf{u}$, $\mathbf{Q} \succeq 0$, $\mathbf{R} \succ 0$ |
| Terminal cost | $V_f(\mathbf{x}) = \mathbf{x}^\top\mathbf{P}\mathbf{x}$, priced for everything beyond the horizon |
| Value function | $V_N^0(\mathbf{x})$, the optimal cost; the future Lyapunov function |
| Feasible set | $\mathcal{X}_N$, the states from which $P_N$ has a solution |
| Truncation | $\mathbf{P} = \mathbf{0}$, $N = 5$: $V^0 = 19.79$ against a true $63.4959$; Riccati $\mathbf{P}$ at $N = 10$: exact |
| Why exact | The optimal trajectory saturates for ten samples, then the LQR tail is feasible and optimal from $(1.500, -1.000)$ |
| Weight scaling | Bryson: $Q_{ii} = 1/x_{i,\max}^2$, $R_{jj} = 1/u_{j,\max}^2$; weights carry units |
| Rate penalty | $\Delta\mathbf{u}_k = \mathbf{u}_k - \mathbf{u}_{k-1}$ with weight $\mathbf{S}$; as a decision variable it gives integral action |
| Target calculation | $\begin{bmatrix} \mathbf{A} - \mathbf{I} & \mathbf{B} \\ \mathbf{C} & \mathbf{0}\end{bmatrix}\begin{bmatrix}\mathbf{x}_{ss}\\ \mathbf{u}_{ss}\end{bmatrix} = \begin{bmatrix}-\mathbf{B}\hat{\mathbf{d}} \\ \mathbf{r}\end{bmatrix}$, then solve in $\delta\mathbf{x}, \delta\mathbf{u}$ |
| Offset-free result | $u_{ss} = -\hat{d} = -0.05\,\mathrm{m/s^2}$, $\mathbf{x}_{ss} = (r, 0)$; closed loop settles on target to eight decimals |
| Well-posedness | Convex QP; minimum attained because $\mathbb{U}$ is compact; unique because $\mathbf{R} \succ 0$ |

The next lesson turns this statement into matrices — the two standard ways of writing it as a quadratic program, and why the choice between them decides how the solve time grows with $N$.
