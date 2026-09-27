---
id: l05-terminal-cost-and-terminal-set
title: Terminal cost and terminal set
minutes: 24
covers:
  - Terminal cost and terminal constraint set for stability guarantees
---

Imagine planning a hike, but you only care about the next hour. You pick the flattest, easiest hour of walking you can find. It ends at the bottom of a deep canyon, a long, hard climb from home. An hour later you plan again, and again you choose the easiest next hour. Each plan was the best one you could see. Together they walked you somewhere terrible.

Nothing so far in this module stops MPC from doing exactly that. The receding-horizon law minimizes a cost over $N$ steps. It is easy to assume that minimizing a cost must give good behavior. It does not. The optimizer is charged for what happens inside the horizon and nothing for what happens after it. So it will cheerfully end the horizon in a state that is expensive to recover from — and then do it again, and again, each time optimally, while the vehicle drifts away.

This lesson does three things. It shows a real instability: a real plant, sensible weights, a solver working correctly, and a closed loop that doubles its error every $1.43\,\mathrm{s}$. It states the two **terminal ingredients** that remove the problem — the terminal cost $V_f$ and the terminal set $\mathbb{X}_f$ — and the conditions they must meet. And it proves the stability theorem in full: the proof is short, it explains why the ingredients look the way they do, and every later variant in the module reuses it.

## A receding-horizon controller that diverges

A rocket flying through the air is often **[[aerodynamically unstable|unstable-rocket]]** in pitch: tip its nose a little and the air pushes it further. A simple model of that is

$$
\ddot{\theta} = \omega^2\theta + u, \qquad \omega^2 = 4\,\mathrm{s^{-2}} ,
$$

where $\theta$ ("theta") is the pitch angle, $\ddot\theta$ ("theta double-dot") is its angular acceleration, and $u$ is the control. The plus sign is the trouble: the bigger the angle, the harder it grows. With no control, a pitch error doubles every $\ln 2/\omega = 0.693/2 = 0.347\,\mathrm{s}$.

Sample it at $T_s = 0.05\,\mathrm{s}$. The unstable discrete eigenvalue is $\lambda = e^{\omega T_s} = e^{0.1} = 1.10517$ — each sample multiplies the unstable part by about $1.105$. Use $\mathbf{Q} = \mathbf{I}$ and $R = 0.1$, and suppose no constraints are active near the origin. Then the receding-horizon law is a plain linear gain $\mathbf{K}_{\text{rh}}$, which we can compute exactly and whose closed-loop eigenvalues we can inspect.

The number to watch is the **[[spectral radius|spectral-radius]]** $\rho(\mathbf{A} - \mathbf{B}\mathbf{K}_{\text{rh}})$ — the size of the largest closed-loop eigenvalue. Each sample, the slowest-dying part of the error is multiplied by it. Below $1$, errors shrink. Above $1$, they grow.

::: example Three terminal costs, one plant
The spectral radius of the receding-horizon loop for three choices of terminal cost $\mathbf{P}$:

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

**No terminal cost.** The loop is unstable for every horizon up to $N = 11$ and becomes stable at $N = 12$. At $N = 8$ the spectral radius is $1.0245$. How long to double? Solve $1.0245^n = 2$: $n = \ln 2 / \ln 1.0245 \approx 28.6$ samples, or $28.6 \times 0.05 \approx 1.43\,\mathrm{s}$. Simulated from a $0.01\,\mathrm{rad}$ pitch error, the error grows to $0.061\,\mathrm{rad}$ in four seconds and $1.11\,\mathrm{rad}$ — over $60^\circ$ — in ten.

Nothing is wrong with the solver or the weights. The controller is optimal over $0.4$ seconds, and the plant runs away over longer times than that.

**Riccati terminal cost.** The spectral radius is $0.9390$ at every horizon, even $N = 1$. In fact the receding-horizon gain equals the LQR gain $\mathbf{K}_{\text{lqr}} = [\,8.4655\ \ 4.8650\,]$ to about fourteen digits for $N = 1$, $5$ and $40$ alike. That is the Riccati equation's fixed point showing through: start the backward recursion at its own fixed point and it stays there. One horizon step with the right terminal cost beats forty without it.
:::

::: warning Stability is not something a longer horizon guarantees
The table tempts a rule of thumb: "use a long horizon and it will be fine". For this plant, at these weights, $N = 12$ happens to be enough. There is no theorem behind that number. It depends on $\mathbf{Q}$, $\mathbf{R}$, the sample rate and the plant, and the faster the instability, the longer the horizon it needs.

Worse, the test used here — compute the gain, look at its eigenvalues — only works when no constraints are active. Once they are, the law is not a gain at all, and there are no eigenvalues to look at. Horizon length is a resource for enlarging the set of states the controller can handle. It is not a stability argument.
:::

