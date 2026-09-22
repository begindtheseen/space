---
id: l05-linear-and-quadratic-programming
title: Linear and quadratic programming
minutes: 27
covers:
  - linear and quadratic programming
---

The last two lessons established what convexity buys. This lesson and the next two name the convex problem classes that solvers actually accept. A solver does not take "a convex function"; it takes a problem written in one of a handful of standard forms, and the engineer's job is to fit the physics into one of them. The two oldest and most widely used forms are the **linear program** (LP) and the **quadratic program** (QP).

Both are everywhere in guidance and control. A minimum-fuel landing with constant mass and a thrust magnitude that can be treated as one-dimensional is an LP, and its solution has the coast-then-burn shape that every lander flies. A finite-horizon linear-quadratic regulator is an equality-constrained QP, and adding actuator limits to it produces the inequality-constrained QP that a model-predictive controller solves every cycle. Least-squares estimation, control allocation among redundant thrusters, and the reference-trajectory smoothing that runs before a guidance solve are all one or the other.

The two classes also teach two different pieces of geometry. An LP's optimum sits at a corner of the feasible region, which is why a linear cost produces switching, saturated controls. A QP's optimum can sit anywhere, including in the interior, which is why a quadratic cost produces smooth ones. Knowing which behaviour you want is often the reason to choose one class over the other.

## Linear programs

> A **linear program** is the minimisation of a linear function over a polyhedron: $\text{minimise } \mathbf{c}^\top\mathbf{x}$ subject to $\mathbf{A}\mathbf{x} \le \mathbf{b}$ and $\mathbf{F}\mathbf{x} = \mathbf{g}$, with the inequality read component-wise.

Here $\mathbf{x} \in \mathbb{R}^n$ is the decision variable, $\mathbf{c} \in \mathbb{R}^n$ the cost vector, $\mathbf{A} \in \mathbb{R}^{m \times n}$ and $\mathbf{b} \in \mathbb{R}^m$ the inequality data, $\mathbf{F} \in \mathbb{R}^{p \times n}$ and $\mathbf{g} \in \mathbb{R}^p$ the equality data. An LP is convex: the objective is affine (hence convex), each inequality is a halfspace, each equality is a hyperplane, and the feasible set is their intersection – a polyhedron. Everything from lesson 4 applies: any local minimum is global, KKT is necessary and sufficient, and a solver returns a certificate.

Several equivalent forms circulate, and you should be able to move between them without thought.

- **Maximisation** becomes minimisation of $-\mathbf{c}^\top\mathbf{x}$.
- An inequality $\mathbf{a}^\top\mathbf{x} \le b$ becomes an equality plus a nonnegative **slack**: $\mathbf{a}^\top\mathbf{x} + s = b$, $s \ge 0$. Applied to every row, this converts the inequality form into the **standard form** $\text{minimise } \mathbf{c}^\top\mathbf{x}$ s.t. $\mathbf{A}\mathbf{x} = \mathbf{b}$, $\mathbf{x} \ge \mathbf{0}$, which is what the simplex method works on.
- A **free variable** (no sign constraint) is split as $x = x^+ - x^-$ with $x^+, x^- \ge 0$.
- An **absolute value** in the objective, $\text{minimise } |x|$, is not linear, but $\text{minimise } t$ s.t. $-t \le x \le t$ is an LP with the same optimum, because at the optimum $t$ is pushed down to $|x|$. The same trick turns $\|\mathbf{x}\|_1 = \sum_i |x_i|$ and $\|\mathbf{x}\|_\infty = \max_i |x_i|$ into LPs, so a "minimise total thruster on-time" or "minimise the largest torque" cost is linear-programmable.

### The optimum is at a vertex

The distinguishing geometry of an LP is where its solution lives. The level sets of $\mathbf{c}^\top\mathbf{x}$ are parallel hyperplanes, and the feasible set is a polyhedron with flat faces. Push the level set in the direction $-\mathbf{c}$ until it is about to leave the polyhedron; the last contact is, generically, at a single corner.

