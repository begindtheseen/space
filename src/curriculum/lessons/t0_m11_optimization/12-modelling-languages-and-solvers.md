---
id: l12-modelling-languages-and-solvers
title: "Modelling languages and solvers: CVXPY, ECOS, SCS, OSQP, Clarabel"
minutes: 30
covers:
  - "modelling languages and solvers: CVXPY, ECOS, SCS, OSQP, Clarabel"
---

A conic solver does not read mathematics. It reads four things: a cost vector, a matrix, a right-hand side, and a list saying how many rows belong to which cone. The landing problem of lesson 6 – three kinds of cone, a mass-varying change of variables, a discretisation – has to be reduced to those four objects before any of the algorithms of lesson 9 can touch it. Doing that reduction by hand, for a problem with a thousand variables, is how people used to get it wrong.

A **modelling language** does it for you. You write the problem the way it appears in the derivation, with norms and inequalities and named variables, and the modelling layer verifies that what you wrote is convex, rewrites it into conic standard form, calls a solver, and maps the answer back onto your variables. CVXPY is the one this module uses. The verification step is not a courtesy: it is a rule system that will refuse an expression it cannot prove convex, which catches the formulation errors of lesson 3 at the point where they are cheapest to fix.

This lesson covers the modelling layer and the four solvers underneath it. It also settles the accounting promised in lesson 6: what one interior-point iteration on the discretised landing problem actually costs. That number is the bridge to the last lesson, where the same problem has to fit inside a guidance cycle.

## What canonicalisation does

CVXPY's job is a chain of rewrites from your expression tree down to cone data. Take the tiny problem of lesson 5 – split $50\,\mathrm{kN}$ between two engines – and follow it down.

The conic standard form that ECOS, SCS and Clarabel all accept is

$$
\text{minimise } \mathbf{c}^\top\mathbf{x} \quad \text{subject to} \quad \mathbf{A}\mathbf{x} = \mathbf{b}, \quad \mathbf{G}\mathbf{x} + \mathbf{s} = \mathbf{h}, \quad \mathbf{s} \in \mathcal{K},
$$

where $\mathcal{K}$ is a product of cones described by a small dictionary: how many nonnegative rows, then a list of second-order cone dimensions, then any semidefinite or exponential blocks. Everything else – the objective's shape, the names, the structure – is gone.

::: example The two-engine LP as cone data
Minimise $1.2T_1 + T_2$ subject to $T_1 + T_2 \ge 50$, $0 \le T_i \le 30$. Writing every inequality as "something $\le$ something", stacking, and taking $\mathbf{x} = (T_1, T_2)$:

$$
\mathbf{c} = \begin{bmatrix} 1.2 \\ 1\end{bmatrix}, \qquad
\mathbf{G} = \begin{bmatrix} -1 & -1 \\ 1 & 0 \\ 0 & 1 \\ -1 & 0 \\ 0 & -1\end{bmatrix}, \qquad
\mathbf{h} = \begin{bmatrix} -50 \\ 30 \\ 30 \\ 0 \\ 0\end{bmatrix},
$$

with no equality rows and $\mathcal{K} = \mathbb{R}^5_+$: five nonnegative rows and nothing else. That is the whole problem as the solver sees it.

Check the answer against it. At $\mathbf{x}^\star = (20, 30)$ the slacks are $\mathbf{s} = \mathbf{h} - \mathbf{G}\mathbf{x}^\star = (0, 10, 0, 20, 30)$, all nonnegative, so the point is feasible, and $\mathbf{c}^\top\mathbf{x}^\star = 54$. The dual variable from lesson 9's solve, reordered to match these rows, is $\mathbf{y} = (1.2, 0, 0.2, 0, 0)$, which lies in $\mathcal{K}^* = \mathbb{R}^5_+$; dual feasibility requires $\mathbf{G}^\top\mathbf{y} + \mathbf{c} = \mathbf{0}$, and it is, to machine precision. The dual objective is $-\mathbf{h}^\top\mathbf{y} = 50 \times 1.2 - 30 \times 0.2 = 54$: zero gap. Complementarity shows up as $s_iy_i = 0$ for every row – the binding rows ($s_1 = 0$, $s_3 = 0$) are the ones with a price.

