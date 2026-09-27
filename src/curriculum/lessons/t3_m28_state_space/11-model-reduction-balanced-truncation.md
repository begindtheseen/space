---
id: l11-model-reduction-balanced-truncation
title: Model reduction — balanced truncation and Hankel singular values
minutes: 19
covers:
  - "Model reduction: balanced truncation and Hankel singular values"
---

Packing a backpack for a hike, you cannot take everything. So you ask of each item: how much will I use it, and how much does it weigh? A heavy thing you will never use stays home. The trick is that you need *both* answers. A light thing you never use still wastes space.

Models on a real program are the overstuffed backpack. A **[[finite-element model|finite-element]]** of a launch vehicle produces bending modes by the hundred. A spacecraft with two deployed solar arrays, an antenna boom and a **[[slosh|slosh-word]]** model can run to fifty states before anyone adds an actuator. A detailed thrust-vector-control actuator model brings a dozen more. You cannot design a controller on all of them. Even if you could, you would not want to fly the result. An observer has as many states as the model it is built on, and a fifty-state observer is fifty states of flight software to verify, to start up correctly, to check for numerical drift, and to defend in a review.

So you **reduce** the model — you throw states away. The question is which ones. The tempting answer is "keep the low-frequency modes, drop the high-frequency ones". It is wrong often enough to be dangerous. A mode's frequency says nothing about how hard the actuator shakes it or how clearly the sensor sees it. The mode that matters is the one the input can reach *and* the output can see. This module already has tools that measure both.

**Balanced truncation** is the method built from those tools. Find the coordinates in which the controllability and observability Gramians are equal and diagonal. Read off the diagonal — the **Hankel singular values**. Delete the states whose entries are small, because those are hard to reach *and* hard to observe. The method comes with an error bound you can quote before you even compute the reduced model, and it keeps the model stable.

## Frequency is the wrong yardstick

Start with an example that shows the trap before building the tool.

::: example Three bending modes, and the one you would have kept
A flexible appendage is driven by a torque at the spacecraft bus and sensed at its tip. Model it as three damped modes in the real modal form of Lesson 1. Each mode is a $2\times2$ block

$$\begin{pmatrix}0&1\\-\omega_i^2&-2\zeta_i\omega_i\end{pmatrix}$$

with natural frequency $\omega_i$, damping ratio $\zeta_i$ ("zeta"), input coefficient $\phi_i$ ("phi", how hard the actuator drives the mode) and output coefficient $\psi_i$ ("psi", how strongly the sensor sees it).

| mode | frequency | $\zeta$ | $\phi$ | $\psi$ | resonant peak of that mode alone |
| --- | --- | --- | --- | --- | --- |
| 1 | $0.35\,\mathrm{Hz}$ ($2.199\,\mathrm{rad/s}$) | $0.005$ | $1.00$ | $1.00$ | $20.68$ |
| 2 | $1.80\,\mathrm{Hz}$ ($11.310\,\mathrm{rad/s}$) | $0.008$ | $0.10$ | $0.08$ | $0.00391$ |
| 3 | $4.60\,\mathrm{Hz}$ ($28.903\,\mathrm{rad/s}$) | $0.012$ | $0.50$ | $0.40$ | $0.00998$ |

**Step 1 — where the last column comes from.** A lightly damped mode peaks at about $\phi_i\psi_i/(2\zeta_i\omega_i^2)$. For mode 3:

$$\frac{(0.5)(0.4)}{2(0.012)(28.903)^2} = \frac{0.2}{20.05} = 0.00998.$$

**Step 2 — compare.** Mode 1 dominates by three orders of magnitude, as expected. But look at the other two. Mode 2, the *lower* frequency, contributes only $0.0039$. Mode 3, at two and a half times the frequency, contributes $0.0100$ — two and a half times more. The reason is in the table: the actuator drives mode 3 five times harder ($0.5$ against $0.1$) and the sensor sees it five times better ($0.4$ against $0.08$).

**Step 3 — the cost of the obvious choice.** Keeping the two lowest-frequency modes and dropping the third is the natural move, and it is the wrong one. It leaves an error of $0.00998$ in the **[[infinity norm|infinity-norm]]** — the peak gain of the difference over all frequencies. Keeping modes 1 and 3 and dropping mode 2 leaves only $0.00391$. That better choice is what balanced truncation makes, without being told anything about the physics.
:::

## The invariant nobody can argue with

To rank states fairly you need a measure that does not depend on how you happen to write the state down. Lesson 2 found one.

Recall the Gramians. $\mathbf{W}_c$ (read "W sub c") measures how easy each direction is to reach; $\mathbf{W}_o$ how easy it is to see. Neither is invariant under a change of state coordinates $\mathbf{x} = \mathbf{T}\mathbf{z}$. They change by **congruence**:

$$\bar{\mathbf{W}}_c = \mathbf{T}^{-1}\mathbf{W}_c\mathbf{T}^{-\mathsf{T}}, \qquad \bar{\mathbf{W}}_o = \mathbf{T}^\mathsf{T}\mathbf{W}_o\mathbf{T}.$$

But multiply them, and the inner factors cancel:

$$\bar{\mathbf{W}}_c\bar{\mathbf{W}}_o = \mathbf{T}^{-1}\mathbf{W}_c\mathbf{T}^{-\mathsf{T}}\mathbf{T}^\mathsf{T}\mathbf{W}_o\mathbf{T} = \mathbf{T}^{-1}(\mathbf{W}_c\mathbf{W}_o)\mathbf{T}.$$

That is a similarity transform, and similarity keeps eigenvalues. So $\operatorname{eig}(\mathbf{W}_c\mathbf{W}_o)$ belongs to the plant, not to anyone's choice of state vector.

> The **Hankel singular values** of a stable system are $\sigma_i = \sqrt{\lambda_i(\mathbf{W}_c\mathbf{W}_o)}$, ordered $\sigma_1\ge\sigma_2\ge\cdots\ge\sigma_n$. For a minimal realization they are all positive.

Read $\sigma_i$ as "sigma i" and $\lambda_i$ as "the $i$-th eigenvalue of". They are real and non-negative, because $\mathbf{W}_c\mathbf{W}_o$ — a product of two positive definite matrices — is similar to the symmetric positive definite matrix $\mathbf{W}_c^{1/2}\mathbf{W}_o\mathbf{W}_c^{1/2}$.

### Balanced coordinates

Because the list is fixed, you are free to choose coordinates that show it off. A **balanced realization** is one in which

$$\mathbf{W}_c = \mathbf{W}_o = \boldsymbol{\Sigma} = \operatorname{diag}(\sigma_1,\dots,\sigma_n).$$

"Balanced" because each state is exactly as reachable as it is observable. In those coordinates every state has a clean two-sided meaning.

- **Cost to reach it.** From Lesson 4, the minimum input energy to reach the state $\mathbf{e}_i$ (the $i$-th unit vector) is $\mathbf{e}_i^\mathsf{T}\mathbf{W}_c^{-1}\mathbf{e}_i = 1/\sigma_i$.
- **What it gives back.** From Lesson 5, the output energy produced by releasing the system from $\mathbf{e}_i$ is $\mathbf{e}_i^\mathsf{T}\mathbf{W}_o\mathbf{e}_i = \sigma_i$.

Output energy obtained divided by input energy spent is $\sigma_i/(1/\sigma_i) = \sigma_i^2$. So

$$\sigma_i = \sqrt{\frac{\text{output energy in the future}}{\text{input energy in the past}}}\ \text{ along balanced direction } i.$$

That is the gain of the **[[Hankel operator|hankel-operator]]**, the map from past inputs to future outputs, which is where the name comes from. A small $\sigma_i$ means the state is expensive to excite *and* quiet once excited. It does almost nothing to the transfer function, and deleting it costs almost nothing. In backpack terms: heavy and never used.

### Computing the balancing transform

The direct route — find the eigenvectors of $\mathbf{W}_c\mathbf{W}_o$ — is numerically poor, because forming the product squares the conditioning. The **square-root algorithm** avoids ever forming it:

1. Solve the two **[[Lyapunov equations|lyapunov-name]]** for $\mathbf{W}_c$ and $\mathbf{W}_o$.
2. Factor each one: $\mathbf{W}_c = \mathbf{R}\mathbf{R}^\mathsf{T}$ and $\mathbf{W}_o = \mathbf{S}\mathbf{S}^\mathsf{T}$, by **[[Cholesky|cholesky-name]]** factorization.
3. Take the SVD $\mathbf{S}^\mathsf{T}\mathbf{R} = \mathbf{U}\boldsymbol{\Sigma}\mathbf{V}^\mathsf{T}$. The $\boldsymbol{\Sigma}$ that appears here *is* the Hankel singular value matrix.
4. Set $\mathbf{T} = \mathbf{R}\mathbf{V}\boldsymbol{\Sigma}^{-1/2}$, with $\mathbf{T}^{-1} = \boldsymbol{\Sigma}^{-1/2}\mathbf{U}^\mathsf{T}\mathbf{S}^\mathsf{T}$, and transform the model as in Lesson 2.

::: note Why the square-root algorithm works
First, the two matrices in step 4 really are inverses: $\mathbf{T}^{-1}\mathbf{T} = \boldsymbol{\Sigma}^{-1/2}\mathbf{U}^\mathsf{T}(\mathbf{S}^\mathsf{T}\mathbf{R})\mathbf{V}\boldsymbol{\Sigma}^{-1/2} = \boldsymbol{\Sigma}^{-1/2}\mathbf{U}^\mathsf{T}\mathbf{U}\boldsymbol{\Sigma}\mathbf{V}^\mathsf{T}\mathbf{V}\boldsymbol{\Sigma}^{-1/2} = \mathbf{I}$.

Second, the new controllability Gramian is

$$\mathbf{T}^{-1}\mathbf{W}_c\mathbf{T}^{-\mathsf{T}} = \boldsymbol{\Sigma}^{-1/2}\mathbf{U}^\mathsf{T}\mathbf{S}^\mathsf{T}\mathbf{R}\mathbf{R}^\mathsf{T}\mathbf{S}\mathbf{U}\boldsymbol{\Sigma}^{-1/2}.$$

