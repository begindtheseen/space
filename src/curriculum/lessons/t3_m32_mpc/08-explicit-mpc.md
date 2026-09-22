---
id: l08-explicit-mpc
title: Explicit MPC and multi-parametric programming
minutes: 20
covers:
  - Explicit MPC and multi-parametric programming
---

The controller solves the same quadratic program every cycle. The Hessian is constant, the constraint matrices are constant, and the only thing that changes is the current state, which enters through the linear cost term $\mathbf{f} = \mathbf{F}\mathbf{x}$ and the right-hand sides of the state-constraint rows. A problem whose data depends on a parameter in this way is a **multi-parametric quadratic program**, and such problems can be solved *once, offline, for every value of the parameter at the same time*.

The result is not a number but a function: the optimal first input as an explicit formula in the state. Evaluating it online is a table lookup and a matrix-vector product, with no iterations, no factorisation and no solver. For a small problem that turns a control cycle with an optimiser in it into one with arithmetic in it — a decisive advantage when the sample rate is in kilohertz, the processor is tiny, or the certification authority is unenthusiastic about iterative numerics in a flight loop.

The catch is the size of the table, and this lesson quantifies both sides: the structure that makes the offline solution possible, and the region count that limits how far it scales.

## Why the solution is piecewise affine

Fix an **active set** $\mathcal{A}$ — a guess at which inequality constraints hold with equality at the optimum. On that active set the KKT conditions of the optimization module are linear:

$$
\mathbf{H}\mathbf{U} + \mathbf{F}\mathbf{x} + \mathbf{G}_{\mathcal{A}}^\top\boldsymbol{\lambda}_{\mathcal{A}} = \mathbf{0},
\qquad
\mathbf{G}_{\mathcal{A}}\mathbf{U} = \mathbf{h}_{\mathcal{A}} + \mathbf{W}_{\mathcal{A}}\mathbf{x} ,
$$

where $\mathbf{W}_{\mathcal{A}}$ collects the state dependence of those constraint rows. Solving the first for $\mathbf{U}$ and substituting into the second gives

$$
\boldsymbol{\lambda}_{\mathcal{A}}(\mathbf{x}) = -\big(\mathbf{G}_{\mathcal{A}}\mathbf{H}^{-1}\mathbf{G}_{\mathcal{A}}^\top\big)^{-1}\big(\mathbf{h}_{\mathcal{A}} + (\mathbf{W}_{\mathcal{A}} + \mathbf{G}_{\mathcal{A}}\mathbf{H}^{-1}\mathbf{F})\mathbf{x}\big),
\qquad
\mathbf{U}(\mathbf{x}) = -\mathbf{H}^{-1}\big(\mathbf{F}\mathbf{x} + \mathbf{G}_{\mathcal{A}}^\top\boldsymbol{\lambda}_{\mathcal{A}}(\mathbf{x})\big) .
$$

Both are **affine in $\mathbf{x}$**. They are the optimal solution exactly where the guess is right, and the guess is right exactly where two families of linear inequalities hold: the multipliers of the active constraints are nonnegative, $\boldsymbol{\lambda}_{\mathcal{A}}(\mathbf{x}) \ge \mathbf{0}$, and the inactive constraints are satisfied, $\mathbf{G}_{i}\mathbf{U}(\mathbf{x}) \le h_i + \mathbf{W}_i\mathbf{x}$ for $i \notin \mathcal{A}$. Both families are affine in $\mathbf{x}$, so the set where the active set $\mathcal{A}$ is optimal is a polyhedron — its **critical region**.

Since every state has some optimal active set, the critical regions tile the feasible set, and on each one the law is affine. That gives the structure:

::: key Explicit MPC
For small problems, multiparametric programming precomputes the optimal law offline as a piecewise-affine function of the state over a polytopic partition. Online cost becomes a table lookup, but the number of regions explodes with state dimension and horizon.
:::

Two further properties come with convexity and are worth knowing because they are what make the table usable. The law $\boldsymbol{\kappa}_N$ is **continuous** across region boundaries — no jumps in the command as the state crosses a facet — and the value function $V_N^0$ is **convex and piecewise quadratic**. Continuity is not automatic for a general parametric program; it follows here from strict convexity of the QP, which is another reason to insist on $\mathbf{R} \succ 0$.

## The smallest case, in closed form

