---
id: l04-constraints-and-slack-variables
title: State and input constraints, softening and slacks
minutes: 21
covers:
  - State and input constraints; soft constraints and slack variables
---

Constraints are the reason MPC exists. Strip them out and an infinite-horizon linear MPC is exactly LQR, computed expensively. Everything the optimiser earns, it earns by planning around a limit that a fixed gain would discover only on arrival.

Input and state constraints look symmetric in the problem statement and behave nothing alike in flight. An input constraint is a fact about hardware: the thruster cannot produce more than it can produce, and if your command exceeds the limit, the vehicle will honour the limit whatever the software says. A state constraint is a fact about a *prediction*: it says the model, propagated from an estimated state, should stay inside some region. Disturbances, model error and navigation error can all put the real state outside a region your plan said it would never enter — and then the optimiser is asked to satisfy something it cannot.

This lesson covers what goes into $\mathbb{U}$ and $\mathbb{X}$, why a hard state constraint is a latent flight-software failure, and the standard repair: slack variables with an exact penalty, which makes the quadratic program always solvable while still enforcing the constraint whenever the constraint can be enforced.

## Input constraints

Almost every input constraint in GNC is one of four shapes, and only the last leaves the quadratic program.

**Box bounds.** $u_{\min} \le u_j \le u_{\max}$ per channel: a throttle range, a gimbal deflection limit, a reaction-wheel torque limit, a control-surface stop. Two rows per input per step.

**Rate limits.** $|\mathbf{u}_k - \mathbf{u}_{k-1}| \le \Delta u_{\max}$: a gimbal slew rate, a wheel torque ramp, a valve response. These need $\mathbf{u}_{-1}$, the input already commanded, as extra data in the problem — and they are one of the clearest cases where MPC beats a gain, because a rate limit is a constraint that couples time steps and a static gain has no way to respect it.

**Polytopic sets.** A thruster allocation where individual thrusters are nonnegative and bounded, mapped to a body force and torque, leaves a polytope in the force-torque variables: $\mathbf{G}_u\mathbf{u} \le \mathbf{h}_u$. Reaction wheels with a momentum envelope give the same shape.

**Norm bounds.** $\|\mathbf{u}\|_2 \le u_{\max}$ — a thrust magnitude limit that does not care about direction — is a second-order cone, not a polytope. It keeps the problem convex but makes it an SOCP rather than a QP, which the optimization module's second-order cone lesson covers. A common compromise is to inscribe a polytope in the cone, which is conservative by a known factor and keeps the QP solver.

Input constraints are kept hard. There is no benefit in letting the optimiser plan a command it cannot deliver, and a formulation that softens actuator limits will happily produce a plan that saturates and then be surprised.

## State constraints

State constraints are where vehicle engineering enters the formulation:

- a closing-speed limit on approach, as in the running example's $|x_2| \le 0.5\,\mathrm{m/s}$;
- a **glide slope** on descent, $\|\mathbf{r}_{\text{horiz}}\| \le \tan(\gamma)\, r_z$, which keeps the vehicle above a cone anchored at the landing point;
- an **approach corridor** on docking, the same cone shape anchored at the port;
- attitude-rate limits from a star tracker's slew tolerance or a gyro's measurement range;
- a structural load limit expressed through angle of attack and dynamic pressure;
- a **keep-out zone**, which is the complement of a ball and therefore *not convex* — its treatment is a topic of its own later in this module.

All of these are predictions about a future state, and none of them is enforced by physics. That is the asymmetry that governs everything below.

::: warning A hard state constraint can make the problem unsolvable in one sample
Take the proximity-ops axis with $|x_2| \le 0.5\,\mathrm{m/s}$ imposed on the predicted states, and suppose a disturbance leaves the vehicle at $\mathbf{x} = (2\,\mathrm{m},\ -0.8\,\mathrm{m/s})$. The constraint is imposed from $k = 1$, and $x_{2,1} = -0.8 + 0.1u_0$ with $|u_0| \le 1$, so the best reachable value is $x_{2,1} = -0.7\,\mathrm{m/s}$. Every candidate plan violates the constraint at the first step, and the feasible set is empty. There is no "nearly feasible" answer: the problem has no solution and a solver run on it does not return a command.

