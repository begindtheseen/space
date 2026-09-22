---
id: l02-hjb-and-calculus-of-variations
title: Two derivations of LQR: dynamic programming and the calculus of variations
minutes: 21
covers:
  - LQR derived via dynamic programming (HJB) and via calculus of variations
---

There are two standard whiteboard derivations of the linear quadratic regulator, and a GNC interview will ask for one of them without telling you which. They start from different places. Dynamic programming reasons backwards from the end of the horizon about the *value* of being in a state; the calculus of variations perturbs a candidate trajectory and demands that the cost stop changing to first order. They arrive at the same matrix differential equation for the same matrix $\mathbf{P}$, and the two views of $\mathbf{P}$ they supply — optimal cost-to-go on one side, costate multiplier on the other — are both used daily.

The variational route will feel familiar, because it is the Lagrange multiplier machinery of the optimisation module applied to a constraint that holds at every instant rather than at a point. The dynamics $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u}$ are an equality constraint; the multiplier attached to them is a function of time called the **costate**, written $\boldsymbol{\lambda}(t)$; and exactly as in the finite-dimensional case, the multiplier is a shadow price — here, the sensitivity of the remaining cost to a nudge in the state. Stationarity in $\mathbf{u}$ replaces $\nabla_{\mathbf{x}}\mathcal{L} = \mathbf{0}$, and the multiplier picks up a differential equation of its own.

Take the plant $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u}$ and the finite-horizon cost of the previous lesson,

$$
J\big(\mathbf{x}_0, 0\big) = \mathbf{x}(t_f)^\top\mathbf{Q}_f\mathbf{x}(t_f) + \int_0^{t_f}\big(\mathbf{x}^\top\mathbf{Q}\mathbf{x} + \mathbf{u}^\top\mathbf{R}\mathbf{u}\big)dt ,
$$

with $\mathbf{Q}, \mathbf{Q}_f \succeq 0$ and $\mathbf{R} \succ 0$. The infinite-horizon answer falls out at the end by letting $t_f \to \infty$.

## Dynamic programming and the principle of optimality

Define the **value function** as the best cost achievable from state $\mathbf{x}$ at time $t$ onwards:

$$
V(\mathbf{x}, t) = \min_{\mathbf{u}(\cdot)}\left[\mathbf{x}(t_f)^\top\mathbf{Q}_f\mathbf{x}(t_f) + \int_t^{t_f}\big(\mathbf{x}^\top\mathbf{Q}\mathbf{x} + \mathbf{u}^\top\mathbf{R}\mathbf{u}\big)d\tau\right],
\qquad V(\mathbf{x}, t_f) = \mathbf{x}^\top\mathbf{Q}_f\mathbf{x} .
$$

Bellman's **principle of optimality** says that whatever the first decision was, the rest of an optimal trajectory must itself be optimal from wherever that decision left you — otherwise you could improve the tail and, with it, the whole. Applied over a short interval $dt$,

$$
V(\mathbf{x}, t) = \min_{\mathbf{u}}\Big[\big(\mathbf{x}^\top\mathbf{Q}\mathbf{x} + \mathbf{u}^\top\mathbf{R}\mathbf{u}\big)dt + V\big(\mathbf{x} + (\mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u})dt,\ t + dt\big)\Big].
$$

Expand the last term to first order, $V(\mathbf{x},t) + \frac{\partial V}{\partial t}dt + (\nabla_{\mathbf{x}}V)^\top(\mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u})dt$, cancel $V(\mathbf{x},t)$ from both sides, and divide by $dt$:

$$
-\frac{\partial V}{\partial t} = \min_{\mathbf{u}}\Big[\mathbf{x}^\top\mathbf{Q}\mathbf{x} + \mathbf{u}^\top\mathbf{R}\mathbf{u} + (\nabla_{\mathbf{x}}V)^\top(\mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u})\Big].
$$

This is the **Hamilton–Jacobi–Bellman equation**. It holds for any dynamics and any running cost; what makes the linear quadratic case tractable is that both the inner minimisation and the resulting partial differential equation can be solved in closed form.

