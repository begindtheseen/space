---
id: l08-the-separation-principle
title: The separation principle and exactly when it holds
minutes: 19
covers:
  - The separation principle and the exact conditions under which it holds
---

Lesson 6 designed a gain $\mathbf{K}$ assuming the whole state was on hand. Lesson 7 designed an observer that supplies an estimate $\hat{\mathbf{x}}$ which converges to the state but is not the state. Wiring them together — applying $\mathbf{u} = -\mathbf{K}\hat{\mathbf{x}}$ — is the obvious thing to do and raises an obvious worry. The controller is being fed the wrong signal during every transient. Surely the closed-loop poles are not where either design put them?

They are. For an exact linear time-invariant model, the $2n$ closed-loop eigenvalues are precisely the $n$ eigenvalues of $\mathbf{A}-\mathbf{B}\mathbf{K}$ together with the $n$ eigenvalues of $\mathbf{A}-\mathbf{L}\mathbf{C}$ — nothing moves, nothing interacts. This is the **separation principle**, and it is why the two designs in the last two lessons could be done independently without anybody mentioning it. It is also one of the most over-claimed results in control, because it is a statement about pole locations and people read it as a statement about performance and robustness. It is neither.

This lesson derives the result by choosing the right coordinates, verifies it numerically, lists the conditions it needs one at a time, and then breaks each of them: a model mismatch, which destroys the block-triangular structure outright, and the margin question, where the principle is silent even when it holds perfectly.

## The derivation: choose $(\mathbf{x}, \mathbf{e})$ instead of $(\mathbf{x}, \hat{\mathbf{x}})$

Write the plant and the observer with $\mathbf{u} = -\mathbf{K}\hat{\mathbf{x}}$:

$$\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} - \mathbf{B}\mathbf{K}\hat{\mathbf{x}}, \qquad \dot{\hat{\mathbf{x}}} = \mathbf{A}\hat{\mathbf{x}} - \mathbf{B}\mathbf{K}\hat{\mathbf{x}} + \mathbf{L}\left(\mathbf{C}\mathbf{x} - \mathbf{C}\hat{\mathbf{x}}\right).$$

Stacking $(\mathbf{x}, \hat{\mathbf{x}})$ gives a $2n\times2n$ matrix with entries in every block, and its eigenvalues are not obvious. The trick is to change coordinates to $(\mathbf{x}, \mathbf{e})$ with $\mathbf{e} = \mathbf{x} - \hat{\mathbf{x}}$, a similarity transform with $\mathbf{T}^{-1} = \begin{pmatrix}\mathbf{I}&\mathbf{0}\\\mathbf{I}&-\mathbf{I}\end{pmatrix}$, so the eigenvalues are unchanged by Lesson 2. Substituting $\hat{\mathbf{x}} = \mathbf{x} - \mathbf{e}$ into the first equation,

$$\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} - \mathbf{B}\mathbf{K}(\mathbf{x}-\mathbf{e}) = (\mathbf{A}-\mathbf{B}\mathbf{K})\mathbf{x} + \mathbf{B}\mathbf{K}\mathbf{e},$$

and Lesson 7 already gave $\dot{\mathbf{e}} = (\mathbf{A}-\mathbf{L}\mathbf{C})\mathbf{e}$. Together:

$$\frac{d}{dt}\begin{pmatrix}\mathbf{x}\\\mathbf{e}\end{pmatrix} = \begin{pmatrix}\mathbf{A}-\mathbf{B}\mathbf{K} & \mathbf{B}\mathbf{K}\\ \mathbf{0} & \mathbf{A}-\mathbf{L}\mathbf{C}\end{pmatrix}\begin{pmatrix}\mathbf{x}\\\mathbf{e}\end{pmatrix}.$$

The lower-left block is zero — the state does not feed back into the estimation error — so the matrix is **block upper triangular**. For such a matrix, $\det\left(s\mathbf{I} - \mathbf{M}\right) = \det\left(s\mathbf{I}-\mathbf{M}_{11}\right)\det\left(s\mathbf{I}-\mathbf{M}_{22}\right)$, because the determinant of a block-triangular matrix is the product of the determinants of its diagonal blocks. The characteristic polynomial factors, and the spectrum is the union.

