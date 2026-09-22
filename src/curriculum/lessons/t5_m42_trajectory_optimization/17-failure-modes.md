---
id: l17-failure-modes
title: "Failure modes: infeasibility, multipliers, ringing and bad constraints"
minutes: 20
covers:
  - "Failure modes: infeasible restoration, unbounded multipliers, mesh-induced control ringing, badly posed terminal constraints"
---

Every earlier lesson in this module built a diagnostic — a shadow price to check a costate against, a covector mapping to verify a direct solution against the minimum principle, an interpolated-defect estimate to catch a mesh that is lying, a condition number to explain why a solve crawled. This lesson is the catalogue those diagnostics exist for: four specific, named ways a trajectory optimisation goes wrong, one of which will not even announce itself as a failure unless you go looking.

## A local minimum that looks completely fine

The most dangerous failure in this list produces no error message at all — cost decreases monotonically, the iteration terminates, the terminal state lands in a physically plausible place. Nothing about the log distinguishes it from a correct answer.

::: example Two convergent ascents, one thirty-three times worse than the other
The ascent problem from the iLQR lesson — minimum-effort steering to a burnout state near $h=7000\,\mathrm{m}$, $v_x=400\,\mathrm{m/s}$, $v_h=120\,\mathrm{m/s}$ — converged earlier from a $30^\circ$ constant-pitch guess to cost $290.58$, terminal state $(h,v_x,v_h)=(6973.5,\ 362.5,\ 151.8)$. Solving the identical problem from a different, still not unreasonable, starting guess — constant $85^\circ$ pitch, nearly horizontal from the first instant — the iteration behaves impeccably: cost falls from $7\,675\,100$ to $305\,072$ after the first accepted step, to $53\,251$ by iteration $20$, and settles at $9585.65$ by iteration $119$, terminal state $(6971.0,\ 356.1,\ 148.7)$ — a terminal state within a few percent of the other run's, on every one of the three components being targeted.

Read in isolation, this second run looks entirely trustworthy: smooth monotonic convergence, a plausible landing near the target, no numerical warnings. Its cost, $9585.65$, is **more than thirty-three times** the true local optimum the first guess found. Nothing internal to this one run reveals that a better answer exists a $55^\circ$ pitch change away in initial-guess space; the only way to find that out is to have already run the comparison.
:::

::: warning A converged log is evidence of a stationary point, not evidence of the best one
Every method in this module — direct or indirect, shooting or collocation, iLQR or a general NLP solver — is a local method on a problem this module has never claimed was convex. A clean convergence log certifies that the necessary conditions are satisfied near the returned answer; it certifies nothing about whether a qualitatively different trajectory, reachable only from a different starting guess, does better. The only defence practiced anywhere in this field is redundancy: solve from more than one physically distinct starting guess (a different initial pitch, a different coast-versus-burn split, a homotopy path arriving from a different direction) and compare costs, exactly the comparison that exposed the $33\times$ gap above. A single converged solve, however clean its log, is not evidence of global optimality — it is evidence of local optimality and nothing more.
:::

## Badly posed terminal constraints, and the multipliers that expose them

A terminal condition can be mathematically **redundant** — two constraints that are algebraically equivalent, written as if they were independent — without being obviously wrong to read. A circular-orbit arrival condition, for instance, can be written as "radial velocity zero" or as "flight path angle zero," and at a nonzero radius these say exactly the same thing; writing both, believing they pin down two different aspects of the arrival, silently hands the solver a **linearly dependent** pair of constraint gradients.

::: example Why the multipliers on a redundant pair are not unique
Minimise $(x-1)^2$ subject to $g_1: x-1=0$ and the redundant $g_2: 2x-2=0$ (identically twice $g_1$). The unique minimiser is $x^\star=1$, exactly as if only one constraint had been written — but the KKT stationarity condition, $2(x^\star-1)+\mu_1(1)+\mu_2(2)=0$, reduces at $x^\star=1$ to $\mu_1+2\mu_2=0$: **one equation in two unknowns**. Every point on that line is a valid multiplier pair — $(\mu_1,\mu_2)=(0,0)$, $(-2,1)$, $(-10,5)$, $(2\times10^6,-10^6)$, all satisfy stationarity equally well. A solver's reported multiplier for $g_1$ or $g_2$ individually is therefore an artefact of that solver's specific internal path (which point on the line its numerical method happens to land near), not a meaningful number — and the tiniest numerical perturbation of the redundancy (making $g_2$ almost, but not exactly, twice $g_1$) does not fix this: it merely trades an exactly-indeterminate line of solutions for a nearly-singular system whose minimum-norm solution stays small while the *unconstrained* direction along the near-null-space can still be driven to an arbitrarily large multiplier pair by an arbitrarily small perturbation elsewhere in the problem.

