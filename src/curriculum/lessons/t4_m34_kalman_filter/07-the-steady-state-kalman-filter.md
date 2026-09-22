---
id: l07-the-steady-state-kalman-filter
title: The steady-state Kalman filter
minutes: 19
covers:
  - The steady-state Kalman filter
---

The last lesson left a question open on purpose. The covariance sequence in the running example fell fast at first, then more and more slowly — by step four it looked settled near $2.2\,\mathrm{m^2}$, barely moving step to step. "Barely moving" is not the same claim as "arrived," and this lesson exists because the difference between those two turns out to matter: the sequence above was still a very long way from where it actually ends up, and knowing that difference is what separates a filter design that is merely plausible from one you can defend with a number.

This lesson answers three questions in order. Does the Riccati recursion of the last lesson converge at all, and under what conditions? What does it converge *to*, exactly, and how do you compute that limit directly rather than iterating toward it? And once you have it, what is it good for — beyond, as it turns out, telling you that a large part of a real flight filter's computation can be deleted outright.

## The scalar steady state, solved exactly

Start where a closed-form answer is reachable by hand. A scalar filter's predicted-covariance recursion, from the last lesson, is $P^-_{k+1} = Q + P^-_k R/(P^-_k + R)$. A steady state is a value $y \geq 0$ that this map sends to itself: $y = Q + yR/(y+R)$. Clear the denominator:

$$
y(y+R) = Q(y+R) + yR \implies y^2 + yR = Qy + QR + yR \implies y^2 - Qy - QR = 0.
$$

The quadratic formula gives $y = \big(Q \pm \sqrt{Q^2 + 4QR}\big)/2$. Since $\sqrt{Q^2+4QR} > Q$ for $R>0$, the minus root is negative — not a variance — and only the plus root survives:

::: key The scalar steady-state covariance, in closed form
$$
P^-_{ss} = \frac{Q + \sqrt{Q^2 + 4QR}}{2}, \qquad
P^+_{ss} = P^-_{ss} - Q = \frac{-Q + \sqrt{Q^2+4QR}}{2}, \qquad
K_{ss} = \frac{P^-_{ss}}{P^-_{ss}+R}.
$$
:::

Existence is one question; convergence *to* it from an arbitrary start is another, and here it is answerable directly rather than cited. Write $f(y) = Q + yR/(y+R)$. Its derivative, $f'(y) = R^2/(y+R)^2$, is positive everywhere ($f$ is increasing) and $f''(y) = -2R^3/(y+R)^3$ is negative everywhere ($f$ is concave), for every $y \geq 0$. A concave, increasing map with $f(0) = Q > 0$ crosses the line $y=y$ from above to below exactly once for $y \geq 0$ — at $P^-_{ss}$ — which means $f(y) > y$ for $0 \leq y < P^-_{ss}$ and $f(y) < y$ for $y > P^-_{ss}$. Starting anywhere non-negative, the iteration $y_{k+1}=f(y_k)$ therefore moves monotonically toward $P^-_{ss}$ and cannot overshoot it or oscillate around it: this is a complete, elementary proof that the scalar recursion converges to the unique positive fixed point from *any* non-negative starting value, not merely a demonstration that it did so once.

::: example The scalar steady state, matched against the predict-and-update lesson's sawtooth
With $Q=0.2$, $R=1$ — the scalar example from the predict/update lesson — the closed form gives $P^-_{ss} = (0.2+\sqrt{0.84})/2 = 0.558258$ and $P^+_{ss} = 0.358258$, with $K_{ss} = 0.358258$. Continuing that lesson's sawtooth table past the six rows already shown: $P^+_k = 0.3844, 0.3688, 0.3626, 0.3600, 0.3590, 0.3586, 0.3584, 0.3583, 0.3583,\ldots$ for $k=4$ through $12$ — visibly converging to exactly $0.3583$, matching $P^+_{ss}$ to four decimal places by $k=11$. Thirty iterations from $y_0=0$ using the closed-form map gives $P^-_{ss} = 0.5582576$, agreeing with the quadratic-formula value $0.5582576$ to seven digits.

