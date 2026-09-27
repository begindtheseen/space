---
id: l04-constraints-and-slack-variables
title: State and input constraints, softening and slacks
minutes: 24
covers:
  - State and input constraints; soft constraints and slack variables
---

Your family car has a top speed. Press the pedal as hard as you like and it will not go faster, because the engine cannot push harder. The road also has a speed limit. That one is different. Nothing in the car stops you from breaking it. It is a rule about where you *should* be, and a gust of wind, a downhill slope or a moment of not paying attention can put you over it.

A spacecraft's controller meets both kinds of limit, and this lesson is about telling them apart. Limits are the whole reason MPC exists. Take them away and an infinite-horizon linear MPC is exactly LQR, only computed the expensive way. Everything the optimizer earns, it earns by planning around a limit that a fixed gain would only discover when it hit it.

In the problem statement, the two kinds of limit look alike. In flight they behave nothing alike. An **input constraint** — a limit on the command — is a fact about hardware: if you ask a thruster for more than it has, the thruster gives what it has, whatever the software says. A **state constraint** — a limit on where the vehicle is or how it moves — is a fact about a *prediction*. It says the model, run forward from an estimated state, should stay inside some region. A disturbance, a model error or a navigation error can put the real vehicle outside that region. Then the optimizer is asked to do something impossible.

This lesson covers what goes into the input set $\mathbb{U}$ and the state set $\mathbb{X}$ (read "blackboard U" and "blackboard X"), why a hard state constraint is a failure waiting to happen, and the standard repair: **slack variables** with an **exact penalty**, which keep the quadratic program always solvable while still enforcing the limit whenever it can be enforced.

## Input constraints

Almost every input limit in guidance and control has one of four shapes. Only the last one leaves the quadratic program (QP).

**Box bounds.** $u_{\min} \le u_j \le u_{\max}$ for each input channel $j$: a throttle range, a gimbal angle limit, a reaction-wheel torque limit, the mechanical stop on a control surface. Each input at each step adds two rows, one for the floor and one for the ceiling.

**Rate limits.** $|\mathbf{u}_k - \mathbf{u}_{k-1}| \le \Delta u_{\max}$: how fast a gimbal can swing, how fast a wheel's torque can ramp, how fast a valve can open. The first of these rows needs $\mathbf{u}_{-1}$, the command already sent last cycle, as extra data. Rate limits are one of the clearest places where MPC beats a gain. A rate limit ties one time step to the next, and a fixed gain, which only sees the present, has no way to respect it.

**Polytopic sets.** A **[[polytope|polytope-word]]** is a shape with flat sides, described by a stack of linear inequalities $\mathbf{G}_u\mathbf{u} \le \mathbf{h}_u$. Thruster allocation gives one: each thruster pushes between zero and its maximum, and mapping all of them to a body force and torque leaves a flat-sided region of possible commands. A reaction-wheel momentum envelope gives the same shape.

**Norm bounds.** $\|\mathbf{u}\|_2 \le u_{\max}$ says the thrust *magnitude* is limited, in any direction. That is a round shape, not a flat-sided one — a **[[second-order cone|cone-vs-polygon]]** — so the problem stays convex but becomes an SOCP (second-order cone program) rather than a QP. The optimization module's cone lesson covers it. A common compromise is to fit a polygon inside the circle. That is conservative by a known factor and keeps the QP solver.

Input constraints are kept **hard** — never allowed to be broken in the plan. There is nothing to gain by letting the optimizer plan a command the hardware cannot deliver.

## State constraints

State constraints are where vehicle engineering walks into the formulation:

- a closing-speed limit on approach, like the running example's $|x_2| \le 0.5\,\mathrm{m/s}$;
- a **[[glide slope|glide-slope]]** on descent, $\|\mathbf{r}_{\text{horiz}}\| \le \tan(\gamma)\, r_z$: a cone with its tip at the landing point, which keeps the vehicle high enough for how far out it is;
- an **approach corridor** on docking — the same cone shape, with its tip at the docking port;
- attitude-rate limits, from a star tracker that loses its stars in a fast slew or a gyro that saturates;
- a structural load limit, written through angle of attack and dynamic pressure;
- a **keep-out zone** — "stay outside this ball". The outside of a ball is *not convex*, and it gets its own treatment later in the module.

