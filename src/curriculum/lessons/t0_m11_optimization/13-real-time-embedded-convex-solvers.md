---
id: l13-real-time-embedded-convex-solvers
title: Real-time embedded convex solvers and code generation
minutes: 24
covers:
  - real-time embedded convex solvers and code generation
---

Think about homework versus a timed exam. Homework can take as long as you need. In the exam, the bell rings and the paper goes in, finished or not. A guidance computer lives in the exam room. With an engine lit and the ground coming up, it must solve an optimization problem from scratch and act on the answer before the next cycle starts.

This lesson is about the last gap: between a solver that works on a workstation and one you would let fire an engine. The gap is mostly not about speed. It is about **determinism** — doing the same predictable thing every time. A desktop solver grabs memory when it needs it, picks a pivot order from the numbers it sees, iterates until a tolerance is met, and throws an error when something goes wrong. None of those four habits is acceptable in flight software, and faster code fixes none of them.

What is needed is a solver whose memory is set aside once at startup, whose arithmetic sequence is fixed before the first flight, whose iteration count is a constant chosen in advance, and which has exactly two outcomes: a trajectory with a certificate, or a certificate that no trajectory exists. Convexity makes that possible — lesson 4's guarantees, lesson 6's cone, lesson 9's steady iteration count, lesson 12's arithmetic. This lesson spends them.

## Where the time goes

Start from the budget and work inward. Each guidance cycle must read navigation, solve, check the answer, and hand a command to the control loop. The solver gets only a share — a third is a reasonable planning figure, because navigation, mode logic, monitors and margin need theirs.

::: example The timing budget for the landing SOCP
Lesson 12 counted $N = 100$ nodes: about $1.7\times10^6$ floating-point operations per interior-point iteration and $4.2\times10^7$ per $25$-iteration solve. The reduced KKT size is $M = 18N + 20$, and each iteration costs about $M(b^2 + 12b)$ with half-bandwidth $b \approx 25$, that is $925M$. So cost grows in step with node count:

| $N$ | $M$ | flops per iteration | flops per $25$-iteration solve |
| --- | --- | --- | --- |
| $20$ | $380$ | $3.5\times10^5$ | $8.8\times10^6$ |
| $30$ | $560$ | $5.2\times10^5$ | $1.3\times10^7$ |
| $50$ | $920$ | $8.5\times10^5$ | $2.1\times10^7$ |
| $100$ | $1820$ | $1.7\times10^6$ | $4.2\times10^7$ |
| $200$ | $3620$ | $3.3\times10^6$ | $8.4\times10^7$ |

**Divide by a cycle.** At $10\,\mathrm{Hz}$ the cycle is $100\,\mathrm{ms}$ and a $30\,\%$ solver share is $30\,\mathrm{ms}$. Delivering $4.2\times10^7$ operations in $0.03\,\mathrm{s}$ needs $4.2\times10^7 / 0.03 = 1.4\times10^9$ per second: $1.4\,\mathrm{GFLOP/s}$ (billion flops per second), sustained. At $N = 50$ it needs $709\,\mathrm{MFLOP/s}$ (million per second); at $N = 30$, $432\,\mathrm{MFLOP/s}$. At $5\,\mathrm{Hz}$ the same three need $701$, $355$ and $216\,\mathrm{MFLOP/s}$.

**Turn it around.** At a sustained $100\,\mathrm{MFLOP/s}$ — roughly an older **[[radiation-hardened|rad-hard]]** part in double precision — the $N = 100$ solve takes $4.2\times10^7 / 10^8 = 0.421\,\mathrm{s}$, and even $N = 30$ takes $130\,\mathrm{ms}$: $2\,\mathrm{Hz}$ guidance at best. At $1\,\mathrm{GFLOP/s}$ the three take $42$, $21$ and $13\,\mathrm{ms}$, and $5\,\mathrm{Hz}$ has comfortable margin. At $3\,\mathrm{GFLOP/s}$: $14$, $7$ and $4\,\mathrm{ms}$.

