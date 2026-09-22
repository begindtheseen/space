---
id: l09-interior-point-methods
title: Interior-point methods
minutes: 30
covers:
  - interior-point methods
---

Lesson 4 promised that a convex problem can be solved in a number of steps you can bound before flight. This lesson is the algorithm that delivers on it. Interior-point methods are the reason the promise is not empty: they turn a constrained problem into a short sequence of Newton solves, they converge to the global optimum in a few tens of iterations on problems of the size a lander solves, and the count barely moves when the data changes. That last property – near-independence from the vehicle's actual state – is what makes a worst-case timing argument possible at all.

The idea is simple enough to state in one sentence. Inequality constraints are awkward because they are either active or not, and the combinatorics of guessing which is what makes active-set methods unpredictable; so replace each hard inequality by a smooth penalty that is nearly zero well inside the feasible set and blows up at its boundary, solve the resulting smooth problem with Newton's method, and sharpen the penalty until the answer is as accurate as you need. The iterates never touch the boundary – hence *interior* point – and the combinatorial question never gets asked.

Everything in this lesson applies unchanged to LP, QP, SOCP and SDP, because all four are conic problems and the construction depends only on having a barrier for the cone. The worked examples are LPs because they are small enough to print, and the final section carries the counts across to the landing SOCP of lesson 6.

## The barrier

Take the convex problem in the form of lesson 1, with the equalities kept explicit:

$$
\text{minimise } f_0(\mathbf{x}) \quad \text{subject to} \quad g_i(\mathbf{x}) \le 0,\ i = 1,\dots,m, \qquad \mathbf{F}\mathbf{x} = \mathbf{g} .
$$

An inequality constraint is, formally, an infinite penalty: add to the objective the indicator $I(u)$ that is $0$ for $u \le 0$ and $+\infty$ for $u > 0$, and the constraint disappears into the cost. The indicator is useless to a derivative-based method, so approximate it by something smooth that has the same shape:

$$
I(u) \approx -\frac{1}{t}\log(-u), \qquad t > 0 .
$$

For $u$ well below zero this is a small number; as $u$ climbs to zero it goes to $+\infty$; and as $t$ grows the approximation tightens everywhere. Summing over the constraints gives the **logarithmic barrier**

$$
\phi(\mathbf{x}) = -\sum_{i=1}^m \log\big(-g_i(\mathbf{x})\big),
$$

defined on the strict interior $\{g_i(\mathbf{x}) < 0\}$, convex whenever the $g_i$ are (the composition rules of lesson 3: $-\log$ is convex and decreasing, $g_i$ is convex). The **centering problem** is

$$
\text{minimise } t\,f_0(\mathbf{x}) + \phi(\mathbf{x}) \quad \text{subject to } \mathbf{F}\mathbf{x} = \mathbf{g},
$$

an equality-constrained smooth convex problem that Newton's method handles with the KKT linear solve of lesson 5. Its solution is written $\mathbf{x}^\star(t)$, and the curve traced by $\mathbf{x}^\star(t)$ as $t$ runs from $0$ to $\infty$ is the **central path**. At small $t$ the barrier dominates and $\mathbf{x}^\star(t)$ sits deep inside the feasible set, as far from every constraint as the barrier's notion of distance allows. At large $t$ the objective dominates and $\mathbf{x}^\star(t)$ approaches the optimum.

### The gap on the central path is exactly $m/t$

This is the fact that makes the method self-certifying, and it costs three lines. Stationarity of the centering problem says

$$
t\,\nabla f_0(\mathbf{x}^\star(t)) + \sum_{i=1}^m \frac{-1}{g_i(\mathbf{x}^\star(t))}\nabla g_i(\mathbf{x}^\star(t)) + \mathbf{F}^\top\hat{\boldsymbol{\nu}} = \mathbf{0} .
$$

Divide by $t$ and define

$$
\lambda_i(t) = \frac{-1}{t\,g_i(\mathbf{x}^\star(t))} > 0, \qquad \boldsymbol{\nu}(t) = \hat{\boldsymbol{\nu}}/t .
$$

What remains is exactly the stationarity condition of the Lagrangian at $(\boldsymbol{\lambda}(t), \boldsymbol{\nu}(t))$, and those multipliers are strictly positive: they are **dual feasible**. So by lesson 7 the dual function evaluates to

