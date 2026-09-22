---
id: l10-real-time-onboard-mpc
title: Real-time onboard MPC and embedded QP solvers
minutes: 26
covers:
  - 'Real-time onboard MPC: warm starting, solver choice, worst-case iteration bounds, certifiable solve time'
  - Embedded QP solvers (OSQP, qpOASES, HPIPM) and code generation
---

The optimization module established what an embedded convex solver has to be: statically allocated, free of runtime branching on data, with a fixed elimination ordering, a fixed iteration count rather than a tolerance test, and two certified outcomes per cycle. Those rules are not repeated here — they apply to an MPC solver exactly as they apply to a landing guidance solver.

What is specific to MPC is the shape of the workload. The same quadratic program is re-solved every cycle with a slightly different state, so successive problems are nearly identical; the problem has a banded structure that a general solver cannot see; the horizon is a design parameter that trades directly against solve time; and the controller runs at the control loop's rate rather than a guidance rate, so the frame is milliseconds rather than tenths of a second. Those four facts drive everything in this lesson: which solver family to choose, how much warm starting actually buys, what a worst-case bound looks like, and what you tell a review board when they ask whether an optimiser belongs in a flight control loop.

## The frame budget

Start from the arithmetic of the condensed and sparse formulations and divide by a control period. Take the three-axis rendezvous model, $n = 6$ states and $m = 3$ inputs, with an interior-point solver at a fixed $25$ iterations per solve.

::: example What fits in a control frame
Per-solve flop counts from the scaling laws of the QP-formulation lesson — $25N(n+m)^3$ sparse and $25(Nm)^3/3$ condensed — and the time they take at two processor throughputs:

| $N$ | sparse flops | condensed flops | sparse at $100\,\mathrm{MFLOP/s}$ | sparse at $1\,\mathrm{GFLOP/s}$ | condensed at $1\,\mathrm{GFLOP/s}$ |
| --- | --- | --- | --- | --- | --- |
| $10$ | $1.8\times10^5$ | $2.3\times10^5$ | $1.82\,\mathrm{ms}$ | $0.18\,\mathrm{ms}$ | $0.23\,\mathrm{ms}$ |
| $20$ | $3.6\times10^5$ | $1.8\times10^6$ | $3.65\,\mathrm{ms}$ | $0.36\,\mathrm{ms}$ | $1.80\,\mathrm{ms}$ |
| $40$ | $7.3\times10^5$ | $1.4\times10^7$ | $7.29\,\mathrm{ms}$ | $0.73\,\mathrm{ms}$ | $14.4\,\mathrm{ms}$ |
| $80$ | $1.5\times10^6$ | $1.2\times10^8$ | $14.6\,\mathrm{ms}$ | $1.46\,\mathrm{ms}$ | $115\,\mathrm{ms}$ |
| $160$ | $2.9\times10^6$ | $9.2\times10^8$ | $29.2\,\mathrm{ms}$ | $2.92\,\mathrm{ms}$ | $922\,\mathrm{ms}$ |

Now impose a $20\,\mathrm{ms}$ control period with $30\,\%$ of it, $6\,\mathrm{ms}$, available to the solver. The largest horizon that fits:

| throughput | condensed | sparse |
| --- | --- | --- |
| $100\,\mathrm{MFLOP/s}$ | $N = 13$ | $N = 32$ |
| $1\,\mathrm{GFLOP/s}$ | $N = 29$ | $N = 329$ |
| $3\,\mathrm{GFLOP/s}$ | $N = 43$ | $N = 987$ |

Read the condensed column literally and the sparse column sceptically. The cubic growth of the condensed form is real and dominates every constant factor, so "about thirty steps at a gigaflop" is a usable planning figure. The sparse numbers are what a pure flop count predicts when the per-iteration work is tiny, and long before $N = 329$ the binding constraint becomes memory traffic, indexing overhead and the fixed cost per block — none of which the model carries. The dependable content is the scaling: doubling the horizon doubles a sparse solve and multiplies a condensed solve by eight.

The other lever in the table is the iteration count. Halving it from $25$ to $12$ halves every number, and the next sections are about whether that is safe.
:::

## Warm starting

Consecutive MPC problems differ only by one sample of state motion. The previous solution, shifted one step and completed with the terminal law, is a feasible and nearly optimal starting point — the same shifted candidate that proved recursive feasibility, now doing a second job.

