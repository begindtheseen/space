---
id: l12-modelling-languages-and-solvers
title: "Modeling languages and solvers: CVXPY, ECOS, SCS, OSQP, Clarabel"
minutes: 22
covers:
  - "modeling languages and solvers: CVXPY, ECOS, SCS, OSQP, Clarabel"
---

Think of a vending machine that only takes exact coins. It does not care which snack you want in words. It wants the right coins in the right slots. A conic solver is like that. It does not read mathematics. It reads four things: a cost vector, a matrix, a right-hand side, and a list saying which rows belong to which cone. The landing problem of lesson 6, with its three kinds of cone and hundred time steps, has to be turned into those four objects before any algorithm from lesson 9 can touch it.

A **modeling language** is the change machine. You write the problem the way it looks on paper — norms, inequalities, named variables — and it checks that what you wrote is convex, rewrites it into the solver's format, calls a solver, and hands the answer back in your own variable names. **[[CVXPY|cvxpy-history]]**, a Python library, is the one this module uses. It refuses anything it cannot prove convex, catching lesson 3's mistakes when they are cheapest to fix.

This lesson covers that layer and four solvers under it — ECOS, SCS, OSQP and Clarabel — and counts what one interior-point iteration on the landing problem really costs. That number is the bridge to the last lesson.

## What a solver actually reads

Every problem gets squeezed into one shape. ECOS, SCS and Clarabel all accept this **conic standard form**:

$$
\text{minimize } \mathbf{c}^\top\mathbf{x} \quad \text{subject to} \quad \mathbf{A}\mathbf{x} = \mathbf{b}, \quad \mathbf{G}\mathbf{x} + \mathbf{s} = \mathbf{h}, \quad \mathbf{s} \in \mathcal{K}.
$$

- $\mathbf{x}$ is the list of unknowns, and $\mathbf{c}^\top\mathbf{x}$, read "c transpose x", is the cost: each unknown times its price, added up.
- $\mathbf{A}\mathbf{x} = \mathbf{b}$ holds every equation — dynamics, start and end conditions.
- $\mathbf{G}\mathbf{x} + \mathbf{s} = \mathbf{h}$ holds every inequality. The vector $\mathbf{s} = \mathbf{h} - \mathbf{G}\mathbf{x}$ is the **slack**: how much room each row has left.
- $\mathbf{s} \in \mathcal{K}$, read "s is in script K", says the slacks must lie in a **cone** — a set you can stretch by any positive factor and stay inside.

$\mathcal{K}$ is described by a tiny dictionary: how many plain nonnegative rows, then a list of second-order cone sizes, then any semidefinite or exponential blocks. Everything else — what your problem meant, the names — is gone.

::: example The two-engine LP as cone data
Take lesson 5's problem of splitting thrust between two engines: minimize $1.2T_1 + T_2$ subject to $T_1 + T_2 \ge 50$ and $0 \le T_i \le 30$ (thrusts in kN).

**Step 1: write every inequality as "something $\le$ something".** The demand flips to $-T_1 - T_2 \le -50$. The caps are $T_1 \le 30$, $T_2 \le 30$. The floors become $-T_1 \le 0$, $-T_2 \le 0$.

**Step 2: stack left sides into $\mathbf{G}$ and right sides into $\mathbf{h}$,** with $\mathbf{x} = (T_1, T_2)$:

$$
\mathbf{c} = \begin{bmatrix} 1.2 \\ 1\end{bmatrix}, \qquad
\mathbf{G} = \begin{bmatrix} -1 & -1 \\ 1 & 0 \\ 0 & 1 \\ -1 & 0 \\ 0 & -1\end{bmatrix}, \qquad
\mathbf{h} = \begin{bmatrix} -50 \\ 30 \\ 30 \\ 0 \\ 0\end{bmatrix}.
$$

No equality rows. The cone is $\mathcal{K} = \mathbb{R}^5_+$, read "R five plus": five slacks, each $\ge 0$. That is the whole problem as the solver sees it.

**Step 3: check the known answer.** At $\mathbf{x}^\star = (20, 30)$,

$$
\mathbf{s} = \mathbf{h} - \mathbf{G}\mathbf{x}^\star = (-50 + 50,\ 30 - 20,\ 30 - 30,\ 0 + 20,\ 0 + 30) = (0, 10, 0, 20, 30),
$$

all nonnegative, so it is feasible, with cost $1.2 \times 20 + 30 = 54$.

