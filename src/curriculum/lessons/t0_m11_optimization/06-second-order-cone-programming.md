---
id: l06-second-order-cone-programming
title: Second-order cone programming and the convex landing problem
minutes: 24
covers:
  - second-order cone programming
---

Point a flashlight straight up in a dark room. Its beam fills a cone. A rocket coming down to land lives inside cones like that. Its thrust is a vector — an arrow with a length and a direction. The engine limits the arrow's length. The vehicle may only tilt so far, which keeps the arrow inside a cone around vertical. And the vehicle itself must stay inside a cone of air that opens upward from the pad, like that beam, so it never skims across the ground.

None of these constraints is linear, so none fits an LP or a QP. But all three are limits on the length of a vector, and one problem class is built around exactly that: the **second-order cone program** (SOCP).

This is the lesson the module has been heading toward. **[[Powered-descent guidance|spacex-cvxgen]]** — the algorithm that decides, in flight, where to point the engine and how hard to burn — is solved onboard as an SOCP. Getting it into that form took two ideas from the 2000s that are now standard: a relaxation of the minimum-throttle limit that turns out to lose nothing, and a change of variables that makes the changing-mass dynamics linear. Both are derived here, with the physics visible at every step. By the end you should be able to write every constraint of a landing — thrust limits, pointing, glide slope, dynamics, start and end conditions — in second-order cone standard form, the input format of every solver in the last lessons.

## The second-order cone

The length of a vector $\mathbf{x}$ is its **Euclidean norm** $\|\mathbf{x}\|_2 = \sqrt{x_1^2 + \dots + x_n^2}$, read "the two-norm of x" — Pythagoras in $n$ dimensions. The **[[second-order cone|cone-name]]** in $\mathbb{R}^{n+1}$ collects every vector paired with a number at least as big as its length:

$$
\mathcal{K}^{n+1} = \{(\mathbf{x}, t) \in \mathbb{R}^n \times \mathbb{R} : \|\mathbf{x}\|_2 \le t\} .
$$

Lesson 3 showed it is convex: it is the **[[epigraph|epigraph-word]]** of the norm (the region on or above its graph), and norms are convex. In $\mathbb{R}^3$ it is a solid **[[ice-cream cone|ice-cream-cone]]**: tip at the origin, axis along $t$, sides at $45^\circ$ to the axis.

Now stretch, shift and tilt it. Any set of the form

$$
\|\mathbf{A}\mathbf{x} + \mathbf{b}\|_2 \le \mathbf{c}^\top\mathbf{x} + d
$$

is what you get by feeding $\mathbf{x}$ through the affine map $\mathbf{x} \mapsto (\mathbf{A}\mathbf{x} + \mathbf{b},\ \mathbf{c}^\top\mathbf{x} + d)$ and asking that the result land in $\mathcal{K}$. Pulling a convex set back through an affine map keeps it convex. That is the **second-order cone constraint**, and it can say more than it looks:

- With $\mathbf{A} = \mathbf{0}$ and $\mathbf{b} = \mathbf{0}$ it says $0 \le \mathbf{c}^\top\mathbf{x} + d$: a **linear inequality**. Every LP constraint is a squashed-flat cone constraint.
- With $\mathbf{c} = \mathbf{0}$ it says $\|\mathbf{A}\mathbf{x} + \mathbf{b}\|_2 \le d$: a **norm ball** — the thrust magnitude limit.
- With $\mathbf{A}$ picking out some components and $\mathbf{c}$ another, it says "these components are small compared with that one": a **cone about an axis** — the glide slope and the pointing limit.
- A **convex quadratic** inequality $\|\mathbf{y}\|_2^2 \le s$ is a cone constraint in disguise, shown next.

Here is the disguise. Claim: $\|(2\mathbf{y},\ 1 - s)\|_2 \le 1 + s$ says the same as $\|\mathbf{y}\|_2^2 \le s$. Square both sides. The left becomes $4\|\mathbf{y}\|^2 + (1 - s)^2 = 4\|\mathbf{y}\|^2 + 1 - 2s + s^2$. The right becomes $(1 + s)^2 = 1 + 2s + s^2$. Cancel the $1$ and the $s^2$ from both, and the inequality is $4\|\mathbf{y}\|^2 - 2s \le 2s$, that is $4\|\mathbf{y}\|^2 \le 4s$, that is $\|\mathbf{y}\|_2^2 \le s$. (Squaring is safe because the right side $1 + s$ is nonnegative whenever $s \ge \|\mathbf{y}\|^2 \ge 0$.) So

$$
\|\mathbf{y}\|_2^2 \le s \quad\Longleftrightarrow\quad \left\| \begin{bmatrix} 2\mathbf{y} \\ 1 - s \end{bmatrix} \right\|_2 \le 1 + s .
$$

That is how a QP becomes an SOCP. Write $\mathbf{P} = \mathbf{L}\mathbf{L}^\top$, a **Cholesky factor**, which exists because $\mathbf{P} \succeq 0$. Add a scalar $t$ for the quadratic part. Replace $\text{minimize } \tfrac{1}{2}\mathbf{x}^\top\mathbf{P}\mathbf{x} + \mathbf{q}^\top\mathbf{x}$ by $\text{minimize } t + \mathbf{q}^\top\mathbf{x}$ subject to $\|\mathbf{L}^\top\mathbf{x}\|_2^2 \le 2t$. At the optimum $t$ is pushed down to $\tfrac{1}{2}\|\mathbf{L}^\top\mathbf{x}\|^2 = \tfrac{1}{2}\mathbf{x}^\top\mathbf{P}\mathbf{x}$, so nothing has changed. The constraint is the cone $\|(2\mathbf{L}^\top\mathbf{x},\ 1 - 2t)\|_2 \le 1 + 2t$.

