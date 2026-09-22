---
id: l08-trust-regions-virtual-control
title: Trust regions and virtual control
minutes: 22
covers:
  - "Trust regions and artificial unboundedness; virtual control (virtual buffers) and artificial infeasibility"
---

Successive convexification fails in two distinct ways, and a learner meeting both for the first time is liable to reach for one fix when the failure in front of them needs the other. One failure is the subproblem finding nothing to return at all; the other is the subproblem returning something enthusiastically, confidently, and wrong. This lesson builds one device for each — virtual control, and the trust region — separately enough that the difference between them stays visible, and concretely enough that both can be checked on numbers rather than taken as a story about what SCvx "generally does."

## Artificial infeasibility, and the slack that prevents it

Linearising the true dynamics about a reference $(\bar{\mathbf{x}}(t),\bar{\mathbf{u}}(t))$ and discretising exactly gives an affine update $\mathbf{x}_{k+1}=\mathbf{A}_k\mathbf{x}_k+\mathbf{B}_k\mathbf{u}_k+\mathbf{c}_k$, and the subproblem imposes this as a hard equality — the same way this module has imposed exact dynamics since its very first SOCP. The trouble is that the *linear* reachable set from $\mathbf{x}_k$ is not the *true* reachable set; if the reference is a poor match to the real nonlinear dynamics, there can be states the true vehicle could reach that the linear model says are unreachable from $\mathbf{x}_k$ under any admissible $\mathbf{u}_k$ — and if the terminal condition or the next reference point happens to be one of those states, the subproblem's feasible set is empty. The solver has correctly solved the problem it was handed; the problem it was handed was a fiction with no solution, produced entirely by the act of linearising badly, and the iteration dies on a false negative.

**Virtual control** repairs this by giving the dynamics equality somewhere to put the error instead of failing:

$$
\mathbf{x}_{k+1} = \mathbf{A}_k\mathbf{x}_k + \mathbf{B}_k\mathbf{u}_k + \mathbf{c}_k + \boldsymbol{\nu}_k, \qquad \boldsymbol{\nu}_k \text{ unconstrained},
$$

with $\boldsymbol{\nu}_k$ penalised in the objective by a large weight $w$ on $\sum_k\|\boldsymbol{\nu}_k\|_1$ (an $\ell_1$ penalty, itself representable with the linear inequalities this module has used since its second lesson: $|\nu_{k,i}|\le\eta_{k,i}$, minimise $\sum\eta_{k,i}$). The subproblem is now feasible *by construction* — $\boldsymbol{\nu}_k$ can absorb any residual between what the linear model predicts and what is actually being demanded — and the heavy penalty means the solver only uses that freedom when it has no cheaper alternative. A converged iterate with $\boldsymbol{\nu}_k\approx\mathbf{0}$ everywhere describes a trajectory the *linearised* model reproduces essentially exactly, which is the signal the loop is ready to stop; a persistently large $\boldsymbol{\nu}_k$ at some node says the linearisation is still bad there, independent of whatever the subproblem's own duality gap reports.

::: example The residual a bad reference actually produces
Take a toy attitude-rate model — state $\mathbf{x}=(\theta,\omega)$, tilt angle and rate, control $u$ the commanded angular acceleration, $\Delta t=0.5\,\mathrm{s}$ — linearised (here trivially, since this particular model is already affine) as $\mathbf{A}=\begin{pmatrix}1&0.5\\0&1\end{pmatrix}$, $\mathbf{B}=\begin{pmatrix}0\\0.5\end{pmatrix}$, $\mathbf{c}=\mathbf{0}$. At the reference point $\mathbf{x}_{\text{ref}}=(0.02,0.01)$ with reference control $u_{\text{ref}}=0.05$, the linear model predicts

$$
\mathbf{x}_{\text{next, lin}} = \mathbf{A}\mathbf{x}_{\text{ref}} + \mathbf{B}u_{\text{ref}} = (0.025,\ 0.035).
$$

Suppose the reference trajectory's *own* next point — taken from re-simulating the true nonlinear dynamics, the standard for judging a reference's quality — is actually $(0.031,\ 0.015)$, reflecting nonlinear effects (of the kind the rotation example two lessons ago made concrete) the affine model cannot see. The virtual control needed to reconcile the two is $\boldsymbol{\nu} = (0.031,0.015) - (0.025,0.035) = (0.006,\ -0.020)$, of norm $0.0209$ — not enormous, but not the zero a trustworthy linearisation would leave. This is exactly what a solver reports back: not a failure, but a specific, checkable number saying how far the current reference still is from being dynamically self-consistent.
:::

::: key What virtual control buys, and what it costs
Virtual control makes every SCvx subproblem feasible regardless of how bad the current reference is, converting a hard failure (infeasible, nothing returned) into a soft, penalised, checkable signal. It buys nothing about optimality or correctness: a converged iterate is only trustworthy once $\|\boldsymbol{\nu}_k\|$ has fallen to numerical noise at every node, and a flight implementation checks that directly rather than inferring it from the subproblem's duality gap, which — as the previous lesson stressed — certifies the linear subproblem, not the physical trajectory.
:::

