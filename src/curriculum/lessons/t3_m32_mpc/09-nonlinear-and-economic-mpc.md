---
id: l09-nonlinear-and-economic-mpc
title: Nonlinear MPC and economic MPC
minutes: 24
covers:
  - Nonlinear MPC
  - Economic MPC
---

A flat paper map works fine for your town. Use it for a whole continent and the distances start to lie, because the Earth is round. And a route planner that always picks the *shortest* road may send you down a toll road, when what you cared about was money.

So far everything has been linear-quadratic: a linear model (the flat map) and a quadratic cost measuring distance from a setpoint (the shortest route). That pair makes the online problem a QP and gives the last four lessons' guarantees. Now we relax each half.

**Nonlinear MPC** keeps the cost and swaps in the real model. You need it when the dynamics are not close enough to linear over the horizon — a large attitude slew, an ascent through changing dynamic pressure, relative motion over kilometers, a vehicle whose mass drops by a third during the burn — or when a constraint is not convex, which a keep-out zone never is.

**Economic MPC** keeps the model and swaps in the cost you actually care about: propellant, energy, thermal margin, money. That breaks the stability theory, which needs the stage cost to be positive definite about the setpoint. Both fly; for both, ask what you gave up and what you put in its place.

## When linear prediction stops being enough

Test a linear model by measuring its error over your horizon against a propagation you trust.

::: example How wrong Clohessy–Wiltshire gets
The **[[Clohessy–Wiltshire equations|cw-history]]** (CW) linearize one spacecraft's motion relative to another about a circular reference orbit. They are the standard model for rendezvous MPC; the relative-motion module derives them.

Put a target on a circular orbit of radius $a = 6778\,\mathrm{km}$ (about $400\,\mathrm{km}$ up, period $92.6\,\mathrm{min}$) and a chaser some distance directly along-track. Propagate both for one orbit with an exact two-body integrator, express the chaser in the target's local frame, and compare with the CW prediction from the same start:

| along-track offset | CW prediction | two-body truth | position error | error as a fraction of the offset |
| --- | --- | --- | --- | --- |
| $100\,\mathrm{m}$ | $100.000\,\mathrm{m}$ | $99.972\,\mathrm{m}$ | $0.028\,\mathrm{m}$ | $0.028\,\%$ |
| $1\,\mathrm{km}$ | $1000.0\,\mathrm{m}$ | $997.2\,\mathrm{m}$ | $2.78\,\mathrm{m}$ | $0.28\,\%$ |
| $10\,\mathrm{km}$ | $10000\,\mathrm{m}$ | $9721.9\,\mathrm{m}$ | $278\,\mathrm{m}$ | $2.78\,\%$ |
| $50\,\mathrm{km}$ | $50000\,\mathrm{m}$ | $43047\,\mathrm{m}$ | $6953\,\mathrm{m}$ | $13.9\,\%$ |

Ten times the offset gives a hundred times the error: $0.028 \to 2.78 \to 278$. The error grows as the **[[square of the separation|quadratic-error]]**, because the terms CW drops are second order.

So it is negligible in the last hundred meters of a docking and dominant at fifty kilometers. Inside a kilometer, over horizons of minutes rather than orbits, linear MPC on the CW model is the right tool and a nonlinear model buys nothing. For a far-field phasing maneuver it is the wrong tool. Then you choose between a nonlinear model and a linear one **relinearized** often enough that its error stays inside your margin.

Most flight software takes that last option: refresh the linearization every cycle about the current state and previous plan. The prediction becomes **linear time-varying**; the problem stays a QP with new matrices each cycle, at the cost of rebuilding them and losing the time-invariance the stability proofs assumed.
:::

## The nonlinear problem

Write the true dynamics as $\mathbf{x}_{k+1} = \mathbf{f}(\mathbf{x}_k, \mathbf{u}_k)$ and the constraints as $\mathbf{g}(\mathbf{x}_k,\mathbf{u}_k) \le \mathbf{0}$, with $\mathbf{f}$ and $\mathbf{g}$ any smooth functions. The finite-horizon problem is now a **nonlinear program** (NLP). Three ways of setting it up matter.