Everything in lessons 7 and 9 is visible in these five numbers per row, and everything about *where the problem came from* has been erased. That is the trade the modelling layer manages on your behalf.
:::

For the landing problem, the same chain runs much further. Each atom in your expression – `norm(u, 2)`, `sum_squares`, `quad_over_lin`, `abs` – has a **graph implementation**: a set of auxiliary variables and cone constraints whose optimal value equals the atom's value. The epigraph tricks of lesson 6 are exactly these. `norm(u, 2) <= sigma` becomes one second-order cone row block of dimension $\dim\mathbf{u} + 1$. A squared norm in the objective becomes an auxiliary scalar plus the rotated-cone identity $\|\mathbf{y}\|^2 \le s \Leftrightarrow \|(2\mathbf{y}, 1-s)\|_2 \le 1+s$. CVXPY applies these bottom-up, stacks the results, and hands the solver a matrix.

## DCP: the rules that decide what you may write

CVXPY will not accept an arbitrary convex expression. It accepts expressions built by **disciplined convex programming** rules, which give a *verifiable* sufficient condition for convexity rather than asking you to prove it.

Every expression carries two tags: a **sign** (positive, negative, unknown) and a **curvature** (constant, affine, convex, concave, unknown). Leaves are variables (affine), parameters and constants. Then:

- A sum of convex expressions is convex; a sum of concave is concave. A nonnegative multiple preserves curvature, a negative multiple flips it.
- An affine function of affine expressions is affine.
- **The composition rule.** $f(g_1(\mathbf{x}), \dots, g_k(\mathbf{x}))$ is convex if $f$ is convex and, for each argument, either $f$ is nondecreasing in that argument and $g_i$ is convex, or $f$ is nonincreasing in it and $g_i$ is concave, or $g_i$ is affine. These are the closure rules of lesson 3, made mechanical.
- A constraint is accepted if it is `convex <= concave`, `concave >= convex`, or `affine == affine`.

The rules are **sufficient, not necessary**, and that is the source of most of the friction. The function $\sqrt{x^2 + 1}$ is convex, but written as `sqrt(x**2 + 1)` it fails: `sqrt` is concave and nondecreasing, its argument `x**2 + 1` is convex, and the composition rule needs a concave argument there. Written as `norm(hstack([x, 1]), 2)` it passes, because a norm of an affine expression is convex by the rule about affine arguments. Rewriting the *same function* so that the rules can see it is a real skill, and the error message tells you which subexpression failed.

::: warning The mistakes DCP catches, and the one it does not
Three failures you will meet, with their cures.

**A norm on the wrong side.** `norm(u, 2) >= u_min` is the nonconvex minimum-throttle constraint of lessons 3 and 6, and CVXPY rejects it: `convex >= constant` is not an accepted form. The rejection is correct and it is the whole reason lossless convexification exists. The cure is the slack $\Gamma$, not a solver flag.

**A product of variables.** `x * y` where both are variables has unknown curvature and is rejected. Sometimes the intended expression is really `quad_over_lin(x, y)` or a rotated cone; sometimes the problem genuinely is not convex and belongs in lesson 10.

**A ratio with a variable denominator.** `1/x` is rejected for unknown sign; `inv_pos(x)` is the convex atom for $1/x$ on $x > 0$ and is accepted.

What DCP does *not* catch is a problem that is convex, correctly written, and wrong – a glide-slope angle in degrees where the formula wants radians, a sign error in the dynamics, a discretisation that does not converge. Acceptance by the rule system means "this is a convex program", never "this is your problem".
:::