## Standard form

> A **second-order cone program** is: minimize $\mathbf{c}^\top\mathbf{x}$ subject to $\|\mathbf{A}_i\mathbf{x} + \mathbf{b}_i\|_2 \le \mathbf{c}_i^\top\mathbf{x} + d_i$ for $i = 1, \dots, m$, and $\mathbf{F}\mathbf{x} = \mathbf{g}$.

The objective is linear; any other convex objective moves into the constraints with an extra variable, as the QP's did. Each cone constraint has its own data $(\mathbf{A}_i, \mathbf{b}_i, \mathbf{c}_i, d_i)$, with $\mathbf{A}_i \in \mathbb{R}^{n_i \times n}$, and lives in a cone of dimension $n_i + 1$. The equalities are affine. A solver reads only a list of cones, a matrix $\mathbf{F}$ and some vectors — no "function" to evaluate.

::: key Second-order cone programming standard form
Minimize $\mathbf{c}^\top\mathbf{x}$ subject to $\|\mathbf{A}_i\mathbf{x} + \mathbf{b}_i\|_2 \le \mathbf{c}_i^\top\mathbf{x} + d_i$ for each $i$, and $\mathbf{F}\mathbf{x} = \mathbf{g}$. LP and QP are both special cases: an LP constraint has $\mathbf{A}_i = \mathbf{0}$, and a convex quadratic objective becomes a cone constraint through $\|\mathbf{y}\|^2 \le s \Leftrightarrow \|(2\mathbf{y}, 1-s)\|_2 \le 1 + s$.
:::

::: example The three landing cones in standard form
A lander has position $\mathbf{r} = (r_x, r_y, r_z)$, with $r_z$ its altitude above the pad at the origin. It commands a thrust acceleration $\mathbf{u} = (u_x, u_y, u_z)$. Write each constraint as $\|\mathbf{A}\mathbf{x} + \mathbf{b}\|_2 \le \mathbf{c}^\top\mathbf{x} + d$, with $\mathbf{x}$ the relevant 3-vector.

**Thrust magnitude**, $\|\mathbf{u}\|_2 \le u_{\max}$ with $u_{\max} = 12.0\,\mathrm{m/s^2}$. Take $\mathbf{A} = \mathbf{I}_3$ (the identity), $\mathbf{b} = \mathbf{0}$, $\mathbf{c} = \mathbf{0}$, $d = 12.0$. The cone has dimension $4$: three components on the left, one number on the right.

**Glide slope.** Stay inside a cone of half-angle $\gamma = 4^\circ$ ("gamma") around the vertical through the pad: horizontal distance at most altitude times $\tan\gamma$, or $\sqrt{r_x^2 + r_y^2} \le r_z \tan\gamma$. The matrix $\mathbf{E} = \begin{bmatrix} 1 & 0 & 0 \\ 0 & 1 & 0 \end{bmatrix}$ picks out the horizontal part, so this is $\|\mathbf{E}\mathbf{r}\|_2 \le (0, 0, \tan\gamma)^\top\mathbf{r}$. Then $\mathbf{A} = \mathbf{E}$, $\mathbf{b} = \mathbf{0}$, $\mathbf{c} = (0, 0, 0.0699)$, $d = 0$, and the cone has dimension $3$. At $r_z = 100\,\mathrm{m}$ the allowed horizontal offset is $100 \times 0.0699 = 6.99\,\mathrm{m}$; at $10\,\mathrm{m}$ it is $0.70\,\mathrm{m}$. The constraint also forces $r_z \ge 0$, because a length can never be negative.

**Pointing.** Keep the thrust within $\theta = 45^\circ$ ("theta") of vertical. The vertical part of $\mathbf{u}$ must be at least its length times $\cos\theta$: $\|\mathbf{u}\|_2 \cos\theta \le u_z$, or $\|\mathbf{u}\|_2 \le u_z / \cos\theta$. So $\mathbf{A} = \mathbf{I}_3$, $\mathbf{b} = \mathbf{0}$, $\mathbf{c} = (0, 0, 1/\cos 45^\circ) = (0, 0, 1.414)$, $d = 0$. Dimension $4$.

Applied at each of $N$ time steps, these give $3N$ small cones (or $3N + 1$, with the glide slope at the final point too). A solver handles them one at a time in its cone projections and all together in its linear algebra. The dimension of each cone sets the cost of its projection — four at most, here.
:::

## The landing problem, honestly stated

Now assemble the whole problem. A lander of mass $m$, at position $\mathbf{r}$ with velocity $\mathbf{v}$, makes thrust force $\mathbf{T}$ with an engine of **[[specific impulse|isp]]** $I_{sp}$. In a frame fixed to the pad, with constant gravity $\mathbf{g}$, the equations of motion are

$$
\dot{\mathbf{r}} = \mathbf{v}, \qquad \dot{\mathbf{v}} = \frac{\mathbf{T}}{m} + \mathbf{g}, \qquad \dot m = -\alpha\,\|\mathbf{T}\|_2, \qquad \alpha = \frac{1}{I_{sp}\,g_0}.
$$

The dot means "rate of change": $\dot{\mathbf{r}}$ is read "r dot". The constant $\alpha$ ("alpha") is the propellant burned per unit of impulse, in $\mathrm{s/m}$ — kilograms per newton-second.

The engine has a throttle range $\rho_1 \le \|\mathbf{T}\|_2 \le \rho_2$ ("rho one", "rho two"), with $\rho_1 > 0$. A liquid engine cannot run below a minimum, and cannot be relit at will. Add the pointing and glide-slope cones, the starting values $\mathbf{r}(0), \mathbf{v}(0), m(0)$, and the end conditions $\mathbf{r}(t_f) = \mathbf{0}$, $\mathbf{v}(t_f) = \mathbf{0}$. The objective: land with the most propellant left — maximize $m(t_f)$, or equivalently minimize $\int_0^{t_f}\|\mathbf{T}\|_2\,dt$.

