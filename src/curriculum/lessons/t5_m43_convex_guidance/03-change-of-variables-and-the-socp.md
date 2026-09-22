---
id: l03-change-of-variables-and-socp
title: The change of variables, convex mass bounds, and the SOCP
minutes: 21
covers:
  - The change of variables u = T/m, sigma = Gamma/m, z = ln m, and how it makes the translational dynamics exactly linear
  - The second-order-expanded mass bounds that keep the transformed thrust bounds convex
  - SOCP standard form, the second-order cone, and mapping the powered-descent problem onto it
---

The previous lesson fixed one of the four non-convexities from this module's opening and borrowed a substitution to check the fix on a real trajectory, promising the derivation later. This is later. Three things still stand between "the thrust bound is now convex" and "the whole problem is a second-order cone program a solver can consume": the mass-varying dynamics are still bilinear, the throttle slab has to survive division by that same varying mass, and every remaining piece has to be written in a form a solver actually reads. This lesson does all three, and by the end the powered-descent problem is not approximately convex, not convex except for some remaining nonlinearity — it is a second-order cone program, in exactly the standard form the optimization module defined.

## The change of variables removes the bilinearity

The mass-depletion non-convexity was never about the thrust bound; it is a separate problem, and it gets a separate tool. $\dot{\mathbf{v}} = \mathbf{T}/m + \mathbf{g}$ divides one decision variable, $\mathbf{T}$, by another, $m$, and that quotient is bilinear — nonlinear in the pair $(\mathbf{T}, m)$ even though it is linear in each one separately. No relaxation removes a bilinearity; a relaxation only helps with an inequality whose *boundary* is the problem. Here the fix is exact: replace the variables entirely.

Define, at every instant,

$$
\mathbf{u} = \frac{\mathbf{T}}{m}, \qquad \sigma = \frac{\Gamma}{m}, \qquad z = \ln m.
$$

This is a genuine change of variables, not an approximation — it is a bijection everywhere $m > 0$, which every physical trajectory satisfies, so nothing is lost going from $(\mathbf{T}, \Gamma, m)$ to $(\mathbf{u}, \sigma, z)$ and back. Substitute directly: the velocity equation becomes $\dot{\mathbf{v}} = \mathbf{u} + \mathbf{g}$, affine in the new unknowns, no mass in sight. For the mass equation, use the chain rule on $z = \ln m$:

$$
\dot z = \frac{\dot m}{m} = \frac{-\alpha\Gamma}{m} = -\alpha\sigma,
$$

also affine. Both equations of motion are now exactly linear, with time-invariant coefficients — the single hardest-looking piece of the original problem statement has become the easiest. The thrust cone $\|\mathbf{T}\|_2\le\Gamma$ divides through by the same positive $m$ to give $\|\mathbf{u}\|_2\le\sigma$, unchanged in shape. As a bonus with no separate cost, $m = e^z$ is automatically positive for every real $z$, so the physical requirement "mass stays positive" is enforced by the substitution itself rather than by an inequality someone has to remember to add.