::: example Writing a cone constraint in CVXPY
The code below is illustrative: CVXPY is not installed in this environment, so no output is claimed for it. It shows a single-step thrust allocation with the three landing cones of lesson 6 – magnitude, pointing and glide slope – and a linear objective.

```python
import cvxpy as cp
import numpy as np

u = cp.Variable(3)                  # thrust acceleration, m/s^2
sigma = cp.Variable()               # the lossless-convexification slack
r = np.array([40.0, 15.0, 300.0])   # current position, pad at the origin

gamma, theta = np.deg2rad(4.0), np.deg2rad(45.0)
cons = [
    cp.norm(u, 2) <= sigma,                        # thrust cone
    sigma >= 4.8, sigma <= 12.0,                   # throttle slab
    cp.norm(u, 2) * np.cos(theta) <= u[2],         # pointing
    cp.norm(r[:2], 2) <= r[2] * np.tan(gamma),     # glide slope (data only)
]
prob = cp.Problem(cp.Minimize(sigma), cons)
prob.solve(solver=cp.ECOS, abstol=1e-8, reltol=1e-8)
print(prob.status, prob.value, u.value, sigma.value)
print(cons[0].dual_value)           # the dual variable on the thrust cone
```

Three habits are worth copying. Name the constraint list, so the dual variables can be read back by index – those duals are the shadow prices of lesson 2 and the certificate of lesson 7. Check `prob.status` before touching `prob.value`: the informative outcomes are `optimal`, `optimal_inaccurate`, `infeasible` and `unbounded`, and only the first should be flown. And state the tolerances explicitly rather than accepting defaults, because the default that suits a desktop study is not the one you would certify.
:::

## The four solvers

**ECOS** is an interior-point solver for problems with linear, second-order and exponential cones – the algorithm of lesson 9 with Nesterov–Todd scaling and the homogeneous self-dual embedding. It is written in library-free ANSI C, a few thousand lines, and it computes its sparse $\mathbf{L}\mathbf{D}\mathbf{L}^\top$ ordering once from the sparsity pattern and then reuses it at every iteration with no pivoting. That last property is what makes it embeddable: the memory a solve needs, and the arithmetic it performs, are fixed before the first iteration. ECOS is the historical default for SOCP in CVXPY and the ancestor of most embedded conic solvers.

**SCS** (Splitting Conic Solver) is a first-order method: it applies ADMM (alternating direction method of multipliers) to the homogeneous self-dual embedding. Each iteration is a projection onto the cone plus a linear solve with a *fixed* matrix, so one factorisation is computed at the start and reused for the whole run, or the linear system is solved iteratively with conjugate gradients and never factorised at all. It handles semidefinite and exponential cones, scales to problems far too large for an interior-point method, and reaches modest accuracy – three or four digits – quickly, then slows. Use it when the problem is huge and the accuracy requirement is loose.

**OSQP** is ADMM specialised to the QP of lesson 5. It factorises one quasi-definite matrix, built from $\mathbf{P}$, $\mathbf{A}$ and two scalar step parameters, and every iteration is then two triangular solves and a projection onto a box – no division, no branching of any consequence. It warm starts extremely well, detects primal and dual infeasibility, and has a code generator. For a model-predictive controller re-solving a slightly changed QP at a few hundred hertz it is often the right answer, because the factorisation is amortised over thousands of solves and the warm start cuts the iterations to a handful.

**Clarabel** is a newer interior-point solver, written in Rust with Python and Julia interfaces, supporting the symmetric cones plus the exponential, power and generalised-power cones. It ships with recent CVXPY releases and is used by default for many conic problems. Algorithmically it is in the same family as ECOS, with more careful regularisation and a broader cone library.

