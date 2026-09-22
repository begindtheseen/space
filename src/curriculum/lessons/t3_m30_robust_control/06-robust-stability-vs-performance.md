---
id: l06-robust-stability-vs-performance
title: Robust stability versus robust performance
minutes: 18
covers:
  - Robust stability vs robust performance
---

A vehicle that stays stable across its uncertainty set but misses its pointing requirement on half the plants in that set has not been designed; it has been certified not to break. Every specification that appears in a requirements document — settling time, disturbance rejection, steady-state error, jitter — is a performance specification, and every one of them must hold for the real vehicle, not for the nominal model. That is the difference between robust stability and robust performance, and it is a much bigger difference than the phrasing suggests.

The gap is easy to see in one line of algebra. Robust stability asks that the denominator $1 + L_p$ never vanish. Robust performance asks that $1/(1 + L_p)$ stay *small*, which is a demand on how far from zero that denominator stays. A loop can be comfortably far from instability at every plant in the set and still let a disturbance through at ten times the permitted amplitude on the worst one.

This lesson defines the three tests — nominal performance, robust stability, robust performance — derives the exact single-loop robust performance condition, shows the two structural consequences that constrain every design before a controller is chosen, and sets up the multivariable version as a $\mu$ test on an augmented system with a fictitious performance block.

## Three questions

Fix an uncertainty set $\Pi$ with weight $W_I$ and a performance weight $W_P$ that encodes the specification as $\lvert W_PS\rvert < 1$.

- **Nominal performance (NP):** $\lVert W_PS\rVert_\infty < 1$. The specification holds for the nominal plant.
- **Robust stability (RS):** the loop is stable for every $G_p \in \Pi$. For output multiplicative uncertainty, $\lVert W_IT\rVert_\infty < 1$.
- **Robust performance (RP):** $\lVert W_PS_p\rVert_\infty < 1$ for every $G_p \in \Pi$, where $S_p = (1 + G_pK)^{-1}$.

RP implies both of the others: it contains NP as the special case $G_p = G$, and a plant on which the loop was unstable would give an infinite $\lVert W_PS_p\rVert_\infty$. The converse fails, routinely and by large factors, which is the content of the rest of this lesson.

## The exact single-loop condition

For a scalar plant with $G_p = (1 + W_I\Delta)G$ and $\lvert\Delta\rvert \le 1$, the perturbed loop gain is $L_p = L(1 + W_I\Delta)$, so

$$1 + L_p = 1 + L + LW_I\Delta = (1 + L)\left(1 + \frac{L}{1+L}W_I\Delta\right) = (1 + L)(1 + W_IT\Delta),$$

and therefore

$$S_p = \frac{S}{1 + W_IT\Delta}, \qquad \lvert W_PS_p\rvert = \frac{\lvert W_PS\rvert}{\lvert 1 + W_IT\Delta\rvert}.$$

The worst case over the unit disk of $\Delta$ is the one that makes the denominator smallest, namely $W_IT\Delta$ pointing straight at $-1$, giving $\lvert 1 + W_IT\Delta\rvert = 1 - \lvert W_IT\rvert$ — which is positive exactly when robust stability holds. So

$$\sup_{\lvert\Delta\rvert\le 1}\lvert W_PS_p\rvert = \frac{\lvert W_PS\rvert}{1 - \lvert W_IT\rvert},$$

and requiring this to be below one at every frequency rearranges to:

::: key Robust performance, single loop
$$\lvert W_P(j\omega)S(j\omega)\rvert + \lvert W_I(j\omega)T(j\omega)\rvert < 1 \qquad\text{for every }\omega .$$

Nominal performance is the first term below one, robust stability the second below one, and robust performance the *sum* below one. RP is an RS test on an augmented system with a fictitious performance block, so it is strictly harder.
:::

The sum form makes the difficulty vivid. A design with $\lVert W_PS\rVert_\infty = 0.9$ and $\lVert W_IT\rVert_\infty = 0.9$ passes both individual tests with ten percent to spare each and can still fail robust performance by eighty percent, if the two peaks happen to sit near the same frequency. And they usually do, because both peaks live near crossover: that is where $\lvert S\rvert$ has stopped being small, $\lvert T\rvert$ has not yet started being small, and the uncertainty weight is on its way up.

