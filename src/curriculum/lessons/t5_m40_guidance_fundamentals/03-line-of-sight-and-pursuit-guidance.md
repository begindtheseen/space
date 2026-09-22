---
id: l03-line-of-sight-and-pursuit-guidance
title: Line-of-sight and pursuit guidance
minutes: 20
covers:
  - Line-of-sight guidance and pursuit guidance
---

Before deriving the guidance law this module is built around, it is worth understanding the two older, simpler ideas it replaces — because both are still exactly right for some jobs, both are the natural first thing anyone invents, and both fail in a specific, derivable way that motivates everything that follows. Pursuit guidance says: point at the target and close. Line-of-sight guidance says: stay on a specified line to the target. Neither asks the question proportional navigation asks in the next lesson, and seeing precisely what each one *does* ask is what makes the next lesson's answer feel inevitable rather than clever.

Both ideas are entirely natural in spacecraft operations, not only missile history. A chaser without a sophisticated guidance computer, closing on a slowly drifting free-flyer for a grapple, can point its velocity at the target and burn — pursuit guidance. A crewed or robotic approach flown along a mission-designed corridor, the V-bar or R-bar line extending from the target along its orbital velocity or toward the planet, is flown by nulling deviation from that line — a spacecraft's version of line-of-sight guidance. Working out exactly where each one struggles is this lesson's job.

## Pursuit guidance

Pure pursuit commands the pursuer's heading $\chi(t)$ to equal the line-of-sight angle $\lambda(t)$ at every instant: steer directly at the target's current position, not its predicted one. That single rule has an immediate consequence worth naming precisely. Since $\chi(t) = \lambda(t)$ identically, their rates are identical too — $\dot\chi = \dot\lambda$ — so the pursuer's own turn rate *is* the line-of-sight rate, and at constant pursuer speed $V_p$ the lateral acceleration needed to sustain that turn is

$$
a_{lat} = V_p\,\dot\lambda .
$$

This is worth sitting with, because its form will reappear, essentially unchanged, as the heart of proportional navigation. What decides whether pursuit is a good law or a bad one is entirely in how $\dot\lambda$ behaves — and $\dot\lambda$ is fixed by geometry, not by anything pursuit chooses. For a target and pursuer with relative velocity $\mathbf{v}_{rel}$ at range $R$, the exact kinematic identity (derived in full in the next lesson) is

$$
\dot\lambda = \frac{v_{rel,\perp}}{R},
$$

the *transverse* component of relative velocity divided by range. If the target has any velocity component that is not exactly radial to the pursuer — any genuine crossing motion at all — $v_{rel,\perp}$ does not vanish, and as $R \to 0$ near intercept, $\dot\lambda$ grows without bound. Pure pursuit inherits that growth directly through $a_{lat} = V_p\dot\lambda$: the closer it gets to a crossing target, the harder it has to turn, right up to the point where no real actuator can keep up.

::: example Two targets, two very different turns
A chaser at the origin flies pure pursuit at constant speed $V_p = 1.5\,\mathrm{m/s}$.

**Stationary target.** A target holding position at $(1500,\ -300,\ 0)\,\mathrm{m}$ presents nothing to turn toward — the line of sight from the origin to a fixed point never rotates, so pure pursuit flies a dead-straight line to it:

```python
import numpy as np
from scipy.integrate import solve_ivp
rT0 = np.array([1500.0, -300.0, 0.0]); Vp = 1.5
def rhs(t, rP):
    rel = rT0 - rP
    return Vp * rel / np.linalg.norm(rel)
sol = solve_ivp(rhs, [0, 1017], [0.0,0.0,0.0], max_step=0.05, dense_output=True)
h0 = np.degrees(np.arctan2(*(rT0 - sol.y[:,0])[1::-1]))
h1 = np.degrees(np.arctan2(*(rT0 - sol.y[:,-1])[1::-1]))
print(h0, h1)
# -11.309932474020215 -11.309932474021585
```

The heading at the start and at the end of the intercept agree to eleven decimal places — a straight line, exactly as the theory predicts when $v_{rel,\perp} \equiv 0$.

**Drifting target.** A target at $(2000,\ 500,\ 0)\,\mathrm{m}$ drifting at $\mathbf{v}_T = (-0.6,\ 0.2,\ 0)\,\mathrm{m/s}$ — a modest residual velocity, the kind a free-flyer might carry after a failed capture attempt — presents genuine crossing motion. Integrating pure pursuit to intercept and sampling $\dot\lambda$ and $a_{lat} = V_p\dot\lambda$ along the way:

| Range $R$ | $\dot\lambda$ | $a_{lat} = V_p\dot\lambda$ |
| --- | --- | --- |
| $2061.6\,\mathrm{m}$ | $1.65\times10^{-4}\,\mathrm{rad/s}$ | $2.47\times10^{-4}\,\mathrm{m/s^2}$ |
| $983.5\,\mathrm{m}$ | $4.17\times10^{-4}\,\mathrm{rad/s}$ | $6.25\times10^{-4}\,\mathrm{m/s^2}$ |
| $360.1\,\mathrm{m}$ | $1.42\times10^{-3}\,\mathrm{rad/s}$ | $2.13\times10^{-3}\,\mathrm{m/s^2}$ |
| $165.5\,\mathrm{m}$ | $3.54\times10^{-3}\,\mathrm{rad/s}$ | $5.30\times10^{-3}\,\mathrm{m/s^2}$ |
| $76.2\,\mathrm{m}$ | $8.25\times10^{-3}\,\mathrm{rad/s}$ | $1.24\times10^{-2}\,\mathrm{m/s^2}$ |
| $16.3\,\mathrm{m}$ | $3.24\times10^{-2}\,\mathrm{rad/s}$ | $4.86\times10^{-2}\,\mathrm{m/s^2}$ |

Range shrinks by a factor of $2061.6/16.3 \approx 127$ across this table; the commanded lateral acceleration grows by a factor of $0.0486/0.000247 \approx 197$ — *faster* than the simple $1/R$ the identity above suggests, because the pursuer's own heading is itself sweeping around faster and faster as it is forced to keep chasing an increasingly fast-moving bearing, which further increases $v_{rel,\perp}$ on top of the shrinking $R$. Both numbers were cross-checked against the exact vector identity $\dot\lambda = (\mathbf{r}_{rel}\times\mathbf{v}_{rel})/(\mathbf{r}_{rel}\cdot\mathbf{r}_{rel})$ the next lesson derives in full, and agree with the values above to six significant figures.
:::

That growth is not a simulation artifact or a bad choice of numbers — it is the defining pathology of pure pursuit, sometimes called the "curve of pursuit," and it appears the moment a target has any crossing velocity at all. A fixed lead angle added to the pursuit law (deviated pursuit, $\chi = \lambda + \text{const}$) softens the effect for one specific engagement geometry but does not remove it for a general one, because the underlying cause — heading is *slaved* to the instantaneous line of sight, with no separate parameter to tune the response — is untouched.

## Line-of-sight guidance

Line-of-sight guidance asks a different question: not "am I pointed at the target," but "am I *on* a specified reference line." In its classical form — command guidance, or beam-riding — a third point, typically a ground radar or a tracking beam, defines the reference line to the target, and the pursuer is steered to null its perpendicular distance from that line, wherever the line itself currently points.

Spacecraft rendezvous has a direct structural analogue with no beam involved at all: flying a specified approach corridor. A V-bar approach holds the chaser on the line through the target parallel to its orbital velocity; an R-bar approach holds it on the line through the target along the local vertical. Either way, mission design specifies the line in advance, and guidance's job in flight is to null the *cross-track deviation* $y$ from it — exactly the reference-trajectory-following idea of the last lesson, specialized to a reference that is a single straight line rather than a full state history, so the same linear feedback form applies:

$$
a_{\perp} = -k_1 y - k_2 \dot y .
$$

::: example Nulling a cross-track drift on a V-bar approach
A chaser is $y_0 = 8\,\mathrm{m}$ off the V-bar line, drifting further off at $\dot y_0 = 0.02\,\mathrm{m/s}$. Choose critically damped gains ($\zeta = 1$) with natural frequency $\omega_n = 0.02\,\mathrm{rad/s}$ — slow enough not to fight the approach's own along-track closure, fast enough to be settled well before contact:

$$
k_1 = \omega_n^2 = 4.00\times10^{-4}\,\mathrm{s^{-2}}, \qquad k_2 = 2\zeta\omega_n = 0.0400\,\mathrm{s^{-1}}.
$$

