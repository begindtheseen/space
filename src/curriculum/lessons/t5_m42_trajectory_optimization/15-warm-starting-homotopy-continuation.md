---
id: l15-warm-starting-homotopy-continuation
title: Warm starting, homotopy and continuation
minutes: 18
covers:
  - "Warm starting, homotopy and continuation from an easy problem to the real one"
---

Scaling, the previous lesson showed, removes an artificial source of conditioning trouble. It does not make every problem easy — a strongly nonlinear trajectory, correctly scaled and correctly transcribed, can still refuse to converge from a cold, if reasonable, guess. The techniques this lesson covers do not change the problem at all; they change where the solver starts, by walking toward the real problem through a sequence of easier ones instead of attempting it in one jump.

## Two names for the same idea

**Warm starting** means initialising a solve from a solution that is already known to be close — the previous cycle's answer in a receding-horizon controller, or a nearby point on a family of related problems. **Continuation** (also called **homotopy**) is warm starting turned into a strategy: define a family of problems indexed by a parameter, solve the easiest member of the family from a cold, generic guess, then step the parameter toward the real problem, re-solving at each step from the *previous* step's converged solution. The parameter can be almost anything that interpolates between "easy" and "the mission you actually need": a thrust level, a path-constraint bound relaxed and then tightened, an artificial regularisation weight taken to zero, or a literal blend $J_\alpha = (1-\alpha)J_{\text{easy}} + \alpha J_{\text{real}}$ swept from $\alpha=0$ to $\alpha=1$.

::: key Why this helps, mechanically
A Newton-type solver converges reliably once the current iterate is inside the basin of attraction of the true solution, and unreliably or not at all outside it. Continuation never asks the solver to find that basin from far away — each step's starting point is the *previous* problem's converged solution, which for a small enough parameter change is already inside, or very near, the next problem's basin, so the hard part (finding the basin at all) is done once, at the easy end, and never repeated.
:::

## Pushing the same transfer toward a realistic thrust level

Every orbit transfer in this module used $T_{\max}=100\,\mathrm{N}$ — strong enough for the transfer to finish in about two orbits, chosen for tractability rather than realism. Genuine electric propulsion runs at a few newtons or less. Lower thrust means a longer transfer, more orbits, and a more strongly nonlinear boundary value problem — worth checking directly rather than assuming continuation is needed before it has been shown to be.

::: example Cold starts hold up remarkably well, until they don't
Solving the identical transfer (same $r_0,r_1,m_0,c$, nondimensionalised as in every earlier lesson) by Hermite-Simpson collocation from the same naive guess — straight-line $r,v_t$, zero steering, flight time scaled proportionally to the thrust reduction — at successively lower thrust:

| $T_{\max}$ | Converged? | Orbits | Solve time |
| --- | --- | --- | --- |
| $20\,\mathrm{N}$ | Yes | $9.0$ | $2.0\,\mathrm{s}$ |
| $8\,\mathrm{N}$ | Yes | $23.4$ | $3.0\,\mathrm{s}$ |
| $5\,\mathrm{N}$ | Yes | $36.7$ | $22.7\,\mathrm{s}$ |
| $3\,\mathrm{N}$ | **No** | ($81.1$, unconverged) | $18.5\,\mathrm{s}$, constraint violation $5.1\times10^{-6}$ |

A correctly nondimensionalised direct transcription with a naive guess is far more robust than the indirect shooting of an earlier lesson ever was — it cold-starts successfully across a $6.7\times$ thrust reduction and a mesh representing nearly $37$ orbits, a regime where indirect shooting's random-guess success rate would be close to zero. But it is not unconditionally robust: at $3\,\mathrm{N}$, $81$ orbits, the same naive guess is finally too far from the true solution — the straight-line interpolant's shape has less and less to do with what an $81$-orbit spiral actually looks like — and the solver runs out of iterations still $5\times10^{-6}$ from feasible.
:::

