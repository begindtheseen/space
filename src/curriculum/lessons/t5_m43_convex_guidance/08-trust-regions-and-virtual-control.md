---
id: l08-trust-regions-virtual-control
title: Trust regions and virtual control
minutes: 24
covers:
  - "Trust regions and artificial unboundedness; virtual control (virtual buffers) and artificial infeasibility"
---

Imagine you sketch a map of your town from your front porch. Near your house it is excellent: every street, every shortcut. Farther out it gets vague, and at the edges you are mostly guessing. Now hand that map to a navigation app and ask for a route. Two different things can go wrong.

First, the app may say **"no route found"** — because your sketch left out a bridge that really exists. The trip is perfectly possible; the map just cannot see how. Second, the app may cheerfully find a **wonderful shortcut** far from home, through the part of the map you made up — and send you straight into a lake. The first failure gives you nothing. The second gives you something confident and wrong.

Successive convexification fails in exactly these two ways, because its linear model is a porch-sketch map: good near the reference, invented far from it. The two failures need two different fixes, and it is easy to reach for the wrong one. This lesson builds one device for each — **virtual control** for the "no route" failure and the **trust region** for the "lake" failure — separately enough that the difference stays clear, and with numbers you can check.

## Artificial infeasibility, and the slack that prevents it

Recall the update equation from the previous lesson. Linearize the true dynamics about a reference $(\bar{\mathbf{x}}(t),\bar{\mathbf{u}}(t))$, discretize exactly, and you get

$$
\mathbf{x}_{k+1}=\mathbf{A}_k\mathbf{x}_k+\mathbf{B}_k\mathbf{u}_k+\mathbf{c}_k .
$$

Read it as "the next state equals A times this state, plus B times this control, plus a constant". The subproblem imposes it as a hard equality, the same way this module has imposed exact dynamics since its first SOCP.

Here is the trouble. The states the *linear* model can reach from $\mathbf{x}_k$ are not the same as the states the *true* vehicle can reach. If the reference is a poor match to the real dynamics, the linear model may say some state is out of reach under any allowed control, even though the real vehicle could get there. If the landing condition happens to be one of those states, the subproblem has no solution at all. Its **feasible set** — the set of choices that satisfy every constraint — is empty.

The solver is not wrong. It correctly solved the problem it was handed. But that problem was a fiction, created entirely by linearizing badly, and the loop dies on a false "impossible". This is **[[artificial infeasibility|artificial]]**: infeasible because of the approximation, not because of the physics.

**Virtual control** repairs it by giving the dynamics equation somewhere to put the error instead of failing:

$$
\mathbf{x}_{k+1} = \mathbf{A}_k\mathbf{x}_k + \mathbf{B}_k\mathbf{u}_k + \mathbf{c}_k + \boldsymbol{\nu}_k, \qquad \boldsymbol{\nu}_k \text{ unconstrained}.
$$

The new term $\boldsymbol{\nu}_k$ (read "nu sub k") is a fictitious push that can move the state in any direction by any amount. It is "virtual" because no engine produces it. It is a **[[slack variable|slack]]** — an extra unknown that loosens a constraint — added to the dynamics.

A free push would make the dynamics meaningless, so it is made expensive. The objective gets a large weight $w$ times the sum of the $\boldsymbol{\nu}_k$ sizes, measured with the **[[one-norm|one-norm]]** $\|\boldsymbol{\nu}_k\|_1$ — the sum of the absolute values of its components:

$$
\text{minimize}\quad J_{\text{original}} + w\sum_k \|\boldsymbol{\nu}_k\|_1 .
$$

That penalty is still convex, and it fits the solver with linear inequalities: add helper variables $\eta_{k,i}$ ("eta"), require $-\eta_{k,i}\le\nu_{k,i}\le\eta_{k,i}$, and minimize $\sum\eta_{k,i}$. At the optimum each $\eta_{k,i}$ equals $|\nu_{k,i}|$.

Now the subproblem is feasible *by construction*: whatever the linear model gets wrong, $\boldsymbol{\nu}_k$ can absorb it. And because $w$ is large, the solver uses that freedom only when it has no cheaper choice.

The size of $\boldsymbol{\nu}_k$ at the answer is also a diagnostic. If $\boldsymbol{\nu}_k\approx\mathbf{0}$ at every node, the linearized model reproduces the trajectory with no fictitious help — a sign the loop is nearly done. If $\boldsymbol{\nu}_k$ stays large at some node, the linearization is still bad there, no matter what the subproblem's duality gap says.

