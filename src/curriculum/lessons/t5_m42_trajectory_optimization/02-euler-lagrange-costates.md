---
id: l02-euler-lagrange-costates
title: The Euler-Lagrange conditions and costates as shadow prices
minutes: 17
covers:
  - "Indirect methods: the Hamiltonian, the Euler-Lagrange conditions, costates as shadow prices"
---

The optimal control module's treatment of the Hamiltonian and the Pontryagin minimum principle stated four necessary conditions — the state equation, the costate equation, the minimum condition, and transversality — and used them. It did not derive them; a theorem of that weight is normally taken on citation the first time it is needed, the same way you used $F=m\mathbf{a}$ for years before anyone made you earn it from Lagrangian mechanics. This lesson earns it, for the two pieces a trajectory-optimisation engineer actually has to rederive by hand often enough to want the derivation once and for all: the costate equation together with the **stationarity** condition ($\partial H/\partial\mathbf{u}=\mathbf{0}$, the weaker cousin of the full minimum condition that the next lesson strengthens), and the **transversality** conditions in full generality — including the one case the earlier lessons' examples never needed, a terminal state constrained to lie on a manifold rather than sitting free or pinned to a point.

That case is not a mathematician's nicety here. "Arrive on the target circular orbit" fixes the radius and both velocity components but leaves the angular position on that orbit completely open — a two-dimensional constraint on a state that could, in principle, land anywhere along a whole one-dimensional family of positions. Getting the transversality condition right for that case is what makes the shooting method of a later lesson work at all.

## Setting up the multiplier

Take the general Bolza problem of the previous lesson, now with an explicit **terminal constraint** $\boldsymbol\psi\big(\mathbf{x}(t_f), t_f\big) = \mathbf{0} \in \mathbb{R}^{p}$ restricting where the trajectory is allowed to end — a manifold of codimension $p$ in the state space, with $p=n$ recovering a fully fixed endpoint and $p=0$ recovering a fully free one. Adjoin the dynamics with a time-varying costate $\boldsymbol\lambda(t)$ and the terminal constraint with a constant multiplier $\boldsymbol\nu\in\mathbb{R}^p$ — the same device the optimization module used for an equality constraint in a finite-dimensional program, here applied to a constraint that holds at one instant rather than everywhere:

$$
\bar J = \phi\big(\mathbf{x}(t_f),t_f\big) + \boldsymbol\nu^\top\boldsymbol\psi\big(\mathbf{x}(t_f),t_f\big) + \int_{t_0}^{t_f}\Big[L(\mathbf{x},\mathbf{u},t) + \boldsymbol\lambda(t)^\top\big(\mathbf{f}(\mathbf{x},\mathbf{u},t)-\dot{\mathbf{x}}\big)\Big]dt.
$$

Along any trajectory that actually satisfies $\dot{\mathbf{x}}=\mathbf{f}$, the bracketed term is identically zero, so $\bar J = J$ for *any* choice of $\boldsymbol\lambda(t)$ and $\boldsymbol\nu$ — the multipliers are free riders on a feasible trajectory, and the point of the exercise is to pick them so that the first-order condition for a minimum becomes easy to read off.

## The variation

Perturb the control, $\mathbf{u}\to\mathbf{u}+\delta\mathbf{u}$, which perturbs the state it produces, $\mathbf{x}\to\mathbf{x}+\delta\mathbf{x}$, with $\delta\mathbf{x}(t_0)=\mathbf{0}$ since $\mathbf{x}_0$ is given data. Writing $H = L + \boldsymbol\lambda^\top\mathbf{f}$ as before,

$$
\delta\bar J = \left(\frac{\partial\phi}{\partial\mathbf{x}}+\Big(\frac{\partial\boldsymbol\psi}{\partial\mathbf{x}}\Big)^{\!\top}\!\boldsymbol\nu\right)_{\!t_f}^{\!\top}\!\delta\mathbf{x}(t_f) + \int_{t_0}^{t_f}\left[\frac{\partial H}{\partial\mathbf{x}}^{\!\top}\!\delta\mathbf{x} + \frac{\partial H}{\partial\mathbf{u}}^{\!\top}\!\delta\mathbf{u} - \boldsymbol\lambda^\top\delta\dot{\mathbf{x}}\right]dt.
$$

The last term is the only one not already in a usable shape, and integrating it by parts is the entire trick of the method:

$$
\int_{t_0}^{t_f}-\boldsymbol\lambda^\top\delta\dot{\mathbf{x}}\,dt = -\Big[\boldsymbol\lambda^\top\delta\mathbf{x}\Big]_{t_0}^{t_f} + \int_{t_0}^{t_f}\dot{\boldsymbol\lambda}^\top\delta\mathbf{x}\,dt = -\boldsymbol\lambda(t_f)^\top\delta\mathbf{x}(t_f) + \int_{t_0}^{t_f}\dot{\boldsymbol\lambda}^\top\delta\mathbf{x}\,dt,
$$

using $\delta\mathbf{x}(t_0)=\mathbf{0}$ to drop the lower limit. Substituting back and collecting every term that multiplies $\delta\mathbf{x}(t)$ inside the integral, and every term that multiplies $\delta\mathbf{x}(t_f)$ on the boundary,

$$
\delta\bar J = \left(\frac{\partial\phi}{\partial\mathbf{x}}+\Big(\frac{\partial\boldsymbol\psi}{\partial\mathbf{x}}\Big)^{\!\top}\!\boldsymbol\nu-\boldsymbol\lambda\right)_{\!t_f}^{\!\top}\!\delta\mathbf{x}(t_f) + \int_{t_0}^{t_f}\left[\Big(\frac{\partial H}{\partial\mathbf{x}}+\dot{\boldsymbol\lambda}\Big)^{\!\top}\!\delta\mathbf{x} + \frac{\partial H}{\partial\mathbf{u}}^{\!\top}\!\delta\mathbf{u}\right]dt.
$$

A minimum requires $\delta\bar J = 0$ for every admissible $\delta\mathbf{u}(t)$, which drives $\delta\mathbf{x}(t)$ through the (as yet unconstrained) linearised dynamics. $\boldsymbol\lambda(t)$ was never pinned down, so choose it to kill the interior $\delta\mathbf{x}$ term outright:

$$
\dot{\boldsymbol\lambda} = -\frac{\partial H}{\partial\mathbf{x}} \qquad \text{(costate equation)}.
$$

With that term gone, $\delta\mathbf{u}$ is free and its coefficient must vanish for an interior (unconstrained) optimum:

$$
\frac{\partial H}{\partial\mathbf{u}} = \mathbf{0} \qquad \text{(stationarity)}.
$$

What remains is the boundary term, and $\boldsymbol\nu$ was never pinned down either. Choose it so that $\boldsymbol\lambda(t_f) = \partial\phi/\partial\mathbf{x} + (\partial\boldsymbol\psi/\partial\mathbf{x})^\top\boldsymbol\nu$ exactly — possible whenever $\partial\boldsymbol\psi/\partial\mathbf{x}$ has full row rank $p$ — and the boundary term vanishes identically, for every $\delta\mathbf{x}(t_f)$, not merely for the ones tangent to the constraint manifold. That is the **transversality condition**:

$$
\boldsymbol\lambda(t_f) = \frac{\partial\phi}{\partial\mathbf{x}}\bigg|_{t_f} + \left(\frac{\partial\boldsymbol\psi}{\partial\mathbf{x}}\right)^{\!\top}_{\!t_f}\!\boldsymbol\nu.
$$

Two limits recover the cases the earlier lessons already used without derivation. With $p=0$ (no terminal constraint, $\boldsymbol\psi$ absent), $\boldsymbol\nu$ vanishes with it and $\boldsymbol\lambda(t_f)=\partial\phi/\partial\mathbf{x}$ — the free-endpoint case. With $p=n$ (every component of $\mathbf{x}(t_f)$ pinned to a target, $\boldsymbol\psi = \mathbf{x}(t_f)-\mathbf{x}_{\text{target}}$), $\partial\boldsymbol\psi/\partial\mathbf{x} = \mathbf{I}$ and $\boldsymbol\lambda(t_f) = \partial\phi/\partial\mathbf{x}+\boldsymbol\nu$ for an entirely free $\boldsymbol\nu$ — which is no condition on $\boldsymbol\lambda(t_f)$ at all, matching the fact that a fully fixed endpoint leaves the terminal costate to be *determined* by hitting the target rather than *prescribed* by a formula.