## Two structural consequences

**RP is impossible where both weights exceed one.** Since $\lvert S\rvert + \lvert T\rvert \ge \lvert S + T\rvert = 1$ at every frequency,

$$\lvert W_PS\rvert + \lvert W_IT\rvert \ \ge\ \min(\lvert W_P\rvert, \lvert W_I\rvert)\,(\lvert S\rvert + \lvert T\rvert) \ \ge\ \min(\lvert W_P\rvert, \lvert W_I\rvert).$$

So a necessary condition for robust performance, independent of any controller, is that $\min(\lvert W_P(j\omega)\rvert, \lvert W_I(j\omega)\rvert) < 1$ at every frequency. You may demand tight performance where the model is good, or accept large uncertainty where you demand nothing, but never both at once. Checking this takes two Bode magnitude plots and no design work at all, and it is the first thing to do when a specification and an uncertainty budget arrive on the same day.

**The sensitivity peak is usually the binding quantity.** With the standard weight $W_P = (s/M + \omega_B)/(s + \omega_BA)$, $\lvert W_P\rvert \to 1/M$ at high frequency, so near and above crossover the first term is about $\lVert S\rVert_\infty/M$. A design with $M = 2$ and a sensitivity peak of $1.5$ spends $0.75$ of its robust performance budget on peaking alone, leaving $0.25$ for the uncertainty term. Damping the loop is therefore often a more effective route to robust performance than slowing it down.

::: example A design that passes both tests and fails the real one
One spacecraft axis, $G = 1/(120s^2)$, with $K(s) = (k_ds + k_p)/(1 + s/80)^2$ sized for $\omega_n = 10\,\mathrm{rad/s}$ and $\zeta = 0.7$, so $k_p = 12\,000$ and $k_d = 1680$. Uncertainty: the actuator weight $W_I = (0.016s + 0.2)/(0.0064s + 1)$. Performance: $W_P = (s/2 + 6)/(s + 0.006)$, asking for a sensitivity crossover near $6\,\mathrm{rad/s}$ and a peak below $2$.

The two individual tests are comfortable:

$$\lVert W_PS\rVert_\infty = 0.879\ \text{at}\ 17.0\,\mathrm{rad/s}, \qquad \lVert W_IT\rVert_\infty = 0.422\ \text{at}\ 14.3\,\mathrm{rad/s}.$$

Nominal performance passes with twelve percent margin, robust stability with a factor of $2.4$. But the peaks are $2.7\,\mathrm{rad/s}$ apart, which at these bandwidths is no separation at all, and at $16.05\,\mathrm{rad/s}$ the two terms are $0.877$ and $0.417$. Their sum is

$$\lVert\,\lvert W_PS\rvert + \lvert W_IT\rvert\,\rVert_\infty = 1.294,$$

so robust performance fails by twenty-nine percent. Read it through the worst-case formula: on the worst plant in the set, the achieved $\lvert W_PS_p\rvert$ at that frequency is $0.877/(1 - 0.417) = 1.504$, meaning the disturbance rejection specification is missed by a factor of $1.5$ on that plant. The nominal design met it with room.
:::

## The multivariable version: a fictitious performance block

The trick that turns robust performance into something computable is to notice that "the weighted error stays small for every input" is itself a small gain statement. Close a *fictitious* full complex block $\boldsymbol{\Delta}_P$ around the performance channel — from the weighted error $z_P$ back to the exogenous input $w$ — with $\lVert\boldsymbol{\Delta}_P\rVert_\infty \le 1$. The augmented loop is stable for every such $\boldsymbol{\Delta}_P$ if and only if the performance channel has H-infinity norm below one. So:

::: key Robust performance as a mu test
Write the closed loop as $\mathbf{N} = \mathcal{F}_l(\mathbf{P},\mathbf{K})$, partitioned so that $\mathbf{N}_{11}$ sees the real uncertainty and $\mathbf{N}_{22}$ is the weighted performance channel. Then, with the augmented structure $\hat{\boldsymbol{\Delta}} = \operatorname{diag}(\boldsymbol{\Delta}, \boldsymbol{\Delta}_P)$ and $\boldsymbol{\Delta}_P$ a full complex block,

$$\text{RP} \iff \sup_\omega\ \mu_{\hat{\boldsymbol{\Delta}}}\big(\mathbf{N}(j\omega)\big) < 1 .$$

RS alone is $\sup_\omega\mu_{\boldsymbol{\Delta}}(\mathbf{N}_{11}) < 1$; NP alone is $\sup_\omega\bar{\sigma}(\mathbf{N}_{22}) < 1$.
:::

For the single-loop case this reproduces the sum condition exactly, and the derivation is worth doing because it shows where the sum comes from. With output multiplicative uncertainty and $\boldsymbol{\Delta}$ reduced to a scalar $\delta$,

$$\mathbf{N} = \begin{pmatrix}-W_IT & -T \\ W_PSW_I & W_PS\end{pmatrix}, \qquad \hat{\boldsymbol{\Delta}} = \operatorname{diag}(\delta, \delta_P).$$

Expand the determinant: $\det(\mathbf{I} - \mathbf{N}\hat{\boldsymbol{\Delta}}) = 1 - N_{11}\delta - N_{22}\delta_P + (N_{11}N_{22} - N_{12}N_{21})\delta\delta_P$, and the bracket is $(-W_IT)(W_PS) - (-T)(W_PSW_I) = 0$ — the matrix is rank one. So the determinant vanishes when $N_{11}\delta + N_{22}\delta_P = 1$, and the smallest equal-magnitude pair achieving that has $\lvert\delta\rvert = \lvert\delta_P\rvert = 1/(\lvert N_{11}\rvert + \lvert N_{22}\rvert)$. Hence

$$\mu_{\hat{\boldsymbol{\Delta}}}(\mathbf{N}) = \lvert N_{11}\rvert + \lvert N_{22}\rvert = \lvert W_IT\rvert + \lvert W_PS\rvert,$$

the sum condition, derived a second way. On the failing design above, evaluating $\mathbf{N}$ at $16.05\,\mathrm{rad/s}$ and running a D-scaling computation returns $\mu = 1.2943$, agreeing with the sum to fourteen digits, while $\bar{\sigma}(\mathbf{N}) = 1.639$ at the same frequency. Even here — two scalar blocks, the simplest structure there is — the unstructured test overstates the shortfall by twenty-seven percent. On a genuine multivariable problem the gap is larger, and $\mu$ is the only honest number.

A related quantity worth knowing by name is **skewed $\mu$**, written $\mu_s$. Ordinary $\mu$ asks "is the performance met for the whole uncertainty set?" and returns a yes-or-no scaled number. Skewed $\mu$ fixes the performance block at size one and asks how far the *uncertainty* can be scaled before performance is lost, which is usually the number a programme actually wants: not "did we pass" but "by how much".

::: example Fixing it, and what the fix costs
The failing design has $\lVert S\rVert_\infty = 1.488$. With $M = 2$ in the performance weight, that peak alone contributes about $1.488/2 = 0.744$ to the robust performance sum near crossover, which leaves almost nothing for the uncertainty term. The natural first move — lowering $\omega_B$ in $W_P$ — barely helps, because the peak of the sum sits above $\omega_B$ where $\lvert W_P\rvert$ has already flattened out at $1/M$: dropping $\omega_B$ from $6$ to $2\,\mathrm{rad/s}$ only brings the sum from $1.294$ to $1.153$.

Attack the peak instead. Raise the damping to $\zeta = 0.9$ and replace the second-order roll-off at $80\,\mathrm{rad/s}$ with a first-order roll-off at $300\,\mathrm{rad/s}$, keeping $\omega_n = 10\,\mathrm{rad/s}$ and $\omega_B = 6\,\mathrm{rad/s}$. Then

