---
id: l05-navigation-constant-and-augmented-pn
title: Choosing N, and proportional navigation for a maneuvering target
minutes: 22
covers:
  - Why N between 3 and 5; augmented proportional navigation for manoeuvring targets
---

The last lesson showed that any $N > 2$ makes proportional navigation converge — the line-of-sight rate collapses toward zero as intercept approaches, however slowly. That leaves a wide-open question: given that $N=2.1$ and $N=8$ both converge, what actually decides where a real system sets $N$? The answer has three separate pieces — one value is provably optimal in a precise sense, real hardware pushes away from it in one direction, and a maneuvering target changes the law itself rather than just the constant. This lesson derives all three.

## The minimum-energy derivation of N = 3

Pose the sharpest possible version of terminal guidance: against a non-maneuvering target, choose the lateral acceleration history $u(\tau)$ over the remaining flight, $\tau \in [0, t_{go}]$, to drive the miss exactly to zero while spending as little control effort as possible — minimize $\tfrac12\int_0^{t_{go}} u^2\,d\tau$ subject to hitting the target. Work in the pursuer's own absolute transverse coordinate: $\dot x_1 = x_2$, $\dot x_2 = u$, with $x_1(0) = r_0$, $x_2(0) = v_0$, and the terminal constraint $x_1(t_{go}) = r_f$ (hit the target), $x_2(t_{go})$ free (the terminal *velocity* is not constrained — this problem asks only for a hit, which is what plain PN, as opposed to the soft-landing law two lessons ahead, is for).

The Hamiltonian is $H = \tfrac12u^2 + \lambda_1 x_2 + \lambda_2 u$, giving $u^\star = -\lambda_2$ from stationarity. The costate equations are $\dot\lambda_1 = 0$ (so $\lambda_1 = c_1$, constant) and $\dot\lambda_2 = -\lambda_1 = -c_1$, so $\lambda_2(\tau) = \lambda_2(0) - c_1\tau$. Free terminal $x_2$ gives the transversality condition $\lambda_2(t_{go}) = 0$, fixing $\lambda_2(0) = c_1 t_{go}$ and hence $\lambda_2(\tau) = c_1(t_{go}-\tau)$, so $u^\star(\tau) = -c_1(t_{go}-\tau)$ — affine in time, exactly the bang-free, smoothly-varying profile a minimum-energy solution should be.

Integrating this control into the dynamics and imposing $x_1(t_{go}) = r_f$ gives, after collecting terms,

$$
c_1 = \frac{-3\big(r_f - r_0 - v_0 t_{go}\big)}{t_{go}^3} = \frac{-3\,ZEM}{t_{go}^3}, \qquad ZEM \equiv r_f - (r_0 + v_0 t_{go}),
$$

the same zero-effort-miss quantity a later lesson names in full — here it is exactly the miss you would get by coasting from where you are, unpowered, to the end of the flight. The command right now, $\tau=0$, is

$$
u^\star(0) = -\lambda_2(0) = -c_1 t_{go} = \frac{3\,ZEM}{t_{go}^2}.
$$

The last lesson already established, from the exact LOS-rate kinematics, that $ZEM/t_{go}^2 = V_c\dot\lambda$ for a non-maneuvering target. Substituting: $u^\star(0) = 3V_c\dot\lambda$ — exactly the proportional navigation law, with $N=3$. **Minimum-effort interception against a non-maneuvering target is proportional navigation with the navigation constant fixed at exactly three.** No other value of $N$ spends less control energy to guarantee a hit.

::: key N = 3 is the minimum-energy navigation constant
Minimizing $\int u^2\,d\tau$ subject to zero terminal miss (free terminal velocity) against a non-maneuvering target gives $u^\star(0) = 3\,ZEM/t_{go}^2 = 3V_c\dot\lambda$ exactly. $N=3$ is not a convenient round number; it is the unique output of this optimization.
:::

::: example Confirming N = 3 by direct numerical optimization
Rather than trust the algebra alone, solve the same problem by brute-force constrained optimization: discretize $u(\tau)$ into $400$ segments over $T=12\,\mathrm{s}$, starting from $r_0=40\,\mathrm{m}$, $v_0=-3\,\mathrm{m/s}$ (so $ZEM = 0-(40 + (-3)(12)) = -4.0\,\mathrm{m}$), and minimize $\sum u_i^2\Delta\tau$ subject to the terminal position landing exactly on zero.

