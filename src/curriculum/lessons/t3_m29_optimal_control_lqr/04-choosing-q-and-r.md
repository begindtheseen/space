---
id: l04-choosing-q-and-r
title: "Choosing Q and R: Bryson's rule, scaling, and the effort budget"
minutes: 19
covers:
  - "Choosing Q and R: Bryson rule, physical scaling, iterating against an effort budget"
---

The Riccati solver is not the hard part of an LQR design. The hard part is the two matrices you hand it, because nothing in the mathematics tells you what they should be, and a reviewer who asks "why is $Q_{22}$ four hundred?" deserves a better answer than "it worked".

There is a defensible answer, and it starts from the requirements document rather than from intuition. Every vehicle programme has numbers already agreed: a pointing budget in arcseconds, a slew rate limit, a gimbal deflection limit, a wheel torque rating, a structural load capability. Those numbers are exactly what $\mathbf{Q}$ and $\mathbf{R}$ need, because a quadratic weight is nothing more than a statement of how much of each signal is acceptable. Bryson's rule turns the document into a first pair of matrices; the frontier tells you which direction to move from there; and the fourth-root law tells you how far to move in a single step.

This lesson is about that loop. It is the part of LQR that is engineering rather than mathematics, and it is what a design review will actually probe.

## Bryson's rule

Take each state and each input, decide the largest value you are willing to see in normal operation, and weight by the reciprocal of its square:

$$
Q_{ii} = \frac{1}{x_{i,\max}^2}, \qquad R_{jj} = \frac{1}{u_{j,\max}^2}, \qquad \text{off-diagonals zero}.
$$

::: key Bryson's rule
$Q_{ii} = 1/(\text{max acceptable } x_i)^2$ and $R_{jj} = 1/(\text{max acceptable } u_j)^2$. A scaling heuristic to start tuning from requirements, not an optimality claim.
:::

The reason it works is scaling, not optimality. Each term of the integrand becomes $(x_i/x_{i,\max})^2$, a dimensionless number that equals one when that signal sits exactly at its limit. A metre and a radian and a newton-metre are now comparable, the cost has units of seconds, and — crucially — the resulting $\mathbf{Q}$ and $\mathbf{R}$ are of comparable size, so the Riccati solve is numerically well conditioned in the bargain.

For the reaction-wheel axis used throughout this module ($J = 120\,\mathrm{kg\,m^2}$, states $\theta$ and $\omega$, input the wheel torque), a requirements document saying "$0.5^\circ$ pointing, $2^\circ/\mathrm{s}$ slew, $8\,\mathrm{N\,m}$ torque" yields

$$
\mathbf{Q} = \mathrm{diag}\big(1.3131\times10^{4},\ 820.70\big),\qquad R = 1.5625\times10^{-2},
$$

and the Riccati solution gives $\mathbf{K} = (916.73,\ 522.05)$, closed-loop poles $-2.175 \pm 1.705j\,\mathrm{s^{-1}}$, $\omega_n = 2.764\,\mathrm{rad/s}$. Whether that is the right controller is the next question; that it is a defensible **starting point** is the whole claim.

::: warning Bryson's rule is a starting point, not an answer
Three things it does not do. It is not optimal in any sense — it optimises nothing, it scales. It says nothing about states that matter only in combination, for which the right $\mathbf{Q}$ is $\mathbf{C}_z^\top\mathbf{C}_z$ for the combination $\mathbf{z}$ you care about, with off-diagonal entries. And its "maximum acceptable value" is a *steady-state* budget, which says nothing about the transient from a large dispersion: the design above draws $80\,\mathrm{N\,m}$ from a $5^\circ$ initial offset, ten times the torque rating, because $5^\circ$ is ten times the pointing budget the weights were scaled for. Bryson gets you onto the frontier. It does not tell you where on the frontier to stand.
:::

## The frontier

Hold $\mathbf{Q}$ fixed and sweep $\mathbf{R}$. Because only the ratio matters, this single sweep traces every design the weights can produce, and it traces them in order: there is no value of $\mathbf{R}$ that is faster *and* cheaper than another. That monotonicity is what makes the sweep a **frontier** rather than a search.

::: example Six decades of R on the wheel axis
With $\mathbf{Q} = \mathbf{I}$ (deliberately unscaled, to see what the sweep alone does) and $R$ from $10^{-3}$ to $10^{3}$, simulating a $5^\circ$ initial offset:

| $R$ | $k_1$ | $k_2$ | closed-loop poles $(\mathrm{s^{-1}})$ | $\zeta$ | 2 % settling (s) | peak $|u|$ (N m) |
| --- | --- | --- | --- | --- | --- | --- |
| $10^{-3}$ | $31.62$ | $92.68$ | $-0.386 \pm 0.338j$ | $0.752$ | $11.1$ | $2.760$ |
| $10^{-2}$ | $10.00$ | $50.00$ | $-0.208 \pm 0.200j$ | $0.722$ | $20.5$ | $0.873$ |
| $10^{-1}$ | $3.162$ | $27.73$ | $-0.116 \pm 0.114j$ | $0.712$ | $36.7$ | $0.276$ |
| $1$ | $1.000$ | $15.52$ | $-0.0647 \pm 0.0644j$ | $0.709$ | $65.3$ | $0.087$ |
| $10$ | $0.316$ | $8.718$ | $-0.0363 \pm 0.0363j$ | $0.708$ | $116$ | $0.028$ |
| $10^{2}$ | $0.100$ | $4.900$ | $-0.0204 \pm 0.0204j$ | $0.707$ | $207$ | $0.009$ |
| $10^{3}$ | $0.0316$ | $2.755$ | $-0.0115 \pm 0.0115j$ | $0.707$ | $367$ | $0.003$ |

Every column is monotone. Settling time and peak torque move in opposite directions across six decades of $R$ and four decades of peak effort, and no design anywhere on the list beats another on both. That is the trade, drawn.

Read the gains too. $k_1 = \sqrt{q_1/R} = R^{-1/2}$ exactly, dropping by $\sqrt{10}$ per decade, and the natural frequency $\omega_n = (q_1/R)^{1/4}/\sqrt{J}$ drops by $10^{1/4} = 1.78$ per decade. The damping ratio sits at $0.707$ across most of the sweep and creeps up only at the cheap end — an LQR on a double integrator with a rate penalty tends to a Butterworth pair, which the lesson on cheap control explains.

Note also what the unscaled $\mathbf{Q} = \mathbf{I}$ produces: even at $R = 10^{-3}$ the axis takes eleven seconds to settle while drawing under $3\,\mathrm{N\,m}$ of an available $8$. The sweep is doing its job; the starting point is poor, because $\mathbf{Q} = \mathbf{I}$ on a state measured in radians beside one in radians per second encodes a trade nobody chose.
:::

## Iterating to a budget

The sweep has a closed form that saves most of the iterations. Replace $R$ by $\alpha R$: then $k_1 = \sqrt{q_1/(\alpha R)}$ falls as $\alpha^{-1/2}$, and for a plant whose first state is a pure integrator of the rest, the peak control from a step offset is $|u(0)| = k_1\theta_0$. So

$$
\text{peak effort} \propto \alpha^{-1/2}
\qquad\Longrightarrow\qquad
\alpha = \left(\frac{\text{peak you got}}{\text{peak you can afford}}\right)^{2},
$$

and the bandwidth follows $\omega_n \propto \alpha^{-1/4}$. One simulation, one division, one re-solve.

::: example Sizing the wheel axis to its torque rating
Start from the Bryson design above, $\mathbf{K} = (916.73,\ 522.05)$, and require that a $5^\circ$ off-nominal attitude — the worst case coming out of a safe-mode recovery — be corrected without saturating the $8\,\mathrm{N\,m}$ wheels.

Simulating gives a peak of $80.0\,\mathrm{N\,m}$, so $\alpha = (80/8)^2 = 100$. Re-solving with $R \to 100R$:

| $\alpha$ | $\mathbf{K}$ | $\omega_n\,(\mathrm{rad/s})$ | 2 % settling (s) | peak $|u|$ from $5^\circ$ (N m) |
| --- | --- | --- | --- | --- |
| $1$ | $(916.7,\ 522.1)$ | $2.764$ | $1.32$ | $80.0$ |
| $10$ | $(289.9,\ 273.5)$ | $1.554$ | $3.77$ | $25.3$ |
| $100$ | $(91.67,\ 150.1)$ | $0.874$ | $6.79$ | $8.00$ |
| $10^{3}$ | $(28.99,\ 83.73)$ | $0.492$ | $12.1$ | $2.53$ |
| $10^{4}$ | $(9.17,\ 46.96)$ | $0.276$ | $21.6$ | $0.80$ |

