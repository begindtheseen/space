---
id: l13-nlp-sparsity
title: "NLP sparsity: the Jacobian and Hessian block pattern"
minutes: 17
covers:
  - "NLP sparsity structure, the Jacobian and Hessian block pattern, and why sparsity decides solve time"
---

Every interior-point or sequential-quadratic-programming iteration, under the hood, comes down to factoring a large linear system built from the constraint Jacobian and the Lagrangian Hessian — the optimization module's machinery for a general NLP, applied here to a problem whose size is set by the mesh. How expensive that factorisation is depends enormously on how many of the matrix's entries are actually nonzero, and a collocation transcription has a very specific answer to that question, inherited directly from the fact that a defect only ever touches two adjacent nodes.

## The pattern, from what a defect touches

$\mathbf{d}_k$ — trapezoidal or Hermite-Simpson — is a function of exactly $\mathbf{x}_k,\mathbf{u}_k,\mathbf{x}_{k+1},\mathbf{u}_{k+1}$, and nothing else: no defect knows anything about $\mathbf{x}_j$ for $j$ more than one step away. Stack every defect into the constraint Jacobian and the result is **block-banded**: row block $k$ has nonzero entries only in the column blocks for nodes $k$ and $k+1$, and every other entry — the overwhelming majority, for any mesh with more than a handful of segments — is exactly zero, not merely small. Boundary conditions add a row touching only the first or last node block; nothing in a standard collocation transcription ever produces a row that touches a node in the middle of the mesh from a constraint anchored at the other end.

::: example Counting the zeros, not just naming them
The Mars descent problem — three states, one control, four unknowns per node — transcribed at increasing mesh size:

| $N$ | decision variables | defect rows | nonzero Jacobian entries | fraction nonzero |
| --- | --- | --- | --- | --- |
| $20$ | $84$ | $60$ | $480$ | $9.52\,\%$ |
| $50$ | $204$ | $150$ | $1200$ | $3.92\,\%$ |
| $100$ | $404$ | $300$ | $2400$ | $1.98\,\%$ |
| $200$ | $804$ | $600$ | $4800$ | $0.995\,\%$ |
| $400$ | $1604$ | $1200$ | $9600$ | $0.499\,\%$ |

The number of nonzero entries grows **linearly** in $N$ (each new segment adds exactly one more defect block, touching exactly two node blocks, regardless of how large the rest of the mesh has grown), while the total number of entries in the dense matrix grows roughly as $N^2$. The fraction that is actually nonzero falls by very nearly a factor of two every time $N$ doubles — by $N=400$, over $99.5\,\%$ of the matrix a dense solver would factor is pure, structural zero.
:::

::: key The sparsity pattern, in one line
A defect couples only its own two endpoint nodes; stacked across a mesh, that makes the constraint Jacobian block-banded with a fixed bandwidth (set by the scheme, not by $N$), giving $O(N)$ nonzero entries against $O(N^2)$ total — a fraction that shrinks every time the mesh is refined further.
:::

## Why that fraction decides solve time, not just memory

A dense linear solve of an $n\times n$ system costs $O(n^3)$ — Gaussian elimination has to consider every one of the $n^2$ entries at every one of $n$ elimination steps. A sparse, banded solve exploits exactly the structure above: eliminating one block only ever fills in entries within the band, so the cost per step stays bounded by the bandwidth rather than growing with the whole problem size, giving a total cost close to $O(n)$ for a fixed bandwidth (more precisely $O(n\,b^2)$ for bandwidth $b$, and $b$ here is fixed by the scheme — four to eight node-widths, not by $N$).

::: example A factorisation that stays fast while the dense one stops being possible at all
Building a representative banded linear system with the same block structure as the descent problem's collocation Jacobian (bandwidth set by the scheme, size set by $N$) and timing a direct solve both ways: at $n=804$ unknowns (the $N=200$ mesh above), a sparse solver factors and solves the system in $1.51\,\mathrm{ms}$; a dense solver, given the identical system with its zeros stored explicitly, takes $3313\,\mathrm{ms}$ — a $2192\times$ difference, on a problem this module would consider only moderately fine. Scaling the same banded structure up to $n=3204$ and $n=12\,004$ (meshes with hundreds to a few thousand segments, entirely ordinary for a real vehicle trajectory with multiple flight phases), the sparse solve takes $37.1\,\mathrm{ms}$ and $51.3\,\mathrm{ms}$ respectively — both comfortably fast — while a dense factorisation at $n=12\,004$ would need on the order of $10^{12}$ floating-point operations, not a slower answer but, in practice, not a computable one on the timescale of an iterative solve that needs to repeat this factorisation dozens of times.
:::

The Lagrangian Hessian a second-order method needs has the same story from the same underlying fact: the cost function contributes a block-diagonal piece (each node's stage cost depends only on that node's own $\mathbf{x}_k,\mathbf{u}_k$), and the defect constraints, weighted by their multipliers in the Lagrangian, contribute exactly the same two-node-wide coupling the Jacobian has — so the full KKT matrix an interior-point method factors at every iteration is block-tridiagonal-like in structure: nonzero on the block diagonal and its immediate neighbours, zero everywhere else. Specialised solvers for exactly this shape — Riccati-recursion-based KKT solvers, a direct descendant of the same LQR machinery the optimal control module built — exploit it to solve the linear system in a single forward-backward sweep down the mesh, at cost linear in $N$, without ever forming the dense matrix at all.