Run this through the interior-point solver of the previous lesson and it does not report the difficulty politely — the iterates diverge, the barrier terms overflow, and the returned values are not numbers. A production solver such as OSQP does better: it produces a certificate of primal infeasibility, so the controller at least knows *why* it has nothing to apply. Either way, a control cycle has passed with no command.

This is not an exotic case. Any hard state constraint plus any disturbance large enough to cross it gives the same outcome, and the crossing may be caused by the navigation filter rather than by the vehicle.
:::

## Softening with slack variables

The repair is to let the constraint be violated, at a price. Replace each state constraint $\mathbf{g}^\top\mathbf{x}_k \le h$ with

$$
\mathbf{g}^\top\mathbf{x}_k \le h + s_k, \qquad s_k \ge 0 ,
$$

and add a penalty on $s_k$ to the cost. The slack $s_k$ is a new decision variable, one per softened constraint per step, so the QP grows — and it grows in the sparse direction, since each slack appears in one constraint row and one cost term.

The penalty's *shape* decides whether the constraint is still enforced when it can be. Use a linear penalty $\rho\sum_k s_k$ with $\rho$ large enough and the result is an **exact penalty**: the solution of the softened problem is the solution of the hard problem whenever the hard problem is feasible, and the minimum-violation solution when it is not. The threshold is set by duality from the optimization module: if $\lambda^\star$ is the optimal multiplier of the hard constraint — the rate at which the optimal cost falls if the constraint is relaxed — then any $\rho > \lambda^\star$ makes buying a unit of violation more expensive than it is worth, and the optimiser declines to buy.

::: key Soft constraints and exact penalties
Replace a state constraint $g(\mathbf{x}) \le 0$ with $g(\mathbf{x}) \le s$, $s \ge 0$, and add $\rho s$ to the cost. With $\rho$ larger than the optimal dual variable, the penalty is EXACT: the constraint is met whenever it is attainable, and the QP is always feasible.
:::

::: example The exact-penalty threshold, measured
Solve the hard-constrained problem from $\mathbf{x} = (2, 0)$ with $N = 20$, $|u| \le 1$, $|x_2| \le 0.5$. It is feasible: the optimal plan accelerates to the velocity limit in five samples and then rides it, and the multipliers on the active rows peak at $\lambda^\star = 5.6937$ — meaning that allowing $1\,\mathrm{m/s}$ more closing speed at that step would reduce the optimal cost by about $5.69$.

Now soften every velocity row with its own slack and sweep the penalty:

| $\rho$ | $\rho/\lambda^\star$ | $\max\lvert x_2\rvert$ | largest slack | distance from the hard solution |
| --- | --- | --- | --- | --- |
| $2.85$ | $0.50$ | $0.7553$ | $2.6\times10^{-1}$ | $1.0$ |
| $5.12$ | $0.90$ | $0.5208$ | $2.1\times10^{-2}$ | $2.1\times10^{-1}$ |
| $5.75$ | $1.01$ | $0.500000$ | $8.2\times10^{-10}$ | $8.2\times10^{-9}$ |
| $11.39$ | $2.00$ | $0.500000$ | $1.1\times10^{-11}$ | $2.6\times10^{-10}$ |
| $56.94$ | $10.00$ | $0.500000$ | $3.7\times10^{-13}$ | $2.5\times10^{-11}$ |

The transition is sharp and lands exactly where the theory puts it. Below $\lambda^\star$ the optimiser sells the constraint: at half the threshold it exceeds the speed limit by $51\,\%$ because the cost saved is worth more than the penalty paid. At $1\,\%$ above the threshold the violation is at solver noise and the input sequence is the hard-constrained one to nine decimals. The constraint is honoured not because it is imposed but because violating it no longer pays.
:::

