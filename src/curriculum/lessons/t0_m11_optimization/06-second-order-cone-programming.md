---
id: l06-second-order-cone-programming
title: Second-order cone programming and the convex landing problem
minutes: 30
covers:
  - second-order cone programming
---

The thrust of a landing rocket is a vector. Its magnitude is bounded by the engine, its direction is bounded by how far the vehicle may tilt, and the position of the vehicle is bounded by a cone above the pad. None of these constraints is linear, so none fits an LP or a QP. All three are bounds on a Euclidean norm, and the problem class built around exactly that constraint is the **second-order cone program** (SOCP).

This is the lesson the module has been heading toward. Powered-descent guidance – the algorithm that decides, in flight, where to point the engine and how hard to burn – is solved onboard as an SOCP. Getting it into that form took two ideas from the 2000s that are now standard: a relaxation of the minimum-throttle constraint that turns out to lose nothing, and a change of variables that makes the mass-varying dynamics linear. Both are derived here, with the physics visible at every step.

By the end you should be able to take the constraints of a landing – thrust bounds, pointing, glide slope, dynamics, boundary conditions – and write each one as a second-order cone constraint in standard form, which is the module's second objective and the input format of every solver in the last lessons.

## The second-order cone

The **second-order cone** in $\mathbb{R}^{n+1}$ is

$$
\mathcal{K}^{n+1} = \{(\mathbf{x}, t) \in \mathbb{R}^n \times \mathbb{R} : \|\mathbf{x}\|_2 \le t\} .
$$

Lesson 3 showed it is convex: it is the epigraph of the norm, and norms are convex. In $\mathbb{R}^3$ it is the solid ice-cream cone with apex at the origin, axis along $t$ and a $45^\circ$ half-angle. Any set of the form $\|\mathbf{A}\mathbf{x} + \mathbf{b}\|_2 \le \mathbf{c}^\top\mathbf{x} + d$ is the preimage of $\mathcal{K}$ under the affine map $\mathbf{x} \mapsto (\mathbf{A}\mathbf{x} + \mathbf{b},\ \mathbf{c}^\top\mathbf{x} + d)$, hence convex. That is the **second-order cone constraint**, and it is more expressive than it looks.

- With $\mathbf{A} = \mathbf{0}$ and $\mathbf{b} = \mathbf{0}$ it says $0 \le \mathbf{c}^\top\mathbf{x} + d$: a **linear inequality**. Every LP constraint is a degenerate cone constraint.
- With $\mathbf{c} = \mathbf{0}$ it says $\|\mathbf{A}\mathbf{x} + \mathbf{b}\|_2 \le d$: a **norm ball** – the thrust magnitude bound.
- With $\mathbf{A}$ selecting some components and $\mathbf{c}$ another, it says those components are small compared with this one: a **cone about an axis** – the glide slope and the pointing limit.
- A **convex quadratic** inequality $\|\mathbf{y}\|_2^2 \le s$ is a cone constraint in disguise. Expand both sides of $\|(2\mathbf{y},\ 1 - s)\|_2 \le 1 + s$: the left squared is $4\|\mathbf{y}\|^2 + 1 - 2s + s^2$, the right squared is $1 + 2s + s^2$, and the inequality between them reduces to $4\|\mathbf{y}\|^2 \le 4s$, i.e. $\|\mathbf{y}\|_2^2 \le s$. (The right side $1 + s$ is automatically nonnegative when $s \ge \|\mathbf{y}\|^2 \ge 0$.) So

$$
\|\mathbf{y}\|_2^2 \le s \quad\Longleftrightarrow\quad \left\| \begin{bmatrix} 2\mathbf{y} \\ 1 - s \end{bmatrix} \right\|_2 \le 1 + s .
$$