::: key Warm starting
Initialise the solver with the previous solution shifted one step and the terminal law appended. Typically cuts iterations by a large factor — but the WORST case, not the warm-started average, is what you certify against.
:::

How much it helps depends entirely on the solver family, and the reason is the **active set**. An active-set method's work is proportional to how many constraints it has to add or drop; if the answer's active set is the previous one, it does almost nothing.

::: example How often the active set actually changes
The proximity-ops axis with $N = 20$, $|u| \le 1$, $|x_2| \le 0.5$, run for $60$ cycles from $(1.5\,\mathrm{m}, 0)$ down to the origin. At each cycle, record which of the $80$ constraint rows are active at the optimum and compare with the previous cycle:

| change in the active set between consecutive cycles | cycles |
| --- | --- |
| no change at all | $39$ |
| one constraint added or dropped | $15$ |
| two | $1$ |
| three | $4$ |

The mean is $0.49$ constraints per cycle, and two-thirds of the cycles need no change whatsoever. An online active-set solver warm-started from the previous solution therefore performs zero or one pivot on most cycles — the homotopy from the old problem to the new one crosses no boundary — and the work is a small update of an existing factorisation rather than a solve from scratch.

The same run through a primal-dual interior-point solver, cold-started every cycle, took between $11$ and $15$ iterations with a median of $11$. That is the other half of the picture: the interior-point count barely varies, which is excellent for a worst-case bound and means there is little for a warm start to save. The two families have opposite profiles — one is fast on average and hard to bound, the other is uniform and hard to accelerate.
:::

Warm starting an interior-point method is genuinely awkward, for the reason the optimization module gave: the previous solution sits on the boundary of the feasible region, where the barrier is infinite, so it is not a usable interior point, and nudging it inside generally lands far from the central path. Specialised warm-start techniques exist and buy perhaps a third of the iterations; nothing like the factor an active-set method gets.

::: warning A warm-started average is not a certification argument
Reporting "warm starting cut our median solve from $4.1\,\mathrm{ms}$ to $0.6\,\mathrm{ms}$" is a performance result, not a timing guarantee. The cycles that matter are the ones where the active set changes a lot — a disturbance hits, a constraint becomes active for the first time, a reference steps, a mode changes — and those are exactly the cycles where the warm start is worth least and the solver does the most work. An active-set solver's worst case is bounded only by the number of possible active sets, which is combinatorial. So the honest architecture uses the warm start for performance and bounds the worst case some other way: a hard iteration cap with a proven-safe fallback if it is hit, or a solver whose iteration count does not depend on the warm start at all.
:::

## Choosing the solver

Three solvers dominate embedded MPC, one from each algorithmic family, and the choice follows from the shape of your problem and the kind of guarantee you need.

**qpOASES** implements the online active-set strategy: it traverses a straight line in parameter space from the previous problem to the current one, updating the active set as constraint boundaries are crossed. It is exceptional at exploiting warm starts — the measurement above is precisely its use case — returns exact solutions, and handles the dense condensed formulation natively. Its worst case is its weakness, and its standard mitigation is a cap on working-set changes with the intermediate iterate returned.

**OSQP** solves the QP by ADMM, an operator-splitting method.

::: key OSQP in one line
An operator-splitting (ADMM) QP solver: division-free after a single factorisation, fixed memory, and it detects infeasibility. Its predictable per-iteration cost is why it appears in embedded code generation.
:::

The single factorisation is computed once for a given problem structure and reused for every iteration and every cycle, and each iteration is then a solve against that factor plus a projection — a fixed, small, branch-free amount of work. It converges linearly rather than quadratically, so it reaches moderate accuracy quickly and high accuracy slowly, which suits control, where the command is applied to a plant with its own tolerances. It also produces primal and dual infeasibility certificates, which a mode-logic designer can act on. Its code generator emits library-free C for a parametrised problem, which is why it is the common choice for embedded linear MPC.

**HPIPM** is an interior-point solver written specifically for the sparse, block-banded MPC structure, using a Riccati-based factorisation and its own dense linear-algebra kernels. It gives the uniform iteration count of an interior-point method together with the linear-in-$N$ cost of the sparse formulation, and it is the solver underneath `acados`, where it serves both linear and nonlinear MPC through the real-time iteration scheme.

