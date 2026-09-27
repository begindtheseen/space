---
id: l02-hjb-and-calculus-of-variations
title: Two derivations of LQR: dynamic programming and the calculus of variations
minutes: 19
covers:
  - LQR derived via dynamic programming (HJB) and via calculus of variations
---

Imagine planning the cheapest road trip home. One way is to think backwards: "From each town, what is the cheapest way home from *there*?" Start at home, where the answer is zero, and work outward one town at a time. Another way is to sketch one route, wiggle it a little, and ask whether the wiggle makes the trip cheaper. If no small wiggle helps, you have found the best route. Both methods find the same road.

The linear quadratic regulator has exactly these two derivations. **Dynamic programming** reasons backwards from the end, about the *value* of being in each state. The **calculus of variations** nudges a candidate trajectory and demands that the cost stop changing. A GNC interview will ask for one of them without telling you which. They end at the same matrix equation for the same matrix $\mathbf{P}$, and each gives $\mathbf{P}$ a different meaning — the optimal cost-to-go on one side, a price on the state on the other. Engineers use both meanings every day.

The variational route will feel familiar. It is the Lagrange multiplier method from the optimization module, applied to a constraint that holds at every instant instead of at one point. The dynamics $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u}$ are the constraint. The multiplier attached to them is a function of time, called the **[[costate|costate]]** and written $\boldsymbol{\lambda}(t)$ ("lambda of t"). As before, a multiplier is a **shadow price**: here, how much the remaining cost changes if the state is nudged.

Take the plant $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u}$ and the finite-horizon cost from the previous lesson,

$$
J\big(\mathbf{x}_0, 0\big) = \mathbf{x}(t_f)^\top\mathbf{Q}_f\mathbf{x}(t_f) + \int_0^{t_f}\big(\mathbf{x}^\top\mathbf{Q}\mathbf{x} + \mathbf{u}^\top\mathbf{R}\mathbf{u}\big)dt ,
$$

with $\mathbf{Q}, \mathbf{Q}_f \succeq 0$ and $\mathbf{R} \succ 0$. The infinite-horizon answer falls out at the end by letting $t_f \to \infty$.

## Dynamic programming and the principle of optimality

Define the **value function** $V(\mathbf{x}, t)$ as the best cost you can still achieve if you are at state $\mathbf{x}$ at time $t$:

$$
V(\mathbf{x}, t) = \min_{\mathbf{u}(\cdot)}\left[\mathbf{x}(t_f)^\top\mathbf{Q}_f\mathbf{x}(t_f) + \int_t^{t_f}\big(\mathbf{x}^\top\mathbf{Q}\mathbf{x} + \mathbf{u}^\top\mathbf{R}\mathbf{u}\big)d\tau\right],
\qquad V(\mathbf{x}, t_f) = \mathbf{x}^\top\mathbf{Q}_f\mathbf{x} .
$$

The second equation says that at the final time there is nothing left to do but pay the terminal penalty.

Bellman's **[[principle of optimality|principle-of-optimality]]** says: whatever your first move was, the rest of an optimal trajectory must itself be optimal from wherever that move left you. If it were not, you could improve the tail, and with it the whole. Apply it over a tiny time step $dt$. The best cost from here equals the cost of the next $dt$, plus the best cost from where you land:

$$
V(\mathbf{x}, t) = \min_{\mathbf{u}}\Big[\big(\mathbf{x}^\top\mathbf{Q}\mathbf{x} + \mathbf{u}^\top\mathbf{R}\mathbf{u}\big)dt + V\big(\mathbf{x} + (\mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u})dt,\ t + dt\big)\Big].
$$

Now three steps. Expand the last term to first order, as a Taylor series: $V(\mathbf{x},t) + \frac{\partial V}{\partial t}dt + (\nabla_{\mathbf{x}}V)^\top(\mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u})dt$. Here $\nabla_{\mathbf{x}}V$ ("grad V") is the column of slopes of $V$ with respect to each state. Cancel $V(\mathbf{x},t)$, which appears on both sides. Divide by $dt$:

$$
-\frac{\partial V}{\partial t} = \min_{\mathbf{u}}\Big[\mathbf{x}^\top\mathbf{Q}\mathbf{x} + \mathbf{u}^\top\mathbf{R}\mathbf{u} + (\nabla_{\mathbf{x}}V)^\top(\mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u})\Big].
$$

This is the **[[Hamilton–Jacobi–Bellman equation|hjb-name]]**, or **HJB**. It holds for any dynamics and any running cost. What makes the linear quadratic case special is that both the minimization inside it and the equation itself can be solved in closed form.

### Solving the inner minimization

The expression inside the brackets is a bowl in $\mathbf{u}$ (strictly convex, because $\mathbf{R} \succ 0$), with no limits on $\mathbf{u}$. The bottom of a bowl is where the slope is zero. Differentiating with respect to $\mathbf{u}$:

$$
2\mathbf{R}\mathbf{u} + \mathbf{B}^\top\nabla_{\mathbf{x}}V = \mathbf{0}
\qquad\Longrightarrow\qquad
\mathbf{u}^\star = -\tfrac{1}{2}\mathbf{R}^{-1}\mathbf{B}^\top\nabla_{\mathbf{x}}V .
$$

Read $\mathbf{u}^\star$ as "u star", the optimal control.