::: key Separation principle
For an exact LTI model, the observer-based closed-loop spectrum is exactly $\operatorname{eig}(\mathbf{A}-\mathbf{B}\mathbf{K}) \cup \operatorname{eig}(\mathbf{A}-\mathbf{L}\mathbf{C})$. It fixes **poles** only — it guarantees nothing about margins (see LQG).
:::

::: example The union, to machine precision
Take the $J = 120\,\mathrm{kg\,m^2}$ spacecraft axis with $\mathbf{A} = \begin{pmatrix}0&1\\0&0\end{pmatrix}$, $\mathbf{B} = (0,\ 1/J)^\mathsf{T}$, $\mathbf{C} = (1\ \ 0)$. Lesson 6 placed the controller poles at $-0.1(1\pm i)$, giving $\mathbf{K} = (2.4,\ 24)$; Lesson 7 placed the observer poles four times faster, at $-0.4(1\pm i)$, giving $\mathbf{L} = (0.8,\ 0.32)^\mathsf{T}$.

The $4\times4$ matrix in $(\mathbf{x},\mathbf{e})$ coordinates is

$$\begin{pmatrix}\mathbf{A}-\mathbf{B}\mathbf{K} & \mathbf{B}\mathbf{K}\\ \mathbf{0}&\mathbf{A}-\mathbf{L}\mathbf{C}\end{pmatrix} = \begin{pmatrix}0 & 1 & 0 & 0\\ -0.02 & -0.2 & 0.02 & 0.2\\ 0&0&-0.8&1\\ 0&0&-0.32&0\end{pmatrix},$$

and its eigenvalues come back as $-0.1\pm0.1i$ and $-0.4\pm0.4i$: the largest discrepancy against the union of the two designed spectra is zero in floating point — not merely small, because the characteristic polynomial factors exactly.

Rebuilding the same loop in the $(\mathbf{x},\hat{\mathbf{x}})$ coordinates any implementation would actually use,

$$\begin{pmatrix}\mathbf{A} & -\mathbf{B}\mathbf{K}\\ \mathbf{L}\mathbf{C} & \mathbf{A}-\mathbf{B}\mathbf{K}-\mathbf{L}\mathbf{C}\end{pmatrix},$$

gives the same four eigenvalues. It is not block triangular, and nothing about it looks separated; only the change of coordinates reveals the structure. That is the whole content of the proof.
:::

## Block triangular is not block diagonal

The coupling block $\mathbf{B}\mathbf{K}$ in the top right is not zero, and it matters. The eigenvalues separate; the **trajectories** do not. Estimation error drives the state through $\mathbf{B}\mathbf{K}\mathbf{e}$, which is the algebraic statement of something physically obvious: if the estimator is wrong, the controller computes a torque the vehicle did not need and applies it.

::: example Estimation error moving a vehicle that was already on target
Start the same closed loop with the vehicle exactly at rest and exactly on target, $\mathbf{x}(0) = \mathbf{0}$, but the estimator initialised $1^\circ$ away, $\mathbf{e}(0) = (0.01745\,\mathrm{rad},\ 0)^\mathsf{T}$. The estimate believes the vehicle is off-pointing, so the controller commands a correction, and the vehicle — which needed no correction — is driven off target.

Propagating the $4\times4$ matrix gives a peak excursion of $0.651^\circ$ at $t = 10.9\,\mathrm{s}$, a peak commanded torque of $0.0872\,\mathrm{N\,m}$, and a return to $0.0035^\circ$ by $60\,\mathrm{s}$. Every eigenvalue involved is exactly where it was designed to be, and the vehicle still made a two-thirds-of-a-degree excursion it did not have to make.

This is the real reason for the two-to-six rule on observer speed. A faster observer kills $\mathbf{e}$ before the controller can act on it; a slower observer lets $\mathbf{B}\mathbf{K}\mathbf{e}$ dominate the early transient. The separation principle says the poles do not care. Whoever is looking at the pointing telemetry does.
:::

## The exact conditions

Go back through the derivation and mark every place an assumption was used. The separation principle holds when, and essentially only when:

1. **The plant is linear and time-invariant**, and the observer is built on the same $\mathbf{A}$, $\mathbf{B}$, $\mathbf{C}$ (and $\mathbf{D}$, if non-zero). The cancellation of $\mathbf{B}\mathbf{u}$ in Lesson 7 needed the observer's $\mathbf{B}$ to be the plant's $\mathbf{B}$; the cancellation of $\mathbf{x}$ needed its $\mathbf{A}$ and $\mathbf{C}$ to match too.
2. **The command applied is the command the observer is told about.** Saturation, rate limits, quantisation, dead band, an unmodelled actuator lag, or a computation delay that the observer does not share all make the applied $\mathbf{u}$ differ from $-\mathbf{K}\hat{\mathbf{x}}$, and the $\mathbf{B}\mathbf{u}$ terms no longer cancel.
3. **The measurement is the modelled measurement.** A sensor misalignment, scale factor, bias or lag that the observer does not carry appears as $(\mathbf{C}-\hat{\mathbf{C}})\mathbf{x}$ driving the error.
4. **Both halves live in the same time base.** A continuous-time $\mathbf{K}$ combined with a discrete observer, or two different discretisations, is not the system whose eigenvalues were computed.

And it is silent about, in every case, even when it holds exactly:

- **Robustness.** Nothing in the derivation bounds what happens when the plant is not what the model says. The next section quantifies that.
- **Noise.** The pole locations say nothing about the size of $\mathbf{e}$ under measurement noise, which Lesson 7's table showed varying by a factor of thirty across the same set of separated poles.
- **Transient magnitude**, for the reason above.

## What model mismatch does

Suppose the observer runs on $(\hat{\mathbf{A}}, \hat{\mathbf{B}}, \hat{\mathbf{C}})$ while the plant is $(\mathbf{A}, \mathbf{B}, \mathbf{C})$. Redo the error derivation:

$$\dot{\mathbf{e}} = \dot{\mathbf{x}} - \dot{\hat{\mathbf{x}}} = \mathbf{A}\mathbf{x} - \mathbf{B}\mathbf{K}\hat{\mathbf{x}} - \left(\hat{\mathbf{A}}\hat{\mathbf{x}} - \hat{\mathbf{B}}\mathbf{K}\hat{\mathbf{x}} + \mathbf{L}\mathbf{C}\mathbf{x} - \mathbf{L}\hat{\mathbf{C}}\hat{\mathbf{x}}\right),$$

and substitute $\hat{\mathbf{x}} = \mathbf{x}-\mathbf{e}$. Collecting the terms in $\mathbf{x}$ gives a lower-left block

$$\mathbf{M}_{21} = \left(\mathbf{A}-\hat{\mathbf{A}}\right) - \left(\mathbf{B}-\hat{\mathbf{B}}\right)\mathbf{K} + \mathbf{L}\left(\hat{\mathbf{C}}-\mathbf{C}\right),$$

which is zero exactly when the three model errors vanish (or conspire to cancel). Any non-zero $\mathbf{M}_{21}$ destroys the block-triangular structure, the characteristic polynomial stops factoring, and the $2n$ eigenvalues become a genuinely coupled set that belongs to neither design.

::: example Twenty percent of inertia
Keep the plant at $J = 120\,\mathrm{kg\,m^2}$ and give the observer $\hat{J} = 144\,\mathrm{kg\,m^2}$, a $20\,\%$ error — entirely realistic for a spacecraft whose propellant mass is uncertain. Only $\mathbf{B}$ differs, so $\mathbf{M}_{21} = -(\mathbf{B}-\hat{\mathbf{B}})\mathbf{K} \ne \mathbf{0}$ and the structure is gone. Forming the $4\times4$ matrix in $(\mathbf{x},\hat{\mathbf{x}})$ coordinates and taking its eigenvalues:

| model | eigenvalues |
| --- | --- |
| exact | $-0.100\pm0.100i$, $-0.400\pm0.400i$ |
| $\hat{J}/J = 1.2$ | $-0.1125\pm0.1009i$, $-0.3708\pm0.3779i$ |
| $\hat{J}/J = 0.8$ | $-0.0865\pm0.0976i$, $-0.4385\pm0.4290i$ |
| $\hat{J}/J = 1.5$ | $-0.1300\pm0.0999i$, $-0.3366\pm0.3531i$ |