::: example Continuation closes exactly the gap the cold start left open
Re-solving the $3\,\mathrm{N}$ problem from the *converged* $5\,\mathrm{N}$ solution, instead of the generic straight line, converges cleanly: constraint violation $2.8\times10^{-12}$, flight time $380\,332\,\mathrm{s}$ ($65.3$ orbits), in $11.9\,\mathrm{s}$. Nothing about the problem changed between the failed cold start and the successful warm start — only the starting point, walked to $3\,\mathrm{N}$ through the $5\,\mathrm{N}$ solution rather than reached directly.

That the fix is *specifically* the nearby solution, not merely "any better guess," is worth being precise about: the $5\,\mathrm{N}$ solution is itself a $36.7$-orbit spiral, geometrically close in shape to the $65.3$-orbit spiral the $3\,\mathrm{N}$ problem needs, sharing the same qualitative steering pattern repeated a similar number of times per orbit. A straight line shares none of that structure at any thrust level; the reason continuation succeeds where a smarter-looking cold guess might still fail is that it supplies not just a numerically closer starting point but a *structurally correct* one — the right shape, needing only quantitative correction rather than a qualitative rediscovery of what an efficient many-orbit spiral even looks like.
:::

## Where the parameter comes from

The thrust level above is a physically meaningful continuation parameter because the underlying problem family varies smoothly with it — a $1\,\%$ change in $T_{\max}$ produces roughly a $1\,\%$-scale change in the optimal trajectory, not a qualitative jump, which is exactly the property continuation needs (a *smooth path* through solution space to walk along). Other common choices work the same way: relaxing a tight terminal constraint into a soft penalty at first, then hardening it in stages, so the very first solve is unconstrained-adjacent and each subsequent one only has to correct for a slightly stiffer penalty; or starting a Goddard-type singular-arc problem with an artificially high thrust bound, where the optimal solution is close to bang-bang with almost no singular arc, and sweeping the bound down toward its true value while the singular arc's extent grows in from nothing rather than needing to be found whole.

::: warning Continuation can fail too, and the failure mode is different from a cold start's
A continuation sweep breaks when a step is too large for the previous solution to be inside the next problem's basin — the fix, mechanically simple, is a smaller step (more intermediate parameter values), at the cost of more solves. It can also break for a structural reason no step size fixes: if the solution family has a **bifurcation** — a point where the qualitative character of the optimal trajectory changes discontinuously, such as a switch in which of two local minima is globally optimal — no amount of step refinement walks smoothly across that point, because there is no smooth path there to follow. Distinguishing "my steps are too coarse" from "there is a genuine bifurcation in this problem family" is a real diagnostic question, usually answered by checking whether shrinking the step size continues to help (consistent with the first) or the solve keeps failing at the same parameter value regardless of how finely it is approached (consistent with the second).
:::

## Check yourself

::: check
Why does a $1\,\%$ change in a continuation parameter typically require far fewer solver iterations than the original cold start needed, even though both are, technically, "solving an NLP from an initial guess"?
:::

::: answer
A cold start's initial guess is unrelated to the true solution except through generic modelling intuition (a straight line, a plausible-looking constant control), so the solver has to travel an essentially unknown distance through the space of trajectories before entering the basin where Newton-type convergence is fast and reliable. A $1\,\%$ parameter step's initial guess is the previous, converged solution to a problem $1\,\%$ different — for a smoothly varying problem family, that guess is already extremely close to the new true solution, so the solver is doing local refinement (a few Newton-like corrections) rather than global search, which is a categorically easier task and correspondingly much faster.
:::

::: check
The cold-start table showed $T_{\max}=5\,\mathrm{N}$ converging in $22.7\,\mathrm{s}$ — slower than several of the *easier* thrust levels above it, but still successful. What does that trend across the table suggest about how close the naive guess was getting to failing, even before it actually did at $3\,\mathrm{N}$?
:::

