---
id: l06-direct-transcription
title: "Direct transcription: from a continuous problem to a finite NLP"
minutes: 18
covers:
  - "Direct transcription: converting an infinite-dimensional problem into a finite NLP"
---

Every lesson so far has worked in continuous time: $\mathbf{x}(t)$ and $\mathbf{u}(t)$ are functions, living in an infinite-dimensional space, and the necessary conditions are a boundary value problem in that space. A computer cannot represent a function exactly — it represents finitely many numbers. **Direct transcription** is the act of replacing the continuous problem with a finite-dimensional one that a computer can actually hold in memory and solve, before any optimality condition is derived at all. This is the single largest conceptual fork in the whole module, and it is worth stating as sharply as the flashcard that tests it: indirect methods **derive the necessary conditions, then discretise** them into a boundary value problem to integrate; direct methods **discretise the problem first**, then hand the resulting finite program to a general-purpose optimiser. Optimise-then-discretise versus discretise-then-optimise — everything from here to the end of this module is the second branch.

## Building the finite-dimensional stand-in

Pick a mesh of times $t_0 < t_1 < \cdots < t_N = t_f$ (equally spaced or not — meshing is its own subject, taken up later). Represent the state and control not as functions but as their values at the mesh points, $\mathbf{x}_k \approx \mathbf{x}(t_k)$ and $\mathbf{u}_k \approx \mathbf{u}(t_k)$ for $k=0,\dots,N$, plus $t_f$ itself if the final time is free. These numbers — and nothing else — are the **decision vector** $\mathbf{z}$ the optimiser is allowed to change:

$$
\mathbf{z} = \big(\mathbf{x}_0,\dots,\mathbf{x}_N,\ \mathbf{u}_0,\dots,\mathbf{u}_N,\ [t_f]\big) \in \mathbb{R}^{n_z}.
$$

A finite $\mathbf{z}$ says nothing on its own about what happens *between* mesh points, and nothing yet forces $\dot{\mathbf{x}}=\mathbf{f}(\mathbf{x},\mathbf{u},t)$ to hold at all. That is supplied by a **defect constraint** on every segment $[t_k,t_{k+1}]$ — an algebraic equation, built from $\mathbf{f}$ evaluated at the segment's endpoints (and sometimes its midpoint), that is small exactly when the segment is consistent with the differential equation:

$$
\mathbf{d}_k\big(\mathbf{x}_k,\mathbf{x}_{k+1},\mathbf{u}_k,\mathbf{u}_{k+1}\big) = \mathbf{0}, \qquad k=0,\dots,N-1.
$$

Precisely how $\mathbf{d}_k$ is built from $\mathbf{f}$ — the choice between the trapezoidal and Hermite-Simpson forms the module's own flashcards already name — is the next two lessons' subject; what matters here is the shape of the idea. A feasible point of the transcribed problem, one where every $\mathbf{d}_k=\mathbf{0}$, is a discrete trajectory that satisfies the dynamics to whatever order the defect's underlying quadrature rule provides — which is the entire justification for treating "solve the ODE" and "drive every defect to zero" as the same task. The boundary conditions from the continuous problem — $\mathbf{x}_0$ fixed, a terminal manifold $\boldsymbol\psi(\mathbf{x}_N,t_f)=\mathbf{0}$ — become ordinary equality constraints on the first and last blocks of $\mathbf{z}$, no different in kind from the defects. Path constraints, $\mathbf{u}_k\in\mathcal{U}$ or $\mathbf{x}_k\in\mathcal{X}$, become bounds or inequality constraints imposed node by node. The Bolza cost, folded into pure Mayer form by the augmentation of the first lesson in this module, becomes a function of the augmented state's last node alone — one more reason that augmentation is not optional bookkeeping but the thing that lets the cost be handled by exactly the same node-by-node machinery as everything else.

$$
\text{minimise } \tilde\phi(\mathbf{z}) \quad\text{subject to}\quad \mathbf{d}_k(\mathbf{z})=\mathbf{0},\ \ \boldsymbol\psi(\mathbf{z})=\mathbf{0},\ \ \mathbf{u}_k\in\mathcal{U},\ \ \mathbf{x}_k\in\mathcal{X}.
$$

This is precisely the standard-form nonlinear program the optimization module's treatment of constrained optimisation and interior-point methods was built to solve — a finite objective, finite equality constraints, finite bound and inequality constraints. Nothing about $\tilde\phi$, $\mathbf{d}_k$ or $\boldsymbol\psi$ is assumed convex; a trajectory NLP is, in general, exactly as nonconvex as the underlying dynamics, and everything the optimization module said about local minima, KKT points and certificates on a nonconvex problem applies without modification.

