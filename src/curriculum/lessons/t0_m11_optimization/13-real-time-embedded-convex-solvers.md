---
id: l13-real-time-embedded-convex-solvers
title: Real-time embedded convex solvers and code generation
minutes: 32
covers:
  - real-time embedded convex solvers and code generation
---

Every lesson in this module has been building one thing: a guidance computer that, with an engine lit and the ground coming up, solves an optimisation problem from scratch and acts on the answer before the next cycle starts. This lesson is about the last gap – between a solver that works on a workstation and one you would let fire an engine.

The gap is not mostly about speed. It is about determinism. A desktop solver allocates memory when it needs it, chooses a pivot order from the numbers it sees, iterates until a tolerance is met, and raises an exception when something goes wrong. None of those four behaviours is acceptable in flight software, and none of them can be fixed by making the code faster. What is needed instead is a solver whose memory is allocated once at initialisation, whose arithmetic sequence is fixed before the first flight, whose iteration count is a constant chosen in advance, and which has exactly two outcomes: a trajectory with a certificate, or a certificate that no trajectory exists.

That is achievable because of everything convexity bought. Lesson 4 promised a global optimum, a bounded iteration count and a certificate; lesson 6 got the landing problem into a cone; lesson 9 supplied the algorithm whose iteration count barely moves with the data; lesson 12 counted the arithmetic. This lesson spends those results.

## Where the time goes

Start from the budget and work inward. Guidance runs at some rate; each cycle must read navigation, solve, check the answer, and hand a command to the control loop. The solver gets a fraction of the cycle – a third is a reasonable planning figure, because navigation, the outer logic, the monitors and the margin all need their share.

::: example The timing budget for the landing SOCP
Lesson 12 counted the discretised landing problem at $N = 100$: about $1.7\times10^6$ floating-point operations per interior-point iteration and $4.2\times10^7$ for a $25$-iteration solve. The reduced KKT dimension is $M = 18N + 20$, so the cost scales essentially linearly in the number of nodes:

| $N$ | $M$ | flops per iteration | flops per $25$-iteration solve |
| --- | --- | --- | --- |
| $20$ | $380$ | $3.5\times10^5$ | $8.8\times10^6$ |
| $30$ | $560$ | $5.2\times10^5$ | $1.3\times10^7$ |
| $50$ | $920$ | $8.5\times10^5$ | $2.1\times10^7$ |
| $100$ | $1820$ | $1.7\times10^6$ | $4.2\times10^7$ |
| $200$ | $3620$ | $3.4\times10^6$ | $8.4\times10^7$ |

Now divide by a cycle. At $10\,\mathrm{Hz}$ the cycle is $100\,\mathrm{ms}$ and a $30\,\%$ solver share is $30\,\mathrm{ms}$; delivering $4.2\times10^7$ operations in that window needs a sustained $1.4\,\mathrm{GFLOP/s}$. At $N = 50$ it needs $709\,\mathrm{MFLOP/s}$, and at $N = 30$, $432\,\mathrm{MFLOP/s}$. Drop the guidance rate to $5\,\mathrm{Hz}$ and the same three cases need $701$, $355$ and $216\,\mathrm{MFLOP/s}$.

Turn it around and assume a processor. At a sustained $100\,\mathrm{MFLOP/s}$ – the order of magnitude of an older radiation-hardened part running double precision – the $N = 100$ solve takes $421\,\mathrm{ms}$ and even $N = 30$ takes $130\,\mathrm{ms}$: guidance at $2\,\mathrm{Hz}$ at best. At $1\,\mathrm{GFLOP/s}$ the same three cases take $42$, $21$ and $13\,\mathrm{ms}$, and a $5\,\mathrm{Hz}$ loop has comfortable margin. At $3\,\mathrm{GFLOP/s}$ they take $14$, $7$ and $4\,\mathrm{ms}$.

The engineering conclusions fall straight out. The number of discretisation nodes is a *real-time* parameter, not only an accuracy one; guidance rate, node count and processor throughput trade against each other linearly; and the honest design conversation is about which two you are willing to fix. These figures also assume a single solve per cycle, which the next example revisits.
:::