$$
g(\boldsymbol{\lambda}(t), \boldsymbol{\nu}(t)) = f_0(\mathbf{x}^\star(t)) + \sum_i \lambda_i(t) g_i(\mathbf{x}^\star(t)) + \boldsymbol{\nu}(t)^\top(\mathbf{F}\mathbf{x}^\star - \mathbf{g}) = f_0(\mathbf{x}^\star(t)) - \frac{m}{t},
$$

since each term $\lambda_i g_i = -1/t$ and the equality term vanishes. Therefore

$$
f_0(\mathbf{x}^\star(t)) - p^\star \le \frac{m}{t} .
$$

Every point of the central path carries its own certificate, and the certificate improves in exact proportion to $t$. Want six digits on a problem with $m = 600$ inequalities? Take $t = 6\times10^8$ and stop.

::: example The central path of a one-variable problem
Minimise $x$ subject to $0 \le x \le 1$; obviously $p^\star = 0$ at $x = 0$, and $m = 2$. The barrier problem is $\text{minimise } tx - \log x - \log(1-x)$, and setting the derivative to zero,

$$
t - \frac{1}{x} + \frac{1}{1-x} = 0 \quad\Longrightarrow\quad t x^2 - (t+2)x + 1 = 0 \quad\Longrightarrow\quad x^\star(t) = \frac{(t+2) - \sqrt{t^2+4}}{2t},
$$

taking the root inside $(0,1)$. Then:

| $t$ | $x^\star(t)$ | $f_0 - p^\star$ | bound $m/t$ |
| --- | --- | --- | --- |
| $1$ | $0.38197$ | $0.38197$ | $2$ |
| $2$ | $0.29289$ | $0.29289$ | $1$ |
| $10$ | $0.09010$ | $0.09010$ | $0.2$ |
| $100$ | $0.00990$ | $0.00990$ | $0.02$ |
| $1000$ | $0.000999$ | $0.000999$ | $0.002$ |

The iterate approaches the optimum like $1/t$, never reaching the boundary, and the certificate $m/t$ is valid and about a factor of two loose. Read off the dual point at $t = 10$: $\lambda_1 = -1/(t g_1) = 1/(tx) = 1.1099$ and $\lambda_2 = 1/(t(1-x)) = 0.10990$. Dual feasibility for this problem requires $1 - \lambda_1 + \lambda_2 = 0$, and indeed $1 - 1.1099 + 0.1099 = 0$ to machine precision. The dual value is $-\lambda_2 = -0.10990$, which equals $f_0 - m/t = 0.09010 - 0.2$. The bracket is $[-0.1099,\ 0.0901]$, width $0.2 = m/t$, and it contains $p^\star = 0$. At $t = 100$ the bracket is $[-0.01010,\ 0.00990]$.
:::

## The barrier method and its iteration count

The obvious algorithm follows: pick $t_0$ and a strictly feasible start, solve the centering problem by Newton's method, multiply $t$ by a factor $\mu$ (typically $10$ to $100$), re-centre starting from the previous solution, and stop when $m/t \le \epsilon$. The number of **outer** iterations is

$$
\left\lceil \frac{\log\big(m/(t_0\epsilon)\big)}{\log\mu} \right\rceil,
$$

which for $m = 2$, $t_0 = 1$, $\mu = 10$ and $\epsilon = 10^{-8}$ is $9$. Each outer iteration costs a handful of Newton steps, because the previous centre is an excellent starting point for the next one – the central path is smooth and $\mu$ is not large. That is the whole method: tens of Newton steps, each a linear solve with the KKT matrix of lesson 5.

The logarithmic barrier is not an arbitrary choice. It belongs to the class of **self-concordant** functions, whose third derivative is controlled by their second, and for such functions Newton's method has a convergence analysis that is *affine invariant*: the number of Newton steps to centre depends only on how far the starting point is from the centre in the barrier's own metric, not on the condition number, not on the scaling of the variables, not on the problem data. That is the technical reason the iteration count is near-constant across problem instances, and it is the property lesson 4's bound rests on. Carrying the analysis through gives the classical result: a short-step barrier method reaches accuracy $\epsilon$ in $O(\sqrt{\nu}\,\log(1/\epsilon))$ Newton steps, where $\nu$ is the barrier parameter of the cone – $m$ for $m$ scalar inequalities, $2$ per second-order cone whatever its size, $n$ for an $n \times n$ semidefinite block.