The inner minimisation is unconstrained and strictly convex in $\mathbf{u}$, since $\mathbf{R} \succ 0$. Setting the gradient to zero,

$$
2\mathbf{R}\mathbf{u} + \mathbf{B}^\top\nabla_{\mathbf{x}}V = \mathbf{0}
\qquad\Longrightarrow\qquad
\mathbf{u}^\star = -\tfrac{1}{2}\mathbf{R}^{-1}\mathbf{B}^\top\nabla_{\mathbf{x}}V .
$$

Now the ansatz. The terminal condition $V(\mathbf{x}, t_f) = \mathbf{x}^\top\mathbf{Q}_f\mathbf{x}$ is quadratic, the dynamics are linear and the running cost is quadratic, so try $V(\mathbf{x},t) = \mathbf{x}^\top\mathbf{P}(t)\mathbf{x}$ with $\mathbf{P}(t)$ symmetric. Then $\nabla_{\mathbf{x}}V = 2\mathbf{P}\mathbf{x}$ and $\partial V/\partial t = \mathbf{x}^\top\dot{\mathbf{P}}\mathbf{x}$, so

$$
\mathbf{u}^\star = -\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}(t)\,\mathbf{x} \equiv -\mathbf{K}(t)\,\mathbf{x} .
$$

The optimal control is a **linear state feedback**, and that is a result, not an assumption. Substituting it and the ansatz back into the HJB equation:

$$
-\mathbf{x}^\top\dot{\mathbf{P}}\mathbf{x} = \mathbf{x}^\top\mathbf{Q}\mathbf{x} + \mathbf{x}^\top\mathbf{P}\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}\mathbf{x} + 2\mathbf{x}^\top\mathbf{P}\big(\mathbf{A}\mathbf{x} - \mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}\mathbf{x}\big),
$$

where the control cost used $\mathbf{u}^{\star\top}\mathbf{R}\mathbf{u}^\star = \mathbf{x}^\top\mathbf{P}\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}\mathbf{x}$. Write $2\mathbf{x}^\top\mathbf{P}\mathbf{A}\mathbf{x} = \mathbf{x}^\top(\mathbf{A}^\top\mathbf{P} + \mathbf{P}\mathbf{A})\mathbf{x}$, collect, and note that the two $\mathbf{P}\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}$ terms combine to a single negative one:

$$
-\mathbf{x}^\top\dot{\mathbf{P}}\mathbf{x} = \mathbf{x}^\top\Big(\mathbf{A}^\top\mathbf{P} + \mathbf{P}\mathbf{A} - \mathbf{P}\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P} + \mathbf{Q}\Big)\mathbf{x} .
$$

This must hold for every $\mathbf{x}$, and both sides are symmetric quadratic forms, so the matrices are equal:

$$
-\dot{\mathbf{P}} = \mathbf{A}^\top\mathbf{P} + \mathbf{P}\mathbf{A} - \mathbf{P}\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P} + \mathbf{Q}, \qquad \mathbf{P}(t_f) = \mathbf{Q}_f .
$$

That is the **differential Riccati equation**, integrated backwards from the terminal condition. Over an infinite horizon $\mathbf{P}$ settles to a constant and $\dot{\mathbf{P}} = \mathbf{0}$, leaving the algebraic Riccati equation.

::: key LQR gain and what P means
$\mathbf{K} = \mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}$, with control $\mathbf{u} = -\mathbf{K}\mathbf{x}$ and closed loop $\mathbf{A} - \mathbf{B}\mathbf{K}$. The matrix $\mathbf{P}$ is the optimal cost-to-go kernel: $V(\mathbf{x}) = \mathbf{x}^\top\mathbf{P}\mathbf{x}$ is the cost of flying optimally from $\mathbf{x}$ to the end. It is also a valid Lyapunov function for the closed loop, which is how trajectory-stabilization funnels are later built.
:::

## The calculus of variations route

Now forget value functions. Treat the problem as constrained minimisation over the pair of functions $(\mathbf{x}(\cdot), \mathbf{u}(\cdot))$, with the dynamics as an equality constraint imposed at every instant. Attach a multiplier $\boldsymbol{\lambda}(t) \in \mathbb{R}^n$ to that constraint and form the **Hamiltonian**

