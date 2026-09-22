---
id: l04-gfold-two-stage-guidance
title: "G-FOLD: the two-stage guidance law, and its flight"
minutes: 18
covers:
  - G-FOLD (Guidance for Fuel-Optimal Large Diverts) and the two-stage minimum-landing-error then minimum-fuel solve
  - The JPL/Masten Xombie flight demonstrations of G-FOLD and what they proved
---

Every solve in this module so far has taken reachability for granted: pick an initial state, pick a target, and the solver quietly assumes a trajectory between them exists within the thrust and time available. A real flight computer does not get that assumption for free. A vehicle can arrive at its powered-descent initial condition further off course than planned — a navigation error, a wind that pushed the entry corridor, a hazard-avoidance system that moved the landing point late — and the honest question a guidance law has to answer is not only "how do I reach the target cheaply" but "what do I do when I cannot reach it at all." G-FOLD is the algorithm this module has been building toward, and it answers that question directly, using nothing more than two calls to the solver assembled over the last three lessons. It is also the one member of this family that has actually flown, and this lesson closes with what that flight proved and what it did not.

## What a guidance law needs that a single optimal-control problem does not

The minimum-fuel landing problem solved in the previous two lessons has a hidden assumption baked into its constraints: $\mathbf{r}(t_f) = \mathbf{r}_{\text{target}}$ is an equality, which silently presumes some feasible trajectory reaches it. If the vehicle is too far away, too fast, or too depleted for that to be true within the available time, the solver this module built does not fail gracefully — the equality constraints and the inequality constraints together have no common point, and an interior-point method chasing a primal residual that cannot reach zero either grinds without converging or returns a residual large enough that no monitor would accept it. Flight software cannot act on "the solver did not converge" a few seconds before touchdown; it needs a defined, useful answer for every state the vehicle might actually be in, reachable or not.

Two tempting fixes both fail for reasons worth naming before the real one. Simply declaring the problem infeasible and falling back to some other behaviour begs the question of what that behaviour is — "abort" is rarely available this close to the ground, and anything else is itself a guidance law that needs its own justification. Combining landing accuracy and fuel into one weighted objective, $\text{minimise } \int\sigma\,dt + w\|\mathbf{r}(t_f)-\mathbf{r}_{\text{target}}\|$, avoids the infeasibility question but introduces a different problem: $w$ has no natural units. There is no physically meaningful exchange rate between a metre of miss distance and a kilogram of propellant that both a guidance engineer and a mission scientist would sign off on, and different reasonable choices of $w$ trace out different points on the same trade-off curve with no principled way to prefer one over another — worse, the choice would have to be baked into the flight software before launch, for a dispersion nobody can predict in advance.

**G-FOLD** — Guidance for Fuel-Optimal Large Diverts — answers with two convex programs, solved in a fixed lexicographic order, on the identical constraint set this module has already built:

::: key The G-FOLD two-stage law
**Stage 1.** Minimise the horizontal landing error $e = \|\mathbf{E}(\mathbf{r}(t_f)-\mathbf{r}_{\text{target}})\|_2$ subject to every dynamics, thrust, and mass constraint from this module — but *not* the equality $\mathbf{r}(t_f)=\mathbf{r}_{\text{target}}$, which is dropped. Call the optimal value $d^\star$.

**Stage 2.** Minimise propellant, $\sum_k\sigma_k\Delta t$, subject to the same constraints plus one more: $\|\mathbf{E}(\mathbf{r}(t_f)-\mathbf{r}_{\text{target}})\|_2 \le d^\star$.

Both stages are SOCPs with identical structure, differing only in objective and one added bound, so the second is a small change of data to the first rather than a new problem.
:::

No weight was invented anywhere in that pair. If the target is reachable, stage 1 returns $d^\star=0$, stage 2's added constraint becomes $\mathbf{r}(t_f)=\mathbf{r}_{\text{target}}$ exactly, and stage 2 *is* the single-stage minimum-fuel problem from the previous two lessons, recovered as the special case it always was. If the target is not reachable, stage 1 finds the closest reachable point — a genuine answer, not a failure — and stage 2 spends the least propellant landing exactly that close, never trading away accuracy the vehicle could have had, and never burning fuel it does not need to. The lexicographic order encodes a priority a mission actually has (land as close as physically possible; only then worry about the propellant margin) without ever asking anyone to name a price for it.

