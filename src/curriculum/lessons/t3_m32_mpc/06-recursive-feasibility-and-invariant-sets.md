---
id: l06-recursive-feasibility-and-invariant-sets
title: Feasibility, recursive feasibility and invariant sets
minutes: 22
covers:
  - Feasibility, recursive feasibility, and the maximal control invariant set
---

Picture riding a bike toward a busy road. Up to a certain point, you can still brake and stop before the road. Past that point, you cannot — even though nothing has happened yet, and every second of the ride so far felt fine. The crash is already decided. You have not reached it yet.

A constrained controller can fail in two ways that an unconstrained one cannot. It can have **no answer now**: the optimization is infeasible this cycle, and there is no command to send. Or it can have **an answer now that leads to none later**: every cycle optimal, every constraint met, right up to the cycle where the feasible set is empty and the controller stops. The second failure is the bike past the braking point. Nothing about it looks wrong while it is happening.

This lesson defines the sets that make this precise. It proves that the terminal ingredients of the previous lesson prevent the second failure. It computes the sets for the running example, so the horizon trade becomes numbers. And it shows a controller riding past the braking point in a case where the ingredients were left out.

The sets here — the $N$-step feasible set and the maximal control invariant set — are also the vocabulary of the robust formulations later in the module. It is worth getting used to them now, while they can still be drawn on a page.

## Feasibility now

Recall $\mathcal{X}_N$ ("script X sub N"), the **feasible set**: the states from which the problem $P_N(\mathbf{x})$ has at least one solution. With a terminal set, it is the set of states that can reach $\mathbb{X}_f$ in $N$ steps while obeying every constraint on the way. It is where the controller is *defined*. Hand an MPC a state outside it and it produces nothing.

So being feasible at the start is a real design requirement, not a formality. The usual moment of danger is a **[[mode change|mode-handover]]**: another controller has been flying, the vehicle arrives in some state, and MPC takes over. If that state is outside $\mathcal{X}_N$, the very first solve fails. Flight designs guard against this three ways: an entry check in the mode logic, a horizon long enough that $\mathcal{X}_N$ comfortably covers the handover conditions, and softened state constraints so the problem stays solvable from anywhere.

## Recursive feasibility

The property that keeps the controller alive after the first cycle is this one.

::: key Recursive feasibility
If a feasible plan exists now, one exists at the next step. Proved by shifting the previous solution forward and appending the terminal control law. Without it, MPC can walk itself into a state with no solution.
:::

The proof is Step 1 of the previous lesson's argument, and nothing more. Suppose $\mathbf{U}^\star$ is feasible at $\mathbf{x}$. Then the shifted plan

$$
\tilde{\mathbf{U}} = \big(\mathbf{u}_1^\star,\dots,\mathbf{u}_{N-1}^\star,\ \boldsymbol{\kappa}_f(\mathbf{x}_N^\star)\big)
$$

is feasible at the next state $\mathbf{x}^+ = \mathbf{x}_1^\star$. Its first $N-1$ inputs were already checked last cycle. The one appended at the end is allowed, and keeps the state in $\mathbb{X}_f$, because $\mathbb{X}_f$ is invariant under $\boldsymbol{\kappa}_f$. So

$$
\mathbf{x} \in \mathcal{X}_N \;\Rightarrow\; \mathbf{x}^+ \in \mathcal{X}_N .
$$

The feasible set is **[[forward invariant|forward-invariant]]** under the MPC law: once in, never out. Feasible at the first cycle means feasible forever.

Three things are worth underlining.

- **It needs no optimality.** Any feasible plan works. A solver stopped early, returning a feasible but not-quite-best plan, still keeps feasibility.
- **It needs the nominal model** — the model with no disturbance. $\mathbf{x}^+$ must be exactly what the model predicted. A disturbance breaks that, which is why robust MPC exists.
- **It is constructive.** The shifted plan is a real plan the software can keep in memory. That is the basis of both **[[warm starting|warm-start-bridge]]** and the standard fallback plan.

## The feasible sets, computed

How do you find $\mathcal{X}_N$? Work backward from the finish, the way you might plan a trip by asking "where could I be one hour before arriving?", then "two hours before?".