**Step 4: check the dual.** Lesson 9's dual, reordered to these rows, is $\mathbf{y} = (1.2, 0, 0.2, 0, 0)$, which lies in $\mathcal{K}^* = \mathbb{R}^5_+$. Dual feasibility needs $\mathbf{G}^\top\mathbf{y} + \mathbf{c} = \mathbf{0}$: $\mathbf{G}^\top\mathbf{y} = 1.2\,(-1, -1) + 0.2\,(0, 1) = (-1.2, -1.0)$, plus $(1.2, 1)$ gives $(0, 0)$. The dual objective is $-\mathbf{h}^\top\mathbf{y} = 50 \times 1.2 - 30 \times 0.2 = 54$. Zero gap.

**Sanity check.** Complementarity, $s_iy_i = 0$, holds in every row: the two rows with zero slack ($s_1$, $s_3$) are exactly the two with a price — the demand, and the cap on the cheap engine.

Lessons 7 and 9 are all visible here; where the problem came from is not. That is the trade the modeling layer manages for you.
:::

## Asking CVXPY

Here is the same problem written the way a person thinks about it.

```python
import cvxpy as cp

T = cp.Variable(2)                         # thrust of engines 1 and 2, kN
cons = [cp.sum(T) >= 50,                   # together at least 50 kN
        T >= 0, T <= 30]                   # each between 0 and 30 kN
prob = cp.Problem(cp.Minimize(1.2 * T[0] + T[1]), cons)
prob.solve(solver=cp.ECOS)

print(prob.status, round(prob.value, 4))   # did it work, and the best cost
print(T.value.round(4))                    # the best thrusts
print(round(cons[0].dual_value, 4))        # price of the 50 kN demand
print(cons[2].dual_value.round(4))         # prices of the two 30 kN caps

# optimal 54.0
# [20. 30.]
# 1.2
# [0.  0.2]
```

`cp.Variable(2)` makes two unknowns. The constraints go in a Python list. `cp.Problem` joins a goal to that list, and `solve` does the rest. Afterwards `prob.status` says how it went, `prob.value` is the best cost, `T.value` holds the answer, and each constraint's `dual_value` is its **[[price|shadow-price]]** — the same $1.2$ and $0.2$ you found by hand.

## How the translation works

CVXPY stores what you wrote as an **expression tree**: the outermost operation at the top, branching down to variables and numbers. Each building block — an **atom**, such as `norm(u, 2)`, `sum_squares`, `quad_over_lin` or `abs` — comes with a **graph implementation**: a recipe of extra variables and cone constraints whose best value equals the atom's value. The **[[epigraph|epigraph-picture]]** tricks of lesson 6 are exactly these recipes:

- `norm(u, 2) <= sigma` becomes one second-order cone block of size $\dim\mathbf{u} + 1$.
- A squared norm in the objective becomes a new scalar $s$ plus the rotated-cone identity

$$
\|\mathbf{y}\|^2 \le s \iff \|(2\mathbf{y},\ 1-s)\|_2 \le 1+s .
$$

That identity is **[[worth checking once|rotated-cone-why]]**. CVXPY applies the recipes from the bottom of the tree up, stacks the results, and hands the solver a matrix. The whole process is **canonicalization** — putting the problem into the one canonical shape.

## DCP: the rules for what you may write

CVXPY accepts only expressions built by the rules of **disciplined convex programming** (DCP). Think of a grammar checker: it does not understand your essay, but it can check that every sentence has a subject and a verb. DCP checks each node of the tree the same way, giving a *checkable* reason to believe the whole is convex.

Every expression carries two tags: a **sign** (positive, negative, unknown) and a **curvature** (constant, affine, convex, concave, unknown). Here affine means straight-line, convex means bowl-shaped, concave means dome-shaped. Variables start out affine; parameters and numbers are constants. Then:

- A sum of convex pieces is convex; a sum of concave pieces is concave. A positive multiple keeps the curvature; a negative multiple flips it.
- An affine function of affine pieces is affine.
- **The composition rule.** $f(g_1(\mathbf{x}), \dots, g_k(\mathbf{x}))$ is convex if $f$ is convex and, for each argument, either $f$ is nondecreasing in it and $g_i$ is convex, or $f$ is nonincreasing in it and $g_i$ is concave, or $g_i$ is affine. These are lesson 3's closure rules, made mechanical.
- A constraint is accepted if it is `convex <= concave`, `concave >= convex`, or `affine == affine`.

::: key
DCP tags every node with a sign and a curvature. Composition rule: $f(g(\mathbf{x}))$ is convex if $f$ is convex and ($f$ nondecreasing and $g$ convex) or ($f$ nonincreasing and $g$ concave) or $g$ affine. Accepted constraints: convex $\le$ concave, concave $\ge$ convex, affine $=$ affine. The rules are sufficient, not necessary.
:::