## Artificial unboundedness, and the region that prevents it

The complementary failure runs the opposite direction. A linear model is only ever a local description, and nothing in a bare linear objective knows to stop trusting itself far from the point it was built at. If the true, nonlinear cost eventually turns around — gets worse in a direction the linear model still reports as improving — an unconstrained subproblem will cheerfully walk the solution as far in that direction as the other constraints allow, reporting an excellent predicted cost for a trajectory the real dynamics cannot deliver.

::: example A linear model that predicts unbounded improvement in a direction that is actually a trap
Take a toy cost $g_{\text{true}}(x) = -x + 0.01x^3$, linearised at the reference $x=0$: $g_{\text{lin}}(x) = -x$, using the true slope $g_{\text{true}}'(0)=-1$.

| $x$ | $g_{\text{true}}(x)$ | $g_{\text{lin}}(x)$ |
| --- | --- | --- |
| $0$ | $0.000$ | $0.000$ |
| $5$ | $-3.750$ | $-5.000$ |
| $10$ | $0.000$ | $-10.000$ |
| $20$ | $60.000$ | $-20.000$ |
| $40$ | $600.000$ | $-40.000$ |
| $80$ | $5040.000$ | $-80.000$ |

The linear model reports ever-improving cost all the way to $x=80$, unbounded below in principle. The true cost turns around at $x^\star=\sqrt{1/0.03}\approx5.77$ and grows without bound past it — by $x=80$ the real cost is $+5040$, catastrophically worse than doing nothing, at exactly the point the linear model was most enthusiastic. An SCvx subproblem minimising this linear model with no other constraint on $x$ would drive straight past the true minimum and keep going, because nothing in the linear objective itself contains the information that it stops being a good description of anything past $x\approx6$.
:::

The **trust region** is the fix, and it is almost insultingly simple given what it prevents: bound how far the subproblem's solution may deviate from the reference, $\|\mathbf{x}_k-\bar{\mathbf{x}}_k\|_2\le\Delta$ (and similarly for the controls), turning an unconstrained linear program into a bounded one whose optimum cannot wander into territory the linearisation never described. In the toy example, a trust region of $\Delta=6$ centred on $x=0$ would cap the subproblem's solution near the true turning point rather than at $x=80$ — not exactly at the true optimum, but nowhere near the disaster an unbounded model invites.

Sizing $\Delta$ is itself a small optimization, done adaptively rather than fixed in advance. Compare the *actual* reduction in true cost the accepted step produced against the *predicted* reduction the linear model promised, $\rho = \Delta J_{\text{actual}}/\Delta J_{\text{predicted}}$, and adjust:

::: key The trust-region accept/reject/resize rule
$\rho$ very small or negative (model badly wrong, or cost got worse): reject the step, shrink $\Delta$. $\rho$ small but positive (model roughly right, modest gain): accept, shrink $\Delta$ a little — cautious progress. $\rho$ close to $1$ (model was an excellent local predictor): accept, and grow $\Delta$ — the model has earned a larger step next time.
:::

::: example A trust-region radius finding its footing over six iterations
Starting from $\Delta=2.0$, with a shrink factor of $3$ and a grow factor of $2$, and thresholds $\rho_0=0.05$ (below: reject), $\rho_1=0.3$, $\rho_2=0.75$ (at or above: grow):

| iteration | actual reduction | predicted reduction | $\rho$ | decision | new $\Delta$ |
| --- | --- | --- | --- | --- | --- |
| $1$ | $-3.0$ | $8.0$ | $-0.375$ | reject, shrink | $0.667$ |
| $2$ | $0.1$ | $6.0$ | $0.017$ | reject, shrink | $0.222$ |
| $3$ | $4.5$ | $5.0$ | $0.900$ | accept, grow | $0.444$ |
| $4$ | $5.6$ | $6.0$ | $0.933$ | accept, grow | $0.889$ |
| $5$ | $9.4$ | $9.6$ | $0.979$ | accept, grow | $1.778$ |
| $6$ | $7.9$ | $8.0$ | $0.988$ | accept, grow | $3.556$ |

The first two steps overshot a linearisation that was not yet trustworthy at that radius — one so badly the true cost went the wrong way entirely — and the rule's response was to shrink hard and try smaller steps rather than give up. Once the radius found a scale where the linear model's predictions actually matched what happened (from iteration $3$ on, $\rho$ sitting consistently near $1$), the rule started rewarding that trust with larger steps. This is the trust region doing, adaptively and from data the solve itself produces, what the previous lesson's fixed-tilt table could only show by brute-force comparison at a handful of preselected angles.
:::

## Check yourself

::: check
A subproblem returns with every $\boldsymbol{\nu}_k$ numerically zero and a tiny duality gap, but the trust region is still fairly wide. Is this iterate ready to fly, or is there a check still missing?
:::