::: example A thrust-and-mass state, converted and converted back
A vehicle carries $\mathbf{T} = (1200, -300, 8700)\,\mathrm{N}$ at $m = 1650\,\mathrm{kg}$, with the lossless slack at its tight value $\Gamma = \|\mathbf{T}\|_2$ (the previous lesson's theorem says this holds at the true optimum almost everywhere, so it is the physically meaningful case to check). Then

$$
\mathbf{u} = \frac{1}{1650}(1200,-300,8700) = (0.72727,\,-0.18182,\,5.27273)\,\mathrm{m/s^2}, \quad \sigma = \frac{\|\mathbf{T}\|_2}{1650} = \frac{8806.24}{1650} = 5.33712\,\mathrm{m/s^2},
$$

and $z = \ln 1650 = 7.40855$. Check $\|\mathbf{u}\|_2 = \sqrt{0.72727^2+0.18182^2+5.27273^2} = 5.33712\,\mathrm{m/s^2} = \sigma$ — the tightness survives the substitution exactly, as it must, since dividing both sides of $\|\mathbf{T}\|=\Gamma$ by the same $m$ cannot change whether they are equal. Recovering the original state: $m = e^{7.40855} = 1650.0\,\mathrm{kg}$, $\mathbf{T} = m\,\mathbf{u} = 1650\times(0.72727,-0.18182,5.27273) = (1200.0,-300.0,8700.0)\,\mathrm{N}$, and $\Gamma = m\sigma = 8806.24\,\mathrm{N} = \|\mathbf{T}\|_2$. Nothing round-trips approximately; the map is exact both ways.
:::

## Why the throttle slab needs two different fixes, not one

Divide the relaxed slab $\rho_{\min}\le\Gamma\le\rho_{\max}$ by $m = e^z$:

$$
\rho_{\min}e^{-z} \le \sigma \le \rho_{\max}e^{-z}.
$$

Both sides involve $e^{-z}$, a convex function of $z$ (its second derivative is $e^{-z} > 0$ everywhere), and it is tempting to assume both inequalities inherit the same convexity verdict. They do not, and the reason is worth sitting with because it is easy to get backwards. The **upper** inequality, $\sigma \le \rho_{\max}e^{-z}$, describes the region *below* the graph of a convex function; the **lower** inequality, $\sigma \ge \rho_{\min}e^{-z}$, describes the region *above* it — the epigraph, which is convex whenever the function is, by the same definition the optimization module used for every epigraph in this curriculum.

::: example Checking both claims against real numbers, not just the shape of the graph
Take $\rho_{\max}=13260\,\mathrm{N}$ and two points on the upper boundary: $(z_1,\sigma_1)=(0,\,13260)$ and $(z_2,\sigma_2)=(2,\,\rho_{\max}e^{-2})=(2,\,1794.546)$. Their midpoint is $(z_m,\sigma_m)=(1,\,7527.273)$. The true bound at $z_m=1$ is $\rho_{\max}e^{-1}=4878.081$, and $7527.273 > 4878.081$: the midpoint of two feasible upper-bound points violates the upper bound. The region is not convex, confirmed by arithmetic rather than by trusting the picture.

Run the identical pair of points through the **lower** bound with $\rho_{\min}=4972\,\mathrm{N}$: $(z_1,\sigma_1)=(0,4972)$, $(z_2,\sigma_2)=(2,\,672.887)$, midpoint $\sigma_m=2822.444$ against a true bound $\rho_{\min}e^{-1}=1829.097$. Here $2822.444 \ge 1829.097$: the midpoint satisfies the lower bound, as the epigraph argument said it must. This is not a coincidence of these two points — it is what "epigraph of a convex function" means for every pair.
:::

So the lower bound is already exactly convex, with no approximation needed for convexity's sake — and this module approximates it anyway. The reason is not convexity; it is problem *class*. $\sigma \ge \rho_{\min}e^{-z}$ is a perfectly good convex constraint, but it involves a bare exponential, which a second-order-cone solver has no representation for (that constraint lives in the exponential cone, a different and less commonly available cone requiring a different solver). Everything else in this problem — dynamics, thrust bound, glideslope, pointing — is a linear equality or a second-order cone. Replacing the exact exponential lower bound with a *quadratic* one keeps the entire problem inside the single cone type one solver handles, at the cost of a small, controllable approximation error instead of an exact result. The upper bound gets the simplest polynomial fix, a tangent line (affine, exact to first order); the lower bound gets one more term of the same Taylor expansion, both about a reference log-mass $z_0(t)$:

$$
\sigma \le \mu_2\big(1-(z-z_0)\big), \qquad \sigma \ge \mu_1\Big(1-(z-z_0)+\tfrac12(z-z_0)^2\Big), \qquad \mu_1 = \rho_{\min}e^{-z_0}, \quad \mu_2 = \rho_{\max}e^{-z_0}.
$$

The upper bound is now affine in $(z,\sigma)$ — a linear inequality, the simplest cone there is. The lower bound is a convex quadratic in $z$ minus an affine term in $\sigma$, still not a bare exponential, and (worked out below) representable exactly as a second-order cone. Both approximations are evaluated about a reference $z_0(t) = \ln\big(m_{\text{wet}} - \alpha\rho_{\max}t\big)$ — the mass history if the engine ran at full throttle from ignition, which bounds the true mass from below regardless of the actual throttle history, since running the engine any less hard leaves more propellant than that.

::: key Two different reasons for two different bounds
The upper throttle bound $\sigma\le\rho_{\max}e^{-z}$ is genuinely non-convex and needs a fix to be usable at all; a tangent-line affine bound is the simplest one. The lower throttle bound $\sigma\ge\rho_{\min}e^{-z}$ is already convex — an epigraph of a convex function — and gets a polynomial fix only so the whole problem stays a second-order cone program rather than needing an exponential-cone solver. Confusing these two reasons leads to solving the wrong problem: relaxing the lower bound "because it must be non-convex like the upper one" would throw away accuracy for no reason, since the exact version was usable all along.
:::

How much accuracy the approximation costs is not a question to answer by inspection — check it on a real solve.

::: example The approximation error along an actual optimal trajectory
Take the $9$-outer-iteration, $240.382\,\mathrm{kg}$ landing solve from the previous lesson and compare, at the *actual* solved $z_k$ (not the reference $z_0$), the exact exponential bound against the polynomial one the solver actually enforced:

| step $k$ | $z_k - z_{0,k}$ | upper: exact | upper: affine | conservative by | lower: exact | lower: quadratic | loose by |
| --- | --- | --- | --- | --- | --- | --- | --- |
| $0$ | $0.00000$ | $6.96063$ | $6.96063$ | $0.0000\%$ | $2.60997$ | $2.60997$ | $0.0000\%$ |
| $10$ | $0.00076$ | $7.42370$ | $7.42370$ | $0.0000\%$ | $2.78361$ | $2.78361$ | $0.0000\%$ |
| $17$ | $0.03125$ | $7.55700$ | $7.55323$ | $0.0499\%$ | $2.83359$ | $2.83361$ | $0.0005\%$ |
| $24$ | $0.06387$ | $7.69518$ | $7.67880$ | $0.2129\%$ | $2.88540$ | $2.88553$ | $0.0046\%$ |
| $29$ | $0.07434$ | $7.90905$ | $7.88609$ | $0.2904\%$ | $2.96560$ | $2.96581$ | $0.0072\%$ |

The affine upper bound is conservative — it understates the true acceleration ceiling by at most $0.29\%$ over this whole burn — which is a safe direction to be wrong in: the solver never claims authority the engine does not have. The quadratic lower bound is loose by at most $0.0072\%$, small enough that the vehicle's real throttle margin absorbs it without comment. Both errors grow with $|z-z_0|$, which is exactly why $z_0(t)$ is pinned to the worst-case (fastest-depleting) mass history: it keeps $|z - z_0|$ small for every trajectory that does not literally burn at maximum throttle the whole way, which is every fuel-optimal trajectory worth flying.
:::

## Assembling the second-order-cone standard form

Recall the standard form from the optimization module: minimise $\mathbf{c}^\top\mathbf{x}$ subject to $\|\mathbf{A}_i\mathbf{x}+\mathbf{b}_i\|_2 \le \mathbf{c}_i^\top\mathbf{x}+d_i$ for each cone and $\mathbf{F}\mathbf{x}=\mathbf{g}$ for the equalities. Every piece of the powered-descent problem now maps onto it directly. The decision vector $\mathbf{x}$ stacks $(\mathbf{r}_k,\mathbf{v}_k,z_k)$ at every node and $(\mathbf{u}_k,\sigma_k)$ at every step. The dynamics — now exactly linear, courtesy of this lesson's first section — are rows of $\mathbf{F}\mathbf{x}=\mathbf{g}$, along with the boundary conditions. The thrust bound $\|\mathbf{u}_k\|_2\le\sigma_k$ is a cone of dimension $4$ with $\mathbf{A}_i=\mathbf{I}_3$ (padded with a zero column for $\sigma_k$), $\mathbf{c}_i$ the indicator of $\sigma_k$. The upper mass bound is a linear inequality, a cone of dimension $1$ in disguise ($\mathbf{A}_i$ empty). The objective is linear: minimise $\sum_k\sigma_k\Delta t$.

The lower mass bound is the one piece that does not look like a cone on sight, and the optimization module's own identity for turning a quadratic into a cone handles it without any new machinery: $\|\mathbf{y}\|_2^2\le s \Leftrightarrow \|(2\mathbf{y},\,1-s)\|_2\le 1+s$. Write $y=\sqrt{\mu_1}\,(z-z_0)$ (so $\tfrac12\mu_1(z-z_0)^2 = \tfrac12y^2$) and $s = \sigma - \mu_1\big(1-(z-z_0)\big)$; the quadratic lower bound is exactly $\tfrac12y^2\le s$, i.e. $y^2\le 2s$, which the identity turns into $\|(2y,\,1-2s)\|_2\le 1+2s$ — a cone of dimension $3$ in the local variables $(z,\sigma)$. Multiplying out gives explicit standard-form data:

$$
\mathbf{A}_i = \begin{bmatrix}2\sqrt{\mu_1} & 0 \\ -2\mu_1 & -2\end{bmatrix},\quad \mathbf{b}_i=\begin{bmatrix}-2\sqrt{\mu_1}\,z_0\\ 1+2\mu_1(1+z_0)\end{bmatrix},\quad \mathbf{c}_i=\begin{bmatrix}2\mu_1\\2\end{bmatrix},\quad d_i = 1-2\mu_1(1+z_0).
$$

Checked against a random sample of $20{,}000$ points $(z,\sigma)$ spanning both sides of the boundary, this lifted cone agrees with the original quadratic inequality every single time — no mismatch, because it is an algebraic identity, not an approximation on top of the approximation already made. Checked at step $17$ of the worked trajectory above, where the solver's own solution sits almost exactly on the lower throttle boundary: the original quadratic form reports a slack of $8.4\times10^{-8}$, the lifted cone form reports $3.4\times10^{-7}$ — both at solver tolerance, both describing the same boundary point. (This module's own solver, built in the previous lesson, does not actually perform this lift — its barrier works directly on the quadratic — but a general-purpose conic solver that only accepts pure second-order-cone input needs exactly this transformation, and it is worth knowing the two are the same constraint before trusting either one.)

