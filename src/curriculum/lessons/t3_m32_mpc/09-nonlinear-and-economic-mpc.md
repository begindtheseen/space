---
id: l09-nonlinear-and-economic-mpc
title: Nonlinear MPC and economic MPC
minutes: 25
covers:
  - Nonlinear MPC
  - Economic MPC
---

Everything so far has been linear-quadratic: a linear prediction model and a quadratic cost measuring distance from a setpoint. That combination is what makes the online problem a quadratic program, and with it come the guarantees of the last four lessons. This lesson relaxes each half in turn.

**Nonlinear MPC** keeps the cost and replaces the model with the real one. That is unavoidable when the dynamics are not adequately linear over the horizon — a large attitude slew, an ascent through changing dynamic pressure, relative motion over kilometres, a vehicle whose mass drops by a third during the burn — or when the constraint is not convex, which a keep-out zone never is.

**Economic MPC** keeps the model and replaces the cost with the thing you actually care about: propellant mass, energy, thermal margin, revenue. The change sounds small and breaks the stability theory completely, because that theory rests on the stage cost being positive definite about the setpoint, and an economic cost is not.

Both are used in flight, both cost guarantees, and in both cases the engineering question is the same: what exactly did you give up, and what did you put in its place?

## When linear prediction stops being enough

The honest way to decide whether a linear model is adequate is to measure its error over the horizon you intend to use, against a propagation you trust.

::: example How wrong Clohessy-Wiltshire gets
The Clohessy–Wiltshire equations linearise relative orbital motion about a circular reference orbit, and they are the standard model for rendezvous MPC; their derivation and state transition matrix are the business of the relative motion and proximity operations module. Take a target on a circular orbit at $a = 6778\,\mathrm{km}$ (about $400\,\mathrm{km}$ altitude, period $92.6\,\mathrm{min}$) and a chaser displaced along-track. Propagate both vehicles for one full orbit with a two-body integrator and express the chaser in the target's local frame, then compare against the CW state-transition matrix applied to the same initial relative state:

| along-track offset | CW prediction | two-body truth | position error | error as a fraction of the offset |
| --- | --- | --- | --- | --- |
| $100\,\mathrm{m}$ | $100.000\,\mathrm{m}$ | $99.972\,\mathrm{m}$ | $0.028\,\mathrm{m}$ | $0.028\,\%$ |
| $1\,\mathrm{km}$ | $1000.0\,\mathrm{m}$ | $997.2\,\mathrm{m}$ | $2.78\,\mathrm{m}$ | $0.28\,\%$ |
| $10\,\mathrm{km}$ | $10000\,\mathrm{m}$ | $9721.9\,\mathrm{m}$ | $278\,\mathrm{m}$ | $2.78\,\%$ |
| $50\,\mathrm{km}$ | $50000\,\mathrm{m}$ | $43047\,\mathrm{m}$ | $6953\,\mathrm{m}$ | $13.9\,\%$ |

The error grows as the square of the separation — the neglected terms are second order — so it is negligible in the last hundred metres of a docking approach and dominant at fifty kilometres. For proximity operations inside a kilometre, over horizons of minutes rather than orbits, linear MPC on the CW model is the right tool and a nonlinear model buys nothing. For a far-field phasing manoeuvre it is the wrong tool, and the choice is between a nonlinear model and a linear one relinearised often enough that the error stays inside the margin you have.

That last option deserves emphasis because it is what most flight software does: keep the linear-quadratic machinery and refresh the linearisation every cycle about the current state and the previous plan. The prediction is then linear-time-varying rather than linear-time-invariant, the problem stays a quadratic program, and only the matrices change per cycle — at the cost of rebuilding them, and of losing the time-invariance the stability proofs assumed.
:::

## The nonlinear problem

With the true dynamics $\mathbf{x}_{k+1} = \mathbf{f}(\mathbf{x}_k, \mathbf{u}_k)$ and constraints $\mathbf{g}(\mathbf{x}_k,\mathbf{u}_k) \le \mathbf{0}$, the finite-horizon problem is a **nonlinear program**. Three discretisation choices matter.

