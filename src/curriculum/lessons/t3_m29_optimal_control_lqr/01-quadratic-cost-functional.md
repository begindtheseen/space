---
id: l01-quadratic-cost-functional
title: The linear quadratic cost functional
minutes: 18
covers:
  - The linear quadratic cost functional and what Q, R and the cross term weight
---

Pole placement asks you to name the closed-loop poles. On a single axis with two states that is a reasonable request: you pick a bandwidth and a damping ratio and you are done. On a six-state launch vehicle with three gimbal commands it stops being reasonable. There are more gains than there are numbers you have any intuition about, the choice of eigenvectors is left dangling, and nothing in the procedure tells you whether the answer you picked is affordable in actuator authority.

Linear quadratic regulation replaces "name the poles" with "name what you care about, and how much". You write down a quadratic penalty on state error and a quadratic penalty on control effort, add them up over time, and let the mathematics return the feedback gain that minimises the total. The poles come out the other end. They are a consequence of the trade you declared, not an input, and because the trade is stated in engineering units — degrees of pointing error, newton-metres of wheel torque — it is something you can defend in a design review and re-negotiate when a requirement moves.

This lesson does none of the optimising. It builds the object being optimised: the cost functional, the matrices $\mathbf{Q}$, $\mathbf{R}$ and the cross term $\mathbf{N}$, what each one weights, what each must satisfy for the problem to be well posed, and what a number like "the cost of this trajectory is 57" means with units attached. Everything after this lesson is machinery for minimising it.

## The regulator problem

Take the linear time-invariant plant from the state-space module,

$$
\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u}, \qquad \mathbf{x} \in \mathbb{R}^n, \quad \mathbf{u} \in \mathbb{R}^m,
$$

with $\mathbf{x}$ the deviation from the operating point you want to hold and $\mathbf{u}$ the deviation of the actuator command from its trim value. A **regulator** drives $\mathbf{x}$ to zero and keeps it there. The linear quadratic regulator is the one that does so at least cost, where the cost is

$$
J = \int_0^{\infty}\Big(\mathbf{x}^\top\mathbf{Q}\mathbf{x} + \mathbf{u}^\top\mathbf{R}\mathbf{u}\Big)\,dt .
$$

$\mathbf{Q}$ is $n\times n$ symmetric positive semidefinite, written $\mathbf{Q} \succeq 0$; $\mathbf{R}$ is $m\times m$ symmetric positive definite, $\mathbf{R} \succ 0$. Over a finite horizon $[0, t_f]$ the same integral is truncated and a terminal penalty is added,

$$
J = \mathbf{x}(t_f)^\top\mathbf{Q}_f\,\mathbf{x}(t_f) + \int_0^{t_f}\Big(\mathbf{x}^\top\mathbf{Q}\mathbf{x} + \mathbf{u}^\top\mathbf{R}\mathbf{u}\Big)\,dt, \qquad \mathbf{Q}_f \succeq 0 .
$$

::: key The LQR cost functional
$J = \int_0^\infty (\mathbf{x}^\top\mathbf{Q}\mathbf{x} + \mathbf{u}^\top\mathbf{R}\mathbf{u})\,dt$, with $\mathbf{Q}$ positive semidefinite and $\mathbf{R}$ positive definite. The finite horizon adds a terminal term $\mathbf{x}(t_f)^\top\mathbf{Q}_f\mathbf{x}(t_f)$ and truncates the integral at $t_f$.
:::