The argument is worth having in words, because it is the root of the bang-bang result below. Take any feasible point $\mathbf{x}$ that is not a vertex. Then there is a direction $\mathbf{d}$ along which you can move both ways, $\mathbf{x} \pm \epsilon\mathbf{d}$, staying feasible – that is what it means not to be at a corner. Along that line the objective $\mathbf{c}^\top(\mathbf{x} + t\mathbf{d}) = \mathbf{c}^\top\mathbf{x} + t\,\mathbf{c}^\top\mathbf{d}$ is affine in $t$: either constant, or strictly decreasing in one of the two directions. If it decreases, $\mathbf{x}$ was not optimal. If it is constant, slide along the line until a new constraint becomes active, and repeat with one more active constraint. On a bounded polyhedron this process ends at a vertex with objective no worse than where you started. Hence:

::: key Vertex optimality of linear programs
If a linear program has a bounded feasible set, then it has an optimal solution at a **vertex** – a point where $n$ linearly independent constraints are active. The optimal set is a face of the polyhedron; a unique optimum is a vertex, and a non-unique optimum is an edge or a higher-dimensional face whose corners are all optimal.
:::

A vertex in $\mathbb{R}^n$ has at least $n$ active constraints. If $p$ of them are equalities, at least $n - p$ inequalities are active. Keep that count in mind; it is the whole content of the bang-bang theorem.

Two algorithms exploit the vertex structure in different ways. The **simplex method** walks from vertex to adjacent vertex, always decreasing the objective, and stops when no neighbour is better. It is exact and fast in practice, but the number of vertices can grow exponentially with $n$ (a box in $\mathbb{R}^n$ has $2^n$ of them) and pathological examples make simplex visit a large fraction of them, so it has no polynomial worst-case bound. **Interior-point methods**, the subject of lesson 9, travel through the interior of the polyhedron and converge to the optimal face in a number of iterations that is bounded polynomially and is in practice a few tens. Landing guidance uses the second kind for exactly that reason.

::: example Splitting a burn between two engines
A stage has two engines that must deliver a combined thrust of at least $50\,\mathrm{kN}$ for the current burn. Engine 1 is less efficient and costs $1.2$ units of propellant per kN·s; engine 2 costs $1.0$. Each engine can produce at most $30\,\mathrm{kN}$. Minimise propellant per second:

$$
\text{minimise } 1.2\,T_1 + 1.0\,T_2 \quad \text{s.t.} \quad T_1 + T_2 \ge 50, \quad 0 \le T_1 \le 30, \quad 0 \le T_2 \le 30 .
$$

The feasible set is the part of the $30 \times 30$ box above the line $T_1 + T_2 = 50$: a triangle with vertices $(20, 30)$, $(30, 20)$ and $(30, 30)$. Evaluate the objective at each: $1.2 \times 20 + 30 = 54$, $1.2 \times 30 + 20 = 56$, and $36 + 30 = 66$. The optimum is the vertex $(20, 30)$: run the efficient engine at its limit and make up the rest with the other. Two constraints are active there, $T_1 + T_2 = 50$ and $T_2 = 30$, and $n = 2$, as vertex optimality requires.

The multipliers confirm the picture. Stationarity in $T_2$ reads $1.0 - \lambda_{\text{sum}} + \lambda_{T_2} = 0$ and in $T_1$ reads $1.2 - \lambda_{\text{sum}} = 0$ (the bounds on $T_1$ are inactive), so $\lambda_{\text{sum}} = 1.2$ and $\lambda_{T_2} = 0.2$. Both are nonnegative, so KKT holds and, the problem being convex, $(20, 30)$ is globally optimal. The shadow prices say that one more kN of required thrust costs $1.2$ (it must come from engine 1), and that raising engine 2's ceiling by one kN would save $0.2$ (swapping a kN from engine 1 to engine 2). No solver was needed – but with two hundred thrust variables instead of two, vertex enumeration is hopeless and the solver is the only way.
:::

## Bang-bang thrust: a linear cost over a box

Now the landing. Discretise a vertical descent into $N$ steps of length $\Delta t$ with altitude $h_k$, velocity $v_k$ (positive upward) and thrust acceleration $T_k$ (thrust force divided by a mass taken as constant for now). With explicit Euler dynamics and constant gravity $g$ the problem is