::: key Which solver, and why
ECOS and Clarabel: interior point on a conic problem, tens of iterations, high accuracy, a bounded amount of work per iteration, no useful warm start. SCS: first-order on a conic problem, hundreds to thousands of cheap iterations, low to moderate accuracy, handles very large problems and SDP. OSQP: first-order specialised to QP, one factorisation reused, excellent warm starts, ideal for repeated solves of a slowly changing QP. Choose an interior-point solver when you need accuracy and a predictable iteration count; choose a first-order solver when the problem is large, the accuracy demand is modest, or the same problem is solved over and over.
:::

## What one iteration of the landing SOCP costs

Lesson 6 built the discretised problem and lesson 8 promised the accounting. Here it is.

The problem has $n = 1107$ variables, $p = 713$ equality rows and $m = 1603$ cone rows across $401$ second-order cones and $100$ nonnegative rows. An interior-point iteration must solve the system

$$
\begin{bmatrix} \mathbf{0} & \mathbf{A}^\top & \mathbf{G}^\top \\ \mathbf{A} & \mathbf{0} & \mathbf{0} \\ \mathbf{G} & \mathbf{0} & -\mathbf{W}^2\end{bmatrix}
\begin{bmatrix} \Delta\mathbf{x} \\ \Delta\mathbf{y} \\ \Delta\mathbf{z}\end{bmatrix} = \mathbf{r},
$$

of dimension $n + p + m = 3423$, where $\mathbf{W}$ is the Nesterov–Todd scaling. But $\mathbf{W}^2$ is block diagonal with one block per cone, none larger than $4 \times 4$, and each block is an arrow matrix that inverts in closed form. Eliminating $\Delta\mathbf{z}$ leaves the **reduced KKT system**

$$
\begin{bmatrix} \mathbf{G}^\top\mathbf{W}^{-2}\mathbf{G} & \mathbf{A}^\top \\ \mathbf{A} & \mathbf{0}\end{bmatrix}
\begin{bmatrix} \Delta\mathbf{x} \\ \Delta\mathbf{y}\end{bmatrix} = \tilde{\mathbf{r}},
$$

of dimension $1820$. Now count its nonzeros. Each defect row couples the state at node $k$ ($7$), the control on interval $k$ ($4$) and the state at node $k+1$ ($7$): $18$ entries, over $700$ rows, plus $13$ boundary rows. Each cone contributes a small dense block to $\mathbf{G}^\top\mathbf{W}^{-2}\mathbf{G}$ on the variables it touches – $4 \times 4$ for a thrust cone, $3 \times 3$ for pointing and for glide slope, $2 \times 2$ for the throttle rows.

```python
N, nx, nu = 100, 7, 4                      # state (r, v, z); control (u, sigma)
n = (N + 1) * nx + N * nu                  # variables
p = N * nx + 13                            # dynamics defects + boundary conditions
cones = [(N, 4), (N, 4), (N + 1, 3), (N, 4)]   # thrust, pointing, glide slope, throttle
m = sum(cnt * dim for cnt, dim in cones) + N   # plus the linear upper-throttle rows

nnz_A = N * nx * (2 * nx + nu) + 13         # each defect row touches x_k, u_k, x_{k+1}
nnz_H = N * (16 + 9 + 4 + 4) + (N + 1) * 9  # G^T W^-2 G, one small block per cone
M, b = n + p, 25                            # reduced KKT size and half-bandwidth

print(f"n = {n}, p = {p}, m = {m}, cones = {sum(c for c, _ in cones)}")
print(f"reduced KKT: {M} x {M}, nonzeros ~ {nnz_H + 2 * nnz_A}, "
      f"density {(nnz_H + 2 * nnz_A) / M**2:.2%}")
print(f"factorisation ~ {M * b * b:.3g} flops; iteration (1 factor + 3 solves) "
      f"~ {M * b * b + 3 * 4 * M * b:.3g}")
print(f"25 iterations ~ {25 * (M * b * b + 3 * 4 * M * b):.3g} flops; "
      f"dense would be {M**3 / 3:.3g} per iteration")

# n = 1107, p = 713, m = 1603, cones = 401
# reduced KKT: 1820 x 1820, nonzeros ~ 29435, density 0.89%
# factorisation ~ 1.14e+06 flops; iteration (1 factor + 3 solves) ~ 1.68e+06
# 25 iterations ~ 4.21e+07 flops; dense would be 2.01e+09 per iteration
```

