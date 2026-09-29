---
id: l03-pontryagin-transversality
title: "Pontryagin's Minimum Principle: why minimize, and transversality in full"
minutes: 24
covers:
  - "Pontryagin's Minimum Principle, the stationarity condition, and transversality conditions"
---

Picture a playground slide. Where is its lowest point? Not somewhere in the middle, where the surface is flat — a slide has no flat spot. The lowest point is the very bottom end, where the slide stops. The ground there is still sloping; it is the lowest point only because you are not allowed to go any further.

The last lesson found the best control by looking for a flat spot: $\partial H/\partial\mathbf{u}=\mathbf{0}$, the slope of the Hamiltonian with respect to the control is zero. That works when the control can move freely. Real controls cannot. A throttle cannot go past $100\,\%$ or below zero. A rocket nozzle's gimbal hits a mechanical stop. A thruster is either firing or not. On all of these, the best setting is often right at the limit — the bottom of the slide — where the slope is *not* zero, and the flat-spot rule has nothing to say.

The fix is one of the most important results in all of guidance: **[[Pontryagin's|pontryagin]] Minimum Principle**. It says the best control does not merely make the Hamiltonian flat. It makes the Hamiltonian as **small as possible** over every control you are allowed to use. This lesson shows why, adds a second-order check that catches a nasty class of bugs, proves the Hamiltonian stays constant along a best flight, and finishes the final-time conditions with a target that moves.

## The rule: make the Hamiltonian as small as possible

First, name the allowed controls. The **admissible set** $\mathcal{U}$ (a curly U) is the set of every control value you are physically allowed to command — for example, every thrust between $0$ and $T_{\max}$, or every point inside a **[[box of limits|admissible-box]]**. A control inside $\mathcal{U}$ is called **admissible**.

The principle says: at every instant, look at the Hamiltonian with the state and costate frozen at their best values, try every admissible control, and pick the one that gives the smallest $H$.

::: key Pontryagin's Minimum Principle
Along an optimal trajectory, $\mathbf{u}^\star(t) = \operatorname*{argmin}_{\mathbf{u}\in\mathcal{U}} H(\mathbf{x}^\star(t),\mathbf{u},\mathbf{p}^\star(t),t)$ for every $t$, with $H=L+\mathbf{p}^\top\mathbf{f}$, $\dot{\mathbf{x}}^\star=\partial H/\partial\mathbf{p}$, $\dot{\mathbf{p}}^\star=-\partial H/\partial\mathbf{x}$ (these lessons write the costate $\boldsymbol\lambda$). It is stronger than $\partial H/\partial\mathbf{u}=\mathbf{0}$: the minimum condition still holds when $\mathbf{u}^\star$ sits on a bound of $\mathcal{U}$, where the slope of $H$ need not vanish.
:::

Read **[[argmin|argmin]]** as "the argument that minimizes": not the smallest value of $H$, but the control that produces it. The star, as in $\mathbf{x}^\star$, marks the best (optimal) flight. And $\dot{\mathbf{x}}^\star=\partial H/\partial\mathbf{p}$ is the dynamics in disguise: $H = L + \mathbf{p}^\top\mathbf{f}$, so its slope with respect to $\mathbf{p}$ is $\mathbf{f}$.

A tiny case shows the difference. Suppose a thrust $T$ between $0$ and $6000\,\mathrm{N}$ enters the Hamiltonian as $H = (\text{terms without }T) + S\,T$, where $S$ is some number set by the costates — say $S = -0.0005$. The slope of $H$ with respect to $T$ is $S$, which is not zero for any $T$. Stationarity finds nothing. But minimizing is easy: $S$ is negative, so every extra newton lowers $H$, and the smallest $H$ is at $T = 6000\,\mathrm{N}$, the top of the allowed range. That is the bottom of the slide. Lesson five builds on exactly this, calling $S$ the **switching function**.

## Why minimize: try something wild, briefly

Here is the intuition. Take the best flight. At some instant $\tau$ ("tau"), throw in a completely different control $\mathbf{v}$ — any admissible value at all, even the opposite limit — but only for a split second, $\varepsilon$ ("epsilon") long. Then go back to the best control. This is a **[[needle variation|needle]]**: a thin spike in the control history.

The spike is so short that it barely moves the state, so every effect is small and easy to add up. Because $\mathbf{v}$ can be *anything* admissible, not only something near the best control, the test reaches every corner of $\mathcal{U}$. The result, proved in the note below, is that the spike changes the total cost by

$$
\delta J \approx \varepsilon\Big[H(\mathbf{x}^\star,\mathbf{v},\boldsymbol\lambda,\tau) - H(\mathbf{x}^\star,\mathbf{u}^\star,\boldsymbol\lambda,\tau)\Big].
$$

In words: the Hamiltonian is the *price per second* of using a control, counting both what it costs right now and where it pushes the state. If some other control $\mathbf{v}$ had a lower $H$, a spike of it would lower the total cost, and the flight would not have been the best. So no admissible control can beat the best one on $H$. That is the minimum principle.

::: note Why it has to be true: the needle variation
Fix an instant $\tau$ inside the flight and a short length $\varepsilon>0$. Replace the best control on $[\tau,\tau+\varepsilon]$ with a constant admissible $\mathbf{v}$, and leave it alone everywhere else.

**Effect 1: the state is knocked off course.** For $\varepsilon$ seconds the state moves at rate $\mathbf{f}(\mathbf{v})$ instead of $\mathbf{f}(\mathbf{u}^\star)$. Rate difference times time gives the displacement at the end of the spike:

$$
\delta\mathbf{x}(\tau+\varepsilon) \approx \varepsilon\Big[\mathbf{f}\big(\mathbf{x}^\star(\tau),\mathbf{v},\tau\big) - \mathbf{f}\big(\mathbf{x}^\star(\tau),\mathbf{u}^\star(\tau),\tau\big)\Big].
$$

**Effect 2: the running cost during the spike differs** by $\varepsilon\big[L(\mathbf{x}^\star(\tau),\mathbf{v},\tau) - L(\mathbf{x}^\star(\tau),\mathbf{u}^\star(\tau),\tau)\big]$.

**Pricing Effect 1.** After the spike the control goes back to $\mathbf{u}^\star$ and the displacement is carried forward by the ordinary dynamics. The last lesson proved $\partial J^\star/\partial\mathbf{x}_0 = \boldsymbol\lambda(t_0)$ for a nudge at the start. Nothing in that proof cared that the start was $t_0$: apply it to the remaining flight beginning at $\tau+\varepsilon$, and the costate at *any* instant prices a state nudge at that instant. So Effect 1 costs $\boldsymbol\lambda(\tau+\varepsilon)^\top\delta\mathbf{x}(\tau+\varepsilon) \approx \boldsymbol\lambda(\tau)^\top\delta\mathbf{x}(\tau+\varepsilon)$ to leading order.

**Adding up.**

$$
\delta J \approx \varepsilon\Big[L(\mathbf{x}^\star,\mathbf{v},\tau) + \boldsymbol\lambda(\tau)^\top\mathbf{f}(\mathbf{x}^\star,\mathbf{v},\tau)\Big] - \varepsilon\Big[L(\mathbf{x}^\star,\mathbf{u}^\star,\tau) + \boldsymbol\lambda(\tau)^\top\mathbf{f}(\mathbf{x}^\star,\mathbf{u}^\star,\tau)\Big] = \varepsilon\Big[H(\mathbf{x}^\star,\mathbf{v},\boldsymbol\lambda,\tau) - H(\mathbf{x}^\star,\mathbf{u}^\star,\boldsymbol\lambda,\tau)\Big].
$$

A best flight needs $\delta J \ge 0$ for every admissible $\mathbf{v}$ and every $\tau$, so $H(\mathbf{x}^\star,\mathbf{v},\boldsymbol\lambda,\tau) \ge H(\mathbf{x}^\star,\mathbf{u}^\star,\boldsymbol\lambda,\tau)$: the minimum principle. What made it work where the smooth wiggle failed is that $\mathbf{v}$ never had to be close to $\mathbf{u}^\star(\tau)$ — only the *duration* shrinks. This one-needle sketch is the whole idea. A fully rigorous proof has to handle several needles at once and take a careful limit as $\varepsilon\to0$, which is where Pontryagin's original proof earns its name.
:::

## Flat is not enough: the second-order check

Even where the best control is in the interior and $\partial H/\partial\mathbf{u}=\mathbf{0}$ holds, a flat spot is not proof of a minimum. The top of a hill is flat too, and so is the middle of a saddle.

To tell them apart you look at the curvature — the second derivative. For several controls, the table of all second derivatives is the **Hessian**, $\partial^2 H/\partial\mathbf{u}^2$. The minimum principle demands that it curve upward, like a bowl:

$$
\frac{\partial^2 H}{\partial\mathbf{u}^2} \succeq \mathbf{0}
$$

at the candidate optimum. The symbol $\succeq$ is read "is **[[positive semidefinite|psd]]**": bowl-shaped or flat in every direction, never dome-shaped. This is the **[[Legendre-Clebsch|legendre-clebsch]] condition**.

You have met it already without the name. For the linear-quadratic regulator (LQR),

$$
H = \tfrac12(\mathbf{x}^\top\mathbf{Q}\mathbf{x}+\mathbf{u}^\top\mathbf{R}\mathbf{u})+\boldsymbol\lambda^\top(\mathbf{A}\mathbf{x}+\mathbf{B}\mathbf{u}).
$$

Take the slope with respect to $\mathbf{u}$: $\mathbf{R}\mathbf{u} + \mathbf{B}^\top\boldsymbol\lambda$. Set it to zero: $\mathbf{u}^\star=-\mathbf{R}^{-1}\mathbf{B}^\top\boldsymbol\lambda$. Take the slope again: $\partial^2H/\partial\mathbf{u}^2 = \mathbf{R}$. So the requirement $\mathbf{R}\succ0$ that the optimal control module imposed on the cost from the start was not an arbitrary modeling choice. It is exactly what makes that flat spot the bottom of a bowl rather than the top of a dome.

::: example A sign error that stationarity does not catch
Suppose a control-effort term gets typed with the wrong sign: $L = \mathbf{x}^\top\mathbf{x} - c\,u^2$ for a scalar control and $c>0$, instead of the intended $L=\mathbf{x}^\top\mathbf{x}+c\,u^2$.

**Step 1: the Hamiltonian.** With dynamics $\mathbf{A}\mathbf{x}+\mathbf{b}u$,

$$
H = \mathbf{x}^\top\mathbf{x}-cu^2+\boldsymbol\lambda^\top(\mathbf{A}\mathbf{x}+\mathbf{b}u).
$$

**Step 2: stationarity.** The slope in $u$ is $-2cu+\mathbf{b}^\top\boldsymbol\lambda$. Set it to zero: $u^\star = \mathbf{b}^\top\boldsymbol\lambda/(2c)$. A perfectly good-looking number that a solver will report without complaint.

**Step 3: the second-order check.** $\partial^2H/\partial u^2 = -2c < 0$. The curve is a dome, so the flat spot is the *maximum* of $H$ in $u$, not the minimum. With no limits on $u$ there is no minimizer at all: $H\to-\infty$ as $|u|\to\infty$. With limits, the minimum is at whichever limit of $\mathcal{U}$ is *farthest* from $u^\star$ — the opposite of what the flat spot suggests.

**The lesson.** This is the most common way a hand-built Hamiltonian fails silently: a sign on $L$, or on $\boldsymbol\lambda^\top\mathbf{f}$, gets flipped once, the algebra still produces a number, and nothing looks wrong. Checking $\partial^2H/\partial\mathbf{u}^2\succeq\mathbf{0}$ takes one line and saves an afternoon debugging a shooting method that will not converge.
:::

## The Hamiltonian stays constant

Here is a fact that is almost free and extremely useful. If nothing in the problem depends on the clock directly — the dynamics, the running cost and the limits are the same at 9:00 as at 9:05 — the problem is called **time-invariant** (or **autonomous**). Then the value of the Hamiltonian stays exactly the same along the whole best flight.

It is the same idea as **[[energy conservation|conserved]]** in physics. A frictionless pendulum trades height for speed, but its total energy never changes, because the laws do not depend on the time. Here the Hamiltonian plays the role of energy.

Combine that with the free-time condition from the last lesson. With no terminal constraint that moves ($\partial\boldsymbol\psi/\partial t = \mathbf{0}$) and no terminal cost that depends on the clock ($\partial\phi/\partial t = 0$), the condition $H(t_f) + \partial\phi/\partial t + \boldsymbol\nu^\top\partial\boldsymbol\psi/\partial t = 0$ shrinks to $H(t_f) = 0$. And since $H$ is constant, $H = 0$ along the entire flight.

::: key Free-final-time transversality condition
For a time-invariant problem with no explicit terminal time cost, $H(t_f) = 0$. For a time-invariant problem, $H$ is constant along the whole optimal trajectory — a cheap numerical check on any solution.
:::

Use that check every time: evaluate $H$ at a dozen points along a computed trajectory. If the numbers wander, the costates are wrong, $H$ was built wrong, or the solution has not converged. One catch: the check needs a problem whose rules do not depend on the clock. In lesson four's orbit transfer the mass is written as a function of time, so $H$ alone drifts along the way; only $H$ plus the mass-costate term stays constant. That transfer still ends with $H(t_f)$ at round-off level, about $10^{-12}$.

::: note Why it has to be true: the Hamiltonian does not change
Take the time derivative of $H(\mathbf{x},\mathbf{u},\boldsymbol\lambda,t)$ along the flight with the chain rule. $H$ changes because the clock moves, the state moves, the costate moves and the control moves:

$$
\frac{dH}{dt} = \frac{\partial H}{\partial t} + \frac{\partial H}{\partial\mathbf{x}}^{\!\top}\dot{\mathbf{x}} + \frac{\partial H}{\partial\boldsymbol\lambda}^{\!\top}\dot{\boldsymbol\lambda} + \frac{\partial H}{\partial\mathbf{u}}^{\!\top}\dot{\mathbf{u}}.
$$

Now use the conditions. $\partial H/\partial\boldsymbol\lambda = \mathbf{f} = \dot{\mathbf{x}}$, and $\dot{\boldsymbol\lambda} = -\partial H/\partial\mathbf{x}$. So the middle two terms are $(\partial H/\partial\mathbf{x})^\top\mathbf{f} - \mathbf{f}^\top(\partial H/\partial\mathbf{x}) = 0$: they cancel exactly. The last term is zero too. Where the control is in the interior, $\partial H/\partial\mathbf{u}=\mathbf{0}$. Where it sits on a limit, it is not moving, so $\dot{\mathbf{u}} = \mathbf{0}$. At an instant where it jumps from one limit to the other, both limits give the same $H$ (that is why the switch happens there), so $H$ does not jump. What is left is

$$
\frac{dH}{dt} = \frac{\partial H}{\partial t},
$$

which is zero when the problem does not depend on the clock directly.
:::

::: warning Minimum time written as Mayer gives $H = -1$, not $0$
The card rule $H(t_f)=0$ assumes no explicit terminal time cost. Write minimum time as Lagrange, $L = 1$, and $H = 1 + \boldsymbol\lambda^\top\mathbf{f}$ ends at $0$. Write the *same* problem as Mayer, $\phi = t_f$ and $L = 0$, and $H = \boldsymbol\lambda^\top\mathbf{f}$; now $\partial\phi/\partial t = 1$, so the free-time condition gives $H(t_f) + 1 = 0$, that is $H(t_f) = -1$. The costates are identical in both — only the constant $1$ moved between $L$ and $\phi$. If your check says $-1$ where you expected $0$, look at which form you wrote before you hunt for a bug.
:::

## Transversality, completed: a target that moves

The last lesson's final-time conditions allowed $\boldsymbol\psi$ to depend on $t_f$, but every example had a target that sat still: a fixed orbit, a fixed altitude. A **[[rendezvous or an intercept|rendezvous]]** is different. The target is moving, so the set of allowed endpoints moves with time, $\partial\boldsymbol\psi/\partial t \neq \mathbf{0}$, and that term finally earns its keep.

::: example Minimum-time intercept of a moving target
A vehicle starts at rest: position $y(0)=0$ and velocity $w(0)=0$ along one axis. Its dynamics are $\ddot y = u$ ("y double dot", the acceleration), with $|u|\le1\,\mathrm{m/s^2}$. It must catch a target at $y_T(t) = 100 + 5t$, which starts $100\,\mathrm{m}$ ahead and moves away at $V=5\,\mathrm{m/s}$, in minimum time. The arrival speed is free.

**Step 1: set up the problem.** Minimum time as Lagrange: $L=1$ and $\phi=0$. The catch condition is

$$
\psi\big(y(t_f),t_f\big) = y(t_f) - 100 - 5t_f = 0,
$$

with slopes $\partial\psi/\partial y = 1$, $\partial\psi/\partial w = 0$ (arrival speed free), and — the new piece — $\partial\psi/\partial t = -V = -5$.

**Step 2: the costates.** $H=1+\lambda_y w+\lambda_w u$. The costate equations give $\dot\lambda_y = -\partial H/\partial y = 0$, so $\lambda_y$ is constant, and $\dot\lambda_w = -\partial H/\partial w = -\lambda_y$, so $\lambda_w$ changes at a steady rate: a straight line in time.

**Step 3: transversality on the state.** $\lambda_y(t_f)=\nu$ (free, because $y(t_f)$ is pinned) and $\lambda_w(t_f) = 0$ (because $w(t_f)$ is free). A straight line that ends at zero is $\lambda_w(t)=\lambda_y\,(t_f-t)$.

**Step 4: the new time condition.** With $\partial\phi/\partial t = 0$,

$$
H(t_f) + \nu\,\frac{\partial\psi}{\partial t} = 0 \;\Longrightarrow\; H(t_f) = \nu V = \lambda_y V.
$$

The Hamiltonian at arrival is **not zero**, unlike every fixed-target free-time example. Its value is set by how fast the target is running away.

**Step 5: the control.** If $\lambda_y$ is negative, then $\lambda_w(t)=\lambda_y(t_f-t)$ is negative for the whole flight until the very end. $H$ contains $\lambda_w u$, and with $\lambda_w<0$ the smallest $H$ comes from the largest $u$. So $u = +1$ for the *entire* flight — no switch at all, because there is no need to stop.

**Step 6: the flight.** Accelerating at $1\,\mathrm{m/s^2}$ from rest gives $y(t)=\tfrac12t^2$. Set it equal to the target's position: $\tfrac12t_f^2 = 100+5t_f$. Multiply by $2$ and rearrange: $t_f^2-10t_f-200=0$. The quadratic formula gives $t_f = \big(10 + \sqrt{100+800}\big)/2 = (10+30)/2 = 20\,\mathrm{s}$. The vehicle arrives at $y(20)=200\,\mathrm{m}$; the target is at $y_T(20)=100+100=200\,\mathrm{m}$. The closing speed is $w(t_f)=20\,\mathrm{m/s}$.

**Step 7: check the costates.** At arrival $\lambda_w = 0$, so $H(t_f) = 1+\lambda_y\,w(t_f)$. Set it equal to $\lambda_y V$ and solve: $\lambda_y = 1/(V-w(t_f)) = 1/(5-20) = -0.066667\,\mathrm{s/m}$. Negative, as Step 5 assumed. Then $\lambda_w(0) = \lambda_y \times 20 = -1.3333$, rising in a straight line to exactly $0$ at $t_f$ — negative throughout, so $u=+1$ is what the minimum principle demands, not merely something that works.

**Step 8: check the Hamiltonian.** At arrival, $H(t_f) = 1+(-0.066667)(20) = -0.33333$, and $\lambda_y V = (-0.066667)(5) = -0.33333$. They match, and the answer is nonzero because the target moved. At the start, $w=0$ and $u=1$, so $H(0) = 1 + 0 + (-1.3333)(1) = -0.33333$: the same value. The problem is time-invariant (only the *target* depends on the clock, not the dynamics or the cost), so $H$ is constant, [[exactly as promised|h-flat]].
:::

::: example The same chase with a target that stands still
Set $V = 0$: the target sits at $100\,\mathrm{m}$. Nothing in the reasoning changes, so again $u = +1$ throughout.

**The flight.** $\tfrac12 t_f^2 = 100$, so $t_f^2 = 200$ and $t_f = \sqrt{200} = 14.142\,\mathrm{s}$. The arrival speed is $w(t_f) = 14.142\,\mathrm{m/s}$.

**The costates.** $\lambda_y = 1/(V - w(t_f)) = 1/(0 - 14.142) = -0.070711\,\mathrm{s/m}$, and $\lambda_w(0) = \lambda_y t_f = -0.070711 \times 14.142 = -1.0000$.

**The Hamiltonian.** At the start, $H(0) = 1 + 0 + (-1)(1) = 0$. At arrival, $H(t_f) = 1 + (-0.070711)(14.142) = 1 - 1 = 0$. This is the card's rule: time-invariant, free final time, target not moving, no terminal time cost, so $H = 0$ all the way. Sanity check: $V = 0$ in the moving-target formula $H = \lambda_y V$ gives $0$ too, so the two examples agree.
:::

::: warning Do not copy a switching pattern from the last problem
"Double integrator, bounded control, minimum time" does not always mean one switch. The costate *shapes* — $\lambda_y$ constant, $\lambda_w$ a straight line — come from the dynamics, so they hold whatever the target does. The *number of switches* depends on whether $\lambda_w$ actually crosses zero inside $[0,t_f]$, and that is decided by the boundary conditions. The intercept has zero switches because the arrival speed is free and the target keeps moving the way you are already accelerating. Check the sign of the costate over the whole interval before assuming a switch exists.
:::

## Check yourself

::: check
A needle variation swaps in a constant $\mathbf{v}$ that is admissible but far from $\mathbf{u}^\star(\tau)$ — say the opposite corner of a box of limits. Why is the argument still valid for such a large change, when the smooth-wiggle argument of the last lesson needed $\delta\mathbf{u}$ to be small?
:::

::: answer
The two arguments shrink different things. The smooth wiggle changed the control a little *at every instant*, so the state change piles up over the whole flight and stays small only if $\delta\mathbf{u}(t)$ is small throughout. A needle changes the control by any amount, possibly large, but only for a vanishingly short time $\varepsilon$. The state change it causes is about $\varepsilon$ times a rate difference, so it is small no matter how big $\mathbf{v}-\mathbf{u}^\star(\tau)$ is — it is the *duration* going to zero, not the size of the change. That is what lets $\mathbf{v}$ range over the whole set $\mathcal{U}$, which is what the minimum condition needs in order to say something about every admissible control, not only nearby ones.
:::

::: check
For a system whose dynamics are linear in the control (control-affine) and whose running cost $L$ does not contain $\mathbf{u}$ — the bang-bang setting of lesson five — what is $\partial^2H/\partial\mathbf{u}^2$, and what does that say about the second-order check there?
:::

::: answer
$H$ is then a straight-line (affine) function of $\mathbf{u}$: some terms without $\mathbf{u}$, plus a coefficient times $\mathbf{u}$. So $\partial^2H/\partial\mathbf{u}^2 = \mathbf{0}$ everywhere. The condition $\mathbf{0}\succeq\mathbf{0}$ holds automatically and carries no information, because there is no curvature to check. That fits: bang-bang optima are never interior flat spots of $H$ (except on a singular arc). The minimum sits at a corner of $\mathcal{U}$, which is exactly the case the needle form of the principle was built for, and the flat-spot-plus-curvature test has nothing to add.
:::

::: check
In the moving-target example, what changes in the transversality analysis if the mission must match the target's speed at arrival, $w(t_f) = V$, instead of leaving it free?
:::

::: answer
$\boldsymbol\psi$ gains a second equation, $\psi_2 = w(t_f) - V = 0$, with $\partial\psi_2/\partial w = 1$ and $\partial\psi_2/\partial t = 0$ (the required speed $V$ is a constant, not something that changes with $t_f$).

State transversality then gives $\lambda_w(t_f) = \nu_2$: free, no longer forced to zero. The first equation still does not involve $w$, so $\lambda_y(t_f)=\nu_1$ as before. Time transversality picks up both multipliers, $H(t_f) + \nu_1(-V) + \nu_2 \cdot 0 = 0$, so still $H(t_f) = \nu_1 V$.

The real change is that $\lambda_w(t_f)$ is no longer pinned to zero, so the straight line $\lambda_w(t)$ may cross zero inside the flight. Matching an arrival speed generally brings back a possible switch: the vehicle may need to stop accelerating, or even brake, to avoid arriving too fast.
:::

::: check
Using the needle-variation argument rather than quoting the theorem, explain why a control that makes $H$ flat can still fail the minimum principle when $\mathcal{U}$ has limits.
:::

::: answer
The needle argument concludes $H(\mathbf{x}^\star,\mathbf{v},\boldsymbol\lambda,\tau)\ge H(\mathbf{x}^\star,\mathbf{u}^\star,\boldsymbol\lambda,\tau)$ for *every* admissible $\mathbf{v}$, because the spike's control can be anything allowed. Stationarity only covers controls a tiny step away, $\mathbf{v}=\mathbf{u}^\star+\epsilon\,\mathbf{d}$ with small $\epsilon$. It says $H$ does not drop for *nearby* controls and is silent about a distant one, such as the opposite limit of a box. So a control can be a strict local minimum of $H$ among its neighbors — flat, curving upward — while some far-away admissible control gives a strictly smaller $H$. That cannot happen when $H$ is bowl-shaped (convex) in $\mathbf{u}$ over a convex $\mathcal{U}$, but it can once either fails. The needle argument catches it; stationarity cannot, because it never looks that far.
:::

::: check
A colleague solves a free-final-time minimum-time transfer written as Mayer ($\phi = t_f$, $L = 0$). Her time-invariant check shows $H = -1.0000$ at every point along the trajectory. She concludes the solution is wrong because "$H$ should be zero". Is she right?
:::

::: answer
No. The solution passes both checks. First, $H$ is the same at every point, which is exactly what a time-invariant problem requires. Second, the value is right for the Mayer form. With $\phi = t_f$, the free-time condition is $H(t_f) + \partial\phi/\partial t = H(t_f) + 1 = 0$, so $H(t_f) = -1$. The rule $H(t_f) = 0$ is for a problem with no explicit terminal time cost, such as the Lagrange form $L = 1$. There, $H = 1 + \boldsymbol\lambda^\top\mathbf{f}$ is exactly $1$ more than her $\boldsymbol\lambda^\top\mathbf{f}$, with the same costates, so it would read $-1 + 1 = 0$.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Minimum principle | $\mathbf{u}^\star(t) = \operatorname*{argmin}_{\mathbf{u}\in\mathcal{U}} H(\mathbf{x}^\star,\mathbf{u},\boldsymbol\lambda^\star,t)$ at every $t$; holds on a bound, where stationarity is silent |
| Needle variation | Swap in constant $\mathbf{v}$ on $[\tau,\tau+\varepsilon]$; $\delta J\approx\varepsilon[H(\mathbf{v})-H(\mathbf{u}^\star)]\ge0$ at an optimum |
| Price at any instant | $\boldsymbol\lambda(\tau)$ prices a state nudge at $\tau$, not only at $t_0$ |
| Legendre-Clebsch | $\partial^2H/\partial\mathbf{u}^2\succeq\mathbf{0}$ at an interior flat spot; for LQR this is $\mathbf{R}\succ0$ |
| Sign-error trap | $L=\mathbf{x}^\top\mathbf{x}-cu^2$ gives a flat spot that maximizes $H$ |
| Constant Hamiltonian | $dH/dt = \partial H/\partial t$ along an optimum; time-invariant means $H$ constant |
| Free final time | Time-invariant, no explicit terminal time cost: $H(t_f)=0$ (Mayer $\phi=t_f$ gives $-1$ instead) |
| Moving target | $H(t_f)=-\partial\phi/\partial t-\boldsymbol\nu^\top\partial\boldsymbol\psi/\partial t$, nonzero when the target moves |
| Intercept example | $t_f=20\,\mathrm{s}$, no switch, $\lambda_y=-0.066667\,\mathrm{s/m}$, $H = \lambda_y V=-0.33333$ all the way |
| Still target | $t_f = 14.142\,\mathrm{s}$, $\lambda_y = -0.070711\,\mathrm{s/m}$, $H = 0$ all the way |
| Switch count | Set by whether the costate crosses zero on $[t_0,t_f]$: a boundary-condition question |

The next lesson turns this machinery into an algorithm. The state runs forward, the costate runs backward, and transversality ties the two ends together — so you guess the missing starting costates, integrate, and correct the guess. That is shooting, and you will see exactly how badly the correction can behave.

::: context pontryagin Who Pontryagin was
Lev Pontryagin (1908–1988) was a Soviet mathematician who lost his sight at fourteen after an accident and went on to become one of the leading mathematicians of his century. In the 1950s he and his students Boltyanskii, Gamkrelidze and Mishchenko developed the maximum principle, published in their book *The Mathematical Theory of Optimal Processes* (1961 in Russian, 1962 in English). They wrote it as a *maximum* principle, with the sign of the Hamiltonian flipped. Western engineers usually write *minimum*; the two say the same thing.
:::

::: context admissible-box A box of allowed controls
With two controls, each limited to $[-1, 1]$, the admissible set is a square. A flat-spot search looks for a point inside where the slope of $H$ is zero. But when $H$ is a tilted plane over the square, its lowest point is a corner, where nothing is flat.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="100" x2="300" y2="100" stroke="#6c7a93" stroke-width="1"/>
  <line x1="180" y1="20" x2="180" y2="180" stroke="#6c7a93" stroke-width="1"/>
  <rect x="110" y="30" width="140" height="140" fill="#8fb8f0" fill-opacity="0.5" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="250" cy="30" r="6" fill="#b4232c"/>
  <text x="258" y="26" font-size="12" fill="#b4232c">lowest H</text>
  <line x1="150" y1="140" x2="232" y2="48" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="240,39 225,45 235,54" fill="#1f2a44"/>
  <text x="120" y="160" font-size="11" fill="#1f2a44">H falls this way</text>
  <text x="250" y="186" font-size="11" text-anchor="middle" fill="#1f2a44">u1 = 1</text>
  <text x="110" y="186" font-size="11" text-anchor="middle" fill="#1f2a44">u1 = −1</text>
  <text x="104" y="34" font-size="11" text-anchor="end" fill="#1f2a44">u2 = 1</text>
  <text x="104" y="172" font-size="11" text-anchor="end" fill="#1f2a44">u2 = −1</text>
</svg>
```
:::

::: context argmin Min versus argmin
$\min_x (x-3)^2 = 0$: the smallest *value* is zero. $\operatorname{argmin}_x (x-3)^2 = 3$: the *input* that produces it is three. The minimum principle uses argmin because what you command the engine is the control itself, not the value of the Hamiltonian.
:::

::: context needle A needle in the control history
The best control, with a thin spike of a different value $\mathbf{v}$ lasting only $\varepsilon$ seconds. The spike can be as tall as the limits allow; only its width goes to zero.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="120" x2="335" y2="120" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="30" y1="20" x2="30" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="30" y1="30" x2="330" y2="30" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="330" y="24" font-size="11" text-anchor="end" fill="#6c7a93">upper limit</text>
  <path d="M30,95 C80,80 130,75 170,82 L170,30 L182,30 L182,84 C220,92 270,100 330,90" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="60" y="108" font-size="12" fill="#1d6fd1">best control u*</text>
  <text x="194" y="48" font-size="12" fill="#b4232c">spike to v</text>
  <line x1="170" y1="128" x2="182" y2="128" stroke="#b4232c" stroke-width="2"/>
  <text x="176" y="146" font-size="12" text-anchor="middle" fill="#b4232c">ε</text>
  <text x="170" y="140" font-size="11" text-anchor="end" fill="#1f2a44">τ</text>
</svg>
```
:::

::: context psd Bowl-shaped in every direction
A matrix $\mathbf{M}$ is positive semidefinite, written $\mathbf{M}\succeq\mathbf{0}$, when $\mathbf{d}^\top\mathbf{M}\,\mathbf{d}\ge0$ for every direction $\mathbf{d}$. For a Hessian that means: walk away from the flat spot in any direction and the function curves up or stays level, never down. With a strict sign, $\succ$ ("positive definite"), it curves strictly up in every direction — a true bowl. For one control it means "the second derivative is not negative".
:::

::: context legendre-clebsch Where the name comes from
Adrien-Marie Legendre, in the 1780s, found that a flat first variation is not enough and that the second derivative must have the right sign for a curve to be a minimum. Alfred Clebsch extended the test to problems with several unknowns in the 1850s. The condition that bears both names is the calculus-of-variations version of the "second derivative test" from first-year calculus.
:::

::: context conserved The Hamiltonian as energy
The name comes from mechanics. William Rowan Hamilton rewrote Newton's laws in a form where one function — for most systems, the total energy — generates the motion through exactly the pattern $\dot{\mathbf{x}}=\partial H/\partial\mathbf{p}$, $\dot{\mathbf{p}}=-\partial H/\partial\mathbf{x}$. Optimal control borrowed the pattern, with the costate in the role of momentum. That is why the same conservation law holds: when the rules do not depend on the clock, $H$ does not change.
:::

::: context rendezvous Chasing a moving target
Every rendezvous with a space station is a chase: the station itself orbits Earth at about $7.7\,\mathrm{km/s}$, so the spot where the visiting vehicle must arrive keeps moving. Interceptors and landers aiming at a rotating planet's surface face the same kind of moving target. Whenever the arrival condition depends on the clock, the final-time condition picks up the $\partial\boldsymbol\psi/\partial t$ term, and the Hamiltonian at arrival is no longer zero.
:::

::: context h-flat A flat Hamiltonian over the intercept
The costate $\lambda_w$ rises in a straight line from $-1.33$ to $0$, staying negative, so the control stays at $+1$. The Hamiltonian stays flat at $-1/3$ the whole way. Drawn to scale over the $20\,\mathrm{s}$ flight.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="40" x2="330" y2="40" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="20" x2="50" y2="160" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="44" y="44" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <text x="44" y="144" font-size="11" text-anchor="end" fill="#1f2a44">−1.33</text>
  <text x="44" y="69" font-size="11" text-anchor="end" fill="#1f2a44">−0.33</text>
  <line x1="50" y1="140" x2="310" y2="40" stroke="#b4232c" stroke-width="2.5"/>
  <line x1="50" y1="65" x2="310" y2="65" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="180" y="58" font-size="12" text-anchor="middle" fill="#1d6fd1">H = −1/3</text>
  <text x="150" y="128" font-size="12" fill="#b4232c">λ_w(t)</text>
  <text x="310" y="32" font-size="11" text-anchor="middle" fill="#1f2a44">20 s</text>
  <text x="62" y="32" font-size="11" text-anchor="middle" fill="#1f2a44">0 s</text>
</svg>
```
:::
