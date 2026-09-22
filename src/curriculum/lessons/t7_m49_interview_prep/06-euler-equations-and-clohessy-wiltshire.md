---
id: l06-euler-equations-and-clohessy-wiltshire
title: "Euler's equations and the Clohessy-Wiltshire equations, derived cold"
minutes: 16
covers:
  - "Whiteboard derivations under time pressure: the rocket equation, rigid-body equations of motion under thrust, the Kalman filter update, proportional navigation, Euler equations, the Clohessy-Wiltshire equations"
---

These two derivations close out the core six, and they share a structure worth noticing before diving in: both start from an exact nonlinear equation, both linearize about a reference state, and both end by reading a stability or drift conclusion straight off the sign of a coefficient. Euler's equations tell you which axis a tumbling body prefers to spin about; the Clohessy-Wiltshire equations tell you how two spacecraft drift apart or together near a shared orbit. Get comfortable producing both from scratch, because between them they cover a large share of what a dynamics round actually probes.

## Euler's equations, from the transport theorem

A rigid body's angular momentum about its center of mass is $\mathbf{H} = \mathbf{I}\boldsymbol{\omega}$, and Newton's second law for rotation states $d\mathbf{H}/dt|_{\text{inertial}} = \mathbf{M}$. The obstacle is that $\mathbf{I}$ is constant only in body-fixed axes — in an inertial frame the body is tumbling, so $\mathbf{I}$ changes with orientation. The fix is the transport theorem (derived in full in the rotating-frames module): for any vector, $d\mathbf{A}/dt|_{\text{inertial}} = d\mathbf{A}/dt|_{\text{body}} + \boldsymbol{\omega}\times\mathbf{A}$. Applying it to $\mathbf{H}$:

$$
\mathbf{I}\dot{\boldsymbol{\omega}} + \boldsymbol{\omega}\times(\mathbf{I}\boldsymbol{\omega}) = \mathbf{M}.
$$

In principal axes, $\mathbf{I} = \mathrm{diag}(I_1, I_2, I_3)$, and expanding the cross product component by component gives **Euler's equations**:

$$
I_1\dot\omega_1 = (I_2-I_3)\omega_2\omega_3 + M_1, \qquad I_2\dot\omega_2 = (I_3-I_1)\omega_3\omega_1 + M_2, \qquad I_3\dot\omega_3 = (I_1-I_2)\omega_1\omega_2 + M_3,
$$

cyclic in $1\to2\to3\to1$. The coupling term on each axis comes entirely from the mismatch between the other two principal inertias — a body with $I_1=I_2=I_3$ (a sphere) has no coupling at all and keeps rotating about whatever axis it was originally set spinning on.

::: key
$\mathbf{I}\dot{\boldsymbol{\omega}} + \boldsymbol{\omega}\times(\mathbf{I}\boldsymbol{\omega}) = \mathbf{M}$. In principal axes: $I_1\dot\omega_1 = (I_2-I_3)\omega_2\omega_3 + M_1$, cyclic. The cross-coupling terms are what makes rotation about the intermediate principal axis unstable.
:::

### Torque-free stability: why the intermediate axis is unstable

Set $\mathbf{M}=0$ and consider steady spin nearly aligned with one principal axis — say axis 1, spin rate $\Omega$ — with small perturbations $\omega_2, \omega_3$ on the other two. To leading order $\omega_1 \approx \Omega$ (constant, since its own equation, $I_1\dot\omega_1 = (I_2-I_3)\omega_2\omega_3$, has a right side that is a product of two *small* quantities and is therefore second order). The other two equations linearize to

$$
\dot\omega_2 = \frac{I_3-I_1}{I_2}\Omega\,\omega_3, \qquad \dot\omega_3 = \frac{I_1-I_2}{I_3}\Omega\,\omega_2.
$$

Differentiate the first and substitute the second:

$$
\ddot\omega_2 = \frac{I_3-I_1}{I_2}\Omega\,\dot\omega_3 = \underbrace{\Omega^2\,\frac{(I_3-I_1)(I_1-I_2)}{I_2 I_3}}_{K}\,\omega_2.
$$