$$
H(\mathbf{x}, \mathbf{u}, \boldsymbol{\lambda}) = \tfrac{1}{2}\big(\mathbf{x}^\top\mathbf{Q}\mathbf{x} + \mathbf{u}^\top\mathbf{R}\mathbf{u}\big) + \boldsymbol{\lambda}^\top\big(\mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u}\big).
$$

The factor of one half is a convention: halving the running cost halves $H$ and halves $\boldsymbol{\lambda}$, changes no minimiser, and buys tidier formulas. With it, the first-order conditions are

$$
\dot{\mathbf{x}} = \frac{\partial H}{\partial\boldsymbol{\lambda}} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u},
\qquad
\dot{\boldsymbol{\lambda}} = -\frac{\partial H}{\partial\mathbf{x}} = -\mathbf{Q}\mathbf{x} - \mathbf{A}^\top\boldsymbol{\lambda},
\qquad
\frac{\partial H}{\partial\mathbf{u}} = \mathbf{R}\mathbf{u} + \mathbf{B}^\top\boldsymbol{\lambda} = \mathbf{0}.
$$

The first is the constraint restated. The second, the **costate equation**, is the dynamic analogue of stationarity in $\mathbf{x}$: the multiplier propagates backwards, driven by the state penalty and by the transpose of the plant. The third gives the optimal control directly,

$$
\mathbf{u}^\star = -\mathbf{R}^{-1}\mathbf{B}^\top\boldsymbol{\lambda} .
$$

The boundary conditions split between the two ends. The state is known at the start, $\mathbf{x}(0) = \mathbf{x}_0$. The costate is fixed at the finish by the **transversality condition**, which for a terminal cost $\phi(\mathbf{x}) = \mathbf{x}^\top\mathbf{Q}_f\mathbf{x}$ (halved by the same convention) is $\boldsymbol{\lambda}(t_f) = \mathbf{Q}_f\mathbf{x}(t_f)$. Substituting $\mathbf{u}^\star$ into the two differential equations gives a linear **two-point boundary value problem**:

$$
\frac{d}{dt}\begin{bmatrix}\mathbf{x}\\ \boldsymbol{\lambda}\end{bmatrix}
= \underbrace{\begin{bmatrix}\mathbf{A} & -\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\\ -\mathbf{Q} & -\mathbf{A}^\top\end{bmatrix}}_{\textstyle \mathbf{M}}
\begin{bmatrix}\mathbf{x}\\ \boldsymbol{\lambda}\end{bmatrix},
\qquad \mathbf{x}(0) = \mathbf{x}_0, \quad \boldsymbol{\lambda}(t_f) = \mathbf{Q}_f\mathbf{x}(t_f).
$$

$\mathbf{M}$ is the $2n \times 2n$ **Hamiltonian matrix**. It is the object the next lesson uses to solve the algebraic Riccati equation by eigen-decomposition, and its defining property is already visible: if $\mu$ is an eigenvalue then so is $-\mu$, because $\mathbf{M}$ satisfies $\mathbf{J}^{-1}\mathbf{M}^\top\mathbf{J} = -\mathbf{M}$ with $\mathbf{J} = \begin{bmatrix}\mathbf{0} & \mathbf{I}\\ -\mathbf{I} & \mathbf{0}\end{bmatrix}$, so $\mathbf{M}$ and $-\mathbf{M}^\top$ are similar and have the same spectrum. The eigenvalues come in mirror pairs about the imaginary axis.

## The sweep: from a boundary value problem to a Riccati equation

A two-point boundary value problem is a nuisance in flight software — you cannot propagate it forward without already knowing $\boldsymbol{\lambda}(0)$. Bryson's **sweep method** removes the nuisance. Guess that the costate is a time-varying linear function of the state,

$$
\boldsymbol{\lambda}(t) = \mathbf{P}(t)\,\mathbf{x}(t),
$$

which is consistent with the terminal condition if $\mathbf{P}(t_f) = \mathbf{Q}_f$. Differentiate, then substitute both differential equations:

$$
\dot{\boldsymbol{\lambda}} = \dot{\mathbf{P}}\mathbf{x} + \mathbf{P}\dot{\mathbf{x}} = \dot{\mathbf{P}}\mathbf{x} + \mathbf{P}\big(\mathbf{A}\mathbf{x} - \mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}\mathbf{x}\big),
\qquad
\dot{\boldsymbol{\lambda}} = -\mathbf{Q}\mathbf{x} - \mathbf{A}^\top\mathbf{P}\mathbf{x}.
$$

Equate and gather:

$$
\Big(\dot{\mathbf{P}} + \mathbf{P}\mathbf{A} + \mathbf{A}^\top\mathbf{P} - \mathbf{P}\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P} + \mathbf{Q}\Big)\mathbf{x} = \mathbf{0}.
$$

This has to hold along the trajectory from every initial state, so the bracket vanishes — and it is the same differential Riccati equation the HJB route produced, with the same terminal condition. The control is $\mathbf{u} = -\mathbf{R}^{-1}\mathbf{B}^\top\boldsymbol{\lambda} = -\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}\mathbf{x}$, the same feedback.

The two views of $\mathbf{P}$ now sit side by side. Dynamic programming says $\mathbf{x}^\top\mathbf{P}\mathbf{x}$ is the optimal cost-to-go. The variational route says $\mathbf{P}\mathbf{x}$ is the costate, and the multiplier interpretation you already know says a costate is a shadow price: $\boldsymbol{\lambda}(t) = \tfrac{1}{2}\nabla_{\mathbf{x}}V$, the sensitivity of the remaining cost to a perturbation of the state, halved by the convention above. One matrix, two readings, and each one answers a different design question.

::: example A scalar rate channel, derived both ways
One spacecraft axis in rate control alone: $\dot\omega = u/J$ with $J = 120\,\mathrm{kg\,m^2}$, so $a = 0$ and $b = 1/J = 8.333\times10^{-3}$. Weight rate against a $2^\circ/\mathrm{s}$ budget and torque against $8\,\mathrm{N\,m}$: $q = 1/\omega_{\max}^2 = 820.70\,\mathrm{s^2/rad^2}$ and $r = 1/u_{\max}^2 = 1.5625\times10^{-2}\,\mathrm{(N\,m)^{-2}}$.

**By HJB.** With $V = p\,\omega^2$, the stationarity condition gives $u = -(b/r)p\,\omega$ and the steady-state Riccati equation reduces to $2ap - b^2p^2/r + q = 0$ with $a = 0$, so

$$
p = \frac{\sqrt{qr}}{b} = \frac{\sqrt{820.70 \times 0.015625}}{8.333\times10^{-3}} = 429.72,
\qquad
k = \frac{bp}{r} = \sqrt{q/r} = 229.18\ \mathrm{N\,m\,s/rad}.
$$

The closed-loop pole is $a - bk = -1.9099\,\mathrm{s^{-1}}$, a time constant of $0.5236\,\mathrm{s}$.

**By the calculus of variations.** $H = \tfrac12(q\omega^2 + ru^2) + \lambda b u$, so $\partial H/\partial u = ru + b\lambda = 0$ gives $u = -b\lambda/r$, and $\dot\lambda = -q\omega$. Over an infinite horizon the sweep $\lambda = p\omega$ with $\dot p = 0$ gives $p\dot\omega = -q\omega$, and $\dot\omega = -b^2p\omega/r$, so $-b^2p^2/r = -q$ and $p = \sqrt{qr}/b$ — the same number by a different road.

**The cost, three ways.** From $\omega_0 = 5^\circ/\mathrm{s} = 0.08727\,\mathrm{rad/s}$: the formula gives $J = p\,\omega_0^2 = 3.2725\,\mathrm{s}$; numerical integration of $\int(q\omega^2 + ru^2)dt$ along the closed-loop response gives $3.2728\,\mathrm{s}$ (the small excess is the Euler step); and the analytic integral $\big(q + rk^2\big)\omega_0^2/(2bk)$ gives $3.2725\,\mathrm{s}$. Note $rk^2 = r(q/r) = q$: for this plant the optimum splits the bill **exactly evenly** between rate cost and torque cost, $820.70$ each.

