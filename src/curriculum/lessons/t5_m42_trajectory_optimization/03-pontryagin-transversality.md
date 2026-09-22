---
id: l03-pontryagin-transversality
title: "Pontryagin's Minimum Principle: why minimise, and transversality in full"
minutes: 18
covers:
  - "Pontryagin's Minimum Principle, the stationarity condition, and transversality conditions"
---

The previous lesson derived stationarity, $\partial H/\partial\mathbf{u}=\mathbf{0}$, from a variation that assumed $\mathbf{u}$ was free to move in any direction. Every real actuator disagrees: a thruster saturates, a gimbal stops at a mechanical limit, a throttle cannot go negative. The optimal control module's lesson on the Hamiltonian and the minimum principle stated, as a theorem, the fix for that — the optimal control does not merely make $H$ stationary, it **minimises $H$ over the whole admissible set** $\mathcal{U}$, a statement that remains meaningful exactly where stationarity goes silent: on a boundary, where no interior direction of $\delta\mathbf{u}$ exists to set a derivative to zero against.

This lesson does three things with that theorem rather than re-deriving it wholesale. It shows, with the needle-shaped perturbation that is the actual mechanism behind the result, why minimising rather than merely stationarising is forced on you the moment $\mathcal{U}$ has an edge. It sharpens stationarity itself with the second-order check that tells you whether a stationary point is a minimum at all — a gap the earlier treatment left open. And it completes the transversality conditions of the previous lesson with the one ingredient a fixed target never needed: a target that moves.

## Recall, briefly

::: key Pontryagin's Minimum Principle
Along an optimal trajectory, $\mathbf{u}^\star(t) = \operatorname*{argmin}_{\mathbf{v}\in\mathcal{U}} H(\mathbf{x}^\star(t),\mathbf{v},\boldsymbol\lambda^\star(t),t)$ for every $t$, with $H=L+\boldsymbol\lambda^\top\mathbf{f}$, $\dot{\mathbf{x}}^\star=\partial H/\partial\boldsymbol\lambda$, $\dot{\boldsymbol\lambda}^\star=-\partial H/\partial\mathbf{x}$. It is strictly stronger than $\partial H/\partial\mathbf{u}=\mathbf{0}$: the minimum condition holds even when $\mathbf{u}^\star$ sits on the boundary of $\mathcal{U}$, where the gradient of $H$ need not vanish.
:::

## Why minimise, not stationarise: the needle variation

Fix an interior instant $\tau\in(t_0,t_f)$ and a short duration $\varepsilon>0$. Instead of perturbing the control smoothly everywhere, as the previous lesson's variation did, replace it on the single narrow interval $[\tau,\tau+\varepsilon]$ with an arbitrary constant admissible value $\mathbf{v}\in\mathcal{U}$ — a **needle variation** — leaving $\mathbf{u}^\star$ untouched everywhere else. This is the one variation that still makes sense when $\mathcal{U}$ has edges: $\mathbf{v}$ can be any admissible point, including a vertex of a box, with no requirement that it be close to $\mathbf{u}^\star(\tau)$.

Two effects follow, both first-order in $\varepsilon$. First, using the alternate control for a duration $\varepsilon$ moves the state, at $t=\tau+\varepsilon$, away from where it would otherwise have been by approximately

$$
\delta\mathbf{x}(\tau+\varepsilon) \approx \varepsilon\Big[\mathbf{f}\big(\mathbf{x}^\star(\tau),\mathbf{v},\tau\big) - \mathbf{f}\big(\mathbf{x}^\star(\tau),\mathbf{u}^\star(\tau),\tau\big)\Big],
$$

the difference in velocity vectors, integrated over the short window. Second, the running cost accrued during that window differs by $\varepsilon\big[L(\mathbf{x}^\star(\tau),\mathbf{v},\tau) - L(\mathbf{x}^\star(\tau),\mathbf{u}^\star(\tau),\tau)\big]$, directly.

