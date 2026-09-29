---
id: l02-lossless-convexification-thrust-bound
title: Lossless convexification of the thrust bound
minutes: 21
covers:
  - "Why the thrust magnitude constraint rho_min <= ||T|| <= rho_max is non-convex — the feasible set is an annulus with the origin removed"
  - "Lossless convexification: the slack variable Gamma with ||T|| <= Gamma and rho_min <= Gamma <= rho_max, and the proof sketch via the maximum principle that the relaxation is tight"
---

Picture a phone plan where you choose your data allowance each month and pay for the allowance, not for what you use. The plan has a rule: the smallest allowance on offer is 5 GB. You can use less than your allowance if you like — nobody stops you. Would a sensible person ever pick an allowance bigger than what they use? No. Every gigabyte of allowance you do not use is money thrown away. So at the best choice, usage and allowance match.

That little argument is the heart of this lesson. The previous lesson found that the engine's thrust band, $\rho_{\min}\le\|\mathbf{T}\|\le\rho_{\max}$, is shaped like a bagel, and a bagel is not convex. This lesson replaces the awkward rule with an easier one — a thrust "allowance" you pay for in propellant — and then proves that at the best trajectory the thrust always uses its whole allowance. The trick is called **lossless convexification**, and it is not a hack that happens to work. It is a theorem, with a hypothesis you can check and a conclusion you can verify on a computer to the last digit. By the end you will have done that on a real Mars-landing trajectory.

Take the name literally. "Lossless" does not mean "a good approximation". It means the easier, convex problem has *exactly* the same best cost as the original one, and its best solution, read back, obeys the original rule. Nothing is approximated. A rule is replaced by a looser one, and a proof shows the extra room is never used.

## The bagel, made precise

Fix the engine's throttle band, $0 < \rho_{\min} \le \rho_{\max}$ (read "rho min" and "rho max"). At a single instant, the allowed thrust vectors are

$$
S = \{\mathbf{T} \in \mathbb{R}^3 : \rho_{\min} \le \|\mathbf{T}\|_2 \le \rho_{\max}\}.
$$

Read the curly braces as "the set of all $\mathbf{T}$ such that". Split the rule in two.

- The upper bound alone, $\|\mathbf{T}\|_2 \le \rho_{\max}$, is a solid ball around the origin. A ball is convex.
- The lower bound alone, $\|\mathbf{T}\|_2 \ge \rho_{\min}$, is everything *outside* a smaller ball: all of space with a hole in the middle.

Together they make a thick hollow shell, a **[[spherical annulus|annulus-picture]]**. Now test convexity. Take any allowed $\mathbf{T}_1$ and its exact opposite $\mathbf{T}_2 = -\mathbf{T}_1$ — any radius in the band works, not only the edge. Their midpoint is $\tfrac12(\mathbf{T}_1 + \mathbf{T}_2) = \mathbf{0}$, and $\|\mathbf{0}\|_2 = 0 < \rho_{\min}$. A convex set must contain every segment between two of its points. This segment's midpoint is outside, so $S$ is not convex — for *every* positive $\rho_{\min}$, not only for the numbers in some example.

Now set $\rho_{\min} = 0$. The hole vanishes, $S$ becomes the solid ball, and it is convex. So the non-convexity is entirely the minimum-throttle floor. That is why the fix targets that one inequality and leaves the upper bound alone.

The floor is not a modeling nicety. A liquid rocket engine has a **[[minimum stable throttle|min-throttle]]**: below a certain chamber pressure, combustion can turn unstable or go out. And on most landers the engine cannot be shut down and relit in the middle of the landing burn. So $\rho_{\min} > 0$ is a hard fact about the hardware.

## The relaxation: a thrust allowance

Here is the phone-plan idea in symbols. Add a new unknown $\Gamma(t)$ — read "capital gamma" — one per instant. Think of it as the thrust allowance. Then rewrite the problem:

$$
\|\mathbf{T}\|_2 \le \Gamma, \qquad \rho_{\min} \le \Gamma \le \rho_{\max}, \qquad \dot m = -\alpha\Gamma, \qquad \text{cost} = \int_0^{t_f}\Gamma\,dt.
$$

Step by step, here is what changed:

1. The thrust may be *at most* the allowance: $\|\mathbf{T}\|_2 \le \Gamma$.
2. The throttle band now bounds the allowance, not the thrust: $\rho_{\min} \le \Gamma \le \rho_{\max}$.
3. Propellant burns according to the allowance: $\dot m = -\alpha\Gamma$. You pay for the allowance.
4. The cost adds up the allowance: $\int\Gamma\,dt$ replaces $\int\|\mathbf{T}\|_2\,dt$.

Every piece is now convex. $\|\mathbf{T}\|_2 \le \Gamma$ is a **[[second-order cone|soc-picture]]** in the pair $(\mathbf{T}, \Gamma)$ — the set of points where one number is at least the length of a vector, shaped like an ice-cream cone. $\rho_{\min} \le \Gamma \le \rho_{\max}$ is a plain interval, a slab. A cone cut by a slab is convex. No bagel anywhere.

::: key The lossless convexification slack
Introduce $\Gamma$ with $\|\mathbf{T}\| \le \Gamma$ and $\rho_{\min} \le \Gamma \le \rho_{\max}$, and use $\Gamma$ (not $\|\mathbf{T}\|$) in the mass dynamics and the cost. The pair $(\mathbf{T}, \Gamma)$ lives in a convex set.
:::

This is a **relaxation**: a new problem whose allowed set is bigger than the old one. A relaxation's best cost can only go down or stay the same, never up, because every old option is still available.

And the set really did grow. Which thrusts are now allowed, ignoring $\Gamma$? $\Gamma$ can be anywhere in $[\rho_{\min}, \rho_{\max}]$, and $\mathbf{T}$ only needs $\|\mathbf{T}\| \le \Gamma$. So any $\mathbf{T}$ in the whole solid ball $\|\mathbf{T}\| \le \rho_{\max}$ is allowed — including the hole. That looks like a disaster. An optimizer minimizing $\int\Gamma\,dt$ could set $\Gamma = \rho_{\min}$ while making $\mathbf{T}$ tiny. That would describe an engine billed for $\rho_{\min}$ while producing almost nothing, which no real engine can do.

::: example The relaxed set really is bigger
Take $\rho_{\min}=4972\,\mathrm{N}$ and $\rho_{\max}=13260\,\mathrm{N}$.

**Point 1:** $\mathbf{T}=(0,0,0)\,\mathrm{N}$ with $\Gamma = 6000\,\mathrm{N}$. Relaxed rules: $\|\mathbf{T}\| = 0 \le 6000$, and $4972 \le 6000 \le 13260$. Both hold, so the relaxed problem allows it. Original rule: $\|\mathbf{T}\| = 0 < 4972$. Not allowed. It describes an engine burning propellant at a $6000\,\mathrm{N}$ rate while pushing with nothing — unphysical.

**Point 2:** $\mathbf{T}=(0,0,6000)\,\mathrm{N}$ with $\Gamma=6000\,\mathrm{N}$. Relaxed rules: $\|\mathbf{T}\| = 6000 = \Gamma$, on the edge of the cone, fine. Original rule: $4972 \le 6000 \le 13260$, fine. Allowed by both.

The theorem's claim is that the optimizer, free to choose points like the first or the second, always ends up at points like the second.
:::

::: key What "lossless" claims, exactly
At the optimum of the relaxed problem, $\|\mathbf{T}(t)\|_2 = \Gamma(t)$ at all but a **[[measure-zero|almost-everywhere]]** set of instants. The relaxed optimum sits *on* the surface of the cone, so its $\mathbf{T}(t)$ obeys $\rho_{\min}\le\|\mathbf{T}\|\le\rho_{\max}$ after all. So the relaxed optimal cost equals the true, non-convex optimal cost, and the relaxed optimal trajectory *is* the original optimal trajectory. This is a statement about the optimum, not something you could see from the constraint set alone.
:::

## Why it is exact

First the plain version, the phone plan again. You pay propellant for $\Gamma$, not for $\|\mathbf{T}\|$. So if at some stretch of the flight $\|\mathbf{T}\| < \Gamma$, you are paying for thrust you do not use. Either you could lower $\Gamma$ and save propellant, or — when $\Gamma$ is already at the floor $\rho_{\min}$ — you could push harder in a useful direction for free, since you are paying for it anyway. An optimum cannot leave free improvement on the table. The one way this can fail is if *no* direction is useful at all, and a condition called controllability rules that out.