The tool is the **one-step predecessor set** of a set $\mathcal{S}$ ("script S"):

$$
\mathrm{Pre}(\mathcal{S}) = \{\mathbf{x} : \exists\, \mathbf{u} \in \mathbb{U} \ \text{ with } \ \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u} \in \mathcal{S}\} .
$$

Read it as: "the states $\mathbf{x}$ for which there exists ($\exists$) an allowed input that lands the next state in $\mathcal{S}$". These are the states from which $\mathcal{S}$ is **[[one allowed step away|pre-picture]]**. Then

$$
\mathcal{X}_0 = \mathbb{X}_f, \qquad \mathcal{X}_{k+1} = \mathrm{Pre}(\mathcal{X}_k) \cap \mathbb{X} ,
$$

and $\mathcal{X}_N$ is the $N$-th step of this recursion. The $\cap \mathbb{X}$ ("intersect X") keeps only states that obey the state constraints themselves.

Each set is a polyhedron — a flat-sided region. Computing $\mathrm{Pre}$ of a polyhedron means taking a flat-sided region in the combined $(\mathbf{x}, \mathbf{u})$ space and squashing it flat onto the $\mathbf{x}$ axes, removing $\mathbf{u}$. For a two-number state and one input, that is a single step of **[[Fourier–Motzkin elimination|fourier-motzkin]]**.

The sets nest, $\mathcal{X}_0 \subseteq \mathcal{X}_1 \subseteq \cdots$, because $\mathbb{X}_f$ is invariant. (The first check question below asks you to prove it.) They grow toward the largest set from which the terminal set can be reached at all.

::: example How the region of attraction grows with the horizon
Running plant, $|u| \le 1\,\mathrm{m/s^2}$, $|x_2| \le 0.5\,\mathrm{m/s}$, terminal set $\mathbb{X}_f = O_\infty$ from the previous lesson. Running the recursion:

| $N$ | sides of $\mathcal{X}_N$ | area ($\mathrm{m^2/s}$) | largest position error at rest |
| --- | --- | --- | --- |
| $0$ | $12$ | $0.712$ | $0.387\,\mathrm{m}$ |
| $1$ | $10$ | $0.935$ | $0.525\,\mathrm{m}$ |
| $2$ | $8$ | $1.137$ | $0.673\,\mathrm{m}$ |
| $5$ | $14$ | $1.668$ | $0.921\,\mathrm{m}$ |
| $10$ | $22$ | $2.241$ | $1.163\,\mathrm{m}$ |
| $20$ | $22$ | $3.240$ | $1.663\,\mathrm{m}$ |
| $30$ | $22$ | $4.240$ | $2.163\,\mathrm{m}$ |
| $60$ | $22$ | $7.240$ | $3.663\,\mathrm{m}$ |

Read the last column as the controller's promise. With a twenty-step horizon, a vehicle at rest up to $1.66\,\mathrm{m}$ off station is guaranteed to be brought home. At $2\,\mathrm{m}$ it has no plan at all. The state $(2\,\mathrm{m}, 0)$ first becomes feasible at $N = 27$.

After about ten steps the growth is exactly steady: $0.05\,\mathrm{m}$ of reach and $0.1\,\mathrm{m^2/s}$ of area per extra horizon step. Check the reach: from $N = 20$ to $N = 30$, $2.163 - 1.663 = 0.500\,\mathrm{m}$ in ten steps, or $0.05\,\mathrm{m}$ each. The reason is physical, not numerical. The speed limit caps closing speed at $0.5\,\mathrm{m/s}$, so one more sample of $0.1\,\mathrm{s}$ buys exactly $0.5 \times 0.1 = 0.05\,\mathrm{m}$ of extra reach. The side count settles at $22$: past that point the sets stop changing shape and only [[slide outward|growing-sets]].

This is the horizon trade in its plainest form. Doubling $N$ from $20$ to $40$ changes nothing about the controller's behavior near the origin — the law there is the same — and buys $1\,\mathrm{m}$ of extra reach, for roughly double the solve time in the sparse formulation.
:::