**The costate as a price.** $\lambda(0) = p\,\omega_0 = 37.50$, and $\partial J/\partial\omega_0 = 2p\,\omega_0 = 75.00\,\mathrm{s^2/rad}$, confirmed by a finite difference. In words: at this operating point, one extra milliradian per second of initial rate costs $0.075\,\mathrm{s}$ of cost. That is the shadow-price reading of a Lagrange multiplier, unchanged from the static case except that the constraint it prices is the dynamics.
:::

::: example Finite horizon: boundary value problem against Riccati sweep
Take the two-state attitude axis of the previous lesson — $\mathbf{A} = \begin{bmatrix}0&1\\0&0\end{bmatrix}$, $\mathbf{B} = (0,\ 1/120)^\top$, $\mathbf{Q} = \mathrm{diag}(1.3131\times10^4,\ 820.70)$, $R = 1.5625\times10^{-2}$ — with $t_f = 2\,\mathrm{s}$, $\mathbf{Q}_f = \mathbf{0}$ and $\mathbf{x}_0 = (5^\circ, 0)$.

The Hamiltonian matrix has eigenvalues $\pm 2.1752 \pm 1.7052j\,\mathrm{s^{-1}}$ — a mirror quartet, as promised. The stable pair is exactly the infinite-horizon closed-loop pair computed in the previous lesson, which is the first hint of how the Riccati equation is actually solved.

**Route 1, boundary value problem.** Propagate the Hamiltonian system with the transition matrix $\boldsymbol{\Phi} = e^{\mathbf{M}t_f}$, partition it into $n \times n$ blocks, and impose $\boldsymbol{\lambda}(t_f) = \mathbf{Q}_f\mathbf{x}(t_f) = \mathbf{0}$. That gives $\boldsymbol{\lambda}(0) = (\boldsymbol{\Phi}_{22} - \mathbf{Q}_f\boldsymbol{\Phi}_{12})^{-1}(\mathbf{Q}_f\boldsymbol{\Phi}_{11} - \boldsymbol{\Phi}_{21})\mathbf{x}_0 = (652.12,\ 149.84)$. With that initial costate the system propagates forward as an ordinary differential equation; integrating the running cost along the way gives $J = 56.9096\,\mathrm{s}$, and the trajectory lands at $\theta(t_f) = -0.2225^\circ$, $\dot\theta(t_f) = -0.2372^\circ/\mathrm{s}$ with $\boldsymbol{\lambda}(t_f) = \mathbf{0}$ to five decimals, as the transversality condition demands.

**Route 2, Riccati sweep.** Integrate the differential Riccati equation backwards from $\mathbf{P}(t_f) = \mathbf{0}$ to $t = 0$:

$$
\mathbf{P}(0) = \begin{bmatrix}7472.80 & 1717.05\\ 1717.05 & 978.04\end{bmatrix}.
$$

Then $\mathbf{P}(0)\mathbf{x}_0 = (652.12,\ 149.84)$ — the boundary value problem's costate, agreeing to $1.7\times10^{-10}$ — and $\mathbf{x}_0^\top\mathbf{P}(0)\mathbf{x}_0 = 56.9086\,\mathrm{s}$, matching the integrated cost to five digits.

**What the sweep buys.** Route 1 produces one trajectory, for one initial condition; change $\mathbf{x}_0$ and you solve it again. Route 2 produces a gain schedule good for every initial condition. Reading $\mathbf{K}(t) = R^{-1}\mathbf{B}^\top\mathbf{P}(t)$ off the sweep against time-to-go:

| time-to-go (s) | $k_1$ | $k_2$ |
| --- | --- | --- |
| $0$ | $0$ | $0$ |
| $0.10$ | $34.7$ | $45.5$ |
| $0.25$ | $204.3$ | $133.7$ |
| $0.50$ | $611.9$ | $330.4$ |
| $1.00$ | $891.7$ | $507.5$ |
| $2.00$ | $915.8$ | $521.6$ |