**[[Single shooting|shooting]]** removes the states, as the condensed formulation does, by integrating the dynamics forward from $\mathbf{x}_0$; only the inputs are variables. It is compact. But for an unstable plant it inherits the exponential sensitivity that ruins the condensed linear formulation — worse now, because the integration is nonlinear.

**Multiple shooting** keeps the state at each step (each **node**) as a variable and adds the dynamics as equality constraints. That is the sparse formulation's structure: larger, much better conditioned, banded — and you can start the solver from a state trajectory you believe in, which matters enormously for convergence.

**Collocation** writes the state as a polynomial on each interval and enforces the dynamics at chosen **collocation points** inside it. The result is a large, very sparse NLP, standard in trajectory optimization and the usual choice when the dynamics are **stiff** (fast and slow motions mixed) or the time grid is coarse.

The solvers come from the optimization module: **sequential quadratic programming** (SQP), which solves a QP approximation each iteration, and interior-point NLP methods.

In MPC, each cycle's problem is a small nudge of the last one's. That motivates the **[[real-time iteration|rti]]** scheme of Diehl and co-workers: do exactly *one* SQP iteration per sample, warm-started from the previous solution, and apply its first input. The controller never solves the NLP to convergence; it tracks the moving solution with one Newton step per cycle. A contraction argument backs it: the tracking error stays bounded if the solution moves slowly compared with how fast a Newton step closes the gap. This is what runs nonlinear MPC at kilohertz rates in the `acados` and ACADO software.

::: key Nonlinear MPC
Replace the linear model by $\mathbf{x}_{k+1} = \mathbf{f}(\mathbf{x}_k,\mathbf{u}_k)$ and the finite-horizon problem becomes a nonlinear program, solved by SQP or an interior-point NLP method — in flight, usually by one warm-started SQP iteration per sample (the real-time iteration). You keep the prediction accuracy and give up global optimality, the optimality and infeasibility certificates, and the a priori iteration bound.
:::

::: warning What nonlinear MPC gives up
Four guarantees go at once. Name them, so nobody is surprised in a review.

- **Global optimality.** The solver returns a **[[local minimum|local-minimum]]**, and which one depends on the starting guess.
- **The certificate.** A convex solver proves optimality or infeasibility. A nonlinear solver does neither, so "infeasible" may mean "this solver found no point", not "no point exists".
- **The iteration bound.** SQP iteration counts vary tenfold with the starting guess, which destroys the worst-case timing argument certification needs.
- **Feasibility of intermediate iterates.** An SQP iterate may break constraints, so a solve stopped early can return an unflyable plan — unless the formulation keeps iterates feasible.

None is fatal, but each needs an answer: a warm start from the previous cycle, a fixed iteration count with a residual monitor, a feasibility check on the returned plan before it is applied, and a certified fallback law for the cycle where the check fails.
:::

## Successive convexification, and the price of a non-convex constraint

A keep-out sphere is the classic non-convex constraint in GNC. The rule $\|\mathbf{p} - \mathbf{c}\| \ge r$ — stay at least $r$ from the center $\mathbf{c}$ — cuts a ball out of space. A set with a hole is not convex: the straight line between two allowed points can pass through the ball.

The standard fix keeps the convex solver and moves the non-convexity into an outer loop:

1. Linearize the constraint about the previous trajectory. This gives a **[[separating hyperplane|keepout-plane]]**: a flat wall tangent to the sphere, on the side the previous solution was on.
2. Solve the resulting convex problem.
3. Relinearize about the new solution and repeat, usually with a **trust region** that keeps each step near where the linearization is accurate.

This is **[[successive convexification|scvx]]**, the idea behind SCvx and the sequential convex programming used for powered descent with non-convex pointing constraints.

::: example Two initial guesses, two answers
A planar transfer: a double integrator in two axes, $\Delta t = 1\,\mathrm{s}$, $N = 20$ steps, from $(-10, 0)\,\mathrm{m}$ at rest to $(10, 0)\,\mathrm{m}$ at rest. Each axis's acceleration is limited to $0.35\,\mathrm{m/s^2}$, and the cost is control energy, $\sum_k\|\mathbf{u}_k\|^2$. A keep-out disc of radius $3\,\mathrm{m}$ is centered at $(0, -1)\,\mathrm{m}$, so the straight path along $y = 0$ passes $1\,\mathrm{m}$ from the center and is not allowed.

