---
id: l13-pontryagin-minimum-principle
title: The Hamiltonian and the Pontryagin minimum principle
minutes: 22
covers:
  - The Hamiltonian and the Pontryagin minimum principle as the general frame
---

You are at a red light, and you want to reach the next light, 200 meters away, and stop there in the least time. Floor the gas, then at exactly the right moment slam the brakes. You spend the whole trip at one limit or the other, and the only decision is *when to switch*.

Everything in this module so far has been the easy case: linear dynamics, quadratic cost, a control of any size, and a best control found by setting a derivative to zero. Real vehicles are not that kind. A thruster is either on or off. An engine throttles between 40 and 100 percent and nowhere below. A gimbal hits a hard stop at 8 degrees. And the dynamics of an orbit have a $1/r^2$ in them.

The **[[Pontryagin minimum principle|pontryagin-history]]** is the general theory, and LQR is one special case inside it. It keeps two things from the calculus-of-variations derivation of the second lesson: the Hamiltonian and the costate. And it replaces "set $\partial H/\partial\mathbf{u}$ to zero" with something stronger: **the optimal control minimizes the Hamiltonian at every instant, over the controls you are allowed to use**. When any control is allowed and the Hamiltonian is a bowl-shaped quadratic, that gives back the LQR answer. When the allowed controls have edges, the best control sits on an edge. That is where the floor-it-then-brake profiles come from — the **bang-bang** and bang-off-bang profiles that minimum-time slews and minimum-propellant landing burns actually fly.

You have met the machinery before, in the optimization module. The costate is the Lagrange multiplier on the dynamics, and picking the control at each instant is the continuous-time version of choosing which constraints are active.

## The general problem

Here is the problem, with nothing assumed linear or quadratic. Minimize

$$
J = \phi\big(\mathbf{x}(t_f), t_f\big) + \int_{t_0}^{t_f} L\big(\mathbf{x}(t), \mathbf{u}(t), t\big)\,dt
$$

subject to the dynamics $\dot{\mathbf{x}} = \mathbf{f}(\mathbf{x},\mathbf{u},t)$, with the start $\mathbf{x}(t_0)$ given.

Read it as a bill with two lines:

- the **running cost** $L$ ("L"), a charge per second while you fly — seconds of flight time, or kilograms of propellant burned per second. It is also called the **[[Lagrange|mayer-lagrange]]** cost.
- the **terminal cost** $\phi$ ("phi"), a one-time charge at the end for where you finish. It is also called the Mayer cost.

The final state $\mathbf{x}(t_f)$ may be free, fixed ("land at zero altitude and zero speed"), or required to lie on some surface. The final time $t_f$ may be fixed or free.

The new ingredient is a rule about the control itself:

$$
\mathbf{u}(t) \in \mathcal{U} \subseteq \mathbb{R}^m \quad\text{for every } t.
$$