### Guessing the shape of V

Now an educated guess — an **[[ansatz|ansatz]]**. The terminal value $V(\mathbf{x}, t_f) = \mathbf{x}^\top\mathbf{Q}_f\mathbf{x}$ is quadratic, the dynamics are linear and the running cost is quadratic. So try a quadratic for all time: $V(\mathbf{x},t) = \mathbf{x}^\top\mathbf{P}(t)\mathbf{x}$, with $\mathbf{P}(t)$ a symmetric matrix. Then $\nabla_{\mathbf{x}}V = 2\mathbf{P}\mathbf{x}$ and $\partial V/\partial t = \mathbf{x}^\top\dot{\mathbf{P}}\mathbf{x}$, so

$$
\mathbf{u}^\star = -\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}(t)\,\mathbf{x} \equiv -\mathbf{K}(t)\,\mathbf{x} .
$$

The optimal control is a **linear state feedback**. That is a result, not an assumption.

Substitute this control and the guess back into the HJB equation. The control cost becomes $\mathbf{u}^{\star\top}\mathbf{R}\mathbf{u}^\star = \mathbf{x}^\top\mathbf{P}\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}\mathbf{x}$, and

$$
-\mathbf{x}^\top\dot{\mathbf{P}}\mathbf{x} = \mathbf{x}^\top\mathbf{Q}\mathbf{x} + \mathbf{x}^\top\mathbf{P}\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}\mathbf{x} + 2\mathbf{x}^\top\mathbf{P}\big(\mathbf{A}\mathbf{x} - \mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}\mathbf{x}\big).
$$

Tidy it in two moves. A number equals its own transpose, so $2\mathbf{x}^\top\mathbf{P}\mathbf{A}\mathbf{x} = \mathbf{x}^\top(\mathbf{A}^\top\mathbf{P} + \mathbf{P}\mathbf{A})\mathbf{x}$. And the two $\mathbf{P}\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}$ terms — one plus, one minus two — combine to a single minus one:

$$
-\mathbf{x}^\top\dot{\mathbf{P}}\mathbf{x} = \mathbf{x}^\top\Big(\mathbf{A}^\top\mathbf{P} + \mathbf{P}\mathbf{A} - \mathbf{P}\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P} + \mathbf{Q}\Big)\mathbf{x} .
$$

This must hold for every $\mathbf{x}$, and both sides are symmetric quadratic forms, so the matrices themselves are equal:

$$
-\dot{\mathbf{P}} = \mathbf{A}^\top\mathbf{P} + \mathbf{P}\mathbf{A} - \mathbf{P}\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P} + \mathbf{Q}, \qquad \mathbf{P}(t_f) = \mathbf{Q}_f .
$$

That is the **differential Riccati equation**. It is solved *backwards* in time, starting from the terminal condition — the way the road-trip planner starts at home. Over an infinite horizon $\mathbf{P}$ settles to a constant, $\dot{\mathbf{P}} = \mathbf{0}$, and what is left is the algebraic Riccati equation.

::: key LQR gain and what P means
$\mathbf{K} = \mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}$, with control $\mathbf{u} = -\mathbf{K}\mathbf{x}$ and closed loop $\mathbf{A} - \mathbf{B}\mathbf{K}$. The matrix $\mathbf{P}$ is the optimal cost-to-go kernel: $V(\mathbf{x}) = \mathbf{x}^\top\mathbf{P}\mathbf{x}$ is the cost of flying optimally from $\mathbf{x}$ to the end. It is also a valid Lyapunov function for the closed loop, which is how trajectory-stabilization funnels are later built.
:::

## The calculus of variations route

Now forget value functions. Treat the problem as minimizing over a pair of whole functions, $\mathbf{x}(\cdot)$ and $\mathbf{u}(\cdot)$, with the dynamics as an equality constraint at every instant. Attach a multiplier $\boldsymbol{\lambda}(t)$, a column of $n$ numbers, to that constraint and form the **Hamiltonian**

$$
H(\mathbf{x}, \mathbf{u}, \boldsymbol{\lambda}) = \tfrac{1}{2}\big(\mathbf{x}^\top\mathbf{Q}\mathbf{x} + \mathbf{u}^\top\mathbf{R}\mathbf{u}\big) + \boldsymbol{\lambda}^\top\big(\mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u}\big).
$$

The factor of one half is a convention. Halving the running cost halves $H$ and halves $\boldsymbol{\lambda}$, changes no answer, and makes the formulas tidier. With it, the first-order conditions for a best trajectory are

$$
\dot{\mathbf{x}} = \frac{\partial H}{\partial\boldsymbol{\lambda}} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u},
\qquad
\dot{\boldsymbol{\lambda}} = -\frac{\partial H}{\partial\mathbf{x}} = -\mathbf{Q}\mathbf{x} - \mathbf{A}^\top\boldsymbol{\lambda},
\qquad
\frac{\partial H}{\partial\mathbf{u}} = \mathbf{R}\mathbf{u} + \mathbf{B}^\top\boldsymbol{\lambda} = \mathbf{0}.
$$

Take them one at a time.

- The first is the constraint, restated.
- The second is the **costate equation**. It plays the role that "slope in $\mathbf{x}$ is zero" plays in ordinary optimization. The multiplier runs backwards, pushed by the state penalty and by the transpose of the plant.
- The third says the Hamiltonian is flat in $\mathbf{u}$. Solve it for the control:

$$
\mathbf{u}^\star = -\mathbf{R}^{-1}\mathbf{B}^\top\boldsymbol{\lambda} .
$$

The boundary conditions sit at opposite ends. The state is known at the start, $\mathbf{x}(0) = \mathbf{x}_0$. The costate is pinned at the finish by the **[[transversality condition|transversality]]**. For a terminal cost $\mathbf{x}^\top\mathbf{Q}_f\mathbf{x}$ (halved by the same convention) it is $\boldsymbol{\lambda}(t_f) = \mathbf{Q}_f\mathbf{x}(t_f)$. Substituting $\mathbf{u}^\star$ into the two differential equations gives a linear **two-point boundary value problem** — "two-point" because the conditions live at two different times:

$$
\frac{d}{dt}\begin{bmatrix}\mathbf{x}\\ \boldsymbol{\lambda}\end{bmatrix}
= \underbrace{\begin{bmatrix}\mathbf{A} & -\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\\ -\mathbf{Q} & -\mathbf{A}^\top\end{bmatrix}}_{\textstyle \mathbf{M}}
\begin{bmatrix}\mathbf{x}\\ \boldsymbol{\lambda}\end{bmatrix},
\qquad \mathbf{x}(0) = \mathbf{x}_0, \quad \boldsymbol{\lambda}(t_f) = \mathbf{Q}_f\mathbf{x}(t_f).
$$

The $2n \times 2n$ matrix $\mathbf{M}$ is the **Hamiltonian matrix**. The next lesson uses it to solve the algebraic Riccati equation. Its key property is already visible: if $\mu$ ("mu") is an eigenvalue, so is $-\mu$. The eigenvalues come in **[[mirror pairs|mirror-pairs]]** across the imaginary axis.

::: note Why the eigenvalues come in mirror pairs
Let $\mathbf{J} = \begin{bmatrix}\mathbf{0} & \mathbf{I}\\ -\mathbf{I} & \mathbf{0}\end{bmatrix}$. Multiplying out the blocks, and using that $\mathbf{Q}$ and $\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top$ are symmetric, gives $\mathbf{J}^{-1}\mathbf{M}^\top\mathbf{J} = -\mathbf{M}$. So $-\mathbf{M}$ is similar to $\mathbf{M}^\top$, and similar matrices have the same eigenvalues. $\mathbf{M}^\top$ has the same eigenvalues as $\mathbf{M}$, while $-\mathbf{M}$ has their negatives. So the set of eigenvalues equals its own negative: every $\mu$ comes with a $-\mu$.
:::

## The sweep: from a boundary value problem to a Riccati equation

A two-point boundary value problem is awkward in flight software. You cannot run it forward without already knowing $\boldsymbol{\lambda}(0)$, and that depends on the end. The **[[sweep method|sweep]]** removes the problem. Guess that the costate is a time-varying linear function of the state:

$$
\boldsymbol{\lambda}(t) = \mathbf{P}(t)\,\mathbf{x}(t).
$$

This matches the terminal condition if $\mathbf{P}(t_f) = \mathbf{Q}_f$. Now compute $\dot{\boldsymbol{\lambda}}$ two ways. By the product rule, using the state equation with $\mathbf{u} = -\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}\mathbf{x}$; and from the costate equation:

$$
\dot{\boldsymbol{\lambda}} = \dot{\mathbf{P}}\mathbf{x} + \mathbf{P}\dot{\mathbf{x}} = \dot{\mathbf{P}}\mathbf{x} + \mathbf{P}\big(\mathbf{A}\mathbf{x} - \mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}\mathbf{x}\big),
\qquad
\dot{\boldsymbol{\lambda}} = -\mathbf{Q}\mathbf{x} - \mathbf{A}^\top\mathbf{P}\mathbf{x}.
$$

Set them equal and move everything to one side:

$$
\Big(\dot{\mathbf{P}} + \mathbf{P}\mathbf{A} + \mathbf{A}^\top\mathbf{P} - \mathbf{P}\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P} + \mathbf{Q}\Big)\mathbf{x} = \mathbf{0}.
$$

This must hold from every starting state, so the bracket is zero. It is the same differential Riccati equation the HJB route produced, with the same terminal condition. The control is $\mathbf{u} = -\mathbf{R}^{-1}\mathbf{B}^\top\boldsymbol{\lambda} = -\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}\mathbf{x}$ — the same feedback.

Now the two readings of $\mathbf{P}$ sit side by side. Dynamic programming says $\mathbf{x}^\top\mathbf{P}\mathbf{x}$ is the optimal cost-to-go. The variational route says $\mathbf{P}\mathbf{x}$ is the costate, and a costate is a shadow price: $\boldsymbol{\lambda}(t) = \tfrac{1}{2}\nabla_{\mathbf{x}}V$, how fast the remaining cost changes when the state is nudged (halved by the convention). One matrix, two readings, each answering a different design question.

