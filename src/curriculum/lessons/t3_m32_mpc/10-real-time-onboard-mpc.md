---
id: l10-real-time-onboard-mpc
title: Real-time onboard MPC and embedded QP solvers
minutes: 24
covers:
  - 'Real-time onboard MPC: warm starting, solver choice, worst-case iteration bounds, certifiable solve time'
  - Embedded QP solvers (OSQP, qpOASES, HPIPM) and code generation
---

A map app re-plans your route every few seconds as you drive, and each new plan must be ready before the next corner. An MPC controller on a spacecraft lives by the same rule, only harder: it re-solves its optimization every control cycle, and a cycle may last $20\,\mathrm{ms}$.

The optimization module already set out the **[[rules for a flight solver|flight-solver-rules]]**, and they apply to MPC unchanged. What is special is the shape of the work: the same **quadratic program** (QP) every cycle from a slightly different state, a banded structure a general solver cannot see, a horizon that trades straight against solve time, and a deadline in milliseconds.

This lesson turns those facts into choices: which solver, what a good starting guess buys, how to cap solve time, and what to tell a review board.

## The frame budget

A quiz has to fit inside the class period; a solve has to fit inside the control cycle. The **control period** is the time from one command to the next, and only a slice of it belongs to the solver. The processor's **[[throughput|throughput]]** — arithmetic operations per second, counted in FLOP/s ("flops per second") — turns that slice into a number of operations you can afford.

The QP-formulation lesson gave the cost of one factorization: about $N(n+m)^3$ flops in sparse form and $\tfrac{1}{3}(Nm)^3$ in condensed form, with $N$ the horizon, $n$ the number of states and $m$ the number of inputs. An interior-point solver does one factorization per iteration, so multiply by the iteration count.

::: example What fits in a control frame
Take the three-axis rendezvous model: $n = 6$, $m = 3$, and an interior-point solver held at $25$ iterations. Flops per solve are $25N(n+m)^3$ sparse and $25(Nm)^3/3$ condensed. Divide by throughput to get time:

| $N$ | sparse flops | condensed flops | sparse at $100\,\mathrm{MFLOP/s}$ | sparse at $1\,\mathrm{GFLOP/s}$ | condensed at $1\,\mathrm{GFLOP/s}$ |
| --- | --- | --- | --- | --- | --- |
| $10$ | $1.8\times10^5$ | $2.3\times10^5$ | $1.82\,\mathrm{ms}$ | $0.18\,\mathrm{ms}$ | $0.23\,\mathrm{ms}$ |
| $20$ | $3.6\times10^5$ | $1.8\times10^6$ | $3.65\,\mathrm{ms}$ | $0.36\,\mathrm{ms}$ | $1.80\,\mathrm{ms}$ |
| $40$ | $7.3\times10^5$ | $1.4\times10^7$ | $7.29\,\mathrm{ms}$ | $0.73\,\mathrm{ms}$ | $14.4\,\mathrm{ms}$ |
| $80$ | $1.5\times10^6$ | $1.2\times10^8$ | $14.6\,\mathrm{ms}$ | $1.46\,\mathrm{ms}$ | $115\,\mathrm{ms}$ |
| $160$ | $2.9\times10^6$ | $9.2\times10^8$ | $29.2\,\mathrm{ms}$ | $2.92\,\mathrm{ms}$ | $922\,\mathrm{ms}$ |

Check one entry by hand. At $N = 40$ sparse, $(6+3)^3 = 729$ and $25 \times 40 \times 729 = 729{,}000$ flops. At $10^8$ flops per second that takes $7.29\,\mathrm{ms}$, as the table says.

Now set a $20\,\mathrm{ms}$ period and give the solver $30\,\%$ of it: $6\,\mathrm{ms}$. The largest horizon that fits:

| throughput | condensed | sparse |
| --- | --- | --- |
| $100\,\mathrm{MFLOP/s}$ | $N = 13$ | $N = 32$ |
| $1\,\mathrm{GFLOP/s}$ | $N = 29$ | $N = 329$ |
| $3\,\mathrm{GFLOP/s}$ | $N = 43$ | $N = 987$ |