Read the result. The reduced KKT matrix is $0.89\,\%$ dense, and when the variables are ordered by time node it is banded with a half-bandwidth of about $25$ – a state and a control at each node, plus the defect rows that couple neighbours. A banded $\mathbf{L}\mathbf{D}\mathbf{L}^\top$ factorisation costs about $Mb^2 \approx 1.1$ million operations; the predictor-corrector of lesson 9 reuses that factorisation for three back-substitutions at about $4Mb \approx 180$ thousand each. One iteration is therefore about $1.7$ million floating-point operations, and a $25$-iteration solve about $4.2 \times 10^7$. Ignoring the structure and factorising densely would cost $M^3/3 \approx 2 \times 10^9$ per iteration, a factor of $1{,}200$ worse – and the semidefinite formulation of lesson 8 would be worse still.

Those two numbers, $1.7$ million per iteration and $4.2 \times 10^7$ per solve, are the ones the next lesson divides into a guidance cycle.

::: note First-order methods on the same problem
Run the arithmetic for ADMM instead. OSQP-style, the factorisation happens once and each iteration costs two triangular solves, about $4Mb \approx 1.8\times10^5$ operations – roughly ten times cheaper than an interior-point iteration. But ADMM's convergence is linear, not superlinear: where the interior-point method needed $25$ iterations for eight digits, a first-order method typically needs several hundred for three or four. At $500$ iterations the total is $9.1\times10^7$ operations against the interior-point method's $4.2\times10^7$ – more work for less accuracy, on a cold start. The picture flips when the problem barely changes between solves: a warm-started ADMM may converge in $20$ iterations, about $3.6\times10^6$ operations, and beat the interior-point method by an order of magnitude, because lesson 9 showed that an interior-point method cannot be warm started usefully. That is the whole case for OSQP in a fast control loop, and the whole case against it for a once-per-cycle guidance solve that must hit a hard deadline from an unpredictable state.
:::

## Parameters, and the road to generated code

A guidance solver re-solves the *same* problem with different numbers every cycle: the vehicle state changes, the target may move, the mass decreases, but the structure is fixed. CVXPY expresses this with `cp.Parameter` objects in place of the numbers that change. If the problem is built so that every parameter enters **affinely** in the right places – the **disciplined parametrized programming** (DPP) ruleset – then the map from parameter values to cone data is itself affine and can be computed once and reused, turning the canonicalisation from a per-solve cost into a one-off.

This is what makes code generation possible, and it is where the next lesson starts: CVXPYgen and the OSQP and ECOS code generators all consume a parametrized problem and emit C that contains the sparsity pattern, the elimination ordering and the workspace as compile-time constants, with no modelling layer and no memory allocation left at runtime.

::: warning Canonicalisation is not free, and defaults are not specifications
Two habits worth forming. First, measure the canonicalisation separately from the solve. On a problem of the size above, building the cone data in Python can take longer than the solve itself, and a naive loop that constructs constraints one at a time inside a `for` loop over $100$ nodes is slower still; vectorise, and use parameters so the work happens once. Second, a solver's default tolerance is a compromise chosen for interactive use. ECOS defaults to roughly $10^{-8}$ on the residuals, SCS to around $10^{-4}$ – three orders of magnitude apart, and a trajectory that looks fine at $10^{-4}$ may violate a glide slope by centimetres or a throttle bound by a percent. Set the tolerances from the engineering requirement, then check `prob.status` and the reported residuals rather than trusting that the solve succeeded.
:::

## Check yourself

::: check
CVXPY rejects `cp.sqrt(cp.square(x) + 1) <= t` as not DCP, although the left side is a convex function of $x$. Explain the rejection in terms of the composition rule, and give an accepted rewriting.
:::