**Single shooting** eliminates the states as the condensed formulation does, by integrating the dynamics forward from $\mathbf{x}_0$. The decision variables are the inputs alone. It is compact, and for an unstable plant it inherits the same exponential sensitivity that ruins the condensed linear formulation, now worse because the integration is nonlinear.

**Multiple shooting** keeps the state at each node as a variable and adds the dynamics as equality constraints — the sparse formulation's structure, and for the same reason: the problem is larger and much better conditioned, and the linear algebra stays banded. It also allows initialising with a state trajectory you believe in, which matters enormously for convergence.

**Collocation** represents the state by polynomials on each interval and enforces the dynamics at collocation points, giving a large, very sparse NLP. It is standard in trajectory optimisation and the usual choice when the dynamics are stiff or the horizon coarse.

The solvers are the ones the optimization module covered: sequential quadratic programming, which solves a QP approximation at each iteration, and interior-point methods for nonlinear programs. What is specific to MPC is that the problem at this cycle is a small perturbation of the problem at the last one, which motivates the **real-time iteration** scheme of Diehl and co-workers: perform exactly *one* SQP iteration per sample, warm-started from the previous solution, and apply its first input. The controller never solves the NLP to convergence; it tracks the moving solution with one Newton step per cycle. The scheme has a contraction argument behind it — the tracking error stays bounded if the solution moves slowly enough relative to the Newton contraction — and it is what makes nonlinear MPC run at kilohertz rates in the `acados` and ACADO implementations.

::: key Nonlinear MPC
Replace the linear model by $\mathbf{x}_{k+1} = \mathbf{f}(\mathbf{x}_k,\mathbf{u}_k)$ and the finite-horizon problem becomes a nonlinear program, solved by SQP or an interior-point NLP method — in flight, usually by one warm-started SQP iteration per sample (the real-time iteration). You keep the prediction accuracy and give up global optimality, the optimality and infeasibility certificates, and the a priori iteration bound.
:::

::: warning What nonlinear MPC gives up
Four guarantees go at once, and it is worth naming them so nobody is surprised in a review. **Global optimality**: the solver returns a local minimum, and which one depends on the initial guess. **The certificate**: a convex solver returns a proof of optimality or of infeasibility; a nonlinear solver returns neither, so "infeasible" may mean "this solver did not find a point" rather than "no point exists". **The iteration bound**: SQP iteration counts vary by an order of magnitude with the initial guess, which destroys the worst-case timing argument that certification needs. **Feasibility of intermediate iterates**: an SQP iterate may violate constraints, so an early-terminated solve can return a plan that is not flyable, unless the formulation is arranged to keep iterates feasible.

None of these is fatal — nonlinear MPC flies — but each has to be answered with something: a well-initialised warm start from the previous cycle, a fixed iteration count with a monitor on the residuals, a feasibility check on the returned plan before it is applied, and a certified fallback law for the cycle where the check fails.
:::

## Successive convexification, and the price of a non-convex constraint

A keep-out sphere is the canonical non-convex constraint in GNC: $\|\mathbf{p} - \mathbf{c}\| \ge r$ excludes a ball, and the complement of a ball is not convex. The standard treatment keeps the convex solver and moves the non-convexity into an outer loop: linearise the constraint about the previous trajectory, giving a **separating hyperplane** tangent to the sphere on the side the previous solution was on, solve the resulting convex problem, relinearise, and repeat — usually with a trust region to keep the steps honest. This is successive convexification, the same idea as SCvx and as the sequential convex programming used for powered descent with non-convex pointing constraints.

::: example Two initial guesses, two answers
A planar transfer: a double integrator in two axes with $\Delta t = 1\,\mathrm{s}$, $N = 20$ steps, from $(-10, 0)\,\mathrm{m}$ at rest to $(10, 0)\,\mathrm{m}$ at rest, with per-axis acceleration limited to $0.35\,\mathrm{m/s^2}$, minimising control energy, and a keep-out disc of radius $3\,\mathrm{m}$ centred at $(0, -1)\,\mathrm{m}$ — so the straight-line path passes $1\,\mathrm{m}$ from the centre and is excluded.