::: key Choosing the horizon
$N$ must be long enough to reach the terminal set and to see the constraints that matter — typically covering the dominant closed-loop settling time. Solve time grows with $N$ (linearly in sparse form), so $N$ is the central cost and region-of-attraction trade.
:::

## The maximal control invariant set

$\mathcal{X}_N$ depends on the terminal set and the horizon, which you choose. Behind them sits a set that depends only on the vehicle and its limits.

> The **maximal control invariant set** $\mathcal{C}_\infty$ ("C infinity") is the largest set of states for which some allowed input keeps the state inside $\mathbb{X}$ forever: every $\mathbf{x} \in \mathcal{C}_\infty$ has some $\mathbf{u} \in \mathbb{U}$ with $\mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u} \in \mathcal{C}_\infty$.

It is the outer limit of what *any* controller can do with these limits. Outside $\mathcal{C}_\infty$, no control law, however clever, keeps the vehicle inside its envelope. The situation is already lost, and the only question left is how to lose it well. Inside, some law exists — though MPC with a given horizon and terminal set may still not find it.

The recursion runs the other way, shrinking instead of growing:

$$
\mathcal{C}_0 = \mathbb{X}, \qquad \mathcal{C}_{k+1} = \mathrm{Pre}(\mathcal{C}_k) \cap \mathcal{C}_k .
$$

Start with every state that obeys the constraints now. Keep those that can stay in for one more step, then two, and so on. It may stop after finitely many steps, in which case $\mathcal{C}_\infty$ is a polytope and is called **finitely determined**. Or it may never stop.

::: example The braking parabola
Put the running vehicle on a docking approach toward a wall. Let $x_1$ be the distance to the port, with the hard constraint $x_1 \ge 0$, thrust limit $|u| \le 1\,\mathrm{m/s^2}$, and no speed limit. Run the recursion from $\mathcal{C}_0 = \{x_1 \ge 0\}$, intersected with a box $|x_1| \le 12$, $|x_2| \le 4$ so the polygons stay bounded. At three approach speeds, how close to the wall can a state be and still be saved?

| iterations | sides | smallest $x_1$ at $x_2 = -1$ | at $x_2 = -2$ | at $x_2 = -3$ |
| --- | --- | --- | --- | --- |
| $0$ | $4$ | $0.000$ | $0.000$ | $0.000$ |
| $2$ | $8$ | $0.180$ | $0.380$ | $0.580$ |
| $5$ | $14$ | $0.375$ | $0.875$ | $1.375$ |
| $10$ | $24$ | $0.500$ | $1.500$ | $2.500$ |
| $20$ | $44$ | $0.500$ | $2.000$ | $4.000$ |
| $40$ | $84$ | $0.500$ | $2.000$ | $4.500$ |

The numbers settle at $0.5$, $2.0$ and $4.5$. Those are $x_2^2/2$: $1^2/2 = 0.5$, $2^2/2 = 2$, $3^2/2 = 4.5$ — the stopping distance at full braking of $1\,\mathrm{m/s^2}$. So the limit, near the wall, is the region on the safe side of the **[[braking parabola|braking-parabola]]**:

$$
\mathcal{C}_\infty = \{\mathbf{x} : x_1 \ge \tfrac{1}{2}x_2^2 \ \text{ when } x_2 < 0,\ \ x_1 \ge 0 \text{ otherwise}\} .
$$

This set is convex but *not* a polytope, because its edge is curved. The recursion builds the curve out of straight tangent lines and adds two sides every iteration. Each iteration handles one more sample of braking, so the speeds it has "finished" grow by $0.1\,\mathrm{m/s}$ per iteration. That is why $x_2 = -1$ settles after ten iterations and $x_2 = -3$ after thirty. With the bounding box, the loop does stop — after $40$ iterations, once it has handled every speed up to the box's $4\,\mathrm{m/s}$. Without the box it would add sides forever.

The physical statement is one every driver knows: you may approach a wall as fast as you like, as long as you have room to stop. The set machinery rebuilds that fact exactly — a good reason to trust it on problems where intuition runs out.
:::

## Walking into infeasibility