## The terminal ingredients

Think of a relay race: you run your leg, then hand the baton to a teammate you *know* can finish. Two things must be true. You must hand over somewhere your teammate can take it from. And your plan must honestly count the time your teammate will still need.

The fix for MPC is the same. Charge the optimizer honestly for the state it leaves at the end of the horizon, and require that state to be one from which a known controller can finish the job. That means choosing three things together:

- a **terminal control law** $\boldsymbol{\kappa}_f$ ("kappa f") — the teammate;
- a **terminal cost** $V_f$ — the honest estimate of what finishing will cost;
- a **terminal set** $\mathbb{X}_f$ — the handover zone.

They must satisfy two conditions.

1. **Invariance and admissibility.** $\mathbb{X}_f \subseteq \mathbb{X}$, and for every $\mathbf{x} \in \mathbb{X}_f$, $\boldsymbol{\kappa}_f(\mathbf{x}) \in \mathbb{U}$ and $\mathbf{A}\mathbf{x} + \mathbf{B}\boldsymbol{\kappa}_f(\mathbf{x}) \in \mathbb{X}_f$. In words: once inside, the terminal law keeps you inside, using inputs you actually have, and respecting the state constraints.
2. **A Lyapunov decrease for the terminal cost.** For every $\mathbf{x} \in \mathbb{X}_f$,
   $$V_f\big(\mathbf{A}\mathbf{x} + \mathbf{B}\boldsymbol{\kappa}_f(\mathbf{x})\big) - V_f(\mathbf{x}) \le -\ell\big(\mathbf{x}, \boldsymbol{\kappa}_f(\mathbf{x})\big) .$$
   In words: each step of the terminal law makes $V_f$ fall by at least the stage cost $\ell$ that step pays. So $V_f$ is never less than the true cost of letting the terminal law finish — it is an upper bound on its **[[cost-to-go|cost-to-go]]**.

For a linear plant with a quadratic cost there is a standard choice that meets both. Use it unless something stops you:

- $\boldsymbol{\kappa}_f(\mathbf{x}) = -\mathbf{K}\mathbf{x}$, the infinite-horizon LQR law;
- $V_f(\mathbf{x}) = \mathbf{x}^\top\mathbf{P}\mathbf{x}$, with $\mathbf{P}$ the solution of the **[[Riccati equation|riccati-name]]**;
- $\mathbb{X}_f$ = a set in which that law obeys every constraint and which it never leaves.

With this choice, condition 2 holds with *equality*. Write $\mathbf{A}_K = \mathbf{A} - \mathbf{B}\mathbf{K}$ for the closed-loop matrix. The discrete algebraic Riccati equation can be rearranged into the closed-loop form

$$
\mathbf{P} - \mathbf{A}_K^\top\mathbf{P}\mathbf{A}_K = \mathbf{Q} + \mathbf{K}^\top\mathbf{R}\mathbf{K} ,
$$

so for any $\mathbf{x}$, with $\mathbf{x}^+ = \mathbf{A}_K\mathbf{x}$ ("x plus", the next state),

$$
V_f(\mathbf{x}^+) - V_f(\mathbf{x}) = -\mathbf{x}^\top(\mathbf{Q} + \mathbf{K}^\top\mathbf{R}\mathbf{K})\mathbf{x} = -\ell(\mathbf{x}, -\mathbf{K}\mathbf{x}) .
$$

The LQR cost-to-go is not merely a plausible terminal cost. It is *exactly* the cost of letting LQR finish. For the proximity-ops plant this identity holds to about $5\times10^{-15}$ in the computed matrices — a handy check on any Riccati solver you write.

::: note Why the closed-loop form has to be true
Start from the Riccati equation and the LQR gain:

$$
\mathbf{P} = \mathbf{Q} + \mathbf{A}^\top\mathbf{P}\mathbf{A} - \mathbf{A}^\top\mathbf{P}\mathbf{B}\mathbf{K}, \qquad (\mathbf{R} + \mathbf{B}^\top\mathbf{P}\mathbf{B})\mathbf{K} = \mathbf{B}^\top\mathbf{P}\mathbf{A} .
$$

Now expand the right-hand side we want, $\mathbf{A}_K^\top\mathbf{P}\mathbf{A}_K + \mathbf{Q} + \mathbf{K}^\top\mathbf{R}\mathbf{K}$:

$$
\mathbf{A}^\top\mathbf{P}\mathbf{A} - \mathbf{A}^\top\mathbf{P}\mathbf{B}\mathbf{K} - \mathbf{K}^\top\mathbf{B}^\top\mathbf{P}\mathbf{A} + \mathbf{K}^\top(\mathbf{R} + \mathbf{B}^\top\mathbf{P}\mathbf{B})\mathbf{K} + \mathbf{Q} .
$$