At each iteration the keep-out constraint at step $k$ is replaced by the half-space $\mathbf{n}_k^\top(\mathbf{p}_k - \mathbf{c}) \ge r$ with $\mathbf{n}_k$ the unit vector from the disc centre toward the previous iterate's position. Starting from a reference bowed *above* the obstacle, the iteration converges in two passes — the second reproduces the first to machine precision — to a trajectory with $\Delta v = 3.447\,\mathrm{m/s}$ and a closest approach of exactly $3.0000\,\mathrm{m}$. Starting from a reference bowed *below*, it converges as cleanly as before to a different trajectory, also touching the disc exactly, with $\Delta v = 4.201\,\mathrm{m/s}$.

Both are valid local solutions, both satisfy every constraint, and the second costs $21.9\,\%$ more propellant. Nothing in the convexified problem can tell them apart, because the linearisation committed to a side at the first iteration and never reconsiders it — the separating hyperplane is a *choice*, not a consequence. What you lose by convexifying a keep-out zone is exactly this: the answer is now a function of the initial guess, and the guarantee degrades from "the global optimum, with a certificate" to "a feasible local optimum, if the iteration converges".

The engineering response is not to pretend otherwise. Enumerate the homotopy classes that matter — above or below, port or starboard — solve one convex problem per class from a sensible initialisation, and pick the cheapest; the count is small for real geometries and each solve is convex, so the total work is bounded and the comparison is exact. Where that is impractical, state in the design documentation that the guidance returns a locally optimal trajectory conditioned on the initialisation, and make sure the initialisation is deterministic, so the same state always produces the same plan.
:::

## Economic MPC

Now keep the model linear and change the cost. In **economic MPC** the stage cost $\ell(\mathbf{x},\mathbf{u})$ is the quantity the mission cares about — propellant mass, watt-hours, thermal margin, throughput — rather than a quadratic penalty on the distance from a setpoint. The receding-horizon machinery is unchanged; the interpretation of the answer is not.

The first casualty is the stability theory. Every step of the terminal-ingredient proof used $\ell(\mathbf{x},\mathbf{u}) \ge \lambda_{\min}(\mathbf{Q})\|\mathbf{x}\|^2$, positive definite about the setpoint, to turn the value function into a Lyapunov function. An economic cost has no such property: it may be lowest far from the setpoint, it may be indifferent to the state entirely, and the optimal long-run behaviour may not be an equilibrium at all.

The theory that replaces it, developed by Rawlings, Angeli, Amrit, Diehl and others, runs in three steps.

**The best steady state.** Minimise $\ell(\mathbf{x},\mathbf{u})$ over the equilibria $\mathbf{x} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u}$ satisfying the constraints; call the minimiser $(\mathbf{x}_s, \mathbf{u}_s)$. This is the benchmark any steady operating point must beat.

**Dissipativity.** The system is *strictly dissipative* with respect to the supply rate $\ell(\mathbf{x},\mathbf{u}) - \ell(\mathbf{x}_s,\mathbf{u}_s)$ if there is a storage function $\lambda(\mathbf{x})$ with

$$
\lambda\big(\mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u}\big) - \lambda(\mathbf{x}) \le \ell(\mathbf{x},\mathbf{u}) - \ell(\mathbf{x}_s,\mathbf{u}_s) - \rho(\|\mathbf{x} - \mathbf{x}_s\|)
$$

for some positive definite $\rho$. When it holds, the **rotated cost** $\tilde{\ell}(\mathbf{x},\mathbf{u}) = \ell(\mathbf{x},\mathbf{u}) - \ell(\mathbf{x}_s,\mathbf{u}_s) + \lambda(\mathbf{x}) - \lambda(\mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u})$ *is* positive definite about $(\mathbf{x}_s,\mathbf{u}_s)$, the economic problem and the rotated problem have the same minimisers, and the whole of the previous theory applies to the rotated problem. For a linear plant with a convex quadratic-plus-linear economic cost, $\lambda$ can be taken linear and found by a small convex program.