::: example A scalar rate channel, derived both ways
One spacecraft axis, rate control only: $\dot\omega = u/J$ with $J = 120\,\mathrm{kg\,m^2}$. In the scalar form $\dot\omega = a\omega + bu$ that is $a = 0$ and $b = 1/J = 8.333\times10^{-3}$. Weight the rate against a $2^\circ/\mathrm{s}$ budget and torque against $8\,\mathrm{N\,m}$: $q = 1/\omega_{\max}^2 = 820.70\,\mathrm{s^2/rad^2}$ and $r = 1/u_{\max}^2 = 1.5625\times10^{-2}\,\mathrm{(N\,m)^{-2}}$.

**By HJB.** With $V = p\,\omega^2$, the minimization gives $u = -(b/r)p\,\omega$. The steady-state Riccati equation for one state is $2ap - b^2p^2/r + q = 0$. With $a = 0$ it reduces to $b^2p^2/r = q$, so

$$
p = \frac{\sqrt{qr}}{b} = \frac{\sqrt{820.70 \times 0.015625}}{8.333\times10^{-3}} = 429.72,
\qquad
k = \frac{bp}{r} = \sqrt{q/r} = 229.18\ \mathrm{N\,m\,s/rad}.
$$

The closed-loop pole is $a - bk = -229.18/120 = -1.9099\,\mathrm{s^{-1}}$, a time constant of $1/1.9099 = 0.5236\,\mathrm{s}$.

**By the calculus of variations.** $H = \tfrac12(q\omega^2 + ru^2) + \lambda b u$. Setting $\partial H/\partial u = ru + b\lambda = 0$ gives $u = -b\lambda/r$, and the costate equation is $\dot\lambda = -q\omega$. Over an infinite horizon, sweep with $\lambda = p\omega$ and $\dot p = 0$. Then $\dot\lambda = p\dot\omega = -q\omega$, while the state equation gives $\dot\omega = -b^2p\,\omega/r$. Put the second into the first: $-b^2p^2/r = -q$, so $p = \sqrt{qr}/b$ — the same number by a different road.

**The cost, three ways.** Start from $\omega_0 = 5^\circ/\mathrm{s} = 0.08727\,\mathrm{rad/s}$.

- The formula: $J = p\,\omega_0^2 = 429.72 \times 0.08727^2 = 3.2725\,\mathrm{s}$.
- Numerical integration of $\int(q\omega^2 + ru^2)dt$ along the closed-loop response: $3.2725\,\mathrm{s}$.
- The exact integral of a decaying exponential: $\big(q + rk^2\big)\omega_0^2/(2bk) = 3.2725\,\mathrm{s}$.

Notice $rk^2 = r(q/r) = q$. For this plant the optimum splits the bill **exactly evenly** between rate cost and torque cost: $820.70$ each.

**The costate as a price.** $\lambda(0) = p\,\omega_0 = 37.50$, and $\partial J/\partial\omega_0 = 2p\,\omega_0 = 75.00\,\mathrm{s^2/rad}$ — twice $\lambda(0)$, as the one-half convention says. A finite-difference check agrees. In words: one extra milliradian per second of starting rate costs $0.075\,\mathrm{s}$ more. That is the shadow-price reading of a Lagrange multiplier, unchanged from the static case, except that the constraint it prices is the dynamics.
:::

::: example Finite horizon: boundary value problem against Riccati sweep
Take the two-state attitude axis of the previous lesson — $\mathbf{A} = \begin{bmatrix}0&1\\0&0\end{bmatrix}$, $\mathbf{B} = (0,\ 1/120)^\top$, $\mathbf{Q} = \mathrm{diag}(1.3131\times10^4,\ 820.70)$, $R = 1.5625\times10^{-2}$ — with $t_f = 2\,\mathrm{s}$, $\mathbf{Q}_f = \mathbf{0}$ and $\mathbf{x}_0 = (5^\circ, 0)$.

The Hamiltonian matrix has eigenvalues $\pm 2.1752 \pm 1.7052j\,\mathrm{s^{-1}}$ — a mirror set of four, as promised. The stable pair is exactly the infinite-horizon closed-loop pair from the previous lesson. That is the first hint of how the Riccati equation is actually solved.

**Route 1: solve the boundary value problem.** Propagate the Hamiltonian system with the **transition matrix** $\boldsymbol{\Phi} = e^{\mathbf{M}t_f}$ (the matrix that carries any starting $(\mathbf{x}, \boldsymbol{\lambda})$ to its value at $t_f$). Split it into four $n \times n$ blocks and impose $\boldsymbol{\lambda}(t_f) = \mathbf{Q}_f\mathbf{x}(t_f) = \mathbf{0}$. Solving for the unknown starting costate gives

$$
\boldsymbol{\lambda}(0) = (\boldsymbol{\Phi}_{22} - \mathbf{Q}_f\boldsymbol{\Phi}_{12})^{-1}(\mathbf{Q}_f\boldsymbol{\Phi}_{11} - \boldsymbol{\Phi}_{21})\mathbf{x}_0 = (652.12,\ 149.84).
$$

With that starting costate the system runs forward as an ordinary differential equation. Adding up the running cost along the way gives $J = 56.9086\,\mathrm{s}$. The trajectory ends at $\theta(t_f) = -0.2225^\circ$, $\dot\theta(t_f) = -0.2372^\circ/\mathrm{s}$, with $\boldsymbol{\lambda}(t_f) = \mathbf{0}$ to five decimals, as the transversality condition demands.

**Route 2: the Riccati sweep.** Integrate the differential Riccati equation backwards from $\mathbf{P}(t_f) = \mathbf{0}$ to $t = 0$:

$$
\mathbf{P}(0) = \begin{bmatrix}7472.80 & 1717.05\\ 1717.05 & 978.04\end{bmatrix}.
$$

Then $\mathbf{P}(0)\mathbf{x}_0 = (652.12,\ 149.84)$ — the costate from Route 1, agreeing to about $10^{-10}$ — and $\mathbf{x}_0^\top\mathbf{P}(0)\mathbf{x}_0 = 56.9086\,\mathrm{s}$, the same cost.

**What the sweep buys.** Route 1 gives one trajectory, for one starting state; change $\mathbf{x}_0$ and you solve again. Route 2 gives a **[[gain schedule|gain-schedule]]** that works from every starting state. Reading $\mathbf{K}(t) = R^{-1}\mathbf{B}^\top\mathbf{P}(t)$ off the sweep, against **time-to-go** (time left until $t_f$):

| time-to-go (s) | $k_1$ | $k_2$ |
| --- | --- | --- |
| $0$ | $0$ | $0$ |
| $0.10$ | $34.7$ | $45.5$ |
| $0.25$ | $204.3$ | $133.7$ |
| $0.50$ | $611.9$ | $330.4$ |
| $1.00$ | $891.7$ | $507.5$ |
| $2.00$ | $915.8$ | $521.6$ |

The gain is zero at the final time: with $\mathbf{Q}_f = \mathbf{0}$ nothing is left to protect. One second from the end it has nearly reached the infinite-horizon value $(916.7,\ 522.1)$. Sanity check on the cost: the finite-horizon $56.909\,\mathrm{s}$ sits a shade *below* the infinite-horizon $56.947\,\mathrm{s}$. It should, because the finite-horizon controller stops being charged at $t_f$.
:::

::: warning Conventions on the factor of two, and on which way time runs
Three places to be careful.

First, some books write $J = \tfrac12\int(\mathbf{x}^\top\mathbf{Q}\mathbf{x} + \mathbf{u}^\top\mathbf{R}\mathbf{u})dt$ and others leave out the half. With the half in the Hamiltonian only, as here, $\boldsymbol{\lambda} = \mathbf{P}\mathbf{x}$ and $V = \mathbf{x}^\top\mathbf{P}\mathbf{x}$. A Hamiltonian without the half gives $\boldsymbol{\lambda} = 2\mathbf{P}\mathbf{x}$. Both are right, and the gain $\mathbf{K} = \mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}$ is the same either way.

Second, the Riccati equation is written $-\dot{\mathbf{P}} = \cdots$ because it runs **backwards** from $t_f$. Feed $+\dot{\mathbf{P}} = \cdots$ to a forward integrator and the matrix blows up in finite time. It is the most common coding error in this module.

Third, the costate condition is at $t_f$ and the state condition is at $0$. Code that sets both at $t = 0$ is solving a different problem.
:::

::: note Necessary, sufficient, and why two derivations are worth having
The variational conditions are **necessary**: every optimal trajectory satisfies them, but so might one that is not optimal — in the same way that a point where the slope is zero need not be a minimum. The HJB route is **sufficient** here. If you can produce a $V$ that satisfies the HJB equation with the right terminal condition, the matching feedback is optimal, and a quadratic $V$ with $\mathbf{P} \succeq 0$ is such a certificate. For LQR the gap does not matter, because the problem is convex in $\mathbf{u}$ and the quadratic guess is exact. It matters a lot for the nonlinear problems at the end of this module. There dynamic programming becomes impossible in many dimensions, and the variational conditions are what you can actually solve.
:::

## Check yourself

::: check
The HJB derivation guessed $V(\mathbf{x},t) = \mathbf{x}^\top\mathbf{P}(t)\mathbf{x}$ with no linear or constant term. Justify the guess, and say what would change if the plant had a known disturbance, $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u} + \mathbf{d}(t)$.
:::

::: answer
The terminal cost and the running cost are pure quadratics, and the dynamics are linear with no forcing term. So the whole problem looks the same if you flip $\mathbf{x} \to -\mathbf{x}$ and $\mathbf{u} \to -\mathbf{u}$. The value function must therefore be even in $\mathbf{x}$, which rules out a linear term. And starting at $\mathbf{x} = \mathbf{0}$ costs nothing, so $V(\mathbf{0}, t) = 0$ rules out a constant.

A known disturbance breaks the symmetry. The right guess becomes $V = \mathbf{x}^\top\mathbf{P}\mathbf{x} + 2\mathbf{s}^\top\mathbf{x} + c$. Substituting gives the same Riccati equation for $\mathbf{P}$, plus a linear equation for the vector $\mathbf{s}$, driven by $\mathbf{d}$ and integrated backwards alongside it, plus a scalar equation for $c$. The control becomes $\mathbf{u} = -\mathbf{R}^{-1}\mathbf{B}^\top(\mathbf{P}\mathbf{x} + \mathbf{s})$: the same feedback gain, plus a feedforward term that anticipates the disturbance. This is how LQR tracks a nonzero reference.
:::

::: check
Show that the eigenvalues of the Hamiltonian matrix $\mathbf{M}$ are symmetric about the imaginary axis, and explain why exactly $n$ of them can be in the open left half plane for a stabilizable, detectable problem.
:::