::: warning Meeting the deadline on average is not real time
A solver that finishes in $20\,\mathrm{ms}$ on the nominal case and $200\,\mathrm{ms}$ once in a thousand cases has not met a $30\,\mathrm{ms}$ deadline; it has failed it, rarely. Real-time means the *worst* case over the certified envelope is inside the budget, and the argument has to be constructive: a fixed iteration count, a fixed arithmetic sequence per iteration, and a measured worst-case execution time on the actual processor with caches and interrupts in their worst configuration. This is exactly why the properties of lesson 9 matter more than raw speed. An interior-point method on a convex problem has an iteration count that barely moves with the data, so "fixed iteration count" costs almost nothing in solution quality. An SQP, whose count swings by an order of magnitude with the initial guess, cannot make the same trade.
:::

## The rules an embedded solver obeys

Each rule below exists because of a specific failure mode, and each one is a constraint on the solver, not on the problem.

**No dynamic memory after initialisation.** A sparse factorisation with numerical pivoting decides how much fill-in it will produce while it runs, so a general solver cannot know its own memory needs in advance and therefore allocates. Flight software forbids that: an allocation that fails, or fragments the heap, is an unbounded failure mode in a system with no operator. The cure is to fix the sparsity pattern at build time, which the problem structure allows because the *pattern* never changes between cycles – only the numbers do.

**A fixed elimination ordering and no runtime pivoting.** The ordering that minimises fill-in is computed once, offline, from the sparsity pattern. At runtime the factorisation follows that order regardless of the values. Numerical stability, which pivoting would normally provide, comes instead from **static regularisation**: the reduced KKT matrix of lesson 12 is quasi-definite (positive definite block, negative definite block) once small multiples $\pm\delta\mathbf{I}$ are added, and a quasi-definite matrix admits an $\mathbf{L}\mathbf{D}\mathbf{L}^\top$ factorisation for *any* symmetric permutation. The regularisation is then removed by a couple of steps of iterative refinement. This is the single technical trick that makes a branch-free, allocation-free conic solver possible.

**A fixed iteration count.** Not a tolerance, a count. The solver performs exactly $k$ iterations every cycle and returns what it has, together with the primal residual, dual residual and duality gap of lesson 7 so a monitor can judge it.

**No external libraries and no exceptions.** No BLAS, no `malloc`, no `printf`, no exceptions, no recursion, no unbounded loops; every loop bound is a compile-time constant. That is what makes the code reviewable against a coding standard and analysable for worst-case execution time. For the same reason the arithmetic must be bit-reproducible – IEEE-754 double precision, no fast-math reassociation, a fixed summation order – or a Monte-Carlo campaign on the rig proves nothing about the flight article.

**Two outcomes, both certified.** Within the iteration cap the solver returns either an approximately optimal trajectory with a gap small enough to fly, or the infeasibility certificate of lesson 7. The guidance mode logic has a defined response to each, and a third for "the cap was reached with neither" – which, having been measured never to happen over the envelope, is still coded, because "measured never" is not "cannot".

::: key What makes a convex solver flyable
Fixed sparsity pattern and elimination ordering computed offline; static regularisation in place of pivoting, so no runtime decisions; a statically allocated workspace sized at build time; a fixed iteration count rather than a tolerance test; no dynamic memory, no libraries, no exceptions, bounded loops; bit-reproducible arithmetic; and exactly two certified outcomes per cycle – an optimal trajectory with its duality gap, or a proof that none exists.
:::

## Choosing the iteration count

The cap comes from two independent arguments, and you want both.

The **theoretical** argument is lesson 9's: the barrier parameter of the landing problem is $\nu = 902$, so the classical bound is of order $\sqrt{\nu}\log(1/\epsilon) \approx 415$ iterations for six digits. That number is not the cap; it is the reason a finite cap exists at all, and it covers data no lander will ever see.

The **empirical** argument is a contraction estimate plus Monte Carlo. Once the primal-dual iterates are near the central path, the duality gap falls by a roughly constant factor each iteration – lesson 9's two-engine run showed a factor of $100$, and a conservative planning figure for a large structured problem is $0.3$ per iteration. Starting from an initial gap of order $10^3$ and requiring $10^{-6}$,

$$
k \ge \frac{\log(10^{-6}/10^{3})}{\log 0.3} = 17.2 \quad\Longrightarrow\quad 18 \text{ iterations},
$$