Two things stand between this and an SOCP, and lesson 3 named both.

1. The **lower throttle bound** $\|\mathbf{T}\|_2 \ge \rho_1$ is nonconvex. It cuts a ball out of the middle, leaving a **[[hollow shell|thrust-shell]]**, and the midpoint of two opposite allowed thrusts is the forbidden zero vector.
2. The **dynamics** $\dot{\mathbf{v}} = \mathbf{T}/m$ are a nonlinear equality, because thrust is divided by a mass that is itself unknown. A nonlinear equality is always nonconvex.

::: key Thrust bounds: which one is convex
$\|\mathbf{u}\|_2 \le u_{\max}$ is convex — a ball. $\|\mathbf{u}\|_2 \ge u_{\min}$ is not — it is the complement of a ball, and the midpoint of two opposing feasible thrust vectors is the infeasible origin.
:::

The rest of the lesson removes each obstacle in turn, following the formulation of Açıkmeşe and Ploen (2007), now called **lossless convexification**, which was later flown as **[[G-FOLD|gfold]]**.

## Obstacle 1: lossless convexification of the throttle bound

Add a new scalar variable $\Gamma(t)$ ("capital gamma") — a **slack**, an extra knob the optimizer may set. Replace the throttle constraint by

$$
\|\mathbf{T}\|_2 \le \Gamma, \qquad \rho_1 \le \Gamma \le \rho_2 .
$$

Put $\Gamma$ in place of $\|\mathbf{T}\|_2$ in the mass equation, $\dot m = -\alpha\Gamma$, and in the objective, $\text{minimize } \int_0^{t_f}\Gamma\,dt$. Every constraint is now convex. $\|\mathbf{T}\|_2 \le \Gamma$ is a second-order cone in $(\mathbf{T}, \Gamma)$, and $\rho_1 \le \Gamma \le \rho_2$ is a flat slab.

Think of $\Gamma$ as a fuel meter the engine must pay by. You may ask for any thrust up to $\Gamma$, but you are charged for $\Gamma$, not for what you used. The nonconvex hollow shell of allowed thrusts has become a convex **[[cone sliced between two planes|cone-slice]]**, one dimension up. Its shadow on the thrust space (its projection, what you see looking along the $\Gamma$ axis) is the *whole* ball $\|\mathbf{T}\| \le \rho_2$, so on its face the lower bound has been thrown away.

A **relaxation** is a problem whose feasible set contains the original one. Its optimum can only be as good or better, and its answer is useful only if it happens to be feasible for the original. Lossless convexification claims that here it always is. At the optimum of the relaxed problem, $\|\mathbf{T}(t)\|_2 = \Gamma(t)$ for (almost) every $t$. So the thrust satisfies $\rho_1 \le \|\mathbf{T}\| \le \rho_2$ after all, and the relaxed optimum *is* the original optimum. Nothing is lost — hence the name.

Half of the reason is plain economics. Suppose at some moment $\|\mathbf{T}\| < \Gamma$ and $\Gamma > \rho_1$. Then $\Gamma$ can be lowered toward $\|\mathbf{T}\|$ without breaking anything, and since you pay for $\Gamma$ (in the objective and in mass loss), the cost goes down. Nobody pays for fuel they do not use. So at an optimum, either $\|\mathbf{T}\| = \Gamma$, or $\Gamma$ is stuck at $\rho_1$ with $\|\mathbf{T}\| < \rho_1$ — the engine below its minimum. That second case is the one that would break the argument.

::: note Why the second case cannot happen
Apply the **[[minimum principle|minimum-principle]]** of optimal control to the relaxed problem. At each instant, the best $\mathbf{T}$ minimizes a function (the Hamiltonian) that is *linear* in $\mathbf{T}$, with coefficient the velocity **costate** $\boldsymbol{\lambda}_v(t)$ — the multiplier on the velocity dynamics. A linear function over a ball is smallest on the ball's surface, at $\mathbf{T} = -\Gamma\,\boldsymbol{\lambda}_v/\|\boldsymbol{\lambda}_v\|$, *unless* the coefficient $\boldsymbol{\lambda}_v$ is zero. The costate obeys a linear differential equation, so if it were zero on an interval it would be zero everywhere, and the transversality (end-point) conditions together with a controllability condition on the linearized dynamics rule that out. Hence $\|\mathbf{T}\| = \Gamma$ except possibly at isolated instants, and the relaxation is exact. The hypotheses — the system is controllable, and the problem is not degenerate in a stated technical sense — hold for a lander with three-axis thrust and a finite horizon, which is why the result is usable in practice.
:::

::: key Lossless convexification of the minimum-throttle constraint
Introduce a slack $\Gamma$ with $\|\mathbf{u}\|_2 \le \Gamma$ and $u_{\min} \le \Gamma \le u_{\max}$. The relaxed problem is an SOCP, and under stated controllability conditions its optimum provably satisfies $\|\mathbf{u}\| = \Gamma$, so the relaxation is exact (Açıkmeşe and Ploen). The nonconvex annulus in $\mathbf{u}$ has been replaced by a convex cone slice in $(\mathbf{u}, \Gamma)$ whose optimum lies on the cone's surface.
:::

