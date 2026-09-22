---
id: l01-bolza-mayer-lagrange
title: The Bolza, Mayer and Lagrange cost forms
minutes: 16
covers:
  - The general optimal control problem in Bolza, Mayer and Lagrange form, and how to convert between them
---

A trajectory optimisation problem starts as a sentence: land softly using the least propellant, reach the target orbit in the least time, get off the pad without exceeding a structural load. Turning that sentence into mathematics that a computer can solve means writing down exactly what varies (the state and control histories), exactly what is fixed (the dynamics, the boundary conditions), and exactly what is being minimised. That last piece — the cost functional — comes in three standard shapes, and every solver you will ever point at a vehicle problem expects its cost written in one of them.

This module works three real problems throughout: a Mars-style powered descent that must land on zero velocity while burning as little propellant as possible, a low-thrust orbit transfer that must raise a spacecraft from one circular orbit to another in minimum time, and — starting a few lessons from now — a powered ascent to orbital insertion. All three are Bolza problems underneath, and the first order of business is knowing exactly what that word means and why an engineer, not just a mathematician, should care about the difference between it and its two special cases.

## The general problem

The setting is the same one the optimal control module's treatment of the Hamiltonian and the Pontryagin minimum principle used, continued here rather than rebuilt: a state $\mathbf{x}(t) \in \mathbb{R}^n$ and a control $\mathbf{u}(t) \in \mathbb{R}^m$ evolving under

$$
\dot{\mathbf{x}} = \mathbf{f}(\mathbf{x}, \mathbf{u}, t), \qquad \mathbf{x}(t_0) = \mathbf{x}_0 \text{ given},
$$

over an interval $[t_0, t_f]$ that may have a fixed or free final time. The **Bolza cost functional** is

$$
J = \phi\big(\mathbf{x}(t_f), t_f\big) + \int_{t_0}^{t_f} L\big(\mathbf{x}(t), \mathbf{u}(t), t\big)\, dt.
$$

$\phi$ is the **terminal cost**: a function of the state and time only at the single instant $t_f$, evaluated once. $L$ is the **running cost**, or Lagrangian: a function of state, control and time, evaluated continuously and accumulated over the whole flight. Nothing here is assumed linear, quadratic or convex — $\mathbf{f}$, $\phi$ and $L$ are whatever the physics and the mission demand.

Two special cases have their own names because they are common enough to deserve one:

- A **Mayer problem** has $L \equiv 0$: the cost is purely terminal, $J = \phi(\mathbf{x}(t_f), t_f)$. Minimum time is Mayer with $\phi = t_f$. Maximum final mass is Mayer with $\phi = -m(t_f)$.
- A **Lagrange problem** has $\phi \equiv 0$: the cost is purely an accumulated integral, $J = \int_{t_0}^{t_f} L\, dt$. Minimum control effort, $L = \mathbf{u}^\top\mathbf{R}\mathbf{u}$, is Lagrange, and so is minimum propellant written as $L = T/c$ for a thrust magnitude $T$ and effective exhaust velocity $c$.

::: key The Bolza cost functional
$J = \phi(\mathbf{x}(t_f), t_f) + \int_{t_0}^{t_f} L(\mathbf{x}, \mathbf{u}, t)\, dt$. Mayer: $L \equiv 0$. Lagrange: $\phi \equiv 0$. Bolza is the general case; the other two are the special cases you get by zeroing one term.
:::

A subtlety worth naming immediately: nothing about "Bolza" versus "Mayer" versus "Lagrange" changes what trajectory is optimal. They are three ways of writing down the *same number* $J$ for the *same trajectory*. The reason to care is entirely practical — which form is easiest to derive necessary conditions from, and, later in this module, which form a numerical transcription handles most cleanly.

## Converting Lagrange (or Bolza) into Mayer

The conversion that matters in practice runs one direction: any running cost can be folded into an extra state, turning Bolza or Lagrange into pure Mayer. Introduce an **augmented state** $x_{n+1}$ with its own trivial dynamics,