Nothing catastrophic happens here — all four remain comfortably stable, and the slow pair moves by around $13\,\%$ for a $20\,\%$ inertia error. Two observations matter more than the numbers. First, the poles no longer belong to either design: there is no longer a "controller pair" and an "observer pair", only four eigenvalues of a coupled system, and you can no longer reason about them separately. Second, the direction of the drift is informative — an *under*-estimated inertia ($\hat J/J = 0.8$) pushes the slow pair *towards* the imaginary axis, to $-0.0865$, which is the dangerous direction. A model that thinks the vehicle is lighter than it is commands less torque than needed and the loop slows down.

Once mismatch is in play the honest procedure is to stop quoting separated poles and start sweeping: build the coupled $2n\times2n$ matrix over the parameter range you expect, and check the whole eigenvalue cloud. That is a four-line computation and it replaces an argument that no longer applies.
:::

## Separation says nothing about margins

The sharpest limitation is the one that costs the most in practice. Even with a perfect model, the observer changes the loop. Break the loop at the plant input. With full state feedback the loop transfer function is

$$L_{\text{fs}}(s) = \mathbf{K}(s\mathbf{I}-\mathbf{A})^{-1}\mathbf{B},$$

whereas with the observer the compensator from $\mathbf{y}$ to $\mathbf{u}$ is $-\mathbf{K}(s\mathbf{I}-\mathbf{A}+\mathbf{B}\mathbf{K}+\mathbf{L}\mathbf{C})^{-1}\mathbf{L}$, so the loop becomes

$$L_{\text{ob}}(s) = \mathbf{K}(s\mathbf{I}-\mathbf{A}+\mathbf{B}\mathbf{K}+\mathbf{L}\mathbf{C})^{-1}\mathbf{L}\;\mathbf{C}(s\mathbf{I}-\mathbf{A})^{-1}\mathbf{B}.$$

These are different functions with different margins, even though they produce identical closed-loop poles. For the $J = 120$ axis above:

| design | crossover | phase margin | gain margin |
| --- | --- | --- | --- |
| full state feedback | $0.220\,\mathrm{rad/s}$ | $65.5^\circ$ | unbounded |
| observer, $r = 2$ | $0.146\,\mathrm{rad/s}$ | $36.6^\circ$ | $10.9\,\mathrm{dB}$ |
| observer, $r = 4$ | $0.176\,\mathrm{rad/s}$ | $45.0^\circ$ | $14.4\,\mathrm{dB}$ |
| observer, $r = 10$ | $0.200\,\mathrm{rad/s}$ | $55.1^\circ$ | $20.9\,\mathrm{dB}$ |
| observer, $r = 30$ | $0.213\,\mathrm{rad/s}$ | $61.6^\circ$ | $29.8\,\mathrm{dB}$ |

Every row has the same four closed-loop eigenvalues in the $r$-matched sense that each was designed to, and the phase margin ranges from $37^\circ$ to $62^\circ$. The observer always removes margin relative to full state feedback, and on this minimum-phase plant the loss shrinks as the observer is made faster — the phenomenon known as loop transfer recovery. That recovery is not free, because Lesson 7's table shows the rate-estimate noise growing as $r^{3/2}$ over the same range, and it is not available at all on a non-minimum-phase plant.

::: warning LQG is the canonical counterexample
Choosing $\mathbf{K}$ by LQR and $\mathbf{L}$ by a Kalman filter and combining them — the LQG controller — is the optimal version of exactly this architecture, and the separation principle holds for it exactly. LQR alone comes with guaranteed margins: at least $60^\circ$ of phase margin and gain margin from $0.5$ to infinity, for any positive weights. Doyle showed in 1978 that the combination has **no** guaranteed margins whatsoever: there are plants and noise models for which the LQG loop's gain margin is arbitrarily close to $1$, even though the LQR half and the Kalman half are each individually excellent. Separation is a statement about poles. Robustness has to be computed, every time, on the loop you are actually going to fly.
:::