::: warning Not every relaxation is lossless
Dropping a nonconvex constraint always gives a convex relaxation. Almost never does the relaxed optimum obey the dropped constraint. The throttle case is special because the slack $\Gamma$ appears in the cost with the right sign and the thrust appears linearly in the Hamiltonian, so the optimizer has a reason to sit on the cone's surface. Relax a keep-out zone $\|\mathbf{r} - \mathbf{p}\| \ge R$ by deleting it, and the optimal trajectory will happily fly straight through $\mathbf{p}$. Convexify by *reformulation* when a theorem says you can, and by *conservative approximation* (a halfspace instead of the keep-out ball) when it does not.
:::

## Obstacle 2: making the dynamics linear

The trouble is thrust divided by mass. So make that ratio the unknown. Define

$$
\mathbf{u} = \frac{\mathbf{T}}{m}, \qquad \sigma = \frac{\Gamma}{m}, \qquad z = \ln m .
$$

Here $\sigma$ ("sigma") is the slack per unit mass, and $z$ is the **[[natural log of the mass|log-mass]]**. Now watch each piece become linear:

- **Velocity:** $\dot{\mathbf{v}} = \mathbf{u} + \mathbf{g}$ — affine in the new unknowns, with no mass in sight.
- **Mass:** $\dot z = \dot m / m = -\alpha\Gamma/m = -\alpha\sigma$ — also affine.
- **Objective:** integrating, $z(t_f) = z(0) - \alpha\int_0^{t_f}\sigma\,dt$. So maximizing the final mass (or $z(t_f)$) is the same as minimizing $\int_0^{t_f}\sigma\,dt$, a linear objective.
- **Thrust cone:** divide $\|\mathbf{T}\| \le \Gamma$ by $m > 0$ to get $\|\mathbf{u}\|_2 \le \sigma$, still a second-order cone. The pointing cone divides through the same way. The glide slope never involved mass.

Only the throttle slab has been disturbed. Dividing $\rho_1 \le \Gamma \le \rho_2$ by $m = e^{z}$ gives

$$
\rho_1 e^{-z} \le \sigma \le \rho_2 e^{-z} .
$$

The curve $e^{-z}$ is convex (it bends upward). The lower inequality, $\sigma \ge \rho_1 e^{-z}$, is the region *above* a convex curve — a convex set. The upper inequality, $\sigma \le \rho_2 e^{-z}$, is the region *below* a convex curve — not convex. Two **[[approximations|taylor-exp]]** fix this, both taken about a reference log-mass $z_0(t)$.

**Upper bound: the tangent line.** A convex curve lies above every tangent line, so $e^{-z} \ge e^{-z_0}\big(1 - (z - z_0)\big)$. Therefore the linear constraint

$$
\sigma \le \rho_2\,e^{-z_0}\big(1 - (z - z_0)\big)
$$

guarantees the true one. It is **conservative** — it forbids a few thrust levels the engine could really make — and the error is second order in $z - z_0$. This holds whichever side of $z_0$ the true mass is on.

**Lower bound: one more Taylor term.** To stay close to the exponential, keep the squared term:

$$
\sigma \ge \rho_1\,e^{-z_0}\Big(1 - (z - z_0) + \tfrac{1}{2}(z - z_0)^2\Big).
$$

Rearranged, it reads $\tfrac{1}{2}\rho_1 e^{-z_0}(z - z_0)^2 \le \sigma - \rho_1 e^{-z_0}(1 - (z - z_0))$: a squared affine expression bounded by an affine expression. That is a convex quadratic inequality, and the trick from the first section turns it into a second-order cone.

Which way does its small error lean? That depends on the sign of $z - z_0$. The Taylor polynomial $1 - d + \tfrac{1}{2}d^2$ lies slightly *above* $e^{-d}$ when $d > 0$ and slightly *below* it when $d < 0$; the gap is about $|d|^3/6$.

- The flown formulation takes $z_0(t)$ to be the lowest mass the vehicle could possibly have at time $t$: the mass if the engine had run at full throttle since ignition, $z_0(t) = \ln(m_0 - \alpha\rho_2 t)$. The true mass can only be higher, so $z - z_0 \ge 0$ and the quadratic bound is slightly *tighter* than the truth — conservative, like the upper bound.
- A simpler choice is a constant reference at the starting mass, $z_0 = \ln m_0$. The mass only falls, so $z - z_0 \le 0$, and the quadratic bound is very slightly *looser* than the truth. The next example shows this error is tiny.

After cutting time into $N$ steps — the state $(\mathbf{r}, \mathbf{v}, z)$ at $N + 1$ points, the control $(\mathbf{u}, \sigma)$ held constant over each step, the linear dynamics integrated exactly into affine update equations — every constraint is a second-order cone or an affine equality, and the objective is linear. The landing problem is an SOCP.

::: example Throttle bounds for a 2-tonne lander
A lander of starting mass $m_0 = 2000\,\mathrm{kg}$ has an engine of $24\,\mathrm{kN}$ maximum thrust that can throttle down to $40\,\%$, with $I_{sp} = 311\,\mathrm{s}$.

**The engine's numbers.** $\rho_1 = 0.40 \times 24 = 9.6\,\mathrm{kN}$ and $\rho_2 = 24\,\mathrm{kN}$. Then $\alpha = 1/(311 \times 9.80665) = 3.28 \times 10^{-4}\,\mathrm{s/m}$, so full throttle burns $\alpha\rho_2 = 3.28 \times 10^{-4} \times 24\,000 = 7.87\,\mathrm{kg/s}$.

**Acceleration limits at ignition.** $\rho_1/m_0 = 9600/2000 = 4.80\,\mathrm{m/s^2}$ and $\rho_2/m_0 = 24\,000/2000 = 12.0\,\mathrm{m/s^2}$ — that is $0.49\,g_0$ to $1.22\,g_0$. Hovering at $m_0$ needs $m_0 g_0/\rho_2 = 81.7\,\%$ throttle. So the vehicle can hover, but only just, and it cannot hover at minimum throttle.