**The turnpike property.** Optimal economic trajectories spend the bulk of a long horizon near $(\mathbf{x}_s,\mathbf{u}_s)$, departing only at the ends. That is what makes economic MPC behave sensibly at all: the optimal plan is "leave the current state, sit at the economic optimum, do something specific at the end", and the receding horizon keeps re-deciding the leaving part.

When dissipativity fails, the honest conclusion is that the economic optimum is not a steady state — it is a **cycle**, and it can beat every steady state. That is not a pathology to be tuned away; for many aerospace problems it is the right answer.

::: key Economic MPC
The stage cost is the mission objective — propellant, energy, money — not a distance from a setpoint, so $V_N^0$ is not automatically a Lyapunov function. Under strict dissipativity with respect to the supply rate $\ell(\mathbf{x},\mathbf{u}) - \ell(\mathbf{x}_s,\mathbf{u}_s)$, the rotated cost $\tilde{\ell} = \ell - \ell(\mathbf{x}_s,\mathbf{u}_s) + \lambda(\mathbf{x}) - \lambda(\mathbf{x}^+)$ is positive definite about the best steady state, the two problems have the same minimisers, and the standard stability theory applies to the rotated one.
:::

::: example Station keeping: propellant against precision
A single axis with a known periodic disturbance acceleration of amplitude $0.002\,\mathrm{m/s^2}$ and period $200\,\mathrm{s}$ — the shape of a gravity-gradient or solar-pressure cycle — a dead-band of $|x_1| \le 1\,\mathrm{m}$, a thruster limited to $0.05\,\mathrm{m/s^2}$, $T_s = 1\,\mathrm{s}$ and a $40$-step horizon with the disturbance previewed over it. Left uncontrolled the vehicle would oscillate with amplitude $a/\omega^2 = 2.03\,\mathrm{m}$, so the dead-band cannot be held for free.

Two controllers, identical plant, identical constraints, run for $400\,\mathrm{s}$:

| controller | stage cost | $\Delta v$ over $400\,\mathrm{s}$ | samples with a burn | max $\lvert x_1\rvert$ | rms $\lvert x_1\rvert$ |
| --- | --- | --- | --- | --- | --- |
| economic | $\sum_k \lvert u_k\rvert$ | $0.2939\,\mathrm{m/s}$ | $249$ of $400$ | $1.0000\,\mathrm{m}$ | $0.600\,\mathrm{m}$ |
| tracking | $\sum_k (\mathbf{x}_k^\top\mathbf{Q}\mathbf{x}_k + Ru_k^2)$ | $0.5093\,\mathrm{m/s}$ | $396$ of $400$ | $0.0000\,\mathrm{m}$ | $0.000\,\mathrm{m}$ |

The tracking controller holds the position at zero to four decimal places and pays $0.5093\,\mathrm{m/s}$ for it — which is exactly $\int|d|\,dt = 0.002 \times 400 \times 2/\pi = 0.5093\,\mathrm{m/s}$, the impulse needed to cancel the disturbance outright. The economic controller rides the dead-band edge, holds $\lvert x_1\rvert \le 1.0000\,\mathrm{m}$ exactly as required, and spends $42\,\%$ less propellant.

Nothing was tuned to obtain that. The quadratic cost was asked to minimise position error and did; the economic cost was asked to minimise propellant subject to a dead-band and did. The saving is the propellant the tracking controller was spending to buy accuracy that the mission never requested — which is the entire argument for economic MPC, and also the warning that comes with it.
:::

::: warning An economic optimum lives on the constraints
The tracking controller's position error is small because the cost pushes it there. The economic controller's position error is exactly at the limit, because propellant is the only thing being minimised and the dead-band is the only thing stopping it. Every margin that was implicit in a tracking cost becomes explicit — and must be written down as a constraint — or the optimiser will spend it.

