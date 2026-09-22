---
id: l11-model-reduction-balanced-truncation
title: Model reduction — balanced truncation and Hankel singular values
minutes: 21
covers:
  - "Model reduction: balanced truncation and Hankel singular values"
---

The models that arrive on a real programme are large. A finite-element model of a launch vehicle produces bending modes by the hundred; a spacecraft with two deployed arrays, an antenna boom and a slosh model can run to fifty states before anyone has added an actuator; a detailed thrust-vector-control actuator model brings a dozen more. You cannot design a controller on all of them, and even if you could, you would not want to fly the result: an observer is the same order as the model it is built on, and a fifty-state observer is fifty states of flight software to verify, to initialise, to check for numerical drift, and to defend in a review.

So you reduce. The question is which states to throw away, and the tempting answer — keep the low-frequency modes, discard the high-frequency ones — is wrong often enough to be dangerous. A mode's frequency says nothing about how strongly the actuator excites it or how clearly the sensor sees it. The mode that matters is the one the input can reach *and* the output can see, and this module already has the tools to measure both.

**Balanced truncation** is the answer built from those tools. Find the coordinates in which the controllability and observability Gramians are equal and diagonal, read off the diagonal — the Hankel singular values — and delete the states whose entries are small, because those are simultaneously hard to reach and hard to observe. The method comes with an error bound you can quote before you compute the reduced model, and it preserves stability.

## Frequency is the wrong criterion

::: example Three bending modes, and the one you would have kept
Take a flexible appendage driven by a bus torque and sensed at its tip, modelled as three damped modes in the real modal form of Lesson 1. Each mode contributes a $2\times2$ block $\begin{pmatrix}0&1\\-\omega_i^2&-2\zeta_i\omega_i\end{pmatrix}$ with input coefficient $\phi_i$ and output coefficient $\psi_i$:

| mode | frequency | $\zeta$ | $\phi$ | $\psi$ | peak $\lvert G\rvert$ at resonance |
| --- | --- | --- | --- | --- | --- |
| 1 | $0.35\,\mathrm{Hz}$ ($2.199\,\mathrm{rad/s}$) | $0.005$ | $1.00$ | $1.00$ | $20.68$ |
| 2 | $1.80\,\mathrm{Hz}$ ($11.310\,\mathrm{rad/s}$) | $0.008$ | $0.10$ | $0.08$ | $0.00391$ |
| 3 | $4.60\,\mathrm{Hz}$ ($28.903\,\mathrm{rad/s}$) | $0.012$ | $0.50$ | $0.40$ | $0.00998$ |

The resonant peak of a lightly damped mode is $\phi_i\psi_i/(2\zeta_i\omega_i^2)$, which is where the last column comes from. Mode 1 dominates by three orders of magnitude, as expected. But mode 2 — the *lower* frequency of the remaining two — contributes only $0.0039$, while mode 3 at four times the frequency contributes $0.0100$, two and a half times more, because the actuator drives it five times harder and the sensor sees it five times better.

Keeping the two lowest-frequency modes and throwing away the third is the natural move and it is the wrong one. It leaves an error of $0.00998$ in the infinity norm. Keeping modes 1 and 3 and discarding mode 2 leaves $0.00391$, and that is what balanced truncation does without being told anything about the physics.
:::

## The invariant nobody can argue with

Lesson 2 established that $\mathbf{W}_c$ and $\mathbf{W}_o$ are not invariant under a change of state coordinates — they transform by congruence, $\bar{\mathbf{W}}_c = \mathbf{T}^{-1}\mathbf{W}_c\mathbf{T}^{-\mathsf{T}}$ and $\bar{\mathbf{W}}_o = \mathbf{T}^\mathsf{T}\mathbf{W}_o\mathbf{T}$ — but their **product** is: $\bar{\mathbf{W}}_c\bar{\mathbf{W}}_o = \mathbf{T}^{-1}(\mathbf{W}_c\mathbf{W}_o)\mathbf{T}$. So $\operatorname{eig}(\mathbf{W}_c\mathbf{W}_o)$ belongs to the plant and not to anyone's choice of state vector.

