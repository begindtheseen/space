---
id: l05-linear-and-quadratic-programming
title: Linear and quadratic programming
minutes: 24
covers:
  - linear and quadratic programming
---

A calculator takes buttons, not wishes. An optimization solver is the same: it does not accept "a convex function", only a problem written in one of a handful of **standard forms**, and the engineer's job is to fit the physics into one. This lesson and the next three name those forms. The two oldest and most used are the **[[linear program|programming-word]]** (LP) and the **quadratic program** (QP).

Both are everywhere in guidance and control. A minimum-fuel landing with constant mass and one-dimensional thrust is an LP, and its answer has the coast-then-burn shape every lander flies. A linear-quadratic regulator with actuator limits is the QP a model-predictive controller solves every cycle. Least-squares estimation and splitting a command among redundant thrusters are one or the other.

They also teach two pieces of geometry. An LP's optimum sits at a *corner* of the feasible region, so a linear cost gives switching, saturated controls. A QP's optimum can sit anywhere, so a quadratic cost gives smooth ones.

## Linear programs

Picture shopping. The bill is price times quantity, added up — a **linear** function: double the quantities and the bill doubles. The rules ("at most 3 of these", "at least 50 in total") are linear too. Minimize the bill subject to the rules and you have a linear program.

> A **linear program** is the minimization of a linear function over a polyhedron: $\text{minimize } \mathbf{c}^\top\mathbf{x}$ subject to $\mathbf{A}\mathbf{x} \le \mathbf{b}$ and $\mathbf{F}\mathbf{x} = \mathbf{g}$, with the inequality read component by component.

Here $\mathbf{x} \in \mathbb{R}^n$ is the list of decision variables. $\mathbf{c}^\top\mathbf{x}$ (read "c transpose x") is the dot product $c_1x_1 + \dots + c_nx_n$ — the bill, with $\mathbf{c}$ the **cost vector** of prices. $\mathbf{A} \in \mathbb{R}^{m \times n}$ and $\mathbf{b} \in \mathbb{R}^m$ hold $m$ inequality rows; $\mathbf{F} \in \mathbb{R}^{p \times n}$ and $\mathbf{g} \in \mathbb{R}^p$ hold $p$ equality rows.

An LP is convex: the objective is affine, each inequality is a halfspace, each equality a hyperplane, and the feasible set is their intersection — a **[[polyhedron|polyhedron-word]]**, a flat-sided shape. Everything from lesson 4 applies: any local minimum is global, KKT is necessary and sufficient, and a solver returns a certificate.

Several equivalent forms circulate; move between them freely:

- **Maximizing** $\mathbf{c}^\top\mathbf{x}$ is minimizing $-\mathbf{c}^\top\mathbf{x}$.
- An inequality $\mathbf{a}^\top\mathbf{x} \le b$ becomes an equality plus a nonnegative **slack** — the unused room: $\mathbf{a}^\top\mathbf{x} + s = b$, $s \ge 0$. Doing this to every row gives the **standard form** $\text{minimize } \mathbf{c}^\top\mathbf{x}$ s.t. $\mathbf{A}\mathbf{x} = \mathbf{b}$, $\mathbf{x} \ge \mathbf{0}$, which the simplex method works on.
- A **free variable** (allowed to be any sign) is split as $x = x^+ - x^-$ with $x^+, x^- \ge 0$.
- An **absolute value** in the objective is not linear. But $\text{minimize } |x|$ has the same optimum as the LP $\text{minimize } t$ s.t. $-t \le x \le t$, because $t$ gets pushed down until it meets $|x|$. The same trick turns $\|\mathbf{x}\|_1 = \sum_i |x_i|$ (the sum of sizes) and $\|\mathbf{x}\|_\infty = \max_i |x_i|$ (the largest size) into LPs. So "minimize total thruster on-time" and "minimize the largest torque" are LPs.

### The optimum is at a vertex

Tilt a flat tray with a marble in it. The marble rolls to a corner — unless one edge is exactly level, and then the whole edge is equally low. An LP behaves the same way.

The level sets of $\mathbf{c}^\top\mathbf{x}$ (where the cost is constant) are parallel flat planes. Slide one downhill, in the direction $-\mathbf{c}$, until it is about to leave the polyhedron. The last contact is, in general, a single **[[vertex|vertex-picture]]** — a corner.

Here is the argument in words, because the bang-bang result grows from it. Take any feasible $\mathbf{x}$ that is not a vertex. Then there is a direction $\mathbf{d}$ you can move both ways, $\mathbf{x} \pm \epsilon\mathbf{d}$, and stay feasible — that is what "not at a corner" means. Along that line the objective $\mathbf{c}^\top(\mathbf{x} + t\mathbf{d}) = \mathbf{c}^\top\mathbf{x} + t\,\mathbf{c}^\top\mathbf{d}$ is a straight line in $t$. Either it is flat, or it goes down one way. If it goes down, $\mathbf{x}$ was not optimal. If it is flat, slide along until a new constraint becomes active, and repeat with one more active constraint. On a bounded polyhedron this ends at a vertex, no worse than where you started.

