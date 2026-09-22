---
id: l09-scvx-algorithm-free-final-time
title: Assembling SCvx, and free final time by dilation
minutes: 21
covers:
  - The convergence ratio rho and the accept/reject/resize rule
  - Free-final-time formulation by time dilation, and the notation clash with the thrust slack
---

Two pieces are still missing before successive convexification is a complete, runnable algorithm rather than a collection of ideas. The trust-region lesson used the ratio $\rho$ as if it were simply read off a table, without saying where its numerator and denominator actually come from inside a real solve — this lesson closes that gap precisely. And every SCvx example so far has quietly kept $t_f$ fixed, exactly the assumption the flight-time lesson worked to remove from the 3-DoF formulation; this lesson removes it here too, by a method suited to an iterative solver rather than an outer line search, and flags a notational collision waiting for anyone who reads the SCvx literature after this module.

## Where $\rho$'s numerator and denominator actually come from

The previous lesson's resize table handed over pairs of numbers — "actual reduction," "predicted reduction" — as if they simply arrived. In a real implementation each comes from a specific, different computation, and the distinction between them is the entire content of what $\rho$ measures.

The **predicted** reduction comes from the convex subproblem's own bookkeeping: solve it, and it reports its objective value, including whatever virtual-control penalty was paid. Subtract that from the previous iteration's subproblem value (evaluated at the *old* reference, using the *old* linearisation) and the difference is exactly what the linear model promised — a number the solver hands over for free, no extra computation required.

The **actual** reduction requires more: take the new candidate's controls $\mathbf{u}_k^{\text{new}}$ — never the new candidate's *states*, which came out of the linear model and are not to be trusted — and re-simulate them through the *true*, nonlinear dynamics to get the trajectory the vehicle would actually fly. Evaluate the true cost on that re-simulated trajectory, and subtract from the true cost of the old reference. This is the step a real implementation cannot skip: it is the only place the loop ever consults the actual physics rather than a local model of it, and it is what stops SCvx from marking its own homework.

::: example Predicted and actual reduction, reusing a model this module already built
Return to the cubic cost toy from the trust-region lesson — true cost $g_{\text{true}}(x)=-x+0.01x^3$, linear model $g_{\text{lin}}(x)=-x$ built at the reference $x=0$ — and now read the two candidates it considered as genuine subproblem outputs. At $x=5$: predicted reduction $=g_{\text{lin}}(0)-g_{\text{lin}}(5) = 0-(-5)=5$; actual reduction $=g_{\text{true}}(0)-g_{\text{true}}(5)=0-(-3.75)=3.75$; $\rho=3.75/5=0.75$ — a solid, if imperfect, prediction, squarely in the "accept, keep or grow" range the resize rule rewards. At $x=20$: predicted reduction $=0-(-20)=20$, but the actual cost at $x=20$ is $+60$, so actual reduction $=0-60=-60$ — the true cost got *worse*, and $\rho=-60/20=-3.0$. Both candidates came from the same linear model applied at different distances from the same reference; the model's prediction was only ever honest close in, and $\rho$ is precisely the number that catches the difference without needing to know in advance how far is too far.
:::

::: key What $\rho$ actually compares
$$
\rho = \frac{J_{\text{true}}(\text{old reference}) - J_{\text{true}}(\text{new candidate, re-simulated})}{J_{\text{linear model}}(\text{old reference}) - J_{\text{linear model}}(\text{new candidate})}.
$$
The denominator is free — the subproblem solver already computed it. The numerator costs one extra nonlinear simulation per iteration, using the new candidate's *controls* only, and is the one place in the whole SCvx loop where the algorithm checks its model against reality rather than against itself.
:::

## Free final time by time dilation

The flight-time lesson handled a fixed $t_f$ by searching over it from outside a certified inner SOCP — a good fit for a one-shot convex solve, where every inner evaluation carries a full optimality guarantee worth protecting behind an outer search. SCvx's inner solves carry no such guarantee to protect, so folding $t_f$ directly into the iteration is not the same trade it would have been earlier in this module.

Normalise time to $\tau\in[0,1]$ and write the true dynamics $\dot{\mathbf{x}} = f(\mathbf{x},\mathbf{u})$ in terms of $\tau$ by the chain rule: with $t = s\,\tau$ for a **dilation factor** $s$,

$$
\frac{d\mathbf{x}}{d\tau} = \frac{d\mathbf{x}}{dt}\frac{dt}{d\tau} = s\,f(\mathbf{x},\mathbf{u}),
$$