**Sanity check.** Doubling $N$ roughly doubles every time, as the table says.

So the node count is a *real-time* setting, not only an accuracy one. Guidance rate, node count and processor speed trade against each other in straight lines, and the honest design conversation is about which two you fix. These figures assume one solve per cycle, which a later example revisits.
:::

::: warning Meeting the deadline on average is not real time
A solver that takes $20\,\mathrm{ms}$ on the nominal case and $200\,\mathrm{ms}$ once in a thousand cases has not met a $30\,\mathrm{ms}$ deadline. It has failed it, rarely. Real time means the **[[worst case|wcet-picture]]** over the certified envelope fits the budget, shown constructively: a fixed iteration count, a fixed arithmetic sequence per iteration, and a measured worst-case execution time on the real processor with caches and interrupts at their worst. That is why lesson 9's properties matter more than raw speed. An interior-point method on a convex problem has an iteration count that barely moves with the data, so fixing the count costs almost nothing. An SQP, whose count swings tenfold with the starting guess, cannot make that trade.
:::

## The rules an embedded solver obeys

Each rule answers a specific way things fail.

**No dynamic memory after startup.** A general sparse factorization with pivoting decides its fill-in (new nonzeros created while factorizing) as it runs, so it cannot know its memory needs in advance and asks for memory on the fly — **[[dynamic allocation|heap-word]]**. Flight software forbids that: a request that fails, or memory that fragments, is an unbounded failure with no operator aboard. The cure is to fix the sparsity pattern at build time, which works because the *pattern* never changes between cycles — only the numbers.

**A fixed elimination order, no runtime pivoting.** The order that keeps fill-in smallest is computed once, offline, and followed whatever the values. Pivoting normally protects against dividing by a tiny number; here **static regularization** does that job. Add small multiples $\pm\delta\mathbf{I}$ ("plus or minus delta times the identity") to lesson 12's reduced KKT matrix and it becomes **[[quasi-definite|quasi-definite-why]]**: a positive definite block and a negative definite block. A quasi-definite matrix has an $\mathbf{L}\mathbf{D}\mathbf{L}^\top$ factorization for *any* symmetric ordering. A couple of steps of iterative refinement then remove the regularization's effect. This one trick makes a branch-free, allocation-free conic solver possible.

**A fixed iteration count.** Not a tolerance — a count. Exactly $k$ iterations every cycle, returning what it has plus lesson 7's primal residual, dual residual and duality gap for a monitor to judge.

**No libraries, no exceptions.** No BLAS (a standard linear-algebra library), no `malloc`, no `printf`, no exceptions, no recursion, no unbounded loops; every loop bound is a compile-time constant. That makes the code reviewable against a coding standard and analyzable for worst-case time. The arithmetic must also be **[[bit-reproducible|float-order]]**: IEEE-754 double precision, no "fast-math" reordering, a fixed summation order — or a test campaign on the rig proves nothing about the flight unit.

**Two outcomes, both certified.** Within the cap the solver returns either a nearly optimal trajectory with a gap small enough to fly, or lesson 7's infeasibility certificate. The mode logic responds to each — and to a third case, "cap reached with neither", which is coded even though it was measured never to happen, because "measured never" is not "cannot".

::: key What makes a convex solver flyable
Fixed sparsity pattern and elimination ordering computed offline; static regularization in place of pivoting, so no runtime decisions; a statically allocated workspace sized at build time; a fixed iteration count rather than a tolerance test; no dynamic memory, no libraries, no exceptions, bounded loops; bit-reproducible arithmetic; and exactly two certified outcomes per cycle — an optimal trajectory with its duality gap, or a proof that none exists.
:::

::: key Why interior-point SOCP, not a general NLP solver
An interior-point method on a convex problem converges to the global optimum in a bounded, essentially data-independent number of iterations (tens), detects infeasibility, and has no local minima to get trapped in — so you can certify the worst-case runtime for a real-time deadline.
:::

## Choosing the iteration count