::: key Vertex optimality of linear programs
If a linear program has a bounded feasible set, then it has an optimal solution at a **vertex** — a point where $n$ linearly independent constraints are active. The optimal set is a face of the polyhedron; a unique optimum is a vertex, and a non-unique optimum is an edge or a higher-dimensional face whose corners are all optimal.
:::

A vertex in $\mathbb{R}^n$ has at least $n$ active constraints. If $p$ are equalities, at least $n - p$ inequalities are active. That count is the whole bang-bang result.

The **simplex method** walks from corner to neighboring corner, always downhill, until no neighbor is better. It is exact and usually fast. But a box in $\mathbb{R}^n$ has $2^n$ corners, and **[[specially built examples|klee-minty]]** make simplex visit a huge share of them, so it has no polynomial worst-case bound. **Interior-point methods** (lesson 9) travel through the inside and reach the optimal face in a polynomially bounded number of iterations — in practice a few tens. Landing guidance uses them for exactly that reason.

::: example Splitting a burn between two engines
A stage has two engines that together must deliver at least $50\,\mathrm{kN}$. Engine 1 is less efficient: it costs $1.2$ units of propellant per kN·s. Engine 2 costs $1.0$. Each engine gives at most $30\,\mathrm{kN}$. Minimize propellant per second:

$$
\text{minimize } 1.2\,T_1 + 1.0\,T_2 \quad \text{s.t.} \quad T_1 + T_2 \ge 50, \quad 0 \le T_1 \le 30, \quad 0 \le T_2 \le 30 .
$$

**The corners.** The feasible set is the part of the $30 \times 30$ box above the line $T_1 + T_2 = 50$: a triangle with vertices $(20, 30)$, $(30, 20)$ and $(30, 30)$.

**Test each corner.** $(20, 30)$: $1.2 \times 20 + 30 = 54$. $(30, 20)$: $1.2 \times 30 + 20 = 56$. $(30, 30)$: $36 + 30 = 66$. The optimum is $(20, 30)$: run the efficient engine at its limit and make up the rest with the other. Two constraints are active there, $T_1 + T_2 = 50$ and $T_2 = 30$, and $n = 2$, as vertex optimality requires.

**The multipliers agree.** Stationarity in $T_1$ reads $1.2 - \lambda_{\text{sum}} = 0$ (the bounds on $T_1$ are inactive). Stationarity in $T_2$ reads $1.0 - \lambda_{\text{sum}} + \lambda_{T_2} = 0$. So $\lambda_{\text{sum}} = 1.2$ and $\lambda_{T_2} = 0.2$. Both are nonnegative, so KKT holds, and since the problem is convex, $(20, 30)$ is globally optimal.

**What the shadow prices say.** One more kN of required thrust costs $1.2$, because it must come from engine 1. Raising engine 2's ceiling by one kN would save $0.2$, by swapping a kN from engine 1 to engine 2. Sanity check: $1.2 - 1.0 = 0.2$, the price difference between the engines.

With two hundred thrust variables instead of two, checking corners is hopeless and a solver is the only way.
:::

## Bang-bang thrust: a linear cost over a box

Now the landing. Cut a vertical descent into $N$ steps of length $\Delta t$ ("delta t"). At step $k$ the vehicle has altitude $h_k$, velocity $v_k$ (positive upward) and thrust acceleration $T_k$ — thrust force divided by a mass we treat as constant for now. With explicit Euler steps and constant gravity $g$, the problem is

$$
\begin{aligned}
\text{minimize}\quad & \sum_{k=0}^{N-1} T_k\,\Delta t \\
\text{subject to}\quad & h_{k+1} = h_k + v_k\,\Delta t, \qquad v_{k+1} = v_k + (T_k - g)\,\Delta t, \\
& h_0, v_0 \text{ given}, \qquad h_N = 0, \quad v_N = 0, \\
& 0 \le T_k \le T_{\max}, \qquad h_k \ge 0 .
\end{aligned}
$$

Every constraint is affine in $(h_k, v_k, T_k)$ and the objective is linear: an LP, with $3N + 2$ variables ($N + 1$ altitudes, $N + 1$ velocities, $N$ thrusts), $2N + 4$ equalities ($2N$ dynamics, 2 start, 2 end) and $3N + 1$ inequalities ($2N$ thrust bounds, $N + 1$ altitude bounds). For $N = 200$: $602$ variables, $404$ equalities, $601$ inequalities.

Because the dynamics are linear, the states can be eliminated: each $h_k$ and $v_k$ is an affine function of the thrusts. What remains is a problem in the $N$ thrusts alone, with two equalities (final altitude and velocity), $2N$ box bounds, and $N + 1$ altitude inequalities, inactive unless the vehicle grazes the ground.

Suppose the altitude constraints are inactive. At a vertex, at least $N$ constraints are active, and only two of them can be the equalities. So **at least $N - 2$ of the thrusts sit on a bound** — at $0$ or at $T_{\max}$. At most two steps take an in-between value: the steps where the switch from coasting to full thrust falls. That is the **bang-bang** profile — coast, then burn flat out. If the altitude floor becomes active at some steps, each can add one more in-between value (a hover), but the count stays small.

The KKT conditions agree. Give the velocity equation at step $k$ the multiplier $\nu_k$ ("nu k"), and the two bounds on $T_k$ the multipliers $\lambda_k^{\text{lo}} \ge 0$ and $\lambda_k^{\text{hi}} \ge 0$. Stationarity in $T_k$ is