$$
\begin{aligned}
\text{minimise}\quad & \sum_{k=0}^{N-1} T_k\,\Delta t \\
\text{subject to}\quad & h_{k+1} = h_k + v_k\,\Delta t, \qquad v_{k+1} = v_k + (T_k - g)\,\Delta t, \\
& h_0, v_0 \text{ given}, \qquad h_N = 0, \quad v_N = 0, \\
& 0 \le T_k \le T_{\max}, \qquad h_k \ge 0 .
\end{aligned}
$$

Every constraint is affine in the unknowns $(h_k, v_k, T_k)$ and the objective is linear: an LP with $3N + 2$ variables, $2N + 4$ equalities and $3N + 1$ inequalities. For $N = 200$ that is $602$ variables, $404$ equalities and $601$ inequalities.

Because the dynamics are linear, the states can be eliminated: each $h_k$ and $v_k$ is an affine function of the thrust history. What remains is a problem in the $N$ thrust variables alone, with two equality constraints (the terminal altitude and velocity), $2N$ box bounds, and $N + 1$ altitude inequalities that are inactive unless the vehicle grazes the ground. Suppose the altitude constraints are inactive. At a vertex of the remaining polyhedron, at least $N$ constraints are active, two of which are the equalities, so **at least $N - 2$ of the thrust variables sit on a bound** – at $0$ or at $T_{\max}$. At most two steps can take an intermediate value, and those are the two on which the switch from coasting to full thrust happens to fall. That is the bang-bang profile: coast, then burn at full thrust. If the altitude constraint becomes active at some steps, each such step can add one more intermediate thrust value (a hover), but the count stays small.

The KKT conditions say the same thing with the multipliers doing the talking. Give the velocity dynamics at step $k$ the multiplier $\nu_k$ and the two bounds on $T_k$ the multipliers $\lambda_k^{\text{lo}} \ge 0$ and $\lambda_k^{\text{hi}} \ge 0$. Stationarity in $T_k$ is

$$
\Delta t - \nu_k\,\Delta t - \lambda_k^{\text{lo}} + \lambda_k^{\text{hi}} = 0 .
$$

Define the **switching function** $S_k = 1 - \nu_k$. If $S_k > 0$, the equation needs $\lambda_k^{\text{lo}} > 0$, so by complementary slackness the lower bound is active: $T_k = 0$. If $S_k < 0$, it needs $\lambda_k^{\text{hi}} > 0$ and $T_k = T_{\max}$. The control is decided entirely by the sign of a multiplier, and it switches when that multiplier passes through zero. If $S_k = 0$ over a run of steps, stationarity says nothing about $T_k$ and the profile can take intermediate values there: a **singular arc**. Singular arcs are the exception; the hover against the altitude floor is one.

::: key Why a minimum-fuel problem with linear cost is bang-bang
The optimum of a linear objective over a polytope lies at a vertex, so the control sits at a bound almost everywhere and switches when the multiplier (the switching function) changes sign. Singular arcs are the exception.
:::

::: warning With constant mass and a fixed final time, the LP cost is constant
Sum the velocity equations from $0$ to $N$: $v_N = v_0 + \sum_k T_k\,\Delta t - N g\,\Delta t$. With $v_N = 0$ this forces $\sum_k T_k\,\Delta t = -v_0 + g\,t_f$ where $t_f = N\Delta t$: the total impulse is fixed by the boundary conditions, and every feasible thrust history has the same cost. The LP is then a feasibility problem with a flat objective; a bang-bang profile is *an* optimum, but so is every other feasible profile, and an interior-point solver will return a point in the middle of the optimal face rather than a corner. What the fuel objective genuinely selects is the **final time**: the impulse $-v_0 + g\,t_f$ is the velocity to be removed plus the gravity loss $g\,t_f$, and the shortest feasible $t_f$ is the one with the least gravity loss. That shortest-time solution is the bang-bang one, and once mass varies with propellant use (next lesson) the late burn is cheaper for a second reason: each metre per second costs less propellant when the vehicle is lighter.
:::