The scalar rate of convergence is itself computable: $f'(P^-_{ss}) = R^2/(P^-_{ss}+R)^2 = 1/(1.558258)^2 = 0.411833$, and separately $(1-K_{ss})^2 = (1-0.358258)^2 = 0.411833$ — the same number, because $1-K_{ss} = R/(P^-_{ss}+R)$ is exactly the square root of $f'(P^-_{ss})$. The covariance recursion converges at a rate equal to the *square* of the quantity $(1-K_{ss})$ that governs how fast the estimation error itself decays each step — a relationship the vector case reproduces below in a form worth recognising on sight.
:::

## When the recursion is guaranteed to converge at all

The scalar proof above does not generalise its algebra directly to matrices, but the *conditions* under which the matrix Riccati recursion converges to a unique fixed point, independent of $\mathbf{P}_0$, are a classical result of Kalman filtering theory, and their statement uses exactly the vocabulary the state-space module built: the pair $(\mathbf{F}, \mathbf{H})$ must be **detectable**, and, writing $\mathbf{Q} = \mathbf{G}_w\mathbf{G}_w^{\mathsf{T}}$ for some matrix $\mathbf{G}_w$, the pair $(\mathbf{F}, \mathbf{G}_w)$ must be **stabilizable**.

Both hypotheses have a direct reading. If some unstable direction of $\mathbf{F}$ were undetectable — invisible to $\mathbf{H}$ no matter how the state evolves — no measurement could ever bound the error growing along it, and no finite steady-state covariance could exist; detectability of $(\mathbf{F},\mathbf{H})$ rules this out by requiring every unstable mode to be observable. If some unstable direction received no process noise at all and were also uncontrollable from $\mathbf{G}_w$, the Riccati recursion could depend on exactly how much of that direction happened to be in $\mathbf{P}_0$, since nothing in the model would ever add to or reveal it independently; stabilizability of $(\mathbf{F}, \mathbf{G}_w)$ rules this out too. Together they guarantee a unique positive semi-definite fixed point $\mathbf{P}_{ss}$, reached from *any* $\mathbf{P}_0 \succeq \mathbf{0}$, with the resulting filter asymptotically stable. This module does not prove the matrix case in full — it is a genuinely deep result, first established by Kalman himself — but the scalar proof above is its complete argument in the one-dimensional case, and the numerical demonstration below is the multivariable case checked directly rather than taken purely on faith.

For the running constant-velocity, position-only model, both hypotheses hold with room to spare: the observability matrix $\begin{pmatrix}\mathbf{H}\\ \mathbf{H}\mathbf{F}\end{pmatrix} = \begin{pmatrix}1 & 0\\ 1 & \Delta t\end{pmatrix}$ has determinant $\Delta t \neq 0$, so $(\mathbf{F},\mathbf{H})$ is not merely detectable but fully **observable** — the state-space module's rank test, applied here directly. $\mathbf{Q}$ was shown in the stochastic-model lesson to have full rank (its determinant, $q^2\Delta t^4/12$, is strictly positive), so $\mathbf{G}_w$ can be taken square and invertible, making $(\mathbf{F},\mathbf{G}_w)$ controllable and therefore certainly stabilizable. A unique, globally-reached steady state is guaranteed before a single number is computed.

## The vector steady state, computed and confirmed

Solving the matrix Riccati fixed-point equation directly — rather than iterating it — is itself a standard numerical problem, solved by the same family of algorithms (Schur decomposition of a Hamiltonian-like matrix pencil) used for the optimal-control module's algebraic Riccati equation; `scipy.linalg.solve_discrete_are` implements it.

::: example Two wildly different starting guesses, one destination
Iterate the Riccati recursion sixty steps from three very different initial covariances — a near-perfect initial guess, $\mathbf{P}_0 = \operatorname{diag}(10^{-6}, 10^{-6})$; a nearly-uninformative one, $\mathbf{P}_0 = \operatorname{diag}(10^8, 10^8)$; and the module's usual $\operatorname{diag}(100, 25)$ — and compare each against the value `solve_discrete_are` returns directly:

| Starting $\mathbf{P}_0$ | $\mathbf{P}^-_{pp}$ after 60 steps | max entrywise gap to the direct solution |
| --- | --- | --- |
| $\operatorname{diag}(10^{-6}, 10^{-6})$ | $0.644904$ | $2.72\times10^{-4}$ |
| $\operatorname{diag}(10^8, 10^8)$ | $0.645596$ | $5.69\times10^{-4}$ |
| $\operatorname{diag}(100, 25)$ | $0.645578$ | $5.52\times10^{-4}$ |