The cap comes from two separate arguments, and you want both.

The **theoretical** one is lesson 9's. The barrier parameter is $\nu = 902$ ("nu"), so the classical bound is of order $\sqrt{\nu}\ln(1/\epsilon) = 30.0 \times \ln 10^6 \approx 415$ iterations for six digits. That is not the cap. It is the reason a finite cap exists at all.

The **empirical** one is a shrink-rate estimate plus testing. Near the central path the duality gap falls by a roughly constant factor per iteration. Lesson 9's two-engine run showed $100$; a cautious planning figure for a big structured problem is $0.3$. From a gap of about $10^3$ down to $10^{-6}$ you need $10^3 \times 0.3^k \le 10^{-6}$. Take logs and divide by $\log 0.3$, which is negative, so the inequality flips:

$$
k \ge \frac{\log(10^{-6}/10^{3})}{\log 0.3} = 17.2 \quad\Longrightarrow\quad 18 \text{ iterations}.
$$

At a **[[slower shrink of 0.5|contraction-picture]]** it is $30$. Twenty to thirty is where flight caps for problems this size actually sit.

Then run a **[[Monte Carlo|monte-carlo-word]]** campaign over the certified envelope: scattered initial states, masses, winds and target offsets, plus near-infeasible geometries, which stress the solver most because the feasible region is thin and the central path long. Record the iterations each case needs, take the maximum, and multiply by about two. That is the cap. Then run the campaign again *with* the cap and check every case still gives an acceptable answer: the first run sizes the cap, the second checks what you ship.

::: example The outer search over final time, and what it costs
Lesson 6 kept the final time $t_f$ out of the SOCP because it multiplies the controls, so it is searched from outside — which multiplies the budget.

**A grid** over a $25\,\mathrm{s}$ bracket at $0.5\,\mathrm{s}$ spacing is $25 / 0.5 = 50$ solves: at $N = 100$, $50 \times 4.21\times10^7 = 2.1\times10^9$ operations, about $2.1\,\mathrm{s}$ at $1\,\mathrm{GFLOP/s}$. No cycle can absorb that.

**A smarter search.** The best cost is a well-behaved function of $t_f$: it falls while gravity losses dominate, then rises once the vehicle must brake harder. So a **[[golden-section search|golden-section-picture]]** works: each new solve shrinks the bracket to $0.618$ of its length. Nine shrinks suffice, since $\lceil\log(0.5/25)/\log 0.618\rceil = 9$ and $0.618^9 \times 25 = 0.33\,\mathrm{s}$. It takes two solves to begin and one per shrink after the first: $10$ solves, $4.2\times10^8$ operations, $421\,\mathrm{ms}$ at $1\,\mathrm{GFLOP/s}$. Still too much for a $100\,\mathrm{ms}$ cycle at $N = 100$; comfortable at $N = 30$ and $5\,\mathrm{Hz}$.

Three standard ways close the rest of the gap: shrink the bracket using last cycle's answer ($t_f$ moves about one cycle time per cycle, so two or three solves suffice); spread the search across cycles, flying the best value so far; or drop the node count. That is why flight formulations run far fewer nodes than study formulations.

What the search does *not* cost is correctness. Every inner problem is convex and returns a certified global optimum, so the search runs over exact values, not noisy local optima — what lesson 6 was protecting.
:::

::: example The static workspace
Size the memory for $N = 100$. The reduced KKT matrix has $29{,}435$ nonzeros. A banded factor with half-bandwidth $25$ holds about $Mb = 1820 \times 25 = 45{,}500$. The solver also keeps about a dozen vectors of the full conic size $n + p + m = 3423$ — primal, dual, slack, search directions, right-hand sides, scratch.

$$
29{,}435 + 45{,}500 + 12 \times 3423 = 116{,}011 \text{ doubles}.
$$