and at a contraction of $0.5$ per iteration it is $30$. That bracket – twenty to thirty – is where flight caps for problems of this size actually sit. You then run a Monte-Carlo campaign over the certified envelope: dispersed initial states, masses, winds, target offsets, and deliberately near-infeasible geometries, which are the cases that stress the solver because the strictly feasible region is thin and the central path is long. Record the iteration count needed to reach the required residuals in every case, take the maximum, and multiply by a factor of about two. The cap is that number.

Then, having fixed it, run the campaign again *with* the cap in place and check that every case still produces an acceptable answer. The two runs answer different questions: the first sizes the cap, the second verifies the shipped configuration.

::: example The outer search over final time, and what it costs
Lesson 6 kept the final time $t_f$ out of the SOCP because it multiplies the controls. Practice searches over it from outside, and that search multiplies the budget.

A grid over a $25\,\mathrm{s}$ bracket at $0.5\,\mathrm{s}$ resolution is $50$ solves – at $N = 100$ and $25$ iterations that is $2.1\times10^9$ operations, about $2.1\,\mathrm{s}$ at $1\,\mathrm{GFLOP/s}$, which no cycle can absorb. The optimal cost is a well-behaved function of $t_f$ – decreasing while gravity losses dominate, rising once the vehicle must decelerate harder – so a golden-section search on the bracket needs $\lceil\log(0.5/25)/\log 0.618\rceil = 9$ solves to reach the same resolution, about $3.8\times10^8$ operations and $379\,\mathrm{ms}$ at $1\,\mathrm{GFLOP/s}$. Still too much for a $100\,\mathrm{ms}$ cycle at $N = 100$; comfortable at $N = 30$ and $5\,\mathrm{Hz}$.

Three standard ways to close the remaining gap, all used in practice: shrink the bracket using the previous cycle's answer, since $t_f$ changes by about one cycle time per cycle, so two or three solves suffice; spread the search across cycles, flying the best value found so far while refining it; or drop the node count. The arithmetic above is how that choice gets made, and it is why a flight formulation usually runs far fewer nodes than a study formulation.

Note what the outer search does *not* cost: correctness. Every inner problem is convex and returns a global optimum with a certificate, so the one-dimensional search is over exactly computed values, not over noisy local optima. That is the property lesson 6 was protecting.
:::

::: example The static workspace
Size the memory for the $N = 100$ problem. The reduced KKT matrix is $1820 \times 1820$ with $29{,}435$ nonzeros; a banded $\mathbf{L}\mathbf{D}\mathbf{L}^\top$ factor with half-bandwidth $25$ holds about $Mb = 45{,}500$ nonzeros. The solver also carries the iterate and residual vectors over the full conic dimension $n + p + m = 3423$ – primal, dual, slack, search directions, the affine and corrector right-hand sides, scratch – call it a dozen such vectors.

$$
29{,}435 + 45{,}500 + 12 \times 3423 = 116{,}011 \text{ doubles} = 906\,\mathrm{kB},
$$

plus row and column index arrays for the two sparse matrices, $2 \times 74{,}935$ 32-bit integers, another $585\,\mathrm{kB}$. Total about $1.5\,\mathrm{MB}$, every byte of it allocated at initialisation and never released. Add the Nesterov–Todd scaling blocks ($401$ cones of dimension at most $4$, a few thousand doubles) and the problem data itself, and the working set is comfortably under $2\,\mathrm{MB}$.

Two observations. This fits in the RAM of any plausible flight computer, and a good fraction of it fits in cache, which matters more for real throughput than the flop count does. And the figure is *known at build time* – printed by the code generator, not discovered at runtime – which is the property that lets the integrator reserve it. Halving the node count roughly halves it.
:::

## Why generated code rather than a general solver

A general solver has to work for any problem you hand it. That requirement, and not sloppiness, is what forces the behaviours flight software forbids: it must discover the sparsity pattern at runtime, compute an ordering from it, allocate the resulting workspace, and branch on what it finds. Tens of thousands of lines exist to handle cases your problem does not have.

A **code generator** inverts the arrangement. You supply the problem *structure* once – the parametrized model of lesson 12, with the vehicle state, mass, target and bounds as parameters – and it emits C for that problem and no other. Sparsity pattern, elimination ordering, loop bounds and workspace sizes become compile-time constants; the linear algebra is partly unrolled straight-line arithmetic; there is no modelling layer, no allocation and no library dependency at runtime, and the result is small enough to read.