The gain is zero at the terminal time — with $\mathbf{Q}_f = \mathbf{0}$ there is nothing left to protect — and has essentially reached the infinite-horizon value $(916.7,\ 522.1)$ one second from the end. The finite-horizon cost $56.909\,\mathrm{s}$ likewise sits a shade below the infinite-horizon $56.947\,\mathrm{s}$: below, because the finite-horizon controller stops being charged at $t_f$.
:::

::: warning Conventions on the factor of two, and on which way time runs
Three places to be careful. First, some texts write $J = \tfrac12\int(\mathbf{x}^\top\mathbf{Q}\mathbf{x} + \mathbf{u}^\top\mathbf{R}\mathbf{u})dt$ and others omit the half; with the half in the Hamiltonian only, as here, $\boldsymbol{\lambda} = \mathbf{P}\mathbf{x}$ and $V = \mathbf{x}^\top\mathbf{P}\mathbf{x}$, while a Hamiltonian without the half gives $\boldsymbol{\lambda} = 2\mathbf{P}\mathbf{x}$. Both are correct; the gain $\mathbf{K} = \mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}$ is the same either way. Second, the Riccati equation is written $-\dot{\mathbf{P}} = \cdots$ precisely because it runs **backwards** from $t_f$; feeding $+\dot{\mathbf{P}} = \cdots$ to a forward integrator produces a matrix that blows up in finite time, and it is the single most common implementation error in this module. Third, the costate condition is at $t_f$ and the state condition is at $0$; a code that initialises both at $t = 0$ is solving a different problem.
:::

::: note Necessary, sufficient, and why two derivations are worth having
The variational conditions are **necessary**: any optimal trajectory satisfies them, but so may a trajectory that is not optimal, exactly as a KKT point need not be a minimiser. The HJB route is **sufficient** here — if you can produce a $V$ satisfying the HJB equation with the right terminal condition, the associated feedback is optimal, and a quadratic $V$ with $\mathbf{P} \succeq 0$ is such a certificate. For LQR the gap does not bite, because the problem is convex in $\mathbf{u}$ and the quadratic ansatz is exact. It bites hard for the nonlinear problems at the end of this module, where dynamic programming is intractable in high dimensions and the variational conditions are what you can actually solve.
:::

## Check yourself

::: check
The HJB derivation assumed $V(\mathbf{x},t) = \mathbf{x}^\top\mathbf{P}(t)\mathbf{x}$ with no linear or constant term. Justify the assumption, and say what would change if the plant had a known disturbance, $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u} + \mathbf{d}(t)$.
:::

::: answer
The terminal cost is a pure quadratic, the running cost is a pure quadratic, and the dynamics are linear and homogeneous, so the whole problem is invariant under $\mathbf{x} \to -\mathbf{x}$, $\mathbf{u} \to -\mathbf{u}$; the value function must therefore be even in $\mathbf{x}$, killing any linear term, and $V(\mathbf{0}, t) = 0$ kills the constant. With a known disturbance the symmetry is broken and the correct ansatz is $V = \mathbf{x}^\top\mathbf{P}\mathbf{x} + 2\mathbf{s}^\top\mathbf{x} + c$. Substituting gives the same Riccati equation for $\mathbf{P}$, plus a linear equation for the vector $\mathbf{s}$ driven by $\mathbf{d}$ and integrated backwards alongside it, and a scalar equation for $c$. The control becomes $\mathbf{u} = -\mathbf{R}^{-1}\mathbf{B}^\top(\mathbf{P}\mathbf{x} + \mathbf{s})$: the same feedback gain plus a feedforward term that anticipates the disturbance. This is the mechanism behind tracking a nonzero reference.
:::

::: check
Show that the eigenvalues of the Hamiltonian matrix $\mathbf{M}$ are symmetric about the imaginary axis, and explain why exactly $n$ of them can be in the open left half plane for a stabilizable, detectable problem.
:::