The middle, $\mathbf{S}^\mathsf{T}\mathbf{R}\mathbf{R}^\mathsf{T}\mathbf{S}$, equals $\mathbf{U}\boldsymbol{\Sigma}^2\mathbf{U}^\mathsf{T}$ from the SVD. So the whole thing is $\boldsymbol{\Sigma}^{-1/2}\boldsymbol{\Sigma}^2\boldsymbol{\Sigma}^{-1/2} = \boldsymbol{\Sigma}$. The same steps on $\mathbf{T}^\mathsf{T}\mathbf{W}_o\mathbf{T}$ give $\boldsymbol{\Sigma}$ as well. Both Gramians are equal and diagonal: balanced.
:::

## Truncation and its error bound

Sort the balanced states by $\sigma_i$, largest first. Split after the $r$-th state, and keep only the top-left blocks:

$$\begin{pmatrix}\mathbf{A}_{11}&\mathbf{A}_{12}\\\mathbf{A}_{21}&\mathbf{A}_{22}\end{pmatrix},\ \begin{pmatrix}\mathbf{B}_1\\\mathbf{B}_2\end{pmatrix},\ \begin{pmatrix}\mathbf{C}_1&\mathbf{C}_2\end{pmatrix} \ \longrightarrow\ \left(\mathbf{A}_{11},\ \mathbf{B}_1,\ \mathbf{C}_1,\ \mathbf{D}\right).$$

The reduced model $\mathbf{G}_r$ ("G sub r") has $r$ states.

::: key Balanced truncation
Transform so that $\mathbf{W}_c = \mathbf{W}_o = \operatorname{diag}$(Hankel singular values), then discard the states with small $\sigma$ — those are simultaneously hard to reach and hard to observe. Error bound: twice the sum of the discarded $\sigma$'s, $\ \|\mathbf{G}-\mathbf{G}_r\|_\infty \le 2\sum_{i>r}\sigma_i$.
:::

Two companion facts complete the picture.

**A floor as well as a ceiling.** No stable reduced model of order $r$, made by any method, can do better than $\|\mathbf{G}-\mathbf{G}_r\|_\infty \ge \sigma_{r+1}$. So the true error sits between $\sigma_{r+1}$ and $2\sum_{i>r}\sigma_i$. The gap between the two is at most a factor of $2(n-r)$, and usually much less.

**It stays stable and balanced.** The truncated system is stable and balanced, with Hankel singular values $\sigma_1,\dots,\sigma_r$ — provided $\sigma_r \ne \sigma_{r+1}$. That is why you always cut at a **gap** in the list, never in the middle of a cluster.

::: example Reducing the appendage model
**Step 1 — the Hankel singular values.** Solve the two Lyapunov equations for the six-state model above and run the square-root algorithm. The values come out as

$$\boldsymbol{\sigma} = (10.391,\ 10.287,\ 0.005048,\ 0.004928,\ 0.001969,\ 0.001938).$$

They come in near-equal pairs. Lightly damped oscillating modes always do this — the two states of a resonance are equally important.

**Step 2 — match them to modes.** Each pair adds up to about the mode's resonant peak from the table: $0.005048 + 0.004928 = 0.00998$ for mode 3, and $0.001969 + 0.001938 = 0.00391$ for mode 2. So the pairs belong to mode 1, then **mode 3**, then **mode 2**. The algorithm has ranked by contribution, not frequency. It put the $4.6\,\mathrm{Hz}$ mode ahead of the $1.8\,\mathrm{Hz}$ one.

**Step 3 — check the balancing.** Computing the Gramians of the transformed model returns $\mathbf{W}_c = \mathbf{W}_o = \operatorname{diag}(\boldsymbol{\sigma})$ to eight decimal places, with every off-diagonal entry at round-off.

**Step 4 — truncate to $r = 4$.** The bound is

$$2(0.001969 + 0.001938) = 2(0.003907) = 0.00781.$$

Sweeping the frequency response of $\mathbf{G}-\mathbf{G}_4$ gives an actual peak error of $0.00391$, at $\omega = 11.31\,\mathrm{rad/s}$. That is the frequency of the deleted mode — where you would expect the error to live. It also sits between the floor $\sigma_5 = 0.00197$ and the ceiling $0.00781$, as it must. The full model's own peak gain is $\|\mathbf{G}\|_\infty = 20.68$, so the relative error is $0.00391/20.68 = 0.019\,\%$. The kept eigenvalues are the $0.35\,\mathrm{Hz}$ and $4.6\,\mathrm{Hz}$ pairs, unchanged to four figures.

**Step 5 — truncate to $r = 2$.** The bound is $2(0.005048+0.004928+0.001969+0.001938) = 0.0278$. The actual error is $0.00998$, at $\omega = 28.90\,\mathrm{rad/s}$. The remaining model is one mode, and what it leaves out is under $0.05\,\%$ of the peak.

**Step 6 — compare with the naive cut.** Truncating the modal form by frequency, keeping the $0.35$ and $1.8\,\mathrm{Hz}$ modes, gives an error of $0.00998$ with four states. That is two and a half times worse than the balanced four-state model, for exactly the same amount of flight software. And the error is not only larger — it sits at $4.6\,\mathrm{Hz}$, unmodeled, where a controller that knows nothing about it can drive it.
:::

Here is the whole calculation in NumPy. The Lyapunov solver uses Kronecker products, which is fine for a handful of states; for large models use `scipy.linalg.solve_continuous_lyapunov`.

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
print("Hankel singular values:", [f"{s:.4g}" for s in sig])
print("balanced Wc diagonal  :", [f"{s:.4g}" for s in np.diag(lyap(Ab, Bb @ Bb.T))])
for r in (4, 2):
    print(f"r={r}: bound = {2 * sig[r:].sum():.5f}, kept eigenvalues",
          np.round(np.linalg.eigvals(Ab[:r, :r]), 3))