$$
\Delta t - \nu_k\,\Delta t - \lambda_k^{\text{lo}} + \lambda_k^{\text{hi}} = 0 .
$$

Define the **[[switching function|switching-function]]** $S_k = 1 - \nu_k$. If $S_k > 0$, the equation needs $\lambda_k^{\text{lo}} > 0$, so by complementary slackness the lower bound is active: $T_k = 0$. If $S_k < 0$, it needs $\lambda_k^{\text{hi}} > 0$, so $T_k = T_{\max}$. The sign of a multiplier decides the control, and it switches when that sign changes. If $S_k = 0$ over a run of steps, stationarity says nothing about $T_k$ and in-between values are allowed there: a **singular arc**. Singular arcs are the exception; hovering against the altitude floor is one.

::: key Why a minimum-fuel problem with linear cost is bang-bang
The optimum of a linear objective over a polytope lies at a vertex, so the control sits at a bound almost everywhere and switches when the multiplier (the switching function) changes sign. Singular arcs are the exception.
:::

::: warning With constant mass and a fixed final time, the LP cost is constant
Add up the velocity equations from $0$ to $N$: $v_N = v_0 + \sum_k T_k\,\Delta t - N g\,\Delta t$. With $v_N = 0$ this forces $\sum_k T_k\,\Delta t = -v_0 + g\,t_f$, where $t_f = N\Delta t$ is the final time. The total impulse is fixed by the boundary conditions, so *every* feasible thrust history has the same cost. The LP is then a feasibility problem with a flat objective. A bang-bang profile is *an* optimum, but so is every other feasible profile, and an interior-point solver will return a point in the middle of the optimal face rather than a corner.

What the fuel objective really selects is the **final time**. The impulse $-v_0 + g\,t_f$ is the speed to be removed plus the **gravity loss** $g\,t_f$, and the shortest feasible $t_f$ has the least gravity loss. That shortest-time solution is the bang-bang one. Once mass drops as propellant burns (next lesson), a late burn is cheaper for a second reason: each meter per second costs less propellant when the vehicle is lighter.
:::

::: example The coast-then-burn landing
Take $h_0 = 1000\,\mathrm{m}$, $v_0 = -50\,\mathrm{m/s}$, $g = 9.80665\,\mathrm{m/s^2}$ and $T_{\max} = 30\,\mathrm{m/s^2}$. Find the fastest landing — by the warning above, the minimum-fuel one. It coasts for a time $t_1$, then burns at $T_{\max}$, with net upward acceleration $a = T_{\max} - g = 20.19\,\mathrm{m/s^2}$, until it stops exactly at the ground.

**Where the coast ends.** Falling freely, $v_1 = v_0 - g t_1$ and $h_1 = h_0 + v_0 t_1 - \tfrac{1}{2} g t_1^2$.

**When to light.** A full-thrust burn from speed $v_1$ needs a stopping distance $v_1^2 / (2a)$, so ignition must happen at $h_1 = v_1^2/(2a)$. Substitute and collect the powers of $t_1$ to get a quadratic:

$$
(g^2 + ag)\,t_1^2 - 2v_0(g + a)\,t_1 + (v_0^2 - 2ah_0) = 0 .
$$

Its positive root is $t_1 = 7.34\,\mathrm{s}$. At ignition $v_1 = -122.0\,\mathrm{m/s}$ and $h_1 = 368.6\,\mathrm{m}$. The burn lasts $t_b = -v_1/a = 6.04\,\mathrm{s}$, so touchdown is at $t_f = 13.38\,\mathrm{s}$.

**The bill.** Total impulse is $T_{\max}\,t_b = 181.3\,\mathrm{m/s}$. Of that, $122.0$ is the speed removed and $g\,t_b = 59.2$ is gravity loss. Sanity check: $122.0 + 59.2 = 181.2$, matching up to rounding.

**Compare a gentle descent.** Constant thrust from the start needs $T = g + v_0^2/(2h_0) = 11.06\,\mathrm{m/s^2}$ for $2h_0/|v_0| = 40\,\mathrm{s}$: impulse $442\,\mathrm{m/s}$. Bang-bang saves $261\,\mathrm{m/s}$, about $59\,\%$, by not fighting gravity for $27$ extra seconds. This is the physics of the **[[suicide burn|suicide-burn]]**: every second hovering costs $g$ of impulse for nothing.

In the LP with $N = 200$ steps over $t_f = 13.38\,\mathrm{s}$, the profile would be $T_k = 0$ for the first $110$ steps and $T_k = 30$ for the last $90$, with at most two in-between steps where the switch falls inside a step.
:::

What about a minimum throttle? If the engine must always run between $T_{\min}$ and $T_{\max}$, the box is $[T_{\min}, T_{\max}]$ and the profile switches between those two limits. But if it may be *either* off *or* between them, each $T_k$ lives in $\{0\} \cup [T_{\min}, T_{\max}]$ — two separate pieces, not convex — and LP theory no longer applies. That is the minimum-throttle problem of lesson 3; the next lesson resolves it.

## Quadratic programs

Now change only the bill: pay a penalty that grows with the *square*, like the energy of a spring, $\tfrac{1}{2}kx^2$. Big values get punished much harder than small ones, so the optimizer spreads effort out.

