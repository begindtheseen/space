---
id: l07-duality-and-the-dual-problem
title: Duality and the dual problem
minutes: 22
covers:
  - duality and the dual problem
---

Say you are hunting for the cheapest airline ticket. Every fare you find says "the cheapest is *at most* this". That search from above never tells you when to stop: a cheaper fare might hide one more click away. What you want is the opposite kind of fact: "no ticket on this route costs *less* than \$180". When your best fare meets that floor, you are done, and you can prove it.

**Duality** is the machine that builds those floors. Every optimization problem has a partner problem, built from the same numbers, called its **dual**. Every answer to the dual is a floor under the original. Lesson 4 promised that a convex solver hands back a proof, a **certificate**, that its answer is right. This lesson is where that proof comes from.

It is not a side topic. An interior-point solver (lesson 9) carries a plan and a floor side by side and stops when the gap between them is small. An infeasible landing problem comes back with a dual object proving no trajectory works. And the shadow prices of lesson 2 are the dual variables.

## The Lagrangian and the dual function

Take the standard form of lesson 1:

$$
\text{minimize } f(\mathbf{x}) \quad \text{subject to} \quad g_i(\mathbf{x}) \le 0,\ i = 1,\dots,m, \qquad h_j(\mathbf{x}) = 0,\ j = 1,\dots,p,
$$

with best value $p^\star$ (read "p star", the **primal optimal value**).

Here is the everyday picture. Imagine the rules $g_i \le 0$ are not walls but fines. You may break rule $i$, but you pay $\lambda_i$ ("lambda i") for every unit you break it by. If you stay inside a rule, $g_i$ is negative, so the "fine" is negative: you get a small rebate. Equalities get a price $\nu_j$ ("nu j") that can be either sign.

Folding all the fines into the cost gives the **Lagrangian**, written $\mathcal{L}$ (a curly L):

$$
\mathcal{L}(\mathbf{x}, \boldsymbol{\lambda}, \boldsymbol{\nu}) = f(\mathbf{x}) + \sum_{i=1}^m \lambda_i\,g_i(\mathbf{x}) + \sum_{j=1}^p \nu_j\,h_j(\mathbf{x}),
$$

with $\lambda_i \ge 0$ and $\nu_j$ any real number — the same Lagrangian that gave the KKT conditions in lesson 2, put to a new use.

> The **Lagrange dual function** is $g(\boldsymbol{\lambda}, \boldsymbol{\nu}) = \inf_{\mathbf{x}} \mathcal{L}(\mathbf{x}, \boldsymbol{\lambda}, \boldsymbol{\nu})$, the lowest value of $\mathcal{L}$ over *all* $\mathbf{x}$ in the domain, feasible or not.

The symbol $\inf$ is the **[[infimum|infimum]]**: the greatest floor under a set of numbers, which is the minimum when the minimum exists. In words: set the fines, then let a clever cheater find the cheapest plan when breaking rules only costs money. That cheapest total is $g(\boldsymbol{\lambda}, \boldsymbol{\nu})$.

### It is always concave

Fix a plan $\mathbf{x}$. Then $f(\mathbf{x})$, $g_i(\mathbf{x})$ and $h_j(\mathbf{x})$ are fixed numbers, and $\mathcal{L}$ is a sum of prices times fixed numbers: an **[[affine|affine]]** function of $(\boldsymbol{\lambda}, \boldsymbol{\nu})$, a flat plane. The dual function is the lowest of all these planes, one plane per $\mathbf{x}$. The **[[lowest of a family of planes is always concave|lower-envelope]]** — it bends down, like an upside-down bowl — by the same argument lesson 3 used for the highest of a family of planes, with the inequality reversed.

Nothing about $f$, $g_i$ or $h_j$ was used. The problem can be nonconvex, even discontinuous, and $g$ is still concave.

### It is always a floor under $p^\star$

Take any feasible plan $\tilde{\mathbf{x}}$ (read "x tilde") and any prices with $\boldsymbol{\lambda} \ge \mathbf{0}$. Since $g_i(\tilde{\mathbf{x}}) \le 0$ and $\lambda_i \ge 0$, each $\lambda_i g_i(\tilde{\mathbf{x}}) \le 0$. And $h_j(\tilde{\mathbf{x}}) = 0$ wipes out the equality terms. So

$$
\mathcal{L}(\tilde{\mathbf{x}}, \boldsymbol{\lambda}, \boldsymbol{\nu}) = f(\tilde{\mathbf{x}}) + \sum_i \lambda_i g_i(\tilde{\mathbf{x}}) + \sum_j \nu_j h_j(\tilde{\mathbf{x}}) \le f(\tilde{\mathbf{x}}).
$$

The dual function is the lowest $\mathcal{L}$ over *every* $\mathbf{x}$, including $\tilde{\mathbf{x}}$, so $g(\boldsymbol{\lambda}, \boldsymbol{\nu}) \le \mathcal{L}(\tilde{\mathbf{x}}, \boldsymbol{\lambda}, \boldsymbol{\nu}) \le f(\tilde{\mathbf{x}})$. That holds for every feasible $\tilde{\mathbf{x}}$, so it holds for the best one:

$$
g(\boldsymbol{\lambda}, \boldsymbol{\nu}) \le p^\star \qquad \text{for every } \boldsymbol{\lambda} \ge \mathbf{0},\ \boldsymbol{\nu} .
$$

Three lines, and no convexity assumed. In the fines picture: an honest plan pays no positive fines, and the cheater may always choose it, so the cheater never does worse. Every price list gives a computable number that the true optimum cannot be below.

## The dual problem

Every price list gives a floor, so look for the highest one.