::: key Why the relaxation is tight
Mass depletion is driven by $\Gamma$ and the cost is strictly increasing in propellant, so an arc with $\|\mathbf{T}\| < \Gamma$ could be improved by lowering $\Gamma$. The maximum principle forbids that at an optimum, so $\|\mathbf{T}\| = \Gamma$ almost everywhere. Requires controllability of the linearized dynamics.
:::

Now the careful version, using **[[Pontryagin's minimum principle|pontryagin]]** from the trajectory optimization module. It says the optimal controls make the Hamiltonian $H$ as small as possible at every instant.

**Step 1: write the Hamiltonian.** Give each state a costate: $\boldsymbol{\lambda}_r$, $\boldsymbol{\lambda}_v$, $\lambda_m$ for $\mathbf{r}$, $\mathbf{v}$, $m$ (read $\lambda$ as "lambda"). The running cost is $\Gamma$, and the dynamics are $\dot{\mathbf{r}}=\mathbf{v}$, $\dot{\mathbf{v}}=\mathbf{T}/m+\mathbf{g}$, $\dot m = -\alpha\Gamma$. So

$$
H = \Gamma + \boldsymbol{\lambda}_r\!\cdot\!\mathbf{v} + \boldsymbol{\lambda}_v\!\cdot\!\left(\frac{\mathbf{T}}{m} + \mathbf{g}\right) - \alpha\lambda_m\Gamma = \Gamma\big(1 - \alpha\lambda_m\big) + \frac{1}{m}\boldsymbol{\lambda}_v\!\cdot\!\mathbf{T} + \boldsymbol{\lambda}_r\!\cdot\!\mathbf{v} + \boldsymbol{\lambda}_v\!\cdot\!\mathbf{g}.
$$

The second form groups the $\Gamma$ terms together and the $\mathbf{T}$ term alone.

**Step 2: minimize over $\mathbf{T}$, holding $\Gamma$ fixed.** The only part with $\mathbf{T}$ is $\boldsymbol{\lambda}_v\!\cdot\!\mathbf{T}/m$, a straight-line (linear) function of $\mathbf{T}$. We minimize it over the ball $\|\mathbf{T}\|_2 \le \Gamma$. A linear function on a ball is smallest on the boundary, in the direction opposite its gradient — never inside, unless the gradient is zero. So whenever $\boldsymbol{\lambda}_v \ne \mathbf{0}$,

$$
\mathbf{T}^\star = -\Gamma\,\frac{\boldsymbol{\lambda}_v}{\|\boldsymbol{\lambda}_v\|_2}, \qquad \|\mathbf{T}^\star\|_2 = \Gamma.
$$

Tightness at that instant comes for free, straight out of minimizing a linear function on a ball. (The star, read "T star", marks the optimal value.)

**Step 3: minimize over $\Gamma$.** Put $\mathbf{T}^\star$ back into $H$. The $\mathbf{T}$ term becomes $-\Gamma\|\boldsymbol{\lambda}_v\|_2/m$, so

$$
H^\star(\Gamma) = \Gamma\Big(1 - \alpha\lambda_m - \frac{\|\boldsymbol{\lambda}_v\|_2}{m}\Big) + (\text{terms without } \Gamma).
$$

That is linear in $\Gamma$ too. Minimizing over $[\rho_{\min}, \rho_{\max}]$ again picks an end: $\Gamma^\star = \rho_{\min}$ where the bracket is positive, $\Gamma^\star = \rho_{\max}$ where it is negative. The exception would be a stretch where the bracket is zero for a while — a **singular arc**. It does not occur for this problem under the controllability condition, and the worked example below shows the bang-bang pattern this predicts instead.

**Step 4: can $\boldsymbol{\lambda}_v$ be zero for a while?** Everything hangs on this, and the costate equations answer it. For this basic problem, the only place $\mathbf{r}$ or $\mathbf{v}$ appears in $H$ is $\boldsymbol{\lambda}_r\!\cdot\!\mathbf{v}$. (A glideslope or keep-out constraint would change that.) So

$$
\dot{\boldsymbol{\lambda}}_r = -\frac{\partial H}{\partial \mathbf{r}} = \mathbf{0}, \qquad \dot{\boldsymbol{\lambda}}_v = -\frac{\partial H}{\partial \mathbf{v}} = -\boldsymbol{\lambda}_r.
$$

The first says $\boldsymbol{\lambda}_r$ is constant. The second then says

$$
\boldsymbol{\lambda}_v(t) = \boldsymbol{\lambda}_v(0) - \boldsymbol{\lambda}_r\,t,
$$

a straight line in time, component by component. A straight line that is not identically zero crosses zero at most once. So $\boldsymbol{\lambda}_v(t)$ either vanishes at a single instant — which changes nothing — or it is zero the whole time. The second case needs $\boldsymbol{\lambda}_r = \mathbf{0}$ and $\boldsymbol{\lambda}_v(0) = \mathbf{0}$ together.

**Step 5: rule out the all-zero case.** This is the one place the argument leans on a hypothesis. A standard **[[controllability|controllability]]** condition on the linearized translational dynamics — thrust can push in three independent directions, moving all three position coordinates, which a real lander can — excludes it. It works through the minimum principle's rule that the costates cannot all vanish together on a genuine optimal trajectory. With that, $\boldsymbol{\lambda}_v(t) \ne \mathbf{0}$ except at one instant at most, and $\|\mathbf{T}^\star(t)\|_2 = \Gamma^\star(t)$ almost everywhere. The relaxation is lossless.

::: warning Lossless is a proof about this constraint, not a license to relax things
It is easy to walk away thinking any awkward constraint can be relaxed and will turn out fine. It will not. The argument used three specific facts: the slack enters the *cost* in a way that rewards shrinking it, the control it bounds enters the Hamiltonian *linearly*, and the costate can be shown not to vanish on an interval. Change any one and the guarantee is gone. Relax a keep-out zone around a piece of ground equipment and the relaxed trajectory will fly straight through the equipment, because nothing in the cost discourages it. Every relaxation in this module earns its place with an argument of this shape, for that specific constraint. "We relaxed it and it seemed fine in testing" is exactly the unproven claim the previous lesson's certification argument refuses.
:::

## Checking it on a real trajectory

A theorem earns trust by surviving contact with numbers. To solve the problem we need one result the next lesson derives in full. Divide through by mass and substitute $\mathbf{u} = \mathbf{T}/m$, $\sigma = \Gamma/m$ (read "sigma") and $z = \ln m$. Then the dynamics become linear, and the throttle band becomes a pair of bounds on $\sigma$ that stay convex once expanded about a reference mass history. The tightness argument is untouched, because dividing $\|\mathbf{T}\|\le\Gamma$ by the same positive $m$ gives $\|\mathbf{u}\|\le\sigma$: the identical cone.

::: example Bang–coast–bang on a 1905 kg Mars lander, with sigma = ||u|| checked at every step
Use the lander from the previous lesson — $\rho_{\min}=4972\,\mathrm{N}$, $\rho_{\max}=13260\,\mathrm{N}$, $I_{sp}=225\,\mathrm{s}$, $g=3.7114\,\mathrm{m/s^2}$. Start at $\mathbf{r}_0=(1200,400,1500)\,\mathrm{m}$ with $\mathbf{v}_0=(-40,10,-70)\,\mathrm{m/s}$, and land at rest at the origin. Chop the flight into $N=30$ steps of $\Delta t = 2\,\mathrm{s}$, so $t_f = 60\,\mathrm{s}$.

**Step 1: solve.** Use a barrier-method interior-point solver, the same idea the optimization module built for linear inequalities, with the cone barrier $-\log(\sigma^2 - \|\mathbf{u}\|^2)$ added. It stops after $11$ outer rounds with a duality gap near $10^{-8}$. The vehicle lands at $\mathbf{r}(t_f)=\mathbf{0}$, $\mathbf{v}(t_f)=\mathbf{0}$ to rounding error, burning $240.382\,\mathrm{kg}$ of propellant.

**Step 2: compare $\sigma_k$ with $\|\mathbf{u}_k\|$ at every step.** Here are eight of the thirty:

| step $k$ | $t\,(\mathrm{s})$ | throttle $\Gamma_k/\rho_{\max}$ | $\sigma_k\,(\mathrm{m/s^2})$ | $\|\mathbf{u}_k\|\,(\mathrm{m/s^2})$ | $\sigma_k - \|\mathbf{u}_k\|$ |
| --- | --- | --- | --- | --- | --- |
| $0$ | $0$ | $100.0\%$ | $6.960630$ | $6.960630$ | $4.9\times10^{-11}$ |
| $8$ | $16$ | $100.0\%$ | $7.329380$ | $7.329380$ | $5.0\times10^{-11}$ |
| $9$ | $18$ | $91.9\%$ | $6.777727$ | $6.777727$ | $5.0\times10^{-11}$ |
| $10$ | $20$ | $37.5\%$ | $2.783608$ | $2.783608$ | $5.0\times10^{-11}$ |
| $17$ | $34$ | $37.5\%$ | $2.833606$ | $2.833606$ | $5.0\times10^{-11}$ |
| $24$ | $48$ | $37.5\%$ | $2.885532$ | $2.885532$ | $5.0\times10^{-11}$ |
| $25$ | $50$ | $52.2\%$ | $4.030575$ | $4.030575$ | $5.0\times10^{-11}$ |
| $29$ | $58$ | $99.7\%$ | $7.886087$ | $7.886087$ | $5.0\times10^{-11}$ |

Every gap, at all thirty steps, is at most $5.0\times10^{-11}$ — the solver's own tolerance, not merely "small". The relaxed solution never uses the room the relaxation opened.

**Step 3: read the throttle column.** Full throttle for the first nine steps, braking hard against the approach speed. Then fifteen steps at exactly $37.5\% = 4972/13260 = \rho_{\min}/\rho_{\max}$: minimum throttle, the non-convex floor itself. Then back to nearly full throttle for the final braking. Two switches, **[[bang–coast–bang|bang-coast-bang]]**, just as a bracket linear in $\Gamma$ predicts when its sign flips twice. Steps $9$ and $25$ show in-between values only because each switch falls partway through a $2\,\mathrm{s}$ step. The final $99.7\%$ rather than $100\%$ comes from the slightly cautious upper mass bound of the next lesson.

**Step 4: check the floor in newtons.** At step $17$ the mass is $m_{17} = 1754.66\,\mathrm{kg}$, so $\Gamma_{17} = \sigma_{17}m_{17} = 2.833606 \times 1754.66 = 4972.0\,\mathrm{N}$ — the engine's minimum stable thrust, to five figures. (The exact value is $4972.03\,\mathrm{N}$, a hair above the floor for the same cautious-approximation reason.) The solver was never told "thrust must be at least $4972\,\mathrm{N}$" in that form, and it found the floor anyway.

**Step 5: sanity check.** During the "coast" the vehicle weighs between about $6400$ and $6630\,\mathrm{N}$ on Mars (its mass times $3.7114\,\mathrm{m/s^2}$), more than the $4972\,\mathrm{N}$ of minimum thrust. So it is gently falling faster while the engine idles, trading altitude for propellant, which is what a fuel-saving descent should do while there is height to spare.
:::

This is what "the relaxed solution lands on the boundary" means in practice: not roughly zero, but at the solver's own tolerance at every node of a real trajectory — including the fifteen nodes where the true non-convex constraint is *active*, which is exactly where a relaxation would fail if it were going to.

## Check yourself

::: check
Someone proposes dropping the lower bound entirely: solve with only $\|\mathbf{T}\|\le\rho_{\max}$, then clip any thrust below $\rho_{\min}$ up to $\rho_{\min}$ afterward. Why is this different from, and worse than, lossless convexification?
:::

::: answer
Dropping the lower bound is also a relaxation — the allowed set grows the same way. But nothing in that problem's cost gives the optimizer any reason to avoid the hole, so the unclipped answer will usually have long stretches with $\mathbf{T}$ well inside it. Clipping afterward is a patch: it changes $\mathbf{T}$ without re-running the dynamics for $\mathbf{r}$, $\mathbf{v}$, $m$, so the patched trajectory generally misses the target and is optimal for nothing in particular. Lossless convexification instead keeps the slack $\Gamma$ inside the cost and the mass dynamics. That is the mechanism that drives $\Gamma$ down to $\|\mathbf{T}\|$ at the optimum. The fix lives in the formulation, not after the solve.
:::

::: check
In the argument, minimizing $H$ over $\mathbf{T}$ on the ball $\|\mathbf{T}\|\le\Gamma$ gave $\|\mathbf{T}^\star\| = \Gamma$ "for free". What property of $H$ made that work, and what would break it?
:::

::: answer
$H$ is *linear* in $\mathbf{T}$: the only $\mathbf{T}$ term is $\boldsymbol{\lambda}_v\!\cdot\!\mathbf{T}/m$. A linear function over a ball is smallest on the boundary, because moving outward in the direction that lowers it keeps lowering it until you hit the edge. It would break if some term in $H$ depended on $\mathbf{T}$ in a curved way — for example a quadratic penalty on $\|\mathbf{T}\|$ added to discourage big swings, or a plume effect on drag that depends on thrust. Then $H$ could be smallest somewhere inside the ball, and tightness would no longer follow from this argument.
:::

::: check
For the basic problem, $\boldsymbol{\lambda}_v(t)$ is a straight line in time. Why would adding a glideslope constraint $\|\mathbf{E}\mathbf{r}\|_2 \le \mathbf{r}\!\cdot\!\hat{\mathbf{e}}\tan\gamma$ (keep the vehicle above an upside-down cone over the pad) change that, and what would you need to re-check?
:::

::: answer
While the glideslope is active, it adds an $\mathbf{r}$-dependent term to the Hamiltonian (through its multiplier). Then $\dot{\boldsymbol{\lambda}}_r = -\partial H/\partial\mathbf{r}$ is no longer zero on those stretches, so $\boldsymbol{\lambda}_r$ is not constant, and $\boldsymbol{\lambda}_v$ — its integral — is no longer a straight line. "A straight line crosses zero at most once" no longer applies there. That does not automatically break tightness: Step 2 never used the *shape* of $\boldsymbol{\lambda}_v(t)$, only that it is not zero over an interval. But that fact now has to be re-derived arc by arc instead of read off a straight line. Lesson five takes up the cone constraints directly.
:::

::: check
The worked example switches exactly twice. If a colleague's solve of a similar problem showed the throttle flipping between minimum and maximum many times, what would you suspect first?
:::

::: answer
Not the theorem — lossless convexification says nothing about how many times the switching bracket changes sign, so in principle it allows many switches. Suspect the discretization or the solve first. A coarse time grid can turn a smooth switching function into apparent chattering. A solve that has not reached a small duality gap can leave $\sigma$ wandering near the boundary without settling there. And a poor reference mass history can distort the convexified throttle bounds enough to create false switches late in the burn. The checks: compute $\sigma-\|\mathbf{u}\|$ at every node, as this lesson did, then refine the time grid and re-solve. A well-converged solution of this problem class is bang-bang with few switches, because the switching function behind it is close to a straight line.
:::

::: check
Show that $\phi(\mathbf{u},\sigma) = -\log(\sigma^2 - \|\mathbf{u}\|_2^2)$, the cone barrier in the worked example's solver, is defined only strictly inside the cone. What does it do as a point approaches the cone's edge from inside, and why is that what an interior-point method wants?
:::

::: answer
A logarithm needs a positive argument, so $\phi$ needs $\sigma^2 - \|\mathbf{u}\|_2^2 > 0$. With $\sigma > 0$, that is $\|\mathbf{u}\|_2 < \sigma$ strictly: $\phi$ is undefined on the edge $\|\mathbf{u}\|=\sigma$ and outside it. As a point moves toward the edge from inside, $\sigma^2-\|\mathbf{u}\|^2$ shrinks toward $0$, its logarithm heads to $-\infty$, and $\phi$ heads to $+\infty$. The barrier builds an infinitely high wall just inside the constraint, so the iterates can never cross it and no separate feasibility check is needed. Notice the optimum sits exactly *on* the edge, where $\phi$ cannot be evaluated. The solver only approaches it as the barrier weight shrinks, which is why it reports $\sigma_k-\|\mathbf{u}_k\|$ at the level of its tolerance ($5\times10^{-11}$ here) rather than exactly zero.
:::

## Summary

| Idea | Statement |
| --- | --- |
| The bagel | $\{\mathbf{T} : \rho_{\min}\le\|\mathbf{T}\|\le\rho_{\max}\}$ is non-convex for any $\rho_{\min}>0$: opposite points have an infeasible midpoint |
| The relaxation | Slack $\Gamma$: $\|\mathbf{T}\|\le\Gamma$, $\rho_{\min}\le\Gamma\le\rho_{\max}$; $\Gamma$ (not $\|\mathbf{T}\|$) in $\dot m$ and in the cost |
| Lossless means | The relaxed optimum has $\|\mathbf{T}(t)\|=\Gamma(t)$ almost everywhere, so it is feasible and optimal for the original problem |
| The argument | $H$ linear in $\mathbf{T}$ on a ball $\Rightarrow \|\mathbf{T}^\star\|=\Gamma^\star$ unless $\boldsymbol{\lambda}_v=\mathbf{0}$; $\boldsymbol{\lambda}_v(t)$ is a straight line in time, and controllability rules out the all-zero case |
| Bang-bang | $H^\star$ linear in $\Gamma$ $\Rightarrow$ $\Gamma^\star\in\{\rho_{\min},\rho_{\max}\}$ except on a singular arc; seen as bang–coast–bang |
| Worked lander | $N=30$, $\Delta t=2\,\mathrm{s}$: propellant $240.382\,\mathrm{kg}$; $\sigma_k-\|\mathbf{u}_k\|\le5.0\times10^{-11}$ at every node |
| Floor recovered | Minimum-throttle arc at $\Gamma = 4972.0\,\mathrm{N} = \rho_{\min}$, never imposed in that form |
| Not a general license | The proof used linearity in the control and the sign of the cost; a keep-out zone needs its own argument or stays an approximation |

The next lesson earns the substitution this one borrowed. It derives $\mathbf{u}=\mathbf{T}/m$, $\sigma=\Gamma/m$, $z=\ln m$, shows exactly why the throttle bounds in $(\sigma, z)$ stay convex, and assembles everything into the second-order-cone form a solver reads.

::: context annulus-picture The bagel, drawn to scale
A slice through the allowed thrusts, with the inner radius $37.5\%$ of the outer ($4972/13260$). The two dots are allowed thrusts pointing in opposite directions at minimum throttle. Their average, the red dot, sits in the hole.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <path d="M180,20 A80,80 0 1,1 179.9,20 Z M180,70 A30,30 0 1,0 180.1,70 Z" fill="#8fb8f0" fill-rule="evenodd" stroke="#1d6fd1" stroke-width="1.5"/>
  <circle cx="150" cy="100" r="5" fill="#1f2a44"/>
  <circle cx="210" cy="100" r="5" fill="#1f2a44"/>
  <line x1="150" y1="100" x2="210" y2="100" stroke="#1f2a44" stroke-width="1" stroke-dasharray="4 3"/>
  <circle cx="180" cy="100" r="5" fill="#b4232c"/>
  <text x="180" y="124" font-size="11" text-anchor="middle" fill="#b4232c">average: 0 N</text>
  <line x1="180" y1="100" x2="236.6" y2="43.4" stroke="#6c7a93" stroke-width="1"/>
  <text x="262" y="40" font-size="11" fill="#1f2a44">13260 N</text>
  <text x="20" y="100" font-size="11" fill="#1f2a44">hole: below</text>
  <text x="20" y="114" font-size="11" fill="#1f2a44">4972 N</text>
</svg>
```
:::

::: context min-throttle Why engines have a floor
An engine's thrust comes from burning propellant in a chamber at high pressure. Throttle down and the chamber pressure drops. Below some point the flame can start to oscillate with the plumbing — a dangerous kind of instability — or cool enough to go out. Relighting a big engine in flight is hard, and during a landing burn there is no time for it. That is why a lander treats "at least $\rho_{\min}$ whenever running" as a law, and why deep-throttling engines, like the Apollo lunar module's descent engine, were a hard engineering achievement.
:::

::: context soc-picture The cone and the slab
Here thrust is squashed to one axis across and the allowance $\Gamma$ runs up. The relaxed rules allow the whole shaded trapezoid: inside the cone $|T|\le\Gamma$, between the two throttle lines. The original bagel is only the two thick slanted edges, where $|T| = \Gamma$. The theorem says the optimum always lies on those edges.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="170" x2="330" y2="170" stroke="#1f2a44" stroke-width="1"/>
  <line x1="180" y1="175" x2="180" y2="25" stroke="#1f2a44" stroke-width="1"/>
  <text x="325" y="185" font-size="12" text-anchor="end" fill="#1f2a44">thrust T</text>
  <text x="186" y="30" font-size="12" fill="#1f2a44">Γ</text>
  <line x1="180" y1="170" x2="60" y2="50" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="180" y1="170" x2="300" y2="50" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <path d="M135,125 L225,125 L300,50 L60,50 Z" fill="#8fb8f0" stroke="none"/>
  <line x1="135" y1="125" x2="60" y2="50" stroke="#1d6fd1" stroke-width="4"/>
  <line x1="225" y1="125" x2="300" y2="50" stroke="#1d6fd1" stroke-width="4"/>
  <line x1="135" y1="125" x2="225" y2="125" stroke="#6c7a93" stroke-width="1"/>
  <line x1="60" y1="50" x2="300" y2="50" stroke="#6c7a93" stroke-width="1"/>
  <text x="306" y="54" font-size="11" fill="#1f2a44">Γ = ρmax</text>
  <text x="232" y="138" font-size="11" fill="#1f2a44">Γ = ρmin</text>
  <text x="180" y="95" font-size="11" text-anchor="middle" fill="#1f2a44">relaxed room</text>
  <text x="30" y="40" font-size="11" fill="#1d6fd1">optimum lives on |T| = Γ</text>
</svg>
```
:::

::: context almost-everywhere What "almost everywhere" allows
A set of instants has **measure zero** when its total length is zero: a single moment, or a handful of separate moments. "$\|\mathbf{T}\| = \Gamma$ almost everywhere" allows the equality to fail at such isolated instants — for example the one moment when $\boldsymbol{\lambda}_v$ passes through zero. That cannot change the trajectory or the propellant used, because an integral does not notice what happens on a set of zero length.
:::

::: context pontryagin The minimum principle and its author
Lev Pontryagin, a Soviet mathematician who had been blind since a stove accident at age 14, led the group that published the maximum principle in the late 1950s. It says that along an optimal trajectory, the control at each instant minimizes (or, in their sign convention, maximizes) the Hamiltonian. That is why the same result goes by both names. Lossless convexification uses it only as a tool for the proof; the solver itself never computes a costate.
:::

::: context controllability What controllability buys here
A system is **controllable** when its controls can steer the state anywhere, given time. For the lander, thrust can point in any direction in three dimensions and so can change all three velocity components, which in turn move all three position components. That rules out the strange case where every costate is zero, which would mean no push in any direction helps the cost. A vehicle that could only thrust in one fixed direction would not be controllable in this sense, and the proof would need a different argument.
:::

::: context bang-coast-bang The whole throttle history
All thirty throttle settings from the worked example, drawn to scale over $60\,\mathrm{s}$: full, the minimum-throttle arc at $37.5\%$, then full again. The in-between steps at $18\,\mathrm{s}$ and $50\,\mathrm{s}$ are the switches landing partway through a $2\,\mathrm{s}$ step.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="150" x2="340" y2="150" stroke="#1f2a44" stroke-width="1"/>
  <line x1="40" y1="150" x2="40" y2="20" stroke="#1f2a44" stroke-width="1"/>
  <line x1="40" y1="105" x2="340" y2="105" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <polyline points="40,30 130,30 130,39.8 140,39.8 140,105 290,105 290,87.3 300,87.3 300,30.3 340,30.3" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="34" y="34" font-size="11" text-anchor="end" fill="#1f2a44">100%</text>
  <text x="34" y="109" font-size="11" text-anchor="end" fill="#1f2a44">37.5%</text>
  <text x="34" y="154" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <text x="40" y="166" font-size="11" text-anchor="middle" fill="#1f2a44">0 s</text>
  <text x="340" y="166" font-size="11" text-anchor="middle" fill="#1f2a44">60 s</text>
  <text x="215" y="98" font-size="11" text-anchor="middle" fill="#1f2a44">minimum throttle</text>
</svg>
```
:::