At each iteration the keep-out constraint at step $k$ becomes the half-space

$$
\mathbf{n}_k^\top(\mathbf{p}_k - \mathbf{c}) \ge r,
$$

with $\mathbf{n}_k$ the unit vector from the disc center toward the previous iterate's position at step $k$.

- From a reference bowed *above* the obstacle, the iteration converges in two passes — the second reproduces the first to machine precision — to a path with $\Delta v = \sum_k\|\mathbf{u}_k\|\Delta t = 3.447\,\mathrm{m/s}$ and a closest approach of exactly $3.0000\,\mathrm{m}$.
- From a reference bowed *below*, it converges as cleanly to a different path, also grazing the disc, with $\Delta v = 4.201\,\mathrm{m/s}$.

Both are valid local solutions. The second costs $4.201 / 3.447 = 1.219$ times as much: $21.9\,\%$ more propellant. That makes sense — the center sits below the line, so underneath is the longer way around.

The convexified problem cannot tell them apart: the linearization committed to a side at the first iteration and never reconsiders. The separating hyperplane is a *choice*, not a consequence. That is what you lose by convexifying a keep-out zone: the answer depends on the initial guess, and the guarantee drops from "the global optimum, with a certificate" to "a feasible local optimum, if the iteration converges".

The engineering response: list the **homotopy classes** that matter — families of paths that cannot be bent into each other without crossing the obstacle, such as above or below, port or starboard — solve one convex problem per class from a sensible start, and pick the cheapest. With few classes and convex solves, the work is bounded and the comparison exact. Otherwise, document that the guidance is locally optimal given its starting guess, and make that guess deterministic so the same state always gives the same plan.
:::

## Economic MPC

Now keep the model linear and change the cost. In **economic MPC** the stage cost $\ell(\mathbf{x},\mathbf{u})$ is what the mission cares about — propellant mass, watt-hours, thermal margin, throughput — instead of a quadratic penalty on distance from a setpoint. The receding-horizon machinery is unchanged. What the answer means is not.

The stability theory is the first casualty. Its proof used $\ell(\mathbf{x},\mathbf{u}) \ge \lambda_{\min}(\mathbf{Q})\|\mathbf{x}\|^2$ ($\lambda_{\min}$: smallest eigenvalue) to make the value function a Lyapunov function. An economic cost has no such property. It may be lowest far from the setpoint, may ignore the state, and the best long-run behavior may not be sitting still.

The replacement theory, developed by Rawlings, Angeli, Amrit, Diehl and others, runs in three steps.

**Step 1: the best steady state.** Minimize $\ell(\mathbf{x},\mathbf{u})$ over the **equilibria** $\mathbf{x} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u}$ (where the state does not move) that satisfy the constraints. Call the winner $(\mathbf{x}_s, \mathbf{u}_s)$. Any steady way of operating must beat this benchmark.

**Step 2: dissipativity.** The system is **[[strictly dissipative|dissipativity]]** with respect to the supply rate $\ell(\mathbf{x},\mathbf{u}) - \ell(\mathbf{x}_s,\mathbf{u}_s)$ if there is a **storage function** $\lambda(\mathbf{x})$ (a function, not the eigenvalue above) with

$$
\lambda\big(\mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u}\big) - \lambda(\mathbf{x}) \le \ell(\mathbf{x},\mathbf{u}) - \ell(\mathbf{x}_s,\mathbf{u}_s) - \rho(\|\mathbf{x} - \mathbf{x}_s\|)
$$

for some positive definite $\rho$ (zero only at zero). In words: the storage can rise only by what you paid above the best steady cost, minus a definite amount whenever you are away from $\mathbf{x}_s$.

When it holds, the **rotated cost**

$$
\tilde{\ell}(\mathbf{x},\mathbf{u}) = \ell(\mathbf{x},\mathbf{u}) - \ell(\mathbf{x}_s,\mathbf{u}_s) + \lambda(\mathbf{x}) - \lambda(\mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u})
$$