::: example The mismatch a poor reference leaves behind
Take a small attitude model. The state is $\mathbf{x}=(\theta,\omega)$, the tilt angle and tilt rate. The control $u$ is the commanded angular acceleration. The time step is $\Delta t=0.5\,\mathrm{s}$. The true dynamics have some nonlinear terms, and their Jacobians at the reference give

$$
\mathbf{A}=\begin{pmatrix}1&0.5\\0&1\end{pmatrix}, \qquad \mathbf{B}=\begin{pmatrix}0\\0.5\end{pmatrix}, \qquad \mathbf{c}=\mathbf{0}.
$$

**Step 1: the linear prediction.** At the reference point $\mathbf{x}_{\text{ref}}=(0.02,\,0.01)$ with control $u_{\text{ref}}=0.05$:

$$
\mathbf{A}\mathbf{x}_{\text{ref}} = (0.02 + 0.5\times0.01,\ 0.01) = (0.025,\ 0.01), \qquad \mathbf{B}u_{\text{ref}} = (0,\ 0.025),
$$

so the linear model predicts $\mathbf{x}_{\text{next, lin}} = (0.025,\ 0.035)$.

**Step 2: what really happens.** Suppose running the same control through the *true* nonlinear dynamics for the same half second lands at $(0.031,\ 0.015)$. That true propagation is the standard for judging a reference. The nonlinear terms — like the rotation effect the previous lesson measured — are invisible to the linear model.

**Step 3: the virtual control.** The push needed to make the linear step land on the true next point is

$$
\boldsymbol{\nu} = (0.031,\,0.015) - (0.025,\,0.035) = (0.006,\ -0.020).
$$

Its two-norm is $\sqrt{0.006^2+0.020^2} = 0.0209$, and its one-norm (the one the penalty uses) is $0.006+0.020 = 0.026$.

**Sanity check.** Not enormous, but not the zero a trustworthy linearization would leave. This is what the solver reports back: not a failure, but a specific number saying how far the reference still is from being consistent with the real dynamics.
:::

The same trick works on other constraints, not only the dynamics. A non-convex path constraint — say a keep-out zone — is linearized about the reference too, and a bad linearization can make it impossible to satisfy. Add a penalized slack to that linearized inequality, so it reads "constraint $\le$ slack", with the slack pushed toward zero by the cost. That slack is called a **[[virtual buffer|virtual-buffer]]**. Virtual control is the version for equalities (the dynamics); virtual buffers are the version for inequalities. Both turn "no solution" into "a solution with a measured, penalized violation".

::: key What virtual control buys, and what it costs
Virtual control makes every SCvx subproblem feasible regardless of how bad the current reference is, converting a hard failure (infeasible, nothing returned) into a soft, penalised, checkable signal. It buys nothing about optimality or correctness: a converged iterate is only trustworthy once $\|\boldsymbol{\nu}_k\|$ has fallen to numerical noise at every node, and a flight implementation checks that directly rather than inferring it from the subproblem's duality gap, which — as the previous lesson stressed — certifies the linear subproblem, not the physical trajectory.
:::

## Artificial unboundedness, and the region that prevents it

The second failure runs the opposite way. A linear model is only a local description, and nothing in it knows where to stop trusting itself. Suppose the true cost eventually turns around — starts getting worse in a direction where the linear model still says "better". A subproblem with no limit on how far it may move will walk as far in that direction as the other constraints allow. It reports a wonderful predicted cost for a trajectory the real dynamics cannot deliver. In the worst case the linear cost can decrease forever, and the subproblem has no finite answer: it is **unbounded**. This is **artificial unboundedness** — unbounded because of the approximation, not the physics.

::: example A straight line that promises endless improvement
Take a toy true cost $g_{\text{true}}(x) = -x + 0.01x^3$. Linearize it at the reference $x=0$. Its slope there is $g_{\text{true}}'(0) = -1 + 0.03\times0^2 = -1$, so the linear model is $g_{\text{lin}}(x) = -x$.

| $x$ | $g_{\text{true}}(x)$ | $g_{\text{lin}}(x)$ |
| --- | --- | --- |
| $0$ | $0.000$ | $0.000$ |
| $5$ | $-3.750$ | $-5.000$ |
| $10$ | $0.000$ | $-10.000$ |
| $20$ | $60.000$ | $-20.000$ |
| $40$ | $600.000$ | $-40.000$ |
| $80$ | $5040.000$ | $-80.000$ |

