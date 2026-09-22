---
id: l08-observability-and-filter-convergence
title: Observability and filter convergence
minutes: 16
covers:
  - Observability and filter convergence
---

The steady-state lesson's convergence theorem leaned on one hypothesis without yet showing what happens when it fails: $(\mathbf{F}, \mathbf{H})$ must be detectable, and the running example satisfied this with room to spare — full observability, confirmed by a rank test that returned $2$ out of $2$. Most of this module's examples will not be so generous. A real navigation filter routinely carries states that a given sensor suite cannot fully see: a bias with no dedicated calibration measurement, an axis a sensor happens not to cover, a parameter that only becomes observable once the vehicle manoeuvres. This lesson is about what the covariance recursion does in exactly that situation, worked out precisely rather than asserted, because "the filter will handle it" is not an answer an unobservable direction ever rewards.

The state-space module's observability test is a statement about the *dynamics and the sensor*, evaluated before any covariance exists. This lesson connects that static, structural fact to the *covariance's* behaviour over time — and shows that the connection is exact, not approximate: an unobservable direction is not merely "hard to estimate," it is a direction the filter's own machinery, examined closely, can be shown never to touch.

## What the observability test tells a filter

Recall the state-space module's rank test: the pair $(\mathbf{F},\mathbf{H})$ is observable if the observability matrix $\mathcal{O} = \begin{pmatrix}\mathbf{H}\\ \mathbf{H}\mathbf{F}\\ \vdots \\ \mathbf{H}\mathbf{F}^{n-1}\end{pmatrix}$ has full column rank $n$. When it does not, its null space — every vector $\mathbf{v}$ with $\mathbf{H}\mathbf{F}^j\mathbf{v} = \mathbf{0}$ for $j = 0,\ldots,n-1$ — is the **unobservable subspace**: a set of directions in state space that no sequence of measurements, however long, could ever distinguish from zero. This subspace has a property worth naming because everything below depends on it: it is **$\mathbf{F}$-invariant**. If $\mathbf{v}$ is unobservable, so is $\mathbf{F}\mathbf{v}$ — the dynamics can move a state within the unobservable subspace, but can never carry it out into a direction the sensor would notice, and this is precisely why the subspace, once entered, is a trap a measurement cannot spring.

Translate that into what the Kalman gain does. $\mathbf{K}_k = \mathbf{P}_k^-\mathbf{H}^{\mathsf{T}}\mathbf{S}_k^{-1}$ has a nonzero row for a given state only if $\mathbf{H}^{\mathsf{T}}$, or the correlation $\mathbf{P}_k^-$ carries into it, is nonzero there. Along a direction with zero correlation to anything $\mathbf{H}$ can see, the update cannot act at all — not because it chooses not to, but because the formula has nothing to act on. What the last lesson called "detectability" as an abstract hypothesis, this lesson makes concrete: an unobservable direction is a direction the update step is structurally blind to, forever.

## The clean case: a direction fully decoupled from the sensor

Take the simplest instance first — a filter carrying two states, a directly-measured quantity $p$ and a bias $b$ with dynamics entirely independent of $p$, the kind of slowly-wandering nuisance parameter kept in a state vector for a sensor not yet brought online: $\mathbf{F} = \mathbf{I}$, $\mathbf{H} = (0\ \ 1)$ picking out $p$ only, with $b$ occupying the first state. The observability matrix is $\begin{pmatrix}0 & 1\\ 0 & 1\end{pmatrix}$, rank $1$ — $b$ is unobservable, and by inspection its null space is exactly the $b$-axis, $(1,0)^{\mathsf{T}}$.

::: example An unaided bias, exactly
Starting from $\mathbf{P}_0 = \operatorname{diag}(4, 4)$, with $Q_p = 0.3$ throughout, run the Riccati recursion for ten steps under two settings of $Q_b$:

| Step | $Q_b = 0$: $P_{bb}$ | $Q_b = 0$: $P_{bp}$ | $Q_b = 0.5$: $P_{bb}$ | $Q_b=0.5$: $P_{bp}$ |
| --- | --- | --- | --- | --- |
| $1$ | $4.000000$ | $0.00\times10^{0}$ | $4.500000$ | $0.00\times10^{0}$ |
| $2$ | $4.000000$ | $0.00\times10^{0}$ | $5.000000$ | $0.00\times10^{0}$ |
| $5$ | $4.000000$ | $0.00\times10^{0}$ | $6.500000$ | $0.00\times10^{0}$ |
| $10$ | $4.000000$ | $0.00\times10^{0}$ | $9.000000$ | $0.00\times10^{0}$ |