The last item is how a QP becomes an SOCP. Write $\mathbf{P} = \mathbf{L}\mathbf{L}^\top$ (a Cholesky factor, which exists because $\mathbf{P} \succeq 0$), introduce a scalar $t$ for the quadratic part, and replace $\text{minimise } \tfrac{1}{2}\mathbf{x}^\top\mathbf{P}\mathbf{x} + \mathbf{q}^\top\mathbf{x}$ by $\text{minimise } t + \mathbf{q}^\top\mathbf{x}$ subject to $\|\mathbf{L}^\top\mathbf{x}\|_2^2 \le 2t$. At the optimum $t$ is pushed down to $\tfrac{1}{2}\|\mathbf{L}^\top\mathbf{x}\|^2 = \tfrac{1}{2}\mathbf{x}^\top\mathbf{P}\mathbf{x}$, so nothing has changed, and the constraint is the cone $\|(2\mathbf{L}^\top\mathbf{x},\ 1 - 2t)\|_2 \le 1 + 2t$.

## Standard form

> A **second-order cone program** is: minimise $\mathbf{c}^\top\mathbf{x}$ subject to $\|\mathbf{A}_i\mathbf{x} + \mathbf{b}_i\|_2 \le \mathbf{c}_i^\top\mathbf{x} + d_i$ for $i = 1, \dots, m$, and $\mathbf{F}\mathbf{x} = \mathbf{g}$.

The objective is linear – any convex objective you want is moved into the constraints with an epigraph variable, as the QP was. Each cone constraint has its own data $(\mathbf{A}_i, \mathbf{b}_i, \mathbf{c}_i, d_i)$ with $\mathbf{A}_i \in \mathbb{R}^{n_i \times n}$, and lives in a cone of dimension $n_i + 1$. The equalities are affine. A solver reads the problem as a list of cones, a matrix $\mathbf{F}$ and vectors, and nothing else; there is no "function" to evaluate.

::: key Second-order cone programming standard form
Minimise $\mathbf{c}^\top\mathbf{x}$ subject to $\|\mathbf{A}_i\mathbf{x} + \mathbf{b}_i\|_2 \le \mathbf{c}_i^\top\mathbf{x} + d_i$ for each $i$, and $\mathbf{F}\mathbf{x} = \mathbf{g}$. LP and QP are both special cases: an LP constraint has $\mathbf{A}_i = \mathbf{0}$, and a convex quadratic objective becomes a cone constraint through $\|\mathbf{y}\|^2 \le s \Leftrightarrow \|(2\mathbf{y}, 1-s)\|_2 \le 1 + s$.
:::

::: example The three landing cones in standard form
A lander has position $\mathbf{r} = (r_x, r_y, r_z)$ with $r_z$ the altitude above the pad at the origin, and commands a thrust acceleration $\mathbf{u} = (u_x, u_y, u_z)$. Write each constraint as $\|\mathbf{A}\mathbf{x} + \mathbf{b}\|_2 \le \mathbf{c}^\top\mathbf{x} + d$, taking $\mathbf{x}$ to be the relevant 3-vector.

**Thrust magnitude**, $\|\mathbf{u}\|_2 \le u_{\max}$ with $u_{\max} = 12.0\,\mathrm{m/s^2}$: $\mathbf{A} = \mathbf{I}_3$, $\mathbf{b} = \mathbf{0}$, $\mathbf{c} = \mathbf{0}$, $d = 12.0$. A cone of dimension $4$.

**Glide slope**, stay within a cone of half-angle $\gamma = 4^\circ$ about the vertical through the pad: $\sqrt{r_x^2 + r_y^2} \le r_z \tan\gamma$. With $\mathbf{E} = \begin{bmatrix} 1 & 0 & 0 \\ 0 & 1 & 0 \end{bmatrix}$ this is $\|\mathbf{E}\mathbf{r}\|_2 \le (0, 0, \tan\gamma)^\top\mathbf{r}$, so $\mathbf{A} = \mathbf{E}$, $\mathbf{b} = \mathbf{0}$, $\mathbf{c} = (0, 0, 0.0699)$, $d = 0$; the cone has dimension $3$. At $r_z = 100\,\mathrm{m}$ the allowed horizontal offset is $6.99\,\mathrm{m}$, at $10\,\mathrm{m}$ it is $0.70\,\mathrm{m}$. The constraint also implies $r_z \ge 0$, since the right-hand side of a cone constraint is never negative.