For instance, at $100\,\mathrm{MFLOP/s}$ the $6\,\mathrm{ms}$ buys $600{,}000$ flops, and $600{,}000 / (25 \times 729) = 32.9$, so the sparse form fits $N = 32$.

Trust the condensed column, not the sparse one. The condensed cube is real and swamps every constant, so "about thirty steps at a gigaflop" is a planning figure. Long before $N = 329$, a sparse solve is limited by memory traffic, index bookkeeping and per-block overhead, which a flop count leaves out. What you can rely on is the scaling: double the horizon and a sparse solve doubles, while a condensed solve grows eightfold.

The other lever is the iteration count. Cutting it from $25$ to $12$ halves every number. Whether that is safe is the subject of the next sections.
:::

## Warm starting

If someone swaps two pieces of your finished jigsaw, you fix those two pieces; you do not start over. Consecutive MPC problems are like that: only the state has moved, by one sample.

So start from last cycle's answer. Drop its first move (already flown), slide the rest forward one step, and fill the empty last slot with the terminal control law. This is the **shifted plan** that proved recursive feasibility, now doing a second job. Starting a solver from a good guess is **warm starting**; starting from nothing is a **cold start**.

::: key Warm starting
Initialize the solver with the previous solution shifted one step and the terminal law appended. Typically cuts iterations by a large factor — but the WORST case, not the warm-started average, is what you certify against.
:::

How much it helps depends on the solver, and the deciding idea is the **active set**: the constraints pressed against their limits at the answer, like a thruster at full throttle. An **[[active-set method|active-set-picture]]** hunts for the right active set, adding or dropping one constraint at a time, so its work grows with the number of changes. If this cycle's set equals last cycle's, it has almost nothing to do.

::: example How often the active set actually changes
Use the module's proximity-operations axis with $N = 20$, $|u| \le 1$ and $|x_2| \le 0.5$. Each limit has two sides at each of the $20$ steps, so there are $80$ constraint rows. Run $60$ cycles from $(1.5\,\mathrm{m}, 0)$ toward the origin, and at each cycle compare the active rows with the cycle before — $59$ comparisons:

| change in the active set between consecutive cycles | cycles |
| --- | --- |
| no change at all | $39$ |
| one constraint added or dropped | $15$ |
| two | $1$ |
| three | $4$ |

Check: $39 + 15 + 1 + 4 = 59$. The mean change is $(15 + 2 + 12)/59 = 29/59 = 0.49$ constraints per cycle, and two-thirds of cycles need no change. So a warm-started active-set solver makes zero or one swap on most cycles: a small update to a factorization it already holds.

Now run the same cycles through a primal-dual **interior-point** solver, cold-started each time. CVXOPT's QP solver took $5$ to $8$ iterations, median $5$. The count barely moves: easy to bound, little for a warm start to save. The two families have opposite personalities: active set is fast on average and hard to bound; interior point is steady and hard to speed up.
:::

Why is an interior-point warm start so awkward? An interior-point method keeps its guesses strictly inside the allowed region, steered by a **[[barrier|barrier-picture]]** that grows without limit at every wall. Last cycle's answer sits *on* a wall, where the barrier is infinite, so it cannot be a starting point. Nudged inside, it lands far from the **central path**, the track the method follows as the barrier relaxes. Specialized warm-start tricks save perhaps a third of the iterations — nothing like the active-set gain.

::: warning A warm-started average is not a certification argument
"Warm starting cut our median solve from $4.1\,\mathrm{ms}$ to $0.6\,\mathrm{ms}$" is a performance result, not a timing guarantee. The cycles that matter — a disturbance hits, a constraint activates, a reference steps, a mode changes — are where the active set moves most and the warm start helps least. An active-set worst case is bounded only by the number of possible active sets, which is combinatorial. So use the warm start for speed, and bound the worst case another way: a hard cap with a proven-safe fallback, or a solver whose count ignores the warm start.
:::