Now remove the terminal ingredients and watch the second failure happen. Same vehicle, same wall at $x_1 = 0$, and an eager tuning that wants to close fast: $\mathbf{Q} = \mathrm{diag}(10,\ 0.01)$, $R = 0.001$ ($\mathrm{diag}$ means the numbers sit on the diagonal of the matrix). The only constraints are $|u| \le 1$ and $x_1 \ge 0$ over the horizon. There is no terminal condition and no terminal set. It looks entirely reasonable and would pass a casual review.

::: example A controller that optimizes its way into a collision
Start $3\,\mathrm{m}$ from the wall, at rest, with a three-step horizon. The controller commands full acceleration toward the port. Within $0.3\,\mathrm{s}$ of prediction the wall is nowhere in sight, and the position error is expensive. The last column but one checks the braking parabola: is the distance left at least the stopping distance $x_2^2/2$?

| $t$ (s) | $x_1$ (m) | $x_2$ (m/s) | stopping distance (m) | inside $\mathcal{C}_\infty$ | QP feasible |
| --- | --- | --- | --- | --- | --- |
| $1.2$ | $2.280$ | $-1.200$ | $0.720$ | yes | yes |
| $1.7$ | $1.555$ | $-1.700$ | $1.445$ | yes | yes |
| $1.8$ | $1.380$ | $-1.800$ | $1.620$ | **no** | yes |
| $2.0$ | $1.000$ | $-2.000$ | $2.000$ | no | yes |
| $2.1$ | $0.795$ | $-2.100$ | $2.205$ | no | yes |
| $2.2$ | $0.580$ | $-2.200$ | $2.420$ | no | **no** |

Check a row: at $t = 1.8$, stopping takes $1.8^2/2 = 1.62\,\mathrm{m}$ and only $1.38\,\mathrm{m}$ is left. So the collision is already unavoidable — the bike is past the braking point. The controller does not notice, because its three-step problem is still perfectly feasible: nothing within $0.3\,\mathrm{s}$ is impossible yet. It keeps accelerating for four more cycles.

At $t = 2.2\,\mathrm{s}$, from $(0.580, -2.200)$, even the three-step problem has no solution: every plan puts $x_1$ below zero within the horizon. The controller returns nothing. The outcome was settled four cycles earlier. Two separate moments, in that order — that is the lesson.

A longer horizon moves the cliff edge; it does not remove it. With $N = 4$ the QP fails at the same cycle, $22$. With $N = 5$ it fails at cycle $21$, and with $N = 6$ at cycle $20$. All of these controllers leave $\mathcal{C}_\infty$ at the same cycle, $18$. The longer-sighted ones only *notice* sooner, because the unavoidable crash enters their prediction window sooner. What removes the failure is a terminal condition that forces every plan to end somewhere the vehicle can be held — exactly what makes $\mathcal{X}_N$ invariant.
:::

::: warning Feasibility of a short-horizon problem is not a safety check
It is tempting to read "the QP solved" as "the vehicle is fine". The table is the counterexample: four cycles in a row where the optimizer returned an optimal plan that met every constraint, from a state that was already lost. A finite-horizon test can only vouch for what happens inside the horizon, and a vehicle with momentum has commitments beyond it.

The repairs, from crudest to most rigorous: make the horizon longer than the worst-case stopping time (the most common); add a terminal set where the vehicle can be held forever (which makes the guarantee exact); or check membership of $\mathcal{C}_\infty$ separately. For a braking constraint that last check is one comparison against $x_2^2/2a$, with $a$ the braking acceleration — the kind of check a simple, certifiable monitor can run beside the optimizer.
:::

## What still breaks it

Recursive feasibility as proved above is a *nominal* property. It assumes the vehicle arrives at exactly the state the model predicted. In flight it does not, and three effects break the argument.

A **disturbance** moves the true next state off the predicted one, possibly outside $\mathcal{X}_N$. Robust MPC attacks this directly, by tightening the constraints so a nominal plan leaves room for the disturbance — the subject of the next lesson.

**Model error** has the same effect more slowly. It shows up as a gap between predicted and measured states, which a disturbance estimator can partly absorb.

**Navigation error** moves the *believed* state. It can jump across a constraint boundary when a **[[filter update|filter-jump]]** lands. With hard state constraints, a measurement alone can make the problem infeasible.

