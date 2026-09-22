---
id: l05-terminal-cost-and-terminal-set
title: Terminal cost and terminal set
minutes: 22
covers:
  - Terminal cost and terminal constraint set for stability guarantees
---

Nothing said so far guarantees that the closed loop works. The receding-horizon law minimises a cost over $N$ steps, and it is easy to assume that minimising a cost must produce good behaviour. It does not. The optimiser is charged for what happens inside the horizon and nothing for what happens after it, so it will cheerfully arrive at the horizon's end in a state from which recovery is expensive — and then do it again, and again, each time optimally, while the vehicle diverges.

This lesson does three things. It shows a genuine instability: a real plant, sensible weights, a solver working correctly, and a closed loop that doubles its error every $1.43\,\mathrm{s}$. It states the two **terminal ingredients** that remove the possibility, the terminal cost $V_f$ and the terminal set $\mathbb{X}_f$, along with the conditions they must satisfy. And it proves the stability theorem, in full, because the proof is short, it is the reason the ingredients look the way they do, and every robust and nonlinear variant later in this module is a modification of exactly this argument.

## A receding-horizon controller that diverges

Take a launch vehicle pitch axis that is aerodynamically unstable: $\ddot{\theta} = \omega^2\theta + u$ with $\omega^2 = 4\,\mathrm{s^{-2}}$, so a pitch disturbance doubles in $\ln 2/\omega = 0.347\,\mathrm{s}$ with no control. Discretise at $T_s = 0.05\,\mathrm{s}$; the unstable discrete eigenvalue is $\lambda = e^{0.1} = 1.10517$. Use $\mathbf{Q} = \mathbf{I}$, $R = 0.1$, no constraints active near the origin, so the receding-horizon law is a plain linear gain that can be computed exactly and its closed-loop eigenvalues inspected.

::: example Three terminal costs, one plant
The closed-loop spectral radius $\rho(\mathbf{A} - \mathbf{B}\mathbf{K}_{\text{rh}})$ of the receding-horizon gain, for three choices of terminal cost. A value above $1$ means the closed loop is unstable.

| $N$ | horizon (s) | $\mathbf{P} = \mathbf{0}$ | $\mathbf{P} = \mathbf{Q}$ | $\mathbf{P}$ from the Riccati equation |
| --- | --- | --- | --- | --- |
| $1$ | $0.05$ | $1.1052$ | $1.0916$ | $0.9390$ |
| $2$ | $0.10$ | $1.0916$ | $1.0784$ | $0.9390$ |
| $5$ | $0.25$ | $1.0543$ | $1.0435$ | $0.9390$ |
| $8$ | $0.40$ | $1.0245$ | $1.0163$ | $0.9390$ |
| $11$ | $0.55$ | $1.0019$ | $0.9956$ | $0.9390$ |
| $12$ | $0.60$ | $0.9956$ | $0.9899$ | $0.9390$ |
| $20$ | $1.00$ | $0.9626$ | $0.9600$ | $0.9390$ |
| $40$ | $2.00$ | $0.9411$ | $0.9409$ | $0.9390$ |

With no terminal cost the loop is unstable for every horizon up to $N = 11$ and becomes stable at $N = 12$. At $N = 8$ the spectral radius is $1.0245$, a time to double of $1.43\,\mathrm{s}$: a $0.01\,\mathrm{rad}$ pitch error grows to $0.061\,\mathrm{rad}$ in four seconds and $1.11\,\mathrm{rad}$ in ten. Nothing is wrong with the solver — each quadratic program is solved to optimality — and nothing is wrong with the weights. The controller is optimal over half a second and the plant diverges in less.

With the Riccati terminal cost the spectral radius is $0.9390$ at every horizon, including $N = 1$. In fact the receding-horizon gain equals the LQR gain $\mathbf{K}_{\text{lqr}} = [\,8.4655\ \ 4.8650\,]$ to eight decimal places for $N = 1$, $N = 5$ and $N = 40$ alike, which is the Riccati equation's stationarity showing through: starting the backward recursion at its own fixed point leaves it there. One horizon step with the right terminal cost beats forty without it.
:::

