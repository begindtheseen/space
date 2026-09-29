---
id: l09-interior-point-methods
title: Interior-point methods
minutes: 24
covers:
  - interior-point methods
---

Picture crossing a dark room full of furniture. One way is to walk until you bump into something, then slide along it. Another is to feel every wall push back harder the closer you get, so you drift down the middle of the floor toward the door. The first is how an active-set method treats constraints. The second is an **[[interior-point method|karmarkar]]** — an algorithm that stays strictly inside the allowed region the whole way and only closes in on its edges at the very end.

Lesson 4 promised that a convex problem can be solved in a number of steps you can bound before flight. This lesson keeps the promise. The method turns a constrained problem into a short chain of Newton solves, reaches the global optimum in a few tens of iterations on a lander-sized problem, and the count barely moves when the data changes. That last property makes a worst-case timing argument possible.

The idea in plain words: inequality constraints are awkward because each is either active (tight) or not, and guessing which is what makes active-set methods unpredictable. So replace each hard wall with a smooth penalty that is nearly zero well inside the feasible set and shoots up at the edge. Solve that smooth problem with Newton's method. Then sharpen the penalty until the answer is as accurate as you need. The iterates never touch the edge — hence *interior* point.

It works unchanged for LP, QP, SOCP and SDP, since it only needs a barrier for the cone. The examples are LPs, small enough to print, and the last one carries the counts across to the landing SOCP of lesson 6.

## The barrier

Take the convex problem in the form of lesson 1, with the equalities kept visible:

$$
\text{minimize } f_0(\mathbf{x}) \quad \text{subject to} \quad g_i(\mathbf{x}) \le 0,\ i = 1,\dots,m, \qquad \mathbf{F}\mathbf{x} = \mathbf{g} .
$$

Here $f_0$ ("f nought") is the cost, the $g_i$ are the $m$ inequality constraints, and $\mathbf{F}\mathbf{x} = \mathbf{g}$ collects the equalities.

An inequality constraint is really an infinite penalty. Add to the cost the **indicator** $I(u)$, which is $0$ for $u \le 0$ and $+\infty$ for $u > 0$, and any plan that breaks the constraint costs infinity. But the indicator is a cliff with no useful slope, so a method that follows derivatives cannot use it. Replace it with a smooth ramp:

$$
I(u) \approx -\frac{1}{t}\log(-u), \qquad t > 0 .
$$

For $u$ well below zero the value is small. As $u$ climbs toward zero, $\log(-u)$ dives to $-\infty$, so the expression shoots to $+\infty$. And as $t$ grows, the $1/t$ flattens the ramp everywhere except at the wall, so it hugs the indicator more tightly.

Add up one such term per constraint and you get the **[[logarithmic barrier|barrier-picture]]** — a smooth wall-repeller built from logs:

$$
\phi(\mathbf{x}) = -\sum_{i=1}^m \log\big(-g_i(\mathbf{x})\big) .
$$

Read $\phi$ as "phi". It is defined only on the strict interior, where every $g_i(\mathbf{x}) < 0$. It is convex whenever the $g_i$ are, by the composition rules of lesson 3: $-\log$ is convex and decreasing, and each $g_i$ is convex.

The **centering problem** trades the cost against the barrier:

$$
\text{minimize } t\,f_0(\mathbf{x}) + \phi(\mathbf{x}) \quad \text{subject to } \mathbf{F}\mathbf{x} = \mathbf{g} .
$$

It is smooth, convex and has only equalities, so Newton's method handles it with the KKT linear solve of lesson 5. Write its solution as $\mathbf{x}^\star(t)$. As $t$ runs from $0$ to $\infty$, the points $\mathbf{x}^\star(t)$ trace a curve called the **[[central path|central-path-line]]**. At small $t$ the barrier dominates, and $\mathbf{x}^\star(t)$ sits deep inside, as far from every constraint as the barrier's sense of distance allows. At large $t$ the cost dominates, and $\mathbf{x}^\star(t)$ slides toward the optimum.

### The gap on the central path is exactly $m/t$

This fact lets the method check its own work. At the solution of the centering problem the gradient is zero (with a term for the equalities and some multiplier $\hat{\boldsymbol{\nu}}$, read "nu hat"):

$$
t\,\nabla f_0(\mathbf{x}^\star(t)) + \sum_{i=1}^m \frac{-1}{g_i(\mathbf{x}^\star(t))}\nabla g_i(\mathbf{x}^\star(t)) + \mathbf{F}^\top\hat{\boldsymbol{\nu}} = \mathbf{0} .
$$

The middle term is the derivative of $-\log(-g_i)$. Now divide the whole line by $t$ and give the pieces names:

$$
\lambda_i(t) = \frac{-1}{t\,g_i(\mathbf{x}^\star(t))} > 0, \qquad \boldsymbol{\nu}(t) = \hat{\boldsymbol{\nu}}/t .
$$

Each $\lambda_i(t)$ is positive because $g_i < 0$ inside. What is left is the stationarity condition of the Lagrangian at the prices $(\boldsymbol{\lambda}(t), \boldsymbol{\nu}(t))$, so $\mathbf{x}^\star(t)$ minimizes the Lagrangian there, and the prices are **dual feasible**. By lesson 7 the dual function is the Lagrangian at that minimizer:

$$
g(\boldsymbol{\lambda}(t), \boldsymbol{\nu}(t)) = f_0(\mathbf{x}^\star(t)) + \sum_i \lambda_i(t) g_i(\mathbf{x}^\star(t)) + \boldsymbol{\nu}(t)^\top(\mathbf{F}\mathbf{x}^\star - \mathbf{g}) = f_0(\mathbf{x}^\star(t)) - \frac{m}{t} .
$$

Each of the $m$ products $\lambda_i g_i$ is $-1/t$, and the equality term is zero. The dual value is a floor under $p^\star$, so

$$
f_0(\mathbf{x}^\star(t)) - p^\star \le \frac{m}{t} .
$$

Every point on the central path carries its own certificate, tightening in proportion to $t$. Want six digits on a problem with $m = 600$ inequalities? Take $t = 600/10^{-6} = 6\times10^8$ and stop.

::: example The central path of a one-variable problem
Minimize $x$ subject to $0 \le x \le 1$. The answer is plainly $p^\star = 0$ at $x = 0$, and there are $m = 2$ constraints: $g_1 = -x \le 0$ and $g_2 = x - 1 \le 0$.

**Set up the barrier problem.** Minimize $tx - \log x - \log(1-x)$. Set the derivative to zero, multiply through by $x(1-x)$, and solve the quadratic:

$$
t - \frac{1}{x} + \frac{1}{1-x} = 0 \quad\Longrightarrow\quad t x^2 - (t+2)x + 1 = 0 \quad\Longrightarrow\quad x^\star(t) = \frac{(t+2) - \sqrt{t^2+4}}{2t},
$$

taking the root that lies inside $(0,1)$.

**Walk along the path.**

| $t$ | $x^\star(t)$ | $f_0 - p^\star$ | bound $m/t$ |
| --- | --- | --- | --- |
| $1$ | $0.38197$ | $0.38197$ | $2$ |
| $2$ | $0.29289$ | $0.29289$ | $1$ |
| $10$ | $0.09010$ | $0.09010$ | $0.2$ |
| $100$ | $0.00990$ | $0.00990$ | $0.02$ |
| $1000$ | $0.000999$ | $0.000999$ | $0.002$ |

The iterate approaches the optimum like $1/t$, never reaching the wall, and the certificate $m/t$ is about a factor of two loose.

**Read off the dual point at $t = 10$.** $\lambda_1 = -1/(t g_1) = 1/(tx) = 1/(10 \times 0.09010) = 1.1099$, and $\lambda_2 = 1/(t(1-x)) = 1/(10 \times 0.90990) = 0.10990$. For this problem, dual feasibility requires the Lagrangian's slope in $x$ to vanish, $1 - \lambda_1 + \lambda_2 = 0$, and indeed $1 - 1.1099 + 0.1099 = 0$ to machine precision.

**Check the bracket.** The dual value is $-\lambda_2 = -0.10990$, which equals $f_0 - m/t = 0.09010 - 0.2$. So the bracket is $[-0.1099,\ 0.0901]$, width $0.2 = m/t$, and it contains $p^\star = 0$, as it must. At $t = 100$ the bracket is $[-0.01010,\ 0.00990]$.
:::

## The barrier method and its iteration count

The algorithm: pick $t_0$ and a strictly feasible start. Solve the centering problem by Newton's method. Multiply $t$ by a factor $\mu$ ("mu", typically $10$ to $100$ — not the same $\mu$ as in the next section; solvers reuse the letter). Re-center, starting from the previous solution. Stop when $m/t \le \epsilon$, where $\epsilon$ ("epsilon") is the accuracy you want.

Starting from $t_0$, after $k$ multiplications $t = t_0\mu^k$, and you need $t_0\mu^k \ge m/\epsilon$. Take logs and round up. The number of **outer** iterations is

$$
\left\lceil \frac{\log\big(m/(t_0\epsilon)\big)}{\log\mu} \right\rceil .
$$

The brackets $\lceil\ \rceil$ mean "round up to a whole number". For $m = 2$, $t_0 = 1$, $\mu = 10$ and $\epsilon = 10^{-8}$ this is $\lceil \log_{10}(2\times10^8) \rceil = \lceil 8.30 \rceil = 9$.

Each outer iteration costs a handful of Newton steps, because the previous center is an excellent start for the next: the path is smooth and $\mu$ is not huge. The whole method is tens of Newton steps, each a KKT linear solve.

The logarithmic barrier is not an arbitrary choice. It belongs to the class of **[[self-concordant|self-concordant]]** functions — functions whose third derivative is kept in check by their second. For those, Newton's method has an *affine invariant* analysis: stretching, rotating or rescaling the variables changes nothing. The steps to re-center depend only on how far the start is from the center in the barrier's own ruler, not on the condition number, the units or the data.

That is why the iteration count is nearly the same from problem to problem, and lesson 4's bound rests on it. The classical result: a short-step barrier method reaches accuracy $\epsilon$ in $O(\sqrt{\nu}\,\log(1/\epsilon))$ Newton steps, where $\nu$ ("nu") is the **barrier parameter** of the cone: $m$ for $m$ scalar inequalities, $2$ per second-order cone whatever its size, and $n$ for an $n \times n$ semidefinite block.