Every one of these is a prediction. None is enforced by physics, and that drives everything below.

::: warning A hard state constraint can make the problem unsolvable in one sample
Take the proximity-ops axis (position $x_1$, velocity $x_2$, $T_s = 0.1\,\mathrm{s}$) with $|x_2| \le 0.5\,\mathrm{m/s}$ imposed on the predicted states. Suppose a disturbance leaves the vehicle at $\mathbf{x} = (2\,\mathrm{m},\ -0.8\,\mathrm{m/s})$. The constraint starts at $k = 1$, and the model says

$$
x_{2,1} = -0.8 + 0.1\,u_0, \qquad |u_0| \le 1 .
$$

So $x_{2,1}$ can be anywhere from $-0.9$ to $-0.7\,\mathrm{m/s}$. The best the thruster can do is $-0.7\,\mathrm{m/s}$, still $0.2\,\mathrm{m/s}$ over the limit. Every possible plan breaks the constraint at the first step: the problem is **infeasible**. There is no "nearly feasible" answer. The problem has no solution, and a solver run on it returns no command.

A basic interior-point code does not report this politely: its successive guesses run away and can end in values that are not numbers at all. A production solver such as OSQP does better. It returns a **[[certificate of infeasibility|infeasibility-certificate]]**, so the controller at least knows *why* it has nothing to apply. Either way, a control cycle has gone by with no command.

This is not an exotic case. Any hard state constraint plus any disturbance big enough to cross it gives the same result — and the "crossing" can be caused by the navigation filter moving its estimate, not by the vehicle moving at all.
:::

## Softening with slack variables

Think of a bank account that lets you go below zero, but charges a fee for every dollar you are overdrawn. You *can* overspend. Usually you won't, because the fee costs more than the thing you wanted. And on the day an emergency forces it, the account still works.

That is the repair. Let the constraint be broken, at a price. Replace each state constraint $\mathbf{g}^\top\mathbf{x}_k \le h$ with

$$
\mathbf{g}^\top\mathbf{x}_k \le h + s_k, \qquad s_k \ge 0 ,
$$

and add a charge for $s_k$ to the cost. The **[[slack|slack-word]]** $s_k$ is a new decision variable — the optimizer picks it, like the inputs — and it measures by how much the constraint is broken at step $k$. There is one slack per softened constraint per step. The QP grows, but in a friendly way: each slack appears in one constraint row and one cost term, so the matrices stay sparse.

The *shape* of the charge decides whether the constraint is still honored when it can be. Charge a straight line, $\rho\sum_k s_k$ ($\rho$ is the Greek letter "rho"), with $\rho$ big enough, and you get an **exact penalty**: the softened problem gives exactly the hard problem's answer whenever the hard problem has one, and the smallest possible violation when it does not.

How big is "big enough"? Recall the **[[Lagrange multiplier|shadow-price]]** from the optimization module's duality lesson. Write $\lambda^\star$ ("lambda star") for the optimal multiplier — also called the optimal **dual variable** — of the hard constraint. It is a price: the rate at which the optimal cost would fall if the constraint were loosened a little. If each unit of violation costs $\rho > \lambda^\star$, then buying a unit of violation costs more than it saves, and the optimizer declines to buy.

::: key Soft constraints and exact penalties
Replace a state constraint $g(\mathbf{x}) \le 0$ with $g(\mathbf{x}) \le s$, $s \ge 0$, and add $\rho s$ to the cost. With $\rho$ larger than the optimal dual variable, the penalty is EXACT: the constraint is met whenever it is attainable, and the QP is always feasible.
:::