::: warning Sparsity is a property of the transcription, not automatically preserved by every solver call
Declaring a constraint function in code and handing it to a generic solver that estimates the Jacobian by finite differences on the *entire* decision vector throws this structure away — a solver that perturbs every one of $n$ variables and re-evaluates every one of $m$ constraints to build its Jacobian is doing $O(nm)$ work regardless of how sparse the true Jacobian is, and often defaults to exactly that unless told otherwise. Getting the speed shown above requires either supplying the sparsity pattern explicitly (so the solver only evaluates the nonzero entries, typically via graph colouring to batch multiple columns per finite-difference perturbation) or providing analytic derivatives that are sparse by construction, which is what the automatic-differentiation tools surveyed in a later lesson exist to do well. A correctly transcribed, genuinely sparse problem handed to a solver that ignores the sparsity gets none of this lesson's speedup.
:::

## Why single shooting never had this option

Direct single shooting's Jacobian — the sensitivity of the terminal state to every control, from an earlier lesson — is **dense** by construction: $\partial\mathbf{x}_N/\partial\mathbf{u}_0$ is generally nonzero because an early control genuinely affects the terminal state through the entire chain of forward propagation, and the same is true of every other control. There is no missing block to exploit, because nothing in single shooting's formulation ever introduced the intermediate node variables whose absence is exactly what makes collocation's Jacobian sparse in the first place. This is the other side of the trade-off named when single and multiple shooting were compared: multiple shooting and collocation buy sparsity by introducing more unknowns, and the payoff for those extra unknowns is precisely the factorisation speed this lesson has now put a number on.

## Check yourself

::: check
Why does the number of nonzero Jacobian entries grow linearly in $N$ while the dense matrix size grows quadratically?
:::

::: answer
Each additional mesh segment contributes exactly one more defect block, and that block touches exactly two node blocks (its own endpoints) regardless of how many other segments exist elsewhere in the mesh — so every new segment adds a fixed, constant number of nonzero entries, giving linear growth in $N$. The dense matrix's total entry count is (number of constraint rows) $\times$ (number of variable columns), and both of those grow linearly in $N$ on their own, so their product grows as $N^2$ — the ratio of the two, the sparsity fraction, is therefore $O(N)/O(N^2)=O(1/N)$, matching the roughly-halving-per-doubling pattern the worked example measured directly.
:::

::: check
A colleague builds a collocation solver, confirms the true Jacobian is over $99\%$ sparse at their mesh size, but the solve is still nearly as slow as a dense factorisation would be. What is the most likely explanation, given this lesson?
:::

::: answer
The sparsity of the *true* Jacobian is irrelevant if the solver was never told about it — a generic finite-difference Jacobian estimator that perturbs every decision variable one at a time and re-evaluates every constraint does $O(nm)$ work to discover a matrix that is $99\%$ zero, paying almost the full dense cost to compute something the solver then, at best, only partially exploits when factoring it. The fix named in the warning is supplying the sparsity pattern up front (so the Jacobian estimator only touches the entries that can possibly be nonzero) or using derivatives that are sparse from the start, not merely hoping a downstream linear-algebra routine will notice the zeros on its own.
:::

::: check
Why does the Lagrangian Hessian inherit the same two-node-wide banded structure as the constraint Jacobian, rather than some different pattern?
:::

::: answer
The Hessian of the Lagrangian is built from second derivatives of the stage cost (which depends only on one node's own $\mathbf{x}_k,\mathbf{u}_k$, contributing a purely block-diagonal piece) plus second derivatives of each defect constraint weighted by its multiplier (and a defect, like its own first derivative, only ever involves the two nodes it directly couples) — there is no third source of curvature in a standard collocation transcription that could introduce coupling between nodes further apart than that. Every term entering the Hessian traces back to either a single-node cost or a two-node defect, so the sum inherits exactly the bandwidth those two sources have individually.
:::

::: check
Estimate, from the measured $2192\times$ speedup at $n=804$, roughly how the sparse-versus-dense gap would change at $n=8040$ (ten times larger), assuming the sparse solve stays close to $O(n)$ and the dense solve stays $O(n^3)$.
:::

::: answer
Dense cost scales as $n^3$, so a $10\times$ increase in $n$ costs roughly $10^3=1000\times$ more; sparse cost close to $O(n)$ scales roughly $10\times$. The ratio between them therefore grows by a factor of about $1000/10=100$, from $2192\times$ to somewhere on the order of $2\times10^5\times$ — consistent with the qualitative jump the worked example already showed, where the dense solve was not merely slower but outright not attempted past a few thousand unknowns, because $n^3$ growth crosses from "slow" to "not worth running" far faster than $O(n)$ ever does.
:::

## Summary

| Object | Statement |
| --- | --- |
| Jacobian pattern | Block-banded; defect row $k$ touches only node blocks $k,k+1$; fixed bandwidth, independent of $N$ |
| Nonzero growth | $O(N)$ nonzeros against $O(N^2)$ dense entries; fraction nonzero $\approx1/N$ |
| Measured example | $9.52\,\%$ at $N=20$ down to $0.499\,\%$ at $N=400$ |
| Solve cost | Dense: $O(n^3)$. Banded sparse: close to $O(n)$ for fixed bandwidth |
| Timing example | $n=804$: sparse $1.51\,\mathrm{ms}$ vs. dense $3313\,\mathrm{ms}$ ($2192\times$); $n=12\,004$: sparse $51.3\,\mathrm{ms}$, dense not computable on the same timescale |
| Hessian pattern | Same bandwidth as the Jacobian: block-diagonal stage cost plus two-node-wide defect curvature |
| Prerequisite | The solver must be told the pattern (or given sparse derivatives) — an unstructured finite-difference Jacobian discards the advantage |
| Why single shooting misses out | No intermediate node variables to decouple; its Jacobian is dense by construction |

Sparsity is a property of the equations as written; the next lesson takes on a property of the *numbers* in them — the scaling that decides whether a correctly sparse, correctly structured problem converges at all.