```python
from scipy.optimize import minimize, NonlinearConstraint
import numpy as np
T, n = 12.0, 400
dt = T / n
y0, ydot0 = 40.0, -3.0

def terminal_y(u):
    ydot = np.concatenate(([ydot0], ydot0 + np.cumsum(u)*dt))
    return y0 + np.sum(0.5*(ydot[:-1]+ydot[1:]))*dt

res = minimize(lambda u: np.sum(u**2)*dt, np.zeros(n),
                constraints=[NonlinearConstraint(terminal_y, 0.0, 0.0)],
                method='SLSQP', options={'maxiter': 500, 'ftol': 1e-14})
print(res.x[0], res.x[-1], terminal_y(res.x))
# -0.083229...  -0.000104...  7.1e-15
```

The closed form predicts $u^\star(0) = 3(-4.0)/12^2 = -0.08333$; the optimizer, knowing nothing about the derivation above, independently finds $-0.083229$ — a discretization-level match — and $u^\star(t_{go}) \approx 0$, exactly as $\lambda_2(t_{go})=0$ demands. A linear fit of the entire optimized profile against $\tau$ recovers $a = -0.083333$ and $b = 0.006944$, matching $3ZEM/t_{go}^2$ and $-3ZEM/t_{go}^3$ to five decimal places, and the achieved cost, $0.027778$, matches the closed-form minimum $3\,ZEM^2/t_{go}^3$ to the same precision. Three independent routes — the algebra, the optimizer, and the closed-form cost — agree.
:::

## Why real systems fly N = 4 or 5 instead

Three is optimal for a problem real terminal guidance never quite faces: instantaneous, noise-free knowledge of $\dot\lambda$, a target that never maneuvers, and actuators that respond with no delay. Departing from three costs control effort — but buys margin against every one of those idealizations, and the same closed form from the last lesson says exactly how much.

**The cost is linear and easy to price.** For the same engagement geometry, $a_c = NV_c\dot\lambda$ scales with $N$ directly:

::: example What N actually costs, and what it buys against a late disturbance
For the snapshot engagement from the last lesson ($V_c = 112.08\,\mathrm{m/s}$, $\dot\lambda = 0.014627\,\mathrm{rad/s}$):

| $N$ | $a_c = NV_c\dot\lambda$ |
| --- | --- |
| $3$ | $4.918\,\mathrm{m/s^2}$ |
| $4$ | $6.558\,\mathrm{m/s^2}$ |
| $5$ | $8.197\,\mathrm{m/s^2}$ |
| $6$ | $9.836\,\mathrm{m/s^2}$ |

Doubling $N$ from three to six doubles the peak lateral acceleration demanded of the same thruster or control surface — a real, hard constraint on real hardware.

Now the benefit, using the last lesson's decay law $\dot\lambda(t_{go}) = \dot\lambda_0(t_{go}/t_{go,0})^{N-2}$ directly: because the underlying ODE depends only on *remaining* time, the same law governs how quickly PN suppresses a disturbance introduced partway through the flight, not only one present from the start. A disturbance to $\dot\lambda$ appearing with $7\,\mathrm{s}$ left — a late target jink, or the tracking error an autopilot's lag has been quietly building — decays by the time $0.7\,\mathrm{s}$ remain by a factor of $(0.7/7)^{N-2} = 0.1^{N-2}$:

```python
for N in (3, 4, 5):
    print(N, 0.1**(N - 2))
# 3 0.1
# 4 0.010000000000000002
# 5 0.0010000000000000002
```

At $N=3$ the disturbance survives at $10\%$ of its original size; at $N=4$, at $1\%$; at $N=5$, at $0.1\%$ — three orders of magnitude of extra suppression for one extra unit of $N$, verified against the exact ODE solution starting from $t_{go}=7\,\mathrm{s}$ down to $0.7\,\mathrm{s}$. That is the entire case for flying above the bare minimum-energy value: every unit of $N$ above $2$ buys a faster power-law rejection of exactly the errors real hardware and real targets introduce late in the flight, when there is the least time left to recover from them.
:::