::: example What softening buys in closed loop
Same plant and weights, $\rho = 57$, and a velocity kick of $-0.4\,\mathrm{m/s}$ injected at $t = 2.0\,\mathrm{s}$ while the vehicle is riding the speed limit — a thruster misfire, or a navigation update that moves the estimate. The state jumps to $x_2 = -0.9\,\mathrm{m/s}$, which is $0.4\,\mathrm{m/s}$ outside the limit, and the hard formulation has no solution at that instant.

The softened controller behaves like this:

| $t$ (s) | $x_2$ (m/s) | $u$ ($\mathrm{m/s^2}$) | total slack |
| --- | --- | --- | --- |
| $1.9$ | $-0.500$ | $0.000$ | $0.000$ |
| $2.0$ | $-0.900$ | $1.000$ | $0.600$ |
| $2.1$ | $-0.800$ | $1.000$ | $0.300$ |
| $2.2$ | $-0.700$ | $1.000$ | $0.100$ |
| $2.3$ | $-0.600$ | $1.000$ | $0.000$ |
| $2.4$ | $-0.500$ | $0.000$ | $0.000$ |

It brakes at the input limit for four samples and is back inside the constraint at $t = 2.4\,\mathrm{s}$, $0.4\,\mathrm{s}$ after the kick — which is the shortest possible recovery, since removing $0.4\,\mathrm{m/s}$ at $1\,\mathrm{m/s^2}$ takes exactly $0.4\,\mathrm{s}$. The slack profile is worth reading: at $t = 2.0$ the plan declares that it will exceed the limit at the next three predicted steps by $0.3$, $0.2$ and $0.1\,\mathrm{m/s}$, totalling $0.6$, and that total shrinks to zero as the violation is worked off. Nothing about this behaviour is heuristic; it is the minimum-violation plan that the exact penalty selects.

Softening also gives the flight software a number it can act on. The slack vector is a direct, per-constraint measure of how much the vehicle is outside its envelope and for how long, which is far more useful in telemetry than a solver status flag.
:::

## Why a quadratic penalty is not enough

The other natural choice is a quadratic penalty $\sigma\sum_k s_k^2$. It keeps the cost smooth and differentiable, which is why it is popular, and it is never exact. Stationarity in $s_k$ gives $2\sigma s_k = \lambda_k$, so the optimal slack is $\lambda_k/(2\sigma)$ — strictly positive whenever the constraint would have been active, for any finite $\sigma$.

::: example The residual violation of a quadratic penalty
Same problem from $\mathbf{x} = (2,0)$, with a pure quadratic penalty and no linear term:

| $\sigma$ | $\max\lvert x_2\rvert$ | violation | $\lambda^\star/(2\sigma)$ |
| --- | --- | --- | --- |
| $10$ | $0.6753$ | $0.1753$ | $0.2847$ |
| $100$ | $0.5256$ | $0.0256$ | $0.0285$ |
| $1000$ | $0.502808$ | $0.002808$ | $0.002847$ |
| $10^4$ | $0.500284$ | $0.000284$ | $0.000285$ |

The violation follows $\lambda^\star/(2\sigma)$ to three digits once $\sigma$ is large enough for the multiplier to be near its hard-constrained value. To get $1\,\mathrm{mm/s}$ of residual violation you need $\sigma \approx 2800$; to get $0.1\,\mathrm{mm/s}$ you need $\sigma \approx 28000$, and by then the QP's cost matrix spans four orders of magnitude and the solver is slower and less accurate. The practical formulation uses both terms, $\rho s_k + \sigma s_k^2$ with $\rho$ above the exact threshold and a modest $\sigma$: the linear term does the enforcing, the quadratic term smooths the solution and helps the solver.
:::