::: key Discretise-then-optimise, in one line
Direct: replace $\mathbf{x}(t),\mathbf{u}(t)$ by values on a mesh, replace $\dot{\mathbf{x}}=\mathbf{f}$ by defect equations, hand the resulting finite NLP to a general solver. Indirect: derive $\dot{\boldsymbol\lambda}=-\partial H/\partial\mathbf{x}$ and the minimum condition first, discretise *that* boundary value problem afterward. The two branches transcribe different objects.
:::

::: example Sizing the NLP for a powered descent
The Mars powered-descent problem carried through earlier lessons has three states $(h,v,m)$ and one control $T$. Transcribing it on a uniform mesh of $N=40$ segments ($41$ nodes) gives a decision vector with

$$
41\times(3+1) = 164 \text{ state-and-control unknowns}, \quad +1 \text{ for } t_f \text{ if free} \;=\; 165 \text{ total},
$$

against $40\times3=120$ defect equations (one vector defect per segment, three components each) plus $5$ boundary equations — three at $t_0$ ($h_0,v_0,m_0$ all fixed) and two at $t_f$ ($h=0$, $v=0$; $m(t_f)$ is left free, since minimising propellant is exactly maximising $m(t_f)$, not fixing it) — for $125$ equality constraints in total, plus $82$ simple bound constraints ($0\le T_k\le T_{\max}$ at each of the $41$ nodes). Refining to $N=200$ multiplies every one of those counts roughly by five without changing a single line of the problem's physics — the mesh is a numerical-accuracy knob, not a modelling choice, which is exactly why it gets a lesson of its own on how to turn it without wasting computation.

The orbit-transfer problem from the shooting lesson transcribes just as mechanically: three states $(r,v_r,v_t)$ — $\theta$ was shown to decouple and needs no equation at all — one control (the steering angle $\beta$), free $t_f$. The two problems, physically unrelated, produce NLPs built from the identical template; only $\mathbf{f}$, the boundary conditions and the bounds differ. That template-following is precisely what makes direct transcription mechanisable in software, and why a single tool such as the ones surveyed in a later lesson can solve both without being told anything specific about rockets or orbits.
:::

## Why a feasible point is close to a real trajectory

The claim that driving every defect to zero solves the differential equation is not exact for a finite mesh — it is exact in the limit $N\to\infty$, and accurate to a specific, computable order for finite $N$, which the next two lessons quantify for the trapezoidal and Hermite-Simpson schemes specifically. What can be said in general now: if the quadrature rule underlying $\mathbf{d}_k$ is consistent (it reproduces the exact answer when $\mathbf{f}$ happens to be simple enough, for instance constant across the segment) and the mesh is refined so that every segment shrinks, the discrete trajectory converges to a true solution of $\dot{\mathbf{x}}=\mathbf{f}$ between the mesh points, and the discrete optimum converges to the continuous optimum. This is the entire justification for solving a finite NLP at all instead of insisting on the continuous problem: for a fine enough mesh, they are the same problem to within a tolerance you control by adding nodes, and "fine enough" is a question with a numerical answer, not an article of faith.

::: example The simplest possible defect, shrinking on cue
The simplest quadrature there is uses only the left endpoint of each segment: $d_k = x_{k+1}-x_k-h\,f(x_k)$ — cruder than either scheme the next two lessons develop, but consistent in exactly the sense just defined. Sampling the exact solution of $\dot x=-x$, $x(0)=1$ at a uniform mesh on $[0,1]$ and evaluating this defect at every node (it should be near zero if the exact solution nearly satisfies the discrete equation) gives, as the mesh is refined,

| $N$ | $h$ | $\max_k\lvert d_k\rvert$ | ratio to previous |
| --- | --- | --- | --- |
| $4$ | $0.2500$ | $2.880\times10^{-2}$ | — |
| $8$ | $0.1250$ | $7.497\times10^{-3}$ | $3.84$ |
| $16$ | $0.0625$ | $1.913\times10^{-3}$ | $3.92$ |
| $32$ | $0.03125$ | $4.832\times10^{-4}$ | $3.96$ |
| $64$ | $0.01563$ | $1.214\times10^{-4}$ | $3.98$ |

Halving $h$ shrinks the defect by a factor approaching $4=2^2$ — the exact solution satisfies this particular discrete equation to $O(h^2)$ locally, consistent with this being the local truncation error of the crudest one-sided quadrature there is. The ratio climbing toward, but not quite reaching, $4$ as $N$ grows is itself informative: the asymptotic rate is a limit, approached from below by the higher-order terms the theory drops, which is exactly the caveat to have in hand before the next lesson claims specific, much better orders for the two schemes actually used in practice.
:::

::: warning A converged NLP solves the discretised problem, not necessarily the continuous one
"Converged" here means the solver's stopping test was satisfied on $\mathbf{z}$ — every defect and boundary residual below tolerance, the KKT conditions of the *finite* program satisfied to the requested precision. It does not by itself say the mesh was fine enough to represent the true continuous solution faithfully. A control that swings rapidly between two values within a single segment, a state that changes sharply where the mesh is coarse, or a cost that keeps changing noticeably as $N$ is increased are all signs that the NLP converged to an accurate answer for the *wrong*, too-coarse problem. The only honest check is to re-solve on a refined mesh and see whether the answer moves — exactly the mesh-refinement question a later lesson turns into a stopping rule rather than a guess.
:::

