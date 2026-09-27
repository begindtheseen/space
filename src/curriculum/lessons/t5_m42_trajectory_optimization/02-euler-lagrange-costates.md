---
id: l02-euler-lagrange-costates
title: The Euler-Lagrange conditions and costates as shadow prices
minutes: 22
covers:
  - "Indirect methods: the Hamiltonian, the Euler-Lagrange conditions, costates as shadow prices"
---

Imagine you are late for a movie, and a friend offers you a ride that saves you one kilometer of walking. How much is that worth? If you walk at about $5\,\mathrm{km/h}$, one kilometer is twelve minutes. So the head start has a price: twelve minutes per kilometer. Being one kilometer further away would cost you twelve more minutes.

Every piece of a spacecraft's state has a price like that. One more meter of altitude at the start of a landing burn costs a few grams of extra propellant. One more meter per second of downward speed costs a few hundred grams. Those prices are not a metaphor you bolt on afterward. They come straight out of the mathematics of the best trajectory, and they have a name: the **costates**, one for each state, each measured in "cost units per state unit".

This lesson derives them. The optimal control module stated four conditions every best trajectory must satisfy — the state equation, the costate equation, a condition on the control, and conditions at the final time — and used them without proof. Here you earn two of them from scratch: the costate equation with the **stationarity** condition, and the conditions at the final time, called **transversality**, in full. Taken together they are the **Euler-Lagrange conditions**. Solving a trajectory by deriving these conditions first and then solving them is called an **[[indirect method|indirect]]**, and the costates are what make it work.

## What the finish line looks like

The last lesson's Bolza problem had a start state and a cost. Real missions also say where the flight must end. We write that as a **terminal constraint**:

$$
\boldsymbol\psi\big(\mathbf{x}(t_f), t_f\big) = \mathbf{0} \in \mathbb{R}^{p}.
$$

Read $\boldsymbol\psi$ as "psi", said "sigh". It is a list of $p$ equations that the final state must satisfy. Each equation pins down one direction of the state; the rest stay free. Engineers call $p$ the **[[codimension|codimension]]** of the set of allowed endpoints.

- $p = 0$: no equations. The endpoint is completely free.
- $p = n$: one equation for every state. The endpoint is a single fixed point.
- In between, the flight may end anywhere on a surface of allowed states, called a **manifold**.

The in-between case is not a mathematician's nicety. "Arrive on the target circular orbit" fixes the radius and both velocity components, but leaves the angle around the orbit completely open: you may arrive at any point on the **[[target circle|target-orbit]]**. Getting the final-time conditions right for that case is what makes the shooting method of a later lesson work at all.

## Gluing the rules onto the cost

The dynamics $\dot{\mathbf{x}} = \mathbf{f}$ are a rule the flight must obey at every instant. The terminal constraint is a rule it must obey once, at the end. The trick for handling rules — from the optimization module's **[[Lagrange multipliers|multipliers]]** — is to attach each rule to the cost with a price, and then choose the prices cleverly.

So attach the dynamics with a price that can change over time, $\boldsymbol\lambda(t)$ (read "lambda of t"), and the terminal rule with a fixed price $\boldsymbol\nu$ (read "nu", said "new"), one number per equation:

$$
\bar J = \phi\big(\mathbf{x}(t_f),t_f\big) + \boldsymbol\nu^\top\boldsymbol\psi\big(\mathbf{x}(t_f),t_f\big) + \int_{t_0}^{t_f}\Big[L(\mathbf{x},\mathbf{u},t) + \boldsymbol\lambda(t)^\top\big(\mathbf{f}(\mathbf{x},\mathbf{u},t)-\dot{\mathbf{x}}\big)\Big]dt.
$$

Read $\bar J$ as "J bar". Look at what was added. On any flight that obeys the rules, $\mathbf{f} - \dot{\mathbf{x}}$ is zero at every instant and $\boldsymbol\psi$ is zero at the end. So the added terms are zero, and $\bar J = J$ no matter what prices you pick. The prices are free riders. That freedom is the whole point: we will choose them to make the condition for "best" easy to read.

$\boldsymbol\lambda(t)$ is the **costate** — one price per state, changing over the flight. It is also called the **[[adjoint|adjoint-name]]**. Most of this module writes it $\boldsymbol\lambda$; many books and this module's flashcards write it $\mathbf{p}$. Same object.

Two pieces of the integrand, the running cost and the priced dynamics, travel together so often that they get their own name. The **Hamiltonian** is

$$
H = L + \boldsymbol\lambda^\top\mathbf{f}.
$$