**Step 1: where the true cost turns.** Set the slope to zero: $-1 + 0.03x^2 = 0$, so $x^2 = 1/0.03$ and $x^\star=\sqrt{1/0.03}\approx5.77$. The true cost is lowest there, at $g_{\text{true}}(5.77)\approx-3.85$, and grows without limit beyond.

**Step 2: what the linear model says.** It keeps improving all the way to $x=80$ and past it, with no bottom at all.

**Step 3: the damage.** At $x=80$ the real cost is $+5040$ — catastrophically worse than not moving — at exactly the point where the linear model was most enthusiastic.

**Sanity check.** Near the reference the two agree well: at $x=5$ the model says $-5$ and the truth is $-3.75$. The model is not bad; it is being used too far from home.
:::

The **[[trust region|trust-region-history]]** is the fix, and it is almost insultingly simple given what it prevents: limit how far the subproblem's answer may move from the reference,

$$
\|\mathbf{x}_k-\bar{\mathbf{x}}_k\|_2\le\Delta ,
$$

and the same for the controls. Read $\Delta$ ("delta") as the trust-region **radius**: the size of the neighborhood where we trust the linear map. This is a second-order cone constraint, so the subproblem stays an SOCP. It turns an unbounded linear subproblem into a bounded one whose answer cannot wander into territory the linearization never described.

In the toy example, a trust region of $\Delta=6$ around $x=0$ caps the answer at $x=6$. There the true cost is $-3.84$, almost exactly the true best of $-3.85$. Not precisely at the optimum, but nowhere near the disaster at $x=80$.

::: key Virtual control vs trust region
Virtual control: an unconstrained, heavily penalised slack in the linearised dynamics that prevents artificial INFEASIBILITY. Trust region: a bound on deviation from the reference that prevents artificial UNBOUNDEDNESS. Different failures, different fixes.
:::

::: warning Do not swap the fixes
Faced with a subproblem that returns "infeasible", it is tempting to *widen* the trust region to give the solver more room. That rarely helps: the emptiness comes from the linear dynamics equation, which no radius can repair. And faced with wild, over-confident steps, it is tempting to *raise* the virtual-control weight. That does nothing either: the steps can satisfy the linear dynamics perfectly while running off the edge of the map. Infeasible means look at virtual control; over-confident means look at the trust region.
:::

## Sizing the trust region from the data

How big should $\Delta$ be? Too big and the lake problem returns. Too small and the loop crawls. SCvx does not fix it in advance. It adjusts it every pass, using one number.

After solving a subproblem, compare two things. The **predicted reduction** is how much the linear model promised the cost would fall. The **actual reduction** is how much the true cost really fell. Their ratio is

$$
\rho = \frac{\Delta J_{\text{actual}}}{\Delta J_{\text{predicted}}},
$$

read "rho". (Careful: this $\rho$ is not the $\rho_{\min}$ and $\rho_{\max}$ of the thrust bounds — just a [[letter reused|rho-letter]].) If $\rho$ is near $1$, the model predicted well. If $\rho$ is small, the model over-promised. If $\rho$ is negative, the cost actually got *worse*. The next lesson shows exactly where both numbers come from inside a real solve.

::: key The trust-region accept/reject/resize rule
Pick three thresholds $0 \le \rho_0 < \rho_1 < \rho_2 < 1$, a shrink factor $\alpha > 1$ and a grow factor $\beta > 1$. Then:
- $\rho < \rho_0$ (model badly wrong, or the cost got worse): **reject** the step, shrink $\Delta \to \Delta/\alpha$.
- $\rho_0 \le \rho < \rho_1$ (model roughly right, modest gain): **accept**, shrink $\Delta \to \Delta/\alpha$ — cautious progress.
- $\rho_1 \le \rho < \rho_2$ (model fair): **accept**, keep $\Delta$.
- $\rho \ge \rho_2$ (model an excellent local predictor): **accept**, grow $\Delta \to \beta\Delta$ — the model has earned a larger step.

Finally clip $\Delta$ to a range $[\Delta_{\min}, \Delta_{\max}]$ so it never collapses to zero or grows without limit.
:::