So the practical design stacks its defenses. Soften the state constraints so a solution always exists. Keep the terminal ingredients so the nominal argument holds and softening is rarely needed. Size the constraint margins against the disturbance and the navigation uncertainty. And carry the shifted previous plan as a fallback for the cycle where the solver does not return.

## Check yourself

::: check
Show that $\mathcal{X}_N \subseteq \mathcal{X}_{N+1}$ when the terminal set is invariant under the terminal law. Then explain why this can fail if $\mathbb{X}_f$ is not invariant.
:::

::: answer
Take $\mathbf{x} \in \mathcal{X}_N$, with feasible inputs $(\mathbf{u}_0,\dots,\mathbf{u}_{N-1})$ ending at $\mathbf{x}_N \in \mathbb{X}_f$. Append one more input, $\boldsymbol{\kappa}_f(\mathbf{x}_N)$. It is allowed, and the extra state $\mathbf{A}\mathbf{x}_N + \mathbf{B}\boldsymbol{\kappa}_f(\mathbf{x}_N)$ lies in $\mathbb{X}_f \subseteq \mathbb{X}$ by invariance. So the longer sequence is feasible for the $(N+1)$-step problem, and $\mathbf{x} \in \mathcal{X}_{N+1}$.

If $\mathbb{X}_f$ merely obeyed the constraints but was not invariant, the appended step could leave it. The longer sequence would then break the terminal constraint, and there would be no reason for the inclusion to hold. A longer horizon could even have a *smaller* feasible set — exactly the oddity the invariance condition exists to rule out.
:::

::: check
For the running plant, how long a horizon do you need for the controller to be defined at $(3\,\mathrm{m}, 0)$, and what does that cost?
:::

::: answer
Once the growth is steady, the largest position error at rest grows by $0.05\,\mathrm{m}$ per horizon step, and the table gives $1.663\,\mathrm{m}$ at $N = 20$. Reaching $3\,\mathrm{m}$ needs $(3 - 1.663)/0.05 = 26.7$, so $27$ more steps: $N \approx 47$. The table's $N = 60$ entry, $1.663 + 40 \times 0.05 = 3.663\,\mathrm{m}$, confirms the rate.

The cost is solve time. In the sparse formulation it grows linearly, so $N = 47$ is about $47/20 = 2.4$ times the work of $N = 20$. In the condensed formulation it grows as the cube, about $(47/20)^3 \approx 13$ times. The alternative is to change the physics instead of the horizon: raising the speed limit from $0.5$ to $1.0\,\mathrm{m/s}$ doubles the reach per step, since the limit is what caps the closing rate.
:::

::: check
A colleague says their MPC "has never gone infeasible in a thousand Monte Carlo runs, so recursive feasibility is not a concern". What is wrong with the argument?
:::

::: answer
It mistakes evidence for a guarantee, and the wall example shows why the evidence is weak. Infeasibility is a **[[tail event|tail-event]]**: it happens at a particular mix of state, disturbance and constraint shape, and a campaign that does not deliberately push the vehicle toward the edge of $\mathcal{X}_N$ will rarely find it. The failure is also silent until the last moment. In the example, four cycles of optimal, feasible, constraint-obeying behavior came first, so a run cut off before the final cycle looks like a success.

Recursive feasibility is cheap to get by design, through the terminal ingredients, and cheap to monitor, by logging the smallest constraint margin and the optimal cost. The right response is to do both, and to design the campaign to hunt for the boundary instead of sampling the middle.
:::

::: check
Why is the maximal control invariant set for the wall problem not a polytope, even though $\mathbb{X}$ and $\mathbb{U}$ are both flat-sided?
:::

::: answer
Because the limit of a shrinking sequence of polytopes need not be a polytope. Each iteration adds the states that can be held for one more step, which for braking means handling one more sample of the slowdown. The edge it converges to is where stopping distance exactly equals the distance left, $x_1 = x_2^2/2$ — a parabola.

A parabola's safe side is the intersection of infinitely many half-planes, one along each tangent line. The recursion produces them two at a time, which is why the side count grows by two per step and, without an artificial speed box, never stops. Being finitely determined is a property of particular problems, not a theorem. It does hold, for example, for the terminal set of the previous lesson, where the closed loop is stable and the loop closed after four pushes.
:::

