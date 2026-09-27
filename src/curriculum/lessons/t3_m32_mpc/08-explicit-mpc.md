---
id: l08-explicit-mpc
title: Explicit MPC and multi-parametric programming
minutes: 21
covers:
  - Explicit MPC and multi-parametric programming
---

Think about a times table. You could work out $7 \times 8$ by adding seven eights every time someone asks. Or you could work out the whole table once, pin it on the wall, and from then on only *look up* the answer. The lookup is faster, it never makes an arithmetic slip, and it always takes the same time. The price is the wall space — and a times table up to $1000 \times 1000$ would not fit on any wall.

Explicit MPC is the times-table idea applied to a controller. The MPC loop solves the same quadratic program every cycle. The Hessian $\mathbf{H}$ never changes. The constraint matrices never change. The only thing that changes is the current state $\mathbf{x}$. It enters in two places: the linear cost term $\mathbf{f} = \mathbf{F}\mathbf{x}$, and the right-hand sides of the state-constraint rows. A problem whose data depends on a changing input like this is a **[[multi-parametric quadratic program|mpqp-history]]** (mp-QP). The state is the **parameter**. And such a problem can be solved *once, offline, for every value of the parameter at the same time*.

The answer is not a number but a function: the best first input written as an explicit formula in the state. Using it online is a table lookup and a matrix-vector product. There are no iterations, no factorization, no solver. For a small problem, that turns a control cycle with an optimizer in it into one with plain arithmetic in it. That is a big win when the sample rate is in the kilohertz, the processor is tiny, or the certification authority is uneasy about iterative numerics in a flight loop.

The catch is the size of the table. This lesson measures both sides: the structure that makes the offline solution possible, and the region count that limits how far it scales.

## Why the solution is piecewise affine

### Guess which fences you touch

Picture a ball rolling to the lowest point of a bowl inside a fenced yard. Sometimes it settles in the middle, touching no fence. Sometimes it rolls against one fence, or wedges into a corner against two. If you knew in advance *which* fences it ends up touching, finding the resting point would be easy: treat those fences as walls it slides along and ignore the rest.

That guess has a name. An **[[active set|active-set-picture]]** $\mathcal{A}$ (a curly A) is the list of inequality constraints that hold with equality — exactly at their limit — at the optimum. Once you fix $\mathcal{A}$, the **[[KKT conditions|kkt-names]]** from the optimization module (the equations every constrained optimum must satisfy) become *linear* equations:

$$
\mathbf{H}\mathbf{U} + \mathbf{F}\mathbf{x} + \mathbf{G}_{\mathcal{A}}^\top\boldsymbol{\lambda}_{\mathcal{A}} = \mathbf{0},
\qquad
\mathbf{G}_{\mathcal{A}}\mathbf{U} = \mathbf{h}_{\mathcal{A}} + \mathbf{W}_{\mathcal{A}}\mathbf{x} .
$$

Here is what each symbol is:

- $\mathbf{U}$ is the stacked input sequence, the thing we solve for.
- $\mathbf{G}_{\mathcal{A}}$, $\mathbf{h}_{\mathcal{A}}$ and $\mathbf{W}_{\mathcal{A}}$ are the rows of the constraint $\mathbf{G}\mathbf{U} \le \mathbf{h} + \mathbf{W}\mathbf{x}$ that belong to the active set. $\mathbf{W}_{\mathcal{A}}$ collects how those rows depend on the state.
- $\boldsymbol{\lambda}_{\mathcal{A}}$ ("lambda sub A") are the **[[Lagrange multipliers|multiplier-price]]** of the active constraints: how hard each fence is pushing back.

The first equation says the cost's downhill pull is exactly balanced by the fences. The second says the active fences are touched exactly.

Solve the first for $\mathbf{U}$ and put that into the second. You get

