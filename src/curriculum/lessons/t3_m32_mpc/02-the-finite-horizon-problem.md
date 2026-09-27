---
id: l02-the-finite-horizon-problem
title: The finite-horizon constrained optimal control problem
minutes: 20
covers:
  - The finite-horizon constrained optimal control problem
---

Planning a road trip takes three things. A map of how the roads connect. A sense of what makes a trip good or bad — time, gas, tolls. And the rules you cannot break — the car holds only so much fuel, and you must reach the hotel before it closes. Change any one of those and you get a different trip, even with the same planner.

Step two of the MPC cycle — "solve an optimal control problem over the next $N$ samples" — is the same. The model is the map. The weights are what makes a plan good. The limits are the rules. Together with the horizon and the end condition, they *are* the controller. Everything after this lesson is either algebra for solving the problem faster or theory about what it guarantees. But the specification lives here. A formulation with the wrong limit in it will be solved beautifully and fly badly.

This lesson writes the problem down completely and names every symbol. Then it answers three questions a reviewer will ask: why the horizon is finite when the mission is not, what the weights mean physically, and how a controller that drives the state to zero can hold a setpoint without a steady offset. Learn the notation as given — the stability results later are statements about exactly these objects.

## The problem, term by term

At the current sample, the navigation filter hands you a state $\mathbf{x}$. The controller solves

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

Read "min over $\mathbf{u}_0$ to $\mathbf{u}_{N-1}$" as "choose the commands that make this total as small as possible". "Subject to" means "while obeying". The symbol $\in$ reads "is in" or "belongs to". Now take the pieces one at a time.

**The prediction states $\mathbf{x}_k$** are not the vehicle's real future states. They are what the model says will happen *if* the plan is carried out and *if* the model is right. They exist only inside the optimizer. The subscript $k$ counts samples into the future from now: $\mathbf{x}_0$ is now, and $\mathbf{x}_N$ is $N T_s$ seconds from now.

**The stage cost** $\ell(\mathbf{x}, \mathbf{u})$ (the letter is a script "ell") is the price of one sample of the plan. For linear MPC it is the quadratic

$$
\ell(\mathbf{x}, \mathbf{u}) = \mathbf{x}^\top\mathbf{Q}\mathbf{x} + \mathbf{u}^\top\mathbf{R}\mathbf{u}, \qquad \mathbf{Q} \succeq 0,\ \ \mathbf{R} \succ 0 .
$$

Read $\mathbf{R} \succ 0$ as "$\mathbf{R}$ is **[[positive definite|bowl]]**": $\mathbf{u}^\top\mathbf{R}\mathbf{u} > 0$ for every nonzero $\mathbf{u}$, so any thrust at all costs something. Read $\mathbf{Q} \succeq 0$ as "positive semidefinite": never negative, but some directions may cost nothing.

$\mathbf{R} \succ 0$ is not a formality. It makes the cost strictly bowl-shaped in the inputs, which gives exactly one best plan and a well-behaved solve. $\mathbf{Q} \succeq 0$ lets you leave some states unpriced. The stability theory later asks for a little more: $(\mathbf{A}, \mathbf{Q}^{1/2})$ must be **[[detectable|detectable]]**, so that no unstable motion can hide from the cost forever.

**The terminal cost** $V_f(\mathbf{x}_N) = \mathbf{x}_N^\top\mathbf{P}\mathbf{x}_N$ prices everything after the horizon ends, in one term. Choosing it well is the difference between a controller that happens to work and one that is provably stable. It gets its own lesson later.

**The constraint sets** are the rules. $\mathbb{U} \subset \mathbb{R}^m$ (read "blackboard U") holds the input limits: thrust bounds, throttle range, a cone of allowed thrust directions. $\mathbb{X} \subset \mathbb{R}^n$ holds the state limits: a speed limit, a glide slope, a turn-rate limit, a keep-out plane. $\mathbb{X}_f \subseteq \mathbb{X}$ is the **terminal set**, an extra rule about where the plan is allowed to end. For linear MPC all three are **[[polyhedra|polyhedron]]** — shapes cut out by straight-line (linear) inequalities. That is what keeps the problem a quadratic program.

**The value function** $V_N^0(\mathbf{x})$ ("V sub N, superscript zero") is the best total cost you can get starting from $\mathbf{x}$. The controller never uses its number. But the stability proof turns it into a **[[Lyapunov function|lyapunov]]**, so it is worth naming.

**The feasible set** $\mathcal{X}_N$ is the set of starting states for which the problem has at least one solution — at least one plan that obeys every rule. Outside it the controller has no answer at all. A central result of this module is that the loop can be designed so it never leaves $\mathcal{X}_N$.

::: key The finite-horizon constrained optimal control problem
Minimize $\sum_{k=0}^{N-1}\ell(\mathbf{x}_k,\mathbf{u}_k) + V_f(\mathbf{x}_N)$ over the input sequence, subject to $\mathbf{x}_{k+1} = \mathbf{A}\mathbf{x}_k + \mathbf{B}\mathbf{u}_k$, $\mathbf{x}_0 = \mathbf{x}$, $\mathbf{u}_k \in \mathbb{U}$, $\mathbf{x}_k \in \mathbb{X}$, $\mathbf{x}_N \in \mathbb{X}_f$, with $\ell(\mathbf{x},\mathbf{u}) = \mathbf{x}^\top\mathbf{Q}\mathbf{x} + \mathbf{u}^\top\mathbf{R}\mathbf{u}$, $\mathbf{Q} \succeq 0$, $\mathbf{R} \succ 0$ and $V_f(\mathbf{x}) = \mathbf{x}^\top\mathbf{P}\mathbf{x}$. Its optimal value is $V_N^0(\mathbf{x})$ and its set of solvable initial states is $\mathcal{X}_N$.
:::