All three land within six parts in ten thousand of the directly-solved

$$
\mathbf{P}_{ss} = \begin{pmatrix}0.645176 & 0.481932\\ 0.481932 & 0.694364\end{pmatrix},
$$

regardless of whether they started fourteen orders of magnitude apart. Extending the $\operatorname{diag}(100,25)$ run to $200$ steps closes the gap to $3.7\times10^{-13}$ — machine precision — confirming this is genuine convergence to a single, well-defined matrix, not three different runs that happen to look similar after a fixed number of steps.
:::

```python
import numpy as np
from scipy.linalg import solve_discrete_are

dt, q = 0.1, 0.5
F = np.array([[1.0, dt], [0.0, 1.0]])
Q = q * np.array([[dt**3/3, dt**2/2], [dt**2/2, dt]])
H = np.array([[1.0, 0.0]]); R = np.array([[4.0]])

P_ss = solve_discrete_are(F.T, H.T, Q, R)   # A'XA - X - A'XH(R+H'XH)^-1H'XA + Q = 0, A = F.T
print(P_ss)
# [[0.64517587 0.48193235]
#  [0.48193235 0.69436351]]
```

## How fast, really — and what the eigenvalues are

The steady-state gain is $\mathbf{K}_{ss} = \mathbf{P}_{ss}\mathbf{H}^{\mathsf{T}}\mathbf{S}_{ss}^{-1} = (0.138892,\ 0.103749)^{\mathsf{T}}$, and it defines a matrix worth naming: $\mathbf{A}_{cl} = (\mathbf{I} - \mathbf{K}_{ss}\mathbf{H})\mathbf{F}$, the map that carries the *a posteriori* estimation error $\mathbf{e}_{k-1}^+$ forward to $\mathbf{e}_k^+$ once the filter has settled onto a fixed gain, ignoring the noise inputs that keep perturbing it. This is precisely the state-space module's Luenberger observer error-dynamics matrix, $\mathbf{A} - \mathbf{L}\mathbf{C}$, with the gain no longer placed by hand but set to $\mathbf{K}_{ss}$ — a steady-state Kalman filter *is* a Luenberger observer, the specific one whose gain minimises steady-state error covariance rather than one chosen by pole placement. Its eigenvalues here are a complex-conjugate pair, $0.92537 \pm 0.06932i$, both of magnitude $0.92796$ — safely inside the unit circle, confirming asymptotic stability exactly as the state-space module's stability test requires.

That magnitude also answers the "how fast" question the last lesson deferred, and it delivers a genuine surprise: $0.92796$ is close to $1$, meaning slow convergence, and the covariance sequence's own decay rate — by the same squaring relationship the scalar case proved exactly — should run near $0.92796^2 = 0.86111$ per step once transients settle. Measuring the actual ratio between successive gaps to the steady state confirms it, though not smoothly: because the eigenvalues are complex rather than real, the error dynamics oscillate as they decay, so any single-step ratio wanders — as low as $0.78$, as high as $0.99$, depending where in the oscillation it is measured. Averaged over a twenty-step window well past the initial transient, the wandering cancels: the mean per-step decay rate over steps $100$–$120$ comes out to $0.86067$, matching the predicted $0.86111$ to three decimal places.

::: warning A slowing sequence is not a converged one
Return to the number that opened this lesson: by step $4$, $P^-_{pp}$ had reached $2.224$, and the module's earlier lessons called that "visibly approaching a fixed point" without saying which one. The true fixed point is $0.6452$ — step four was still $1.58$ away from it, more than double the distance still to close, and closing that distance takes not a handful more steps but on the order of a hundred, precisely because the governing eigenvalue magnitude, $0.928$, is close enough to $1$ that each step only shaves off about $14\%$ of the remaining gap ($1 - 0.86111 \approx 0.139$). A sequence that is visibly decelerating is not evidence that it has nearly arrived; only a computed $\mathbf{P}_{ss}$, or an eigenvalue magnitude telling you how many steps a given tolerance requires, is evidence of that.
:::

## The payoff: a gain you can hardwire — once it has settled

The practical reason any of this is worth computing offline is that $\mathbf{K}_{ss}$ does not change, so a flight computer can skip the matrix inversion in $\mathbf{K}_k = \mathbf{P}_k^-\mathbf{H}^{\mathsf{T}}\mathbf{S}_k^{-1}$ every cycle and multiply the innovation by a stored constant instead. Whether that shortcut is safe to take from the very first cycle is a separate question, and the answer is a clean no.