```python
import numpy as np

A = np.array([[1.0, 0.1], [0.0, 1.0]])
B = np.array([[0.005], [0.1]])
Q, R = np.eye(2), np.array([[0.1]])
P = np.array([[13.317224, 3.201562], [3.201562, 4.603514]])      # LQR cost-to-go

# One-step problem: J(u) = x'Qx + R u^2 + (Ax + Bu)' P (Ax + Bu), |u| <= 1
H = 2 * (float((B.T @ P @ B).ravel()[0]) + float(R[0, 0]))
F = 2 * (B.T @ P @ A).ravel()
Krh = F / H                                   # unconstrained law is u = -Krh x
print("unconstrained gain Krh =", np.round(Krh, 6))
print("region boundaries: Krh . x = +-1")

def explicit(x):
    """The explicit solution: three critical regions."""
    s = float(Krh @ x)
    if s > 1.0:
        return -1.0, "lower bound active"
    if s < -1.0:
        return +1.0, "upper bound active"
    return -s, "no constraint active"

grid = np.linspace(-1, 1, 400001)
for x in (np.array([0.05, 0.0]), np.array([0.3, 0.2]), np.array([-0.5, 0.0])):
    u_exp, region = explicit(x)
    xn = (A @ x)[:, None] + B * grid
    J = float(x @ Q @ x) + R[0, 0] * grid**2 + np.einsum('ij,ij->j', xn, P @ xn)
    u_grid = grid[int(np.argmin(J))]
    print(f"x = {x}  explicit u = {u_exp:+.6f} ({region:20s})  grid search u = {u_grid:+.6f}")

# unconstrained gain Krh = [2.585701 3.443436]
# region boundaries: Krh . x = +-1
# x = [0.05 0.  ]  explicit u = -0.129285 (no constraint active )  grid search u = -0.129285
# x = [0.3 0.2]    explicit u = -1.000000 (lower bound active   )  grid search u = -1.000000
# x = [-0.5  0. ]  explicit u = +1.000000 (upper bound active   )  grid search u = +1.000000
```

Three regions, checked against brute-force minimisation over a grid of $400{,}001$ candidate inputs. The explicit law for a one-step horizon with an input bound is the *saturated* unconstrained law — and with the Riccati terminal cost the unconstrained gain is the LQR gain to six decimals, so this particular explicit MPC is clipped LQR. That equivalence is exactly the reason the module keeps returning to the question of when MPC earns its complexity: at $N = 1$ with only input bounds, it does not.

## Counting the regions

Beyond the smallest case the partition has to be computed, by enumerating active sets and keeping the ones whose critical region is non-empty. For the running plant with the Riccati terminal cost, enumerated over a box $|x_1| \le 3$, $|x_2| \le 0.5$:

::: example Input bounds alone give a saturated gain
With input constraints only, $|u| \le 1$:

| $N$ | critical regions |
| --- | --- |
| $1$ | $3$ |
| $2$ | $5$ |
| $3$ | $7$ |

The pattern $2N+1$ is the obvious one: the interior region plus one region for each number of leading saturated steps, in each direction. For $N = 2$ the five regions are the unconstrained one, whose law is $u = -2.5857x_1 - 3.4434x_2$ (the LQR gain again), two regions where only the first input saturates, and two where both do, with laws $u = \pm 1$ — so a two-step explicit MPC is a saturated gain with a slightly more clever saturation boundary.

:::

::: example Adding a state constraint
Now impose the velocity constraint $|x_2| \le 0.5$ as well, and the count grows:

| $N$ | regions | total facets | storage | active sets examined |
| --- | --- | --- | --- | --- |
| $2$ | $13$ | $56$ | $1.62\,\mathrm{kB}$ | $37$ |
| $3$ | $25$ | $106$ | $3.07\,\mathrm{kB}$ | $299$ |
| $4$ | $41$ | $172$ | $4.99\,\mathrm{kB}$ | $2{,}517$ |
| $5$ | $61$ | $254$ | $7.38\,\mathrm{kB}$ | $21{,}700$ |

The region counts fit $2N^2 + 2N + 1$ exactly across these four horizons. Storage counts three doubles per facet and three per region gain. The last column is the number of candidate active sets the offline enumeration had to consider — growing far faster than the number that survive, which is why serious implementations use geometric region-exploration algorithms rather than brute-force enumeration.

Two checks are worth doing on any computed partition, and both pass here. The region areas sum to $6.0000$, exactly the area of the box, so the partition covers the feasible set without gaps or overlaps. And the region where no constraint is active is, to machine precision, the terminal set $O_\infty$ computed in the terminal-set lesson — same area to ten digits, same vertices, and the gain is the LQR gain. That is not a coincidence: "no constraint active anywhere in the horizon" and "the LQR law is admissible from here for the next $N$ steps" are the same condition, which is the construction of $O_\infty$.
:::

