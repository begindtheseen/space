---
id: l02-lossless-convexification-thrust-bound
title: Lossless convexification of the thrust bound
minutes: 22
covers:
  - "Why the thrust magnitude constraint rho_min <= ||T|| <= rho_max is non-convex — the feasible set is an annulus with the origin removed"
  - "Lossless convexification: the slack variable Gamma with ||T|| <= Gamma and rho_min <= Gamma <= rho_max, and the proof sketch via the maximum principle that the relaxation is tight"
---

The previous lesson named four obstacles between the powered-descent problem and convexity and asked you to take on faith that the first of them — the lower thrust bound — has an exact fix. This lesson delivers it. Lossless convexification is not a trick that happens to work on this one problem; it is a theorem, with a hypothesis you can check and a conclusion precise enough to verify numerically to machine precision, and by the end of this lesson you will have done exactly that on a real trajectory rather than a toy.

The name is worth taking literally. "Lossless" does not mean "a good approximation" or "close enough for flight." It means the optimal value of the relaxed, convex problem *equals* the optimal value of the original, non-convex one, and the relaxed problem's optimal solution, read back into the original variables, is feasible for the original constraint. Nothing is approximated; a constraint is replaced by a larger one, and a proof shows the extra room is never used. This is the idea every other technique in this module either extends (the pointing constraint gets the same treatment later) or is honest about not having (successive convexification, built in the second half of this module, gets none of these guarantees, and says so).

## The annulus, made precise

Fix a thrust vector $\mathbf{T} \in \mathbb{R}^3$ and the engine's throttle band $0 < \rho_{\min} \le \rho_{\max}$. The feasible set for a single instant is

$$
S = \{\mathbf{T} \in \mathbb{R}^3 : \rho_{\min} \le \|\mathbf{T}\|_2 \le \rho_{\max}\}.
$$

Split it into two conditions. The upper bound alone, $\|\mathbf{T}\|_2 \le \rho_{\max}$, is a solid ball centred at the origin — the epigraph of a norm, convex by the same argument the optimization module used for every norm constraint in this curriculum. The lower bound alone, $\|\mathbf{T}\|_2 \ge \rho_{\min}$, is the complement of an *open* ball: everything outside a hole around the origin. Take any $\mathbf{T}_1, \mathbf{T}_2 \in S$ with $\mathbf{T}_2 = -\mathbf{T}_1$ (opposite points at any radius in $[\rho_{\min}, \rho_{\max}]$, not just the boundary). Their midpoint is $\tfrac12(\mathbf{T}_1 + \mathbf{T}_2) = \mathbf{0}$, and $\|\mathbf{0}\|_2 = 0 < \rho_{\min}$ whenever $\rho_{\min} > 0$. Convexity requires every segment between two feasible points to stay feasible; this segment's midpoint does not, so $S$ is not convex — for *any* positive $\rho_{\min}$, not merely the specific numbers a worked example might pick. Set $\rho_{\min} = 0$ instead and the argument breaks at the first step: the excluded region becomes empty, $S$ becomes the ball $\|\mathbf{T}\|\le\rho_{\max}$, and it is convex. The non-convexity is entirely the minimum-throttle floor, which is exactly why the fix targets that one inequality and leaves the maximum-throttle bound alone.

This floor is not a modelling nicety. A liquid rocket engine has a minimum stable combustion-chamber pressure below which the flame can go unstable or extinguish, and on most vehicles flown or planned for powered descent the engine cannot be shut down and relit inside the landing burn — so $\rho_{\min} > 0$ is a hard fact about the hardware, not a constraint an engineer could choose to relax away.

## The relaxation

Introduce a new decision variable $\Gamma(t)$, one per instant, and replace the throttle constraint everywhere it appears:

$$
\|\mathbf{T}\|_2 \le \Gamma, \qquad \rho_{\min} \le \Gamma \le \rho_{\max}, \qquad \dot m = -\alpha\Gamma, \qquad \text{cost} = \int_0^{t_f}\Gamma\,dt,
$$

replacing $\|\mathbf{T}\|_2$ by $\Gamma$ in the mass-depletion equation and in the objective, wherever the true thrust magnitude used to sit. Every one of these is now convex: $\|\mathbf{T}\|_2 \le \Gamma$ is a second-order cone in the lifted pair $(\mathbf{T}, \Gamma)$, and $\rho_{\min} \le \Gamma \le \rho_{\max}$ is an ordinary interval — a slab in the $\Gamma$ direction. The feasible set for $(\mathbf{T}, \Gamma)$ jointly is a finite slice of a cone: convex, with no annulus anywhere in sight.

A **relaxation** is a problem obtained by enlarging the feasible set; its optimal value can only fall or stay the same, never rise, because everything that was feasible before is still feasible. Project the new feasible set for $(\mathbf{T}, \Gamma)$ back onto $\mathbf{T}$ alone: $\Gamma$ can sit anywhere in $[\rho_{\min}, \rho_{\max}]$ and $\mathbf{T}$ only has to satisfy $\|\mathbf{T}\| \le \Gamma \le \rho_{\max}$, so the projection is the *entire* ball $\|\mathbf{T}\| \le \rho_{\max}$ — the annulus's forbidden interior is now reachable. On its face this relaxation has thrown away exactly the constraint that was causing trouble, which would make it useless: an optimizer minimising $\int\Gamma\,dt$ has every incentive to declare $\Gamma$ small, including inside the hole $\rho_{\min}$ was there to forbid, and a solution with $\mathbf{T}$ near zero while $\Gamma$ sits at $\rho_{\min}$ would satisfy every relaxed constraint while describing an engine that is not actually running.