::: example Hardwiring K_ss from the start costs accuracy exactly where the transient is largest
Run the descending-booster filter two ways over $200$ steps against the same simulated flight: the ordinary time-varying filter of the earlier lessons, and a second filter that uses the constant $\mathbf{K}_{ss}$ computed above from step $1$ onward, never touching $\mathbf{P}$ at all.

| Step | Time-varying $\hat{x}^+_p$ | Fixed-$\mathbf{K}_{ss}$ $\hat{x}^+_p$ | Difference |
| --- | --- | --- | --- |
| $1$ | $2491.55$ | $2408.09$ | $83.46$ |
| $5$ | $2466.33$ | $2427.54$ | $38.79$ |
| $10$ | $2430.36$ | $2428.81$ | $1.55$ |
| $20$ | $2362.06$ | $2382.96$ | $-20.90$ |
| $50$ | $2149.42$ | $2150.00$ | $-0.57$ |
| $100$ | $1788.39$ | $1788.43$ | $-0.03$ |
| $200$ | $1045.443$ | $1045.443$ | $-0.00005$ |

At step $1$ the fixed-gain filter is $83\,\mathrm{m}$ away from the time-varying one — because $\mathbf{K}_{ss}$ assumes the settled trust ratio of a mature filter, and applying it to the initial $\mathbf{P}_0 = \operatorname{diag}(100,25)$, a hundred times more uncertain than steady state, badly under-corrects the first several measurements. By step $10$ the gap is already down to $1.5\,\mathrm{m}$; by step $100$, $3\,\mathrm{cm}$; by step $200$ the two filters agree to within a tenth of a millimetre, and their steady-state RMS position errors over the last hundred steps — $0.603\,\mathrm{m}$ for the time-varying filter, $0.605\,\mathrm{m}$ for the fixed-gain one — are indistinguishable in practice. The standard operational pattern follows directly: run the full time-varying filter through acquisition, until $\mathbf{P}_k^-$ has visibly converged (checked against the precomputed $\mathbf{P}_{ss}$, not against how flat the last few steps looked), and only then switch to the fixed steady-state gain for the remainder of the mission.
:::

## Check yourself

::: check
Explain why the negative root of $y^2 - Qy - QR = 0$ is discarded, and what it would mean if a physical filter somehow produced it.
:::

::: answer
$y$ represents a variance, so it must satisfy $y \geq 0$ by definition; the negative root of the quadratic is a mathematically valid solution of the *equation* but not of the *problem* the equation was built to model. If a computed covariance ever came out negative in a real implementation, it would not indicate that this root had somehow been reached — it would indicate that the arithmetic producing it (most likely the simplified, non-Joseph covariance update) had broken down, the subject the numerically-stable-forms lesson later in this module treats directly.
:::

::: check
A filter's dynamics include a mode that is exactly marginally stable (eigenvalue of $\mathbf{F}$ on the unit circle, as in the constant-velocity model) but that mode is never measured, directly or through correlation with anything that is. What does the detectability condition say about this filter's steady state, and why?
:::

::: answer
Detectability of $(\mathbf{F},\mathbf{H})$ requires every unstable-or-marginal mode to be observable; a marginally-stable mode with no path to any measurement, direct or through correlation, violates this, and the theorem's guarantee of a finite steady-state $\mathbf{P}_{ss}$ no longer applies. Concretely, that mode's covariance is governed purely by the predict step — a marginal eigenvalue neither shrinks nor is corrected by any update — so if $\mathbf{Q}$ injects any noise along it at all, its variance grows without bound as the recursion continues, and no fixed point exists. This is exactly the situation the next lesson studies directly, as a filter-design failure rather than a footnote to this one.
:::

::: check
Using the identity $(1-K_{ss})^2 = f'(P^-_{ss})$ from the scalar derivation, explain qualitatively why a sensor with a much larger $R$ produces a *slower*-converging filter, without recomputing any numbers.
:::