::: check
Your MPC is recursively feasible by construction, yet in flight the solver reports "infeasible". Name three causes and the immediate response.
:::

::: answer
**First**, the true state left $\mathcal{X}_N$ because reality differed from the model: a disturbance, a weak thruster, an unmodeled torque. **Second**, the estimate moved, not the vehicle: a filter update or a sensor glitch put the *believed* state outside, which a hard state constraint turns into infeasibility. **Third**, the formulation does not really have the property claimed for it: a terminal set that obeys the constraints but is not invariant, a constraint added later but left out of the set computation, or a horizon shortened for timing after the sets were computed.

The immediate response is not to diagnose. Apply the fallback. Flight software should hold the shifted previous plan and a certified simple law, switch to them deterministically when the solve fails, count the event in telemetry, and let the ground work out which of the three it was. That diagnosis needs the logged state, slack vector and optimal cost, and it happens after the vehicle is safe.
:::

## Summary

| Idea | In one line |
| --- | --- |
| Feasible set | $\mathcal{X}_N$: states from which $P_N$ has a solution; where the controller is defined |
| Recursive feasibility | Feasible now implies feasible next step; proved by the shifted plan plus $\boldsymbol{\kappa}_f$ |
| Needs | Nominal model and an invariant terminal set; not optimality of the solve |
| Predecessor set | $\mathrm{Pre}(\mathcal{S}) = \{\mathbf{x} : \exists \mathbf{u} \in \mathbb{U},\ \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u} \in \mathcal{S}\}$ |
| Recursion | $\mathcal{X}_0 = \mathbb{X}_f$, $\mathcal{X}_{k+1} = \mathrm{Pre}(\mathcal{X}_k) \cap \mathbb{X}$; nested and growing |
| Computed reach | $0.387\,\mathrm{m}$ at rest for $\mathbb{X}_f$, $1.663\,\mathrm{m}$ at $N = 20$, $+0.05\,\mathrm{m}$ per step ($= v_{\max}T_s$) |
| Maximal control invariant set | $\mathcal{C}_\infty$: largest set where some allowed input keeps the state in $\mathbb{X}$ forever; $\mathcal{C}_{k+1} = \mathrm{Pre}(\mathcal{C}_k) \cap \mathcal{C}_k$ |
| Wall example | $\mathcal{C}_\infty = \{x_1 \ge \tfrac{1}{2}x_2^2\}$ near the wall, the braking parabola; two new sides per iteration |
| Walking into infeasibility | Leaves $\mathcal{C}_\infty$ at $t = 1.8\,\mathrm{s}$; the QP stays feasible until $t = 2.2\,\mathrm{s}$ |
| What breaks it | Disturbance, model error, navigation jump — all break the nominal assumption |
| Defenses | Soften state constraints, keep terminal ingredients, margin against disturbance and navigation, fallback plan |

The next lesson takes the disturbance seriously: tube MPC and min-max formulations, which bring back the feasibility and stability guarantees in the presence of a bounded disturbance, instead of assuming it away.

::: context mode-handover Handing over the controls
Spacecraft switch controllers the way a relay team switches runners. A rendezvous might go from long-range orbit maneuvers, to a closer approach mode, to final docking, each with its own software. The moment of switching is risky: the new controller inherits whatever state the old one left. Flight software therefore checks **entry conditions** — "is the vehicle slow enough, close enough, pointed well enough?" — before it hands over, and holds the old mode if the answer is no.
:::

::: context forward-invariant A room with a one-way door
A set is **forward invariant** under a control law if a vehicle that starts inside it stays inside it forever, whatever happens next under that law. Think of a room whose door only opens inward. Once you are in, every step you take keeps you in. Recursive feasibility says the set of states where MPC has an answer is such a room. That is why checking feasibility once, at the start, is enough — in the nominal world, at least.
:::

::: context warm-start-bridge The same trick, used for speed
The shifted plan from the proof reappears in the real-time lesson, doing a different job. There it is handed to the solver as a starting guess: last cycle's answer, moved one step along, with the terminal law added at the end. Because the new problem is almost the same as the old one, the guess is already close, and the solver often needs far fewer iterations. The proof needs the shifted plan to be *feasible*; the solver likes it because it is *nearly optimal*.
:::