That last sentence is where most friction comes from. $\sqrt{x^2 + 1}$ is convex, but `sqrt(x**2 + 1)` fails. Walk up its **[[tree|expression-tree]]**: `sqrt` is concave and nondecreasing, its argument is convex, and the rule needs a concave argument there. Written as `norm(hstack([x, 1]), 2)` — the length of the vector $(x, 1)$, the same number — it passes, because a norm of an affine expression is always convex. Rewriting the *same function* so the rules can see it is a real skill.

::: warning The mistakes DCP catches, and the one it does not
**A norm on the wrong side.** `norm(u, 2) >= u_min` is the nonconvex minimum-throttle constraint of lessons 3 and 6, and CVXPY rejects it: `convex >= constant` is not an accepted form. The rejection is correct, and it is the whole reason lossless convexification exists. The cure is the slack $\Gamma$, not a solver flag.

**A product of variables.** `x * y` has unknown curvature and is rejected. Sometimes you meant `quad_over_lin(x, y)` or a rotated cone; sometimes the problem really is not convex and belongs in lesson 10.

**A variable on the bottom.** `1/x` is rejected for unknown sign. `inv_pos(x)`, the convex atom for $1/x$ on $x > 0$, is accepted.

What DCP does *not* catch is a problem that is convex, correctly written, and wrong: a glide-slope angle in degrees where the formula wants radians, a sign error in the dynamics, a time step too coarse to trust. Acceptance means "this is a convex program", never "this is your problem".
:::

::: example Writing the landing cones in CVXPY
A single-step thrust choice with lesson 6's three cones — magnitude, pointing, glide slope — and a linear objective. The vehicle is at $\mathbf{r} = (12, 5, 300)\,\mathrm{m}$ from the pad; guidance wants a sideways correction of $(1.0, -0.5)\,\mathrm{m/s^2}$ and at least $11\,\mathrm{m/s^2}$ of upward push.

```python
import cvxpy as cp
import numpy as np

u = cp.Variable(3)                  # thrust acceleration, m/s^2
sigma = cp.Variable()               # the lossless-convexification slack
r = np.array([12.0, 5.0, 300.0])    # current position, pad at the origin

gamma, theta = np.deg2rad(4.0), np.deg2rad(45.0)
cons = [
    cp.norm(u, 2) <= sigma,                        # thrust cone
    sigma >= 4.8, sigma <= 12.0,                   # throttle slab
    cp.norm(u, 2) * np.cos(theta) <= u[2],         # pointing
    cp.norm(r[:2], 2) <= r[2] * np.tan(gamma),     # glide slope (data only)
    u[:2] == np.array([1.0, -0.5]),                # sideways correction wanted
    u[2] >= 11.0,                                  # enough upward push to brake
]
prob = cp.Problem(cp.Minimize(sigma), cons)
prob.solve(solver=cp.ECOS, abstol=1e-8, reltol=1e-8)
print(prob.status, round(prob.value, 4))
print(u.value.round(4), round(float(sigma.value), 4))
print(round(float(cons[0].dual_value), 4))  # the price on the thrust cone

# optimal 11.0567
# [ 1.  -0.5 11. ] 11.0567
# 1.0
```

**Check by hand.** The cheapest $\sigma$ is the length of the smallest allowed $\mathbf{u} = (1, -0.5, 11)$: $\sqrt{1 + 0.25 + 121} = 11.0567$, inside the throttle slab ($4.8$ to $12$). The glide slope is only data here: $\sqrt{12^2 + 5^2} = 13\,\mathrm{m}$ against $300 \tan 4^\circ = 21.0\,\mathrm{m}$ allowed. Pointing holds: $11.0567 \cos 45^\circ = 7.82 \le 11$. The thrust cone's price is $1$: loosen it one unit and the cost drops by one.

Three habits worth copying. Name the constraint list, so duals can be read back by position — they are lesson 2's shadow prices and lesson 7's certificate. Check `prob.status` before touching `prob.value`: the informative outcomes are `optimal`, `optimal_inaccurate`, `infeasible` and `unbounded`, and only the first should be flown. And set tolerances yourself, because a default that suits a desktop study is not one you would certify.
:::

## The four solvers

Picture two ways down a dark staircase: a few big, careful steps, feeling the whole shape each time, or many small, cheap ones. The first is an **interior-point** method (lesson 9); the second is a **first-order** method.

**ECOS** is an interior-point solver for linear, second-order and exponential cones — lesson 9's algorithm with Nesterov–Todd scaling and the homogeneous self-dual embedding. It is a few thousand lines of library-free **[[ANSI C|ansi-c]]**. It fixes its sparse $\mathbf{L}\mathbf{D}\mathbf{L}^\top$ factorization order once, from the sparsity pattern, and never pivots. That is what makes it embeddable: the memory and the arithmetic of a solve are fixed before the first iteration. ECOS was long CVXPY's default for SOCPs and is the ancestor of most embedded conic solvers.