::: answer
$f'(P^-_{ss}) = R^2/(P^-_{ss}+R)^2$, and increasing $R$ pushes this ratio toward $1$ from below (as $R \to \infty$ relative to $P^-_{ss}$, the ratio $R/(P^-_{ss}+R) \to 1$), so $(1-K_{ss})^2 \to 1$ and the per-step shrinkage of the gap to steady state approaches zero — a noisier sensor makes the filter converge more slowly, which matches the trust-ratio picture directly: a large $R$ means a small $K_{ss}$, and a small $K_{ss}$ means the filter can only close a small fraction of any covariance error each cycle, whether that error is process noise accumulated between updates or leftover distance to the steady state itself.
:::

::: check
Why does using $\mathbf{K}_{ss}$ from the first measurement onward produce an estimate *worse* than the time-varying filter early on, rather than merely a different but equally good one?
:::

::: answer
$\mathbf{K}_{ss}$ is optimal only for the steady-state trust ratio $\mathbf{P}_{ss}$ relative to $\mathbf{R}$; the trust-ratio lesson showed the optimal gain depends on the actual $\mathbf{P}_k^-$ at that step, and at step $1$ the true $\mathbf{P}_1^-$ is far larger than $\mathbf{P}_{ss}$ (the filter genuinely knows much less than it eventually will). Applying the settled, smaller gain to that much larger uncertainty under-corrects: the estimate moves toward each early measurement by less than the optimal amount would, so the fixed-gain filter's early error is not merely different from the time-varying filter's, it is a documented consequence of using a gain built for a more confident filter than the one actually running yet.
:::

::: check
Sketch, without new computation, how the table comparing the time-varying and fixed-gain filters would change if $\mathbf{P}_0$ had instead been very close to $\mathbf{P}_{ss}$ to begin with.
:::

::: answer
If $\mathbf{P}_0 \approx \mathbf{P}_{ss}$, the time-varying filter's gain at step $1$ would already be close to $\mathbf{K}_{ss}$, since the gain is computed directly from $\mathbf{P}_1^- = \mathbf{F}\mathbf{P}_0\mathbf{F}^{\mathsf{T}}+\mathbf{Q}$, itself close to $\mathbf{F}\mathbf{P}_{ss}\mathbf{F}^{\mathsf{T}}+\mathbf{Q}$. The large early discrepancy seen in the worked example — tens of metres at steps $1$ and $5$ — would shrink to nearly nothing at every step, because there would be no large initial-uncertainty transient for the fixed-gain filter to under-correct; the two filters would track closely from the very first measurement, and hardwiring $\mathbf{K}_{ss}$ immediately would carry little of the cost demonstrated above.
:::

## Summary

| Item | Statement |
| --- | --- |
| Scalar steady state | $P^-_{ss} = (Q+\sqrt{Q^2+4QR})/2$, $P^+_{ss}=P^-_{ss}-Q$, $K_{ss}=P^-_{ss}/(P^-_{ss}+R)$ — a fully derived closed form |
| Scalar convergence | $f(y)=Q+yR/(y+R)$ is increasing and concave, so iteration from any $y_0\geq0$ converges monotonically to $P^-_{ss}$; rate $= f'(P^-_{ss}) = (1-K_{ss})^2$ |
| Matrix convergence conditions | $(\mathbf{F},\mathbf{H})$ detectable and $(\mathbf{F},\mathbf{G}_w)$ stabilizable (with $\mathbf{Q}=\mathbf{G}_w\mathbf{G}_w^{\mathsf{T}}$) guarantee a unique $\mathbf{P}_{ss}\succeq\mathbf{0}$ reached from any $\mathbf{P}_0\succeq\mathbf{0}$ |
| Solving directly | `scipy.linalg.solve_discrete_are(F.T, H.T, Q, R)`, matching iteration to machine precision |
| Luenberger connection | $\mathbf{A}_{cl}=(\mathbf{I}-\mathbf{K}_{ss}\mathbf{H})\mathbf{F}$ is exactly the state-space module's observer error-dynamics matrix; its eigenvalue magnitudes set the convergence rate (approximately their square) and must lie inside the unit circle |
| Practical use | Precompute $\mathbf{K}_{ss}$ once; run the full time-varying filter through acquisition, switch to the fixed gain only after $\mathbf{P}_k^-$ has genuinely converged |

Convergence, in this lesson, was guaranteed by the model being fully observable. The next lesson studies what happens on the other side of that assumption — when a state genuinely cannot be seen, in whole or in part — and shows precisely what the covariance and the gain do instead of settling.