satisfies $\tilde{\ell} \ge \rho(\|\mathbf{x} - \mathbf{x}_s\|)$ — rearrange the inequality — so it *is* positive definite about $(\mathbf{x}_s,\mathbf{u}_s)$. The economic and rotated problems have the same minimizers, so the whole previous theory applies to the rotated one. For a linear plant with a convex quadratic-plus-linear economic cost, $\lambda$ can be taken linear and found by a small convex program.

::: note Why rotating the cost does not change the answer
Add up the extra terms of $\tilde{\ell}$ along a plan $\mathbf{x}_0, \dots, \mathbf{x}_N$:

$$
\sum_{k=0}^{N-1}\big(\lambda(\mathbf{x}_k) - \lambda(\mathbf{x}_{k+1})\big) = \lambda(\mathbf{x}_0) - \lambda(\mathbf{x}_N).
$$

Each middle term appears with a plus and a minus, so they cancel like a telescope folding up. The constant $\ell(\mathbf{x}_s,\mathbf{u}_s)$ adds $N\ell(\mathbf{x}_s,\mathbf{u}_s)$. So the two totals differ by $\lambda(\mathbf{x}_0)$, fixed by the current state; a constant; and $-\lambda(\mathbf{x}_N)$, which the usual terminal constraint $\mathbf{x}_N = \mathbf{x}_s$ (or a terminal cost rotated the same way) also fixes. Adding constants never moves a minimum, so both problems pick the same inputs.
:::

**Step 3: the turnpike property.** Optimal economic paths spend most of a long horizon near $(\mathbf{x}_s,\mathbf{u}_s)$, leaving only at the ends — like a road trip that gets onto the highway fast and exits near the destination. This **[[turnpike|turnpike]]** behavior is what makes economic MPC sensible at all: the plan is "leave the current state, sit at the economic optimum, do something specific at the end", and the receding horizon keeps re-deciding the leaving part.

When dissipativity fails, the economic optimum is not a steady state. It is a **cycle**, and it can beat every steady state. That is not a flaw to tune away; for many aerospace problems it is the right answer. Knowing [[where each kind belongs|where-each-belongs]] is half the design.

::: key Economic MPC
The stage cost is the mission objective — propellant, energy, money — not a distance from a setpoint, so $V_N^0$ is not automatically a Lyapunov function. Under strict dissipativity with respect to the supply rate $\ell(\mathbf{x},\mathbf{u}) - \ell(\mathbf{x}_s,\mathbf{u}_s)$, the rotated cost $\tilde{\ell} = \ell - \ell(\mathbf{x}_s,\mathbf{u}_s) + \lambda(\mathbf{x}) - \lambda(\mathbf{x}^+)$ is positive definite about the best steady state, the two problems have the same minimizers, and the standard stability theory applies to the rotated one.
:::

::: example Station keeping: propellant against precision
One axis, a double integrator, with a known periodic disturbance acceleration of amplitude $0.002\,\mathrm{m/s^2}$ and period $200\,\mathrm{s}$ — the shape of a gravity-gradient or solar-pressure cycle. The vehicle must stay in a **[[dead-band|dead-band]]** $|x_1| \le 1\,\mathrm{m}$, with the thruster limited to $0.05\,\mathrm{m/s^2}$, $T_s = 1\,\mathrm{s}$, and a $40$-step horizon with the disturbance known over it.

Uncontrolled, it would swing with amplitude $a/\omega^2$, where $\omega = 2\pi/200 = 0.0314\,\mathrm{rad/s}$: $0.002 / 0.0314^2 = 2.03\,\mathrm{m}$. That is twice the dead-band, so holding it takes propellant.

Two controllers, same plant, same constraints, run for $400\,\mathrm{s}$:

| controller | stage cost | $\Delta v$ over $400\,\mathrm{s}$ | samples with a burn | max $\lvert x_1\rvert$ | rms $\lvert x_1\rvert$ |
| --- | --- | --- | --- | --- | --- |
| economic | $\sum_k \lvert u_k\rvert$ | $0.2939\,\mathrm{m/s}$ | $249$ of $400$ | $1.0000\,\mathrm{m}$ | $0.600\,\mathrm{m}$ |
| tracking | $\sum_k (\mathbf{x}_k^\top\mathbf{Q}\mathbf{x}_k + Ru_k^2)$, $\mathbf{Q} = \mathbf{I}$, $R = 0.1$ | $0.5093\,\mathrm{m/s}$ | $396$ of $400$ | $0.0000\,\mathrm{m}$ | $0.000\,\mathrm{m}$ |

The tracking controller holds position at zero to four decimals and pays $0.5093\,\mathrm{m/s}$. Check it: canceling the disturbance outright takes $\int|d|\,dt$, and the average of $|\sin|$ is $2/\pi$, so $0.002 \times 400 \times 2/\pi = 0.5093\,\mathrm{m/s}$. It matches.

The economic controller rides the dead-band edge, holding $|x_1| \le 1.0000\,\mathrm{m}$ exactly, and spends $1 - 0.2939/0.5093 = 42\,\%$ less propellant.

Nothing was tuned: each cost got what it asked for. The saving is propellant the tracking controller spent on accuracy the mission never requested — the whole argument for economic MPC, and its warning.
:::

::: warning An economic optimum lives on the constraints
The tracking error is small because the cost pushes it there. The economic error sits at the limit, because propellant is all it minimizes and the dead-band is all that stops it. Every margin hidden inside a tracking cost must now be written down as a constraint, or the optimizer will spend it.

First, constraints in an economic formulation need the full treatment of the constraints lesson — softened so the problem stays solvable, with penalty weights above the exact threshold — and tightening for the disturbance as in the robust lesson, because a plan that rides the limit has no room for one. Second, the review question changes from "is the tracking error acceptable?" to "is every limit that matters actually in the problem?" — including ones nobody wrote down: thruster cycle counts, the **[[minimum impulse bit|min-impulse-bit]]**, the sensor's tolerance for motion, the plume geometry at the moment of the burn.
:::

## Check yourself

::: check
The CW error table shows $2.78\,\%$ at $10\,\mathrm{km}$ after one orbit. Your rendezvous MPC uses a $10$-minute horizon at a $5\,\mathrm{km}$ separation. Do you need nonlinear MPC?
:::

::: answer
Probably not; redo the measurement at *your* horizon, not one orbit. The table's errors build up over $92.6$ minutes; ten minutes is about a ninth of that, and the error grows with the angle propagated. Scaling from the $10\,\mathrm{km}$ row, half the offset cuts the quadratic error by about four, and the shorter propagation cuts it further, so expect meters, not hundreds of meters. (The same two-body comparison gives about $1.35\,\mathrm{m}$.)

Compare that with your constraint margins (corridor width, keep-out standoff) and the navigation error, which may be larger. If the model error is a small fraction of both, relinearized linear MPC is right and keeps the convex solver's guarantees.
:::

::: check
Why does the separating-hyperplane treatment of a keep-out zone keep the previous iterate feasible, and why does that matter?
:::

::: answer
The plane touches the sphere at the point nearest the previous trajectory, with its normal pointing from the center toward it. So the previous iterate lies on the correct side, at least $r$ from the center along that normal. The convex subproblem is therefore feasible whenever the previous trajectory was, and the iteration cannot fail for lack of a starting point.

That matters because a scheme that produced an infeasible subproblem could not recover: the outer loop would stop with nothing to apply. The half-space also lies *inside* the true allowed region — a conservative inner approximation of the outside of the ball — so every subproblem solution satisfies the true non-convex constraint. It is tight only near the linearization point, hence the trust region.
:::

::: check
Explain why an economic MPC can be asymptotically stable about a steady state even though its stage cost is not positive definite there.
:::

::: answer
Through the rotated cost. Strict dissipativity supplies a storage function $\lambda$, and adding the telescoping term $\lambda(\mathbf{x}) - \lambda(\mathbf{x}^+)$ to the economic stage cost gives a $\tilde{\ell}$ that *is* positive definite about the best steady state. Because the term telescopes, the horizon total changes only by boundary terms, so the rotated problem has the same optimal inputs: the controller is unchanged.