::: key The control Hamiltonian
$H(\mathbf{x}, \mathbf{u}, \mathbf{p}, t) = L(\mathbf{x}, \mathbf{u}, t) + \mathbf{p}^\top \mathbf{f}(\mathbf{x}, \mathbf{u}, t)$. The costate $\mathbf{p}$ (written $\boldsymbol\lambda$ in these lessons) is the shadow price of the dynamic constraint: the price attached to the rule $\dot{\mathbf{x}} = \mathbf{f}$.
:::

In words: $H$ is the cost you pay right now, plus the value of where the dynamics are carrying you, priced by the costates.

## Wiggle the control and watch the cost

How do you recognize the best flight? The same way you recognize the bottom of a valley: take a tiny step in any direction, and you do not go down. So take the best control and nudge it a little, $\mathbf{u}\to\mathbf{u}+\delta\mathbf{u}$. Read $\delta$ as "delta": a small change. The nudge changes the state it produces, $\mathbf{x}\to\mathbf{x}+\delta\mathbf{x}$. The start is given data, so the state cannot change there: $\delta\mathbf{x}(t_0)=\mathbf{0}$.

Keep only the first-order effects (the small change times a slope). The change in $\bar J$ is:

$$
\delta\bar J = \left(\frac{\partial\phi}{\partial\mathbf{x}}+\Big(\frac{\partial\boldsymbol\psi}{\partial\mathbf{x}}\Big)^{\!\top}\!\boldsymbol\nu\right)_{\!t_f}^{\!\top}\!\delta\mathbf{x}(t_f) + \int_{t_0}^{t_f}\left[\frac{\partial H}{\partial\mathbf{x}}^{\!\top}\!\delta\mathbf{x} + \frac{\partial H}{\partial\mathbf{u}}^{\!\top}\!\delta\mathbf{u} - \boldsymbol\lambda^\top\delta\dot{\mathbf{x}}\right]dt.
$$

The first piece is how the end-of-flight terms change when the final state moves. Inside the integral, the first two pieces are how $H$ changes when the state and control move. The last piece is awkward: it contains $\delta\dot{\mathbf{x}}$, the change in the *rate*, while everything else contains $\delta\mathbf{x}$ itself.

The fix is **[[integration by parts|by-parts]]**, the product rule run backward. It moves the time derivative off $\delta\mathbf{x}$ and onto $\boldsymbol\lambda$:

$$
\int_{t_0}^{t_f}-\boldsymbol\lambda^\top\delta\dot{\mathbf{x}}\,dt = -\Big[\boldsymbol\lambda^\top\delta\mathbf{x}\Big]_{t_0}^{t_f} + \int_{t_0}^{t_f}\dot{\boldsymbol\lambda}^\top\delta\mathbf{x}\,dt = -\boldsymbol\lambda(t_f)^\top\delta\mathbf{x}(t_f) + \int_{t_0}^{t_f}\dot{\boldsymbol\lambda}^\top\delta\mathbf{x}\,dt.
$$

The bracket means "value at $t_f$ minus value at $t_0$". The $t_0$ part vanished because $\delta\mathbf{x}(t_0)=\mathbf{0}$. Now substitute back and group like with like — everything multiplying $\delta\mathbf{x}(t_f)$ at the end, everything multiplying $\delta\mathbf{x}(t)$ inside, everything multiplying $\delta\mathbf{u}(t)$:

$$
\delta\bar J = \left(\frac{\partial\phi}{\partial\mathbf{x}}+\Big(\frac{\partial\boldsymbol\psi}{\partial\mathbf{x}}\Big)^{\!\top}\!\boldsymbol\nu-\boldsymbol\lambda\right)_{\!t_f}^{\!\top}\!\delta\mathbf{x}(t_f) + \int_{t_0}^{t_f}\left[\Big(\frac{\partial H}{\partial\mathbf{x}}+\dot{\boldsymbol\lambda}\Big)^{\!\top}\!\delta\mathbf{x} + \frac{\partial H}{\partial\mathbf{u}}^{\!\top}\!\delta\mathbf{u}\right]dt.
$$

At the best flight this must be zero for every small nudge. Now spend the freedom in the prices, one piece at a time.

**Step 1: kill the state term.** $\delta\mathbf{x}(t)$ is tangled up with $\delta\mathbf{u}$ through the dynamics, which is hard to track. But $\boldsymbol\lambda(t)$ has not been chosen yet. Choose it so the bracket in front of $\delta\mathbf{x}$ is zero at every instant:

$$
\dot{\boldsymbol\lambda} = -\frac{\partial H}{\partial\mathbf{x}} \qquad \text{(costate equation)}.
$$

**Step 2: read off the control condition.** With the state term gone, only $\delta\mathbf{u}$ is left inside the integral. If the control is free to move in every direction, you can nudge it any way you like, so its coefficient must be zero:

$$
\frac{\partial H}{\partial\mathbf{u}} = \mathbf{0} \qquad \text{(stationarity)}.
$$

"Stationary" means flat: the Hamiltonian's slope with respect to the control is zero, like the flat bottom of a bowl.

**Step 3: kill the end term.** $\boldsymbol\nu$ has not been chosen either. Choose it so the end bracket is zero. That is possible whenever the $p$ equations in $\boldsymbol\psi$ are genuinely independent — engineers say $\partial\boldsymbol\psi/\partial\mathbf{x}$ has **[[full row rank|full-rank]]**. Then the end term vanishes for every $\delta\mathbf{x}(t_f)$. That is the **transversality condition**:

$$
\boldsymbol\lambda(t_f) = \frac{\partial\phi}{\partial\mathbf{x}}\bigg|_{t_f} + \left(\frac{\partial\boldsymbol\psi}{\partial\mathbf{x}}\right)^{\!\top}_{\!t_f}\!\boldsymbol\nu.
$$

The vertical bar with $t_f$ means "evaluated at the final time".

### The two ends of the dial

Check the formula at its two extremes.

- **Free endpoint**, $p=0$. There is no $\boldsymbol\psi$, so no $\boldsymbol\nu$, and $\boldsymbol\lambda(t_f)=\partial\phi/\partial\mathbf{x}$. The final price of each state is how much the terminal cost cares about it. If the cost ignores a state, its final price is zero.
- **Fixed endpoint**, $p=n$. Every state is pinned: $\boldsymbol\psi = \mathbf{x}(t_f)-\mathbf{x}_{\text{target}}$, so $\partial\boldsymbol\psi/\partial\mathbf{x} = \mathbf{I}$ (the identity matrix, which changes nothing) and $\boldsymbol\lambda(t_f) = \partial\phi/\partial\mathbf{x}+\boldsymbol\nu$. Since $\boldsymbol\nu$ can be anything, this says nothing about $\boldsymbol\lambda(t_f)$ at all. That matches common sense: when the endpoint is fixed, the final costate is not given by a formula. It is whatever value makes the flight hit the target.

### When the arrival time is free too

If $t_f$ is also yours to choose, you get one more scalar condition:

$$
H(t_f) + \frac{\partial\phi}{\partial t}\bigg|_{t_f} + \boldsymbol\nu^\top\frac{\partial\boldsymbol\psi}{\partial t}\bigg|_{t_f} = 0.
$$

The picture: at the best arrival time, flying a tiny bit longer or shorter must not change the cost. The note below shows why that is exactly this equation.

::: note Why the free-time condition has to be true
Extend the best flight by a tiny extra time $dt$, keeping the control it had at the end. Three things change. The running cost adds $L\,dt$. The state moves by $\mathbf{f}\,dt$, which changes the end terms $\phi + \boldsymbol\nu^\top\boldsymbol\psi$ by $\big(\partial\phi/\partial\mathbf{x} + (\partial\boldsymbol\psi/\partial\mathbf{x})^\top\boldsymbol\nu\big)^\top\mathbf{f}\,dt$. By transversality, that bracket is exactly $\boldsymbol\lambda(t_f)$, so this piece is $\boldsymbol\lambda^\top\mathbf{f}\,dt$. And the clock itself moved, adding $(\partial\phi/\partial t + \boldsymbol\nu^\top\partial\boldsymbol\psi/\partial t)\,dt$. The total change is

$$
\big(L + \boldsymbol\lambda^\top\mathbf{f} + \partial\phi/\partial t + \boldsymbol\nu^\top\partial\boldsymbol\psi/\partial t\big)\,dt = \big(H + \partial\phi/\partial t + \boldsymbol\nu^\top\partial\boldsymbol\psi/\partial t\big)\,dt.
$$

If this were not zero, you could lower the cost by stopping a little earlier or later, so the flight was not the best. (Re-adjusting the control as well changes the cost only at second order, because the other conditions already hold.)
:::

::: key The Euler-Lagrange conditions for the Bolza problem
$H = L+\boldsymbol\lambda^\top\mathbf{f}$. Costate: $\dot{\boldsymbol\lambda}=-\partial H/\partial\mathbf{x}$. Stationarity: $\partial H/\partial\mathbf{u}=\mathbf{0}$. Transversality with terminal constraint $\boldsymbol\psi(\mathbf{x}(t_f),t_f)=\mathbf{0}$: $\boldsymbol\lambda(t_f)=\partial\phi/\partial\mathbf{x}+(\partial\boldsymbol\psi/\partial\mathbf{x})^\top\boldsymbol\nu$, plus $H(t_f)+\partial\phi/\partial t+\boldsymbol\nu^\top\partial\boldsymbol\psi/\partial t=0$ if $t_f$ is free. Stationarity is the interior special case of the minimum principle's minimum condition; the next lesson replaces it with the version that also holds on a bound.
:::