After $\tau+\varepsilon$, the control returns to $\mathbf{u}^\star$, and the state perturbation $\delta\mathbf{x}$ propagates forward under the ordinary (unperturbed) dynamics. The shadow-price identity of the previous lesson — $\partial J^\star/\partial\mathbf{x}_0 = \boldsymbol\lambda(t_0)$ — was derived for a perturbation at $t_0$, but nothing in that derivation used $t_0$ specifically: the same argument, applied to the sub-problem that begins at $\tau+\varepsilon$ instead of $t_0$, prices *any* state perturbation at *any* instant by the costate at that instant. So the propagated effect of $\delta\mathbf{x}(\tau+\varepsilon)$ on the total cost is $\boldsymbol\lambda(\tau+\varepsilon)^\top\delta\mathbf{x}(\tau+\varepsilon) \approx \boldsymbol\lambda(\tau)^\top\delta\mathbf{x}(\tau+\varepsilon)$ to leading order.

Adding the direct cost of the window itself to its propagated consequence,

$$
\delta J \approx \varepsilon\Big[L(\mathbf{x}^\star,\mathbf{v},\tau) + \boldsymbol\lambda(\tau)^\top\mathbf{f}(\mathbf{x}^\star,\mathbf{v},\tau)\Big] - \varepsilon\Big[L(\mathbf{x}^\star,\mathbf{u}^\star,\tau) + \boldsymbol\lambda(\tau)^\top\mathbf{f}(\mathbf{x}^\star,\mathbf{u}^\star,\tau)\Big] = \varepsilon\Big[H(\mathbf{x}^\star,\mathbf{v},\boldsymbol\lambda,\tau) - H(\mathbf{x}^\star,\mathbf{u}^\star,\boldsymbol\lambda,\tau)\Big].
$$

Optimality of $\mathbf{u}^\star$ demands $\delta J \ge 0$ for this variation, for *every* admissible $\mathbf{v}$ and every $\tau$ — a smaller $H$ would mean the needle variation strictly reduces cost, contradicting optimality. That is exactly $H(\mathbf{x}^\star,\mathbf{v},\boldsymbol\lambda,\tau) \ge H(\mathbf{x}^\star,\mathbf{u}^\star,\boldsymbol\lambda,\tau)$ for every $\mathbf{v}\in\mathcal{U}$: the minimum principle. Notice what made it work where the smooth variation failed — $\mathbf{v}$ never had to be close to $\mathbf{u}^\star(\tau)$, so the argument reaches every corner of $\mathcal{U}$, not just an infinitesimal neighbourhood of the current control. This sketch captures the mechanism; the fully rigorous version has to handle several needles at once and take a convexified limit as $\varepsilon\to0$, which is genuinely more delicate and is where Pontryagin's original proof earns its name, but the one-needle argument above is the entire idea.

## Stationarity is necessary but not sufficient

Even where $\mathbf{u}^\star$ is interior and $\partial H/\partial\mathbf{u}=\mathbf{0}$ holds, stationarity alone does not certify a minimum — it is satisfied just as well by a maximum or a saddle. The second-order term the first-order condition ignores is the **Hessian of $H$ with respect to $\mathbf{u}$**, and the minimum principle demands

$$
\frac{\partial^2 H}{\partial\mathbf{u}^2} \succeq \mathbf{0}
$$

at the candidate optimum — the Legendre-Clebsch necessary condition. For LQR, $H = \tfrac12(\mathbf{x}^\top\mathbf{Q}\mathbf{x}+\mathbf{u}^\top\mathbf{R}\mathbf{u})+\boldsymbol\lambda^\top(\mathbf{A}\mathbf{x}+\mathbf{B}\mathbf{u})$ gives $\partial^2H/\partial\mathbf{u}^2 = \mathbf{R}$, and $\mathbf{R}\succ0$ is exactly the condition the optimal control module imposed on the cost from the start — not an arbitrary modelling choice, but the algebraic requirement for the stationary point $\mathbf{u}^\star=-\mathbf{R}^{-1}\mathbf{B}^\top\boldsymbol\lambda$ to be a minimum of $H$ rather than a maximum or saddle.

::: example A sign error that stationarity does not catch
Suppose a control-effort term is coded with the wrong sign — $L = \mathbf{x}^\top\mathbf{x} - c\,u^2$ for a scalar control and $c>0$, instead of the intended $L=\mathbf{x}^\top\mathbf{x}+c\,u^2$. With $H = \mathbf{x}^\top\mathbf{x}-cu^2+\lambda^\top(\mathbf{A}\mathbf{x}+\mathbf{b}u)$, stationarity gives $\partial H/\partial u = -2cu+\mathbf{b}^\top\boldsymbol\lambda=0$, so $u^\star = \mathbf{b}^\top\boldsymbol\lambda/(2c)$ — a perfectly well-defined number that a solver will report without complaint. But $\partial^2H/\partial u^2 = -2c < 0$: the stationary point is a *maximum* of $H$ in $u$, not a minimum, and the minimum principle is violated everywhere except at that single point. An unbounded control problem posed this way has no minimiser at all — $H\to-\infty$ as $|u|\to\infty$ — and a bounded one is solved by driving $u$ to whichever bound of $\mathcal{U}$ is farthest from $u^\star$, the opposite of what the stationary point suggests.