$$\lVert S\rVert_\infty = 1.052, \quad \lVert T\rVert_\infty = 1.195, \quad \lVert W_PS\rVert_\infty = 0.532, \quad \lVert W_IT\rVert_\infty = 0.312,$$

and the robust performance sum peaks at $0.837$ at $25.9\,\mathrm{rad/s}$ — a pass with sixteen percent to spare, at the *same* bandwidth as the failing design. What was given up is high-frequency roll-off: the controller now has one pole of attenuation above $300\,\mathrm{rad/s}$ instead of two above $80\,\mathrm{rad/s}$, so it passes more sensor noise to the actuator and offers less protection against unmodelled structural modes above a few hundred rad/s. That is the real trade, and the robust performance number found it. Slowing the loop down would have been the wrong answer.
:::

::: warning Robust performance is not robust stability with a smaller number
It is tempting to "allow for performance" by requiring $\lVert W_IT\rVert_\infty < 0.5$ instead of $1$. That is neither sufficient nor necessary. Not sufficient, because a large nominal $\lvert W_PS\rvert$ can break the sum on its own; not necessary, because in a band where the performance term is tiny, $\lvert W_IT\rvert$ may go all the way to $0.95$. Compute the sum, or compute $\mu$ on the augmented structure. There is no scalar derating factor that substitutes for either.
:::

## Check yourself

::: check
At $4\,\mathrm{rad/s}$ a design has $\lvert W_PS\rvert = 0.62$ and $\lvert W_IT\rvert = 0.55$. Does it meet robust performance there, and what is the achieved performance on the worst plant in the set?
:::

::: answer
The sum is $1.17$, so robust performance fails at that frequency by seventeen percent. Both individual tests pass. The achieved worst-case performance follows from $\lvert W_PS_p\rvert = \lvert W_PS\rvert/(1 - \lvert W_IT\rvert) = 0.62/(1 - 0.55) = 0.62/0.45 = 1.38$: on the worst plant the specification is missed by a factor of $1.38$. Note how sensitive that is — if $\lvert W_IT\rvert$ were $0.75$ instead, the achieved value would be $0.62/0.25 = 2.48$. The denominator $1 - \lvert W_IT\rvert$ is the distance to instability, and performance degrades hyperbolically as it closes.
:::

::: check
A requirements document asks for $\lvert S\rvert < 0.1$ up to $30\,\mathrm{rad/s}$, and the actuator uncertainty weight reaches $1$ at $20\,\mathrm{rad/s}$. Comment before doing any design.
:::

::: answer
The performance requirement means $\lvert W_P\rvert > 10$ up to $30\,\mathrm{rad/s}$; the uncertainty weight exceeds $1$ from $20\,\mathrm{rad/s}$ upward. In the band from $20$ to $30\,\mathrm{rad/s}$ both weights exceed one, so $\min(\lvert W_P\rvert, \lvert W_I\rvert) > 1$ and robust performance is impossible for *any* controller. Nothing needs to be designed to know this; two magnitude plots settle it. The conversation to have is which of the two numbers moves: tighten the actuator specification so that $\lvert W_I\rvert$ crosses one above $30\,\mathrm{rad/s}$, or relax the performance bandwidth below $20\,\mathrm{rad/s}$. This check catches a surprising number of requirement sets before a programme spends months failing to meet them.
:::

::: check
Why is the matrix $\mathbf{N}$ in the single-loop robust performance problem rank one, and what would change if the uncertainty were at the plant input rather than the output?
:::

::: answer
The four entries are $-W_IT$, $-T$, $W_PSW_I$ and $W_PS$, and the second column is the first divided by $W_I$: $\mathbf{N} = \begin{pmatrix}-T \\ W_PS\end{pmatrix}\begin{pmatrix}W_I & 1\end{pmatrix}$. A product of a column and a row is rank one, so the determinant vanishes and the $\delta\delta_P$ term in $\det(\mathbf{I} - \mathbf{N}\hat{\boldsymbol{\Delta}})$ disappears, which is what makes $\mu$ exactly the sum of the two diagonal magnitudes. For a *scalar* plant, moving the uncertainty to the input changes nothing, because scalars commute and $T_I = T$. For a multivariable plant it changes everything: $\mathbf{T}_I \ne \mathbf{T}$, the analogous $\mathbf{N}$ is not rank one, the sum formula fails, and $\mu$ must be computed numerically on the augmented structure.
:::