::: answer
With $\mathbf{J} = \begin{bmatrix}\mathbf{0} & \mathbf{I}\\ -\mathbf{I} & \mathbf{0}\end{bmatrix}$, multiplying out the blocks gives $\mathbf{J}^{-1}\mathbf{M}^\top\mathbf{J} = -\mathbf{M}$, using that $\mathbf{Q}$ and $\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top$ are symmetric. Similar matrices share eigenvalues, so the eigenvalues of $-\mathbf{M}$ (the negatives of those of $\mathbf{M}$) equal those of $\mathbf{M}^\top$ (the same as those of $\mathbf{M}$). Every eigenvalue $\mu$ therefore comes with $-\mu$, giving $2n$ eigenvalues in mirror pairs. Under stabilizability and detectability none sits on the imaginary axis, so the pairs split cleanly: $n$ strictly stable and $n$ strictly unstable. The $n$ stable ones are the closed-loop poles — in the second example the stable pair $-2.175 \pm 1.705j$ matched the infinite-horizon closed loop exactly. The next lesson turns the space they span into $\mathbf{P}$.
:::

::: check
In the scalar example the optimum split the cost exactly evenly between state and control. Is that true of LQR in general?
:::

::: answer
No, only of this plant. For $\dot\omega = bu$ with weights $q$ and $r$, the best gain is $k = \sqrt{q/r}$, so the control-cost coefficient is $rk^2 = q$, equal to the state-cost coefficient. Both are integrated against the same decaying exponential, so the totals match. Give the plant its own dynamics — an $a \neq 0$ in $\dot\omega = a\omega + bu$ — and the split moves. A stable plant does some of the regulating for free, so the control share falls. An unstable plant must be actively held, so the control share rises. In the two-state attitude example of the previous lesson the split was about $80/20$ toward the state cost. The even split is a handy check for a single integrator and nothing more.
:::

::: check
A colleague integrates the differential Riccati equation forward in time from $\mathbf{P}(0) = \mathbf{Q}_f$ and reports that $\mathbf{P}$ blows up after about a second. What has gone wrong, and what should they see instead?
:::

::: answer
The sign. The equation is $-\dot{\mathbf{P}} = \mathbf{A}^\top\mathbf{P} + \mathbf{P}\mathbf{A} - \mathbf{P}\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P} + \mathbf{Q}$ with its data at $t_f$. It must be integrated with time-to-go increasing — in code, step with $+$ the right-hand side while the physical time goes down. Running it forward flips the stabilizing quadratic term into a destabilizing one, and the solution escapes to infinity in finite time, usually within a few plant time constants. Done correctly from $\mathbf{Q}_f = \mathbf{0}$, $\mathbf{P}$ grows steadily as the time-to-go increases and levels off at the algebraic Riccati solution. In the worked example, $\mathbf{P}(0)$ with $t_f = 2\,\mathrm{s}$ was within $0.07\,\%$ of the infinite-horizon $\mathbf{P}$.
:::

::: check
Read $\boldsymbol{\lambda}(t_f) = \mathbf{Q}_f\mathbf{x}(t_f)$ as a shadow price. What does the condition become when $\mathbf{Q}_f = \mathbf{0}$, and when the final state is instead forced to be exactly $\mathbf{x}(t_f) = \mathbf{0}$?
:::

::: answer
The costate prices the state: $\boldsymbol{\lambda}$ is how fast the cost still to be paid changes per unit of state. At the very end the only thing left to pay is the terminal penalty $\mathbf{x}^\top\mathbf{Q}_f\mathbf{x}$, whose gradient (halved by the convention) is $\mathbf{Q}_f\mathbf{x}$ — hence the transversality condition. With $\mathbf{Q}_f = \mathbf{0}$ nothing is charged at the end, so the final state's price is zero, and the gain schedule falls to zero as time-to-go goes to zero — exactly what the table in the second example shows. With a hard constraint $\mathbf{x}(t_f) = \mathbf{0}$, the state is no longer free at $t_f$, so no condition is placed on $\boldsymbol{\lambda}(t_f)$ at all. It becomes the unknown: whatever price is needed to enforce the constraint. That is the limit $\mathbf{Q}_f \to \infty$, and then $\mathbf{P}(t)$ blows up as $t \to t_f$ while the product $\mathbf{K}(t)\mathbf{x}(t)$ stays finite.
:::

## Summary