**SCS**, the Splitting Conic Solver, is first-order: it applies **[[ADMM|admm-word]]** (the alternating direction method of multipliers) to the self-dual embedding. Each iteration is a projection onto the cone plus a linear solve with a *fixed* matrix, so one factorization serves the whole run — or conjugate gradients solve the system with no factorization at all. SCS handles semidefinite and exponential cones and scales to problems far too big for interior point. It reaches three or four digits quickly, then slows. Use it when the problem is huge and the accuracy needed is loose.

**OSQP** is ADMM specialized to lesson 5's QP. It factorizes one quasi-definite matrix, built from $\mathbf{P}$, $\mathbf{A}$ and two step parameters; after that every iteration is two triangular solves and a projection onto a box — no division, no branching of consequence. It warm starts extremely well, detects infeasibility, and has a code generator. For a model-predictive controller re-solving a slightly changed QP at a few hundred hertz it is often the right answer.

**Clarabel** is a newer interior-point solver written in Rust, with Python and Julia interfaces, supporting the symmetric cones plus exponential, power and generalized-power cones. It ships with recent CVXPY releases and is the default for many conic problems — ECOS's family, with more cones.

::: key Which solver, and why
ECOS and Clarabel: interior point on a conic problem, tens of iterations, high accuracy, a bounded amount of work per iteration, no useful warm start. SCS: first-order on a conic problem, hundreds to thousands of cheap iterations, low to moderate accuracy, handles very large problems and SDP. OSQP: first-order specialized to QP, one factorization reused, excellent warm starts, ideal for repeated solves of a slowly changing QP. Choose an interior-point solver when you need accuracy and a predictable iteration count; choose a first-order solver when the problem is large, the accuracy demand is modest, or the same problem is solved over and over.
:::

## What one iteration of the landing SOCP costs

Lesson 6 built the discretized problem and promised this accounting. It has $n = 1107$ variables, $p = 713$ equality rows, and $m = 1603$ cone rows over $401$ second-order cones and $100$ nonnegative rows. Each interior-point iteration solves

$$
\begin{bmatrix} \mathbf{0} & \mathbf{A}^\top & \mathbf{G}^\top \\ \mathbf{A} & \mathbf{0} & \mathbf{0} \\ \mathbf{G} & \mathbf{0} & -\mathbf{W}^2\end{bmatrix}
\begin{bmatrix} \Delta\mathbf{x} \\ \Delta\mathbf{y} \\ \Delta\mathbf{z}\end{bmatrix} = \mathbf{r},
$$

of size $n + p + m = 3423$. $\Delta\mathbf{x}$, read "delta x", is the step, and $\mathbf{W}$ is the Nesterov–Todd scaling. $\mathbf{W}^2$ is block diagonal — one block per cone, none bigger than $4 \times 4$, each inverted by a short formula — so $\Delta\mathbf{z}$ can be eliminated first, leaving the **reduced KKT system** of size $1107 + 713 = 1820$:

$$
\begin{bmatrix} \mathbf{G}^\top\mathbf{W}^{-2}\mathbf{G} & \mathbf{A}^\top \\ \mathbf{A} & \mathbf{0}\end{bmatrix}
\begin{bmatrix} \Delta\mathbf{x} \\ \Delta\mathbf{y}\end{bmatrix} = \tilde{\mathbf{r}}.
$$

Now count its **nonzeros**, the entries that are not zero. Each dynamics ("defect") row touches the state at node $k$ ($7$ numbers), the control on step $k$ ($4$) and the state at node $k+1$ ($7$): $18$ entries, over $700$ rows, plus $13$ boundary rows. Each cone adds a small dense block to $\mathbf{G}^\top\mathbf{W}^{-2}\mathbf{G}$: $4 \times 4$ for a thrust cone, $3 \times 3$ for pointing and glide slope, $2 \times 2$ for the throttle rows.

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

Read the result slowly. The matrix is only $0.89\,\%$ filled. With the variables ordered by time node, its nonzeros sit in a narrow stripe along the diagonal — it is **[[banded|banded-picture]]**, with a **half-bandwidth** $b$ (how far the stripe reaches from the diagonal) of about $25$: one node's state and control plus the defect rows tying neighbors together.

A banded $\mathbf{L}\mathbf{D}\mathbf{L}^\top$ factorization costs about $Mb^2 = 1820 \times 25^2 \approx 1.1$ million **[[flops|flops-word]]**. Lesson 9's predictor-corrector reuses it for three back-substitutions at about $4Mb \approx 180$ thousand each. One iteration is about $1.7$ million floating-point operations; a $25$-iteration solve about $4.2 \times 10^7$. Treating the matrix as full would cost $M^3/3 \approx 2 \times 10^9$ per iteration, about $1{,}200$ times worse — and lesson 8's semidefinite formulation would be worse still.