## Choosing the solver

Three solvers dominate embedded MPC, one per family; your problem's shape and the guarantee you need decide.

**qpOASES** is an *online active-set* solver. It walks a straight line from last cycle's problem to this one, updating the active set whenever it crosses a constraint boundary — a **[[homotopy|homotopy]]**. It exploits warm starts superbly (the table above is its use case), returns exact solutions, and works natively on the dense condensed form. Its weak spot is the worst case; the usual fix is a cap on active-set changes per cycle, returning the point reached so far.

**OSQP** uses **[[ADMM|admm]]**, the alternating direction method of multipliers — an *operator-splitting* method that breaks the problem into two easy pieces and takes turns on them.

::: key OSQP in one line
An operator-splitting (ADMM) QP solver: division-free after a single factorization, fixed memory, and it detects infeasibility. Its predictable per-iteration cost is why it appears in embedded code generation.
:::

The factorization is done once and reused in every iteration of every cycle. Each iteration is a solve against that factor plus a **projection** — clipping a vector back into the allowed box — a small, fixed, branch-free amount of work. OSQP **[[converges linearly|convergence-rates]]**, reaching moderate accuracy fast and high accuracy slowly, which suits control, where the plant has its own tolerances anyway. It returns certificates of **primal infeasibility** (no plan meets the constraints) and **dual infeasibility** (the cost falls without limit) that mode logic can act on. Its code generator writes library-free C, making it the common choice for embedded linear MPC.

**HPIPM** is an interior-point solver built for the sparse, block-banded MPC structure. It factors with a Riccati recursion — the backward sweep that gives the LQR gain — on its own dense linear-algebra kernels, pairing a steady iteration count with linear-in-$N$ cost. It is the solver inside `acados`, serving linear and nonlinear MPC through the real-time iteration scheme.

| | qpOASES | OSQP | HPIPM |
| --- | --- | --- | --- |
| family | active set | ADMM (first order) | interior point |
| formulation | dense, condensed | sparse or dense | sparse, banded |
| cost per iteration | factorization update | one solve against a fixed factor | one banded factorization |
| warm start | excellent | good | limited |
| accuracy | exact | moderate, tunable | high |
| iteration count | data-dependent, combinatorial worst case | data-dependent, linear rate | nearly constant |
| infeasibility | detected via the homotopy | certificates | detected |

## Bounding the worst case

Certification needs a number that holds in the worst case, not a percentile. There are three routes, and real programs use more than one.

**A theoretical bound.** Interior-point methods on a convex QP need on the order of $\sqrt{\nu}\,\log(1/\epsilon)$ iterations — read "root nu times log of one over epsilon" — where $\nu$ is the barrier parameter, growing with the number of inequalities, and $\epsilon$ the accuracy asked for. It is finite but loose — hundreds where a dozen are seen — so it is why a cap *can* exist, not the cap itself.

**A capped iteration count with a safe output.** Fix the count, as the optimization module requires, and make whatever comes back safe. A capped ADMM or interior-point answer is usually *not* exactly feasible, so the flight code checks the returned plan against the constraints itself — cheap, and independent of the solver — and either applies it or triggers the fallback. That check turns "out of iterations" from an open-ended risk into a defined branch.

**An empirical campaign, used correctly.** Run the **dispersion campaign** — thousands of simulated flights with every uncertain quantity scattered over its range — and record every cycle's iteration count. Double the maximum to set the cap, then re-run with the cap in place and check every case still gives an acceptable plan. The first run sizes the cap; the second qualifies what you ship.

And measure **[[tail latency|tail-latency]]**, not the mean. A solver averaging $4\,\mathrm{ms}$ that takes $60\,\mathrm{ms}$ once in a thousand cycles misses a $20\,\mathrm{ms}$ deadline every twenty seconds at $50\,\mathrm{Hz}$. What decides flyability is the maximum over the certified envelope; the $99.9$th percentile shows how far the tail stretches.