The sign conditions are not decoration. $\mathbf{R} \succ 0$ means every control direction costs something strictly positive; if some direction of $\mathbf{u}$ were free, the optimiser would use an unbounded amount of it and the minimum would not exist. This is the **singular** case, and it is a genuinely different problem. $\mathbf{Q} \succeq 0$ only needs semidefiniteness, because it is legitimate to care about some states and not others — a wheel-speed state that you do not want driven to zero can carry a zero weight. What you may not do is leave a state both unweighted and unstable: if an unstable mode is invisible to $\mathbf{Q}$, the optimiser sees no reason to control it and happily lets it diverge at zero cost. The precise condition is that $(\mathbf{A}, \mathbf{Q}^{1/2})$ be **detectable**, the same detectability you met alongside observability, applied to the fictitious output $\mathbf{Q}^{1/2}\mathbf{x}$. Together with **stabilizability** of $(\mathbf{A}, \mathbf{B})$, it is exactly what makes the infinite-horizon problem have a unique stabilizing answer.

Why quadratic and not, say, the integral of $|\mathbf{x}|$? Three reasons, in decreasing order of honesty. A quadratic in a linear system yields a linear feedback law and a closed-form solution, which is the real reason. A quadratic penalises a large excursion far more than a small one, which matches how most requirements are written — a pointing error of twice the budget is much more than twice as bad. And a quadratic is the natural cost when the disturbances are Gaussian, which is what makes the stochastic version of the problem come out the same shape.

## The cost of a trajectory, in seconds

Given a stabilizing feedback $\mathbf{u} = -\mathbf{K}\mathbf{x}$, the cost of starting at $\mathbf{x}_0$ is a number you can compute without simulating. Close the loop, $\dot{\mathbf{x}} = \mathbf{A}_{cl}\mathbf{x}$ with $\mathbf{A}_{cl} = \mathbf{A} - \mathbf{B}\mathbf{K}$, and note that the running cost is the quadratic form $\mathbf{x}^\top\mathbf{W}\mathbf{x}$ with $\mathbf{W} = \mathbf{Q} + \mathbf{K}^\top\mathbf{R}\mathbf{K}$. Let $\mathbf{P}$ solve the Lyapunov equation

$$
\mathbf{A}_{cl}^\top\mathbf{P} + \mathbf{P}\mathbf{A}_{cl} + \mathbf{W} = \mathbf{0}.
$$

Then along any trajectory of the closed loop,

$$
\frac{d}{dt}\big(\mathbf{x}^\top\mathbf{P}\mathbf{x}\big) = \mathbf{x}^\top\big(\mathbf{A}_{cl}^\top\mathbf{P} + \mathbf{P}\mathbf{A}_{cl}\big)\mathbf{x} = -\,\mathbf{x}^\top\mathbf{W}\mathbf{x}.
$$

Integrate from $0$ to $\infty$. Because $\mathbf{A}_{cl}$ is stable, $\mathbf{x}(\infty) = \mathbf{0}$, so the left side telescopes to $-\mathbf{x}_0^\top\mathbf{P}\mathbf{x}_0$ and

$$
J(\mathbf{x}_0) = \int_0^\infty \mathbf{x}^\top\mathbf{W}\mathbf{x}\,dt = \mathbf{x}_0^\top\mathbf{P}\mathbf{x}_0 .
$$

One matrix equation replaces an infinite integral. Keep this identity: the whole module lives inside it, because the optimal $\mathbf{P}$ turns out to satisfy a Riccati equation rather than a Lyapunov equation, and $\mathbf{x}^\top\mathbf{P}\mathbf{x}$ is the optimal cost-to-go.

Units follow the weights. If you scale each state by its budget — $Q_{ii} = 1/x_{i,\max}^2$, $R_{jj} = 1/u_{j,\max}^2$ — then every term of the integrand is dimensionless and equals one when that signal sits exactly at its limit. The cost then has units of **seconds**, and reads as "the number of seconds the vehicle would have to spend pinned at every one of its limits to accumulate this much penalty". That is a number an engineer can argue about.

::: example What the integral adds up for a reaction-wheel axis
One axis of a spacecraft, inertia $J = 120\,\mathrm{kg\,m^2}$, state $\mathbf{x} = (\theta, \omega)$ and control $u$ the wheel torque:

$$
\mathbf{A} = \begin{bmatrix} 0 & 1 \\ 0 & 0\end{bmatrix}, \qquad
\mathbf{B} = \begin{bmatrix} 0 \\ 1/J \end{bmatrix} = \begin{bmatrix} 0 \\ 8.333\times10^{-3}\end{bmatrix}.
$$

Requirements: hold pointing to $0.5^\circ$, rate to $2^\circ/\mathrm{s}$, torque to $8\,\mathrm{N\,m}$. Scaling by those budgets,

$$
\mathbf{Q} = \mathrm{diag}\big(1.3131\times10^{4},\ 8.207\times10^{2}\big)\ \mathrm{rad^{-2}},\qquad
\mathbf{R} = \big[1.5625\times10^{-2}\big]\ \mathrm{(N\,m)^{-2}} .
$$

Start from a $5^\circ$ offset, $\mathbf{x}_0 = (0.08727\,\mathrm{rad},\ 0)$, and compare three feedbacks by solving the Lyapunov equation for each.

| Feedback | $\mathbf{K}$ (N m/rad, N m s/rad) | Closed-loop poles (1/s) | $J$ (s) | state part | control part | peak $|u|$ (N m) | 2 % settling (s) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Hand-placed, $\omega_n = 0.424$, $\zeta = 0.707$ | $(21.6,\ 72.0)$ | $-0.300 \pm 0.300j$ | $251.0$ | $250.9$ | $0.046$ | $1.89$ | $14.05$ |
| LQR optimum | $(916.7,\ 522.1)$ | $-2.175 \pm 1.705j$ | $56.95$ | $45.45$ | $11.49$ | $80.0$ | $1.32$ |
| Twice the LQR gain | $(1833,\ 1044)$ | $-2.441,\ -6.260$ | $62.69$ | $39.71$ | $22.99$ | $160.0$ | $1.80$ |

Three things to read off. The gentle hand-placed design spends almost nothing on control — $0.018\,\%$ of its cost — and pays $251\,\mathrm{s}$ for it, because it sits off-target for fourteen seconds. The optimum splits the bill roughly $80/20$ between state and control and lands at $56.95\,\mathrm{s}$, a factor $4.4$ better. Doubling the optimal gain makes the state part *smaller* ($39.7$ against $45.5$) and the total *larger*, which is what a minimum looks like from the far side: you can always buy more speed, but past the optimum the torque bill outruns the pointing benefit.

The peak torque is worth a second look. At $t = 0$ the rate is zero, so $|u(0)| = k_1\theta_0 = 916.7 \times 0.08727 = 80.0\,\mathrm{N\,m}$, ten times the $8\,\mathrm{N\,m}$ budget — because the initial offset is ten times the $0.5^\circ$ pointing budget. Weights scaled to steady-state budgets say nothing about the transient from a large dispersion, and this is where most first LQR designs saturate.
:::

::: warning Only the ratio of Q to R matters
Replace $(\mathbf{Q}, \mathbf{R})$ by $(\alpha\mathbf{Q}, \alpha\mathbf{R})$ for any $\alpha > 0$. Every candidate trajectory's cost is multiplied by $\alpha$, so the ranking of trajectories is unchanged and the optimal gain is identical — in the example above, scaling both by $17$ returns $\mathbf{K} = (916.7,\ 522.1)$ to every digit. The same happens to the cost matrix: $\mathbf{P}$ scales by $\alpha$ and $\mathbf{K} = \mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}$ is invariant. So "increase $\mathbf{Q}$" and "decrease $\mathbf{R}$" are the same move. Fix one — most people set $\mathbf{R} = \mathbf{I}$ or $\mathbf{R} = \mathrm{diag}(1/u_{j,\max}^2)$ — and do all your tuning in the other, or you will spend an afternoon chasing a degree of freedom that does not exist.
:::