The curly $\mathcal{U}$ (read "script U") is the **admissible set** — the list of controls the hardware can actually deliver. Here $m$ is the number of control inputs, and $\mathbb{R}^m$ is the set of all lists of $m$ real numbers. $\mathcal{U}$ can be a box (each throttle between its limits), a cone (a gimbaled engine's thrust direction), a sphere, or even two points (a valve that is open or shut).

## The Hamiltonian and the four conditions

Think of the costate as a price tag on the state. At every instant, $\boldsymbol{\lambda}(t)$ ("lambda of t") says how much the rest of the trip will cost you per unit of each state variable. Then one number sums up "what this instant is costing me":

$$
H(\mathbf{x},\mathbf{u},\boldsymbol{\lambda},t) = L(\mathbf{x},\mathbf{u},t) + \boldsymbol{\lambda}^\top\mathbf{f}(\mathbf{x},\mathbf{u},t).
$$

This is the **[[Hamiltonian|hamiltonian-name]]**. The first term is what you pay right now. The second is how fast the state is changing, $\mathbf{f}$, times its price — the cost you are piling up for later. The **costate** $\boldsymbol{\lambda}(t) \in \mathbb{R}^n$ has one entry per state, so $n$ entries in all.

Pontryagin's result says: along an optimal trajectory $(\mathbf{x}^\star, \mathbf{u}^\star)$ (the star, read "star", marks the optimal one) there is a costate $\boldsymbol{\lambda}^\star$ such that all four of these hold.

1. **State equation.** $\dot{\mathbf{x}}^\star = \partial H/\partial\boldsymbol{\lambda} = \mathbf{f}(\mathbf{x}^\star,\mathbf{u}^\star,t)$. This is the dynamics, written in a symmetric way.
2. **Costate equation.** $\dot{\boldsymbol{\lambda}}^\star = -\partial H/\partial\mathbf{x}$, evaluated on the optimal trajectory. The prices change as you move.
3. **Minimum condition.** For every $t$ and every admissible $\mathbf{u} \in \mathcal{U}$,
$$
H\big(\mathbf{x}^\star,\mathbf{u}^\star,\boldsymbol{\lambda}^\star,t\big) \;\le\; H\big(\mathbf{x}^\star,\mathbf{u},\boldsymbol{\lambda}^\star,t\big).
$$
At each instant, the optimal control is the allowed control that makes $H$ smallest.
4. **[[Transversality|transversality-word]].** These are the end conditions. With a free terminal state, $\boldsymbol{\lambda}(t_f) = \partial\phi/\partial\mathbf{x}\big|_{t_f}$: the price at the end is the slope of the end penalty. With the terminal state fixed, $\boldsymbol{\lambda}(t_f)$ is free, and the constraint on the state pins it down instead. With a free final time, add $H(t_f) = -\partial\phi/\partial t\big|_{t_f}$. For a $\phi$ that does not depend on time, that is $H(t_f) = 0$.

::: key Pontryagin minimum principle
With $H = L(\mathbf{x},\mathbf{u}) + \boldsymbol{\lambda}^\top\mathbf{f}(\mathbf{x},\mathbf{u})$: $\dot{\mathbf{x}} = \partial H/\partial\boldsymbol{\lambda}$, $\dot{\boldsymbol{\lambda}} = -\partial H/\partial\mathbf{x}$, and $\mathbf{u}^\star$ minimizes $H$ pointwise over the admissible set. LQR is the case where that minimization is a solvable quadratic.
:::

"Pointwise" means one instant at a time. At each $t$, with $\mathbf{x}$ and $\boldsymbol{\lambda}$ frozen, you solve a small problem: which allowed $\mathbf{u}$ gives the lowest $H$?

### H stays constant

One more result is worth carrying away. If neither $\mathbf{f}$ nor $L$ depends on time directly — the problem is **autonomous** — then along an optimal trajectory $H$ does not change. It is constant. If the final time is also free, condition 4 says $H(t_f) = 0$, so $H$ is zero the whole way: $H \equiv 0$ (the three-bar sign, read "identically equal", means "at every instant").

That is a free check on any numerical solution: print $H$ along it, and if it is not flat, something is wrong.

::: note Why H cannot change
Take the time derivative of $H$ along the optimal trajectory, using the chain rule on each argument:

$$
\frac{dH}{dt} = \frac{\partial H}{\partial\mathbf{x}}^\top\dot{\mathbf{x}} + \frac{\partial H}{\partial\boldsymbol{\lambda}}^\top\dot{\boldsymbol{\lambda}} + \frac{\partial H}{\partial\mathbf{u}}^\top\dot{\mathbf{u}}
= -\dot{\boldsymbol{\lambda}}^\top\dot{\mathbf{x}} + \dot{\mathbf{x}}^\top\dot{\boldsymbol{\lambda}} + 0 = 0.
$$

Step by step. There is no $\partial H/\partial t$ term, because the problem is autonomous. In the first term, the costate equation says $\partial H/\partial\mathbf{x} = -\dot{\boldsymbol{\lambda}}$. In the second, the state equation says $\partial H/\partial\boldsymbol{\lambda} = \dot{\mathbf{x}}$. Those two cancel exactly. The third term is zero: where the minimum is inside $\mathcal{U}$, $\partial H/\partial\mathbf{u} = \mathbf{0}$, and where the control sits on a limit, it is not moving, so $\dot{\mathbf{u}} = \mathbf{0}$. (At the instant of a jump the careful argument uses the fact that $H$ has the same value on both sides of a switch; the conclusion is the same.)
:::

## Minimum, not stationarity

Picture a straight road that runs uphill, and you want the lowest point on the stretch between two fences. The road is never flat, so the lowest point is at the bottom fence, where the slope is not zero. You are pressed against the limit.

The same is true of condition 3. If every control is allowed ($\mathcal{U} = \mathbb{R}^m$) and $H$ is smooth, the lowest point is a place where the slope is zero, and "minimize $H$" agrees with "$\partial H/\partial\mathbf{u} = \mathbf{0}$". If $\mathcal{U}$ is a box, the minimizer is usually on its edge, and the slope there is not zero. 

The important case is when $H$ is a straight line in $\mathbf{u}$ — **linear** in the control. That happens whenever the dynamics are affine in the control (the control enters as "something times $\mathbf{u}$ plus something else") and the running cost is too. Two problems engineers care most about qualify: minimum time, where $L = 1$, and minimum propellant, where $L = \|\mathbf{u}\|$ (the size of the thrust).

For a single control $u$, write $H$ as

$$
H = (\text{terms without } u) + S(t)\,u .
$$

The number $S(t)$ multiplying $u$ is called the **switching function**, and it decides everything:

$$
u^\star(t) = \begin{cases} u_{\min}, & S(t) > 0\\ u_{\max}, & S(t) < 0.\end{cases}
$$

If $S$ is positive, $H$ grows with $u$, so pick the smallest $u$ allowed; if negative, the largest. The control sits at a limit at all times — **[[bang-bang|linear-minimum]]** — and the whole problem becomes one question: when does $S$ change sign?

::: example Minimum-time slew of a spacecraft axis
Turn one axis of a spacecraft as fast as possible. The inertia is $J = 120\,\mathrm{kg\,m^2}$ (here $J$ is the moment of inertia, not the cost). The reaction wheel torque is limited to $|u| \le 8\,\mathrm{N\,m}$. Start at rest, turn $30^\circ$, and end at rest. The states are angle $\theta$ and rate $\omega$, with $\dot\theta = \omega$ and $\dot\omega = u/J$.

**Set up the problem.** Minimum time means the bill is one unit per second, so $L = 1$, $\phi = 0$, and $t_f$ is free.

$$
H = 1 + \lambda_\theta\,\omega + \lambda_\omega\,\frac{u}{J}, \qquad S(t) = \frac{\lambda_\omega(t)}{J}, \qquad u^\star = -u_{\max}\,\mathrm{sgn}\,S .
$$

Here $\mathrm{sgn}$ ("sign") is $+1$ for a positive number and $-1$ for a negative one.

**Find the shape of the costates.** $H$ has no $\theta$ in it, so $\dot\lambda_\theta = -\partial H/\partial\theta = 0$: $\lambda_\theta$ is a constant. Next, $\dot\lambda_\omega = -\partial H/\partial\omega = -\lambda_\theta$, a constant, so $\lambda_\omega$ is a **straight line in time**. A straight line crosses zero at most once. So the best profile has exactly one switch: full torque forward, then full torque backward.

**Find the switch time.** The two halves mirror each other, so the switch comes at the halfway angle, $\theta_{sw} = 15^\circ = 0.26180\,\mathrm{rad}$. Starting from rest at constant acceleration $u_{\max}/J$, the angle after time $t_1$ is $\theta_{sw} = \tfrac12(u_{\max}/J)t_1^2$. Solve for $t_1$, using $\theta_f = 2\theta_{sw} = 0.52360\,\mathrm{rad}$:

$$
t_1 = \sqrt{\frac{\theta_f J}{u_{\max}}} = \sqrt{\frac{0.52360 \times 120}{8}} = 2.8025\,\mathrm{s},
\qquad t_f = 2t_1 = 5.6050\,\mathrm{s}.
$$

The peak rate, at the switch, is $(u_{\max}/J)t_1 = 0.18683\,\mathrm{rad/s} = 10.70^\circ/\mathrm{s}$. Integrating the bang-bang profile numerically lands on $30.0000^\circ$ with a leftover rate below $10^{-10}\,\mathrm{rad/s}$ — it stops right on target, as it should.

**Find the costates.** They are not free to choose; the conditions fix them. $S(t_1) = 0$ at the switch, so $\lambda_\omega(t_1) = 0$. The free-final-time condition says $H \equiv 0$. At $t = 0$, $\omega = 0$ and $u = +u_{\max}$, so $1 + \lambda_\omega(0)u_{\max}/J = 0$. The straight line $\lambda_\omega(t) = \lambda_\omega(0) - \lambda_\theta t$ must reach zero at $t_1$, which fixes $\lambda_\theta$:

$$
\lambda_\omega(0) = -\frac{J}{u_{\max}} = -15.000,
\qquad \lambda_\theta = \frac{\lambda_\omega(0)}{t_1} = -5.3524 .
$$

Sanity check: $\lambda_\omega(0) < 0$ makes $S < 0$ at the start, calling for full torque forward, as assumed. Evaluating $H$ at $t = 0$, $1$, $2.8025$, $4$ and $5.605\,\mathrm{s}$ gives $0$ to within $6\times10^{-17}$ every time. That is the check the constancy of $H$ buys you.

**The version that flies.** Onboard, you want a rule that looks at the state, not the clock. The states from which full braking torque stops you exactly on target form a curve, the **[[switching curve|switching-curve-picture]]**:

$$
e + \frac{J\,\omega|\omega|}{2u_{\max}} = 0, \qquad e = \theta - \theta_f,
$$

where $e$ is the pointing error. The rule "full torque, with the sign that pushes you toward this curve, and flip when you reach it" is the classic time-optimal phase-plane controller. At the computed switch point, $e = -0.26180$ and $\omega = 0.186833$, and the left side evaluates to zero within rounding.

**Two honest caveats.** The peak rate of $10.7^\circ/\mathrm{s}$ is far above the $2^\circ/\mathrm{s}$ slew budget this axis was tuned for earlier in the module. A real implementation adds a rate limit, making the profile accelerate–coast–decelerate. And pure bang-bang chatters near the target when sensors are noisy, so flight versions add a deadband or blend into a linear controller there.
:::

## Free final time and the switching structure

When $t_f$ is something you get to choose, condition 4 adds $H(t_f) = 0$. For an autonomous problem, that means $H \equiv 0$ everywhere. This one equation usually pins down the last unknown when you solve numerically by **shooting** — guessing the missing starting values, integrating forward, and adjusting the guess until the end conditions come out right.

::: example Minimum-propellant vertical landing
A booster is on its final descent. Altitude $h$ and vertical speed $v$ (up is positive) obey $\dot h = v$ and $\dot v = -g + u/m$, with $g = 9.80665\,\mathrm{m/s^2}$. Hold the mass constant at $m = 25\,000\,\mathrm{kg}$ to keep things simple. Thrust is limited to $u \in [0,\ T_{\max}]$ with $T_{\max} = 8.45\times10^{5}\,\mathrm{N}$. Minimize propellant. At fixed mass and specific impulse, propellant is proportional to total impulse (thrust times time), so $L = u$. Land with $h(t_f) = 0$ and $v(t_f) = 0$, with $t_f$ free.

**The Hamiltonian.** Group the terms with $u$:

$$
H = u + \lambda_h v + \lambda_v\left(-g + \frac{u}{m}\right)
= \lambda_h v - \lambda_v g + \underbrace{\left(1 + \frac{\lambda_v}{m}\right)}_{S(t)} u .
$$

$H$ is linear in $u$, so $u^\star = 0$ when $S > 0$ and $u^\star = T_{\max}$ when $S < 0$.

**The costates.** $\dot\lambda_h = -\partial H/\partial h = 0$, so $\lambda_h$ is constant. $\dot\lambda_v = -\partial H/\partial v = -\lambda_h$, so $\lambda_v$ is a straight line in $t$, and therefore so is $S$. **At most one switch.** Which order? A vehicle that burns first and coasts last is falling freely at the end, so it cannot arrive at rest. So the structure is coast, then burn: the single-burn profile landers call the **[[hoverslam|hoverslam]]**.

**The numbers.** During the burn the net deceleration is

$$
a = \frac{T_{\max}}{m} - g = 33.800 - 9.807 = 23.993\,\mathrm{m/s^2}.
$$

Start from $h_0 = 3000\,\mathrm{m}$ at $v_0 = -250\,\mathrm{m/s}$. The coast ends when the height left equals the braking distance, $h_1 = v_1^2/(2a)$. Solving that together with free fall for the coast gives

$$
t_1 = 4.4344\,\mathrm{s},\qquad h_1 = 1794.97\,\mathrm{m},\qquad v_1 = -293.487\,\mathrm{m/s}.
$$

The burn lasts $t_b = |v_1|/a = 12.2320\,\mathrm{s}$, so $t_f = 16.6665\,\mathrm{s}$. The impulse is $T_{\max}t_b = 1.034\times10^{7}\,\mathrm{N\,s}$. Divided by the mass, that is a $\Delta v$ of $413.4\,\mathrm{m/s}$. At a specific impulse of $I_{sp} = 282\,\mathrm{s}$, it takes $3738\,\mathrm{kg}$ of propellant.

Sanity check: $3738\,\mathrm{kg}$ is about $15\,\%$ of the vehicle mass — that is how far off the constant-mass assumption is, and why real solutions carry mass as a state.

**The costates confirm the structure.** At $t_f$, with $v = 0$ and $u = T_{\max}$, $H = 0$ gives $\lambda_v(t_f) = -T_{\max}/a = -35218$. So $S(t_f) = 1 + \lambda_v(t_f)/m = -0.4087 < 0$: burning, as required. At the switch, $S = 0$ forces $\lambda_v(t_1) = -m = -25000$. Those two values fix the slope of the line, $\dot\lambda_v = -835.36\,\mathrm{s^{-1}}$, and hence $\lambda_h = 835.36$. Running back to the start gives $S(0) = +0.1482 > 0$: coasting, as required. Every sign is worked out; none is assumed.

In the full three-dimensional landing problem, where the engine also has a minimum throttle above zero, the same reasoning gives a max–min–max thrust profile instead.
:::

## LQR as the special case

Now watch LQR drop out. Allow any control, $\mathcal{U} = \mathbb{R}^m$. Take linear dynamics $\mathbf{f} = \mathbf{A}\mathbf{x}+\mathbf{B}\mathbf{u}$, running cost $L = \tfrac12(\mathbf{x}^\top\mathbf{Q}\mathbf{x}+\mathbf{u}^\top\mathbf{R}\mathbf{u})$ and terminal cost $\phi = \tfrac12\mathbf{x}^\top\mathbf{Q}_f\mathbf{x}$. (The $\tfrac12$ is there to cancel the 2 that comes from differentiating a square; it does not change the answer.) Then

$$
H = \tfrac12\big(\mathbf{x}^\top\mathbf{Q}\mathbf{x}+\mathbf{u}^\top\mathbf{R}\mathbf{u}\big) + \boldsymbol{\lambda}^\top(\mathbf{A}\mathbf{x}+\mathbf{B}\mathbf{u}).
$$

Because $\mathbf{R} \succ 0$ (read "R is positive definite": every direction curves upward), $H$ is a bowl in $\mathbf{u}$, and the bottom of a bowl is where the slope is zero:

$$
\frac{\partial H}{\partial\mathbf{u}} = \mathbf{R}\mathbf{u} + \mathbf{B}^\top\boldsymbol{\lambda} = \mathbf{0}
\quad\Longrightarrow\quad
\mathbf{u}^\star = -\mathbf{R}^{-1}\mathbf{B}^\top\boldsymbol{\lambda}.
$$

The costate equation is $\dot{\boldsymbol{\lambda}} = -\partial H/\partial\mathbf{x} = -\mathbf{Q}\mathbf{x} - \mathbf{A}^\top\boldsymbol{\lambda}$, and transversality gives $\boldsymbol{\lambda}(t_f) = \mathbf{Q}_f\mathbf{x}(t_f)$. That is exactly the two-point boundary value problem of the second lesson. There, the sweep $\boldsymbol{\lambda} = \mathbf{P}\mathbf{x}$ turned it into the Riccati equation and $\mathbf{u} = -\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}\mathbf{x}$. LQR is the corner of this theory where the minimization has a closed-form answer and that answer collapses into a feedback gain.