This is not a hypothetical typo. It is the single most common way a hand-built Hamiltonian silently fails: the sign convention for $L$, or for the sign of $\boldsymbol\lambda^\top\mathbf{f}$, gets flipped once, the stationarity algebra still produces a number, and nothing about that number looks wrong until the second-order check is run. Checking $\partial^2H/\partial\mathbf{u}^2\succeq\mathbf{0}$ costs one line and catches exactly this class of mistake before it costs an afternoon of debugging a shooting method that refuses to converge for reasons that have nothing to do with shooting.
:::

## Transversality, completed: a target that moves

The previous lesson derived $\boldsymbol\lambda(t_f)=\partial\phi/\partial\mathbf{x}+(\partial\boldsymbol\psi/\partial\mathbf{x})^\top\boldsymbol\nu$ and, for free final time, $H(t_f)+\partial\phi/\partial t+\boldsymbol\nu^\top\partial\boldsymbol\psi/\partial t=0$, for a terminal manifold $\boldsymbol\psi(\mathbf{x}(t_f),t_f)=\mathbf{0}$. Every example so far had $\boldsymbol\psi$ with no explicit time-dependence — a fixed orbit, a fixed altitude. A rendezvous or an intercept does not: the manifold itself moves, $\partial\boldsymbol\psi/\partial t \neq \mathbf{0}$, and that term earns its keep for the first time.

::: example Minimum-time intercept of a moving target
A vehicle at rest, $y(0)=0$, $w(0)=0$ (position and velocity along one axis), with $\ddot y = u$, $|u|\le1\,\mathrm{m/s^2}$, must intercept a target at $y_T(t) = 100 + 5t$ — starting $100\,\mathrm{m}$ ahead and receding at $V=5\,\mathrm{m/s}$ — in minimum time, with no constraint on the closing velocity at arrival. This is Lagrange with $L=1$, $\phi=0$, and the terminal constraint is $\psi\big(y(t_f),t_f\big) = y(t_f) - 100 - 5t_f = 0$, with $\partial\psi/\partial y = 1$, $\partial\psi/\partial w = 0$ ($w(t_f)$ free), and — the new piece — $\partial\psi/\partial t = -V = -5$.

The costates follow the same structure as every double-integrator problem in this module: $H=1+\lambda_y w+\lambda_w u$ gives $\dot\lambda_y=0$ and $\dot\lambda_w=-\lambda_y$, so $\lambda_y$ is constant and $\lambda_w$ is affine in $t$. Transversality on the state gives $\lambda_y(t_f)=\nu$ (free, since $y(t_f)$ is pinned) and $\lambda_w(t_f) = 0$ (since $w(t_f)$ is free) — both exactly the pattern the previous lesson's orbit-transfer example established. The new content is the time condition:

$$
H(t_f) + \nu\,\partial\psi/\partial t = 0 \;\Longrightarrow\; H(t_f) = \nu V = \lambda_y(t_f)\,V,
$$

a Hamiltonian at arrival that is **not zero**, unlike every fixed-target free-time example so far — it is priced by how fast the target is receding.

Solving: with $\lambda_w$ affine and $\lambda_w(t_f)=0$, and checking the sign of $\lambda_w(t)=\lambda_y(t_f-t)$ over $[0,t_f)$, a negative $\lambda_y$ keeps $\lambda_w<0$ throughout, which by the minimum principle means $u\equiv+u_{\max}=+1$ for the *entire* flight — no switch at all, because there is no requirement to stop. Integrating $u\equiv1$ from rest, $y(t)=\tfrac12t^2$, and the intercept condition $\tfrac12t_f^2 = 100+5t_f$ solves to $t_f = 20\,\mathrm{s}$ exactly (the positive root of $t_f^2-10t_f-200=0$), landing at $y(t_f)=200\,\mathrm{m}$, matching $y_T(20)=100+100=200\,\mathrm{m}$, with closing velocity $w(t_f)=20\,\mathrm{m/s}$.