::: warning Stability is not something a longer horizon guarantees
The table tempts a rule of thumb — "use a long horizon and it will be fine" — and for this plant, at these weights, $N = 12$ happens to be enough. There is no theorem behind that number. It depends on $\mathbf{Q}$, $\mathbf{R}$, the sample rate and the plant, and for an unstable plant the required horizon grows as the instability gets faster. Worse, the property you can test on a linear plant with no active constraints — compute the gain, look at the eigenvalues — is exactly the property you *cannot* test once constraints are active, because then the law is not a gain. Horizon length is a resource for enlarging the region of attraction. It is not a stability argument.
:::

## The terminal ingredients

The fix is to charge the optimiser honestly for the state it leaves at the end of the horizon, and to require that the state it leaves is one from which a known controller can finish the job. That means choosing three things together: a terminal control law $\boldsymbol{\kappa}_f$, a terminal cost $V_f$, and a terminal set $\mathbb{X}_f$ satisfying

1. **Invariance and admissibility.** $\mathbb{X}_f \subseteq \mathbb{X}$, and for every $\mathbf{x} \in \mathbb{X}_f$, $\boldsymbol{\kappa}_f(\mathbf{x}) \in \mathbb{U}$ and $\mathbf{A}\mathbf{x} + \mathbf{B}\boldsymbol{\kappa}_f(\mathbf{x}) \in \mathbb{X}_f$. Once inside, the terminal law keeps you inside, using inputs you have, respecting the state constraints.
2. **A Lyapunov decrease for the terminal cost.** For every $\mathbf{x} \in \mathbb{X}_f$,
   $$V_f\big(\mathbf{A}\mathbf{x} + \mathbf{B}\boldsymbol{\kappa}_f(\mathbf{x})\big) - V_f(\mathbf{x}) \le -\ell\big(\mathbf{x}, \boldsymbol{\kappa}_f(\mathbf{x})\big) .$$
   The terminal cost must fall by at least the stage cost that the terminal law incurs — that is, $V_f$ must be an upper bound on the cost-to-go of the terminal law.

For a linear plant with a quadratic cost there is a canonical choice that satisfies both, and it is the one to use unless something prevents it: take $\boldsymbol{\kappa}_f(\mathbf{x}) = -\mathbf{K}\mathbf{x}$, the infinite-horizon LQR law; take $V_f(\mathbf{x}) = \mathbf{x}^\top\mathbf{P}\mathbf{x}$ with $\mathbf{P}$ the Riccati solution; and take $\mathbb{X}_f$ to be a set in which that law satisfies every constraint and which it leaves invariant.

Condition 2 then holds with *equality*, which is worth seeing. The discrete algebraic Riccati equation can be rearranged into the closed-loop form

$$
\mathbf{P} - (\mathbf{A} - \mathbf{B}\mathbf{K})^\top\mathbf{P}(\mathbf{A} - \mathbf{B}\mathbf{K}) = \mathbf{Q} + \mathbf{K}^\top\mathbf{R}\mathbf{K} ,
$$

so for any $\mathbf{x}$, with $\mathbf{x}^+ = (\mathbf{A} - \mathbf{B}\mathbf{K})\mathbf{x}$,

$$
V_f(\mathbf{x}^+) - V_f(\mathbf{x}) = -\mathbf{x}^\top(\mathbf{Q} + \mathbf{K}^\top\mathbf{R}\mathbf{K})\mathbf{x} = -\ell(\mathbf{x}, -\mathbf{K}\mathbf{x}) .
$$

For the proximity-ops plant this identity holds to $6.7\times10^{-15}$ in the computed matrices — a useful check on any Riccati solver you write, and the reason the LQR cost-to-go is the natural terminal cost rather than merely a plausible one.