::: example The two stages agree exactly when the target is reachable
Take a short-horizon instance of the Mars lander from this module — $N=10$ steps of $\Delta t=2\,\mathrm{s}$ ($t_f=20\,\mathrm{s}$), $\rho_{\min}=4972\,\mathrm{N}$, $\rho_{\max}=13260\,\mathrm{N}$, $I_{sp}=225\,\mathrm{s}$, from $\mathbf{r}_0=(200,0,600)\,\mathrm{m}$, $\mathbf{v}_0=(-10,3,-25)\,\mathrm{m/s}$, target the origin. Stage 1 returns $d^\star = 1.0\times10^{-7}\,\mathrm{m}$ — the target is reachable, and the tiny nonzero value is exactly the solver's own duality-gap tolerance, not a real miss. Stage 2, with the cap $\|\mathbf{E}(\mathbf{r}(t_f)-\mathbf{r}_{\text{target}})\|_2\le d^\star$ added, returns a fuel-optimal trajectory landing within $1.0\times10^{-7}\,\mathrm{m}$ of the target — indistinguishable, at this precision, from solving the single-stage fixed-target problem of the previous two lessons directly. The two-stage machinery costs nothing extra when the easy case holds, which is most of the time; it only starts doing real work once the vehicle is somewhere the easy case does not hold.
:::

::: example How far the footprint reaches before it does not
Hold everything else fixed — same $24\,\mathrm{s}$-horizon vehicle as this module's very first worked comparison, same $\mathbf{v}_0=(-20,0,-40)\,\mathrm{m/s}$, same target — and re-run stage 1 at increasing initial downrange offset $x_0$, checking the true equality-constraint residual at every point rather than trusting $d^\star$ blindly:

| $x_0\,(\mathrm{m})$ | stage-1 landing error $d^\star\,(\mathrm{m})$ | residual | reachable? |
| --- | --- | --- | --- |
| $300$ | $0.0000$ | $6\times10^{-14}$ | yes |
| $1200$ | $697.8$ | $0.15$ | no (approximately) |
| $2500$ | $2004.7$ | $1\times10^{-9}$ | no |

At $x_0=300\,\mathrm{m}$ the target is fully reachable, and the solve confirms it to solver precision. At $x_0=2500\,\mathrm{m}$ it plainly is not, and that answer is just as well converged — a residual of $10^{-9}$ against a landing error in the thousands of metres is not in question. The middle point is included with its residual shown deliberately rather than quietly cleaned up: $x_0=1200\,\mathrm{m}$ is close enough to the reachable boundary that this module's own teaching solver did not fully converge in the iteration budget given it, leaving a residual of $0.15$ against an answer of $697.8\,\mathrm{m}$ — small relative to the answer, but not the clean solver-tolerance number the other two rows show, and reported as such rather than passed off as equally certain. This is the same lesson the flight-time chapter drew from a different search: a number this close to the edge of what the problem can do deserves its residual checked and shown, not assumed.

Reachability is not a soft property that fades in gradually once the target is far enough away to matter: at $300\,\mathrm{m}$ the landing error is exactly zero, and it is unambiguously nonzero and growing by $2500\,\mathrm{m}$. That is the reachable footprint, found by exactly the same convex solve as everything else in this module — no separate reachability analysis, no search over trajectory shapes, just the value of $d^\star$ read off a single number, with its residual checked. A full footprint map for a flight program sweeps this same solve over a fine grid of initial positions and, separately, over a grid of propellant loads — lowering the propellant available by adding an explicit floor on final mass shrinks $\rho_{\max}$'s effective usefulness late in the burn and pulls the reachable boundary inward from every direction at once, since less propellant means less authority to correct a bad initial condition regardless of which direction it is bad in.
:::

## The Xombie flights: what convex guidance proved by actually flying

Everything in this module up to here is mathematics and arithmetic that anyone can check on a laptop. G-FOLD is also the rare member of this family that left the laptop. Under NASA's ADAPT program (Autonomous Descent and Ascent Powered-flight Testbed), JPL and Masten Space Systems flew the algorithm on Masten's XA-0.1B **Xombie**, a vertical-takeoff, vertical-landing test rocket based at the Mojave Air and Space Port.