::: example The coast-then-burn landing
Take $h_0 = 1000\,\mathrm{m}$, $v_0 = -50\,\mathrm{m/s}$, $g = 9.80665\,\mathrm{m/s^2}$ and $T_{\max} = 30\,\mathrm{m/s^2}$, and find the fastest landing – which by the argument above is the minimum-fuel one. It coasts for a time $t_1$, then burns at $T_{\max}$ with net upward acceleration $a = T_{\max} - g = 20.19\,\mathrm{m/s^2}$ until it stops exactly at the ground.

At the end of the coast, $v_1 = v_0 - g t_1$ and $h_1 = h_0 + v_0 t_1 - \tfrac{1}{2} g t_1^2$. A full-thrust burn from speed $v_1$ needs a stopping distance $v_1^2 / (2a)$, so the ignition altitude must satisfy $h_1 = v_1^2/(2a)$. Substituting and collecting terms in $t_1$ gives a quadratic, $(g^2 + ag)\,t_1^2 - 2v_0(g + a)\,t_1 + (v_0^2 - 2ah_0) = 0$, whose positive root is $t_1 = 7.34\,\mathrm{s}$. At ignition $v_1 = -122.0\,\mathrm{m/s}$ and $h_1 = 368.6\,\mathrm{m}$; the burn lasts $t_b = -v_1/a = 6.04\,\mathrm{s}$; touchdown is at $t_f = 13.38\,\mathrm{s}$.

Total impulse: $T_{\max}\,t_b = 181.3\,\mathrm{m/s}$, of which $122.0$ is the velocity to be removed and $g\,t_b = 59.2$ is gravity loss. Compare a gentle constant-thrust descent from the start, which needs $T = g + v_0^2/(2h_0) = 11.06\,\mathrm{m/s^2}$ for $40\,\mathrm{s}$: impulse $442\,\mathrm{m/s}$. The bang-bang profile saves $261\,\mathrm{m/s}$ of impulse, about $59\,\%$, by not fighting gravity for $27$ extra seconds. This is the physics behind the "suicide burn": every second spent hovering or throttled back costs $g$ of impulse for nothing.

In the discretised LP with $N = 200$ steps over $t_f = 13.38\,\mathrm{s}$, the profile would be $T_k = 0$ for the first $110$ steps and $T_k = 30$ for the last $90$, with at most two steps in between at intermediate values where the switch falls inside a step.
:::

What changes with a minimum throttle? If the engine, once lit, must run between $T_{\min}$ and $T_{\max}$ and can never be off, the box is $[T_{\min}, T_{\max}]$ and the same argument gives a profile that switches between the two limits. If the engine may be either off or between $T_{\min}$ and $T_{\max}$, the feasible set for each $T_k$ is $\{0\} \cup [T_{\min}, T_{\max}]$ – two disjoint pieces, not convex – and the LP theory no longer applies. That is the minimum-throttle problem of lesson 3, and the next lesson resolves it.

## Quadratic programs

> A **quadratic program** is $\text{minimise } \tfrac{1}{2}\mathbf{x}^\top\mathbf{P}\mathbf{x} + \mathbf{q}^\top\mathbf{x}$ subject to $\mathbf{A}\mathbf{x} \le \mathbf{b}$ and $\mathbf{F}\mathbf{x} = \mathbf{g}$, with $\mathbf{P} = \mathbf{P}^\top$.

The constraints are the LP's; only the objective has changed. The QP is **convex** exactly when $\mathbf{P} \succeq 0$, since the Hessian of the objective is $\mathbf{P}$. With $\mathbf{P} \succ 0$ the objective is strictly convex and the minimiser is unique. With $\mathbf{P} = \mathbf{0}$ the QP is an LP. With $\mathbf{P}$ indefinite the problem is nonconvex and, in general, NP-hard – the word "quadratic" alone promises nothing.

The geometry is different from the LP's. The level sets of a strictly convex quadratic are ellipsoids centred on the unconstrained minimiser $-\mathbf{P}^{-1}\mathbf{q}$. If that point is feasible, it is the answer and no constraint is active. If not, the solution is where the smallest ellipsoid touches the feasible polyhedron, and that touching point is on a face but almost never at a vertex. Quadratic costs therefore produce controls that vary smoothly and saturate only when they must, which is why tracking controllers and estimators use them.

### The equality-constrained QP is a linear system