Against that benefit, two costs argue for stopping well short of pushing $N$ arbitrarily high. Peak acceleration, shown above, grows linearly and eventually saturates real actuators. And because the command is literally $NV_c\dot\lambda$, any noise on the measured line-of-sight rate — which a real seeker or relative-navigation solution always carries, and which the time-to-go lesson later in this module shows worsens sharply as range collapses — is amplified by that same factor of $N$ directly into the commanded acceleration. Three to five is where these pull in opposite directions land for most real seekers and autopilots: enough above the theoretical minimum to reject a late disturbance by one to two orders of magnitude, not so far above it that peak acceleration or noise sensitivity dominates the design.

::: warning A bigger N is not a free upgrade
It is tempting to read "higher N rejects disturbances faster" and conclude the highest tolerable $N$ is always best. The peak-acceleration and noise-amplification costs are not corner cases — they are the same size order as the benefit, which is exactly why real systems land in a narrow band rather than at the highest $N$ an airframe can physically survive. Treat $3$–$5$ as the result of a real trade, not a rule of thumb to round up from.
:::

## Augmented proportional navigation

Plain PN's derivation assumed $\mathbf{a}_T = 0$. Redo it with a target that carries a known, roughly constant lateral acceleration $\mathbf{a}_T$ — the dynamics become $\dot x_2 = a_T - u$ in the relative-separation coordinate (target's contribution adds, the pursuer's own commanded acceleration subtracts from the *gap*), with the same cost and the same terminal constraints as before. Carrying $a_T$ through the identical Pontryagin argument adds one term to $c_1$ from the $\tfrac12 a_T t_{go}^2$ the target's own coast contributes to the predicted miss, and the $\tau=0$ command becomes

$$
u^\star(0) = \frac{3\big(y_0 + \dot y_0 t_{go} + \tfrac12 a_T t_{go}^2\big)}{t_{go}^2} = 3V_c\dot\lambda + \frac{3}{2}a_T,
$$

which, generalized to any navigation constant the same way plain PN was, is **augmented proportional navigation (APN)**:

$$
\mathbf{a}_c = N V_c\big(\dot{\boldsymbol\lambda}\times\hat{\mathbf{r}}\big) + \frac{N}{2}\mathbf{a}_T.
$$

::: key Augmented proportional navigation
$$
\mathbf{a}_c = NV_c\dot{\boldsymbol\lambda} + \frac{N}{2}\mathbf{a}_T
$$
(scalar form, perpendicular to the LOS). The extra term is the exact optimal feedforward against a known, roughly constant target acceleration — not a heuristic patch, but the same minimum-energy derivation carried through with $\mathbf{a}_T \ne 0$.
:::

The PN term still does the job of nulling whatever line-of-sight rate is currently measured; the new term does something plain PN structurally cannot — it cancels the target's own contribution to the relative dynamics *before* it shows up as a line-of-sight rate at all, rather than reacting to it after the fact. That distinction has a real cost: APN needs an estimate of $\mathbf{a}_T$, which plain PN never required, so it trades a purely relative-state measurement for a target-acceleration estimate that must come from somewhere — tracking the target's recent trajectory, a separate observation of its thruster firing, or an assumed worst case.

::: example Sizing the APN feedforward
A target vehicle is observed executing a station-keeping burn with lateral acceleration $\mathbf{a}_T = (2.0,\ -4.0,\ 0)\,\mathrm{m/s^2}$, tracked by a chaser flying APN with $N=4$:

```python
import numpy as np
aT = np.array([2.0, -4.0, 0.0])
N = 4.0
print(0.5 * N * aT)
# [ 4. -8.  0.]
```

The feedforward alone adds $(4.0,\ -8.0,\ 0)\,\mathrm{m/s^2}$ on top of whatever the $NV_c\dot\lambda$ term is already commanding — often the larger of the two contributions during the maneuver itself, which is exactly why a plain-PN system watching the same target lags badly behind one running APN: plain PN has no way to represent "the target is accelerating" until that acceleration has already bent the line of sight, while APN cancels it directly.
:::

## Check yourself

::: check
Why does the minimum-energy derivation in this lesson constrain only the terminal position and leave the terminal velocity free, when the ZEM/ZEV landing law two lessons ahead constrains both?
:::