> The **Hankel singular values** of a stable system are $\sigma_i = \sqrt{\lambda_i(\mathbf{W}_c\mathbf{W}_o)}$, ordered $\sigma_1\ge\sigma_2\ge\cdots\ge\sigma_n > 0$.

They are real and non-negative because $\mathbf{W}_c\mathbf{W}_o$ is a product of two positive definite matrices, which is similar to the symmetric positive definite $\mathbf{W}_c^{1/2}\mathbf{W}_o\mathbf{W}_c^{1/2}$.

Since the list is invariant, there is no obstacle to finding coordinates that display it. A **balanced realization** is one in which

$$\mathbf{W}_c = \mathbf{W}_o = \boldsymbol{\Sigma} = \operatorname{diag}(\sigma_1,\dots,\sigma_n),$$

and in those coordinates each state has a clean two-sided meaning. From Lesson 4, the minimum input energy needed to reach the state $\mathbf{e}_i$ is $\mathbf{e}_i^\mathsf{T}\mathbf{W}_c^{-1}\mathbf{e}_i = 1/\sigma_i$. From Lesson 5, the output energy produced by releasing the system from $\mathbf{e}_i$ is $\mathbf{e}_i^\mathsf{T}\mathbf{W}_o\mathbf{e}_i = \sigma_i$. The ratio of output energy obtained to input energy spent is $\sigma_i^2$, so

$$\sigma_i = \sqrt{\frac{\text{output energy in the future}}{\text{input energy in the past}}}\ \text{ along balanced direction } i.$$

That is exactly the gain of the Hankel operator, the map from past inputs to future outputs, which is where the name comes from. A small $\sigma_i$ means expensive to excite *and* quiet once excited: the state does almost nothing to the transfer function, and deleting it costs almost nothing.

### Computing the balancing transform

The direct route — diagonalise $\mathbf{W}_c\mathbf{W}_o$ — is numerically poor, because forming the product squares the conditioning. The square-root algorithm avoids it:

1. Solve the two Lyapunov equations for $\mathbf{W}_c$ and $\mathbf{W}_o$.
2. Factor them: $\mathbf{W}_c = \mathbf{R}\mathbf{R}^\mathsf{T}$, $\mathbf{W}_o = \mathbf{S}\mathbf{S}^\mathsf{T}$, by Cholesky.
3. Take the SVD $\mathbf{S}^\mathsf{T}\mathbf{R} = \mathbf{U}\boldsymbol{\Sigma}\mathbf{V}^\mathsf{T}$. The $\boldsymbol{\Sigma}$ that appears here *is* the Hankel singular value matrix, obtained without ever forming $\mathbf{W}_c\mathbf{W}_o$.
4. Set $\mathbf{T} = \mathbf{R}\mathbf{V}\boldsymbol{\Sigma}^{-1/2}$, with $\mathbf{T}^{-1} = \boldsymbol{\Sigma}^{-1/2}\mathbf{U}^\mathsf{T}\mathbf{S}^\mathsf{T}$, and transform as in Lesson 2.

## Truncation and its error bound

Order the balanced states by $\sigma_i$, partition after the $r$-th, and keep the top-left blocks:

$$\begin{pmatrix}\mathbf{A}_{11}&\mathbf{A}_{12}\\\mathbf{A}_{21}&\mathbf{A}_{22}\end{pmatrix},\ \begin{pmatrix}\mathbf{B}_1\\\mathbf{B}_2\end{pmatrix},\ \begin{pmatrix}\mathbf{C}_1&\mathbf{C}_2\end{pmatrix} \ \longrightarrow\ \left(\mathbf{A}_{11},\ \mathbf{B}_1,\ \mathbf{C}_1,\ \mathbf{D}\right).$$