::: answer
The composition rule asks whether the outer function's monotonicity matches its argument's curvature. Here the outer function is $\sqrt{\cdot}$, which is **concave** and nondecreasing, and the argument $x^2 + 1$ is convex. A concave nondecreasing function of a convex argument has unknown curvature under the rules, so the expression is tagged unknown and the constraint `unknown <= affine` is rejected. The rules are sufficient, not necessary: the composite really is convex, but the tag system cannot see it. The accepted rewriting is `cp.norm(cp.hstack([x, 1]), 2) <= t`, since a norm is convex and its argument is affine, which the rule about affine arguments always allows. It also canonicalises to a single second-order cone row block of dimension $3$, which is what you want anyway.
:::

::: check
Given the cone data $(\mathbf{c}, \mathbf{G}, \mathbf{h}, \mathcal{K})$ of the two-engine example and a claimed solution $\mathbf{x} = (25, 25)$ with dual $\mathbf{y} = (1.0, 0, 0, 0, 0)$, verify or refute optimality using only matrix arithmetic.
:::

::: answer
Primal feasibility: $\mathbf{s} = \mathbf{h} - \mathbf{G}\mathbf{x} = (-50 + 50,\ 30 - 25,\ 30 - 25,\ 25,\ 25) = (0, 5, 5, 25, 25)$, all nonnegative, so $\mathbf{x}$ is feasible with objective $1.2 \times 25 + 25 = 55$. Dual feasibility: $\mathbf{y} \ge \mathbf{0}$, and $\mathbf{G}^\top\mathbf{y} + \mathbf{c} = (-1.0 + 1.2,\ -1.0 + 1.0) = (0.2, 0)$, which is **not** zero – so $\mathbf{y}$ is not dual feasible and certifies nothing. The pair is therefore not a certificate of optimality, and indeed $55 > 54$. If instead the dual residual had been zero, the gap $\mathbf{c}^\top\mathbf{x} + \mathbf{h}^\top\mathbf{y}$ would have decided it. The order of checks matters: primal residual, dual residual, then gap – a gap computed from an infeasible dual point is meaningless, exactly as lesson 7 warned.
:::

::: check
A colleague reports that switching the landing SOCP from ECOS to SCS made it "ten times faster". What would you ask before believing the comparison is meaningful?
:::

::: answer
What tolerance each solver was given, and whether the returned trajectories satisfy the constraints to the accuracy the vehicle needs. SCS's default tolerance is several orders of magnitude looser than ECOS's, so "ten times faster" may mean "stopped at three digits instead of eight". The questions to ask: what were the final primal residual, dual residual and duality gap in each case; does the SCS trajectory satisfy the glide slope and throttle bounds within the margins the vehicle can absorb; was the timing a cold start or warm; and was canonicalisation included in the measurement or only the solver time. Then rerun both at the *same* residual tolerances. On a well-structured, moderately sized SOCP like this one the interior-point method usually wins at high accuracy, and the first-order method wins on very large or loosely-toleranced problems – a comparison at mismatched tolerances measures nothing.
:::

::: check
The reduced KKT matrix has half-bandwidth about $25$. What in the problem sets that number, and what would happen to the per-iteration cost if a constraint coupled every time node to every other?
:::

::: answer
The bandwidth comes from the fact that each equation touches at most two adjacent time nodes: a defect row couples node $k$'s state ($7$), interval $k$'s control ($4$) and node $k+1$'s state ($7$), and every cone touches variables at a single node. Ordering the unknowns node by node therefore confines the nonzeros to a band roughly the width of one node's worth of variables plus its defect rows, about $18$ to $25$. A constraint coupling all nodes – a total-propellant limit written as a single row over every $\sigma_k$, say, or a global final-time variable appearing in every dynamics row – destroys the band: that one dense row produces fill-in across the whole factor and the cost heads back toward the dense $M^3/3 \approx 2\times10^9$. The cures are standard: keep such couplings to a handful of rows and let the sparse ordering handle them as a dense border, or eliminate them separately with a low-rank update. It is also the technical reason lesson 6 kept $t_f$ out of the problem and searched over it outside.
:::