The rotated problem meets the standard stability theorem's conditions, so its value function is a Lyapunov function and the loop is asymptotically stable about $(\mathbf{x}_s, \mathbf{u}_s)$ — a conclusion the economic controller inherits. Without strict dissipativity there is no rotation, and the loop may settle into a periodic orbit genuinely better than any steady state.
:::

::: check
Your economic station-keeping controller saves $42\,\%$ of propellant, and the reviewer objects that the vehicle now spends its life at the edge of the dead-band. Answer the objection.
:::

::: answer
Agree with the observation, dispute the implication. Riding the limit is correct for the stated problem: the dead-band is the specification and propellant the cost, so unused margin is wasted propellant.

The objection really says the specification is incomplete. If there is a reason to keep off the edge — navigation uncertainty, a sensor field of view, plume impingement, thermal pointing — it is a constraint or a cost term and belongs in the problem: tighten the dead-band by the navigation three-sigma, add a small quadratic term on position, or impose a robust tightening as the tube lesson does. Never choose a tracking cost to get margin by accident: then nobody knows how much margin there is or what it cost.
:::

::: check
A nonlinear MPC using the real-time iteration performs one SQP iteration per cycle. What has to be true for that to work, and how would you detect that it has stopped working?
:::

::: answer
The solution must move slowly compared with the Newton contraction. Each iteration shrinks the distance to the exact solution; the state moving between cycles pushes the solution away. Contraction must outrun drift, which needs a sample rate fast relative to the dynamics, a good warm start (the previous solution shifted), and no sudden change in the active set or the reference.

Detect trouble through residuals: after the single iteration, monitor the KKT residual norm, the constraint violation of the returned plan, and the step size. A residual growing over several cycles means it is losing the solution, typically after a disturbance, mode change or reference step. Responses: extra iterations on those cycles if the budget allows, re-initializing from a stored nominal trajectory, and a certified fallback law if the plan fails its feasibility check.
:::

## Summary

| Object | Statement |
| --- | --- |
| Nonlinear MPC | $\mathbf{x}_{k+1} = \mathbf{f}(\mathbf{x}_k,\mathbf{u}_k)$, $\mathbf{g}(\mathbf{x}_k,\mathbf{u}_k) \le \mathbf{0}$: a nonlinear program each cycle |
| CW error | One orbit: $0.028\,\%$ at $100\,\mathrm{m}$, $0.28\,\%$ at $1\,\mathrm{km}$, $2.78\,\%$ at $10\,\mathrm{km}$, $13.9\,\%$ at $50\,\mathrm{km}$; grows as separation squared |
| Discretization | Single shooting (compact, ill-conditioned), multiple shooting (sparse, banded), collocation (very sparse) |
| Real-time iteration | One warm-started SQP iteration per sample; tracks the moving solution instead of converging |
| What is lost | Global optimality, the certificate, the iteration bound, feasibility of intermediate iterates |
| Successive convexification | Keep-out sphere becomes a tangent half-space facing the previous iterate |
| Local optima | Same problem, two starting guesses: $\Delta v = 3.447$ against $4.201\,\mathrm{m/s}$, both grazing the $3\,\mathrm{m}$ disc |
| Economic MPC | $\ell$ is propellant, energy or money; no positive definiteness about a setpoint |
| Best steady state | $\min \ell$ over admissible equilibria, giving $(\mathbf{x}_s,\mathbf{u}_s)$ |
| Rotated cost | $\tilde{\ell} = \ell - \ell(\mathbf{x}_s,\mathbf{u}_s) + \lambda(\mathbf{x}) - \lambda(\mathbf{x}^+)$ positive definite under strict dissipativity |
| Turnpike | Optimal long-horizon paths sit near $(\mathbf{x}_s,\mathbf{u}_s)$ except at the ends |
| Station-keeping result | Economic $0.2939\,\mathrm{m/s}$ against tracking $0.5093\,\mathrm{m/s}$, a $42\,\%$ saving, at $\lvert x_1\rvert \le 1\,\mathrm{m}$ |
| Warning | The economic optimum rides the constraints; write every margin as a constraint |