::: note Why the threshold is the multiplier
Loosen the constraint by a small amount $\delta$, from $h$ to $h + \delta$. Duality says the best cost drops by about $\lambda^\star\delta$ — that is what the multiplier means, $\lambda^\star = -\partial V^\star/\partial h$. In the softened problem, choosing slack $s = \delta$ loosens the constraint by exactly that amount and costs $\rho\delta$. So the net change in the objective is about

$$
(\rho - \lambda^\star)\,\delta .
$$

If $\rho > \lambda^\star$, that is positive for every $\delta > 0$: any violation makes the objective worse, so the optimizer keeps $s = 0$ and returns the hard solution. If $\rho < \lambda^\star$, a little violation makes the objective better, and the optimizer buys some.
:::

::: example The exact-penalty threshold, measured
Use the running plant, $N = 20$, the Riccati terminal cost, $|u| \le 1\,\mathrm{m/s^2}$ and $|x_2| \le 0.5\,\mathrm{m/s}$, starting from $\mathbf{x} = (2, 0)$. First solve it with the constraint **hard**. It is feasible: the best plan brakes at full thrust for five samples until the speed reaches the limit, then rides the limit. The multipliers on the active speed rows peak at

$$
\lambda^\star = 5.6937 .
$$

In words: allowing $1\,\mathrm{m/s}$ more closing speed at that step would lower the optimal cost by about $5.69$.

Now soften every speed row with its own slack and sweep the penalty $\rho$:

| $\rho$ | $\rho/\lambda^\star$ | $\max\lvert x_2\rvert$ | largest slack | distance from the hard solution |
| --- | --- | --- | --- | --- |
| $2.85$ | $0.50$ | $0.7553$ | $0.255$ | $1.0$ |
| $5.12$ | $0.90$ | $0.5208$ | $0.0208$ | $0.21$ |
| $5.75$ | $1.01$ | $0.500000$ | below $10^{-9}$ | below $10^{-7}$ |
| $11.39$ | $2.00$ | $0.500000$ | below $10^{-9}$ | below $10^{-7}$ |
| $56.94$ | $10.00$ | $0.500000$ | below $10^{-9}$ | below $10^{-7}$ |

("Distance" is the largest difference between the softened plan's inputs and the hard plan's inputs.)

Read the jump. At half the threshold the optimizer "sells" the constraint: it goes $0.755 / 0.5 - 1 = 51\,\%$ over the speed limit, because the cost it saves is worth more than the fee. At only $1\,\%$ above the threshold, the violation is down to solver rounding and the inputs match the hard plan to the solver's accuracy. The switch lands exactly where the theory puts it, between $0.90\lambda^\star$ and $1.01\lambda^\star$. The constraint is honored not because it is forced, but because breaking it no longer pays.
:::

::: example What softening buys in closed loop
Same plant and weights, $\rho = 57$ (about $10\lambda^\star$). At $t = 2.0\,\mathrm{s}$, while the vehicle is riding the speed limit, a velocity kick of $-0.4\,\mathrm{m/s}$ hits it — a thruster misfire, or a navigation update that moves the estimate. The speed jumps to $x_2 = -0.9\,\mathrm{m/s}$, $0.4\,\mathrm{m/s}$ past the limit. At that instant the hard formulation has no solution at all.

The softened controller does this:

| $t$ (s) | $x_2$ (m/s) | $u$ ($\mathrm{m/s^2}$) | total slack in the plan |
| --- | --- | --- | --- |
| $1.9$ | $-0.500$ | $0.000$ | $0.000$ |
| $2.0$ | $-0.900$ | $1.000$ | $0.600$ |
| $2.1$ | $-0.800$ | $1.000$ | $0.300$ |
| $2.2$ | $-0.700$ | $1.000$ | $0.100$ |
| $2.3$ | $-0.600$ | $1.000$ | $0.000$ |
| $2.4$ | $-0.500$ | $0.000$ | $0.000$ |

It [[brakes at full thrust for four samples|kick-recovery]] and is back inside the limit at $t = 2.4\,\mathrm{s}$, $0.4\,\mathrm{s}$ after the kick. Sanity check: removing $0.4\,\mathrm{m/s}$ at $1\,\mathrm{m/s^2}$ takes $0.4 / 1 = 0.4\,\mathrm{s}$. So this is the fastest recovery physics allows.