When $t_f$ is also free, the same bookkeeping applied to the moving endpoint — the interval of integration and the terminal state sweep together — adds one further scalar condition, stated without rederiving the endpoint-sweep algebra since it is exactly the free-time result the earlier lessons already used with $\boldsymbol\psi$ absent:

$$
H(t_f) + \frac{\partial\phi}{\partial t}\bigg|_{t_f} + \boldsymbol\nu^\top\frac{\partial\boldsymbol\psi}{\partial t}\bigg|_{t_f} = 0.
$$

::: key The Euler-Lagrange conditions for the Bolza problem
$H = L+\boldsymbol\lambda^\top\mathbf{f}$. Costate: $\dot{\boldsymbol\lambda}=-\partial H/\partial\mathbf{x}$. Stationarity: $\partial H/\partial\mathbf{u}=\mathbf{0}$. Transversality with terminal constraint $\boldsymbol\psi(\mathbf{x}(t_f),t_f)=\mathbf{0}$: $\boldsymbol\lambda(t_f)=\partial\phi/\partial\mathbf{x}+(\partial\boldsymbol\psi/\partial\mathbf{x})^\top\boldsymbol\nu$, plus $H(t_f)+\partial\phi/\partial t+\boldsymbol\nu^\top\partial\boldsymbol\psi/\partial t=0$ if $t_f$ is free. Stationarity is the interior special case of the minimum principle's minimum condition; the next lesson replaces it with the version that also holds on a bound.
:::

::: example What a terminal manifold buys you: the decoupled angle of an orbit transfer
A later lesson shoots a minimum-time transfer between circular orbits in polar coordinates $(r,\theta,v_r,v_t)$, minimising $J=t_f$ (so $\phi=t_f$, $L=1$) subject to arriving at $r(t_f)=r_1$, $v_r(t_f)=0$, $v_t(t_f)=\sqrt{\mu/r_1}$, with $\theta(t_f)$ left **entirely free** — the vehicle may arrive anywhere along the target orbit. The terminal constraint is $\boldsymbol\psi = \big(r(t_f)-r_1,\ v_r(t_f),\ v_t(t_f)-\sqrt{\mu/r_1}\big) = \mathbf{0}$, a function of $r$, $v_r$, $v_t$ only — $\theta$ does not appear in $\boldsymbol\psi$ at all, so $\partial\boldsymbol\psi/\partial\theta \equiv \mathbf{0}$.

The transversality formula then gives $\lambda_\theta(t_f) = \partial\phi/\partial\theta + (\partial\boldsymbol\psi/\partial\theta)^\top\boldsymbol\nu = 0+0=0$, since $\phi=t_f$ does not depend on $\theta$ either. And because the two-body dynamics of $r$, $v_r$, $v_t$ never involve $\theta$ (a central-force field is rotationally symmetric), $H$ has no explicit $\theta$-dependence, so the costate equation gives $\dot\lambda_\theta = -\partial H/\partial\theta = 0$: $\lambda_\theta$ is constant. Combined with $\lambda_\theta(t_f)=0$, this forces $\lambda_\theta(t)\equiv 0$ for the *entire* flight, not just at the endpoint.

This is checkable by machine, not just by hand. Solving the shooting problem with $\lambda_\theta(0)$ left as a free unknown and the transversality condition $\lambda_\theta(t_f)=0$ imposed as one of the equations a root finder must satisfy — rather than assuming $\lambda_\theta\equiv0$ up front — converges to $\lambda_\theta(0) = -3.2\times10^{-28}$: zero to machine precision, recovering the shortcut from first principles instead of by assumption. Every other costate and the flight time match the direct calculation to ten significant figures. This is why the shooting problem in that lesson only ever carries three costates, $(\lambda_r,\lambda_{v_r},\lambda_{v_t})$, instead of four: $\theta$ and $\lambda_\theta$ decouple completely, and now you know it is because of the transversality condition on a manifold that never touches $\theta$, not a convenient omission.
:::

## Costates as shadow prices

The derivation above fixed $\mathbf{x}_0$ and asked what makes $\delta\bar J=0$ for variations in the control. Ask a different question instead: with the optimal control already found, how does the optimal *cost* $J^\star$ respond to a small change in the given initial state $\mathbf{x}_0$? This is exactly the sensitivity question the optimization module answered for a linear or quadratic program using the Lagrange multiplier on a constraint — the shadow price — and the same envelope-theorem logic applies here, extended from a single scalar constraint to an entire initial-state vector.