## Why the horizon is finite, and what that hides

The real problem runs to infinity, or at least to the end of the mission. We cut it at $N$ for one reason: an infinite sum is not a problem with a finite number of unknowns, and a flight computer can only solve those. The cut is a modeling choice with consequences. The honest way to see them is to compute the best cost at several horizons and compare it with the true infinite-horizon value.

::: example What truncation costs, in numbers
Use the proximity-operations axis from the previous lesson: $\mathbf{A} = \begin{bmatrix} 1 & 0.1 \\ 0 & 1\end{bmatrix}$, $\mathbf{B} = \begin{bmatrix} 0.005 \\ 0.1\end{bmatrix}$, $\mathbf{Q} = \mathbf{I}$, $R = 0.1$, $|u| \le 1\,\mathrm{m/s^2}$, starting from $\mathbf{x} = (2\,\mathrm{m},\ 0)$. Solve it two ways: with no terminal cost at all ($\mathbf{P} = \mathbf{0}$, and no terminal set, $\mathbb{X}_f = \mathbb{R}^2$), and with the Riccati terminal cost $\mathbf{P}$ from the LQR module.

| $N$ | horizon (s) | $V_N^0$ with $\mathbf{P} = \mathbf{0}$ | $V_N^0$ with $\mathbf{P}$ from the Riccati equation |
| --- | --- | --- | --- |
| $5$ | $0.5$ | $19.79$ | $62.18$ |
| $10$ | $1.0$ | $37.08$ | $63.4959$ |
| $20$ | $2.0$ | $57.29$ | $63.4959$ |
| $40$ | $4.0$ | $63.38$ | $63.4959$ |
| $80$ | $8.0$ | $63.4959$ | $63.4959$ |

The [[true infinite-horizon cost|cost-curves]], limits included, is $63.4959$. (The $\mathbf{P} = \mathbf{0}$ column has settled to that value by $N = 80$, and $N = 200$ gives the same number.)

**Without a terminal cost**, a short horizon is not slightly wrong. At $N = 5$ it reports $19.79$ — less than a third of the truth — because it charges nothing for the state it leaves behind at $0.5\,\mathrm{s}$. An optimizer that is not charged for the mess it leaves will leave a mess.

**With the right terminal cost**, $N = 10$ already gives the exact answer. Why? Follow the best path. It holds $u = -1\,\mathrm{m/s^2}$ for exactly ten samples. At $k = 10$ the state is $(1.500, -1.000)$. Check: after $1\,\mathrm{s}$ of braking at $1\,\mathrm{m/s^2}$ the velocity is $-1\,\mathrm{m/s}$ and the distance covered is $\tfrac{1}{2}(1)(1)^2 = 0.5\,\mathrm{m}$, leaving $1.5\,\mathrm{m}$. There, the plain LQR command is $-0.4351\,\mathrm{m/s^2}$ — inside the limit for the first time. From then on the limit never binds again. So the best tail *is* the LQR tail, and its exact cost is $\mathbf{x}_{10}^\top\mathbf{P}\mathbf{x}_{10}$. The terminal cost is not an approximation here; it is the answer. That is the whole idea behind the terminal ingredients, seen once before it is proved.

For comparison, LQR with no thrust limit, from the same start, costs $\mathbf{x}^\top\mathbf{P}\mathbf{x} = 53.27$. The thrust limit adds $63.50 - 53.27 = 10.23$, about $19\,\%$. Handling that limit properly is what you are buying the optimizer for.
:::

::: warning A short horizon is a different controller, not a cheaper one
It is tempting to shrink $N$ until the solve fits the time slot and call the result the same controller, slightly worse. The table says otherwise. With $\mathbf{P} = \mathbf{0}$ and $N = 5$, the problem being solved has almost nothing to do with the one you meant.

On a real vehicle the failure has a typical shape. The controller behaves well until a limit appears a little beyond the horizon. It commits to a path it cannot stop from, discovers the limit one sample later, and slams the thruster against its maximum — too late. A descent guidance with a horizon shorter than its braking distance will fly straight at the ground with a perfectly optimal-looking plan. If $N$ must be short, buy the lookahead back with a terminal cost and a terminal set — not by hoping.
:::

## What the weights mean