$\alpha = 100$ lands the peak on $8.00\,\mathrm{N\,m}$ at the first attempt, exactly as the $\alpha^{-1/2}$ law predicts, and costs bandwidth: $\omega_n$ falls from $2.76$ to $0.874\,\mathrm{rad/s}$, a factor $\sqrt[4]{100} = 3.16$, and settling stretches from $1.32$ to $6.79\,\mathrm{s}$.

That is the honest trade, and it is worth saying out loud in a review: *a $5^\circ$ recovery slew within the torque rating costs a factor of three in attitude bandwidth relative to the Bryson design.* The alternative — keep the fast gains and shape the reference so the controller never sees a $5^\circ$ error — is a different architecture, not a different $\mathbf{R}$, and it is usually the better answer for large slews.
:::

## The shape of Q, not only its size

Scaling $\mathbf{R}$ walks along the frontier. Changing the *shape* of $\mathbf{Q}$ moves the frontier itself, and this is the move that answers "tighter pointing without more actuator authority".

Fix the peak torque exactly. Since $|u(0)| = k_1\theta_0$ and $k_1 = \sqrt{q_1/R}$, choosing $q_1/R = (8/0.0873)^2$ pins the peak at $8.00\,\mathrm{N\,m}$ for a $5^\circ$ offset whatever $q_2$ does. Now sweep the rate weight $q_2$ alone:

| $q_2$ | $k_2$ | closed-loop poles $(\mathrm{s^{-1}})$ | $\zeta$ | 2 % settling (s) | peak $|u|$ (N m) |
| --- | --- | --- | --- | --- | --- |
| $0$ | $148.3$ | $-0.618 \pm 0.618j$ | $0.707$ | $6.82$ | $8.00$ |
| $80$ | $164.7$ | $-0.686 \pm 0.541j$ | $0.785$ | $4.17$ | $8.00$ |
| $300$ | $203.0$ | $-0.846 \pm 0.221j$ | $0.968$ | $6.25$ | $8.00$ |
| $820.7$ | $273.0$ | $-0.410,\ -1.865$ | — | $10.2$ | $8.00$ |
| $2\times10^{4}$ | $1141$ | $-0.081,\ -9.428$ | — | $48.4$ | $8.00$ |

Identical peak effort, and settling times spanning a factor of twelve. The best of these designs, $q_2 = 80$, settles in $4.17\,\mathrm{s}$ against the Bryson shape's $10.2\,\mathrm{s}$ — a genuine improvement bought with no extra torque, by spending the weight where it does the most good rather than where the requirements document happened to put it. Push $q_2$ further and the rate penalty dominates: the loop becomes overdamped, one pole crawls in towards the origin, and the axis takes most of a minute to settle while still drawing its full $8\,\mathrm{N\,m}$ at the start.

Two cautions on that table. The $2\,\%$ settling time is a **discontinuous** function of the gains — it jumps when an overshoot peak crosses the band, which is why the column falls from $6.09\,\mathrm{s}$ at $q_2 = 70$ to $4.17\,\mathrm{s}$ at $q_2 = 80$ — so it is a reporting metric, not something to optimise directly. And the improvement here is real but bounded; you cannot reshape your way out of a genuine authority shortfall, and if the frontier at your available torque does not reach the requirement, the answer is a bigger wheel, a better sensor or a relaxed requirement.

## Practical rules

- **Fix one matrix.** Set $\mathbf{R} = \mathrm{diag}(1/u_{j,\max}^2)$ and never touch it again; do all tuning in $\mathbf{Q}$. Two knobs for one degree of freedom wastes an afternoon.
- **Move in decades.** Bandwidth goes as the fourth root of the weight ratio, so a factor of two in $\omega_n$ needs a factor of sixteen in weight. Anything smaller than a factor of three in a weight is not a change you will see.
- **Weight outputs, not states, when that is what you mean.** If the requirement is on a line-of-sight error that is a combination of states, use $\mathbf{Q} = \mathbf{C}_z^\top\mathbf{C}_z$ with the combination in $\mathbf{C}_z$, and accept the off-diagonal terms. A diagonal $\mathbf{Q}$ is a convenience, not a law.
- **Check saturation against the real dispersion set**, not against the budget in the requirements document. The two differ by an order of magnitude often enough that it should be a checklist item.
- **Re-check the loop at the extremes of the sweep.** As $\mathbf{R}$ shrinks, the gains and bandwidth grow into the unmodelled dynamics — the flexible modes, the sensor bandwidth, the sample rate — and a design that is excellent against the rigid-body model can be unflyable against the real vehicle. The frontier is computed from the model you gave it.