> A **quadratic program** is $\text{minimize } \tfrac{1}{2}\mathbf{x}^\top\mathbf{P}\mathbf{x} + \mathbf{q}^\top\mathbf{x}$ subject to $\mathbf{A}\mathbf{x} \le \mathbf{b}$ and $\mathbf{F}\mathbf{x} = \mathbf{g}$, with $\mathbf{P} = \mathbf{P}^\top$.

The constraints are the LP's; only the objective changed. The QP is **convex** exactly when $\mathbf{P} \succeq 0$ (read "P is positive semidefinite": $\mathbf{x}^\top\mathbf{P}\mathbf{x} \ge 0$ for every $\mathbf{x}$), because the Hessian of the objective is $\mathbf{P}$. With $\mathbf{P} \succ 0$ (positive definite) it is strictly convex and the minimizer is unique. With $\mathbf{P} = \mathbf{0}$ the QP is an LP. With $\mathbf{P}$ indefinite it is nonconvex and, in general, NP-hard — the word "quadratic" alone promises nothing.

The level sets of a strictly convex quadratic are ellipsoids (stretched spheres) centered on the unconstrained minimizer $-\mathbf{P}^{-1}\mathbf{q}$. If that center is feasible, it is the answer. If not, the answer is where the smallest ellipsoid **[[touches|qp-touch]]** the feasible polyhedron — on a face, almost never at a corner. So quadratic costs give controls that vary smoothly and saturate only when they must, which is why tracking controllers and estimators use them.

### The equality-constrained QP is a linear system

With only equality constraints, a QP is solved in one linear solve. The Lagrangian is $\mathcal{L} = \tfrac{1}{2}\mathbf{x}^\top\mathbf{P}\mathbf{x} + \mathbf{q}^\top\mathbf{x} + \boldsymbol{\nu}^\top(\mathbf{F}\mathbf{x} - \mathbf{g})$. The KKT conditions are stationarity, $\mathbf{P}\mathbf{x} + \mathbf{q} + \mathbf{F}^\top\boldsymbol{\nu} = \mathbf{0}$, and feasibility, $\mathbf{F}\mathbf{x} = \mathbf{g}$. Stack them:

$$
\begin{bmatrix} \mathbf{P} & \mathbf{F}^\top \\ \mathbf{F} & \mathbf{0} \end{bmatrix}
\begin{bmatrix} \mathbf{x} \\ \boldsymbol{\nu} \end{bmatrix}
=
\begin{bmatrix} -\mathbf{q} \\ \mathbf{g} \end{bmatrix} .
$$

This is the **KKT matrix**. It is symmetric but **[[indefinite|kkt-saddle]]**: the zero block gives it negative eigenvalues. It is invertible when $\mathbf{F}$ has full row rank and $\mathbf{P}$ is positive definite on the null space of $\mathbf{F}$ (the directions the constraints allow). Since the problem is convex, its solution is the global minimizer. Every interior-point and SQP iteration later in the module solves a system of this shape.

When $\mathbf{P} = \mathbf{I}$ there is a closed form. Stationarity gives $\mathbf{x} = -\mathbf{q} - \mathbf{F}^\top\boldsymbol{\nu}$. Put that into $\mathbf{F}\mathbf{x} = \mathbf{g}$ to get $\mathbf{F}\mathbf{F}^\top\boldsymbol{\nu} = -\mathbf{F}\mathbf{q} - \mathbf{g}$, a small $p \times p$ system for the multipliers; then $\mathbf{x}$ follows. With $\mathbf{q} = \mathbf{0}$ this is the **minimum-norm solution** $\mathbf{x} = \mathbf{F}^\top(\mathbf{F}\mathbf{F}^\top)^{-1}\mathbf{g}$ of the underdetermined system $\mathbf{F}\mathbf{x} = \mathbf{g}$ — the workhorse of **[[control allocation|control-allocation]]**.

::: example A minimum-energy descent in four steps
A vehicle at rest at altitude $10\,\mathrm{m}$ must reach the ground at rest in $N = 4$ steps of $\Delta t = 1\,\mathrm{s}$, using the least control energy $\sum_k u_k^2$. Here $u_k$ is the net acceleration (thrust minus gravity), held constant over step $k$.

**Dynamics.** Exact integration over a step gives $v_{k+1} = v_k + u_k\Delta t$ and $h_{k+1} = h_k + v_k\Delta t + \tfrac{1}{2}u_k\Delta t^2$.

**Eliminate the states.** Final velocity: $v_4 = \sum_k u_k = 0$. Final altitude: $h_4 = 10 + \sum_k u_k\,(N - k - \tfrac{1}{2}) = 0$, because an acceleration applied in step $k$ acts on the position for the remaining $N - k - \tfrac{1}{2}$ seconds on average. The QP is

$$
\text{minimize } \tfrac{1}{2}\|\mathbf{u}\|_2^2 \quad \text{s.t.} \quad
\mathbf{F}\mathbf{u} = \mathbf{g}, \qquad
\mathbf{F} = \begin{bmatrix} 1 & 1 & 1 & 1 \\ 3.5 & 2.5 & 1.5 & 0.5 \end{bmatrix}, \quad
\mathbf{g} = \begin{bmatrix} 0 \\ -10 \end{bmatrix} .
$$