::: key What actually matters in Q and R
Only the ratio. Scaling $\mathbf{Q}$ and $\mathbf{R}$ by the same positive constant leaves $\mathbf{K}$ unchanged, since $\mathbf{P}$ scales identically. Fix $\mathbf{R} = \mathbf{I}$ and tune $\mathbf{Q}$, or the other way round.
:::

## The cross term, and where it comes from

The general quadratic cost carries one more matrix:

$$
J = \int_0^\infty \begin{bmatrix}\mathbf{x} \\ \mathbf{u}\end{bmatrix}^\top
\begin{bmatrix}\mathbf{Q} & \mathbf{N} \\ \mathbf{N}^\top & \mathbf{R}\end{bmatrix}
\begin{bmatrix}\mathbf{x} \\ \mathbf{u}\end{bmatrix} dt
= \int_0^\infty\Big(\mathbf{x}^\top\mathbf{Q}\mathbf{x} + 2\,\mathbf{x}^\top\mathbf{N}\mathbf{u} + \mathbf{u}^\top\mathbf{R}\mathbf{u}\Big)dt .
$$

The $n \times m$ matrix $\mathbf{N}$ weights products of states and inputs. For the cost to be a sensible penalty the whole block matrix must be positive semidefinite, which by the Schur complement is $\mathbf{R} \succ 0$ together with $\mathbf{Q} - \mathbf{N}\mathbf{R}^{-1}\mathbf{N}^\top \succeq 0$.

Nobody writes down a cross term for fun. It appears the moment you penalise a **performance output** rather than the states themselves. Suppose the quantity you actually care about is $\mathbf{z} = \mathbf{C}_z\mathbf{x} + \mathbf{D}_z\mathbf{u}$ — a structural load, a lateral acceleration, a line-of-sight rate — and the cost is $J = \int \mathbf{z}^\top\mathbf{z}\,dt$. Expanding,

$$
\mathbf{z}^\top\mathbf{z} = \mathbf{x}^\top\mathbf{C}_z^\top\mathbf{C}_z\mathbf{x} + 2\,\mathbf{x}^\top\mathbf{C}_z^\top\mathbf{D}_z\mathbf{u} + \mathbf{u}^\top\mathbf{D}_z^\top\mathbf{D}_z\mathbf{u},
$$

so $\mathbf{Q} = \mathbf{C}_z^\top\mathbf{C}_z$, $\mathbf{N} = \mathbf{C}_z^\top\mathbf{D}_z$ and $\mathbf{R} = \mathbf{D}_z^\top\mathbf{D}_z$. A direct feedthrough $\mathbf{D}_z \neq \mathbf{0}$ — the actuator affecting the thing you care about instantaneously — is precisely a cross term.

The cross term is removable. Complete the square in $\mathbf{u}$: write $\mathbf{u} = \mathbf{v} - \mathbf{R}^{-1}\mathbf{N}^\top\mathbf{x}$, so that

$$
\mathbf{x}^\top\mathbf{Q}\mathbf{x} + 2\mathbf{x}^\top\mathbf{N}\mathbf{u} + \mathbf{u}^\top\mathbf{R}\mathbf{u}
= \mathbf{x}^\top\big(\mathbf{Q} - \mathbf{N}\mathbf{R}^{-1}\mathbf{N}^\top\big)\mathbf{x} + \mathbf{v}^\top\mathbf{R}\mathbf{v},
$$

which you can verify by expanding the right-hand side. Substituting $\mathbf{u}$ into the dynamics gives $\dot{\mathbf{x}} = \bar{\mathbf{A}}\mathbf{x} + \mathbf{B}\mathbf{v}$ with

$$
\bar{\mathbf{A}} = \mathbf{A} - \mathbf{B}\mathbf{R}^{-1}\mathbf{N}^\top, \qquad \bar{\mathbf{Q}} = \mathbf{Q} - \mathbf{N}\mathbf{R}^{-1}\mathbf{N}^\top .
$$