::: warning Weighting a state you did not intend to regulate
If a state has no acceptable maximum — a wheel speed that is allowed to sit anywhere in its range, an integrator you added deliberately — giving it a Bryson weight silently adds a requirement nobody wrote. The wheel-speed entry pulls momentum towards zero and fights the momentum-management logic; the integrator entry undoes the integrator. The correct weight for such a state is zero, and zero is allowed, provided the state is still detectable through the remaining weights. Check that before assuming a diagonal of reciprocal squares everywhere.
:::

## Check yourself

::: check
State Bryson's rule from memory and apply it: a launch vehicle must hold angle of attack below $3^\circ$ and pitch rate below $4^\circ/\mathrm{s}$, with gimbal deflection limited to $5^\circ$. Write $\mathbf{Q}$ and $R$.
:::

::: answer
Weight each term by the reciprocal of the square of its budget. In radians, $3^\circ = 0.05236$, $4^\circ/\mathrm{s} = 0.06981$, $5^\circ = 0.08727$, so

$$
\mathbf{Q} = \mathrm{diag}\left(\frac{1}{0.05236^2},\ \frac{1}{0.06981^2}\right) = \mathrm{diag}(364.6,\ 205.1)\ \mathrm{rad^{-2}},
\qquad R = \frac{1}{0.08727^2} = 131.3\ \mathrm{rad^{-2}} .
$$

Two remarks worth making in the same breath. First, the units must be consistent — mixing degrees in $\mathbf{Q}$ with radians in $R$ changes the ratio by $(180/\pi)^2 = 3283$ and produces a controller that is wrong by a factor of $\sqrt[4]{3283} = 7.6$ in bandwidth. Second, these particular limits are not independent: the gimbal is what generates the pitch rate that generates the angle of attack, so the resulting design should be checked against the actual wind profile rather than assumed to respect all three at once.
:::

::: check
A design draws a peak of $26\,\mathrm{N\,m}$ and you can afford $9\,\mathrm{N\,m}$. By what factor do you change $R$, and what happens to the closed-loop bandwidth?
:::

::: answer
Peak effort scales as $\alpha^{-1/2}$ when $R \to \alpha R$, so $\alpha = (26/9)^2 = 8.35$. Multiply $R$ by $8.35$ (or divide every entry of $\mathbf{Q}$ by $8.35$, which is the same move). The bandwidth scales as $\alpha^{-1/4} = 1.70$, so $\omega_n$ falls by about $41\,\%$ and settling time rises by roughly the same factor. The prediction is exact for a plant whose peak control occurs at $t = 0$ and whose first state is a pure integrator of the second; for a general plant it is a good first step, after which one more simulate-and-scale iteration lands on the budget. Verify rather than assume: the worked example hit $8.00$ from $80.0\,\mathrm{N\,m}$ at $\alpha = 100$ exactly, but a plant with the peak occurring mid-transient will need the second iteration.
:::

::: check
Your reviewer asks why the rate weight is $820.7$ and not $82.07$. Answer in terms of what changes and what does not.
:::

::: answer
$820.7 = 1/(2^\circ/\mathrm{s})^2$ in radians, which is the slew rate the requirements document allows; $82.07$ would correspond to a $6.3^\circ/\mathrm{s}$ budget, which no document contains. What changes if you use it: the rate penalty falls by a factor of ten relative to the angle penalty, the closed-loop damping drops, the second pole moves out, and the axis overshoots more while settling faster or slower depending on where on the shape curve you land — the third table in this lesson is exactly that sensitivity. What does not change: the peak control from a step, because that is set by $k_1 = \sqrt{q_1/R}$ and $q_1$ and $R$ are untouched. So the honest answer is "the rate weight is the slew budget, and changing it trades damping against settling at constant peak torque" — and then show the table, because a reviewer who asked the question will want the sensitivity, not the provenance.
:::

