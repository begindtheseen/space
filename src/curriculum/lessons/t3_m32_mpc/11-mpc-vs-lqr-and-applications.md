---
id: l11-mpc-vs-lqr-and-applications
title: MPC against LQR, and where MPC flies
minutes: 21
covers:
  - 'MPC vs LQR trade; MPC for powered descent, rendezvous and constrained attitude control'
---

This module has built a controller that solves an optimisation every cycle, proved it stable, made it recursively feasible, made it robust to a bounded disturbance, and measured it against a flight computer's frame budget. The question left is the one a chief engineer asks first: is any of that necessary here, or would a gain with a limiter have done?

The answer is sharper than it sounds, because the two controllers are not different theories. Strip the constraints from linear MPC and let the horizon go to infinity and you get LQR exactly — not approximately, not asymptotically, but the same gain to every digit your arithmetic carries. Everything MPC offers is therefore traceable to one of three sources: constraints, preview, or time variation. If a problem has none of them, MPC is an expensive way to compute a matrix multiply.

This lesson makes that comparison quantitative on the running example, states the decision rule, and then walks the three aerospace applications where MPC most often earns its keep.

## The equivalence

::: key The equivalence to remember
Unconstrained linear MPC with an infinite horizon is exactly LQR. Every benefit of MPC comes from constraints, preview, or time variation — never from the optimisation alone.
:::

With the Riccati terminal cost the equality is stronger still: the receding-horizon gain equals the LQR gain at *every* horizon, because the backward Riccati recursion started at its own fixed point stays there. Computing the unconstrained receding-horizon law for the proximity-ops plant gives $\mathbf{K}_{\text{rh}} = [\,2.58570090\ \ 3.44343592\,]$ at $N = 1$, $N = 5$, $N = 20$ and $N = 60$ alike, against an LQR gain of $[\,2.58570090\ \ 3.44343592\,]$. Without the terminal cost the gains differ and approach the LQR gain as $N$ grows, as the first lesson's sweep showed. Either way, the optimiser adds nothing while no constraint is active.

## MPC against a saturated LQR

The fair comparison is not MPC against unconstrained LQR — nobody flies a controller that commands more thrust than the vehicle has. It is MPC against the standard engineering fix: compute the LQR command and clip it to the actuator limits.

::: example Where clipping is fine, and where it is not
The proximity-ops axis, $\mathbf{Q} = \mathbf{I}$, $R = 0.1$, $|u| \le 1\,\mathrm{m/s^2}$ and a closing-speed limit $|x_2| \le 0.5\,\mathrm{m/s}$. MPC uses $N = 20$ with both constraints; clipped LQR uses $u = \mathrm{sat}(-\mathbf{K}\mathbf{x})$ and has no way to represent the speed limit at all. Twelve seconds of closed loop:

| start | controller | cost $\sum \ell$ | worst $\lvert x_2\rvert$ | $\Delta v$ |
| --- | --- | --- | --- | --- |
| $(2\,\mathrm{m}, 0)$ | clipped LQR | $63.50$ | $1.046\,\mathrm{m/s}$ | $2.091\,\mathrm{m/s}$ |
| $(2\,\mathrm{m}, 0)$ | MPC | $74.70$ | $0.500\,\mathrm{m/s}$ | $1.000\,\mathrm{m/s}$ |
| $(1\,\mathrm{m}, 0)$ | clipped LQR | $14.054$ | $0.576\,\mathrm{m/s}$ | $1.152\,\mathrm{m/s}$ |
| $(1\,\mathrm{m}, 0)$ | MPC | $14.128$ | $0.500\,\mathrm{m/s}$ | $1.000\,\mathrm{m/s}$ |
| $(0.4\,\mathrm{m}, 0)$ | clipped LQR | $2.131$ | $0.239\,\mathrm{m/s}$ | $0.479\,\mathrm{m/s}$ |
| $(0.4\,\mathrm{m}, 0)$ | MPC | $2.131$ | $0.239\,\mathrm{m/s}$ | $0.479\,\mathrm{m/s}$ |

Three distinct regimes, and all three matter.