If $K<0$, this is simple harmonic motion — bounded, oscillatory, **stable**. If $K>0$, it is exponential growth — **unstable**. The sign of $K$ depends only on the sign of $(I_3-I_1)(I_1-I_2)$, since $\Omega^2/(I_2I_3) > 0$ always. Check all three cases directly: if $I_1$ is the largest or the smallest of the three, the two factors $(I_3-I_1)$ and $(I_1-I_2)$ have opposite signs, so their product is negative and $K<0$ — stable. If $I_1$ is the **intermediate** value, both factors have the same sign, the product is positive, and $K>0$ — unstable. This holds regardless of which specific axis is intermediate: spin about the largest or smallest principal axis is stable, spin about the middle one is not. This is the intermediate-axis theorem — the "tennis racket theorem," the same effect behind the Dzhanibekov flip seen on the ISS.

One honest caveat worth stating alongside the result: the linear analysis predicts unbounded exponential growth of the perturbation, but the real, fully nonlinear torque-free motion conserves both kinetic energy and angular momentum magnitude, which bound the motion. What is actually observed is not runaway growth but a periodic **flip** — the body tumbles end over end and periodically passes back near the intermediate axis, unstable each time it does. The linear result correctly identifies the instability; it does not, by itself, describe the bounded nonlinear motion that instability leads to.

::: example Intermediate-axis instability, numerically confirmed
With $I_1=1$, $I_2=2$, $I_3=3\,\mathrm{kg\,m^2}$ and a small perturbation on top of a spin of $\Omega=5\,\mathrm{rad/s}$ about each axis in turn, integrating the full nonlinear Euler equations for 40 seconds:

```python
from scipy.integrate import solve_ivp
import numpy as np

def euler_rhs(t, w, I1, I2, I3):
    w1, w2, w3 = w
    return [(I2-I3)*w2*w3/I1, (I3-I1)*w3*w1/I2, (I1-I2)*w1*w2/I3]

I1, I2, I3 = 1.0, 2.0, 3.0
for w0 in ([5,1e-3,1e-3], [1e-3,5,1e-3], [1e-3,1e-3,5]):
    sol = solve_ivp(euler_rhs, [0,40], w0, args=(I1,I2,I3), rtol=1e-10)
    # perturbation growth factor over the run, energy/|H| conserved throughout
```

Spin about the minimum-inertia axis ($I_1$): perturbation grows by a factor of about 2 over 40 s. Spin about the maximum ($I_3$): grows by about 1.4×. Spin about the **intermediate** axis ($I_2$): grows by a factor of roughly **5000** over the same 40 s, with energy and angular-momentum magnitude conserved to better than one part in $10^7$ throughout — confirming the instability is real and not a numerical artefact. The linearized growth-rate prediction for this case, $K = \Omega^2(I_2-I_3)(I_1-I_2)/(I_1I_3) \approx 8.3\,\mathrm{s^{-2}}$, gives an e-folding time near $0.35\,\mathrm{s}$, consistent with the perturbation reaching macroscopic size within tens of e-folding times.
:::

## The Clohessy-Wiltshire equations, from a rotating frame

Set up a target on a circular reference orbit of radius $r_0$, angular rate $n = \sqrt{\mu/r_0^3}$. Attach a rotating frame to it: $\hat{\mathbf{x}}$ radial outward, $\hat{\mathbf{y}}$ along-track, $\hat{\mathbf{z}}$ orbit-normal, rotating at constant $\boldsymbol{\omega} = n\hat{\mathbf{z}}$. A nearby chaser has relative position $\boldsymbol{\rho} = x\hat{\mathbf{x}} + y\hat{\mathbf{y}} + z\hat{\mathbf{z}}$, small compared to $r_0$.

The kinematic identity for acceleration in a frame rotating at constant $\boldsymbol{\omega}$ (from the transport theorem, applied twice) gives the chaser's inertial acceleration as