::: example Sizing a cap from the measurement
The sixty-cycle run was a two-state problem, so its $5$ to $8$ iterations are not the rendezvous figure. Suppose the rendezvous campaign records a maximum of $15$. Doubling gives a cap of $30$. Whether the solver exits early or always runs the full count, the budget must cover the cap.

At $N = 40$ on the rendezvous model, $25$ sparse iterations take $0.73\,\mathrm{ms}$ at $1\,\mathrm{GFLOP/s}$. Scaling to $30$: $0.729 \times 30/25 = 0.875\,\mathrm{ms}$, against $6\,\mathrm{ms}$. Even a cap of $200$ fits: $0.729 \times 200/25 = 5.83\,\mathrm{ms}$. That is the comfortable case, and worth recognizing: timing is settled, and the remaining work is determinism and memory.

The uncomfortable case is the $100\,\mathrm{MFLOP/s}$ row — an older **[[radiation-hardened|rad-hard]]** processor. The $25$-iteration solve takes $7.29\,\mathrm{ms}$ and the $30$-iteration cap $8.75\,\mathrm{ms}$; both miss $6\,\mathrm{ms}$. With the cap, the horizon that fits is $600{,}000 / (30 \times 729) = 27.4$, so $N = 27$. The levers are a shorter horizon, a lower control rate, or a slower outer loop for the predictive layer; this arithmetic is how you choose.
:::

## Code generation for MPC

For a problem that does not change with time, the Hessian $\mathbf{H}$ and every constraint matrix are fixed before flight. Only the linear cost term $\mathbf{f} = \mathbf{F}\mathbf{x}$ and the right-hand sides of the state-dependent constraints change each cycle. That is exactly what a **[[code generator|codegen]]** wants. The workflow:

1. Define the problem once, with state, reference and bounds as parameters.
2. Run the dispersion campaign in a high-level environment to fix horizon, tolerances and cap.
3. Generate C in which the sparsity pattern, elimination order, loop bounds and workspace size are compile-time constants.
4. Re-run the campaign on the generated code and explain every difference.
5. Measure worst-case execution time on the target, cap in place.
6. Freeze: horizon, cap and workspace are now configuration items, not tuning knobs.

The tools are OSQP's code generator, CVXPYgen for CVXPY models, and `acados`, which generates the whole real-time-iteration loop around HPIPM. All produce a solve function with no dynamic memory and no library dependencies, which the rest of the safety argument rests on.

## The flight rule

::: key The flight-software rule for onboard optimizers
Never let a control cycle depend on a solver succeeding. Cap iterations, keep the last feasible plan, and carry a certified simple fallback law with a deterministic switch and a telemetry counter.
:::

Three mechanisms make it work.

- **The shifted previous plan**, held in memory, supplies the command when this cycle's solve fails or times out. Recursive feasibility makes it valid while the disturbance stays inside its design set.
- **The fallback law** — a saturated LQR, or the explicit solution of a smaller problem with a computed region of attraction — runs when the shifted plan is used up or the state leaves the region where it can be trusted.
- **The switch** is deterministic, driven by the solver status, the constraint check and membership of a verified set. Every switch increments a **telemetry counter** sent to the ground.

Two details matter. Test the fallback by failing the solver on purpose on random cycles across the campaign; a fallback never entered in simulation is an assumption, not a mechanism. And give the switch **[[hysteresis|hysteresis]]**, since a controller flipping between optimizer and fallback every other cycle is worse than either alone.

::: note What to write in the design review
A review board wants five sentences, each with a number:

1. The control period, and the fraction given to the solver.
2. The horizon and resulting problem size, with the formulation named.
3. The iteration cap, where it came from, and what the solver returns if it is reached.
4. The **[[worst-case execution time|wcet]]** measured on the flight processor with caches and interrupts in their worst configuration, and the margin against the allocation.
5. The fallback: what it is, when it engages, its region of attraction, and how often it engaged across the campaign.

If any is missing, "can we fly this?" has no answer yet. With all five, the meeting becomes an engineering trade, not an argument about optimizers in flight software.
:::