From $0.4\,\mathrm{m}$ the two controllers are *identical to six digits*. No constraint is active, so MPC is evaluating the LQR gain the expensive way. Any comparison run only in this regime will conclude that MPC does nothing, and it will be right.

From $1\,\mathrm{m}$, clipping exceeds the speed limit by $15\,\%$ and costs about the same. From $2\,\mathrm{m}$ it exceeds the limit by $109\,\%$ — more than twice the allowed closing speed. That is what a state constraint failing looks like: nothing dramatic, no instability, a controller doing its job well while flying through a limit it was never told about.

The quadratic cost column is the interesting trap. Clipped LQR has the *lower* cost, $63.50$ against $74.70$, because the cost is what the speed limit is bought with. In fact $63.4959$ is exactly the constrained optimal cost computed in the second lesson of this module for the problem with input limits only — clipping is not merely adequate there, it is *optimal*, since it saturates for precisely the ten samples the optimal plan saturates for and follows the LQR law thereafter. Any argument for MPC that rests on the quadratic cost alone loses this comparison. The argument that wins is the constraint column, and the propellant: MPC spends $1.000\,\mathrm{m/s}$ of $\Delta v$ against $2.091$, because a lower peak speed needs less braking impulse. Respecting the limit is what makes it cheaper.
:::

::: warning MPC does not create control authority
It is easy to over-sell the optimiser. Take the unstable pitch axis from the terminal-cost lesson, $\ddot{\theta} = 4\theta + u$ with $|u| \le 1\,\mathrm{rad/s^2}$. A steady deflection can be held only while $4\theta \le 1$, that is $|\theta| \le 0.25\,\mathrm{rad}$; beyond it no input keeps the vehicle from running away. Running both controllers from rest: at $\theta_0 = 0.24\,\mathrm{rad}$ both clipped LQR and MPC with $N = 60$ recover; at $\theta_0 = 0.26\,\mathrm{rad}$ both diverge, and so does every other controller, because the state is outside the null-controllable region. Starting at $\theta_0 = 0.10\,\mathrm{rad}$ with a rate of $0.40\,\mathrm{rad/s}$ the same thing happens — the momentum carries the vehicle past the holdable deflection before the thruster can arrest it.

MPC finds the best plan that exists. It does not manufacture one. When a vehicle loses control with a predictive controller, the first question is whether the state was inside the maximal control invariant set of the feasibility lesson, and the answer is often that it was not — in which case the fix is thrust, not software.
:::

## The decision

The trade reduces to a short list, and it is worth being able to state it without hedging.

**MPC earns its complexity when:**

- **Constraints are active and shape the optimal behaviour.** A thruster that saturates for a significant fraction of the manoeuvre, a closing-speed limit, a glide slope, a keep-out zone, an attitude-rate limit during a fast slew. If a constraint is active more than occasionally, a controller that plans around it beats one that discovers it.
- **You have preview.** A known future reference, a scheduled staging event, a wind profile, the motion of a target, a time-varying thrust-to-weight through a burn. A gain cannot use information about the future; a horizon is built from it.
- **The plant or the reference is strongly time-varying and known in advance.** Ascent through max-q, a lander whose mass drops by a third, a low-thrust transfer.
- **Inputs interact through a shared limit.** Thruster allocation with a total-flow or momentum-envelope constraint, redundant actuators with a polytopic admissible set.

**LQR — or a gain with a limiter — is the right answer when:**

- Constraints are rarely active, so the two controllers agree anyway;
- the CPU or certification budget is tight, and a closed-form gain with guaranteed margins, testable exhaustively over its operating envelope, is worth far more than a few percent of performance;
- the loop is inside the bandwidth where you need classical margins and a transfer function — full-state-feedback LQR comes with the margin guarantees taught in the optimal control module, and an implicit optimisation does not have a transfer function at all;
- or the team cannot support an onboard optimiser through its whole life cycle, which is a real constraint and not an admission of anything.

The most common good answer is a hybrid: a predictive outer layer that plans against the constraints at a modest rate, and a fixed-gain inner loop that runs fast and carries the margins. That is the tube architecture of the robust lesson, and it is what most flown systems look like.

## Where MPC flies

