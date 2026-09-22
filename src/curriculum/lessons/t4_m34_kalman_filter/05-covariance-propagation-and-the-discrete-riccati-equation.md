---
id: l05-covariance-propagation-and-the-discrete-riccati-equation
title: Covariance propagation and the discrete Riccati equation
minutes: 14
covers:
  - Covariance propagation and the discrete Riccati equation
---

Look back at the predict and update steps and notice something the last two lessons used constantly but never named: the state estimate $\hat{\mathbf{x}}_k$ needs the measurement $\mathbf{z}_k$ at every step, but the covariance $\mathbf{P}_k$ never reads its *value* — only its existence, through $\mathbf{H}$ and $\mathbf{R}$, which are fixed properties of the sensor, not numbers that come off it each cycle. That asymmetry has a sharp consequence: chain the predict and update covariance formulas together and you get a recursion in $\mathbf{P}$ alone, computable in full before a single measurement is taken. This lesson writes that recursion down, names it — it is a **discrete matrix Riccati equation** — and shows exactly what having it buys you.

The result is more than a algebraic convenience. It is why a flight computer can carry a precomputed gain table instead of inverting a matrix in real time, why two engineers can argue productively about a filter's expected performance before it has flown a single measurement, and why the next lesson can ask a question — what happens if this recursion runs forever? — that would make no sense if $\mathbf{P}_k$ depended on which random numbers the sensor happened to produce.

## Covariance propagation between measurements

Start with the simpler case: no updates at all, only $N$ predict steps in a row, coasting on the dynamics alone — a filter with a missed measurement, an occulted GPS fix, or the multi-second gap between star-tracker readings the first lesson's gyro example described. Unroll the predict step,

$$
\mathbf{P}_1 = \mathbf{F}\mathbf{P}_0\mathbf{F}^{\mathsf{T}} + \mathbf{Q}, \qquad
\mathbf{P}_2 = \mathbf{F}\mathbf{P}_1\mathbf{F}^{\mathsf{T}} + \mathbf{Q} = \mathbf{F}^2\mathbf{P}_0(\mathbf{F}^2)^{\mathsf{T}} + \mathbf{F}\mathbf{Q}\mathbf{F}^{\mathsf{T}} + \mathbf{Q},
$$

and the pattern that emerges by induction is a finite sum:

::: key N-step covariance propagation with no updates
$$
\mathbf{P}_N = \mathbf{F}^N\mathbf{P}_0(\mathbf{F}^N)^{\mathsf{T}} + \sum_{j=0}^{N-1}\mathbf{F}^j\mathbf{Q}(\mathbf{F}^j)^{\mathsf{T}}.
$$
The first term is the probability module's rule for propagating a covariance through a linear map, applied to the $N$-step transition $\mathbf{F}^N$; the sum is every step's process noise, itself propagated forward through however many remaining steps separate it from step $N$.
:::

::: example A five-step coast, two ways
Continue the descending-booster model: $\mathbf{F} = \begin{pmatrix}1 & 0.1\\0&1\end{pmatrix}$, $\mathbf{Q} = \begin{pmatrix}1.667\times10^{-4} & 2.5\times10^{-3}\\ 2.5\times10^{-3} & 0.05\end{pmatrix}$, starting from $\mathbf{P}_0 = \operatorname{diag}(100, 25)$. Iterating the predict step five times gives

$$
\mathbf{P}_5 = \begin{pmatrix}106.271 & 12.563\\ 12.563 & 25.250\end{pmatrix}.
$$

Evaluating the closed form directly — $\mathbf{F}^5\mathbf{P}_0(\mathbf{F}^5)^{\mathsf{T}}$ plus the five-term sum $\sum_{j=0}^{4}\mathbf{F}^j\mathbf{Q}(\mathbf{F}^j)^{\mathsf{T}}$ — gives the identical matrix to within $3\times10^{-14}$, floating-point round-off. This is the same fact the first lesson noticed in passing (a hundred $0.1\,\mathrm{s}$ steps compose into one $10\,\mathrm{s}$ step) written as a general rule for *any* linear model, not only the constant-velocity one where the composed sum happens to have a clean closed form of its own.
:::

## Two steps, one recursion

Now put the update back in. Substitute the update step's collapsed covariance formula, $\mathbf{P}_k^+ = \mathbf{P}_k^- - \mathbf{P}_k^-\mathbf{H}^{\mathsf{T}}(\mathbf{H}\mathbf{P}_k^-\mathbf{H}^{\mathsf{T}}+\mathbf{R})^{-1}\mathbf{H}\mathbf{P}_k^-$, directly into the predict step that produces $\mathbf{P}_{k+1}^-$ from it:

::: key The discrete-time Riccati equation
$$
\mathbf{P}_{k+1}^- = \mathbf{F}\Big(\mathbf{P}_k^- - \mathbf{P}_k^-\mathbf{H}^{\mathsf{T}}\big(\mathbf{H}\mathbf{P}_k^-\mathbf{H}^{\mathsf{T}} + \mathbf{R}\big)^{-1}\mathbf{H}\mathbf{P}_k^-\Big)\mathbf{F}^{\mathsf{T}} + \mathbf{Q}.
$$
One step of this equation is exactly one update followed by one predict, with the intermediate $\mathbf{P}_k^+$ eliminated. It maps a covariance to the next one, using only $\mathbf{F}, \mathbf{H}, \mathbf{Q}, \mathbf{R}$ — never $\mathbf{z}$.
:::

The name comes from its shape: a linear term in $\mathbf{P}_k^-$ (inside the parentheses, before the congruence by $\mathbf{F}$), a term *quadratic* in $\mathbf{P}_k^-$ (the subtracted piece, which has $\mathbf{P}_k^-$ appearing twice), and a constant offset $\mathbf{Q}$ — the matrix generalization of a scalar Riccati differential equation, $\dot{p} = a p + b p^2 + c$. The same shape, with different matrices in the quadratic term, is what the optimal-control module's Riccati equation for LQR looks like; that is not a coincidence this lesson needs in order to be complete, only a fact worth having in your pocket if you have studied both: the two equations are duals of each other, related by swapping $\mathbf{F} \leftrightarrow \mathbf{F}^{\mathsf{T}}$, $\mathbf{H} \leftrightarrow \mathbf{H}^{\mathsf{T}}$ (playing the role of the input matrix $\mathbf{B}$) and exchanging which of $\mathbf{Q}$, $\mathbf{R}$ weights the state and which weights the correction. Filtering and optimal control are, structurally, the same problem run in opposite directions — estimation looks backward from data to state, control looks forward from state to action — and the identical equation governing both is the cleanest evidence of it.

Nothing about this equation refers to $\hat{\mathbf{x}}$ or $\mathbf{z}$. That is the entire point of writing it down on its own: $\{\mathbf{P}_k^-\}_{k=1}^{\infty}$ is a fixed sequence of matrices, determined completely by $\mathbf{F}, \mathbf{Q}, \mathbf{H}, \mathbf{R}$ and the initial $\mathbf{P}_0$, and so is the resulting gain sequence $\{\mathbf{K}_k\}$, since $\mathbf{K}_k$ is built from $\mathbf{P}_k^-$ alone. Two vehicles carrying an identical model but flying through completely different measurement histories will carry the identical sequence of gains.

::: example The gain sequence does not know what you are about to measure
Run the descending-booster filter twice, from the identical $\mathbf{P}_0^+ = \operatorname{diag}(100, 25)$, with two unrelated random seeds driving two completely different simulated flights and two completely different sets of noisy altimeter readings. Compare the two runs after four steps:

| Quantity | Seed 1 | Seed 2 |
| --- | --- | --- |
| $\hat{x}_4^+$ (position) | differs run to run | differs run to run |
| $\mathbf{K}_4$ | $(0.35735,\ 0.72104)^{\mathsf{T}}$ | $(0.35735,\ 0.72104)^{\mathsf{T}}$ |
| $\operatorname{diag}(\mathbf{P}_4^-)$ | $(2.22427,\ 22.2070)$ | $(2.22427,\ 22.2070)$ |

The state estimates diverge from the first measurement onward, exactly as they must — different data must give different answers. The gain and the predicted covariance agree to every printed digit, and running the comparison out to full double-precision shows the maximum difference over six steps is exactly $0.0$, not merely small: the two sequences are computing the identical numbers by identical arithmetic, because neither the Riccati recursion nor the gain formula built from it ever looks at $\mathbf{z}$. This is exactly why the exact figures reported for $\mathbf{P}_k^-$ and $\mathbf{K}_k$ in the last two lessons' worked examples could be quoted as *the* answer for that model, rather than as one sample among many — they are not samples.
:::