::: key Balanced truncation
Transform so that $\mathbf{W}_c = \mathbf{W}_o = \operatorname{diag}$(Hankel singular values), then discard the states with small $\sigma$ — those are simultaneously hard to reach and hard to observe. Error bound: twice the sum of the discarded $\sigma$'s, $\ \|\mathbf{G}-\mathbf{G}_r\|_\infty \le 2\sum_{i>r}\sigma_i$.
:::

Two companion facts complete the picture. The bound is accompanied by a lower bound $\|\mathbf{G}-\mathbf{G}_r\|_\infty \ge \sigma_{r+1}$, so the gap between the best possible and the guaranteed is at most a factor of $2n$ and usually much less. And the truncated system is **stable and balanced**, with Hankel singular values $\sigma_1,\dots,\sigma_r$ — provided $\sigma_r \ne \sigma_{r+1}$, which is why you always cut at a gap in the list rather than in the middle of a cluster.

::: example Reducing the appendage model
Solve the two Lyapunov equations for the six-state model above and run the square-root algorithm. The Hankel singular values come out as

$$\boldsymbol{\sigma} = (10.391,\ 10.287,\ 0.005048,\ 0.004928,\ 0.001969,\ 0.001938).$$

They arrive in near-equal pairs, which is what lightly damped oscillatory modes always do — the two states of a resonance are equally important. Comparing against the table, $\sigma \approx \tfrac{1}{2}\times$ the resonant peak for each mode, so the pairs belong to mode 1, then **mode 3**, then **mode 2**. The ordering the algorithm produces is by contribution, not by frequency, and it has put the $4.6\,\mathrm{Hz}$ mode ahead of the $1.8\,\mathrm{Hz}$ one.

Verifying the balancing: computing the Gramians of the transformed realization returns $\mathbf{W}_c = \mathbf{W}_o = \operatorname{diag}(\boldsymbol{\sigma})$ to eight decimal places, with every off-diagonal entry at round-off.

Truncate to $r = 4$. The bound is $2(0.001969 + 0.001938) = 0.00781$; sweeping the frequency response of $\mathbf{G}-\mathbf{G}_4$ gives an actual peak error of $0.00391$, at $\omega = 11.31\,\mathrm{rad/s}$ — the frequency of the mode that was deleted, which is where you would expect the error to live. The full model's own peak gain is $\|\mathbf{G}\|_\infty = 20.68$, so the relative error is $0.019\,\%$. The retained eigenvalues are the $0.35\,\mathrm{Hz}$ and $4.6\,\mathrm{Hz}$ pairs, unchanged to four figures.

Truncate to $r = 2$ and the bound is $2(0.005048+0.004928+0.001969+0.001938) = 0.0278$, with an actual error of $0.00998$ at $\omega = 28.90\,\mathrm{rad/s}$. The remaining model is one mode, and it captures everything above $0.05\,\%$ of the peak.

Compare the naive alternative at the same order: truncating the modal form by frequency, keeping $0.35$ and $1.8\,\mathrm{Hz}$, gives an error of $0.00998$ — two and a half times worse than the balanced four-state model, for exactly the same amount of flight software. The error is not merely larger; it sits at $4.6\,\mathrm{Hz}$, unmodelled, where a controller that knows nothing about it can drive it.
:::

## Residualisation, when the steady state matters

Balanced truncation deletes the fast, weakly coupled states by setting them to zero. That is right at high frequency and slightly wrong at DC, because those states did contribute a small amount to the steady-state gain and now contribute nothing. For the appendage, the exact DC gain is $0.207080$; the four-state truncation gives $0.207017$ and the two-state gives $0.206778$, errors of $0.03\,\%$ and $0.15\,\%$.

**Balanced residualisation** (also called singular perturbation approximation) fixes this by setting $\dot{\mathbf{x}}_2 = \mathbf{0}$ instead of $\mathbf{x}_2 = \mathbf{0}$, solving $\mathbf{x}_2 = -\mathbf{A}_{22}^{-1}(\mathbf{A}_{21}\mathbf{x}_1 + \mathbf{B}_2\mathbf{u})$ and substituting:

$$\mathbf{A}_r = \mathbf{A}_{11}-\mathbf{A}_{12}\mathbf{A}_{22}^{-1}\mathbf{A}_{21},\quad \mathbf{B}_r = \mathbf{B}_1-\mathbf{A}_{12}\mathbf{A}_{22}^{-1}\mathbf{B}_2,\quad \mathbf{C}_r = \mathbf{C}_1-\mathbf{C}_2\mathbf{A}_{22}^{-1}\mathbf{A}_{21},\quad \mathbf{D}_r = \mathbf{D}-\mathbf{C}_2\mathbf{A}_{22}^{-1}\mathbf{B}_2.$$

Applied to the appendage, both the four-state and the two-state residualised models return a DC gain of $0.207080$, matching exactly. The same error bound applies. Use truncation when the high-frequency behaviour matters most — rolling off a controller, gain-stabilising a mode — and residualisation when the steady state matters, which is most of the time for a plant model that a servo will sit around.

::: warning Gramians need a stable model, and vehicles are not stable
Every Gramian in this lesson came from a Lyapunov equation, which requires $\operatorname{Re}\lambda_i < 0$ for every mode. A rigid-body attitude model has two eigenvalues at the origin; a launch vehicle at maximum dynamic pressure has one in the right half plane; an unstable aircraft has more. For those, three things work. Split the model into its stable and unstable parts by a real Schur decomposition, reduce only the stable part, and put the unstable part back untouched — it is small and it is the part you must keep. Or close a stabilising loop first and reduce the closed-loop model. Or use a frequency-weighted method, which is in any case the right tool for reducing a *controller*: plain balanced truncation of a controller measures the wrong thing, because what matters is the closed-loop behaviour, not the controller's own input-output map.
:::

```python
import numpy as np

def lyap(A, Q):                       # solve A X + X A^T + Q = 0
    n = A.shape[0]
    M = np.kron(A, np.eye(n)) + np.kron(np.eye(n), A)
    return np.linalg.solve(M, -Q.reshape(-1)).reshape(n, n)

def balance(A, B, C):
    R = np.linalg.cholesky(lyap(A, B @ B.T))          # Wc = R R^T
    S = np.linalg.cholesky(lyap(A.T, C.T @ C))        # Wo = S S^T
    U, sig, Vt = np.linalg.svd(S.T @ R)
    T = R @ Vt.T @ np.diag(sig ** -0.5)
    Tinv = np.diag(sig ** -0.5) @ U.T @ S.T
    return Tinv @ A @ T, Tinv @ B, C @ T, sig

blocks, B, C = [], [], []
for f, z, phi, psi in [(0.35, 0.005, 1.0, 1.0), (1.8, 0.008, 0.1, 0.08), (4.6, 0.012, 0.5, 0.4)]:
    w = 2 * np.pi * f
    blocks.append(np.array([[0.0, 1], [-w * w, -2 * z * w]]))
    B += [0.0, phi]
    C += [psi, 0.0]
A = np.zeros((6, 6))
for i, blk in enumerate(blocks):
    A[2 * i:2 * i + 2, 2 * i:2 * i + 2] = blk
B = np.array(B).reshape(6, 1); C = np.array(C).reshape(1, 6)

Ab, Bb, Cb, sig = balance(A, B, C)
print("Hankel singular values:", np.round(sig, 6))
print("balanced Wc diagonal  :", np.round(np.diag(lyap(Ab, Bb @ Bb.T)), 6))
for r in (4, 2):
    print(f"r={r}: bound = {2 * sig[r:].sum():.5f},  kept eigenvalues "
          f"{np.round(np.linalg.eigvals(Ab[:r, :r]), 4)}")
# Hankel singular values: [10.39072  10.287331  0.005048  0.004928  0.001969  0.001938]
# balanced Wc diagonal  : [10.39072  10.287331  0.005048  0.004928  0.001969  0.001938]
# r=4: bound = 0.00781,  kept eigenvalues [-0.011 +2.1991j -0.011 -2.1991j -0.3469+28.8987j -0.3469-28.8987j]
# r=2: bound = 0.02777,  kept eigenvalues [-0.011+2.1991j -0.011-2.1991j]
```