**Rejecting** a step means throwing away the new candidate and keeping the old reference; the subproblem is then solved again, around the same reference, with the smaller radius. **Accepting** means the candidate becomes the new reference. A common default is $\rho_0 = 0$, $\rho_1 = 0.25$, $\rho_2 = 0.7$ and $\alpha = \beta = 2$: reject anything that made the true cost worse, halve on a poor prediction, double on a good one. For example, with $\Delta = 3.0$ and $\rho = 0.1$, the step is accepted and $\Delta$ becomes $1.5$; with $\rho = 0.5$ it is accepted and $\Delta$ stays $3.0$; with $\rho = 0.8$ it grows to $6.0$. Cautious implementations raise $\rho_0$ a little above zero or shrink by more than $2$, as the next example does.

::: example A trust-region radius finding its footing over six passes
Start from $\Delta=2.0$. Use a shrink factor $\alpha=3$, a grow factor $\beta=2$, and thresholds $\rho_0=0.05$ (below this: reject), $\rho_1=0.3$ and $\rho_2=0.75$ (at or above this: grow).

| iteration | actual reduction | predicted reduction | $\rho$ | decision | new $\Delta$ |
| --- | --- | --- | --- | --- | --- |
| $1$ | $-3.0$ | $8.0$ | $-0.375$ | reject, shrink | $0.667$ |
| $2$ | $0.1$ | $6.0$ | $0.017$ | reject, shrink | $0.222$ |
| $3$ | $4.5$ | $5.0$ | $0.900$ | accept, grow | $0.444$ |
| $4$ | $5.6$ | $6.0$ | $0.933$ | accept, grow | $0.889$ |
| $5$ | $9.4$ | $9.6$ | $0.979$ | accept, grow | $1.778$ |
| $6$ | $7.9$ | $8.0$ | $0.988$ | accept, grow | $3.556$ |

**Step 1: the first pass.** $\rho = -3.0/8.0 = -0.375$. Negative: the true cost went *up*. Reject, and divide the radius by $3$: $2.0/3 = 0.667$.

**Step 2: the second pass.** $\rho = 0.1/6.0 = 0.017$, below $\rho_0 = 0.05$. Reject again: $0.667/3 = 0.222$.

**Step 3: the model starts to fit.** At radius $0.222$, $\rho = 4.5/5.0 = 0.900$, above $0.75$. Accept and double: $0.444$. The next three passes also have $\rho$ above $0.9$, so the radius doubles each time: $0.889$, $1.778$, $3.556$.

**Sanity check.** The first two steps overshot a linearization that was not yet trustworthy at that radius. The rule responded by shrinking hard rather than giving up. Once it found a scale where predictions matched reality, it rewarded that with bigger steps. The radius ends larger than it began — earned, not assumed. This is the trust region doing, automatically and from the solve's own data, what the previous lesson's tilt table could only show by testing a handful of hand-picked angles.
:::

## Check yourself

::: check
A subproblem returns with every $\boldsymbol{\nu}_k$ numerically zero and a tiny duality gap, but the trust region is still fairly wide. Is this iterate ready to fly, or is a check still missing?
:::

::: answer
Zero virtual control says the linearized dynamics reproduce this trajectory essentially exactly. That is necessary, but not enough on its own. It does not say whether the linearization was a good description of the *true* dynamics at the states visited. The trust region's history hints at that — did it need many shrinks to get here, or grow steadily? — and re-simulating the accepted trajectory through the true nonlinear dynamics and comparing with the linear prediction confirms it directly. A wide trust region with zero virtual control is not a contradiction: the linearization may simply be very good over a wide region. But it is not proof of that either. The honest move is to verify with the true dynamics, not infer from either signal alone.
:::

::: check
Explain why the virtual control is usually penalized with the one-norm $\sum_i|\nu_{k,i}|$ rather than the squared two-norm $\|\boldsymbol{\nu}_k\|_2^2$.
:::

::: answer
The one-norm has a sharp corner at zero; the square is flat there. With a square, the penalty's slope at zero is zero, so a tiny nonzero $\boldsymbol{\nu}$ costs almost nothing, and the optimizer will keep a small virtual control whenever it helps the real cost even a little. The answer creeps toward zero but never lands on it. With the one-norm, the slope right next to zero is $w$, a fixed price per unit of fake push. Once $w$ is larger than what that push could save, the optimizer lands on *exactly* zero. (This makes it an **exact penalty**: for a large enough finite $w$, the penalized problem's solution has $\boldsymbol{\nu} = \mathbf{0}$ whenever a solution without it exists.) For virtual control, exactly zero is the whole point of the diagnostic: "no correction needed at this node" is a much cleaner signal than "the correction was small".
:::