## Check yourself

::: check
Your MPC uses qpOASES with warm starting and meets its deadline with a factor of ten of margin in Monte Carlo. The board asks for a worst-case bound. What can you offer?
:::

::: answer
Not a bound from the measurements: the active-set worst case is combinatorial, and the campaign never visited it. Offer three things instead. Cap the active-set changes per cycle; qpOASES supports this, and the capped point lies on the homotopy path, feasible for a problem between the previous and current ones — check it against the true constraints before use. Bound the arithmetic per change and multiply by the cap: a real worst-case execution time. And carry the fallback, so reaching the cap is a defined branch, not a missed deadline. A bound with no cap and no fallback needs a different family: interior point, with its near-constant count, or an explicit solution with a fixed operation count.
:::

::: check
Explain why an active-set solver benefits enormously from warm starting while an interior-point solver hardly does.
:::

::: answer
An active-set method's state is the set of constraints held at their limits, and its work grows with how far that set must move. Above, the set was unchanged on two-thirds of cycles and moved by one on most of the rest, so starting from last cycle's set leaves one factorization update at most. An interior-point method's state is a point near the central path, and the previous solution lies on the boundary, where the barrier is infinite. Moved inside, it sits off the central path, and the solver still travels most of the path. The consolation is that the interior-point count hardly varies — $5$ to $8$ in the run above — so there is little to save.
:::

::: check
At $100\,\mathrm{MFLOP/s}$ with a $20\,\mathrm{ms}$ period and a $30\,\%$ allocation, the largest condensed horizon is $N = 13$ and the largest sparse horizon is $N = 32$. Your controller needs $N = 60$ for the region of attraction. Name four ways forward and what each costs.
:::

::: answer
**Lower the control rate.** A $50\,\mathrm{ms}$ period gives $15\,\mathrm{ms}$, or $1.5 \times 10^6$ flops, and $1.5 \times 10^6 / (25 \times 729) = 82$: roughly $N = 80$ sparse. It costs disturbance-rejection bandwidth in the predictive layer — usually fine if a fast inner loop keeps running (the tube architecture).

**Split the rates.** MPC at $10\,\mathrm{Hz}$, a fixed-gain inner loop at $50\,\mathrm{Hz}$. It costs an extra design and gains a robustness structure you wanted anyway.

**Use a non-uniform horizon.** Fine steps near the present, coarse ones later, so sixty fine steps' worth of preview ($60 \times 20\,\mathrm{ms} = 1.2\,\mathrm{s}$) costs perhaps twenty-five nodes. It costs prediction accuracy late in the horizon, where the constraint geometry must still be resolved.

**Buy throughput.** A $1\,\mathrm{GFLOP/s}$ processor turns $N = 32$ into $N = 329$ by the model, at the cost of qualifying the new part.

Shortening the horizon and hoping is not an option: the region of attraction was the requirement.
:::

::: check
The solver returns after hitting its iteration cap with a plan that violates a softened state constraint by $0.3\,\mathrm{m/s}$. Apply it or not?
:::

::: answer
First ask what kind of violation it is. If the plan crosses the *softened* constraint by using slack — the QP's own solution has nonzero slack — it is feasible for the problem as posed, and the slack is the controller saying the envelope cannot be held from here. Apply it, log the slack, and let the monitor judge the excursion. If instead the returned point is not feasible for the QP at all, as an early-stopped ADMM or interior-point iterate usually is, the plan carries no guarantee: its first input may exceed the actuator limits or its path leave the envelope. Then clip the first input to the hard actuator bounds if it is within tolerance, or engage the fallback. Flight code checks the plan against the constraints itself, whatever the status flag says: the flag describes the optimizer, the check describes the vehicle.
:::

::: check
Why does the condensed formulation appear more often in embedded MPC than the flop counts suggest it should?
:::