So a cross-term problem is a cross-term-free problem on a shifted plant. Solve that one for $\bar{\mathbf{K}}$, then the gain for the original problem is

$$
\mathbf{K} = \bar{\mathbf{K}} + \mathbf{R}^{-1}\mathbf{N}^\top .
$$

Every LQR solver accepts an $\mathbf{N}$ argument and performs exactly this substitution internally. It is worth knowing it is happening, because $\bar{\mathbf{Q}}$ can be far weaker than $\mathbf{Q}$, and in one important case it vanishes entirely.

::: example Load relief on a launch vehicle at maximum dynamic pressure
Pitch plane, state $\mathbf{x} = (\alpha, q)$ with $\alpha$ the angle of attack and $q$ the pitch rate, control $\delta$ the engine gimbal angle. For a $3.2\times10^{5}\,\mathrm{kg}$ vehicle at $V = 450\,\mathrm{m/s}$ and $\bar q = 33\,\mathrm{kPa}$, with $S = 10.5\,\mathrm{m^2}$, $C_{N\alpha} = 2.6\,\mathrm{rad^{-1}}$ and pitch inertia $2.6\times10^{7}\,\mathrm{kg\,m^2}$, the normal-force slope is $N_\alpha = \bar q S C_{N\alpha} = 9.01\times10^{5}\,\mathrm{N/rad}$ and

$$
\mathbf{A} = \begin{bmatrix}-0.00626 & 1 \\ 0.4851 & 0\end{bmatrix}\mathrm{s^{-1},\ s^{-2}},\qquad
\mathbf{B} = \begin{bmatrix}0 \\ -6.723\end{bmatrix}\mathrm{s^{-2}} .
$$

The open-loop poles are $-0.700$ and $+0.693\,\mathrm{s^{-1}}$: aerodynamically unstable, as every launcher with its centre of pressure ahead of its centre of mass is.

What the structures group cares about is the bending moment at the interstage. Both loads feed it: the aerodynamic normal force acting $11\,\mathrm{m}$ from the station, and the gimballed thrust ($7.6\times10^{6}\,\mathrm{N}$) acting $12\,\mathrm{m}$ from it, in the opposite sense. Normalising by a $M_{\lim} = 1.0\times10^{7}\,\mathrm{N\,m}$ capability,

$$
z = \frac{M_b}{M_{\lim}} = 0.9910\,\alpha - 9.120\,\delta, \qquad \mathbf{C}_z = [\,0.9910\quad 0\,],\quad D_z = -9.120 .
$$

A gimbal deflection is roughly nine times as loading as an equal angle of attack, so the controller cannot ignore its own contribution. Taking $J = \int (z^2 + \rho\,\delta^2)dt$ with $\rho = 1/\delta_{\max}^2 = 131.3\,\mathrm{rad^{-2}}$ for a $5^\circ$ gimbal limit:

$$
\mathbf{Q} = \begin{bmatrix}0.9821 & 0\\ 0 & 0\end{bmatrix},\quad
\mathbf{N} = \begin{bmatrix}-9.038\\ 0\end{bmatrix},\quad
R = 83.17 + 131.3 = 214.5 .
$$

Completing the square gives $\bar{\mathbf{Q}} = \mathrm{diag}(0.6012,\ 0)$ and $\bar{\mathbf{A}} = \mathbf{A} - \mathbf{B}R^{-1}\mathbf{N}^\top$, whose $(2,1)$ entry is $0.2018$ rather than $0.4851$: absorbing the cross term has already removed more than half the vehicle's aerodynamic instability, because part of the optimal gimbal command is the static term $R^{-1}\mathbf{N}^\top = (-0.04214,\ 0)$ that opposes $\alpha$ directly. Solving the shifted problem and adding it back,

$$
\mathbf{K} = (-0.1320,\ -0.1635), \qquad \text{closed-loop poles } -0.5527 \pm 0.3220j\ \mathrm{s^{-1}} .
$$

