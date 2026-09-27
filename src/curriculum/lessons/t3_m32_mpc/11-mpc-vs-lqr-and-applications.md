---
id: l11-mpc-vs-lqr-and-applications
title: MPC against LQR, and where MPC flies
minutes: 21
covers:
  - 'MPC vs LQR trade; MPC for powered descent, rendezvous and constrained attitude control'
---

You would not hire a moving truck to carry one chair. The truck is wonderful when the job is big, and pure cost when it is not. This module has built a big machine: a controller that solves an optimization every cycle, proved stable, recursively feasible and robust, and measured against a flight computer's clock. The question a chief engineer asks first is whether any of it is needed here, or whether a plain gain with a limiter would have done.

The answer is sharper than it sounds, because the two controllers are not different theories. Take away the constraints from linear MPC, let the horizon run to infinity, and you get LQR exactly — the same gain to every digit your arithmetic carries. So everything MPC offers comes from one of three sources: **constraints**, **preview** (knowing something about the future), or **time variation**. If a problem has none of them, MPC is an expensive way to do a matrix multiply.

This lesson makes that comparison with numbers on the running example, states the decision rule, and then visits the three aerospace jobs where MPC most often earns its keep.

## The equivalence

::: key The equivalence to remember
Unconstrained linear MPC with an infinite horizon is exactly LQR. Every benefit of MPC comes from constraints, preview, or time variation — never from the optimization alone.
:::

With the Riccati terminal cost the match is even stronger: the receding-horizon gain equals the LQR gain at *every* horizon, not only an infinite one. The reason is the backward Riccati recursion. It starts at the terminal cost $\mathbf{P}$, and $\mathbf{P}$ is already its **[[fixed point|fixed-point]]**, so every step of the recursion lands on $\mathbf{P}$ again.

Check it on the proximity-operations plant. Compute the unconstrained receding-horizon gain $\mathbf{K}_{\text{rh}}$ ("K sub r-h") at $N = 1$, $5$, $20$ and $60$. Every time it comes out $[\,2.58570090\ \ 3.44343592\,]$, and the LQR gain is $[\,2.58570090\ \ 3.44343592\,]$. Without the terminal cost the gains differ, and creep toward the LQR gain as $N$ grows, as the first lesson's sweep showed. Either way, while no constraint is active, the optimizer adds nothing.

## MPC against a saturated LQR

Comparing MPC with plain LQR is not fair. Nobody flies a controller that asks for more thrust than the vehicle has. The fair rival is the standard engineering fix: compute the LQR command, then **[[clip it|saturation]]** to the actuator limits. That is **clipped** (or **saturated**) LQR, written $u = \mathrm{sat}(-\mathbf{K}\mathbf{x})$.

::: example Where clipping is fine, and where it is not
The proximity-ops axis: $\mathbf{Q} = \mathbf{I}$, $R = 0.1$, thrust limit $|u| \le 1\,\mathrm{m/s^2}$ and closing-speed limit $|x_2| \le 0.5\,\mathrm{m/s}$. MPC uses $N = 20$ and both constraints. Clipped LQR has no way to represent the speed limit at all. Run each for twelve seconds and record the total quadratic cost $\sum \ell$, the fastest speed reached, and the **$\Delta v$** ("delta v") — the total speed change the thruster produced, a direct measure of propellant, found by adding $|u| \times 0.1\,\mathrm{s}$ over every sample:

| start | controller | cost $\sum \ell$ | worst $\lvert x_2\rvert$ | $\Delta v$ |
| --- | --- | --- | --- | --- |
| $(2\,\mathrm{m}, 0)$ | clipped LQR | $63.50$ | $1.046\,\mathrm{m/s}$ | $2.091\,\mathrm{m/s}$ |
| $(2\,\mathrm{m}, 0)$ | MPC | $74.70$ | $0.500\,\mathrm{m/s}$ | $1.000\,\mathrm{m/s}$ |
| $(1\,\mathrm{m}, 0)$ | clipped LQR | $14.054$ | $0.576\,\mathrm{m/s}$ | $1.152\,\mathrm{m/s}$ |
| $(1\,\mathrm{m}, 0)$ | MPC | $14.128$ | $0.500\,\mathrm{m/s}$ | $1.000\,\mathrm{m/s}$ |
| $(0.4\,\mathrm{m}, 0)$ | clipped LQR | $2.131$ | $0.239\,\mathrm{m/s}$ | $0.479\,\mathrm{m/s}$ |
| $(0.4\,\mathrm{m}, 0)$ | MPC | $2.131$ | $0.239\,\mathrm{m/s}$ | $0.479\,\mathrm{m/s}$ |