The next lesson returns to the flight computer: what it takes to run any of this inside a control frame, and what a certification argument for an onboard optimizer looks like.

::: context cw-history Two equations with a long history
George Hill wrote down the same linearized equations in 1878 while studying the Moon's motion, which is why they are also called Hill's equations. W. H. Clohessy and R. S. Wiltshire rederived them in 1960 for a very practical question — how to guide one satellite to meet another — and their names stuck in the rendezvous world. They have been the standard tool for rendezvous planning ever since.
:::

::: context quadratic-error Errors that grow as the square
On a log–log plot, a quantity that grows as the square of another is a straight line of slope $2$: every factor of ten across means a factor of a hundred up. The CW errors from the table sit on that line (dashed) until the largest offset.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="150" x2="320" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="150" x2="40" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="141.1" x2="310" y2="21.1" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <g fill="#1d6fd1">
    <circle cx="40" cy="141.1" r="4"/><circle cx="130" cy="101.1" r="4"/>
    <circle cx="220" cy="61.1" r="4"/><circle cx="282.9" cy="33.2" r="4"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="166">100 m</text><text x="130" y="166">1 km</text><text x="220" y="166">10 km</text><text x="282.9" y="166">50 km</text>
  </g>
  <g font-size="11" fill="#1f2a44">
    <text x="50" y="132">0.028 m</text><text x="140" y="96">2.78 m</text><text x="228" y="56">278 m</text><text x="236" y="26">6953 m</text>
  </g>
  <text x="330" y="176" font-size="11" text-anchor="end" fill="#1f2a44">offset (log scale)</text>
</svg>
```
:::

::: context shooting Aiming a cannon, once or in pieces
The names come from firing at a target. **Single shooting** picks the inputs, fires one long shot from the start, and adjusts the aim — small changes early become huge changes late. **Multiple shooting** fires many short shots, one from each node, and then demands that each shot land where the next begins.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="10" y="18" font-size="12" fill="#1f2a44">single</text>
  <path d="M20,55 C90,20 160,20 230,45 S320,60 340,40" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="20" cy="55" r="4" fill="#1f2a44"/>
  <text x="10" y="92" font-size="12" fill="#1f2a44">multiple</text>
  <path d="M20,130 C45,112 70,108 95,112" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <path d="M100,108 C125,100 150,100 175,106" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <path d="M180,112 C205,118 230,118 255,110" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <path d="M260,104 C285,98 310,100 335,106" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <g fill="#1f2a44"><circle cx="20" cy="130" r="4"/><circle cx="100" cy="108" r="4"/><circle cx="180" cy="112" r="4"/><circle cx="260" cy="104" r="4"/></g>
  <g fill="#b4232c"><circle cx="95" cy="112" r="3"/><circle cx="175" cy="106" r="3"/><circle cx="255" cy="110" r="3"/></g>
  <text x="180" y="142" font-size="11" text-anchor="middle" fill="#b4232c">red ends must meet the next black node</text>
</svg>
```

The solver closes those small gaps as it converges; at the answer the pieces join into one smooth path.
:::

::: context rti One Newton step per tick
Moritz Diehl and colleagues introduced the real-time iteration in the early 2000s, first for chemical processes. The insight: a controller does not need the exact answer to a problem that will be out of date in a millisecond. It needs to stay close to a moving answer. Today the open-source `acados` toolkit generates such solvers for drones, cars and robots.
:::

::: context local-minimum Valleys in a landscape
Picture the cost as a hilly landscape and the solver as a ball rolling downhill. In a convex problem there is one valley, so the ball always finds the bottom. In a non-convex problem there can be several valleys. The ball settles in whichever one it started above — and it has no way to know whether a deeper valley exists over the next ridge.
:::