::: note Where to cut
Plot the Hankel singular values on a log scale and cut at a gap. In the appendage the list goes $10.4,\ 10.3,\ 5.0\times10^{-3},\ 4.9\times10^{-3},\ 2.0\times10^{-3},\ 1.9\times10^{-3}$: there is a factor-of-$2000$ gap after the second and a factor of $2.5$ after the fourth, so $r = 2$ and $r = 4$ are both defensible and $r = 3$ or $r = 5$ are not, because they split a pair. If the list decays smoothly with no gap, the model has no small part and reduction will cost you something real; decide with the error bound and the requirement, not with the plot.
:::

## Check yourself

::: check
Why are the Hankel singular values a fair way to rank states when the eigenvalues of $\mathbf{W}_c$ alone are not?
:::

::: answer
Because $\mathbf{W}_c$ transforms by congruence under a change of state coordinates, so its eigenvalues can be moved anywhere by rescaling the states — Lesson 2 showed a factor of $4000$ in a condition number from a change of units alone. The product $\mathbf{W}_c\mathbf{W}_o$ transforms by *similarity*, so its eigenvalues, and hence the $\sigma_i = \sqrt{\lambda_i}$, are invariant. They are also the right thing physically: ranking by $\mathbf{W}_c$ alone would keep states that are easy to excite even if no sensor can see them, and ranking by $\mathbf{W}_o$ alone would keep states no actuator can reach. Only the combination measures the contribution to the input-output map.
:::

::: check
A twelve-state model has $\boldsymbol{\sigma} = (44,\ 41,\ 3.1,\ 3.0,\ 0.8,\ 0.79,\ 0.02,\ 0.019,\ 0.004,\ 0.004,\ 0.001,\ 0.001)$. What orders would you consider, and what error can you promise for each?
:::

::: answer
The values come in pairs, so the plant is six lightly damped modes and the sensible orders are even: $2$, $4$, $6$, $8$, $10$. The bound is twice the sum of what you drop. $r = 6$: $2(0.02+0.019+0.004+0.004+0.001+0.001) = 0.098$. $r = 8$: $2(0.004+0.004+0.001+0.001) = 0.020$. $r = 4$: $2(0.8+0.79+\dots) = 3.23$. The big gap is between $\sigma_6 = 0.79$ and $\sigma_7 = 0.02$, a factor of $40$, so $r = 6$ is the natural cut and promises an error of $0.098$ against a plant whose peak gain you should check — if $\|\mathbf{G}\|_\infty$ is $44$-ish, that is a fifth of a percent. Never cut at $r = 7$, $9$ or $11$, which splits a pair.
:::

::: check
You reduce a controller from twenty states to six by balanced truncation, the bound says the error is tiny, and the closed loop goes unstable. What went wrong?
:::

::: answer
Plain balanced truncation minimises the error in the controller's *own* transfer function, weighted equally at all frequencies. What matters is the closed loop, and a controller's small features near crossover — a notch, a lead network, a roll-off — can have a negligible open-loop norm while being exactly what holds the margin. Deleting them is cheap by the bound and fatal in the loop. The fix is frequency-weighted balanced truncation, where the Gramians are computed with weights that emphasise the frequencies the loop cares about, or closed-loop balanced reduction, which measures the error in the closed-loop map directly. As a habit: reduce the *plant* before designing, and if a controller must be reduced afterwards, re-verify every margin on the reduced one.
:::

::: check
For the appendage model, why do the Hankel singular values come in near-equal pairs, and what would break that?
:::