The tools, in the order they appeared: **CVXGEN** (Mattingley and Boyd) generates library-free C for small QPs, with solve times in the microseconds, and was the first to make the case. **ECOS** was designed from the start for embedded use and ships a code-generation path for SOCPs. **OSQP** generates C for parametrized QPs and is widely used in embedded model-predictive control. **CVXPYgen** closes the loop by generating C directly from a DPP-compliant CVXPY model, so the problem you tested in Python and the problem the vehicle solves are the same object.

The workflow that results is the one you should picture for the rest of your career in this area:

1. Write the problem in CVXPY with `Parameter` objects for everything that changes per cycle, and confirm it is DCP and DPP compliant.
2. Solve it in Python across the dispersion campaign; record iteration counts and residuals; choose the node count, tolerances and iteration cap.
3. Generate C. Compile it for the target with the same flags the flight build uses.
4. Re-run the entire campaign against the generated code and check bit-level agreement with the Python solve on every case, or explain every discrepancy.
5. Measure worst-case execution time on the target hardware with the cap in place.
6. Freeze. The iteration count, the workspace size and the arithmetic sequence are now part of the configuration, not parameters anyone may tune in the field.

::: warning Warm starting trades determinism for speed
It is tempting to start each cycle from the previous cycle's solution, and for a model-predictive controller using OSQP that is exactly right – lesson 12 showed it can cut the iteration count by an order of magnitude. For an interior-point guidance solve it is the wrong trade twice over. Lesson 9 explained the first reason: the previous solution lies on the boundary of the cone where the barrier is infinite, so it is not a usable starting point, and nudging it inside generally leaves it far off the central path with no saving. The second reason is certification. If the solver's starting point depends on history, then its worst-case behaviour depends on history too, and the Monte-Carlo argument must cover sequences of cycles rather than individual ones – a combinatorially larger claim. A cold start from a fixed, data-independent initial point makes each cycle's worst case independent of every other, which is what allows a per-cycle timing guarantee at all.
:::

## The landing algorithm, end to end

Put the module together, in the order the computer executes it.

Once per cycle, navigation supplies the state $(\mathbf{r}, \mathbf{v}, m)$. The guidance function forms the SOCP of lesson 6: dynamics made affine by $\mathbf{u} = \mathbf{T}/m$, $\sigma = \Gamma/m$, $z = \ln m$; the minimum-throttle constraint replaced by the lossless convexification $\|\mathbf{u}\|_2 \le \sigma$ with $\sigma$ between bounds, exact rather than conservative; the pointing and glide-slope cones; the terminal conditions; a linear objective. Time is discretised into a few tens of nodes, and the final time is a parameter searched from outside.

Two problems are solved in sequence. The first minimises the distance from the achievable landing point to the target and answers "can we get there?" – returning, if not, the closest reachable point, which is a usable answer rather than a failure. The second minimises propellant subject to landing at least as close as the first showed possible. Both have identical structure and differ only in data, so one generated solver serves both.

Each solve runs a fixed number of interior-point iterations on a statically allocated workspace with a precomputed ordering, and returns the trajectory with its primal residual, dual residual and duality gap. A monitor checks those three numbers and the trajectory's constraint satisfaction directly – the certificate of lesson 7 is cheap to verify independently of the solver that produced it – and either accepts the command or triggers a mode change. There is no "retry with a different guess", no local minimum to escape, and no convergence failure to diagnose in flight.

::: note What is public, and what is not
The mathematics has a documented lineage. Lossless convexification of the minimum-throttle constraint is due to Açıkmeşe and Ploen, published in the *Journal of Guidance, Control, and Dynamics* in 2007 for Mars powered descent, and developed further with Blackmore, Scharf and others. The resulting algorithm, G-FOLD (Guidance for Fuel-Optimal Large Divert), was flight-tested onboard Masten Space Systems' Xombie vertical-takeoff-vertical-landing vehicle in 2012 and 2013 in a JPL collaboration, computing divert trajectories in flight – the first demonstration that this class of problem could be solved onboard in real time. Blackmore's 2016 article "Autonomous Precision Landing of Space Rockets", in the National Academy of Engineering's *The Bridge*, describes the convex-optimisation approach applied to rocket landing.