**Linearize** about the constant reference $z_0 = \ln 2000 = 7.601$. Check the bounds after $200\,\mathrm{kg}$ have burned: $m = 1800\,\mathrm{kg}$, so $z - z_0 = \ln(1800/2000) = -0.1054$.

**Upper bound.** Exact: $\rho_2/m = 24\,000/1800 = 13.33\,\mathrm{m/s^2}$. Linearized: $12.0 \times (1 + 0.1054) = 13.26\,\mathrm{m/s^2}$. The linear version is tighter by $0.5\,\%$ — conservative, as promised. The engine could give slightly more than the solver may ask for.

**Lower bound.** Exact: $\rho_1/m = 9600/1800 = 5.333\,\mathrm{m/s^2}$. Quadratic: $4.80 \times (1 + 0.1054 + \tfrac{1}{2}\times 0.1054^2) = 4.80 \times 1.1109 = 5.3324\,\mathrm{m/s^2}$. Looser by $0.018\,\%$, about $1\,\mathrm{mm/s^2}$. The solver might command a throttle a hair below $40\,\%$, which any engine's throttle margin absorbs.

**Sanity check.** Both approximations sit within a percent of the truth, and the signs match the rule above: $d < 0$, so the quadratic sits below. Over a longer burn the lower-bound gap grows as $|z - z_0|^3$. At $m = 1500\,\mathrm{kg}$ ($z - z_0 = -0.288$) it is still only $0.3\,\%$.
:::

::: example Sizing the discretized SOCP
Cut a $60\,\mathrm{s}$ descent into $N = 100$ steps.

**Variables.** Each of the $N + 1 = 101$ points carries a state $(\mathbf{r}, \mathbf{v}, z)$ of $3 + 3 + 1 = 7$ numbers. Each of the $100$ steps carries a control $(\mathbf{u}, \sigma)$ of $4$. Total: $707 + 400 = 1107$ variables.

**Equalities.** The dynamics give $7$ affine equalities per step, $700$ in all. Add $13$ boundary conditions — position, velocity and mass at the start ($7$), position and velocity at the end ($6$) — for $713$ equality rows.

**Cones.** A thrust cone $\|\mathbf{u}_k\| \le \sigma_k$ of dimension $4$ at each step ($100$). A pointing cone of dimension $4$ at each step ($100$). A glide-slope cone of dimension $3$ at each point ($101$). The quadratic lower-throttle constraint as a cone at each step ($100$). That is $100 + 100 + 101 + 100 = 401$ second-order cones, none bigger than dimension $4$, plus $100$ linear upper-throttle inequalities. The objective is $\sum_k \sigma_k\,\Delta t$, or equivalently $-z_N$.

Small for a desktop, large for a flight computer. Notice what is *not* a variable: the final time $t_f$. Time is built into the discretization, not left as an unknown, because a free $t_f$ would multiply the controls and destroy linearity. In practice the SOCP is solved for several values of $t_f$ and the best is kept — an outer one-dimensional search in which every inner problem is convex, so the guarantees stay intact.
:::

::: note Two problems, not one
The flown formulation solves two SOCPs in a row. The first minimizes the distance between the landing point and the target, subject to all constraints. It finds out whether the target can be reached at all, and if it cannot, it returns the closest reachable point. The second minimizes propellant, subject to landing at least as close as the first found possible. Both have the same constraint structure, so the second is a small change of data to the first, and the certificates of lesson 4 apply to each.
:::

## Check yourself

::: check
Write the constraint "the horizontal velocity must not exceed $5\,\mathrm{m/s}$ when the altitude is below $20\,\mathrm{m}$", for a single time step at which the altitude is known to be below $20\,\mathrm{m}$, as a second-order cone constraint in standard form.
:::

::: answer
Let $\mathbf{v} = (v_x, v_y, v_z)$ and let $\mathbf{E}$ pick out the first two components. The constraint is $\|\mathbf{E}\mathbf{v}\|_2 \le 5$, so $\mathbf{A} = \mathbf{E}$ (a $2 \times 3$ matrix), $\mathbf{b} = \mathbf{0}$, $\mathbf{c} = \mathbf{0}$, $d = 5$. It is a cone of dimension $3$ with a constant right side: a disc in the horizontal velocity plane.

The condition "when the altitude is below 20 m" is not itself a convex constraint — it is an if-then. In practice you decide at design time which time steps belong to the final phase, and impose the disc there.
:::

::: check
Explain, in two sentences, why introducing $\Gamma$ enlarges the feasible set, and why the enlargement does not change the optimum.
:::

::: answer
The shadow of $\{(\mathbf{T}, \Gamma) : \|\mathbf{T}\| \le \Gamma,\ \rho_1 \le \Gamma \le \rho_2\}$ on the thrust space is the whole ball $\|\mathbf{T}\| \le \rho_2$, so thrusts below $\rho_1$, forbidden before, are now allowed — a strict enlargement. But $\Gamma$ is paid for in the objective, so it is driven down to $\|\mathbf{T}\|$ wherever possible, and the minimum principle forces the optimal thrust onto the surface $\|\mathbf{T}\| = \Gamma$ except at isolated instants; the added points are never chosen, so the optimum is unchanged.
:::

::: check
The change of variables sets $\mathbf{u} = \mathbf{T}/m$. Why does the same approach fail for a vehicle whose thrust has a fixed size and only its *direction* can be controlled? What does that say about which nonconvexities an SOCP can absorb?
:::