# Hankel singular values: ['10.39', '10.29', '0.005048', '0.004928', '0.001969', '0.001938']
# balanced Wc diagonal  : ['10.39', '10.29', '0.005048', '0.004928', '0.001969', '0.001938']
# r=4: bound = 0.00781, kept eigenvalues [-0.011 +2.199j -0.011 -2.199j -0.347+28.899j -0.347-28.899j]
# r=2: bound = 0.02777, kept eigenvalues [-0.011+2.199j -0.011-2.199j]
```

::: note Where to cut
Plot the Hankel singular values on a log scale and [[cut at a gap|hsv-gap]]. For the appendage the list is $10.4,\ 10.3,\ 5.0\times10^{-3},\ 4.9\times10^{-3},\ 2.0\times10^{-3},\ 1.9\times10^{-3}$. There is a factor-of-$2000$ gap after the second value and a factor of $2.5$ after the fourth. So $r = 2$ and $r = 4$ are both defensible. $r = 3$ and $r = 5$ are not, because they split a pair. If the list falls smoothly with no gap, the model has no small part, and reduction will cost you something real. Then decide with the error bound and the requirement, not with the plot.
:::

## Residualization, when the steady state matters

Truncation deletes the weak states by setting them to zero. That is right at high frequency and slightly wrong at DC (zero frequency). Those states did add a little to the steady-state gain, and now they add nothing.

For the appendage, the exact DC gain is $0.207080$. The four-state truncation gives $0.207017$, an error of $0.03\,\%$. The two-state truncation gives $0.206778$, an error of $0.15\,\%$.

**Balanced residualization** (also called the **[[singular perturbation|singular-perturbation]]** approximation) fixes this. Instead of setting the deleted states to zero, $\mathbf{x}_2 = \mathbf{0}$, it sets their *rate* to zero, $\dot{\mathbf{x}}_2 = \mathbf{0}$ — as if they settle instantly. The bottom block row of the state equation then reads $\mathbf{0} = \mathbf{A}_{21}\mathbf{x}_1 + \mathbf{A}_{22}\mathbf{x}_2 + \mathbf{B}_2\mathbf{u}$. Solve for $\mathbf{x}_2$:

$$\mathbf{x}_2 = -\mathbf{A}_{22}^{-1}(\mathbf{A}_{21}\mathbf{x}_1 + \mathbf{B}_2\mathbf{u}).$$

Substitute into the top block row and the output equation:

$$\mathbf{A}_r = \mathbf{A}_{11}-\mathbf{A}_{12}\mathbf{A}_{22}^{-1}\mathbf{A}_{21},\quad \mathbf{B}_r = \mathbf{B}_1-\mathbf{A}_{12}\mathbf{A}_{22}^{-1}\mathbf{B}_2,\quad \mathbf{C}_r = \mathbf{C}_1-\mathbf{C}_2\mathbf{A}_{22}^{-1}\mathbf{A}_{21},\quad \mathbf{D}_r = \mathbf{D}-\mathbf{C}_2\mathbf{A}_{22}^{-1}\mathbf{B}_2.$$

Applied to the appendage, both the four-state and the two-state residualized models return a DC gain of $0.207080$ — an exact match. The same error bound applies.

Use truncation when the high-frequency behavior matters most — rolling off a controller, gain-stabilizing a mode. Use residualization when the steady state matters, which is most of the time for a plant model that a servo will sit around.

::: warning Gramians need a stable model, and vehicles are not stable
Every Gramian in this lesson came from a Lyapunov equation, which needs $\operatorname{Re}\lambda_i < 0$ for every mode. A rigid-body attitude model has two eigenvalues at the origin. A launch vehicle at maximum dynamic pressure has one in the right half plane. An unstable aircraft has more. Three things work for these:

- Split the model into stable and unstable parts with a **[[real Schur decomposition|real-schur]]**. Reduce only the stable part and put the unstable part back untouched — it is small, and it is the part you must keep.
- Close a stabilizing loop first and reduce the closed-loop model.
- Use a frequency-weighted method. That is the right tool anyway for reducing a *controller*: plain balanced truncation of a controller measures the wrong thing, because what matters is the closed-loop behavior, not the controller's own input-output map.
:::

## Check yourself

::: check
Why are the Hankel singular values a fair way to rank states when the eigenvalues of $\mathbf{W}_c$ alone are not?
:::

::: answer
Because $\mathbf{W}_c$ changes by congruence under a change of state coordinates, so its eigenvalues can be moved almost anywhere by rescaling the states. Lesson 2 showed a condition number growing four thousand times from a change of units alone. The product $\mathbf{W}_c\mathbf{W}_o$ changes by *similarity*, so its eigenvalues — and the $\sigma_i = \sqrt{\lambda_i}$ — stay fixed.

They are also the right thing physically. Ranking by $\mathbf{W}_c$ alone would keep states that are easy to excite even if no sensor can see them. Ranking by $\mathbf{W}_o$ alone would keep states no actuator can reach. Only the combination measures a state's contribution to the input-output map.
:::

::: check
A twelve-state model has $\boldsymbol{\sigma} = (44,\ 41,\ 3.1,\ 3.0,\ 0.8,\ 0.79,\ 0.02,\ 0.019,\ 0.004,\ 0.004,\ 0.001,\ 0.001)$. What orders would you consider, and what error can you promise for each?
:::

::: answer
The values come in pairs, so the plant is six lightly damped modes, and the sensible orders are even: $2$, $4$, $6$, $8$, $10$. The bound is twice the sum of what you drop.

- $r = 4$: $2(0.8+0.79+0.02+0.019+0.004+0.004+0.001+0.001) = 2(1.639) = 3.28$.
- $r = 6$: $2(0.02+0.019+0.004+0.004+0.001+0.001) = 2(0.049) = 0.098$.
- $r = 8$: $2(0.004+0.004+0.001+0.001) = 2(0.010) = 0.020$.

The big gap is between $\sigma_6 = 0.79$ and $\sigma_7 = 0.02$, a factor of about $40$. So $r = 6$ is the natural cut, and it promises an error of at most $0.098$. Compare that with the plant's peak gain, which is at least $\sigma_1 = 44$ (the peak gain is never smaller than the largest Hankel singular value): the error is at most about a fifth of a percent. Never cut at $r = 7$, $9$ or $11$, which split a pair.
:::

::: check
You reduce a controller from twenty states to six by balanced truncation. The bound says the error is tiny, and the closed loop goes unstable. What went wrong?
:::

::: answer
Plain balanced truncation keeps the error small in the controller's *own* transfer function, weighted equally at all frequencies. What matters is the closed loop. A controller's small features near crossover — a notch, a lead network, a roll-off — can have a negligible open-loop size while being exactly what holds the margin. Deleting them is cheap by the bound and fatal in the loop.

The fix is frequency-weighted balanced truncation, where the Gramians are computed with weights that emphasize the frequencies the loop cares about, or closed-loop balanced reduction, which measures the error in the closed-loop map directly. As a habit: reduce the *plant* before designing. If a controller must be reduced afterwards, re-check every margin on the reduced one.
:::

::: check
For the appendage model, why do the Hankel singular values come in near-equal pairs, and what would break that?
:::

::: answer
Each lightly damped resonance is a two-state block: the modal position and its rate. Energy sloshes between them every quarter cycle, like a swing trading height for speed. Over a time long compared with the period, neither state is more reachable or more observable than the other, so the two $\sigma$'s are nearly equal — exactly equal in the limit $\zeta\to0$.

Heavy damping breaks the pairing, because the mode stops oscillating and the two states become distinguishable. A real (non-oscillating) mode contributes a single unpaired $\sigma$. A rigid-body integrator breaks it differently: it has no finite Gramian at all and must be split off before balancing.
:::

::: check
The appendage's four-state truncation has a DC gain error of $0.03\,\%$ and its residualization has none. When would you still prefer the truncation?
:::

::: answer
When the high-frequency end is what the design depends on. A truncated model matches $\mathbf{G}$ exactly as $\omega\to\infty$, since both roll off to the same $\mathbf{D}$. A residualized model matches exactly at $\omega = 0$, but it carries a non-zero $\mathbf{D}_r = \mathbf{D}-\mathbf{C}_2\mathbf{A}_{22}^{-1}\mathbf{B}_2$ that does not roll off (for the appendage at $r = 4$, about $6.2\times10^{-5}$).

If you are gain-stabilizing a mode near crossover, designing a roll-off filter, or checking a notch, the truncation is the honest model. If you are designing a servo that will sit at steady state for hours against a disturbance, the residualization is. And three hundredths of a percent of DC gain error is invisible to a loop with an integrator in it, which settles the argument for most attitude designs either way.
:::

## Summary

| Item | Statement |
| --- | --- |
| Hankel singular values | $\sigma_i = \sqrt{\lambda_i(\mathbf{W}_c\mathbf{W}_o)}$; invariant under any similarity transform |
| Meaning | in balanced coordinates, reaching $\mathbf{e}_i$ costs $1/\sigma_i$ of input energy and yields $\sigma_i$ of output energy; the ratio is $\sigma_i^2$ |
| Balanced realization | $\mathbf{W}_c = \mathbf{W}_o = \operatorname{diag}(\sigma_1,\dots,\sigma_n)$ |
| Square-root algorithm | $\mathbf{W}_c = \mathbf{R}\mathbf{R}^\mathsf{T}$, $\mathbf{W}_o = \mathbf{S}\mathbf{S}^\mathsf{T}$, $\mathbf{S}^\mathsf{T}\mathbf{R} = \mathbf{U}\boldsymbol{\Sigma}\mathbf{V}^\mathsf{T}$, $\mathbf{T} = \mathbf{R}\mathbf{V}\boldsymbol{\Sigma}^{-1/2}$ |
| Truncation | keep the top-left $r\times r$ blocks; stable, balanced, keeps $\sigma_1..\sigma_r$ |
| Error bounds | $\sigma_{r+1} \le \|\mathbf{G}-\mathbf{G}_r\|_\infty \le 2\sum_{i>r}\sigma_i$ |
| Worked numbers | $\boldsymbol{\sigma} = (10.391,\ 10.287,\ 0.00505,\ 0.00493,\ 0.00197,\ 0.00194)$; $r=4$ bound $0.00781$, actual $0.00391$ |
| Ranking | by contribution, not frequency: the $4.6\,\mathrm{Hz}$ mode outranked the $1.8\,\mathrm{Hz}$ one |
| Residualization | $\mathbf{A}_r = \mathbf{A}_{11}-\mathbf{A}_{12}\mathbf{A}_{22}^{-1}\mathbf{A}_{21}$ and so on; matches DC exactly, same bound |
| Cut where | at a gap in the $\sigma$ list, never inside a near-equal pair |
| Unstable plants | split stable and unstable parts, or close a loop first; use frequency weighting for controllers |

That closes the module. You can now write a vehicle model and change its coordinates without losing track of what is real. You can test whether your actuators can move it and your sensors can see it, place poles and defend the locations against torque and noise, build an observer, wire the two together and say exactly when that is safe, add integral action, read a MIMO plant's directions and zeros, and cut a fifty-state model down to something a flight computer can run. The **[[optimal control and estimation|next-modules]]** modules that follow replace the two choices you made by hand — where to put the poles, and how fast to make the observer — with a cost function and a noise model, all in the notation of this module.

::: context finite-element How engineers model a bendy structure
A **finite-element model** chops a structure into thousands of small, simple pieces — little beams, plates and shells — each with its own stiffness and mass. A computer stitches them together and finds the structure's natural ways of vibrating, its **modes**, each with a frequency and a shape. A tall, thin rocket has many bending modes. The control engineer never uses all of them; the model reduction in this lesson decides which few to keep.
:::

::: context slosh-word Propellant that moves
**Slosh** is liquid propellant swinging back and forth inside a tank, like water in a carried bucket. The moving liquid pushes on the tank walls and can couple with the vehicle's attitude control. Engineers usually model each sloshing tank as a small pendulum or a mass on a spring, which adds two states per tank per axis to the model. Tanks often carry internal baffles to damp it.
:::

::: context infinity-norm The worst-case gain
The **infinity norm** $\|\mathbf{G}\|_\infty$ of a transfer function is its highest gain at any frequency — the top of its Bode magnitude plot. For the appendage it is $20.68$, at the first resonance. Using it to measure model error means asking: at the worst frequency, how far apart are the full model and the reduced one? A controller cares about exactly that, because its robustness margins are worst-case statements.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <g stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3">
    <line x1="40" y1="70" x2="340" y2="70"/><line x1="40" y1="130" x2="340" y2="130"/>
    <line x1="85" y1="10" x2="85" y2="190"/><line x1="235" y1="10" x2="235" y2="190"/>
  </g>
  <line x1="40" y1="190" x2="340" y2="190" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="190" x2="40" y2="10" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="40.0,89.8 40.8,89.8 41.5,89.8 42.3,89.8 43.0,89.8 43.8,89.7 44.5,89.7 45.3,89.7 46.0,89.7 46.8,89.7 47.5,89.6 48.3,89.6 49.0,89.6 49.8,89.6 50.5,89.5 51.3,89.5 52.0,89.5 52.8,89.5 53.5,89.4 54.3,89.4 55.0,89.4 55.8,89.4 56.5,89.3 57.3,89.3 58.0,89.3 58.8,89.3 59.5,89.2 60.3,89.2 61.1,89.2 61.8,89.1 62.6,89.1 63.3,89.1 64.1,89.0 64.8,89.0 65.6,88.9 66.3,88.9 67.1,88.9 67.8,88.8 68.6,88.8 69.3,88.7 70.1,88.7 70.8,88.6 71.6,88.6 72.3,88.6 73.1,88.5 73.8,88.5 74.6,88.4 75.3,88.3 76.1,88.3 76.8,88.2 77.6,88.2 78.3,88.1 79.1,88.1 79.8,88.0 80.6,87.9 81.4,87.9 82.1,87.8 82.9,87.7 83.6,87.6 84.4,87.6 85.1,87.5 85.9,87.4 86.6,87.3 87.4,87.2 88.1,87.2 88.9,87.1 89.6,87.0 90.4,86.9 91.1,86.8 91.9,86.7 92.6,86.6 93.4,86.5 94.1,86.4 94.9,86.2 95.6,86.1 96.4,86.0 97.1,85.9 97.9,85.7 98.6,85.6 99.4,85.5 100.2,85.3 100.9,85.2 101.7,85.0 102.4,84.9 103.2,84.7 103.9,84.5 104.7,84.3 105.4,84.1 106.2,84.0 106.9,83.8 107.7,83.5 108.4,83.3 109.2,83.1 109.9,82.9 110.7,82.6 111.4,82.4 112.2,82.1 112.9,81.8 113.7,81.5 114.4,81.2 115.2,80.9 115.9,80.6 116.7,80.2 117.4,79.8 118.2,79.4 118.9,79.0 119.7,78.6 120.5,78.1 121.2,77.6 122.0,77.1 122.7,76.6 123.5,76.0 124.2,75.3 125.0,74.6 125.7,73.9 126.5,73.1 127.2,72.2 128.0,71.2 128.7,70.1 129.5,68.9 130.2,67.5 131.0,66.0 131.7,64.2 132.5,62.0 133.2,59.4 134.0,55.9 134.7,51.2 135.5,43.7 136.2,31.1 136.3,30.5 137.0,41.2 137.7,50.2 138.5,55.8 139.2,59.7 140.0,62.9 140.8,65.4 141.5,67.6 142.3,69.5 143.0,71.3 143.8,72.8 144.5,74.2 145.3,75.5 146.0,76.7 146.8,77.9 147.5,78.9 148.3,79.9 149.0,80.9 149.8,81.8 150.5,82.7 151.3,83.5 152.0,84.3 152.8,85.1 153.5,85.8 154.3,86.5 155.0,87.2 155.8,87.9 156.5,88.6 157.3,89.2 158.0,89.8 158.8,90.5 159.5,91.1 160.3,91.6 161.1,92.2 161.8,92.8 162.6,93.3 163.3,93.9 164.1,94.4 164.8,94.9 165.6,95.4 166.3,95.9 167.1,96.4 167.8,96.9 168.6,97.4 169.3,97.9 170.1,98.4 170.8,98.8 171.6,99.3 172.3,99.7 173.1,100.2 173.8,100.6 174.6,101.1 175.3,101.5 176.1,101.9 176.8,102.4 177.6,102.8 178.3,103.2 179.1,103.6 179.8,104.0 180.6,104.4 181.4,104.8 182.1,105.2 182.9,105.6 183.6,106.0 184.4,106.4 185.1,106.8 185.9,107.2 186.6,107.6 187.4,108.0 188.1,108.4 188.9,108.7 189.6,109.1 190.4,109.5 191.1,109.9 191.9,110.2 192.6,110.6 193.4,111.0 194.1,111.3 194.9,111.7 195.6,112.1 196.4,112.4 197.1,112.8 197.9,113.1 198.6,113.5 199.4,113.9 200.2,114.2 200.9,114.6 201.7,114.9 202.4,115.3 203.2,115.6 203.9,116.0 204.7,116.3 205.4,116.7 206.2,117.0 206.9,117.4 207.7,117.7 208.4,118.0 209.2,118.4 209.9,118.7 210.7,119.1 211.4,119.4 212.2,119.7 212.9,120.1 213.7,120.4 214.4,120.8 215.2,121.1 215.9,121.4 216.7,121.8 217.4,122.1 218.2,122.4 218.9,122.8 219.7,123.1 220.5,123.5 221.2,123.8 222.0,124.1 222.7,124.5 223.5,124.8 224.2,125.1 225.0,125.5 225.7,125.8 226.5,126.1 227.2,126.5 228.0,126.8 228.7,127.2 229.5,127.5 230.2,127.8 231.0,128.2 231.7,128.5 232.5,128.9 233.2,129.2 234.0,129.6 234.7,129.9 235.5,130.3 236.2,130.7 237.0,131.1 237.7,131.5 238.5,131.9 239.2,132.4 240.0,132.9 240.8,133.6 241.5,134.6 242.3,136.0 243.0,131.8 243.0,131.7 243.8,130.6 244.5,131.9 245.3,132.7 246.0,133.4 246.8,133.9 247.5,134.3 248.3,134.8 249.0,135.2 249.8,135.6 250.5,135.9 251.3,136.3 252.0,136.7 252.8,137.0 253.5,137.4 254.3,137.7 255.0,138.1 255.8,138.4 256.5,138.8 257.3,139.1 258.0,139.5 258.8,139.8 259.5,140.1 260.3,140.5 261.1,140.8 261.8,141.2 262.6,141.5 263.3,141.9 264.1,142.2 264.8,142.6 265.6,142.9 266.3,143.3 267.1,143.6 267.8,144.0 268.6,144.4 269.3,144.7 270.1,145.1 270.8,145.4 271.6,145.8 272.3,146.2 273.1,146.6 273.8,146.9 274.6,147.3 275.3,147.7 276.1,148.1 276.8,148.5 277.6,148.9 278.3,149.3 279.1,149.7 279.8,150.2 280.6,150.6 281.4,151.0 282.1,151.5 282.9,152.0 283.6,152.4 284.4,152.9 285.1,153.5 285.9,154.0 286.6,154.6 287.4,155.1 288.1,155.8 288.9,156.4 289.6,157.2 290.4,158.0 291.1,158.8 291.9,159.8 292.6,160.8 293.4,162.1 294.1,163.6 294.9,165.4 295.6,167.6 296.4,170.7 297.1,174.9 297.9,180.3 298.6,179.3 299.4,171.2 300.2,164.0 300.9,157.7 301.7,151.7 302.4,145.3 303.2,138.1 303.9,130.9 304.1,129.9 304.7,131.4 305.4,136.3 306.2,140.2 306.9,143.0 307.7,145.2 308.4,146.9 309.2,148.3 309.9,149.5 310.7,150.6 311.4,151.5 312.2,152.4 312.9,153.1 313.7,153.8 314.4,154.5 315.2,155.1 315.9,155.7 316.7,156.3 317.4,156.8 318.2,157.3 318.9,157.8 319.7,158.3 320.5,158.7 321.2,159.2 322.0,159.6 322.7,160.0 323.5,160.5 324.2,160.9 325.0,161.3 325.7,161.7 326.5,162.1 327.2,162.5 328.0,162.8 328.7,163.2 329.5,163.6 330.2,164.0 331.0,164.3 331.7,164.7 332.5,165.0 333.2,165.4 334.0,165.7 334.7,166.1 335.5,166.4 336.2,166.8 337.0,167.1 337.7,167.5 338.5,167.8 339.2,168.1 340.0,168.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="36" y="134">10⁻²</text><text x="36" y="74">1</text><text x="36" y="18">10²</text><text x="36" y="194">10⁻⁴</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="85" y="204">1</text><text x="235" y="204">10</text>
  </g>
  <text x="338" y="204" font-size="11" fill="#1f2a44" text-anchor="end">ω (rad/s)</text>
  <text x="150" y="26" font-size="11" fill="#1f2a44">mode 1: 20.68</text>
  <text x="222" y="118" font-size="11" fill="#1f2a44" text-anchor="end">mode 2</text>
  <text x="312" y="118" font-size="11" fill="#b4232c" text-anchor="end">mode 3</text>
</svg>
```