The gain equation turns the fourth term into $\mathbf{K}^\top\mathbf{B}^\top\mathbf{P}\mathbf{A}$, which cancels the third. What is left is $\mathbf{Q} + \mathbf{A}^\top\mathbf{P}\mathbf{A} - \mathbf{A}^\top\mathbf{P}\mathbf{B}\mathbf{K}$, which is $\mathbf{P}$ by the Riccati equation. So $\mathbf{P} = \mathbf{A}_K^\top\mathbf{P}\mathbf{A}_K + \mathbf{Q} + \mathbf{K}^\top\mathbf{R}\mathbf{K}$, as claimed.
:::

::: key Terminal ingredients for stability
Terminal cost = LQR cost-to-go $\mathbf{x}^\top\mathbf{P}\mathbf{x}$, terminal set = a control-invariant set where the LQR law satisfies all constraints. Then the optimal MPC cost is a Lyapunov function for the closed loop.
:::

## Building the terminal set

$\mathbb{X}_f$ is where the constraints come in. $\mathbf{P}$ and $\mathbf{K}$ come from a problem with no constraints; they know nothing about the thruster limit or the speed limit. So the terminal set must be the region where the LQR law *happens* to respect them — and keeps respecting them forever, since condition 1 is about staying inside.

The recipe is a repeat-until-nothing-changes loop, due to **[[Gilbert and Tan|gilbert-tan]]**. Collect every constraint the closed loop must obey — here $|{-}\mathbf{K}\mathbf{x}| \le 1$ and $|x_2| \le 0.5$. Then

$$
\mathbb{X}_f = \{\mathbf{x} : \text{the constraints hold at } \mathbf{x},\ \mathbf{A}_K\mathbf{x},\ \mathbf{A}_K^2\mathbf{x},\ \dots\} .
$$

In words: a state is in the set if the constraints hold now, one step from now, two steps from now, and so on, under the LQR law. You build it by adding the constraints pushed forward one more step at a time, until every new row is already implied by the rows you have. If $\mathbf{A}_K$ is stable and the constraints are bounded in the right directions, this stops after finitely many steps. The result is the **maximal output-admissible set** $O_\infty$ ("O infinity") — the largest set with the property. Largest matters: a bigger terminal set means more starting states the controller can handle for the same horizon.

::: example The terminal set for the proximity-ops axis
Plant, weights and constraints as before: $|u| \le 1\,\mathrm{m/s^2}$, $|x_2| \le 0.5\,\mathrm{m/s}$, LQR gain $\mathbf{K} = [\,2.5857\ \ 3.4434\,]$, closed-loop eigenvalues $0.8992$ and $0.7436$.

**Step 0.** Start with four inequalities: $\pm\mathbf{K}\mathbf{x} \le 1$ and $\pm x_2 \le 0.5$.

**Steps 1, 2, …** Add the same limits one step later, $\pm\mathbf{K}\mathbf{A}_K\mathbf{x} \le 1$ and $\pm[\mathbf{A}_K]_{2,:}\mathbf{x} \le 0.5$ (the second row of $\mathbf{A}_K$ gives next step's speed), then with $\mathbf{A}_K^2$, and so on.

**Stop.** At the fifth push every new inequality is already implied by the ones collected. So $O_\infty$ is fixed by the constraints at steps $0$ through $4$ — half a second of closed-loop prediction.

The result is a **[[polygon with twelve sides|terminal-set-shape]]**, of area $0.712\,\mathrm{m^2/s}$. It sits inside the speed strip and reaches $|x_1| = 0.805\,\mathrm{m}$ at its far corners. Along the line $x_2 = 0$ it reaches only $|x_1| = 0.387\,\mathrm{m}$. So a vehicle at rest more than $39\,\mathrm{cm}$ off station is *outside* the terminal set. Check: at $(0.387, 0)$ the LQR command is $2.5857 \times 0.387 \approx 1.0\,\mathrm{m/s^2}$, right at the thruster limit.

Keep the shape in mind: a thin sliver along the direction where the LQR command is small, only $1/\|\mathbf{K}\|_2 = 0.232$ wide on each side in the direction across it, and clipped by the speed limit. The terminal set is *small*. It is not where the vehicle operates. It is where the horizon has to end.
:::

## The stability theorem

Here is the idea before the algebra. Think of $V_N^0(\mathbf{x})$, the optimal cost from state $\mathbf{x}$, as money left in a travel budget. Each step, the vehicle spends the stage cost $\ell$. If next step's best plan never costs more than "this step's plan, minus what was spent", then the budget can only go down. A number that is never negative and always goes down must settle. That settling is stability.

The trick is to find, at the next state, *some* plan that costs no more than that. The relay race supplies it: keep the rest of today's plan, and let the teammate run one extra step at the end.

::: note Why it has to be true: the proof in four steps
Let $\mathbf{U}^\star = (\mathbf{u}_0^\star,\dots,\mathbf{u}_{N-1}^\star)$ be optimal at $\mathbf{x}$, with predicted states $\mathbf{x}_0^\star = \mathbf{x}, \dots, \mathbf{x}_N^\star \in \mathbb{X}_f$. With no disturbance, the vehicle moves to $\mathbf{x}^+ = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u}_0^\star = \mathbf{x}_1^\star$.