::: answer
Fixed size means $\|\mathbf{T}\| = \rho$, an equality on a norm. Dividing by $m$ gives $\|\mathbf{u}\| = \rho e^{-z}$: an equality that is not affine, so nonconvex. No slack can relax it losslessly, because the argument that drives $\Gamma$ down to $\|\mathbf{T}\|$ needs the freedom to move $\|\mathbf{T}\|$ as well, and here it is pinned.

An SOCP absorbs a nonconvexity only when it can be written as a convex set in a higher-dimensional space whose optimum lands back on the original set. An equality on a norm is a thin shell with no inside to lift into. Such vehicles are handled by nonconvex methods (lesson 10) or by successive convexification.
:::

::: check
Convert $\text{minimize } \|\mathbf{M}\mathbf{x} - \mathbf{y}\|_2^2 + \lambda\|\mathbf{x}\|_1$ (a regularized least-squares problem) to SOCP standard form. How many cone constraints and extra variables are needed for $\mathbf{x} \in \mathbb{R}^n$?
:::

::: answer
Add $s$ for the squared residual and $t_i$ for each $|x_i|$:

minimize $s + \lambda\sum_i t_i$ subject to $\|\mathbf{M}\mathbf{x} - \mathbf{y}\|_2^2 \le s$ and $-t_i \le x_i \le t_i$.

The squared norm becomes the cone $\|(2(\mathbf{M}\mathbf{x} - \mathbf{y}),\ 1 - s)\|_2 \le 1 + s$, one cone of dimension $\dim\mathbf{y} + 2$. The absolute values are $2n$ linear inequalities (squashed-flat cones).

Total: $n + 1$ extra variables, one genuine cone and $2n$ linear inequalities. The objective is linear in $(s, \mathbf{t})$ and minimized, so all the extra variables are pushed tight at the optimum.
:::

::: check
In the 2-tonne example, suppose the reference $z_0$ is instead taken at $m = 1800\,\mathrm{kg}$, midway through the burn. What happens to the sign of the errors in the two throttle approximations at $m = 2000\,\mathrm{kg}$ and at $m = 1600\,\mathrm{kg}$?
:::

::: answer
The tangent-line upper bound lies below the convex curve $e^{-z}$ on both sides of $z_0$. So it stays conservative whether $z$ is above or below $z_0$: at both $2000$ and $1600\,\mathrm{kg}$ the linearized maximum acceleration is less than the true one.

The quadratic lower bound changes character. At $2000\,\mathrm{kg}$, before the reference, $z - z_0 > 0$ and the Taylor polynomial lies *above* the exponential: the approximate lower bound is slightly tighter than the truth (conservative). At $1600\,\mathrm{kg}$, $z - z_0 < 0$ and it lies below: slightly loose, as in the lesson's example.

Centering the reference on the burn roughly halves the worst $|z - z_0|$, and so cuts the cubic error by about a factor of eight — at the price of a bound that is loose on one side.
:::

## Summary

| Object | Statement |
| --- | --- |
| Second-order cone | $\mathcal{K} = \{(\mathbf{x}, t) : \|\mathbf{x}\|_2 \le t\}$; convex; $45^\circ$ half-angle |
| Cone constraint | $\|\mathbf{A}\mathbf{x} + \mathbf{b}\|_2 \le \mathbf{c}^\top\mathbf{x} + d$; affine preimage of $\mathcal{K}$ |
| SOCP standard form | Minimize $\mathbf{c}^\top\mathbf{x}$ s.t. $\|\mathbf{A}_i\mathbf{x} + \mathbf{b}_i\|_2 \le \mathbf{c}_i^\top\mathbf{x} + d_i$, $\mathbf{F}\mathbf{x} = \mathbf{g}$ |
| Quadratic as cone | $\|\mathbf{y}\|^2 \le s \Leftrightarrow \|(2\mathbf{y}, 1 - s)\|_2 \le 1 + s$; LP and QP are SOCPs |
| Landing cones | Thrust $\|\mathbf{u}\| \le \sigma$; pointing $\|\mathbf{u}\| \le u_z/\cos\theta$; glide slope $\|\mathbf{E}\mathbf{r}\| \le r_z\tan\gamma$ |
| Thrust bounds | $\|\mathbf{u}\| \le u_{\max}$ convex (ball); $\|\mathbf{u}\| \ge u_{\min}$ not (complement of a ball) |
| Lossless convexification | Slack $\Gamma$: $\|\mathbf{T}\| \le \Gamma$, $\rho_1 \le \Gamma \le \rho_2$; optimum has $\|\mathbf{T}\| = \Gamma$ (Açıkmeşe and Ploen) |
| Change of variables | $\mathbf{u} = \mathbf{T}/m$, $\sigma = \Gamma/m$, $z = \ln m$: $\dot{\mathbf{v}} = \mathbf{u} + \mathbf{g}$, $\dot z = -\alpha\sigma$, cost $\int\sigma\,dt$ |
| Throttle in new variables | $\rho_1 e^{-z} \le \sigma \le \rho_2 e^{-z}$; upper bound linearized (always conservative), lower bound quadratic (a cone; conservative when $z \ge z_0$) |
| Example lander | $\rho_1 = 9.6$, $\rho_2 = 24\,\mathrm{kN}$, $\alpha = 3.28 \times 10^{-4}\,\mathrm{s/m}$; errors $-0.5\,\%$ and $+0.02\,\%$ after $200\,\mathrm{kg}$ burned |
| Size at $N = 100$ | $1107$ variables, $713$ equalities, $401$ cones of dimension $\le 4$ |
| Final time | Not a convex variable; outer line search over $t_f$ |

The next lesson develops duality, which supplies the certificates promised in lesson 4 and the language in which a conic solver reports its progress. The lesson after it climbs one more rung — the semidefinite program, whose cone is the set of positive semidefinite matrices — and shows where SOCP sits among conic problems. Then interior-point methods give the algorithm that solves the SOCP built here.