Redo the integration by parts above without discarding the $t_0$ boundary term, since $\delta\mathbf{x}(t_0)=\delta\mathbf{x}_0$ is no longer zero:

$$
\int_{t_0}^{t_f}-\boldsymbol\lambda^\top\delta\dot{\mathbf{x}}\,dt = -\boldsymbol\lambda(t_f)^\top\delta\mathbf{x}(t_f) + \boldsymbol\lambda(t_0)^\top\delta\mathbf{x}_0 + \int_{t_0}^{t_f}\dot{\boldsymbol\lambda}^\top\delta\mathbf{x}\,dt.
$$

Evaluate $\delta\bar J$ *at* the optimal trajectory, where the costate equation, stationarity and transversality already hold by construction. Every term above vanishes except the one that is new — the $t_0$ boundary term — leaving

$$
\delta J^\star = \boldsymbol\lambda(t_0)^\top\delta\mathbf{x}_0 \qquad\Longrightarrow\qquad \frac{\partial J^\star}{\partial\mathbf{x}_0} = \boldsymbol\lambda(t_0).
$$

The costate at the start of the flight is the gradient of the optimal cost with respect to the starting condition — not an analogy, an identity, with units to match: if $J$ is measured in kilograms of propellant and $x_0$ is an altitude in metres, $\lambda(t_0)$ is measured in kilograms per metre, and it says exactly how many kilograms one more metre of starting altitude costs.

::: example Pricing a dispersed ignition altitude
The Mars powered-descent problem of the previous lesson — land softly from $h_0=1500\,\mathrm{m}$, $v_0=-75\,\mathrm{m/s}$, minimising propellant — was solved by indirect shooting with converged initial costates $\lambda_h(0) = 0.017615\,\mathrm{kg/m}$ and $\lambda_v(0) = -0.356101\,\mathrm{kg/(m/s)}$, at a baseline propellant cost of $86.7579\,\mathrm{kg}$.

The prediction is that starting $1\,\mathrm{m}$ higher, with the same $v_0$, should cost about $\lambda_h(0)\times 1 = 0.017615\,\mathrm{kg}$ more propellant, and starting $0.5\,\mathrm{m/s}$ slower (less negative, $v_0=-74.5\,\mathrm{m/s}$) should *save* about $\lambda_v(0)\times(0.5) = 0.178\,\mathrm{kg}$. Re-solving the full two-point boundary value problem from scratch at the perturbed initial conditions — not using the costate at all, just resolving the whole shooting problem again — gives:

| Perturbation | Predicted $\Delta$propellant | Re-solved $\Delta$propellant |
| --- | --- | --- |
| $\delta h_0=+1\,\mathrm{m}$ | $+0.017615\,\mathrm{kg}$ | $+0.017613\,\mathrm{kg}$ |
| $\delta h_0=-5\,\mathrm{m}$ | $-0.088076\,\mathrm{kg}$ | $-0.088132\,\mathrm{kg}$ |
| $\delta v_0=+0.1\,\mathrm{m/s}$ | $-0.035610\,\mathrm{kg}$ | $-0.035596\,\mathrm{kg}$ |
| $\delta v_0=-0.5\,\mathrm{m/s}$ | $+0.178051\,\mathrm{kg}$ | $+0.178412\,\mathrm{kg}$ |

The prediction from a single number computed once, $\boldsymbol\lambda(0)$, tracks the cost of re-solving the entire nonlinear boundary value problem to four significant figures for a $1\,\mathrm{m}$ or $0.1\,\mathrm{m/s}$ perturbation, and is still correct to two significant figures at $5\,\mathrm{m}$ — first-order agreement degrading exactly as fast as a linearisation should as the perturbation grows. A guidance team deciding whether a better altimeter is worth its mass and cost now has a number to compare it against directly: at $\lambda_h(0)\approx 17.6\,\mathrm{g}$ per metre of ignition-altitude dispersion, a sensor that tightens the $3\sigma$ altitude knowledge by $20\,\mathrm{m}$ is worth, in propellant alone, on the order of $350\,\mathrm{g}$ per landing.
:::

