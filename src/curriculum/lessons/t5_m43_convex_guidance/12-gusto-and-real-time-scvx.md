---
id: l12-gusto-real-time-scvx
title: GuSTO, and running SCvx in real time
minutes: 22
covers:
  - GuSTO and the broader sequential convex programming convergence theory
  - "Real-time implementation: solver code generation, iteration bounds, warm starting, and fixed-point considerations"
---

Every lesson on successive convexification so far has been honest about a gap: nothing proves the loop converges. The trust region and virtual control make each step well-defined and each subproblem solvable, but "well-defined at every step" is not "guaranteed to reach the answer," and this module has resisted the temptation to paper over that with a theorem it does not have. This lesson closes that gap partway — with a method that *does* carry a convergence proof, under stated conditions — and then turns to the question every other certified piece of this module has already answered for the one-shot convex solve: what does it take to run this loop inside a guidance cycle with a deadline.

## GuSTO: buying a convergence proof back

Vanilla SCvx's trust-region rule is a heuristic assembled from pieces that work well in practice: shrink on a bad ratio, grow on a good one, penalise virtual control heavily. It is not derived from an optimisation problem with a known convergence theory attached. **GuSTO** (Guaranteed Sequential Trajectory Optimization) restructures the same idea — linearise, discretise, solve a convex subproblem, update — around a single **penalised merit function** that combines the true cost with a growing penalty on both the dynamics residual (this module's virtual control, in different notation) and the trust-region violation, and updates a *penalty weight* rather than resizing a hard trust-region radius by a separate rule. That restructuring is what buys the proof: under standard regularity assumptions on the dynamics (Lipschitz continuity of the linearisation error, in essence — the same kind of assumption that bounded the quadratic error growth two lessons ago) the sequence of iterates can be shown to converge to a point satisfying the first-order necessary conditions of the *original*, non-convex problem.

Two things about that guarantee are worth being precise about, because both are easy to overstate. First, "converges" here means the merit function decreases monotonically and the iterates accumulate at a stationary point — a KKT point of the true problem — not that the global optimum is found; a stationary point of a non-convex problem can still be a poor local one, exactly the risk this module's very first lesson used to motivate convexity in the first place. Second, the guarantee is asymptotic: it says the loop does not stall or diverge given enough iterations, not how many iterations "enough" turns out to be for a given problem, which is a separate, empirical question the next section addresses directly. GuSTO strengthens *whether* the loop can be trusted to make sense at all; it does not shorten it.

::: key What GuSTO buys, precisely
A merit-function reformulation of the same linearise-solve-update loop, with a provable guarantee: the iterates converge to a KKT point of the original non-convex problem under stated regularity conditions. It is a guarantee about reaching *a* stationary point, not the global optimum, and it says nothing about how many iterations that takes on a given problem — vanilla SCvx's trust-region heuristic, by contrast, has no such proof attached at all, and is trusted on the strength of extensive testing rather than a theorem.
:::

## Why the certification argument from Act One does not transfer whole

The very first lesson of this module built its entire case for convexity on two guarantees a single SOCP solve provides: a global optimum, and an iteration count bounded before the flight computer sees real data. SCvx — GuSTO included — keeps neither in the strong form Act One established. Each *subproblem* inside the loop still carries the SOCP guarantee, but the *loop itself* does not: nothing bounds, from first principles and before flight, how many outer iterations a given dispersed initial condition will need, and GuSTO's asymptotic convergence proof does not supply that bound either.

The response is the same one this module's prerequisite modules already worked out for exactly this situation, now applied one level up. A fixed cap on SCvx iterations, sized empirically — run the dispersion campaign, record how many outer iterations each case needs to bring virtual control below a threshold, take the maximum, and multiply by a safety factor the way every iteration cap in this curriculum has been sized — and a **certified fallback** for the cases that would exceed it: hold the last *accepted* trajectory (feasible by construction, since acceptance already required a good $\rho$), or fall back further to a simpler guidance law entirely, such as a 3-DoF lossless-convexification solve that ignores attitude, or a fixed attitude-hold controller, whichever the vehicle's mode logic is built to trust when the richer solve does not finish in time. This is the identical shape of argument the real-time-onboard-MPC material used for a re-solved QP that might not converge every cycle, applied here to a re-solved sequence of SOCPs instead of a single one.

## Sizing the real cost

Follow the same flop-counting discipline the optimization module used for the 3-DoF landing SOCP, now on the 6-DoF SCvx subproblem this module just built. With $N$ nodes, a $14$-state, $4$-control subproblem carries $14(N+1)$ state variables, $4N$ controls, and $14N$ each of virtual control and its $\ell_1$ epigraph — $n = 14(N+1) + 32N$ decision variables — against $14N$ dynamics rows, $N+1$ linearised unit-norm rows, and $27$ boundary rows, $m = 14N + N + 28$ equality constraints. A dense KKT solve, exactly what this module's own teaching solver performs every Newton step, costs $\tfrac{2}{3}(n+m)^3$ flops:

| $N$ | $n$ | $m$ | $M=n+m$ | flops per Newton step |
| --- | --- | --- | --- | --- |
| $4$ | $198$ | $88$ | $286$ | $1.56\times10^7$ |
| $6$ | $290$ | $118$ | $408$ | $4.53\times10^7$ |
| $8$ | $382$ | $148$ | $530$ | $9.93\times10^7$ |
| $10$ | $474$ | $178$ | $652$ | $1.85\times10^8$ |
| $15$ | $704$ | $253$ | $957$ | $5.84\times10^8$ |
| $20$ | $934$ | $328$ | $1262$ | $1.34\times10^9$ |

::: example What a dense subproblem costs, multiplied out
Take $N=10$ and a well-scaled interior-point solve converging in $25$ Newton steps — this module's own established planning figure for a single certified SOCP. One subproblem costs $25 \times 1.85\times10^8 = 4.62\times10^9$ flops. An SCvx run needing $10$ outer iterations to bring virtual control to numerical zero costs ten of those: $4.62\times10^{10}$ flops total. At $1\,\mathrm{GFLOP/s}$ — the planning figure the real-time-embedded-solvers material used for a capable flight processor — that is $46.2\,\mathrm{s}$; even at $3\,\mathrm{GFLOP/s}$ it is $15.4\,\mathrm{s}$. Against a guidance cycle measured in tenths of a second, a *dense* implementation of 6-DoF SCvx is nowhere close to real time, at any node count this table shows.
:::

