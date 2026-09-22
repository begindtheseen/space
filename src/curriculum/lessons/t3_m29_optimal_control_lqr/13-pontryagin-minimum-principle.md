---
id: l13-pontryagin-minimum-principle
title: The Hamiltonian and the Pontryagin minimum principle
minutes: 20
covers:
  - The Hamiltonian and the Pontryagin minimum principle as the general frame
---

Everything so far has been the easy case. The dynamics were linear, the cost was quadratic, the control was unbounded, and the minimisation over $\mathbf{u}$ was a matter of setting a derivative to zero and solving a linear system. Real vehicles are not so accommodating: a thruster is either on or off, an engine throttles between forty and a hundred percent and nowhere below, a gimbal stops at eight degrees, and the dynamics have a $1/r^2$ in them.

The Pontryagin minimum principle is the general theory that the linear quadratic regulator is a special case of. It keeps the Hamiltonian and the costate from the variational derivation, and it replaces "set $\partial H/\partial\mathbf{u}$ to zero" with something stronger and more useful: **the optimal control minimises the Hamiltonian pointwise over the admissible set**. When the admissible set is all of $\mathbb{R}^m$ and $H$ is a convex quadratic, that reduces to the stationarity condition and you get LQR back. When the set has edges, the minimiser sits on an edge, and the result is the bang-bang and bang-off-bang profiles that minimum-time and minimum-propellant guidance actually use.

This is also where the optimisation module's machinery reappears. The costate is the Lagrange multiplier on the dynamics constraint, the pointwise minimisation is the continuous-time version of choosing an active set, and the Hamiltonian being constant along an optimal trajectory is a conservation law that falls out of the same algebra.

## The general problem

Minimise

$$
J = \phi\big(\mathbf{x}(t_f), t_f\big) + \int_{t_0}^{t_f} L\big(\mathbf{x}(t), \mathbf{u}(t), t\big)\,dt
$$

subject to $\dot{\mathbf{x}} = \mathbf{f}(\mathbf{x},\mathbf{u},t)$ with $\mathbf{x}(t_0)$ given, a terminal condition on $\mathbf{x}(t_f)$ that may be free, fixed or constrained to a surface, and the pointwise constraint

$$
\mathbf{u}(t) \in \mathcal{U} \subseteq \mathbb{R}^m \quad\text{for every } t.
$$

$\phi$ is the terminal (Mayer) cost, $L$ the running (Lagrange) cost. Nothing is assumed linear or quadratic; $\mathcal{U}$ can be a box, a cone, a sphere or a two-point set.

## The necessary conditions

Form the **Hamiltonian**, attaching a costate $\boldsymbol{\lambda}(t) \in \mathbb{R}^n$ to the dynamics:

$$
H(\mathbf{x},\mathbf{u},\boldsymbol{\lambda},t) = L(\mathbf{x},\mathbf{u},t) + \boldsymbol{\lambda}^\top\mathbf{f}(\mathbf{x},\mathbf{u},t).
$$

Along an optimal trajectory $(\mathbf{x}^\star, \mathbf{u}^\star)$ there exists a costate $\boldsymbol{\lambda}^\star$ such that:

1. **State equation.** $\dot{\mathbf{x}}^\star = \partial H/\partial\boldsymbol{\lambda} = \mathbf{f}(\mathbf{x}^\star,\mathbf{u}^\star,t)$.
2. **Costate equation.** $\dot{\boldsymbol{\lambda}}^\star = -\partial H/\partial\mathbf{x}$, evaluated on the optimal trajectory.
3. **Minimum condition.** For every $t$ and every admissible $\mathbf{u} \in \mathcal{U}$,
$$
H\big(\mathbf{x}^\star,\mathbf{u}^\star,\boldsymbol{\lambda}^\star,t\big) \;\le\; H\big(\mathbf{x}^\star,\mathbf{u},\boldsymbol{\lambda}^\star,t\big).
$$
4. **Transversality.** With a free terminal state, $\boldsymbol{\lambda}(t_f) = \partial\phi/\partial\mathbf{x}\big|_{t_f}$. With the terminal state fixed, $\boldsymbol{\lambda}(t_f)$ is free and determined by the constraint. With a free final time, additionally $H(t_f) = -\partial\phi/\partial t\big|_{t_f}$, which for a time-independent $\phi$ is $H(t_f) = 0$.