::: example Counting the pieces of the discretised problem
Discretise the $60\,\mathrm{s}$ Mars-lander descent from the previous two lessons into $N=30$ steps of $\Delta t=2\,\mathrm{s}$. The state $(\mathbf{r},\mathbf{v},z)$ at each of $N+1=31$ nodes is $7$ numbers; the control $(\mathbf{u},\sigma)$ at each of $30$ steps is $4$: $7\times31 + 4\times30 = 217+120=337$ decision variables. Dynamics contribute $7$ equality rows per step ($210$ total); boundary conditions on $\mathbf{r}_0,\mathbf{v}_0,z_0,\mathbf{r}_N,\mathbf{v}_N$ add $13$ more — $223$ equality rows altogether. Cones: one thrust bound and one upper-mass linear bound and one lower-mass quadratic-or-lifted-cone bound per step, $3\times30=90$ inequality blocks, none larger than dimension $4$. Every number in that count fixes a matrix shape a solver allocates once and never resizes — which is exactly the property the real-time implementation lesson, later in this module, builds a flight-software argument on.
:::

## Check yourself

::: check
Why can the upper mass bound safely be approximated by a tangent line that is always *below* the true exponential curve, while the previous lesson's thrust-bound relaxation had to come with a full proof that nothing was lost?
:::