The small bump at mode 2 sits on top of the other modes' background, so the curve there reads a little higher than mode 2's own peak.
:::

::: context hankel-operator Past in, future out
Picture pushing a swing for a while and then letting go. Everything you did is in the past; all you can watch now is how it keeps swinging. The **Hankel operator** is exactly that map: it takes an input that stops at time zero and returns the output after time zero. Its gains are the Hankel singular values. Whatever the input did must pass through the state at time zero, which is why these values measure how much each state matters.
:::

::: context lyapunov-name Aleksandr Lyapunov
Aleksandr Lyapunov was a Russian mathematician whose 1892 thesis on the stability of motion founded much of modern stability theory. The matrix equation $\mathbf{A}\mathbf{X} + \mathbf{X}\mathbf{A}^\mathsf{T} + \mathbf{Q} = \mathbf{0}$ carries his name because it grew out of that work. For a stable $\mathbf{A}$ it has exactly one solution, and with $\mathbf{Q} = \mathbf{B}\mathbf{B}^\mathsf{T}$ that solution is the controllability Gramian.
:::

::: context cholesky-name A square root for matrices
A symmetric positive definite matrix can be written as $\mathbf{R}\mathbf{R}^\mathsf{T}$ with $\mathbf{R}$ lower triangular — a kind of matrix square root. The method is named after André-Louis Cholesky, a French army officer and surveyor who devised it for map-making calculations; he died in the First World War, and a colleague published it in 1924. It is fast and very stable numerically, which is why the square-root algorithm leans on it.
:::