```python
from scipy.integrate import solve_ivp
k1, k2 = 4e-4, 0.04
def rhs(t, s):
    y, ydot = s
    return [ydot, -k1*y - k2*ydot]
sol = solve_ivp(rhs, [0, 600], [8.0, 0.02], max_step=0.1, rtol=1e-11, atol=1e-13)
print(sol.y[0, -1], sol.y[1, -1])
# 0.0007086... -1.297e-05...
```

| $t$ | $y$ | $\dot y$ |
| --- | --- | --- |
| $60\,\mathrm{s}$ | $5.663\,\mathrm{m}$ | $-0.0590\,\mathrm{m/s}$ |
| $150\,\mathrm{s}$ | $1.743\,\mathrm{m}$ | $-0.0259\,\mathrm{m/s}$ |
| $300\,\mathrm{s}$ | $0.154\,\mathrm{m}$ | $-0.0026\,\mathrm{m/s}$ |
| $600\,\mathrm{s}$ | $0.0007\,\mathrm{m}$ | $-0.00001\,\mathrm{m/s}$ |

No overshoot at any point — critical damping was chosen precisely so the chaser never crosses back through the corridor centerline on its way to nulling the offset — and the deviation is inside a millimetre by the ten-minute mark, from an eight-metre start.
:::

The corridor-following case makes the connection to the last lesson explicit: line-of-sight guidance is a form of reference-trajectory following, with the reference degenerated to a line instead of a full trajectory. That is also exactly its limitation. It needs the reference line itself to be right — chosen by mission design or supplied by an external tracker — and it says nothing about the geometry of an actual intercept: nulling deviation from a line does not, by itself, drive the range to a moving target to zero on any particular schedule, which is why classical beam-riding needed the target roughly stationary relative to the beam's own aim, and why spacecraft corridor-following works because the approach's along-track closure is planned and controlled separately from the cross-track nulling shown here.

::: key Two ideas, two different failure modes
Pursuit guidance: $\chi = \lambda$, giving $a_{lat} = V_p\dot\lambda$ — simple, needs only a bearing to the target, but $\dot\lambda \to \infty$ near intercept against any target with crossing velocity, demanding unbounded lateral acceleration exactly when the least is available. Line-of-sight guidance: null the perpendicular deviation from a reference line supplied by a third point or by mission design — well-behaved and exactly a reference-following problem, but only as good as that external reference and silent on the intercept geometry itself.
:::

::: warning Pursuit's formula looks like the answer; it is not, yet
$a_{lat} = V_p\dot\lambda$ has exactly the shape of the guidance law the next lesson derives, and that is not a coincidence — but two things are wrong with it as it stands. It uses the pursuer's own speed $V_p$ where the right quantity turns out to be the closing velocity $V_c$, which behaves very differently as intercept approaches; and it has no free parameter at all, so there is nothing to tune for robustness against noise, lag or a maneuvering target. Recognizing the shape is the useful part of studying pursuit. Trusting the formula as written is the mistake.
:::

::: note Deviated pursuit is a patch, not a fix
Adding a fixed lead angle, $\chi = \lambda + \delta$, chosen to match one particular target speed and crossing angle, removes the turn-rate problem for exactly that engagement and reintroduces it for any other — a maneuvering target, or even the same target on a different day at a different approach angle, defeats a fixed $\delta$ immediately. It is worth knowing this exists mainly because it explains why the real fix, in the next lesson, is not a better fixed angle but a rate-proportional law with a tunable gain.
:::

## Check yourself

::: check
Why does $\dot\chi = \dot\lambda$ hold identically under pure pursuit, and what does that identity have to do with the commanded lateral acceleration?
:::

::: answer
Pure pursuit is *defined* by $\chi(t) = \lambda(t)$ — the heading is set equal to the line-of-sight angle at every instant, by construction, not as a consequence of the dynamics. Differentiating an identity preserves it, so $\dot\chi = \dot\lambda$ follows immediately, with no geometry required beyond the definition itself. Since sustaining a turn rate $\dot\chi$ at constant speed $V_p$ needs a centripetal acceleration $V_p\dot\chi$, and $\dot\chi = \dot\lambda$, the commanded lateral acceleration is exactly $V_p\dot\lambda$ — pursuit's entire behavior, good and bad, is inherited directly from whatever $\dot\lambda$ happens to be doing.
:::