::: warning The region count is the whole problem
The numbers above are reassuring because the state has two dimensions. They stop being reassuring quickly. The number of critical regions is bounded by the number of possible active sets, which is combinatorial in the number of inequality constraints, and the constraint count grows with the horizon *and* with the state dimension. A six-state rendezvous model with three inputs, box constraints on each and a modest horizon has hundreds of constraint rows, and the partitions reported for problems of that size run to thousands or tens of thousands of regions — beyond what a flight computer's memory and a verification budget will take.

The other hazard is geometric. In the $N = 5$ partition the largest region has area $1.2167$ and the smallest $2.7\times10^{-4}$, a ratio of about $4500$. Slivers that thin are numerically awkward: a point-location routine using a tolerance of $10^{-6}$ can fail to place a state inside any region, or place it in two. Implementations therefore merge regions with identical gains, clip slivers, and fall back to the nearest region rather than declaring failure — and every one of those choices needs testing.
:::

## Evaluating the law online

Having the table, the online work is **point location**: find the region containing $\mathbf{x}$, then apply its affine law. Three approaches, in increasing sophistication.

**Sequential search** tests each region's inequalities in turn. The cost is the total number of facets, $254$ dot products of length $2$ for the $N = 5$ partition above — trivially cheap here, linear in the region count in general, and the simplest thing to certify: a fixed loop bound, no branching on data beyond the comparisons themselves.

**Binary search trees** over the partition's hyperplanes, as developed by Tøndel, Johansen and Bemporad, evaluate $O(\log)$ hyperplane tests instead of a linear scan, at the cost of a tree built offline that can be larger than the partition itself.

**Lattice and gain-merging representations** exploit the fact that many regions share the same affine law — in the $N = 2$ partition, four of the five regions have the law $u = \pm 1$ — and store the law once with a rule for selecting it.

Whichever is used, the timing property is the attraction: the online cost is a fixed, data-independent number of arithmetic operations, so the worst-case execution time is not an estimate, a percentile or a bound, but a count. That is the strongest real-time argument available, and it is the reason explicit MPC appears in fast, small, safety-relevant loops where an iterative solver would be hard to defend.

::: note Where explicit MPC actually fits
The decision is close to mechanical. If the state dimension is two or three, the horizon short, the constraints few and the sample rate high — an attitude-rate loop at $500\,\mathrm{Hz}$, a thruster-allocation problem, a single-axis actuator loop — compute the partition offline and check its size; a few hundred regions is comfortable. If the state dimension is six or more, or the horizon long, or the problem time-varying (a shrinking horizon, a changing mass, a moving target), the partition either explodes or must be recomputed, and an online solver with warm starting is the better answer. A useful middle path is to compute the explicit solution for a reduced problem and use it as the certified fallback law for an online MPC, which gives the fallback a provable region of attraction rather than a heuristic.
:::

## Check yourself

::: check
Explain why the critical region of a given active set is a polyhedron, and what the two families of inequalities defining it mean physically.
:::

::: answer
Because both conditions for "this active set is the right one" are affine in the state. The first, $\boldsymbol{\lambda}_{\mathcal{A}}(\mathbf{x}) \ge \mathbf{0}$, is dual feasibility: a multiplier is the price of the constraint, and a negative price means the optimiser would prefer to move *off* that constraint — the constraint is pushing in the wrong direction and should be dropped from the active set. The second, $\mathbf{G}_i\mathbf{U}(\mathbf{x}) \le h_i + \mathbf{W}_i\mathbf{x}$ for inactive rows, is primal feasibility: the plan computed on the assumption that those constraints are slack must actually respect them, or one of them must be added to the active set. Since $\boldsymbol{\lambda}_{\mathcal{A}}$ and $\mathbf{U}$ are affine functions of $\mathbf{x}$, both families are finite collections of half-spaces and their intersection is a polyhedron.
:::

::: check
The $N = 2$ explicit law has five regions, four of which command $u = \pm 1$. What does that say about the value of explicit MPC for this problem?
:::

::: answer
That at this horizon it buys very little over a clipped linear law. The law is $u = \mathrm{sat}(-\mathbf{K}_{\text{rh}}\mathbf{x})$ with a saturation boundary slightly reshaped by the second step's constraint, and the interior region's gain is the LQR gain. A saturated LQR implemented in three lines would behave almost identically and need no table, no point location and no verification of a partition. The value of explicit MPC appears where the partition is genuinely rich — when state constraints are active, when several inputs interact through a polytopic allocation, when a rate limit couples steps — and the honest test is to compute the partition and look at how many distinct gains it contains. Four regions sharing two gains is a signal to reach for the simpler controller.
:::

::: check
Your explicit partition has $1800$ regions and $9000$ facets for a four-state problem. Estimate the storage and the sequential point-location cost, and say whether you would fly it at $100\,\mathrm{Hz}$.
:::