so $s$ is simply $t_f$ relabelled as a decision variable multiplying the entire right-hand side. This does not remove the nonlinearity flight time introduces — $s\,f(\mathbf{x},\mathbf{u})$ is still a product of decision variables — but SCvx does not need it removed, only linearised like everything else. Expanding to first order about a reference $(\bar{\mathbf{x}},\bar{\mathbf{u}},\bar s)$ using the product rule,

$$
s\,f(\mathbf{x},\mathbf{u}) \approx \bar s\,f(\bar{\mathbf{x}},\bar{\mathbf{u}}) + \bar s\,\mathbf{A}(\mathbf{x}-\bar{\mathbf{x}}) + \bar s\,\mathbf{B}(\mathbf{u}-\bar{\mathbf{u}}) + f(\bar{\mathbf{x}},\bar{\mathbf{u}})\,(s-\bar s),
$$

with $\mathbf{A},\mathbf{B}$ the usual dynamics Jacobians at the reference. Every term here is affine in $(\mathbf{x},\mathbf{u},s)$: the existing $\mathbf{A},\mathbf{B}$ terms simply pick up a constant scale factor $\bar s$, and $s$ itself enters through a single new column whose coefficient is $f(\bar{\mathbf{x}},\bar{\mathbf{u}})$ — the reference trajectory's own instantaneous rate of change, nothing more exotic.

::: example The dilation column is exactly the reference's own dynamics rate
Take the translational rate $f(\mathbf{u}) = \mathbf{u}+\mathbf{g}$ (Mars gravity, $\mathbf{g}=(0,0,-3.7114)\,\mathrm{m/s^2}$) at a reference control $\bar{\mathbf{u}}=(0.2,-0.1,6.9)\,\mathrm{m/s^2}$ and reference dilation $\bar s=24.0\,\mathrm{s}$. A finite-difference check of $\partial(s f)/\partial s$ at this reference gives $(0.2,\,-0.1,\,3.1886)$, and $f(\bar{\mathbf{u}}) = \bar{\mathbf{u}}+\mathbf{g} = (0.2,-0.1,6.9-3.7114) = (0.2,-0.1,3.1886)$ — identical to full floating-point precision. This is not a coincidence to verify once and trust forever; it is the product rule applied to $s\,f$, and it means implementing free final time by dilation costs exactly one new column in the already-assembled Jacobian, populated with a quantity the linearisation step computes anyway.
:::

$s$ is discretised and solved for like any other decision variable — bounded (a solver needs $s>0$ and some sane upper limit), penalised or left free in the objective depending on whether flight time itself is something the mission wants minimised, and updated node to node by the same accept/reject/resize rule as everything else, with the trust region now also bounding how far $s$ may move from $\bar s$ in one step.

::: warning The notation clash this module has been quietly avoiding
Reach for a paper on SCvx and time dilation and the dilation factor is very often written $\sigma$ — a perfectly natural choice, since $\sigma$ commonly denotes a stretch or scale factor throughout applied mathematics. This module has used $\sigma=\Gamma/m$ for the mass-normalised thrust slack since the lossless-convexification lesson, and by the time free final time enters the picture $\sigma$ already means something specific and load-bearing: it is the quantity this whole module built a tightness theorem around. Using $\sigma$ for both would put $\|\mathbf{u}_k\|\le\sigma_k$ and the dilation update in the same system of equations with the same letter meaning two unrelated things — exactly the kind of collision that turns a correct derivation into an unreadable one. This lesson uses $s$ for the dilation factor for that reason, not because the literature is wrong to use $\sigma$; when reading a paper that does, the fix is to notice which $\sigma$ is which from context — one multiplies an entire dynamics equation, the other bounds a single thrust magnitude — and relabel on the way in, the way this lesson relabels on the way out.
:::

## Check yourself

::: check
A subproblem's own reported objective drops by a large amount from one iteration to the next. Is that, by itself, evidence the iterate is improving?
:::

::: answer
No — the subproblem's own reported value is exactly the predicted-reduction side of $\rho$, computed entirely from the linear model, and a large drop there says only that the linear model *believes* it found a much better point, which is precisely what happened at $x=20$ in the cubic-cost example even as the true cost got sharply worse. Evidence of real improvement requires the actual-reduction computation: re-simulate the new controls through the true dynamics and compare true costs. A large predicted drop with no corresponding actual-reduction check is exactly the failure mode artificial unboundedness describes.
:::