The slack column tells a story. At $t = 2.0$ the plan admits it will be over the limit at the next three predicted steps, by $0.3$, $0.2$ and $0.1\,\mathrm{m/s}$ — a total of $0.6$. Each cycle one of those is worked off, and the total shrinks to zero. Nothing here is hand-tuned. It is the minimum-violation plan the exact penalty picks.

Softening also hands the flight software a useful number: the slack vector says how far outside its envelope the vehicle is, and for how long. In **[[telemetry|telemetry-word]]**, that is far more useful than a solver's "failed" flag.
:::

## Why a quadratic penalty is not enough

The other natural choice is a quadratic charge, $\sigma\sum_k s_k^2$ ($\sigma$ is "sigma"). It keeps the cost smooth, which is why people like it. But it is *never* exact.

Here is why, in one line. Near zero, a squared charge is almost flat: the fee for a tiny violation $s$ is $\sigma s^2$, far smaller than the saving $\lambda s$. Setting the slope of the objective in $s_k$ to zero gives

$$
2\sigma s_k = \lambda_k \quad\Longrightarrow\quad s_k = \frac{\lambda_k}{2\sigma} ,
$$

which is strictly positive whenever the constraint would have been active, for any finite $\sigma$. The quadratic penalty always buys a little violation. The picture is in the note on [[penalty shapes|penalty-shapes]].

::: example The leftover violation of a quadratic penalty
Same problem from $\mathbf{x} = (2, 0)$, with only a quadratic charge:

| $\sigma$ | $\max\lvert x_2\rvert$ | violation | $\lambda^\star/(2\sigma)$ |
| --- | --- | --- | --- |
| $10$ | $0.6753$ | $0.1753$ | $0.2847$ |
| $100$ | $0.5256$ | $0.0256$ | $0.0285$ |
| $1000$ | $0.502808$ | $0.002808$ | $0.002847$ |
| $10^4$ | $0.500284$ | $0.000284$ | $0.000285$ |

Once $\sigma$ is big enough that the multiplier is close to its hard value, the violation follows $\lambda^\star/(2\sigma)$ to within about $1\,\%$. Check one row: $5.6937 / (2 \times 1000) = 0.00285$, against $0.00281$ measured.

To get the leftover down to $1\,\mathrm{mm/s}$ you need $\sigma \approx 5.69 / (2 \times 0.001) \approx 2800$. For $0.1\,\mathrm{mm/s}$ you need about $28\,000$. By then the numbers in the QP's cost matrix span four powers of ten, and the solver is slower and less accurate.

The practical recipe uses both: $\rho s_k + \sigma s_k^2$, with $\rho$ above the exact threshold and a modest $\sigma$. The straight-line term does the enforcing. The squared term smooths the solution and helps the solver.
:::

## Choosing the penalty weight

$\rho$ has to beat the largest multiplier you will ever meet. There is no formula for that in a constrained problem, so you measure it. Run the **[[dispersion campaign|dispersion-campaign]]** — the big batch of simulations with scattered starting conditions — with the hard constraints wherever they are feasible. Log the multipliers the solver returns on the softened rows. Take the largest over all cases and all steps, and multiply by a factor between two and ten. Solvers return multipliers for free.

Resist the urge to set $\rho = 10^9$ and stop thinking. A huge weight wrecks the QP's scaling, measurably. Here is the same problem from $\mathbf{x} = (2, -0.8)$, solved by a basic primal-dual interior-point code:

| $\rho$ | interior-point iterations |
| --- | --- |
| $11.4$ | $12$ |
| $57$ | $18$ |
| $570$ | $32$ |
| $5700$ | $39$ |
| $57\,000$ | $46$ |