With $Q_b = 0$, $P_{bb}$ sits at exactly $4.000000$ for all ten steps — not approximately, to every digit computed — because $\mathbf{F} = \mathbf{I}$ never grows it, no update ever shrinks it (the cross term $P_{bp}$ never leaves zero, so $\mathbf{K}_b = P_{bp}/S$ is exactly zero at every step), and there is no process noise to add anything either. With $Q_b = 0.5$, $P_{bb}$ climbs $4.0, 4.5, 5.0, 5.5,\ldots$ — a difference of exactly $0.5$ every single step, ten steps running, with no sign of levelling off. This is the whole theorem, with nothing left to approximate: zero process noise on an unobservable direction leaves its covariance frozen forever; any process noise at all makes it climb by exactly that amount, step after step, without bound.
:::

## The realistic case: a sensor that only sees where you are going

Genuinely decoupled states are the exception; most unobservable directions in practice are coupled to something the sensor *can* see, and the coupling changes the story without changing the conclusion. Take the constant-velocity model with a Doppler-only sensor — $\mathbf{H} = (0\ \ 1)$, measuring velocity, never position, $R = 0.01\,\mathrm{(m/s)^2}$. The observability matrix is $\begin{pmatrix}0 & 1\\ 0 & 1\end{pmatrix}$ again (since $\mathbf{H}\mathbf{F} = (0\ \ 1)\begin{pmatrix}1&\Delta t\\0&1\end{pmatrix} = (0\ \ 1)$, identical to $\mathbf{H}$), rank $1$: position is unobservable, and its null-space direction is $(1,0)^{\mathsf{T}}$ — pure position, zero velocity — exactly as inspection suggests.

::: example Dead reckoning, derived rather than assumed
Iterate the Riccati recursion from $\mathbf{P}_0 = \operatorname{diag}(4,4)$ for $300$ steps:

| Step | $P_{pp}$ | $P_{pv}$ | $P_{vv}$ |
| --- | --- | --- | --- |
| $1$ | $4.00027$ | $0.00350$ | $0.059975$ |
| $10$ | $4.00158$ | $0.00393$ | $0.058541$ |
| $100$ | $4.01433$ | $0.00393$ | $0.058541$ |
| $300$ | $4.04281$ | $0.00393$ | $0.058541$ |

$P_{vv}$, the directly-measured state, settles quickly to $0.058541$ — this is an ordinary steady-state Kalman filter for velocity alone. $P_{pp}$ never stops climbing: by step $300$ it has grown from $4.0$ to $4.043$, and the per-step increase, measured at steps $50$, $100$, $200$ and $299$, is the identical $0.0001417$ every time — a perfectly linear, unbounded drift, the covariance equivalent of dead reckoning: without a direct fix, position uncertainty accumulates step after step no matter how long the filter runs, because velocity is the only quantity being corrected and position is only ever inferred by integrating it forward. Position is *not* fully cut off from the correction, though — the small but nonzero correlation $P_{pv} = 0.00393$, built by the coupling in $\mathbf{F}$, gives the update a tiny amount of leverage on position after all, which is exactly why the growth rate, $0.0001417$ per step, comes out a little *below* $Q_{pp}$ alone ($q\,\Delta t^3/3 = 1.667\times10^{-4}$): correlation with the observed state buys partial, incomplete mitigation, never a cure. Position is formally unobservable in the strict rank sense, and it still climbs without bound — the two facts are entirely consistent, because "unobservable" is about what a sequence of measurements can ever pin down exactly, not about whether nearby states leak it any information at all.

The eigenvectors of $\mathbf{P}$ confirm which direction is responsible. At step $60$, $\mathbf{P}$'s eigenvalues are $0.0585$ and $4.0087$; the eigenvector belonging to the large, still-growing eigenvalue is $(-0.999999,\ -0.000994)^{\mathsf{T}}$ — indistinguishable, to three decimal places, from the pure-position direction $(1,0)^{\mathsf{T}}$ the observability matrix's null space predicted before a single covariance number was computed. The direction the filter cannot correct and the direction its uncertainty piles up in are, numerically, the same direction.
:::