That collapse is rare. In general the principle hands you a boundary value problem in $(\mathbf{x},\boldsymbol{\lambda})$ to solve numerically, one trajectory at a time, with no feedback law. That is why **trajectory optimization** and **feedback control** are separate jobs on a real vehicle. The optimizer designs the path. Time-varying LQR, from the earlier lesson, keeps the vehicle on it.

## Singular arcs

Sometimes the switching function does not merely cross zero — it sits at zero for a while. Then the minimum condition tells you nothing: every allowed $\mathbf{u}$ gives the same $H$, like a road that is perfectly flat between the fences. That stretch is a **[[singular arc|singular-goddard]]**.

To find the control on it, use the fact that $S \equiv 0$ over the whole stretch, so all its time derivatives are zero too. Keep differentiating $S$ until $\mathbf{u}$ shows up, then solve for it.

Singular arcs are not exotic. Minimum-propellant problems with a throttleable engine and drag often contain them, as an in-between throttle setting in the middle of an otherwise bang-bang profile. A numerical solution where the control flickers rapidly between its limits over some interval is usually a singular arc being approximated badly.

::: warning The minimum principle is necessary, not sufficient
Like the KKT conditions it generalizes, the principle finds **candidates**. A trajectory that satisfies all four conditions is called an **extremal**. It might be a minimum, a maximum, or neither. In practice: check that the switching structure you assumed matches the costates you got (as the landing example does), check $H \equiv 0$ if the final time is free, compare against other candidate structures, and where you can, confirm with a direct method. A converged shooting solution answers the necessary conditions; it is not a proof of optimality. For a nonconvex problem there is usually no such proof available.
:::