$$
\boldsymbol{\lambda}_{\mathcal{A}}(\mathbf{x}) = -\big(\mathbf{G}_{\mathcal{A}}\mathbf{H}^{-1}\mathbf{G}_{\mathcal{A}}^\top\big)^{-1}\big(\mathbf{h}_{\mathcal{A}} + (\mathbf{W}_{\mathcal{A}} + \mathbf{G}_{\mathcal{A}}\mathbf{H}^{-1}\mathbf{F})\mathbf{x}\big),
\qquad
\mathbf{U}(\mathbf{x}) = -\mathbf{H}^{-1}\big(\mathbf{F}\mathbf{x} + \mathbf{G}_{\mathcal{A}}^\top\boldsymbol{\lambda}_{\mathcal{A}}(\mathbf{x})\big) .
$$

Both are **[[affine|affine-word]] in $\mathbf{x}$**: a matrix times $\mathbf{x}$ plus a constant.

::: note Why the substitution works, step by step
Start from the balance equation and multiply on the left by $\mathbf{H}^{-1}$ (which exists because $\mathbf{H}$ is positive definite):

$$
\mathbf{U} = -\mathbf{H}^{-1}\big(\mathbf{F}\mathbf{x} + \mathbf{G}_{\mathcal{A}}^\top\boldsymbol{\lambda}_{\mathcal{A}}\big).
$$

Multiply by $\mathbf{G}_{\mathcal{A}}$ and set the result equal to the right side of the second equation:

$$
-\mathbf{G}_{\mathcal{A}}\mathbf{H}^{-1}\mathbf{F}\mathbf{x} - \mathbf{G}_{\mathcal{A}}\mathbf{H}^{-1}\mathbf{G}_{\mathcal{A}}^\top\boldsymbol{\lambda}_{\mathcal{A}} = \mathbf{h}_{\mathcal{A}} + \mathbf{W}_{\mathcal{A}}\mathbf{x}.
$$

Move the $\mathbf{x}$ terms to the right and multiply by the inverse of $\mathbf{G}_{\mathcal{A}}\mathbf{H}^{-1}\mathbf{G}_{\mathcal{A}}^\top$. That inverse exists when the active rows are linearly independent. The result is the formula for $\boldsymbol{\lambda}_{\mathcal{A}}(\mathbf{x})$. Putting it back into the first line gives $\mathbf{U}(\mathbf{x})$. Every operation was a fixed matrix acting on $\mathbf{x}$ or on a constant, so both answers are affine in $\mathbf{x}$.
:::

### Where the guess is right

These formulas are the true optimum only where the guess is right. The guess is right exactly where two families of inequalities hold.

1. **The active fences push the right way.** The multipliers are nonnegative, $\boldsymbol{\lambda}_{\mathcal{A}}(\mathbf{x}) \ge \mathbf{0}$. A negative multiplier would mean a fence is *pulling* the ball toward it — so the ball would really roll away from it, and that fence should not be in the active set.
2. **The inactive fences are respected.** For every constraint $i$ not in $\mathcal{A}$, $\mathbf{G}_{i}\mathbf{U}(\mathbf{x}) \le h_i + \mathbf{W}_i\mathbf{x}$. The plan computed while ignoring those fences must not actually cross them.

Both families are affine in $\mathbf{x}$, so each inequality cuts the state space with a straight line (a flat plane in more dimensions). The set of states where $\mathcal{A}$ is the right guess is the overlap of all those half-spaces: a polyhedron. It is called the **[[critical region|critical-region-picture]]** of $\mathcal{A}$.

Every state has *some* correct active set. So the critical regions tile the feasible set like the tiles of a floor, and on each tile the control law is affine. That is the whole structure:

::: key Explicit MPC
For small problems, multiparametric programming precomputes the optimal law offline as a piecewise-affine function of the state over a polytopic partition. Online cost becomes a table lookup, but the number of regions explodes with state dimension and horizon.
:::