::: key Why interior-point methods are what fly
On a convex problem an interior-point method converges to the global optimum in a bounded, essentially data-independent number of iterations (tens), detects infeasibility, and has no local minima to get trapped in – so you can certify the worst-case runtime for a real-time deadline. The theoretical bound is $O(\sqrt{\nu}\log(1/\epsilon))$ Newton steps; the observed count is far smaller and hardly varies with the data.
:::

## Primal-dual methods: what solvers actually do

The barrier method is the clean story. Production solvers use a variant that is faster and more robust, and the difference is worth understanding because it explains the numbers that appear in a solver log.

Instead of eliminating the multipliers, keep them as variables and perturb the KKT conditions of lesson 2. Write the LP in standard form, $\text{minimise } \mathbf{c}^\top\mathbf{x}$ subject to $\mathbf{A}\mathbf{x} = \mathbf{b}$, $\mathbf{x} \ge \mathbf{0}$, whose dual is $\text{maximise } \mathbf{b}^\top\mathbf{y}$ subject to $\mathbf{A}^\top\mathbf{y} + \mathbf{z} = \mathbf{c}$, $\mathbf{z} \ge \mathbf{0}$. The KKT conditions are primal feasibility, dual feasibility, and complementarity $x_j z_j = 0$. Replace the last by

$$
x_j z_j = \sigma\mu \quad \text{for all } j, \qquad \mu = \frac{\mathbf{x}^\top\mathbf{z}}{n},
$$

with $\sigma \in [0,1]$ a centering parameter, and apply one Newton step to the resulting square system in $(\mathbf{x}, \mathbf{y}, \mathbf{z})$. Writing $\mathbf{X} = \operatorname{diag}(\mathbf{x})$ and $\mathbf{Z} = \operatorname{diag}(\mathbf{z})$, the Newton system is

$$
\begin{bmatrix} \mathbf{0} & \mathbf{A}^\top & \mathbf{I} \\ \mathbf{A} & \mathbf{0} & \mathbf{0} \\ \mathbf{Z} & \mathbf{0} & \mathbf{X}\end{bmatrix}
\begin{bmatrix} \Delta\mathbf{x} \\ \Delta\mathbf{y} \\ \Delta\mathbf{z}\end{bmatrix}
=
\begin{bmatrix} \mathbf{r}_d \\ \mathbf{r}_p \\ \mathbf{r}_c \end{bmatrix},
$$

with $\mathbf{r}_p = \mathbf{b} - \mathbf{A}\mathbf{x}$, $\mathbf{r}_d = \mathbf{c} - \mathbf{A}^\top\mathbf{y} - \mathbf{z}$ and $\mathbf{r}_c = -\mathbf{X}\mathbf{Z}\mathbf{e} + \sigma\mu\mathbf{e}$. Eliminating $\Delta\mathbf{z}$ and $\Delta\mathbf{x}$ reduces it to the **normal equations** $\mathbf{A}\mathbf{D}\mathbf{A}^\top\Delta\mathbf{y} = \text{(known)}$ with the diagonal $\mathbf{D} = \mathbf{Z}^{-1}\mathbf{X}$, a positive definite system of the size of the equality constraints. One factorisation per iteration; everything else is cheap.

Three refinements make it work in practice.

1. **Fraction to the boundary.** After computing the step, take $\alpha$ to be at most $\eta$ times the distance to the boundary, with $\eta = 0.99$ or $0.995$, so the iterate stays strictly interior. Primal and dual step lengths may differ.
2. **Mehrotra's predictor-corrector.** First solve with $\sigma = 0$ (the pure Newton, or *affine scaling*, direction) to see how much progress complementarity would allow; the ratio of the resulting $\mu_{\text{aff}}$ to the current $\mu$ sets $\sigma = (\mu_{\text{aff}}/\mu)^3$ adaptively. Then solve again, reusing the same factorisation, with a correction term that compensates the second-order error $\Delta\mathbf{X}_{\text{aff}}\Delta\mathbf{Z}_{\text{aff}}\mathbf{e}$. Two back-substitutions, one factorisation, and typically half the iterations of a fixed-$\sigma$ method.
3. **Infeasible start.** The residuals $\mathbf{r}_p$ and $\mathbf{r}_d$ appear in the right-hand side, so the method does not need a feasible starting point – only a strictly positive one. Feasibility and optimality are approached together.

