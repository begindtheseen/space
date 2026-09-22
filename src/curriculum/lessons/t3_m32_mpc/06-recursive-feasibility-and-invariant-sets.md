---
id: l06-recursive-feasibility-and-invariant-sets
title: Feasibility, recursive feasibility and invariant sets
minutes: 21
covers:
  - Feasibility, recursive feasibility, and the maximal control invariant set
---

A constrained controller has two ways to fail that an unconstrained one does not. It can have no answer now — the optimisation is infeasible at this cycle, and there is no command to apply. And it can have an answer now that leads to having none later: every cycle optimal, every constraint satisfied, right up to the cycle where the feasible set is empty and the controller stops.

The second failure is the interesting one, because nothing about it looks wrong while it is happening. This lesson defines the sets that make it precise, proves that the terminal ingredients of the previous lesson prevent it, computes those sets for the running example so the horizon trade becomes quantitative, and then shows a controller walking into infeasibility in a case where the ingredients were left out.

The sets involved — the $N$-step feasible set, the maximal control invariant set — are also the vocabulary for the robust formulations later in the module, so it is worth getting used to them here, where they can be drawn on a page.

## Feasibility now

Recall $\mathcal{X}_N$, the set of states from which the problem $P_N(\mathbf{x})$ has at least one solution. With a terminal set it is the set of states that can reach $\mathbb{X}_f$ in $N$ steps while satisfying every constraint on the way. It is where the controller is *defined*, and an MPC that is handed a state outside it produces nothing.

Initial feasibility is therefore a real design requirement, not a formality. The usual moment of danger is a mode change: another controller has been flying, the vehicle arrives in some state, and MPC takes over. If that state is outside $\mathcal{X}_N$ the first solve fails. Flight practice guards it three ways — an entry-condition check in the mode logic, a horizon long enough that $\mathcal{X}_N$ comfortably covers the handover envelope, and softened state constraints so the problem stays solvable from anywhere.

## Recursive feasibility

The property that keeps the controller alive after the first cycle is:

::: key Recursive feasibility
If a feasible plan exists now, one exists at the next step. Proved by shifting the previous solution forward and appending the terminal control law. Without it, MPC can walk itself into a state with no solution.
:::

The proof is Step 1 of the previous lesson's argument, and nothing more. If $\mathbf{U}^\star$ is feasible at $\mathbf{x}$, the shifted sequence $\tilde{\mathbf{U}} = (\mathbf{u}_1^\star,\dots,\mathbf{u}_{N-1}^\star, \boldsymbol{\kappa}_f(\mathbf{x}_N^\star))$ is feasible at $\mathbf{x}^+ = \mathbf{x}_1^\star$: its first $N-1$ inputs were already checked in the previous problem, and the appended one is admissible with the state staying in $\mathbb{X}_f$ because $\mathbb{X}_f$ is invariant under $\boldsymbol{\kappa}_f$. Hence $\mathbf{x} \in \mathcal{X}_N \Rightarrow \mathbf{x}^+ \in \mathcal{X}_N$: the feasible set is forward invariant under the MPC law, and feasibility at the first cycle is feasibility forever.

Three things are worth underlining. The argument needs no optimality — any feasible plan works, so an early-terminated solver that returns a feasible suboptimal sequence preserves feasibility. It needs the *nominal* model: $\mathbf{x}^+$ must be what the model predicted, which is exactly what a disturbance breaks, and which is why robust MPC exists. And it is constructive: the shifted sequence is a real candidate the software can hold on to, which is the basis of both warm starting and the standard fallback plan.

## The feasible sets, computed

$\mathcal{X}_N$ is built by a backward recursion. Define the **one-step predecessor set** of a set $\mathcal{S}$,

$$
\mathrm{Pre}(\mathcal{S}) = \{\mathbf{x} : \exists\, \mathbf{u} \in \mathbb{U} \ \text{ with } \ \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u} \in \mathcal{S}\} ,
$$

the states from which $\mathcal{S}$ is reachable in one admissible step. Then

$$
\mathcal{X}_0 = \mathbb{X}_f, \qquad \mathcal{X}_{k+1} = \mathrm{Pre}(\mathcal{X}_k) \cap \mathbb{X} ,
$$