That number is not a verdict on SCvx; it is a verdict on solving it the way a teaching implementation does — a fresh dense factorisation every Newton step, ignorant of the fact that the dynamics equality rows are block-structured (each row only touches one node's neighbours) the same way the 3-DoF landing problem's rows were. A flight implementation exploits exactly that structure, the way the real-time-embedded-solvers material's banded factorisation did for the 3-DoF case: a sparse, banded solve scales close to linearly in $N$ per Newton step rather than cubically in $n+m$, which is the difference between the table above and something a guidance cycle can actually absorb. Every principle that made the 3-DoF SOCP flight-representative — fixed sparsity pattern computed offline, static regularisation in place of runtime pivoting, a statically allocated workspace, code generation rather than a general-purpose solver — applies to *each* SCvx subproblem unchanged, because each subproblem's structure (which variables, which constraint pattern) is identical from one SCvx call to the next; only the Jacobian data and the reference point change, exactly the situation code generation is built for.

::: warning Warm starting means something different two ways here, and only one of them is safe
It is tempting to warm-start the *interior-point solver* for iteration $k{+}1$'s subproblem from iteration $k$'s optimal point, the way the optimization module discussed warm-starting in general. For an interior-point method this is the same bad trade the optimization module already found for a single re-solved SOCP: the previous solution sits on the boundary of its cone, where the barrier is infinite, and nudging it inside typically lands far off the new central path with little saved. What *does* carry real information from one SCvx iteration to the next is using the accepted solution as the **reference trajectory** for linearising the following subproblem — which is not solver warm-starting at all, it is the SCvx algorithm's own definition, and it is exactly why a converged reference needs few outer iterations to refine further while a poor one needs many. Confusing the two — expecting the *solver* to warm-start well because the *algorithm* naturally reuses the previous answer — is a category error worth naming explicitly before it costs someone a debugging session.
:::

Fixed-point arithmetic, where a flight computer's heritage demands it, adds one more consideration specific to SCvx that a single LCvx solve does not face to the same degree: a subproblem now mixes quantities of genuinely different natural scale in one linear system — quaternion components bounded near $[-1,1]$, angular rates of order $10^{-2}\,\mathrm{rad/s}$, positions of order $10^1$ to $10^3\,\mathrm{m}$, and a virtual-control penalty weight deliberately chosen large so that virtual control is expensive relative to everything else. Representing all of these in one fixed-point format either wastes precision on the small quantities or overflows on the large ones; the standard fix is the same non-dimensionalisation the optimization module flagged for any solver — rescale every variable to an order-one range before the problem reaches the solver, and rescale the answer back afterward — but it needs revisiting every time this module's second half adds a new variable type to the state, since each one arrives with its own natural units.

::: example The dynamic range one subproblem actually spans
Take the 6-DoF worked example's own numbers directly: an angular rate of $0.03\,\mathrm{rad/s}$, a position component of $60\,\mathrm{m}$, a thrust acceleration $\sigma$ of $6\,\mathrm{m/s^2}$, a quaternion component of order $1$, and the virtual-control penalty weight used there, $2\times10^4$. The ratio between the largest and smallest of these is $2\times10^4/0.03 = 6.67\times10^5$ — about $19.3$ bits of dynamic range, $\log_2(6.67\times10^5)$, just to represent the *largest-to-smallest* natural scale of the numbers already sitting in one subproblem's data, before any arithmetic is done on them. A $16$-bit fixed-point format has nowhere near that headroom; even a generous $32$-bit format spends most of its range on this spread alone. Non-dimensionalising — dividing positions by a characteristic length, rates by a characteristic rate, and choosing the penalty weight in the *scaled* problem's own units rather than the raw one — is not an optional tidiness step here, it is the difference between a representable problem and one that silently loses the small end of that range to rounding.
:::

## Check yourself

::: check
A flight-software review asks: "Does GuSTO give SCvx the same certification status as the 3-DoF lossless-convexification solve?" What is the accurate answer?
:::

::: answer
No. The 3-DoF solve's certification rests on convexity: any local optimum is global, and the iteration count is bounded by a theorem before the data is seen. GuSTO's guarantee is different in kind — it proves the iterates converge to *a* stationary point of a still non-convex problem, with no bound on how many outer iterations that takes for a given instance and no guarantee that stationary point is globally best. It upgrades SCvx from "an unproven heuristic that works well in practice" to "a proven-to-converge method with an unbounded convergence rate," which is real progress but not the same category of certificate Act One of this module built.
:::

::: check
Why does the sparse, banded factorisation that made the 3-DoF landing SOCP flight-representative apply just as well to each 6-DoF SCvx subproblem, given that the subproblem now includes virtual control and trust-region variables the 3-DoF problem never had?
:::

::: answer
Sparsity comes from which variables appear together in the same row, not from how many variable *types* exist. The dynamics-with-virtual-control row at step $k$ still only involves $\mathbf{x}_k$, $\mathbf{u}_k$, $\mathbf{x}_{k+1}$ and $\boldsymbol{\nu}_k$ — a local coupling exactly as banded as the 3-DoF case's dynamics row, just with a wider band because the state is $14$-dimensional instead of $7$ and virtual control adds its own block. The epigraph and trust-region constraints are even more local, each touching only one node's or one step's variables. More variable types widened the band; they did not turn a block-structured problem into a dense one.
:::

::: check
The dense-cost table showed $N=10$ costing $46.2\,\mathrm{s}$ at $1\,\mathrm{GFLOP/s}$ for a $10$-iteration SCvx run. A colleague proposes hitting a $100\,\mathrm{ms}$ guidance cycle by cutting the SCvx iteration cap to $1$. What is wrong with that specific fix?
:::

::: answer
A single SCvx iteration from an arbitrary reference is exactly the case this module's SCvx lessons warned about — one linearisation, once, with no chance for the trust region to shrink toward a trustworthy step size or for virtual control to reveal whether the linearisation was any good. Capping at one iteration does not produce a fast certified answer; it produces the output of one uncertified linear approximation, indistinguishable in kind from the naive single-shot linearisation this module's SCvx introduction showed failing quadratically with distance from the reference. The honest fixes are the ones this lesson lists — sparse code-generated subproblems, a node count and iteration cap sized from real Monte Carlo data, and a certified fallback for the cases that still do not finish — not skipping the iterations that make the loop meaningful.
:::

::: check
Explain why the virtual-control penalty weight being "deliberately chosen large" makes the fixed-point scaling problem this lesson raises worse, not merely present.
:::

::: answer
A large penalty weight is doing its job precisely by making one term in the objective enormous relative to the fuel-cost term whenever virtual control is nonzero — that size difference is what forces virtual control toward zero rather than letting the optimizer trade it off cheaply against fuel. But the same size difference, carried into a fixed-point representation with one shared scale, means the small term (fuel cost, or a well-converged near-zero virtual control) can lose most of its precision to rounding relative to the large one, or the large one can saturate the representable range relative to the small one — the exact failure mode non-dimensionalisation exists to prevent, made sharper here because the penalty weight's whole purpose is to be large relative to everything else in the same objective.
:::

## Summary

| Object | Statement |
| --- | --- |
| GuSTO | Merit-function reformulation of SCvx; provably converges to a KKT point of the true non-convex problem under regularity assumptions |
| What the proof does not give | A global optimum, or a bound on how many iterations convergence takes for a given problem |
| Why Act One's certificate does not transfer | Each subproblem keeps its SOCP guarantee; the outer loop's iteration count is not bounded by any theorem in hand |
| The response | Fixed iteration cap sized from a dispersion campaign, plus a certified fallback (last accepted trajectory, or a simpler guidance law) |
| Dense subproblem cost, $N=10$ | $4.62\times10^{10}$ flops for a $10$-iteration run; $46.2\,\mathrm{s}$ at $1\,\mathrm{GFLOP/s}$ — not real time |
| The fix | Sparse, banded, code-generated subproblems — the same principles as the 3-DoF flight solver, applied per SCvx iteration |
| Warm starting, two meanings | Solver warm start (bad, same boundary-point problem as any interior-point re-solve) vs. reference reuse (the algorithm itself, and the reason a good reference needs few iterations) |
| Fixed-point scaling | Quaternions, rates, positions and a deliberately large penalty weight share one linear system; non-dimensionalise every variable, and revisit it whenever a new state type is added |

The last lesson steps back from the mechanics entirely and asks where all of this actually flies — mapping every technique this module built onto the phases of a real booster's return and onto what is and is not known about the vehicles that fly it today.
