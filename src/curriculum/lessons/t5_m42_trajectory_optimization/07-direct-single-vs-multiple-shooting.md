---
id: l07-direct-single-vs-multiple-shooting
title: Direct single shooting vs direct multiple shooting
minutes: 17
covers:
  - Direct single shooting vs direct multiple shooting, and the conditioning difference between them
---

Direct transcription, as the previous lesson left it, makes both the states and the controls at every node free decision variables, tied together by defect constraints. That is one choice, not the only one. **Direct single shooting** makes only the controls free and computes the states by simulation — the same idea as the indirect shooting of two lessons ago, with one crucial difference: there is no costate anywhere in sight, no boundary value problem to root-find, just an ordinary optimisation over control values whose cost and constraints happen to require running a simulator to evaluate. It is a direct method (discretise, then optimise) that inherits shooting's oldest weakness in a new guise, and seeing exactly how is what makes multiple shooting, and the full collocation of the next lesson, worth their added bookkeeping.

## Direct single shooting

Fix a mesh $t_0,\dots,t_N$. The decision vector is controls only, $\mathbf{z}=(\mathbf{u}_0,\dots,\mathbf{u}_{N-1},[t_f])$ — no state variables at all. Given $\mathbf{z}$, the states are *computed*, not guessed: propagate $\mathbf{x}_0$ (known) forward through a one-step integration map $\mathbf{x}_{k+1}=\mathbf{F}(\mathbf{x}_k,\mathbf{u}_k)$ (an RK4 step, say) for $k=0,\dots,N-1$, and $\mathbf{x}_N$ is whatever comes out. There are no defect constraints, because there is nothing for a defect to measure — every candidate $\mathbf{z}$ the optimiser proposes corresponds to a dynamically feasible trajectory by construction, satisfying $\dot{\mathbf{x}}=\mathbf{f}$ (to the integrator's accuracy) automatically. The NLP shrinks to whatever terminal and path constraints the mission imposes, evaluated on the simulated $\mathbf{x}_N$ and the intermediate $\mathbf{x}_k$:

$$
\min_{\mathbf{u}_0,\dots,\mathbf{u}_{N-1}} \tilde\phi\big(\mathbf{x}_N(\mathbf{z})\big) \quad\text{s.t.}\quad \boldsymbol\psi\big(\mathbf{x}_N(\mathbf{z})\big)=\mathbf{0},\quad \mathbf{u}_k\in\mathcal{U}.
$$

Fewer variables, fewer constraints, and — genuinely useful during development — every single iterate the optimiser tries is a trajectory you could plot and sanity-check on a map, because dynamic feasibility was never negotiable. That property is worth remembering; it is the reason direct single shooting has not disappeared even though the rest of this lesson explains why it scales badly.

## The conditioning problem

$\mathbf{x}_N$ is a function of *every* control through the chain of propagation steps, so $\partial\mathbf{x}_N/\partial\mathbf{u}_0$ has to be computed by the chain rule through all $N$ steps, while $\partial\mathbf{x}_N/\partial\mathbf{u}_{N-1}$ touches only the last one. For dynamics with any growing mode, those two sensitivities are not merely different — they can differ by orders of magnitude, and a constraint Jacobian with columns spanning that many orders of magnitude is exactly the definition of ill-conditioned.

::: example A closed-form amplification factor
Take the scalar linear system $\dot x = a x + u$ with $a=0.5\,\mathrm{s^{-1}}$ (a mild instability, nothing exotic) over $t_f=10\,\mathrm{s}$, discretised exactly (zero-order hold) with $N=20$ steps of $h=0.5\,\mathrm{s}$: $x_{k+1} = A_d x_k + B_d u_k$ with $A_d = e^{ah} = 1.28403$, $B_d = (A_d-1)/a = 0.56805$. Unrolling the recursion,

$$
x_N = A_d^N x_0 + \sum_{k=0}^{N-1} A_d^{\,N-1-k}B_d\,u_k \qquad\Longrightarrow\qquad \frac{\partial x_N}{\partial u_k} = A_d^{\,N-1-k}B_d,
$$

so $\partial x_N/\partial u_0 = A_d^{19}B_d = 65.658$ while $\partial x_N/\partial u_{19} = B_d = 0.56805$ — a ratio of $115.6$, matching $e^{a t_f}=148.4$ up to the discretisation. A Newton step on this problem has to resolve a Jacobian whose first column is two orders of magnitude larger than its last, and that disparity only gets worse linearly in $N$ for a fixed $a$ and $t_f$: double the mesh resolution and the *ratio* stays the same (it is set by $a$ and $t_f$ alone), but the conditioning of the full Jacobian, now with $N$ columns spanning that same range more densely, does not improve.

**Multiple shooting caps it.** Split $[0,t_f]$ into two segments of $5\,\mathrm{s}$ each, each with its own free initial state matched by a continuity constraint: no single sensitivity now has to survive longer than half the horizon, and the worst-case amplification within a segment falls to $e^{a\,t_f/2}=12.18$. Four segments of $2.5\,\mathrm{s}$ bring it down to $e^{a\,t_f/4}=3.49$. The total span the dynamics get to amplify anything is capped by the segment length, not the mission duration, at the cost of $n$ extra state unknowns and $n$ extra continuity equations per interior boundary.
:::

::: key Why segmenting helps, in one line
Direct single shooting's Jacobian entries scale like the dynamics' amplification over the *entire* horizon; multiple shooting's scale like the amplification over one *segment*, however short you choose to make it, at the price of carrying the intermediate states as explicit unknowns tied together by continuity constraints.
:::

## Direct multiple shooting

Pick interior breakpoints $t_0<\tau_1<\cdots<\tau_{m-1}<t_f$. Each segment gets its own controls *and* its own free initial state $\mathbf{y}_i \approx \mathbf{x}(\tau_{i-1})$, propagated forward by simulation to the segment's end, exactly as single shooting propagates the whole horizon. The unknowns are every $\mathbf{y}_i$ together with every segment's controls; the equations are continuity — segment $i$'s simulated endpoint must match $\mathbf{y}_{i+1}$ — plus the original terminal conditions on the last segment alone. Collocation, the subject of the next lesson, is the limit of this idea taken to its extreme: make every mesh interval its own segment, of length $h$, and "propagate forward by simulation" collapses to a single-step quadrature formula instead of a full integrator call — the defect constraint of the previous lesson *is* a one-step multiple-shooting continuity condition, no more and no less.

::: example The same orbit transfer, honestly graded
Applying the same finite-difference sensitivity calculation to the minimum-time orbit transfer of the shooting lessons — a $40$-node direct single-shooting parametrisation in the steering angle $\beta$, linearised about a smooth (not necessarily optimal) candidate profile — gives $\lVert\partial\mathbf{x}_N/\partial\beta_k\rVert$ ranging from about $2.0\times10^{-3}$ at $k=0$ up to a peak of $1.6\times10^{-2}$ partway through the transfer, a spread of under a factor of $9$, and a $3\times40$ sensitivity matrix with condition number $7.0$ — mild, consistent with the modest $3.38\times$ maximum amplification the monodromy matrix of the shooting lesson found over the same trajectory. This is the honest picture for a two-orbit transfer with a fairly strong thrust-to-mass ratio: nothing here demands multiple shooting.

The lesson is not "multiple shooting never matters for real vehicles" — it is that whether it matters is a property of the *dynamics' amplification over the horizon in question*, which this module has now shown you how to measure directly (linearise, look at the sensitivity spread or the monodromy eigenvalues) rather than assumed. A many-orbit low-thrust spiral, a multi-year interplanetary cruise, or any problem where the underlying dynamics have a genuinely unstable direction — three-body regions near a libration point, atmospheric entry corridors — will show the toy problem's $100\times$-scale disparity or worse, and there direct single shooting is not merely suboptimal, it typically fails to converge from any initial guess a person would write down, for exactly the reason the first worked example demonstrates in closed form.
:::

::: warning Dynamic feasibility of every iterate is a real advantage, and it is easy to give up by accident
It is tempting to treat "direct single shooting has no defect constraints" as strictly a liability given the conditioning story above. It is not only that: because feasibility of the dynamics is automatic, single shooting never needs a feasible initial guess for the *states* — only a plausible control history — while collocation's initial state guess, if it is dynamically inconsistent, starts the solver arbitrarily far from satisfying its own defect constraints. On a well-conditioned problem or a short horizon, that can make single shooting easier to get running at all, even though it will condition worse as the horizon grows. Multiple shooting keeps a version of the same advantage — each segment's simulated trajectory is locally feasible even before continuity is satisfied — which is one reason it is a common middle ground rather than an automatic full jump to fine-grained collocation.
:::

## Check yourself

::: check
Why does direct single shooting have no defect constraints at all, when both direct transcription in general and direct multiple shooting specifically are built around them?
:::

::: answer
A defect constraint exists to force a *free* state variable to be consistent with the dynamics — it has no job to do when the state is not free in the first place. Direct single shooting never introduces state variables as unknowns; $\mathbf{x}_k$ is computed from $\mathbf{u}_0,\dots,\mathbf{u}_{k-1}$ by simulation, so consistency with $\dot{\mathbf{x}}=\mathbf{f}$ is guaranteed by how $\mathbf{x}_k$ was constructed, not imposed as a constraint on an otherwise-free quantity. Multiple shooting reintroduces exactly enough freedom (a state unknown at every segment boundary) to need exactly enough defects (one continuity equation per boundary) to remove it again.
:::

::: check
The closed-form example found $\partial x_N/\partial u_0 = A_d^{19}B_d$. Explain in one sentence, without redoing the algebra, why this quantity does not depend on which $B_d$'s intermediate values were — only on $A_d$ raised to a power and the single $B_d$ from the first step.
:::

::: answer
Because a perturbation to $u_0$ enters the dynamics only once, at the first step, contributing $B_d\,\delta u_0$ to $x_1$; from then on it is carried forward exactly like any other perturbation to the state, multiplied by $A_d$ at every subsequent step with no further contribution from $u_0$ — so by step $N$, that initial $B_d\,\delta u_0$ has been scaled by $A_d$ a further $N-1$ times, giving $A_d^{N-1}B_d\,\delta u_0$, and no other control's value enters the calculation of *this particular* sensitivity at all.
:::

::: check
A four-segment multiple-shooting solve of the unstable linear example converges easily; a two-segment solve is noticeably harder to get to converge from the same initial guess. Is that consistent with the theory in this lesson?
:::

::: answer
Yes. The worst-case amplification a single segment has to survive is $e^{a\,t_f/m}$ for $m$ equal segments, which is $e^{0.5\times10/4}=e^{1.25}=3.49$ for four segments against $e^{0.5\times10/2}=e^{2.5}=12.18$ for two — a real difference in local conditioning, even though both are dramatically better than the $e^{5}=148.4$ single-shooting figure. More segments trade additional continuity unknowns and equations for a shorter amplification exponent per segment, and the theory predicts exactly the monotonic easing observed as $m$ increases, with diminishing returns once the per-segment amplification is already close to $1$.
:::

::: check
Someone argues that because collocation is "multiple shooting with every interval as its own segment," it must always be strictly better-conditioned than any coarser multiple-shooting split. What is wrong with that argument?
:::

::: answer
Finer segmentation reduces the amplification any single segment's sensitivity has to survive, but it does not reduce the *number* of unknowns and constraints, which grows with the number of segments — a system with thousands of well-conditioned local blocks is not automatically well-conditioned globally just because each block is, particularly once a general-purpose solver's numerical linear algebra, rather than the dynamics' amplification, becomes the dominant source of error. In practice collocation *is* usually the better-conditioned choice for the reasons already given, but the argument "finer is strictly better with no downside" proves too much — it would equally argue for an arbitrarily fine mesh always being free, which the next lesson's discussion of what mesh refinement actually costs shows is not true.
:::

## Summary

| Object | Statement |
| --- | --- |
| Direct single shooting | $\mathbf{z}=\mathbf{u}$'s only; $\mathbf{x}_k$ computed by simulation; no defect constraints; every iterate dynamically feasible |
| Conditioning issue | $\partial\mathbf{x}_N/\partial\mathbf{u}_k$ compounds through $N-1-k$ further steps; early controls can be orders of magnitude more sensitive than late ones |
| Closed-form example | $a=0.5\,\mathrm{s^{-1}}$, $t_f=10\,\mathrm{s}$: sensitivity ratio $115.6\approx e^{a t_f}=148.4$ |
| Multiple shooting | Free state at every segment start; continuity constraints; amplification capped at $e^{a\,t_f/m}$ for $m$ segments |
| Segment count example | $m=2$: cap $12.18$; $m=4$: cap $3.49$ (from $148.4$ uncapped) |
| Orbit-transfer reality check | $3\times40$ sensitivity matrix, condition number $7.0$ — mild, matching the monodromy result of $3.38\times$ maximum amplification |
| Collocation | The $m\to N$ limit of multiple shooting: one segment per mesh interval |
| Trade-off | Single/multiple shooting: automatic dynamic feasibility of every iterate. Collocation: better conditioning, no such guarantee mid-solve |

The next lesson builds that limiting case in full: the trapezoidal and Hermite-Simpson defect constraints that make collocation what most people mean by "direct transcription" in practice, and the convergence order that makes the choice between them matter.