Vehicle problems reproduce this exactly when a terminal condition is over-specified: a rendezvous written with both a Cartesian velocity-matching condition and a redundant orbital-element condition implying the same three numbers, or a landing condition duplicating "vertical velocity zero" and "flight path angle $-90^\circ$" at touchdown. The primal answer — where the vehicle actually ends up — is unaffected, exactly as $x^\star=1$ was unaffected above. The costate or multiplier reconstruction this module has relied on since the covector mapping lesson, however, becomes meaningless for the redundant pair specifically, because there is no longer a unique costate history to reconstruct.
:::

**Unbounded multipliers**, as a reported symptom, are very often exactly this mechanism seen from the solver's side: a multiplier that grows without settling as iterations proceed, or that differs wildly between two runs that converge to the identical primal solution, is close to diagnostic of a linear dependence in the active constraint gradients — check the constraint set for a redundant or near-redundant pair before suspecting the solver's numerics.

## Infeasible restoration

When no feasible point exists near the current iterate — the mission asks for something the vehicle's own dynamics cannot deliver — a well-built interior-point solver such as IPOPT switches into a **restoration phase**: temporarily abandoning the true objective and instead minimising constraint violation directly, trying to find *any* nearby feasible point to resume from. When even that fails — the infeasibility is not local to a bad iterate but structural, built into the problem as posed — the solver reports exactly that: restoration failed, a clean, honest signal that the problem itself, not the search, is the issue.

::: example An unreachable target, honestly refused
Fixing the minimum-time orbit transfer's flight time at $t_f=2$ nondimensional time units — a small fraction of the true minimum of $12.37$ — poses a transfer the vehicle's $100\,\mathrm{N}$ of thrust genuinely cannot complete that fast, no matter how it steers. Solving anyway (minimising a proxy control-effort cost, with the impossible time fixed as a hard equality) never converges: after the iteration budget is exhausted, the reported status is failure, not success, with the maximum constraint violation still at $0.045$ nondimensional units — physically enormous, a boundary condition on the radius missed by hundreds of thousands of kilometres — and the steering-effort proxy objective driven to an equally telling $138\,911$, orders of magnitude beyond what any of this module's feasible transfers ever needed. The solver did the right thing: it refused to manufacture an answer to a question that has none, and said so plainly in its return status rather than reporting a number that only looked like a solution.
:::

::: key Reading a restoration failure correctly
Restoration failure means "no feasible point was found nearby," which is compatible with two very different diagnoses: the problem is *structurally* infeasible (the mission, as specified, cannot be flown — a target the vehicle lacks the propellant, thrust or time to reach), or the problem is *merely* badly scaled or badly initialised, making a genuinely feasible region hard to locate numerically. The scaling lesson's checklist — non-dimensionalise, verify the initial guess is dynamically plausible, relax the tightest constraint and confirm *something* feasible exists before reintroducing it — is exactly the procedure for telling these two apart, and it belongs before concluding the mission itself is impossible.
:::

## Mesh-induced control ringing

This module has already demonstrated this failure mode twice, in enough numerical detail that it does not need a third repetition — only the synthesis. The mesh-refinement lesson showed a ten-segment mesh smear a $1.85\,\mathrm{s}$ coast-to-burn switch into a ramp spanning an entire $3.38\,\mathrm{s}$ segment, with the interpolated-defect estimate flagging that exact segment at $828\times$ the error of any other. The bang-bang and singular-arc lesson showed the complementary symptom directly: a control rapidly alternating between its bounds over an extended stretch is very often a *singular arc* the mesh has no way to represent as the sustained interior value it actually is, mistaking an unresolved balance point for noise to chase.