::: note The costate is the multiplier, and it still prices the state
$\boldsymbol{\lambda}(t)$ is the Lagrange multiplier on the dynamics, applied at every instant instead of at one point. It keeps the **[[shadow price|shadow-price]]** meaning from the optimization module: $\boldsymbol{\lambda}(t) = \partial J^\star/\partial\mathbf{x}(t)$, how much the best remaining cost changes if the state is nudged.

In the landing example, $\lambda_h = 835.4$. That says: if the vehicle is one meter higher than planned (at the same speed) at any point in the coast, the best landing from there costs $835\,\mathrm{N\,s}$ more impulse. At $I_{sp} = 282\,\mathrm{s}$ that is $835.4/(282 \times 9.80665) = 0.302\,\mathrm{kg}$ of propellant — a number a mission designer can use directly. You can confirm it by hand: the best cost from $(h, v)$ is $m(a+g)|v_1|/a$ with $v_1^2 = (v^2 + 2gh)\,a/(a+g)$, and its slope in $h$ is $mg/|v_1| = 835.36$.

This is also the link to dynamic programming. For LQR, $\boldsymbol{\lambda} = \mathbf{P}\mathbf{x}$ is the slope of the cost-to-go: with the $\tfrac12$ used here, $J^\star = \tfrac12\mathbf{x}^\top\mathbf{P}\mathbf{x}$, whose gradient is $\mathbf{P}\mathbf{x}$. So the costate is the gradient of the value function, the same object the HJB route computed.
:::

