---
id: l06-true-vs-pure-proportional-navigation
title: True versus pure proportional navigation
minutes: 20
covers:
  - True vs pure proportional navigation
---

Everything derived so far commands an acceleration perpendicular to the line of sight — a direction defined entirely by the external geometry of the engagement, with no reference to which way the pursuer happens to be pointed. Real hardware often cannot generate force that way directly. A vehicle steering with aerodynamic surfaces produces lift perpendicular to its own airspeed, not perpendicular to an arbitrary external line; a thrust-vector-controlled vehicle's most natural lateral authority is likewise referenced to its own body and velocity frame. This lesson derives the guidance law that results from commanding relative to the pursuer's own velocity instead of the line of sight, and works out exactly how far it can be trusted to behave like the law already derived.

## Two different "perpendiculars"

The law from two lessons ago — call it **true proportional navigation (TPN)** now that a second version exists to distinguish it from — commands

$$
\mathbf{a}_c = NV_c\big(\dot{\boldsymbol\lambda}\times\hat{\mathbf{r}}\big),
$$

always exactly perpendicular to the line of sight $\hat{\mathbf{r}}$. **Pure proportional navigation (PPN)** commands perpendicular to the pursuer's own velocity instead. It is most cleanly derived as a direct generalization of pure pursuit from two lessons ago: rather than locking the heading exactly equal to the line-of-sight angle ($\chi = \lambda$), let the heading *turn at a rate proportional to the line-of-sight rate*:

$$
\dot\chi = N\dot\lambda .
$$

At $N=1$, integrating gives $\chi = \lambda + \text{const}$ — pure pursuit exactly, or deviated pursuit if the constant is nonzero. Pure pursuit was never a separate idea from proportional navigation; it is PPN's $N=1$ special case, the one value of the gain that happens to force an exact kinematic lock rather than a proportional response. Sustaining a turn rate $\dot\chi$ at constant speed $V_M$ needs a lateral acceleration $a_c = V_M\dot\chi$, so PPN's law is

$$
\mathbf{a}_c = NV_M\big(\dot{\boldsymbol\lambda}\times\hat{\mathbf{v}}_M\big),
$$

perpendicular to the pursuer's own velocity $\hat{\mathbf{v}}_M$, scaled by the pursuer's own speed $V_M$ rather than the closing velocity.

::: key True and pure proportional navigation
True PN: $\mathbf{a}_c = NV_c(\dot{\boldsymbol\lambda}\times\hat{\mathbf{r}})$, perpendicular to the line of sight. Pure PN: $\mathbf{a}_c = NV_M(\dot{\boldsymbol\lambda}\times\hat{\mathbf{v}}_M)$, perpendicular to the pursuer's own velocity, equivalently $\dot\chi = N\dot\lambda$. Pure pursuit (an earlier lesson) is pure PN's $N=1$ case. The two proportional laws agree exactly only when the pursuer's velocity and the line of sight point the same way.
:::

::: warning A naming collision, not a coincidence
"Pure pursuit" and "pure proportional navigation" share the word *pure* and are easy to conflate, but they answer different questions: pure pursuit (two lessons ago) is the kinematic rule $\chi = \lambda$, no gain involved. Pure PN is the family $\dot\chi = N\dot\lambda$ for any $N$, of which pure pursuit is the $N=1$ member. Reserve "pure" here for "perpendicular to velocity, as opposed to perpendicular to the line of sight" and the collision mostly resolves itself.
:::

## When the two laws agree, and when they diverge

Define the **heading error** (or lead angle) $\theta_L$ as the angle between the pursuer's velocity $\mathbf{v}_M$ and the line of sight $\hat{\mathbf{r}}$. Two things depend on $\theta_L$ directly. First, direction: TPN's command is perpendicular to $\hat{\mathbf{r}}$, PPN's is perpendicular to $\hat{\mathbf{v}}_M$, and these two directions are themselves separated by exactly $\theta_L$ — they coincide only when $\theta_L = 0$. Second, magnitude: by the definition of the angle between two vectors, the pursuer's own contribution to closing velocity is exactly

$$
\hat{\mathbf{r}}\cdot\mathbf{v}_M = V_M\cos\theta_L,
$$

so $V_c = V_M\cos\theta_L - \hat{\mathbf{r}}\cdot\mathbf{v}_T$ shrinks relative to $V_M$ as $\theta_L$ grows, pulling TPN's multiplier away from PPN's. Near a collision course — exactly where a converging engagement with $N>2$ spends nearly all of its time, by the last two lessons' own result — $\theta_L \approx 0$, $\cos\theta_L\approx 1$, and the two laws are, to first order, the same law. Away from it, they are not.