Two consequences follow. Constraints in an economic formulation need the full treatment of the constraints lesson: softened so the problem stays solvable, with penalty weights chosen above the exact threshold, and tightened for the disturbance the way the robust lesson tightens them, because a plan that rides the limit has no room for a disturbance. And the review question changes from "is the tracking error acceptable?" to "is every limit that matters actually in the problem?" — including the ones nobody wrote down, such as the number of thruster cycles, the minimum impulse bit, the sensor's tolerance for motion, and the plume geometry at the moment of the burn.
:::

::: note Where each one belongs
Nonlinear MPC earns its place when the model error over the horizon is larger than the margin you have, and nowhere else: relinearised linear MPC is cheaper, certifiable and adequate for most proximity operations, attitude control away from large slews, and any problem where the horizon is short compared with the timescale of the nonlinearity. Economic MPC earns its place when propellant, power or thermal margin is the actual objective and a tracking error is a proxy for it — station keeping, momentum management, long-duration low-thrust manoeuvres, power scheduling on a spacecraft. Both are worth reaching for on purpose, and both are worth avoiding by accident.
:::

## Check yourself

::: check
The CW error table shows $2.78\,\%$ at $10\,\mathrm{km}$ after one orbit. Your rendezvous MPC uses a $10$-minute horizon at a $5\,\mathrm{km}$ separation. Do you need nonlinear MPC?
:::

::: answer
Probably not, and the way to decide is to redo the measurement at your horizon rather than at one orbit. The table's errors accumulate over $92.6$ minutes; ten minutes is about a ninth of that, and since the error grows with the propagated angle, the error over the shorter horizon is far smaller than the tabulated value. Scaling from the $10\,\mathrm{km}$ row: the offset is half, which reduces the quadratic error by about four, and the shorter propagation reduces it further, so the expected error over ten minutes at $5\,\mathrm{km}$ is metres rather than hundreds of metres. Compare that against the margin in the constraints you are enforcing — a corridor width, a keep-out standoff — and against the navigation error, which at that range may well be larger. If the model error is a small fraction of both, the linear model with per-cycle relinearisation is the right answer, and it keeps the convex solver and its guarantees.
:::

::: check
Why does the separating-hyperplane treatment of a keep-out zone preserve feasibility of the previous iterate, and why does that matter?
:::

::: answer
Because the hyperplane is constructed through the point of the sphere closest to the previous trajectory, with its normal pointing from the centre toward that trajectory. The previous iterate therefore satisfies the linearised constraint — it lies on the correct side, at distance at least $r$ from the centre along that normal — so the convex subproblem is feasible whenever the previous trajectory was, and the iteration cannot fail for lack of a starting point. It matters because a sequential scheme that can produce an infeasible subproblem has no recovery: the outer loop stops with nothing to apply. It also means the half-space is *inside* the true feasible region, a conservative inner approximation of the complement of the ball, so any solution of the convex subproblem satisfies the true non-convex constraint. The price is that the approximation is tight only near the linearisation point, which is why a trust region is used.
:::

::: check
Explain why an economic MPC can be asymptotically stable about a steady state even though its stage cost is not positive definite there.
:::

::: answer
Through the rotated cost. Strict dissipativity supplies a storage function $\lambda$ such that adding the telescoping term $\lambda(\mathbf{x}) - \lambda(\mathbf{x}^+)$ to the economic stage cost produces a stage cost $\tilde{\ell}$ that *is* positive definite about the best steady state. Because the added term telescopes, the total cost over the horizon changes only by boundary terms, so the rotated problem has the same optimal input sequences as the economic one — the controller is unchanged. But the rotated problem satisfies the hypotheses of the standard stability theorem, so its value function is a Lyapunov function and the closed loop is asymptotically stable about $(\mathbf{x}_s, \mathbf{u}_s)$. The economic controller inherits the conclusion without having a positive-definite cost of its own. When strict dissipativity fails there is no such rotation, and the closed loop may converge to a periodic orbit that is genuinely better than any steady state.
:::

::: check
Your economic station-keeping controller saves $42\,\%$ of propellant and the reviewer objects that the vehicle now spends its life at the edge of the dead-band. Answer the objection.
:::