::: key
Landing SOCP at $N = 100$: reduced KKT $1820 \times 1820$, $0.89\,\%$ dense, half-bandwidth $\approx 25$. About $1.7\times10^6$ flops per interior-point iteration and $4.2\times10^7$ per $25$-iteration solve; a dense factorization would be $2\times10^9$ per iteration.
:::

::: note First-order methods on the same problem
In the OSQP style, the factorization happens once and each iteration costs two triangular solves, about $4Mb \approx 1.8\times10^5$ operations — roughly ten times cheaper than an interior-point iteration. But ADMM converges linearly, not superlinearly: where interior point needed $25$ iterations for eight digits, a first-order method typically needs several hundred for three or four. At $500$ iterations that is $9.1\times10^7$ operations against $4.2\times10^7$: more work for less accuracy, from a cold start. The picture flips when the problem barely changes between solves. A warm-started ADMM may converge in $20$ iterations, about $3.6\times10^6$ operations, beating interior point by an order of magnitude — because, as lesson 9 showed, interior point cannot be usefully warm started. That is the case for OSQP in a fast control loop, and against it for a guidance solve that must hit a hard deadline from an unpredictable state.
:::

## Parameters, and the road to generated code

A guidance solver solves the *same* problem with different numbers every cycle: the state changes, the mass drops, the structure stays fixed. CVXPY expresses this with `cp.Parameter` objects in place of the changing numbers. If every parameter enters **affinely** (in straight-line fashion) in the right places, the problem obeys the **disciplined parametrized programming** (DPP) rules. Then the map from parameter values to cone data is itself affine, so it can be worked out once and reused: canonicalization becomes a one-off cost instead of a per-solve one.

That is what makes code generation possible, and where the next lesson starts. CVXPYgen and the OSQP and ECOS code generators take a parametrized problem and write C code with the sparsity pattern, elimination order and workspace as fixed constants — no modeling layer and no memory allocation left at runtime.

::: warning Canonicalization is not free, and defaults are not specifications
First, time canonicalization separately from the solve. At this size, building the cone data in Python can take longer than solving, and a loop that adds constraints one node at a time is slower still. Write constraints in vector form and use parameters.

Second, a default tolerance is a compromise for interactive use. ECOS defaults to roughly $10^{-8}$ on the residuals, SCS to around $10^{-4}$ — three orders of magnitude apart. A trajectory that looks fine at $10^{-4}$ may break a glide slope by centimeters or a throttle bound by a percent. Set tolerances from the engineering requirement, then check `prob.status` and the residuals.
:::

## Check yourself

::: check
CVXPY rejects `cp.sqrt(cp.square(x) + 1) <= t` as not DCP, although the left side is a convex function of $x$. Explain the rejection using the composition rule, and give an accepted rewriting.
:::

::: answer
The outer function $\sqrt{\cdot}$ is **concave** and nondecreasing; its argument $x^2 + 1$ is convex. A concave nondecreasing function of a convex argument gets curvature "unknown", so the constraint reads `unknown <= affine` and is rejected. The rules are sufficient, not necessary: the composite really is convex, but the tags cannot see it. The accepted rewriting is `cp.norm(cp.hstack([x, 1]), 2) <= t` — a norm of an affine argument, always allowed. It canonicalizes to one second-order cone block of size $3$, which is what you want anyway.
:::

::: check
Given the cone data $(\mathbf{c}, \mathbf{G}, \mathbf{h}, \mathcal{K})$ of the two-engine example and a claimed solution $\mathbf{x} = (25, 25)$ with dual $\mathbf{y} = (1.0, 0, 0, 0, 0)$, verify or refute optimality using only matrix arithmetic.
:::

::: answer
**Primal:** $\mathbf{s} = \mathbf{h} - \mathbf{G}\mathbf{x} = (-50 + 50,\ 30 - 25,\ 30 - 25,\ 25,\ 25) = (0, 5, 5, 25, 25)$, all nonnegative, so $\mathbf{x}$ is feasible with cost $1.2 \times 25 + 25 = 55$.

**Dual:** $\mathbf{y} \ge \mathbf{0}$, but $\mathbf{G}^\top\mathbf{y} + \mathbf{c} = (-1.0 + 1.2,\ -1.0 + 1.0) = (0.2, 0) \ne \mathbf{0}$. So $\mathbf{y}$ is not dual feasible and certifies nothing — and indeed $55 > 54$. Had the dual residual been zero, the gap $\mathbf{c}^\top\mathbf{x} + \mathbf{h}^\top\mathbf{y}$ would have decided it. Order matters: primal residual, dual residual, then gap. A gap from an infeasible dual point means nothing, as lesson 7 warned.
:::