**Step 1: a feasible plan at the next state.** Shift the plan and append the terminal law:

$$
\tilde{\mathbf{U}} = \big(\mathbf{u}_1^\star, \dots, \mathbf{u}_{N-1}^\star,\ \boldsymbol{\kappa}_f(\mathbf{x}_N^\star)\big) .
$$

Its predicted states are $\mathbf{x}_1^\star,\dots,\mathbf{x}_N^\star$, then $\mathbf{A}\mathbf{x}_N^\star + \mathbf{B}\boldsymbol{\kappa}_f(\mathbf{x}_N^\star)$. The old ones were already feasible. The new last input is in $\mathbb{U}$ and the new last state is in $\mathbb{X}_f$, both by condition 1. So $\tilde{\mathbf{U}}$ is feasible at $\mathbf{x}^+$.

**Step 2: its cost.** Compared with $V_N^0(\mathbf{x})$, the shifted plan loses the first stage cost $\ell(\mathbf{x}, \mathbf{u}_0^\star)$ and the old terminal cost $V_f(\mathbf{x}_N^\star)$. It gains one new stage cost and a new terminal cost:

$$
J(\mathbf{x}^+, \tilde{\mathbf{U}}) = V_N^0(\mathbf{x}) - \ell(\mathbf{x}, \mathbf{u}_0^\star)
+ \underbrace{\Big[\ell(\mathbf{x}_N^\star, \boldsymbol{\kappa}_f(\mathbf{x}_N^\star)) + V_f\big(\mathbf{A}\mathbf{x}_N^\star + \mathbf{B}\boldsymbol{\kappa}_f(\mathbf{x}_N^\star)\big) - V_f(\mathbf{x}_N^\star)\Big]}_{\le\, 0 \text{ by condition 2}} .
$$

**Step 3: optimality.** The best plan at $\mathbf{x}^+$ costs no more than any feasible plan, so

$$
V_N^0(\mathbf{x}^+) \le J(\mathbf{x}^+, \tilde{\mathbf{U}}) \le V_N^0(\mathbf{x}) - \ell\big(\mathbf{x}, \boldsymbol{\kappa}_N(\mathbf{x})\big) ,
$$

where $\boldsymbol{\kappa}_N(\mathbf{x}) = \mathbf{u}_0^\star$ is the MPC law.

**Step 4: a Lyapunov function.** $V_N^0$ is positive definite — zero at the origin and positive everywhere else: it is at least $\ell(\mathbf{x},\mathbf{u}) \ge \lambda_{\min}(\mathbf{Q})\|\mathbf{x}\|^2$, and at most $\mathbf{x}^\top\mathbf{P}\mathbf{x}$ near the origin, where the all-terminal-law plan is feasible. Step 3 says it falls by at least $\ell$ every closed-loop step. A positive definite function that falls along every trajectory is a **[[Lyapunov function|lyapunov-bowl]]**, and the direct method from the nonlinear control module gives asymptotic stability of the origin: states near it stay near it, and every trajectory in the region below approaches it. The region of attraction contains every state where the problem is feasible.
:::

That is the theorem. Notice what it does *not* need: no assumption that constraints are inactive, no linearity beyond what keeps the problem convex, no bound on $N$. And notice what does the work. Condition 2 makes the bracket in Step 2 non-positive. Condition 1 makes the shifted plan feasible. Each condition exists for exactly one step of the proof.

::: example The decrease, measured
Run the proximity-ops loop with $N = 20$, the Riccati terminal cost, the terminal set as the terminal constraint, $|u| \le 1$ and $|x_2| \le 0.5$, from $\mathbf{x} = (1.5\,\mathrm{m},\ 0)$ — a state from which the terminal set can be reached in twenty steps. Each cycle, record the optimal cost, its change, and the stage cost paid:

| $k$ | $\mathbf{x}_k$ | $u_k$ | $V_N^0(\mathbf{x}_k)$ | $V_N^0(\mathbf{x}_{k+1}) - V_N^0(\mathbf{x}_k)$ | $-\ell(\mathbf{x}_k, u_k)$ |
| --- | --- | --- | --- | --- | --- |
| $0$ | $(1.5000,\ 0.0000)$ | $-1.0000$ | $36.1702$ | $-2.3500$ | $-2.3500$ |
| $2$ | $(1.4800,\ -0.2000)$ | $-1.0000$ | $31.4751$ | $-2.3304$ | $-2.3304$ |
| $5$ | $(1.3750,\ -0.5000)$ | $0.0000$ | $24.5613$ | $-2.1406$ | $-2.1406$ |
| $19$ | $(0.6750,\ -0.5000)$ | $0.0000$ | $5.0576$ | $-0.7056$ | $-0.7056$ |
| $29$ | $(0.2675,\ -0.2727)$ | $0.2473$ | $0.8284$ | $-0.1521$ | $-0.1521$ |
| $39$ | $(0.0942,\ -0.0994)$ | $0.0988$ | $0.1037$ | $-0.0197$ | $-0.0197$ |

Check the first row by hand: $\ell = 1.5^2 + 0^2 + 0.1 \times (-1)^2 = 2.25 + 0.1 = 2.35$. The cost dropped by exactly that.

The inequality of Step 3 holds at every step of the run, and with *equality* to within $10^{-7}$ at every one. That is not luck. With these ingredients the bracket in Step 2 is exactly zero, by the closed-loop Riccati identity, and the shifted plan is itself optimal at the next state because the terminal cost is the exact cost-to-go. The **[[value falls steadily|value-staircase]]** from $36.17$ to $0.10$ while the vehicle covers $1.4\,\mathrm{m}$: it brakes at the limit for five samples, rides the speed limit for about fifteen, then settles.

The practical payoff: $V_N^0$ is a number the flight software already has — the solver returns it — and its steady fall is a cheap, meaningful health check in telemetry. A rise means an assumption broke: a disturbance, a model error, a solver returning a non-optimal point, or a formulation that does not really meet conditions 1 and 2.
:::

## The alternatives, and what they give up

**Terminal equality constraint, $\mathbf{x}_N = \mathbf{0}$.** This is the special case $\mathbb{X}_f = \{\mathbf{0}\}$, $V_f = 0$, $\boldsymbol{\kappa}_f = 0$. Both conditions hold automatically, so stability follows, with no Riccati solution and no set computation. The price: the plan must hit the origin *exactly* in $N$ steps. That shrinks the set of workable starting states, demands a long horizon and makes the problem fragile — a small disturbance can leave it infeasible. Common in textbooks, rare in flight.

**No terminal constraint at all.** Keep the terminal cost, drop the set. Feasibility then costs nothing, and the set of workable states is much larger. But the guarantee weakens. Known results give stability *if* the horizon is long enough compared with a bound on the cost, and "long enough" is something you must estimate. In practice this is the most common flight formulation — terminal cost yes, terminal set no — with stability argued from horizon length, analysis and a very large Monte Carlo campaign.

**A softened terminal set.** A middle path used on real vehicles: impose the terminal set but soften it, as in the previous lesson. It is enforced whenever it can be and relaxed when the vehicle is far out, and the slack tells you which regime you are in.

::: warning A set where the LQR command fits is not automatically invariant
It is tempting to define $\mathbb{X}_f$ as "the states where the LQR command is within limits", $\{\mathbf{x} : |\mathbf{K}\mathbf{x}| \le u_{\max}\}$ — only the first rows of the construction above. That set is *not* invariant. From a point on its edge, the closed loop can step to a state where the command is over the limit. Then the terminal law is no longer feasible, and the proof collapses. The pushed-forward rows are exactly what fix this; for the worked example they take the set from four sides to twelve. Always check a terminal set for invariance under the terminal law, not only for obeying the constraints right now.
:::

## Check yourself

::: check
Condition 2 asks $V_f$ to fall by at least $\ell$ under the terminal law. Show that $V_f(\mathbf{x}) = \alpha\,\mathbf{x}^\top\mathbf{P}\mathbf{x}$ with $\alpha \ge 1$ ("alpha") also satisfies it, and say what is lost by taking $\alpha$ large.
:::

::: answer
With $\mathbf{x}^+ = \mathbf{A}_K\mathbf{x}$ and the closed-loop Riccati identity,

$$
V_f(\mathbf{x}^+) - V_f(\mathbf{x}) = \alpha\big[\mathbf{x}^{+\top}\mathbf{P}\mathbf{x}^+ - \mathbf{x}^\top\mathbf{P}\mathbf{x}\big] = -\alpha\,\ell(\mathbf{x}, -\mathbf{K}\mathbf{x}) \le -\ell(\mathbf{x}, -\mathbf{K}\mathbf{x})
$$

for $\alpha \ge 1$, since $\ell \ge 0$. So condition 2 holds with room to spare, and nothing in the proof breaks. Scaling up the terminal cost is a legal way to buy caution: the optimizer works harder to finish the horizon with a small state.