::: context hsv-gap The gap you cut at
The six Hankel singular values of the appendage on a log scale. Each bar is one state. The pairs sit together, and the gaps between the pairs are where a cut is allowed.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <g stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3">
    <line x1="50" y1="140" x2="340" y2="140"/><line x1="50" y1="110" x2="340" y2="110"/>
    <line x1="50" y1="80" x2="340" y2="80"/><line x1="50" y1="50" x2="340" y2="50"/><line x1="50" y1="20" x2="340" y2="20"/>
  </g>
  <line x1="50" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="170" x2="50" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <g fill="#1d6fd1">
    <rect x="68" y="49.5" width="28" height="120.5"/><rect x="104" y="49.63" width="28" height="120.37"/>
  </g>
  <g fill="#f2b880">
    <rect x="156" y="148.91" width="28" height="21.09"/><rect x="192" y="149.22" width="28" height="20.78"/>
  </g>
  <g fill="#8fb8f0">
    <rect x="244" y="161.17" width="28" height="8.83"/><rect x="280" y="161.38" width="28" height="8.62"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="46" y="174">10⁻³</text><text x="46" y="114">10⁻¹</text><text x="46" y="54">10</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="100" y="186">mode 1</text><text x="188" y="186">mode 3</text><text x="276" y="186">mode 2</text>
  </g>
  <line x1="144" y1="30" x2="144" y2="170" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 3"/>
  <line x1="232" y1="120" x2="232" y2="170" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 3"/>
  <text x="148" y="40" font-size="11" fill="#b4232c">r = 2 (gap ×2000)</text>
  <text x="236" y="132" font-size="11" fill="#b4232c">r = 4 (×2.5)</text>