::: key Pontryagin minimum principle
With $H = L(\mathbf{x},\mathbf{u}) + \boldsymbol{\lambda}^\top\mathbf{f}(\mathbf{x},\mathbf{u})$: $\dot{\mathbf{x}} = \partial H/\partial\boldsymbol{\lambda}$, $\dot{\boldsymbol{\lambda}} = -\partial H/\partial\mathbf{x}$, and $\mathbf{u}^\star$ minimises $H$ pointwise over the admissible set. LQR is the case where that minimisation is a solvable quadratic.
:::

One more consequence is worth having. If $\mathbf{f}$ and $L$ have no explicit time dependence, then along an optimal trajectory

$$
\frac{dH}{dt} = \frac{\partial H}{\partial\mathbf{x}}^\top\dot{\mathbf{x}} + \frac{\partial H}{\partial\boldsymbol{\lambda}}^\top\dot{\boldsymbol{\lambda}} + \frac{\partial H}{\partial\mathbf{u}}^\top\dot{\mathbf{u}}
= -\dot{\boldsymbol{\lambda}}^\top\dot{\mathbf{x}} + \dot{\mathbf{x}}^\top\dot{\boldsymbol{\lambda}} + 0 = 0,
$$

so $H$ is **constant**. Combined with the free-final-time condition it gives $H \equiv 0$ throughout, which is a free and extremely effective check on any numerical solution.

## Minimum, not stationarity

The difference between condition 3 and "$\partial H/\partial\mathbf{u} = \mathbf{0}$" is the whole reason the principle carries Pontryagin's name. If $\mathcal{U} = \mathbb{R}^m$ and $H$ is smooth, an interior minimum does satisfy stationarity and the two agree. If $\mathcal{U}$ is a box, the minimiser is generally on the boundary and the gradient there is not zero.

The important case is when $H$ is **linear** in $\mathbf{u}$, which happens whenever the dynamics are affine in the control and the running cost is too — minimum time ($L = 1$) and minimum propellant ($L = \|\mathbf{u}\|$) both qualify. Write $H = (\text{terms without } \mathbf{u}) + S(t)\,u$ for a scalar control. The **switching function** $S(t)$ decides everything:

$$
u^\star(t) = \begin{cases} u_{\min}, & S(t) > 0\\ u_{\max}, & S(t) < 0\end{cases}
$$

because minimising a linear function over an interval puts you at whichever end has the lower value. The control is at a limit at all times — **bang-bang** — and the entire problem becomes the question of when $S$ changes sign.

::: example Minimum-time slew of a spacecraft axis
$J = 120\,\mathrm{kg\,m^2}$, torque bounded by $|u| \le 8\,\mathrm{N\,m}$, rest-to-rest through $30^\circ$. Minimise $t_f$, so $L = 1$, $\phi = 0$, $t_f$ free.

$$
H = 1 + \lambda_\theta\,\omega + \lambda_\omega\,\frac{u}{J}, \qquad S(t) = \frac{\lambda_\omega(t)}{J}, \qquad u^\star = -u_{\max}\,\mathrm{sgn}\,S .
$$

The costate equations are $\dot\lambda_\theta = -\partial H/\partial\theta = 0$ and $\dot\lambda_\omega = -\partial H/\partial\omega = -\lambda_\theta$, so $\lambda_\theta$ is a constant and $\lambda_\omega$ is **linear in time**. A linear function changes sign at most once: the optimal profile has exactly one switch — accelerate at full torque, then decelerate at full torque.

Symmetry puts the switch at the halfway angle. With $\theta_{sw} = 15^\circ = 0.26180\,\mathrm{rad}$ and $\theta_{sw} = \tfrac12(u_{\max}/J)t_1^2$,

$$
t_1 = \sqrt{\frac{\theta_f J}{u_{\max}}} = \sqrt{\frac{0.52360 \times 120}{8}} = 2.8025\,\mathrm{s},
\qquad t_f = 2t_1 = 5.6050\,\mathrm{s},
$$

with a peak rate of $(u_{\max}/J)t_1 = 0.18683\,\mathrm{rad/s} = 10.70^\circ/\mathrm{s}$. Integrating the bang-bang profile numerically lands at $\theta = 30.0001^\circ$ and $\omega = 6.7\times10^{-7}\,\mathrm{rad/s}$.