| | qpOASES | OSQP | HPIPM |
| --- | --- | --- | --- |
| family | active set | ADMM (first order) | interior point |
| formulation | dense, condensed | sparse or dense | sparse, banded |
| cost per iteration | factorisation update | one solve against a fixed factor | one banded factorisation |
| warm start | excellent | good | limited |
| accuracy | exact | moderate, tunable | high |
| iteration count | data-dependent, combinatorial worst case | data-dependent, linear rate | nearly constant |
| infeasibility | detected via the homotopy | certificates | detected |

## Bounding the worst case

Certification needs a number that holds in the worst case, not a percentile. There are three routes, and real programmes use more than one.

**A theoretical bound.** Interior-point methods on a convex QP have an iteration complexity of order $\sqrt{\nu}\log(1/\epsilon)$ in the barrier parameter $\nu$, so a bound exists and is finite. It is also loose — hundreds of iterations where a dozen are observed — so it is the reason a cap can exist, not the cap itself.

**A capped iteration count with a safe output.** Fix the iteration count, as the optimization module's rules require, and make the returned iterate safe. For ADMM and interior-point methods the capped iterate is generally *not* exactly feasible, so the flight code checks the returned plan against the constraints directly — cheap, independent of the solver — and either applies it or triggers the fallback. This check is what converts "the solver ran out of iterations" from an unbounded risk into a defined branch.

**An empirical campaign, used correctly.** Run the dispersion campaign, record the iteration count for every cycle of every case, take the maximum, and multiply by a factor of about two to set the cap. Then re-run the campaign with the cap in place and verify that every case still produces an acceptable plan. The distinction between these two runs matters: the first sizes the cap, the second qualifies the shipped configuration.

And measure tail latency, not the mean. A solver that averages $4\,\mathrm{ms}$ and reaches $60\,\mathrm{ms}$ once in a thousand cycles has already missed a $20\,\mathrm{ms}$ deadline — at $50\,\mathrm{Hz}$ that is once every twenty seconds. The measured statistic that decides flyability is the maximum over the certified envelope, with the $99.9$th percentile as the diagnostic that tells you how far the distribution's tail extends.

::: example Sizing a cap from the measurement
The sixty-cycle run above gave a maximum of $15$ interior-point iterations, a median of $11$ and a spread of four. A cap of $30$ — twice the observed maximum — costs nothing on any cycle that converges, since the solver exits on its residual test long before, and doubles only the worst-case timing figure.

Apply that to the budget table: at $N = 40$ on the rendezvous model, a $25$-iteration sparse solve is $0.73\,\mathrm{ms}$ at $1\,\mathrm{GFLOP/s}$, so a $30$-iteration cap is $0.87\,\mathrm{ms}$, against a $6\,\mathrm{ms}$ allowance. There is margin for a cap of $200$ iterations, which is above the loose theoretical bound for a problem of this size. That is the comfortable case, and it is worth recognising when you are in it: the timing question is settled and the remaining work is determinism and memory, not speed.

The uncomfortable case looks like the $100\,\mathrm{MFLOP/s}$ row — a radiation-hardened processor from an earlier generation — where the same solve takes $7.3\,\mathrm{ms}$, a $30$-iteration cap takes $8.7\,\mathrm{ms}$, and a $6\,\mathrm{ms}$ allowance means cutting the horizon to about $N = 32$, or lowering the control rate, or moving the predictive layer to a slower outer loop. Those are the three levers, and the arithmetic above is how the choice between them gets argued.
:::

## Code generation for MPC

The QP-formulation lesson showed that for a time-invariant problem the Hessian and every constraint matrix are build-time constants, and only two vectors change per cycle: the linear cost term $\mathbf{f} = \mathbf{F}\mathbf{x}$ and the state-dependent constraint right-hand sides. That is exactly the structure a code generator wants.

The workflow mirrors the one the optimization module set out. Define the problem once with the state, reference and bounds as parameters; confirm it is convex and, for CVXPY-based tools, parameter-affine; run the dispersion campaign in the high-level environment to choose the horizon, the tolerances and the iteration cap; then generate C in which the sparsity pattern, the elimination ordering, every loop bound and the workspace size are compile-time constants. Re-run the whole campaign against the generated code and account for every discrepancy. Measure worst-case execution time on the target with the cap in place. Then freeze: the horizon, the cap and the workspace are configuration items, not tuning knobs.