**Pointing**, thrust within $\theta = 45^\circ$ of vertical: $\|\mathbf{u}\|_2 \cos\theta \le u_z$, i.e. $\|\mathbf{u}\|_2 \le u_z / \cos\theta$. So $\mathbf{A} = \mathbf{I}_3$, $\mathbf{b} = \mathbf{0}$, $\mathbf{c} = (0, 0, 1/\cos 45^\circ) = (0, 0, 1.414)$, $d = 0$. Dimension $4$.

Applied at each of $N$ time steps these produce $3N$ (or $3N + 1$, with the glide slope at the final node too) small cones, one per constraint per step. A solver treats them independently in the cone projection and jointly in the linear algebra, and the dimension of each is what sets the cost of the projection – four, here, for all of them.
:::

## The landing problem, honestly stated

Now assemble the whole problem. A lander of mass $m$ at position $\mathbf{r}$ and velocity $\mathbf{v}$ produces thrust force $\mathbf{T}$ from an engine with specific impulse $I_{sp}$. The equations of motion in a pad-fixed frame with constant gravity $\mathbf{g}$ are

$$
\dot{\mathbf{r}} = \mathbf{v}, \qquad \dot{\mathbf{v}} = \frac{\mathbf{T}}{m} + \mathbf{g}, \qquad \dot m = -\alpha\,\|\mathbf{T}\|_2, \qquad \alpha = \frac{1}{I_{sp}\,g_0},
$$

where $\alpha$ is the propellant consumed per unit impulse (units $\mathrm{s/m}$, or kilograms per newton-second). The engine has a throttle range $\rho_1 \le \|\mathbf{T}\|_2 \le \rho_2$ with $\rho_1 > 0$ – a liquid engine cannot run below a minimum and cannot be relit at will. Add the pointing and glide-slope cones, initial conditions $\mathbf{r}(0), \mathbf{v}(0), m(0)$, terminal conditions $\mathbf{r}(t_f) = \mathbf{0}$, $\mathbf{v}(t_f) = \mathbf{0}$, and the objective: land with the most propellant left, that is maximise $m(t_f)$, equivalently minimise $\int_0^{t_f}\|\mathbf{T}\|_2\,dt$.

Two things stand between this and an SOCP, and lesson 3 named both.

1. The **lower throttle bound** $\|\mathbf{T}\|_2 \ge \rho_1$ is nonconvex: it excludes a ball around the origin, and the midpoint of two opposing feasible thrusts is the infeasible zero vector.
2. The **dynamics** $\dot{\mathbf{v}} = \mathbf{T}/m$ are a nonlinear equality constraint, because thrust is divided by a mass that is itself an unknown. Nonlinear equalities are always nonconvex.

The rest of the lesson removes each obstacle in turn. The treatment follows the formulation of Açıkmeşe and Ploen (2007), now called lossless convexification, that was later flown as G-FOLD.

## Obstacle 1: lossless convexification of the throttle bound

Introduce a scalar slack variable $\Gamma(t)$ and replace the throttle constraint by

$$
\|\mathbf{T}\|_2 \le \Gamma, \qquad \rho_1 \le \Gamma \le \rho_2 ,
$$