What is *not* public is any company's flight software. SpaceX has not published its guidance algorithm, its solver, its node count or its iteration cap, and nobody outside should claim to know them. What can be said with confidence is that the published method – convexify losslessly, change variables to make the dynamics affine, discretise, solve a second-order cone program onboard every guidance cycle with a fixed iteration budget – is the approach the field converged on, and that the people who developed it went on to work on landing rockets. Treat the numbers in this lesson as what they are: your own arithmetic, from a formulation you can derive, on assumptions you have stated.
:::

## Check yourself

::: check
A vendor offers a conic solver that is "three times faster than ECOS on average" but allocates a workspace whose size depends on the data. Can you use it in the guidance loop?
:::

::: answer
No, and the average speed is not the reason. A data-dependent workspace means the solver can attempt an allocation in flight, which can fail or fragment, and it means the memory the integrator must reserve is unknown at build time – both disqualifying on their own. It also implies the sparsity pattern or the pivot order is being decided at runtime, which breaks worst-case execution time analysis, and probably means data-dependent branching, which breaks bit-reproducibility. You could still use it on the ground for the dispersion campaign, for cross-checking the flight solver's answers, or in a hardware-in-the-loop rig as a reference. The flight path needs generated code whose workspace, loop bounds and arithmetic sequence are compile-time constants, even if that code is slower on average.
:::

::: check
Using the table in the timing example, find the largest node count that fits a $5\,\mathrm{Hz}$ guidance loop on a processor sustaining $500\,\mathrm{MFLOP/s}$, with the solver allowed $30\,\%$ of the cycle and three solves per cycle for the $t_f$ search.
:::

::: answer
The cycle is $200\,\mathrm{ms}$ and the solver's share is $60\,\mathrm{ms}$, of which three solves get $20\,\mathrm{ms}$ each. At $500\,\mathrm{MFLOP/s}$ that is $10^7$ operations per solve. From the scaling $25 \times 925 \times (18N + 20)$ operations, set $23{,}125(18N + 20) = 10^7$: $18N + 20 = 432$, so $N = 22.9$ – about $22$ nodes, and $20$ with a little margin. Reading the table confirms it: $N = 20$ costs $8.8\times10^6$ per solve, $N = 30$ costs $1.3\times10^7$ and would not fit three times. The lesson is that the outer search is expensive: without it, $N = 50$ would fit. That is the argument for shrinking the $t_f$ bracket with the previous cycle's answer, which turns three solves into one or two and buys back the node count.
:::

::: check
Why does static regularisation let a solver skip pivoting, and what is the cost?
:::

::: answer
Pivoting exists to avoid dividing by a small or zero diagonal entry during factorisation, and because the entry that is small depends on the numbers, the pivot order cannot be fixed in advance – which is precisely what the flight rules forbid. A **quasi-definite** matrix, one that is symmetric with a positive definite leading block and a negative definite trailing block, has a theorem attached: it admits an $\mathbf{L}\mathbf{D}\mathbf{L}^\top$ factorisation for every symmetric permutation, so the ordering may be chosen offline purely to minimise fill-in. The reduced KKT matrix of lesson 12 has a zero trailing block rather than a negative definite one, so adding $+\delta\mathbf{I}$ to the first block and $-\delta\mathbf{I}$ to the second makes it quasi-definite. The cost is that you have factorised a slightly perturbed matrix, so the computed step solves a nearby system; a couple of steps of iterative refinement against the true matrix recover the accuracy, at a few extra triangular solves per iteration – cheap, since the factor is already in hand.
:::

::: check
The flight cap is $25$ iterations. On one dispersed case the solver reaches the cap with a duality gap of $2\times10^{-3}$ relative to an objective of order $10^2$. What should the vehicle do?
:::