```python
import numpy as np

J, a, r = 120.0, 0.1, 4.0
A = np.array([[0.0, 1], [0, 0]])
B = np.array([[0.0], [1 / J]])
C = np.array([[1.0, 0]])
K = np.array([[2 * a * a * J, 2 * a * J]])
L = np.array([[2 * r * a], [2 * r * r * a * a]])

def separation_check(A, B, C, K, L):           # exact model, (x, e) coordinates
    Z = np.zeros_like(A)
    combined = np.block([[A - B @ K, B @ K], [Z, A - L @ C]])
    union = np.concatenate([np.linalg.eigvals(A - B @ K), np.linalg.eigvals(A - L @ C)])
    return np.sort_complex(np.linalg.eigvals(combined)), np.sort_complex(union)

def mismatched(A, B, C, K, L, Bhat):          # observer built on Bhat, (x, xhat)
    M = np.block([[A, -B @ K], [L @ C, A - Bhat @ K - L @ C]])
    return np.sort_complex(np.linalg.eigvals(M))

comb, union = separation_check(A, B, C, K, L)
print("exact model, max |difference| =", np.abs(comb - union).max())
print("20% inertia error:", np.round(mismatched(A, B, C, K, L,
                                                np.array([[0.0], [1 / (1.2 * J)]])), 4))
# exact model, max |difference| = 0.0
# 20% inertia error: [-0.3708-0.3779j -0.3708+0.3779j -0.1125-0.1009j -0.1125+0.1009j]
```

## Check yourself

::: check
Show that the closed-loop characteristic polynomial of the observer-based loop is $\det(s\mathbf{I}-\mathbf{A}+\mathbf{B}\mathbf{K})\cdot\det(s\mathbf{I}-\mathbf{A}+\mathbf{L}\mathbf{C})$, and identify which step needs an exact model.
:::

::: answer
In $(\mathbf{x},\mathbf{e})$ coordinates the closed-loop matrix is $\begin{pmatrix}\mathbf{A}-\mathbf{B}\mathbf{K}&\mathbf{B}\mathbf{K}\\\mathbf{0}&\mathbf{A}-\mathbf{L}\mathbf{C}\end{pmatrix}$. The determinant of a block-triangular matrix is the product of its diagonal blocks' determinants, so $\det(s\mathbf{I}-\mathbf{M}) = \det(s\mathbf{I}-\mathbf{A}+\mathbf{B}\mathbf{K})\det(s\mathbf{I}-\mathbf{A}+\mathbf{L}\mathbf{C})$, and since a change of coordinates preserves eigenvalues this is the polynomial of the physical loop too. The step that needs an exact model is the zero in the lower-left block, which came from $\dot{\mathbf{e}} = (\mathbf{A}-\mathbf{L}\mathbf{C})\mathbf{e}$ having no $\mathbf{x}$ term. With a mismatched model that block is $(\mathbf{A}-\hat{\mathbf{A}}) - (\mathbf{B}-\hat{\mathbf{B}})\mathbf{K} + \mathbf{L}(\hat{\mathbf{C}}-\mathbf{C})$ and nothing factors.
:::

::: check
An observer-based loop is verified in simulation and the eigenvalues come out as the exact union. On hardware, the vehicle oscillates at a frequency that is in neither design. Name three candidate causes.
:::

::: answer
Any of the four conditions could have failed. Most likely: actuator saturation — the applied command differs from $-\mathbf{K}\hat{\mathbf{x}}$ during the transient, so the loop is not linear and the eigenvalue argument does not apply at all, and the oscillation is a limit cycle. Second: a model error large enough to couple the two halves, since the mismatch block scales with $\mathbf{K}$ and a high-gain controller amplifies a small $\Delta\mathbf{B}$ into a large $\mathbf{M}_{21}$. Third: unmodelled dynamics the simulation did not have — a structural mode, a sensor filter, or a computation delay — which adds states the $2n$ analysis never contained. A fourth possibility worth checking early is a discretisation mismatch between the controller and the observer rates.
:::

::: check
The separation principle holds exactly, and yet the pointing jitter triples when the observer poles are moved from $-0.4(1\pm i)$ to $-1.0(1\pm i)$. Is this a contradiction?
:::

::: answer
No. The principle constrains eigenvalue locations and nothing else. Moving the observer poles changes $\mathbf{L}$, and $\mathbf{L}$ multiplies measurement noise into the estimate, from which $-\mathbf{K}\hat{\mathbf{x}}$ carries it into the actuator; Lesson 7's numbers give a factor of $10^{3/2} \approx 3.2$ in rate-estimate noise between those two choices, which matches the observed tripling. Poles are a property of the homogeneous system; jitter is a property of the system driven by noise, and the two are answered by different calculations — eigenvalues for the first, a Lyapunov equation or a covariance propagation for the second.
:::