replace $\|\mathbf{T}\|_2$ by $\Gamma$ in the mass equation, $\dot m = -\alpha\Gamma$, and in the objective, $\text{minimise } \int_0^{t_f}\Gamma\,dt$. Every constraint is now convex: $\|\mathbf{T}\|_2 \le \Gamma$ is a second-order cone in $(\mathbf{T}, \Gamma)$, and $\rho_1 \le \Gamma \le \rho_2$ is a slab. The original nonconvex set $\{\mathbf{T} : \rho_1 \le \|\mathbf{T}\| \le \rho_2\}$ has been replaced by the convex set $\{(\mathbf{T}, \Gamma) : \|\mathbf{T}\| \le \Gamma,\ \rho_1 \le \Gamma \le \rho_2\}$ in one more dimension – a cone sliced between two planes. Its projection onto $\mathbf{T}$ is the full ball $\|\mathbf{T}\| \le \rho_2$, so the relaxation has, on its face, thrown away the lower bound.

A **relaxation** is a problem whose feasible set contains the original's. Its optimal value can only be lower or equal, and its solution is useful only if it happens to be feasible for the original problem. The claim of lossless convexification is that here it always is: at the optimum of the relaxed problem, $\|\mathbf{T}(t)\|_2 = \Gamma(t)$ for (almost) all $t$, so the thrust magnitude satisfies $\rho_1 \le \|\mathbf{T}\| \le \rho_2$ after all, and the relaxed optimum *is* the original optimum. Nothing is lost – hence the name.

Half of the reason is elementary. Suppose at some time $\|\mathbf{T}\| < \Gamma$ and $\Gamma > \rho_1$. Then $\Gamma$ can be reduced toward $\|\mathbf{T}\|$ without violating anything, and since $\Gamma$ enters the objective with a positive weight (and reduces mass loss), the cost goes down. So at an optimum either $\|\mathbf{T}\| = \Gamma$, or $\Gamma$ is pinned at $\rho_1$ with $\|\mathbf{T}\| < \rho_1$ – the engine below its minimum, which is the case that would break the argument.

The other half is where the theorem lives. Apply the minimum principle of optimal control to the relaxed problem: at each instant the optimal $\mathbf{T}$ minimises a Hamiltonian that is *linear* in $\mathbf{T}$ (with coefficient the velocity costate $\boldsymbol{\lambda}_v(t)$, the multiplier on the velocity dynamics) over the ball $\|\mathbf{T}\| \le \Gamma$. A linear function over a ball is minimised on the boundary, at $\mathbf{T} = -\Gamma\,\boldsymbol{\lambda}_v/\|\boldsymbol{\lambda}_v\|$, *unless* the coefficient $\boldsymbol{\lambda}_v$ is zero. The costate obeys a linear differential equation, so if it vanished on an interval it would vanish identically, and the transversality conditions together with a controllability condition on the linearised dynamics rule that out. Hence $\|\mathbf{T}\| = \Gamma$ except possibly at isolated instants, and the relaxation is exact. The hypotheses – that the system is controllable and that the problem is not degenerate in a stated technical sense – hold for a lander with three-axis thrust and a finite horizon, which is why the result is usable in practice.

::: key Lossless convexification of the minimum-throttle constraint
Introduce a slack $\Gamma$ with $\|\mathbf{u}\|_2 \le \Gamma$ and $u_{\min} \le \Gamma \le u_{\max}$. The relaxed problem is an SOCP, and under stated controllability conditions its optimum provably satisfies $\|\mathbf{u}\| = \Gamma$, so the relaxation is exact (Açıkmeşe and Ploen). The nonconvex annulus in $\mathbf{u}$ has been replaced by a convex cone slice in $(\mathbf{u}, \Gamma)$ whose optimum lies on the cone's surface.
:::

::: warning Not every relaxation is lossless
Dropping a nonconvex constraint always gives a convex relaxation; almost never does the relaxed optimum satisfy the dropped constraint. What makes the throttle case special is that the slack $\Gamma$ appears in the cost with the right sign and the thrust appears linearly in the Hamiltonian, so the optimiser has an incentive to sit on the cone. If you relax a keep-out zone $\|\mathbf{r} - \mathbf{p}\| \ge R$ by deleting it, the optimal trajectory will happily fly through $\mathbf{p}$. Convexify by *reformulation* when a theorem says you can, and by *conservative approximation* (a halfspace instead of the keep-out ball) when it does not.
:::