Every row returns the same answer: a total slack of $0.300$, the smallest possible ($0.2$ at the first predicted step and $0.1$ at the second, the best full braking can do). Yet the last row takes nearly four times the iterations of the first. A production solver with careful internal scaling suffers less, but still suffers. On a fixed iteration budget, an oversized $\rho$ spends your margin enforcing something that was already enforced.

::: warning Softening is not the whole answer to infeasibility
Softening keeps the QP solvable. It does not keep the *vehicle* inside its envelope. And it does not help if the solver fails for another reason — a timeout, a numerical breakdown, a corrupted input. So flight designs pair softening with two more defenses: a **fallback** control law that runs when the solve does not return in time, and an independent monitor that checks the returned plan against the constraints before it is used. The real-time lesson later in this module covers both. The rule to carry now: the optimizer is one part of a loop that must still work when the optimizer does not.
:::

## Check yourself

::: check
Why is it acceptable to soften a glide-slope constraint but not a throttle limit?
:::

::: answer
The glide slope is a statement about the predicted path. The throttle limit is a statement about the engine.

If the optimizer plans a path that dips $0.2^\circ$ below the glide slope for two samples, that plan can be flown, and the vehicle will fly it. The glide slope exists to keep margin against terrain and the engine's plume, so a small, charged excursion is a design trade, not an impossibility.

If the optimizer plans a throttle of $112\,\%$, that plan cannot be flown. The engine delivers $100\,\%$, so the path actually flown is not the path that was optimized, and every prediction after that step is wrong. Softening an input limit does not loosen physics. It only hides the saturation — the actuator pinned at its limit — from the optimizer — the exact failure that constrained MPC was brought in to avoid.
:::

::: check
Your softened controller shows a small, steady slack on the speed constraint all through a normal run with no disturbance. Give the two likely causes, and say how you would tell them apart.
:::

::: answer
**Cause 1:** $\rho$ is below the exact threshold, so the optimizer is buying violation because it is cheap. **Cause 2:** the constraint really cannot be met from that state with those input limits, so even the minimum-violation plan has some slack.

To tell them apart, raise $\rho$ tenfold and run again. If the slack collapses to solver rounding, $\rho$ was too small — that is the jump between the $0.90$ and $1.01$ rows of the sweep. If the slack does not change at $10\rho$, the problem is physical and no penalty will fix it. The vehicle cannot meet that constraint from that state, and the fix is a different constraint, more control authority, or acting earlier. Comparing the slack with the smallest violation you can work out by hand — like the $0.3\,\mathrm{m/s}$ total in the kick example — settles it at once.
:::

::: check
You soften a state constraint with one shared slack for all $N$ steps, instead of one slack per step. What changes — including the size of $\rho$ you need?
:::

::: answer
The QP gets $N - 1$ variables smaller, and the meaning of the charge changes. With one shared slack $s$, every step's constraint is loosened by the same $s$, so you pay $\rho \cdot \max_k(\text{violation at } k)$ instead of $\rho\sum_k(\text{violation at } k)$. You are charged only for the worst excursion. Once the optimizer has paid for one deep violation, more violation at other steps is free.

That also moves the exact threshold *up*, not down. Loosening the shared slack by $\delta$ loosens every active row at once, so it saves about $\sum_k \lambda_k\,\delta$. Exactness now needs $\rho > \sum_k \lambda_k^\star$, the *sum* of the multipliers. For the running example that sum is about $55.6$, nearly ten times the per-step threshold of $5.69$; at $\rho = 30$ a shared slack still lets the speed reach $0.649\,\mathrm{m/s}$.

A shared slack can be the right specification — "never exceed this by more than the amount I am paying for" — but it is wrong when the *duration* of an excursion matters, as it usually does for loads, heating and plume impingement. The per-step version also gives far better telemetry, since the slack vector shows *where* in the horizon the trouble is.
:::

::: check
A reviewer asks why $\lambda^\star = 5.6937$ has anything to do with the right penalty weight, since one is a Lagrange multiplier and the other is a cost coefficient. Answer them.
:::