At $8$ bytes each that is $928{,}088$ bytes, about $928\,\mathrm{kB}$. Row and column index arrays for the two sparse matrices add $2 \times 74{,}935$ four-byte integers, another $599\,\mathrm{kB}$. Total about $1.5\,\mathrm{MB}$, set aside at startup and never released; the cone scaling blocks and problem data keep it under $2\,\mathrm{MB}$.

**Sanity check.** That fits any plausible flight computer, and much of it fits in cache, which matters more for real speed than the flop count. The figure is *known at build time* — printed by the code generator — so the integrator can reserve it. Halving the node count roughly halves it.
:::

## Why generated code rather than a general solver

A general solver must work for any problem. That requirement — not sloppiness — forces the forbidden behaviors: discover the sparsity pattern at runtime, compute an ordering, allocate a workspace, branch on what it finds.

A **code generator** flips this around. Compare a restaurant that can cook anything with a machine that makes one sandwich: less flexible, but you know exactly what you get and how long it takes. You supply the problem *structure* once — lesson 12's parametrized model — and the generator writes C code for that problem only. Sparsity pattern, ordering, loop bounds and workspace sizes become compile-time constants; the linear algebra is partly unrolled into straight-line arithmetic; nothing is allocated and no library is needed at runtime.

The tools, in order of appearance: **CVXGEN** (Mattingley and Boyd), library-free C for small QPs solving in microseconds, which first made the case; **ECOS**, designed for embedded use, with a code-generation path for SOCPs; **OSQP**, generating C for parametrized QPs, widely used in embedded model-predictive control; and **CVXPYgen**, generating C straight from a DPP-compliant CVXPY model, so the problem you tested in Python and the one the vehicle solves are the same object.

The workflow:

1. Write the problem in CVXPY with a `Parameter` for everything that changes per cycle; confirm it is DCP and DPP compliant.
2. Solve it in Python across the scatter campaign; choose node count, tolerances and iteration cap.
3. Generate C and compile it for the target with the flight build's flags.
4. Re-run the campaign against the C; check bit-level agreement with Python on every case, or explain every difference.
5. Measure worst-case execution time on the target with the cap in place.
6. Freeze. Iteration count, workspace and arithmetic sequence are now configuration, not knobs to tune in the field.

::: warning Warm starting trades determinism for speed
Starting each cycle from last cycle's answer is exactly right for a model-predictive controller on OSQP — lesson 12 showed it can cut iterations tenfold. For interior-point guidance it is wrong twice. First, as lesson 9 explained, the last solution sits on the cone's boundary where the barrier is infinite; nudged inside, it is usually far off the central path, with no saving. Second, certification: if the start depends on history, so does the worst case, and the tests must cover *sequences* of cycles — a vastly bigger claim. A cold start from a fixed, data-independent point makes each cycle's worst case independent of every other, which is what allows a per-cycle timing guarantee at all.
:::

## The landing algorithm, end to end

Once per cycle, navigation supplies position, velocity and mass $(\mathbf{r}, \mathbf{v}, m)$. Guidance forms lesson 6's SOCP: dynamics made affine by $\mathbf{u} = \mathbf{T}/m$, $\sigma = \Gamma/m$, $z = \ln m$; the minimum-throttle limit replaced by the lossless convexification $\|\mathbf{u}\|_2 \le \sigma$ with $\sigma$ between bounds, exact rather than conservative; pointing and glide-slope cones; end conditions; a linear objective; a few tens of nodes; $t_f$ searched from outside.

Two problems are solved in a row. The first minimizes the distance from the reachable landing point to the target — "can we get there?" — and if not, returns the closest reachable point, a usable answer rather than a failure. The second minimizes propellant subject to landing at least that close. Same structure, different data, so one generated solver serves both.

Each solve runs a fixed number of iterations on a static workspace and returns the trajectory with its residuals and duality gap. A monitor checks those and the constraints directly — lesson 7's certificate is cheap to verify independently — and accepts the command or triggers a mode change. No "retry with a different guess", no local minimum, no convergence failure to diagnose in flight.