## Obstacle 2: making the dynamics linear

The thrust-to-mass ratio is the problem, so make it the variable. Define

$$
\mathbf{u} = \frac{\mathbf{T}}{m}, \qquad \sigma = \frac{\Gamma}{m}, \qquad z = \ln m .
$$

The velocity equation becomes $\dot{\mathbf{v}} = \mathbf{u} + \mathbf{g}$ – affine in the new unknowns, with no mass in sight. The mass equation: $\dot z = \dot m / m = -\alpha\Gamma/m = -\alpha\sigma$, also affine. Integrating, $z(t_f) = z(0) - \alpha\int_0^{t_f}\sigma\,dt$, so maximising the final mass (equivalently $z(t_f)$) is the same as minimising $\int_0^{t_f}\sigma\,dt$, a linear objective. The thrust cone $\|\mathbf{T}\| \le \Gamma$ divides through by $m > 0$ to give $\|\mathbf{u}\|_2 \le \sigma$, still a second-order cone. The pointing constraint divides through likewise. The glide slope never involved mass.

Only the throttle slab has been disturbed. Dividing $\rho_1 \le \Gamma \le \rho_2$ by $m = e^{z}$ gives

$$
\rho_1 e^{-z} \le \sigma \le \rho_2 e^{-z} .
$$

The function $e^{-z}$ is convex. The lower inequality, $\sigma \ge \rho_1 e^{-z}$, is the epigraph of a convex function and so defines a convex set; the upper inequality, $\sigma \le \rho_2 e^{-z}$, is the region *below* a convex function and does not. Two approximations, both about a reference mass history $z_0(t)$ (for instance the mass if the engine ran at full throttle from ignition, which bounds the true mass from below), fix this.

For the upper bound, use the tangent line: since a convex function lies above its tangents, $e^{-z} \ge e^{-z_0}\big(1 - (z - z_0)\big)$, and therefore the linear constraint

$$
\sigma \le \rho_2\,e^{-z_0}\big(1 - (z - z_0)\big)
$$

implies the true one. It is conservative – it forbids some thrust levels the engine could produce – and the error is second order in $z - z_0$.

For the lower bound, keep one more Taylor term to stay close to the exponential:

$$
\sigma \ge \rho_1\,e^{-z_0}\Big(1 - (z - z_0) + \tfrac{1}{2}(z - z_0)^2\Big).
$$

This is a convex quadratic inequality in $(\sigma, z)$ – rearranged, $\tfrac{1}{2}\rho_1 e^{-z_0}(z - z_0)^2 \le \sigma - \rho_1 e^{-z_0}(1 - (z - z_0))$, a squared affine expression bounded by an affine expression – and the epigraph trick of the first section turns it into a second-order cone. Since the mass only decreases, $z - z_0 \le 0$, and for a nonpositive argument the second-order Taylor polynomial of the exponential lies slightly *below* the exponential, so this constraint is very slightly looser than the true one. The violation is third order in $z - z_0$ and negligible against the throttle margin, as the example shows; it is an honest approximation, not a lossless one.

After discretising time into $N$ steps – the state $(\mathbf{r}, \mathbf{v}, z)$ at $N + 1$ nodes and the control $(\mathbf{u}, \sigma)$ held constant over each step, with the linear dynamics integrated exactly into affine update equations – every constraint is a second-order cone or an affine equality and the objective is linear. The landing problem is an SOCP.

