---
id: l11-mesh-refinement
title: Mesh refinement from an interpolated-defect error estimate
minutes: 16
covers:
  - Mesh refinement driven by an interpolated-defect error estimate
---

A converged NLP, an earlier lesson warned, satisfies the discretised problem, not necessarily the continuous one. That warning needs a way to act on it: given one converged solution, decide whether the mesh that produced it was adequate, and if not, exactly where to add resolution. Guessing $N$ and re-solving from scratch at $2N$ works, eventually, but it spends effort everywhere, including on the long stretches of a real trajectory that were already perfectly represented by a handful of nodes. This lesson builds the diagnostic that targets the effort instead: check the defect not only where it is enforced, but at points in between, where a coarse mesh has nothing stopping it from being wrong.

## Why the enforced points cannot tell you anything

Every defect constraint in this module's collocation schemes is satisfied, by the solver's design, at the mesh points and — for Hermite-Simpson — at the one midpoint it explicitly uses. That is exactly why checking the defect *there* is useless as a diagnostic: it is small by construction, at every node, on every mesh, converged or not. The information about whether the mesh was fine enough has to come from somewhere the optimiser was never required to get right — a point strictly inside a segment, away from the mesh point and the midpoint both.

Take the state and control the segment's own interpolant defines at some fraction $\tau\in(0,1)$ through it — the cubic Hermite interpolant of the previous lesson for $\mathbf{x}$, linear interpolation for $\mathbf{u}$ — and compute the raw ODE residual there directly: differentiate the interpolant to get $\dot{\mathbf{x}}_{\text{interp}}(\tau)$, evaluate $\mathbf{f}$ at the interpolated state and control, and compare:

$$
\mathbf{e}_k(\tau) = \dot{\mathbf{x}}_{\text{interp}}(\tau) - \mathbf{f}\big(\mathbf{x}_{\text{interp}}(\tau),\mathbf{u}_{\text{interp}}(\tau),t_k+\tau h\big).
$$

This is the **interpolated-defect error estimate**: the same idea as the defect itself, evaluated at a point the scheme had no obligation to get right, so a large $\mathbf{e}_k$ genuinely means the segment's assumed polynomial shape does not track the true dynamics there — not a construction artefact.

::: key The diagnostic, in one line
A defect is zero at the nodes by construction; sampling the same residual strictly between nodes measures whether the mesh, not just the solver, did its job — and comparing that residual's peak across every segment ranks them by how urgently each one needs subdividing.
:::

::: example A ten-segment mesh missing a switch it never sees
The Mars powered-descent problem — coast for $1.8546\,\mathrm{s}$, then burn at full thrust for the remaining $31.91\,\mathrm{s}$, established by indirect shooting two lessons ago — transcribed with Hermite-Simpson on a **uniform** $10$-segment mesh ($h\approx3.38\,\mathrm{s}$ per segment, longer than the entire coast phase) converges cleanly: constraint violation below $10^{-11}$, reported propellant $86.8399\,\mathrm{kg}$ against the true $86.7579\,\mathrm{kg}$ — within $0.1\,\%$, an answer that looks entirely trustworthy from the summary numbers alone. The thrust history tells a different story: $T=0$ at the first node, but already $T=5668\,\mathrm{N}$ ($94.5\,\%$ of $T_{\max}$) at the *second* node, $3.38\,\mathrm{s}$ in — the true instantaneous switch at $1.85\,\mathrm{s}$ has been replaced by a smooth ramp spanning the entire first segment, because a single Hermite-Simpson segment has no way to represent a jump strictly inside it.

Evaluating the interpolated-defect residual (normalised by characteristic scales of $1500\,\mathrm{m}$, $75\,\mathrm{m/s}$, $1000\,\mathrm{kg}$) at $19$ interior points of every one of the $10$ segments and taking each segment's worst value:

| Segment | Time span (s) | Peak normalised residual |
| --- | --- | --- |
| $0$ | $[0.00, 3.38]$ | $1.60\times10^{-5}$ |
| $1$ | $[3.38, 6.76]$ | $1.81\times10^{-7}$ |
| $2$–$9$ | $[6.76, 33.81]$ | $1.9\times10^{-8}$ to $2.4\times10^{-8}$ |