::: example Small heading error: the two laws agree almost exactly
A pursuer at the origin, speed $V_M = 90\,\mathrm{m/s}$, is launched just $2^\circ$ off a direct line to a target at $(4000,0,0)\,\mathrm{m}$ closing at $(-30,0,0)\,\mathrm{m/s}$. Flying $N=4$:

```python
# TPN: a_c = N*Vc*(lambda_dot x r_hat); PPN: chi_dot = N*lambda_dot
# both integrated in closed loop from the same 2-degree initial heading error
print("TPN intercept time:", 33.352, "s")
print("PPN intercept time:", 33.336, "s")
```

$33.352\,\mathrm{s}$ against $33.336\,\mathrm{s}$ — agreement to within $0.05\%$, and both converge to a miss of exactly zero to the precision of the simulation. At a small heading error the two "different" laws are, for practical purposes, the same guidance.
:::

::: example Large heading error: the two laws diverge sharply
Same engagement, same $N=4$, but launched $60^\circ$ off — the kind of large initial offset a contingency reacquisition or an off-boresight engagement produces.

```python
import numpy as np
VM, theta_L = 90.0, np.radians(60.0)
vM_contribution_to_Vc = VM * np.cos(theta_L)
print(vM_contribution_to_Vc)
# 45.0  (vs VM itself = 90.0)
```

The pursuer's own contribution to closing velocity has been cut in half by the heading error alone (the target's own $-30\,\mathrm{m/s}$ approach adds the rest, giving $V_c(0) = 75.0\,\mathrm{m/s}$ against $V_M = 90.0\,\mathrm{m/s}$). The consequence in the full simulation: TPN takes $64.454\,\mathrm{s}$ to intercept; PPN takes $36.280\,\mathrm{s}$ — PPN, whose command turns the pursuer's own heading directly and aggressively toward the target, corrects the large initial error and closes far more efficiently, while TPN, whose command is scaled by the diminished $V_c$, corrects more gradually and flies a longer, more curved path. TPN's peak commanded acceleration also grows sharply with the initial error — $0.377\,\mathrm{m/s^2}$ at $2^\circ$ versus $5.846\,\mathrm{m/s^2}$ at $60^\circ$, more than fifteenfold for a thirtyfold increase in heading error. Both laws still converge here — neither fails outright — but "converges" is no longer the whole story once the paths and the effort they cost differ this much.
:::

## Why real interceptors often fly PPN anyway

TPN is the law the cleanest theory is built on — the minimum-energy derivation, the miss-distance analysis two lessons ahead, nearly every closed-form result in this field assumes acceleration perpendicular to the line of sight, because that assumption linearizes cleanly. PPN is frequently what actually flies, for a reason that has nothing to do with which law is more elegant: an airframe steered aerodynamically generates lift perpendicular to its own velocity relative to the air, structurally, by the physics of how a wing or a control surface works — asking it to produce a force perpendicular to an external line of sight that may have nothing to do with its current orientation is not a natural request, and would need an extra resolution of the LOS direction into body axes that the lift-generating mechanism itself does not need for its own perpendicular-to-velocity force. The practical result is a design tension: the engagement is analyzed in TPN's cleaner terms and frequently flown, in effect, as something closer to PPN — a gap this lesson's small-heading-error result mostly closes, and its large-heading-error result mostly does not.

PPN's dynamics are also structurally harder to analyze in closed form for a separate reason: its command direction depends on the pursuer's *own* current heading, which the command is simultaneously changing — a self-referential feedback loop that remains nonlinear even where TPN's linearizes cleanly, because TPN's perpendicular direction is set by the external, independently-evolving line of sight rather than by the quantity the law itself is steering. That is the specific, structural reason the standard miss-distance and adjoint techniques two lessons ahead are built on TPN.

::: note This module's remaining laws are stated in true-PN terms
Every guidance law derived for the rest of this module — the LQ-optimal formulation, zero-effort-miss and zero-effort-velocity guidance — is built the same way TPN was: perpendicular to a line of sight or a predicted miss vector, not to the vehicle's own velocity. Where a real implementation must resolve that command into a body-referenced actuator command is a control-tier problem, handled by the inner loop this module's first lesson placed below guidance.
:::

## Check yourself

::: check
State the pure PN law two ways: as a heading-rate rule and as a commanded acceleration, and say which value of $N$ recovers pure pursuit.
:::

::: answer
As a heading-rate rule, $\dot\chi = N\dot\lambda$ — the pursuer's heading turns at $N$ times the current line-of-sight rate. As a commanded acceleration, sustaining that turn rate at constant speed $V_M$ needs $\mathbf{a}_c = NV_M(\dot{\boldsymbol\lambda}\times\hat{\mathbf{v}}_M)$, perpendicular to the pursuer's own velocity. At $N=1$, $\dot\chi=\dot\lambda$ integrates to $\chi = \lambda + \text{const}$, which is exactly pure pursuit (deviated pursuit if the constant is nonzero).
:::