::: answer
Solve time and the difficulty of finding the correct basin are related but not identical — a longer solve time at $5\,\mathrm{N}$ suggests the naive guess was already meaningfully farther from the true $36.7$-orbit solution than it was from the $9$-orbit one, needing more Newton-type corrections to close the gap even though it ultimately succeeded. That degradation trend (rising solve time as the parameter moves away from where the guess is natively accurate) is itself a warning sign worth watching for in practice — a continuation or cold-start sweep whose solve times are climbing steeply, even while still technically converging, is approaching the point where the next step is likely to fail outright, exactly as the $3\,\mathrm{N}$ case did.
:::

::: check
A colleague proposes skipping intermediate thrust levels entirely and jumping straight from $T_{\max}=100\,\mathrm{N}$ to $T_{\max}=3\,\mathrm{N}$, warm-started from the $100\,\mathrm{N}$ solution. Why would this likely fail even though warm-starting from $5\,\mathrm{N}$ to $3\,\mathrm{N}$ succeeded?
:::

::: answer
The $100\,\mathrm{N}$ solution is a roughly two-orbit trajectory; the $3\,\mathrm{N}$ solution needs about $65$ orbits — not merely a longer flight time but a qualitatively different-shaped trajectory (many more spiral turns, a control history with far more oscillation in the steering angle as it re-aligns each revolution), so the $100\,\mathrm{N}$ solution is nowhere near the $3\,\mathrm{N}$ problem's basin of attraction despite both belonging to the same problem family. The $5\,\mathrm{N}\to3\,\mathrm{N}$ step worked precisely because it was a small step in a smoothly varying family; skipping straight from one end to the other is not continuation at all, it is a single large, ungraded step with no more structural advantage than the original cold start had — the entire benefit of the technique comes from taking the parameter change in pieces small enough that each one stays local.
:::

::: check
Why is checking whether a smaller step size fixes a failed continuation step a genuine diagnostic, rather than merely one more thing to try?
:::

::: answer
It distinguishes two structurally different failure causes that would otherwise look identical (a non-converged solve at some parameter value). If the previous solution was merely too far from the next problem's basin — an ordinary step-size issue — inserting an intermediate parameter value and re-solving in two smaller steps should succeed, because each smaller step stays inside the local-convergence regime the larger one overshot. If the failure is instead caused by a bifurcation — the optimal trajectory's qualitative structure genuinely changing at that point in the parameter family — no amount of step refinement helps, because there is no continuous path connecting the two sides for a smaller step to trace; the solve keeps failing (or converges to a solution that is discontinuously different in character) no matter how finely the approach is subdivided, and that persistence under refinement is the signature that distinguishes a real structural break from an ordinary too-large step.
:::

## Summary

| Object | Statement |
| --- | --- |
| Warm start | Initialise from an already-known nearby solution instead of a generic guess |
| Continuation / homotopy | A parametrised family of problems, swept from easy to real, each step warm-started from the last |
| Why it works | Each step's starting point is already inside, or very near, the next problem's convergence basin |
| Cold-start robustness, measured | A scaled, naive-guess collocation cold start succeeds through $36.7$ orbits ($T_{\max}=5\,\mathrm{N}$), fails at $81.1$ orbits ($T_{\max}=3\,\mathrm{N}$) |
| Continuation fix | Warm-started from the $5\,\mathrm{N}$ solution, the $3\,\mathrm{N}$ case converges to constraint violation $2.8\times10^{-12}$ |
| Common parameters | Physical (thrust, mass), constraint tightness (soft $\to$ hard), a cost blend $(1-\alpha)J_{\text{easy}}+\alpha J_{\text{real}}$ |
| Step-size failure | Fixed by inserting intermediate parameter values |
| Bifurcation failure | Not fixed by smaller steps; the solution family itself has no smooth path there |

The next lesson turns from technique to tooling — the software this module's algorithms are usually run through, and what each one actually automates for you.