> The **dual problem** is: maximize $g(\boldsymbol{\lambda}, \boldsymbol{\nu})$ subject to $\boldsymbol{\lambda} \ge \mathbf{0}$. Its best value is $d^\star$ ("d star"). The original problem is now called the **primal**, and $p^\star - d^\star \ge 0$ is the **duality gap**.

Maximizing a concave function over a convex set is a convex problem, so the dual is always convex, even when the primal is not.

::: key Weak and strong duality
**Weak duality**: $d^\star \le p^\star$, always, and the gap is a bound you can trust. **Strong duality**: $d^\star = p^\star$, which holds for convex problems satisfying a constraint qualification such as Slater's condition.
:::

Weak duality has a useful consequence each way. If the dual can climb forever ($d^\star = +\infty$), the primal is infeasible: a feasible plan would cap every dual value. If the primal can fall forever ($p^\star = -\infty$), the dual is infeasible.

## The dual of a linear program

Take the LP of lesson 5 in inequality form: minimize $\mathbf{c}^\top\mathbf{x}$ subject to $\mathbf{A}\mathbf{x} \le \mathbf{b}$. With prices $\boldsymbol{\lambda} \ge \mathbf{0}$,

$$
\mathcal{L} = \mathbf{c}^\top\mathbf{x} + \boldsymbol{\lambda}^\top(\mathbf{A}\mathbf{x} - \mathbf{b}) = (\mathbf{c} + \mathbf{A}^\top\boldsymbol{\lambda})^\top\mathbf{x} - \mathbf{b}^\top\boldsymbol{\lambda} .
$$

The second step collects every term with $\mathbf{x}$ in it. Now $\mathcal{L}$ is a straight line in $\mathbf{x}$. A tilted line has no lowest point: slide along it and it drops to $-\infty$. Only a perfectly flat one has a finite floor. So

$$
g(\boldsymbol{\lambda}) =
\begin{cases}
-\mathbf{b}^\top\boldsymbol{\lambda}, & \mathbf{A}^\top\boldsymbol{\lambda} + \mathbf{c} = \mathbf{0}, \\
-\infty, & \text{otherwise},
\end{cases}
$$

and the dual problem is: maximize $-\mathbf{b}^\top\boldsymbol{\lambda}$ subject to $\mathbf{A}^\top\boldsymbol{\lambda} + \mathbf{c} = \mathbf{0}$ and $\boldsymbol{\lambda} \ge \mathbf{0}$.

The dual of an LP is an LP. A primal with $n$ variables and $m$ inequalities has a dual with $m$ variables and $n$ equalities. So a tall, thin primal has a short, wide dual, which is sometimes a reason to solve the dual instead.

::: example The dual of the two-engine split
Lesson 5 minimized the cost $1.2\,T_1 + 1.0\,T_2$ of two engines, subject to $T_1 + T_2 \ge 50$ and $0 \le T_i \le 30$ (thrusts in kN). The best corner was $(T_1, T_2) = (20, 30)$ with $p^\star = 1.2 \times 20 + 30 = 54$.

**Build the Lagrangian.** Keep the sign limits $T_i \ge 0$ as the allowed region and put prices on the other three rules. Write the requirement as $50 - T_1 - T_2 \le 0$ with price $\lambda$, and the ceilings as $T_i - 30 \le 0$ with prices $\mu_1, \mu_2$ ("mu"):

$$
\mathcal{L} = 1.2T_1 + T_2 + \lambda(50 - T_1 - T_2) + \mu_1(T_1 - 30) + \mu_2(T_2 - 30) .
$$

Collect terms. The coefficient of $T_1$ is $1.2 - \lambda + \mu_1$, the coefficient of $T_2$ is $1 - \lambda + \mu_2$, and the constant is $50\lambda - 30\mu_1 - 30\mu_2$.

**Find the floor.** Each $T_i$ ranges over $T_i \ge 0$. If its coefficient is negative, a huge $T_i$ drives $\mathcal{L}$ to $-\infty$. If the coefficient is zero or positive, the cheapest choice is $T_i = 0$, which leaves the constant. So the dual is

$$
\text{maximize } 50\lambda - 30\mu_1 - 30\mu_2 \quad \text{s.t.} \quad \lambda - \mu_1 \le 1.2, \quad \lambda - \mu_2 \le 1.0, \quad \lambda, \mu_1, \mu_2 \ge 0 .
$$

**Try some price lists.** At $(\lambda, \mu_1, \mu_2) = (1.0, 0, 0)$ both constraints hold ($1.0 \le 1.2$ and $1.0 \le 1.0$) and the value is $50$. That one line proves no engine split can cost less than $50$, without knowing where the optimum is. At $(1.1, 0, 0.1)$: $1.1 \le 1.2$ and $1.1 - 0.1 = 1.0 \le 1.0$, value $55 - 3 = 52$. At the prices lesson 5 read off the KKT conditions, $(1.2, 0, 0.2)$: value $60 - 6 = 54$. That equals $p^\star$. The gap is zero.

**Watch the bracket close.** The plan $(25, 30)$ is feasible with cost $30 + 30 = 60$. Paired with the floor $50$: $50 \le p^\star \le 60$. The plan $(22, 30)$ costs $26.4 + 30 = 56.4$; with the floor $52$: $52 \le p^\star \le 56.4$, a gap of $4.4$. At $(20, 30)$ and $(1.2, 0, 0.2)$ the gap is zero and the search is over. Sanity check: every floor is at or below $54$ and every plan's cost is at or above it, as weak duality demands.
:::

A primal-dual algorithm squeezes that **[[bracket|bracket-picture]]** shut, printing its width as it goes.

## Strong duality and Slater's condition