Checking the costates against the necessary conditions: $\lambda_y = 1/(V-w(t_f)) = 1/(5-20) = -0.066667\,\mathrm{s/m}$, confirmed negative as required. $\lambda_w(t) = \lambda_y(t_f-t)$ is $-1.3333$ at $t=0$ and rises to exactly $0$ at $t=t_f$, strictly negative on the whole open interval — so $u\equiv+1$ throughout is consistent with the minimum principle, not merely feasible. And the new transversality relation checks numerically to machine precision: $H(t_f) = 1+\lambda_y\,w(t_f) = 1+(-0.066667)(20) = -0.33333$, while $\lambda_y(t_f)\,V = (-0.066667)(5) = -0.33333$ — an exact match, and a nonzero one, exactly because the target was moving.
:::

::: warning Do not reuse a fixed-target switching structure for a moving one
It is tempting to assume "double integrator, bounded control, minimum time" always means bang-bang-with-one-switch, because that was the answer every time before. The costate structure — $\lambda_y$ constant, $\lambda_w$ affine — is a property of the *dynamics*, so it is true regardless of the target; the *number of switches* is not automatic, because it depends on whether $\lambda_w$ actually changes sign inside $[0,t_f]$, which is a boundary-condition question, not a dynamics question. The rendezvous example above has zero switches precisely because the terminal velocity is free and the target keeps receding in the direction you are already accelerating — check the sign of the costate over the whole interval before assuming a switch exists, rather than pattern-matching to the last example that had one.
:::

## Check yourself

::: check
A needle variation replaces $\mathbf{u}^\star$ on $[\tau,\tau+\varepsilon]$ with a constant $\mathbf{v}$ that is admissible but far from $\mathbf{u}^\star(\tau)$ — say the opposite corner of a box constraint. Why does the argument in this lesson remain valid for such a large perturbation, when the calculus-of-variations argument of the previous lesson required $\delta\mathbf{u}$ to be small?
:::

::: answer
Because the two arguments are perturbing different things. The earlier smooth variation perturbed the control *at every instant* by a small amount, so the resulting state perturbation accumulates over the whole horizon and stays first-order only if $\delta\mathbf{u}(t)$ is small throughout. A needle variation perturbs the control by an arbitrary, possibly large amount, but only over a vanishingly short duration $\varepsilon$ — the state perturbation it produces is $O(\varepsilon)$ regardless of how large $\mathbf{v}-\mathbf{u}^\star(\tau)$ is, because it is the *duration* that is being sent to zero, not the size of the control change. That is precisely what lets $\mathbf{v}$ range over the whole set $\mathcal{U}$ rather than a shrinking neighbourhood of $\mathbf{u}^\star(\tau)$, which is what the minimum condition needs to say something about every admissible control, not just nearby ones.
:::

::: check
For a control-affine system with $L$ independent of $\mathbf{u}$ — the bang-bang setting of the switching-function examples elsewhere in this module — what does $\partial^2H/\partial\mathbf{u}^2$ equal, and what does that say about the relevance of the second-order check there?
:::

::: answer
$H$ is affine (linear plus a constant) in $\mathbf{u}$ in that setting, so $\partial^2H/\partial\mathbf{u}^2 = \mathbf{0}$ identically — the second-order condition is satisfied trivially (as an equality, $\mathbf{0}\succeq\mathbf{0}$) and carries no information, because there is no curvature to check. This is consistent with the fact that bang-bang optima are never interior stationary points of $H$ in $\mathbf{u}$ at all (except on a singular arc): the minimum is found at a vertex of $\mathcal{U}$, which is exactly the situation the needle-variation form of the principle was built to handle and the stationarity-plus-Hessian check has nothing to add to.
:::

::: check
In the moving-target example, what would change about the transversality analysis if the mission instead required matching the target's velocity at arrival, $w(t_f) = V$, rather than leaving it free?
:::