Two more properties come from convexity, and they are what make the table usable. The law $\boldsymbol{\kappa}_N$ is **[[continuous|continuous-law]]** across region boundaries: no jumps in the command as the state crosses from one tile to the next. And the value function $V_N^0$ (the best achievable cost from each state) is **convex and piecewise quadratic**. Continuity is not automatic for a general parametric program. Here it follows from the strict convexity of the QP — one more reason to insist on $\mathbf{R} \succ 0$ ("R positive definite").

## The smallest case, in closed form

Take the running vehicle: $\mathbf{A}$ and $\mathbf{B}$ for one axis at $T_s = 0.1\,\mathrm{s}$, $\mathbf{Q} = \mathbf{I}$, $R = 0.1$, the LQR cost-to-go $\mathbf{P}$ as terminal cost, and $|u| \le 1$. With a horizon of one step there is only one input to choose. The code below builds the one-step problem, writes down the explicit law, and checks it against brute force.

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
# x = [0.05 0.  ]  explicit u = -0.129285 (no constraint active)  grid search u = -0.129285
# x = [0.3 0.2]  explicit u = -1.000000 (lower bound active  )  grid search u = -1.000000
# x = [-0.5  0. ]  explicit u = +1.000000 (upper bound active  )  grid search u = +1.000000
```

Walk through what it did. The cost is a parabola in $u$ with curvature $H$ and slope term $\mathbf{F}\mathbf{x}$. Without the limit, the bottom of the parabola is at $u = -\mathbf{K}_{\text{rh}}\mathbf{x}$ with $\mathbf{K}_{\text{rh}} = \mathbf{F}/H$ ("K sub rh", for receding horizon). With the limit, there are three regions:

- $\mathbf{K}_{\text{rh}}\mathbf{x} > 1$: the lower bound is active, $u = -1$;
- $\mathbf{K}_{\text{rh}}\mathbf{x} < -1$: the upper bound is active, $u = +1$;
- in between: no constraint active, $u = -\mathbf{K}_{\text{rh}}\mathbf{x}$.

The brute-force check tries $400{,}001$ inputs evenly spaced from $-1$ to $1$ (a spacing of $5\times10^{-6}$) and keeps the cheapest. It agrees with the formula to all six printed decimals, in all three regions.

So the explicit law for a one-step horizon with an input bound is the *saturated* unconstrained law. And with the Riccati terminal cost, $\mathbf{K}_{\text{rh}} = [\,2.585701\ \ 3.443436\,]$ is the LQR gain to six decimals. This particular explicit MPC is clipped LQR. That is exactly why the module keeps asking when MPC earns its complexity: at $N = 1$ with only input bounds, it does not.

## Counting the regions

Beyond the smallest case, the partition has to be computed. One way is to list every possible active set and keep those whose critical region is not empty. Here are the results for the running plant with the Riccati terminal cost, over the box $|x_1| \le 3\,\mathrm{m}$, $|x_2| \le 0.5\,\mathrm{m/s}$.

::: example Input bounds alone give a saturated gain
With input constraints only, $|u_k| \le 1$:

| $N$ | critical regions |
| --- | --- |
| $1$ | $3$ |
| $2$ | $5$ |
| $3$ | $7$ |

The pattern is $2N+1$. There is the interior region, plus one region for each number of leading saturated steps, in each direction. Check it at $N = 2$: $2 \cdot 2 + 1 = 5$.

Those five regions are:

- the unconstrained one, with law $u = -2.5857x_1 - 3.4434x_2$ — the LQR gain again;
- two where only the first input saturates;
- two where both inputs saturate.

The last four all command $u = \pm 1$. So a two-step explicit MPC is a saturated gain with a slightly cleverer saturation boundary.
:::

::: example Adding a state constraint
Now impose the velocity limit $|x_2| \le 0.5\,\mathrm{m/s}$ at every predicted step as well. The count grows:

| $N$ | regions | total facets | storage | active sets examined |
| --- | --- | --- | --- | --- |
| $2$ | $13$ | $56$ | $1.62\,\mathrm{KiB}$ | $37$ |
| $3$ | $25$ | $106$ | $3.07\,\mathrm{KiB}$ | $299$ |
| $4$ | $41$ | $172$ | $4.99\,\mathrm{KiB}$ | $2{,}517$ |
| $5$ | $61$ | $254$ | $7.38\,\mathrm{KiB}$ | $21{,}700$ |

The region counts fit $2N^2 + 2N + 1$ exactly across these four horizons. Check $N = 5$: $2 \cdot 25 + 10 + 1 = 61$.

Storage counts three 8-byte numbers (doubles) per facet — two coefficients and a right-hand side — and three per region's gain. At $N = 5$ that is $3 \cdot 254 + 3 \cdot 61 = 945$ doubles, or $7560$ bytes. A **KiB** is $1024$ bytes, so that is $7.38\,\mathrm{KiB}$.

The last column is how many candidate active sets the enumeration had to try. There are $4N$ constraint rows (upper and lower limits on each input and each predicted velocity), and every set of up to $N$ of them is a candidate. At $N = 5$ that is $\binom{20}{0} + \binom{20}{1} + \cdots + \binom{20}{5} = 21{,}700$ candidates, of which only $61$ survive. That **[[combinatorial growth|combinatorial-count]]** is why serious tools use geometric region-exploration algorithms instead of brute-force listing.

Two checks are worth running on any computed partition, and both pass here.

- **No gaps, no overlaps.** The region areas add up to $6.0000$, exactly the area of the box ($6\,\mathrm{m} \times 1\,\mathrm{m/s}$).
- **The middle region is the terminal set.** For $N \ge 4$, the region where no constraint is active is, to machine precision, the terminal set $O_\infty$ from the terminal-set lesson: same area ($0.71208$) to ten digits, same $12$ vertices, and the LQR gain. That is not a coincidence. "No constraint active anywhere in the horizon" means "the LQR law stays admissible for the next $N$ steps", and that is how $O_\infty$ was built. $O_\infty$ is pinned down by four propagations, so from $N = 4$ on the two sets match. At $N = 2$ and $N = 3$ the middle region is slightly larger ($0.7175$ and $0.7123$), because it only checks two or three steps ahead.
:::

::: warning The region count is the whole problem
The numbers above are reassuring because the state has only two dimensions. They stop being reassuring fast.

The number of critical regions is limited only by the number of possible active sets. That number is combinatorial in the number of inequality constraints, and the constraint count grows with the horizon *and* with the state dimension. A six-state rendezvous model with three inputs, box limits on each, and a modest horizon has hundreds of constraint rows. Partitions reported for problems of that size run to thousands or tens of thousands of regions — more than a flight computer's memory and a verification budget will take.

The other hazard is geometry. In the $N = 5$ partition the largest region has area $1.2167$ and the smallest $2.7\times10^{-4}$, a ratio of about $4500$. Regions that thin are called **[[slivers|slivers]]**, and they are numerically awkward. A point-location routine with a tolerance of $10^{-6}$ can fail to place a state in any region, or place it in two. So implementations merge regions with identical gains, clip slivers, and fall back to the nearest region instead of declaring failure. Every one of those choices needs testing.
:::

## Evaluating the law online

With the table in hand, the online job is **[[point location|point-location]]**: find the region that contains $\mathbf{x}$, then apply its affine law. There are three approaches, from simplest to cleverest.

**Sequential search** tests each region's inequalities in turn. The cost is the total number of facets: $254$ dot products of length $2$ for the $N = 5$ partition. That is very cheap here. In general it is linear in the region count. It is also the easiest to certify: a fixed loop bound, and no branching on data beyond the comparisons themselves.

**Binary search trees** over the partition's hyperplanes, developed by Tøndel, Johansen and Bemporad, need only a logarithmic number of hyperplane tests instead of a full scan. The price is a tree built offline that can be larger than the partition itself.

**Lattice and gain-merging representations** use the fact that many regions share the same affine law. In the input-only $N = 2$ partition, four of the five regions command $u = \pm 1$. So the law is stored once, with a rule for picking it.

Whichever you choose, the timing is the attraction. The online cost is a fixed number of arithmetic operations that does not depend on the data. So the **[[worst-case execution time|wcet]]** is not an estimate, a percentile or a bound — it is a count. That is the strongest real-time argument available. It is why explicit MPC turns up in fast, small, safety-relevant loops where an iterative solver would be hard to defend.

::: note Where explicit MPC actually fits
The decision is close to mechanical. If the state has two or three dimensions, the horizon is short, the constraints are few and the sample rate is high — an attitude-rate loop at $500\,\mathrm{Hz}$, a thruster-allocation problem, a single-axis actuator loop — compute the partition offline and check its size. A few hundred regions is comfortable.

If the state has six or more dimensions, or the horizon is long, or the problem changes with time (a shrinking horizon, a changing mass, a moving target), the partition either explodes or must be recomputed. Then an online solver with warm starting is the better answer.

A useful middle path: compute the explicit solution for a reduced problem and use it as the certified fallback law for an online MPC. That gives the fallback a provable region of attraction instead of a hopeful one.
:::

## Check yourself

::: check
Explain why the critical region of a given active set is a polyhedron, and what the two families of inequalities that define it mean physically.
:::

::: answer
Because both conditions for "this active set is the right one" are affine in the state.

The first, $\boldsymbol{\lambda}_{\mathcal{A}}(\mathbf{x}) \ge \mathbf{0}$, is **dual feasibility**. A multiplier is the price of its constraint. A negative price means the optimizer would rather move *off* that constraint: the constraint is pushing the wrong way and should be dropped from the active set.

The second, $\mathbf{G}_i\mathbf{U}(\mathbf{x}) \le h_i + \mathbf{W}_i\mathbf{x}$ for the inactive rows, is **primal feasibility**. The plan computed on the assumption that those constraints are slack must actually respect them; if not, one of them belongs in the active set.

Since $\boldsymbol{\lambda}_{\mathcal{A}}$ and $\mathbf{U}$ are affine in $\mathbf{x}$, both families are finite lists of half-spaces. Their intersection is a polyhedron.
:::

::: check
With input bounds only, the $N = 2$ explicit law has five regions, four of which command $u = \pm 1$. What does that say about the value of explicit MPC for this problem?
:::

::: answer
That at this horizon it buys very little over a clipped linear law. The law is $u = \mathrm{sat}(-\mathbf{K}_{\text{rh}}\mathbf{x})$ — "sat" clips to $\pm 1$ — with a saturation boundary slightly reshaped by the second step's constraint. The interior region's gain is the LQR gain.

A saturated LQR written in three lines would behave almost the same, with no table, no point location and no partition to verify.

Explicit MPC earns its keep where the partition is genuinely rich: when state constraints are active, when several inputs interact through a polytopic allocation, when a rate limit couples steps. The honest test is to compute the partition and count how many *distinct* gains it holds. Four regions sharing two gains is a signal to reach for the simpler controller.
:::

::: check
Your explicit partition has $1800$ regions and $9000$ facets for a four-state problem with one input. Estimate the storage and the sequential point-location cost, and say whether you would fly it at $100\,\mathrm{Hz}$.
:::

::: answer
**Storage.** Each facet stores $n + 1 = 5$ doubles (four coefficients and a right-hand side). Each region's gain stores $m(n+1)$, which is $5$ for one input. So storage is about $9000 \times 5 + 1800 \times 5 = 54{,}000$ doubles, or $54{,}000 \times 8 = 432{,}000$ bytes, about $432\,\mathrm{kB}$. That is fine in flash memory on most flight processors, and awkward if it must live in RAM on a small one.

**Time.** Sequential search evaluates up to $9000$ inner products of length $4$: about $9000 \times 4 \times 2 = 72{,}000$ floating-point operations (a multiply and an add each). Even at $50$ million per second that is $72{,}000 / (50\times10^6) = 1.4\,\mathrm{ms}$, against a $10\,\mathrm{ms}$ frame at $100\,\mathrm{Hz}$. Comfortable, deterministic, and far cheaper than a QP solve.

**Decision.** Timing is fine, so it turns on verification. $1800$ regions means $1800$ affine laws to review. The argument that the table was computed correctly — it covers the feasible set, the laws are continuous across facets, the point-location tolerance never lands between regions — has to be made once, carefully. Treat the partition as generated code and test it against the online solver over a dense sample of states.
:::

::: check
Why is the value function piecewise quadratic rather than piecewise affine, and what is one practical use for it?
:::

::: answer
On each critical region the optimal input is affine in the state, $\mathbf{U}(\mathbf{x}) = \mathbf{E}\mathbf{x} + \mathbf{e}$. The cost is a quadratic in $\mathbf{U}$ and $\mathbf{x}$. Put an affine function into a quadratic and you get a quadratic. So $V_N^0$ on each region is quadratic, and the pieces join smoothly, with matching slopes, into one convex function.

One use is the Lyapunov monitor from the terminal-cost lesson. With the explicit solution, the value function is known in closed form. The flight software can evaluate both the command and its Lyapunov certificate with the same table lookup, and flag any cycle where the expected decrease does not show up.

Another is bounding. The maximum of $V_N^0$ over the region of attraction can be computed offline, which turns "the controller works over this set" into a number.
:::

::: check
A colleague proposes computing the explicit solution for a shrinking-horizon landing guidance, arguing that the offline computation removes the flight solver. What is the problem?
:::

::: answer
A shrinking horizon changes the problem every step: $N_k = N_{\text{total}} - k$. So the mp-QP is a different problem each cycle. A partition would have to be computed and stored for every cycle of the descent — dozens of partitions, each with its own region count — and all of them become invalid if the planned time of flight changes.

The same objection hits any time-varying problem. A vehicle whose mass, thrust limit or aerodynamic coefficients change along the trajectory has a different parametric problem at each point. To cover that, the parameter vector would have to include mass and time. That raises the dimension of the parameter space and multiplies the region count.

Explicit MPC suits time-invariant problems in few states. Powered descent is neither, which is why it flies with an online convex solver.
:::

## Summary

| Object | Statement |
| --- | --- |
| Parametric structure | $\mathbf{f} = \mathbf{F}\mathbf{x}$ and constraint right-hand sides affine in $\mathbf{x}$: a multi-parametric QP |
| Active set | $\mathcal{A}$: the constraints that hold with equality at the optimum |
| Solution on an active set | $\boldsymbol{\lambda}_{\mathcal{A}}(\mathbf{x})$ and $\mathbf{U}(\mathbf{x})$ affine in $\mathbf{x}$ from the KKT equations |
| Critical region | $\{\mathbf{x} : \boldsymbol{\lambda}_{\mathcal{A}}(\mathbf{x}) \ge \mathbf{0},\ \mathbf{G}_i\mathbf{U}(\mathbf{x}) \le h_i + \mathbf{W}_i\mathbf{x}\ \forall i \notin \mathcal{A}\}$, a polyhedron |
| The law | $\boldsymbol{\kappa}_N$ continuous piecewise affine; $V_N^0$ convex piecewise quadratic |
| Input bounds only | $2N+1$ regions; $N = 1$ gives saturated LQR, checked against a grid search |
| With a state constraint | $13$, $25$, $41$, $61$ regions at $N = 2,3,4,5$; fits $2N^2 + 2N + 1$; $7.38\,\mathrm{KiB}$ at $N = 5$ |
| Partition checks | Region areas sum to the box area; for $N \ge 4$ the unconstrained region equals $O_\infty$ with the LQR gain |
| Limits | Region count combinatorial in constraint count; sliver regions ($4500{:}1$ area ratio at $N = 5$) |
| Online evaluation | Point location: sequential scan, binary search tree, or gain merging; fixed operation count |
| Use when | Two or three states, short horizon, high rate, time-invariant; otherwise online QP with warm starting |

The next lesson leaves the linear world. In nonlinear MPC the prediction model is the real one, and in economic MPC the cost is money or propellant rather than a tracking error.

::: context mpqp-history Solving for every state at once
The idea that a whole family of optimization problems can be solved at once, with the answer written as a function of the changing data, is called parametric programming, and it is decades old. Its big moment for control came in 2002, when Bemporad, Morari, Dua and Pistikopoulos showed that constrained linear MPC with a quadratic cost has an explicit piecewise-affine solution, and gave an algorithm to compute it. They called it the explicit linear quadratic regulator.
:::

::: context active-set-picture Leaning on fences
An active set is a list of which limits are "touched". For a thruster with $|u| \le 1$ there are three possibilities at the optimum: pressing on $+1$, pressing on $-1$, or touching neither. With many limits, the list of possibilities grows fast — each limit can be touched or not — which is the seed of the region explosion later in the lesson. Active-set solvers such as qpOASES work by guessing this list and correcting it one limit at a time.
:::

::: context kkt-names Three names on one set of equations
The KKT conditions are named for William Karush, who wrote them down in a 1939 master's thesis, and Harold Kuhn and Albert Tucker, who published them independently in 1951. They say that at a constrained optimum: the constraints are met, the multipliers of inequality constraints are nonnegative, a multiplier can be nonzero only if its constraint is touching, and the cost's gradient is balanced by the constraints' pushes.
:::

::: context multiplier-price Multipliers as prices
Economists call a Lagrange multiplier a **shadow price**. It tells you how much the best cost would improve if the constraint were loosened by one unit. A positive price means the limit is holding you back. A price of zero means you are not touching it. A negative price would mean loosening the limit makes things *worse* — impossible for a limit you are actually pressing on, which is why a negative multiplier says your guess of the active set is wrong.
:::

::: context affine-word Affine, not quite linear
A **linear** function of $\mathbf{x}$ is a matrix times $\mathbf{x}$: $\mathbf{M}\mathbf{x}$. It always sends zero to zero. An **affine** function adds a constant: $\mathbf{M}\mathbf{x} + \mathbf{c}$. A straight line that does not pass through the origin, like $y = 2x + 3$, is affine. The constant appears here because the constraint limits $\mathbf{h}_{\mathcal{A}}$ are fixed numbers — the law in a saturated region is $u = -1$, a constant with $\mathbf{M} = \mathbf{0}$.
:::

::: context critical-region-picture The map for one step
For the one-step problem the state plane splits into three strips along the lines $\mathbf{K}_{\text{rh}}\mathbf{x} = \pm 1$. Drawn here over the box $|x_1| \le 3$, $|x_2| \le 0.5$:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <polygon points="30,20 127.4,20 194.0,140 30,140" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <polygon points="127.4,20 166.0,20 232.6,140 194.0,140" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <polygon points="166.0,20 330,20 330,140 232.6,140" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <rect x="30" y="20" width="300" height="120" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <text x="80" y="85" font-size="12" text-anchor="middle" fill="#1f2a44">u = +1</text>
  <text x="275" y="85" font-size="12" text-anchor="middle" fill="#1f2a44">u = −1</text>
  <text x="180" y="160" font-size="11" text-anchor="middle" fill="#1d6fd1">middle strip: u = −K x</text>
  <text x="30" y="178" font-size="11" fill="#1f2a44">x₁ = −3</text>
  <text x="330" y="178" font-size="11" text-anchor="end" fill="#1f2a44">x₁ = 3</text>
  <text x="340" y="24" font-size="11" fill="#1f2a44">0.5</text>
  <text x="336" y="144" font-size="11" fill="#1f2a44">−0.5</text>
</svg>
```