::: context pre-picture One step back from a target
The picture shows a target set $\mathcal{S}$ and one state $\mathbf{x}$. With zero input, the next state is $\mathbf{A}\mathbf{x}$. Each allowed input $u$ between $-1$ and $1$ adds $\mathbf{B}u$, so the reachable next states form a short segment centered on $\mathbf{A}\mathbf{x}$. If any part of that segment touches $\mathcal{S}$, then $\mathbf{x}$ is in $\mathrm{Pre}(\mathcal{S})$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <polygon points="220,40 320,55 330,130 230,140 200,95" fill="#8fb8f0" fill-opacity="0.6" stroke="#1d6fd1" stroke-width="2"/>
  <text x="290" y="100" font-size="13" fill="#1f2a44">S</text>
  <circle cx="60" cy="120" r="5" fill="#1f2a44"/>
  <text x="44" y="142" font-size="12" fill="#1f2a44">x</text>
  <line x1="60" y1="120" x2="178" y2="96" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <line x1="150" y1="126" x2="230" y2="66" stroke="#b4232c" stroke-width="3"/>
  <circle cx="190" cy="96" r="4" fill="#1f2a44"/>
  <text x="150" y="88" font-size="12" fill="#1f2a44">Ax</text>
  <text x="120" y="150" font-size="12" fill="#b4232c">Ax + Bu, −1 ≤ u ≤ 1</text>
</svg>
```

The red segment reaches into $\mathcal{S}$, so some allowed input lands the vehicle there.
:::

::: context fourier-motzkin Removing a variable from inequalities
Joseph Fourier described the method in the 1820s, and Theodore Motzkin rediscovered and studied it in his 1936 thesis. To get rid of one variable, say $u$, sort the inequalities into those that give $u$ an upper bound, those that give it a lower bound, and those without it. Some $u$ exists exactly when every lower bound is below every upper bound. Pairing each lower bound with each upper bound gives new inequalities without $u$. It is exact, but the number of inequalities can multiply quickly — which is why it is only practical for small problems like this one.
:::

::: context growing-sets Nested feasible sets
Position $x_1$ across, speed $x_2$ up, between the speed limits. The dark blue sliver is the terminal set $\mathcal{X}_0$. Around it are $\mathcal{X}_{10}$ and $\mathcal{X}_{20}$. Each contains the one before, and from $N = 10$ to $N = 20$ the shape only slides outward, $0.5\,\mathrm{m}$ each way along the axis.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="110" x2="340" y2="110" stroke="#6c7a93" stroke-width="1"/>
  <line x1="180" y1="35" x2="180" y2="185" stroke="#6c7a93" stroke-width="1"/>
  <polygon points="77.0,170.0 323.0,170.0 322.6,158.0 321.4,146.0 319.4,134.0 316.6,122.0 313.0,110.0 308.6,98.0 303.4,86.0 297.4,74.0 290.6,62.0 283.0,50.0 37.0,50.0 37.4,62.0 38.6,74.0 40.6,86.0 43.4,98.0 47.0,110.0 51.4,122.0 56.6,134.0 62.6,146.0 69.4,158.0" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="116.3,170.0 283.0,170.0 282.6,158.0 281.4,146.0 279.4,134.0 276.6,122.0 273.0,110.0 268.6,98.0 263.4,86.0 257.4,74.0 244.8,51.7 243.7,50.0 77.0,50.0 77.4,62.0 78.6,74.0 80.6,86.0 83.4,98.0 87.0,110.0 91.4,122.0 96.6,134.0 102.6,146.0 115.2,168.3" fill="#8fb8f0" fill-opacity="0.5" stroke="#1d6fd1" stroke-width="1.5"/>
  <polygon points="244.4,147.7 157.7,50.0 126.7,50.0 122.8,52.3 119.2,58.0 116.0,68.6 115.6,72.3 202.3,170.0 233.3,170.0 237.2,167.7 240.8,162.0 244.0,151.4" fill="#1d6fd1" stroke="#1f2a44" stroke-width="1"/>
  <text x="318" y="188" font-size="11" text-anchor="end" fill="#1f2a44">N = 20: ±1.663 m at rest</text>
  <text x="24" y="30" font-size="11" fill="#1d6fd1">N = 10: ±1.163 m</text>
  <text x="200" y="30" font-size="11" fill="#1f2a44">N = 0 (dark): ±0.387 m</text>
</svg>
```
:::