::: check
Why does an anti-windup scheme matter more for an observer-based controller than for a plain PID loop?
:::

::: answer
Because saturation breaks the observer as well as the controller. When the actuator saturates, the plant receives a command different from $-\mathbf{K}\hat{\mathbf{x}}$, but the observer propagates its model with the command it *thinks* was applied, so the $\mathbf{B}\mathbf{u}$ terms no longer cancel and the estimate diverges from the true state exactly when the vehicle is furthest from where you want it. The estimate that comes back is wrong, the loop unsaturates into a transient the design never contemplated, and every separated pole is irrelevant during the episode. The fix is the same principle as PID anti-windup but applied one level deeper: feed the observer the command the actuator *actually* delivered, which requires either telemetry from the actuator or a model of its limit inside the flight software.
:::

::: check
For the $J = 120$ axis, the full-state loop has $65.5^\circ$ of phase margin and the observer-based loop with $r = 2$ has $36.6^\circ$. Both have the same four closed-loop poles as designed. Which number would you put in a design review, and what would you do about it?
:::

::: answer
The observer-based number, $36.6^\circ$, because that is the loop the vehicle flies; the full-state figure describes a controller you cannot build without measuring the rate directly. It is below the $45^\circ$ most programmes require, so something has to change. Options in rough order of preference: speed the observer up to $r = 4$, which recovers the margin to $45.0^\circ$ at the cost of a factor of $2.8$ in rate-estimate noise; add a rate gyro so $\mathbf{C}$ includes $\omega$ and the observer has less to reconstruct; or slow the controller, which reduces $\mathbf{K}$ and with it the sensitivity to estimation error. What is not acceptable is to quote the separated poles and stop, which is precisely the failure mode this lesson exists to prevent.
:::

## Summary

| Item | Statement |
| --- | --- |
| Architecture | $\mathbf{u} = -\mathbf{K}\hat{\mathbf{x}}$ with $\dot{\hat{\mathbf{x}}} = \mathbf{A}\hat{\mathbf{x}}+\mathbf{B}\mathbf{u}+\mathbf{L}(\mathbf{y}-\mathbf{C}\hat{\mathbf{x}})$ |
| Key coordinates | $(\mathbf{x},\mathbf{e})$ with $\mathbf{e} = \mathbf{x}-\hat{\mathbf{x}}$; a similarity transform, so eigenvalues are preserved |
| Closed-loop matrix | $\begin{pmatrix}\mathbf{A}-\mathbf{B}\mathbf{K}&\mathbf{B}\mathbf{K}\\\mathbf{0}&\mathbf{A}-\mathbf{L}\mathbf{C}\end{pmatrix}$ — block upper triangular |
| Separation principle | spectrum $= \operatorname{eig}(\mathbf{A}-\mathbf{B}\mathbf{K}) \cup \operatorname{eig}(\mathbf{A}-\mathbf{L}\mathbf{C})$, exactly |
| Conditions | exact LTI model in the observer; the applied command is the modelled one; the measurement is the modelled one; one time base |
| Not block diagonal | $\mathbf{B}\mathbf{K}\mathbf{e}$ drives the state: estimation error moves the vehicle even with separated poles |
| Mismatch block | $\mathbf{M}_{21} = (\mathbf{A}-\hat{\mathbf{A}}) - (\mathbf{B}-\hat{\mathbf{B}})\mathbf{K} + \mathbf{L}(\hat{\mathbf{C}}-\mathbf{C})$; non-zero means no factorisation |
| Margins | $L_{\text{ob}} = \mathbf{K}(s\mathbf{I}-\mathbf{A}+\mathbf{B}\mathbf{K}+\mathbf{L}\mathbf{C})^{-1}\mathbf{L}\,\mathbf{C}(s\mathbf{I}-\mathbf{A})^{-1}\mathbf{B} \ne L_{\text{fs}}$ |
| LQG | separation holds exactly and there are no guaranteed margins at all (Doyle, 1978) |

The controller so far drives the state to zero. A real vehicle has to hold a commanded attitude against a steady disturbance torque, and state feedback alone leaves an offset. The next lesson adds the missing integrator, in the state-space way.