**Solve for the multipliers.** $\mathbf{P} = \mathbf{I}$ and $\mathbf{q} = \mathbf{0}$, so $\mathbf{F}\mathbf{F}^\top\boldsymbol{\nu} = -\mathbf{g}$. The entries of $\mathbf{F}\mathbf{F}^\top$ are $1+1+1+1 = 4$, $3.5^2 + 2.5^2 + 1.5^2 + 0.5^2 = 21$, and the cross term $3.5 + 2.5 + 1.5 + 0.5 = 8$:

$$
\begin{bmatrix} 4 & 8 \\ 8 & 21 \end{bmatrix}\boldsymbol{\nu} = \begin{bmatrix} 0 \\ 10 \end{bmatrix}, \qquad
\boldsymbol{\nu} = \tfrac{1}{20}\begin{bmatrix} 21 & -8 \\ -8 & 4 \end{bmatrix}\begin{bmatrix} 0 \\ 10 \end{bmatrix} = \begin{bmatrix} -4 \\ 2 \end{bmatrix},
$$

using the determinant $4 \times 21 - 8 \times 8 = 20$.

**Recover the controls.** $\mathbf{u} = -\mathbf{F}^\top\boldsymbol{\nu}$ gives $u_k = 4 - 2(N - k - \tfrac{1}{2})$:

$$
\mathbf{u} = (-3, -1, 1, 3)\ \mathrm{m/s^2}, \qquad \sum_k u_k^2 = 20\ \mathrm{m^2/s^4}.
$$

**Check the trajectory.** $(h, v)$ runs $(10, 0) \to (8.5, -3) \to (5, -4) \to (1.5, -3) \to (0, 0)$: it lands at rest. The control is a straight line in time — speed up downward, then brake — with no saturation, the signature of a quadratic cost.

**The multipliers as prices.** As in lesson 2, $\nu_2 = 2$ says that lowering the target by one more meter ($g_2 = -11$) would raise the optimal cost $\tfrac{1}{2}\|\mathbf{u}\|^2$ by about $2$. At $g_2 = -10.1$ the exact cost is $10.201$; the prediction is $10 + 0.1 \times 2 = 10.2$.

With a linear cost the control would instead sit at a bound for all but at most two steps — same dynamics, a completely different shape, decided by the objective alone.
:::

### Inequalities: active sets and the return of case analysis

Add inequality constraints and one linear solve is no longer enough, because you do not know in advance which inequalities will be active. Two families of algorithm handle this.

**Active-set methods** do what lesson 2 did by hand. Guess the active constraints, solve the equality-constrained QP with those as equalities, check the multipliers and the inactive constraints, then add or drop one constraint and repeat. Each iteration is one KKT solve, cheap when **warm-started** from the last active set, so it excels when the active set barely changes between solves — a controller re-solving every cycle. Its weakness is the worst case: nothing better bounds the iterations than the number of possible active sets.

**Interior-point methods** solve a QP in a bounded number of Newton steps that barely depends on the data — the choice when a bound is needed. A third family, operator splitting (the ADMM method behind the OSQP solver), trades accuracy for very cheap iterations; the modeling lesson covers it.

The **LQR** (linear-quadratic regulator) problem is the classic QP. For a linear system $\mathbf{x}_{k+1} = \mathbf{A}_d\mathbf{x}_k + \mathbf{B}_d\mathbf{u}_k$ and cost $\sum_k \mathbf{x}_k^\top\mathbf{Q}\mathbf{x}_k + \mathbf{u}_k^\top\mathbf{R}\mathbf{u}_k$, with $\mathbf{Q} \succeq 0$ and $\mathbf{R} \succ 0$, stacking over the horizon gives a QP whose only constraints are the dynamics. Eliminating the states leaves an unconstrained strictly convex quadratic, solved by the Riccati recursion of the control module. Add $\|\mathbf{u}_k\|_\infty \le u_{\max}$ and no recursion solves it — it is a constrained QP, and you are doing **[[model-predictive control|mpc]]**.

::: key Distinguishing LP, QP and SOCP
LP: linear objective and linear constraints. QP: convex quadratic objective ($\mathbf{P} \succeq 0$), linear constraints. SOCP (next lesson): linear objective with second-order cone constraints — strictly more general than both. An LP's optimum is at a vertex of the feasible polyhedron; a QP's optimum is where the smallest level ellipsoid touches it, generally not a vertex.
:::

::: warning A quadratic objective is not automatically convex
$\tfrac{1}{2}\mathbf{x}^\top\mathbf{P}\mathbf{x}$ is convex only if $\mathbf{P} \succeq 0$. The cost $x_1 x_2$ has $\mathbf{P} = \begin{bmatrix} 0 & 1 \\ 1 & 0 \end{bmatrix}$, with eigenvalues $+1$ and $-1$. That "QP" has no finite minimum over $\mathbb{R}^2$, and over a box it has more than one local minimum. Convex QP solvers check $\mathbf{P} \succeq 0$ (or ask you for a factor $\mathbf{P} = \mathbf{L}\mathbf{L}^\top$) because a single negative eigenvalue turns a bounded-iteration problem into an NP-hard one. When a QP comes from a least-squares residual $\|\mathbf{M}\mathbf{x} - \mathbf{y}\|_2^2$, then $\mathbf{P} = 2\mathbf{M}^\top\mathbf{M} \succeq 0$ automatically. When someone hands you a $\mathbf{P}$ any other way, check its eigenvalues.
:::