The demonstration ran in two stages across two fiscal years, and the distinction between them matters. In the first year, the powered-descent divert trajectories were computed *on the ground, ahead of time* — the flights were testing the vehicle's ability to fly a large lateral divert at all, not yet testing G-FOLD running onboard. Even so, they were a real expansion of the vehicle's flight envelope: Xombie had never diverted sideways by more than about $50\,\mathrm{m}$ before, and across three flights that year the divert grew to $550\,\mathrm{m}$, then $650\,\mathrm{m}$, then $750\,\mathrm{m}$. In the second year, G-FOLD itself was coded in C and run **onboard**, on a payload computer aboard Xombie, computing the divert trajectory in real time during flight rather than having it handed up from the ground beforehand — the actual claim this module has been building toward, tested in the air rather than argued about in a paper.

The most demanding of these flights, on 20 September 2013, was deliberately built to stress the algorithm rather than flatter it: Xombie launched heading diagonally *away* from its intended landing point, a rough stand-in for the kind of off-nominal approach a real dispersed landing might present, forcing G-FOLD to compute, in flight, a path that curved back across its own outbound track to reach the pad. The vehicle climbed to roughly $1200\,\mathrm{feet}$, travelled nearly half a mile downrange at speeds above $50\,\mathrm{mph}$, and landed within about $9\,\mathrm{inches}$ of the target — all from trajectories the flight computer worked out for itself once airborne, not trajectories loaded before launch.

::: note What this flight history establishes, and what it does not
It establishes that this module's central technical claim is not merely elegant on paper: a second-order-cone landing-guidance solve, of a size and complexity comparable to what this module has built and solved on an ordinary laptop, ran to convergence on flight-representative hardware, in real time, during an actual rocket flight, more than once, including a flight deliberately designed to be a hard case for it. It also, for scale, matters against the alternative: G-FOLD's divert authority for a lander of this class is commonly cited against the roughly $12\,\mathrm{mile}$-by-$4\,\mathrm{mile}$ landing ellipse the heritage, non-optimizing guidance used to target Mars Science Laboratory's Curiosity rover in 2012 — a difference in kind, not degree, in how precisely a mission can choose where to put a lander. What it does not establish is anything about a specific company's specific flight software. Nobody outside SpaceX has published what runs on a Falcon 9 or a Starship landing burn, and this module will not claim to know. What can be said is narrower and still substantial: the published algorithm this module derives and implements is not a simulation exercise — it has flown, on real hardware, computing its own answers in the air.
:::

## Check yourself

::: check
A mission designer proposes replacing G-FOLD's two-stage law with a single-stage solve that always targets the nominal landing point, arguing "if it's reachable we get the same answer anyway, so why carry two solves?" What is wrong with that argument?
:::

::: answer
The claim is true exactly in the reachable case, which is also the case where the extra solve costs the least to discover — stage 1 returns $d^\star=0$ quickly precisely because the problem is easy. The two-stage law exists for the case the proposal ignores: when the nominal target is *not* reachable, a single-stage solve targeting it directly has no solution at all, and flight software fed an infeasible problem gets nothing useful back, at exactly the moment it most needs an answer. Carrying the extra solve is not redundant work in the easy case so much as it is insurance that the hard case has a defined, still-optimal answer rather than an undefined one.
:::

::: check
Why does stage 1 drop the terminal equality $\mathbf{r}(t_f)=\mathbf{r}_{\text{target}}$ rather than keeping it and simply checking whether the solver reports infeasibility?
:::

::: answer
An interior-point method built to solve convex problems assumes a nonempty feasible set; it does not, in general, hand back a clean, fast certificate of infeasibility the way this module's later real-time-implementation lesson discusses for solvers that are specifically designed to (via the homogeneous self-dual embedding, for instance). Dropping the hard equality and replacing it with a minimised distance turns "is this feasible" into an ordinary convex minimisation that always has a well-defined answer, $d^\star\ge0$, computed by the same machinery used everywhere else in this module. Reachability is then read off the *value* of $d^\star$ — zero means reachable, positive means not — rather than depended on as a precondition for the solve to make sense at all.
:::