::: key Why interior-point methods are what fly
On a convex problem an interior-point method converges to the global optimum in a bounded, essentially data-independent number of iterations (tens), detects infeasibility, and has no local minima to get trapped in — so you can certify the worst-case runtime for a real-time deadline. The theoretical bound is $O(\sqrt{\nu}\log(1/\epsilon))$ Newton steps; the observed count is far smaller and hardly varies with the data.
:::

::: note Newton's method, revisited
Every interior-point iteration is one Newton step of lesson 1 on the barrier-boosted cost, kept on the equalities. Gradient descent was crippled by the condition number; Newton's method escapes because linear changes of variable do not affect it, and self-concordance makes that precise. In one sentence, why convex optimization is a solved engineering problem and nonlinear optimization is not: for self-concordant barriers, "how far am I from the answer" can be measured so that Newton's method shrinks it by a fixed factor, whatever the data.
:::

## Primal-dual methods: what solvers actually do

Production solvers use a faster, sturdier variant, and it explains the columns in a solver's log. Instead of hiding the multipliers inside the barrier, keep them as unknowns beside the plan and nudge the KKT conditions of lesson 2. Write the LP in **standard form**: minimize $\mathbf{c}^\top\mathbf{x}$ subject to $\mathbf{A}\mathbf{x} = \mathbf{b}$ and $\mathbf{x} \ge \mathbf{0}$. Its dual is: maximize $\mathbf{b}^\top\mathbf{y}$ subject to $\mathbf{A}^\top\mathbf{y} + \mathbf{z} = \mathbf{c}$ and $\mathbf{z} \ge \mathbf{0}$. Here $\mathbf{y}$ holds the prices on the equalities and $\mathbf{z}$ the prices on the signs.

The KKT conditions are primal feasibility, dual feasibility, and complementarity $x_j z_j = 0$ — the all-or-nothing part. Soften it to

$$
x_j z_j = \sigma\mu \quad \text{for all } j, \qquad \mu = \frac{\mathbf{x}^\top\mathbf{z}}{n} .
$$

Now $\mu$ is the average product $x_j z_j$ — how far from complementary you are — and the **centering parameter** $\sigma$ ("sigma"), between $0$ and $1$, says how hard to push it down. Take one Newton step on this square system in $(\mathbf{x}, \mathbf{y}, \mathbf{z})$. Writing $\mathbf{X} = \operatorname{diag}(\mathbf{x})$ and $\mathbf{Z} = \operatorname{diag}(\mathbf{z})$ for the diagonal matrices built from those vectors, and $\mathbf{e}$ for the vector of all ones, the Newton system is

$$
\begin{bmatrix} \mathbf{0} & \mathbf{A}^\top & \mathbf{I} \\ \mathbf{A} & \mathbf{0} & \mathbf{0} \\ \mathbf{Z} & \mathbf{0} & \mathbf{X}\end{bmatrix}
\begin{bmatrix} \Delta\mathbf{x} \\ \Delta\mathbf{y} \\ \Delta\mathbf{z}\end{bmatrix}
=
\begin{bmatrix} \mathbf{r}_d \\ \mathbf{r}_p \\ \mathbf{r}_c \end{bmatrix},
$$

with the **residuals** — how far each condition is from holding — $\mathbf{r}_p = \mathbf{b} - \mathbf{A}\mathbf{x}$, $\mathbf{r}_d = \mathbf{c} - \mathbf{A}^\top\mathbf{y} - \mathbf{z}$ and $\mathbf{r}_c = -\mathbf{X}\mathbf{Z}\mathbf{e} + \sigma\mu\mathbf{e}$.

Eliminate $\Delta\mathbf{z}$ and then $\Delta\mathbf{x}$, and the system shrinks to the **[[normal equations|normal-equations]]** $\mathbf{A}\mathbf{D}\mathbf{A}^\top\Delta\mathbf{y} = \text{(known)}$, with the diagonal matrix $\mathbf{D} = \mathbf{Z}^{-1}\mathbf{X}$. That is a positive definite system the size of the equality constraints. One factorization per iteration; everything else is cheap.

Three refinements make it work in practice.