::: example A primal-dual solve of the two-engine LP, iteration by iteration
Put the problem of lessons 5 and 7 into standard form: variables $\mathbf{x} = (T_1, T_2, s_1, s_2, s_3) \ge \mathbf{0}$ with a surplus on the requirement and slacks on the two ceilings,

$$
\mathbf{A} = \begin{bmatrix} 1 & 1 & -1 & 0 & 0 \\ 1 & 0 & 0 & 1 & 0 \\ 0 & 1 & 0 & 0 & 1\end{bmatrix}, \quad \mathbf{b} = \begin{bmatrix} 50 \\ 30 \\ 30\end{bmatrix}, \quad \mathbf{c} = (1.2, 1, 0, 0, 0),
$$

and start, deliberately badly, from $\mathbf{x} = 10\cdot\mathbf{e}$ (infeasible: the first residual is $42.4$ in norm), $\mathbf{y} = \mathbf{0}$, $\mathbf{z} = \mathbf{e}$. Mehrotra's method with $\eta = 0.99$ gives:

| it | primal $\mathbf{c}^\top\mathbf{x}$ | dual $\mathbf{b}^\top\mathbf{y}$ | gap | $\mu$ | $\|\mathbf{r}_p\|$ |
| --- | --- | --- | --- | --- | --- |
| 0 | $22.000$ | $0.000$ | $2.2\times10^{1}$ | $1.0\times10^{1}$ | $4.2\times10^{1}$ |
| 1 | $59.751$ | $44.424$ | $1.5\times10^{1}$ | $4.8\times10^{0}$ | $5.6\times10^{0}$ |
| 2 | $58.898$ | $53.644$ | $5.3\times10^{0}$ | $1.1\times10^{0}$ | $5.6\times10^{-2}$ |
| 3 | $54.281$ | $53.938$ | $3.4\times10^{-1}$ | $7.0\times10^{-2}$ | $3.8\times10^{-3}$ |
| 4 | $54.0028$ | $53.9994$ | $3.5\times10^{-3}$ | $7.0\times10^{-4}$ | $3.9\times10^{-5}$ |
| 5 | $54.00003$ | $53.99999$ | $3.5\times10^{-5}$ | $7.0\times10^{-6}$ | $3.9\times10^{-7}$ |
| 6 | $54.000000$ | $54.000000$ | $3.5\times10^{-7}$ | $7.0\times10^{-8}$ | $3.9\times10^{-9}$ |
| 7 | $54.000000$ | $54.000000$ | $3.5\times10^{-9}$ | $7.0\times10^{-10}$ | $3.9\times10^{-11}$ |

Read it as an engineer would. The primal iterate overshoots on the way in ($59.75$ at iteration 1) because it is not yet feasible; a solver's "objective" column is meaningless until the residual column is small. From iteration 3 the gap falls by a factor of $100$ per iteration – superlinear, the signature of the predictor-corrector – and seven iterations take the bracket from $22$ down to $3.5\times10^{-9}$. The converged answer is

$$
\mathbf{x} = (20, 30, 0, 10, 0), \qquad \mathbf{y} = (1.2,\ 0,\ -0.2), \qquad \mathbf{z} = (0,\ 0,\ 1.2,\ 0,\ 0.2),
$$

which is the vertex $(T_1, T_2) = (20, 30)$ of lesson 5 and, up to the sign convention on the two ceiling constraints, the dual point $(\lambda, \mu_1, \mu_2) = (1.2, 0, 0.2)$ of lesson 7. Complementarity is visible in the last two vectors: wherever $x_j > 0$ the reduced cost $z_j$ is zero, and wherever $z_j > 0$ the variable is zero. The surplus $s_1 = 0$ (the thrust requirement is tight) and the slack $s_2 = 10$ (engine 1 is $10\,\mathrm{kN}$ below its ceiling) with $z_2 = 0$; the slack $s_3 = 0$ with $z_3 = 0.2$, the shadow price of engine 2's ceiling.
:::