Now the costates, which are determined rather than free. $S(t_1) = 0$ forces $\lambda_\omega(t_1) = 0$. The free-final-time condition $H \equiv 0$ evaluated at $t = 0$, where $\omega = 0$ and $u = +u_{\max}$, gives $1 + \lambda_\omega(0)u_{\max}/J = 0$; and $\lambda_\omega(t) = \lambda_\omega(0) - \lambda_\theta t$ with $\lambda_\omega(t_1) = 0$ fixes $\lambda_\theta$:

$$
\lambda_\omega(0) = -\frac{J}{u_{\max}} = -15.000,
\qquad \lambda_\theta = \frac{\lambda_\omega(0)}{t_1} = -5.3524 ,
$$

Checking $H$ at $t = 0$, $1$, $2.8025$, $4$ and $5.605\,\mathrm{s}$ gives $0$ to within $5.6\times10^{-17}$ at every point, which is the check the constancy of $H$ buys.

The feedback form is what flies. Eliminating time, the locus of states from which full-torque deceleration exactly reaches rest is the **switching curve**

$$
e + \frac{J\,\omega|\omega|}{2u_{\max}} = 0, \qquad e = \theta - \theta_f,
$$

and the control law "full torque against the sign of the switching function" is the classic time-optimal phase-plane controller. At the computed switch point, $e = -0.26180$ and $\omega = 0.186833$, and the expression evaluates to $-5.6\times10^{-17}$.

Two honest caveats. The peak rate of $10.7^\circ/\mathrm{s}$ far exceeds the $2^\circ/\mathrm{s}$ slew budget these weights were built around, so a real implementation adds a rate limit and the profile becomes accelerate–coast–decelerate. And exact bang-bang chatters at the switch in the presence of noise, so flight versions use a deadband or blend into a linear controller near the target.
:::

## Free final time and the switching structure

When $t_f$ is a decision variable, condition 4 adds $H(t_f) = 0$, and with an autonomous problem $H \equiv 0$ everywhere. That one scalar equation is usually what pins down the remaining unknown in a shooting solution.

::: example Minimum-propellant vertical landing
A booster on final descent: $\dot h = v$, $\dot v = -g + u/m$ with $g = 9.80665\,\mathrm{m/s^2}$, mass held constant at $m = 25\,000\,\mathrm{kg}$, thrust $u \in [0,\ T_{\max}]$ with $T_{\max} = 8.45\times10^{5}\,\mathrm{N}$. Minimise propellant, which at fixed $m$ and specific impulse is proportional to total impulse, so $L = u$. Terminal conditions $h(t_f) = 0$, $v(t_f) = 0$, with $t_f$ free.

$$
H = u + \lambda_h v + \lambda_v\left(-g + \frac{u}{m}\right)
= \lambda_h v - \lambda_v g + \underbrace{\left(1 + \frac{\lambda_v}{m}\right)}_{S(t)} u .
$$

$H$ is linear in $u$, so $u^\star = 0$ when $S > 0$ and $u^\star = T_{\max}$ when $S < 0$. The costates: $\dot\lambda_h = -\partial H/\partial h = 0$, so $\lambda_h$ is constant; $\dot\lambda_v = -\partial H/\partial v = -\lambda_h$, so $\lambda_v$ is linear in $t$ and therefore so is $S$. **At most one switch**, and since a vehicle that starts by burning and ends coasting cannot arrive at rest, the structure is coast, then burn: the famous single-burn, or in the throttleable case max–min–max, profile.

Numbers. The net deceleration during the burn is $a = T_{\max}/m - g = 33.800 - 9.807 = 23.993\,\mathrm{m/s^2}$. Starting from $h_0 = 3000\,\mathrm{m}$ at $v_0 = -250\,\mathrm{m/s}$, the coast ends when the remaining altitude exactly equals the braking distance, $h_1 = v_1^2/(2a)$. Solving,

$$
t_1 = 4.4344\,\mathrm{s},\qquad h_1 = 1794.97\,\mathrm{m},\qquad v_1 = -293.487\,\mathrm{m/s},
$$

then $t_b = |v_1|/a = 12.2320\,\mathrm{s}$ and $t_f = 16.6665\,\mathrm{s}$. The impulse is $T_{\max}t_b = 1.034\times10^{7}\,\mathrm{N\,s}$, a $\Delta v$ of $413.4\,\mathrm{m/s}$, and at $I_{sp} = 282\,\mathrm{s}$ that is $3738\,\mathrm{kg}$ of propellant — about $15\,\%$ of the vehicle mass, which is how far off the constant-mass assumption is and why a real solution carries mass as a state.