## Check yourself

::: check
Write $\text{minimize } \|\mathbf{x}\|_\infty$ subject to $\mathbf{F}\mathbf{x} = \mathbf{g}$ as a linear program. How many variables and inequality constraints does it have if $\mathbf{x} \in \mathbb{R}^n$?
:::

::: answer
Add one scalar $t$ and require $-t \le x_i \le t$ for every $i$:

$\text{minimize } t$ s.t. $\mathbf{F}\mathbf{x} = \mathbf{g}$, $x_i \le t$, $-x_i \le t$.

At the optimum $t = \max_i |x_i| = \|\mathbf{x}\|_\infty$, because $t$ is pushed down until it meets the largest component. It has $n + 1$ variables and $2n$ inequalities.

Minimizing $\|\mathbf{x}\|_1$ instead needs $n$ extra variables $t_i$ with $-t_i \le x_i \le t_i$ and objective $\sum_i t_i$: $2n$ variables and $2n$ inequalities.
:::

::: check
A linear program in $\mathbb{R}^{50}$ has $3$ equality constraints and $100$ inequality constraints (an upper and a lower bound on each variable). At a vertex, at least how many variables are at a bound? How does this relate to bang-bang control?
:::

::: answer
A vertex has at least $n = 50$ linearly independent active constraints. At most $3$ are equalities, so at least $47$ are bounds. A variable can have only one of its two bounds active at a time, so at least $47$ of the $50$ variables sit at a bound, and at most $3$ take in-between values.

For a thrust history this says the profile is saturated at all but at most three steps: bang-bang with at most three transition steps. The number of equality constraints (terminal conditions) sets the budget for in-between values.
:::

::: check
In the two-engine example, the required thrust rises from $50$ to $58\,\mathrm{kN}$. Use the shadow price to predict the new optimal cost, then check by finding the new optimal vertex. Where does the prediction break down?
:::

::: answer
The shadow price of the thrust requirement is $\lambda_{\text{sum}} = 1.2$, so the prediction is $54 + 1.2 \times 8 = 63.6$.

The new optimum keeps engine 2 at $30$ and raises engine 1 to $28$: cost $1.2 \times 28 + 30 = 33.6 + 30 = 63.6$. Exactly as predicted, because the same constraints are still active.

It breaks down past $60\,\mathrm{kN}$, where engine 1 also hits its ceiling: at $60$ the cost is $36 + 30 = 66$, and above $60$ the problem is infeasible. A shadow price is a local derivative, exact only while the same constraints stay active.
:::

::: check
For the equality-constrained QP $\text{minimize } \tfrac{1}{2}\mathbf{x}^\top\mathbf{P}\mathbf{x} + \mathbf{q}^\top\mathbf{x}$ s.t. $\mathbf{F}\mathbf{x} = \mathbf{g}$, with $\mathbf{P} \succ 0$, derive the multipliers in closed form.
:::

::: answer
Stationarity gives $\mathbf{x} = -\mathbf{P}^{-1}(\mathbf{q} + \mathbf{F}^\top\boldsymbol{\nu})$. Substitute into $\mathbf{F}\mathbf{x} = \mathbf{g}$:

$-\mathbf{F}\mathbf{P}^{-1}\mathbf{q} - \mathbf{F}\mathbf{P}^{-1}\mathbf{F}^\top\boldsymbol{\nu} = \mathbf{g}$, so $\boldsymbol{\nu} = -(\mathbf{F}\mathbf{P}^{-1}\mathbf{F}^\top)^{-1}(\mathbf{g} + \mathbf{F}\mathbf{P}^{-1}\mathbf{q})$.

The matrix $\mathbf{F}\mathbf{P}^{-1}\mathbf{F}^\top$ is $p \times p$ and positive definite when $\mathbf{F}$ has full row rank, so the multipliers are unique. With $\mathbf{P} = \mathbf{I}$ and $\mathbf{q} = \mathbf{0}$ this becomes $\boldsymbol{\nu} = -(\mathbf{F}\mathbf{F}^\top)^{-1}\mathbf{g}$, which is what the four-step example used.
:::

::: check
A colleague proposes minimizing $\sum_k T_k^2\,\Delta t$ instead of $\sum_k T_k\,\Delta t$ in the landing LP, "because the QP is smoother to solve". What will the thrust profile look like, and is it fuel-optimal?
:::

::: answer
The squared cost punishes large thrusts disproportionately, so its optimum spreads the braking over the horizon at moderate values — a smooth profile with little or no saturation, as in the four-step example.

It is not fuel-optimal. Propellant is proportional to the integral of thrust, not thrust squared, and a spread-out burn spends longer holding the vehicle up against gravity. With a free final time, the squared cost would not push toward the shortest horizon either.

The QP answers a different question. If smoothness is wanted, add it as a constraint (a rate limit on $T_k$) to the linear-cost problem; do not swap the objective.
:::

## Summary