### Powered descent

A landing burn is the case where constraints define the problem: thrust bounds with a minimum throttle, a glide-slope cone that keeps the vehicle above the terrain, a pointing constraint on the thrust vector, and terminal conditions at the pad. The optimization module showed how lossless convexification turns the non-convex minimum-throttle bound into an exact second-order cone constraint and how the resulting SOCP is solved onboard with a fixed iteration budget.

From this module's perspective, the guidance is a **shrinking-horizon** predictive controller: the problem is re-solved every cycle from the current navigation state, only the first portion of the plan is flown, and the horizon counts down toward a touchdown time searched from outside the convex solve. The terminal set is the physical landing condition rather than an invented invariant set, so the terminal ingredients of this module are replaced by mission requirements — and recursive feasibility becomes a divert question: if the problem goes infeasible, the vehicle cannot reach the target, and the standard architecture answers with a first solve that minimises miss distance and a second that minimises propellant subject to the achievable miss. The published lineage runs from Açıkmeşe and Ploen's lossless convexification through the G-FOLD flight tests on the Masten Xombie vehicle.

### Rendezvous and proximity operations

Here the model is Clohessy–Wiltshire, taken from the relative motion and proximity operations module and valid to the accuracy measured in the nonlinear lesson — $0.28\,\%$ per orbit at $1\,\mathrm{km}$, $2.8\,\%$ at $10\,\mathrm{km}$ — so linear MPC is appropriate inside a kilometre and marginal beyond it. The constraints are what make it interesting: an approach corridor (a cone anchored at the docking port), a keep-out sphere around the target (non-convex, handled by the rotating separating hyperplane of the nonlinear lesson, with the loss of global optimality stated honestly), thruster limits, plume-impingement exclusions, and a terminal box at the port with a contact-velocity limit. The cost is usually propellant, which makes it an economic formulation, and the disturbance set covers differential drag and thruster dispersion, which makes tube tightening natural.

::: example Sizing a rendezvous and an attitude controller
Two concrete problems, sized with the flop model of the real-time lesson at $25$ interior-point iterations per solve.

*Rendezvous.* Six states, three inputs, $T_s = 10\,\mathrm{s}$, $N = 30$ — a five-minute horizon, appropriate for terminal approach. Sparse formulation: $25 \times 30 \times (6+3)^3 = 5.5\times10^5$ flops per solve, $5.5\,\mathrm{ms}$ even at $100\,\mathrm{MFLOP/s}$, against a $10\,\mathrm{s}$ cycle. Timing is a non-issue; the design effort goes into the constraint geometry and the disturbance set.

*Constrained attitude control.* Nine states — three attitude-error components, three body rates, three wheel momenta — and three wheel-torque inputs, at a $20\,\mathrm{ms}$ control period with $N = 20$ ($0.4\,\mathrm{s}$ of horizon). The crossover of the QP-formulation lesson is $N^\star = \sqrt{3}(12/3)^{3/2} = 13.9$, so the sparse form is the better choice at this horizon: $25 \times 20 \times 12^3 = 8.6\times10^5$ flops, $0.86\,\mathrm{ms}$ at $1\,\mathrm{GFLOP/s}$, comfortably inside a $6\,\mathrm{ms}$ allowance. Taking the horizon to $N = 40$ costs $1.73\,\mathrm{ms}$ sparse but $14.4\,\mathrm{ms}$ condensed — the cubic term biting exactly where the crossover said it would.

The lesson from both numbers is that for problems of this size the solve time is not what decides. The decision is whether the constraints justify the machinery, and after that the effort goes into the terminal ingredients, the disturbance set and the fallback.
:::

### Constrained attitude control

Attitude is where MPC meets its most interesting constraints. Body-rate limits protect a star tracker's tracking loop and keep gyros inside their measurement range. Wheel torque and momentum envelopes are hard actuator limits that couple three axes through the allocation matrix. Exclusion cones keep a sun sensor, a star tracker or a cryogenic instrument away from the Sun, the Earth limb or a thruster plume — and an exclusion cone, like a keep-out sphere, is non-convex, so the same rotating-hyperplane treatment applies with the same caveat about local optima.