::: answer
With $\mathbf{J} = \begin{bmatrix}\mathbf{0} & \mathbf{I}\\ -\mathbf{I} & \mathbf{0}\end{bmatrix}$, a direct block multiplication gives $\mathbf{J}^{-1}\mathbf{M}^\top\mathbf{J} = -\mathbf{M}$, using that $\mathbf{Q}$ and $\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top$ are symmetric. Similar matrices share a spectrum, so the spectrum of $-\mathbf{M}^\top$, which is the negated spectrum of $\mathbf{M}$, equals the spectrum of $\mathbf{M}$: every eigenvalue $\mu$ is accompanied by $-\mu$. That leaves $2n$ eigenvalues in mirror pairs. Under stabilizability and detectability no eigenvalue sits on the imaginary axis, so the pairs split cleanly, $n$ strictly stable and $n$ strictly unstable. The $n$ stable ones are the closed-loop poles — verified numerically in the second example, where the stable pair $-2.175 \pm 1.705j$ matched the infinite-horizon closed loop exactly — and the $n$-dimensional invariant subspace they span is what the next lesson turns into $\mathbf{P}$.
:::

::: check
In the scalar example the optimum split the cost exactly evenly between state and control. Is that a general property of LQR?
:::

::: answer
No. It is a property of this particular plant. For $\dot\omega = bu$ with weights $q$ and $r$, the optimal gain is $k = \sqrt{q/r}$, so the control cost coefficient is $rk^2 = q$, equal to the state cost coefficient, and since both are integrated against the same exponential the totals match. Add plant dynamics — an $a \neq 0$ in $\dot\omega = a\omega + bu$ — and the split moves: a stable plant does some of the regulating for free and the control share falls, while an unstable plant must be actively held and the control share rises. In the two-state attitude example of the previous lesson the split was about $80/20$ in favour of the state cost. The even split is a useful sanity check for a single integrator and nothing more.
:::

::: check
A colleague integrates the differential Riccati equation forward in time from $\mathbf{P}(0) = \mathbf{Q}_f$ and reports that $\mathbf{P}$ diverges after about a second. What has gone wrong, and what should they see instead?
:::

::: answer
The sign. The equation is $-\dot{\mathbf{P}} = \mathbf{A}^\top\mathbf{P} + \mathbf{P}\mathbf{A} - \mathbf{P}\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P} + \mathbf{Q}$ with data at $t_f$, so it is integrated with time-to-go increasing, which in code means stepping with $+$ the right-hand side while the physical time index decreases. Running it forward reverses the stabilizing quadratic term into a destabilizing one and the solution escapes to infinity in finite time, usually within a few time constants of the plant. Done correctly, $\mathbf{P}$ grows monotonically from $\mathbf{Q}_f$ as the time-to-go increases and levels off at the algebraic Riccati solution: in the worked example, $\mathbf{P}(0)$ at $t_f = 2\,\mathrm{s}$ was within $0.07\,\%$ of the infinite-horizon $\mathbf{P}$.
:::

::: check
Interpret $\boldsymbol{\lambda}(t_f) = \mathbf{Q}_f\mathbf{x}(t_f)$ as a shadow price, and say what the condition becomes when $\mathbf{Q}_f = \mathbf{0}$ and when the terminal state is instead constrained exactly to $\mathbf{x}(t_f) = \mathbf{0}$.
:::

::: answer
The costate prices the state: $\boldsymbol{\lambda}$ is the rate at which the cost still to be paid changes per unit of state. At the very end the only thing still to be paid is the terminal penalty $\mathbf{x}^\top\mathbf{Q}_f\mathbf{x}$, whose gradient (halved by the convention) is $\mathbf{Q}_f\mathbf{x}$ — hence the transversality condition. With $\mathbf{Q}_f = \mathbf{0}$ nothing is charged at the end, the price of terminal state is zero, and the gain schedule accordingly decays to zero as time-to-go goes to zero, which is exactly what the table in the second example shows. With a hard terminal constraint $\mathbf{x}(t_f) = \mathbf{0}$, the state is no longer free at $t_f$, so no condition is imposed on $\boldsymbol{\lambda}(t_f)$ at all; it becomes the unknown, and its value is whatever price is needed to enforce the constraint. That limit is the $\mathbf{Q}_f \to \infty$ case, and $\mathbf{P}(t)$ then blows up as $t \to t_f$ while the product $\mathbf{K}(t)\mathbf{x}(t)$ stays finite.
:::