::: example Throttle bounds for a 2-tonne lander
A lander of initial mass $m_0 = 2000\,\mathrm{kg}$ has an engine of $24\,\mathrm{kN}$ maximum thrust, throttleable down to $40\,\%$, with $I_{sp} = 311\,\mathrm{s}$. Then $\rho_1 = 9.6\,\mathrm{kN}$, $\rho_2 = 24\,\mathrm{kN}$, and $\alpha = 1/(311 \times 9.80665) = 3.28 \times 10^{-4}\,\mathrm{s/m}$, so full throttle burns $\alpha\rho_2 = 7.87\,\mathrm{kg/s}$. At ignition the acceleration bounds are $\rho_1/m_0 = 4.80$ and $\rho_2/m_0 = 12.0\,\mathrm{m/s^2}$, i.e. $0.49\,g_0$ to $1.22\,g_0$; hovering at $m_0$ needs $m_0 g_0/\rho_2 = 81.7\,\%$ throttle, so the vehicle can hover but only just, and it cannot hover at minimum throttle.

Linearise about $z_0 = \ln 2000 = 7.601$ and evaluate the bounds after $200\,\mathrm{kg}$ have burned, $m = 1800\,\mathrm{kg}$, $z - z_0 = \ln(1800/2000) = -0.1054$.

Upper bound. Exact: $\rho_2/m = 24000/1800 = 13.33\,\mathrm{m/s^2}$. Linearised: $12.0 \times (1 + 0.1054) = 13.26\,\mathrm{m/s^2}$. The linear constraint is tighter by $0.5\,\%$ – conservative, as promised, and the engine could deliver slightly more than the solver is allowed to ask for.

Lower bound. Exact: $\rho_1/m = 5.333\,\mathrm{m/s^2}$. Quadratic: $4.80 \times (1 + 0.1054 + \tfrac{1}{2}\times 0.1054^2) = 4.80 \times 1.1109 = 5.3324\,\mathrm{m/s^2}$. The approximate bound is looser by $0.018\,\%$, about $1\,\mathrm{mm/s^2}$ – the solver might command a throttle a hair below $40\,\%$, which any engine's throttle margin absorbs. Over a longer burn the gap grows as $|z - z_0|^3$; at $m = 1500\,\mathrm{kg}$ ($z - z_0 = -0.288$) it is still only $0.3\,\%$.
:::

::: example Sizing the discretised SOCP
Discretise a $60\,\mathrm{s}$ descent into $N = 100$ steps. Each of the $N + 1 = 101$ nodes carries a state $(\mathbf{r}, \mathbf{v}, z)$ of $7$ numbers; each of the $100$ steps carries a control $(\mathbf{u}, \sigma)$ of $4$. That is $707 + 400 = 1107$ variables. The dynamics give $7$ affine equalities per step, $700$ in total, plus $13$ boundary conditions (position, velocity and mass at the start; position and velocity at the end) – $713$ equality rows. The cones: a thrust cone $\|\mathbf{u}_k\| \le \sigma_k$ of dimension $4$ at each step ($100$), a pointing cone of dimension $4$ at each step ($100$), a glide-slope cone of dimension $3$ at each node ($101$), and the quadratic lower-throttle constraint as a cone at each step ($100$): $401$ second-order cones, none larger than dimension $4$, plus $100$ linear upper-throttle inequalities. The objective is $\sum_k \sigma_k\,\Delta t$, or equivalently $-z_N$.

This is a small problem by desktop standards and a large one for a flight computer; lesson 12 counts what it costs per iteration. Note what is *not* a variable: the final time $t_f$. Time appears in the discretisation, not as an unknown, because a free $t_f$ multiplies the controls and destroys linearity. Practice solves the SOCP for several values of $t_f$ and picks the best – an outer one-dimensional search in which every inner problem is convex, which keeps the guarantees intact.
:::

::: note Two problems, not one
The flown formulation solves two SOCPs in sequence. The first minimises the distance between the landing point and the target, subject to all constraints, and finds out whether the target can be reached at all; if it cannot, it returns the closest reachable point. The second minimises propellant subject to landing at least as close as the first found possible. Both are SOCPs with the same constraint structure, so the second is a small change of data to the first, and the certificates of lesson 4 apply to each.
:::

## Check yourself