::: answer
Zero virtual control says the linearised dynamics reproduce this trajectory essentially exactly — a necessary condition, not by itself sufficient. It says nothing about whether the linearisation used to build the subproblem was itself a good description of the *true* nonlinear dynamics at the states visited, which is exactly what the trust region's own history (had it needed several shrink cycles to get here, or grown quickly and consistently) would indicate, and what re-simulating the accepted trajectory through the true nonlinear dynamics and comparing to the linear prediction would confirm directly. A wide trust region with zero virtual control is not a contradiction — it can mean the linearisation was simply a very good local model over a wide region — but it is not, on its own, proof of that; the honest check is to verify it rather than infer it from either signal alone.
:::

::: check
Explain why penalising $\boldsymbol{\nu}_k$ with an $\ell_1$ norm, $\sum_i|\nu_{k,i}|$, rather than a squared $\ell_2$ norm, $\|\boldsymbol{\nu}_k\|_2^2$, is the more common choice in this setting.
:::

::: answer
An $\ell_1$ penalty on a variable that is otherwise free is well known, from the optimization module's treatment of regularisation, to drive components of that variable to *exactly* zero rather than merely small — the kink in $|\cdot|$ at the origin gives the optimizer a genuine incentive to land exactly on zero once no further cost reduction justifies moving off it, whereas a smooth squared penalty only ever pushes toward zero asymptotically without a mechanism to reach it exactly. For virtual control, landing on exactly zero is the entire diagnostic value of the quantity — "the linearisation needed no correction at this node" is a much cleaner signal than "the correction needed was merely small," and an $\ell_1$ penalty is what makes that clean signal the typical outcome once a reference has actually converged.
:::

::: check
In the trust-region example, iteration $2$'s actual reduction ($0.1$) was small but still *positive*, and the rule still rejected the step. Why reject a step that did, however slightly, improve the true cost?
:::

::: answer
The rule in this lesson rejects on $\rho<\rho_0=0.05$, and iteration $2$'s $\rho=0.1/6.0\approx0.017$ falls below that — the actual improvement was barely a fiftieth of what the model predicted, which is a sign the linearisation is unreliable at this radius even though it happened not to actively backfire this time. Accepting a step just because it is not actively harmful, when the model that chose it was almost entirely wrong about its effect, would keep the reference near a linearisation the next iteration has no reason to trust either; rejecting and shrinking spends one extra iteration to find a radius where the model's predictions and reality actually agree, which is the quantity iterations $3$ onward show paying off.
:::

::: check
Could virtual control, on its own, substitute for a trust region — using a heavily penalised $\boldsymbol{\nu}_k$ to absorb whatever a wide, untrusted step gets wrong, without ever bounding the step size at all?
:::

::: answer
No, and the two failures explain why. Virtual control repairs a *dynamics* equality that would otherwise have no solution; it has nothing to say about a linear *cost* that misdescribes the true cost far from the reference, which is exactly the artificial-unboundedness failure the toy cubic example showed. An unbounded step could, in principle, even find a $(\mathbf{x},\mathbf{u})$ path where the *linearised dynamics* are satisfied almost exactly (small $\boldsymbol{\nu}_k$) while the true nonlinear cost or a nonlinear constraint like the unit-quaternion condition is wildly violated at that distance from the reference — virtual control was never built to catch that, because it only ever looks at the dynamics residual, not at how far the state has travelled from where the model was built. The two devices patch two different equations in the subproblem and neither substitutes for the other.
:::

## Summary

| Object | Statement |
| --- | --- |
| Artificial infeasibility | A poor reference's linear model can make the subproblem's feasible set empty even though the true nonlinear problem has a solution |
| Virtual control | $\mathbf{x}_{k+1}=\mathbf{A}_k\mathbf{x}_k+\mathbf{B}_k\mathbf{u}_k+\mathbf{c}_k+\boldsymbol{\nu}_k$, $\boldsymbol{\nu}_k$ unconstrained, penalised by $w\sum_k\|\boldsymbol{\nu}_k\|_1$ |
| What $\boldsymbol{\nu}_k\to\mathbf{0}$ means | The linearised dynamics reproduce the accepted trajectory almost exactly — necessary, not sufficient, for the trajectory to be trustworthy |
| Artificial unboundedness | A linear cost model can predict unbounded improvement in a direction where the true cost actually turns around and grows |
| Trust region | $\|\mathbf{x}_k-\bar{\mathbf{x}}_k\|_2\le\Delta$ (and on controls); caps how far the subproblem may exploit a model only valid locally |
| $\rho$ | Ratio of actual to predicted cost reduction; the single number the resize rule reads |
| The resize rule | $\rho$ small or negative: reject, shrink. Moderate: accept, shrink slightly. Near $1$: accept, grow |
| Worked resize sequence | Two reject-shrink steps ($\Delta:2.0\to0.667\to0.222$) followed by four accept-grow steps ($\to0.444\to0.889\to1.778\to3.556$) as $\rho$ settled near $1$ |
| Division of labour | Virtual control patches the dynamics equality; the trust region patches the cost model; neither substitutes for the other |

Both devices are now in hand. The next lesson assembles them with the accept/reject rule into the complete SCvx algorithm, adds the free-final-time formulation this module's earlier fixed-$t_f$ line search set aside, and confronts the notation collision waiting between this module's two uses of the letter $\sigma$.