What is lost is performance. The terminal cost now overstates the true cost-to-go by a factor $\alpha$, so the finite-horizon problem no longer approximates the infinite-horizon one, and the loop is more aggressive near the end of the horizon than the true optimum. The shifted plan is no longer optimal at the next state either, so the cost decrease becomes a strict inequality instead of an equality.
:::

::: check
The terminal set for the proximity-ops axis reaches only $|x_1| = 0.387\,\mathrm{m}$ at rest, yet earlier lessons regulated the same vehicle from $2\,\mathrm{m}$. Is that a contradiction?
:::

::: answer
No. The terminal set is where the *plan* must end, not where the vehicle must start. From $(2, 0)$ the optimizer needs a horizon long enough to bring the predicted path into the terminal set within $N$ steps. With speed capped at $0.5\,\mathrm{m/s}$, the vehicle closes at most $0.5 \times 0.1 = 0.05\,\mathrm{m}$ per sample. The terminal set reaches out to about $0.67\,\mathrm{m}$ at full closing speed, so covering the gap takes about $(2 - 0.67)/0.05 \approx 27$ samples.

The earlier lessons used no terminal constraint, which is why $N = 20$, or even $N = 3$, gave an answer from $2\,\mathrm{m}$. Those problems were feasible; they were only unguaranteed. Adding the terminal set buys the proof and costs feasible starting states. The next lesson counts exactly how many.
:::

::: check
Your terminal set is computed for the LQR law, but the flight software runs the MPC law. Why build a set for a controller that never runs?
:::

::: answer
Because the terminal law is a tool inside the proof, not a law that flies. The argument needs to know that *some* feasible continuation exists past the horizon, costing no more than the terminal cost. The LQR law is the witness. The MPC law, being optimal, does at least as well as the witness at every step — that is Step 3 — so the vehicle never actually runs the terminal law.

One exception is worth knowing. A common flight design uses the same LQR law as the certified fallback when the solver fails. Then the terminal set doubles as a verified safe region for the fallback, and the work of computing it pays off twice.
:::

::: check
On the unstable pitch axis, the $\mathbf{P} = \mathbf{0}$ controller with $N = 8$ has spectral radius $1.0245$. A colleague proposes raising $\mathbf{Q}$ tenfold so the optimizer "cares more about the state". Will that work?
:::

::: answer
Not reliably, and not for the right reason. Scaling $\mathbf{Q}$ by ten has the same effect as scaling $\mathbf{R}$ down by ten: a more aggressive controller. For this plant it happens to work — with $\mathbf{Q} = 10\,\mathbf{I}$ the spectral radius at $N = 8$ drops to about $0.988$. But that is a tuning coincidence, not a guarantee, and the same trick fails on a plant whose instability is faster compared with the horizon.

It also buys stability by spending control effort, which matters as soon as the input limit is active. A controller that is stable only when it commands more than the actuator can give is unstable in the constrained problem, whatever the unconstrained eigenvalues say. The structural fix is the terminal cost, which gives $0.9390$ at every horizon, even $N = 1$, with no change to the weights.
:::

::: check
Explain why condition 2 is usually written as an inequality, rather than the equality that the Riccati choice produces.
:::

::: answer
Because the theorem only needs the inequality, and many useful terminal costs meet it strictly. Scaling by $\alpha \ge 1$ is one example. Robust and nonlinear MPC give others: there, $V_f$ is an upper bound on the terminal law's cost-to-go rather than its exact value. For nonlinear MPC the exact cost-to-go is usually unknown, so the standard construction uses a quadratic upper bound that holds in a small neighborhood of the target, meeting condition 2 with margin.

The inequality also makes the real requirement clear: the terminal cost must never *understate* the cost of finishing the job. Understating it is exactly the mistake the $\mathbf{P} = \mathbf{0}$ controller makes at every cycle.
:::

## Summary