| Object | Statement |
| --- | --- |
| Value function | $V(\mathbf{x},t)$, the optimal cost from $\mathbf{x}$ at $t$ to the end; $V(\mathbf{x},t_f) = \mathbf{x}^\top\mathbf{Q}_f\mathbf{x}$ |
| HJB equation | $-\partial V/\partial t = \min_{\mathbf{u}}\big[\mathbf{x}^\top\mathbf{Q}\mathbf{x} + \mathbf{u}^\top\mathbf{R}\mathbf{u} + (\nabla_{\mathbf{x}}V)^\top(\mathbf{A}\mathbf{x}+\mathbf{B}\mathbf{u})\big]$ |
| Quadratic guess | $V = \mathbf{x}^\top\mathbf{P}(t)\mathbf{x}$, giving $\mathbf{u}^\star = -\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}\mathbf{x}$ |
| Hamiltonian | $H = \tfrac12(\mathbf{x}^\top\mathbf{Q}\mathbf{x} + \mathbf{u}^\top\mathbf{R}\mathbf{u}) + \boldsymbol{\lambda}^\top(\mathbf{A}\mathbf{x}+\mathbf{B}\mathbf{u})$ |
| First-order conditions | $\dot{\mathbf{x}} = \partial H/\partial\boldsymbol{\lambda}$, $\dot{\boldsymbol{\lambda}} = -\partial H/\partial\mathbf{x} = -\mathbf{Q}\mathbf{x}-\mathbf{A}^\top\boldsymbol{\lambda}$, $\partial H/\partial\mathbf{u} = \mathbf{R}\mathbf{u}+\mathbf{B}^\top\boldsymbol{\lambda} = \mathbf{0}$ |
| Boundary conditions | $\mathbf{x}(0) = \mathbf{x}_0$ and $\boldsymbol{\lambda}(t_f) = \mathbf{Q}_f\mathbf{x}(t_f)$ (transversality) |
| Hamiltonian matrix | $\mathbf{M} = \begin{bmatrix}\mathbf{A} & -\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\\ -\mathbf{Q} & -\mathbf{A}^\top\end{bmatrix}$; eigenvalues mirrored about the imaginary axis |
| Sweep | $\boldsymbol{\lambda} = \mathbf{P}(t)\mathbf{x}$ turns the boundary value problem into the Riccati equation |
| Differential Riccati | $-\dot{\mathbf{P}} = \mathbf{A}^\top\mathbf{P} + \mathbf{P}\mathbf{A} - \mathbf{P}\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P} + \mathbf{Q}$, $\mathbf{P}(t_f) = \mathbf{Q}_f$, integrated backwards |
| Gain | $\mathbf{K} = \mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}$, $\mathbf{u} = -\mathbf{K}\mathbf{x}$, closed loop $\mathbf{A}-\mathbf{B}\mathbf{K}$ |
| Two readings of $\mathbf{P}$ | $\mathbf{x}^\top\mathbf{P}\mathbf{x}$ is the cost-to-go; $\mathbf{P}\mathbf{x}$ is the costate, the shadow price of the state |
| Worked scalar | $p = \sqrt{qr}/b = 429.7$, $k = \sqrt{q/r} = 229.2\,\mathrm{N\,m\,s/rad}$, pole $-1.910\,\mathrm{s^{-1}}$, $J = 3.272\,\mathrm{s}$ |
| Worked finite horizon | $t_f = 2\,\mathrm{s}$: $\boldsymbol{\lambda}(0) = \mathbf{P}(0)\mathbf{x}_0 = (652.1,\ 149.8)$, $J = 56.909\,\mathrm{s}$ against $56.947\,\mathrm{s}$ infinite |

Both derivations end at the same matrix equation. The next lesson treats that equation as an object in its own right: when it has a solution, which solution is the right one, and three ways to compute it.

::: context costate Why "co-state"
The prefix "co-" means "partner". Every state has a partner costate of the same size, and the two evolve together: the state runs forward from its starting value, the costate runs backward from its final value. In physics the same pairing appears as position and momentum in Hamilton's equations — which is why the function $H$ that ties them together is called the Hamiltonian.
:::

::: context principle-of-optimality The tail of a best route is a best route
If the cheapest drive from Los Angeles to New York passes through Chicago, then its Chicago-to-New-York part must be the cheapest drive from Chicago to New York. If a cheaper one existed, you could swap it in and beat the "cheapest" route — a contradiction.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <path d="M30,80 Q110,20 180,60" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <path d="M180,60 Q260,95 330,50" fill="none" stroke="#1d6fd1" stroke-width="4"/>
  <path d="M180,60 Q250,20 330,50" fill="none" stroke="#b4232c" stroke-width="2" stroke-dasharray="6 4"/>
  <circle cx="30" cy="80" r="5" fill="#1f2a44"/><circle cx="180" cy="60" r="5" fill="#1f2a44"/><circle cx="330" cy="50" r="5" fill="#1f2a44"/>
  <text x="30" y="102" font-size="12" text-anchor="middle" fill="#1f2a44">start</text>
  <text x="180" y="84" font-size="12" text-anchor="middle" fill="#1f2a44">middle</text>
  <text x="330" y="74" font-size="12" text-anchor="middle" fill="#1f2a44">end</text>
  <text x="262" y="112" font-size="11" text-anchor="middle" fill="#1d6fd1">best tail from the middle</text>
  <text x="255" y="22" font-size="11" text-anchor="middle" fill="#b4232c">any other tail costs more</text>