::: note What is public, and what is not
The mathematics — **[[lossless convexification and G-FOLD|gfold-history]]** — was published and flight-tested in the open. No company's flight software is public. SpaceX has not published its guidance algorithm, solver, node count or iteration cap, and nobody outside should claim to know them. What can be said is that the published method — convexify losslessly, change variables so the dynamics are affine, discretize, solve an SOCP onboard every cycle with a fixed iteration budget — is the approach the field converged on. Treat this lesson's numbers as your own arithmetic, from a formulation you can derive, on assumptions you have stated.
:::

## Check yourself

::: check
A vendor offers a conic solver that is "three times faster than ECOS on average" but allocates a workspace whose size depends on the data. Can you use it in the guidance loop?
:::

::: answer
No — and average speed is not the reason. A data-dependent workspace means it may allocate memory in flight, which can fail or fragment, and the memory to reserve is unknown at build time; either alone disqualifies it. It also implies the pattern or pivot order is decided at runtime, which breaks worst-case timing analysis, and probably data-dependent branching, which breaks bit-reproducibility. It is still useful on the ground, for the campaign or for cross-checking the flight solver. The flight path needs generated code with compile-time workspace, loop bounds and arithmetic sequence, even if slower on average.
:::

::: check
Using the timing table, find the largest node count that fits a $5\,\mathrm{Hz}$ guidance loop on a processor sustaining $500\,\mathrm{MFLOP/s}$, with the solver allowed $30\,\%$ of the cycle and three solves per cycle for the $t_f$ search.
:::

::: answer
The cycle is $200\,\mathrm{ms}$, the solver's share $60\,\mathrm{ms}$, so each of three solves gets $20\,\mathrm{ms}$: $5\times10^8 \times 0.02 = 10^7$ operations. One solve costs $25 \times 925 \times (18N + 20) = 23{,}125\,(18N + 20)$. Setting that to $10^7$ gives $18N + 20 = 432$, so $N = 22.9$ — about $22$ nodes, $20$ with margin. The table agrees: $N = 20$ costs $8.8\times10^6$ per solve, while $N = 30$ costs $1.3\times10^7$ and would not fit three times. Without the outer search, $N = 50$ would fit — the argument for shrinking the $t_f$ bracket with last cycle's answer to buy back nodes.
:::

::: check
Why does static regularization let a solver skip pivoting, and what does it cost?
:::

::: answer
Pivoting avoids dividing by a small or zero diagonal entry, and which entry is small depends on the numbers — so the pivot order cannot be fixed in advance, which the flight rules demand. A **quasi-definite** matrix (symmetric, positive definite leading block, negative definite trailing block) has an $\mathbf{L}\mathbf{D}\mathbf{L}^\top$ factorization for every symmetric ordering, so the ordering can be chosen offline purely to limit fill-in. Lesson 12's reduced KKT matrix has a zero trailing block; adding $+\delta\mathbf{I}$ to the first block and $-\delta\mathbf{I}$ to the second makes it quasi-definite. The cost: you factorized a slightly perturbed matrix, so the step solves a nearby system. A couple of iterative-refinement steps against the true matrix recover the accuracy, for a few extra triangular solves per iteration — cheap, since the factor is in hand.
:::

::: check
The flight cap is $25$ iterations. On one scattered case the solver reaches the cap with a duality gap of $2\times10^{-3}$, on an objective of about $10^2$. What should the vehicle do?
:::

::: answer
Look at what the number means, not at the cap being hit. The relative gap is $2\times10^{-3} / 10^2 = 2\times10^{-5}$: the propellant cost is within about $0.002\,\%$ of the best achievable, and by lesson 7's certificate that is a proof, not an estimate. What matters is *feasibility*. Check the primal residual and the constraints directly — end position and velocity, glide slope, throttle, pointing — against the vehicle's margins. If they pass, fly it; a slightly suboptimal feasible trajectory is exactly what the fixed-iteration design is built to produce. If the primal residual is large, the iterate is not feasible and must not be flown: a mode change. Either way, log it — a cap hit in the campaign means the cap or node count needs revisiting before flight.
:::