::: answer
They are the same kind of quantity: a price per unit of constraint violation. Duality says the optimal multiplier is how fast the optimal cost falls when the constraint is loosened, $\lambda^\star = -\partial V^\star/\partial h$. So loosening the speed limit by a small $\delta$ would lower the optimal cost by about $5.6937\,\delta$. The penalty $\rho$ is what the optimizer is *charged* for that same $\delta$.

If $\rho < \lambda^\star$, buying violation lowers the total objective, and the optimizer buys. If $\rho > \lambda^\star$, it does not, and the softened answer is the hard one. The sweep shows exactly this: the behavior flips between $\rho/\lambda^\star = 0.90$ and $1.01$.
:::

::: check
The exact penalty means the QP is always feasible. Does that mean the closed loop is always safe?
:::

::: answer
No, and mixing the two up is a serious error. *Feasible* means the solver always has something to return. *Safe* means the vehicle stays inside its envelope.

A softened formulation will happily return a plan that breaks the state constraint when it must — that is precisely what makes it always feasible — and the vehicle then flies outside its envelope while paying the penalty. What softening guarantees is that you get a command, that it is the minimum-violation command for the chosen weights, and that the slack tells you how far outside you are.

Safety must come from elsewhere: margin in the constraint values, a robust formulation that plans for the disturbance in advance, and an independent monitor with the authority to change mode. The kick example is the honest picture: the vehicle was over its speed limit for $0.4\,\mathrm{s}$, and the controller did the best that physics allowed.
:::

## Summary

| Idea | In one line |
| --- | --- |
| Input constraints | Box, rate $\lvert\mathbf{u}_k - \mathbf{u}_{k-1}\rvert \le \Delta u_{\max}$, polytopic $\mathbf{G}_u\mathbf{u} \le \mathbf{h}_u$, norm (SOCP). Always kept hard |
| State constraints | Speed limits, glide slope, corridor, rate limits, loads, keep-out zones; predictions, not physics |
| Infeasibility | From $(2, -0.8)$ with $\lvert x_2\rvert \le 0.5$: $x_{2,1} \in [-0.9, -0.7]$, so no feasible plan exists |
| Softening | $\mathbf{g}^\top\mathbf{x}_k \le h + s_k$, $s_k \ge 0$, penalty $\rho\sum_k s_k$ |
| Exact penalty | $\rho > \lambda^\star$ gives back the hard solution; measured switch between $0.90\lambda^\star$ and $1.01\lambda^\star$, $\lambda^\star = 5.6937$ |
| Shared slack | One slack for all steps: threshold becomes $\sum_k \lambda_k^\star$ ($\approx 55.6$ here) |
| Quadratic penalty | Leftover violation $\lambda^\star/(2\sigma)$, never zero: $0.00281$ measured at $\sigma = 1000$ against $0.00285$ predicted |
| Practical form | $\rho s_k + \sigma s_k^2$: straight-line term enforces, squared term smooths |
| Choosing $\rho$ | Largest multiplier over the dispersion campaign, times two to ten; oversized $\rho$ cost $12 \to 46$ iterations |
| Recovery example | $-0.4\,\mathrm{m/s}$ kick: slack $0.6 \to 0$, back inside the limit in $0.4\,\mathrm{s}$, the physical minimum |
| Not a safety argument | Always feasible is not always safe; pair with margin, robust design, a monitor and a fallback law |

The next lesson asks a different question: even when every QP is solvable, is the closed loop *stable*? The answer needs two new pieces, the terminal cost and the terminal set, and a short proof that uses both.

::: context polytope-word What a polytope is
A **polytope** is the higher-dimensional cousin of a polygon: a region with flat faces and straight edges, like a box, a pyramid or a cut gemstone. Each flat face is one linear inequality — "this combination of the numbers must stay below that value". Stack the inequalities as rows of $\mathbf{G}\mathbf{u} \le \mathbf{h}$ and the region they all agree on is the polytope.

Flat faces are what QP solvers are built for. A curved boundary, like a circle, needs a different kind of solver or an approximation made of flat faces.
:::