::: check
You are choosing a solver for a model-predictive attitude controller running at $100\,\mathrm{Hz}$ on a QP with $300$ variables whose data changes slightly each cycle. Which solver, and what is the argument?
:::

::: answer
OSQP, or an active-set QP solver. The argument is entirely about warm starting and amortisation. The problem's matrix structure is fixed, so OSQP's single factorisation is paid once at initialisation and never again; each cycle then costs two triangular solves per iteration, and because the previous cycle's solution is an excellent starting point the iteration count falls to a handful. An interior-point solver would need a full, essentially cold, solve every cycle – lesson 9 showed why its iterates cannot be warm started from a boundary point – and would spend tens of iterations to reach an accuracy the controller does not need. The considerations that would change the answer: if the active set changes violently from cycle to cycle, or if a hard per-cycle deadline must be certified rather than met on average, the predictable iteration count of an interior-point method becomes worth its higher cost. That trade is the subject of the next lesson.
:::

## Summary

| Object | Statement |
| --- | --- |
| Conic standard form | minimise $\mathbf{c}^\top\mathbf{x}$ s.t. $\mathbf{A}\mathbf{x} = \mathbf{b}$, $\mathbf{G}\mathbf{x} + \mathbf{s} = \mathbf{h}$, $\mathbf{s} \in \mathcal{K}$ |
| Canonicalisation | Atoms get graph implementations (epigraph variables plus cone rows); the result is $(\mathbf{c}, \mathbf{A}, \mathbf{b}, \mathbf{G}, \mathbf{h}, \mathcal{K})$ |
| Two-engine cone data | $\mathbf{c} = (1.2, 1)$, $\mathbf{G}$ five rows, $\mathbf{h} = (-50, 30, 30, 0, 0)$, $\mathcal{K} = \mathbb{R}^5_+$; $\mathbf{s} = (0,10,0,20,30)$, $\mathbf{y} = (1.2,0,0.2,0,0)$ |
| DCP tags | Sign and curvature on every node; constraints must be convex $\le$ concave, concave $\ge$ convex, or affine $=$ affine |
| Composition rule | $f(g(\mathbf{x}))$ convex if $f$ convex and ($f$ nondecreasing and $g$ convex) or ($f$ nonincreasing and $g$ concave) or $g$ affine |
| ECOS | Interior point, linear + second-order + exponential cones, library-free ANSI C, fixed ordering and workspace |
| SCS | ADMM on the self-dual embedding, handles SDP, huge problems, modest accuracy |
| OSQP | ADMM for QP, one reused factorisation, division-free iterations, strong warm starts, code generation |
| Clarabel | Rust interior point, symmetric plus exponential and power cones, ships with recent CVXPY and is used by default for many conic problems |
| Landing SOCP cost | Reduced KKT $1820 \times 1820$, $29{,}435$ nonzeros, $0.89\,\%$ dense, half-bandwidth $\approx 25$ |
| Per iteration | $\approx 1.1\times10^6$ flops to factorise plus $3 \times 1.8\times10^5$ to solve, about $1.7\times10^6$ total |
| Per solve | $\approx 4.2\times10^7$ flops at $25$ iterations; dense would be $2\times10^9$ per iteration |
| First order on the same problem | $\approx 1.8\times10^5$ per iteration but hundreds of iterations cold; wins only when warm started |
| Parameters and DPP | Parameters entering affinely let the canonicalisation be computed once – the precondition for code generation |

The last lesson takes the $4.2\times10^7$ operations counted here, puts them inside a guidance cycle on a flight processor, and asks what has to change about the solver before anyone would let it fire an engine.