::: answer
Each lightly damped resonance is a two-state block whose two states are the modal coordinate and its rate. Energy sloshes between them every quarter cycle, so neither is more reachable or more observable than the other over a time long compared with the period, and the two $\sigma$'s are nearly equal — exactly equal in the limit $\zeta\to0$. Heavy damping breaks the pairing, because the mode stops oscillating and the two states become distinguishable; so does a real (non-oscillatory) mode, which contributes a single unpaired $\sigma$. A rigid-body integrator breaks it in a different way: it has no finite Gramian at all and must be split off before balancing.
:::

::: check
The appendage's four-state truncation has a DC gain error of $0.03\,\%$ and its residualisation has none. When would you still prefer the truncation?
:::

::: answer
When the high-frequency end is what the design depends on. A truncated model matches $\mathbf{G}$ exactly as $\omega\to\infty$ (both roll off with the same $\mathbf{D}$), while a residualised model matches exactly at $\omega = 0$ and carries a non-zero $\mathbf{D}_r = -\mathbf{C}_2\mathbf{A}_{22}^{-1}\mathbf{B}_2$ that does not roll off. If you are gain-stabilising a mode near crossover, designing a roll-off filter, or checking a notch, the truncation is the honest model. If you are designing a servo that will sit at steady state for hours against a disturbance, the residualisation is. A third of a percent of DC gain error is invisible to a loop with an integrator in it, which closes the argument for most attitude designs either way.
:::

## Summary

| Item | Statement |
| --- | --- |
| Hankel singular values | $\sigma_i = \sqrt{\lambda_i(\mathbf{W}_c\mathbf{W}_o)}$; invariant under any similarity transform |
| Meaning | in balanced coordinates, reaching $\mathbf{e}_i$ costs $1/\sigma_i$ of input energy and yields $\sigma_i$ of output energy; the ratio is $\sigma_i^2$ |
| Balanced realization | $\mathbf{W}_c = \mathbf{W}_o = \operatorname{diag}(\sigma_1,\dots,\sigma_n)$ |
| Square-root algorithm | $\mathbf{W}_c = \mathbf{R}\mathbf{R}^\mathsf{T}$, $\mathbf{W}_o = \mathbf{S}\mathbf{S}^\mathsf{T}$, $\mathbf{S}^\mathsf{T}\mathbf{R} = \mathbf{U}\boldsymbol{\Sigma}\mathbf{V}^\mathsf{T}$, $\mathbf{T} = \mathbf{R}\mathbf{V}\boldsymbol{\Sigma}^{-1/2}$ |
| Truncation | keep the top-left $r\times r$ blocks; stable, balanced, retains $\sigma_1..\sigma_r$ |
| Error bound | $\sigma_{r+1} \le \|\mathbf{G}-\mathbf{G}_r\|_\infty \le 2\sum_{i>r}\sigma_i$ |
| Worked numbers | $\boldsymbol{\sigma} = (10.391,\ 10.287,\ 0.00505,\ 0.00493,\ 0.00197,\ 0.00194)$; $r=4$ bound $0.00781$, actual $0.00391$ |
| Ranking | by contribution, not frequency: the $4.6\,\mathrm{Hz}$ mode outranked the $1.8\,\mathrm{Hz}$ one |
| Residualisation | $\mathbf{A}_r = \mathbf{A}_{11}-\mathbf{A}_{12}\mathbf{A}_{22}^{-1}\mathbf{A}_{21}$ and so on; matches DC exactly, same bound |
| Cut where | at a gap in the $\sigma$ list, never inside a near-equal pair |
| Unstable plants | split stable and unstable parts, or close a loop first; use frequency weighting for controllers |

That closes the module. You can write a vehicle model and change its coordinates without losing track of what is real, test whether your actuators can move it and your sensors can see it, place poles and justify the locations against torque and noise, build an observer, wire the two together and say exactly when that is safe, add integral action, read a MIMO plant's directions and zeros, and cut a fifty-state model down to something a flight computer can run. The optimal control and estimation modules that follow replace the two design choices you made by hand — where to put the poles, and how fast to make the observer — with a cost function and a noise model, and every one of them is stated in the notation of this module.