::: answer
Plain proportional navigation is answering "hit the target," which is a single terminal condition — zero relative position at $t_{go}=0$ — with no requirement on how fast the two are moving relative to each other at that instant. A soft landing additionally requires zero terminal *velocity*, since arriving at the right position at any nonzero speed is a crash rather than a landing. That second constraint changes the boundary value problem and, as the later derivation shows, changes the optimal gains from $3/t_{go}^2$ alone to the pair $6/t_{go}^2$ and $-2/t_{go}$.
:::

::: check
At an engagement snapshot with $\dot\lambda = 0.005\,\mathrm{rad/s}$ and $V_c = 150\,\mathrm{m/s}$, what is the commanded acceleration at $N=3$ and at $N=5$, and what is the ratio between them?
:::

::: answer
$a_c = NV_c\dot\lambda$ gives $3 \times 150 \times 0.005 = 2.25\,\mathrm{m/s^2}$ at $N=3$ and $5\times150\times0.005 = 3.75\,\mathrm{m/s^2}$ at $N=5$. The ratio is exactly $5/3 = 1.667$ — the same ratio as the navigation constants themselves, since both use the identical $V_c\dot\lambda$ and differ only in the multiplier.
:::

::: check
A late disturbance to $\dot\lambda$ appears with $5.0\,\mathrm{s}$ of flight remaining. By what factor has it decayed by the time $0.5\,\mathrm{s}$ remain, under $N=6$?
:::

::: answer
The decay is $(t_{go}/t_{go,0})^{N-2} = (0.5/5.0)^{6-2} = 0.1^4 = 0.0001$ — the disturbance survives at only $0.01\%$ of its original size, four orders of magnitude of suppression, which is the same mechanism (and the same formula) as the $N=3$-to-$5$ comparison worked out above, extended to a larger $N$.
:::

::: check
Why is APN's extra term proportional to $N$ as well as to $\mathbf{a}_T$, rather than being a fixed correction independent of the navigation constant?
:::

::: answer
Because it falls out of exactly the same optimization that produced the $NV_c\dot\lambda$ term — both pieces of the command came from the single costate $c_1$ in the Pontryagin derivation, and $c_1$ picked up a contribution from $\mathbf{a}_T$ in the same algebraic step that fixed the $3/t_{go}^2$ (generalized to $N$) coefficient on $ZEM$. There is no separate, independently-chosen "target compensation gain" to tune; the feedforward's size is locked to $N$ by the same derivation that produced the base law, which is exactly why it is called *augmented* proportional navigation rather than a different guidance law bolted alongside PN.
:::

::: check
A plain-PN system and an APN system, both flying $N=4$ against the same maneuvering target, are compared. Plain PN's miss distance is worse. Is this evidence that $N=4$ was the wrong choice for the plain-PN system?
:::

::: answer
No — the two systems differ in guidance law, not in navigation constant, and the comparison says nothing about whether $4$ is well-chosen. Plain PN has no mechanism to represent the target's acceleration at all; it can only react to the line-of-sight rate that acceleration eventually produces, one derivative removed and one step late. Raising plain PN's own $N$ would help somewhat, for exactly the late-disturbance-suppression reason this lesson derived, but it cannot close the gap to APN, which cancels the target's contribution directly rather than reacting to its consequences after the fact. The fix for plain PN's disadvantage here is the feedforward term, not a different $N$.
:::

## Summary

| Quantity | Statement |
| --- | --- |
| Minimum-energy result | $\min\int u^2\,d\tau$ s.t. zero terminal miss, free terminal velocity $\Rightarrow$ $N=3$ exactly |
| Cost of larger $N$ | $a_c = NV_c\dot\lambda$: peak acceleration scales linearly with $N$ |
| Benefit of larger $N$ | A disturbance to $\dot\lambda$ with $t_{go,0}$ remaining decays by $(t_{go}/t_{go,0})^{N-2}$ — orders of magnitude more suppression per unit of $N$ |
| Practical range | $N = 3$–$5$: enough margin above the minimum-energy value for lag, noise and late maneuver; not so much that peak acceleration or noise amplification dominates |
| Augmented PN | $\mathbf{a}_c = NV_c\dot{\boldsymbol\lambda} + \tfrac{N}{2}\mathbf{a}_T$ — the exact minimum-energy feedforward against a known target acceleration |

$N=3$ was derived here from a specific, narrow optimization — miss only, energy only. The next lesson asks what changes about pure and true proportional navigation, before a later lesson widens the optimization itself into the general linear-quadratic formulation this derivation previewed.