Now fly a $4^\circ$ angle-of-attack dispersion — a wind shear — and compare against the design that ignores $\mathbf{N}$ and weights only $\mathbf{Q}$ and $R$:

| Design | $\mathbf{K}$ | peak $|\delta|$ | peak $|M_b|$ | true cost |
| --- | --- | --- | --- | --- |
| Cross term included | $(-0.1320,\ -0.1635)$ | $0.528^\circ$ | $1.69\times10^{5}\,\mathrm{N\,m}$ | $0.010315$ |
| Cross term dropped | $(-0.1697,\ -0.2247)$ | $0.679^\circ$ | $3.88\times10^{5}\,\mathrm{N\,m}$ | $0.010950$ |

Dropping the cross term costs $6.2\,\%$ in the cost it was supposed to minimise and, more tellingly, **2.3 times the peak bending moment** — while using more gimbal, not less. The cross-term design knows that its own deflection loads the airframe, so it accepts a slower attitude response in exchange for letting the two moments cancel. That trade has a name in launch vehicle work: load relief.
:::

::: warning A single scalar output with feedthrough gives a singular problem
Take the load-relief example with no control penalty, $\rho = 0$. Then $\mathbf{Q} = \mathbf{C}_z^\top\mathbf{C}_z$, $\mathbf{N} = \mathbf{C}_z^\top D_z$, $R = D_z^2$, and

$$
\bar{\mathbf{Q}} = \mathbf{C}_z^\top\mathbf{C}_z - \mathbf{C}_z^\top D_z (D_z^2)^{-1} D_z \mathbf{C}_z = \mathbf{0}
$$

exactly — not small, zero, for any $\mathbf{C}_z$ and any nonzero scalar $D_z$. The shifted problem has no state cost at all, its optimal gain is $\bar{\mathbf{K}} = \mathbf{0}$, and the "optimal" law $\delta = -R^{-1}\mathbf{N}^\top\mathbf{x}$ is the one that zeroes $z$ instantaneously and then does nothing, leaving the vehicle's unstable mode uncontrolled. The cost is zero and the vehicle is lost. Penalising one scalar output that the input feeds directly is a degenerate problem; add a genuine control penalty $\rho$, or penalise more than one output, and it becomes well posed. Here $\rho = 131.3$ pulled $\bar{\mathbf{Q}}$ back up to $0.601$.
:::

## Check yourself

::: check
A colleague sets $\mathbf{Q} = \mathbf{I}$ and $\mathbf{R} = \mathbf{I}$ on a plant whose states are altitude in metres, velocity in metres per second, and pitch angle in radians, with thrust in newtons as the input. What is wrong with this, before anything is solved?
:::

::: answer
The cost adds quantities with incompatible units and wildly different magnitudes. A $100\,\mathrm{m}$ altitude error contributes $10^4$ to the integrand; a $0.1\,\mathrm{rad}$ ($5.7^\circ$) pitch error, which is a far more serious event, contributes $0.01$. Meanwhile a $10^5\,\mathrm{N}$ thrust deviation contributes $10^{10}$ and will dominate everything, producing a controller that refuses to move. The weights encode a trade, and a trade between numbers in different units is meaningless until they are scaled. Non-dimensionalise first: divide each state and each input by the largest value you are willing to see, so every term of the integrand is order one at its limit.
:::

::: check
The identity $J(\mathbf{x}_0) = \mathbf{x}_0^\top\mathbf{P}\mathbf{x}_0$ was derived using $\mathbf{x}(\infty) = \mathbf{0}$. What happens to the argument, and to $J$, if $\mathbf{K}$ does not stabilize the loop?
:::