With only equality constraints the QP is solved in one linear solve. The Lagrangian is $\mathcal{L} = \tfrac{1}{2}\mathbf{x}^\top\mathbf{P}\mathbf{x} + \mathbf{q}^\top\mathbf{x} + \boldsymbol{\nu}^\top(\mathbf{F}\mathbf{x} - \mathbf{g})$, and the KKT conditions – stationarity $\mathbf{P}\mathbf{x} + \mathbf{q} + \mathbf{F}^\top\boldsymbol{\nu} = \mathbf{0}$ and feasibility $\mathbf{F}\mathbf{x} = \mathbf{g}$ – stack into

$$
\begin{bmatrix} \mathbf{P} & \mathbf{F}^\top \\ \mathbf{F} & \mathbf{0} \end{bmatrix}
\begin{bmatrix} \mathbf{x} \\ \boldsymbol{\nu} \end{bmatrix}
=
\begin{bmatrix} -\mathbf{q} \\ \mathbf{g} \end{bmatrix} .
$$

This is the **KKT matrix**. It is symmetric but indefinite (it has negative eigenvalues from the zero block), and it is nonsingular when $\mathbf{F}$ has full row rank and $\mathbf{P}$ is positive definite on the null space of $\mathbf{F}$. Because the problem is convex, the solution of this system is the global minimiser – KKT is sufficient. Every interior-point and SQP iteration in the coming lessons solves a system of exactly this shape, so it is worth knowing well.

When $\mathbf{P} = \mathbf{I}$ there is a closed form. Stationarity gives $\mathbf{x} = -\mathbf{q} - \mathbf{F}^\top\boldsymbol{\nu}$; substituting into $\mathbf{F}\mathbf{x} = \mathbf{g}$ gives $\mathbf{F}\mathbf{F}^\top\boldsymbol{\nu} = -\mathbf{F}\mathbf{q} - \mathbf{g}$, a $p \times p$ system for the multipliers, after which $\mathbf{x}$ follows. For $\mathbf{q} = \mathbf{0}$ this is the **minimum-norm solution** $\mathbf{x} = \mathbf{F}^\top(\mathbf{F}\mathbf{F}^\top)^{-1}\mathbf{g}$ of the underdetermined system $\mathbf{F}\mathbf{x} = \mathbf{g}$, the workhorse of control allocation.

::: example A minimum-energy descent in four steps
A vehicle at altitude $10\,\mathrm{m}$ and rest must reach the ground at rest in $N = 4$ steps of $\Delta t = 1\,\mathrm{s}$, using the smallest control energy $\sum_k u_k^2$, where $u_k$ is the net acceleration (thrust minus gravity) held constant over step $k$. Exact integration over a step gives $v_{k+1} = v_k + u_k\Delta t$ and $h_{k+1} = h_k + v_k\Delta t + \tfrac{1}{2}u_k\Delta t^2$. Eliminate the states: the terminal velocity is $v_4 = \sum_k u_k = 0$, and the terminal altitude is $h_4 = 10 + \sum_k u_k\,(N - k - \tfrac{1}{2}) = 0$, since an acceleration applied in step $k$ acts on the position for the remaining $N - k - \tfrac{1}{2}$ seconds on average. The QP is

$$
\text{minimise } \tfrac{1}{2}\|\mathbf{u}\|_2^2 \quad \text{s.t.} \quad
\mathbf{F}\mathbf{u} = \mathbf{g}, \qquad
\mathbf{F} = \begin{bmatrix} 1 & 1 & 1 & 1 \\ 3.5 & 2.5 & 1.5 & 0.5 \end{bmatrix}, \quad
\mathbf{g} = \begin{bmatrix} 0 \\ -10 \end{bmatrix} .
$$