::: check
At some instant a pursuer flying pure pursuit at $V_p = 1.2\,\mathrm{m/s}$ measures a line-of-sight rate of $\dot\lambda = 0.008\,\mathrm{rad/s}$. What lateral acceleration is it commanding at that instant?
:::

::: answer
$a_{lat} = V_p\dot\lambda = 1.2 \times 0.008 = 0.0096\,\mathrm{m/s^2}$, directly from the identity derived above. Nothing else about the engagement is needed — under pure pursuit, the current line-of-sight rate and speed alone fix the command.
:::

::: check
Why did the stationary-target case in the worked example produce a perfectly straight-line path, while the drifting-target case did not?
:::

::: answer
$\dot\lambda$ is the transverse component of the relative velocity divided by range. Against a stationary target, the target's own velocity is zero and the pursuer's velocity under pure pursuit is, by definition, always directed exactly along the current line of sight — so the relative velocity is purely radial, its transverse component is identically zero, and $\dot\lambda \equiv 0$: the line of sight never rotates, and a heading that never has to change traces a straight line. A drifting target has velocity that is not purely radial to a moving pursuer, so the transverse component of relative velocity is generally nonzero, $\dot\lambda \ne 0$, and the pursuer's heading — locked to $\lambda$ by pure pursuit's own definition — must continuously turn to follow it.
:::

::: check
A cross-track deviation from an approach corridor starts at $y_0 = 5\,\mathrm{m}$, $\dot y_0 = -0.01\,\mathrm{m/s}$ (already closing), nulled with critically-damped gains $\omega_n = 0.03\,\mathrm{rad/s}$. What are $y$ and $\dot y$ at $t = 200\,\mathrm{s}$?
:::

::: answer
With $k_1 = \omega_n^2 = 9\times10^{-4}\,\mathrm{s^{-2}}$ and $k_2 = 2\omega_n = 0.06\,\mathrm{s^{-1}}$, integrating $\ddot y = -k_1 y - k_2\dot y$ from $(y_0,\dot y_0)$ for $200\,\mathrm{s}$ gives $y(200) = 0.0818\,\mathrm{m}$, $\dot y(200) = -0.00211\,\mathrm{m/s}$ — the five-metre offset has collapsed to under $10\,\mathrm{cm}$, still closing gently rather than having overshot, which is exactly what critical damping guarantees.
:::

::: check
In what precise sense is flying a V-bar approach corridor an instance of the reference-trajectory following idea from the last lesson, rather than something new?
:::

::: answer
Reference-trajectory following measures a deviation from a precomputed reference and feeds it back through a gain, $\mathbf{u} = \mathbf{u}^\star + \mathbf{K}(t)(\mathbf{x}^\star - \hat{\mathbf{x}})$. Corridor-following is exactly this with the reference degenerated from a full state history $\mathbf{x}^\star(t)$ to a single fixed line in space, and the fed-back quantity narrowed from the full state deviation to only the perpendicular offset from that line, $a_\perp = -k_1 y - k_2\dot y$. It inherits the same strength — a fixed, inspectable reference with an ordinary linear feedback's well-understood margins — and the same weakness: the law has nothing to say about anything the reference line does not encode, such as the along-track closure schedule, which corridor-following approaches always manage separately from the cross-track nulling shown here.
:::

## Summary

| Concept | Statement |
| --- | --- |
| Pure pursuit | $\chi = \lambda$; hence $\dot\chi = \dot\lambda$ and $a_{lat} = V_p\dot\lambda$ |
| Pursuit's failure mode | $\dot\lambda \to \infty$ as $R \to 0$ whenever the target has nonzero crossing (transverse relative) velocity |
| Deviated pursuit | $\chi = \lambda + \delta$, a fixed-angle patch valid for one engagement geometry only |
| Line-of-sight / beam-rider guidance | Null perpendicular deviation $y$ from a reference line set by a third point or by mission design: $a_\perp = -k_1 y - k_2\dot y$ |
| Spacecraft corridor-following | V-bar/R-bar approach; a special case of reference-trajectory following with the reference reduced to a line |
| $\dot\lambda$ identity (previewed) | $\dot\lambda = v_{rel,\perp}/R$, the transverse relative velocity over range |

Both ideas point at the same missing ingredient: a law shaped like $a_{lat} = V_p\dot\lambda$, but with the pursuer's own speed replaced by something better behaved, and with a free gain to tune. The next lesson derives exactly that law — proportional navigation.