and $\mathcal{X}_N$ is the $N$-th iterate. Each set is a polyhedron: $\mathrm{Pre}$ of a polyhedron is the projection of a polyhedron in $(\mathbf{x}, \mathbf{u})$ onto $\mathbf{x}$, which for a two-dimensional state and a scalar input is one Fourier–Motzkin elimination. The sets nest, $\mathcal{X}_0 \subseteq \mathcal{X}_1 \subseteq \cdots$, because $\mathbb{X}_f$ is invariant, and they grow toward the largest set from which the terminal set can be reached at all.

::: example How the region of attraction grows with the horizon
Running plant, $|u| \le 1\,\mathrm{m/s^2}$, $|x_2| \le 0.5\,\mathrm{m/s}$, terminal set $\mathbb{X}_f = O_\infty$ from the previous lesson. Computing the recursion:

| $N$ | facets of $\mathcal{X}_N$ | area ($\mathrm{m^2/s}$) | largest position error at rest |
| --- | --- | --- | --- |
| $0$ | $12$ | $0.712$ | $0.387\,\mathrm{m}$ |
| $1$ | $10$ | $0.935$ | $0.525\,\mathrm{m}$ |
| $2$ | $8$ | $1.137$ | $0.673\,\mathrm{m}$ |
| $5$ | $14$ | $1.668$ | $0.921\,\mathrm{m}$ |
| $10$ | $22$ | $2.241$ | $1.163\,\mathrm{m}$ |
| $20$ | $22$ | $3.240$ | $1.663\,\mathrm{m}$ |
| $30$ | $22$ | $4.240$ | $2.163\,\mathrm{m}$ |
| $60$ | $22$ | $7.240$ | $3.663\,\mathrm{m}$ |

Read the last column as the controller's advertised capability: with a twenty-step horizon, a vehicle at rest can be up to $1.66\,\mathrm{m}$ off station and the controller is guaranteed to bring it home; at $2\,\mathrm{m}$ it has no plan at all. The state $(2\,\mathrm{m}, 0)$ first becomes feasible at $N = 27$.

After the first dozen steps the growth is exactly linear — $0.05\,\mathrm{m}$ of reach and $0.1\,\mathrm{m^2/s}$ of area per additional horizon step — and the reason is physical rather than numerical: the velocity constraint caps the closing speed at $0.5\,\mathrm{m/s}$, so one more sample of $0.1\,\mathrm{s}$ buys exactly $0.05\,\mathrm{m}$ of extra reach. The facet count settles at $22$, so past that point the sets stop changing shape and only translate outward.

This is the horizon trade in its most concrete form. Doubling $N$ from $20$ to $40$ doubles nothing about the controller's quality near the origin — the law there is unchanged — and buys $1\,\mathrm{m}$ of extra region of attraction, for roughly double the solve time in the sparse formulation.
:::

::: key Choosing the horizon
$N$ must be long enough to reach the terminal set and to see the constraints that matter — typically covering the dominant closed-loop settling time. Solve time grows with $N$ (linearly in sparse form), so $N$ is the central cost and region-of-attraction trade.
:::

## The maximal control invariant set

$\mathcal{X}_N$ depends on the terminal set and the horizon, which are design choices. Behind them is a set that depends only on the plant and its constraints:

> The **maximal control invariant set** $\mathcal{C}_\infty$ is the largest set of states for which there exists an admissible input keeping the state in $\mathbb{X}$ forever: $\mathbf{x} \in \mathcal{C}_\infty$ if there is some $\mathbf{u} \in \mathbb{U}$ with $\mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u} \in \mathcal{C}_\infty$.

It is the outer limit of what *any* controller can do with these constraints. Outside $\mathcal{C}_\infty$, no control law, however clever, keeps the vehicle inside its envelope — the situation is already lost, and the only remaining question is how to lose it well. Inside, some law exists, though MPC with a given horizon and terminal set may still not find it.

The recursion is $\mathcal{C}_0 = \mathbb{X}$, $\mathcal{C}_{k+1} = \mathrm{Pre}(\mathcal{C}_k) \cap \mathcal{C}_k$, decreasing rather than increasing. It may terminate, in which case $\mathcal{C}_\infty$ is a polytope and is called finitely determined — or it may not.

::: example The braking parabola
Put the running vehicle on a docking approach with a wall: a hard constraint $x_1 \ge 0$, where $x_1$ is the distance to the port, with $|u| \le 1\,\mathrm{m/s^2}$ and no speed limit. Running the recursion from $\mathcal{C}_0 = \{x_1 \ge 0\}$, intersected with a box $|x_1| \le 12$, $|x_2| \le 4$ so the polygons stay bounded:

| iterations | facets | smallest $x_1$ at $x_2 = -1$ | at $x_2 = -2$ | at $x_2 = -3$ |
| --- | --- | --- | --- | --- |
| $0$ | $4$ | $0.000$ | $0.000$ | $0.000$ |
| $2$ | $8$ | $0.180$ | $0.380$ | $0.580$ |
| $5$ | $14$ | $0.375$ | $0.875$ | $1.375$ |
| $10$ | $24$ | $0.500$ | $1.500$ | $2.500$ |
| $20$ | $44$ | $0.500$ | $2.000$ | $4.000$ |
| $40$ | $84$ | $0.500$ | $2.000$ | $4.500$ |

The numbers converge to $0.5$, $2.0$ and $4.5$, which are $x_2^2/2$ — the stopping distance at maximum deceleration. The limit is the region above the **braking parabola**,

$$
\mathcal{C}_\infty = \{\mathbf{x} : x_1 \ge \tfrac{1}{2}x_2^2 \ \text{ when } x_2 < 0,\ \ x_1 \ge 0 \text{ otherwise}\} ,
$$

and it is convex but *not* a polytope: the recursion adds two facets at every iteration and never stops, because it is approximating a curve by tangent half-spaces. Each iteration handles one more sample of braking, so the velocities it has "finished" grow by $0.1\,\mathrm{m/s}$ per iteration, which is why $x_2 = -3$ needs thirty iterations to settle and $x_2 = -1$ needs ten.

The physical statement is one every guidance engineer already knows: you may approach a wall at whatever speed you like as long as you have the distance to stop. The set-theoretic machinery reproduces it exactly, which is a good reason to trust the machinery on problems where intuition runs out.
:::

## Walking into infeasibility

Now remove the terminal ingredients and watch the second failure mode happen. Same vehicle, same wall at $x_1 = 0$, and an aggressive tuning that wants to close fast: $\mathbf{Q} = \mathrm{diag}(10,\ 0.01)$, $R = 0.001$. The only constraints in the problem are $|u| \le 1$ and $x_1 \ge 0$ over the horizon. There is no terminal cost condition and no terminal set — a formulation that looks entirely reasonable and would pass a casual review.

::: example A controller that optimises its way into a collision
Starting from $3\,\mathrm{m}$ at rest with a three-step horizon, the controller commands full acceleration toward the port, because within $0.3\,\mathrm{s}$ the wall is nowhere in sight and the position error is expensive.

| $t$ (s) | $x_1$ (m) | $x_2$ (m/s) | stopping distance (m) | inside $\mathcal{C}_\infty$ | QP feasible |
| --- | --- | --- | --- | --- | --- |
| $1.2$ | $2.280$ | $-1.200$ | $0.720$ | yes | yes |
| $1.7$ | $1.555$ | $-1.700$ | $1.445$ | yes | yes |
| $1.8$ | $1.380$ | $-1.800$ | $1.620$ | **no** | yes |
| $2.0$ | $1.000$ | $-2.000$ | $2.000$ | no | yes |
| $2.1$ | $0.795$ | $-2.100$ | $2.205$ | no | yes |
| $2.2$ | $0.580$ | $-2.200$ | $2.420$ | no | **no** |

Two separate moments, and the order of them is the lesson. At $t = 1.8\,\mathrm{s}$ the vehicle crosses the braking parabola: from $(1.380, -1.800)$ it needs $1.62\,\mathrm{m}$ to stop and has $1.38\,\mathrm{m}$, so the collision is already unavoidable. The controller does not notice, because its three-step problem is still perfectly feasible — nothing inside $0.3\,\mathrm{s}$ of prediction is impossible. It keeps accelerating for four more cycles.

At $t = 2.2\,\mathrm{s}$, from $(0.580, -2.200)$, even the three-step problem has no solution: the best available plan puts $x_1$ below zero within the horizon. The controller returns nothing. By then the outcome was settled four cycles earlier.

Lengthening the horizon moves the wall of the cliff, it does not remove it: $N = 4$ fails at the same cycle, $N = 5$ at cycle $21$, $N = 6$ at cycle $20$ — earlier, because a longer-sighted controller brakes sooner and so reaches the doomed region at a slightly different point, but all of them get there. What removes the failure is a terminal condition that forces every plan to end somewhere the vehicle can hold, which is precisely what makes $\mathcal{X}_N$ invariant.
:::