::: check
In the Xombie history, why does the lesson distinguish the first-year flights (ground-planned diverts) from the second-year flight (onboard G-FOLD) instead of treating all of them as evidence for the same claim?
:::

::: answer
They are evidence for two different claims, and conflating them overstates the weaker one. The first-year flights show the *vehicle* can fly a large, fast lateral divert and land safely — a hardware and flight-control result, decoupled from where the trajectory came from, since it was computed on the ground in advance. The second-year flight shows the *algorithm* itself, running on flight-representative computing hardware, can solve the convex program fast enough and reliably enough to fly on, with the trajectory computed after launch rather than before it. This module's certification argument is entirely about the second claim — a bounded, real-time, onboard solve — so the flight that actually tests it is the one where G-FOLD ran in the air, not the one where the vehicle merely proved it could follow a divert someone precomputed.
:::

::: check
Stage 2's added constraint is $\|\mathbf{E}(\mathbf{r}(t_f)-\mathbf{r}_{\text{target}})\|_2 \le d^\star$ — an inequality, using stage 1's optimal value as a fixed bound, rather than the equality $\|\mathbf{E}(\mathbf{r}(t_f)-\mathbf{r}_{\text{target}})\|_2 = d^\star$. Does relaxing it to an inequality change what stage 2 can return?
:::

::: answer
No, and it is worth seeing why not, because it looks like a second relaxation stacked on top of everything else this module has relaxed. Stage 1 already established that $d^\star$ is the *smallest* landing error achievable subject to every other constraint; no feasible point of that same constraint set can do better than $d^\star$, so the inequality $\le d^\star$ and the equality $=d^\star$ describe exactly the same set of reachable terminal points once the rest of the constraints are held fixed — the inequality simply cannot be satisfied with room to spare. Writing it as an inequality is a matter of solver convenience (inequalities compose more simply than a mix of equalities and norm bounds) rather than a further approximation; nothing is given away twice.
:::

## Summary

| Object | Statement |
| --- | --- |
| The gap in a single-stage solve | $\mathbf{r}(t_f)=\mathbf{r}_{\text{target}}$ silently assumes reachability; no defined answer when it fails |
| Rejected fix | Weighted sum of fuel and error: no natural exchange rate, an arbitrary $w$ baked in before the dispersion is known |
| G-FOLD stage 1 | Minimise $\|\mathbf{E}(\mathbf{r}(t_f)-\mathbf{r}_{\text{target}})\|_2$, no terminal-position equality; optimal value $d^\star$ |
| G-FOLD stage 2 | Minimise propellant subject to landing error $\le d^\star$; identical structure to stage 1, one added bound |
| Reachable case | $d^\star=0$; stage 2 reduces exactly to the single-stage minimum-fuel problem |
| Worked instance | $20\,\mathrm{s}$-horizon lander, reachable target: $d^\star=1.0\times10^{-7}\,\mathrm{m}$, stage 2 matches the direct solve |
| ADAPT program | JPL + Masten Space Systems, XA-0.1B Xombie, Mojave |
| FY1 (ground-planned) | Three flights; sideways divert grown from $\sim50\,\mathrm{m}$ to $550$, $650$, $750\,\mathrm{m}$ |
| FY2 (onboard G-FOLD) | Algorithm coded in C, run on a payload computer, computing diverts in real time in flight |
| 20 Sep 2013 flight | Diagonal departure from target, path crossing its own track, $\sim\!1200\,\mathrm{ft}$ altitude, $\sim\!0.5\,\mathrm{mi}$ downrange, landed within $\sim\!9\,\mathrm{in}$ |
| Scale comparison | Cited divert authority roughly six times a Curiosity-class lander's; Curiosity's own target ellipse was about $12\,\mathrm{mi}\times4\,\mathrm{mi}$ |
| What is not established | Any specific company's flight software; only the published, flown algorithm this module derives |

The next lesson finishes the 3-DoF convex formulation's remaining honest business: the cone constraints for glideslope, velocity, and thrust pointing, with the same tightness check this module ran on the thrust bound applied now to pointing.