::: key Terminal ingredients for stability
Terminal cost = LQR cost-to-go $\mathbf{x}^\top\mathbf{P}\mathbf{x}$, terminal set = a control-invariant set where the LQR law satisfies all constraints. Then the optimal MPC cost is a Lyapunov function for the closed loop.
:::

## Building the terminal set

$\mathbb{X}_f$ is where the constraints enter. $\mathbf{P}$ and $\mathbf{K}$ come from an unconstrained problem and know nothing about the input limit or the speed limit, so the terminal set has to be the region where the LQR law happens to respect them — and respects them *forever*, since condition 1 is about staying inside.

The construction is a fixed-point iteration due to Gilbert and Tan. Write $\mathbf{A}_K = \mathbf{A} - \mathbf{B}\mathbf{K}$ and collect every constraint that the closed loop must satisfy: here $|{-}\mathbf{K}\mathbf{x}| \le 1$ and $|x_2| \le 0.5$. Then

$$
\mathbb{X}_f = \{\mathbf{x} : \text{the constraints hold at } \mathbf{x},\ \mathbf{A}_K\mathbf{x},\ \mathbf{A}_K^2\mathbf{x},\ \dots\} ,
$$

built by adding the constraints propagated one more step at a time until the new ones are implied by the ones already there. The iteration terminates in finitely many steps whenever $\mathbf{A}_K$ is stable and the constraint set is bounded in the relevant directions, and the result — the **maximal output-admissible set** $O_\infty$ — is the largest set with the required property, which matters because a larger terminal set means a larger region of attraction for the same horizon.

::: example The terminal set for the proximity-ops axis
Plant, weights and constraints as before: $|u| \le 1\,\mathrm{m/s^2}$, $|x_2| \le 0.5\,\mathrm{m/s}$, $\mathbf{K} = [\,2.5857\ \ 3.4434\,]$, closed-loop eigenvalues $0.8992$ and $0.7436$.

Start with four inequalities: $\pm\mathbf{K}\mathbf{x} \le 1$ and $\pm x_2 \le 0.5$. Propagate: add $\pm\mathbf{K}\mathbf{A}_K\mathbf{x} \le 1$ and $\pm[\mathbf{A}_K]_{2,:}\mathbf{x} \le 0.5$, then the same with $\mathbf{A}_K^2$, and so on. At the fifth propagation every new inequality is already implied by the accumulated set, so the iteration stops: $O_\infty$ is determined by the constraints at steps $0$ through $4$, that is, by half a second of closed-loop prediction.

The result is a polygon with $12$ facets and $12$ vertices, of area $0.712\,\mathrm{m^2/s}$, contained in the velocity strip and reaching $|x_1| \le 0.805\,\mathrm{m}$ at its extreme vertices. Along the axis $x_2 = 0$ it extends to $|x_1| = 0.387\,\mathrm{m}$: a vehicle at rest more than $39\,\mathrm{cm}$ off station is *outside* the terminal set, because the LQR law would command more than $1\,\mathrm{m/s^2}$ from there. That is the shape to keep in mind — a thin sliver along the direction where the LQR command is small, of half-width $1/\|\mathbf{K}\|_2 = 0.232$ in the perpendicular direction, clipped by the velocity limit.

The terminal set is therefore *small*. It is not where the vehicle operates; it is where the horizon has to end.
:::

## The stability theorem

With the ingredients in place, here is the whole argument. Let $\mathbf{U}^\star = (\mathbf{u}_0^\star,\dots,\mathbf{u}_{N-1}^\star)$ be optimal at $\mathbf{x}$, with predicted states $\mathbf{x}_0^\star = \mathbf{x}, \dots, \mathbf{x}_N^\star \in \mathbb{X}_f$, and let the vehicle move to $\mathbf{x}^+ = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u}_0^\star = \mathbf{x}_1^\star$ with no disturbance.

**Step 1: a feasible candidate at the next state.** Shift the plan and append the terminal law:

$$
\tilde{\mathbf{U}} = \big(\mathbf{u}_1^\star, \dots, \mathbf{u}_{N-1}^\star,\ \boldsymbol{\kappa}_f(\mathbf{x}_N^\star)\big) .
$$

Its predicted states are $\mathbf{x}_1^\star,\dots,\mathbf{x}_N^\star$ followed by $\mathbf{A}\mathbf{x}_N^\star + \mathbf{B}\boldsymbol{\kappa}_f(\mathbf{x}_N^\star)$. The first $N-1$ of those were feasible in the previous problem; the new last input is in $\mathbb{U}$ and the new last state is in $\mathbb{X}_f$, both by condition 1. So $\tilde{\mathbf{U}}$ is feasible for the problem at $\mathbf{x}^+$.

**Step 2: its cost.** Compare term by term with $V_N^0(\mathbf{x})$. The shifted plan drops the first stage cost $\ell(\mathbf{x}, \mathbf{u}_0^\star)$, drops the old terminal cost $V_f(\mathbf{x}_N^\star)$, and gains the new stage cost $\ell(\mathbf{x}_N^\star, \boldsymbol{\kappa}_f(\mathbf{x}_N^\star))$ and the new terminal cost $V_f(\mathbf{A}\mathbf{x}_N^\star + \mathbf{B}\boldsymbol{\kappa}_f(\mathbf{x}_N^\star))$:

$$
J(\mathbf{x}^+, \tilde{\mathbf{U}}) = V_N^0(\mathbf{x}) - \ell(\mathbf{x}, \mathbf{u}_0^\star)
+ \underbrace{\Big[\ell(\mathbf{x}_N^\star, \boldsymbol{\kappa}_f(\mathbf{x}_N^\star)) + V_f\big(\mathbf{A}\mathbf{x}_N^\star + \mathbf{B}\boldsymbol{\kappa}_f(\mathbf{x}_N^\star)\big) - V_f(\mathbf{x}_N^\star)\Big]}_{\le\, 0 \text{ by condition 2}} .
$$

**Step 3: optimality.** The optimal cost at $\mathbf{x}^+$ is no worse than the cost of any feasible candidate, so

$$
V_N^0(\mathbf{x}^+) \le J(\mathbf{x}^+, \tilde{\mathbf{U}}) \le V_N^0(\mathbf{x}) - \ell\big(\mathbf{x}, \boldsymbol{\kappa}_N(\mathbf{x})\big) .
$$

**Step 4: read it as a Lyapunov function.** $V_N^0$ is positive definite — it is at least $\ell(\mathbf{x},\mathbf{u}) \ge \lambda_{\min}(\mathbf{Q})\|\mathbf{x}\|^2$ and at most $\mathbf{x}^\top\mathbf{P}\mathbf{x}$ near the origin, where the all-terminal-law plan is feasible. Step 3 says it decreases by at least $\ell$ at every closed-loop step. A positive definite function that decreases along trajectories is a Lyapunov function, and the nonlinear control module's direct method then gives asymptotic stability of the origin, with a region of attraction containing every state where the problem is feasible.

That is the theorem. Note what it does *not* need: no assumption that constraints are inactive, no linearity beyond what makes the problem convex, and no bound on $N$. Note also what does the work — condition 2 is exactly what makes the bracket in Step 2 non-positive, and condition 1 is exactly what makes the candidate feasible.

::: example The decrease, measured
Run the proximity-ops loop with $N = 20$, the Riccati terminal cost, the terminal set as the terminal constraint, $|u| \le 1$ and $|x_2| \le 0.5$, starting from $\mathbf{x} = (1.5\,\mathrm{m},\ 0)$ — a state from which the terminal set is reachable in twenty steps. At each cycle, record the optimal value $V_N^0$, its change, and the stage cost paid:

| $k$ | $\mathbf{x}_k$ | $u_k$ | $V_N^0(\mathbf{x}_k)$ | $V_N^0(\mathbf{x}_{k+1}) - V_N^0(\mathbf{x}_k)$ | $-\ell(\mathbf{x}_k, u_k)$ |
| --- | --- | --- | --- | --- | --- |
| $0$ | $(1.5000,\ 0.0000)$ | $-1.0000$ | $36.1702$ | $-2.3500$ | $-2.3500$ |
| $2$ | $(1.4800,\ -0.2000)$ | $-1.0000$ | $31.4751$ | $-2.3304$ | $-2.3304$ |
| $5$ | $(1.3750,\ -0.5000)$ | $0.0000$ | $24.5613$ | $-2.1406$ | $-2.1406$ |
| $19$ | $(0.6750,\ -0.5000)$ | $0.0000$ | $5.0576$ | $-0.7056$ | $-0.7056$ |
| $29$ | $(0.2675,\ -0.2727)$ | $0.2473$ | $0.8284$ | $-0.1521$ | $-0.1521$ |
| $39$ | $(0.0942,\ -0.0994)$ | $0.0988$ | $0.1037$ | $-0.0197$ | $-0.0197$ |

The inequality of Step 3 holds at all $44$ steps of the run, and it holds with equality to within $10^{-7}$ at every one of them. Equality is not a coincidence: the bracket in Step 2 is exactly zero for this choice of ingredients, by the closed-loop Riccati identity, and the shifted candidate is itself optimal at the next state because the terminal cost is the exact cost-to-go. The value function falls monotonically from $36.17$ to $0.10$ while the vehicle covers $1.4\,\mathrm{m}$, saturates for five samples, rides the velocity limit for fourteen, and settles.

The practical use of this is not the proof, which you did once. It is that $V_N^0$ is a scalar the flight software already has — the solver returns it — and its monotone decrease is a cheap, meaningful health check in telemetry. An increase means the assumptions have been broken: a disturbance, a model error, a solver returning a suboptimal point, or a formulation that does not actually satisfy conditions 1 and 2.
:::

## The alternatives, and what they give up

**Terminal equality constraint, $\mathbf{x}_N = \mathbf{0}$.** The special case $\mathbb{X}_f = \{\mathbf{0}\}$, $V_f = 0$, $\boldsymbol{\kappa}_f = 0$. Conditions 1 and 2 hold trivially, so stability follows, and it needs no Riccati solution and no set computation. What it costs is region of attraction and performance: the plan must reach the origin exactly in $N$ steps, which is a hard equality constraint that demands a long horizon and makes the problem fragile — a small disturbance can leave it infeasible. It is common in academic examples and rare in flight.

**No terminal constraint at all.** Keep the terminal cost, drop the set. Feasibility then costs nothing and the region of attraction is much larger, but the stability guarantee weakens: the results of Grüne and Pannek and of Jadbabaie and Hauser give stability provided the horizon is long enough relative to a bound on the value function, and "long enough" is a quantity you must estimate. In practice this is the most common flight formulation — terminal cost yes, terminal set no — with stability argued by a horizon length justified through analysis and a very large Monte-Carlo campaign. Be honest in a review about which of the two you have.

**Terminal cost only inside a verified region.** A middle course used on real vehicles: impose the terminal set but soften it, so the constraint is enforced whenever it can be and relaxed when the vehicle is far out, with the slack telling you which regime you are in.

::: warning A constraint-admissible terminal set is not automatically invariant
It is tempting to define $\mathbb{X}_f$ as "the states where the LQR command is within limits", $\{\mathbf{x} : |\mathbf{K}\mathbf{x}| \le u_{\max}\}$, which is the first of the inequalities in the construction above. That set is *not* invariant: from a point on its boundary the closed loop can step to a state where the command exceeds the limit, and then the terminal law is no longer feasible and the proof collapses. The propagated inequalities are precisely what fixes this, and for the worked example they take the set from four facets to twelve. The general rule is that a terminal set has to be checked for invariance under the terminal law, not merely for constraint satisfaction at the current step, and the check is the same iteration.
:::