Here $\mathbf{P} = \mathbf{I}$ and $\mathbf{q} = \mathbf{0}$, so $\mathbf{F}\mathbf{F}^\top\boldsymbol{\nu} = -\mathbf{g}$. Compute $\mathbf{F}\mathbf{F}^\top = \begin{bmatrix} 4 & 8 \\ 8 & 21 \end{bmatrix}$ (row sums of squares: $1+1+1+1 = 4$, $3.5^2 + 2.5^2 + 1.5^2 + 0.5^2 = 21$, cross term $3.5 + 2.5 + 1.5 + 0.5 = 8$). Solving $\begin{bmatrix} 4 & 8 \\ 8 & 21 \end{bmatrix}\boldsymbol{\nu} = \begin{bmatrix} 0 \\ 10 \end{bmatrix}$: the determinant is $84 - 64 = 20$, so $\boldsymbol{\nu} = \tfrac{1}{20}\begin{bmatrix} 21 & -8 \\ -8 & 4 \end{bmatrix}\begin{bmatrix} 0 \\ 10 \end{bmatrix} = (-4, 2)$. Then $\mathbf{u} = -\mathbf{F}^\top\boldsymbol{\nu}$ gives $u_k = 4 - 2(N - k - \tfrac{1}{2})$, i.e.

$$
\mathbf{u} = (-3, -1, 1, 3)\ \mathrm{m/s^2}, \qquad \sum_k u_k^2 = 20\ \mathrm{m^2/s^4}.
$$

Check the trajectory: $(h, v)$ runs $(10, 0) \to (8.5, -3) \to (5, -4) \to (1.5, -3) \to (0, 0)$. The control is a straight line in time – decelerate, then brake – with no saturation anywhere, the signature of a quadratic cost. The multipliers are the sensitivities of lesson 2: $\nu_2 = 2$ says that lowering the target altitude by one more metre (making $g_2 = -11$) would raise the optimal cost $\tfrac{1}{2}\|\mathbf{u}\|^2$ by about $2$; the exact value at $-10.1$ is $10.201$ against a first-order prediction of $10.2$.

Contrast the LP version of the same problem: with a linear cost the control would sit at a bound for all but at most two steps. Same dynamics, same boundary conditions, and a completely different control shape, decided by the objective alone.
:::

### Inequalities: active sets and the return of case analysis

Add inequality constraints and the QP can no longer be solved in one linear solve, because you do not know in advance which inequalities are active. Two families of algorithm handle this. **Active-set methods** do what lesson 2 did by hand: guess an active set, solve the equality-constrained QP with those constraints as equalities, check the multipliers and the inactive constraints, and add or drop one constraint per iteration. Each iteration is a KKT solve (cheap when warm-started from the previous active set), the method terminates finitely, and it excels when the active set changes little from one solve to the next – the situation of a controller re-solving a slightly changed problem every cycle. Its weakness is the worst case: the number of iterations is not bounded by anything better than the number of possible active sets. **Interior-point methods** solve the QP as they solve an LP, in a bounded number of Newton steps that barely depends on the data, and are the choice when a bound is needed. A third family, operator splitting (the ADMM behind OSQP), trades accuracy for very cheap iterations and is the subject of the modelling lesson.

The LQR problem is the canonical QP. For a linear system $\mathbf{x}_{k+1} = \mathbf{A}_d\mathbf{x}_k + \mathbf{B}_d\mathbf{u}_k$ and cost $\sum_k \mathbf{x}_k^\top\mathbf{Q}\mathbf{x}_k + \mathbf{u}_k^\top\mathbf{R}\mathbf{u}_k$ with $\mathbf{Q} \succeq 0$ and $\mathbf{R} \succ 0$, stacking the states and controls over the horizon gives a QP whose only constraints are the dynamics; eliminating the states gives an unconstrained strictly convex quadratic in the controls, and its solution is the Riccati recursion of the control module. Add $\|\mathbf{u}_k\|_\infty \le u_{\max}$ and the same problem is a constrained QP that no recursion solves, and you are doing model-predictive control.

::: key Distinguishing LP, QP and SOCP
LP: linear objective and linear constraints. QP: convex quadratic objective ($\mathbf{P} \succeq 0$), linear constraints. SOCP (next lesson): linear objective with second-order cone constraints – strictly more general than both. An LP's optimum is at a vertex of the feasible polyhedron; a QP's optimum is where the smallest level ellipsoid touches it, generally not a vertex.
:::