::: check
Explain, to a systems engineer who has never seen this module, why the landing problem is written convexly even though the convex version is slightly conservative.
:::

::: answer
Because the convex version brings three guarantees the exact one cannot, and on a vehicle they are worth more than the last fraction of a percent of propellant. First, the answer is the global best for the problem as posed; the computer cannot settle on a poor trajectory because of where it started. Second, the work is bounded in advance — fixed iterations, fixed arithmetic, fixed workspace — so worst-case time is certified before flight, not hoped for during it. Third, the answer carries a proof checkable in microseconds, and when no trajectory exists, the "no" carries a proof too, so the mode logic can act. The price is some constraints stated a little more tightly than physics needs; for the one that matters most, minimum throttle, lossless convexification makes it exactly zero. Ground tools such as IPOPT measure the remaining conservatism during design, so the trade rests on a number, not an opinion.
:::

## Summary

| Object | Statement |
| --- | --- |
| Cost model | $M = 18N + 20$; about $M(b^2 + 12b)$ flops per iteration, $b \approx 25$; times the cap per solve |
| Budget chain | Cycle $\to$ solver share $\to$ solves per cycle $\to$ flops per solve $\to$ throughput |
| Worked figures | $N = 100$: $4.2\times10^7$ per solve; $1.4\,\mathrm{GFLOP/s}$ for $30\,\mathrm{ms}$; $421\,\mathrm{ms}$ at $100\,\mathrm{MFLOP/s}$ |
| Static regularization | $\pm\delta\mathbf{I}$ makes the KKT matrix quasi-definite; any ordering factorizes; refine |
| Iteration cap | Shrink $0.3$: $10^3 \to 10^{-6}$ in $18$; $0.5$ gives $30$; cap = campaign maximum $\times 2$ |
| Determinism | IEEE-754 double, no fast-math, fixed summation order, bounded loops, no libraries |
| Two outcomes | Trajectory with residuals and gap, or infeasibility certificate |
| Static workspace | $N = 100$: $116{,}011$ doubles ($928\,\mathrm{kB}$) plus $599\,\mathrm{kB}$ of indices, about $1.5\,\mathrm{MB}$ |
| Outer $t_f$ search | Golden section: $10$ solves against $50$ for a grid |
| Warm start | Rejected for interior-point guidance |
| Code generation | CVXGEN, ECOS, OSQP, CVXPYgen: structure in, problem-specific C out |

That is the module. You can now recognize a convex guidance problem, put it in cone form, solve it in CVXPY, and say with numbers what must change before that solve runs onboard with an engine lit.

::: context rad-hard Why flight computers are slow
Space is full of fast charged particles — from the Sun, from deep space, and trapped in Earth's radiation belts. One of them can flip a bit in a chip's memory or even burn out a transistor. **Radiation-hardened** processors are built and tested to survive that, which takes years of design and qualification, so they lag years behind the chip in your phone. The RAD750, the processor aboard the Curiosity and Perseverance Mars rovers, runs at up to $200\,\mathrm{MHz}$. That is why this lesson counts every flop.
:::