Two features of the problem deserve care. The kinematics live on a manifold rather than in a vector space: quaternions, MRPs and the unwinding problem are the nonlinear control module's territory, and a linear MPC has to work with a local error parameterisation refreshed each cycle, which is legitimate for small errors and wrong for a large slew. And the dynamics have a gyroscopic term that a linear model omits, significant precisely during the fast slews where the rate constraints bind — which is the argument for nonlinear MPC, or for a linear-time-varying formulation relinearised about the planned slew.

## The module, in one page

You can now take a control problem and say whether a predictive controller is warranted; write the finite-horizon constrained problem down term by term; turn it into a quadratic program in condensed or sparse form and say which one the plant and horizon call for; add a terminal cost and terminal set and prove the closed loop stable and recursively feasible; compute the region of attraction and trade it against the horizon; soften the state constraints with an exact penalty; tighten them for a bounded disturbance with a tube; recognise where a non-convex constraint or a nonlinear model forces you out of the convex world and what that costs; size the solve against a frame budget and describe what a certification argument needs; and, when it is the right answer, choose the gain with a limiter instead.

## Check yourself

::: check
A colleague reports that on their benchmark MPC and clipped LQR give identical trajectories, and concludes that MPC is useless for the application. What should they check?
:::

::: answer
Whether the benchmark ever activates a constraint. Identical trajectories to several digits, as in the $(0.4\,\mathrm{m}, 0)$ row above, mean the input never saturated and no state constraint bound, and in that regime the two controllers are the same law — the comparison contains no information. The right test starts from the edge of the operating envelope: the largest dispersion the vehicle must handle, the worst-case handover state, the case where the actuator saturates for a significant fraction of the manoeuvre, the case where the reference steps. If the constraints never bind even there, the conclusion stands and the gain is the better controller. If they bind, the comparison must be made on constraint satisfaction and propellant rather than on the quadratic cost, since clipping will often show the lower quadratic cost precisely because it is ignoring a constraint.
:::

::: check
Why does the clipped-LQR controller have a lower quadratic cost than MPC from $(2\,\mathrm{m}, 0)$, and why is that not an argument against MPC?
:::

::: answer
Because the two controllers are solving different problems. Clipped LQR respects only the input limit, and $63.4959$ is the exact optimal cost of *that* problem — MPC with only input constraints would return the same trajectory. MPC is additionally enforcing $|x_2| \le 0.5\,\mathrm{m/s}$, which forbids the fast approach that produced the low cost, so its cost is necessarily higher: $74.70$. Comparing them on the cost is comparing a constrained optimum with an unconstrained one and discovering that constraints cost something. The comparison that means anything asks whether each controller satisfies the requirements: one exceeds the closing-speed limit by $109\,\%$ and the other does not. As a bonus, the constrained solution also uses less than half the propellant, because peak speed drives braking impulse.
:::

::: check
Your spacecraft has three reaction wheels with torque limits that are almost never reached, an attitude requirement of $0.1^\circ$, and a flight software team of two. Recommend a controller.
:::

::: answer
A fixed-gain controller — LQR or a well-tuned PID per axis with cross-coupling compensation — with the wheel torque commands clipped and anti-windup on any integrators. Constraints that are almost never active are the definition of the regime where MPC and a clipped gain coincide, so the optimiser would buy nothing in nominal operation while adding a solver, its failure modes, its verification and its lifetime maintenance to a two-person team. What would change the recommendation: a momentum-management requirement that couples the wheels through an envelope constraint that *is* regularly active, a slew requirement with rate limits that bind, or an exclusion cone that must be respected during slews. Any of those introduces a constraint that shapes the optimal behaviour, and at that point the predictive formulation starts to earn its place — and could be introduced only for the slew planner, leaving the fine-pointing loop as a gain.
:::

::: check
Powered descent guidance is usually described as convex optimisation rather than as MPC. What, if anything, is the difference?
:::