Weak duality is free. Strong duality, where the best floor actually touches $p^\star$, is not. It is what makes the certificate exact instead of merely informative.

> **Slater's condition**: the primal is convex, and there is a **strictly feasible** point — an $\mathbf{x}$ with $g_i(\mathbf{x}) < 0$ for every inequality that is not affine, and $h_j(\mathbf{x}) = 0$ for every equality. (Affine inequalities only need to hold, not strictly.) Then $p^\star = d^\star$, and if $p^\star$ is finite, some dual point $(\boldsymbol{\lambda}^\star, \boldsymbol{\nu}^\star)$ reaches it.

In plain words: if some plan has room to spare on every curved rule, the floor meets the answer. The condition is named after **[[Morton Slater|slater]]**.

For an LP every constraint is affine, so Slater's condition shrinks to "the problem is feasible". LP duality is exact whenever the LP is feasible.

For the landing SOCP of lesson 6, a strictly feasible point is a trajectory strictly inside the glide-slope cone, strictly below maximum throttle, and so on. One exists whenever the vehicle has any margin — exactly when you would be willing to fly. With *no* margin, the target exactly at the edge of reach, Slater's condition can fail. That is why the flown formulation of lesson 6 solves a reachability problem first.

::: warning Slater can fail, and then the multipliers may not exist
**No dual optimum.** Minimize $x$ subject to $x^2 \le 0$, over all real $x$. Only $x = 0$ is feasible, so $p^\star = 0$, and nothing is strictly feasible. The dual function is $g(\lambda) = \inf_x\,(x + \lambda x^2)$. For $\lambda > 0$ the parabola bottoms out at $x = -1/(2\lambda)$, giving $g(\lambda) = -1/(4\lambda)$; at $\lambda = 0$ it is $-\infty$. So $g(1) = -0.25$, $g(10) = -0.025$, $g(1000) = -0.00025$. The floor **[[creeps toward 0|creeping-floor]]** but never gets there. Here $d^\star = p^\star = 0$, yet **no best $\lambda$ exists**. Matching that, no $\lambda$ satisfies KKT stationarity, since $1 + 2\lambda x = 1 \ne 0$ at $x = 0$. A solver asked for multipliers here returns something huge and meaningless.

**A real gap.** Minimize $e^{-x}$ subject to $x^2/y \le 0$ on the domain $y > 0$. The constraint is the quadratic-over-linear function of lesson 3, so the problem is convex. Feasibility forces $x = 0$, so $p^\star = e^0 = 1$. For any $\lambda \ge 0$ the Lagrangian $e^{-x} + \lambda x^2/y$ is never negative. Choose $x = t$ and $y = t^3$: it becomes $e^{-t} + \lambda/t$. With $\lambda = 1$ that is $1.37$ at $t = 1$, $0.100$ at $t = 10$ and $0.010$ at $t = 100$, and the same slide to $0$ happens for every $\lambda$. So $g(\lambda) = 0$ for all $\lambda$, $d^\star = 0$, and the duality gap is $1$. Again, no strictly feasible point exists.

For flight software: a reported gap is a certificate only when the formulation has margin, so checking for a strictly feasible point is part of the design.
:::

## Complementary slackness falls out

Suppose strong duality holds and both optima are reached, at $\mathbf{x}^\star$ and $(\boldsymbol{\lambda}^\star, \boldsymbol{\nu}^\star)$. Then write this chain:

$$
f(\mathbf{x}^\star) = g(\boldsymbol{\lambda}^\star, \boldsymbol{\nu}^\star) = \inf_{\mathbf{x}} \mathcal{L}(\mathbf{x}, \boldsymbol{\lambda}^\star, \boldsymbol{\nu}^\star) \le \mathcal{L}(\mathbf{x}^\star, \boldsymbol{\lambda}^\star, \boldsymbol{\nu}^\star) = f(\mathbf{x}^\star) + \sum_i \lambda_i^\star g_i(\mathbf{x}^\star) \le f(\mathbf{x}^\star) .
$$

Step by step: the first equality is strong duality, the second is the definition of $g$. The first $\le$ holds because a floor over all $\mathbf{x}$ is at most the value at one $\mathbf{x}$. The next equality drops the equality terms, zero at a feasible point. The last $\le$ is "no positive fines".

The chain starts and ends at the same number, so every $\le$ in it must be an equality. That gives two results.

First, $\mathbf{x}^\star$ **minimizes the Lagrangian** at the optimal prices. For a differentiable problem that is stationarity, $\nabla_{\mathbf{x}}\mathcal{L}(\mathbf{x}^\star, \boldsymbol{\lambda}^\star, \boldsymbol{\nu}^\star) = \mathbf{0}$.

Second, $\sum_i \lambda_i^\star g_i(\mathbf{x}^\star) = 0$. Every term is a nonnegative number times a nonpositive one, so no term can be positive. A sum of terms that are all zero or negative can only total zero if each one is zero:

$$
\lambda_i^\star\,g_i(\mathbf{x}^\star) = 0 \quad \text{for every } i .
$$

That is **complementary slackness**, which lesson 2 stated and which is now derived: a rule with room to spare has price zero, and a rule with a positive price is tight. For a convex, differentiable problem satisfying Slater's condition, KKT is "strong duality holds and both optima are reached", unpacked.

## Certificates: what the solver hands back

::: key The two certificates
**Optimality**: a primal feasible $\mathbf{x}$ and a dual feasible $(\boldsymbol{\lambda}, \boldsymbol{\nu})$ with $f(\mathbf{x}) - g(\boldsymbol{\lambda}, \boldsymbol{\nu}) \le \epsilon$ prove that $\mathbf{x}$ is within $\epsilon$ of the global optimum, since $g \le p^\star \le f(\mathbf{x})$. **Infeasibility**: for the feasibility version of the problem (objective set to zero, so $p^\star = 0$ if any feasible point exists), a dual feasible point with $g(\boldsymbol{\lambda}, \boldsymbol{\nu}) > 0$ proves that no feasible point exists; for an LP, a ray along which the dual objective grows without bound does the same job.
:::