| Idea | In one line |
| --- | --- |
| Failure mode | Short horizon, no terminal cost: the unstable pitch axis diverges, $\rho = 1.0245$ at $N = 8$, doubling every $1.43\,\mathrm{s}$ |
| Condition 1 | $\mathbb{X}_f \subseteq \mathbb{X}$, $\boldsymbol{\kappa}_f(\mathbf{x}) \in \mathbb{U}$ and $\mathbf{A}\mathbf{x} + \mathbf{B}\boldsymbol{\kappa}_f(\mathbf{x}) \in \mathbb{X}_f$ for $\mathbf{x} \in \mathbb{X}_f$ |
| Condition 2 | $V_f(\mathbf{A}\mathbf{x} + \mathbf{B}\boldsymbol{\kappa}_f(\mathbf{x})) - V_f(\mathbf{x}) \le -\ell(\mathbf{x}, \boldsymbol{\kappa}_f(\mathbf{x}))$ on $\mathbb{X}_f$ |
| Standard choice | $\boldsymbol{\kappa}_f = -\mathbf{K}\mathbf{x}$, $V_f = \mathbf{x}^\top\mathbf{P}\mathbf{x}$ (Riccati), $\mathbb{X}_f = O_\infty$ for $\mathbf{A}_K$ |
| Riccati identity | $\mathbf{P} - \mathbf{A}_K^\top\mathbf{P}\mathbf{A}_K = \mathbf{Q} + \mathbf{K}^\top\mathbf{R}\mathbf{K}$, so condition 2 holds with equality |
| Terminal set | Gilbert–Tan loop on $\mathbf{A}_K$; for the running plant it closes after $4$ pushes: $12$ sides, area $0.712$, $\lvert x_1\rvert \le 0.387\,\mathrm{m}$ at rest |
| Shifted plan | $\tilde{\mathbf{U}} = (\mathbf{u}_1^\star,\dots,\mathbf{u}_{N-1}^\star, \boldsymbol{\kappa}_f(\mathbf{x}_N^\star))$, feasible by condition 1 |
| Decrease | $V_N^0(\mathbf{x}^+) \le V_N^0(\mathbf{x}) - \ell(\mathbf{x}, \boldsymbol{\kappa}_N(\mathbf{x}))$; measured with equality to $10^{-7}$ |
| Conclusion | $V_N^0$ is a Lyapunov function; the origin is asymptotically stable, with region of attraction $\mathcal{X}_N$ |
| Alternatives | $\mathbf{x}_N = \mathbf{0}$ (automatically valid, small region); terminal cost only (large region, weaker guarantee); softened terminal set |

The next lesson takes the other half of the shifted-plan argument — feasibility — and asks what $\mathcal{X}_N$ actually looks like, how it grows with the horizon, and what the largest set any constrained controller could ever hold on to is.

::: context unstable-rocket Why a rocket wants to flip
Air pushes on a rocket's body and fins. The average point where that push acts is the **center of pressure**. If it sits *ahead* of the center of mass, a small nose-up tilt makes the air push the nose further up — like trying to throw a dart backward, feathers first. Many launch vehicles have no big fins, so for much of the climb through the thick air their center of pressure is ahead of their center of mass, and only the constantly steering engine keeps them pointed. That is the plus sign in $\ddot\theta = \omega^2\theta + u$.
:::

::: context spectral-radius Inside or outside the circle
A discrete loop multiplies its error pattern by its eigenvalues each sample. If every eigenvalue has size less than $1$ — sits inside the unit circle — errors die away. One eigenvalue outside is enough to make them grow. The spectral radius is the size of the biggest one. Both closed loops here have two real eigenvalues:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="250" y1="15" x2="250" y2="140" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <text x="254" y="26" font-size="11" fill="#6c7a93">size 1 (unit circle)</text>
  <line x1="75" y1="60" x2="325" y2="60" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="75" y1="115" x2="325" y2="115" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="75" y="48" font-size="12" fill="#b4232c">P = 0, N = 8</text>
  <text x="75" y="103" font-size="12" fill="#1d6fd1">Riccati P, any N</text>
  <circle cx="139.8" cy="60" r="5" fill="#b4232c"/>
  <circle cx="267.2" cy="60" r="5" fill="#b4232c"/>
  <circle cx="121.7" cy="115" r="5" fill="#1d6fd1"/>
  <circle cx="207.3" cy="115" r="5" fill="#1d6fd1"/>
  <text x="267" y="80" font-size="11" text-anchor="middle" fill="#b4232c">1.0245</text>
  <text x="207" y="135" font-size="11" text-anchor="middle" fill="#1d6fd1">0.939</text>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="110" y="160">0.8</text><text x="180" y="160">0.9</text><text x="250" y="160">1.0</text><text x="320" y="160">1.1</text>
  </g>