::: context spacex-cvxgen Convex landing in real life
Lars Blackmore, SpaceX's principal rocket-landing engineer, wrote in 2016 that SpaceX lands its boosters by solving a convex optimization problem onboard, using a custom solver generated by CVXGEN — a tool built at Stanford by Jacob Mattingley and Stephen Boyd that turns one problem family into fast, fixed-size C code. Lesson 13 is about exactly that kind of code generation.
:::

::: context cone-name Why "second-order"?
The Euclidean norm is also called the **2-norm**, because it squares the components (raises them to the power $2$) before taking the root. A cone built on it is a "second-order" cone. It has two other names you will meet in papers and solver manuals: the **Lorentz cone**, because physicists meet the same shape as the light cone of special relativity, and the **ice-cream cone**, for obvious reasons.
:::

::: context epigraph-word What an epigraph is
*Epi* is Greek for "on top of". The epigraph of a function is everything on or above its graph — draw the curve and shade the sky above it. A function is convex exactly when its epigraph is a convex set. The epigraph of the length function $\|\mathbf{x}\|_2$ is the set of points $(\mathbf{x}, t)$ with $t$ at least the length of $\mathbf{x}$ — which is the cone.
:::

::: context ice-cream-cone The cone, sliced open
Cut the cone through its axis and you see a V. Each side makes $45^\circ$ with the axis, because on the surface the height $t$ equals the distance $\|\mathbf{x}\|$ from the axis. Everything inside the V — above both sides — belongs to the cone.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <polygon points="180,175 80,75 280,75" fill="#8fb8f0" opacity="0.7"/>
  <ellipse cx="180" cy="75" rx="100" ry="16" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="175" x2="80" y2="75" stroke="#1f2a44" stroke-width="2"/>
  <line x1="180" y1="175" x2="280" y2="75" stroke="#1f2a44" stroke-width="2"/>
  <line x1="180" y1="175" x2="180" y2="22" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="4 3"/>
  <polygon points="180,16 175,27 185,27" fill="#1f2a44"/>
  <text x="188" y="26" font-size="12" fill="#1f2a44">t</text>
  <line x1="40" y1="175" x2="320" y2="175" stroke="#6c7a93" stroke-width="1"/>
  <text x="322" y="179" font-size="12" fill="#6c7a93">x</text>
  <path d="M180,145 A30,30 0 0,1 201.2,153.8" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <text x="205" y="145" font-size="11" fill="#b4232c">45°</text>
  <text x="180" y="116" font-size="12" text-anchor="middle" fill="#1f2a44">‖x‖ ≤ t</text>
  <text x="286" y="120" font-size="11" fill="#1f2a44">surface: ‖x‖ = t</text>
</svg>
```
:::

::: context isp Specific impulse
**Specific impulse**, $I_{sp}$, measures how much push an engine squeezes from each kilogram of propellant. It is quoted in seconds: an engine with $I_{sp} = 311\,\mathrm{s}$ can make one kilogram of propellant hold up its own weight for $311$ seconds. Multiply by $g_0 = 9.80665\,\mathrm{m/s^2}$ and you get the effective exhaust speed, here about $3050\,\mathrm{m/s}$. So $\alpha = 1/(I_{sp} g_0)$ is kilograms burned per newton of thrust per second — a higher $I_{sp}$ means a smaller $\alpha$.
:::

::: context thrust-shell The hollow shell of allowed thrusts
Draw the allowed thrusts in two dimensions: a ring between the minimum and the maximum. Two thrusts pointing opposite ways are both in the ring, but the point halfway between them is the center — zero thrust — which the ring leaves out. One broken midpoint is all it takes to prove a set is not convex.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <path d="M40,100 a70,70 0 1,0 140,0 a70,70 0 1,0 -140,0 Z M82,100 a28,28 0 1,0 56,0 a28,28 0 1,0 -56,0 Z" fill="#8fb8f0" fill-rule="evenodd" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="110" y1="100" x2="72" y2="100" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="70,100 79,95 79,105" fill="#1d6fd1"/>
  <line x1="110" y1="100" x2="148" y2="100" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="150,100 141,95 141,105" fill="#1d6fd1"/>
  <line x1="104" y1="94" x2="116" y2="106" stroke="#b4232c" stroke-width="2.5"/>
  <line x1="104" y1="106" x2="116" y2="94" stroke="#b4232c" stroke-width="2.5"/>
  <text x="200" y="60" font-size="12" fill="#1f2a44">allowed: 40% to 100%</text>
  <text x="200" y="80" font-size="12" fill="#1d6fd1">two allowed thrusts</text>
  <text x="200" y="100" font-size="12" fill="#b4232c">their midpoint: zero,</text>
  <text x="200" y="116" font-size="12" fill="#b4232c">not allowed</text>
  <text x="110" y="190" font-size="11" text-anchor="middle" fill="#1f2a44">inner radius is 0.4 × outer</text>
</svg>
```
:::

::: context gfold The algorithm that flew
Behçet Açıkmeşe and Scott Ploen, at NASA's Jet Propulsion Laboratory, published the lossless convexification of powered descent in 2007 in the *Journal of Guidance, Control, and Dynamics*, with Mars landing in mind. JPL and Masten Space Systems then flew the resulting algorithm, G-FOLD (Guidance for Fuel-Optimal Large Diverts), on Masten's Xombie test rocket in 2012 and 2013, commanding diverts of several hundred meters computed onboard. It was one of the first flights of convex-optimization guidance on a rocket.
:::