::: warning Feasibility of a short-horizon problem is not a safety check
It is tempting to read "the QP solved" as "the vehicle is fine". The table above is the counterexample: four consecutive cycles where the optimiser returned an optimal, fully constraint-satisfying plan from a state that was already lost. A finite-horizon feasibility test can only certify what happens inside the horizon, and a vehicle with momentum has commitments beyond it. The repairs, in increasing order of rigour: extend the horizon past the worst-case stopping time, which is the crudest and most common; add a terminal set in which the vehicle can be held indefinitely, which makes the guarantee exact; or monitor membership of $\mathcal{C}_\infty$ separately, which for a braking constraint costs one comparison against $x_2^2/2a$ and is the kind of check a simple, certifiable monitor can run alongside the optimiser.
:::

## What still breaks it

Recursive feasibility as proved above is a *nominal* property. It assumes the vehicle arrives at exactly the state the model predicted. In flight it does not, and three effects break the argument.

A **disturbance** moves the true next state off the predicted one, possibly outside $\mathcal{X}_N$. This is the failure that robust MPC addresses directly, by tightening the constraints so that a nominal plan leaves room for the disturbance — the subject of the robust lesson later in this module.

**Model error** has the same effect more slowly, and shows up as a mismatch between the predicted and measured state that a disturbance estimator can partly absorb.

**Navigation error** moves the *believed* state, which can jump across a constraint boundary when a filter update lands. A formulation with hard state constraints can be made infeasible by a measurement.

The practical formulation therefore layers the defences: soften the state constraints so that a solution always exists; keep the terminal ingredients so that the nominal argument holds and the softening is rarely needed; size the constraint margins against the disturbance and the navigation covariance; and carry the shifted previous plan as a fallback for the cycle where the solver does not return.

## Check yourself

::: check
Show that $\mathcal{X}_N \subseteq \mathcal{X}_{N+1}$ for a terminal set that is invariant under the terminal law, and explain why the inclusion can fail if $\mathbb{X}_f$ is not invariant.
:::

::: answer
Take $\mathbf{x} \in \mathcal{X}_N$ with feasible inputs $(\mathbf{u}_0,\dots,\mathbf{u}_{N-1})$ ending at $\mathbf{x}_N \in \mathbb{X}_f$. Append $\boldsymbol{\kappa}_f(\mathbf{x}_N)$: the extra input is admissible and the extra state $\mathbf{A}\mathbf{x}_N + \mathbf{B}\boldsymbol{\kappa}_f(\mathbf{x}_N)$ lies in $\mathbb{X}_f \subseteq \mathbb{X}$ by invariance, so the extended sequence is feasible for the $(N+1)$-step problem and $\mathbf{x} \in \mathcal{X}_{N+1}$. If $\mathbb{X}_f$ were merely constraint-admissible and not invariant, the appended step could leave it, the extended sequence would not satisfy the terminal constraint, and there would be no reason for the inclusion to hold — a longer horizon could then have a *smaller* feasible set, which is exactly the pathology the invariance condition exists to rule out.
:::

::: check
For the running plant, how long a horizon do you need for the controller to be defined at $(3\,\mathrm{m}, 0)$, and what does that cost?
:::

::: answer
The largest position error at rest grows by $0.05\,\mathrm{m}$ per horizon step once the growth is linear, and the table gives $1.663\,\mathrm{m}$ at $N = 20$. Reaching $3\,\mathrm{m}$ needs about $(3 - 1.663)/0.05 = 27$ more steps, so $N \approx 47$; the table's $N = 60$ entry, at $3.663\,\mathrm{m}$, confirms the rate. The cost is solve time: in the sparse formulation it grows linearly, so $N = 47$ is about $2.4$ times the work of $N = 20$, and in the condensed formulation it grows cubically, about $13$ times. The alternative is to change the physics rather than the horizon — raising the speed limit from $0.5$ to $1.0\,\mathrm{m/s}$ doubles the reach per step, since the limit is what caps the closing rate.
:::

::: check
A colleague says their MPC "has never gone infeasible in a thousand Monte-Carlo runs, so recursive feasibility is not a concern". What is wrong with the argument?
:::