::: context braking-parabola Room to stop
Distance to the wall $x_1$ across, approach speed down the page. The red curve is the braking parabola $x_1 = x_2^2/2$: states to its right can still stop in time. The blue dots are the wall example, one every $0.1\,\mathrm{s}$ from $3\,\mathrm{m}$ at rest. They cross the curve between $t = 1.7$ and $1.8\,\mathrm{s}$ — the moment the crash became certain — while the short-horizon QP kept solving until $t = 2.2\,\mathrm{s}$ (orange).

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="30" x2="345" y2="30" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="30" x2="40" y2="165" stroke="#1f2a44" stroke-width="3"/>
  <polyline points="40.0,30.0 41.5,38.8 46.1,47.5 53.8,56.2 64.5,65.0 78.3,73.8 95.1,82.5 115.0,91.2 138.0,100.0 164.0,108.8 193.1,117.5 225.3,126.3 260.5,135.0 298.8,143.8 340.1,152.5" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <g fill="#1d6fd1">
    <circle cx="340.0" cy="30.0" r="2.5"/><circle cx="339.5" cy="35.0" r="2.5"/><circle cx="338.0" cy="40.0" r="2.5"/><circle cx="335.5" cy="45.0" r="2.5"/><circle cx="332.0" cy="50.0" r="2.5"/><circle cx="327.5" cy="55.0" r="2.5"/><circle cx="322.0" cy="60.0" r="2.5"/><circle cx="315.5" cy="65.0" r="2.5"/><circle cx="308.0" cy="70.0" r="2.5"/><circle cx="299.5" cy="75.0" r="2.5"/><circle cx="290.0" cy="80.0" r="2.5"/><circle cx="279.5" cy="85.0" r="2.5"/><circle cx="268.0" cy="90.0" r="2.5"/><circle cx="255.5" cy="95.0" r="2.5"/><circle cx="242.0" cy="100.0" r="2.5"/><circle cx="227.5" cy="105.0" r="2.5"/><circle cx="212.0" cy="110.0" r="2.5"/><circle cx="195.5" cy="115.0" r="2.5"/><circle cx="178.0" cy="120.0" r="2.5"/><circle cx="159.5" cy="125.0" r="2.5"/><circle cx="140.0" cy="130.0" r="2.5"/><circle cx="119.5" cy="135.0" r="2.5"/>
  </g>
  <circle cx="98.0" cy="140.0" r="4" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <text x="46" y="22" font-size="11" fill="#1f2a44">wall</text>
  <text x="340" y="22" font-size="11" text-anchor="end" fill="#1f2a44">x₁ = 3 m</text>
  <text x="44" y="176" font-size="11" fill="#1f2a44">speed toward wall grows downward</text>
  <text x="250" y="160" font-size="11" fill="#b4232c">x₁ = x₂²/2</text>
  <text x="104" y="152" font-size="11" fill="#1f2a44">QP fails, t = 2.2 s</text>
</svg>
```
:::

::: context filter-jump When the estimate jumps
A navigation filter blends predictions with measurements. Between measurements it coasts on its model. When a new measurement arrives — a GPS fix, a star-tracker reading, a range from the docking target — it can move its estimate suddenly. If the old estimate was drifting, the correction can be a visible step. The vehicle did not move; only its idea of where it is did. To a hard state constraint, that step looks exactly like a real violation.
:::

::: context tail-event Rare, not impossible
A **tail event** is one that lives far out in the thin ends — the tails — of a probability distribution. A thousand random runs mostly land in the fat middle. If the dangerous combination happens once in a hundred thousand runs, a thousand runs will most likely never see it, and "zero failures in a thousand" says little. That is why engineers who test for rare failures aim their tests at the edges on purpose, instead of only sampling at random.
:::