::: answer
The telescoping step fails: $\mathbf{x}^\top\mathbf{P}\mathbf{x}$ does not tend to zero, so nothing cancels at the upper limit. Physically the integral diverges — an unstable mode makes $\mathbf{x}^\top\mathbf{W}\mathbf{x}$ grow without bound, so $J = \infty$ for any $\mathbf{x}_0$ with a component along that mode (unless the mode is invisible to both $\mathbf{Q}$ and $\mathbf{K}$, which is the detectability loophole). Algebraically the Lyapunov equation still has a solution whenever $\mathbf{A}_{cl}$ has no two eigenvalues summing to zero, but that solution is not positive semidefinite and is not a cost. This is why the infinite-horizon problem automatically produces a stabilizing controller: every non-stabilizing candidate has infinite cost and loses.
:::

::: check
In the reaction-wheel example the LQR peak torque was $80\,\mathrm{N\,m}$ against an $8\,\mathrm{N\,m}$ budget. Give two different ways to fix it, and say what each one costs.
:::

::: answer
First, raise $\mathbf{R}$ (or lower $\mathbf{Q}$). Since $k_1 = \sqrt{Q_{11}/R}$ for this plant, dividing $Q_{11}$ by $100$ — equivalently multiplying $R$ by $100$ — divides $k_1$ by $10$ and brings the initial torque to $8\,\mathrm{N\,m}$. The cost is bandwidth: the closed-loop poles move in by a factor of about $\sqrt{10}$ and the settling time stretches from $1.3\,\mathrm{s}$ to roughly $4\,\mathrm{s}$. Second, leave the gain alone and stop presenting the controller with a $5^\circ$ step: feed it a rate-limited reference so that the tracking error never exceeds the $0.5^\circ$ the weights were scaled for. This keeps the tight regulation for the small errors that dominate normal operation and hands the large slew to a separate profile generator. That is what flight software actually does, and it is the reason a saturating LQR is usually a reference-shaping problem rather than a weighting problem.
:::

::: check
For the general cost with a cross term, show that the block matrix being positive semidefinite requires $\mathbf{Q} - \mathbf{N}\mathbf{R}^{-1}\mathbf{N}^\top \succeq 0$, and connect this to the substitution $\mathbf{u} = \mathbf{v} - \mathbf{R}^{-1}\mathbf{N}^\top\mathbf{x}$.
:::

::: answer
Completing the square gave $\mathbf{x}^\top\mathbf{Q}\mathbf{x} + 2\mathbf{x}^\top\mathbf{N}\mathbf{u} + \mathbf{u}^\top\mathbf{R}\mathbf{u} = \mathbf{x}^\top(\mathbf{Q} - \mathbf{N}\mathbf{R}^{-1}\mathbf{N}^\top)\mathbf{x} + \mathbf{v}^\top\mathbf{R}\mathbf{v}$ with $\mathbf{v} = \mathbf{u} + \mathbf{R}^{-1}\mathbf{N}^\top\mathbf{x}$. The map $(\mathbf{x},\mathbf{u}) \mapsto (\mathbf{x},\mathbf{v})$ is invertible, so the quadratic form is nonnegative for all $(\mathbf{x},\mathbf{u})$ exactly when it is nonnegative for all $(\mathbf{x},\mathbf{v})$. Choosing $\mathbf{v} = \mathbf{0}$ leaves $\mathbf{x}^\top(\mathbf{Q} - \mathbf{N}\mathbf{R}^{-1}\mathbf{N}^\top)\mathbf{x} \ge 0$, which is the Schur complement condition; conversely if it holds, both terms are nonnegative. The substitution is the same algebra read as a change of variable rather than a matrix identity, which is why the shifted problem carries $\bar{\mathbf{Q}}$ as its state weight.
:::

::: check
Two candidate designs for the same plant give costs $J_1 = 56.9\,\mathrm{s}$ and $J_2 = 62.7\,\mathrm{s}$ from the same initial condition. Design 2 has a lower state cost. Is design 2 ever the right choice?
:::