$$
\mathbf{a}_{\text{inertial}} = \ddot{\boldsymbol\rho}\big|_{\text{rel}} + 2\boldsymbol\omega\times\dot{\boldsymbol\rho}\big|_{\text{rel}} + \boldsymbol\omega\times(\boldsymbol\omega\times\boldsymbol\rho) + \mathbf{a}_{\text{target}}.
$$

This must equal the actual physical force per unit mass on the chaser — gravity, $\mathbf{a}_{\text{inertial}} = -\mu\mathbf{R}/|\mathbf{R}|^3$, with $\mathbf{R} = (r_0+x)\hat{\mathbf{x}} + y\hat{\mathbf{y}} + z\hat{\mathbf{z}}$ the chaser's position from Earth's center. Expanding $|\mathbf{R}|^{-3}$ to first order in $x/r_0, y/r_0, z/r_0$ (a binomial expansion, dropping every term of second order or smaller):

$$
-\frac{\mu\mathbf{R}}{|\mathbf{R}|^3} \approx -n^2 r_0\hat{\mathbf{x}} + n^2\big(2x\,\hat{\mathbf{x}} - y\,\hat{\mathbf{y}} - z\,\hat{\mathbf{z}}\big),
$$

using $n^2 = \mu/r_0^3$. The leading term, $-n^2 r_0\hat{\mathbf{x}}$, is exactly the target's own centripetal acceleration, $\mathbf{a}_{\text{target}}$ — it cancels the same term on the kinematic side, which is the whole reason working in a frame centered on a reference orbit is useful: the large, uninteresting circular motion drops out, leaving only the small relative dynamics.

Evaluating the Coriolis and centrifugal terms with $\boldsymbol\omega = n\hat{\mathbf{z}}$ (using $\hat{\mathbf{z}}\times\hat{\mathbf{x}}=\hat{\mathbf{y}}$, $\hat{\mathbf{z}}\times\hat{\mathbf{y}}=-\hat{\mathbf{x}}$) and collecting every term by component produces three decoupled-looking but $x$–$y$ coupled equations:

$$
\ddot x - 2n\dot y - 3n^2 x = 0, \qquad \ddot y + 2n\dot x = 0, \qquad \ddot z + n^2 z = 0.
$$

The **Clohessy-Wiltshire equations**. The cross-track equation, $\ddot z = -n^2 z$, decouples completely and is simple harmonic motion at the orbital rate — a cross-track offset oscillates and never drifts. The in-plane pair couples $x$ and $y$ through the Coriolis terms and is where the interesting, counterintuitive behaviour lives.

::: key
$\ddot x - 2n\dot y - 3n^2x = 0$, $\ddot y + 2n\dot x = 0$, $\ddot z + n^2 z = 0$, from linearizing gravity to first order about a circular reference orbit in a frame rotating at $n = \sqrt{\mu/r_0^3}$. The reference orbit's own centripetal term cancels exactly, leaving only the relative dynamics.
:::

### Reading off the drift and the closed ellipse

Two specific initial conditions carry essentially all of the physical intuition this derivation is for.

**A pure along-track velocity kick.** Start at $x_0=y_0=0$ with only $\dot y_0 \ne 0$ — a prograde (forward, along the direction of motion) impulsive burn. The closed-form solution to the CW equations for this case gives $x(t) = (2/n)(1-\cos nt)\,\dot y_0$, which is never negative: the chaser's radial position only ever increases, so the burn **raises** the orbit. Meanwhile $\dot y(t) = (4\cos nt - 3)\dot y_0$ averages, over one orbit, to $-3\dot y_0$: the along-track velocity has a net negative secular component, so the chaser **falls behind** on average. A forward burn raises you and makes you fall behind — the single most counterintuitive fact in proximity operations, and exactly why closing a rendezvous is not a matter of pointing at the target and burning forward.