Segment $0$'s peak residual is $828$ times larger than the best-behaved segment, and nearly $100$ times larger than segment $1$ right next to it — a ranking that, without ever being told where a switch might be, points straight at the one segment containing it. Segments $2$ through $9$, sitting entirely inside the smooth constant-thrust burn, sit within a factor of about $2$ of each other: no refinement signal there at all, correctly.
:::

## The refinement rule

Rank every segment by its peak interpolated-defect estimate, compare each to a tolerance set by the accuracy the mission actually needs, and **subdivide** the segments that exceed it — insert one or more new nodes inside them, refine locally, and leave the rest of the mesh untouched. Re-solve (warm-started from the previous solution, interpolated onto the new mesh) and repeat the check. This is the same idea as adaptive step-size control in an ODE integrator, applied once per NLP solve rather than once per step, and it is what turns "how many segments" from a guess into a computed, defensible answer: refine until every segment's estimate is below tolerance, and stop — not before, and not needlessly after.

::: example Fixing exactly the segment the estimate flagged
Replacing the flagged first segment of the mesh above with twelve short segments spanning $[0,4]\,\mathrm{s}$ (leaving the eight segments covering $[4,34]\,\mathrm{s}$ essentially as they were) and re-solving gives $t_f = 33.7672\,\mathrm{s}$ and propellant $86.7692\,\mathrm{kg}$ — within $0.013\,\%$ of the shooting-derived truth, versus the uniform mesh's $0.1\,\%$, roughly a sevenfold reduction in cost error from concentrating twenty total segments where they were needed rather than spreading ten of them evenly. The thrust history in the refined region: exactly zero through $t=0.99\,\mathrm{s}$, then a ramp from $15.5\,\%$ to full thrust concentrated within a $1.3\,\mathrm{s}$ window bracketing the true switch at $1.85\,\mathrm{s}$, rather than smeared across the full $3.38\,\mathrm{s}$ the uniform mesh produced.

The ramp did not disappear — it narrowed. No fixed mesh, refined once, represents a genuine discontinuity exactly, because the mesh has to be built before the switch's precise location is fully known; each round of refine-and-resolve narrows the window further, and the honest stopping rule is the interpolated-defect estimate falling below tolerance everywhere, not the ramp visually vanishing. A single, very fine *uniform* mesh would eventually narrow it just as far, but at many times the total node count this locally-refined mesh needed to reach a comparable accuracy.
:::

::: warning An error estimate this good still is not free
Evaluating the interpolated defect at extra points inside every segment costs extra evaluations of $\mathbf{f}$, proportional to how many check points are used — here, $19$ per segment, on top of the collocation nodes themselves. For an expensive dynamics model (a high-fidelity atmosphere, a multi-body gravity field), that cost is not negligible, and production tools typically use a cheaper proxy — a handful of check points rather than a dense sweep, or a Richardson-style comparison between two candidate polynomial orders — to keep the diagnostic itself from dominating the runtime. The dense sweep in the worked example above is a teaching device to make the effect unambiguous, not the way this would be run operationally on a large problem.
:::

## Check yourself

::: check
Why would evaluating the raw ODE residual at the mesh nodes themselves, rather than strictly between them, fail as a mesh-quality diagnostic?
:::

::: answer
The mesh nodes are exactly the points where the defect constraint was imposed and driven to (near) zero by the solver — checking the residual there measures how well the *optimiser* did its job, which is guaranteed to be good on any converged solve regardless of how coarse or fine the mesh is, not whether the *mesh* itself has enough resolution to represent the true trajectory. A one-segment mesh spanning the entire flight would show a tiny residual at its two endpoints no matter how badly it misrepresents everything in between; the diagnostic has to probe exactly the region the solver was never asked to get right.
:::

::: check
Segment $1$ in the ten-segment mesh had a peak residual about $100\times$ smaller than segment $0$, even though it is the segment immediately after the one containing the switch. Why is it not flagged as badly as segment $0$?
:::

