---
id: l07-duality-and-the-dual-problem
title: Duality and the dual problem
minutes: 28
covers:
  - duality and the dual problem
---

Lesson 4 claimed that a convex solver can hand back a proof that its answer is right, and promised the proof would come from duality. Here it is. Every optimisation problem has a shadow – a second optimisation problem, built from the same data, whose value is a lower bound on the first. Solve the shadow well enough and you have bracketed the answer from below; find a primal point that matches the bracket and you have bracketed it from above too, and the two together are the certificate.

This is not an abstraction that sits beside the algorithms. It *is* the algorithms. An interior-point method carries a primal iterate and a dual iterate side by side and stops when the distance between their objective values falls below a tolerance; that distance is the duality gap of this lesson. When a landing problem has no solution, what the solver returns is not a shrug but a dual object whose existence proves no trajectory can satisfy the constraints. And the multipliers of lesson 2 – the shadow prices – are exactly the variables of the dual problem, so the sensitivity information you get for free at the end of a solve is dual information.

The plan: build the Lagrange dual function, prove weak duality in three lines, see when the bound is tight (strong duality, Slater's condition), read off complementary slackness, and then turn all of it into the two certificates a flight solver must produce. The last section does the same for cones, because the problem that flies is an SOCP.

## The Lagrangian and the dual function

Take the standard form of lesson 1:

$$
\text{minimise } f(\mathbf{x}) \quad \text{subject to} \quad g_i(\mathbf{x}) \le 0,\ i = 1,\dots,m, \qquad h_j(\mathbf{x}) = 0,\ j = 1,\dots,p,
$$

with optimal value $p^\star$. The **Lagrangian** attaches a price to each constraint and folds it into the objective:

$$
\mathcal{L}(\mathbf{x}, \boldsymbol{\lambda}, \boldsymbol{\nu}) = f(\mathbf{x}) + \sum_{i=1}^m \lambda_i\,g_i(\mathbf{x}) + \sum_{j=1}^p \nu_j\,h_j(\mathbf{x}),
$$

where $\lambda_i \ge 0$ is the multiplier on the $i$-th inequality and $\nu_j \in \mathbb{R}$ the multiplier on the $j$-th equality. This is the same Lagrangian whose stationarity gave the KKT conditions; what is new is what we do with it.

> The **Lagrange dual function** is $g(\boldsymbol{\lambda}, \boldsymbol{\nu}) = \inf_{\mathbf{x}} \mathcal{L}(\mathbf{x}, \boldsymbol{\lambda}, \boldsymbol{\nu})$, the infimum taken over all $\mathbf{x}$ in the domain, feasible or not.

Two properties, both immediate and both important.

**The dual function is concave**, whatever $f$ and $g_i$ and $h_j$ are – convex, nonconvex, discontinuous, anything. For fixed $\mathbf{x}$, the map $(\boldsymbol{\lambda}, \boldsymbol{\nu}) \mapsto \mathcal{L}(\mathbf{x}, \boldsymbol{\lambda}, \boldsymbol{\nu})$ is affine. The pointwise infimum of a family of affine functions is concave (lesson 3 gave the supremum version; the infimum version is the same argument with the inequality reversed). So $g$ is concave even for a problem that is hopelessly nonconvex. This is why duality is useful outside the convex world: the bound is always available and always comes from a well-behaved problem.

**The dual function is a lower bound on $p^\star$.** Let $\tilde{\mathbf{x}}$ be any feasible point and $\boldsymbol{\lambda} \ge \mathbf{0}$ any nonnegative multiplier vector. Then $g_i(\tilde{\mathbf{x}}) \le 0$ and $\lambda_i \ge 0$ give $\lambda_i g_i(\tilde{\mathbf{x}}) \le 0$, while $h_j(\tilde{\mathbf{x}}) = 0$ kills the equality terms outright. Therefore

$$
\mathcal{L}(\tilde{\mathbf{x}}, \boldsymbol{\lambda}, \boldsymbol{\nu}) = f(\tilde{\mathbf{x}}) + \sum_i \lambda_i g_i(\tilde{\mathbf{x}}) + \sum_j \nu_j h_j(\tilde{\mathbf{x}}) \le f(\tilde{\mathbf{x}}),
$$

and since $g(\boldsymbol{\lambda}, \boldsymbol{\nu})$ is the infimum of $\mathcal{L}$ over *all* $\mathbf{x}$, including $\tilde{\mathbf{x}}$, we get $g(\boldsymbol{\lambda}, \boldsymbol{\nu}) \le \mathcal{L}(\tilde{\mathbf{x}}, \boldsymbol{\lambda}, \boldsymbol{\nu}) \le f(\tilde{\mathbf{x}})$. Minimising the right-hand side over all feasible $\tilde{\mathbf{x}}$,

$$
g(\boldsymbol{\lambda}, \boldsymbol{\nu}) \le p^\star \qquad \text{for every } \boldsymbol{\lambda} \ge \mathbf{0},\ \boldsymbol{\nu} .
$$

Three lines, no convexity assumed. Every nonnegative price vector you can name gives you a number you can compute and a guarantee that the true optimum is not below it.

## The dual problem

Since every dual feasible pair gives a lower bound, take the best one.

> The **dual problem** is $\text{maximise } g(\boldsymbol{\lambda}, \boldsymbol{\nu})$ subject to $\boldsymbol{\lambda} \ge \mathbf{0}$. Its optimal value is $d^\star$. The original problem is then called the **primal**, with value $p^\star$, and $p^\star - d^\star \ge 0$ is the **duality gap**.

The dual problem is a concave maximisation over a convex set, hence a convex problem, always. A nonconvex primal has a convex dual; that is a strong statement and it is the reason branch-and-bound codes for nonconvex problems lean on dual bounds.

::: key Weak and strong duality
**Weak duality**: $d^\star \le p^\star$, always, and the gap is a bound you can trust. **Strong duality**: $d^\star = p^\star$, which holds for convex problems satisfying a constraint qualification such as Slater's condition.
:::

Weak duality has a useful corollary in each direction. If the dual is unbounded above ($d^\star = +\infty$), the primal must be infeasible, because a feasible primal point would cap every dual value at its own objective. If the primal is unbounded below ($p^\star = -\infty$), the dual must be infeasible. Those two facts are the infeasibility certificates, and they are developed below.

## The dual of a linear program

Work the general case once and the pattern is visible everywhere. Take the LP of lesson 5 in inequality form, $\text{minimise } \mathbf{c}^\top\mathbf{x}$ subject to $\mathbf{A}\mathbf{x} \le \mathbf{b}$. With multipliers $\boldsymbol{\lambda} \ge \mathbf{0}$,

$$
\mathcal{L} = \mathbf{c}^\top\mathbf{x} + \boldsymbol{\lambda}^\top(\mathbf{A}\mathbf{x} - \mathbf{b}) = (\mathbf{c} + \mathbf{A}^\top\boldsymbol{\lambda})^\top\mathbf{x} - \mathbf{b}^\top\boldsymbol{\lambda} .
$$

The Lagrangian is affine in $\mathbf{x}$, so its infimum over $\mathbb{R}^n$ is $-\infty$ unless the linear coefficient vanishes exactly. Hence

$$
g(\boldsymbol{\lambda}) =
\begin{cases}
-\mathbf{b}^\top\boldsymbol{\lambda}, & \mathbf{A}^\top\boldsymbol{\lambda} + \mathbf{c} = \mathbf{0}, \\
-\infty, & \text{otherwise},
\end{cases}
$$

and the dual problem is $\text{maximise } -\mathbf{b}^\top\boldsymbol{\lambda}$ subject to $\mathbf{A}^\top\boldsymbol{\lambda} + \mathbf{c} = \mathbf{0}$, $\boldsymbol{\lambda} \ge \mathbf{0}$. The dual of an LP is an LP: $m$ variables where the primal had $n$, and $n$ equality constraints where the primal had $m$ inequalities. A tall thin primal has a short wide dual, which is occasionally a reason to solve one rather than the other.

::: example The dual of the two-engine split
Lesson 5 minimised $1.2\,T_1 + 1.0\,T_2$ subject to $T_1 + T_2 \ge 50$ and $0 \le T_i \le 30$, and found the optimal vertex $(20, 30)$ with $p^\star = 54$. Give the thrust requirement the multiplier $\lambda \ge 0$ and each upper bound the multiplier $\mu_i \ge 0$; the lower bounds are inactive and can be carried along with zero multipliers. Writing the requirement as $50 - T_1 - T_2 \le 0$ and the bounds as $T_i - 30 \le 0$,

$$
\mathcal{L} = 1.2T_1 + T_2 + \lambda(50 - T_1 - T_2) + \mu_1(T_1 - 30) + \mu_2(T_2 - 30) .
$$

Collecting: the coefficient of $T_1$ is $1.2 - \lambda + \mu_1$ and of $T_2$ is $1 - \lambda + \mu_2$, with constant part $50\lambda - 30\mu_1 - 30\mu_2$. Both coefficients must vanish for the infimum to be finite, but since each $T_i$ is also confined to $T_i \ge 0$ in the primal, the correct statement is that each coefficient must be **nonnegative** (otherwise push $T_i$ to $+\infty$) and then the infimum is taken at $T_i = 0$. The dual is therefore

$$
\text{maximise } 50\lambda - 30\mu_1 - 30\mu_2 \quad \text{s.t.} \quad \lambda - \mu_1 \le 1.2, \quad \lambda - \mu_2 \le 1.0, \quad \lambda, \mu_1, \mu_2 \ge 0 .
$$

Three variables and two inequalities, where the primal had two variables and five inequalities. Try the dual point $(\lambda, \mu_1, \mu_2) = (1.0, 0, 0)$: both constraints hold, and the objective is $50$. That single arithmetic line proves no engine split can cost less than $50$, without knowing anything about where the optimum is. A better dual point, $(1.1, 0, 0.1)$, gives $50 \times 1.1 - 3 = 52$. And the point read off the KKT conditions in lesson 5, $(\lambda, \mu_1, \mu_2) = (1.2, 0, 0.2)$, gives $50 \times 1.2 - 30 \times 0.2 = 60 - 6 = 54$ – equal to $p^\star$. Strong duality holds and the gap is zero.

Now watch the bracket close. The primal point $(25, 30)$ is feasible with cost $60$; paired with the dual point $(1.0, 0, 0)$ it says $50 \le p^\star \le 60$. Improve both to $(22, 30)$, cost $56.4$, and $(1.1, 0, 0.1)$, value $52$: now $52 \le p^\star \le 56.4$, a gap of $4.4$. At $(20, 30)$ and $(1.2, 0, 0.2)$ the gap is zero and the search is over. A primal-dual algorithm is a machine for driving that bracket to zero, and the bracket width at any moment is a number the algorithm can print.
:::

## Strong duality and Slater's condition

Weak duality is free. Strong duality – that the best lower bound actually reaches $p^\star$ – is not, and it is what makes the certificate exact rather than merely informative.

> **Slater's condition**: the primal is convex and there exists a **strictly feasible** point, a point $\mathbf{x}$ with $g_i(\mathbf{x}) < 0$ for every nonaffine inequality and $h_j(\mathbf{x}) = 0$ for every equality. (Affine inequalities need only be satisfied, not strictly.) Then $p^\star = d^\star$, and if $p^\star$ is finite the dual optimum is attained by some $(\boldsymbol{\lambda}^\star, \boldsymbol{\nu}^\star)$.

For an LP, Slater's condition reduces to "the problem is feasible", since every constraint is affine – so LP duality is exact whenever both problems are feasible. For the landing SOCP of lesson 6, a strictly feasible point is a trajectory that stays strictly inside the glide-slope cone, strictly below the maximum throttle, and so on; such a trajectory exists whenever the vehicle has any margin at all, which is precisely the condition under which you would be willing to fly. When the vehicle has *no* margin – the target is exactly at the edge of the reachable set – Slater's condition can fail, and that is a real situation, not a mathematical curiosity, which is why the flown formulation of lesson 6 solves a reachability problem first.

Two failures are worth seeing, because they teach where the certificate can go soft.

::: warning Slater can fail, and then the multipliers may not exist
Consider the convex problem $\text{minimise } x$ subject to $x^2 \le 0$, over $x \in \mathbb{R}$. The feasible set is the single point $x = 0$, so $p^\star = 0$, and there is no strictly feasible point: Slater fails. The dual function is $g(\lambda) = \inf_x\,(x + \lambda x^2)$, which equals $-1/(4\lambda)$ for $\lambda > 0$ and $-\infty$ at $\lambda = 0$. So $g(1) = -0.25$, $g(10) = -0.025$, $g(1000) = -0.00025$: the dual value climbs toward $0$ but never gets there. Here $d^\star = p^\star = 0$, yet **no dual optimal $\lambda$ exists**, and correspondingly no $\lambda$ satisfies KKT stationarity, since $1 + 2\lambda x = 1 \ne 0$ at $x = 0$. A solver asked for multipliers on this problem returns something enormous and meaningless.

The gap can also be genuinely positive. Take $\text{minimise } e^{-x}$ subject to $x^2/y \le 0$ on the domain $y > 0$; the constraint function is the quadratic-over-linear of lesson 3, so the problem is convex. Feasibility forces $x = 0$, so $p^\star = e^0 = 1$. For any $\lambda \ge 0$ the Lagrangian $e^{-x} + \lambda x^2/y$ is nonnegative, and choosing $x = t$, $y = t^3$ makes it $e^{-t} + \lambda/t$, which is $1.37$ at $t = 1$, $0.100$ at $t = 10$ and $0.010$ at $t = 100$ – so the infimum is $0$ for every $\lambda$ and $d^\star = 0$. The duality gap is $1$. Again no strictly feasible point exists. The moral for flight software: a solver's reported gap is a certificate only when the formulation has margin, and checking that your formulation admits a strictly feasible point is part of the design, not an afterthought.
:::

## Complementary slackness falls out

Suppose strong duality holds and both optima are attained, at $\mathbf{x}^\star$ and $(\boldsymbol{\lambda}^\star, \boldsymbol{\nu}^\star)$. Then

$$
f(\mathbf{x}^\star) = g(\boldsymbol{\lambda}^\star, \boldsymbol{\nu}^\star) = \inf_{\mathbf{x}} \mathcal{L}(\mathbf{x}, \boldsymbol{\lambda}^\star, \boldsymbol{\nu}^\star) \le \mathcal{L}(\mathbf{x}^\star, \boldsymbol{\lambda}^\star, \boldsymbol{\nu}^\star) = f(\mathbf{x}^\star) + \sum_i \lambda_i^\star g_i(\mathbf{x}^\star) \le f(\mathbf{x}^\star) .
$$

The chain begins and ends at the same number, so every inequality in it is an equality. Two consequences. First, $\mathbf{x}^\star$ **minimises the Lagrangian** at the optimal multipliers – which, for differentiable problems, is stationarity, $\nabla_{\mathbf{x}}\mathcal{L}(\mathbf{x}^\star, \boldsymbol{\lambda}^\star, \boldsymbol{\nu}^\star) = \mathbf{0}$. Second, $\sum_i \lambda_i^\star g_i(\mathbf{x}^\star) = 0$, and since every term in that sum is a product of a nonnegative number and a nonpositive number, every term is individually zero:

$$
\lambda_i^\star\,g_i(\mathbf{x}^\star) = 0 \quad \text{for every } i .
$$

That is **complementary slackness**, stated in lesson 2 as part of KKT and now derived rather than asserted: an inactive constraint has zero price, and a constraint with a positive price is active. The whole of KKT, for a convex differentiable problem satisfying Slater's condition, is just "strong duality holds and both optima are attained", unpacked.

## Certificates: what the solver hands back

::: key The two certificates
**Optimality**: a primal feasible $\mathbf{x}$ and a dual feasible $(\boldsymbol{\lambda}, \boldsymbol{\nu})$ with $f(\mathbf{x}) - g(\boldsymbol{\lambda}, \boldsymbol{\nu}) \le \epsilon$ prove that $\mathbf{x}$ is within $\epsilon$ of the global optimum, since $g \le p^\star \le f(\mathbf{x})$. **Infeasibility**: a dual feasible point with $g(\boldsymbol{\lambda}, \boldsymbol{\nu}) > 0$ for a problem whose feasible cost is bounded below by zero – or, for an LP, a ray along which the dual objective grows without bound – proves that no feasible primal point exists.
:::

Both are checkable in a handful of matrix-vector products, which is the property that matters for flight software. The guidance computer does not have to trust the solver's internal logic; a monitor can verify the returned certificate independently, in microseconds, with code far simpler than the solver.

The infeasibility certificate deserves its numbers. Return to the two engines and ask for a combined thrust of $70\,\mathrm{kN}$ when each engine tops out at $30$. The problem is obviously infeasible, but "obviously" does not fly. The dual objective is now $70\lambda - 30\mu_1 - 30\mu_2$ with the same constraints $\lambda - \mu_1 \le 1.2$ and $\lambda - \mu_2 \le 1.0$. Take the ray $\lambda = \mu_1 = \mu_2 = t$ for $t \ge 0$: both constraints read $0 \le 1.2$ and $0 \le 1.0$, satisfied for every $t$, and the objective is $70t - 60t = 10t$, which is $10$ at $t = 1$, $100$ at $t = 10$ and $1000$ at $t = 100$. The dual is unbounded above, so by weak duality the primal is infeasible – and the *direction* $(1, 1, 1)$ is the proof. Read physically, it says: the requirement contributes $70$ per unit of price while the two ceilings can only absorb $30 + 30 = 60$, so the demand exceeds the supply by $10\,\mathrm{kN}$ no matter how the split is chosen. A guidance mode-change logic that is handed this ray knows not only that the target is unreachable but by how much and which constraints are responsible.

This is the practical content of the **theorem of alternatives**: exactly one of "there is a feasible $\mathbf{x}$" and "there is a dual improving ray" is true. Farkas' lemma is the linear case. A solver that stops with "infeasible" is really saying "here is the ray"; always ask to see it, because an infeasibility that comes from a modelling slip looks exactly like a physical one until you read which constraints the ray weights.

## Conic duality and the self-dual second-order cone

The landing problem is an SOCP, so the version of duality that matters is the conic one. Write the problem the way a conic solver takes it:

$$
\text{minimise } \mathbf{c}^\top\mathbf{x} \quad \text{subject to} \quad \mathbf{A}\mathbf{x} + \mathbf{s} = \mathbf{b}, \quad \mathbf{s} \in \mathcal{K},
$$

where $\mathcal{K}$ is a product of cones – one nonnegative orthant for the linear inequalities and one second-order cone per norm constraint – and the slack $\mathbf{s}$ is required to lie in it. (Equalities are the cone $\{0\}$.) The **dual cone** is

$$
\mathcal{K}^* = \{\mathbf{y} : \mathbf{y}^\top\mathbf{s} \ge 0 \text{ for all } \mathbf{s} \in \mathcal{K}\},
$$

the set of prices that never pay out negatively on a feasible slack. Building the Lagrangian $\mathcal{L} = \mathbf{c}^\top\mathbf{x} + \mathbf{y}^\top(\mathbf{A}\mathbf{x} + \mathbf{s} - \mathbf{b})$ and taking the infimum over $\mathbf{x} \in \mathbb{R}^n$ and $\mathbf{s} \in \mathcal{K}$: the $\mathbf{x}$ part forces $\mathbf{A}^\top\mathbf{y} + \mathbf{c} = \mathbf{0}$, and the $\mathbf{s}$ part gives $\inf_{\mathbf{s} \in \mathcal{K}} \mathbf{y}^\top\mathbf{s}$, which is $0$ when $\mathbf{y} \in \mathcal{K}^*$ and $-\infty$ otherwise. So

$$
\text{maximise } -\mathbf{b}^\top\mathbf{y} \quad \text{subject to} \quad \mathbf{A}^\top\mathbf{y} + \mathbf{c} = \mathbf{0}, \quad \mathbf{y} \in \mathcal{K}^* .
$$

The nonnegative orthant is its own dual, which recovers the LP dual above. The second-order cone is its own dual too, and the proof is two lines of Cauchy–Schwarz. Let $\mathcal{K} = \{(\mathbf{u}, t) : \|\mathbf{u}\|_2 \le t\}$. If $\|\mathbf{v}\|_2 \le w$ then for any $(\mathbf{u}, t) \in \mathcal{K}$,

$$
\mathbf{u}^\top\mathbf{v} + tw \ge -\|\mathbf{u}\|_2\|\mathbf{v}\|_2 + tw \ge -tw + tw = 0,
$$

so $(\mathbf{v}, w) \in \mathcal{K}^*$. Conversely, if $\|\mathbf{v}\|_2 > w$, choose $\mathbf{u} = -\mathbf{v}/\|\mathbf{v}\|_2$ and $t = 1$, a point of $\mathcal{K}$; the pairing is $-\|\mathbf{v}\|_2 + w < 0$, so $(\mathbf{v}, w) \notin \mathcal{K}^*$. Hence $\mathcal{K}^* = \mathcal{K}$: **the second-order cone is self-dual**. The dual of an SOCP is an SOCP with the same cones, which is why a single solver can chase both iterates at once, and why the dual variables attached to a thrust cone are themselves a vector-plus-scalar with the same norm inequality.

In practice a conic solver reports three numbers each iteration: the **primal residual** $\|\mathbf{A}\mathbf{x} + \mathbf{s} - \mathbf{b}\|$, the **dual residual** $\|\mathbf{A}^\top\mathbf{y} + \mathbf{c}\|$, and the **gap** $\mathbf{c}^\top\mathbf{x} + \mathbf{b}^\top\mathbf{y}$, which is $f(\mathbf{x}) - g(\mathbf{y})$ written out. All three below tolerance is the optimality certificate; the gap alone means nothing if the residuals are large, because a dual point that violates $\mathbf{A}^\top\mathbf{y} + \mathbf{c} = \mathbf{0}$ is not dual feasible and bounds nothing. Lesson 12 shows these three numbers in a solver's output, and lesson 13 makes the tolerance on them a design parameter with a hard iteration cap behind it.

::: example The dual of the four-step minimum-energy descent
Lesson 5 solved $\text{minimise } \tfrac{1}{2}\|\mathbf{u}\|_2^2$ subject to $\mathbf{F}\mathbf{u} = \mathbf{g}$ with

$$
\mathbf{F} = \begin{bmatrix} 1 & 1 & 1 & 1 \\ 3.5 & 2.5 & 1.5 & 0.5 \end{bmatrix}, \qquad \mathbf{g} = \begin{bmatrix} 0 \\ -10 \end{bmatrix},
$$

and got $\mathbf{u}^\star = (-3, -1, 1, 3)\ \mathrm{m/s^2}$ with $p^\star = \tfrac{1}{2}\|\mathbf{u}^\star\|^2 = 10\ \mathrm{m^2/s^4}$. Build the dual. With only equalities the Lagrangian is $\mathcal{L} = \tfrac{1}{2}\mathbf{u}^\top\mathbf{u} + \boldsymbol{\nu}^\top(\mathbf{F}\mathbf{u} - \mathbf{g})$, which is a strictly convex quadratic in $\mathbf{u}$, so the infimum is at $\mathbf{u} = -\mathbf{F}^\top\boldsymbol{\nu}$ and

$$
g(\boldsymbol{\nu}) = -\tfrac{1}{2}\boldsymbol{\nu}^\top\mathbf{F}\mathbf{F}^\top\boldsymbol{\nu} - \boldsymbol{\nu}^\top\mathbf{g} .
$$

An unconstrained concave quadratic in two variables: the dual of a four-variable equality-constrained QP has two variables and no constraints at all. With $\mathbf{F}\mathbf{F}^\top = \begin{bmatrix} 4 & 8 \\ 8 & 21 \end{bmatrix}$, evaluate it at a guess $\boldsymbol{\nu} = (-3, 1.5)$: the value is $9.375$, so $p^\star \ge 9.375$. At $\boldsymbol{\nu} = (-5, 2.5)$ it is also $9.375$. At the maximiser $\boldsymbol{\nu}^\star = (-4, 2)$, found by setting the gradient $-\mathbf{F}\mathbf{F}^\top\boldsymbol{\nu} - \mathbf{g}$ to zero, the value is $-\tfrac{1}{2}(20) + 20 = 10$ – exactly $p^\star$, as strong duality requires for a feasible convex QP.

And $\boldsymbol{\nu}^\star = (-4, 2)$ is the same multiplier pair lesson 5 obtained from the KKT system: the shadow prices on the terminal velocity and terminal altitude constraints. Nothing new has been computed; what duality adds is the guarantee attached to the number. Handed only $\boldsymbol{\nu} = (-3, 1.5)$ and the value $9.375$, you would still know that no control history can bring the energy below $9.375\ \mathrm{m^2/s^4}$, and knowing that before you have found the optimum is what lets an algorithm stop early with a stated tolerance.
:::

::: note The dual of the landing LP is the switching function
Lesson 5 wrote the discretised vertical landing as an LP, gave the velocity dynamics at step $k$ the multiplier $\nu_k$, and found that the optimal thrust is decided by the sign of $S_k = 1 - \nu_k$. Those $\nu_k$ are dual variables of this lesson – the dual of a trajectory LP has one variable per dynamics equation per step, and the sequence $\nu_k$ obeys a backwards recursion that is the discrete form of the costate equation of optimal control. The Pontryagin costates of the continuous problem and the Lagrange multipliers of the discretised one are the same object seen at two resolutions. That is why a solver's dual output on a trajectory problem is worth plotting: a costate history that changes sign once is a single-switch bang-bang solution, and one that hovers near zero over an interval is warning you about a singular arc.
:::

## Check yourself

::: check
A colleague's solver reports, for a convex minimisation, a primal objective of $184.2$ and a dual objective of $184.9$. What do you conclude?
:::

::: answer
That something is wrong. Weak duality says $d^\star \le p^\star$ always, and any dual feasible point's value is a lower bound on every primal feasible point's objective, so a dual value *above* a primal value is impossible. The realistic causes: the reported primal point is not actually feasible (residuals not converged, so $184.2$ is not an achievable cost); the dual point is not actually dual feasible; a sign convention has been flipped in reading the output; or the problem is not convex and the "dual value" is being computed by something other than the Lagrange dual. The first thing to check is the primal and dual residuals, not the objectives: the gap means nothing until both residuals are small.
:::

::: check
Show that the dual of the dual of an LP is the LP again.
:::

::: answer
Start from the dual found above: $\text{maximise } -\mathbf{b}^\top\boldsymbol{\lambda}$ s.t. $\mathbf{A}^\top\boldsymbol{\lambda} + \mathbf{c} = \mathbf{0}$, $\boldsymbol{\lambda} \ge \mathbf{0}$. Write it as a minimisation, $\text{minimise } \mathbf{b}^\top\boldsymbol{\lambda}$ s.t. $\mathbf{A}^\top\boldsymbol{\lambda} + \mathbf{c} = \mathbf{0}$ and $-\boldsymbol{\lambda} \le \mathbf{0}$. Attach $\mathbf{x}$ to the equality and $\mathbf{z} \ge \mathbf{0}$ to the sign constraint: $\mathcal{L} = \mathbf{b}^\top\boldsymbol{\lambda} + \mathbf{x}^\top(\mathbf{A}^\top\boldsymbol{\lambda} + \mathbf{c}) - \mathbf{z}^\top\boldsymbol{\lambda} = (\mathbf{b} + \mathbf{A}\mathbf{x} - \mathbf{z})^\top\boldsymbol{\lambda} + \mathbf{c}^\top\mathbf{x}$. The infimum over $\boldsymbol{\lambda} \in \mathbb{R}^m$ is $-\infty$ unless $\mathbf{b} + \mathbf{A}\mathbf{x} - \mathbf{z} = \mathbf{0}$, i.e. $\mathbf{z} = \mathbf{A}\mathbf{x} + \mathbf{b}$, and then the dual function is $\mathbf{c}^\top\mathbf{x}$. Maximising $\mathbf{c}^\top\mathbf{x}$ subject to $\mathbf{z} = \mathbf{A}\mathbf{x} + \mathbf{b} \ge \mathbf{0}$ – and undoing the sign flip that turned the maximisation into a minimisation at the start – returns $\text{minimise } \mathbf{c}^\top\mathbf{x}$ s.t. $\mathbf{A}\mathbf{x} \le \mathbf{b}$, sign conventions aside. Duality is an involution on LPs, which is another way of saying neither problem is more fundamental than the other.
:::

::: check
The thrust requirement in the two-engine problem is $50\,\mathrm{kN}$ and the optimal $\lambda^\star = 1.2$. Using only the dual problem, explain why the optimal cost is exactly $1.2$ per extra kN of requirement, and predict where that rate changes.
:::

::: answer
The dual objective is $b\lambda - 30\mu_1 - 30\mu_2$ where $b$ is the requirement. Changing $b$ changes only the coefficient of $\lambda$ in the objective and nothing in the dual feasible set. So if the dual optimum stays at the same vertex $(\lambda, \mu_1, \mu_2) = (1.2, 0, 0.2)$, the optimal value moves at rate $\lambda^\star = 1.2$ per unit of $b$ – which is the shadow-price interpretation of lesson 2, derived here without differentiating anything. The rate changes when the dual optimum jumps to a different vertex of the dual feasible set. That happens at $b = 60$: beyond it, the dual objective is maximised along the ray $\lambda = \mu_1 = \mu_2 = t$ (value $(b - 60)t \to \infty$), so the dual becomes unbounded and the primal infeasible. The kink in $p^\star(b)$ is a vertex change in the dual, and its location is the total capacity of the two engines.
:::

::: check
Why is the dual function concave even when the primal problem is nonconvex, and what does that buy a nonconvex trajectory optimiser?
:::

::: answer
For each fixed $\mathbf{x}$, $\mathcal{L}(\mathbf{x}, \boldsymbol{\lambda}, \boldsymbol{\nu})$ is affine in the multipliers, because the multipliers enter only as coefficients multiplying the fixed numbers $g_i(\mathbf{x})$ and $h_j(\mathbf{x})$. The dual function is the pointwise infimum of this family of affine functions, and an infimum of affine functions is concave regardless of the index set. What it buys: a *valid global* lower bound on a nonconvex problem's optimal value, computable by maximising a concave function. Branch-and-bound uses exactly this – solve the dual (or a convex relaxation) on a subregion, compare its bound with the best known feasible cost, and discard the subregion if the bound is worse. The catch is that for a nonconvex primal the gap $p^\star - d^\star$ is usually strictly positive, so the bound alone never certifies optimality; it only prunes.
:::

::: check
A landing solver returns "infeasible" with a dual ray whose largest components are the multipliers on the glide-slope cones at the last five time nodes. What has probably happened, and what would you change?
:::

::: answer
The ray is the proof of infeasibility, and the constraints it weights most heavily are the ones doing the blocking. Large weights on the terminal glide-slope cones say that the vehicle cannot both arrive at the pad and stay inside the narrow cone near the ground, given its state and the thrust available – the cone pinches to nothing at zero altitude, so a small lateral error late in the descent is unrecoverable. Sensible responses, in order: check that the glide-slope half-angle has not been set unrealistically tight near touchdown (a cone that is exact at $r_z = 0$ is a modelling artefact); relax the cone in the last few nodes, or replace it by a fixed lateral box below some altitude; or accept the answer and let the reachability solve of lesson 6 retarget to the nearest reachable point. What you should not do is retry with a different initial guess: a convex infeasibility certificate is a statement about the problem, not about the solver's starting point, and it will come back identical every time.
:::

## Summary

| Object | Statement |
| --- | --- |
| Lagrangian | $\mathcal{L} = f + \sum_i \lambda_i g_i + \sum_j \nu_j h_j$, with $\lambda_i \ge 0$ |
| Dual function | $g(\boldsymbol{\lambda}, \boldsymbol{\nu}) = \inf_{\mathbf{x}}\mathcal{L}$; concave always, even for a nonconvex primal |
| Weak duality | $g(\boldsymbol{\lambda}, \boldsymbol{\nu}) \le p^\star$ for all $\boldsymbol{\lambda} \ge \mathbf{0}$; hence $d^\star \le p^\star$ |
| Strong duality | $d^\star = p^\star$ for a convex problem satisfying Slater's condition (a strictly feasible point) |
| Duality gap | $p^\star - d^\star \ge 0$; for an iterate pair, $f(\mathbf{x}) - g(\boldsymbol{\lambda}, \boldsymbol{\nu})$ is a computable bracket width |
| LP dual | $\text{max } -\mathbf{b}^\top\boldsymbol{\lambda}$ s.t. $\mathbf{A}^\top\boldsymbol{\lambda} + \mathbf{c} = \mathbf{0}$, $\boldsymbol{\lambda} \ge \mathbf{0}$; dual of the dual is the primal |
| Two-engine example | $p^\star = d^\star = 54$ at $(\lambda, \mu_1, \mu_2) = (1.2, 0, 0.2)$; bracket $[52, 56.4]$ at an intermediate pair |
| Complementary slackness | $\lambda_i^\star g_i(\mathbf{x}^\star) = 0$; follows from a zero gap, not assumed |
| Optimality certificate | Primal feasible $\mathbf{x}$ plus dual feasible $(\boldsymbol{\lambda}, \boldsymbol{\nu})$ with gap $\le \epsilon$ |
| Infeasibility certificate | An unbounded dual ray; for $T_1 + T_2 \ge 70$ with $T_i \le 30$ the ray $(1,1,1)$ gives objective $10t \to \infty$ |
| Conic dual | $\text{max } -\mathbf{b}^\top\mathbf{y}$ s.t. $\mathbf{A}^\top\mathbf{y} + \mathbf{c} = \mathbf{0}$, $\mathbf{y} \in \mathcal{K}^*$ |
| Self-duality | $\mathcal{K}^* = \mathcal{K}$ for the nonnegative orthant and for the second-order cone |
| Solver output | Primal residual, dual residual, gap – all three must be small for the certificate to mean anything |

The next lesson climbs one rung further up the cone hierarchy, to the semidefinite program, where the cone is the set of positive semidefinite matrices and – by the self-duality just proved for the orthant and the second-order cone, and proved there for the PSD cone – the same duality theory applies word for word. After that, interior-point methods put the primal and the dual iterate in the same Newton step and drive the gap of this lesson to zero.