::: context wcet-picture The average hides the tail
Picture a thousand solve times. Almost all of them bunch up around $20\,\mathrm{ms}$, well inside a $30\,\mathrm{ms}$ deadline. One sits out at $200\,\mathrm{ms}$. The average looks wonderful. But the vehicle flies every cycle, including that one. Worst-case execution time (WCET) is the time of the slowest case you can ever meet, and it is the only number the deadline cares about.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="130" x2="340" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <g fill="#1d6fd1">
    <rect x="50.4" y="110" width="2.7" height="20"/>
    <rect x="53.1" y="70" width="2.7" height="60"/>
    <rect x="55.9" y="30" width="2.7" height="100"/>
    <rect x="58.6" y="75" width="2.7" height="55"/>
    <rect x="61.3" y="115" width="2.7" height="15"/>
  </g>
  <rect x="301.3" y="126" width="2.7" height="4" fill="#b4232c"/>
  <line x1="70.9" y1="20" x2="70.9" y2="130" stroke="#b4232c" stroke-width="2" stroke-dasharray="5,3"/>
  <text x="76" y="30" font-size="12" fill="#b4232c">deadline 30 ms</text>
  <text x="302.7" y="116" font-size="11" text-anchor="middle" fill="#b4232c">1 in 1000</text>
  <text x="30" y="148" font-size="11" text-anchor="middle" fill="#1f2a44">0</text>
  <text x="166.4" y="148" font-size="11" text-anchor="middle" fill="#1f2a44">100</text>
  <text x="302.7" y="148" font-size="11" text-anchor="middle" fill="#1f2a44">200</text>
  <text x="185" y="164" font-size="12" text-anchor="middle" fill="#1f2a44">solve time, ms</text>
  <line x1="166.4" y1="127" x2="166.4" y2="133" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="302.7" y1="127" x2="302.7" y2="133" stroke="#1f2a44" stroke-width="1.5"/>
</svg>
```
:::

::: context heap-word Asking for memory on the fly
In C, a program can ask for a fresh block of memory while it runs, with a call named `malloc`; the pool it draws from is called the heap. Picture a parking lot where cars of different sizes come and go all day. After a while there may be plenty of free space in total, but no single gap big enough for a bus. That is fragmentation. On a desktop, a failed request means an error message. On a landing vehicle there is nobody to read it — so flight code reserves all its memory at startup and never asks again.
:::

::: context quasi-definite-why Why no pivot can be zero
Factorizing a symmetric matrix in order divides by each diagonal "pivot" in turn. Take $\begin{bmatrix} 0 & 1 \\ 1 & 0 \end{bmatrix}$: the very first pivot is $0$, and the factorization fails. Regularize it to $\begin{bmatrix} \delta & 1 \\ 1 & -\delta \end{bmatrix}$. Now the first pivot is $\delta > 0$, and the second is $-\delta - 1/\delta$, which is negative and can never be zero.

That is the general pattern. Pivots from the positive definite block come out positive; pivots from the negative definite block come out negative; none is ever zero, whatever the order. Robert Vanderbei proved in 1995 that this holds for every symmetric reordering of a quasi-definite matrix.
:::

::: context float-order Why the order of adding matters
A computer stores numbers with about sixteen significant digits, so every addition rounds. Rounding makes the order matter. In double precision, $(10^{16} + 1) - 10^{16}$ gives $0$, because the $1$ is lost when it is rounded into $10^{16}$. But $(10^{16} - 10^{16}) + 1$ gives $1$. A compiler's "fast-math" option is allowed to reorder sums like these for speed. Then the rig and the flight computer can disagree in the last digits, and after a few thousand operations those differences can grow. Fixing the order makes every run give the identical bits.
:::

::: context contraction-picture Watching the gap shrink
On a logarithmic scale, where each step down is ten times smaller, a gap that shrinks by a constant factor falls along a straight line. Starting at $10^3$, a factor of $0.3$ per iteration reaches $10^{-6}$ after $17.2$ iterations; a factor of $0.5$ needs $29.9$. The slower the shrink, the flatter the line and the bigger the cap.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="12" x2="40" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="155" x2="340" y2="155" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4,3"/>
  <line x1="40" y1="20" x2="202" y2="161.2" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="40" y1="20" x2="319" y2="160" stroke="#b4232c" stroke-width="2.5"/>
  <circle cx="194.8" cy="155" r="3.5" fill="#1d6fd1"/>
  <circle cx="309.1" cy="155" r="3.5" fill="#b4232c"/>
  <text x="34" y="24" font-size="11" text-anchor="end" fill="#1f2a44">10³</text>
  <text x="34" y="69" font-size="11" text-anchor="end" fill="#1f2a44">1</text>
  <text x="34" y="114" font-size="11" text-anchor="end" fill="#1f2a44">10⁻³</text>
  <text x="34" y="159" font-size="11" text-anchor="end" fill="#1f2a44">10⁻⁶</text>
  <text x="40" y="186" font-size="11" text-anchor="middle" fill="#1f2a44">0</text>
  <text x="130" y="186" font-size="11" text-anchor="middle" fill="#1f2a44">10</text>
  <text x="220" y="186" font-size="11" text-anchor="middle" fill="#1f2a44">20</text>
  <text x="310" y="186" font-size="11" text-anchor="middle" fill="#1f2a44">30</text>
  <text x="340" y="198" font-size="11" text-anchor="end" fill="#1f2a44">iteration</text>
  <text x="120" y="112" font-size="12" fill="#1d6fd1">× 0.3 each</text>
  <text x="200" y="88" font-size="12" fill="#b4232c">× 0.5 each</text>
  <text x="194.8" y="148" font-size="11" text-anchor="middle" fill="#1d6fd1">17.2</text>
  <text x="309.1" y="148" font-size="11" text-anchor="middle" fill="#b4232c">29.9</text>
</svg>
```
:::