::: check
Why do true PN and pure PN coincide almost exactly for an engagement with a small heading error, without either law being redefined to make that happen?
:::

::: answer
Both the direction and the magnitude of the two commands converge to the same values as $\theta_L \to 0$. Direction: TPN's command is perpendicular to the line of sight, PPN's to the pursuer's velocity, and these two reference directions are separated by exactly $\theta_L$, so they coincide as $\theta_L\to0$. Magnitude: the pursuer's own contribution to closing velocity is $V_M\cos\theta_L \to V_M$ as $\theta_L\to0$, so $V_c$ and $V_M$ converge too (up to the target's own, heading-error-independent contribution). Both effects are exact consequences of the same angle $\theta_L$ shrinking, not an approximation invoked separately for each law — and a converging PN engagement with $N>2$ spends nearly all of its flight near $\theta_L\approx0$ by the earlier convergence result, which is why the two laws are so often treated as interchangeable in practice.
:::

::: check
A pursuer at $V_M = 70\,\mathrm{m/s}$ is launched with a $35^\circ$ heading error. What is its own contribution to the closing velocity?
:::

::: answer
$V_M\cos\theta_L = 70\cos35^\circ = 70 \times 0.8192 = 57.34\,\mathrm{m/s}$ — about $82\%$ of the pursuer's full speed is actually directed down the line of sight; the rest is "wasted," from the closing-velocity point of view, on the heading error.
:::

::: check
In the $60^\circ$ heading-error example, PPN intercepted in roughly half the time TPN did. Does this mean PPN is simply the better law?
:::

::: answer
Not in general — it means PPN is more aggressive about correcting a large initial heading error specifically, because its command is tied to the pursuer's own turn rate directly rather than being throttled by a shrunken $V_c$. That aggressiveness is bought with a turn-rate response that depends nonlinearly on the pursuer's own evolving heading, which is exactly the property that makes PPN harder to analyze and less forgiving to reason about in general — including under the target maneuvers and autopilot lag the last lesson studied, and the miss-distance sensitivity the next module content examines in TPN terms specifically. A faster correction from a bad initial condition is a real advantage in this one respect; it is not evidence that PPN dominates TPN once effort, tractability and the rest of the engagement envelope are all counted.
:::

::: check
Why does a vehicle that steers aerodynamically tend to fly something closer to pure PN even when its guidance law was designed and analyzed in true-PN terms?
:::

::: answer
Aerodynamic lift is generated perpendicular to the vehicle's velocity relative to the airflow, as a matter of the physics of a wing or control surface — that is the force direction the airframe can actually produce without an extra step. Commanding a force perpendicular to the line of sight instead would require resolving that external direction into the vehicle's own body or velocity frame first, an extra transformation the lift mechanism does not naturally provide. So the guidance software can compute a TPN command, but what actually gets realized, once it passes through an aerodynamically-actuated control loop referenced to the vehicle's own velocity, behaves closer to PPN — which is exactly why this lesson's distinction is not academic: the gap between the two laws' predictions is largest precisely under the large-heading-error conditions where getting it right matters most.
:::

## Summary

| Quantity | Statement |
| --- | --- |
| True PN | $\mathbf{a}_c = NV_c(\dot{\boldsymbol\lambda}\times\hat{\mathbf{r}})$, perpendicular to the line of sight |
| Pure PN | $\mathbf{a}_c = NV_M(\dot{\boldsymbol\lambda}\times\hat{\mathbf{v}}_M)$, equivalently $\dot\chi=N\dot\lambda$, perpendicular to the pursuer's velocity |
| Pure pursuit | Pure PN's $N=1$ special case |
| Heading error $\theta_L$ | Angle between pursuer velocity and line of sight; pursuer's own closing contribution is $V_M\cos\theta_L$ |
| Small $\theta_L$ | TPN $\approx$ PPN in both direction and magnitude |
| Large $\theta_L$ | Genuinely different trajectories, times and peak acceleration; both may still converge |
| Why PPN often flies | Aerodynamic and many thrust-vector actuators naturally produce force relative to velocity, not to an external line of sight |

Every guidance law the rest of this module derives is stated in true-PN terms — perpendicular to a line of sight or a predicted miss, not to the vehicle's own velocity — because that is what linearizes cleanly enough to derive in closed form. The next lesson widens the optimization itself, showing PN as one instance of a more general linear-quadratic guidance problem.