::: answer
Because flop counts drop the constants, and embedded problems live where constants dominate. A dense $30 \times 30$ factorization is straight-line arithmetic on data that fits in cache, running near peak speed; a banded solver of the same nominal cost pays for indexing, block setup and scattered memory access at every stage. It also has no equality constraints and one dense matrix, so its generated code is smaller and easier to review and bound — worth more than a factor of two in flops when certification is about determinism. And its size depends only on $m$ and $N$, so a plant with many states and few inputs, like an attitude loop with flexible modes, condenses to something tiny. The sparse form wins decisively when the horizon is long or the plant is unstable on its own; check those two conditions first.
:::

## Summary

| Object | Statement |
| --- | --- |
| Frame budget | Period $\times$ solver share $\to$ flops $\to$ largest $N$ |
| Rendezvous, $25$ iterations | $N = 40$: $0.73\,\mathrm{ms}$ sparse, $14.4\,\mathrm{ms}$ condensed at $1\,\mathrm{GFLOP/s}$ |
| Largest $N$ in $6\,\mathrm{ms}$ | $100\,\mathrm{MFLOP/s}$: $13$ condensed, $32$ sparse; $1\,\mathrm{GFLOP/s}$: $29$ and $329$ (scaling only) |
| Warm start | Shifted plan plus terminal law; active set unchanged on $39$ of $59$ cycles, mean change $0.49$ |
| Interior point | $5$ to $8$ iterations (CVXOPT): steady, easy to bound, hard to speed up |
| qpOASES | Online active set, condensed, exact, best warm start, combinatorial worst case |
| OSQP | ADMM, one reused factorization, fixed cost per iteration, infeasibility certificates |
| HPIPM | Sparse Riccati interior point, near-constant count, linear in $N$, inside `acados` |
| Worst case | $\sqrt{\nu}\log(1/\epsilon)$ bound; cap plus constraint check; campaign maximum $\times 2$ |
| Tail latency | The maximum over the envelope decides, never the mean |
| Code generation | Only $\mathbf{f} = \mathbf{F}\mathbf{x}$ and constraint right-hand sides change per cycle |
| Flight rule | Cap, shifted plan, certified fallback, deterministic switch with hysteresis and a counter |

The last lesson steps back and asks the question the whole module exists to answer: when is all of this worth it, and when is a saturated LQR the right answer?

::: context flight-solver-rules What the optimization module demanded
A flight solver is not a desktop solver made faster. Its memory is set aside once, before flight, and never requested again. The order in which it eliminates variables is fixed in advance, so no decision depends on the numbers it meets. It runs a fixed number of iterations instead of "until it looks done". And every cycle ends in one of two certified outcomes: a plan with proof that it is optimal, or proof that no plan exists. Everything in this lesson assumes those rules.
:::

::: context throughput How fast is a flight computer?
A laptop processor does tens of billions of flops per second. Flight processors are far slower, because they must survive radiation and are qualified years before launch. A figure of $100\,\mathrm{MFLOP/s}$ — a hundred million per second — is a fair stand-in for an older space-grade chip, and $1\,\mathrm{GFLOP/s}$ for a newer one. The table in this lesson shows why that gap matters: at the slow end the horizon is capped in the low tens of steps.
:::

::: context active-set-picture Which constraints are touching?
Picture the proximity-ops loop cycle by cycle. On most cycles the same constraints stay pressed against their limits — the thruster still at full brake, the speed still at its cap. Only now and then does one join or leave. Here is the count from the sixty-cycle run:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="60" y="53" width="50" height="117" fill="#1d6fd1"/>
  <rect x="130" y="125" width="50" height="45" fill="#8fb8f0"/>
  <rect x="200" y="167" width="50" height="3" fill="#8fb8f0"/>
  <rect x="270" y="158" width="50" height="12" fill="#8fb8f0"/>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="85" y="46">39</text><text x="155" y="118">15</text><text x="225" y="160">1</text><text x="295" y="151">4</text>
    <text x="85" y="186">0</text><text x="155" y="186">1</text><text x="225" y="186">2</text><text x="295" y="186">3</text>
  </g>
  <text x="200" y="199" font-size="11" fill="#6c7a93" text-anchor="middle">constraints added or dropped since the last cycle</text>
  <text x="200" y="20" font-size="12" fill="#1f2a44" text-anchor="middle">cycles, out of 59 comparisons</text>