::: context monte-carlo-word Testing by rolling dice
A Monte Carlo campaign runs the same program thousands of times, each with inputs drawn at random from the ranges the vehicle might really meet — like rolling dice to pick each starting condition. The name comes from the famous casino in Monaco. Scientists at Los Alamos, among them Stanislaw Ulam, John von Neumann and Nicholas Metropolis, used the method and the name in the late 1940s. Aerospace teams run such campaigns for nearly every guidance, navigation and control design, often on thousands of computers at once.
:::

::: context golden-section-picture Shrinking the bracket
Golden-section search hunts for the lowest point of a one-hump curve inside a bracket. It compares two test points and throws away the part that cannot hold the minimum. The test points are placed so that one of them can be reused next time, which means each new solve shrinks the bracket to $0.618$ of its length. Here the best final time is $11\,\mathrm{s}$ inside a $25\,\mathrm{s}$ bracket.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="141" y1="14" x2="141" y2="170" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4,3"/>
  <g stroke="#1d6fd1" stroke-width="6" stroke-linecap="butt">
    <line x1="20" y1="30" x2="295" y2="30"/>
    <line x1="20" y1="55" x2="189.9" y2="55"/>
    <line x1="84.9" y1="80" x2="189.9" y2="80"/>
    <line x1="125.1" y1="105" x2="189.9" y2="105"/>
    <line x1="125.1" y1="130" x2="165.2" y2="130"/>
    <line x1="125.1" y1="155" x2="149.8" y2="155"/>
  </g>
  <g font-size="11" fill="#1f2a44">
    <text x="301" y="34">25 s</text>
    <text x="196" y="59">15.5 s</text>
    <text x="196" y="84">9.5 s</text>
    <text x="196" y="109">5.9 s</text>
    <text x="171" y="134">3.6 s</text>
    <text x="156" y="159">2.3 s</text>
  </g>
  <text x="141" y="184" font-size="11" text-anchor="middle" fill="#b4232c">best final time 11 s</text>
  <text x="20" y="20" font-size="11" fill="#1f2a44">0 s</text>
</svg>
```
:::

::: context gfold-history Where the landing method came from
Behçet Açıkmeşe and Scott Ploen published lossless convexification of the minimum-throttle constraint in the *Journal of Guidance, Control, and Dynamics* in 2007, for Mars powered descent. It was developed further with Lars Blackmore, Daniel Scharf and others at NASA's Jet Propulsion Laboratory. The resulting algorithm, G-FOLD (Guidance for Fuel-Optimal Large Divert), flew in 2012 and 2013 aboard Masten Space Systems' Xombie, a small vertical-takeoff, vertical-landing test rocket, computing divert trajectories in flight — the first demonstration that this kind of problem could be solved onboard in real time. Blackmore's 2016 article "Autonomous Precision Landing of Space Rockets", in the National Academy of Engineering's *The Bridge*, describes the convex-optimization approach to rocket landing, and people who developed the method went on to work on landing rockets.
:::