::: context cone-vs-polygon A circle, and a polygon inside it
A thrust-magnitude limit $\|\mathbf{u}\|_2 \le u_{\max}$ is a disk in two dimensions — in the language of optimization, a **second-order cone** (stack the disks for every value of $u_{\max}$ and you get an ice-cream cone). A QP cannot take a curved limit, so engineers often fit a regular polygon inside the disk. Each side is one linear row.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <circle cx="90" cy="100" r="70" fill="#fff" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="160,100 139.5,50.5 90,30 40.5,50.5 20,100 40.5,149.5 90,170 139.5,149.5" fill="#8fb8f0" fill-opacity="0.5" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="90" y1="100" x2="149.75" y2="75.25" stroke="#b4232c" stroke-width="2"/>
  <line x1="90" y1="100" x2="90" y2="30" stroke="#1f2a44" stroke-width="1" stroke-dasharray="4 3"/>
  <circle cx="90" cy="100" r="3" fill="#1f2a44"/>
  <text x="185" y="45" font-size="12" fill="#1d6fd1">circle: |u| ≤ u_max</text>
  <text x="185" y="75" font-size="12" fill="#1f2a44">octagon: 8 linear rows</text>
  <text x="185" y="105" font-size="12" fill="#b4232c">flat side sits at 0.924 u_max</text>
  <text x="185" y="135" font-size="12" fill="#1f2a44">so up to 7.6% of the</text>
  <text x="185" y="152" font-size="12" fill="#1f2a44">thrust is given up</text>
</svg>
```

For an octagon, the middle of each flat side is $\cos(22.5^\circ) \approx 0.924$ of the way out, so you give up at most about $7.6\,\%$ of the thrust. More sides give up less, at the cost of more rows.
:::

::: context glide-slope Why landers keep above a cone
Picture an ice-cream cone standing upside down on the landing pad, tip touching the ground. A glide-slope constraint says the vehicle must stay inside it. Far from the pad you may be low; close in, you must be high enough. That keeps the vehicle clear of rocks and crater rims on the way in, and keeps its engine plume from blasting the ground sideways. The angle $\gamma$ ("gamma") sets how wide the cone opens. Convex powered-descent guidance for reusable landers and Mars landers uses exactly this kind of cone as a state constraint.
:::

::: context infeasibility-certificate How a solver proves "impossible"
Saying "I could not find a plan" is weak — maybe you did not look hard enough. Saying "no plan exists, and here is why" is strong. A **certificate of infeasibility** is the strong version. It is a set of nonnegative weights on the constraints such that adding up the weighted constraints gives a plain contradiction, like $0 \le -1$. Anyone can check it with a few multiplications.

For the warning's example the certificate is almost obvious: the speed row at step one says $x_{2,1} \ge -0.5$, the dynamics say $x_{2,1} = -0.8 + 0.1u_0$, and the thruster row says $u_0 \le 1$. Put them together and you get $-0.5 \le -0.7$. That is false, so no plan exists.
:::

::: context slack-word Where "slack" comes from
Think of a rope tied between two posts. Pulled tight, it has no slack. Let it sag and there is slack: extra length that is not being used. In optimization, a **slack variable** is the extra room in an inequality. In this lesson it means the amount by which we let a constraint sag past its limit. When the slack is zero the constraint is tight, exactly as if it were hard.
:::

::: context shadow-price A multiplier is a price tag
Economists call a Lagrange multiplier a **shadow price**. Picture a bakery limited to $100\,\mathrm{kg}$ of flour a day. If one more kilogram would let it earn $3$ dollars more profit, the flour limit's shadow price is $3$ dollars per kilogram. Offer it flour for $2$ dollars a kilogram and it buys; ask $4$ and it does not.

The exact penalty is that deal. $\lambda^\star$ is what one more unit of speed allowance is worth to the optimizer. $\rho$ is what you charge for it. Charge more than it is worth and it never buys.
:::

::: context kick-recovery The kick, drawn
Speed $x_2$ against time around the kick. The dashed red line is the $-0.5\,\mathrm{m/s}$ limit. The kick (orange) drops the speed to $-0.9$. Four samples of full braking climb back in steps of $0.1\,\mathrm{m/s}$, and the vehicle rejoins the limit at $t = 2.4\,\mathrm{s}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="30" x2="335" y2="30" stroke="#6c7a93" stroke-width="1"/>
  <line x1="40" y1="30" x2="40" y2="185" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="105" x2="335" y2="105" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="6 4"/>
  <polyline points="50,105 80,105 110,105 140,105" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="140" y1="105" x2="140" y2="165" stroke="#f2b880" stroke-width="3"/>
  <polyline points="140,165 170,150 200,135 230,120 260,105 290,105 320,105" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <g fill="#1d6fd1">
    <circle cx="140" cy="165" r="3"/><circle cx="170" cy="150" r="3"/><circle cx="200" cy="135" r="3"/><circle cx="230" cy="120" r="3"/><circle cx="260" cy="105" r="3"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="36" y="34">0</text><text x="36" y="109">−0.5</text><text x="36" y="184">−1.0</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="200">1.7</text><text x="140" y="200">2.0</text><text x="260" y="200">2.4</text><text x="320" y="200">2.6 s</text>
  </g>
  <text x="148" y="180" font-size="11" fill="#1f2a44">kick: −0.9 m/s</text>
  <text x="262" y="96" font-size="11" fill="#b4232c">limit</text>
</svg>
```
:::