## Cones, and detecting infeasibility

Nothing above used the fact that the constraints were scalar inequalities except the barrier $-\sum\log s_i$ and the diagonal matrices $\mathbf{X}$, $\mathbf{Z}$. For a general symmetric cone the same algorithm runs with the cone's barrier – $-\log(t^2 - \|\mathbf{u}\|_2^2)$ for the second-order cone, $-\log\det\mathbf{X}$ for the semidefinite one – and the products $x_j z_j$ replaced by the cone's Jordan product. The complementarity condition becomes $\mathbf{s}\circ\mathbf{z} = \sigma\mu\mathbf{e}$, where $\mathbf{e}$ is the cone's identity element, and the scaling that keeps the primal and dual steps symmetric is the **Nesterov–Todd scaling**, a linear map $\mathbf{W}$ chosen so that it takes the current primal point and the current dual point to the same point of the cone. ECOS, Clarabel and every other conic interior-point solver you will meet is this algorithm with this scaling; lesson 8's fact that the cones are self-dual is what makes the symmetric scaling exist.

Infeasibility is handled by a change of formulation rather than a special case. The **homogeneous self-dual embedding** builds one larger problem whose variables are the primal, the dual, and two extra scalars $\tau$ and $\kappa$ playing the roles of "the problem has a solution" and "the problem is infeasible". This embedded problem is always strictly feasible, so the algorithm can always start, and it always converges. At the end, if $\tau > 0$ the solution is recovered as $\mathbf{x}/\tau$; if instead $\kappa > 0$, the iterates have converged to the improving ray of lesson 7, and the solver reports primal or dual infeasibility *with the certificate in hand*. This is why a conic solver's "infeasible" is a mathematical statement and not a timeout.

::: example Iteration counts for the landing SOCP
Lesson 6 sized the discretised landing problem at $N = 100$: $401$ second-order cones, none larger than dimension $4$, plus $100$ linear inequalities, and $713$ equality rows. The barrier parameter is additive over a product of cones, and a second-order cone contributes $2$ regardless of its dimension:

$$
\nu = 2 \times 401 + 1 \times 100 = 902, \qquad \sqrt{\nu} = 30.0 .
$$

The theoretical bound is $\sqrt{\nu}\log(1/\epsilon)$ up to a constant: about $415$ iterations for $\epsilon = 10^{-6}$ and $553$ for $10^{-8}$. Those are the numbers you could certify from theory alone. What is actually observed on problems of this shape is a few tens – the two-engine LP above took seven, and a well-scaled trajectory SOCP of this size typically takes $15$ to $30$. The gap between $553$ and $30$ is the price of a worst-case analysis that has to cover adversarial data, and it is why flight practice sets the iteration cap from Monte-Carlo testing over the state envelope rather than from the bound, while keeping the bound as the reason the cap exists.

Note also what does *not* appear in $\nu$: the number of variables, $1107$. Adding more time steps adds cones and equations, and the bound grows like the square root of the number of cones, not like the number of unknowns. Doubling the horizon to $N = 200$ gives $\nu = 1802$ and $\sqrt{\nu} = 42.5$, a $41\,\%$ increase in the iteration bound for twice the work per iteration.
:::

::: warning An interior-point method never reaches a vertex, and warm starting barely helps
Two consequences catch people out. First, the iterate stays strictly inside the feasible set by construction, so the answer you get is near a vertex, not at one; on a degenerate problem with a flat optimal face – exactly the fixed-time landing LP of lesson 5, whose objective is constant over the whole feasible set – the method converges to the *analytic centre* of the optimal face, a point in the middle, not a bang-bang corner. If you need a vertex solution, you need a crossover step or an active-set method.

Second, an interior-point method is hard to warm start. The natural warm start – the previous solve's optimal point – is on the boundary of the cone, where the barrier is infinite and the Newton step is meaningless. Nudging it inside usually leaves it badly off the central path, and the method spends as many iterations recovering as it would have spent from a cold start. Active-set and operator-splitting methods (lesson 12's OSQP) warm start beautifully; interior-point methods essentially do not. For a controller re-solving a slightly perturbed problem every cycle this is a real argument for the other families – and, conversely, the insensitivity of an interior-point method's iteration count to its starting point is what makes its runtime predictable. You cannot have both.
:::