| Object | Statement |
| --- | --- |
| LP | $\text{minimize } \mathbf{c}^\top\mathbf{x}$ s.t. $\mathbf{A}\mathbf{x} \le \mathbf{b}$, $\mathbf{F}\mathbf{x} = \mathbf{g}$; feasible set a polyhedron |
| Standard form | $\mathbf{A}\mathbf{x} = \mathbf{b}$, $\mathbf{x} \ge \mathbf{0}$, reached by slacks and splitting free variables |
| Norm tricks | $|x| \le t$ as $-t \le x \le t$; $\|\cdot\|_1$ and $\|\cdot\|_\infty$ objectives become LPs |
| Vertex optimality | A bounded LP has an optimal vertex: $n$ linearly independent active constraints, at least $n - p$ of them inequalities |
| Bang-bang | With $p$ terminal equalities, at most $p$ thrust values are off their bounds; switching function $S_k = 1 - \nu_k$ decides $0$ or $T_{\max}$ |
| Fixed-time degeneracy | Constant mass and fixed $t_f$ give $\sum_k T_k\Delta t = -v_0 + g\,t_f$: the LP cost is flat; fuel optimality selects the shortest $t_f$ |
| Coast-then-burn example | $t_1 = 7.34\,\mathrm{s}$, $h_1 = 369\,\mathrm{m}$, $t_b = 6.04\,\mathrm{s}$, impulse $181\,\mathrm{m/s}$ vs $442$ for a gentle descent |
| QP | $\text{minimize } \tfrac{1}{2}\mathbf{x}^\top\mathbf{P}\mathbf{x} + \mathbf{q}^\top\mathbf{x}$ over a polyhedron; convex iff $\mathbf{P} \succeq 0$ |
| KKT system | $\begin{bmatrix} \mathbf{P} & \mathbf{F}^\top \\ \mathbf{F} & \mathbf{0} \end{bmatrix}\begin{bmatrix} \mathbf{x} \\ \boldsymbol{\nu} \end{bmatrix} = \begin{bmatrix} -\mathbf{q} \\ \mathbf{g} \end{bmatrix}$; one linear solve for an equality-constrained QP |
| Minimum norm | $\mathbf{x} = \mathbf{F}^\top(\mathbf{F}\mathbf{F}^\top)^{-1}\mathbf{g}$ |
| Algorithms | Simplex and active-set: vertex walks, finite but no polynomial bound; interior-point: bounded iterations |

The next lesson adds the constraint that neither LP nor QP can express — a bound on the length of a vector — and with it the second-order cone program, the form in which three-dimensional landing guidance is actually solved.

::: context programming-word Why "programming"?
In the 1940s "program" meant a plan or schedule — a military training program, a production program. George Dantzig was working on planning problems for the US Air Force when, in 1947, he invented the simplex method for "programming in a linear structure". The name stuck. So a linear program is a plan chosen by linear rules, and has nothing to do with writing code — which is why engineers also say "linear optimization".
:::

::: context polyhedron-word A shape with flat sides
**Polyhedron** is Greek for "many seats" or "many faces". In three dimensions think of a cut gemstone: every face is flat, every edge straight. In optimization the word stretches to any number of dimensions and allows shapes that run off to infinity, like a single halfspace. What matters is that every wall is flat, because each wall is one linear inequality. A bounded polyhedron is also called a **polytope**.
:::

::: context vertex-picture The two-engine problem, drawn
The shaded triangle is every allowed pair of thrusts. The blue line is every pair costing $54$. Sliding it toward lower cost (down and to the left), it leaves the triangle last at the corner $(20, 30)$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 215" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="190" x2="210" y2="190" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="190" x2="40" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="96,64 166,64 166,134" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="64" x2="166" y2="64" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <line x1="166" y1="190" x2="166" y2="64" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <line x1="71.5" y1="34.6" x2="194" y2="181.6" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="96" cy="64" r="5" fill="#b4232c"/>
  <text x="90" y="56" font-size="11" text-anchor="end" fill="#b4232c">(20, 30) best</text>
  <text x="172" y="138" font-size="11" fill="#1f2a44">(30, 20)</text>
  <text x="172" y="60" font-size="11" fill="#1f2a44">(30, 30)</text>
  <text x="198" y="176" font-size="11" fill="#1d6fd1">cost 54</text>
  <text x="96" y="204" font-size="11" text-anchor="middle" fill="#1f2a44">20</text>
  <text x="166" y="204" font-size="11" text-anchor="middle" fill="#1f2a44">30</text>
  <text x="34" y="138" font-size="11" text-anchor="end" fill="#1f2a44">20</text>
  <text x="34" y="68" font-size="11" text-anchor="end" fill="#1f2a44">30</text>
  <text x="215" y="194" font-size="12" fill="#1f2a44">T1 (kN)</text>
  <text x="46" y="24" font-size="12" fill="#1f2a44">T2 (kN)</text>
  <text x="250" y="90" font-size="11" fill="#1f2a44">allowed:</text>
  <text x="250" y="106" font-size="11" fill="#1f2a44">T1 + T2 ≥ 50</text>
  <text x="250" y="122" font-size="11" fill="#1f2a44">both ≤ 30</text>