$$
\dot{x}_{n+1} = L(\mathbf{x}, \mathbf{u}, t), \qquad x_{n+1}(t_0) = 0.
$$

By the fundamental theorem of calculus, $x_{n+1}(t_f) = \int_{t_0}^{t_f} L\, dt$ — the running cost, accumulated automatically by integrating this one extra differential equation alongside the physical dynamics. The Bolza cost becomes

$$
J = \phi\big(\mathbf{x}(t_f), t_f\big) + x_{n+1}(t_f) = \tilde\phi\big(\tilde{\mathbf{x}}(t_f), t_f\big), \qquad \tilde{\mathbf{x}} = \begin{pmatrix}\mathbf{x} \\ x_{n+1}\end{pmatrix},
$$

a pure Mayer cost on the augmented state $\tilde{\mathbf{x}} \in \mathbb{R}^{n+1}$. Nothing about the trajectory changes — $x_{n+1}(t)$ is running fuel-spent, or accumulated squared control effort, or elapsed time, sitting alongside altitude and velocity as one more number the dynamics carry forward. The augmented dynamics $\tilde{\mathbf{f}} = (\mathbf{f}, L)$ are exactly as smooth as $\mathbf{f}$ and $L$ were.

This is not a bookkeeping curiosity. A numerical solver that transcribes the dynamics into defect constraints — the subject of several lessons ahead — already has machinery for integrating a state equation to whatever order its quadrature rule provides. Handing it a *running cost* as a second, separate quadrature (Simpson's rule for the cost, a different scheme for the dynamics, evaluated on a different mesh) is an invitation for the two to disagree. Handing it an *extra state* means the cost is integrated by the exact same defect constraints, to the exact same order, on the exact same mesh, as everything else. Every direct-transcription code either performs this augmentation internally or expects you to have done it, which is the practical reason Mayer form, not the Bolza form the problem started in, is what actually reaches the solver.

::: example Closing the propellant bookkeeping on a landing burn
A later lesson solves, by indirect shooting, the terminal braking burn of a Mars-style powered descent: mass $m_0 = 1000\,\mathrm{kg}$, specific impulse $I_{sp} = 225\,\mathrm{s}$ so $c = I_{sp}g_0 = 225 \times 9.80665 = 2206.50\,\mathrm{m/s}$, thrust fixed at $T_{\max} = 6000\,\mathrm{N}$ for the final burn phase, lasting $\Delta t = 31.9063\,\mathrm{s}$.

Posed in Lagrange form, minimum propellant is $J_L = \int_0^{\Delta t} (T_{\max}/c)\, dt = (T_{\max}/c)\,\Delta t$, since $T_{\max}$ is constant over the burn:

$$
J_L = \frac{6000}{2206.50} \times 31.9063 = 86.7609\,\mathrm{kg}.
$$

Posed in Mayer form on the augmented mass state — which is the ordinary rocket equation, $\dot m = -T/c$ integrated as a state rather than treated as a separate cost integral — the propellant used is $m(0) - m(\Delta t)$. Integrating $\dot m = -T_{\max}/c$ over the same burn gives $m(\Delta t) = m_0 - (T_{\max}/c)\Delta t = 1000 - 86.7609 = 913.2391\,\mathrm{kg}$, so

$$
J_M = m(0) - m(\Delta t) = 1000 - 913.2391 = 86.7609\,\mathrm{kg}.
$$

$J_L = J_M$ to the digit, because they are not two different numbers that happen to agree — $x_{n+1}(t_f)$ in the augmentation *is* $m_0 - m(t_f)$ once you write $\dot x_{n+1} = T/c = -\dot m$. The identity is exact, not approximate; the shooting solution referenced above carries the check further, with mass as a genuine third state rather than a hand-integrated one, and confirms the same number to nine significant figures.
:::

## Converting Mayer into Lagrange, and why you rarely bother

The other direction exists too, for completeness, though it earns far less use. If $\phi$ is continuously differentiable along trajectories, the fundamental theorem of calculus runs the other way:

$$
\phi\big(\mathbf{x}(t_f), t_f\big) = \phi\big(\mathbf{x}(t_0), t_0\big) + \int_{t_0}^{t_f} \frac{d}{dt}\phi\big(\mathbf{x}(t), t\big)\, dt = \phi(\mathbf{x}_0, t_0) + \int_{t_0}^{t_f} \left[\frac{\partial\phi}{\partial\mathbf{x}}^\top \mathbf{f}(\mathbf{x},\mathbf{u},t) + \frac{\partial\phi}{\partial t}\right] dt.
$$

Since $\mathbf{x}_0$ and $t_0$ are fixed data, $\phi(\mathbf{x}_0, t_0)$ is a constant that does not affect which trajectory minimises $J$, and dropping it leaves a pure Lagrange cost with $L = (\partial\phi/\partial\mathbf{x})^\top\mathbf{f} + \partial\phi/\partial t$. The identity is exact under the same smoothness that made the other direction exact. It is rarely the conversion an engineer performs by hand, because it trades one clean terminal number for a running integral of a gradient dotted with the dynamics — more bookkeeping, not less — but it is worth having seen once: it confirms that Bolza, Mayer and Lagrange are three notations for the same underlying quantity, freely interchangeable, and a problem is never "stuck" in one form.

::: example Minimum time is Mayer and Lagrange at once
A later lesson solves a low-thrust transfer from a circular orbit at $r_0 = 7000\,\mathrm{km}$ to one at $r_1 = 9000\,\mathrm{km}$, minimum time, arriving at $t_f = 11\,475.17\,\mathrm{s} = 3.1875\,\mathrm{hr}$. Posed as Mayer, $\phi = t_f$ and $J = t_f = 11\,475.17\,\mathrm{s}$ directly — no integral at all. Posed as Lagrange, $L = 1$ and $J = \int_0^{t_f} 1\, dt = t_f$, the same number by the most literal possible instance of the running-cost idea: the augmented state is elapsed time itself, $\dot x_{n+1} = 1$, $x_{n+1}(0) = 0$, so $x_{n+1}(t) \equiv t$. Minimum-time problems are usually stated as Mayer for exactly this reason — there is nothing for an integral to add — but seeing that the Lagrange form collapses to the identical number, with $L=1$ being the simplest possible running cost, is a useful sanity check on the augmentation machinery before applying it to a running cost that is not trivial.

The same transfer spends propellant while it steers: mass depletes at a fixed rate $\dot m = -T_{\max}/c$ with $T_{\max} = 100\,\mathrm{N}$, $c = 1800 \times 9.80665 = 17\,651.97\,\mathrm{m/s}$, over the $11\,475.17\,\mathrm{s}$ flight — $65.008\,\mathrm{kg}$ of a $1200\,\mathrm{kg}$ vehicle, about $5.42\,\%$. That number is not part of the minimum-time cost at all; it falls out of integrating the mass state alongside $r$, $v_r$ and $v_t$ regardless of what $J$ penalises, which is exactly the point of carrying mass as a state rather than as an afterthought.
:::

## Why bother keeping Bolza around at all

If every running cost can be pushed into a state, and the practical traffic runs Bolza and Lagrange toward Mayer, it is fair to ask why this module will keep writing $J = \phi + \int L\,dt$ at all instead of always working in pure Mayer form. Two reasons, both about people rather than mathematics.

First, **interpretability**. A powered-descent cost that reads $\phi = -m(t_f)$, $L = w\,\|\mathbf{u}\|^2$ tells a reader at a glance that the mission trades a small amount of terminal mass against smoother commanded accelerations; the same problem after full Mayer augmentation is a single scalar $\tilde\phi$ on an $(n+2)$-dimensional terminal state, with the trade buried inside a matrix. Keeping $\phi$ and $L$ separate is documentation.

Second, **the necessary conditions read differently depending on where a term sits**, which is the subject of the next two lessons. A term in $\phi$ enters only through the transversality condition, evaluated once at $t_f$. A term in $L$ enters the Hamiltonian at every instant and shapes the costate dynamics throughout the flight. Recognising which of the two you are looking at is often the fastest way to guess the qualitative structure of a solution before deriving it in full — a running cost that is linear in $\mathbf{u}$ hints at bang-bang control, worked out properly a few lessons ahead; a terminal cost never does, because it never touches $\mathbf{u}$ at all.

::: warning The augmented state needs an initial condition, and it is not automatic
$x_{n+1}(t_0) = 0$ is a genuine boundary condition, not a default a solver will assume for you. Set it up in a shooting formulation or a direct transcription without pinning $x_{n+1}(t_0)$, and the augmented state is free to start anywhere, which makes $x_{n+1}(t_f)$ meaningless as an accumulated cost — the "integral" it represents no longer starts from zero. This is a common source of a solver returning a converged answer with a cost that looks wrong by a constant offset: check that every augmented state's initial condition was actually imposed, not left as a free variable the optimiser quietly set to whatever was convenient.
:::

## Check yourself

::: check
A problem penalises control effort throughout flight and a terminal position error at the end: $L = \mathbf{u}^\top\mathbf{u}$, $\phi = \mathbf{e}(t_f)^\top\mathbf{Q}_f\,\mathbf{e}(t_f)$ with $\mathbf{e} = \mathbf{x} - \mathbf{x}_{\text{target}}$. Write the fully augmented Mayer form, naming the new state and its dynamics.
:::

::: answer
Introduce $x_{n+1}$ with $\dot x_{n+1} = \mathbf{u}^\top\mathbf{u}$, $x_{n+1}(t_0) = 0$. The augmented state is $\tilde{\mathbf{x}} = (\mathbf{x}, x_{n+1})$ and the cost becomes pure Mayer, $J = \tilde\phi(\tilde{\mathbf{x}}(t_f)) = \big(\mathbf{x}(t_f) - \mathbf{x}_{\text{target}}\big)^\top\mathbf{Q}_f\big(\mathbf{x}(t_f) - \mathbf{x}_{\text{target}}\big) + x_{n+1}(t_f)$, a function of the terminal augmented state alone. The original $\phi$ did not need to change at all — it already depended only on $\mathbf{x}(t_f)$ — only the running term needed a state to carry it.
:::

::: check
Why do direct-transcription codes almost universally ask for the problem in Mayer form internally, even when you hand them a Bolza problem?
:::

::: answer
Because a transcription already enforces the state dynamics through defect constraints evaluated by a specific quadrature rule on a specific mesh. If the running cost is integrated separately — a different quadrature, possibly a different implicit mesh — the discretised cost and the discretised dynamics are no longer using consistent arithmetic, which introduces an inconsistency that has nothing to do with the true problem and everything to do with bookkeeping. Augmenting the running cost into a state means the *same* defect constraints that integrate altitude and velocity also integrate the cost, to the same order, so the discretised $J$ is exactly what you would get by summing the augmented state's own defects. It is less code, not more, which is the real reason it is standard practice rather than a purist's preference.
:::

::: check
The Mars descent example gave $J_L = J_M = 86.7609\,\mathrm{kg}$ for the burn phase alone. Is it a coincidence that a Lagrange integral and a Mayer terminal-mass difference produced the identical number?
:::

::: answer
No — they are the same computation performed two ways, not two independent calculations that happened to agree. Writing $\dot x_{n+1} = T/c$ with $x_{n+1}(0)=0$ gives $x_{n+1}(t_f) = \int_0^{t_f}(T/c)\,dt$ by definition, which is $J_L$. But $\dot m = -T/c$ is the *same* differential equation up to a sign, so $x_{n+1}(t) \equiv m(0) - m(t)$ for all $t$, exactly. $J_M = m(0)-m(t_f)$ is therefore identically $x_{n+1}(t_f) = J_L$; no cancellation of independently-computed quantities is involved, only one integral written in two notations.
:::

::: check
A Mayer problem has $\phi(\mathbf{x}(t_f), t_f) = -m(t_f)$ with no running cost at all. A colleague argues this problem has "no Lagrangian" and therefore the Euler-Lagrange machinery of the next lesson does not apply to it. Are they right?
:::

::: answer
No. $L \equiv 0$ is a perfectly good, if trivial, running cost — the Hamiltonian is $H = 0 + \boldsymbol{\lambda}^\top\mathbf{f} = \boldsymbol{\lambda}^\top\mathbf{f}$, and every necessary condition derived from the general Bolza problem specialises correctly by substituting $L=0$. Nothing in the derivation of the costate equation, the stationarity condition or transversality assumed $L$ was nonzero; a Mayer problem is not an exception to the theory, it is the theory with one term set to zero, exactly parallel to how a Lagrange problem is the same theory with $\phi$ set to zero. This is precisely why the general Bolza statement is worth carrying even though most solved problems turn out to be pure Mayer or pure Lagrange in practice — the conditions are derived once, for the general case, and every special case is free.
:::

::: check
Minimum-time orbit transfer was posed as Mayer ($\phi = t_f$) and as Lagrange ($L=1$), giving the identical cost $t_f$. Pose the same minimum-time problem in full Bolza form with both terms nonzero, and explain why that would be a strange thing to do.
:::

::: answer
Split the cost arbitrarily, for instance $\phi = \alpha t_f$ and $L = 1-\alpha$ for some $0 < \alpha < 1$: then $J = \alpha t_f + (1-\alpha)\int_0^{t_f}dt = \alpha t_f + (1-\alpha)t_f = t_f$, still correct, still equal to the same number, for any choice of $\alpha$. It is a strange thing to do because it adds a free parameter that affects nothing about the optimal trajectory or the optimal cost — the split is invisible to the answer — while changing the Hamiltonian's running-cost term $L=1-\alpha$ and therefore, cosmetically, the costate bookkeeping used to derive the solution. There is no engineering reason to introduce a distinction with no effect; minimum time is written as pure Mayer or pure Lagrange precisely because splitting it buys nothing.
:::

## Summary

| Object | Statement |
| --- | --- |
| Bolza cost | $J = \phi(\mathbf{x}(t_f),t_f) + \int_{t_0}^{t_f}L(\mathbf{x},\mathbf{u},t)\,dt$ |
| Mayer | $L \equiv 0$; terminal cost only |
| Lagrange | $\phi \equiv 0$; running cost only |
| Lagrange/Bolza $\to$ Mayer | Augment $\dot x_{n+1}=L$, $x_{n+1}(t_0)=0$; then $J = \phi + x_{n+1}(t_f)$ |
| Mayer $\to$ Lagrange | $L = (\partial\phi/\partial\mathbf{x})^\top\mathbf{f} + \partial\phi/\partial t$, dropping the constant $\phi(\mathbf{x}_0,t_0)$ |
| Why augment | A transcription's defect constraints integrate the augmented state to the same order as the dynamics, on the same mesh |
| Descent check | $J_L = (T_{\max}/c)\,\Delta t = 86.7609\,\mathrm{kg}$; $J_M = m_0-m(\Delta t) = 86.7609\,\mathrm{kg}$ — identical, not coincidental |
| Minimum time | Mayer with $\phi=t_f$, or Lagrange with $L=1$; both give $J=t_f$ |
| Why keep Bolza | Interpretability, and $\phi$ versus $L$ enter the necessary conditions differently (next two lessons) |

The next lesson takes the general Bolza problem and derives, from a first-order variational argument rather than by citation, the Hamiltonian, the costate equation and the transversality conditions — the Euler-Lagrange machinery this lesson has been setting the stage for.