## Choosing the penalty weight

$\rho$ has to exceed the largest optimal multiplier you will ever see, which is not known in closed form for a constrained problem — so it is measured. Run the dispersion campaign with the hard constraints imposed wherever they are feasible, record the multipliers the solver returns on the softened rows, take the maximum over all cases and all steps, and multiply by a factor between two and ten. Solvers return multipliers for free; this costs nothing but the plumbing to log them.

Resist the urge to set $\rho = 10^{9}$ and stop thinking. An enormous penalty weight wrecks the scaling of the QP, and the cost is measurable:

| $\rho$ | interior-point iterations |
| --- | --- |
| $11.4$ | $14$ |
| $57$ | $21$ |
| $570$ | $34$ |
| $5700$ | $42$ |
| $57000$ | $56$ |

The same problem from $\mathbf{x} = (2, -0.8)$, the same answer to eleven digits every time — the total slack is $0.300$ from $\rho = 11.4$ upward, the minimum achievable — and four times the iterations at the top of the range. On a fixed iteration budget, an oversized $\rho$ spends your margin to enforce something that was already enforced.

::: note Constraint softening is not the whole answer to infeasibility
Softening keeps the QP solvable. It does not keep the *vehicle* inside its envelope, and it does not help if the solver fails for some other reason — a timeout, a numerical breakdown, a corrupted input. Flight architecture therefore pairs softening with two other mechanisms: a fallback control law that runs when the solve does not return in time, and an independent monitor that checks the returned plan against the constraints before it is applied. The real-time lesson later in this module treats both. The rule to carry now is that the optimiser is one component in a loop that must still function when the optimiser does not.
:::

## Check yourself

::: check
Why is it acceptable to soften a glide-slope constraint but not a throttle limit?
:::

::: answer
The glide slope is a statement about the predicted trajectory; the throttle limit is a statement about the engine. If the optimiser plans a trajectory that dips $0.2^\circ$ below the glide slope for two samples, that plan can be flown, and the vehicle will fly it — the constraint exists to keep margin against terrain and plume geometry, and a small, penalised excursion is a design trade rather than an impossibility. If the optimiser plans a throttle of $112\,\%$, that plan cannot be flown: the engine will deliver $100\,\%$, so the trajectory that gets executed is not the trajectory that was optimised, and every prediction downstream of that step is wrong. Softening an input limit does not relax physics, it only hides the saturation from the optimiser — which is precisely the failure that constrained MPC was adopted to avoid.
:::

::: check
Your softened controller shows a small persistent slack on the velocity constraint throughout a nominal run with no disturbance. What are the two likely causes, and how would you distinguish them?
:::

::: answer
Either $\rho$ is below the exact threshold, so the optimiser is buying violation because it is cheap, or the constraint is genuinely unreachable given the input limits and the current state, so the minimum-violation solution has nonzero slack. Distinguish them by raising $\rho$ by a factor of ten and re-running: if the slack collapses to solver noise, $\rho$ was too small — that is the transition between the $0.90$ and $1.01$ rows of the sweep above. If the slack is unchanged at $10\rho$, the problem is physical and no penalty will fix it; the vehicle cannot meet that constraint from that state, and the answer is a different constraint, more control authority, or an earlier intervention. Comparing the slack against the analytically minimum violation, as in the $0.3\,\mathrm{m/s}$ total of the kick example, settles it immediately.
:::

::: check
You soften a state constraint with a single shared slack for all $N$ steps instead of one slack per step. What changes?
:::

::: answer
The QP gets smaller by $N-1$ variables, and the meaning of the penalty changes. With a shared slack, the cost is $\rho\max_k(\text{violation at }k)$ rather than $\rho\sum_k(\text{violation at }k)$: the optimiser is charged only for the worst excursion, so once it has paid for one deep violation, further violations at other steps are free. That can be what you want — "never exceed this by more than the amount I am paying for" is a reasonable specification, and it makes the exact-penalty threshold the largest single multiplier rather than their sum. It is wrong when the duration of the excursion matters, which it usually does for loads, heating and plume impingement. The per-step version also gives far better telemetry, since the slack vector shows where in the horizon the trouble is.
:::