</svg>
```

With no terminal cost one eigenvalue ($1.0245$) sits slightly outside, and the loop slowly diverges. With the Riccati cost both sit inside ($0.939$ and $0.817$).
:::

::: context cost-to-go What "cost-to-go" means
On a road trip, the cost-to-go is what the rest of the trip will cost from where you are now: fuel, tolls, hours. It depends only on where you are and how you will drive from here. In control, the cost-to-go of a law is the total of all future stage costs if you start at $\mathbf{x}$ and follow that law forever. For LQR it has the neat closed form $\mathbf{x}^\top\mathbf{P}\mathbf{x}$ — one small matrix sums up the whole infinite future.
:::

::: context riccati-name Who Riccati was
Jacopo Riccati was an Italian mathematician of the early 1700s who studied a family of differential equations with a squared unknown in them. Equations of that shape now carry his name. The matrix versions used in control — continuous and discrete — turned up in the 1960s, when Kalman and others showed that the best linear-quadratic regulator and the best linear estimator both come from solving one. Riccati never saw a rocket; the name is a tribute to the shape of the equation.
:::

::: context gilbert-tan Where the terminal-set recipe comes from
Elmer Gilbert and K. T. Tan published the construction in 1991, in a paper on "maximal output admissible sets" for linear systems with state and control constraints. They showed that for a stable closed loop and a bounded constraint set, the loop of pushing constraints forward one step at a time stops after finitely many steps, and they gave the test for when to stop. The same idea sits under most terminal-set and invariant-set software used in MPC today.
:::

::: context terminal-set-shape The terminal set, drawn
Position $x_1$ across, speed $x_2$ up. The dashed lines are the speed limit $\pm0.5\,\mathrm{m/s}$. The blue polygon is $O_\infty$: twelve sides, a thin slanted sliver. Along $x_2 = 0$ it reaches only $\pm0.387\,\mathrm{m}$ (orange marks).

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="110" x2="340" y2="110" stroke="#6c7a93" stroke-width="1"/>
  <line x1="180" y1="20" x2="180" y2="200" stroke="#6c7a93" stroke-width="1"/>
  <line x1="20" y1="35" x2="340" y2="35" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="6 4"/>
  <line x1="20" y1="185" x2="340" y2="185" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="6 4"/>
  <polygon points="43.2,62.9 44.0,58.3 50.6,45.0 58.5,37.9 66.8,35.0 132.6,35.0 316.9,157.1 316.0,161.8 309.4,174.9 301.6,182.1 293.2,185.0 227.4,185.0" fill="#8fb8f0" fill-opacity="0.6" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="114.2" y1="104" x2="114.2" y2="116" stroke="#f2b880" stroke-width="3"/>
  <line x1="245.8" y1="104" x2="245.8" y2="116" stroke="#f2b880" stroke-width="3"/>
  <text x="336" y="104" font-size="12" text-anchor="end" fill="#1f2a44">x₁</text>
  <text x="186" y="18" font-size="12" fill="#1f2a44">x₂</text>
  <text x="24" y="30" font-size="11" fill="#b4232c">+0.5 m/s</text>
  <text x="24" y="200" font-size="11" fill="#b4232c">−0.5 m/s</text>
  <text x="250" y="128" font-size="11" fill="#1f2a44">0.387</text>
  <text x="317" y="150" font-size="11" text-anchor="end" fill="#1f2a44">0.805</text>
</svg>
```

It is tilted because the LQR command $-\mathbf{K}\mathbf{x}$ is small when position and speed have opposite signs — the vehicle is already heading home.
:::

::: context lyapunov-bowl A marble in a bowl
Drop a marble into a bowl. However it rolls, its height keeps going down, because friction takes a little energy each moment, and the lowest point is the bottom. So it must end up at the bottom. Aleksandr Lyapunov, a Russian mathematician, turned that picture into a method in his 1892 thesis: find any "height" that is zero only at the target, positive everywhere else, and always falling along the motion, and you have proved stability without ever solving the equations. In this lesson, the optimal MPC cost is the height.
:::

::: context value-staircase The cost running down
The optimal cost $V_N^0$ at each of the first forty cycles of the run. It never rises. It falls fastest while the vehicle is far away and paying a large stage cost, and flattens as it settles.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="180" x2="330" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="180" x2="40" y2="25" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline points="40,35.3 47,44.7 54,54.1 61,63.4 68,72.6 75,81.8 82,90.3 89,98.3 96,105.8 103,112.8 110,119.4 117,125.4 124,131.1 131,136.3 138,141.1 145,145.5 152,149.5 159,153.3 166,156.7 173,159.8 180,162.6 187,165.2 194,167.5 201,169.5 208,171.2 215,172.7 222,174.0 229,175.1 236,175.9 243,176.7 250,177.3 257,177.8 264,178.2 271,178.5 278,178.8 285,179.0 292,179.2 299,179.4 306,179.5 313,179.6 320,179.7" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="40" cy="35.3" r="3" fill="#1d6fd1"/>
  <circle cx="173" cy="159.8" r="3" fill="#1d6fd1"/>
  <g font-size="11" fill="#1f2a44">
    <text x="48" y="32">36.17 at k = 0</text>
    <text x="178" y="150">5.06 at k = 19</text>
    <text x="36" y="184" text-anchor="end">0</text>
    <text x="40" y="197" text-anchor="middle">0</text><text x="180" y="197" text-anchor="middle">20</text><text x="320" y="197" text-anchor="middle">40</text>
    <text x="326" y="170" text-anchor="end">cycle k</text>
  </g>
</svg>
```
:::