::: note Newton's method, revisited
Every interior-point iteration is one Newton step of lesson 1 on a smooth function, with the wrinkle that the function is the barrier-augmented objective and the step is constrained to the equality manifold. The reason the method escapes the condition-number dependence that crippled gradient descent in lesson 1 is that Newton's method is invariant to linear changes of variable, and the self-concordance analysis makes that invariance quantitative. If you want one sentence for why convex optimisation is a solved engineering problem and general nonlinear optimisation is not, it is this: for self-concordant barriers, "how far am I from the answer" can be measured in a way that Newton's method contracts by a fixed factor, no matter what the data looks like.
:::

## Check yourself

::: check
On the central path with $m = 400$ inequality constraints, how large must $t$ be to guarantee the objective is within $10^{-5}$ of optimal? If the barrier method starts at $t_0 = 1$ and multiplies $t$ by $\mu = 20$ each outer iteration, how many outer iterations is that?
:::

::: answer
The certificate is $f_0(\mathbf{x}^\star(t)) - p^\star \le m/t$, so $t \ge m/\epsilon = 400/10^{-5} = 4\times10^{7}$. The number of outer iterations is $\lceil\log(m/(t_0\epsilon))/\log\mu\rceil = \lceil\log(4\times10^7)/\log 20\rceil = \lceil 17.50/3.00\rceil = \lceil 5.84\rceil = 6$. Six outer iterations, each a few Newton steps – say $3$ to $5$ – so of order $20$ to $30$ linear solves in total. Note how weakly the count depends on the accuracy: asking for $10^{-8}$ instead multiplies $t$ by $1000$ and adds only $\log(1000)/\log(20) = 2.3$, i.e. three more outer iterations.
:::

::: check
Why does the barrier parameter of a second-order cone not grow with its dimension, while the parameter of a semidefinite block does? What does that imply for a problem with one $\|\mathbf{u}\|_2 \le t$ constraint on a $1000$-dimensional vector?
:::

::: answer
The barrier parameter $\nu$ counts, roughly, how many independent "boundaries" the barrier has to keep the iterate away from. A second-order cone has a single boundary surface $\|\mathbf{u}\|_2 = t$ no matter how many components $\mathbf{u}$ has, and its barrier $-\log(t^2 - \|\mathbf{u}\|^2)$ is a single logarithm, so $\nu = 2$. A semidefinite block of size $n$ has $n$ eigenvalues that must each stay nonnegative, and $-\log\det\mathbf{X} = -\sum_i\log\lambda_i(\mathbf{X})$ is $n$ logarithms, so $\nu = n$. Likewise $m$ scalar inequalities give $m$ logarithms and $\nu = m$. For the $1000$-dimensional norm bound: expressed as one second-order cone it contributes $2$ to $\nu$; expressed as $1000$ separate componentwise bounds it would contribute $1000$ and would not even be the same constraint. Choosing the right cone is worth a factor of $\sqrt{500}$ in the iteration bound.
:::

::: check
A solver log shows the objective jumping around wildly for the first three iterations before settling. Is the solver broken?
:::

::: answer
Almost certainly not. A primal-dual method with an infeasible start does not maintain primal feasibility; the iterate is driven toward feasibility and optimality at the same time, so the objective value at an infeasible point is not a cost anybody could pay and has no reason to behave monotonically. In the two-engine run above the objective went $22 \to 59.75 \to 58.90 \to 54.28$, overshooting the optimum by more than the starting value was below it, while the primal residual fell from $42$ to $0.0038$. The columns to watch are the residuals and the gap; the objective is only meaningful once the residuals are small. A genuinely broken solve looks different: residuals stalling at a fixed level, step lengths collapsing toward zero, or $\mu$ refusing to decrease.
:::

::: check
Explain, in terms of the central path, why an interior-point method returns the middle of the optimal face when the optimum is not unique.
:::