```python
import numpy as np

def riccati_step(P_minus, F, Q, H, R):
    """P_k- -> P_{k+1}-: one update followed by one predict, collapsed."""
    S = H @ P_minus @ H.T + R
    K = P_minus @ H.T @ np.linalg.inv(S)
    P_plus = P_minus - K @ H @ P_minus
    return F @ P_plus @ F.T + Q

dt, q = 0.1, 0.5
F = np.array([[1.0, dt], [0.0, 1.0]])
Q = q * np.array([[dt**3/3, dt**2/2], [dt**2/2, dt]])
H = np.array([[1.0, 0.0]]); R = np.array([[4.0]])

P = F @ np.diag([100.0, 25.0]) @ F.T + Q       # P_1-
for k in range(1, 5):
    print(f"P_{k}- diag = {np.diag(P).round(4).tolist()}")
    P = riccati_step(P, F, Q, H, R)
# P_1- diag = [100.2502, 25.05]
# P_2- diag = [4.1158, 25.0399]
# P_3- diag = [2.5268, 24.2586]
# P_4- diag = [2.2243, 22.207]
```

## What the data-independence buys you

Three consequences follow directly, and each is a piece of ordinary GNC practice rather than a mathematical curiosity. First, a **precomputed gain schedule**: solve the Riccati recursion once, offline, for as many steps as the mission needs, store $\mathbf{K}_1, \mathbf{K}_2, \ldots$ as a table, and the flight software looks up a gain instead of inverting $\mathbf{S}_k$ every cycle — valuable on a flight computer where a matrix inverse is expensive or where the inverse itself is a source of numerical risk the numerically-stable-forms lesson later in this module treats directly. Second, **pre-flight performance prediction**: because $\mathbf{P}_k^-$ is known in advance, so is the filter's expected accuracy at every point in the mission, which is how a navigation error budget gets built and defended before a vehicle ever flies — a covariance analysis run entirely on paper (or, more precisely, entirely in a script) against the planned sensor suite and trajectory. Third, and the subject of the next lesson: since the sequence $\mathbf{P}_1^-, \mathbf{P}_2^-, \ldots$ is completely determined, it is meaningful to ask what it *converges to*, and whether it converges at all — a question about one fixed recursion, not about an ensemble of random outcomes.

::: warning Data-independence is a property of P, not of the filter's correctness
$\mathbf{P}_k^-$ ignoring $\mathbf{z}_k$ is a mathematical fact about the linear-Gaussian model, not a guarantee that the reported $\mathbf{P}_k^-$ is *right*. A filter running with a wrong $\mathbf{Q}$ or $\mathbf{R}$ still produces a perfectly well-defined, perfectly data-independent sequence of covariances — it is still the wrong sequence, computed with complete internal consistency from the wrong assumptions. Precomputing a gain table offline only ever tells you what the filter will *believe*; whether belief matches reality is exactly what the consistency-testing lesson later in this module exists to check, and it needs real data to do it.
:::

## Check yourself

::: check
Explain, without further calculation, why $\mathbf{P}_k^-$ can be computed in full before a mission flies, while $\hat{\mathbf{x}}_k^-$ cannot.
:::

::: answer
$\mathbf{P}_k^-$ is produced entirely by the Riccati recursion, whose inputs are $\mathbf{F}, \mathbf{Q}, \mathbf{H}, \mathbf{R}$ and $\mathbf{P}_0$ — properties of the model and the sensors, all fixed and known ahead of flight. $\hat{\mathbf{x}}_k^-$ additionally requires every innovation $\boldsymbol{\nu}_1,\ldots,\boldsymbol{\nu}_{k-1}$, and an innovation is $\mathbf{z} - \mathbf{H}\hat{\mathbf{x}}^-$, which needs the actual measurement $\mathbf{z}$ — a number that does not exist until the sensor produces it in flight. The covariance recursion and the mean recursion share the same gain $\mathbf{K}_k$, but only the mean recursion consumes data.
:::

::: check
A filter's $\mathbf{Q}$ is discovered, post-flight, to have been off by a factor of two from the true process noise. What happens to the precomputed $\mathbf{P}_k^-$ table, and what does not happen to it?
:::

::: answer
The precomputed table is unaffected in the sense that matters here: it still reports, exactly, what the Riccati recursion produces for the $\mathbf{Q}$ that was used to compute it — the recursion is deterministic given its inputs, and a wrong input does not break that determinism. What breaks is the correspondence between the table and reality: the true error covariance of the state estimate is no longer described by the table, because the table was never a measurement of the filter's actual performance, only a forward calculation from assumed statistics. This is precisely the gap the process-noise-tuning lesson and the consistency-testing lesson later in this module are built to close.
:::

::: check
Derive the two-step covariance propagation formula, $\mathbf{P}_2 = \mathbf{F}^2\mathbf{P}_0(\mathbf{F}^2)^{\mathsf{T}} + \mathbf{F}\mathbf{Q}\mathbf{F}^{\mathsf{T}} + \mathbf{Q}$, from the one-step predict formula, and identify which term corresponds to noise injected at step $1$ versus step $2$.
:::