</svg>
```

Dynamic programming turns this into a recipe: work out the best cost from every point near the end, then use it to find the best cost one step earlier, and so on back to the start.
:::

::: context hjb-name Three names on one equation
William Rowan Hamilton and Carl Jacobi developed the equation's ancestor in the 1800s, as a way of writing classical mechanics. Richard Bellman, working at the RAND Corporation in the 1950s, built dynamic programming and the control version that adds "min over $\mathbf{u}$". The equation is a partial differential equation in every state at once, so for a general nonlinear problem with many states it is hopeless to solve on a grid. LQR is the rare case where it can be solved exactly with one matrix.
:::

::: context ansatz An educated guess
*Ansatz* is German for "starting point" or "approach". In mathematics it means a guessed form for the answer, with some pieces left unknown, that you plug in to see whether it works. Here the guess is "$V$ is a quadratic in $\mathbf{x}$" and the unknown piece is the matrix $\mathbf{P}(t)$. The guess is justified afterwards: it turns the HJB equation into an equation for $\mathbf{P}$ that has a solution, so the guess was right.
:::

::: context transversality Where the name comes from
In the older calculus of variations, the end of a curve was often allowed to slide along some line or surface, and the condition at the end said the best curve must meet that surface in a particular way — "crossing" it, hence *transversal*. The name stuck for every condition that pins down the multiplier at a free end. Here the final state is free, so the condition fixes the final costate instead.
:::

::: context mirror-pairs The Hamiltonian's eigenvalues, drawn
For the two-state attitude example, the four eigenvalues of $\mathbf{M}$ sit at $\pm 2.175 \pm 1.705j$. The left two are the closed-loop poles LQR picks; the right two are their mirror images.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="100" x2="320" y2="100" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="180" y1="20" x2="180" y2="180" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="314" y="116" font-size="11" fill="#1f2a44">Re</text>
  <text x="186" y="30" font-size="11" fill="#1f2a44">Im</text>
  <g stroke="#1d6fd1" stroke-width="2.5">
    <line x1="109.7" y1="43.8" x2="119.7" y2="53.8"/><line x1="119.7" y1="43.8" x2="109.7" y2="53.8"/>
    <line x1="109.7" y1="146.2" x2="119.7" y2="156.2"/><line x1="119.7" y1="146.2" x2="109.7" y2="156.2"/>
  </g>
  <g stroke="#b4232c" stroke-width="2.5">
    <line x1="240.3" y1="43.8" x2="250.3" y2="53.8"/><line x1="250.3" y1="43.8" x2="240.3" y2="53.8"/>
    <line x1="240.3" y1="146.2" x2="250.3" y2="156.2"/><line x1="250.3" y1="146.2" x2="240.3" y2="156.2"/>
  </g>
  <line x1="114.7" y1="100" x2="114.7" y2="104" stroke="#1f2a44"/><line x1="245.3" y1="100" x2="245.3" y2="104" stroke="#1f2a44"/>
  <text x="114.7" y="116" font-size="11" text-anchor="middle" fill="#1f2a44">−2.18</text>
  <text x="245.3" y="116" font-size="11" text-anchor="middle" fill="#1f2a44">+2.18</text>
  <text x="60" y="190" font-size="11" fill="#1d6fd1">stable: closed-loop poles</text>
  <text x="220" y="190" font-size="11" fill="#b4232c">unstable mirrors</text>
</svg>
```

Axes drawn at 30 pixels per $\mathrm{s^{-1}}$ in both directions.
:::

::: context sweep Why it is called a sweep
The boundary condition starts at the final time, $\boldsymbol{\lambda}(t_f) = \mathbf{Q}_f\mathbf{x}(t_f)$, and the Riccati equation carries — "sweeps" — it backward to every earlier time as $\boldsymbol{\lambda} = \mathbf{P}(t)\mathbf{x}$. Once the sweep reaches $t = 0$, the missing starting costate is known for any starting state. Bryson and Ho's *Applied Optimal Control* (1969) sets the method out at length and is still a standard reference.
:::

::: context gain-schedule How the gains wake up
Plotting the gain schedule from the second example against time-to-go shows both gains rising from zero at the final time and flattening onto their infinite-horizon values within about one second.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 185" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="150" x2="340" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="20" x2="50" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="50.0,150.0 64.0,145.8 78.0,133.9 92.0,116.0 106.0,95.5 120.0,76.6 134.0,62.1 148.0,52.6 162.0,47.2 176.0,44.4 190.0,43.0 204.0,42.3 218.0,41.8 232.0,41.4 246.0,41.1 260.0,40.8 274.0,40.6 288.0,40.4 302.0,40.3 316.0,40.2 330.0,40.1"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2.5" points="50.0,150.0 64.0,144.5 78.0,137.9 92.0,129.6 106.0,119.9 120.0,110.4 134.0,102.3 148.0,96.4 162.0,92.6 176.0,90.3 190.0,89.1 204.0,88.4 218.0,88.1 232.0,87.9 246.0,87.7 260.0,87.6 274.0,87.6 288.0,87.5 302.0,87.5 316.0,87.4 330.0,87.4"/>
  <text x="44" y="154" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <text x="44" y="34" font-size="11" text-anchor="end" fill="#1f2a44">1000</text>
  <line x1="46" y1="30" x2="50" y2="30" stroke="#1f2a44"/>
  <text x="50" y="166" font-size="11" text-anchor="middle" fill="#1f2a44">0</text>
  <text x="190" y="166" font-size="11" text-anchor="middle" fill="#1f2a44">1</text>
  <text x="330" y="166" font-size="11" text-anchor="middle" fill="#1f2a44">2</text>
  <text x="195" y="180" font-size="11" text-anchor="middle" fill="#1f2a44">time-to-go (s)</text>
  <text x="240" y="34" font-size="12" fill="#1d6fd1">k₁ → 916.7</text>
  <text x="240" y="80" font-size="12" fill="#b4232c">k₂ → 522.1</text>
</svg>
```

Flown forward in real time, the same picture runs right to left: the controller holds full gain for most of the maneuver and relaxes only in the last second.
:::