::: answer
Very little in substance, and the difference is one of emphasis. Both solve a constrained finite-horizon optimal control problem from the current state every cycle and apply the start of the answer. Descent guidance is a shrinking-horizon formulation with a physical terminal condition — touchdown at the pad, at rest, upright — so it needs no invented terminal set, and its horizon shortens as the burn proceeds; its literature emphasises the *convexification* that makes the problem solvable, because the minimum-throttle bound and the thrust-pointing constraint are non-convex as written. Standard MPC is a receding-horizon formulation whose terminal ingredients have to be constructed, and whose literature emphasises stability and recursive feasibility because the task never ends. The machinery is shared: the same QP or SOCP structure, the same warm-start question, the same iteration cap, the same fallback rule.
:::

::: check
State the strongest argument you can against putting an optimiser in a flight control loop, and then answer it.
:::

::: answer
The strongest argument is about failure modes rather than performance: a gain has one, and an optimiser has several. A gain computes a command in a bounded number of operations with no data-dependent branching, and its behaviour can be characterised exhaustively over the operating envelope by linear analysis. An optimiser can hit an iteration cap, return an infeasible iterate, become genuinely infeasible, take a data-dependent path through its own code, and behave differently on the flight processor than on the workstation — and all of that is inside a loop with a hard deadline and no operator.

The answer is that every one of those is converted into a defined branch, and that this is exactly what the last two lessons construct. Convexity bounds the iteration count and gives certificates. A fixed cap plus an independent constraint check on the returned plan makes "out of iterations" a defined outcome. Softening makes infeasibility of the QP impossible, and the terminal ingredients make it rare. A certified fallback with a deterministic switch means no cycle depends on the solver succeeding. Static allocation, generated code and a measured worst-case execution time on the target make the timing a fact rather than a statistic. What is left is that this is more work than a gain — which is true, and is precisely why the answer to "should we use MPC?" should be no unless the constraints make it yes.
:::

## Summary

| Object | Statement |
| --- | --- |
| Equivalence | Unconstrained infinite-horizon linear MPC is LQR; with the Riccati terminal cost the gains agree at every $N$ |
| Verified | $\mathbf{K}_{\text{rh}} = [\,2.58570090\ \ 3.44343592\,] = \mathbf{K}_{\text{lqr}}$ at $N = 1, 5, 20, 60$ |
| No constraint active | MPC and clipped LQR identical to six digits from $(0.4\,\mathrm{m}, 0)$ |
| State constraint active | From $(2\,\mathrm{m},0)$: clipping reaches $1.046\,\mathrm{m/s}$ against a $0.5$ limit; MPC holds it and uses $1.000$ against $2.091\,\mathrm{m/s}$ of $\Delta v$ |
| Cost trap | Clipping shows the lower quadratic cost ($63.50$ against $74.70$) because it is ignoring the constraint |
| Authority | MPC does not create it: both controllers recover from $0.24\,\mathrm{rad}$ and neither from $0.26\,\mathrm{rad}$ on the unstable axis |
| Use MPC when | Constraints bind, preview exists, the plant or reference is time-varying, inputs share a limit |
| Use LQR when | Constraints rarely bind, CPU or certification budget is tight, classical margins are needed |
| Powered descent | Shrinking horizon, SOCP with lossless convexification, physical terminal condition, divert logic in place of recursive feasibility |
| Rendezvous | CW model valid inside about a kilometre, corridor and keep-out constraints, propellant cost, tube tightening; $N = 30$ at $T_s = 10\,\mathrm{s}$ costs $5.5\,\mathrm{ms}$ at $100\,\mathrm{MFLOP/s}$ |
| Attitude | Rate limits, wheel torque and momentum envelopes, non-convex exclusion cones, manifold kinematics; $n = 9$, $m = 3$, $N = 20$ sparse costs $0.86\,\mathrm{ms}$ at $1\,\mathrm{GFLOP/s}$ |
| Common architecture | Predictive outer layer with a fixed-gain inner loop — the tube structure |

That is the module. The exercises take it from here: build the condensed QP and run the receding-horizon loop on the double integrator against a clipped LQR, add a keep-out zone to a Clohessy–Wiltshire rendezvous and state honestly what the linearised constraint costs you, and profile the solve until you can say which horizon fits a $20\,\mathrm{ms}$ frame and what you would need in order to certify it.