::: check
A colleague reports that switching the landing SOCP from ECOS to SCS made it "ten times faster". What would you ask before believing the comparison means anything?
:::

::: answer
What tolerance each solver was given, and whether the trajectories meet the constraints to the accuracy the vehicle needs. SCS's default is several orders of magnitude looser than ECOS's, so "ten times faster" may mean "stopped at three digits instead of eight". Ask for the final primal residual, dual residual and duality gap of each; whether the SCS trajectory keeps the glide slope and throttle bounds within the vehicle's margins; whether the timing was cold or warm; and whether canonicalization was included. Then rerun both at the *same* residual tolerances. Mismatched tolerances measure nothing.
:::

::: check
The reduced KKT matrix has half-bandwidth about $25$. What in the problem sets that number, and what would happen to the per-iteration cost if a constraint coupled every time node to every other?
:::

::: answer
Each equation touches at most two neighboring nodes: a defect row ties node $k$'s state ($7$), step $k$'s control ($4$) and node $k+1$'s state ($7$), and every cone touches one node. Ordering the unknowns node by node keeps the nonzeros in a band about one node's variables plus its defect rows wide — about $18$ to $25$.

A constraint over all nodes — a total-propellant row over every $\sigma_k$, or a free final time in every dynamics row — wrecks the band. That dense row causes fill-in across the whole factor, and the cost heads back toward the dense $M^3/3 \approx 2\times10^9$. The cures: keep such couplings to a handful of rows treated as a dense border by the ordering, or handle them with a low-rank update. It is also why lesson 6 kept $t_f$ out of the problem and searched over it from outside.
:::

::: check
You are choosing a solver for a model-predictive attitude controller running at $100\,\mathrm{Hz}$ on a QP with $300$ variables whose data changes slightly each cycle. Which solver, and what is the argument?
:::

::: answer
OSQP, or an active-set QP solver. The structure is fixed, so OSQP's single factorization is paid once at startup; each cycle then costs two triangular solves per iteration, and since last cycle's answer is an excellent start, the iterations fall to a handful. An interior-point solver would need an essentially cold solve every cycle — lesson 9 showed why it cannot warm start from a boundary point — and tens of iterations for accuracy the controller does not need. What would change the answer: active constraints that jump violently between cycles, or a hard per-cycle deadline that must be certified rather than met on average. Then interior point's predictable iteration count is worth its cost — the subject of the next lesson.
:::

## Summary

| Object | Statement |
| --- | --- |
| Conic standard form | minimize $\mathbf{c}^\top\mathbf{x}$ s.t. $\mathbf{A}\mathbf{x} = \mathbf{b}$, $\mathbf{G}\mathbf{x} + \mathbf{s} = \mathbf{h}$, $\mathbf{s} \in \mathcal{K}$ |
| Canonicalization | Atoms get graph implementations (epigraph variables plus cone rows), giving $(\mathbf{c}, \mathbf{A}, \mathbf{b}, \mathbf{G}, \mathbf{h}, \mathcal{K})$ |
| Two-engine cone data | $\mathbf{h} = (-50, 30, 30, 0, 0)$, $\mathcal{K} = \mathbb{R}^5_+$; $\mathbf{s} = (0,10,0,20,30)$, $\mathbf{y} = (1.2,0,0.2,0,0)$ |
| CVXPY pattern | `Variable`, constraint list, `Problem`, `solve`; check `status` before `value` and `dual_value` |
| DCP | Sign and curvature tags; convex $\le$ concave, concave $\ge$ convex, affine $=$ affine |
| Composition rule | $f$ convex and ($f$ nondecreasing, $g$ convex) or ($f$ nonincreasing, $g$ concave) or $g$ affine |
| ECOS / Clarabel | Interior point; ECOS in library-free ANSI C with fixed ordering; Clarabel in Rust with more cones |
| SCS / OSQP | ADMM; SCS for huge conic problems and SDP; OSQP for QP, one factorization, strong warm starts |
| Landing SOCP cost | Reduced KKT $1820 \times 1820$, $29{,}435$ nonzeros, $0.89\,\%$ dense, $b \approx 25$ |
| Per iteration / solve | $\approx 1.7\times10^6$ flops; $4.2\times10^7$ at $25$ iterations; dense $2\times10^9$ per iteration |
| DPP | Affine parameters let canonicalization happen once — the precondition for code generation |

The last lesson takes these $4.2\times10^7$ operations, puts them inside a guidance cycle on a flight computer, and asks what has to change before anyone would let the solver fire an engine.