</svg>
```

An active-set solver that starts from last cycle's set is done almost at once on the tall bar.
:::

::: context barrier-picture The fence that keeps you off the wall
Say the answer must lie between $0$ and $1$, and the true best point is right on the wall at $0$. An interior-point method minimizes $x$ plus a fence term $\mu(-\ln x - \ln(1-x))$ that shoots up near both walls. With a big $\mu$ ("mu") the best point sits well inside; as $\mu$ shrinks it slides toward the wall. The red dots, at $x = 0.382$, $0.217$ and $0.090$ for $\mu = 1$, $0.3$ and $0.1$, trace the central path.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="20" x2="40" y2="185" stroke="#1f2a44" stroke-width="2"/>
  <line x1="320" y1="20" x2="320" y2="185" stroke="#1f2a44" stroke-width="2"/>
  <line x1="40" y1="185" x2="320" y2="185" stroke="#6c7a93" stroke-width="1"/>
  <polyline points="43.6,27.4 44.8,37.7 46.5,47.8 48.7,57.7 51.6,67.5 55.6,77.0 60.9,86.1 68.0,94.7 73.6,99.7 84.8,107.0 96.0,111.8 107.2,115.1 118.4,117.3 129.6,118.6 140.8,119.2 152.0,119.2 163.2,118.7 174.4,117.8 185.6,116.3 196.8,114.4 208.0,112.0 219.2,109.1 230.4,105.6 241.6,101.4 252.8,96.4 264.0,90.2 275.2,82.5 286.4,72.4 292.0,65.9 299.1,55.5 304.4,45.0 308.4,34.5" fill="none" stroke="#8fb8f0" stroke-width="2"/>
  <polyline points="41.1,125.2 42.0,131.4 43.6,137.4 46.5,143.2 51.6,148.7 60.9,153.4 68.0,155.4 84.8,157.6 96.0,158.0 107.2,158.0 118.4,157.6 140.8,156.2 163.2,154.0 185.6,151.3 208.0,148.0 230.4,144.0 252.8,139.3 275.2,133.1 292.0,126.6 304.4,119.2 311.3,112.3 315.2,105.6 317.3,99.1 318.5,92.7 318.9,89.5" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <polyline points="41.1,165.0 42.0,166.9 43.6,168.8 46.5,170.5 51.6,171.9 60.9,172.7 68.0,172.7 84.8,172.0 107.2,170.2 129.6,168.0 152.0,165.5 174.4,162.7 196.8,159.8 219.2,156.7 241.6,153.3 264.0,149.6 286.4,145.2 299.1,142.1 308.4,138.9 313.5,136.2 316.4,133.8 318.0,131.5 318.9,129.3" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="147.0" cy="119.3" r="4" fill="#b4232c"/>
  <circle cx="100.7" cy="158.0" r="4" fill="#b4232c"/>
  <circle cx="65.2" cy="172.8" r="4" fill="#b4232c"/>
  <g font-size="11" fill="#1f2a44">
    <text x="236" y="80">μ = 1</text><text x="236" y="126">μ = 0.3</text><text x="236" y="166">μ = 0.1</text>
    <text x="40" y="200" text-anchor="middle">x = 0</text><text x="320" y="200" text-anchor="middle">x = 1</text>
  </g>
</svg>
```

Last cycle's answer sits at the wall, where the fence is infinite — which is why it makes a poor starting point.
:::

::: context homotopy Sliding from one problem to the next
A **homotopy** is a smooth morph from one thing into another. qpOASES treats last cycle's QP and this cycle's QP as the two ends of a slider. It moves the slider from $0$ to $1$, and the answer moves with it. Along the way the answer bumps into a constraint (which joins the active set) or pulls off one (which leaves). Each bump is one cheap update. If the slide crosses no boundary, the new answer comes almost for free.
:::