::: answer
The two approximations trade off different things. The tangent-line upper bound is deliberately conservative: it forbids some acceleration the engine could truly deliver, and being conservative in the *safe* direction — never claiming more authority than the vehicle has — is acceptable as an engineering approximation whose size is checked and bounded, which the accuracy table does directly. The thrust-bound relaxation in the previous lesson is a different kind of claim: it *enlarges* the feasible set, including physically meaningless points like zero thrust, and if nothing forced the optimizer away from those points the answer would not be merely conservative, it would be wrong — not describing a flyable trajectory at all. That is why one needed a theorem about where the optimum lands and the other only needs an error bound.
:::

::: check
A colleague suggests skipping the lower-bound approximation entirely and just handing the solver the exact constraint $\sigma \ge \rho_{\min}e^{-z}$, since it is already convex. What would have to be true about the solver for that to work, and what do you lose by insisting on it?
:::

::: answer
It would work only with a solver that supports the exponential cone specifically — SCS or a general conic solver with an exponential-cone module, not a solver built only for the second-order cone the way this module's own barrier-method solver is. What is lost by insisting on it is exactly the uniformity this lesson's dimension count relies on: every other constraint in the problem is already a second-order cone or a linear inequality, so a solver specialised for those cone types (smaller, simpler, and the type the real-time-implementation lesson's code-generation argument targets) can handle the whole problem. Trading a well-understood, tiny, checked approximation error for a dependency on a less common cone type and a different solver family is rarely the better engineering trade, though it is a legitimate one to make consciously.
:::

::: check
In the round-trip example, $\Gamma = \|\mathbf{T}\|_2$ was assumed. Redo the forward conversion with $\Gamma = 9200\,\mathrm{N}$ instead (still $\mathbf{T}=(1200,-300,8700)\,\mathrm{N}$, $m=1650\,\mathrm{kg}$), and check whether $\|\mathbf{u}\|_2=\sigma$ still holds.
:::

::: answer
$\sigma = \Gamma/m = 9200/1650 = 5.57576\,\mathrm{m/s^2}$, while $\|\mathbf{u}\|_2$ is unchanged at $5.33712\,\mathrm{m/s^2}$ (it only depends on $\mathbf{T}$ and $m$, not on $\Gamma$). Now $\|\mathbf{u}\|_2 = 5.33712 < \sigma = 5.57576$: the point is strictly inside the cone, not on its boundary. This is exactly the "relaxed but not tight" case the previous lesson's theorem rules out *at the optimum* — it is a perfectly legal point of the relaxed feasible set (the cone constraint $\|\mathbf{u}\|\le\sigma$ only requires $\le$), it just is not the kind of point an optimal, cost-minimising trajectory would ever sit at, because paying for a $\Gamma$ larger than the thrust actually delivered wastes propellant for nothing.
:::

::: check
The dimension count found $337$ variables and $223$ equality rows for $N=30$. Without recomputing everything, say how each number changes if $N$ is doubled to $60$ at the same $\Delta t$ (so $t_f$ doubles too), and which one grows faster.
:::

::: answer
Variables: $7(N+1)+4N = 11N+7$, so at $N=60$ that is $667+7=674$ (exactly double the $N=30$ count of $337$ minus a small additive offset — precisely $674$ against $337$, just under double because of the $+7$). Equality rows: $7N+13$, giving $433$ at $N=60$ against $223$ at $N=30$ — again just under double. Both grow linearly in $N$ with almost the same slope ($11$ versus $7$ per step, both dominated by the $N$ term at any reasonable horizon), so neither noticeably outpaces the other; the count that actually matters for solve time is the number of cones, which is also linear in $N$ ($3$ per step here), and it is the *cost per iteration*, not this linear growth, that the real-time-implementation lesson later shows can scale far worse than linearly if the wrong linear-algebra structure is used.
:::

::: check
Verify that the point $(z,\sigma)=(z_0, \mu_1)$ — exactly at the reference log-mass — lies exactly on the boundary of both the original quadratic lower bound and the lifted cone form, using the formulas in this lesson.
:::

::: answer
At $z=z_0$, $z-z_0=0$, so the quadratic bound reads $\sigma \ge \mu_1(1-0+0) = \mu_1$: the point $\sigma=\mu_1$ sits exactly on the boundary, with slack zero. In the lifted form, $y=\sqrt{\mu_1}(z-z_0)=0$ and $s=\sigma-\mu_1(1-0)=\mu_1-\mu_1=0$, so the cone constraint reads $\|(0,\,1-0)\|_2 \le 1+0$, i.e. $1\le1$ — also exactly tight, with the same zero slack. The two forms agree at this point, as the algebraic identity behind the lift guarantees they must everywhere, not only here.
:::

## Summary

| Object | Statement |
| --- | --- |
| Change of variables | $\mathbf{u}=\mathbf{T}/m$, $\sigma=\Gamma/m$, $z=\ln m$: exact bijection for $m>0$, not a relaxation |
| Linearised dynamics | $\dot{\mathbf{v}}=\mathbf{u}+\mathbf{g}$, $\dot z=-\alpha\sigma$; thrust cone becomes $\|\mathbf{u}\|\le\sigma$, unchanged in shape |
| Throttle slab transformed | $\rho_{\min}e^{-z}\le\sigma\le\rho_{\max}e^{-z}$ |
| Upper bound | Non-convex (region below a convex graph); fixed with a tangent line, conservative, error $\lesssim0.3\%$ on the worked burn |
| Lower bound | Already convex (epigraph); approximated anyway to stay in the second-order cone rather than needing an exponential cone; error $\lesssim0.01\%$ |
| Reference log-mass | $z_0(t) = \ln(m_{\text{wet}}-\alpha\rho_{\max}t)$, the worst-case (fastest-depleting) mass history |
| Quadratic-as-cone | $\tfrac12y^2\le s \Leftrightarrow \|(2y,1-2s)\|_2\le1+2s$; verified against $20{,}000$ random points, zero mismatches |
| SOCP standard form | Minimise $\mathbf{c}^\top\mathbf{x}$ s.t. $\|\mathbf{A}_i\mathbf{x}+\mathbf{b}_i\|_2\le\mathbf{c}_i^\top\mathbf{x}+d_i$, $\mathbf{F}\mathbf{x}=\mathbf{g}$ |
| $N=30$ problem size | $337$ variables, $223$ equality rows, $90$ cone/linear blocks, none larger than dimension $4$ |

Every piece of the 3-DoF problem is now a genuine second-order cone program: linear dynamics, a losslessly-tight thrust cone, and convexified mass bounds, all in the standard form a solver reads. The next lesson puts that solver to work building G-FOLD — the two-stage guidance law that was actually flown — and uses it to map out how far the vehicle can divert.