::: check
In the six-pass example, iteration $2$'s actual reduction ($0.1$) was small but *positive*, and the rule still rejected the step. Why reject a step that did improve the true cost, however slightly?
:::

::: answer
The example's rule rejects when $\rho<\rho_0=0.05$, and $\rho=0.1/6.0\approx0.017$ is below that. The actual gain was less than a fiftieth of what the model promised. That says the linearization is unreliable at this radius, even though it happened not to backfire this time. Accepting a step only because it did no harm, when the model that chose it was almost entirely wrong about its effect, keeps the reference near a model the next pass has no reason to trust either. Rejecting and shrinking spends one extra pass to find a radius where prediction and reality agree — which is what pays off from iteration $3$ on. (With the common default $\rho_0 = 0$, this step would instead be accepted and the radius halved: a slightly bolder choice.)
:::

::: check
Could virtual control on its own replace a trust region — using a heavily penalized $\boldsymbol{\nu}_k$ to absorb whatever a wide, untrusted step gets wrong, without ever limiting the step size?
:::

::: answer
No, and the two failures explain why. Virtual control repairs a *dynamics* equation that would otherwise have no solution. It has nothing to say about a linear *cost* that misdescribes the true cost far from the reference — the unboundedness the cubic example showed. A huge step could satisfy the linearized dynamics almost perfectly (tiny $\boldsymbol{\nu}_k$) while the true cost, or a true nonlinear constraint such as the unit-quaternion condition, is wildly violated that far from the reference. Virtual control never catches this, because it only looks at the dynamics residual, not at how far the state has traveled from where the model was built. The two devices patch two different parts of the subproblem, and neither replaces the other.
:::

::: check
Using the common default rule ($\rho_0=0$, $\rho_1=0.25$, $\rho_2=0.7$, $\alpha=\beta=2$, radius clipped to $[0.01,\,10]$), what happens to a radius of $6.0$ after a pass with $\rho=0.72$, and then a pass with $\rho=-0.2$?
:::

::: answer
First pass: $\rho = 0.72 \ge 0.7$, so accept and grow: $6.0\times2 = 12.0$, which is above the cap, so the radius is clipped to $10$. Second pass: $\rho=-0.2 < 0$, so the cost got worse: reject the step (keep the old reference) and shrink: $10/2 = 5.0$. That is inside $[0.01, 10]$, so the radius is $5.0$.
:::

## Summary

| Object | Statement |
| --- | --- |
| Artificial infeasibility | A poor reference's linear model can make the subproblem's feasible set empty even though the true nonlinear problem has a solution |
| Virtual control | $\mathbf{x}_{k+1}=\mathbf{A}_k\mathbf{x}_k+\mathbf{B}_k\mathbf{u}_k+\mathbf{c}_k+\boldsymbol{\nu}_k$, $\boldsymbol{\nu}_k$ unconstrained, penalised by $w\sum_k\|\boldsymbol{\nu}_k\|_1$ |
| Virtual buffer | The same penalized slack on a linearized inequality constraint |
| What $\boldsymbol{\nu}_k\to\mathbf{0}$ means | The linearized dynamics reproduce the accepted trajectory almost exactly — necessary, not sufficient, for trusting it |
| Artificial unboundedness | A linear cost model can predict endless improvement where the true cost actually turns around and grows |
| Trust region | $\|\mathbf{x}_k-\bar{\mathbf{x}}_k\|_2\le\Delta$ (and on controls); caps how far the subproblem may exploit a model only valid locally |
| $\rho$ | Ratio of actual to predicted cost reduction; the single number the resize rule reads |
| The resize rule | $\rho<\rho_0$: reject, shrink. $\rho_0\le\rho<\rho_1$: accept, shrink. $\rho_1\le\rho<\rho_2$: accept, keep. $\rho\ge\rho_2$: accept, grow. Clip the radius |
| Worked resize sequence | Two reject-shrink steps ($\Delta:2.0\to0.667\to0.222$), then four accept-grow steps ($\to0.444\to0.889\to1.778\to3.556$) as $\rho$ settled near $1$ |
| Division of labor | Virtual control patches the dynamics equation; the trust region patches the reach of the model; neither replaces the other |

Both devices are now in hand. The next lesson shows where the two halves of $\rho$ really come from, assembles everything into the complete SCvx algorithm, frees the final time by stretching the clock, and deals with a clash between this module's two uses of the letter $\sigma$.