## Check yourself

::: check
Why does the minimum principle say "minimizes $H$" rather than "$\partial H/\partial\mathbf{u} = \mathbf{0}$", and when are the two the same?
:::

::: answer
A minimum with limits need not be a flat spot. If the admissible set $\mathcal{U}$ has a boundary and the minimizer lies on it, the gradient of $H$ with respect to $\mathbf{u}$ points out of the set and is not zero. That is the same situation as an active inequality constraint in the KKT conditions, where the gradient of the objective is balanced by the constraint instead of vanishing.

The two statements agree when the minimizer is inside $\mathcal{U}$ and $H$ is differentiable there. That covers the unconstrained case, and in particular LQR, where $\mathcal{U} = \mathbb{R}^m$ and the strictly convex quadratic $H$ has its minimum at the stationary point.

The opposite extreme is $H$ linear in $\mathbf{u}$. Then $\partial H/\partial\mathbf{u}$ is never zero (except on a singular arc), and the minimizer is always at a corner of $\mathcal{U}$.
:::

::: check
Show that the minimum-time slew has at most one switch, using only the costate equations.
:::

::: answer
$H = 1 + \lambda_\theta\omega + \lambda_\omega u/J$ does not contain $\theta$, so $\dot\lambda_\theta = -\partial H/\partial\theta = 0$ and $\lambda_\theta$ is a constant. Then $\dot\lambda_\omega = -\partial H/\partial\omega = -\lambda_\theta$, also a constant, so $\lambda_\omega(t) = \lambda_\omega(0) - \lambda_\theta t$ is a straight line in $t$. The switching function $S = \lambda_\omega/J$ is a straight line too. A straight line that is not zero everywhere changes sign at most once. Hence at most one switch.