::: context cvxpy-history Where CVXPY came from
CVXPY grew out of CVX, a modeling tool for MATLAB written by Michael Grant and Stephen Boyd at Stanford in the mid-2000s. The rule system it uses, disciplined convex programming, was set out by Grant, Boyd and Yinyu Ye around the same time. Steven Diamond and Stephen Boyd then built CVXPY for Python and described it in a 2016 paper. It is free and open source, which is why it turns up in university courses and in aerospace research groups alike. The "CVX" in all these names stands for "convex".
:::

::: context shadow-price The dual value is a price tag
Lesson 2 showed that a constraint's multiplier says how much the best cost would improve if you loosened that constraint by one unit. CVXPY hands you that number as `dual_value`. Here the demand constraint has price $1.2$: asking for $51\,\mathrm{kN}$ instead of $50$ would cost $1.2$ more, because the extra kilonewton must come from engine 1, the expensive one. The cap on engine 2 has price $0.2$: raising it to $31\,\mathrm{kN}$ lets you swap one kilonewton from engine 1 to engine 2, saving $1.2 - 1 = 0.2$. A price of zero means the limit is not pinching at all.
:::

::: context epigraph-picture Standing on top of the graph
The **epigraph** of a function is everything on or above its graph ("epi" is Greek for "on top of"). To handle $|x|$, a solver adds a new number $t$ and asks for the point $(x, t)$ to lie in the shaded region: $t \ge x$ and $t \ge -x$. Those are two plain linear inequalities. Minimizing $t$ pushes the point down onto the V, so the best $t$ equals $|x|$. Every atom's graph implementation is a trick of this kind.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <polygon points="60,20 180,140 300,20" fill="#8fb8f0"/>
  <line x1="30" y1="140" x2="330" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="160" x2="180" y2="12" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline points="60,20 180,140 300,20" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <text x="336" y="144" font-size="12" fill="#1f2a44">x</text>
  <text x="186" y="18" font-size="12" fill="#1f2a44">t</text>
  <text x="180" y="70" font-size="12" text-anchor="middle" fill="#1f2a44">t ≥ |x|</text>
  <text x="298" y="60" font-size="12" fill="#1d6fd1">t = |x|</text>
  <text x="120" y="158" font-size="11" text-anchor="middle" fill="#1f2a44">−2</text>
  <text x="240" y="158" font-size="11" text-anchor="middle" fill="#1f2a44">2</text>
  <line x1="120" y1="137" x2="120" y2="143" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="240" y1="137" x2="240" y2="143" stroke="#1f2a44" stroke-width="1.5"/>
</svg>
```
:::

::: context rotated-cone-why Why the rotated-cone identity holds
Start from the right side, $\|(2\mathbf{y}, 1-s)\|_2 \le 1+s$. Both sides are nonnegative, so square them:

$$
4\|\mathbf{y}\|^2 + (1-s)^2 \le (1+s)^2 .
$$

Expand: $(1+s)^2 - (1-s)^2 = 4s$. So the inequality says $4\|\mathbf{y}\|^2 \le 4s$, which is $\|\mathbf{y}\|^2 \le s$. Every step runs both ways (the cone form also forces $1 + s \ge 0$, which $\|\mathbf{y}\|^2 \le s$ already guarantees). Try $\mathbf{y} = 3$, $s = 9$: the left side is $\|(6, -8)\| = 10$ and the right side is $10$. Equal, as it should be, since $3^2 = 9$ exactly.
:::

::: context expression-tree Where the rule check fails
CVXPY reads `sqrt(x**2 + 1)` as a tree and tags each node from the bottom up. The variable is affine; squaring it gives convex; adding the constant $1$ keeps it convex. At the top, `sqrt` is concave. A concave outer function needs a concave or affine argument, and it got a convex one, so the top node is tagged unknown.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="180" y1="38" x2="180" y2="70"/>
    <line x1="180" y1="94" x2="120" y2="124"/>
    <line x1="180" y1="94" x2="250" y2="124"/>
    <line x1="120" y1="148" x2="120" y2="164"/>
  </g>
  <rect x="140" y="14" width="80" height="24" rx="6" fill="#fff" stroke="#b4232c" stroke-width="2"/>
  <text x="180" y="31" font-size="12" text-anchor="middle" fill="#1f2a44">sqrt</text>
  <text x="228" y="24" font-size="11" fill="#b4232c">concave of convex</text>
  <text x="228" y="38" font-size="11" fill="#b4232c">so: unknown</text>
  <rect x="150" y="70" width="60" height="24" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="87" font-size="12" text-anchor="middle" fill="#1f2a44">+</text>
  <text x="218" y="87" font-size="11" fill="#1d6fd1">convex</text>
  <rect x="85" y="124" width="70" height="24" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="120" y="141" font-size="12" text-anchor="middle" fill="#1f2a44">square</text>
  <text x="30" y="141" font-size="11" fill="#1d6fd1">convex</text>
  <rect x="225" y="124" width="50" height="24" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="250" y="141" font-size="12" text-anchor="middle" fill="#1f2a44">1</text>
  <text x="283" y="141" font-size="11" fill="#6c7a93">constant</text>
  <rect x="95" y="164" width="50" height="24" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="120" y="181" font-size="12" text-anchor="middle" fill="#1f2a44">x</text>
  <text x="153" y="181" font-size="11" fill="#6c7a93">affine</text>
</svg>
```
:::