The MPC-specific tools are OSQP's code generator, CVXPYgen for CVXPY models, and `acados`, which generates the whole real-time-iteration loop around HPIPM for nonlinear as well as linear problems. All of them produce a solve function with no dynamic allocation and no library dependencies, which is the property that makes the rest of the argument possible.

## The flight rule

::: key The flight-software rule for onboard optimisers
Never let a control cycle depend on a solver succeeding. Cap iterations, keep the last feasible plan, and carry a certified simple fallback law with a deterministic switch and a telemetry counter.
:::

In practice this is three mechanisms working together. The **shifted previous plan** is held in memory; if this cycle's solve fails or times out, its next input is applied, which is feasible by the recursive-feasibility argument as long as the disturbance was inside the design set. The **fallback law** — a saturated LQR, or the explicit solution of a reduced problem with its computed region of attraction — runs when the shifted plan is exhausted or when the state is outside the region where the plan is trustworthy. The **switch** is deterministic, based on the solver's status, the residual check on the returned plan and the state's membership of a verified set, and every transition increments a counter that reaches the ground.

Two details separate a design that works from one that looks like it works. The fallback must be *tested in the loop*, with the solver deliberately failed on random cycles across the campaign, because a fallback that has never actually been entered in simulation is an assumption rather than a mechanism. And the switching logic needs hysteresis: a controller that alternates between the optimiser and the fallback every other cycle is worse than either alone.

::: note What to write in the design review
The paragraph a review board wants has five sentences in it, and every one needs a number. The control period and the fraction allocated to the solver. The horizon and the resulting problem size, with the formulation named. The iteration cap, where it came from, and what the solver returns if it is reached. The worst-case execution time measured on the flight processor with caches and interrupts in their worst configuration, and the margin against the allocation. And the fallback: what it is, when it engages, what its region of attraction is, and how often it engaged across the campaign. If any of the five is missing, the answer to "can we fly this?" is not yet available — and if all five are present, the discussion becomes an engineering trade rather than an argument about whether optimisers belong in flight software.
:::

## Check yourself

::: check
Your MPC uses qpOASES with warm starting and meets its deadline with a factor of ten of margin in Monte Carlo. The board asks for a worst-case bound. What can you offer?
:::

::: answer
Not a bound derived from the measurements, because an active-set method's worst case is combinatorial in the number of constraints and the campaign will not have visited it. Three things can be offered instead. Cap the number of working-set changes per cycle: qpOASES supports this, and the capped iterate is a point on the homotopy path between the previous and current problems, which is feasible for a problem between them — check it against the true constraints before applying it. Bound the arithmetic per working-set change and multiply by the cap, giving a real worst-case execution time. And carry the fallback, so that the cap being reached is a defined branch rather than a deadline miss. If the board wants a bound with no cap and no fallback, the answer is a different solver family — an interior-point method with a near-constant iteration count, or an explicit solution with a fixed operation count.
:::

::: check
Explain why an active-set solver benefits enormously from warm starting while an interior-point solver hardly does.
:::

::: answer
An active-set method's state is the set of constraints held at equality, and its work is proportional to how far that set must move. The measurement above shows the optimal active set is unchanged on two-thirds of cycles and moves by one constraint on most of the rest, so a solver that starts from the previous set has nearly nothing to do — one factorisation update at most. An interior-point method's state is a point near the central path at a particular barrier parameter, and the previous solution is on the boundary of the feasible set, where the barrier is infinite. It is not a usable starting point; moving it inside puts it somewhere off the central path, from which the solver must still traverse most of the path. The compensation is that the interior-point iteration count barely varies with the data at all — $11$ to $15$ in the run above — so there is not much to save.
:::

::: check
At $100\,\mathrm{MFLOP/s}$ with a $20\,\mathrm{ms}$ period and a $30\,\%$ allocation, the largest condensed horizon is $N = 13$ and the largest sparse horizon is $N = 32$. Your controller needs $N = 60$ for the region of attraction. Name four ways forward and what each costs.
:::