Both are checked with a handful of matrix-vector products. The guidance computer need not trust the solver's inner logic: a monitor far simpler than the solver can check the certificate in microseconds.

The infeasibility certificate deserves real numbers. Go back to the two engines and demand $70\,\mathrm{kN}$ in total when each engine tops out at $30$. Plainly infeasible, but a hunch does not fly. The dual objective is now $70\lambda - 30\mu_1 - 30\mu_2$, with the same constraints $\lambda - \mu_1 \le 1.2$ and $\lambda - \mu_2 \le 1.0$.

Walk along the **ray** — a half-line from the origin — $\lambda = \mu_1 = \mu_2 = t$ for $t \ge 0$. Both constraints read $0 \le 1.2$ and $0 \le 1.0$, true for every $t$. The objective is $70t - 60t = 10t$: that is $10$ at $t = 1$, $100$ at $t = 10$, $1000$ at $t = 100$. The dual climbs forever, so by weak duality the primal is infeasible. The *direction* $(1, 1, 1)$ is the proof.

Read it physically: the requirement pays in $70$ per unit of price, while the ceilings soak up only $30 + 30 = 60$. Demand beats supply by $10\,\mathrm{kN}$ whatever the split. The ray says the target is unreachable, by how much, and which constraints are to blame.

This is the practical content of the **theorem of alternatives**: exactly one of "there is a feasible $\mathbf{x}$" and "there is a dual ray that climbs forever" is true. **[[Farkas' lemma|farkas]]** is the linear case. A solver that says "infeasible" is really saying "here is the ray". Ask to see it: a typo in the model looks exactly like a physical impossibility until you read which constraints the ray leans on.

## Conic duality and the self-dual second-order cone

The landing problem is an SOCP, so the version of duality that matters is the cone version. Write the problem the way a conic solver takes it:

$$
\text{minimize } \mathbf{c}^\top\mathbf{x} \quad \text{subject to} \quad \mathbf{A}\mathbf{x} + \mathbf{s} = \mathbf{b}, \quad \mathbf{s} \in \mathcal{K}.
$$

Here $\mathbf{s}$ is a **slack** — the leftover room in each constraint — and $\mathcal{K}$ is a product of cones: a nonnegative orthant (all entries $\ge 0$) for linear inequalities, one second-order cone per norm constraint, and the cone $\{0\}$ for equalities.

The **dual cone**, $\mathcal{K}^*$ (read "K dual"), is

$$
\mathcal{K}^* = \{\mathbf{y} : \mathbf{y}^\top\mathbf{s} \ge 0 \text{ for all } \mathbf{s} \in \mathcal{K}\},
$$

the set of price vectors that never pay out a negative amount on an allowed slack.

Build $\mathcal{L} = \mathbf{c}^\top\mathbf{x} + \mathbf{y}^\top(\mathbf{A}\mathbf{x} + \mathbf{s} - \mathbf{b})$ and take its floor over $\mathbf{x} \in \mathbb{R}^n$ and $\mathbf{s} \in \mathcal{K}$. The $\mathbf{x}$ part is a line, so it forces $\mathbf{A}^\top\mathbf{y} + \mathbf{c} = \mathbf{0}$. The $\mathbf{s}$ part, $\inf_{\mathbf{s} \in \mathcal{K}} \mathbf{y}^\top\mathbf{s}$, is $0$ if $\mathbf{y} \in \mathcal{K}^*$ (take $\mathbf{s} = \mathbf{0}$); otherwise some allowed $\mathbf{s}$ gives a negative value, and scaling it up drives the floor to $-\infty$. So the dual is

$$
\text{maximize } -\mathbf{b}^\top\mathbf{y} \quad \text{subject to} \quad \mathbf{A}^\top\mathbf{y} + \mathbf{c} = \mathbf{0}, \quad \mathbf{y} \in \mathcal{K}^* .
$$

The nonnegative orthant is its own dual cone, which brings back the LP dual above. The second-order cone is its own dual too.

::: note Why the second-order cone is its own dual
Let $\mathcal{K} = \{(\mathbf{u}, t) : \|\mathbf{u}\|_2 \le t\}$. Take any $(\mathbf{v}, w)$ with $\|\mathbf{v}\|_2 \le w$. For every $(\mathbf{u}, t) \in \mathcal{K}$, the **[[Cauchy–Schwarz inequality|cauchy-schwarz]]** $\mathbf{u}^\top\mathbf{v} \ge -\|\mathbf{u}\|_2\|\mathbf{v}\|_2$ gives

$$
\mathbf{u}^\top\mathbf{v} + tw \ge -\|\mathbf{u}\|_2\|\mathbf{v}\|_2 + tw \ge -tw + tw = 0,
$$

so $(\mathbf{v}, w) \in \mathcal{K}^*$. Now the other way. If $\|\mathbf{v}\|_2 > w$, choose $\mathbf{u} = -\mathbf{v}/\|\mathbf{v}\|_2$ and $t = 1$, which is in $\mathcal{K}$. The pairing is $-\|\mathbf{v}\|_2 + w < 0$, so $(\mathbf{v}, w) \notin \mathcal{K}^*$. Together: $\mathcal{K}^* = \mathcal{K}$.
:::

So **the second-order cone is [[self-dual|self-dual-cone]]**. The dual of an SOCP is an SOCP with the same cones, which is why one solver can chase both iterates at once.

In practice a conic solver prints three numbers each iteration:

- the **primal residual** $\|\mathbf{A}\mathbf{x} + \mathbf{s} - \mathbf{b}\|$ — how badly the plan breaks its equations;
- the **dual residual** $\|\mathbf{A}^\top\mathbf{y} + \mathbf{c}\|$ — how badly the prices break theirs;
- the **gap** $\mathbf{c}^\top\mathbf{x} + \mathbf{b}^\top\mathbf{y}$, which is $f(\mathbf{x}) - g(\mathbf{y})$ written out.

All three below tolerance is the optimality certificate. The gap alone means nothing if the residuals are large: a dual point that breaks $\mathbf{A}^\top\mathbf{y} + \mathbf{c} = \mathbf{0}$ bounds nothing. Lesson 12 shows these numbers in a real solver log.

::: example The dual of the four-step minimum-energy descent
Lesson 5 solved: minimize $\tfrac{1}{2}\|\mathbf{u}\|_2^2$ subject to $\mathbf{F}\mathbf{u} = \mathbf{g}$, with

$$
\mathbf{F} = \begin{bmatrix} 1 & 1 & 1 & 1 \\ 3.5 & 2.5 & 1.5 & 0.5 \end{bmatrix}, \qquad \mathbf{g} = \begin{bmatrix} 0 \\ -10 \end{bmatrix},
$$

and got $\mathbf{u}^\star = (-3, -1, 1, 3)\ \mathrm{m/s^2}$ with $p^\star = \tfrac{1}{2}(9 + 1 + 1 + 9) = 10\ \mathrm{m^2/s^4}$.

**Build the dual.** There are only equalities, so $\mathcal{L} = \tfrac{1}{2}\mathbf{u}^\top\mathbf{u} + \boldsymbol{\nu}^\top(\mathbf{F}\mathbf{u} - \mathbf{g})$. This is a bowl in $\mathbf{u}$. Its gradient $\mathbf{u} + \mathbf{F}^\top\boldsymbol{\nu}$ is zero at $\mathbf{u} = -\mathbf{F}^\top\boldsymbol{\nu}$. Put that back in:

$$
g(\boldsymbol{\nu}) = -\tfrac{1}{2}\boldsymbol{\nu}^\top\mathbf{F}\mathbf{F}^\top\boldsymbol{\nu} - \boldsymbol{\nu}^\top\mathbf{g} .
$$

Four variables and two equalities became two variables and no constraints.

**Evaluate some floors.** From lesson 5, $\mathbf{F}\mathbf{F}^\top = \begin{bmatrix} 4 & 8 \\ 8 & 21 \end{bmatrix}$. At the guess $\boldsymbol{\nu} = (-3, 1.5)$: $\boldsymbol{\nu}^\top\mathbf{F}\mathbf{F}^\top\boldsymbol{\nu} = 4(9) + 2(8)(-3)(1.5) + 21(2.25) = 36 - 72 + 47.25 = 11.25$, and $-\boldsymbol{\nu}^\top\mathbf{g} = -(1.5)(-10) = 15$. So $g = -5.625 + 15 = 9.375$, and $p^\star \ge 9.375$. The guess $\boldsymbol{\nu} = (-5, 2.5)$ also gives $9.375$.

**Find the best floor.** Set the gradient $-\mathbf{F}\mathbf{F}^\top\boldsymbol{\nu} - \mathbf{g}$ to zero. The solution is $\boldsymbol{\nu}^\star = (-4, 2)$: check, $4(-4) + 8(2) = 0$ and $8(-4) + 21(2) = 10$. There $\boldsymbol{\nu}^\top\mathbf{F}\mathbf{F}^\top\boldsymbol{\nu} = 20$ and $-\boldsymbol{\nu}^\top\mathbf{g} = 20$, so $g = -10 + 20 = 10$ — exactly $p^\star$, as strong duality requires for a feasible convex QP. Sanity check: $-\mathbf{F}^\top\boldsymbol{\nu}^\star = (-3, -1, 1, 3)$, the same $\mathbf{u}^\star$ as before.

This $\boldsymbol{\nu}^\star$ is the multiplier pair lesson 5 got from KKT: the shadow prices on terminal velocity and altitude. What duality adds is the guarantee. Handed only $\boldsymbol{\nu} = (-3, 1.5)$, you already know no control history can bring the energy below $9.375\ \mathrm{m^2/s^4}$ — and knowing that early is what lets an algorithm stop with a stated tolerance.
:::

One more link back. In the landing LP of lesson 5, the multipliers $\nu_k$ on the velocity equations built the switching function $S_k = 1 - \nu_k$. Those $\nu_k$ are dual variables of exactly this kind, and they turn out to be the **[[costates of optimal control|costates]]** in disguise.

## Check yourself

::: check
A colleague's solver reports, for a convex minimization, a primal objective of $184.2$ and a dual objective of $184.9$. What do you conclude?
:::

::: answer
Something is wrong. Weak duality says any dual feasible value is a floor under every primal feasible cost, so a dual value *above* a primal value is impossible.

Likely causes: the primal point is not really feasible (residuals not converged, so $184.2$ is not a payable cost); the dual point is not really dual feasible; a sign convention was flipped; or the problem is not convex and the "dual value" is not the Lagrange dual. Check the residuals first, not the objectives. The gap means nothing until both residuals are small.
:::

::: check
Show that the dual of the dual of an LP is the LP again.
:::

::: answer
Start from the dual found above: maximize $-\mathbf{b}^\top\boldsymbol{\lambda}$ s.t. $\mathbf{A}^\top\boldsymbol{\lambda} + \mathbf{c} = \mathbf{0}$, $\boldsymbol{\lambda} \ge \mathbf{0}$. Flip it into a minimization: minimize $\mathbf{b}^\top\boldsymbol{\lambda}$ s.t. $\mathbf{A}^\top\boldsymbol{\lambda} + \mathbf{c} = \mathbf{0}$ and $-\boldsymbol{\lambda} \le \mathbf{0}$.

Give the equality the price $\mathbf{x}$ and the sign rule the price $\mathbf{z} \ge \mathbf{0}$:

$$
\mathcal{L} = \mathbf{b}^\top\boldsymbol{\lambda} + \mathbf{x}^\top(\mathbf{A}^\top\boldsymbol{\lambda} + \mathbf{c}) - \mathbf{z}^\top\boldsymbol{\lambda} = (\mathbf{b} + \mathbf{A}\mathbf{x} - \mathbf{z})^\top\boldsymbol{\lambda} + \mathbf{c}^\top\mathbf{x}.
$$

The floor over $\boldsymbol{\lambda}$ is $-\infty$ unless the coefficient vanishes, $\mathbf{z} = \mathbf{A}\mathbf{x} + \mathbf{b}$; then it is $\mathbf{c}^\top\mathbf{x}$. So the dual of the dual is: maximize $\mathbf{c}^\top\mathbf{x}$ subject to $\mathbf{A}\mathbf{x} + \mathbf{b} \ge \mathbf{0}$. Undo the sign flip made at the start (replace $\mathbf{x}$ by $-\mathbf{x}$ and the maximization by a minimization) and it reads: minimize $\mathbf{c}^\top\mathbf{x}$ s.t. $\mathbf{A}\mathbf{x} \le \mathbf{b}$. That is the original LP: neither problem is more basic than the other.
:::

::: check
The thrust requirement in the two-engine problem is $50\,\mathrm{kN}$ and the optimal $\lambda^\star = 1.2$. Using only the dual problem, explain why the optimal cost rises at exactly $1.2$ per extra kN of requirement, and predict where that rate changes.
:::

::: answer
With requirement $b$, the dual objective is $b\lambda - 30\mu_1 - 30\mu_2$. Changing $b$ changes the objective but not the dual feasible set. So while the best dual corner stays at $(1.2, 0, 0.2)$, the optimal value is $1.2b - 6$, rising at $\lambda^\star = 1.2$ per kN — the shadow price of lesson 2, with no differentiating.

The rate changes when the best dual corner changes. Compare the corner $(1.0, 0, 0)$, worth $b$. The two are equal when $1.2b - 6 = b$, at $b = 30$. Below $30\,\mathrm{kN}$ the corner $(1.0, 0, 0)$ wins, so the cost is $b$ and the rate is $1.0$: engine 2 alone carries the load. Above $b = 60$ the ray $\lambda = \mu_1 = \mu_2 = t$ gives $(b - 60)t$, which climbs forever, so the dual is unbounded and the primal infeasible. Sanity check at $b = 60$: $1.2(60) - 6 = 66$, matching both engines at full thrust, $36 + 30$. The kinks in the cost curve sit at $30$ (one engine's capacity) and $60$ (both engines' capacity).
:::

::: check
Why is the dual function concave even when the primal problem is nonconvex, and what does that buy a nonconvex trajectory optimizer?
:::

::: answer
For each fixed $\mathbf{x}$, $\mathcal{L}$ is affine in the prices, because the prices only multiply the fixed numbers $f(\mathbf{x})$, $g_i(\mathbf{x})$ and $h_j(\mathbf{x})$. The dual function is the lowest of this family of flat functions, and the lowest of any family of affine functions is concave.

What it buys: a *valid global* floor under a nonconvex problem's optimum, found by maximizing a concave function. **[[Branch-and-bound|branch-and-bound]]** uses exactly this to throw away sub-regions whose floor is already worse than the best plan found. The catch: for a nonconvex primal the gap $p^\star - d^\star$ is usually positive, so the floor never proves optimality. It only prunes.
:::

::: check
A landing solver returns "infeasible" with a dual ray whose largest entries are the prices on the glide-slope cones at the last five time nodes. What has probably happened, and what would you change?
:::

::: answer
The ray is the proof, and the constraints it weights most are doing the blocking. The vehicle cannot both reach the pad and stay inside the narrow cone near the ground. The cone pinches to a point at zero altitude, so a small sideways error late in the descent cannot be fixed.

Sensible responses, in order: check that the glide-slope half-angle has not been set unrealistically tight near touchdown (a cone that is exact at $r_z = 0$ is a modeling artifact); relax the cone at the last few nodes, or swap it for a fixed sideways box below some altitude; or accept the answer and let the reachability solve of lesson 6 retarget to the nearest reachable point. Do not retry from a different starting guess: a convex infeasibility certificate is about the problem, not the start, and it will come back the same every time.
:::

## Summary

| Object | Statement |
| --- | --- |
| Lagrangian | $\mathcal{L} = f + \sum_i \lambda_i g_i + \sum_j \nu_j h_j$, with $\lambda_i \ge 0$ |
| Dual function | $g(\boldsymbol{\lambda}, \boldsymbol{\nu}) = \inf_{\mathbf{x}}\mathcal{L}$; always concave, even for a nonconvex primal |
| Weak duality | $g(\boldsymbol{\lambda}, \boldsymbol{\nu}) \le p^\star$ for all $\boldsymbol{\lambda} \ge \mathbf{0}$; hence $d^\star \le p^\star$ |
| Strong duality | $d^\star = p^\star$ for a convex problem satisfying Slater's condition (a strictly feasible point) |
| Duality gap | $p^\star - d^\star \ge 0$; for a pair of iterates, $f(\mathbf{x}) - g(\boldsymbol{\lambda}, \boldsymbol{\nu})$ is a computable bracket width |
| LP dual | max $-\mathbf{b}^\top\boldsymbol{\lambda}$ s.t. $\mathbf{A}^\top\boldsymbol{\lambda} + \mathbf{c} = \mathbf{0}$, $\boldsymbol{\lambda} \ge \mathbf{0}$; the dual of the dual is the primal |
| Two-engine example | $p^\star = d^\star = 54$ at $(\lambda, \mu_1, \mu_2) = (1.2, 0, 0.2)$; bracket $[52, 56.4]$ at an in-between pair |
| Complementary slackness | $\lambda_i^\star g_i(\mathbf{x}^\star) = 0$; follows from a zero gap |
| Optimality certificate | Primal feasible $\mathbf{x}$ plus dual feasible $(\boldsymbol{\lambda}, \boldsymbol{\nu})$ with gap $\le \epsilon$ |
| Infeasibility certificate | A dual ray that climbs forever; for $T_1 + T_2 \ge 70$ with $T_i \le 30$, the ray $(1,1,1)$ gives $10t \to \infty$ |
| Conic dual | max $-\mathbf{b}^\top\mathbf{y}$ s.t. $\mathbf{A}^\top\mathbf{y} + \mathbf{c} = \mathbf{0}$, $\mathbf{y} \in \mathcal{K}^*$ |
| Self-duality | $\mathcal{K}^* = \mathcal{K}$ for the nonnegative orthant and for the second-order cone |
| Solver output | Primal residual, dual residual, gap — all three must be small for the certificate to mean anything |

Next lesson climbs one more rung up the ladder of cones, to the semidefinite program, where the cone is a set of matrices. That cone is self-dual too, so everything here carries over word for word. After that, interior-point methods put the plan and the prices into one Newton step and squeeze this lesson's gap to zero.

::: context infimum Floor, not always a minimum
The **minimum** of a set of numbers is its smallest member. Some sets have no smallest member. The numbers $0.1, 0.01, 0.001, \ldots$ keep getting smaller, and none of them is the smallest — but $0$ is a floor under all of them, and no higher floor works. That best floor is the **infimum**, written $\inf$ (Latin for "lowest").

When a minimum exists, it *is* the infimum. Mathematicians write $\inf$ in the dual function because the lowest value of $\mathcal{L}$ is sometimes approached but never reached. The first warning in this lesson has exactly such a case.
:::

::: context affine Flat, but not always through zero
An **affine** function is a straight line, or a flat plane in more dimensions: a constant plus a sum of fixed numbers times the variables, like $3 - 2\lambda + 5\nu$. "Linear" in the strict sense also demands that it pass through zero; affine allows the shift. In the Lagrangian, once the plan $\mathbf{x}$ is fixed, $f(\mathbf{x})$ is the constant and $g_i(\mathbf{x})$, $h_j(\mathbf{x})$ are the fixed numbers multiplying the prices.
:::

::: context lower-envelope Why the lowest of many lines bends down
Draw a few straight lines and trace, at each point, whichever line is lowest. The traced path can only turn downward where two lines cross, never upward. That shape is concave — an upside-down bowl.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="150" x2="340" y2="150" stroke="#6c7a93" stroke-width="1"/>
  <line x1="30" y1="140" x2="340" y2="16" stroke="#8fb8f0" stroke-width="1.5"/>
  <line x1="30" y1="100" x2="340" y2="100" stroke="#8fb8f0" stroke-width="1.5"/>
  <line x1="30" y1="20" x2="340" y2="144" stroke="#8fb8f0" stroke-width="1.5"/>
  <polyline points="30,140 130,100 230,100 340,144" fill="none" stroke="#1d6fd1" stroke-width="4"/>
  <text x="180" y="124" font-size="12" text-anchor="middle" fill="#1d6fd1">lowest line: concave</text>
  <text x="345" y="163" font-size="11" text-anchor="end" fill="#1f2a44">prices λ</text>
</svg>
```

In the dual function each line is $\mathcal{L}$ for one fixed plan $\mathbf{x}$, and there is one line for every possible plan. However strange the plans are, the lowest of lines still bends down.
:::

::: context bracket-picture The bracket closing on 54
Every feasible plan's cost is a ceiling on the answer. Every dual feasible price list is a floor. For the two engines, the pairs from the example squeeze in from both sides until they meet at $54$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="100" x2="340" y2="100" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="30" y1="95" x2="30" y2="105"/><line x1="90" y1="95" x2="90" y2="105"/><line x1="150" y1="95" x2="150" y2="105"/><line x1="222" y1="95" x2="222" y2="105"/><line x1="330" y1="95" x2="330" y2="105"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="30" y="120">50</text><text x="90" y="120">52</text><text x="150" y="120">54</text><text x="222" y="120">56.4</text><text x="330" y="120">60</text>
  </g>
  <line x1="30" y1="30" x2="330" y2="30" stroke="#8fb8f0" stroke-width="6"/>
  <line x1="90" y1="55" x2="222" y2="55" stroke="#1d6fd1" stroke-width="6"/>
  <circle cx="150" cy="80" r="5" fill="#b4232c"/>
  <text x="330" y="22" font-size="11" text-anchor="end" fill="#1f2a44">floor 50, plan 60</text>
  <text x="230" y="59" font-size="11" text-anchor="start" fill="#1f2a44">52 to 56.4</text>
  <text x="160" y="84" font-size="11" text-anchor="start" fill="#b4232c">gap zero at 54</text>
</svg>
```

A solver prints the width of this bar every iteration. That width is the duality gap.
:::

::: context slater Who Slater was
Morton Slater was an American mathematician who wrote a short 1950 report, while working with the Cowles Commission for economic research, showing that Lagrange multipliers exist for convex problems once a strictly feasible point exists. Economists cared because multipliers are prices. His condition is now the standard test solvers and textbooks use. It is easy to check in practice: find one plan that satisfies every curved constraint with room to spare.
:::

::: context creeping-floor A floor that never arrives
In the problem "minimize $x$ subject to $x^2 \le 0$", the best floor for each price is $g(\lambda) = -1/(4\lambda)$. Raise the price and the floor creeps up toward the true answer $0$, but no finite price ever reaches it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="30" x2="340" y2="30" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="5,4"/>
  <text x="340" y="22" font-size="11" text-anchor="end" fill="#b4232c">p* = 0</text>
  <line x1="40" y1="20" x2="40" y2="155" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="155" x2="340" y2="155" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline points="47.5,155.0 55.0,92.5 62.5,71.7 70.0,61.2 85.0,50.8 100.0,45.6 130.0,40.4 160.0,37.8 220.0,35.2 280.0,33.9 340.0,33.1" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <g font-size="11" fill="#1f2a44">
    <text x="30" y="34" text-anchor="end">0</text>
    <text x="30" y="159" text-anchor="end">−1</text>
    <text x="340" y="168" text-anchor="end">λ = 10</text>
    <text x="40" y="168" text-anchor="middle">0</text>
  </g>
  <text x="200" y="60" font-size="12" fill="#1d6fd1">g(λ) = −1/(4λ)</text>
</svg>
```

That is what a missing dual optimum looks like: the gap closes only in the limit, and the multiplier a solver reports keeps growing.
:::

::: context farkas Farkas and the alternative
Gyula Farkas was a Hungarian physicist and mathematician. His lemma, published in 1902, says: for a system of linear inequalities, either it has a solution, or there is a weighted combination of the inequalities (with nonnegative weights) that adds up to something plainly impossible, like $0 \ge 10$. Never both, never neither.

In the two-engine case, add the requirement $T_1 + T_2 \ge 70$ to the two ceilings $-T_1 \ge -30$ and $-T_2 \ge -30$, each with weight $1$: the thrusts cancel and you get $0 \ge 10$. The weights $(1, 1, 1)$ are the ray.
:::

::: context cauchy-schwarz The Cauchy–Schwarz inequality
For two vectors, $|\mathbf{u}^\top\mathbf{v}| \le \|\mathbf{u}\|_2\|\mathbf{v}\|_2$. The dot product equals $\|\mathbf{u}\|\|\mathbf{v}\|\cos\theta$, where $\theta$ is the angle between the arrows, and a cosine is never bigger than $1$ or smaller than $-1$. The dot product is most negative when the arrows point in exactly opposite directions — which is why the proof picks $\mathbf{u} = -\mathbf{v}/\|\mathbf{v}\|_2$ to break the inequality.
:::

::: context self-dual-cone A cone that is its own dual
With one sideways coordinate $u$ and a height $t$, the second-order cone $|u| \le t$ is a wedge with a $90°$ opening, between the lines $t = u$ and $t = -u$. The dual cone holds every arrow whose dot product with every arrow in the wedge is at least zero, meaning it makes an angle of at most $90°$ with all of them. The arrows that do that are exactly the arrows of the same wedge.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <polygon points="180,150 50,20 310,20" fill="#8fb8f0" fill-opacity="0.5" stroke="none"/>
  <line x1="180" y1="150" x2="50" y2="20" stroke="#1f2a44" stroke-width="2"/>
  <line x1="180" y1="150" x2="310" y2="20" stroke="#1f2a44" stroke-width="2"/>
  <line x1="40" y1="150" x2="320" y2="150" stroke="#6c7a93" stroke-width="1"/>
  <line x1="180" y1="160" x2="180" y2="12" stroke="#6c7a93" stroke-width="1"/>
  <line x1="180" y1="150" x2="230" y2="80" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="230,80 219,86 227,92" fill="#1d6fd1"/>
  <text x="236" y="84" font-size="12" fill="#1d6fd1">(v, w)</text>
  <text x="70" y="46" font-size="12" fill="#1f2a44">t = −u</text>
  <text x="248" y="46" font-size="12" fill="#1f2a44">t = u</text>
  <text x="180" y="165" font-size="11" text-anchor="middle" fill="#1f2a44">0</text>
  <text x="315" y="143" font-size="11" text-anchor="end" fill="#1f2a44">u</text>
</svg>
```

The edges are $90°$ apart, so any two arrows inside the wedge are at most $90°$ apart and their dot product is never negative.
:::

::: context costates Multipliers and costates are the same thing
The multipliers $\nu_k$ on the landing LP's dynamics equations obey a backward recursion: each one is fixed by the one after it. That recursion is the discrete form of the **costate equation** of optimal control, from Pontryagin's maximum principle, which you will meet in the optimal-control module. The costates of the continuous problem and the multipliers of the chopped-up problem are the same object at two resolutions.

So a solver's dual output on a trajectory problem is worth plotting. A switching function $S_k = 1 - \nu_k$ that changes sign once means a single-switch bang-bang burn. One that hovers near zero over a stretch warns you of a singular arc.
:::

::: context branch-and-bound Pruning a search with floors
Branch-and-bound solves hard nonconvex problems by splitting the search space into pieces. For each piece it computes a cheap floor — often a dual bound or a convex relaxation. If a piece's floor is already worse than the best plan found anywhere so far, nothing inside that piece can win, and the whole piece is thrown away unexplored. Mission planners use this for problems with on/off choices, such as which of several engines to light.
:::