::: answer
Along the central path the iterate minimises $t f_0(\mathbf{x}) + \phi(\mathbf{x})$. If the optimal set is a face on which $f_0$ is constant, then for large $t$ the first term is the same everywhere on that face and the choice is made entirely by the barrier $\phi$, which is minimised at the point that is furthest from the constraint boundaries in its own metric – the analytic centre of the face. So the limit of the central path is that centre, not a vertex. Concretely, for the constant-mass fixed-time landing LP of lesson 5, where every feasible thrust history has the same cost, the returned profile is a smooth, middle-of-the-road thrust history rather than the coast-then-burn corner. The fix is not to change the solver: it is to fix the formulation so the optimum is unique, by letting the final time vary, by including the mass depletion that makes late burns genuinely cheaper, or by adding a small regulariser.
:::

::: check
The landing SOCP takes $20$ iterations on a nominal case. A colleague proposes setting the flight solver's iteration cap to $20$ to save time. What is wrong with that, and what would you do instead?
:::

::: answer
The nominal case is one point in a large state envelope, and the iteration count, while insensitive, is not constant: dispersions in initial state, mass, winds and target position all shift it, and the cases that matter for the cap are the hard ones – near-infeasible geometries, where the strictly feasible region is thin and the central path is long. Setting the cap at the nominal count guarantees that the worst cases hit it. What you do instead: run a large Monte-Carlo over the certified envelope, record the iteration count at the required tolerance for every case, take the maximum, and add margin – a factor of about two is common practice. Then design what happens when the cap is hit anyway: the solver must return the best iterate it has together with its current duality gap so that a monitor can decide whether the answer is good enough to fly, and the guidance mode logic must have a defined fallback. The theoretical bound of $553$ iterations is not the cap; it is the reason a finite cap exists at all.
:::

## Summary

| Object | Statement |
| --- | --- |
| Logarithmic barrier | $\phi(\mathbf{x}) = -\sum_i\log(-g_i(\mathbf{x}))$; convex, blows up at the boundary |
| Centering problem | minimise $t f_0(\mathbf{x}) + \phi(\mathbf{x})$ s.t. $\mathbf{F}\mathbf{x} = \mathbf{g}$; its solution $\mathbf{x}^\star(t)$ traces the central path |
| Central-path certificate | $\lambda_i(t) = -1/(t\,g_i(\mathbf{x}^\star(t)))$ is dual feasible, and $f_0(\mathbf{x}^\star(t)) - p^\star \le m/t$ |
| Box example | $x^\star(t) = ((t+2) - \sqrt{t^2+4})/(2t)$; at $t = 10$, $x = 0.0901$ with bracket $[-0.1099, 0.0901]$ |
| Outer iterations | $\lceil\log(m/(t_0\epsilon))/\log\mu\rceil$; $9$ for $m = 2$, $t_0 = 1$, $\mu = 10$, $\epsilon = 10^{-8}$ |
| Perturbed KKT | $x_j z_j = \sigma\mu$ with $\mu = \mathbf{x}^\top\mathbf{z}/n$; one Newton step per iteration |
| Normal equations | $\mathbf{A}\mathbf{D}\mathbf{A}^\top\Delta\mathbf{y} = \cdot$ with $\mathbf{D} = \mathbf{Z}^{-1}\mathbf{X}$; one factorisation per iteration |
| Practical refinements | Fraction to boundary $\eta \approx 0.99$; Mehrotra predictor-corrector with $\sigma = (\mu_{\text{aff}}/\mu)^3$; infeasible start |
| Two-engine run | Seven iterations from a bad start; gap $22 \to 3.5\times10^{-9}$, factor $100$ per iteration once centred |
| Cones | Same method with the cone barrier and Nesterov–Todd scaling; $\nu = m$, $2$, $n$ for orthant, second-order cone, $n \times n$ PSD block |
| Infeasibility | Homogeneous self-dual embedding: $\tau > 0$ gives the solution, $\kappa > 0$ gives the infeasibility certificate |
| Landing SOCP | $\nu = 902$, $\sqrt{\nu} = 30.0$; bound $\approx 415$ iterations at $\epsilon = 10^{-6}$, observed $15$ to $30$ |
| Limitations | Converges to the analytic centre of a flat optimal face; warm starting is of little help |

The next lesson leaves the convex world. When the problem cannot be written as a cone program – a fixed-magnitude thrust, an aerodynamic model, a free final time that multiplies the controls – the method of choice is sequential quadratic programming, which solves a quadratic model of the problem at each step and gives up, in exchange for generality, every guarantee this lesson just established.