The middle strip is thin — at rest it runs only from $x_1 = -0.387$ to $+0.387\,\mathrm{m}$ — because a small offset already asks for the full $1\,\mathrm{m/s^2}$.
:::

::: context continuous-law No jumps at the borders
Plot the one-step law against $s = \mathbf{K}_{\text{rh}}\mathbf{x}$. The three affine pieces meet end to end, so the command never jumps as the state crosses a region boundary.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="80" x2="340" y2="80" stroke="#6c7a93" stroke-width="1"/>
  <line x1="180" y1="20" x2="180" y2="140" stroke="#6c7a93" stroke-width="1"/>
  <line x1="120" y1="20" x2="120" y2="140" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="240" y1="20" x2="240" y2="140" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <polyline points="30,40 120,40 240,120 330,120" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <text x="120" y="155" font-size="11" text-anchor="middle" fill="#1f2a44">s = −1</text>
  <text x="240" y="155" font-size="11" text-anchor="middle" fill="#1f2a44">s = +1</text>
  <text x="336" y="95" font-size="11" text-anchor="end" fill="#1f2a44">s</text>
  <text x="186" y="32" font-size="11" fill="#1f2a44">u</text>
  <text x="40" y="34" font-size="11" fill="#1f2a44">u = +1</text>
  <text x="325" y="114" font-size="11" text-anchor="end" fill="#1f2a44">u = −1</text>