::: context ansi-c Why plain C still rules on spacecraft
C is a programming language from the early 1970s. "ANSI C" means the version fixed by the American National Standards Institute in 1989. Almost every processor ever flown has a C compiler, and C lets the programmer see and control exactly how much memory is used and when. "Library-free" means the solver calls nothing outside its own files — no math package, no operating-system services. That is exactly what flight software reviewers want: code they can read end to end, with nothing hidden underneath.
:::

::: context admm-word Taking turns
ADMM splits a hard problem into two easier halves and lets them take turns. Picture two people packing one suitcase: one arranges the clothes as well as possible while ignoring the lid, then the other presses the lid shut and pushes back whatever sticks out. Each round, a running tally — the "multipliers" — records how much the two still disagree, and the next round corrects for it. In SCS and OSQP one half is a linear solve and the other is a projection onto the cone or box. Each round is cheap, but many rounds are needed.
:::

::: context banded-picture A matrix with a stripe
In a banded matrix every nonzero entry lies within a fixed distance of the diagonal. This small example has half-bandwidth $2$: in each row, only the diagonal and the two entries on each side can be nonzero. The landing matrix looks the same, only $1820$ rows tall with half-bandwidth about $25$. Factorizing it only ever touches the stripe, which is why the cost grows like $Mb^2$ rather than $M^3$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="10" width="160" height="160" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <g fill="#1d6fd1">
    <rect x="21" y="11" width="18" height="18"/><rect x="41" y="11" width="18" height="18"/><rect x="61" y="11" width="18" height="18"/>
    <rect x="21" y="31" width="18" height="18"/><rect x="41" y="31" width="18" height="18"/><rect x="61" y="31" width="18" height="18"/><rect x="81" y="31" width="18" height="18"/>
    <rect x="21" y="51" width="18" height="18"/><rect x="41" y="51" width="18" height="18"/><rect x="61" y="51" width="18" height="18"/><rect x="81" y="51" width="18" height="18"/><rect x="101" y="51" width="18" height="18"/>
    <rect x="41" y="71" width="18" height="18"/><rect x="61" y="71" width="18" height="18"/><rect x="81" y="71" width="18" height="18"/><rect x="101" y="71" width="18" height="18"/><rect x="121" y="71" width="18" height="18"/>
    <rect x="61" y="91" width="18" height="18"/><rect x="81" y="91" width="18" height="18"/><rect x="101" y="91" width="18" height="18"/><rect x="121" y="91" width="18" height="18"/><rect x="141" y="91" width="18" height="18"/>
    <rect x="81" y="111" width="18" height="18"/><rect x="101" y="111" width="18" height="18"/><rect x="121" y="111" width="18" height="18"/><rect x="141" y="111" width="18" height="18"/><rect x="161" y="111" width="18" height="18"/>
    <rect x="101" y="131" width="18" height="18"/><rect x="121" y="131" width="18" height="18"/><rect x="141" y="131" width="18" height="18"/><rect x="161" y="131" width="18" height="18"/>
    <rect x="121" y="151" width="18" height="18"/><rect x="141" y="151" width="18" height="18"/><rect x="161" y="151" width="18" height="18"/>
  </g>
  <line x1="200" y1="100" x2="240" y2="100" stroke="#1d6fd1" stroke-width="8"/>
  <text x="248" y="104" font-size="12" fill="#1f2a44">nonzero</text>
  <rect x="200" y="122" width="40" height="14" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="248" y="134" font-size="12" fill="#1f2a44">zero</text>
  <text x="200" y="40" font-size="12" fill="#1f2a44">8 × 8 matrix</text>
  <text x="200" y="60" font-size="12" fill="#1f2a44">half-bandwidth b = 2</text>
</svg>
```
:::

::: context flops-word What a flop is
A **flop** is one floating-point operation: one addition, subtraction, multiplication or division of two decimal numbers inside a computer. "Floating point" is the computer's version of scientific notation, like $1.82 \times 10^5$. Counting flops is a rough but honest way to compare algorithms before any code exists, and it turns into time once you know how many flops per second the processor can sustain. A modern laptop manages billions per second; many older flight computers manage far fewer, which is exactly the problem the next lesson faces.
:::