$\mathbf{Q}$ and $\mathbf{R}$ come from the LQR module, and the same advice applies. Scale each state and input by the largest deviation you are willing to accept. A diagonal $\mathbf{Q}$ gets entries $1/x_{i,\max}^2$ and $\mathbf{R}$ gets entries $1/u_{j,\max}^2$ — this is **[[Bryson's rule|bryson]]**. Then adjust the ratio until the control effort fits the budget.

What is special in MPC is that two old reasons for a large $\mathbf{R}$ are gone. You no longer need $\mathbf{R}$ to keep the command inside the thrust limit, because the limit is now a rule. And you no longer need it to keep the vehicle away from a state boundary, because that is a rule too. $\mathbf{R}$ is left doing its real job: pricing propellant, smoothness and actuator wear.

Three extra terms in the stage cost are common enough to know by name.

- **An input-rate penalty.** Let $\Delta\mathbf{u}_k = \mathbf{u}_k - \mathbf{u}_{k-1}$ ("delta u": how much the command changes). Adding $\Delta\mathbf{u}_k^\top\mathbf{S}\,\Delta\mathbf{u}_k$ with a weight $\mathbf{S}$ smooths the command. It needs $\mathbf{u}_{-1}$, the command already sent, as extra starting data. Rewriting the problem with $\Delta\mathbf{u}$ as the unknown and $\mathbf{u}$ as an extra state gives the controller integral action, at the cost of $m$ more states.
- **A reference.** Replace $\mathbf{x}_k$ by $\mathbf{x}_k - \mathbf{x}_k^{\text{ref}}$ in the stage cost. This is how **[[preview|preview]]** enters: a time-stamped reference path over the horizon costs nothing extra to solve, and it is the single largest advantage MPC has over a gain.
- **Slack penalties**, which appear when state limits are softened. They are the subject of the constraints lesson.

## Tracking without an offset

As written, the problem drives the state to zero. Real tasks hold a standoff distance, follow a glide slope or point at a target. And the previous lesson showed that a plain regulator leaves a steady offset under a constant push. The standard fix has two parts. It is worth doing properly, because "add an integrator" is not a clear instruction for a plant with several inputs and limits.

**First, estimate the disturbance.** Add a disturbance state $\mathbf{d}$ that enters like an input and stays constant:

$$
\mathbf{x}_{k+1} = \mathbf{A}\mathbf{x}_k + \mathbf{B}(\mathbf{u}_k + \mathbf{d}_k), \qquad \mathbf{d}_{k+1} = \mathbf{d}_k .
$$

The navigation filter estimates $\hat{\mathbf{d}}$ from how far off its predictions are. This is the same trick used to estimate **[[accelerometer bias|bias-bridge]]** in the navigation modules.

**Second, compute a steady target.** Let the output you want to hold be $\mathbf{y} = \mathbf{C}\mathbf{x}$, with setpoint $\mathbf{r}$. Find a pair $(\mathbf{x}_{ss}, \mathbf{u}_{ss})$ ("ss" for steady state) that is a resting point of the disturbed model *and* puts the output on target. Resting means $\mathbf{x}_{ss} = \mathbf{A}\mathbf{x}_{ss} + \mathbf{B}(\mathbf{u}_{ss} + \hat{\mathbf{d}})$. Move everything to one side and stack the two conditions:

$$
\begin{bmatrix} \mathbf{A} - \mathbf{I} & \mathbf{B} \\ \mathbf{C} & \mathbf{0} \end{bmatrix}
\begin{bmatrix} \mathbf{x}_{ss} \\ \mathbf{u}_{ss} \end{bmatrix}
=
\begin{bmatrix} -\mathbf{B}\hat{\mathbf{d}} \\ \mathbf{r} \end{bmatrix} .
$$

Then solve the MPC problem in the **deviation variables** $\delta\mathbf{x} = \mathbf{x} - \mathbf{x}_{ss}$ and $\delta\mathbf{u} = \mathbf{u} - \mathbf{u}_{ss}$ ("delta x": distance from the target). Their dynamics are the original $\mathbf{A}$ and $\mathbf{B}$ with no disturbance term. The input limits shift with them: $\mathbf{u} \in \mathbb{U}$ becomes $\delta\mathbf{u} \in \mathbb{U} - \mathbf{u}_{ss}$, the same set slid over by the steady input.

::: example The target calculation on the proximity-ops axis
Hold position, so $\mathbf{C} = [\,1\ \ 0\,]$. The disturbance estimate is $\hat{d} = 0.05\,\mathrm{m/s^2}$. Write the three rows of the matrix equation out one at a time:

- Row 1: $0.1\,x_{ss,2} + 0.005\,u_{ss} = -0.005\hat{d}$.
- Row 2: $0.1\,u_{ss} = -0.1\hat{d}$.
- Row 3: $x_{ss,1} = r$.

Row 2 gives $u_{ss} = -\hat{d} = -0.05\,\mathrm{m/s^2}$. Put that into row 1: $0.1\,x_{ss,2} - 0.00025 = -0.00025$, so $x_{ss,2} = 0$. Row 3 sets the position. So $\mathbf{x}_{ss} = (r, 0)$ and $u_{ss} = -0.05\,\mathrm{m/s^2}$.

Does that make sense? The steady thrust exactly cancels the push, and the vehicle sits still at the setpoint — what you would write by hand. The matrix equation is the version that still works with six states and four thrusters.

**Regulating.** Run the loop in deviation variables with $r = 0$, from $\mathbf{x} = (2, 0)$. The vehicle settles at $(0, 0)$ to eight decimal places, with $u = -0.0500\,\mathrm{m/s^2}$. The $19.3\,\mathrm{mm}$ offset of the previous lesson is gone, because the optimizer now measures effort from a command that already carries the disturbance.

**Changing setpoint.** Command $r = -5\,\mathrm{m}$ from rest at the origin. The thrust limit $-1 \le u \le 1$ shifts to $-0.95 \le \delta u \le 1.05$ (subtract $u_{ss} = -0.05$ from both ends). The loop pushes at the full $1\,\mathrm{m/s^2}$ for the first $2.1\,\mathrm{s}$ and peaks at $2.05\,\mathrm{m/s}$. The command changes sign between $t = 2.1$ and $2.2\,\mathrm{s}$, then brakes at the limit until $3.3\,\mathrm{s}$. After that it eases off smoothly, and at $t = 10\,\mathrm{s}$ the vehicle is within $0.8\,\mathrm{mm}$ of the target. The command is **[[saturated in two arcs|two-arcs]]** — full push, then full brake — joined by a short smooth switch and followed by a smooth tail. That is the signature of a quadratic cost meeting a box limit, as the optimization module's treatment of quadratic programs predicts.
:::

## Is the problem well posed?

Three properties must hold before any of this is worth solving. All three come from the convex analysis of the optimization module.

**Convexity — no false valleys.** The cost is a convex quadratic, the dynamics are linear equalities, and $\mathbb{U}$, $\mathbb{X}$, $\mathbb{X}_f$ are polyhedra. So the allowed region is a polyhedron and the problem is a convex quadratic program. Any local minimum is the global one, and the solver returns a certificate rather than a hope.

**Existence — a best plan is really there.** If at least one plan obeys the rules, and $\mathbb{U}$ is **[[compact|compact]]** — which it is, because actuators are bounded — then a continuous cost reaches its minimum. If $\mathbb{U}$ were unbounded, you would need $\mathbf{R} \succ 0$ to make the cost grow without end in every direction, which you have anyway.

**Uniqueness — only one best plan.** Eliminate the states, as the next lesson does. The cost becomes a quadratic in the stacked inputs with Hessian (the matrix that sets the shape of the cost bowl) $2(\mathbf{S}_u^\top\bar{\mathbf{Q}}\mathbf{S}_u + \bar{\mathbf{R}})$. With $\mathbf{R} \succ 0$, the $\bar{\mathbf{R}}$ term alone makes it positive definite. So the best plan is unique, and the feedback law $\boldsymbol{\kappa}_N$ is a true function: one state, one command. That matters more than it sounds. A controller that could return either of two commands for the same state is not something you can certify.

One property does *not* come free: a solution at every state. $\mathcal{X}_N$ is usually smaller than $\mathbb{X}$. If the terminal set is small and $N$ is short, most states cannot reach it in time. And with hard state limits, a disturbance can push the vehicle out of $\mathcal{X}_N$. That is the feasibility problem, and it gets two lessons of its own.

## Check yourself

::: check
In the problem statement, the state limit is imposed for $k = 1,\dots,N-1$, and $k = 0$ is left out. Why?
:::

::: answer
Because $\mathbf{x}_0 = \mathbf{x}$ is data, not something the optimizer chooses. Imposing $\mathbf{x} \in \mathbb{X}$ as a rule would make the problem unsolvable whenever the vehicle is already outside the state limit — after a disturbance, a sensor glitch or a mode change. That is exactly when you most need a command. Leaving $k = 0$ out means the optimizer accepts where it is and plans to get back inside. The end, $k = N$, is covered separately by the terminal set $\mathbb{X}_f \subseteq \mathbb{X}$.

On a real vehicle this is not hypothetical. The state limit is often violated at the moment MPC takes over from another mode. A formulation that limits $\mathbf{x}_0$ hands the mode logic an unsolvable problem on its very first cycle.
:::

::: check
Your formulation has $\mathbf{Q} = \mathrm{diag}(1, 1)$ for a state in meters and meters per second, and $R = 0.1$ for an input in $\mathrm{m/s^2}$. A colleague changes the position unit to millimeters without changing $\mathbf{Q}$. What happens to the closed loop?
:::

::: answer
The position number is now $1000$ times larger, so $x_1^2$ in the stage cost is $10^6$ times larger. Position error now dominates the cost completely. The controller becomes extremely aggressive on position and ignores velocity and effort. It sits on the thrust limit for far longer and, if there were a velocity limit, it would ride it.

Weights are not pure numbers. Each carries units that make $\ell$ a consistent quantity. To keep the same controller, $\mathbf{Q}$ would have to become $\mathrm{diag}(10^{-6}, 1)$. This is why you scale states and inputs to order one before choosing weights. Bryson's rule is a unit-fixing device before it is a tuning trick.
:::

::: check
In the truncation table, the $\mathbf{P} = \mathbf{0}$ value at $N = 5$ is $19.79$, while the true best cost is $63.50$. Is the optimizer wrong?
:::

::: answer
No. It is solving the problem it was given, correctly. The $N = 5$ problem charges for half a second of motion and then stops counting. Its best plan brakes hard once and then barely bothers: it arrives at $t = 0.5\,\mathrm{s}$ with $1.94\,\mathrm{m}$ of position error and $0.15\,\mathrm{m/s}$ of closing speed, and pays nothing for that state. (Its last command is exactly zero — a thrust at the final step only affects $\mathbf{x}_5$, which costs nothing.) The value $19.79$ is the exact best cost of that cut-off problem.

The error is in the formulation, not the solver. That is the general lesson: MPC failures are almost never solver failures. They are specification failures, and you find them by comparing the value function against a long-horizon reference, exactly as the table does. Adding the Riccati terminal cost raises the $N = 5$ value to $62.18$, within $2\,\%$ of the truth, without making the problem any bigger.
:::

::: check
Write the steady-target equations for a vehicle with more tracked outputs than inputs. What goes wrong, and what is done instead?
:::

::: answer
The matrix $\begin{bmatrix} \mathbf{A} - \mathbf{I} & \mathbf{B} \\ \mathbf{C} & \mathbf{0}\end{bmatrix}$ now has more rows than columns. There are more equations than unknowns, and usually no exact solution: you cannot hold more independent outputs at arbitrary values than you have independent inputs.

The standard fix is a least-squares target. Minimize $\|\mathbf{C}\mathbf{x}_{ss} - \mathbf{r}\|^2_{\mathbf{T}}$ over resting points of the disturbed model, with a weight $\mathbf{T}$ that says which outputs matter most, and usually with the input limits imposed so the target is reachable. That small target QP runs once per cycle, before the MPC solve. It is where the designer states which goal gets sacrificed when the vehicle cannot do everything. An unreachable target is a common cause of an MPC that *looks* unstable: it is chasing a setpoint no resting point can meet.
:::

::: check
Why does the module insist on $\mathbf{R} \succ 0$ rather than $\mathbf{R} \succeq 0$, when a zero input weight would seem to give the most aggressive controller?
:::

::: answer
With $\mathbf{R} = \mathbf{0}$, the cost is flat along any input direction that does not change the predicted states. For a plant with more inputs than states, or with redundant actuators, such directions exist. Then the best plan is not unique. The solver may return any point on a flat floor, the command can jump between equally good values from cycle to cycle, and the condensed Hessian is singular, so the solve is badly conditioned. The controller also becomes bang-bang against the limits, since nothing prices effort.

A small $\mathbf{R}$ is often right — it is the cheap-control limit of the LQR module. But make it small and positive, chosen so the effort term is a known fraction of the total cost. In a flight formulation, $\mathbf{R} \succ 0$ is also what guarantees one repeatable command for a given state, which is a testing requirement.
:::

## Summary

| Object | Statement |
| --- | --- |
| Problem $P_N(\mathbf{x})$ | $\min \sum_{k=0}^{N-1}\ell(\mathbf{x}_k,\mathbf{u}_k) + V_f(\mathbf{x}_N)$ s.t. dynamics, $\mathbf{x}_0 = \mathbf{x}$, $\mathbf{u}_k \in \mathbb{U}$, $\mathbf{x}_k \in \mathbb{X}$, $\mathbf{x}_N \in \mathbb{X}_f$ |
| Stage cost | $\ell(\mathbf{x},\mathbf{u}) = \mathbf{x}^\top\mathbf{Q}\mathbf{x} + \mathbf{u}^\top\mathbf{R}\mathbf{u}$, $\mathbf{Q} \succeq 0$, $\mathbf{R} \succ 0$ |
| Terminal cost | $V_f(\mathbf{x}) = \mathbf{x}^\top\mathbf{P}\mathbf{x}$, the price of everything beyond the horizon |
| Value function | $V_N^0(\mathbf{x})$, the best cost; the future Lyapunov function |
| Feasible set | $\mathcal{X}_N$, the states from which $P_N$ has a solution |
| Truncation | $\mathbf{P} = \mathbf{0}$, $N = 5$: $V^0 = 19.79$ against a true $63.4959$; Riccati $\mathbf{P}$ at $N = 10$: exact |
| Why exact | The best path saturates for ten samples, then the LQR tail is allowed and optimal from $(1.500, -1.000)$ |
| Weight scaling | Bryson: $Q_{ii} = 1/x_{i,\max}^2$, $R_{jj} = 1/u_{j,\max}^2$; weights carry units |
| Rate penalty | $\Delta\mathbf{u}_k = \mathbf{u}_k - \mathbf{u}_{k-1}$ with weight $\mathbf{S}$; as the unknown it gives integral action |
| Target calculation | $\begin{bmatrix} \mathbf{A} - \mathbf{I} & \mathbf{B} \\ \mathbf{C} & \mathbf{0}\end{bmatrix}\begin{bmatrix}\mathbf{x}_{ss}\\ \mathbf{u}_{ss}\end{bmatrix} = \begin{bmatrix}-\mathbf{B}\hat{\mathbf{d}} \\ \mathbf{r}\end{bmatrix}$, then solve in $\delta\mathbf{x}, \delta\mathbf{u}$ |
| Offset-free result | $u_{ss} = -\hat{d} = -0.05\,\mathrm{m/s^2}$, $\mathbf{x}_{ss} = (r, 0)$; the loop settles on target to eight decimals |
| Well posed | Convex QP; minimum exists because $\mathbb{U}$ is compact; unique because $\mathbf{R} \succ 0$ |

The next lesson turns this statement into matrices — the two standard ways of writing it as a quadratic program — and shows why the choice between them decides how the solve time grows with $N$.

::: context bowl One lowest point, or a flat floor
Picture the cost as a surface over the space of plans. With $\mathbf{R}$ positive definite, every direction curves upward, like a bowl, and there is exactly one lowest point. With $\mathbf{R} = \mathbf{0}$ and a spare actuator, some directions change the command without changing where the vehicle goes, so they cost nothing: the bottom is a flat floor, and every point on it is equally "best".

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <polyline points="23.0,25.0 26.6,34.8 30.2,44.0 33.8,52.8 37.4,61.0 41.0,68.8 44.6,76.0 48.2,82.8 51.8,89.0 55.4,94.8 59.0,100.0 62.6,104.8 66.2,109.0 69.8,112.8 73.4,116.0 77.0,118.8 80.6,121.0 84.2,122.8 87.8,124.0 91.4,124.8 95.0,125.0 98.6,124.8 102.2,124.0 105.8,122.8 109.4,121.0 113.0,118.8 116.6,116.0 120.2,112.8 123.8,109.0 127.4,104.8 131.0,100.0 134.6,94.8 138.2,89.0 141.8,82.8 145.4,76.0 149.0,68.8 152.6,61.0 156.2,52.8 159.8,44.0 163.4,34.8 167.0,25.0" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="95" cy="125" r="4.5" fill="#b4232c"/>
  <polyline points="193.0,55.0 196.6,68.3 200.2,80.2 203.8,90.7 207.4,99.8 211.0,107.5 214.6,113.8 218.2,118.7 221.8,122.2 225.4,124.3 229.0,125.0 232.6,125.0 236.2,125.0 239.8,125.0 243.4,125.0 247.0,125.0 250.6,125.0 254.2,125.0 257.8,125.0 261.4,125.0 265.0,125.0 268.6,125.0 272.2,125.0 275.8,125.0 279.4,125.0 283.0,125.0 286.6,125.0 290.2,125.0 293.8,125.0 297.4,125.0 301.0,125.0 304.6,124.3 308.2,122.2 311.8,118.7 315.4,113.8 319.0,107.5 322.6,99.8 326.2,90.7 329.8,80.2 333.4,68.3 337.0,55.0" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="229" y1="125" x2="301" y2="125" stroke="#b4232c" stroke-width="4"/>
  <text x="95" y="150" font-size="12" fill="#1f2a44" text-anchor="middle">R positive definite</text>
  <text x="95" y="18" font-size="11" fill="#6c7a93" text-anchor="middle">one lowest point</text>
  <text x="265" y="150" font-size="12" fill="#1f2a44" text-anchor="middle">R = 0, spare actuator</text>
  <text x="265" y="18" font-size="11" fill="#6c7a93" text-anchor="middle">a flat floor: many answers</text>
</svg>
```
:::

::: context detectable Nothing unstable can hide
A pair $(\mathbf{A}, \mathbf{Q}^{1/2})$ is **detectable** if every motion that does not die out on its own shows up in the cost. Suppose some unstable drift made no contribution to $\mathbf{x}^\top\mathbf{Q}\mathbf{x}$. Then the optimizer would see no reason to stop it, and it would grow while the cost stayed calm. Detectability rules that out. The LQR module used the same condition to guarantee a stabilizing Riccati solution.
:::

::: context polyhedron A shape made of flat walls
A **polyhedron** is the region that satisfies a list of linear inequalities, $\mathbf{G}\mathbf{x} \le \mathbf{h}$. Each row is one flat wall with a "keep this side" arrow; the region is what every wall allows at once. A box $|u| \le 1$ is two walls per input. A speed limit $|x_2| \le 0.5$ is two more. Polyhedra are always convex — no dents — which is why they keep the MPC problem a convex QP. A round limit, like a thrust-magnitude bound, is not a polyhedron, and it turns the QP into a second-order cone program.
:::

::: context lyapunov A cost that must keep falling
A **Lyapunov function** is an energy-like number that is zero at the target, positive everywhere else, and goes down every step along the closed loop. If you can find one, the loop is stable: the number cannot fall forever without reaching zero. Lesson 5 shows that, with the right terminal cost and set, the MPC value $V_N^0$ is such a function — the best remaining cost drops by at least the stage cost every cycle.
:::

::: context cost-curves The two columns, drawn
Plot the best cost against the horizon, for every $N$ from $1$ to $40$. With no terminal cost (red), the answer creeps up slowly and is still short of the truth at $N = 40$. With the Riccati terminal cost (blue), it starts close — $55.87$ at $N = 1$ — and reaches the true $63.50$ by $N = 10$. The blue curve is what a terminal cost buys: the lookahead of a long horizon at the price of a short one.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 215" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="180" x2="345" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="180" x2="50" y2="18" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50.0" y1="180" x2="50.0" y2="185" stroke="#1f2a44"/>
  <text x="50.0" y="198" font-size="11" fill="#1f2a44" text-anchor="middle">0</text>
  <line x1="122.5" y1="180" x2="122.5" y2="185" stroke="#1f2a44"/>
  <text x="122.5" y="198" font-size="11" fill="#1f2a44" text-anchor="middle">10</text>
  <line x1="195.0" y1="180" x2="195.0" y2="185" stroke="#1f2a44"/>
  <text x="195.0" y="198" font-size="11" fill="#1f2a44" text-anchor="middle">20</text>
  <line x1="267.5" y1="180" x2="267.5" y2="185" stroke="#1f2a44"/>
  <text x="267.5" y="198" font-size="11" fill="#1f2a44" text-anchor="middle">30</text>
  <line x1="340.0" y1="180" x2="340.0" y2="185" stroke="#1f2a44"/>
  <text x="340.0" y="198" font-size="11" fill="#1f2a44" text-anchor="middle">40</text>
  <line x1="45" y1="180.0" x2="50" y2="180.0" stroke="#1f2a44"/>
  <text x="41" y="184.0" font-size="11" fill="#1f2a44" text-anchor="end">0</text>
  <line x1="45" y1="134.0" x2="50" y2="134.0" stroke="#1f2a44"/>
  <text x="41" y="138.0" font-size="11" fill="#1f2a44" text-anchor="end">20</text>
  <line x1="45" y1="88.0" x2="50" y2="88.0" stroke="#1f2a44"/>
  <text x="41" y="92.0" font-size="11" fill="#1f2a44" text-anchor="end">40</text>
  <line x1="45" y1="42.0" x2="50" y2="42.0" stroke="#1f2a44"/>
  <text x="41" y="46.0" font-size="11" fill="#1f2a44" text-anchor="end">60</text>
  <line x1="50" y1="34.0" x2="345" y2="34.0" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <text x="342" y="29.0" font-size="11" fill="#6c7a93" text-anchor="end">true cost 63.50</text>
  <polyline points="57.2,170.8 64.5,161.6 71.8,152.4 79.0,143.4 86.2,134.5 93.5,125.8 108.0,109.5 122.5,94.7 137.0,81.7 158.8,65.7 195.0,48.2 231.2,39.6 267.5,36.0 303.8,34.7 340.0,34.2" fill="none" stroke="#b4232c" stroke-width="2"/>
  <circle cx="57.2" cy="170.8" r="2.5" fill="#b4232c"/>
  <circle cx="64.5" cy="161.6" r="2.5" fill="#b4232c"/>
  <circle cx="71.8" cy="152.4" r="2.5" fill="#b4232c"/>
  <circle cx="79.0" cy="143.4" r="2.5" fill="#b4232c"/>
  <circle cx="86.2" cy="134.5" r="2.5" fill="#b4232c"/>
  <circle cx="93.5" cy="125.8" r="2.5" fill="#b4232c"/>
  <circle cx="108.0" cy="109.5" r="2.5" fill="#b4232c"/>
  <circle cx="122.5" cy="94.7" r="2.5" fill="#b4232c"/>
  <circle cx="137.0" cy="81.7" r="2.5" fill="#b4232c"/>
  <circle cx="158.8" cy="65.7" r="2.5" fill="#b4232c"/>
  <circle cx="195.0" cy="48.2" r="2.5" fill="#b4232c"/>
  <circle cx="231.2" cy="39.6" r="2.5" fill="#b4232c"/>
  <circle cx="267.5" cy="36.0" r="2.5" fill="#b4232c"/>
  <circle cx="303.8" cy="34.7" r="2.5" fill="#b4232c"/>
  <circle cx="340.0" cy="34.2" r="2.5" fill="#b4232c"/>
  <polyline points="57.2,51.5 64.5,46.5 71.8,42.4 79.0,39.3 86.2,37.0 93.5,35.4 108.0,34.1 122.5,34.0 137.0,34.0 158.8,34.0 195.0,34.0 231.2,34.0 267.5,34.0 303.8,34.0 340.0,34.0" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="57.2" cy="51.5" r="2.5" fill="#1d6fd1"/>
  <circle cx="64.5" cy="46.5" r="2.5" fill="#1d6fd1"/>
  <circle cx="71.8" cy="42.4" r="2.5" fill="#1d6fd1"/>
  <circle cx="79.0" cy="39.3" r="2.5" fill="#1d6fd1"/>
  <circle cx="86.2" cy="37.0" r="2.5" fill="#1d6fd1"/>
  <circle cx="93.5" cy="35.4" r="2.5" fill="#1d6fd1"/>
  <circle cx="108.0" cy="34.1" r="2.5" fill="#1d6fd1"/>
  <circle cx="122.5" cy="34.0" r="2.5" fill="#1d6fd1"/>
  <circle cx="137.0" cy="34.0" r="2.5" fill="#1d6fd1"/>
  <circle cx="158.8" cy="34.0" r="2.5" fill="#1d6fd1"/>
  <circle cx="195.0" cy="34.0" r="2.5" fill="#1d6fd1"/>
  <circle cx="231.2" cy="34.0" r="2.5" fill="#1d6fd1"/>
  <circle cx="267.5" cy="34.0" r="2.5" fill="#1d6fd1"/>
  <circle cx="303.8" cy="34.0" r="2.5" fill="#1d6fd1"/>
  <circle cx="340.0" cy="34.0" r="2.5" fill="#1d6fd1"/>
  <text x="151.5" y="111.0" font-size="12" fill="#b4232c">no terminal cost</text>
  <text x="71.75" y="76.5" font-size="12" fill="#1d6fd1">Riccati P</text>
  <text x="197" y="212" font-size="11" fill="#1f2a44" text-anchor="middle">horizon N (samples)</text>
  <text x="14" y="100" font-size="11" fill="#1f2a44" text-anchor="middle" transform="rotate(-90 14 100)">optimal cost</text>
</svg>
```
:::

::: context bryson Where Bryson's rule comes from
The rule is named after Arthur E. Bryson Jr. of Stanford, and it appears in his textbook with Yu-Chi Ho, *Applied Optimal Control* (1969). The idea: if $x_i$ is allowed to reach $x_{i,\max}$, weighting it by $1/x_{i,\max}^2$ makes that maximum cost exactly one unit. Every term then speaks the same language, "fraction of what I can tolerate, squared", before you start trading them off. It is a starting point, not an answer.
:::

::: context preview Knowing what is coming
Many flight problems come with a known future. A launch vehicle can load a wind profile measured by a weather balloon hours before liftoff. A docking target's motion follows orbital mechanics. A planned staging event happens at a known time. A gain reacts only after the error appears. An MPC with the reference or disturbance written into its horizon starts turning before the gust arrives — the way a driver brakes because the light ahead turned yellow, not because the car is already in the intersection.
:::

::: context bias-bridge The same trick in navigation
An accelerometer usually reads a small constant error, its **bias**. Navigation filters handle it by adding the bias to the state as an extra unknown that does not change, and letting the filter estimate it from the mismatch between prediction and measurement. The disturbance state $\mathbf{d}$ here works the same way. In both cases a constant unknown becomes something the filter can learn, so the rest of the system can cancel it.
:::

::: context two-arcs The command, sample by sample
This is the actual command from the $r = -5\,\mathrm{m}$ setpoint change, one step per $0.1\,\mathrm{s}$ sample. Push flat out at $-1$ for $2.1\,\mathrm{s}$; swing through zero in three samples; brake flat out at $+1$ until $3.3\,\mathrm{s}$; then ease off smoothly toward the $-0.05$ that cancels the push. Hitting the limits hard in the middle of a maneuver is what a quadratic cost does when the limit is the only thing holding it back.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="45" y1="95" x2="350" y2="95" stroke="#6c7a93" stroke-width="1"/>
  <line x1="45" y1="35" x2="350" y2="35" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <line x1="45" y1="155" x2="350" y2="155" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <line x1="45" y1="20" x2="45" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="40" y="39" font-size="11" fill="#1f2a44" text-anchor="end">+1</text>
  <text x="40" y="99" font-size="11" fill="#1f2a44" text-anchor="end">0</text>
  <text x="40" y="159" font-size="11" fill="#1f2a44" text-anchor="end">−1</text>
  <polyline points="45.0,155.0 50.0,155.0 50.0,155.0 55.0,155.0 55.0,155.0 60.0,155.0 60.0,155.0 65.0,155.0 65.0,155.0 70.0,155.0 70.0,155.0 75.0,155.0 75.0,155.0 80.0,155.0 80.0,155.0 85.0,155.0 85.0,155.0 90.0,155.0 90.0,155.0 95.0,155.0 95.0,155.0 100.0,155.0 100.0,155.0 105.0,155.0 105.0,155.0 110.0,155.0 110.0,155.0 115.0,155.0 115.0,155.0 120.0,155.0 120.0,155.0 125.0,155.0 125.0,155.0 130.0,155.0 130.0,155.0 135.0,155.0 135.0,155.0 140.0,155.0 140.0,155.0 145.0,155.0 145.0,155.0 150.0,155.0 150.0,131.7 155.0,131.7 155.0,86.2 160.0,86.2 160.0,55.2 165.0,55.2 165.0,35.0 170.0,35.0 170.0,35.0 175.0,35.0 175.0,35.0 180.0,35.0 180.0,35.0 185.0,35.0 185.0,35.0 190.0,35.0 190.0,35.0 195.0,35.0 195.0,35.0 200.0,35.0 200.0,35.0 205.0,35.0 205.0,35.0 210.0,35.0 210.0,37.2 215.0,37.2 215.0,43.2 220.0,43.2 220.0,48.6 225.0,48.6 225.0,53.5 230.0,53.5 230.0,57.9 235.0,57.9 235.0,61.9 240.0,61.9 240.0,65.5 245.0,65.5 245.0,68.7 250.0,68.7 250.0,71.7 255.0,71.7 255.0,74.3 260.0,74.3 260.0,76.7 265.0,76.7 265.0,78.9 270.0,78.9 270.0,80.8 275.0,80.8 275.0,82.5 280.0,82.5 280.0,84.1 285.0,84.1 285.0,85.5 290.0,85.5 290.0,86.7 295.0,86.7 295.0,87.9 300.0,87.9 300.0,88.9 305.0,88.9 305.0,89.8 310.0,89.8 310.0,90.6 315.0,90.6 315.0,91.3 320.0,91.3 320.0,92.1 325.0,92.1 325.0,92.7 330.0,92.7 330.0,93.2 335.0,93.2 335.0,93.7 340.0,93.7 340.0,94.1 345.0,94.1" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <text x="45" y="177" font-size="11" fill="#1f2a44" text-anchor="middle">0</text>
  <text x="95" y="177" font-size="11" fill="#1f2a44" text-anchor="middle">1</text>
  <text x="145" y="177" font-size="11" fill="#1f2a44" text-anchor="middle">2</text>
  <text x="195" y="177" font-size="11" fill="#1f2a44" text-anchor="middle">3</text>
  <text x="245" y="177" font-size="11" fill="#1f2a44" text-anchor="middle">4</text>
  <text x="295" y="177" font-size="11" fill="#1f2a44" text-anchor="middle">5</text>
  <text x="345" y="177" font-size="11" fill="#1f2a44" text-anchor="middle">6</text>
  <text x="200" y="194" font-size="11" fill="#1f2a44" text-anchor="middle">time (s); command u in m/s²</text>
  <text x="97.5" y="147" font-size="11" fill="#b4232c" text-anchor="middle">full push</text>
  <text x="187.5" y="27" font-size="11" fill="#b4232c" text-anchor="middle">full brake</text>
  <text x="295.0" y="51.800000000000004" font-size="11" fill="#1f2a44" text-anchor="middle">smooth tail</text>
</svg>
```
:::

::: context compact Closed and bounded
In math, a set is **compact** (in ordinary $n$-dimensional space) when it is **bounded** — it fits in some big box — and **closed** — it includes its own edge. A thrust range $-1 \le u \le 1$ is compact. The open range $-1 < u < 1$ is not, because you can get ever closer to $1$ without reaching it. The extreme value theorem says a continuous function on a compact set always has a lowest point, which is why existence comes for free here.
:::