::: warning A quadratic objective is not automatically convex
$\tfrac{1}{2}\mathbf{x}^\top\mathbf{P}\mathbf{x}$ is convex only if $\mathbf{P} \succeq 0$. A cost like $x_1 x_2$ has $\mathbf{P} = \begin{bmatrix} 0 & 1 \\ 1 & 0 \end{bmatrix}$ with eigenvalues $\pm 1$, and the resulting "QP" has no finite minimum over $\mathbb{R}^2$ and multiple local minima over a box. Solvers for convex QP check $\mathbf{P} \succeq 0$ (or require you to supply a factor $\mathbf{P} = \mathbf{L}\mathbf{L}^\top$) precisely because a symmetric matrix with one negative eigenvalue turns a bounded-iteration problem into an NP-hard one. When a QP comes from a least-squares residual $\|\mathbf{M}\mathbf{x} - \mathbf{y}\|_2^2$, then $\mathbf{P} = 2\mathbf{M}^\top\mathbf{M} \succeq 0$ automatically; when someone hands you a $\mathbf{P}$ by other means, check its eigenvalues.
:::

## Check yourself

::: check
Write $\text{minimise } \|\mathbf{x}\|_\infty$ subject to $\mathbf{F}\mathbf{x} = \mathbf{g}$ as a linear program. How many variables and inequality constraints does it have if $\mathbf{x} \in \mathbb{R}^n$?
:::

::: answer
Introduce one scalar $t$ and require $-t \le x_i \le t$ for every $i$: $\text{minimise } t$ s.t. $\mathbf{F}\mathbf{x} = \mathbf{g}$, $x_i \le t$, $-x_i \le t$. At the optimum $t = \max_i |x_i| = \|\mathbf{x}\|_\infty$, because $t$ is only pushed down until it meets the largest component. It has $n + 1$ variables and $2n$ inequality constraints. Minimising $\|\mathbf{x}\|_1$ instead needs $n$ auxiliary variables $t_i$ with $-t_i \le x_i \le t_i$ and objective $\sum_i t_i$: $2n$ variables and $2n$ inequalities.
:::

::: check
A linear program in $\mathbb{R}^{50}$ has $3$ equality constraints and $100$ inequality constraints (upper and lower bounds on each variable). At a vertex, at least how many variables are at a bound? How does this relate to bang-bang control?
:::

::: answer
A vertex has at least $n = 50$ linearly independent active constraints. Three can be equalities, so at least $47$ of the active constraints are bounds, and a variable can have only one of its two bounds active at once, so at least $47$ of the $50$ variables sit at a bound. At most $3$ take intermediate values. For a thrust history this says the profile is saturated at all but at most three steps – bang-bang with at most three transition steps, the number of equality constraints (terminal conditions) setting the budget for intermediate values.
:::

::: check
In the two-engine example, the required thrust rises from $50$ to $58\,\mathrm{kN}$. Using the shadow price, predict the new optimal cost, then verify by finding the new optimal vertex. Where does the prediction break down?
:::

::: answer
The shadow price of the thrust requirement is $\lambda_{\text{sum}} = 1.2$, so the predicted cost is $54 + 1.2 \times 8 = 63.6$. The new optimum keeps engine 2 at $30$ and raises engine 1 to $28$: cost $1.2 \times 28 + 30 = 63.6$, exactly as predicted, because the active set has not changed. The prediction breaks down beyond $60\,\mathrm{kN}$, where engine 1 also hits its ceiling: at $60$ the cost is $66$, and above $60$ the problem is infeasible. The shadow price is exact only while the same constraints stay active; it is a local derivative.
:::

::: check
For the equality-constrained QP $\text{minimise } \tfrac{1}{2}\mathbf{x}^\top\mathbf{P}\mathbf{x} + \mathbf{q}^\top\mathbf{x}$ s.t. $\mathbf{F}\mathbf{x} = \mathbf{g}$, with $\mathbf{P} \succ 0$, derive the multipliers in closed form.
:::