The same argument for a chain of $n$ integrators with a bounded input gives a switching function that is a polynomial of degree $n-1$, so at most $n-1$ switches: one for the double integrator, two for a triple.
:::

::: check
For the landing example, verify that $H = 0$ during the coast, and say what would be wrong if it were not.
:::

::: answer
During the coast $u = 0$, so $H = \lambda_h v - \lambda_v g$. Use $\lambda_h = 835.3563$ and the straight line $\lambda_v(t) = \lambda_v(t_1) + \lambda_h(t_1 - t)$ with $\lambda_v(t_1) = -25000$.

At $t = 0$: $\lambda_v(0) = -25000 + 835.3563 \times 4.434443 = -21295.660$, and $v(0) = -250$. The two terms are $\lambda_h v(0) = -208839.085$ and $-\lambda_v(0)g = +208839.085$. They cancel: $H = 0$ to ten significant figures.

The problem is autonomous, so $H$ must be constant, and the free final time forces that constant to be zero. A nonzero $H$ would mean one of three things: the starting costate values are inconsistent, the switch time is wrong, or the assumed structure (coast then burn) is not the optimal one. That is why $H \equiv 0$ is the first thing to print from any free-final-time shooting solver.
:::

::: check
A colleague's numerical solution of a minimum-propellant problem shows the throttle flipping between its limits every few integration steps over a ten-second stretch. Diagnose it.
:::

::: answer
Almost certainly a singular arc. The switching function is close to zero over that interval, so the sign that picks the bang-bang control is being set by numerical noise, and the solver flips the throttle whenever the round-off flips.

The physical solution there is an in-between throttle, found by differentiating $S \equiv 0$ until the control appears.

Two practical fixes: detect where $|S|$ falls below a tolerance and substitute the singular control, or regularize by adding a small $\epsilon\|\mathbf{u}\|^2$ to the cost ($\epsilon$, "epsilon", a small positive number). That makes $H$ strictly convex in $\mathbf{u}$ and replaces the chatter with a smooth in-between value, at the price of a slightly suboptimal answer.

Diagnose before fixing: plot $S(t)$ and confirm it stays near zero across the interval rather than genuinely crossing zero many times.
:::

::: check
The landing example gave $\lambda_h = 835.4$. Interpret it, and use it to price a navigation error in altitude.
:::

::: answer
$\lambda_h$ is the costate on altitude, so by the shadow-price reading it is the slope of the best remaining cost — here total impulse, in newton-seconds — with respect to altitude: $\partial J^\star/\partial h = 835.4\,\mathrm{N\,s/m}$.

If the vehicle is one meter higher than planned, at the same speed, re-planning costs about $835\,\mathrm{N\,s}$ more. At $I_{sp} = 282\,\mathrm{s}$ that is $835.4/(282 \times 9.80665) = 0.302\,\mathrm{kg}$ of propellant. So a $\pm 20\,\mathrm{m}$ altitude dispersion at the start of descent is worth roughly $\pm 6\,\mathrm{kg}$ of propellant from that source alone — a number you can set directly against the cost of a better altimeter.

It is positive because extra altitude means a longer fall before the burn, so there is more speed to kill. Note what $\lambda_h$ does *not* price: igniting at the wrong moment from the planned state. That is a timing error on the optimal path, and it has to be priced by re-solving, not from the costate.
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
| LQR | $\mathcal{U} = \mathbb{R}^m$ and $H$ strictly convex quadratic, so the minimization is stationarity |
| Singular arc | $S \equiv 0$ on an interval; differentiate until $\mathbf{u}$ reappears |
| Status | Necessary conditions only; check the structure, check $H$, compare candidates |

The last lesson turns the general problem back into a computation. Linearize the dynamics and take a quadratic model of the cost about a current guess, solve the resulting time-varying LQR problem, and repeat. That is how nonlinear trajectory optimization is done in practice.