::: check
Write the constraint "the horizontal velocity must not exceed $5\,\mathrm{m/s}$ when the altitude is below $20\,\mathrm{m}$" for a single time step at which the altitude is known to be below $20\,\mathrm{m}$, as a second-order cone constraint in standard form.
:::

::: answer
With $\mathbf{v} = (v_x, v_y, v_z)$ and $\mathbf{E}$ the matrix that selects the first two components, the constraint is $\|\mathbf{E}\mathbf{v}\|_2 \le 5$: $\mathbf{A} = \mathbf{E}$ ($2 \times 3$), $\mathbf{b} = \mathbf{0}$, $\mathbf{c} = \mathbf{0}$, $d = 5$. It is a cone of dimension $3$ with a constant right-hand side, i.e. a disc in the horizontal velocity plane. The condition "when the altitude is below 20 m" is not itself convex-representable as a logical implication; in practice you decide at design time which nodes are in the terminal phase and impose the disc there.
:::

::: check
Explain, in two sentences, why introducing $\Gamma$ enlarges the feasible set and why the enlargement does not change the optimum.
:::

::: answer
The projection of $\{(\mathbf{T}, \Gamma) : \|\mathbf{T}\| \le \Gamma,\ \rho_1 \le \Gamma \le \rho_2\}$ onto $\mathbf{T}$ is the whole ball $\|\mathbf{T}\| \le \rho_2$, so thrusts below $\rho_1$, forbidden originally, are now allowed – a strict enlargement. But $\Gamma$ is paid for in the objective, so it is driven down to $\|\mathbf{T}\|$ wherever possible, and the minimum principle forces the optimal thrust onto the surface $\|\mathbf{T}\| = \Gamma$ except at isolated instants; the added points are never chosen, so the optimum is unchanged.
:::

::: check
The change of variables sets $\mathbf{u} = \mathbf{T}/m$. Why does the same trick fail for a vehicle whose thrust is a fixed magnitude but whose *direction* is the only control, and what does that say about which nonconvexities the SOCP can absorb?
:::

::: answer
Fixed magnitude means $\|\mathbf{T}\| = \rho$, an equality on a norm, and dividing by $m$ gives $\|\mathbf{u}\| = \rho e^{-z}$: an equality constraint that is not affine, hence nonconvex, and no slack can relax it losslessly, because the argument that drives $\Gamma$ down to $\|\mathbf{T}\|$ needs the freedom to move $\|\mathbf{T}\|$ upward as well. The SOCP absorbs a nonconvexity only when it can be written as a convex set in a lifted space whose optimum lands back on the original set; an equality on a norm has no interior to lift into. Such vehicles are handled by nonconvex methods (lesson 10) or successive convexification.
:::

::: check
Convert $\text{minimise } \|\mathbf{M}\mathbf{x} - \mathbf{y}\|_2^2 + \lambda\|\mathbf{x}\|_1$ (a regularised least-squares problem) to SOCP standard form. How many cone constraints and auxiliary variables are needed for $\mathbf{x} \in \mathbb{R}^n$?
:::

::: answer
Introduce $s$ for the squared residual and $t_i$ for each $|x_i|$: minimise $s + \lambda\sum_i t_i$ subject to $\|\mathbf{M}\mathbf{x} - \mathbf{y}\|_2^2 \le s$ and $-t_i \le x_i \le t_i$. The squared norm becomes the cone $\|(2(\mathbf{M}\mathbf{x} - \mathbf{y}),\ 1 - s)\|_2 \le 1 + s$, one cone of dimension $\dim\mathbf{y} + 2$; the absolute values are $2n$ linear inequalities (degenerate cones). Total: $n + 1$ auxiliary variables, one genuine cone and $2n$ linear inequalities. Since the objective is linear in $(s, \mathbf{t})$ and minimised, both sets of auxiliaries are tight at the optimum.
:::