::: answer
$\boldsymbol\psi$ would gain a second component, $w(t_f) - V = 0$, with $\partial\psi_2/\partial w = 1$ and $\partial\psi_2/\partial t = 0$ (the required velocity $V$ is constant, not a function of $t_f$). The state transversality would then give $\lambda_w(t_f) = \nu_2$, free rather than forced to zero, and the time transversality would pick up both multipliers: $H(t_f) = \nu_1 V + \nu_2\cdot 0 = \nu_1 V$ still, but now $\nu_1$ is no longer the whole story for $\lambda_y(t_f)$ if $\psi_1$ also depended on $w$ — here it still would not, so $\lambda_y(t_f)=\nu_1$ as before. The qualitative change is that $\lambda_w(t_f)$ is no longer pinned to zero, so the argument that $u\equiv+1$ throughout (which relied on $\lambda_w(t_f)=0$ and $\lambda_w$ approaching it from below) no longer automatically holds — matching a specific arrival speed generally reintroduces the possibility of a switch, because the vehicle may need to stop accelerating, or even decelerate, to avoid arriving too fast.
:::

::: check
Explain, using the needle-variation derivation rather than citing the theorem, why a control that merely makes $H$ stationary can still fail the minimum principle on a problem with a bounded $\mathcal{U}$.
:::

::: answer
The needle-variation derivation concludes $H(\mathbf{x}^\star,\mathbf{v},\boldsymbol\lambda,\tau)\ge H(\mathbf{x}^\star,\mathbf{u}^\star,\boldsymbol\lambda,\tau)$ for *every* admissible $\mathbf{v}\in\mathcal{U}$, obtained by requiring $\delta J\ge0$ for every choice of needle target $\mathbf{v}$, not just ones infinitesimally close to $\mathbf{u}^\star$. Stationarity only encodes the special case where $\mathbf{v}=\mathbf{u}^\star+\epsilon\,\mathbf{d}$ for small $\epsilon$ and an admissible direction $\mathbf{d}$ — it says $H$ does not decrease for *nearby* controls, which is silent about a distant admissible $\mathbf{v}$, for instance the opposite bound of a box. A control can be a strict local minimum of $H$ among nearby points (stationary, second-order condition satisfied) while a far-away admissible point gives a strictly smaller $H$ — impossible for a convex $H(\cdot,\mathbf{u})$ on a convex $\mathcal{U}$, but entirely possible once either fails, which the needle argument catches and stationarity cannot, because stationarity was never built to look that far.
:::

## Summary

| Object | Statement |
| --- | --- |
| Minimum principle | $\mathbf{u}^\star(t) = \operatorname*{argmin}_{\mathbf{v}\in\mathcal{U}} H(\mathbf{x}^\star,\mathbf{v},\boldsymbol\lambda^\star,t)$, for every $t$ |
| Needle variation | Replace $\mathbf{u}^\star$ by constant $\mathbf{v}$ on $[\tau,\tau+\varepsilon]$; $\delta J\approx\varepsilon[H(\mathbf{v})-H(\mathbf{u}^\star)]\ge0$ for optimality |
| Shadow price, any instant | $\boldsymbol\lambda(\tau)$ prices a state perturbation at $\tau$, not only at $t_0$ |
| Second-order (Legendre-Clebsch) | $\partial^2H/\partial\mathbf{u}^2\succeq\mathbf{0}$ at an interior stationary point; for LQR this is exactly $\mathbf{R}\succ0$ |
| Sign-error failure | $L=\mathbf{x}^\top\mathbf{x}-cu^2$ gives a stationary $u^\star$ that maximises, not minimises, $H$ |
| Transversality, moving target | $\boldsymbol\psi(\mathbf{x}(t_f),t_f)=\mathbf{0}$ with $\partial\boldsymbol\psi/\partial t\ne\mathbf{0}$; $H(t_f)=-\partial\phi/\partial t-\boldsymbol\nu^\top\partial\boldsymbol\psi/\partial t$ |
| Intercept example | $t_f=20\,\mathrm{s}$, zero switches, $\lambda_y=-0.066667\,\mathrm{s/m}$, $H(t_f)=\lambda_y V=-0.33333$ (nonzero, exactly) |
| Switch count | Set by whether the costate crosses zero on $[t_0,t_f]$ — a boundary-condition question, not guaranteed by the dynamics alone |

The next lesson turns the boundary value problem this machinery produces — state forward, costate backward, tied together by the transversality conditions just derived — into an algorithm: shoot a guess at the missing initial costates and correct it, and confront exactly how badly that correction can behave.