::: answer
Apply the predict step twice: $\mathbf{P}_1 = \mathbf{F}\mathbf{P}_0\mathbf{F}^{\mathsf{T}} + \mathbf{Q}$, then $\mathbf{P}_2 = \mathbf{F}\mathbf{P}_1\mathbf{F}^{\mathsf{T}} + \mathbf{Q} = \mathbf{F}(\mathbf{F}\mathbf{P}_0\mathbf{F}^{\mathsf{T}} + \mathbf{Q})\mathbf{F}^{\mathsf{T}} + \mathbf{Q} = \mathbf{F}^2\mathbf{P}_0(\mathbf{F}^2)^{\mathsf{T}} + \mathbf{F}\mathbf{Q}\mathbf{F}^{\mathsf{T}} + \mathbf{Q}$. The last term, plain $\mathbf{Q}$, is the noise injected during the second step, which has had no time to propagate through any further dynamics. The middle term, $\mathbf{F}\mathbf{Q}\mathbf{F}^{\mathsf{T}}$, is the noise injected during the *first* step, carried forward through one more application of $\mathbf{F}$ — older process noise has had more opportunity to spread through the state, which is exactly the pattern the general $N$-step sum generalizes.
:::

::: check
Two different sensors, with different $\mathbf{H}$ and $\mathbf{R}$, are proposed for the same vehicle and the same dynamics model. Without running either filter against real data, how would you compare them, and what would the comparison not tell you?
:::

::: answer
Run the Riccati recursion for each candidate $(\mathbf{H}, \mathbf{R})$ against the same $\mathbf{F}, \mathbf{Q}, \mathbf{P}_0$ and compare the resulting $\mathbf{P}_k^-$ sequences — smaller covariance (in trace, or along whichever state direction matters operationally) marks the better sensor suite for this model, and the comparison needs no flight data or simulation of measurement noise realizations at all, only the recursion. What it cannot tell you is whether either sensor will actually perform as its $\mathbf{R}$ claims, whether $\mathbf{Q}$ correctly captures the true unmodelled dynamics, or whether the geometry stays observable throughout the mission — all questions about whether the model matches reality, which a covariance-only analysis assumes rather than tests.
:::

## Summary

| Item | Statement |
| --- | --- |
| Coasting propagation | $\mathbf{P}_N = \mathbf{F}^N\mathbf{P}_0(\mathbf{F}^N)^{\mathsf{T}} + \sum_{j=0}^{N-1}\mathbf{F}^j\mathbf{Q}(\mathbf{F}^j)^{\mathsf{T}}$, no updates |
| Discrete Riccati equation | $\mathbf{P}_{k+1}^- = \mathbf{F}\big(\mathbf{P}_k^- - \mathbf{P}_k^-\mathbf{H}^{\mathsf{T}}(\mathbf{H}\mathbf{P}_k^-\mathbf{H}^{\mathsf{T}}+\mathbf{R})^{-1}\mathbf{H}\mathbf{P}_k^-\big)\mathbf{F}^{\mathsf{T}} + \mathbf{Q}$ — update and predict, collapsed into one map on $\mathbf{P}_k^-$ |
| Data independence | $\mathbf{P}_k^-$ and $\mathbf{K}_k$ depend only on $\mathbf{F}, \mathbf{Q}, \mathbf{H}, \mathbf{R}, \mathbf{P}_0$ — never on $\mathbf{z}$; two runs with different measurement histories carry identical covariance and gain sequences |
| Practical uses | Precomputed gain tables; pre-flight covariance analysis and error budgets; asking whether the sequence converges (next lesson) |
| Riccati duality | Same equation shape as the optimal-control module's LQR Riccati equation, with $\mathbf{F}\leftrightarrow\mathbf{F}^{\mathsf{T}}$, $\mathbf{H}\leftrightarrow\mathbf{B}^{\mathsf{T}}$ and the cost weights exchanged for $\mathbf{Q}$ and $\mathbf{R}$ |

Two things are worth carrying forward from the numbers above. Left alone, with no updates, the covariance only grows — the five-step coast climbed from $\operatorname{diag}(100,25)$ to a visibly larger matrix, and would keep climbing without bound the longer it coasted. Fed a steady stream of updates, the four-step Riccati run instead *fell*, sharply at first and then more slowly step to step — a deceleration worth questioning rather than trusting: does that slowdown mean the sequence is nearly where it will end up, or only that it is still falling, more gradually now? Answering that carefully is worth its own lesson, and it comes right after a detour through the one quantity treated as fixed scenery here — $\mathbf{Q}$ itself — and what happens when it is wrong.