::: context pontryagin-history Who Pontryagin was
Lev Pontryagin was a Soviet mathematician who lost his sight in an accident at age 14 and went on to become one of the leading mathematicians of his century. In the 1950s he and his colleagues Boltyanskii, Gamkrelidze and Mishchenko worked out this principle, and their book *The Mathematical Theory of Optimal Processes* appeared in the early 1960s. They wrote it as a **maximum** principle, because they defined the Hamiltonian with the opposite sign. Flip the sign and "maximize" becomes "minimize" — same result, different bookkeeping. You will see both names in the literature.
:::

::: context mayer-lagrange Three names for the same bill
The two ways of charging for a trip have old names. A cost that is only an integral of a running charge is a **problem of Lagrange**. A cost that is only a charge on the final state is a **problem of Mayer**, after the 19th-century German mathematician Adolph Mayer. A cost with both, like the $J$ in this lesson, is a **problem of Bolza**. The three are interchangeable: you can always turn a running cost into a terminal one by adding an extra state that accumulates it, $\dot x_{n+1} = L$, and charging for $x_{n+1}(t_f)$.
:::

::: context hamiltonian-name Why it is called the Hamiltonian
The name comes from William Rowan Hamilton, the 19th-century Irish mathematician who rewrote mechanics using a function $H$ of positions and momenta. In mechanics, $\dot q = \partial H/\partial p$ and $\dot p = -\partial H/\partial q$ — the same pattern as the state and costate equations here, with the costate playing the part of momentum. And as a mechanical system's energy $H$ stays constant when nothing depends on time, the optimal-control $H$ stays constant along an optimal path of an autonomous problem. Same algebra, same conservation law.
:::

::: context transversality-word Where "transversality" comes from
In the old calculus of variations, a curve that must end somewhere on a given surface has to meet that surface in a particular way — for the shortest path from a point to a line, it meets the line at a right angle, crossing it "transversally". The end conditions that encode this came to be called transversality conditions, and the name stuck for all the end conditions on the costate, even the simple ones like $\boldsymbol{\lambda}(t_f) = \partial\phi/\partial\mathbf{x}$.
:::

::: context linear-minimum The lowest point on a straight line
When $H$ is a straight line in $u$, its lowest point over the allowed range is always at one end. Which end depends only on the sign of the slope $S$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="130" x2="160" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="200" y1="130" x2="330" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="30" x2="40" y2="135" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="150" y1="30" x2="150" y2="135" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="210" y1="30" x2="210" y2="135" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="320" y1="30" x2="320" y2="135" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="40" y1="110" x2="150" y2="45" stroke="#1d6fd1" stroke-width="3"/>
  <line x1="210" y1="45" x2="320" y2="110" stroke="#1d6fd1" stroke-width="3"/>
  <circle cx="40" cy="110" r="6" fill="#b4232c"/>
  <circle cx="320" cy="110" r="6" fill="#b4232c"/>
  <text x="40" y="150" font-size="12" text-anchor="middle" fill="#1f2a44">u min</text>
  <text x="150" y="150" font-size="12" text-anchor="middle" fill="#1f2a44">u max</text>
  <text x="210" y="150" font-size="12" text-anchor="middle" fill="#1f2a44">u min</text>
  <text x="320" y="150" font-size="12" text-anchor="middle" fill="#1f2a44">u max</text>
  <text x="95" y="22" font-size="12" text-anchor="middle" fill="#1f2a44">S &gt; 0: pick u min</text>
  <text x="265" y="22" font-size="12" text-anchor="middle" fill="#1f2a44">S &lt; 0: pick u max</text>
  <text x="95" y="166" font-size="11" text-anchor="middle" fill="#6c7a93">H against u</text>
  <text x="265" y="166" font-size="11" text-anchor="middle" fill="#6c7a93">H against u</text>