1. **Fraction to the boundary.** After computing the step, take a step length $\alpha$ of at most $\eta$ ("eta") times the distance to the boundary, with $\eta = 0.99$ or $0.995$, so the iterate stays inside. Primal and dual step lengths may differ.
2. **[[Mehrotra's predictor-corrector|mehrotra]].** First solve with $\sigma = 0$ — the pure Newton, or *affine scaling*, direction — and let the resulting $\mu_{\text{aff}}$ set $\sigma = (\mu_{\text{aff}}/\mu)^3$. Then solve again, reusing the same factorization, with a correction term for the second-order error $\Delta\mathbf{X}_{\text{aff}}\Delta\mathbf{Z}_{\text{aff}}\mathbf{e}$. Two back-substitutions, one factorization, and typically half the iterations of a fixed-$\sigma$ method.
3. **Infeasible start.** The residuals $\mathbf{r}_p$ and $\mathbf{r}_d$ sit on the right-hand side, so the method does not need a feasible start — only a strictly positive one. Feasibility and optimality are reached together.

::: example A primal-dual solve of the two-engine LP, iteration by iteration
Put the problem of lessons 5 and 7 into standard form. The unknowns are $\mathbf{x} = (T_1, T_2, s_1, s_2, s_3) \ge \mathbf{0}$: the two thrusts, a surplus $s_1$ on the requirement, and slacks $s_2, s_3$ on the two ceilings. Then

$$
\mathbf{A} = \begin{bmatrix} 1 & 1 & -1 & 0 & 0 \\ 1 & 0 & 0 & 1 & 0 \\ 0 & 1 & 0 & 0 & 1\end{bmatrix}, \quad \mathbf{b} = \begin{bmatrix} 50 \\ 30 \\ 30\end{bmatrix}, \quad \mathbf{c} = (1.2, 1, 0, 0, 0) .
$$

Row one says $T_1 + T_2 - s_1 = 50$; the others say $T_i + s_{i+1} = 30$.

**Start badly on purpose.** Take $\mathbf{x} = 10\,\mathbf{e}$, $\mathbf{y} = \mathbf{0}$, $\mathbf{z} = \mathbf{e}$. That $\mathbf{x}$ is infeasible: $\mathbf{r}_p = \mathbf{b} - \mathbf{A}\mathbf{x} = (40, 10, 10)$, of length $\sqrt{1800} = 42.4$. Mehrotra's method with $\eta = 0.99$ gives:

| it | primal $\mathbf{c}^\top\mathbf{x}$ | dual $\mathbf{b}^\top\mathbf{y}$ | gap | $\mu$ | $\|\mathbf{r}_p\|$ | $\|\mathbf{r}_d\|$ |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | $22.000$ | $0.000$ | $2.2\times10^{1}$ | $1.0\times10^{1}$ | $4.2\times10^{1}$ | $1.7\times10^{0}$ |
| 1 | $59.751$ | $44.424$ | $1.5\times10^{1}$ | $4.8\times10^{0}$ | $5.6\times10^{0}$ | $1.1\times10^{-1}$ |
| 2 | $58.889$ | $53.644$ | $5.2\times10^{0}$ | $1.1\times10^{0}$ | $\approx 0$ | $3.5\times10^{-2}$ |
| 3 | $54.278$ | $53.940$ | $3.4\times10^{-1}$ | $6.8\times10^{-2}$ | $\approx 0$ | $3.7\times10^{-4}$ |
| 4 | $54.0028$ | $53.9994$ | $3.4\times10^{-3}$ | $6.8\times10^{-4}$ | $\approx 0$ | $3.7\times10^{-6}$ |
| 5 | $54.00003$ | $53.99999$ | $3.4\times10^{-5}$ | $6.8\times10^{-6}$ | $\approx 0$ | $3.7\times10^{-8}$ |
| 6 | $54.000000$ | $54.000000$ | $3.4\times10^{-7}$ | $6.8\times10^{-8}$ | $\approx 0$ | $3.7\times10^{-10}$ |
| 7 | $54.000000$ | $54.000000$ | $3.4\times10^{-9}$ | $6.8\times10^{-10}$ | $\approx 0$ | $3.7\times10^{-12}$ |

("$\approx 0$" means below $10^{-12}$: at iteration 2 the primal step reached full length, and a full Newton step solves $\mathbf{A}\mathbf{x} = \mathbf{b}$ exactly.)

**Read it like an engineer.** The primal cost overshoots to $59.75$ at iteration 1 because the plan is not yet feasible; the "objective" column means nothing until the residuals are small. From iteration 3 the gap falls by a factor of $100$ per iteration, the superlinear signature of the predictor-corrector. Seven iterations take the bracket from $22$ down to $3.4\times10^{-9}$.

**The answer.**

$$
\mathbf{x} = (20, 30, 0, 10, 0), \qquad \mathbf{y} = (1.2,\ 0,\ -0.2), \qquad \mathbf{z} = (0,\ 0,\ 1.2,\ 0,\ 0.2) .
$$

That is the corner $(T_1, T_2) = (20, 30)$ of lesson 5 and, up to the sign convention on the ceiling rows, the dual point $(\lambda, \mu_1, \mu_2) = (1.2, 0, 0.2)$ of lesson 7. Sanity check: $\mathbf{c}^\top\mathbf{x} = 24 + 30 = 54$ and $\mathbf{b}^\top\mathbf{y} = 60 + 0 - 6 = 54$.

Complementarity shows: wherever $x_j > 0$, $z_j = 0$, and wherever $z_j > 0$, $x_j = 0$. The surplus $s_1 = 0$ (the thrust requirement is tight) with price $z_3 = 1.2$. The slack $s_2 = 10$ (engine 1 is $10\,\mathrm{kN}$ below its ceiling) with $z_4 = 0$. The slack $s_3 = 0$ with $z_5 = 0.2$: the shadow price of engine 2's ceiling.
:::

## Cones, and detecting infeasibility

Only the barrier $-\sum\log s_i$ and the diagonal matrices $\mathbf{X}$, $\mathbf{Z}$ used scalar inequalities. For a general symmetric cone the same algorithm runs with that cone's barrier: $-\log(t^2 - \|\mathbf{u}\|_2^2)$ for the second-order cone, $-\log\det\mathbf{X}$ for the semidefinite one. The products $x_j z_j$ become the cone's **Jordan product**, its own way of multiplying two cone members. Complementarity becomes $\mathbf{s}\circ\mathbf{z} = \sigma\mu\mathbf{e}$, where $\mathbf{e}$ is the cone's identity element.

To keep the primal and dual steps in balance, solvers use the **[[Nesterov–Todd scaling|nesterov-todd]]**: a linear map $\mathbf{W}$ chosen so that it carries the current primal point and the current dual point to the same point of the cone. ECOS, Clarabel and every other conic interior-point solver is this algorithm with this scaling, which exists because the cones are self-dual (lessons 7 and 8).

Infeasibility is handled by reformulating. The **[[homogeneous self-dual embedding|hsde]]** builds one bigger problem whose unknowns are the primal, the dual, and two extra numbers, $\tau$ ("tau") and $\kappa$ ("kappa"). Think of them as two warning lights: $\tau$ for "solvable" and $\kappa$ for "infeasible". The bigger problem is always strictly feasible, so the algorithm always starts and always converges.

At the end, if $\tau > 0$, the solution is recovered as $\mathbf{x}/\tau$. If instead $\kappa > 0$, the iterates have converged to the improving ray of lesson 7, and the solver reports primal or dual infeasibility *with the certificate in hand*. So a conic solver's "infeasible" is a proof, not a timeout.

::: example Iteration counts for the landing SOCP
Lesson 6 sized the chopped-up landing problem at $N = 100$ steps: $401$ second-order cones, none bigger than dimension $4$, plus $100$ linear inequalities, and $713$ equality rows.

**Add up the barrier parameter.** It adds over a product of cones. Each second-order cone contributes $2$ regardless of its size, and each scalar inequality contributes $1$:

$$
\nu = 2 \times 401 + 1 \times 100 = 902, \qquad \sqrt{\nu} = 30.0 .
$$

**Apply the bound.** It is $\sqrt{\nu}\log(1/\epsilon)$ up to a constant. For $\epsilon = 10^{-6}$, $\ln 10^6 = 13.82$, so about $30.03 \times 13.82 \approx 415$ iterations. For $\epsilon = 10^{-8}$, $\ln 10^8 = 18.4$, so about $553$. Those are the numbers you could certify from theory alone.

**Compare with practice.** Observed counts are a few tens: the two-engine LP took seven, and a well-scaled trajectory SOCP this size typically takes $15$ to $30$. The distance from $553$ to $30$ is the price of a worst-case analysis that must cover the nastiest data. That is why flight practice sets the iteration cap from **[[Monte Carlo|monte-carlo]]** testing over the state envelope rather than from the bound — while keeping the bound as the reason a cap exists at all.

**Notice what is missing.** The number of variables, $1107$, is not in $\nu$. The bound grows like the square root of the number of cones, not the number of unknowns. Doubling the horizon to $N = 200$ gives $\nu = 1802$ and $\sqrt{\nu} = 42.4$: a $41\,\%$ rise in the iteration bound, for twice the work per iteration. Sanity check: $42.4/30.0 = 1.41 \approx \sqrt{2}$, as it should be when $\nu$ roughly doubles.
:::

::: warning An interior-point method never reaches a vertex, and warm starting barely helps
First, the iterate stays strictly inside, so the answer is *near* a vertex, never at one. On a problem with a flat optimal face — exactly the fixed-time landing LP of lesson 5, whose cost is the same over the whole feasible set — the method converges to the **[[analytic center|analytic-center]]** of that face, a point in the middle, not a bang-bang corner. If you need a vertex solution, you need a crossover step or an active-set method.

Second, an interior-point method is hard to **warm start** — to start from last time's answer. That answer sits on the cone's boundary, where the barrier is infinite. Nudged inside, it is usually far off the central path, and recovering costs as many iterations as a cold start. Active-set and operator-splitting methods (lesson 12's OSQP) warm start beautifully; interior-point methods essentially do not. For a controller re-solving a slightly changed problem every cycle, that argues for the other families. The flip side — the iteration count hardly cares where it starts — is what makes the runtime predictable. You cannot have both.
:::

## Check yourself

::: check
On the central path with $m = 400$ inequality constraints, how large must $t$ be to guarantee the cost is within $10^{-5}$ of optimal? If the barrier method starts at $t_0 = 1$ and multiplies $t$ by $\mu = 20$ each outer iteration, how many outer iterations is that?
:::

::: answer
The certificate is $f_0(\mathbf{x}^\star(t)) - p^\star \le m/t$, so you need $t \ge m/\epsilon = 400/10^{-5} = 4\times10^{7}$.

The number of outer iterations is $\lceil\log(m/(t_0\epsilon))/\log\mu\rceil = \lceil\ln(4\times10^7)/\ln 20\rceil = \lceil 17.50/3.00\rceil = \lceil 5.84\rceil = 6$. Six outer iterations, each a few Newton steps — say $3$ to $5$ — so about $20$ to $30$ linear solves in all.

Notice how weakly the count depends on accuracy. Asking for $10^{-8}$ instead multiplies the needed $t$ by $1000$, which adds only $\ln 1000/\ln 20 = 2.3$ to the count before rounding: three more outer iterations.
:::

::: check
Why does the barrier parameter of a second-order cone not grow with its dimension, while the parameter of a semidefinite block does? What does that mean for a problem with one $\|\mathbf{u}\|_2 \le t$ constraint on a $1000$-dimensional vector?
:::

::: answer
The barrier parameter $\nu$ counts, roughly, the independent walls the barrier must keep the iterate away from.

A second-order cone has a single boundary surface, $\|\mathbf{u}\|_2 = t$, no matter how many entries $\mathbf{u}$ has. Its barrier $-\log(t^2 - \|\mathbf{u}\|^2)$ is one logarithm, and $\nu = 2$. A semidefinite block of size $n$ has $n$ eigenvalues that must each stay nonnegative, and $-\log\det\mathbf{X} = -\sum_i\log\lambda_i(\mathbf{X})$ is $n$ logarithms, so $\nu = n$. In the same way, $m$ scalar inequalities give $m$ logarithms and $\nu = m$.

The $1000$-dimensional norm bound as one second-order cone adds $2$ to $\nu$. As $1000$ separate bounds on the entries it would add $1000$ — and would not even be the same constraint. Choosing the right cone is worth a factor of $\sqrt{1000/2} = \sqrt{500} \approx 22$ in the iteration bound.
:::

::: check
A solver log shows the objective jumping around wildly for the first three iterations before settling. Is the solver broken?
:::

::: answer
Almost certainly not. With an infeasible start, a primal-dual method drives toward feasibility and optimality at once, so the cost at an infeasible point is not payable and has no reason to fall steadily.

In the two-engine run above, the cost went $22 \to 59.75 \to 58.89 \to 54.28$. It overshot $54$ by more than the start was below it, while the primal residual fell from $42$ to rounding noise and the dual residual from $1.7$ to $0.00037$. Watch the residuals and the gap; the cost means something only once the residuals are small.

A broken solve looks different: residuals stalling, step lengths collapsing toward zero, or $\mu$ refusing to fall.
:::

::: check
Explain, in terms of the central path, why an interior-point method returns the middle of the optimal face when the optimum is not unique.
:::

::: answer
Along the central path the iterate minimizes $t f_0(\mathbf{x}) + \phi(\mathbf{x})$. Suppose the optimal set is a face on which $f_0$ is constant. Then for large $t$ the first term is the same everywhere on that face, and the choice is made entirely by the barrier $\phi$. The barrier is smallest at the point farthest from the walls in its own sense — the analytic center of the face. So the central path ends at that center, not at a vertex.

For the constant-mass fixed-time landing LP of lesson 5, where every feasible thrust history costs the same, the solver returns a smooth middle-of-the-road history, not the coast-then-burn corner. The fix is a formulation with a unique optimum: let the final time vary, include the mass loss that makes late burns cheaper, or add a small regularizing term.
:::

::: check
The landing SOCP takes $20$ iterations on a nominal case. A colleague proposes setting the flight solver's iteration cap to $20$ to save time. What is wrong with that, and what would you do instead?
:::

::: answer
The nominal case is one point in a large state envelope. The count is insensitive but not constant: spreads in initial state, mass, winds and target shift it. The cases that matter for the cap are the hard ones — geometries close to infeasible, where the strictly feasible region is thin and the central path is long. A cap at the nominal count guarantees the worst cases hit it.

Instead, run a large Monte Carlo over the certified envelope, record the iteration count at the required tolerance for every case, take the maximum, and add margin — a factor of about two is common.

Then design for the cap being hit anyway. The solver must return its best iterate with its current duality gap, so a monitor can judge whether it is good enough to fly, and the guidance mode logic needs a defined fallback. The theoretical bound of $553$ iterations is not the cap; it is the reason a finite cap exists at all.
:::

## Summary

| Object | Statement |
| --- | --- |
| Logarithmic barrier | $\phi(\mathbf{x}) = -\sum_i\log(-g_i(\mathbf{x}))$; convex, blows up at the boundary |
| Centering problem | minimize $t f_0(\mathbf{x}) + \phi(\mathbf{x})$ s.t. $\mathbf{F}\mathbf{x} = \mathbf{g}$; its solution $\mathbf{x}^\star(t)$ traces the central path |
| Central-path certificate | $\lambda_i(t) = -1/(t\,g_i(\mathbf{x}^\star(t)))$ is dual feasible, and $f_0(\mathbf{x}^\star(t)) - p^\star \le m/t$ |
| Box example | $x^\star(t) = ((t+2) - \sqrt{t^2+4})/(2t)$; at $t = 10$, $x = 0.0901$ with bracket $[-0.1099, 0.0901]$ |
| Outer iterations | $\lceil\log(m/(t_0\epsilon))/\log\mu\rceil$; $9$ for $m = 2$, $t_0 = 1$, $\mu = 10$, $\epsilon = 10^{-8}$ |
| Perturbed KKT | $x_j z_j = \sigma\mu$ with $\mu = \mathbf{x}^\top\mathbf{z}/n$; one Newton step per iteration |
| Normal equations | $\mathbf{A}\mathbf{D}\mathbf{A}^\top\Delta\mathbf{y} = \cdot$ with $\mathbf{D} = \mathbf{Z}^{-1}\mathbf{X}$; one factorization per iteration |
| Refinements | Fraction to boundary $\eta \approx 0.99$; Mehrotra $\sigma = (\mu_{\text{aff}}/\mu)^3$; infeasible start |
| Two-engine run | Seven iterations from a bad start; gap $22 \to 3.4\times10^{-9}$ |
| Cones | Cone barrier plus Nesterov–Todd scaling; $\nu = m$, $2$, $n$ for orthant, second-order cone, $n \times n$ PSD |
| Infeasibility | Self-dual embedding: $\tau > 0$ solution, $\kappa > 0$ certificate |
| Landing SOCP | $\nu = 902$, $\sqrt{\nu} = 30.0$; bound $\approx 415$ iterations at $\epsilon = 10^{-6}$, observed $15$ to $30$ |
| Limitations | Ends at the analytic center of a flat optimal face; warm starts help little |

The next lesson leaves the convex world. When a problem is not a cone program — a fixed-magnitude thrust, an aerodynamic model, a free final time — the tool is sequential quadratic programming, which gives up every guarantee of this lesson in exchange for generality.

::: context karmarkar The algorithm that made the front page
In 1984 Narendra Karmarkar, a young researcher at Bell Labs, published a method for linear programs that moved through the inside of the feasible region instead of hopping from corner to corner like the simplex method. It came with a proof that its running time grows only polynomially with problem size, and the story made the front page of *The New York Times*. Mathematicians then realized it was a close cousin of the log-barrier idea from the 1960s. In 1994 Yurii Nesterov and Arkadi Nemirovski extended the whole theory to cones, which is why SOCP and SDP solvers exist today.
:::

::: context barrier-picture The cliff and the ramps
The gray cliff is the true indicator: zero cost inside, infinite cost past the wall at $u = 0$. The blue curves are the log barrier $-\frac{1}{t}\log(-u)$ for $t = 1$ and $t = 4$. Bigger $t$ hugs the cliff more closely: flatter inside, steeper at the wall.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="110" x2="335" y2="110" stroke="#6c7a93" stroke-width="1"/>
  <line x1="40" y1="110" x2="320" y2="110" stroke="#6c7a93" stroke-width="5" stroke-opacity="0.5"/>
  <line x1="320" y1="110" x2="320" y2="14" stroke="#6c7a93" stroke-width="5" stroke-opacity="0.5"/>
  <polyline points="40.0,143.0 63.3,140.3 86.7,137.5 110.0,134.3 133.3,130.8 156.7,126.8 180.0,122.2 203.3,116.7 226.7,110.0 250.0,101.4 273.3,89.2 278.0,86.0 284.5,81.0 290.1,75.9 294.7,70.8 298.7,65.7 302.0,60.6 304.8,55.6 307.2,50.5 309.2,45.4 310.9,40.3 312.3,35.2 313.5,30.2 314.5,25.1 315.4,20.0" fill="none" stroke="#8fb8f0" stroke-width="2.5"/>
  <polyline points="40.0,118.2 63.3,117.6 86.7,116.9 110.0,116.1 133.3,115.2 156.7,114.2 180.0,113.0 203.3,111.7 226.7,110.0 250.0,107.8 273.3,104.8 278.0,104.0 301.6,97.8 311.9,91.6 316.5,85.5 318.4,79.3 319.3,73.1 319.7,66.9 319.9,60.7 319.9,54.6 320.0,48.4 320.0,42.2 320.0,36.0 320.0,29.8 320.0,23.7" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="200" y="138" font-size="12" fill="#8fb8f0">t = 1</text>
  <text x="120" y="104" font-size="12" fill="#1d6fd1">t = 4</text>
  <text x="327" y="40" font-size="12" fill="#6c7a93">wall</text>
  <text x="320" y="126" font-size="11" text-anchor="middle" fill="#1f2a44">u = 0</text>
  <text x="227" y="126" font-size="11" text-anchor="middle" fill="#1f2a44">−1</text>
  <text x="40" y="126" font-size="11" text-anchor="middle" fill="#1f2a44">−3</text>
  <text x="34" y="114" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
</svg>
```

Both curves cross zero at $u = -1$, where $\log 1 = 0$. The barrier can go slightly negative deep inside; that is harmless, because only its shape matters.
:::

::: context central-path-line The path on a number line
For the one-variable example below, minimize $x$ on $0 \le x \le 1$, the central path is a set of points on a line segment. At tiny $t$ the barrier alone decides, and it balances the two walls at the midpoint, $0.5$. As $t$ grows the cost pulls the point toward the optimum at $0$, but it never arrives.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="80" x2="320" y2="80" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="68" x2="40" y2="92" stroke="#1f2a44" stroke-width="3"/>
  <line x1="320" y1="68" x2="320" y2="92" stroke="#1f2a44" stroke-width="3"/>
  <line x1="122" y1="47" x2="122" y2="76" stroke="#6c7a93" stroke-width="1"/>
  <line x1="42.8" y1="47" x2="42.8" y2="76" stroke="#6c7a93" stroke-width="1"/>
  <circle cx="180" cy="80" r="4" fill="#8fb8f0"/>
  <circle cx="147" cy="80" r="4" fill="#1d6fd1"/>
  <circle cx="122" cy="80" r="4" fill="#1d6fd1"/>
  <circle cx="65.2" cy="80" r="4" fill="#1d6fd1"/>
  <circle cx="42.8" cy="80" r="4" fill="#1d6fd1"/>
  <g font-size="11" fill="#1d6fd1" text-anchor="middle">
    <text x="182" y="64">t → 0</text>
    <text x="147" y="64">t = 1</text>
    <text x="122" y="42">t = 2</text>
    <text x="72" y="64">t = 10</text>
    <text x="43" y="42">t = 100</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="106">0</text>
    <text x="180" y="106">0.5</text>
    <text x="320" y="106">1</text>
  </g>
  <text x="40" y="122" font-size="11" fill="#b4232c" text-anchor="middle">optimum</text>
</svg>
```

Once $t$ is large, each tenfold rise in $t$ moves the point about ten times closer to $0$.
:::

::: context self-concordant What "self-concordant" means
"Concordant" means "in agreement". A self-concordant function is one whose curvature cannot change too fast compared with the curvature itself: in one variable, $|f'''| \le 2 (f'')^{3/2}$. The log is the classic example — for $f(u) = -\log u$, $f'' = 1/u^2$ and $|f'''| = 2/u^3$, which meets the rule with equality.

Why care? Newton's method builds a quadratic model from the second derivative. If the curvature is known not to swerve wildly within one step, the model can be trusted by a known amount, and the step count can be bounded without knowing anything else about the problem.
:::

::: context normal-equations Why "normal"
The name comes from least squares. There, the best fit leaves an error that is *normal* — at right angles — to every column of the data matrix, and writing that down gives $\mathbf{A}^\top\mathbf{A}\,\mathbf{x} = \mathbf{A}^\top\mathbf{b}$. The interior-point system $\mathbf{A}\mathbf{D}\mathbf{A}^\top\Delta\mathbf{y} = \cdot$ has the same shape, with the diagonal $\mathbf{D}$ as a weighting. As the iterates approach the answer, some entries of $\mathbf{D}$ head to zero and others to infinity, so this matrix gets badly conditioned. Good solvers handle that with careful factorizations, not luck.
:::

::: context mehrotra A 1992 trick that every solver uses
Sanjay Mehrotra published the predictor-corrector in 1992. The idea is like a golfer's practice swing: take a look at the pure Newton step first (the predictor), see how much it would shrink $\mu$, then pick how much centering to ask for and add a correction for the curvature the first look missed. Because both solves reuse the same factorization, the second costs little. It roughly halves the iteration count, and nearly every production interior-point code since has used some form of it.
:::

::: context nesterov-todd Meeting in the middle
A primal-dual method moves two points at once: the plan $\mathbf{s}$ and the prices $\mathbf{z}$. For a flat orthant the scaling that treats them evenly is a simple diagonal. For a round cone it is not obvious. In 1997 Yurii Nesterov and Michael Todd showed that for self-dual cones there is always a unique linear map that sends $\mathbf{s}$ and $\mathbf{z}$ to the same point, so the Newton step treats plan and prices exactly alike. That balance is what keeps the step count low and steady.
:::

::: context hsde Two warning lights
The homogeneous self-dual embedding was worked out by Yinyu Ye, Michael Todd and Shinji Mizuno in 1994. Its trick is to stop asking "is there a solution?" before starting. The bigger problem always has an interior, so the method always runs. At the end exactly one light is on: $\tau > 0$ means "here is the answer, divide by $\tau$", and $\kappa > 0$ means "here is the proof there is none". Solvers such as ECOS, SCS and Clarabel all use versions of this idea.
:::

::: context monte-carlo Testing by rolling dice
A **Monte Carlo** test, named after the casino in Monaco, runs a simulation thousands of times with the uncertain inputs drawn at random: initial position and velocity, mass, winds, engine performance. Each run records the result — here, how many solver iterations it took. The spread of results shows the worst cases that matter. Guidance teams run such campaigns before every flight software release.
:::

::: context analytic-center Down the middle, never to a corner
Minimize $x_2$ over the rectangle $0 \le x_1 \le 2$, $0 \le x_2 \le 1$. Every point of the bottom edge is optimal. The barrier for $x_1$ is balanced at $x_1 = 1$ for every $t$, so the central path runs straight down the middle, through the same heights $0.382$, $0.293$, $0.090$ as the one-variable example at $t = 1, 2, 10$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <rect x="60" y="30" width="240" height="120" fill="#8fb8f0" fill-opacity="0.35" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="60" y1="150" x2="300" y2="150" stroke="#b4232c" stroke-width="4"/>
  <line x1="180" y1="90" x2="180" y2="150" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="4,3"/>
  <circle cx="180" cy="90" r="3.5" fill="#1d6fd1"/>
  <circle cx="180" cy="104.2" r="3.5" fill="#1d6fd1"/>
  <circle cx="180" cy="114.9" r="3.5" fill="#1d6fd1"/>
  <circle cx="180" cy="139.2" r="3.5" fill="#1d6fd1"/>
  <circle cx="180" cy="150" r="4.5" fill="#b4232c"/>
  <circle cx="60" cy="150" r="4" fill="#1f2a44"/>
  <circle cx="300" cy="150" r="4" fill="#1f2a44"/>
  <text x="188" y="87" font-size="11" fill="#1d6fd1">t → 0: (1, 0.5)</text>
  <text x="188" y="108" font-size="11" fill="#1d6fd1">t = 1</text>
  <text x="188" y="120" font-size="11" fill="#1d6fd1">t = 2</text>
  <text x="188" y="140" font-size="11" fill="#1d6fd1">t = 10</text>
  <text x="180" y="168" font-size="11" text-anchor="middle" fill="#b4232c">center (1, 0)</text>
  <text x="60" y="168" font-size="11" text-anchor="middle" fill="#1f2a44">(0, 0)</text>
  <text x="300" y="168" font-size="11" text-anchor="middle" fill="#1f2a44">(2, 0)</text>
  <text x="305" y="95" font-size="11" fill="#1f2a44">cost x₂</text>
</svg>
```

A corner-hopping method would return $(0, 0)$ or $(2, 0)$. The interior-point method returns the middle, $(1, 0)$.
:::