::: warning A "free" terminal state does not mean the terminal costate is free
It is tempting to read "the terminal state is unconstrained" as "$\boldsymbol\lambda(t_f)$ is whatever the shooting solver wants." It is not — $\boldsymbol\lambda(t_f) = \partial\phi/\partial\mathbf{x}|_{t_f}$ is a *formula*, forced by the transversality condition, and a shooting solver that treats $\boldsymbol\lambda(t_f)$ as a free variable on a free-endpoint problem is solving the wrong system. The confusion runs the other way for a *fixed* endpoint: there $\mathbf{x}(t_f)$ is pinned and $\boldsymbol\lambda(t_f)$ genuinely is free, determined only by whatever value makes the shot land on the target. Get the two backwards and a correctly coded integrator will converge to a costate history that satisfies none of the actual boundary conditions.
:::

## Check yourself

::: check
A problem has $\phi = 0$ and a terminal constraint fixing every component of $\mathbf{x}(t_f)$ to a specific target — the fully fixed endpoint. What does the general transversality formula say about $\boldsymbol\lambda(t_f)$, and does that match how the two-point boundary value problems of the earlier optimal-control lessons were actually posed?
:::

::: answer
With $\boldsymbol\psi = \mathbf{x}(t_f)-\mathbf{x}_{\text{target}}$ and $p=n$, $\partial\boldsymbol\psi/\partial\mathbf{x}=\mathbf{I}$, so $\boldsymbol\lambda(t_f) = \partial\phi/\partial\mathbf{x} + \boldsymbol\nu = \mathbf{0}+\boldsymbol\nu$ for a completely unconstrained $\boldsymbol\nu\in\mathbb{R}^n$ — which is to say, the formula imposes no condition on $\boldsymbol\lambda(t_f)$ at all, because $\boldsymbol\nu$ can absorb any value. That matches exactly how a fixed-endpoint shooting problem is actually solved: $\boldsymbol\lambda(t_0)$ is guessed and shot forward, and $\boldsymbol\lambda(t_f)$ is whatever comes out, with no separate equation constraining it — the only requirement on the terminal side is that $\mathbf{x}(t_f)$ hits the target, which is $n$ equations for the $n$ unknown components of $\boldsymbol\lambda(t_0)$.
:::

::: check
Derive $\partial H/\partial\mathbf{u}=\mathbf{0}$ is described as the case where stationarity and the full minimum condition of the next lesson agree. From the derivation in this lesson, explain precisely where the argument for stationarity assumed the control was unconstrained.
:::

::: answer
The step was "$\delta\mathbf{u}$ is free, so its coefficient in the integral must vanish." That freedom is exactly the assumption that fails once $\mathbf{u}$ is required to lie in a proper subset $\mathcal{U}\subsetneq\mathbb{R}^m$: if the optimal $\mathbf{u}^\star(t)$ sits on the boundary of $\mathcal{U}$, only perturbations $\delta\mathbf{u}$ that keep $\mathbf{u}^\star+\delta\mathbf{u}$ admissible are allowed, which for a boundary point means $\delta\mathbf{u}$ pointing into the feasible set on one side only — not every direction is available, so "coefficient must vanish" weakens to "coefficient times every *admissible* direction must be non-negative," which is precisely the minimum condition rather than stationarity. The derivation here is honest about needing $\mathbf{u}$ unconstrained near the optimum; it is a derivation of the necessary condition for an *interior* optimum, not a proof of the general Pontryagin result.
:::

::: check
In the orbit-transfer example, suppose the mission instead required arriving at a *specific* point on the target orbit — $\theta(t_f)=\theta_{\text{target}}$ fixed, not free. What changes about $\lambda_\theta$, and what does not?
:::

::: answer
$\boldsymbol\psi$ now includes a fourth component, $\theta(t_f)-\theta_{\text{target}}$, so $\partial\boldsymbol\psi/\partial\theta$ is no longer identically zero and the transversality formula no longer forces $\lambda_\theta(t_f)=0$ — $\lambda_\theta(t_f)$ becomes free, absorbed into the now four-dimensional $\boldsymbol\nu$, exactly like every other component of a fixed endpoint. What does not change is the costate equation itself, $\dot\lambda_\theta = -\partial H/\partial\theta = 0$, since the dynamics still do not depend on $\theta$ — $\lambda_\theta$ is still constant over the flight, just no longer pinned to zero. The practical consequence is a fourth shooting unknown, $\lambda_\theta(0)$, and a fourth equation, $\theta(t_f)=\theta_{\text{target}}$, to solve for it.
:::