There are three regimes, and all three matter.

**From $0.4\,\mathrm{m}$** the two controllers agree to six digits. No constraint is ever active, so MPC is computing the LQR gain the expensive way. A comparison run only here would conclude MPC does nothing — and it would be right.

**From $1\,\mathrm{m}$**, clipping breaks the speed limit: $0.576/0.5 = 1.15$, so $15\,\%$ over, at about the same cost. **From $2\,\mathrm{m}$** it breaks it by $1.046/0.5 = 2.09$, or $109\,\%$ over — more than twice the allowed closing speed. That is what a failed state constraint looks like. Nothing dramatic, no instability: a controller doing its job well while flying straight through a limit it was never told about.

**The cost column is a trap.** Clipped LQR has the *lower* cost, $63.50$ against $74.70$. The extra cost is what MPC pays to respect the speed limit. In fact $63.4959$ is exactly the best possible cost found in the second lesson for the problem with the thrust limit only. There, clipping is not merely good enough — it is *optimal*. It saturates for the same ten samples the optimal plan does, then follows the LQR law. So an argument for MPC based on quadratic cost loses. The argument that wins is the constraint column, and the propellant: MPC spends $1.000\,\mathrm{m/s}$ of $\Delta v$ against $2.091$, because a lower top speed needs less braking. Respecting the limit is what makes it cheaper.
:::

::: warning MPC does not create control authority
It is easy to oversell the optimizer. Take the unstable pitch axis from the terminal-cost lesson, $\ddot{\theta} = 4\theta + u$ with $|u| \le 1\,\mathrm{rad/s^2}$. Here $\theta$ ("theta") is the pitch angle and $\ddot{\theta}$ ("theta double-dot") its angular acceleration. To hold a steady tilt, the input must cancel the $4\theta$ term, which needs $4\theta \le 1$, or $|\theta| \le 0.25\,\mathrm{rad}$. Beyond that, no input can stop the vehicle from running away.

Run both controllers from rest. At $\theta_0 = 0.24\,\mathrm{rad}$ both clipped LQR and MPC with $N = 60$ recover. At $\theta_0 = 0.26\,\mathrm{rad}$ both diverge — and so would any controller, because the state is outside the **[[null-controllable region|null-controllable]]**, the set of states that can be steered back to zero at all. Start at $\theta_0 = 0.10\,\mathrm{rad}$ with a rate of $0.40\,\mathrm{rad/s}$ and the same thing happens: the motion carries the vehicle past the holdable tilt before the thruster can stop it.

MPC finds the best plan that exists. It does not manufacture one. When a vehicle with a predictive controller loses control, first ask whether the state was inside the maximal control invariant set of the feasibility lesson. Often it was not, and then the fix is more thrust, not better software.
:::

## The decision

The trade reduces to a short list. Learn to say it without hedging.

**MPC earns its complexity when:**

- **Constraints are active and shape the best behavior.** A thruster that saturates for a real fraction of the maneuver, a closing-speed limit, a **[[glide slope|glide-slope]]**, a keep-out zone, a turn-rate limit during a fast slew. If a constraint is active more than now and then, a controller that plans around it beats one that bumps into it.
- **You have preview.** A known future reference, a scheduled staging event, a wind profile, a target's motion, thrust-to-weight changing through a burn. A gain cannot use the future; a horizon is built from it.
- **The plant or the reference changes strongly with time, in a way known in advance.** Ascent through **[[max-q|max-q]]**, a lander whose mass drops by a third, a low-thrust transfer.
- **Inputs share a limit.** Thrusters with a total-flow or momentum limit; redundant actuators whose allowed commands form a polytope (a flat-sided region).