::: context telemetry-word What telemetry is
**Telemetry** is the stream of numbers a vehicle radios home about itself: temperatures, voltages, attitude, and flags from the flight software. Ground engineers watch it live and dig through it after something odd happens. A good telemetry item answers a question before anyone has to ask it. "Solver failed" says something broke. "Speed limit exceeded by $0.3\,\mathrm{m/s}$ for the next three steps" says what broke, by how much and for how long.
:::

::: context penalty-shapes Why the straight-line charge wins
The picture shows, for a slack $s \ge 0$, what violation *saves* (grey line, slope $\lambda^\star$) against what it *costs* under two charges. The straight-line charge $\rho s$ (blue) is steeper than the saving from the very start, so the best slack is zero. The squared charge $\sigma s^2$ (red) is flat at zero, so for small $s$ it costs less than it saves. The optimizer buys violation up to where saving minus cost is largest, at $s = \lambda^\star/(2\sigma)$ — here a third of the way along.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="180" x2="320" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="180" x2="40" y2="30" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="318" y="198" font-size="12" text-anchor="end" fill="#1f2a44">slack s</text>
  <text x="46" y="36" font-size="12" fill="#1f2a44">cost or saving</text>
  <line x1="40" y1="180" x2="320" y2="120" stroke="#6c7a93" stroke-width="2"/>
  <line x1="40" y1="180" x2="320" y2="60" stroke="#1d6fd1" stroke-width="2.5"/>
  <path d="M40,180 Q180,180 320,90" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <line x1="133.3" y1="170" x2="133.3" y2="160" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="133.3" cy="170" r="3" fill="#b4232c"/>
  <text x="324" y="64" font-size="12" fill="#1d6fd1">ρ s</text>
  <text x="324" y="94" font-size="12" fill="#b4232c">σ s²</text>
  <text x="324" y="124" font-size="12" fill="#6c7a93">λ* s</text>
  <text x="100" y="140" font-size="11" fill="#1f2a44">squared charge stops</text>
  <text x="100" y="154" font-size="11" fill="#1f2a44">here: s = λ*/(2σ) &gt; 0</text>
</svg>
```
:::

::: context dispersion-campaign Thousands of flights before the first one
Before a guidance system flies, engineers fly it thousands of times in simulation. Each run scatters the uncertain things — engine performance, mass, wind, sensor errors, starting state — across their expected ranges. This is a **dispersion campaign**, also called a Monte Carlo campaign after the casino, because the scattering is done with random numbers. It is where the largest multiplier, the worst solve time and the tightest margin are found — the numbers a design review wants to see.
:::