The costates confirm the structure rather than being decoration. At $t_f$, with $v = 0$ and $u = T_{\max}$, $H = 0$ gives $\lambda_v(t_f) = -T_{\max}/a = -35218$, so $S(t_f) = 1 + \lambda_v(t_f)/m = -0.4087 < 0$: burning, as required. At the switch, $S = 0$ forces $\lambda_v(t_1) = -m = -25000$. The two values fix the slope, $\dot\lambda_v = -835.36\,\mathrm{s^{-1}}$, hence $\lambda_h = 835.36$, and back-propagating gives $S(0) = +0.1482 > 0$: coasting, as required. Every sign is determined, none is assumed.
:::

## LQR as the special case

Set $\mathcal{U} = \mathbb{R}^m$, $\mathbf{f} = \mathbf{A}\mathbf{x}+\mathbf{B}\mathbf{u}$, $L = \tfrac12(\mathbf{x}^\top\mathbf{Q}\mathbf{x}+\mathbf{u}^\top\mathbf{R}\mathbf{u})$ and $\phi = \tfrac12\mathbf{x}^\top\mathbf{Q}_f\mathbf{x}$. Then

$$
H = \tfrac12\big(\mathbf{x}^\top\mathbf{Q}\mathbf{x}+\mathbf{u}^\top\mathbf{R}\mathbf{u}\big) + \boldsymbol{\lambda}^\top(\mathbf{A}\mathbf{x}+\mathbf{B}\mathbf{u})
$$

is a strictly convex quadratic in $\mathbf{u}$ because $\mathbf{R} \succ 0$, so the pointwise minimisation has an interior solution and reduces to stationarity: $\mathbf{R}\mathbf{u} + \mathbf{B}^\top\boldsymbol{\lambda} = \mathbf{0}$, hence $\mathbf{u}^\star = -\mathbf{R}^{-1}\mathbf{B}^\top\boldsymbol{\lambda}$. The costate equation is $\dot{\boldsymbol{\lambda}} = -\mathbf{Q}\mathbf{x} - \mathbf{A}^\top\boldsymbol{\lambda}$ and transversality gives $\boldsymbol{\lambda}(t_f) = \mathbf{Q}_f\mathbf{x}(t_f)$ — exactly the two-point boundary value problem of the second lesson, which the sweep $\boldsymbol{\lambda} = \mathbf{P}\mathbf{x}$ turned into the Riccati equation. LQR is the corner of this theory where the minimisation is solvable in closed form and the answer collapses to a feedback gain.

That collapse is rare. In general the minimum principle gives a boundary value problem in $(\mathbf{x},\boldsymbol{\lambda})$ that must be solved numerically, one trajectory at a time, with no feedback law falling out — which is why trajectory optimisation and feedback control are separate activities on a real vehicle, and why the previous lessons' time-varying LQR exists to stabilize what the trajectory optimiser produces.

## Singular arcs

If the switching function vanishes over an interval rather than at isolated points, the minimum condition determines nothing: every admissible $\mathbf{u}$ gives the same $H$. The arc is **singular**, and the control on it is found by differentiating $S \equiv 0$ repeatedly until $\mathbf{u}$ reappears, then solving. Singular arcs are not exotic: minimum-propellant problems with a throttleable engine and drag, and maximum-range atmospheric trajectories, routinely contain them, and they show up as intermediate throttle settings in the middle of an otherwise bang-bang profile. A numerical solution that shows the control chattering rapidly between its limits over an interval is usually a singular arc being approximated badly.

::: warning The minimum principle is necessary, not sufficient
Like the KKT conditions it generalises, the principle identifies candidates. A trajectory satisfying all four conditions is an extremal; it may be a minimum, a maximum, or neither. Practically: solve the boundary value problem, then check that the switching structure you assumed is consistent with the costates you obtained (the landing example above does exactly that), check $H \equiv 0$ if the final time is free, compare the cost against other candidate structures, and where possible verify with a direct method. A converged shooting solution is an answer to the necessary conditions, not a proof of optimality — and for a nonconvex problem there is generally no such proof available.
:::