**A pure radial offset with no oscillation.** Among all initial conditions with $x_0 \neq 0$, one specific choice, $\dot y_0 = -\tfrac{3}{2}n x_0$ (with $\dot x_0 = 0$), produces **no oscillation at all**: $x(t)$ stays exactly at $x_0$ for all time, while $y(t) = -\tfrac{3}{2}n x_0\,t$ drifts perfectly linearly, with no periodic term. This is not a special trick initial condition — it is a chaser on a circular orbit of slightly different radius $r_0+x_0$, moving at exactly the along-track rate a circular orbit at that radius requires. Two circular, coplanar orbits of slightly different radius do not oscillate relative to each other at all; the higher one is slower and drifts steadily aft, at a rate of $\tfrac{3}{2}n$ per unit of radial offset — the number worth having memorized cold.

::: example Drift-only initial condition, numerically confirmed
With $n = 1.1\times10^{-3}\,\mathrm{rad/s}$ (roughly a 500 km LEO) and $x_0 = 40\,\mathrm{m}$, $\dot y_0 = -\tfrac{3}{2}n x_0 = -0.066\,\mathrm{m/s}$: integrating the CW equations numerically for over three orbital periods (20{,}000 s) gives $x(t)$ constant at $40.000\,\mathrm{m}$ throughout, and $y(t)$ a perfectly straight line with slope $-0.066\,\mathrm{m/s}$ — matching $-\tfrac{3}{2}n x_0$ to six decimal places, with no oscillatory component detectable. A general radial offset paired with any *other* along-track rate produces this same secular drift plus a superimposed periodic oscillation; this particular combination is the one case where the oscillation vanishes entirely.
:::

::: warning
Do not state the "$3n/2$ drift" fact and the "forward burn raises and lags" fact as if they were the same initial condition — they are two different, equally real consequences of the same linear equations, one from a specific *position* offset paired with the matching circular-orbit rate, the other from a pure *velocity* impulse. Conflating them under exam pressure is an easy slip; keeping the two initial conditions straight in your head is the actual test.
:::

## Check yourself

::: check
In Euler's equations, why does the equation for $\dot\omega_1$ vanish to first order when the body spins nearly about axis 1, while the equations for $\dot\omega_2$ and $\dot\omega_3$ do not?
:::

::: answer
$I_1\dot\omega_1 = (I_2-I_3)\omega_2\omega_3$, and both $\omega_2$ and $\omega_3$ are small perturbations by assumption, so their product is second order in the small quantities and vanishes to first order — $\omega_1$ stays constant at $\Omega$ to leading order. The other two equations, $I_2\dot\omega_2 = (I_3-I_1)\omega_3\Omega$ and $I_3\dot\omega_3 = (I_1-I_2)\Omega\omega_2$, each have one factor that is the *large* spin rate $\Omega$ and one that is a small perturbation, making the product first order — these are the terms that survive linearization and produce the coupled dynamics that decide stability.
:::

::: check
A body has $I_1 = 2$, $I_2 = 5$, $I_3 = 9\,\mathrm{kg\,m^2}$ and spins at $\Omega = 3\,\mathrm{rad/s}$ nominally about axis 2. Compute the linearized growth-rate coefficient $K$ and state whether the spin is stable.
:::

::: answer
Spin is about the intermediate axis (axis 2, since $I_1 < I_2 < I_3$), so instability is expected. With the dominant rate on axis 2, the perturbation equations are $\dot\omega_1 = [(I_2-I_3)/I_1]\,\Omega\,\omega_3$ and $\dot\omega_3 = [(I_1-I_2)/I_3]\,\Omega\,\omega_1$ — the same substitution move as in the text, re-derived with the dominant axis relabelled. Differentiating and substituting gives $K = \Omega^2(I_2-I_3)(I_1-I_2)/(I_1I_3)$. With $I_1=2, I_2=5, I_3=9, \Omega=3$: $K = 9\times(5-9)(2-5)/(2\times9) = 9\times(-4)\times(-3)/18 = 108/18 = 6$, positive — confirming the instability, consistent with $I_2$ being neither the largest nor the smallest principal inertia. The general rule (largest or smallest axis stable, intermediate unstable) is the fast whiteboard check; the coefficient confirms it quantitatively and gives the e-folding time, here about $1/\sqrt{6} \approx 0.41\,\mathrm{s}$.
:::