::: answer
Lower the control rate: a $50\,\mathrm{ms}$ period gives $15\,\mathrm{ms}$ to the solver and roughly $N = 80$ sparse, at the cost of disturbance-rejection bandwidth in the predictive layer — usually acceptable if a fast inner loop keeps running, which is exactly the tube architecture. Split the rates: run MPC at $10\,\mathrm{Hz}$ and a fixed-gain inner loop at $50\,\mathrm{Hz}$, which costs an extra design and gains a robustness structure you wanted anyway. Use a non-uniform horizon: fine steps near the present and coarse steps later, so sixty seconds of preview costs perhaps twenty-five nodes, at the cost of prediction accuracy late in the horizon where the constraint geometry must still be resolved. Or buy the throughput: a modern processor at $1\,\mathrm{GFLOP/s}$ turns $N = 32$ into $N = 329$ by the model, at the cost of a qualification programme for the part. Shortening the horizon and hoping is the option that is not on the list, because the region of attraction was the requirement.
:::

::: check
The solver returns after hitting its iteration cap with a plan that violates a softened state constraint by $0.3\,\mathrm{m/s}$. Apply it or not?
:::

::: answer
Check what kind of violation it is before deciding. If the plan violates the *softened* constraint by using slack — that is, the QP's own solution has a nonzero slack — the plan is feasible for the problem as posed and the slack is the controller telling you the envelope cannot be held from here; apply it, log the slack, and let the monitor decide whether the excursion is acceptable. If instead the returned iterate is not a feasible point of the QP at all, which is what an early-terminated ADMM or interior-point iterate typically is, then the plan has no guarantee attached and its first input may be outside the actuator limits or its trajectory outside the envelope. In that case clip the first input to the hard actuator bounds if it is within tolerance, or engage the fallback. The general rule is that the flight code validates the returned plan against the constraints independently of the solver's status flag, because the status flag describes the optimiser's internal state and the constraint check describes the vehicle.
:::

::: check
Why does the condensed formulation appear more often in embedded MPC than the flop counts suggest it should?
:::

::: answer
Because the flop counts drop the constants, and embedded problems sit where the constants dominate. A dense $30 \times 30$ factorisation is straight-line arithmetic on data that fits in cache, running at close to the processor's peak; a banded solver of the same nominal cost pays indexing, block setup and irregular memory access per stage. The condensed problem also has no equality constraints and a single dense matrix, which makes the generated code smaller, simpler to review and easier to bound — all of which matter more than a factor of two in flop count when the argument in front of a certification authority is about determinism. And the condensed size depends only on $m$ and $N$, so a plant with many states and few inputs — an attitude loop with flexible modes — condenses to something tiny. The sparse form wins decisively when the horizon is long or the plant is open-loop unstable, and those two conditions are the ones to check before choosing.
:::

## Summary

| Object | Statement |
| --- | --- |
| Frame budget | Control period $\times$ solver share $\to$ flops available $\to$ largest $N$ |
| Rendezvous figures | $n{=}6$, $m{=}3$, $25$ iterations: $N = 40$ costs $0.73\,\mathrm{ms}$ sparse, $14.4\,\mathrm{ms}$ condensed at $1\,\mathrm{GFLOP/s}$ |
| Largest $N$ in $6\,\mathrm{ms}$ | $100\,\mathrm{MFLOP/s}$: $13$ condensed, $32$ sparse. $1\,\mathrm{GFLOP/s}$: $29$ condensed, $329$ sparse (scaling, not a measurement) |
| Warm start | Shifted previous plan plus terminal law; active set unchanged on $39$ of $59$ cycles, mean change $0.49$ |
| Interior-point profile | $11$ to $15$ iterations over $60$ cycles: uniform, hard to accelerate, easy to bound |
| qpOASES | Online active set, dense condensed, exact, excellent warm start, combinatorial worst case |
| OSQP | ADMM, one factorisation reused, fixed per-iteration cost, infeasibility certificates, code generation |
| HPIPM | Sparse Riccati interior point, near-constant iterations, linear in $N$, the engine inside `acados` |
| Bounding the worst case | Theoretical $\sqrt{\nu}\log(1/\epsilon)$; capped iterations with a constraint check; campaign maximum $\times 2$ |
| Tail latency | The maximum over the envelope decides flyability, never the mean |
| Code generation | Only $\mathbf{f} = \mathbf{F}\mathbf{x}$ and the constraint right-hand sides change per cycle; everything else is a build-time constant |
| Flight rule | Cap iterations, hold the shifted plan, carry a certified fallback with a deterministic switch, hysteresis and a counter |

The last lesson steps back and asks the question the whole module exists to answer: when is all of this worth it, and when is a saturated LQR the right answer?