::: check
In the $2$-tonne example, suppose the reference $z_0$ is instead taken at $m = 1800\,\mathrm{kg}$, midway through the burn. What happens to the sign of the errors in the two throttle approximations at $m = 2000\,\mathrm{kg}$ and at $m = 1600\,\mathrm{kg}$?
:::

::: answer
The tangent-line upper bound lies below the convex function $e^{-z}$ on both sides of $z_0$, so it stays conservative whether $z$ is above or below $z_0$: at both $2000$ and $1600\,\mathrm{kg}$ the linearised maximum acceleration is less than the true one. The quadratic lower bound changes character: for $z - z_0 > 0$ (at $2000\,\mathrm{kg}$, before the reference) the second-order Taylor polynomial of $e^{-z}$ lies *above* the exponential, so the approximate lower bound is slightly tighter than the truth (conservative); for $z - z_0 < 0$ (at $1600\,\mathrm{kg}$) it lies below, so the bound is slightly loose, as in the lesson. Centring the reference on the burn halves the worst-case $|z - z_0|$ and hence cuts the cubic error by about a factor of eight, at the price of a bound that is loose on one side.
:::

## Summary

| Object | Statement |
| --- | --- |
| Second-order cone | $\mathcal{K} = \{(\mathbf{x}, t) : \|\mathbf{x}\|_2 \le t\}$; convex; $45^\circ$ half-angle |
| Cone constraint | $\|\mathbf{A}\mathbf{x} + \mathbf{b}\|_2 \le \mathbf{c}^\top\mathbf{x} + d$; affine preimage of $\mathcal{K}$ |
| SOCP standard form | Minimise $\mathbf{c}^\top\mathbf{x}$ s.t. $\|\mathbf{A}_i\mathbf{x} + \mathbf{b}_i\|_2 \le \mathbf{c}_i^\top\mathbf{x} + d_i$, $\mathbf{F}\mathbf{x} = \mathbf{g}$ |
| Quadratic as cone | $\|\mathbf{y}\|^2 \le s \Leftrightarrow \|(2\mathbf{y}, 1 - s)\|_2 \le 1 + s$; LP and QP are SOCPs |
| Landing cones | Thrust $\|\mathbf{u}\| \le \sigma$; pointing $\|\mathbf{u}\| \le u_z/\cos\theta$; glide slope $\|\mathbf{E}\mathbf{r}\| \le r_z\tan\gamma$ |
| Lossless convexification | Slack $\Gamma$: $\|\mathbf{T}\| \le \Gamma$, $\rho_1 \le \Gamma \le \rho_2$; optimum has $\|\mathbf{T}\| = \Gamma$ (Açıkmeşe and Ploen) |
| Change of variables | $\mathbf{u} = \mathbf{T}/m$, $\sigma = \Gamma/m$, $z = \ln m$: $\dot{\mathbf{v}} = \mathbf{u} + \mathbf{g}$, $\dot z = -\alpha\sigma$, cost $\int\sigma\,dt$ |
| Throttle in new variables | $\rho_1 e^{-z} \le \sigma \le \rho_2 e^{-z}$; upper bound linearised (conservative), lower bound quadratic (cone) |
| Example lander | $\rho_1 = 9.6$, $\rho_2 = 24\,\mathrm{kN}$, $\alpha = 3.28 \times 10^{-4}\,\mathrm{s/m}$; errors $-0.5\,\%$ and $+0.02\,\%$ after $200\,\mathrm{kg}$ burned |
| Size at $N = 100$ | $1107$ variables, $713$ equalities, $401$ cones of dimension $\le 4$ |
| Final time | Not a convex variable; outer line search over $t_f$ |

The next lesson develops duality, which supplies the certificates promised in lesson 4 and the language in which a conic solver reports its progress. The lesson after it climbs one more rung – the semidefinite program, in which the cone is the set of positive semidefinite matrices – and shows where SOCP sits in the hierarchy of conic problems. Then interior-point methods give the algorithm that solves the SOCP built here.