</svg>
```

The slope is never zero at the chosen end — which is exactly why "set the derivative to zero" fails here.
:::

::: context switching-curve-picture The slew in the phase plane
Plot pointing error $e$ across and rate $\omega$ up. The red curve is the switching curve $e = -7.5\,\omega|\omega|$ (here $J/(2u_{\max}) = 7.5\,\mathrm{s^2}$). The slew starts at $e = -0.524\,\mathrm{rad}$ at rest, speeds up at full torque along a parabola, meets the curve at $e = -0.262$, $\omega = 0.187\,\mathrm{rad/s}$, and brakes along it into the target.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="100" x2="345" y2="100" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="240" y1="12" x2="240" y2="180" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="340" y="116" font-size="12" text-anchor="end" fill="#1f2a44">e</text>
  <text x="248" y="22" font-size="12" fill="#1f2a44">ω</text>
  <polyline fill="none" stroke="#b4232c" stroke-width="2" stroke-dasharray="6 3" points="83.8,20.0 96.0,23.2 107.7,26.4 119.0,29.6 129.8,32.8 140.0,36.0 149.8,39.2 159.0,42.4 167.8,45.6 176.0,48.8 183.8,52.0 191.0,55.2 197.7,58.4 204.0,61.6 209.8,64.8 215.0,68.0 219.8,71.2 224.0,74.4 227.8,77.6 231.0,80.8 233.8,84.0 236.0,87.2 237.7,90.4 239.0,93.6 239.7,96.8 240.0,100.0 240.2,103.2 241.0,106.4 242.2,109.6 244.0,112.8 246.2,116.0 249.0,119.2 252.2,122.4 256.0,125.6 260.2,128.8 265.0,132.0 270.2,135.2 276.0,138.4 282.2,141.6 289.0,144.8 296.2,148.0 304.0,151.2 312.2,154.4 321.0,157.6 330.2,160.8 340.0,164.0"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="3" points="65.5,100.0 66.5,93.4 69.8,86.7 75.2,80.1 82.7,73.4 92.4,66.8 104.3,60.1 118.3,53.5 134.4,46.9 152.7,40.2"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="3" points="152.7,40.2 171.1,46.9 187.2,53.5 201.2,60.1 213.1,66.8 222.8,73.4 230.3,80.1 235.7,86.7 238.9,93.4 240.0,100.0"/>
  <circle cx="65.5" cy="100" r="4.5" fill="#1f2a44"/>
  <circle cx="152.7" cy="40.2" r="4.5" fill="#1f2a44"/>
  <circle cx="240" cy="100" r="4.5" fill="#1f2a44"/>
  <text x="65.5" y="118" font-size="11" text-anchor="middle" fill="#1f2a44">start −0.52</text>
  <text x="152.7" y="118" font-size="11" text-anchor="middle" fill="#1f2a44">−0.26</text>
  <line x1="152.7" y1="100" x2="152.7" y2="45" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="100" y="140" font-size="11" text-anchor="middle" fill="#1d6fd1">+8 N m, then −8 N m</text>
  <text x="300" y="186" font-size="11" text-anchor="middle" fill="#b4232c">switching curve</text>
  <text x="160" y="30" font-size="11" fill="#1f2a44">switch</text>
</svg>
```

Onboard, the controller only asks which side of the red curve it is on.
:::

::: context hoverslam Why boosters cannot hover
A nearly empty Falcon 9 first stage returning to land is so light that even one engine at its lowest throttle pushes harder than the stage weighs. It cannot hover; if it lit early it would slow down, stop in midair and start climbing. So the burn must be timed to reach zero speed at zero height, the "hoverslam" or "suicide burn". The switching function tells the story: positive while coasting, crossing zero at ignition, negative through the burn.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <rect x="40" y="25" width="79.8" height="145" fill="#8fb8f0" opacity="0.35"/>
  <rect x="119.8" y="25" width="220.1" height="145" fill="#f2b880" opacity="0.35"/>
  <line x1="40" y1="80" x2="345" y2="80" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="40" y1="20" x2="40" y2="172" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="40" y1="50.4" x2="339.9" y2="161.7" stroke="#1d6fd1" stroke-width="3"/>
  <circle cx="119.8" cy="80" r="4.5" fill="#b4232c"/>
  <text x="44" y="42" font-size="12" fill="#1f2a44">S(0) = +0.148</text>
  <text x="240" y="164" font-size="12" text-anchor="middle" fill="#1f2a44">S(t_f) = −0.409</text>
  <text x="80" y="110" font-size="12" text-anchor="middle" fill="#1f2a44">coast</text>
  <text x="80" y="125" font-size="11" text-anchor="middle" fill="#1f2a44">u = 0</text>
  <text x="250" y="60" font-size="12" text-anchor="middle" fill="#1f2a44">burn, u = T max</text>
  <text x="119.8" y="186" font-size="11" text-anchor="middle" fill="#1f2a44">4.43 s</text>
  <text x="339.9" y="186" font-size="11" text-anchor="end" fill="#1f2a44">16.67 s</text>
  <text x="34" y="84" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
</svg>
```
:::

::: context singular-goddard The first famous singular arc
In 1919 Robert Goddard asked how a rocket climbing through the air should use its fuel to go as high as possible. Burn too hard low down and you waste energy fighting air drag at high speed; burn too gently and you waste it holding the rocket up against gravity. The answer, worked out properly decades later with the tools of this lesson, is not bang-bang: after an initial full-thrust phase there is a stretch of in-between thrust that balances drag against gravity — a singular arc — followed by a coast. It is still a standard test problem for trajectory optimizers.
:::

::: context shadow-price Prices on the state
In the optimization module, a Lagrange multiplier told you how much the best cost would change if you loosened a constraint a little. The costate is the same idea stretched over time: one price per state per instant. Here that means a price in newton-seconds per meter of altitude. When engineers argue about whether a sensor upgrade is worth its mass, a number like this is what settles it.
:::