## Summary

| Object | Statement |
| --- | --- |
| Value function | $V(\mathbf{x},t)$, the optimal cost from $\mathbf{x}$ at $t$ to the end; $V(\mathbf{x},t_f) = \mathbf{x}^\top\mathbf{Q}_f\mathbf{x}$ |
| HJB equation | $-\partial V/\partial t = \min_{\mathbf{u}}\big[\mathbf{x}^\top\mathbf{Q}\mathbf{x} + \mathbf{u}^\top\mathbf{R}\mathbf{u} + (\nabla_{\mathbf{x}}V)^\top(\mathbf{A}\mathbf{x}+\mathbf{B}\mathbf{u})\big]$ |
| Quadratic ansatz | $V = \mathbf{x}^\top\mathbf{P}(t)\mathbf{x}$, giving $\mathbf{u}^\star = -\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}\mathbf{x}$ |
| Hamiltonian | $H = \tfrac12(\mathbf{x}^\top\mathbf{Q}\mathbf{x} + \mathbf{u}^\top\mathbf{R}\mathbf{u}) + \boldsymbol{\lambda}^\top(\mathbf{A}\mathbf{x}+\mathbf{B}\mathbf{u})$ |
| First-order conditions | $\dot{\mathbf{x}} = \partial H/\partial\boldsymbol{\lambda}$, $\dot{\boldsymbol{\lambda}} = -\partial H/\partial\mathbf{x} = -\mathbf{Q}\mathbf{x}-\mathbf{A}^\top\boldsymbol{\lambda}$, $\partial H/\partial\mathbf{u} = \mathbf{R}\mathbf{u}+\mathbf{B}^\top\boldsymbol{\lambda} = \mathbf{0}$ |
| Boundary conditions | $\mathbf{x}(0) = \mathbf{x}_0$ and $\boldsymbol{\lambda}(t_f) = \mathbf{Q}_f\mathbf{x}(t_f)$ (transversality) |
| Hamiltonian matrix | $\mathbf{M} = \begin{bmatrix}\mathbf{A} & -\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\\ -\mathbf{Q} & -\mathbf{A}^\top\end{bmatrix}$; spectrum mirrored about the imaginary axis |
| Sweep | $\boldsymbol{\lambda} = \mathbf{P}(t)\mathbf{x}$ turns the boundary value problem into the Riccati equation |
| Differential Riccati | $-\dot{\mathbf{P}} = \mathbf{A}^\top\mathbf{P} + \mathbf{P}\mathbf{A} - \mathbf{P}\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P} + \mathbf{Q}$, $\mathbf{P}(t_f) = \mathbf{Q}_f$, integrated backwards |
| Gain | $\mathbf{K} = \mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}$, $\mathbf{u} = -\mathbf{K}\mathbf{x}$, closed loop $\mathbf{A}-\mathbf{B}\mathbf{K}$ |
| Two readings of $\mathbf{P}$ | $\mathbf{x}^\top\mathbf{P}\mathbf{x}$ is the cost-to-go; $\mathbf{P}\mathbf{x}$ is the costate, the shadow price of the state |
| Worked scalar | $p = \sqrt{qr}/b = 429.7$, $k = \sqrt{q/r} = 229.2\,\mathrm{N\,m\,s/rad}$, pole $-1.910\,\mathrm{s^{-1}}$, $J = 3.272\,\mathrm{s}$ |
| Worked finite horizon | $t_f = 2\,\mathrm{s}$: $\boldsymbol{\lambda}(0) = \mathbf{P}(0)\mathbf{x}_0 = (652.1,\ 149.8)$, $J = 56.909\,\mathrm{s}$ against $56.947\,\mathrm{s}$ infinite |

Both derivations end at the same matrix equation. The next lesson treats that equation as an object in its own right: when it has a solution, which solution is the right one, and three ways to compute it.