### State forward, costate backward

Now look at where each piece of boundary data lives. The state has its known value at the **start**, $\mathbf{x}(t_0) = \mathbf{x}_0$, so you integrate it forward. The costate has its known value at the **end**, from transversality, so the natural way to compute it is to start at $t_f$ and **[[integrate backward|why-backward]]** in time. It is like planning to catch a train: you know when you must arrive, so you work backward to find when to leave.

The two are coupled — the costate equation contains the state, and the best control depends on both. Half the conditions sit at $t_0$, half at $t_f$. That is a **two-point boundary value problem**, and lesson four is about how hard it is to solve.

::: key Costate (adjoint) equation and its direction of integration
$\dot{\mathbf{p}} = -\partial H/\partial\mathbf{x}$, integrated **backward** from the terminal condition $\mathbf{p}(t_f) = \partial\phi/\partial\mathbf{x}\,(t_f)$ (free endpoint). The state goes forward from $\mathbf{x}(t_0)$, the costate goes backward from $t_f$ — that is what makes it a two-point boundary value problem.
:::

::: example The free angle of an orbit transfer
A later lesson shoots a minimum-time transfer between circular orbits. The state is written in polar coordinates, $(r,\theta,v_r,v_t)$: radius, angle around the Earth, radial speed (outward) and tangential speed (sideways). The cost is minimum time, $\phi=t_f$ and $L=1$. The spacecraft must arrive with $r(t_f)=r_1$, $v_r(t_f)=0$ and $v_t(t_f)=\sqrt{\mu/r_1}$, the speed of a circular orbit ($\mu$, "mew", is Earth's gravity constant, $3.986\times10^{14}\,\mathrm{m^3/s^2}$; for $r_1 = 9000\,\mathrm{km}$ that speed is $6654.99\,\mathrm{m/s}$). The angle $\theta(t_f)$ is left **free**.

**Step 1: write the terminal constraint.** Three equations, one for each pinned quantity:

$$
\boldsymbol\psi = \big(r(t_f)-r_1,\ v_r(t_f),\ v_t(t_f)-\sqrt{\mu/r_1}\big) = \mathbf{0}.
$$

$\theta$ does not appear in any of them, so $\partial\boldsymbol\psi/\partial\theta = \mathbf{0}$.

**Step 2: apply transversality to the angle.** The cost $\phi = t_f$ does not depend on $\theta$ either. So

$$
\lambda_\theta(t_f) = \frac{\partial\phi}{\partial\theta} + \Big(\frac{\partial\boldsymbol\psi}{\partial\theta}\Big)^{\!\top}\boldsymbol\nu = 0 + 0 = 0.
$$

**Step 3: apply the costate equation.** Gravity pulls toward the center the same way at every angle, so the dynamics of $r$, $v_r$ and $v_t$ never contain $\theta$. Then $H$ does not contain $\theta$, and

$$
\dot\lambda_\theta = -\frac{\partial H}{\partial\theta} = 0.
$$

A costate with zero rate of change is constant. It is constant and ends at zero, so it is zero for the **whole** flight: $\lambda_\theta(t)\equiv 0$.

**Sanity check by machine.** Solving the shooting problem with $\lambda_\theta(0)$ left as an unknown, and $\lambda_\theta(t_f)=0$ as one of the equations the root finder must satisfy, converges to $\lambda_\theta(0) = -3.2\times10^{-28}$: zero, to machine precision. Every other costate and the flight time match the shortcut to ten significant figures. That is why the shooting problem in lesson four carries only three costates, $(\lambda_r,\lambda_{v_r},\lambda_{v_t})$, instead of four. The angle and its price drop out because of transversality on a target that never mentions the angle — not by a convenient omission.
:::

## Costates as shadow prices

Now the promised price tags. The derivation above held the start fixed and asked which control is best. Ask a different question: once the best flight is known, how does the best cost $J^\star$ ("J star") change if the given starting state $\mathbf{x}_0$ changes a little?

This is the **[[shadow price|shadow-price]]** question the optimization module answered for a single constraint in a finite problem, now for a whole starting state.

Redo the integration by parts, but this time keep the $t_0$ piece, because $\delta\mathbf{x}(t_0)=\delta\mathbf{x}_0$ is no longer zero:

$$
\int_{t_0}^{t_f}-\boldsymbol\lambda^\top\delta\dot{\mathbf{x}}\,dt = -\boldsymbol\lambda(t_f)^\top\delta\mathbf{x}(t_f) + \boldsymbol\lambda(t_0)^\top\delta\mathbf{x}_0 + \int_{t_0}^{t_f}\dot{\boldsymbol\lambda}^\top\delta\mathbf{x}\,dt.
$$

Evaluate $\delta\bar J$ on the best flight, where the costate equation, stationarity and transversality already hold. Every term you killed before is still dead. Only the new piece survives:

$$
\delta J^\star = \boldsymbol\lambda(t_0)^\top\delta\mathbf{x}_0 \qquad\Longrightarrow\qquad \frac{\partial J^\star}{\partial\mathbf{x}_0} = \boldsymbol\lambda(t_0).
$$

The costate at the start is the slope of the best cost with respect to the starting state. This is an identity, not an analogy, and the units prove it. If $J$ is in kilograms of propellant and $x_0$ is an altitude in meters, then $\lambda(t_0)$ is in kilograms per meter. It says exactly how many kilograms one more meter of starting altitude costs. The general pattern behind this — at an optimum, only the directly perturbed piece of data matters to first order — is called the **[[envelope theorem|envelope]]**.

::: key Costates are shadow prices
$\partial J^\star/\partial\mathbf{x}_0 = \boldsymbol\lambda(t_0)$: the starting costate is the gradient of the optimal cost with respect to the starting state, in units of cost per unit of state.
:::

::: example Pricing a dispersed ignition altitude
The Mars powered descent of the last lesson starts at altitude $h_0=1500\,\mathrm{m}$ with velocity $v_0=-75\,\mathrm{m/s}$ (minus means downward), and minimizes propellant. Solved by indirect shooting, it costs $86.7579\,\mathrm{kg}$, and its starting costates are

$$
\lambda_h(0) = 0.017615\,\mathrm{kg/m}, \qquad \lambda_v(0) = -0.356101\,\mathrm{kg/(m/s)}.
$$

**Step 1: predict.** Start $1\,\mathrm{m}$ higher with the same $v_0$. The price says the propellant goes up by $\lambda_h(0)\times 1 = 0.017615\,\mathrm{kg}$ — about $18$ grams. Start $0.5\,\mathrm{m/s}$ *slower*, meaning less negative, $v_0 = -74.5\,\mathrm{m/s}$, so $\delta v_0 = +0.5$. The prediction is $\lambda_v(0)\times 0.5 = -0.178\,\mathrm{kg}$: a saving, because arriving slower leaves less speed to kill.

**Step 2: check by brute force.** Re-solve the entire boundary value problem from scratch at each new start, without using the costates at all:

| Change in start | Predicted change in propellant | Re-solved change in propellant |
| --- | --- | --- |
| $\delta h_0=+1\,\mathrm{m}$ | $+0.017615\,\mathrm{kg}$ | $+0.017613\,\mathrm{kg}$ |
| $\delta h_0=-5\,\mathrm{m}$ | $-0.088076\,\mathrm{kg}$ | $-0.088132\,\mathrm{kg}$ |
| $\delta v_0=+0.1\,\mathrm{m/s}$ | $-0.035610\,\mathrm{kg}$ | $-0.035596\,\mathrm{kg}$ |
| $\delta v_0=-0.5\,\mathrm{m/s}$ | $+0.178051\,\mathrm{kg}$ | $+0.178412\,\mathrm{kg}$ |

**Step 3: read the table.** Two numbers computed once, $\boldsymbol\lambda(0)$, predict a full nonlinear re-solve to four significant figures for a $1\,\mathrm{m}$ or $0.1\,\mathrm{m/s}$ change, and still to two significant figures at $5\,\mathrm{m}$. The agreement slowly worsens as the change grows — exactly what a straight-line (first-order) prediction should do.

**Why a team cares.** Say a better altimeter would tighten the $3\sigma$ (**[[three-sigma|three-sigma]]**) uncertainty in ignition altitude by $20\,\mathrm{m}$. At $17.6$ grams per meter, that is worth $20 \times 0.017615 = 0.352\,\mathrm{kg}$, about $350$ grams of propellant per landing. Now the sensor's own mass and cost have a number to be compared against.
:::

::: warning A free final state does not mean a free final costate
It is tempting to read "the final state is unconstrained" as "$\boldsymbol\lambda(t_f)$ is whatever the solver wants". It is the opposite. On a free endpoint, $\boldsymbol\lambda(t_f) = \partial\phi/\partial\mathbf{x}|_{t_f}$ is a *formula*, forced by transversality. A shooting code that treats it as a free unknown is solving the wrong equations. On a *fixed* endpoint it flips: $\mathbf{x}(t_f)$ is pinned, and $\boldsymbol\lambda(t_f)$ genuinely is free, set only by whatever value makes the flight land on the target. Get the two backward, and a correctly coded integrator will converge to a costate history that satisfies none of the real boundary conditions.
:::

## Check yourself

::: check
A problem has $\phi = 0$ and a terminal constraint that fixes every component of $\mathbf{x}(t_f)$ to a target. What does the general transversality formula say about $\boldsymbol\lambda(t_f)$? Does that match how fixed-endpoint boundary value problems are actually solved?
:::

::: answer
With $\boldsymbol\psi = \mathbf{x}(t_f)-\mathbf{x}_{\text{target}}$ and $p=n$, the slope matrix is $\partial\boldsymbol\psi/\partial\mathbf{x}=\mathbf{I}$, so

$$
\boldsymbol\lambda(t_f) = \frac{\partial\phi}{\partial\mathbf{x}} + \boldsymbol\nu = \mathbf{0}+\boldsymbol\nu,
$$

with $\boldsymbol\nu$ completely free. So the formula puts no condition on $\boldsymbol\lambda(t_f)$ at all: $\boldsymbol\nu$ can absorb any value. That matches practice. In a fixed-endpoint shooting problem you guess $\boldsymbol\lambda(t_0)$, integrate forward, and $\boldsymbol\lambda(t_f)$ is whatever comes out. The only terminal requirement is that $\mathbf{x}(t_f)$ hits the target: $n$ equations for the $n$ unknown components of $\boldsymbol\lambda(t_0)$.
:::

::: check
Stationarity, $\partial H/\partial\mathbf{u}=\mathbf{0}$, is the case where it agrees with the full minimum condition of the next lesson. Point to the exact step in this lesson's derivation that assumed the control was unconstrained.
:::

::: answer
The step was "the control can be nudged in every direction, so its coefficient must be zero." That freedom fails once $\mathbf{u}$ must stay inside a limited set $\mathcal{U}$, like a throttle between $0$ and $100\,\%$. If the best $\mathbf{u}^\star(t)$ sits on the edge of $\mathcal{U}$, only nudges that point back inside are allowed. Then "coefficient must be zero" weakens to "coefficient times every *allowed* direction must be zero or positive" — which is the minimum condition, not stationarity. So this lesson's derivation honestly covers an optimum in the *interior* of the allowed controls. It is not a proof of the general Pontryagin result.
:::

::: check
In the orbit-transfer example, suppose the mission needs to arrive at one *specific* point on the target orbit: $\theta(t_f)=\theta_{\text{target}}$ is fixed. What changes about $\lambda_\theta$, and what does not?
:::

::: answer
$\boldsymbol\psi$ gains a fourth equation, $\theta(t_f)-\theta_{\text{target}} = 0$, so $\partial\boldsymbol\psi/\partial\theta$ is no longer zero. Transversality no longer forces $\lambda_\theta(t_f)=0$; $\lambda_\theta(t_f)$ becomes free, absorbed by the new fourth entry of $\boldsymbol\nu$, like any fixed-endpoint component.

What does not change is the costate equation, $\dot\lambda_\theta = -\partial H/\partial\theta = 0$, because the dynamics still do not contain $\theta$. So $\lambda_\theta$ is still constant over the flight — only no longer pinned to zero. In practice this adds a fourth shooting unknown, $\lambda_\theta(0)$, and a fourth equation, $\theta(t_f)=\theta_{\text{target}}$, to solve for it.
:::

::: check
The descent's ignition altitude is priced at about $17.6\,\mathrm{g/m}$. A guidance engineer proposes triggering ignition on a *velocity* threshold instead, with a $3\sigma$ velocity spread of $\pm0.3\,\mathrm{m/s}$. Estimate the propellant cost of that spread, and say what assumption the estimate rests on.
:::

::: answer
Use the velocity price, $\lambda_v(0)=-0.356101\,\mathrm{kg/(m/s)}$. A velocity error of $0.3\,\mathrm{m/s}$ changes the propellant by about

$$
|\lambda_v(0)|\times0.3 = 0.356101 \times 0.3 \approx 0.107\,\mathrm{kg}.
$$

So the $3\sigma$ spread in velocity becomes a $3\sigma$ spread of about $\pm0.107\,\mathrm{kg}$ of propellant: roughly $107$ grams either way. (A faster-than-planned start costs more; a slower one saves.)

The estimate assumes the change is small enough that the straight-line price still holds. The worked example showed four-figure agreement at $0.1\,\mathrm{m/s}$ and still two-figure agreement at $0.5\,\mathrm{m/s}$, so $0.3\,\mathrm{m/s}$ is comfortably inside that range. A spread ten times larger would need to be checked with an actual re-solve.
:::

::: check
Why does the shadow-price result reuse the very same integration-by-parts calculation as the costate equation and transversality, instead of needing a separate argument?
:::

::: answer
Because all of them read off different pieces of one and the same expression for $\delta\bar J$. The costate equation and stationarity come from making the inside coefficients vanish. Transversality comes from the $t_f$ end piece. The shadow price comes from the $t_0$ end piece, which the first derivation threw away only because it assumed $\delta\mathbf{x}(t_0)=\mathbf{0}$. Once the question changes from "which control is best?" to "how sensitive is the best cost to the start?", that assumption goes, and the same expression — with every other piece already zeroed by the conditions — hands back the answer with no new calculus. That is the general shape of an envelope-theorem argument: at an optimum, the only surviving sensitivity is to the piece of data you chose to change.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Hamiltonian | $H = L + \boldsymbol\lambda^\top\mathbf{f}$ (flashcards: $H = L + \mathbf{p}^\top\mathbf{f}$) |
| Augmented cost | $\bar J = \phi+\boldsymbol\nu^\top\boldsymbol\psi\big|_{t_f} + \int[L+\boldsymbol\lambda^\top(\mathbf{f}-\dot{\mathbf{x}})]\,dt$ |
| Costate equation | $\dot{\boldsymbol\lambda}=-\partial H/\partial\mathbf{x}$, integrated backward from $t_f$ |
| Stationarity | $\partial H/\partial\mathbf{u}=\mathbf{0}$ (interior optimum only) |
| Transversality (state) | $\boldsymbol\lambda(t_f)=\partial\phi/\partial\mathbf{x}+(\partial\boldsymbol\psi/\partial\mathbf{x})^\top\boldsymbol\nu$ |
| Transversality (time, if $t_f$ free) | $H(t_f)+\partial\phi/\partial t+\boldsymbol\nu^\top\partial\boldsymbol\psi/\partial t = 0$ |
| Free endpoint | $p=0$: $\boldsymbol\lambda(t_f)=\partial\phi/\partial\mathbf{x}$ |
| Fixed endpoint | $p=n$: $\boldsymbol\lambda(t_f)$ not given by a formula; set by hitting the target |
| Manifold endpoint | The costate of a state the target never mentions ends at zero (the orbit transfer's $\lambda_\theta\equiv0$) |
| Two-point BVP | State forward from $t_0$, costate backward from $t_f$ |
| Shadow price | $\partial J^\star/\partial\mathbf{x}_0 = \boldsymbol\lambda(t_0)$ |
| Descent prices | $\lambda_h(0)=0.017615\,\mathrm{kg/m}$, $\lambda_v(0)=-0.356101\,\mathrm{kg/(m/s)}$; match brute-force re-solves to 2–4 figures |

The next lesson upgrades stationarity to the full Pontryagin Minimum Principle — the version that still works when $\mathbf{u}$ hits a limit, which every real actuator does — using a sharper kind of nudge: a narrow spike instead of a smooth wiggle.

::: context indirect Indirect versus direct
There are two big families of trajectory methods. **Indirect** methods first derive the optimality conditions by hand — the costate equation, transversality, and so on — and then solve those equations numerically ("optimize, then discretize"). **Direct** methods chop the flight into a list of numbers first and hand the list to a general optimizer ("discretize, then optimize"). This lesson and the next three are the indirect side; from lesson six on, the module goes direct, and you will see why industry mostly flies that one.
:::

::: context codimension Counting the pinned directions
Think of a state with three numbers as a point in a room. One equation, like "height equals $2\,\mathrm{m}$", leaves a whole floor of allowed points: a surface. Two equations leave a line. Three leave a single point. The number of equations is the **codimension**: how many directions you have pinned, out of the room's three. The endpoint set always has $n - p$ free directions left over.
:::

::: context target-orbit Arriving anywhere on a circle
The orbit transfer must end on the outer circle with the right speed, but the point where it joins the circle is up to the optimizer. Each dot below is an allowed arrival; the set of all of them is the target manifold.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <circle cx="150" cy="100" r="16" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="150" cy="100" r="56" fill="none" stroke="#6c7a93" stroke-width="1.5"/>
  <circle cx="150" cy="100" r="72" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="222" cy="100" r="4" fill="#1d6fd1"/>
  <circle cx="150" cy="28" r="4" fill="#1d6fd1"/>
  <circle cx="78" cy="100" r="4" fill="#1d6fd1"/>
  <circle cx="150" cy="172" r="4" fill="#1d6fd1"/>
  <circle cx="200.9" cy="49.1" r="4" fill="#1d6fd1"/>
  <circle cx="99.1" cy="150.9" r="4" fill="#1d6fd1"/>
  <text x="150" y="104" font-size="11" text-anchor="middle" fill="#1f2a44">Earth</text>
  <text x="150" y="70" font-size="11" text-anchor="middle" fill="#6c7a93">start 7000 km</text>
  <text x="240" y="150" font-size="12" fill="#1d6fd1">target 9000 km:</text>
  <text x="240" y="166" font-size="12" fill="#1d6fd1">r, v_r, v_t pinned,</text>
  <text x="240" y="182" font-size="12" fill="#1d6fd1">angle free</text>
</svg>
```

The circles are to scale: the inner one is $7/9$ the radius of the outer one.
:::

::: context multipliers Prices on rules
In the optimization module, to minimize something subject to a rule like $g(x) = 0$, you added $\nu\,g(x)$ to the cost and looked for a flat spot. The number $\nu$ is a **Lagrange multiplier**, and at the optimum it tells you how much the best cost would change if the rule were loosened a little. The costate is the same idea stretched over time: one multiplier for the dynamics rule at every instant.
:::

::: context adjoint-name Why "adjoint" and "costate"
"Costate" says the costate is the state's partner: one entry per state, running alongside it. "Adjoint" comes from linear algebra: the costate equation, linearized, uses the *transpose* of the matrix that drives small state changes, and the transpose is also called the adjoint. Machine-learning engineers meet the same thing under another name: backpropagation is a costate computation, run backward from the loss.
:::

::: context by-parts The product rule, run backward
The product rule says $\frac{d}{dt}(\lambda\,\delta x) = \dot\lambda\,\delta x + \lambda\,\delta\dot x$. Add up both sides over the flight. The left side adds up a rate of change, so it becomes the value at the end minus the value at the start. Rearranging gives $\int \lambda\,\delta\dot x\,dt = [\lambda\,\delta x] - \int\dot\lambda\,\delta x\,dt$. That is integration by parts: it trades a derivative on one factor for a derivative on the other, plus two end values.
:::

::: context full-rank Independent equations
"Full row rank" means none of the $p$ equations in $\boldsymbol\psi$ is secretly a copy or a combination of the others. If you wrote "radius equals $9000\,\mathrm{km}$" twice, the two equations would pin only one direction, and the multipliers $\boldsymbol\nu$ would not be uniquely defined. Independent equations are what let you choose $\boldsymbol\nu$ to cancel the end term exactly.
:::

::: context why-backward Two ends, two directions
The state is known at the start, so it runs forward. The costate is known at the end, so it runs backward. Neither can be computed alone, because each depends on the other along the way.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="65" x2="320" y2="65" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="57" x2="40" y2="73" stroke="#1f2a44" stroke-width="2"/>
  <line x1="320" y1="57" x2="320" y2="73" stroke="#1f2a44" stroke-width="2"/>
  <text x="40" y="88" font-size="12" text-anchor="middle" fill="#1f2a44">t_0</text>
  <text x="320" y="88" font-size="12" text-anchor="middle" fill="#1f2a44">t_f</text>
  <line x1="50" y1="38" x2="300" y2="38" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="310,38 298,32 298,44" fill="#1d6fd1"/>
  <text x="50" y="28" font-size="12" fill="#1d6fd1">state x: known at the start</text>
  <line x1="310" y1="104" x2="60" y2="104" stroke="#b4232c" stroke-width="3"/>
  <polygon points="50,104 62,98 62,110" fill="#b4232c"/>
  <text x="310" y="124" font-size="12" text-anchor="end" fill="#b4232c">costate λ: known at the end</text>
</svg>
```
:::

::: context shadow-price Where "shadow price" comes from
Economists coined the phrase for the value of something that has no market price tag, like one more hour of factory time: you cannot buy it in a shop, but the optimal plan tells you what it is worth. The costate at the start is the slope of the best-cost curve against the starting state.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="140" x2="330" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="15" x2="40" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M50,125 C120,110 200,80 320,30" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="120" y1="126" x2="300" y2="62" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 3"/>
  <circle cx="200" cy="97" r="4" fill="#1f2a44"/>
  <text x="48" y="24" font-size="12" fill="#1f2a44">best cost J*</text>
  <text x="330" y="156" font-size="12" text-anchor="end" fill="#1f2a44">starting state x_0</text>
  <text x="212" y="118" font-size="12" fill="#b4232c">slope = λ(t_0)</text>
</svg>
```
:::

::: context envelope The envelope theorem
At the bottom of a valley, the ground is flat. So if something shifts the whole landscape a little, the lowest height changes only because of the shift itself — not because the lowest point moved, since moving along flat ground costs nothing at first order. That is the envelope theorem, and it is why the shadow-price derivation could ignore how the best control re-adjusts to a new start.
:::

::: context three-sigma What 3-sigma means
Measurements scatter. Sigma, $\sigma$, is the standard deviation: the typical size of the scatter. For the bell-shaped normal distribution, about $99.7\,\%$ of values fall within $3\sigma$ of the average. Engineers design to "$3\sigma$" so that only about three flights in a thousand see a bigger error.
:::