::: check
A reviewer asks why the multiplier $\lambda^\star = 5.6937$ has anything to do with the correct penalty weight, given that one is a Lagrange multiplier and the other is a cost coefficient. Answer them.
:::

::: answer
They are the same kind of quantity: a price per unit of constraint violation. The duality results of the optimization module say the optimal multiplier is the sensitivity of the optimal cost to relaxing its constraint, $\lambda^\star = -\partial V^\star/\partial h$, so relaxing the speed limit by $\delta$ would reduce the optimal cost by about $5.6937\,\delta$. The penalty $\rho$ is what the optimiser is *charged* for that same $\delta$ of relaxation. If $\rho < \lambda^\star$, buying violation reduces the total objective and the optimiser buys; if $\rho > \lambda^\star$ it does not, and the softened solution coincides with the hard one. The numbers in the sweep are that argument made visible: the behaviour switches between $\rho/\lambda^\star = 0.90$ and $1.01$.
:::

::: check
The exact penalty means the QP is always feasible. Does that mean the closed loop is always safe?
:::

::: answer
No, and conflating the two is a serious error. Feasibility of the optimisation means the solver always has something to return; safety means the vehicle stays inside its envelope. A softened formulation will happily return a plan that violates the state constraint when it must — that is what makes it always feasible — and the vehicle then flies outside the envelope while paying a penalty. What softening guarantees is that you get a command, that the command is the minimum-violation one under the chosen weights, and that the slack tells you exactly how far outside you are. Safety has to come from somewhere else: margin in the constraint values themselves, a robust formulation that accounts for the disturbance set in advance, and an independent monitor with the authority to change mode. The kick example is the honest picture — the vehicle exceeded its speed limit for $0.4\,\mathrm{s}$ and the controller did the best that was physically available.
:::

## Summary

| Object | Statement |
| --- | --- |
| Input constraints | Box, rate $\lvert\mathbf{u}_k - \mathbf{u}_{k-1}\rvert \le \Delta u_{\max}$, polytopic $\mathbf{G}_u\mathbf{u} \le \mathbf{h}_u$, norm (SOCP). Always hard |
| State constraints | Speed limits, glide slope, corridor, rate limits, loads; predictions, not physics |
| Infeasibility | From $(2, -0.8)$ with $\lvert x_2\rvert \le 0.5$: $x_{2,1} \in [-0.9, -0.7]$, so no feasible plan exists |
| Softening | $\mathbf{g}^\top\mathbf{x}_k \le h + s_k$, $s_k \ge 0$, penalty $\rho\sum_k s_k$ |
| Exact penalty | $\rho > \lambda^\star$ recovers the hard solution exactly; measured switch between $0.90\lambda^\star$ and $1.01\lambda^\star$, $\lambda^\star = 5.6937$ |
| Quadratic penalty | Residual violation $\lambda^\star/(2\sigma)$, never zero: $0.00281$ measured at $\sigma = 1000$ against $0.00285$ predicted |
| Practical form | $\rho s_k + \sigma s_k^2$: linear term enforces, quadratic term smooths |
| Choosing $\rho$ | Maximum multiplier over the dispersion campaign, times two to ten; oversized $\rho$ cost $14 \to 56$ iterations |
| Recovery example | $-0.4\,\mathrm{m/s}$ kick: slack $0.6 \to 0$, back inside the limit in $0.4\,\mathrm{s}$, the physical minimum |
| Not a safety argument | Always feasible is not always safe; pair with margin, robust design, a monitor and a fallback law |

The next lesson takes up the terminal cost and terminal set — the two ingredients that turn a receding-horizon heuristic into a controller with a stability proof.