::: context keepout-plane A wall in place of a ball
The disc is replaced by a straight wall that touches it, facing the previous path. Anything on the far side of the wall is also outside the disc, so obeying the wall is safe.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <circle cx="180" cy="90" r="45" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="180" cy="90" r="3" fill="#1f2a44"/>
  <line x1="30" y1="75" x2="330" y2="75" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <line x1="119.6" y1="9.5" x2="280.6" y2="90" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="180" y1="90" x2="200.1" y2="49.8" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="210" cy="30" r="4" fill="#b4232c"/>
  <circle cx="30" cy="75" r="4" fill="#1f2a44"/><circle cx="330" cy="75" r="4" fill="#1f2a44"/>
  <text x="218" y="26" font-size="11" fill="#b4232c">previous iterate</text>
  <text x="180" y="152" font-size="11" text-anchor="middle" fill="#1f2a44">keep-out disc, r = 3 m</text>
  <text x="30" y="96" font-size="11" fill="#1f2a44">start</text>
  <text x="330" y="96" font-size="11" text-anchor="end" fill="#1f2a44">end</text>
  <text x="96" y="36" font-size="11" fill="#1d6fd1">wall</text>
</svg>
```

The dashed straight path cuts through the disc. The blue wall, tangent where the radius (black) points at the previous iterate, keeps the next plan on the upper side.
:::

::: context scvx From landing rockets to rendezvous
Behçet Açıkmeşe and colleagues showed in 2007 that some non-convex rocket-landing constraints can be convexified with no loss at all ("lossless convexification"), and later developed SCvx, a successive-convexification method with trust regions and convergence proofs. Convex landing guidance of this family (JPL's G-FOLD) was flight-tested on Masten's Xombie rocket in 2012 and 2013.
:::

::: context dissipativity A battery that can only drain
Jan Willems introduced dissipative systems in 1972, with an energy picture. The storage function $\lambda$ is like the charge in a battery; the supply rate is the power flowing in. A dissipative system can never store more than was supplied — some always leaks away as heat. "Strictly" means it leaks a definite amount whenever the system is away from its resting point, which is what forces it to settle there.
:::

::: context turnpike Why "turnpike"
Economists Dorfman, Samuelson and Solow named the effect in 1958. The fastest way to drive between two small towns far apart is often to get onto the turnpike (the highway) quickly, stay on it for most of the trip, and leave it near the end — even if the highway is not on the direct line. The best steady state plays the highway.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="130" x2="340" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="30" y1="130" x2="30" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="30" y1="80" x2="340" y2="80" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <path d="M30,25 C55,70 70,78 100,79 L270,79 C300,78 315,95 335,118" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="345" y="94" font-size="11" text-anchor="end" fill="#6c7a93">x_s</text>
  <text x="185" y="72" font-size="11" text-anchor="middle" fill="#1d6fd1">on the turnpike</text>
  <text x="40" y="22" font-size="11" fill="#1f2a44">start</text>
  <text x="330" y="145" font-size="11" text-anchor="end" fill="#1f2a44">time across the horizon</text>
</svg>
```
:::

::: context where-each-belongs Where each one belongs
Nonlinear MPC earns its place when the model error over the horizon exceeds your margin, and nowhere else; relinearized linear MPC is cheaper, certifiable and good enough for most proximity operations, attitude control away from large slews, and any short-horizon problem. Economic MPC earns its place when propellant, power or thermal margin is the real objective and tracking error only a stand-in: station keeping, momentum management, long low-thrust maneuvers, power scheduling. Reach for both on purpose; avoid both by accident.
:::

::: context dead-band A band where you do nothing
A **dead-band** is a range in which the controller is allowed to leave things alone. A home thermostat has one: it lets the room drift a degree or so before switching the heat on, so the furnace does not click on and off every minute. Spacecraft station keeping works the same way — let the position drift inside a box, and fire only to stay in it.
:::

::: context min-impulse-bit The smallest push a thruster can give
A thruster valve cannot open and shut instantly, so there is a smallest pulse it can reliably deliver: the **minimum impulse bit**. A $1\,\mathrm{N}$ thruster whose shortest reliable pulse is $10\,\mathrm{ms}$ has a minimum impulse bit of about $1 \times 0.01 = 0.01\,\mathrm{N\,s}$. An optimizer that plans tiny burns below that size is planning something the hardware cannot do — one of the limits that must be written into an economic problem explicitly.
:::