::: answer
Stationarity gives $\mathbf{x} = -\mathbf{P}^{-1}(\mathbf{q} + \mathbf{F}^\top\boldsymbol{\nu})$. Substituting into $\mathbf{F}\mathbf{x} = \mathbf{g}$: $-\mathbf{F}\mathbf{P}^{-1}\mathbf{q} - \mathbf{F}\mathbf{P}^{-1}\mathbf{F}^\top\boldsymbol{\nu} = \mathbf{g}$, so $\boldsymbol{\nu} = -(\mathbf{F}\mathbf{P}^{-1}\mathbf{F}^\top)^{-1}(\mathbf{g} + \mathbf{F}\mathbf{P}^{-1}\mathbf{q})$. The matrix $\mathbf{F}\mathbf{P}^{-1}\mathbf{F}^\top$ is $p \times p$ and positive definite when $\mathbf{F}$ has full row rank, so the multipliers are unique. With $\mathbf{P} = \mathbf{I}$ and $\mathbf{q} = \mathbf{0}$ this reduces to $\boldsymbol{\nu} = -(\mathbf{F}\mathbf{F}^\top)^{-1}\mathbf{g}$, which is what the four-step example used.
:::

::: check
A colleague proposes minimising $\sum_k T_k^2\,\Delta t$ instead of $\sum_k T_k\,\Delta t$ for the landing LP "because the QP is smoother to solve". What will the thrust profile look like, and is it fuel-optimal?
:::

::: answer
The quadratic cost penalises large thrust values disproportionately, so its optimum spreads the deceleration over the whole horizon at moderate values instead of concentrating it in a short full-thrust burn – a smooth profile with little or no saturation, as in the four-step example. It is not fuel-optimal: propellant is proportional to the integral of thrust, not thrust squared, and a spread-out burn extends the time spent supporting the vehicle against gravity. With free final time, the quadratic cost would also not push toward the shortest horizon. The QP is well-conditioned and pleasant, but it answers a different question. If smoothness is wanted for structural or control reasons it should be added as a constraint (a rate limit on $T_k$) to the linear-cost problem, not substituted for the objective.
:::

## Summary

| Object | Statement |
| --- | --- |
| LP | $\text{minimise } \mathbf{c}^\top\mathbf{x}$ s.t. $\mathbf{A}\mathbf{x} \le \mathbf{b}$, $\mathbf{F}\mathbf{x} = \mathbf{g}$; feasible set a polyhedron |
| Standard form | $\mathbf{A}\mathbf{x} = \mathbf{b}$, $\mathbf{x} \ge \mathbf{0}$, reached by slacks and splitting free variables |
| Norm tricks | $|x| \le t$ as $-t \le x \le t$; $\|\cdot\|_1$ and $\|\cdot\|_\infty$ objectives become LPs |
| Vertex optimality | A bounded LP has an optimal vertex: $n$ linearly independent active constraints, at least $n - p$ of them inequalities |
| Bang-bang | With $p$ terminal equalities, at most $p$ thrust values are off their bounds; switching function $S_k = 1 - \nu_k$ decides $0$ or $T_{\max}$ |
| Fixed-time degeneracy | Constant mass and fixed $t_f$ give $\sum_k T_k\Delta t = -v_0 + g\,t_f$: the LP cost is flat; fuel optimality selects the shortest $t_f$ |
| Coast-then-burn example | $t_1 = 7.34\,\mathrm{s}$, $h_1 = 369\,\mathrm{m}$, $t_b = 6.04\,\mathrm{s}$, impulse $181\,\mathrm{m/s}$ vs $442$ for a gentle descent |
| QP | $\text{minimise } \tfrac{1}{2}\mathbf{x}^\top\mathbf{P}\mathbf{x} + \mathbf{q}^\top\mathbf{x}$ over a polyhedron; convex iff $\mathbf{P} \succeq 0$ |
| KKT system | $\begin{bmatrix} \mathbf{P} & \mathbf{F}^\top \\ \mathbf{F} & \mathbf{0} \end{bmatrix}\begin{bmatrix} \mathbf{x} \\ \boldsymbol{\nu} \end{bmatrix} = \begin{bmatrix} -\mathbf{q} \\ \mathbf{g} \end{bmatrix}$; one linear solve for an equality-constrained QP |
| Minimum norm | $\mathbf{x} = \mathbf{F}^\top(\mathbf{F}\mathbf{F}^\top)^{-1}\mathbf{g}$ |
| Algorithms | Simplex and active-set: vertex walks, finite but no polynomial bound; interior-point: bounded iterations |

The next lesson adds the constraint that neither LP nor QP can express – a bound on the Euclidean norm of a vector – and with it the second-order cone program, the form in which three-dimensional landing guidance is actually solved.