Both are the same underlying fact wearing different clothes: a mesh coarser than the shortest genuine feature of the true optimal control — a switch, a singular arc's onset, a constraint activation — cannot represent that feature, and the solver's best fit to the defect equations, forced to spend its limited polynomial degrees of freedom on a segment it cannot resolve, produces either a smoothed-out ramp (collocation, this module's worked examples) or literal high-frequency chatter (more commonly reported with methods enforcing looser local structure). The fix, established in the mesh-refinement lesson and not repeated here, is the same either way: locate the segment the interpolated-defect estimate flags, subdivide it, and re-solve — never add nodes uniformly and hope, and never mistake the ramp or the chatter for a legitimate feature of the true optimal control without checking.

## Check yourself

::: check
The two ascent runs in the local-minimum example both showed smoothly decreasing cost and both landed within a few percent of the same target state. Given only those two facts and no access to the actual cost numbers, could you have told which one was the better answer?
:::

::: answer
No — smooth convergence and a plausible-looking terminal state are properties of *having found a local optimum*, not of having found a *good* one, and both runs satisfy the first without the visible log distinguishing which local optimum each landed on. The only way to tell them apart is the one piece of information neither log exposes on its own: the actual converged cost, compared against a second, independently-converged run from a different starting guess — exactly the comparison the worked example had to make explicitly rather than infer from either log in isolation.
:::

::: check
Why does perturbing a redundant constraint pair slightly — making $g_2$ almost, but not exactly, a multiple of $g_1$ — fail to fix the unbounded-multiplier problem, even though the constraint Jacobian is technically full rank again?
:::

::: answer
Technical full rank guarantees a *unique* least-squares multiplier solution exists, but says nothing about how *well-conditioned* finding it is — a near-redundant pair has a constraint Jacobian close to singular, so the linear system determining the multipliers has a large condition number, and a small change elsewhere in the problem (a slightly different point along the solve, ordinary floating-point noise) can swing the reported multiplier by an arbitrarily large amount along the nearly-null direction. The toy example's minimum-norm solution stayed near $-0.02$ regardless of the perturbation size specifically *because* it was chosen to be minimum-norm; a general-purpose solver has no obligation to report that particular point on the near-line of near-solutions, and typically does not.
:::

::: check
A restoration failure and a "converges to a local minimum that looks fine" failure are, in one sense, opposite problems. State what makes them opposite, and why a single diagnostic checklist could not catch both with the same test.
:::

::: answer
Restoration failure is a *loud* failure — the solver could not find any feasible point and says so — while a bad local minimum is a *silent* one: every optimality and feasibility test the solver runs is satisfied, and the log reports success. A checklist built to catch loud failures (check the reported status, check the constraint violation) does nothing for a silent one, because a silent failure passes every such check by construction; catching it requires a fundamentally different kind of test — comparing against an independently-obtained second answer — rather than a stricter version of the same feasibility check. This is exactly why this module treats them as two separate items on the catalogue rather than variations on one theme.
:::

::: check
Why is "restoration failed" described in this lesson as an honest signal, when it is the least immediately useful message a solver can return?
:::

::: answer
It is honest in the specific sense that mattered throughout this module: the solver is reporting exactly what it found — no feasible point nearby — rather than silently returning an infeasible or barely-converged answer dressed up as a success, which is the far more dangerous failure this same lesson opened with. "Restoration failed" is not immediately actionable on its own, but it correctly routes the next step to the scaling and feasibility checklist rather than to a false sense that the mission was flown; the alternative, a solver that quietly reports success on an infeasible problem, would be strictly worse precisely because it removes the cue to go check anything at all.
:::

## Summary

| Failure mode | Symptom | Diagnostic |
| --- | --- | --- |
| Local minimum that looks fine | Clean convergence, plausible terminal state, no errors | Solve from multiple distinct guesses; compare cost, not just convergence |
| Badly posed terminal constraints | Redundant or near-redundant constraint gradients | Check constraint Jacobian rank; look for two conditions saying the same thing |
| Unbounded multipliers | Multiplier grows or is inconsistent across runs with the same primal answer | Usually a symptom of the redundancy above, not solver numerics |
| Infeasible restoration | Solver cannot find any nearby feasible point; reports failure honestly | Distinguish structural infeasibility from scaling/initialisation via the earlier checklist |
| Mesh-induced control ringing | A smeared ramp (collocation) or bound-to-bound chatter, over an extended stretch | Interpolated-defect estimate flags the segment; check for an unresolved switch or singular arc |
| Worked local-minimum gap | Cost $290.58$ vs. $9585.65$, both runs converged | A $33\times$ difference invisible from either log alone |
| Worked restoration example | Impossible $t_f=2$: violation $0.045$, objective $138\,911$ | Reported failure, honestly, rather than a false success |

Every method this module built — the Hamiltonian and costate, the shooting and the collocation, the pseudospectral node and the covector map, the scaling and the continuation — exists to get a real vehicle from where it is to where it needs to be, honestly, with the failure modes visible rather than hidden. That is the whole discipline: not a solver that never fails, but one whose failures tell you the truth.