::: answer
It should look at what the number means rather than at the fact that the cap was hit. A relative gap of $2\times10^{-5}$ means the returned trajectory's propellant cost is within about $0.002\,\%$ of the best achievable – by the certificate of lesson 7, that is a proof, not an estimate. What actually matters is whether the returned trajectory is *feasible* to the accuracy the vehicle needs: check the primal residual, and check the constraints directly – terminal position and velocity, glide slope, throttle bounds, pointing – against the margins the vehicle can absorb. If they pass, fly it; a slightly suboptimal but feasible trajectory is exactly what the fixed-iteration design is built to produce. If the primal residual is large, the iterate is not yet feasible and the answer must not be flown; that is a mode-change condition. Separately, log the case: a cap hit during the campaign is a sign the cap or the node count needs revisiting before flight, even if this particular answer was usable.
:::

::: check
Explain, to a systems engineer who has never seen this module, why the landing problem is formulated convexly even though the convex version is slightly conservative.
:::

::: answer
Because the convex version comes with three guarantees that the exact version cannot offer, and on a vehicle those guarantees are worth more than the last fraction of a percent of propellant. First, whatever the solver returns is the global best answer to the problem as posed – there is no possibility of the computer settling on a poor trajectory because of where it started. Second, the work is bounded in advance: a fixed number of iterations, each a fixed amount of arithmetic on a fixed-size workspace, so the worst-case time can be measured and certified before flight rather than hoped for during it. Third, the answer arrives with a proof that can be checked independently in microseconds, and when no trajectory exists, the "no" arrives with a proof too, so the mode logic can act on it. The price is that some constraints are stated a little more tightly than physics requires – and in the case that matters most, the minimum-throttle bound, lossless convexification means the price is exactly zero. Ground tools such as IPOPT can and do measure the remaining conservatism during design, which is how the trade is justified with a number rather than an opinion.
:::

## Summary

| Object | Statement |
| --- | --- |
| Cost model | $M = 18N + 20$; about $M(b^2 + 12b)$ flops per iteration with $b \approx 25$; $\times$ the iteration cap per solve |
| Budget chain | Cycle $\to$ solver share $\to$ solves per cycle $\to$ flops per solve $\to$ required throughput |
| Worked figures | $N = 100$: $4.2\times10^7$ flops per solve; $1.4\,\mathrm{GFLOP/s}$ for $30\,\mathrm{ms}$; $421\,\mathrm{ms}$ at $100\,\mathrm{MFLOP/s}$, $42\,\mathrm{ms}$ at $1\,\mathrm{GFLOP/s}$ |
| No dynamic memory | Sparsity pattern and ordering fixed offline; workspace allocated at initialisation |
| Static regularisation | $\pm\delta\mathbf{I}$ makes the KKT matrix quasi-definite, so any symmetric ordering factorises; refine to recover accuracy |
| Fixed iteration count | Contraction $0.3$ per iteration: $10^3 \to 10^{-6}$ in $18$ iterations; $0.5$ gives $30$; cap from Monte Carlo maximum $\times 2$ |
| Determinism | IEEE-754 double, no fast-math, fixed summation order, bounded loops, no exceptions, no libraries |
| Two outcomes | Trajectory with residuals and duality gap, or infeasibility certificate; both checkable by an independent monitor |
| Static workspace | $N = 100$: $116{,}011$ doubles ($906\,\mathrm{kB}$) plus $585\,\mathrm{kB}$ of indices, about $1.5\,\mathrm{MB}$, known at build time |
| Outer $t_f$ search | Golden section: $9$ solves for $0.5\,\mathrm{s}$ resolution on a $25\,\mathrm{s}$ bracket against $50$ for a grid; shrink the bracket with the previous cycle |
| Warm start | Rejected for interior-point guidance: no benefit from a boundary point, and it makes the timing argument history-dependent |
| Code generation | CVXGEN, ECOS, OSQP, CVXPYgen: structure in, problem-specific C out, sizes and ordering as compile-time constants |
| Workflow | Parametrized CVXPY model $\to$ campaign $\to$ generate $\to$ re-run campaign against the C $\to$ measure worst-case time $\to$ freeze |
| Flown method | Lossless convexification, mass-linearising change of variables, discretise, two SOCPs per cycle, fixed iteration budget, generated code |

That is the module. You can now look at a guidance problem and say whether it is convex; write it in second-order cone standard form; state the KKT conditions and read a multiplier as a price; explain what duality certifies and what an interior-point method guarantees; choose between a convex formulation and an NLP with the reasons in hand; solve the convex one in CVXPY; and describe, with numbers, what has to change before the same solve runs onboard with an engine lit.