::: check
Explain why damping the loop can improve robust performance more than slowing it down, using the structure of the performance weight.
:::

::: answer
With $W_P = (s/M + \omega_B)/(s + \omega_BA)$, the magnitude flattens to $1/M$ above about $\omega_B$. The peak of the robust performance sum almost always sits near or above crossover, which is above $\omega_B$, so in that region the performance term is approximately $\lvert S\rvert/M$ and is controlled by the *sensitivity peak*, not by $\omega_B$. Lowering $\omega_B$ moves the corner of the weight down but leaves the high-frequency level at $1/M$ untouched, so the sum at the critical frequency barely improves — the worked example saw $1.294$ fall only to $1.153$ for a threefold reduction in $\omega_B$. Reducing $\lVert S\rVert_\infty$ from $1.49$ to $1.05$, by contrast, took the sum to $0.837$ at unchanged bandwidth. Peak sensitivity is the currency of robust performance.
:::

::: check
A programme reports RS with $\mu = 0.6$ and RP with $\mu = 1.4$. A junior engineer proposes reporting only the RS figure because "stability is the safety-critical property". Respond.
:::

::: answer
Stability is necessary, not sufficient, and the RP figure is telling you something specific: there exists a plant in the modelled set on which the loop is stable but the weighted performance is missed by a factor of $1.4$. If the performance weight encodes a pointing requirement, that is a mission failure rather than a vehicle loss, but it is still a failure, and it will be discovered in flight rather than in analysis. The right report carries both numbers together with the weights, plus the skewed-$\mu$ figure saying what fraction of the modelled uncertainty *can* be tolerated while still meeting performance. If the performance weight was written more aggressively than the actual requirement — which is common, because designers add margin into weights — then the correct action is to rewrite the weight to match the requirement and rerun, not to drop the test.
:::

## Summary

| Item | Statement |
| --- | --- |
| Nominal performance | $\lVert W_PS\rVert_\infty < 1$ |
| Robust stability | stable for every plant in $\Pi$; output multiplicative: $\lVert W_IT\rVert_\infty < 1$ |
| Robust performance | $\lVert W_PS_p\rVert_\infty < 1$ for every plant in $\Pi$; implies NP and RS, strictly stronger |
| Worst-case performance | $\sup_{\lvert\Delta\rvert\le1}\lvert W_PS_p\rvert = \lvert W_PS\rvert/(1 - \lvert W_IT\rvert)$ |
| Single-loop RP test | $\lvert W_PS\rvert + \lvert W_IT\rvert < 1$ at every frequency |
| Necessary condition | $\min(\lvert W_P\rvert, \lvert W_I\rvert) < 1$ at every frequency, for any controller |
| MIMO RP test | $\sup_\omega\mu_{\hat{\boldsymbol{\Delta}}}(\mathbf{N}) < 1$ with $\hat{\boldsymbol{\Delta}} = \operatorname{diag}(\boldsymbol{\Delta}, \boldsymbol{\Delta}_P)$, $\boldsymbol{\Delta}_P$ a full fictitious block |
| Rank-one structure | single-loop $\mathbf{N}$ is rank one, giving $\mu = \lvert W_IT\rvert + \lvert W_PS\rvert$ exactly |
| Skewed $\mu$ | fixes the performance block and scales the uncertainty: "by how much", not "did we pass" |
| Worked failure | NP $= 0.879$, RS $= 0.422$, RP $= 1.294$; worst-plant performance $0.877/(1-0.417) = 1.504$ |
| Worked fix | raise $\zeta$ to $0.9$, roll off later: $\lVert S\rVert_\infty$ from $1.488$ to $1.052$, RP from $1.294$ to $0.837$ |

The next lesson goes back to the multivariable machinery the last two tests rely on, and asks what a singular value of a transfer *matrix* actually means for a vehicle with three coupled axes.