## Check yourself

::: check
Condition 2 requires $V_f$ to decrease by at least $\ell$ under the terminal law. Show that $V_f(\mathbf{x}) = \alpha\,\mathbf{x}^\top\mathbf{P}\mathbf{x}$ with $\alpha \ge 1$ also satisfies it, and say what is lost by taking $\alpha$ large.
:::

::: answer
With $\mathbf{x}^+ = \mathbf{A}_K\mathbf{x}$ and the closed-loop Riccati identity, $V_f(\mathbf{x}^+) - V_f(\mathbf{x}) = \alpha[\mathbf{x}^{+\top}\mathbf{P}\mathbf{x}^+ - \mathbf{x}^\top\mathbf{P}\mathbf{x}] = -\alpha\,\ell(\mathbf{x}, -\mathbf{K}\mathbf{x}) \le -\ell(\mathbf{x}, -\mathbf{K}\mathbf{x})$ for $\alpha \ge 1$, so condition 2 holds with margin. Nothing in the proof breaks, and scaling up the terminal cost is a legitimate way to buy conservatism — it makes the optimiser work harder to arrive at the horizon with a small state. What is lost is performance: the terminal cost now overstates the true cost-to-go by a factor $\alpha$, so the finite-horizon problem is no longer an approximation of the infinite-horizon one, and the closed loop becomes more aggressive near the end of the horizon than the infinite-horizon optimum would be. It also degrades the exactness that made the shifted candidate optimal, so the value function decrease becomes a strict inequality rather than an equality.
:::

::: check
The terminal set for the proximity-ops axis reaches only $\lvert x_1\rvert = 0.387\,\mathrm{m}$ at rest, yet the controller in the previous lessons regulated from $2\,\mathrm{m}$. Is there a contradiction?
:::

::: answer
No. The terminal set is where the *plan* must end, not where the vehicle must start. From $(2, 0)$ the optimiser needs a horizon long enough to bring the predicted trajectory into that sliver within $N$ steps, and with the velocity limited to $0.5\,\mathrm{m/s}$ the vehicle closes at most $0.05\,\mathrm{m}$ per sample, so covering the $1.6\,\mathrm{m}$ from $2\,\mathrm{m}$ to the edge of the terminal set takes on the order of $30$ samples. The earlier lessons used no terminal constraint, which is why $N = 20$ or even $N = 3$ produced an answer from $2\,\mathrm{m}$: those problems were feasible, they were only unguaranteed. Adding the terminal set buys the proof and costs feasible states, and the next lesson computes exactly how many.
:::

::: check
Your terminal set is computed for the LQR law, but the flight software applies the MPC law. Why is the set built for a controller that never runs?
:::

::: answer
Because the terminal law is a device inside the proof, not a control law that executes. The argument needs to know that *some* feasible continuation exists past the horizon with a cost no greater than the terminal cost; the LQR law is the witness. The MPC law, being optimal, does at least as well as the witness at every step — that is Step 3 — so the vehicle never actually runs the terminal law. The exception is worth knowing: a common flight architecture uses the same LQR law as the certified fallback controller when the solver fails, in which case the terminal set doubles as a verified region for the fallback, and the terminal-set computation earns its keep twice.
:::

::: check
On the unstable pitch axis, the $\mathbf{P} = \mathbf{0}$ controller with $N = 8$ has spectral radius $1.0245$. A colleague proposes fixing it by increasing $\mathbf{Q}$ tenfold so the optimiser "cares more about the state". Will that work?
:::

::: answer
Not reliably, and not for the right reason. Scaling $\mathbf{Q}$ by ten is equivalent to scaling $\mathbf{R}$ down by ten, which does make the controller more aggressive and can push the spectral radius below one for this plant — but it is a tuning coincidence, not a guarantee, and the same trick fails on a plant where the instability is faster relative to the horizon. It also buys the aggression by spending control authority, which matters as soon as the input constraint becomes active: a controller that stabilises only by commanding more than the actuator can deliver is unstable in the constrained problem regardless of what the unconstrained eigenvalues say. The structural fix is the terminal cost, which makes the spectral radius $0.9390$ at every horizon, including $N = 1$, with no change to the weights and no extra control effort.
:::