::: answer
It confuses evidence with a guarantee, and the wall example shows why the evidence is weak. Infeasibility is a tail event: it occurs at a particular combination of state, disturbance and constraint geometry, and a campaign that does not deliberately drive the vehicle toward the boundary of $\mathcal{X}_N$ will rarely find it. The failure is also silent until the last moment — in the example, four cycles of optimal, feasible, constraint-satisfying behaviour preceded it, so a run truncated before the final cycle looks like a success. Recursive feasibility is cheap to obtain structurally, through the terminal ingredients, and cheap to instrument, by logging the minimum constraint margin and the value function. The right response is to add both, and to design the campaign to hunt for the boundary rather than to sample the middle.
:::

::: check
Why is the maximal control invariant set for the wall problem not a polytope, given that both $\mathbb{X}$ and $\mathbb{U}$ are polyhedra?
:::

::: answer
Because the limit of a decreasing sequence of polytopes need not be a polytope. Each iteration of the recursion adds the states that can be held for one more step, and for the braking problem that means resolving one more sample of the deceleration profile; the boundary it converges to is the locus where the stopping distance exactly equals the remaining distance, $x_1 = x_2^2/2$, a parabola. A parabola is the intersection of infinitely many half-spaces — its tangents — and the recursion produces them two at a time, which is why the facet count grows by two per step and the iteration never terminates. Finite determination is a property of particular problems, not a theorem: it holds, for example, for the terminal set of the previous lesson, where the closed loop is stable and the recursion closed after four propagations.
:::

::: check
Your MPC is recursively feasible by construction, and in flight the solver reports infeasible. Name three causes and the immediate response.
:::

::: answer
First, the true state left $\mathcal{X}_N$ because reality differed from the nominal model — a disturbance, a thruster underperforming, an unmodelled torque. Second, the state estimate moved, not the vehicle: a filter update or a sensor glitch put the believed state outside, which a hard state constraint converts into infeasibility. Third, the formulation does not have the property it was claimed to have — a terminal set that is admissible but not invariant, a constraint added later without being included in the set computation, a horizon shortened for timing after the sets were computed. The immediate response is not to diagnose: apply the fallback. Flight software should hold the shifted previous plan and a certified simple law, switch deterministically when the solve fails, count the event in telemetry, and let the ground work out which of the three it was. The diagnosis needs the logged state, slack vector and value function, and it happens after the vehicle is safe.
:::

## Summary

| Object | Statement |
| --- | --- |
| Feasible set | $\mathcal{X}_N$: states from which $P_N$ has a solution; where the controller is defined |
| Recursive feasibility | Feasible now implies feasible next step; proved by the shifted candidate plus $\boldsymbol{\kappa}_f$ |
| Needs | Nominal model and an invariant terminal set; not optimality of the solve |
| Predecessor set | $\mathrm{Pre}(\mathcal{S}) = \{\mathbf{x} : \exists \mathbf{u} \in \mathbb{U},\ \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u} \in \mathcal{S}\}$ |
| Recursion | $\mathcal{X}_0 = \mathbb{X}_f$, $\mathcal{X}_{k+1} = \mathrm{Pre}(\mathcal{X}_k) \cap \mathbb{X}$; nested and growing |
| Computed reach | $0.387\,\mathrm{m}$ at rest for $\mathbb{X}_f$, $1.663\,\mathrm{m}$ at $N = 20$, $+0.05\,\mathrm{m}$ per step ($= v_{\max}T_s$) |
| Maximal control invariant set | $\mathcal{C}_\infty$: largest set where some admissible input keeps the state in $\mathbb{X}$ forever; $\mathcal{C}_{k+1} = \mathrm{Pre}(\mathcal{C}_k) \cap \mathcal{C}_k$ |
| Wall example | $\mathcal{C}_\infty = \{x_1 \ge \tfrac{1}{2}x_2^2\}$, the braking parabola; recursion adds two facets per step, never terminates |
| Walking into infeasibility | Leaves $\mathcal{C}_\infty$ at $t = 1.8\,\mathrm{s}$, QP still feasible until $t = 2.2\,\mathrm{s}$ |
| What breaks it | Disturbance, model error, navigation jump — all break the nominal assumption |
| Defences | Soften state constraints, keep terminal ingredients, margin against disturbance and navigation, fallback plan |

The next lesson takes the disturbance seriously: tube MPC and min-max formulations, which restore the feasibility and stability guarantees in the presence of a bounded disturbance rather than assuming it away.