::: answer
By agreeing with the observation and disputing the implication. Riding the limit is the correct behaviour for the stated problem: the dead-band is the specification, and propellant is the cost, so any margin left unused is propellant wasted. The objection is really a claim that the specification is incomplete, and that is the productive conversation. If there is a reason to stay away from the edge — navigation uncertainty, a sensor field of view, plume impingement geometry, thermal pointing — then that reason is a constraint or a cost term, and it should be in the problem: tighten the dead-band by the navigation three-sigma, add a small quadratic term on position, or impose a robust tightening as the tube lesson does. What should not happen is choosing a tracking cost in order to obtain a margin by accident, because then nobody knows how much margin there is or what it cost.
:::

::: check
A nonlinear MPC using the real-time iteration scheme performs one SQP iteration per cycle. What has to be true for that to work, and how would you detect that it has stopped working?
:::

::: answer
The solution must move slowly compared with the Newton contraction. One SQP iteration reduces the distance to the exact solution by a contraction factor; the state moving between cycles pushes the solution away again. The scheme tracks the true solution when the contraction outruns the drift, which requires a sample rate fast relative to the dynamics, a good warm start — the previous solution shifted — and no sudden change in the active set or the reference. Detection is by residuals: monitor the norm of the KKT residual after the single iteration, the constraint violation of the returned plan, and the step size. A residual that grows over several cycles means the iteration is losing the solution, typically after a disturbance, a mode change or a step in the reference. The standard responses are to allow extra iterations on those cycles if the budget permits, to re-initialise from a stored nominal trajectory, and to fall back to a certified simple law if the returned plan fails its feasibility check.
:::

## Summary

| Object | Statement |
| --- | --- |
| Nonlinear MPC | $\mathbf{x}_{k+1} = \mathbf{f}(\mathbf{x}_k,\mathbf{u}_k)$, $\mathbf{g}(\mathbf{x}_k,\mathbf{u}_k) \le \mathbf{0}$: a nonlinear program each cycle |
| CW error | One orbit: $0.028\,\%$ at $100\,\mathrm{m}$, $0.28\,\%$ at $1\,\mathrm{km}$, $2.78\,\%$ at $10\,\mathrm{km}$, $13.9\,\%$ at $50\,\mathrm{km}$ |
| Discretisation | Single shooting (compact, ill-conditioned), multiple shooting (sparse, banded), collocation (large, very sparse) |
| Real-time iteration | One warm-started SQP iteration per sample; tracks the moving solution instead of converging |
| What is lost | Global optimality, the certificate, the iteration bound, feasibility of intermediate iterates |
| Successive convexification | Keep-out sphere replaced by a tangent half-space through the previous iterate; conservative and feasible |
| Local optima | Same problem, two initialisations: $\Delta v = 3.447$ against $4.201\,\mathrm{m/s}$, both touching the $3\,\mathrm{m}$ disc |
| Economic MPC | $\ell$ is propellant, energy or money; no positive definiteness about a setpoint |
| Best steady state | $\min \ell$ over admissible equilibria, giving $(\mathbf{x}_s,\mathbf{u}_s)$ |
| Rotated cost | $\tilde{\ell} = \ell - \ell(\mathbf{x}_s,\mathbf{u}_s) + \lambda(\mathbf{x}) - \lambda(\mathbf{x}^+)$ positive definite under strict dissipativity |
| Turnpike | Optimal long-horizon trajectories sit near $(\mathbf{x}_s,\mathbf{u}_s)$ except at the ends |
| Station-keeping result | Economic $0.2939\,\mathrm{m/s}$ against tracking $0.5093\,\mathrm{m/s}$, a $42\,\%$ saving, at $\lvert x_1\rvert \le 1\,\mathrm{m}$ |
| Warning | The economic optimum rides the constraints; every implicit margin must become an explicit constraint |

The next lesson returns to the flight computer: what it takes to run any of this inside a control frame, and what a certification argument for an onboard optimiser looks like.