::: context admm Two easy halves, taken in turns
ADMM splits a QP into two sub-problems that are each easy on their own. One is a linear system with the same matrix every time — factor it once, reuse it forever. The other is "put this vector back inside the box", which is only clipping each entry to its limits. A third, even simpler step nudges a running correction (the "multipliers") that pulls the two halves into agreement. Each lap costs the same, which is exactly what a flight timeline wants. One caution: desktop OSQP may retune its step parameter and refactor mid-solve; an embedded build fixes it so the "factor once" promise holds.
:::

::: context convergence-rates Linear and quadratic convergence
**Linear** convergence shrinks the error by a fixed factor each iteration — say, halves it. **Quadratic** convergence squares it, so the number of correct digits roughly doubles each time. On a log scale the first is a straight line and the second is a cliff:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 215" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="25" x2="50" y2="185" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="185" x2="335" y2="185" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="45" y="29">1</text><text x="45" y="109">10⁻⁵</text><text x="45" y="189">10⁻¹⁰</text>
  </g>
  <polyline points="50,29.8 78,34.6 106,39.4 134,44.3 162,49.1 190,53.9 218,58.7 246,63.5 274,68.3 302,73.2 330,78.0" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <polyline points="50,29.8 78,34.6 106,44.3 134,63.5 162,102.1 190,179.1" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <text x="250" y="52" font-size="12" fill="#1d6fd1">linear: halves</text>
  <text x="196" y="160" font-size="12" fill="#b4232c">quadratic: squares</text>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="200">0</text><text x="190" y="200">5</text><text x="330" y="200">10</text>
  </g>
  <text x="260" y="212" font-size="11" fill="#6c7a93">iteration</text>
</svg>
```

Both start at an error of $0.5$. After five iterations the halving method is at $0.016$; the squaring one is at $2 \times 10^{-10}$. ADMM is the first kind, interior-point methods near the end are the second.
:::

::: context tail-latency Why the slowest solve matters
Line up a million solve times from fastest to slowest. The **median** is the one in the middle; the **$99.9$th percentile** is the one with only a thousandth of the solves slower than it. A web page can live with a slow response now and then. A control loop cannot: a late command is a missed command, and at $50$ cycles per second a one-in-a-thousand event happens every twenty seconds. That is why flight software cares about the far end of the line, not its middle.
:::

::: context rad-hard Computers built to survive space
Energetic particles from the Sun and from deep space can flip a bit in memory or knock out a transistor. **Radiation-hardened** processors are designed and tested to shrug that off, and it costs speed: they typically lag commercial chips by a decade or more. NASA's Curiosity and Perseverance rovers, for example, each run on a RAD750, a hardened PowerPC processor clocked at about $200\,\mathrm{MHz}$. Every onboard optimizer has to fit on chips like that.
:::

::: context codegen A program that writes a program
A **code generator** takes a description of your problem and writes C source code that solves exactly that problem and nothing else. Every array size, every loop count and every sparsity pattern is baked in as a constant. The result is dull, flat code — which is the point. A reviewer can read it, a timing tool can measure every path through it, and nothing in it asks the operating system for memory mid-flight.
:::

::: context hysteresis The thermostat trick
A home thermostat set to $20\,^\circ\mathrm{C}$ does not switch the heater on at $19.99$ and off at $20.01$, or it would click all day. It turns on at $19.5$ and off at $20.5$. That gap is **hysteresis**. The MPC switch uses the same idea: fall back to the simple law when the check fails, but return to the optimizer only after several good cycles in a row. The gap stops the controller chattering between two modes.
:::

::: context wcet The slowest the code can ever run
**Worst-case execution time** is the longest a piece of code can take on the real flight processor, over every input it can meet. Caches make it tricky: code runs fast when its data is already in the processor's small fast memory and much slower when it is not. Interrupts from other tasks can pause it too. So the measurement is taken with caches cleared and interrupts at their worst, and often backed by a static-analysis tool that bounds every path through the code.
:::