::: example The relaxed set really is bigger — check a specific point
Take $\rho_{\min}=4972\,\mathrm{N}$, $\rho_{\max}=13260\,\mathrm{N}$ and the point $\mathbf{T}=(0,0,0)\,\mathrm{N}$, $\Gamma = 6000\,\mathrm{N}$. Against the relaxed constraints: $\|\mathbf{T}\|_2 = 0 \le \Gamma = 6000$, and $4972 \le 6000 \le 13260$ — both hold, so $(\mathbf{T},\Gamma)$ is feasible for the relaxed problem. Against the original constraint on $\mathbf{T}$ alone: $\|\mathbf{T}\|_2 = 0$, and $0 < \rho_{\min}=4972$, so $\mathbf{T}=\mathbf{0}$ is *not* feasible for the original problem — it describes an engine reporting a $6000\,\mathrm{N}$ throttle setting while producing no thrust at all, which is not physical. This single point is exactly what "the relaxation enlarges the feasible set" means in numbers, and exactly the kind of point the theorem has to rule out at the optimum. Contrast $\mathbf{T}=(0,0,6000)\,\mathrm{N}$, $\Gamma=6000\,\mathrm{N}$: relaxed constraints still hold ($\|\mathbf{T}\|=\Gamma$, on the cone's boundary), and now $\|\mathbf{T}\|=6000 \ge \rho_{\min}$ too, so this point is feasible for *both* problems. The theorem's claim is that the optimizer, left to choose between points like the first and points like the second, always ends up at points like the second.
:::

::: key What "lossless" claims, exactly
Lossless convexification is the theorem that the relaxed problem's optimum never does this. At the optimal solution of the relaxed problem, $\|\mathbf{T}(t)\|_2 = \Gamma(t)$ for all but at most a measure-zero set of instants — the relaxed optimum sits *on* the surface of the cone it was allowed to move inside, so reading $\mathbf{T}(t)$ back into the original problem gives a trajectory that satisfies $\rho_{\min}\le\|\mathbf{T}\|\le\rho_{\max}$ after all. The relaxed optimal cost therefore equals the true, non-convex optimal cost, and the relaxed optimal trajectory *is* the original optimal trajectory. This is a proof about the optimum, not a property you could see by inspecting the constraint set on its own.
:::

## Why it is exact: the argument from the maximum principle

Apply Pontryagin's minimum principle to the relaxed problem. With costates $\boldsymbol{\lambda}_r, \boldsymbol{\lambda}_v, \lambda_m$ conjugate to $\mathbf{r}, \mathbf{v}, m$, the Hamiltonian is

$$
H = \Gamma + \boldsymbol{\lambda}_r\!\cdot\!\mathbf{v} + \boldsymbol{\lambda}_v\!\cdot\!\left(\frac{\mathbf{T}}{m} + \mathbf{g}\right) - \alpha\lambda_m\Gamma = \Gamma\big(1 - \alpha\lambda_m\big) + \frac{1}{m}\boldsymbol{\lambda}_v\!\cdot\!\mathbf{T} + \boldsymbol{\lambda}_r\!\cdot\!\mathbf{v} + \boldsymbol{\lambda}_v\!\cdot\!\mathbf{g}.
$$

The minimum principle says the optimal controls minimise $H$ pointwise. Minimise over $\mathbf{T}$ first, holding $\Gamma$ fixed: the only $\mathbf{T}$-dependence is the linear term $\boldsymbol{\lambda}_v\!\cdot\!\mathbf{T}/m$, minimised over the ball $\|\mathbf{T}\|_2 \le \Gamma$ by pushing $\mathbf{T}$ as far as possible opposite $\boldsymbol{\lambda}_v$ — a linear function on a ball always attains its minimum on the boundary, never in the interior, *unless* its gradient is zero. So $\mathbf{T}^\star = -\Gamma\,\boldsymbol{\lambda}_v/\|\boldsymbol{\lambda}_v\|_2$ whenever $\boldsymbol{\lambda}_v \ne \mathbf{0}$, and by construction $\|\mathbf{T}^\star\|_2 = \Gamma$ exactly: tightness at that instant, for free, straight out of minimising a linear function on a ball.

Substituting $\mathbf{T}^\star$ back, $H^\star(\Gamma) = \Gamma\big(1 - \alpha\lambda_m - \|\boldsymbol{\lambda}_v\|_2/m\big) + (\text{terms not depending on } \Gamma)$ is *linear* in $\Gamma$, so minimising over $\Gamma \in [\rho_{\min}, \rho_{\max}]$ again pushes to a boundary — $\Gamma^\star = \rho_{\min}$ where the bracket is positive, $\Gamma^\star = \rho_{\max}$ where it is negative — except possibly on an interval where the bracket vanishes identically (a singular arc; it does not occur for this problem under the standing controllability hypothesis, and the worked example below shows the honest bang-bang structure this predicts instead).

So the whole argument turns on one question: can $\boldsymbol{\lambda}_v(t)$ vanish on an interval? Here the costate equations answer directly, and more sharply than a generic "it obeys a differential equation." With no state-dependent terms in $H$ beyond $\boldsymbol{\lambda}_r\!\cdot\!\mathbf{v}$ (true for this basic problem; a glideslope or keep-out constraint would change this), the adjoint equations give $\dot{\boldsymbol{\lambda}}_r = -\partial H/\partial \mathbf{r} = \mathbf{0}$ and $\dot{\boldsymbol{\lambda}}_v = -\partial H/\partial \mathbf{v} = -\boldsymbol{\lambda}_r$. The first says $\boldsymbol{\lambda}_r$ is *constant*; the second then says $\boldsymbol{\lambda}_v(t) = \boldsymbol{\lambda}_v(0) - \boldsymbol{\lambda}_r\,t$ is an **affine function of time**, component by component — not merely some smooth function, an honest straight line in each coordinate. A non-trivial affine function of a real variable has at most one zero. So $\boldsymbol{\lambda}_v(t)$ either vanishes at a single isolated instant (measure zero, no effect on the conclusion) or it is the zero function on the whole interval, which happens exactly when $\boldsymbol{\lambda}_r = \mathbf{0}$ and $\boldsymbol{\lambda}_v(0) = \mathbf{0}$ simultaneously. Ruling out that last, fully-degenerate case is the one place this argument leans on a hypothesis rather than deriving it from scratch: a standard controllability condition on the linearised translational dynamics (three independent thrust axes acting on three independent position axes, which a real lander has) excludes it, by the minimum principle's non-triviality condition that the costates cannot all vanish together at a genuine extremal. Given that, $\boldsymbol{\lambda}_v(t) \ne \mathbf{0}$ for all but at most one instant, and $\|\mathbf{T}^\star(t)\|_2 = \Gamma^\star(t)$ almost everywhere — the relaxation is lossless.

::: warning Lossless is a proof about this constraint, not a property of "relaxing things"
It is easy to walk away from this argument thinking any inconvenient constraint can be relaxed and will turn out fine. It will not. The argument above used three specific facts: the true constraint's slack variable enters the *cost* with a sign that rewards shrinking it, the control it bounds enters the Hamiltonian *linearly*, and the resulting costate can be shown not to vanish on an interval. Change any one of those and the guarantee is gone — drop a keep-out zone around a piece of ground equipment and the relaxed trajectory will fly straight through the equipment, because nothing in the cost discourages it. Every relaxation in this module earns its keep by an argument of this shape, stated for that specific constraint; "we relaxed it and it seemed fine in testing" is exactly the unproven claim the previous lesson's certification argument refuses to accept.
:::

## Checking it on a real trajectory

Theory earns its keep by surviving contact with numbers. Borrow, for now, one result the next lesson derives in full: dividing through by mass and substituting $\mathbf{u} = \mathbf{T}/m$, $\sigma = \Gamma/m$, $z = \ln m$ turns the mass-varying dynamics linear and turns the throttle slab $\rho_{\min}\le\Gamma\le\rho_{\max}$ into a pair of bounds on $\sigma$ that stay convex once expanded about a reference mass history — an affine upper bound and a convex-quadratic lower bound. Nothing about the tightness argument above changes under this substitution, since dividing $\|\mathbf{T}\|\le\Gamma$ through by the same positive $m$ gives $\|\mathbf{u}\|\le\sigma$, the identical cone.

::: example Bang-bang throttle on a $1905\,\mathrm{kg}$ Mars lander, and $\sigma = \|\mathbf{u}\|$ checked at every node
Build the convexified problem for the lander from the previous lesson — $\rho_{\min}=4972\,\mathrm{N}$, $\rho_{\max}=13260\,\mathrm{N}$, $I_{sp}=225\,\mathrm{s}$, $g=3.7114\,\mathrm{m/s^2}$ — from $\mathbf{r}_0=(1200,400,1500)\,\mathrm{m}$, $\mathbf{v}_0=(-40,10,-70)\,\mathrm{m/s}$, landing at the origin, discretised into $N=30$ steps of $\Delta t = 2\,\mathrm{s}$ ($t_f = 60\,\mathrm{s}$). Solve it with an interior-point barrier method for the second-order cone (the same barrier idea the optimization module built for linear inequalities, extended here with the cone barrier $-\log(\Gamma^2 - \|\mathbf{u}\|^2)$, which the check-yourself section below has you verify is a valid convex barrier the way the interior-point-methods lesson would ask). The solve converges in $9$ outer barrier iterations, $65$ Newton steps total, to a duality gap below $5\times10^{-8}$, and lands with $\mathbf{r}(t_f)=\mathbf{0}$, $\mathbf{v}(t_f)=\mathbf{0}$ to better than $10^{-11}$ in every component, burning $240.382\,\mathrm{kg}$ of propellant.

Reading off $\sigma_k$ against $\|\mathbf{u}_k\|$ at every one of the $30$ steps:

| step $k$ | $t\,(\mathrm{s})$ | throttle ($\rho_k/\rho_{\max}$) | $\sigma_k\,(\mathrm{m/s^2})$ | $\|\mathbf{u}_k\|\,(\mathrm{m/s^2})$ | $\sigma_k - \|\mathbf{u}_k\|$ |
| --- | --- | --- | --- | --- | --- |
| $0$ | $0$ | $100.0\%$ | $6.960630$ | $6.960630$ | $3.8\times10^{-10}$ |
| $8$ | $16$ | $100.0\%$ | $7.329380$ | $7.329380$ | $3.9\times10^{-10}$ |
| $9$ | $18$ | $91.9\%$ | $6.777727$ | $6.777727$ | $3.9\times10^{-10}$ |
| $10$ | $20$ | $37.5\%$ | $2.783609$ | $2.783609$ | $3.9\times10^{-10}$ |
| $17$ | $34$ | $37.5\%$ | $2.833606$ | $2.833606$ | $3.9\times10^{-10}$ |
| $24$ | $48$ | $37.5\%$ | $2.885533$ | $2.885533$ | $3.9\times10^{-10}$ |
| $25$ | $50$ | $52.2\%$ | $4.030574$ | $4.030574$ | $3.9\times10^{-10}$ |
| $29$ | $58$ | $99.7\%$ | $7.886087$ | $7.886087$ | $3.9\times10^{-10}$ |

Every gap is at solver tolerance, not merely small — the relaxed solution never once uses the room the relaxation opened up. Reading the throttle column top to bottom tells the same story the maximum principle predicted: full throttle for the first nine steps (braking hard against the approach velocity), a long coast at exactly $37.5\% = \rho_{\min}/\rho_{\max}$ — minimum throttle, the non-convex floor itself, held for fifteen consecutive steps because coasting under gravity is cheaper than fighting it at high thrust while there is still altitude to spare — then back to essentially full throttle for the final braking. Two switches, bang–coast–bang, exactly the structure a bracket linear in $\Gamma$ produces when its sign flips twice. And the coast phase is not merely "near" the floor: at step $17$, $\sigma_{17}\times m_{17} = 2.833606 \times 1754.66 = 4972.00\,\mathrm{N}$, matching $\rho_{\min}$ to five significant figures — the vehicle is running its engine at exactly the minimum stable throttle the hardware allows, recovered by a solver that was never told the annulus constraint existed in that form.
:::

This is what "the relaxed solution lands on the boundary rather than inside it" means concretely: not approximately zero, not small compared to some tolerance chosen after the fact, but at the solver's own convergence tolerance, on every single node of a real, physically dimensioned trajectory — including, and especially, the fifteen consecutive nodes where the true non-convex constraint is *active*, which is exactly where a relaxation would be expected to fail if it were going to.

## Check yourself

::: check
Someone proposes "solving" the throttle non-convexity by simply dropping the lower bound entirely — solve with only $\|\mathbf{T}\|\le\rho_{\max}$ and clip any resulting $\|\mathbf{T}\|$ below $\rho_{\min}$ up to $\rho_{\min}$ afterward. Why is this a different, and worse, approach than lossless convexification?
:::

::: answer
Dropping the lower bound is also a relaxation — the feasible set grows the same way — but nothing in that problem's cost or Hamiltonian gives the optimizer any reason to avoid the interior of the forbidden ball, so the unclipped solution will typically have long stretches with $\mathbf{T}$ well inside it, not just crossing the boundary briefly. Clipping afterward is a heuristic patch: it produces a trajectory that satisfies the throttle bound, but the clipped controls no longer solve the dynamics exactly (the clip changes $\mathbf{T}$ without re-propagating $\mathbf{r}, \mathbf{v}, m$), so the patched trajectory generally misses the target and is not optimal for anything in particular. Lossless convexification instead keeps the slack $\Gamma$ *inside* the cost and mass dynamics, which is precisely the mechanism that drives $\Gamma$ down to $\|\mathbf{T}\|$ at the optimum — the fix is in the formulation, not applied after the solve.
:::

::: check
In the maximum-principle argument, minimising $H$ over $\mathbf{T}$ on the ball $\|\mathbf{T}\|\le\Gamma$ gave $\|\mathbf{T}^\star\| = \Gamma$ immediately, "for free." What property of the Hamiltonian made that step work, and what would break it?
:::

::: answer
The Hamiltonian is *linear* in $\mathbf{T}$ — the only $\mathbf{T}$-dependence is $\boldsymbol{\lambda}_v\!\cdot\!\mathbf{T}/m$ — and a linear function minimised over a ball always attains its minimum on the boundary, because moving radially outward in the direction that decreases the linear function always decreases it further until the boundary is reached. This would break if the dynamics contributed a $\mathbf{T}$-dependent term that was not linear — for instance, an aerodynamic drag term depending on thrust-induced plume effects, or a quadratic penalty on $\|\mathbf{T}\|$ added to discourage large slews. Either would make $H$ a nonlinear function of $\mathbf{T}$ on the ball, whose minimum could sit anywhere in the interior, and the "for free" tightness would no longer follow from this argument.
:::

::: check
The costate $\boldsymbol{\lambda}_v(t)$ was shown to be an affine function of time for the basic problem. Explain why adding a glideslope constraint $\|\mathbf{E}\mathbf{r}\|_2 \le \mathbf{r}\!\cdot\!\hat{\mathbf{e}}\tan\gamma$ (keeping the vehicle above an inverted cone over the landing site) would change this, and what you would need to re-examine as a result.
:::

::: answer
The glideslope constraint makes $\mathbf{r}$ appear in the problem in a way that (via a multiplier on the active constraint) contributes an $\mathbf{r}$-dependent term to the Hamiltonian, so $\dot{\boldsymbol{\lambda}}_r = -\partial H/\partial\mathbf{r}$ is no longer zero while the constraint is active. Since $\dot{\boldsymbol{\lambda}}_v = -\boldsymbol{\lambda}_r$, $\boldsymbol{\lambda}_v$ is then the integral of a non-constant function rather than a straight line, and "affine, hence at most one zero" no longer applies directly on the arcs where glideslope is active. This does not automatically break tightness — the linear-in-$\mathbf{T}$ argument for $\|\mathbf{T}^\star\|=\Gamma^\star$ never used the shape of $\boldsymbol{\lambda}_v(t)$, only that it is not identically zero on an interval — but it does mean the clean "at most one isolated zero" bookkeeping has to be re-derived arc by arc rather than taken on faith, which is exactly the kind of detail the pointing-and-glideslope lesson later in this module addresses directly.
:::

::: check
The bang–coast–bang pattern in the worked example switches exactly twice. If a colleague's solve of a similar problem showed the throttle oscillating rapidly between minimum and maximum many times over the burn, what would you suspect first?
:::

::: answer
Not the theorem — lossless convexification says nothing about how many times the switching function changes sign, so it permits many switches in principle. The first suspicion should be the discretisation or the solver: a coarse time grid can alias a genuinely smooth switching function into apparent chattering, an interior-point solve that has not reached a small duality gap can leave $\sigma$ wandering near the boundary without having actually settled there, or the reference mass history used to convexify the throttle bounds may be a poor match to the true trajectory late in the burn, distorting the bounds enough to manufacture spurious switches. The diagnostic is to check the relaxation gap $\sigma-\|\mathbf{u}\|$ at every node as this lesson did, and to refine the time grid and re-solve; a real, well-converged solution of this problem class is bang–bang with few switches, because the switching function it depends on is close to affine.
:::

::: check
Verify that $\phi(\mathbf{u},\sigma) = -\log(\sigma^2 - \|\mathbf{u}\|_2^2)$, the barrier used in the worked example's solver, is only defined — and only useful as a barrier — on the strict interior of the cone. What does the barrier do as a candidate point approaches the cone's boundary from inside, and why is that the desired behaviour for an interior-point method?
:::

::: answer
$\phi$ requires $\sigma^2 - \|\mathbf{u}\|_2^2 > 0$, i.e. $\|\mathbf{u}\|_2 < \sigma$ strictly (the argument of the logarithm must be positive), so it is undefined exactly on and outside the cone's boundary $\|\mathbf{u}\|=\sigma$ — a point on the boundary, which is precisely where the lossless-convexification optimum sits, cannot be evaluated by $\phi$ directly. As a strictly interior point approaches the boundary, $\sigma^2-\|\mathbf{u}\|^2\to 0^+$ and $\phi\to+\infty$: the barrier erects an infinite wall just inside the constraint, which is exactly why an interior-point method's iterates never cross it and a separate feasibility check is never needed for this constraint. The optimum itself is only ever *approached* in the limit as the barrier weight grows, which is consistent with the theorem's own "almost everywhere" — a solver reports $\sigma_k-\|\mathbf{u}_k\|$ at the level of its convergence tolerance, not identically zero in floating point, which is exactly the $10^{-10}$ level seen in the worked example.
:::

## Summary

| Object | Statement |
| --- | --- |
| The annulus | $\{\mathbf{T} : \rho_{\min}\le\|\mathbf{T}\|\le\rho_{\max}\}$; non-convex for any $\rho_{\min}>0$ because opposed boundary points have an infeasible midpoint |
| The relaxation | Slack $\Gamma$: $\|\mathbf{T}\|\le\Gamma$, $\rho_{\min}\le\Gamma\le\rho_{\max}$; use $\Gamma$ (not $\|\mathbf{T}\|$) in $\dot m$ and the cost |
| Lossless means | Relaxed optimum has $\|\mathbf{T}(t)\|=\Gamma(t)$ almost everywhere, so it is feasible and optimal for the *original*, non-convex problem |
| The argument | $H$ linear in $\mathbf{T}$ on a ball $\Rightarrow \|\mathbf{T}^\star\|=\Gamma^\star$ unless $\boldsymbol{\lambda}_v=\mathbf{0}$; $\boldsymbol{\lambda}_v(t)$ affine $\Rightarrow$ at most one zero, ruled out entirely by controllability |
| Bang-bang consequence | $H^\star$ linear in $\Gamma$ too $\Rightarrow$ $\Gamma^\star\in\{\rho_{\min},\rho_{\max}\}$ except on a singular arc; observed as bang–coast–bang |
| Worked lander | $N=30$, $\Delta t=2\,\mathrm{s}$: $9$ outer iterations, $65$ Newton steps, gap $<5\times10^{-8}$, propellant $240.382\,\mathrm{kg}$, $\sigma_k-\|\mathbf{u}_k\|\approx4\times10^{-10}$ at every node |
| Coast-phase check | $\sigma_{17}m_{17}=4972.00\,\mathrm{N}=\rho_{\min}$ to five figures — the true annulus constraint recovered exactly, never imposed directly |
| Not a general licence | The argument used linearity in the control and a sign in the cost; a different constraint (a keep-out zone, for instance) needs its own argument or stays an approximation |

The next lesson earns the substitution this one borrowed: it derives $\mathbf{u}=\mathbf{T}/m$, $\sigma=\Gamma/m$, $z=\ln m$ from the mass-depletion non-convexity directly, shows exactly why the resulting throttle bounds in $(\sigma, z)$ stay convex, and assembles the whole thing into the second-order-cone standard form a solver actually consumes.