```python
import numpy as np

dt, q = 0.1, 0.5
F = np.array([[1.0, dt], [0.0, 1.0]])
Q = q * np.array([[dt**3/3, dt**2/2], [dt**2/2, dt]])
H = np.array([[0.0, 1.0]])   # velocity only
R = np.array([[0.01]])

Obs = np.vstack([H, H @ F])
print("rank:", np.linalg.matrix_rank(Obs))   # 1: position unobservable

P = np.diag([4.0, 4.0])
for k in range(1, 301):
    S = H @ P @ H.T + R
    K = P @ H.T @ np.linalg.inv(S)
    P = F @ (P - K @ H @ P) @ F.T + Q
w, v = np.linalg.eigh(P)
print(w, v[:, np.argmax(w)])
# [0.05853712 4.00867153] [-0.9999995  -0.00099416]
```

::: warning Unobservable is not the same as unstable
The two examples above both had an unobservable direction whose own dynamics were, at best, neutral — a random walk, or a state fed only by an integrated velocity that is itself only ever approximately known. If the unobservable direction is instead genuinely *contractive* — recall the mean-reverting gyro-bias exception from the predict-and-update lesson — its covariance does not climb even without any measurement help; it settles to its own stationary spread and never improves beyond that, forever uncorrected but also never unbounded. Unobservable only forces unbounded growth when the unobservable subspace is also unstable or marginal; the steady-state lesson's detectability hypothesis was exactly the requirement that this combination never occurs.
:::

## Detectability, understood rather than cited

The last lesson stated detectability of $(\mathbf{F},\mathbf{H})$ as a hypothesis for a bounded steady state to exist, and promised this lesson would make it concrete. It now can be, in one sentence: an unstable-or-marginal, unobservable direction is exactly a direction whose covariance the Riccati recursion has no mechanism to bound, because the update term is structurally zero there and the predict term, along an unstable or neutral eigenvalue, does not shrink it either. Detectability is the precise condition ruling this combination out — it permits an unobservable direction to exist (as both examples above show, quite ordinarily) but requires that any such direction be dynamically stable on its own, so that the absence of correction is survivable rather than fatal.

This is also, in practice, the single most common real cause of the "confidently wrong" filter this module has returned to since the process-noise lesson: not always a badly tuned $\mathbf{Q}$, but a $\mathbf{Q}$ tuned reasonably for a state that the sensor suite, as configured, cannot see at all — the covariance grows exactly as designed, and if nothing downstream checks it against the observability structure of the actual sensor set, the growth can go unnoticed for a very long time. Two of the divergence causes this module studies next — an unobservable direction driven by nonzero $\mathbf{Q}$, and the general remedy of augmenting or removing a state rather than trusting $\mathbf{Q}$ to cover for it — are this lesson's content, one step further down the line.

## Check yourself

::: check
A filter's observability matrix has rank $n-1$ for an $n$-state model. What, precisely, does this rank deficiency say about the filter's covariance, and what does it not say?
:::

::: answer
It says there is a one-dimensional, $\mathbf{F}$-invariant subspace — the null space of the observability matrix — along which no sequence of measurements can ever provide correction; the covariance's component in that direction is governed purely by $\mathbf{F}$ and $\mathbf{Q}$, forever. It does not, by itself, say whether that component grows, shrinks, or stays fixed: that depends on whether $\mathbf{F}$ restricted to the unobservable subspace is stable, marginal, or unstable, and on whether $\mathbf{Q}$ injects any noise along it at all. Rank deficiency identifies *where* the filter cannot help itself; it does not say how badly that will hurt.
:::

::: check
In the Doppler-only example, why is $\mathbf{H}\mathbf{F}$ exactly equal to $\mathbf{H}$, and why does that make finding the unobservable direction by inspection easy?
:::

::: answer
$\mathbf{H}\mathbf{F} = (0\ \ 1)\begin{pmatrix}1 & \Delta t\\0&1\end{pmatrix} = (0\cdot1 + 1\cdot0,\ \ 0\cdot\Delta t + 1\cdot1) = (0\ \ 1) = \mathbf{H}$, because the velocity row of $\mathbf{F}$ is itself $(0\ \ 1)$ — velocity in a constant-velocity model does not depend on position at all, so measuring velocity after one step of dynamics tells you nothing beyond what measuring it immediately already told you. With $\mathbf{H}\mathbf{F}=\mathbf{H}$, the observability matrix's two rows are identical, so its null space is exactly the null space of $\mathbf{H}$ alone: every vector $(v_p, 0)^{\mathsf{T}}$, i.e. pure position, found without needing to compute a single matrix product.
:::