::: note The costate is the multiplier, and it still prices the constraint
$\boldsymbol{\lambda}(t)$ is the Lagrange multiplier on the dynamics, imposed at every instant instead of at a point, and it keeps the shadow-price reading from the finite-dimensional theory: $\boldsymbol{\lambda}(t) = \partial J^\star/\partial\mathbf{x}(t)$, the sensitivity of the remaining cost to a perturbation of the state. In the landing example $\lambda_h = 835.4$ says that one extra metre of altitude at ignition costs $835\,\mathrm{N\,s}$ of impulse, which is $0.30\,\mathrm{kg}$ of propellant at $I_{sp} = 282\,\mathrm{s}$ — a number a mission designer can use directly. This is also the connection to the value function: for LQR, $\boldsymbol{\lambda} = \mathbf{P}\mathbf{x}$ and $J^\star = \mathbf{x}^\top\mathbf{P}\mathbf{x}$, so the costate is the gradient of the cost-to-go, which is exactly what the dynamic programming route computed.
:::

## Check yourself

::: check
Why does the minimum principle say "minimises $H$" rather than "$\partial H/\partial\mathbf{u} = \mathbf{0}$", and when are the two the same?
:::

::: answer
Because a constrained minimum need not be a stationary point. If the admissible set $\mathcal{U}$ has a boundary and the minimiser lies on it, the gradient of $H$ with respect to $\mathbf{u}$ points out of the set and is nonzero — the same situation as an active inequality constraint in the KKT conditions, where the gradient of the objective is balanced by the constraint rather than vanishing. The two statements agree when the minimiser is in the interior of $\mathcal{U}$ and $H$ is differentiable there, which covers the unconstrained case, and in particular covers LQR, where $\mathcal{U} = \mathbb{R}^m$ and the strictly convex quadratic $H$ has its minimum at the stationary point. The extreme opposite case is $H$ linear in $\mathbf{u}$: then $\partial H/\partial\mathbf{u}$ is never zero (except on a singular arc) and the minimiser is always at a vertex of $\mathcal{U}$.
:::

::: check
Show that the minimum-time slew has at most one switch, using only the costate equations.
:::

::: answer
$H = 1 + \lambda_\theta\omega + \lambda_\omega u/J$ has no explicit $\theta$ dependence, so $\dot\lambda_\theta = -\partial H/\partial\theta = 0$ and $\lambda_\theta$ is a constant. Then $\dot\lambda_\omega = -\partial H/\partial\omega = -\lambda_\theta$, a constant, so $\lambda_\omega(t) = \lambda_\omega(0) - \lambda_\theta t$ is affine in $t$. The switching function is $S = \lambda_\omega/J$, also affine, and an affine function that is not identically zero changes sign at most once. Hence at most one switch. The same argument gives the general result for a chain of integrators driven by a bounded input: the switching function is a polynomial of degree $n-1$, so there are at most $n-1$ switches — the double integrator's one, a triple integrator's two.
:::

::: check
For the landing example, verify that $H = 0$ during the coast, and say what would be wrong if it were not.
:::

::: answer
During the coast $u = 0$, so $H = \lambda_h v - \lambda_v g$. Using $\lambda_h = 835.3563$ and $\lambda_v(t) = \lambda_v(t_1) + \lambda_h(t_1 - t)$ with $\lambda_v(t_1) = -25000$: at $t = 0$, $\lambda_v(0) = -25000 + 835.3563 \times 4.434443 = -21295.660$, and $v(0) = -250$, so the two terms are $\lambda_h v(0) = -208839.085$ and $-\lambda_v(0)g = +208839.085$, giving $H = 0$ to ten significant figures. If it were not zero the solution would be wrong in one of three ways: the problem is autonomous so $H$ must be constant, and the free final time forces that constant to be zero, so a nonzero $H$ means either the costate initial values are inconsistent, or the switching time is wrong, or the assumed structure (coast then burn) is not the optimal one. This is why $H \equiv 0$ is the first thing to print from any free-final-time shooting solver.
:::

::: check
A colleague's numerical solution of a minimum-propellant problem shows the throttle oscillating between its limits every few integration steps over a ten-second stretch. Diagnose it.
:::