</svg>
```

A controller whose command jumped at a border would chatter back and forth when the state sat near it.
:::

::: context combinatorial-count Counting the candidates
"Choose $k$ of $20$", written $\binom{20}{k}$, counts the ways to pick $k$ rows out of $20$. For $k = 0$ to $5$ the counts are $1$, $20$, $190$, $1140$, $4845$ and $15{,}504$, which add to $21{,}700$. Adding one more step to the horizon adds four more rows and one more allowed size, and the total jumps by roughly a factor of eight or nine. That is combinatorial growth: it outruns any fixed computer very quickly.
:::

::: context slivers Why thin regions are trouble
A computer stores numbers with a tiny rounding error, so every "is this point inside?" test uses a small tolerance. A region that is thinner than a few tolerances wide can be missed entirely: the point is judged just outside the region on each side of it. Or the point can be judged inside two neighboring regions at once. Neither is a bug in the math. Both are bugs in the flight code if nobody planned for them.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <polygon points="20,20 175,20 185,110 20,110" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="175,20 179,20 185,110" fill="#b4232c" stroke="#1f2a44" stroke-width="1"/>
  <polygon points="179,20 340,20 340,110 185,110" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="95" y="70" font-size="12" text-anchor="middle" fill="#1f2a44">region A</text>
  <text x="265" y="70" font-size="12" text-anchor="middle" fill="#1f2a44">region B</text>
  <text x="180" y="126" font-size="11" text-anchor="middle" fill="#b4232c">sliver, thinner than the tolerance</text>
</svg>
```
:::

::: context point-location Which country am I in?
Point location is the problem of finding which region of a map a point falls in — like working out which country a GPS fix is in. The simple way checks every country's borders. A binary search tree asks a series of yes-or-no questions ("east or west of this line?"), halving the candidates each time, so in a well-balanced tree a million regions need only about twenty questions. Tøndel, Johansen and Bemporad published this approach for explicit MPC in 2003.
:::

::: context wcet Worst-case execution time
Flight software is certified against the **worst-case execution time**, or WCET: the longest a piece of code can ever take, not how long it usually takes. A lookup with a fixed loop count has a WCET you can count by hand. An iterative solver's WCET depends on how many iterations it might need in the worst case, which is much harder to prove. The real-time lesson comes back to this.
:::