::: context cone-slice Relaxation, drawn
Plot the size of the thrust, $\|\mathbf{T}\|$, across and the slack $\Gamma$ up. The shaded region is the relaxed feasible set: left of the line $\|\mathbf{T}\| = \Gamma$ and between the two throttle levels. The optimum always lands on the red edge, where $\|\mathbf{T}\| = \Gamma$ — and every point on that edge has $\rho_1 \le \|\mathbf{T}\| \le \rho_2$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 205" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="180" x2="250" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="60" y1="180" x2="60" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="60" y1="180" x2="120" y2="120" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <polygon points="60,120 120,120 210,30 60,30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <line x1="120" y1="120" x2="210" y2="30" stroke="#b4232c" stroke-width="3.5"/>
  <text x="54" y="124" font-size="11" text-anchor="end" fill="#1f2a44">ρ1</text>
  <text x="54" y="34" font-size="11" text-anchor="end" fill="#1f2a44">ρ2</text>
  <text x="120" y="195" font-size="11" text-anchor="middle" fill="#1f2a44">ρ1</text>
  <text x="210" y="195" font-size="11" text-anchor="middle" fill="#1f2a44">ρ2</text>
  <text x="255" y="184" font-size="12" fill="#1f2a44">‖T‖</text>
  <text x="66" y="18" font-size="12" fill="#1f2a44">Γ</text>
  <text x="222" y="70" font-size="11" fill="#b4232c">optimum here:</text>
  <text x="222" y="85" font-size="11" fill="#b4232c">‖T‖ = Γ</text>
  <text x="100" y="80" font-size="11" text-anchor="middle" fill="#1f2a44">relaxed set</text>
</svg>
```

The left part of the shaded region contains thrusts below $\rho_1$ — the points the relaxation added. The theorem says the optimizer never picks them.
:::

::: context minimum-principle Pontryagin's minimum principle
In 1956 Lev Pontryagin and his students in Moscow found the rule that optimal controls must obey: at every instant, the best control minimizes a single function called the **Hamiltonian**, built from the cost and the dynamics weighted by multipliers called **costates**. It is the KKT conditions stretched over continuous time — one multiplier for each state at each instant. You will derive and use it in the optimal-control course; here you need only its conclusion.
:::

::: context log-mass Why the logarithm of the mass
The rocket equation says the speed change from burning propellant is $\Delta v = I_{sp} g_0 \ln(m_0/m_f)$ — it depends on the *logarithm* of the mass ratio. So $z = \ln m$ is the natural way to count mass on a rocket: each equal step down in $z$ buys an equal amount of speed change. That is why, in the new variables, $\dot z = -\alpha\sigma$ comes out linear.
:::

::: context taylor-exp How good are the approximations?
The black curve is $e^{-d}$, with $d = z - z_0$. The grey dashed line is the tangent at $d = 0$ — always below the curve, so a limit built on it is always safe. The blue curve adds the $\tfrac{1}{2}d^2$ term: it hugs the exponential near $d = 0$, sits above it for $d > 0$ and below it for $d < 0$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 205" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="175" x2="325" y2="175" stroke="#6c7a93" stroke-width="1"/>
  <line x1="180" y1="20" x2="180" y2="190" stroke="#6c7a93" stroke-width="1"/>
  <polyline fill="none" stroke="#6c7a93" stroke-width="2" stroke-dasharray="5 3" points="48.0,76.0 59.0,80.5 70.0,85.0 81.0,89.5 92.0,94.0 103.0,98.5 114.0,103.0 125.0,107.5 136.0,112.0 147.0,116.5 158.0,121.0 169.0,125.5 180.0,130.0 191.0,134.5 202.0,139.0 213.0,143.5 224.0,148.0 235.0,152.5 246.0,157.0 257.0,161.5 268.0,166.0 279.0,170.5 290.0,175.0 301.0,179.5 312.0,184.0"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="48.0,43.6 59.0,53.3 70.0,62.5 81.0,71.3 92.0,79.6 103.0,87.5 114.0,94.9 125.0,101.9 136.0,108.4 147.0,114.5 158.0,120.1 169.0,125.3 180.0,130.0 191.0,134.3 202.0,138.1 213.0,141.5 224.0,144.4 235.0,146.9 246.0,148.9 257.0,150.5 268.0,151.6 279.0,152.3 290.0,152.5 301.0,152.3 312.0,151.6"/>
  <polyline fill="none" stroke="#1f2a44" stroke-width="2" points="48.0,25.6 59.0,39.8 70.0,52.7 81.0,64.3 92.0,74.9 103.0,84.4 114.0,93.0 125.0,100.8 136.0,107.9 147.0,114.3 158.0,120.0 169.0,125.3 180.0,130.0 191.0,134.3 202.0,138.2 213.0,141.7 224.0,144.8 235.0,147.7 246.0,150.3 257.0,152.7 268.0,154.8 279.0,156.7 290.0,158.4 301.0,160.0 312.0,161.4"/>
  <text x="62" y="30" font-size="11" fill="#1f2a44">exact</text>
  <text x="70" y="98" font-size="11" fill="#6c7a93">tangent</text>
  <text x="262" y="144" font-size="11" fill="#1d6fd1">quadratic</text>
  <text x="48" y="192" font-size="11" text-anchor="middle" fill="#1f2a44">−1.2</text>
  <text x="312" y="200" font-size="11" text-anchor="middle" fill="#1f2a44">1.2</text>
  <text x="186" y="198" font-size="11" fill="#1f2a44">d = 0</text>
  <text x="174" y="128" font-size="11" text-anchor="end" fill="#1f2a44">1</text>
</svg>
```

The range here is wide on purpose so the gaps show. On a real burn $|d|$ stays below about $0.3$, where all three curves nearly coincide.
:::