::: check
Explain why the correlation $P_{pv}$ in the Doppler-only example stops growing (settles at $0.00393$) even while $P_{pp}$ keeps climbing forever.
:::

::: answer
$P_{pv}$ is jointly shaped by the predict step, which mixes in a contribution from the now-settled $P_{vv}$ through $\mathbf{F}$, and the update step, which *does* touch $P_{pv}$ directly, since $\mathbf{H}$ measures velocity and the gain's velocity row is nonzero — the cross-covariance is corrected every cycle even though the pure-position variance is not. Once $P_{vv}$ has reached its own steady state (velocity being fully observable on its own), the predict-step contribution to $P_{pv}$ becomes constant, and the update-step correction to $P_{pv}$ settles to match it, producing a fixed point for $P_{pv}$ specifically — while $P_{pp}$, whose only correction channel is the small, fixed leverage $P_{pv}$ provides, keeps receiving slightly more from the predict step (through $\mathbf{F}$ and $Q_{pp}$) than that fixed leverage can remove, and so climbs without limit.
:::

::: check
A colleague proposes "fixing" the unaided-bias example by setting $Q_b = 0$ once the filter has run for a while, reasoning that the bias is "close enough" and further growth should stop. Evaluate this reasoning.
:::

::: answer
Setting $Q_b=0$ does stop $P_{bb}$ from growing further from that point on — the table above showed $Q_b=0$ holds $P_{bb}$ exactly fixed — but it does nothing to correct whatever bias error the filter is currently carrying, since $b$ is unobservable and no update has ever touched it, with $Q_b=0$ or otherwise. The proposal freezes the filter's uncertainty *report* at whatever level it happened to reach, without freezing, reducing, or even measuring the actual error; if the true bias has drifted further than the filter's frozen $P_{bb}$ admits, the filter is now confidently wrong in exactly the sense the process-noise-tuning lesson demonstrated, and no amount of further running will fix it, because the underlying problem — no measurement reaches this state — was never about $Q_b$ to begin with.
:::

::: check
Would adding a second, independent sensor that also measures only velocity change any conclusion of the Doppler-only example?
:::

::: answer
No. Observability is a property of $\mathbf{H}$'s *row space* relative to $\mathbf{F}$, not of how many rows $\mathbf{H}$ has: a second velocity-only row adds another equation of the exact same form, $(0\ \ 1)\mathbf{x}$, contributing nothing new to the observability matrix's rank, which stays at $1$. Two Doppler sensors would shrink $R$'s effective contribution and so shrink $P_{vv}$ faster and further, but position would remain exactly as unobservable as with one, and $P_{pp}$ would still grow without bound at very nearly the same rate, since that rate is governed by how well-known velocity's *correlation* with position is, not by how many independent looks at velocity alone the filter gets.
:::

## Summary

| Item | Statement |
| --- | --- |
| Unobservable subspace | Null space of $\mathcal{O}=(\mathbf{H};\mathbf{H}\mathbf{F};\ldots;\mathbf{H}\mathbf{F}^{n-1})$; $\mathbf{F}$-invariant, so the dynamics can never carry it into view |
| Update along that subspace | Structurally zero: $\mathbf{K}_k$ has no leverage where $\mathbf{P}_k^-$ carries no correlation with what $\mathbf{H}$ sees |
| Decoupled, $Q=0$ | Covariance frozen exactly at its initial value forever |
| Decoupled, $Q>0$ | Covariance grows by exactly $Q$ every step, unbounded and linear |
| Coupled (realistic) case | An unobserved but correlated state still grows unboundedly, at a rate reduced — not eliminated — by the correlation; the dominant eigenvector of $\mathbf{P}$ aligns with the observability-matrix null space |
| Detectability, concretely | Unbounded-covariance failure requires an unobservable direction that is *also* unstable or marginal; a stable unobservable direction settles at its own bounded stationary spread instead |

An unobservable direction with nonzero process noise is now a fully worked-out failure mode: predictable, exact in the clean case, and numerically confirmed in the coupled one. It is also only one of several ways a filter's covariance can stop matching reality. The next three lessons take up the rest of the toolkit in turn — numerically stable arithmetic, the other causes of divergence, and the statistical tests that catch all of them, including this one, from data alone.