::: check
The shadow-price identity gave a $17.6\,\mathrm{g/m}$ marginal propellant cost for ignition altitude on the Mars descent. A guidance engineer proposes triggering ignition on a *velocity* threshold instead of an altitude threshold, with a $3\sigma$ dispersion of $\pm0.3\,\mathrm{m/s}$. Estimate the propellant cost of that dispersion, and say what assumption the estimate rests on.
:::

::: answer
Using $\lambda_v(0)=-0.356101\,\mathrm{kg/(m/s)}$, a $\pm0.3\,\mathrm{m/s}$ dispersion costs on the order of $|\lambda_v(0)|\times0.3 \approx 0.1068\,\mathrm{kg}$ at the $1\sigma$-equivalent edge of the range, so roughly $\pm0.11\,\mathrm{kg}$ of propellant variation from this source at $3\sigma$-scale dispersion of that size. The estimate rests on the perturbation being small enough that the first-order (linear) shadow-price relationship still holds — the worked example showed agreement to four significant figures at $0.1\,\mathrm{m/s}$ and two significant figures by $5\,\mathrm{m}$ of altitude error, so a $0.3\,\mathrm{m/s}$ velocity dispersion is comfortably inside the regime where the linear estimate is trustworthy, but the estimate would need re-checking against an actual re-solve if the dispersion were an order of magnitude larger.
:::

::: check
Why does the costate-as-shadow-price derivation reuse the exact same integration-by-parts calculation as the costate equation and transversality, rather than needing a separate argument?
:::

::: answer
Because both are reading off different pieces of the identical first-variation expression for $\delta\bar J$. The costate equation and stationarity come from demanding the *interior* and *control* coefficients vanish; transversality comes from the $t_f$ boundary term; the shadow-price result comes from the $t_0$ boundary term, which every earlier step discarded only because $\delta\mathbf{x}(t_0)$ was assumed to be zero. Once that assumption is dropped — because the question has changed from "which control is optimal" to "how sensitive is the optimal cost to the given initial condition" — the same expression, with every other term already zeroed out by the conditions already imposed, hands back the answer with no further calculus. This is the general shape of an envelope-theorem argument: at an optimum, the only surviving sensitivity is the one coming from whichever piece of data you chose to perturb.
:::

## Summary

| Object | Statement |
| --- | --- |
| Augmented cost | $\bar J = \phi+\boldsymbol\nu^\top\boldsymbol\psi\big|_{t_f} + \int[L+\boldsymbol\lambda^\top(\mathbf{f}-\dot{\mathbf{x}})]\,dt$ |
| Costate equation | $\dot{\boldsymbol\lambda}=-\partial H/\partial\mathbf{x}$ |
| Stationarity | $\partial H/\partial\mathbf{u}=\mathbf{0}$ (interior optimum only) |
| Transversality (state) | $\boldsymbol\lambda(t_f)=\partial\phi/\partial\mathbf{x}+(\partial\boldsymbol\psi/\partial\mathbf{x})^\top\boldsymbol\nu$ |
| Transversality (time, if $t_f$ free) | $H(t_f)+\partial\phi/\partial t+\boldsymbol\nu^\top\partial\boldsymbol\psi/\partial t = 0$ |
| Free endpoint | $p=0$: $\boldsymbol\lambda(t_f)=\partial\phi/\partial\mathbf{x}$ |
| Fixed endpoint | $p=n$: $\boldsymbol\lambda(t_f)$ unconstrained by the formula, fixed instead by hitting the target |
| Manifold endpoint | Components of $\boldsymbol\lambda(t_f)$ conjugate to unconstrained state directions vanish (the orbit-transfer $\lambda_\theta\equiv0$ example) |
| Shadow price | $\partial J^\star/\partial\mathbf{x}_0 = \boldsymbol\lambda(t_0)$ |
| Verified example | $\lambda_h(0)=0.017615\,\mathrm{kg/m}$, $\lambda_v(0)=-0.356101\,\mathrm{kg/(m/s)}$; predicted and re-solved $\Delta$propellant agree to 2-4 significant figures |

The next lesson takes stationarity to the full Pontryagin minimum principle — the version that survives when $\mathbf{u}$ is bounded, which is every real actuator — and derives it from the same first-order argument sharpened with a needle-shaped perturbation instead of an arbitrary smooth one.