::: answer
Often. $J$ ranks designs against the trade *you declared*, and the declaration is a model of the requirements, not the requirements themselves. If the real specification is a hard pointing threshold during a science exposure, with torque authority you have already paid for and will not use otherwise, then the lower state cost is what you are buying and the larger total is bookkeeping. The right response is to change the weights so that the cost says what you mean — raise $\mathbf{Q}$ until the optimum sits where design 2 does — and then check what that costs elsewhere. Reporting "design 2 is $10\,\%$ worse" is only true relative to a $\mathbf{Q}$ and $\mathbf{R}$ that someone chose, and those are the most questionable numbers in the whole calculation.
:::

## Summary

| Symbol / result | Meaning |
| --- | --- |
| $J = \int_0^\infty (\mathbf{x}^\top\mathbf{Q}\mathbf{x} + \mathbf{u}^\top\mathbf{R}\mathbf{u})dt$ | The LQR cost functional; $\mathbf{Q} \succeq 0$, $\mathbf{R} \succ 0$ |
| $\mathbf{x}(t_f)^\top\mathbf{Q}_f\mathbf{x}(t_f)$ | Terminal penalty in the finite-horizon problem, $\mathbf{Q}_f \succeq 0$ |
| $\mathbf{Q} \succeq 0$, detectable $(\mathbf{A},\mathbf{Q}^{1/2})$ | No unstable mode may be invisible to the cost |
| $\mathbf{R} \succ 0$ | Every control direction costs something; otherwise the problem is singular |
| $\mathbf{A}_{cl}^\top\mathbf{P} + \mathbf{P}\mathbf{A}_{cl} + \mathbf{Q} + \mathbf{K}^\top\mathbf{R}\mathbf{K} = 0$ | Lyapunov equation giving $J(\mathbf{x}_0) = \mathbf{x}_0^\top\mathbf{P}\mathbf{x}_0$ for a fixed $\mathbf{K}$ |
| $Q_{ii} = 1/x_{i,\max}^2$, $R_{jj} = 1/u_{j,\max}^2$ | Scaling that makes the integrand dimensionless and $J$ read in seconds |
| $\alpha\mathbf{Q}, \alpha\mathbf{R}$ | Gives the same $\mathbf{K}$; only the ratio matters |
| $2\mathbf{x}^\top\mathbf{N}\mathbf{u}$ | Cross term; well posed iff $\mathbf{R} \succ 0$ and $\mathbf{Q} - \mathbf{N}\mathbf{R}^{-1}\mathbf{N}^\top \succeq 0$ |
| $\mathbf{Q} = \mathbf{C}_z^\top\mathbf{C}_z$, $\mathbf{N} = \mathbf{C}_z^\top\mathbf{D}_z$, $\mathbf{R} = \mathbf{D}_z^\top\mathbf{D}_z$ | Weighting an output $\mathbf{z} = \mathbf{C}_z\mathbf{x} + \mathbf{D}_z\mathbf{u}$ |
| $\bar{\mathbf{A}} = \mathbf{A} - \mathbf{B}\mathbf{R}^{-1}\mathbf{N}^\top$, $\bar{\mathbf{Q}} = \mathbf{Q} - \mathbf{N}\mathbf{R}^{-1}\mathbf{N}^\top$, $\mathbf{K} = \bar{\mathbf{K}} + \mathbf{R}^{-1}\mathbf{N}^\top$ | Removing the cross term |
| Wheel axis, $J = 120\,\mathrm{kg\,m^2}$ | $\mathbf{K} = (916.7,\ 522.1)$, poles $-2.175 \pm 1.705j$, $J = 56.95\,\mathrm{s}$ from $5^\circ$ |
| Load relief | Cross term halves the peak bending moment: $1.69\times10^{5}$ against $3.88\times10^{5}\,\mathrm{N\,m}$ |

The cost is now defined; nothing here says how to minimise it. The next lesson does that twice over — once by dynamic programming, once by the calculus of variations — and both routes arrive at the same matrix equation for $\mathbf{P}$.