**LQR — or a gain with a limiter — is the right answer when:**

- constraints are rarely active, so the two controllers agree anyway;
- the CPU or certification budget is tight, and a closed-form gain with guaranteed margins, testable exhaustively over its envelope, is worth far more than a few percent of performance;
- the loop needs classical margins and a transfer function — full-state LQR comes with the **[[margin guarantees|lqr-margins]]** of the optimal control module, and an optimization solved online has no transfer function at all;
- or the team cannot support an onboard optimizer through its whole life, which is a real constraint and no admission of weakness.

The most common good answer is a hybrid: a predictive outer layer that plans around the constraints at a modest rate, and a fixed-gain inner loop that runs fast and carries the margins. That is the tube architecture of the robust-MPC lesson, and it is what most flown systems look like.

## Where MPC flies

### Powered descent

A landing burn is where constraints *are* the problem: thrust bounds with a minimum throttle, a glide-slope cone that keeps the vehicle above the terrain, a limit on how far the thrust can tilt, and exact conditions at the pad. The optimization module showed how **[[lossless convexification|lossless-convexification]]** turns the non-convex minimum-throttle bound into an exact second-order cone constraint, and how the resulting SOCP (second-order cone program) is solved onboard within a fixed iteration budget.

Seen from this module, descent guidance is a **shrinking-horizon** controller. It re-solves every cycle from the current navigation state and flies only the first part of the plan. The horizon counts down toward a touchdown time, which is searched for outside the convex solve. The terminal set is the physical landing condition, not an invented invariant set, so mission requirements replace the terminal ingredients of this module. Recursive feasibility becomes a **divert** question: if the problem goes infeasible, the vehicle cannot reach the target. The standard answer is two solves — first minimize the miss distance, then minimize propellant while achieving that miss.

### Rendezvous and proximity operations

Here the model is **[[Clohessy–Wiltshire|clohessy-wiltshire]]** (CW), from the relative-motion module. The nonlinear-MPC lesson measured its error after one orbit: $0.28\,\%$ at $1\,\mathrm{km}$ and $2.8\,\%$ at $10\,\mathrm{km}$. So linear MPC suits the last kilometer and is marginal beyond it.

The constraints are what make it interesting:

- an **[[approach corridor|approach-corridor]]**, a cone anchored at the docking port;
- a **keep-out sphere** around the target — non-convex, handled with the rotating separating hyperplane of the nonlinear lesson, giving up global optimality (say so honestly);
- thruster limits, and zones where your exhaust plume must not hit the target;
- a terminal box at the port with a limit on contact speed.

The cost is usually propellant, which makes this an economic formulation. The disturbance set covers differential drag and thruster errors, which makes tube tightening natural.

::: example Sizing a rendezvous and an attitude controller
Size two problems with the flop model of the real-time lesson, at $25$ interior-point iterations per solve.

**Rendezvous.** Six states, three inputs, sample time $T_s = 10\,\mathrm{s}$, $N = 30$: a $300\,\mathrm{s}$, five-minute horizon, right for terminal approach. Sparse form: $25 \times 30 \times (6+3)^3 = 25 \times 30 \times 729 = 5.5\times10^5$ flops per solve. Even at $100\,\mathrm{MFLOP/s}$ that is $5.5\,\mathrm{ms}$, against a $10\,\mathrm{s}$ cycle — under a thousandth of the cycle. Timing is a non-issue. The effort goes into the constraint geometry and the disturbance set.

**Constrained attitude control.** Nine states — three attitude-error components, three body rates, three wheel momenta — and three wheel torques. Control period $20\,\mathrm{ms}$ and $N = 20$, so $0.4\,\mathrm{s}$ of horizon. The crossover from the QP-formulation lesson is

$$
N^\star = \sqrt{3}\left(\frac{12}{3}\right)^{3/2} = \sqrt{3} \times 8 = 13.9,
$$