## Check yourself

::: check
A colleague says "direct transcription turns an optimal control problem into a nonlinear program, so it must give up the Hamiltonian and the costate entirely." Is that right?
:::

::: answer
Not quite — it gives up *deriving* the Hamiltonian and costate as a prerequisite for solving the problem, since the NLP is built and solved without ever writing $H$ down. It does not make those objects vanish: the NLP has its own Lagrange multipliers on the defect and boundary constraints, from the same finite-dimensional theory the optimization module covers, and a later lesson shows precisely how those multipliers relate to the continuous costate. The Hamiltonian and costate are recoverable *after* the fact, as a diagnostic, rather than *required beforehand*, as they are for shooting.
:::

::: check
Why does folding a Bolza cost into pure Mayer form (the first lesson of this module) matter specifically for direct transcription, more than it would for, say, writing the problem down on paper?
:::

::: answer
On paper, $\phi + \int L\,dt$ and an augmented $\tilde\phi$ are two notations for the same number, and nothing forces a choice. Inside a transcription, the running cost has to be *evaluated* by some rule, and if it is not folded into a state, it needs a separate quadrature scheme — its own set of weights, possibly its own consistency questions — bolted onto a program that already has one quadrature scheme built into the defects. Augmenting the cost into a state means the objective is $\tilde\phi(\mathbf{x}_N)$ alone, a plain function of the last node, integrated by the exact same defects as every other state, with no second scheme to keep consistent with the first — a direct, practical payoff for a decision that looked like a formality when it was first introduced.
:::

::: check
The powered-descent transcription above used $N=40$ segments and got $125$ equality constraints against $165$ unknowns — more unknowns than equations. Does that make the NLP underdetermined, and if not, what fills the gap?
:::

::: answer
No: an NLP is not a square system of equations to be solved by elimination, it is an optimisation problem, and $165$ unknowns with $125$ equality constraints leaves a $40$-dimensional feasible manifold (before the bound constraints on $T_k$ are even considered) for the objective to be minimised *over*. Compare to the shooting formulation of the same problem, where the only unknowns were a handful of costates and the only equations were the terminal conditions — there, matching counts exactly was the whole game, because shooting solves a root-finding problem, not an optimisation. A direct transcription is a strictly bigger, differently-shaped mathematical object, and "more unknowns than equality constraints" is the normal, expected state of any NLP with room left for the cost to do its job.
:::

::: check
Two engineers transcribe the same orbit-transfer problem, one with $N=20$ segments and one with $N=200$. Both report their solver converged with defect residuals below $10^{-10}$. What is and is not established by that agreement?
:::

::: answer
Both have found a point that satisfies *their own* discretised problem's KKT conditions to high precision — the residual measures how well the discrete trajectory satisfies the defect equations *as written*, which is a statement about self-consistency of the numerical solution, not about how close that solution is to the true continuous optimum. What is established: neither NLP was solved sloppily. What is not established: that $N=20$ is fine enough to trust — if the two solutions' reported costs, flight times or control histories differ by more than the accuracy the application needs, the coarser mesh converged precisely to an accurate answer for a transcription that was itself too coarse, and only comparing the two (or refining further and checking for continued movement) can tell the difference.
:::

## Summary

| Object | Statement |
| --- | --- |
| Decision vector | $\mathbf{z}=(\mathbf{x}_0,\dots,\mathbf{x}_N,\mathbf{u}_0,\dots,\mathbf{u}_N,[t_f])$ — finitely many numbers |
| Defect constraint | $\mathbf{d}_k(\mathbf{x}_k,\mathbf{x}_{k+1},\mathbf{u}_k,\mathbf{u}_{k+1})=\mathbf{0}$, built from a quadrature rule for $\mathbf{f}$ |
| Direct vs indirect | Discretise-then-optimise vs. optimise-then-discretise |
| The resulting NLP | $\min\tilde\phi(\mathbf{z})$ s.t. defects, boundary conditions, path bounds — standard form from the optimization module |
| Convexity | Not assumed; as nonconvex as the underlying dynamics |
| Descent NLP size | $N=40$: $165$ unknowns, $125$ equality constraints, $82$ bounds |
| Consistency | Defects $\to\mathbf{0}$ as $N\to\infty$ recovers the true continuous trajectory; rate depends on the scheme |
| Converged $\ne$ accurate | A tight KKT residual certifies the discrete problem was solved, not that the mesh was fine enough |

The next two lessons work out exactly how a defect is built — first by shooting the segments themselves, which turns out to have its own conditioning story, and then by the trapezoidal and Hermite-Simpson quadratures that are what most people mean by "direct collocation."