::: answer
By $t=3.38\,\mathrm{s}$, the true optimal thrust has already been at its maximum, constant value for roughly $1.5\,\mathrm{s}$ (the switch was at $1.85\,\mathrm{s}$) — segment $1$ spans $[3.38,6.76]\,\mathrm{s}$, entirely after the switch, where the true dynamics are smooth (constant maximum thrust, no discontinuity inside that span). Its residual is not zero — the Hermite-Simpson approximation of a smooth but nonlinear (mass-varying) segment still carries some error — but it is the ordinary discretisation error of a well-behaved region, orders of magnitude smaller than the error of a segment trying and failing to represent a genuine jump strictly inside itself.
:::

::: check
A colleague proposes skipping the interpolated-defect check entirely and instead re-solving on a uniformly doubled mesh every time, comparing the cost to the previous solve as the stopping criterion. What does this lose compared to the estimate-driven approach in this lesson?
:::

::: answer
Doubling uniformly refines every segment equally, including the eight or nine that the estimate-driven approach showed were already accurate to within a factor of two of each other — all of that added resolution is wasted on parts of the trajectory that did not need it, while the one segment that actually needed subdividing gets only the same doubling as everywhere else, rather than the concentrated attention the diagnostic would have given it. Comparing costs between successive uniform refinements can also mask a badly localised error: the aggregate cost might already agree to three digits (as the ten-segment mesh's propellant did) while the control history is still qualitatively wrong in one segment, exactly the situation the worked example demonstrated — a cost-only stopping rule would have declared success at $N=10$ and never looked at the thrust history at all.
:::

::: check
Why does even the locally-refined, twenty-segment mesh still show a ramp, rather than an exact step, through the switch?
:::

::: answer
Every scheme in this module represents the control by interpolating between node values — piecewise linear for trapezoidal, and effectively similarly smooth for Hermite-Simpson's midpoint construction — so no finite mesh, chosen in advance of knowing the switch's exact location to machine precision, can place a node exactly at the discontinuity and represent a true jump with zero transition width. Refining narrows the window over which the transition is spread because it shrinks $h$ near the switch, but only an adaptive scheme that explicitly detects the switch time and inserts a mesh *break* exactly there — treating the two sides as separate, transition-free segments, the same idea a later lesson uses for spectral methods and a discontinuity — removes the ramp altogether rather than merely narrowing it.
:::

## Summary

| Object | Statement |
| --- | --- |
| Interpolated-defect estimate | $\mathbf{e}_k(\tau) = \dot{\mathbf{x}}_{\text{interp}}(\tau)-\mathbf{f}(\mathbf{x}_{\text{interp}}(\tau),\mathbf{u}_{\text{interp}}(\tau),\cdot)$, evaluated strictly inside a segment |
| Why it works | Nodes (and the HS midpoint) are correct by construction; interior points are not, so a large estimate is real information |
| Refinement rule | Subdivide segments whose peak estimate exceeds tolerance; leave the rest; re-solve; repeat |
| Coarse-mesh example | $N=10$ uniform: propellant $86.8399\,\mathrm{kg}$ ($0.1\,\%$ off), but thrust ramps from $0$ to $94.5\,\%$ across the whole first segment — the switch is invisible in the control history |
| Diagnostic result | Segment $0$'s peak estimate is $828\times$ the best segment's; segments $2$–$9$ agree within a factor of $2$ — correctly localised, no false alarms |
| Refined-mesh result | Twelve short segments over $[0,4]\,\mathrm{s}$: propellant error falls from $0.1\,\%$ to $0.013\,\%$; ramp narrows from $3.38\,\mathrm{s}$ to $1.3\,\mathrm{s}$ |
| Honest limit | A ramp narrows with refinement but never fully vanishes without explicitly detecting and breaking the mesh at the switch |
| Cost of the diagnostic | Extra $\mathbf{f}$ evaluations per segment; production tools use a cheaper proxy than a dense interior sweep |

Mesh refinement fixes accuracy after the fact; the next lesson takes on a method that reaches for a nonlinear, shooting-flavoured way to avoid needing a mesh's defect structure at all, trading it for a different kind of iteration entirely.