::: context artificial Why "artificial"
Both failures in this lesson are called **artificial** because the real problem does not have them. The true landing problem has a solution; only the linear stand-in says "impossible". The true cost has a bottom; only the linear stand-in says "improve forever". An engineer who sees "infeasible" from an SCvx subproblem should not conclude the landing is impossible — only that the current reference makes a poor map. Telling artificial failures from real ones is a big part of debugging SCvx.
:::

::: context slack Loosening a rope
A **slack variable** is an extra unknown added to a constraint to loosen it, like letting out some rope. You met one already: lossless convexification's $\Gamma$ loosened $\|\mathbf{T}\| = \Gamma$ into $\|\mathbf{T}\| \le \Gamma$. There the proof showed the slack is never used at the optimum. Virtual control is different: the slack *is* used when the model is poor, and the penalty is what pushes it back to zero as the reference improves. Same tool, different job.
:::

::: context one-norm Why a corner beats a bowl
The one-norm adds absolute values: $\|(0.006,-0.020)\|_1 = 0.026$. Near zero, $|\nu|$ is a V with a sharp corner, while $\nu^2$ is a flat-bottomed bowl.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="140" x2="330" y2="140" stroke="#6c7a93" stroke-width="1"/>
  <line x1="180" y1="20" x2="180" y2="150" stroke="#6c7a93" stroke-width="1"/>
  <polyline points="60,20 180,140 300,20" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <path d="M 60 20 Q 180 260 300 20" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <text x="304" y="30" font-size="12" fill="#1d6fd1">|ν|</text>
  <text x="304" y="50" font-size="12" fill="#b4232c">ν²</text>
  <text x="186" y="158" font-size="12" fill="#1f2a44">0</text>
  <text x="30" y="160" font-size="11" fill="#6c7a93">ν</text>
</svg>
```

The V keeps a steep slope right up to zero, so there is always a real price for a little fake push. The bowl's slope fades to nothing, so a little push is nearly free and never quite disappears.
:::

::: context virtual-buffer Slack for the inequalities
A **virtual buffer** is the inequality cousin of virtual control. Suppose a linearized path constraint reads $s(\mathbf{x}_k) \le 0$, say "stay out of this cone". A poor reference can make it impossible to satisfy together with everything else. Replace it with $s(\mathbf{x}_k) \le \nu'_k$, require $\nu'_k \ge 0$, and add $w'\sum_k \nu'_k$ to the cost. When $\nu'_k = 0$ the real constraint holds; when it is positive, it measures the violation. The name "buffer" comes from the tutorial literature on SCvx.
:::

::: context trust-region-history An old idea from curve fitting
Trust regions are much older than SCvx. Kenneth Levenberg (1944) and Donald Marquardt (1963) limited step sizes when fitting curves to data, and M. J. D. Powell developed trust-region methods in the 1970s. The ratio $\rho$ of actual to predicted improvement, and the grow-or-shrink rule, come from that classical nonlinear optimization. SCvx borrowed them and paired them with virtual control.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <circle cx="120" cy="80" r="50" fill="#8fb8f0" fill-opacity="0.4" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="120" cy="80" r="4" fill="#1f2a44"/>
  <text x="84" y="100" font-size="12" fill="#1f2a44">reference</text>
  <line x1="120" y1="80" x2="170" y2="80" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="140" y="74" font-size="12" fill="#1f2a44">Δ</text>
  <circle cx="160" cy="50" r="5" fill="#1d6fd1"/>
  <text x="176" y="40" font-size="12" fill="#1d6fd1">allowed step</text>
  <circle cx="300" cy="30" r="5" fill="#b4232c"/>
  <line x1="120" y1="80" x2="295" y2="32" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="5 4"/>
  <text x="236" y="70" font-size="12" fill="#b4232c">unbounded step</text>
</svg>
```
:::

::: context rho-letter One letter, two jobs
The ratio $\rho$ here and the thrust limits $\rho_{\min}$, $\rho_{\max}$ from the start of the module share only a Greek letter. Both names come from their original literatures: the thrust bounds from the lossless-convexification papers, the ratio from trust-region theory. You can always tell them apart: the thrust bounds carry the subscripts min and max and have units of newtons; the ratio and its thresholds $\rho_0$, $\rho_1$, $\rho_2$ are pure numbers with no units.
:::