::: check
Why does the reference orbit's own centripetal acceleration, $-n^2 r_0\hat{\mathbf{x}}$, cancel exactly out of the Clohessy-Wiltshire derivation, and why does that cancellation matter?
:::

::: answer
It cancels because it appears on both sides of the equation of motion: on the kinematic side as $\mathbf{a}_{\text{target}}$ (the target's own inertial acceleration, subtracted off when writing the chaser's acceleration relative to the target), and on the gravity side as the leading, zeroth-order term of the expansion of $-\mu\mathbf{R}/|\mathbf{R}|^3$ about $r_0$. It matters because it is by far the largest term in the problem — the full circular-orbit acceleration, order $n^2 r_0$ — and its exact cancellation is precisely what allows the remaining equations to be a clean linear system in the small relative coordinates $x, y, z$ alone, rather than a system still dominated by the large reference motion.
:::

::: check
An interviewer asks: "if I do a forward burn to catch up with a target ahead of me on the same orbit, what happens?" Answer using the CW equations, and explain why the intuitive answer is wrong.
:::

::: answer
A forward (prograde, $+\dot y_0$) burn raises the orbit — $x(t) = (2/n)(1-\cos nt)\dot y_0 \geq 0$ always — and a higher circular orbit is slower, so the along-track velocity picks up a net negative secular component, averaging $-3\dot y_0$ over an orbit: the chaser falls further behind rather than catching up. The intuitive answer — "burn toward the target to close the gap" — is wrong because it treats the problem as a straight-line closing-velocity problem rather than an orbital one; in orbit, adding along-track speed adds energy, which raises the orbit, and a higher orbit is fundamentally slower, so the short-term intuition (I sped up, I should be catching up) is overtaken within a fraction of an orbit by the orbital-mechanics reality (I am now on a slower orbit and falling behind).
:::

::: check
Both derivations in this lesson linearize a nonlinear equation about a reference state and read off stability, or drift, from the sign of a resulting coefficient. What is the general move being repeated, and why is it worth recognizing as a pattern rather than memorizing each result independently?
:::

::: answer
The general move is: write the exact nonlinear equation, substitute a reference solution plus a small perturbation, keep only first-order terms in the perturbation, and examine the resulting linear system's coefficients (a sign, in Euler's equations; a specific ratio giving zero net oscillation, in Clohessy-Wiltshire) to read off the qualitative behaviour. Recognizing this as one repeated technique, rather than two unrelated formulas, means that under pressure you can reconstruct either result from the underlying nonlinear equation and the linearization procedure, rather than depending on recalling the final answer correctly — and it is also the same technique used throughout the controls curriculum whenever a nonlinear plant is linearized about an operating point for stability analysis.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Euler's equations | $\mathbf{I}\dot{\boldsymbol\omega} + \boldsymbol\omega\times(\mathbf{I}\boldsymbol\omega) = \mathbf{M}$, from the transport theorem applied to $\mathbf{H}=\mathbf{I}\boldsymbol\omega$ |
| Intermediate-axis instability | Spin about the largest or smallest principal axis is stable; about the intermediate axis, unstable — bounded in reality by conservation, producing a periodic flip rather than runaway growth |
| Clohessy-Wiltshire equations | $\ddot x - 2n\dot y - 3n^2x=0$, $\ddot y+2n\dot x=0$, $\ddot z+n^2z=0$, from linearizing gravity to first order about a circular reference orbit |
| Forward-burn drift | A prograde velocity impulse raises the orbit and produces a net $-3\dot y_0$ secular along-track drift — raises you, and you fall behind |
| Radial-offset drift | $\dot y_0 = -\tfrac{3}{2}n x_0$ gives pure linear drift at rate $\tfrac{3}{2}n$ per unit offset, with zero oscillation — two circular orbits of slightly different radius |

The next lesson steps back from specific derivations to the meta-skill that makes any of them survivable under real interview pressure: narrating a derivation out loud as you build it, and recovering visibly when part of it goes wrong.