::: answer
Almost certainly a singular arc. The switching function is close to zero over that interval, so the sign that determines the bang-bang control is being set by numerical noise, and the solver flips the throttle whenever the round-off does. The physical solution there is an intermediate throttle, found by differentiating $S \equiv 0$ with respect to time until the control appears explicitly and solving for it. The practical fixes are to detect the interval where $|S|$ falls below a tolerance and substitute the singular control, or to regularise by adding a small $\epsilon\|\mathbf{u}\|^2$ to the cost, which makes $H$ strictly convex in $\mathbf{u}$ and replaces the chatter with a smooth intermediate value at the price of a slightly suboptimal answer. Diagnose before fixing: plot $S(t)$ and confirm it is near zero across the whole interval rather than crossing repeatedly, which would be a genuine multi-switch structure.
:::

::: check
The landing example gave $\lambda_h = 835.4$. Interpret it, and use it to price a change in the ignition trigger.
:::

::: answer
$\lambda_h$ is the costate on altitude, so by the shadow-price reading it is the sensitivity of the remaining cost — here total impulse, in newton-seconds — to a one-metre perturbation in altitude: $\partial J^\star/\partial h = 835.4\,\mathrm{N\,s/m}$. Igniting one metre higher than optimal therefore costs about $835\,\mathrm{N\,s}$, which at $I_{sp} = 282\,\mathrm{s}$ is $835.4/(282 \times 9.80665) = 0.302\,\mathrm{kg}$ of propellant. A guidance implementation that triggers ignition on an altitude threshold with a $\pm 20\,\mathrm{m}$ dispersion is therefore accepting roughly $\pm 6\,\mathrm{kg}$ of propellant variation from that source alone, which can be compared directly against the cost of a better altimeter. The sign convention matters: $\lambda_h > 0$ here because the problem is posed with $h$ decreasing, so more altitude remaining at the switch means more braking still to buy.
:::

## Summary

| Object | Statement |
| --- | --- |
| Problem | $\min\ \phi(\mathbf{x}(t_f)) + \int L\,dt$ s.t. $\dot{\mathbf{x}} = \mathbf{f}(\mathbf{x},\mathbf{u},t)$, $\mathbf{u}(t) \in \mathcal{U}$ |
| Hamiltonian | $H = L + \boldsymbol{\lambda}^\top\mathbf{f}$ |
| State and costate | $\dot{\mathbf{x}} = \partial H/\partial\boldsymbol{\lambda}$, $\dot{\boldsymbol{\lambda}} = -\partial H/\partial\mathbf{x}$ |
| Minimum condition | $H(\mathbf{x}^\star,\mathbf{u}^\star,\boldsymbol{\lambda}^\star) \le H(\mathbf{x}^\star,\mathbf{u},\boldsymbol{\lambda}^\star)$ for all $\mathbf{u}\in\mathcal{U}$ |
| Transversality | $\boldsymbol{\lambda}(t_f) = \partial\phi/\partial\mathbf{x}$; free $t_f$ adds $H(t_f) = 0$ |
| Autonomous problems | $H$ is constant along an optimal trajectory; zero if $t_f$ is free |
| Control-affine case | $H$ linear in $u$; $u^\star$ at a limit, switching on $\mathrm{sgn}\,S(t)$ |
| Minimum-time slew | One switch; $t_1 = \sqrt{\theta_f J/u_{\max}} = 2.8025\,\mathrm{s}$, $t_f = 5.6050\,\mathrm{s}$, peak rate $10.70^\circ/\mathrm{s}$ |
| Switching curve | $e + J\omega\lvert\omega\rvert/(2u_{\max}) = 0$ |
| Minimum-propellant landing | Coast then burn; $t_1 = 4.434\,\mathrm{s}$, ignite at $1795\,\mathrm{m}$ and $-293.5\,\mathrm{m/s}$, burn $12.232\,\mathrm{s}$, $\Delta v = 413.4\,\mathrm{m/s}$ |
| Its costates | $\lambda_v(t_1) = -m$, $\lambda_v(t_f) = -T_{\max}/a$, $\lambda_h = 835.4\,\mathrm{N\,s/m}$ |
| LQR | $\mathcal{U} = \mathbb{R}^m$ and $H$ strictly convex quadratic, so the minimisation is stationarity |
| Singular arc | $S \equiv 0$ on an interval; differentiate until $\mathbf{u}$ reappears |
| Status | Necessary conditions only; check the structure, check $H$, compare candidates |

The last lesson takes the general problem back to a computation. Linearise the dynamics and quadratise the cost about a current guess, solve the resulting time-varying LQR problem, and iterate — which is how nonlinear trajectory optimisation is done in practice.