</svg>
```
:::

::: context singular-perturbation Fast states that settle at once
"Singular perturbation" is the mathematician's name for a simple engineering habit: when some parts of a system are much faster than the rest, pretend they reach their steady value instantly. An electric motor's current settles in milliseconds while the shaft speed takes seconds, so you often treat the current as always settled. Residualization does the same thing to the weak balanced states — it keeps their steady-state effect and drops only their motion.
:::

::: context real-schur Splitting stable from unstable
A **real Schur decomposition** rewrites $\mathbf{A}$, by an orthogonal change of coordinates, as a block upper-triangular matrix. You can order it so that the unstable eigenvalues sit in one diagonal block and the stable ones in the other. A further step removes the coupling block, leaving two separate systems. Reduce the stable one, keep the unstable one exactly, and add their transfer functions back together.
:::

::: context next-modules Where this goes next
In pole placement you picked pole locations by judgment, and in observer design you picked the observer speed by rule of thumb. The **linear quadratic regulator** (LQR) chooses $\mathbf{K}$ by minimizing a cost that trades state error against control effort. The **Kalman filter** chooses $\mathbf{L}$ from models of the process and sensor noise. Both are built from the same $\mathbf{A}$, $\mathbf{B}$, $\mathbf{C}$, Gramians and Lyapunov-style equations you have used here.
:::