::: answer
Each facet stores $n+1 = 5$ doubles and each region's gain stores $m(n+1)$; for a single input that is $5$ per region. Storage is about $9000\times5 + 1800\times5 = 54{,}000$ doubles, $432\,\mathrm{kB}$ — acceptable in flash on most flight processors, awkward if it must live in RAM on a small one. Sequential point location evaluates up to $9000$ inner products of length $4$, about $72{,}000$ flops, which at even $50\,\mathrm{MFLOP/s}$ is $1.4\,\mathrm{ms}$ against a $10\,\mathrm{ms}$ frame: comfortable, deterministic, and far cheaper than a QP solve. So the timing is fine and the decision turns on verification: $1800$ regions is $1800$ affine laws to review, and the argument that the table was computed correctly — that it covers the feasible set, that the laws are continuous across facets, that the point-location tolerance never lands between regions — has to be made once, carefully, with the partition treated as generated code and tested against the online solver over a dense sample of states.
:::

::: check
Why is the value function piecewise quadratic rather than piecewise affine, and what is one practical use for it?
:::

::: answer
On each critical region the optimal input is affine in the state, $\mathbf{U}(\mathbf{x}) = \mathbf{E}\mathbf{x} + \mathbf{e}$, and the cost is a quadratic in $\mathbf{U}$ and $\mathbf{x}$. Substituting an affine function into a quadratic gives a quadratic, so $V_N^0$ restricted to a region is quadratic, and the pieces join continuously with matching gradients into a convex function overall. One practical use is the Lyapunov monitor of the terminal-cost lesson: with the explicit solution in hand, the value function is available in closed form, so the flight software can evaluate both the command and its Lyapunov certificate with the same table lookup, and flag any cycle where the expected decrease fails to appear. Another is bounding: the maximum of $V_N^0$ over the region of attraction is computable offline, which turns "the controller works over this set" into a number.
:::

::: check
A colleague proposes computing the explicit solution for a shrinking-horizon landing guidance, arguing that the offline computation removes the flight solver. What is the problem?
:::

::: answer
A shrinking horizon means the problem changes at every step: $N_k = N_{\text{total}} - k$, so the mp-QP is a different problem each cycle and the partition would have to be computed and stored once per cycle of the descent — dozens of partitions, each with its own region count, and all of them invalidated if the planned time of flight changes. The same objection applies to any time-varying problem: a vehicle whose mass, thrust limit or aerodynamic coefficients change through the trajectory has a different parametric problem at each point, and the parameter vector would have to be extended to include mass and time, raising the dimension of the parameter space and multiplying the region count. Explicit MPC suits time-invariant problems in few states. Powered descent is neither, which is why it is flown with an online convex solver.
:::

## Summary

| Object | Statement |
| --- | --- |
| Parametric structure | $\mathbf{f} = \mathbf{F}\mathbf{x}$ and constraint right-hand sides affine in $\mathbf{x}$: a multi-parametric QP |
| Solution on an active set | $\boldsymbol{\lambda}_{\mathcal{A}}(\mathbf{x})$ and $\mathbf{U}(\mathbf{x})$ affine in $\mathbf{x}$ from the KKT equations |
| Critical region | $\{\mathbf{x} : \boldsymbol{\lambda}_{\mathcal{A}}(\mathbf{x}) \ge \mathbf{0},\ \mathbf{G}_i\mathbf{U}(\mathbf{x}) \le h_i + \mathbf{W}_i\mathbf{x}\ \forall i \notin \mathcal{A}\}$, a polyhedron |
| The law | $\boldsymbol{\kappa}_N$ continuous piecewise affine; $V_N^0$ convex piecewise quadratic |
| Input bounds only | $2N+1$ regions; $N = 1$ gives saturated LQR, verified against a grid search |
| With a state constraint | $13$, $25$, $41$, $61$ regions at $N = 2,3,4,5$; fits $2N^2 + 2N + 1$; $7.38\,\mathrm{kB}$ at $N = 5$ |
| Partition checks | Region areas sum to the box area; the unconstrained region equals $O_\infty$ with the LQR gain |
| Limits | Region count combinatorial in constraint count; sliver regions ($4500{:}1$ area ratio at $N = 5$) |
| Online evaluation | Point location: sequential scan, binary search tree, or gain merging; fixed operation count |
| Use when | Two or three states, short horizon, high rate, time-invariant; otherwise online QP with warm starting |

The next lesson leaves the linear world: nonlinear MPC, where the prediction model is the real one, and economic MPC, where the cost is money or propellant rather than a tracking error.