::: check
Two engineers produce controllers for the same plant. One used $\mathbf{Q} = \mathrm{diag}(100, 4)$, $R = 1$; the other $\mathbf{Q} = \mathrm{diag}(2500, 100)$, $R = 25$. Compare their gains without solving anything.
:::

::: answer
They are the same controller. The second pair is the first multiplied by $25$ throughout, and scaling $\mathbf{Q}$ and $\mathbf{R}$ by a common positive factor multiplies every trajectory's cost by that factor, leaving the ranking and therefore the minimiser unchanged; $\mathbf{P}$ scales by $25$ and $\mathbf{K} = \mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}$ is invariant. Only the ratio matters. The practical lesson is that comparing two designs by their weights is meaningless until both are normalised — divide each by its $R$, or by its largest entry — and that an argument about whether $\mathbf{Q}$ should be "bigger" is an argument about nothing unless $\mathbf{R}$ is held fixed.
:::

::: check
The frontier table shows the damping ratio approaching $0.707$ from above as $R$ grows. Why $0.707$, and what does it mean for tuning?
:::

::: answer
For this plant $\omega_n = (q_1/R)^{1/4}/\sqrt{J}$ and $2\zeta\omega_n = k_2/J$ with $k_2 = \sqrt{(q_2 + 2J\sqrt{q_1R})/R}$. As $R$ grows, the $q_2/R$ term inside $k_2$ shrinks faster than the $2J\sqrt{q_1/R}$ term, so $k_2 \to \sqrt{2J}(q_1/R)^{1/4}$ and $\zeta \to k_2/(2J\omega_n) = \sqrt{2J}/(2J)\cdot\sqrt{J} = 1/\sqrt2 = 0.707$. That is the Butterworth pattern: the expensive-control limit of an LQR on a double integrator places the poles on a circle at $45^\circ$ to the axes. For tuning it means the damping is largely **not** yours to choose on this plant — the optimiser picks something close to $0.707$ over most of the useful range, and if you need a different damping you must either reshape $\mathbf{Q}$, as the third table does, or accept that LQR has chosen a defensible answer and stop fighting it.
:::

## Summary

| Rule / result | Statement |
| --- | --- |
| Bryson's rule | $Q_{ii} = 1/x_{i,\max}^2$, $R_{jj} = 1/u_{j,\max}^2$; scaling from requirements, not optimality |
| Effect of scaling | Integrand becomes dimensionless and equals one at each limit; $J$ is in seconds |
| Only the ratio | $(\alpha\mathbf{Q}, \alpha\mathbf{R})$ gives the same $\mathbf{K}$; fix $\mathbf{R}$ and tune $\mathbf{Q}$ |
| Frontier | Sweeping $R$ traces a monotone trade between settling time and peak effort |
| Fourth-root law | $\omega_n \propto (q_1/R)^{1/4}$: a factor $16$ in weight for a factor $2$ in bandwidth |
| Budget iteration | Peak effort $\propto \alpha^{-1/2}$, so $\alpha = (\text{peak obtained}/\text{peak affordable})^2$ |
| Shape versus size | At fixed peak torque, varying $q_2$ moved settling from $4.17$ to $48.4\,\mathrm{s}$ |
| Output weighting | $\mathbf{Q} = \mathbf{C}_z^\top\mathbf{C}_z$ when the requirement is on a combination of states |
| Zero weights | Allowed and often correct, provided $(\mathbf{A}, \mathbf{Q}^{1/2})$ stays detectable |
| Wheel axis, Bryson | $\mathbf{Q} = \mathrm{diag}(1.3131\times10^4, 820.70)$, $R = 1.5625\times10^{-2}$, $\mathbf{K} = (916.7, 522.1)$, $\omega_n = 2.764\,\mathrm{rad/s}$ |
| Same axis, sized to $8\,\mathrm{N\,m}$ | $\alpha = 100$, $\mathbf{K} = (91.67, 150.1)$, $\omega_n = 0.874\,\mathrm{rad/s}$, settling $6.79\,\mathrm{s}$ |

You can now produce a controller and defend its weights. The next lesson asks a different question about the same controller: how much can the plant be wrong before it stops working, and why the answer for full state feedback is unusually generous.