so at $N = 20$ the sparse form is the better choice: $25 \times 20 \times 12^3 = 8.6\times10^5$ flops, $0.86\,\mathrm{ms}$ at $1\,\mathrm{GFLOP/s}$, well inside a $6\,\mathrm{ms}$ allowance. Stretch to $N = 40$ and sparse costs $1.73\,\mathrm{ms}$, but condensed costs $25 \times 120^3/3 = 1.44 \times 10^7$ flops, or $14.4\,\mathrm{ms}$ — the cube biting exactly where the crossover said it would.

For problems this size, solve time is not what decides. What decides is whether the constraints justify the machinery. After that, the effort goes into the terminal ingredients, the disturbance set and the fallback.
:::

### Constrained attitude control

Attitude is where MPC meets its most interesting constraints. **Body-rate limits** protect a star tracker's ability to lock on and keep gyros inside their measuring range. Wheel torque and momentum limits are hard actuator limits that tie all three axes together through the allocation matrix. **[[Exclusion cones|exclusion-cone]]** keep a sun sensor, a star tracker or a cold instrument pointed away from the Sun, the Earth's edge or a thruster plume. An exclusion cone, like a keep-out sphere, is non-convex, so the same rotating-hyperplane trick applies, with the same warning about local optima.

Two features need care. First, orientations do not live in an ordinary flat space. Quaternions, MRPs and the **[[unwinding|unwinding]]** problem belong to the nonlinear control module. A linear MPC must use a small error angle measured from a reference refreshed each cycle — fine for small errors, wrong for a large slew. Second, the true dynamics include a **gyroscopic** term (the spinning body's rates coupling into each other) that a linear model leaves out. It is largest during fast slews, exactly when rate limits bind. That is the case for nonlinear MPC, or for a linear model re-linearized along the planned slew.

## The module, in one page

You can now take a control problem and say whether a predictive controller is warranted. You can write the finite-horizon constrained problem term by term, turn it into a QP in condensed or sparse form, and say which the plant and horizon call for. You can add a terminal cost and set, prove the loop stable and recursively feasible, and trade the region of attraction against the horizon. You can soften state constraints with an exact penalty, tighten them for a bounded disturbance with a tube, and see where a non-convex constraint or nonlinear model forces you out of the convex world. You can size the solve against a frame budget and say what certification needs. And, when it is right, you can choose the gain with a limiter instead.

## Check yourself

::: check
A colleague reports that on their benchmark MPC and clipped LQR give identical trajectories, and concludes that MPC is useless for the application. What should they check?
:::

::: answer
Whether the benchmark ever activates a constraint. Trajectories identical to several digits, as in the $(0.4\,\mathrm{m}, 0)$ row, mean the input never saturated and no state limit bound — and then the two controllers are the same law, so the test holds no information.

The right test starts at the edge of the operating envelope: the largest dispersion the vehicle must handle, the worst handover state, a case where the actuator saturates for much of the maneuver, a reference step. If the constraints never bind even there, the conclusion stands and the gain is the better controller. If they do bind, compare on constraint satisfaction and propellant, not quadratic cost — clipping often shows the lower cost precisely because it ignores a constraint.
:::

::: check
Why does the clipped-LQR controller have a lower quadratic cost than MPC from $(2\,\mathrm{m}, 0)$, and why is that not an argument against MPC?
:::

::: answer
Because they solve different problems. Clipped LQR respects only the thrust limit, and $63.4959$ is the exact best cost of *that* problem; MPC with only the thrust limit would give the same trajectory. MPC also enforces $|x_2| \le 0.5\,\mathrm{m/s}$, which forbids the fast approach behind the low cost, so its cost must be higher: $74.70$.

Comparing costs here only rediscovers that constraints cost something. The meaningful comparison asks whether each controller meets the requirements: one exceeds the closing-speed limit by $109\,\%$, the other does not. As a bonus, the constrained plan uses less than half the propellant ($1.000$ against $2.091\,\mathrm{m/s}$), because top speed drives braking impulse.
:::

::: check
Your spacecraft has three reaction wheels with torque limits that are almost never reached, an attitude requirement of $0.1^\circ$, and a flight software team of two. Recommend a controller.
:::

::: answer
A fixed-gain controller — LQR, or a well-tuned PID per axis with cross-coupling compensation — with the wheel torque commands clipped and anti-windup on any integrators. Constraints that are almost never active are exactly the regime where MPC and a clipped gain coincide. The optimizer would buy nothing in normal operation while adding a solver, its failure modes, its verification and its lifetime upkeep to a two-person team.

What would change the answer: a momentum-management requirement that couples the wheels through an envelope constraint that *is* regularly active, a slew with rate limits that bind, or an exclusion cone to respect during slews. Any of those brings a constraint that shapes the best behavior. Then MPC starts to earn its place — and could be used for the slew planner only, leaving fine pointing to the gain.
:::

::: check
Powered descent guidance is usually described as convex optimization rather than as MPC. What, if anything, is the difference?
:::

::: answer
Very little in substance; the difference is emphasis. Both solve a constrained finite-horizon optimal control problem from the current state each cycle and apply the start of the answer.

Descent guidance is shrinking-horizon, with a physical terminal condition — at rest, upright, on the pad — so it needs no invented terminal set, and its horizon shortens as the burn goes on. Its literature stresses *convexification*, because the minimum-throttle bound and the thrust-pointing limit are non-convex as written. Standard MPC is receding-horizon; its terminal ingredients must be built, and its literature stresses stability and recursive feasibility because the task never ends. The machinery is shared: the same QP or SOCP structure, warm-start question, iteration cap and fallback rule.
:::

::: check
State the strongest argument you can against putting an optimizer in a flight control loop, and then answer it.
:::

::: answer
**The argument** is about failure modes, not performance. A gain has one; an optimizer has several. A gain computes a command in a fixed number of operations with no data-dependent branches, and linear analysis can characterize it over the whole envelope. An optimizer can hit its iteration cap, return an infeasible point, become truly infeasible, take a data-dependent path through its code, and behave differently on the flight processor than on the workstation — all inside a loop with a hard deadline and no operator.

**The answer** is that each of those becomes a defined branch, which is exactly what the last two lessons build. Convexity bounds the iteration count and gives certificates. A fixed cap plus an independent constraint check makes "out of iterations" a defined outcome. Softening makes QP infeasibility impossible, and the terminal ingredients make it rare. A certified fallback with a deterministic switch means no cycle depends on the solver. Static memory, generated code and measured worst-case timing on the target make timing a fact, not a statistic. What remains is that it is more work than a gain — true, and exactly why the answer to "should we use MPC?" should be no unless the constraints make it yes.
:::

## Summary

| Object | Statement |
| --- | --- |
| Equivalence | Unconstrained infinite-horizon linear MPC is LQR; with the Riccati terminal cost the gains agree at every $N$ |
| Verified | $\mathbf{K}_{\text{rh}} = [\,2.58570090\ \ 3.44343592\,] = \mathbf{K}_{\text{lqr}}$ at $N = 1, 5, 20, 60$ |
| No constraint active | MPC and clipped LQR agree to six digits from $(0.4\,\mathrm{m}, 0)$ |
| State constraint active | From $(2\,\mathrm{m},0)$: clipping reaches $1.046\,\mathrm{m/s}$ against a $0.5$ limit; MPC holds it and uses $1.000$ against $2.091\,\mathrm{m/s}$ of $\Delta v$ |
| Cost trap | Clipping shows the lower cost ($63.50$ against $74.70$) because it ignores the constraint |
| Authority | MPC does not create it: both recover from $0.24\,\mathrm{rad}$, neither from $0.26\,\mathrm{rad}$ |
| Use MPC when | Constraints bind, preview exists, plant or reference is time-varying, inputs share a limit |
| Use LQR when | Constraints rarely bind, CPU or certification budget is tight, classical margins are needed |
| Powered descent | Shrinking horizon, SOCP with lossless convexification, physical terminal condition, divert logic |
| Rendezvous | CW valid inside about a kilometer; corridor, keep-out, propellant cost, tubes; $N = 30$ at $T_s = 10\,\mathrm{s}$ is $5.5\,\mathrm{ms}$ at $100\,\mathrm{MFLOP/s}$ |
| Attitude | Rate limits, wheel envelopes, non-convex exclusion cones, manifold kinematics; $n = 9$, $m = 3$, $N = 20$ sparse is $0.86\,\mathrm{ms}$ at $1\,\mathrm{GFLOP/s}$ |
| Common architecture | Predictive outer layer, fixed-gain inner loop — the tube structure |

That is the module. The exercises take it from here: build the condensed QP and run the receding-horizon loop on the double integrator against clipped LQR; add a keep-out zone to a Clohessy–Wiltshire rendezvous and say honestly what the linearized constraint costs; and profile the solve until you can say which horizon fits a $20\,\mathrm{ms}$ frame and what you would need to certify it.

::: context fixed-point Why the gain never changes
A **fixed point** of a rule is an input the rule hands straight back. The Riccati step takes a cost matrix and returns the cost matrix for one more step of lookahead. The LQR matrix $\mathbf{P}$ is the one it returns unchanged — that is what the algebraic Riccati equation says. So if the terminal cost is already $\mathbf{P}$, one step back gives $\mathbf{P}$, two steps back give $\mathbf{P}$, and so on. Every horizon sees the same cost-to-go, so every horizon produces the same first-step gain.
:::

::: context saturation What clipping does
The saturation function passes a command through unchanged while it is inside the limits, and flattens it at the limit otherwise: $\mathrm{sat}(v) = \max(-1, \min(1, v))$ for limits of $\pm 1$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="85" x2="330" y2="85" stroke="#6c7a93" stroke-width="1"/>
  <line x1="180" y1="15" x2="180" y2="155" stroke="#6c7a93" stroke-width="1"/>
  <line x1="110" y1="155" x2="250" y2="15" stroke="#8fb8f0" stroke-width="1.5" stroke-dasharray="5 4"/>
  <polyline points="40,135 130,135 230,35 320,35" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <g font-size="11" fill="#1f2a44">
    <text x="236" y="30">+1</text><text x="100" y="150">−1</text>
    <text x="236" y="100">commanded −Kx</text>
    <text x="186" y="24">applied u</text>
    <text x="230" y="98" text-anchor="middle">1</text><text x="130" y="80" text-anchor="middle">−1</text>
  </g>
</svg>
```

Clipped LQR asks the gain what it wants and hands the thruster the flattened version. It never looks ahead, so it cannot know that braking now would avoid breaking a speed limit later.
:::

::: context null-controllable Which states can be saved at all
For $\ddot{\theta} = 4\theta + u$, the runaway part of the motion is $s = \dot{\theta} + 2\theta$, and it obeys $\dot{s} = 2s + u$. With $|u| \le 1$, the thruster can pull $s$ back only while $|s| < 0.5$. That makes a strip in the plane of angle and rate:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 215" font-family="Inter, Arial, sans-serif">
  <polygon points="127.5,30 40,30 40,80 232.5,190 320,190 320,140" fill="#8fb8f0" fill-opacity="0.45"/>
  <line x1="127.5" y1="30" x2="320" y2="140" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="40" y1="80" x2="232.5" y2="190" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="40" y1="110" x2="320" y2="110" stroke="#1f2a44" stroke-width="1"/>
  <line x1="180" y1="30" x2="180" y2="190" stroke="#1f2a44" stroke-width="1"/>
  <circle cx="264" cy="110" r="4" fill="#1f2a44"/>
  <circle cx="271" cy="110" r="4" fill="#b4232c"/>
  <circle cx="215" cy="70" r="4" fill="#b4232c"/>
  <g font-size="11" fill="#1f2a44">
    <text x="252" y="126" text-anchor="end">0.24 saved</text>
    <text x="280" y="126">0.26 lost</text>
    <text x="222" y="62">(0.10, 0.40) lost</text>
    <text x="316" y="104" text-anchor="end">θ (rad)</text>
    <text x="186" y="42">θ̇ (rad/s)</text>
    <text x="40" y="206">−0.4</text><text x="320" y="206" text-anchor="end">0.4</text>
    <text x="60" y="60">can be saved</text>
  </g>
</svg>
```

Outside the shaded strip no controller of any kind can win. (This is the continuous-time strip; the sampled system's is almost identical.)
:::

::: context glide-slope A cone to stay above the ground
A **glide slope** limits how shallow the approach can be. Picture an upside-down ice-cream cone standing on the landing pad: the vehicle must stay inside it, so it never skims low over the terrain on the way in. The constraint is a second-order cone — convex — which is one reason landing guidance fits so neatly into convex optimization.
:::

::: context max-q The roughest moment of ascent
**Max-q** is the point in a launch where dynamic pressure — $q = \tfrac{1}{2}\rho v^2$, the air's push on the vehicle — peaks. Air gets thinner as the rocket climbs, but its speed keeps rising, and for a moment the two combine to squeeze hardest. Many launchers throttle down through max-q to limit the load. For a controller, it means the plant's behavior changes sharply over a known stretch of time — exactly what a horizon can see coming.
:::

::: context lqr-margins What LQR promises about robustness
For continuous-time LQR with full state feedback, each input loop is guaranteed a gain margin from one half to infinity and a phase margin of at least $60^\circ$. You can halve the gain, or multiply it by any amount, and the loop stays stable. Sampled (discrete-time) LQR keeps weaker but still useful margins. An online optimization gives no such ready-made promise, because it has no fixed transfer function to measure.
:::

::: context lossless-convexification Making a hard problem easy, exactly
A rocket engine cannot throttle to zero — it has a minimum thrust. The set "thrust between a minimum and a maximum" is a hollow ring, not a solid disc, and hollow shapes are non-convex. Behçet Açıkmeşe and Scott Ploen showed in 2007 that you can fill in the hole with an extra variable, solve the easy convex problem, and prove the answer still lands on the ring. That is the "lossless" part. JPL and Masten Space Systems later flew it as G-FOLD on Masten's Xombie test rocket, in a series of flights starting in 2012, diverting to a new landing point in mid-flight.
:::

::: context clohessy-wiltshire Relative motion near a circular orbit
In 1960, W. H. Clohessy and R. S. Wiltshire published linear equations for how one spacecraft drifts relative to another in a nearby circular orbit. They are the standard model for rendezvous planning. Because they are linearized, they are accurate close in and drift wrong farther out — which is why this lesson trusts linear MPC inside about a kilometer.
:::

::: context approach-corridor The shapes a chaser must respect
The chaser must arrive along a cone that opens outward from the docking port, and must never enter a keep-out sphere around the target. The cone is convex; the outside of a sphere is not.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <circle cx="110" cy="90" r="62" fill="#f2b880" fill-opacity="0.35" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="6 4"/>
  <rect x="90" y="72" width="40" height="36" fill="#6c7a93"/>
  <rect x="130" y="84" width="8" height="12" fill="#1f2a44"/>
  <polygon points="138,90 340,30 340,150" fill="#8fb8f0" fill-opacity="0.45" stroke="#1d6fd1" stroke-width="1.5"/>
  <circle cx="300" cy="96" r="6" fill="#1f2a44"/>
  <polyline points="300,96 250,93 200,91 150,90" fill="none" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="3 3"/>
  <g font-size="11" fill="#1f2a44">
    <text x="110" y="20" text-anchor="middle">keep-out sphere</text>
    <text x="110" y="126" text-anchor="middle">target</text>
    <text x="270" y="60">approach corridor</text>
    <text x="300" y="118" text-anchor="middle">chaser</text>
  </g>
</svg>
```

Inside the corridor the path to the port avoids the sphere automatically; the hard part is getting into the corridor from wherever you start.
:::

::: context exclusion-cone Never look at the Sun
A star tracker is a small camera that recognizes star patterns. Sunlight flooding its lens blinds it, and a sensitive instrument can be damaged. So the Sun must stay outside a cone around the sensor's line of sight, typically some tens of degrees wide. "Stay outside a cone" is non-convex — you can go around it either way — which is why it needs the same care as a keep-out sphere.
:::

::: context unwinding Going the long way round
A quaternion and its negative describe the same orientation. A controller that treats them as different targets may drive the spacecraft through an almost full turn to reach the "other" one, even when a tiny turn would do. That wasted rotation is **unwinding**. Linear MPC on a small error angle avoids it only while the error really is small.
:::