::: check
Explain why condition 2 is usually stated as an inequality rather than the equality the Riccati choice produces.
:::

::: answer
Because the theorem needs only the inequality, and many useful terminal costs satisfy it strictly. Scaling by $\alpha \ge 1$ gives one such case; a terminal cost built for a robust or nonlinear problem gives another, where $V_f$ is an upper bound on the cost-to-go of the terminal law rather than its exact value. For nonlinear MPC the exact cost-to-go is generally unknown, and the standard construction uses a quadratic upper bound valid in a small neighbourhood, satisfying condition 2 with margin. Stating the condition as an inequality also makes it clear what is being asked: the terminal cost must never *understate* the cost of finishing the job, since understating it is exactly the mistake that the $\mathbf{P} = \mathbf{0}$ controller makes at every cycle.
:::

## Summary

| Object | Statement |
| --- | --- |
| Failure mode | Short horizon, no terminal cost: unstable pitch axis diverges, $\rho = 1.0245$ at $N = 8$, doubling in $1.43\,\mathrm{s}$ |
| Condition 1 | $\mathbb{X}_f \subseteq \mathbb{X}$, $\boldsymbol{\kappa}_f(\mathbf{x}) \in \mathbb{U}$ and $\mathbf{A}\mathbf{x} + \mathbf{B}\boldsymbol{\kappa}_f(\mathbf{x}) \in \mathbb{X}_f$ for $\mathbf{x} \in \mathbb{X}_f$ |
| Condition 2 | $V_f(\mathbf{A}\mathbf{x} + \mathbf{B}\boldsymbol{\kappa}_f(\mathbf{x})) - V_f(\mathbf{x}) \le -\ell(\mathbf{x}, \boldsymbol{\kappa}_f(\mathbf{x}))$ on $\mathbb{X}_f$ |
| Canonical choice | $\boldsymbol{\kappa}_f = -\mathbf{K}\mathbf{x}$, $V_f = \mathbf{x}^\top\mathbf{P}\mathbf{x}$ (Riccati), $\mathbb{X}_f = O_\infty$ for $\mathbf{A}_K$ |
| Riccati identity | $\mathbf{P} - \mathbf{A}_K^\top\mathbf{P}\mathbf{A}_K = \mathbf{Q} + \mathbf{K}^\top\mathbf{R}\mathbf{K}$, so condition 2 holds with equality (residual $6.7\times10^{-15}$) |
| Terminal set | Gilbert–Tan iteration on $\mathbf{A}_K$; for the running plant it closes after $4$ propagations: $12$ facets, area $0.712$, $\lvert x_1\rvert \le 0.387\,\mathrm{m}$ at rest |
| Shifted candidate | $\tilde{\mathbf{U}} = (\mathbf{u}_1^\star,\dots,\mathbf{u}_{N-1}^\star, \boldsymbol{\kappa}_f(\mathbf{x}_N^\star))$, feasible by condition 1 |
| Decrease | $V_N^0(\mathbf{x}^+) \le V_N^0(\mathbf{x}) - \ell(\mathbf{x}, \boldsymbol{\kappa}_N(\mathbf{x}))$; measured with equality to $10^{-7}$ over $44$ steps |
| Conclusion | $V_N^0$ is a Lyapunov function; the origin is asymptotically stable with region of attraction $\mathcal{X}_N$ |
| Alternatives | $\mathbf{x}_N = \mathbf{0}$ (trivially valid, small region); terminal cost only (large region, weaker guarantee); softened terminal set |

The next lesson takes the other half of the shifted-candidate argument — feasibility — and asks what $\mathcal{X}_N$ actually looks like, how it grows with the horizon, and what the largest set a constrained controller can ever hold on to is.