::: check
Why does the actual-reduction computation re-simulate using the new candidate's *controls* rather than simply reading off the new candidate's *states*, which the subproblem already computed?
:::

::: answer
The subproblem's reported new states satisfy the *linearised* dynamics (plus whatever virtual control was needed to make that true), not the real ones — using them directly would be comparing the linear model's cost to the linear model's cost a second time, exactly the mistake $\rho$ exists to avoid. The controls, by contrast, are a genuine, physically applicable command sequence; propagating them through the true nonlinear dynamics produces the states the real vehicle would actually reach, which is the only trajectory whose cost is meaningful to compare against the reference's true cost.
:::

::: check
In the dilation expansion, the coefficient on $(s-\bar s)$ was shown to equal $f(\bar{\mathbf{x}},\bar{\mathbf{u}})$ — the reference's own dynamics rate. What would it mean, physically, for this coefficient to be very close to zero at some node?
:::

::: answer
$f(\bar{\mathbf{x}},\bar{\mathbf{u}})\approx\mathbf{0}$ means the reference trajectory is nearly stationary at that instant — velocity and the net of thrust and gravity both nearly cancelling, an instantaneous hover. At such a node, the linearised subproblem sees almost no sensitivity of the dynamics to $s$ at all, so changing the dilation factor there barely affects the predicted trajectory locally; whatever influence $s$ has on the overall solution has to come through nodes where $f$ is not small. This is a reminder that the dilation column's usefulness to the solver varies node to node, tied directly to how dynamically active the reference is at each point in time.
:::

::: check
Suppose a paper defines a "normalised thrust" $\sigma = \|\mathbf{T}\|/T_{\max}$ (a fraction of maximum thrust, always between $0$ and $1$) and also uses $\sigma$ for a time-dilation factor in the same derivation. Is this the same collision this lesson warned about, or a different one?
:::

::: answer
It is the same underlying problem — one symbol carrying two unrelated meanings in one derivation — but it compounds the risk rather than merely repeating it, because this module's own $\sigma=\Gamma/m$ is neither of those two things either: not a $[0,1]$-normalised fraction and not a dilation factor, but a mass-normalised thrust *acceleration* with physical units of $\mathrm{m/s^2}$. A reader carrying this module's notation into a paper using $\sigma$ for a dimensionless throttle fraction would need to relabel twice — once for the paper's own internal clash, once again to avoid colliding with this module's $\sigma$ — which is exactly why the discipline this lesson recommends is to fix what each symbol means from the constraints and units it appears in, every time, rather than trust that a familiar letter means the familiar thing.
:::

## Summary

| Object | Statement |
| --- | --- |
| Predicted reduction | Read directly from the subproblem solver: old linear-model cost minus new linear-model cost, virtual-control penalty included |
| Actual reduction | Re-simulate the new candidate's *controls* through the true nonlinear dynamics; compare true costs — the one place the loop checks reality |
| Worked $\rho$ values | $x=5$: predicted $5$, actual $3.75$, $\rho=0.75$ (trustworthy). $x=20$: predicted $20$, actual $-60$, $\rho=-3.0$ (reject) |
| Time dilation | $\tau\in[0,1]$, $t=s\tau$: $d\mathbf{x}/d\tau = s\,f(\mathbf{x},\mathbf{u})$; $s$ joins the decision vector like any other variable |
| Linearised dilation | $s f \approx \bar s f(\bar{\mathbf{x}},\bar{\mathbf{u}}) + \bar s\mathbf{A}(\mathbf{x}-\bar{\mathbf{x}}) + \bar s\mathbf{B}(\mathbf{u}-\bar{\mathbf{u}}) + f(\bar{\mathbf{x}},\bar{\mathbf{u}})(s-\bar s)$ |
| Verified fact | The new $s$-column's coefficient is exactly $f(\bar{\mathbf{x}},\bar{\mathbf{u}})$ — confirmed by finite difference to full precision |
| The notation clash | Literature commonly uses $\sigma$ for dilation; this module's $\sigma=\Gamma/m$ already means something else — this module uses $s$ for dilation to keep the two apart |

With $\rho$ properly sourced and free final time folded in by dilation, the SCvx algorithm is complete: linearise, discretise (now including the dilation column), solve the convex subproblem with virtual control, compute $\rho$ against a true re-simulation, accept or reject, resize, repeat. The next lesson runs all of it, in full, on a real 6-DoF landing.