</svg>
```

The axes start at $12\,\mathrm{kN}$, not zero, to make the triangle big enough to see.
:::

::: context klee-minty The cube that fools the simplex method
In 1972 Victor Klee and George Minty built a slightly squashed cube in $n$ dimensions on which the classic simplex rule visits all $2^n$ corners before finishing. At $n = 50$ that is about $10^{15}$ steps. Such cases almost never come up in practice, and simplex remains a superb everyday method. But "almost never" cannot go into a flight-software safety case, and that is why onboard solvers use interior-point methods with a proven bound.
:::

::: context switching-function A switch run by a price
Think of $\nu_k$ as the value, in fuel, of one more meter per second of speed change at step $k$. The cost of buying it with thrust is always $1$ per unit of impulse. When the value is less than the cost ($S_k > 0$), the optimizer buys nothing — engine off. When the value is more ($S_k < 0$), it buys all it can — full thrust. Only when value and cost are exactly equal does it make sense to buy some. In the optimal-control course the same quantity reappears as a **costate**, and the rule becomes Pontryagin's minimum principle.
:::

::: context suicide-burn Why Falcon 9 cannot hover
The bang-bang landing is how a Falcon 9 first stage lands. Even at its lowest throttle, a single Merlin engine pushes harder than the nearly empty stage weighs, so the stage cannot hover: it must light at just the right height and reach zero speed exactly at the ground. Engineers call it a "hoverslam"; fans often say "suicide burn". The picture shows this lesson's example: the blue block is the bang-bang burn, the gray outline the gentle constant-thrust descent. The area of each is its impulse.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 185" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="150" x2="330" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="150" x2="40" y2="45" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="91.4" y="60" width="42.3" height="90" fill="#1d6fd1" opacity="0.85"/>
  <rect x="40" y="116.8" width="280" height="33.2" fill="none" stroke="#6c7a93" stroke-width="2" stroke-dasharray="5 3"/>
  <text x="112.5" y="54" font-size="11" text-anchor="middle" fill="#1d6fd1">181 m/s</text>
  <text x="230" y="110" font-size="11" text-anchor="middle" fill="#6c7a93">gentle: 442 m/s</text>
  <text x="34" y="64" font-size="11" text-anchor="end" fill="#1f2a44">30</text>
  <text x="34" y="154" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <text x="91.4" y="166" font-size="11" text-anchor="middle" fill="#1f2a44">7.3</text>
  <text x="133.7" y="166" font-size="11" text-anchor="middle" fill="#1f2a44">13.4</text>
  <text x="320" y="166" font-size="11" text-anchor="middle" fill="#1f2a44">40</text>
  <text x="185" y="180" font-size="11" text-anchor="middle" fill="#1f2a44">time (s)</text>
  <text x="46" y="40" font-size="11" fill="#1f2a44">thrust accel. (m/s²)</text>
</svg>
```
:::

::: context qp-touch Where a circle touches a square
Take the simplest QP: find the point of the square closest to a point outside it. The cost's level sets are circles around that outside point. Grow a circle until it first touches the square — the touching point is on an edge, not at a corner.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <rect x="40" y="70" width="100" height="100" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="190" cy="110" r="25" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <circle cx="190" cy="110" r="50" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="190" cy="110" r="3.5" fill="#1f2a44"/>
  <circle cx="140" cy="110" r="5" fill="#b4232c"/>
  <text x="198" y="106" font-size="11" fill="#1f2a44">unconstrained best</text>
  <text x="134" y="98" font-size="11" text-anchor="end" fill="#b4232c">touch point</text>
  <text x="90" y="186" font-size="11" text-anchor="middle" fill="#1f2a44">feasible square</text>
</svg>
```

Compare the LP picture, where the optimum landed on a corner. With a quadratic cost the answer slides along the edge to whatever point is closest, so it changes smoothly as the data change.
:::

::: context kkt-saddle Why the KKT matrix is indefinite
The KKT system does not describe a bowl; it describes a saddle. The $\mathbf{x}$ part wants to go *down* the objective, while the multiplier part $\boldsymbol{\nu}$ wants to go *up* — it is hunting for the best lower bound, as in lesson 4's dual function. A matrix for a saddle has some positive and some negative eigenvalues. That matters in practice: the fast Cholesky factorization only works on positive definite matrices, so solvers use an $\mathbf{L}\mathbf{D}\mathbf{L}^\top$ factorization built for this shape.
:::

::: context control-allocation Sharing work among thrusters
A spacecraft often has more thrusters than it needs — say twelve small jets to make three torques. The flight computer must choose twelve firing levels that produce exactly the requested torque: $\mathbf{F}\mathbf{x} = \mathbf{g}$ with more unknowns than equations, so infinitely many answers. The minimum-norm answer spreads the load as evenly as possible. When jets also have limits, the problem gains inequalities and becomes an LP or QP, solved every control cycle.
:::

::: context mpc Model-predictive control
**Model-predictive control** plans ahead, then keeps only the first step. Each cycle it solves a QP over the next few seconds, with the vehicle's model and actuator limits built in, applies the first control, measures where it actually is, and solves again. Oil refineries and chemical plants have used it since the late 1970s; today it also steers cars and robots and is being flown on spacecraft. It works in flight only because QP solvers are fast and predictable — which is the subject of lesson 13.
:::
